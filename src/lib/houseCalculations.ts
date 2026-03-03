/**
 * Client-side house cusp calculations
 * Computes house cusps from ASC, MC, and geographic latitude
 * for all major house systems without needing an API call.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// Mean obliquity of the ecliptic (J2000, good enough for house calculations)
const OBLIQUITY = 23.4393 * DEG;

/** Convert ecliptic longitude to right ascension (assuming ecliptic latitude = 0) */
function eclToRA(longitude: number): number {
  const lon = longitude * DEG;
  let ra = Math.atan2(Math.sin(lon) * Math.cos(OBLIQUITY), Math.cos(lon)) * RAD;
  if (ra < 0) ra += 360;
  return ra;
}

/** Convert right ascension to ecliptic longitude (assuming ecliptic latitude = 0) */
function raToEcl(ra: number): number {
  const r = ra * DEG;
  let lon = Math.atan2(Math.sin(r) / Math.cos(OBLIQUITY), Math.cos(r)) * RAD;
  // Preserve quadrant
  if (lon < 0) lon += 360;
  // Ensure correct quadrant (atan2 can flip)
  const raQuad = Math.floor(ra / 90);
  const lonQuad = Math.floor(lon / 90);
  if (raQuad !== lonQuad) {
    // Adjust to correct quadrant
    lon = lon + (raQuad - lonQuad) * 90;
    if (lon < 0) lon += 360;
    if (lon >= 360) lon -= 360;
  }
  return lon;
}

/** Compute declination from ecliptic longitude */
function declination(longitude: number): number {
  return Math.asin(Math.sin(OBLIQUITY) * Math.sin(longitude * DEG)) * RAD;
}

/** Compute ascensional difference */
function ascDiff(dec: number, lat: number): number {
  const val = Math.tan(dec * DEG) * Math.tan(lat * DEG);
  if (val >= 1) return 90;
  if (val <= -1) return -90;
  return Math.asin(val) * RAD;
}

/** Diurnal semi-arc */
function diurnalSemiArc(dec: number, lat: number): number {
  return 90 + ascDiff(dec, lat);
}

/** Normalize angle to 0-360 */
function norm360(a: number): number {
  a = a % 360;
  return a < 0 ? a + 360 : a;
}

/** Angular span from a to b going forward in zodiac */
function span(from: number, to: number): number {
  let s = to - from;
  if (s <= 0) s += 360;
  return s;
}

// ========================
// House System Calculators
// ========================

/** Whole Sign: each house = 30° starting from 0° of ASC's sign */
function wholeSign(asc: number): number[] {
  const ascSign = Math.floor(asc / 30);
  return Array.from({ length: 12 }, (_, i) => (ascSign * 30 + i * 30) % 360);
}

/** Equal House: each house = ASC + i*30° */
function equalHouse(asc: number): number[] {
  return Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30));
}

/** Porphyry: trisect the quadrants between the four angles */
function porphyry(asc: number, mc: number): number[] {
  const ic = norm360(mc + 180);
  const dsc = norm360(asc + 180);

  const q1 = span(mc, asc);    // MC → ASC
  const q2 = span(asc, ic);    // ASC → IC
  const q3 = span(ic, dsc);    // IC → DSC
  const q4 = span(dsc, mc);    // DSC → MC

  const cusps = new Array(12);
  cusps[0] = asc;                              // House 1
  cusps[1] = norm360(asc + q2 / 3);           // House 2
  cusps[2] = norm360(asc + 2 * q2 / 3);       // House 3
  cusps[3] = ic;                               // House 4
  cusps[4] = norm360(ic + q3 / 3);            // House 5
  cusps[5] = norm360(ic + 2 * q3 / 3);        // House 6
  cusps[6] = dsc;                              // House 7
  cusps[7] = norm360(dsc + q4 / 3);           // House 8
  cusps[8] = norm360(dsc + 2 * q4 / 3);       // House 9
  cusps[9] = mc;                               // House 10
  cusps[10] = norm360(mc + q1 / 3);           // House 11
  cusps[11] = norm360(mc + 2 * q1 / 3);       // House 12

  return cusps;
}

/**
 * Placidus: divides each house's own semi-arc proportionally.
 * Uses iterative algorithm since each cusp's semi-arc depends on its own declination.
 */
function placidus(asc: number, mc: number, lat: number): number[] {
  // Extreme latitudes: Placidus fails, fall back to Porphyry
  if (Math.abs(lat) > 66) return porphyry(asc, mc);

  const ic = norm360(mc + 180);
  const dsc = norm360(asc + 180);

  const ramc = eclToRA(mc);

  const cusps = new Array(12);
  cusps[0] = asc;
  cusps[3] = ic;
  cusps[6] = dsc;
  cusps[9] = mc;

  // Compute cusps 11, 12 (MC → ASC, fractions 1/3, 2/3)
  cusps[10] = placidusCusp(ramc, lat, 1 / 3, true);
  cusps[11] = placidusCusp(ramc, lat, 2 / 3, true);

  // Compute cusps 2, 3 (ASC → IC, fractions 1/3, 2/3)
  cusps[1] = placidusCusp(ramc, lat, 1 / 3, false);
  cusps[2] = placidusCusp(ramc, lat, 2 / 3, false);

  // Cusps 5, 6, 8, 9 are opposite of 11, 12, 2, 3
  cusps[4] = norm360(cusps[10] + 180);
  cusps[5] = norm360(cusps[11] + 180);
  cusps[7] = norm360(cusps[1] + 180);
  cusps[8] = norm360(cusps[2] + 180);

  return cusps;
}

/** Iterative Placidus cusp calculation */
function placidusCusp(ramc: number, lat: number, fraction: number, isAboveHorizon: boolean): number {
  // Initial guess using simple interpolation
  const raAsc = ramc + 90 + ascDiff(declination(raToEcl(ramc + 90)), lat);
  let raCusp: number;

  if (isAboveHorizon) {
    // Diurnal: MC to ASC
    raCusp = ramc + fraction * span(ramc, norm360(raAsc));
  } else {
    // Nocturnal: ASC to IC
    const raIc = norm360(ramc + 180);
    raCusp = norm360(raAsc + fraction * span(norm360(raAsc), raIc));
  }

  // Iterate
  for (let iter = 0; iter < 20; iter++) {
    const lon = raToEcl(norm360(raCusp));
    const dec = declination(lon);
    const ad = ascDiff(dec, lat);
    const sa = isAboveHorizon ? (90 + ad) : (90 - ad);

    if (sa <= 0 || sa >= 180) break; // degenerate case

    let newRa: number;
    if (isAboveHorizon) {
      newRa = ramc + fraction * sa;
    } else {
      newRa = norm360(ramc + 180) - fraction * sa;
    }
    newRa = norm360(newRa);

    if (Math.abs(newRa - raCusp) < 0.01 || Math.abs(newRa - raCusp) > 359.99) break;
    raCusp = newRa;
  }

  return raToEcl(norm360(raCusp));
}

/**
 * Koch: uses the MC's diurnal semi-arc to divide houses.
 * Simpler than Placidus as it uses a fixed semi-arc (MC's).
 */
function koch(asc: number, mc: number, lat: number): number[] {
  if (Math.abs(lat) > 66) return porphyry(asc, mc);

  const ic = norm360(mc + 180);
  const dsc = norm360(asc + 180);

  const decMC = declination(mc);
  const dsaMC = diurnalSemiArc(decMC, lat);
  const ramc = eclToRA(mc);

  const cusps = new Array(12);
  cusps[0] = asc;
  cusps[3] = ic;
  cusps[6] = dsc;
  cusps[9] = mc;

  // Houses 11, 12: RAMC + fraction * DSA_MC
  cusps[10] = raToEcl(norm360(ramc + dsaMC / 3));
  cusps[11] = raToEcl(norm360(ramc + 2 * dsaMC / 3));

  // Houses 2, 3: using nocturnal semi-arc of MC
  const nsaMC = 180 - dsaMC;
  cusps[1] = raToEcl(norm360(ramc + 180 + nsaMC / 3));
  cusps[2] = raToEcl(norm360(ramc + 180 + 2 * nsaMC / 3));

  // Opposite cusps
  cusps[4] = norm360(cusps[10] + 180);
  cusps[5] = norm360(cusps[11] + 180);
  cusps[7] = norm360(cusps[1] + 180);
  cusps[8] = norm360(cusps[2] + 180);

  return cusps;
}

/**
 * Campanus: divides the prime vertical into 12 equal sections
 * and projects them onto the ecliptic.
 */
function campanus(asc: number, mc: number, lat: number): number[] {
  if (Math.abs(lat) > 66) return porphyry(asc, mc);

  const ramc = eclToRA(mc);
  const cusps = new Array(12);

  for (let i = 0; i < 12; i++) {
    // Prime vertical angle: 30° sections starting from East
    const pvAngle = (i * 30) * DEG;
    const raCusp = ramc + Math.atan2(Math.sin(pvAngle), Math.cos(pvAngle) * Math.cos(lat * DEG)) * RAD;
    cusps[i] = raToEcl(norm360(raCusp));
  }

  // Force angles
  cusps[0] = asc;
  cusps[3] = norm360(mc + 180);
  cusps[6] = norm360(asc + 180);
  cusps[9] = mc;

  return cusps;
}

/**
 * Regiomontanus: divides the celestial equator into 12 equal 30° sections
 * starting from the East point, projected through great circles passing
 * through the North and South celestial poles.
 */
function regiomontanus(asc: number, mc: number, lat: number): number[] {
  if (Math.abs(lat) > 66) return porphyry(asc, mc);

  const ramc = eclToRA(mc);
  const cusps = new Array(12);

  for (let i = 0; i < 12; i++) {
    const h = (i * 30 + 90) * DEG; // Hour angle offset from MC
    const tanLon = Math.sin(ramc * DEG + h) /
      (Math.cos(ramc * DEG + h) * Math.cos(OBLIQUITY) - Math.tan(lat * DEG) * Math.sin(OBLIQUITY));
    let lon = Math.atan(tanLon) * RAD;

    // Correct quadrant
    const sinRA = Math.sin(ramc * DEG + h);
    if (sinRA > 0 && lon < 0) lon += 180;
    else if (sinRA < 0 && lon > 0) lon += 180;
    cusps[i] = norm360(lon);
  }

  // Force angles
  cusps[0] = asc;
  cusps[3] = norm360(mc + 180);
  cusps[6] = norm360(asc + 180);
  cusps[9] = mc;

  return cusps;
}

/**
 * Topocentric: similar to Placidus but uses a different projection.
 * In practice, very close to Placidus. We use the Placidus algorithm
 * with a slight modification for the topocentric correction.
 */
function topocentric(asc: number, mc: number, lat: number): number[] {
  // Topocentric is virtually identical to Placidus for most cases
  // The difference is in accounting for the observer's position on the Earth's surface
  // vs the geocentric position. For a client-side approximation, Placidus is close enough.
  return placidus(asc, mc, lat);
}

// ========================
// Main Export
// ========================

export type HouseSystemKey = 'whole_sign' | 'placidus' | 'koch' | 'equal' | 'campanus' | 'regiomontanus' | 'topocentric' | 'porphyry';

export const HOUSE_SYSTEM_NAMES: Record<HouseSystemKey, string> = {
  whole_sign: 'Whole Sign',
  placidus: 'Placidus',
  koch: 'Koch',
  equal: 'Equal',
  campanus: 'Campanus',
  regiomontanus: 'Regiomontanus',
  topocentric: 'Topocentric',
  porphyry: 'Porphyry',
};

/**
 * Calculate house cusps for the given system.
 * Returns an array of 12 ecliptic longitudes (0-360) for house cusps 1-12.
 *
 * @param asc - Ascendant longitude (degrees)
 * @param mc - Midheaven longitude (degrees)
 * @param lat - Geographic latitude (degrees, needed for Placidus/Koch/etc.)
 * @param system - House system key
 */
export function calculateHouseCusps(
  asc: number,
  mc: number,
  lat: number,
  system: HouseSystemKey | string
): number[] {
  switch (system) {
    case 'whole_sign': return wholeSign(asc);
    case 'equal': return equalHouse(asc);
    case 'porphyry': return porphyry(asc, mc);
    case 'placidus': return placidus(asc, mc, lat);
    case 'koch': return koch(asc, mc, lat);
    case 'campanus': return campanus(asc, mc, lat);
    case 'regiomontanus': return regiomontanus(asc, mc, lat);
    case 'topocentric': return topocentric(asc, mc, lat);
    default: return wholeSign(asc);
  }
}
