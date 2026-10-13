# 0001: Static site, vanilla JS modules, no build step

- **Status:** Accepted
- **Date:** 2026-10-11
- **Decided by:** Claude Opus 5.5 (main session)
- **Built by:** Claude Opus 5.5 (main session)
- **Commits:** `cdd2f4f`

## Context
The user wanted a game to share with friends, easy to deploy, played in a phone browser. An app might come later.

## Decision
Plain HTML, CSS and ES modules. No framework, no bundler, no npm packages at runtime. A web manifest makes it installable on the home screen.

## Alternatives
- Phaser or another game engine: more to learn and ship. Our needs (2D canvas, a few sprites) are small.
- React or Vite: a build step with no real gain for a single canvas.

## Consequences
- Any static host works, and the repo is the deployable.
- We write our own rendering helpers.
- A native app later would mean wrapping the web app (e.g. Capacitor) or a rewrite.
