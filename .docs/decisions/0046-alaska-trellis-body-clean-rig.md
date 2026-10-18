# 0046: Alaska – TRELLIS-Körper neu vernetzt und mit Vierbeiner-Pivot-Rig bewegt

- **Status:** Accepted (Stufe 1; Clips, Atlas und Einbau folgen in Stufe 2)
- **Date:** 2026-10-18
- **Decided by:** user (neuer Körper, Look, Zielumfang in #20 und ADR 0037); Sonnet 5.5 (Aufräum- und Rig-Verfahren)
- **Built by:** Sonnet 5.5
- **Commits:** siehe `history.md`, Eintrag 2026-10-18 „Issue #20 – Alaska Stufe 1“

## Context
Der TRELLIS-Körper hat rund 95.000 Dreiecke, ist ungeriggt und hat Risse an Ohren, Schwanz und Fellrand. Das Rig in `tools/blender/alaska.py` gehörte zu einem älteren Körper aus Grundformen. Ticket #20 verlangt den neuen Körper, nicht den alten.

## Decision
- `tools/blender/prep-alaska.py` verschweißt das Mesh, vernetzt es per Voxel neu (0,009), glättet, reduziert auf rund 60.000 Dreiecke und überträgt die Fellfarbe aus der Textur in Vertexfarben. Die Ohren-Innenseiten werden geglättet und rosa eingefärbt. Das Skript dreht die Katze auf +Y, skaliert auf 0,85 (1,25 hoch) und schreibt `assets/src/characters/alaska-3d.glb` (2,3 MB, wie Kalle und Tine). Körper und Brille bleiben getrennte Objekte; die Brille bleibt starr am Kopf.
- `tools/blender/alaska.py` nutzt dieselbe Pivot-Empty-Technik wie Kalle und Tine (`skinned.Skin`, ADR 0018), mit eigenen Gewichten: ein Bein besitzt die Säule um seine Achse unter der Schulter, der Kopf eine Kugel, der Schwanz eine Röhre; der Rest teilt sich zwischen Brust (`spine`) und Hinterteil (`hips`).
- Drei Rumpf-Gelenke (`curl` Hinterteil, `arch` Mitte, `bend` Brust) wölben den Körper zur runden Kugel. Mit einem oder zwei Gelenken blieb die eingerollte Pose ein Klumpen.
- Nutzerentscheidung nach der ersten Sichtung: Die Brille fällt ab, sobald Alaska losrollt; eingerollt und beim Rollen trägt sie keine. Die Brille ist deshalb nicht am Kopf eingeskinnt, sondern ein eigenes Objekt: Posenschlüssel `gl` (0..1) lässt sie fallen, `noglasses` blendet sie aus. Der Fallmoment lässt sich so später im Intro-Übergang zeigen.
- Fehler im ersten Aufräumen: Die alten Split-Normalen blieben im GLB und erzeugten Sprenkel am Fellrand. `prep-alaska.py` löscht sie jetzt, glättet das Brust-Band und färbt es weich.
- Die Posenschlüssel `f_l…tail` aus `intro.py` bleiben. Neu ist `curl`. `BALL_ALASKA` in `intro.py` gilt noch für den alten Körper und wird in Stufe 2 angepasst.

## Alternatives
- Armature mit automatischen Gewichten: Wärme-Gewichte scheitern am rauen Mesh, und Armatures sind hier nicht üblich.
- Original-Mesh behalten: Risse an Ohren und Schwanz bleiben, 95.000 Dreiecke verlangsamen jedes Rendern.
- Ohren und Schwanz von Hand modellieren: mehr Aufwand und Abweichung vom freigegebenen Look. Das Neuvernetzen schließt die Löcher, ohne den Look zu ändern.

## Consequences
- Die Fellfarbe kommt jetzt aus Vertexfarben (rund 4 mm Auflösung) plus feinem Rauschen im Material. Die Mikrodetails der Normalkarte fehlen; bei Sprites um 140 px fällt das nicht auf.
- Die Quelle `.claude/review/quellen/alaska/alaska-trellis-with-glasses.blend` ist gitignoriert. Das Aufräum-Skript braucht sie; das fertige GLB liegt im Repo.
- Das Fell wirkt glatter als das Original (Normalkarte und Fellkante fehlen); das Material fügt feines Rauschen hinzu.
