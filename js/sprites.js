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
export function seeded(seed) {
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

// White symbol per power-up, drawn as shapes so it reads at any size.
const GLYPHS = {
  helmet(g, color) {
    g.beginPath();
    g.arc(64, 74, 32, Math.PI, 0);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.roundRect(24, 72, 80, 11, 5);
    g.fill();
    g.stroke();
    g.fillStyle = color;
    g.fillRect(59, 47, 10, 22);
    g.fillRect(53, 53, 22, 10);
  },
  slowmo(g, color) {
    g.beginPath();
    g.moveTo(40, 34); g.lineTo(88, 34); g.lineTo(64, 64);
    g.lineTo(88, 94); g.lineTo(40, 94); g.lineTo(64, 64);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(64, 72); g.lineTo(80, 90); g.lineTo(48, 90);
    g.closePath();
    g.fill();
    g.fillStyle = '#fff';
    g.fillRect(34, 28, 60, 8);
    g.fillRect(34, 92, 60, 8);
  },
  widen(g) {
    g.beginPath();
    g.moveTo(22, 64); g.lineTo(46, 40); g.lineTo(46, 55); g.lineTo(82, 55); g.lineTo(82, 40);
    g.lineTo(106, 64); g.lineTo(82, 88); g.lineTo(82, 73); g.lineTo(46, 73); g.lineTo(46, 88);
    g.closePath();
    g.fill();
    g.stroke();
  },
};

// Glossy colored bubble around a power-up symbol.
export const pickupSprite = (type, color) => memo(`pickup:${type}`, () => {
  const c = makeCanvas(128, 128), g = c.getContext('2d');
  const body = g.createRadialGradient(46, 40, 6, 64, 64, 56);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(0.35, color);
  body.addColorStop(1, color);
  g.fillStyle = body;
  g.beginPath();
  g.arc(64, 64, 54, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.beginPath();
  g.arc(64, 64, 54, 0.15 * Math.PI, 0.85 * Math.PI);
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = '#fff';
  g.beginPath();
  g.arc(64, 64, 55, 0, TAU);
  g.stroke();
  g.fillStyle = '#fff';
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 3;
  g.lineJoin = 'round';
  GLYPHS[type](g, color);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.beginPath();
  g.ellipse(44, 32, 18, 8, -0.6, 0, TAU);
  g.fill();
  return c;
});

// Per-season light: warm sun, golden side light, cold haze; vignette on top.
const GRADE = {
  spring: { sun: [0.22, 0.15, '255,236,240', 0.22], tint: '255,240,245', tintA: 0.04, edge: '30,40,20' },
  summer: { sun: [0.22, 0.1, '255,226,150', 0.34], tint: '255,232,170', tintA: 0.05, edge: '40,30,10' },
  autumn: { sun: [0.05, 0.12, '255,190,110', 0.3], tint: '255,190,120', tintA: 0.07, edge: '40,20,5' },
  winter: { sun: [0.22, 0.1, '235,242,255', 0.25], tint: '200,215,255', tintA: 0.08, edge: '30,40,70' },
};

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
