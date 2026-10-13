# 0006: Shared leaderboard in one Workers KV key

- **Status:** Accepted
- **Date:** 2026-10-12
- **Decided by:** the user asked for "everyone can enter, everyone can view"; storage chosen by Claude Opus 5.5 in the agent brief; the user approved creating the KV namespace
- **Built by:** Sonnet 5.5 agent; reviewed by Sonnet 5.5; deployed by Claude Opus 5.5
- **Commits:** `5af66c4`, `db264c6`, `2f92cc0`

## Context
Friends want to compare scores. We already run one worker.

## Decision
The existing worker gets `GET /leaderboard` and `POST /scores`. Storage is one KV key `top` holding the top 20 as JSON. There is one entry per name (case-insensitive, NFC), and only a better score replaces it.

## Alternatives
- D1 (SQLite): more power than 20 rows need.
- Durable Objects: no lost updates, but more code and concepts.
- A second service (Supabase, Firebase): another account; free tiers pause.

## Consequences
- Tiny and free.
- Scores come from the client and can be faked. Accepted among friends.
- Writes are read-modify-write. Two submits within KV's ~60 s consistency window can drop one. The client keeps its own fresh result to hide the lag.
