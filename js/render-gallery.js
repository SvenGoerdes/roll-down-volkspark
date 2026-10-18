import { PLAYER_Z, WALL_EXT } from './config.js';
import { project } from './view.js';
import { wallAlpha } from './atmosphere.js';
import { gateLayout, galleryTiles } from './logic.js';
import { GALLERY_PITCH } from './gallery-sprite-data.js';

export const GALLERY_BAYS = ['l1', 'l2', 'l3', 'r1', 'r2', 'r3'];

const layouts = new WeakMap();
function solidsFor(wall, gaps) {
  const cached = layouts.get(wall);
  if (cached?.gaps.length === gaps.length && gaps.every((g, i) => g.x === cached.gaps[i].x && g.w === cached.gaps[i].w)) return cached.solids;
  const solids = gateLayout(gaps).solids;
  layouts.set(wall, { gaps, solids });
  return solids;
}

// Murals only exist on closed wall spans: every bay is clipped to its span, never over a passage.
export function drawGallery(ctx, view, wall, gaps, art) {
  if (!art || wall.z <= PLAYER_Z) return;
  const p = project(view, 0, wall.z);
  ctx.save();
  ctx.globalAlpha = wallAlpha(wall.z);
  for (const [a, b] of solidsFor(wall, gaps)) {
    for (const { x, from, to, bay } of galleryTiles(a, b, GALLERY_PITCH, WALL_EXT)) {
      const item = art[GALLERY_BAYS[bay]], w = item.worldWidth * p.s, h = item.worldHeight * p.s;
      ctx.save();
      ctx.beginPath();
      ctx.rect(view.cx + from * p.s, 0, (to - from) * p.s, view.H);
      ctx.clip();
      ctx.drawImage(item.image, view.cx + x * p.s - w / 2, p.sy - item.bottom * p.s - h, w, h);
      ctx.restore();
    }
  }
  ctx.restore();
}
