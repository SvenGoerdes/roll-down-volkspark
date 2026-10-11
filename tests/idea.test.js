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
  expect(issue.body).not.toMatch(/@octocat|#1|@bob/);
  expect(issue.body).toContain('3 Mauern');
});
