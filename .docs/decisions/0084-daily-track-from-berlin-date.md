# 0084: Tagesstrecke aus dem Berliner Datum, vorerst ohne Rangliste (#59)

- **Status:** Accepted
- **Date:** 2026-11-14
- **Decided by:** Nutzer (Issue #59: fester Seed pro Berliner Tag, gleicher Tag = gleiche Mauern; Freigabe „du übernimmst Verantwortung“). Schalter im Startscreen und Zählweise: Claude Code.
- **Built by:** Claude Code (Cloud-Session; Modell siehe Commit-Trailer)
- **Commits:** dieser Commit (`feat: daily track seeded from the Berlin date`)

## Context

Epic #58 will jeden Tag dieselbe Strecke für alle. Rangliste (#60) und Platz-Anzeige (#61) brauchen D1 und sind noch nicht gebaut.

## Decision

`js/daily.js` leitet aus dem Berliner Kalendertag zwei getrennte Zufallsströme ab (Mauern/Pickups/Pfützen/Stämme und Untergründe). Der Spawn-Code liegt pur in `js/spawn.js` und zieht alles aus `game.rng`. Ein Schalter „📅 Tagesstrecke“ im Startscreen schaltet den festen Seed ein; er zeigt die Reststunden oder die heutige Bestleistung (nur lokal, `localStorage` `rollDownDaily`).

Ein Lauf auf der Tagesstrecke zählt wie jeder andere für Rekord, Freischaltung und Bestenliste: gleiche Regeln und gleiche Schwierigkeit, nur nicht zufällig.

## Alternatives

- **Nur Logik ohne Schalter (wörtlich #59):** dann wäre nichts spielbar. Der Schalter ist klein und nimmt #61 nur den Einstieg vorweg, nicht Platz/Rangliste.
- **Eigene Wertung für Tagesläufe:** braucht die Tagesrangliste (#60); bis dahin unnötig.

## Consequences

- Windböen und Schotter-Stöße bleiben zufällig (sie hängen an der Zeit, nicht an der Strecke).
- Volkspark und Berlin-Tour haben ab Mauer 41 leicht verschiedene Tagesstrecken (auf Volkspark-Bauwerksmauern liegt kein Stamm). Vor einer gemeinsamen Rangliste festlegen.
- Wer die Strecke auswendig lernt, kommt weiter und kann damit den normalen Rekord heben. Gewollt klein gehalten; bei Bedarf mit #60 trennen.
- `hoursLeft()` ignoriert die zwei Tage mit Zeitumstellung (höchstens eine Stunde daneben).
