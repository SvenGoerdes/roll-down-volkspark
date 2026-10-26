# Oberbaumbrücke: Bogenfüße an der tatsächlichen Durchfahrt

Beauftragt durch den Nutzer am 26.10.2026: gelegentlich frei hängende Bogenstücke, besonders mit ↔️ Breite Lücken, reparieren; freigegebenes detailliertes Modell und Look behalten. Umsetzung und Entscheidung zur lokalen Sprite-Ausrichtung: GPT-6.1 Sol High. Commit: dieser thematische Fix.

## Bestätigte Ursache und Korrektur

Im echten Browser bei 390 × 844 reproduziert: Der alte Renderer zeichnete den Bogen immer bei `art.arch.left` mit seiner ursprünglichen Breite von 5,43 Welteinheiten. Nur Pfeiler/Türme folgten `gateLayout(gaps).solids`. Das Bild enthält tiefe Bogenfüße ab ca. 1,92 Einheiten über dem Boden. Der bisherige Schnitt bei `WALL_H = 1,65` traf dieses Bild überhaupt nicht und war daher kein Nachweis für gestützte Bogenfüße. Bei einer mittigen verbreiterten Lücke von 4,8 Einheiten oder einer seitlich versetzten Lücke wurden die stützenden Pfeiler entfernt; die unveränderten Bogenfüße blieben in der Öffnung stehen.

Der vorhandene Bogen-Sprite wird nun pro tatsächlicher Öffnung horizontal ausgerichtet und skaliert. Seine inneren Ansatzpunkte an der Pfeilerkrone (Pixel 140 und 555 des 696 Pixel breiten Originals) treffen die beiden Spiellückenkanten. Höhe, Bodenanker, Bilder und Türme bleiben erhalten. Doppelöffnungen erhalten zwei Bögen; überlappende Öffnungen einen gemeinsamen Bogen. Bei engen Mittelpfeilern treffen sich die zugehörigen Bildausschnitte über der Mitte des festen Pfeilers. Eine Änderung der Öffnung aktualisiert das zwischengespeicherte Layout in beiden Richtungen, auch beim Auslaufen des Pickups.

Kein neuer Rahmen, keine hellen Linien, kein Sichtfenster. Keine Änderung an Kollision, Spawnabständen, Lückenerzeugung, Pickup-Dauer oder Schwierigkeit. `p.sx` als Bildursprung erlaubt die gleichzeitig separat entwickelte Kameraprojektion.

## Reproduzierbare Prüfung

Mit `bun tools/serve.js` starten und im echten Browser `http://127.0.0.1:8765/tools/oberbaum-preview.html` bei 390 × 844 öffnen. Die Fixture verwendet Runtime-Renderer und Original-WebPs. Auswahl: mittig, links, rechts, doppelt, überlappend; ↔️ an/aus; Abstände 14, 10, 6. Sie hält dieselbe Wand während der Änderungen fest.

Zusätzlich prüft sie echte Rasterpixel, statt allein die Rechtecke gemockter Zeichenaufrufe zu prüfen. In 45 Fällen (5 Layouts × 3 Abstände × normal/verbreitert/wieder normal) werden Bogen und Pfeiler getrennt gerastert. Die deckenden Bogenfußpixel in der unteren Zone zwischen 2,05 und 3,3 Welteinheiten müssen von Mauerwerk unterstützt sein; ein Pixel Antialias-Toleranz. Ergebnis: **45/45 gestützt, 0 freie Bogenfußpixel**. Dieser Test prüft die problematischen Füße, nicht pauschal jeden oberen Bogenpixel.

Zum Vergleich optional die Basisdatei aus Commit `66b59d7e90996906139525d98cfe6e94756beb0f` nach `.claude/review/oberbaum/render-before.js` exportieren und die relativen Imports `./` durch `../../../js/` ersetzen; dann `tools/oberbaum-preview.html?before` öffnen. Die Vergleichskopie bleibt ignoriert. Identischer Rastertest gegen den alten Renderer: **39 Fehlerfälle, 23.860 freie Fußpixel**. Das optionale „Vorher“-Kästchen schaltet die sichtbare Brücke um.

## Ergebnis am 26.10.2026

- `bun test tests`: **169 pass, 0 fail, 42.691 Assertions**. Oberbaum-Tests prüfen jetzt die wirkliche Position der Ansatzpunkte für versetzte, doppelte und verbreiterte Öffnungen, Anzahl zusammengeführter Bögen und an/aus während der Annäherung; der alte Arch-Cutoff-Test wurde ersetzt.
- Eigener Bun-Server auf Port 8873 (temporärer Bun-Preload überschreibt ausschließlich den Port); eigener Cua-Browser-Tab, 390 × 844. Mittig verbreitert, rechts versetzt sowie doppelt normal/verbreitert visuell gesichtet. Doppellücke beim Wechsel von z=10/verbreitert zu z=6/normal geprüft.
- Vollständige eingefrorene Herbst-Spielszene mit Kalle, Berlin-Tour, verbreiterter Oberbaumbrücke bei z=10 und Folgewand bei z=29 zusätzlich gesichtet. Keine Fehler/Warnungen im Browserlog. Lokale ignorierte Spiel-Fixture unter `.claude/review/oberbaum/game.html` (Spielindex mit gleicher Ressourcenbasis plus separates Fixture-Skript).
- Bilder: `/private/tmp/oberbaum-before-wide.png`, `/private/tmp/oberbaum-after-wide.png`, `/private/tmp/oberbaum-after-right.png`, `/private/tmp/oberbaum-after-double-wide.png`, `/private/tmp/oberbaum-after-double-near.png`, `/private/tmp/oberbaum-after-game-wide.png`. Temporäre Prüfbilder, keine neuen Laufzeit-Assets.

Grenzen: kein echtes Mobilgerät, keine Safari-Prüfung und keine neue FPS-Messung. Horizontale Bogenproportionen folgen bewusst der Spiellücke; der Sprite wird nicht neu modelliert. Die Messpunkte beziehen sich auf die aktuellen unveränderten WebPs und müssen bei späterem Neurendern anhand der Rasterprüfung neu kontrolliert werden.
