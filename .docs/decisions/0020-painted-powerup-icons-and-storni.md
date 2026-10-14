# 0020: Painted power-up icons; the bottle becomes "Storni"

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decided by:** user (painted style B over glossy 3D; icons float with a glow; label name "Storni"); Opus 5.5 (size, placement, where the icons appear)
- **Built by:** Opus 5.5
- **Commits:** see history.md, 2026-10-14

## Context
The power-ups were flat glyphs drawn in glossy bubbles, and the helmet pickup showed a white hard hat while the figures wear a red bike helmet. The bottle the figure trips over was small, flat-shaded and hidden behind the legs.

## Decision
- Nano Banana paints the three icons (red bike helmet, hourglass, two green arrows) in the gouache style, all in one image so they match. `tools/cut-icons.py` keys out the magenta and writes `assets/powerups/*.webp`.
- In the game the icon floats and sways in its colour glow, without a bubble. The same icons replace the emojis in the HUD chips, the start legend and the power-up banners.
- The bottle is rebuilt in Blender: 1.7 × real size, glossy brown glass, red crown cap, and a painted cream label reading "STORNI – Pilsener" (a parody name, so no real brand on it). It lies beside the right foot, in view while standing and turning, and is part of the frame size of those clips.

## Alternatives
- Glossy 3D icons (variant A): match the figures, but stand out more from the painted park.
- Keep the bubbles: clear, but look like UI stuck on the path.
- The real brand name on the label: funnier, but a trademark.

## Consequences
- Pickup colours stay red, blue, green (ADR 0011).
- The old `pickupSprite` glyph code is gone.
