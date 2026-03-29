/**
 * Aspect Pattern Detection
 * Detects classical aspect configurations from natal or synastry chart data:
 * Grand Trine, T-Square, Grand Cross, Yod, Stellium
 */

import { detectAspect } from '@/components/biwheel/utils/aspectCalculations';
import type { DetectedAspect } from '@/components/biwheel/utils/aspectCalculations';
import { PLANETS, PLANET_GROUPS, ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';
import type { NatalChart } from '@/components/biwheel/types';

export interface AspectPattern {
  type: 'grand_trine' | 't_square' | 'grand_cross' | 'yod' | 'stellium';
  name: string;
  planets: string[];           // planet keys involved
  element?: string;            // For grand trine: fire/earth/air/water
  apex?: string;               // For T-Square/Yod: the focal planet
  sign?: string;               // For stellium: the sign name
  avgStrength: number;         // Average strength of constituent aspects
  color: string;               // Card color
  description: string;
}

interface AspectMap {
  trines: Map<string, Set<string>>;
  oppositions: Map<string, Set<string>>;
  squares: Map<string, Set<string>>;
  sextiles: Map<string, Set<string>>;
  quincunxes: Map<string, Set<string>>;
  aspects: Map<string, DetectedAspect>; // "p1-p2-type" -> aspect
}

const GRID_PLANETS = [...PLANET_GROUPS.core, ...PLANET_GROUPS.outer, 'chiron'] as string[];

function getAspectKey(p1: string, p2: string, type: string): string {
  return [p1, p2].sort().join('-') + '-' + type;
}

/**
 * Build aspect lookup maps from chart data
 */
function buildAspectMap(
  chartA: NatalChart,
  chartB?: NatalChart,
  includeMinor?: boolean
): AspectMap {
  const map: AspectMap = {
    trines: new Map(),
    oppositions: new Map(),
    squares: new Map(),
    sextiles: new Map(),
    quincunxes: new Map(),
    aspects: new Map(),
  };

  const planetsA = chartA.planets;
  const planetsB = chartB?.planets || chartA.planets;
  const isSynastry = !!chartB;

  const availA = GRID_PLANETS.filter(p => planetsA[p]?.longitude !== undefined);
  const availB = GRID_PLANETS.filter(p => planetsB[p]?.longitude !== undefined);

  const majorOnly = new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare'] as const);
  const withMinor = includeMinor ? undefined : majorOnly;

  const addToMap = (target: Map<string, Set<string>>, p1: string, p2: string) => {
    if (!target.has(p1)) target.set(p1, new Set());
    if (!target.has(p2)) target.set(p2, new Set());
    target.get(p1)!.add(p2);
    target.get(p2)!.add(p1);
  };

  if (isSynastry) {
    // Full matrix for synastry
    for (const pA of availA) {
      for (const pB of availB) {
        const longA = planetsA[pA]?.longitude;
        const longB = planetsB[pB]?.longitude;
        if (longA === undefined || longB === undefined) continue;
        const aspect = detectAspect(longA, longB, withMinor as any, pA, pB);
        if (!aspect) continue;
        const key = getAspectKey(pA, pB, aspect.type);
        map.aspects.set(key, aspect);
        // Skip same-name planets for pattern graph (e.g. Venus-A vs Venus-B)
        // — they create self-loops that produce bogus geometric patterns
        if (pA === pB) continue;
        if (aspect.type === 'trine') addToMap(map.trines, pA, pB);
        else if (aspect.type === 'opposition') addToMap(map.oppositions, pA, pB);
        else if (aspect.type === 'square') addToMap(map.squares, pA, pB);
        else if (aspect.type === 'sextile') addToMap(map.sextiles, pA, pB);
        else if (aspect.type === 'quincunx') addToMap(map.quincunxes, pA, pB);
      }
    }
  } else {
    // Upper triangle for natal
    for (let i = 0; i < availA.length; i++) {
      for (let j = i + 1; j < availA.length; j++) {
        const pA = availA[i];
        const pB = availA[j];
        const longA = planetsA[pA]?.longitude;
        const longB = planetsA[pB]?.longitude;
        if (longA === undefined || longB === undefined) continue;
        // For patterns include quincunx too
        const allowedAspects = includeMinor ? undefined : undefined; // allow all for pattern detection
        const aspect = detectAspect(longA, longB, undefined, pA, pB);
        if (!aspect) continue;
        const key = getAspectKey(pA, pB, aspect.type);
        map.aspects.set(key, aspect);
        if (aspect.type === 'trine') addToMap(map.trines, pA, pB);
        else if (aspect.type === 'opposition') addToMap(map.oppositions, pA, pB);
        else if (aspect.type === 'square') addToMap(map.squares, pA, pB);
        else if (aspect.type === 'sextile') addToMap(map.sextiles, pA, pB);
        else if (aspect.type === 'quincunx') addToMap(map.quincunxes, pA, pB);
      }
    }
  }

  return map;
}

function getAvgStrength(map: AspectMap, planets: string[], aspectType: string): number {
  let total = 0;
  let count = 0;
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const key = getAspectKey(planets[i], planets[j], aspectType);
      const aspect = map.aspects.get(key);
      if (aspect) {
        total += aspect.strength;
        count++;
      }
    }
  }
  // For mixed-type patterns, search all types
  if (count === 0) {
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        for (const [k, asp] of map.aspects) {
          const sorted = [planets[i], planets[j]].sort();
          if (k.startsWith(sorted.join('-'))) {
            total += asp.strength;
            count++;
            break;
          }
        }
      }
    }
  }
  return count > 0 ? total / count : 0;
}

function getPlanetSign(planet: string, chartA: NatalChart, chartB?: NatalChart): string {
  const data = chartA.planets[planet] || chartB?.planets[planet];
  if (!data?.longitude) return '';
  const idx = Math.floor(((data.longitude % 360 + 360) % 360) / 30);
  return ZODIAC_SIGNS[idx]?.name || '';
}

function getPlanetElement(planet: string, chartA: NatalChart, chartB?: NatalChart): string {
  const data = chartA.planets[planet] || chartB?.planets[planet];
  if (!data?.longitude) return '';
  const idx = Math.floor(((data.longitude % 360 + 360) % 360) / 30);
  return ZODIAC_SIGNS[idx]?.element || '';
}

/**
 * Detect all aspect patterns in one or two charts
 */
export function detectAspectPatterns(
  chartA: NatalChart,
  chartB?: NatalChart,
  options?: { includeMinor?: boolean }
): AspectPattern[] {
  const patterns: AspectPattern[] = [];
  const map = buildAspectMap(chartA, chartB, options?.includeMinor);
  const seen = new Set<string>(); // Avoid duplicate patterns

  // 1. Grand Trine: 3 planets all trine each other
  for (const [p1, trinePartners1] of map.trines) {
    for (const p2 of trinePartners1) {
      const trinePartners2 = map.trines.get(p2);
      if (!trinePartners2) continue;
      for (const p3 of trinePartners2) {
        if (p3 === p1 || p3 === p2) continue;
        if (!trinePartners1.has(p3)) continue;
        // Found grand trine: p1, p2, p3
        const sorted = [p1, p2, p3].sort();
        const key = `gt:${sorted.join(',')}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const element = getPlanetElement(sorted[0], chartA, chartB);
        patterns.push({
          type: 'grand_trine',
          name: 'Grand Trine',
          planets: sorted,
          element,
          avgStrength: getAvgStrength(map, sorted, 'trine'),
          color: '#06b6d4', // cyan
          description: `A powerful flow of ${element} energy. Three planets in harmonious trine (120\u00B0) forming a triangle of ease and natural talent.`,
        });
      }
    }
  }

  // 2. T-Square: 2 in opposition + 1 squaring both (apex)
  for (const [p1, oppPartners] of map.oppositions) {
    for (const p2 of oppPartners) {
      const sq1 = map.squares.get(p1);
      const sq2 = map.squares.get(p2);
      if (!sq1 || !sq2) continue;
      for (const apex of sq1) {
        if (apex === p1 || apex === p2) continue;
        if (!sq2.has(apex)) continue;
        // Found T-Square: p1 opp p2, apex squares both
        const base = [p1, p2].sort();
        const key = `ts:${base.join(',')},${apex}`;
        if (seen.has(key)) continue;
        seen.add(key);

        patterns.push({
          type: 't_square',
          name: 'T-Square',
          planets: [...base, apex],
          apex,
          avgStrength: getAvgStrength(map, [...base, apex], 'square'),
          color: '#ef4444', // red
          description: `Dynamic tension focused on the apex planet (${PLANETS[apex as keyof typeof PLANETS]?.name || apex}). Two planets in opposition channel stress through the square.`,
        });
      }
    }
  }

  // 3. Grand Cross: Two T-Squares sharing the same opposition base where apexes are also in opposition
  const tSquares = patterns.filter(p => p.type === 't_square');
  for (let i = 0; i < tSquares.length; i++) {
    for (let j = i + 1; j < tSquares.length; j++) {
      const ts1 = tSquares[i];
      const ts2 = tSquares[j];
      if (!ts1.apex || !ts2.apex) continue;

      // Check if apexes are in opposition
      const apexOpp = map.oppositions.get(ts1.apex);
      if (!apexOpp?.has(ts2.apex)) continue;

      // All 4 planets
      const allPlanets = new Set([...ts1.planets, ...ts2.planets]);
      if (allPlanets.size !== 4) continue;

      const sorted = [...allPlanets].sort();
      const key = `gc:${sorted.join(',')}`;
      if (seen.has(key)) continue;
      seen.add(key);

      patterns.push({
        type: 'grand_cross',
        name: 'Grand Cross',
        planets: sorted,
        avgStrength: getAvgStrength(map, sorted, 'square'),
        color: '#991b1b', // dark red
        description: 'Maximum cardinal tension: four planets forming two oppositions and four squares. Tremendous drive and challenge demanding integration.',
      });
    }
  }

  // 4. Yod ("Finger of God"): 2 sextile + both quincunx a 3rd (apex)
  for (const [p1, sextPartners] of map.sextiles) {
    for (const p2 of sextPartners) {
      const qx1 = map.quincunxes.get(p1);
      const qx2 = map.quincunxes.get(p2);
      if (!qx1 || !qx2) continue;
      for (const apex of qx1) {
        if (apex === p1 || apex === p2) continue;
        if (!qx2.has(apex)) continue;
        // Found Yod
        const base = [p1, p2].sort();
        const key = `yod:${base.join(',')},${apex}`;
        if (seen.has(key)) continue;
        seen.add(key);

        patterns.push({
          type: 'yod',
          name: 'Yod',
          planets: [...base, apex],
          apex,
          avgStrength: getAvgStrength(map, [...base, apex], 'quincunx'),
          color: '#22c55e', // green
          description: `"Finger of God" pointing to ${PLANETS[apex as keyof typeof PLANETS]?.name || apex}. A fated configuration demanding adjustment and specialization at the apex.`,
        });
      }
    }
  }

  // 5. Stellium: 3+ planets in same zodiac sign
  const signGroups = new Map<string, string[]>();
  const allPlanets = GRID_PLANETS;
  for (const p of allPlanets) {
    const sign = getPlanetSign(p, chartA, chartB);
    if (!sign) continue;
    if (!signGroups.has(sign)) signGroups.set(sign, []);
    signGroups.get(sign)!.push(p);
  }

  for (const [sign, planets] of signGroups) {
    if (planets.length < 3) continue;
    const key = `st:${sign}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const element = ZODIAC_SIGNS.find(s => s.name === sign)?.element || '';
    patterns.push({
      type: 'stellium',
      name: 'Stellium',
      planets: planets.sort(),
      sign,
      element,
      avgStrength: 0.7, // Fixed strength for stelliums
      color: '#f59e0b', // amber
      description: `${planets.length} planets concentrated in ${sign}. A powerful emphasis on ${sign} themes and its ${element} element.`,
    });
  }

  // Sort: Grand Cross first, then T-Square, Grand Trine, Yod, Stellium
  const order = { grand_cross: 0, t_square: 1, grand_trine: 2, yod: 3, stellium: 4 };
  return patterns.sort((a, b) => order[a.type] - order[b.type]);
}
