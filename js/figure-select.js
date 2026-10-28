// Figure picker on the start overlay: one card per figure with its breathing select sprite, and the saved choice.
import { FIGURES, isFigureUnlocked, pickFigure, unlockHint } from './figure.js';
import { SHEETS } from './figure-sheets.js';
import { t } from './i18n.js';

const KEY = 'rollDownFigure';

export const readFigure = (best = 0) => {
  try {
    return pickFigure(localStorage.getItem(KEY), best);
  } catch {
    return pickFigure(null, best);
  }
};

export const saveFigure = (id) => {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // private mode: the choice lasts for this visit only
  }
};

// Builds the cards in root. onPick(id) runs when an unlocked card is tapped; select(id) moves the mark to another card.
export function setupFigureSelect(root, current, onPick, best = 0) {
  let currentBest = best;
  const entries = FIGURES.map((fig) => {
    const { id, name } = fig;
    const { n, w, h, cols } = SHEETS[id].select;
    const sprite = document.createElement('span');
    sprite.className = 'fig-sprite';
    Object.assign(sprite.style, {
      backgroundImage: `url(assets/figures/${id}/select.webp)`,
      width: `${w / 2}px`,
      height: `${h / 2}px`,
      backgroundSize: `${(cols * w) / 2}px ${h / 2}px`,
      animationTimingFunction: `steps(${n})`,
    });
    sprite.style.setProperty('--end', `-${(n * w) / 2}px`);

    const label = document.createElement('b');
    label.textContent = name;
    const note = document.createElement('small');

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'fig';
    card.dataset.id = id;
    card.append(sprite, label, note);
    card.addEventListener('click', () => {
      if (!isFigureUnlocked(id, currentBest)) {
        card.classList.remove('nudge');
        void card.offsetWidth;
        card.classList.add('nudge');
        return;
      }
      onPick(id);
    });
    return { fig, card, note };
  });

  root.replaceChildren(...entries.map(({ card }) => card));

  const refresh = (nextBest = currentBest) => {
    currentBest = nextBest;
    for (const { fig, card, note } of entries) {
      const unlocked = isFigureUnlocked(fig.id, currentBest);
      card.classList.toggle('locked', !unlocked);
      card.setAttribute('aria-disabled', String(!unlocked));
      note.textContent = unlocked ? t(`figure.${fig.id}.tag`) : unlockHint(fig.unlockWalls);
    }
  };

  const select = (id) => {
    const active = pickFigure(id, currentBest);
    for (const { card } of entries) {
      const on = card.dataset.id === active;
      card.classList.toggle('on', on);
      card.setAttribute('aria-pressed', on);
    }
    return active;
  };
  refresh(best);
  select(current);
  return { select, refresh };
}
