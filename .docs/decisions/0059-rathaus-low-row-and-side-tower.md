# 0059: Rotes Rathaus als niedrige Arkadenreihe mit Uhrturm neben dem Weg

- **Status:** Implemented; wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Ticket #74, ADR 0052: Sicht in der Darstellung lösen); Umsetzung Claude Sonnet 5.5
- **Built by:** Claude Sonnet 5.5
- **Commits:** Feature-Commit auf `feat/rotes-rathaus` (PR „Closes #74“)

## Context

Die hohe Fassade des Modells (drei Fensterreihen, 6 m) verdeckt die Folgelücke. Der Turm steht im Modell mittig und würde Lücken nahe der Mitte verdecken.

## Decision

- Der Flügel wird nur als unterste Arkadenreihe gerendert (obere Kante etwa auf Mauerhöhe) und als Kachel aus vier ganzen Fensterachsen über jede feste Spanne gelegt. Jede Kachel ist ein Pixel breiter als ihr Schritt, daher keine Nähte.
- Der Uhrturm mit dem offenen Torbogen steht links, die Innenkante bei `RATHAUS_TOWER_INNER` (Weg + 1,2), also nie vor einer Folgelücke. Er wird auf feste Spannen beschnitten. Der Bogen im Turm ist Teil des Modells, kein Sichtfenster.
- Der Turm steht nicht mittig, weil jede Lücke jede Stelle im Weg treffen kann.

## Consequences

Ein einzelner Turm links wirkt einseitig. Die oberen Fensterreihen der Flügel und das Dach fehlen im Spiel. Echte Geräte nicht geprüft.
