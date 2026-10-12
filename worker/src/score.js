export const LIMITS = { name: 20, score: 10000, season: 20, top: 20 };

// Scores are reported by the browser and can be faked by anyone who opens the dev tools.
// That is fine for a friends' leaderboard, so we only check the range, not the run itself.
export function parseScore(body) {
  if (!body || typeof body !== 'object') return { error: 'Ungültige Anfrage' };
  const name = typeof body.name === 'string' ? body.name.normalize('NFC').replace(/\p{C}/gu, '').replace(/\s+/g, ' ').trim() : '';
  if (!name) return { error: 'Bitte gib einen Namen ein' };
  if ([...name].length > LIMITS.name) return { error: `Name: maximal ${LIMITS.name} Zeichen` };
  if (!Number.isInteger(body.score) || body.score < 0 || body.score > LIMITS.score) return { error: 'Ungültiger Punktestand' };
  const season = typeof body.season === 'string' ? body.season.replace(/\p{C}/gu, '').slice(0, LIMITS.season) : '';
  return { entry: { name, score: body.score, season } };
}

const sameName = (a, b) => a.name.toLowerCase() === b.name.toLowerCase();

// One entry per name (case-insensitive): a new entry only replaces a lower score.
// Returns the new top list and a status: 'added', 'exists' (name already has this score or more)
// or 'too_low' (not good enough for the top list). Does not mutate `list`.
export function addScore(list, entry, at, top = LIMITS.top) {
  const old = list.find((e) => sameName(e, entry));
  if (old && old.score >= entry.score) return { list, status: 'exists' };
  const next = [...list.filter((e) => !sameName(e, entry)), { ...entry, at }]
    .sort((a, b) => b.score - a.score || a.at - b.at)
    .slice(0, top);
  return next.some((e) => sameName(e, entry)) ? { list: next, status: 'added' } : { list, status: 'too_low' };
}

// Sliding-window limiter per key; state lives in the given Map (per isolate, enough to slow down spam).
export function limited(hits, key, max, now = Date.now(), windowMs = 3600_000) {
  if (hits.size > 500) { // drop idle keys so the map cannot grow without bound
    for (const [k, ts] of hits) if (!ts.some((t) => t > now - windowMs)) hits.delete(k);
  }
  const recent = (hits.get(key) || []).filter((t) => t > now - windowMs);
  if (recent.length >= max) return true;
  hits.set(key, [...recent, now]);
  return false;
}
