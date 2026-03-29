/**
 * Rectification Scoring Algorithm
 * Scores candidate birth times based on life events and astrological indicators
 */

import { detectAspect } from '@/components/biwheel/utils/aspectCalculations';
import type { NatalChart } from '@/components/biwheel/types';

export type EventCategory = 'marriage' | 'career' | 'accident' | 'child' | 'relocation' | 'health' | 'education' | 'death_family' | 'divorce' | 'spiritual' | 'legal' | 'financial' | 'travel_long';

export interface LifeEvent {
  date: string;       // "2015-06-15"
  category: EventCategory;
  description: string;
}

export interface CandidateTime {
  time: string;       // "14:30"
  chart: NatalChart;
  score: number;
  eventScores: { event: LifeEvent; score: number; indicators: string[] }[];
  ascendantSign: string;
}

// Event category indicators: what planets/houses should be active during this type of event
const EVENT_INDICATORS: Record<EventCategory, {
  planets: string[];       // Key natal planets for this category
  houses: number[];        // Key natal houses
  transitPlanets: string[]; // Transit planets that trigger this category
}> = {
  marriage: {
    planets: ['venus', 'jupiter', 'sun', 'moon'],
    houses: [7, 5, 1],
    transitPlanets: ['jupiter', 'venus', 'saturn'],
  },
  career: {
    planets: ['saturn', 'jupiter', 'sun', 'mars'],
    houses: [10, 6, 2],
    transitPlanets: ['saturn', 'jupiter', 'pluto'],
  },
  accident: {
    planets: ['mars', 'uranus', 'pluto'],
    houses: [1, 6, 8, 12],
    transitPlanets: ['mars', 'uranus', 'pluto'],
  },
  child: {
    planets: ['moon', 'jupiter', 'venus'],
    houses: [5, 4, 1],
    transitPlanets: ['jupiter', 'moon'],
  },
  relocation: {
    planets: ['uranus', 'jupiter', 'moon'],
    houses: [4, 9, 3],
    transitPlanets: ['uranus', 'jupiter', 'saturn'],
  },
  health: {
    planets: ['mars', 'saturn', 'neptune'],
    houses: [6, 8, 12, 1],
    transitPlanets: ['saturn', 'neptune', 'pluto'],
  },
  education: {
    planets: ['mercury', 'jupiter', 'saturn'],
    houses: [9, 3, 10],
    transitPlanets: ['jupiter', 'saturn'],
  },
  death_family: {
    planets: ['saturn', 'pluto', 'mars'],
    houses: [4, 8, 12],
    transitPlanets: ['saturn', 'pluto'],
  },
  divorce: {
    planets: ['saturn', 'uranus', 'pluto', 'mars'],
    houses: [7, 8, 1],
    transitPlanets: ['saturn', 'uranus', 'pluto'],
  },
  spiritual: {
    planets: ['neptune', 'jupiter', 'pluto'],
    houses: [9, 12, 8],
    transitPlanets: ['neptune', 'jupiter', 'pluto'],
  },
  legal: {
    planets: ['saturn', 'jupiter', 'mars'],
    houses: [9, 7, 10],
    transitPlanets: ['saturn', 'jupiter'],
  },
  financial: {
    planets: ['venus', 'jupiter', 'pluto'],
    houses: [2, 8, 10],
    transitPlanets: ['jupiter', 'pluto', 'saturn'],
  },
  travel_long: {
    planets: ['jupiter', 'uranus', 'moon'],
    houses: [9, 3, 4],
    transitPlanets: ['jupiter', 'uranus'],
  },
};

/**
 * Score a candidate chart for a single life event
 * Higher score = better match between chart and event
 */
export function scoreEventForChart(
  chart: NatalChart,
  event: LifeEvent,
  transitChart?: NatalChart
): { score: number; indicators: string[] } {
  let score = 0;
  const indicators: string[] = [];
  const config = EVENT_INDICATORS[event.category];
  if (!config) return { score: 0, indicators: [] };

  // Check if relevant planets are in relevant houses
  for (const planetKey of config.planets) {
    const planet = chart.planets[planetKey];
    if (!planet) continue;

    if (planet.house && config.houses.includes(planet.house)) {
      score += 3;
      indicators.push(`${planetKey} in House ${planet.house}`);
    }
  }

  // Check angular planets (houses 1, 4, 7, 10) - more impactful chart
  for (const planetKey of config.planets) {
    const planet = chart.planets[planetKey];
    if (planet?.house && [1, 4, 7, 10].includes(planet.house)) {
      score += 1;
      indicators.push(`${planetKey} angular (H${planet.house})`);
    }
  }

  // If transit chart provided, check transits to natal
  if (transitChart) {
    for (const transitPlanetKey of config.transitPlanets) {
      const transitPlanet = transitChart.planets[transitPlanetKey];
      if (!transitPlanet) continue;

      for (const natalPlanetKey of config.planets) {
        const natalPlanet = chart.planets[natalPlanetKey];
        if (!natalPlanet) continue;

        const aspect = detectAspect(transitPlanet.longitude, natalPlanet.longitude);
        if (aspect && aspect.major) {
          score += 2;
          indicators.push(`T.${transitPlanetKey} ${aspect.name} N.${natalPlanetKey}`);
        }
      }

      // Check transits to house cusps (ASC, MC)
      if (chart.angles) {
        const ascAspect = detectAspect(transitPlanet.longitude, chart.angles.ascendant);
        if (ascAspect && ascAspect.major) {
          score += 2;
          indicators.push(`T.${transitPlanetKey} ${ascAspect.name} ASC`);
        }
        const mcAspect = detectAspect(transitPlanet.longitude, chart.angles.midheaven);
        if (mcAspect && mcAspect.major) {
          score += 2;
          indicators.push(`T.${transitPlanetKey} ${mcAspect.name} MC`);
        }
      }
    }
  }

  return { score, indicators };
}

/**
 * Score a full candidate time across all events
 */
export function scoreCandidateTime(
  chart: NatalChart,
  events: LifeEvent[],
  transitCharts?: Map<string, NatalChart> // event date -> transit chart
): CandidateTime {
  let totalScore = 0;
  const eventScores: CandidateTime['eventScores'] = [];

  for (const event of events) {
    const transitChart = transitCharts?.get(event.date);
    const { score, indicators } = scoreEventForChart(chart, event, transitChart);
    totalScore += score;
    eventScores.push({ event, score, indicators });
  }

  // Determine ascendant sign
  const ascLong = chart.angles?.ascendant ?? chart.planets.ascendant?.longitude ?? 0;
  const signIndex = Math.floor((ascLong % 360) / 30);
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  return {
    time: '', // Filled by caller
    chart,
    score: totalScore,
    eventScores,
    ascendantSign: signs[signIndex] || 'Unknown',
  };
}

export const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'marriage', label: 'Marriage / Significant Relationship' },
  { value: 'career', label: 'Career Change / Major Achievement' },
  { value: 'child', label: 'Birth of Child' },
  { value: 'relocation', label: 'Relocation / Major Move' },
  { value: 'health', label: 'Health Event / Surgery' },
  { value: 'accident', label: 'Accident / Sudden Event' },
  { value: 'education', label: 'Education / Graduation' },
  { value: 'death_family', label: 'Death in Family' },
  { value: 'divorce', label: 'Divorce / Major Breakup' },
  { value: 'spiritual', label: 'Spiritual Awakening / Crisis' },
  { value: 'legal', label: 'Legal Matter / Court Case' },
  { value: 'financial', label: 'Major Financial Event' },
  { value: 'travel_long', label: 'Long-Distance Travel / Immigration' },
];
