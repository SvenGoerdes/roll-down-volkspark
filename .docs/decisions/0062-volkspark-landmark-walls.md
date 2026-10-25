# 0062: Bauwerke als Mauern im Volkspark-Modus

- **Status:** Implemented; wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Ticket #81); Umsetzung Claude Sonnet 5.5
- **Built by:** Claude Sonnet 5.5
- **Commits:** siehe PR zu #81

## Context
Der Volkspark-Modus zeigt nur Gabionen-Mauern. Ab dem Herbst soll gelegentlich ein Bauwerk stehen, ohne Spielregeln zu ändern.

## Decision
Ab Mauer 41 (Index 40) ist jede 10. Mauer das Bauwerk, das die Berlin-Tour in dieser Jahreszeit zeigt. Zahlen in `config.js`. Die Sprites laden lazy bei 25 passierten Mauern; ein Ladefehler wird nicht wiederholt und lässt die Gabionen-Mauer stehen. Lücken, Abstände und Treffer bleiben, die Bauwerke zeichnen die Lücken schon heute.

## Alternatives
Sprites beim Start laden: kostet jeden Spieler Daten, auch wer nie Mauer 41 erreicht. Eigene Bauwerk-Liste für den Volkspark: doppelt gepflegt; `landmarkAt` genügt.

## Consequences
Beim Wechsel Berlin-Tour → Volkspark sind die Sprites schon geladen, die Bauwerke erscheinen dann auch ohne Vorladen. Lädt das Netz die Sprites erst nach Mauer 41, wechselt eine schon sichtbare Mauer einmal von Gabionen zum Bauwerk; bei 25 Mauern Vorlauf selten.
