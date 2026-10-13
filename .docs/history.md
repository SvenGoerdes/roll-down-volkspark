# History

Newest first. "Built by" names the model that wrote the code. "Main session" is Claude Opus 5.5 (1M context), which talks to the user, plans, merges and deploys. Agents ran in their own git worktrees. Decisions are in [decisions/](decisions/).

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
- Tripo turned out to be blocked: the API wallet is empty, and the free web plan has no Multi-View and no export. The user is choosing between Pro, API credits, or Blender only (see backlog).
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
