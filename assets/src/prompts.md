# Image prompts

Every generated asset with the exact prompt, so it can be made again (art-bible.md). Tool: `bun tools/gen-image.js <out> "<prompt>" [--ref …] [--aspect …]`, model Nano Banana 2.1.

## powerups.png → assets/powerups/*.webp (2026-10-14)
`--ref assets/src/style-b.jpg --ref <a roll-helmet frame of Kalle> --aspect 16:9`, then `python3 tools/cut-icons.py assets/src/powerups.png assets/powerups helmet slowmo widen`.

> Three game power-up icons in a row, evenly spaced, same size, for a mobile game about rolling down a Berlin park. Hand-painted 3D look matching the gouache painting in the first reference: soft volumes, visible brush texture, warm light from the upper left, dark brown outline, readable at 48 px. 1) a red bicycle helmet with air vents and a dark strap (like the helmet in the second reference). 2) an hourglass with blue glass and golden sand, meaning slow motion. 3) two thick green arrows pointing apart left and right, meaning wider gaps. No text, no circles or badges around them, no ground shadows. Each object fully visible with margin. Solid flat pure magenta background #FF00FF everywhere.

A glossy 3D variant (same prompt without the gouache part) was made too; the user picked the painted one.

## storni-label.jpg (2026-10-14)
`--aspect 21:9`. Texture for the bottle in `tools/blender/render.py`.

> Flat unwrapped beer bottle label artwork, rectangular, fills the whole image edge to edge, no bottle, no perspective, no background. Cream paper label in a cheap old-school East German lager style: big bold red brush lettering "STORNI" in the middle, small "PILSENER" below it, thin red and gold border lines at top and bottom, a small red ribbon. Slightly worn, printed look, hand-painted gouache texture to match a painted game. Only these two words as text, spelled exactly.
