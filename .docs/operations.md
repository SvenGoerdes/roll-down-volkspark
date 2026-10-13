# Operations

## Run locally

```sh
bun test tests                    # all unit tests (logic, worker, scores, scenery)
```

Serve the folder with any static server that handles parallel requests. **Don't use `python3 -m http.server`.** It drops module requests (backlog of 5), and the game then fails to start without a clear error. A minimal bun server:

```js
// serve.js — bun serve.js .
const root = process.argv[2];
Bun.serve({ port: 8765, fetch(req) {
  let p = new URL(req.url).pathname; if (p.endsWith('/')) p += 'index.html';
  return new Response(Bun.file(root + decodeURIComponent(p)), { headers: { 'Cache-Control': 'no-store' } });
} });
```

Open `http://127.0.0.1:8765/#debug` to get `window.rollDown` for scripted tests. Locally the leaderboard and idea button show "Keine Verbindung": the worker only accepts the real site's origin. This is expected.

Visual checks so far used headless Chrome over the DevTools protocol (Python + `websocket-client`) to take phone-size screenshots (390×844, DPR 2). These scripts lived in the session scratchpad, not in the repo.

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
