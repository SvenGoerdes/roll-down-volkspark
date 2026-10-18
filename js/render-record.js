import { WALL_H } from './config.js';
import { project } from './view.js';
import { wallAlpha } from './atmosphere.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// A small sign above the wall whose pass beats the nearest record: "Rekord" (own) or "Weltrekord".
export function drawRecordMark(ctx, view, wall, label = 'Rekord') {
  const p = project(view, wall.gaps[0].x, wall.z, WALL_H + 0.35);
  const size = clamp(p.s * 0.55, 10, 26);
  ctx.save();
  ctx.globalAlpha = clamp(1.4 - wall.z / 70, 0.35, 1) * wallAlpha(wall.z);
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(label).width + size * 1.2, h = size * 1.6;
  ctx.beginPath();
  ctx.roundRect(p.sx - w / 2, p.sy - h / 2, w, h, h / 2);
  ctx.fillStyle = 'rgba(20, 28, 18, 0.75)';
  ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.stroke();
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(label, p.sx, p.sy + size * 0.05);
  ctx.restore();
}
