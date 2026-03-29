/**
 * Multi-Technique Rectification Engine
 *
 * Scores candidate birth times using 5 independent techniques:
 * 1. Transits to angles (0.30) - outer planets hitting ASC/MC/IC/DSC at event dates
 * 2. Age-degree activations (0.25) - planet degree = activation age
 * 3. Profections (0.15) - year lord matches event category
 * 4. Solar returns (0.15) - SR ASC/planets match event type
 * 5. Progressions (0.15) - progressed ASC/MC/Moon at events
 */

import type { EventCategory } from './rectificationScoring';

// ─── Types ────────────────────────────────────────────────────────

export interface RectificationEvent {
  date: string;          // "2015-06-15"
  category: EventCategory;
  description: string;
  age?: number;          // computed from birth_date
  monthPrecision?: boolean; // does user know exact month?
}

export interface CandidateScore {
  time: string;           // "14:30"
  totalScore: number;
  weightedScore: number;
  ascendantSign: string;
  ascendantLongitude: number;
  scores: {
    transit: number;
    activation: number;
    profection: number;
    solarReturn: number;
    progression: number;
  };
  eventBreakdowns: EventBreakdown[];
}

export interface EventBreakdown {
  event: RectificationEvent;
  transitScore: number;
  activationScore: number;
  profectionScore: number;
  solarReturnScore: number;
  progressionScore: number;
  indicators: string[];
}

export interface ActivationInfo {
  planet: string;
  degreeInSign: number;   // includes arcminutes as decimal
  natalSign: string;
  activationAges: number[]; // 4 cycles
}

export interface RectificationSession {
  birthDate: string;
  lat: number;
  lng: number;
  birthCity: string;
  approximateTimeRange?: string;
  events: RectificationEvent[];
  candidates: CandidateScore[];
  phase: 'init' | 'events' | 'correlate' | 'probe' | 'verify' | 'refine' | 'done';
  activationConfirms: number;
  blindPredictionConfirms: number;
  confidence: number;
  finalTime?: string;
  finalAscendant?: string;
}

// ─── Constants ────────────────────────────────────────────────────

const TECHNIQUE_WEIGHTS = {
  transit: 0.30,
  activation: 0.25,
  profection: 0.15,
  solarReturn: 0.15,
  progression: 0.15,
};

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const TRADITIONAL_RULERS: Record<string, string> = {
  Aries: 'mars', Taurus: 'venus', Gemini: 'mercury', Cancer: 'moon',
  Leo: 'sun', Virgo: 'mercury', Libra: 'venus', Scorpio: 'pluto',
  Sagittarius: 'jupiter', Capricorn: 'saturn', Aquarius: 'uranus', Pisces: 'neptune',
};

/** Event category → relevant planets and houses for scoring */
const EVENT_PLANET_HOUSES: Record<EventCategory, { planets: string[]; houses: number[] }> = {
  marriage: { planets: ['venus', 'jupiter', 'sun', 'moon'], houses: [7, 5, 1] },
  career: { planets: ['saturn', 'jupiter', 'sun', 'mars'], houses: [10, 6, 2] },
  accident: { planets: ['mars', 'uranus', 'pluto'], houses: [1, 6, 8, 12] },
  child: { planets: ['moon', 'jupiter', 'venus'], houses: [5, 4, 1] },
  relocation: { planets: ['uranus', 'jupiter', 'moon'], houses: [4, 9, 3] },
  health: { planets: ['mars', 'saturn', 'neptune'], houses: [6, 8, 12, 1] },
  education: { planets: ['mercury', 'jupiter', 'saturn'], houses: [9, 3, 10] },
  death_family: { planets: ['saturn', 'pluto', 'mars'], houses: [4, 8, 12] },
  divorce: { planets: ['saturn', 'uranus', 'pluto', 'mars'], houses: [7, 8, 1] },
  spiritual: { planets: ['neptune', 'jupiter', 'pluto'], houses: [9, 12, 8] },
  legal: { planets: ['saturn', 'jupiter', 'mars'], houses: [9, 7, 10] },
  financial: { planets: ['venus', 'jupiter', 'pluto'], houses: [2, 8, 10] },
  travel_long: { planets: ['jupiter', 'uranus', 'moon'], houses: [9, 3, 4] },
};

// ─── Transit Scoring ──────────────────────────────────────────────

interface TransitAspect {
  transit_planet: string;
  natal_planet?: string;
  aspect: string;
  orb: number;
}

interface NatalChartData {
  planets: Array<{ planet: string; longitude: number; sign: string; house?: number; degree?: number }>;
  houses?: { cusps: number[]; ascendant: number; mc: number };
  angles?: { ascendant: number; midheaven: number };
}

/**
 * Score transits for a single event against a candidate chart.
 * Outer planet hard aspects to angles score highest.
 */
export function scoreTransits(
  transitAspects: TransitAspect[],
  natalChart: NatalChartData,
  event: RectificationEvent,
): { score: number; indicators: string[] } {
  let score = 0;
  const indicators: string[] = [];
  const config = EVENT_PLANET_HOUSES[event.category];
  if (!config) return { score: 0, indicators: [] };

  const outerPlanets = new Set(['saturn', 'uranus', 'neptune', 'pluto']);
  const angleNames = new Set(['ascendant', 'asc', 'mc', 'midheaven', 'ic', 'dsc', 'descendant']);

  for (const aspect of transitAspects) {
    const tp = aspect.transit_planet?.toLowerCase() || '';
    const np = aspect.natal_planet?.toLowerCase() || '';
    const aspectType = aspect.aspect?.toLowerCase() || '';
    const isHard = ['conjunction', 'opposition', 'square'].includes(aspectType);
    if (!isHard) continue;

    const isOuter = outerPlanets.has(tp);
    const isAngle = angleNames.has(np);
    const isRelevantPlanet = config.planets.includes(np);
    const tightOrb = aspect.orb < 1;
    const wideOrb = aspect.orb > 3 && aspect.orb <= 5;

    // Outer planet to ASC/MC
    if (isOuter && (np === 'ascendant' || np === 'asc')) {
      score += 5;
      indicators.push(`T.${tp} ${aspectType} ASC (${aspect.orb.toFixed(1)}°)`);
    } else if (isOuter && (np === 'mc' || np === 'midheaven')) {
      score += 5;
      indicators.push(`T.${tp} ${aspectType} MC (${aspect.orb.toFixed(1)}°)`);
    } else if (isOuter && (np === 'ic' || np === 'dsc' || np === 'descendant')) {
      score += 4;
      indicators.push(`T.${tp} ${aspectType} ${np.toUpperCase()} (${aspect.orb.toFixed(1)}°)`);
    } else if (isOuter && isRelevantPlanet) {
      score += 2;
      indicators.push(`T.${tp} ${aspectType} N.${np} (${aspect.orb.toFixed(1)}°)`);
    }

    // Tight orb bonus
    if (tightOrb && score > 0) {
      score += 2;
    }
    // Wide orb penalty
    if (wideOrb && score > 0) {
      score -= 1;
    }
  }

  // Jupiter/Venus harmonious to relevant house planets
  const benefics = ['jupiter', 'venus'];
  for (const aspect of transitAspects) {
    const tp = aspect.transit_planet?.toLowerCase() || '';
    const np = aspect.natal_planet?.toLowerCase() || '';
    const aspectType = aspect.aspect?.toLowerCase() || '';
    if (benefics.includes(tp) && config.planets.includes(np) && ['trine', 'sextile'].includes(aspectType)) {
      score += 2;
      indicators.push(`T.${tp} ${aspectType} N.${np} (harmonious)`);
    }
  }

  return { score, indicators };
}

// ─── Activation Scoring ───────────────────────────────────────────

/**
 * Compute all activation ages for a planet in a natal chart.
 * activationAge = cycle * 30 + degreeInSign (arcminute precision)
 */
export function computeAllActivations(
  planets: Array<{ planet: string; longitude: number }>,
): ActivationInfo[] {
  const planetKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
    'uranus', 'neptune', 'pluto', 'ascendant', 'midheaven'];

  const results: ActivationInfo[] = [];

  for (const p of planets) {
    const key = p.planet?.toLowerCase();
    if (!key || !planetKeys.includes(key)) continue;

    const degreeInSign = p.longitude % 30;
    const signIndex = Math.floor(p.longitude / 30) % 12;

    const ages: number[] = [];
    for (let cycle = 0; cycle < 4; cycle++) {
      ages.push(cycle * 30 + degreeInSign);
    }

    results.push({
      planet: key,
      degreeInSign: Math.round(degreeInSign * 10000) / 10000, // arcminute precision
      natalSign: SIGNS[signIndex],
      activationAges: ages,
    });
  }

  return results;
}

/**
 * Score activation matches for a single event.
 * Checks if event age matches any planet activation age.
 */
export function scoreActivations(
  activations: ActivationInfo[],
  event: RectificationEvent,
  birthDate: string,
): { score: number; indicators: string[] } {
  if (!event.age && !event.date) return { score: 0, indicators: [] };

  let score = 0;
  const indicators: string[] = [];
  const config = EVENT_PLANET_HOUSES[event.category];

  // Calculate event age
  const birth = new Date(birthDate);
  const eventDate = new Date(event.date);
  const eventAge = (eventDate.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  for (const activation of activations) {
    for (const actAge of activation.activationAges) {
      const diff = Math.abs(eventAge - actAge);

      let points = 0;
      if (diff <= 0.25) points = 6;
      else if (diff <= 0.5) points = 4;
      else if (diff <= 1.0) points = 2;
      else if (diff <= 1.5) points = 1;

      if (points > 0) {
        // Bonus if activated planet is relevant to event category
        const isRelevant = config?.planets.includes(activation.planet);
        if (isRelevant) points += 2;

        score += points;
        indicators.push(`${activation.planet} activates at ${actAge.toFixed(1)}y (event at ${eventAge.toFixed(1)}y, diff ${diff.toFixed(2)}y)${isRelevant ? ' [relevant]' : ''}`);
      }
    }
  }

  return { score, indicators };
}

/**
 * Find activation ages where candidates DIVERGE most.
 * Used for targeted probing questions.
 */
export function findDivergentActivations(
  candidateActivations: Array<{ time: string; activations: ActivationInfo[] }>,
): Array<{ age: number; planet: string; candidateTimes: Record<string, number> }> {
  const divergent: Array<{ age: number; planet: string; candidateTimes: Record<string, number>; spread: number }> = [];

  // For each planet, gather all activation ages across candidates
  const planetKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'ascendant', 'midheaven'];

  for (const planetKey of planetKeys) {
    // Get activation ages for this planet per candidate
    const candidateAges: Record<string, number[]> = {};
    for (const cand of candidateActivations) {
      const act = cand.activations.find(a => a.planet === planetKey);
      if (act) {
        candidateAges[cand.time] = act.activationAges;
      }
    }

    const times = Object.keys(candidateAges);
    if (times.length < 2) continue;

    // For each cycle, check if candidates diverge
    for (let cycle = 0; cycle < 4; cycle++) {
      const agesByCandidate: Record<string, number> = {};
      for (const t of times) {
        if (candidateAges[t][cycle] !== undefined) {
          agesByCandidate[t] = candidateAges[t][cycle];
        }
      }

      const ages = Object.values(agesByCandidate);
      if (ages.length < 2) continue;

      const spread = Math.max(...ages) - Math.min(...ages);
      // Only interesting if spread > 0.25 years (they'd give different answers)
      if (spread > 0.25) {
        const avgAge = ages.reduce((s, a) => s + a, 0) / ages.length;
        divergent.push({
          age: Math.round(avgAge * 100) / 100,
          planet: planetKey,
          candidateTimes: agesByCandidate,
          spread,
        });
      }
    }
  }

  // Sort by spread (most divergent first)
  divergent.sort((a, b) => b.spread - a.spread);

  return divergent.slice(0, 10).map(({ spread: _, ...rest }) => rest);
}

// ─── Profection Scoring ───────────────────────────────────────────

/**
 * Calculate profection year lord for a given event date.
 * Uses equinox-based profections (matching profections.ts).
 */
export function calculateProfectionLord(
  birthDate: string,
  eventDate: string,
): { yearLord: string; yearSign: string; yearHouse: number; monthLord?: string } {
  const birth = new Date(birthDate);
  const event = new Date(eventDate);

  // Find first vernal equinox after birth
  let firstEqYear = birth.getFullYear();
  let firstEquinox = getVernalEquinox(firstEqYear);
  if (firstEquinox.getTime() <= birth.getTime()) {
    firstEqYear++;
    firstEquinox = getVernalEquinox(firstEqYear);
  }

  // Find which profection year the event falls in
  if (event.getTime() < firstEquinox.getTime()) {
    // Pre-period (Pisces)
    return { yearLord: 'neptune', yearSign: 'Pisces', yearHouse: 12 };
  }

  let yearNumber = 0;
  for (let n = 1; n < 200; n++) {
    const eqStart = getVernalEquinox(firstEqYear + n - 1);
    const eqEnd = getVernalEquinox(firstEqYear + n);
    if (event.getTime() >= eqStart.getTime() && event.getTime() < eqEnd.getTime()) {
      yearNumber = n;

      // Calculate month lord
      const signIndex = (n - 1) % 12;
      const yearSign = SIGNS[signIndex];
      const yearLord = TRADITIONAL_RULERS[yearSign];
      const yearHouse = signIndex + 1;

      // Monthly profection
      const totalMs = eqEnd.getTime() - eqStart.getTime();
      const monthMs = totalMs / 12;
      const eventOffsetMs = event.getTime() - eqStart.getTime();
      const monthIndex = Math.floor(eventOffsetMs / monthMs) % 12;
      const monthSignIndex = (signIndex + monthIndex) % 12;
      const monthSign = SIGNS[monthSignIndex];
      const monthLord = TRADITIONAL_RULERS[monthSign];

      return { yearLord, yearSign, yearHouse, monthLord };
    }
  }

  // Fallback
  const signIndex = (yearNumber - 1) % 12;
  return { yearLord: TRADITIONAL_RULERS[SIGNS[signIndex]], yearSign: SIGNS[signIndex], yearHouse: signIndex + 1 };
}

function getVernalEquinox(year: number): Date {
  const T = (year - 2000) / 1000;
  const JDE = 2451623.80984 + 365242.37404 * T + 0.05169 * T * T - 0.00411 * T * T * T - 0.00057 * T * T * T * T;
  const msFromEpoch = (JDE - 2440587.5) * 86400000;
  return new Date(msFromEpoch);
}

/**
 * Score profections for a single event.
 * Checks if profection year lord matches event category.
 */
export function scoreProfections(
  birthDate: string,
  event: RectificationEvent,
): { score: number; indicators: string[] } {
  const config = EVENT_PLANET_HOUSES[event.category];
  if (!config) return { score: 0, indicators: [] };

  const { yearLord, yearSign, yearHouse, monthLord } = calculateProfectionLord(birthDate, event.date);

  let score = 0;
  const indicators: string[] = [];

  // Year lord is relevant planet for event category
  if (config.planets.includes(yearLord)) {
    score += 3;
    indicators.push(`Year lord ${yearLord} (${yearSign}) relevant for ${event.category}`);
  }

  // Year house matches event house
  if (config.houses.includes(yearHouse)) {
    score += 2;
    indicators.push(`Profection H${yearHouse} matches ${event.category} house`);
  }

  // Month lord matches (if available)
  if (monthLord && config.planets.includes(monthLord)) {
    score += 1;
    indicators.push(`Month lord ${monthLord} relevant`);
  }

  // Clear mismatch (year lord unrelated AND wrong house)
  if (!config.planets.includes(yearLord) && !config.houses.includes(yearHouse)) {
    score -= 1;
    indicators.push(`Profection mismatch: ${yearSign}/H${yearHouse} unrelated to ${event.category}`);
  }

  return { score, indicators };
}

// ─── Solar Return Scoring ─────────────────────────────────────────

interface SolarReturnData {
  ascendant: number;
  planets: Array<{ planet: string; longitude: number; house?: number }>;
}

/**
 * Score solar return chart for a single event year.
 */
export function scoreSolarReturn(
  srData: SolarReturnData,
  event: RectificationEvent,
  natalChart: NatalChartData,
): { score: number; indicators: string[] } {
  const config = EVENT_PLANET_HOUSES[event.category];
  if (!config) return { score: 0, indicators: [] };

  let score = 0;
  const indicators: string[] = [];

  // SR ASC in relevant sign
  const srAscSign = SIGNS[Math.floor(srData.ascendant / 30) % 12];
  const srAscRuler = TRADITIONAL_RULERS[srAscSign];
  if (config.planets.includes(srAscRuler)) {
    score += 3;
    indicators.push(`SR ASC in ${srAscSign} (ruler ${srAscRuler} relevant)`);
  }

  // SR planet in relevant house
  for (const p of srData.planets) {
    const pk = p.planet?.toLowerCase();
    if (config.planets.includes(pk) && p.house && config.houses.includes(p.house)) {
      score += 2;
      indicators.push(`SR ${pk} in H${p.house}`);
    }
  }

  // SR planet conjunct natal angle
  const natalAsc = natalChart.houses?.ascendant ?? natalChart.angles?.ascendant ?? 0;
  const natalMc = natalChart.houses?.mc ?? natalChart.angles?.midheaven ?? 0;

  for (const p of srData.planets) {
    const pk = p.planet?.toLowerCase();
    if (!config.planets.includes(pk)) continue;

    const ascOrb = Math.abs(normalizeAngle(p.longitude - natalAsc));
    const mcOrb = Math.abs(normalizeAngle(p.longitude - natalMc));

    if (ascOrb < 5 || ascOrb > 355) {
      score += 4;
      indicators.push(`SR ${pk} conjunct natal ASC (${Math.min(ascOrb, 360 - ascOrb).toFixed(1)}°)`);
    }
    if (mcOrb < 5 || mcOrb > 355) {
      score += 4;
      indicators.push(`SR ${pk} conjunct natal MC (${Math.min(mcOrb, 360 - mcOrb).toFixed(1)}°)`);
    }
  }

  // Angular SR planets matching event type
  for (const p of srData.planets) {
    const pk = p.planet?.toLowerCase();
    if (p.house && [1, 4, 7, 10].includes(p.house) && config.planets.includes(pk)) {
      score += 2;
      indicators.push(`SR ${pk} angular (H${p.house})`);
    }
  }

  return { score, indicators };
}

// ─── Progression Scoring ──────────────────────────────────────────

interface ProgressedData {
  ascendant?: number;
  midheaven?: number;
  moon?: { longitude: number };
  planets?: Array<{ planet: string; longitude: number }>;
}

/**
 * Score progressions for a single event.
 * Checks for progressed ASC/MC sign changes and Moon aspects.
 */
export function scoreProgressions(
  progData: ProgressedData,
  event: RectificationEvent,
  natalChart: NatalChartData,
): { score: number; indicators: string[] } {
  const config = EVENT_PLANET_HOUSES[event.category];
  if (!config) return { score: 0, indicators: [] };

  let score = 0;
  const indicators: string[] = [];

  const natalAsc = natalChart.houses?.ascendant ?? natalChart.angles?.ascendant ?? 0;
  const natalMc = natalChart.houses?.mc ?? natalChart.angles?.midheaven ?? 0;

  // Progressed ASC changing sign near event (comparing to natal sign)
  if (progData.ascendant !== undefined) {
    const natalAscSign = Math.floor(natalAsc / 30) % 12;
    const progAscSign = Math.floor(progData.ascendant / 30) % 12;
    if (natalAscSign !== progAscSign) {
      score += 5;
      indicators.push(`Progressed ASC changed sign: ${SIGNS[natalAscSign]} → ${SIGNS[progAscSign]}`);
    }
  }

  // Progressed MC changing sign
  if (progData.midheaven !== undefined) {
    const natalMcSign = Math.floor(natalMc / 30) % 12;
    const progMcSign = Math.floor(progData.midheaven / 30) % 12;
    if (natalMcSign !== progMcSign) {
      score += 5;
      indicators.push(`Progressed MC changed sign: ${SIGNS[natalMcSign]} → ${SIGNS[progMcSign]}`);
    }
  }

  // Progressed Moon conjunct natal angle
  if (progData.moon) {
    const moonToAsc = Math.abs(normalizeAngle(progData.moon.longitude - natalAsc));
    const moonToMc = Math.abs(normalizeAngle(progData.moon.longitude - natalMc));

    if (moonToAsc < 3 || moonToAsc > 357) {
      score += 4;
      indicators.push(`Progressed Moon conjunct natal ASC (${Math.min(moonToAsc, 360 - moonToAsc).toFixed(1)}°)`);
    }
    if (moonToMc < 3 || moonToMc > 357) {
      score += 4;
      indicators.push(`Progressed Moon conjunct natal MC (${Math.min(moonToMc, 360 - moonToMc).toFixed(1)}°)`);
    }

    // Progressed Moon in event-relevant house (approximate using whole-sign)
    const moonSign = Math.floor(progData.moon.longitude / 30) % 12;
    const ascSign = Math.floor(natalAsc / 30) % 12;
    const moonHouse = ((moonSign - ascSign + 12) % 12) + 1;
    if (config.houses.includes(moonHouse)) {
      score += 2;
      indicators.push(`Progressed Moon in H${moonHouse} (relevant)`);
    }
  }

  return { score, indicators };
}

// ─── Combined Scoring ─────────────────────────────────────────────

export interface TechniqueScores {
  transit: { score: number; indicators: string[] };
  activation: { score: number; indicators: string[] };
  profection: { score: number; indicators: string[] };
  solarReturn: { score: number; indicators: string[] };
  progression: { score: number; indicators: string[] };
}

/**
 * Compute weighted combined score from all techniques for a candidate.
 */
export function computeWeightedScore(scores: TechniqueScores): number {
  const maxScores = {
    transit: 30,      // ~6 events * 5 points max each
    activation: 32,   // ~4 events * 8 points max each
    profection: 18,   // ~6 events * 3 points max each
    solarReturn: 24,  // ~3 events * 8 points max each
    progression: 20,  // ~2 events * 10 points max each
  };

  // Normalize each score to 0-100 range then weight
  let weighted = 0;
  for (const [technique, weight] of Object.entries(TECHNIQUE_WEIGHTS) as [keyof typeof TECHNIQUE_WEIGHTS, number][]) {
    const raw = Math.max(0, scores[technique].score);
    const maxVal = maxScores[technique];
    const normalized = Math.min(100, (raw / maxVal) * 100);
    weighted += normalized * weight;
  }

  return Math.round(weighted * 100) / 100;
}

// ─── Confidence Calculation ───────────────────────────────────────

/**
 * Calculate confidence percentage based on evidence quality.
 */
export function calculateConfidence(params: {
  numEvents: number;
  activationConfirms: number;
  scoreMargin: number;        // difference between 1st and 2nd candidate
  blindPredictionConfirms: number;
  techniqueConvergence: number; // how many techniques agree (0-5)
}): number {
  let confidence = 50;

  // More events = more data (up to +15)
  confidence += Math.min(params.numEvents * 3, 15);

  // Each confirmed activation = huge boost (+5 each)
  confidence += params.activationConfirms * 5;

  // Score margin bonus (5-10)
  if (params.scoreMargin > 20) confidence += 10;
  else if (params.scoreMargin > 10) confidence += 7;
  else if (params.scoreMargin > 5) confidence += 5;

  // Blind prediction confirmations (+3 each)
  confidence += params.blindPredictionConfirms * 3;

  // Technique convergence bonus (5-10)
  if (params.techniqueConvergence >= 4) confidence += 10;
  else if (params.techniqueConvergence >= 3) confidence += 7;
  else if (params.techniqueConvergence >= 2) confidence += 5;

  // Cap at 98%
  return Math.min(98, Math.max(50, confidence));
}

/**
 * Count how many techniques agree on the same top candidate.
 */
export function countTechniqueConvergence(candidates: CandidateScore[]): number {
  if (candidates.length < 2) return 5;

  const sorted = [...candidates].sort((a, b) => b.weightedScore - a.weightedScore);
  const topTime = sorted[0].time;

  let agrees = 0;
  const topScores = sorted[0].scores;
  const secondScores = sorted[1].scores;

  if (topScores.transit > secondScores.transit) agrees++;
  if (topScores.activation > secondScores.activation) agrees++;
  if (topScores.profection > secondScores.profection) agrees++;
  if (topScores.solarReturn > secondScores.solarReturn) agrees++;
  if (topScores.progression > secondScores.progression) agrees++;

  return agrees;
}

// ─── Utility ──────────────────────────────────────────────────────

function normalizeAngle(angle: number): number {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

export function signFromLongitude(longitude: number): string {
  return SIGNS[Math.floor((longitude % 360) / 30) % 12];
}

export function degreeInSign(longitude: number): number {
  return longitude % 30;
}

/**
 * Generate candidate times for a given range.
 * @param start Start hour (0-23)
 * @param end End hour (0-23), exclusive
 * @param intervalMinutes Minutes between candidates
 */
export function generateCandidateTimes(start: number, end: number, intervalMinutes: number): string[] {
  const times: string[] = [];
  for (let h = start; h < end; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return times;
}

/**
 * Calculate age at event from birth date and event date.
 */
export function ageAtEvent(birthDate: string, eventDate: string): number {
  const birth = new Date(birthDate);
  const event = new Date(eventDate);
  return (event.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}
