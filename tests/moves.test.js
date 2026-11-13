import { test, expect } from 'bun:test';
import { jumpHeight, slideAmount, startMove, stepMoves, clearsTrunk, resolveTrunk, trunkFor, swipeMove } from '../js/moves.js';
import { MOVES, TRUNKS, PLAYER_R, WALL_H } from '../js/config.js';
import { nextStreak } from '../js/scoring.js';
import { intervalAt } from '../js/logic.js';
import { seeded } from '../js/sprites.js';

const D = MOVES.jump.duration;

test('a jump is a parabola from the ground to the peak and back', () => {
  expect(jumpHeight(0)).toBe(0);
  expect(jumpHeight(undefined)).toBe(0);
  expect(jumpHeight(D)).toBeCloseTo(0);
  expect(jumpHeight(D / 2)).toBeCloseTo(MOVES.jump.height);
  expect(jumpHeight(D * 0.25)).toBeCloseTo(jumpHeight(D * 0.75));
});

test('heights fit together: the jump clears the log but no wall, the slide fits under the birch, rolling does not', () => {
  expect(MOVES.jump.clear).toBeGreaterThanOrEqual(TRUNKS.lowH);
  expect(MOVES.jump.height).toBeLessThan(WALL_H);
  expect(2 * PLAYER_R * (1 - MOVES.slide.flat)).toBeLessThan(TRUNKS.highY);
  expect(2 * PLAYER_R).toBeGreaterThan(TRUNKS.highY);
});

test('one move at a time, and each one ends by itself', () => {
  const p = { jump: 0, slide: 0 };
  expect(startMove(p, 'jump')).toBe(true);
  expect(startMove(p, 'slide')).toBe(false);
  expect(p.slide).toBe(0);
  stepMoves(p, D + 0.01);
  expect(p.jump).toBe(0);
  expect(startMove(p, 'slide')).toBe(true);
  expect(slideAmount(p.slide - 0.2)).toBe(1);
  stepMoves(p, 10);
  expect(slideAmount(p.slide)).toBe(0);
});

test('a move is over before the next trunk can arrive, even at the tightest wall rhythm', () => {
  let tightest = Infinity;
  for (let n = 0; n < 400; n++) tightest = Math.min(tightest, intervalAt(n));
  expect(TRUNKS.cooldown).toBeGreaterThanOrEqual(2); // never two trunks back to back
  expect(MOVES.jump.duration).toBeLessThan(tightest * TRUNKS.cooldown);
  expect(MOVES.slide.duration).toBeLessThan(tightest * TRUNKS.cooldown);
});

test('the low log needs air, the high birch needs the slide', () => {
  const rolling = { jump: 0, slide: 0 }, mid = { jump: D / 2, slide: 0 }, sliding = { jump: 0, slide: 0.3 };
  const takeoff = { jump: D - 0.01, slide: 0 };
  expect(clearsTrunk('low', mid)).toBe(true);
  expect(clearsTrunk('low', rolling)).toBe(false);
  expect(clearsTrunk('low', takeoff)).toBe(false);
  expect(clearsTrunk('low', sliding)).toBe(false);
  expect(clearsTrunk('high', sliding)).toBe(true);
  expect(clearsTrunk('high', rolling)).toBe(false);
  expect(clearsTrunk('high', mid)).toBe(false);
  expect(resolveTrunk('low', mid)).toEqual({ passed: true, broken: false });
  expect(resolveTrunk('low', rolling)).toEqual({ passed: false, broken: true });
  expect(resolveTrunk('high', rolling, 3)).toEqual({ passed: true, broken: true });
});

test('the generous jump window is most of the jump', () => {
  let ok = 0;
  for (let i = 0; i < 100; i++) if (clearsTrunk('low', { jump: (D * (i + 0.5)) / 100, slide: 0 })) ok++;
  expect(ok).toBeGreaterThan(70);
});

test('trunks start late, keep their distance, skip landmark walls and come in both kinds', () => {
  const rng = seeded(5), kinds = { low: 0, high: 0 };
  let last = -Infinity;
  for (let i = 0; i < 5000; i++) {
    const kind = trunkFor(i, last, i % 10 === 0, rng);
    if (!kind) continue;
    expect(i).toBeGreaterThanOrEqual(TRUNKS.from);
    expect(i % 10).not.toBe(0);
    expect(i - last).toBeGreaterThanOrEqual(TRUNKS.cooldown);
    kinds[kind]++; last = i;
  }
  expect(kinds.low).toBeGreaterThan(200);
  expect(kinds.high).toBeGreaterThan(200);
  expect(kinds.low + kinds.high).toBeLessThan(5000 * TRUNKS.chance);
});

test('a quick vertical swipe fires once; sideways steering and slow drift never do', () => {
  const up = { x: 100, y: 400, t: 0 };
  expect(swipeMove(up, 102, 390, 30)).toBeNull();
  expect(swipeMove(up, 104, 370, 60)).toBe('jump');
  expect(swipeMove(up, 104, 368, 70)).toBeNull(); // re-anchored
  expect(swipeMove({ x: 100, y: 400, t: 0 }, 95, 440, 80)).toBe('slide');
  expect(swipeMove({ x: 100, y: 400, t: 0 }, 180, 430, 80)).toBeNull(); // mostly sideways
  const slow = { x: 100, y: 400, t: 0 };
  for (let i = 1; i <= 20; i++) expect(swipeMove(slow, 100, 400 - i * 6, i * 100)).toBeNull();
});

test('a cleared trunk keeps the perfect streak as it is', () => {
  expect(nextStreak(4, 'trunk')).toEqual({ streak: 4, reward: false });
  expect(nextStreak(4, 'trunk', 6, true)).toEqual({ streak: 0, reward: false });
  expect(nextStreak(5, 'perfect')).toEqual({ streak: 0, reward: true });
});
