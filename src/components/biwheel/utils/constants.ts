/**
 * BiWheel Constants
 * Symbols, colors, and definitions for the synastry biwheel chart
 */

// Zodiac signs with symbols (using Unicode with text variation selector \uFE0E to prevent emoji rendering)
export const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '\u2648\uFE0E', short: 'ARI', element: 'fire' },
  { name: 'Taurus', symbol: '\u2649\uFE0E', short: 'TAU', element: 'earth' },
  { name: 'Gemini', symbol: '\u264A\uFE0E', short: 'GEM', element: 'air' },
  { name: 'Cancer', symbol: '\u264B\uFE0E', short: 'CAN', element: 'water' },
  { name: 'Leo', symbol: '\u264C\uFE0E', short: 'LEO', element: 'fire' },
  { name: 'Virgo', symbol: '\u264D\uFE0E', short: 'VIR', element: 'earth' },
  { name: 'Libra', symbol: '\u264E\uFE0E', short: 'LIB', element: 'air' },
  { name: 'Scorpio', symbol: '\u264F\uFE0E', short: 'SCO', element: 'water' },
  { name: 'Sagittarius', symbol: '\u2650\uFE0E', short: 'SAG', element: 'fire' },
  { name: 'Capricorn', symbol: '\u2651\uFE0E', short: 'CAP', element: 'earth' },
  { name: 'Aquarius', symbol: '\u2652\uFE0E', short: 'AQU', element: 'air' },
  { name: 'Pisces', symbol: '\u2653\uFE0E', short: 'PIS', element: 'water' },
] as const;

// Planet definitions with symbols and colors (using Unicode with text variation selector \uFE0E)
// Colors based on traditional astrological associations
export const PLANETS = {
  sun: { symbol: '\u2609\uFE0E', name: 'Sun', category: 'luminary', color: '#FFB300' }, // Golden yellow
  moon: { symbol: '\u263D\uFE0E', name: 'Moon', category: 'luminary', color: '#9E9E9E' }, // Silver/gray
  mercury: { symbol: '\u263F\uFE0E', name: 'Mercury', category: 'personal', color: '#FDD835' }, // Yellow (Gemini)
  venus: { symbol: '\u2640\uFE0E', name: 'Venus', category: 'personal', color: '#F48FB1' }, // Pink (Libra)
  mars: { symbol: '\u2642\uFE0E', name: 'Mars', category: 'personal', color: '#E53935' }, // Red (Aries)
  jupiter: { symbol: '\u2643\uFE0E', name: 'Jupiter', category: 'social', color: '#7E57C2' }, // Purple (Sagittarius)
  saturn: { symbol: '\u2644\uFE0E', name: 'Saturn', category: 'social', color: '#5D4037' }, // Brown/charcoal (Capricorn)
  uranus: { symbol: '\u2645\uFE0E', name: 'Uranus', category: 'outer', color: '#42A5F5' }, // Electric blue (Aquarius)
  neptune: { symbol: '\u2646\uFE0E', name: 'Neptune', category: 'outer', color: '#4DD0E1' }, // Aquamarine (Pisces)
  pluto: { symbol: '\u2647\uFE0E', name: 'Pluto', category: 'outer', color: '#212121' }, // Black (Scorpio)
  northnode: { symbol: '\u260A\uFE0E', name: 'N.Node', category: 'node', color: '#607D8B' }, // Blue-gray
  southnode: { symbol: '\u260B\uFE0E', name: 'S.Node', category: 'node', color: '#78909C' }, // Lighter blue-gray
  chiron: { symbol: '\u26B7\uFE0E', name: 'Chiron', category: 'asteroid', color: '#8D6E63' }, // Earth brown
  lilith: { symbol: '\u26B8\uFE0E', name: 'Lilith', category: 'asteroid', color: '#880E4F' }, // Dark magenta
  juno: { symbol: '\u26B5\uFE0E', name: 'Juno', category: 'asteroid', color: '#AD1457' }, // Deep pink
  ceres: { symbol: '\u26B3\uFE0E', name: 'Ceres', category: 'asteroid', color: '#43A047' }, // Green (Taurus)
  pallas: { symbol: '\u26B4\uFE0E', name: 'Pallas', category: 'asteroid', color: '#00838F' }, // Teal
  vesta: { symbol: '\u26B6\uFE0E', name: 'Vesta', category: 'asteroid', color: '#FF6F00' }, // Orange (Virgo)
  ascendant: { symbol: 'AC', name: 'Ascendant', category: 'angle', color: '#000000' }, // Black
  midheaven: { symbol: 'MC', name: 'Midheaven', category: 'angle', color: '#000000' }, // Black
} as const;

// Planet visibility groups
export const PLANET_GROUPS = {
  core: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'northnode', 'southnode'],
  outer: ['uranus', 'neptune', 'pluto'],
  asteroids: ['chiron', 'lilith', 'juno', 'ceres', 'pallas', 'vesta'],
  angles: ['ascendant', 'midheaven'],
} as const;

// Extended asteroids (for optional inclusion via API)
// Using first 5 letters of asteroid name for labels (smaller font in PlanetRing)
export const ASTEROIDS = {
  // Major Asteroids (Main Belt)
  astraea: { symbol: 'Astra', name: 'Astraea', color: '#9C27B0', group: 'major', description: 'Continuity Resurfacing. Embodies the re-emergence of threads thought finished, persistence not purity.' },
  hebe: { symbol: 'Hebe', name: 'Hebe', color: '#E91E63', group: 'major', description: 'Background Becomes Backbone. Source of ordinary common meteorites on Earth. She disperses until she is woven into daily fabric.' },
  iris: { symbol: 'Iris', name: 'Iris', color: '#FF9800', group: 'major', description: 'The Mirror That Exposes. Brightest main-belt asteroid, high albedo, highly reflective. She is clarity and exposure without transformation.' },
  flora: { symbol: 'Flora', name: 'Flora', color: '#4CAF50', group: 'major', description: 'Propagation through Fragmentation and Dispersal. Her fragments scatter into the belt and onto Earth, embedding her into wider realms.' },
  metis: { symbol: 'Metis', name: 'Metis', color: '#607D8B', group: 'major', description: 'The Reflective Scout. Trial-and-error exploration, mirroring what is found so it can be refined.' },
  eunomia: { symbol: 'Eunom', name: 'Eunomia', color: '#795548', group: 'major', description: 'Functional Order. Systems that align and work by design.' },
  psyche: { symbol: 'Psych', name: 'Psyche', color: '#9C27B0', group: 'major', description: 'Core Material. Metallic asteroid, exposed essence.' },
  euphrosyne: { symbol: 'Euphr', name: 'Euphrosyne', color: '#F06292', group: 'major', description: 'Divergent Continuity. A dark, high-inclination asteroid that spawned her own family from collision. She creates lineages from being off-plane.' },
  europa: { symbol: 'Europ', name: 'Europa', color: '#2196F3', group: 'major', description: 'Steadfast Continuity. Smooth orbit, absorber of energy, stability after upheaval.' },
  cybele: { symbol: 'Cybel', name: 'Cybele', color: '#8D6E63', group: 'major', description: 'The Threshold. The edge between the belt and Jupiter\'s pull, liminality itself. Not about mothering, but about standing at the doorway between systems.' },
  sylvia: { symbol: 'Sylvi', name: 'Sylvia', color: '#00BCD4', group: 'major', description: 'Fragmentary Cohesion. Rubble pile with moons, a system of fragments.' },
  thisbe: { symbol: 'Thisb', name: 'Thisbe', color: '#F48FB1', group: 'major', description: 'Silent Presence. She represents constancy without attention, presence that matters by existing quietly rather than declaring itself.' },
  minerva: { symbol: 'Miner', name: 'Minerva', color: '#3F51B5', group: 'major', description: 'Collective Wisdom. Wisdom that comes from holding multiple orbits in balance (her two moons), a coordinated system. Intelligence is not singular, it\'s distributed.' },
  elektra: { symbol: 'Elekt', name: 'Elektra', color: '#FFC107', group: 'major', description: 'Center of Complexity. A main-belt asteroid with three moons, a hub that holds a miniature system together. She encodes invisible coordination, hidden labor, the architecture that balances multiplicity.' },
  kleopatra: { symbol: 'Kleop', name: 'Kleopatra', color: '#673AB7', group: 'major', description: 'Bridgework. The dog-bone asteroid that stays whole by spinning and coordinating two moons. It\'s architecture under stress, fragments connected by engineering.' },
  bamberga: { symbol: 'Bambe', name: 'Bamberga', color: '#795548', group: 'major', description: 'Sudden Illumination. Eccentric orbit, cycles of faintness and brilliance. Revelation in bursts, not constant light.' },
  davida: { symbol: 'David', name: 'Davida', color: '#607D8B', group: 'major', description: 'Observation Before Action. Distance, patience, rhythm of scanning.' },
  interamnia: { symbol: 'Inter', name: 'Interamnia', color: '#455A64', group: 'major', description: 'Unaltered Foundations. A massive stabilizer in the belt.' },
  hygeia: { symbol: 'Hygei', name: 'Hygeia', color: '#66BB6A', group: 'major', description: 'Living With Scars. Persistence and continuity within imperfection.' },

  // Love & Relationship
  eros: { symbol: 'Eros', name: 'Eros', color: '#E91E63', group: 'love', description: 'Vital Spark. The magnetic draw that initiates motion.' },
  fama: { symbol: 'Fama', name: 'Fama', color: '#FFC107', group: 'love', description: 'Resonance Echo. How signals amplify and repeat.' },

  // Near-Earth & Special
  icarus: { symbol: 'Icaru', name: 'Icarus', color: '#FF5722', group: 'near_earth', description: 'Perilous Reach. A tiny asteroid with one of the most eccentric orbits, plunging inside Mercury\'s path, then racing back out. He encodes overextension, giving too much, exposing too far\u2014and then retreating.' },
  toro: { symbol: 'Toro', name: 'Toro', color: '#D32F2F', group: 'near_earth', description: 'Resonant Return. He embodies recurrence\u2014people, ideas, technologies that leave and return.' },
  ganymed: { symbol: 'Ganym', name: 'Ganymed', color: '#7B1FA2', group: 'near_earth', description: 'Outsider Perspective. An outsider vantage point\u2014clarity from proximity.' },
  apophis: { symbol: 'Apoph', name: 'Apophis', color: '#B71C1C', group: 'near_earth', description: 'Imminent Disruption. Destabilization cycles, orbital threat energy.' },

  // Centaurs
  pholus: { symbol: 'Pholu', name: 'Pholus', color: '#795548', group: 'centaurs', description: 'Cascade Trigger. Tipping points destabilizing the whole.' },
  nessus: { symbol: 'Nessu', name: 'Nessus', color: '#4E342E', group: 'centaurs', description: 'Toxic Entanglement. Repeating destructive loops.' },
  nyx: { symbol: 'Nyx', name: 'Nyx', color: '#1A237E', group: 'centaurs', description: 'Threshold of Doubt. Small near-Earth asteroid, boundary of visibility. Represents fertile uncertainty, the night as recalibration.' },

  // Trans-Neptunian Objects
  eris: { symbol: 'Eris', name: 'Eris', color: '#B71C1C', group: 'tno', description: 'Discordant Awakening. Forcing awareness of excluded truths.' },
  sedna: { symbol: 'Sedna', name: 'Sedna', color: '#0D47A1', group: 'tno', description: 'Extreme Isolation. Survival at orbital exile.' },
  makemake: { symbol: 'Makem', name: 'Makemake', color: '#F9A825', group: 'tno', description: 'The Source Code. Primordial order preserved.' },
  haumea: { symbol: 'Haume', name: 'Haumea', color: '#43A047', group: 'tno', description: 'Evolutionary Renewal. Rapid regeneration, clearing and replacing.' },
  quaoar: { symbol: 'Quaoa', name: 'Quaoar', color: '#00695C', group: 'tno', description: 'Anchor in the Fog. Order maintained in chaotic outer belt.' },
  varuna: { symbol: 'Varun', name: 'Varuna', color: '#1565C0', group: 'tno', description: 'Impressive Order. Systemic reach and continuity.' },
  ixion: { symbol: 'Ixion', name: 'Ixion', color: '#880E4F', group: 'tno', description: 'Lawless Momentum. Breaking systemic rules through chaotic orbit.' },
  orcus: { symbol: 'Orcus', name: 'Orcus', color: '#212121', group: 'tno', description: 'Binding Agreements. Contracts that weigh regardless of outcome.' },
  gonggong: { symbol: 'Gongg', name: 'Gonggong', color: '#1A237E', group: 'tno', description: 'Exiled Catalyst. Encodes cycles of absence, displacement, and return\u2014exile as a catalyst for rediscovery.' },
  salacia: { symbol: 'Salac', name: 'Salacia', color: '#00BCD4', group: 'tno', description: 'Shared Gravity. Balanced pull, bonds that endure across distance, connection through co-orbit rather than dominance.' },
  varda: { symbol: 'Varda', name: 'Varda', color: '#7B1FA2', group: 'tno', description: 'Hidden Sovereignty. Quiet rulership, unseen presence, sovereignty that others orbit without realizing.' },

  // Fate & Karmic
  nemesis: { symbol: 'Nemes', name: 'Nemesis', color: '#795548', group: 'fate', description: 'The Inevitable Reckoning. Systemic correction without vengeance.' },

  // Lunar Points (calculated)
  truelilith: { symbol: 'Lil(o)', name: 'True Lilith', color: '#880E4F', group: 'lunar', description: 'Raw feminine power, rejected self, primal instincts. Oscillating (true) lunar apogee.' },
  meanlilith: { symbol: 'MnLil', name: 'Mean Lilith', color: '#AD1457', group: 'lunar', description: 'Shadow self, repressed desires, what we exile. Mean lunar apogee.' },
  whitemoon: { symbol: 'WhtMn', name: 'White Moon', color: '#E0E0E0', group: 'lunar', description: 'Selena - pure intentions, spiritual gifts, grace. Lunar perigee.' },
  lilithast: { symbol: 'LilAs', name: 'Lilith (ast)', color: '#C2185B', group: 'lunar', description: 'Physical asteroid Lilith. Embodied dark feminine energy.' },

  // Calculated Points
  vertex: { symbol: 'Vertx', name: 'Vertex', color: '#9C27B0', group: 'points', description: 'Fated encounters, destiny point. Where fate meets free will.' },
  sophia: { symbol: 'Sophi', name: 'Sophia', color: '#7C4DFF', group: 'points', description: 'Divine wisdom, sacred feminine knowledge. Gnostic goddess.' },
} as const;

// Arabic Parts (Lots) - calculated client-side from ASC + Planet1 - Planet2
export const ARABIC_PARTS = {
  lot_fortune:  { symbol: '\u2295', name: 'Lot of Fortune', color: '#FFD700', group: 'arabic', description: 'General fortune and well-being. ASC + Moon - Sun.', formula: { add: 'moon', subtract: 'sun' } },
  lot_spirit:   { symbol: '\u2297', name: 'Lot of Spirit', color: '#B0BEC5', group: 'arabic', description: 'Will, consciousness, and purpose. ASC + Sun - Moon.', formula: { add: 'sun', subtract: 'moon' } },
  lot_eros:     { symbol: 'L.Er', name: 'Lot of Eros', color: '#E91E63', group: 'arabic', description: 'Desire, passion, and attraction. ASC + Venus - Mars.', formula: { add: 'venus', subtract: 'mars' } },
  lot_marriage: { symbol: 'L.Ma', name: 'Lot of Marriage', color: '#F48FB1', group: 'arabic', description: 'Partnership and union. ASC + Venus - Saturn.', formula: { add: 'venus', subtract: 'saturn' } },
  lot_wealth:   { symbol: 'L.We', name: 'Lot of Wealth', color: '#FF8F00', group: 'arabic', description: 'Prosperity and material resources. ASC + Jupiter - Saturn.', formula: { add: 'jupiter', subtract: 'saturn' } },
  lot_victory:  { symbol: 'L.Vi', name: 'Lot of Victory', color: '#FF6D00', group: 'arabic', description: 'Triumph and success. ASC + Jupiter - Spirit.', formula: { add: 'jupiter', subtract: 'lot_spirit' } },
  lot_commerce: { symbol: 'L.Co', name: 'Lot of Commerce', color: '#FDD835', group: 'arabic', description: 'Trade and communication skills. ASC + Mercury - Sun.', formula: { add: 'mercury', subtract: 'sun' } },
  lot_passion:  { symbol: 'L.Pa', name: 'Lot of Passion', color: '#D32F2F', group: 'arabic', description: 'Drive and intensity. ASC + Mars - Sun.', formula: { add: 'mars', subtract: 'sun' } },
  lot_mother:   { symbol: 'L.Mo', name: 'Lot of Mother', color: '#AB47BC', group: 'arabic', description: 'Maternal bond and nurturing. ASC + Moon - Venus.', formula: { add: 'moon', subtract: 'venus' } },
  lot_father:   { symbol: 'L.Fa', name: 'Lot of Father', color: '#5C6BC0', group: 'arabic', description: 'Paternal bond and authority. ASC + Saturn - Sun.', formula: { add: 'saturn', subtract: 'sun' } },
  lot_children: { symbol: 'L.Ch', name: 'Lot of Children', color: '#66BB6A', group: 'arabic', description: 'Offspring and creative legacy. ASC + Jupiter - Moon.', formula: { add: 'jupiter', subtract: 'moon' } },
  lot_travel:   { symbol: 'L.Tr', name: 'Lot of Travel', color: '#29B6F6', group: 'arabic', description: 'Journeys and exploration. ASC + Saturn - Mars.', formula: { add: 'saturn', subtract: 'mars' } },
} as const;

/** Set of all Arabic Part keys (for filtering from API calls) */
export const ARABIC_PART_KEYS = new Set(Object.keys(ARABIC_PARTS));

/** Calculate Arabic Parts from chart planet positions and ascendant */
export function calculateArabicParts(
  planets: Record<string, { longitude: number }>,
  ascendant: number
): Record<string, { longitude: number; sign: string; retrograde: boolean }> {
  const result: Record<string, { longitude: number; sign: string; retrograde: boolean }> = {};
  const normalize = (angle: number) => ((angle % 360) + 360) % 360;
  const getSign = (lng: number) => ZODIAC_SIGNS[Math.floor(lng / 30)]?.name || '';

  const calc = (add: string, subtract: string): number | null => {
    const addLong = planets[add]?.longitude ?? result[add]?.longitude;
    const subLong = planets[subtract]?.longitude ?? result[subtract]?.longitude;
    if (addLong === undefined || subLong === undefined) return null;
    return normalize(ascendant + addLong - subLong);
  };

  // Order matters: lot_spirit must be calculated before lot_victory
  const ordered: [string, string, string][] = [
    ['lot_fortune', 'moon', 'sun'],
    ['lot_spirit', 'sun', 'moon'],
    ['lot_eros', 'venus', 'mars'],
    ['lot_marriage', 'venus', 'saturn'],
    ['lot_wealth', 'jupiter', 'saturn'],
    ['lot_commerce', 'mercury', 'sun'],
    ['lot_passion', 'mars', 'sun'],
    ['lot_mother', 'moon', 'venus'],
    ['lot_father', 'saturn', 'sun'],
    ['lot_children', 'jupiter', 'moon'],
    ['lot_travel', 'saturn', 'mars'],
    ['lot_victory', 'jupiter', 'lot_spirit'], // depends on spirit
  ];

  for (const [key, add, subtract] of ordered) {
    const longitude = calc(add, subtract);
    if (longitude !== null) {
      result[key] = { longitude, sign: getSign(longitude), retrograde: false };
    }
  }

  return result;
}

// Asteroid group definitions for UI - matches ASTEROID_GROUPS in types.ts
export const ASTEROID_GROUP_INFO = {
  arabic: { name: 'Arabic Parts', color: '#FFD700', icon: '⊕' },
  major: { name: 'Main Belt', color: '#607D8B', icon: '⚫' },
  love: { name: 'Love', color: '#E91E63', icon: '♡' },
  near_earth: { name: 'Near-Earth', color: '#FF5722', icon: '☄' },
  centaurs: { name: 'Centaurs', color: '#795548', icon: '⚷' },
  tno: { name: 'Trans-Neptunian', color: '#1565C0', icon: '⯰' },
  fate: { name: 'Fate', color: '#795548', icon: '☸' },
  lunar: { name: 'Lunar Points', color: '#9E9E9E', icon: '☽' },
  points: { name: 'Calc. Points', color: '#9C27B0', icon: '⊕' },
} as const;

// Default visible planets
export const DEFAULT_VISIBLE_PLANETS = new Set([
  ...PLANET_GROUPS.core,
  ...PLANET_GROUPS.outer,
  ...PLANET_GROUPS.asteroids,
  ...PLANET_GROUPS.angles,
]);

// Per-planet maximum orbs (effective orb = average of both planets' orbs)
export const PLANET_ORBS: Record<string, number> = {
  sun: 10,
  moon: 3,
  mercury: 3,
  venus: 6,
  mars: 4,
  jupiter: 8,
  saturn: 8,
  uranus: 5,
  neptune: 4,
  pluto: 3,
  northnode: 3,
  southnode: 3,
  chiron: 1,
  lilith: 1,
  juno: 1,
  ceres: 1,
  pallas: 1,
  vesta: 1,
  ascendant: 3,
  midheaven: 3,
};

// Default orb for asteroids/calculated points not listed above
export const DEFAULT_ASTEROID_ORB = 1;

// Get the orb for a planet (falls back to DEFAULT_ASTEROID_ORB for asteroids)
export function getPlanetOrb(planetKey: string): number {
  return PLANET_ORBS[planetKey.toLowerCase()] ?? DEFAULT_ASTEROID_ORB;
}

// Get effective orb for an aspect between two planets (average of both)
export function getEffectiveOrb(planetA: string, planetB: string): number {
  return (getPlanetOrb(planetA) + getPlanetOrb(planetB)) / 2;
}

// Aspect definitions (classic astrology colors)
export const ASPECTS = {
  conjunction: {
    name: 'Conjunction',
    symbol: '\u260C',
    angle: 0,
    orb: 8,
    color: '#daa520', // gold/orange
    nature: 'neutral',
    major: true,
  },
  sextile: {
    name: 'Sextile',
    symbol: '\u26B9',
    angle: 60,
    orb: 5,
    color: '#1e5aa8', // blue
    nature: 'harmonious',
    major: true,
  },
  square: {
    name: 'Square',
    symbol: '\u25A1',
    angle: 90,
    orb: 7,
    color: '#c41e3a', // red
    nature: 'challenging',
    major: true,
  },
  trine: {
    name: 'Trine',
    symbol: '\u25B3',
    angle: 120,
    orb: 7,
    color: '#00bcd4', // cyan/light blue
    nature: 'harmonious',
    major: true,
  },
  opposition: {
    name: 'Opposition',
    symbol: '\u260D',
    angle: 180,
    orb: 8,
    color: '#c41e3a', // red
    nature: 'challenging',
    major: true,
  },
  quincunx: {
    name: 'Quincunx',
    symbol: '\u26BB',
    angle: 150,
    orb: 3,
    color: '#228b22', // green
    nature: 'challenging',
    major: true,
  },
  semisextile: {
    name: 'Semi-sextile',
    symbol: '\u26BA',
    angle: 30,
    orb: 2,
    color: '#228b22', // green
    nature: 'neutral',
    major: true,
  },
  semisquare: {
    name: 'Semi-square',
    symbol: '\u2220',
    angle: 45,
    orb: 2,
    color: '#c41e3a', // red
    nature: 'challenging',
    major: true,
  },
  sesquiquadrate: {
    name: 'Sesquiquadrate',
    symbol: '\u26BC',
    angle: 135,
    orb: 2,
    color: '#c41e3a', // red
    nature: 'challenging',
    major: false,
  },
  // --- Additional minor aspects (off by default) ---
  adjunction: {
    name: 'Adjunction',
    symbol: '\u2221', // ∡ measured angle
    angle: 15,
    orb: 1,
    color: '#607D8B', // blue-gray
    nature: 'neutral',
    major: false,
  },
  decile: {
    name: 'Decile',
    symbol: 'D',
    angle: 36,
    orb: 1,
    color: '#9C27B0', // purple (quintile family)
    nature: 'harmonious',
    major: false,
  },
  novile: {
    name: 'Novile',
    symbol: 'N',
    angle: 40,
    orb: 1,
    color: '#FF8F00', // amber (novile family)
    nature: 'harmonious',
    major: false,
  },
  septile: {
    name: 'Septile',
    symbol: 'S\u2087', // S₇
    angle: 51.4286, // 360/7
    orb: 1,
    color: '#00897B', // teal (septile family)
    nature: 'neutral',
    major: false,
  },
  quintile: {
    name: 'Quintile',
    symbol: 'Q',
    angle: 72, // 360/5
    orb: 1,
    color: '#7B1FA2', // deep purple (quintile family)
    nature: 'harmonious',
    major: false,
  },
  binovile: {
    name: 'Bi-Novile',
    symbol: 'bN',
    angle: 80, // 2 × 360/9
    orb: 1,
    color: '#FF8F00', // amber (novile family)
    nature: 'harmonious',
    major: false,
  },
  biseptile: {
    name: 'Bi-Septile',
    symbol: 'bS\u2087', // bS₇
    angle: 102.8571, // 2 × 360/7
    orb: 1,
    color: '#00897B', // teal (septile family)
    nature: 'neutral',
    major: false,
  },
  biquintile: {
    name: 'Bi-Quintile',
    symbol: 'bQ',
    angle: 144, // 2 × 360/5
    orb: 1,
    color: '#7B1FA2', // deep purple (quintile family)
    nature: 'harmonious',
    major: false,
  },
  triseptile: {
    name: 'Tri-Septile',
    symbol: 'tS\u2087', // tS₇
    angle: 154.2857, // 3 × 360/7
    orb: 1,
    color: '#00897B', // teal (septile family)
    nature: 'neutral',
    major: false,
  },
  quadnovile: {
    name: 'Quad-Novile',
    symbol: 'qN',
    angle: 160, // 4 × 360/9
    orb: 1,
    color: '#FF8F00', // amber (novile family)
    nature: 'harmonious',
    major: false,
  },
  quindecile: {
    name: 'Quindecile',
    symbol: 'Qd',
    angle: 165,
    orb: 1,
    color: '#C2185B', // deep pink
    nature: 'challenging',
    major: false,
  },
} as const;

// Default visible aspects - no conjunction (clutters chart), no sesquiquadrate
export const DEFAULT_VISIBLE_ASPECTS = new Set([
  'sextile', 'square', 'trine', 'opposition',
  'quincunx', 'semisextile', 'semisquare'
]);

// Chart colors - mutable so applyTheme() can swap values in-place
// Person/composite/aspect colors are fixed; background/grid/text/element colors change with theme.
export const COLORS: Record<string, string> = {
  // Background
  background: '#ffffff',
  backgroundAlt: '#f8f9fa',
  backgroundAlt2: '#f0f0f0',

  // Grid/borders
  gridLine: '#000000',
  gridLineLight: '#333333',
  gridLineFaint: '#999999',

  // Person colors (fixed across themes)
  personA: '#cc0000',
  personALight: '#ff3333',
  personB: '#0066cc',
  personBLight: '#3399ff',

  // Composite chart accent color (fixed across themes)
  composite: '#8B5CF6',
  compositeLight: '#A78BFA',

  // Zodiac element colors (change with theme)
  fire: '#ff6600',
  earth: '#009933',
  air: '#cc9900',
  water: '#0099cc',

  // Text
  textPrimary: '#000000',
  textSecondary: '#333333',
  textMuted: '#666666',
};

import { THEMES, type ThemeName } from './themes';

/** Mutate COLORS in-place from the given theme preset */
export function applyTheme(theme: ThemeName): void {
  const t = THEMES[theme];
  COLORS.background = t.background;
  COLORS.backgroundAlt = t.backgroundAlt;
  COLORS.backgroundAlt2 = t.backgroundAlt2;
  COLORS.gridLine = t.gridLine;
  COLORS.gridLineLight = t.gridLineLight;
  COLORS.gridLineFaint = t.gridLineFaint;
  COLORS.textPrimary = t.textPrimary;
  COLORS.textSecondary = t.textSecondary;
  COLORS.textMuted = t.textMuted;
  COLORS.fire = t.fire;
  COLORS.earth = t.earth;
  COLORS.air = t.air;
  COLORS.water = t.water;
}

/** Get element color at render time (reads current COLORS) */
export function getElementColor(element: string): string {
  return COLORS[element] || COLORS.textPrimary;
}

/** Get element background color at render time (reads current theme) */
let _currentTheme: ThemeName = 'classic';
export function setCurrentThemeName(name: ThemeName) { _currentTheme = name; }

export function getElementBgColor(element: string): string {
  const t = THEMES[_currentTheme];
  return t.elementBg[element as keyof typeof t.elementBg] || COLORS.backgroundAlt;
}

export function getElementBgLightColor(element: string): string {
  const t = THEMES[_currentTheme];
  return t.elementBgLight[element as keyof typeof t.elementBgLight] || COLORS.backgroundAlt;
}

// Planets whose colors are near-black and unreadable on dark backgrounds
const DARK_THEME_PLANET_OVERRIDES: Record<string, string> = {
  pluto: '#B0B0B0',
  ascendant: '#E0E0E0',
  midheaven: '#D0D0D0',
  // Dark asteroids brightened for visibility
  orcus: '#9E9E9E',
  gonggong: '#5C6BC0',
  sedna: '#42A5F5',
  quaoar: '#4DB6AC',
  varuna: '#64B5F6',
  nemesis: '#A1887F',
  ixion: '#E91E63',
  truelilith: '#E91E63',
  meanlilith: '#F06292',
};

const DARK_THEMES: Set<ThemeName> = new Set(['dark', 'midnight', 'cosmic', 'forest', 'sunset', 'ocean']);

/** Get person color that's visible on dark backgrounds */
export function getThemeAwarePersonColor(person: 'A' | 'B'): string {
  if (DARK_THEMES.has(_currentTheme)) {
    return person === 'A' ? COLORS.personALight : COLORS.personBLight;
  }
  return person === 'A' ? COLORS.personA : COLORS.personB;
}

/** Get planet/asteroid color with dark-theme override for near-black planets */
export function getThemeAwarePlanetColor(key: string): string {
  const planet = PLANETS[key as keyof typeof PLANETS];
  let color: string = planet?.color ?? '';
  if (!color) {
    const asteroid = ASTEROIDS[key as keyof typeof ASTEROIDS];
    color = asteroid?.color ?? '';
  }
  if (!color) {
    const part = ARABIC_PARTS[key as keyof typeof ARABIC_PARTS];
    color = part?.color ?? '#a78bfa';
  }
  if (DARK_THEMES.has(_currentTheme)) {
    const override = DARK_THEME_PLANET_OVERRIDES[key];
    if (override) return override;
  }
  return color;
}

// Chart dimensions (relative to size)
export const CHART_DIMENSIONS = {
  // Outer margin (extra space for AC/DC/MC/IC labels outside)
  margin: 35,

  // Zodiac ring
  zodiacWidth: 45,

  // House ring (between planets and aspects)
  houseRingWidth: 20,

  // Planet ring spacing
  planetRingGap: 45,
  planetRingWidth: 55,

  // Inner circle for aspects
  innerMargin: 25,

  // Planet circle sizes
  planetRadius: 12,
  planetRadiusHover: 15,

  // Degree marker length
  degreeMarkerLength: 5,
  degreeMarker5Length: 8,
} as const;
