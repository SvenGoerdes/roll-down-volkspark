import { test, expect } from 'bun:test';
import { CORRIDOR } from '../js/config.js';
import { sceneryAt, SCENERY_FAR } from '../js/scenery.js';
import { stepFx, burstStones, burstSparkles } from '../js/fx.js';

const seq = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };

test('roadside plants keep their world spot while the camera moves', () => {
  // sceneryAt reuses its result array and plant objects, so snapshot each call
  const a = sceneryAt(100).map((p) => ({ ...p })), b = sceneryAt(101.5).map((p) => ({ ...p }));
  const shared = a.filter((p) => b.some((q) => q.id === p.id));
  expect(shared.length).toBeGreaterThan(10);
  for (const p of shared) {
    const q = b.find((o) => o.id === p.id);
    expect(q.z).toBeCloseTo(p.z - 1.5);
    expect(q.x).toBe(p.x);
    expect(q.kind).toBe(p.kind);
  }
});

test('plants stay beside the corridor and inside the drawn range', () => {
  const items = sceneryAt(1234.5);
  expect(items.some((p) => p.side < 0)).toBe(true);
  expect(items.some((p) => p.side > 0)).toBe(true);
  for (const p of items) {
    expect(Math.abs(p.x)).toBeGreaterThan(CORRIDOR / 2 + 0.5);
    expect(p.z).toBeGreaterThanOrEqual(1);
    expect(p.z).toBeLessThanOrEqual(SCENERY_FAR);
  }
});

test('effects fall, age and expire', () => {
  const fx = [];
  burstStones(fx, 100, 200, 1, seq(0.5));
  burstSparkles(fx, 50, 50, 1, seq(0.5));
  const stone = fx.find((f) => f.kind === 'stone');
  const vy = stone.vy;
  const left = stepFx(fx, 0.1);
  expect(stone.vy).toBeGreaterThan(vy);
  expect(left.length).toBe(fx.length);
  expect(stepFx(fx, 10).length).toBe(0);
});
