import { makeCanvas } from './sprites.js';

const TAU = Math.PI * 2;
const INK = '#2b1d14', SKIN = '#f6c48f', HAIR = '#4a2c1e';
const HOODIE = '#e4572e', HOODIE_DARK = '#b33c1d', SLEEVE = '#ef6b3f', STRIPE = '#ffc93d', JEANS = '#34457e';
const HEAD = [0.34, -0.6];

const circle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
const line = (g, pts) => {
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
};
const LEGS = [-0.05, 0.3, 0.62, -0.08, 0.5, 0.5];
const ARM = [0.02, -0.22, 0.46, 0.22];

function eyes(g, hx, hy, dazed) {
  g.fillStyle = g.strokeStyle = INK;
  if (dazed) {
    g.lineWidth = 0.05;
    for (const ex of [0.12, 0.29]) {
      line(g, [hx + ex - 0.06, hy - 0.06, hx + ex + 0.06, hy + 0.06]);
      g.stroke();
      line(g, [hx + ex - 0.06, hy + 0.06, hx + ex + 0.06, hy - 0.06]);
      g.stroke();
    }
    return;
  }
  for (const ex of [0.12, 0.29]) {
    g.beginPath();
    g.ellipse(hx + ex, hy, 0.058, 0.085, 0, 0, TAU);
    g.fill();
  }
  g.fillStyle = '#fff';
  for (const ex of [0.135, 0.305]) {
    circle(g, hx + ex, hy - 0.03, 0.022);
    g.fill();
  }
}

function face(g, dazed) {
  const [hx, hy] = HEAD;
  g.fillStyle = 'rgba(255,110,110,0.45)';
  circle(g, hx + 0.04, hy + 0.15, 0.075); g.fill();
  circle(g, hx + 0.36, hy + 0.13, 0.065); g.fill();
  eyes(g, hx, hy, dazed);
  g.fillStyle = '#7a2a22';
  g.beginPath();
  g.ellipse(hx + 0.23, hy + 0.2, dazed ? 0.08 : 0.06, dazed ? 0.035 : 0.07, 0, 0, TAU);
  g.fill();
}

function hair(g, helmet) {
  const [hx, hy] = HEAD;
  if (helmet) {
    // the red rescue helmet from the power-up, white cross on top
    g.fillStyle = '#e2332b';
    g.beginPath();
    g.arc(hx, hy, 0.54, Math.PI * 0.88, Math.PI * 1.86);
    g.quadraticCurveTo(hx + 0.05, hy - 0.1, hx - 0.53, hy + 0.1);
    g.fill();
    g.lineWidth = 0.08;
    g.strokeStyle = INK;
    g.stroke();
    const [cx, cy] = [hx - 0.12, hy - 0.3];
    g.fillStyle = '#fff';
    g.fillRect(cx - 0.05, cy - 0.15, 0.1, 0.3);
    g.fillRect(cx - 0.15, cy - 0.05, 0.3, 0.1);
    g.lineWidth = 0.06;
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.beginPath();
    g.arc(hx, hy, 0.44, Math.PI * 1.45, Math.PI * 1.7);
    g.stroke();
    return;
  }
  g.fillStyle = HAIR;
  g.beginPath();
  g.arc(hx, hy, 0.46, Math.PI * 0.95, Math.PI * 1.75);
  g.quadraticCurveTo(hx + 0.02, hy - 0.06, hx - 0.45, hy + 0.08);
  g.fill();
  g.beginPath();
  g.moveTo(hx - 0.2, hy - 0.4);
  g.quadraticCurveTo(hx - 0.3, hy - 0.66, hx - 0.02, hy - 0.62);
  g.quadraticCurveTo(hx - 0.16, hy - 0.52, hx - 0.06, hy - 0.42);
  g.fill();
}

// A kid curled into a ball, seen from the side. One unit = the ball radius r.
function paint(g, helmet, dazed) {
  const [hx, hy] = HEAD;
  g.lineJoin = g.lineCap = 'round';
  // ink silhouette first, so every part gets one shared outline
  g.strokeStyle = INK;
  g.lineWidth = 0.17;
  circle(g, 0, 0.02, 0.8); g.stroke();
  circle(g, hx, hy, helmet ? 0.52 : 0.43); g.stroke();
  g.lineWidth = 0.58;
  line(g, LEGS); g.stroke();
  g.lineWidth = 0.44;
  line(g, ARM); g.stroke();
  g.lineWidth = 0.17;
  g.beginPath(); g.ellipse(0.66, 0.6, 0.25, 0.16, 0.2, 0, TAU); g.stroke();

  g.fillStyle = HOODIE;
  circle(g, 0, 0.02, 0.8); g.fill();
  g.strokeStyle = STRIPE;
  g.lineWidth = 0.17;
  g.beginPath(); g.arc(0, 0.02, 0.6, Math.PI * 0.62, Math.PI * 1.32); g.stroke();
  g.fillStyle = HOODIE_DARK;
  circle(g, 0.1, -0.44, 0.36); g.fill();
  g.strokeStyle = JEANS;
  g.lineWidth = 0.42;
  line(g, LEGS); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.18)';
  g.lineWidth = 0.08;
  line(g, [0.05, 0.18, 0.56, -0.18]); g.stroke();
  g.fillStyle = '#f5f5f0';
  g.beginPath(); g.ellipse(0.66, 0.6, 0.25, 0.16, 0.2, 0, TAU); g.fill();
  g.strokeStyle = '#d83a2e';
  g.lineWidth = 0.07;
  g.beginPath(); g.ellipse(0.66, 0.6, 0.21, 0.12, 0.2, 0.2, Math.PI * 0.95); g.stroke();
  g.strokeStyle = SLEEVE;
  g.lineWidth = 0.27;
  line(g, ARM); g.stroke();
  g.strokeStyle = STRIPE;
  line(g, [0.38, 0.14, 0.43, 0.19]); g.stroke();
  g.fillStyle = SKIN;
  circle(g, 0.52, 0.27, 0.13); g.fill();
  circle(g, hx, hy, 0.43); g.fill();
  hair(g, helmet);
  face(g, dazed);
}

// Sprites depend only on the ball size, so they are painted once and the game loop just rotates them.
const sprites = new Map();
let spriteSize = 0;
const sprite = (r, dpr, key, draw) => {
  const size = Math.ceil(r * 3.4 * dpr);
  if (size !== spriteSize) {
    sprites.clear();
    spriteSize = size;
  }
  if (!sprites.has(key)) {
    const c = makeCanvas(size, size), g = c.getContext('2d'), k = r * dpr;
    g.setTransform(k, 0, 0, k, size / 2, size / 2);
    draw(g);
    sprites.set(key, c);
  }
  return sprites.get(key);
};

// The kid, upright and unshaded.
export const kidSprite = (r, dpr, helmet, dazed) => sprite(r, dpr, `${helmet}:${dazed}`, (g) => paint(g, helmet, dazed));

// Light from the upper left of the screen, drawn unrotated over the ball. The rim is soft
// so the head and shoe, which stick out of the ball, don't get a hard edge.
export const kidShade = (r, dpr) => sprite(r, dpr, 'shade', (g) => {
  const shade = g.createRadialGradient(-0.45, -0.55, 0.05, -0.15, -0.2, 1.45);
  shade.addColorStop(0, 'rgba(255,248,230,0.4)');
  shade.addColorStop(0.4, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(40,10,50,0.5)');
  g.fillStyle = shade;
  circle(g, 0, 0.02, 0.9);
  g.fill();
  g.globalCompositeOperation = 'destination-in';
  const rim = g.createRadialGradient(0, 0.02, 0.62, 0, 0.02, 0.9);
  rim.addColorStop(0, 'rgba(0,0,0,1)');
  rim.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rim;
  g.fillRect(-1, -1, 2, 2);
});

// Where the head ends up on screen, relative to the ball centre.
export const headOffset = (spin, r) => [
  (HEAD[0] * Math.cos(spin) - HEAD[1] * Math.sin(spin)) * r,
  (HEAD[0] * Math.sin(spin) + HEAD[1] * Math.cos(spin)) * r,
];
