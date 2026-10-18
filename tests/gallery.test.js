import { test, expect } from 'bun:test';
import { createHash } from 'node:crypto';
import { WALL_EXT, WALLS_PER_SEASON, TOUR_LANDMARKS, PLAYER_Z } from '../js/config.js';
import { landmarkAt, galleryTiles, gateLayout, plantHidden } from '../js/logic.js';
import { computeView, project } from '../js/view.js';
import { drawGallery, GALLERY_BAYS } from '../js/render-gallery.js';
import { EAST_SIDE_GALLERY_ART, GALLERY_PITCH } from '../js/gallery-sprite-data.js';
import { loadGallerySprites } from '../js/gallery-sprites.js';

const view = computeView(390, 844);
const art = Object.fromEntries(Object.entries(EAST_SIDE_GALLERY_ART).map(([key, meta]) => [key, { ...meta, image: key }]));
const hash = async (path) => createHash('sha256').update(new Uint8Array(await Bun.file(path).arrayBuffer())).digest('hex');

function canvas() {
  const calls = [], stack = [];
  let rects = [], clips = [];
  return {
    calls, globalAlpha: 1,
    save() { stack.push({ clips: [...clips], alpha: this.globalAlpha }); },
    restore() { const old = stack.pop(); clips = old.clips; this.globalAlpha = old.alpha; },
    beginPath() { rects = []; }, rect(...args) { rects.push(args); },
    clip(rule) { clips.push({ rects: [...rects], rule }); },
    drawImage(...args) { calls.push({ args, clips: [...clips], alpha: this.globalAlpha }); },
  };
}

test('the Berlin tour shows one landmark per season block, in order, around again', () => {
  const at = (n) => landmarkAt(n, TOUR_LANDMARKS, WALLS_PER_SEASON);
  expect(TOUR_LANDMARKS).toEqual(['brandenburg-gate', 'east-side-gallery']);
  expect(at(0)).toBe('brandenburg-gate');
  expect(at(WALLS_PER_SEASON - 1)).toBe('brandenburg-gate');
  expect(at(WALLS_PER_SEASON)).toBe('east-side-gallery');
  expect(at(2 * WALLS_PER_SEASON - 1)).toBe('east-side-gallery');
  expect(at(2 * WALLS_PER_SEASON)).toBe('brandenburg-gate');
  expect(landmarkAt(45, ['a', 'b', 'c'], 20)).toBe('c');
  expect(landmarkAt(60, ['a', 'b', 'c'], 20)).toBe('a');
});

test('gallery bays tile a closed span from its open edge and never leave it', () => {
  const left = galleryTiles(-WALL_EXT, -1.9, GALLERY_PITCH, WALL_EXT);
  expect(left[0].bay).toBe(2); // l3 stands at the passage
  expect(left[1].bay).toBe(1);
  expect(left[0].to).toBeCloseTo(-1.9);
  expect(left.at(-1).from).toBe(-WALL_EXT);
  const right = galleryTiles(1.9, WALL_EXT, GALLERY_PITCH, WALL_EXT);
  expect(right.slice(0, 3).map((t) => t.bay)).toEqual([3, 4, 5]);
  expect(right[0].from).toBeCloseTo(1.9);
  // Between two passages: anchored right, exactly covers the span with no overlap.
  const mid = galleryTiles(-0.5, 0.7, GALLERY_PITCH, WALL_EXT);
  expect(mid.at(-1).from).toBe(-0.5);
  expect(mid[0].to).toBeCloseTo(0.7);
  for (const t of [...left, ...right, ...mid]) expect(t.to).toBeGreaterThan(t.from);
  // Bays cycle through the whole mural strip.
  expect(new Set(left.concat(right).map((t) => t.bay)).size).toBe(6);
});

test('gallery draws only inside solid spans for shifted, double and widened gaps', () => {
  for (const gaps of [
    [{ x: -1.8, w: 1.95 }], [{ x: 1.8, w: 3.2 }],
    [{ x: -2, w: 2.2 }, { x: 2, w: 2.2 }],
    [{ x: -1, w: 4.48 }, { x: 1, w: 4.48 }],
  ]) {
    const ctx = canvas(), wall = { z: 10, gaps }, p = project(view, 0, wall.z);
    drawGallery(ctx, view, wall, gaps, art);
    expect(ctx.calls.length).toBeGreaterThan(0);
    const solids = gateLayout(gaps).solids;
    for (const call of ctx.calls) {
      expect(GALLERY_BAYS).toContain(call.args[0]);
      const [x, , width] = call.clips[0].rects[0];
      const left = (x - view.cx) / p.s, right = left + width / p.s;
      expect(solids.some(([a, b]) => left >= a - 1e-9 && right <= b + 1e-9)).toBe(true);
    }
  }
  const ctx = canvas();
  drawGallery(ctx, view, { z: PLAYER_Z }, [], art);
  drawGallery(ctx, view, { z: 10 }, [], null);
  expect(ctx.calls).toHaveLength(0);
});

test('gallery images load through the existing loader and a failure is not partial', async () => {
  const loaded = [];
  const sprites = await loadGallerySprites(async (src) => { loaded.push(src); return src; });
  expect(loaded).toEqual(Object.values(EAST_SIDE_GALLERY_ART).map((p) => p.src));
  expect(Object.keys(sprites)).toEqual(GALLERY_BAYS);
  await expect(loadGallerySprites(async () => { throw new Error('offline'); })).rejects.toThrow('offline');
});

test('gallery WebPs and anchors match their provenance within the optional-art budget', async () => {
  const manifest = await Bun.file('assets/landmarks/gallery-provenance.json').json();
  expect(await hash('tools/blender/render-gallery-sprites.py')).toBe(manifest.scriptSha256);
  expect(await hash('tools/build-gallery-sprites.py')).toBe(manifest.packerSha256);
  expect(GALLERY_PITCH).toBe(manifest.pitch);
  let bytes = 0, decoded = 0;
  for (const [part, meta] of Object.entries(EAST_SIDE_GALLERY_ART)) {
    const source = manifest.parts[part];
    expect(await hash(meta.src)).toBe(source.webpSha256);
    for (const key of ['width', 'height', 'worldWidth', 'worldHeight', 'bottom']) expect(meta[key]).toBe(source[key]);
    expect(meta.worldHeight).toBeCloseTo(meta.worldWidth * meta.height / meta.width);
    bytes += Bun.file(meta.src).size; decoded += meta.width * meta.height * 4;
  }
  expect(bytes).toBeLessThan(100_000);
  expect(decoded).toBeLessThan(3 * 1024 * 1024);
});

test('plants right in front of a gallery wall are hidden, others stay', () => {
  const walls = [30, 60];
  expect(plantHidden(29, walls, 12)).toBe(true);
  expect(plantHidden(18, walls, 12)).toBe(true);
  expect(plantHidden(17.9, walls, 12)).toBe(false);
  expect(plantHidden(30, walls, 12)).toBe(false); // level with or behind the wall
  expect(plantHidden(31, walls, 12)).toBe(false);
  expect(plantHidden(40, walls, 12)).toBe(false);
  expect(plantHidden(10, [], 12)).toBe(false);
});
