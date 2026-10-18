// World units: the corridor between the bushes is CORRIDOR wide, x = 0 is the middle.
export const CORRIDOR = 8;
export const WALL_EXT = CORRIDOR / 2 + 7; // walls reach into the bushes
export const WALL_H = 1.65; // leaves the following obstacle visible when rolling close
export const WALL_D = 1.1;
export const PLAYER_R = 0.7;
export const PLAYER_Z = 4; // distance from camera to the player
export const SPAWN_Z = 90;
export const PLAYER_SCREEN_Y = 0.78; // share of screen height
export const HORIZON = 0.42;
// Smooth descending hill, anchored at the player's collision plane.
export const HILL_DROP = 12;
export const HILL_RUN = 14;

// Steering spring toward the finger; ice and puddles make it loose, and gravel stones knock less there.
export const SPRING = { k: 320, c: 36 };
export const ICE = { k: 70, c: 8, kick: 0.3 };
export const WIND_WARN = 0.7; // seconds a gust is announced before it pushes

export const WALLS_PER_SEASON = 20;

// Visual-only gate layout and sight window; never used by collision or spawning.
export const GATE_ART = { pierSpacing: 2.25, revealAlpha: 0.18, revealMargin: 0.2 };

// Landmark opening styles are visual metadata; passage width stays in world units.
export const SIGHTSEEING_LANDMARKS = [
  { id: 'brandenburg-gate', name: 'Brandenburger Tor', openingForm: 'columned' },
  { id: 'reichstag', name: 'Reichstag', openingForm: 'arched' },
  { id: 'red-town-hall', name: 'Rotes Rathaus', openingForm: 'arched' },
  { id: 'oberbaum-bridge', name: 'Oberbaumbrücke', openingForm: 'arched' },
  { id: 'east-side-gallery', name: 'East Side Gallery', openingForm: 'framed' },
];

export const SEASONS = [
  {
    id: 'spring', name: 'Frühling', icon: '🌸', hint: 'Pfützen machen rutschig',
    speedMul: 1, gapMul: 1,
    path: [177, 151, 102], grass: [112, 151, 66], fog: [184, 195, 155],
    sky: [154, 189, 189], rim: [255, 231, 174], shadow: [33, 56, 43],
    foliage: ['#263f2b', '#465f30', '#748d3b', '#a8bc5b'],
    stones: ['#66594b', '#877763', '#a9997e', '#c1b594'],
    particle: { colors: ['#ffc2d4', '#ff9fbf', '#ffe0ea'], rate: 8, size: [3, 6], fall: 40 },
  },
  {
    id: 'summer', name: 'Sommer', icon: '☀️', hint: 'Schneller – und doppelte Lücken',
    speedMul: 1.15, gapMul: 1.05,
    path: [185, 139, 81], grass: [105, 130, 48], fog: [190, 185, 125],
    sky: [105, 175, 218], rim: [255, 217, 142], shadow: [28, 47, 34],
    foliage: ['#1f3425', '#364b25', '#586e2d', '#849b42'],
    stones: ['#665346', '#87705a', '#a68e70', '#c4ac84'],
    particle: { colors: ['#fff6b0', '#ffffff'], rate: 4, size: [1.5, 3], fall: 12 },
  },
  {
    id: 'autumn', name: 'Herbst', icon: '🍂', hint: 'Windböen schieben dich zur Seite',
    speedMul: 1, gapMul: 1,
    path: [163, 105, 57], grass: [110, 103, 42], fog: [199, 147, 91],
    sky: [153, 112, 120], rim: [255, 195, 110], shadow: [55, 38, 30],
    foliage: ['#382f1b', '#635024', '#a46626', '#d89538'],
    stones: ['#5f473b', '#805e47', '#a47c58', '#bd966b'],
    particle: { colors: ['#d9822b', '#c4561d', '#e8b33a', '#8f3b1b'], rate: 14, size: [4, 8], fall: 70 },
  },
  {
    id: 'winter', name: 'Winter', icon: '❄️', hint: 'Glatteis – du rutschst nach',
    speedMul: 1.05, gapMul: 1.1,
    path: [201, 215, 226], grass: [215, 229, 238], fog: [183, 201, 218],
    sky: [127, 153, 187], rim: [255, 231, 194], shadow: [36, 57, 77],
    foliage: ['#192f39', '#314a58', '#738da5', '#bdd1e2'],
    stones: ['#394950', '#586a73', '#81939e', '#a7b8c1'],
    particle: { colors: ['#ffffff'], rate: 40, size: [1.5, 4], fall: 90 },
  },
];

// Path surfaces: the first stretch is dirt, then each one lasts SURFACE_LEN[0]..[1] world units.
// bump = constant hop height; kick = random sideways stone hits (every [s], impulse [u/s]).
export const SURFACE_FIRST = 150;
export const SURFACE_LEN = [120, 220];
export const SURFACES = {
  dirt: { id: 'dirt', icon: '🟤', name: 'Erde', hint: 'Fester Boden', speedMul: 1, bump: 0, kick: null },
  gravel: {
    id: 'gravel', icon: '🪨', name: 'Schotter', hint: 'Holprig – du hoppelst', speedMul: 1, bump: 0.12,
    kick: { every: [0.12, 0.3], impulse: [0.8, 1.6] },
  },
  grass: { id: 'grass', icon: '🌱', name: 'Gras', hint: 'Bremst dich ab', speedMul: 0.9, bump: 0, kick: null },
};
export const SURFACE_ORDER = ['dirt', 'gravel', 'grass'];

// Each power-up has its own color, so you can tell them apart from far away.
export const POWERUPS = {
  helmet: { id: 'helmet', img: 'assets/powerups/helmet.webp', icon: '⛑️', name: 'Helm', hint: 'Übersteht einen Crash', duration: 0, color: '#e23b3b', glow: '255,90,80' },
  slowmo: { id: 'slowmo', img: 'assets/powerups/slowmo.webp', icon: '⏳', name: 'Zeitlupe', hint: 'Alles langsamer', duration: 5, color: '#2f7de1', glow: '90,160,255' },
  widen: { id: 'widen', img: 'assets/powerups/widen.webp', icon: '↔️', name: 'Breite Lücken', hint: 'Lücken größer', duration: 7, color: '#1f9d55', glow: '80,220,140' },
};
export const MAX_HELMETS = 3;
export const POWERUP_CHANCE = 0.3;

// Cloudflare Worker: ideas → GitHub issues, shared leaderboard (see worker/)
export const WORKER_URL = 'https://roll-down-ideas.roll-down-ideas.workers.dev';
