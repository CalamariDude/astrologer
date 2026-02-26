/**
 * Galactic Mode Constants
 * Layout parameters, sizes, colors, and presets for the 3D visualization
 */

import type { CameraPreset } from './types';

/** 3D layout radii and sizes */
export const LAYOUT = {
  zodiacRingInner: 9.5,
  zodiacRingOuter: 10.8,
  houseSectorRadius: 9.5,

  planetSizes: {
    luminary: 0.45,
    personal: 0.32,
    social: 0.38,
    outer: 0.28,
    node: 0.2,
    point: 0.22,
    asteroid: 0.16,
    angle: 0.14,
  } as Record<string, number>,

  glowScale: 6,
  labelOffsetY: 1.0,
  orbScale: 0.12,
  auraSpriteFactor: 3.5,
} as const;

/**
 * Per-planet orbital radii — realistic spacing like a solar system orrery.
 * Sun and Moon near center, personals spread out, socials further, outers near the zodiac ring.
 */
export const PLANET_ORBIT_RADII: Record<string, number> = {
  sun: 2.5,
  moon: 3.2,
  mercury: 3.9,
  venus: 4.6,
  mars: 5.4,
  ceres: 5.8,
  jupiter: 6.3,
  pallas: 6.4,
  juno: 6.6,
  saturn: 6.8,
  chiron: 7.0,
  northnode: 7.2,
  southnode: 7.2,
  uranus: 7.4,
  lilith: 7.6,
  neptune: 7.8,
  pluto: 8.0,
  vesta: 5.6,
};

/** Default radius for unlisted planets/asteroids */
export const DEFAULT_ORBIT_RADIUS = 8.0;

/**
 * Orbital zones for asteroid groups — [minRadius, maxRadius].
 * Asteroids are distributed within their zone based on longitude hash.
 */
export const ASTEROID_ORBIT_ZONES: Record<string, [number, number]> = {
  major: [5.5, 6.15],      // Main belt between Mars and Jupiter
  love: [5.3, 5.7],        // Inner belt region
  near_earth: [3.5, 5.0],  // Between inner planets and Mars
  centaurs: [7.0, 7.3],    // Between Saturn and Uranus
  tno: [7.5, 7.9],         // Beyond Neptune
  fate: [6.0, 6.2],        // Belt edge
  lunar: [3.0, 3.5],       // Near Moon's orbit
  arabic: [4.2, 5.2],      // Spread through inner region
  points: [2.0, 3.0],      // Near center
};

/** The main asteroid belt visual bounds (for dust ring rendering) */
export const ASTEROID_BELT = {
  innerRadius: 5.45,
  outerRadius: 6.2,
} as const;

export const CAMERA = {
  defaultPosition: [0, 18, 22] as [number, number, number],
  defaultTarget: [0, 0, 0] as [number, number, number],
  fov: 50,
  near: 0.1,
  far: 500,
  zoomMin: 6,
  zoomMax: 50,
  autoRotateSpeed: 0.12,
  dampingFactor: 0.08,
} as const;

export const CAMERA_PRESETS: CameraPreset[] = [
  { name: 'Overview', position: [0, 18, 22], target: [0, 0, 0], fov: 50 },
  { name: 'Top Down', position: [0, 30, 0.1], target: [0, 0, 0], fov: 50 },
  { name: 'Horizon', position: [0, 3, 24], target: [0, 0, 0], fov: 50 },
  { name: 'Close Up', position: [0, 10, 12], target: [0, 0, 0], fov: 40 },
];

/** Per-sign zodiacal colors — traditional associations, bright enough for dark backgrounds */
export const SIGN_COLORS_3D: Record<string, string> = {
  Aries: '#E53935',       // Bold red
  Taurus: '#66BB6A',      // Earthy green-pink
  Gemini: '#FDD835',      // Vibrant yellow
  Cancer: '#F5E6CA',      // Warm lunar cream-gold
  Leo: '#FFB300',         // Radiant gold
  Virgo: '#8D6E63',       // Warm brown
  Libra: '#F48FB1',       // Soft pink
  Scorpio: '#B71C1C',     // Deep burgundy-red
  Sagittarius: '#9C27B0', // Rich purple
  Capricorn: '#D4C088',   // Saturn ring gold-brown
  Aquarius: '#00E5FF',    // Electric blue-turquoise
  Pisces: '#80CBC4',      // Seafoam green-lavender
};

/** Ordered sign names for neighbor lookups */
export const SIGN_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

/** Sign symbols indexed by sign order (0=Aries..11=Pisces) */
export const SIGN_SYMBOLS = [
  '\u2648\uFE0E', '\u2649\uFE0E', '\u264A\uFE0E', '\u264B\uFE0E',
  '\u264C\uFE0E', '\u264D\uFE0E', '\u264E\uFE0E', '\u264F\uFE0E',
  '\u2650\uFE0E', '\u2651\uFE0E', '\u2652\uFE0E', '\u2653\uFE0E',
] as const;

/** Dark groove width in degrees at each sign boundary */
export const CUSP_BLEND_DEGREES = 3;

/** Planet speed hierarchy — faster planets listed first (energy flows from fast → slow) */
export const PLANET_SPEED_ORDER: Record<string, number> = {
  moon: 0, mercury: 1, venus: 2, sun: 3, mars: 4, jupiter: 5,
  saturn: 6, uranus: 7, neptune: 8, pluto: 9,
  northnode: 10, southnode: 10, chiron: 8, lilith: 8,
};

/**
 * Real Keplerian orbital elements for each planet.
 * Used for drawing elliptical orbit paths and computing transit motion.
 * - eccentricity: orbital eccentricity (0 = circle, 1 = parabola)
 * - perihelionLong: longitude of perihelion in degrees (orients the ellipse)
 * - meanDailyMotion: average geocentric daily motion in degrees/day
 */
export const PLANET_ORBITAL_ELEMENTS: Record<string, {
  eccentricity: number;
  perihelionLong: number;
  meanDailyMotion: number;
}> = {
  sun:       { eccentricity: 0.0167, perihelionLong: 102.9,  meanDailyMotion: 0.9856 },
  moon:      { eccentricity: 0.0549, perihelionLong: 0,      meanDailyMotion: 13.176 },
  mercury:   { eccentricity: 0.2056, perihelionLong: 77.46,  meanDailyMotion: 1.38 },
  venus:     { eccentricity: 0.0068, perihelionLong: 131.53, meanDailyMotion: 1.20 },
  mars:      { eccentricity: 0.0934, perihelionLong: 336.04, meanDailyMotion: 0.524 },
  jupiter:   { eccentricity: 0.0484, perihelionLong: 14.33,  meanDailyMotion: 0.0831 },
  saturn:    { eccentricity: 0.0539, perihelionLong: 93.06,  meanDailyMotion: 0.0335 },
  uranus:    { eccentricity: 0.0473, perihelionLong: 173.01, meanDailyMotion: 0.0117 },
  neptune:   { eccentricity: 0.0086, perihelionLong: 48.12,  meanDailyMotion: 0.006 },
  pluto:     { eccentricity: 0.2488, perihelionLong: 224.07, meanDailyMotion: 0.004 },
  chiron:    { eccentricity: 0.3792, perihelionLong: 339.0,  meanDailyMotion: 0.0194 },
  northnode: { eccentricity: 0,      perihelionLong: 0,      meanDailyMotion: -0.0529 },
  southnode: { eccentricity: 0,      perihelionLong: 0,      meanDailyMotion: -0.0529 },
  lilith:    { eccentricity: 0,      perihelionLong: 0,      meanDailyMotion: 0.1114 },
  ceres:     { eccentricity: 0.0758, perihelionLong: 73.6,   meanDailyMotion: 0.214 },
  juno:      { eccentricity: 0.2563, perihelionLong: 248.4,  meanDailyMotion: 0.225 },
  pallas:    { eccentricity: 0.2312, perihelionLong: 310.1,  meanDailyMotion: 0.213 },
  vesta:     { eccentricity: 0.0887, perihelionLong: 151.2,  meanDailyMotion: 0.271 },
  // ── Main Belt ──
  astraea:     { eccentricity: 0.191, perihelionLong: 234,  meanDailyMotion: 0.239 },
  hebe:        { eccentricity: 0.202, perihelionLong: 239,  meanDailyMotion: 0.261 },
  iris:        { eccentricity: 0.230, perihelionLong: 146,  meanDailyMotion: 0.267 },
  flora:       { eccentricity: 0.156, perihelionLong: 285,  meanDailyMotion: 0.302 },
  metis:       { eccentricity: 0.122, perihelionLong: 6,    meanDailyMotion: 0.267 },
  eunomia:     { eccentricity: 0.187, perihelionLong: 98,   meanDailyMotion: 0.229 },
  psyche:      { eccentricity: 0.140, perihelionLong: 228,  meanDailyMotion: 0.198 },
  euphrosyne:  { eccentricity: 0.228, perihelionLong: 63,   meanDailyMotion: 0.178 },
  europa:      { eccentricity: 0.100, perihelionLong: 343,  meanDailyMotion: 0.175 },
  cybele:      { eccentricity: 0.105, perihelionLong: 98,   meanDailyMotion: 0.155 },
  sylvia:      { eccentricity: 0.084, perihelionLong: 266,  meanDailyMotion: 0.151 },
  thisbe:      { eccentricity: 0.164, perihelionLong: 36,   meanDailyMotion: 0.214 },
  minerva:     { eccentricity: 0.142, perihelionLong: 4,    meanDailyMotion: 0.215 },
  elektra:     { eccentricity: 0.212, perihelionLong: 234,  meanDailyMotion: 0.180 },
  kleopatra:   { eccentricity: 0.253, perihelionLong: 180,  meanDailyMotion: 0.211 },
  bamberga:    { eccentricity: 0.340, perihelionLong: 43,   meanDailyMotion: 0.225 },
  davida:      { eccentricity: 0.186, perihelionLong: 339,  meanDailyMotion: 0.175 },
  interamnia:  { eccentricity: 0.153, perihelionLong: 96,   meanDailyMotion: 0.184 },
  hygeia:      { eccentricity: 0.117, perihelionLong: 316,  meanDailyMotion: 0.177 },
  // ── Love & Relationship ──
  eros:        { eccentricity: 0.223, perihelionLong: 122,  meanDailyMotion: 0.560 },
  fama:        { eccentricity: 0.170, perihelionLong: 210,  meanDailyMotion: 0.290 },
  // ── Near-Earth ──
  icarus:      { eccentricity: 0.827, perihelionLong: 88,   meanDailyMotion: 0.881 },
  toro:        { eccentricity: 0.436, perihelionLong: 274,  meanDailyMotion: 0.617 },
  ganymed:     { eccentricity: 0.534, perihelionLong: 132,  meanDailyMotion: 0.227 },
  apophis:     { eccentricity: 0.191, perihelionLong: 126,  meanDailyMotion: 1.112 },
  // ── Centaurs ──
  pholus:      { eccentricity: 0.571, perihelionLong: 355,  meanDailyMotion: 0.0107 },
  nessus:      { eccentricity: 0.519, perihelionLong: 346,  meanDailyMotion: 0.0081 },
  nyx:         { eccentricity: 0.459, perihelionLong: 132,  meanDailyMotion: 0.345 },
  // ── Trans-Neptunian Objects ──
  eris:        { eccentricity: 0.436, perihelionLong: 151,  meanDailyMotion: 0.00177 },
  sedna:       { eccentricity: 0.843, perihelionLong: 311,  meanDailyMotion: 0.0000865 },
  makemake:    { eccentricity: 0.161, perihelionLong: 297,  meanDailyMotion: 0.00322 },
  haumea:      { eccentricity: 0.195, perihelionLong: 240,  meanDailyMotion: 0.00347 },
  quaoar:      { eccentricity: 0.039, perihelionLong: 147,  meanDailyMotion: 0.00342 },
  varuna:      { eccentricity: 0.054, perihelionLong: 271,  meanDailyMotion: 0.00350 },
  ixion:       { eccentricity: 0.241, perihelionLong: 300,  meanDailyMotion: 0.00394 },
  orcus:       { eccentricity: 0.226, perihelionLong: 73,   meanDailyMotion: 0.00399 },
  gonggong:    { eccentricity: 0.505, perihelionLong: 336,  meanDailyMotion: 0.00178 },
  salacia:     { eccentricity: 0.103, perihelionLong: 310,  meanDailyMotion: 0.00364 },
  varda:       { eccentricity: 0.143, perihelionLong: 184,  meanDailyMotion: 0.00318 },
  // ── Fate ──
  nemesis:     { eccentricity: 0.124, perihelionLong: 170,  meanDailyMotion: 0.227 },
  // ── Physical Asteroid Lilith ──
  lilithast:   { eccentricity: 0.148, perihelionLong: 42,   meanDailyMotion: 0.230 },
};

/** Ring configuration for planets with ring systems */
export const PLANET_RINGS: Record<string, { ringColor: string; ringTilt: number; ringSize: number }> = {
  saturn: { ringColor: '#D4C088', ringTilt: Math.PI * 0.42, ringSize: 2.2 },
  uranus: { ringColor: '#7FDBDB', ringTilt: Math.PI * 0.45, ringSize: 1.6 },
  chiron: { ringColor: '#8D6E63', ringTilt: Math.PI * 0.3, ringSize: 1.8 },
};

/**
 * Realistic planet colors for 3D rendering — overrides the biwheel chart colors.
 * These represent how the planets actually look, not astrological associations.
 */
export const PLANET_COLORS_3D: Record<string, string> = {
  sun: '#FFF4E0',       // Bright white-gold
  moon: '#C8C8C0',      // Gray with slight warmth
  mercury: '#A0A0A0',   // Rocky gray
  venus: '#E8D8A0',     // Pale yellowish cloud
  mars: '#C1440E',      // Rusty red-orange
  jupiter: '#C8A060',   // Banded tan-orange
  saturn: '#E8D088',    // Golden-beige
  uranus: '#80D8D8',    // Pale cyan-teal
  neptune: '#3060D0',   // Deep blue
  pluto: '#C0A878',     // Tan-brown
  chiron: '#8D7E6E',    // Gray-brown
  northnode: '#607D8B',
  southnode: '#78909C',
  lilith: '#880E4F',
  juno: '#AD1457',
  ceres: '#A8A098',     // Rocky gray-brown
  pallas: '#90A0A8',    // Blue-gray
  vesta: '#B0A090',     // Warm gray
  // ── Main Belt Asteroids ──
  astraea: '#B8A898',    // S-type stony gray-brown
  hebe: '#C0A888',       // S-type, high albedo, H chondrite source
  iris: '#D8C8A8',       // S-type, brightest main-belt asteroid
  flora: '#B0A090',      // S-type, Flora family parent
  metis: '#A8A0A0',      // S-type reflective gray
  eunomia: '#A89888',    // S-type, largest stony asteroid
  psyche: '#C8B8A0',     // M-type metallic iron-nickel
  euphrosyne: '#585050',  // Cb-type, very dark carbonaceous
  europa: '#686060',      // C-type dark carbonaceous
  cybele: '#585858',      // P-type primitive, outer belt
  sylvia: '#505050',      // X-type dark, rubble pile triple system
  thisbe: '#605858',      // B-type dark
  minerva: '#686868',     // C-type triple system
  elektra: '#505050',     // G-type dark, first triple asteroid
  kleopatra: '#B8B0A0',   // M-type metallic, dog-bone shape
  bamberga: '#504848',    // C-type dark, eccentric orbit
  davida: '#606060',      // C-type dark
  interamnia: '#585858',  // B/F-type dark primitive
  hygeia: '#585050',      // C-type dark, fourth largest asteroid
  // ── Love & Relationship ──
  eros: '#C0A080',        // S-type stony, peanut-shaped NEA
  fama: '#A8A098',        // Stony gray
  // ── Near-Earth ──
  icarus: '#A09888',      // S-type, sun-grazer
  toro: '#B0A090',        // S-type resonant
  ganymed: '#B8A888',     // S-type, largest near-Earth asteroid
  apophis: '#A09080',     // Sq-type near-Earth
  // ── Centaurs ──
  pholus: '#A04030',      // Extremely red surface (tholins/organic ices)
  nessus: '#805838',      // Dark reddish-brown
  nyx: '#888080',         // Small gray body
  // ── Trans-Neptunian Objects ──
  eris: '#E8E0D8',        // Bright methane frost surface
  sedna: '#C04020',       // Extremely red, tholin-coated
  makemake: '#D0C0A8',    // Reddish-brown, methane ice
  haumea: '#E0E0E0',      // Bright white, pure water ice
  quaoar: '#A06050',      // Red surface, tholins
  varuna: '#B04030',      // Very red, dark
  ixion: '#806060',       // Dark reddish plutino
  orcus: '#B0B0B0',       // Gray, water ice surface
  gonggong: '#C05030',    // Very red surface
  salacia: '#788090',     // Blue-gray, dark
  varda: '#B08868',       // Brownish-red
  // ── Fate & Karmic ──
  nemesis: '#686060',     // Dark C-type
  // ── Lunar Points ──
  truelilith: '#880E4F',  // Dark magenta
  meanlilith: '#AD1457',  // Deep pink
  whitemoon: '#E0E0E0',   // Silver-white
  lilithast: '#C2185B',   // Physical asteroid 1181 Lilith
  // ── Calculated Points ──
  vertex: '#9C27B0',      // Purple
  sophia: '#7C4DFF',      // Indigo
  // ── Arabic Parts ──
  lot_fortune: '#FFD700',
  lot_spirit: '#B0BEC5',
  lot_eros: '#E91E63',
  lot_marriage: '#F48FB1',
  lot_wealth: '#FF8F00',
  lot_victory: '#FF6D00',
  lot_commerce: '#FDD835',
  lot_passion: '#D32F2F',
  lot_mother: '#AB47BC',
  lot_father: '#5C6BC0',
  lot_children: '#66BB6A',
  lot_travel: '#29B6F6',
};

/**
 * Traditional decan rulers by triplicity.
 * Each sign's 3 decans (0-10°, 10-20°, 20-30°) are ruled by the 3 signs
 * of its element, rotating through them.
 * Index = sign index (0=Aries..11=Pisces), value = [decan1SignIdx, decan2SignIdx, decan3SignIdx]
 */
export const DECAN_RULERS: number[][] = [
  [0, 4, 8],    // Aries:       Aries, Leo, Sagittarius
  [1, 5, 9],    // Taurus:      Taurus, Virgo, Capricorn
  [2, 6, 10],   // Gemini:      Gemini, Libra, Aquarius
  [3, 7, 11],   // Cancer:      Cancer, Scorpio, Pisces
  [4, 8, 0],    // Leo:         Leo, Sagittarius, Aries
  [5, 9, 1],    // Virgo:       Virgo, Capricorn, Taurus
  [6, 10, 2],   // Libra:       Libra, Aquarius, Gemini
  [7, 11, 3],   // Scorpio:     Scorpio, Pisces, Cancer
  [8, 0, 4],    // Sagittarius: Sagittarius, Aries, Leo
  [9, 1, 5],    // Capricorn:   Capricorn, Taurus, Virgo
  [10, 2, 6],   // Aquarius:    Aquarius, Gemini, Libra
  [11, 3, 7],   // Pisces:      Pisces, Cancer, Scorpio
];

/** Modern planetary rulerships: sign → ruling planet key */
export const SIGN_RULERS: Record<string, string> = {
  Aries: 'mars',
  Taurus: 'venus',
  Gemini: 'mercury',
  Cancer: 'moon',
  Leo: 'sun',
  Virgo: 'mercury',
  Libra: 'venus',
  Scorpio: 'pluto',
  Sagittarius: 'jupiter',
  Capricorn: 'saturn',
  Aquarius: 'uranus',
  Pisces: 'neptune',
};

/** Reverse lookup: planet key → signs it rules */
export const PLANET_RULERSHIPS: Record<string, string[]> = {};
for (const [sign, ruler] of Object.entries(SIGN_RULERS)) {
  if (!PLANET_RULERSHIPS[ruler]) PLANET_RULERSHIPS[ruler] = [];
  PLANET_RULERSHIPS[ruler].push(sign);
}

export const TRANSITION = {
  fadeOutDuration: 200,
  fadeInDuration: 600,
  planetStagger: 40,
  aspectDelay: 400,
  particleDelay: 600,
} as const;

/** NASA-sourced planet data: descriptions, stats, and image URLs */
export const PLANET_NASA_DATA: Record<string, {
  description: string;
  diameter?: string;
  distance?: string;
  moons?: string;
  funFact?: string;
  imageUrl?: string;
  orbitalPeriod?: string;
  rotationPeriod?: string;
  mass?: string;
  gravity?: string;
  temperature?: string;
  atmosphere?: string;
  composition?: string;
  magneticField?: string;
  discoverer?: string;
  missions?: string[];
  surfaceFeatures?: string;
  mythology?: string;
  additionalFacts?: string[];
  classification?: string;
  density?: string;
  axialTilt?: string;
  escapeVelocity?: string;
  rings?: string;
}> = {
  sun: {
    description: 'The Sun is a G-type main-sequence star at the center of our solar system. It contains 99.86% of the total mass of the solar system. Its core temperature reaches 15 million degrees Celsius, fusing 600 million tons of hydrogen into helium every second.',
    diameter: '1,391,000 km',
    distance: '0 AU (center)',
    funFact: 'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/480px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
    orbitalPeriod: 'N/A (center of solar system)',
    rotationPeriod: '25.4 days (equator), 35 days (poles)',
    mass: '1.989 × 10³⁰ kg (333,000× Earth)',
    gravity: '274 m/s² (28× Earth)',
    temperature: '5,500°C surface, 15,000,000°C core',
    atmosphere: '73% hydrogen, 25% helium, 2% heavier elements',
    composition: 'Hydrogen plasma core fusing hydrogen into helium at 600 million tons/second',
    magneticField: 'Complex field that reverses polarity every 11 years (solar cycle)',
    discoverer: 'Known since prehistory',
    missions: ['Parker Solar Probe (2018–)', 'Solar Orbiter (2020–)', 'SDO (2010–)', 'SOHO (1995–)', 'Genesis (2001–04)'],
    surfaceFeatures: 'Sunspots, solar flares, coronal mass ejections, prominences, granulation cells, coronal holes',
    mythology: 'Sol (Roman), Helios/Apollo (Greek), Ra (Egyptian), Surya (Hindu) — the supreme light-giver, source of all life',
    additionalFacts: ['The Sun loses 4 million tons of mass every second through nuclear fusion.', 'In ~5 billion years the Sun will expand into a red giant engulfing Mercury and Venus.', 'The solar wind creates a bubble (heliosphere) extending far past Pluto.', 'Light from the Sun\'s core takes ~100,000 years to reach its surface, then 8 min to reach Earth.'],
    classification: 'G2V yellow dwarf main-sequence star',
    density: '1.41 g/cm³',
    escapeVelocity: '617.7 km/s',
  },
  moon: {
    description: 'Earth\'s only natural satellite, the Moon is the fifth-largest satellite in the solar system. Its gravitational influence produces Earth\'s tides and slightly lengthens Earth\'s day. The Moon\'s surface preserves a record of 4.5 billion years of cosmic history.',
    diameter: '3,474 km',
    distance: '384,400 km from Earth',
    moons: 'N/A',
    funFact: 'The Moon is slowly moving away from Earth at a rate of about 3.8 cm per year.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/480px-FullMoon2010.jpg',
    orbitalPeriod: '27.3 days (sidereal)',
    rotationPeriod: '27.3 days (tidally locked — same face always toward Earth)',
    mass: '7.342 × 10²² kg (1.2% of Earth)',
    gravity: '1.62 m/s² (16.6% of Earth)',
    temperature: '−173°C (night) to 127°C (day)',
    atmosphere: 'Essentially none — thin exosphere of sodium, potassium, helium, argon',
    composition: 'Iron-rich core (330 km), silicate mantle, anorthosite crust',
    magneticField: 'No global field; localized crustal magnetic anomalies',
    discoverer: 'Known since prehistory',
    missions: ['Apollo 11–17 (1969–72, 12 moonwalkers)', 'Artemis program (2022–)', 'Luna program (USSR, 1959–76)', 'Chang\'e (China, 2007–)', 'Chandrayaan (India, 2008–)'],
    surfaceFeatures: 'Maria (dark basaltic plains), highlands, impact craters (Tycho, Copernicus), rilles, South Pole–Aitken Basin (2,500 km — largest known impact crater)',
    mythology: 'Luna (Roman), Selene/Artemis (Greek), Chandra (Hindu), Thoth (Egyptian) — cycles, tides, feminine energy, the unconscious',
    additionalFacts: ['12 humans have walked on the Moon between 1969–1972.', 'The Moon was likely formed from debris after a Mars-sized body (Theia) struck early Earth 4.5 billion years ago.', 'Moonquakes can last for hours because there is no water to dampen seismic vibrations.', 'Permanently shadowed craters at the poles contain water ice deposits.'],
    density: '3.34 g/cm³',
    axialTilt: '1.5° to its orbit, 6.7° to the ecliptic',
    escapeVelocity: '2.38 km/s',
  },
  mercury: {
    description: 'Mercury is the smallest planet in our solar system and the closest to the Sun. Despite being nearest to the Sun, it is not the hottest planet. Mercury has a massive iron core that makes up about 85% of its radius, and its surface is heavily cratered, resembling our Moon.',
    diameter: '4,879 km',
    distance: '0.39 AU',
    moons: '0',
    funFact: 'A day on Mercury (sunrise to sunrise) lasts 176 Earth days.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mercury_in_true_color.jpg/480px-Mercury_in_true_color.jpg',
    orbitalPeriod: '88 days',
    rotationPeriod: '58.6 days (sunrise-to-sunrise: 176 Earth days)',
    mass: '3.285 × 10²³ kg (5.5% of Earth)',
    gravity: '3.7 m/s² (38% of Earth)',
    temperature: '−180°C (night) to 430°C (day)',
    atmosphere: 'Thin exosphere: oxygen, sodium, hydrogen, helium, potassium — no weather',
    composition: '~85% iron core (proportionally the largest of any planet), thin silicate mantle and crust',
    magneticField: '~1% of Earth\'s strength, offset from center, still enough to deflect solar wind',
    discoverer: 'Known since antiquity (Sumerians, ~3000 BCE)',
    missions: ['MESSENGER (2011–15, first to orbit)', 'BepiColombo (arriving 2025)', 'Mariner 10 (1974–75, first flyby)'],
    surfaceFeatures: 'Caloris Basin (1,550 km impact crater), discovery scarps (lobate scarps from cooling/shrinking), hollows (unique bright depressions), ice in permanently shadowed polar craters',
    mythology: 'Mercury (Roman), Hermes (Greek) — messenger of the gods, patron of travelers, merchants, and thieves',
    additionalFacts: ['Mercury has water ice in permanently shadowed craters at its poles, confirmed by MESSENGER.', 'Mercury\'s core makes up about 85% of its radius — no other planet is so metal-dominated.', 'Mercury has shrunk by ~14 km in diameter as its core slowly cools and contracts.', 'Despite being closest to the Sun, Mercury is not the hottest planet — Venus is.'],
    classification: 'Terrestrial planet',
    density: '5.43 g/cm³ (second densest planet after Earth)',
    axialTilt: '0.034° (nearly zero — most upright planet)',
    escapeVelocity: '4.25 km/s',
  },
  venus: {
    description: 'Venus is the second planet from the Sun and Earth\'s closest planetary neighbor. It spins backward compared to most planets and has the thickest atmosphere of the terrestrial planets, trapping heat in a runaway greenhouse effect that makes it the hottest planet in our solar system at 465°C.',
    diameter: '12,104 km',
    distance: '0.72 AU',
    moons: '0',
    funFact: 'Venus rotates so slowly that a day on Venus is longer than its year.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Venus_2_Approach_Image.jpg/480px-Venus_2_Approach_Image.jpg',
    orbitalPeriod: '225 days',
    rotationPeriod: '243 days retrograde (spins backward, longer than its year)',
    mass: '4.867 × 10²⁴ kg (81.5% of Earth)',
    gravity: '8.87 m/s² (90% of Earth)',
    temperature: '465°C average surface (hottest planet — hotter than Mercury)',
    atmosphere: '96.5% CO₂, 3.5% nitrogen. Surface pressure 92× Earth\'s (like being 900 m underwater). Clouds of sulfuric acid.',
    composition: 'Iron core, silicate mantle, basaltic crust — very similar internal structure to Earth',
    magneticField: 'No intrinsic field (induced magnetosphere from solar wind interaction with ionosphere)',
    discoverer: 'Known since antiquity (Babylonians, ~1600 BCE)',
    missions: ['Venera 7–14 (USSR, 1970–82, first surface images ever)', 'Magellan (1990–94, radar-mapped 98% of surface)', 'Akatsuki (Japan, 2015–)', 'DAVINCI & VERITAS (NASA, planned ~2030)'],
    surfaceFeatures: 'Maxwell Montes (11 km, tallest mountain), Ishtar Terra, Aphrodite Terra, ~1,600 major volcanoes, pancake domes, coronae, tessera terrain',
    mythology: 'Venus (Roman), Aphrodite (Greek), Ishtar (Babylonian) — goddess of love, beauty, fertility, and desire',
    additionalFacts: ['Venus rains sulfuric acid, but the drops evaporate before reaching the surface.', 'The entire surface was resurfaced by volcanic activity ~500 million years ago.', 'Venus is the brightest natural object in the sky after the Sun and Moon (magnitude −4.6).', 'A proposed "cloud city" concept could allow habitation in Venus\'s upper atmosphere where conditions are Earth-like.'],
    classification: 'Terrestrial planet',
    density: '5.24 g/cm³',
    axialTilt: '177.4° (essentially upside down — retrograde rotation)',
    escapeVelocity: '10.36 km/s',
  },
  mars: {
    description: 'Mars is the fourth planet from the Sun. Known as the Red Planet due to iron oxide (rust) on its surface, Mars has the tallest volcano (Olympus Mons, 21.9 km) and deepest canyon (Valles Marineris, 7 km deep) in the solar system. Evidence suggests it once had liquid water.',
    diameter: '6,779 km',
    distance: '1.52 AU',
    moons: '2 (Phobos, Deimos)',
    funFact: 'Mars has seasons like Earth because its axis is tilted at a similar angle (25.2°).',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Mars_-_August_30_2021_-_Flickr_-_Kevin_M._Gill.png/480px-Mars_-_August_30_2021_-_Flickr_-_Kevin_M._Gill.png',
    orbitalPeriod: '687 days (1.88 Earth years)',
    rotationPeriod: '24 hours 37 minutes (most Earth-like day)',
    mass: '6.39 × 10²³ kg (10.7% of Earth)',
    gravity: '3.72 m/s² (38% of Earth)',
    temperature: '−153°C to 20°C (average −65°C)',
    atmosphere: '95.3% CO₂, 2.7% nitrogen, 1.6% argon. Surface pressure only 0.6% of Earth\'s.',
    composition: 'Iron sulfide core, silicate mantle, basaltic crust coated in iron oxide (rust) giving the red color',
    magneticField: 'No global field (lost ~4 billion years ago when core solidified), residual crustal magnetic patches',
    discoverer: 'Known since antiquity (Egyptian astronomers, ~2000 BCE)',
    missions: ['Curiosity (2012–)', 'Perseverance + Ingenuity helicopter (2021–)', 'Mars Reconnaissance Orbiter (2006–)', 'InSight (2018–22)', 'Viking 1 & 2 (1976, first successful landers)', 'Mars Sample Return (planned)'],
    surfaceFeatures: 'Olympus Mons (21.9 km — tallest volcano in solar system), Valles Marineris (4,000 km canyon — 10× Grand Canyon), polar ice caps (CO₂ + water ice), ancient river channels and lake beds',
    mythology: 'Mars (Roman), Ares (Greek) — god of war, aggression, courage, and masculine energy',
    additionalFacts: ['Mars has the largest dust storms in the solar system, sometimes engulfing the entire planet for months.', 'The Opportunity rover operated for over 14 years on Mars (2004–2018), far exceeding its 90-day mission.', 'Mars\'s two moons (Phobos and Deimos) may be captured asteroids; Phobos is slowly spiraling inward.', 'Evidence of ancient liquid water includes river deltas, lakebeds, and hydrated minerals.'],
    classification: 'Terrestrial planet',
    density: '3.93 g/cm³',
    axialTilt: '25.2° (similar to Earth\'s 23.4° — causes seasons)',
    escapeVelocity: '5.03 km/s',
  },
  jupiter: {
    description: 'Jupiter is the largest planet in our solar system — more than twice as massive as all other planets combined. Its Great Red Spot is a storm larger than Earth that has raged for at least 350 years. Jupiter\'s powerful magnetic field is 20,000 times stronger than Earth\'s.',
    diameter: '139,820 km',
    distance: '5.20 AU',
    moons: '95 known',
    funFact: 'Jupiter\'s moon Europa may harbor a liquid water ocean beneath its icy crust.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Jupiter_New_Horizons.jpg/480px-Jupiter_New_Horizons.jpg',
    orbitalPeriod: '11.86 Earth years',
    rotationPeriod: '9 hours 56 minutes (fastest spinning planet)',
    mass: '1.898 × 10²⁷ kg (318× Earth, 2.5× all other planets combined)',
    gravity: '24.79 m/s² (2.53× Earth)',
    temperature: '−145°C (cloud tops)',
    atmosphere: '89% hydrogen, 10% helium, traces of methane, ammonia, water vapor. Cloud layers of ammonia ice, ammonium hydrosulfide, and water.',
    composition: 'Hydrogen/helium envelope → liquid metallic hydrogen layer → possible rocky/icy core (10–20× Earth mass)',
    magneticField: '20,000× Earth\'s — most powerful in the solar system. Radiation belts lethal to unshielded electronics.',
    discoverer: 'Known since antiquity (Babylonians, 7th century BCE)',
    missions: ['Juno (2016–)', 'Galileo (1995–2003, first orbiter)', 'Voyager 1 & 2 (1979)', 'Europa Clipper (2024–)', 'JUICE (ESA, 2023–)', 'Pioneer 10 & 11 (1973–74)'],
    surfaceFeatures: 'Great Red Spot (storm >350 years old, 1.3× Earth\'s width), banded cloud layers (zones and belts), white ovals, brown barges, lightning 10× Earth\'s, auroras 1000× more powerful than Earth\'s',
    mythology: 'Jupiter (Roman), Zeus (Greek) — king of the gods, sky, thunder, justice, and cosmic order',
    additionalFacts: ['Jupiter emits nearly twice as much heat as it receives from the Sun, from gravitational compression.', 'If Jupiter were 80× more massive, it would have ignited as a red dwarf star.', 'Jupiter\'s moon Europa likely has a liquid water ocean beneath its icy crust — a prime target for finding life.', 'Jupiter acts as a "cosmic vacuum cleaner," deflecting many comets that might otherwise hit Earth.'],
    classification: 'Gas giant',
    density: '1.33 g/cm³',
    axialTilt: '3.1° (nearly upright)',
    escapeVelocity: '59.5 km/s',
    rings: 'Faint ring system discovered by Voyager 1 (1979) — mainly dust from micrometeorite impacts on inner moons',
  },
  saturn: {
    description: 'Saturn is the sixth planet from the Sun, famous for its stunning ring system made of ice and rock particles. It is the least dense planet — light enough to float in water if you could find a bathtub big enough. Its rings span up to 282,000 km but are only about 10 meters thick.',
    diameter: '116,460 km',
    distance: '9.54 AU',
    moons: '146 known',
    funFact: 'Saturn\'s moon Titan has a thick atmosphere and liquid methane lakes on its surface.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/480px-Saturn_during_Equinox.jpg',
    orbitalPeriod: '29.46 Earth years',
    rotationPeriod: '10 hours 42 minutes',
    mass: '5.683 × 10²⁶ kg (95× Earth)',
    gravity: '10.44 m/s² (1.07× Earth)',
    temperature: '−178°C (cloud tops)',
    atmosphere: '96% hydrogen, 3% helium, traces of methane and ammonia. Three cloud layers like Jupiter.',
    composition: 'Hydrogen/helium envelope → metallic hydrogen layer → rocky/icy core (~9–22× Earth mass)',
    magneticField: '580× Earth\'s, nearly perfectly aligned with rotation axis (unique among planets)',
    discoverer: 'Known since antiquity; rings first seen by Galileo (1610), identified by Huygens (1655)',
    missions: ['Cassini-Huygens (2004–17, Huygens landed on Titan)', 'Voyager 1 & 2 (1980–81)', 'Pioneer 11 (1979)', 'Dragonfly (planned rotorcraft for Titan, ~2034)'],
    surfaceFeatures: 'Hexagonal storm at north pole (30,000 km across, stable for decades), banded atmosphere, Great White Spot storms erupting every ~30 years, wind speeds up to 1,800 km/h',
    mythology: 'Saturn (Roman), Kronos (Greek) — god of time, agriculture, harvest, father of Jupiter/Zeus',
    additionalFacts: ['Saturn\'s rings are 99.9% water ice, ranging from dust grains to house-sized chunks.', 'Enceladus shoots geysers of water ice from a subsurface ocean — another candidate for extraterrestrial life.', 'Saturn\'s rings may be only 10–100 million years old — far younger than the planet itself.', 'Titan, Saturn\'s largest moon, has a thick atmosphere and liquid methane/ethane lakes — the only other body with stable surface liquids.'],
    classification: 'Gas giant',
    density: '0.687 g/cm³ (would float in water — least dense planet)',
    axialTilt: '26.7°',
    escapeVelocity: '35.5 km/s',
    rings: 'Most spectacular ring system: 7 main rings (D–G), spanning 282,000 km but only ~10 m thick. Cassini Division is 4,800 km wide.',
  },
  uranus: {
    description: 'Uranus is the seventh planet from the Sun and the first discovered with a telescope (William Herschel, 1781). It rotates on its side with an axial tilt of 97.8°, likely from a collision with an Earth-sized object long ago. It has 13 known rings and a blue-green color from methane in its atmosphere.',
    diameter: '50,724 km',
    distance: '19.19 AU',
    moons: '28 known',
    funFact: 'Uranus rolls around the Sun on its side, making its seasons last 21 Earth years each.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Uranus_as_seen_by_NASA%27s_Voyager_2_%28reprocessed%29_-_JPEG_converted.jpg/480px-Uranus_as_seen_by_NASA%27s_Voyager_2_%28reprocessed%29_-_JPEG_converted.jpg',
    orbitalPeriod: '84.01 Earth years',
    rotationPeriod: '17 hours 14 minutes (retrograde)',
    mass: '8.681 × 10²⁵ kg (14.5× Earth)',
    gravity: '8.87 m/s² (90% of Earth)',
    temperature: '−224°C (coldest planetary atmosphere in solar system)',
    atmosphere: '83% hydrogen, 15% helium, 2% methane (methane absorbs red light → blue-green color)',
    composition: 'Ice giant: icy mantle of water, methane, ammonia surrounding small rocky core, thin hydrogen/helium atmosphere',
    magneticField: '50× Earth\'s, tilted 59° from rotation axis and offset from center (highly asymmetric)',
    discoverer: 'William Herschel (March 13, 1781) — first planet discovered with a telescope',
    missions: ['Voyager 2 (1986, only flyby ever)', 'Uranus Orbiter & Probe (proposed flagship mission for 2030s)'],
    surfaceFeatures: 'Extremely bland, featureless blue-green appearance (active weather hidden beneath haze layers), faint cloud bands visible in infrared, occasional bright spots',
    mythology: 'Ouranos (Greek) — primordial god of the sky, father of the Titans and grandfather of Zeus, castrated by Kronos',
    additionalFacts: ['It may rain diamonds deep inside Uranus where methane is crushed under extreme pressure and temperature.', 'Uranus was nearly named "Georgium Sidus" (George\'s Star) after King George III of England.', 'All 27 moons of Uranus are named after characters from Shakespeare and Alexander Pope.', 'A collision with an Earth-sized object likely knocked Uranus on its side ~4 billion years ago.'],
    classification: 'Ice giant',
    density: '1.27 g/cm³',
    axialTilt: '97.8° (rolls on its side — extreme seasonal variations)',
    escapeVelocity: '21.3 km/s',
    rings: '13 known rings discovered in 1977, mostly dark and narrow. The epsilon ring is the most prominent.',
  },
  neptune: {
    description: 'Neptune is the eighth and farthest planet from the Sun. It has the strongest sustained winds of any planet, reaching 2,100 km/h. Neptune\'s vivid blue color comes from methane in its atmosphere. It was the first planet predicted mathematically before being observed.',
    diameter: '49,244 km',
    distance: '30.07 AU',
    moons: '16 known',
    funFact: 'Neptune takes 165 Earth years to orbit the Sun — it completed its first orbit since discovery in 2011.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Neptune_Voyager2_color_calibrated.png/480px-Neptune_Voyager2_color_calibrated.png',
    orbitalPeriod: '164.8 Earth years',
    rotationPeriod: '16 hours 6 minutes',
    mass: '1.024 × 10²⁶ kg (17.1× Earth)',
    gravity: '11.15 m/s² (1.14× Earth)',
    temperature: '−214°C (cloud tops)',
    atmosphere: '80% hydrogen, 19% helium, 1.5% methane (deep blue from methane absorbing red light)',
    composition: 'Ice giant: icy mantle of water, methane, ammonia, small rocky core, hydrogen/helium atmosphere',
    magneticField: '27× Earth\'s, tilted 47° from rotation axis (like Uranus, highly asymmetric)',
    discoverer: 'Johann Galle (September 23, 1846), predicted mathematically by Le Verrier and Adams',
    missions: ['Voyager 2 (1989, only flyby ever)'],
    surfaceFeatures: 'Great Dark Spot (1989, since vanished), fastest winds in the solar system (2,100 km/h), active cloud features despite extreme distance from Sun, dark spots appear and disappear over years',
    mythology: 'Neptune (Roman), Poseidon (Greek) — god of the sea, storms, earthquakes, and horses',
    additionalFacts: ['Neptune radiates 2.6× more energy than it receives from the Sun — internal heat source still unknown.', 'Triton, Neptune\'s largest moon, orbits backward (retrograde) — likely a captured Kuiper Belt object.', 'Neptune was the first planet found through mathematical prediction rather than direct observation.', 'Triton has cryovolcanic geysers that shoot nitrogen gas 8 km into its thin atmosphere.'],
    classification: 'Ice giant',
    density: '1.64 g/cm³',
    axialTilt: '28.3°',
    escapeVelocity: '23.5 km/s',
    rings: '5 main rings (Galle, Le Verrier, Lassell, Arago, Adams) — faint, with unique clumpy arcs in the Adams ring',
  },
  pluto: {
    description: 'Pluto is a dwarf planet in the Kuiper Belt, reclassified in 2006. NASA\'s New Horizons flyby in 2015 revealed a surprisingly complex world with nitrogen ice glaciers, floating hills of water ice, and a heart-shaped feature named Tombaugh Regio after its discoverer.',
    diameter: '2,377 km',
    distance: '39.5 AU',
    moons: '5 (Charon, Nix, Hydra, Kerberos, Styx)',
    funFact: 'Pluto\'s largest moon Charon is so big relative to Pluto that they orbit each other.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Pluto_in_True_Color_-_High-Res.jpg/480px-Pluto_in_True_Color_-_High-Res.jpg',
    orbitalPeriod: '248 Earth years',
    rotationPeriod: '6.39 days (retrograde)',
    mass: '1.303 × 10²² kg (0.2% of Earth)',
    gravity: '0.62 m/s² (6.3% of Earth)',
    temperature: '−230°C average',
    atmosphere: 'Thin: nitrogen, methane, carbon monoxide — expands when closer to Sun, partially collapses when distant',
    composition: '~70% rock, ~30% water ice. Nitrogen ice glaciers, methane frost, carbon monoxide ice',
    magneticField: 'Unknown — New Horizons did not carry a magnetometer',
    discoverer: 'Clyde Tombaugh (February 18, 1930) at Lowell Observatory, Arizona',
    missions: ['New Horizons (July 14, 2015 flyby — closest approach 12,500 km)'],
    surfaceFeatures: 'Tombaugh Regio ("heart" — 1,600 km nitrogen ice plain), Sputnik Planitia (glacier basin), Wright Mons (possible cryovolcano, 5 km tall), mountain ranges of water ice up to 3,500 m, dark equatorial band (Cthulhu Macula)',
    mythology: 'Pluto (Roman), Hades (Greek) — god of the underworld, death, hidden wealth, and transformation',
    additionalFacts: ['Pluto was reclassified from planet to dwarf planet on August 24, 2006 by the IAU.', 'Pluto\'s thin atmosphere partially freezes and falls as snow when it moves away from the Sun.', 'From 1979–1999, Pluto was actually closer to the Sun than Neptune due to its eccentric orbit.', 'Pluto and Charon are tidally locked to each other — they always show the same face to one another.'],
    classification: 'Dwarf planet (Kuiper Belt object, plutino)',
    density: '1.89 g/cm³',
    axialTilt: '122.5° (on its side, retrograde rotation)',
    escapeVelocity: '1.21 km/s',
  },
  chiron: {
    description: 'Chiron is a small body orbiting between Saturn and Uranus, classified as both a minor planet (95P/Chiron) and a comet. Discovered in 1977 by Charles Kowal, it was the first known centaur — objects that blur the line between asteroids and comets. Chiron\'s dual nature makes it one of the most unusual objects in the solar system.',
    diameter: '206 km',
    distance: '8.5–18.9 AU',
    funFact: 'Chiron occasionally exhibits a coma (gas cloud) like a comet, despite its large orbit.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Chiron_in_Catalina_Sky_Survey.jpg/480px-Chiron_in_Catalina_Sky_Survey.jpg',
    classification: 'Centaur / Comet',
    orbitalPeriod: '50.7 years',
    rotationPeriod: '5.92 hours',
    mass: '~2.4 × 10¹⁸ kg',
    density: '~1.0 g/cm³',
    gravity: '~0.03 m/s²',
    temperature: '~75 K (−198°C)',
    escapeVelocity: '~0.06 km/s',
    atmosphere: 'Chiron periodically develops a cometary coma — a thin gas and dust envelope — especially near perihelion. The coma can extend 300,000 km and is composed of CO, CO₂, and water ice sublimation products.',
    composition: 'Mixture of water ice, silicates, and dark organic compounds. The surface is coated with dark, irradiated material, giving it a low albedo of about 0.15.',
    surfaceFeatures: 'Chiron\'s surface is likely a mix of exposed water ice patches and dark organic crust. Its variable brightness suggests possible ring material or jets of sublimating ice.',
    magneticField: 'No intrinsic magnetic field detected.',
    discoverer: 'Charles Kowal, 1977 (Palomar Observatory)',
    missions: [
      'No dedicated spacecraft missions — only observed from ground-based and space telescopes',
      'Proposed as a target for the Centaur flyby concept study',
    ],
    mythology: 'Named after Chiron, the wisest and most just of all centaurs in Greek mythology. Unlike other centaurs who were wild and violent, Chiron was a healer, teacher, and mentor to heroes including Achilles, Jason, and Asclepius. Wounded by a poisoned arrow, he gave up his immortality to end his suffering — embodying the archetype of the "wounded healer."',
    additionalFacts: [
      'Chiron was the first centaur discovered, leading to a whole new class of solar system objects.',
      'Its orbit is unstable on timescales of millions of years — it will eventually be ejected from the solar system or collide with a planet.',
      'Chiron may have rings: stellar occultation data in 2011 showed symmetric features resembling a ring system.',
      'At perihelion (closest to Sun), Chiron develops brightness outbursts as surface ices sublimate into space.',
    ],
  },
  northnode: {
    description: 'The North Node (ascending node) is the point where the Moon\'s orbital path crosses the ecliptic plane moving northward. It is not a physical body but a mathematical point of intersection between two orbital planes. The lunar nodes are the only points where solar and lunar eclipses can occur, making them among the most important calculated points in both astronomy and astrology.',
    funFact: 'Eclipse seasons occur when the Sun is near either lunar node.',
    classification: 'Mathematical point',
    orbitalPeriod: '18.6 years (nodal cycle)',
    distance: '~384,400 km (lunar orbit crossing)',
    mythology: 'In Vedic astrology, the North Node is called Rahu — depicted as the head of a dragon or serpent demon. According to Hindu myth, during the churning of the cosmic ocean, a demon disguised himself among the gods to drink the nectar of immortality. Vishnu beheaded him, but his head (Rahu/North Node) and body (Ketu/South Node) survived as shadow planets that periodically swallow the Sun and Moon, causing eclipses.',
    additionalFacts: [
      'The lunar nodes precess (move backward) through the zodiac, taking 18.6 years to complete one full cycle — known as the Saros cycle.',
      'Eclipses can only occur within about 18° of a lunar node — this defines the "eclipse season" lasting roughly 34 days.',
      'The nodal return (when the nodes return to their birth position) occurs every 18.6 years and is associated with major life shifts.',
      'Ancient Babylonian astronomers tracked the lunar nodes to predict eclipses as far back as 747 BCE.',
      'The nodes are always exactly 180° apart — the North Node\'s zodiac position instantly defines the South Node\'s position.',
    ],
  },
  southnode: {
    description: 'The South Node (descending node) is the point where the Moon\'s orbit crosses the ecliptic plane moving southward. Always exactly 180° opposite the North Node, it represents the other half of the lunar node axis. When a new or full Moon occurs near the South Node, it produces a solar or lunar eclipse respectively.',
    funFact: 'The lunar nodes precess (move backward) through the zodiac, opposite to the direction of the planets.',
    classification: 'Mathematical point',
    orbitalPeriod: '18.6 years (nodal cycle)',
    distance: '~384,400 km (lunar orbit crossing)',
    mythology: 'In Vedic astrology, the South Node is called Ketu — the headless body of the serpent demon. While Rahu (North Node) represents insatiable worldly desire, Ketu represents spiritual liberation, detachment, and transcendence. Ketu is depicted as a headless torso holding a flag, symbolizing wisdom gained through letting go. In Western astrology, the South Node is associated with past-life karma and innate talents.',
    additionalFacts: [
      'Total solar eclipses at the South Node are among the most dramatic celestial events visible from Earth.',
      'The South Node\'s backward motion through the zodiac means it moves against the usual planetary flow — about 3 minutes of arc per day.',
      'In Chinese astronomy, the lunar nodes were depicted as a dragon — the North Node as the dragon\'s head and South Node as the tail.',
      'The half-Saros cycle (9.3 years) marks when the nodes swap positions — the North Node moves to where the South Node was.',
    ],
  },
  lilith: {
    description: 'Black Moon Lilith is the lunar apogee — the point in the Moon\'s orbit where it is farthest from Earth. It is not a physical body but a mathematical point defined by orbital mechanics. At apogee, the Moon is about 405,500 km from Earth (vs. 363,300 km at perigee), and its apparent size and orbital speed are at their minimum.',
    funFact: 'There are actually three different "Liliths" used in astrology: the asteroid (1181 Lilith), the hypothetical dark moon (Waldemath), and the lunar apogee (Black Moon).',
    classification: 'Mathematical point',
    orbitalPeriod: '8 years 10 months (full zodiac cycle)',
    distance: '~405,500 km (lunar apogee distance)',
    mythology: 'Named after Lilith, a figure from ancient Mesopotamian and Jewish mythology. In the Alphabet of Ben Sira (8th–10th century), Lilith was described as Adam\'s first wife who refused to be subservient, left the Garden of Eden of her own will, and became a powerful independent spirit. In Babylonian demonology, she was associated with wind and storm spirits. The name likely derives from the Sumerian "lil" (air/wind).',
    additionalFacts: [
      'The lunar apogee advances (moves forward) about 40° per year, taking 8 years and 10 months to complete one full zodiac cycle.',
      'Mean Black Moon Lilith uses an averaged position, while True (Osculating) Lilith accounts for the Sun\'s gravitational perturbations and can jump several degrees in a day.',
      'When the Moon is at apogee during a full Moon, it creates a "micro Moon" — appearing about 14% smaller than a perigee "supermoon."',
      'The concept of a "dark moon" Lilith (a hypothetical second Earth satellite proposed by Waldemath in 1898) was never confirmed and is considered distinct from Black Moon Lilith.',
      'In medieval Hebrew astrology, Lilith was considered one of the most important calculated points, second only to the lunar nodes.',
    ],
  },
  ceres: {
    description: 'Ceres is the largest object in the asteroid belt between Mars and Jupiter, and the only dwarf planet in the inner solar system. NASA\'s Dawn spacecraft revealed bright spots of sodium carbonate on its surface, suggesting past subsurface water activity.',
    diameter: '940 km',
    distance: '2.77 AU',
    funFact: 'Ceres may have a subsurface ocean of liquid water beneath its icy mantle.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Ceres_-_RC3_-_Haulani_Crater_%2822381131691%29_%28cropped%29.jpg/480px-Ceres_-_RC3_-_Haulani_Crater_%2822381131691%29_%28cropped%29.jpg',
  },
  juno: {
    description: 'Juno is one of the largest asteroids in the main belt, discovered in 1804. It is an S-type (stony) asteroid with a diameter of 234 km. Despite its small size, Juno was originally classified as a planet for nearly 40 years.',
    diameter: '234 km',
    distance: '2.67 AU',
    funFact: 'Juno was the third asteroid ever discovered and was considered a planet until 1845.',
  },
  pallas: {
    description: 'Pallas is the third-largest asteroid in the solar system. Its orbit is highly inclined (34.8°), making it very difficult to visit with spacecraft. Pallas is thought to be a remnant protoplanet from the earliest days of the solar system.',
    diameter: '512 km',
    distance: '2.77 AU',
    funFact: 'Pallas has the most tilted orbit of any known asteroid.',
  },
  vesta: {
    description: 'Vesta is the second-largest asteroid in the main belt and was visited by NASA\'s Dawn spacecraft in 2011-2012. It has a giant impact crater (Rheasilvia) at its south pole that is 505 km across — nearly as wide as Vesta itself.',
    diameter: '525 km',
    distance: '2.36 AU',
    funFact: 'Vesta is the brightest asteroid visible from Earth and can occasionally be seen with the naked eye.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Vesta_in_natural_color.jpg/480px-Vesta_in_natural_color.jpg',
  },

  // ═══════════════════════════════════════════════════════════════
  // MAIN BELT ASTEROIDS
  // ═══════════════════════════════════════════════════════════════

  astraea: {
    description: 'Astraea (5) is an S-type asteroid discovered in 1845 by Karl Ludwig Hencke after 15 years of searching — the first new asteroid found since 1807. Its discovery broke the 38-year gap and opened the floodgates: hundreds of asteroids were found in the following decades.',
    diameter: '117 km',
    distance: '2.58 AU',
    funFact: 'Hencke received an annual pension of 1,200 marks from the King of Prussia for his discovery.',
  },
  hebe: {
    description: 'Hebe (6) is an S-type asteroid and the likely parent body of H-chondrite meteorites, which make up about 40% of all meteorites that fall to Earth. It orbits in the inner main belt and has a relatively high albedo of 0.27.',
    diameter: '186 km',
    distance: '2.43 AU',
    funFact: 'Nearly half of all meteorites on Earth may have originated from Hebe or its fragments.',
  },
  iris: {
    description: 'Iris (7) is one of the brightest objects in the asteroid belt with an extremely high albedo of 0.28, making it the brightest main-belt asteroid at opposition. It is an S-type asteroid with a silicate-rich surface that efficiently reflects sunlight.',
    diameter: '200 km',
    distance: '2.39 AU',
    funFact: 'Iris can reach magnitude 6.7, making it barely visible to the naked eye under perfect conditions.',
  },
  flora: {
    description: 'Flora (8) is the parent body of the Flora family, the largest asteroid family containing over 13,000 members. These collisional fragments may be a major source of L-chondrite meteorites and possibly the object that caused the Ordovician meteor event 470 million years ago.',
    diameter: '136 km',
    distance: '2.20 AU',
    funFact: 'The Flora family is so large it contains roughly 4-5% of all main-belt asteroids.',
  },
  metis: {
    description: 'Metis (9) is an S-type asteroid in the inner main belt discovered in 1848 by Andrew Graham. It is elongated in shape and has a relatively bright surface. Metis was the ninth asteroid discovered.',
    diameter: '190 km',
    distance: '2.39 AU',
    funFact: 'Metis is the only asteroid discovered from Ireland (at Markree Observatory).',
  },
  eunomia: {
    description: 'Eunomia (15) is the largest S-type (stony) asteroid in the main belt and the parent of a large asteroid family. It has an elongated shape and shows significant brightness variations as it rotates. Its surface is rich in olivine and pyroxene minerals.',
    diameter: '268 km',
    distance: '2.64 AU',
    funFact: 'Eunomia is so elongated that its brightness changes by 50% as it rotates every 6 hours.',
  },
  psyche: {
    description: 'Psyche (16) is a massive M-type asteroid thought to be the exposed iron-nickel core of a protoplanet that was stripped of its mantle by collisions. NASA launched the Psyche mission in October 2023 to study this unique metallic world — it will arrive in 2029.',
    diameter: '226 km',
    distance: '2.92 AU',
    funFact: 'If Psyche\'s iron were brought to Earth\'s surface, it would be worth an estimated $10 quintillion.',
  },
  euphrosyne: {
    description: 'Euphrosyne (31) is one of the largest asteroids in the main belt with a very dark, carbonaceous surface (Cb-type). Its orbit is highly inclined at 26.3°, making it unusual among large asteroids. A massive ancient collision created the Euphrosyne family.',
    diameter: '268 km',
    distance: '3.15 AU',
    funFact: 'Euphrosyne\'s high orbital tilt means it ventures far above and below the main asteroid belt plane.',
  },
  europa: {
    description: 'Europa (52) is a large C-type (carbonaceous) asteroid — not to be confused with Jupiter\'s moon of the same name. It has a very dark surface and is one of the 10 largest asteroids. It was discovered in 1858 by Hermann Goldschmidt.',
    diameter: '303 km',
    distance: '3.10 AU',
    funFact: 'Europa the asteroid was discovered 34 years before Europa the moon of Jupiter was recognized as significant.',
  },
  cybele: {
    description: 'Cybele (65) orbits at the outer edge of the main belt in the "Cybele group" — a transitional zone between the asteroid belt and Jupiter\'s gravitational influence. It is a P-type primitive asteroid with a very dark surface preserving ancient solar system material.',
    diameter: '237 km',
    distance: '3.43 AU',
    funFact: 'Water ice frost was detected on Cybele\'s surface in 2010, surprising for a main-belt asteroid.',
  },
  sylvia: {
    description: 'Sylvia (87) was the first asteroid confirmed to have two moons (Romulus and Remus), making it a triple system. It is a rubble pile — not a solid body but a loose collection of fragments held together by gravity. Its low density (1.2 g/cm³) confirms large internal voids.',
    diameter: '286 km',
    distance: '3.49 AU',
    funFact: 'Sylvia\'s density is so low that roughly 60% of its interior must be empty space.',
  },
  thisbe: {
    description: 'Thisbe (88) is a large B-type asteroid in the main belt with a very dark surface (albedo 0.067). It was discovered in 1866 and named after the tragic lover from Babylonian mythology. Its spectrum suggests a primitive, carbon-rich composition.',
    diameter: '232 km',
    distance: '2.77 AU',
    funFact: 'Thisbe\'s extremely dark surface reflects less light than fresh asphalt.',
  },
  minerva: {
    description: 'Minerva (93) is a C-type asteroid and a triple system with two small moons named Aegis and Gorgoneion. It orbits in the outer main belt. Its low density suggests a rubble-pile structure similar to Sylvia.',
    diameter: '154 km',
    distance: '2.75 AU',
    funFact: 'Minerva\'s two moons were both discovered in 2009 using adaptive optics at the Keck Observatory.',
  },
  elektra: {
    description: 'Elektra (130) made history in 2022 as the first asteroid confirmed to have three moons, making it a quadruple system. It is a G-type asteroid with a dark, carbonaceous surface. Its three moons orbit at distances of 500, 1,300, and 1,600 km.',
    diameter: '199 km',
    distance: '3.12 AU',
    funFact: 'Elektra\'s third moon was discovered using the VLT in Chile — it is only 1.6 km across.',
  },
  kleopatra: {
    description: 'Kleopatra (216) is one of the most unusual asteroids known — an M-type metallic body shaped like a dog bone, 217 km long but only ~94 km wide. Its bizarre shape was likely formed by a low-speed collision between two objects. It has two small moons.',
    diameter: '217 × 94 km',
    distance: '2.79 AU',
    funFact: 'Kleopatra\'s dog-bone shape was confirmed by radar observations at Arecibo Observatory.',
  },
  bamberga: {
    description: 'Bamberga (324) is one of the largest C-type asteroids and has the most eccentric orbit of any large asteroid (e = 0.34). This causes its distance from Earth to vary dramatically, making it occasionally very bright and then extremely faint.',
    diameter: '229 km',
    distance: '2.68 AU',
    funFact: 'Bamberga\'s eccentric orbit brings it occasionally closer to Earth than any other asteroid of similar size.',
  },
  davida: {
    description: 'Davida (511) is one of the largest asteroids in the main belt. It is a C-type carbonaceous asteroid with a dark surface. Adaptive optics imaging revealed it has an irregular, lumpy shape. It was discovered in 1903.',
    diameter: '289 km',
    distance: '3.16 AU',
    funFact: 'Davida is so large that if it were placed on top of the UK, it would cover most of England.',
  },
  interamnia: {
    description: 'Interamnia (704) is one of the largest asteroids, ranking among the top five by volume. It is a B/F-type primitive asteroid with a very dark surface. Despite its enormous size, it was not discovered until 1910 due to its low albedo.',
    diameter: '332 km',
    distance: '3.06 AU',
    funFact: 'Interamnia is named after the Latin name for Teramo, an Italian city near where it was discovered.',
  },
  hygeia: {
    description: 'Hygeia (10) is the fourth-largest asteroid and the largest C-type (carbonaceous) asteroid. In 2019, VLT observations revealed it is nearly spherical, prompting debate about reclassifying it as a dwarf planet. Its surface preserves some of the most primitive material in the solar system.',
    diameter: '434 km',
    distance: '3.14 AU',
    funFact: 'Hygeia may qualify as the smallest dwarf planet if its near-spherical shape is confirmed.',
  },

  // ═══════════════════════════════════════════════════════════════
  // LOVE & RELATIONSHIP
  // ═══════════════════════════════════════════════════════════════

  eros: {
    description: 'Eros (433) is one of the most studied asteroids in history. In 2000, NASA\'s NEAR Shoemaker spacecraft became the first to orbit and then land on an asteroid. Eros is peanut-shaped, 34 km long, and covered in a layer of loose regolith up to 100m deep. It is an S-type near-Earth asteroid.',
    diameter: '34 × 11 × 11 km',
    distance: '1.46 AU',
    funFact: 'NEAR Shoemaker survived its landing on Eros and continued transmitting data from the surface for 16 days.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Eros_-_PIA02923_%28color%29.jpg/480px-Eros_-_PIA02923_%28color%29.jpg',
  },
  fama: {
    description: 'Fama (408) is a small main-belt asteroid discovered in 1895 at Heidelberg Observatory. It orbits in the inner main belt. Little is known about its physical properties beyond its approximate diameter.',
    diameter: '22 km',
    distance: '2.56 AU',
    funFact: 'Fama is named after the Roman personification of fame and rumor.',
  },

  // ═══════════════════════════════════════════════════════════════
  // NEAR-EARTH ASTEROIDS
  // ═══════════════════════════════════════════════════════════════

  icarus: {
    description: 'Icarus (1566) has one of the most extreme orbits of any known asteroid — its perihelion takes it inside Mercury\'s orbit to just 0.19 AU from the Sun, where surface temperatures exceed 700°C. It was the first asteroid detected by radar (1968).',
    diameter: '1.0 km',
    distance: '1.08 AU (semi-major)',
    funFact: 'At perihelion, Icarus is closer to the Sun than Mercury and its surface becomes hot enough to melt lead.',
  },
  toro: {
    description: 'Toro (1685) is an Apollo-type near-Earth asteroid in a complex orbital resonance with both Earth and Venus. It approaches both planets regularly, making it one of the most dynamically interesting near-Earth objects. It was discovered in 1948.',
    diameter: '3.4 km',
    distance: '1.37 AU',
    funFact: 'Toro is in a 5:8 orbital resonance with Earth and an 8:13 resonance with Venus simultaneously.',
  },
  ganymed: {
    description: 'Ganymed (1036) is the largest near-Earth asteroid at 32 km across — larger than the object that killed the dinosaurs. Despite being classified as "near-Earth," its orbit is more Mars-crossing. It is an S-type asteroid discovered in 1924.',
    diameter: '32 km',
    distance: '2.66 AU',
    funFact: 'Ganymed is named after the mythological cup-bearer, not Jupiter\'s moon Ganymede (different spelling).',
  },
  apophis: {
    description: 'Apophis (99942) gained worldwide attention in 2004 when initial calculations gave it a 2.7% chance of hitting Earth in 2029. While that impact was ruled out, Apophis will pass within 31,000 km of Earth on April 13, 2029 — closer than geostationary satellites.',
    diameter: '370 m',
    distance: '0.92 AU',
    funFact: 'In 2029, Apophis will be visible to the naked eye as it streaks past Earth — a once-in-1000-year event.',
  },

  // ═══════════════════════════════════════════════════════════════
  // CENTAURS
  // ═══════════════════════════════════════════════════════════════

  pholus: {
    description: 'Pholus (5145) is a centaur with one of the reddest surfaces in the solar system, caused by organic compounds (tholins) processed by cosmic radiation. Its orbit crosses those of Saturn, Uranus, and Neptune. It was the second centaur discovered, after Chiron.',
    diameter: '185 km',
    distance: '20.3 AU (semi-major)',
    funFact: 'Pholus is so red that its surface color is comparable to the reddest objects known in the solar system.',
  },
  nessus: {
    description: 'Nessus (7066) is a centaur with a chaotic orbit that crosses the paths of both Uranus and Pluto. Its orbital period of 122 years means it has completed less than one orbit since its 1993 discovery. It was the third centaur discovered.',
    diameter: '57 km',
    distance: '24.6 AU (semi-major)',
    funFact: 'Nessus\'s orbit is so chaotic that its path cannot be reliably predicted more than a few thousand years ahead.',
  },
  nyx: {
    description: 'Nyx (3908) is an Amor-type near-Earth asteroid with a highly eccentric orbit. Despite its small size (~1 km), it was one of the first near-Earth asteroids to be spectroscopically classified. Its surface suggests a V-type composition (basaltic).',
    diameter: '1 km',
    distance: '1.93 AU',
    funFact: 'Nyx is named after the Greek primordial goddess of the night, who even Zeus feared.',
  },

  // ═══════════════════════════════════════════════════════════════
  // TRANS-NEPTUNIAN OBJECTS
  // ═══════════════════════════════════════════════════════════════

  eris: {
    description: 'Eris is the most massive known dwarf planet, 27% more massive than Pluto. Its 2005 discovery directly triggered the IAU\'s controversial decision to reclassify Pluto in 2006. Eris has a small moon named Dysnomia. Its bright surface is coated in nitrogen and methane frost.',
    diameter: '2,326 km',
    distance: '67.8 AU (current)',
    moons: '1 (Dysnomia)',
    funFact: 'Eris is currently the most distant known large object in the solar system at 96 AU from the Sun.',
  },
  sedna: {
    description: 'Sedna (90377) has the most extreme orbit of any known object in the solar system — its aphelion takes it to ~900 AU, taking 11,400 years to complete one orbit. It was discovered in 2003 and its detached orbit suggests gravitational influence from an unseen "Planet Nine."',
    diameter: '~1,000 km',
    distance: '~84 AU (current)',
    funFact: 'Sedna is so distant that the Sun appears as just a bright star — 100 times dimmer than from Pluto.',
  },
  makemake: {
    description: 'Makemake is the second-brightest trans-Neptunian object (after Pluto) and was discovered in 2005. It is a dwarf planet with a reddish-brown surface covered in methane, ethane, and nitrogen ices. Its tiny moon, MK2, was discovered in 2016.',
    diameter: '1,430 km',
    distance: '45.8 AU',
    moons: '1 (MK2)',
    funFact: 'Makemake was discovered just after Easter 2005 and named after the Rapa Nui creator god.',
  },
  haumea: {
    description: 'Haumea is the most bizarre dwarf planet known — it spins so fast (once every 3.9 hours) that it has been stretched into an elongated ellipsoid shape. In 2017, a ring system was discovered around it, making it the most distant ringed object known at the time.',
    diameter: '~1,632 × 1,161 km',
    distance: '43.2 AU',
    moons: '2 (Hiʻiaka, Namaka)',
    funFact: 'Haumea rotates faster than any other known large body in the solar system — once every 3.9 hours.',
  },
  quaoar: {
    description: 'Quaoar (50000) is a large KBO that made headlines in 2022 when a ring system was discovered at a distance that should be impossible according to the Roche limit. This ring, 4,100 km from Quaoar\'s center, challenges our understanding of ring physics.',
    diameter: '1,110 km',
    distance: '43.4 AU',
    moons: '1 (Weywot)',
    funFact: 'Quaoar\'s ring defies physics — it orbits beyond the Roche limit where rings should coalesce into a moon.',
  },
  varuna: {
    description: 'Varuna (20000) is a large classical KBO discovered in 2000. It was one of the first large trans-Neptunian objects found and helped establish that Pluto was not unique. Varuna is a rapid rotator and may be elongated, with a very dark, reddish surface.',
    diameter: '668 km',
    distance: '43.0 AU',
    funFact: 'Varuna\'s rapid 6.3-hour rotation suggests it may be elongated like Haumea.',
  },
  ixion: {
    description: 'Ixion (28978) is a plutino — it orbits in a 2:3 mean-motion resonance with Neptune, just like Pluto. It has a dark, reddish surface that may indicate organic compounds. Its orbit is very similar to Pluto\'s but tilted differently.',
    diameter: '617 km',
    distance: '39.7 AU',
    funFact: 'Ixion follows the same orbital resonance as Pluto, completing 2 orbits for every 3 of Neptune.',
  },
  orcus: {
    description: 'Orcus (90482) is often called the "anti-Pluto" because its orbit is almost a mirror image of Pluto\'s — when Pluto is at perihelion, Orcus is near aphelion. It has a large moon, Vanth, and its surface shows water ice and possibly ammonia.',
    diameter: '910 km',
    distance: '39.2 AU',
    moons: '1 (Vanth)',
    funFact: 'Orcus and Pluto are never in the same part of their orbits — they are perpetually opposite.',
  },
  gonggong: {
    description: 'Gonggong (225088) is one of the largest known trans-Neptunian objects with a very red surface and a scattered-disc orbit. It has a moon named Xiangliu. It is a candidate dwarf planet, similar in size to Quaoar.',
    diameter: '1,230 km',
    distance: '67.3 AU (current)',
    moons: '1 (Xiangliu)',
    funFact: 'Gonggong was formally named in 2020 after the Chinese water god who causes floods and chaos.',
  },
  salacia: {
    description: 'Salacia (120347) is a large KBO in a binary system with its moon Actaea. The pair orbit each other every 5.5 days. Salacia has a surprisingly dark surface for its size, and its density suggests a mix of rock and ice.',
    diameter: '866 km',
    distance: '42.2 AU',
    moons: '1 (Actaea)',
    funFact: 'Salacia and its moon Actaea are so close in size that they are nearly a double system.',
  },
  varda: {
    description: 'Varda (174567) is a large classical KBO in a binary system with its moon Ilmarë. It orbits in the cold classical belt where objects have the most pristine, undisturbed orbits. Its reddish surface suggests organic compound deposits.',
    diameter: '740 km',
    distance: '45.4 AU',
    moons: '1 (Ilmarë)',
    funFact: 'Varda is named after the queen of the Valar in Tolkien\'s legendarium, who created the stars.',
  },

  // ═══════════════════════════════════════════════════════════════
  // FATE & KARMIC
  // ═══════════════════════════════════════════════════════════════

  nemesis: {
    description: 'Nemesis (128) is a large C-type asteroid in the main belt discovered in 1872. It has a very dark surface typical of carbonaceous asteroids. Not to be confused with the hypothetical "Nemesis" star — this is a well-studied main-belt body.',
    diameter: '188 km',
    distance: '2.75 AU',
    funFact: 'Nemesis the asteroid predates the "Nemesis star" hypothesis by over 100 years.',
  },

  // ═══════════════════════════════════════════════════════════════
  // LUNAR POINTS
  // ═══════════════════════════════════════════════════════════════

  truelilith: {
    description: 'True Lilith (Osculating Lunar Apogee) is the actual, oscillating point where the Moon is farthest from Earth in its orbit at any given moment. Unlike Mean Lilith, it wobbles irregularly due to solar perturbations, moving up to 30° ahead or behind the mean position.',
    funFact: 'True Lilith can jump several degrees in a single day due to the Moon\'s orbital wobble.',
  },
  meanlilith: {
    description: 'Mean Lilith (Mean Lunar Apogee) is the averaged, smoothed position of the Moon\'s orbital apogee. It moves steadily at about 40° per year, completing a full zodiac cycle in approximately 8 years and 10 months.',
    funFact: 'Mean Lilith moves about 0.11° per day — completing one zodiac cycle every 3,232 days.',
  },
  whitemoon: {
    description: 'Selena (White Moon) is the lunar perigee — the point where the Moon is closest to Earth. In some astrological traditions, it represents grace, good karma, and spiritual gifts. It is the counterpart to Black Moon Lilith.',
    funFact: 'When the Moon passes perigee during a full moon, it creates a "supermoon" up to 14% larger than usual.',
  },
  lilithast: {
    description: 'Asteroid 1181 Lilith is a physical asteroid in the main belt discovered in 1927. It is a C-type carbonaceous asteroid with a dark surface. Not to be confused with Black Moon Lilith (lunar apogee), this is an actual rocky body.',
    diameter: '21 km',
    distance: '2.68 AU',
    funFact: 'Asteroid 1181 Lilith was discovered by Benjamin Jekhowsky at Algiers Observatory.',
  },

  // ═══════════════════════════════════════════════════════════════
  // CALCULATED POINTS
  // ═══════════════════════════════════════════════════════════════

  vertex: {
    description: 'The Vertex is a calculated point where the prime vertical (the great circle passing through the east and west points of the horizon) intersects the ecliptic in the western hemisphere. It is associated with fateful encounters and destined events.',
    funFact: 'The Vertex always falls in the 5th–8th house and is sometimes called the "third angle" of the chart.',
  },
  sophia: {
    description: 'Sophia (251) is a main-belt asteroid discovered in 1885. In astrology, it is associated with divine wisdom, sacred feminine knowledge, and the Gnostic concept of Sophia as cosmic wisdom. It is an S-type asteroid.',
    diameter: '30 km',
    distance: '2.78 AU',
    funFact: 'Sophia is one of over 200 asteroids discovered by Johann Palisa, the most prolific visual asteroid discoverer.',
  },

  // ═══════════════════════════════════════════════════════════════
  // ARABIC PARTS (LOTS)
  // ═══════════════════════════════════════════════════════════════

  lot_fortune: {
    description: 'The Lot of Fortune (Part of Fortune) is calculated as ASC + Moon − Sun. It is the most important Arabic Part, representing where luck, prosperity, and well-being flow most naturally. It shows the area of life where material and physical fortune is strongest.',
    funFact: 'The Lot of Fortune was used by Hellenistic astrologers over 2,000 years ago as a key life indicator.',
  },
  lot_spirit: {
    description: 'The Lot of Spirit is calculated as ASC + Sun − Moon — the reverse of the Lot of Fortune. Where Fortune represents the body and material life, Spirit represents consciousness, will, and purposeful action.',
    funFact: 'The Lot of Spirit was considered the counterpart to Fortune: the soul\'s purpose vs. the body\'s luck.',
  },
  lot_eros: {
    description: 'The Lot of Eros is calculated as ASC + Venus − Mars. It reveals patterns of desire, passionate attraction, and erotic energy. It shows how and where one experiences magnetic pull toward others.',
    funFact: 'Ancient astrologers used the Lot of Eros to assess the nature of a person\'s romantic desires.',
  },
  lot_marriage: {
    description: 'The Lot of Marriage is calculated as ASC + Venus − Saturn. It indicates the nature and timing of significant partnerships and unions. Saturn\'s involvement suggests the endurance and commitment aspect of relationships.',
    funFact: 'Hellenistic astrologers calculated separate marriage lots for men and women using different formulas.',
  },
  lot_wealth: {
    description: 'The Lot of Wealth is calculated as ASC + Jupiter − Saturn. It shows where financial abundance and material prosperity are most accessible. The Jupiter-Saturn axis represents the expansion-contraction dynamic of wealth.',
    funFact: 'Medieval astrologers relied heavily on this lot for advising merchants and rulers on financial matters.',
  },
  lot_victory: {
    description: 'The Lot of Victory is calculated as ASC + Jupiter − Lot of Spirit. It represents triumph, success in competitions, and the ability to overcome obstacles. It connects spiritual will (Spirit) with expansion (Jupiter).',
    funFact: 'The Lot of Victory was especially consulted before military campaigns in the ancient world.',
  },
  lot_commerce: {
    description: 'The Lot of Commerce is calculated as ASC + Mercury − Sun. It reveals aptitude for trade, communication, and commercial success. Mercury\'s influence emphasizes negotiation, networking, and intellectual exchange.',
    funFact: 'Arabic astrologers developed this lot during the golden age of Islamic trade and scholarship.',
  },
  lot_passion: {
    description: 'The Lot of Passion is calculated as ASC + Mars − Sun. It shows where raw drive, intensity, and physical courage manifest most powerfully. It reveals the nature of one\'s deepest motivating fire.',
    funFact: 'The Lot of Passion was used to assess a warrior\'s fighting spirit and physical courage.',
  },
  lot_mother: {
    description: 'The Lot of the Mother is calculated as ASC + Moon − Venus. It reveals the nature of the maternal bond and nurturing patterns. The Moon-Venus combination speaks to emotional care and feminine wisdom.',
    funFact: 'In Hellenistic astrology, parent lots were used to infer the parents\' health and character.',
  },
  lot_father: {
    description: 'The Lot of the Father is calculated as ASC + Saturn − Sun. It reveals the nature of the paternal bond and authority structures. The Saturn-Sun axis represents the father as authority figure and teacher.',
    funFact: 'Ancient astrologers used this lot alongside the Sun\'s condition to assess the father\'s influence.',
  },
  lot_children: {
    description: 'The Lot of Children is calculated as ASC + Jupiter − Moon. It indicates fertility, creative legacy, and the nature of one\'s relationship with offspring. Jupiter\'s involvement suggests abundance and growth.',
    funFact: 'This lot was traditionally used to predict the number and nature of children one would have.',
  },
  lot_travel: {
    description: 'The Lot of Travel is calculated as ASC + Saturn − Mars. It shows patterns of journeys, exploration, and movement. The Saturn-Mars dynamic speaks to the discipline and courage needed for travel.',
    funFact: 'Maritime astrologers calculated this lot before voyages to assess the safety of the journey.',
  },
};
