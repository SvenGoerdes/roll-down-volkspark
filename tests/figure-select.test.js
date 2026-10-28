import { test, expect } from 'bun:test';
import { readFigure, saveFigure, setupFigureSelect } from '../js/figure-select.js';
import { ALASKA_UNLOCK_WALLS } from '../js/config.js';

function withStorage(initial, fn) {
  const store = new Map(Object.entries(initial));
  const prev = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    },
  });
  try {
    return fn(store);
  } finally {
    if (prev) Object.defineProperty(globalThis, 'localStorage', prev);
    else delete globalThis.localStorage;
  }
}

test('saved Alaska falls back to default when locked and stays selected when unlocked', () => {
  withStorage({ rollDownFigure: 'alaska' }, () => {
    expect(readFigure()).toBe('kalle');
    expect(readFigure(0)).toBe('kalle');
    expect(readFigure(ALASKA_UNLOCK_WALLS - 1)).toBe('kalle');
    expect(readFigure(ALASKA_UNLOCK_WALLS)).toBe('alaska');
  });
  withStorage({ rollDownFigure: 'tine' }, () => {
    expect(readFigure(0)).toBe('tine');
  });
  withStorage({}, (store) => {
    saveFigure('tine');
    expect(store.get('rollDownFigure')).toBe('tine');
  });
});

test('locked Alaska card shows hint, ignores tap, and unlocks on refresh', () => {
  const prevDoc = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const elements = [];
  const documentMock = {
    createElement(tag) {
      const classes = new Set();
      const attributes = {};
      const listeners = {};
      const children = [];
      const el = {
        tag,
        className: '',
        dataset: {},
        textContent: '',
        offsetWidth: 0,
        style: { setProperty() {} },
        children,
        attributes,
        listeners,
        classList: {
          add: (c) => classes.add(c),
          remove: (c) => classes.delete(c),
          toggle: (c, force) => {
            const on = force === undefined ? !classes.has(c) : Boolean(force);
            if (on) classes.add(c);
            else classes.delete(c);
          },
          contains: (c) => classes.has(c),
        },
        setAttribute: (k, v) => { attributes[k] = String(v); },
        append: (...nodes) => children.push(...nodes),
        addEventListener: (name, fn) => { listeners[name] = fn; },
      };
      elements.push(el);
      return el;
    },
  };
  const root = { replaceChildren(...cards) { this.cards = cards; } };
  const picked = [];
  try {
    Object.defineProperty(globalThis, 'document', { configurable: true, value: documentMock });
    const picker = setupFigureSelect(root, 'alaska', (id) => picked.push(id), 139);
    const [kalle, tine, alaska] = root.cards;

    expect(kalle.classList.contains('on')).toBe(true);
    expect(alaska.classList.contains('on')).toBe(false);
    expect(alaska.classList.contains('locked')).toBe(true);
    expect(alaska.attributes['aria-disabled']).toBe('true');
    expect(alaska.children[2].textContent).toBe('Knack 140 Mauern');
    expect(tine.children[2].textContent).toBe('Techno');

    alaska.listeners.click();
    expect(picked).toEqual([]);
    expect(alaska.classList.contains('nudge')).toBe(true);

    expect(picker.select('alaska')).toBe('kalle');
    expect(kalle.attributes['aria-pressed']).toBe('true');
    expect(alaska.attributes['aria-pressed']).toBe('false');

    picker.refresh(140);
    expect(alaska.classList.contains('locked')).toBe(false);
    expect(alaska.attributes['aria-disabled']).toBe('false');
    expect(alaska.children[2].textContent).toBe('Brillenkatze');

    alaska.listeners.click();
    expect(picked).toEqual(['alaska']);
    expect(picker.select('alaska')).toBe('alaska');
    expect(alaska.attributes['aria-pressed']).toBe('true');
  } finally {
    if (prevDoc) Object.defineProperty(globalThis, 'document', prevDoc);
    else delete globalThis.document;
  }
});
