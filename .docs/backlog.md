# Backlog

Open work and known weak spots. Remove an entry in the commit that fixes it.

## Aktueller Integrationsplan (18. Oktober 2026)
- [Session-Übergabe](handoff.md) und [elf konkrete Ticket-Entwürfe](plans/art-integration-2026-10-18/README.md) sind der aktuelle Plan. Die älteren Grafikabschnitte unten liefern historischen Kontext, nicht die Freigabe für einen Rückbau des neuen Looks.
- Offene Integration: fünf detaillierte Gebäude mit dynamisch versetzten Durchfahrten; scrollender neuer Boden; bestätigte Storni-Flasche mit gemeinsamem Intro; neuer Alaska-Körper mit Rig/Animation; vollständige Spiel-/Sicht-/Performanceprüfung ohne veränderte Schwierigkeit. Der Fernsehturm ist gestrichen (#47 geschlossen).
- Tickets auf GitHub: #28, #71–#74, #75, #24, #20, #76; #77 geparkt.
- Lokale Art-Dateien und uncommittete Worktree-Arbeit sind noch keine integrierten Laufzeit-Assets. `.claude/` nicht bereinigen, bevor benötigte Quellen gesichert bzw. gezielt übernommen sind.
- **Später, nicht in dieser Grafikarbeit:** ungeprüfte Bestenlisten-Schreibzugriffe absichern. Turnstile mit serverseitiger Prüfung ist ein noch nicht freigegebener Vorschlag. Anti-Bot-Tokens allein validieren keine erspielten Scores; weitergehende Laufprüfung ist nicht beauftragt. Siehe [Ticket 11](plans/art-integration-2026-10-18/11-bestenliste-token.md).


## Open questions for the user
- Close issue #2 (Hendrik: slippery look, different ground)? Both parts shipped on 2026-10-12.

## Next up: graphics overhaul (started 2026-10-14)
- The user finds the current look "trashy" and wants real graphics.
- Plan: Nano Banana (Gemini image API) for backgrounds, scenery, icons and the app icon; Blender run headless with scripts in the repo for the kid (rotation frames), walls and pickups. Assets as WebP; the paint-once architecture stays.
- First step: 2–3 style samples of the same scene (low-poly Blender, painted after the photo, flat vector). The user picks one, then we write `.docs/art-bible.md` and an ADR.
- Tools are ready: OpenRouter key and Blender 5.2 (ADR 0013). Style B chosen (ADR 0014). Figures: Techno-Tine and Kalle vom Kiez. The user wants both, chosen on the start screen, and wants real animation (roll cycle, crash). Draft animations exist for both: 16-frame stumble into the roll at the start, 32-frame roll loop, 12-frame crash. Raw frames live in the session scratchpad only; final assets must be rebuilt into `assets/` with a repo script (cut, key out magenta, align, WebP atlas). Pipeline in ADR 0016. Model sheets done. Kalle's 3D model exists (TRELLIS.2, ADR 0017). Its back texture lacks the mustard panels and the sunglasses became clear glasses; fix it in the texture or retry with another seed.
- **Status 2026-10-14, branch `grafik`:** Kalle and Tine are in the game (ADR 0018, 0019): figure select, intro, roll, helmet, dazed. Figures, icons and the calmer start screen are merged; the environment release is tracked by its PR. Real-phone verification remains open.
- Check on a real phone: 60 fps with the sprite sheets, memory (~25 MB decoded per figure), the intro timing.
- **#24, 18.10.:** Bestätigte Hero-Storni und 1,5-s-Intro für Kalle/Tine implementiert; Spielabnahme unter `.claude/review/24/` offen (ADR 0031). Keine Alaska-Integration: der gemeinsame Ablauf mit neuem Alaska-Clip bleibt #20. Alte Freigaberunde 3 unten ist Vorarbeit, nicht der aktuelle Storni-Look.
- **Aktuelles Art-/Speicherbudget #24:** Runtime-WebPs zusammen 2.093.408 Byte (1,996 MiB), kaum Reserve für weitere Art-Branches. Vier gewählte Spielatlanten ca. 26,34/25,31 MiB RGBA für Kalle/Tine, ohne Umgebung/Canvas/Karten. Nach Zusammenführung erneut Gesamtbudget und echten Handy-/Safari-Speicher prüfen; 4×-Desktop-CPU-Test ist kein Gerätetest.
- **Figuren #17/#22, Freigaberunde 3:** Blender-Modelle Alaska/Storni und 1,50-s-Intro für Kalle, Tine, Alaska liegen im Worktree zur Modell-/Renderfreigabe (ADR 0030). Danach Sprite-Export und Spielintegration. Die genaue Rekordschwelle für Alaskas Freischaltung bleibt offen.
- **Art-Budget vor Figurenintegration:** Intro-Atlas-Kandidaten bei Qualität 80 benötigen 237.244 / 200.222 / 207.876 Byte für Kalle/Tine/Alaska, dekodiert je ca. 13–14 MiB. Das überschreitet die ersten Intro-Downloadziele; Ersatz der alten Intro-Sheets, Kompression und das Gesamtbudget mit den anderen Grafik-Branches prüfen. Nur gewählte Figur laden; vor Leistungszusage Handyansicht, Tipp-Skip, Rollübergang und 4×-CPU-Drossel messen. Blockiert durch Modell-/Renderfreigabe.
- **Renn-Animation #64:** folgt nach Freigabe der neuen Modelle/Intros. Der Nutzer verlangt eine wirklich laufende Figur während der Superattacke; Alaska bleibt auf vier Pfoten. Eigene Laufzyklen aus Blender vorlegen und freigeben lassen, danach Runtime-Regeln mit dem zuständigen Gameplay-Agent abstimmen.
- `assets/src/characters/kalle.glb` (TRELLIS) and `tools/gen-3d.py` are superseded; delete when the new figures ship.
- Environment upgrade implemented on `grafik` (ADR 0022): painted seasonal horizons, transparent forest clusters, shaded ground and seasonal gabion faces. Ground/gabion materials and a shared downhill profile refined in ADR 0023. Mobile game-frame screenshots and independent code review checked; real-phone and 4x CPU-throttled performance remain unverified for follow-up. Pickup/start/game-over art remains outside this change. Built-in Imagegen was used; no Gemini/OpenRouter charges for the environment assets.
- **Sightseeing #28 (ADR 0034/0035):** Brandenburger Tor mit variablen Einzel-/Doppellücken, Verbreiterung und Startscreen-Auswahl integriert; echte 390×844-Spielansichten stehen unter `.claude/review/28/` zur Grafikfreigabe vor dem PR. Die weiteren vier Gebäude bleiben #71–#74; nur ihre neuen freigegebenen detaillierten Modelle verwenden, nicht die alten `sightseeing-*.py`-Prototypen. Tore werden ohne Sichtfenster gezeichnet (ADR 0052); je neues Gebäude prüfen, ob die Folgelücke lesbar bleibt. Kein Fernsehturm im Spiel, auch nicht am Rand; #47 ist geschlossen und keine Abhängigkeit.
- Then: scene style samples. Prompts were drafted with the user: spring with Tine and cherry blossoms, summer with Kalle and picnics, autumn wind, winter with snow and sledges, start screen with figure select, game over.
- Also proposed: `.docs/pillars.md` (game pillars), a safe-area check for iOS, and a deny list in `.claude/settings.json`. Ideas taken from donchitos/claude-code-game-studios (MIT); the studio itself is not adopted (KISS).
- Path to iOS: PWA first, then wrap with Capacitor. Write an ADR when it starts.

## Tech debt
- **Historische Sightseeing-Pipeline:** Der alte Freshness-Indikator erfasst nur Python/PNGs, nicht JS-Kamera-/Geländewerte oder Blender-Datei-Hash. Kein Runtime-Build-Cache; alte Bilder nicht als aktuelle Nachweise übernehmen. Die neue Tor-Pipeline führt eigene Quell-/Skript-/PNG-Hashes in `assets/landmarks/provenance.json`; die große Quelle muss lokal vorhanden sein.
- **Gesamtes Bildbudget:** Das bestehende Repository enthält bereits deutlich mehr als die Zielgröße von ~2 MB an Bildern, einschließlich Figuren und Quellbildern. #28 ergänzt nur 80.388 Bytes bedarfsgeladene WebPs (5,42 MiB RGBA). Gesamtbereinigung/bedarfsgerechte Figurenladung nicht unbemerkt in dieses Tor-Ticket ziehen.
- **Mixed versions after a deploy:** GitHub Pages lets browsers cache every file for 10 minutes, so right after a deploy a new `index.html` can meet old CSS or JS (seen 2026-10-14: huge icons, old pickups). A crash is possible when new code imports something an old cached module lacks. Fix idea: a small build step that stamps a version into all file URLs, or a service worker that updates all files together.
- The `icon` emoji fields in `SEASONS` and `SURFACES` (`js/config.js`) are no longer shown. Remove them once Codex's environment work (which edits the same lines) has landed.
- Agent worktrees remain in `.claude/worktrees/` (ignored by git). Some now contain required uncommitted art/logic work; inspect and preserve it per [handoff.md](handoff.md) before any cleanup.
- No browser test scripts in the repo; screenshots now use the desktop app's browser pane with `tools/serve.js`.

- Alaska (#20): Speicherbudget der Runtime-WebPs liegt mit 2,44 MiB über dem 2-MiB-Ziel aus ADR 0031 (Alaska 0,45 MiB). Ziel neu festlegen oder Atlanten kürzen. Leistung unter CPU-Drossel und echte Handys für Alaska nicht geprüft.

## Known limits (accepted)
- **Scores can be faked.** The client reports them; this is the current technical limit documented in ADR 0006. The user now wants later hardening against unchecked direct submissions (plan above). Proposed anti-bot tokens still do not prove an honestly played score.
- **The leaderboard can lose updates** when two people submit within about 60 s (KV read-modify-write, eventual consistency).
- **Per-IP rate limits are per worker isolate**, so they are soft. The daily idea cap in KV is the real backstop.
- The wrangler cache file with the Cloudflare account id is in git history (`e217f0a`). It holds no secret.
- `index.html#debug` exposes `window.rollDown` in production. Harmless: it only gives access to a game you can already play.

## Not yet verified
- **Issue #75, Boden der Berlin-Tour:** Spielbilder beider Themen liegen unter `.claude/review/75/` und warten auf Grafikfreigabe. Danach echter Handy-/iOS-Safari-Test der Berlin-Tour (Speicher: zweiter Kachelsatz ~12 MiB nach Themenwahl). Die frühere Variante (neuer Boden auch im Volkspark) liegt unter `.claude/review/75/alt-v1/`.
- A wall absorbed by a helmet does not count as passed, so `passed` can lag the wall index by up to 3. The season breather and the wind ramp then sit up to 3 walls off the real season start. Old behaviour, minor.
- The new difficulty curve (ADR 0024) comes from a bot simulation. Playtest it on real phones: does the start feel too slow, is year two hard enough, is autumn still the hardest season but no wall?
- Never tested on a real phone (only headless Chrome at iPhone size). Check iOS Safari above all.
- On phones without a GPU canvas, a frame takes about 50–70 ms at 4x CPU throttling, measured in headless Chrome.

## Reminders
- The GitHub token needs an expiry date (e.g. 90 days) plus a calendar reminder to rotate it.
- Keep 2FA on for GitHub and Cloudflare.
- Oberbaumbrücke: die Backstein-Pfeiler zeigen helle Nähte zwischen den Kacheln und wirken wie ein Zaun. Ein eigenes Wandstück im Modell würde das beheben (braucht Freigabe der Modelländerung).
