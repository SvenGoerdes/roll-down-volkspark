import { WALL_H, PLAYER_Z, GATE_ART } from './config.js';
import { project } from './view.js';
import { wallAlpha } from './atmosphere.js';
import { gateLayout } from './logic.js';

const layouts = new WeakMap();
function layoutFor(wall, gaps) {
  const cached = layouts.get(wall);
  if (cached?.passages.length === gaps.length && gaps.every((g, i) => g.x === cached.passages[i].x && g.w === cached.passages[i].w)) return cached;
  const layout = gateLayout(gaps);
  layouts.set(wall, layout);
  return layout;
}

// The gate is always drawn whole: a see-through window into the next passage read as a glitch.
export function drawGate(ctx, view, wall, gaps, season, art) {
  if (!art || wall.z <= PLAYER_Z) return;
  const layout = layoutFor(wall, gaps);
  const p = project(view, 0, wall.z), alpha = wallAlpha(wall.z);
  const cutoff = p.sy - WALL_H * p.s;

  function image(part, x) {
    const item = art[part], w = item.worldWidth * p.s, h = item.worldHeight * p.s;
    ctx.drawImage(item.image, p.sx + x * p.s - w / 2, p.sy - item.bottom * p.s - h, w, h);
  }
  // Clip each part to its own span and band so nothing reaches into a passage.
  function clipped(part, x, a, b, top, bottom) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.sx + a * p.s, top, (b - a) * p.s, Math.max(0, bottom - top));
    ctx.clip();
    ctx.globalAlpha = alpha;
    image(part, x);
    ctx.restore();
  }
  const pier = (x, a, b) => clipped('pier', x, a, b, 0, p.sy);

  const halfRoof = art.roof.worldWidth / 2;
  for (const [a, b] of layout.solids) {
    // Original timber closes every non-passage, never just the spaces between columns.
    const tile = art.barrier.worldWidth;
    for (let x = a; x < b; x += tile) clipped('barrier', x + tile / 2, x, Math.min(b, x + tile), cutoff, p.sy);
    const halfPier = art.pier.worldWidth / 2;
    const left = Math.max(a, -halfRoof) + halfPier, right = Math.min(b, halfRoof) - halfPier;
    if (left > right) {
      if (b > -halfRoof && a < halfRoof) pier((a + b) / 2, a, b);
      continue;
    }
    const intervals = Math.max(1, Math.ceil((right - left) / GATE_ART.pierSpacing));
    for (let i = 0; i <= intervals; i++) {
      if (i && right === left) break;
      pier(left + (right - left) * i / intervals, a, b);
    }
  }
  clipped('roof', 0, -halfRoof, halfRoof, 0, cutoff);
}
