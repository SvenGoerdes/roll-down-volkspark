import { describe, expect, test } from 'bun:test';
import { groundArt, loadGroundArt, loadSurfaceArt, surfaceArt } from '../js/surface-art.js';

describe('surface art sources', () => {
  test('Volkspark keeps the old earth and the gabion source', async () => {
    const paths = [];
    await loadSurfaceArt(async (path) => { paths.push(path); return { path }; });
    expect(paths).toEqual(['assets/environment/earth-painted.webp', 'assets/environment/gabion-painted.webp']);
  });

  test('Berlin-Tour ground loads its own earth and verge', async () => {
    const paths = [];
    await loadGroundArt(async (path) => { paths.push(path); return { path }; });
    expect(paths).toEqual(['assets/environment/ground-earth.webp', 'assets/environment/ground-verge.webp']);
    expect(groundArt.earth.path).toBe(paths[0]);
    expect(groundArt.verge.path).toBe(paths[1]);
  });

  test('a missing ground material leaves it undefined for procedural fallback', async () => {
    groundArt.earth = { stale: true };
    const warn = console.warn;
    console.warn = () => {};
    try {
      await loadGroundArt(async (path) => {
        if (path.includes('ground-earth')) throw new Error('missing');
        return { path };
      });
      expect(groundArt.earth).toBeUndefined();
      expect(groundArt.verge.path).toContain('ground-verge');
     
    } finally { console.warn = warn; }
  });
});
