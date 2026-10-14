import { MAX_HELMETS, POWERUPS } from './config.js';
import { STREAK_NEED, nextStreak, wallsToRecord } from './scoring.js';
import { addHelmet } from './logic.js';
import { burstSparkles, burstStones } from './fx.js';

export function createGameFlow({ hud, getState, getLoadingFigure, setLoadingFigure, getGame, setGame, newGame, getBoard, setState, updateHud, speedAt, showBanner, popText, showOver, season, sheetsFor, figureSheets, pick, setFigure, playerSpot, readBest, writeBest }) {
  const TAP_TEXT = 'Losrollen';
  function beginPlay() {
    setState('playing');
    showBanner(season().name, season().hint);
  }
  function beginIntro() {
    setGame(newGame());
    getBoard().offer(null);
    hud.start.classList.remove('show');
    hud.over.classList.remove('show');
    setState('intro');
    updateHud(speedAt(0));
  }
  async function choose(id) {
    if (getState() !== 'start' || getLoadingFigure()) return;
    document.activeElement?.blur();
    pick(id);
    const tap = hud.start.querySelector('.tap');
    setLoadingFigure(true);
    tap.textContent = 'Lädt …';
    try {
      setFigure(await sheetsFor(id));
    } catch (err) {
      tap.textContent = 'Nochmal versuchen';
      console.error(err);
      return;
    } finally {
      setLoadingFigure(false);
    }
    tap.textContent = TAP_TEXT;
    for (const key of figureSheets.keys()) if (key !== id) figureSheets.delete(key);
    beginIntro();
  }
  // Fast retry after a crash: straight into the round, no intro.
  function start() {
    setGame(newGame());
    getBoard().offer(null);
    hud.start.classList.remove('show');
    hud.over.classList.remove('show');
    beginPlay();
  }
  function collect(type) {
    const game = getGame();
    const powerup = POWERUPS[type];
    const at = playerSpot();
    burstSparkles(game.fx, at.sx, at.sy, at.s / 45);
    if (type === 'helmet') {
      const before = game.player.helmets;
      game.player.helmets = addHelmet(before, MAX_HELMETS);
      const hint = game.player.helmets === before ? `Maximal ${MAX_HELMETS} Helme` : `${game.player.helmets} von ${MAX_HELMETS} – je ein Crash frei`;
      showBanner(powerup.name, hint, powerup.img);
    } else {
      game.effects[type] = powerup.duration;
      showBanner(powerup.name, powerup.hint, powerup.img);
    }
    navigator.vibrate?.(30);
  }
  function onPass(kind) {
    const game = getGame();
    const at = playerSpot();
    if (kind === 'perfect') popText('Perfekt', 'perfect');
    else if (kind === 'close') {
      popText('Knapp!', 'close');
      game.shake = Math.max(game.shake, 0.12);
      navigator.vibrate?.(15);
    }
    const { streak, reward } = nextStreak(game.streak, kind);
    game.streak = streak;
    if (reward) {
      const before = game.player.helmets;
      burstSparkles(game.fx, at.sx, at.sy, at.s / 45);
      game.player.helmets = addHelmet(before, MAX_HELMETS);
      const sub = `${STREAK_NEED}× Perfekt`;
      showBanner('Serie!', game.player.helmets > before ? `${sub} – Helm geschenkt` : sub, POWERUPS.helmet.img);
      navigator.vibrate?.(30);
    }
    // last, so the record wins the banner over a season or streak on the same wall
    if (!game.recordShown && game.best > 0 && game.passed > game.best) {
      game.recordShown = true;
      burstSparkles(game.fx, at.sx, at.sy, at.s / 45);
      showBanner('Neuer Rekord!', `Mehr als ${game.best} Mauern`);
      navigator.vibrate?.([40, 40, 40]);
    }
  }
  function crash() {
    const game = getGame();
    const at = playerSpot();
    burstStones(game.fx, at.sx, at.sy, at.s / 45);
    if (game.player.helmets > 0) {
      game.player.helmets--;
      game.streak = 0;
      game.shake = 0.3;
      game.flash = 0.25;
      navigator.vibrate?.(80);
      showBanner('Helm kaputt', game.player.helmets ? `Noch ${game.player.helmets} übrig` : 'Glück gehabt!', POWERUPS.helmet.img);
      return;
    }
    game.shake = 0.5;
    game.flash = 0.6;
    game.player.dazed = true;
    game.crashAt = game.time;
    navigator.vibrate?.([120, 60, 200]);
    setState('over');
    const best = Math.max(readBest(), game.passed);
    writeBest(best);
    getBoard().offer(game.passed, season().name);
    const need = wallsToRecord(game.passed, game.best);
    showOver(best, need, game.best > 0 && game.passed > game.best, game.passed);
  }
  return { beginIntro, beginPlay, choose, start, collect, onPass, crash };
}
