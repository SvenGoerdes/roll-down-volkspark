// Shared painted material sources; derived tiles/faces are cached by their owners.
export const surfaceArt = {};

export async function loadSurfaceArt(loadImage) {
  await Promise.all(['earth', 'gabion'].map(async (id) => {
    try { surfaceArt[id] = await loadImage(`assets/environment/${id}-painted.webp`); }
    catch (err) { console.warn('Materialbild nicht verfügbar', id, err); }
  }));
}

// Berlin-Tour ground (#75): loaded only when that theme is chosen. Volkspark keeps `surfaceArt.earth`.
export const groundArt = {};

export async function loadGroundArt(loadImage) {
  await Promise.all(['earth', 'verge'].map(async (id) => {
    try { groundArt[id] = await loadImage(`assets/environment/ground-${id}.webp`); }
    catch (err) { delete groundArt[id]; console.warn('Bodenbild nicht verfügbar', id, err); }
  }));
}
