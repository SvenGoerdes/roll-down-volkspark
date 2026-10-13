# 0008: Slipperiness shown as an extra drawing layer

- **Status:** Accepted
- **Date:** 2026-10-12
- **Decided by:** the user picked the feature (issue #2); the design came from the Sonnet 5.5 agent
- **Built by:** Sonnet 5.5 agent; reviewed by Sonnet 5.5
- **Commits:** `e19cc89`, `4ae75a2`

## Context
Ice and puddles already changed the steering (a looser spring), but you couldn't see it.

## Decision
Additive effects only: ice sheen clipped to the path, skid marks that scroll with the ground, spray, and the kid leaning into a slide. They live in `render-slip.js` and are driven by `slipAmount` and `skidStrength` in `logic.js`.

## Consequences
- The steering code is untouched, and the effects can be tuned or removed on their own.
- A few dozen extra strokes per frame in winter.
