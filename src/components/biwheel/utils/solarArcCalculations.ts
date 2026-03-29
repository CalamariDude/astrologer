/**
 * Solar Arc Directions
 * Calculate solar arc directed positions for all planets
 * Solar Arc = Progressed Sun longitude - Natal Sun longitude
 * Each planet's directed position = Natal longitude + Solar Arc
 */

import type { NatalChart, PlanetData } from '../types';
import { ZODIAC_SIGNS } from './constants';

export interface SolarArcData {
  arc: number; // The solar arc in degrees
  planets: Record<string, PlanetData>;
  progressedSunLong: number;
  natalSunLong: number;
}

function normalize(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function getSignFromLongitude(longitude: number): string {
  const signIndex = Math.floor(normalize(longitude) / 30);
  return ZODIAC_SIGNS[signIndex]?.name || 'Unknown';
}

function getHouseFromLongitude(longitude: number, houses: Record<string, number> | undefined): number | undefined {
  if (!houses) return undefined;
  const cusps = Object.entries(houses)
    .filter(([k]) => k.startsWith('house_'))
    .sort(([a], [b]) => parseInt(a.replace('house_', '')) - parseInt(b.replace('house_', '')))
    .map(([, v]) => v);

  if (cusps.length < 12) return undefined;

  const norm = normalize(longitude);
  for (let i = 0; i < 12; i++) {
    const next = (i + 1) % 12;
    const start = normalize(cusps[i]);
    const end = normalize(cusps[next]);

    if (start < end) {
      if (norm >= start && norm < end) return i + 1;
    } else {
      // Wraps around 0 degrees
      if (norm >= start || norm < end) return i + 1;
    }
  }
  return 1;
}

/**
 * Calculate solar arc directions from progressed Sun data
 * @param natalChart The natal chart
 * @param progressedSunLongitude The progressed Sun's longitude
 * @returns Solar arc directed positions for all planets
 */
export function calculateSolarArc(
  natalChart: NatalChart,
  progressedSunLongitude: number
): SolarArcData {
  const natalSunLong = natalChart.planets.sun?.longitude ?? 0;
  const arc = normalize(progressedSunLongitude - natalSunLong);

  const directedPlanets: Record<string, PlanetData> = {};

  for (const [key, planet] of Object.entries(natalChart.planets)) {
    const directedLong = normalize(planet.longitude + arc);
    directedPlanets[key] = {
      longitude: directedLong,
      sign: getSignFromLongitude(directedLong),
      house: getHouseFromLongitude(directedLong, natalChart.houses),
      retrograde: planet.retrograde,
      decan: Math.floor((directedLong % 30) / 10) + 1,
    };
  }

  return {
    arc,
    planets: directedPlanets,
    progressedSunLong: progressedSunLongitude,
    natalSunLong,
  };
}

/**
 * Format solar arc value for display
 */
export function formatSolarArc(arc: number): string {
  const deg = Math.floor(arc);
  const min = Math.round((arc - deg) * 60);
  return `${deg}\u00B0${min.toString().padStart(2, '0')}'`;
}
