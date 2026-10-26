# Seitlich folgende Kamera

Auftrag des Nutzers vom 26.10.2026: Die seitliche Lage der Figur vor versetzten Lücken soll leichter einzuschätzen sein. Umsetzung durch GPT-6.1 Sol (High) in einem eigenen Worktree. Kein neues Menü und keine Änderung von Steuerung, Physik, Kollisionsprüfung, Lücken oder Tempo.

## Verhalten und Projektion

`CAMERA_FOLLOW` in `config.js` setzt den Zielwert auf 45 Prozent der tatsächlichen Spielerposition, begrenzt auf ±1,4 Welt-Einheiten. Die Kamera nähert sich dem Ziel exponentiell mit einer Zeitkonstante von 0,2 Sekunden; keine Drehung, kein Zoom und kein vertikales Mitziehen. Bei 390 Pixeln Breite verschiebt die Kamera die Spielerebene um höchstens 65,52 Pixel. Für eine Figur bei x=2,6 und die gleiche Lückenmitte sinkt der perspektivische horizontale Abstand nach dem Einschwingen um 45 Prozent.

`view.cameraX` gehört nur zur Darstellung. `project()` zieht diese Position vor der perspektivischen Skalierung ab. Tiefe, Höhe, Brennweite und `groundRows` bleiben gleich. Der gemalte Boden verwendet je bestehender Zeile denselben seitlichen Versatz; Texturquellen, Mip-Stufe, Längsbewegung und Nahtüberlappung bleiben erhalten. Alle fünf Bauwerke verwenden für Bilder und Clips den projizierten Weltursprung `p.sx` statt des Bildschirmzentrums. Gabionen und Texturanker benutzen ihre jeweilige Vorder-/Hinterebene; sichtbare Schnittseiten richten sich nach der Kameraposition.

Die kleine Eis-Clipkontur wird bei Kamerabewegung erneuert, ihre Farbverläufe und inverse Bodentiefen bleiben gecacht. Schatten, Pfützen, Pickups, Pflanzen und Bremsspuren erhalten die Kamera automatisch durch `project()`. Bereits laufende bildschirmbasierte Sprüh-, Stein- und Glitzereffekte werden vor dem Erzeugen neuer Effekte um den Versatz ihrer Spielerebene korrigiert. Wetter und gemalter Himmel erhalten gemeinsam eine kleine Fernparallaxe. Geschwindigkeitslinien behalten bei reiner seitlicher Translation ihren Fluchtpunkt.

`main.js` aktualisiert die Kamera direkt nach der vorhandenen Spielerbewegung. Ein neuer Spielzustand setzt sie sofort auf null, auch beim Figurenwechsel nach einem Crash. Start und Intro bleiben dadurch mittig; nach einem Crash friert sie mit der Welt ein. Beim Ändern der Fenstergröße bleibt die Weltposition der Kamera erhalten. Die eingefrorene Debug-Vorschau erlaubt Kameraglättung ohne Fortschritt der Spielwelt.

## Prüfung

- `bun test tests`: 174 Tests grün, davon sechs neue unabhängige Kamera-Tests. Sie prüfen Symmetrie und Grenzen, 30/60/120-Hz-Glättung, unveränderte Höhe/Skalierung, bessere Ausrichtung, Bodentexturquellen und Cacheidentität, alle fünf Bauwerke, Eisclip und Effektursprünge.
- Echtes Chrome bei 390×844 und 320×568, DPR 2: beide Themen, alle vier Jahreszeiten links/rechts, Start, Intro→Spiel, Pfeiltasten in beide Richtungen, Crash und Retry; keine JavaScript-Fehler. Nach einem seitlichen Crash liegt der gerenderte Figurenanker nach Retry exakt bei 195 bzw. 160 Pixeln. Zusätzliche Wintervorschauen bei 375×667 mit Erde, Gras und Kies.
- Lokale Aufnahmen und Prüfergebnis: `/tmp/roll-down-camera-review-20261026/`. Testserver mit Bun auf Port 8877; Produktiv-Worker im Browser blockiert, keine Bestenlisten-Einträge.
- Die Prüfung ist eine Chrome-Handyemulation auf dem Mac. Echte iPhones/Android-Geräte, Safari und Touchgefühl auf Hardware wurden nicht geprüft.

## Performance-Messung und Grenze

Das bestehende `tools/perf-check.mjs` lief mit Chrome, 390×844, DPR 2 und 4×-CPU-Drossel für acht Sekunden je Thema ab Mauer 36. Frame-Abstand Median/p95: in beiden Themen 16,7/16,8 ms. Update+Render Median/p95: Volkspark 3,3/8,1 ms, Berlin-Tour 3,5/45,3 ms; einzelne Ausreißer bleiben vorhanden. Das ist keine Garantie stabiler 60 fps auf Geräten.

Ein zusätzlicher kontrollierter Vergleich verwendete dieselben fertig geladenen Berlin-Szenen, feste Hindernistiefen und 200 gemessene Frames nach 50 Aufwärmframes, mit `gain=0 / 0,45 / 0,45 / 0` im selben Browser. Herbst: p95 ohne Mitziehen 5,3/5,5 ms, mit Mitziehen 6,2/5,1 ms. Winter: ohne 3,9/3,5 ms, mit 4,5/5,1 ms. In allen Varianten, auch bei ruhender Kamera, gab es einzelne 41–53-ms-Spitzen (7–9 von 200 Frames über 16,7 ms). Das begrenzt die Aussage der kurzen Gesamtmessung; eine große zusätzliche Last durch das Mitziehen zeigt dieser Vergleich nicht. Winter muss für die kleine Eis-Clipkontur etwas mehr Arbeit erledigen. Rohdaten lokal: `perf-controlled.json` im genannten Aufnahmeordner.
