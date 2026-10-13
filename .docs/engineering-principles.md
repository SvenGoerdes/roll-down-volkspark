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

The game must run smoothly on most phones, including mid-range Android and older iPhones, not just new ones. Later it ships as an iOS and Android app (user, 2026-10-14). Every change is checked against that.

- Paint expensive things once, then blit. No gradients, big canvases or per-pixel work inside the frame loop.
- Measure with CPU throttling (4x) before claiming it's fast. Target 60 fps, never below 30.
- **Art budget:** images ship as WebP, scaled to the largest size they appear on screen at DPR 2 (no 4K sources in the repo). Keep all game images together under ~2 MB, and load only the current season's large images up front.
- Draw images at their own size or from pre-scaled copies; avoid scaling big images every frame.
- **App-ready:** stay a plain web app (HTML, JS, assets, no server rendering) so Capacitor or a similar wrapper can ship it to iOS and Android unchanged. Respect safe areas (notch, home bar), touch only, no hover-dependent UI, work offline once loaded.

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
