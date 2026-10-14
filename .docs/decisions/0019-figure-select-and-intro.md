# 0019: Figure select and intro in the game

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decided by:** user (both figures selectable at the start; turn round, trip over something, then roll; Sterni bottle; original PBR look); Opus 5.5 (flow details below)
- **Built by:** Opus 5.5 planned and integrated; Haiku 5.5 subagents wrote the modules; Sonnet 5.5 reviewed
- **Commits:** see history.md, 2026-10-14

## Context
ADR 0018 turns the user's Kalle and Tine models into sprite sheets. The game still drew the old painted kid. The user wanted the figure chosen on the start screen and a short start scene before the roll.

## Decision
- **Start screen:** one card per figure with its breathing `select` sheet as a CSS sprite animation (no canvas). Tapping a card picks that figure and starts; tapping anywhere else starts with the highlighted one. The choice is stored in `localStorage` (`rollDownFigure`).
- **Loading:** only the chosen figure's six game sheets load (~0.5 MB). The remembered figure is prefetched at start; images are decoded before use so nothing decodes mid-run.
- **Intro state** (`start → intro → playing`): idle 0.7 s facing us, turn 0.6 s, trip over the Sterni 0.8 s, then the roll. The world starts moving during the trip. A tap skips straight to playing. The round time stays 0 during the intro, so the speed curve is unchanged.
- **Placement:** every clip is anchored on the ball centre. Standing, the figure is a step nearer the camera, so the renderer shifts the standing clips until the feet stand on the ball's ground spot and lets the offset run out during the trip. The dazed clip is centred there.
- **Playing:** the roll frame follows `spin` (one turn = 32 frames); `roll-helmet` while helmets > 0. Hop, squash, lean and speed arcs stay; the old 2D rotation is gone.
- **Game over:** dazed clip at 8 fps with the stars at the clip's head point. Tapping retries straight into playing (no intro); "Figur wechseln" goes back to the start screen.
- Code: `js/figure.js` (pure: frames, intro timing, poses, loading, drawing a frame), `js/figure-select.js` (cards, storage), `js/render-player.js` (drawing the figure). `js/player.js` is gone.

## Alternatives
- Intro on every retry: nicer once, tiring after the tenth crash. Retry skips it.
- Drawing the select cards on the canvas: more code; CSS steps() does it for free.
- Loading both figures up front: twice the data for most players.

## Consequences
- New figures need only a sheet set with the same frame counts (a test checks this).
- `main.js` grew to ~600 lines; splitting it (input, HUD, states) is now overdue (backlog).
