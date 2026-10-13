# 0009: Graphics polish with paint-once sprites

- **Status:** Accepted
- **Date:** 2026-10-12 / 2026-10-13
- **Decided by:** the user asked for better graphics, built by Opus with extra thinking; the design came from that Opus agent and was refined after review
- **Built by:** agent on Opus (xhigh effort); reviewed by Sonnet 5.5; merged by Claude Opus 5.5
- **Commits:** `3bd4d3d`, merge `23ed99d`, `bedeccd`

## Context
The first version used flat shapes. The goal was a richer look while keeping 60 fps on mid-range phones.

## Decision
- **Paint once:** every complex visual (trees, bushes, gabion faces, kid, pickups, season light) is painted once into offscreen canvases and only blitted per frame. The kid is painted once per size/helmet/dazed state and rotated; its light sits on top as a separate disc that doesn't rotate.
- **Plants:** roadside plants are a pure function of distance travelled, so they need no stored state.
- **Code layout:** render code is split by job (`render.js`, `render-fx.js`, `render-slip.js`, `view.js`).

## Consequences
- JavaScript per frame stays around 5–6.5 ms at 4x CPU throttle on GPU canvas.
- The cartoon plants and kid clash slightly with the photo backdrop. That's accepted.
- More sprite code (`sprites.js` and `player.js`, ~520 lines together).
