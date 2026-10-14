# 0018: User's 3D models, rigged by script, rendered to sprite sheets

- **Status:** Accepted (replaces steps 2–4 of ADR 0016; supersedes ADR 0017 for the figures)
- **Date:** 2026-10-14
- **Decided by:** user (no paid Tripo; brought own 3D models); Opus 5.5 (rig, skinning, render pipeline)
- **Built by:** main session (Opus 5.5). The models were built by the user with Codex and Blender via blender-mcp.
- **Commits:** see history.md, 2026-10-14

## Context
TRELLIS.2 looked much worse than Tripo, and Tripo export needs a paid plan. Opus first modelled both figures by script from primitives (lofted parts, toon shader). The user was not satisfied with the look and supplied their own models instead: `kalle-refined.glb` (1.3 M triangles) and `tine.glb` (2.2 M), static, no rig, front facing −Y.

## Decision
- `tools/blender/prep-glb.py` joins, turns the model to face +Y, decimates it to ~120 k faces and writes `assets/src/characters/{kalle,tine}-3d.glb` (~2.9 MB each). The originals stay outside the repo.
- `tools/blender/skinned.py` rigs it without an armature: pivot empties at measured joint points (`JOINTS` in `kalle.py` / `tine.py`), each vertex bound to its one or two nearest bone segments (distance scaled by limb thickness, soft-min blend), re-skinned with numpy after every pose. The A-pose is handled by `arm_rest`.
- `tools/blender/render.py` poses the rig (shared pose table: stand, step, catch, trip, flail, tuck, ball, KO) and renders the game clips from the game camera (ortho, ~30° from behind and above, 160 px per unit): select, idle, turn, trip over a "Sterni" bottle, roll (32 frames, rigid turn about the ball centre), roll with helmet, dazed. Each clip is framed automatically and carries an anchor (the ball centre) so the game can chain clips without jumps.
- `tools/build-sprites.py` packs each clip into a WebP sheet and writes `js/figure-sheets.js`.
- Two looks: `LOOK=toon` (model colours in flat bands plus ink outline, matches style B) or `LOOK=pbr` (the model's own materials).

## Alternatives
- Script-modelled figures from primitives (`toon.py` kit): fully reproducible, but the user did not like the result.
- Armature with Blender's automatic weights: fails often on large merged meshes made of many shells.
- blender-mcp live connection for this pipeline: not needed; headless scripts stay reproducible and versioned. The user used it to build the models.
- Tripo Pro: costs money.

## Consequences
- New figures only need a static model plus joint points; all clips re-render in about a minute.
- The skinning is simple: extreme bends can pinch. Fix by moving joint points or segment thickness.
- The model GLBs (~6 MB) are binary files in git.
