import { WALL_H, PLAYER_Z, OBERBAUM_TOWER_X, OBERBAUM_PIER_OVERLAP as PIER_OVERLAP } from './config.js';
import { project } from './view.js';
import { wallAlpha } from './atmosphere.js';
import { gateLayout } from './logic.js';

const layouts = new WeakMap();
function solidsFor(wall, gaps) {
  const cached = layouts.get(wall);
  if (cached?.gaps.length === gaps.length && gaps.every((g, i) => g.x === cached.gaps[i].x && g.w === cached.gaps[i].w)) return cached.solids;
  const solids = gateLayout(gaps).solids;
  layouts.set(wall, { gaps, solids });
  return solids;
}

// Brick piers close every non-passage span, the towers flank the path outside the corridor, and the arch
// spans the middle above wall height, so no part is ever drawn over a passage. Drawn whole, no sight window (ADR 0052).
export function drawOberbaum(ctx, view, wall, gaps, art) {
  if (!art || wall.z <= PLAYER_Z) return;
  const p = project(view, 0, wall.z), cutoff = p.sy - WALL_H * p.s;

  function image(part, left) {
    const item = art[part], w = item.worldWidth * p.s, h = item.worldHeight * p.s;
    ctx.drawImage(item.image, view.cx + left * p.s, p.sy - item.bottom * p.s - h, w, h);
  }
  function clipped(part, left, a, b, top, bottom) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(view.cx + a * p.s, top, (b - a) * p.s, Math.max(0, bottom - top));
    ctx.clip();
    image(part, left);
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = wallAlpha(wall.z);
  const pier = art.pier, step = pier.worldWidth - PIER_OVERLAP, towerLeft = art['tower-left'], towerRight = art['tower-right'];
  for (const [a, b] of solidsFor(wall, gaps)) {
    for (let x = a; x < b; x += step) clipped('pier', x, a, Math.min(b, x + pier.worldWidth), 0, p.sy);
    for (const [part, item, left] of [['tower-left', towerLeft, -OBERBAUM_TOWER_X - towerLeft.worldWidth / 2],
      ['tower-right', towerRight, OBERBAUM_TOWER_X - towerRight.worldWidth / 2]]) {
      if (left + item.worldWidth > a && left < b) clipped(part, left, a, b, 0, p.sy);
    }
  }
  clipped('arch', art.arch.left, art.arch.left, art.arch.left + art.arch.worldWidth, 0, cutoff);
  ctx.restore();
}
