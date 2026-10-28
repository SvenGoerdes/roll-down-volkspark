import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  LANG_KEY, LANGS, STRINGS,
  detectLang, resolveLang, readLang, getLang, setLang,
  t, seasonName, seasonHint, applyI18n, setupLangSwitch,
} from '../js/i18n.js';
import { SEASONS, SURFACES, POWERUPS } from '../js/config.js';
import { FIGURES } from '../js/figure.js';
import { THEMES } from '../js/theme-select.js';
import { overNote } from '../js/scoring.js';

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('every translation key exists in both de and en with non-empty text and matching placeholders', () => {
  expect(LANGS).toEqual(['de', 'en']);
  const deKeys = Object.keys(STRINGS.de).sort();
  const enKeys = Object.keys(STRINGS.en).sort();
  expect(enKeys).toEqual(deKeys);
  for (const key of deKeys) {
    expect(typeof STRINGS.de[key]).toBe('string');
    expect(typeof STRINGS.en[key]).toBe('string');
    expect(STRINGS.de[key].length).toBeGreaterThan(0);
    expect(STRINGS.en[key].length).toBeGreaterThan(0);
    expect(placeholders(STRINGS.en[key])).toEqual(placeholders(STRINGS.de[key]));
  }
});

test('all data-i18n* attributes in index.html and config ids exist in both dictionaries', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const attrs = [...html.matchAll(/data-i18n(?:-(?:placeholder|aria))?="([^"]+)"/g)].map((m) => m[1]);
  expect(attrs.length).toBeGreaterThan(15);
  for (const key of attrs) {
    expect(STRINGS.de[key]).toBeDefined();
    expect(STRINGS.en[key]).toBeDefined();
  }
  for (const s of SEASONS) {
    expect(STRINGS.de[`season.${s.id}`]).toBeDefined();
    expect(STRINGS.de[`season.${s.id}.hint`]).toBeDefined();
  }
  for (const id of Object.keys(SURFACES)) {
    expect(STRINGS.de[`surface.${id}`]).toBeDefined();
    expect(STRINGS.de[`surface.${id}.hint`]).toBeDefined();
  }
  for (const id of Object.keys(POWERUPS)) {
    expect(STRINGS.de[`powerup.${id}`]).toBeDefined();
    expect(STRINGS.de[`powerup.${id}.hint`]).toBeDefined();
  }
  for (const { id } of FIGURES) expect(STRINGS.de[`figure.${id}.tag`]).toBeDefined();
  for (const { id } of THEMES) expect(STRINGS.de[`theme.${id}`]).toBeDefined();
});

test('detectLang picks English for en* browser locales and German otherwise', () => {
  for (const nav of ['en', 'en-US', 'en-GB', 'EN-au', ' en-CA ']) {
    expect(detectLang(nav)).toBe('en');
  }
  for (const nav of ['de', 'de-DE', 'de-AT', 'fr-FR', 'es', 'tr', '', null, undefined, 42]) {
    expect(detectLang(nav)).toBe('de');
  }
});

test('resolveLang and readLang let a stored choice win over navigator.language', () => {
  expect(resolveLang('de', 'en-US')).toBe('de');
  expect(resolveLang('en', 'de-DE')).toBe('en');
  expect(resolveLang(null, 'en-GB')).toBe('en');
  expect(resolveLang('fr', 'en-GB')).toBe('en');
  expect(resolveLang(undefined, 'de-DE')).toBe('de');

  const prevStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const prevNav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const store = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
    },
  });
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { language: 'en-US' } });
    expect(readLang()).toBe('en');
    setLang('de');
    expect(store.get(LANG_KEY)).toBe('de');
    expect(readLang()).toBe('de');

    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { language: 'de-DE' } });
    setLang('en');
    expect(store.get(LANG_KEY)).toBe('en');
    expect(readLang()).toBe('en');
  } finally {
    setLang('de', { persist: false });
    if (prevStorage) Object.defineProperty(globalThis, 'localStorage', prevStorage);
    else delete globalThis.localStorage;
    if (prevNav) Object.defineProperty(globalThis, 'navigator', prevNav);
    else delete globalThis.navigator;
  }
});

test('t() formats placeholders and falls back cleanly', () => {
  try {
    setLang('de', { persist: false });
    expect(t('start.go')).toBe('Losrollen');
    expect(t('powerup.helmet.count', { count: 2, max: 3 })).toBe('2 von 3 – je ein Crash frei');
    expect(t('over.toRecordMany', { count: 4, target: 'Weltrekord' })).toBe('Noch 4 Mauern bis zum Weltrekord');

    setLang('en', { persist: false });
    expect(t('start.go')).toBe('Roll!');
    expect(t('over.title')).toBe('Ouch!');
    expect(t('powerup.helmet.count', { count: 2, max: 3 })).toBe('2 of 3 – 1 free crash each');
    expect(t('over.toRecordOne', { count: 1, target: 'world record' })).toBe('1 more wall to the world record');
    expect(t('missing.key')).toBe('missing.key');
  } finally {
    setLang('de', { persist: false });
  }
});

test('season helpers and overNote switch between German and English while keeping season.name intact for worker payloads', () => {
  try {
    setLang('en', { persist: false });
    expect(SEASONS[0].name).toBe('Frühling');
    expect(seasonName(SEASONS[0])).toBe('Spring');
    expect(seasonHint(SEASONS[0])).toBe('Puddles make you slip');
    expect(overNote(10, 5, 9)).toEqual({ text: 'New world record!', record: true });
    expect(overNote(7, 5, 9)).toEqual({ text: 'New record!', record: true });
    expect(overNote(9, 0, 9).text).toBe('1 more wall to the world record');
    expect(overNote(2, 5, 9).text).toBe('4 more walls to the record');
  } finally {
    setLang('de', { persist: false });
  }
});

test('applyI18n and setupLangSwitch update DOM attributes and language state immediately', () => {
  const textEl = { textContent: '', getAttribute: () => 'start.go' };
  const phEl = { placeholder: '', getAttribute: () => 'board.namePlaceholder' };
  const ariaEl = { aria: '', getAttribute: () => 'sheet.close', setAttribute: (_k, v) => { ariaEl.aria = v; } };
  const root = {
    documentElement: { lang: 'de' },
    querySelectorAll(sel) {
      if (sel === '[data-i18n]') return [textEl];
      if (sel === '[data-i18n-placeholder]') return [phEl];
      if (sel === '[data-i18n-aria]') return [ariaEl];
      return [];
    },
  };
  const makeBtn = (code) => {
    const attrs = { 'data-lang': code };
    const listeners = {};
    return {
      attrs,
      listeners,
      getAttribute: (k) => attrs[k],
      setAttribute: (k, v) => { attrs[k] = v; },
      addEventListener: (k, fn) => { listeners[k] = fn; },
    };
  };
  const deBtn = makeBtn('de');
  const enBtn = makeBtn('en');
  const changed = [];
  try {
    setLang('de', { persist: false });
    applyI18n(root);
    expect(root.documentElement.lang).toBe('de');
    expect(textEl.textContent).toBe('Losrollen');
    expect(phEl.placeholder).toBe('Dein Name');
    expect(ariaEl.aria).toBe('Schließen');

    setupLangSwitch({ children: [deBtn, enBtn] }, (lang) => {
      changed.push(lang);
      applyI18n(root);
    });
    expect(deBtn.attrs['aria-pressed']).toBe('true');
    expect(enBtn.attrs['aria-pressed']).toBe('false');

    enBtn.listeners.click();
    expect(getLang()).toBe('en');
    expect(changed).toEqual(['en']);
    expect(deBtn.attrs['aria-pressed']).toBe('false');
    expect(enBtn.attrs['aria-pressed']).toBe('true');
    expect(root.documentElement.lang).toBe('en');
    expect(textEl.textContent).toBe('Roll!');
    expect(phEl.placeholder).toBe('Your name');
    expect(ariaEl.aria).toBe('Close');
  } finally {
    setLang('de', { persist: false });
  }
});
