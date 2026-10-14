// The two figures (ADR 0018): which sprite frame to show when, and drawing a frame from its sheet.
// Frames come from Blender renders packed by tools/build-sprites.py; see js/figure-sheets.js.
import { SHEETS, PPU } from './figure-sheets.js';

export const FIGURES = [
  { id: 'kalle', name: 'Kalle', tag: 'vom Kiez' },
  { id: 'tine', name: 'Tine', tag: 'Techno' },
];
export const DEFAULT_FIGURE = 'kalle';
export const GAME_CLIPS = ['idle', 'turn', 'trip', 'roll', 'roll-helmet', 'dazed'];

// Dazed loop speed in frames per second.
export const DAZED_FPS = 8;

// Game units per figure unit: the tucked ball then is about as wide as the ball (2 × PLAYER_R).
export const FIG_UNIT = 1.75;

// Start sequence: stand facing us, turn round, trip over the bottle, roll.
export const INTRO = { idle: 0.7, idleFps: 12, turnFps: 20, tripFps: 30 };
const TURN_T = SHEETS.kalle.turn.n / INTRO.turnFps;
const TRIP_T = SHEETS.kalle.trip.n / INTRO.tripFps;
export const INTRO_T = INTRO.idle + TURN_T + TRIP_T;

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

// What the start sequence shows at time t: clip, frame, progress 0..1 through the trip, done.
export function introAt(t) {
  if (t < INTRO.idle) return { clip: 'idle', frame: frameIndex(t, INTRO.idleFps, SHEETS.kalle.idle.n, true), trip: 0, done: false };
  t -= INTRO.idle;
  if (t < TURN_T) return { clip: 'turn', frame: frameIndex(t, INTRO.turnFps, SHEETS.kalle.turn.n, false), trip: 0, done: false };
  t -= TURN_T;
  const trip = Math.min(1, t / TRIP_T);
  return { clip: 'trip', frame: frameIndex(t, INTRO.tripFps, SHEETS.kalle.trip.n, false), trip, done: t >= TRIP_T };
}

// The figure id if it exists, else the default.
export function pickFigure(id) {
  return FIGURES.some((f) => f.id === id) ? id : DEFAULT_FIGURE;
}

// Clip and frame of a figure for a mode: 'intro', 'roll' or 'dazed'. sheets is one figure's sheet map.
export function poseFor({ mode, t, spin, helmet }, sheets) {
  if (mode === 'intro') {
    const { clip, frame, trip } = introAt(t);
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
export const spriteScale = (s) => (s * FIG_UNIT) / PPU;

// Draws frame i of a sheet with its anchor (the ball centre) at x, y.
export function drawFrame(ctx, sheet, i, x, y, k) {
  const { img, w, h, cols, ax, ay } = sheet;
  ctx.drawImage(img, (i % cols) * w, Math.floor(i / cols) * h, w, h, x - ax * k, y - ay * k, w * k, h * k);
}
