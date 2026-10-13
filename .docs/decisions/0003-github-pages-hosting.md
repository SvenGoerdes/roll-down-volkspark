# 0003: Host on GitHub Pages from a public repo

- **Status:** Accepted
- **Date:** 2026-10-11
- **Decided by:** the user (from options GitHub Pages / Vercel / not yet)
- **Built by:** Claude Opus 5.5 (main session)
- **Commits:** `cdd2f4f`

## Context
The site has to be shareable with friends via one link, cheaply and simply.

## Decision
A public repo `SvenGoerdes/roll-down-volkspark`. Pages serves `main` at the root, so every push deploys.

## Alternatives
- Vercel: private repo possible, but one more account and tool.

## Consequences
- Free, zero config, and the deploy is just `git push`.
- The repo is public, so never commit secrets. The original HEIC (with GPS) stays out of git via `.gitignore`.
- Pages can't set HTTP headers, so the CSP lives in a meta tag (see ADR 0005).
