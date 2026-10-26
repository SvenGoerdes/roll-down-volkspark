import { makeCanvas } from './sprites.js';
import { project } from './view.js';
import { PLAYER_Z, PLAYER_R, SYRINGES } from './config.js';
import { drawImpact } from './impact-effect.js';

let sprite, impact;
export function warmSyringes() {
  if (sprite) return;
  sprite = makeCanvas(192, 96);
  const c = sprite.getContext('2d');
  c.translate(96, 48); c.rotate(-0.25);
  // Dark outline, pale barrel and orange plunger stay readable on earth and snow.
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 9; c.strokeStyle = '#443b35';
  c.fillStyle = '#f9f1d5'; c.beginPath(); c.roundRect(-42, -17, 77, 34, 7); c.fill(); c.stroke();
  c.fillStyle = '#87cbd1'; c.fillRect(-30, -10, 28, 20);
  c.lineWidth = 4; c.beginPath();
  for (const x of [4, 15, 26]) { c.moveTo(x, -12); c.lineTo(x, -3); }
  c.stroke();
  c.lineWidth = 9; c.beginPath(); c.moveTo(36, 0); c.lineTo(69, 0); c.stroke();
  c.strokeStyle = '#f8f0cf'; c.lineWidth = 3; c.stroke();
  c.strokeStyle = '#443b35'; c.lineWidth = 11; c.beginPath(); c.moveTo(-45, 0); c.lineTo(-66, 0); c.stroke();
  c.beginPath(); c.moveTo(-68, -17); c.lineTo(-68, 17); c.stroke();
  c.strokeStyle = '#e48643'; c.lineWidth = 6; c.stroke();
  // Compact reusable impact stamp, painted once.
  impact = makeCanvas(300, 135);
  const g = impact.getContext('2d');
  g.fillStyle = '#fff0c6'; g.strokeStyle = '#644333'; g.lineWidth = 5;
  g.beginPath(); g.roundRect(5, 12, 290, 105, 30); g.fill(); g.stroke();
  g.fillStyle = '#69372b'; g.font = 'bold 43px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('Spritze!', 150, 65);
}

export function drawSyringe(ctx, view, item) {
  if (item.hit || item.z <= 0.6 || item.z >= 45) return;
  const p = project(view, item.x, item.z, 0.06);
  // A small screen-space floor keeps the pale silhouette readable on phones.
  const w = Math.max(p.s * 1.85, 34 * view.W / 390);
  ctx.save();
  ctx.globalAlpha = Math.min(1, (45 - item.z) / 15);
  ctx.fillStyle = 'rgba(40,30,20,0.22)';
  ctx.beginPath(); ctx.ellipse(p.sx, p.sy + p.s * 0.04, w * 0.42, w * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(sprite, p.sx - w / 2, p.sy - w * 0.37, w, w * 0.5);
  ctx.restore();
}

export function drawSyringeImpact(ctx, view, player, left) {
  const p = project(view, player.x, PLAYER_Z, PLAYER_R + 0.35);
  drawImpact(ctx, view, left, SYRINGES.effectDuration, impact, p.sx, p.sy);
}
