/**
 * Aspect Calculations
 * Detect and calculate aspects between planets
 */

import { ASPECTS, getEffectiveOrb, getAspectOrb, getAspectSeparatingOrb } from './constants';
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
  isApplying?: boolean; // true = applying (getting tighter), false = separating, undefined = unknown
}

export interface SynastryAspect {
  planetA: string;
  planetB: string;
  longA: number;
  longB: number;
  aspect: DetectedAspect;
}

/** Optional orb overrides for custom configuration */
export interface OrbOverrides {
  aspectOrbs?: Record<string, number>;
  separatingAspectOrbs?: Record<string, number>;
  planetOrbs?: Record<string, number>;
}

/**
 * Determine if an aspect is applying (getting tighter) or separating (getting looser)
 * based on the daily speeds of both planets.
 * Returns undefined if speeds are not available.
 */
function determineApplying(
  long1: number,
  long2: number,
  speed1: number | undefined,
  speed2: number | undefined,
  aspectAngle: number
): boolean | undefined {
  if (speed1 === undefined || speed2 === undefined) return undefined;

  // Signed angular difference (long2 - long1, normalized to -180..180)
  let diff = ((long2 - long1) % 360 + 540) % 360 - 180;
  const absDiff = Math.abs(diff);

  // Find which "side" of the aspect we're on
  // For non-zero aspects, the distance can match from either direction
  // distance is always positive; we need to know if we're approaching or receding
  const relativeSpeed = speed2 - speed1; // positive = planet2 gaining on planet1

  // The aspect "targets" are at +angle and -angle from planet1
  // Check if the relative motion is moving the distance toward the exact aspect angle
  if (aspectAngle === 0) {
    // Conjunction: applying if they're getting closer
    return diff > 0 ? relativeSpeed < 0 : relativeSpeed > 0;
  }

  // For other aspects: check if the angular separation is moving toward the aspect angle
  // If current distance > aspect angle, applying means distance is decreasing
  // If current distance < aspect angle, applying means distance is increasing
  const currentDistance = absDiff;
  if (currentDistance > aspectAngle) {
    // Above the aspect angle — applying if closing gap
    return diff > 0 ? relativeSpeed < 0 : relativeSpeed > 0;
  } else {
    // Below the aspect angle — applying if widening toward it
    return diff > 0 ? relativeSpeed > 0 : relativeSpeed < 0;
  }
}

/**
 * Detect aspect between two longitudes
 * Uses per-planet orbs when planet keys are provided (effective orb = average of both)
 * Accepts optional orbOverrides for custom orb configuration
 * Optionally accepts speeds to determine applying/separating and use separate orbs
 */
export function detectAspect(
  long1: number,
  long2: number,
  allowedAspects?: Set<AspectType>,
  planetKeyA?: string,
  planetKeyB?: string,
  orbOverrides?: OrbOverrides,
  speedA?: number,
  speedB?: number,
): DetectedAspect | null {
  const distance = angularDistance(long1, long2);

  // Calculate effective orb from planet keys (or fall back to per-aspect orbs)
  const effectiveOrb = (planetKeyA && planetKeyB)
    ? getEffectiveOrb(planetKeyA, planetKeyB, orbOverrides?.planetOrbs)
    : null;

  // Check each aspect type
  for (const [key, def] of Object.entries(ASPECTS)) {
    // Skip if not in allowed aspects
    if (allowedAspects && !allowedAspects.has(key as AspectType)) {
      continue;
    }

    const exactOrb = Math.abs(distance - def.angle);

    // Determine applying/separating before checking orb (we need it for orb selection)
    const isApplying = determineApplying(long1, long2, speedA, speedB, def.angle);

    // Get applying and separating orbs
    const applyingOrb = effectiveOrb ?? getAspectOrb(key, orbOverrides?.aspectOrbs);
    const separatingOrb = effectiveOrb ?? getAspectSeparatingOrb(key, orbOverrides?.separatingAspectOrbs, orbOverrides?.aspectOrbs);

    // Use appropriate orb based on direction (fall back to applying orb if unknown)
    const maxOrb = isApplying === false ? separatingOrb : applyingOrb;

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
        isApplying,
      };
    }
  }

  return null;
}

/**
 * Calculate all synastry aspects between two charts
 */
export function calculateSynastryAspects(
  planetsA: Record<string, { longitude: number; speed?: number }>,
  planetsB: Record<string, { longitude: number; speed?: number }>,
  allowedPlanets?: Set<string>,
  allowedAspects?: Set<AspectType>,
  orbOverrides?: OrbOverrides
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

      const aspect = detectAspect(
        dataA.longitude, dataB.longitude, allowedAspects, pA, pB, orbOverrides,
        dataA.speed, dataB.speed,
      );

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
  planets: Record<string, { longitude: number; speed?: number }>,
  allowedPlanets?: Set<string>,
  allowedAspects?: Set<AspectType>,
  orbOverrides?: OrbOverrides
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

      const aspect = detectAspect(
        dataA.longitude, dataB.longitude, allowedAspects, pA, pB, orbOverrides,
        dataA.speed, dataB.speed,
      );

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
  // Strong aspects are more visible — floor raised for dark theme legibility
  return 0.45 + (strength * 0.5);
}

/**
 * Get aspect line thickness based on orb tightness
 */
export function getAspectStrokeWidth(strength: number): number {
  // Tighter aspects are thicker
  return 1.2 + (strength * 1.5);
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
