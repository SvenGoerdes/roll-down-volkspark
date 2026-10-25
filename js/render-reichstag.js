import { PLAYER_Z, REICHSTAG_PORTICO as PORTICO, REICHSTAG_COLUMN_STEP as STEP } from './config.js';
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

// Column x positions across a closed span a..b, the first and last flush with its edges, at most STEP apart.
export function columnLefts(a, b, width) {
  if (b - a <= width) return [a];
  const n = Math.ceil((b - a - width) / STEP) + 1;
  return Array.from({ length: n }, (_, i) => a + (b - a - width) * i / (n - 1));
}

// The wings and the columns fill every non-passage span, the pediment with the dome spans the middle above wall
// height, so no part is ever drawn over a passage. Drawn whole, no sight window (ADR 0052).
export function drawReichstag(ctx, view, wall, gaps, art) {
  if (!art || wall.z <= PLAYER_Z) return;
  const p = project(view, 0, wall.z);

  function image(part, left) {
    const item = art[part], w = item.worldWidth * p.s, h = item.worldHeight * p.s;
    ctx.drawImage(item.image, view.cx + left * p.s, p.sy - item.bottom * p.s - h, w, h);
  }
  function clipped(part, left, a, b) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(view.cx + a * p.s, 0, (b - a) * p.s, p.sy);
    ctx.clip();
    image(part, left);
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = wallAlpha(wall.z);
  const solids = solidsFor(wall, gaps);
  for (const [a, b] of solids) {
    for (const part of ['wing-left', 'wing-right']) {
      const left = art[part].left;
      if (left + art[part].worldWidth > a && left < b) clipped(part, left, a, b);
    }
  }
  for (const [a, b] of solids) {
    const from = Math.max(a, -PORTICO), to = Math.min(b, PORTICO);
    if (to > from) for (const left of columnLefts(from, to, art.column.worldWidth)) clipped('column', left, from, to);
  }
  image('top', art.top.left);
  ctx.restore();
}
