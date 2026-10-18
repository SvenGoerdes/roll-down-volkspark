#!/usr/bin/env python3
"""Compose isolated Blender review renders; write only below .claude/review."""
import json
import math
import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..'))
REVIEW = os.path.realpath(os.path.join(ROOT, '.claude', 'review'))
PAPER = (246, 242, 231, 255)
VIEWS = ('01-front.png', '02-links.png', '03-ruecken.png', '04-rechts.png')
VIEW_LABELS = ('Vorn', 'Links', 'Hinten', 'Rechts')
KEYS = (0, 6, 12, 18, 23, 29, 35, 39, 44)
FIGURES = ('kalle', 'tine', 'alaska')


def safe_path(path):
    path = os.path.realpath(path)
    if path != REVIEW and not path.startswith(REVIEW + os.sep):
        raise ValueError('Pfad muss unter .claude/review liegen')
    return path


def read_frames(directory):
    meta = json.load(open(os.path.join(directory, 'meta.json')))
    if (meta.get('fps'), meta.get('n')) != (30, 45):
        raise ValueError(f'{directory}: meta.json muss fps=30 und n=45 enthalten')
    frames = []
    for i in range(45):
        path = os.path.join(directory, f'{i:02d}.png')
        image = Image.open(path).convert('RGBA')
        if image.size != (meta.get('width'), meta.get('height')):
            raise ValueError(f'{path}: PNG-Abmessungen passen nicht zu meta.json')
        alpha = image.getchannel('A')
        bounds = alpha.getbbox()
        if not bounds:
            raise ValueError(f'{path}: PNG ist leer')
        if bounds[0] == 0 or bounds[1] == 0 or bounds[2] == image.width or bounds[3] == image.height:
            raise ValueError(f'{path}: Alpha berührt den Bildrand; Render-Puffer vergrößern')
        frames.append(image)
    return meta, frames


def label(draw, xy, text):
    draw.text(xy, text, fill=(48, 45, 39), anchor='mm')


def contact_sheets(out, intros):
    for name in ('alaska', 'storni'):
        directory = os.path.join(out, f'0{1 if name == "alaska" else 2}-{name}-modell')
        images = []
        for filename in VIEWS:
            path = os.path.join(directory, filename)
            source = Image.open(path)
            if source.mode != 'RGBA':
                raise ValueError(f'{path}: PNG muss einen Alpha-Kanal enthalten')
            image = source.convert('RGBA')
            if not image.getchannel('A').getbbox():
                raise ValueError(f'{path}: PNG ist leer')
            images.append(image)
        sheet = Image.new('RGBA', (1200, 350), PAPER)
        draw = ImageDraw.Draw(sheet)
        for i, image in enumerate(images):
            image.thumbnail((300, 300), Image.Resampling.LANCZOS)
            x = i * 300 + (300 - image.width) // 2
            sheet.alpha_composite(image, (x, 8))
            label(draw, (i * 300 + 150, 328), VIEW_LABELS[i])
        sheet.convert('RGB').save(os.path.join(out, f'0{6 if name == "alaska" else 7}-{name}-ansichten.png'))
    for name, (meta, frames) in intros.items():
        cell = 160
        row_height = cell + 30
        sheet = Image.new('RGBA', (cell * 3, row_height * 3), PAPER)
        draw = ImageDraw.Draw(sheet)
        for i, frame_no in enumerate(KEYS):
            image = frames[frame_no].copy()
            image.thumbnail((cell, cell), Image.Resampling.LANCZOS)
            x, y = (i % 3) * cell, (i // 3) * row_height
            sheet.alpha_composite(image, (x + (cell-image.width)//2, y + (cell-image.height)//2))
            label(draw, (x + cell//2, y + cell + 14), f'Bild {frame_no:02d} · {frame_no/30:.2f} s')
        sheet.convert('RGB').save(os.path.join(out, f'{8 + FIGURES.index(name):02d}-{name}-frames.png'))


def atlases(out, name, meta, frames):
    union = None
    for frame in frames[:36]:
        box = frame.getchannel('A').getbbox()
        union = box if union is None else (min(union[0], box[0]), min(union[1], box[1]), max(union[2], box[2]), max(union[3], box[3]))
    left, top, right, bottom = union
    left, top = max(0, left - 4), max(0, top - 4)
    right, bottom = min(frames[0].width, right + 4), min(frames[0].height, bottom + 4)
    cw, ch = right-left, bottom-top
    cols, rows = min(36, 2048//cw), 2048//ch
    per_page = cols * rows
    if not per_page:
        raise ValueError(f'{name}: gemeinsame Zelle ist größer als 2048 px')
    pages, records = [], []
    base = os.path.join(out, 'atlas-kandidaten', name)
    os.makedirs(base, exist_ok=True)
    for start in range(0, 36, per_page):
        count = min(per_page, 36-start)
        page_cols = min(count, cols)
        page_rows = math.ceil(count/page_cols)
        atlas = Image.new('RGBA', (page_cols*cw, page_rows*ch), (0, 0, 0, 0))
        for j in range(count):
            atlas.alpha_composite(frames[start+j].crop((left, top, right, bottom)), ((j%page_cols)*cw, (j//page_cols)*ch))
            records.append({'frame': start+j, 'page': f'intro-{len(pages):02d}.webp', 'cell': j, 'x': (j%page_cols)*cw, 'y': (j//page_cols)*ch})
        filename = f'intro-{len(pages):02d}.webp'
        path = os.path.join(base, filename)
        atlas.save(path, 'WEBP', lossless=False, quality=80, method=6, exact=True)
        pages.append({'file': filename, 'frames': count, 'cols': page_cols, 'rows': page_rows,
                      'width': atlas.width, 'height': atlas.height,
                      'rgba_bytes': atlas.width*atlas.height*4, 'download_bytes': os.path.getsize(path)})
    data = {'figure': name, 'source_frames': 36, 'frame_cell': {'width': cw, 'height': ch},
            'crop': {'left': left, 'top': top, 'right': right, 'bottom': bottom},
            'ax': meta['ax']-left, 'ay': meta['ay']-top, 'ppu': meta['ppu'],
            'pages': pages, 'frames': records}
    with open(os.path.join(base, 'meta.json'), 'w') as handle:
        json.dump(data, handle, indent=2)
    return pages


def main():
    if len(sys.argv) != 2:
        raise SystemExit(f'usage: python3 {os.path.join(ROOT, "tools/blender/pack-review.py")} <review-dir>')
    out = safe_path(sys.argv[1])
    os.makedirs(out, exist_ok=True)
    intros = {name: read_frames(os.path.join(out, f'0{i+3}-{name}-intro')) for i, name in enumerate(FIGURES)}
    contact_sheets(out, intros)
    budget = {}
    durations = [33, 33, 34] * 15
    for name, (meta, frames) in intros.items():
        preview = [Image.alpha_composite(Image.new('RGBA', frame.size, PAPER), frame) for frame in frames]
        preview[0].save(os.path.join(out, f'{11+FIGURES.index(name):02d}-{name}-intro.webp'), 'WEBP', save_all=True,
                        append_images=preview[1:], duration=durations, loop=0, quality=80, method=6, exact=True)
        pages = atlases(out, name, meta, frames)
        budget[name] = {'pages': pages, 'rgba_bytes': sum(p['rgba_bytes'] for p in pages),
                        'download_bytes': sum(p['download_bytes'] for p in pages)}
        print(f'{name}: {sum(p["download_bytes"] for p in pages)/1024:.1f} KiB, {budget[name]["rgba_bytes"]} RGBA-Bytes, {len(pages)} Seite(n)')
    budget['notes'] = 'Budget gilt nur für die 36-Frame-Atlas-Kandidaten, nicht für alle Spiel-Assets.'
    with open(os.path.join(out, '14-budget.json'), 'w') as handle:
        json.dump(budget, handle, indent=2)


if __name__ == '__main__':
    main()
