import { SURFACE_ORDER } from './config.js';
import { groundArt, surfaceArt } from './surface-art.js';

// Path textures, one per season and surface. A tile covers TILE_UNITS of world z
// and the whole corridor width, so drawGround can map it row by row in perspective.
export const TILE_W = 384;
export const TILE_H = 512;
export const TILE_UNITS = 8;
export const TILE_LEVELS = 4; // mip levels besides the full size

const rgba = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const shade = (c, k) => c.map((v) => Math.max(0, Math.min(255, v * k)));

function paintVerge(ctx, art, season, winter) {
  if (!art.verge) return;
  const layer = document.createElement('canvas');
  layer.width = TILE_W; layer.height = TILE_H;
  const lc = layer.getContext('2d');
  lc.drawImage(art.verge, 0, 0, TILE_W, TILE_H);
  lc.globalCompositeOperation = 'source-atop';
  lc.fillStyle = winter ? rgba(SNOW, 0.42) : rgba(season.grass, 0.2);
  lc.fillRect(0, 0, TILE_W, TILE_H);
  lc.globalCompositeOperation = 'source-over';
  const mask = lc.createLinearGradient(0, 0, TILE_W, 0);
  mask.addColorStop(0, 'rgba(255,255,255,0.9)');
  mask.addColorStop(0.16, 'rgba(255,255,255,0.65)');
  mask.addColorStop(0.36, 'rgba(255,255,255,0)');
  mask.addColorStop(0.64, 'rgba(255,255,255,0)');
  mask.addColorStop(0.84, 'rgba(255,255,255,0.65)');
  mask.addColorStop(1, 'rgba(255,255,255,0.9)');
  lc.globalCompositeOperation = 'destination-in'; lc.fillStyle = mask; lc.fillRect(0, 0, TILE_W, TILE_H);
  ctx.save(); ctx.globalAlpha = winter ? 0.42 : 0.72;
  ctx.drawImage(layer, 0, 0); ctx.restore();
}

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

// `berlin` selects the scrollable ground (#75): its own earth/verge art and marks that wrap at both tile edges.
function paint(ctx, id, season, rnd, berlin) {
  const art = berlin ? groundArt : surfaceArt;
  const winter = season.id === 'winter', autumn = season.id === 'autumn';
  // A mark crossing the bottom edge repeats at the top. Berlin ground (#75) passes
  // `wrap` = [above, below] extents so marks cross either edge; Volkspark stays as before.
  const put = (y, h, fn, wrap) => {
    const [above, below] = berlin && wrap ? wrap : [0, h];
    fn(y);
    if (y - above < 0) fn(y + TILE_H);
    if (y + below > TILE_H) fn(y - TILE_H);
  };
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
      const extent = Math.max(rx, ry) * k + 1;
      put(y, ry * k, (yy) => { ctx.beginPath(); ctx.ellipse(x, yy, rx * k, ry * k, rot, 0, 7); ctx.fill(); }, [extent, extent]);
    }
  };
  const leaves = (n) => blob(n, 5, 2.6, () => LEAVES[(rnd() * LEAVES.length) | 0]);

  if (id === 'dirt') {
    const base = winter ? mix(SNOW, season.path, 0.35) : shade(season.path, 0.95);
    ctx.fillStyle = rgba(base); ctx.fillRect(0, 0, TILE_W, TILE_H);
    if (art.earth) {
      ctx.drawImage(art.earth, 0, 0, TILE_W, TILE_H);
      paintVerge(ctx, art, season, winter);
      ctx.fillStyle = winter ? rgba(SNOW, 0.9) : rgba(season.path, 0.13);
      ctx.fillRect(0, 0, TILE_W, TILE_H);
    }
    if (winter) {
      // An uneven travelled track, with deep snow left at the roadside.
      ctx.fillStyle = rgba([118, 110, 103], 0.62);
      ctx.beginPath();
      const edge = (y, side) => {
        const phase = y / TILE_H * Math.PI * 2;
        return TILE_W * 0.5 + Math.sin(phase) * 13 + side * (64 + Math.sin(phase * 3 + side) * 7);
      };
      for (let y = 0; y <= TILE_H; y += 8) ctx.lineTo(edge(y, -1), y);
      for (let y = TILE_H; y >= 0; y -= 8) ctx.lineTo(edge(y, 1), y);
      ctx.closePath(); ctx.fill();
      if (art.earth) {
        ctx.save(); ctx.clip(); ctx.globalAlpha = 0.52;
        ctx.drawImage(art.earth, 0, 0, TILE_W, TILE_H);
        ctx.restore();
      }
    }
    else if (!art.earth) blob(40, 15, 6, () => rgba(shade(season.path, 0.8), 0.3));
    if (!art.earth) {
      speck(260, 2.2, () => rgba(shade(base, 0.72 + rnd() * 0.5), 0.55));
      blob(60, 3, 1.8, () => rgba(shade(base, 0.6), 0.6));
    }
    if (autumn) leaves(60);
    if (winter) blob(70, 4, 2, () => rgba([255, 255, 255], 0.7));
  } else if (id === 'gravel') {
    const base = winter ? [150, 152, 158] : mix([146, 142, 136], season.path, 0.15);
    ctx.fillStyle = rgba(base); ctx.fillRect(0, 0, TILE_W, TILE_H);
    if (art.earth) {
      ctx.drawImage(art.earth, 0, 0, TILE_W, TILE_H);
      ctx.fillStyle = rgba(base, winter ? 0.65 : 0.38);
      ctx.fillRect(0, 0, TILE_W, TILE_H);
    }
    paintVerge(ctx, art, season, winter);
    for (let i = 0; i < (art.earth ? 220 : 550); i++) {
      const x = rnd() * TILE_W, y = rnd() * TILE_H, r = 2 + rnd() * 4.2, g = 0.62 + rnd() * 0.7, rot = rnd() * 3;
      const col = shade(mix([150, 146, 140], [176, 160, 140], rnd()), g);
      put(y, r, (yy) => {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x + 0.8, yy + 1.2, r, r * 0.8, 0, 0, 7); ctx.fill();
        ctx.fillStyle = rgba(col); ctx.beginPath(); ctx.ellipse(x, yy, r, r * 0.8, rot, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x - r * 0.4, yy - r * 0.5, r * 0.7, r * 0.3);
        if (winter && i % 3 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x - r * 0.7, yy - r * 0.8, r * 1.4, r * 0.5); }
      }, [r * 2, r * 2]);
    }
    if (autumn) leaves(30);
  } else {
    const base = winter ? mix(SNOW, [190, 210, 200], 0.3) : shade(season.grass, 1.05);
    ctx.fillStyle = rgba(base); ctx.fillRect(0, 0, TILE_W, TILE_H);
    if (art.earth) {
      ctx.save(); ctx.globalAlpha = winter ? 0.12 : 0.3;
      ctx.drawImage(art.earth, 0, 0, TILE_W, TILE_H); ctx.restore();
    }
    blob(50, 24, 10, () => rgba(shade(base, 0.8 + rnd() * 0.4), 0.4));
    for (let i = 0; i < 900; i++) {
      const x = rnd() * TILE_W, y = rnd() * TILE_H, h = 4 + rnd() * 7, lean = (rnd() - 0.5) * 3;
      const col = winter ? mix([150, 175, 170], [225, 235, 240], rnd()) : shade(season.grass, 0.6 + rnd() * 0.8);
      ctx.strokeStyle = rgba(col, 0.85); ctx.lineWidth = 1.3;
      put(y, h, (yy) => { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + lean, yy - h); ctx.stroke(); }, [h + 1, 1]);
    }
    if (season.id === 'spring') blob(70, 2.2, 2.2, (i) => (i % 3 ? '#fff6f8' : '#ffd84a'));
    if (autumn) leaves(50);
  }
}

// Sunlit middle and soft woodland shade at the edges, baked into every mip.
function shadeEdges(ctx, season) {
  const light = ctx.createLinearGradient(0, 0, TILE_W, 0);
  light.addColorStop(0, rgba(season.shadow, 0.32));
  light.addColorStop(0.3, rgba(season.rim, 0.02));
  light.addColorStop(0.55, rgba(season.rim, 0.12));
  light.addColorStop(0.8, rgba(season.shadow, 0.08));
  light.addColorStop(1, rgba(season.shadow, 0.4));
  ctx.fillStyle = light; ctx.fillRect(0, 0, TILE_W, TILE_H);

}

function buildTile(season, si, k, id, berlin) {
  const c = document.createElement('canvas');
  c.width = TILE_W; c.height = TILE_H;
  paint(c.getContext('2d'), id, season, rngFor(1000 * si + k + 7), berlin);
  shadeEdges(c.getContext('2d'), season);
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
export function buildGroundTiles(seasons, first = 0, berlin = false) {
  const tiles = {};
  const jobs = [];
  seasons.forEach((season, si) => {
    tiles[season.id] = {};
    SURFACE_ORDER.forEach((id, k) => jobs.push({ season, si, k, id }));
  });
  const run = ({ season, si, k, id }) => { tiles[season.id][id] = buildTile(season, si, k, id, berlin); };
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
