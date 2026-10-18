import { afterEach, expect, test } from 'bun:test';
import { drawGround } from '../js/render.js';

const oldDocument = globalThis.document;
afterEach(() => { globalThis.document = oldDocument; });

test('overlaps only the first destination slice at a wrapped tile split', () => {
  const lightContext = {
    createLinearGradient: () => ({ addColorStop() {} }),
    fillRect() {},
  };
  globalThis.document = { createElement: () => ({ getContext: () => lightContext }) };
  const calls = [];
  const ctx = {
    fillRect() {},
    drawImage(...args) { calls.push(args); },
  };
  const season = { id: 'test', fog: [1, 2, 3], path: [4, 5, 6], grass: [7, 8, 9], shadow: [1, 1, 1], rim: [2, 2, 2] };
  const tile = {};
  drawGround(ctx, {
    W: 100, H: 1, horizonY: 0, F: 1, cx: 50,
    // z=12 gives no fog; source z 7..12 crosses the tile boundary at 8.
    groundRows: [0, 12, 0, 7],
  }, season, 0, () => ({ id: 'dirt' }), { test: { dirt: [tile, tile, tile, tile, tile] } });

  const slices = calls.filter((call) => call[0] === tile);
  expect(slices).toHaveLength(2);
  expect(slices[0][8]).toBeCloseTo(2 * 0.75 + 1);
  expect(slices[1][6]).toBeCloseTo(1.5);
  expect(slices[1][8]).toBeCloseTo(0.5);
});
