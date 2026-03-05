/**
 * Chart Reading Tree — Core Computation Engine
 *
 * Builds a vantage tree from natal chart data using whole-sign houses.
 * Pure math computation — no AI involved.
 * Ported from DruzeMatchWeb
 */

import { ZODIAC_SIGNS, PLANETS } from '@/components/biwheel/utils/constants';
import { calculateDegreeSign, calculateDecan } from '@/components/biwheel/utils/chartMath';
import { calculateProfections } from '@/lib/profections';
import { classifyAspectsForPlanet } from './aspectClassification';
import type {
  NatalChart,
  ChartReadingParams,
  PlanetAnalysis,
  SourceHouse,
  BackwardTrace,
  ForwardTrace,
  VantageTree,
  ChartReadingTree,
  QuestionCategory,
  DerivedHouseConfig,
  CompactChartSummary,
  CompactPlanetSummary,
  TransitAspectContext,
  TransitContext,
  ProfectionContext,
  AgeDegreeActivation,
} from './types';
import {
  TRADITIONAL_RULERS,
  HOUSE_TOPICS,
  HOUSE_TO_SIGN,
  DEFAULT_PARAMS,
  detectCategories,
  DERIVED_HOUSE_PERSPECTIVES,
} from './types';

const SIGN_NAMES = ZODIAC_SIGNS.map(s => s.name);

// ─── Inverted ruler map: planet → signs it rules ───────────────────
const PLANET_TO_RULED_SIGNS: Record<string, string[]> = {};
for (const [sign, info] of Object.entries(TRADITIONAL_RULERS)) {
  const ruler = info.ruler;
  if (!PLANET_TO_RULED_SIGNS[ruler]) {
    PLANET_TO_RULED_SIGNS[ruler] = [];
  }
  PLANET_TO_RULED_SIGNS[ruler].push(sign);
}

// ─── Whole-Sign House Calculations ─────────────────────────────────

export function getWholeSignHouse(planetLong: number, ascLong: number): number {
  const planetSign = Math.floor(planetLong / 30) % 12;
  const ascSign = Math.floor(ascLong / 30) % 12;
  return ((planetSign - ascSign + 12) % 12) + 1;
}

export function getSignOnHouseCusp(houseNum: number, ascLong: number): string {
  const ascSign = Math.floor(ascLong / 30) % 12;
  const signIdx = (ascSign + houseNum - 1) % 12;
  return SIGN_NAMES[signIdx];
}

export function isHouseRetrograde(
  houseNum: number,
  ascLong: number,
  planets: Record<string, { longitude: number; sign: string; retrograde: boolean }>
): boolean {
  const cuspSign = getSignOnHouseCusp(houseNum, ascLong);
  const ruler = TRADITIONAL_RULERS[cuspSign]?.ruler;
  if (!ruler) return false;
  return planets[ruler]?.retrograde ?? false;
}

export function checkFusionCusp(
  longitude: number,
  house: number,
  ascLong: number,
  fusionOrb: number
): { from_house: number; to_house: number } | undefined {
  const degreeInSign = longitude % 30;
  if (degreeInSign >= 30 - fusionOrb) {
    const nextHouse = house === 12 ? 1 : house + 1;
    return { from_house: house, to_house: nextHouse };
  }
  if (degreeInSign <= fusionOrb) {
    const prevHouse = house === 1 ? 12 : house - 1;
    return { from_house: prevHouse, to_house: house };
  }
  return undefined;
}

// ─── Planet Analysis ───────────────────────────────────────────────

export function analyzePlanet(
  key: string,
  chart: NatalChart,
  ascLong: number,
  params: ChartReadingParams,
  allPlanetsEnriched: Record<string, { longitude: number; sign: string; house: number; retrograde: boolean }>
): PlanetAnalysis {
  const planet = chart.planets[key];
  if (!planet) {
    throw new Error(`Planet "${key}" not found in chart`);
  }

  const house = getWholeSignHouse(planet.longitude, ascLong);
  const sign = SIGN_NAMES[Math.floor(planet.longitude / 30) % 12];
  const naturalSign = HOUSE_TO_SIGN[house];
  const retrograde = planet.retrograde ?? false;
  const retrogadeHouse = isHouseRetrograde(house, ascLong, allPlanetsEnriched);
  const fusionCusp = checkFusionCusp(planet.longitude, house, ascLong, params.fusion_cusp_orb);

  let signDegree: PlanetAnalysis['signDegree'];
  let decan: PlanetAnalysis['decan'];

  if (params.include_sign_degree) {
    const s = calculateDegreeSign(planet.longitude);
    signDegree = { sign: s.degreeSign, symbol: s.degreeSymbol };
  }

  if (params.include_decan) {
    const d = calculateDecan(planet.longitude);
    decan = { number: d.decan, sign: d.decanSign };
  }

  const aspects = classifyAspectsForPlanet(
    key,
    planet.longitude,
    sign,
    allPlanetsEnriched,
    params.include_outer_planets
  );

  return {
    planet: key,
    longitude: planet.longitude,
    sign,
    house,
    house_natural_sign: naturalSign,
    house_themes: HOUSE_TOPICS[house] || '',
    retrograde,
    signDegree,
    decan,
    retrograde_house: retrogadeHouse,
    fusion_cusp: fusionCusp,
    aspects,
  };
}

// ─── Build enriched planet map (whole-sign houses) ─────────────────

function buildEnrichedPlanets(
  chart: NatalChart,
  ascLong: number
): Record<string, { longitude: number; sign: string; house: number; retrograde: boolean }> {
  const result: Record<string, { longitude: number; sign: string; house: number; retrograde: boolean }> = {};
  for (const [key, planet] of Object.entries(chart.planets)) {
    result[key] = {
      longitude: planet.longitude,
      sign: SIGN_NAMES[Math.floor(planet.longitude / 30) % 12],
      house: getWholeSignHouse(planet.longitude, ascLong),
      retrograde: planet.retrograde ?? false,
    };
  }
  return result;
}

// ─── Backward Trace ────────────────────────────────────────────────

export function buildBackwardTrace(
  vantageKey: string,
  chart: NatalChart,
  ascLong: number,
  params: ChartReadingParams,
  allPlanetsEnriched: Record<string, { longitude: number; sign: string; house: number; retrograde: boolean }>
): BackwardTrace {
  const ruledSigns = PLANET_TO_RULED_SIGNS[vantageKey] || [];
  const sourceHouses: SourceHouse[] = [];

  for (const sign of ruledSigns) {
    const signIdx = SIGN_NAMES.indexOf(sign);
    const ascSign = Math.floor(ascLong / 30) % 12;
    const houseNum = ((signIdx - ascSign + 12) % 12) + 1;
    const naturalSign = HOUSE_TO_SIGN[houseNum];
    const rxHouse = isHouseRetrograde(houseNum, ascLong, allPlanetsEnriched);

    const planetsInHouse: PlanetAnalysis[] = [];
    for (const [key, info] of Object.entries(allPlanetsEnriched)) {
      if (key === vantageKey) continue;
      if (key === 'ascendant' || key === 'midheaven') continue;
      if (info.house === houseNum) {
        planetsInHouse.push(analyzePlanet(key, chart, ascLong, params, allPlanetsEnriched));
      }
    }

    sourceHouses.push({
      house: houseNum,
      sign_on_cusp: sign,
      natural_sign: naturalSign,
      natural_themes: HOUSE_TOPICS[houseNum] || '',
      retrograde_house: rxHouse,
      planets_in_house: planetsInHouse,
    });
  }

  return { ruled_signs: ruledSigns, source_houses: sourceHouses };
}

// ─── Forward Trace ─────────────────────────────────────────────────

export function buildForwardTrace(
  houseNum: number,
  chart: NatalChart,
  ascLong: number,
  params: ChartReadingParams,
  allPlanetsEnriched: Record<string, { longitude: number; sign: string; house: number; retrograde: boolean }>,
  depth: number = 1,
  visitedPlanets: Set<string> = new Set(),
  _currentDepth: number = 0
): ForwardTrace {
  const cuspSign = getSignOnHouseCusp(houseNum, ascLong);
  const rulerInfo = TRADITIONAL_RULERS[cuspSign];
  const rulerKey = rulerInfo?.ruler || '';

  const trace: ForwardTrace = {
    house_sign: cuspSign,
    house_ruler: rulerKey,
  };

  if (!rulerKey || visitedPlanets.has(rulerKey) || _currentDepth >= depth) {
    return trace;
  }
  if (!chart.planets[rulerKey]) {
    return trace;
  }

  visitedPlanets.add(rulerKey);
  trace.ruler_position = analyzePlanet(rulerKey, chart, ascLong, params, allPlanetsEnriched);

  const rulerHouse = getWholeSignHouse(chart.planets[rulerKey].longitude, ascLong);
  if (_currentDepth + 1 < depth) {
    trace.next = buildForwardTrace(
      rulerHouse, chart, ascLong, params, allPlanetsEnriched,
      depth, visitedPlanets, _currentDepth + 1
    );
  }

  return trace;
}

// ─── Vantage Planet Selection ──────────────────────────────────────

export function selectVantagePlanets(
  category: QuestionCategory,
  chart: NatalChart,
  ascLong: number,
  allPlanetsEnriched: Record<string, { longitude: number; sign: string; house: number; retrograde: boolean }>
): string[] {
  const vantagePlanets = new Set<string>();
  for (const houseNum of category.primaryHouses) {
    const cuspSign = getSignOnHouseCusp(houseNum, ascLong);
    const ruler = TRADITIONAL_RULERS[cuspSign]?.ruler;
    if (ruler && chart.planets[ruler]) {
      vantagePlanets.add(ruler);
    }
    for (const [key, info] of Object.entries(allPlanetsEnriched)) {
      if (key === 'ascendant' || key === 'midheaven') continue;
      if (info.house === houseNum) {
        vantagePlanets.add(key);
      }
    }
  }
  return Array.from(vantagePlanets);
}

export function selectAllVantagePlanets(
  chart: NatalChart,
  includeOuter: boolean
): string[] {
  const CORE_PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
  const OUTER_PLANETS = ['uranus', 'neptune', 'pluto'];
  const POINTS = ['northnode', 'chiron'];
  const keys = [...CORE_PLANETS];
  if (includeOuter) keys.push(...OUTER_PLANETS);
  keys.push(...POINTS);
  return keys.filter(k => chart.planets[k]);
}

// ─── Main Entry Points ─────────────────────────────────────────────

export function buildChartReadingTreeWithAsc(
  chart: NatalChart,
  question: string,
  category: QuestionCategory,
  params: ChartReadingParams,
  ascLong: number
): ChartReadingTree {
  const risingSign = SIGN_NAMES[Math.floor(ascLong / 30) % 12];
  const allPlanetsEnriched = buildEnrichedPlanets(chart, ascLong);
  const vantagePlanetKeys = selectVantagePlanets(category, chart, ascLong, allPlanetsEnriched);

  const vantages: VantageTree[] = vantagePlanetKeys.map(key => {
    const planetAnalysis = analyzePlanet(key, chart, ascLong, params, allPlanetsEnriched);
    const coTenants: PlanetAnalysis[] = [];
    for (const [otherKey, info] of Object.entries(allPlanetsEnriched)) {
      if (otherKey === key || otherKey === 'ascendant' || otherKey === 'midheaven') continue;
      if (info.house === planetAnalysis.house) {
        coTenants.push(analyzePlanet(otherKey, chart, ascLong, params, allPlanetsEnriched));
      }
    }
    const backwardTrace = buildBackwardTrace(key, chart, ascLong, params, allPlanetsEnriched, params.depth_backward);
    const forwardTrace = buildForwardTrace(
      planetAnalysis.house, chart, ascLong, params, allPlanetsEnriched,
      params.depth_forward, new Set([key])
    );
    return { planet: planetAnalysis, co_tenants: coTenants, backward_trace: backwardTrace, forward_trace: forwardTrace };
  });

  return { question, category: category.key, rising_sign: risingSign, rising_longitude: ascLong, vantages, parameters: params };
}

export function buildChartReadingTree(
  chart: NatalChart,
  question: string,
  category: QuestionCategory,
  params: ChartReadingParams = DEFAULT_PARAMS
): ChartReadingTree {
  const ascLong = chart.planets.ascendant?.longitude
    ?? chart.angles?.ascendant
    ?? 0;
  return buildChartReadingTreeWithAsc(chart, question, category, params, ascLong);
}

// ─── Derived Houses ──────────────────────────────────────────────

export function computeDerivedAscendant(ascLong: number, fromHouse: number): number {
  const ascSignIdx = Math.floor(ascLong / 30) % 12;
  const derivedSignIdx = (ascSignIdx + fromHouse - 1) % 12;
  return derivedSignIdx * 30;
}

export function buildDerivedTree(
  chart: NatalChart,
  question: string,
  category: QuestionCategory,
  params: ChartReadingParams,
  derivedFromHouse: number,
  derivedLabel: string
): ChartReadingTree {
  const origAscLong = chart.planets.ascendant?.longitude
    ?? chart.angles?.ascendant
    ?? 0;
  const derivedAscLong = computeDerivedAscendant(origAscLong, derivedFromHouse);
  const tree = buildChartReadingTreeWithAsc(chart, question, category, params, derivedAscLong);
  tree.derived = {
    derived_from_house: derivedFromHouse,
    label: derivedLabel,
    original_asc_longitude: origAscLong,
    derived_asc_longitude: derivedAscLong,
  };
  return tree;
}

// ─── Compact Chart Summary ─────────────────────────────────────

export function buildCompactChartSummary(
  chart: NatalChart,
  params: ChartReadingParams = DEFAULT_PARAMS
): CompactChartSummary {
  const ascLong = chart.planets.ascendant?.longitude
    ?? chart.angles?.ascendant
    ?? 0;
  const risingSign = SIGN_NAMES[Math.floor(ascLong / 30) % 12];
  const allPlanetsEnriched = buildEnrichedPlanets(chart, ascLong);

  const planets: CompactPlanetSummary[] = [];
  for (const [key, info] of Object.entries(allPlanetsEnriched)) {
    if (key === 'ascendant' || key === 'midheaven') continue;
    const aspects = classifyAspectsForPlanet(
      key, info.longitude, info.sign, allPlanetsEnriched, params.include_outer_planets
    );
    planets.push({
      planet: key,
      sign: info.sign,
      house: info.house,
      retrograde: info.retrograde,
      aspect_count: aspects.length,
    });
  }

  return { rising_sign: risingSign, planets };
}

// ─── Build Trees from Explicit Planet Keys ──────────────────────

export function buildTreesFromPlanetKeys(
  chart: NatalChart,
  question: string,
  planetKeys: string[],
  params: ChartReadingParams = DEFAULT_PARAMS
): ChartReadingTree[] {
  const ascLong = chart.planets.ascendant?.longitude
    ?? chart.angles?.ascendant
    ?? 0;
  const risingSign = SIGN_NAMES[Math.floor(ascLong / 30) % 12];
  const allPlanetsEnriched = buildEnrichedPlanets(chart, ascLong);

  const validKeys = planetKeys.filter(k =>
    k !== 'ascendant' && k !== 'midheaven' && chart.planets[k]
  );
  if (validKeys.length === 0) return [];

  const vantages: VantageTree[] = validKeys.map(key => {
    const planetAnalysis = analyzePlanet(key, chart, ascLong, params, allPlanetsEnriched);
    const coTenants: PlanetAnalysis[] = [];
    for (const [otherKey, info] of Object.entries(allPlanetsEnriched)) {
      if (otherKey === key || otherKey === 'ascendant' || otherKey === 'midheaven') continue;
      if (info.house === planetAnalysis.house) {
        coTenants.push(analyzePlanet(otherKey, chart, ascLong, params, allPlanetsEnriched));
      }
    }
    const backwardTrace = buildBackwardTrace(key, chart, ascLong, params, allPlanetsEnriched, params.depth_backward);
    const forwardTrace = buildForwardTrace(planetAnalysis.house, chart, ascLong, params, allPlanetsEnriched, params.depth_forward, new Set([key]));
    return { planet: planetAnalysis, co_tenants: coTenants, backward_trace: backwardTrace, forward_trace: forwardTrace };
  });

  return [{
    question,
    category: 'contextual',
    rising_sign: risingSign,
    rising_longitude: ascLong,
    vantages,
    parameters: params,
  }];
}

// ─── Comprehensive Natal Tree Builder ──────────────────────────────

function buildComprehensiveNatalTree(
  chart: NatalChart,
  question: string,
  category: QuestionCategory,
  params: ChartReadingParams
): ChartReadingTree {
  const ascLong = chart.planets.ascendant?.longitude
    ?? chart.angles?.ascendant
    ?? 0;
  const risingSign = SIGN_NAMES[Math.floor(ascLong / 30) % 12];
  const allPlanetsEnriched = buildEnrichedPlanets(chart, ascLong);
  const vantagePlanetKeys = selectAllVantagePlanets(chart, params.include_outer_planets);

  const vantages: VantageTree[] = vantagePlanetKeys.map(key => {
    const planetAnalysis = analyzePlanet(key, chart, ascLong, params, allPlanetsEnriched);
    const coTenants: PlanetAnalysis[] = [];
    for (const [otherKey, info] of Object.entries(allPlanetsEnriched)) {
      if (otherKey === key || otherKey === 'ascendant' || otherKey === 'midheaven') continue;
      if (info.house === planetAnalysis.house) {
        coTenants.push(analyzePlanet(otherKey, chart, ascLong, params, allPlanetsEnriched));
      }
    }
    const backwardTrace = buildBackwardTrace(key, chart, ascLong, params, allPlanetsEnriched, params.depth_backward);
    const forwardTrace = buildForwardTrace(planetAnalysis.house, chart, ascLong, params, allPlanetsEnriched, params.depth_forward, new Set([key]));
    return { planet: planetAnalysis, co_tenants: coTenants, backward_trace: backwardTrace, forward_trace: forwardTrace };
  });

  return { question, category: category.key, rising_sign: risingSign, rising_longitude: ascLong, vantages, parameters: params };
}

// ─── Question-Driven Multi-Tree Builder ─────────────────────────────

const MAX_VANTAGES = 15;

export function buildTreesForQuestion(
  chart: NatalChart,
  question: string,
  params: ChartReadingParams = DEFAULT_PARAMS
): ChartReadingTree[] {
  const categories = detectCategories(question);
  const seenPlanets = new Set<string>();
  const trees: ChartReadingTree[] = [];
  let totalVantages = 0;

  for (const category of categories) {
    const natalTree = buildComprehensiveNatalTree(chart, question, category, params);
    natalTree.vantages = natalTree.vantages.filter(v => {
      if (seenPlanets.has(v.planet.planet) || totalVantages >= MAX_VANTAGES) return false;
      seenPlanets.add(v.planet.planet);
      totalVantages++;
      return true;
    });
    if (natalTree.vantages.length > 0) {
      trees.push(natalTree);
    }

    // Derived perspectives for the category
    const perspectives = DERIVED_HOUSE_PERSPECTIVES[category.key];
    if (perspectives && totalVantages < MAX_VANTAGES) {
      for (const { house, label } of perspectives) {
        if (house === 1) continue;
        const derivedTree = buildDerivedTree(chart, question, category, params, house, label);
        derivedTree.vantages = derivedTree.vantages.filter(v => {
          const derivedKey = `derived_${house}_${v.planet.planet}`;
          if (seenPlanets.has(derivedKey) || totalVantages >= MAX_VANTAGES) return false;
          seenPlanets.add(derivedKey);
          totalVantages++;
          return true;
        });
        if (derivedTree.vantages.length > 0) {
          trees.push(derivedTree);
        }
      }
    }
  }

  return trees;
}

// ─── Transit Integration ────────────────────────────────────────────

/** Average daily motion in degrees per day for each planet */
const AVG_DAILY_MOTION: Record<string, number> = {
  sun: 0.986, moon: 13.176, mercury: 1.383, venus: 1.2, mars: 0.524,
  jupiter: 0.083, saturn: 0.034, uranus: 0.012, neptune: 0.006, pluto: 0.004,
  northnode: 0.053, chiron: 0.02,
};

/** Standard aspect angles for computing exact target longitude */
const ASPECT_ANGLES: Record<string, number> = {
  Conjunction: 0, Opposition: 180, Trine: 120, Square: 90, Sextile: 60,
  Quincunx: 150, 'Semi-Sextile': 30, 'Semi-Square': 45, Sesquisquare: 135,
};

/**
 * Determine if a transit aspect is applying (getting tighter) or separating.
 */
function isTransitApplying(
  transitLong: number,
  natalLong: number,
  aspectAngle: number,
  dailyMotion: number,
  transitRetrograde: boolean
): { applying: boolean; daysToExact: number | null } {
  const target1 = (natalLong + aspectAngle) % 360;
  const target2 = (natalLong - aspectAngle + 360) % 360;

  const diff1 = ((target1 - transitLong + 540) % 360) - 180;
  const diff2 = ((target2 - transitLong + 540) % 360) - 180;
  const closerDiff = Math.abs(diff1) < Math.abs(diff2) ? diff1 : diff2;

  const effectiveDirection = transitRetrograde ? -1 : 1;

  const applying = (closerDiff > 0 && effectiveDirection > 0) ||
                   (closerDiff < 0 && effectiveDirection < 0);

  const daysToExact = dailyMotion > 0
    ? Math.abs(closerDiff) / dailyMotion * (applying ? 1 : -1)
    : null;

  return { applying, daysToExact };
}

/** Transit API response shape */
export interface TransitApiResponse {
  transit_date: string;
  transit_time: string;
  transit_planets: Array<{
    planet: string;
    longitude: number;
    sign: string;
    retrograde: boolean;
  }>;
  aspects_to_natal: Array<{
    planet1: string;
    planet2: string;
    aspect: string;
    angle: number;
    orb: number;
    transitPlanet: string;
    natalPlanet: string;
  }>;
}

/**
 * Build TransitContext from API response + natal chart.
 * Optionally filter to aspects hitting one specific natal planet.
 */
export function buildTransitContext(
  transitData: TransitApiResponse,
  chart: NatalChart,
  filterNatalPlanet?: string
): TransitContext {
  const transitPlanetMap: Record<string, { longitude: number; sign: string; retrograde: boolean }> = {};
  for (const tp of transitData.transit_planets) {
    transitPlanetMap[tp.planet.toLowerCase()] = {
      longitude: tp.longitude,
      sign: tp.sign,
      retrograde: tp.retrograde,
    };
  }

  const aspects: TransitAspectContext[] = [];

  for (const asp of transitData.aspects_to_natal) {
    const transitKey = asp.transitPlanet.toLowerCase();
    const natalKey = asp.natalPlanet.toLowerCase();

    if (filterNatalPlanet && natalKey !== filterNatalPlanet.toLowerCase()) continue;

    const transitInfo = transitPlanetMap[transitKey];
    const natalPlanet = chart.planets[natalKey];
    if (!transitInfo || !natalPlanet) continue;

    const dailyMotion = AVG_DAILY_MOTION[transitKey] || 0.01;
    const aspectAngle = ASPECT_ANGLES[asp.aspect] ?? asp.angle;

    const { applying, daysToExact } = isTransitApplying(
      transitInfo.longitude,
      natalPlanet.longitude,
      aspectAngle,
      dailyMotion,
      transitInfo.retrograde
    );

    aspects.push({
      transit_planet: transitKey,
      transit_longitude: transitInfo.longitude,
      transit_sign: transitInfo.sign,
      transit_retrograde: transitInfo.retrograde,
      natal_planet: natalKey,
      natal_longitude: natalPlanet.longitude,
      aspect_type: asp.aspect.toLowerCase().replace(/[- ]/g, '_'),
      aspect_name: asp.aspect,
      orb: asp.orb,
      applying,
      days_to_exact: daysToExact !== null ? Math.round(daysToExact * 10) / 10 : null,
      daily_motion: dailyMotion,
    });
  }

  return {
    transit_date: transitData.transit_date,
    transit_time: transitData.transit_time,
    active_transits: aspects,
    vantage_transits: filterNatalPlanet ? aspects : [],
  };
}

/**
 * Enrich built trees with transit data.
 */
export function enrichTreesWithTransits(
  trees: ChartReadingTree[],
  transitData: TransitApiResponse,
  chart: NatalChart
): ChartReadingTree[] {
  const fullContext = buildTransitContext(transitData, chart);

  return trees.map(tree => ({
    ...tree,
    transit_context: fullContext,
    vantages: tree.vantages.map(v => ({
      ...v,
      transit_context: buildTransitContext(transitData, chart, v.planet.planet),
    })),
  }));
}

// ─── Profection Integration ──────────────────────────────────────

/**
 * Enrich built trees with profection timing data.
 */
export function enrichTreesWithProfections(
  trees: ChartReadingTree[],
  chart: NatalChart,
  birthDate: string
): ChartReadingTree[] {
  const profectionData = calculateProfections(birthDate, chart);
  const currentYear = profectionData.currentYear;
  const currentMonth = currentYear.months.find(m => m.isCurrent) || currentYear.months[0];

  const profContext: ProfectionContext = {
    current_age: profectionData.currentAge,
    yearly: {
      house: currentYear.house,
      sign: currentYear.sign,
      sign_symbol: currentYear.signSymbol,
      time_lord: currentYear.timeLord.ruler,
      time_lord_name: currentYear.timeLord.rulerName,
      time_lord_symbol: currentYear.timeLord.rulerSymbol,
      topics: currentYear.topics,
    },
    monthly: {
      house: currentMonth.house,
      sign: currentMonth.sign,
      sign_symbol: currentMonth.signSymbol,
      time_lord: currentMonth.timeLord.ruler,
      time_lord_name: currentMonth.timeLord.rulerName,
      time_lord_symbol: currentMonth.timeLord.rulerSymbol,
    },
    is_year_lord: false,
    is_month_lord: false,
  };

  return trees.map(tree => ({
    ...tree,
    profection_context: profContext,
    vantages: tree.vantages.map(v => ({
      ...v,
      profection_context: {
        ...profContext,
        is_year_lord: v.planet.planet === profContext.yearly.time_lord,
        is_month_lord: v.planet.planet === profContext.monthly.time_lord,
      },
    })),
  }));
}

// ─── Age-Degree Activation Integration ───────────────────────────

const CYCLE_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer'];

/**
 * Compute age-degree activations for all planets in the chart.
 */
export function computeAgeDegreeActivations(
  chart: NatalChart,
  birthDate: string
): AgeDegreeActivation[] {
  const birth = new Date(birthDate);
  const now = new Date();
  const ageMs = now.getTime() - birth.getTime();
  const currentAge = ageMs / (365.25 * 24 * 60 * 60 * 1000);

  const activations: AgeDegreeActivation[] = [];

  const planetKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
    'uranus', 'neptune', 'pluto', 'northnode', 'chiron', 'ascendant', 'midheaven'];

  for (const key of planetKeys) {
    const planet = chart.planets[key];
    if (!planet) continue;

    const planetInfo = PLANETS[key as keyof typeof PLANETS];
    const degreeInSign = planet.longitude % 30;
    const natalSign = SIGN_NAMES[Math.floor(planet.longitude / 30) % 12];

    for (let cycle = 0; cycle < 4; cycle++) {
      const activationAge = cycle * 30 + degreeInSign;
      const diff = currentAge - activationAge;
      const isCurrent = Math.abs(diff) <= 0.5;
      const isRecent = diff > 0.5 && diff <= 2;

      if (isCurrent || isRecent) {
        activations.push({
          planet: key,
          planet_name: planetInfo?.name || key,
          planet_symbol: planetInfo?.symbol || key.slice(0, 2),
          degree_in_sign: Math.round(degreeInSign * 100) / 100,
          natal_sign: natalSign,
          cycle: cycle + 1,
          cycle_sign: CYCLE_SIGNS[cycle],
          activation_age: Math.round(activationAge * 100) / 100,
          is_current: isCurrent,
          is_recent: isRecent,
          years_ago: Math.round(diff * 10) / 10,
        });
      }
    }
  }

  return activations;
}

/**
 * Enrich built trees with age-degree activation data.
 */
export function enrichTreesWithActivations(
  trees: ChartReadingTree[],
  chart: NatalChart,
  birthDate: string
): ChartReadingTree[] {
  const allActivations = computeAgeDegreeActivations(chart, birthDate);

  return trees.map(tree => ({
    ...tree,
    all_activations: allActivations,
    vantages: tree.vantages.map(v => ({
      ...v,
      activations: allActivations.filter(a => a.planet === v.planet.planet),
    })),
  }));
}
