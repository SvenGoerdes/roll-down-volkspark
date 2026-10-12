import { test, expect } from 'bun:test';
import { parseScore, addScore, limited } from '../worker/src/score.js';

test('accepts a normal score and cleans the name', () => {
  const { entry } = parseScore({ name: '  Kim\u0000 \n Müller ', score: 12, season: 'Herbst' });
  expect(entry).toEqual({ name: 'Kim Müller', score: 12, season: 'Herbst' });
});

test('rejects bad names', () => {
  expect(parseScore({ name: '   ', score: 1 }).error).toBeTruthy();
  expect(parseScore({ name: '\u0007​', score: 1 }).error).toBeTruthy();
  expect(parseScore({ name: 'x'.repeat(21), score: 1 }).error).toBeTruthy();
  expect(parseScore({ name: 'x'.repeat(20), score: 1 }).entry).toBeTruthy();
  expect(parseScore({ name: 5, score: 1 }).error).toBeTruthy();
});

test('rejects bad scores', () => {
  for (const score of [-1, 1.5, 10001, '5', NaN, Infinity, null, undefined]) {
    expect(parseScore({ name: 'Kim', score }).error).toBeTruthy();
  }
  expect(parseScore({ name: 'Kim', score: 0 }).entry.score).toBe(0);
  expect(parseScore({ name: 'Kim', score: 10000 }).entry.score).toBe(10000);
  expect(parseScore(null).error).toBeTruthy();
});

test('keeps html as plain text (client renders with textContent)', () => {
  expect(parseScore({ name: '<b>x</b>', score: 1 }).entry.name).toBe('<b>x</b>');
});

test('sorts by score, earlier first on ties, and cuts the list', () => {
  let list = [];
  list = addScore(list, { name: 'A', score: 5, season: '' }, 1).list;
  list = addScore(list, { name: 'B', score: 9, season: '' }, 2).list;
  list = addScore(list, { name: 'C', score: 5, season: '' }, 3).list;
  expect(list.map((e) => e.name)).toEqual(['B', 'A', 'C']);
  const full = Array.from({ length: 20 }, (_, i) => ({ name: `P${i}`, score: 100 + i, season: '', at: i }));
  const low = addScore(full, { name: 'Neu', score: 1, season: '' }, 99);
  expect(low.improved).toBe(false);
  expect(low.list).toHaveLength(20);
  const high = addScore(full, { name: 'Neu', score: 500, season: '' }, 99);
  expect(high.improved).toBe(true);
  expect(high.list).toHaveLength(20);
  expect(high.list[0].name).toBe('Neu');
});

test('one entry per name, case-insensitive, only a higher score replaces', () => {
  const a = addScore([], { name: 'Kim', score: 10, season: '' }, 1).list;
  const same = addScore(a, { name: 'kim', score: 10, season: '' }, 2);
  expect(same.improved).toBe(false);
  expect(same.list).toBe(a);
  const better = addScore(a, { name: 'KIM', score: 11, season: '' }, 3);
  expect(better.improved).toBe(true);
  expect(better.list.map((e) => [e.name, e.score])).toEqual([['KIM', 11]]);
  expect(a[0].score).toBe(10);
});

test('limiter blocks after max hits and frees up after the window', () => {
  const hits = new Map();
  expect(limited(hits, 'ip', 2, 0)).toBe(false);
  expect(limited(hits, 'ip', 2, 1)).toBe(false);
  expect(limited(hits, 'ip', 2, 2)).toBe(true);
  expect(limited(hits, 'other', 2, 2)).toBe(false);
  expect(limited(hits, 'ip', 2, 3600_005)).toBe(false);
});
