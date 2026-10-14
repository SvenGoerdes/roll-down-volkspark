import { test, expect } from 'bun:test';
import { CORRIDOR, WALL_EXT, SEASONS, WALLS_PER_SEASON, WIND_WARN } from '../js/config.js';
import {
  speedAt, gapWidthAt, intervalAt, spacingAt, seasonRelief, shiftAt, windAt, stepWind, windArrow, seasonIndexAt, makeGaps, widened,
  passesWall, solidSegments, slipAmount, skidStrength, createSurfaceTrack, stripSource, addHelmet, seasonAhead,
} from '../js/logic.js';

const seq = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };
const [spring, summer] = SEASONS;

test('speed starts at 16 and eases toward 28, never above', () => {
  expect(speedAt(0)).toBe(16);
  expect(speedAt(30)).toBeGreaterThan(speedAt(10));
  expect(speedAt(10_000)).toBeCloseTo(28);
  for (const n of [0, 5, 50, 500, 10_000]) expect(speedAt(n)).toBeLessThanOrEqual(28);
});

test('seasonRelief: breather at the first walls of a season only', () => {
  expect(seasonRelief(0)).toBe(1);
  expect(seasonRelief(20)).toBe(1);
  expect(seasonRelief(5)).toBe(0);
  expect(seasonRelief(19)).toBe(0);
});

test('gaps start wide, ease to 1.8, and widen again in a breather', () => {
  expect(gapWidthAt(0)).toBeCloseTo(3.7);
  expect(gapWidthAt(10_005)).toBeCloseTo(1.8);
  expect(gapWidthAt(20)).toBeGreaterThan(gapWidthAt(19));
});

test('intervals start at 1.35s, ease to 0.45s', () => {
  expect(intervalAt(0)).toBeCloseTo(1.35);
  expect(intervalAt(10_005)).toBeCloseTo(0.45);
});

test('walls never come quicker than 0.45 s at base speed', () => {
  for (let n = 0; n <= 400; n++) expect(spacingAt(n) / speedAt(n)).toBeGreaterThan(0.45 - 1e-9);
});

test('spacing is a distance: at the floor interval a faster run spaces walls wider', () => {
  expect(intervalAt(205)).toBeCloseTo(0.45);
  expect(intervalAt(305)).toBeCloseTo(0.45);
  expect(spacingAt(305)).toBeGreaterThan(spacingAt(205));
});

test('sideways shift: 5 at the start, 3 once walls come quick', () => {
  expect(shiftAt(0)).toBe(5);
  expect(shiftAt(10_005)).toBe(3);
  for (const n of [0, 30, 100, 1000, 10_005]) {
    expect(shiftAt(n)).toBeGreaterThanOrEqual(3);
    expect(shiftAt(n)).toBeLessThanOrEqual(5);
  }
});

test('wind ramps in over the first walls of autumn, then grows slowly', () => {
  expect(windAt(40)).toBeLessThan(windAt(45));
  expect(windAt(45)).toBeCloseTo(118);
  expect(windAt(10_005)).toBeCloseTo(132);
});

const calm = () => ({ force: 0, target: 0, next: 0, warn: 0, nextGust: 4, drift: 0 });
// rng calls in order: gust direction (< 0.5 = left), then the next-gust delay
const run = (w, seconds, autumn, rng, dt = 0.05) => { for (let t = 0; t < seconds; t += dt) stepWind(w, dt, autumn, 100, rng); };

test('stepWind announces a gust first: arrow shows, nothing pushes yet', () => {
  const w = calm(), rng = seq(0.9, 0.5);
  run(w, 4.05, true, rng);
  expect(w.warn).toBeGreaterThan(0);
  expect(w.next).toBe(100);
  expect(w.target).toBe(0);
  expect(w.force).toBe(0);
  expect(windArrow(w)).toBe(1);
});

test('stepWind pushes after WIND_WARN and builds the force', () => {
  const w = calm(), rng = seq(0.1, 0.5);
  run(w, 4.05 + WIND_WARN + 0.1, true, rng);
  expect(w.warn).toBeLessThanOrEqual(0);
  expect(w.target).toBe(-100);
  expect(w.force).toBeLessThan(0);
  run(w, 1.5, true, rng);
  expect(w.force).toBeLessThan(-80);
});

test('stepWind ends the gust 1.6 s after the push, then calms down', () => {
  const w = calm(), rng = seq(0.9, 0, 0);
  run(w, 4.05 + WIND_WARN + 1.6 + 0.1, true, rng);
  expect(w.target).toBe(0);
  expect(w.nextGust).toBeGreaterThan(1.5);
  expect(w.nextGust).toBeLessThanOrEqual(2); // 2 + rng() * 2.5 with rng 0
  run(w, 1.8, true, rng); // before the next gust is announced
  expect(Math.abs(w.force)).toBeLessThan(5);
});

test('stepWind outside autumn drops the warning and everything calms', () => {
  const w = { force: 90, target: 100, next: 100, warn: 0.5, nextGust: 1, drift: 100 };
  run(w, 4, false, seq(0.9));
  expect(w.warn).toBe(0);
  expect(w.target).toBe(0);
  expect(Math.abs(w.force)).toBeLessThan(1);
  expect(Math.abs(w.drift)).toBeLessThan(1);
  expect(windArrow(w)).toBe(0);
});

test('stepWind drift leads the force', () => {
  const w = calm(), rng = seq(0.9, 0.5);
  run(w, 4.05 + WIND_WARN, true, rng);
  expect(w.drift).toBeGreaterThan(w.force);
  expect(w.drift).toBeGreaterThan(50);
});

test('windArrow: shows from the warning on, through the push, until the force is gone', () => {
  expect(windArrow({ warn: 0.4, next: -100, target: 0, force: 0 })).toBe(-1);
  expect(windArrow({ warn: 0, next: 100, target: 100, force: 5 })).toBe(1); // push has begun, force still small
  expect(windArrow({ warn: 0, next: 0, target: 0, force: -60 })).toBe(-1); // gust over, force fading
  expect(windArrow({ warn: 0, next: 0, target: 0, force: 30 })).toBe(0);
  expect(windArrow({ warn: 0, next: 100, target: 0, force: 0 })).toBe(0);
});

test('no sudden jump inside a season, the breather steps up by a bounded amount', () => {
  for (let n = 0; n <= 300; n++) {
    const newSeason = n % WALLS_PER_SEASON === WALLS_PER_SEASON - 1; // the step into a new season
    expect(Math.abs(gapWidthAt(n + 1) - gapWidthAt(n))).toBeLessThanOrEqual(newSeason ? 0.6 : 0.15);
    expect(Math.abs(intervalAt(n + 1) - intervalAt(n))).toBeLessThanOrEqual(newSeason ? 0.2 : 0.05);
    expect(speedAt(n + 1) - speedAt(n)).toBeLessThan(0.25);
    expect(windAt(n)).toBeLessThanOrEqual(132);
  }
});

test('seasons loop forever', () => {
  expect(seasonIndexAt(0, 15, 4)).toBe(0);
  expect(seasonIndexAt(15, 15, 4)).toBe(1);
  expect(seasonIndexAt(60, 15, 4)).toBe(0);
});

test('gap stays inside the corridor', () => {
  for (const r of [0, 0.5, 0.999]) {
    const [g] = makeGaps(0, 4.9, spring, seq(r));
    expect(g.x - g.w / 2).toBeGreaterThanOrEqual(-CORRIDOR / 2);
    expect(g.x + g.w / 2).toBeLessThanOrEqual(CORRIDOR / 2);
  }
});

test('summer can add a second gap later in the run', () => {
  const gaps = makeGaps(25, 3, summer, seq(0.9, 0.1, 0.5));
  expect(gaps.length).toBe(2);
  expect(makeGaps(25, 3, spring, seq(0.9, 0.1, 0.5)).length).toBe(1);
});

test('player passes only when fully inside a gap', () => {
  const gaps = [{ x: 0, w: 2 }];
  expect(passesWall(0, 0.4, gaps)).toBe(true);
  expect(passesWall(0.7, 0.4, gaps)).toBe(false);
  expect(passesWall(3, 0.4, gaps)).toBe(false);
});

test('widened gap is bigger but capped', () => {
  expect(widened({ x: 1, w: 2 }, 1.6).w).toBeCloseTo(3.2);
  expect(widened({ x: 1, w: 5 }, 1.6).w).toBe(CORRIDOR * 0.6);
});

test('solid segments cover everything but the gaps', () => {
  const segs = solidSegments([{ x: 2, w: 2 }, { x: -2, w: 1 }]);
  expect(segs).toEqual([[-WALL_EXT, -2.5], [-1.5, 1], [3, WALL_EXT]]);
});

test('plants switch season past the last wall of the current one', () => {
  const walls = [{ index: 18, z: 10 }, { index: 19, z: 25 }, { index: 20, z: 40 }];
  expect(seasonAhead(walls, 0, 20, 4)).toEqual({ z: 25, idx: 1 });
  expect(seasonAhead(walls.slice(0, 1), 0, 20, 4)).toEqual({ z: Infinity, idx: 0 });
  // last season wraps around to the first
  expect(seasonAhead([{ index: 79, z: 30 }], 3, 20, 4)).toEqual({ z: 30, idx: 0 });
});

test('slipAmount: ice is full, puddle fades out', () => {
  expect(slipAmount(true, 0)).toBe(1);
  expect(slipAmount(false, 0)).toBe(0);
  expect(slipAmount(false, 1.4)).toBe(1);
  expect(slipAmount(false, 0.25)).toBeCloseTo(0.5);
});

test('skidStrength: needs slip and sideways speed', () => {
  expect(skidStrength(10, 0)).toBe(0);
  expect(skidStrength(0.5, 1)).toBe(0);
  expect(skidStrength(-10, 1)).toBe(1);
  expect(skidStrength(3.7, 1)).toBeCloseTo(0.5);
});

test('slip edge cases', () => {
  expect(slipAmount(true, 0.3)).toBe(1);
  expect(skidStrength(10, 0.5)).toBeCloseTo(0.5);
  expect(skidStrength(1.2, 1)).toBe(0);
});

const lcg = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

test('surface track starts on dirt, has long varied stretches and never repeats back to back', () => {
  const track = createSurfaceTrack(lcg(7));
  expect(track(0)).toBe('dirt');
  expect(track(-5)).toBe('dirt');
  expect(track(149)).toBe('dirt');
  const first = Array.from({ length: 400 }, (_, i) => track(i * 10));
  expect(Array.from({ length: 400 }, (_, i) => track(i * 10))).toEqual(first);
  const runs = [];
  first.forEach((id, i) => { if (id === first[i - 1]) runs[runs.length - 1]++; else runs.push(1); });
  expect(new Set(first).size).toBe(3);
  // every stretch but the (cut off) last spans at least 120 units
  for (const n of runs.slice(0, -1)) expect(n).toBeGreaterThanOrEqual(11);
});

test('surface track follows the rng', () => {
  expect(createSurfaceTrack(() => 0.1)(150)).toBe('gravel');
  expect(createSurfaceTrack(() => 0.9)(150)).toBe('grass');
  expect(createSurfaceTrack(() => 0)(269)).toBe('gravel');
  expect(createSurfaceTrack(() => 0)(271)).toBe('grass');
});

test('stripSource flips the slice so its top is the far edge', () => {
  // near edge at 25% of the tile, row spans 1/16 of it
  const r = stripSource(2, 2.5, 8, 512, 4);
  expect(r.parts.length).toBe(1);
  expect(r.parts[0].sy).toBeCloseTo(512 * (1 - 0.25 - 0.0625));
  expect(r.parts[0].sh).toBeCloseTo(32);
  // moving the near edge farther lowers sy
  expect(stripSource(3, 3.5, 8, 512, 4).parts[0].sy).toBeLessThan(r.parts[0].sy);
});

test('stripSource splits a slice that crosses the tile edge without shifting it', () => {
  const r = stripSource(7.9, 8.4, 8, 512, 4);
  expect(r.parts.length).toBe(2);
  const [a, b] = r.parts;
  expect(a.sy + a.sh).toBeCloseTo(512);
  expect(b.sy).toBe(0);
  expect(a.sh + b.sh).toBeCloseTo(32);
  expect(a.f1).toBeCloseTo(b.f0);
  expect(a.f0).toBe(0);
  expect(b.f1).toBe(1);
  // negative world coordinates wrap too
  expect(stripSource(-0.2, 0.1, 8, 512, 4).parts.length).toBe(2);
});

test('stripSource picks a coarser mip for rows that cover more texture', () => {
  expect(stripSource(1, 1.01, 8, 512, 4).level).toBe(0);
  expect(stripSource(1, 1.07, 8, 512, 4).level).toBe(2);
  expect(stripSource(1, 20, 8, 512, 4).level).toBe(4);
  expect(stripSource(1, 1.07, 8, 512, 1).level).toBe(1);
});

test('helmets stack up to the cap', () => {
  expect(addHelmet(0, 3)).toBe(1);
  expect(addHelmet(2, 3)).toBe(3);
  expect(addHelmet(3, 3)).toBe(3);
});
