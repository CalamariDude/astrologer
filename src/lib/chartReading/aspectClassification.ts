/**
 * Aspect Classification for Chart Reading Tree
 * - Forced vs true aspect detection (sign-distance check)
 * - Energy flow direction (zodiacal order)
 * Ported from DruzeMatchWeb
 */

import { detectAspect } from '@/components/biwheel/utils/aspectCalculations';
import { ZODIAC_SIGNS, PLANETS, PLANET_GROUPS } from '@/components/biwheel/utils/constants';
import type { TreeAspect } from './types';

const SIGN_NAMES = ZODIAC_SIGNS.map(s => s.name);

function signIndex(sign: string): number {
  return SIGN_NAMES.indexOf(sign);
}

function signDistance(signA: string, signB: string): number {
  const diff = Math.abs(signIndex(signA) - signIndex(signB));
  return diff > 6 ? 12 - diff : diff;
}

const ASPECT_SIGN_DISTANCE: Record<string, number> = {
  conjunction: 0,
  sextile: 2,
  square: 3,
  trine: 4,
  opposition: 6,
  quincunx: 5,
  semisextile: 1,
};

export function isAspectForced(signA: string, signB: string, aspectType: string): boolean {
  const expected = ASPECT_SIGN_DISTANCE[aspectType];
  if (expected === undefined) return false;
  const actual = signDistance(signA, signB);
  return actual !== expected;
}

export function getEnergyFlow(
  planetKeyA: string,
  longA: number,
  planetKeyB: string,
  longB: number
): string {
  const nameA = PLANETS[planetKeyA as keyof typeof PLANETS]?.name.toLowerCase() || planetKeyA;
  const nameB = PLANETS[planetKeyB as keyof typeof PLANETS]?.name.toLowerCase() || planetKeyB;
  const forwardArc = ((longB - longA) + 360) % 360;
  if (forwardArc <= 180) {
    return `${nameA} -> ${nameB}`;
  } else {
    return `${nameB} -> ${nameA}`;
  }
}

function getAspectTargetPlanets(includeOuter: boolean): string[] {
  const targets = [...PLANET_GROUPS.core];
  if (includeOuter) {
    targets.push(...PLANET_GROUPS.outer);
  }
  targets.push('chiron');
  return targets;
}

export function classifyAspectsForPlanet(
  vantageKey: string,
  vantageLong: number,
  vantageSign: string,
  allPlanets: Record<string, { longitude: number; sign: string; house: number; retrograde: boolean }>,
  includeOuter: boolean
): TreeAspect[] {
  const aspects: TreeAspect[] = [];
  const targets = getAspectTargetPlanets(includeOuter);
  const majorAspects = new Set([
    'conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare',
  ] as any[]);

  for (const targetKey of targets) {
    if (targetKey === vantageKey) continue;
    const target = allPlanets[targetKey];
    if (!target) continue;

    const detected = detectAspect(
      vantageLong,
      target.longitude,
      majorAspects as any,
      vantageKey,
      targetKey
    );

    if (detected) {
      aspects.push({
        target: targetKey,
        target_longitude: target.longitude,
        type: detected.type,
        name: detected.name,
        symbol: detected.symbol,
        angle: detected.angle,
        orb: detected.exactOrb,
        forced: isAspectForced(vantageSign, target.sign, detected.type),
        energy_flow: getEnergyFlow(vantageKey, vantageLong, targetKey, target.longitude),
        nature: detected.nature,
        target_sign: target.sign,
        target_house: target.house,
        target_retrograde: target.retrograde,
      });
    }
  }

  aspects.sort((a, b) => a.orb - b.orb);
  return aspects;
}
