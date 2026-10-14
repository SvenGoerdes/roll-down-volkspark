import { test, expect } from 'bun:test';
import { depthMist, arrivalAlpha, wallAlpha } from '../js/atmosphere.js';
import { PLAYER_Z, SPAWN_Z } from '../js/config.js';

test('fog is bounded and monotonically increases with distance', () => {
  let previous = 0;
  for (let z = -10; z < 120; z++) {
    const mist = depthMist(z);
    expect(mist).toBeGreaterThanOrEqual(previous);
    expect(mist).toBeLessThanOrEqual(1);
    previous = mist;
  }
  expect(depthMist(12)).toBe(0);
  expect(depthMist(82)).toBe(1);
});

test('walls appear gradually at spawn and remain solid at collision depth', () => {
  expect(arrivalAlpha(SPAWN_Z)).toBe(0);
  expect(wallAlpha(SPAWN_Z - 0.1)).toBeLessThan(0.01);
  expect(wallAlpha(SPAWN_Z - 18)).toBe(1);
  expect(wallAlpha(PLAYER_Z)).toBe(1);
  expect(wallAlpha(1)).toBe(0);
  expect(arrivalAlpha(74, 74)).toBe(0);
  expect(arrivalAlpha(56, 74)).toBe(1);
});
