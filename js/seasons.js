import { installForestImage } from './environment-sprites.js';
import { loadSurfaceArt } from './surface-art.js';

// Ready-made painted horizons. Pixel work and the fog blend happen once at load.
const css = (c, alpha = 1) => `rgba(${c.join(',')},${alpha})`;

function backdrop(season, image) {
  const c = document.createElement('canvas');
  c.width = 768; c.height = 618;
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, c.height);
  sky.addColorStop(0, css(season.sky));
  sky.addColorStop(1, css(season.fog));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, c.width, c.height);
  if (image) ctx.drawImage(image, 0, 0, c.width, c.height);
  const mist = ctx.createLinearGradient(0, c.height * 0.76, 0, c.height);
  mist.addColorStop(0, css(season.fog, 0));
  mist.addColorStop(0.7, css(season.fog, 0.48));
  mist.addColorStop(1, css(season.fog));
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

// First season blocks startup; the other small WebPs load in idle time. Their
// matching sky/fog fallback remains usable if an image fails or isn't ready yet.
export async function loadSeasonBackgrounds(seasons, loadImage, first = 0) {
  const backgrounds = Object.fromEntries(seasons.map((s) => [s.id, backdrop(s)]));
  const load = async (s) => {
    await Promise.all([
      loadImage(`assets/environment/${s.id}-horizon.webp`).then((image) => { backgrounds[s.id] = backdrop(s, image); }),
      loadImage(`assets/environment/${s.id}-forest.webp`).then((image) => installForestImage(s.id, image)),
    ].map((job) => job.catch((err) => console.warn('Jahreszeitenbild nicht verfügbar', s.id, err))));
  };
  await Promise.all([load(seasons[first]), loadSurfaceArt(loadImage)]);
  const remaining = seasons.filter((_, i) => i !== first);
  const schedule = (fn) => window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 800 }) : setTimeout(fn, 30);
  const next = async () => {
    const s = remaining.shift();
    if (!s) return;
    await load(s);
    schedule(next);
  };
  schedule(next);
  return backgrounds;
}
