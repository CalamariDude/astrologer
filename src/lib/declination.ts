/**
 * Declination calculations from ecliptic coordinates
 *
 * Declination: angular distance above/below the celestial equator.
 * Parallel: two bodies at the same declination (like conjunction by declination)
 * Contra-parallel: two bodies at opposite declination (like opposition by declination)
 */

const OBLIQUITY_DEG = 23.4393; // Mean obliquity for J2000.0
const OBLIQUITY_RAD = OBLIQUITY_DEG * Math.PI / 180;

function toRad(deg: number): number { return deg * Math.PI / 180; }
function toDeg(rad: number): number { return rad * 180 / Math.PI; }

/**
 * Calculate declination from ecliptic longitude and latitude.
 * dec = arcsin(sin(e)*sin(l)*cos(b) + cos(e)*sin(b))
 */
export function calculateDeclination(longitude: number, latitude: number = 0): number {
  const l = toRad(longitude);
  const b = toRad(latitude);
  const sinDec = Math.sin(OBLIQUITY_RAD) * Math.sin(l) * Math.cos(b)
               + Math.cos(OBLIQUITY_RAD) * Math.sin(b);
  return toDeg(Math.asin(Math.max(-1, Math.min(1, sinDec))));
}

export interface DeclinationData {
  planet: string;
  longitude: number;
  latitude: number;
  declination: number;
  isOOB: boolean; // Out of Bounds (|declination| > obliquity)
}

export interface DeclinationAspect {
  planet1: string;
  planet2: string;
  type: 'parallel' | 'contra-parallel';
  orb: number;
  declination1: number;
  declination2: number;
}

/**
 * Calculate declinations for all planets in a natal chart
 */
export function calculateDeclinations(
  planets: Record<string, { longitude: number; latitude?: number }>
): DeclinationData[] {
  const results: DeclinationData[] = [];
  for (const [planet, data] of Object.entries(planets)) {
    if (planet.startsWith('house_')) continue;
    const lat = data.latitude ?? 0;
    const dec = calculateDeclination(data.longitude, lat);
    results.push({ planet, longitude: data.longitude, latitude: lat, declination: dec, isOOB: Math.abs(dec) > OBLIQUITY_DEG });
  }
  results.sort((a, b) => b.declination - a.declination);
  return results;
}

/**
 * Detect parallel and contra-parallel aspects
 * If planetsB provided → synastry declination aspects
 * Otherwise → natal declination aspects (self-aspects)
 */
export function detectDeclinationAspects(
  planetsA: DeclinationData[],
  planetsB?: DeclinationData[],
  orb: number = 1.0
): DeclinationAspect[] {
  const aspects: DeclinationAspect[] = [];
  const targets = planetsB || planetsA;
  const isSynastry = !!planetsB;

  for (let i = 0; i < planetsA.length; i++) {
    const startJ = isSynastry ? 0 : i + 1;
    for (let j = startJ; j < targets.length; j++) {
      const a = planetsA[i];
      const b = targets[j];
      if (!isSynastry && a.planet === b.planet) continue;

      const parallelOrb = Math.abs(a.declination - b.declination);
      if (parallelOrb <= orb) {
        aspects.push({ planet1: a.planet, planet2: b.planet, type: 'parallel', orb: parallelOrb, declination1: a.declination, declination2: b.declination });
      }

      const contraOrb = Math.abs(a.declination + b.declination);
      if (contraOrb <= orb) {
        aspects.push({ planet1: a.planet, planet2: b.planet, type: 'contra-parallel', orb: contraOrb, declination1: a.declination, declination2: b.declination });
      }
    }
  }

  aspects.sort((a, b) => a.orb - b.orb);
  return aspects;
}
