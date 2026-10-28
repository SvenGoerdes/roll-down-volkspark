import { test, expect } from 'bun:test';
import { syringeFor, stepSyringes, syringeContextSafe } from '../js/syringes.js';
import { impactLeft } from '../js/impact-effect.js';
import { CORRIDOR, PLAYER_R, SYRINGES, SEASONS } from '../js/config.js';
import { makeGaps, spacingAt, seasonIndexAt, widened } from '../js/logic.js';
import { seeded } from '../js/sprites.js';

const fixture = (index = 22) => ({ index, season: 'summer',
  previous: { z: 60, gaps: [{ x: -1, w: 2.6 }] },
  wall: { z: 90, gaps: [{ x: -1, w: 2.6 }] },
  puddles: [], surfaceAt: () => ({ id: 'dirt' }) });
const eligible = () => {
  for (let index = 12; index < 40; index++) { const f = fixture(index); if (syringeFor(f)) return f; }
  throw new Error('No deterministic candidate');
};

test('rare obstacle is outside every playable passage and their direct connector', () => {
  const rng = seeded(123);
  let previous = null, lastX = 0, count = 0, lastIndex = -Infinity;
  for (let index = 0; index < 10000; index++) {
    const season = SEASONS[seasonIndexAt(index, 20, 4)];
    const wall = { z: 90, gaps: makeGaps(index, lastX, season, rng) };
    lastX = wall.gaps[0].x;
    if (previous) previous.z = 90 - spacingAt(index);
    const item = syringeFor({ ...fixture(index), season: season.id, previous, wall, lastIndex });
    if (item) {
      count++;
      expect(index - lastIndex).toBeGreaterThanOrEqual(SYRINGES.cooldown);
      lastIndex = index;
      expect(Math.abs(item.x) + SYRINGES.radius).toBeLessThan(CORRIDOR / 2);
      expect(item.z - previous.z).toBeGreaterThanOrEqual(SYRINGES.wallClearance);
      const centres = [...previous.gaps, ...wall.gaps].map((gap) => widened(gap, 1.6)).flatMap((g) => [g.x - g.w / 2 + PLAYER_R * 0.75, g.x + g.w / 2 - PLAYER_R * 0.75]);
      const safe = PLAYER_R * 0.75 + SYRINGES.radius + SYRINGES.driftMargin;
      expect(item.x + safe < Math.min(...centres) || item.x - safe > Math.max(...centres)).toBe(true);
    }
    previous = wall;
  }
  expect(count).toBeGreaterThan(30);
  expect(count).toBeLessThan(500);
});

test('tutorial, season entry, wind, ice, gravel and preceding puddle slip exclude syringes', () => {
  const f = eligible();
  for (const patch of [{ index: 2 }, { index: 20 }, { season: 'autumn' }, { season: 'winter' },
    { previous: null }, { lastIndex: f.index - 1 }, { surfaceAt: () => ({ id: 'gravel' }) },
    { puddles: [{ z: 60 }] }, { previous: { ...f.previous, z: 80 } },
    { wall: { z: 90, gaps: [{ x: 2.4, w: 2.8 }] }, previous: { z: 60, gaps: [{ x: -2.4, w: 2.8 }] } }]) {
    expect(syringeFor({ ...f, ...patch })).toBeNull();
  }
});

test('a pickup never lures the player into a syringe', () => {
  const f = eligible(), item = syringeFor(f);
  const blocked = syringeFor({ ...f, pickups: [{ ...item, type: 'helmet' }] });
  expect(blocked === null || blocked.x !== item.x).toBe(true);
});

test('a crossing consumes the obstacle once, with matching radius, also across a long frame', () => {
  const item = { x: 2, z: 5 };
  expect(stepSyringes([item], 2, 2)).toBe(true);
  expect(item.hit).toBe(true);
  expect(stepSyringes([item], 1, 2)).toBe(false);
  const missed = { x: 2, z: 5 };
  expect(stepSyringes([missed], 2, 0)).toBe(false);
  expect(missed.resolved).toBe(true);
  expect(stepSyringes([missed], 1, 2)).toBe(false);
  expect(stepSyringes([{ x: 2, z: 5 }], 2, 2 + PLAYER_R * 0.75 + SYRINGES.radius + 1e-9)).toBe(false);
});

test('impact expires without changing the game controls', () => {
  expect(impactLeft(0.85, 0.1)).toBeCloseTo(0.75);
  expect(impactLeft(0.1, 1)).toBe(0);
});

test('actual wind, ice, puddle slip and gravel cancel planned hazards after crashes', () => {
  expect(syringeContextSafe('spring', 0, 'dirt')).toBe(true);
  expect(syringeContextSafe('summer', 0, 'grass')).toBe(true);
  expect(syringeContextSafe('autumn', 0, 'dirt')).toBe(false);
  expect(syringeContextSafe('winter', 0, 'dirt')).toBe(false);
  expect(syringeContextSafe('summer', 0.01, 'dirt')).toBe(false);
  expect(syringeContextSafe('spring', 0, 'gravel')).toBe(false);
});

test('a later widening pickup cannot move a legal direct route into the syringe', () => {
  const f = { ...fixture(22),
    previous: { z: 69.6601554, gaps: [{ x: -0.7452831246, w: 3.1878152724 }] },
    wall: { z: 90, gaps: [{ x: -1.2245393536, w: 3.0625260621 }] } };
  const item = syringeFor(f);
  if (item) expect(stepSyringes([{ ...item, z: 5 }], 2, -2.62)).toBe(false);
  expect(item === null || item.x > 0).toBe(true);
});
