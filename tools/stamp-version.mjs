// Cache-busting version stamper for GitHub Pages deploys (Issue #14, ADR 0080).
// Local dev runs directly from un-stamped source files; CI builds `_site` and stamps `?v=<sha>`.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXTERNAL_URL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
const RUNTIME_ROOT_FILES = ['index.html', 'style.css', 'manifest.webmanifest'];
const RUNTIME_ASSET_DIRS = ['environment', 'figures', 'landmarks', 'powerups'];
const RUNTIME_ROOT_ICONS = ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const IMAGE_EXT_RE = /\.(?:webp|png|jpg|jpeg|svg|gif|avif)$/i;

function normalizeVersion(version) {
  const v = String(version ?? '').trim();
  if (!v) throw new Error('A non-empty version string is required');
  return encodeURIComponent(v);
}

function applyVersionToUrl(rawUrl, encodedVersion) {
  const trimmed = rawUrl.trim();
  if (!trimmed || EXTERNAL_URL_RE.test(trimmed)) return rawUrl;
  const hashIndex = rawUrl.indexOf('#');
  const base = hashIndex === -1 ? rawUrl : rawUrl.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : rawUrl.slice(hashIndex);
  if (/([?&])v=[^&#]*/.test(base)) {
    return base.replace(/([?&])v=[^&#]*/, `$1v=${encodedVersion}`) + hash;
  }
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}v=${encodedVersion}${hash}`;
}

export function stampHtml(html, version) {
  const v = normalizeVersion(version);
  return html.replace(/(^|[\s"'>/])(href|src)\s*=\s*(["'])([^"']*)\3/gi, (_, prefix, attr, quote, url) => {
    const stamped = applyVersionToUrl(url, v);
    return `${prefix}${attr}=${quote}${stamped}${quote}`;
  });
}

export function stampCss(css, version) {
  const v = normalizeVersion(version);
  return css.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^'"()\s]+))\s*\)/gi, (match, dq, sq, uq) => {
    const raw = dq ?? sq ?? uq ?? '';
    const stamped = applyVersionToUrl(raw, v);
    if (stamped === raw) return match;
    const quote = dq !== undefined ? '"' : sq !== undefined ? "'" : '';
    return `url(${quote}${stamped}${quote})`;
  });
}

export function stampJs(js, version) {
  const v = normalizeVersion(version);
  let out = js.replace(
    /\b(from|import)\s*(["'])(\.\.?\/[^"'\r\n]+?\.js)(?:\?v=[^"'\r\n]*)?\2/g,
    (_, kw, quote, spec) => `${kw} ${quote}${spec}?v=${v}${quote}`,
  );
  out = out.replace(
    /\bimport\s*\(\s*(["'`])(\.\.?\/[^"'`\r\n]+?\.js)(?:\?v=[^"'`\r\n]*)?\1\s*\)/g,
    (_, quote, spec) => `import(${quote}${spec}?v=${v}${quote})`,
  );
  out = out.replace(
    /(?<=['"`(])((?:\.\.?\/)?assets\/[^'"`\r\n<>]+?\.(?:webp|png|jpg))(?:\?v=[^'"`)\s]*)?(?=[)'"`])/g,
    (_, assetPath) => `${assetPath}?v=${v}`,
  );
  return out;
}

export function stampDirectory(rootDir, version) {
  normalizeVersion(version);
  const htmlPath = path.join(rootDir, 'index.html');
  if (existsSync(htmlPath)) {
    writeFileSync(htmlPath, stampHtml(readFileSync(htmlPath, 'utf8'), version));
  }
  const cssPath = path.join(rootDir, 'style.css');
  if (existsSync(cssPath)) {
    writeFileSync(cssPath, stampCss(readFileSync(cssPath, 'utf8'), version));
  }
  const jsDir = path.join(rootDir, 'js');
  if (existsSync(jsDir)) {
    for (const entry of readdirSync(jsDir)) {
      if (!entry.endsWith('.js')) continue;
      const filePath = path.join(jsDir, entry);
      if (statSync(filePath).isFile()) {
        writeFileSync(filePath, stampJs(readFileSync(filePath, 'utf8'), version));
      }
    }
  }
}

function copyRuntimeImages(srcDir, destDir) {
  if (!existsSync(srcDir)) return;
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyRuntimeImages(srcPath, destPath);
    } else if (entry.isFile() && IMAGE_EXT_RE.test(entry.name)) {
      mkdirSync(path.dirname(destPath), { recursive: true });
      cpSync(srcPath, destPath);
    }
  }
}

export function buildPagesBundle(sourceRoot, outDir, version) {
  normalizeVersion(version);
  const srcRoot = path.resolve(sourceRoot);
  const targetRoot = path.resolve(outDir);
  if (srcRoot === targetRoot) {
    throw new Error('outDir must be distinct from sourceRoot');
  }
  rmSync(targetRoot, { recursive: true, force: true });
  mkdirSync(targetRoot, { recursive: true });

  for (const relFile of RUNTIME_ROOT_FILES) {
    const srcFile = path.join(srcRoot, relFile);
    if (existsSync(srcFile)) {
      cpSync(srcFile, path.join(targetRoot, relFile));
    }
  }

  const srcJsDir = path.join(srcRoot, 'js');
  const destJsDir = path.join(targetRoot, 'js');
  if (existsSync(srcJsDir)) {
    mkdirSync(destJsDir, { recursive: true });
    for (const entry of readdirSync(srcJsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.js')) {
        cpSync(path.join(srcJsDir, entry.name), path.join(destJsDir, entry.name));
      }
    }
  }

  const srcAssetsDir = path.join(srcRoot, 'assets');
  const destAssetsDir = path.join(targetRoot, 'assets');
  for (const dirName of RUNTIME_ASSET_DIRS) {
    copyRuntimeImages(path.join(srcAssetsDir, dirName), path.join(destAssetsDir, dirName));
  }
  for (const iconName of RUNTIME_ROOT_ICONS) {
    const srcIcon = path.join(srcAssetsDir, iconName);
    if (existsSync(srcIcon)) {
      mkdirSync(destAssetsDir, { recursive: true });
      cpSync(srcIcon, path.join(destAssetsDir, iconName));
    }
  }

  stampDirectory(targetRoot, version);
  return { outDir: targetRoot, version };
}

export function resolveDefaultVersion(cwd = REPO_ROOT) {
  const envSha = process.env.GITHUB_SHA?.trim();
  if (envSha) return envSha.slice(0, 7);
  try {
    const sha = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (sha) return sha;
  } catch {
    // Fall back to timestamp outside a git checkout.
  }
  return String(Date.now());
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args[0] === '--bundle') {
    const outDir = args[1];
    if (!outDir) {
      console.error('Usage: bun tools/stamp-version.mjs --bundle <outDir> [version]');
      process.exit(1);
    }
    const version = args[2] || resolveDefaultVersion();
    buildPagesBundle(REPO_ROOT, outDir, version);
  } else {
    const version = args[0];
    if (!version) {
      console.error('Usage: bun tools/stamp-version.mjs <version> [targetDir] | --bundle <outDir> [version]');
      process.exit(1);
    }
    const targetDir = path.resolve(args[1] || REPO_ROOT);
    stampDirectory(targetDir, version);
  }
}
