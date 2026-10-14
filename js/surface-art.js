// Shared painted material sources; derived tiles/faces are cached by their owners.
export const surfaceArt = {};

export async function loadSurfaceArt(loadImage) {
  await Promise.all(['earth', 'gabion'].map(async (id) => {
    try { surfaceArt[id] = await loadImage(`assets/environment/${id}-painted.webp`); }
    catch (err) { console.warn('Materialbild nicht verfügbar', id, err); }
  }));
}
