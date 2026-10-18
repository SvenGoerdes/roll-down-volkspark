import { test, expect } from 'bun:test';
import { SIGHTSEEING_LANDMARKS, SEASONS, WALL_EXT } from '../js/config.js';
import { gateLayout, gapWidthAt, makeGaps, passesGate, passesWall, widened } from '../js/logic.js';

const seq = (...values) => { let i = 0; return () => values[i++ % values.length]; };

test('five sightseeing landmarks have unique ids and named opening forms', () => {
  expect(SIGHTSEEING_LANDMARKS.map(({ id }) => id)).toEqual([
    'brandenburg-gate', 'reichstag', 'red-town-hall', 'oberbaum-bridge', 'east-side-gallery',
  ]);
  expect(new Set(SIGHTSEEING_LANDMARKS.map(({ id }) => id)).size).toBe(5);
  for (const landmark of SIGHTSEEING_LANDMARKS) {
    expect(landmark.name).toBeTruthy();
    expect(landmark.openingForm).toBeTruthy();
  }
});

test('a closed portal blocks passage while an open one allows exact edge contact', () => {
  const layout = gateLayout([], [
    { x: 0, w: 2, open: true },
    { x: 3, w: 2, open: false },
  ]);
  expect(passesGate(0.6, 0.4, layout)).toBe(true);
  expect(passesGate(-0.6, 0.4, layout)).toBe(true);
  expect(passesGate(0.6001, 0.4, layout)).toBe(false);
  expect(passesGate(3, 0.4, layout)).toBe(false);
  expect(layout.solids).toEqual([[-WALL_EXT, -1], [1, WALL_EXT]]);
});

test('summer widened render openings merge without extending the single-gap passage rule', () => {
  const [spring, summer] = SEASONS;
  const gaps = makeGaps(25, 2, summer, seq(0.5, 0.1, 0.5));
  expect(gaps).toHaveLength(2);
  const widenedGaps = gaps.map((gap) => widened(gap, 1.6));
  const layout = gateLayout(widenedGaps);
  expect(layout.openings).toHaveLength(1);
  expect(layout.openings[0].w).toBeGreaterThanOrEqual(gapWidthAt(25) * summer.gapMul);
  expect(layout.openings[0].w).toBeGreaterThan(widenedGaps[0].w);
  expect(passesGate(0, 0.7, layout)).toBe(false);
  expect(makeGaps(25, 3, spring, seq(0.9, 0.1, 0.5))).toHaveLength(1);
});

test('nested and same-centre openings merge in any input order without mutation', () => {
  const gaps = [{ x: 1, w: 2 }, { x: -1, w: 2 }, { x: 0, w: 6 }];
  const original = structuredClone(gaps);
  const layout = gateLayout(gaps);
  expect(layout.openings).toEqual([{ x: 0, w: 6 }]);
  expect(gaps).toEqual(original);
  expect(passesGate(2.8, 0.2, layout)).toBe(true);
  expect(passesGate(2.81, 0.2, layout)).toBe(false);
  expect(layout.solids).toEqual([[-WALL_EXT, -3], [3, WALL_EXT]]);
  expect(gateLayout([{ x: 0, w: 2 }, { x: 0, w: 6 }, { x: 0, w: 4 }]).openings).toEqual([{ x: 0, w: 6 }]);
});

test('touching spans form one opening and both radius boundaries pass', () => {
  const layout = gateLayout([{ x: -1, w: 2 }, { x: 1, w: 2 }]);
  expect(layout.openings).toEqual([{ x: 0, w: 4 }]);
  expect(passesGate(0, 0.4, layout)).toBe(false);
  expect(passesGate(-1.6, 0.4, layout)).toBe(true);
  expect(passesGate(1.6, 0.4, layout)).toBe(true);
  expect(passesGate(1.6001, 0.4, layout)).toBe(false);
});

test('closed doorways stay solid unless an open span covers them', () => {
  const closed = gateLayout([], [{ x: 0, w: 2, open: false }]);
  expect(closed.openings).toEqual([]);
  expect(passesGate(0, 0.2, closed)).toBe(false);
  expect(closed.solids).toEqual([[-WALL_EXT, WALL_EXT]]);
  const covered = gateLayout([{ x: 0, w: 2 }], [{ x: 0, w: 1, open: false }]);
  expect(passesGate(0, 0.2, covered)).toBe(true);
});

test('empty layouts are solid and all-closed layouts have no openings', () => {
  const empty = gateLayout([]);
  const allClosed = gateLayout([], [{ x: -1, w: 1, open: false }, { x: 1, w: 1, open: false }]);
  expect(empty).toEqual({ openings: [], passages: [], solids: [[-WALL_EXT, WALL_EXT]] });
  expect(allClosed).toEqual(empty);
  expect(passesGate(0, 0, empty)).toBe(false);
});

test('merged openings never create a passage unavailable through one original gap', () => {
  const gaps = [{ x: -0.45, w: 1.1 }, { x: 0.45, w: 1.1 }];
  const layout = gateLayout(gaps);
  for (const factor of [1, 1.6]) {
    const widenedGaps = gaps.map((gap) => widened(gap, factor));
    const widenedLayout = gateLayout(widenedGaps);
    for (const x of [-1, -0.5, 0, 0.5, 1]) {
      for (const radius of [0, 0.2, 0.5, 0.8]) {
        expect(passesGate(x, radius, widenedLayout)).toBe(passesWall(x, radius, widenedGaps));
      }
    }
  }
  expect(layout.openings).toHaveLength(1);
  expect(passesGate(0, 0.2, layout)).toBe(false);
});

test('gate passage uses the same radius rule as existing wall passage', () => {
  const gaps = [{ x: 0, w: 2 }];
  const layout = gateLayout(gaps);
  for (const [x, radius] of [[0, 0.4], [0.6, 0.4], [0.6001, 0.4], [3, 0.4]]) {
    expect(passesGate(x, radius, layout)).toBe(passesWall(x, radius, gaps));
  }
});
