import { TURNSTILE_SITEKEY } from './config.js';
import { t } from './i18n.js';

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading = null;

// Loads Cloudflare's script on first use, so playing and reading never touch it.
const load = () => (loading ||= new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = SRC;
  s.async = true;
  s.onload = resolve;
  s.onerror = () => { loading = null; s.remove(); reject(new Error(t('error.turnstile'))); };
  document.head.append(s);
}));

// Turnstile widget for the leaderboard form. Without a sitekey it does nothing and token() stays empty.
export function createTurnstile(container) {
  let id = null;
  let token = '';
  return {
    enabled: Boolean(TURNSTILE_SITEKEY),
    token: () => token,
    async show() {
      if (!TURNSTILE_SITEKEY) return;
      if (id !== null) return;
      await load();
      id = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITEKEY,
        action: 'score', // the worker checks this value
        callback: (t) => { token = t; },
        'expired-callback': () => { token = ''; },
        'error-callback': () => { token = ''; },
      });
    },
    // A token works once, so every submit needs a fresh one.
    reset() {
      token = '';
      if (id !== null) window.turnstile.reset(id);
    },
  };
}
