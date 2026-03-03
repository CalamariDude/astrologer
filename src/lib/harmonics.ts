/**
 * Harmonic Chart Calculations
 * Multiply each planet's longitude by the harmonic number, mod 360
 */

import { ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';

interface PlanetData {
  longitude: number;
  sign?: string;
  [key: string]: any;
}

interface NatalChart {
  planets: Record<string, PlanetData>;
  houses?: Record<string, number>;
  angles?: { ascendant: number; midheaven: number };
}

/**
 * Calculate a harmonic chart by multiplying each planet's longitude by the harmonic number.
 * Houses and angles are NOT transformed (harmonic charts don't use houses).
 */
export function calculateHarmonicChart(chart: NatalChart, harmonic: number): NatalChart {
  if (harmonic <= 1) return chart;

  const planets: Record<string, PlanetData> = {};

  for (const [key, planet] of Object.entries(chart.planets)) {
    if (planet.longitude === undefined) continue;
    const newLong = ((planet.longitude * harmonic) % 360 + 360) % 360;
    const signIdx = Math.floor(newLong / 30);
    const sign = ZODIAC_SIGNS[signIdx]?.name || planet.sign || '';
    planets[key] = {
      ...planet,
      longitude: newLong,
      sign,
      degree: Math.floor(newLong % 30),
      minute: Math.floor(((newLong % 1) * 60)),
    };
  }

  return {
    planets,
    // Keep original houses/angles for reference, but they don't apply to harmonics
    houses: chart.houses,
    angles: chart.angles,
  };
}

/** Common harmonic presets with labels */
export const HARMONIC_PRESETS = [
  { value: 1, label: 'H1', description: 'Natal' },
  { value: 5, label: 'H5', description: 'Creativity' },
  { value: 7, label: 'H7', description: 'Inspiration' },
  { value: 9, label: 'H9', description: 'Joy/Talent' },
  { value: 12, label: 'H12', description: 'Karma' },
] as const;
