import { CORRIDOR } from './config.js';
import { project } from './view.js';

// Glossy ice: a light sheen over the path plus streaks that scroll with the ground.
let sheenGrad = null, sheenKey = '';
let sheenView, sheenCameraX, sheenPath;

export function drawIceSheen(ctx, view, travelled, alpha = 1) {
  const { H, horizonY } = view;
  const key = `${H}|${horizonY}`;
  if (key !== sheenKey) {
    sheenKey = key;
    sheenGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    sheenGrad.addColorStop(0, 'rgba(255,255,255,0)');
    sheenGrad.addColorStop(0.5, 'rgba(235,248,255,0.22)');
    sheenGrad.addColorStop(1, 'rgba(255,255,255,0.4)');
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  if (sheenView !== view || sheenCameraX !== view.cameraX) {
    sheenView = view; sheenCameraX = view.cameraX; sheenPath = new Path2D();
    const edge = (y, side) => {
      const p = project(view, side * (CORRIDOR / 2 - 0.2), view.groundRows[y]);
      sheenPath.lineTo(p.sx, y);
    };
    sheenPath.moveTo(view.cx, horizonY);
    for (let y = horizonY + 1; y < H; y += 12) edge(y, 1);
    edge(H, 1); edge(H, -1);
    for (let y = H - 1; y > horizonY; y -= 12) edge(y, -1);
    sheenPath.closePath();
  }
  ctx.clip(sheenPath);
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, horizonY, view.W, H - horizonY);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#fff';
  const buckets = [[], [], [], []];
  for (let i = 0; i < 26; i++) {
    const z = 5 + ((i * 6.1 - travelled) % 60 + 60) % 60;
    const x = (((i * 7.7) % 9) - 4.5) * 0.85;
    buckets[Math.min(3, ((z - 5) / 15) | 0)].push([project(view, x, z), project(view, x + 0.3, z + 2.8)]);
  }
  buckets.forEach((list, k) => {
    ctx.globalAlpha = alpha * (0.55 - k * 0.13);
    for (const [a, b] of list) {
      ctx.lineWidth = Math.max(1.5, 0.16 * a.s);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
  });
  ctx.restore();
}

// Two parallel tracks where the player slid sideways; `brk` marks the start of a new slide.
export function drawSkidMarks(ctx, view, skids, snowy) {
  if (skids.length < 2) return;
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.strokeStyle = snowy ? 'rgb(60,85,120)' : 'rgb(40,70,110)';
  for (const side of [-0.35, 0.35]) {
    for (let i = 1; i < skids.length; i++) {
      const m = skids[i], q = skids[i - 1];
      if (m.brk) continue;
      const a = project(view, q.x + side, q.z), b = project(view, m.x + side, m.z);
      ctx.globalAlpha = Math.min(1, 0.75 * m.a);
      ctx.lineWidth = Math.max(1, 0.12 * b.s);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawSpray(ctx, spray) {
  for (const s of spray) {
    ctx.globalAlpha = Math.min(1, (s.life / s.max) * 1.5);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
