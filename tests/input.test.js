import { test, expect } from 'bun:test';
import { bindInput } from '../js/input.js';

test('figure change resolves the board after input setup', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const events = {};
  const windowMock = { addEventListener: (name, fn) => { events[name] = fn; } };
  let change;
  const documentMock = {
    activeElement: { blur() {} },
    addEventListener() {},
  };
  let state = 'over';
  let board;
  let game;
  const removed = [], added = [];
  const hud = {
    over: { dataset: {}, classList: { remove: (...args) => removed.push(args) } },
    start: { classList: { add: (...args) => added.push(args) } },
    bestStart: { textContent: '' },
    changeFigure: { addEventListener: (_name, fn) => { change = fn; } },
  };
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: windowMock });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: documentMock });
    bindInput({
      input: { dragging: false, lastX: 0, keys: new Set() }, hud,
      getState: () => state, getGame: () => game, getView: () => ({ F: 1 }),
      choose() {}, start() {}, newGame: () => ({ fresh: true }), setGame: (next) => { game = next; },
      getBoard: () => board, readBest: () => 12, setState: (next) => { state = next; },
      beginPlay() {}, resize() {}, setLast() {},
    });
    board = { offered: false, offer() { this.offered = true; } };
    change();
    expect(game).toEqual({ fresh: true });
    expect(board.offered).toBe(true);
    expect(state).toBe('start');
    expect(hud.bestStart.textContent).toBe(12);
    expect(removed).toEqual([['show']]);
    expect(added).toEqual([['show']]);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
  }
});
