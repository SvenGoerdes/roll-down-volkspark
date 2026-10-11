import { parseIdea, toIssue } from './idea.js';

const ALLOWED_ORIGINS = ['https://svengoerdes.github.io', 'http://127.0.0.1:8765', 'http://localhost:8765'];
const PER_IP_PER_HOUR = 5;
const recent = new Map(); // ip → timestamps; per isolate, enough to slow down button mashing

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

const json = (data, status, headers) =>
  new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

function rateLimited(ip) {
  const hourAgo = Date.now() - 3600_000;
  const hits = (recent.get(ip) || []).filter((t) => t > hourAgo);
  if (hits.length >= PER_IP_PER_HOUR) return true;
  recent.set(ip, [...hits, Date.now()]);
  return false;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = cors(origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return json({ error: 'Nur POST' }, 405, headers);
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'Nicht erlaubt' }, 403, headers);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (rateLimited(ip)) return json({ error: 'Zu viele Ideen auf einmal – probier es später nochmal' }, 429, headers);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Ungültige Anfrage' }, 400, headers); }
    const { idea, error } = parseIdea(body);
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
  },
};
