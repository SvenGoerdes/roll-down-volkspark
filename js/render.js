import { CORRIDOR, WALL_H, PLAYER_R, PLAYER_Z, SPAWN_Z, PLAYER_SCREEN_Y, HORIZON } from './config.js';
import { solidSegments } from './logic.js';

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

const fadeIn = (z) => clamp((SPAWN_Z - z) / 18, 0, 1);
// walls already passed fade out so they don't hide the player
const fadeOut = (z) => clamp((z - 1) / (PLAYER_Z - 1.5), 0, 1);

export function drawWall(ctx, view, z, gaps, tex, snowy) {
  const base = project(view, 0, z);
  const top = view.horizonY + (view.CH - WALL_H) * base.s;
  const h = base.sy - top;
  const tileW = WALL_H * (tex.width / tex.height);
  ctx.globalAlpha = Math.min(fadeIn(z), fadeOut(z));
  for (const [a, b] of solidSegments(gaps)) {
    // tile the photo texture from a fixed world origin so it doesn't swim
    const origin = -CORRIDOR * 2;
    for (let k = Math.floor((a - origin) / tileW); origin + k * tileW < b; k++) {
      const t0 = Math.max(a, origin + k * tileW);
      const t1 = Math.min(b, origin + (k + 1) * tileW);
      if (t1 <= t0) continue;
      const u0 = ((t0 - origin) / tileW - k) * tex.width;
      const u1 = ((t1 - origin) / tileW - k) * tex.width;
      const sx = view.cx + t0 * base.s;
      ctx.drawImage(tex, u0, 0, Math.max(1, u1 - u0), tex.height, sx, top, (t1 - t0) * base.s + 0.5, h);
    }
    const x0 = view.cx + a * base.s, x1 = view.cx + b * base.s;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x0, base.sy - h * 0.04, x1 - x0, h * 0.06);
    if (snowy) {
      ctx.fillStyle = '#f7faff';
      ctx.beginPath();
      ctx.roundRect(x0 - h * 0.03, top - h * 0.06, x1 - x0 + h * 0.06, h * 0.16, h * 0.08);
      ctx.fill();
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

export function drawPickup(ctx, view, item, icon, time) {
  const bob = 0.7 + Math.sin(time * 4 + item.z) * 0.15;
  const { sx, sy, s } = project(view, item.x, item.z, bob);
  const r = 0.55 * s;
  ctx.globalAlpha = fadeIn(item.z);
  const ground = project(view, item.x, item.z);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(ground.sx, ground.sy, r * 0.8, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.font = `${Math.round(r * 1.15)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, sx, sy + r * 0.06);
  ctx.globalAlpha = 1;
}

// A person curled into a ball, tumbling down the hill.
export function drawPlayer(ctx, view, player, time) {
  const hop = Math.abs(Math.sin(player.spin * 0.5)) * 0.18;
  const ground = project(view, player.x, PLAYER_Z);
  const { sx, sy, s } = project(view, player.x, PLAYER_Z, PLAYER_R + hop);
  const r = PLAYER_R * s;

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(ground.sx, ground.sy, r * (1 - hop), r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(sx, sy);
  ctx.transform(1, 0, -clamp(player.vx * 0.05, -0.4, 0.4) * (player.slip || 0), 1, 0, 0); // lean into the slide
  ctx.rotate(player.spin);
  const limb = (angle, len, width, color) => {
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-width / 2, r * 0.3, width, len, width / 2);
    ctx.fill();
    ctx.restore();
  };
  limb(2.6, r * 0.85, r * 0.42, '#2d3a6b');   // legs
  limb(3.5, r * 0.85, r * 0.42, '#24305a');
  limb(1.1, r * 0.7, r * 0.26, '#f1c27d');    // arms
  limb(-1.1, r * 0.7, r * 0.26, '#e8b46c');
  ctx.fillStyle = '#e4572e';                  // hoodie
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f3a712';
  ctx.fillRect(-r * 0.78, -r * 0.12, r * 1.56, r * 0.24);
  ctx.fillStyle = '#f1c27d';                  // head
  ctx.beginPath();
  ctx.arc(0, -r * 0.82, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b2a20';
  ctx.beginPath();
  ctx.arc(0, -r * 0.9, r * 0.42, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  if (player.helmet) {
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(0, -r * 0.88, r * 0.5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d33';
    ctx.fillRect(-r * 0.08, -r * 1.36, r * 0.16, r * 0.4);
  }
  ctx.restore();

  if (player.slippery > 0) {
    ctx.fillStyle = 'rgba(160,210,255,0.5)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(ground.sx + Math.sin(time * 9 + i * 2) * r, ground.sy - r * 0.1, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Glossy ice: a light sheen over the path plus streaks that scroll with the ground.
export function drawIceSheen(ctx, view, travelled) {
  const { W, H, horizonY, F, CH, cx } = view;
  const pw = (CORRIDOR / 2) * (H - horizonY) / CH;
  const g = ctx.createLinearGradient(0, horizonY, 0, H);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(235,248,255,0.22)');
  g.addColorStop(1, 'rgba(255,255,255,0.4)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - pw, horizonY, pw * 2, H - horizonY);
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const z = 5 + ((i * 6.1 - travelled) % 60 + 60) % 60;
    const x = (((i * 7.7) % 9) - 4.5) * 0.9;
    const a = project(view, x, z), b = project(view, x + 0.3, z + 2.8);
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - clamp((z - 5) / 60, 0, 1))})`;
    ctx.lineWidth = Math.max(1.5, 0.16 * a.s);
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.stroke();
  }
}

// Two parallel tracks where the player slid sideways.
export function drawSkidMarks(ctx, view, skids, snowy) {
  if (skids.length < 2) return;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  for (const side of [-0.35, 0.35]) {
    for (let i = 1; i < skids.length; i++) {
      const m = skids[i], q = skids[i - 1];
      if (q.z - m.z > 3) continue;
      const a = project(view, q.x + side, q.z), b = project(view, m.x + side, m.z);
      ctx.strokeStyle = snowy ? `rgba(70,95,125,${0.5 * m.a})` : `rgba(40,70,110,${0.45 * m.a})`;
      ctx.lineWidth = Math.max(1, 0.12 * b.s);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
  }
}

export function drawSpray(ctx, spray) {
  for (const s of spray) {
    ctx.globalAlpha = Math.min(1, (s.life / s.max) * 1.5);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.leaf) ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
    else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
