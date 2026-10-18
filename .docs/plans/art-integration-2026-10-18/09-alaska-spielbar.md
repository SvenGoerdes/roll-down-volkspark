# 09: Neues Alaska-Modell als vollständig spielbare dritte Figur integrieren

**What to build:** Alaska kann als dritte Figur gewählt und durch einen vollständigen Lauf einschließlich Intro, Rollen, Helm, Treffer und Neustart gespielt werden. Dabei bleibt ihr neuer Katzen-Look mit Regenbogenbrille erhalten.

**Blocked by:** 08: Freigegebene Storni-Flasche und fertiges Intro für Kalle und Tine integrieren.

**Status:** draft — noch nicht veröffentlicht oder zur Umsetzung freigegeben

- [ ] Den neuen TRELLIS-Körper mit separater Regenbogenbrille verwenden; erkennbare Rekonstruktionsfehler an Ohren, Fell und Schwanz für die Spielfigur korrigieren. Nicht auf den älteren Körper aus primitiven Formen zurückfallen.
- [ ] Das vorbereitete Vierbeiner-Rig und die vorhandenen Posen an das neue Modell anpassen; stabile Verformungen für Pfoten, Kopf, Schwanz und Brille prüfen.
- [ ] Auswahlansicht und alle benötigten Zustände exportieren: vierbeiniges Intro mit Flaschenkontakt und Einrollen, Rollschleife, Helm und benommene Crash-Pose. Körper und Brille bleiben über die Übergänge verbunden.
- [ ] Das mit Ticket 08 integrierte Intro verwenden; Start, Überspringen, Figurenwechsel, Helmverlust und Neustart enden im richtigen Zustand und haben konsistente Anker.
- [ ] Alaska als dritte wählbare Figur in die bestehende Oberfläche einbinden. Eine neue Rekord-Freischaltung wird nicht nebenbei erfunden; die separat geplante Freischaltfunktion bleibt in ihrem bestehenden Ticket.
- [ ] WebP-Atlas und Laden nur der benötigten Figur verwenden. Größen-, Bild- und Speicherbudget prüfen; erfolgreiche Figurentests, Handyansichten und ein kompletter vorführbarer Lauf liegen vor.

Parent epic: https://github.com/SvenGoerdes/roll-down-volkspark/issues/17

Vorgesehene Veröffentlichung: bestehendes Unterticket #20 konkretisieren, kein Duplikat anlegen.

Bestehende verwandte Aufgaben: #19, #21. Deren Eltern-Epics nicht schließen oder umschreiben.

Tracker-Abdeckung: Das bestehende Modell-/Rig-Ticket #19 wird durch den Arbeitsumfang des konkretisierten #20 mit erledigt. Bei Veröffentlichung die Abdeckung am bestehenden Unterticket kenntlich machen, damit niemand parallel das alte Modell riggt. Abschluss erst beim tatsächlich integrierten neuen Körper; Eltern-Epic #17 bleibt unverändert.
