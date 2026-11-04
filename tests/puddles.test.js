import { afterEach, expect, test } from 'bun:test';
import { puddleSprite } from '../js/environment-sprites.js';
import { puddleSprite as reexportedPuddleSprite } from '../js/sprites.js';
import { drawPuddle } from '../js/render.js';
import { computeView, project } from '../js/view.js';
import { arrivalAlpha } from '../js/atmosphere.js';

const originalDocument = globalThis.document;
afterEach(() => { globalThis.document = originalDocument; });

function installCanvasMock(created = []) {
  globalThis.document = {
    createElement(tag) {
      const ops = [];
      const stops = [];
      const ctx = {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        ops,
        stops,
        save() { ops.push(['save']); },
        restore() { ops.push(['restore']); },
        clip() { ops.push(['clip']); },
        beginPath() { ops.push(['beginPath']); },
        moveTo(x, y) { ops.push(['moveTo', x, y]); },
        lineTo(x, y) { ops.push(['lineTo', x, y]); },
        quadraticCurveTo(cx, cy, x, y) { ops.push(['quadraticCurveTo', cx, cy, x, y]); },
        ellipse(x, y, rx, ry, rot) { ops.push(['ellipse', x, y, rx, ry, rot]); },
        closePath() { ops.push(['closePath']); },
        fill() { ops.push(['fill', ctx.fillStyle]); },
        stroke() { ops.push(['stroke', ctx.strokeStyle, ctx.lineWidth]); },
        createLinearGradient(x0, y0, x1, y1) {
          return {
            kind: 'linear-gradient',
            coords: [x0, y0, x1, y1],
            addColorStop(offset, color) { stops.push([offset, color]); },
          };
        },
      };
      const canvas = { tag, width: 0, height: 0, ctx, getContext: () => ctx };
      created.push(canvas);
      return canvas;
    },
  };
}

test('puddleSprite builds and memoizes three 256x96 offscreen Art-Bible variants', () => {
  const created = [];
  installCanvasMock(created);
  expect(reexportedPuddleSprite).toBe(puddleSprite);

  const s0 = puddleSprite(0);
  const s1 = puddleSprite(1);
  const s2 = puddleSprite(2);

  expect(s0.width).toBe(256);
  expect(s0.height).toBe(96);
  expect(s1.width).toBe(256);
  expect(s1.height).toBe(96);
  expect(s2.width).toBe(256);
  expect(s2.height).toBe(96);
  expect(s0).not.toBe(s1);
  expect(s1).not.toBe(s2);

  // Subsequent calls and modulo variants reuse the cached offscreen canvases.
  expect(puddleSprite()).toBe(s0);
  expect(puddleSprite(0)).toBe(s0);
  expect(puddleSprite(3)).toBe(s0);
  expect(puddleSprite(4)).toBe(s1);
  expect(puddleSprite(5)).toBe(s2);

  // Verify the layered Art-Bible palette (muddy verge, water gradient, canopy, shoreline, streaks, petals).
  const fills = s0.ctx.ops.filter(([op]) => op === 'fill').map(([, style]) => style);
  const strokes = s0.ctx.ops.filter(([op]) => op === 'stroke').map(([, style]) => style);
  const stopColors = s0.ctx.stops.map(([, color]) => color);
  expect(fills).toContain('rgba(58, 46, 35, 0.55)');
  expect(fills).toContain('#4a3d2f');
  expect(fills).toContain('rgba(92, 130, 88, 0.32)');
  expect(fills).toContain('rgba(235, 247, 255, 0.65)');
  expect(fills).toContain('#f4c9cc');
  expect(fills).toContain('#fff0dc');
  expect(strokes).toContain('rgba(28, 48, 66, 0.65)');
  expect(stopColors).toEqual(['#3d5a73', '#6e9bc0', '#8bb8d9', '#6e9bc0']);
});

test('drawPuddle blits the cached sprite at projected size, shimmers with camera/depth, and restores globalAlpha', () => {
  installCanvasMock();
  const view = computeView(390, 844);
  const draws = [];
  const alphas = [];
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    beginPath() {},
    ellipse() {},
    fill() {},
    drawImage(...args) {
      draws.push(args);
      alphas.push(ctx.globalAlpha);
    },
  };

  const puddle = { x: -1.2, z: 14, r: 1.15 };
  drawPuddle(ctx, view, puddle);

  expect(ctx.globalAlpha).toBe(1);
  expect(draws).toHaveLength(1);

  const expectedVariant = Math.abs(Math.round(puddle.x * 13 + puddle.r * 29)) % 3;
  const sprite = puddleSprite(expectedVariant);
  const { sx, sy, s } = project(view, puddle.x, puddle.z);
  const w = puddle.r * s * 2.2;
  const h = w * (sprite.height / sprite.width);

  expect(draws[0][0]).toBe(sprite);
  expect(draws[0][1]).toBeCloseTo(sx - w / 2, 6);
  expect(draws[0][2]).toBeCloseTo(sy - h / 2, 6);
  expect(draws[0][3]).toBeCloseTo(w, 6);
  expect(draws[0][4]).toBeCloseTo(h, 6);
  expect(alphas[0]).toBeGreaterThan(arrivalAlpha(puddle.z) * 0.87);
  expect(alphas[0]).toBeLessThanOrEqual(arrivalAlpha(puddle.z));

  // Explicit variant and camera movement update the sprite choice and shimmer alpha.
  view.cameraX = 0.7;
  drawPuddle(ctx, view, { ...puddle, variant: (expectedVariant + 1) % 3 });
  expect(ctx.globalAlpha).toBe(1);
  expect(draws[1][0]).toBe(puddleSprite((expectedVariant + 1) % 3));
  expect(alphas[1]).not.toBeCloseTo(alphas[0], 5);
});
