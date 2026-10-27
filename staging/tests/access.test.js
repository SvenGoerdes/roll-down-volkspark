import { beforeAll, expect, test } from 'bun:test';
import { generateKeyPair, SignJWT } from 'jose';
import { createAccessVerifier } from '../src/access.js';
import { createStagingWorker } from '../src/index.js';

const domain = 'https://private-game.cloudflareaccess.com';
const audience = 'private-staging-audience';
const owner = 'owner@example.test';
let keys, worker, env, assetCalls;
beforeAll(async () => {
  keys = await generateKeyPair('RS256');
  worker = createStagingWorker(createAccessVerifier(() => keys.publicKey));
});
const token = (claims = {}, key = keys.privateKey) => new SignJWT({ email: owner, ...claims })
  .setProtectedHeader({ alg: 'RS256' }).setSubject('owner-id').setIssuedAt()
  .setIssuer(domain).setAudience(audience).setExpirationTime('10m').sign(key);
const setup = () => {
  assetCalls = 0;
  const values = new Map();
  env = {
    STAGING_ACCESS_DOMAIN: domain, STAGING_ACCESS_AUD: audience, STAGING_ALLOWED_EMAIL: owner,
    ASSETS: { fetch: async () => { assetCalls++; return new Response('private asset'); } },
    LEADERBOARD: {
      get: async (key) => JSON.parse(values.get(key) || 'null'),
      put: async (key, value) => values.set(key, value),
    },
  };
};
const request = (path, jwt, options = {}) => new Request(`https://staging.example.test${path}`, {
  ...options, headers: { Origin: 'https://staging.example.test', ...(jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {}), ...options.headers },
});

test('deployment guards every static asset and cannot bind the production leaderboard', async () => {
  const config = await Bun.file(new URL('../wrangler.jsonc', import.meta.url)).json();
  const production = Bun.TOML.parse(await Bun.file(new URL('../../worker/wrangler.toml', import.meta.url)).text());
  expect(config.assets.run_worker_first).toBe(true);
  expect(config.preview_urls).toBe(false);
  const storage = config.kv_namespaces.find((binding) => binding.binding === 'LEADERBOARD');
  expect(storage.id).toMatch(/^[a-f0-9]{32}$/);
  expect(storage.id).not.toBe(production.kv_namespaces.find((binding) => binding.binding === 'LEADERBOARD').id);
});

test('missing configuration and anonymous requests cannot read HTML, JS, images or APIs', async () => {
  setup();
  for (const path of ['/', '/js/main.js', '/assets/icon-192.png', '/api/leaderboard']) {
    expect((await worker.fetch(request(path), env)).status).toBe(403);
    expect((await worker.fetch(request(path), { ...env, STAGING_ACCESS_AUD: '' })).status).toBe(503);
  }
  expect(assetCalls).toBe(0);
});

test('real signed owner JWT allows an asset while a different email or forged token does not', async () => {
  setup();
  const accepted = await worker.fetch(request('/js/main.js', await token()), env);
  expect(accepted.status).toBe(200);
  expect(await accepted.text()).toBe('private asset');
  expect(accepted.headers.get('Cache-Control')).toBe('private, no-store');
  expect(accepted.headers.get('X-Robots-Tag')).toContain('noindex');
  expect((await worker.fetch(request('/', await token({ email: 'other@example.test' })), env)).status).toBe(403);
  const other = await generateKeyPair('RS256');
  expect((await worker.fetch(request('/', await token({}, other.privateKey)), env)).status).toBe(403);
  expect((await worker.fetch(request('/', 'eyJhbGciOiJub25lIn0.e30.'), env)).status).toBe(403);
  expect(assetCalls).toBe(1);
});

test('expiry, audience, issuer and required claims are enforced cryptographically', async () => {
  setup();
  for (const build of [
    (jwt) => jwt.setExpirationTime(1), (jwt) => jwt.setAudience('another-app'),
    (jwt) => jwt.setIssuer('https://other.cloudflareaccess.com'),
  ]) {
    let jwt = new SignJWT({ email: owner }).setProtectedHeader({ alg: 'RS256' }).setSubject('owner-id')
      .setIssuedAt().setIssuer(domain).setAudience(audience).setExpirationTime('10m');
    jwt = build(jwt);
    expect((await worker.fetch(request('/', await jwt.sign(keys.privateKey)), env)).status).toBe(403);
  }
  const noExpiry = await new SignJWT({ email: owner }).setProtectedHeader({ alg: 'RS256' })
    .setSubject('owner-id').setIssuedAt().setIssuer(domain).setAudience(audience).sign(keys.privateKey);
  expect((await worker.fetch(request('/', noExpiry), env)).status).toBe(403);
  expect(assetCalls).toBe(0);
});

test('staging scores stay in the separate binding and idea submission is disabled', async () => {
  setup(); const jwt = await token();
  const post = await worker.fetch(request('/api/scores', jwt, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', score: 12, season: 'Frühling' }),
  }), env);
  expect(post.status).toBe(200);
  const board = await worker.fetch(request('/api/leaderboard', jwt), env);
  expect((await board.json()).entries[0]).toMatchObject({ name: 'Test', score: 12 });
  expect((await worker.fetch(request('/api/ideas', jwt, { method: 'POST', body: '{}' }), env)).status).toBe(409);
  expect(assetCalls).toBe(0);
});

test('browser GET without Origin works, but foreign or missing write origins remain rejected', async () => {
  setup(); const jwt = await token();
  const url = 'https://staging.example.test';
  const read = new Request(`${url}/api/leaderboard`, { headers: { 'Cf-Access-Jwt-Assertion': jwt } });
  expect((await worker.fetch(read, env)).status).toBe(200);
  for (const origin of ['', 'https://unrelated.example.test']) {
    const headers = { 'Cf-Access-Jwt-Assertion': jwt, 'Content-Type': 'application/json' };
    if (origin) headers.Origin = origin;
    const write = new Request(`${url}/api/scores`, { method: 'POST', headers,
      body: JSON.stringify({ name: 'Test', score: 3, season: 'Frühling' }) });
    expect((await worker.fetch(write, env)).status).toBe(403);
  }
});
