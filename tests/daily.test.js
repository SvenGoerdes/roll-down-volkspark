import { test, expect } from 'bun:test';
import { berlinDay, daySeed, dailyRngs, hoursLeft, dailyBest, withDailyBest } from '../js/daily.js';
import { newGame } from '../js/game-state.js';
import { spawnWall } from '../js/spawn.js';

// A whole run's track for a day: walls, trunks, pickups, puddles, syringes and surfaces.
function track(day, walls = 200, theme = 'volkspark') {
  const game = { ...newGame(() => 0, null, day && dailyRngs(day)), theme };
  const out = [];
  for (let i = 0; i < walls; i++) {
    spawnWall(game);
    const w = game.walls.at(-1);
    out.push([w.trunk, ...w.gaps.flatMap((g) => [g.x, g.w]), game.pickups.length, game.puddles.length, game.syringes.length, game.surfaceAt(i * 20).id]);
    // scroll like the game does, by the spacing to the next wall
    for (const list of [game.walls, game.pickups, game.puddles, game.syringes]) for (const o of list) o.z -= game.nextSpawnIn;
    game.travelled += game.nextSpawnIn;
  }
  return JSON.stringify(out);
}

test('the day follows the Berlin calendar, also across midnight and the clock change', () => {
  expect(berlinDay(new Date('2026-11-14T22:59:59Z'))).toBe('2026-11-14');
  expect(berlinDay(new Date('2026-11-14T23:00:00Z'))).toBe('2026-11-15'); // CET = UTC+1
  expect(berlinDay(new Date('2026-07-01T21:59:59Z'))).toBe('2026-07-01');
  expect(berlinDay(new Date('2026-07-01T22:00:00Z'))).toBe('2026-07-02'); // CEST = UTC+2
});

test('same day = same track, another day = another track', () => {
  const a = track('2026-11-14');
  expect(track('2026-11-14')).toBe(a);
  expect(track('2026-11-15')).not.toBe(a);
  expect(a).toContain('low');
  expect(a).toContain('high');
  expect(daySeed('2026-11-14')).not.toBe(daySeed('2026-11-15'));
});

test('the walls do not depend on when the surface track is asked', () => {
  const plain = { ...newGame(() => 0, null, dailyRngs('2026-11-14')), theme: 'volkspark' };
  const eager = { ...newGame(() => 0, null, dailyRngs('2026-11-14')), theme: 'volkspark' };
  eager.surfaceAt(50000);
  for (let i = 0; i < 30; i++) { spawnWall(plain); spawnWall(eager); }
  expect(eager.walls.map((w) => [w.trunk, w.gaps])).toEqual(plain.walls.map((w) => [w.trunk, w.gaps]));
});

test('a normal run stays random', () => {
  expect(track(null, 40)).not.toBe(track(null, 40));
});

test('hours left of the Berlin day, never 0', () => {
  expect(hoursLeft(new Date('2026-11-14T11:00:00Z'))).toBe(12); // 12:00 in Berlin
  expect(hoursLeft(new Date('2026-11-14T22:59:00Z'))).toBe(1);
  expect(hoursLeft(new Date('2026-11-14T23:00:00Z'))).toBe(24);
});

test('the daily best belongs to its day only and never drops', () => {
  expect(dailyBest(null, '2026-11-14')).toBe(0);
  const s = withDailyBest(null, '2026-11-14', 31);
  expect(withDailyBest(s, '2026-11-14', 12)).toEqual({ day: '2026-11-14', best: 31 });
  expect(dailyBest(s, '2026-11-15')).toBe(0);
  expect(withDailyBest(s, '2026-11-15', 4)).toEqual({ day: '2026-11-15', best: 4 });
  expect(dailyBest({ day: '2026-11-14', best: 'x' }, '2026-11-14')).toBe(0);
});
