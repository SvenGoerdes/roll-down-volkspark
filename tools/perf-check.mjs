// Performance check: plays Volkspark and Berlin-Tour at phone size with a 4x CPU throttle.
// bun tools/perf-check.mjs [--seconds 8] [--skip 36] [--port 8791] [--url http://host/]
// Needs macOS Chrome. Playwright installs itself on first run under bun. No worker traffic, no scores.
import { chromium } from 'playwright';

const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const seconds = Number(arg('seconds', 8));
const skip = Number(arg('skip', 36)); // start this many walls in, so Volkspark shows its landmark walls too
const port = Number(arg('port', 8791));
let url = arg('url', null);

if (!url) {
  const root = new URL('..', import.meta.url).pathname;
  Bun.serve({
    port, hostname: '127.0.0.1',
    async fetch(req) {
      let p = new URL(req.url).pathname;
      if (p.endsWith('/')) p += 'index.html';
      const file = Bun.file(root + decodeURIComponent(p).replace(/^\/+/, ''));
      return (await file.exists()) ? new Response(file, { headers: { 'Cache-Control': 'no-store' } }) : new Response('not found', { status: 404 });
    },
  });
  url = `http://127.0.0.1:${port}/`;
}

const stats = (xs) => {
  const s = [...xs].sort((a, b) => a - b), at = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  return { median: at(0.5), p95: at(0.95), max: s[s.length - 1] };
};
const ms = (n) => n.toFixed(1).padStart(6);

// Runs in the page: keeps the player alive by steering through the nearest gap, records frame gaps.
function play({ seconds, skip }) {
  return new Promise((resolve) => {
    const g = window.rollDown.game();
    g.passed = skip; g.spawned = skip; g.walls = [];
    const gaps = [], end = performance.now() + seconds * 1000;
    let last = 0;
    (function tick(now) {
      if (last) gaps.push(now - last);
      last = now;
      const w = g.walls.filter((x) => x.z > 2).sort((a, b) => a.z - b.z)[0];
      if (w) { g.player.x = w.gaps[0].x; g.player.vx = 0; }
      g.player.helmets = 3;
      if (now < end) requestAnimationFrame(tick); else resolve(gaps);
    })(performance.now());
  });
}

// Runs in the page: update + render of the game's own step(), back to back at 60 fps game time.
function stepCost(frames) {
  const costs = [];
  for (let i = 0; i < frames; i++) {
    window.rollDown.game().player.helmets = 3;
    const t = performance.now();
    window.rollDown.step(1 / 60);
    costs.push(performance.now() - t);
  }
  return costs;
}

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
console.log(`${seconds} s per theme, 390x844 @2x, CPU 4x slower, from wall ${skip}`);
console.log('theme         frame median   p95    max | update+render median   p95    max  (ms)');
for (const [id, label] of [['volkspark', 'Volkspark'], ['berlin-tour', 'Berlin-Tour']]) {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await page.route(/workers\.dev/, (r) => r.abort());
  page.on('pageerror', (e) => console.log('page error:', e.message));
  await page.goto(`${url}#debug`);
  await page.waitForFunction(() => window.rollDown && document.querySelector('#themes button'), null, { timeout: 30000 });
  await page.click(`#themes button:nth-child(${id === 'volkspark' ? 1 : 2})`);
  await page.waitForFunction(() => !document.querySelector('#themes button')?.disabled, null, { timeout: 30000 });
  await page.evaluate(() => window.rollDown.start());
  await page.waitForTimeout(500);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const frame = stats(await page.evaluate(play, { seconds, skip }));
  const cost = stats(await page.evaluate(stepCost, Math.round(seconds * 30)));
  console.log(`${label.padEnd(13)}${ms(frame.median)} ${ms(frame.p95)} ${ms(frame.max)} |${ms(cost.median)} ${ms(cost.p95)} ${ms(cost.max)}`);
  await page.context().close();
}
await browser.close();
process.exit(0);
