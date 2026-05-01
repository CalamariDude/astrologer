import type { Intent, Body, Sign, Aspect, MoonPhase, Direction } from './types';
import { ZODIAC_SIGNS, BODIES, ASPECTS } from './types';

const BODY_ALIASES: Record<string, Body> = {
  sun: 'Sun', moon: 'Moon', luna: 'Moon',
  mercury: 'Mercury', merc: 'Mercury',
  venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', jup: 'Jupiter',
  saturn: 'Saturn', sat: 'Saturn',
  uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
  chiron: 'Chiron',
  ascendant: 'Ascendant', asc: 'Ascendant', rising: 'Ascendant',
  midheaven: 'Midheaven', mc: 'Midheaven',
  'north node': 'NorthNode', northnode: 'NorthNode', 'true node': 'NorthNode',
  'south node': 'SouthNode', southnode: 'SouthNode',
};

const SIGN_ALIASES: Record<string, Sign> = Object.fromEntries(
  ZODIAC_SIGNS.map(s => [s.toLowerCase(), s])
);

const ASPECT_ALIASES: Record<string, Aspect> = {
  conjunct: 'conjunction', conjunction: 'conjunction', conj: 'conjunction',
  opposition: 'opposition', oppose: 'opposition', opposite: 'opposition', opp: 'opposition',
  trine: 'trine', tri: 'trine',
  square: 'square', sq: 'square',
  sextile: 'sextile', sex: 'sextile',
  quincunx: 'quincunx', inconjunct: 'quincunx',
  semisextile: 'semisextile',
  semisquare: 'semisquare',
  sesquiquadrate: 'sesquiquadrate', sesquisquare: 'sesquiquadrate',
};

const MOON_PHASE_ALIASES: Record<string, MoonPhase> = {
  'new moon': 'new',
  'full moon': 'full',
  'first quarter': 'first_quarter', 'first quarter moon': 'first_quarter',
  'last quarter': 'last_quarter', 'last quarter moon': 'last_quarter',
  'third quarter': 'last_quarter', 'third quarter moon': 'last_quarter',
};

function normalize(q: string): string {
  return q.toLowerCase().replace(/[?.!,]+/g, '').replace(/\s+/g, ' ').trim();
}

function detectDirection(q: string): Direction {
  if (/\b(last|previous|prev|past)\b/.test(q)) return 'prev';
  return 'next';
}

function findBody(q: string): { body: Body; rest: string } | null {
  const sorted = Object.keys(BODY_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    const re = new RegExp(`\\b${alias}\\b`);
    if (re.test(q)) {
      return { body: BODY_ALIASES[alias], rest: q.replace(re, ' ').replace(/\s+/g, ' ').trim() };
    }
  }
  return null;
}

function findSign(q: string): Sign | null {
  for (const sign of ZODIAC_SIGNS) {
    if (new RegExp(`\\b${sign.toLowerCase()}\\b`).test(q)) return sign;
  }
  return null;
}

function findAspect(q: string): Aspect | null {
  const sorted = Object.keys(ASPECT_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    if (new RegExp(`\\b${alias}\\b`).test(q)) return ASPECT_ALIASES[alias];
  }
  return null;
}

function findMoonPhase(q: string): MoonPhase | null {
  const sorted = Object.keys(MOON_PHASE_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    if (q.includes(alias)) return MOON_PHASE_ALIASES[alias];
  }
  return null;
}

function findHouse(q: string): number | null {
  const m = q.match(/\b(?:in|enter|entering)\s+(?:my\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+house\b/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 12 ? n : null;
}

/**
 * Rule-based parser. Returns null when no pattern matches — caller should
 * then fall through to the LLM parser.
 */
export function parseIntent(rawQuery: string): Intent | null {
  const q = normalize(rawQuery);
  if (!q) return null;
  const direction = detectDirection(q);

  // Moon phase: "next full moon", "when is the new moon"
  const moonPhase = findMoonPhase(q);
  if (moonPhase) {
    return { kind: 'moon_phase', phase: moonPhase, direction };
  }

  // Retrograde: "mercury retrograde", "mercury go retrograde", "mars rx"
  if (/\b(retrograde|rx|stations? direct|stations? retrograde|station)\b/.test(q)) {
    const bodyHit = findBody(q);
    if (bodyHit) {
      const phase: 'station_direct' | 'station_retrograde' | 'period' =
        /direct/.test(q) ? 'station_direct'
        : /station/.test(q) ? 'station_retrograde'
        : 'period';
      return { kind: 'retrograde', body: bodyHit.body, phase, direction };
    }
  }

  // House ingress: "when does saturn enter my 7th house"
  const house = findHouse(q);
  if (house !== null) {
    const bodyHit = findBody(q);
    if (bodyHit) {
      return { kind: 'house_ingress', body: bodyHit.body, house, direction };
    }
  }

  // Aspect: "saturn square sun", "venus trine my moon"
  const aspect = findAspect(q);
  if (aspect) {
    const firstBody = findBody(q);
    if (firstBody) {
      const secondBody = findBody(firstBody.rest);
      if (secondBody) {
        const scope: 'transit_to_natal' | 'sky' =
          /\b(my|natal)\b/.test(q) ? 'transit_to_natal' : 'sky';
        return {
          kind: 'aspect',
          transit: firstBody.body,
          aspect,
          target: secondBody.body,
          scope,
          direction,
        };
      }
    }
  }

  // Sign ingress: "moon in scorpio", "when does mars enter aries"
  const sign = findSign(q);
  if (sign) {
    const bodyHit = findBody(q);
    if (bodyHit) {
      return { kind: 'sign_ingress', body: bodyHit.body, sign, direction };
    }
  }

  return null;
}

export const __test__ = { normalize, findBody, findSign, findAspect, findMoonPhase, findHouse };
