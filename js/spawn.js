// Puts the next obstacle into the game: a wall with gaps or a tree trunk, plus its pickup, puddle and syringe.
// All track randomness comes from game.rng, so a seeded run (daily challenge) always gets the same track.
import {
  CORRIDOR, SPAWN_Z, SEASONS, WALLS_PER_SEASON, VOLKSPARK_LANDMARK_FROM, VOLKSPARK_LANDMARK_EVERY, TOUR_LANDMARKS,
} from './config.js';
import { spacingAt, makeGaps, seasonIndexAt, selectPowerup, volksparkLandmarkAt } from './logic.js';
import { trunkFor } from './moves.js';
import { syringeFor } from './syringes.js';

export function spawnWall(game) {
  const rng = game.rng, n = game.spawned;
  const s = SEASONS[seasonIndexAt(n, WALLS_PER_SEASON, SEASONS.length)];
  // Some walls are a tree trunk across the whole path instead: no gap, jump or slide (not on Volkspark landmark walls).
  const landmark = game.theme !== 'berlin-tour' && volksparkLandmarkAt(n, VOLKSPARK_LANDMARK_FROM, VOLKSPARK_LANDMARK_EVERY, TOUR_LANDMARKS, WALLS_PER_SEASON);
  const trunk = trunkFor(n, game.lastTrunkIndex, landmark, rng);
  const gaps = trunk ? [{ x: 0, w: CORRIDOR }] : makeGaps(n, game.lastGapX, s, rng);
  if (trunk) game.lastTrunkIndex = n;
  else game.lastGapX = gaps[0].x;
  const previous = game.walls.at(-1), wall = { z: SPAWN_Z, gaps, trunk, index: n, snowy: s.id === 'winter' };
  game.walls.push(wall);
  const spacing = spacingAt(n + 1); // distance to the next wall
  const type = n > 1 ? selectPowerup(rng) : null;
  if (type) game.pickups.push({ z: SPAWN_Z + spacing / 2, type, x: (rng() - 0.5) * (CORRIDOR - 2) });
  if (s.id === 'spring' && n > 2 && rng() < 0.6) {
    const z = SPAWN_Z + spacing * (0.3 + rng() * 0.4), x = (rng() - 0.5) * (CORRIDOR - 2);
    game.puddles.push({ z, x, r: 0.9 + rng() * 0.6, variant: n % 3 });
  }
  // A trunk lets the player be anywhere across the path, so no syringe next to one.
  const syringe = !trunk && !previous?.trunk && syringeFor({ index: n, season: s.id,
    previous, wall, puddles: game.puddles, pickups: game.pickups,
    surfaceAt: (z) => game.surfaceAt(game.travelled + z), lastIndex: game.lastSyringeIndex });
  if (syringe) { game.syringes.push(syringe); game.lastSyringeIndex = n; }
  game.spawned++;
  game.nextSpawnIn = spacing;
}
