import { WORKER_URL } from './config.js';
import { readName, writeName, netError, FETCH_TIMEOUT } from './name.js';

// Wires the 💡 button and the idea form. `context()` returns { score, season } of the last run.
export function setupIdeas(context) {
  const root = document.getElementById('ideas');
  const form = document.getElementById('idea-form');
  const status = document.getElementById('idea-status');
  const send = form.querySelector('button[type=submit]');
  const text = form.elements.text;

  const open = () => {
    root.classList.add('open');
    form.elements.name.value = readName();
    status.textContent = '';
    setTimeout(() => text.focus({ preventScroll: true }), 50);
  };
  const close = () => {
    root.classList.remove('open');
    document.activeElement?.blur();
  };

  document.getElementById('idea-btn').addEventListener('click', open);
  document.getElementById('idea-close').addEventListener('click', close);
  root.querySelector('.backdrop').addEventListener('click', close);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    writeName(name);
    send.disabled = true;
    status.textContent = 'Wird gesendet …';
    status.className = '';
    try {
      const res = await fetch(`${WORKER_URL}/ideas`, {
        method: 'POST',
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.value, name, website: form.elements.website.value, ...context() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Senden fehlgeschlagen');
      text.value = '';
      status.textContent = 'Danke! Deine Idee ist im Backlog 🙌';
      status.className = 'ok';
      setTimeout(close, 1600);
    } catch (err) {
      status.textContent = netError(err);
      status.className = 'err';
    } finally {
      send.disabled = false;
    }
  });
}
