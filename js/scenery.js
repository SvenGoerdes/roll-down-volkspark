import { CORRIDOR } from './config.js';

export const SCENERY_STEP = 2.6;
export const SCENERY_FAR = 56;

// Stable pseudo random number in [0, 1) for an integer seed.
export const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function plant(i, side) {
  const id = i * 2 + (side > 0 ? 1 : 0);
  const r = (k) => hash(id * 7 + k);
  const tree = r(1) < 0.32;
  return {
    id, i, side, z: 0, wz: (i + r(0) * 0.8) * SCENERY_STEP,
    kind: tree ? 'tree' : 'bush', variant: Math.floor(r(2) * 3),
    x: side * (CORRIDOR / 2 + (tree ? 3.2 + r(3) * 4.5 : 0.9 + r(3) * 2.4)),
    size: 0.8 + r(4) * 0.45,
  };
}

// Plants are made only when they come into range and live on while they stay in it.
const plants = new Map();
const visible = [];
let lo = NaN, hi = NaN;

// Bushes and trees on both sides of the path, a pure function of the distance travelled:
// every plant keeps its spot in the world. Returns a reused array, valid until the next call.
export function sceneryAt(travelled, near = 1, far = SCENERY_FAR) {
  const i0 = Math.floor((travelled + near) / SCENERY_STEP) - 1, i1 = Math.floor((travelled + far) / SCENERY_STEP);
  if (i0 !== lo || i1 !== hi) {
    for (const [id, p] of plants) if (p.i < i0 || p.i > i1) plants.delete(id);
    for (let i = i0; i <= i1; i++) {
      for (const side of [-1, 1]) {
        const id = i * 2 + (side > 0 ? 1 : 0);
        if (!plants.has(id)) plants.set(id, plant(i, side));
      }
    }
    lo = i0;
    hi = i1;
  }
  visible.length = 0;
  for (const p of plants.values()) {
    p.z = p.wz - travelled;
    if (p.z >= near && p.z <= far) visible.push(p);
  }
  return visible;
}
