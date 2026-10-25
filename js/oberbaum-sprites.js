import { OBERBAUM_ART } from './oberbaum-sprite-data.js';

export async function loadOberbaumSprites(loadImage) {
  const entries = await Promise.all(Object.entries(OBERBAUM_ART).map(async ([part, meta]) => [
    part, { ...meta, image: await loadImage(meta.src) },
  ]));
  return Object.fromEntries(entries);
}
