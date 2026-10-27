# Project docs

Roll Down Volkspark is a browser game for phones. A kid tumbles down the hill in Volkspark Friedrichshain (Berlin) and has to roll through the gaps in gabion walls. Live at https://svengoerdes.github.io/roll-down-volkspark/.

## Aktueller Wiedereinstieg: 25. Oktober 2026

**Staging vom 27. Oktober:** [Private Testumgebung](staging.md) auf Branch `staging`, getrennt von Produktion. Technisch gehostet, aber bis zur persönlichen Access-Aktivierung und Loginprüfung geschlossen; automatische Deployments sind noch ausgeschaltet.

Review vom **26. Oktober**: [Brücke, folgende Kamera und Spritzenentwurf](playability-review-2026-10-26.md) im gemeinsamen Prüfbranch, mit drei getrennten Sol-High-Umsetzungen. Die Spritzenoptik wartet auf Sichtfreigabe; dieser Stand ist noch kein Produktionsrollout.

Für die Fortsetzung in einer neuen Session zuerst [handoff.md](handoff.md) lesen. Dort stehen die aktuellen Nutzerentscheidungen, lokalen Blender-/Bildquellen, Worktree-Vorarbeiten und die [elf Tickets](plans/art-integration-2026-10-18/README.md). Die neuen Grafik-/Feinschliff-Features und das Performance-Werkzeug sind in `main` übernommen (PRs #87, #89–#97). PR #98 dokumentiert den Merge-Abschluss. Turnstile ist im Code vorbereitet, aber ohne Sitekey/Secret weiterhin nicht aktiviert; es gab keinen Worker-Deploy.

| File | What's in it |
|---|---|
| [handoff.md](handoff.md) | Current handoff: decisions, assets, worktrees and next steps |
| [plans/art-integration-2026-10-18/](plans/art-integration-2026-10-18/README.md) | Eleven ticket drafts, approved and published on GitHub (#28, #47, #24, #20, #71–#77) |
| [art-review-sources-2026-10-18.md](art-review-sources-2026-10-18.md) | Local gallery, actual Blender sources, references and renders |
| [syringe-obstacles.md](syringe-obstacles.md) | Local syringe obstacle draft, safety rules, art review fixtures and balance |
| [architecture.md](architecture.md) | How the game and the worker are built today |
| [art-bible.md](art-bible.md) | The art style and rules for making game art |
| [operations.md](operations.md) | Run, test, deploy, secrets, infrastructure IDs |
| [engineering-principles.md](engineering-principles.md) | How we work: KISS, tests, reviews, commits |
| [history.md](history.md) | Timeline: what changed when, by whom, which commits |
| [backlog.md](backlog.md) | Open work, known weak spots, tech debt |
| [decisions/](decisions/) | One file per decision (ADR), numbered |

## Reading old states

Every entry in `history.md` and every ADR names its commits. To see the project as it was:

```sh
git log --oneline                 # all commits, newest first
git show <hash> --stat            # what one commit touched
git checkout <hash>               # look around (git switch main to return)
git log -- .docs/decisions        # when decisions were added or changed
```

## Keeping the docs alive

Update the docs in the same commit as the change they describe:

- New feature or behaviour change → `history.md` entry and, if needed, `architecture.md`.
- A choice between real alternatives (tech, hosting, data model, trade-off) → new ADR in `decisions/`. Copy [decisions/TEMPLATE.md](decisions/TEMPLATE.md).
- Never rewrite an old ADR's decision. If it changes, write a new ADR and mark the old one `Superseded by NNNN`.
- New debt or known bug → `backlog.md`. Remove it there when it's fixed.
- Always record who decided (the user, or which model) and who implemented it.
