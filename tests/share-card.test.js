import { expect, test } from 'bun:test';
import { bindInput } from '../js/input.js';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  SHARE_TEXT,
  SHARE_URL,
  buildShareCardModel,
  renderShareCard,
  setupShareCard,
  shareCard,
} from '../js/share-card.js';

function makeMockCanvas() {
  const texts = [];
  const images = [];
  const gradient = { addColorStop() {} };
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    fillRect() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    ellipse() {},
    roundRect() {},
    fill() {},
    stroke() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    measureText: (str) => ({ width: String(str).length * 14 }),
    fillText: (str, x, y) => { texts.push({ str: String(str), x, y }); },
    drawImage: (...args) => { images.push(args); },
  };
  return {
    width: 0,
    height: 0,
    texts,
    images,
    getContext: () => ctx,
    toBlob: (cb) => cb(new Blob(['png-bytes'], { type: 'image/png' })),
  };
}

test('buildShareCardModel formats wall count, figure, season, theme, URL and record state', () => {
  const normal = buildShareCardModel({
    passed: 24,
    best: 30,
    worldBest: 50,
    season: 'autumn',
    themeId: 'berlin-tour',
    figureId: 'tine',
  });
  expect(normal.score).toBe(24);
  expect(normal.scoreText).toBe('24');
  expect(normal.unitLabel).toBe('Mauern');
  expect(normal.record).toBe(false);
  expect(normal.recordBadge).toBe('');
  expect(normal.figure.id).toBe('tine');
  expect(normal.figure.name).toBe('Tine');
  expect(normal.season.id).toBe('autumn');
  expect(normal.season.name).toBe('Herbst');
  expect(normal.theme.id).toBe('berlin-tour');
  expect(normal.theme.label).toBe('Berlin-Tour');
  expect(normal.chipText).toContain('Herbst');
  expect(normal.chipText).toContain('Berlin-Tour');
  expect(normal.url).toBe('https://svengoerdes.github.io/roll-down-volkspark/');
  expect(normal.fileName).toBe('roll-down-volkspark-24-mauern.png');
  expect(normal.shareText).not.toContain('Neuer Rekord!');

  const record = buildShareCardModel({
    passed: 31,
    best: 30,
    worldBest: 50,
    season: 'winter',
    themeId: 'volkspark',
    figureId: 'alaska',
  });
  expect(record.record).toBe(true);
  expect(record.recordBadge).toBe('Neuer Rekord!');
  expect(record.shareText).toContain('Neuer Rekord!');
  expect(record.shareText).toContain('Alaska');
});

test('buildShareCardModel handles singular wall and sanitizes invalid inputs', () => {
  const single = buildShareCardModel({
    passed: 1,
    best: 0,
    season: 'unknown',
    themeId: 'invalid',
    figureId: 'nobody',
  });
  expect(single.score).toBe(1);
  expect(single.unitLabel).toBe('Mauer');
  expect(single.figure.id).toBe('kalle');
  expect(single.theme.id).toBe('volkspark');
  expect(single.season.id).toBe('spring');
});

test('renderShareCard paints 1080x1350 card with score, figure, horizon, game name, URL and optional record badge', () => {
  const bg = { width: 768, height: 618 };
  const gabion = { width: 512, height: 163 };
  const figImg = { width: 1860, height: 1840 };
  const figure = { intro: { img: figImg, w: 310, h: 368, cols: 6, ax: 225, ay: 260 } };

  const normalCanvas = makeMockCanvas();
  const normalModel = buildShareCardModel({ passed: 18, best: 25, season: 'spring', figureId: 'kalle' });
  renderShareCard(normalModel, { canvas: normalCanvas, background: bg, figure, gabion });

  expect(normalCanvas.width).toBe(CARD_WIDTH);
  expect(normalCanvas.height).toBe(CARD_HEIGHT);
  const normalStrings = normalCanvas.texts.map((t) => t.str);
  expect(normalStrings).toContain('18');
  expect(normalStrings).toContain('Mauern');
  expect(normalStrings).toContain(SHARE_TEXT.titleTop);
  expect(normalStrings).toContain(SHARE_TEXT.titleAccent);
  expect(normalStrings).toContain(SHARE_TEXT.title);
  expect(normalStrings).toContain(SHARE_URL);
  expect(normalStrings).not.toContain('Neuer Rekord!');
  expect(normalCanvas.images.some((args) => args[0] === bg)).toBe(true);
  expect(normalCanvas.images.some((args) => args[0] === figImg)).toBe(true);

  const recordCanvas = makeMockCanvas();
  const recordModel = buildShareCardModel({ passed: 42, best: 25, season: 'winter', figureId: 'alaska' });
  renderShareCard(recordModel, { canvas: recordCanvas });
  const recordStrings = recordCanvas.texts.map((t) => t.str);
  expect(recordStrings).toContain('42');
  expect(recordStrings).toContain('Neuer Rekord!');
});

test('shareCard shares file when navigator.canShare({ files }) is true, else text+URL, else downloads PNG', async () => {
  const canvas = makeMockCanvas();
  const model = buildShareCardModel({ passed: 33, best: 20, season: 'summer', figureId: 'kalle' });

  const sharedCalls = [];
  const fileRes = await shareCard(model, canvas, {
    navigator: {
      canShare: ({ files }) => Array.isArray(files) && files.length === 1,
      share: async (payload) => { sharedCalls.push(payload); },
    },
  });
  expect(fileRes).toBe('file');
  expect(sharedCalls).toHaveLength(1);
  expect(sharedCalls[0].files).toHaveLength(1);
  expect(sharedCalls[0].files[0].name).toBe('roll-down-volkspark-33-mauern.png');
  expect(sharedCalls[0].url).toBe(SHARE_URL);

  const textCalls = [];
  const textRes = await shareCard(model, canvas, {
    navigator: {
      canShare: () => false,
      share: async (payload) => { textCalls.push(payload); },
    },
  });
  expect(textRes).toBe('text');
  expect(textCalls).toEqual([{
    title: model.title,
    text: model.shareText,
    url: SHARE_URL,
  }]);

  let clicked = 0;
  let downloadAttr = '';
  const dlRes = await shareCard(model, canvas, {
    navigator: {},
    URL: { createObjectURL: () => 'blob:card', revokeObjectURL() {} },
    document: {
      body: { appendChild() {} },
      createElement: () => ({
        set download(v) { downloadAttr = v; },
        get download() { return downloadAttr; },
        click() { clicked++; },
        remove() {},
      }),
    },
  });
  expect(dlRes).toBe('download');
  expect(clicked).toBe(1);
  expect(downloadAttr).toBe('roll-down-volkspark-33-mauern.png');
});

test('shareCard handles user abort and errors silently without throwing', async () => {
  const canvas = makeMockCanvas();
  const model = buildShareCardModel({ passed: 12, best: 20 });

  const abortErr = new Error('User cancelled');
  abortErr.name = 'AbortError';
  const aborted = await shareCard(model, canvas, {
    navigator: {
      canShare: () => true,
      share: async () => { throw abortErr; },
    },
  });
  expect(aborted).toBe('aborted');

  const failed = await shareCard(model, canvas, {
    navigator: {
      canShare: () => false,
      share: async () => { throw new Error('Share failed'); },
    },
    document: {},
    URL: {},
  });
  expect(failed).toBeNull();

  let fallbackClicked = 0;
  const fallback = await shareCard(model, canvas, {
    navigator: {
      canShare: () => false,
      share: async () => { throw new Error('Desktop share unsupported'); },
    },
    URL: { createObjectURL: () => 'blob:card', revokeObjectURL() {} },
    document: {
      body: { appendChild() {} },
      createElement: () => ({ click() { fallbackClicked++; }, remove() {} }),
    },
  });
  expect(fallback).toBe('download');
  expect(fallbackClicked).toBe(1);
});

test('setupShareCard renders only on tap in game-over state and does not trigger next round', async () => {
  let clickHandler;
  let rendered = 0;
  let stopCalled = 0;
  let blurred = 0;
  let state = 'playing';
  const button = {
    disabled: false,
    addEventListener: (type, fn) => { if (type === 'click') clickHandler = fn; },
  };
  setupShareCard(
    () => ({ state, passed: 19, best: 10, season: 'spring', themeId: 'volkspark', figureId: 'kalle' }),
    {
      button,
      document: { activeElement: { blur: () => { blurred++; } } },
      makeCanvas: () => { rendered++; return makeMockCanvas(); },
      navigator: { canShare: () => false, share: async () => {} },
    },
  );

  // While playing, a tap does not render anything
  await clickHandler({ stopPropagation: () => { stopCalled++; } });
  expect(rendered).toBe(0);

  // In game-over state, tapping renders once and shares
  state = 'over';
  const result = await clickHandler({ stopPropagation: () => { stopCalled++; } });
  expect(result).toBe('text');
  expect(rendered).toBe(1);
  expect(stopCalled).toBe(2);
  expect(blurred).toBe(2);

  // Verify input.js ignores pointerdown and keydown on #over button (#share-run)
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const events = {};
  let started = 0;
  try {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { addEventListener: (name, fn) => { events[name] = fn; } },
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { addEventListener() {} },
    });
    bindInput({
      input: { dragging: false, lastX: 0, keys: new Set() },
      hud: { over: { dataset: { ready: '1' } }, changeFigure: { addEventListener() {} } },
      getState: () => 'over',
      getGame: () => ({}),
      getView: () => ({ F: 1 }),
      choose() {},
      start: () => { started++; },
      newGame: () => ({}),
      setGame() {},
      getBoard: () => ({ offer() {} }),
      readBest: () => 0,
      setState() {},
      beginPlay() {},
      resize() {},
      setLast() {},
    });
    const shareButtonTarget = { closest: (sel) => sel.includes('#over button') };
    events.pointerdown({ target: shareButtonTarget, clientX: 100 });
    events.keydown({ target: shareButtonTarget, key: 'Enter' });
    expect(started).toBe(0);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
  }
});
