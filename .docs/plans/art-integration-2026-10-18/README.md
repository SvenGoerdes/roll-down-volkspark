# Konkrete Ticket-Entwürfe – 18. Oktober 2026

Zieltracker ist GitHub gemäß bestehender Projektentscheidung. Der Nutzer hat die Aufteilung am 18.10.2026 freigegeben; seitdem sind die GitHub-Issues maßgeblich, nicht diese Entwürfe: 01 #28, 02 #71, 03 #72, 04 #73, 05 #74, 06 #47, 07 #75, 08 #24, 09 #20, 10 #76, 11 #77.

Festgehaltene Nutzerentscheidungen: neuer Modell-Look bleibt, fünf Gebäude als durchfahrbare Hindernisse, tatsächlich versetzte Tore, Abstände und Schwierigkeit unverändert, vollständige Integration. Fernsehturm ausschließlich prominent am Rand. KISS: vorhandene Canvas-/WebP-Pipeline und aktuelle Worktree-Vorarbeit wiederverwenden.

1. [Brandenburger Tor mit versetzten Durchfahrten ins Spiel integrieren](01-brandenburger-tor.md) — blockiert durch: keine; GitHub: bestehendes #28.
2. [East Side Gallery mit ihren neuen Wandbildern durchfahrbar integrieren](02-east-side-gallery.md) — blockiert durch: 01; GitHub: neu.
3. [Oberbaumbrücke mit versetzten Durchfahrten integrieren](03-oberbaumbruecke.md) — blockiert durch: 01; GitHub: neu.
4. [Reichstag mit sichtbarer Kuppel und korrekten Durchfahrten integrieren](04-reichstag.md) — blockiert durch: 01; GitHub: neu.
5. [Rotes Rathaus mit offenem Tor und freier Sicht im Spiel integrieren](05-rotes-rathaus.md) — blockiert durch: 01; GitHub: neu.
6. [Neuen Fernsehturm als deutlich sichtbares Wahrzeichen am Rand integrieren](06-fernsehturm.md) — blockiert durch: keine; GitHub: bestehendes #47.
7. [Neuen Boden als tatsächlich scrollende Spielfläche integrieren](07-boden.md) — blockiert durch: keine; GitHub: neu.
8. [Freigegebene Storni-Flasche und fertiges Intro für Kalle und Tine integrieren](08-storni-intro.md) — blockiert durch: keine; GitHub: bestehendes #24.
9. [Neues Alaska-Modell als vollständig spielbare dritte Figur integrieren](09-alaska-spielbar.md) — blockiert durch: 08; GitHub: bestehendes #20.
10. [Vollständige neue Grafik im Spiel zusammenführen und prüfen](10-gesamtintegration.md) — blockiert durch: 02, 03, 04, 05, 06, 07, 09; GitHub: neu.
11. [Bestenlisten-Einträge mit serverseitig geprüften Einmal-Tokens absichern](11-bestenliste-token.md) — blockiert durch: keine; GitHub: neu; **später, nicht umsetzen**.

Die Aufteilung ergänzt die vorhandenen Epics und konkretisiert vier vorhandene Untertickets statt sie doppelt anzulegen. Bestehende Eltern-Epics bleiben unverändert. Erst nach Freigabe der Aufteilung veröffentlichen; neue Kunst-Tickets mit dem vorgesehenen ready-for-agent-Label und echten Blocking-Beziehungen versehen.

Token-Hintergrund: Ein frischer, einmal nutzbarer Turnstile-Nachweis wird vom Server geprüft. Er erschwert ungeprüfte direkte Einträge und Bots, bestätigt aber keinen tatsächlich erspielten Score. Der Vorschlag erfordert weder ein neues Login-System noch ein JWT-Framework. Quellen: [Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [MDN zu CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).

Bei Veröffentlichung zusätzlich die Abdeckung alter Untertickets festhalten: #27 durch 01–05, #19 durch 09, gemeinsames Intro #24 erst einschließlich 09 vollständig. So entstehen keine parallel ausführbaren Doppelaufgaben. Eltern-Epics werden weder umgeschrieben noch geschlossen.

Diese `.docs`-Kopie ist der Wiedereinstieg für die nächste Session. Der frühere Arbeitsstand liegt zusätzlich im gitignorierten Review-Verzeichnis. Kontext, Nutzerentscheidungen und Quellorte: [Übergabe](../../handoff.md).
