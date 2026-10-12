// Offscreen sprites, painted once and then only blitted in the game loop.

const TAU = Math.PI * 2;
const cache = new Map();
const memo = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// mulberry32: same seed, same bush
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// White-to-transparent radial blob; tinted copies for dust, glow and shadows.
export const softDot = (rgb = '255,255,255', core = 1, size = 64) => memo(`dot:${rgb}:${core}:${size}`, () => {
  const c = makeCanvas(size, size), g = c.getContext('2d'), r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, `rgba(${rgb},${core})`);
  grad.addColorStop(0.45, `rgba(${rgb},${core * 0.55})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
});

// Soft-edged shadow a wall throws onto the ground in front of it.
export const slab = () => memo('slab', () => {
  const c = makeCanvas(64, 32), g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 32);
  v.addColorStop(0, 'rgba(0,0,0,1)');
  v.addColorStop(0.3, 'rgba(0,0,0,0.45)');
  v.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = v;
  g.fillRect(0, 0, 64, 32);
  g.globalCompositeOperation = 'destination-in';
  const h = g.createLinearGradient(0, 0, 64, 0);
  h.addColorStop(0, 'rgba(0,0,0,0)');
  h.addColorStop(0.12, 'rgba(0,0,0,1)');
  h.addColorStop(0.88, 'rgba(0,0,0,1)');
  h.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = h;
  g.fillRect(0, 0, 64, 32);
  return c;
});

// The gabion photo split into the basket's top face and its front (darker toward the ground),
// plus a shaded copy for the sides.
const TOP_SHARE = 44 / 189;
export const gabionFaces = (tex) => memo(tex, () => {
  const th = Math.round(tex.height * TOP_SHARE), fh = tex.height - th;
  const top = makeCanvas(tex.width, th);
  top.getContext('2d').drawImage(tex, 0, 0, tex.width, th, 0, 0, tex.width, th);
  const front = makeCanvas(tex.width, fh), f = front.getContext('2d');
  f.drawImage(tex, 0, th, tex.width, fh, 0, 0, tex.width, fh);
  const ao = f.createLinearGradient(0, fh * 0.4, 0, fh);
  ao.addColorStop(0, 'rgba(0,0,0,0)');
  ao.addColorStop(1, 'rgba(0,0,0,0.5)');
  f.fillStyle = ao;
  f.fillRect(0, 0, tex.width, fh);
  const side = makeCanvas(tex.width, fh), g = side.getContext('2d');
  g.drawImage(front, 0, 0);
  g.fillStyle = 'rgba(12,10,8,0.45)';
  g.fillRect(0, 0, tex.width, fh);
  return { top, front, side, fh };
});

const FOLIAGE = {
  spring: [['#356e30', '#56963c', '#86c25a'], ['#3e7a34', '#62a443', '#9ccf68']],
  summer: [['#235422', '#367a2c', '#62a43e'], ['#2a5f22', '#428a30', '#78b44a']],
  autumn: [['#7a3214', '#be581c', '#e99c38'], ['#6a5216', '#a8861f', '#e2c440'], ['#6c1f12', '#a6361c', '#de643a']],
  winter: [['#4f5c5a', '#69787a', '#8a9a9c']],
};
const BLOSSOM = ['#ffc2d4', '#ffe4ee', '#ff9fbf'];
const SNOW = ['#b9c6d8', '#e6edf7', '#ffffff'];

// A dark silhouette of blobs, then many small leaf dabs that get lighter toward the sun (upper left).
function leaves(g, rnd, x, y, rx, ry, n, [dark, mid, light], size) {
  const spot = (k) => {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * k;
    return [x + Math.cos(a) * d * rx, y + Math.sin(a) * d * ry];
  };
  const blobs = Array.from({ length: n }, () => [...spot(1), size * (0.55 + rnd() * 0.55)]);
  g.fillStyle = dark;
  g.beginPath();
  for (const [bx, by, br] of blobs) {
    g.moveTo(bx + br, by);
    g.arc(bx, by, br, 0, TAU);
  }
  g.fill();
  const dabs = (color, count, r, sun) => {
    g.fillStyle = color;
    g.beginPath();
    for (let i = 0; i < count; i++) {
      const [bx, by] = spot(1.05);
      if ((bx - x) / rx + ((by - y) / ry) * 1.4 > sun) continue;
      const a = rnd() * Math.PI, rr = r * (0.6 + rnd() * 0.7);
      g.moveTo(bx + rr * Math.cos(a), by + rr * Math.sin(a));
      g.ellipse(bx, by, rr, rr * 0.62, a, 0, TAU);
    }
    g.fill();
  };
  dabs(mid, n * 7, size * 0.36, 1);
  dabs(light, n * 5, size * 0.24, -0.15);
  return blobs;
}

function dots(g, rnd, blobs, colors, r, share) {
  for (const [bx, by, br] of blobs) {
    if (rnd() > share) continue;
    g.fillStyle = colors[(rnd() * colors.length) | 0];
    g.beginPath();
    g.arc(bx + (rnd() - 0.5) * br, by + (rnd() - 0.7) * br, r * (0.6 + rnd() * 0.6), 0, TAU);
    g.fill();
  }
}

function groundShadow(g, x, y, rx, ry) {
  g.drawImage(softDot('20,30,10', 0.6), x - rx, y - ry, rx * 2, ry * 2);
}

const BUSH = { w: 192, h: 128 };
const TREE = { w: 288, h: 448 };

export const bushSprite = (season, variant) => memo(`bush:${season}:${variant}`, () => {
  const c = makeCanvas(BUSH.w, BUSH.h), g = c.getContext('2d');
  const rnd = seeded(variant * 97 + 5);
  const pal = FOLIAGE[season][variant % FOLIAGE[season].length];
  groundShadow(g, 96, 112, 92, 16);
  const blobs = leaves(g, rnd, 96, 80, 70, 32, 22, pal, 24);
  if (season === 'spring' && variant !== 1) dots(g, rnd, blobs, BLOSSOM, 4, 0.9);
  if (season === 'winter') leaves(g, rnd, 92, 64, 66, 16, 16, SNOW, 18);
  return c;
});

function branch(g, x, y, len, angle, width, depth, rnd, snow) {
  const x2 = x + Math.cos(angle) * len, y2 = y + Math.sin(angle) * len;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.stroke();
  if (snow && width > 2.5) {
    g.save();
    g.strokeStyle = '#f4f7fc';
    g.lineWidth = width * 0.5;
    g.beginPath();
    g.moveTo(x, y - width * 0.4);
    g.lineTo(x2, y2 - width * 0.4);
    g.stroke();
    g.restore();
  }
  if (depth <= 0) return;
  for (const turn of [-0.42, 0.38]) {
    branch(g, x2, y2, len * (0.7 + rnd() * 0.15), angle + turn + (rnd() - 0.5) * 0.5, width * 0.68, depth - 1, rnd, snow);
  }
}

function trunk(g, w, h, top) {
  const bark = g.createLinearGradient(w / 2 - 18, 0, w / 2 + 18, 0);
  bark.addColorStop(0, '#76604c');
  bark.addColorStop(1, '#33281f');
  g.fillStyle = bark;
  g.beginPath();
  g.moveTo(w / 2 - 19, h - 8);
  g.quadraticCurveTo(w / 2 - 8, h - 30, w / 2 - 8, top);
  g.lineTo(w / 2 + 8, top);
  g.quadraticCurveTo(w / 2 + 8, h - 30, w / 2 + 19, h - 8);
  g.fill();
}

export const treeSprite = (season, variant) => memo(`tree:${season}:${variant}`, () => {
  const { w, h } = TREE;
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const rnd = seeded(variant * 131 + 11);
  groundShadow(g, w / 2, h - 10, 80, 13);
  g.lineCap = 'round';
  g.strokeStyle = '#4a3a2e';
  if (season === 'winter') {
    trunk(g, w, h, h - 200);
    branch(g, w / 2, h - 190, 78, -Math.PI / 2, 12, 5, rnd, true);
    return c;
  }
  trunk(g, w, h, h - 250);
  branch(g, w / 2, h - 180, 70, -Math.PI / 2 - 0.55, 9, 1, rnd, false);
  branch(g, w / 2, h - 200, 70, -Math.PI / 2 + 0.6, 9, 1, rnd, false);
  const pal = FOLIAGE[season][(variant + 1) % FOLIAGE[season].length];
  const lobes = [[-50, 215, 62, 60], [48, 205, 64, 62], [0, 128, 92, 90]];
  for (const [dx, y, rx, ry] of lobes) {
    const blobs = leaves(g, rnd, w / 2 + dx, y, rx, ry, 26, pal, 28);
    if (season === 'spring' && variant === 0) dots(g, rnd, blobs, BLOSSOM, 6, 0.9);
  }
  return c;
});

// Hazy row of distant trees that hides the seam between photo and ground. Tiles sideways.
export const hedgeSprite = (season) => memo(`hedge:${season.id}`, () => {
  const W = 512, H = 72;
  const c = makeCanvas(W, H), g = c.getContext('2d');
  const rnd = seeded(77);
  const tone = (k) => `rgb(${season.fog.map((v) => Math.round(v * k)).join(',')})`;
  const blobs = Array.from({ length: 80 }, () => [rnd() * W, 32 + rnd() * 16, 6 + rnd() * 10]);
  const pass = (color, dx, dy, k) => {
    g.fillStyle = color;
    g.beginPath();
    for (const [x, y, r] of blobs) {
      for (const off of [-W, 0, W]) {
        g.moveTo(x + off + dx + r * k, y + dy);
        g.arc(x + off + dx, y + dy, r * k, 0, TAU);
      }
    }
    g.fill();
  };
  g.fillStyle = tone(0.74);
  g.fillRect(0, 42, W, H - 42);
  pass(tone(0.74), 0, 0, 1);
  pass(tone(0.8), -2, -3, 0.7);
  g.globalCompositeOperation = 'destination-out';
  const fade = g.createLinearGradient(0, 46, 0, H);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = fade;
  g.fillRect(0, 46, W, H - 46);
  return c;
});

export const BUSH_ASPECT = BUSH.h / BUSH.w;
export const TREE_ASPECT = TREE.h / TREE.w;

// Glossy bubble around a power-up emoji.
export const pickupSprite = (icon) => memo(`pickup:${icon}`, () => {
  const c = makeCanvas(128, 128), g = c.getContext('2d');
  const body = g.createRadialGradient(46, 40, 6, 64, 64, 56);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(0.6, '#fff4cf');
  body.addColorStop(1, '#ffd659');
  g.fillStyle = body;
  g.beginPath();
  g.arc(64, 64, 54, 0, TAU);
  g.fill();
  g.lineWidth = 7;
  g.strokeStyle = '#f2a713';
  g.stroke();
  g.lineWidth = 2;
  g.strokeStyle = 'rgba(90,50,0,0.55)';
  g.beginPath();
  g.arc(64, 64, 58, 0, TAU);
  g.stroke();
  g.font = '62px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(icon, 64, 68);
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.beginPath();
  g.ellipse(46, 34, 20, 10, -0.6, 0, TAU);
  g.fill();
  return c;
});

// Per-season light: warm sun, golden side light, cold haze; vignette on top.
const GRADE = {
  spring: { sun: [0.85, 0.05, '255,236,240', 0.22], tint: '255,240,245', tintA: 0.04, edge: '30,40,20' },
  summer: { sun: [0.9, 0.02, '255,226,150', 0.34], tint: '255,232,170', tintA: 0.05, edge: '40,30,10' },
  autumn: { sun: [0.05, 0.12, '255,190,110', 0.3], tint: '255,190,120', tintA: 0.07, edge: '40,20,5' },
  winter: { sun: [0.5, 0.0, '235,242,255', 0.25], tint: '200,215,255', tintA: 0.08, edge: '30,40,70' },
};

// Painted at device resolution so the game loop can blit it 1:1 without any scaling.
export function paintGrade(season, w, h) {
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const { sun: [sx, sy, sunRgb, sunA], tint, tintA, edge } = GRADE[season];
  g.fillStyle = `rgba(${tint},${tintA})`;
  g.fillRect(0, 0, w, h);
  const sun = g.createRadialGradient(sx * w, sy * h, 0, sx * w, sy * h, h * 0.6);
  sun.addColorStop(0, `rgba(${sunRgb},${sunA})`);
  sun.addColorStop(1, `rgba(${sunRgb},0)`);
  g.fillStyle = sun;
  g.fillRect(0, 0, w, h);
  const r = Math.hypot(w, h) / 2;
  const vig = g.createRadialGradient(w / 2, h * 0.55, r * 0.45, w / 2, h * 0.55, r * 1.05);
  vig.addColorStop(0, `rgba(${edge},0)`);
  vig.addColorStop(1, `rgba(${edge},0.5)`);
  g.fillStyle = vig;
  g.fillRect(0, 0, w, h);
  return c;
}
