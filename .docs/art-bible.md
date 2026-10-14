# Art bible

One page that keeps all game art consistent. Decided on 2026-10-14 ([ADR 0014](decisions/0014-painted-art-style.md)).

## Look in one sentence
Volkspark Friedrichshain as a warm, hand-painted picture book: gouache textures, soft light, crisp silhouettes, readable on a small phone screen.

## Reference images
- Style: sample B, saved as `assets/src/style-b.png` once the art lands. It is a painted version of the hill path with gabion walls.
- Place: `assets/park.jpg` (the user's photo).
- Current environment: the four user-supplied `assets/seasons/` images. Runtime horizons and transparent woodland cutouts live in `assets/environment/`; their prompts are in that folder's README.md (ADR 0022).
- Spring in the low-poly sample A had cherry blossoms; the user liked them. Spring uses pink cherry trees in this painted style.

## Rules
- **Readability first.** The player, the wall gaps and the pickups must stand out from the background at 390 px width. The background is calmer and less saturated than the things you interact with.
- **Shapes:** round = good (player, pickups), boxy = obstacle (gabion walls).
- **Pickup colors are fixed:** helmet red, slow-mo blue, wider gaps green (ADR 0011). No other big red, blue or green blobs in the play area.
- **Seasons:** spring with cherry blossoms; summer deep green and bright; autumn orange and brown leaves; winter snow and pale light. The same path, walls and figure in every season.
- **Light** comes from the upper left in all assets.

## Making assets
- Generate with `tools/gen-image.js` (ADR 0013) or the built-in Imagegen tool (ADR 0022). Always supply the style reference. Preserve real alpha in transparent cutouts.
- Sprites are generated on a flat single-color background (magenta) and cut out with `tools/cut-icons.py`. Several icons of a set go into one image, so they share one style.
- Store the prompt for each asset in `assets/src/prompts.md` so we can make it again.
- Before shipping: WebP, scaled to the largest on-screen size at DPR 2, and within the mobile budget in [engineering-principles.md](engineering-principles.md).
