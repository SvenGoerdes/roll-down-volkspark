import { test, expect } from 'bun:test';
import { computeView, project, terrainDrop, depthAtScreenY } from '../js/view.js';
import { PLAYER_Z, PLAYER_SCREEN_Y, WALL_H } from '../js/config.js';

test('hill falls away while player anchor and horizontal steering scale stay fixed', () => {
  for (const [w, h] of [[390, 844], [375, 667], [320, 568], [557, 844]]) {
    const v = computeView(w, h);
    expect(terrainDrop(PLAYER_Z)).toBe(0);
    expect(project(v, 0, PLAYER_Z).sy).toBeCloseTo(h * PLAYER_SCREEN_Y, 5);
    expect(project(v, 4, PLAYER_Z).sx - v.cx).toBeCloseTo(w * 0.48, 5);
    expect(terrainDrop(40)).toBeGreaterThan(terrainDrop(10));
    let prev = Infinity;
    for (const z of [1, 2, 4, 8, 20, 50, 90, 500]) {
      const p = project(v, 0, z);
      expect(p.sy).toBeLessThan(prev);
      expect(depthAtScreenY(v, p.sy)).toBeCloseTo(z, 4);
      prev = p.sy;
    }
  }
});

test('cached ground rows invert the same projection used by wall feet and plants', () => {
  const v = computeView(390, 844);
  for (let y = v.horizonY + 1; y <= v.H + 3; y += 7) {
    expect(project(v, 0, v.groundRows[y]).sy).toBeCloseTo(y, 4);
    expect(v.groundRows[y + 1]).toBeLessThan(v.groundRows[y]);
  }
  expect(depthAtScreenY(v, v.horizonY)).toBe(Infinity);
  expect(project(v, 0, 12, WALL_H).sy).toBeLessThan(project(v, 0, 12).sy);
});

test('the next wall stays fully visible above a nearer wall at late-game spacing', () => {
  for (const [w, h] of [[390, 844], [375, 667], [320, 568]]) {
    const v = computeView(w, h);
    const nearTop = project(v, 0, 22, WALL_H).sy;
    const nextFoot = project(v, 0, 32).sy;
    expect(nearTop - nextFoot).toBeGreaterThan(3);
  }
});
