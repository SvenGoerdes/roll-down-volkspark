# 0035: Sichtbare Öffnungsvereinigung ändert keine Trefferregeln

- **Status:** Accepted
- **Date:** 2026-10-18
- **Decided by:** Nutzer, ausdrücklich in #28 und im Arbeitsauftrag
- **Built by:** GPT-6 Luna; Integration GPT-6.1 Sol
- **Commits:** dieser Feature-Commit auf `feat/brandenburger-tor`

## Context

`passesWall()` erlaubt nur einen Spielerumfang, der vollständig in **eine einzelne** Lücke passt. Die Vorbereitung `gateLayout()` vereinigt hingegen überlappende oder berührende Bereiche. Eine Trefferprüfung gegen diese Vereinigung würde an der Naht zusätzliche Fahrmöglichkeiten schaffen. ADR 0037 verbietet diese unbeabsichtigte Regeländerung.

## Decision

Das Layout behält zwei klar getrennte Listen: `passages` sind unveränderte einzelne offene Spannen, `openings` ihre Vereinigung ausschließlich für sichtbare feste Bauteile. `passesGate()` delegiert an `passesWall()` mit `passages`. Der laufende Spielpfad bleibt bei seiner bisherigen `passesWall()`-Prüfung, inklusive ursprünglichem Radius, Verbreiterungsfaktor, Wertung und Helmverbrauch.

Die Darstellung setzt keine zusätzliche Säule in eine Überlappung. Markierungen unterscheiden dort die ursprünglichen Durchfahrten. Tests vergleichen Einzel-/Sommer-Doppellücken, Verbreiterung und Radiusgrenzen ausdrücklich mit `passesWall()`. Ein Spieler, der in die vereinigte Öffnung, aber in keine einzelne Lücke passt, muss weiterhin scheitern. Berührende Öffnungen sind ebenfalls abgedeckt.

## Alternatives

- Trefferprüfung gegen die Vereinigung: einfacher, ändert aber bestehende Regeln.
- Überlappung bei der Lückenerzeugung verhindern: ebenfalls Balancingänderung und deshalb ausgeschlossen.
- Eine physische Zusatzsäule an der Naht: würde erlaubte Fahrmöglichkeiten blockieren.

## Consequences

Darstellung und Kollisionsgrundlage teilen dieselben ursprünglichen Lücken, ohne deren Semantik zu verwischen. Das ist keine neue Tor-Spielmechanik. Die Trennung löst auch die spätere Übernahme eigener Gebäudesprites, ohne eine zweite Kollisionsimplementierung zu benötigen.
