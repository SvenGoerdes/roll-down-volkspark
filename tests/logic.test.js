import { test, expect } from 'bun:test';
import { CORRIDOR, WALL_EXT, SEASONS } from '../js/config.js';
import {
  speedAt, gapWidthAt, spacingAt, seasonIndexAt, makeGaps, widened, passesWall, solidSegments, createSurfaceTrack, stripSource,
} from '../js/logic.js';

const seq = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };
const [spring, summer] = SEASONS;

test('speed rises slowly and caps', () => {
  expect(speedAt(0)).toBe(16);
  expect(speedAt(60)).toBeGreaterThan(speedAt(30));
  expect(speedAt(10_000)).toBe(40);
});

test('gaps shrink and spacing tightens, both with a floor', () => {
  expect(gapWidthAt(0)).toBeGreaterThan(gapWidthAt(40));
  expect(gapWidthAt(10_000)).toBe(1.9);
  expect(spacingAt(10_000)).toBe(10);
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
  const gaps = makeGaps(20, 3, summer, seq(0.9, 0.1, 0.5));
  expect(gaps.length).toBe(2);
  expect(makeGaps(20, 3, spring, seq(0.9, 0.1, 0.5)).length).toBe(1);
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
