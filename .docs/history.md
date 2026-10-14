# History

Newest first. "Built by" names the model that wrote the code. "Main session" is Claude Opus 5.5 (1M context), which talks to the user, plans, merges and deploys. Agents ran in their own git worktrees. Decisions are in [decisions/](decisions/).

## 2026-10-14 (night): CI, tickets and OpenCode panes
- GitHub Actions runs `bun test tests` on every PR; `main` takes only green PRs. `opencode.jsonc` sets the OpenCode permissions and two sub-agents (`coder` on GPT-6 Luna, `reviewer` on GPT-6.1 Sol medium).
- The user's new idea list became epics with sub-issues on GitHub. Claude runs the OpenCode panes in herdr. → [ADR 0026](decisions/0026-opencode-panes-tickets-and-ci.md)
- Requested by: the user. Built by: Opus 5.5 (main session).

## 2026-10-14 (evening): Perfekt, streak helmet, record chase
- To make you want one more run (the user: "geiles Gameplay, das einen hookt"): a pass through the middle pops "Perfekt", a pass by a hair "Knapp!". Six perfect passes in a row give a free helmet; pips under the score show the streak. → [ADR 0025](decisions/0025-perfect-streak-and-record-chase.md)
- The wall that would beat your record carries a "Rekord" sign; passing it shows "Neuer Rekord!". The season chip fills up over its 20 walls. Game over says "Neuer Rekord!" or "Noch N Mauern bis zum Rekord".
- Score and leaderboard stay "walls passed".
- The balance sim now plays the streak too (`--no-streak` to compare): median 105 → 128 for the bot, which is more precise than people.
- Requested by: the user. Built by: Opus 5.5 (plan, integration); Haiku 5.5 subagent (`js/scoring.js`); Sonnet 5.5 subagent (UI); Sonnet 5.5 reviewed (nothing serious). Commit: `18dd72a`.

## 2026-10-14 (evening): Fairer difficulty curve
- Testers said the game gets far too fast and nobody gets past about 50 walls. A new balance sim (`tools/balance-sim.js`) lets a human-like bot play the real rules; tuned to the testers, it got stuck at a median of 48 with 70 % of crashes in autumn. Cause: the autumn wind pushed the ball further than the gap allowed, while the time between walls had fallen to 0.6 s. → [ADR 0024](decisions/0024-difficulty-curve-by-walls.md)
- Speed, time between walls, gap width and the gap's sideways jump now follow the walls passed and ease toward floors (max ~45 km/h instead of 64). Each season starts with five easier walls. Wind gusts are weaker, build up over autumn and are announced 0.7 s ahead (blinking arrow, leaves drift first). Ice settles instead of swinging. Gravel knocks are lighter and nearly gone on a puddle or ice (tester Luca: "Schotter und Pfütze ist deadly"). Speed lines and blur are rescaled to the new top speed.
- Sim on the new curve: median 105 walls (old: 48), 90 % of runs end before 151, crashes spread over all seasons, no cliff. The wind logic is now one tested function shared by game and sim.
- Requested by: the user. Built by: Opus 5.5 (plan, sim, integration); Haiku 5.5 subagents (curve in `logic.js`, wiring in `main.js`); Sonnet 5.5 reviewed (no critical findings) and wrote the review fixes. Commit: `9125556`.

## 2026-10-14: Lower walls and environment release review
- The user requested lower gabions so the following gap remains easier to see. Basket height is now 1.65 instead of 2.6; the material faces crop to the new dimensions, preserving wire and stone proportions. Added a visibility regression at tight late-game spacing for three phone formats.
- The environment work is prepared on `feat/painted-park-environment` for a reviewed PR to main, including the current icon/start-screen changes already merged on main.
- Requested by: the user. Built by: Codex (GPT-6). Independent review by GPT-6.1 Sol (medium) of `f592a12` found no actionable correctness issues. All 72 tests pass; the browser bundle parses successfully, near-wall screenshots and the current figure-select/Losrollen flow are checked. Hardware FPS/4x CPU throttling remain unverified. Environment implementation: `5403005`; upstream integration: `f592a12`. Release is tracked by the environment PR.

## 2026-10-14: Ground and wall material refinement, visible downhill
- User feedback: ground and walls should resemble the detailed generated references; explicitly chose stronger visible downhill. → [ADR 0023](decisions/0023-painted-materials-and-hill-profile.md)
- Two shared painted material WebPs replace sparse earth dots and flat procedural stones. Earth has embedded gravel, roots, worn patches and leaves; gabions have tightly packed faceted rocks behind fine wire. Larger cached faces, level lids, shaded ends and seasonal snow/vines preserve gap readability. Added material packing script and exact prompts.
- A shared logarithmic hill profile moves all ground objects consistently, while keeping the player position, horizontal scale and collision rules. Ground inverse rows are built only on resize. The ice mask follows the curve; a distant painted forest layer fills the valley transition.
- Validation: 71 tests passing, including projection/inverse and collision-plane anchors. Browser checks in explicit 390×844 and 375×667 game frames, seasonal materials and normal play. Debug fixtures can set width/height independently of the browser pane size. Added art: 93,390 bytes. Real devices and 4x CPU throttling remain unverified.
- Requested by: the user. Built by: Codex (GPT-6), with the built-in Imagegen tool. Uncommitted on `grafik`; not published.

## 2026-10-14: Painted seasonal environment
- Replaced the recoloured park photo with four cropped WebP horizons from the user's new references, without their foreground walls. Shared seasonal palettes connect sky, ground, baskets and foliage. → [ADR 0022](decisions/0022-painted-seasonal-environment.md)
- Built four transparent painted woodland clusters with the built-in Imagegen tool. Cached tree/shrub variants form a denser roadside, with silhouette-shaped depth mist. New basket faces use larger stone shapes, clear dark wire, sunlit rims, spring vines, autumn leaves and winter snow; gap posts stay inside collision bounds.
- Ground tiles now have baked edge shadows, sunlit middles, uneven verges and a continuous winter track. The image preparation script and complete prompt set live in `tools/build-environment.py` and `assets/environment/README.md`.
- Eight new WebPs total 898,616 bytes. Old full-resolution references are not loaded by the game. Changes remain uncommitted on `grafik`; nothing published.
- Validation: 69 tests passing; browser checks at 390×844 across all four seasons and at 375×667. Real-device/4x CPU-throttled performance pending.
- Requested by: the user. Built by: Codex (GPT-6), using the supplied Gemini idea as reference material.

## 2026-10-14 (afternoon): Calmer start screen, no emojis
- The user found the start screen cluttered and the emojis too many. Now: title, one line, the figure cards, one big "Losrollen" button, the three painted power-ups in a compact row, the record. A card only picks the figure; the button (or a tap anywhere else) starts.
- "Wischen zum Lenken" moved out of the start screen into the intro, shown while the figure turns and trips. The seasons line is gone; the season banners explain each season when it comes.
- Emojis removed from the UI: start legend, bottom buttons, game over, leaderboard (ranks are numbers), idea sheet, season and surface banners, HUD season chip, wind hint. The score HUD is hidden on the start screen.
- Found on the way: after a deploy the browser may mix the new `index.html` with cached old CSS/JS for up to 10 minutes (GitHub Pages `max-age=600`). That made the new icons huge for the user. Logged in the backlog.
- Requested by: the user. Built by: Opus 5.5.

## 2026-10-14 (midday): Painted power-up icons, the Storni bottle
- Power-up icons painted with Nano Banana in the gouache style (the user picked them over a glossy 3D set). They float with a glow on the path and replace the emojis in the HUD, the start legend and the banners. The helmet is now the same red bike helmet the figures wear. → [ADR 0020](decisions/0020-painted-powerup-icons-and-storni.md)
- The bottle is now "Storni" (the user's name for it): 1.7 × bigger, glossy brown glass, crown cap, painted label. It lies beside the foot where you can see it. Intro clips re-rendered for both figures.
- New tool `tools/cut-icons.py`; prompts in `assets/src/prompts.md`.
- Codex worked on the environment in the main checkout at the same time, so this was built in a separate worktree on branch `icons`.
- Requested by: the user. Built by: Opus 5.5.

## 2026-10-14 (late morning): Kalle and Tine in the game
- Start screen with figure cards (breathing sprites), choice remembered. Intro: stand, turn, trip over the Sterni, roll; a tap skips. Roll frames follow the spin, helmet clip, dazed clip with stars at game over. Retry skips the intro; "Figur wechseln" returns to the start. → [ADR 0019](decisions/0019-figure-select-and-intro.md)
- The painted kid (`js/player.js`) is gone. New: `js/figure-select.js`, `js/render-player.js`, `tests/figure.test.js`.
- The idle clip now shows the bottle lying there, so it doesn't pop in at the turn.
- Way of working, as the user asked: Opus 5.5 planned and split the work; four Haiku 5.5 subagents wrote the modules in parallel (no shared files); a Sonnet 5.5 code review found a keyboard focus bug, a stale world after changing the figure, missing load feedback, decode hitches and a short-screen overflow; two Haiku agents fixed them. Opus checked the flow in headless Chrome at 390×844 and 375×667 and placed the standing clips on the ball's ground spot. Frame times in headless Chrome at 4x CPU throttling: steady 16.7 ms (60 fps); at 6x single spikes.
- Requested by: the user. Built by: Opus 5.5 with Haiku 5.5 and Sonnet 5.5 subagents.

## 2026-10-14 (morning): Figure sprites rendered in the original look
- The user picked look B: the models' own materials (PBR), no toon outline. Opus rendered all clips for both figures (`LOOK=pbr`) and packed them: 14 WebP sheets, ~1.1 MB in total, ~0.55 MB per figure.
- Fix: the roll clips moved the root after the pose without re-skinning, so the body orbited the ball centre and the helmet floated off the head. `render.py` now re-skins after moving the root.
- Not yet wired into the game. Requested by: the user. Built by: main session (Opus 5.5).

## 2026-10-14 (night/morning): Figures as rigged 3D models
- The user asked how to get 3D models without paying for Tripo. Opus first built both figures by script in Blender (`tools/blender/toon.py` kit: lofted parts, toon shader, outline, pivot-empty rig) and checked them against the model sheets with a 50 % overlay (`tools/blender/compare.py`). The user was not satisfied with the look.
- The user then built new models of Kalle and Tine with Codex and Blender via blender-mcp and handed them over. Opus decimated them (`tools/blender/prep-glb.py`), rigged them by script without an armature (`tools/blender/skinned.py`), and rendered test poses from the game camera in two looks (toon with outline, original PBR). → [ADR 0018](decisions/0018-rigged-figures-to-sprites.md)
- Render pipeline ready but not yet run on the new models: `tools/blender/render.py` (clips select, idle, turn, trip over a "Sterni" bottle — the user's choice —, roll, roll with helmet, dazed; auto framing with a ball-centre anchor) and `tools/build-sprites.py` (WebP sheets, `js/figure-sheets.js`).
- Style samples A and B saved to `assets/src/`. The TRELLIS proof of concept `tools/blender/kalle-poc.py` was removed.
- Work is on branch `grafik`, not merged, nothing live.
- Requested by: the user. Built by: main session (Opus 5.5).

## 2026-10-14: Image generation set up, style samples
- `tools/gen-image.js` generates images through OpenRouter; `tools/serve.js` replaces the throwaway local server. → [ADR 0013](decisions/0013-ai-image-generation-via-openrouter.md)
- Three style samples of the same scene (low-poly, painted, flat vector) made with Nano Banana 2 for the user to choose from.
- New rule from the user: the game must stay fast on most phones and ready for iOS/Android apps. Written into engineering-principles.md.
- The user picked the painted style B, with cherry blossoms in spring from A. → [ADR 0014](decisions/0014-painted-art-style.md), [art-bible.md](art-bible.md)
- Three concepts for a new rolling figure (raincoat, hoodie, tracksuit) were made with Nano Banana 2.
- The user asked for "Berliner Atzen". Techno-Tine and Kalle vom Kiez were drafted, then made again with Nano Banana 2.1 directly from Google with the user's new key. → [ADR 0015](decisions/0015-nano-banana-direct-from-google.md)
- The user decided: both figures playable, picked at the start; animated with frame sheets. First sheet test for Kalle with Nano Banana 2.1.
- Animation pipeline: the AI draws 8 key poses in one sheet, then in-betweens frame by frame (two neighbours as references): 8 → 16 → 32 roll frames per figure. Plus a 16-frame stumble from standing into the roll (the user's idea for the start) and 12-frame crash sheets. `tools/gen-image.js` got `--aspect` and `--size` (Google only).
- The user found the AI frame animations too choppy and switched to Blender. Proof of concept `tools/blender/kalle-poc.py`: Kalle built from primitives with pivot joints, toon shader and outline, poses stand → trip → flail → tuck → ball, rendered as a 24-frame fall and a 32-frame roll (rolling is a pure rotation, so any frame count is smooth).
- Character pipeline agreed (ADR 0016). Model sheets for Tine and Kalle (4 views each) made and stored in `assets/src/characters/`.
- Tripo turned out to be blocked: the API wallet is empty, and the free web plan has no Multi-View and no export. The user generated Kalle on the free plan but could not export.
- Switched to TRELLIS.2 on Microsoft's free Hugging Face Space (ADR 0017): Kalle as a textured GLB in 49 s, stored as `assets/src/characters/kalle.glb`. Tools: `tools/gen-3d.py`, `tools/blender/view-glb.py`.
- Requested by: the user. Built by: main session (Opus 5.5).

## 2026-10-13: Docs and principles
- Added `.docs/` (this folder), ADRs 0001–0012 and the engineering principles (KISS, YAGNI, small modules).
- Requested by: the user. Built by: main session.

## 2026-10-13: Colored power-ups, stackable helmets (`54f0ed7`)
- User feedback: after the graphics update all pickups looked yellow and you couldn't tell them apart.
- Each power-up got its own color and a drawn symbol: helmet red, slow-mo blue, wider gaps green. The bubbles are 30% larger and the HUD chips match.
- Helmets stack as extra lives up to 3. The HUD shows one icon per helmet. → [ADR 0011](decisions/0011-powerup-colors-and-helmet-stacking.md)
- Built by: main session.

## 2026-10-12/13: Graphics polish (`3bd4d3d`, merge `23ed99d`, `bedeccd`)
- 3D gabion blocks with top and side faces, roadside trees and bushes per season, a horizon tree line, season light, a new kid sprite with squash and stretch, speed lines, debris and pickup effects.
- Review fixes: the kid is painted once and rotated, the color grade is half resolution and primed, fewer per-frame allocations, CSS scoped, render code split into `render.js`, `render-fx.js`, `render-slip.js` and `view.js`. The path now stands out clearly from the grass in autumn.
- Built by: agent on Opus (xhigh effort). Reviewed by: Sonnet 5.5 code reviewer. Merge conflicts resolved by: main session. → [ADR 0009](decisions/0009-graphics-paint-once.md)

## 2026-10-12: Ground surfaces (`c2de58c`, `151c075`, merge `c4e3a8f`)
- From player idea issue #2 (Hendrik). Dirt, gravel (bumpy, random kicks) and grass (×0.9 speed) in stretches of 120–220 units. Textures are procedural per season, with mip levels, drawn one strip per screen row.
- Review fixes: frame-rate independent kicks, texture wrap/flip/mip bugs, fewer banners, lazy tile building.
- Built by: Sonnet 5.5 agent. Reviewed by: Sonnet 5.5. → [ADR 0007](decisions/0007-ground-surfaces-as-tiles.md)

## 2026-10-12: Visible slipperiness (`e19cc89`, `4ae75a2`, merge `3fc4e54`)
- From issue #2. Ice sheen on the path in winter, skid marks, snow and water spray, the kid leans into slides, wetter puddles, a "Rutschig!" banner.
- Review fixes: sheen clipped to the path, no stray line between slides, cached gradient, ctx state restored.
- Built by: Sonnet 5.5 agent. Reviewed by: Sonnet 5.5. → [ADR 0008](decisions/0008-slip-visuals-as-layer.md)

## 2026-10-12: Leaderboard and worker hardening (`5af66c4`, `db264c6`, merge `d64efa0`, `2f92cc0`)
- Shared top 20 in Workers KV, one entry per name, submit after game over, view from the start screen.
- Worker hardening from the security scan: JSON only, 4 KB limit, a daily idea cap, no localhost in production, preflight caching.
- Built by: Sonnet 5.5 agent. Reviewed by: Sonnet 5.5. KV namespace created and worker deployed by: main session, with user approval. → [ADR 0006](decisions/0006-leaderboard-on-kv.md)

## 2026-10-12: Security scan and fixes (`e62360d`)
- The scan found no critical or high issues. It found two medium ones: markdown injection in issues, and weak spam limits.
- Fixed: idea text goes into a code block, names lose markdown and URLs, the season must be one of the four, scores are capped, the banner uses `textContent`, plus a CSP and no-referrer meta tag.
- Scan by: Sonnet 5.5 security reviewer. Fixes by: main session. → [ADR 0005](decisions/0005-security-baseline.md)

## 2026-10-12: Parallel agent workflow
- The user asked for five agents in separate worktrees, each with a code reviewer. → [ADR 0010](decisions/0010-parallel-agents-with-review.md)

## 2026-10-11/12: Idea button (`ee1d83c`, `e217f0a`, `896820b`)
- 💡 button with a bottom sheet. A Cloudflare Worker files ideas as GitHub issues labeled `idee`.
- Getting it running took several steps: wrangler login, then email verification, then a token missing `Issues: write`.
- Mistake: the wrangler cache file (Cloudflare account id and account name with email) was committed and removed in the next commit. It is still in the history (`e217f0a`). The user accepted the risk; the file holds no secret.
- Built by: main session. Hosting chosen by: the user. → [ADR 0004](decisions/0004-ideas-via-cloudflare-worker.md)

## 2026-10-11: First playable version (`cdd2f4f`)
- Built from the user's photo of the hill path with gabion walls (`IMG_0797.HEIC`, not in git).
- Pseudo-3D canvas game: walls come toward the player, swipe to steer, 3 power-ups, rising speed, 4 seasons with their own mechanics, highscore in `localStorage`.
- Deployed to GitHub Pages. The user chose that host.
- Built by: main session. → [ADR 0001](decisions/0001-static-site-no-build.md), [0002](decisions/0002-canvas-pseudo-3d-from-photo.md), [0003](decisions/0003-github-pages-hosting.md)
