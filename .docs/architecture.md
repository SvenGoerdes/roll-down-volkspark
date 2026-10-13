# Architecture

Two parts, both small:

1. **The game:** a static site (HTML, CSS, vanilla JS ES modules) on GitHub Pages. No build step, no npm dependencies at runtime.
2. **The worker:** one Cloudflare Worker (`worker/`) that turns ideas into GitHub issues and stores the leaderboard in Workers KV.

```
Phone browser ──static files──▶ GitHub Pages (repo SvenGoerdes/roll-down-volkspark)
      │
      └──fetch JSON──▶ Cloudflare Worker "roll-down-ideas"
                          ├─ POST /ideas (and /) ─▶ GitHub REST API: create issue, label "idee"
                          ├─ POST /scores ────────▶ KV "LEADERBOARD", key "top"
                          └─ GET  /leaderboard ───▶ KV "LEADERBOARD", key "top"
```

## The game (`index.html`, `style.css`, `js/`)

**Rendering model.** Canvas 2D with fake 3D. World units: the path is `CORRIDOR` (8) wide, `x = 0` is the middle, `z` is the distance from the camera. Walls spawn at `z = 90` and move toward the player at `z = 4`. `view.js` turns `(x, z, height)` into screen coordinates. The top part of the screen is the cropped photo (`assets/park.jpg`); the ground is drawn row by row below the horizon.

**Main loop** (`main.js`): `requestAnimationFrame` → `update(dt)` (speed, spawning, collisions, power-ups, seasons, surfaces, effects) → `render()` (background, ground, a depth-sorted list of walls/plants/pickups/player, particles, overlays). `dt` is capped at 1/30 s. State machine: `loading → start → playing → over → playing …`.

**Paint once, blit often.** Everything expensive (season-tinted photos, ground tiles, trees, bushes, the kid, pickup bubbles, light overlays) is painted once into offscreen canvases. The loop only copies them. This keeps phones at 60 fps.

| Module | Job |
|---|---|
| `config.js` | All tuning constants: sizes, seasons, surfaces, power-ups, worker URL |
| `logic.js` | Pure game rules (speed, gaps, seasons, surfaces, slip, helmets). Fully unit tested |
| `main.js` | Game state, update loop, input, HUD, wiring |
| `view.js` | Camera: `computeView`, `project` |
| `render.js` | Background, ground, walls, puddles, pickups, player |
| `render-fx.js` | Plants, particles, speed lines, color grade, debris |
| `render-slip.js` | Ice sheen, skid marks, spray |
| `sprites.js` | Offscreen sprites (trees, bushes, gabion faces, pickups, grade) |
| `player.js` | The kid sprite (painted once per size/helmet/dazed) |
| `surfaces.js` | Procedural ground tiles per season × surface, with mip levels |
| `scenery.js` | Where roadside plants stand, derived from distance (no state) |
| `seasons.js` | Recolors the park photo per season (pixel work, once at load) |
| `fx.js` | Short-lived effects: stones, dust, sparkles |
| `ideas.js`, `leaderboard.js`, `name.js` | Bottom sheets for ideas and leaderboard, shared name storage and network errors |

**Game rules in short.** Speed rises slowly to a cap; gaps get narrower and walls closer. Seasons change every 20 walls (spring: puddles, summer: faster and two gaps, autumn: wind gusts, winter: ice). Path surfaces change every 120–220 units (dirt normal, gravel bumpy, grass slower). Power-ups: helmet (extra life, stacks to 3), slow-mo (5 s), wider gaps (7 s).

**Testing hook.** `index.html#debug` exposes `window.rollDown` (`game()`, `start`, `setSeason`, `spawn`, `update`) for scripted browser tests.

**Security on the page.** A CSP meta tag allows only own files and the worker URL. User text (names, ideas, leaderboard entries) is only ever set with `textContent`.

## The worker (`worker/`)

| File | Job |
|---|---|
| `src/index.js` | Routing, CORS, origin allowlist, size/type checks, rate limits, daily idea cap |
| `src/idea.js` | Validate an idea, build the GitHub issue (text in a code block, names stripped of markdown) |
| `src/score.js` | Validate a score, merge it into the top 20, per-IP limiter |
| `wrangler.toml` | Worker name, repo var, KV binding |

Limits: ideas 5 per hour per IP and 100 per day in total; scores 20 per hour per IP; bodies up to 4 KB; JSON only. Only `https://svengoerdes.github.io` may call it (extra dev origins via the `DEV_ORIGINS` env var, unset in production).

The GitHub token is a Cloudflare secret, never in the repo or the browser. Details in [operations.md](operations.md).
