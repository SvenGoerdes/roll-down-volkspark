# 0053: Oberbaumbrücke aus vier Modellteilen als Bauwerk der dritten Jahreszeit

- **Status:** Implemented; Darstellung im Spiel wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Issue #72, ADR 0037; ein Bauwerk je Jahreszeit, Reihenfolge Tor, Galerie, Brücke)
- **Built by:** Claude Sonnet 5.5 (Blender-Export, Renderer, Tests, Doku)
- **Commits:** Feature-Commits auf `feat/oberbaum` (PR „Closes #72“)

## Context

ADR 0049 führt `TOUR_LANDMARKS` ein. #72 hängt `oberbaum-bridge` als dritten Eintrag an: Herbst. Das freigegebene Modell `oberbaum-bridge.blend` ist ein einzelnes Bauwerk mit zwei ungleichen Türmen (achteckig, rund) und einer Arkade; es kennt keine Lücken und keine Sperre.

## Decision

- `tools/blender/render-oberbaum-sprites.py` rendert mit derselben 8°-Kamera wie das Tor vier Teile: `tower-left`, `tower-right`, `arch` (Bogenfeld mit Friesen und Bogenschichten), `pier` (der linke Backsteinpfeiler). `tools/build-oberbaum-sprites.py` schneidet Ränder ab und erzeugt WebPs, `js/oberbaum-sprite-data.js` und `oberbaum-provenance.json`. Zusammen etwa 138 KB WebP, 5,2 MB dekodiert; das Tor liegt mit 5,4 MiB auf gleicher Höhe.
- `js/render-oberbaum.js` kachelt den Pfeiler über jede feste Spanne (`gateLayout().solids`), je 0,03 überlappend. Alles unter Mauerhöhe liegt in festen Spannen, nie über einer Durchfahrt. Der Bogen beginnt etwa 1,9 m über dem Boden und liegt damit über `WALL_H`; er ist oben beschnitten wie das Tor-Dach. Kein Sichtfenster (ADR 0052).
- Es gibt keine Holzsperre im Modell. Geschlossene Spannen füllt der Pfeiler, das ist eine Darstellungsentscheidung ohne neue Kollisionsfläche. Treffer bleiben bei `passesWall()` (ADR 0035).
- Nur die Berlin-Tour lädt die Bilder, zusammen mit Tor und Galerie.

## Alternatives

- Das Modell als ein Bild: kann Lücken nicht abbilden.
- Neue Sperre modellieren: nicht freigegeben, YAGNI; der Pfeiler genügt.

## Consequences

Die Pfeiler zeigen leichte helle Nähte zwischen den Kacheln; sie lesen sich etwas wie ein Zaun. Bogen und Türme sind flache Sprites ohne Tiefe. Echte Mobilgeräte nicht geprüft.
