# 10: Vollständige neue Grafik im Spiel zusammenführen und prüfen

**What to build:** Alle fünf durchfahrbaren Bauwerke, der seitliche Fernsehturm, der neue Boden und alle drei Figuren funktionieren zusammen in einer vollständigen Spielversion. Dies ist die vollständige Integration, kein auf wenige Motive beschränkter Probelauf.

**Blocked by:** 02: East Side Gallery mit ihren neuen Wandbildern durchfahrbar integrieren; 03: Oberbaumbrücke mit versetzten Durchfahrten integrieren; 04: Reichstag mit sichtbarer Kuppel und korrekten Durchfahrten integrieren; 05: Rotes Rathaus mit offenem Tor und freier Sicht im Spiel integrieren; 06: Neuen Fernsehturm als deutlich sichtbares Wahrzeichen am Rand integrieren; 07: Neuen Boden als tatsächlich scrollende Spielfläche integrieren; 09: Neues Alaska-Modell als vollständig spielbare dritte Figur integrieren.

**Status:** draft — noch nicht veröffentlicht oder zur Umsetzung freigegeben

- [ ] Die neuen freigegebenen Modellstände und die tatsächlich benötigten uncommitteten Worktree-Arbeiten konsistent übernehmen. Unabhängige Daten-/Passkey-, Party-, Spritzen- oder Balancing-Arbeit nicht versehentlich mitziehen oder überschreiben.
- [ ] Jedes Bauwerk im echten Spiel mit linken, mittleren, rechten, kleinen, doppelten und verbreiterten Öffnungen prüfen; Passieren, Treffer, Helm und Wertung stimmen mit den sichtbaren Grenzen überein.
- [ ] Für gleiche Spielzustände bleiben Lückenerzeugung, Hindernisabstände, Geschwindigkeit und Schwierigkeitskurve unverändert. Die frühere immer mittige Durchfahrt ist nicht die neue Standardlösung.
- [ ] Alle drei Figuren einschließlich Intro, Überspringen, Rollen, Helm, Crash und Neustart funktionieren mit den neuen Szenen. Die nächste Lücke bleibt während der Annäherung lesbar.
- [ ] Auf 390 × 844 in Safari und einem weiteren Browser prüfen; Leistung mit 4-facher CPU-Drosselung messen, Bild-/Speicherbudget und bedarfsgerechtes Laden dokumentieren. Ziel sind 60 fps, keine dauerhaften Einbrüche unter 30 fps; echte Geräte nur als geprüft bezeichnen, wenn tatsächlich getestet.
- [ ] Bestehende Tests und CI bestehen. Quellen, neue Nutzerentscheidungen, bewusst verbleibende Grenzen und durchgeführte Prüfungen sind dokumentiert; vollständige aktuelle HTML-Vorschau und reviewbare PR bereitstellen. Merge und Deployment nicht stillschweigend auslösen.

Vorgesehene Veröffentlichung: neues GitHub-Unterticket bzw. eigenständiges Ticket.
