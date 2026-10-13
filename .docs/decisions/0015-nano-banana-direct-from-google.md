# 0015: Nano Banana 2.1 directly from Google

- **Status:** Accepted (changes the default model route of ADR 0013)
- **Date:** 2026-10-14
- **Decided by:** user (wants Nano Banana 2.1); Opus 5.5 (route)
- **Built by:** main session (Opus 5.5)
- **Commits:** see history.md, 2026-10-14

## Context
On OpenRouter, Nano Banana 2.1 is only offered through Google's shared pool, and every call answered 429 all day. The user then set up a new Gemini key with billing.

## Decision
`tools/gen-image.js` calls Google directly by default (`gemini/gemini-nano-banana-2.1`, key `GEMINI_API_KEY`). Any other model id still goes through OpenRouter, e.g. `openai/gpt-image-2.5-sunburst`.

## Alternatives
- BYOK on OpenRouter: also works, but adds a second place to manage the key.

## Consequences
- Two keys in the user's `~/.zshrc`: `GEMINI_API_KEY` (Google billing) and `OPENROUTER_API_KEY` ($5 limit).
- Google does not report cost per call; check usage in the Google Cloud console.
