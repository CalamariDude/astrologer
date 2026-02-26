/**
 * Aspect Calculations
 * Detect and calculate aspects between planets
 */

import { ASPECTS, getEffectiveOrb } from './constants';
import { angularDistance } from './chartMath';

export type AspectType = keyof typeof ASPECTS;

export interface DetectedAspect {
  type: AspectType;
  name: string;
  symbol: string;
  angle: number;
  orb: number;
  exactOrb: number; // Actual orb from exact angle
  color: string;
  nature: 'harmonious' | 'challenging' | 'neutral';
  major: boolean;
  strength: number; // 0-1, based on orb tightness
}

export interface SynastryAspect {
  planetA: string;
  planetB: string;
  longA: number;
  longB: number;
  aspect: DetectedAspect;
}

/**
 * Detect aspect between two longitudes
 * Uses per-planet orbs when planet keys are provided (effective orb = average of both)
 */
export function detectAspect(
  long1: number,
  long2: number,
  allowedAspects?: Set<AspectType>,
  planetKeyA?: string,
  planetKeyB?: string
): DetectedAspect | null {
  const distance = angularDistance(long1, long2);

  // Calculate effective orb from planet keys (or fall back to per-aspect orbs)
  const effectiveOrb = (planetKeyA && planetKeyB)
    ? getEffectiveOrb(planetKeyA, planetKeyB)
    : null;

  // Check each aspect type
  for (const [key, def] of Object.entries(ASPECTS)) {
    // Skip if not in allowed aspects
    if (allowedAspects && !allowedAspects.has(key as AspectType)) {
      continue;
    }

    const exactOrb = Math.abs(distance - def.angle);

    // Use per-planet orb if available, otherwise fall back to per-aspect orb
    const maxOrb = effectiveOrb ?? def.orb;

    if (exactOrb <= maxOrb) {
      // Calculate strength (1 = exact, 0 = at orb limit)
      const strength = 1 - (exactOrb / maxOrb);

      return {
        type: key as AspectType,
        name: def.name,
        symbol: def.symbol,
        angle: def.angle,
        orb: maxOrb,
        exactOrb: Math.round(exactOrb * 100) / 100,
        color: def.color,
        nature: def.nature,
        major: def.major,
        strength: Math.round(strength * 100) / 100,
      };
    }
  }

  return null;
}

/**
 * Calculate all synastry aspects between two charts
 */
export function calculateSynastryAspects(
  planetsA: Record<string, { longitude: number }>,
  planetsB: Record<string, { longitude: number }>,
  allowedPlanets?: Set<string>,
  allowedAspects?: Set<AspectType>
): SynastryAspect[] {
  const aspects: SynastryAspect[] = [];

  const keysA = Object.keys(planetsA).filter(k => !allowedPlanets || allowedPlanets.has(k));
  const keysB = Object.keys(planetsB).filter(k => !allowedPlanets || allowedPlanets.has(k));

  for (const pA of keysA) {
    const dataA = planetsA[pA];
    if (!dataA || dataA.longitude === undefined) continue;

    for (const pB of keysB) {
      const dataB = planetsB[pB];
      if (!dataB || dataB.longitude === undefined) continue;

      const aspect = detectAspect(dataA.longitude, dataB.longitude, allowedAspects, pA, pB);

      if (aspect) {
        aspects.push({
          planetA: pA,
          planetB: pB,
          longA: dataA.longitude,
          longB: dataB.longitude,
          aspect,
        });
      }
    }
  }

  // Sort by strength (tightest first)
  return aspects.sort((a, b) => b.aspect.strength - a.aspect.strength);
}

/**
 * Calculate natal aspects within a single chart
 * Used for Person A only, Person B only, and Composite modes
 * Avoids duplicate pairs (Sun-Moon is same as Moon-Sun)
 */
export function calculateNatalAspects(
  planets: Record<string, { longitude: number }>,
  allowedPlanets?: Set<string>,
  allowedAspects?: Set<AspectType>
): SynastryAspect[] {
  const aspects: SynastryAspect[] = [];

  const keys = Object.keys(planets).filter(k => !allowedPlanets || allowedPlanets.has(k));

  // Only check each pair once (i < j to avoid duplicates)
  for (let i = 0; i < keys.length; i++) {
    const pA = keys[i];
    const dataA = planets[pA];
    if (!dataA || dataA.longitude === undefined) continue;

    for (let j = i + 1; j < keys.length; j++) {
      const pB = keys[j];
      const dataB = planets[pB];
      if (!dataB || dataB.longitude === undefined) continue;

      const aspect = detectAspect(dataA.longitude, dataB.longitude, allowedAspects, pA, pB);

      if (aspect) {
        aspects.push({
          planetA: pA,
          planetB: pB,
          longA: dataA.longitude,
          longB: dataB.longitude,
          aspect,
        });
      }
    }
  }

  // Sort by strength (tightest first)
  return aspects.sort((a, b) => b.aspect.strength - a.aspect.strength);
}

/**
 * Get aspect line opacity based on orb tightness
 */
export function getAspectOpacity(strength: number): number {
  // Strong aspects are more visible
  return 0.3 + (strength * 0.6);
}

/**
 * Get aspect line thickness based on orb tightness
 */
export function getAspectStrokeWidth(strength: number): number {
  // Tighter aspects are thicker
  return 1 + (strength * 1.5);
}

/**
 * Determine if aspect line should be dashed
 */
export function isAspectDashed(nature: 'harmonious' | 'challenging' | 'neutral'): boolean {
  return nature === 'challenging';
}

/**
 * Filter aspects by planet
 */
export function filterAspectsByPlanet(
  aspects: SynastryAspect[],
  planet: string,
  chart: 'A' | 'B' | 'both' = 'both'
): SynastryAspect[] {
  return aspects.filter(asp => {
    if (chart === 'A') return asp.planetA === planet;
    if (chart === 'B') return asp.planetB === planet;
    return asp.planetA === planet || asp.planetB === planet;
  });
}

/**
 * Group aspects by type
 */
export function groupAspectsByType(
  aspects: SynastryAspect[]
): Record<AspectType, SynastryAspect[]> {
  const groups: Partial<Record<AspectType, SynastryAspect[]>> = {};

  for (const asp of aspects) {
    if (!groups[asp.aspect.type]) {
      groups[asp.aspect.type] = [];
    }
    groups[asp.aspect.type]!.push(asp);
  }

  return groups as Record<AspectType, SynastryAspect[]>;
}

/**
 * Count aspects by nature
 */
export function countAspectsByNature(
  aspects: SynastryAspect[]
): { harmonious: number; challenging: number; neutral: number } {
  const counts = { harmonious: 0, challenging: 0, neutral: 0 };

  for (const asp of aspects) {
    counts[asp.aspect.nature]++;
  }

  return counts;
}

/**
 * Get the most significant aspects (tightest orbs)
 */
export function getTopAspects(
  aspects: SynastryAspect[],
  count: number = 5
): SynastryAspect[] {
  return aspects.slice(0, count);
}
