# 0027: Lücken-Untergrenze 2,0 und halbe Helm-Häufigkeit

- **Status:** Accepted (Zahlen offen für die Sichtung des Nutzers)
- **Date:** 2026-10-18
- **Decided by:** user (Tickets #45 „Lücken gegen Ende nicht zu klein“ und #48 „zu viele Helme“); Sonnet 5.5 (Zahlen, Nachtmodus)
- **Built by:** GPT-6 Luna (Versuch vom 14.10., Floor 2,2), Sonnet 5.5 (Neuaufsatz auf main, Messung, Wert 2,0)
- **Commits:** siehe history.md, 2026-10-18

## Context
Spät im Spiel schrumpft die Lücke auf 1,8 (ADR 0024) und ist kaum noch zu treffen. Zugleich zeigt der Nutzer zu viele Helme (#10). Pickups waren gleichverteilt: 30 % je Mauer, ein Drittel davon Helm (10 %). Der Streak-Helm (ADR 0025) kommt dazu und fällt mit #64 weg.

## Decision
- `GAP_WIDTH.floor` steigt von 1,8 auf 2,0. Der Rest der Kurve bleibt.
- Pickups wählt `selectPowerup` mit festen Chancen je Typ (`POWERUP_CHANCES` in `config.js`): Helm 5 %, Zeitlupe 10 %, breite Lücken 10 %. Zeitlupe und Breite bleiben unverändert, nur der Helm halbiert sich.
- `tools/balance-sim.js` nutzt dieselbe Auswahlfunktion wie das Spiel und zählt Pickups und Helme getrennt. Jede Runde hat ihren eigenen Startwert, so lassen sich Varianten vergleichen.

## Alternatives
- Floor 2,2 (erster Versuch): Median 185 statt 127, 11 % der Runden erreichen das Sim-Limit von 400. Das macht das Spiel in der Breite leicht, nicht nur das Ende.
- Floor 1,9/2,1: 1,9 ändert fast nichts, 2,1 hebt den Median auf 143 und lässt 2 % ans Limit.
- Helm weglassen bis #64: nicht nötig, 5 % reicht fürs Erste.

## Consequences
- Median bleibt (127 → 125), das obere Viertel kommt weiter (p90 180 → 219). Das Ende ist fairer, nicht der Anfang.
- Helme je Runde (vergeben): 2,6 → 1,6 normale. Streak-Helme (2,4) bleiben bis #64.
- Die Sim-Bot-Kalibrierung gilt nur grob für Menschen. Echte Spieler testen, bevor die Zahlen als fest gelten.
