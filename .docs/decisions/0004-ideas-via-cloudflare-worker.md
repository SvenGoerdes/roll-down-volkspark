# 0004: Player ideas become GitHub issues through a Cloudflare Worker

- **Status:** Accepted
- **Date:** 2026-10-11
- **Decided by:** the user (Cloudflare, from options Cloudflare / Supabase / Vercel); the design was proposed by Claude Opus 5.5
- **Built by:** Claude Opus 5.5 (main session)
- **Commits:** `ee1d83c`, `e217f0a`, `896820b`

## Context
Friends should send ideas from inside the game. They land in a GitHub backlog to go through now and then. A static site can't hold a GitHub token.

## Decision
A 💡 button opens a form, which POSTs to a Cloudflare Worker. The worker creates an issue labeled `idee` using a fine-grained PAT stored as a worker secret. The PAT covers only this repo with Issues read/write.

## Alternatives
- A prefilled GitHub "new issue" link: every friend would need a GitHub account.
- A Supabase edge function: free projects pause when idle. The user's other project was paused at the time.
- A Vercel function: fine too, but the user picked Cloudflare.
- A classic PAT with `public_repo`: works, but its scope is too broad.

## Consequences
- The token never reaches the browser, and the backlog is plain GitHub issues.
- Setup took several manual steps: Cloudflare login, email verification, token permissions.
- The public endpoint can be spammed. Mitigations are in ADR 0005.
