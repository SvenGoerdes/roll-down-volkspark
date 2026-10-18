import { describe, expect, test } from 'bun:test';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSurfaceArt, surfaceArt } from '../js/surface-art.js';

const assets = ['ground-earth.webp', 'ground-verge.webp'];

describe('prepared ground materials', () => {
  test('are 384x512 WebP assets within the combined budget', () => {
    let total = 0;
    for (const name of assets) {
      const path = resolve(import.meta.dir, '../assets/environment', name);
      const bytes = readFileSync(path);
      total += statSync(path).size;
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
      expect(['VP8L', 'VP8 ']).toContain(bytes.toString('ascii', 12, 16));
      const dimensions = ImageDimensions(bytes);
      expect(dimensions).toEqual([384, 512]);
    }
    expect(total).toBeLessThan(100_000);
  });

  test('failed reload clears stale image references without disturbing gabion', async () => {
    surfaceArt.earth = { stale: true };
    surfaceArt.verge = { stale: true };
    surfaceArt.gabion = { retained: true };
    const warn = console.warn;
    console.warn = () => {};
    try {
      await loadSurfaceArt(async (path) => {
        if (path.includes('ground-')) throw new Error('missing');
        return { path };
      });
      expect(surfaceArt.earth).toBeUndefined();
      expect(surfaceArt.verge).toBeUndefined();
      expect(surfaceArt.gabion.path).toBe('assets/environment/gabion-painted.webp');
    } finally { console.warn = warn; }
  });
});

function ImageDimensions(bytes) {
  if (bytes.toString('ascii', 12, 16) === 'VP8L') {
    const bits = bytes.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
  }
  const start = bytes.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
  if (start < 0) return [];
  return [bytes.readUInt16LE(start + 3) & 0x3fff, bytes.readUInt16LE(start + 5) & 0x3fff];
}
