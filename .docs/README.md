# Project docs

Roll Down Volkspark is a browser game for phones. A kid tumbles down the hill in Volkspark Friedrichshain (Berlin) and has to roll through the gaps in gabion walls. Live at https://svengoerdes.github.io/roll-down-volkspark/.

| File | What's in it |
|---|---|
| [architecture.md](architecture.md) | How the game and the worker are built today |
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
