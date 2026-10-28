import { MAX_HELMETS, POWERUPS, SYRINGES } from './config.js';
import { STREAK_NEED, nextStreak, applyWorldBest, overNote } from './scoring.js';
import { addHelmet } from './logic.js';
import { burstSparkles, burstStones } from './fx.js';
import { seasonHint, seasonName, t } from './i18n.js';

export function createGameFlow({ hud, getState, getLoadingFigure, setLoadingFigure, getGame, setGame, newGame, getBoard, setState, updateHud, speedAt, showBanner, popText, showOver, season, sheetsFor, figureSheets, pick, setFigure, playerSpot, readBest, writeBest }) {
  function beginPlay() {
    setState('playing');
    const s = season();
    showBanner(seasonName(s), seasonHint(s));
  }
  // The world record may arrive after the run began: it counts only while no wall is passed yet.
  function loadWorld() {
    const game = getGame();
    getBoard().refreshWorld().then((score) => {
      const world = applyWorldBest(game.passed, score);
      if (world) game.worldBest = world;
    });
  }
  function beginIntro() {
    setGame(newGame());
    getBoard().offer(null);
    loadWorld();
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
    tap.textContent = t('status.loading');
    try {
      setFigure(await sheetsFor(id));
    } catch (err) {
      tap.textContent = t('start.retry');
      console.error(err);
      return;
    } finally {
      setLoadingFigure(false);
    }
    tap.textContent = t('start.go');
    for (const key of figureSheets.keys()) if (key !== id) figureSheets.delete(key);
    beginIntro();
  }
  // Fast retry after a crash: straight into the round, no intro.
  function start() {
    setGame(newGame());
    getBoard().offer(null);
    loadWorld();
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
      const hint = game.player.helmets === before
        ? t('powerup.helmet.max', { max: MAX_HELMETS })
        : t('powerup.helmet.count', { count: game.player.helmets, max: MAX_HELMETS });
      showBanner(t('powerup.helmet'), hint, powerup.img);
    } else {
      game.effects[type] = powerup.duration;
      showBanner(t(`powerup.${type}`), t(`powerup.${type}.hint`), powerup.img);
    }
    navigator.vibrate?.(30);
  }
  function onPass(kind) {
    const game = getGame();
    const at = playerSpot();
    if (kind === 'perfect') popText(t('pass.perfect'), 'perfect');
    else if (kind === 'close') {
      popText(t('pass.close'), 'close');
      game.shake = Math.max(game.shake, 0.12);
      navigator.vibrate?.(15);
    }
    const { streak, reward } = nextStreak(game.streak, kind);
    game.streak = streak;
    if (reward) {
      const before = game.player.helmets;
      burstSparkles(game.fx, at.sx, at.sy, at.s / 45);
      game.player.helmets = addHelmet(before, MAX_HELMETS);
      const sub = t('streak.sub', { need: STREAK_NEED });
      showBanner(t('streak.title'), game.player.helmets > before ? t('streak.reward', { sub }) : sub, POWERUPS.helmet.img);
      navigator.vibrate?.(30);
    }
    // last, so the record wins the banner over a season or streak on the same wall
    const world = !game.worldShown && game.worldBest > 0 && game.passed > game.worldBest;
    const own = !game.recordShown && game.best > 0 && game.passed > game.best;
    if (world || own) {
      if (world) game.worldShown = true;
      if (own) game.recordShown = true;
      burstSparkles(game.fx, at.sx, at.sy, at.s / 45);
      showBanner(t(world ? 'record.worldBanner' : 'record.ownBanner'), t('record.moreThan', { count: world ? game.worldBest : game.best }));
      navigator.vibrate?.([40, 40, 40]);
    }
  }
  function crash(cause = 'wall') {
    const game = getGame();
    const at = playerSpot();
    if (cause === 'syringe') game.syringeImpact = SYRINGES.effectDuration;
    else burstStones(game.fx, at.sx, at.sy, at.s / 45);
    if (game.player.helmets > 0) {
      game.player.helmets--;
      game.streak = 0;
      game.shake = 0.3;
      game.flash = 0.25;
      navigator.vibrate?.(80);
      showBanner(
        t(cause === 'syringe' ? 'crash.syringeHelmet' : 'crash.helmet'),
        game.player.helmets ? t('crash.helmetsLeft', { count: game.player.helmets }) : t('crash.phew'),
        POWERUPS.helmet.img,
      );
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
    showOver(best, overNote(game.passed, game.best, game.worldBest), game.passed);
  }
  return { beginIntro, beginPlay, choose, start, collect, onPass, crash };
}
