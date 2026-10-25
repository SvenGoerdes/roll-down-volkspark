import { test, expect } from 'bun:test';
import { createGameFlow } from '../js/game-flow.js';
import { MAX_HELMETS } from '../js/config.js';

function fixture(overrides = {}) {
  const originalGame = {
    passed: 7, best: 6, streak: 5, recordShown: false, time: 3, fx: [],
    player: { x: 0, helmets: 0, dazed: false }, effects: { slowmo: 0, widen: 0 },
  };
  const calls = [];
  let game = originalGame;
  let state = 'playing';
  let board = { offer: (...args) => calls.push(['offer', ...args]), refreshWorld: async () => null };
  const tap = { textContent: '', focus() {} };
  const hud = {
    start: { classList: { remove() {}, add() {}, contains: () => false }, querySelector: () => tap },
    over: { classList: { remove() {}, add() {} } },
  };
  const flow = createGameFlow({
    hud, getState: () => state, getGame: () => game, getLoadingFigure: () => false,
    setLoadingFigure() {}, setGame: (next) => { game = next; }, newGame: () => ({ ...originalGame, player: { ...originalGame.player }, effects: { ...originalGame.effects }, fx: [] }),
    getBoard: () => board, setState: (next) => { state = next; },
    updateHud: (...args) => calls.push(['hud', ...args]), speedAt: () => 16,
    showBanner: (...args) => calls.push(['banner', ...args]), popText: (...args) => calls.push(['pop', ...args]),
    showOver: (...args) => calls.push(['over', ...args]), season: () => ({ name: 'Winter', hint: 'Eis' }),
    sheetsFor: async () => ({}), figureSheets: new Map(), pick() {}, setFigure() {},
    playerSpot: () => ({ sx: 100, sy: 200, s: 45 }), readBest: () => 6, writeBest: (n) => calls.push(['best', n]),
    ...overrides,
  });
  return { game: originalGame, getGame: () => game, calls, flow, setState: (next) => { state = next; }, getState: () => state, setBoard: (next) => { board = next; }, hud, tap };
}

test('flow reads the replacement game after start', () => {
  const { game: originalGame, getGame, calls, flow } = fixture();
  flow.start();
  const currentGame = getGame();

  flow.onPass('perfect');
  flow.collect('helmet');

  expect(currentGame).not.toBe(originalGame);
  expect(currentGame.streak).toBe(0);
  expect(currentGame.player.helmets).toBe(2);
  expect(currentGame.fx.length).toBeGreaterThan(0);
  expect(originalGame.streak).toBe(5);
  expect(originalGame.player.helmets).toBe(0);
  expect(originalGame.fx).toHaveLength(0);
  expect(calls.some(([kind, text]) => kind === 'pop' && text === 'Perfekt')).toBe(true);
});

test('flow pass uses current game for streak reward and record', () => {
  const { game, calls, flow } = fixture();
  flow.onPass('perfect');
  expect(game.streak).toBe(0);
  expect(game.player.helmets).toBe(1);
  expect(game.recordShown).toBe(true);
  expect(calls.some(([kind, text]) => kind === 'pop' && text === 'Perfekt')).toBe(true);
  expect(calls.some(([kind, text]) => kind === 'banner' && text === 'Neuer Rekord!')).toBe(true);
});

test('flow: passing the world record wins the banner, own record follows later', () => {
  const { game, calls, flow } = fixture();
  game.worldBest = 6;
  flow.onPass('good');
  expect(game.worldShown).toBe(true);
  expect(game.recordShown).toBe(true);
  expect(calls.filter(([kind, text]) => kind === 'banner' && text === 'Weltrekord!')).toHaveLength(1);
  expect(calls.some(([kind, text]) => kind === 'banner' && text === 'Neuer Rekord!')).toBe(false);
});

test('flow: a world record answer counts only before the first wall', async () => {
  const fresh = fixture();
  fresh.setBoard({ offer() {}, refreshWorld: async () => 40 });
  fresh.flow.start();
  const first = fresh.getGame();
  first.passed = 0;
  await Promise.resolve(); await Promise.resolve();
  expect(first.worldBest).toBe(40);

  const late = fixture();
  let answer;
  late.setBoard({ offer() {}, refreshWorld: () => new Promise((resolve) => { answer = resolve; }) });
  late.flow.start();
  const second = late.getGame();
  second.passed = 3;
  answer(40);
  await Promise.resolve(); await Promise.resolve();
  expect(second.worldBest).toBeUndefined();
});

test('flow pickup and fatal crash update the current game and leaderboard', () => {
  const { game, calls, flow, getState } = fixture();
  flow.collect('helmet');
  expect(game.player.helmets).toBe(1);
  expect(game.fx.length).toBeGreaterThan(0);
  expect(calls.some(([kind, text]) => kind === 'banner' && text === 'Helm')).toBe(true);
  game.player.helmets = 0;
  flow.crash();
  expect(game.player.dazed).toBe(true);
  expect(getState()).toBe('over');
  expect(calls).toContainEqual(['offer', game.passed, 'Winter']);
  expect(calls.some(([kind]) => kind === 'over')).toBe(true);
});

test('flow uses the latest board and completes figure selection into intro', async () => {
  const { calls, flow, setState, setBoard, getState, tap } = fixture();
  setState('start');
  const latest = { offer: (...args) => calls.push(['latest board', ...args]), refreshWorld: async () => null };
  setBoard(latest);
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { activeElement: { blur() {} } } });
  try {
    await flow.choose('tine');
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
  }
  expect(getState()).toBe('intro');
  expect(calls).toContainEqual(['latest board', null]);
  expect(calls.some(([kind]) => kind === 'hud')).toBe(true);
  expect(tap.textContent).toBe('Losrollen');
});

test('flow respects the helmet cap when collecting', () => {
  const { game, flow } = fixture();
  game.player.helmets = MAX_HELMETS;
  flow.collect('helmet');
  expect(game.player.helmets).toBe(MAX_HELMETS);
});
