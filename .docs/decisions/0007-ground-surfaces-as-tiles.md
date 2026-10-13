# 0007: Ground surfaces as pre-rendered tiles drawn per screen row

- **Status:** Accepted
- **Date:** 2026-10-12
- **Decided by:** the user picked the feature (from player issue #2); the approach came from the Sonnet 5.5 agent and was refined after review
- **Built by:** Sonnet 5.5 agent; reviewed by Sonnet 5.5
- **Commits:** `c2de58c`, `151c075`, merge `c4e3a8f`

## Context
Players wanted different ground (gravel, grass, dirt) that both looks and plays differently.

## Decision
- **Tiles:** procedural texture tiles per season × surface, each with mip levels, painted once. The ground loop draws one tile strip per screen row and picks the mip level from how much texture the row covers.
- **Sequence:** surfaces follow a pure, seeded function of distance (`createSurfaceTrack`).
- **Gameplay:** gravel kicks the player sideways at random intervals, which doesn't depend on the frame rate. Grass slows to ×0.9.

## Alternatives
- Flat colors per surface: cheap, but surfaces would be hard to read.
- Photo crops as textures: hard to tile seamlessly per season.

## Consequences
- About 230 `drawImage` calls per frame for the ground. Fine on GPU canvas.
- Tile memory is about 8 MB. Tiles build lazily per season, so loading doesn't block.
