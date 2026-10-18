import { WALL_H, PLAYER_Z, GATE_ART } from './config.js';
import { project } from './view.js';
import { wallAlpha } from './atmosphere.js';
import { gateLayout, widened } from './logic.js';

const layouts = new WeakMap();
function layoutFor(wall, gaps) {
  const cached = layouts.get(wall);
  if (cached?.passages.length === gaps.length && gaps.every((g, i) => g.x === cached.passages[i].x && g.w === cached.passages[i].w)) return cached;
  const layout = gateLayout(gaps);
  // Expanded sight windows must also be disjoint for the even-odd clip rule.
  layout.sightOpenings = gateLayout(layout.openings.map((g) => ({ x: g.x, w: g.w + GATE_ART.revealMargin * 2 }))).openings;
  layouts.set(wall, layout);
  return layout;
}

// Only the following passage gets an x-ray window, not the whole landmark.
// Its collision-height band is readable through tall piers/cornices in front.
export function gateSightWindows(view, nextWall, factor = 1) {
  if (!nextWall) return [];
  const p = project(view, 0, nextWall.z);
  const margin = GATE_ART.revealMargin;
  return layoutFor(nextWall, factor === 1 ? nextWall.gaps : nextWall.gaps.map((g) => widened(g, factor))).sightOpenings.map((g) => ({
    x: view.cx + (g.x - g.w / 2) * p.s,
    y: p.sy - (WALL_H + margin) * p.s,
    w: g.w * p.s,
    h: (WALL_H + margin * 2) * p.s,
  }));
}

export function drawGate(ctx, view, wall, gaps, season, art, nextWall, factor = 1) {
  if (!art || wall.z <= PLAYER_Z) return;
  const layout = layoutFor(wall, gaps);
  const p = project(view, 0, wall.z), alpha = wallAlpha(wall.z);
  const windows = gateSightWindows(view, nextWall, factor);
  const cutoff = p.sy - WALL_H * p.s;

  function image(part, x) {
    const item = art[part], w = item.worldWidth * p.s, h = item.worldHeight * p.s;
    ctx.drawImage(item.image, view.cx + x * p.s - w / 2, p.sy - item.bottom * p.s - h, w, h);
  }
  function clipped(part, x, a, b, high, reveal = false) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(view.cx + a * p.s, high ? 0 : cutoff, (b - a) * p.s, high ? Math.max(0, cutoff) : WALL_H * p.s);
    ctx.clip();
    ctx.globalAlpha = alpha * (reveal ? GATE_ART.revealAlpha : 1);
    if (high && windows.length) {
      ctx.beginPath();
      if (!reveal) ctx.rect(0, 0, view.W, view.H);
      for (const r of windows) ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip(reveal ? 'nonzero' : 'evenodd');
    }
    image(part, x);
    ctx.restore();
  }
  function pier(x, a, b) {
    clipped('pier', x, a, b, false);
    clipped('pier', x, a, b, true);
    if (windows.length) clipped('pier', x, a, b, true, true);
  }

  const halfRoof = art.roof.worldWidth / 2;
  for (const [a, b] of layout.solids) {
    // Original timber closes every non-passage, never just the spaces between columns.
    const tile = art.barrier.worldWidth;
    for (let x = a; x < b; x += tile) clipped('barrier', x + tile / 2, x, Math.min(b, x + tile), false);
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
  clipped('roof', 0, -halfRoof, halfRoof, true);
  if (windows.length) clipped('roof', 0, -halfRoof, halfRoof, true, true);

  // Separate centre tracks show the single-gap radius rule even when portals overlap.
  if (layout.passages.length > 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = '#ffe7ae';
    ctx.lineWidth = Math.max(1, p.s * 0.025);
    for (const gap of layout.passages) {
      const x = view.cx + gap.x * p.s, half = gap.w * p.s / 2;
      ctx.beginPath(); ctx.moveTo(x - half, p.sy); ctx.lineTo(x + half, p.sy);
      ctx.moveTo(x - half, p.sy - WALL_H * p.s); ctx.lineTo(x - half, p.sy);
      ctx.moveTo(x + half, p.sy - WALL_H * p.s); ctx.lineTo(x + half, p.sy); ctx.stroke();
    }
    ctx.restore();
  }
}
