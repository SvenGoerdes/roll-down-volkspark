# 0078: Englische Übersetzung über eigenes Mini-Modul (`js/i18n.js`)

- **Status:** Accepted
- **Date:** 2026-10-28
- **Decided by:** Nutzer (Umfang, automatische Sprachwahl, DE/EN-Schalter, sprachneutrale Worker-Daten)
- **Built by:** Claude Opus 4.6 (Antigravity Subagent)
- **Commits:** dieser PR (#70)

## Context

Das Spiel wurde an Freunde weitergegeben, die kein Deutsch sprechen (#70). Gesucht ist eine englische Übersetzung für alle sichtbaren Spieltexte (Startscreen, HUD, Banner, Durchfahrts-Popups, Rekord-Schilder, Game-Over, Bestenliste, Ideen-Sheet), ohne Build-Schritt, ohne Laufzeit-Abhängigkeiten und ohne den bestehenden Cloudflare-Worker umzubauen.

## Decision

Wir nutzen ein einzelnes kleines ES-Modul `js/i18n.js` mit zwei flachen Wörterbüchern (`STRINGS.de` und `STRINGS.en`), einer Funktion `t(key, vars)` mit `{name}`-Platzhaltern sowie `applyI18n()` für statische HTML-Elemente (`data-i18n`, `data-i18n-placeholder`, `data-i18n-aria`, `<html lang>`).

Die Sprache richtet sich automatisch nach `navigator.language` (`en*` → Englisch, sonst Deutsch als Standard und Fallback). Auf dem Startscreen sitzt oben rechts ein kompakter `DE | EN`-Schalter (`#lang`), der die Wahl in `localStorage` (`rollDownLang`) speichert und alle sichtbaren Texte sofort ohne Neuladen umschaltet. Eigennamen (`Roll Down Volkspark`, Figurennamen, Berliner Bauwerke wie `Brandenburger Tor`) und die an den Worker gesendeten Daten (`season.name` in Ideen und Bestenlisten-Einträgen) bleiben unverändert.

## Alternatives

- **i18n-Framework (i18next, Fluent o. Ä.):** Für ~60 kurze Strings unnötige Laufzeit-Abhängigkeit; widerspricht KISS/YAGNI und ADR 0001.
- **Zwei getrennte HTML-Dateien (`index.html` / `en.html`):** Verdoppelt das Markup und macht das sofortige Umschalten ohne Neuladen unnötig umständlich.
- **Worker-Fehlermeldungen sofort mitübersetzen:** Erfordert Protokoll-/Worker-Änderungen und einen Worker-Deploy; für seltene Server-Validierungsfehler vorerst verzichtbar.

## Consequences

- Neue Texte (z. B. aus #21, #62, #64) brauchen nur einen Schlüssel in `STRINGS.de` und `STRINGS.en` sowie `data-i18n="..."` oder `t('...')`.
- Ein Unit-Test in `tests/i18n.test.js` prüft bei jedem Testlauf, dass `STRINGS.de` und `STRINGS.en` exakt dieselben Schlüssel und Platzhalter besitzen und alle `data-i18n*`-Attribute aus `index.html` abgedeckt sind.
- Vom Worker zurückgegebene Validierungsfehler bleiben vorerst deutsch.
