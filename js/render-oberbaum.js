import { PLAYER_Z, OBERBAUM_TOWER_X, OBERBAUM_PIER_STEP as PIER_STEP, OBERBAUM_PIER_INSET as PIER_INSET } from './config.js';
import { project } from './view.js';
import { wallAlpha } from './atmosphere.js';
import { gateLayout } from './logic.js';

const layouts = new WeakMap();
function layoutFor(wall, gaps) {
  const cached = layouts.get(wall);
  if (cached?.gaps.length === gaps.length && gaps.every((g, i) => g.x === cached.gaps[i].x && g.w === cached.gaps[i].w)) return cached.layout;
  const layout = gateLayout(gaps);
  layouts.set(wall, { gaps: gaps.map((g) => ({ ...g })), layout });
  return layout;
}

// The reviewed arch's inner spring points at the pier crown, measured in its 696 px sprite.
// Align these points with the actual opening: fixed arch feet float when a gap shifts or widens.
const ARCH_SPRING_LEFT = 140 / 696;
const ARCH_SPRING_RIGHT = 555 / 696;

// Each actual passage gets its own arch; overlapping passages share one. No sight window (ADR 0052).
export function drawOberbaum(ctx, view, wall, gaps, art) {
  if (!art || wall.z <= PLAYER_Z) return;
  const p = project(view, 0, wall.z);
  const { solids, openings } = layoutFor(wall, gaps);

  function image(part, left, width = art[part].worldWidth) {
    const item = art[part], w = width * p.s, h = item.worldHeight * p.s;
    ctx.drawImage(item.image, p.sx + left * p.s, p.sy - item.bottom * p.s - h, w, h);
  }
  function clipped(part, left, a, b, top, bottom, width) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.sx + a * p.s, top, (b - a) * p.s, Math.max(0, bottom - top));
    ctx.clip();
    image(part, left, width);
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = wallAlpha(wall.z);
  const towerLeft = art['tower-left'], towerRight = art['tower-right'];
  for (const [a, b] of solids) {
    for (let x = a - PIER_INSET; x < b; x += PIER_STEP) clipped('pier', x, a, b, 0, p.sy);
    for (const [part, item, left] of [['tower-left', towerLeft, -OBERBAUM_TOWER_X - towerLeft.worldWidth / 2],
      ['tower-right', towerRight, OBERBAUM_TOWER_X - towerRight.worldWidth / 2]]) {
      if (left + item.worldWidth > a && left < b) clipped(part, left, a, b, 0, p.sy);
    }
  }
  for (let i = 0; i < openings.length; i++) {
    const gap = openings[i], a = gap.x - gap.w / 2, b = gap.x + gap.w / 2;
    const width = gap.w / (ARCH_SPRING_RIGHT - ARCH_SPRING_LEFT);
    const left = a - ARCH_SPRING_LEFT * width;
    // Neighbouring arches meet over their shared solid pier instead of painting across each other.
    const previous = openings[i - 1], next = openings[i + 1];
    const clipLeft = previous ? (previous.x + previous.w / 2 + a) / 2 : left;
    const clipRight = next ? (b + next.x - next.w / 2) / 2 : left + width;
    clipped('arch', left, clipLeft, clipRight, 0, p.sy, width);
  }
  ctx.restore();
}
