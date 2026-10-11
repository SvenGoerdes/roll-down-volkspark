export const LIMITS = { text: [5, 1000], name: 40 };

// Checks and cleans a submitted idea. Returns { idea } or { error }.
export function parseIdea(body) {
  if (!body || typeof body !== 'object') return { error: 'Ungültige Anfrage' };
  if (body.website) return { error: 'spam' }; // honeypot field, invisible to people
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const [min, max] = LIMITS.text;
  if (text.length < min) return { error: 'Idee ist zu kurz' };
  if (text.length > max) return { error: `Maximal ${max} Zeichen` };
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, LIMITS.name) : '';
  const score = Number.isFinite(body.score) ? Math.max(0, Math.floor(body.score)) : null;
  const season = typeof body.season === 'string' ? body.season.slice(0, 20) : '';
  return { idea: { text, name, score, season } };
}

// Stops @mentions and #references from pinging people or linking issues.
const defuse = (s) => s.replace(/([@#])(\w)/g, '$1​$2');

export function toIssue(idea) {
  const firstLine = idea.text.split('\n')[0];
  const title = firstLine.length > 70 ? `${firstLine.slice(0, 67)}…` : firstLine;
  const meta = [
    idea.name && `**Von:** ${defuse(idea.name)}`,
    idea.score !== null && `**Letzte Runde:** ${idea.score} Mauern`,
    idea.season && `**Jahreszeit:** ${defuse(idea.season)}`,
  ].filter(Boolean);
  const body = [defuse(idea.text), '', '---', ...meta, '_Eingereicht über den Ideen-Button im Spiel._'].join('\n');
  return { title: `💡 ${defuse(title)}`, body, labels: ['idee'] };
}
