# Operations

## Run locally

```sh
bun test tests                    # all unit tests (logic, worker, scores, scenery)
```

Serve the folder with `bun tools/serve.js` (http://127.0.0.1:8765). **Don't use `python3 -m http.server`.** It drops module requests (backlog of 5), and the game then fails to start without a clear error.

Open `http://127.0.0.1:8765/#debug` to get `window.rollDown` for scripted tests. Locally the leaderboard and idea button show "Keine Verbindung": the worker only accepts the real site's origin. This is expected.

Visual checks so far used headless Chrome over the DevTools protocol (Python + `websocket-client`) to take phone-size screenshots (390×844, DPR 2). These scripts lived in the session scratchpad, not in the repo.

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

## Deploy

**Game:** push to `main`. GitHub Pages builds from `main` at the root and is live after about a minute.

**Worker:** deploy the worker **before** pushing a frontend that needs new worker routes.

```sh
cd worker
npx wrangler deploy
npx wrangler tail --format pretty   # live logs, e.g. GitHub API errors
```

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
