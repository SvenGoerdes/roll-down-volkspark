import { test, expect } from 'bun:test';
import { PERFECT, STREAK_NEED, judgePass, nextStreak, wallsToRecord, recordWall } from '../js/scoring.js';

const gap = { x: 0, w: 2 };

test('judgePass: centre and exactly PERFECT off centre are perfect', () => {
  expect(judgePass(0, 0.3, [gap])).toBe('perfect');
  expect(judgePass(1 + PERFECT, 0.3, [{ x: 1, w: 2 }])).toBe('perfect');
  expect(judgePass(-PERFECT, 0.3, [gap])).toBe('perfect');
});

test('judgePass: a narrow gap still counts a centre pass as perfect', () => {
  expect(judgePass(0, 0.25, [{ x: 0, w: 0.6 }])).toBe('perfect');
});

test('judgePass: a pass by a hair is close, on either side', () => {
  expect(judgePass(0.6, 0.3, [gap])).toBe('close');
  expect(judgePass(-0.6, 0.3, [gap])).toBe('close');
});

test('judgePass: between perfect and close is clean', () => {
  expect(judgePass(0.4, 0.3, [gap])).toBe('clean');
});

test('judgePass: uses the gap nearest to the ball', () => {
  // Judged against the gap at x = 0 this would read as a near miss.
  expect(judgePass(2.6, 0.3, [{ x: 0, w: 2 }, { x: 3, w: 2 }])).toBe('clean');
  expect(judgePass(2.6, 0.3, [{ x: 3, w: 2 }, { x: 0, w: 2 }])).toBe('clean');
});

test('nextStreak: a perfect pass adds one', () => {
  expect(nextStreak(0, 'perfect')).toEqual({ streak: 1, reward: false });
  expect(nextStreak(3, 'perfect')).toEqual({ streak: 4, reward: false });
});

test('nextStreak: close and clean passes reset the streak', () => {
  expect(nextStreak(4, 'close')).toEqual({ streak: 0, reward: false });
  expect(nextStreak(4, 'clean')).toEqual({ streak: 0, reward: false });
});

test('nextStreak: a helmet on every 6th perfect in a row', () => {
  let streak = 0;
  const rewards = [];
  for (let i = 1; i <= 2 * STREAK_NEED; i++) {
    const r = nextStreak(streak, 'perfect');
    streak = r.streak;
    if (r.reward) rewards.push(i);
  }
  expect(rewards).toEqual([STREAK_NEED, 2 * STREAK_NEED]);
  expect(nextStreak(5, 'perfect')).toEqual({ streak: 0, reward: true });
  expect(nextStreak(0, 'perfect')).toEqual({ streak: 1, reward: false });
});

test('nextStreak: custom need', () => {
  expect(nextStreak(1, 'perfect', 3)).toEqual({ streak: 2, reward: false });
  expect(nextStreak(2, 'perfect', 3)).toEqual({ streak: 0, reward: true });
  expect(nextStreak(0, 'perfect', 1)).toEqual({ streak: 0, reward: true });
});

test('wallsToRecord: no record means nothing to beat', () => {
  expect(wallsToRecord(0, 0)).toBe(0);
  expect(wallsToRecord(7, 0)).toBe(0);
});

test('wallsToRecord: counts the walls up to and past the record', () => {
  expect(wallsToRecord(2, 5)).toBe(4); // walls 3, 4, 5, 6
  expect(wallsToRecord(5, 5)).toBe(1); // wall 6
  expect(wallsToRecord(6, 5)).toBe(0); // record already beaten
});

// Walls for recordWall: one behind the ball (z 3), one broken ahead (z 8), three ahead (z 12, 16, 20).
const at = (z, extra = {}) => ({ z, gaps: [], ...extra });
const walls = [at(3), at(8, { broken: true }), at(12), at(16), at(20)];

test('recordWall: the wall at index best - passed among walls ahead', () => {
  expect(recordWall(walls, 0, 2, 5)).toBe(walls[4]); // third wall ahead, z 20
  expect(recordWall(walls, 1, 2, 5)).toBe(walls[3]); // second wall ahead, z 16
  expect(recordWall(walls, 2, 2, 5)).toBe(walls[2]); // next wall, z 12
});

test('recordWall: skips walls behind the ball and broken walls', () => {
  expect(recordWall(walls, 2, 2, 5)).toBe(walls[2]); // z 3 is behind, so index 0 is z 12
  expect(recordWall(walls, 0, 1, 5)).toBe(walls[3]); // z 8 is broken, so index 1 is z 16
});

test('recordWall: null without a record, once it is beaten, or past the last wall', () => {
  expect(recordWall(walls, 0, 0, 5)).toBeNull();
  expect(recordWall(walls, 3, 2, 5)).toBeNull();
  expect(recordWall(walls, 0, 3, 5)).toBeNull(); // three walls ahead, index 3 is out
  expect(recordWall([], 0, 1, 5)).toBeNull();
});
