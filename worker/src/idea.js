export const LIMITS = { text: [5, 1000], name: 40, score: 100_000 };
const SEASONS = ['Frühling', 'Sommer', 'Herbst', 'Winter'];

// Checks and cleans a submitted idea. Returns { idea } or { error }.
export function parseIdea(body) {
  if (!body || typeof body !== 'object') return { error: 'Ungültige Anfrage' };
  if (body.website) return { error: 'spam' }; // honeypot field, invisible to people
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const [min, max] = LIMITS.text;
  if (text.length < min) return { error: 'Idee ist zu kurz' };
  if (text.length > max) return { error: `Maximal ${max} Zeichen` };
  const name = typeof body.name === 'string' ? plain(body.name).slice(0, LIMITS.name) : '';
  const score = Number.isFinite(body.score) ? Math.min(LIMITS.score, Math.max(0, Math.floor(body.score))) : null;
  const season = SEASONS.includes(body.season) ? body.season : '';
  return { idea: { text, name, score, season } };
}

// Stops @mentions and #references from pinging people or linking issues.
const defuse = (s) => s.replace(/([@#])(\w)/g, '$1​$2');

// One line without markdown syntax, so names can't add links, images or headings.
const plain = (s) => s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[[\]()<>`!*_|~\\]/g, '').replace(/\s+/g, ' ').replace(/:\/\//g, ':/\u200b/').trim();

// Code block that always outlasts any backtick run inside, so nothing in the text renders.
function fence(text) {
  const longest = Math.max(0, ...(text.match(/`+/g) || []).map((m) => m.length));
  const ticks = '`'.repeat(Math.max(3, longest + 1));
  return `${ticks}text\n${text}\n${ticks}`;
}

export function toIssue(idea) {
  const firstLine = idea.text.split('\n')[0];
  const title = firstLine.length > 70 ? `${firstLine.slice(0, 67)}…` : firstLine;
  const meta = [
    idea.name && `**Von:** ${defuse(plain(idea.name))}`,
    idea.score !== null && `**Letzte Runde:** ${idea.score} Mauern`,
    idea.season && `**Jahreszeit:** ${idea.season}`,
  ].filter(Boolean);
  const body = [fence(idea.text), '', '---', ...meta, '_Eingereicht über den Ideen-Button im Spiel._'].join('\n');
  return { title: `💡 ${defuse(title)}`, body, labels: ['idee'] };
}
