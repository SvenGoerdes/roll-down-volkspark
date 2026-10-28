import { t } from './i18n.js';

export const THEMES = [
  { id: 'volkspark', label: 'Volkspark' },
  { id: 'berlin-tour', label: 'Berlin-Tour' },
];

export function validateThemeId(id) {
  return THEMES.some((theme) => theme.id === id) ? id : 'volkspark';
}

export function setupThemeSelect(container, selected = 'volkspark', onSelect = () => {}) {
  let current = validateThemeId(selected);
  container.replaceChildren(...THEMES.map(({ id }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme';
    button.setAttribute('data-i18n', `theme.${id}`);
    button.textContent = t(`theme.${id}`);
    button.setAttribute('aria-pressed', String(id === current));
    button.addEventListener('click', () => select(id));
    return button;
  }));

  function select(id) {
    if (!THEMES.some((theme) => theme.id === id)) return false;
    current = id;
    for (const [i, theme] of THEMES.entries()) {
      container.children[i].setAttribute('aria-pressed', String(theme.id === id));
    }
    onSelect(id);
    return true;
  }

  return { select };
}
