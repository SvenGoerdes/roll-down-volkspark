export const THEMES = [
  { id: 'volkspark', label: 'Volkspark' },
  { id: 'berlin-tour', label: 'Berlin-Tour' },
];

export function validateThemeId(id) {
  return THEMES.some((theme) => theme.id === id) ? id : 'volkspark';
}

export function setupThemeSelect(container, selected = 'volkspark', onSelect = () => {}) {
  let current = validateThemeId(selected);
  container.replaceChildren(...THEMES.map(({ id, label }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(id === current));
    button.addEventListener('click', () => select(id));
    return button;
  }));

  function select(id) {
    if (!THEMES.some((theme) => theme.id === id)) return false;
    current = id;
    for (const button of container.children) button.setAttribute('aria-pressed', String(button.textContent === THEMES.find((theme) => theme.id === id).label));
    onSelect(id);
    return true;
  }

  return { select };
}
