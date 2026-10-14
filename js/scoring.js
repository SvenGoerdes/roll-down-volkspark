// How a wall was passed, for the "Perfekt" and "Knapp!" feedback. Pure, no DOM.
export const PERFECT = 0.25; // ball centre at most this far from the gap centre
export const CLOSE = 0.12; // room left to the nearer gap edge that counts as a near miss
export const STREAK_NEED = 6; // perfect passes in a row for a free helmet

// How a successful pass went, judged against the gap whose centre is nearest the ball.
export function judgePass(px, radius, gaps) {
  const gap = gaps.reduce((a, b) => (Math.abs(b.x - px) < Math.abs(a.x - px) ? b : a));
  const offset = Math.abs(px - gap.x);
  if (offset <= PERFECT) return 'perfect';
  const room = gap.w / 2 - offset - radius;
  return room <= CLOSE ? 'close' : 'clean';
}

// Perfect streak after one pass. Every `need`th perfect in a row gives a helmet and starts the count over.
export function nextStreak(streak, kind, need = STREAK_NEED) {
  if (kind !== 'perfect') return { streak: 0, reward: false };
  const s = streak + 1;
  return s >= need ? { streak: 0, reward: true } : { streak: s, reward: false };
}

// Walls still to pass to beat the record. 0 when there is no record or it is already beaten.
export const wallsToRecord = (passed, best) => (best > 0 && passed <= best ? best - passed + 1 : 0);

// The wall whose pass would beat the record, or null. Only walls still ahead of the ball count.
export function recordWall(walls, passed, best, playerZ) {
  if (best <= 0 || best < passed) return null;
  let left = best - passed; // runs every frame: no array
  for (const w of walls) {
    if (w.z <= playerZ || w.broken) continue;
    if (left-- === 0) return w;
  }
  return null;
}
