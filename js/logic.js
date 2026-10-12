import { CORRIDOR, WALL_EXT, SURFACE_FIRST, SURFACE_LEN, SURFACE_ORDER } from './config.js';

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

// How slippery the ground feels, 0..1: ice is always 1, a puddle fades out over its last 0.5s.
export const slipAmount = (winter, puddleLeft) => (winter ? 1 : clamp(puddleLeft / 0.5, 0, 1));

// Sideways skid strength 0..1 from lateral speed; small drifts leave no mark.
export const skidStrength = (vx, slip) => (slip > 0 ? clamp((Math.abs(vx) - 1.2) / 5, 0, 1) * slip : 0);

// Endless sequence of path surfaces by distance: dirt first, then random-length
// stretches that never repeat back to back. Returns dist -> surface id.
export function createSurfaceTrack(rng, order = SURFACE_ORDER, first = SURFACE_FIRST, len = SURFACE_LEN) {
  const ends = [first], ids = [0];
  return (dist) => {
    while (ends[ends.length - 1] <= dist) {
      ids.push((ids[ids.length - 1] + 1 + (rng() < 0.5 ? 0 : 1)) % order.length);
      ends.push(ends[ends.length - 1] + len[0] + rng() * (len[1] - len[0]));
    }
    let i = 0;
    while (ends[i] <= dist) i++;
    return order[ids[i]];
  };
}

// Which slice of a tiled ground texture covers one screen row.
// wNear/wFar: world z at the row's bottom/top edge. The tile is mirrored so the top of
// the slice is the far edge. Returns the mip level and one or two slices of level-0
// pixels, each with the share [f0, f1] of the row it fills (top = 0).
export function stripSource(wNear, wFar, units, tileH, maxLevel) {
  const frac = Math.min(0.5, Math.max(0, (wFar - wNear) / units));
  const sh = Math.max(1, frac * tileH);
  const level = Math.min(maxLevel, Math.floor(Math.log2(sh)));
  const near = ((wNear % units) + units) % units / units;
  const sy = tileH * (1 - near - frac);
  if (sy >= 0) return { level, parts: [{ sy, sh, f0: 0, f1: 1 }] };
  const top = -sy; // rows of the slice that wrap around to the bottom of the tile
  const cut = top / sh;
  return {
    level,
    parts: [{ sy: sy + tileH, sh: top, f0: 0, f1: cut }, { sy: 0, sh: sh - top, f0: cut, f1: 1 }],
  };
}
