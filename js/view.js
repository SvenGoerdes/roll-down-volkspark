import { CORRIDOR, PLAYER_Z, PLAYER_SCREEN_Y, HORIZON } from './config.js';

export function computeView(W, H) {
  const horizonY = Math.round(H * HORIZON);
  // corridor fills ~96% of the width at the player's depth
  const F = (0.96 * W * PLAYER_Z) / CORRIDOR;
  const CH = ((H * PLAYER_SCREEN_Y - horizonY) * PLAYER_Z) / F;
  return { W, H, cx: W / 2, horizonY, F, CH };
}

export function project(view, x, z, y = 0) {
  const s = view.F / z;
  return { sx: view.cx + x * s, sy: view.horizonY + (view.CH - y) * s, s };
}
