import { parseIdea, toIssue } from './idea.js';
import { parseScore, addScore, limited } from './score.js';

const ALLOWED_ORIGINS = ['https://svengoerdes.github.io', 'http://127.0.0.1:8765', 'http://localhost:8765'];
const IDEAS_PER_HOUR = 5;
const SCORES_PER_HOUR = 20;
const BOARD_KEY = 'top'; // one KV key holds the whole top list; KV is eventually consistent, fine for friends
const ideaHits = new Map(); // ip → timestamps
const scoreHits = new Map();

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

const json = (data, status, headers) =>
  new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

const readBoard = async (env) => (await env.LEADERBOARD.get(BOARD_KEY, 'json')) || [];
const readJson = (request) => request.json().catch(() => null);
const clientIp = (request) => request.headers.get('CF-Connecting-IP') || 'unknown';

async function postIdea(request, env, headers) {
  if (limited(ideaHits, clientIp(request), IDEAS_PER_HOUR)) {
    return json({ error: 'Zu viele Ideen auf einmal – probier es später nochmal' }, 429, headers);
  }
  const { idea, error } = parseIdea(await readJson(request));
  // pretend success to bots that filled the honeypot
  if (error === 'spam') return json({ ok: true }, 200, headers);
  if (error) return json({ error }, 400, headers);

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

async function postScore(request, env, headers) {
  if (limited(scoreHits, clientIp(request), SCORES_PER_HOUR)) {
    return json({ error: 'Zu viele Einträge – probier es später nochmal' }, 429, headers);
  }
  const { entry, error } = parseScore(await readJson(request));
  if (error) return json({ error }, 400, headers);

  const { list, improved } = addScore(await readBoard(env), entry, Date.now());
  if (improved) await env.LEADERBOARD.put(BOARD_KEY, JSON.stringify(list));
  return json({ ok: true, improved, entries: list }, 200, headers);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = cors(origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'Nicht erlaubt' }, 403, headers);

    const { pathname } = new URL(request.url);
    const get = request.method === 'GET';
    const post = request.method === 'POST';
    if (get && pathname === '/leaderboard') return json({ entries: await readBoard(env) }, 200, headers);
    if (post && (pathname === '/' || pathname === '/ideas')) return postIdea(request, env, headers);
    if (post && pathname === '/scores') return postScore(request, env, headers);
    return json({ error: 'Nicht gefunden' }, 404, headers);
  },
};
