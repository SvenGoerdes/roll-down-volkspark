# 0011: Color-coded power-ups and stackable helmets

- **Status:** Accepted
- **Date:** 2026-10-13
- **Decided by:** the user (colors so pickups are recognizable from afar; helmets stack up to 3, shown top left)
- **Built by:** Claude Opus 5.5 (main session)
- **Commits:** `54f0ed7`

## Context
After the graphics update every pickup was a yellow bubble, so players couldn't decide in time whether to grab one. A second helmet was wasted.

## Decision
- **Pickups:** each power-up has its own color in `config.js` and a symbol drawn as shapes, not an emoji, so it looks the same on every device. Helmet: red with a white helmet and cross. Slow-mo: blue with an hourglass. Wider gaps: green with a double arrow. Bubbles are 30% larger.
- **Helmets:** the player holds 0–3 (`addHelmet`, `MAX_HELMETS`). Each one absorbs one crash. The HUD shows one helmet icon per helmet.

## Consequences
- The colors carry the meaning, and the shapes back it up for color-blind players.
