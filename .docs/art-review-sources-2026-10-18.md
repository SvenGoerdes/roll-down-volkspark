# Art-Quellen – Stand 18. Oktober 2026

Diese Übersicht verlinkt tatsächlich vorhandene lokale Dateien, keine integrierten Spiel-Assets. Alle verlinkten `.claude`-Dateien sind **gitignoriert** und müssen vor einem frischen Clone/Worktree oder einer Bereinigung gezielt übernommen werden. Die kleinen Ticket-Dokumente sind separat unter `.docs` gesichert. Kontext: [Übergabe](handoff.md).

[Neue Galerie](http://127.0.0.1:8784/.claude/review/art-round-2-2026-10-14/index.html) · [Galerie-HTML lokal](../.claude/review/art-round-2-2026-10-14/index.html) · [Galerie-Screenshot](../.claude/review/art-round-2-2026-10-14/gallery-preview.jpg)

Die neue Runde enthält tatsächlich mit Nano Banana 2.1 erzeugte Referenzen. Maßgeblich sind neue Blender-Szenen und ihr gerenderter Look; alte Galerie-Vorher-Bilder sind keine neue Designvorgabe. GLBs können prozedurale Blender-Materialien nur näherungsweise wiedergeben.

| Motiv | Blender-Quelle | Tatsächlicher Render | Bildvorlage | Drehbares Modell |
|---|---|---|---|---|
| Fernsehturm | [.blend](../.claude/review/art-round-2-2026-10-14/fernsehturm/fernsehturm-model.blend) | [Render](../.claude/review/art-round-2-2026-10-14/fernsehturm/renders/fernsehturm-hero.png) | [Referenz](../.claude/review/art-round-2-2026-10-14/fernsehturm/concepts/nano-banana-reference.png) | [GLB](../.claude/review/art-round-2-2026-10-14/models/fernsehturm.glb) |
| East Side Gallery | [.blend](../.claude/review/art-round-2-2026-10-14/east-side-gallery/east-side-gallery-detailed.blend) | [Render](../.claude/review/art-round-2-2026-10-14/east-side-gallery/hero-three-quarter.png) | [Referenz](../.claude/review/art-round-2-2026-10-14/east-side-gallery/reference-nano-banana-2.1.png) | [GLB](../.claude/review/art-round-2-2026-10-14/models/east-side-gallery.glb) |
| Oberbaumbrücke | [.blend](../.claude/review/art-round-2-2026-10-14/oberbaum-bridge/oberbaum-bridge.blend) | [Render](../.claude/review/art-round-2-2026-10-14/oberbaum-bridge/blender-hero-cream.jpg) | [Referenz](../.claude/review/art-round-2-2026-10-14/oberbaum-bridge/nano-banana-reference.png) | [GLB](../.claude/review/art-round-2-2026-10-14/models/oberbaum-bridge.glb) |
| Brandenburger Tor | [.blend](../.claude/review/art-round-2-2026-10-14/brandenburg-gate/brandenburg-gate-detailed.blend) | [Render](../.claude/review/art-round-2-2026-10-14/brandenburg-gate/hero-paper.jpg) | [Referenz](../.claude/review/art-round-2-2026-10-14/brandenburg-gate/nano-banana-reference.png) | [GLB](../.claude/review/art-round-2-2026-10-14/models/brandenburg-gate.glb) |
| Reichstag | [.blend](../.claude/review/art-round-2-2026-10-14/reichstag/reichstag.blend) | [Render](../.claude/review/art-round-2-2026-10-14/reichstag/reichstag-hero.png) | [Referenz](../.claude/review/art-round-2-2026-10-14/reichstag/nano-reichstag-reference.png) | [GLB](../.claude/review/art-round-2-2026-10-14/models/reichstag.glb) |
| Rotes Rathaus | [.blend](../.claude/review/art-round-2-2026-10-14/red-town-hall/rotes-rathaus-packed.blend) | [Render](../.claude/review/art-round-2-2026-10-14/red-town-hall/hero-ivory.jpg) | [Referenz](../.claude/review/art-round-2-2026-10-14/red-town-hall/nanobanana-concept.png) | [GLB](../.claude/review/art-round-2-2026-10-14/models/red-town-hall.glb) |
| Alaska | [.blend](../.claude/review/art-round-2-2026-10-14/alaska/alaska-trellis-with-glasses.blend) | [Render](../.claude/review/art-round-2-2026-10-14/alaska/renders/05-alaska-glasses-three-quarter.png) | [Referenz](../.claude/review/art-round-2-2026-10-14/alaska/body-input.png) | [GLB](../.claude/review/art-round-2-2026-10-14/models/alaska.glb) |
| Storni | [.blend](../.claude/review/art-iteration-2026-10-14/storni/renders/storni-hero.blend) | [Render](../.claude/review/art-iteration-2026-10-14/storni/renders/storni-hero-paper.jpg) | [Referenz](../.claude/review/art-iteration-2026-10-14/storni/concepts/storni-nano-banana-red.png) | — |
| Boden | Kein neues 3D-Modell | [Bodenbild](../.claude/review/art-iteration-2026-10-14/floor/ground-v2-phone.webp) | [Referenz](../.claude/review/art-iteration-2026-10-14/floor/ground-v2.png) | — |

## Weitere Dateien und Grenzen

- Vollständiges Asset-Verzeichnis mit alternativen Szenen, Parkansichten und Detailansichten: [Galerie-Manifest](../.claude/review/art-round-2-2026-10-14/gallery-manifest.json).
- Fernsehturm zusätzlich als [Blender-Parkkomposition](../.claude/review/art-round-2-2026-10-14/fernsehturm/fernsehturm-park-scene.blend). Parkumgebung teilweise gemalte Ebenen; tatsächlicher 3D-Turm.
- Alaska: [ursprüngliches generiertes GLB](../.claude/review/art-round-2-2026-10-14/alaska/alaska-trellis.glb), [neue Nano-Banana-Körpervorlage](../.claude/review/art-round-2-2026-10-14/alaska/body-input.png), [Studio ohne Brille](../.claude/review/art-round-2-2026-10-14/alaska/alaska-trellis-studio.blend), [Reproduktion und Grenzen](../.claude/review/art-round-2-2026-10-14/alaska/README.md). Neuer Körper noch ungeriggt, Oberfläche teilweise fehlerhaft. Die riggbare ältere Prototyp-Katze liegt getrennt im Figuren-Worktree.
- Rathaus: [Reparaturbericht](../.claude/review/art-round-2-2026-10-14/red-town-hall/portal-repair-checks.json). Der offene Torbogen ist repariert, die hohe Fassade kann Folgelücken weiter verdecken. Ältere Messwerte nicht als aktuellen vollständigen Sichttest verwenden.
- Storni/Boden stammen aus der vorherigen [Art-Galerie](../.claude/review/art-iteration-2026-10-14/index.html). Storni ist akzeptiert; das Bodenbild muss erst in bewegte Laufzeitmaterialien überführt werden.
- [64 geprüfte Dateiverweise](../.claude/review/art-round-2-2026-10-14/gallery-file-checks.json), [sieben GLB-Exporte](../.claude/review/art-round-2-2026-10-14/models/exports.json). Das ist Galerie-Prüfung, keine Spielintegration oder allgemeine Spielbarkeitsfreigabe.

## Galerie erneut starten

Vom Repo-Root: `bun .claude/review/art-round-2-2026-10-14/serve.js`. Anschließend die oben verlinkte lokale Galerie öffnen. Bilder und Modell-Downloads benötigen ihre lokalen Quellen; die HTTP-Adresse allein ist kein dauerhaft gehosteter Upload.
