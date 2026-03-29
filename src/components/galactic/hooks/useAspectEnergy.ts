/**
 * useAspectEnergy
 * Computes 3D positions (from actual planet positions) and visual energy parameters
 */

import { useMemo } from 'react';
import type { SynastryAspect } from '../../biwheel/utils/aspectCalculations';
import type { Aspect3D, AspectEnergyParams, Planet3D } from '../types';
import { PLANET_SPEED_ORDER } from '../constants';

/** Compute energy params for aspect visualization */
function computeEnergyParams(
  nature: string,
  strength: number,
  color: string,
  planetA: string,
  planetB: string,
  aspectType?: string,
): AspectEnergyParams {
  const speedA = PLANET_SPEED_ORDER[planetA] ?? 10;
  const speedB = PLANET_SPEED_ORDER[planetB] ?? 10;
  const speedDiff = Math.abs(speedA - speedB);

  const isChallenge = nature === 'challenging';
  const isHarmonious = nature === 'harmonious';
  const isConjunction = aspectType === 'conjunction';

  return {
    color,
    // Conjunctions get brighter glow — fusion of energies
    glowIntensity: isConjunction
      ? 0.5 + strength * 0.5
      : isChallenge
        ? 0.3 + strength * 0.7
        : isHarmonious
          ? 0.15 + strength * 0.5
          : 0.2 + strength * 0.5,
    pulseFrequency: isConjunction ? 1.0 + speedDiff * 0.08 : isChallenge ? 1.5 + speedDiff * 0.1 : 0.8 + speedDiff * 0.05,
    // Conjunctions get more particles — energy fusion point
    particleCount: isConjunction ? Math.max(10, Math.round(strength * 20)) : Math.max(6, Math.round(strength * 14)),
    particleSpeed: isConjunction ? 0.09 : isChallenge ? 0.12 : 0.07,
    particleTrajectory: isChallenge ? 'burst' : isHarmonious ? 'sine' : 'linear',
    tubeRadius: isConjunction ? 0.03 + strength * 0.03 : 0.02 + strength * 0.02,
  };
}

/**
 * Build Aspect3D objects using actual planet3D positions.
 * This means aspect lines now correctly cross different orbital radii.
 */
export function useAspectEnergy(aspects: SynastryAspect[], planets3D: Planet3D[]): Aspect3D[] {
  return useMemo(() => {
    // Build a lookup map for fast position retrieval
    const posMap = new Map<string, Planet3D>();
    for (const p of planets3D) {
      posMap.set(p.key, p);
    }

    return aspects
      .map((asp) => {
        const pA = posMap.get(asp.planetA);
        const pB = posMap.get(asp.planetB);
        if (!pA || !pB) return null;

        return {
          id: `${asp.planetA}-${asp.planetB}-${asp.aspect.type}`,
          planetA: asp.planetA,
          planetB: asp.planetB,
          positionA: pA.position,
          positionB: pB.position,
          aspect: asp.aspect,
          energy: computeEnergyParams(
            asp.aspect.nature,
            asp.aspect.strength,
            asp.aspect.color,
            asp.planetA,
            asp.planetB,
            asp.aspect.type,
          ),
        };
      })
      .filter((a): a is Aspect3D => a !== null);
  }, [aspects, planets3D]);
}
