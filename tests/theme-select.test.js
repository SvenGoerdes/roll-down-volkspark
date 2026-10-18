import { test, expect } from 'bun:test';
import { setupThemeSelect, THEMES, validateThemeId } from '../js/theme-select.js';

test('theme IDs are restricted to the two start-screen choices', () => {
  expect(THEMES.map(({ id }) => id)).toEqual(['volkspark', 'berlin-tour']);
  expect(validateThemeId('berlin-tour')).toBe('berlin-tour');
  expect(validateThemeId('unknown')).toBe('volkspark');
  expect(validateThemeId(null)).toBe('volkspark');
});

test('theme selector defaults to Volkspark and updates aria state on click and select', () => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const buttons = [];
  const documentMock = {
    createElement() {
      const attributes = {};
      const listeners = {};
      const button = {
        attributes, listeners,
        setAttribute: (name, value) => { attributes[name] = value; },
        addEventListener: (name, fn) => { listeners[name] = fn; },
      };
      buttons.push(button);
      return button;
    },
  };
  const container = { replaceChildren(...children) { this.children = children; } };
  const selected = [];
  try {
    Object.defineProperty(globalThis, 'document', { configurable: true, value: documentMock });
    const selector = setupThemeSelect(container, undefined, (id) => selected.push(id));
    expect(buttons.map(({ attributes }) => attributes['aria-pressed'])).toEqual(['true', 'false']);
    buttons[1].listeners.click();
    expect(buttons.map(({ attributes }) => attributes['aria-pressed'])).toEqual(['false', 'true']);
    expect(selected).toEqual(['berlin-tour']);
    expect(selector.select('volkspark')).toBe(true);
    expect(buttons.map(({ attributes }) => attributes['aria-pressed'])).toEqual(['true', 'false']);
    expect(selected).toEqual(['berlin-tour', 'volkspark']);
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
  }
});
