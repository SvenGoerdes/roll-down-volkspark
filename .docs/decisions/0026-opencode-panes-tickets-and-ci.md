# 0026: OpenCode panes in herdr, GitHub tickets and CI

- **Status:** Accepted (extends ADR 0010)
- **Date:** 2026-10-14
- **Decided by:** the user (OpenCode panes run by Claude, tickets, worktrees, CI/CD from now on, sub-agents Luna for code and Sol medium for review); Opus 5.5 (GitHub Issues, CI shape, permission list)
- **Built by:** Opus 5.5 (main session)
- **Commits:** see history.md, 2026-10-14 (night)

## Context
The user collected a long list of features (a third figure, new themes, a party edition, syringes to dodge, passkey profiles, polish). They run OpenCode (GPT-6.1 Sol) in herdr panes and want Claude to plan, hand out and track the work. Until now nothing checked a push to `main`, and `main` is live within a minute.

## Decision
- **Tickets:** one GitHub issue per epic, sub-issues for the steps. PRs close their sub-issue (`Closes #N`).
- **Orchestration:** the main session (Claude) splits the epics, opens OpenCode panes in herdr (`herdr agent start/prompt/read`), one worktree and branch per epic under `.claude/worktrees/`, and reviews the result.
- **Sub-agents in OpenCode** (`opencode.jsonc`): `coder` on GPT-6 Luna writes code for small tasks, `reviewer` on GPT-6.1 Sol with medium effort reviews diffs. The pane itself runs Sol on high.
- **Permissions** (`opencode.jsonc`): git, gh, bun, python3, blender and read commands run without asking; force pushes, hard resets and `gh api` ask; `gh pr merge` is denied.
- **CI:** GitHub Actions runs `bun test tests` on every PR and push to `main`. `main` only takes PRs with green CI. Pages still deploys from `main`.
- **Merges** to `main` need the user's OK, since `main` is live.
- **Art:** every generated image or Blender render is shown to the user before it goes into the game.

## Alternatives
- Linear: a nicer board, but the in-game idea button already writes to GitHub Issues, and PRs close GitHub issues on their own.
- Deploy Pages from an Actions workflow after the tests: stricter, but the branch rule already keeps red code off `main`, so KISS.
- Approve every OpenCode command by hand: safe, but the panes would stall all the time.

## Consequences
- Several agents touch `main.js`, `config.js` and `render.js`; merge conflicts stay likely (see ADR 0010). Split `main.js` before the big features land.
- No direct pushes to `main` anymore, also for docs.
