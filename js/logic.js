import { CORRIDOR, WALL_EXT } from './config.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Speed in world units per second after `t` seconds of play.
export const speedAt = (t) => Math.min(16 + t * 0.18, 40);

export const gapWidthAt = (n) => Math.max(1.9, 3.2 - n * 0.022);

export const spacingAt = (n) => Math.max(10, 18 - n * 0.08);

export const seasonIndexAt = (n, perSeason, count) => Math.floor(n / perSeason) % count;

export function makeGaps(n, prevX, season, rng) {
  const w = gapWidthAt(n) * season.gapMul;
  const limit = CORRIDOR / 2 - w / 2;
  const x = clamp(prevX + (rng() * 2 - 1) * 5, -limit, limit);
  const gaps = [{ x, w }];
  if (season.id === 'summer' && n > 8 && rng() < 0.4) {
    // second gap on the far side of the corridor
    const x2 = x > 0 ? -limit + rng() : limit - rng();
    if (Math.abs(x2 - x) > w * 1.5) gaps.push({ x: x2, w });
  }
  return gaps;
}

export const widened = (gap, factor) => ({ x: gap.x, w: Math.min(gap.w * factor, CORRIDOR * 0.6) });

export function passesWall(px, radius, gaps) {
  return gaps.some((g) => px - radius >= g.x - g.w / 2 && px + radius <= g.x + g.w / 2);
}

// Solid wall pieces between the gaps, as [from, to] pairs.
export function solidSegments(gaps) {
  const sorted = [...gaps].sort((a, b) => a.x - b.x);
  const segs = [];
  let from = -WALL_EXT;
  for (const g of sorted) {
    segs.push([from, g.x - g.w / 2]);
    from = g.x + g.w / 2;
  }
  segs.push([from, WALL_EXT]);
  return segs.filter(([a, b]) => b > a);
}
