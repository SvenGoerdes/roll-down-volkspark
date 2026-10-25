# 0058: Pflanzenreihenfolge der Galerie auch für den Reichstag

- **Status:** Implemented; Darstellung im Spiel wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Entscheidung zu #71: Pflanzen bleiben, Bauwerk wird über nahe Büsche gezeichnet); Übertragung Claude Sonnet 5.5
- **Built by:** Claude Sonnet 5.5
- **Commits:** Feature-Commits auf `feat/reichstag` (PR „Closes #73“, baut auf #87 auf)

## Decision

`PLANT_BEHIND_LANDMARKS` in `js/config.js` enthält `reichstag`. `plantDepth()` (ADR 0049) zeichnet nahe Büsche hinter die Wand, damit kein Busch eine Säule oder Fassade abschneidet. Pflanzen werden nicht ausgeblendet. Spawn, Abstände und Volkspark bleiben unberührt. Wegen des Gebäudes steht das erste Pflanzenstück unter dem Sockel hervor.

## Consequences

Wie ADR 0055.
