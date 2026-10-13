# 0014: Painted art style

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decided by:** user
- **Built by:** samples by main session (Opus 5.5) with Nano Banana 2
- **Commits:** see history.md, 2026-10-14

## Context
The current game mixes a real photo with simple cartoon sprites drawn in code. The user called it "trashy". We made three style samples of the same scene: low-poly, hand-painted, and flat vector.

## Decision
Use the hand-painted gouache style (sample B) for all game art. Spring gets the cherry blossoms from sample A. The rules are in [art-bible.md](../art-bible.md). The rolling figure is redrawn in this style.

## Alternatives
- Low-poly (A): coherent, but busy. Only its cherry blossoms are kept.
- Flat vector (C): smallest files and clearest, but less of the Volkspark mood.

## Consequences
- Background images are larger than flat art would be. That fits the mobile budget as long as we ship WebP at screen size.
- Code-drawn sprites (kid, pickups, trees) get replaced step by step with painted images. Walls and ground may stay procedural if they match the painted look.
