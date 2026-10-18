# Painted park environment

Runtime assets: `spring`, `summer`, `autumn`, `winter` × `horizon.webp`, `forest.webp`,
plus `earth-painted.webp`, `gabion-painted.webp`, and for the Berlin-Tour only
`ground-earth.webp` and `ground-verge.webp` (loaded on first choice of that theme).
Figure sheets remain separate (~1.1 MB for both figures; only the selected figure loads).
The user's full references remain in `assets/seasons/` and are never loaded by the game.

## Horizons

The upper 60% of each user-supplied reference is resized to 768 × 618.
This excludes every painted gabion and the foreground path. Canvas adds a cached
fog fade at the bottom; moving baskets, ground and trees are rendered separately.

Rebuild with Pillow:

```sh
python3 tools/build-environment.py
```

## Forest cutouts

Generated with Codex's built-in Imagegen tool on 2026-10-14, using the summer
reference as a style reference. Real transparent PNG alpha is preserved in the
384 × ~652 WebPs. Bush sprites use the cluster's lower quarter. Three cached
crop variants and mirroring make repeated clusters less conspicuous.

Original PNG directory (outside the repository):
`/Users/svengoerdes/.codex/generated_images/01a137b6-7b7e-74c0-8db6-69366af923b2/`

The file mapping is recorded in `tools/build-environment.py`. To rebuild all eight:

```sh
python3 tools/build-environment.py --forest-source /Users/svengoerdes/.codex/generated_images/01a137b6-7b7e-74c0-8db6-69366af923b2
```

### Prompt set

Shared prompt: "Use case: stylized-concept. Asset type: transparent game environment
sprite, tall portrait aspect. Input image is STYLE REFERENCE ONLY. Create one
isolated cohesive woodland cluster cutout for a cozy hand-painted mobile downhill
park game. It consists of two tall branching deciduous tree trunks and their large
irregular canopy, with dense shrubs, ferns and grasses at their feet. The silhouettes
must have many crisp angular irregular leaves, broad gouache colour blocks,
delicate visible branches and richer depth than a simple round cartoon tree.
Match the painterly foliage in the reference. Composition: complete cluster
contained within image, transparent sky showing between leaves, fully transparent
background, no ground plane or horizon; trunks extend to bottom of image, tree
crown fills top two thirds, shrubs only bottom quarter. Warm light from upper left.
Make the canopy broad, dense and asymmetrical, suitable for mirroring at the sides
of a path. Keep all geometry entirely inside image with margin, portrait height
roughly 1.7 times width. Avoid walls, fences, buildings, people, text, UI, backdrop,
grass landscape plane, shadow rectangles."

Season-specific additions:

- Spring: "fresh light green and olive leaves, small restrained pink cherry blossom clusters and moss"
- Summer: "deep olive and forest green leaves with warm yellow-green sunlit edges"
- Autumn: "burnt orange, amber, ochre and brown autumn leaves, muted olive bushes"
- Winter: "dark blue-green shrub foliage and a deciduous tree with visible thin branches and thick natural white snow resting on foliage and boughs"

## Verification

Frozen game view: `http://127.0.0.1:8765/?preview=autumn#debug`.
Use spring/summer/autumn/winter and optionally `&surface=gravel` or `&surface=grass`.
These fixtures activate only with `#debug`; the regular game rules are unchanged.

## Ground and basket material refinement (ADR 0023)

`earth-painted.webp` (384×512, 55,460 bytes) and `gabion-painted.webp` (512×256,
37,930 bytes) were generated with the built-in Imagegen tool using the summer
reference as material/style inspiration. Exact prompts are in `material-prompts.json`.
The source PNGs are in the same original Imagegen directory listed above.

```sh
python3 tools/build-surface-art.py --source /Users/svengoerdes/.codex/generated_images/01a137b6-7b7e-74c0-8db6-69366af923b2
```

Earth is mapped through the existing ground mipmaps, with seasonal tint and snow.
Issue #75 adds a second ground for the Berlin-Tour, described below; Volkspark keeps this one.
Gabion front, top and end faces are cached from the shared stone/wire material.
Procedural equivalents remain available if a material fails to load. Wire/end posts
stay inside solid collision segments. The material textures are visually repeatable
but their generated edges are not mathematically seamless.

The new hill profile drops away logarithmically, anchored at the player's depth.
It changes the visual terrain only; inverse ground rows are calculated on resize.
Level lids, stone depth, softened verges and distant woodland make the path read
as a descending park slope. Ice and projected obstacles use that same curve.

For exact game-frame checks add `&width=390&height=844` or `&width=375&height=667` to the preview URL. These apply only to the frozen debug fixture; normal play uses the actual viewport.

Basket height is 1.65 world units; face crops preserve stone/wire proportions. Add `&near=4.8` to a debug fixture to inspect a wall just before the collision plane and check the following gap.

## Reviewed, scrolling ground for the Berlin-Tour (#75 / ADR 0043)

The approved `ground-v2.png` landscape was generated with Nano Banana 2.1 on
2026-10-14. It is a static art study, not a replacement backdrop. The local
source and its original prompt/provenance live in `.claude/review/quellen/floor/`;
the full PNG and phone presentation WebP are not runtime assets.

Rebuild the materials with Pillow (requires that local source):

```sh
python3 tools/build-ground-materials.py
```

- `ground-earth.webp`: 384×512, 34,652 bytes; foreground earth crop `(470, 2210, 760, 2560)`.
- `ground-verge.webp`: 384×512, 50,192 bytes; grass/low-plant crop `(0, 1630, 300, 2030)`.
- Total: 84,844 bytes, requested only by the Berlin-Tour.
- No new generation or external image service was needed. Both materials use a
  smooth 96-row overlap in Y, the direction of travel; no second painted horizon
  or perspective path edge is carried into the playable corridor.

For the Berlin-Tour `surfaces.js` bakes softly masked verges into dirt/gravel, retains the seasonal
snow/leaf treatment and procedural gravel/grass, and wraps procedural details at
both Y edges before producing the existing mip levels. The twelve Berlin-Tour caches
occupy about 12 MiB decoded pixel bytes, built on first choice next to the Volkspark set. There is no change to the
eight-world-unit repeat distance. The existing split-row blits now overlap
slightly to prevent Canvas subpixel gaps at tile boundaries, with no additional
draw calls or per-frame material processing.

Phone-sized captures and an eight-second animated game capture are local at
`.claude/review/75/index.html`. All 12 seasonal/surface caches and all 60 mip
levels were inspected in an actual browser Canvas. A debug bot completed 85
walls across a full seasonal cycle; the bot supplies player positions, not new
game rules. This is not a manual or real-device playtest. Art approval is pending.
