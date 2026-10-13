import { CORRIDOR } from './config.js';

export const SCENERY_STEP = 2.6;
export const SCENERY_FAR = 56;

// Stable pseudo random number in [0, 1) for an integer seed.
export const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Bushes and trees on both sides of the path. Pure function of the distance travelled,
// so every plant keeps its spot in the world without any state.
export function sceneryAt(travelled, near = 1, far = SCENERY_FAR) {
  const items = [];
  const last = (travelled + far) / SCENERY_STEP;
  for (let i = Math.floor((travelled + near) / SCENERY_STEP) - 1; i <= last; i++) {
    for (const side of [-1, 1]) {
      const id = i * 2 + (side > 0 ? 1 : 0);
      const r = (k) => hash(id * 7 + k);
      const z = (i + r(0) * 0.8) * SCENERY_STEP - travelled;
      if (z < near || z > far) continue;
      const tree = r(1) < 0.32;
      items.push({
        id, z, side, kind: tree ? 'tree' : 'bush', variant: Math.floor(r(2) * 3),
        x: side * (CORRIDOR / 2 + (tree ? 3.2 + r(3) * 4.5 : 0.9 + r(3) * 2.4)),
        size: 0.8 + r(4) * 0.45,
      });
    }
  }
  return items;
}
