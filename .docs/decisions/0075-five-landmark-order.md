# 0075: Reihenfolge der fünf Bauwerke

- **Status:** Implemented; wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Reihenfolge Tor, Galerie, Oberbaum, Reichstag, Rathaus); Umsetzung Claude Sonnet 5.5
- **Built by:** Claude Sonnet 5.5
- **Commits:** Merge-Commits und Fix-Commits auf `feat/gesamtpruefung` (PR „Closes #76“)

## Decision

`TOUR_LANDMARKS` lautet `brandenburg-gate`, `east-side-gallery`, `oberbaum-bridge`, `reichstag`, `red-town-hall`. Ein Bauwerk gilt 20 Mauern (`WALLS_PER_SEASON`), danach wechselt es. Es gibt vier Jahreszeiten und fünf Bauwerke, daher fällt das Rathaus (Mauern 80 bis 99) in den Frühling und das Tor ab Mauer 100 wieder in den Sommer. Der Reichstag steht im Winter. Die Volkspark-Bauwerke (#81) folgen derselben Liste: Mauer 40 und 50 Oberbaum, 60 und 70 Reichstag, 80 und 90 Rathaus, 100 Tor. Der Test in `tests/gallery.test.js` hält das fest.

## Consequences

Die Zuordnung Jahreszeit zu Bauwerk wandert nach einer Runde um eine Stelle. Wer eine feste Zuordnung will, braucht eine eigene Regel; nicht beschlossen.
