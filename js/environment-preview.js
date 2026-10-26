import { SEASONS, WALLS_PER_SEASON, SURFACES } from './config.js';

// Deterministic, frozen art check. Active only at ?preview=<season>#debug.
export function environmentPreview() {
  if (location.hash !== '#debug') return null;
  const params = new URLSearchParams(location.search);
  const idx = SEASONS.findIndex((s) => s.id === params.get('preview'));
  if (idx < 0) return null;
  const width = Number(params.get('width'));
  const height = Number(params.get('height'));
  const near = Number(params.get('near'));
  return { idx, syringe: params.get('syringe'), surface: SURFACES[params.get('surface')] || SURFACES.dirt,
    width: Number.isInteger(width) && width >= 320 && width <= 480 ? width : null,
    height: Number.isInteger(height) && height >= 568 && height <= 1000 ? height : null,
    near: Number.isFinite(near) && near >= 4.1 && near <= 14 ? near : 7.5 };
}

export function preparePreview(game, preview) {
  game.seasonIdx = preview.idx;
  game.time = 2; game.travelled = 103;
  game.surfaceAt = () => preview.surface; game.surface = preview.surface;
  game.walls = [0, 11.5, 28.5, 54.5].map((offset, i) => ({
    z: preview.near + offset, gaps: [{ x: [1.4, -1.5, 0.6, -0.7][i], w: 2.9 }],
    index: preview.idx * WALLS_PER_SEASON + i,
  }));
  game.pickups = [{ x: -1, z: 13, type: 'helmet' }];
  if (['near', 'approach', 'impact'].includes(preview.syringe)) {
    // Local art-review fixture, never a production spawn override.
    const z = preview.syringe === 'approach' ? 14 : 5.8;
    game.walls = [12, 30, 48].map((offset, index) => ({ z: z + offset,
      gaps: [{ x: -0.7, w: 2.9 }], index: preview.idx * WALLS_PER_SEASON + index }));
    game.pickups = [];
    game.syringes = [{ x: 3.43, z }];
    if (preview.syringe === 'impact') { game.syringes = []; game.syringeImpact = 0.8; }
  }
}
