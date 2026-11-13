# 0082: Springen und Ducken über/unter quer liegende Baumstämme

- **Status:** Accepted
- **Date:** 2026-11-13
- **Decided by:** Nutzer (Sprachauftrag: Baum über die ganze Breite statt Mauer; niedrig = springen, höher = drunter durch; hochwischen = springen, runterwischen = ducken). Zahlenwerte, Optik und Detailregeln: Claude Code als Startwerte.
- **Built by:** Claude Code (Cloud-Session; Modell siehe Commit-Trailer) auf `claude/exciting-cray-1giu7j`
- **Commits:** dieser Commit (`feat: jump and slide over full-width tree trunks`)

## Context

Bisher gab es nur Links/Rechts-Lenken durch Mauerlücken. Der Nutzer will zusätzlich Hindernisse, die man überspringt oder unter denen man durchrutscht, ohne das Grundspiel zu ersetzen.

## Decision

Manche Mauern (`TRUNKS.chance` 20 %, ab Mauer 7, mindestens `cooldown` 3 Mauern Abstand, nie auf Volkspark-Bauwerksmauern) sind stattdessen ein Stamm ohne Lücke über die ganze Breite: ein dunkler liegender Stamm (`low`, springen) oder eine helle Birke auf Kopfhöhe (`high`, ducken). Hochwischen/`↑`/`W`/Leertaste springt, Runterwischen/`↓`/`S` duckt; Lenken läuft dabei weiter. Es läuft immer nur eine Bewegung (0,55 s). Regeln pur in `js/moves.js`, Zahlen in `config.js` (`TRUNKS`, `MOVES`), Zeichnung in `js/render-trunk.js` (einmal gemalt, gekachelt).

- Ein Stamm zählt als Mauer (Punktzahl, Jahreszeit, Rekord). Die Perfekt-Serie bleibt unverändert (weder +1 noch Abbruch).
- Falsche oder fehlende Bewegung = Crash wie an der Mauer (Helm schützt, Superattacke bricht durch).
- Normale Mauern lassen sich nicht überspringen (Sprunghöhe 1,5 < Mauerhöhe 1,65); Mauer-Kollision ist unverändert.
- Keine Spritze direkt vor oder nach einem Stamm, weil der Spieler dort überall auf dem Weg sein darf.
- Beim ersten Stamm jeder Art pro Runde erklärt ein Banner die Wischrichtung.

## Alternatives

- **Stämme zwischen den Mauern (wie Spritzen):** mehr gleichzeitig zu tun, bei 0,45–0,65 s Mauerabstand später kaum fair. Der Nutzer sagte ausdrücklich „statt einer Mauer“.
- **Stamm mit Lücke (springen oder ausweichen):** macht das Springen optional; verworfen.
- **Tippen statt Wischen:** Tippen startet/überspringt schon; Wischen war Nutzervorgabe.
- **Eigene Sprung-/Rutsch-Sprites aus Blender:** teuer; vorerst wird der Rollball angehoben bzw. flach gedrückt.

## Consequences

- Eine zweite Eingabeachse. Die Wisch-Schwelle (26 px in 300 ms, steiler als 1,2:1) ist nur im Emulator geprüft und braucht echte Handys.
- `tools/balance-sim.js` kennt Stämme nicht; seine Mediane gelten für das Spiel ohne Stämme (Backlog).
- Stämme ersetzen in der Berlin-Tour auch Bauwerke (dort ist jede Mauer ein Bauwerk).
