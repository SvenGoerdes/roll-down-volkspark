# 0055: Pflanzenreihenfolge der Galerie auch für die Oberbaumbrücke

- **Status:** Implemented; wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Entscheidung zu #71: Pflanzen bleiben, Bauwerk wird über nahe Büsche gezeichnet); Übertragung Claude Sonnet 5.5
- **Built by:** Claude Sonnet 5.5
- **Commits:** wie ADR 0053

## Decision

Pfeiler und Türme reichen wie die Galerie-Mauer bis in die Büsche. `PLANT_BEHIND_LANDMARKS` in `js/config.js` listet die Bauwerke, für die `plantDepth()` (ADR 0049) gilt: `brandenburg-gate`, `east-side-gallery` und `oberbaum-bridge`. Das Tor kam auf Wunsch des Nutzers dazu, damit kein naher Busch eine Säule abschneidet. Pflanzen werden nicht ausgeblendet, nur hinter der Mauer gezeichnet; 

## Consequences

Ein Busch kann mit dem Fuß unter dem Pfeilersockel hervorschauen. Spawn, Abstände und Volkspark bleiben unberührt.
