# Backlog

Open work and known weak spots. Remove an entry in the commit that fixes it.

## Open questions for the user
- Close issue #2 (Hendrik: slippery look, different ground)? Both parts shipped on 2026-10-12.

## Next up: graphics overhaul (started 2026-10-14)
- The user finds the current look "trashy" and wants real graphics.
- Plan: Nano Banana (Gemini image API) for backgrounds, scenery, icons and the app icon; Blender run headless with scripts in the repo for the kid (rotation frames), walls and pickups. Assets as WebP; the paint-once architecture stays.
- First step: 2–3 style samples of the same scene (low-poly Blender, painted after the photo, flat vector). The user picks one, then we write `.docs/art-bible.md` and an ADR.
- Tools are ready: OpenRouter key and Blender 5.2 (ADR 0013). Style B chosen (ADR 0014). Figures: Techno-Tine and Kalle vom Kiez. The user wants both, chosen on the start screen, and wants real animation (roll cycle, crash). Draft animations exist for both: 16-frame stumble into the roll at the start, 32-frame roll loop, 12-frame crash. Raw frames live in the session scratchpad only; final assets must be rebuilt into `assets/` with a repo script (cut, key out magenta, align, WebP atlas). The user found them too choppy; now testing Blender (proof of concept in `tools/blender/kalle-poc.py`). Open: better 3D models (image-to-3D like Tripo/Meshy, or hand-modelled), matching the painted style, crash animation in 3D. Then the scene style samples.
- Also proposed: `.docs/pillars.md` (game pillars), a safe-area check for iOS, and a deny list in `.claude/settings.json`. Ideas taken from donchitos/claude-code-game-studios (MIT); the studio itself is not adopted (KISS).
- Path to iOS: PWA first, then wrap with Capacitor. Write an ADR when it starts.

## Tech debt
- `js/main.js` is ~510 lines, over the ~400 guideline. Split it when the next feature touches it: input, HUD and game state.
- Agent worktrees remain in `.claude/worktrees/` (ignored by git). They can be deleted.
- No browser test scripts in the repo; screenshots now use the desktop app's browser pane with `tools/serve.js`.

## Known limits (accepted)
- **Scores can be faked.** The client reports them. Fine among friends; see ADR 0006.
- **The leaderboard can lose updates** when two people submit within about 60 s (KV read-modify-write, eventual consistency).
- **Per-IP rate limits are per worker isolate**, so they are soft. The daily idea cap in KV is the real backstop.
- The wrangler cache file with the Cloudflare account id is in git history (`e217f0a`). It holds no secret.
- `index.html#debug` exposes `window.rollDown` in production. Harmless: it only gives access to a game you can already play.

## Not yet verified
- Never tested on a real phone (only headless Chrome at iPhone size). Check iOS Safari above all.
- On phones without a GPU canvas, a frame takes about 50–70 ms at 4x CPU throttling, measured in headless Chrome.

## Reminders
- The GitHub token needs an expiry date (e.g. 90 days) plus a calendar reminder to rotate it.
- Keep 2FA on for GitHub and Cloudflare.
