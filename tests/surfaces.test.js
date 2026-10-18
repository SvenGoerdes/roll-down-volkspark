import { describe, expect, test } from 'bun:test';
import { loadSurfaceArt, surfaceArt } from '../js/surface-art.js';

describe('surface art sources', () => {
  test('loads derived earth and verge, retaining the original gabion source', async () => {
    const paths = [];
    await loadSurfaceArt(async (path) => { paths.push(path); return { path }; });
    expect(paths).toEqual([
      'assets/environment/ground-earth.webp',
      'assets/environment/ground-verge.webp',
      'assets/environment/gabion-painted.webp',
    ]);
    expect(surfaceArt.earth.path).toBe(paths[0]);
    expect(surfaceArt.verge.path).toBe(paths[1]);
    expect(surfaceArt.gabion.path).toBe(paths[2]);
  });

  test('a missing material leaves it undefined for procedural fallback', async () => {
    surfaceArt.earth = undefined;
    const warn = console.warn;
    console.warn = () => {};
    try {
      await loadSurfaceArt(async (path) => {
        if (path.includes('ground-earth')) throw new Error('missing');
        return { path };
      });
      expect(surfaceArt.earth).toBeUndefined();
      expect(surfaceArt.verge.path).toContain('ground-verge');
    } finally { console.warn = warn; }
  });
});
