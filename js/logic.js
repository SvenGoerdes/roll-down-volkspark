import { CORRIDOR, WALL_EXT, SURFACE_FIRST, SURFACE_LEN, SURFACE_ORDER, WALLS_PER_SEASON, SEASONS, WIND_WARN } from './config.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Difficulty by wall index n: walls passed for the speed, walls spawned for the layout.
// Every value eases from its start toward a floor, so the curve has no sudden wall; after the
// first year (80 walls) gaps and intervals keep tightening slowly. Tuned with tools/balance-sim.js.
const YEAR = WALLS_PER_SEASON * SEASONS.length;
const ease = (from, to, n, tau) => to + (from - to) * Math.exp(-n / tau);
const afterYear = (n) => Math.max(0, n - YEAR);

// 1 at a season's first wall, fading out over its first five (0 from the sixth): a short breather after each season change.
export const seasonRelief = (n) => Math.max(0, 1 - (n % WALLS_PER_SEASON) / 5);

// Speed in world units per second after n walls: 16 at the start, toward 28.
export const speedAt = (n) => ease(16, 28, n, 60);

// Seconds before wall n (from wall n-1) at the base speed.
export const intervalAt = (n) => Math.max(0.45, ease(1.2, 0.65, n, 35) - 0.002 * afterYear(n)) + 0.15 * seasonRelief(n);

export const gapWidthAt = (n) => Math.max(1.8, ease(3.2, 1.95, n, 35) - 0.003 * afterYear(n)) + 0.5 * seasonRelief(n);

// Distance from wall n-1 to wall n, so they come intervalAt(n) seconds apart.
export const spacingAt = (n) => intervalAt(n) * speedAt(n);

// How far a gap may move sideways from the last one: less when walls come quicker.
export const shiftAt = (n) => clamp(intervalAt(n) * 5, 3, 5);

// Autumn gust strength: builds up over the first walls of the season, then grows slowly.
export const windAt = (n) => (100 + Math.min(n, YEAR) * 0.4) * Math.min(1, ((n % WALLS_PER_SEASON) + 1) / 6);

// One step of the autumn wind. w = { force, target, next, warn, nextGust, drift }, changed in place.
// A gust is announced WIND_WARN s before it pushes; drift leads the force so leaves show it coming.
export function stepWind(w, dt, autumn, strength, rng) {
  if (!autumn) { w.target = 0; w.warn = 0; }
  else if (w.warn > 0) { if ((w.warn -= dt) <= 0) w.target = w.next; }
  else if ((w.nextGust -= dt) <= 0) {
    if (w.target) { w.target = 0; w.nextGust = 2 + rng() * 2.5; }
    else {
      w.next = (rng() < 0.5 ? -1 : 1) * strength;
      w.warn = WIND_WARN;
      w.nextGust = 1.6 + rng(); // counts from the push, not the warning
    }
  }
  w.force += (w.target - w.force) * Math.min(1, dt * 2);
  w.drift += ((w.warn > 0 ? w.next : w.target) - w.drift) * Math.min(1, dt * 3);
}

// Which way the wind arrow points: -1, 0 or 1. It shows from the warning on, through the push.
export const windArrow = (w) => (w.warn > 0 ? Math.sign(w.next) : w.target ? Math.sign(w.target) : Math.abs(w.force) > 40 ? Math.sign(w.force) : 0);

// Helmets stack as extra lives, up to `max`.
export const addHelmet = (n, max) => Math.min(max, n + 1);

export const seasonIndexAt = (n, perSeason, count) => Math.floor(n / perSeason) % count;

// Plants past the last wall of the current season already show the next one.
// Returns the z beyond which that applies (Infinity if no such wall is out yet) and the season index there.
export function seasonAhead(walls, seasonIdx, perSeason, count) {
  const edge = walls.find((w) => seasonIndexAt(w.index + 1, perSeason, count) !== seasonIdx);
  return edge ? { z: edge.z, idx: seasonIndexAt(edge.index + 1, perSeason, count) } : { z: Infinity, idx: seasonIdx };
}

export function makeGaps(n, prevX, season, rng) {
  const w = gapWidthAt(n) * season.gapMul;
  const limit = CORRIDOR / 2 - w / 2;
  const x = clamp(prevX + (rng() * 2 - 1) * shiftAt(n), -limit, limit);
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
