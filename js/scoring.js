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

// The world record is the top leaderboard score. Anything else (offline, junk) means no world goal.
export const validWorldBest = (score) => Number.isInteger(score) && score > 0 && score <= 10000 ? score : null;

// A late leaderboard response may change only the current run's unstarted goal.
export const applyWorldBest = (passed, score) => passed === 0 ? validWorldBest(score) : null;

// The nearer of the own and the world record still to beat: { target (score to beat), walls, own, world }, or null.
export function recordGoal(passed, best, worldBest) {
  const own = wallsToRecord(passed, best);
  const world = wallsToRecord(passed, worldBest);
  if (!own && !world) return null;
  const walls = Math.min(own || Infinity, world || Infinity);
  return { target: passed + walls - 1, walls, own: own === walls, world: world === walls };
}

// Text under the game-over score: which record fell, or how far the nearest one is.
export function overNote(passed, best, worldBest) {
  if (worldBest > 0 && passed > worldBest) return { text: 'Neuer Weltrekord!', record: true };
  if (best > 0 && passed > best) return { text: 'Neuer Rekord!', record: true };
  const goal = recordGoal(passed, best, worldBest);
  if (!goal) return { text: '', record: false };
  return { text: `Noch ${goal.walls} ${goal.walls === 1 ? 'Mauer' : 'Mauern'} bis zum ${goal.world ? 'Weltrekord' : 'Rekord'}`, record: false };
}

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
