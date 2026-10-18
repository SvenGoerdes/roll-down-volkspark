# 0033: Sightseeing-Landmarken und Themenauswahl

- **Status:** Historische Vorbereitung; abweichende Look-/Fernsehturm-Vorgaben ersetzt durch ADR 0037, Runtime-Integration und Treffersemantik durch ADR 0034/0035
- **Date:** 2026-10-14
- **Decided by:** user
- **Built by:** GPT-6 Luna (coding subagent); koordiniert von GPT-6.1 Sol; Review von GPT-6.1 Sol (medium)
- **Commits:** uncommitted on `feat/sightseeing-round-2`; keine Commit-Hashes

## Context

Die Sightseeing-Runde soll Berliner Orte zeigen, ohne die bestehende Canvas-2D-Laufzeit durch 3D zu ersetzen. Der Nutzer hat in Runde 1 die sechs Motive, erfundene Durchgänge, den Einstieg und die Geometrie des Tors aus Render 04 freigegeben. Die sieben neuen Runde-2-Renders stehen zur Freigabe aus. Eine Integration ins Spiel ist noch nicht freigegeben.

## Decision

Die Runde zeigt sechs Landmarken: Brandenburger Tor, Reichstag, Rotes Rathaus, Fuß des Fernsehturms, Oberbaumbrücke und East Side Gallery. Erfundenen Durchlässen ist zugestimmt. Das Brandenburger Tor behält die Geometrie aus Referenz 04; nur gleichmäßige Skalierung für G und ein gemalter Toon-Look nach Referenz 01 und Art-Bible sind erlaubt. Blender 5.2 läuft headless mit Skripten im Repo. `js/view.js` liefert den Spielblickwinkel. 3D dient nur der Offline-Erzeugung; Nano Banana dient Konzept, Texturen und Hintergrund.

Der Fernsehturm darf selten am Rand erscheinen, kleiner und dunstiger. Für die Review ist ein statisches RGBA-PNG mit 192 × 384 Pixeln vorgesehen; ein späteres Runtime-Bild wäre ein kleines statisches WebP. Der Startscreen soll „Volkspark“ als Standard und „Berlin-Tour“ als auswählbares Thema anbieten. Diese UI ist noch nicht gebaut.

Die Freigabe aus Runde 1 betrifft die Designrichtung und die Tor-04-Geometrie. Vor der Art-Integration hält die Arbeit an und braucht eine neue Nutzerfreigabe. Es gibt noch keine Spielverdrahtung und keine beschlossene Lösung für Verdeckung durch hohe Fassaden.

## Alternatives

- 3D in der Laufzeit: verworfen; Rendering bleibt bei der bestehenden Canvas-2D-Architektur.
- Festes Fernseh­turm-Modell in jeder Szene: verworfen; er darf selten, klein und dunstig am Rand erscheinen.
- Automatischer Wechsel zur Berlin-Tour nach vier Jahreszeiten: verworfen zugunsten der direkt erreichbaren Startscreen-Auswahl.

## Consequences

Die Landmarks und das Thema sind benannt, und die Offline-Pipeline kann reproduzierbare Modelle und Bilder vorbereiten. Die aktuelle Gate-Logik in `js/logic.js` normalisiert offene `{x, w}`-Spannen, vereinigt überlappende und sich berührende Spannen und berechnet Wandteile aus derselben Vereinigung. `passesGate(px, radius, layout)` prüft gegen diese Öffnungen. Das Layout ist für Spawn und Power-up-Wechsel gedacht, nicht für jeden Frame. Diese reine Logik ist noch nicht mit dem Spielablauf verbunden.

Statische Mesh-Raycasts bei Hindernis 1/80/200 und `G = 3,7` zeigen ungelöste Verdeckung der Folgewand: Reichstag 27/27/27, Rathaus 9/9/27, Turm 18/18/0 und Oberbaumbrücke 4/4/4 von jeweils 27 Proben; Tor und East Side Gallery waren in diesen Stichproben frei. Die Sichtregel ist nicht allgemein erfüllt. Es ist weder eine Silhouettenlösung noch Durchsicht oder Fade beschlossen. Die Kamera- und Freiraumprüfungen bestehen bei `G = 3,7` und beim Power-up-Maximum `G = 4,8`; sie ersetzen keinen laufenden Spieltest. Das gesamte Runtime-WebP-Budget von etwa 2 MB muss vor Integration erneut geprüft werden. Die Bilder dieser Runde bleiben lokale Review-PNGs. Spielintegration, 4× CPU-Drossel und echte Geräte wurden nicht geprüft.

Angefragt und entschieden vom Nutzer. Gebaut von GPT-6 Luna; koordiniert von GPT-6.1 Sol; Review von GPT-6.1 Sol (medium). Branch `feat/sightseeing-round-2` auf `main` nach PR #63. Dokumentation und Implementierung sind uncommitted; es gibt keine Commit-Hashes.
