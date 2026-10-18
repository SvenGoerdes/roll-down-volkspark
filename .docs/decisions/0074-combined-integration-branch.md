# 0074: Sammel-Branch für die Gesamtprüfung

- **Status:** Implemented; wartet auf Nutzerfreigabe
- **Date:** 2026-10-18
- **Decided by:** Nutzer (Ticket #76, Auftrag im Nachtmodus); Ablauf Claude Sonnet 5.5
- **Built by:** Claude Sonnet 5.5
- **Commits:** Merge-Commits und Fix-Commits auf `feat/gesamtpruefung` (PR „Closes #76“)

## Decision

`feat/gesamtpruefung` startet auf `origin/feat/oberbaum` (#87) und führt per `git merge --no-ff` `feat/volkspark-bauwerke` (#89), `feat/reichstag` (#92) und `feat/rotes-rathaus` (#91) zusammen. Der PR enthält alle vier. Entweder diesen PR allein mergen oder die Einzel-PRs der Reihe nach. Konflikte: `TOUR_LANDMARKS`, `PLANT_BEHIND_LANDMARKS`, Ladecode in `main.js`, `render-scene.js`, `history.md` und ADR-Index; alle Einträge bleiben. Die Prüfskripte (`perf-check.mjs` aus PR #90) bleiben außerhalb des Commits.
