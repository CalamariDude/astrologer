/**
 * Transit Timeline Detection
 * Client-side algorithm to detect transit events from ephemeris data
 */

import { detectAspect } from '@/components/biwheel/utils/aspectCalculations';
import type { DetectedAspect } from '@/components/biwheel/utils/aspectCalculations';
import type { NatalChart } from '@/components/biwheel/types';

export interface TransitEvent {
  transitPlanet: string;
  natalPlanet: string;
  aspectType: string;
  aspectSymbol: string;
  aspectNature: 'harmonious' | 'challenging' | 'neutral';
  aspectColor: string;
  ingressDate: string;   // First day in orb
  exactDate: string;     // Day of minimum orb
  egressDate: string;    // Last day in orb
  exactOrb: number;
  isActive: boolean;     // Currently within orb
}

interface EphemerisEntry {
  date: string;
  planets: { planet: string; longitude: number; sign: string; retrograde: boolean }[];
}

const TRANSIT_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const NATAL_PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'ascendant', 'midheaven'];

/**
 * Detect all transit events from ephemeris data against a natal chart
 */
export function detectTransitEvents(
  entries: EphemerisEntry[],
  natalChart: NatalChart
): TransitEvent[] {
  const events: TransitEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Track ongoing aspects: key = "transitPlanet-natalPlanet-aspectType"
  const ongoing = new Map<string, {
    transitPlanet: string;
    natalPlanet: string;
    aspect: DetectedAspect;
    ingressDate: string;
    exactDate: string;
    exactOrb: number;
  }>();

  for (const entry of entries) {
    // For each transit planet x natal planet combination
    for (const transitPlanetData of entry.planets) {
      if (!TRANSIT_PLANETS.includes(transitPlanetData.planet)) continue;

      for (const natalPlanetKey of NATAL_PLANETS) {
        const natalData = natalChart.planets[natalPlanetKey];
        if (!natalData || natalData.longitude === undefined) continue;

        const aspect = detectAspect(
          transitPlanetData.longitude,
          natalData.longitude,
          undefined,
          transitPlanetData.planet.toLowerCase(),
          natalPlanetKey
        );

        const key = `${transitPlanetData.planet}-${natalPlanetKey}`;

        if (aspect) {
          const aspectKey = `${key}-${aspect.type}`;
          const existing = ongoing.get(aspectKey);

          if (existing) {
            // Update exact date if orb is tighter
            if (aspect.exactOrb < existing.exactOrb) {
              existing.exactDate = entry.date;
              existing.exactOrb = aspect.exactOrb;
            }
          } else {
            // Start tracking new aspect
            ongoing.set(aspectKey, {
              transitPlanet: transitPlanetData.planet,
              natalPlanet: natalPlanetKey,
              aspect,
              ingressDate: entry.date,
              exactDate: entry.date,
              exactOrb: aspect.exactOrb,
            });
          }
        } else {
          // Check if any previously tracked aspects for this planet pair have ended
          for (const [aspectKey, data] of ongoing) {
            if (aspectKey.startsWith(key + '-')) {
              // Aspect has left orb — finalize event
              events.push({
                transitPlanet: data.transitPlanet,
                natalPlanet: data.natalPlanet,
                aspectType: data.aspect.type,
                aspectSymbol: data.aspect.symbol,
                aspectNature: data.aspect.nature,
                aspectColor: data.aspect.color,
                ingressDate: data.ingressDate,
                exactDate: data.exactDate,
                egressDate: entry.date,
                exactOrb: data.exactOrb,
                isActive: today >= data.ingressDate && today <= entry.date,
              });
              ongoing.delete(aspectKey);
            }
          }
        }
      }
    }
  }

  // Finalize any still-ongoing aspects
  const lastDate = entries.length > 0 ? entries[entries.length - 1].date : today;
  for (const [, data] of ongoing) {
    events.push({
      transitPlanet: data.transitPlanet,
      natalPlanet: data.natalPlanet,
      aspectType: data.aspect.type,
      aspectSymbol: data.aspect.symbol,
      aspectNature: data.aspect.nature,
      aspectColor: data.aspect.color,
      ingressDate: data.ingressDate,
      exactDate: data.exactDate,
      egressDate: lastDate,
      exactOrb: data.exactOrb,
      isActive: today >= data.ingressDate && today <= lastDate,
    });
  }

  // Sort by exact date
  return events.sort((a, b) => a.exactDate.localeCompare(b.exactDate));
}
