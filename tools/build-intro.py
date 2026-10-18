"""Pack a human intro; preserve all other metadata/assets, reuse exact roll frame 0.

python3 tools/build-intro.py .claude/review/24/frames/kalle
"""
import json
import math
from pathlib import Path
import re
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MAX = 2048
QUALITY = 78


def pack(directory):
    meta = json.loads((directory / 'meta.json').read_text())
    name = meta['figure']
    if name not in ('kalle', 'tine'):
        raise ValueError('Nur menschliche Intros in #24.')
    metadata_path = ROOT / 'js/figure-sheets.js'
    source = metadata_path.read_text()
    body = re.search(rf'  {name}: \{{\n(.*?)\n  \}},', source, re.S).group(1)
    roll = json.loads(re.search(r'"roll": (\{.*\})', body).group(1))
    frames = [Image.open(directory / f'{i:02d}.png').convert('RGBA') for i in range(meta['n'])]
    for frame in frames:
        box = frame.getchannel('A').getbbox()
        if not box or box[0] == 0 or box[1] == 0 or box[2] == frame.width or box[3] == frame.height:
            raise ValueError('Leerer oder abgeschnittener Frame; Render-Puffer prüfen.')
    # Reuse the shipped roll pixels at the same world scale and anchor; only
    # resample to the intro density, never regenerate the existing roll atlas.
    roll_image = Image.open(ROOT / f'assets/figures/{name}/roll.webp').convert('RGBA')
    roll_ppu = float(re.search(r'export const PPU = ([\d.]+)', source).group(1))
    ratio = meta['ppu'] / roll_ppu
    last = roll_image.crop((0, 0, roll['w'], roll['h']))
    if ratio != 1:
        last = last.resize((round(roll['w'] * ratio), round(roll['h'] * ratio)), Image.Resampling.LANCZOS)
    end = Image.new('RGBA', frames[0].size)
    end.paste(last, (round(meta['ax'] - roll['ax'] * ratio), round(meta['ay'] - roll['ay'] * ratio)))
    frames[-1] = end
    union = Image.new('L', frames[0].size)
    from PIL import ImageChops
    for frame in frames:
        union = ImageChops.lighter(union, frame.getchannel('A'))
    left, top, right, bottom = union.getbbox()
    crop = (max(0, left - 4), max(0, top - 4), min(union.width, right + 4), min(union.height, bottom + 4))
    frames = [frame.crop(crop) for frame in frames]
    w, h = frames[0].size
    # Select a compact, phone-safe layout with BOTH axes capped, unlike old packer.
    layouts = [(cols, math.ceil(meta['n'] / cols)) for cols in range(1, meta['n'] + 1)
               if cols * w <= MAX and math.ceil(meta['n'] / cols) * h <= MAX]
    if not layouts:
        raise ValueError(f'{name}: Intro passt nicht in eine 2048²-Seite ({w}×{h}).')
    cols, rows = min(layouts, key=lambda cr: (cr[0] * cr[1], abs(cr[0] * w - cr[1] * h)))
    atlas = Image.new('RGBA', (cols * w, rows * h))
    for i, frame in enumerate(frames):
        atlas.paste(frame, ((i % cols) * w, (i // cols) * h))
    target = ROOT / f'assets/figures/{name}/intro.webp'
    atlas.save(target, 'WEBP', quality=QUALITY, method=6, exact=True)
    record = {key: meta[key] for key in ('n', 'fps', 'contact', 'ppu', 'loop')}
    record.update(w=w, h=h, cols=cols, ax=meta['ax'] - crop[0], ay=meta['ay'] - crop[1])
    # Old idle/turn/trip files remain historical but are no longer loaded. Remove
    # their metadata here; select/roll/roll-helmet/dazed are never regenerated.
    lines = [line for line in body.splitlines() if not re.search(r'"(idle|turn|trip|intro)":', line)]
    lines.insert(1, f'    "intro": {json.dumps(record)},')
    source = source.replace(body, '\n'.join(lines))
    metadata_path.write_text(source)
    report = dict(figure=name, atlas=list(atlas.size), frame=[w, h],
                  bytes=target.stat().st_size, rgba_bytes=atlas.width * atlas.height * 4, metadata=record)
    (directory / 'budget.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report))


if __name__ == '__main__':
    pack(Path(sys.argv[1]))
