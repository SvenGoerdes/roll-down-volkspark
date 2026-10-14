import { CORRIDOR, WALL_H, WALL_D } from './config.js';
import { solidSegments, stripSource } from './logic.js';
import { TILE_W, TILE_H, TILE_UNITS, TILE_LEVELS } from './surfaces.js';
import { softDot, slab } from './sprites.js';
import { project, terrainDrop } from './view.js';
import { gabionFaces, horizonVeil, groundLight, valleySprite } from './environment-sprites.js';
import { arrivalAlpha, wallAlpha, depthMist } from './atmosphere.js';
import { star } from './render-fx.js';

export { computeView, project } from './view.js';

const rgb = ([r, g, b], k = 1) => `rgb(${(r * k) | 0},${(g * k) | 0},${(b * k) | 0})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function drawBackground(ctx, view, bg, prevBg, fade, playerX) {
  const bgH = view.horizonY + 16;
  const bgW = Math.max(view.W + 32, bgH * bg.width / bg.height);
  const x = view.cx - bgW / 2 - playerX * 3;
  const y = view.horizonY + 6 - bgH;
  if (prevBg && fade < 1) ctx.drawImage(prevBg, x, y, bgW, bgH);
  ctx.globalAlpha = prevBg ? fade : 1;
  ctx.drawImage(bg, x, y, bgW, bgH);
  ctx.globalAlpha = 1;
}

// Roadside grass a bit darker and greyer than the path, plus an earthy curb,
// so the path still reads when it is grass itself.
const roadside = new Map();
function sideColors(season) {
  if (!roadside.has(season)) {
    const [r, g, b] = season.grass, l = 0.3 * r + 0.59 * g + 0.11 * b;
    roadside.set(season, {
      grass: mix(season.grass, [l, l, l], 0.35).map((v) => v * 0.86),
    });
  }
  return roadside.get(season);
}

export function drawGround(ctx, view, season, travelled, surfaceAt, tiles) {
  const { W, H, horizonY, F, cx, groundRows } = view;
  const half = CORRIDOR / 2;
  const fogCss = rgb(season.fog);
  const side = sideColors(season);
  for (let y = horizonY; y < H; y += 2) {
    const z = groundRows[y + 1];
    const fog = depthMist(z);
    const stripe = 1;
    const verge = Math.sin((z + travelled) * 0.9) * 0.12 + Math.sin((z + travelled) * 2.3) * 0.06;
    const pw = ((half + verge) * F) / z;
    ctx.fillStyle = rgb(mix(side.grass, season.fog, fog), stripe);
    ctx.fillRect(0, y, W, 2);
    const mips = tiles && tiles[season.id]?.[surfaceAt(z + travelled).id];
    if (mips) {
      if (fog > 0.97) {
        ctx.fillStyle = fogCss;
        ctx.fillRect(cx - pw, y, pw * 2, 2);
        continue;
      }
      // map the tile in perspective: one slice of it per screen row
      const { level, parts } = stripSource(
        groundRows[y + 3] + travelled, z + travelled, TILE_UNITS, TILE_H, TILE_LEVELS,
      );
      const q = 2 ** level;
      for (const p of parts) {
        ctx.drawImage(mips[level], 0, p.sy / q, TILE_W >> level, p.sh / q, cx - pw, y + 2 * p.f0, pw * 2, 2 * (p.f1 - p.f0));
      }
      if (fog > 0.02) {
        ctx.globalAlpha = fog;
        ctx.fillStyle = fogCss;
        ctx.fillRect(cx - pw, y, pw * 2, 2);
        ctx.globalAlpha = 1;
      }
      continue;
    }
    ctx.fillStyle = rgb(mix(season.path, season.fog, fog), stripe);
    ctx.fillRect(cx - pw, y, pw * 2, 2);
  }
  ctx.drawImage(groundLight(season), 0, horizonY, W, H - horizonY);
}

// Cached mist softens the horizon without covering the painted skyline.
export function drawHorizon(ctx, view, season, prev, fade) {
  const valleyY = project(view, 0, 160).sy, valleyH = view.H * 0.10;
  if (prev && fade < 1) {
    ctx.globalAlpha = 1 - fade;
    ctx.drawImage(valleySprite(prev), -10, valleyY - valleyH * 0.8, view.W + 20, valleyH);
  }
  ctx.globalAlpha = prev ? fade : 1;
  ctx.drawImage(valleySprite(season), -10, valleyY - valleyH * 0.8, view.W + 20, valleyH);
  const y = view.horizonY - 22, h = 76;
  if (prev && fade < 1) {
    ctx.globalAlpha = 1 - fade;
    ctx.drawImage(horizonVeil(prev), 0, y, view.W, h);
  }
  ctx.globalAlpha = prev ? fade : 1;
  ctx.drawImage(horizonVeil(season), 0, y, view.W, h);
  ctx.globalAlpha = 1;
}

const fadeIn = arrivalAlpha;

function quad(ctx, x0, y0, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
}

// One pattern per face texture and one matrix for all of them, reused every frame.
const patterns = new Map();
let matrix;
function facePattern(ctx, img, sx, sy, x, y) {
  if (!patterns.has(img)) patterns.set(img, ctx.createPattern(img, 'repeat'));
  matrix ??= new DOMMatrix();
  matrix.a = sx;
  matrix.d = sy;
  matrix.e = x;
  matrix.f = y;
  const p = patterns.get(img);
  p.setTransform(matrix);
  return p;
}

export function drawWall(ctx, view, z, gaps, season) {
  const { top, front, side, fh, tileW } = gabionFaces(season);
  const f = project(view, 0, z), b = project(view, 0, z + WALL_D);
  // Gabion lids stay level; their rear foundation follows the falling terrain.
  const yT = f.sy - WALL_H * f.s, yB = f.sy;
  const yT2 = b.sy - (WALL_H + terrainDrop(z + WALL_D) - terrainDrop(z)) * b.s;
  const yB2 = b.sy, h = yB - yT;
  const X = (x, p) => view.cx + x * p.s;
  const origin = -CORRIDOR * 2;
  const alpha = wallAlpha(z), mist = depthMist(z) * 0.9;
  const snowy = season.id === 'winter';
  const groundAhead = Math.min(view.H, project(view, 0, Math.max(0.4, z - 0.7)).sy);
  const segs = solidSegments(gaps);
  const tint = () => {
    if (mist <= 0.02) return;
    ctx.globalAlpha = alpha * mist; ctx.fillStyle = rgb(season.fog); ctx.fill(); ctx.globalAlpha = alpha;
  };
  for (const [a, c] of segs) {
    const x0 = X(a, f), x1 = X(c, f), bx0 = X(a, b), bx1 = X(c, b);
    ctx.globalAlpha = alpha * 0.35 * (1 - mist);
    ctx.drawImage(slab(), x0 - h * 0.06, yB - 1, x1 - x0 + h * 0.12, Math.max(1, groundAhead - yB));
    // A short diagonal shadow at both cut ends clarifies the actual gap.
    ctx.fillStyle = rgb(season.shadow);
    for (const end of [a, c]) {
      if (Math.abs(end) > CORRIDOR / 2 + 1) continue;
      const x = X(end, f), drift = f.s * 0.45;
      quad(ctx, x - f.s * 0.06, yB, x + f.s * 0.08, yB, x + drift, groundAhead, x + drift - f.s * 0.15, groundAhead);
      ctx.fill();
    }
    ctx.globalAlpha = alpha;
    quad(ctx, x0, yT, x1, yT, bx1, yT2, bx0, yT2);
    ctx.fillStyle = snowy ? '#e4edf4'
      : facePattern(ctx, top, (tileW * f.s) / top.width, Math.max(0.01, yT - yT2) / top.height, view.cx + origin * f.s, yT2);
    ctx.fill(); tint();
    for (const end of [a, c]) {
      if ((end === c && end >= 0) || (end === a && end <= 0)) continue;
      const x = X(end, f), bx = X(end, b);
      quad(ctx, x, yT, bx, yT2, bx, yB2, x, yB);
      ctx.fillStyle = facePattern(ctx, side, (bx - x) / side.width, h / fh, x, yT);
      ctx.fill(); tint();
    }
    for (let k = Math.floor((a - origin) / tileW); origin + k * tileW < c; k++) {
      const t0 = Math.max(a, origin + k * tileW), t1 = Math.min(c, origin + (k + 1) * tileW);
      if (t1 <= t0) continue;
      const u0 = ((t0 - origin) / tileW - k) * front.width;
      const u1 = ((t1 - origin) / tileW - k) * front.width;
      ctx.drawImage(front, u0, 0, Math.max(1, u1 - u0), fh, X(t0, f), yT, (t1 - t0) * f.s + 0.5, h);
    }
    ctx.beginPath(); ctx.rect(x0, yT, x1 - x0, h); tint();
    ctx.fillStyle = rgb(season.rim);
    ctx.globalAlpha = alpha * (0.65 - mist * 0.3);
    ctx.fillRect(x0, yT, x1 - x0, Math.max(1, h * 0.016));
    // Cut posts stay inside the solid face: their visual bounds match collision.
    for (const end of [a, c]) {
      if (Math.abs(end) > CORRIDOR / 2 + 1) continue;
      const post = Math.max(1.5, f.s * 0.085), x = X(end, f) - (end === c ? post : 0);
      ctx.globalAlpha = alpha * (1 - mist * 0.7); ctx.fillStyle = '#293a3c';
      ctx.fillRect(x, yT, post, h);
      ctx.fillStyle = rgb(season.rim); ctx.fillRect(x, yT, Math.max(0.7, post * 0.28), h);
    }
    ctx.globalAlpha = alpha;
    if (snowy) {
      ctx.fillStyle = '#eff5f7';
      ctx.beginPath(); ctx.roundRect(x0, yT - h * 0.035, x1 - x0, h * 0.085, h * 0.03); ctx.fill();
      if (h > 18) {
        ctx.beginPath();
        for (let x = x0 + h * 0.4; x < x1; x += h * 0.8) {
          ctx.moveTo(x, yT + h * 0.03); ctx.lineTo(x + h * 0.015, yT + h * 0.14); ctx.lineTo(x + h * 0.035, yT + h * 0.03);
        }
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}

export function drawPuddle(ctx, view, p) {
  const { sx, sy, s } = project(view, p.x, p.z);
  ctx.globalAlpha = fadeIn(p.z) * 0.8;
  ctx.fillStyle = '#6f8fa8';
  ctx.beginPath();
  ctx.ellipse(sx, sy, p.r * s, p.r * s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(sx - p.r * s * 0.3, sy - p.r * s * 0.04, p.r * s * 0.35, p.r * s * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  // wet look: dark rim and a sky reflection streak
  ctx.strokeStyle = 'rgba(30,60,90,0.5)';
  ctx.lineWidth = Math.max(1, p.r * s * 0.05);
  ctx.beginPath();
  ctx.ellipse(sx, sy, p.r * s, p.r * s * 0.22, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(sx + p.r * s * 0.25, sy + p.r * s * 0.06, p.r * s * 0.5, p.r * s * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawPickup(ctx, view, item, look, time, icon) {
  const bob = 0.7 + Math.sin(time * 4 + item.z) * 0.15;
  const { sx, sy, s } = project(view, item.x, item.z, bob);
  const r = 0.72 * s;
  const fade = fadeIn(item.z), pulse = 0.5 + Math.sin(time * 6 + item.z) * 0.5;
  const ground = project(view, item.x, item.z);
  ctx.globalAlpha = fade * 0.5;
  ctx.drawImage(softDot('0,0,0'), ground.sx - r, ground.sy - r * 0.25, r * 2, r * 0.5);
  ctx.globalAlpha = fade * (0.35 + pulse * 0.3);
  ctx.drawImage(softDot(look.glow), sx - r * 2.3, sy - r * 2.3, r * 4.6, r * 4.6);
  ctx.globalAlpha = fade;
  // the painted icon floats in its glow and sways a little
  const d = r * 2.2 * (1 + pulse * 0.05), k = d / Math.max(icon.width, icon.height);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(Math.sin(time * 3 + item.z) * 0.12);
  ctx.drawImage(icon, (-icon.width * k) / 2, (-icon.height * k) / 2, icon.width * k, icon.height * k);
  ctx.restore();
  if (r > 5) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 2; i++) {
      const a = time * 2.5 + i * Math.PI;
      star(ctx, sx + Math.cos(a) * r * 1.35, sy + Math.sin(a) * r * 0.95, r * 0.22 * (0.6 + 0.4 * Math.sin(time * 9 + i * 2)));
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
