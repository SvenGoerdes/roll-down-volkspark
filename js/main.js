import {
  CORRIDOR, PLAYER_R, PLAYER_Z, SPAWN_Z, SEASONS, POWERUPS, POWERUP_CHANCE, MAX_HELMETS, WALLS_PER_SEASON, SURFACES, SPRING, ICE,
} from './config.js';
import {
  speedAt, spacingAt, makeGaps, widened, passesWall, seasonIndexAt, seasonAhead, slipAmount, skidStrength, createSurfaceTrack, addHelmet, windAt, stepWind, windArrow,
} from './logic.js';
import { loadSeasonBackgrounds } from './seasons.js';
import { environmentPreview, preparePreview } from './environment-preview.js';
import { buildGroundTiles } from './surfaces.js';
import { setupIdeas } from './ideas.js';
import { setupLeaderboard } from './leaderboard.js';
import {
  computeView, project, drawBackground, drawGround, drawHorizon, drawWall, drawPuddle, drawPickup,
} from './render.js';
import { drawPlayer } from './render-player.js';
import { loadFigure, introAt, poseFor } from './figure.js';
import { readFigure, saveFigure, setupFigureSelect } from './figure-select.js';
import {
  drawScenery, drawParticles, drawSpeedLines, drawGrade, primeGrade, drawFx, warmUp,
} from './render-fx.js';
import { drawIceSheen, drawSkidMarks, drawSpray } from './render-slip.js';
import { sceneryAt } from './scenery.js';
import { burstStones, burstSparkles, stepFx } from './fx.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);
const hud = {
  score: $('score'), speed: $('speed'), season: $('season'), powers: $('powers'),
  wind: $('wind'), banner: $('banner'), start: $('start'), over: $('over'),
  final: $('final'), best: $('best'), bestStart: $('best-start'),
  figures: $('figures'), changeFigure: $('change-figure'),
};

const loadImage = (src) => new Promise((ok, fail) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => fail(new Error(`Bild fehlt: ${src}`));
  img.src = src;
});

const BEST_KEY = 'rollDownBest';
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
const writeBest = (v) => { try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* private mode */ } };

let view, dpr = 1, backgrounds, board, groundTiles, powerIcons;
let state = 'loading';
const setState = (s) => { state = s; document.body.dataset.state = s; };
let game;
const preview = environmentPreview();
let last = 0;
const input = { dragging: false, lastX: 0, keys: new Set() };
let figureId = readFigure(), figure = null, picker, loadingFigure = false;
const figureSheets = new Map();
const TAP_TEXT = 'Losrollen';

const surfaceTrack = () => {
  const track = createSurfaceTrack(Math.random);
  return (dist) => SURFACES[track(dist)];
};

// One load per figure. A failed load leaves no entry behind, so the next tap retries it.
function sheetsFor(id) {
  if (!figureSheets.has(id)) {
    figureSheets.set(id, loadFigure(id, loadImage).catch((err) => {
      figureSheets.delete(id);
      throw err;
    }));
  }
  return figureSheets.get(id);
}

function newGame() {
  return {
    time: 0, travelled: 0, passed: 0, spawned: 0, nextSpawnIn: 0, lastGapX: 0,
    walls: [], pickups: [], puddles: [], particles: [], skids: [], spray: [], skidding: false, fx: [],
    seasonIdx: 0, prevSeasonIdx: null, seasonFade: 1,
    surfaceAt: surfaceTrack(), surface: SURFACES.dirt, nextKick: 0, bannerAt: 0,
    player: { x: 0, vx: 0, target: 0, spin: 0, helmets: 0, slippery: 0, slip: 0, bump: 0 },
    effects: { slowmo: 0, widen: 0 },
    wind: { force: 0, target: 0, next: 0, warn: 0, nextGust: 4, drift: 0 },
    shake: 0, flash: 0, slowFactor: 1, introT: 0, crashAt: 0, pace: speedAt(0), speed: speedAt(0),
  };
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const H = preview?.height ?? window.innerHeight;
  const W = Math.min(preview?.width ?? window.innerWidth, Math.round(H * 0.66));
  if (preview?.width) {
    // A fixed game frame for accurate mobile checks even when the browser pane
    // enforces a wider minimum layout viewport than its screenshot size.
    $('stage').style.width = `${W}px`;
    $('stage').style.marginLeft = '0';
  }
  if (preview?.height) $('stage').style.height = `${H}px`;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  view = computeView(W, H);
  if (game) primeGrades();
}

// Paint this season's and the next season's light ahead of the frames that need them.
function primeGrades() {
  primeGrade(view, dpr, season().id);
  primeGrade(view, dpr, SEASONS[(game.seasonIdx + 1) % SEASONS.length].id);
}
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 100));

const season = () => SEASONS[game.seasonIdx];

function spawnWall() {
  const s = SEASONS[seasonIndexAt(game.spawned, WALLS_PER_SEASON, SEASONS.length)];
  const gaps = makeGaps(game.spawned, game.lastGapX, s, Math.random);
  game.lastGapX = gaps[0].x;
  game.walls.push({ z: SPAWN_Z, gaps, index: game.spawned, snowy: s.id === 'winter' });
  const spacing = spacingAt(game.spawned + 1); // distance to the next wall
  if (Math.random() < POWERUP_CHANCE && game.spawned > 1) {
    const types = Object.keys(POWERUPS);
    game.pickups.push({
      z: SPAWN_Z + spacing / 2, type: types[(Math.random() * types.length) | 0],
      x: (Math.random() - 0.5) * (CORRIDOR - 2),
    });
  }
  if (s.id === 'spring' && game.spawned > 2 && Math.random() < 0.6) {
    game.puddles.push({ z: SPAWN_Z + spacing * (0.3 + Math.random() * 0.4), x: (Math.random() - 0.5) * (CORRIDOR - 2), r: 0.9 + Math.random() * 0.6 });
  }
  game.spawned++;
  game.nextSpawnIn = spacing;
}

function showBanner(text, sub, img) {
  game.bannerAt = performance.now();
  const strong = document.createElement('strong');
  const span = document.createElement('span');
  strong.textContent = text;
  span.textContent = sub;
  hud.banner.replaceChildren(strong, span);
  if (img) {
    const icon = new Image();
    icon.src = img;
    icon.alt = '';
    strong.prepend(icon);
  }
  hud.banner.classList.remove('show');
  void hud.banner.offsetWidth; // restart the CSS animation
  hud.banner.classList.add('show');
}

function setSeason(idx) {
  if (idx === game.seasonIdx) return;
  game.prevSeasonIdx = game.seasonIdx;
  game.seasonIdx = idx;
  game.seasonFade = 0;
  const s = season();
  showBanner(s.name, s.hint);
  idle(primeGrades);
}

// Screen position and scale of the player, for effects that start there.
const playerSpot = () => project(view, game.player.x, PLAYER_Z, PLAYER_R);

function collect(type) {
  const p = POWERUPS[type];
  const at = playerSpot();
  burstSparkles(game.fx, at.sx, at.sy, at.s / 45);
  if (type === 'helmet') {
    const before = game.player.helmets;
    game.player.helmets = addHelmet(before, MAX_HELMETS);
    const hint = game.player.helmets === before ? `Maximal ${MAX_HELMETS} Helme` : `${game.player.helmets} von ${MAX_HELMETS} – je ein Crash frei`;
    showBanner(p.name, hint, p.img);
  } else {
    game.effects[type] = p.duration;
    showBanner(p.name, p.hint, p.img);
  }
  navigator.vibrate?.(30);
}

function crash() {
  const at = playerSpot();
  burstStones(game.fx, at.sx, at.sy, at.s / 45);
  if (game.player.helmets > 0) {
    game.player.helmets--;
    game.shake = 0.3;
    game.flash = 0.25;
    navigator.vibrate?.(80);
    showBanner('Helm kaputt', game.player.helmets ? `Noch ${game.player.helmets} übrig` : 'Glück gehabt!', POWERUPS.helmet.img);
    return;
  }
  game.shake = 0.5;
  game.flash = 0.6;
  game.player.dazed = true;
  game.crashAt = game.time;
  navigator.vibrate?.([120, 60, 200]);
  setState('over');
  const best = Math.max(readBest(), game.passed);
  writeBest(best);
  board.offer(game.passed, season().name);
  hud.final.textContent = game.passed;
  hud.best.textContent = best;
  setTimeout(() => hud.over.classList.add('show'), 500);
  hud.over.dataset.ready = '0';
  setTimeout(() => { hud.over.dataset.ready = '1'; }, 1100);
}

function updatePlayer(dt, speed) {
  const p = game.player;
  const keyDir = (input.keys.has('ArrowRight') || input.keys.has('d') ? 1 : 0)
    - (input.keys.has('ArrowLeft') || input.keys.has('a') ? 1 : 0);
  const limit = CORRIDOR / 2 - PLAYER_R;
  p.target = Math.max(-limit, Math.min(limit, p.target + keyDir * 10 * dt));
  // spring toward the finger; ice and puddles make it loose and overshooting
  const icy = season().id === 'winter' || p.slippery > 0;
  const { k, c } = icy ? ICE : SPRING;
  // gravel: a constant hop and now and then a stone knocks you sideways
  const { bump, kick } = game.surface;
  p.bump += (bump - p.bump) * Math.min(1, dt * 8);
  if (kick && (game.nextKick -= dt) <= 0) {
    const [e0, e1] = kick.every, [i0, i1] = kick.impulse;
    game.nextKick = e0 + Math.random() * (e1 - e0);
    p.vx += (Math.random() < 0.5 ? -1 : 1) * (i0 + Math.random() * (i1 - i0)) * (icy ? ICE.kick : 1);
  }
  const a = k * (p.target - p.x) - c * p.vx + game.wind.force;
  p.vx += a * dt;
  p.x += p.vx * dt;
  if (Math.abs(p.x) > limit) { p.x = Math.sign(p.x) * limit; p.vx *= -0.3; }
  p.spin += (speed * dt) / PLAYER_R * 0.35 + p.vx * dt * 0.8;
  p.slippery = Math.max(0, p.slippery - dt);
  p.slip = slipAmount(season().id === 'winter', p.slippery);
}

// skid marks stay on the ground and scroll toward the camera; spray flies off the player
function updateSkids(dt, dz) {
  const p = game.player, str = skidStrength(p.vx, p.slip);
  for (const m of game.skids) m.z -= dz;
  while (game.skids.length && game.skids[0].z <= 2) game.skids.shift();
  if (str > 0) {
    game.skids.push({ x: p.x, z: PLAYER_Z, a: str, brk: !game.skidding });
    if (game.skids.length > 70) game.skids.shift();
    const ground = project(view, p.x, PLAYER_Z);
    const snow = season().id === 'winter';
    const k = view.W / 390, n = Math.ceil(str * 2.5);
    for (let i = 0; i < n; i++) {
      game.spray.push({
        x: ground.sx, y: ground.sy - ground.s * 0.3,
        vx: -Math.sign(p.vx) * (30 + Math.random() * 90) * (0.5 + str) * k, vy: -(40 + Math.random() * 90) * k,
        size: ground.s * (0.05 + Math.random() * 0.07), life: 0.5, max: 0.5,
        color: snow ? '#ffffff' : '#bfe0ff',
      });
    }
  }
  for (const s of game.spray) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 420 * (view.W / 390) * dt; s.life -= dt; }
  game.skidding = str > 0;
  game.spray = game.spray.filter((s) => s.life > 0);
  if (game.spray.length > 60) game.spray.splice(0, game.spray.length - 60);
}

function updateParticles(dt) {
  const s = season(), cfg = s.particle;
  const list = game.particles;
  const spawn = cfg.rate * dt * (view.W / 400);
  const count = Math.floor(spawn) + (Math.random() < spawn % 1 ? 1 : 0);
  for (let i = 0; i < count; i++) {
    list.push({
      x: Math.random() * view.W * 1.2 - view.W * 0.1, y: -10,
      vx: (Math.random() - 0.5) * 20, vy: cfg.fall * (0.6 + Math.random() * 0.8),
      size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6,
      color: cfg.colors[(Math.random() * cfg.colors.length) | 0], leaf: s.id === 'autumn', petal: s.id === 'spring',
    });
  }
  const windPx = game.wind.drift * 0.6;
  for (const p of list) {
    p.x += (p.vx + windPx) * dt + Math.sin(game.time * 2 + p.rot) * 0.3;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
  }
  game.particles = list.filter((p) => p.y < view.H + 20 && p.x > -60 && p.x < view.W + 60).slice(-250);
}

function update(dt) {
  game.time += dt;
  const eff = game.effects;
  eff.slowmo = Math.max(0, eff.slowmo - dt);
  eff.widen = Math.max(0, eff.widen - dt);
  game.slowFactor += ((eff.slowmo > 0 ? 0.55 : 1) - game.slowFactor) * Math.min(1, dt * 4);
  game.seasonFade = Math.min(1, game.seasonFade + dt / 1.5);

  const under = game.surfaceAt(game.travelled + PLAYER_Z);
  if (under.id !== game.surface.id) {
    game.surface = under;
    // no banner for plain dirt or while another one is still showing
    if (under.id !== 'dirt' && performance.now() - game.bannerAt > 2400) showBanner(under.name, under.hint);
  }
  // the base speed follows the walls passed; it eases up instead of stepping at each wall
  game.pace += (speedAt(game.passed) - game.pace) * Math.min(1, dt * 1.5);
  const speed = game.pace * season().speedMul * game.surface.speedMul * game.slowFactor;
  game.speed = speed;
  const dz = speed * dt;
  game.travelled += dz;

  game.nextSpawnIn -= dz;
  if (game.nextSpawnIn <= 0) spawnWall();

  stepWind(game.wind, dt, season().id === 'autumn', windAt(game.passed), Math.random);
  updatePlayer(dt, speed);
  const p = game.player;
  updateSkids(dt, dz);
  const widenFactor = eff.widen > 0 ? 1.6 : 1;

  for (const w of game.walls) {
    const before = w.z;
    w.z -= dz;
    if (before > PLAYER_Z && w.z <= PLAYER_Z) {
      const gaps = w.gaps.map((g) => widened(g, widenFactor));
      if (passesWall(p.x, PLAYER_R * 0.75, gaps)) {
        game.passed++;
        setSeason(seasonIndexAt(game.passed, WALLS_PER_SEASON, SEASONS.length));
      } else {
        crash();
        w.broken = true;
        if (state === 'over') return;
      }
    }
  }
  for (const item of game.pickups) {
    const before = item.z;
    item.z -= dz;
    if (!item.taken && before > PLAYER_Z && item.z <= PLAYER_Z && Math.abs(item.x - p.x) < 1) {
      item.taken = true;
      collect(item.type);
    }
  }
  for (const pd of game.puddles) {
    const before = pd.z;
    pd.z -= dz;
    if (before > PLAYER_Z && pd.z <= PLAYER_Z && Math.abs(pd.x - p.x) < pd.r) {
      if (p.slippery <= 0) showBanner('Rutschig!', 'Gegenlenken dauert länger');
      p.slippery = 1.4;
    }
  }
  game.walls = game.walls.filter((w) => w.z > 0.6 && !w.broken);
  game.pickups = game.pickups.filter((i) => i.z > 0.6 && !i.taken);
  game.puddles = game.puddles.filter((pd) => pd.z > 0.6);
  updateParticles(dt);
  updateHud(speed);
}

function updateHud(speed) {
  if (hud.score.textContent !== String(game.passed)) {
    hud.score.textContent = game.passed;
    const chip = hud.score.parentElement;
    chip.classList.remove('pop');
    void chip.offsetWidth; // restart the CSS animation
    chip.classList.add('pop');
  }
  hud.speed.textContent = `${Math.round(speed * 1.6)} km/h`;
  const s = season();
  hud.season.textContent = s.name;
  const parts = [];
  for (let i = 0; i < game.player.helmets; i++) parts.push(`<span class="pw helmet"><img src="${POWERUPS.helmet.img}" alt=""></span>`);
  for (const key of ['slowmo', 'widen']) {
    const left = game.effects[key];
    if (left > 0) {
      const pct = (left / POWERUPS[key].duration) * 100;
      parts.push(`<span class="pw ${key}"><img src="${POWERUPS[key].img}" alt=""><i style="width:${pct}%"></i></span>`);
    }
  }
  hud.powers.innerHTML = parts.join(''); // only our own icons, never player text
  const w = game.wind;
  const dir = windArrow(w);
  hud.wind.textContent = dir > 0 ? 'Wind →' : dir < 0 ? '← Wind' : '';
  hud.wind.classList.toggle('warn', w.warn > 0);
}

// Everything on the ground, drawn far to near. Reused every frame.
const drawList = [];
const byDepth = (a, b) => b.depth - a.depth;
function queue(list, layer, lift = 0) {
  for (const o of list) {
    o.layer = layer;
    o.depth = o.z + lift;
    drawList.push(o);
  }
}

function drawThing(o, look) {
  switch (o.layer) {
    case 'plant': drawScenery(ctx, view, o, o.z > look.aheadZ ? look.aheadId : look.s.id); break;
    case 'puddle': drawPuddle(ctx, view, o); break;
    case 'wall': {
      const gaps = look.widen > 1 ? o.gaps.map((g) => widened(g, look.widen)) : o.gaps;
      drawWall(ctx, view, o.z, gaps, SEASONS[seasonIndexAt(o.index, WALLS_PER_SEASON, SEASONS.length)]);
      break;
    }
    case 'pickup': drawPickup(ctx, view, o, POWERUPS[o.type], game.time, powerIcons[o.type]); break;
    default: drawPlayer(ctx, view, o, game.time, state === 'playing' ? look.speed : 0, figure, look.pose);
  }
}

function render() {
  const s = season();
  const prev = game.prevSeasonIdx !== null ? SEASONS[game.prevSeasonIdx] : null;
  ctx.save();
  if (game.shake > 0) {
    const m = game.shake * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  drawBackground(ctx, view, backgrounds[s.id], prev && backgrounds[prev.id], game.seasonFade, game.player.x);
  drawGround(ctx, view, s, game.travelled, game.surfaceAt, groundTiles);
  drawHorizon(ctx, view, s, prev, game.seasonFade, game.player.x);
  if (s.id === 'winter') drawIceSheen(ctx, view, game.travelled, game.seasonFade);
  drawSkidMarks(ctx, view, game.skids, s.id === 'winter');

  const speed = game.speed;
  const ahead = seasonAhead(game.walls, game.seasonIdx, WALLS_PER_SEASON, SEASONS.length);
  const showPlayer = figure && state !== 'start';
  const mode = { intro: 'intro', over: 'dazed' }[state] ?? 'roll';
  const t = mode === 'intro' ? game.introT : game.time - game.crashAt;
  const pose = showPlayer ? poseFor({ mode, t, spin: game.player.spin, helmet: game.player.helmets > 0 }, figure) : null;
  const look = { s, aheadZ: ahead.z, aheadId: SEASONS[ahead.idx].id, speed, widen: game.effects.widen > 0 ? 1.6 : 1, pose };
  drawList.length = 0;
  queue(sceneryAt(game.travelled), 'plant');
  queue(game.puddles, 'puddle', 0.01);
  queue(game.walls, 'wall');
  queue(game.pickups, 'pickup');
  // the wall you crashed into stays behind you, so you can see yourself dazed in front of it
  for (const w of game.walls) if (w.broken) w.depth = PLAYER_Z + 0.5;
  if (showPlayer) {
    game.player.layer = 'player';
    game.player.depth = PLAYER_Z - 0.001;
    drawList.push(game.player);
  }
  drawList.sort(byDepth);
  for (const o of drawList) drawThing(o, look);

  drawSpray(ctx, game.spray);
  drawParticles(ctx, game.particles);
  if (state === 'playing') drawSpeedLines(ctx, view, look.speed, game.time);
  drawGrade(ctx, view, s, prev, game.seasonFade);
  drawFx(ctx, game.fx);
  if (game.effects.slowmo > 0) {
    ctx.fillStyle = 'rgba(80,120,255,0.12)';
    ctx.fillRect(0, 0, view.W, view.H);
  }
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,40,40,${game.flash * 0.6})`;
    ctx.fillRect(0, 0, view.W, view.H);
  }
  ctx.restore();
}

function step(dt) {
  if (preview && game && state !== 'loading') { render(); return; }
  if (state === 'playing') update(dt);
  else if (state === 'start') { game.time += dt; game.travelled += dt * 6; updateParticles(dt); }
  else if (state === 'intro') {
    game.introT += dt; // game.time stays 0: the intro is not play time
    const at = introAt(game.introT);
    game.travelled += dt * speedAt(0) * at.trip * at.trip; // the world speeds up as you trip
    updateParticles(dt);
    if (at.done) beginPlay();
  }
  else if (state === 'over') game.time += dt; // keeps the dazed stars turning
  game.fx = stepFx(game.fx, dt);
  game.shake = Math.max(0, game.shake - dt);
  game.flash = Math.max(0, game.flash - dt);
  render();
}

function frame(now) {
  step(Math.min((now - last) / 1000, 1 / 30));
  last = now;
  requestAnimationFrame(frame);
}

function pick(id) {
  figureId = id;
  saveFigure(id);
  picker.select(id);
}

async function choose(id) {
  if (state !== 'start' || loadingFigure) return;
  document.activeElement?.blur();
  pick(id);
  const tap = hud.start.querySelector('.tap');
  loadingFigure = true;
  tap.textContent = 'Lädt …';
  try {
    figure = await sheetsFor(id);
  } catch (err) {
    tap.textContent = 'Nochmal versuchen';
    console.error(err);
    return;
  } finally {
    loadingFigure = false;
  }
  tap.textContent = TAP_TEXT;
  for (const k of figureSheets.keys()) if (k !== id) figureSheets.delete(k);
  beginIntro();
}

function beginIntro() {
  game = newGame();
  board.offer(null);
  hud.start.classList.remove('show');
  hud.over.classList.remove('show');
  setState('intro');
  updateHud(speedAt(0));
}

function beginPlay() {
  setState('playing');
  showBanner(season().name, season().hint);
}

// Fast retry after a crash: straight into the round, no intro.
function start() {
  game = newGame();
  board.offer(null);
  hud.start.classList.remove('show');
  hud.over.classList.remove('show');
  beginPlay();
}

function onPointerDown(e) {
  if (e.target?.closest?.('#ideas, #board, #over button, #figures')) return;
  if (state === 'start') { choose(figureId); return; }
  if (state === 'over') {
    if (hud.over.dataset.ready === '1') start();
    return;
  }
  if (state === 'intro') beginPlay();
  input.dragging = true;
  input.lastX = e.clientX;
}

function onPointerMove(e) {
  if (!input.dragging || state !== 'playing') return;
  const dx = e.clientX - input.lastX;
  input.lastX = e.clientX;
  const unitsPerPx = PLAYER_Z / view.F;
  const limit = CORRIDOR / 2 - PLAYER_R;
  const p = game.player;
  p.target = Math.max(-limit, Math.min(limit, p.target + dx * unitsPerPx * 1.4));
}

function bindInput() {
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', () => { input.dragging = false; });
  window.addEventListener('pointercancel', () => { input.dragging = false; });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest?.('#ideas, #board, #over button, #figures')) return;
    input.keys.add(e.key);
    if ((e.key === ' ' || e.key === 'Enter') && state !== 'playing') {
      onPointerDown({ clientX: 0 });
      input.dragging = false; // keys steer on their own; no finger to follow
    }
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.key));
  hud.changeFigure.addEventListener('click', () => {
    document.activeElement?.blur();
    if (state !== 'over') return;
    game = newGame();
    board.offer(null);
    hud.over.classList.remove('show');
    hud.start.classList.add('show');
    hud.bestStart.textContent = readBest();
    setState('start');
  });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { last = performance.now(); });
}

async function init() {
  resize();
  bindInput();
  try {
    const [seasonBackgrounds, ...icons] = await Promise.all([
      loadSeasonBackgrounds(SEASONS, loadImage, preview?.idx ?? 0),
      ...Object.values(POWERUPS).map((p) => loadImage(p.img)),
    ]);
    backgrounds = seasonBackgrounds;
    powerIcons = Object.fromEntries(Object.keys(POWERUPS).map((k, i) => [k, icons[i]]));
    groundTiles = buildGroundTiles(SEASONS, preview?.idx ?? 0);
    warmUp(SEASONS);
  } catch (err) {
    hud.start.querySelector('.tap').textContent = 'Laden fehlgeschlagen – bitte neu laden.';
    console.error(err);
    return;
  }
  game = newGame();
  primeGrades();
  board = setupLeaderboard();
  setupIdeas(() => ({ score: game.passed, season: season().name }));
  // a card only picks the figure; the button (or a tap anywhere else) starts
  picker = setupFigureSelect(hud.figures, figureId, (id) => {
    if (loadingFigure) return; // a round is already starting with the other figure
    pick(id);
    sheetsFor(id).catch(() => {});
    hud.start.querySelector('.tap').focus(); // so Space/Enter starts next, not the card again
  });
  sheetsFor(figureId).catch(() => {});
  hud.bestStart.textContent = readBest();
  hud.start.classList.add('show');
  setState('start');
  if (preview) {
    preparePreview(game, preview);
    figure = await sheetsFor(figureId);
    hud.start.classList.remove('show');
    setState('playing');
    primeGrades();
    updateHud(speedAt(0));
  }
  last = performance.now();
  requestAnimationFrame(frame);
}

init();

// Hook for local testing: open index.html#debug
if (location.hash === '#debug') {
  window.rollDown = {
    game: () => game, start, intro: beginIntro, step, setSeason: (i) => setSeason(i),
    spawn: spawnWall, update: (dt) => update(dt),
  };
}
