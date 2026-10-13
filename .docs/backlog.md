# Backlog

Open work and known weak spots. Remove an entry in the commit that fixes it.

## Open questions for the user
- Close issue #2 (Hendrik: slippery look, different ground)? Both parts shipped on 2026-10-12.

## Next up: graphics overhaul (started 2026-10-14)
- The user finds the current look "trashy" and wants real graphics.
- Plan: Nano Banana (Gemini image API) for backgrounds, scenery, icons and the app icon; Blender run headless with scripts in the repo for the kid (rotation frames), walls and pickups. Assets as WebP; the paint-once architecture stays.
- First step: 2–3 style samples of the same scene (low-poly Blender, painted after the photo, flat vector). The user picks one, then we write `.docs/art-bible.md` and an ADR.
- Tools are ready: OpenRouter key and Blender 5.2 (ADR 0013). Style B chosen (ADR 0014). Figures: Techno-Tine and Kalle vom Kiez. The user wants both, chosen on the start screen, and wants real animation (roll cycle, crash). Draft animations exist for both: 16-frame stumble into the roll at the start, 32-frame roll loop, 12-frame crash. Raw frames live in the session scratchpad only; final assets must be rebuilt into `assets/` with a repo script (cut, key out magenta, align, WebP atlas). Pipeline in ADR 0016. Model sheets done. Blocked on Tripo (2026-10-14):
  - The API wallet has 0 credits. The user's 200 credits are in the web studio.
  - The free web plan locks Multi-View and 3D model exports. "HD Model" with H3.1 costs 55 credits and is public by default.
  - Options for the user: (A) Tripo Pro for one month (~$20), (B) buy API credits on platform.tripo3d.ai (~110 needed for two figures), (C) no Tripo, refine the Blender primitives figure instead.
  - Waiting for the user's choice. Do not generate on the free plan; credits would be lost without an export.
- Then: Blender animation and render (ADR 0016 steps 3–5), Kalle first and Tine after.
- Then: scene style samples. Prompts were drafted with the user: spring with Tine and cherry blossoms, summer with Kalle and picnics, autumn wind, winter with snow and sledges, start screen with figure select, game over.
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
