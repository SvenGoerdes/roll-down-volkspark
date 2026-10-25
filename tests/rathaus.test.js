import { test, expect } from 'bun:test';
import { createHash } from 'node:crypto';
import { WALL_H, PLAYER_Z, RATHAUS_TOWER_INNER, CORRIDOR } from '../js/config.js';
import { gateLayout } from '../js/logic.js';
import { computeView, project } from '../js/view.js';
import { drawRathaus } from '../js/render-rathaus.js';
import { RATHAUS_ART } from '../js/rathaus-sprite-data.js';
import { loadRathausSprites } from '../js/rathaus-sprites.js';

const view = computeView(390, 844);
const art = Object.fromEntries(Object.entries(RATHAUS_ART).map(([key, meta]) => [key, { ...meta, image: key }]));
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

test('the Rathaus draws only inside solid spans and the wing row is no taller than a wall plus its cornice', () => {
  for (const gaps of [
    [{ x: -1.8, w: 1.95 }], [{ x: 1.8, w: 3.2 }],
    [{ x: -2, w: 2.2 }, { x: 2, w: 2.2 }],
    [{ x: -1, w: 4.48 }, { x: 1, w: 4.48 }],
  ]) {
    const ctx = canvas(), wall = { z: 10 }, p = project(view, 0, wall.z);
    drawRathaus(ctx, view, wall, gaps, art);
    const solids = gateLayout(gaps).solids;
    expect(ctx.calls.some((c) => c.args[0] === 'wing')).toBe(true);
    for (const call of ctx.calls) {
      const [x, , width] = call.clips[0][0];
      const left = (x - view.cx) / p.s, right = left + width / p.s;
      expect(solids.some(([a, b]) => left >= a - 1e-9 && right <= b + 1e-9)).toBe(true);
    }
  }
  expect(RATHAUS_ART.wing.bottom + RATHAUS_ART.wing.worldHeight).toBeLessThan(WALL_H * 1.25);
});

test('wing tiles overlap by a pixel so no seam shows, and abut by whole bays', () => {
  const ctx = canvas(), wall = { z: 10 }, p = project(view, 0, wall.z);
  drawRathaus(ctx, view, wall, [{ x: 0, w: 2 }], art);
  const wings = ctx.calls.filter((c) => c.args[0] === 'wing').map((c) => c.args);
  const spanOf = new Map(ctx.calls.filter((c) => c.args[0] === 'wing').map((c) => [c.args, c.clips[0][0][0]]));
  expect(wings.length).toBeGreaterThan(2);
  const step = RATHAUS_ART.wing.worldWidth * p.s;
  let steps = 0;
  for (let i = 1; i < wings.length; i++) {
    if (spanOf.get(wings[i]) !== spanOf.get(wings[i - 1])) continue;
    expect(wings[i][1] - wings[i - 1][1]).toBeCloseTo(step);
    expect(wings[i - 1][3]).toBeCloseTo(step + 1);
    steps++;
  }
  expect(steps).toBeGreaterThan(1);
});

test('the clocktower stands left of the corridor so a following gap is never behind it', () => {
  const ctx = canvas(), wall = { z: 10 }, p = project(view, 0, wall.z);
  drawRathaus(ctx, view, wall, [{ x: 0, w: 3.7 }], art);
  const towers = ctx.calls.filter((c) => c.args[0] === 'tower');
  expect(towers).toHaveLength(1);
  const x = (towers[0].args[1] - view.cx) / p.s, w = towers[0].args[3] / p.s;
  expect(x + w).toBeCloseTo(-RATHAUS_TOWER_INNER);
  expect(x + w).toBeLessThan(-CORRIDOR / 2);
});

test('the Rathaus draws nothing behind the player or without art', () => {
  const ctx = canvas();
  drawRathaus(ctx, view, { z: PLAYER_Z }, [], art);
  drawRathaus(ctx, view, { z: 10 }, [], null);
  expect(ctx.calls).toHaveLength(0);
});

test('Rathaus images load through the existing loader and a failure is not partial', async () => {
  const loaded = [];
  const sprites = await loadRathausSprites(async (src) => { loaded.push(src); return src; });
  expect(loaded).toEqual(Object.values(RATHAUS_ART).map((p) => p.src));
  expect(Object.keys(sprites)).toEqual(['wing', 'tower']);
  await expect(loadRathausSprites(async () => { throw new Error('offline'); })).rejects.toThrow('offline');
});

test('Rathaus WebPs and anchors match their provenance within the optional-art budget', async () => {
  const manifest = await Bun.file('assets/landmarks/rathaus-provenance.json').json();
  expect(await hash('tools/blender/render-rathaus-sprites.py')).toBe(manifest.scriptSha256);
  expect(await hash('tools/build-rathaus-sprites.py')).toBe(manifest.packerSha256);
  let bytes = 0, decoded = 0;
  for (const [part, meta] of Object.entries(RATHAUS_ART)) {
    const source = manifest.parts[part];
    expect(await hash(meta.src)).toBe(source.webpSha256);
    for (const key of ['left', 'width', 'height', 'worldWidth', 'worldHeight', 'bottom']) expect(meta[key]).toBe(source[key]);
    expect(meta.worldHeight).toBeCloseTo(meta.worldWidth * meta.height / meta.width);
    bytes += Bun.file(meta.src).size; decoded += meta.width * meta.height * 4;
  }
  expect(bytes).toBeLessThan(150_000);
  expect(decoded).toBeLessThan(6 * 1024 * 1024);
});
