export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;
export type Sign = typeof ZODIAC_SIGNS[number];

export const BODIES = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
  'NorthNode', 'SouthNode', 'Chiron', 'Ascendant', 'Midheaven',
] as const;
export type Body = typeof BODIES[number];

export const ASPECTS = [
  'conjunction', 'opposition', 'trine', 'square', 'sextile',
  'quincunx', 'semisextile', 'semisquare', 'sesquiquadrate',
] as const;
export type Aspect = typeof ASPECTS[number];

export const MOON_PHASES = ['new', 'full', 'first_quarter', 'last_quarter'] as const;
export type MoonPhase = typeof MOON_PHASES[number];

export type Direction = 'next' | 'prev';

export type Intent =
  | { kind: 'sign_ingress'; body: Body; sign: Sign; direction: Direction }
  | { kind: 'aspect'; transit: Body; aspect: Aspect; target: Body;
      scope: 'transit_to_natal' | 'sky'; direction: Direction }
  | { kind: 'house_ingress'; body: Body; house: number; direction: Direction }
  | { kind: 'retrograde'; body: Body;
      phase: 'station_retrograde' | 'station_direct' | 'period';
      direction: Direction }
  | { kind: 'moon_phase'; phase: MoonPhase; direction: Direction }
  | { kind: 'unsupported'; reason: string };

export interface ResolvedHit {
  date: string;            // ISO YYYY-MM-DD
  view: 'transit' | 'natal' | 'biwheel';
  highlightId?: string;    // e.g. event key for the timeline to scroll to
  summary: string;         // human-readable interpretation
  intent: Intent;
}

export interface EphemerisEntry {
  date: string;
  planets: { planet: string; longitude: number; sign: string; retrograde: boolean }[];
}
