"""Prepare the user's seasonal references for the runtime (Pillow required).

Only the upper 60% is used: sky, skyline and distant woodland, above every
painted gabion. The runtime blends the lower edge into its own depth fog.
Usage: python3 tools/build-environment.py [--source assets/seasons] [--out assets/environment]
"""
import argparse
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
FORESTS = {
    'spring': 'exec-b66f9f1a-d90a-4367-aa9f-8d024639b071.png',
    'summer': 'exec-2415d986-b393-41e9-9a57-4b48eb4a1d32.png',
    'autumn': 'exec-dc5970e0-dab1-4f1f-8b57-8c2feaf76a85.png',
    'winter': 'exec-979bfc50-330f-4c95-92a9-ad4deefb6e6b.png',
}
SOURCES = {
    'spring': 'Gemini_Generated_Image_w6qkrrw6qkrrw6qk copy.jpg',
    'summer': 'Gemini_Generated_Image_w6qkrrw6qkrrw6qk.jpg',
    'autumn': 'Gemini_Generated_Image_vozmanvozmanvozm.jpg',
    'winter': 'Gemini_Generated_Image_w6qkrrw6qkrrw6qk.jpeg',
}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'assets/seasons')
    parser.add_argument('--out', type=Path, default=ROOT / 'assets/environment')
    parser.add_argument('--forest-source', type=Path, help='Directory of original Imagegen PNGs; see assets/environment/README.md')
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    total = 0
    for season, filename in SOURCES.items():
        image = ImageOps.exif_transpose(Image.open(args.source / filename)).convert('RGB')
        horizon = image.crop((0, 0, image.width, round(image.height * 0.60)))
        horizon = horizon.resize((768, 618), Image.Resampling.LANCZOS)
        target = args.out / f'{season}-horizon.webp'
        horizon.save(target, 'WEBP', quality=82, method=6)
        total += target.stat().st_size
        print(f'{target.name}: {target.stat().st_size:,} bytes')
        if args.forest_source:
            forest = Image.open(args.forest_source / FORESTS[season]).convert('RGBA')
            forest.thumbnail((384, 672), Image.Resampling.LANCZOS)
            target = args.out / f'{season}-forest.webp'
            forest.save(target, 'WEBP', quality=80, method=6)
            total += target.stat().st_size
            print(f'{target.name}: {target.stat().st_size:,} bytes')
    print(f'Total: {total:,} bytes')
