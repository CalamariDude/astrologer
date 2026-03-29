/**
 * Synastry Aspect Classification for Chart Reading Tree
 * Cross-chart aspect detection: one person's planet vs another person's planets
 */

import { detectAspect } from '@/components/biwheel/utils/aspectCalculations';
import { ZODIAC_SIGNS, PLANETS, PLANET_GROUPS, ASPECTS } from '@/components/biwheel/utils/constants';
import { isAspectForced, getEnergyFlow } from './aspectClassification';
import type { TreeAspect } from './types';

const SIGN_NAMES = ZODIAC_SIGNS.map(s => s.name);

function getSignFromLongitude(longitude: number): string {
  return SIGN_NAMES[Math.floor(longitude / 30) % 12];
}

/**
 * Build the list of planets to check aspects against
 */
function getAspectTargetPlanets(includeOuter: boolean): string[] {
  const targets = [...PLANET_GROUPS.core];
  if (includeOuter) {
    targets.push(...PLANET_GROUPS.outer);
  }
  targets.push('chiron');
  return targets;
}

/**
 * Classify cross-chart aspects for a vantage planet from one chart against all planets in another chart.
 */
export function classifySynastryAspectsForPlanet(
  vantageKey: string,
  vantageLong: number,
  vantageSign: string,
  sourcePersonLabel: string,
  targetChartPlanets: Record<string, { longitude: number; sign: string; house: number; retrograde: boolean }>,
  targetPersonLabel: string,
  includeOuter: boolean
): TreeAspect[] {
  const aspects: TreeAspect[] = [];
  const targets = getAspectTargetPlanets(includeOuter);

  const majorAspects = new Set<keyof typeof ASPECTS>([
    'conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx',
  ] as any);

  for (const targetKey of targets) {
    const target = targetChartPlanets[targetKey];
    if (!target) continue;

    const detected = detectAspect(
      vantageLong,
      target.longitude,
      majorAspects as any,
      vantageKey,
      targetKey
    );

    if (detected) {
      const srcName = PLANETS[vantageKey as keyof typeof PLANETS]?.name || vantageKey;
      const tgtName = PLANETS[targetKey as keyof typeof PLANETS]?.name || targetKey;

      aspects.push({
        target: targetKey,
        target_longitude: target.longitude,
        type: detected.type,
        name: detected.name,
        symbol: detected.symbol,
        angle: detected.angle,
        orb: detected.exactOrb,
        forced: isAspectForced(vantageSign, target.sign, detected.type),
        energy_flow: `${sourcePersonLabel}'s ${srcName} → ${targetPersonLabel}'s ${tgtName}`,
        nature: detected.nature,
        target_sign: target.sign,
        target_house: target.house,
        target_retrograde: target.retrograde,
      });
    }
  }

  // Sort by tightest orb first
  aspects.sort((a, b) => a.orb - b.orb);

  return aspects;
}
