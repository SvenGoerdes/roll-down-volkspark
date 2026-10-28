import { CORRIDOR, PLAYER_Z, PLAYER_SCREEN_Y, HORIZON, HILL_DROP, HILL_RUN, CAMERA_FOLLOW } from './config.js';

export const terrainDrop = (z) => HILL_DROP * Math.log((HILL_RUN + Math.max(0, z)) / (HILL_RUN + PLAYER_Z));

export function computeView(W, H) {
  const horizonY = Math.round(H * HORIZON);
  // corridor fills ~96% of the width at the player's depth
  const F = (0.96 * W * PLAYER_Z) / CORRIDOR;
  const CH = ((H * PLAYER_SCREEN_Y - horizonY) * PLAYER_Z) / F;
  const view = { W, H, cx: W / 2, cameraX: 0, horizonY, F, CH };
  // Invert the hill once per resize; ground slices use only table lookups in play.
  view.groundRows = new Float64Array(H + 5);
  for (let y = horizonY + 1; y <= H + 4; y++) view.groundRows[y] = depthAtScreenY(view, y);
  return view;
}

export function project(view, x, z, y = 0) {
  const s = view.F / z;
  return { sx: view.cx + (x - (view.cameraX || 0)) * s, sy: view.horizonY + (view.CH + terrainDrop(z) - y) * s, s };
}

export function depthAtScreenY(view, sy) {
  if (sy <= view.horizonY) return Infinity;
  let lo = 0.001, hi = 90;
  while (project(view, 0, hi).sy > sy) hi *= 2;
  for (let i = 0; i < 32; i++) {
    const z = (lo + hi) / 2;
    if (project(view, 0, z).sy > sy) lo = z;
    else hi = z;
  }
  return (lo + hi) / 2;
}

// Horizontal translation only: no change to the hill, scale, steering or collision.
// The camera follows less than half the player's movement, keeping the road in view.
export { CAMERA_FOLLOW } from './config.js';

export function followCamera(view, playerX, dt) {
  const before = view.cameraX || 0;
  const target = Math.max(-CAMERA_FOLLOW.limit, Math.min(CAMERA_FOLLOW.limit, playerX * CAMERA_FOLLOW.gain));
  view.cameraX = before + (target - before) * -Math.expm1(-Math.max(0, dt) / CAMERA_FOLLOW.response);
  return view.cameraX - before;
}

// Existing transient effects are simulated in screen pixels. Rebase them before
// spawning new ones, so they stay with their world origin while the camera moves.
export function shiftCameraEffects(game, view, dx) {
  for (const list of [game.fx, game.spray]) {
    for (const item of list) item.x -= dx * view.F / PLAYER_Z;
  }
  // Weather occupies a distant sheet, like the painted seasonal skyline.
  for (const item of game.particles) item.x -= dx * 3;
}
