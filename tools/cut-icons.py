# Cuts a row of icons painted on flat magenta (Nano Banana) into transparent WebP files.
# python3 tools/cut-icons.py <sheet> <out_dir> <name>…   (one name per icon, left to right; needs Pillow, numpy)
import os, sys
import numpy as np
from PIL import Image

SIZE = 256       # longest side of each icon
QUALITY = 88

src, out_dir, names = sys.argv[1], sys.argv[2], sys.argv[3:]
rgb = np.asarray(Image.open(src).convert('RGB')).astype(float)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
# magenta: red and blue high, green low; soft edge over 80 levels
alpha = 1 - np.clip((np.minimum(r, b) - g - 60) / 80, 0, 1)
# pull the magenta spill out of the soft edge
edge = alpha < 1
for ch in (r, b):
    ch[edge] = np.minimum(ch, g + (ch - g) * alpha)[edge]
rgba = Image.fromarray(np.dstack([r, g, b, alpha * 255]).astype(np.uint8), 'RGBA')

# icons are separated by empty columns; keep the widest runs, left to right
solid = (alpha > 0.5).sum(axis=0) > 2
runs, start = [], None
for x, on in enumerate(list(solid) + [False]):
    if on and start is None:
        start = x
    elif not on and start is not None:
        if runs and start - runs[-1][1] < rgba.width * 0.04:   # small gap: same icon (e.g. two arrows)
            start = runs.pop()[0]
        runs.append((start, x))
        start = None
runs =sorted(sorted(runs, key=lambda s: s[1] - s[0])[-len(names):])

os.makedirs(out_dir, exist_ok=True)
for name, (x0, x1) in zip(names, runs):
    icon = rgba.crop((x0, 0, x1, rgba.height))
    icon = icon.crop(icon.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox())
    icon.thumbnail((SIZE, SIZE), Image.LANCZOS)
    pad = Image.new('RGBA', (icon.width + 8, icon.height + 8))
    pad.paste(icon, (4, 4))
    path = os.path.join(out_dir, f'{name}.webp')
    pad.save(path, 'WEBP', quality=QUALITY, method=6)
    print(f'{path}  {pad.width}x{pad.height}  {os.path.getsize(path) // 1024} KB')
