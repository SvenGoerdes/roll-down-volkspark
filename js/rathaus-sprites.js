import { RATHAUS_ART } from './rathaus-sprite-data.js';

export async function loadRathausSprites(loadImage) {
  const entries = await Promise.all(Object.entries(RATHAUS_ART).map(async ([part, meta]) => [
    part, { ...meta, image: await loadImage(meta.src) },
  ]));
  return Object.fromEntries(entries);
}
