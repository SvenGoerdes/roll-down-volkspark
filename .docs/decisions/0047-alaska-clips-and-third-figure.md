# 0047: Alaska als dritte Figur – Clips, Atlas, Intro auf vier Pfoten

- **Status:** Accepted (Stufe 2 von #20; Spielabnahme durch den Nutzer steht aus)
- **Date:** 2026-10-18
- **Decided by:** user (Ablauf drehen, zwei Schritte, Flasche, einrollen; Brille fällt beim Losrollen; keine Freischalt-Schwelle, #21 bleibt eigenes Ticket); Sonnet 5.5 (Umsetzung, Maße)
- **Built by:** Sonnet 5.5
- **Commits:** siehe `history.md`, Eintrag 2026-10-18 „Issue #20 – Alaska Stufe 2“

## Context
ADR 0046 liefert Körper und Rig. #24 (ADR 0031) hat den Intro-Ablauf und die Clip-Metadaten pro Figur eingeführt. Alaska braucht dieselben vier Spielclips plus die Auswahlkarte und soll in der Figurenwahl erscheinen.

## Decision
- **Intro:** `intro.py` bekommt für Alaska eigene Posen: drehen (Bild 0–5), zwei Schrittpaare (6–17), Pfote trifft die Flasche (18), Stolpern, Sturz, Einrollen (bis 35). Die Brille fällt ab Bild 24 und landet um Bild 33; ab Bild 35 (Ball) ist sie ausgeblendet. Sie fliegt zur Seite und zur Kamera hin, damit der Fall von hinten sichtbar bleibt. Dauer, Kontakt und Anker kommen wie bei Kalle und Tine aus dem Clip (30 Bilder, 20 fps, 1,5 s, 192 px je Figureneinheit). Die Flasche hat für Alaska Maßstab 2,8 statt 4,0.
- **Maßstab:** `UNIT = 1,1` Blender-Einheiten je Figureneinheit (`export-intro.py`, `export-alaska.py`). Dann ist die eingerollte Katze etwa so breit wie der Ball von Kalle und Tine. Die Auswahlkarte wird mit 200 px je Einheit gerendert, weil die Karte das Bild nur halb so groß zeigt und die Katze kleiner ist als die Menschen.
- **Clips:** `export-alaska.py` rendert Auswahl, Roll (32 Bilder, starre Drehung um den Ballmittelpunkt, keine Brille), Roll mit Helm und Crash. Der Helm ist ein roter Schalenhelm (`alaska._helmet`) zwischen den Ohren. Crash: Alaska liegt auf der Seite, Kopf wackelt, Sterne am Kopf. Der Rollball nutzt die vom Nutzer freigegebene Pose aus Stufe 1.
- **Atlas:** `tools/build-figure.py` packt die Clips einer Figur und trägt nur deren Block in `js/figure-sheets.js` ein. Beide Atlasachsen bleiben unter 2048 px, die Auswahl bleibt eine Zeile.
- **Einbau:** `FIGURES` in `js/figure.js` erhält `alaska` (Name „Alaska“, Zusatz „Brillenkatze“). Keine Laufzeitänderung sonst: `loadFigure` lädt nur die vier Spielclips der gewählten Figur. Keine Freischaltregel.

## Alternatives
- Brille bleibt beim Rollen auf: vom Nutzer verworfen.
- Eine feste Kameraansicht von der Seite für das Intro: widerspricht dem gemeinsamen Spielblick von hinten.
- Alaska-Roll aus dem Intro-Endbild übernehmen wie bei Kalle (`build-intro.py`): unnötig, beide Clips rendern dieselbe Pose am selben Mittelpunkt.

## Consequences and checks
- WebP-Dateien: Auswahl 58.696, Intro 172.728, Roll 94.930, Roll mit Helm 100.884, Crash 41.402 Byte, zusammen **468.640 Byte**. Alle Runtime-WebPs zusammen jetzt rund 2.562.000 Byte (2,44 MiB); das 2-MiB-Ziel aus ADR 0031 ist damit überschritten und muss für die anderen Figuren und Art-Branches neu bewertet werden (Backlog).
- Dekodiert beim Spielen: Intro 14.712.960 + Roll 4.485.120 + Roll mit Helm 4.485.120 + Crash 3.174.912 = **26.858.112 Byte (25,6 MiB)**, etwa wie Kalle (26,3) und Tine (25,3).
- Browserprüfung (echtes Chrome, 390×844, DPR 2, nur lokaler Server, Netz sonst blockiert, Port 8776): Start, Wahl von Alaska, Intro endet von selbst, Tipp-Skip, Rollen, zwei Helme verbraucht (Bilder „Helm kaputt“), Crash, Neustart ohne Intro, Figurenwechsel zu Kalle und zurück. Keine Konsolenfehler. Aufnahmen unter `.claude/review/20/stufe2/`.
- Nicht geprüft: echte Handys, iOS Safari, Leistung unter CPU-Drossel für Alaska.

## Reproduction
```sh
blender -b -P tools/blender/export-alaska.py -- .claude/review/20/stufe2/frames/alaska
blender -b -P tools/blender/export-intro.py -- alaska .claude/review/20/stufe2/frames/alaska-intro
python3 tools/build-figure.py alaska .claude/review/20/stufe2/frames/alaska .claude/review/20/stufe2/frames/alaska-intro
python3 tools/blender/test_intro.py && bun test tests
```
