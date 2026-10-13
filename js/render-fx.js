import { SCENERY_FAR, hash } from './scenery.js';
import { project } from './view.js';
import {
  softDot, bushSprite, treeSprite, hedgeSprite, BUSH_ASPECT, TREE_ASPECT, paintGrade,
} from './sprites.js';

// Scene-wide extras: roadside plants, weather particles, speed lines, season light, debris.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function star(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
}

const dots = new Map();
const dotFor = (hex) => {
  if (!dots.has(hex)) {
    const tint = /^#[0-9a-f]{6}$/i.test(hex) ? [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',') : '255,255,255';
    dots.set(hex, softDot(tint, 1, 16));
  }
  return dots.get(hex);
};

export function drawParticles(ctx, particles) {
  const m = ctx.getTransform();
  for (const p of particles) {
    if (!p.leaf && !p.petal) {
      const d = p.size * 2.6;
      ctx.drawImage(dotFor(p.color), p.x - d / 2, p.y - d / 2, d, d);
      continue;
    }
    // leaves and petals tumble: spin plus a fake 3D flip
    const cos = Math.cos(p.rot), sin = Math.sin(p.rot);
    const flip = 0.25 + 0.75 * Math.abs(Math.cos(p.rot * 1.7));
    ctx.setTransform(
      (m.a * cos + m.c * sin) * flip, (m.b * cos + m.d * sin) * flip,
      m.c * cos - m.a * sin, m.d * cos - m.b * sin,
      m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f,
    );
    const r = p.size * 1.2;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    if (p.leaf) {
      ctx.moveTo(-r, 0);
      ctx.quadraticCurveTo(0, -r * 0.75, r, 0);
      ctx.quadraticCurveTo(0, r * 0.75, -r, 0);
    } else ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.setTransform(m);
}

// Paint every season's plants up front, so no frame stalls when a new season comes into view.
export function warmUp(seasons) {
  for (const s of seasons) {
    for (const v of [0, 1, 2]) {
      bushSprite(s.id, v);
      treeSprite(s.id, v);
    }
    hedgeSprite(s);
  }
}

const PLANT = { bush: [2.3, BUSH_ASPECT, 0.875], tree: [5.6, TREE_ASPECT, 0.978] };

export function drawScenery(ctx, view, item, seasonId) {
  const p = project(view, item.x, item.z);
  const [width, aspect, foot] = PLANT[item.kind];
  const w = width * item.size * p.s, h = w * aspect;
  if (p.sx + w / 2 < 0 || p.sx - w / 2 > view.W) return;
  const img = (item.kind === 'tree' ? treeSprite : bushSprite)(seasonId, item.variant);
  ctx.globalAlpha = clamp((SCENERY_FAR - item.z) / 16, 0, 1);
  // mirror every other plant so the few sprites don't repeat visibly
  if (item.id % 2) ctx.drawImage(img, p.sx - w / 2, p.sy - h * foot, w, h);
  else {
    ctx.save();
    ctx.translate(p.sx, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, p.sy - h * foot, w, h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// Thin wedges racing out of the vanishing point over the ground once the hill gets fast.
export function drawSpeedLines(ctx, view, speed, time) {
  const k = clamp((speed - 23) / 15, 0, 1);
  if (k <= 0) return;
  const R = Math.hypot(view.W, view.H);
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.16 + k * 0.34;
  ctx.beginPath();
  for (let i = 0; i < 36; i++) {
    const t = time * (1.4 + (i % 5) * 0.3) + i * 0.618;
    const cycle = Math.floor(t), ph = t - cycle;
    const a = (0.04 + hash(i * 31 + cycle) * 0.92) * Math.PI; // ground only, not across the photo
    const r0 = R * (0.12 + ph * 0.6), r1 = r0 + R * (0.1 + ph * 0.3) * (0.5 + k);
    const wide = (0.6 + ph * 3.2) / r1;
    const cos = Math.cos(a), sin = Math.sin(a);
    ctx.moveTo(view.cx + cos * r0, view.horizonY + sin * r0);
    ctx.lineTo(view.cx + Math.cos(a + wide) * r1, view.horizonY + Math.sin(a + wide) * r1);
    ctx.lineTo(view.cx + Math.cos(a - wide) * r1, view.horizonY + Math.sin(a - wide) * r1);
    ctx.closePath();
  }
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Soft gradients, so half resolution is plenty. Keeps three: the season fading out,
// the current one and the next one, which gets painted ahead of time.
const grades = new Map();
const grade = (id, view, dpr) => {
  const w = Math.round((view.W * dpr) / 2), h = Math.round((view.H * dpr) / 2);
  const key = `${id}:${w}x${h}`;
  if (!grades.has(key)) {
    if (grades.size >= 3) grades.delete(grades.keys().next().value);
    grades.set(key, paintGrade(id, w, h));
  }
  return grades.get(key);
};

// Paint a season's light before it is needed, so no frame has to.
export const primeGrade = (view, dpr, id) => { grade(id, view, dpr); };

// Season light and vignette over the whole scene, in device pixels (and unshaken).
export function drawGrade(ctx, view, season, prev, fade) {
  const m = ctx.getTransform(), dpr = m.a;
  const W = Math.round(view.W * dpr), H = Math.round(view.H * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // plain 2x pixel doubling: invisible on a soft gradient and much cheaper without a GPU
  ctx.imageSmoothingEnabled = false;
  if (prev && fade < 1) {
    ctx.globalAlpha = 1 - fade;
    ctx.drawImage(grade(prev.id, view, dpr), 0, 0, W, H);
    ctx.globalAlpha = fade;
  }
  ctx.drawImage(grade(season.id, view, dpr), 0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = true;
  ctx.setTransform(m);
}

const STONE = [[1, 0], [0.5, 0.85], [-0.45, 0.8], [-1, 0.1], [-0.6, -0.75], [0.4, -0.9]];

export function drawFx(ctx, fx) {
  for (const f of fx) {
    const t = f.life / f.max, size = f.size * (1 + f.grow * t);
    if (f.kind === 'dust') {
      ctx.globalAlpha = 0.4 * (1 - t);
      ctx.drawImage(softDot(f.color), f.x - size, f.y - size, size * 2, size * 2);
      continue;
    }
    if (f.kind === 'ring') {
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 1 + 4 * (1 - t);
      ctx.beginPath();
      ctx.arc(f.x, f.y, size, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    ctx.globalAlpha = f.kind === 'spark' ? 1 - t : Math.min(1, (1 - t) * 4);
    ctx.fillStyle = f.color;
    if (f.kind === 'spark') {
      star(ctx, f.x, f.y, size);
      ctx.fill();
      continue;
    }
    const cos = Math.cos(f.rot) * size, sin = Math.sin(f.rot) * size;
    ctx.beginPath();
    for (const [u, v] of STONE) ctx.lineTo(f.x + u * cos - v * sin, f.y + u * sin + v * cos);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.arc(f.x - size * 0.25, f.y - size * 0.3, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
