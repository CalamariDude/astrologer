/**
 * Chart Math Utilities
 * Coordinate conversions and geometric calculations for the biwheel
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Convert zodiac longitude (0-360) to chart angle in radians
 * Base orientation: 0° Aries is at 12 o'clock (top), zodiac flows counter-clockwise
 * (Aries → Taurus → Gemini going counter-clockwise around the wheel)
 * With rotationOffset: chart is rotated so that the ascendant appears at 9 o'clock (left)
 * @param longitude - zodiac longitude (0-360)
 * @param rotationOffset - optional rotation offset in degrees (typically 90 - ascendant)
 */
export function longitudeToAngle(longitude: number, rotationOffset: number = 0): number {
  return (90 + longitude + rotationOffset) * (Math.PI / 180);
}

/**
 * Convert zodiac longitude to SVG coordinates
 * @param longitude - zodiac longitude (0-360)
 * @param centerX - center X coordinate
 * @param centerY - center Y coordinate
 * @param radius - radius from center
 * @param rotationOffset - optional rotation offset in degrees
 */
export function longitudeToXY(
  longitude: number,
  centerX: number,
  centerY: number,
  radius: number,
  rotationOffset: number = 0
): Point {
  const angle = longitudeToAngle(longitude, rotationOffset);
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY - radius * Math.sin(angle),
  };
}

/**
 * Convert angle in degrees to SVG coordinates (for house cusps, etc.)
 * @param angleDeg - angle in degrees
 * @param centerX - center X coordinate
 * @param centerY - center Y coordinate
 * @param radius - radius from center
 * @param rotationOffset - optional rotation offset in degrees
 */
export function angleToXY(
  angleDeg: number,
  centerX: number,
  centerY: number,
  radius: number,
  rotationOffset: number = 0
): Point {
  const angle = longitudeToAngle(angleDeg, rotationOffset);
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY - radius * Math.sin(angle),
  };
}

/**
 * Create an SVG arc path between two angles
 */
export function createArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  largeArc: boolean = false,
  rotationOffset: number = 0
): string {
  const start = longitudeToXY(startAngle, centerX, centerY, radius, rotationOffset);
  const end = longitudeToXY(endAngle, centerX, centerY, radius, rotationOffset);
  const largeArcFlag = largeArc ? 1 : 0;
  const sweepFlag = 0; // counterclockwise

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

/**
 * Create a closed segment path (like a zodiac sign section)
 */
export function createSegmentPath(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  rotationOffset: number = 0
): string {
  const outerStart = longitudeToXY(startAngle, centerX, centerY, outerRadius, rotationOffset);
  const outerEnd = longitudeToXY(endAngle, centerX, centerY, outerRadius, rotationOffset);
  const innerStart = longitudeToXY(startAngle, centerX, centerY, innerRadius, rotationOffset);
  const innerEnd = longitudeToXY(endAngle, centerX, centerY, innerRadius, rotationOffset);

  return `
    M ${innerStart.x} ${innerStart.y}
    L ${outerStart.x} ${outerStart.y}
    A ${outerRadius} ${outerRadius} 0 0 0 ${outerEnd.x} ${outerEnd.y}
    L ${innerEnd.x} ${innerEnd.y}
    A ${innerRadius} ${innerRadius} 0 0 1 ${innerStart.x} ${innerStart.y}
    Z
  `.trim();
}

/**
 * Format longitude as degree/sign string (e.g., "15°32' Aries")
 */
export function formatLongitude(longitude: number, includeMinutes: boolean = true): string {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const signIndex = Math.floor(longitude / 30);
  const degree = Math.floor(longitude % 30);
  const minutes = Math.floor((longitude % 1) * 60);

  if (includeMinutes) {
    return `${degree}°${minutes.toString().padStart(2, '0')}' ${signs[signIndex]}`;
  }
  return `${degree}° ${signs[signIndex]}`;
}

/**
 * Format longitude as short form (e.g., "15°ARI")
 */
export function formatLongitudeShort(longitude: number): string {
  const shorts = ['ARI', 'TAU', 'GEM', 'CAN', 'LEO', 'VIR',
                  'LIB', 'SCO', 'SAG', 'CAP', 'AQU', 'PIS'];
  const signIndex = Math.floor(longitude / 30);
  const degree = Math.floor(longitude % 30);
  return `${degree}°${shorts[signIndex]}`;
}

/**
 * Get the zodiac sign index (0-11) from longitude
 */
export function getSignIndex(longitude: number): number {
  return Math.floor(longitude / 30);
}

/**
 * Get the degree within the sign (0-30)
 */
export function getDegreeInSign(longitude: number): number {
  return longitude % 30;
}

/**
 * Calculate the angular distance between two longitudes (always 0-180)
 */
export function angularDistance(long1: number, long2: number): number {
  let diff = Math.abs(long1 - long2) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Adjust planet positions to avoid collisions
 * Returns planets with adjusted display longitudes
 */
export interface PlacedPlanet {
  key: string;
  longitude: number;
  displayLongitude: number;
}

/**
 * Normalize angle to 0-360 range
 */
function normalizeLongitude(lng: number): number {
  return ((lng % 360) + 360) % 360;
}

/**
 * Calculate the shortest angular distance between two longitudes (signed)
 */
function signedAngularDiff(from: number, to: number): number {
  let diff = normalizeLongitude(to) - normalizeLongitude(from);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

/**
 * Calculate circular mean (average angle that handles wrap-around)
 */
function circularMean(angles: number[]): number {
  if (angles.length === 0) return 0;

  // Convert to radians and compute mean of unit vectors
  let sumSin = 0;
  let sumCos = 0;
  for (const angle of angles) {
    const rad = angle * Math.PI / 180;
    sumSin += Math.sin(rad);
    sumCos += Math.cos(rad);
  }

  // Convert back to angle
  const meanRad = Math.atan2(sumSin / angles.length, sumCos / angles.length);
  return normalizeLongitude(meanRad * 180 / Math.PI);
}

export function adjustForCollisions(
  planets: PlacedPlanet[],
  minSeparation: number = 12
): PlacedPlanet[] {
  if (planets.length <= 1) return planets;

  // Maximum amount any planet can shift from its original position (in degrees)
  const maxShift = 8;

  // Create working copies with display positions
  const result = planets.map(p => ({
    ...p,
    displayLongitude: p.longitude,
  }));

  // Sort by longitude for processing
  result.sort((a, b) => a.longitude - b.longitude);

  // Simple approach: just nudge overlapping consecutive pairs
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < result.length; i++) {
      const curr = result[i];
      const nextIdx = (i + 1) % result.length;
      const next = result[nextIdx];

      let diff = signedAngularDiff(curr.displayLongitude, next.displayLongitude);
      if (diff < 0) diff += 360;

      if (diff > 0 && diff < minSeparation) {
        const nudge = (minSeparation - diff) / 2 + 0.3;

        // Calculate new positions
        let newCurrLng = normalizeLongitude(curr.displayLongitude - nudge);
        let newNextLng = normalizeLongitude(next.displayLongitude + nudge);

        // Clamp to maxShift from original position
        const currShift = Math.abs(signedAngularDiff(curr.longitude, newCurrLng));
        const nextShift = Math.abs(signedAngularDiff(next.longitude, newNextLng));

        if (currShift <= maxShift) {
          curr.displayLongitude = newCurrLng;
        }
        if (nextShift <= maxShift) {
          next.displayLongitude = newNextLng;
        }
      }
    }
  }

  return result;
}

/**
 * Calculate text anchor and rotation for zodiac symbols
 */
export function getTextAnchor(longitude: number): {
  anchor: 'start' | 'middle' | 'end';
  rotation: number;
} {
  // Normalize to 0-360
  const norm = ((longitude % 360) + 360) % 360;

  // For zodiac symbols, we want them readable (not upside down)
  // Top half of chart: 270-90 (right side going down, left side going up)
  const rotation = 270 - norm;

  return {
    anchor: 'middle',
    rotation: rotation,
  };
}

/**
 * Calculate midpoint longitude between two planets (for composite)
 */
export function midpoint(long1: number, long2: number): number {
  const diff = long2 - long1;
  let mid = long1 + diff / 2;

  // If the difference is > 180, we need to go the other way
  if (Math.abs(diff) > 180) {
    mid = (long1 + long2 + 360) / 2;
    if (mid >= 360) mid -= 360;
  }

  return mid;
}

/**
 * Spark calculation
 * Maps each degree within a sign to a zodiac sign based on parity:
 * - degree mod 12, 0-indexed: 0→Aries, 1→Taurus, ..., 6→Libra, 11→Pisces
 * - For ODD signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius): use the mapped sign directly
 * - For EVEN signs (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces): take the opposite sign (+6)
 *
 * Example: degree 6 in Aries (odd) → index 6 → Libra (7th sign)
 * Example: degree 6 in Scorpio (even) → index 6 → Libra → opposite → Aries
 */
export function calculateSpark(longitude: number): { sparkSign: string; sparkSymbol: string; sparkIndex: number } {
  const SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const SYMBOLS = [
    '\u2648\uFE0E', '\u2649\uFE0E', '\u264A\uFE0E', '\u264B\uFE0E',
    '\u264C\uFE0E', '\u264D\uFE0E', '\u264E\uFE0E', '\u264F\uFE0E',
    '\u2650\uFE0E', '\u2651\uFE0E', '\u2652\uFE0E', '\u2653\uFE0E',
  ];

  const signIndex = Math.floor(longitude / 30); // 0-11
  const degreeInSign = Math.floor(longitude % 30); // 0-29

  // Sign parity: Aries(index 0)=1st sign(odd), Taurus(index 1)=2nd sign(even), ...
  const isEvenSign = signIndex % 2 === 1;

  // Map degree to spark sign index (0-indexed: 0→Aries, 6→Libra, 11→Pisces)
  let sparkIdx = degreeInSign % 12;

  // For even signs, take the opposite sign
  if (isEvenSign) {
    sparkIdx = (sparkIdx + 6) % 12;
  }

  return {
    sparkSign: SIGNS[sparkIdx],
    sparkSymbol: SYMBOLS[sparkIdx],
    sparkIndex: sparkIdx,
  };
}

/**
 * Decan calculation using the triplicity (Chaldean) system
 * Each sign is divided into 3 decans (10° each)
 * Each decan is ruled by a sign of the same element
 *
 * Fire signs cycle: Aries → Leo → Sagittarius
 * Earth signs cycle: Taurus → Virgo → Capricorn
 * Air signs cycle: Gemini → Libra → Aquarius
 * Water signs cycle: Cancer → Scorpio → Pisces
 */

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Decan rulers for each sign (triplicity system)
// For each sign, lists the ruling sign of each decan [1st, 2nd, 3rd]
const DECAN_RULERS: Record<string, [string, string, string]> = {
  // Fire signs (Aries, Leo, Sagittarius)
  'Aries': ['Aries', 'Leo', 'Sagittarius'],
  'Leo': ['Leo', 'Sagittarius', 'Aries'],
  'Sagittarius': ['Sagittarius', 'Aries', 'Leo'],
  // Earth signs (Taurus, Virgo, Capricorn)
  'Taurus': ['Taurus', 'Virgo', 'Capricorn'],
  'Virgo': ['Virgo', 'Capricorn', 'Taurus'],
  'Capricorn': ['Capricorn', 'Taurus', 'Virgo'],
  // Air signs (Gemini, Libra, Aquarius)
  'Gemini': ['Gemini', 'Libra', 'Aquarius'],
  'Libra': ['Libra', 'Aquarius', 'Gemini'],
  'Aquarius': ['Aquarius', 'Gemini', 'Libra'],
  // Water signs (Cancer, Scorpio, Pisces)
  'Cancer': ['Cancer', 'Scorpio', 'Pisces'],
  'Scorpio': ['Scorpio', 'Pisces', 'Cancer'],
  'Pisces': ['Pisces', 'Cancer', 'Scorpio'],
};

/**
 * Calculate the decan number and ruling sign for a given longitude
 * @param longitude - zodiac longitude (0-360)
 * @returns Object with decan (1, 2, or 3) and decanSign (ruling sign name)
 */
export function calculateDecan(longitude: number): { decan: number; decanSign: string } {
  const signIndex = Math.floor(longitude / 30);
  const degreeInSign = longitude % 30;
  const signName = SIGN_NAMES[signIndex];

  // Determine which decan (1, 2, or 3)
  let decan: number;
  if (degreeInSign < 10) {
    decan = 1;
  } else if (degreeInSign < 20) {
    decan = 2;
  } else {
    decan = 3;
  }

  // Get the ruling sign for this decan
  const decanSign = DECAN_RULERS[signName]?.[decan - 1] || signName;

  return { decan, decanSign };
}
