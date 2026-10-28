# Operations

## Run locally

```sh
bun test tests                    # all unit tests (logic, worker, scores, scenery)
bun tools/balance-sim.js          # a bot plays 600 runs: median, crash share per season, crash rate per wall
bun tools/balance-sim.js --no-streak   # same without the streak helmet (ADR 0025)
```

Run the balance sim after changing the difficulty curve in `js/logic.js` or the steering physics in `js/main.js` (ADR 0024). It copies the physics, so change both together.

Serve the folder with `bun tools/serve.js` (http://127.0.0.1:8765). **Don't use `python3 -m http.server`.** It drops module requests (backlog of 5), and the game then fails to start without a clear error.

Open `http://127.0.0.1:8765/#debug` to get `window.rollDown` for scripted tests. Locally the leaderboard and idea button show "Keine Verbindung": the worker only accepts the real site's origin. This is expected.

Visual checks so far used headless Chrome over the DevTools protocol (Python + `websocket-client`) to take phone-size screenshots (390×844, DPR 2). These scripts lived in the session scratchpad, not in the repo.

Sightseeing #28 now has a reproducible local check (macOS Chrome, Python `websocket-client` and Pillow): `python3 tools/check-sightseeing.py --port 8765`. Use the actual local server port (8773 in the sightseeing worktree). It writes numbered real-game screenshots, three sprite close-ups, failure/retry checks and a 4×-CPU render measurement under `.claude/review/28/`. The browser uses its own temporary profile and blocks production worker requests; no leaderboard writes. Game-loop stepping is controlled, while deferred art/tile preparation still runs normally. This does not replace real-device testing.

## Performance check (#15)

```sh
bun tools/perf-check.mjs [--seconds 8] [--skip 36] [--port 8791] [--url http://host/]
```

Starts its own static server, opens the game in macOS Chrome at 390×844, DPR 2, CPU 4× slower, and plays Volkspark and Berlin-Tour for a few seconds each (a bot steers through the gaps and keeps the helmets full). It prints frame gap (median, p95, max) from real `requestAnimationFrame` and the cost of the game's own `step()` (update + render) in ms. `--skip` starts that many walls in, so Volkspark shows its landmark walls (#81). Playwright installs itself on first run under bun; there is no `package.json`. The production worker is blocked, no scores are written. Frame gap is capped near 16.7 ms by the display, so watch p95 and the update+render cost: on a 60 Hz screen, a cost near 16 ms under the 4× throttle means dropped frames. The throttle is a rough stand-in for a mid-range phone; it does not replace a real device. No CI use.

## Generate images

```sh
GEMINI_API_KEY=… OPENROUTER_API_KEY=… bun tools/gen-image.js out.png "prompt" --ref assets/park.jpg [--model openai/gpt-image-2.5-sunburst]
```

Default is Nano Banana 2.1 straight from Google (`GEMINI_API_KEY`, Google billing). Other model ids go through OpenRouter (`OPENROUTER_API_KEY`, limit $5). Both keys are in the user's `~/.zshrc`. See ADR 0013 and 0015. Blender 5.2 is at `/Applications/Blender.app/Contents/MacOS/Blender` (run with `-b -P script.py`). See ADR 0013.

## Environment assets (ADR 0022)

`python3 tools/build-environment.py` rebuilds the four runtime horizons from
`assets/seasons/` (Pillow required). Add `--forest-source <directory>` to repack the
original transparent forest PNGs; source mapping and the complete prompt set are
in `assets/environment/README.md`. No paid API is used by this packing script.

`python3 tools/build-surface-art.py --source <original Imagegen directory>` repacks
the earth and gabion material PNGs. Exact prompts and source mapping are recorded
in `assets/environment/material-prompts.json` and that folder's README.md.

Visual fixture: `http://127.0.0.1:8765/?preview=spring#debug`. Other seasons:
`summer`, `autumn`, `winter`; optional `&surface=gravel` or `&surface=grass`.
The view is frozen with consistent walls for comparisons. Add `&width=390&height=844` or `&width=375&height=667` for exact game-frame dimensions (the in-app browser sometimes reports a different layout viewport from its capture size). Use `/#debug` for real play.

## Generate 3D models

```sh
python3 tools/gen-3d.py assets/src/characters/kalle-front.jpg out.glb [seed]   # TRELLIS.2, free HF Space
/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/view-glb.py -- out.glb preview
```

Needs `pip install gradio_client`. See ADR 0017 (superseded for the figures by ADR 0018).

## Figure sprites (ADR 0018)

```sh
B=/Applications/Blender.app/Contents/MacOS/Blender
$B -b -P tools/blender/prep-glb.py -- <model.glb> assets/src/characters/kalle-3d.glb   # once per new model
$B -b -P tools/blender/render.py -- kalle /tmp/frames/kalle poses     # quick rig check
LOOK=pbr $B -b -P tools/blender/render.py -- kalle /tmp/frames/kalle clips     # all clips + meta.json; the game uses LOOK=pbr
python3 tools/build-sprites.py /tmp/frames                            # WebP sheets + js/figure-sheets.js
```

Needs Pillow with WebP. Joint points live in `tools/blender/kalle.py` / `tine.py`.

## Icons from Nano Banana (ADR 0020)

Paint a row of icons on flat magenta with `tools/gen-image.js` (prompts in `assets/src/prompts.md`), then:

```sh
python3 tools/cut-icons.py assets/src/powerups.png assets/powerups helmet slowmo widen   # one name per icon, left to right
```

## Deploy

**Game:** open a PR. CI (`.github/workflows/ci.yml`) runs `bun test tests`; `main` takes only green PRs, and merges need the user's OK (ADR 0026). GitHub Pages builds from `main` at the root and is live after about a minute.

**Worker:** deploy the worker **before** pushing a frontend that needs new worker routes.

```sh
cd worker
npx wrangler deploy
npx wrangler tail --format pretty   # live logs, e.g. GitHub API errors
```

### Turnstile für die Bestenliste einschalten (ADR 0065)

Der Code ist fertig. Ohne Secret prüft der Worker nichts, ohne Sitekey zeigt das Spiel kein Widget: beides darf in beliebiger Reihenfolge live gehen. Schritte, in dieser Reihenfolge:

1. **Widget anlegen:** Cloudflare Dashboard → Turnstile → Add widget. Hostname `svengoerdes.github.io`, Modus „Managed“. Du bekommst einen Sitekey (öffentlich) und ein Secret (geheim).
2. **Secret setzen** (im eigenen Terminal, nie im Chat): `cd worker && npx wrangler secret put TURNSTILE_SECRET`.
3. **Worker deployen:** `cd worker && npx wrangler deploy`. Ab jetzt lehnt `POST /scores` Einträge ohne Token ab, **auch vom alten Frontend**. Deshalb Schritt 4 gleich danach.
4. **Sitekey eintragen:** `TURNSTILE_SITEKEY` in `js/config.js`, PR, CI grün, Merge.

Zwischen Schritt 3 und 4 können Spieler nicht eintragen (Fehlermeldung „Bitte bestätige zuerst, dass du kein Bot bist“). Wer das vermeiden will, macht Schritt 4 vor 2 und 3: das Widget erscheint, der Worker ignoriert das Token noch.

Der Worker prüft zusätzlich, dass Cloudflare als Website `svengoerdes.github.io` und als Aktion `score` meldet (das Widget setzt `action: 'score'`). Sonst 403, kein Eintrag. Beim Widget in Schritt 1 genau diesen Hostnamen eintragen.

Lokal testen: `worker/.dev.vars` (nicht committen) mit `TURNSTILE_SECRET=1x0000000000000000000000000000000AA` und `DEV_ORIGINS=http://127.0.0.1:<Port>`, dann `npx wrangler dev`; im Frontend lokal Sitekey `1x00000000000000000000AA`. Cloudflares Testschlüssel melden Hostname `example.com` und keine Aktion: lokal `TURNSTILE_HOSTNAME=example.com` und `TURNSTILE_ACTION=` (leer) in `.dev.vars` setzen, in Produktion nie. Cloudflares Testschlüssel: Secret `1x…AA` = immer gültig, `2x…AA` = immer ungültig. Abschalten: `npx wrangler secret delete TURNSTILE_SECRET`.

## Infrastructure

| Thing | Value |
|---|---|
| Repo | `SvenGoerdes/roll-down-volkspark` (public, needed for free Pages) |
| Game URL | https://svengoerdes.github.io/roll-down-volkspark/ |
| Worker | `roll-down-ideas`, https://roll-down-ideas.roll-down-ideas.workers.dev |
| KV namespace | `LEADERBOARD`, id `e42cf73197c745cabb3ad460b85e6014` |
| Issue label | `idee` (ideas from the game) |
| Idea backlog | https://github.com/SvenGoerdes/roll-down-volkspark/issues?q=is%3Aopen+label%3Aidee |

## Secrets

| Secret | Where | Scope |
|---|---|---|
| `TRIPO_API_KEY` | User's `~/.zshrc` only | Tripo 3D API (separate wallet from the Tripo web studio). Never in the repo. |
| `GEMINI_API_KEY` | User's `~/.zshrc` only | Nano Banana via Google, billing on. Never in the repo. |
| `OPENROUTER_API_KEY` | User's `~/.zshrc` only | Image generation, credit limit $5. Never in the repo. |
| `TURNSTILE_SECRET` | Cloudflare worker secret | Turnstile-Widget-Secret (aktiviert für `svengoerdes.github.io`, Action `score`). |
| `GITHUB_TOKEN` | Cloudflare worker secret | Fine-grained PAT, only this repo, **Issues: read and write** (+ Metadata read). Nothing else. |

Set or rotate it in your own terminal, never in a chat:

```sh
cd worker && npx wrangler secret put GITHUB_TOKEN
```

If the worker returns 502 on ideas, check `wrangler tail`. A 403 with `issues=write` means the token lacks the Issues permission.

## Handy commands

```sh
gh issue list --label idee                                   # ideas from players
npx wrangler kv key get top --binding LEADERBOARD --remote    # raw leaderboard
npx wrangler kv key delete top --binding LEADERBOARD --remote # reset leaderboard
```
