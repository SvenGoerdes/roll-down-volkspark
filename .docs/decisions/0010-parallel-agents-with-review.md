# 0010: Parallel feature agents in worktrees, each with a code review

- **Status:** Accepted
- **Date:** 2026-10-12
- **Decided by:** the user (five agents, separate worktrees, a reviewer each; Sonnet for most, Opus with extra thinking for graphics)
- **Built by:** Claude Opus 5.5 (orchestration, merges, conflict resolution)
- **Commits:** merges `3fc4e54`, `d64efa0`, `c4e3a8f`, `23ed99d`

## Context
Four features and a security scan at once.

## Decision
- **Agents:** each feature agent works in its own git worktree and branch, with fixed scope boundaries to keep merges small.
- **Review loop:** when an agent is done, a code-reviewer agent checks it. Blocking findings go back to the same agent. Then the main session merges, resolves conflicts, runs all tests and a browser check, and pushes.
- **Off limits for agents:** pushing, deploying, and touching external services.

## Consequences
- Fast, and every review found real bugs.
- Shared files (`main.js`, `render.js`) conflicted on every merge and needed hand resolution.
- An agent's local servers and Chrome profiles could clash: give each its own ports and profile directory.
