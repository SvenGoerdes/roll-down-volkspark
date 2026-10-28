import { afterEach, expect, test } from 'bun:test';
import { computeView, project, followCamera, shiftCameraEffects, CAMERA_FOLLOW } from '../js/view.js';
import { PLAYER_Z } from '../js/config.js';
import { drawGround } from '../js/render.js';
import { drawIceSheen } from '../js/render-slip.js';
import { drawGate } from '../js/render-gate.js';
import { drawGallery } from '../js/render-gallery.js';
import { drawOberbaum } from '../js/render-oberbaum.js';
import { drawReichstag } from '../js/render-reichstag.js';
import { drawRathaus } from '../js/render-rathaus.js';
import { BRANDENBURG_GATE_ART } from '../js/gate-sprite-data.js';
import { EAST_SIDE_GALLERY_ART } from '../js/gallery-sprite-data.js';
import { OBERBAUM_ART } from '../js/oberbaum-sprite-data.js';
import { REICHSTAG_ART } from '../js/reichstag-sprite-data.js';
import { RATHAUS_ART } from '../js/rathaus-sprite-data.js';

const originalDocument = globalThis.document, originalPath = globalThis.Path2D;
afterEach(() => { globalThis.document = originalDocument; globalThis.Path2D = originalPath; });

const follow = (x, hz) => {
  const view = computeView(390, 844);
  for (let i = 0; i < hz; i++) followCamera(view, x, 1 / hz);
  return view;
};

test('camera follows symmetrically, smoothly and within its bound at different frame rates', () => {
  const at30 = follow(3.3, 30), at60 = follow(3.3, 60), at120 = follow(3.3, 120);
  expect(at30.cameraX).toBeCloseTo(at60.cameraX, 12);
  expect(at60.cameraX).toBeCloseTo(at120.cameraX, 12);
  expect(follow(-3.3, 60).cameraX).toBeCloseTo(-at60.cameraX, 12);
  expect(at60.cameraX).toBeLessThan(CAMERA_FOLLOW.limit);
  const view = computeView(390, 844), rows = view.groundRows;
  followCamera(view, 100, 1 / 60);
  expect(view.cameraX).toBeGreaterThan(0);
  expect(view.cameraX).toBeLessThan(CAMERA_FOLLOW.limit / 5);
  const before = view.cameraX;
  followCamera(view, -100, 1 / 60);
  expect(view.cameraX).toBeLessThan(before);
  followCamera(view, -100, 20);
  expect(view.cameraX).toBeCloseTo(-CAMERA_FOLLOW.limit, 12);
  followCamera(view, 100, 0);
  expect(view.cameraX).toBeCloseTo(-CAMERA_FOLLOW.limit, 12);
  expect(view.groundRows).toBe(rows);
  expect(computeView(390, 844).cameraX).toBe(0);
});

test('following reduces the apparent offset between player and aligned passage without changing scale or height', () => {
  for (const [w, h] of [[320, 568], [375, 667], [390, 844]]) for (const x of [-3.3, -1.8, 1.8, 3.3]) {
    const fixed = computeView(w, h), moving = computeView(w, h);
    followCamera(moving, x, 1);
    const gap = 12;
    const oldOffset = Math.abs(project(fixed, x, PLAYER_Z).sx - project(fixed, x, gap).sx);
    const newOffset = Math.abs(project(moving, x, PLAYER_Z).sx - project(moving, x, gap).sx);
    expect(newOffset).toBeLessThan(oldOffset * 0.6);
    for (const z of [PLAYER_Z, 12, 40, 90]) {
      const a = project(fixed, x, z), b = project(moving, x, z);
      expect(a.sy).toBe(b.sy);
      expect(a.s).toBe(b.s);
      expect(a.sx - b.sx).toBeCloseTo(moving.cameraX * b.s, 8);
    }
  }
});

test('ground tile rows remain attached to projected world edges without rebuilding their inverse depths', () => {
  globalThis.document = { createElement: () => ({ getContext: () => ({ createLinearGradient: () => ({ addColorStop() {} }), fillRect() {} }) }) };
  const view = computeView(390, 844), rows = view.groundRows;
  const season = { id: 'camera-test', fog: [1, 2, 3], grass: [7, 8, 9], shadow: [1, 1, 1], rim: [2, 2, 2] }, tile = {};
  const draw = () => {
    const calls = [];
    drawGround({ fillRect() {}, drawImage(...args) { if (args[0] === tile) calls.push(args); } }, view, season, 103, () => ({ id: 'dirt' }), { 'camera-test': { dirt: [tile, tile, tile, tile, tile] } }, 1);
    return calls;
  };
  const before = draw();
  followCamera(view, 3.3, 1);
  const after = draw();
  expect(after.length).toBe(before.length);
  for (let i = 0; i < after.length; i++) {
    const a = before[i], b = after[i];
    const y = Math.floor(b[6] / 2) * 2, z = rows[y + 1];
    expect(b.slice(1, 5)).toEqual(a.slice(1, 5));
    expect(b.slice(6)).toEqual(a.slice(6));
    expect(b[5] + b[7] / 2).toBeCloseTo(project(view, 0, z).sx, 6);
    expect(a[5] - b[5]).toBeCloseTo(view.cameraX * view.F / z, 6);
  }
  expect(view.groundRows).toBe(rows);
});

test('every landmark image and solid clip uses the same depth-dependent camera offset', () => {
  const view = computeView(390, 844), wall = { z: 12, gaps: [{ x: -1.7, w: 2.5 }] };
  const draw = (render, metadata) => {
    const calls = [], ctx = { save() {}, restore() {}, beginPath() {}, clip() {}, rect(...args) { calls.push(['clip', ...args]); }, drawImage(...args) { calls.push(['image', ...args]); } };
    const art = Object.fromEntries(Object.entries(metadata).map(([key, meta]) => [key, { ...meta, image: key }]));
    if (render === drawGate) render(ctx, view, wall, wall.gaps, {}, art);
    else render(ctx, view, wall, wall.gaps, art);
    return calls;
  };
  for (const [render, art] of [[drawGate, BRANDENBURG_GATE_ART], [drawGallery, EAST_SIDE_GALLERY_ART], [drawOberbaum, OBERBAUM_ART], [drawReichstag, REICHSTAG_ART], [drawRathaus, RATHAUS_ART]]) {
    view.cameraX = 0; const before = draw(render, art);
    view.cameraX = -1.3; const after = draw(render, art);
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBe(before.length);
    for (let i = 0; i < before.length; i++) {
      const xIndex = before[i][0] === 'clip' ? 1 : 2;
      expect(after[i][xIndex] - before[i][xIndex]).toBeCloseTo(1.3 * view.F / wall.z, 7);
      expect(after[i].slice(xIndex + 1)).toEqual(before[i].slice(xIndex + 1));
    }
  }
});

test('winter ice clipping follows a moving camera while its gradient and ground depths stay cached', () => {
  const paths = [];
  globalThis.Path2D = class { constructor() { this.points = []; paths.push(this); } moveTo(x, y) { this.points.push([x, y]); } lineTo(x, y) { this.points.push([x, y]); } closePath() {} };
  const view = computeView(390, 844), clips = [];
  let gradients = 0;
  const ctx = { save() {}, restore() {}, createLinearGradient() { gradients++; return { addColorStop() {} }; }, clip(path) { clips.push(path); }, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} };
  drawIceSheen(ctx, view, 100);
  drawIceSheen(ctx, view, 101);
  expect(clips[0]).toBe(clips[1]);
  followCamera(view, 3, 1);
  drawIceSheen(ctx, view, 101);
  expect(clips[2]).not.toBe(clips[0]);
  expect(gradients).toBe(1);
  for (let i = 1; i < paths[0].points.length; i++) {
    const [x, y] = paths[0].points[i], [nextX] = paths[1].points[i];
    expect(x - nextX).toBeCloseTo(view.cameraX * view.F / view.groundRows[y], 6);
  }
});

test('spray, sparkles and debris retain their projected origin during camera movement', () => {
  const view = computeView(390, 844), at = project(view, 2, PLAYER_Z);
  const game = { fx: [{ x: at.sx }], spray: [{ x: at.sx }], particles: [{ x: 100 }] };
  const dx = followCamera(view, 2, 1 / 60);
  shiftCameraEffects(game, view, dx);
  expect(game.fx[0].x).toBeCloseTo(project(view, 2, PLAYER_Z).sx, 8);
  expect(game.spray[0].x).toBeCloseTo(game.fx[0].x, 8);
  expect(game.particles[0].x).toBeCloseTo(100 - dx * 3, 8);
});
