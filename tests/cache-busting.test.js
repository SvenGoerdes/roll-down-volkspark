import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildPagesBundle,
  stampCss,
  stampDirectory,
  stampHtml,
  stampJs,
} from '../tools/stamp-version.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('cache-busting version stamper', () => {
  test('stampHtml stamps local href/src URLs, ignores external/data/hash URLs, and is idempotent', () => {
    const input = [
      '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' https://challenges.cloudflare.com">',
      '<link rel="manifest" href="manifest.webmanifest">',
      '<link rel="icon" href="assets/icon-192.png">',
      '<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">',
      '<link rel="stylesheet" href="style.css">',
      '<img src="assets/powerups/helmet.webp" alt="">',
      '<img src="data:image/png;base64,AAAA" alt="">',
      '<a href="#debug">Debug</a>',
      '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"></script>',
      '<script type="module" src="js/main.js"></script>',
    ].join('\n');

    const stamped1 = stampHtml(input, 'a1b2c3d');
    expect(stamped1).toContain('href="manifest.webmanifest?v=a1b2c3d"');
    expect(stamped1).toContain('href="assets/icon-192.png?v=a1b2c3d"');
    expect(stamped1).toContain('href="assets/apple-touch-icon.png?v=a1b2c3d"');
    expect(stamped1).toContain('href="style.css?v=a1b2c3d"');
    expect(stamped1).toContain('src="assets/powerups/helmet.webp?v=a1b2c3d"');
    expect(stamped1).toContain('src="js/main.js?v=a1b2c3d"');
    expect(stamped1).toContain('src="data:image/png;base64,AAAA"');
    expect(stamped1).toContain('href="#debug"');
    expect(stamped1).toContain('src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"');

    const stamped2 = stampHtml(stamped1, 'f9e8d7c');
    expect(stamped2).toContain('href="style.css?v=f9e8d7c"');
    expect(stamped2).toContain('src="js/main.js?v=f9e8d7c"');
    expect(stamped2).not.toContain('a1b2c3d');
    expect(stamped2).toBe(stampHtml(stamped2, 'f9e8d7c'));
  });

  test('stampCss stamps local url(...) references and ignores data:, https:, and # fragments', () => {
    const realCss = readFileSync(path.join(REPO_ROOT, 'style.css'), 'utf8');
    expect(stampCss(realCss, '1234567')).toBe(realCss);

    const sampleCss = [
      '.bg { background-image: url("assets/environment/spring-horizon.webp"); }',
      ".card { background: url('assets/figures/kalle/select.webp') no-repeat; }",
      '.unquoted { background-image: url(assets/icon-192.png); }',
      '.inline-svg { background: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3C/svg%3E"); }',
      '.ext { background: url("https://example.com/bg.webp"); }',
      '.mask { clip-path: url(#clip); }',
    ].join('\n');

    const stamped1 = stampCss(sampleCss, 'v1');
    expect(stamped1).toContain('url("assets/environment/spring-horizon.webp?v=v1")');
    expect(stamped1).toContain("url('assets/figures/kalle/select.webp?v=v1')");
    expect(stamped1).toContain('url(assets/icon-192.png?v=v1)');
    expect(stamped1).toContain('url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3C/svg%3E")');
    expect(stamped1).toContain('url("https://example.com/bg.webp")');
    expect(stamped1).toContain('url(#clip)');

    const stamped2 = stampCss(stamped1, 'v2');
    expect(stamped2).toContain('url("assets/environment/spring-horizon.webp?v=v2")');
    expect(stamped2).toContain("url('assets/figures/kalle/select.webp?v=v2')");
    expect(stamped2).toContain('url(assets/icon-192.png?v=v2)');
    expect(stamped2).not.toContain('?v=v1');
  });

  test('stampJs stamps static imports, re-exports, dynamic imports, and asset strings/templates idempotently', () => {
    const sampleJs = [
      "import { CORRIDOR, POWERUPS } from './config.js';",
      "import {\n  speedAt,\n  makeGaps,\n} from '../shared/logic.js';",
      "import './side-effect.js';",
      "export { computeView, project } from './view.js';",
      "export * from './atmosphere.js';",
      "const lazy = () => import('./environment-preview.js');",
      "const helmet = 'assets/powerups/helmet.webp';",
      'const gate = "assets/landmarks/brandenburg-gate-roof.webp";',
      "const icon = 'assets/icon-192.png';",
      "const photo = 'assets/park.jpg';",
      'const sheet = `assets/figures/${id}/${sheet.file}.webp`;',
      'const cssUrl = `url(assets/figures/${id}/select.webp)`;',
      "const turnstile = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';",
      "const worker = 'https://roll-down-ideas.roll-down-ideas.workers.dev';",
      'const downloadName = `roll-down-volkspark-${score}-mauern.png`;',
      '// Comment with assets/figures/<figure>/<clip>.webp stays untouched',
    ].join('\n');

    const stamped1 = stampJs(sampleJs, '111aaaa');
    expect(stamped1).toContain("from './config.js?v=111aaaa'");
    expect(stamped1).toContain("from '../shared/logic.js?v=111aaaa'");
    expect(stamped1).toContain("import './side-effect.js?v=111aaaa'");
    expect(stamped1).toContain("export { computeView, project } from './view.js?v=111aaaa'");
    expect(stamped1).toContain("export * from './atmosphere.js?v=111aaaa'");
    expect(stamped1).toContain("import('./environment-preview.js?v=111aaaa')");
    expect(stamped1).toContain("'assets/powerups/helmet.webp?v=111aaaa'");
    expect(stamped1).toContain('"assets/landmarks/brandenburg-gate-roof.webp?v=111aaaa"');
    expect(stamped1).toContain("'assets/icon-192.png?v=111aaaa'");
    expect(stamped1).toContain("'assets/park.jpg?v=111aaaa'");
    expect(stamped1).toContain('`assets/figures/${id}/${sheet.file}.webp?v=111aaaa`');
    expect(stamped1).toContain('`url(assets/figures/${id}/select.webp?v=111aaaa)`');
    expect(stamped1).toContain("'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'");
    expect(stamped1).toContain("'https://roll-down-ideas.roll-down-ideas.workers.dev'");
    expect(stamped1).toContain('`roll-down-volkspark-${score}-mauern.png`');
    expect(stamped1).toContain('// Comment with assets/figures/<figure>/<clip>.webp stays untouched');

    const stamped2 = stampJs(stamped1, '222bbbb');
    expect(stamped2).not.toContain('111aaaa');
    expect(stamped2).toContain("from './config.js?v=222bbbb'");
    expect(stamped2).toContain("import('./environment-preview.js?v=222bbbb')");
    expect(stamped2).toContain('`assets/figures/${id}/${sheet.file}.webp?v=222bbbb`');
    expect(stamped2).toContain('`url(assets/figures/${id}/select.webp?v=222bbbb)`');
    expect(stamped2).toBe(stampJs(stamped2, '222bbbb'));
  });

  test('buildPagesBundle copies only runtime files and stamps all relative .js, .css, .webp, and .png references', () => {
    const tmpBase = mkdtempSync(path.join(tmpdir(), 'roll-down-pages-'));
    const outDir = path.join(tmpBase, '_site');
    const version = 'deadbee';

    try {
      buildPagesBundle(REPO_ROOT, outDir, version);

      for (const devPath of ['.docs', '.github', 'tests', 'tools', 'worker', 'CLAUDE.md', 'assets/src', 'assets/seasons']) {
        expect(existsSync(path.join(outDir, devPath))).toBe(false);
      }

      for (const runtimePath of [
        'index.html',
        'style.css',
        'manifest.webmanifest',
        'assets/icon-192.png',
        'assets/icon-512.png',
        'assets/apple-touch-icon.png',
        'assets/environment/spring-horizon.webp',
        'assets/figures/kalle/roll.webp',
        'assets/landmarks/brandenburg-gate-roof.webp',
        'assets/powerups/helmet.webp',
      ]) {
        expect(existsSync(path.join(outDir, runtimePath))).toBe(true);
      }

      const html = readFileSync(path.join(outDir, 'index.html'), 'utf8');
      expect(html).toContain(`href="style.css?v=${version}"`);
      expect(html).toContain(`src="js/main.js?v=${version}"`);
      expect(html).toContain(`href="assets/icon-192.png?v=${version}"`);
      expect(html).toContain(`href="assets/apple-touch-icon.png?v=${version}"`);
      expect(html).toContain(`src="assets/powerups/helmet.webp?v=${version}"`);
      expect(html).toContain(`src="assets/powerups/slowmo.webp?v=${version}"`);
      expect(html).toContain(`src="assets/powerups/widen.webp?v=${version}"`);

      const htmlAttrs = [...html.matchAll(/(?:^|[\s"'>/])(?:href|src)=["']([^"']+)["']/g)].map((m) => m[1]);
      for (const url of htmlAttrs) {
        if (/\.(?:js|css|webp|png|webmanifest)(?:$|\?)/.test(url) && !url.startsWith('http') && !url.startsWith('data:')) {
          expect(url.endsWith(`?v=${version}`)).toBe(true);
        }
      }

      const sourceJsFiles = readdirSync(path.join(REPO_ROOT, 'js')).filter((f) => f.endsWith('.js')).sort();
      const bundleJsFiles = readdirSync(path.join(outDir, 'js')).filter((f) => f.endsWith('.js')).sort();
      expect(bundleJsFiles).toEqual(sourceJsFiles);

      for (const file of bundleJsFiles) {
        const js = readFileSync(path.join(outDir, 'js', file), 'utf8');
        const unstampedImports = js.match(/\b(?:from|import)\s*["']\.\.?\/[^"']+?\.js["']/g);
        expect(unstampedImports).toBeNull();
        const unstampedAssets = js.match(/(?<=['"`(])(?:\.\.?\/)?assets\/[^'"`\r\n<>]+?\.(?:webp|png|jpg)(?=[)'"`])/g);
        expect(unstampedAssets).toBeNull();
      }

      stampDirectory(outDir, 'cafef00');
      const restampedMain = readFileSync(path.join(outDir, 'js', 'main.js'), 'utf8');
      expect(restampedMain).toContain("from './config.js?v=cafef00'");
      expect(restampedMain).not.toContain('deadbee');
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  test('CLI supports --bundle <outDir> [version] and in-place <version> [targetDir]', () => {
    const tmpBase = mkdtempSync(path.join(tmpdir(), 'roll-down-cli-'));
    const outDir = path.join(tmpBase, '_site');
    const scriptPath = path.join(REPO_ROOT, 'tools', 'stamp-version.mjs');

    try {
      const bundleRes = Bun.spawnSync(['bun', scriptPath, '--bundle', outDir, 'cli1234'], { cwd: REPO_ROOT });
      expect(bundleRes.exitCode).toBe(0);
      expect(readFileSync(path.join(outDir, 'index.html'), 'utf8')).toContain('src="js/main.js?v=cli1234"');

      const inplaceRes = Bun.spawnSync(['bun', scriptPath, 'cli5678', outDir], { cwd: REPO_ROOT });
      expect(inplaceRes.exitCode).toBe(0);
      expect(readFileSync(path.join(outDir, 'index.html'), 'utf8')).toContain('src="js/main.js?v=cli5678"');
      expect(readFileSync(path.join(outDir, 'js', 'main.js'), 'utf8')).toContain("from './config.js?v=cli5678'");
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });
});
