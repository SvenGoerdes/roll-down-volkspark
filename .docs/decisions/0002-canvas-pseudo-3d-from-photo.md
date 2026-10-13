# 0002: Canvas 2D pseudo-3D built around the user's photo

- **Status:** Accepted
- **Date:** 2026-10-11
- **Decided by:** Claude Opus 5.5 (main session)
- **Built by:** Claude Opus 5.5 (main session)
- **Commits:** `cdd2f4f`, camera retune in the same session

## Context
The game is based on one photo: a path down the hill with gabion walls and gaps, trees and the Berlin skyline. The player must roll through gaps.

## Decision
- **View:** look down the hill, like the photo. Walls come from the horizon toward the player, in the style of classic racing games with a per-row ground and scaled sprites.
- **Photo crops:** the top of the photo (trees and skyline) is the backdrop. A crop of a real gabion is the wall texture. The photo is recolored per season once at load.

## Alternatives
- WebGL/three.js: real 3D, but heavier and more code for a fixed camera.
- Side-scroller: simpler, but doesn't match the photo's perspective.

## Consequences
- Cheap to render and easy to reason about (`view.js`).
- The camera height had to be lowered after the first screenshots: walls were too flat.
- Photo assets must be cropped carefully. The HEIC export from `sips` came out rotated.
