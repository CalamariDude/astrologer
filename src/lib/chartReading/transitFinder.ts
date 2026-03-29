/**
 * Transit Finder — Pure Math Transit Search Engine
 * Computes when specific transit aspects will form in the future
 * using known average daily motions. No API calls required.
 */

import type { NatalChart } from './types';

// ─── Constants ──────────────────────────────────────────────────

/** Average daily motion in degrees per day */
export const AVG_DAILY_MOTION: Record<string, number> = {
  sun: 0.986, moon: 13.176, mercury: 1.383, venus: 1.2, mars: 0.524,
  jupiter: 0.083, saturn: 0.034, uranus: 0.012, neptune: 0.006, pluto: 0.004,
  northnode: 0.053, chiron: 0.02,
};

/** Major aspect angles */
const MAJOR_ASPECTS: { name: string; angle: number }[] = [
  { name: 'Conjunction', angle: 0 },
  { name: 'Opposition', angle: 180 },
  { name: 'Trine', angle: 120 },
  { name: 'Square', angle: 90 },
  { name: 'Sextile', angle: 60 },
];

/** Zodiac signs by longitude */
const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function longitudeToSign(lng: number): string {
  return SIGNS[Math.floor(((lng % 360) + 360) % 360 / 30)];
}

/** Which transit planets matter for which topic */
const TOPIC_TRANSIT_PLANETS: Record<string, string[]> = {
  love: ['venus', 'mars', 'jupiter', 'saturn', 'pluto'],
  career: ['jupiter', 'saturn', 'mars', 'sun', 'pluto'],
  health: ['mars', 'saturn', 'sun', 'chiron'],
  family: ['moon', 'saturn', 'jupiter', 'venus'],
  spirituality: ['jupiter', 'saturn', 'neptune', 'pluto', 'chiron'],
  general: ['jupiter', 'saturn', 'mars', 'venus', 'pluto'],
};

/** Which natal points matter for which topic */
const TOPIC_NATAL_TARGETS: Record<string, string[]> = {
  love: ['venus', 'mars', 'moon', 'sun', 'jupiter', 'pluto'],
  career: ['sun', 'saturn', 'jupiter', 'mars', 'mercury'],
  health: ['sun', 'moon', 'mars', 'saturn', 'chiron'],
  family: ['moon', 'saturn', 'sun', 'venus', 'jupiter'],
  spirituality: ['neptune', 'jupiter', 'pluto', 'moon', 'chiron', 'northnode'],
  general: ['sun', 'moon', 'venus', 'mars', 'jupiter', 'saturn'],
};

// ─── Types ──────────────────────────────────────────────────────

export interface FutureTransitEvent {
  transit_planet: string;
  natal_planet: string;
  aspect_name: string;
  aspect_angle: number;
  estimated_date: string;           // YYYY-MM-DD
  estimated_days_from_now: number;
  transit_sign: string;
  confidence: 'high' | 'medium' | 'low';
  retrograde_risk: boolean;
  significance: number;             // 0-10 score for sorting
}

export interface FutureTransitTimeline {
  search_date: string;
  search_horizon_months: number;
  events: FutureTransitEvent[];
  summary: string;                  // compact text for the AI prompt
}

// ─── Core Algorithm ─────────────────────────────────────────────

/**
 * Find when a transit planet will next form a specific aspect to a natal degree.
 * Uses linear projection from current position + average daily motion.
 */
function findNextAspectDate(
  transitCurrentLong: number,
  transitDailyMotion: number,
  transitRetrograde: boolean,
  natalLong: number,
  aspectAngle: number,
  maxDays: number,
): { days: number; targetLong: number } | null {
  // Two possible target longitudes for each aspect
  const target1 = (natalLong + aspectAngle) % 360;
  const target2 = (natalLong - aspectAngle + 360) % 360;
  const targets = aspectAngle === 0 || aspectAngle === 180 ? [target1] : [target1, target2];

  const direction = transitRetrograde ? -1 : 1;
  let bestDays = Infinity;
  let bestTarget = 0;

  for (const target of targets) {
    // Angular distance in the direction of motion
    let angularDist: number;
    if (direction > 0) {
      angularDist = ((target - transitCurrentLong) % 360 + 360) % 360;
    } else {
      angularDist = ((transitCurrentLong - target) % 360 + 360) % 360;
    }

    // Skip if effectively already at this aspect (within 2°)
    if (angularDist < 2) {
      angularDist += 360; // next pass
    }

    const days = angularDist / transitDailyMotion;
    if (days < bestDays && days <= maxDays) {
      bestDays = days;
      bestTarget = target;
    }
  }

  if (bestDays === Infinity || bestDays > maxDays) return null;

  return { days: Math.round(bestDays), targetLong: bestTarget };
}

/**
 * Score how significant a transit event is (for sorting/filtering).
 */
function scoreTransit(
  transitPlanet: string,
  natalPlanet: string,
  aspectName: string,
  topicKeys: string[],
): number {
  let score = 0;

  // Slow planets = more significant
  const speed = AVG_DAILY_MOTION[transitPlanet] || 1;
  if (speed < 0.01) score += 4;       // Pluto/Neptune
  else if (speed < 0.05) score += 3;  // Uranus/Saturn
  else if (speed < 0.1) score += 2;   // Jupiter
  else if (speed < 0.6) score += 1;   // Mars

  // Hard aspects = more impactful
  if (aspectName === 'Conjunction') score += 3;
  else if (aspectName === 'Opposition' || aspectName === 'Square') score += 2;
  else if (aspectName === 'Trine' || aspectName === 'Sextile') score += 1;

  // Bonus if transit planet is relevant to the topic
  for (const topic of topicKeys) {
    if (TOPIC_TRANSIT_PLANETS[topic]?.includes(transitPlanet)) score += 1;
    if (TOPIC_NATAL_TARGETS[topic]?.includes(natalPlanet)) score += 1;
  }

  // Personal planets receiving transits = more felt
  if (['sun', 'moon', 'mercury', 'venus', 'mars'].includes(natalPlanet)) score += 1;

  return score;
}

/**
 * Determine confidence based on planet speed and retrograde status.
 * Slow planets are very predictable; fast planets less so.
 */
function getConfidence(transitPlanet: string, isRetrograde: boolean): 'high' | 'medium' | 'low' {
  const speed = AVG_DAILY_MOTION[transitPlanet] || 1;
  if (isRetrograde) return 'low';
  if (speed < 0.05) return 'high';   // Saturn, Uranus, Neptune, Pluto
  if (speed < 0.2) return 'medium';  // Jupiter, Chiron
  return 'low';                       // Mars, Venus, Mercury, etc.
}

// ─── Main Search Function ───────────────────────────────────────

/**
 * Build a future transit timeline for a natal chart.
 *
 * @param chart — natal chart with planet positions
 * @param currentTransitPositions — today's transit planet positions (from /transit API)
 * @param topicKeys — detected question categories (e.g., ['love', 'career'])
 * @param searchMonths — how far ahead to search (default 12)
 * @returns FutureTransitTimeline with sorted, scored events
 */
export function buildFutureTimeline(
  chart: NatalChart,
  currentTransitPositions: Record<string, { longitude: number; retrograde: boolean }>,
  topicKeys: string[],
  searchMonths: number = 12,
): FutureTransitTimeline {
  const maxDays = searchMonths * 30;
  const now = new Date();
  const events: FutureTransitEvent[] = [];

  // Determine which transit planets and natal targets to search
  const transitPlanets = new Set<string>();
  const natalTargets = new Set<string>();

  for (const topic of topicKeys) {
    for (const p of (TOPIC_TRANSIT_PLANETS[topic] || TOPIC_TRANSIT_PLANETS.general)) {
      transitPlanets.add(p);
    }
    for (const p of (TOPIC_NATAL_TARGETS[topic] || TOPIC_NATAL_TARGETS.general)) {
      natalTargets.add(p);
    }
  }

  // Also always include the heavy hitters
  ['jupiter', 'saturn', 'pluto'].forEach(p => transitPlanets.add(p));

  for (const transitKey of transitPlanets) {
    const transitPos = currentTransitPositions[transitKey];
    if (!transitPos) continue;

    const dailyMotion = AVG_DAILY_MOTION[transitKey];
    if (!dailyMotion) continue;

    for (const natalKey of natalTargets) {
      const natalPlanet = chart.planets[natalKey];
      if (!natalPlanet) continue;

      // Skip self-transits (Sun transit to natal Sun = solar return, handled elsewhere)
      if (transitKey === natalKey && ['sun', 'moon'].includes(transitKey)) continue;

      for (const aspect of MAJOR_ASPECTS) {
        const result = findNextAspectDate(
          transitPos.longitude,
          dailyMotion,
          transitPos.retrograde,
          natalPlanet.longitude,
          aspect.angle,
          maxDays,
        );

        if (!result) continue;

        const estimatedDate = new Date(now);
        estimatedDate.setDate(estimatedDate.getDate() + result.days);

        const significance = scoreTransit(transitKey, natalKey, aspect.name, topicKeys);

        // Only include events with decent significance (skip noise)
        if (significance < 3) continue;

        events.push({
          transit_planet: transitKey,
          natal_planet: natalKey,
          aspect_name: aspect.name,
          aspect_angle: aspect.angle,
          estimated_date: estimatedDate.toISOString().split('T')[0],
          estimated_days_from_now: result.days,
          transit_sign: longitudeToSign(result.targetLong),
          confidence: getConfidence(transitKey, transitPos.retrograde),
          retrograde_risk: transitPos.retrograde || ['mercury', 'venus', 'mars'].includes(transitKey),
          significance,
        });
      }
    }
  }

  // Sort by significance (desc), then by date (asc)
  events.sort((a, b) => b.significance - a.significance || a.estimated_days_from_now - b.estimated_days_from_now);

  // Keep top 15 events to avoid overwhelming the prompt
  const topEvents = events.slice(0, 15);

  const summary = formatTimelineForAI(topEvents, searchMonths);

  return {
    search_date: now.toISOString().split('T')[0],
    search_horizon_months: searchMonths,
    events: topEvents,
    summary,
  };
}

// ─── Formatter ──────────────────────────────────────────────────

function formatTimelineForAI(events: FutureTransitEvent[], horizonMonths: number): string {
  if (events.length === 0) return 'No significant upcoming transits found in the search window.';

  const lines = [
    `UPCOMING TRANSIT TIMELINE (next ${horizonMonths} months):`,
    '',
  ];

  for (const e of events) {
    const months = Math.round(e.estimated_days_from_now / 30 * 10) / 10;
    const retroNote = e.retrograde_risk ? ' [retrograde risk — may repeat]' : '';
    const confNote = e.confidence === 'high' ? '' : e.confidence === 'medium' ? ' ~approx' : ' ~rough est.';
    lines.push(
      `• Transit ${e.transit_planet.toUpperCase()} ${e.aspect_name} natal ${e.natal_planet.toUpperCase()} — ` +
      `est. ${e.estimated_date} (~${months} months)${confNote}${retroNote} [significance: ${e.significance}/10]`
    );
  }

  return lines.join('\n');
}
