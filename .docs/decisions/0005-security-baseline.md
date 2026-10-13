# 0005: Security baseline for page and worker

- **Status:** Accepted
- **Date:** 2026-10-12
- **Decided by:** Claude Opus 5.5, based on a scan by a Sonnet 5.5 security-review agent; the user approved the fixes
- **Built by:** Claude Opus 5.5 (idea/markdown/CSP), Sonnet 5.5 agent (worker limits)
- **Commits:** `e62360d`, `db264c6`

## Context
The security scan found no critical or high issues. Medium: player text rendered as live markdown in issues (phishing or tracking links), and weak spam protection.

## Decision
- **Issues:** the idea text goes in a code block that is always longer than any backtick run inside it. Names lose markdown characters, line breaks and `://`. The season must be one of four known names, and the score is capped.
- **Worker:** the origin allowlist is the production site only (dev origins via the `DEV_ORIGINS` env var). JSON only (415) and at most 4 KB (413). Rate limits: 5 ideas per hour per IP and 100 per day in total (KV counter), 20 scores per hour per IP. Errors to the client are generic.
- **Page:** a CSP meta tag (own files plus the worker), `referrer: no-referrer`, and user text only via `textContent`.

## Alternatives
- Cloudflare Turnstile (captcha): stronger, but more friction and setup. Not needed yet.
- Durable Objects for exact rate limits: overkill.

## Consequences
- Spam is still possible from many IPs, but capped per day. If it happens, rotate the token or pause the worker.
- Testing locally against the live worker isn't possible, because localhost is rejected. Use a local harness with `DEV_ORIGINS`.
