# 0023: Painted ground and gabions on a visible descending hill

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decided by:** user (closer to reference materials, stronger visible downhill); Codex (shared hill projection and cached inverse)
- **Built by:** Codex (GPT-6)
- **Commits:** see release entry in history.md

## Context
The first environment pass still used procedural stone shapes and sparse ground
dots. The user liked the woodland but requested the material detail visible in the
reference images and explicitly selected a more visibly descending path.

## Decision
Use two small shared painted WebPs (earth and stone/wire material), generated with
the built-in Imagegen tool and prepared by `tools/build-surface-art.py`. Cache their
seasonal ground mipmaps and gabion front/top/end faces. Keep snow, vines and loose
leaves as seasonal detail. Replace angular ground-shadow wedges with softer shade.

All projected objects share a smooth logarithmic terrain drop, zero at PLAYER_Z.
The player's horizontal scale and collision-plane position remain fixed. Ground
screen rows use an inverse lookup built once per resize, rather than root solving
inside the render loop. Level gabion lids and falling rear foundations provide
visible depth; a cached distant forest layer joins the hill to the wooded valley.
Ice clipping follows the same curve. Pure projection/inverse tests cover anchors,
monotonic depth and matching ground/wall feet at several phone dimensions.

## Alternatives
- More procedural dots and polygons: would retain the material style the user rejected.
- Camera tilt only: would not establish a coherent falling ground beneath the obstacles.
- A real-time 3D terrain mesh: unnecessary for the existing Canvas engine.

## Consequences
Two source materials add 93,390 bytes. Gameplay distances, collision widths and
steering sensitivity are unchanged; only the shared visual ground profile changes.
Generated material edges are not mathematically seamless; mipmapping and low-contrast
soil reduce visible repetition. Real-device and 4x CPU-throttled performance remain
to be verified before release. Prompts and original PNG locations are recorded in
`assets/environment/material-prompts.json` and that folder's README.md.
