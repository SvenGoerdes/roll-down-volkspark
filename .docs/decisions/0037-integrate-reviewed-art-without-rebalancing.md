# 0037: Neue Modelloptik integrieren, Spielregeln und Schwierigkeit erhalten

- **Status:** Accepted (Produktumfang und Ticketaufteilung, freigegeben am 18.10.2026; Security-Vorschlag #77 noch nicht freigegeben)
- **Date:** 2026-10-18
- **Decided by:** der Nutzer in dieser Session
- **Built by:** Codex (Dokumentation und Ticket-Entwürfe); neue Architekturmodelle durch GPT-6.1 Sol High, anschließende Prüfung durch die Hauptsession
- **Commits:** uncommitted; noch keine Runtime-Implementierung dieser Entscheidung

## Context

Neue Nano-Banana-2.1-Vorlagen, detaillierte Blender-Wahrzeichen und eine tatsächliche kostenlose TRELLIS.2-Rekonstruktion von Alaska liegen vor. In der Galerie befinden sich außerdem ältere Vorher-Bilder. Der Nutzer stellt klar, dass die neueren Modelle ihren Look behalten sollen; ein Rückbau auf ältere Grafiken oder eine neue grundsätzliche Stilwahl ist nicht gewünscht.

Die aktiven Worktrees enthalten Tor-Logik und Figuren-/Intro-Vorarbeiten, die noch nicht mit diesen neuen Modellen ins Laufzeitspiel verdrahtet sind. Die aktuellen Tor-Prototypen haben teils feste mittige Öffnungen, während das Spiel versetzte, veränderliche und im Sommer doppelte Lücken erzeugt.

## Decision

Alle fünf Gebäude werden im Sightseeing-Theme als durchfahrbare Hindernisse integriert; ihre sichtbaren Öffnungen müssen der tatsächlichen Spiellücke folgen und auch seitlich versetzt funktionieren. Der neue Modell-Look bleibt erhalten. Geschwindigkeit, Abstände, Schwierigkeitskurve und vorhandene Spielregeln werden durch diese Grafikarbeit nicht verändert.

Der Fernsehturm wird ausschließlich als deutlich sichtbare Randkulisse eingebunden, ohne Kollision oder durchfahrbaren Turmfuß. Die bestehende Aufgabe für den Jahreszeiten-Modus bleibt der Geltungsbereich. Der neue Boden, der bestätigte Storni-Stand und das neue Alaska-Modell gehören zum vollständigen Integrationsziel.

**Nachtrag 18.10.2026:** Nach Sichtung der ersten Spielbilder hat der Nutzer den Fernsehturm ganz gestrichen („sieht nicht geil aus“), am Rand wie in der Berlin-Tour. #47 ist geschlossen; die Arbeit im Worktree `turm` bleibt lokal ohne PR.

Die vorhandene Canvas-/WebP-Pipeline bleibt bestehen. Aktuelle Worktree-Arbeit gezielt wiederverwenden; weder neue Live-3D-Engine noch vorsorgliches Bauwerk-Framework. Einzelne vertikale Implementierungstickets erlauben eigenständige Prüfung, begrenzen aber nicht das vereinbarte vollständige Endergebnis.

## Alternatives

- Neue Gebäude wieder stärker in eine rein gemalte Optik übersetzen: vom Nutzer für diese Modelle abgelehnt. Die neue Auswahl ergänzt die bisherigen Stilregeln und die bereits gewählte Verwendung eigener Modellmaterialien in ADR 0018.
- Nur eine kurze Strecke mit wenigen Motiven als nächsten Lieferumfang bauen: vom Nutzer abgelehnt; alle Motive sollen integriert werden.
- Feste mittige Tore, größere Abstände oder vereinfachte Schwierigkeit zugunsten der Gebäude: widerspricht dem aktuellen Auftrag.
- Fernsehturm als durchfahrbarer Turmfuß bzw. klein und neblig wie in älterer Worktree-Vorarbeit: durch die aktuelle explizite Entscheidung ersetzt. Den unveröffentlichten Sightseeing-ADR 0033 später entsprechend referenzieren; keine alte Umsetzung ungeprüft übernehmen.

## Consequences

- Bauwerke benötigen zur bestehenden Lücke passende Renderteile oder Varianten. Darstellung und Trefferentscheidung müssen bei Seitenversatz, Sommer-Doppellücken und Verbreiterungs-Pickup übereinstimmen.
- Hohe Fassaden müssen die Sicht auf nachfolgende Durchfahrten zulassen; Verdeckungen in der Darstellung lösen statt über neues Balancing.
- Der Tor-Prototyp darf durch Zusammenführen überlappender Öffnungen nicht unbemerkt die bisherige Trefferentscheidung erweitern.
- Das neue Alaska-Mesh benötigt Rig-Anpassung und Animation; das vorhandene ältere Vierbeiner-Rig ist Vorarbeit, keine Erlaubnis, den alten Körper wieder einzusetzen.
- Laufzeitgrafiken bleiben optimierte WebP-Assets mit der bestehenden Handy- und Speicherprüfung. Galerie-Renders sind noch kein Integrationsnachweis.
- Der gewünschte spätere Bestenlisten-Schutz ist getrennt geplant. Turnstile wurde erklärt und vorgeschlagen, aber noch nicht als konkrete Lösung freigegeben oder umgesetzt.

Umsetzungsstand, Quellen und nächste Schritte: [Übergabe](../handoff.md), [Ticket-Entwürfe](../plans/art-integration-2026-10-18/README.md).
