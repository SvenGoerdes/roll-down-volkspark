# Backlog

Open work and known weak spots. Remove an entry in the commit that fixes it.

## Open questions for the user
- Close issue #2 (Hendrik: slippery look, different ground)? Both parts shipped on 2026-10-12.

## Next up: graphics overhaul (started 2026-10-14)
- The user finds the current look "trashy" and wants real graphics.
- Plan: Nano Banana (Gemini image API) for backgrounds, scenery, icons and the app icon; Blender run headless with scripts in the repo for the kid (rotation frames), walls and pickups. Assets as WebP; the paint-once architecture stays.
- First step: 2–3 style samples of the same scene (low-poly Blender, painted after the photo, flat vector). The user picks one, then we write `.docs/art-bible.md` and an ADR.
- Tools are ready: OpenRouter key and Blender 5.2 (ADR 0013). Style B chosen (ADR 0014). Figures: Techno-Tine and Kalle vom Kiez. The user wants both, chosen on the start screen, and wants real animation (roll cycle, crash). Draft animations exist for both: 16-frame stumble into the roll at the start, 32-frame roll loop, 12-frame crash. Raw frames live in the session scratchpad only; final assets must be rebuilt into `assets/` with a repo script (cut, key out magenta, align, WebP atlas). Pipeline in ADR 0016. Model sheets done. Kalle's 3D model exists (TRELLIS.2, ADR 0017). Its back texture lacks the mustard panels and the sunglasses became clear glasses; fix it in the texture or retry with another seed.
- **Status 2026-10-14, branch `grafik`:** Kalle and Tine are in the game (ADR 0018, 0019): figure select, intro, roll, helmet, dazed. Not merged yet; needs the user's look in a real phone browser, then merge to main (= live).
- Check on a real phone: 60 fps with the sprite sheets, memory (~25 MB decoded per figure), the intro timing.
- `assets/src/characters/kalle.glb` (TRELLIS) and `tools/gen-3d.py` are superseded; delete when the new figures ship.
- Environment images (backgrounds per season, tree lines, grass, gabion wall, pickups, start and game-over art) with Nano Banana 2.1: the user allowed up to $2. Not started.
- Then: scene style samples. Prompts were drafted with the user: spring with Tine and cherry blossoms, summer with Kalle and picnics, autumn wind, winter with snow and sledges, start screen with figure select, game over.
- Also proposed: `.docs/pillars.md` (game pillars), a safe-area check for iOS, and a deny list in `.claude/settings.json`. Ideas taken from donchitos/claude-code-game-studios (MIT); the studio itself is not adopted (KISS).
- Path to iOS: PWA first, then wrap with Capacitor. Write an ADR when it starts.

## Tech debt
- **Mixed versions after a deploy:** GitHub Pages lets browsers cache every file for 10 minutes, so right after a deploy a new `index.html` can meet old CSS or JS (seen 2026-10-14: huge icons, old pickups). A crash is possible when new code imports something an old cached module lacks. Fix idea: a small build step that stamps a version into all file URLs, or a service worker that updates all files together.
- The `icon` emoji fields in `SEASONS` and `SURFACES` (`js/config.js`) are no longer shown. Remove them once Codex's environment work (which edits the same lines) has landed.
- `js/main.js` is ~600 lines, well over the ~400 guideline. Split it next: input, HUD, states (start/intro/over flow).
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
