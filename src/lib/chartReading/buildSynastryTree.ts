/**
 * Synastry Tree Builder — Cross-chart vantage trees + Composite chart
 *
 * Builds three groups:
 * 1. A in B's Chart — A's planets placed in B's house system
 * 2. B in A's Chart — B's planets placed in A's house system
 * 3. Composite Chart — midpoint chart analyzed as a natal chart
 */

import { ZODIAC_SIGNS, PLANETS } from '@/components/biwheel/utils/constants';
import { calculateDegreeSign, calculateDecan } from '@/components/biwheel/utils/chartMath';
import { classifySynastryAspectsForPlanet } from './synastryAspectClassification';
import { classifyAspectsForPlanet } from './aspectClassification';
import {
  getWholeSignHouse,
  getSignOnHouseCusp,
  isHouseRetrograde,
  checkFusionCusp,
  buildBackwardTrace,
  buildForwardTrace,
  buildChartReadingTreeWithAsc,
} from './buildVantageTree';
import type {
  NatalChart,
  ChartReadingParams,
  ChartReadingTree,
  PlanetAnalysis,
  VantageTree,
  TreeGroup,
  SynastryTreeAspect,
} from './types';
import { TRADITIONAL_RULERS, HOUSE_TOPICS, HOUSE_TO_SIGN } from './types';

const SIGN_NAMES = ZODIAC_SIGNS.map(s => s.name);

// Core planets used for synastry vantages (7 per group = 21 total)
const SYNASTRY_PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

// ─── Helper: Build enriched planet map ──────────────────────────────

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

// ─── Helper: Analyze planet in a specific house system ──────────────

function analyzePlanetInHouseSystem(
  key: string,
  planetData: { longitude: number; retrograde?: boolean },
  ascLong: number,
  params: ChartReadingParams,
  allPlanetsInHouseSystem: Record<string, { longitude: number; sign: string; house: number; retrograde: boolean }>
): PlanetAnalysis {
  const house = getWholeSignHouse(planetData.longitude, ascLong);
  const sign = SIGN_NAMES[Math.floor(planetData.longitude / 30) % 12];
  const naturalSign = HOUSE_TO_SIGN[house];
  const retrograde = planetData.retrograde ?? false;
  const retrogadeHouse = isHouseRetrograde(house, ascLong, allPlanetsInHouseSystem);
  const fusionCusp = checkFusionCusp(planetData.longitude, house, ascLong, params.fusion_cusp_orb);

  let signDegree: PlanetAnalysis['signDegree'];
  let decan: PlanetAnalysis['decan'];
  if (params.include_sign_degree) {
    const s = calculateDegreeSign(planetData.longitude);
    signDegree = { sign: s.degreeSign, symbol: s.degreeSymbol };
  }
  if (params.include_decan) {
    const d = calculateDecan(planetData.longitude);
    decan = { number: d.decan, sign: d.decanSign };
  }

  return {
    planet: key,
    longitude: planetData.longitude,
    sign,
    house,
    house_natural_sign: naturalSign,
    house_themes: HOUSE_TOPICS[house] || '',
    retrograde,
    signDegree,
    decan,
    retrograde_house: retrogadeHouse,
    fusion_cusp: fusionCusp,
    aspects: [], // Will be populated separately for synastry
  };
}

// ─── Synastry Vantage Tree Builder ──────────────────────────────────

/**
 * Build vantage trees where source chart's planets are placed in host chart's house system.
 * Cross-chart aspects are computed against host's planets.
 */
function buildSynastryVantageTree(
  sourceChart: NatalChart,
  hostChart: NatalChart,
  sourceLabel: 'A' | 'B',
  hostLabel: 'A' | 'B',
  question: string,
  params: ChartReadingParams
): ChartReadingTree {
  const hostAscLong = hostChart.planets.ascendant?.longitude
    ?? hostChart.angles?.ascendant
    ?? 0;
  const sourceAscLong = sourceChart.planets.ascendant?.longitude
    ?? sourceChart.angles?.ascendant
    ?? 0;

  const hostRisingSign = SIGN_NAMES[Math.floor(hostAscLong / 30) % 12];
  const hostEnrichedPlanets = buildEnrichedPlanets(hostChart, hostAscLong);
  const sourceEnrichedPlanets = buildEnrichedPlanets(sourceChart, sourceAscLong);

  // Build vantage trees for each source planet placed in host's house system
  const vantages: VantageTree[] = SYNASTRY_PLANETS
    .filter(key => sourceChart.planets[key])
    .map(key => {
      const sourcePlanet = sourceChart.planets[key];

      // Analyze source planet in HOST's house system
      const planetAnalysis = analyzePlanetInHouseSystem(
        key, sourcePlanet, hostAscLong, params, hostEnrichedPlanets
      );

      // Cross-chart aspects: source planet vs host's planets
      planetAnalysis.aspects = classifySynastryAspectsForPlanet(
        key,
        sourcePlanet.longitude,
        planetAnalysis.sign,
        sourceLabel,
        hostEnrichedPlanets,
        hostLabel,
        params.include_outer_planets
      );

      // Co-tenants: host's planets in the same house (using host's house system)
      const coTenants: PlanetAnalysis[] = [];
      for (const [otherKey, info] of Object.entries(hostEnrichedPlanets)) {
        if (otherKey === 'ascendant' || otherKey === 'midheaven') continue;
        if (info.house === planetAnalysis.house) {
          coTenants.push(analyzePlanetInHouseSystem(
            otherKey, hostChart.planets[otherKey], hostAscLong, params, hostEnrichedPlanets
          ));
        }
      }

      // Forward trace: through HOST's house system
      const forwardTrace = buildForwardTrace(
        planetAnalysis.house, hostChart, hostAscLong, params, hostEnrichedPlanets,
        params.depth_forward, new Set([key])
      );

      // Backward trace: through SOURCE's own chart
      const backwardTrace = buildBackwardTrace(
        key, sourceChart, sourceAscLong, params, sourceEnrichedPlanets, params.depth_backward
      );

      return {
        planet: planetAnalysis,
        co_tenants: coTenants,
        backward_trace: backwardTrace,
        forward_trace: forwardTrace,
      };
    });

  return {
    question,
    category: 'synastry',
    rising_sign: hostRisingSign,
    rising_longitude: hostAscLong,
    vantages,
    parameters: params,
    synastry_context: {
      source_person: sourceLabel,
      host_person: hostLabel,
      mode: sourceLabel === 'A' ? 'a_in_b' : 'b_in_a',
    },
  };
}

// ─── Composite Chart Builder ────────────────────────────────────────

/** Calculate shorter-arc midpoint between two longitudes */
function shorterArcMidpoint(long1: number, long2: number): number {
  const diff = Math.abs(long1 - long2);
  if (diff > 180) {
    return ((Math.max(long1, long2) + (360 - diff) / 2) % 360);
  }
  return ((long1 + long2) / 2) % 360;
}

/**
 * Build a composite NatalChart from midpoints of two charts.
 */
export function buildCompositeNatalChart(chartA: NatalChart, chartB: NatalChart): NatalChart {
  const planets: Record<string, { longitude: number; retrograde: boolean; sign?: string }> = {};

  const allKeys = new Set([...Object.keys(chartA.planets), ...Object.keys(chartB.planets)]);
  for (const key of allKeys) {
    const pA = chartA.planets[key];
    const pB = chartB.planets[key];
    if (pA && pB) {
      const midLong = shorterArcMidpoint(pA.longitude, pB.longitude);
      planets[key] = {
        longitude: midLong,
        retrograde: false,
        sign: SIGN_NAMES[Math.floor(midLong / 30) % 12],
      };
    } else if (pA) {
      planets[key] = { ...pA };
    } else if (pB) {
      planets[key] = { ...pB };
    }
  }

  const ascA = chartA.planets.ascendant?.longitude ?? chartA.angles?.ascendant ?? 0;
  const ascB = chartB.planets.ascendant?.longitude ?? chartB.angles?.ascendant ?? 0;
  const compositeAsc = shorterArcMidpoint(ascA, ascB);

  const mcA = chartA.planets.midheaven?.longitude ?? chartA.angles?.midheaven ?? 0;
  const mcB = chartB.planets.midheaven?.longitude ?? chartB.angles?.midheaven ?? 0;
  const compositeMc = shorterArcMidpoint(mcA, mcB);

  planets.ascendant = { longitude: compositeAsc, retrograde: false };
  planets.midheaven = { longitude: compositeMc, retrograde: false };

  return {
    planets: planets as NatalChart['planets'],
    angles: { ascendant: compositeAsc, midheaven: compositeMc },
  };
}

/**
 * Build a composite tree — uses the standard natal tree builder on the composite chart.
 */
function buildCompositeTree(
  chartA: NatalChart,
  chartB: NatalChart,
  question: string,
  params: ChartReadingParams
): ChartReadingTree {
  const compositeChart = buildCompositeNatalChart(chartA, chartB);
  const compositeAscLong = compositeChart.planets.ascendant?.longitude
    ?? compositeChart.angles?.ascendant
    ?? 0;

  const category = { key: 'composite', label: 'Composite', primaryHouses: [1, 7, 5, 10], description: 'Relationship entity' };

  const tree = buildChartReadingTreeWithAsc(compositeChart, question, category, params, compositeAscLong);

  // Limit to core planets only
  tree.vantages = tree.vantages.filter(v => SYNASTRY_PLANETS.includes(v.planet.planet));

  tree.synastry_context = {
    source_person: 'A',
    host_person: 'B',
    mode: 'composite',
  };

  return tree;
}

// ─── Cross-chart Aspect Summary ─────────────────────────────────────

function computeSynastrySummary(
  chartA: NatalChart,
  chartB: NatalChart,
  params: ChartReadingParams
): TreeGroup['synastry_summary'] {
  const ascA = chartA.planets.ascendant?.longitude ?? chartA.angles?.ascendant ?? 0;
  const ascB = chartB.planets.ascendant?.longitude ?? chartB.angles?.ascendant ?? 0;
  const enrichedB = buildEnrichedPlanets(chartB, ascB);

  const allAspects: SynastryTreeAspect[] = [];

  for (const key of SYNASTRY_PLANETS) {
    const pA = chartA.planets[key];
    if (!pA) continue;

    const signA = SIGN_NAMES[Math.floor(pA.longitude / 30) % 12];
    const treeAspects = classifySynastryAspectsForPlanet(
      key, pA.longitude, signA, 'A', enrichedB, 'B', params.include_outer_planets
    );

    for (const asp of treeAspects) {
      allAspects.push({
        source_person: 'A',
        source_planet: key,
        source_longitude: pA.longitude,
        target_person: 'B',
        target_planet: asp.target,
        target_longitude: asp.target_longitude,
        target_sign: asp.target_sign,
        target_house: asp.target_house,
        target_retrograde: asp.target_retrograde,
        type: asp.type,
        name: asp.name,
        symbol: asp.symbol,
        angle: asp.angle,
        orb: asp.orb,
        strength: 1 - (asp.orb / 8),
        nature: asp.nature,
        energy_flow: asp.energy_flow,
      });
    }
  }

  allAspects.sort((a, b) => a.orb - b.orb);

  const harmonious = allAspects.filter(a => a.nature === 'harmonious').length;
  const challenging = allAspects.filter(a => a.nature === 'challenging').length;
  const neutral = allAspects.filter(a => a.nature === 'neutral').length;

  return {
    total_aspects: allAspects.length,
    harmonious,
    challenging,
    neutral,
    top_aspects: allAspects.slice(0, 5),
  };
}

// ─── Main Orchestrator ──────────────────────────────────────────────

/**
 * Build all synastry tree groups:
 * - A in B's Chart
 * - B in A's Chart
 * - Composite Chart
 */
export function buildSynastryTreeGroups(
  chartA: NatalChart,
  chartB: NatalChart,
  nameA: string,
  nameB: string,
  question: string,
  params: ChartReadingParams
): TreeGroup[] {
  const aInBTree = buildSynastryVantageTree(chartA, chartB, 'A', 'B', question, params);
  const bInATree = buildSynastryVantageTree(chartB, chartA, 'B', 'A', question, params);
  const compositeTree = buildCompositeTree(chartA, chartB, question, params);
  const summary = computeSynastrySummary(chartA, chartB, params);

  return [
    {
      id: 'a_in_b',
      label: `${nameA} in ${nameB}'s Chart`,
      trees: [aInBTree],
      synastry_summary: summary,
    },
    {
      id: 'b_in_a',
      label: `${nameB} in ${nameA}'s Chart`,
      trees: [bInATree],
    },
    {
      id: 'composite',
      label: 'Composite Chart',
      trees: [compositeTree],
    },
  ];
}
