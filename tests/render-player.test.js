import { test, expect } from 'bun:test';
import { drawPlayer } from '../js/render-player.js';
import { computeView } from '../js/view.js';

test('intro rendering needs no idle sheet and hands off with the roll squash at spin zero', () => {
  const calls = [];
  const ctx = {
    globalAlpha: 1, save() {}, restore() {}, translate: (...a) => calls.push(['translate', ...a]),
    rotate() {}, transform() {}, scale: (...a) => calls.push(['scale', ...a]),
    drawImage: (...a) => calls.push(['draw', ...a]),
  };
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const gradient = { addColorStop() {} };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => ({
    getContext: () => ({ createRadialGradient: () => gradient, fillRect() {} }),
  }) } });
  const view = computeView(390, 800);
  const sheet = { img: 'intro-sheet', n: 36, fps: 24, contact: 18, ppu: 160, w: 100, h: 100, cols: 6, ax: 50, ay: 50 };
  const figure = { intro: sheet, roll: { ...sheet, img: 'roll-sheet', n: 32 } };
  const player = { x: 0, spin: 0, bump: 0, vx: 0, slip: 0 };
  try {
    drawPlayer(ctx, view, player, 0, 0, figure, { clip: 'intro', frame: 35, trip: 1 });
    const introScale = calls.find(([kind]) => kind === 'scale');
    calls.length = 0;
    drawPlayer(ctx, view, player, 0, 0, figure, { clip: 'roll', frame: 0 });
    const rollScale = calls.find(([kind]) => kind === 'scale');
    expect(introScale[1]).toBeCloseTo(rollScale[1]);
    expect(introScale[2]).toBeCloseTo(rollScale[2]);
    expect(calls.some(([kind, ...args]) => kind === 'draw' && args[0] === 'roll-sheet')).toBe(true);

    const normalDraw = calls.find(([kind, img]) => kind === 'draw' && img === 'roll-sheet');
    calls.length = 0;
    drawPlayer(ctx, view, player, 0, 0, figure, { clip: 'roll', frame: 0 }, 5);
    const superDraws = calls.filter(([kind]) => kind === 'draw');
    expect(superDraws.length).toBe(3); // shadow, aura, figure
    const superFigureDraw = calls.find(([kind, img]) => kind === 'draw' && img === 'roll-sheet');
    expect(superFigureDraw[7]).toBeCloseTo(normalDraw[7] * 1.3);
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
  }
});
