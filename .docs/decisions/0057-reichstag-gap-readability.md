# 0057: Reichstag: Durchfahrt wie das Spiel sie liefert, Folgelücke lesbar

- **Status:** Implemented; Darstellung im Spiel wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Ticket #73: Durchfahrten folgen der Spiellücke, kein Balancing); Platzierung Claude Sonnet 5.5
- **Built by:** Claude Sonnet 5.5
- **Commits:** Feature-Commits auf `feat/reichstag` (PR „Closes #73“, baut auf #87 auf)

## Decision

- Die Durchfahrt ist die Lücke des Spiels: einzeln, doppelt, verbreitert, links, Mitte, rechts. Das Modell hat sie bei x = ±1,93 gebaut; das Spiel liest sie aus `gateLayout()`. Sichtbare Öffnung und Treffergrenze decken sich (ADR 0035). Abstände, Tempo, Lücken, Wertung und Helmregeln bleiben.
- Die Brücke über der Öffnung (`top`) beginnt etwa 5 m über dem Boden, also weit über `WALL_H` und über dem Fahrweg. Wo eine Lücke liegt, sieht man unter dem Gebälk die Wege und die nächste Wand. Die Kuppel verdeckt nur Himmel und Wipfel. Die Vorprüfung des Modells fand die Folgelücke bei Hindernis 1/80/200 in 0 von je 27 Proben verdeckt (`checks.json`). Die Spielbilder `.claude/review/73/` bestätigen das für fern, mittel, nah.
- Das Modell ist eine freigegebene Fantasie-Anpassung: breitere Mitte, keine Treppe, flachere Tiefe, undurchsichtige blaugraue Glasfelder.

## Consequences

Eine Lücke am Rand lässt eine Säule mit Wandstück frei stehen, an der Kante schneidet der Flügel senkrecht ab. Das sieht aus wie beim Tor. Die Zufallsstellungen prüft der Nutzer in der Freigabe.
