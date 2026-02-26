/**
 * Essential Dignity System
 * Traditional essential dignities: Domicile, Exaltation, Detriment, Fall, Peregrine
 * + Time lord natal condition calculator for Profections
 */

import { detectAspect } from '@/components/biwheel/utils/aspectCalculations';
import { PLANETS, PLANET_GROUPS, ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';
import type { NatalChart } from '@/components/biwheel/types';

export interface DignityInfo {
  type: 'domicile' | 'exaltation' | 'detriment' | 'fall' | 'peregrine';
  label: string;
  score: number;
  color: string;
  bgClass: string;
}

export interface TimeLordCondition {
  dignity: DignityInfo;
  sign: string;
  signSymbol: string;
  house: number | null;
  retrograde: boolean;
  longitude: number;
  aspects: {
    planet: string;
    planetSymbol: string;
    aspectType: string;
    aspectSymbol: string;
    aspectColor: string;
    nature: 'harmonious' | 'challenging' | 'neutral';
    orb: number;
  }[];
}

// Modern rulerships (domicile)
const DOMICILE: Record<string, string[]> = {
  sun: ['Leo'],
  moon: ['Cancer'],
  mercury: ['Gemini', 'Virgo'],
  venus: ['Taurus', 'Libra'],
  mars: ['Aries'],
  jupiter: ['Sagittarius'],
  saturn: ['Capricorn'],
  uranus: ['Aquarius'],
  neptune: ['Pisces'],
  pluto: ['Scorpio'],
};

// Exaltation signs (with traditional exaltation degrees)
const EXALTATION: Record<string, { sign: string; degree: number }> = {
  sun: { sign: 'Aries', degree: 19 },
  moon: { sign: 'Taurus', degree: 3 },
  mercury: { sign: 'Virgo', degree: 15 },
  venus: { sign: 'Pisces', degree: 27 },
  mars: { sign: 'Capricorn', degree: 28 },
  jupiter: { sign: 'Cancer', degree: 15 },
  saturn: { sign: 'Libra', degree: 21 },
};

// Detriment = opposite of domicile
const DETRIMENT: Record<string, string[]> = {
  sun: ['Aquarius'],
  moon: ['Capricorn'],
  mercury: ['Sagittarius', 'Pisces'],
  venus: ['Aries', 'Scorpio'],
  mars: ['Libra'],
  jupiter: ['Gemini'],
  saturn: ['Cancer'],
  uranus: ['Leo'],
  neptune: ['Virgo'],
  pluto: ['Taurus'],
};

// Fall = opposite of exaltation
const FALL: Record<string, string> = {
  sun: 'Libra',
  moon: 'Scorpio',
  mercury: 'Pisces',
  venus: 'Virgo',
  mars: 'Cancer',
  jupiter: 'Capricorn',
  saturn: 'Aries',
};

/**
 * Get essential dignity for a planet in a given sign
 */
export function getEssentialDignity(planetKey: string, sign: string): DignityInfo {
  const key = planetKey.toLowerCase();

  // Check domicile
  if (DOMICILE[key]?.includes(sign)) {
    return {
      type: 'domicile',
      label: 'Domicile',
      score: 5,
      color: '#22c55e',
      bgClass: 'bg-green-500/10 text-green-600 dark:text-green-400 ring-green-500/30',
    };
  }

  // Check exaltation
  if (EXALTATION[key]?.sign === sign) {
    return {
      type: 'exaltation',
      label: 'Exalted',
      score: 4,
      color: '#22c55e',
      bgClass: 'bg-green-500/10 text-green-600 dark:text-green-400 ring-green-500/30',
    };
  }

  // Check detriment
  if (DETRIMENT[key]?.includes(sign)) {
    return {
      type: 'detriment',
      label: 'Detriment',
      score: -5,
      color: '#ef4444',
      bgClass: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/30',
    };
  }

  // Check fall
  if (FALL[key] === sign) {
    return {
      type: 'fall',
      label: 'Fall',
      score: -4,
      color: '#ef4444',
      bgClass: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/30',
    };
  }

  // Peregrine (no essential dignity)
  return {
    type: 'peregrine',
    label: 'Peregrine',
    score: 0,
    color: '#6b7280',
    bgClass: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-gray-500/30',
  };
}

/**
 * Get the natal condition of a time lord planet in the natal chart.
 * Used by Profections to show how strong the time lord is natally.
 */
export function getTimeLordNatalCondition(
  timeLordKey: string,
  chart: NatalChart
): TimeLordCondition | null {
  const key = timeLordKey.toLowerCase();
  const planetData = chart.planets[key];
  if (!planetData || planetData.longitude === undefined) return null;

  // Get sign from longitude
  const signIdx = Math.floor(((planetData.longitude % 360 + 360) % 360) / 30);
  const sign = ZODIAC_SIGNS[signIdx];
  const dignity = getEssentialDignity(key, sign.name);

  // Find aspects this planet makes to other natal planets
  const ASPECT_PLANETS = [...PLANET_GROUPS.core, ...PLANET_GROUPS.outer] as string[];
  const majorOnly = new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare'] as const);

  const aspects: TimeLordCondition['aspects'] = [];
  for (const otherKey of ASPECT_PLANETS) {
    if (otherKey === key) continue;
    const otherData = chart.planets[otherKey];
    if (!otherData || otherData.longitude === undefined) continue;

    const aspect = detectAspect(planetData.longitude, otherData.longitude, majorOnly as any, key, otherKey);
    if (aspect) {
      const info = PLANETS[otherKey as keyof typeof PLANETS];
      aspects.push({
        planet: otherKey,
        planetSymbol: info?.symbol || otherKey,
        aspectType: aspect.type,
        aspectSymbol: aspect.symbol,
        aspectColor: aspect.color,
        nature: aspect.nature,
        orb: aspect.exactOrb,
      });
    }
  }

  // Sort by orb (tightest first)
  aspects.sort((a, b) => a.orb - b.orb);

  return {
    dignity,
    sign: sign.name,
    signSymbol: sign.symbol,
    house: planetData.house ?? null,
    retrograde: planetData.retrograde ?? false,
    longitude: planetData.longitude,
    aspects,
  };
}
