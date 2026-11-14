# 0083: GitHub Pages wird per Actions-Workflow ausgeliefert

- **Status:** Accepted
- **Date:** 2026-11-14
- **Decided by:** Nutzer (Pages-Quelle steht in den Repo-Einstellungen auf „GitHub Actions“; Auftrag, `main` live zu bringen)
- **Built by:** Claude Code (Cloud-Session; Modell siehe Commit-Trailer)
- **Commits:** dieser Commit (`ci: deploy GitHub Pages from main via Actions`)

## Context

Bis 4.11.2026 baute GitHub Pages automatisch aus `main` („Deploy from a branch“). Danach löste kein Push auf `main` mehr einen Pages-Build aus (`8ca19ff`, `6dcbec8`): die Pages-Quelle steht auf „GitHub Actions“, im Repo gab es aber keinen Deploy-Workflow. Wann und warum die Einstellung geändert wurde, ist nicht bekannt.

## Decision

`.github/workflows/pages.yml` liefert bei jedem Push auf `main` (und per Hand über „Run workflow“) das Repo-Root als Pages-Artefakt aus, nach grünem `bun test tests`.

**Nachtrag, gleicher Tag:** Die Ursache ist gefunden. PR #106 (Cache-Busting, ADR 0080) sah den Actions-Deploy vor; die Pages-Quelle wurde dafür am 4.11. umgestellt, der PR aber nie gemergt. Er ist jetzt übernommen: der Workflow baut mit `tools/stamp-version.mjs` ein `_site` nur aus Laufzeitdateien mit `?v=<commit>` an allen lokalen URLs. Der Deploy-Job aus dem PR in `ci.yml` entfällt zugunsten von `pages.yml` (ein Deploy-Pfad).

## Alternatives

- **Einstellung zurück auf „Deploy from a branch“:** ein Klick, kein Workflow. Gleichwertig; verworfen nur, weil die Einstellung bereits auf Actions steht und der Workflow zusätzlich Tests vor den Deploy setzt.

## Consequences

- Ein roter Test verhindert den Deploy. Kein Jekyll-Lauf mehr. Seit dem Nachtrag werden nur Laufzeitdateien ausgeliefert (kein `.docs/`, `tests/`, `tools/`, `worker/`).
- Stellt jemand die Quelle wieder auf „Deploy from a branch“, läuft dieser Workflow ins Leere bzw. schlägt fehl und kann gelöscht werden.
