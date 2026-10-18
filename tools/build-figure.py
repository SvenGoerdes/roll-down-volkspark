# Packs one figure's Blender frames into WebP sheets and adds its entry to js/figure-sheets.js (ADR 0018, ticket #20).
# python3 tools/build-figure.py alaska <clips-dir> <intro-dir>   (needs Pillow)
#   clips-dir: <clip>/NN.png for select, roll, roll-helmet, dazed plus meta.json (tools/blender/export-alaska.py)
#   intro-dir: NN.png plus meta.json (tools/blender/export-intro.py)
# Other figures' entries stay as they are.
import json, math, os, re, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MAX = 2048        # both sheet axes stay within what every phone GPU takes
QUALITY = 78
ORDER = ['select', 'intro', 'roll', 'roll-helmet', 'dazed']


def pack(frames_dir, n, w, h, single_row=False):
    frames = [Image.open(os.path.join(frames_dir, f'{i:02d}.png')).convert('RGBA') for i in range(n)]
    assert all(f.size == (w, h) for f in frames), f'{frames_dir}: frame size differs from meta'
    layouts = [(c, math.ceil(n / c)) for c in range(1, n + 1) if c * w <= MAX and math.ceil(n / c) * h <= MAX]
    if single_row:
        layouts = [(n, 1)] if n * w <= MAX else []
    assert layouts, f'{frames_dir}: {n} frames of {w}x{h} do not fit {MAX}x{MAX}'
    cols, rows = min(layouts, key=lambda cr: (cr[0] * cr[1], abs(cr[0] * w - cr[1] * h)))
    sheet = Image.new('RGBA', (cols * w, rows * h))
    for i, f in enumerate(frames):
        sheet.paste(f, ((i % cols) * w, (i // cols) * h))
    return sheet, cols


def main():
    fig, clips_dir, intro_dir = sys.argv[1:4]
    out = os.path.join(ROOT, 'assets', 'figures', fig)
    os.makedirs(out, exist_ok=True)
    meta = json.load(open(os.path.join(clips_dir, 'meta.json')))
    intro = json.load(open(os.path.join(intro_dir, 'meta.json')))
    entries = {}
    jobs = {c: (os.path.join(clips_dir, c), meta[c]) for c in meta if c in ORDER}
    jobs['intro'] = (intro_dir, {k: intro[k] for k in ('n', 'fps', 'contact', 'ppu', 'loop', 'w', 'h', 'ax', 'ay')})
    total = 0
    for clip in ORDER:
        directory, m = jobs[clip]
        sheet, cols = pack(directory, m['n'], m['w'], m['h'], single_row=clip == 'select')
        path = os.path.join(out, f'{clip}.webp')
        sheet.save(path, 'WEBP', quality=QUALITY, method=6, exact=True)
        total += os.path.getsize(path)
        print(f'{fig}/{clip}.webp  {sheet.width}x{sheet.height}  {os.path.getsize(path) // 1024} KB  rgba {sheet.width * sheet.height * 4}')
        entries[clip] = {**m, 'cols': cols}
    print(f'total {total // 1024} KB')
    lines = [f'  {fig}: {{']
    for clip in ORDER:
        lines.append(f'    {json.dumps(clip)}: {json.dumps(entries[clip], separators=(", ", ": "))},')
    lines.append('  },')
    block = '\n'.join(lines) + '\n'
    path = os.path.join(ROOT, 'js', 'figure-sheets.js')
    source = open(path).read()
    old = re.search(rf'  {fig}: \{{\n.*?\n  \}},\n', source, re.S)
    source = source.replace(old.group(0), block) if old else source.replace('};\n', block + '};\n')
    open(path, 'w').write(source)


main()
