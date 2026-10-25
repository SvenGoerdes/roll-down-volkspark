import { SURFACES } from './config.js';
import { speedAt, createSurfaceTrack } from './logic.js';

const surfaceTrack = () => {
  const track = createSurfaceTrack(Math.random);
  return (dist) => SURFACES[track(dist)];
};

export function newGame(readBest, worldBest = null) {
  return {
    time: 0, travelled: 0, passed: 0, spawned: 0, nextSpawnIn: 0, lastGapX: 0,
    walls: [], pickups: [], puddles: [], particles: [], skids: [], spray: [], skidding: false, fx: [],
    seasonIdx: 0, prevSeasonIdx: null, seasonFade: 1,
    surfaceAt: surfaceTrack(), surface: SURFACES.dirt, nextKick: 0, bannerAt: 0,
    player: { x: 0, vx: 0, target: 0, spin: 0, helmets: 0, slippery: 0, slip: 0, bump: 0 },
    effects: { slowmo: 0, widen: 0 },
    wind: { force: 0, target: 0, next: 0, warn: 0, nextGust: 4, drift: 0 },
    shake: 0, flash: 0, slowFactor: 1, introT: 0, crashAt: 0, pace: speedAt(0), speed: speedAt(0),
    streak: 0, best: readBest(), recordShown: false, worldBest, worldShown: false,
  };
}
