// The figures (ADR 0018): which sprite frame to show when, and drawing a frame from its sheet.
// Frames come from Blender renders packed by tools/build-sprites.py; see js/figure-sheets.js.
import { SHEETS, PPU } from './figure-sheets.js';

export const FIGURES = [
  { id: 'kalle', name: 'Kalle', tag: 'vom Kiez' },
  { id: 'tine', name: 'Tine', tag: 'Techno' },
  { id: 'alaska', name: 'Alaska', tag: 'Brillenkatze' },
];
export const DEFAULT_FIGURE = 'kalle';
export const GAME_CLIPS = ['intro', 'roll', 'roll-helmet', 'dazed'];

// Dazed loop speed in frames per second.
export const DAZED_FPS = 8;

// Game units per figure unit: the tucked ball then is about as wide as the ball (2 × PLAYER_R).
export const FIG_UNIT = 1.75;

// Frame of a clip at time t; loops wrap, one-shots hold the last frame.
export function frameIndex(t, fps, n, loop) {
  const i = Math.floor(Math.max(0, t) * fps);
  return loop ? i % n : Math.min(n - 1, i);
}

// Roll frame for the ball's spin angle: one full turn plays all n frames.
export function rollFrame(spin, n) {
  const i = Math.floor((spin / (Math.PI * 2)) * n) % n;
  return i < 0 ? i + n : i;
}

// What the selected intro clip shows at time t: frame, post-contact progress 0..1, done.
export function introAt(t, sheets) {
  const intro = sheets.intro;
  const frame = Math.min(intro.n - 1, Math.floor(Math.max(0, t) * intro.fps));
  const trip = intro.n <= intro.contact ? 1 : Math.max(0, Math.min(1, (frame - intro.contact) / (intro.n - 1 - intro.contact)));
  return { clip: 'intro', frame, trip, done: t >= intro.n / intro.fps };
}

// The figure id if it exists, else the default.
export function pickFigure(id) {
  return FIGURES.some((f) => f.id === id) ? id : DEFAULT_FIGURE;
}

// Clip and frame of a figure for a mode: 'intro', 'roll' or 'dazed'. sheets is one figure's sheet map.
export function poseFor({ mode, t, spin, helmet }, sheets) {
  if (mode === 'intro') {
    const { clip, frame, trip } = introAt(t, sheets);
    return { clip, frame, trip };
  }
  if (mode === 'roll') {
    const clip = helmet ? 'roll-helmet' : 'roll';
    return { clip, frame: rollFrame(spin, sheets[clip].n) };
  }
  return { clip: 'dazed', frame: frameIndex(t, DAZED_FPS, sheets.dazed.n, true) };
}

// Loads one figure's sheets: { clip: { img, n, w, h, cols, ax, ay, … } }.
export async function loadFigure(id, loadImage, clips = GAME_CLIPS) {
  const imgs = await Promise.all(clips.map((c) => loadImage(`assets/figures/${id}/${c}.webp`)));
  await Promise.all(imgs.map((img) => img.decode?.().catch(() => {})));
  return Object.fromEntries(clips.map((c, i) => [c, { ...SHEETS[id][c], img: imgs[i] }]));
}

// Screen px per sprite px, for the ball scale s (screen px per game unit at the player's depth).
export const spriteScale = (s, sheet) => (s * FIG_UNIT) / (sheet?.ppu || PPU);

// Draws frame i of a sheet with its anchor (the ball centre) at x, y.
export function drawFrame(ctx, sheet, i, x, y, k) {
  const { img, w, h, cols, ax, ay } = sheet;
  ctx.drawImage(img, (i % cols) * w, Math.floor(i / cols) * h, w, h, x - ax * k, y - ay * k, w * k, h * k);
}
