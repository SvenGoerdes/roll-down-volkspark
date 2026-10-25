import { test, expect } from 'bun:test';
import { createHash } from 'node:crypto';
import { WALL_H, PLAYER_Z, REICHSTAG_PORTICO } from '../js/config.js';
import { gateLayout } from '../js/logic.js';
import { computeView, project } from '../js/view.js';
import { drawReichstag, columnLefts } from '../js/render-reichstag.js';
import { REICHSTAG_ART } from '../js/reichstag-sprite-data.js';
import { loadReichstagSprites } from '../js/reichstag-sprites.js';

const view = computeView(390, 844);
const art = Object.fromEntries(Object.entries(REICHSTAG_ART).map(([key, meta]) => [key, { ...meta, image: key }]));
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

const GAPS = [
  [{ x: -1.8, w: 1.95 }], [{ x: 1.8, w: 3.2 }],
  [{ x: -2, w: 2.2 }, { x: 2, w: 2.2 }],
  [{ x: -1, w: 4.48 }, { x: 1, w: 4.48 }],
];

test('wings and columns stay inside solid spans, the dome part hangs above wall height', () => {
  for (const gaps of GAPS) {
    const ctx = canvas(), wall = { z: 10 }, p = project(view, 0, wall.z);
    drawReichstag(ctx, view, wall, gaps, art);
    const solids = gateLayout(gaps).solids;
    const top = ctx.calls.filter((c) => c.args[0] === 'top');
    expect(top).toHaveLength(1);
    expect(top[0].clips).toHaveLength(0);
    const bottom = top[0].args[2] + top[0].args[4], cutoff = p.sy - WALL_H * p.s;
    expect(bottom).toBeLessThanOrEqual(cutoff + 1e-9);
    const rest = ctx.calls.filter((c) => c.args[0] !== 'top');
    expect(rest.some((c) => c.args[0] === 'column')).toBe(true);
    expect(rest.some((c) => c.args[0] === 'wing-left') || rest.some((c) => c.args[0] === 'wing-right')).toBe(true);
    for (const call of rest) {
      const [x, , width] = call.clips[0][0];
      const left = (x - view.cx) / p.s, right = left + width / p.s;
      expect(solids.some(([a, b]) => left >= a - 1e-9 && right <= b + 1e-9)).toBe(true);
      if (call.args[0] === 'column') expect(Math.abs(left) <= REICHSTAG_PORTICO + 1e-9 && Math.abs(right) <= REICHSTAG_PORTICO + 1e-9).toBe(true);
    }
  }
});

test('columns reach both edges of a closed span and neighbours leave no gap', () => {
  const w = art.column.worldWidth;
  for (const [a, b] of [[-4.44, -2.2], [-4.44, -1.8], [0.3, 4.44], [-4.44, -0.8]]) {
    const lefts = columnLefts(a, b, w);
    expect(lefts[0]).toBeCloseTo(a);
    expect(lefts.at(-1) + w).toBeCloseTo(b);
    // The wall slice behind each column is as wide as the column, so touching tiles close the span.
    for (let i = 1; i < lefts.length; i++) expect(lefts[i] - lefts[i - 1]).toBeLessThanOrEqual(w);
  }
  expect(columnLefts(0, w / 2, w)).toEqual([0]);
});

test('the Reichstag draws nothing behind the player or without art', () => {
  const ctx = canvas();
  drawReichstag(ctx, view, { z: PLAYER_Z }, [], art);
  drawReichstag(ctx, view, { z: 10 }, [], null);
  expect(ctx.calls).toHaveLength(0);
});

test('Reichstag images load through the existing loader and a failure is not partial', async () => {
  const loaded = [];
  const sprites = await loadReichstagSprites(async (src) => { loaded.push(src); return src; });
  expect(loaded).toEqual(Object.values(REICHSTAG_ART).map((p) => p.src));
  expect(Object.keys(sprites)).toEqual(['wing-left', 'wing-right', 'column', 'top']);
  await expect(loadReichstagSprites(async () => { throw new Error('offline'); })).rejects.toThrow('offline');
});

test('Reichstag WebPs and anchors match their provenance within the optional-art budget', async () => {
  const manifest = await Bun.file('assets/landmarks/reichstag-provenance.json').json();
  expect(await hash('tools/blender/render-reichstag-sprites.py')).toBe(manifest.scriptSha256);
  expect(await hash('tools/build-reichstag-sprites.py')).toBe(manifest.packerSha256);
  let bytes = 0, decoded = 0;
  for (const [part, meta] of Object.entries(REICHSTAG_ART)) {
    const source = manifest.parts[part];
    expect(await hash(meta.src)).toBe(source.webpSha256);
    for (const key of ['left', 'width', 'height', 'worldWidth', 'worldHeight', 'bottom']) expect(meta[key]).toBe(source[key]);
    expect(meta.worldHeight).toBeCloseTo(meta.worldWidth * meta.height / meta.width);
    bytes += Bun.file(meta.src).size; decoded += meta.width * meta.height * 4;
  }
  expect(bytes).toBeLessThan(200_000);
  expect(decoded).toBeLessThan(6 * 1024 * 1024); // like the gate
});

test('every closed span inside the building gets a wing or columns', () => {
  for (const gaps of GAPS) {
    const ctx = canvas(), wall = { z: 10 }, p = project(view, 0, wall.z);
    drawReichstag(ctx, view, wall, gaps, art);
    const drawn = ctx.calls.filter((c) => c.args[0] !== 'top').map((c) => {
      const [x, y, width, height] = c.clips[0][0];
      expect(y).toBe(0);
      expect(height).toBeCloseTo(p.sy);
      return [(x - view.cx) / p.s, (x - view.cx + width) / p.s];
    });
    for (const [a, b] of gateLayout(gaps).solids) {
      const mid = (Math.max(a, -9) + Math.min(b, 9)) / 2;
      expect(drawn.some(([l, r]) => l <= mid && mid <= r)).toBe(true);
    }
  }
});
