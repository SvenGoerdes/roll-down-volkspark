# 0043: Freigegebenen Boden als scrollbare Materialien ableiten

- **Status:** Accepted (technische Umsetzung; Spielansicht wartet auf Grafikfreigabe)
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Vorlage, Umfang und unveränderte Spielregeln, Issue #75 / ADR 0037 im Doku-PR #78); GPT-6.1 Sol (Materialableitung)
- **Built by:** GPT-6 Luna (Offline-Tool, Materiallader und Tile-Aufbau), GPT-6.1 Sol (Integration und Prüfung)
- **Commits:** dieser Änderungsstand auf `feat/boden-scroll`

## Context

`ground-v2.png` ist eine freigegebene statische Landschaftsstudie, keine Bodenkarte.
Eine unbewegliche Vollbildkopie würde zur Fahrt, zur Geländeprojektion und zu
Hindernisfüßen/Pfützen nicht passen. Die bestehenden Oberflächen Erde, Kies und
Gras haben unterschiedliche Spielwirkungen; diese gehören nicht zur Grafikarbeit.

## Decision

Ein reproduzierbares Pillow-Tool leitet zwei kleine, bodenreine WebP-Materialien
aus Vordergrund-Ausschnitten der Vorlage ab: warme Erde und einen olivgrünen
Grasrand. Perspektivischer Horizont, Bäume und die Gesamtlandschaft werden nicht
übernommen. Überlappende Enden werden entlang der Fahrtrichtung weich zu einer
Periode verbunden; die Studie wird nicht ein zweites Mal perspektivisch projiziert.

Der vorhandene Materiallader lädt die beiden Quellen statt der alten Erdtextur.
Grasränder werden beim Tile-Aufbau weich maskiert und mit Jahreszeitenfarben
abgestimmt. Kies, Grashalme, Herbstlaub und Schnee bleiben vorberechnete Details.
Auch Details über der oberen Kachelgrenze werden zyklisch auf die Unterkante
übertragen. Alle zwölf Saison-/Oberflächenkacheln behalten ihre bestehenden fünf
Mip-Stufen, Abmessungen und acht Weltlängeneinheiten pro Wiederholung.

Inverse Geländezeilen, Objektprojektion und Update-/Spielregeln bleiben
unverändert. Der Ground-Renderer behält dieselben Slice-Blits. Nur der erste
Teil einer geteilten Kachelzeile überlappt den folgenden Teil um einen CSS-Pixel:
Canvas lässt sonst durch die fraktionale Pixeldeckung einen feinen grünen
Hintergrundstrich durchscheinen, obwohl die Textur selbst periodisch ist.
Es gibt keine zusätzlichen Zeichenaufrufe, Masken, Bildbearbeitung oder
Material-Erzeugung im laufenden Ground-Renderer.
Eine isolierte Canvas-Probe über 32 Kachelphasen bei DPR 1/1,5/2 bestätigt,
dass die vorher sichtbare Hintergrund-Leckage an diesen Übergängen entfällt.

## Alternatives

- Statisches Handybild unter bewegten Hindernissen: schwimmt sichtbar und erfüllt
  die Anforderung einer tatsächlich scrollenden Spielfläche nicht.
- Neue prozedurale Optik oder weitere Bildgenerierung: verwirft unnötig die bereits
  freigegebene Vorlage.
- Zusätzliche Rand-Layer pro Projektionszeile: unnötige Arbeit im Frame-Loop;
  das Einbacken in die vorhandenen Kacheln benötigt keine neue Render-Pipeline.
- Große vollständige Landschaftstextur: enthält bereits Perspektive und kostet
  unnötig Download- und Decodierspeicher.
- Geteilte Zeilen ohne Überdeckung: ein isolierter Canvas-Test und die bewegten
  Einzelbilder zeigen Subpixel-Nähte. Zusätzliche Render-Layer oder eine zweite
  Weltprojektion sind dafür nicht nötig.

## Consequences

Die neue Oberfläche scrollt exakt mit der bestehenden Weltstrecke. Die vorhandene
Mip-Cache-Größe bleibt gleich; nur die zwei kleinen Materialquellen kommen hinzu.
Bei fehlenden Quellen bleibt der prozedurale Ersatz verfügbar. Das Gabionmaterial
wird nicht ersetzt. Wiederholungen bleiben aufgrund der endlichen Kachelgröße
grundsätzlich möglich; entscheidend sind nahtfreie Übergänge und ruhige Lesbarkeit
im Spiel, nicht eine größere prozedurale Welt.

Die großen Art-Quellen und nummerierten Review-Aufnahmen bleiben unter dem
ignorierten `.claude/review/`. Zum erneuten Ableiten benötigt man die lokale
Originalvorlage; die kompakten WebPs werden mit dem Code versioniert.
Screenshots und bewegter Debug-Lauf sind keine Prüfung auf echter Handyhardware.
