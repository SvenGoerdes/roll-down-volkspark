# Decisions (ADRs)

One file per decision. Never edit an old decision. Write a new ADR and mark the old one `Superseded by NNNN`. New ones start from [TEMPLATE.md](TEMPLATE.md).

| # | Decision | Decided by |
|---|---|---|
| [0001](0001-static-site-no-build.md) | Static site, vanilla JS modules, no build step | Opus 5.5 |
| [0002](0002-canvas-pseudo-3d-from-photo.md) | Canvas 2D pseudo-3D built around the user's photo | Opus 5.5 |
| [0003](0003-github-pages-hosting.md) | GitHub Pages from a public repo | User |
| [0004](0004-ideas-via-cloudflare-worker.md) | Ideas → GitHub issues via Cloudflare Worker | User (host), Opus 5.5 (design) |
| [0005](0005-security-baseline.md) | Security baseline for page and worker | Opus 5.5 after Sonnet 5.5 scan |
| [0006](0006-leaderboard-on-kv.md) | Leaderboard in one Workers KV key | User (feature), Opus 5.5 (storage) |
| [0007](0007-ground-surfaces-as-tiles.md) | Ground surfaces as pre-rendered tiles | User (feature), Sonnet 5.5 (design) |
| [0008](0008-slip-visuals-as-layer.md) | Slipperiness as an extra drawing layer | User (feature), Sonnet 5.5 (design) |
| [0009](0009-graphics-paint-once.md) | Graphics with paint-once sprites | User (feature), Opus xhigh agent (design) |
| [0010](0010-parallel-agents-with-review.md) | Parallel agents in worktrees with review | User |
| [0011](0011-powerup-colors-and-helmet-stacking.md) | Color-coded power-ups, stackable helmets | User |
| [0012](0012-docs-and-engineering-principles.md) | Docs in `.docs`, ADRs, KISS | User |
| [0013](0013-ai-image-generation-via-openrouter.md) | AI image generation via OpenRouter, Nano Banana first | User (models), Opus 5.5 (script) |
| [0014](0014-painted-art-style.md) | Hand-painted art style, cherry blossoms in spring | User |
| [0015](0015-nano-banana-direct-from-google.md) | Nano Banana 2.1 directly from Google, others via OpenRouter | User (model), Opus 5.5 (route) |
