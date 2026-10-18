import { test, expect } from 'bun:test';
import { SHEETS, PPU } from '../js/figure-sheets.js';
import {
  FIGURES, DEFAULT_FIGURE, GAME_CLIPS, DAZED_FPS,
  frameIndex, rollFrame, introAt, pickFigure, poseFor, spriteScale, FIG_UNIT, loadFigure, drawFrame,
} from '../js/figure.js';

test('looping frames wrap and one-shot frames hold the last one', () => {
  expect(frameIndex(0, 10, 4, true)).toBe(0);
  expect(frameIndex(0.25, 10, 4, true)).toBe(2);
  expect(frameIndex(0.45, 10, 4, true)).toBe(0);
  expect(frameIndex(0.25, 10, 4, false)).toBe(2);
  expect(frameIndex(9, 10, 4, false)).toBe(3);
});

test('negative time gives frame 0', () => {
  expect(frameIndex(-1, 10, 4, true)).toBe(0);
  expect(frameIndex(-1, 10, 4, false)).toBe(0);
});

test('roll frame follows the spin angle over one turn', () => {
  expect(rollFrame(0, 32)).toBe(0);
  expect(rollFrame(Math.PI * 2, 32)).toBe(0);
  expect(rollFrame(Math.PI, 32)).toBe(16);
});

test('roll frame stays in range for negative and large spins', () => {
  for (const spin of [-0.1, -Math.PI, -100, -1e6, 1e6, 12345.6]) {
    const i = rollFrame(spin, 32);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThan(32);
  }
});

test('intro timing uses the selected clip metadata, including boundaries and negative time', () => {
  const a = { intro: { n: 5, fps: 10, contact: 2 } };
  const b = { intro: { n: 9, fps: 20, contact: 4 } };
  expect(introAt(0.2, a)).toEqual({ clip: 'intro', frame: 2, trip: 0, done: false });
  expect(introAt(-1, a)).toEqual({ clip: 'intro', frame: 0, trip: 0, done: false });
  expect(introAt(0.4, a)).toEqual({ clip: 'intro', frame: 4, trip: 1, done: false });
  expect(introAt(0.5, a)).toEqual({ clip: 'intro', frame: 4, trip: 1, done: true });
  expect(introAt(0.2, b).frame).toBe(4);
  expect(introAt(0.2, b).trip).toBe(0);
  expect(introAt(0.25, b).trip).toBeCloseTo(0.25);
  expect(introAt(0.45, b).done).toBe(true);
  expect(introAt(0.45, a).done).toBe(false);
});

test('human intro metadata describes a complete short contact-to-roll clip', () => {
  for (const { id } of FIGURES) {
    const clip = SHEETS[id].intro;
    expect(clip.n / clip.fps).toBeCloseTo(1.5);
    expect(clip.contact).toBeGreaterThan(0);
    expect(clip.contact).toBeLessThan(clip.n - 1);
    expect(introAt(clip.n / clip.fps, SHEETS[id])).toEqual({ clip: 'intro', frame: clip.n - 1, trip: 1, done: true });
    expect(clip.ppu).toBeGreaterThanOrEqual(192);
  }
});

test('pickFigure keeps known ids and falls back to the default', () => {
  for (const f of FIGURES) expect(pickFigure(f.id)).toBe(f.id);
  for (const bad of [null, undefined, '', 'nobody', 'KALLE', 'constructor', 42, {}]) {
    expect(pickFigure(bad)).toBe(DEFAULT_FIGURE);
  }
});

test('poseFor intro uses the selected intro sheet', () => {
  const sheets = { intro: { n: 5, fps: 10, contact: 2 } };
  expect(poseFor({ mode: 'intro', t: 0.3 }, sheets)).toEqual({ clip: 'intro', frame: 3, trip: 0.5 });
});

test('poseFor roll picks the helmet clip when wearing one', () => {
  for (const id of FIGURES.map((f) => f.id)) {
    const sheets = SHEETS[id];
    expect(poseFor({ mode: 'roll', spin: 1, helmet: false }, sheets).clip).toBe('roll');
    expect(poseFor({ mode: 'roll', spin: 1, helmet: true }, sheets).clip).toBe('roll-helmet');
    for (const helmet of [false, true]) {
      const { clip, frame } = poseFor({ mode: 'roll', spin: -7.3, helmet }, sheets);
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThan(sheets[clip].n);
    }
  }
});

test('poseFor dazed loops the stars', () => {
  for (const id of FIGURES.map((f) => f.id)) {
    const sheets = SHEETS[id];
    for (const t of [0, 0.3, 5, 99.9]) {
      const { clip, frame } = poseFor({ mode: 'dazed', t }, sheets);
      expect(clip).toBe('dazed');
      expect(frame).toBe(frameIndex(t, DAZED_FPS, sheets.dazed.n, true));
      expect(frame).toBeLessThan(sheets.dazed.n);
    }
  }
});

test('sprite scale is 1 at the figure size', () => {
  expect(spriteScale(PPU / FIG_UNIT)).toBeCloseTo(1);
  expect(spriteScale(PPU / FIG_UNIT, { ppu: PPU / 2 })).toBeCloseTo(2);
});

test('every figure has all game clips and the select clip', () => {
  expect(GAME_CLIPS).toEqual(['intro', 'roll', 'roll-helmet', 'dazed']);
  for (const { id } of FIGURES) {
    for (const clip of [...GAME_CLIPS, 'select']) {
      expect(SHEETS[id][clip]).toBeDefined();
    }
  }
});

test('sheets fit the width and height limits', () => {
  for (const { id } of FIGURES) {
    for (const s of Object.values(SHEETS[id])) {
      expect(s.cols * s.w).toBeLessThanOrEqual(2048);
      expect(Math.ceil(s.n / s.cols) * s.h).toBeLessThanOrEqual(2048);
    }
  }
});

test('select sheet is a single row', () => {
  for (const { id } of FIGURES) {
    expect(SHEETS[id].select.n).toBeLessThanOrEqual(SHEETS[id].select.cols);
  }
});

test('roll and roll-helmet have the same frame count', () => {
  for (const { id } of FIGURES) {
    expect(SHEETS[id]['roll-helmet'].n).toBe(SHEETS[id].roll.n);
  }
});

test('dazed has a two-number head position', () => {
  for (const { id } of FIGURES) {
    const { head } = SHEETS[id].dazed;
    expect(Array.isArray(head)).toBe(true);
    expect(head).toHaveLength(2);
    expect(typeof head[0]).toBe('number');
    expect(typeof head[1]).toBe('number');
  }
});

test('loadFigure loads every game clip with its sheet meta', async () => {
  const sheets = await loadFigure('kalle', async (src) => ({ src }));
  expect(Object.keys(sheets).sort()).toEqual([...GAME_CLIPS].sort());
  for (const clip of GAME_CLIPS) {
    expect(sheets[clip]).toEqual({ ...SHEETS.kalle[clip], img: { src: `assets/figures/kalle/${clip}.webp` } });
  }
});

test('loadFigure loads only the requested clips', async () => {
  const sheets = await loadFigure('tine', async (src) => ({ src }), ['roll']);
  expect(Object.keys(sheets)).toEqual(['roll']);
  expect(sheets.roll.img.src).toBe('assets/figures/tine/roll.webp');
  expect(sheets.roll.n).toBe(SHEETS.tine.roll.n);
});

test('loadFigure rejects when one clip fails to load', async () => {
  const loadImage = async (src) => {
    if (src.endsWith('/roll.webp')) throw new Error('missing');
    return { src };
  };
  await expect(loadFigure('kalle', loadImage)).rejects.toThrow('missing');
});

test('loadFigure decodes each image and still resolves when decode rejects', async () => {
  let decoded = 0;
  const loadImage = async () => ({ decode: () => { decoded++; return Promise.resolve(); } });
  await loadFigure('kalle', loadImage, ['intro', 'roll']);
  expect(decoded).toBe(2);

  const failing = async () => ({ decode: () => Promise.reject(new Error('no decode')) });
  const sheets = await loadFigure('kalle', failing, ['intro']);
  expect(sheets.intro.img).toBeDefined();
});

test('drawFrame crops the frame from the sheet and centres it on the anchor', () => {
  const calls = [];
  const ctx = { drawImage: (...args) => calls.push(args) };
  drawFrame(ctx, { img: 'I', w: 10, h: 20, cols: 3, ax: 5, ay: 8 }, 4, 100, 50, 2);
  expect(calls).toEqual([['I', 10, 20, 10, 20, 90, 34, 20, 40]]);
});
