# 0017: TRELLIS.2 on Hugging Face instead of Tripo

- **Status:** Superseded for the figures by 0018 (was: replaces step 2 of ADR 0016)
- **Date:** 2026-10-14
- **Decided by:** user (asked for open source and a free API); Opus 5.5 (picked TRELLIS.2)
- **Built by:** main session (Opus 5.5)
- **Commits:** see history.md, 2026-10-14

## Context
Tripo's free web plan locks Multi-View and export, and the API wallet is empty. The user asked for open-source models and a free API.

## Decision
`tools/gen-3d.py` calls Microsoft's TRELLIS.2 Space on Hugging Face through its Gradio API: one image in, a textured GLB (~100k faces) out, in under a minute, free within the ZeroGPU quota. We rig the figure in Blender ourselves.

## Alternatives
- Hunyuan3D 2.1: very good, but its license excludes the EU.
- TRELLIS.2 locally (trellis-mac port): works on the M1 Pro with 32 GB, but needs ~15–20 GB of downloads and only gives vertex colors. Fallback if the Space goes away.
- TripoSG and SPAR3D: weaker or not running.
- Tripo Pro (~$20/month): Multi-View and auto-rig, but costs money.

## Consequences
- Only one input image. The back of the figure is guessed, so details can be wrong; for Kalle the mustard panels on the back were missing. Fix by repainting the texture or by trying other seeds.
- The free quota is limited per day. A Hugging Face token raises it.
- A public Space can change its API or disappear. The local port is the fallback.
