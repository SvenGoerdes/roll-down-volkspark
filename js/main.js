import {
  CORRIDOR, PLAYER_R, PLAYER_Z, SPAWN_Z, SEASONS, POWERUPS, WALLS_PER_SEASON, SPRING, ICE, VOLKSPARK_LANDMARK_PRELOAD,
} from './config.js';
import {
  speedAt, spacingAt, makeGaps, widened, passesWall, seasonIndexAt, slipAmount, skidStrength, windAt, stepWind, windArrow, selectPowerup,
} from './logic.js';
import { loadSeasonBackgrounds } from './seasons.js';
import { environmentPreview, preparePreview } from './environment-preview.js';
import { buildGroundTiles } from './surfaces.js';
import { loadGroundArt } from './surface-art.js';
import { setupIdeas } from './ideas.js';
import { setupLeaderboard } from './leaderboard.js';
import { computeView, project } from './render.js';
import { loadFigure, introAt } from './figure.js';
import { readFigure, saveFigure, setupFigureSelect } from './figure-select.js';
import { setupThemeSelect } from './theme-select.js';
import { loadGateSprites } from './gate-sprites.js';
import { loadGallerySprites } from './gallery-sprites.js';
import { loadOberbaumSprites } from './oberbaum-sprites.js';
import { loadReichstagSprites } from './reichstag-sprites.js';
import { loadRathausSprites } from './rathaus-sprites.js';
import {
  primeGrade, warmUp,
} from './render-fx.js';
import { stepFx } from './fx.js';
import { STREAK_NEED, judgePass } from './scoring.js';
import { bindInput as setupInput } from './input.js';
import { createHud } from './hud.js';
import { createGameFlow } from './game-flow.js';
import { renderScene } from './render-scene.js';
import { newGame as createGameState } from './game-state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);
const hud = {
  score: $('score'), speed: $('speed'), season: $('season'), powers: $('powers'),
  wind: $('wind'), banner: $('banner'), start: $('start'), over: $('over'),
  final: $('final'), best: $('best'), bestStart: $('best-start'),
  figures: $('figures'), changeFigure: $('change-figure'),
  streak: $('streak'), pop: $('pop'), overNote: $('over-note'),
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
let themeId = 'volkspark', gateSprites, gateLoad, groundLoad;
const figureSheets = new Map();

const newGame = () => ({ ...createGameState(readBest), theme: themeId });

function gatesFor() {
  gateLoad ??= Promise.all([loadGateSprites(loadImage), loadGallerySprites(loadImage), loadOberbaumSprites(loadImage), loadReichstagSprites(loadImage), loadRathausSprites(loadImage)])
    .then(([gate, gallery, oberbaum, reichstag, rathaus]) => {
      gateSprites = { 'brandenburg-gate': gate, 'east-side-gallery': gallery, 'oberbaum-bridge': oberbaum, reichstag, 'red-town-hall': rathaus };
      return gateSprites;
    }).catch((err) => {
    gateLoad = null; // A failed optional theme load can be retried, never start with invisible gates.
    throw err;
  });
  return gateLoad;
}

// Volkspark loads the landmark sprites late, once. A failed load is not retried: the gabion walls stay.
let landmarksTried = false;
function preloadLandmarks() {
  if (landmarksTried || themeId !== 'volkspark' || game.passed < VOLKSPARK_LANDMARK_PRELOAD) return;
  landmarksTried = true;
  gatesFor().catch(() => {});
}

// The Berlin-Tour ground loads and builds on first choice; Volkspark never pays for it.
function berlinGroundFor() {
  groundLoad ??= loadGroundArt(loadImage).then(() => {
    groundTiles['berlin-tour'] = buildGroundTiles(SEASONS, preview?.idx ?? 0, true);
  }).catch((err) => { groundLoad = null; throw err; });
  return groundLoad;
}

async function sheetsForRound(id) {
  const [sheets] = await Promise.all([sheetsFor(id), themeId === 'berlin-tour' ? Promise.all([gatesFor(), berlinGroundFor()]) : null]);
  return sheets;
}

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
const gameHud = createHud(hud, { getGame: () => game, getSeason: season, playerSpot, windArrow });
const { showBanner, popText: showPopText, update: updateHud, showOver } = gameHud;
const flow = createGameFlow({ hud, getState: () => state, getGame: () => game, getLoadingFigure: () => loadingFigure,
  setLoadingFigure: (value) => {
    loadingFigure = value;
    for (const button of $('themes').children) button.disabled = value;
  }, setGame: (value) => { game = value; },
  newGame, getBoard: () => board, setState, updateHud, speedAt, showBanner, season, sheetsFor: sheetsForRound,
  figureSheets, pick,
  setFigure: (value) => { figure = value; }, playerSpot,
  popText: showPopText, showOver, readBest, writeBest });
const { beginIntro, beginPlay, choose, start, collect, onPass, crash } = flow;

function spawnWall() {
  const s = SEASONS[seasonIndexAt(game.spawned, WALLS_PER_SEASON, SEASONS.length)];
  const gaps = makeGaps(game.spawned, game.lastGapX, s, Math.random);
  game.lastGapX = gaps[0].x;
  game.walls.push({ z: SPAWN_Z, gaps, index: game.spawned, snowy: s.id === 'winter' });
  const spacing = spacingAt(game.spawned + 1); // distance to the next wall
  const type = game.spawned > 1 ? selectPowerup(Math.random) : null;
  if (type) game.pickups.push({ z: SPAWN_Z + spacing / 2, type, x: (Math.random() - 0.5) * (CORRIDOR - 2) });
  if (s.id === 'spring' && game.spawned > 2 && Math.random() < 0.6) {
    game.puddles.push({ z: SPAWN_Z + spacing * (0.3 + Math.random() * 0.4), x: (Math.random() - 0.5) * (CORRIDOR - 2), r: 0.9 + Math.random() * 0.6 });
  }
  game.spawned++;
  game.nextSpawnIn = spacing;
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
function playerSpot() { return project(view, game.player.x, PLAYER_Z, PLAYER_R); }

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
        preloadLandmarks();
        setSeason(seasonIndexAt(game.passed, WALLS_PER_SEASON, SEASONS.length));
        onPass(judgePass(p.x, PLAYER_R * 0.75, gaps));
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

function render() {
  renderScene(ctx, view, game, state, figure, backgrounds, groundTiles, powerIcons, gateSprites);
}

function step(dt) {
  if (preview && game && state !== 'loading') { render(); return; }
  if (state === 'playing') update(dt);
  else if (state === 'start') { game.time += dt; game.travelled += dt * 6; updateParticles(dt); }
  else if (state === 'intro') {
    game.introT += dt; // game.time stays 0: the intro is not play time
    const at = introAt(game.introT, figure);
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

function bindInput() {
  setupInput({ input, hud, getState: () => state, getGame: () => game, getView: () => view,
    choose: () => choose(figureId), start, newGame, setGame: (next) => { game = next; }, getBoard: () => board,
    readBest, setState, beginPlay, resize, setLast: (value) => { last = value; } });
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
    groundTiles = { volkspark: buildGroundTiles(SEASONS, preview?.idx ?? 0) };
    warmUp(SEASONS);
  } catch (err) {
    hud.start.querySelector('.tap').textContent = 'Laden fehlgeschlagen – bitte neu laden.';
    console.error(err);
    return;
  }
  game = newGame();
  primeGrades();
  hud.streak.innerHTML = '<i></i>'.repeat(STREAK_NEED) + `<img src="${POWERUPS.helmet.img}" alt="">`; // only our own markup
  board = setupLeaderboard();
  setupIdeas(() => ({ score: game.passed, season: season().name }));
  setupThemeSelect($('themes'), themeId, (id) => {
    themeId = id;
    game.theme = id;
    if (id === 'berlin-tour') { gatesFor().catch(() => {}); berlinGroundFor().catch(() => {}); }
  });
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
