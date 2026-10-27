// Private staging assets only. Never copy the repository root as a static site.
import { lstat, readdir, readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME_ASSETS = ['environment', 'figures', 'landmarks', 'powerups'];
const ROOT_ICONS = ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

async function regular(path, directory = false) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || (directory ? !stat.isDirectory() : !stat.isFile())) {
    throw new Error(`Staging refuses a symlink or unexpected file type: ${path}`);
  }
}

function replaceOne(source, pattern, replacement, label) {
  if ([...source.matchAll(pattern)].length !== 1) throw new Error(`Expected exactly one ${label}`);
  return source.replace(pattern, replacement);
}

export async function buildStaging(sourceRoot = PROJECT_ROOT) {
  const root = resolve(sourceRoot), files = new Map();
  await regular(root, true);
  const add = async (relative) => {
    await regular(join(root, relative));
    files.set(relative, await readFile(join(root, relative)));
  };
  for (const file of ['index.html', 'style.css', 'manifest.webmanifest']) await add(file);
  await regular(join(root, 'js'), true);
  for (const entry of (await readdir(join(root, 'js'), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.endsWith('.js')) await add(`js/${entry.name}`);
  }
  await regular(join(root, 'assets'), true);
  const images = async (relative) => {
    await regular(join(root, relative), true);
    for (const entry of (await readdir(join(root, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink()) throw new Error(`Staging refuses a symlink: ${relative}/${entry.name}`);
      if (entry.isDirectory()) await images(`${relative}/${entry.name}`);
      else if (entry.name.endsWith('.webp')) await add(`${relative}/${entry.name}`);
    }
  };
  for (const directory of RUNTIME_ASSETS) await images(`assets/${directory}`);
  for (const icon of ROOT_ICONS) await add(`assets/${icon}`);

  // Legacy root photos are included only if an actual runtime reference remains.
  const runtimeText = [...files].filter(([name]) => !name.startsWith('assets/')).map(([, value]) => value.toString()).join('\n');
  for (const photo of ['park.jpg', 'gabion.jpg']) if (runtimeText.includes(`assets/${photo}`)) await add(`assets/${photo}`);

  let config = files.get('js/config.js')?.toString();
  if (!config) throw new Error('Missing runtime config');
  config = replaceOne(config, /^export const WORKER_URL\s*=\s*['"][^'"\r\n]*['"];$/gm, "export const WORKER_URL = '/api';", 'WORKER_URL');
  config = replaceOne(config, /^export const TURNSTILE_SITEKEY\s*=\s*['"][^'"\r\n]*['"];$/gm, "export const TURNSTILE_SITEKEY = '';", 'TURNSTILE_SITEKEY');
  files.set('js/config.js', config);
  const html = files.get('index.html').toString();
  const csp = /(<meta\s+http-equiv="Content-Security-Policy"\s+content=")([^"]+)(")/g;
  const meta = [...html.matchAll(csp)];
  if (meta.length !== 1) throw new Error('Expected exactly one CSP meta element');
  const policy = replaceOne(meta[0][2], /\bconnect-src\s+[^;]+/g, "connect-src 'self'", 'connect-src directive');
  files.set('index.html', html.replace(csp, (_, before, old, after) => before + policy + after));

  // Check the output parents before any deletion; never follow an output symlink.
  const staging = join(root, 'staging'), output = join(staging, 'public');
  await mkdir(staging, { recursive: true });
  await regular(staging, true);
  try { await regular(output, true); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await rm(output, { recursive: true, force: true });
  await mkdir(output);
  for (const [relative, content] of files) {
    await mkdir(dirname(join(output, relative)), { recursive: true });
    await writeFile(join(output, relative), content);
  }
  return { output, files: [...files.keys()].sort() };
}

if (import.meta.main) {
  const result = await buildStaging();
  console.log(`Staging: ${result.files.length} runtime files → ${result.output}`);
}
