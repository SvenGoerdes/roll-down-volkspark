import { WORKER_URL } from './config.js';
import { validWorldBest } from './scoring.js';
import { readName, writeName, netError, FETCH_TIMEOUT } from './name.js';

const DONE = {
  added: 'Eingetragen!',
  exists: 'Dein Eintrag steht schon drin – mit gleich vielen oder mehr Mauern.',
  too_low: 'Zu wenig für die Top 20 – nächstes Mal!',
};
const same = (a, b) => a.toLowerCase() === b.toLowerCase();

async function call(path, body) {
  const init = { signal: AbortSignal.timeout(FETCH_TIMEOUT) };
  if (body) Object.assign(init, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const res = await fetch(`${WORKER_URL}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Bestenliste nicht erreichbar');
  return data;
}

// Wires the leaderboard button, the game-over "eintragen" button and the list sheet.
// Returns { offer(score, season), world(), refreshWorld() }: main.js calls offer after a crash, and with null on a new run.
export function setupLeaderboard() {
  const root = document.getElementById('board');
  const form = document.getElementById('board-form');
  const status = document.getElementById('board-status');
  const list = document.getElementById('board-list');
  const entry = document.getElementById('board-entry');
  const send = entry.querySelector('button');
  const offerBtn = document.getElementById('submit-score');
  let pending = null; // { score, season } of the run that can still be entered
  let worldBest = null; // top score of the board, null while unknown or offline
  let mine = null; // { name, score, entries } of our last successful POST

  // Entries come from other people: only textContent, never innerHTML.
  const render = (entries) => {
    const me = readName().trim().toLowerCase();
    list.replaceChildren(...entries.map((e, i) => {
      const li = document.createElement('li');
      const rank = document.createElement('span');
      const name = document.createElement('span');
      const score = document.createElement('b');
      rank.textContent = `${i + 1}.`;
      name.textContent = e.name;
      score.textContent = e.score;
      li.append(rank, name, score);
      if (me && e.name.toLowerCase() === me) li.className = 'me';
      return li;
    }));
    const row = list.querySelector('.me');
    if (row) list.scrollTop = row.offsetTop - list.clientHeight / 2; // not scrollIntoView: it scrolls the whole page
  };
  const message = (text, cls = '') => { status.textContent = text; status.className = cls; };

  async function load() {
    list.replaceChildren();
    message('Lädt …');
    try {
      let { entries } = await call('/leaderboard');
      // KV reads can lag behind our own write: keep the list the POST gave us until the GET catches up
      if (mine && !entries.some((e) => same(e.name, mine.name) && e.score >= mine.score)) entries = mine.entries;
      message(entries.length ? '' : 'Noch keine Einträge – sei der Erste!');
      render(entries);
    } catch (err) {
      message(netError(err), 'err');
    }
  }

  function open() {
    root.classList.add('open');
    entry.hidden = !pending;
    if (pending) {
      form.elements.name.value = readName();
      send.textContent = `Eintragen · ${pending.score} Mauern`;
    }
    load();
  }
  const close = () => {
    root.classList.remove('open');
    document.activeElement?.blur();
  };

  document.getElementById('board-btn').addEventListener('click', open);
  offerBtn.addEventListener('click', open);
  document.getElementById('board-close').addEventListener('click', close);
  root.querySelector('.backdrop').addEventListener('click', close);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    writeName(name);
    send.disabled = true;
    message('Wird gesendet …');
    try {
      const data = await call('/scores', { name, ...pending });
      if (data.status !== 'too_low') mine = { name, score: pending.score, entries: data.entries };
      pending = null;
      entry.hidden = true;
      offerBtn.hidden = true;
      message(DONE[data.status], data.status === 'too_low' ? '' : 'ok');
      render(data.entries);
    } catch (err) {
      message(netError(err), 'err');
    } finally {
      send.disabled = false;
    }
  });

  // Quiet: a failing board must never disturb a run, the old value stays.
  async function refreshWorld() {
    try {
      const { entries } = await call('/leaderboard');
      worldBest = validWorldBest(Math.max(0, ...entries.map((e) => e.score))) ?? worldBest;
    } catch { /* offline: no world goal */ }
    return worldBest;
  }
  refreshWorld();

  return {
    world: () => worldBest,
    refreshWorld,
    offer(score, season) {
      pending = score > 0 ? { score, season } : null;
      offerBtn.hidden = !pending;
    },
  };
}
