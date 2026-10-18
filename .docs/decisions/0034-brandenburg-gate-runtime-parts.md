# 0034: Brandenburger Tor aus freigegebenen Modellteilen

- **Status:** Implemented; Darstellung im Spiel wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Issue #28 und ADR 0037); konkrete Sprite-Zerlegung GPT-6.1 Sol
- **Built by:** GPT-6 Luna (Theme-Auswahl, Tor-Renderer, Tests); GPT-6.1 Sol (Blender-Export, Integration, Dokumentation)
- **Commits:** dieser Feature-Commit auf `feat/brandenburger-tor`

## Context

Die uncommittete Vorbereitung aus ADR 0033 enthält reine Torlogik, Tests und eine Offline-Pipeline, aber keine Spielintegration. Ihr altes Tor ist nicht mehr die Art-Vorlage. Maßgeblich ist `brandenburg-gate-detailed.blend` mit `hero-paper.jpg` aus der freigegebenen neuen Modellrunde. ADR 0037 auf `origin/docs/art-tickets-published` ersetzt die alten Look-Vorgaben. Der Nutzer hat während der Umsetzung ausdrücklich auch die dort noch genannte Turm-Randkulisse gestrichen: kein Fernsehturm im Spiel, in keinem Thema.

## Decision

- Die Startauswahl bietet **Volkspark** (Vorgabe) und **Berlin-Tour**. Die Wahl gilt für die aktuelle Sitzung einschließlich schnellem Neustart; keine neue Speicherung, Rangliste oder Spielregel. Die Berlin-Tour verwendet zunächst ausschließlich das Brandenburger Tor. #71–#74 ergänzen später ihre eigenen Sprites am selben konkreten Zeichenpfad.
- Drei transparente WebPs stammen direkt aus dem detaillierten Modell: Dach mit Friesen/Reliefs und Quadriga, ein Säulenpfeiler und die vorhandene Holzsperre. Materialien, Flutungen und Skulpturen bleiben erhalten. Keine neue Bildgenerierung, keine Laufzeit-3D-Engine.
- `tools/blender/render-brandenburg-sprites.py` isoliert die Originalbauteile; `tools/build-gate-sprites.py` schneidet Alpha-Ränder ab und erzeugt Weltmaß-Anker plus Herkunftsnachweis. Die große `.blend` bleibt unter `.claude/review/quellen/`, nicht im Runtime-Verzeichnis.
- Die unteren Bauteile werden ausschließlich innerhalb fester Wandspannen gezeichnet. Pfeiler stehen an den tatsächlichen Lückenkanten; die Holzsperre kennzeichnet geschlossene Zwischenräume. Das Dach bleibt mittig, während die vorhandenen Einzel-/Doppellücken und ihr Verbreiterungszustand die unteren Teile verschieben.
- Hohe Teile erhalten nur dort ein transparentes Sichtfenster, wo sie die tatsächliche Durchfahrt des Folgetors verdecken. Der untere Kollisionsbereich bleibt deckend; Dach und Quadriga verschwinden nicht pauschal bei der Annäherung. Das ist eine Darstellungsregel, keine Änderung der Hindernisabstände oder zusätzlichen Gebäudetiefen-Kollision. Die Entscheidung wird anhand echter 390×844-Spielansichten geprüft, nicht durch alte Mesh-Raycasts als erledigt behauptet.
- Nur die gewählte Berlin-Tour lädt diese optionalen Bilder vor dem Start. Ein Ladefehler hält den Start mit Wiederholungsmöglichkeit an, statt unsichtbare Hindernisse einzusetzen.
- Der Fernsehturm ist vollständig ausgeschlossen, auch als Randkulisse und auch in der Berlin-Tour. Kein `tv-tower-foot`, kein Turm-Sprite und keine Turm-Schnittstelle. #47 ist geschlossen und keine Abhängigkeit. Diese ausdrückliche jüngste Nutzeranweisung ersetzt die Turm-Randkulissen-Planung in ADR 0033/0037.

## Alternatives

- Vollständiges, unveränderliches Torbild: kann variable und doppelte Lücken nicht korrekt abbilden.
- Neue Blender-Variante für jede Lückenposition: unnötiger Asset-/Speicheraufwand und nicht kontinuierlich genug für die vorhandene Lückenerzeugung.
- Allgemeines Bauwerk-Framework: nicht erforderlich; ein kleiner konkreter Sprite-Zeichenpfad reicht für die folgenden vier Gebäudetickets.
- Andere Geschwindigkeit, größere Abstände oder größere Lücken: ausdrücklich ausgeschlossen.

## Consequences

Die Gebäude sind weiterhin flache, tiefensortierte Canvas-Sprites; die Modellansicht ist kein Live-3D. Die Sichtprüfung umfasst seitliche, kleine, doppelte und verbreiterte Lücken sowie Einfahrt, Treffer und Neustart. Die rare Überlappungsgrenze braucht die zusätzliche Unterscheidung aus ADR 0035. Das Spielbild wird vor dem PR separat zur Grafikfreigabe vorgelegt. Echte Mobilgeräte bleiben eine ausstehende Prüfung.
