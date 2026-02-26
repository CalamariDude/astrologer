/**
 * Chart Reading Tree — Core Computation Engine
 *
 * Builds a vantage tree from natal chart data using whole-sign houses.
 * Pure math computation — no AI involved.
 * Ported from DruzeMatchWeb
 */

import { ZODIAC_SIGNS, PLANETS } from '@/components/biwheel/utils/constants';
import { calculateSpark, calculateDecan } from '@/components/biwheel/utils/chartMath';
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

  let spark: PlanetAnalysis['spark'];
  let decan: PlanetAnalysis['decan'];

  if (params.include_spark) {
    const s = calculateSpark(planet.longitude);
    spark = { sign: s.sparkSign, symbol: s.sparkSymbol };
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
    spark,
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

const MAX_VANTAGES = 7;

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
