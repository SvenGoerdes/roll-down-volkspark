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
