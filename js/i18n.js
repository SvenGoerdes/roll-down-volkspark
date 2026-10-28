// Minimal two-language i18n (DE default/fallback, EN for `en*` browsers or manual toggle).
export const LANG_KEY = 'rollDownLang';
export const LANGS = ['de', 'en'];

export const STRINGS = {
  de: {
    'hud.walls': 'Mauern',
    'hud.best': 'Rekord',
    'hud.wind': 'Wind',
    'hud.hint': 'Wischen zum Lenken',
    'start.langAria': 'Sprache',
    'start.tagline': 'Roll den Berg runter und triff die Lücken in den Mauern.',
    'start.themesAria': 'Strecke wählen',
    'start.figuresAria': 'Figur wählen',
    'start.go': 'Losrollen',
    'start.retry': 'Nochmal versuchen',
    'start.loadError': 'Laden fehlgeschlagen – bitte neu laden.',
    'theme.volkspark': 'Volkspark',
    'theme.berlin-tour': 'Berlin-Tour',
    'figure.kalle.tag': 'vom Kiez',
    'figure.tine.tag': 'Techno',
    'figure.alaska.tag': 'Brillenkatze',
    'powerup.helmet': 'Helm',
    'powerup.helmet.hint': 'Übersteht einen Crash',
    'powerup.helmet.max': 'Maximal {max} Helme',
    'powerup.helmet.count': '{count} von {max} – je ein Crash frei',
    'powerup.slowmo': 'Zeitlupe',
    'powerup.slowmo.hint': 'Alles langsamer',
    'powerup.widen': 'Breite Lücken',
    'powerup.widen.hint': 'Lücken größer',
    'legend.helmet': '1 Crash frei',
    'legend.slowmo': '5 Sekunden',
    'legend.widen': '7 Sekunden',
    'season.spring': 'Frühling',
    'season.spring.hint': 'Pfützen machen rutschig',
    'season.summer': 'Sommer',
    'season.summer.hint': 'Schneller – und doppelte Lücken',
    'season.autumn': 'Herbst',
    'season.autumn.hint': 'Windböen schieben dich zur Seite',
    'season.winter': 'Winter',
    'season.winter.hint': 'Glatteis – du rutschst nach',
    'surface.dirt': 'Erde',
    'surface.dirt.hint': 'Fester Boden',
    'surface.gravel': 'Schotter',
    'surface.gravel.hint': 'Holprig – du hoppelst',
    'surface.grass': 'Gras',
    'surface.grass.hint': 'Bremst dich ab',
    'puddle.title': 'Rutschig!',
    'puddle.hint': 'Gegenlenken dauert länger',
    'pass.perfect': 'Perfekt',
    'pass.close': 'Knapp!',
    'streak.title': 'Serie!',
    'streak.sub': '{need}× Perfekt',
    'streak.reward': '{sub} – Helm geschenkt',
    'record.ownSign': 'Rekord',
    'record.worldSign': 'Weltrekord',
    'record.ownBanner': 'Neuer Rekord!',
    'record.worldBanner': 'Weltrekord!',
    'record.moreThan': 'Mehr als {count} Mauern',
    'record.ownTarget': 'Rekord',
    'record.worldTarget': 'Weltrekord',
    'crash.helmet': 'Helm kaputt',
    'crash.syringeHelmet': 'Spritze – Helm kaputt',
    'crash.helmetsLeft': 'Noch {count} übrig',
    'crash.phew': 'Glück gehabt!',
    'crash.syringeStamp': 'Spritze!',
    'over.title': 'Autsch!',
    'over.worldRecord': 'Neuer Weltrekord!',
    'over.ownRecord': 'Neuer Rekord!',
    'over.toRecordOne': 'Noch 1 Mauer bis zum {target}',
    'over.toRecordMany': 'Noch {count} Mauern bis zum {target}',
    'over.submitScore': 'In Bestenliste eintragen',
    'over.changeFigure': 'Figur wechseln',
    'over.retry': 'Tippen für nächste Runde',
    'sheet.close': 'Schließen',
    'status.loading': 'Lädt …',
    'status.sending': 'Wird gesendet …',
    'ideas.button': 'Idee?',
    'ideas.title': 'Was fehlt im Spiel?',
    'ideas.placeholder': 'Neues Powerup, andere Jahreszeit, Bug gefunden …',
    'ideas.namePlaceholder': 'Dein Name (optional)',
    'ideas.submit': 'Abschicken',
    'ideas.thanks': 'Danke! Deine Idee ist im Backlog.',
    'ideas.error': 'Senden fehlgeschlagen',
    'board.button': 'Bestenliste',
    'board.title': 'Bestenliste',
    'board.namePlaceholder': 'Dein Name',
    'board.submitScore': 'Eintragen · {score} Mauern',
    'board.empty': 'Noch keine Einträge – sei der Erste!',
    'board.added': 'Eingetragen!',
    'board.exists': 'Dein Eintrag steht schon drin – mit gleich vielen oder mehr Mauern.',
    'board.too_low': 'Zu wenig für die Top 20 – nächstes Mal!',
    'board.unreachable': 'Bestenliste nicht erreichbar',
    'board.checking': 'Die Prüfung läuft noch – gleich nochmal drücken',
    'error.network': 'Keine Verbindung – probier es gleich nochmal',
    'error.turnstile': 'Prüfung konnte nicht geladen werden – probier es gleich nochmal',
  },
  en: {
    'hud.walls': 'walls',
    'hud.best': 'Record',
    'hud.wind': 'Wind',
    'hud.hint': 'Swipe to steer',
    'start.langAria': 'Language',
    'start.tagline': 'Roll down the hill and hit the gaps in the walls.',
    'start.themesAria': 'Choose route',
    'start.figuresAria': 'Choose character',
    'start.go': 'Roll!',
    'start.retry': 'Try again',
    'start.loadError': 'Loading failed – please reload.',
    'theme.volkspark': 'Volkspark',
    'theme.berlin-tour': 'Berlin Tour',
    'figure.kalle.tag': 'from the Kiez',
    'figure.tine.tag': 'Techno',
    'figure.alaska.tag': 'glasses cat',
    'powerup.helmet': 'Helmet',
    'powerup.helmet.hint': 'Survives one crash',
    'powerup.helmet.max': 'Max {max} helmets',
    'powerup.helmet.count': '{count} of {max} – 1 free crash each',
    'powerup.slowmo': 'Slow-mo',
    'powerup.slowmo.hint': 'Everything slows down',
    'powerup.widen': 'Wide gaps',
    'powerup.widen.hint': 'Wider gaps',
    'legend.helmet': '1 free crash',
    'legend.slowmo': '5 seconds',
    'legend.widen': '7 seconds',
    'season.spring': 'Spring',
    'season.spring.hint': 'Puddles make you slip',
    'season.summer': 'Summer',
    'season.summer.hint': 'Faster – and double gaps',
    'season.autumn': 'Autumn',
    'season.autumn.hint': 'Wind gusts push you sideways',
    'season.winter': 'Winter',
    'season.winter.hint': 'Black ice – you keep sliding',
    'surface.dirt': 'Dirt',
    'surface.dirt.hint': 'Firm ground',
    'surface.gravel': 'Gravel',
    'surface.gravel.hint': 'Bumpy – makes you bounce',
    'surface.grass': 'Grass',
    'surface.grass.hint': 'Slows you down',
    'puddle.title': 'Slippery!',
    'puddle.hint': 'Steering takes longer',
    'pass.perfect': 'Perfect',
    'pass.close': 'Close!',
    'streak.title': 'Streak!',
    'streak.sub': '{need}× Perfect',
    'streak.reward': '{sub} – free helmet',
    'record.ownSign': 'Record',
    'record.worldSign': 'World record',
    'record.ownBanner': 'New record!',
    'record.worldBanner': 'World record!',
    'record.moreThan': 'More than {count} walls',
    'record.ownTarget': 'record',
    'record.worldTarget': 'world record',
    'crash.helmet': 'Helmet broke',
    'crash.syringeHelmet': 'Syringe – helmet broke',
    'crash.helmetsLeft': '{count} left',
    'crash.phew': 'Close one!',
    'crash.syringeStamp': 'Syringe!',
    'over.title': 'Ouch!',
    'over.worldRecord': 'New world record!',
    'over.ownRecord': 'New record!',
    'over.toRecordOne': '1 more wall to the {target}',
    'over.toRecordMany': '{count} more walls to the {target}',
    'over.submitScore': 'Add to leaderboard',
    'over.changeFigure': 'Change character',
    'over.retry': 'Tap for next round',
    'sheet.close': 'Close',
    'status.loading': 'Loading …',
    'status.sending': 'Sending …',
    'ideas.button': 'Idea?',
    'ideas.title': "What's missing?",
    'ideas.placeholder': 'New power-up, new season, found a bug …',
    'ideas.namePlaceholder': 'Your name (optional)',
    'ideas.submit': 'Send',
    'ideas.thanks': 'Thanks! Your idea is in the backlog.',
    'ideas.error': 'Failed to send',
    'board.button': 'Leaderboard',
    'board.title': 'Leaderboard',
    'board.namePlaceholder': 'Your name',
    'board.submitScore': 'Submit · {score} walls',
    'board.empty': 'No entries yet – be the first!',
    'board.added': 'Added!',
    'board.exists': "You're already on the board – with as many or more walls.",
    'board.too_low': 'Not enough for the top 20 – next time!',
    'board.unreachable': 'Leaderboard unavailable',
    'board.checking': 'Verification still running – tap again in a moment',
    'error.network': 'No connection – try again in a moment',
    'error.turnstile': 'Verification failed to load – try again in a moment',
  },
};

export function detectLang(navLang = globalThis.navigator?.language) {
  return typeof navLang === 'string' && navLang.trim().toLowerCase().startsWith('en') ? 'en' : 'de';
}

export function resolveLang(stored, navLang = globalThis.navigator?.language) {
  return LANGS.includes(stored) ? stored : detectLang(navLang);
}

export function readLang() {
  try {
    return resolveLang(localStorage.getItem(LANG_KEY));
  } catch {
    return detectLang();
  }
}

let current = readLang();

export const getLang = () => current;

export function setLang(lang, { persist = true } = {}) {
  current = LANGS.includes(lang) ? lang : 'de';
  if (persist) {
    try { localStorage.setItem(LANG_KEY, current); } catch { /* private mode */ }
  }
  return current;
}

export function t(key, vars, lang = current) {
  const table = STRINGS[lang] || STRINGS.de;
  const raw = table[key] ?? STRINGS.de[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

export const seasonName = (s) => (s?.id ? t(`season.${s.id}`) : s?.name ?? '');
export const seasonHint = (s) => (s?.id ? t(`season.${s.id}.hint`) : s?.hint ?? '');

export function applyI18n(root = globalThis.document) {
  if (!root) return;
  if (root.documentElement) root.documentElement.lang = current;
  for (const el of root.querySelectorAll?.('[data-i18n]') || []) {
    el.textContent = t(el.getAttribute('data-i18n'));
  }
  for (const el of root.querySelectorAll?.('[data-i18n-placeholder]') || []) {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  }
  for (const el of root.querySelectorAll?.('[data-i18n-aria]') || []) {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  }
}

export function setupLangSwitch(container, onChange = () => {}) {
  if (!container) return { sync() {} };
  const sync = () => {
    for (const btn of container.children || []) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === current));
    }
  };
  for (const btn of container.children || []) {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-lang');
      if (!LANGS.includes(next) || next === current) return;
      setLang(next);
      sync();
      onChange(current);
    });
  }
  sync();
  return { sync };
}
