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
| [0016](0016-character-pipeline-3d-prerendered.md) | Characters: model sheet → Tripo → Blender → sprite sheets | User (Blender, short pipeline), Opus 5.5 (steps) |
| [0017](0017-trellis-instead-of-tripo.md) | TRELLIS.2 via free Hugging Face Space instead of Tripo | User (open source, free), Opus 5.5 (model) |
| [0018](0018-rigged-figures-to-sprites.md) | User's 3D models, rigged by script, rendered to sprite sheets | User (own models), Opus 5.5 (rig, pipeline) |
| [0019](0019-figure-select-and-intro.md) | Figure select, intro (turn, trip, roll), retry without intro | User (flow), Opus 5.5 (details) |
| [0020](0020-painted-powerup-icons-and-storni.md) | Painted power-up icons; the bottle becomes "Storni" | User (style, name), Opus 5.5 (placement) |
| [0022](0022-painted-seasonal-environment.md) | Layered painted seasons, forest clusters, cached atmosphere | User (references), Codex (implementation) |
| [0023](0023-painted-materials-and-hill-profile.md) | Painted earth/gabions and shared descending hill projection | User (look, downhill), Codex (projection) |
| [0024](0024-difficulty-curve-by-walls.md) | Difficulty by walls, eased curves, wind warning, tuned with a balance sim | User (too hard at 50), Opus 5.5 (curve) |
| [0025](0025-perfect-streak-and-record-chase.md) | Perfekt/Knapp feedback, streak helmet, record sign, season progress | User (must grip), Opus 5.5 (rules) |
| [0026](0026-opencode-panes-tickets-and-ci.md) | OpenCode panes run by Claude, GitHub epics, CI on PRs | User (orchestration, CI), Opus 5.5 (setup) |
| [0052](0052-gate-drawn-whole-without-sight-window.md) | Gate always drawn whole, no see-through sight window | User (looked like a bug), Opus 5.5 (fix) |
| [0037](0037-integrate-reviewed-art-without-rebalancing.md) | Preserve new model look, shifted passages, full art integration without rebalancing | User (scope), Codex (handoff/ticket drafts) |
| [0046](0046-alaska-trellis-body-clean-rig.md) | Alaska: TRELLIS-Körper neu vernetzt, Pivot-Rig mit Brust- und Hinterteil-Gelenk | User (Körper, Look), Sonnet 5.5 (Verfahren) |
| [0047](0047-alaska-clips-and-third-figure.md) | Alaska als dritte Figur: Intro auf vier Pfoten, Clips, Atlas, fallende Brille | User (Ablauf, Brille), Sonnet 5.5 (Umsetzung) |
| [0027](0027-late-gap-floor-and-fewer-helmets.md) | Late gap floor 2.0, helmet chance halved | User (tickets #45, #48), Sonnet 5.5 (numbers) |

| [0065](0065-turnstile-for-leaderboard-entries.md) | Turnstile-Token für Bestenlisten-Einträge, Worker prüft nur mit gesetztem Secret | User (Issue #77), Sonnet 5.5 (Umsetzung) |

| [0053](0053-oberbaum-bridge-runtime-parts.md) | Oberbaumbrücke aus vier Modellteilen, dritte Jahreszeit der Berlin-Tour | User (scope), Sonnet 5.5 (parts, renderer) |
| [0054](0054-oberbaum-towers-outside-corridor.md) | Oberbaum-Türme außerhalb des Wegs, Folgelücke lesbar | User (visibility), Sonnet 5.5 (placement) |
| [0055](0055-plant-order-for-oberbaum.md) | Galerie-Pflanzenreihenfolge auch für die Brücke | User (plants stay), Sonnet 5.5 |
| [0062](0062-volkspark-landmark-walls.md) | Bauwerke als jede 10. Mauer im Volkspark ab Herbst | User (Ticket #81), Sonnet 5.5 |
| [0056](0056-reichstag-runtime-parts.md) | Reichstag aus vier Modellteilen, vierte Jahreszeit der Berlin-Tour | User (scope), Sonnet 5.5 (parts, renderer) |
| [0057](0057-reichstag-gap-readability.md) | Reichstag: Durchfahrt folgt der Spiellücke, Folgelücke lesbar | User (no rebalancing), Sonnet 5.5 (placement) |
| [0058](0058-plant-order-for-reichstag.md) | Galerie-Pflanzenreihenfolge auch für den Reichstag | User (plants stay), Sonnet 5.5 |
| [0074](0074-combined-integration-branch.md) | Sammel-Branch für die Gesamtprüfung (#76) | User (Auftrag), Sonnet 5.5 |
| [0075](0075-five-landmark-order.md) | Reihenfolge der fünf Bauwerke, Volkspark folgt der Liste | User (Reihenfolge), Sonnet 5.5 |
| [0076](0076-all-landmarks-loaded-together.md) | Alle fünf Bauwerke laden gemeinsam; Budget und Messung | Sonnet 5.5 (Messung) |
| [0077](0077-readable-passages-and-syringe-draft.md) | Folgende Kamera, an Öffnungen ausgerichtete Brückenbögen und vorsichtiger Spritzenentwurf | Nutzer (Auftrag), GPT-6.1 Sol High (Umsetzung) |
| [0078](0078-private-staging-with-cloudflare-access.md) | Private Staging-Testwebsite mit Access-JWT, separaten Daten und gesperrtem CI-Deploy bis Einrichtung | Nutzer (privater Zugang), Codex/Sol High (Umsetzung) |
