# 11: Bestenlisten-Einträge mit serverseitig geprüften Einmal-Tokens absichern

**What to build:** Beim Eintragen eines Rekords holt die Spieloberfläche einen frischen Cloudflare-Turnstile-Token. Der Server speichert den Eintrag erst nach erfolgreicher Prüfung. Direkte Einträge ohne gültigen Token werden auch mit nachgeahmter Herkunftsangabe abgewiesen.

**Blocked by:** None (can start immediately).

**Status:** draft — noch nicht veröffentlicht oder zur Umsetzung freigegeben

- [ ] Dieses Ticket ausschließlich für später planen. In der aktuellen Grafikarbeit weder Schutzcode noch neue Infrastruktur, Secrets oder Deployments umsetzen.
- [ ] Turnstile erst am Eintragungsablauf einbinden; eine abgelaufene Prüfung erneuern und verständliche deutsche Fehler anzeigen. Spielen und öffentliches Lesen der Bestenliste bleiben ohne Prüfung möglich.
- [ ] Jeden Schreibversuch serverseitig über Cloudflares Siteverify prüfen, einschließlich erwarteter Website und Aktion. Fehlende, ungültige, abgelaufene, wiederverwendete oder für eine andere Website/Aktion ausgestellte Tokens führen zu keinem Bestenlisten-Schreibvorgang.
- [ ] Der öffentliche Website-Schlüssel darf im Frontend stehen. Der geheime Prüfschlüssel bleibt als serverseitiges Secret gespeichert; keine dauerhaften gemeinsamen Geheimcodes oder Signierschlüssel in Browsercode und keine Tokens in URLs oder Logs.
- [ ] Vorhandene Typ-/Größen-/Werteprüfung, sichere Textdarstellung und Anfragelimits beibehalten. Bei nicht erreichbarer Prüfung nicht ungeschützt speichern; Wiederholen ermöglichen.
- [ ] Einen normalen Eintrag und Ablehnung ohne Token, mit falschem Origin, nachgeahmtem erlaubtem Origin ohne Token, abgelaufenem Token, Replay und falscher Website/Aktion testen. Dafür lokale Tests bzw. offizielle Testschlüssel nutzen, keine künstlichen Rekorde in die produktive Liste schreiben.
- [ ] Schutzgrenze ausdrücklich dokumentieren: Anti-Bot-Token verhindert weder jede Automatisierung noch beweist er den vom Browser behaupteten Punktestand. Ein Nutzer mit gültigem Token kann weiterhin einen manipulierten Score senden; verbindliche Laufprüfung wäre ein gesonderter Ausbau.
- [ ] Keine Pflicht zu Profilen, Passkeys, D1 oder einem JWT-System als Voraussetzung hinzufügen. Das Ticket hat keine technische Abhängigkeit zur Grafik; es wird auf Nutzerwunsch erst danach bearbeitet. Bei späterer Umsetzung den Schutz bewusst abgestimmt serverseitig aktivieren und den dazu passenden Client bereitstellen.

Vorgesehene Veröffentlichung: neues GitHub-Unterticket bzw. eigenständiges Ticket.

Reihenfolge: erst nach der Grafik-Integration bearbeiten; bewusst kein technischer Blocker und kein ready-for-agent-Label bis zur ausdrücklichen Aktivierung.
