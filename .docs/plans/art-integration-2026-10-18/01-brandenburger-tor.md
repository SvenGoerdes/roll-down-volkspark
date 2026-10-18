# 01: Brandenburger Tor mit versetzten Durchfahrten ins Spiel integrieren

**What to build:** Das neue Brandenburger Tor ersetzt im Sightseeing-Theme ein vorhandenes Hindernis. Seine sichtbaren Durchfahrten liegen genau an den vom Spiel erzeugten Lücken, einschließlich links und rechts versetzter Öffnungen. Auf dem Startbildschirm kann zwischen Volkspark und Berlin-Tour gewählt werden; die Berlin-Tour führt anschließend durch die neuen Tore.

**Blocked by:** None (can start immediately).

**Status:** draft — noch nicht veröffentlicht oder zur Umsetzung freigegeben

- [ ] Den neuesten freigegebenen Modell-Look mit Säulen, Reliefs und Quadriga übernehmen; ältere Vorher-Bilder und alte Prototyp-Modelle sind keine Designvorlage.
- [ ] Die bereits entschiedene Auswahl zwischen Volkspark und Berlin-Tour tatsächlich in die Oberfläche einbinden. In der aktuellen Codebase ist der Einstieg noch nicht verdrahtet; nicht als vorhanden voraussetzen und kein neues Theme-Konzept erfinden.
- [ ] Die bereits im Sightseeing-Worktree vorbereitete Toraufteilung und Tests prüfen und wiederverwenden. Uncommittete Arbeit gezielt übernehmen; das bloße Zusammenführen der Branch-Spitze genügt nicht.
- [ ] Sichtbare Öffnungen und Kollisionsgrenzen stimmen bei seitlichen Lücken, kleinen und großen Lücken, Sommer-Doppellücken und dem Verbreiterungs-Pickup überein. Säulen oder gezeichnete Durchgänge versprechen keine falsche Fahrmöglichkeit.
- [ ] Bestehende Lückenerzeugung, Geschwindigkeit, Abstände, Schwierigkeit, Wertung und Helmwirkung bleiben unverändert. Eine im Prototyp vorhandene Zusammenführung überlappender Lücken darf die bisherige Trefferentscheidung nicht stillschweigend erweitern; Grenzfälle gegen das bisherige Verhalten testen.
- [ ] Neue Art in die bestehende WebP-/Canvas-Pipeline einbauen. Kleine konkrete Renderteile oder Varianten nur soweit nötig; keine neue Live-3D-Engine und kein allgemeines Bauwerk-Framework.
- [ ] Nahes Tor und nachfolgende Durchfahrt bleiben während der Annäherung bei 390 × 844 verständlich. Verdeckungen innerhalb der Darstellung lösen, ohne die Hindernisabstände zu ändern.
- [ ] Der vollständige Weg vom Einstieg ins Sightseeing-Theme über Durchfahrt und Treffer bis zum Neustart ist vorführbar; gezielte Logiktests und bestehende Tests bestehen. Phone-Vorschauen, Herkunft der Assets und die neue Entscheidung sind dokumentiert.

Parent epic: https://github.com/SvenGoerdes/roll-down-volkspark/issues/25

Vorgesehene Veröffentlichung: bestehendes Unterticket #28 konkretisieren, kein Duplikat anlegen.

Bestehende verwandte Aufgaben: #27, #28. Deren Eltern-Epics nicht schließen oder umschreiben.

Tracker-Abdeckung: #27 wird durch Tickets 01–05 abgedeckt. Diese Aufteilung bei Veröffentlichung ausdrücklich am bestehenden Art-Ticket vermerken und es bis zur Erledigung aller fünf Bauwerke offen lassen; keine parallele zweite Bauwerk-Implementierung daraus starten. Eltern-Epic #25 bleibt unverändert.
