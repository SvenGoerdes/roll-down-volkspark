// Daily challenge (#59): one fixed track per Berlin calendar day. Pure, no DOM.
import { seeded } from './sprites.js';

const DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });
const CLOCK = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// The Berlin calendar day of a moment, as 'YYYY-MM-DD'.
export const berlinDay = (date = new Date()) => DAY.format(date);

// FNV-1a over the day string: every day gets its own, unrelated seed.
export function daySeed(day) {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) h = Math.imul(h ^ day.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Two independent streams, so the walls never depend on when the surface track asks for numbers.
export const dailyRngs = (day) => ({ rng: seeded(daySeed(day)), surfaceRng: seeded(daySeed(`${day}:surface`)) });

// Whole hours left of the Berlin day, at least 1 (ignores the two 23/25-hour days of the clock change).
export function hoursLeft(date = new Date()) {
  const [h, m] = CLOCK.format(date).split(':').map(Number);
  return Math.max(1, Math.ceil((24 * 60 - h * 60 - m) / 60));
}

// Best score of a day in local storage form: keeps only the given day.
export const dailyBest = (stored, day) => (stored?.day === day && Number.isInteger(stored.best) && stored.best > 0 ? stored.best : 0);
export const withDailyBest = (stored, day, score) => ({ day, best: Math.max(dailyBest(stored, day), score) });
