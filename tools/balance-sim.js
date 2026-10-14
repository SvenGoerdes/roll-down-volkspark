// Balance check: a human-like bot plays many runs against the real difficulty curve (js/logic.js).
// bun tools/balance-sim.js [runs] [--no-streak]   → survival stats, crash share per season, crash rate per wall.
// --no-streak: the 6-perfect streak gives no helmet, to see what the streak adds.
// The bot was tuned so that on the old curve (ADR 0024) it got stuck around wall 50 like our testers.
// Spring, ice and wind come from js/config.js and js/logic.js; the rest of the steering copies js/main.js, keep both in step.
import {
  CORRIDOR, PLAYER_R, PLAYER_Z, SPAWN_Z, SEASONS, WALLS_PER_SEASON, POWERUP_CHANCE, MAX_HELMETS, POWERUPS, SURFACES, SPRING, ICE,
} from '../js/config.js';
import {
  speedAt, spacingAt, makeGaps, widened, passesWall, seasonIndexAt, windAt, addHelmet, stepWind, createSurfaceTrack,
} from '../js/logic.js';
import { judgePass, nextStreak } from '../js/scoring.js';

// Drag precision by Fitts' law (a, b), feedback delay, pull against drift, rare sloppy swipes, more noise at speed.
const NO_STREAK = process.argv.includes('--no-streak');
const BOT = { a: 0.05, b: 0.13, sigma0: 0.1, delay: 0.22, gain: 3.5, lapse: 0.01, speedNoise: 0.12 };
const DT = 1 / 60, MAX_WALLS = 400;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const seasonAt = (n) => SEASONS[seasonIndexAt(n, WALLS_PER_SEASON, SEASONS.length)];

function mulberry(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rng) => Math.sqrt(-2 * Math.log(rng() + 1e-12)) * Math.cos(2 * Math.PI * rng());

// How far off a swipe of d units lands when it has T seconds.
function aimSigma(d, T, speed) {
  const t = Math.max(0.02, T - BOT.a);
  const fitts = d < 0.05 ? 0 : d / (2 ** (t / BOT.b) - 1) / 4.133;
  return Math.hypot(BOT.sigma0, fitts) + BOT.speedNoise * speed / 16;
}

function run(rng) {
  const g = { time: 0, dist: 0, passed: 0, streak: 0, perfects: 0, spawned: 0, nextSpawnIn: 0, nextKick: 0, lastGapX: 0, pace: speedAt(0) };
  const track = createSurfaceTrack(rng);
  const walls = [], pickups = [], puddles = [];
  const p = { x: 0, vx: 0, target: 0, slippery: 0, helmets: 0 };
  const eff = { slowmo: 0, widen: 0 };
  const wind = { force: 0, target: 0, next: 0, warn: 0, nextGust: 4, drift: 0 };
  const seen = [];
  let slow = 1, goal = null, aim = 0, from = 0, moveT = 0, moveDur = 0.2, pull = 0;

  function spawn() {
    const n = g.spawned, s = seasonAt(n);
    const gaps = makeGaps(n, g.lastGapX, s, rng);
    g.lastGapX = gaps[0].x;
    walls.push({ z: SPAWN_Z, gaps });
    const spacing = spacingAt(n + 1); // distance to the next wall
    if (rng() < POWERUP_CHANCE && n > 1) {
      const types = Object.keys(POWERUPS);
      pickups.push({ z: SPAWN_Z + spacing / 2, type: types[(rng() * types.length) | 0], x: (rng() - 0.5) * (CORRIDOR - 2) });
    }
    if (s.id === 'spring' && n > 2 && rng() < 0.6) {
      puddles.push({ z: SPAWN_Z + spacing * (0.3 + rng() * 0.4), x: (rng() - 0.5) * (CORRIDOR - 2), r: 0.9 + rng() * 0.6 });
    }
    g.spawned++;
    g.nextSpawnIn = spacing;
  }

  while (g.passed < MAX_WALLS) {
    g.time += DT;
    eff.slowmo = Math.max(0, eff.slowmo - DT);
    eff.widen = Math.max(0, eff.widen - DT);
    slow += ((eff.slowmo > 0 ? 0.55 : 1) - slow) * Math.min(1, DT * 4);
    const s = seasonAt(g.passed);
    g.pace += (speedAt(g.passed) - g.pace) * Math.min(1, DT * 1.5);
    const under = SURFACES[track(g.dist + PLAYER_Z)];
    const speed = g.pace * s.speedMul * under.speedMul * slow, dz = speed * DT;
    g.dist += dz;
    if ((g.nextSpawnIn -= dz) <= 0) spawn();

    stepWind(wind, DT, s.id === 'autumn', windAt(g.passed), rng);

    // bot: swipe to the next gap, then hold it against drift with a delayed pull
    const next = walls.find((w) => w.z > PLAYER_Z);
    if (next && next !== goal) {
      const gap = next.gaps.reduce((a, b) => (Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a));
      const T = (next.z - PLAYER_Z) / speed;
      const sigma = aimSigma(Math.abs(gap.x - (goal ? aim : p.x)), Math.min(T, 1.5) - 0.1, speed);
      goal = next;
      aim = gap.x + gauss(rng) * sigma * (rng() < BOT.lapse ? 5 : 1);
      from = p.target; moveT = 0; moveDur = clamp(T - 0.15, 0.08, 0.5);
    }
    moveT += DT;
    const u = clamp(moveT / moveDur, 0, 1);
    seen.push(p.x);
    if (seen.length > 60) seen.shift();
    const lag = Math.round(BOT.delay / DT), was = seen.length > lag ? seen[seen.length - 1 - lag] : p.x;
    if (moveT >= moveDur + BOT.delay) pull = clamp(pull + (aim - was) * BOT.gain * DT, -3, 3);
    else if (u < 1) pull *= 1 - DT * 2;
    const limit = CORRIDOR / 2 - PLAYER_R;
    p.target = clamp(from + (aim - from) * u * u * (3 - 2 * u) + pull, -limit, limit);

    const icy = s.id === 'winter' || p.slippery > 0;
    const { k, c } = icy ? ICE : SPRING;
    const { kick } = under;
    if (kick && (g.nextKick -= DT) <= 0) {
      const [e0, e1] = kick.every, [i0, i1] = kick.impulse;
      g.nextKick = e0 + rng() * (e1 - e0);
      p.vx += (rng() < 0.5 ? -1 : 1) * (i0 + rng() * (i1 - i0)) * (icy ? ICE.kick : 1);
    }
    p.vx += (k * (p.target - p.x) - c * p.vx + wind.force) * DT;
    p.x += p.vx * DT;
    if (Math.abs(p.x) > limit) { p.x = Math.sign(p.x) * limit; p.vx *= -0.3; }
    p.slippery = Math.max(0, p.slippery - DT);

    const widen = eff.widen > 0 ? 1.6 : 1;
    for (const w of walls) {
      const before = w.z;
      w.z -= dz;
      if (before <= PLAYER_Z || w.z > PLAYER_Z) continue;
      const gaps = w.gaps.map((gp) => widened(gp, widen));
      if (passesWall(p.x, PLAYER_R * 0.75, gaps)) {
        g.passed++;
        const kind = judgePass(p.x, PLAYER_R * 0.75, gaps);
        if (kind === 'perfect') g.perfects++;
        const st = nextStreak(g.streak, kind);
        g.streak = st.streak;
        if (st.reward && !NO_STREAK) p.helmets = addHelmet(p.helmets, MAX_HELMETS);
      } else if (p.helmets > 0) { p.helmets--; g.streak = 0; w.broken = true; }
      else return { score: g.passed, season: seasonIndexAt(g.passed, WALLS_PER_SEASON, SEASONS.length), time: g.time, perfects: g.perfects };
    }
    for (const it of pickups) {
      const before = it.z;
      it.z -= dz;
      if (it.taken || before <= PLAYER_Z || it.z > PLAYER_Z || Math.abs(it.x - p.x) >= 1) continue;
      it.taken = true;
      if (it.type === 'helmet') p.helmets = addHelmet(p.helmets, MAX_HELMETS);
      else eff[it.type] = POWERUPS[it.type].duration;
    }
    for (const pd of puddles) {
      const before = pd.z;
      pd.z -= dz;
      if (before > PLAYER_Z && pd.z <= PLAYER_Z && Math.abs(pd.x - p.x) < pd.r) p.slippery = 1.4;
    }
    for (const list of [walls, pickups, puddles]) {
      for (let i = list.length - 1; i >= 0; i--) if (list[i].z < 0.6 || list[i].broken || list[i].taken) list.splice(i, 1);
    }
  }
  return { score: g.passed, season: -1, time: g.time, perfects: g.perfects };
}

const runs = Number(process.argv.find((a) => /^\d+$/.test(a))) || 600;
const rng = mulberry(1);
const res = Array.from({ length: runs }, () => run(rng));
const sc = res.map((r) => r.score).sort((a, b) => a - b);
const q = (f) => sc[Math.min(runs - 1, Math.floor(f * runs))];
const share = SEASONS.map((s, i) => `${s.name} ${Math.round((res.filter((r) => r.season === i).length / runs) * 100)} %`);
const rates = [];
for (let b = 0; b < MAX_WALLS; b += 10) {
  const reached = sc.filter((v) => v >= b).length;
  if (reached < 20) break;
  rates.push(`${b}: ${((sc.filter((v) => v >= b && v < b + 10).length / reached / 10) * 100).toFixed(1)}`);
}
console.log(`${runs} Runden · Median ${q(0.5)} · 25 % ${q(0.25)} · 75 % ${q(0.75)} · 90 % ${q(0.9)} · 98 % ${q(0.98)} Mauern`);
console.log(`Runde dauert im Schnitt ${Math.round(res.reduce((a, r) => a + r.time, 0) / runs)} s`);
console.log(`Crashes nach Jahreszeit: ${share.join(' · ')}`);
console.log(`Crash-Chance pro Mauer in % (ab Mauer): ${rates.join(' · ')}`);
console.log(`Perfekt: ${Math.round((res.reduce((a, r) => a + r.perfects, 0) / res.reduce((a, r) => a + r.score, 0)) * 100)} % der Mauern`);
