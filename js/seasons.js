// Recolors the park photo once per season, so the game loop only blits ready canvases.

function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max / 255];
}

function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

const lerp = (a, b, t) => a + (b - a) * t;

// Pulls hues inside [from, to] toward `target` by `amount`.
function pullHue(h, from, to, target, amount) {
  if (h < from || h > to) return h;
  return lerp(h, target, amount);
}

const recolor = {
  spring(r, g, b) {
    let [h, s, v] = rgbToHsv(r, g, b);
    h = pullHue(h, 15, 75, 95, 0.75);
    return hsvToRgb(h, Math.min(1, s * 1.15), Math.min(1, v * 1.05));
  },
  summer(r, g, b) {
    let [h, s, v] = rgbToHsv(r, g, b);
    if (s < 0.12 && v > 0.62) {
      // overcast sky → summer blue
      const t = Math.min(1, (v - 0.62) / 0.3);
      return [lerp(r, 120, t), lerp(g, 178, t), lerp(b, 238, t)];
    }
    h = pullHue(h, 10, 80, 100, 0.85);
    return hsvToRgb(h, Math.min(1, s * 1.35), Math.min(1, v * 1.08));
  },
  autumn(r, g, b) {
    let [h, s, v] = rgbToHsv(r, g, b);
    h = pullHue(h, 45, 120, 32, 0.45);
    return hsvToRgb(h, Math.min(1, s * 1.3), v);
  },
  winter(r, g, b) {
    const l = 0.3 * r + 0.59 * g + 0.11 * b;
    const v = lerp(l, 255, 0.45);
    return [v * 0.97, v * 0.99, Math.min(255, v + 10)];
  },
};

export function buildSeasonBackgrounds(img, seasons) {
  const out = {};
  for (const season of seasons) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const px = data.data, fn = recolor[season.id];
    for (let i = 0; i < px.length; i += 4) {
      const [r, g, b] = fn(px[i], px[i + 1], px[i + 2]);
      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }
    ctx.putImageData(data, 0, 0);
    out[season.id] = c;
  }
  return out;
}
