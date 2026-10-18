import { test, expect } from 'bun:test';
import { drawGate, gateSightWindows } from '../js/render-gate.js';
import { computeView, project } from '../js/view.js';
import { gateLayout } from '../js/logic.js';
import { WALL_H, PLAYER_Z, GATE_ART } from '../js/config.js';
import { BRANDENBURG_GATE_ART } from '../js/gate-sprite-data.js';
import { loadGateSprites } from '../js/gate-sprites.js';

const view = computeView(390, 844);
const art = Object.fromEntries(Object.entries(BRANDENBURG_GATE_ART).map(([key, meta]) => [key, { ...meta, image: key }]));
function canvas() {
  const calls = [], stack = [];
  let rects = [], clips = [];
  return {
    calls, globalAlpha: 1,
    save() { stack.push({ clips: [...clips], alpha: this.globalAlpha }); },
    restore() { const old = stack.pop(); clips = old.clips; this.globalAlpha = old.alpha; },
    beginPath() { rects = []; }, rect(...args) { rects.push(args); },
    clip(rule) { clips.push({ rects: [...rects], rule }); },
    moveTo() {}, lineTo() {}, stroke() {},
    drawImage(...args) { calls.push({ args, clips: [...clips], alpha: this.globalAlpha }); },
  };
}

test('all pillar/barrier clips stay inside true solids for shifted, double and widened gaps', () => {
  for (const gaps of [
    [{ x: -1.8, w: 1.95 }], [{ x: 1.8, w: 3.2 }],
    [{ x: -2, w: 2.2 }, { x: 2, w: 2.2 }],
    [{ x: -1, w: 4.48 }, { x: 1, w: 4.48 }],
  ]) {
    const ctx = canvas(), wall = { z: 10, gaps }, p = project(view, 0, wall.z);
    drawGate(ctx, view, wall, gaps, {}, art);
    const solids = gateLayout(gaps).solids;
    for (const call of ctx.calls.filter((c) => c.args[0] !== 'roof')) {
      const [x, , width] = call.clips[0].rects[0];
      const left = (x - view.cx) / p.s, right = left + width / p.s;
      expect(solids.some(([a, b]) => left >= a - 1e-9 && right <= b + 1e-9)).toBe(true);
    }
    // Full-width piers, not the half-column clipping of the old render draft.
    const fullPiers = ctx.calls.filter((c) => c.args[0] === 'pier' && c.clips[0].rects[0][1] === 0);
    expect(fullPiers.length).toBeGreaterThan(1);
    expect(ctx.globalAlpha).toBe(1);
  }
});

test('sight window follows the next shifted/widened passage without fading the whole gate', () => {
  const next = { z: 25, gaps: [{ x: 1.4, w: 2 }] };
  const [r] = gateSightWindows(view, next, 1.6), p = project(view, 1.4, next.z);
  expect(r.x + r.w / 2).toBeCloseTo(p.sx);
  expect(r.w).toBeCloseTo((3.2 + GATE_ART.revealMargin * 2) * p.s);
  const ctx = canvas(), wall = { z: 5, gaps: [{ x: -1.5, w: 2 }] };
  drawGate(ctx, view, wall, wall.gaps, {}, art, next, 1.6);
  expect(ctx.calls.some((c) => c.alpha === GATE_ART.revealAlpha)).toBe(true);
  for (const call of ctx.calls.filter((c) => c.alpha === GATE_ART.revealAlpha)) {
    expect(call.clips[0].rects[0][1]).toBe(0);
    expect(call.clips.at(-1).rects).toEqual([[r.x, r.y, r.w, r.h]]);
  }
  const low = ctx.calls.filter((c) => c.clips[0].rects[0][1] !== 0);
  expect(low.every((c) => c.alpha === 1)).toBe(true);
  expect(ctx.calls.some((c) => c.args[0] === 'roof' && c.alpha === 1)).toBe(true);
});

test('layout refreshes on both widening activation and expiry for the same wall', () => {
  const wall = { z: 10, gaps: [{ x: 0, w: 2 }] };
  const leftEdge = (gaps) => {
    const ctx = canvas(); drawGate(ctx, view, wall, gaps, {}, art);
    return ctx.calls.find((c) => c.args[0] === 'pier').clips[0].rects[0];
  };
  const initial = leftEdge(wall.gaps);
  expect(leftEdge([{ x: 0, w: 3.2 }])).not.toEqual(initial);
  expect(leftEdge(wall.gaps)).toEqual(initial);
});

test('touching sight-window margins merge so even-odd clipping cannot cancel their overlap', () => {
  const next = { z: 25, gaps: [{ x: -1.05, w: 2 }, { x: 1.05, w: 2 }] };
  expect(gateSightWindows(view, next)).toHaveLength(1);
});

test('no gate is drawn at/behind the single collision plane or without loaded art', () => {
  const ctx = canvas();
  for (const z of [1, PLAYER_Z]) drawGate(ctx, view, { z }, [], {}, art);
  drawGate(ctx, view, { z: 10 }, [], {}, null);
  expect(ctx.calls).toHaveLength(0);
});

test('gate images load through the existing image loader and keep generated anchors', async () => {
  const loaded = [];
  const sprites = await loadGateSprites(async (src) => { loaded.push(src); return src; });
  expect(loaded).toEqual(Object.values(BRANDENBURG_GATE_ART).map((p) => p.src));
  expect(sprites.pier.worldWidth).toBe(BRANDENBURG_GATE_ART.pier.worldWidth);
  expect(sprites.roof.image).toEndWith('brandenburg-gate-roof.webp');
});

test('a rejected optional image load never returns partial gate art and can be retried', async () => {
  await expect(loadGateSprites(async () => { throw new Error('offline'); })).rejects.toThrow('offline');
  const sprites = await loadGateSprites(async (src) => src);
  expect(Object.keys(sprites)).toEqual(['roof', 'pier', 'barrier']);
});
