import { BRANDENBURG_GATE_ART } from './gate-sprite-data.js';

export async function loadGateSprites(loadImage) {
  const entries = await Promise.all(Object.entries(BRANDENBURG_GATE_ART).map(async ([part, meta]) => [
    part, { ...meta, image: await loadImage(meta.src) },
  ]));
  return Object.fromEntries(entries);
}
