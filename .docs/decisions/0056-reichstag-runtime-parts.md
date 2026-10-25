# 0056: Reichstag aus vier Modellteilen als viertes Bauwerk der Berlin-Tour

- **Status:** Implemented; Darstellung im Spiel wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Issue #73, ADR 0037; ein Bauwerk je Jahreszeit, Winter); Teilung Claude Sonnet 5.5
- **Built by:** Claude Sonnet 5.5
- **Commits:** Feature-Commits auf `feat/reichstag` (PR „Closes #73“, baut auf #87 auf)

## Context

`TOUR_LANDMARKS` (ADR 0049) hat Tor, Galerie und Brücke. #73 hängt `reichstag` als vierten Eintrag an: Winter. Das freigegebene Modell `reichstag.blend` ist ein Bau mit fester Mitteldurchfahrt (Portikus, sechs Säulen, Kuppel). Das Spiel verschiebt die Lücken.

## Decision

- `tools/blender/render-reichstag-sprites.py` rendert mit der 8°-Kamera von Tor und Brücke vier Teile mit 80 px je Weltmeter (doppelte Pixeldichte der nächsten Wand bei DPR 2): `wing-left`, `wing-right` (Fassade mit Eckturm, Fahne, Balustrade), `column` (mittlere Säule mit Sockel und Wandstück dahinter) und `top` (Giebel, Gebälk, Dachterrasse, Kuppel). `tools/build-reichstag-sprites.py` schneidet Ränder ab und schreibt WebPs, `js/reichstag-sprite-data.js` und `reichstag-provenance.json`. Zusammen 146 KB WebP, etwa 4,5 MiB dekodiert.
- `js/render-reichstag.js` zeichnet Flügel auf jede feste Spanne (`gateLayout().solids`) und füllt feste Spannen im Portikusbereich (|x| ≤ `REICHSTAG_PORTICO`) mit Säulen. Erste und letzte Säule schließen bündig mit den Spannenkanten ab (`columnLefts`), der Abstand ist höchstens `REICHSTAG_COLUMN_STEP`. Das Wandstück im Säulen-Sprite ist so breit wie der Sockel, deshalb bleiben zwischen den Kacheln keine hellen Fugen. Nichts unter Mauerhöhe liegt über einer Durchfahrt.
- `top` hängt ganz über `WALL_H` und überspannt jede Durchfahrt, wie das Dach des Tors. Kein Sichtfenster (ADR 0052).
- Die Kamera blickt 8° von oben und sah in die offene Oberseite der Säulenbasis (dunkles Loch). Das Renderskript setzt dafür eine Deckscheibe aus dem Material der Basis auf.
- Nur die Berlin-Tour lädt die Bilder, zusammen mit Tor, Galerie, Brücke.

## Alternatives

- Das Modell als ein Bild: kann Lücken nicht abbilden.
- Säulen einzeln aus dem Modell nach Ort: fest an der Modellmitte, folgt den Lücken nicht.

## Consequences

Das Gebäude ist 19,7 m breit und endet innerhalb der Mauerlänge; die letzten Meter bis `WALL_EXT` bleiben frei, dort stehen Bäume. Säulen und Flügel sind flache Sprites. Echte Mobilgeräte nicht geprüft.
