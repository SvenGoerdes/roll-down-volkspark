import { EAST_SIDE_GALLERY_ART } from './gallery-sprite-data.js';

export async function loadGallerySprites(loadImage) {
  const entries = await Promise.all(Object.entries(EAST_SIDE_GALLERY_ART).map(async ([part, meta]) => [
    part, { ...meta, image: await loadImage(meta.src) },
  ]));
  return Object.fromEntries(entries);
}
