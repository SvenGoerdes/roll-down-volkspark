# History

Newest first. "Built by" names the model that wrote the code. "Main session" is Claude Opus 5.5 (1M context), which talks to the user, plans, merges and deploys. Agents ran in their own git worktrees. Decisions are in [decisions/](decisions/).

## 2026-10-28: Issue #21 – Alaska per lokalem Rekord freischalten
- Nutzerentscheidung: Alaska ist erst ab einem lokalen Rekord von mindestens 140 passierten Mauern spielbar (`ALASKA_UNLOCK_WALLS = 140` in `js/config.js`). Vorher bleibt ihre Karte im Auswahlscreen sichtbar, abgedunkelt mit Schloss-Badge und Hinweis „Knack 140 Mauern“; Antippen wählt oder startet sie nicht (kurzes Wackeln/Hervorheben des Hinweises).
- Reine Freischalt-Logik in `js/figure.js` (`isFigureUnlocked`, `justUnlockedFigure`, `unlockWallsFor`, `pickFigure(id, best)`, gebündelte UI-Texte `unlockHint`/`unlockNotice`). War Alaska gespeichert, fällt `readFigure(best)` unterhalb der Schwelle stillschweigend auf `kalle` zurück.
- Hebt ein Lauf den lokalen Rekord erstmals auf ≥ 140 Mauern, zeigt der Game-Over-Screen „Alaska freigeschaltet!“ (`#over-unlock`) und schaltet die Karte in `figure-select.js` sofort frei (`picker.refresh(best)`).
- Geprüft: 190 Bun-Tests in 26 Dateien grün (neu: `tests/figure-select.test.js` sowie Tests in `tests/figure.test.js` und `tests/game-flow.test.js` für Grenze 139/140, fehlenden Rekord, gesperrte gespeicherte Figur und Game-Over-Freischaltung). Sichtprüfung in Chrome bei 390×844 (DPR 2): Startscreen gesperrt bei 139, Tap-Nudge auf gesperrter Karte, Game-Over mit „Alaska freigeschaltet!“ bei 140, Wechsel zu freigeschalteter Alaska-Karte. Keine echten Handys oder iOS Safari geprüft.
- Entschieden vom Nutzer; gebaut von Gemini 4 Argon (Subagent). Commit: dieser PR (`Closes #21`).

## 2026-10-28: Turnstile für Bestenliste aktiviert und Fake-Score entfernt (#77)
- `TURNSTILE_SECRET` im produktiven Cloudflare Worker `roll-down-ideas` gesetzt und Worker mit `turnstile.js`-Prüfung (`siteverify` für `svengoerdes.github.io`, Action `score`) ausgerollt.
- Öffentlichen Sitekey `TURNSTILE_SITEKEY` in `js/config.js` eingetragen.
- Gefälschten Bestenlisten-Eintrag (`Ben`, 2941 Mauern) aus dem produktiven KV-Namespace `LEADERBOARD` entfernt; die übrigen 15 Einträge blieben unverändert.
- Beauftragt vom Nutzer; umgesetzt in der Hauptsession.

## 2026-10-26: Oberbaumbrücke – gestützte Bögen bei aktuellen Spiellücken
- Nutzerfeedback zu frei hängenden Bogenfüßen im echten Browser bestätigt: der feste Bogen folgte den verbreiterten/versetzten Pfeilern nicht; der bisherige Mauerhöhen-Clip berührte das Bogenbild nicht.
- Bestehenden detaillierten Bogen pro tatsächlicher Öffnung horizontal an deren Pfeilern ausgerichtet; Doppel-/überlappende Lücken und ↔️ an/aus berücksichtigt. Modellgrafiken, Höhe, Kollisionsregeln, Abstände und Schwierigkeit unverändert.
- 169 Tests grün; Original-WebP-Rasterprüfung 45/45 ohne ungestützte Fußpixel, identischer Altstand 39 Fehlerfälle. Handygröße 390×844 in Cua, zusätzlich vollständige Herbst-Spielszene. [Ursache, Fixture, Bilder und Grenzen](oberbaum-opening-fix-2026-10-26.md).
- Beauftragt vom Nutzer; umgesetzt und lokal geprüft durch GPT-6.1 Sol High. Commit: dieser Fix. Kein Push, Merge oder Deploy.

## 2026-10-26: Begrenzte seitlich folgende Kamera
- Nutzerauftrag: Die Position der Figur vor versetzten Lücken soll leichter einschätzbar sein. Kamera folgt weich zu 45 Prozent und maximal ±1,4 Welt-Einheiten; keine Änderung an Physik, Steuerung oder Spielregeln.
- Projektion, gemalter Boden, alle fünf Bauwerke, Wintereis und Effekte bleiben aufeinander abgestimmt; inverse Bodentiefen werden weiterhin nur beim Resize berechnet. Neue Runde/Figurenwechsel setzt die Kamera zurück. Details: [camera-follow.md](camera-follow.md).
- 174 Tests grün; echte Chrome-Handyansichten in beiden Themen, allen Jahreszeiten und beiden Lenkrichtungen bei 390×844/320×568, Wintervorschauen bei 375×667; Intro, Crash und mittiger Retry geprüft. Keine JS-Fehler. Keine echten Mobilgeräte oder Safari geprüft.
- Entschieden vom Nutzer, implementiert durch GPT-6.1 Sol (High) im Branch `codex/camera-follow`; Commit: dieser Kamera-Commit.

## 2026-10-26: Spritzen als seltener Randhindernis-Entwurf (#34, #35, #36)
- Nutzerpriorität Kamera/Oberbaum/Spritzen im eigenen Branch umgesetzt: konservative Platzierung außerhalb der maximal verbreiterten Verbindungen zweier Nachbarlücken, Ausschlüsse für überlagerte Rutsch-/Windgefahren und nahe Pickups, einmalige Treffer nach bestehenden Helmregeln.
- Kleiner vorberechneter Canvas-Sprite und 0,85 s Trefferhinweis; keine neue Lenk-/Sichtstörung. Grafik als lokaler Entwurf für die Nutzerfreigabe, nichts gemergt oder veröffentlicht. Regeln, Vorschau und Prüfgrenzen stehen in [syringe-obstacles.md](syringe-obstacles.md).
- 177 Tests grün, 50 Browsermodule gebündelt; 1.000 Balance-Runden je Variante: Median 123 / p90 201 identisch mit und ohne Spritzen, 1,12 Spritzen je 100 gespawnte Mauern. Echter Browser bei 390×844 und 320×568 ohne Konsolenfehler; keine neue Geräte-/FPS-Prüfung.
- Beauftragt vom Nutzer; gebaut durch GPT-6.1 Sol High. Commit: dieser Featurecommit auf `codex/syringe-obstacles`.

## 2026-10-25: Alle offenen PRs nach Nutzerfreigabe zusammengeführt
- Grafik-Sammel-PR #97 mit enthaltenen PRs #87/#89/#91/#92 unter Erhalt ihrer Commit-Historie gemergt. Danach #90 (Performance-Werkzeug), #93 (optionale Token-Prüfung), #94 (Balance), #95 (Herbstlaub), #96 (Weltrekord); dieser Dokumentations-PR #98 hält den Abschluss fest.
- Fünf nach dem ersten Merge entstandene Konfliktstände aufgelöst. Historien und ADR-Einträge erhalten; `main.js` behält das Bauwerk-Vorladen mit der neuen Pickup-Auswahl, die Bestenliste beide Funktionen für Weltrekord und Token. Keine Branches erzwungen überschrieben, keine Schutzregeln umgangen.
- Prüfungen am gemeinsamen Stand: 168 Bun-Tests grün, Browser-Bundle mit 47 Modulen erfolgreich; jede aktualisierte Feature-PR-CI vor Merge grün. Balance-Simulation mit 1.000 Runden bestätigt Median 125 und p90 219, zwei Runden am Sim-Limit 400.
- Turnstile-Sitekey bleibt leer; kein Secret, keine neue Cloudflare-Ressource und kein Worker-Deploy. Schutz ist vorbereitet, nicht aktiviert. Keine zusätzliche Prüfung auf echten Geräten, keine neue Safari-/FPS-Messung in dieser Merge-Session.
- Beauftragt und Merge aller offenen PRs freigegeben vom Nutzer am 25.10.2026; Prüfung, Konfliktauflösung und Integration durch Codex. Die ursprünglichen Feature-Autoren und Prüfungen stehen in den Einträgen vom 18.10. Commit: dieser PR #98.

## 2026-10-18: Feinschliff #46 – Weltrekord neben dem eigenen Rekord
- Aus der halben Arbeit vom 14.10. (nur reine Logik in `scoring.js`) wurde die ganze Anbindung: `leaderboard.js` holt die Top-Wertung leise beim Start und vor jeder Runde (`refreshWorld`, Fehler ändern nichts). Das Ziel ist der nähere von eigenem und Weltrekord (`recordGoal`). Das Schild heißt „Weltrekord“, wenn der Weltrekord das Ziel ist, sonst „Rekord“. Banner „Weltrekord!“ beim Überholen, Game-over-Text „Noch N Mauern bis zum Weltrekord“ (`overNote`).
- Eine späte Antwort ändert das Ziel nur, solange noch keine Mauer geschafft ist (`applyWorldBest`), damit das Schild nicht mitten im Lauf springt.
- Geprüft: 140 Tests grün (neu: Ziel, Hinweistext, späte Antwort, Banner); Chrome 390×844 mit gestellter Bestenliste, beide Schilder (`.claude/review/feinschliff/03-…`, `04-…`). Echter Worker nicht angesprochen.
- Versuch vom 14.10. von GPT-6 Luna; Anbindung und Prüfung durch Claude Sonnet 5.5.
## 2026-10-18: Feinschliff #44 – Herbstlaub statt Blütenblatt-Form
- Die Herbst-Partikel waren schon als Laub gedacht, zeichneten sich aber als glatte Spindel und lasen sich wie Kirschblütenblätter. Jetzt malt `render-fx.js` pro Herbstfarbe einmal ein gezacktes Blatt mit Adern in ein kleines Canvas (`warmUp`), `drawParticles` stempelt es mit `drawImage`. Im Frame-Loop entsteht nichts Neues.
- Geprüft: Chrome 390×844 DPR 2, Herbst vorher/nachher (`.claude/review/feinschliff/`), keine Konsolenfehler. 134 Tests grün (die Zeichnung selbst hat keinen Test).
- Versuch vom 14.10. von GPT-6 Luna, neu aufgesetzt und geprüft durch Claude Sonnet 5.5.

## 2026-10-18: Feinschliff #45/#48 – Lücken-Untergrenze und Helm-Häufigkeit
- Nachtmodus-Auftrag des Orchestrators: die halbe Arbeit vom 14.10. (Branch `feat/gameplay-polish`) auf `origin/main` neu aufsetzen. Hier die Balance-Teile: Lücken-Untergrenze 1,8 → 2,0 (#45), Helm-Pickup 10 % → 5 % (#48), beides messbar mit `tools/balance-sim.js`. Der Versuch mit 2,2 wurde verworfen (Median 127 → 185).
- `selectPowerup` und `POWERUP_CHANCES` ersetzen `POWERUP_CHANCE`; `main.js` ruft dieselbe Funktion wie die Simulation. Die Sim zählt Helme getrennt und startet jede Runde mit eigenem Zufallswert. Auswirkung 1000 Sim-Runden: Median 127 → 125, p90 180 → 219. Details im PR.
- Gebaut durch Claude Sonnet 5.5 (Versuch GPT-6 Luna); Zahlen offen bis der Nutzer sie sichtet (ADR 0027).

## 2026-10-18: Issue #77 – Bestenliste nur mit Turnstile-Token
- Anlass: Jeder konnte per `curl` eine beliebige Zahl eintragen. Der Nutzer gab die Umsetzung frei, aber ohne Deploy, Secret oder echte Cloudflare-Ressourcen. → [ADR 0065](decisions/0065-turnstile-for-leaderboard-entries.md)
- Neu: `worker/src/turnstile.js` (siteverify), Prüfung in `postScore` nur mit gesetztem `TURNSTILE_SECRET`; `js/turnstile.js` lädt das Widget erst beim Eintragen; CSP erlaubt `challenges.cloudflare.com`; `TURNSTILE_SITEKEY` in `config.js` (noch leer).
- Geprüft: 139 Bun-Tests mit Cloudflare-Testschlüsseln und gemocktem `fetch`; lokal `wrangler dev` plus Chrome 390×844 mit Test-Sitekey: Eintragen klappt, zu frühes Absenden zeigt Hinweis, `curl` ohne Token gibt 400. Nicht geprüft: echtes Widget, Produktions-Worker, Handys.
- Gebaut durch Claude Sonnet 5.5; entschieden hat der Nutzer.

## 2026-10-18: #15 – Performance-Check als Skript
- Neu: `tools/perf-check.mjs` (Playwright, installiertes Chrome, 390×844 DPR 2, 4×-CPU-Drossel). Spielt Volkspark und Berlin-Tour je einige Sekunden mit Bot, gibt Frame-Abstand (Median, p95, max) und Update+Render-Zeit aus. Eigener Bun-Server, Worker blockiert. Doku in `operations.md`. Kein ADR nötig, keine neue Abhängigkeit im Repo.
- Messlauf 5 s: Frame-Abstand 16,7 ms (Median und p95) in beiden Themen; Update+Render Median 2,2 / 2,6 ms, p95 5,5 / 7,3 ms (Volkspark / Berlin-Tour). Mac-Chrome mit Drossel, kein echtes Handy.
- Gebaut von Claude Sonnet 5.5; beauftragt vom Nutzer.

## 2026-10-18: #76 – Gesamtprüfung der neuen Grafik
- Sammel-Branch `feat/gesamtpruefung`: #87 (Oberbaum), #89 (Volkspark-Bauwerke), #92 (Reichstag), #91 (Rathaus) zusammengeführt; Konflikte in Config, Laden, Szene, Tests und Doku gelöst. → [ADR 0074](decisions/0074-combined-integration-branch.md), [0075](decisions/0075-five-landmark-order.md), [0076](decisions/0076-all-landmarks-loaded-together.md)
- Gebaut von Claude Sonnet 5.5 (Auftrag des Nutzers). Ein Fix: Der Test der Volkspark-Bauwerke erwartete die Liste mit drei Einträgen und folgt jetzt der Liste mit fünf.
- Prüfung (Chrome 390×844, DPR 2; Bilder `.claude/review/76/`):

| Prüfung | Ergebnis |
|---|---|
| `bun test tests` | 153 grün |
| Berlin-Tour: Tor, Galerie, Brücke, Reichstag, Rathaus (`01`–`06`) | je mit Lücke und Folgelücke lesbar; keine Nähte, kein heller Rahmen; Büsche hinter den Bauwerken |
| Volkspark ab Mauer 41 (`07`–`10`) | Bauwerke an Mauer 40, 50, 60, 80 wie in ADR 0075 |
| Boden beider Modi | Volkspark alter Boden, Berlin-Tour neuer (in `04`, `05` und `09`) |
| Intro Kalle, Tine, Alaska (`12-uebersicht-figuren.png`) | Intro, Rollen und Sprung ins Spiel laufen; keine Konsolenfehler |
| 4× CPU: Bildabstand Median | 16,7 ms in beiden Modi bei allen fünf Bauwerken |
| 4× CPU: Ausreißer | max 50 ms, Update+Rendern p95 bis 37 ms bei Mauer 45 und 65 |
| Speicher aller Bauwerke | 20,8 MiB dekodiert, 510 KB WebP |

- Kirschblüten im Winter: **Testartefakt, kein Fehler.** Die Bilder sprangen per `setSeason` direkt in den Winter, die schon fallenden Blüten blieben. Im echten Lauf ab Mauer 65 hat der Winter 0 Blüten (Winter-Bild `04`).
- Bildsprung im Test: Jahreszeitenwechsel mitten im Bild zeigt für kurze Zeit den Himmel der alten Jahreszeit (Bild `09`); ebenfalls Folge des Sprungs, nicht untersucht.
- Nicht geprüft: Safari, echte Geräte, 4×-Drossel auf Geräten. Alle Treffer, Helm und Wertung unberührt (Tests).

## 2026-10-18: #81 – Bauwerke im Volkspark-Modus ab Herbst
- Auftrag des Nutzers über den Orchestrator: ab Mauer 41 jede 10. Mauer ein Bauwerk statt der Gabionen-Mauer, dasselbe Bauwerk wie die Berlin-Tour in dieser Jahreszeit (`landmarkAt`). → [ADR 0062](decisions/0062-volkspark-landmark-walls.md)
- Neu: `VOLKSPARK_LANDMARK_FROM` (40), `_EVERY` (10), `_PRELOAD` (25) in `config.js`, reine Funktion `volksparkLandmarkAt` in `logic.js`, `landmarkFor` in `render-scene.js` (gilt für beide Themen, auch für `PLANT_BEHIND_LANDMARKS`). `main.js` lädt die Sprites einmal bei 25 passierten Mauern; Fehler wird nicht wiederholt, die Gabionen-Mauer bleibt.
- Lücken, Abstände, Treffer, Tempo unverändert; vor Mauer 41 ist der Volkspark pixelgleich (gleicher Zeichenpfad, leere Pflanzenliste).
- `bun test tests`: 141 grün (zwei neue Tests). Spielbilder 390×844, DPR 2 unter `.claude/review/81/` (Mauer 41 und 51 Brücke, Mauer 42 Gabionen, Ladefehler-Fall). Vor Mauer 25 kein Sprite-Request. Echte Handys nicht geprüft.
- Baut auf PR #87 auf. Gebaut von Claude Sonnet 5.5; entschieden hat der Nutzer.
## 2026-10-18: #73 – Reichstag als viertes Bauwerk der Berlin-Tour (Winter)
- Auftrag des Nutzers über den Orchestrator (Nachtmodus: selbst prüfen, PR öffnen, nicht mergen). Baut auf PR #87 (Oberbaum). Vier Teile aus `reichstag.blend` rendern: zwei Flügel, Säule mit Wandstück, Oberteil mit Kuppel. `render-reichstag.js` füllt feste Spannen, `top` überspannt die Lücke. → [ADR 0056](decisions/0056-reichstag-runtime-parts.md), [0057](decisions/0057-reichstag-gap-readability.md), [0058](decisions/0058-plant-order-for-reichstag.md)
- Gebaut von Claude Sonnet 5.5: `tools/blender/render-reichstag-sprites.py`, `tools/build-reichstag-sprites.py`, `js/render-reichstag.js`, Laden in `main.js`, `TOUR_LANDMARKS` und `PLANT_BEHIND_LANDMARKS`. Treffer, Lücken, Abstände, Tempo, Wertung unverändert.
- `bun test tests`: 144 grün, neue Tests in `tests/reichstag.test.js`. Spielbilder 390×844, DPR 2 unter `.claude/review/73/` (links, rechts, Mitte, doppelt, verbreitert; fern/mittel/nah). Echte Handys und 4×-CPU-Messung nicht geprüft.
## 2026-10-18: #74 – Rotes Rathaus in der Berlin-Tour
- Auftrag (Nutzer, Ticket #74): Rotes Rathaus als fünftes Bauwerk, Sicht auf die Folgelücke in der Darstellung lösen, keine Sichtfenster, keine Nähte. Quelle: reparierte `rotes-rathaus-packed.blend` (Torbogen offen). → [ADR 0059](decisions/0059-rathaus-low-row-and-side-tower.md)
- Neu: `render-rathaus-sprites.py` (Blender) und `build-rathaus-sprites.py` erzeugen `wing` (unterste Arkadenreihe, vier ganze Fensterachsen) und `tower` (Uhrturm mit offenem Torbogen); `js/render-rathaus.js` kachelt den Flügel über feste Spannen und setzt den Turm links außerhalb des Wegs. `TOUR_LANDMARKS` und `PLANT_BEHIND_LANDMARKS` um `red-town-hall` ergänzt.
- Geprüft: 145 Bun-Tests grün; Chrome 390×844 DPR 2, Berlin-Tour ab Mauer 60 (Aufnahmen `.claude/review/74/shots/`): keine Nähte, Folgelücken lesbar. Echte Handys nicht geprüft.
- Entschieden hat der Nutzer das Ziel, die Darstellung Claude Sonnet 5.5; gebaut durch Claude Sonnet 5.5. Baut auf PR #87 (Oberbaum) auf.

## 2026-10-18: Issue #20 – Alaska Stufe 2: Clips, Atlas, dritte Figur
- Nutzer gab Stufe 1 v2 frei („weiter“, Fell bleibt). Stufe 2: Intro auf vier Pfoten im Ablauf von #24, die Brille fällt sichtbar beim Übergang zur Rolle, Roll ohne Brille, Helm, Crash, Atlas, Einbau in die Auswahl ohne Freischaltregel. → [ADR 0047](decisions/0047-alaska-clips-and-third-figure.md)
- Neu: `export-alaska.py` (Auswahl, Roll, Roll mit Helm, Crash), `build-figure.py` (Atlas und `figure-sheets.js`-Block pro Figur); `export-intro.py` kennt Alaska und einen Figurenmaßstab; `intro.py` hat Katzenposen für den neuen Körper; `alaska.py` hat einen Helm. `assets/figures/alaska/` (469 KB). `FIGURES` erhält `alaska`.
- Geprüft: 124 Bun-Tests und 7 Python-Tests grün; Chrome 390×844 DPR 2 mit Start, Intro, Skip, Rollen, Helm, Crash, Neustart und Figurenwechsel ohne Konsolenfehler. Aufnahmen und Intro-GIF unter `.claude/review/20/stufe2/`. Echte Handys nicht geprüft. Noch kein PR; wartet auf die Spielabnahme.
- Gebaut durch Claude Sonnet 5.5; entschieden hat der Nutzer.

## 2026-10-18: Issue #20 – Alaska Stufe 1: Körper aufgeräumt, Rig, Testposen
- Auftrag des Nutzers (Ticket #20): neuer TRELLIS-Körper mit Regenbogenbrille als dritte Figur, zwei Freigabe-Stufen. Stufe 1: Rig plus ausgebesserte Artefakte, Testposen stehen, laufen, eingerollt unter `.claude/review/20/`. → [ADR 0046](decisions/0046-alaska-trellis-body-clean-rig.md)
- `tools/blender/prep-alaska.py`: Mesh verschweißt, neu vernetzt, geglättet, auf rund 60.000 Dreiecke reduziert, Fellfarbe in Vertexfarben, Ohren innen geglättet und rosa. Ergebnis `assets/src/characters/alaska-3d.glb` (2,3 MB). Die Brille bleibt ein eigenes Objekt mit Regenbogenlinsen.
- `tools/blender/alaska.py` neu: Pivot-Rig auf dem neuen Körper mit eigenen Gewichten und zwei Rumpf-Gelenken (`bend`, `curl`). `tools/blender/alaska-poses.py` rendert die Testposen und Übersichtsblätter. 124 Bun-Tests und `test_intro.py` grün.
- Rückmeldung des Nutzers, Stufe 1 v2: Brille fällt beim Losrollen (neue Testpose „Brille fällt“, eingerollt ohne Brille); eingerollte Pose klarer als Katze (drei Rumpf-Gelenke, Kopf, Pfoten, Schwanz sichtbar); rosa Fleck und Fellfalte weg (Ursache der Sprenkel: alte Split-Normalen im GLB). Renders unter `.claude/review/20/v2/`.
- Offen (Stufe 2, nach Freigabe): `BALL_ALASKA` und Intro-Posen für den neuen Körper, alle Clips, Atlas, Einbau als dritte Figur.
- Gebaut durch Claude Sonnet 5.5; entschieden hat der Nutzer (Ticket #20). Lokal committet, kein Push.

## 2026-10-18: #85 – harte senkrechte Kanten in nahen Baumreihen
- Ursache: `forestSprite()` schnitt für Baum-Variante 1 die linke 10 % des gemalten Waldbildes ab (`inset`). Der Schnitt ging mitten durch das Laub und ließ eine harte senkrechte Kante, bei gespiegelten Pflanzen auf der anderen Seite. Bei nahen, großen Bäumen fiel das auf, in allen Jahreszeiten und Themen. Nicht aus der Galerie, schon vor #71 vorhanden.
- Fix: das Bild wird nicht mehr beschnitten. Variante 1 wird stattdessen gespiegelt, damit die Bäume abwechslungsreich bleiben. Keine Änderung an Spawn, Abständen oder Spielregeln.
- Vorher/Nachher bei 390×844, DPR 2, Volkspark und Berlin-Tour, vier Jahreszeiten, zwei Fahrstrecken unter `.claude/review/85/`. `bun test tests` 134 grün. Gebaut von Claude Sonnet 5.5. Echte Handys nicht geprüft. Grafikfreigabe des Nutzers steht aus.

## 2026-10-18: #72 – Oberbaumbrücke in der Berlin-Tour
- Schritt 1 (Nutzer-Auftrag über den Orchestrator): vier Teile aus `oberbaum-bridge.blend` headless rendern, ohne Spielcode. Schritt 2 nach Merge von PR #84: Brücke als dritter Eintrag in `TOUR_LANDMARKS` (Herbst), `render-oberbaum.js` nach dem Muster von Tor und Galerie, kein Sichtfenster. → [ADR 0053](decisions/0053-oberbaum-bridge-runtime-parts.md), [0054](decisions/0054-oberbaum-towers-outside-corridor.md), [0055](decisions/0055-plant-order-for-oberbaum.md)
- Gebaut von Claude Sonnet 5.5: `tools/blender/render-oberbaum-sprites.py`, `tools/build-oberbaum-sprites.py`, `js/render-oberbaum.js`, Laden in `main.js`, Pflanzenliste `PLANT_BEHIND_LANDMARKS`. Treffer, Lücken, Abstände, Tempo, Wertung unverändert.
- `bun test tests`: 139 grün, neue Tests in `tests/oberbaum.test.js`. Spielbilder 390×844, DPR 2 unter `.claude/review/72/` (links, rechts, doppelt, verbreitert; fern/mittel/nah; Pickup; Durchfahrt und Crash im laufenden Spiel). Echte Handys und 4×-CPU-Messung nicht geprüft.
- Nutzer-Rückmeldung: helle Lücken zwischen den Mauerstücken gefallen nicht. Ursache: der Pfeiler-Sprite ist breiter als sein Schaft. Fix: Kacheln rücken um die Schaftbreite vor (`OBERBAUM_PIER_STEP`/`_INSET`), Lücken und Treffer unverändert. Neue Bilder unter `.claude/review/72/v2/`. Gebaut von Claude Sonnet 5.5.

- Zusatz-Fixes am Tor (Nutzer): die hellen Mittellinien bei mehreren Lücken (`#ffe7ae`) sah der Nutzer als Bug-Rahmen, sie sind aus `render-gate.js` entfernt; Galerie und Brücke zeichnen keine solchen Linien. `brandenburg-gate` steht jetzt auch in `PLANT_BEHIND_LANDMARKS`, damit kein naher Busch eine Säule abschneidet. Bilder unter `.claude/review/72/tor/`. Gebaut von Claude Sonnet 5.5.

## 2026-10-18: Brandenburger Tor ohne Sichtfenster
- Der Nutzer hat nach dem Merge von #28 gemeldet, dass beim Anfahren ein Stück von Tor und Säule fehlt. Ursache war das Sichtfenster aus ADR 0034, das hohe Teile vor der nächsten Durchfahrt halb durchsichtig zeichnete. Der Nutzer hat entschieden: Tor immer vollständig. → [ADR 0052](decisions/0052-gate-drawn-whole-without-sight-window.md).
- `render-gate.js` zeichnet jedes Bauteil jetzt mit einem einfachen Spannen-Clip und gleicher Deckkraft; `revealAlpha`/`revealMargin` und der `nextWall`-Parameter sind entfallen. Tests: 123 grün; die zwei Fenster-Tests ersetzt ein Test, dass nichts ausgeschnitten oder abgeblendet wird. `tools/check-sightseeing.py` ohne JS-Fehler, Spielbilder bei 390×844 geprüft.
- Entschieden vom Nutzer, gebaut von Claude Opus 5.5 (Hauptsession). Commit: dieser Commit.

## 2026-10-18: #71 – East Side Gallery in der Berlin-Tour
- Rückfrage an den Nutzer, wie Tor und Galerie wechseln. Antwort: ein Bauwerk je Jahreszeit (20 Mauern), im Kreis, Reihenfolge als Liste in `js/config.js`. Auftauchen im Volkspark ist ein späteres Ticket. Hinweis des Orchestrators: PR #82 entfernt das Sichtfenster, die Galerie entsteht ohne. → [ADR 0049](decisions/0049-east-side-gallery-per-season.md)
- Gebaut von Claude Sonnet 5.5: `tools/blender/render-gallery-sprites.py` und `tools/build-gallery-sprites.py` erzeugen sechs freigestellte Bucht-WebPs (Herkunft `assets/landmarks/gallery-provenance.json`), `landmarkAt()` und `galleryTiles()` als reine Logik, `render-gallery.js` als Zeichenpfad. Treffer, Lücken, Abstände, Tempo, Wertung unverändert.
- `bun test tests`: 129 grün, neue Tests in `tests/gallery.test.js` (Wechsel, Kachelung, Beschnitt auf feste Spannen, Laden, Asset-Hashes und Budget). Spielbilder 390×844, DPR 2 unter `.claude/review/71/` (links, rechts schmal, doppelt, verbreitert; Tor zum Vergleich). Echte Handys nicht geprüft, keine 4×-CPU-Messung.
- Nutzer-Rückmeldung: Galerie passt, Busch vor der Mauer muss weg. Ursache war die Tiefensortierung (Mauer reicht bis in die Büsche, nähere Pflanze wird davor gezeichnet). Erster Fix (Pflanzen ausblenden) riss Löcher in die Baumreihen, der Nutzer hat ihn verworfen. Endgültig: alle Pflanzen bleiben, `plantDepth()` zeichnet Pflanzen kurz vor einer Galerie-Mauer hinter dieser (`GALLERY_PLANT_BEHIND`), nur in der Berlin-Tour, ohne Spawn-/Abstandsänderung. Spielbilder fern/mittel/nah für alle Lückenarten und Live-Lauf (Durchfahrt, Crash, Neustart, keine JS-Fehler) unter `.claude/review/71/v3/`. Echte Handys und 4×-CPU-Messung nicht geprüft.
- Gebaut von Claude Sonnet 5.5, Rebase auf `origin/main` nach PR #82.


## 2026-10-18: Issue #24 – bestätigte Storni, menschliches Intro zur Spielabnahme
- Nutzerentscheidung: Hero-Flasche mit großer roter Schrift, kräftigem Orange und größer vor der Figur übernehmen; kein neuer Look, keine Spielregeländerung, Alaska separat in #20. ADR 0037 aus Doku-PR #78 gelesen. → [ADR 0031](decisions/0031-approved-storni-human-intro.md)
- Uncommittete Figuren-Vorarbeit zuerst gelesen und auf `feat/storni-intro` weiterverwendet. Der bestätigte Storni-Builder ersetzt den früheren Entwurf; Kalle/Tine erhalten vorberechnete 1,5-s-WebP-Intros. Export richtet die Posen am Boden aus und übernimmt den letzten Frame aus dem vorhandenen Rollatlas. Alte Roll-/Helm-/Crash-/Auswahlgrafiken und das Gameplay bleiben unverändert.
- Runtime liest Zeiten, Kontaktbild, Größe und Anker aus dem gewählten Clip statt aus Kalles Bildzahlen. Nur vier Spielclips der gewählten Figur laden; die alten Intro-Teilatlanten entfallen. Herkunft, Exportbefehle und Byte-/Speichermessung stehen in ADR 0031.
- Implementiert durch GPT-6 Luna (`coder`, Runtime/JS-Tests) und GPT-6.1 Sol (`openai/gpt-6.1-sol`, Export/Integration und Browserprüfung); bestehende Vorarbeit laut ADR 0030 erhalten. Tests und nummerierte 390×844-Spielaufnahmen unter `.claude/review/24/`. Echte Handys/iOS Safari nicht geprüft.
- Unabhängiges Review durch GPT-6.1 Sol medium ohne blockierende Findings. 103 Bun- und 7 Python-Tests grün; Browserabläufe und 4×-CPU-Messung protokolliert (Intro-Framearbeit p95 2,9/2,7 ms, Spielen 3,6/3,4 ms für Kalle/Tine).
- Vom Nutzer am 18.10.2026 im Spiel freigegeben („passt“, Flasche neben der Figur bleibt). Commit, Rebase und PR durch die Claude-Hauptsession (Opus 5.5), weil das OpenCode-Kontingent aufgebraucht war. #20 und Eltern-Epics bleiben offen.

## 2026-10-18: #28 – Brandenburger Tor und Themenauswahl
- Vom Nutzer angefragt und entschieden: neue detaillierte Modelle beibehalten, Volkspark/Berlin-Tour auf dem Startbildschirm, versetzte bestehende Spiellücken ohne neues Balancing. Jüngste Klarstellung während der Umsetzung: **gar kein Fernsehturm im Spiel**, auch nicht als Randkulisse oder in der Berlin-Tour; #47 ist geschlossen, es gibt keine Turm-Schnittstelle. ADR 0037 aus Doku-PR #78 gelesen; abweichende Aussagen in ADR 0033 und die dortige spätere Randkulissen-Planung sind für den Turm durch diese jüngste Anweisung ersetzt. Branch `feat/brandenburger-tor` nimmt die zuvor gelesene uncommittete Arbeit mit.
- Implementiert von GPT-6 Luna (Theme-UI, Einzelspannen-Regressionslogik, erster konkreter Tor-Renderer); integriert und überarbeitet von GPT-6.1 Sol (Modellteil-Export, Vollsäulen, Sichtfenster, bedarfsgerechtes Laden, Browser-/Renderprüfungen, Dokumentation). Review durch GPT-6.1 Sol (medium). Entscheidungen: [ADR 0034](decisions/0034-brandenburg-gate-runtime-parts.md), [ADR 0035](decisions/0035-gate-openings-preserve-single-gap-collision.md).
- Drei echte Modell-WebPs aus `brandenburg-gate-detailed.blend`: Dach/Reliefs/Quadriga, kannelierter Säulenpfeiler und Eichensperre, zusammen 80.388 Bytes bzw. 5,42 MiB RGBA. Bewegliche Säulen und gesperrte Spannen folgen den unveränderten Lücken; hohe Bauteile erlauben durch ein kleines Sichtfenster die Sicht auf die Folgedurchfahrt. Keine Live-3D-Engine, kein neuer Bild-API-Lauf, keine Tempo-/Abstands-/Wertungs-/Helmänderung. Die ursprünglichen Einzelspannen bleiben Treffergrundlage, auch wenn sich sichtbare Öffnungen überlappen.
- `bun test tests`: 125 bestanden, 0 fehlgeschlagen; `git diff --check` grün. Echte Headless-Chrome-Spielansichten bei 390×844, DPR 1/2, mit Einstieg, versetzten/kleinen/doppelten/verbreiterten Öffnungen, Durchfahrt, Helmverbrauch, Treffer, UI-Neustart und Rückkehr zu Volkspark; keine JS-Ausnahmen. Blockierter Torbild-Download hält am Start, gibt die Auswahl wieder frei und lässt sich erfolgreich wiederholen; eine frische Volkspark-Runde fordert keine Tor-WebPs an. Produktions-Endpunkte im Browsertest blockiert. Reproduzierbar mit `tools/check-sightseeing.py`; Screenshots und Nahaufnahmen unter `.claude/review/28/`. Vom Nutzer am 18.10.2026 freigegeben („passt“). Commit, Rebase und PR durch die Claude-Hauptsession (Opus 5.5), weil das OpenCode-Kontingent aufgebraucht war. Echte Mobilgeräte sind nicht geprüft.
- 4×-CPU-Messung in Headless-Chrome, 390×844/DPR 2, fünf Tore im unveränderten Startabstand, 130 Browserframes (10 Aufwärmframes): Render-Aufruf Median 3,3 ms, p95 4,2 ms, Maximum 4,5 ms; Frameabstand p95 16,7 ms. Statische Spielszene mit echter Darstellung und Boden/Figur, kein Beleg für reale Handy-/Software-Canvas-Leistung. Protokoll `.claude/review/28/performance.json`.
- Commit: dieser Feature-Commit; vor dem PR auf den dann aktuellen `origin/main` rebasen. `tools/serve.js` bleibt ausschließlich lokal auf 8773, bestehende Änderungen an `opencode.jsonc` werden nicht mitcommittet.

## 2026-10-18: Art-Tickets veröffentlicht, Arbeit auf Panes verteilt
- Der Nutzer hat die elf Ticket-Entwürfe freigegeben. Veröffentlicht als #28, #71–#74 (Bauwerke), #47 (Fernsehturm), #75 (Boden), #24 (Storni + Intro), #20 (Alaska), #76 (Gesamtprüfung) und #77 (Bestenlisten-Token, geparkt). Blockierungen, Unter-Issues, das neue Label `ready-for-agent` und Vermerke an #27/#19 und den Epics gesetzt.
- Vier OpenCode-Panes in herdr arbeiten parallel an #28, #24, #47 und #75; neue Worktrees `turm` und `boden` von `origin/main`. Der herdr-Skill ist jetzt als Claude-Skill installiert (`herdr --skill`).
- Der Fernsehturm (#47) war als Erster zur Freigabe fertig (GPT-6.1 Sol im Pane `turm`). Nach Sichtung der Spielbilder hat der Nutzer ihn ganz gestrichen, auch aus der Berlin-Tour. #47 geschlossen, kein PR; Nachtrag in ADR 0037.
- Entschieden vom Nutzer. Veröffentlicht und verteilt von Claude Opus 5.5 (Hauptsession). Commits: PR #78.

## 2026-10-18: Neue Art-Runde, Ticket-Entwürfe und Session-Übergabe
- Sechs detaillierte Berliner Wahrzeichen mit tatsächlich erzeugten Nano-Banana-2.1-Referenzen, Blender-Szenen, Renders und Parkkompositionen; Alaska über einen erfolgreich abgeschlossenen kostenlosen TRELLIS.2-Lauf rekonstruiert und in Blender mit Fellfarbe und separater Regenbogenbrille nachbearbeitet. Quellen bleiben lokal im ignorierten Review-Verzeichnis; [Quellenübersicht](art-review-sources-2026-10-18.md).
- Die Galerie mit neun Motiven und sieben drehbaren GLBs wurde in Safari geöffnet. Lokal 64 Bild-/Quellen-/Blender-/GLB-Verweise mit HTTP 200 und sieben GLB-Dateiköpfe geprüft. Rathaus-Torbogen repariert; Folgelücken-Sicht und Alaska-Rig/Animation bleiben offen. Keine Runtime-Integration, keine vollständige neue Spielprüfung und kein Nachweis auf echten Geräten.
- Nutzerentscheidungen: neuen Modell-Look behalten, fünf Gebäude als Hindernisse mit tatsächlich versetzten Durchfahrten, Fernsehturm ausschließlich prominent am Rand; Abstände und Schwierigkeit erhalten; alle Motive integrieren, KISS. → [ADR 0037](decisions/0037-integrate-reviewed-art-without-rebalancing.md).
- Aktive Sightseeing-/Figuren-/Daten-/Feinschliff-Worktrees read-only geprüft. Vorbereitete Torlogik und Intro-/Rig-Arbeit sind überwiegend uncommittet und noch nicht in die Runtime verdrahtet. Der Überlappungs-Grenzfall der Torlogik darf nicht nebenbei die Trefferregeln ändern.
- Elf einzelne [Ticket-Entwürfe](plans/art-integration-2026-10-18/README.md) mit Kriterien, Abhängigkeiten und Zuordnung zu vorhandenen GitHub-Aufgaben vorbereitet und nach `.docs` gesichert. Aufteilung noch nicht ausdrücklich freigegeben; keine Issues veröffentlicht oder verändert. Token-Absicherung der Bestenliste nur für später vorgeschlagen, nicht umgesetzt; Anti-Bot-Nachweis ist kein Beweis für erspielte Punkte.
- Auf Nutzerwunsch [handoff.md](handoff.md) als vollständigen Wiedereinstieg für eine neue Session ergänzt. Produktentscheidungen nicht erneut aufrollen; nächste Aktion ist die konkrete Ticketaufteilung freigeben/anpassen und danach in GitHub veröffentlichen.
- Angefragt und Produktumfang entschieden vom Nutzer. Art-Modelle: GPT-6.1 Sol High auf Subagenten, geprüft/nachbearbeitet durch Codex-Hauptsession. Übergabe/Ticket-Entwürfe: Codex; Read-only-Faktenprüfung: GPT-6.1 Sol High. Commits: uncommitted, keine PRs/Merges/Deployments dieser Session.

## 2026-10-14: Sightseeing-Runde 2 – Vorbereitung, noch nicht im Spiel
- Der Nutzer hat sechs Berliner Landmarken freigegeben: Brandenburger Tor, Reichstag, Rotes Rathaus, Fuß des Fernsehturms, Oberbaumbrücke und East Side Gallery. Erfundenen Durchlässen stimmte er zu. Das Tor behält die Geometrie aus Referenz 04; erlaubt sind nur gleichmäßige Skalierung für G und ein gemalter Toon-Look nach Referenz 01 und Art-Bible. Blender 5.2 läuft headless mit Skripten im Repo; Spielblickwinkel kommen aus `js/view.js`. 3D bleibt Offline-Arbeit, nicht Teil der Laufzeit. Nano Banana ist für Konzept, Texturen und Hintergrund vorgesehen.
- Der Fernsehturm darf selten am Rand erscheinen, kleiner und dunstiger. Für die Review ist ein statisches RGBA-PNG mit 192 × 384 Pixeln vorgesehen; später wäre ein kleines statisches WebP möglich. Im Startscreen ist „Volkspark“ die Vorgabe und „Berlin-Tour“ eine wählbare Alternative.
- Vorbereitet sind `tools/blender/sightseeing-{gate,models,materials,pipeline,manifest}.py`. `js/config.js` enthält `SIGHTSEEING_LANDMARKS` mit sechs kanonischen englischen IDs. `js/logic.js` hat die reine Funktion `gateLayout(gaps, doorways = [])`: Sie normalisiert offene `{x, w}`-Spannen, führt überlappende oder sich berührende Spannen zusammen und berechnet feste Wandteile aus derselben Vereinigung. `passesGate(px, radius, layout)` prüft gegen diese Öffnungen. Die Berechnung ist für Spawn und Power-up-Wechsel gedacht, nicht für jeden Frame.
- Noch keine Verdrahtung in `main.js`, `input.js`, `game-flow.js` oder Render-Modulen; auch Theme-Auswahl und Startscreen-UI fehlen. Die sieben Runde-2-PNGs und zugehörigen Blender-Szenen liegen unter `.claude/review/runde-2/` zur Freigabe. Freigegeben sind bisher die Runde-1-Designrichtung und Tor-04-Geometrie. → [ADR 0033](decisions/0033-sightseeing-landmarks-and-theme-selection.md)
- Verdeckung durch hohe Fassaden ist bei statischen Mesh-Raycasts zur Folgewand und `G = 3,7` noch ein blockierender Designpunkt. Bei Hindernis 1/80/200: Reichstag 27/27/27, Rathaus 9/9/27, Turm 18/18/0, Oberbaumbrücke 4/4/4 von jeweils 27 Proben; Tor und East Side Gallery waren in diesen Stichproben frei. Keine Fade-Regel beschlossen. Freiraum- und Kameraprüfungen bestehen bei G3,7 und G4,8; 48 Projektionsanker weichen maximal 0,000039 Pixel von der Spielgleichung ab. Das gesamte Runtime-WebP-Budget muss vor Integration geprüft werden. Keine laufende Spiel-, 4×-CPU- oder Geräteprüfung dieser Assets.
- Angefragt und Designentscheidungen getroffen vom Nutzer. Implementiert von Coding-Subagent GPT-6 Luna; koordiniert von GPT-6.1 Sol; Review durch GPT-6.1 Sol (medium). `bun test tests`: 113 bestanden, 0 fehlgeschlagen. Statische Review-Seite in Headless-Chrome bei 390×844/DPR 2 geprüft: alle sieben PNGs laden, kein horizontaler Überlauf, Randturm 80 px hoch; dies ist kein Spieltest. Branch `feat/sightseeing-round-2` auf `main` nach PR #63; Änderungen und ADR sind uncommitted. Es gibt daher noch keine Commit-Hashes.

## 2026-10-14: Figuren, Blender-Freigaberunde 3 (#17, #22)
- Der Nutzer hat Alaska aus Konzept 04 mit runden Regenbogengläsern, Storni aus Konzept 03 mit kräftigem Orange in allen Ansichten und das 1,50-s-Intro freigegeben. Modelle und Animationen entstehen lokal in Blender 5.2.2, reproduzierbar per Skript. → [ADR 0030](decisions/0030-blender-alaska-storni-and-intro-review.md)
- `tools/blender/alaska.py` baut eine grau-blaue Britisch-Kurzhaar auf vier Pfoten mit plüschiger Kurzhaaroberfläche und eigenem Gelenk-Rig. `storni.py` baut Flasche, Etikett, Schrift und Kronkorken. Kalle und Tine behalten ihre vorhandenen GLB-Modelle und das NumPy-Skinning.
- `intro.py` definiert 45 Frames bei 30 fps: drehen, zwei kurze Schritte, Flaschenkontakt, stolpern, einrollen und um einen festen Ball-Pivot weiterrollen. Alaska zieht vier Pfoten und Schwanz an. `review.py` erzeugt vier echte Orthografie-Ansichten sowie transparente PNG-Sequenzen; `pack-review.py` erzeugt Übersichten, animierte Vorschauen und WebP-Atlas-Kandidaten ausschließlich unter `.claude/review/`.
- Das Paket wartet auf Modell-/Renderfreigabe. Spielintegration, endgültiger Sprite-Export und die nachfolgende Renn-Animation für #64 folgen erst danach. Noch keine Renders in `assets/`, keine Änderung der Spielregeln.
- Prüfung: Blender-5.2-Smoke-Tests und vollständige Rendersequenzen; sechs reine Python-Tests für Timing, Vierpfotenbewegung, Kontakt ohne Sprung und Rollphase. WebP-Kandidaten bei Qualität 80: Kalle 237.244 Byte / 14,22 MiB RGBA, Tine 200.222 Byte / 13,41 MiB, Alaska 207.876 Byte / 13,41 MiB; jeweils eine Seite mit beiden Achsen ≤2048 px. Das frühe Downloadziel für die Intros wird noch überschritten; Gesamtbudget vor Spielintegration neu prüfen.
- Entschieden vom Nutzer, koordiniert durch Claude. Code-Grundlagen durch GPT-6 Luna (`coder`); Integration, visuelle Korrekturen und Prüfungen durch GPT-6.1 Sol (`openai/gpt-6.1-sol`), Review durch GPT-6.1 Sol. Branch `feat/figuren-blender`, Basis `origin/feat/main-modules`, solange PR #63 offen ist. Commit: noch nicht erstellt, Freigaberunde im Worktree.

## 2026-10-18: Issue #75 – neuer Boden nur für die Berlin-Tour
- Nutzerentscheidung im Issue-Kommentar: beide Böden bleiben. Volkspark behält den alten Boden, die Berlin-Tour bekommt den neuen, aus `ground-v2.png` abgeleiteten (zwei kleine periodische WebPs, weiche Grasränder, Details wrappen an beiden Kachelkanten). → [ADR 0043](decisions/0043-scrollable-ground-from-reviewed-study.md)
- Uncommittete Vorarbeit (GPT-6 Luna, GPT-6.1 Sol) als WIP gesichert, auf `origin/main` mit #28 (Theme-Auswahl) rebased und nach `game.theme` getrennt: `loadGroundArt` und ein zweiter Kachelsatz entstehen erst bei der ersten Wahl der Berlin-Tour; Nahtüberlappung im Renderer nur dort. Volkspark läuft über den alten Code.
- Geprüft: `bun test tests` 129 grün. Volkspark gegen `main` verglichen: 12 Saison-/Oberflächenansichten bei 390×844/DPR 2 byte-identisch. Spielbilder beider Themen (Start, vier Jahreszeiten) unter `.claude/review/75/`. Keine echten Geräte, kein 4×-CPU-Lauf für die Trennung neu gemessen.
- Umgebaut von Claude Sonnet 5.5 im Pane `boden`. Technische Vorarbeit wie oben. **Grafikfreigabe ausstehend, noch kein PR.** Lokaler Port 8775 ist nicht Teil des Commits.

## 2026-10-14: Review-Fixes zur Modul-Aufteilung
- Der Game-Flow-Test ersetzt beim Start den Spielzustand jetzt wirklich und prüft, dass Pass und Pickup nur den neuen Zustand ändern. Wiederhergestellte WHY-Kommentare erklären Sicherheitsgrenze, Animations-Neustarts, Rekord-Banner, Tastatursteuerung und schnellen Neustart. `main.js` reicht die vorhandene `pick`-Funktion direkt weiter.
- Angefragt vom Claude-Orchestrator nach Review durch Sonnet 5.5. Implementiert von GPT-6 Luna; Integration und Review durch GPT-6.1 Sol. Verifiziert: 105 Tests, Browser-Bundle und `git diff --check`. Commit: dieser Commit (`test(game): cover replacement state and restore intent comments`, PR #63).

## 2026-10-14: Issue #16 – `main.js` nach Verantwortung aufgeteilt
- `js/main.js` hält Update-Schleife, Simulation und Verdrahtung. Eingaben, HUD, Start-/Crash-Ablauf, Szenenzeichnung und der Initialzustand liegen in `input.js`, `hud.js`, `game-flow.js`, `render-scene.js` und `game-state.js`.
- Die Module bekommen den aktuellen Spielzustand über Getter und Callback-Abhängigkeiten; so behalten sie keinen veralteten Zustand.
- `main.js` hat 379 Zeilen. Regressionstests decken Pass/Belohnung, Crash, Pickup, Figurenwahl und den erst nach Input-Setup verfügbaren Board-Callback ab.
- Verifiziert: 104 Tests, Browser-Bundle, Chrome bei 390×844 (Start/Intro, Pass, Pickup, Helm-Crash, Game over, Figurenwechsel). 4× CPU-Drossel: Median/p95 16,7 ms, einzelne Spitze 150 ms. Keine echten Handys geprüft. Keine Spielregeln, Zeitwerte, Zufallsaufrufe oder Eingabe-Guards wurden geändert.
- Angefragt vom Nutzer; entschieden vom Nutzer und Claude-Orchestrator. Implementiert von GPT-6 Luna; Integration und Browserprüfung durch GPT-6.1 Sol, Review durch GPT-6.1 Sol. Commit: dieser Commit (`refactor(game): split input HUD and game flow`, #16).

## 2026-10-14 (night): CI, tickets and OpenCode panes
- GitHub Actions runs `bun test tests` on every PR; `main` takes only green PRs. `opencode.jsonc` sets the OpenCode permissions and two sub-agents (`coder` on GPT-6 Luna, `reviewer` on GPT-6.1 Sol medium).
- The user's new idea list became epics with sub-issues on GitHub. Claude runs the OpenCode panes in herdr. → [ADR 0026](decisions/0026-opencode-panes-tickets-and-ci.md)
- Requested by: the user. Built by: Opus 5.5 (main session).
- Later the same night: OpenCode sub-agents twice tried to read or write the main checkout instead of their worktree. `opencode.jsonc` now denies every folder outside the worktree except temp and OpenCode's own data (they also mistyped the long repo name), so they get an error and fix the path themselves instead of waiting for the user.

## 2026-10-14 (evening): Perfekt, streak helmet, record chase
- To make you want one more run (the user: "geiles Gameplay, das einen hookt"): a pass through the middle pops "Perfekt", a pass by a hair "Knapp!". Six perfect passes in a row give a free helmet; pips under the score show the streak. → [ADR 0025](decisions/0025-perfect-streak-and-record-chase.md)
- The wall that would beat your record carries a "Rekord" sign; passing it shows "Neuer Rekord!". The season chip fills up over its 20 walls. Game over says "Neuer Rekord!" or "Noch N Mauern bis zum Rekord".
- Score and leaderboard stay "walls passed".
- The balance sim now plays the streak too (`--no-streak` to compare): median 105 → 128 for the bot, which is more precise than people.
- Requested by: the user. Built by: Opus 5.5 (plan, integration); Haiku 5.5 subagent (`js/scoring.js`); Sonnet 5.5 subagent (UI); Sonnet 5.5 reviewed (nothing serious). Commit: `18dd72a`.

## 2026-10-14 (evening): Fairer difficulty curve
- Testers said the game gets far too fast and nobody gets past about 50 walls. A new balance sim (`tools/balance-sim.js`) lets a human-like bot play the real rules; tuned to the testers, it got stuck at a median of 48 with 70 % of crashes in autumn. Cause: the autumn wind pushed the ball further than the gap allowed, while the time between walls had fallen to 0.6 s. → [ADR 0024](decisions/0024-difficulty-curve-by-walls.md)
- Speed, time between walls, gap width and the gap's sideways jump now follow the walls passed and ease toward floors (max ~45 km/h instead of 64). Each season starts with five easier walls. Wind gusts are weaker, build up over autumn and are announced 0.7 s ahead (blinking arrow, leaves drift first). Ice settles instead of swinging. Gravel knocks are lighter and nearly gone on a puddle or ice (tester Luca: "Schotter und Pfütze ist deadly"). Speed lines and blur are rescaled to the new top speed.
- Sim on the new curve: median 105 walls (old: 48), 90 % of runs end before 151, crashes spread over all seasons, no cliff. The wind logic is now one tested function shared by game and sim.
- Requested by: the user. Built by: Opus 5.5 (plan, sim, integration); Haiku 5.5 subagents (curve in `logic.js`, wiring in `main.js`); Sonnet 5.5 reviewed (no critical findings) and wrote the review fixes. Commit: `9125556`.

## 2026-10-14: Lower walls and environment release review
- The user requested lower gabions so the following gap remains easier to see. Basket height is now 1.65 instead of 2.6; the material faces crop to the new dimensions, preserving wire and stone proportions. Added a visibility regression at tight late-game spacing for three phone formats.
- The environment work is prepared on `feat/painted-park-environment` for a reviewed PR to main, including the current icon/start-screen changes already merged on main.
- Requested by: the user. Built by: Codex (GPT-6). Independent review by GPT-6.1 Sol (medium) of `f592a12` found no actionable correctness issues. All 72 tests pass; the browser bundle parses successfully, near-wall screenshots and the current figure-select/Losrollen flow are checked. Hardware FPS/4x CPU throttling remain unverified. Environment implementation: `5403005`; upstream integration: `f592a12`. Release is tracked by the environment PR.

## 2026-10-14: Ground and wall material refinement, visible downhill
- User feedback: ground and walls should resemble the detailed generated references; explicitly chose stronger visible downhill. → [ADR 0023](decisions/0023-painted-materials-and-hill-profile.md)
- Two shared painted material WebPs replace sparse earth dots and flat procedural stones. Earth has embedded gravel, roots, worn patches and leaves; gabions have tightly packed faceted rocks behind fine wire. Larger cached faces, level lids, shaded ends and seasonal snow/vines preserve gap readability. Added material packing script and exact prompts.
- A shared logarithmic hill profile moves all ground objects consistently, while keeping the player position, horizontal scale and collision rules. Ground inverse rows are built only on resize. The ice mask follows the curve; a distant painted forest layer fills the valley transition.
- Validation: 71 tests passing, including projection/inverse and collision-plane anchors. Browser checks in explicit 390×844 and 375×667 game frames, seasonal materials and normal play. Debug fixtures can set width/height independently of the browser pane size. Added art: 93,390 bytes. Real devices and 4x CPU throttling remain unverified.
- Requested by: the user. Built by: Codex (GPT-6), with the built-in Imagegen tool. Uncommitted on `grafik`; not published.

## 2026-10-14: Painted seasonal environment
- Replaced the recoloured park photo with four cropped WebP horizons from the user's new references, without their foreground walls. Shared seasonal palettes connect sky, ground, baskets and foliage. → [ADR 0022](decisions/0022-painted-seasonal-environment.md)
- Built four transparent painted woodland clusters with the built-in Imagegen tool. Cached tree/shrub variants form a denser roadside, with silhouette-shaped depth mist. New basket faces use larger stone shapes, clear dark wire, sunlit rims, spring vines, autumn leaves and winter snow; gap posts stay inside collision bounds.
- Ground tiles now have baked edge shadows, sunlit middles, uneven verges and a continuous winter track. The image preparation script and complete prompt set live in `tools/build-environment.py` and `assets/environment/README.md`.
- Eight new WebPs total 898,616 bytes. Old full-resolution references are not loaded by the game. Changes remain uncommitted on `grafik`; nothing published.
- Validation: 69 tests passing; browser checks at 390×844 across all four seasons and at 375×667. Real-device/4x CPU-throttled performance pending.
- Requested by: the user. Built by: Codex (GPT-6), using the supplied Gemini idea as reference material.

## 2026-10-14 (afternoon): Calmer start screen, no emojis
- The user found the start screen cluttered and the emojis too many. Now: title, one line, the figure cards, one big "Losrollen" button, the three painted power-ups in a compact row, the record. A card only picks the figure; the button (or a tap anywhere else) starts.
- "Wischen zum Lenken" moved out of the start screen into the intro, shown while the figure turns and trips. The seasons line is gone; the season banners explain each season when it comes.
- Emojis removed from the UI: start legend, bottom buttons, game over, leaderboard (ranks are numbers), idea sheet, season and surface banners, HUD season chip, wind hint. The score HUD is hidden on the start screen.
- Found on the way: after a deploy the browser may mix the new `index.html` with cached old CSS/JS for up to 10 minutes (GitHub Pages `max-age=600`). That made the new icons huge for the user. Logged in the backlog.
- Requested by: the user. Built by: Opus 5.5.

## 2026-10-14 (midday): Painted power-up icons, the Storni bottle
- Power-up icons painted with Nano Banana in the gouache style (the user picked them over a glossy 3D set). They float with a glow on the path and replace the emojis in the HUD, the start legend and the banners. The helmet is now the same red bike helmet the figures wear. → [ADR 0020](decisions/0020-painted-powerup-icons-and-storni.md)
- The bottle is now "Storni" (the user's name for it): 1.7 × bigger, glossy brown glass, crown cap, painted label. It lies beside the foot where you can see it. Intro clips re-rendered for both figures.
- New tool `tools/cut-icons.py`; prompts in `assets/src/prompts.md`.
- Codex worked on the environment in the main checkout at the same time, so this was built in a separate worktree on branch `icons`.
- Requested by: the user. Built by: Opus 5.5.

## 2026-10-14 (late morning): Kalle and Tine in the game
- Start screen with figure cards (breathing sprites), choice remembered. Intro: stand, turn, trip over the Sterni, roll; a tap skips. Roll frames follow the spin, helmet clip, dazed clip with stars at game over. Retry skips the intro; "Figur wechseln" returns to the start. → [ADR 0019](decisions/0019-figure-select-and-intro.md)
- The painted kid (`js/player.js`) is gone. New: `js/figure-select.js`, `js/render-player.js`, `tests/figure.test.js`.
- The idle clip now shows the bottle lying there, so it doesn't pop in at the turn.
- Way of working, as the user asked: Opus 5.5 planned and split the work; four Haiku 5.5 subagents wrote the modules in parallel (no shared files); a Sonnet 5.5 code review found a keyboard focus bug, a stale world after changing the figure, missing load feedback, decode hitches and a short-screen overflow; two Haiku agents fixed them. Opus checked the flow in headless Chrome at 390×844 and 375×667 and placed the standing clips on the ball's ground spot. Frame times in headless Chrome at 4x CPU throttling: steady 16.7 ms (60 fps); at 6x single spikes.
- Requested by: the user. Built by: Opus 5.5 with Haiku 5.5 and Sonnet 5.5 subagents.

## 2026-10-14 (morning): Figure sprites rendered in the original look
- The user picked look B: the models' own materials (PBR), no toon outline. Opus rendered all clips for both figures (`LOOK=pbr`) and packed them: 14 WebP sheets, ~1.1 MB in total, ~0.55 MB per figure.
- Fix: the roll clips moved the root after the pose without re-skinning, so the body orbited the ball centre and the helmet floated off the head. `render.py` now re-skins after moving the root.
- Not yet wired into the game. Requested by: the user. Built by: main session (Opus 5.5).

## 2026-10-14 (night/morning): Figures as rigged 3D models
- The user asked how to get 3D models without paying for Tripo. Opus first built both figures by script in Blender (`tools/blender/toon.py` kit: lofted parts, toon shader, outline, pivot-empty rig) and checked them against the model sheets with a 50 % overlay (`tools/blender/compare.py`). The user was not satisfied with the look.
- The user then built new models of Kalle and Tine with Codex and Blender via blender-mcp and handed them over. Opus decimated them (`tools/blender/prep-glb.py`), rigged them by script without an armature (`tools/blender/skinned.py`), and rendered test poses from the game camera in two looks (toon with outline, original PBR). → [ADR 0018](decisions/0018-rigged-figures-to-sprites.md)
- Render pipeline ready but not yet run on the new models: `tools/blender/render.py` (clips select, idle, turn, trip over a "Sterni" bottle — the user's choice —, roll, roll with helmet, dazed; auto framing with a ball-centre anchor) and `tools/build-sprites.py` (WebP sheets, `js/figure-sheets.js`).
- Style samples A and B saved to `assets/src/`. The TRELLIS proof of concept `tools/blender/kalle-poc.py` was removed.
- Work is on branch `grafik`, not merged, nothing live.
- Requested by: the user. Built by: main session (Opus 5.5).

## 2026-10-14: Image generation set up, style samples
- `tools/gen-image.js` generates images through OpenRouter; `tools/serve.js` replaces the throwaway local server. → [ADR 0013](decisions/0013-ai-image-generation-via-openrouter.md)
- Three style samples of the same scene (low-poly, painted, flat vector) made with Nano Banana 2 for the user to choose from.
- New rule from the user: the game must stay fast on most phones and ready for iOS/Android apps. Written into engineering-principles.md.
- The user picked the painted style B, with cherry blossoms in spring from A. → [ADR 0014](decisions/0014-painted-art-style.md), [art-bible.md](art-bible.md)
- Three concepts for a new rolling figure (raincoat, hoodie, tracksuit) were made with Nano Banana 2.
- The user asked for "Berliner Atzen". Techno-Tine and Kalle vom Kiez were drafted, then made again with Nano Banana 2.1 directly from Google with the user's new key. → [ADR 0015](decisions/0015-nano-banana-direct-from-google.md)
- The user decided: both figures playable, picked at the start; animated with frame sheets. First sheet test for Kalle with Nano Banana 2.1.
- Animation pipeline: the AI draws 8 key poses in one sheet, then in-betweens frame by frame (two neighbours as references): 8 → 16 → 32 roll frames per figure. Plus a 16-frame stumble from standing into the roll (the user's idea for the start) and 12-frame crash sheets. `tools/gen-image.js` got `--aspect` and `--size` (Google only).
- The user found the AI frame animations too choppy and switched to Blender. Proof of concept `tools/blender/kalle-poc.py`: Kalle built from primitives with pivot joints, toon shader and outline, poses stand → trip → flail → tuck → ball, rendered as a 24-frame fall and a 32-frame roll (rolling is a pure rotation, so any frame count is smooth).
- Character pipeline agreed (ADR 0016). Model sheets for Tine and Kalle (4 views each) made and stored in `assets/src/characters/`.
- Tripo turned out to be blocked: the API wallet is empty, and the free web plan has no Multi-View and no export. The user generated Kalle on the free plan but could not export.
- Switched to TRELLIS.2 on Microsoft's free Hugging Face Space (ADR 0017): Kalle as a textured GLB in 49 s, stored as `assets/src/characters/kalle.glb`. Tools: `tools/gen-3d.py`, `tools/blender/view-glb.py`.
- Requested by: the user. Built by: main session (Opus 5.5).

## 2026-10-13: Docs and principles
- Added `.docs/` (this folder), ADRs 0001–0012 and the engineering principles (KISS, YAGNI, small modules).
- Requested by: the user. Built by: main session.

## 2026-10-13: Colored power-ups, stackable helmets (`54f0ed7`)
- User feedback: after the graphics update all pickups looked yellow and you couldn't tell them apart.
- Each power-up got its own color and a drawn symbol: helmet red, slow-mo blue, wider gaps green. The bubbles are 30% larger and the HUD chips match.
- Helmets stack as extra lives up to 3. The HUD shows one icon per helmet. → [ADR 0011](decisions/0011-powerup-colors-and-helmet-stacking.md)
- Built by: main session.

## 2026-10-12/13: Graphics polish (`3bd4d3d`, merge `23ed99d`, `bedeccd`)
- 3D gabion blocks with top and side faces, roadside trees and bushes per season, a horizon tree line, season light, a new kid sprite with squash and stretch, speed lines, debris and pickup effects.
- Review fixes: the kid is painted once and rotated, the color grade is half resolution and primed, fewer per-frame allocations, CSS scoped, render code split into `render.js`, `render-fx.js`, `render-slip.js` and `view.js`. The path now stands out clearly from the grass in autumn.
- Built by: agent on Opus (xhigh effort). Reviewed by: Sonnet 5.5 code reviewer. Merge conflicts resolved by: main session. → [ADR 0009](decisions/0009-graphics-paint-once.md)

## 2026-10-12: Ground surfaces (`c2de58c`, `151c075`, merge `c4e3a8f`)
- From player idea issue #2 (Hendrik). Dirt, gravel (bumpy, random kicks) and grass (×0.9 speed) in stretches of 120–220 units. Textures are procedural per season, with mip levels, drawn one strip per screen row.
- Review fixes: frame-rate independent kicks, texture wrap/flip/mip bugs, fewer banners, lazy tile building.
- Built by: Sonnet 5.5 agent. Reviewed by: Sonnet 5.5. → [ADR 0007](decisions/0007-ground-surfaces-as-tiles.md)

## 2026-10-12: Visible slipperiness (`e19cc89`, `4ae75a2`, merge `3fc4e54`)
- From issue #2. Ice sheen on the path in winter, skid marks, snow and water spray, the kid leans into slides, wetter puddles, a "Rutschig!" banner.
- Review fixes: sheen clipped to the path, no stray line between slides, cached gradient, ctx state restored.
- Built by: Sonnet 5.5 agent. Reviewed by: Sonnet 5.5. → [ADR 0008](decisions/0008-slip-visuals-as-layer.md)

## 2026-10-12: Leaderboard and worker hardening (`5af66c4`, `db264c6`, merge `d64efa0`, `2f92cc0`)
- Shared top 20 in Workers KV, one entry per name, submit after game over, view from the start screen.
- Worker hardening from the security scan: JSON only, 4 KB limit, a daily idea cap, no localhost in production, preflight caching.
- Built by: Sonnet 5.5 agent. Reviewed by: Sonnet 5.5. KV namespace created and worker deployed by: main session, with user approval. → [ADR 0006](decisions/0006-leaderboard-on-kv.md)

## 2026-10-12: Security scan and fixes (`e62360d`)
- The scan found no critical or high issues. It found two medium ones: markdown injection in issues, and weak spam limits.
- Fixed: idea text goes into a code block, names lose markdown and URLs, the season must be one of the four, scores are capped, the banner uses `textContent`, plus a CSP and no-referrer meta tag.
- Scan by: Sonnet 5.5 security reviewer. Fixes by: main session. → [ADR 0005](decisions/0005-security-baseline.md)

## 2026-10-12: Parallel agent workflow
- The user asked for five agents in separate worktrees, each with a code reviewer. → [ADR 0010](decisions/0010-parallel-agents-with-review.md)

## 2026-10-11/12: Idea button (`ee1d83c`, `e217f0a`, `896820b`)
- 💡 button with a bottom sheet. A Cloudflare Worker files ideas as GitHub issues labeled `idee`.
- Getting it running took several steps: wrangler login, then email verification, then a token missing `Issues: write`.
- Mistake: the wrangler cache file (Cloudflare account id and account name with email) was committed and removed in the next commit. It is still in the history (`e217f0a`). The user accepted the risk; the file holds no secret.
- Built by: main session. Hosting chosen by: the user. → [ADR 0004](decisions/0004-ideas-via-cloudflare-worker.md)

## 2026-10-11: First playable version (`cdd2f4f`)
- Built from the user's photo of the hill path with gabion walls (`IMG_0797.HEIC`, not in git).
- Pseudo-3D canvas game: walls come toward the player, swipe to steer, 3 power-ups, rising speed, 4 seasons with their own mechanics, highscore in `localStorage`.
- Deployed to GitHub Pages. The user chose that host.
- Built by: main session. → [ADR 0001](decisions/0001-static-site-no-build.md), [0002](decisions/0002-canvas-pseudo-3d-from-photo.md), [0003](decisions/0003-github-pages-hosting.md)
