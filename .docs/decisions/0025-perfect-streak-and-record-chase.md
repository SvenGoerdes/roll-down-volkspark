# 0025: Perfect passes, streak helmet and the record chase

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decided by:** user (the game must grip and make you want one more run); Opus 5.5 (which hooks, rules, numbers)
- **Built by:** Opus 5.5 planned and integrated; Haiku 5.5 subagent wrote `js/scoring.js`; Sonnet 5.5 subagent wrote the UI; Sonnet 5.5 reviewed (nothing serious; small fixes by Opus 5.5)
- **Commits:** see history.md, 2026-10-14

## Context
ADR 0024 makes the curve fair. Fair alone does not pull you back for another run. The user asked for gameplay that grips. Endless runners that do this give quick praise for skill, a goal just ahead, and a near miss of your record that stings ("only 3 more"). The score itself must stay "walls passed", because the leaderboard compares it.

## Decision
- **"Perfekt"** when the ball passes within 0.25 units of the gap centre, **"Knapp!"** when it passes with at most 0.12 units to spare (small shake, short buzz). A short word pops up over the ball; nothing on a plain pass.
- **Streak:** six perfect passes in a row give a free helmet (up to the usual 3). Pips under the score count the perfect passes; the sixth gives the helmet and starts the count over. Any other pass, or a crash a helmet absorbs, empties them. This turns precision, the very skill that keeps you alive, into a reward you can see coming.
- **Record chase:** the wall that would beat your record carries a small "Rekord" sign, so you see it coming from far away. Passing it shows "Neuer Rekord!" once per run.
- **Season progress:** a thin bar on the season chip fills over the season's 20 walls.
- **Game over:** "Neuer Rekord!" or "Noch N Mauern bis zum Rekord".
- Rules in `js/scoring.js` (pure, tested); the sign in `js/render-record.js`; the rest is DOM and CSS, no new canvas work per frame except the one sign.

## Alternatives
- **Points with a combo multiplier instead of walls:** more arcade, but old and new scores would no longer compare, and the leaderboard would need a migration. Walls stay the score.
- **Streak as a meter that only a crash empties:** easier to fill, but no tension in the run itself; "don't break it now" is the hook.
- **Near-miss slow motion:** strong in console games, but on phones a sudden time change can feel like a dropped frame.

## Consequences
- In the balance sim (600 runs) the bot gets "Perfekt" on about 64 % of the walls; with the streak helmet its median goes from 105 to about 128 walls (`bun tools/balance-sim.js --no-streak` to compare). People are less precise than the bot, so the real effect is smaller. If playtests show it is too easy, raise `STREAK_NEED` to 8 or narrow `PERFECT`.
- The record sign needs the record before the run starts; it is read once per run from `localStorage`.
