import { POWERUPS, WALLS_PER_SEASON } from './config.js';
import { STREAK_NEED } from './scoring.js';
import { seasonName, t } from './i18n.js';

export function createHud(hud, { getGame, getSeason, playerSpot, windArrow }) {
  let shownStreak = 0;
  function showBanner(text, sub, img) {
    getGame().bannerAt = performance.now();
    const strong = document.createElement('strong');
    const span = document.createElement('span');
    strong.textContent = text;
    span.textContent = sub;
    hud.banner.replaceChildren(strong, span);
    if (img) {
      const icon = new Image();
      icon.src = img;
      icon.alt = '';
      strong.prepend(icon);
    }
    hud.banner.classList.remove('show');
    void hud.banner.offsetWidth; // restart the CSS animation
    hud.banner.classList.add('show');
  }
  function popText(text, kind) {
    const at = playerSpot();
    const el = hud.pop;
    el.textContent = text;
    el.className = kind;
    el.style.left = `${at.sx}px`;
    el.style.top = `${at.sy - at.s * 1.4}px`;
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('show');
  }
  function update(speed) {
    const game = getGame();
    if (hud.score.textContent !== String(game.passed)) {
      hud.score.textContent = game.passed;
      const chip = hud.score.parentElement;
      chip.classList.remove('pop');
      void chip.offsetWidth; // restart the CSS animation
      chip.classList.add('pop');
      hud.season.style.setProperty('--p', (game.passed % WALLS_PER_SEASON) / WALLS_PER_SEASON);
    }
    if (game.streak !== shownStreak) {
      shownStreak = game.streak;
      for (let i = 0; i < STREAK_NEED; i++) hud.streak.children[i].classList.toggle('on', i < shownStreak);
      hud.streak.classList.toggle('active', shownStreak > 0);
    }
    hud.speed.textContent = `${Math.round(speed * 1.6)} km/h`;
    hud.season.textContent = seasonName(getSeason());
    const parts = [];
    for (let i = 0; i < game.player.helmets; i++) parts.push(`<span class="pw helmet"><img src="${POWERUPS.helmet.img}" alt=""></span>`);
    for (const key of ['slowmo', 'widen']) {
      const left = game.effects[key];
      if (left > 0) {
        const pct = (left / POWERUPS[key].duration) * 100;
        parts.push(`<span class="pw ${key}"><img src="${POWERUPS[key].img}" alt=""><i style="width:${pct}%"></i></span>`);
      }
    }
    hud.powers.innerHTML = parts.join(''); // only our own icons, never player text
    const dir = windArrow(game.wind);
    const wind = t('hud.wind');
    hud.wind.textContent = dir > 0 ? `${wind} →` : dir < 0 ? `← ${wind}` : '';
    hud.wind.classList.toggle('warn', game.wind.warn > 0);
  }
  function showOver(best, note, passed) {
    hud.final.textContent = passed;
    hud.best.textContent = best;
    hud.overNote.textContent = note.text;
    hud.overNote.className = note.record ? 'record' : '';
    setTimeout(() => hud.over.classList.add('show'), 500);
    hud.over.dataset.ready = '0';
    setTimeout(() => { hud.over.dataset.ready = '1'; }, 1100);
  }
  return { showBanner, popText, update, showOver };
}
