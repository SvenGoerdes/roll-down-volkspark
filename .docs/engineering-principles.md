# Engineering principles

Agreed on 2026-10-13 (see [ADR 0012](decisions/0012-docs-and-engineering-principles.md)).

## KISS first

- Pick the simplest thing that works for a hobby game played by friends. No framework, no build step, no backend we don't need.
- Prefer one obvious solution over a configurable one.
- Accept known limits when the cost of fixing them is high and the risk is low (e.g. scores can be faked). Write the limit down in `backlog.md` or the ADR instead.

## YAGNI

- Build what was asked. Ideas for more go to `backlog.md`, not into the code.
- No abstractions "for later". Add them when the second real use shows up.

## Small, focused modules

- One job per file. Keep files under ~400 lines; split by job, not by type.
- Pure rules live in `logic.js` (or `worker/src/*.js`) and have unit tests. Drawing and DOM code stays thin.
- `config.js` holds tuning numbers, so balancing doesn't mean hunting through code.

## Performance on phones

- Paint expensive things once, then blit. No gradients, big canvases or per-pixel work inside the frame loop.
- Measure with CPU throttling before claiming it's fast.

## Safety

- Never put secrets in the repo or the browser. Tokens live in Cloudflare secrets, scoped to the minimum.
- Treat every input from players as hostile: validate on the server, render with `textContent`, keep markdown inert.

## Testing

- `bun test tests` must pass before every commit.
- Test pure logic with unit tests. Check visuals with phone-size screenshots in a real browser.
- Say what wasn't tested (e.g. real devices).

## Workflow

- Small commits, conventional messages (`feat:`, `fix:`, `perf:`, `chore:`, `docs:`).
- Bigger features: build on a branch, get a code review, fix blocking findings, then merge.
- Deploy the worker before the frontend that depends on it.
- Ask before anything outward-facing that is hard to undo (new public resources, force pushes, deleting data).
- Update `.docs` in the same commit as the change.
