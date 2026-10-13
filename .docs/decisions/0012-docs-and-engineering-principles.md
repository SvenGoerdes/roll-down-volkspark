# 0012: Docs in `.docs`, decisions as ADRs, KISS as the default

- **Status:** Accepted
- **Date:** 2026-10-13
- **Decided by:** the user
- **Built by:** Claude Opus 5.5 (main session)
- **Commits:** the commit that adds `.docs/`

## Context
The project grew fast through many sessions and agents. Reasons and states would get lost.

## Decision
`.docs/` holds:
- architecture, operations, principles, history and backlog;
- one ADR per real decision, naming who decided (user or model) and the commits.

Docs change in the same commit as the code. We work by KISS and YAGNI, keep modules small and test pure logic. See [engineering-principles.md](../engineering-principles.md).

## Consequences
- Any session can rebuild the context from `.docs` and `git log`.
- Every change takes a few extra minutes for its docs.
