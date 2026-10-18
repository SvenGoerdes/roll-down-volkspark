# 0054: Oberbaum-Türme außerhalb des Wegs, Folgelücke lesbar

- **Status:** Implemented; wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Ticket #72: verdeckte Außenbereiche der Folgelücke sichtbar machen, ohne Abstand oder Tempo zu ändern); Platzierung Claude Sonnet 5.5
- **Built by:** Claude Sonnet 5.5
- **Commits:** wie ADR 0053

## Context

Die Vorprüfung des Modells fand bis zu 4 von 27 Messpunkten der Folgelücke an ihren Außenkanten verdeckt, durch Bogenlaibungen. Türme im Modell stehen bei x = ±3,2, also im Weg.

## Decision

- Die Türme stehen bei `OBERBAUM_TOWER_X` = `CORRIDOR / 2 + 1,2` = 5,2 und damit außerhalb des Wegs (|x| ≤ 4). Ein Turm der nahen Mauer erscheint wegen des größeren Maßstabs weiter außen auf dem Bildschirm als jede Lücke der fernen Mauer. Er verdeckt nie eine Folgelücke. Ein Test prüft den Abstand.
- Die Türme werden wie die Pfeiler auf feste Spannen beschnitten. Der Bogen bleibt mittig über Mauerhöhe. Die Folgelücke liegt in den Spielbildern bei fern, mittel und nah im offenen Bogenfeld; ihre äußeren Kanten bleiben erkennbar (`.claude/review/72/23-folgeluecke-nah-ausschnitt.png`). Keine Ausblendung, kein Fenster, keine Änderung von Abständen, Tempo, Lücken.

## Consequences

Die Türme stehen zwischen den Bäumen und sind im Spiel größer als der Bogen. Ob die Lücke bei allen Zufallsstellungen frei bleibt, deckt der Nutzer in der Freigabe ab; einzelne Außenkanten können vom Bogenpfeiler leicht angeschnitten sein.
