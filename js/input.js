import { CORRIDOR, PLAYER_R, PLAYER_Z } from './config.js';

export function bindInput({ input, hud, getState, getGame, getView, choose, start, newGame, setGame, getBoard, readBest, setState, beginPlay, resize, setLast }) {
  const onPointerDown = (e) => {
    if (e.target?.closest?.('#ideas, #board, #over button, #figures, #themes, #lang')) return;
    if (getState() === 'start') { choose(); return; }
    if (getState() === 'over') {
      if (hud.over.dataset.ready === '1') start();
      return;
    }
    if (getState() === 'intro') beginPlay();
    input.dragging = true;
    input.lastX = e.clientX;
  };
  const onPointerMove = (e) => {
    if (!input.dragging || getState() !== 'playing') return;
    const dx = e.clientX - input.lastX;
    input.lastX = e.clientX;
    const unitsPerPx = PLAYER_Z / getView().F;
    const limit = CORRIDOR / 2 - PLAYER_R;
    const p = getGame().player;
    p.target = Math.max(-limit, Math.min(limit, p.target + dx * unitsPerPx * 1.4));
  };
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', () => { input.dragging = false; });
  window.addEventListener('pointercancel', () => { input.dragging = false; });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest?.('#ideas, #board, #over button, #figures, #themes, #lang')) return;
    input.keys.add(e.key);
    if ((e.key === ' ' || e.key === 'Enter') && getState() !== 'playing') {
      onPointerDown({ clientX: 0 });
      input.dragging = false; // keys steer on their own; no finger to follow
    }
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.key));
  hud.changeFigure.addEventListener('click', () => {
    document.activeElement?.blur();
    if (getState() !== 'over') return;
    setGame(newGame());
    getBoard().offer(null);
    hud.over.classList.remove('show');
    hud.start.classList.add('show');
    hud.bestStart.textContent = readBest();
    setState('start');
  });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => setLast(performance.now()));
}
