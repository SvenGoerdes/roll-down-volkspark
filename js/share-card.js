import { SEASONS } from './config.js';
import { DEFAULT_FIGURE, FIGURES, pickFigure } from './figure.js';
import { overNote } from './scoring.js';
import { seeded } from './sprites.js';
import { THEMES, validateThemeId } from './theme-select.js';

export const SHARE_URL = 'https://svengoerdes.github.io/roll-down-volkspark/';
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

// Bundled UI and card strings so translations (#70) only touch one place.
export const SHARE_TEXT = {
  title: 'Roll Down Volkspark',
  titleTop: 'Roll Down',
  titleAccent: 'Volkspark',
  button: 'Teilen',
  record: 'Neuer Rekord!',
  walls: 'Mauern',
  wallSingular: 'Mauer',
};

const rgb = ([r, g, b], a = 1) => (a < 1 ? `rgba(${r | 0},${g | 0},${b | 0},${a})` : `rgb(${r | 0},${g | 0},${b | 0})`);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function resolveSeason(season) {
  if (season && typeof season === 'object' && season.id) return SEASONS.find((s) => s.id === season.id) || season;
  if (typeof season === 'string') return SEASONS.find((s) => s.id === season || s.name === season) || SEASONS[0];
  return SEASONS[0];
}

export function buildShareCardModel({
  passed = 0, best = 0, worldBest = null, record, season, themeId = 'volkspark', figureId = DEFAULT_FIGURE,
} = {}) {
  const score = Math.max(0, Math.floor(Number(passed) || 0));
  const isRecord = typeof record === 'boolean' ? record : Boolean(overNote(score, best, worldBest).record);
  const seasonObj = resolveSeason(season);
  const themeObj = THEMES.find((t) => t.id === validateThemeId(themeId)) || THEMES[0];
  const figureObj = FIGURES.find((f) => f.id === pickFigure(figureId)) || FIGURES[0];
  const unitLabel = score === 1 ? SHARE_TEXT.wallSingular : SHARE_TEXT.walls;
  const scoreText = String(score);
  const recordBadge = isRecord ? SHARE_TEXT.record : '';
  const chipText = `${seasonObj.icon} ${seasonObj.name} · ${themeObj.label}`;
  const figureLabel = `${figureObj.name} · ${figureObj.tag}`;
  const fileName = `roll-down-volkspark-${score}-mauern.png`;
  const baseText = `${score} ${unitLabel} mit ${figureObj.name} (${seasonObj.name}, ${themeObj.label}) in ${SHARE_TEXT.title}!`;
  const shareText = isRecord ? `${SHARE_TEXT.record} ${baseText}` : baseText;
  return {
    score, scoreText, unitLabel, record: isRecord, recordBadge,
    season: seasonObj, theme: themeObj, figure: figureObj,
    chipText, figureLabel, title: SHARE_TEXT.title,
    titleTop: SHARE_TEXT.titleTop, titleAccent: SHARE_TEXT.titleAccent,
    url: SHARE_URL, fileName, shareText,
  };
}

function drawPill(ctx, x, y, w, h, fill, stroke, lineWidth = 2) {
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function drawGabionWing(ctx, x, y, w, h, season, gabion, innerEdgeX) {
  const snowy = season.id === 'winter';
  ctx.fillStyle = rgb(season.shadow, 0.42);
  ctx.fillRect(x - 8, y + h - 4, w + 16, 26);
  ctx.fillStyle = snowy ? '#e4edf4' : season.stones[2];
  ctx.fillRect(x, y - 16, w, 18);
  ctx.fillStyle = season.stones[0];
  ctx.fillRect(x, y, w, h);
  if (gabion) {
    ctx.drawImage(gabion, 0, 0, gabion.width || 512, gabion.height || 160, x, y, w, h);
  } else {
    const rnd = seeded((x + 97) | 0), cell = 34;
    for (let row = 0; row < Math.ceil(h / cell); row++) {
      for (let col = 0; col < Math.ceil(w / cell); col++) {
        ctx.fillStyle = season.stones[Math.floor(rnd() * season.stones.length)];
        ctx.beginPath();
        ctx.ellipse(x + col * cell + (row % 2 ? 14 : 6), y + row * cell + 16, 16, 11, (rnd() - 0.5) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = '#263538';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let gx = x; gx <= x + w; gx += 28) { ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); }
    for (let gy = y; gy <= y + h; gy += 28) { ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); }
    ctx.stroke();
  }
  ctx.fillStyle = rgb(season.rim, 0.65);
  ctx.fillRect(x, y, w, 4);
  const postW = 16, postX = innerEdgeX < CARD_WIDTH / 2 ? innerEdgeX - postW : innerEdgeX;
  ctx.fillStyle = '#293a3c';
  ctx.fillRect(postX, y - 4, postW, h + 4);
  ctx.fillStyle = rgb(season.rim, 0.75);
  ctx.fillRect(postX, y - 4, 5, h + 4);
  if (snowy) {
    ctx.fillStyle = '#eff5f7';
    ctx.beginPath();
    ctx.roundRect(x, y - 12, w, 22, 10);
    ctx.fill();
  }
}

function drawFigureSprite(ctx, figure, figureId, cx, footY) {
  const sheet = figure?.select?.img ? figure.select
    : figure?.intro?.img ? figure.intro
    : figure?.roll?.img ? figure.roll
    : figure?.dazed?.img ? figure.dazed : null;
  if (!sheet?.img) return false;
  const isCat = figureId === 'alaska';
  const targetH = isCat ? 460 : 390, footRatio = isCat ? 0.9 : 0.96;
  const scale = targetH / sheet.h, drawW = sheet.w * scale, drawH = sheet.h * scale;
  const centerBias = sheet === figure?.intro && typeof sheet.ax === 'number'
    ? (sheet.w * 0.5 + sheet.ax) * 0.5 : sheet.w * 0.5;
  ctx.drawImage(sheet.img, 0, 0, sheet.w, sheet.h, cx - centerBias * scale, footY - drawH * footRatio, drawW, drawH);
  return true;
}

// Paints the 1080×1350 share card once on demand (never in the frame loop).
export function renderShareCard(model, { canvas, background, figure, gabion, makeCanvas } = {}) {
  const W = CARD_WIDTH, H = CARD_HEIGHT;
  const c = canvas || (makeCanvas ? makeCanvas(W, H) : document.createElement('canvas'));
  c.width = W; c.height = H;
  const ctx = c.getContext('2d'), { season } = model;

  // 1. Sky and painted seasonal horizon
  const horizonH = Math.round((W * 618) / 768);
  const sky = ctx.createLinearGradient(0, 0, 0, horizonH);
  sky.addColorStop(0, rgb(season.sky));
  sky.addColorStop(1, rgb(season.fog));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  if (background) ctx.drawImage(background, 0, 0, W, horizonH);

  const sun = ctx.createRadialGradient(W * 0.2, H * 0.11, 0, W * 0.2, H * 0.11, W * 0.62);
  sun.addColorStop(0, rgb(season.rim, 0.28));
  sun.addColorStop(1, rgb(season.rim, 0));
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, horizonH);

  // 2. Hillside transition and descending park path
  const hillTop = 695;
  const lawn = ctx.createLinearGradient(0, hillTop, 0, H);
  lawn.addColorStop(0, rgb(mix(season.grass, season.fog, 0.38), 0));
  lawn.addColorStop(0.2, rgb(mix(season.grass, season.fog, 0.32), 0.92));
  lawn.addColorStop(0.55, rgb(mix(season.grass, season.shadow, 0.24)));
  lawn.addColorStop(1, rgb(mix(season.grass, season.shadow, 0.64)));
  ctx.fillStyle = lawn;
  ctx.fillRect(0, hillTop, W, H - hillTop);

  ctx.beginPath();
  ctx.moveTo(375, hillTop - 10);
  ctx.lineTo(705, hillTop - 10);
  ctx.quadraticCurveTo(840, 1015, 995, H);
  ctx.lineTo(85, H);
  ctx.quadraticCurveTo(240, 1015, 375, hillTop - 10);
  ctx.closePath();
  const road = ctx.createLinearGradient(0, hillTop - 10, 0, H);
  road.addColorStop(0, rgb(season.fog, 0));
  road.addColorStop(0.14, rgb(mix(season.path, season.fog, 0.35), 0.92));
  road.addColorStop(0.52, rgb(season.path));
  road.addColorStop(1, rgb(mix(season.path, season.shadow, 0.38)));
  ctx.fillStyle = road;
  ctx.fill();

  const rnd = seeded(season.id.charCodeAt(0) * 37 + model.score);
  drawGabionWing(ctx, -10, 735, 315, 165, season, gabion, 305);
  drawGabionWing(ctx, 775, 735, 315, 165, season, gabion, 775);

  for (let i = 0; i < 18; i++) {
    const px = 70 + rnd() * (W - 140), py = 90 + rnd() * (H - 260), pr = 5 + rnd() * 7;
    ctx.fillStyle = season.particle.colors[i % season.particle.colors.length];
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(px, py, pr, pr * (season.id === 'winter' ? 0.9 : 0.6), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 3. Readability scrims at top, score center, and bottom
  const topScrim = ctx.createLinearGradient(0, 0, 0, 340);
  topScrim.addColorStop(0, 'rgba(14, 22, 14, 0.65)');
  topScrim.addColorStop(1, 'rgba(14, 22, 14, 0)');
  ctx.fillStyle = topScrim;
  ctx.fillRect(0, 0, W, 340);

  const scoreY = model.record ? 500 : 480;
  const scoreHalo = ctx.createRadialGradient(W / 2, scoreY + 35, 30, W / 2, scoreY + 35, 270);
  scoreHalo.addColorStop(0, 'rgba(18, 26, 16, 0.52)');
  scoreHalo.addColorStop(1, 'rgba(18, 26, 16, 0)');
  ctx.fillStyle = scoreHalo;
  ctx.fillRect(W / 2 - 280, scoreY - 220, 560, 510);

  const bottomScrim = ctx.createLinearGradient(0, 820, 0, H);
  bottomScrim.addColorStop(0, 'rgba(14, 22, 14, 0)');
  bottomScrim.addColorStop(0.45, 'rgba(14, 22, 14, 0.56)');
  bottomScrim.addColorStop(1, 'rgba(14, 22, 14, 0.88)');
  ctx.fillStyle = bottomScrim;
  ctx.fillRect(0, 820, W, H - 820);

  // 4. Figure standing in the wall gap
  const figCenterX = W / 2, figFootY = 1090;
  const glow = ctx.createRadialGradient(figCenterX, figFootY - 180, 20, figCenterX, figFootY - 180, 230);
  glow.addColorStop(0, rgb(season.rim, 0.34));
  glow.addColorStop(1, rgb(season.rim, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(figCenterX - 240, figFootY - 410, 480, 430);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(figCenterX, figFootY - 8, 125, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFigureSprite(ctx, figure, model.figure.id, figCenterX, figFootY);

  // 5. Typography: game title, season/theme chip, record badge, wall count, figure & URL
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.save();
  ctx.translate(W / 2, 126);
  ctx.rotate(-0.045);
  ctx.font = '900 66px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillText(model.titleTop, 0, -30);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(model.titleTop, 0, -35);
  ctx.font = '900 80px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#b07800';
  ctx.fillText(model.titleAccent, 0, 46);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(model.titleAccent, 0, 40);
  ctx.restore();

  ctx.font = '700 30px system-ui, -apple-system, "Segoe UI", sans-serif';
  const chipW = Math.max(340, ctx.measureText(model.chipText).width + 68);
  drawPill(ctx, W / 2, 258, chipW, 58, 'rgba(20, 28, 18, 0.78)', 'rgba(255, 255, 255, 0.25)', 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(model.chipText, W / 2, 259);

  if (model.record) {
    ctx.font = '900 34px system-ui, -apple-system, "Segoe UI", sans-serif';
    const recW = Math.max(320, ctx.measureText(model.recordBadge).width + 76);
    drawPill(ctx, W / 2, 344, recW, 62, '#ffd23f', '#ffffff', 3);
    ctx.fillStyle = '#1c2a1a';
    ctx.fillText(model.recordBadge, W / 2, 345);
  }

  ctx.font = '900 212px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
  ctx.fillText(model.scoreText, W / 2, scoreY + 12);
  ctx.fillStyle = '#b07800';
  ctx.fillText(model.scoreText, W / 2, scoreY + 7);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(model.scoreText, W / 2, scoreY);

  const unitY = scoreY + 125;
  ctx.font = '800 46px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.fillText(model.unitLabel, W / 2, unitY + 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(model.unitLabel, W / 2, unitY);

  ctx.font = '800 36px system-ui, -apple-system, "Segoe UI", sans-serif';
  const figW = Math.max(320, ctx.measureText(model.figureLabel).width + 64);
  drawPill(ctx, W / 2, 1156, figW, 60, 'rgba(20, 28, 18, 0.82)', 'rgba(255, 210, 63, 0.45)', 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(model.figureLabel, W / 2, 1157);

  ctx.font = '700 28px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(model.title, W / 2, 1234);

  ctx.font = '600 24px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
  ctx.fillText(model.url, W / 2, 1274);

  ctx.beginPath();
  ctx.roundRect(26, 26, W - 52, H - 52, 34);
  ctx.strokeStyle = model.record ? 'rgba(255, 210, 63, 0.55)' : 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = model.record ? 4 : 2.5;
  ctx.stroke();

  return c;
}

export function canvasToBlob(canvas, type = 'image/png') {
  if (typeof canvas?.convertToBlob === 'function') return canvas.convertToBlob({ type });
  return new Promise((resolve, reject) => {
    if (typeof canvas?.toBlob !== 'function') { reject(new Error('Canvas-Export nicht verfügbar')); return; }
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Kein Kartenbild erzeugt'))), type);
  });
}

function downloadBlob(blob, fileName, env = {}) {
  const doc = env.document ?? globalThis.document, urlApi = env.URL ?? globalThis.URL;
  if (!doc?.createElement || !urlApi?.createObjectURL) return false;
  const href = urlApi.createObjectURL(blob), link = doc.createElement('a');
  link.href = href; link.download = fileName; link.rel = 'noopener';
  doc.body?.appendChild?.(link); link.click?.(); link.remove?.();
  setTimeout(() => urlApi.revokeObjectURL?.(href), 1000);
  return true;
}

// Shares the rendered card via Web Share API (file -> text+URL) or downloads the PNG.
// Errors and user cancellations (AbortError) are handled silently.
export async function shareCard(model, canvas, env = {}) {
  const nav = env.navigator ?? globalThis.navigator, FileCtor = env.File ?? globalThis.File;
  try {
    const blob = await canvasToBlob(canvas);
    if (typeof nav?.share === 'function') {
      if (typeof FileCtor === 'function' && typeof nav.canShare === 'function') {
        const file = new FileCtor([blob], model.fileName, { type: 'image/png' });
        let canShareFiles = false;
        try { canShareFiles = Boolean(nav.canShare({ files: [file] })); } catch { canShareFiles = false; }
        if (canShareFiles) {
          try {
            await nav.share({ files: [file], title: model.title, text: model.shareText, url: model.url });
            return 'file';
          } catch (err) {
            if (err?.name === 'AbortError') return 'aborted';
          }
        }
      }
      try {
        await nav.share({ title: model.title, text: model.shareText, url: model.url });
        return 'text';
      } catch (err) {
        if (err?.name === 'AbortError') return 'aborted';
      }
    }
    return downloadBlob(blob, model.fileName, env) ? 'download' : null;
  } catch (err) {
    if (err?.name === 'AbortError') return 'aborted';
    return null;
  }
}

export function setupShareCard(getContext, env = {}) {
  const doc = env.document ?? globalThis.document;
  const button = env.button ?? doc?.getElementById?.('share-run');
  if (!button) return { trigger: async () => null };
  let busy = false;
  async function trigger(event) {
    event?.stopPropagation?.();
    doc?.activeElement?.blur?.();
    if (busy) return null;
    const data = getContext?.();
    if (!data || (data.state && data.state !== 'over')) return null;
    busy = true; button.disabled = true;
    try {
      const model = buildShareCardModel(data);
      const canvas = renderShareCard(model, {
        background: data.background, figure: data.figure, gabion: data.gabion, makeCanvas: env.makeCanvas,
      });
      return await shareCard(model, canvas, env);
    } catch {
      return null;
    } finally {
      busy = false; button.disabled = false;
    }
  }
  button.addEventListener('click', trigger);
  return { trigger };
}
