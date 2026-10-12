import { test, expect } from 'bun:test';
import worker from '../worker/src/index.js';

const ORIGIN = 'https://svengoerdes.github.io';
const fakeKv = () => {
  const m = new Map();
  return { get: async (k, t) => (m.has(k) ? (t === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null), put: async (k, v) => { m.set(k, v); } };
};
const req = (path, { method = 'GET', body, type = 'application/json', origin = ORIGIN, ip = '1.1.1.1', headers = {} } = {}) =>
  new Request(`https://w.test${path}`, {
    method, body,
    headers: { Origin: origin, 'Content-Type': type, 'CF-Connecting-IP': ip, ...headers },
  });
const score = (name, s) => JSON.stringify({ name, score: s });

test('missing KV binding gives 503 with CORS headers', async () => {
  const res = await worker.fetch(req('/leaderboard'), {});
  expect(res.status).toBe(503);
  expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  expect((await worker.fetch(req('/scores', { method: 'POST', body: score('A', 1), ip: '2.2.2.2' }), {})).status).toBe(503);
});

test('throwing KV gives 503', async () => {
  const env = { LEADERBOARD: { get: async () => { throw new Error('boom'); }, put: async () => {} } };
  expect((await worker.fetch(req('/leaderboard'), env)).status).toBe(503);
});

test('submit then read, with status', async () => {
  const env = { LEADERBOARD: fakeKv() };
  const res = await worker.fetch(req('/scores', { method: 'POST', body: score('Kim', 7), ip: '3.3.3.3' }), env);
  expect((await res.json()).status).toBe('added');
  const again = await worker.fetch(req('/scores', { method: 'POST', body: score('kim', 7), ip: '3.3.3.3' }), env);
  expect((await again.json()).status).toBe('exists');
  const list = await (await worker.fetch(req('/leaderboard'), env)).json();
  expect(list.entries.map((e) => e.name)).toEqual(['Kim']);
});

test('rejects foreign origins, localhost by default, and allows DEV_ORIGINS', async () => {
  const env = { LEADERBOARD: fakeKv() };
  expect((await worker.fetch(req('/leaderboard', { origin: 'https://evil.example' }), env)).status).toBe(403);
  expect((await worker.fetch(req('/leaderboard', { origin: 'http://127.0.0.1:8765' }), env)).status).toBe(403);
  const dev = { ...env, DEV_ORIGINS: 'http://127.0.0.1:8774' };
  expect((await worker.fetch(req('/leaderboard', { origin: 'http://127.0.0.1:8774' }), dev)).status).toBe(200);
});

test('rejects wrong content type and oversized bodies', async () => {
  const env = { LEADERBOARD: fakeKv() };
  const wrong = await worker.fetch(req('/scores', { method: 'POST', body: score('A', 1), type: 'text/plain', ip: '4.4.4.4' }), env);
  expect(wrong.status).toBe(415);
  const big = await worker.fetch(req('/scores', { method: 'POST', body: JSON.stringify({ name: 'x'.repeat(5000), score: 1 }), ip: '4.4.4.4' }), env);
  expect(big.status).toBe(413);
  const lying = await worker.fetch(req('/scores', { method: 'POST', body: score('A', 1), ip: '4.4.4.4', headers: { 'Content-Length': '99999' } }), env);
  expect(lying.status).toBe(413);
});

test('preflight sets max age; unknown routes give 404', async () => {
  const pre = await worker.fetch(req('/scores', { method: 'OPTIONS' }), {});
  expect(pre.status).toBe(204);
  expect(pre.headers.get('Access-Control-Max-Age')).toBe('86400');
  expect((await worker.fetch(req('/nope'), {})).status).toBe(404);
});

test('ideas stop at the daily cap and still work without KV', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', { status: 201 });
  try {
    const kv = fakeKv();
    await kv.put(`ideas:${new Date().toISOString().slice(0, 10)}`, '100');
    const idea = JSON.stringify({ text: 'Mehr Powerups bitte' });
    const capped = await worker.fetch(req('/ideas', { method: 'POST', body: idea, ip: '5.5.5.5' }), { LEADERBOARD: kv });
    expect(capped.status).toBe(429);
    const open = await worker.fetch(req('/', { method: 'POST', body: idea, ip: '6.6.6.6' }), { GITHUB_REPO: 'a/b', GITHUB_TOKEN: 't' });
    expect(open.status).toBe(201);
  } finally {
    globalThis.fetch = realFetch;
  }
});
