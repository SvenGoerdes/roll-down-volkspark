// Conservative obstacle rules; chance comes from existing wall geometry, without a new random draw.
import { CORRIDOR, PLAYER_R, PLAYER_Z, WALLS_PER_SEASON, SYRINGES } from './config.js';
import { widened } from './logic.js';

const radius = PLAYER_R * 0.75;
const rollFor = (index, x) => {
  let seed = (Math.round(x * 1e6) ^ Math.imul(index + 1, 0x9e3779b9)) | 0;
  seed = Math.imul(seed ^ seed >>> 16, 0x21f0aaad);
  seed = Math.imul(seed ^ seed >>> 15, 0x735a2d97);
  return ((seed ^ seed >>> 15) >>> 0) / 4294967296;
};

// Protect every legal centre with MAXIMUM widening in both walls, plus drift. Their
// convex hull also protects a direct connection between any pair of passages.
export function syringeFor({ index, season, previous, wall, puddles, pickups = [], surfaceAt, lastIndex = -Infinity }) {
  if (index < SYRINGES.from || index - lastIndex < SYRINGES.cooldown || !previous) return null;
  if (index % WALLS_PER_SEASON < 2 || !['spring', 'summer'].includes(season)) return null; // no stacking with gusts or ice
  if (rollFor(index, wall.gaps[0].x) >= (index < 12 ? SYRINGES.introChance : SYRINGES.chance)) return null;
  const z = (previous.z + wall.z) / 2;
  // A visible interval on either side, and no puddle slip reaching this interval.
  if (z - previous.z < SYRINGES.wallClearance) return null;
  if (puddles.some((pd) => pd.z <= z + 1 && z - pd.z < SYRINGES.puddleClearance)) return null;
  if (surfaceAt(z).id === 'gravel') return null;
  const gaps = [...previous.gaps, ...wall.gaps].map((gap) => widened(gap, 1.6));
  const lo = Math.min(...gaps.map((g) => g.x - g.w / 2 + radius));
  const hi = Math.max(...gaps.map((g) => g.x + g.w / 2 - radius));
  const clearance = radius + SYRINGES.radius + SYRINGES.driftMargin;
  const edge = CORRIDOR / 2 - SYRINGES.radius - 0.25;
  const candidates = [-edge, edge].filter((x) =>
    (x + clearance < lo || x - clearance > hi)
    && !pickups.some((item) => !item.taken && Math.abs(item.z - z) < SYRINGES.wallClearance && Math.abs(item.x - x) < clearance + 1));
  if (!candidates.length) return null;
  return { x: candidates[Math.floor(rollFor(index + 97, wall.gaps[0].x) * candidates.length)], z, index };
}

// A crash can leave passed/spawned in different seasons; check the actual run too.
export const syringeContextSafe = (season, slippery, surface) =>
  ['spring', 'summer'].includes(season) && slippery <= 0 && surface !== 'gravel';

// Consume at the crossing, even on a miss: one object can never hit twice.
export function stepSyringes(items, dz, px) {
  let hit = false;
  for (const item of items) {
    const before = item.z;
    item.z -= dz;
    if (item.resolved || before <= PLAYER_Z || item.z > PLAYER_Z) continue;
    item.resolved = true;
    if (Math.abs(item.x - px) < radius + SYRINGES.radius) { item.hit = true; hit = true; }
  }
  return hit;
}
