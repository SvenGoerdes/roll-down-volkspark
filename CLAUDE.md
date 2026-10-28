# Roll Down Volkspark – notes for Claude

Read `.docs/README.md` first. It indexes architecture, operations, principles, history, backlog and decisions.

- Work by `.docs/engineering-principles.md`: KISS, YAGNI, small modules, pure logic tested.
- Update `.docs` in the same commit as the change: a `history.md` entry, an ADR for real decisions (who decided, which model built it, commits), and `backlog.md` for debt.
- `bun test tests` must pass before committing. Check visuals at phone size in a real browser. Serve with bun, not `python3 -m http.server`.
- Deploy the worker before pushing frontend code that needs it. Never put secrets in the repo.
- UI text is German and English (`js/i18n.js`).
