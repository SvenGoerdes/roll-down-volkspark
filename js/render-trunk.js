// Full-width tree trunks (ADR 0082): a dark bark log on the ground to jump over,
// a pale birch at head height to slide under. Painted once per kind, then tiled along the wall line.
import { CORRIDOR, TRUNKS } from './config.js';
import { makeCanvas, seeded, slab } from './sprites.js';
import { project } from './view.js';
import { wallAlpha, depthMist } from './atmosphere.js';

const TILE_UNITS = 5, TILES = 5, TW = 320, TH = 64;
const LOOK = {
  low: { stops: ['#c39562', '#6f4f33', '#2c1e15'], mark: 'rgba(28,18,10,0.55)', edge: '#22160e' },
  high: { stops: ['#fbf7ea', '#e2dccb', '#98917f'], mark: 'rgba(38,34,30,0.9)', edge: '#3a352e' },
};
const STUBS = [[-3.1, 0.18, 0.42], [-0.8, -0.14, 0.3], [1.7, 0.2, 0.46], [3.4, -0.1, 0.28]]; // x, lean, length
const sprites = {};

function paint(kind) {
  const look = LOOK[kind], c = makeCanvas(TW, TH), g = c.getContext('2d'), rnd = seeded(kind === 'low' ? 7 : 19);
  const grad = g.createLinearGradient(0, 0, 0, TH);
  grad.addColorStop(0, look.stops[0]); grad.addColorStop(0.45, look.stops[1]); grad.addColorStop(1, look.stops[2]);
  g.fillStyle = grad;
  g.fillRect(0, 0, TW, TH);
  g.strokeStyle = look.mark; g.fillStyle = look.mark; g.lineCap = 'round';
  if (kind === 'low') {
    // Bark grooves run the whole tile with whole-number waves, so tiles join without a seam.
    for (let i = 0; i < 8; i++) {
      const y = 7 + i * 7 + rnd() * 3, waves = 1 + Math.floor(rnd() * 3), phase = rnd() * 6;
      g.lineWidth = 1.5 + rnd() * 2;
      g.beginPath();
      for (let x = 0; x <= TW; x += 8) g.lineTo(x, y + Math.sin((x / TW) * Math.PI * 2 * waves + phase) * 2.2);
      g.stroke();
    }
    for (const [x, y, r] of [[70, 34, 9], [215, 26, 7]]) {
      g.lineWidth = 2;
      g.beginPath(); g.ellipse(x, y, r * 1.5, r, 0, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.ellipse(x, y, r * 0.6, r * 0.4, 0, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(122,150,62,0.85)'; // moss on the lit top
    for (let i = 0; i < 9; i++) {
      const x = 20 + rnd() * (TW - 40);
      g.beginPath(); g.ellipse(x, 4 + rnd() * 3, 9 + rnd() * 14, 3 + rnd() * 3, 0, 0, Math.PI * 2); g.fill();
    }
  } else {
    // Birch: short dark dashes and a few larger "eyes".
    for (let i = 0; i < 26; i++) {
      const x = 12 + rnd() * (TW - 24), y = 6 + rnd() * (TH - 12), w = 5 + rnd() * 16;
      g.lineWidth = 1.5 + rnd() * 2.5;
      g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y + (rnd() - 0.5) * 2); g.stroke();
    }
    for (const [x, y] of [[58, 30], [150, 40], [262, 24]]) {
      g.beginPath(); g.ellipse(x, y, 11, 5, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(x - 22, y - 2); g.quadraticCurveTo(x, y - 12, x + 22, y - 2); g.lineWidth = 2.5; g.stroke();
    }
  }
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(0, 3, TW, 3);
  g.fillStyle = look.edge; g.fillRect(0, 0, TW, 3); g.fillRect(0, TH - 4, TW, 4);
  return c;
}

export const trunkSprite = (kind) => (sprites[kind] ??= paint(kind));
export const warmTrunks = () => { trunkSprite('low'); trunkSprite('high'); };

export function drawTrunk(ctx, view, wall, season) {
  const high = wall.trunk === 'high', z = wall.z;
  const p = project(view, 0, z);
  const h = (high ? TRUNKS.thick : TRUNKS.lowH) * p.s;
  const yB = p.sy - (high ? TRUNKS.highY : 0) * p.s, yT = yB - h;
  const X = (x) => p.sx + x * p.s;
  const alpha = wallAlpha(z), mist = depthMist(z) * 0.9;
  const half = (TILES * TILE_UNITS) / 2, x0 = X(-half), w = 2 * half * p.s;
  const groundAhead = Math.min(view.H, project(view, 0, Math.max(0.4, z - 0.7)).sy);
  // The raised birch throws a fainter shadow with daylight under it: that gap is what says "slide".
  ctx.globalAlpha = alpha * (high ? 0.2 : 0.38) * (1 - mist);
  ctx.drawImage(slab(), x0, p.sy - 1, w, Math.max(1, groundAhead - p.sy));
  ctx.globalAlpha = alpha;
  if (high) {
    // Crossed stakes just outside the path carry the birch.
    ctx.strokeStyle = '#4a3524'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, p.s * 0.17);
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const x = side * (CORRIDOR / 2 + 0.6);
      for (const lean of [-0.4, 0.4]) { ctx.moveTo(X(x + lean), p.sy); ctx.lineTo(X(x - lean), yT - p.s * 0.3); }
    }
    ctx.stroke();
  }
  else {
    // Broken branch stubs give the lying log a tree silhouette against the path.
    ctx.strokeStyle = '#3a2819'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, p.s * 0.13);
    ctx.beginPath();
    for (const [x, lean, len] of STUBS) { ctx.moveTo(X(x), yT + h * 0.2); ctx.lineTo(X(x + lean), yT - len * p.s); }
    ctx.stroke();
  }
  const img = trunkSprite(wall.trunk), tw = TILE_UNITS * p.s;
  for (let k = 0; k < TILES; k++) {
    const x = x0 + k * tw;
    if (x + tw > 0 && x < view.W) ctx.drawImage(img, x, yT, tw + 0.5, h);
  }
  if (wall.snowy) { ctx.fillStyle = '#eff5f7'; ctx.fillRect(x0, yT - h * 0.08, w, h * 0.24); }
  ctx.globalAlpha = alpha * (0.6 - mist * 0.3); // sunlit top edge, as on the walls
  ctx.fillStyle = `rgb(${season.rim})`; ctx.fillRect(x0, yT, w, Math.max(1, h * 0.05));
  ctx.globalAlpha = alpha;
  if (mist > 0.02) {
    const [r, g, b] = season.fog;
    ctx.globalAlpha = alpha * mist; ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(x0, yT, w, h);
  }
  ctx.globalAlpha = 1;
}
