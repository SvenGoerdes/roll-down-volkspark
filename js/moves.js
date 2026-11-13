// Jump and slide, and the full-width tree trunks they are for (ADR 0082). Pure rules, no DOM.
import { MOVES, TRUNKS } from './config.js';

// Height of the ball above the ground during a jump: a parabola over the jump's duration.
export function jumpHeight(left, cfg = MOVES.jump) {
  if (!(left > 0)) return 0;
  const u = 1 - left / cfg.duration;
  return cfg.height * 4 * u * (1 - u);
}

// How flat the ball is while sliding, 0..1, with a short ease in and out.
export function slideAmount(left, cfg = MOVES.slide) {
  if (!(left > 0)) return 0;
  return Math.min(1, left / cfg.ease, (cfg.duration - left) / cfg.ease + 0.25);
}

// One move at a time: a swipe during a jump or slide is ignored. Returns whether the move started.
export function startMove(player, kind) {
  if (player.jump > 0 || player.slide > 0) return false;
  player[kind] = MOVES[kind].duration;
  return true;
}

export function stepMoves(player, dt) {
  player.jump = Math.max(0, (player.jump || 0) - dt);
  player.slide = Math.max(0, (player.slide || 0) - dt);
}

// A low trunk needs enough air under the ball, a high one needs the slide.
export const clearsTrunk = (kind, player) =>
  (kind === 'low' ? jumpHeight(player.jump) >= MOVES.jump.clear : player.slide > 0);

// Outcome at a trunk's plane, in the shape of resolveWall(): a superattack smashes through.
export function resolveTrunk(kind, player, superattack = 0) {
  if (clearsTrunk(kind, player)) return { passed: true, broken: false };
  return { passed: superattack > 0, broken: true };
}

// Whether wall `index` is a trunk instead of a wall with gaps: 'low', 'high' or null.
// Never on a landmark wall, never within `cooldown` walls of the last trunk.
export function trunkFor(index, lastIndex, landmark, rng, cfg = TRUNKS) {
  if (index < cfg.from || landmark || index - lastIndex < cfg.cooldown) return null;
  if (rng() >= cfg.chance) return null;
  return rng() < 0.5 ? 'low' : 'high';
}

// Vertical swipe detection on a moving finger. `track` = { x, y, t } is the anchor, changed in place.
// A swipe is a mostly vertical move of `px` pixels within `ms`; a slow drift re-anchors and never fires.
export function swipeMove(track, x, y, now, cfg = MOVES.swipe) {
  if (now - track.t > cfg.ms) { track.x = x; track.y = y; track.t = now; return null; }
  const dx = x - track.x, dy = y - track.y;
  if (Math.abs(dy) < cfg.px || Math.abs(dy) < Math.abs(dx) * cfg.slope) return null;
  track.x = x; track.y = y; track.t = now;
  return dy < 0 ? 'jump' : 'slide';
}
