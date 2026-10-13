# 0016: Character pipeline: 3D model, pre-rendered to sprites

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decided by:** user (Blender, a short professional pipeline); Opus 5.5 (steps)
- **Built by:** main session (Opus 5.5)
- **Commits:** see history.md, 2026-10-14

## Context
Frame-by-frame AI animation stayed choppy, even with 32 in-between frames: each frame is drawn anew and drifts. The user asked how professionals solve it and wanted a short pipeline. A Blender proof of concept (`tools/blender/kalle-poc.py`) showed that a 3D figure gives any number of smooth frames.

## Decision
The Dead Cells approach: animate in 3D, ship 2D sprites.
1. **Model sheet:** front, left, back and right views in A-pose made with Nano Banana. Stored in `assets/src/characters/`. "Left" means the character's left side, so the figure faces image-left.
2. **Model, texture, rig:** Tripo (multiview to 3D, standard texture, auto-rig). Credits are scarce (200), so the textured model is checked before paying for rigging.
3. **Animation:** Blender script with clips stumble → roll (rotation of the tucked pose) → crash → get up.
4. **Render:** Blender script with toon shader, outline, game camera and transparent background, out to one WebP sheet per figure.
5. **Game:** a small state machine plays the clips; squash on impact in code. Measured at 4x CPU throttling.

## Alternatives
- AI frame sheets plus in-betweens: tried, too choppy.
- Real-time 3D in the browser (three.js): the pro default for runners, but a big rewrite of the Canvas 2D renderer. Revisit for the app (YAGNI now).
- Spine cut-out rig: struggles with a 3D somersault.
- Freelance modeller (about €200–800): still an option if Tripo results are poor.

## Consequences
- Smooth animation at any frame count, consistent light and size; reproducible from scripts.
- The look moves from hand-painted towards toon-shaded 3D. Painted textures from the model sheet keep it close to style B.
- Depends on Tripo credits for new figures.
