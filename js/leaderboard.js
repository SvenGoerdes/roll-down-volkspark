import { WORKER_URL } from './config.js';

const NAME_KEY = 'rollDownName';
const readName = () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } };
const writeName = (v) => { try { localStorage.setItem(NAME_KEY, v); } catch { /* private mode */ } };

const MEDALS = ['🥇', '🥈', '🥉'];
const offline = (err) => (err.message === 'Failed to fetch' ? 'Keine Verbindung – probier es gleich nochmal' : err.message);

async function call(path, body) {
  const res = await fetch(`${WORKER_URL}${path}`, body && {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Bestenliste nicht erreichbar');
  return data;
}

// Wires the 🏆 button, the game-over "eintragen" button and the list sheet.
// Returns { offer(score, season) }: main.js calls it after a crash, and with null on a new run.
export function setupLeaderboard() {
  const root = document.getElementById('board');
  const form = document.getElementById('board-form');
  const status = document.getElementById('board-status');
  const list = document.getElementById('board-list');
  const entry = document.getElementById('board-entry');
  const send = entry.querySelector('button');
  const offerBtn = document.getElementById('submit-score');
  let pending = null; // { score, season } of the run that can still be entered

  // Entries come from other people: only textContent, never innerHTML.
  const render = (entries) => {
    const me = readName().trim().toLowerCase();
    list.replaceChildren(...entries.map((e, i) => {
      const li = document.createElement('li');
      const rank = document.createElement('span');
      const name = document.createElement('span');
      const score = document.createElement('b');
      rank.textContent = MEDALS[i] || `${i + 1}.`;
      name.textContent = e.name;
      score.textContent = e.score;
      li.append(rank, name, score);
      if (me && e.name.toLowerCase() === me) li.className = 'me';
      return li;
    }));
    const mine = list.querySelector('.me');
    if (mine) list.scrollTop = mine.offsetTop - list.clientHeight / 2; // not scrollIntoView: it scrolls the whole page
  };
  const message = (text, cls = '') => { status.textContent = text; status.className = cls; };

  async function load() {
    list.replaceChildren();
    message('Lädt …');
    try {
      const { entries } = await call('/leaderboard');
      message(entries.length ? '' : 'Noch keine Einträge – sei der Erste!');
      render(entries);
    } catch (err) {
      message(offline(err), 'err');
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
      pending = null;
      entry.hidden = true;
      offerBtn.hidden = true;
      message(data.improved ? 'Eingetragen! 🙌' : 'Dein Eintrag steht schon drin – mit gleich vielen oder mehr Mauern.', 'ok');
      render(data.entries);
    } catch (err) {
      message(offline(err), 'err');
    } finally {
      send.disabled = false;
    }
  });

  return {
    offer(score, season) {
      pending = score > 0 ? { score, season } : null;
      offerBtn.hidden = !pending;
    },
  };
}
