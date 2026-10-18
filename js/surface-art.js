// Shared painted material sources; derived tiles/faces are cached by their owners.
export const surfaceArt = {};

export async function loadSurfaceArt(loadImage) {
  await Promise.all([['earth', 'ground-earth'], ['verge', 'ground-verge'], ['gabion', 'gabion-painted']].map(async ([id, file]) => {
    try { surfaceArt[id] = await loadImage(`assets/environment/${file}.webp`); }
    catch (err) { delete surfaceArt[id]; console.warn('Materialbild nicht verfügbar', id, err); }
  }));
}
