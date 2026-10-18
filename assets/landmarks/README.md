# Brandenburger Tor

Diese drei Laufzeit-WebPs sind echte freigestellte Blender-Renders aus dem freigegebenen detaillierten Modell, keine Ausschnitte des alten Tor-Prototyps. Dach/Friese/Reliefs/Quadriga, kannelierter Pfeiler und Eichensperre behalten die Originalmaterialien. Alle Bildgrenzen sind mit Weltmaßen in `js/gate-sprite-data.js` hinterlegt. `provenance.json` protokolliert Quelle, SHA-256, Exportskript, Rendermaße und Größen.

Lokale Quelle (bewusst nicht als großes Runtime-Asset eingecheckt):
`.claude/review/quellen/brandenburg-gate/brandenburg-gate-detailed.blend`,
Look-Referenz daneben: `hero-paper.jpg`.

Erneut bauen, wenn die Quelle im eigenen Worktree vorhanden ist:

```sh
blender -b -P tools/blender/render-brandenburg-sprites.py
python3 tools/build-gate-sprites.py
```

Transparente WebPs, maximal 2048 Pixel breite Dachpartie; nur bei Auswahl der Berlin-Tour geladen. Zusammen 80.388 Bytes WebP und 5.687.728 Bytes dekodiertes RGBA (ca. 5,42 MiB). Die großen Review-Renders werden nicht ausgeliefert. Keine neuen API-Bilder für diesen Export. Herkunft und Abwägung: ADR 0034/0035; die vier weiteren Gebäudetickets sind keine alternative Designvorlage.

# East Side Gallery

Sechs freigestellte Blender-Renders (je eine Bucht, drei je Flügel) aus `east-side-gallery-detailed.blend`, mit den freigegebenen Wandbildern (Porträt/Taube, Hände/Olivenzweig), Rollkappen, L-Füßen, Fugen und Schild. Alle Buchten haben gleiche Breite und Mitte (Raster `GALLERY_PITCH` in `js/gallery-sprite-data.js`). Quelle: `.claude/review/quellen/east-side-gallery/` (lokal); Herkunft und Hashes in `gallery-provenance.json`.

```sh
blender -b -P tools/blender/render-gallery-sprites.py
python3 tools/build-gallery-sprites.py
```

Nur bei Auswahl der Berlin-Tour geladen. Zusammen etwa 75 KB WebP, 2,4 MB dekodiertes RGBA. Entscheidung: ADR 0049.

# Oberbaumbrücke

Vier freigestellte Blender-Renders aus `oberbaum-bridge.blend`: zwei Türme (`tower-left` achteckig, `tower-right` rund), der Bogen `arch` und der Pfeiler `pier`. Quelle: `.claude/review/quellen/oberbaum-bridge/` (lokal); Herkunft und Hashes in `oberbaum-provenance.json`.

```sh
blender -b -P tools/blender/render-oberbaum-sprites.py
python3 tools/build-oberbaum-sprites.py
```

Nur bei Auswahl der Berlin-Tour geladen. Zusammen etwa 138 KB WebP, 5,2 MB dekodiertes RGBA. Entscheidung: ADR 0053.
