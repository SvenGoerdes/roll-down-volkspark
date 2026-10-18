# 0076: Alle fünf Bauwerke laden gemeinsam, Budget und Messung

- **Status:** Implemented; wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Claude Sonnet 5.5 (Messung); Nutzer entscheidet über Nachladen
- **Built by:** Claude Sonnet 5.5
- **Commits:** Merge-Commits und Fix-Commits auf `feat/gesamtpruefung` (PR „Closes #76“)

## Decision

Die Berlin-Tour lädt Tor, Galerie, Brücke, Reichstag und Rathaus bei der Auswahl zusammen (`gatesFor()` in `main.js`); Volkspark lädt sie nach `VOLKSPARK_LANDMARK_PRELOAD` Mauern. Gemessen: 510 KB WebP, 20,8 MiB dekodiert RGBA (Tor 5,42, Galerie 2,37, Brücke 5,20, Reichstag 4,52, Rathaus 3,31). Nachladen je Jahreszeit würde etwa 4 MiB sparen und kostet einen Ladeschritt mitten im Spiel; nicht umgesetzt, solange kein Gerät Probleme zeigt.

Leistung, Chrome 390×844 DPR 2, 4× CPU-Drossel: Bildabstand Median 16,7 ms (60 fps) in beiden Modi und an allen fünf Bauwerken. Einzelne Ausreißer: Bildabstand max 50 ms, Update und Rendern p95 bis 37 ms bei Mauer 45 und 65 (Brücke, Reichstag), vermutlich Bilddekodierung beim ersten Zeichnen. Keine dauerhaften Einbrüche unter 30 fps. Echte Geräte und Safari nicht geprüft.
