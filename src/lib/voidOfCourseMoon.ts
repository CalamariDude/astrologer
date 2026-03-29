/**
 * Void of Course Moon Detection
 * Detects periods when the Moon makes no major aspects before leaving its sign.
 */

export interface VOCPeriod {
  voidStart: string;    // ISO date-time string
  voidEnd: string;      // ISO date-time string
  moonSign: string;
  nextSign: string;
  lastAspect: string;   // e.g. "trine"
  lastAspectPlanet: string; // e.g. "Jupiter"
  durationMinutes: number;
}

interface EphemerisEntry {
  date: string;
  planets: { planet: string; longitude: number; sign: string; retrograde: boolean }[];
}

const MAJOR_PLANETS = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
const MODERN_PLANETS = ['Uranus', 'Neptune', 'Pluto'];

// Ptolemaic aspects and their angles
const PTOLEMAIC_ASPECTS = [
  { name: 'conjunction', angle: 0, orb: 8 },
  { name: 'sextile', angle: 60, orb: 4 },
  { name: 'square', angle: 90, orb: 6 },
  { name: 'trine', angle: 120, orb: 6 },
  { name: 'opposition', angle: 180, orb: 8 },
];

function getSign(longitude: number): string {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  return signs[Math.floor(((longitude % 360) + 360) % 360 / 30)];
}

function angleDiff(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

function checkAspect(moonLong: number, planetLong: number): { name: string; orb: number } | null {
  for (const aspect of PTOLEMAIC_ASPECTS) {
    const diff = angleDiff(moonLong, planetLong);
    const orb = Math.abs(diff - aspect.angle);
    if (orb <= aspect.orb) {
      return { name: aspect.name, orb };
    }
  }
  return null;
}

/**
 * Detect VOC Moon periods from ephemeris data.
 * @param entries - Ephemeris data at regular intervals (2-4 hour intervals recommended)
 * @param includeModern - Include Uranus, Neptune, Pluto in aspect checks
 */
export function detectVOCPeriods(
  entries: EphemerisEntry[],
  includeModern: boolean = false
): VOCPeriod[] {
  const periods: VOCPeriod[] = [];
  const targetPlanets = [...MAJOR_PLANETS, ...(includeModern ? MODERN_PLANETS : [])];

  // Track state
  let lastAspectInfo: { date: string; aspect: string; planet: string } | null = null;
  let previousMoonSign: string | null = null;
  let vocStarted = false;
  let vocStartDate: string | null = null;
  let vocMoonSign: string | null = null;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const moonData = entry.planets.find(p => p.planet === 'Moon');
    if (!moonData) continue;

    const currentSign = moonData.sign || getSign(moonData.longitude);

    // Check if Moon has any aspects in this interval
    let hasAspect = false;
    let currentAspect: { name: string; planet: string } | null = null;

    for (const planet of entry.planets) {
      if (planet.planet === 'Moon') continue;
      if (!targetPlanets.includes(planet.planet)) continue;

      const aspect = checkAspect(moonData.longitude, planet.longitude);
      if (aspect) {
        hasAspect = true;
        currentAspect = { name: aspect.name, planet: planet.planet };
        break;
      }
    }

    if (hasAspect && currentAspect) {
      lastAspectInfo = { date: entry.date, aspect: currentAspect.name, planet: currentAspect.planet };

      // If we were in a VOC period, this new aspect ends it retroactively
      // (but only if we're still in the same sign)
      if (vocStarted && currentSign === vocMoonSign) {
        vocStarted = false;
        vocStartDate = null;
        vocMoonSign = null;
      }
    }

    // Detect sign change
    if (previousMoonSign && currentSign !== previousMoonSign) {
      // Moon changed signs
      if (vocStarted && vocStartDate && vocMoonSign && lastAspectInfo) {
        // End the VOC period
        const startTime = new Date(vocStartDate).getTime();
        const endTime = new Date(entry.date).getTime();
        const durationMinutes = Math.round((endTime - startTime) / 60000);

        if (durationMinutes > 5) { // Filter out very short periods
          periods.push({
            voidStart: vocStartDate,
            voidEnd: entry.date,
            moonSign: vocMoonSign,
            nextSign: currentSign,
            lastAspect: lastAspectInfo.aspect,
            lastAspectPlanet: lastAspectInfo.planet,
            durationMinutes,
          });
        }
      }
      vocStarted = false;
      vocStartDate = null;
      vocMoonSign = null;
      lastAspectInfo = null;
    }

    // If Moon has no aspect and we haven't started VOC tracking yet
    if (!hasAspect && !vocStarted && lastAspectInfo && currentSign === (previousMoonSign || currentSign)) {
      vocStarted = true;
      vocStartDate = lastAspectInfo.date;
      vocMoonSign = currentSign;
    }

    previousMoonSign = currentSign;
  }

  return periods;
}

/** Format a VOC duration in human-readable form */
export function formatVOCDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}
