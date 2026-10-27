import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStaging } from '../../tools/build-staging.js';
import { SHEETS } from '../../js/figure-sheets.js';
import { SEASONS, POWERUPS } from '../../js/config.js';
import { loadGateSprites } from '../../js/gate-sprites.js';
import { loadGallerySprites } from '../../js/gallery-sprites.js';
import { loadOberbaumSprites } from '../../js/oberbaum-sprites.js';
import { loadReichstagSprites } from '../../js/reichstag-sprites.js';
import { loadRathausSprites } from '../../js/rathaus-sprites.js';
import { loadSurfaceArt, loadGroundArt } from '../../js/surface-art.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const temporary = [];
const put = async (root, relative, value = 'private-sentinel') => {
  await mkdir(dirname(join(root, relative)), { recursive: true });
  await writeFile(join(root, relative), value);
};
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'roll-down-build-')); temporary.push(dir);
  await put(dir, 'index.html', `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://production.example; base-uri 'none'">`);
  await put(dir, 'style.css', 'body { color: black; }');
  await put(dir, 'manifest.webmanifest', '{}');
  await put(dir, 'js/config.js', "export const WORKER_URL = 'https://production.example';\nexport const TURNSTILE_SITEKEY = 'production-key';\n");
  await put(dir, 'js/main.js', "import './config.js';");
  for (const name of ['environment', 'figures', 'landmarks', 'powerups']) await mkdir(join(dir, 'assets', name), { recursive: true });
  for (const name of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) await put(dir, `assets/${name}`, 'image');
  return dir;
}
const hash = (value) => createHash('sha256').update(value).digest('hex');
afterAll(async () => { for (const dir of temporary) await rm(dir, { recursive: true, force: true }); });

let built, sourceBefore;
beforeAll(async () => {
  sourceBefore = await Promise.all(['index.html', 'js/config.js'].map((name) => readFile(join(root, name))));
  built = await buildStaging(root);
});

test('real package keeps all static modules and every figure, season, landmark and powerup runtime image', async () => {
  const exists = async (path) => expect(await Bun.file(join(built.output, path)).exists()).toBe(true);
  for (const module of (await readdir(join(root, 'js'))).filter((name) => name.endsWith('.js'))) {
    await exists(`js/${module}`);
    const source = await readFile(join(root, 'js', module), 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"]\.\/([^'"]+)['"]/g)) await exists(`js/${match[1]}`);
  }
  for (const [id, clips] of Object.entries(SHEETS)) for (const clip of Object.keys(clips)) await exists(`assets/figures/${id}/${clip}.webp`);
  for (const season of SEASONS) for (const kind of ['horizon', 'forest']) await exists(`assets/environment/${season.id}-${kind}.webp`);
  for (const item of Object.values(POWERUPS)) await exists(item.img);
  const load = async (path) => { await exists(path); return path; };
  for (const loader of [loadGateSprites, loadGallerySprites, loadOberbaumSprites, loadReichstagSprites, loadRathausSprites, loadSurfaceArt, loadGroundArt]) await loader(load);
  const html = await readFile(join(built.output, 'index.html'), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) await exists(match[1]);
  const manifest = JSON.parse(await readFile(join(built.output, 'manifest.webmanifest'), 'utf8'));
  for (const icon of manifest.icons) await exists(icon.src);
});

test('package uses private same-origin APIs and disables Turnstile without editing production sources', async () => {
  const html = await readFile(join(built.output, 'index.html'), 'utf8');
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  expect(policy.split(';').map((part) => part.trim()).find((part) => part.startsWith('connect-src'))).toBe("connect-src 'self'");
  expect(policy).not.toContain('workers.dev');
  const config = await readFile(join(built.output, 'js/config.js'), 'utf8');
  expect(config).toContain("export const WORKER_URL = '/api';");
  expect(config).toContain("export const TURNSTILE_SITEKEY = '';");
  expect(config).not.toContain('roll-down-ideas');
  const sourceAfter = await Promise.all(['index.html', 'js/config.js'].map((name) => readFile(join(root, name))));
  expect(sourceAfter).toEqual(sourceBefore);
});

test('source, credentials and metadata cannot leak even when outside files look like runtime assets', async () => {
  const dir = await fixture();
  for (const path of ['assets/src/secret.webp', 'assets/seasons/raw.webp', '.git/config', '.docs/internal.js', '.claude/review.webp', 'worker/src/key.js', 'staging/src/key.js', 'staging/.dev.vars', 'node_modules/library.js', 'js/key.json', 'assets/environment/material-prompts.json', 'assets/landmarks/provenance.json', 'assets/environment/README.md', '.env', 'wrangler.jsonc']) await put(dir, path);
  await put(dir, 'assets/environment/earth-painted.webp', 'runtime-image');
  await put(dir, 'assets/park.jpg', 'unused-legacy-photo');
  await put(dir, 'staging/public/stale.js', 'old-output');
  const output = await buildStaging(dir);
  const contents = await Promise.all(output.files.map((name) => readFile(join(output.output, name), 'utf8')));
  expect(contents.join('\n')).not.toContain('private-sentinel');
  expect(contents.join('\n')).not.toContain('production-key');
  expect(contents.join('\n')).not.toContain('production.example');
  expect(output.files).toContain('assets/environment/earth-painted.webp');
  expect(output.files).not.toContain('assets/park.jpg');
  expect(await Bun.file(join(output.output, 'stale.js')).exists()).toBe(false);
  expect(await readFile(join(dir, 'staging/.dev.vars'), 'utf8')).toBe('private-sentinel');
});

test('rebuilds are reproducible and an actually referenced legacy root photo is preserved', async () => {
  const dir = await fixture();
  await put(dir, 'style.css', 'body { background: url(assets/park.jpg); }');
  await put(dir, 'assets/park.jpg', 'referenced-image');
  const first = await buildStaging(dir);
  const snapshot = async (result) => Promise.all(result.files.map(async (name) => [name, hash(await readFile(join(result.output, name)))]));
  const before = await snapshot(first);
  const second = await buildStaging(dir);
  expect(await snapshot(second)).toEqual(before);
  expect(await readFile(join(second.output, 'assets/park.jpg'), 'utf8')).toBe('referenced-image');
});

test('symlinked runtime files, runtime directories and output parents fail closed', async () => {
  for (const path of ['js/main.js', 'assets/figures', 'assets/landmarks/linked.webp', 'staging', 'staging/public']) {
    const dir = await fixture(), outside = await fixture();
    await put(outside, 'must-survive', 'outside-source');
    await rm(join(dir, path), { recursive: true, force: true });
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await symlink(path.endsWith('.js') || path.endsWith('.webp') ? join(outside, 'must-survive') : outside, join(dir, path));
    await expect(buildStaging(dir)).rejects.toThrow(/symlink/);
    expect(await readFile(join(outside, 'must-survive'), 'utf8')).toBe('outside-source');
    expect(await Bun.file(join(outside, 'public/index.html')).exists()).toBe(false);
  }
});

test('missing or ambiguous API/CSP assignments abort before a generated package is replaced', async () => {
  for (const replacement of [
    ['js/config.js', 'export const WORKER_URL = getUrl();'],
    ['js/config.js', "export const WORKER_URL = 'x';\nexport const WORKER_URL = 'y';\nexport const TURNSTILE_SITEKEY = '';"],
    ['index.html', '<p>missing CSP</p>'],
    ['index.html', `<meta http-equiv="Content-Security-Policy" content="default-src 'self'">`],
  ]) {
    const dir = await fixture();
    await put(dir, 'staging/public/previous-build', 'keep-until-valid-build');
    await put(dir, ...replacement);
    await expect(buildStaging(dir)).rejects.toThrow(/exactly one/);
    expect(await readFile(join(dir, 'staging/public/previous-build'), 'utf8')).toBe('keep-until-valid-build');
  }
});

test('actual workflow deployment preflight stays closed until flag, account and environment token are present', async () => {
  const workflow = Bun.YAML.parse(await readFile(join(root, '.github/workflows/staging.yml'), 'utf8'));
  const script = workflow.jobs.staging.steps.find((step) => step.id === 'setup').run;
  for (const [enabled, account, token, ready] of [
    ['', 'account', 'token', false],
    ['false', 'account', 'token', false],
    ['true', '', 'token', false],
    ['true', 'account', '', false],
    ['true', 'account', 'token', true],
  ]) {
    const dir = await mkdtemp(join(tmpdir(), 'roll-down-deploy-')); temporary.push(dir);
    const output = join(dir, 'output'), summary = join(dir, 'summary');
    const process = Bun.spawnSync(['bash', '-c', script], { env: {
      STAGING_DEPLOY_ENABLED: enabled, CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token,
      GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary,
    } });
    expect(process.exitCode).toBe(0);
    expect((await readFile(output, 'utf8')).trim()).toBe(`ready=${ready}`);
    if (!ready) expect(await readFile(summary, 'utf8')).toMatch(/geschlossen|Setup fehlt/);
  }
});
