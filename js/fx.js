// Short-lived screen-space effects: wall debris, dust and pickup sparkles.

export const STONES = ['#8d877c', '#6f6a61', '#a59f92', '#57524b', '#7b6c5a'];
const GRAVITY = { stone: 900, dust: -30, spark: 0, ring: 0 };

export function burstStones(fx, x, y, scale, rng = Math.random) {
  for (let i = 0; i < 22; i++) {
    const a = -Math.PI * (0.05 + rng() * 0.9), v = (140 + rng() * 300) * scale;
    fx.push({
      kind: 'stone', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80 * scale,
      rot: rng() * 6, vr: (rng() - 0.5) * 16, size: (3 + rng() * 6) * scale,
      grow: 0.6 + rng() * 1.4, life: 0, max: 1.1 + rng() * 0.7, color: STONES[(rng() * STONES.length) | 0],
    });
  }
  for (let i = 0; i < 9; i++) {
    const a = rng() * Math.PI * 2, v = (30 + rng() * 60) * scale;
    fx.push({
      kind: 'dust', x: x + Math.cos(a) * 24 * scale, y: y + 22 * scale, vx: Math.cos(a) * v * 1.6, vy: -Math.abs(Math.sin(a) * v) * 0.3,
      rot: 0, vr: 0, size: (10 + rng() * 12) * scale, grow: 2.4, life: 0, max: 0.7 + rng() * 0.5, color: '196,184,160',
    });
  }
  if (fx.length > 140) fx.splice(0, fx.length - 140);
}

export function burstSparkles(fx, x, y, scale, rng = Math.random) {
  fx.push({ kind: 'ring', x, y, vx: 0, vy: 0, rot: 0, vr: 0, size: 12 * scale, grow: 5, life: 0, max: 0.45, color: '#ffd23f' });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rng() * 0.4, v = (90 + rng() * 140) * scale;
    fx.push({
      kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: rng() * 6, vr: 6,
      size: (4 + rng() * 5) * scale, grow: -0.6, life: 0, max: 0.5 + rng() * 0.35, color: i % 3 ? '#ffd23f' : '#ffffff',
    });
  }
}

export function stepFx(fx, dt) {
  for (const f of fx) {
    f.life += dt;
    f.vy += GRAVITY[f.kind] * dt;
    f.vx *= f.kind === 'dust' ? 1 - dt * 2 : 1;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.rot += f.vr * dt;
  }
  return fx.filter((f) => f.life < f.max);
}
