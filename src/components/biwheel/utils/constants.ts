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
  descendant: { symbol: 'DC', name: 'Descendant', category: 'angle', color: '#000000' }, // Black
  midheaven: { symbol: 'MC', name: 'Midheaven', category: 'angle', color: '#000000' }, // Black
  ic: { symbol: 'IC', name: 'Imum Coeli', category: 'angle', color: '#000000' }, // Black
} as const;

// Planet visibility groups
export const PLANET_GROUPS = {
  core: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'northnode', 'southnode'],
  outer: ['uranus', 'neptune', 'pluto'],
  asteroids: ['chiron', 'lilith', 'juno', 'ceres', 'pallas', 'vesta'],
  angles: ['ascendant', 'descendant', 'midheaven', 'ic'],
} as const;

// Extended asteroids (for optional inclusion via API)
// Using first 5 letters of asteroid name for labels (smaller font in PlanetRing)
// NOTE: Asteroid descriptions temporarily disabled — uncomment to restore interpretations
export const ASTEROIDS = {
  // Major Asteroids (Main Belt)
  astraea: { symbol: 'Astra', name: 'Astraea', color: '#9C27B0', group: 'major', description: '' /* 'The thread that won\'t stay cut. Things you thought were finished resurfacing on their own schedule.' */ },
  hebe: { symbol: 'Hebe', name: 'Hebe', color: '#E91E63', group: 'major', description: '' /* 'What becomes essential by being overlooked. The ordinary thing that turns out to be structural.' */ },
  iris: { symbol: 'Iris', name: 'Iris', color: '#FF9800', group: 'major', description: '' /* 'Clarity without softening. Reflecting things back exactly as they are, whether or not you asked.' */ },
  flora: { symbol: 'Flora', name: 'Flora', color: '#4CAF50', group: 'major', description: '' /* 'Spreading by breaking apart. Influence that works through scattering, not staying whole.' */ },
  metis: { symbol: 'Metis', name: 'Metis', color: '#607D8B', group: 'major', description: '' /* 'Trying before knowing. Intelligence built from failed attempts and adjusted approaches.' */ },
  eunomia: { symbol: 'Eunom', name: 'Eunomia', color: '#795548', group: 'major', description: '' /* 'Things that work because they\'re arranged right. Order that earns itself.' */ },
  psyche: { symbol: 'Psych', name: 'Psyche', color: '#9C27B0', group: 'major', description: '' /* 'What\'s left when the surface is stripped away. Exposed core, undisguised material.' */ },
  euphrosyne: { symbol: 'Euphr', name: 'Euphrosyne', color: '#F06292', group: 'major', description: '' /* 'Making something new from the collision. Lineage that starts from being knocked off course.' */ },
  europa: { symbol: 'Europ', name: 'Europa', color: '#2196F3', group: 'major', description: '' /* 'Absorbing the hit and continuing. Stability that exists because the worst already happened.' */ },
  cybele: { symbol: 'Cybel', name: 'Cybele', color: '#8D6E63', group: 'major', description: '' /* 'Standing in the doorway between systems. Not arriving, not leaving\u2014holding the threshold.' */ },
  sylvia: { symbol: 'Sylvi', name: 'Sylvia', color: '#00BCD4', group: 'major', description: '' /* 'Holding together while being made of pieces. Coherence from fragments, not from being solid.' */ },
  thisbe: { symbol: 'Thisb', name: 'Thisbe', color: '#F48FB1', group: 'major', description: '' /* 'Mattering without announcing it. Presence that counts by staying, not by performing.' */ },
  minerva: { symbol: 'Miner', name: 'Minerva', color: '#3F51B5', group: 'major', description: '' /* 'Intelligence that\'s distributed, not singular. Knowing that comes from balancing multiple things at once.' */ },
  elektra: { symbol: 'Elekt', name: 'Elektra', color: '#FFC107', group: 'major', description: '' /* 'The invisible coordination holding complexity together. Architecture you don\'t see until it stops working.' */ },
  kleopatra: { symbol: 'Kleop', name: 'Kleopatra', color: '#673AB7', group: 'major', description: '' /* 'Staying whole under pressure through engineering, not luck. Fragments held by spin and effort.' */ },
  bamberga: { symbol: 'Bambe', name: 'Bamberga', color: '#795548', group: 'major', description: '' /* 'Insight that arrives in bursts, not steady streams. Cycles of dimness and sudden brilliance.' */ },
  davida: { symbol: 'David', name: 'Davida', color: '#607D8B', group: 'major', description: '' /* 'Watching before moving. The patience to scan the whole picture first.' */ },
  interamnia: { symbol: 'Inter', name: 'Interamnia', color: '#455A64', group: 'major', description: '' /* 'Unchanging bedrock. The part that doesn\'t move because everything else depends on it.' */ },
  hygeia: { symbol: 'Hygei', name: 'Hygeia', color: '#66BB6A', group: 'major', description: '' /* 'Functioning with damage intact. Continuity that includes the cracks, not despite them.' */ },

  // Love & Relationship
  eros: { symbol: 'Eros', name: 'Eros', color: '#E91E63', group: 'love', description: '' /* 'The pull that starts things moving. Magnetism before the mind catches up.' */ },
  fama: { symbol: 'Fama', name: 'Fama', color: '#FFC107', group: 'love', description: '' /* 'How your signal carries. The version of you that travels when you\'re not in the room.' */ },

  // Near-Earth & Special
  icarus: { symbol: 'Icaru', name: 'Icarus', color: '#FF5722', group: 'near_earth', description: '' /* 'Going too far in, then swinging all the way back out. The overextension you can\'t stop yourself from repeating.' */ },
  toro: { symbol: 'Toro', name: 'Toro', color: '#D32F2F', group: 'near_earth', description: '' /* 'What keeps coming back around. People, patterns, and unfinished business that orbit you.' */ },
  ganymed: { symbol: 'Ganym', name: 'Ganymed', color: '#7B1FA2', group: 'near_earth', description: '' /* 'Seeing clearly because you\'re close but not inside. The outsider\'s vantage point.' */ },
  apophis: { symbol: 'Apoph', name: 'Apophis', color: '#B71C1C', group: 'near_earth', description: '' /* 'The near-miss that changes everything anyway. Destabilization from proximity, not impact.' */ },

  // Centaurs
  pholus: { symbol: 'Pholu', name: 'Pholus', color: '#795548', group: 'centaurs', description: '' /* 'One small thing uncorking everything. The moment a contained situation stops being contained.' */ },
  nessus: { symbol: 'Nessu', name: 'Nessus', color: '#4E342E', group: 'centaurs', description: '' /* 'Damage that teaches itself to repeat. The loop that needs to be named before it breaks.' */ },
  nyx: { symbol: 'Nyx', name: 'Nyx', color: '#1A237E', group: 'centaurs', description: '' /* 'Productive darkness. What resets in the space where you can\'t see clearly yet.' */ },

  // Trans-Neptunian Objects
  eris: { symbol: 'Eris', name: 'Eris', color: '#B71C1C', group: 'tno', description: '' /* 'The truth nobody wanted brought up. Awareness forced through disruption.' */ },
  sedna: { symbol: 'Sedna', name: 'Sedna', color: '#0D47A1', group: 'tno', description: '' /* 'What survives total isolation. Identity that holds at the farthest remove.' */ },
  makemake: { symbol: 'Makem', name: 'Makemake', color: '#F9A825', group: 'tno', description: '' /* 'Original instructions preserved. The template that exists before anyone builds from it.' */ },
  haumea: { symbol: 'Haume', name: 'Haumea', color: '#43A047', group: 'tno', description: '' /* 'Fast regeneration. Clearing the old and replacing it before the gap is felt.' */ },
  quaoar: { symbol: 'Quaoa', name: 'Quaoar', color: '#00695C', group: 'tno', description: '' /* 'Maintaining structure when everything around it is chaotic. Quiet anchor in noise.' */ },
  varuna: { symbol: 'Varun', name: 'Varuna', color: '#1565C0', group: 'tno', description: '' /* 'Reach that doesn\'t let go. Systems that persist through sheer span.' */ },
  ixion: { symbol: 'Ixion', name: 'Ixion', color: '#880E4F', group: 'tno', description: '' /* 'Movement that ignores the rules. Momentum that breaks through because it refuses to follow the lane.' */ },
  orcus: { symbol: 'Orcus', name: 'Orcus', color: '#212121', group: 'tno', description: '' /* 'Agreements that don\'t expire. What you owe regardless of how things turned out.' */ },
  gonggong: { symbol: 'Gongg', name: 'Gonggong', color: '#1A237E', group: 'tno', description: '' /* 'Displacement that eventually becomes the reason for return. Exile as rediscovery engine.' */ },
  salacia: { symbol: 'Salac', name: 'Salacia', color: '#00BCD4', group: 'tno', description: '' /* 'Connection held across distance. Bonds that work through parallel orbit, not possession.' */ },
  varda: { symbol: 'Varda', name: 'Varda', color: '#7B1FA2', group: 'tno', description: '' /* 'Authority nobody notices. Governance so quiet that others orbit it without realizing.' */ },

  // Fate & Karmic
  nemesis: { symbol: 'Nemes', name: 'Nemesis', color: '#795548', group: 'fate', description: '' /* 'The correction that arrives without anger. What balances out because imbalance can\'t sustain.' */ },

  // Lunar Points (calculated)
  truelilith: { symbol: 'Lil(o)', name: 'True Lilith', color: '#880E4F', group: 'lunar', description: '' /* 'The part that won\'t perform for approval. Unedited instinct, oscillating and alive.' */ },
  meanlilith: { symbol: 'MnLil', name: 'Mean Lilith', color: '#AD1457', group: 'lunar', description: '' /* 'What gets pushed underground because it doesn\'t fit. The exiled wanting.' */ },
  whitemoon: { symbol: 'WhtMn', name: 'White Moon', color: '#E0E0E0', group: 'lunar', description: '' /* 'Where your intentions are actually clean. The rare unburdened impulse.' */ },
  lilithast: { symbol: 'LilAs', name: 'Lilith (ast)', color: '#C2185B', group: 'lunar', description: '' /* 'Embodied refusal. The physical expression of what you won\'t tame.' */ },

  // Calculated Points
  vertex: { symbol: 'Vertx', name: 'Vertex', color: '#9C27B0', group: 'points', description: '' /* 'The intersection you didn\'t arrange. Where circumstance overrides planning.' */ },
  sophia: { symbol: 'Sophi', name: 'Sophia', color: '#7C4DFF', group: 'points', description: '' /* 'Knowing that arrives without study. Wisdom that was always there, waiting to be recognized.' */ },
} as const;

// Arabic Parts (Lots) - calculated client-side from ASC + Planet1 - Planet2
// NOTE: Arabic Part descriptions temporarily disabled — uncomment to restore interpretations
export const ARABIC_PARTS = {
  lot_fortune:  { symbol: '\u2295', name: 'Lot of Fortune', color: '#FFD700', group: 'arabic', description: '' /* 'Where things tend to land well for you without forcing it. ASC + Moon − Sun.' */, formula: { add: 'moon', subtract: 'sun' } },
  lot_spirit:   { symbol: '\u2297', name: 'Lot of Spirit', color: '#B0BEC5', group: 'arabic', description: '' /* 'Where your will actually originates before circumstances shape it. ASC + Sun − Moon.' */, formula: { add: 'sun', subtract: 'moon' } },
  lot_eros:     { symbol: 'L.Er', name: 'Lot of Eros', color: '#E91E63', group: 'arabic', description: '' /* 'What you reach for when want overrides logic. ASC + Venus − Mars.' */, formula: { add: 'venus', subtract: 'mars' } },
  lot_marriage: { symbol: 'L.Ma', name: 'Lot of Marriage', color: '#F48FB1', group: 'arabic', description: '' /* 'The shape commitment takes when you actually mean it. ASC + Venus − Saturn.' */, formula: { add: 'venus', subtract: 'saturn' } },
  lot_wealth:   { symbol: 'L.We', name: 'Lot of Wealth', color: '#FF8F00', group: 'arabic', description: '' /* 'Where material things accumulate or don\'t. Your relationship with having enough. ASC + Jupiter − Saturn.' */, formula: { add: 'jupiter', subtract: 'saturn' } },
  lot_victory:  { symbol: 'L.Vi', name: 'Lot of Victory', color: '#FF6D00', group: 'arabic', description: '' /* 'The kind of winning that feels like yours. ASC + Jupiter − Spirit.' */, formula: { add: 'jupiter', subtract: 'lot_spirit' } },
  lot_commerce: { symbol: 'L.Co', name: 'Lot of Commerce', color: '#FDD835', group: 'arabic', description: '' /* 'How you negotiate, exchange, and move value around. ASC + Mercury − Sun.' */, formula: { add: 'mercury', subtract: 'sun' } },
  lot_passion:  { symbol: 'L.Pa', name: 'Lot of Passion', color: '#D32F2F', group: 'arabic', description: '' /* 'Where your drive runs hot and unmanaged. Raw forward motion. ASC + Mars − Sun.' */, formula: { add: 'mars', subtract: 'sun' } },
  lot_mother:   { symbol: 'L.Mo', name: 'Lot of Mother', color: '#AB47BC', group: 'arabic', description: '' /* 'The imprint of being cared for, or the gap where it should have been. ASC + Moon − Venus.' */, formula: { add: 'moon', subtract: 'venus' } },
  lot_father:   { symbol: 'L.Fa', name: 'Lot of Father', color: '#5C6BC0', group: 'arabic', description: '' /* 'The weight of expectation passed down. Structure inherited or resisted. ASC + Saturn − Sun.' */, formula: { add: 'saturn', subtract: 'sun' } },
  lot_children: { symbol: 'L.Ch', name: 'Lot of Children', color: '#66BB6A', group: 'arabic', description: '' /* 'What you bring into the world and what it becomes without you. ASC + Jupiter − Moon.' */, formula: { add: 'jupiter', subtract: 'moon' } },
  lot_travel:   { symbol: 'L.Tr', name: 'Lot of Travel', color: '#29B6F6', group: 'arabic', description: '' /* 'Where movement changes you. Leaving as a form of becoming. ASC + Saturn − Mars.' */, formula: { add: 'saturn', subtract: 'mars' } },
} as const;

/** Set of all Arabic Part keys (for filtering from API calls) */
export const ARABIC_PART_KEYS = new Set(Object.keys(ARABIC_PARTS));

// Fixed Stars - astrologically important stars with positions on the ecliptic
// Keys are lowercase (matching biwheel planet key convention); API returns capitalized names
// Symbols use abbreviated names (same pattern as asteroids) for readability on the wheel
export const FIXED_STARS = {
  // Royal Stars (Watchers of the Heavens)
  aldebaran:      { symbol: 'Aldeb', name: 'Aldebaran', color: '#FF6D00', group: 'royal' },
  regulus:        { symbol: 'Regul', name: 'Regulus', color: '#FFD600', group: 'royal' },
  antares:        { symbol: 'Antar', name: 'Antares', color: '#D50000', group: 'royal' },
  fomalhaut:      { symbol: 'Fomal', name: 'Fomalhaut', color: '#2979FF', group: 'royal' },
  // Bright Stars (1st magnitude)
  sirius:         { symbol: 'Siriu', name: 'Sirius', color: '#81D4FA', group: 'bright' },
  spica:          { symbol: 'Spica', name: 'Spica', color: '#76FF03', group: 'bright' },
  arcturus:       { symbol: 'Arctu', name: 'Arcturus', color: '#FF9100', group: 'bright' },
  vega:           { symbol: 'Vega', name: 'Vega', color: '#00B0FF', group: 'bright' },
  rigel:          { symbol: 'Rigel', name: 'Rigel', color: '#448AFF', group: 'bright' },
  betelgeuse:     { symbol: 'Betel', name: 'Betelgeuse', color: '#FF3D00', group: 'bright' },
  canopus:        { symbol: 'Canop', name: 'Canopus', color: '#B0BEC5', group: 'bright' },
  capella:        { symbol: 'Capel', name: 'Capella', color: '#FFAB00', group: 'bright' },
  castor:         { symbol: 'Casto', name: 'Castor', color: '#B0BEC5', group: 'bright' },
  pollux:         { symbol: 'Pollu', name: 'Pollux', color: '#FF6E40', group: 'bright' },
  procyon:        { symbol: 'Procy', name: 'Procyon', color: '#FFD740', group: 'bright' },
  deneb:          { symbol: 'Deneb', name: 'Deneb', color: '#CE93D8', group: 'bright' },
  altair:         { symbol: 'Altai', name: 'Altair', color: '#80CBC4', group: 'bright' },
  achernar:       { symbol: 'Acher', name: 'Achernar', color: '#40C4FF', group: 'bright' },
  // Notable Stars
  algol:          { symbol: 'Algol', name: 'Algol', color: '#D50000', group: 'notable' },
  alcyone:        { symbol: 'Alcyo', name: 'Alcyone', color: '#7C4DFF', group: 'notable' },
  bellatrix:      { symbol: 'Bella', name: 'Bellatrix', color: '#448AFF', group: 'notable' },
  denebola:       { symbol: 'Dnbla', name: 'Denebola', color: '#00B0FF', group: 'notable' },
  el_nath:        { symbol: 'ElNat', name: 'El Nath', color: '#B0BEC5', group: 'notable' },
  hamal:          { symbol: 'Hamal', name: 'Hamal', color: '#FF6D00', group: 'notable' },
  markab:         { symbol: 'Mrkab', name: 'Markab', color: '#7C4DFF', group: 'notable' },
  menkar:         { symbol: 'Mnkar', name: 'Menkar', color: '#FF6E40', group: 'notable' },
  mirach:         { symbol: 'Mirac', name: 'Mirach', color: '#F48FB1', group: 'notable' },
  nunki:          { symbol: 'Nunki', name: 'Nunki', color: '#00BFA5', group: 'notable' },
  ras_alhague:    { symbol: 'RasAl', name: 'Ras Alhague', color: '#69F0AE', group: 'notable' },
  scheat:         { symbol: 'Schea', name: 'Scheat', color: '#B388FF', group: 'notable' },
  vindemiatrix:   { symbol: 'Vinde', name: 'Vindemiatrix', color: '#A5D6A7', group: 'notable' },
  zosma:          { symbol: 'Zosma', name: 'Zosma', color: '#90CAF9', group: 'notable' },
  zubeneschamali: { symbol: 'ZubSh', name: 'Zubeneschamali', color: '#69F0AE', group: 'notable' },
  zubenelgenubi:  { symbol: 'ZubEl', name: 'Zubenelgenubi', color: '#FFAB91', group: 'notable' },
  // Minor Stars
  sadalmelik:     { symbol: 'SadMl', name: 'Sadalmelik', color: '#80D8FF', group: 'minor' },
  sadalsuud:      { symbol: 'SadSu', name: 'Sadalsuud', color: '#80D8FF', group: 'minor' },
  toliman:        { symbol: 'Tolim', name: 'Toliman', color: '#FFCC80', group: 'minor' },
  unukalhai:      { symbol: 'Unuka', name: 'Unukalhai', color: '#EF5350', group: 'minor' },
  alnilam:        { symbol: 'Anlam', name: 'Alnilam', color: '#90CAF9', group: 'minor' },
  alnitak:        { symbol: 'Antak', name: 'Alnitak', color: '#90CAF9', group: 'minor' },
  mintaka:        { symbol: 'Mntka', name: 'Mintaka', color: '#90CAF9', group: 'minor' },
} as const;

// Fixed star group definitions for UI
export const FIXED_STAR_GROUP_INFO = {
  royal: { name: 'Royal Stars', color: '#FFD600', icon: '★' },
  bright: { name: 'Bright Stars', color: '#E0E0E0', icon: '✦' },
  notable: { name: 'Notable Stars', color: '#7C4DFF', icon: '✧' },
  minor: { name: 'Minor Stars', color: '#90CAF9', icon: '·' },
} as const;

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

// Default visible planets — Sun through Pluto (the 10 core planets)
export const DEFAULT_VISIBLE_PLANETS = new Set([
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'northnode', 'southnode',
  'chiron', 'lilith', 'juno', 'ceres', 'pallas', 'vesta',
  'ascendant', 'descendant', 'midheaven', 'ic',
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
// Accepts optional overrides map for custom per-planet orbs
export function getPlanetOrb(planetKey: string, overrides?: Record<string, number>): number {
  const key = planetKey.toLowerCase();
  if (overrides && key in overrides) return overrides[key];
  return PLANET_ORBS[key] ?? DEFAULT_ASTEROID_ORB;
}

// Get effective orb for an aspect between two planets (average of both)
// Accepts optional overrides for custom per-planet orbs
export function getEffectiveOrb(planetA: string, planetB: string, planetOrbOverrides?: Record<string, number>): number {
  return (getPlanetOrb(planetA, planetOrbOverrides) + getPlanetOrb(planetB, planetOrbOverrides)) / 2;
}

// Get the orb for a specific aspect type, with optional override
export function getAspectOrb(aspectType: string, overrides?: Record<string, number>): number {
  if (overrides && aspectType in overrides) return overrides[aspectType];
  const def = ASPECTS[aspectType as keyof typeof ASPECTS];
  return def?.orb ?? 8;
}

// Get the separating orb for a specific aspect type
// Falls back to separating overrides → applying overrides → default orb
export function getAspectSeparatingOrb(aspectType: string, separatingOverrides?: Record<string, number>, applyingOverrides?: Record<string, number>): number {
  if (separatingOverrides && aspectType in separatingOverrides) return separatingOverrides[aspectType];
  const def = ASPECTS[aspectType as keyof typeof ASPECTS];
  return def?.separatingOrb ?? getAspectOrb(aspectType, applyingOverrides);
}

// Aspect definitions (classic astrology colors)
export const ASPECTS = {
  conjunction: {
    name: 'Conjunction',
    symbol: '\u260C',
    angle: 0,
    orb: 8,
    separatingOrb: 8,
    color: '#daa520', // gold/orange
    nature: 'neutral',
    major: true,
  },
  sextile: {
    name: 'Sextile',
    symbol: '\u26B9',
    angle: 60,
    orb: 5,
    separatingOrb: 4,
    color: '#1e5aa8', // blue
    nature: 'harmonious',
    major: true,
  },
  square: {
    name: 'Square',
    symbol: '\u25A1',
    angle: 90,
    orb: 7,
    separatingOrb: 5,
    color: '#c41e3a', // red
    nature: 'challenging',
    major: true,
  },
  trine: {
    name: 'Trine',
    symbol: '\u25B3',
    angle: 120,
    orb: 7,
    separatingOrb: 5,
    color: '#00bcd4', // cyan/light blue
    nature: 'harmonious',
    major: true,
  },
  opposition: {
    name: 'Opposition',
    symbol: '\u260D',
    angle: 180,
    orb: 8,
    separatingOrb: 8,
    color: '#c41e3a', // red
    nature: 'challenging',
    major: true,
  },
  quincunx: {
    name: 'Quincunx',
    symbol: '\u26BB',
    angle: 150,
    orb: 3,
    separatingOrb: 2,
    color: '#228b22', // green
    nature: 'challenging',
    major: true,
  },
  semisextile: {
    name: 'Semi-sextile',
    symbol: '\u26BA',
    angle: 30,
    orb: 2,
    separatingOrb: 1.5,
    color: '#228b22', // green
    nature: 'neutral',
    major: true,
  },
  semisquare: {
    name: 'Semi-square',
    symbol: '\u2220',
    angle: 45,
    orb: 2,
    separatingOrb: 1.5,
    color: '#c41e3a', // red
    nature: 'challenging',
    major: true,
  },
  sesquiquadrate: {
    name: 'Sesquiquadrate',
    symbol: '\u26BC',
    angle: 135,
    orb: 2,
    separatingOrb: 1.5,
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
    separatingOrb: 1,
    color: '#607D8B', // blue-gray
    nature: 'neutral',
    major: false,
  },
  decile: {
    name: 'Decile',
    symbol: 'D',
    angle: 36,
    orb: 1,
    separatingOrb: 1,
    color: '#9C27B0', // purple (quintile family)
    nature: 'harmonious',
    major: false,
  },
  novile: {
    name: 'Novile',
    symbol: 'N',
    angle: 40,
    orb: 1,
    separatingOrb: 1,
    color: '#FF8F00', // amber (novile family)
    nature: 'harmonious',
    major: false,
  },
  septile: {
    name: 'Septile',
    symbol: 'S\u2087', // S₇
    angle: 51.4286, // 360/7
    orb: 1,
    separatingOrb: 1,
    color: '#00897B', // teal (septile family)
    nature: 'neutral',
    major: false,
  },
  quintile: {
    name: 'Quintile',
    symbol: 'Q',
    angle: 72, // 360/5
    orb: 1,
    separatingOrb: 1,
    color: '#7B1FA2', // deep purple (quintile family)
    nature: 'harmonious',
    major: false,
  },
  binovile: {
    name: 'Bi-Novile',
    symbol: 'bN',
    angle: 80, // 2 × 360/9
    orb: 1,
    separatingOrb: 1,
    color: '#FF8F00', // amber (novile family)
    nature: 'harmonious',
    major: false,
  },
  biseptile: {
    name: 'Bi-Septile',
    symbol: 'bS\u2087', // bS₇
    angle: 102.8571, // 2 × 360/7
    orb: 1,
    separatingOrb: 1,
    color: '#00897B', // teal (septile family)
    nature: 'neutral',
    major: false,
  },
  biquintile: {
    name: 'Bi-Quintile',
    symbol: 'bQ',
    angle: 144, // 2 × 360/5
    orb: 1,
    separatingOrb: 1,
    color: '#7B1FA2', // deep purple (quintile family)
    nature: 'harmonious',
    major: false,
  },
  triseptile: {
    name: 'Tri-Septile',
    symbol: 'tS\u2087', // tS₇
    angle: 154.2857, // 3 × 360/7
    orb: 1,
    separatingOrb: 1,
    color: '#00897B', // teal (septile family)
    nature: 'neutral',
    major: false,
  },
  quadnovile: {
    name: 'Quad-Novile',
    symbol: 'qN',
    angle: 160, // 4 × 360/9
    orb: 1,
    separatingOrb: 1,
    color: '#FF8F00', // amber (novile family)
    nature: 'harmonious',
    major: false,
  },
  quindecile: {
    name: 'Quindecile',
    symbol: 'Qd',
    angle: 165,
    orb: 1,
    separatingOrb: 1,
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
  descendant: '#E0E0E0',
  midheaven: '#D0D0D0',
  ic: '#D0D0D0',
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
    color = part?.color ?? '';
  }
  if (!color) {
    const star = FIXED_STARS[key as keyof typeof FIXED_STARS];
    color = star?.color ?? '#a78bfa';
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
