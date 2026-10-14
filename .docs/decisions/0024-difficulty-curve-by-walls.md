# 0024: Difficulty curve by walls, tuned with a balance sim

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decided by:** user (too fast, testers stuck around wall 50, make it fairer and more gripping; testers: "ab 50/60 komplett Luck", "Schotter und Pfütze ist deadly"); Opus 5.5 (diagnosis, curve, numbers)
- **Built by:** Opus 5.5 planned, wrote the sim and integrated; Haiku 5.5 subagents wrote the curve and the main.js wiring; Sonnet 5.5 reviewed and wrote the review fixes
- **Commits:** see history.md, 2026-10-14

## Context
Testers reported that the game gets far too fast and that they cannot get past about 50 walls. The old curve:
- speed rose with seconds played, 16 → 40 units/s (26 → 64 km/h), and never stopped rising;
- the gap width (3.2 → 1.9) and the wall spacing (18 → 10) shrank linearly with the wall count;
- so the time from one wall to the next fell from 1.1 s to 0.6 s by wall 50, and below 0.4 s later;
- autumn (walls 40–59) adds gusts of force 260–300. With the steering spring (320), that pushes the ball about 0.9 units sideways, while the gap leaves only ±0.5;
- winter ice (spring 45, damping 4.5) swings back and forth instead of settling;
- gravel knocks the ball sideways at random every 0.1–0.3 s. On a puddle or ice those knocks are hardly damped.

To see which of these matters, `tools/balance-sim.js` lets a bot play hundreds of runs with the game's own rules and steering physics. The bot drags like a person: Fitts' law for the swipe, 0.22 s feedback delay, rare sloppy swipes, more noise at higher speed. It was tuned until it got stuck on the old curve the way the testers did: median 48 walls, 70 % of all crashes in autumn, crash chance per wall jumping from 0.3 % to 5 % at wall 40. Without wind the same bot reached a median of 66; with the old ice and no wind, winter became the next cliff (3–4 % per wall).

## Decision
- **Everything depends on the wall count, not on seconds.** Speed follows the walls passed and eases up smoothly between walls.
- **Eased curves with floors:** speed 16 → 28 (max ~45 km/h, summer ~50), time between walls 1.2 → 0.65 s, gap 3.2 → 1.95. The spacing is derived from time × speed, so walls never come quicker than a person can react, however fast it looks. After the first year (80 walls), gaps and intervals keep tightening slowly (floors 1.8 and 0.45 s), so long runs still end.
- **Sideways jump of the gap** shrinks with the interval (5 → 3 units).
- **Breather after each season change:** the first five walls of a season are wider and further apart.
- **Wind:** force 116 → 132 (pushes 0.36–0.41 units). It builds up over the first walls of autumn, and each gust is announced 0.7 s ahead: the wind arrow blinks and the leaves drift before the push. The gust logic is one tested function (`stepWind` in `logic.js`) used by the game and the sim.
- **Ice:** spring 70, damping 8. It still slides, but settles.
- **Gravel:** lighter knocks (0.8–1.6 instead of 1.2–2.4), and only 30 % of that on a puddle or ice, so the two random hazards no longer stack.
- **Speed cues** (speed lines, blur) are rescaled to the new top speed, so the game still looks fast.
- Summer keeps its 15 % extra speed on top of the curve; there the walls come 15 % quicker. That is summer's challenge.
- The curve lives in `js/logic.js` (pure, tested), the steering constants in `js/config.js`. A test checks that no step from one wall to the next is a cliff.

Sim results (600 runs, same bot):

| | Median | 90 % | Mean run | Crashes in autumn |
|---|---|---|---|---|
| Old curve | 48 | 72 | 45 s | 70 % |
| New curve | 105 | 151 | 95 s | 33 % |

The crash chance per wall now rises slowly: 0.2–0.3 % up to wall 40, about 1 % in the first autumn and winter, 1–2 % at walls 80–120, 3–4 % in the second year. (The sim now includes the path surfaces and the gravel knocks.)

## Alternatives
- Only weakening the wind: removes the cliff at 40, but the interval still drops below 0.5 s and winter becomes the next cliff.
- Tuning by hand in the browser: slow, and one player's runs say little. The sim gives the shape of the curve in a second; real phones still decide the final numbers.
- Dynamic difficulty (easing off after many crashes): hidden, can feel unfair once noticed, and makes scores less comparable on the leaderboard.

## Consequences
- Scores will rise; old leaderboard entries were made on the harder curve.
- The sim shares the curve, the wind and the constants with the game but has its own copy of the spring step. Change both together, then run `bun tools/balance-sim.js`.
- The bot does not use the wind warning and runs at a steady 60 fps, so real players should do a bit better in autumn.
- The bot is a model. Playtests on real phones decide the final numbers; tune the constants in `js/logic.js`.
