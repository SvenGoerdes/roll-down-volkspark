import { test, expect } from 'bun:test';
import { createHash } from 'node:crypto';
import { BRANDENBURG_GATE_ART } from '../js/gate-sprite-data.js';

const hash = async (path) => createHash('sha256').update(new Uint8Array(await Bun.file(path).arrayBuffer())).digest('hex');

test('gate WebPs and anchors match their provenance within the optional-art budget', async () => {
  const manifest = await Bun.file('assets/landmarks/provenance.json').json();
  expect(await hash('tools/blender/render-brandenburg-sprites.py')).toBe(manifest.scriptSha256);
  expect(await hash('tools/build-gate-sprites.py')).toBe(manifest.packerSha256);
  let bytes = 0, decoded = 0;
  for (const [part, meta] of Object.entries(BRANDENBURG_GATE_ART)) {
    const source = manifest.parts[part], file = Bun.file(meta.src);
    expect(await hash(meta.src)).toBe(source.webpSha256);
    for (const key of ['width', 'height', 'worldWidth', 'worldHeight', 'bottom']) expect(meta[key]).toBe(source[key]);
    expect(meta.worldWidth).toBeGreaterThan(0);
    expect(meta.worldHeight).toBeCloseTo(meta.worldWidth * meta.height / meta.width);
    expect(meta.width).toBeLessThanOrEqual(2048);
    bytes += file.size; decoded += meta.width * meta.height * 4;
  }
  expect(bytes).toBeLessThan(100_000);
  expect(decoded).toBeLessThan(6 * 1024 * 1024);
});
