// Figure picker on the start overlay: one card per figure with its breathing select sprite, and the saved choice.
import { FIGURES, pickFigure } from './figure.js';
import { SHEETS } from './figure-sheets.js';
import { t } from './i18n.js';

const KEY = 'rollDownFigure';

export const readFigure = () => {
  try {
    return pickFigure(localStorage.getItem(KEY));
  } catch {
    return pickFigure(null);
  }
};

export const saveFigure = (id) => {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // private mode: the choice lasts for this visit only
  }
};

// Builds the cards in root. onPick(id) runs when a card is tapped; select(id) moves the mark to another card.
export function setupFigureSelect(root, current, onPick) {
  const cards = FIGURES.map(({ id, name, tag }) => {
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
    note.setAttribute('data-i18n', `figure.${id}.tag`);
    note.textContent = t(`figure.${id}.tag`);

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'fig';
    card.dataset.id = id;
    card.append(sprite, label, note);
    card.addEventListener('click', () => onPick(id));
    return card;
  });

  root.replaceChildren(...cards);

  const select = (id) => {
    for (const card of cards) {
      const on = card.dataset.id === id;
      card.classList.toggle('on', on);
      card.setAttribute('aria-pressed', on);
    }
  };
  select(current);
  return { select };
}
