# 0078: Superattacke ersetzt den Streak-Helm nach 6× Perfekt (#64, #10)

- **Status:** Accepted
- **Date:** 2026-10-28
- **Decided by:** Nutzer (Spieler-Idee #10/#64: Superattacke statt Streak-Helm nach 6× Perfekt, 10 s Dauer, Mauern durchbrechen); Gemini 3.1 Pro (reine Regeln, Offscreen-Aura/Brocken, HUD-Timer und Warnblinken)
- **Built by:** Gemini 3.1 Pro (`feat/superattacke`)
- **Commits:** siehe `history.md`, 2026-10-28

## Context

In ADR 0025 gab jede sechste „Perfekt“-Durchfahrt in Folge einen zusätzlichen Gratis-Helm. Zusammen mit den normalen Helm-Pickups führte das bei geübten Spielern schnell ans 3-Helme-Limit (Spieler-Idee #10 „Zu viele Helme“; in der Balance-Simulation verfielen im Schnitt 1,0 Helme pro Runde am Limit) und zog Runden passiv in die Länge, statt präzises Spielen mit einem aktiven Höhepunkt zu belohnen.

## Decision

- **Superattacke statt Streak-Helm:** Sechs „Perfekt“-Durchfahrten in Folge (`STREAK_NEED = 6`) lösen keinen Gratis-Helm mehr aus, sondern starten sofort für `SUPERATTACK.duration = 10` Sekunden die Superattacke. Normale Helm-Pickups bleiben unverändert.
- **Wirkung:** Während der Superattacke rollt die Figur `SUPERATTACK.scale = 1.3`× größer mit einer vorgerenderten goldenen Aura (`superAura()`). Trifft sie eine Mauer oder ein Bauwerk außerhalb der Lücke (`resolveWall`), bricht die Mauer in vorgerenderte Steinbrocken (`stoneSprite`, `burstStones`), ohne Crash und ohne Helmverbrauch; die Mauer zählt regulär als geschafft (Score, Jahreszeitenwechsel, Rekordjagd). Auch Spritzen-Treffer sind während der Superattacke harmlos.
- **Keine Serien-Kette während der Laufzeit:** Solange die Superattacke läuft, baut sich keine neue Perfekt-Serie auf (`nextStreak(..., active)` hält die Serie auf 0) und „Perfekt“/„Knapp!“-Popups pausieren. Erst nach Ablauf startet die Serie wieder bei 0.
- **Ankündigung vor Ablauf:** In den letzten `SUPERATTACK.warn = 1.5` Sekunden blinken Figur, Aura (`superattackBlink`) und das HUD-Icon, damit niemand unvorbereitet in die nächste Mauer rollt.
- **Performance:** Aura und Steinbrocken werden beim Start einmalig in kleine Offscreen-Canvases gemalt (`warmUp` in `render-fx.js`, `sprites.js`) und im Frame-Loop nur per `drawImage` geblittet.

## Alternatives

- **Superattacke zusätzlich zum Streak-Helm:** Würde das Überangebot an Helmen (#10) nicht lösen und die Runden noch weiter verlängern.
- **Eigene Lauf-Animation statt Weiterrollen im ersten Schritt:** Erfordert neue Blender-Clips für alle drei Figuren (Kalle, Tine, Alaska); wird nach Nutzerentscheidung getrennt nachgezogen, während die Spiellogik und Effekte sofort mit der vergrößerten Roll-Figur und Aura laufen.

## Consequences

- Ersetzt den Streak-Helm-Teil aus [ADR 0025](0025-perfect-streak-and-record-chase.md) („Perfekt“/„Knapp!“-Beurteilung, Serien-Zähler und Rekordjagd bleiben erhalten).
- In `tools/balance-sim.js` (600 Runden) sinkt der Verfall normaler Helme am Limit von 0,4 auf 0,1 je Runde (Streak-Helme: vorher 2,4 vergeben und 0,6 verfallen). Der Bot löst im Schnitt 1,9 Superattacken je Runde aus und durchbricht 0,7 Mauern; der Median liegt bei 85 Mauern (vorher 124 mit Streak-Helm, 76 ohne Streak), p90 bei 186 Mauern (vorher 202).
