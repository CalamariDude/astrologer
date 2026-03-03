/**
 * Sidereal zodiac support
 * Converts tropical positions to sidereal by subtracting the ayanamsa.
 */

export interface AyanamsaSystem {
  key: string;
  name: string;
  /** Ayanamsa value at J2000.0 (degrees) */
  epoch2000: number;
  /** Annual precession rate (degrees per year) */
  rate: number;
}

/** Common ayanamsa systems with their epoch values */
export const AYANAMSA_SYSTEMS: AyanamsaSystem[] = [
  { key: 'lahiri', name: 'Lahiri (Chitrapaksha)', epoch2000: 23.853, rate: 0.01396 },
  { key: 'fagan_bradley', name: 'Fagan-Bradley', epoch2000: 24.736, rate: 0.01396 },
  { key: 'raman', name: 'B.V. Raman', epoch2000: 22.375, rate: 0.01396 },
  { key: 'krishnamurti', name: 'Krishnamurti (KP)', epoch2000: 23.813, rate: 0.01396 },
  { key: 'yukteshwar', name: 'Sri Yukteshwar', epoch2000: 22.478, rate: 0.01396 },
  { key: 'true_citra', name: 'True Chitrapaksha', epoch2000: 23.871, rate: 0.01396 },
  { key: 'galactic_center', name: 'Galactic Center (0° Sag)', epoch2000: 25.095, rate: 0.01396 },
];

/**
 * Calculate ayanamsa value for a given date and system.
 * Uses linear approximation from J2000.0 epoch values.
 */
export function getAyanamsa(birthDate: string, systemKey: string = 'lahiri'): number {
  const system = AYANAMSA_SYSTEMS.find(s => s.key === systemKey) || AYANAMSA_SYSTEMS[0];
  const year = new Date(birthDate + 'T00:00:00').getFullYear();
  const yearsSince2000 = year - 2000;
  return system.epoch2000 + yearsSince2000 * system.rate;
}

/** Zodiac signs in order */
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

/** Get sign name from longitude */
function getSign(longitude: number): string {
  const idx = Math.floor(((longitude % 360) + 360) % 360 / 30);
  return SIGNS[idx];
}

/**
 * Convert a natal chart from tropical to sidereal.
 * Subtracts the ayanamsa from all planet longitudes and recalculates signs.
 */
export function convertToSidereal(
  chart: any,
  birthDate: string,
  ayanamsaKey: string = 'lahiri'
): any {
  const ayanamsa = getAyanamsa(birthDate, ayanamsaKey);

  const newPlanets: Record<string, any> = {};
  for (const [key, planet] of Object.entries(chart.planets || {})) {
    const p = planet as any;
    const tropicalLong = p.longitude ?? 0;
    const siderealLong = ((tropicalLong - ayanamsa) % 360 + 360) % 360;
    newPlanets[key] = {
      ...p,
      longitude: siderealLong,
      sign: getSign(siderealLong),
      degree: Math.floor(siderealLong % 30),
      minute: Math.floor((siderealLong % 1) * 60),
    };
  }

  // Adjust angles too
  let newAngles = chart.angles;
  if (chart.angles) {
    const asc = ((chart.angles.ascendant - ayanamsa) % 360 + 360) % 360;
    const mc = ((chart.angles.midheaven - ayanamsa) % 360 + 360) % 360;
    newAngles = { ascendant: asc, midheaven: mc };
  }

  // Don't transform houses — they are geometric, not zodiacal
  // (The house cusps will be recalculated by HouseOverlay based on the new ASC/MC)

  return {
    ...chart,
    planets: newPlanets,
    angles: newAngles,
    _sidereal: { ayanamsa, system: ayanamsaKey },
  };
}
