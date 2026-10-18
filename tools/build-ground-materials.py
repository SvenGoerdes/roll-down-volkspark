#!/usr/bin/env python3
"""Build small repeating runtime ground materials from the approved local study."""
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '.claude/review/quellen/floor/ground-v2.png'
OUT = ROOT / 'assets/environment'
SIZE = (384, 512)


def seamless(image):
    """Make a periodic Y tile with a smooth overlap seam, never an X repeat."""
    image = image.convert('RGB')
    overlap = 96
    # Keep a 512px output while taking a longer source sample; blend its two
    # ends in Y, then crop the overlap from the period.
    extended = image.resize((SIZE[0], SIZE[1] + overlap), Image.Resampling.LANCZOS)
    top = extended.crop((0, 0, SIZE[0], overlap))
    bottom = extended.crop((0, SIZE[1], SIZE[0], SIZE[1] + overlap))
    ramp = Image.new('L', (1, overlap))
    ramp.putdata([round(255 * (3 * (i / (overlap - 1)) ** 2 - 2 * (i / (overlap - 1)) ** 3)) for i in range(overlap)])
    blend = Image.composite(top, bottom, ramp.resize((SIZE[0], overlap)))
    middle = extended.crop((0, overlap, SIZE[0], SIZE[1]))
    result = Image.new('RGB', SIZE)
    result.paste(blend, (0, 0))
    result.paste(middle, (0, overlap))
    return result


def main():
    source = Image.open(SOURCE).convert('RGB')
    # Both crops stay in the foreground: earth is clear of the vanishing point;
    # the verge crop is grass/low plants, excluding trunks and the horizon.
    earth = source.crop((470, 2210, 760, 2560))
    verge = source.crop((0, 1630, 300, 2030))
    for name, image in [('ground-earth.webp', earth), ('ground-verge.webp', verge)]:
        target = seamless(image)
        if name == 'ground-verge.webp':
            target = ImageEnhance.Color(target).enhance(0.78)
        target.save(OUT / name, 'WEBP', quality=96, method=6)


if __name__ == '__main__':
    main()
