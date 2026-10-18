# Übergabe: neue Grafik und Implementierungs-Tickets

Stand: **18. Oktober 2026**. Für eine neue Session zuerst dieses Dokument, die [Engineering-Prinzipien](engineering-principles.md) und den [Ticketplan](plans/art-integration-2026-10-18/README.md) lesen. Nicht erneut mit einer grundsätzlichen Stilbefragung anfangen.

## Stand und nächster Schritt

Der Nutzer möchte die neuen Modelle vollständig ins Spiel übernehmen. Die Produktentscheidungen unten sind getroffen. **Implementiert ist diese Integration noch nicht.** Elf einzelne Ticket-Entwürfe mit Abnahmekriterien liegen jetzt dauerhaft unter `.docs/plans/art-integration-2026-10-18/`; sie waren zuvor nur im ignorierten Review-Verzeichnis vorhanden.

**Nachtrag 18.10., später:** Der Nutzer hat die Aufteilung freigegeben. Claude Opus 5.5 hat sie auf GitHub veröffentlicht: 01 → #28, 02 → #71, 03 → #72, 04 → #73, 05 → #74, 06 → #47, 07 → #75, 08 → #24, 09 → #20, 10 → #76, 11 → #77 (geparkt, ohne `ready-for-agent`). Blockierungen und Epic-Zuordnung sind gesetzt, Vermerke an #27, #19 und den Epics. Die Arbeit läuft in OpenCode-Panes in herdr: `sightseeing` an #28, `figuren` an #24, `boden` an #75 (Worktree `boden`, Branch `feat/boden-scroll`). **Der Fernsehturm ist gestrichen:** Nach Sichtung der Spielbilder wollte der Nutzer ihn gar nicht mehr, auch nicht in der Berlin-Tour. #47 ist geschlossen; die Arbeit im Worktree `turm` (Branch `feat/fernsehturm-rand`) bleibt lokal ohne PR, das Pane `turm` ist frei. Die nötigen Art-Quellen liegen pro Worktree unter `.claude/review/quellen/`. Nicht erneut über den Look oder einen Probelauf verhandeln. Der Bestenlisten-Schutz (#77) wird **erst später bearbeitet**.

Basis von `origin/main` beim Start der Panes: `717f1d2`. Vor weiterer Arbeit den tatsächlichen Stand prüfen.

## Getroffene Nutzerentscheidungen

- **Look behalten.** Die neueren detaillierten Modelle sind die Referenz. Alte Vorher-/Nachher-Bilder in Safari sind kein Auftrag, wieder ältere Modelle oder ausschließlich gemalte Gebäude zu verwenden. Die vorhandene Codebase und die aktiven Worktrees zuerst lesen.
- **Fünf Gebäude ersetzen Hindernisse:** Brandenburger Tor, East Side Gallery, Oberbaumbrücke, Reichstag und Rotes Rathaus. Die Durchfahrt ist die tatsächliche Spiellücke und muss auch links/rechts versetzt sein. Keine immer mittige Toröffnung.
- **Nur die Optik ändern:** Geschwindigkeit, Hindernisabstände, Schwierigkeitskurve, bestehende Lückenerzeugung, Wertung und Helmregeln bleiben erhalten. Sommer-Doppellücken und das Verbreiterungs-Pickup berücksichtigen.
- **Fernsehturm ausschließlich als markantes Wahrzeichen am Rand**, deutlich sichtbar; kein durchfahrbarer Turmfuß und kein Hindernis. Das vorhandene Ticket #47 betrifft gelegentliche Randkulisse im normalen Jahreszeiten-Modus. Die Berlin-Tour darf den Turm zusätzlich verwenden. **Später vom Nutzer ganz gestrichen, siehe Nachtrag oben.**
- **Vollständige Integration**, nicht erst eine als Endergebnis verkaufte kleine Teststrecke. Die einzelnen Tickets sind Implementierungsschritte; jedes wird trotzdem eigenständig geprüft.
- **Storni ist optisch akzeptiert:** große rote Schrift, kräftiges Orange, größere Flasche vor der Figur. Keine weitere Flaschen-Neugestaltung. Das vereinbarte Intro ist ungefähr 1,5 Sekunden lang und überspringbar: drehen, zwei Schritte, Flaschenkontakt, einrollen; Alaska auf vier Pfoten.
- **KISS/YAGNI bleiben verbindlich:** die vorhandene Canvas-/WebP-Pipeline und passende Worktree-Vorarbeiten nutzen. Kein Live-3D-Renderer, Framework oder neues Login-System nur für diese Integration.
- Referenzbilder dürfen an Google Gemini/Nano Banana und erforderlichenfalls einen 3D-Generator gesendet werden. Keine Schlüssel in Dateien oder Ausgaben. Nano Banana 2.1 über den vorhandenen Gemini-Key war für die Referenzen ausdrücklich gewünscht. Die neuen Architekturmodelle wurden auf Wunsch mit GPT-6.1 Sol High auf Subagenten verteilt.
- Kein bezahlter Tripo-Lauf. Die neue Alaska-Rekonstruktion über die öffentliche kostenlose TRELLIS.2-Demo ist tatsächlich gelungen. Kostenloses Demo-Kontingent ist nicht garantiert.

Diese Entscheidungen sind in [ADR 0037](decisions/0037-integrate-reviewed-art-without-rebalancing.md) festgehalten.

## Galerie und lokale Quellen

Die vollständige neue Galerie wurde in Safari geöffnet und ihre 3D-Ansicht sichtbar geprüft:

<http://127.0.0.1:8784/.claude/review/art-round-2-2026-10-14/index.html>

Falls der lokale Server nach dem Sessionwechsel nicht mehr läuft, **vom Repo-Root** starten:

```sh
bun .claude/review/art-round-2-2026-10-14/serve.js
```

Bei bereits belegtem Port zuerst prüfen, ob die Galerie schon erreichbar ist; keinen fremden Prozess beenden. Der Server bindet an `127.0.0.1`. Die neue Galerie hat neun Einträge: sechs Wahrzeichen, Alaska, Storni und Boden. Sie zeigt Referenzen, tatsächliche Blender-Renders, Parkkompositionen und sieben drehbare GLB-Modelle sowie Blender-Downloads.

**Wichtig:** `.claude/` ist vollständig gitignoriert. Diese Quellen existieren lokal im Hauptcheckout, reisen aber bei einem frischen Clone oder neuen Worktree nicht automatisch mit. Vor Bereinigung/Archivierung der Worktrees oder Exporten die benötigten Quelldateien gezielt sichern bzw. im späteren Implementierungsticket übernehmen. Die großen Review-Dateien nicht pauschal ins Laufzeit-Asset-Verzeichnis kopieren.

Die Quellenliste steht unter [Art-Quellen](art-review-sources-2026-10-18.md). Hauptverzeichnis: `.claude/review/art-round-2-2026-10-14/`. Das Datum im Verzeichnis stammt vom Beginn der Runde, der letzte Stand ist vom 18. Oktober. Storni/Boden stammen aus `.claude/review/art-iteration-2026-10-14/`.

Die `.blend`-Szenen sind die Material-/Modellquelle. Die unter `models/` exportierten GLBs dienen der drehbaren Geometrieprüfung; prozedurale Materialien können von den Blender-Renders abweichen. Parkansichten sind statische Kompositionen, keine Aufnahmen einer bereits integrierten Spielversion.

## Tatsächlicher Stand der aktiven Worktrees

Read-only geprüft am 18. Oktober; bei Wiederaufnahme erneut Status und Diffs lesen. Die relevante neue Arbeit ist überwiegend **uncommittet**. Nur die Branch-Spitzen zu mergen würde sie nicht übernehmen. Andere Änderungen erhalten und keine Worktrees zurücksetzen.

| Worktree | Geprüfte Basis | Wiederverwendbare Arbeit und Grenze |
|---|---|---|
| `.claude/worktrees/sightseeing` | `e6ec7aa`, `feat/sightseeing-round-2` | `gateLayout()`/`passesGate()`, acht Tor-Tests, Metadaten und Offline-Blender-Pipeline. Noch keine Verdrahtung mit Spawn, Zeichnung, Trefferprüfung oder Theme-Auswahl. Der Renderer erzeugt noch keine zur aktuellen Lücke passende linke/rechte/doppelte Durchfahrt. |
| `.claude/worktrees/figuren` | `4b6698f`, `feat/figuren-blender` | Vierbeiner-Rig, gemeinsame Intro-Tabelle, 45 Bilder bei 30 fps, Atlas-Kandidaten, Übergangstests. Das Rig baut noch den **älteren** Alaska-Körper aus primitiven Teilen; an den neuen TRELLIS-Körper anpassen, nicht diesen ersetzen. |
| `.claude/worktrees/daten` | `330e10b`, `feat/d1-passkeys` | Uncommittete D1-/Passkey-Arbeit, keine Art-Integration. Separat erhalten; keine Voraussetzung für Grafik oder den vorgeschlagenen Anti-Bot-Schutz. |
| `.claude/worktrees/feinschliff` | `4db279c`, `feat/gameplay-polish` | Separate Balancing-/Effektarbeit. Nicht stillschweigend übernehmen, weil der aktuelle Auftrag gerade das bestehende Balancing erhalten soll. |

Zusätzliche ADR-Nummern sind in Worktrees belegt: 0030 (Figuren), 0033 (Sightseeing), 0036 (Daten). Daher verwendet diese Übergabe 0037. Alte Aussagen in Sightseeing-ADR/Registry zu kleinem nebligem Turm bzw. durchfahrbarem `tv-tower-foot` sind durch die aktuelle Nutzerentscheidung überholt; die älteren Dateien nicht als Freigabe für diesen Look behandeln.

## Technische Grenzen, die die Tickets bereits berücksichtigen

- Das Spiel verwendet **Canvas 2D mit vorberechneten WebP-Sprites**, keine laufende Blender-/GLB-Szene. Runtime-Grundlagen stehen in [architecture.md](architecture.md).
- Kollision erfolgt derzeit beim Überqueren einer Hindernisebene. Visuelle Gebäudetiefe darf keine zusätzliche unsichtbare Kollisionsmechanik einführen.
- Der Tor-Prototyp führt überlappende/berührende offene Bereiche zusammen. Die heutige Trefferprüfung verlangt, in eine einzelne Lücke zu passen. Eine bloße Verdrahtung von `passesGate()` könnte damit die Regeln ändern. Den Grenzfall ausdrücklich mit dem bisherigen Verhalten vergleichen und Darstellung/Kollision konsistent halten.
- Hohe Fassaden können Folgelücken verdecken. Besonders Rathaus und äußere Bereiche bei Oberbaum sind offen; Blender-Strahlenproben ersetzen keinen Lauf im echten Spiel. Sichtkorrekturen gehören in die jeweiligen Gebäudetickets, nicht in veränderte Abstände.
- Der Rathaus-Torbogen wurde im neuen Blender-Stand durch korrekt orientierte Schnittgeometrie geöffnet. Drei Längsproben sind frei. Ältere `measurements.json`-Werte stammen vor dieser Reparatur; die Sicht auf Folgelücken ist nicht allgemein freigegeben.
- Alaska: neuer tatsächlicher TRELLIS-Körper, ungefähr 95.000 Polygone, separate Regenbogenbrille, korrigierte Fellfarbe. **Noch ungeriggt**, Artefakte an Fell/Ohren/Schwanz, keine neue Lauf-/Rollanimation. Die Figuren-Worktree-Posen sind Vorarbeit für die Anpassung. Keine erfundene Rekord-Freischaltschwelle; #21 bleibt eine eigene Funktion.
- Statisches Bodenbild in scrollbare Materialien überführen; bestehende Geländeprojektion und Erde/Kies/Gras-Verhalten erhalten.
- Die neue gemeinsame Intro-Laufzeit muss sich nach dem gewählten Figurenclip richten; heutige Kalle-spezifische Bildzahlen nicht auf andere Figuren übertragen.
- WebP bei größter Bildschirmgröße × DPR 2, vorhandenes Bild-/Speicherbudget, bedarfsgerechtes Laden und Leistung auf Handys berücksichtigen. Keine 4K-Review-Bilder als Laufzeitgrafiken übernehmen.

## Ticketplan und GitHub

Zieltracker ist bereits entschieden: [GitHub Issues](https://github.com/SvenGoerdes/roll-down-volkspark/issues), siehe ADR 0026. Kein erneutes Tracker-Setup verlangen.

Die [elf konkreten Entwürfe](plans/art-integration-2026-10-18/README.md) enthalten Lieferumfang, Abhängigkeiten, prüfbare Kriterien und die Zuordnung zu vorhandenen Aufgaben. Vier vorhandene Untertickets sollen konkretisiert werden: #28 (erstes Tor/Theme-Einstieg), #47 (Fernsehturm), #24 (Intro), #20 (Alaska). Die übrigen Entwürfe werden neue Issues. Eltern-Epics #25/#17/#22/#42 nicht umschreiben oder schließen.

Überschneidungen bei Veröffentlichung ausdrücklich zuordnen: #27 wird durch die fünf Bauwerktickets abgedeckt; #19 durch die neue Alaska-Integration. Das gemeinsame Intro #24 ist erst nach dem Alaska-Anteil vollständig erledigt. So startet niemand parallel eine zweite Umsetzung alter Modelle.

Nach Freigabe die Issues in Abhängigkeitsreihenfolge veröffentlichen, echte Blocking-Beziehungen setzen und das vom Skill vorgesehene Label `ready-for-agent` verwenden; dieses Label existierte beim Audit noch nicht. **Das spätere Security-Ticket nicht als sofort ausführbar markieren.** Es hat keine technische Abhängigkeit von Grafik; „danach“ ist die vom Nutzer vorgegebene Reihenfolge.

## Bestenliste: später, noch kein beschlossener Token-Mechanismus

Der Nutzer möchte die Möglichkeit einfacher direkter Bestenlisten-Einträge absichern und zunächst erklärt bekommen, wie Tokens helfen. Er hat ausdrücklich **keine sofortige Umsetzung** angefordert. Der aktuelle Worker prüft Origin, Format, Wertebereiche und weiche Anfragelimits. Eine erlaubte Origin-Angabe ist in einem Skript nachahmbar; ein fest im Browser hinterlegter Geheimcode hilft nicht.

**Vorschlag, noch nicht freigegeben:** Cloudflare Turnstile nur beim Eintragen. Der Browser sendet einen frischen Token; der Worker prüft ihn mit Siteverify einschließlich Website/Aktion. Fehlende, ungültige, abgelaufene und erneut verwendete Tokens dürfen keinen Schreibvorgang auslösen. Tokens sind fünf Minuten gültig und einmal validierbar. Der geheime Prüfschlüssel bleibt serverseitig; kein neues JWT-/Login-/Passkey-System allein dafür.

Der wichtige Unterschied ist erklärt: Ein gültiger Anti-Bot-Token bestätigt **keinen tatsächlich erspielten Punktestand**. Ein Client mit gültigem Token kann weiterhin einen Score behaupten. Wenn der Nutzer auch das verhindern möchte, muss der zusätzliche Umfang verbindlicher Laufprüfung erst geklärt werden. Nicht „curl unmöglich“ oder vollständigen Cheat-Schutz versprechen. Keine künstlichen Testrekorde in die produktive Bestenliste schreiben.

Quellen: [Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [MDN zu CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).

## Was bereits geprüft wurde / was noch fehlt

- Neue Nano-Banana-Referenzen und tatsächliche Blender-Renders visuell geprüft; sieben GLBs erfolgreich exportiert.
- 64 Galerie-Verweise auf Bilder, Quellen, Blender-Dateien und GLBs lieferten beim lokalen Test HTTP 200; sieben GLB-Dateiköpfe gültig. Berichte liegen im Review-Verzeichnis (`gallery-file-checks.json`, `models/exports.json`).
- Galerie und drehbares Modell sichtbar in Safari; aktuelle Screenshot-Datei `gallery-preview.jpg` im Art-Verzeichnis. Storni blieb beim bestätigten Stand.
- **Nicht erledigt:** Integration in Runtime, vollständige Spielbarkeit/Sichtprüfung, Animation des neuen Alaska-Modells, Performance-Prüfung dieser neuen Integration und Tests auf echten Geräten. Keine alten Testergebnisse als Nachweis für die noch nicht gebaute Integration verwenden.
- Die elf Ticket-Entwürfe wurden auf Struktur und Abhängigkeiten geprüft sowie durch einen GPT-6.1-Sol-High-Agenten mit den aktiven Worktrees abgeglichen.

## Kurzer Starttext für die neue Session

> Lies `.docs/README.md` und `.docs/handoff.md`, danach den dort verlinkten Ticketplan. Wir behalten den neuen Modell-Look, integrieren alle Motive mit versetzten Durchfahrten und lassen Abstände/Schwierigkeit unverändert. Nutze die aktuelle Worktree-Vorarbeit. Die Ticketaufteilung ist vorbereitet, aber noch nicht in GitHub veröffentlicht. Bestenlisten-Schutz nur für später planen; jetzt nicht umsetzen.
