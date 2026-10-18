# 0052: Tor immer vollständig, kein Sichtfenster

- **Status:** Accepted (ersetzt das Sichtfenster aus ADR 0034)
- **Date:** 2026-10-18
- **Decided by:** der Nutzer, nach dem ersten Spielen der Live-Version
- **Built by:** Claude Opus 5.5 (Hauptsession)
- **Commits:** dieser Commit (`fix/gate-no-sight-window`)

## Context
ADR 0034 schnitt beim Näherkommen ein halb durchsichtiges Rechteck in Dach und Säulen, damit man die Durchfahrt des nächsten Tors sieht. Der Nutzer hat das im Spiel als Fehler wahrgenommen: „ein kleines Stück des Tors/der Säule ist nicht sichtbar“.

## Decision
Das Tor wird immer vollständig und deckend gezeichnet. Das Sichtfenster entfällt samt `revealAlpha` und `revealMargin`.

## Alternatives
- Ganzes Tor beim Näherkommen gleichmäßig leicht durchsichtig: vom Nutzer nicht gewählt.
- Sichtfenster behalten und nur dezenter machen: sieht weiter nach Fehler aus.

## Consequences
- Weniger Code im Zeichenpfad, ein Clip pro Bauteil statt bis zu drei.
- Die nächste Lücke kann kurz hinter einer Säule des nahen Tors verschwinden. Durch die eigene Durchfahrt bleibt sie sichtbar (Spielbilder 06 und 13). #71–#74 erben dieses Verhalten.

## Nachtrag 2026-10-18

Die hellen Mittellinien bei mehreren Lücken (`#ffe7ae`) sind entfernt; der Nutzer sah sie als Bug-Rahmen. Pflanzenreihenfolge am Tor: ADR 0055.
