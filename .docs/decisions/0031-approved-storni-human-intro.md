# 0031: Freigegebene Storni und clipabhängiges menschliches Intro

- **Status:** Accepted (im Spiel vom Nutzer freigegeben am 18.10.2026)
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Issue #24, bestätigte Hero-Flasche, Ablauf, ungefähr 1,5 s, Tipp-Skip; Alaska separat in #20); Claude-Orchestrator (Umfang und ADR-Nummern); GPT-6.1 Sol (Export und Ankerabgleich)
- **Built by:** GPT-6 Luna (`openai/gpt-6-luna`, Runtime/Tests), GPT-6.1 Sol (`openai/gpt-6.1-sol`, Export/Integration); Vorarbeit laut ADR 0030 wiederverwendet; unabhängiges Review durch GPT-6.1 Sol medium, keine blockierenden Findings
- **Commits:** noch nicht erstellt; Branch `feat/storni-intro`, vor dem PR auf `origin/main` rebasen

## Context

Die lokale Vorarbeit aus ADR 0030 enthält die gemeinsame Posenfolge und Review-/Atlas-Helfer. Ihre frühere Storni hat jedoch noch kleine dunkle Schrift und eine kleinere Geometrie. Verbindlich ist der neuere, bestätigte Hero-Stand unter `.claude/review/quellen/storni/`, insbesondere `renders/storni-hero.blend`, `renders/storni-hero-paper.jpg` und `scripts/storni_large.py`. ADR 0037 auf `origin/docs/art-tickets-published` ergänzt die älteren Stilentscheidungen: Modelle nicht neu gestalten, Spielregeln nicht ändern.

Die bisherige Runtime berechnet Introzeiten aus Kalles `idle`/`turn`/`trip`-Bildzahlen. Gleiche Bildzahlen für jede Figur sind kein zulässiger Vertrag für spätere Clips.

## Decision

- `storni.py` übernimmt Geometrie, Materialfarben, Serifenschrift (Georgia Bold Italic) und Maßstab 4,0 aus dem freigegebenen `storni_large.py`, nicht den alten Flaschenentwurf. Die Typografie erhält nur die bereits freigegebene Rückkamera-Ausrichtung. Die Flasche liegt bei `(-0.35, 0.45, 0.16)` vor den Füßen; nach Kontakt bewegt sie sich zur Seite. Keine neue Bildgenerierung oder Live-3D-Engine.
- Kalle und Tine behalten ihre GLB-Modelle, Rig-/Skinning-Pipeline und die ausgelieferten Roll-, Helm-, Crash- und Auswahlatlanten. `intro.py`, `review.py` und deren Tests bleiben die Basis. Nur der menschliche Kontakt übernimmt die vorbereitete Catch-Pose der neuen Storni-Quelle. Alaska-Code und Alaska-Assets werden in diesem Ticket nicht weiterentwickelt.
- `export-intro.py` nutzt die 36 vorhandenen Posen vom Drehen bis zur Ballpose; für die Runtime werden daraus 30 Bilder bei 20 fps, also 1,5 Sekunden. 192 Pixel je Figureneinheit decken die Darstellung bis etwa 457 CSS-Pixel Spielbreite bei DPR 2 ab. So bleiben beide Atlasachsen unter 2048 px, ohne zusätzliche Seitenlade-Logik. Die neun reinen Roll-Vorschaubilder des ursprünglichen 45-Bilder-Prototyps werden nicht doppelt ausgeliefert.
- Alle Posen werden im Export am Boden ausgerichtet: der positive Lift des Prototyps darf nicht erst am letzten Bild nach unten springen. Die bisherige Stehkorrektur wird offline eingebrannt. Der letzte Introframe wird aus dem bestehenden Rollframe 0 mit entsprechend angepasster Pixeldichte übernommen. Anker und Weltmaßstab bleiben gleich; die bestehende Touchdown-Verformung wird am Introende eingeblendet.
- `build-intro.py` aktualisiert gezielt nur den jeweiligen Introclip in `figure-sheets.js`. `n`, `fps`, `contact`, `ppu` und Anker liegen pro Clip. `introAt(t, sheets)` verwendet ausschließlich den tatsächlich gewählten Clip. Ein Test verwendet ausdrücklich unterschiedliche synthetische Clipzeiten; keine Kalle-Zeitkonstante und kein Test auf gleiche Bildzahlen mehr.
- Nur `intro`, `roll`, `roll-helmet`, `dazed` der gewählten Figur laden; `select` bleibt für die Karten. Die sechs nicht mehr referenzierten `idle`/`turn`/`trip`-Atlanten werden ersetzt, nicht zusätzlich ausgeliefert. Spielzeit während des Intros bleibt null. Tipp-Skip, schnelle Wiederholung ohne Intro und Figurenwechsel behalten den bestehenden Ablauf. Keine Änderungen an Geschwindigkeit, Spawning, Lücken, Wertung oder Helmen.

## Alternatives

- Hero-Bilder oder `.blend` direkt in Runtime-Assets kopieren: zu groß und keine passende Animation.
- Den alten Entwurf neu einfärben: würde Geometrie und Typografie des bestätigten Standes verlieren.
- Alle 45 Reviewframes höher auflösen und mehrere Atlasseiten einführen: unnötiger Download-/Speicher-/Ladeaufwand für bereits vorhandene Rollframes.
- Kalles Laufzeit weiter als gemeinsame Konstante nutzen: verhindert eigene Clipzeiten; widerspricht #24 und der Übergabe für #20.

## Consequences and checks

- Intro-WebP: Kalle **231.400 Byte**, 1860×1840, **13.689.600 RGBA-Byte**; Tine **203.714 Byte**, 1830×1775, **12.993.000 RGBA-Byte**. Qualität 78. Alle aktuellen Runtime-WebPs zusammen **2.093.408 Byte (1,996 MiB)**, also knapp unter dem ~2-MiB-Ziel. Andere Art-Branches müssen ihr zusätzliches Budget erneut prüfen.
- Vier geladene Spielatlanten: Kalle **27.617.920 Byte (26,34 MiB)**, Tine **26.535.784 Byte (25,31 MiB)** dekodiert, ohne Auswahlkarten, Canvas-Caches und Umgebung. Ein Figurenwechsel kann während des Ladens kurzfristig beide Sätze halten; danach wird der alte Cacheeintrag entfernt. Kein Leistungsversprechen allein anhand der Dateigrößen.
- Prüfung: `bun test tests` (103 bestanden), `python3 tools/blender/test_intro.py` (7 bestanden); echter lokaler Chrome bei 390×844 und DPR 2, beide natürlichen Enden, Tipp-Skip, Intro-Wiederholung, Retry ohne Intro, Figurenwechsel, Helmverbrauch und tödlicher Crash. Netzwerkzugriffe außerhalb des lokalen Servers werden in der Browserprüfung blockiert, keine produktiven Scores gesendet.
- 4× CPU-Drossel, je ein vollständiges Intro und zwei Sekunden Spielen: Intro-Framearbeit p95 2,9/2,7 ms, Spielen 3,6/3,4 ms (Kalle/Tine); Frameintervalle p95 bis 16,8 ms, je Phase ein Intervall über 33,5 ms. Desktop-Chrome-Messung, kein allgemeines Handy-/60-fps-Versprechen.
- Nummerierte Spielaufnahmen, Sprite-Nahansichten, Browserprotokoll und 4×-CPU-Messung liegen unter `.claude/review/24/`. Echte Mobilgeräte/iOS Safari sind nicht geprüft. Die visuelle Spielabnahme ist noch offen; kein PR vor dieser Freigabe.
- #24 ist hier nur für Kalle und Tine bearbeitet. Der gemeinsame Ablauf mit dem neuen Alaska-Modell bleibt ausdrücklich Aufgabe von #20; keine Freischaltregel und keine Alaska-Animation in diesem Patch.

## Reproduction

```sh
blender -b -P tools/blender/export-intro.py -- kalle .claude/review/24/frames/kalle
blender -b -P tools/blender/export-intro.py -- tine .claude/review/24/frames/tine
python3 tools/build-intro.py .claude/review/24/frames/kalle
python3 tools/build-intro.py .claude/review/24/frames/tine
python3 tools/blender/test_intro.py
bun test tests
```

Die beiden Pack-Aufrufe nacheinander ausführen, weil sie dieselbe Metadatendatei gezielt aktualisieren. Die Modelldateien von Kalle/Tine sind im Repository; die verwendete Schrift ist eine macOS-Systemschrift. Große freigegebene Review-Quellen bleiben gitignoriert; der nachvollziehbare Storni-Builder wird mit der Integration versioniert.
