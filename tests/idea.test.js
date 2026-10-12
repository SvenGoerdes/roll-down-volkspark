import { test, expect } from 'bun:test';
import { parseIdea, toIssue } from '../worker/src/idea.js';

test('accepts a normal idea and trims it', () => {
  const { idea } = parseIdea({ text: '  Mehr Powerups!  ', name: ' Kim ', score: 12.7, season: 'Herbst' });
  expect(idea).toEqual({ text: 'Mehr Powerups!', name: 'Kim', score: 12, season: 'Herbst' });
});

test('rejects too short, too long and non-object input', () => {
  expect(parseIdea({ text: 'hi' }).error).toBeTruthy();
  expect(parseIdea({ text: 'x'.repeat(1001) }).error).toBeTruthy();
  expect(parseIdea(null).error).toBeTruthy();
  expect(parseIdea({ text: 42 }).error).toBeTruthy();
});

test('flags filled honeypot as spam', () => {
  expect(parseIdea({ text: 'Echte Idee hier', website: 'http://x' }).error).toBe('spam');
});

test('ignores junk score', () => {
  expect(parseIdea({ text: 'Gute Idee', score: 'viel' }).idea.score).toBeNull();
});

test('issue gets label, short title and defused mentions', () => {
  const issue = toIssue({ text: `${'a'.repeat(80)}\n@octocat schau #1`, name: '@bob', score: 3, season: 'Winter' });
  expect(issue.labels).toEqual(['idee']);
  expect(issue.title.length).toBeLessThanOrEqual(73);
  expect(issue.body).not.toMatch(/@bob/);
  expect(issue.body).toContain('3 Mauern');
});

test('idea text renders as plain code block, even with backticks inside', () => {
  const text = 'Klick ![x](https://evil.example/p.png)\n```\n# Titel\n```';
  const { body } = toIssue({ text, name: '', score: null, season: '' });
  expect(body.startsWith('````text\n')).toBe(true);
  expect(body).toContain(`${text}\n\`\`\`\`\n`);
});

test('name loses markdown and line breaks, season must be known', () => {
  const { idea } = parseIdea({ text: 'Gute Idee', name: 'x\n\n# [Hi](http://a.b) ![i](c)', season: '<b>Winter</b>', score: 1e12 });
  expect(idea.name).toBe('x # Hihttp:/\u200b/a.b ic');
  expect(idea.season).toBe('');
  expect(idea.score).toBe(100_000);
  expect(parseIdea({ text: 'Gute Idee', season: 'Herbst' }).idea.season).toBe('Herbst');
});
