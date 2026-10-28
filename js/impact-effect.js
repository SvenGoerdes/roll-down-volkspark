// Small visual-only impact cue; no steering, camera, speed or blur changes.
export const impactLeft = (left, dt) => Math.max(0, left - dt);

export function drawImpact(ctx, view, left, duration, sprite, x, z) {
  if (left <= 0) return;
  const t = 1 - left / duration;
  ctx.save();
  ctx.globalAlpha = Math.min(1, left / 0.2);
  const size = Math.min(150, view.W * 0.4);
  ctx.drawImage(sprite, x - size / 2, z - size * (0.85 + t * 0.15), size, size * 0.45);
  ctx.restore();
}
