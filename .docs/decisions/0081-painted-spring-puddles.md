# 0081: Gemalte Frühlingspfützen als Paint-Once-Offscreen-Sprites (#43)

- **Status:** Accepted
- **Date:** 2026-10-28
- **Decided by:** Nutzer (Issue #43, Teil von Epic #42: Pfützen im Art-Bible-Stil statt billiger Ellipsen)
- **Built by:** Gemini 3.1 Pro (Subagent) auf `feat/puddles-art-bible`
- **Commits:** dieser PR (`Closes #43`)

## Context

In `js/render.js` zeichnete `drawPuddle` bisher in jedem Frame drei flache prozedurale Ellipsen (`#6f8fa8`, `rgba(255,255,255,0.35)` und dunkler Rand). Gegenüber dem gemalten Waldboden, den Bäumen und den Gabionen wirkten diese geometrischen Ovale billig (#43 „Die Pfützen wirken billig. Neuer Look im Art-Bible-Stil“) und widersprachen dem Paint-Once-Prinzip ([ADR 0009](0009-graphics-paint-once.md)).

## Decision

`puddleSprite(variant = 0)` in `js/environment-sprites.js` (re-exportiert aus `js/sprites.js` und beim Spielstart in `warmUp` in `js/render-fx.js` für alle drei Varianten vorberechnet) malt drei organische, mehrlappige Pfützen-Varianten einmalig in `256×96`-Offscreen-Canvases (`puddle:0` bis `puddle:2`):

1. **Feuchter Erdrand:** Weicher dunkler Matschsaum (`rgba(58, 46, 35, 0.55)` und `#4a3d2f`), der die Pfütze in den Weg einbettet.
2. **Wasserkörper mit Himmels- und Kronenspiegelung:** Verlauf von tiefem Schieferblau (`#3d5a73`) über Frühlingshimmel (`#6e9bc0`, `#8bb8d9`) samt dezenter Laubspiegelung (`rgba(92, 130, 88, 0.32)`).
3. **Uferkante und Tiefe:** Dunkle obere Uferkante (`rgba(28, 48, 66, 0.65)`) und hellere nasse Unterlippe für räumliche Vertiefung im Weg.
4. **Glanzstreifen und Wellenring:** Konzentrischer Wellenring und gemalte Lichtstreifen (`rgba(235, 247, 255, 0.65)`).
5. **Frühlingsdetail:** Drei kleine schwimmende Kirschblütenblätter (`#f4c9cc`, `#fff0dc`) passend zu den Frühlingskronen.

`drawPuddle(ctx, view, p)` kopiert den gecachten Sprite per `ctx.drawImage` in projizierter Größe (`w = p.r * s * 2.2`, `h = w * (sprite.height / sprite.width)`) mit Distanz-Fade (`arrivalAlpha`) und leichtem Kamera-/Tiefen-Schimmer (`Math.sin(p.z * 3 + (view.cameraX || 0) * 2)`). Die Variante kommt aus `p.variant` (`spawnWall` setzt `game.spawned % 3`) oder deterministisch aus `p.x` und `p.r`.

## Alternatives

- **Prozedurale Mehrpfad-Zeichnung in jedem Frame:** Kostet pro Frame unnötige Pfad-, Clip- und Gradient-Operationen auf dem Handy und widerspricht ADR 0009.
- **Externe WebP-Textur laden:** Für drei kleine 256×96-Sprites unnötiger Netzwerk-Request; die Offscreen-Canvas-Erzeugung nutzt dieselben `leaf`- und `seeded`-Bausteine wie `forestSprite`.

## Consequences

- Keine Änderung an Kollisionsradius (`p.r`), Rutsch-Physik (`p.slippery`) oder Spawn-Chancen.
- Im Frame-Loop bleibt pro Pfütze ein einzelner `drawImage`-Blit plus minimaler Glanzakzent; keine neuen Netzwerk-Assets.
