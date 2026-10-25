import { PLAYER_Z, RATHAUS_TOWER_INNER as TOWER_INNER } from './config.js';
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

// A low arcade row closes every non-passage span, as low as a wall so the next gap stays in view. The clocktower
// stands left of the corridor, never in front of a following gap. Drawn whole, no sight window (ADR 0052).
export function drawRathaus(ctx, view, wall, gaps, art) {
  if (!art || wall.z <= PLAYER_Z) return;
  const p = project(view, 0, wall.z);
  const { wing, tower } = art;

  function image(item, left, extra = 0) {
    const w = item.worldWidth * p.s, h = item.worldHeight * p.s;
    ctx.drawImage(item.image, view.cx + left * p.s, p.sy - item.bottom * p.s - h, w + extra, h);
  }
  function clipped(item, left, a, b, extra) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(view.cx + a * p.s, 0, (b - a) * p.s, p.sy);
    ctx.clip();
    image(item, left, extra);
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = wallAlpha(wall.z);
  const towerLeft = -TOWER_INNER - tower.worldWidth;
  for (const [a, b] of solidsFor(wall, gaps)) {
    // Each tile is one pixel wider than its step, so no light seam shows between two tiles.
    for (let x = a; x < b; x += wing.worldWidth) clipped(wing, x, a, b, 1);
    if (towerLeft + tower.worldWidth > a && towerLeft < b) clipped(tower, towerLeft, a, b, 0);
  }
  ctx.restore();
}
