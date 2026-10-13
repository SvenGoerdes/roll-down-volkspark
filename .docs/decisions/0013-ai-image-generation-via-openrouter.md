# 0013: AI image generation via OpenRouter

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decided by:** user (OpenRouter, Nano Banana first, Sunburst for top quality); Opus 5.5 (script design)
- **Built by:** main session (Opus 5.5)
- **Commits:** see history.md, 2026-10-14

## Context
The user finds the current look "trashy": a real photo behind cartoon sprites drawn in code. They want generated art. They have an OpenRouter key; the Gemini key alone has no image quota on the free tier.

## Decision
Generate art with `tools/gen-image.js`, one image per call through OpenRouter. The default model is Nano Banana (Google). Switch to `openai/gpt-image-2.5-sunburst` only for assets that need top quality. The key lives in the user's `~/.zshrc` as `OPENROUTER_API_KEY` with a $5 credit limit, never in the repo. Blender 5.2 (headless, scripts in the repo) is available for 3D assets that need consistent angles or frames.

Benchmark basis (Artificial Analysis text-to-image, Oct 2026): GPT Image 2.5 Sunburst Elo 1199 (~$0.21/image), Nano Banana 2.1 1159 (~$0.034), Nano Banana 2 1125 (~$0.067).

## Alternatives
- Gemini API directly: needs Google billing set up; same models.
- Only Sunburst: best quality, but six times the price for a hobby game.
- Hand-drawn art: no artist on the project.

## Consequences
- Generated images are inputs. They are cut, scaled and compressed before they ship (see the mobile budget in engineering-principles.md).
- `google/gemini-nano-banana-2.1` was rate-limited in OpenRouter's shared Google pool for all of 2026-10-14. We used Nano Banana 2 (`google/gemini-3.1-flash-image`) instead. The script retries 429s with backoff.
- Generated images vary. Keep the prompts next to the assets so we can regenerate in the same style.
