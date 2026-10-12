// World units: the corridor between the bushes is CORRIDOR wide, x = 0 is the middle.
export const CORRIDOR = 8;
export const WALL_EXT = CORRIDOR / 2 + 7; // walls reach into the bushes
export const WALL_H = 2.6;
export const PLAYER_R = 0.7;
export const PLAYER_Z = 4; // distance from camera to the player
export const SPAWN_Z = 90;
export const PLAYER_SCREEN_Y = 0.78; // share of screen height
export const HORIZON = 0.42;

export const WALLS_PER_SEASON = 20;

export const SEASONS = [
  {
    id: 'spring', name: 'Frühling', icon: '🌸', hint: 'Pfützen machen rutschig',
    speedMul: 1, gapMul: 1,
    path: [138, 108, 78], grass: [88, 148, 58], fog: [78, 112, 62],
    particle: { colors: ['#ffc2d4', '#ff9fbf', '#ffe0ea'], rate: 8, size: [3, 6], fall: 40 },
  },
  {
    id: 'summer', name: 'Sommer', icon: '☀️', hint: 'Schneller – und doppelte Lücken',
    speedMul: 1.15, gapMul: 1.05,
    path: [176, 142, 98], grass: [112, 162, 62], fog: [96, 136, 80],
    particle: { colors: ['#fff6b0', '#ffffff'], rate: 4, size: [1.5, 3], fall: 12 },
  },
  {
    id: 'autumn', name: 'Herbst', icon: '🍂', hint: 'Windböen schieben dich zur Seite',
    speedMul: 1, gapMul: 1,
    path: [118, 90, 64], grass: [118, 116, 52], fog: [92, 96, 58],
    particle: { colors: ['#d9822b', '#c4561d', '#e8b33a', '#8f3b1b'], rate: 14, size: [4, 8], fall: 70 },
  },
  {
    id: 'winter', name: 'Winter', icon: '❄️', hint: 'Glatteis – du rutschst nach',
    speedMul: 1.05, gapMul: 1.1,
    path: [222, 228, 236], grass: [240, 244, 250], fog: [196, 204, 216],
    particle: { colors: ['#ffffff'], rate: 40, size: [1.5, 4], fall: 90 },
  },
];

// Path surfaces change every SURFACE_LEN world units (see createSurfaceTrack)
export const SURFACE_LEN = 40;
export const SURFACES = {
  dirt: { id: 'dirt', icon: '🟤', name: 'Erde', hint: 'Fester Boden', speedMul: 1, bump: 0 },
  gravel: { id: 'gravel', icon: '🪨', name: 'Schotter', hint: 'Holprig – du hoppelst', speedMul: 1, bump: 1 },
  grass: { id: 'grass', icon: '🌱', name: 'Gras', hint: 'Bremst dich ab', speedMul: 0.9, bump: 0 },
};
export const SURFACE_ORDER = ['dirt', 'gravel', 'grass'];

export const POWERUPS = {
  helmet: { icon: '⛑️', name: 'Helm', hint: 'Übersteht einen Crash', duration: 0 },
  slowmo: { icon: '⏳', name: 'Zeitlupe', hint: 'Alles langsamer', duration: 5 },
  widen: { icon: '↔️', name: 'Breite Lücken', hint: 'Lücken größer', duration: 7 },
};
export const POWERUP_CHANCE = 0.3;

// Cloudflare Worker that turns ideas into GitHub issues (see worker/)
export const IDEAS_URL = 'https://roll-down-ideas.roll-down-ideas.workers.dev';
