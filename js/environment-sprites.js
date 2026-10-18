import { surfaceArt } from './surface-art.js';
import { SEASONS, WALL_H, WALL_D } from './config.js';
import { makeCanvas, softDot, seeded } from './sprites.js';

// Painted once: restrained colour blocks, angular foliage and readable wire.
const cache = new Map();
const memo = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };
const css = (rgb, a = 1) => `rgba(${rgb.join(',')},${a})`;
const seasonFor = (id) => SEASONS.find((s) => s.id === id);
const TAU = Math.PI * 2;
const forestImages = new Map();

export function installForestImage(id, image) {
  forestImages.set(id, image);
  for (const key of cache.keys()) if (key.startsWith(`forest:${id}:`)) cache.delete(key);
  cache.delete(`valley:${id}`);
  for (const kind of ['tree', 'bush']) for (const variant of [0, 1, 2]) forestSprite(id, kind, variant);
  valleySprite(seasonFor(id));
}

function leaf(g, x, y, rx, ry, angle, rnd) {
  g.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU, r = 0.78 + rnd() * 0.3;
    const u = Math.cos(a) * rx * r, v = Math.sin(a) * ry * r;
    g.lineTo(x + u * Math.cos(angle) - v * Math.sin(angle), y + u * Math.sin(angle) + v * Math.cos(angle));
  }
  g.closePath(); g.fill();
}

function crown(g, rnd, x, y, rx, ry, season, n = 110) {
  const pal = season.foliage;
  for (let layer = 0; layer < 3; layer++) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd());
      const u = Math.cos(a) * rx * r, v = Math.sin(a) * ry * r;
      if (layer > 0 && u / rx + v / ry > 0.65 - layer * 0.4) continue;
      g.fillStyle = pal[layer + (i % 7 === 0 ? 1 : 0)];
      const size = (layer ? 10 : 22) * (0.55 + rnd());
      leaf(g, x + u, y + v, size, size * 0.66, a, rnd);
    }
  }
  if (season.id === 'spring') {
    for (let i = 0; i < 22; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd());
      g.fillStyle = i % 3 ? '#f4c9cc' : '#fff0dc';
      leaf(g, x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r, 3.3, 3.3, a, rnd);
    }
  }
  if (season.id === 'winter') {
    for (let i = 0; i < 75; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd());
      const u = Math.cos(a) * rx * r, v = Math.sin(a) * ry * r;
      if (v > ry * 0.35) continue;
      g.fillStyle = i % 4 ? '#bed1e1' : '#eff4f2';
      leaf(g, x + u, y + v - 8, 13 + rnd() * 9, 5 + rnd() * 5, -0.1, rnd);
    }
  }
}

function branches(g, rnd, x, y, len, angle, width, depth) {
  const x2 = x + Math.cos(angle) * len, y2 = y + Math.sin(angle) * len;
  g.lineWidth = width;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
  if (!depth) return;
  for (const turn of [-0.43, 0.39]) branches(g, rnd, x2, y2, len * (0.68 + rnd() * 0.13), angle + turn, width * 0.61, depth - 1);
}

export const forestSprite = (id, kind, variant) => memo(`forest:${id}:${kind}:${variant}`, () => {
  const season = seasonFor(id), tree = kind === 'tree';
  const w = tree ? 360 : 288, h = tree ? 576 : 192;
  const image = makeCanvas(w, h), g = image.getContext('2d'), rnd = seeded(variant * 139 + 32);
  const painted = forestImages.get(id);
  g.drawImage(softDot(season.shadow.join(','), 0.6), 0, h - 26, w, 28);
  if (painted) {
    if (tree) {
      // Whole image, never cropped: a crop cut straight through the foliage and left hard vertical edges.
      // Variant 1 is mirrored for some variety.
      g.save();
      if (variant === 1) { g.translate(w, 0); g.scale(-1, 1); }
      g.drawImage(painted, 0, 0, w, h - 10);
      g.restore();
    } else {
      g.drawImage(painted, 0, painted.height * 0.75, painted.width, painted.height * 0.25, 0, 0, w, h - 6);
    }
  } else if (tree) {
    // Several overlapping crowns and shrubs form a cluster, rather than a lone tree.
    const lobes = [[130, 90, 110, 64], [235, 150, 101, 72], [93, 210, 88, 66], [187, 273, 106, 64]];
    for (const [x, y, rx, ry] of lobes) crown(g, rnd, x + variant * 3, y, rx, ry, season);
    g.lineCap = 'round'; g.strokeStyle = id === 'winter' ? '#344650' : '#4b3d2b';
    for (const x of [127, 186, 228]) branches(g, rnd, x, h - 26, 115, -Math.PI / 2 + (rnd() - 0.5) * 0.35, 13, 3);
    g.strokeStyle = css(season.rim, 0.3); g.lineWidth = 2;
    g.beginPath(); g.moveTo(126, h - 28); g.lineTo(126, 353); g.stroke();
    crown(g, rnd, 92, 498, 79, 41, season, 80);
    crown(g, rnd, 230, 479, 107, 55, season, 90);
  } else {
    crown(g, rnd, 98, 115, 79, 49, season, 100);
    crown(g, rnd, 196, 111, 72, 54, season, 90);
    // Little stalks and grass soften the straight foot of the roadside.
    g.strokeStyle = season.foliage[2]; g.lineWidth = 2;
    for (let i = 0; i < 35; i++) {
      const x = 15 + rnd() * (w - 30), y = h - 10;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 14, y - 8 - rnd() * 20); g.stroke();
    }
  }
  const mist = makeCanvas(w, h), m = mist.getContext('2d');
  m.drawImage(image, 0, 0); m.globalCompositeOperation = 'source-in';
  m.fillStyle = css(season.fog); m.fillRect(0, 0, w, h);
  return { image, mist, aspect: h / w, foot: 0.98, width: tree ? 8.6 : 3.8 };
});

function stoneFace(season, width, height, seed, shade = false) {
  const c = makeCanvas(width, height), g = c.getContext('2d'), rnd = seeded(seed);
  g.fillStyle = season.stones[0]; g.fillRect(0, 0, width, height);
  const painted = surfaceArt.gabion;
  if (painted) {
    g.drawImage(painted, 0, 0, shade ? width : painted.width, Math.min(height, painted.height), 0, 0, width, height);
    g.fillStyle = season.id === 'winter' ? css([139, 170, 191], 0.25) : css(season.rim, season.id === 'autumn' ? 0.07 : 0.03);
    g.fillRect(0, 0, width, height);
  }
  const cell = 32;
  if (!painted) for (let row = -1; row < Math.ceil(height / cell) + 1; row++) {
    for (let col = -1; col < Math.ceil(width / cell) + 1; col++) {
      const x = col * cell + (row % 2 ? 16 : 0), y = row * cell;
      g.fillStyle = season.stones[Math.floor(rnd() * season.stones.length)];
      leaf(g, x, y, 15 + rnd() * 5, 10 + rnd() * 7, rnd(), rnd);
      g.fillStyle = css(season.rim, 0.22);
      g.beginPath(); g.moveTo(x - 12, y - 5); g.lineTo(x + 2, y - 12); g.lineTo(x + 12, y - 7); g.lineTo(x, y - 5); g.fill();
    }
  }
  const ao = g.createLinearGradient(0, 0, 0, height);
  ao.addColorStop(0, css(season.shadow, shade ? 0.27 : 0));
  ao.addColorStop(1, css(season.shadow, shade ? 0.43 : 0.23));
  g.fillStyle = ao; g.fillRect(0, 0, width, height);
  // Heavier cage uprights and a fine, clean lattice over the large stone shapes.
  if (!painted) for (const [color, lineWidth, offset] of [['#263538', 2.6, 0], [css(season.rim, 0.45), 0.8, -1.2]]) {
    g.strokeStyle = color; g.lineWidth = lineWidth; g.beginPath();
    for (let x = 0; x <= width; x += 24) { g.moveTo(x + offset, 0); g.lineTo(x + offset, height); }
    for (let y = 0; y <= height; y += 24) { g.moveTo(0, y + offset); g.lineTo(width, y + offset); }
    g.stroke();
  }
  g.fillStyle = '#2d3634';
  if (!painted) for (let x = 0; x < width; x += 96) g.fillRect(x, 0, 4, height);
  if (season.id === 'spring' && !shade) {
    for (let x = 37; x < width; x += 109) {
      g.strokeStyle = '#5a743e'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x - 18, 15, x + 18, 29, x - 8, 56); g.stroke();
      for (let y = 8; y < 58; y += 11) {
        g.fillStyle = '#83975a'; leaf(g, x + (y % 2 ? -7 : 5), y, 7, 4, y, rnd);
        if (y % 3 === 0) { g.fillStyle = '#f9d7da'; leaf(g, x, y, 3, 3, 0, rnd); }
      }
    }
  }
  if (season.id === 'autumn' && !shade) {
    for (let i = 0; i < width / 12; i++) {
      g.fillStyle = i % 2 ? '#c2822d' : '#e0ac49';
      leaf(g, rnd() * width, rnd() * 12, 4, 2.5, rnd() * TAU, rnd);
    }
  }
  return c;
}

export const gabionFaces = (season) => memo(`gabion:${season.id}`, () => {
  const tileW = 5.2, density = 512 / tileW;
  const fh = Math.round(WALL_H * density), dh = Math.round(WALL_D * density);
  return { front: stoneFace(season, 512, fh, 61), top: stoneFace(season, 512, dh, 62),
    side: stoneFace(season, dh, fh, 63, true), fh, tileW };
});

// A low woodland layer beyond the playable hill, so the falling road ends in a
// wooded valley rather than an empty band between horizon and distant obstacles.
export const valleySprite = (season) => memo(`valley:${season.id}`, () => {
  const c = makeCanvas(768, 144), g = c.getContext('2d'), rnd = seeded(159);
  for (let x = -45; x < 768; x += 52) {
    const sprite = forestSprite(season.id, 'tree', Math.floor(rnd() * 3));
    const h = 99 + rnd() * 50, w = h / sprite.aspect;
    g.drawImage(sprite.image, x, 151 - h, w, h);
  }
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = css(season.fog, 0.67); g.fillRect(0, 0, 768, 144);
  g.globalCompositeOperation = 'destination-in';
  const fade = g.createLinearGradient(0, 0, 0, 144);
  fade.addColorStop(0, '#fff'); fade.addColorStop(0.66, '#fff'); fade.addColorStop(1, 'transparent');
  g.fillStyle = fade; g.fillRect(0, 0, 768, 144);
  return c;
});

export const horizonVeil = (season) => memo(`veil:${season.id}`, () => {
  const c = makeCanvas(16, 96), g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 96);
  v.addColorStop(0, css(season.fog, 0)); v.addColorStop(0.45, css(season.fog, 0.7)); v.addColorStop(1, css(season.fog, 0));
  g.fillStyle = v; g.fillRect(0, 0, 16, 96); return c;
});

export const groundLight = (season) => memo(`ground-light:${season.id}`, () => {
  const c = makeCanvas(256, 192), g = c.getContext('2d');
  const light = g.createLinearGradient(0, 0, 256, 0);
  light.addColorStop(0, css(season.shadow, 0.32));
  light.addColorStop(0.32, css(season.rim, 0.04));
  light.addColorStop(0.52, css(season.rim, 0.12));
  light.addColorStop(0.8, css(season.shadow, 0.1));
  light.addColorStop(1, css(season.shadow, 0.39));
  g.fillStyle = light; g.fillRect(0, 0, 256, 192); return c;
});
