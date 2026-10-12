import { test, expect } from 'bun:test';
import { CORRIDOR, WALL_EXT, SEASONS } from '../js/config.js';
import {
  speedAt, gapWidthAt, spacingAt, seasonIndexAt, makeGaps, widened, passesWall, solidSegments, slipAmount, skidStrength,
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
