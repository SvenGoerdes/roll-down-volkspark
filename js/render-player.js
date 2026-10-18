// The chosen figure (ADR 0018): sprite frames from Blender, anchored on the ball centre.
import { PLAYER_R, PLAYER_Z } from './config.js';
import { softDot } from './sprites.js';
import { project } from './view.js';
import { star } from './render-fx.js';
import { spriteScale, drawFrame } from './figure.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function dazedStars(ctx, x, y, r, time) {
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.strokeStyle = '#2b1d14';
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 3; i++) {
    const a = time * 3.5 + (i * Math.PI * 2) / 3;
    star(ctx, x + Math.cos(a) * r * 0.75, y - r * 0.45 + Math.sin(a) * r * 0.22, r * 0.2);
    ctx.fill();
    ctx.stroke();
  }
}

// The figure on the hill: standing, tripping, rolling as a ball, or knocked out.
export function drawPlayer(ctx, view, player, time, speed, figure, pose) {
  if (!figure) return;
  const sheet = figure[pose.clip];
  const rolling = pose.clip.startsWith('roll');
  const hopMax = 0.18 + (player.bump || 0);
  const hop = rolling ? Math.abs(Math.sin(player.spin * 0.5)) * hopMax : 0;
  const ground = project(view, player.x, PLAYER_Z);
  const { sx, sy, s } = project(view, player.x, PLAYER_Z, PLAYER_R + hop);
  const r = PLAYER_R * s;
  const k = spriteScale(s, sheet);
  // Intro and roll anchors already sit on the ball centre; only dazed needs a visual offset.
  let dy = 0;
  if (pose.clip === 'dazed') dy = ground.sy - r * 0.2 - sy - (sheet.h / 2 - sheet.ay) * k;

  ctx.globalAlpha = 0.6 - hop * 1.5;
  ctx.drawImage(softDot('0,0,0'), ground.sx - r * 1.15, ground.sy - r * 0.32, r * 2.3, r * 0.64);
  ctx.globalAlpha = 1;

  // squash on every touchdown, stretch when swerving
  const introSquash = pose.clip === 'intro' ? clamp(((pose.trip || 0) - 0.8) / 0.2, 0, 1) * 0.11 : 0;
  const squash = rolling ? (1 - hop / hopMax) ** 6 * 0.11 : introSquash;
  const swerve = rolling ? clamp(Math.abs(player.vx) * 0.008, 0, 0.08) : 0;
  const blur = rolling ? clamp((speed - 17) / 13, 0, 1) : 0;
  const lean = rolling ? -clamp(player.vx * 0.05, -0.4, 0.4) * (player.slip || 0) : 0;
  const tilt = rolling ? clamp(player.vx * 0.03, -0.25, 0.25) : 0;
  ctx.save();
  ctx.translate(sx, sy + dy + r * 0.8 * squash);
  ctx.rotate(tilt);
  ctx.transform(1, 0, lean, 1, 0, 0); // lean into the slide
  ctx.scale(1 + squash + swerve, 1 - squash - swerve * 0.5);
  drawFrame(ctx, sheet, pose.frame, 0, 0, k);
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
  if (sheet.head) {
    dazedStars(ctx, sx + (sheet.head[0] - sheet.ax) * k, sy + dy + (sheet.head[1] - sheet.ay) * k, r, time);
  }
}
