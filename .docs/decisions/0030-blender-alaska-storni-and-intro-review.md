# 0030: Alaska, Storni und Intro per Blender-Skript, getrennte Renderfreigabe

- **Status:** Accepted (Konzept und Arbeitsweise; Modell-/Renderfreigabe steht aus)
- **Date:** 2026-10-14
- **Decided by:** Nutzer (Alaska 04 mit Regenbogengläsern, Storni 03 mit kräftigem Orange, 1,50-s-Intro, Blender-Modellierung); Claude-Orchestrator (Worktree, Freigabestufen, ADR-Nummer); GPT-6.1 Sol (kleine Skriptmodule und Prüfablauf)
- **Built by:** GPT-6 Luna (`coder`) und GPT-6.1 Sol (`openai/gpt-6.1-sol`); Review GPT-6.1 Sol
- **Commits:** noch nicht erstellt; `feat/figuren-blender`, Freigaberunde 3 im Worktree

## Context

Issues #17/#18 fordern eine neue Britisch-Kurzhaar Alaska mit Sonnenbrille. Issues #22/#23/#24 fordern eine größere, deutlich erkennbare Storni und ein kurzes Intro: loslaufen, Flasche sehen, stolpern, rollen. Der Nutzer hat die Konzepte aus Runde 2 und das 1,50-s-Storyboard freigegeben. Nano Banana hat korrekte Model-Sheet-Ansichten nicht zuverlässig erzeugt; die verbindlichen Ansichten entstehen deshalb aus dem tatsächlichen Blender-Modell.

ADR 0018 beschreibt menschliche Modelle mit gemessenen Gelenken und NumPy-Skinning. Das passt für Kalle und Tine, aber nicht ohne Anpassung zu einer Katze auf vier Pfoten.

## Decision

- Alaska und Storni werden vollständig lokal per headless Blender-5.2-Skript modelliert. Nano Banana dient Konzepten und gegebenenfalls Texturen. Alaska erhält ein kleines Vierpfoten-Rig mit lokalen Gelenken, weichen überlappenden Modellteilen und fest am Kopf sitzender Brille. Die bestehenden menschlichen Modelle bleiben die Basis von Kalle und Tine.
- Eigene Module für Katze, Flasche, reine Animationstabellen und Freigaberender. Der Prototyp rendert 45 Frames bei 30 fps; die ersten 36 bilden das Intro bis zur Ballpose, die letzten neun zeigen die durchgehende Rollphase. Beim späteren Spiel-Export soll der vorhandene Rollatlas diese letzten Frames liefern.
- Licht und Materialien folgen dem freigegebenen PBR-Look aus ADR 0018. Vier Ansichten nutzen dieselbe Geometrie und nur unterschiedliche Orthokameras; links bedeutet Nase nach Bild-links wie in ADR 0016. Storni behält den Namen aus ADR 0020, das kräftige Orange bleibt in allen Ansichten identisch.
- PNGs, `.blend`-Szenen, Übersichten, animierte Vorschauen und gemessene Atlas-Kandidaten liegen zunächst ausschließlich im gitignorierten `.claude/review/`. Keine Aufnahme ins Spiel vor ausdrücklicher Modell-/Renderfreigabe. Die `.blend`-Dateien speichern das Modell in der letzten Renderpose; die Animation wird durch das Skript reproduziert und liegt als PNG-Sequenz vor.
- Der spätere Sprite-Export bleibt vorgerendertes 2D: kein Rig und keine Blender-Logik im Frame-Loop. Beide Atlasachsen ≤2048 px; tatsächliche Download- und RGBA-Größen werden vor Integration geprüft. Der Freigabe-Prototyp ändert das aktuell ausgelieferte Intro aus ADR 0019 noch nicht.

## Alternatives

- Weitere KI-Vieransichten: unzuverlässige Seiten-/Rückenansichten; nur als Erscheinungsentwurf genutzt.
- Menschlichen Rig unverändert auf Alaska anwenden: falsche Lauf- und Rollanatomie.
- Physiksimulation für das Stolpern: mehr Abstimmung und schlechter reproduzierbar; feste Posen und geskripteter Flaschenstoß reichen.
- Direkt bestehende Spiel-Atlases überschreiben: würde den vorgesehenen Renderfreigabestopp umgehen.

## Consequences

- Kameraansichten und Frames bleiben geometrisch konsistent, reproduzierbar und unabhängig von Bild-API-Kosten.
- Das Katzen-Rig ist für die freigegebenen Posen ausgelegt; weitere Animationen wie die Renn-Animation für #64 brauchen neue Laufposen und eigene Renderfreigabe.
- WebP-Kandidaten der Introphase liegen aktuell über den frühen Downloadzielen. Kompression, endgültiges Framing und das Gesamtbudget aller Grafik-Branches bleiben vor Spielintegration zu prüfen. Die Vorschau ist noch kein Leistungsnachweis für echte Handys.
