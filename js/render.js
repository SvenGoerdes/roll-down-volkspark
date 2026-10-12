import { CORRIDOR, WALL_H, PLAYER_R, PLAYER_Z, SPAWN_Z, PLAYER_SCREEN_Y, HORIZON } from './config.js';
import { solidSegments } from './logic.js';
import { SCENERY_FAR, hash } from './scenery.js';
import { paintPlayer, headOffset } from './player.js';
import {
  softDot, slab, gabionFaces, bushSprite, treeSprite, BUSH_ASPECT, TREE_ASPECT,
  pickupSprite, paintGrade, hedgeSprite,
} from './sprites.js';

const BG_RATIO = 685 / 900;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rgb = ([r, g, b], k = 1) => `rgb(${(r * k) | 0},${(g * k) | 0},${(b * k) | 0})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function computeView(W, H) {
  const horizonY = Math.round(H * HORIZON);
  // corridor fills ~96% of the width at the player's depth
  const F = (0.96 * W * PLAYER_Z) / CORRIDOR;
  const CH = ((H * PLAYER_SCREEN_Y - horizonY) * PLAYER_Z) / F;
  return { W, H, cx: W / 2, horizonY, F, CH };
}

export function project(view, x, z, y = 0) {
  const s = view.F / z;
  return { sx: view.cx + x * s, sy: view.horizonY + (view.CH - y) * s, s };
}

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

export function drawGround(ctx, view, season, travelled) {
  const { W, H, horizonY, F, CH, cx } = view;
  const half = CORRIDOR / 2;
  for (let y = horizonY; y < H; y += 2) {
    const z = (CH * F) / (y - horizonY + 1);
    const fog = clamp((z - 12) / 70, 0, 1) ** 0.7;
    const stripe = Math.floor((z + travelled) / 2.5) % 2 ? 0.93 : 1;
    const pw = (half * F) / z;
    const edge = (0.35 * F) / z;
    ctx.fillStyle = rgb(mix(season.grass, season.fog, fog), stripe);
    ctx.fillRect(0, y, W, 2);
    ctx.fillStyle = rgb(mix(season.grass, season.fog, fog), stripe * 0.78);
    ctx.fillRect(cx - pw - edge, y, pw * 2 + edge * 2, 2);
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

const patterns = new Map();
function facePattern(ctx, img, m) {
  if (!patterns.has(img)) patterns.set(img, ctx.createPattern(img, 'repeat'));
  const p = patterns.get(img);
  p.setTransform(new DOMMatrix(m));
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
      : facePattern(ctx, top, [(tileW * f.s) / tex.width, 0, 0, (yT - yT2) / top.height, view.cx + origin * f.s, yT2]);
    ctx.fill();
    if (c < 0) {
      quad(ctx, x1, yT, bx1, yT2, bx1, yB2, x1, yB);
      ctx.fillStyle = facePattern(ctx, side, [(bx1 - x1) / sideW, 0, 0, h / fh, x1, yT]);
      ctx.fill();
    }
    if (a > 0) {
      quad(ctx, x0, yT, bx0, yT2, bx0, yB2, x0, yB);
      ctx.fillStyle = facePattern(ctx, side, [(bx0 - x0) / sideW, 0, 0, h / fh, x0, yT]);
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
  ctx.globalAlpha = 1;
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
}

export function drawPickup(ctx, view, item, icon, time) {
  const bob = 0.7 + Math.sin(time * 4 + item.z) * 0.15;
  const { sx, sy, s } = project(view, item.x, item.z, bob);
  const r = 0.55 * s;
  const fade = fadeIn(item.z), pulse = 0.5 + Math.sin(time * 6 + item.z) * 0.5;
  const ground = project(view, item.x, item.z);
  ctx.globalAlpha = fade * 0.5;
  ctx.drawImage(softDot('0,0,0'), ground.sx - r, ground.sy - r * 0.25, r * 2, r * 0.5);
  ctx.globalAlpha = fade * (0.35 + pulse * 0.3);
  ctx.drawImage(softDot('255,214,80'), sx - r * 2.3, sy - r * 2.3, r * 4.6, r * 4.6);
  ctx.globalAlpha = fade;
  const d = r * 2.37 * (1 + pulse * 0.05);
  ctx.drawImage(pickupSprite(icon), sx - d / 2, sy - d / 2, d, d);
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

function dazedStars(ctx, x, y, r) {
  const t = performance.now() / 1000;
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.strokeStyle = '#2b1d14';
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 3; i++) {
    const a = t * 3.5 + (i * Math.PI * 2) / 3;
    star(ctx, x + Math.cos(a) * r * 0.75, y - r * 0.45 + Math.sin(a) * r * 0.22, r * 0.2);
    ctx.fill();
    ctx.stroke();
  }
}

// A person curled into a ball, tumbling down the hill.
export function drawPlayer(ctx, view, player, time, speed = 0) {
  const hop = Math.abs(Math.sin(player.spin * 0.5)) * 0.18;
  const ground = project(view, player.x, PLAYER_Z);
  const { sx, sy, s } = project(view, player.x, PLAYER_Z, PLAYER_R + hop);
  const r = PLAYER_R * s;

  ctx.globalAlpha = 0.6 - hop * 1.5;
  ctx.drawImage(softDot('0,0,0'), ground.sx - r * 1.15, ground.sy - r * 0.32, r * 2.3, r * 0.64);
  ctx.globalAlpha = 1;

  const dpr = ctx.getTransform().a;
  const spin = player.dazed ? -0.4 : player.spin;
  const { canvas, size } = paintPlayer(r, spin, player.helmet, player.dazed, dpr);
  // squash on every touchdown, stretch when swerving
  const squash = player.dazed ? 0 : (1 - hop / 0.18) ** 6 * 0.11;
  const swerve = clamp(Math.abs(player.vx) * 0.008, 0, 0.08);
  const w = (size / dpr) * (1 + squash + swerve), h = (size / dpr) * (1 - squash - swerve * 0.5);
  const blur = player.dazed ? 0 : clamp((speed - 18) / 20, 0, 1);
  ctx.save();
  ctx.translate(sx, sy + r * 0.8 * squash);
  for (let i = 2; i >= 1 && blur > 0; i--) {
    ctx.globalAlpha = blur * (0.32 - i * 0.1);
    ctx.rotate(-0.16 * blur * i);
    ctx.drawImage(canvas, 0, 0, size, size, -w / 2, -h / 2, w, h);
    ctx.rotate(0.16 * blur * i);
  }
  ctx.globalAlpha = 1;
  ctx.drawImage(canvas, 0, 0, size, size, -w / 2, -h / 2, w, h);
  if (blur > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * blur})`;
    ctx.lineWidth = Math.max(1.5, r * 0.07);
    ctx.lineCap = 'round';
    for (const a of [-2.75, 0.4]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.18, a, a + 0.9);
      ctx.stroke();
    }
  }
  ctx.restore();
  if (player.dazed) {
    const [hx, hy] = headOffset(spin, r);
    dazedStars(ctx, sx + hx, sy + hy, r);
  }

  if (player.slippery > 0) {
    ctx.fillStyle = 'rgba(160,210,255,0.5)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(ground.sx + Math.sin(time * 9 + i * 2) * r, ground.sy - r * 0.1, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const dots = new Map();
const dotFor = (hex) => {
  if (!dots.has(hex)) {
    const rgb = /^#[0-9a-f]{6}$/i.test(hex) ? [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',') : '255,255,255';
    dots.set(hex, softDot(rgb, 1, 16));
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

// Full-resolution canvases are big, so keep only two: this season and the one fading out.
const grades = new Map();
const grade = (id, w, h) => {
  const key = `${id}:${w}x${h}`;
  if (!grades.has(key)) {
    if (grades.size >= 2) grades.delete(grades.keys().next().value);
    grades.set(key, paintGrade(id, w, h));
  }
  return grades.get(key);
};

// Season light and vignette over the whole scene, blitted 1:1 in device pixels (and unshaken).
export function drawGrade(ctx, view, season, prev, fade) {
  const m = ctx.getTransform();
  const w = Math.round(view.W * m.a), h = Math.round(view.H * m.d);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (prev && fade < 1) {
    ctx.globalAlpha = 1 - fade;
    ctx.drawImage(grade(prev.id, w, h), 0, 0);
    ctx.globalAlpha = fade;
  }
  ctx.drawImage(grade(season.id, w, h), 0, 0);
  ctx.globalAlpha = 1;
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
