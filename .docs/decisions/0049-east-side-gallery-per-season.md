# 0049: East Side Gallery als Bauwerk der zweiten Jahreszeit

- **Status:** Implemented; Darstellung im Spiel wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Issue #71, ADR 0037; Abwechslung der Bauwerke in der Antwort vom 18.10.2026)
- **Built by:** Claude Sonnet 5.5 (Blender-Export, Renderer, Logik, Tests, Doku)
- **Commits:** Feature-Commit auf `feat/east-side-gallery`

## Context

ADR 0034 hat der Berlin-Tour zunächst nur das Brandenburger Tor gegeben und den Zeichenpfad für #71–#74 offen gelassen. Ticket und ADRs sagten nicht, wie mehrere Bauwerke wechseln. Der Nutzer hat entschieden: **ein Bauwerk je Jahreszeit**, also je `WALLS_PER_SEASON` (20) Mauern dasselbe, dann das nächste, im Kreis. Frühling Tor, Sommer Galerie, danach wieder von vorn.

## Decision

- `TOUR_LANDMARKS` in `js/config.js` ist die Reihenfolge. #72–#74 hängen ihre Ids an. `landmarkAt(n, order, perSeason)` in `js/logic.js` liefert das Bauwerk für Mauer n (rein, getestet). `render-scene.js` wählt danach den Zeichenpfad.
- Die Galerie besteht aus sechs Bucht-WebPs (drei je Flügel) aus `east-side-gallery-detailed.blend`: Betonplatte, Rollkappe, L-Fuß, Fugen, Wandbild-Ausschnitt, Schild. Keine neue Bildgenerierung; die Wandbilder sind die freigegebenen Nano-Banana-Texturen im Modell.
- `galleryTiles()` (rein, getestet) füllt jede geschlossene Wandspanne von ihrer offenen Kante nach außen mit Buchten. An jeder Durchfahrt steht eine ganze Bucht mit Kappe; die Bilder laufen als Streifen l1..l3 r1..r3 im Kreis. Jede Bucht wird auf ihre Spanne beschnitten. Wandbilder liegen damit nie über einer Durchfahrt.
- Öffnungen folgen den bestehenden Lücken über `gateLayout()`; Treffer bleiben bei `passesWall()` mit einzelnen Originallücken (ADR 0035). Kein Sichtfenster: es entfällt auf Wunsch des Nutzers in PR #82; die Galerie hat keines.
- `js/render-gallery.js` ist eigenständig und ändert `render-gate.js` nicht. Das hält den Merge mit PR #82 klein.
- Nur die Berlin-Tour lädt die Bilder, zusammen mit den Tor-Teilen. Ein Ladefehler hält den Start an und lässt sich wiederholen.

## Alternatives

- Wand für Wand abwechseln oder zufällig wählen: vom Nutzer zugunsten der Jahreszeit verworfen.
- Ein einziges breites Galeriebild: kann variable Lücken nicht abbilden.
- Gemeinsame Teile-Abstraktion mit dem Tor: nicht nötig; zwei kleine konkrete Zeichenpfade (YAGNI).

## Consequences

Gleiche Spielzustände, gleiche Lücken, Abstände, Tempo, Wertung, Helme. Die Galerie ist in der echten Kamera klein; die Bilder sind erkennbar, aber nicht groß. Die sichtbare Wandhöhe (3,4 m Modell) liegt über dem Kollisionsband; ohne Sichtfenster kann sie die Folgemauer teils verdecken (Vorprüfung des Modells: frei). Echte Mobilgeräte nicht geprüft. Das Auftauchen einzelner Bauwerke im Volkspark ist ein eigenes späteres Ticket.
