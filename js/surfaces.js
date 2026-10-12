import { SURFACE_ORDER } from './config.js';

// Path textures, one per season and surface. A tile covers TILE_UNITS of world z
// and the whole corridor width, so drawGround can map it row by row in perspective.
export const TILE_W = 256;
export const TILE_H = 512;
export const TILE_UNITS = 8;
export const TILE_LEVELS = 4; // mip levels besides the full size

const rgba = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const shade = (c, k) => c.map((v) => Math.max(0, Math.min(255, v * k)));

function rngFor(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SNOW = [238, 243, 250];
const LEAVES = ['#d9822b', '#c4561d', '#e8b33a', '#8f3b1b'];

function paint(ctx, id, season, rnd) {
  const winter = season.id === 'winter', autumn = season.id === 'autumn';
  // draw twice so specks crossing the bottom edge wrap to the top
  const put = (y, h, fn) => { fn(y); if (y + h > TILE_H) fn(y - TILE_H); };
  const speck = (n, size, color) => {
    for (let i = 0; i < n; i++) {
      const x = rnd() * TILE_W, y = rnd() * TILE_H, w = size * (0.5 + rnd()), h = w * (0.6 + rnd() * 0.6);
      ctx.fillStyle = color(i);
      put(y, h, (yy) => ctx.fillRect(x, yy, w, h));
    }
  };
  const blob = (n, rx, ry, color) => {
    for (let i = 0; i < n; i++) {
      const x = rnd() * TILE_W, y = rnd() * TILE_H, k = 0.6 + rnd() * 0.8, rot = rnd() * 3;
      ctx.fillStyle = color(i);
      put(y, ry * k, (yy) => { ctx.beginPath(); ctx.ellipse(x, yy, rx * k, ry * k, rot, 0, 7); ctx.fill(); });
    }
  };
  const leaves = (n) => blob(n, 5, 2.6, () => LEAVES[(rnd() * LEAVES.length) | 0]);

  if (id === 'dirt') {
    const base = winter ? mix(SNOW, season.path, 0.35) : shade(season.path, 0.95);
    ctx.fillStyle = rgba(base); ctx.fillRect(0, 0, TILE_W, TILE_H);
    if (winter) blob(120, 7, 3, () => rgba([128, 104, 82], 0.4));
    else blob(40, 15, 6, () => rgba(shade(season.path, 0.8), 0.3));
    speck(900, 2.2, () => rgba(shade(base, 0.72 + rnd() * 0.5), 0.55));
    blob(60, 3, 1.8, () => rgba(shade(base, 0.6), 0.6));
    if (autumn) leaves(60);
    if (winter) blob(70, 4, 2, () => rgba([255, 255, 255], 0.7));
  } else if (id === 'gravel') {
    const base = winter ? [150, 152, 158] : mix([146, 142, 136], season.path, 0.15);
    ctx.fillStyle = rgba(base); ctx.fillRect(0, 0, TILE_W, TILE_H);
    for (let i = 0; i < 1500; i++) {
      const x = rnd() * TILE_W, y = rnd() * TILE_H, r = 2 + rnd() * 4.2, g = 0.62 + rnd() * 0.7, rot = rnd() * 3;
      const col = shade(mix([150, 146, 140], [176, 160, 140], rnd()), g);
      put(y, r, (yy) => {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x + 0.8, yy + 1.2, r, r * 0.8, 0, 0, 7); ctx.fill();
        ctx.fillStyle = rgba(col); ctx.beginPath(); ctx.ellipse(x, yy, r, r * 0.8, rot, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x - r * 0.4, yy - r * 0.5, r * 0.7, r * 0.3);
        if (winter && i % 3 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x - r * 0.7, yy - r * 0.8, r * 1.4, r * 0.5); }
      });
    }
    if (autumn) leaves(30);
  } else {
    const base = winter ? mix(SNOW, [190, 210, 200], 0.3) : shade(season.grass, 1.05);
    ctx.fillStyle = rgba(base); ctx.fillRect(0, 0, TILE_W, TILE_H);
    blob(50, 24, 10, () => rgba(shade(base, 0.8 + rnd() * 0.4), 0.4));
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * TILE_W, y = rnd() * TILE_H, h = 4 + rnd() * 7, lean = (rnd() - 0.5) * 3;
      const col = winter ? mix([150, 175, 170], [225, 235, 240], rnd()) : shade(season.grass, 0.6 + rnd() * 0.8);
      ctx.strokeStyle = rgba(col, 0.85); ctx.lineWidth = 1.3;
      put(y, h, (yy) => { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + lean, yy - h); ctx.stroke(); });
    }
    if (season.id === 'spring') blob(70, 2.2, 2.2, (i) => (i % 3 ? '#fff6f8' : '#ffd84a'));
    if (autumn) leaves(50);
  }
}

function buildTile(season, si, k, id) {
  const c = document.createElement('canvas');
  c.width = TILE_W; c.height = TILE_H;
  paint(c.getContext('2d'), id, season, rngFor(1000 * si + k + 7));
  // smaller copies keep far rows from aliasing into streaks
  const mips = [c];
  for (let l = 1; l <= TILE_LEVELS; l++) {
    const m = document.createElement('canvas');
    m.width = TILE_W >> l; m.height = TILE_H >> l;
    const mctx = m.getContext('2d');
    mctx.imageSmoothingQuality = 'high';
    mctx.drawImage(mips[l - 1], 0, 0, m.width, m.height);
    mips.push(m);
  }
  return mips;
}

// Tiles fill in as they are built: `tiles[seasonId][surfaceId]` may still be missing,
// drawGround then falls back to flat colors. The first season is ready on return,
// the others follow one tile per frame.
export function buildGroundTiles(seasons, first = 0) {
  const tiles = {};
  const jobs = [];
  seasons.forEach((season, si) => {
    tiles[season.id] = {};
    SURFACE_ORDER.forEach((id, k) => jobs.push({ season, si, k, id }));
  });
  const run = ({ season, si, k, id }) => { tiles[season.id][id] = buildTile(season, si, k, id); };
  jobs.filter((j) => j.si === first).forEach(run);
  const rest = jobs.filter((j) => j.si !== first);
  const next = () => {
    const job = rest.shift();
    if (!job) return;
    run(job);
    requestAnimationFrame(next);
  };
  requestAnimationFrame(next);
  return tiles;
}
