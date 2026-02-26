/**
 * Interpretation Lookup System
 * O(1) Map-based lookups for all interpretation types
 */

import interpretationsData from '../data/interpretations.json';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BaseInterpretation {
  type: 'aspect' | 'signAspect' | 'signCompatibility' | 'stellium' | 'crossStellium' | 'houseOverlay' | 'signHouseOverlay';
  title: string;
  description: string;
  isPositive: boolean;
}

export interface AspectInterpretation extends BaseInterpretation {
  type: 'aspect';
  planet1: string;
  planet2: string;
  aspect: string;
}

export interface SignCompatibilityInterpretation extends BaseInterpretation {
  type: 'signCompatibility';
  sign1: string;
  sign2: string;
}

export interface StelliumInterpretation extends BaseInterpretation {
  type: 'stellium';
  sign: string;
}

export interface HouseOverlayInterpretation extends BaseInterpretation {
  type: 'houseOverlay';
  planet: string;
  house: number;
}

export interface SignAspectInterpretation extends BaseInterpretation {
  type: 'signAspect';
  planet1: string;
  sign1: string;
  planet2: string;
  sign2: string;
  aspect: string;
}

export interface CrossStelliumInterpretation extends BaseInterpretation {
  type: 'crossStellium';
  sign1: string;
  sign2: string;
}

export interface SignHouseOverlayInterpretation extends BaseInterpretation {
  type: 'signHouseOverlay';
  planet: string;
  sign: string;
  house: number;
}

export type Interpretation =
  | AspectInterpretation
  | SignAspectInterpretation
  | SignCompatibilityInterpretation
  | StelliumInterpretation
  | CrossStelliumInterpretation
  | HouseOverlayInterpretation
  | SignHouseOverlayInterpretation;

// ============================================================================
// INDEX MAPS (Lazy Initialization)
// ============================================================================

let aspectIndex: Map<string, AspectInterpretation> | null = null;
let signAspectIndex: Map<string, SignAspectInterpretation> | null = null;
let signCompatIndex: Map<string, SignCompatibilityInterpretation> | null = null;
let stelliumIndex: Map<string, StelliumInterpretation> | null = null;
let crossStelliumIndex: Map<string, CrossStelliumInterpretation> | null = null;
let houseOverlayIndex: Map<string, HouseOverlayInterpretation> | null = null;
let signHouseOverlayIndex: Map<string, SignHouseOverlayInterpretation> | null = null;
let initialized = false;

// ============================================================================
// KEY GENERATION (Order-Independent for Pairs)
// ============================================================================

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function aspectKey(planet1: string, planet2: string, aspect: string): string {
  const [p1, p2] = [normalize(planet1), normalize(planet2)].sort();
  return `${p1}|${p2}|${normalize(aspect)}`;
}

function signCompatKey(sign1: string, sign2: string): string {
  const [s1, s2] = [normalize(sign1), normalize(sign2)].sort();
  return `${s1}|${s2}`;
}

function stelliumKey(sign: string): string {
  return normalize(sign);
}

function houseOverlayKey(planet: string, house: number): string {
  return `${normalize(planet)}|${house}`;
}

function signAspectKey(planet1: string, sign1: string, planet2: string, sign2: string, aspect: string): string {
  // Sort by planet pair first, then include signs in sorted order
  const [p1, p2] = [normalize(planet1), normalize(planet2)].sort();
  const s1 = normalize(sign1);
  const s2 = normalize(sign2);
  // If planets are in different order, swap signs too
  if (normalize(planet1) === p1) {
    return `${p1}|${s1}|${p2}|${s2}|${normalize(aspect)}`;
  }
  return `${p1}|${s2}|${p2}|${s1}|${normalize(aspect)}`;
}

function crossStelliumKey(sign1: string, sign2: string): string {
  const [s1, s2] = [normalize(sign1), normalize(sign2)].sort();
  return `${s1}|${s2}`;
}

function signHouseOverlayKey(planet: string, sign: string, house: number): string {
  return `${normalize(planet)}|${normalize(sign)}|${house}`;
}

// ============================================================================
// INDEX BUILDER
// ============================================================================

function ensureIndexes(): void {
  if (initialized) return;

  aspectIndex = new Map();
  signAspectIndex = new Map();
  signCompatIndex = new Map();
  stelliumIndex = new Map();
  crossStelliumIndex = new Map();
  houseOverlayIndex = new Map();
  signHouseOverlayIndex = new Map();

  const data = interpretationsData as { interpretations: Interpretation[] };

  for (const interp of data.interpretations) {
    switch (interp.type) {
      case 'aspect': {
        const key = aspectKey(interp.planet1, interp.planet2, interp.aspect);
        aspectIndex.set(key, interp);
        break;
      }
      case 'signAspect': {
        const key = signAspectKey(interp.planet1, interp.sign1, interp.planet2, interp.sign2, interp.aspect);
        signAspectIndex.set(key, interp);
        break;
      }
      case 'signCompatibility': {
        const key = signCompatKey(interp.sign1, interp.sign2);
        signCompatIndex.set(key, interp);
        break;
      }
      case 'stellium': {
        const key = stelliumKey(interp.sign);
        stelliumIndex.set(key, interp);
        break;
      }
      case 'crossStellium': {
        const key = crossStelliumKey(interp.sign1, interp.sign2);
        crossStelliumIndex.set(key, interp);
        break;
      }
      case 'houseOverlay': {
        const key = houseOverlayKey(interp.planet, interp.house);
        houseOverlayIndex.set(key, interp);
        break;
      }
      case 'signHouseOverlay': {
        const key = signHouseOverlayKey(interp.planet, interp.sign, interp.house);
        signHouseOverlayIndex.set(key, interp);
        break;
      }
    }
  }

  initialized = true;
}

// ============================================================================
// LOOKUP FUNCTIONS (O(1))
// ============================================================================

/**
 * Get interpretation for a planet-planet aspect
 * @param planet1 First planet (e.g., 'sun', 'moon')
 * @param planet2 Second planet
 * @param aspect Aspect type (e.g., 'conjunction', 'trine')
 */
export function getAspectInterpretation(
  planet1: string,
  planet2: string,
  aspect: string
): AspectInterpretation | undefined {
  ensureIndexes();
  return aspectIndex!.get(aspectKey(planet1, planet2, aspect));
}

/**
 * Get interpretation for sign compatibility
 * @param sign1 First zodiac sign (e.g., 'Aries', 'Leo')
 * @param sign2 Second zodiac sign
 */
export function getSignCompatibility(
  sign1: string,
  sign2: string
): SignCompatibilityInterpretation | undefined {
  ensureIndexes();
  return signCompatIndex!.get(signCompatKey(sign1, sign2));
}

/**
 * Get interpretation for a stellium in a sign
 * @param sign Zodiac sign (e.g., 'Scorpio')
 */
export function getStelliumInterpretation(
  sign: string
): StelliumInterpretation | undefined {
  ensureIndexes();
  return stelliumIndex!.get(stelliumKey(sign));
}

/**
 * Get interpretation for a planet in partner's house
 * @param planet Planet name (e.g., 'venus')
 * @param house House number (1-12)
 */
export function getHouseOverlayInterpretation(
  planet: string,
  house: number
): HouseOverlayInterpretation | undefined {
  ensureIndexes();
  return houseOverlayIndex!.get(houseOverlayKey(planet, house));
}

/**
 * Get sign-specific interpretation for a planet-planet aspect
 * @param planet1 First planet (e.g., 'sun')
 * @param sign1 First planet's zodiac sign (e.g., 'Aries')
 * @param planet2 Second planet
 * @param sign2 Second planet's zodiac sign
 * @param aspect Aspect type (e.g., 'conjunction', 'trine')
 */
export function getSignAspectInterpretation(
  planet1: string,
  sign1: string,
  planet2: string,
  sign2: string,
  aspect: string
): SignAspectInterpretation | undefined {
  ensureIndexes();
  return signAspectIndex!.get(signAspectKey(planet1, sign1, planet2, sign2, aspect));
}

/**
 * Get interpretation for a cross stellium between two signs
 * @param sign1 First zodiac sign (e.g., 'Aries')
 * @param sign2 Second zodiac sign (e.g., 'Leo')
 */
export function getCrossStelliumInterpretation(
  sign1: string,
  sign2: string
): CrossStelliumInterpretation | undefined {
  ensureIndexes();
  return crossStelliumIndex!.get(crossStelliumKey(sign1, sign2));
}

/**
 * Get sign-specific interpretation for a planet in partner's house
 * @param planet Planet name (e.g., 'venus')
 * @param sign Planet's zodiac sign (e.g., 'Pisces')
 * @param house House number (1-12)
 */
export function getSignHouseOverlayInterpretation(
  planet: string,
  sign: string,
  house: number
): SignHouseOverlayInterpretation | undefined {
  ensureIndexes();
  return signHouseOverlayIndex!.get(signHouseOverlayKey(planet, sign, house));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all interpretations of a specific type
 */
export function getAllByType<T extends Interpretation>(
  type: T['type']
): T[] {
  ensureIndexes();
  const data = interpretationsData as { interpretations: Interpretation[] };
  return data.interpretations.filter((i) => i.type === type) as T[];
}

/**
 * Get total count of interpretations
 */
export function getInterpretationCounts(): {
  aspects: number;
  signAspects: number;
  signCompatibility: number;
  stelliums: number;
  crossStelliums: number;
  houseOverlays: number;
  signHouseOverlays: number;
  total: number;
} {
  ensureIndexes();
  return {
    aspects: aspectIndex!.size,
    signAspects: signAspectIndex!.size,
    signCompatibility: signCompatIndex!.size,
    stelliums: stelliumIndex!.size,
    crossStelliums: crossStelliumIndex!.size,
    houseOverlays: houseOverlayIndex!.size,
    signHouseOverlays: signHouseOverlayIndex!.size,
    total:
      aspectIndex!.size +
      signAspectIndex!.size +
      signCompatIndex!.size +
      stelliumIndex!.size +
      crossStelliumIndex!.size +
      houseOverlayIndex!.size +
      signHouseOverlayIndex!.size,
  };
}

/**
 * Force rebuild indexes (useful after data changes)
 */
export function rebuildIndexes(): void {
  initialized = false;
  ensureIndexes();
}
