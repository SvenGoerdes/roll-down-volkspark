# 0022: Layered seasonal park art in Canvas 2D

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decided by:** user (new environment from supplied images); Codex (layering and cached sprites)
- **Built by:** Codex (GPT-6)
- **Commits:** see release entry in history.md

## Context
The recoloured park photo and small procedural plants did not match the user's
four new painted references. The supplied Gemini proposal correctly warns against
embedding static walls behind the game's moving walls.

## Decision
Use cropped, fog-blended WebP horizons and generated transparent tree/shrub
clusters per season. Keep ground, baskets, weather and gameplay in the existing
Canvas projection. Bake foliage, stone/wire textures, shadows and light once into
small caches. Share a single depth-fog curve. Cut-end posts stay within solid wall
segments so the visible gap continues to match collision bounds.

## Alternatives
- Full images as backgrounds: would duplicate their static walls and path.
- Real-time 3D/Blender scenes: unnecessary runtime complexity for this upgrade.
- Procedural foliage alone: retained only as a fallback if an image cannot load;
  generated cutouts better match the references.

## Consequences
Eight environment WebPs cost ~899 KB; only the current season's two images block
startup, the others load in idle time. Missing art falls back to matching sky/fog
and procedural plants. Assets and prompts are reproducible via build-environment.py
and assets/environment/README.md. The original generated PNGs remain outside git.
Real-device and 4x CPU-throttled performance remain to be verified before release.
