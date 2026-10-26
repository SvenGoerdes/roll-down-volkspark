import { test, expect } from 'bun:test';
import { createHash } from 'node:crypto';
import { PLAYER_Z, OBERBAUM_TOWER_X } from '../js/config.js';
import { gateLayout } from '../js/logic.js';
import { computeView, project } from '../js/view.js';
import { drawOberbaum } from '../js/render-oberbaum.js';
import { OBERBAUM_ART } from '../js/oberbaum-sprite-data.js';
import { loadOberbaumSprites } from '../js/oberbaum-sprites.js';

const view = computeView(390, 844);
const art = Object.fromEntries(Object.entries(OBERBAUM_ART).map(([key, meta]) => [key, { ...meta, image: key }]));
const hash = async (path) => createHash('sha256').update(new Uint8Array(await Bun.file(path).arrayBuffer())).digest('hex');

function canvas() {
  const calls = [], stack = [];
  let rects = [], clips = [];
  return {
    calls, globalAlpha: 1,
    save() { stack.push({ clips: [...clips], alpha: this.globalAlpha }); },
    restore() { const old = stack.pop(); clips = old.clips; this.globalAlpha = old.alpha; },
    beginPath() { rects = []; }, rect(...args) { rects.push(args); },
    clip() { clips.push([...rects]); },
    drawImage(...args) { calls.push({ args, clips: [...clips] }); },
  };
}

test('bridge piers and towers stay in the solids and each real opening gets an attached arch', () => {
  for (const gaps of [
    [{ x: -1.8, w: 1.95 }], [{ x: 1.8, w: 3.2 }],
    [{ x: -2, w: 2.2 }, { x: 2, w: 2.2 }],
    [{ x: -1, w: 4.48 }, { x: 1, w: 4.48 }],
  ]) {
    const ctx = canvas(), wall = { z: 10 }, p = project(view, 0, wall.z);
    drawOberbaum(ctx, view, wall, gaps, art);
    const { solids, openings } = gateLayout(gaps);
    const arch = ctx.calls.filter((c) => c.args[0] === 'arch');
    expect(arch).toHaveLength(openings.length);
    for (let i = 0; i < arch.length; i++) {
      const [, x, y, width, height] = arch[i].args;
      // Real sprite spring points at the pier crown must track both passage edges.
      expect((x + width * 140 / 696 - p.sx) / p.s).toBeCloseTo(openings[i].x - openings[i].w / 2);
      expect((x + width * 555 / 696 - p.sx) / p.s).toBeCloseTo(openings[i].x + openings[i].w / 2);
      expect(height / p.s).toBeCloseTo(art.arch.worldHeight);
      expect((p.sy - y - height) / p.s).toBeCloseTo(art.arch.bottom);
      const [clipX, , clipWidth] = arch[i].clips[0][0];
      if (i) expect(clipX).toBeGreaterThanOrEqual(arch[i - 1].clips[0][0][0] + arch[i - 1].clips[0][0][2] - 1e-9);
      expect(clipWidth).toBeGreaterThan(0);
    }
    const rest = ctx.calls.filter((c) => c.args[0] !== 'arch');
    expect(rest.some((c) => c.args[0] === 'pier')).toBe(true);
    for (const call of rest) {
      const [x, , width] = call.clips[0][0];
      const left = (x - view.cx) / p.s, right = left + width / p.s;
      expect(solids.some(([a, b]) => left >= a - 1e-9 && right <= b + 1e-9)).toBe(true);
    }
  }
});

test('arches follow widening activation and expiry during approach on the same wall', () => {
  const wall = { z: 14 }, gaps = [{ x: -2, w: 2.2 }, { x: 2, w: 2.2 }];
  const archImages = (w) => {
    const ctx = canvas();
    drawOberbaum(ctx, view, wall, gaps.map((g) => ({ ...g, w: g.w * w })), art);
    const p = project(view, 0, wall.z);
    return ctx.calls.filter((c) => c.args[0] === 'arch').map(({ args: [, x, , width] }) => [(x - p.sx) / p.s, width / p.s]);
  };
  const normal = archImages(1), wide = archImages(1.6);
  expect(wide).not.toEqual(normal);
  wall.z = 10;
  const active = archImages(1.6);
  active.forEach((a, i) => a.forEach((value, j) => expect(value).toBeCloseTo(wide[i][j])));
  wall.z = 6;
  archImages(1).forEach((a, i) => a.forEach((value, j) => expect(value).toBeCloseTo(normal[i][j])));
});

test('towers stand outside the corridor so a following gap is never behind one', () => {
  const ctx = canvas(), wall = { z: 10 }, p = project(view, 0, wall.z);
  drawOberbaum(ctx, view, wall, [{ x: 0, w: 3.7 }], art);
  const towers = ctx.calls.filter((c) => c.args[0].startsWith('tower'));
  expect(towers).toHaveLength(2);
  for (const t of towers) {
    const x = (t.args[1] - view.cx) / p.s, w = t.args[3] / p.s;
    expect(Math.abs(x + w / 2)).toBeCloseTo(OBERBAUM_TOWER_X);
    expect(Math.min(Math.abs(x), Math.abs(x + w))).toBeGreaterThan(4);
  }
});

test('the bridge draws nothing behind the player or without art', () => {
  const ctx = canvas();
  drawOberbaum(ctx, view, { z: PLAYER_Z }, [], art);
  drawOberbaum(ctx, view, { z: 10 }, [], null);
  expect(ctx.calls).toHaveLength(0);
});

test('bridge images load through the existing loader and a failure is not partial', async () => {
  const loaded = [];
  const sprites = await loadOberbaumSprites(async (src) => { loaded.push(src); return src; });
  expect(loaded).toEqual(Object.values(OBERBAUM_ART).map((p) => p.src));
  expect(Object.keys(sprites)).toEqual(['tower-left', 'tower-right', 'arch', 'pier']);
  await expect(loadOberbaumSprites(async () => { throw new Error('offline'); })).rejects.toThrow('offline');
});

test('bridge WebPs and anchors match their provenance within the optional-art budget', async () => {
  const manifest = await Bun.file('assets/landmarks/oberbaum-provenance.json').json();
  expect(await hash('tools/blender/render-oberbaum-sprites.py')).toBe(manifest.scriptSha256);
  expect(await hash('tools/build-oberbaum-sprites.py')).toBe(manifest.packerSha256);
  let bytes = 0, decoded = 0;
  for (const [part, meta] of Object.entries(OBERBAUM_ART)) {
    const source = manifest.parts[part];
    expect(await hash(meta.src)).toBe(source.webpSha256);
    for (const key of ['left', 'width', 'height', 'worldWidth', 'worldHeight', 'bottom']) expect(meta[key]).toBe(source[key]);
    expect(meta.worldHeight).toBeCloseTo(meta.worldWidth * meta.height / meta.width);
    bytes += Bun.file(meta.src).size; decoded += meta.width * meta.height * 4;
  }
  expect(bytes).toBeLessThan(150_000);
  expect(decoded).toBeLessThan(6 * 1024 * 1024); // like the gate
});
