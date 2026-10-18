import { parseIdea, toIssue } from './idea.js';
import { parseScore, addScore, limited } from './score.js';
import { verifyTurnstile } from './turnstile.js';

const ALLOWED_ORIGINS = ['https://svengoerdes.github.io'];
const IDEAS_PER_HOUR = 5;
const IDEAS_PER_DAY = 100; // all visitors together
const SCORES_PER_HOUR = 20;
const MAX_BODY = 4096;
const BOARD_KEY = 'top'; // one KV key holds the whole top list
const ideaHits = new Map(); // ip → timestamps
const scoreHits = new Map();

// Extra origins for local testing: env.DEV_ORIGINS="http://127.0.0.1:8774,..." (not set in wrangler.toml).
const allowedOrigins = (env) => [...ALLOWED_ORIGINS, ...(env.DEV_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)];

function cors(origin, env) {
  const allowed = allowedOrigins(env);
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const json = (data, status, headers) =>
  new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

const clientIp = (request) => request.headers.get('CF-Connecting-IP') || 'unknown';
const readBoard = async (env) => (await env.LEADERBOARD.get(BOARD_KEY, 'json')) || [];

// Checks type and size before parsing. Returns { body } or { res }.
async function readBody(request, headers) {
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
    return { res: json({ error: 'Nur JSON' }, 415, headers) };
  }
  const tooBig = { res: json({ error: 'Anfrage zu groß' }, 413, headers) };
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) return tooBig;
  const text = await request.text(); // chunked bodies have no Content-Length
  if (text.length > MAX_BODY) return tooBig;
  try { return { body: JSON.parse(text) }; } catch { return { res: json({ error: 'Ungültige Anfrage' }, 400, headers) }; }
}

// Counts ideas per day in KV (read-modify-write, may be off by a few under load). Without KV there is no cap.
async function dailyCapReached(env) {
  if (!env.LEADERBOARD) return false;
  const key = `ideas:${new Date().toISOString().slice(0, 10)}`;
  try {
    const count = Number(await env.LEADERBOARD.get(key)) || 0;
    if (count >= IDEAS_PER_DAY) return true;
    await env.LEADERBOARD.put(key, String(count + 1), { expirationTtl: 2 * 86400 });
  } catch (err) {
    console.error('Daily cap', err);
  }
  return false;
}

async function postIdea(request, env, headers) {
  if (limited(ideaHits, clientIp(request), IDEAS_PER_HOUR)) {
    return json({ error: 'Zu viele Ideen auf einmal – probier es später nochmal' }, 429, headers);
  }
  const { body, res: bad } = await readBody(request, headers);
  if (bad) return bad;
  const { idea, error } = parseIdea(body);
  // pretend success to bots that filled the honeypot
  if (error === 'spam') return json({ ok: true }, 200, headers);
  if (error) return json({ error }, 400, headers);
  if (await dailyCapReached(env)) return json({ error: 'Heute sind genug Ideen eingegangen – probier es morgen nochmal' }, 429, headers);

  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'roll-down-ideas',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(toIssue(idea)),
  });
  if (!res.ok) {
    console.error('GitHub API', res.status, res.headers.get('x-accepted-github-permissions'), await res.text());
    return json({ error: 'Speichern fehlgeschlagen – probier es später nochmal' }, 502, headers);
  }
  return json({ ok: true }, 201, headers);
}

async function getBoard(env, headers) {
  return json({ entries: await readBoard(env) }, 200, headers);
}

// Read-modify-write on one key: two submissions at the same moment can lose one update. Acceptable for friends.
async function postScore(request, env, headers) {
  if (limited(scoreHits, clientIp(request), SCORES_PER_HOUR)) {
    return json({ error: 'Zu viele Einträge – probier es später nochmal' }, 429, headers);
  }
  const { body, res: bad } = await readBody(request, headers);
  if (bad) return bad;
  const { entry, error } = parseScore(body);
  if (error) return json({ error }, 400, headers);
  // Only with a secret set: lets frontend and worker go live in any order. Checked after the
  // cheap validation, so a typo in the name does not burn the one-time token.
  if (env.TURNSTILE_SECRET) {
    const check = await verifyTurnstile(body.token, env.TURNSTILE_SECRET, clientIp(request));
    if (!check.ok) return json({ error: check.error }, check.status, headers);
  }

  const { list, status } = addScore(await readBoard(env), entry, Date.now());
  if (status === 'added') await env.LEADERBOARD.put(BOARD_KEY, JSON.stringify(list));
  return json({ ok: true, status, entries: list }, 200, headers);
}

// A missing or failing KV binding must not take the worker down.
async function guarded(handler, env, headers) {
  try {
    if (!env.LEADERBOARD) throw new Error('KV binding LEADERBOARD fehlt');
    return await handler();
  } catch (err) {
    console.error('Leaderboard', err);
    return json({ error: 'Bestenliste nicht verfügbar' }, 503, headers);
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = cors(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!allowedOrigins(env).includes(origin)) return json({ error: 'Nicht erlaubt' }, 403, headers);

    const { pathname } = new URL(request.url);
    const get = request.method === 'GET';
    const post = request.method === 'POST';
    if (get && pathname === '/leaderboard') return guarded(() => getBoard(env, headers), env, headers);
    if (post && (pathname === '/' || pathname === '/ideas')) return postIdea(request, env, headers);
    if (post && pathname === '/scores') return guarded(() => postScore(request, env, headers), env, headers);
    return json({ error: 'Nicht gefunden' }, 404, headers);
  },
};
