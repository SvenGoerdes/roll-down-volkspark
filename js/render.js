import { CORRIDOR, WALL_H, PLAYER_Z, SPAWN_Z } from './config.js';
import { solidSegments, stripSource } from './logic.js';
import { TILE_W, TILE_H, TILE_UNITS, TILE_LEVELS } from './surfaces.js';
import { softDot, slab, gabionFaces, hedgeSprite } from './sprites.js';
import { project } from './view.js';
import { star } from './render-fx.js';

export { computeView, project } from './view.js';

const BG_RATIO = 685 / 900;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rgb = ([r, g, b], k = 1) => `rgb(${(r * k) | 0},${(g * k) | 0},${(b * k) | 0})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function drawBackground(ctx, view, bg, prevBg, fade, playerX) {
  const bgH = Math.max(view.horizonY * 1.04, view.W * 1.15 * BG_RATIO);
  const bgW = bgH / BG_RATIO;
  const x = view.cx - bgW / 2 - playerX * 4;
  const y = view.horizonY - bgH + 6;
  ctx.fillStyle = '#cfd4d6';
  ctx.fillRect(0, 0, view.W, view.horizonY + 6);
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
      curb: mix(season.path, [40, 34, 28], 0.55),
    });
  }
  return roadside.get(season);
}

export function drawGround(ctx, view, season, travelled, surfaceAt, tiles) {
  const { W, H, horizonY, F, CH, cx } = view;
  const half = CORRIDOR / 2;
  const fogCss = rgb(season.fog);
  const side = sideColors(season);
  for (let y = horizonY; y < H; y += 2) {
    const z = (CH * F) / (y - horizonY + 1);
    const fog = clamp((z - 12) / 70, 0, 1) ** 0.7;
    const stripe = Math.floor((z + travelled) / 2.5) % 2 ? 0.93 : 1;
    const pw = (half * F) / z;
    const edge = (0.35 * F) / z;
    ctx.fillStyle = rgb(mix(side.grass, season.fog, fog), stripe);
    ctx.fillRect(0, y, W, 2);
    ctx.fillStyle = rgb(mix(side.curb, season.fog, fog), stripe);
    ctx.fillRect(cx - pw - edge, y, pw * 2 + edge * 2, 2);
    const mips = tiles && tiles[season.id]?.[surfaceAt(z + travelled).id];
    if (mips) {
      if (fog > 0.97) {
        ctx.fillStyle = fogCss;
        ctx.fillRect(cx - pw, y, pw * 2, 2);
        continue;
      }
      // map the tile in perspective: one slice of it per screen row
      const { level, parts } = stripSource(
        (CH * F) / (y + 2 - horizonY + 1) + travelled, z + travelled, TILE_UNITS, TILE_H, TILE_LEVELS,
      );
      const q = 2 ** level;
      for (const p of parts) {
        ctx.drawImage(mips[level], 0, p.sy / q, TILE_W >> level, p.sh / q, cx - pw, y + 2 * p.f0, pw * 2, 2 * (p.f1 - p.f0));
      }
      if (stripe < 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        ctx.fillRect(cx - pw, y, pw * 2, 2);
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
  // soften the seam between photo and ground
  const seam = ctx.createLinearGradient(0, horizonY - 24, 0, horizonY + 30);
  const [r, g, b] = season.fog;
  seam.addColorStop(0, `rgba(${r},${g},${b},0)`);
  seam.addColorStop(0.45, `rgba(${r},${g},${b},0.75)`);
  seam.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = seam;
  ctx.fillRect(0, horizonY - 24, W, 54);
}

function treeLine(ctx, view, season, playerX, alpha) {
  const img = hedgeSprite(season);
  const h = Math.max(24, view.H * 0.04), w = (img.width / img.height) * h;
  const y = view.horizonY - h * 0.62;
  ctx.globalAlpha = alpha;
  for (let x = ((-playerX * 7) % w) - w; x < view.W; x += w) ctx.drawImage(img, x, y, w + 0.5, h);
  ctx.globalAlpha = 1;
}

// Distant tree line on the horizon; it drifts a bit more than the photo for some parallax.
export function drawHorizon(ctx, view, season, prev, fade, playerX) {
  if (prev && fade < 1) treeLine(ctx, view, prev, playerX, 0.8 * (1 - fade));
  treeLine(ctx, view, season, playerX, 0.8 * (prev ? fade : 1));
}

const fadeIn = (z) => clamp((SPAWN_Z - z) / 18, 0, 1);
// walls already passed fade out so they don't hide the player
const fadeOut = (z) => clamp((z - 1) / (PLAYER_Z - 1.5), 0, 1);

const WALL_D = 1.1; // depth of a gabion basket
const haze = (z) => clamp((z - 12) / 70, 0, 1) ** 0.7; // same curve as the ground fog

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

function snowTop(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#d9e2ee');
  g.addColorStop(1, '#f8fbff');
  return g;
}

export function drawWall(ctx, view, z, gaps, tex, snowy, fog = [128, 128, 128]) {
  const { top, front, side, fh } = gabionFaces(tex);
  const f = project(view, 0, z), b = project(view, 0, z + WALL_D);
  const lid = (p) => view.horizonY + (view.CH - WALL_H) * p.s;
  const yT = lid(f), yB = f.sy, yT2 = lid(b), yB2 = b.sy, h = yB - yT;
  const X = (x, p) => view.cx + x * p.s;
  // tile the photo from a fixed world origin so it doesn't swim
  const tileW = WALL_H * (tex.width / fh), origin = -CORRIDOR * 2;
  const sideW = (WALL_D / tileW) * tex.width;
  const alpha = Math.min(fadeIn(z), fadeOut(z)), mist = haze(z);
  const groundAhead = Math.min(view.H, view.horizonY + (view.CH * view.F) / Math.max(0.4, z - 0.5));
  const segs = solidSegments(gaps);
  for (const [a, c] of segs) {
    const x0 = X(a, f), x1 = X(c, f), bx0 = X(a, b), bx1 = X(c, b);
    ctx.globalAlpha = alpha * 0.4 * (1 - mist);
    ctx.drawImage(slab(), x0 - h * 0.12, yB - h * 0.02, x1 - x0 + h * 0.24, groundAhead - yB);
    ctx.globalAlpha = alpha;
    quad(ctx, x0, yT, x1, yT, bx1, yT2, bx0, yT2);
    ctx.fillStyle = snowy ? snowTop(ctx, yT2, yT)
      : facePattern(ctx, top, (tileW * f.s) / tex.width, (yT - yT2) / top.height, view.cx + origin * f.s, yT2);
    ctx.fill();
    if (c < 0) {
      quad(ctx, x1, yT, bx1, yT2, bx1, yB2, x1, yB);
      ctx.fillStyle = facePattern(ctx, side, (bx1 - x1) / sideW, h / fh, x1, yT);
      ctx.fill();
    }
    if (a > 0) {
      quad(ctx, x0, yT, bx0, yT2, bx0, yB2, x0, yB);
      ctx.fillStyle = facePattern(ctx, side, (bx0 - x0) / sideW, h / fh, x0, yT);
      ctx.fill();
    }
    for (let k = Math.floor((a - origin) / tileW); origin + k * tileW < c; k++) {
      const t0 = Math.max(a, origin + k * tileW);
      const t1 = Math.min(c, origin + (k + 1) * tileW);
      if (t1 <= t0) continue;
      const u0 = ((t0 - origin) / tileW - k) * tex.width;
      const u1 = ((t1 - origin) / tileW - k) * tex.width;
      ctx.drawImage(front, u0, 0, Math.max(1, u1 - u0), fh, view.cx + t0 * f.s, yT, (t1 - t0) * f.s + 0.5, h);
    }
    // catch light on the top edge
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x0, yT, x1 - x0, Math.max(1, h * 0.025));
    if (snowy) {
      ctx.fillStyle = '#f7faff';
      ctx.beginPath();
      ctx.roundRect(x0 - h * 0.02, yT - h * 0.04, x1 - x0 + h * 0.04, h * 0.1, h * 0.05);
      ctx.fill();
    }
  }
  if (mist > 0.02) {
    ctx.globalAlpha = alpha * mist * 0.9;
    ctx.fillStyle = rgb(fog);
    for (const [a, c] of segs) {
      const l = Math.min(X(a, f), X(a, b)), r = Math.max(X(c, f), X(c, b));
      ctx.fillRect(l, yT2 - h * 0.05, r - l, yB - yT2 + h * 0.05);
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
