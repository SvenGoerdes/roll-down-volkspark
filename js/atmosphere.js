import { SPAWN_Z, PLAYER_Z } from './config.js';

const clamp = (t) => Math.max(0, Math.min(1, t));
// Same depth curve on ground, baskets and foliage; no sudden opaque spawn.
export const depthMist = (z) => clamp((z - 12) / 70) ** 0.7;
export const arrivalAlpha = (z, far = SPAWN_Z) => clamp((far - z) / 18);
export const wallAlpha = (z) => Math.min(arrivalAlpha(z), clamp((z - 1) / (PLAYER_Z - 1.5)));
