# Visual check for a script-modelled figure (ADR 0018): model sheet, render, and the render laid over the sheet.
# python3 tools/blender/compare.py <figure> <sheet_render_dir> <out.jpg>   (render_dir from render.py ... sheet; needs Pillow)
# Rows: sheet views, renders, 50 % overlay with a 10 % grid. Name 2–3 concrete differences per round, fix them, render again.
import os, sys
from PIL import Image, ImageDraw

fig, d, out = sys.argv[1], sys.argv[2], sys.argv[3]
src = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'src', 'characters')
W, H = 450, 600

def flat(im):
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im.convert('RGBA'))
    return bg.convert('RGB')

canvas = Image.new('RGB', (W * 3, H * 3), 'white')
for i, view in enumerate(('front', 'right', 'back')):
    sheet = Image.open(os.path.join(src, f'{fig}-{view}.jpg')).convert('RGB').resize((W, H))
    render = flat(Image.open(os.path.join(d, f'{view}.png')).resize((W, H)))
    overlay = Image.blend(sheet, render, 0.5)
    g = ImageDraw.Draw(overlay)
    for k in range(1, 10):
        g.line([(0, k * H // 10), (W, k * H // 10)], fill=(255, 0, 0), width=1)
        g.line([(k * W // 10, 0), (k * W // 10, H)], fill=(255, 0, 0), width=1)
    for row, im in enumerate((sheet, render, overlay)):
        canvas.paste(im, (i * W, row * H))
canvas.save(out, quality=88)
