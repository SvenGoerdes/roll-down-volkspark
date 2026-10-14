"""Repack the two generated material PNGs as small runtime WebPs (Pillow).

python3 tools/build-surface-art.py --source <original Imagegen directory>
"""
from pathlib import Path
import argparse
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'earth': ('exec-28de2ddb-a6e5-436d-9593-30bf2d0eadb4.png', (384, 512)),
    'gabion': ('exec-2e65e9dc-b52d-46e7-ab8e-c65e2fbc5758.png', (512, 256)),
}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--out', type=Path, default=ROOT / 'assets/environment')
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    for name, (filename, size) in SOURCES.items():
        image = Image.open(args.source / filename).convert('RGB').resize(size, Image.Resampling.LANCZOS)
        path = args.out / f'{name}-painted.webp'
        image.save(path, 'WEBP', quality=83, method=6)
        print(f'{path.name}: {path.stat().st_size:,} bytes')
