import { REICHSTAG_ART } from './reichstag-sprite-data.js';

export async function loadReichstagSprites(loadImage) {
  const entries = await Promise.all(Object.entries(REICHSTAG_ART).map(async ([part, meta]) => [
    part, { ...meta, image: await loadImage(meta.src) },
  ]));
  return Object.fromEntries(entries);
}
