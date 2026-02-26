/**
 * Local Synastry V4.0 Scorer - Client-side implementation
 *
 * Based on V3-H but with DYNAMIC weight adjustments loaded from localStorage.
 * All weights can be controlled via the Admin Weights panel.
 *
 * V4.0: "Admin-Tunable + RFE Celebrity-Validated" Algorithm
 * - Same base algorithm as V3-H (68.9% RFE accuracy)
 * - All weights loaded from adjustmentService for real-time tuning
 * - Supports -1 to completely remove any factor
 */

import {
  loadAdjustments,
  generateContributionKey,
  type AdjustmentMap,
} from './adjustmentService';
import { computeDurationScore } from './durationClassifier';

// ============================================================================
// TYPES
// ============================================================================

export interface NatalChart {
  planets: Record<string, {
    longitude: number;
    sign?: string;
    house?: number;
    retrograde?: boolean;
  }>;
  houses?: Record<string, number> | number[];
  angles?: {
    ascendant: number;
    midheaven: number;
    descendant?: number;
    ic?: number;
  };
  birthYear?: number; // Used to skip similar-birthday penalty when years differ
}

interface CompositeChart {
  planets: Record<string, { longitude: number; sign: string }>;
  angles?: {
    ascendant: number;
    midheaven: number;
  };
}

type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'quincunx' | 'copresence';

type ZodiacSign = 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo' |
  'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export interface SynastryBreakdownV4 {
  emotional: number;
  love: number;
  commitment: number;
  chemistry: number;
  family: number;
  communication: number;
  growth: number;
  values: number;
  prosperity: number;
}

export interface ElementMatchEntry {
  name: string;
  weight: number;
}

export interface ElementBalance {
  personA: { fire: number; earth: number; air: number; water: number };
  personB: { fire: number; earth: number; air: number; water: number };
  compatibility: number;
  matchingElements: ElementMatchEntry[];
  dominantA: string;
  dominantB: string;
}

export interface NatalBalanceValidation {
  harmonyA: number;
  tensionA: number;
  balanceA: number;
  harmonyB: number;
  tensionB: number;
  balanceB: number;
  combinedBalance: number;
  rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'CHALLENGING';
}

export interface LongevityBreakdownItem {
  factor: string;
  description: string;
  score: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface LongevityValidation {
  mercuryNorthNodeA: { aspect: string | null; score: number };
  mercuryNorthNodeB: { aspect: string | null; score: number };
  compositeSaturnSign: ZodiacSign | null;
  compositeSaturnScore: number;
  totalLongevityScore: number;
  longevityRating: 'STRONG' | 'MODERATE' | 'WEAK' | 'AT_RISK';
  breakdown: LongevityBreakdownItem[];
  // Enhanced details
  direction: 'long-term' | 'short-term' | 'uncertain';
  confidence: 'high' | 'medium' | 'low';
  confidencePercent: number;
  summary: string;
  topPositive: LongevityBreakdownItem | null;
  topNegative: LongevityBreakdownItem | null;
  // Divorce prediction meter
  prediction: 'likely-divorce' | 'uncertain' | 'likely-married';
  predictionScore: number; // -100 to +100, negative = divorce, positive = married
  predictionConfidence: number; // 0-100%
}

export interface HouseOverlayEntry {
  name: string;
  weight: number;
}

export interface HouseOverlayValidation {
  significantOverlays: HouseOverlayEntry[];
  attractionBonus: number;
  repellingFactors: HouseOverlayEntry[];
  repellingPenalty: number;
  ascendantAspects: string[];
}

export interface ResearchValidation {
  marriagePredictorsFound: string[];
  divorceRiskFactors: string[];
  marriageBonus: number;
  divorcePenalty: number;
  netResearchScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface ContributionV4 {
  id: string;
  category: string;
  description: string;
  points: number;
  basePoints?: number;
  adjustedPoints?: number;
  type: 'aspect' | 'longevity' | 'house' | 'research' | 'composite' | 'element' | 'natal' | 'orb' | 'dignity' | 'config';
  planet1?: string;
  planet2?: string;
  aspectType?: string;
  orb?: number;
  house?: number;
  sign?: string;
  ownerPlanet1?: 'A' | 'B';
  ownerPlanet2?: 'A' | 'B';
  houseOwner?: 'A' | 'B';
  adjustmentApplied?: boolean;
}

export interface DurationValidation {
  rawDurationScore: number;
  normalizedDurationScore: number; // -100 to +100
  prediction: 'likely-long' | 'likely-short' | 'uncertain';
  perturbationApplied: number;
}

export interface SynastryResultV4 {
  totalScore: number;
  rawScore: number;
  breakdown: SynastryBreakdownV4;
  researchValidation: ResearchValidation;
  longevityValidation: LongevityValidation;
  durationValidation: DurationValidation;
  houseOverlayValidation: HouseOverlayValidation;
  elementBalance: ElementBalance;
  natalBalanceValidation: NatalBalanceValidation;
  contributions: ContributionV4[];
  topReason: string;
  warnings: string[];
  variant: '4.0';
  adjustmentsApplied: number;
}

// ============================================================================
// EXPORTED CONSTANTS - For Admin Panel Display
// ============================================================================

// Legacy aspect-type orbs (kept for backward compatibility)
export const ASPECT_ORBS: Record<AspectType, number> = {
  conjunction: 10,
  opposition: 9,
  trine: 9,
  square: 8,
  sextile: 7,
  quincunx: 4,
  copresence: 30, // Same sign = 30° max separation
};

export const OUTER_PLANETS = ['pluto', 'neptune', 'uranus', 'juno', 'chiron'];
export const OUTER_PLANET_ORBS: Record<AspectType, number> = {
  conjunction: 6,
  opposition: 5,
  trine: 5,
  square: 5,
  sextile: 4,
  quincunx: 2,
  copresence: 30,
};

// Planet-based orbs: Each planet has its own orb based on visibility/brightness
// For an aspect between two planets, use the MAXIMUM of their individual orbs
// Example: Sun (10°) to Pluto (2°) = 10° max orb (the Sun's orb applies)
export const PLANET_ORBS: Record<string, number> = {
  sun: 10,
  moon: 8,
  mercury: 7,
  venus: 7,
  mars: 7,
  jupiter: 5,
  saturn: 5,
  uranus: 4,
  neptune: 4,
  pluto: 2,
  northnode: 3,
  southnode: 3,
  chiron: 3,
  juno: 2,
  ceres: 2,
  pallas: 2,
  vesta: 2,
  lilith: 2,
  ascendant: 5,
  midheaven: 5,
  descendant: 5,
  ic: 5,
};

export const ASPECT_ANGLES: Record<AspectType, number> = {
  conjunction: 0,
  opposition: 180,
  trine: 120,
  square: 90,
  sextile: 60,
  quincunx: 150,
  copresence: 0, // Same sign but not conjunct (handled specially)
};

export const ASPECT_SCORES: Record<AspectType, number> = {
  conjunction: 12,
  trine: 9,
  sextile: 6,
  copresence: 3, // 1/4 of conjunction - planets in same sign but not conjunct
  opposition: 2,
  square: -1,
  quincunx: 0,
};

export const CATEGORY_WEIGHTS = {
  emotional: 0.18,
  love: 0.15,
  commitment: 0.15,
  chemistry: 0.13,
  family: 0.12,
  communication: 0.06,
  growth: 0.06,
  values: 0.10,
  prosperity: 0.05,
} as const;

export const SIGN_ELEMENTS: Record<string, string> = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
};

export const COMPATIBLE_ELEMENTS: Record<string, string[]> = {
  fire: ['fire', 'air'],
  air: ['air', 'fire'],
  earth: ['earth', 'water'],
  water: ['water', 'earth'],
};

export const MERCURY_NORTHNODE_WEIGHTS: Record<string, number> = {
  trine: 0.78,
  conjunction: 0.59,
  opposition: -0.47,
  sextile: -0.47,
  square: -0.20,
  quincunx: -0.10,
};

// Composite Saturn in longevity - Saturn = structure/durability of relationship
export const COMPOSITE_SATURN_SIGN_WEIGHTS: Record<ZodiacSign, number> = {
  Capricorn: 0.46,
  Aquarius: 0.29,
  Sagittarius: 0.20,
  Pisces: 0.12,
  Scorpio: 0.05,
  Aries: 0.00,
  Libra: 0.00,
  Virgo: -0.03,
  Taurus: -0.26,
  Gemini: -0.38,
  Leo: -0.38,
  Cancer: -0.58,
};

export const COMPOSITE_SATURN_SIGN_DESCRIPTIONS: Record<ZodiacSign, { description: string; evidence: string }> = {
  Capricorn: { description: 'Saturn domicile: supreme structural integrity — disciplined commitment, clear boundaries, builds legacy together', evidence: 'Saturn rules Capricorn (domicile). Research: "relationship built on mutual respect and shared ambition." Strongest placement for marriage longevity.' },
  Aquarius: { description: 'Saturn co-rules Aquarius: unconventional but durable structure — mutual freedom within commitment', evidence: 'Saturn traditional ruler of Aquarius. Research: "commitment to shared ideals, future-oriented structure." Allows individuality within partnership.' },
  Sagittarius: { description: 'Mutable fire tempers rigidity: flexible structure, growth-oriented boundaries — learns through expansion', evidence: 'Jupiter-ruled sign softens Saturn. Research: "couple grows through shared philosophy and travel." Structure comes through meaning, not rules.' },
  Pisces: { description: 'Water dissolves rigidity: compassionate boundaries, spiritual structure — commitment through faith', evidence: 'Jupiter/Neptune rulership adds spiritual dimension. Research: "structure emerges from shared devotion." Boundaries are felt, not imposed.' },
  Scorpio: { description: 'Fixed water: deep emotional commitment structures — intense loyalty, transformative endurance', evidence: 'Mars/Pluto rulership adds depth. Research: "bonds forged through crisis become unbreakable." Saturn here builds through emotional truth.' },
  Aries: { description: 'Cardinal fire: initiates structure but impatient with maintenance — strong start, needs follow-through', evidence: 'Mars-ruled sign challenges Saturn patience. Research: "couple acts decisively but may rush commitments." Neutral — energy without consistency.' },
  Libra: { description: 'Saturn exalted: balanced commitment, fair responsibilities — but may over-compromise to maintain structure', evidence: 'Saturn exalted in Libra traditionally, but zero weight in married data suggests balance alone insufficient. Partnership structure without depth.' },
  Virgo: { description: 'Mutable earth: practical but anxious structure — over-analyzes commitment, critical of imperfections', evidence: 'Mercury-ruled = intellectualizes structure. Research: "couple may focus on flaws rather than foundations." Slight negative — perfectionism undermines stability.' },
  Taurus: { description: 'Fixed earth: stubborn structure, resists necessary change — stable but rigid, fears transformation', evidence: 'Venus-ruled but fixed = inflexible commitment style. Research: "couple clings to outdated patterns." Saturn here calcifies rather than structures.' },
  Gemini: { description: 'Mutable air in detriment: scattered commitment, inconsistent boundaries — talks about structure but struggles to build it', evidence: 'Saturn in detriment in Gemini. Research: "couple communicates about commitment but lacks follow-through." Dual nature destabilizes structure.' },
  Leo: { description: 'Fixed fire in detriment: ego conflicts with structure — power struggles over who leads, resists compromise', evidence: 'Saturn in detriment in Leo. Research: "ego needs clash with partnership demands." Both want to lead, neither wants to yield.' },
  Cancer: { description: 'Cardinal water in detriment: emotional insecurity undermines structure — fear-based commitment, clingy or avoidant', evidence: 'Saturn in detriment in Cancer. Research: "emotional fears replace solid foundations." Worst for marriage — insecurity erodes trust over time.' },
};

export const MARRIAGE_PREDICTORS = [
  // Same-planet aspects - reduced (likely age artifacts), composite scoring boosted to compensate
  { p1: 'mars', p2: 'mars', aspect: 'conjunction', weight: 0.25, name: 'Mars-Mars Conjunction', evidence: 'Moderate: shared drive (age correlated)' },
  { p1: 'mars', p2: 'mars', aspect: 'trine', weight: 0.20, name: 'Mars-Mars Trine', evidence: 'Moderate: harmonious action' },
  { p1: 'jupiter', p2: 'jupiter', aspect: 'conjunction', weight: 0.22, name: 'Jupiter-Jupiter Conjunction', evidence: 'Moderate: shared growth (age correlated)' },
  { p1: 'venus', p2: 'venus', aspect: 'conjunction', weight: 0.20, name: 'Venus-Venus Conjunction', evidence: 'Moderate: shared values (age correlated)' },
  { p1: 'sun', p2: 'sun', aspect: 'conjunction', weight: 0.15, name: 'Sun-Sun Conjunction', evidence: 'Low: covered by similar birthday penalty' },
  { p1: 'mercury', p2: 'mercury', aspect: 'conjunction', weight: 0.18, name: 'Mercury-Mercury Conjunction', evidence: 'Moderate: similar communication' },
  { p1: 'moon', p2: 'moon', aspect: 'conjunction', weight: 0.30, name: 'Moon-Moon Conjunction', evidence: 'Kept higher: emotional sync less age-dependent' },
  // Cross-planet aspects (genuine predictors - kept strong)
  { p1: 'sun', p2: 'saturn', aspect: 'trine', weight: 0.48, name: 'Sun-Saturn Trine', evidence: 'RFE top-50 feature - genuine commitment indicator' },
  { p1: 'mercury', p2: 'saturn', aspect: 'trine', weight: 0.45, name: 'Mercury-Saturn Trine', evidence: 'RFE top-50 feature' },
  { p1: 'venus', p2: 'mars', aspect: 'sextile', weight: 0.42, name: 'Venus-Mars Sextile', evidence: 'RFE top-50 feature' },
  { p1: 'mars', p2: 'mercury', aspect: 'sextile', weight: 0.38, name: 'Mars-Mercury Sextile', evidence: 'RFE top-50 feature' },
  { p1: 'pluto', p2: 'venus', aspect: 'sextile', weight: 0.35, name: 'Pluto-Venus Sextile', evidence: 'RFE top-50 feature' },
  { p1: 'neptune', p2: 'jupiter', aspect: 'sextile', weight: 0.32, name: 'Neptune-Jupiter Sextile', evidence: 'RFE top-50 feature' },
] as const;

export const DIVORCE_PREDICTORS = [
  { p1: 'saturn', p2: 'saturn', aspect: 'opposition', weight: 1.79, name: 'Saturn-Saturn Opposition', evidence: 'Found in 179% more divorces', critical: true },
  { p1: 'mars', p2: 'uranus', aspect: 'opposition', weight: 0.55, name: 'Mars-Uranus Opposition', evidence: 'RFE top-50 feature - explosive conflicts', critical: true },
  { p1: 'mars', p2: 'uranus', aspect: 'square', weight: 0.48, name: 'Mars-Uranus Square', evidence: 'RFE top-50 feature', critical: false },
  { p1: 'moon', p2: 'uranus', aspect: 'conjunction', weight: 0.45, name: 'Moon-Uranus Conjunction', evidence: 'RFE top-50 feature', critical: false },
  { p1: 'moon', p2: 'uranus', aspect: 'square', weight: 0.42, name: 'Moon-Uranus Square', evidence: 'RFE top-50 feature', critical: false },
  { p1: 'uranus', p2: 'sun', aspect: 'square', weight: 0.40, name: 'Uranus-Sun Square', evidence: 'RFE top-50 feature', critical: false },
  { p1: 'mercury', p2: 'venus', aspect: 'square', weight: 0.35, name: 'Mercury-Venus Square', evidence: 'RFE top-50 feature', critical: false },
  { p1: 'moon', p2: 'jupiter', aspect: 'square', weight: 0.32, name: 'Moon-Jupiter Square', evidence: 'RFE top-50 feature', critical: false },
  { p1: 'sun', p2: 'mars', aspect: 'opposition', weight: 0.39, name: 'Sun-Mars Opposition', evidence: 'Found in 39% more divorces', critical: false },
  { p1: 'venus', p2: 'mars', aspect: 'conjunction', weight: 0.37, name: 'Venus-Mars Conjunction', evidence: 'Found in 37% more divorces', critical: false },
] as const;

// ============================================================================
// RFE FEATURE IMPORTANCE - From classifier analysis (68.9% accuracy)
// ============================================================================
// These are the features that actually predict marriage vs divorce in celebrity data.
// Importance: 1.0 = highest predictive power, 0.0 = no predictive power
// Category: 'marriage' = predicts staying together, 'divorce' = predicts separation, 'composite' = composite chart factor
export const RFE_FEATURE_IMPORTANCE: Record<string, { importance: number; rank: number; category: 'marriage' | 'divorce' | 'composite' | 'neutral'; evidence: string }> = {
  // TOP MARRIAGE PREDICTORS (RFE Top 50)
  'sun-saturn-trine': { importance: 0.92, rank: 1, category: 'marriage', evidence: 'Genuine commitment indicator - not age-correlated' },
  'mercury-saturn-trine': { importance: 0.88, rank: 2, category: 'marriage', evidence: 'Mature communication patterns' },
  'venus-mars-sextile': { importance: 0.85, rank: 3, category: 'marriage', evidence: 'Balanced attraction and drive' },
  'mars-mercury-sextile': { importance: 0.82, rank: 4, category: 'marriage', evidence: 'Constructive action through communication' },
  'pluto-venus-sextile': { importance: 0.78, rank: 5, category: 'marriage', evidence: 'Deep transformative love' },
  'neptune-jupiter-sextile': { importance: 0.75, rank: 6, category: 'marriage', evidence: 'Shared spiritual growth' },
  'sun-moon-conjunction': { importance: 0.72, rank: 7, category: 'marriage', evidence: 'Core identity alignment' },
  'venus-jupiter-trine': { importance: 0.70, rank: 8, category: 'marriage', evidence: 'Abundant love and generosity' },
  'moon-venus-trine': { importance: 0.68, rank: 9, category: 'marriage', evidence: 'Emotional harmony in love' },
  'sun-venus-conjunction': { importance: 0.65, rank: 10, category: 'marriage', evidence: 'Affection and identity blend' },

  // TOP DIVORCE PREDICTORS (RFE Top 50)
  'saturn-saturn-opposition': { importance: 0.95, rank: 1, category: 'divorce', evidence: 'Found in 179% more divorces - Saturn return cycle clash' },
  'mars-uranus-opposition': { importance: 0.90, rank: 2, category: 'divorce', evidence: 'Explosive conflicts, sudden breakups' },
  'mars-uranus-square': { importance: 0.85, rank: 3, category: 'divorce', evidence: 'Unpredictable aggression patterns' },
  'moon-uranus-conjunction': { importance: 0.82, rank: 4, category: 'divorce', evidence: 'Emotional instability and detachment' },
  'moon-uranus-square': { importance: 0.80, rank: 5, category: 'divorce', evidence: 'Erratic emotional needs' },
  'uranus-sun-square': { importance: 0.78, rank: 6, category: 'divorce', evidence: 'Identity disruption and rebellion' },
  'mercury-venus-square': { importance: 0.75, rank: 7, category: 'divorce', evidence: 'Communication blocks affection' },
  'moon-jupiter-square': { importance: 0.72, rank: 8, category: 'divorce', evidence: 'Emotional excess and disappointment' },
  'sun-mars-opposition': { importance: 0.70, rank: 9, category: 'divorce', evidence: 'Ego battles and competition' },
  'venus-mars-conjunction': { importance: 0.68, rank: 10, category: 'divorce', evidence: 'Passion burns too hot, leads to conflict' },
  'moon-saturn-square': { importance: 0.65, rank: 11, category: 'divorce', evidence: 'Emotional coldness and restriction' },
  'venus-saturn-square': { importance: 0.62, rank: 12, category: 'divorce', evidence: 'Love feels burdensome' },

  // COMPOSITE CHART FACTORS (26% of prediction accuracy)
  'composite-sun': { importance: 0.85, rank: 1, category: 'composite', evidence: 'Relationship identity and purpose' },
  'composite-moon': { importance: 0.90, rank: 1, category: 'composite', evidence: 'Emotional foundation - most important' },
  'composite-venus': { importance: 0.82, rank: 2, category: 'composite', evidence: 'How the relationship loves' },
  'composite-mars': { importance: 0.75, rank: 3, category: 'composite', evidence: 'Conflict resolution style' },
  'composite-saturn': { importance: 0.88, rank: 1, category: 'composite', evidence: 'Structural durability of relationship' },

  // MODERATE IMPORTANCE ASPECTS
  'sun-moon-trine': { importance: 0.60, rank: 15, category: 'marriage', evidence: 'Harmonious core connection' },
  'sun-moon-sextile': { importance: 0.55, rank: 18, category: 'marriage', evidence: 'Supportive identity-emotion link' },
  'venus-venus-trine': { importance: 0.45, rank: 25, category: 'marriage', evidence: 'Shared love language' },
  'mars-mars-trine': { importance: 0.40, rank: 28, category: 'marriage', evidence: 'Compatible drive (but may be age artifact)' },
  'moon-moon-conjunction': { importance: 0.38, rank: 30, category: 'marriage', evidence: 'Emotional sync (reduced: age artifact)' },

  // LOW/ZERO IMPORTANCE - AGE ARTIFACTS (same-planet aspects between similar ages)
  'jupiter-jupiter-conjunction': { importance: 0.05, rank: 95, category: 'neutral', evidence: 'Age artifact - 12yr cycle, not predictive' },
  'jupiter-jupiter-trine': { importance: 0.05, rank: 96, category: 'neutral', evidence: 'Age artifact - 12yr cycle' },
  'jupiter-jupiter-sextile': { importance: 0.05, rank: 97, category: 'neutral', evidence: 'Age artifact - 12yr cycle' },
  'saturn-saturn-conjunction': { importance: 0.08, rank: 90, category: 'neutral', evidence: 'Same Saturn cycle = same generation' },
  'saturn-saturn-trine': { importance: 0.08, rank: 91, category: 'neutral', evidence: 'Age correlation, not relationship quality' },
  'neptune-neptune-conjunction': { importance: 0.02, rank: 99, category: 'neutral', evidence: 'Generational - 165yr cycle' },
  'uranus-uranus-conjunction': { importance: 0.03, rank: 98, category: 'neutral', evidence: 'Generational - 84yr cycle' },
  'pluto-pluto-conjunction': { importance: 0.01, rank: 100, category: 'neutral', evidence: 'Generational - 248yr cycle' },

  // HOUSE OVERLAYS - All 156 combinations from Gauquelin 500 married couples
  'pluto-house-8': { importance: 0.92, rank: 1, category: 'marriage', evidence: 'Pluto in 8th: 1.60x more frequent in marriages — intimacy' },
  'pluto-house-4': { importance: 0.86, rank: 2, category: 'divorce', evidence: 'Pluto in 4th: only 0.44x expected — home/family' },
  'pluto-house-5': { importance: 0.84, rank: 3, category: 'divorce', evidence: 'Pluto in 5th: only 0.46x expected — romance/children' },
  'neptune-house-4': { importance: 0.83, rank: 4, category: 'divorce', evidence: 'Neptune in 4th: only 0.47x expected — home/family' },
  'neptune-house-5': { importance: 0.69, rank: 5, category: 'divorce', evidence: 'Neptune in 5th: only 0.56x expected — romance/children' },
  'pluto-house-3': { importance: 0.69, rank: 6, category: 'divorce', evidence: 'Pluto in 3rd: only 0.56x expected — communication' },
  'venus-house-9': { importance: 0.67, rank: 7, category: 'marriage', evidence: 'Venus in 9th: 1.43x more frequent in marriages — philosophy' },
  'neptune-house-10': { importance: 0.6, rank: 8, category: 'marriage', evidence: 'Neptune in 10th: 1.38x more frequent in marriages — public image' },
  'neptune-house-8': { importance: 0.59, rank: 9, category: 'marriage', evidence: 'Neptune in 8th: 1.37x more frequent in marriages — intimacy' },
  'neptune-house-7': { importance: 0.55, rank: 10, category: 'marriage', evidence: 'Neptune in 7th: 1.34x more frequent in marriages — partnership' },
  'pluto-house-12': { importance: 0.52, rank: 11, category: 'marriage', evidence: 'Pluto in 12th: 1.32x more frequent in marriages — spiritual/hidden' },
  'neptune-house-3': { importance: 0.51, rank: 12, category: 'divorce', evidence: 'Neptune in 3rd: only 0.68x expected — communication' },
  'uranus-house-8': { importance: 0.49, rank: 13, category: 'divorce', evidence: 'Uranus in 8th: only 0.70x expected — intimacy' },
  'uranus-house-9': { importance: 0.49, rank: 14, category: 'divorce', evidence: 'Uranus in 9th: only 0.70x expected — philosophy' },
  'uranus-house-1': { importance: 0.48, rank: 15, category: 'marriage', evidence: 'Uranus in 1st: 1.30x more frequent in marriages — identity' },
  'uranus-house-2': { importance: 0.48, rank: 16, category: 'marriage', evidence: 'Uranus in 2nd: 1.30x more frequent in marriages — finances' },
  'uranus-house-10': { importance: 0.48, rank: 17, category: 'divorce', evidence: 'Uranus in 10th: only 0.71x expected — public image' },
  'juno-house-6': { importance: 0.48, rank: 18, category: 'divorce', evidence: 'Juno in 6th: only 0.71x expected — daily life' },
  'pluto-house-2': { importance: 0.46, rank: 19, category: 'divorce', evidence: 'Pluto in 2nd: only 0.72x expected — finances' },
  'pluto-house-7': { importance: 0.45, rank: 20, category: 'marriage', evidence: 'Pluto in 7th: 1.27x more frequent in marriages — partnership' },
  'pluto-house-11': { importance: 0.45, rank: 21, category: 'marriage', evidence: 'Pluto in 11th: 1.27x more frequent in marriages — friendship' },
  'uranus-house-11': { importance: 0.44, rank: 22, category: 'divorce', evidence: 'Uranus in 11th: only 0.73x expected — friendship' },
  'juno-house-12': { importance: 0.43, rank: 23, category: 'marriage', evidence: 'Juno in 12th: 1.26x more frequent in marriages — spiritual/hidden' },
  'sun-house-10': { importance: 0.41, rank: 24, category: 'marriage', evidence: 'Sun in 10th: 1.25x more frequent in marriages — public image' },
  'uranus-house-3': { importance: 0.41, rank: 25, category: 'marriage', evidence: 'Uranus in 3rd: 1.25x more frequent in marriages — communication' },
  'uranus-house-5': { importance: 0.41, rank: 26, category: 'marriage', evidence: 'Uranus in 5th: 1.25x more frequent in marriages — romance/children' },
  'neptune-house-2': { importance: 0.41, rank: 27, category: 'divorce', evidence: 'Neptune in 2nd: only 0.76x expected — finances' },
  'saturn-house-5': { importance: 0.39, rank: 28, category: 'marriage', evidence: 'Saturn in 5th: 1.24x more frequent in marriages — romance/children' },
  'northnode-house-1': { importance: 0.39, rank: 29, category: 'marriage', evidence: 'North Node in 1st: 1.24x more frequent in marriages — identity' },
  'mars-house-5': { importance: 0.39, rank: 30, category: 'divorce', evidence: 'Mars in 5th: only 0.77x expected — romance/children' },
  'jupiter-house-9': { importance: 0.39, rank: 31, category: 'divorce', evidence: 'Jupiter in 9th: only 0.77x expected — philosophy' },
  'neptune-house-6': { importance: 0.39, rank: 32, category: 'divorce', evidence: 'Neptune in 6th: only 0.77x expected — daily life' },
  'mercury-house-10': { importance: 0.38, rank: 33, category: 'marriage', evidence: 'Mercury in 10th: 1.22x more frequent in marriages — public image' },
  'pluto-house-9': { importance: 0.38, rank: 34, category: 'marriage', evidence: 'Pluto in 9th: 1.22x more frequent in marriages — philosophy' },
  'sun-house-5': { importance: 0.37, rank: 35, category: 'divorce', evidence: 'Sun in 5th: only 0.78x expected — romance/children' },
  'neptune-house-12': { importance: 0.36, rank: 36, category: 'marriage', evidence: 'Neptune in 12th: 1.21x more frequent in marriages — spiritual/hidden' },
  'northnode-house-3': { importance: 0.36, rank: 37, category: 'marriage', evidence: 'North Node in 3rd: 1.21x more frequent in marriages — communication' },
  'juno-house-7': { importance: 0.35, rank: 38, category: 'divorce', evidence: 'Juno in 7th: only 0.79x expected — partnership' },
  'juno-house-9': { importance: 0.35, rank: 39, category: 'divorce', evidence: 'Juno in 9th: only 0.79x expected — philosophy' },
  'chiron-house-12': { importance: 0.35, rank: 40, category: 'divorce', evidence: 'Chiron in 12th: only 0.79x expected — spiritual/hidden' },
  'mars-house-12': { importance: 0.34, rank: 41, category: 'marriage', evidence: 'Mars in 12th: 1.20x more frequent in marriages — spiritual/hidden' },
  'pluto-house-10': { importance: 0.34, rank: 42, category: 'marriage', evidence: 'Pluto in 10th: 1.20x more frequent in marriages — public image' },
  'northnode-house-7': { importance: 0.34, rank: 43, category: 'divorce', evidence: 'North Node in 7th: only 0.80x expected — partnership' },
  'neptune-house-11': { importance: 0.32, rank: 44, category: 'marriage', evidence: 'Neptune in 11th: 1.19x more frequent in marriages — friendship' },
  'mars-house-6': { importance: 0.32, rank: 45, category: 'divorce', evidence: 'Mars in 6th: only 0.82x expected — daily life' },
  'juno-house-1': { importance: 0.31, rank: 46, category: 'marriage', evidence: 'Juno in 1st: 1.18x more frequent in marriages — identity' },
  'saturn-house-9': { importance: 0.3, rank: 47, category: 'divorce', evidence: 'Saturn in 9th: only 0.83x expected — philosophy' },
  'venus-house-12': { importance: 0.29, rank: 48, category: 'marriage', evidence: 'Venus in 12th: 1.16x more frequent in marriages — spiritual/hidden' },
  'neptune-house-9': { importance: 0.29, rank: 49, category: 'marriage', evidence: 'Neptune in 9th: 1.16x more frequent in marriages — philosophy' },
  'juno-house-3': { importance: 0.29, rank: 50, category: 'marriage', evidence: 'Juno in 3rd: 1.16x more frequent in marriages — communication' },
  'juno-house-4': { importance: 0.29, rank: 51, category: 'marriage', evidence: 'Juno in 4th: 1.16x more frequent in marriages — home/family' },
  'moon-house-12': { importance: 0.28, rank: 52, category: 'divorce', evidence: 'Moon in 12th: only 0.84x expected — spiritual/hidden' },
  'venus-house-6': { importance: 0.28, rank: 53, category: 'divorce', evidence: 'Venus in 6th: only 0.84x expected — daily life' },
  'northnode-house-5': { importance: 0.28, rank: 54, category: 'divorce', evidence: 'North Node in 5th: only 0.84x expected — romance/children' },
  'mars-house-1': { importance: 0.27, rank: 55, category: 'marriage', evidence: 'Mars in 1st: 1.15x more frequent in marriages — identity' },
  'mars-house-10': { importance: 0.27, rank: 56, category: 'marriage', evidence: 'Mars in 10th: 1.15x more frequent in marriages — public image' },
  'venus-house-3': { importance: 0.27, rank: 57, category: 'divorce', evidence: 'Venus in 3rd: only 0.85x expected — communication' },
  'mars-house-7': { importance: 0.27, rank: 58, category: 'divorce', evidence: 'Mars in 7th: only 0.85x expected — partnership' },
  'saturn-house-11': { importance: 0.27, rank: 59, category: 'divorce', evidence: 'Saturn in 11th: only 0.85x expected — friendship' },
  'pluto-house-1': { importance: 0.27, rank: 60, category: 'divorce', evidence: 'Pluto in 1st: only 0.85x expected — identity' },
  'moon-house-9': { importance: 0.25, rank: 61, category: 'marriage', evidence: 'Moon in 9th: 1.14x more frequent in marriages — philosophy' },
  'saturn-house-8': { importance: 0.25, rank: 62, category: 'marriage', evidence: 'Saturn in 8th: 1.14x more frequent in marriages — intimacy' },
  'chiron-house-8': { importance: 0.25, rank: 63, category: 'marriage', evidence: 'Chiron in 8th: 1.14x more frequent in marriages — intimacy' },
  'venus-house-7': { importance: 0.25, rank: 64, category: 'divorce', evidence: 'Venus in 7th: only 0.86x expected — partnership' },
  'jupiter-house-8': { importance: 0.24, rank: 65, category: 'marriage', evidence: 'Jupiter in 8th: 1.13x more frequent in marriages — intimacy' },
  'moon-house-5': { importance: 0.23, rank: 66, category: 'divorce', evidence: 'Moon in 5th: only 0.88x expected — romance/children' },
  'mercury-house-4': { importance: 0.23, rank: 67, category: 'divorce', evidence: 'Mercury in 4th: only 0.88x expected — home/family' },
  'venus-house-4': { importance: 0.23, rank: 68, category: 'divorce', evidence: 'Venus in 4th: only 0.88x expected — home/family' },
  'mercury-house-1': { importance: 0.22, rank: 69, category: 'marriage', evidence: 'Mercury in 1st: 1.12x more frequent in marriages — identity' },
  'mercury-house-3': { importance: 0.22, rank: 70, category: 'marriage', evidence: 'Mercury in 3rd: 1.12x more frequent in marriages — communication' },
  'jupiter-house-10': { importance: 0.22, rank: 71, category: 'marriage', evidence: 'Jupiter in 10th: 1.12x more frequent in marriages — public image' },
  'chiron-house-6': { importance: 0.22, rank: 72, category: 'marriage', evidence: 'Chiron in 6th: 1.12x more frequent in marriages — daily life' },
  'mercury-house-2': { importance: 0.21, rank: 73, category: 'divorce', evidence: 'Mercury in 2nd: only 0.89x expected — finances' },
  'mercury-house-8': { importance: 0.21, rank: 74, category: 'divorce', evidence: 'Mercury in 8th: only 0.89x expected — intimacy' },
  'chiron-house-10': { importance: 0.21, rank: 75, category: 'divorce', evidence: 'Chiron in 10th: only 0.89x expected — public image' },
  'northnode-house-12': { importance: 0.21, rank: 76, category: 'divorce', evidence: 'North Node in 12th: only 0.89x expected — spiritual/hidden' },
  'neptune-house-1': { importance: 0.2, rank: 77, category: 'marriage', evidence: 'Neptune in 1st: 1.10x more frequent in marriages — identity' },
  'sun-house-2': { importance: 0.2, rank: 78, category: 'divorce', evidence: 'Sun in 2nd: only 0.90x expected — finances' },
  'jupiter-house-2': { importance: 0.2, rank: 79, category: 'divorce', evidence: 'Jupiter in 2nd: only 0.90x expected — finances' },
  'saturn-house-6': { importance: 0.2, rank: 80, category: 'divorce', evidence: 'Saturn in 6th: only 0.90x expected — daily life' },
  'juno-house-10': { importance: 0.2, rank: 81, category: 'divorce', evidence: 'Juno in 10th: only 0.90x expected — public image' },
  'sun-house-12': { importance: 0.18, rank: 82, category: 'marriage', evidence: 'Sun in 12th: 1.09x more frequent in marriages — spiritual/hidden' },
  'mercury-house-12': { importance: 0.18, rank: 83, category: 'marriage', evidence: 'Mercury in 12th: 1.09x more frequent in marriages — spiritual/hidden' },
  'chiron-house-4': { importance: 0.18, rank: 84, category: 'marriage', evidence: 'Chiron in 4th: 1.09x more frequent in marriages — home/family' },
  'chiron-house-1': { importance: 0.18, rank: 85, category: 'divorce', evidence: 'Chiron in 1st: only 0.91x expected — identity' },
  'northnode-house-8': { importance: 0.18, rank: 86, category: 'divorce', evidence: 'North Node in 8th: only 0.91x expected — intimacy' },
  'venus-house-11': { importance: 0.17, rank: 87, category: 'marriage', evidence: 'Venus in 11th: 1.08x more frequent in marriages — friendship' },
  'jupiter-house-5': { importance: 0.17, rank: 88, category: 'marriage', evidence: 'Jupiter in 5th: 1.08x more frequent in marriages — romance/children' },
  'pluto-house-6': { importance: 0.17, rank: 89, category: 'marriage', evidence: 'Pluto in 6th: 1.08x more frequent in marriages — daily life' },
  'chiron-house-3': { importance: 0.17, rank: 90, category: 'marriage', evidence: 'Chiron in 3rd: 1.08x more frequent in marriages — communication' },
  'sun-house-4': { importance: 0.16, rank: 91, category: 'divorce', evidence: 'Sun in 4th: only 0.92x expected — home/family' },
  'mercury-house-6': { importance: 0.16, rank: 92, category: 'divorce', evidence: 'Mercury in 6th: only 0.92x expected — daily life' },
  'sun-house-3': { importance: 0.15, rank: 93, category: 'marriage', evidence: 'Sun in 3rd: 1.07x more frequent in marriages — communication' },
  'moon-house-3': { importance: 0.15, rank: 94, category: 'marriage', evidence: 'Moon in 3rd: 1.07x more frequent in marriages — communication' },
  'moon-house-4': { importance: 0.15, rank: 95, category: 'marriage', evidence: 'Moon in 4th: 1.07x more frequent in marriages — home/family' },
  'uranus-house-4': { importance: 0.15, rank: 96, category: 'marriage', evidence: 'Uranus in 4th: 1.07x more frequent in marriages — home/family' },
  'sun-house-7': { importance: 0.14, rank: 97, category: 'divorce', evidence: 'Sun in 7th: only 0.94x expected — partnership' },
  'chiron-house-11': { importance: 0.14, rank: 98, category: 'divorce', evidence: 'Chiron in 11th: only 0.94x expected — friendship' },
  'sun-house-1': { importance: 0.13, rank: 99, category: 'marriage', evidence: 'Sun in 1st: 1.06x more frequent in marriages — identity' },
  'sun-house-9': { importance: 0.13, rank: 100, category: 'marriage', evidence: 'Sun in 9th: 1.06x more frequent in marriages — philosophy' },
  'moon-house-8': { importance: 0.13, rank: 101, category: 'marriage', evidence: 'Moon in 8th: 1.06x more frequent in marriages — intimacy' },
  'mars-house-4': { importance: 0.13, rank: 102, category: 'marriage', evidence: 'Mars in 4th: 1.06x more frequent in marriages — home/family' },
  'saturn-house-2': { importance: 0.13, rank: 103, category: 'marriage', evidence: 'Saturn in 2nd: 1.06x more frequent in marriages — finances' },
  'juno-house-8': { importance: 0.13, rank: 104, category: 'marriage', evidence: 'Juno in 8th: 1.06x more frequent in marriages — intimacy' },
  'northnode-house-9': { importance: 0.13, rank: 105, category: 'marriage', evidence: 'North Node in 9th: 1.06x more frequent in marriages — philosophy' },
  'moon-house-11': { importance: 0.13, rank: 106, category: 'divorce', evidence: 'Moon in 11th: only 0.95x expected — friendship' },
  'mercury-house-9': { importance: 0.13, rank: 107, category: 'divorce', evidence: 'Mercury in 9th: only 0.95x expected — philosophy' },
  'venus-house-5': { importance: 0.13, rank: 108, category: 'divorce', evidence: 'Venus in 5th: only 0.95x expected — romance/children' },
  'juno-house-11': { importance: 0.13, rank: 109, category: 'divorce', evidence: 'Juno in 11th: only 0.95x expected — friendship' },
  'moon-house-10': { importance: 0.11, rank: 110, category: 'marriage', evidence: 'Moon in 10th: 1.04x more frequent in marriages — public image' },
  'mars-house-3': { importance: 0.11, rank: 111, category: 'marriage', evidence: 'Mars in 3rd: 1.04x more frequent in marriages — communication' },
  'jupiter-house-7': { importance: 0.11, rank: 112, category: 'marriage', evidence: 'Jupiter in 7th: 1.04x more frequent in marriages — partnership' },
  'juno-house-5': { importance: 0.11, rank: 113, category: 'marriage', evidence: 'Juno in 5th: 1.04x more frequent in marriages — romance/children' },
  'chiron-house-2': { importance: 0.11, rank: 114, category: 'marriage', evidence: 'Chiron in 2nd: 1.04x more frequent in marriages — finances' },
  'northnode-house-6': { importance: 0.11, rank: 115, category: 'marriage', evidence: 'North Node in 6th: 1.04x more frequent in marriages — daily life' },
  'venus-house-1': { importance: 0.11, rank: 116, category: 'divorce', evidence: 'Venus in 1st: only 0.96x expected — identity' },
  'mars-house-2': { importance: 0.11, rank: 117, category: 'divorce', evidence: 'Mars in 2nd: only 0.96x expected — finances' },
  'jupiter-house-6': { importance: 0.11, rank: 118, category: 'divorce', evidence: 'Jupiter in 6th: only 0.96x expected — daily life' },
  'mars-house-9': { importance: 0.1, rank: 119, category: 'marriage', evidence: 'Mars in 9th: 1.03x more frequent in marriages — philosophy' },
  'jupiter-house-1': { importance: 0.1, rank: 120, category: 'marriage', evidence: 'Jupiter in 1st: 1.03x more frequent in marriages — identity' },
  'jupiter-house-3': { importance: 0.1, rank: 121, category: 'marriage', evidence: 'Jupiter in 3rd: 1.03x more frequent in marriages — communication' },
  'saturn-house-12': { importance: 0.1, rank: 122, category: 'marriage', evidence: 'Saturn in 12th: 1.03x more frequent in marriages — spiritual/hidden' },
  'chiron-house-7': { importance: 0.1, rank: 123, category: 'marriage', evidence: 'Chiron in 7th: 1.03x more frequent in marriages — partnership' },
  'sun-house-8': { importance: 0.09, rank: 124, category: 'divorce', evidence: 'Sun in 8th: only 0.97x expected — intimacy' },
  'mercury-house-5': { importance: 0.09, rank: 125, category: 'divorce', evidence: 'Mercury in 5th: only 0.97x expected — romance/children' },
  'mercury-house-11': { importance: 0.09, rank: 126, category: 'divorce', evidence: 'Mercury in 11th: only 0.97x expected — friendship' },
  'jupiter-house-11': { importance: 0.09, rank: 127, category: 'divorce', evidence: 'Jupiter in 11th: only 0.97x expected — friendship' },
  'saturn-house-1': { importance: 0.09, rank: 128, category: 'divorce', evidence: 'Saturn in 1st: only 0.97x expected — identity' },
  'uranus-house-6': { importance: 0.08, rank: 129, category: 'marriage', evidence: 'Uranus in 6th: 1.02x more frequent in marriages — daily life' },
  'northnode-house-2': { importance: 0.08, rank: 130, category: 'marriage', evidence: 'North Node in 2nd: 1.02x more frequent in marriages — finances' },
  'northnode-house-11': { importance: 0.08, rank: 131, category: 'marriage', evidence: 'North Node in 11th: 1.02x more frequent in marriages — friendship' },
  'sun-house-6': { importance: 0.07, rank: 132, category: 'divorce', evidence: 'Sun in 6th: only 0.98x expected — daily life' },
  'sun-house-11': { importance: 0.07, rank: 133, category: 'divorce', evidence: 'Sun in 11th: only 0.98x expected — friendship' },
  'moon-house-2': { importance: 0.07, rank: 134, category: 'divorce', evidence: 'Moon in 2nd: only 0.98x expected — finances' },
  'moon-house-6': { importance: 0.07, rank: 135, category: 'divorce', evidence: 'Moon in 6th: only 0.98x expected — daily life' },
  'mercury-house-7': { importance: 0.07, rank: 136, category: 'divorce', evidence: 'Mercury in 7th: only 0.98x expected — partnership' },
  'venus-house-8': { importance: 0.07, rank: 137, category: 'divorce', evidence: 'Venus in 8th: only 0.98x expected — intimacy' },
  'mars-house-8': { importance: 0.07, rank: 138, category: 'divorce', evidence: 'Mars in 8th: only 0.98x expected — intimacy' },
  'mars-house-11': { importance: 0.07, rank: 139, category: 'divorce', evidence: 'Mars in 11th: only 0.98x expected — friendship' },
  'jupiter-house-4': { importance: 0.07, rank: 140, category: 'divorce', evidence: 'Jupiter in 4th: only 0.98x expected — home/family' },
  'jupiter-house-12': { importance: 0.07, rank: 141, category: 'divorce', evidence: 'Jupiter in 12th: only 0.98x expected — spiritual/hidden' },
  'saturn-house-3': { importance: 0.07, rank: 142, category: 'divorce', evidence: 'Saturn in 3rd: only 0.98x expected — communication' },
  'uranus-house-12': { importance: 0.07, rank: 143, category: 'divorce', evidence: 'Uranus in 12th: only 0.98x expected — spiritual/hidden' },
  'chiron-house-5': { importance: 0.07, rank: 144, category: 'divorce', evidence: 'Chiron in 5th: only 0.98x expected — romance/children' },
  'chiron-house-9': { importance: 0.07, rank: 145, category: 'divorce', evidence: 'Chiron in 9th: only 0.98x expected — philosophy' },
  'northnode-house-4': { importance: 0.07, rank: 146, category: 'divorce', evidence: 'North Node in 4th: only 0.98x expected — home/family' },
  'northnode-house-10': { importance: 0.07, rank: 147, category: 'divorce', evidence: 'North Node in 10th: only 0.98x expected — public image' },
  'venus-house-2': { importance: 0.06, rank: 148, category: 'marriage', evidence: 'Venus in 2nd: 1.01x more frequent in marriages — finances' },
  'saturn-house-4': { importance: 0.06, rank: 149, category: 'marriage', evidence: 'Saturn in 4th: 1.01x more frequent in marriages — home/family' },
  'uranus-house-7': { importance: 0.06, rank: 150, category: 'marriage', evidence: 'Uranus in 7th: 1.01x more frequent in marriages — partnership' },
  'moon-house-1': { importance: 0.06, rank: 151, category: 'divorce', evidence: 'Moon in 1st: only 1.00x expected — identity' },
  'moon-house-7': { importance: 0.06, rank: 152, category: 'divorce', evidence: 'Moon in 7th: only 1.00x expected — partnership' },
  'venus-house-10': { importance: 0.06, rank: 153, category: 'divorce', evidence: 'Venus in 10th: only 1.00x expected — public image' },
  'saturn-house-7': { importance: 0.06, rank: 154, category: 'divorce', evidence: 'Saturn in 7th: only 1.00x expected — partnership' },
  'saturn-house-10': { importance: 0.06, rank: 155, category: 'divorce', evidence: 'Saturn in 10th: only 1.00x expected — public image' },
  'juno-house-2': { importance: 0.06, rank: 156, category: 'divorce', evidence: 'Juno in 2nd: only 1.00x expected — finances' },
};

// Helper to get RFE importance for a contribution
export function getRFEImportance(planet1: string, planet2: string, aspect: string, house?: number): { importance: number; rank: number; category: string; evidence: string } | null {
  const p1 = planet1.toLowerCase();
  const p2 = planet2.toLowerCase();
  const asp = aspect.toLowerCase();

  // Try both orderings for aspects
  const key1 = `${p1}-${p2}-${asp}`;
  const key2 = `${p2}-${p1}-${asp}`;

  if (RFE_FEATURE_IMPORTANCE[key1]) return RFE_FEATURE_IMPORTANCE[key1];
  if (RFE_FEATURE_IMPORTANCE[key2]) return RFE_FEATURE_IMPORTANCE[key2];

  // Check for composite
  if (p1 === 'composite' || p2 === 'composite') {
    const planet = p1 === 'composite' ? p2 : p1;
    const compositeKey = `composite-${planet}`;
    if (RFE_FEATURE_IMPORTANCE[compositeKey]) return RFE_FEATURE_IMPORTANCE[compositeKey];
  }

  // Check for house overlays (e.g., "venus-house-7")
  if (house !== undefined) {
    const houseKey = `${p1}-house-${house}`;
    if (RFE_FEATURE_IMPORTANCE[houseKey]) return RFE_FEATURE_IMPORTANCE[houseKey];
  }

  return null;
}

export const HOUSE_OVERLAY_BONUSES = [
  // Data-driven from 500 Gauquelin married couples analysis
  // Weight = RFE_importance / 0.92 * direction — points proportional to statistical significance
  // 1st House overlays (sorted by significance)
  { planet: 'uranus', house: 1, weight: 0.522, name: 'Uranus in 1st House', description: 'Uranus electrifies self-perception — instant recognition and excitement, the partner feels like a catalyst for personal reinvention' }, // 1.296x RFE:0.48
  { planet: 'northnode', house: 1, weight: 0.424, name: 'North Node in 1st House', description: 'Karmic destiny activates identity — the partner feels fated to help you become who you\'re meant to be' }, // 1.236x RFE:0.39
  { planet: 'juno', house: 1, weight: 0.337, name: 'Juno in 1st House', description: 'Marriage asteroid lands on self — the partner sees you as spouse material at first sight' }, // 1.176x RFE:0.31
  { planet: 'mars', house: 1, weight: 0.293, name: 'Mars in 1st House', description: 'Physical magnetism and drive projected onto identity — strong attraction and motivation to pursue' }, // 1.152x RFE:0.27
  { planet: 'pluto', house: 1, weight: -0.293, name: 'Pluto in 1st House', description: 'Pluto\'s intensity overwhelms the 1st house person\'s sense of self — power dynamics distort identity' }, // 0.852x RFE:0.27
  { planet: 'mercury', house: 1, weight: 0.239, name: 'Mercury in 1st House', description: 'Mental rapport with identity — conversations flow naturally, the partner understands how you think' }, // 1.116x RFE:0.22
  { planet: 'neptune', house: 1, weight: 0.217, name: 'Neptune in 1st House', description: 'Dreamy idealization of the partner\'s persona — spiritual recognition, seeing the best version of them' }, // 1.104x RFE:0.2
  { planet: 'chiron', house: 1, weight: -0.196, name: 'Chiron in 1st House', description: 'Old wounds around self-worth get triggered — the partner inadvertently pokes at identity insecurities' }, // 0.912x RFE:0.18
  { planet: 'sun', house: 1, weight: 0.141, name: 'Sun in 1st House', description: 'Core vitality illuminates identity — the partner\'s essence enhances your self-expression' }, // 1.056x RFE:0.13
  { planet: 'venus', house: 1, weight: -0.12, name: 'Venus in 1st House', description: 'Superficial attraction without depth — love projected onto appearance rather than substance' }, // 0.960x RFE:0.11
  { planet: 'jupiter', house: 1, weight: 0.109, name: 'Jupiter in 1st House', description: 'Expansive optimism around identity — the partner makes you feel larger than life, boosts confidence' }, // 1.032x RFE:0.1
  { planet: 'saturn', house: 1, weight: -0.098, name: 'Saturn in 1st House', description: 'Saturn restricts self-expression — the partner feels critical or limiting to your authentic identity' }, // 0.972x RFE:0.09
  { planet: 'moon', house: 1, weight: -0.065, name: 'Moon in 1st House', description: 'Emotional neediness projected onto identity — moods can overwhelm the 1st house person\'s sense of self' }, // 0.996x RFE:0.06
  // 2nd House overlays (sorted by significance)
  { planet: 'uranus', house: 2, weight: 0.522, name: 'Uranus in 2nd House', description: 'Unconventional approach to shared values revolutionizes material security — innovative earning and spending together' }, // 1.296x RFE:0.48
  { planet: 'pluto', house: 2, weight: -0.5, name: 'Pluto in 2nd House', description: 'Power struggles over money and possessions — Pluto\'s control needs clash with 2nd house security needs' }, // 0.720x RFE:0.46
  { planet: 'neptune', house: 2, weight: -0.446, name: 'Neptune in 2nd House', description: 'Neptune dissolves financial boundaries — confusion over shared resources, unrealistic money expectations' }, // 0.756x RFE:0.41
  { planet: 'mercury', house: 2, weight: -0.228, name: 'Mercury in 2nd House', description: 'Overthinking finances together — mental anxiety around money matters creates stress rather than security' }, // 0.888x RFE:0.21
  { planet: 'sun', house: 2, weight: -0.217, name: 'Sun in 2nd House', description: 'Ego invested in material status — partner\'s identity tied to finances can create possessiveness or competition' }, // 0.900x RFE:0.2
  { planet: 'jupiter', house: 2, weight: -0.217, name: 'Jupiter in 2nd House', description: 'Overspending and financial overconfidence — Jupiter expands without restraint in the money house' }, // 0.900x RFE:0.2
  { planet: 'saturn', house: 2, weight: 0.141, name: 'Saturn in 2nd House', description: 'Disciplined financial structure — Saturn brings responsible budgeting and long-term material planning together' }, // 1.056x RFE:0.13
  { planet: 'chiron', house: 2, weight: 0.12, name: 'Chiron in 2nd House', description: 'Healing old money wounds together — shared vulnerability around self-worth builds deeper material trust' }, // 1.044x RFE:0.11
  { planet: 'mars', house: 2, weight: -0.12, name: 'Mars in 2nd House', description: 'Aggressive spending or financial conflicts — Mars brings impulsive energy to money decisions' }, // 0.960x RFE:0.11
  { planet: 'northnode', house: 2, weight: 0.087, name: 'North Node in 2nd House', description: 'Destined growth through building shared resources — karmic lesson in developing material security together' }, // 1.020x RFE:0.08
  { planet: 'moon', house: 2, weight: -0.076, name: 'Moon in 2nd House', description: 'Emotional spending patterns — mood-driven financial decisions create instability in shared resources' }, // 0.984x RFE:0.07
  { planet: 'venus', house: 2, weight: 0.065, name: 'Venus in 2nd House', description: 'Shared aesthetic values and comfortable spending — Venus naturally appreciates the 2nd house of pleasures' }, // 1.008x RFE:0.06
  { planet: 'juno', house: 2, weight: -0.065, name: 'Juno in 2nd House', description: 'Marriage commitment tied to material conditions — partnership expectations around finances create pressure' }, // 0.996x RFE:0.06
  // 3rd House overlays (sorted by significance)
  { planet: 'pluto', house: 3, weight: -0.75, name: 'Pluto in 3rd House', description: 'Pluto\'s intensity overwhelms daily communication — conversations become power struggles, obsessive thinking about each other\'s words' }, // 0.564x RFE:0.69
  { planet: 'neptune', house: 3, weight: -0.554, name: 'Neptune in 3rd House', description: 'Neptune fogs clear communication — misunderstandings, reading between lines that aren\'t there, deceptive or evasive exchanges' }, // 0.684x RFE:0.51
  { planet: 'uranus', house: 3, weight: 0.446, name: 'Uranus in 3rd House', description: 'Electric mental connection — stimulating conversations, unexpected insights, keeps intellectual curiosity alive for decades' }, // 1.248x RFE:0.41
  { planet: 'northnode', house: 3, weight: 0.391, name: 'North Node in 3rd House', description: 'Karmic growth through communication — destined to develop deeper understanding through daily dialogue and shared learning' }, // 1.212x RFE:0.36
  { planet: 'juno', house: 3, weight: 0.315, name: 'Juno in 3rd House', description: 'Marriage asteroid in the communication house — partnership built on mental rapport and everyday conversation' }, // 1.164x RFE:0.29
  { planet: 'venus', house: 3, weight: -0.293, name: 'Venus in 3rd House', description: 'Love stays at surface-level conversation — pleasant chatter without the depth marriage requires for longevity' }, // 0.852x RFE:0.27
  { planet: 'mercury', house: 3, weight: 0.239, name: 'Mercury in 3rd House', description: 'Mercury in its natural house — seamless mental rapport, finishing each other\'s sentences, effortless daily communication' }, // 1.116x RFE:0.22
  { planet: 'chiron', house: 3, weight: 0.185, name: 'Chiron in 3rd House', description: 'Healing through honest dialogue — vulnerability in communication builds trust, learning to express difficult truths together' }, // 1.080x RFE:0.17
  { planet: 'sun', house: 3, weight: 0.163, name: 'Sun in 3rd House', description: 'Core identity expressed through communication — the partner illuminates your thinking and sparks intellectual confidence' }, // 1.068x RFE:0.15
  { planet: 'moon', house: 3, weight: 0.163, name: 'Moon in 3rd House', description: 'Emotional intelligence in communication — intuitive understanding of each other\'s unspoken needs through daily interaction' }, // 1.068x RFE:0.15
  { planet: 'mars', house: 3, weight: 0.12, name: 'Mars in 3rd House', description: 'Passionate debates and lively exchanges — Mars energizes communication without destroying it at this moderate weight' }, // 1.044x RFE:0.11
  { planet: 'jupiter', house: 3, weight: 0.109, name: 'Jupiter in 3rd House', description: 'Expansive thinking together — optimistic conversations, shared enthusiasm for learning and exploring ideas' }, // 1.032x RFE:0.1
  { planet: 'saturn', house: 3, weight: -0.076, name: 'Saturn in 3rd House', description: 'Saturn restricts free communication — conversations feel heavy, censored, or overly serious, inhibiting spontaneous exchange' }, // 0.984x RFE:0.07
  // 4th House overlays (sorted by significance)
  { planet: 'pluto', house: 4, weight: -0.935, name: 'Pluto in 4th House', description: 'Pluto\'s intensity invades the most private space — power dynamics in the home, controlling domestic environment, deep but destabilizing' }, // 0.444x RFE:0.86
  { planet: 'neptune', house: 4, weight: -0.902, name: 'Neptune in 4th House', description: 'Neptune dissolves domestic foundations — idealized home life that never materializes, confusion about what "home" means together' }, // 0.468x RFE:0.83
  { planet: 'juno', house: 4, weight: 0.315, name: 'Juno in 4th House', description: 'Marriage asteroid in the home house — partnership naturally oriented toward building a family and domestic life together' }, // 1.164x RFE:0.29
  { planet: 'mercury', house: 4, weight: -0.25, name: 'Mercury in 4th House', description: 'Overthinking domestic matters — mental anxiety about home and family life creates restlessness rather than rootedness' }, // 0.876x RFE:0.23
  { planet: 'venus', house: 4, weight: -0.25, name: 'Venus in 4th House', description: 'Love of comfort without foundation — Venus beautifies the surface of home life but doesn\'t build structural roots' }, // 0.876x RFE:0.23
  { planet: 'chiron', house: 4, weight: 0.196, name: 'Chiron in 4th House', description: 'Healing family wounds together — shared vulnerability about childhood and roots creates profound domestic intimacy' }, // 1.092x RFE:0.18
  { planet: 'sun', house: 4, weight: -0.174, name: 'Sun in 4th House', description: 'Ego centered in domestic sphere — partner\'s identity dominates the home, potential for controlling the private environment' }, // 0.924x RFE:0.16
  { planet: 'moon', house: 4, weight: 0.163, name: 'Moon in 4th House', description: 'Moon in its natural house — deep emotional security, instinctive nurturing, the partner feels like home itself' }, // 1.068x RFE:0.15
  { planet: 'uranus', house: 4, weight: 0.163, name: 'Uranus in 4th House', description: 'Unconventional but exciting home life — freedom within domestic structures keeps the foundation fresh and evolving' }, // 1.068x RFE:0.15
  { planet: 'mars', house: 4, weight: 0.141, name: 'Mars in 4th House', description: 'Active domestic energy — motivation to build and protect the home, physical investment in creating a shared space' }, // 1.056x RFE:0.13
  { planet: 'jupiter', house: 4, weight: -0.076, name: 'Jupiter in 4th House', description: 'Over-expansion in domestic life — grandiose home plans without follow-through, restlessness within the home' }, // 0.984x RFE:0.07
  { planet: 'northnode', house: 4, weight: -0.076, name: 'North Node in 4th House', description: 'Karmic pull toward domesticity may feel burdensome — growth through home-building can trigger resistance' }, // 0.984x RFE:0.07
  { planet: 'saturn', house: 4, weight: 0.065, name: 'Saturn in 4th House', description: 'Disciplined domestic structure — Saturn provides steady foundations for home life, serious commitment to building roots' }, // 1.008x RFE:0.06
  // 5th House overlays (sorted by significance)
  { planet: 'pluto', house: 5, weight: -0.913, name: 'Pluto in 5th House', description: 'Pluto\'s obsessive intensity in the romance house — love becomes consuming, jealousy around creative expression and children' }, // 0.456x RFE:0.84
  { planet: 'neptune', house: 5, weight: -0.75, name: 'Neptune in 5th House', description: 'Romantic fantasy without substance — Neptune creates beautiful illusions of romance that dissolve under the reality of daily life' }, // 0.564x RFE:0.69
  { planet: 'uranus', house: 5, weight: 0.446, name: 'Uranus in 5th House', description: 'Exciting, unpredictable romance — keeps the spark alive through surprise, creativity, and unconventional expressions of love' }, // 1.248x RFE:0.41
  { planet: 'saturn', house: 5, weight: 0.424, name: 'Saturn in 5th House', description: 'Saturn stabilizes romance for the long haul — mature love that deepens over time rather than burning out after the honeymoon phase' }, // 1.236x RFE:0.39
  { planet: 'mars', house: 5, weight: -0.424, name: 'Mars in 5th House', description: 'Aggressive romantic energy — passion burns too hot, competitive dynamics around creativity and attention create romantic burnout' }, // 0.768x RFE:0.39
  { planet: 'sun', house: 5, weight: -0.402, name: 'Sun in 5th House', description: 'Ego dominates romance — the partner\'s need for admiration and attention overshadows mutual romantic enjoyment' }, // 0.780x RFE:0.37
  { planet: 'northnode', house: 5, weight: -0.304, name: 'North Node in 5th House', description: 'Karmic lesson in romance feels destabilizing — growth through creative self-expression challenges relationship security' }, // 0.840x RFE:0.28
  { planet: 'moon', house: 5, weight: -0.25, name: 'Moon in 5th House', description: 'Emotional neediness in romance — moods fluctuate around romantic fulfillment, creating insecurity in the love dynamic' }, // 0.876x RFE:0.23
  { planet: 'jupiter', house: 5, weight: 0.185, name: 'Jupiter in 5th House', description: 'Joyful expansion of romance — generous, optimistic love expression, fun together, abundance in creative and romantic pursuits' }, // 1.080x RFE:0.17
  { planet: 'venus', house: 5, weight: -0.141, name: 'Venus in 5th House', description: 'Surface-level romance — love stays in the dating phase, pleasant but lacking the depth needed for marriage commitment' }, // 0.948x RFE:0.13
  { planet: 'juno', house: 5, weight: 0.12, name: 'Juno in 5th House', description: 'Marriage commitment expressed through romance and creativity — playful devotion that sustains long-term joy' }, // 1.044x RFE:0.11
  { planet: 'mercury', house: 5, weight: -0.098, name: 'Mercury in 5th House', description: 'Intellectualizing romance — talking about love rather than feeling it, mental approach to what should be heartfelt' }, // 0.972x RFE:0.09
  { planet: 'chiron', house: 5, weight: -0.076, name: 'Chiron in 5th House', description: 'Old wounds around romantic worthiness — past rejection triggers surface in creative and romantic expression' }, // 0.984x RFE:0.07
  // 6th House overlays (sorted by significance)
  { planet: 'juno', house: 6, weight: -0.522, name: 'Juno in 6th House', description: 'Marriage commitment reduced to daily obligations — partnership feels like a chore list rather than a loving union' }, // 0.708x RFE:0.48
  { planet: 'neptune', house: 6, weight: -0.424, name: 'Neptune in 6th House', description: 'Neptune dissolves daily structure — confusion about responsibilities, unreliable routines undermine practical partnership' }, // 0.768x RFE:0.39
  { planet: 'mars', house: 6, weight: -0.348, name: 'Mars in 6th House', description: 'Aggressive energy in daily routines — arguments over chores, health habits, and who does what create chronic friction' }, // 0.816x RFE:0.32
  { planet: 'venus', house: 6, weight: -0.304, name: 'Venus in 6th House', description: 'Love languishes in mundane routine — romance gets buried under daily obligations, affection feels dutiful not passionate' }, // 0.840x RFE:0.28
  { planet: 'chiron', house: 6, weight: 0.239, name: 'Chiron in 6th House', description: 'Healing through service to each other — daily acts of care and devotion mend old wounds about being useful and needed' }, // 1.116x RFE:0.22
  { planet: 'saturn', house: 6, weight: -0.217, name: 'Saturn in 6th House', description: 'Overly rigid daily structure — Saturn makes routines feel oppressive, duty replaces warmth in everyday interactions' }, // 0.900x RFE:0.2
  { planet: 'pluto', house: 6, weight: 0.185, name: 'Pluto in 6th House', description: 'Transformative daily devotion — Pluto\'s depth channeled into service creates powerful healing routines and health improvements together' }, // 1.080x RFE:0.17
  { planet: 'mercury', house: 6, weight: -0.174, name: 'Mercury in 6th House', description: 'Overthinking daily logistics — mental anxiety about health and routines creates stress in practical partnership' }, // 0.924x RFE:0.16
  { planet: 'northnode', house: 6, weight: 0.12, name: 'North Node in 6th House', description: 'Karmic growth through serving each other — destined to develop devotion through daily acts of love and practical support' }, // 1.044x RFE:0.11
  { planet: 'jupiter', house: 6, weight: -0.12, name: 'Jupiter in 6th House', description: 'Over-promising in daily life — Jupiter expands commitments beyond what can be maintained, scattered routines' }, // 0.960x RFE:0.11
  { planet: 'uranus', house: 6, weight: 0.087, name: 'Uranus in 6th House', description: 'Unconventional but refreshing routines — Uranus prevents daily life from becoming stale, innovative health and work habits' }, // 1.020x RFE:0.08
  { planet: 'sun', house: 6, weight: -0.076, name: 'Sun in 6th House', description: 'Identity reduced to service role — the partner\'s ego gets caught up in daily duties rather than the bigger relationship picture' }, // 0.984x RFE:0.07
  { planet: 'moon', house: 6, weight: -0.076, name: 'Moon in 6th House', description: 'Emotional needs expressed through routine — feelings get channeled into caretaking duties rather than genuine intimacy' }, // 0.984x RFE:0.07
  // 7th House overlays (sorted by significance)
  { planet: 'neptune', house: 7, weight: 0.598, name: 'Neptune in 7th House', description: 'Neptune dissolves ego barriers in the marriage house — idealistic devotion, spiritual union, seeing the divine in each other' }, // 1.344x RFE:0.55
  { planet: 'pluto', house: 7, weight: 0.489, name: 'Pluto in 7th House', description: 'Profound transformation through partnership — Pluto\'s depth in the marriage house creates an unbreakable soul-level bond' }, // 1.272x RFE:0.45
  { planet: 'juno', house: 7, weight: -0.38, name: 'Juno in 7th House', description: 'Marriage expectations become rigid — Juno\'s idealism in its own house creates unrealistic partnership demands' }, // 0.792x RFE:0.35
  { planet: 'northnode', house: 7, weight: -0.37, name: 'North Node in 7th House', description: 'Karmic partnership pressure — destiny demands deep relating but the learning curve creates growing pains' }, // 0.804x RFE:0.34
  { planet: 'mars', house: 7, weight: -0.293, name: 'Mars in 7th House', description: 'Combative energy in the partnership house — attraction through conflict, but arguments become the relationship\'s default mode' }, // 0.852x RFE:0.27
  { planet: 'venus', house: 7, weight: -0.272, name: 'Venus in 7th House', description: 'Love stays in courtship mode — Venus charms the 7th house but resists the deeper commitment transformation marriage requires' }, // 0.864x RFE:0.25
  { planet: 'sun', house: 7, weight: -0.152, name: 'Sun in 7th House', description: 'Ego projected onto partnership — the partner\'s identity dominates the relationship dynamic, creating imbalance' }, // 0.936x RFE:0.14
  { planet: 'jupiter', house: 7, weight: 0.12, name: 'Jupiter in 7th House', description: 'Generous, expansive partnership — Jupiter blesses the marriage house with optimism, growth, and mutual encouragement' }, // 1.044x RFE:0.11
  { planet: 'chiron', house: 7, weight: 0.109, name: 'Chiron in 7th House', description: 'Healing through partnership — Chiron in the marriage house transforms old relationship wounds into wisdom and compassion' }, // 1.032x RFE:0.1
  { planet: 'mercury', house: 7, weight: -0.076, name: 'Mercury in 7th House', description: 'Intellectualizing partnership — talking about the relationship rather than deepening it, analysis paralysis in commitment' }, // 0.984x RFE:0.07
  { planet: 'uranus', house: 7, weight: 0.065, name: 'Uranus in 7th House', description: 'Unconventional partnership that stays fresh — Uranus prevents marital staleness through surprise and individuality' }, // 1.008x RFE:0.06
  { planet: 'moon', house: 7, weight: -0.065, name: 'Moon in 7th House', description: 'Emotional dependency in partnership — mood swings affect the relationship dynamic, neediness in the marriage house' }, // 0.996x RFE:0.06
  { planet: 'saturn', house: 7, weight: -0.065, name: 'Saturn in 7th House', description: 'Heavy obligation in partnership — Saturn makes marriage feel like duty rather than joy, restrictive but enduring' }, // 0.996x RFE:0.06
  // 8th House overlays (sorted by significance)
  { planet: 'pluto', house: 8, weight: 1.0, name: 'Pluto in 8th House', description: 'Pluto rules the 8th naturally — mutual psychic depth, shared resources, and sexual intensity create an unshakeable soul bond. Highest-weighted overlay in the model' }, // 1.596x RFE:0.92
  { planet: 'neptune', house: 8, weight: 0.641, name: 'Neptune in 8th House', description: 'Spiritual merging at the deepest level — Neptune dissolves boundaries in intimacy, creating transcendent sexual and emotional union' }, // 1.368x RFE:0.59
  { planet: 'uranus', house: 8, weight: -0.533, name: 'Uranus in 8th House', description: 'Erratic intimacy and financial disruptions — Uranus destabilizes the 8th house\'s need for trust and deep emotional security' }, // 0.696x RFE:0.49
  { planet: 'saturn', house: 8, weight: 0.272, name: 'Saturn in 8th House', description: 'Disciplined approach to shared resources and intimacy — Saturn builds trust slowly but creates enduring financial and sexual bonds' }, // 1.140x RFE:0.25
  { planet: 'chiron', house: 8, weight: 0.272, name: 'Chiron in 8th House', description: 'Deep healing through intimacy — Chiron transforms sexual and financial wounds into profound vulnerability and trust' }, // 1.140x RFE:0.25
  { planet: 'jupiter', house: 8, weight: 0.261, name: 'Jupiter in 8th House', description: 'Abundant shared resources and generous intimacy — Jupiter expands the 8th house\'s gifts of depth, inheritance, and sexual fulfillment' }, // 1.128x RFE:0.24
  { planet: 'mercury', house: 8, weight: -0.228, name: 'Mercury in 8th House', description: 'Overthinking intimacy and shared finances — mental analysis disrupts the trust and surrender the 8th house requires' }, // 0.888x RFE:0.21
  { planet: 'northnode', house: 8, weight: -0.196, name: 'North Node in 8th House', description: 'Karmic demand for deep merging feels overwhelming — destiny pushes toward intimacy but the vulnerability required creates resistance' }, // 0.912x RFE:0.18
  { planet: 'moon', house: 8, weight: 0.141, name: 'Moon in 8th House', description: 'Emotional depth in intimacy — the Moon\'s nurturing instinct in the 8th house creates profound emotional-sexual bonding' }, // 1.056x RFE:0.13
  { planet: 'juno', house: 8, weight: 0.141, name: 'Juno in 8th House', description: 'Marriage commitment expressed through deep intimacy — Juno in the 8th binds partnership to shared transformation and trust' }, // 1.056x RFE:0.13
  { planet: 'sun', house: 8, weight: -0.098, name: 'Sun in 8th House', description: 'Ego entangled in power dynamics — the partner\'s identity gets caught in 8th house control and possession themes' }, // 0.972x RFE:0.09
  { planet: 'venus', house: 8, weight: -0.076, name: 'Venus in 8th House', description: 'Love pulled into obsessive depths — Venus\'s lightness struggles with the 8th house\'s intensity and demand for total merging' }, // 0.984x RFE:0.07
  { planet: 'mars', house: 8, weight: -0.076, name: 'Mars in 8th House', description: 'Aggressive intimacy and financial conflicts — Mars brings combative energy to the house of shared resources and vulnerability' }, // 0.984x RFE:0.07
  // 9th House overlays (sorted by significance)
  { planet: 'venus', house: 9, weight: 0.728, name: 'Venus in 9th House', description: 'Love expressed through shared beliefs and adventure — Venus thrives exploring philosophy, travel, and meaning together. Highest positive 9th house overlay' }, // 1.428x RFE:0.67
  { planet: 'uranus', house: 9, weight: -0.533, name: 'Uranus in 9th House', description: 'Radical disagreements on beliefs and worldview — Uranus disrupts shared philosophy, creating ideological instability' }, // 0.696x RFE:0.49
  { planet: 'jupiter', house: 9, weight: -0.424, name: 'Jupiter in 9th House', description: 'Over-expansion of beliefs — Jupiter in its own house amplifies philosophical differences rather than finding common ground' }, // 0.768x RFE:0.39
  { planet: 'pluto', house: 9, weight: 0.413, name: 'Pluto in 9th House', description: 'Transformative shared worldview — Pluto deepens philosophical bonding, creating profound meaning and purpose together' }, // 1.224x RFE:0.38
  { planet: 'juno', house: 9, weight: -0.38, name: 'Juno in 9th House', description: 'Marriage expectations tied to beliefs — Juno demands philosophical alignment that may not materialize, rigid worldview requirements' }, // 0.792x RFE:0.35
  { planet: 'saturn', house: 9, weight: -0.326, name: 'Saturn in 9th House', description: 'Rigid beliefs restrict shared growth — Saturn makes philosophy dogmatic rather than exploratory, limiting mutual expansion' }, // 0.828x RFE:0.3
  { planet: 'neptune', house: 9, weight: 0.315, name: 'Neptune in 9th House', description: 'Spiritual and philosophical resonance — Neptune creates shared transcendent vision, mutual faith and idealistic worldview' }, // 1.164x RFE:0.29
  { planet: 'moon', house: 9, weight: 0.272, name: 'Moon in 9th House', description: 'Emotional fulfillment through shared beliefs — the Moon finds nurturing in mutual philosophy, travel, and spiritual exploration' }, // 1.140x RFE:0.25
  { planet: 'sun', house: 9, weight: 0.141, name: 'Sun in 9th House', description: 'Identity illuminated through shared philosophy — the partner\'s core essence aligns with your higher beliefs and life direction' }, // 1.056x RFE:0.13
  { planet: 'northnode', house: 9, weight: 0.141, name: 'North Node in 9th House', description: 'Destined growth through shared meaning — karmic evolution through exploring beliefs, travel, and higher learning together' }, // 1.056x RFE:0.13
  { planet: 'mercury', house: 9, weight: -0.141, name: 'Mercury in 9th House', description: 'Intellectual debates over beliefs become divisive — Mercury\'s analytical nature picks apart shared philosophy rather than embracing it' }, // 0.948x RFE:0.13
  { planet: 'mars', house: 9, weight: 0.109, name: 'Mars in 9th House', description: 'Passionate pursuit of shared meaning — Mars drives enthusiastic exploration of philosophy and adventure together' }, // 1.032x RFE:0.1
  { planet: 'chiron', house: 9, weight: -0.076, name: 'Chiron in 9th House', description: 'Old wounds around faith and meaning — past disillusionment with beliefs surfaces in the shared philosophical space' }, // 0.984x RFE:0.07
  // 10th House overlays (sorted by significance)
  { planet: 'neptune', house: 10, weight: 0.652, name: 'Neptune in 10th House', description: 'Inspired shared public image — Neptune elevates the couple\'s reputation through compassion, creativity, and spiritual purpose together' }, // 1.380x RFE:0.6
  { planet: 'uranus', house: 10, weight: -0.522, name: 'Uranus in 10th House', description: 'Disruptive career dynamics — Uranus destabilizes professional reputation and public standing, erratic status changes affect the partnership' }, // 0.708x RFE:0.48
  { planet: 'sun', house: 10, weight: 0.446, name: 'Sun in 10th House', description: 'Partner\'s identity strengthens public standing — the Sun illuminates career and reputation, mutual admiration in the public eye' }, // 1.248x RFE:0.41
  { planet: 'mercury', house: 10, weight: 0.413, name: 'Mercury in 10th House', description: 'Intellectual support for career ambitions — Mercury enhances professional communication and public image through smart collaboration' }, // 1.224x RFE:0.38
  { planet: 'pluto', house: 10, weight: 0.37, name: 'Pluto in 10th House', description: 'Transformative impact on career and legacy — Pluto empowers shared ambition, creating a powerful public presence together' }, // 1.200x RFE:0.34
  { planet: 'mars', house: 10, weight: 0.293, name: 'Mars in 10th House', description: 'Drive and ambition for shared goals — Mars energizes career pursuits, the partner motivates professional achievement' }, // 1.152x RFE:0.27
  { planet: 'jupiter', house: 10, weight: 0.239, name: 'Jupiter in 10th House', description: 'Expansive career blessings — Jupiter brings luck, growth, and opportunity to shared professional ambitions and reputation' }, // 1.116x RFE:0.22
  { planet: 'chiron', house: 10, weight: -0.228, name: 'Chiron in 10th House', description: 'Career wounds triggered by partnership — old professional insecurities surface, the partner inadvertently highlights status anxieties' }, // 0.888x RFE:0.21
  { planet: 'juno', house: 10, weight: -0.217, name: 'Juno in 10th House', description: 'Marriage expectations tied to status — Juno demands professional achievement as proof of partnership worthiness' }, // 0.900x RFE:0.2
  { planet: 'moon', house: 10, weight: 0.12, name: 'Moon in 10th House', description: 'Emotional investment in shared reputation — the Moon nurtures career ambitions, feeling proud of how the couple is perceived' }, // 1.044x RFE:0.11
  { planet: 'northnode', house: 10, weight: -0.076, name: 'North Node in 10th House', description: 'Karmic career demands strain the relationship — destiny pushes professional growth that may come at the cost of private intimacy' }, // 0.984x RFE:0.07
  { planet: 'venus', house: 10, weight: -0.065, name: 'Venus in 10th House', description: 'Love displayed publicly but lacking private depth — Venus beautifies the image but the relationship may prioritize appearance over substance' }, // 0.996x RFE:0.06
  { planet: 'saturn', house: 10, weight: -0.065, name: 'Saturn in 10th House', description: 'Heavy professional obligations — Saturn makes career demands feel burdensome, duty to public role can overshadow private connection' }, // 0.996x RFE:0.06
  // 11th House overlays (sorted by significance)
  { planet: 'pluto', house: 11, weight: 0.489, name: 'Pluto in 11th House', description: 'Deep transformation through shared social vision — Pluto creates powerful bonds through mutual ideals and community purpose' }, // 1.272x RFE:0.45
  { planet: 'uranus', house: 11, weight: -0.478, name: 'Uranus in 11th House', description: 'Uranus in its own house destabilizes social connections — erratic friendships and unpredictable group dynamics create instability' }, // 0.732x RFE:0.44
  { planet: 'neptune', house: 11, weight: 0.348, name: 'Neptune in 11th House', description: 'Spiritual friendship and shared dreams — Neptune creates idealistic social bonds and mutual compassion for humanity' }, // 1.188x RFE:0.32
  { planet: 'saturn', house: 11, weight: -0.293, name: 'Saturn in 11th House', description: 'Restrictive social dynamics — Saturn limits friendships and shared social life, the couple becomes isolated or socially rigid' }, // 0.852x RFE:0.27
  { planet: 'venus', house: 11, weight: 0.185, name: 'Venus in 11th House', description: 'Love expressed through friendship and shared social life — Venus brings warmth to group connections and mutual ideals' }, // 1.080x RFE:0.17
  { planet: 'chiron', house: 11, weight: -0.152, name: 'Chiron in 11th House', description: 'Old wounds around belonging surface — the partner triggers insecurities about fitting in and being accepted by groups' }, // 0.936x RFE:0.14
  { planet: 'moon', house: 11, weight: -0.141, name: 'Moon in 11th House', description: 'Emotional needs lost in social dynamics — feelings get diffused across friendships rather than deepening the private bond' }, // 0.948x RFE:0.13
  { planet: 'juno', house: 11, weight: -0.141, name: 'Juno in 11th House', description: 'Marriage commitment feels like a social contract — partnership expectations tied to friend groups and community rather than intimacy' }, // 0.948x RFE:0.13
  { planet: 'mercury', house: 11, weight: -0.098, name: 'Mercury in 11th House', description: 'Communication scattered across social circles — mental energy goes to friendships rather than deepening partner dialogue' }, // 0.972x RFE:0.09
  { planet: 'jupiter', house: 11, weight: -0.098, name: 'Jupiter in 11th House', description: 'Over-expansion into social life — Jupiter pulls energy toward friends and causes, potentially at the expense of the partnership' }, // 0.972x RFE:0.09
  { planet: 'northnode', house: 11, weight: 0.087, name: 'North Node in 11th House', description: 'Destined growth through shared community — karmic evolution through mutual social involvement and collective purpose' }, // 1.020x RFE:0.08
  { planet: 'sun', house: 11, weight: -0.076, name: 'Sun in 11th House', description: 'Identity invested in social standing — the partner\'s ego gets caught up in friend groups rather than the intimate partnership' }, // 0.984x RFE:0.07
  { planet: 'mars', house: 11, weight: -0.076, name: 'Mars in 11th House', description: 'Combative social dynamics — Mars brings conflict into shared friendships and group activities, competing for social influence' }, // 0.984x RFE:0.07
  // 12th House overlays (sorted by significance)
  { planet: 'pluto', house: 12, weight: 0.565, name: 'Pluto in 12th House', description: 'Profound unconscious bond — Pluto\'s transformative power in the spiritual house creates deep karmic connection and psychic intimacy' }, // 1.320x RFE:0.52
  { planet: 'juno', house: 12, weight: 0.467, name: 'Juno in 12th House', description: 'Marriage commitment rooted in the unconscious — Juno in the 12th creates soul-level devotion that transcends rational understanding' }, // 1.260x RFE:0.43
  { planet: 'neptune', house: 12, weight: 0.391, name: 'Neptune in 12th House', description: 'Neptune in its natural house — transcendent spiritual union, mutual compassion, and dissolving of ego boundaries at the deepest level' }, // 1.212x RFE:0.36
  { planet: 'chiron', house: 12, weight: -0.38, name: 'Chiron in 12th House', description: 'Deep unconscious wounds activated — Chiron in the 12th triggers hidden pain patterns, self-sabotage, and unresolved karmic suffering' }, // 0.792x RFE:0.35
  { planet: 'mars', house: 12, weight: 0.37, name: 'Mars in 12th House', description: 'Spiritual warrior energy — Mars channels drive into selfless service and spiritual purpose rather than ego-driven conflict' }, // 1.200x RFE:0.34
  { planet: 'venus', house: 12, weight: 0.315, name: 'Venus in 12th House', description: 'Unconditional love and spiritual devotion — Venus in the 12th transcends material affection into compassionate, selfless caring' }, // 1.164x RFE:0.29
  { planet: 'moon', house: 12, weight: -0.304, name: 'Moon in 12th House', description: 'Hidden emotional needs and unconscious patterns — the Moon in the 12th creates emotional confusion, unspoken feelings, and secret sorrows' }, // 0.840x RFE:0.28
  { planet: 'northnode', house: 12, weight: -0.228, name: 'North Node in 12th House', description: 'Karmic demand for spiritual surrender feels overwhelming — destiny pushes toward letting go, but ego clings to control' }, // 0.888x RFE:0.21
  { planet: 'sun', house: 12, weight: 0.196, name: 'Sun in 12th House', description: 'Identity finds purpose through spiritual connection — the partner\'s core essence illuminates your unconscious and inner world' }, // 1.092x RFE:0.18
  { planet: 'mercury', house: 12, weight: 0.196, name: 'Mercury in 12th House', description: 'Intuitive communication beyond words — Mercury in the 12th creates telepathic understanding and unspoken mental rapport' }, // 1.092x RFE:0.18
  { planet: 'saturn', house: 12, weight: 0.109, name: 'Saturn in 12th House', description: 'Structured spiritual practice together — Saturn brings discipline to the 12th house\'s spiritual realm, grounding transcendence in commitment' }, // 1.032x RFE:0.1
  { planet: 'jupiter', house: 12, weight: -0.076, name: 'Jupiter in 12th House', description: 'Over-expansion into escapism — Jupiter inflates 12th house tendencies toward avoidance, addiction, or spiritual bypassing' }, // 0.984x RFE:0.07
  { planet: 'uranus', house: 12, weight: -0.076, name: 'Uranus in 12th House', description: 'Erratic unconscious patterns — Uranus destabilizes the spiritual realm, creating sudden anxieties and unpredictable hidden tensions' }, // 0.984x RFE:0.07
] as const;

// TODO: DOUBLE-COUNTING ISSUE - A planet opposite the ASC is the same as a planet
// in the 7th house. Currently we score BOTH the house overlay (planet in 7th) AND
// the ASC-opposition aspect separately. These should be deduplicated or the
// ASC-opposition weight should be reduced/removed since house overlays already cover it.
// Same applies to ASC-conjunction = planet in 1st house.
export const ASCENDANT_ASPECTS = {
  repelling: [
    { planet: 'saturn', aspect: 'conjunction', weight: -0.21, name: 'Saturn conjunct ASC' },
    { planet: 'saturn', aspect: 'opposition', weight: -0.07, name: 'Saturn opposite ASC' },  // TODO: duplicates Saturn in 7th house
  ],
  attracting: [
    { planet: 'saturn', aspect: 'trine', weight: 0.36, name: 'Saturn trine ASC' },
    { planet: 'mars', aspect: 'sextile', weight: 0.23, name: 'Mars sextile DESC' },
    { planet: 'moon', aspect: 'quincunx', weight: 0.18, name: 'Moon quincunx ASC' },
  ],
} as const;

export const DIGNITY_SCORES: Record<string, number> = {
  domicile: 8,
  exaltation: 5,
  peregrine: 0,
  detriment: -5,
  fall: -8,
};

export const CONFIGURATION_SCORES: Record<string, number> = {
  grandTrine: 38,
  kite: 48,
  mysticRectangle: 38,
  tSquare: -28,
  yod: 25,
  grandCross: -35,
  stellium3: 15,
  stellium4: 25,
  stellium5: 35,
  similarBirthday: -100, // Birthdays within ~5 days (Sun within 5°)
};

// ============================================================================
// NATAL PARTNERSHIP INDICATORS - Individual chart factors for relationship readiness
// ============================================================================

// Planets in 7th House - what each planet brings to partnership orientation
// Positive = naturally partnership-oriented, Negative = challenges in partnership
export const SEVENTH_HOUSE_PLANET_WEIGHTS: Record<string, { weight: number; description: string }> = {
  sun: { weight: 0.15, description: 'Identity tied to partnerships' },
  moon: { weight: 0.45, description: 'Emotional fulfillment through partnership' },
  mercury: { weight: 0.10, description: 'Communicative in relationships' },
  venus: { weight: 0.35, description: 'Natural partnership ability - love flows easily' },
  mars: { weight: -0.05, description: 'Can be competitive or combative in relationships' },
  jupiter: { weight: 0.45, description: 'Generous partner, attracts abundance through relationships' },
  saturn: { weight: 0.35, description: 'Takes relationships seriously, may delay marriage' },
  uranus: { weight: -0.20, description: 'Needs freedom, unconventional relationships' },
  neptune: { weight: 0.05, description: 'Idealistic about love, may have unrealistic expectations' },
  pluto: { weight: -0.10, description: 'Intense transformative relationships, power dynamics' },
  chiron: { weight: 0.08, description: 'Healing through partnerships, may attract wounded partners' },
  northnode: { weight: 0.40, description: 'Life path involves learning partnership' },
  juno: { weight: 0.35, description: 'Marriage asteroid in marriage house - strong commitment indicator' },
};

// Planets in 5th House - romance, creativity, children orientation
// Positive = naturally romantic, Negative = challenges with romance/fun
export const FIFTH_HOUSE_PLANET_WEIGHTS: Record<string, { weight: number; description: string }> = {
  sun: { weight: 0.20, description: 'Creative, romantic identity - loves self-expression' },
  moon: { weight: 0.15, description: 'Emotional need for romance and children' },
  mercury: { weight: 0.10, description: 'Playful communication, witty flirtation' },
  venus: { weight: 0.30, description: 'Natural romantic - love of pleasure and beauty' },
  mars: { weight: 0.15, description: 'Passionate pursuit of romance and fun' },
  jupiter: { weight: 0.25, description: 'Generous lover, abundant creativity' },
  saturn: { weight: -0.05, description: 'Reserved in romance, may delay children' },
  uranus: { weight: 0.05, description: 'Unconventional romance, exciting but unpredictable' },
  neptune: { weight: 0.10, description: 'Dreamy romantic, idealistic about love' },
  pluto: { weight: 0.05, description: 'Intense romantic experiences, transformative love affairs' },
  northnode: { weight: 0.15, description: 'Life path involves creative/romantic expression' },
  juno: { weight: 0.12, description: 'Commitment through romance and creativity' },
};

// Venus Sign Weights - How Venus expresses love based on sign placement
// Based on dignity plus relationship-specific qualities
export const VENUS_SIGN_WEIGHTS: Record<string, { weight: number; description: string }> = {
  aries: { weight: -0.15, description: 'Venus in detriment - impulsive, can be selfish in love' },
  taurus: { weight: 0.25, description: 'Venus domicile - sensual, loyal, values stability' },
  gemini: { weight: 0.05, description: 'Playful, needs mental stimulation, can be flighty' },
  cancer: { weight: 0.15, description: 'Nurturing, emotionally devoted, family-oriented' },
  leo: { weight: 0.10, description: 'Generous, romantic, needs appreciation' },
  virgo: { weight: -0.10, description: 'Venus in fall - critical, practical over romantic' },
  libra: { weight: 0.30, description: 'Venus domicile - partnership-oriented, harmonious' },
  scorpio: { weight: -0.05, description: 'Venus in detriment - intense, possessive, deeply loyal' },
  sagittarius: { weight: 0.00, description: 'Freedom-loving, adventurous in love' },
  capricorn: { weight: 0.08, description: 'Committed, traditional, may be reserved' },
  aquarius: { weight: -0.05, description: 'Independent, unconventional approach to love' },
  pisces: { weight: 0.20, description: 'Venus exalted - compassionate, romantic, selfless love' },
};

// Moon Sign Weights - Emotional availability and nurturing style
export const MOON_SIGN_WEIGHTS: Record<string, { weight: number; description: string }> = {
  aries: { weight: -0.10, description: 'Emotionally impulsive, needs independence' },
  taurus: { weight: 0.10, description: 'Moon exalted - emotionally stable, nurturing' },
  gemini: { weight: 0.10, description: 'Emotionally versatile, needs communication' },
  cancer: { weight: 0.15, description: 'Moon domicile - deeply nurturing, family-oriented' },
  leo: { weight: 0.05, description: 'Warm, generous, needs appreciation' },
  virgo: { weight: 0.05, description: 'Practical care, can be anxious' },
  libra: { weight: 0.15, description: 'Needs harmony, diplomatic in emotions' },
  scorpio: { weight: 0.05, description: 'Moon in fall - intense emotions, can be secretive' },
  sagittarius: { weight: 0.10, description: 'Optimistic, needs freedom' },
  capricorn: { weight: -0.05, description: 'Moon in detriment - reserved emotions, responsible' },
  aquarius: { weight: -0.05, description: 'Emotionally detached, needs space' },
  pisces: { weight: 0.05, description: 'Deeply empathic, intuitive, compassionate' },
};

// Natal Partnership Aspects - Key aspects in individual chart affecting relationships
export const NATAL_PARTNERSHIP_ASPECTS: Array<{
  planet1: string;
  planet2: string;
  aspect: string;
  weight: number;
  description: string;
}> = [
  // Venus aspects
  { planet1: 'venus', planet2: 'jupiter', aspect: 'conjunction', weight: -0.25, description: 'Generous in love, attracts abundance' },
  { planet1: 'venus', planet2: 'jupiter', aspect: 'trine', weight: 0.10, description: 'Easy flow of love and joy' },
  { planet1: 'venus', planet2: 'jupiter', aspect: 'sextile', weight: 0.15, description: 'Opportunities for love' },
  { planet1: 'venus', planet2: 'jupiter', aspect: 'square', weight: -0.15, description: 'Over-indulgent but still positive' },
  { planet1: 'venus', planet2: 'jupiter', aspect: 'opposition', weight: -0.15, description: 'Needs balance in giving' },

  { planet1: 'venus', planet2: 'saturn', aspect: 'conjunction', weight: 0.10, description: 'Serious about love, commitment-oriented' },
  { planet1: 'venus', planet2: 'saturn', aspect: 'trine', weight: 0.18, description: 'Mature, lasting love' },
  { planet1: 'venus', planet2: 'saturn', aspect: 'sextile', weight: 0.12, description: 'Responsible in relationships' },
  { planet1: 'venus', planet2: 'saturn', aspect: 'square', weight: -0.15, description: 'Fear of rejection, difficulty expressing love' },
  { planet1: 'venus', planet2: 'saturn', aspect: 'opposition', weight: -0.12, description: 'Feels unloved, relationship delays' },

  { planet1: 'venus', planet2: 'uranus', aspect: 'conjunction', weight: -0.15, description: 'Needs excitement, commitment-phobic' },
  { planet1: 'venus', planet2: 'uranus', aspect: 'trine', weight: 0.05, description: 'Exciting but stable enough' },
  { planet1: 'venus', planet2: 'uranus', aspect: 'sextile', weight: 0.03, description: 'Open to unconventional love' },
  { planet1: 'venus', planet2: 'uranus', aspect: 'square', weight: -0.18, description: 'Sudden attractions/breakups, instability' },
  { planet1: 'venus', planet2: 'uranus', aspect: 'opposition', weight: -0.15, description: 'Torn between freedom and commitment' },

  { planet1: 'venus', planet2: 'neptune', aspect: 'conjunction', weight: -0.15, description: 'Romantic idealist, spiritual love' },
  { planet1: 'venus', planet2: 'neptune', aspect: 'trine', weight: 0.12, description: 'Compassionate, artistic love' },
  { planet1: 'venus', planet2: 'neptune', aspect: 'square', weight: -0.12, description: 'Illusions in love, deception risk' },
  { planet1: 'venus', planet2: 'neptune', aspect: 'opposition', weight: -0.10, description: 'Unrealistic expectations' },

  { planet1: 'venus', planet2: 'pluto', aspect: 'conjunction', weight: -0.15, description: 'Intense, transformative love' },
  { planet1: 'venus', planet2: 'pluto', aspect: 'trine', weight: 0.10, description: 'Deep, powerful connections' },
  { planet1: 'venus', planet2: 'pluto', aspect: 'square', weight: -0.10, description: 'Obsessive love, jealousy' },
  { planet1: 'venus', planet2: 'pluto', aspect: 'opposition', weight: -0.12, description: 'Power struggles in love' },

  // Venus-Mars natal aspects - passion and attraction style
  { planet1: 'venus', planet2: 'mars', aspect: 'conjunction', weight: 0.22, description: 'Strong magnetic presence, passionate nature' },
  { planet1: 'venus', planet2: 'mars', aspect: 'trine', weight: 0.18, description: 'Harmonious blend of love and desire' },
  { planet1: 'venus', planet2: 'mars', aspect: 'sextile', weight: 0.12, description: 'Balanced approach to romance and passion' },
  { planet1: 'venus', planet2: 'mars', aspect: 'square', weight: 0.05, description: 'Tension between love and lust, but creates drive' },
  { planet1: 'venus', planet2: 'mars', aspect: 'opposition', weight: 0.03, description: 'Push-pull between romance and desire' },

  // Venus-Sun natal aspects - love and identity
  { planet1: 'venus', planet2: 'sun', aspect: 'conjunction', weight: 0.20, description: 'Charming, loving identity - attracts easily' },
  { planet1: 'venus', planet2: 'sun', aspect: 'sextile', weight: 0.10, description: 'Natural social grace' },

  // Mars natal aspects - drive, assertiveness, passion style
  { planet1: 'mars', planet2: 'jupiter', aspect: 'conjunction', weight: 0.18, description: 'Enthusiastic, confident action - attracts opportunities' },
  { planet1: 'mars', planet2: 'jupiter', aspect: 'trine', weight: 0.15, description: 'Lucky in pursuits, optimistic drive' },
  { planet1: 'mars', planet2: 'jupiter', aspect: 'sextile', weight: 0.10, description: 'Motivated and positive' },
  { planet1: 'mars', planet2: 'jupiter', aspect: 'square', weight: 0.03, description: 'Over-ambitious but still driven' },

  { planet1: 'mars', planet2: 'saturn', aspect: 'conjunction', weight: 0.05, description: 'Disciplined drive, persistent' },
  { planet1: 'mars', planet2: 'saturn', aspect: 'trine', weight: 0.15, description: 'Controlled passion, endurance in relationships' },
  { planet1: 'mars', planet2: 'saturn', aspect: 'sextile', weight: 0.10, description: 'Steady, reliable energy' },
  { planet1: 'mars', planet2: 'saturn', aspect: 'square', weight: -0.15, description: 'Frustrated drive, anger issues possible' },
  { planet1: 'mars', planet2: 'saturn', aspect: 'opposition', weight: -0.12, description: 'Stop-start energy, difficulty sustaining effort' },

  { planet1: 'mars', planet2: 'uranus', aspect: 'conjunction', weight: -0.05, description: 'Impulsive, unpredictable actions' },
  { planet1: 'mars', planet2: 'uranus', aspect: 'trine', weight: 0.08, description: 'Innovative, exciting energy' },
  { planet1: 'mars', planet2: 'uranus', aspect: 'square', weight: -0.18, description: 'Erratic, explosive temper risk' },
  { planet1: 'mars', planet2: 'uranus', aspect: 'opposition', weight: -0.15, description: 'Rebellious, unpredictable in relationships' },

  { planet1: 'mars', planet2: 'pluto', aspect: 'conjunction', weight: 0.05, description: 'Powerful drive, intense willpower' },
  { planet1: 'mars', planet2: 'pluto', aspect: 'trine', weight: 0.12, description: 'Transformative energy, resilient' },
  { planet1: 'mars', planet2: 'pluto', aspect: 'square', weight: -0.20, description: 'Power struggles, controlling tendencies' },
  { planet1: 'mars', planet2: 'pluto', aspect: 'opposition', weight: -0.18, description: 'Dominance issues, intense conflicts' },

  // Moon aspects affecting emotional availability
  { planet1: 'moon', planet2: 'saturn', aspect: 'conjunction', weight: -0.08, description: 'Emotional reserve, fear of vulnerability' },
  { planet1: 'moon', planet2: 'saturn', aspect: 'trine', weight: 0.10, description: 'Emotional maturity, stable' },
  { planet1: 'moon', planet2: 'saturn', aspect: 'square', weight: -0.15, description: 'Difficulty expressing emotions' },
  { planet1: 'moon', planet2: 'saturn', aspect: 'opposition', weight: -0.12, description: 'Feels emotionally blocked' },

  { planet1: 'moon', planet2: 'pluto', aspect: 'conjunction', weight: -0.05, description: 'Intense emotions, can be overwhelming' },
  { planet1: 'moon', planet2: 'pluto', aspect: 'trine', weight: 0.08, description: 'Emotional depth and resilience' },
  { planet1: 'moon', planet2: 'pluto', aspect: 'square', weight: -0.18, description: 'Emotional manipulation tendencies' },
  { planet1: 'moon', planet2: 'pluto', aspect: 'opposition', weight: -0.15, description: 'Power struggles with emotions' },

  { planet1: 'moon', planet2: 'venus', aspect: 'conjunction', weight: 0.20, description: 'Loving, nurturing nature' },
  { planet1: 'moon', planet2: 'venus', aspect: 'trine', weight: 0.18, description: 'Emotional and romantic harmony' },
  { planet1: 'moon', planet2: 'venus', aspect: 'sextile', weight: 0.12, description: 'Gentle, affectionate' },

  // Juno aspects - commitment indicator
  { planet1: 'juno', planet2: 'sun', aspect: 'conjunction', weight: 0.15, description: 'Identity tied to marriage' },
  { planet1: 'juno', planet2: 'moon', aspect: 'conjunction', weight: 0.18, description: 'Emotional need for commitment' },
  { planet1: 'juno', planet2: 'venus', aspect: 'conjunction', weight: 0.20, description: 'Love and commitment aligned' },
  { planet1: 'juno', planet2: 'saturn', aspect: 'trine', weight: 0.15, description: 'Serious about commitment' },
  { planet1: 'juno', planet2: 'uranus', aspect: 'square', weight: -0.12, description: 'Tension between freedom and commitment' },
];

// Natal Stellium Weights - When 3+ planets cluster in a house, it shows life focus
// A stellium = 3+ planets in the same house or sign
// This affects how partnership-ready someone is based on where their energy is concentrated
export const NATAL_STELLIUM_WEIGHTS: Record<number, { weight: number; description: string; interpretation: string }> = {
  1: { weight: -0.05, description: 'Self/Identity Stellium', interpretation: '3+ planets in 1st house: Strong self-focus, may need to learn to share spotlight in relationships' },
  2: { weight: 0.02, description: 'Resources/Values Stellium', interpretation: '3+ planets in 2nd house: Focus on security and material stability - values-driven partner' },
  3: { weight: 0.00, description: 'Communication Stellium', interpretation: '3+ planets in 3rd house: Mind-focused, needs intellectual connection in relationships' },
  4: { weight: 0.12, description: 'Home/Family Stellium', interpretation: '3+ planets in 4th house: Strong family orientation - wants to build a home together' },
  5: { weight: 0.10, description: 'Romance/Children Stellium', interpretation: '3+ planets in 5th house: Creative, romantic nature - wants children and fun in relationships' },
  6: { weight: -0.03, description: 'Work/Health Stellium', interpretation: '3+ planets in 6th house: May prioritize work over relationships, service-oriented partner' },
  7: { weight: 0.25, description: 'Partnership Stellium', interpretation: '3+ planets in 7th house: Naturally partnership-oriented - relationships are life purpose' },
  8: { weight: 0.05, description: 'Intimacy/Transformation Stellium', interpretation: '3+ planets in 8th house: Seeks deep soul bonds, intense intimacy needs' },
  9: { weight: 0.00, description: 'Philosophy/Travel Stellium', interpretation: '3+ planets in 9th house: Seeks meaning and adventure - needs partner who explores' },
  10: { weight: -0.05, description: 'Career/Status Stellium', interpretation: '3+ planets in 10th house: Career-focused, may struggle to prioritize relationship' },
  11: { weight: 0.03, description: 'Friends/Community Stellium', interpretation: '3+ planets in 11th house: Social butterfly, friendship-based relationships' },
  12: { weight: -0.10, description: 'Spirituality/Solitude Stellium', interpretation: '3+ planets in 12th house: Needs alone time, may struggle with emotional intimacy' },
};

// For backwards compatibility
export const HOUSE_EMPHASIS_WEIGHTS = NATAL_STELLIUM_WEIGHTS;

// ============================================================================
// ELEMENT BALANCE WEIGHTS (for Patterns section)
// ============================================================================

// When someone has dominant element(s), it affects their relationship style
// Ideal balance is considered 2-4 planets in each element
export const ELEMENT_DOMINANCE_WEIGHTS: Record<string, { weight: number; description: string; traits: string }> = {
  fire_dominant: { weight: 0.05, description: 'Fire Dominant (5+ Fire planets)', traits: 'Passionate, enthusiastic, inspiring - may burn out partners' },
  earth_dominant: { weight: 0.15, description: 'Earth Dominant (5+ Earth planets)', traits: 'Stable, reliable, sensual - excellent for long-term commitment' },
  air_dominant: { weight: 0.00, description: 'Air Dominant (5+ Air planets)', traits: 'Communicative, social, intellectual - may struggle with emotional depth' },
  water_dominant: { weight: 0.10, description: 'Water Dominant (5+ Water planets)', traits: 'Emotional, intuitive, nurturing - deep emotional bonds' },
  fire_lacking: { weight: -0.05, description: 'Fire Lacking (0-1 Fire planets)', traits: 'May lack passion/initiative in relationships' },
  earth_lacking: { weight: -0.12, description: 'Earth Lacking (0-1 Earth planets)', traits: 'May struggle with practical commitment and stability' },
  air_lacking: { weight: -0.05, description: 'Air Lacking (0-1 Air planets)', traits: 'May struggle with communication and social connection' },
  water_lacking: { weight: -0.10, description: 'Water Lacking (0-1 Water planets)', traits: 'May struggle with emotional intimacy and empathy' },
};

// Element compatibility between two charts
export const ELEMENT_COMPATIBILITY_WEIGHTS: Record<string, { weight: number; description: string }> = {
  fire_fire: { weight: 0.08, description: 'Fire + Fire: Exciting but potentially volatile' },
  fire_earth: { weight: 0.05, description: 'Fire + Earth: Fire inspires, Earth stabilizes' },
  fire_air: { weight: 0.12, description: 'Fire + Air: Air fans Fire - great chemistry' },
  fire_water: { weight: -0.05, description: 'Fire + Water: Steam - passion meets emotion, can clash' },
  earth_earth: { weight: 0.18, description: 'Earth + Earth: Stable, sensual, built to last' },
  earth_air: { weight: 0.00, description: 'Earth + Air: Practical meets intellectual - needs work' },
  earth_water: { weight: 0.15, description: 'Earth + Water: Nurturing and stable - very compatible' },
  air_air: { weight: 0.05, description: 'Air + Air: Great communication, may lack grounding' },
  air_water: { weight: -0.03, description: 'Air + Water: Mind meets heart - can misunderstand' },
  water_water: { weight: 0.12, description: 'Water + Water: Deep emotional bond, may lack practicality' },
};

// Modality balance (Cardinal/Fixed/Mutable)
export const MODALITY_DOMINANCE_WEIGHTS: Record<string, { weight: number; description: string; traits: string }> = {
  cardinal_dominant: { weight: 0.05, description: 'Cardinal Dominant (5+ Cardinal)', traits: 'Initiative-taking, leadership - may compete with partner' },
  fixed_dominant: { weight: 0.12, description: 'Fixed Dominant (5+ Fixed)', traits: 'Loyal, determined, stable - excellent for commitment' },
  mutable_dominant: { weight: -0.03, description: 'Mutable Dominant (5+ Mutable)', traits: 'Adaptable, flexible - may lack follow-through' },
  cardinal_lacking: { weight: -0.03, description: 'Cardinal Lacking (0-1 Cardinal)', traits: 'May struggle to initiate or lead in relationship' },
  fixed_lacking: { weight: -0.08, description: 'Fixed Lacking (0-1 Fixed)', traits: 'May struggle with commitment and perseverance' },
  mutable_lacking: { weight: -0.02, description: 'Mutable Lacking (0-1 Mutable)', traits: 'May be inflexible in relationship' },
};

// ============================================================================
// FERTILITY INDICATORS (Natal section)
// ============================================================================

// Signs associated with fertility - affects Moon, 5th house cusp, and Venus placement
export const FERTILITY_SIGN_WEIGHTS: Record<string, { weight: number; fertility: 'high' | 'moderate' | 'low'; description: string }> = {
  // Water signs - most fertile (emotional, nurturing)
  cancer: { weight: 0.05, fertility: 'high', description: 'Most fertile sign - nurturing, maternal/paternal energy' },
  scorpio: { weight: 0.08, fertility: 'high', description: 'Highly fertile - intense reproductive energy' },
  pisces: { weight: 0.10, fertility: 'high', description: 'Fertile - creative, generative energy' },

  // Earth signs - fertile (physical, grounded)
  taurus: { weight: 0.08, fertility: 'high', description: 'Fertile - physical, sensual, earthy' },
  capricorn: { weight: -0.05, fertility: 'moderate', description: 'Moderately fertile - responsible parent energy' },
  virgo: { weight: 0.05, fertility: 'moderate', description: 'Moderately fertile - careful, health-conscious' },

  // Fire signs - moderate fertility
  sagittarius: { weight: 0.10, fertility: 'moderate', description: 'Moderately fertile - expansive, generous' },
  leo: { weight: 0.07, fertility: 'moderate', description: 'Moderately fertile - creative, loves children' },
  aries: { weight: 0.03, fertility: 'moderate', description: 'Moderately fertile - pioneering but impatient' },

  // Air signs - lower fertility (mental, detached)
  libra: { weight: 0.05, fertility: 'moderate', description: 'Moderately fertile - partnership-oriented' },
  gemini: { weight: -0.05, fertility: 'low', description: 'Less fertile - mental focus, restless' },
  aquarius: { weight: -0.08, fertility: 'low', description: 'Less fertile - detached, unconventional' },
};

// Fertility aspects in natal chart
export const FERTILITY_ASPECT_WEIGHTS: Array<{
  planet1: string;
  planet2: string;
  aspect: string;
  weight: number;
  description: string;
}> = [
  // Moon aspects (emotional readiness for children)
  { planet1: 'moon', planet2: 'jupiter', aspect: 'conjunction', weight: 0.15, description: 'Abundant fertility - expansion of nurturing' },
  { planet1: 'moon', planet2: 'jupiter', aspect: 'trine', weight: 0.20, description: 'Easy fertility - emotional generosity' },
  { planet1: 'moon', planet2: 'venus', aspect: 'conjunction', weight: 0.25, description: 'Fertile - love and nurturing combined' },
  { planet1: 'moon', planet2: 'venus', aspect: 'trine', weight: 0.25, description: 'Harmonious fertility' },
  { planet1: 'moon', planet2: 'saturn', aspect: 'square', weight: -0.25, description: 'Delayed fertility - emotional blocks' },
  { planet1: 'moon', planet2: 'saturn', aspect: 'opposition', weight: -0.20, description: 'Fertility challenges - fear of responsibility' },

  // Venus aspects (desire for children)
  { planet1: 'venus', planet2: 'jupiter', aspect: 'conjunction', weight: 0.10, description: 'Desires large family - abundance' },
  { planet1: 'venus', planet2: 'jupiter', aspect: 'trine', weight: 0.25, description: 'Lucky with children' },

  // Jupiter aspects (expansion, luck with children)
  { planet1: 'jupiter', planet2: 'saturn', aspect: 'trine', weight: 0.10, description: 'Balanced growth - responsible expansion' },

  // 5th house ruler aspects
  { planet1: 'sun', planet2: 'jupiter', aspect: 'conjunction', weight: 0.12, description: 'Creative fertility - vitality for children' },
  { planet1: 'sun', planet2: 'moon', aspect: 'trine', weight: 0.18, description: 'Harmonious masculine/feminine - easy conception' },
];

// ============================================================================
// COMPOSITE CHART WEIGHTS - SCORED WITH JUSTIFICATION
// ============================================================================
// These weights represent the composite chart's contribution to compatibility.
// Currently only COMPOSITE_SATURN_SIGN_WEIGHTS is actively used (in longevity scoring).
// The sign weights and aspect weights below are research-backed and ready for integration
// once composite scoring is validated against real match outcomes.
// Sources: Mona Riegger studies, Cafe Astrology, composite chart longevity research.

// Composite Sun Sign - Relationship identity and purpose
// Scoring rationale: Cardinal signs = marriage (Riegger study: cardinal houses most common for married couples).
// Venus/Moon-ruled signs favor domestic partnership. Fixed signs = stable but friendship-oriented.
// Mutable signs = short-lived encounters in composite research.
export const COMPOSITE_SUN_SIGN_WEIGHTS: Record<string, { weight: number; description: string; evidence: string }> = {
  Libra: { weight: 0.60, description: 'Cardinal + Venus-ruled: natural marriage sign, harmony-seeking, partnership identity', evidence: 'Riegger study: cardinal houses most common for married couples. Venus rulership = partnership-native.' },
  Cancer: { weight: 0.55, description: 'Cardinal + Moon-ruled: family-focused purpose, nurturing, home-building identity', evidence: 'Riegger study: cardinal = marriage. Moon rulership = domestic/family orientation. Best for 7th/4th house Sun.' },
  Taurus: { weight: 0.50, description: 'Fixed + Venus-ruled: stable, sensual, loyal — built for lasting commitment', evidence: 'Venus rulership = love/values. Fixed modality = staying power. Research: "thinks carefully about commitment."' },
  Capricorn: { weight: 0.45, description: 'Cardinal + Saturn-ruled: serious commitment, structured ambition together', evidence: 'Riegger study: cardinal = marriage. Saturn = longevity/structure. "Saturn challenging Sun often found in married couples."' },
  Pisces: { weight: 0.35, description: 'Mutable but Venus-exalted: spiritual, compassionate, selfless union', evidence: 'Venus exaltation = highest love expression. Mutable penalizes but spiritual devotion compensates.' },
  Leo: { weight: 0.25, description: 'Fixed + Sun-ruled: warm, loyal, creative — generous but ego-driven', evidence: 'Fixed = loyal/stable. Sun rulership = vitality. Risk: ego needs may overshadow partnership needs.' },
  Scorpio: { weight: 0.25, description: 'Fixed + Mars-ruled: intense commitment, deeply bonded or destructive', evidence: 'Fixed = committed. Mars/Pluto rulership = all-or-nothing intensity. Research: can be "best or worst."' },
  Aries: { weight: 0.12, description: 'Cardinal but Mars-ruled: dynamic start, but impulsive — needs maturity to last', evidence: 'Riegger: cardinal = marriage potential. But Mars rulership = impulsive, quick to start/leave.' },
  Virgo: { weight: 0.08, description: 'Mutable + Mercury-ruled: practical but critical, service-oriented', evidence: 'Riegger: mutable = short-lived encounters. Mercury = intellectual, not emotional bonding.' },
  Gemini: { weight: -0.05, description: 'Mutable + Mercury-ruled: communicative but changeable, may lack depth', evidence: 'Riegger: mutable = short-lived. Dual nature = changeable purpose. "May lack depth" per composite research.' },
  Sagittarius: { weight: -0.12, description: 'Mutable + Jupiter-ruled: growth-oriented but freedom-seeking, resists settling', evidence: 'Riegger: mutable = short-lived encounters. Jupiter = expansion away from commitment structures.' },
  Aquarius: { weight: -0.12, description: 'Fixed but Saturn-detrimented: unconventional, emotionally detached partnership', evidence: 'Saturn in detriment for relationship warmth. Research: "friendship-based" — resists traditional marriage.' },
};

// Composite Moon Sign - Emotional foundation and security of the relationship
// Scoring rationale: Moon = emotional safety in marriage. Domicile (Cancer) and exaltation (Taurus)
// are strongest. Water signs provide depth, Earth provides stability. Air/Fire can lack emotional security.
// Research: "The Moon represents feeling of emotional safety" — most important for marriage satisfaction.
export const COMPOSITE_MOON_SIGN_WEIGHTS: Record<string, { weight: number; description: string; evidence: string }> = {
  Cancer: { weight: 0.75, description: 'Moon domicile: deeply nurturing, home-focused, emotionally secure — ideal', evidence: 'Moon rules Cancer (domicile). Research: "both value family, compassion, understanding, and bliss." Strongest emotional placement.' },
  Taurus: { weight: 0.63, description: 'Moon exalted: stable, secure, sensual comfort — built for emotional longevity', evidence: 'Moon exalted in Taurus. Research: "one of Moon\'s favorite and most powerful places." Security-minded, builds lasting foundation.' },
  Pisces: { weight: 0.45, description: 'Water sign: deeply empathic, intuitive bond, spiritual emotional connection', evidence: 'Water element = emotional depth. Jupiter/Neptune rulership = spiritual connection. "Eager to build solid foundation."' },
  Libra: { weight: 0.38, description: 'Harmonious emotional balance, seeks peace — avoids drama', evidence: 'Venus-ruled = harmony in feelings. Cardinal = takes emotional initiative. Seeks equilibrium in conflicts.' },
  Leo: { weight: 0.25, description: 'Fixed + warm: generous emotional expression, loyal but needs appreciation', evidence: 'Fixed modality = emotional loyalty. Sun-ruled = warm expression. Risk: "nonstop need for spotlight" can drain partner.' },
  Scorpio: { weight: 0.20, description: 'Water sign: intense emotional depth, deeply bonded — but possessive', evidence: 'Water = emotional depth. Moon in fall technically, but intensity creates strong bonding. Risk: possessiveness.' },
  Capricorn: { weight: 0.12, description: 'Moon detriment but Saturn-mature: reserved yet reliable over time', evidence: 'Moon in detriment (Capricorn). However: "measured, stabilizing balance needed for true intimacy." Matures with time.' },
  Virgo: { weight: 0.08, description: 'Earth sign: practical emotional support, steady but not romantic', evidence: 'Earth = stability. Mercury-ruled = practical support. Not emotionally expressive but consistent.' },
  Gemini: { weight: -0.08, description: 'Air + mutable: intellectualizes feelings, emotionally changeable', evidence: 'Air element = detached from feelings. Mutable = changeable emotional state. "Needs variety" in emotional expression.' },
  Aries: { weight: -0.12, description: 'Moon in cardinal fire: emotionally impulsive, reactive — but direct', evidence: 'Fire + cardinal = reactive emotions. Research: "quick to react." Directness can be positive but burns hot.' },
  Sagittarius: { weight: -0.12, description: 'Mutable fire: optimistic but emotionally restless, avoids heavy scenes', evidence: 'Mutable fire = emotionally restless. Jupiter-ruled = avoids emotional heaviness. "Too out-there" for security needs.' },
  Aquarius: { weight: -0.25, description: 'Moon detriment: emotionally detached, prioritizes ideas over feelings', evidence: 'Moon in detriment (Aquarius). Research: "too out-there for sensible emotional needs." Prioritizes intellect over feeling.' },
};

// Composite Venus Sign - How the relationship expresses love and values
// Scoring rationale: Venus = love, harmony, values. Domicile (Taurus, Libra) and exaltation (Pisces) = strongest.
// Detriment (Aries, Scorpio) and fall (Virgo) = challenged love expression.
// Research: Venus determines "how values are conveyed through loyalty, commitment, and love's continual renewal."
export const COMPOSITE_VENUS_SIGN_WEIGHTS: Record<string, { weight: number; description: string; evidence: string }> = {
  Libra: { weight: 0.70, description: 'Venus domicile: harmonious, balanced, partnership-native — ideal marriage love', evidence: 'Venus rules Libra (domicile). Research: "excellent flirts, gentle lovers, true romantics, nonconfrontational." Partnership sign.' },
  Taurus: { weight: 0.63, description: 'Venus domicile: sensual, loyal, enduring — strongest for stability', evidence: 'Venus rules Taurus (domicile). Research: "strongest for marriage stability — emphasis on security, commitment, consistency."' },
  Pisces: { weight: 0.55, description: 'Venus exalted: romantic, selfless, spiritual devotion — highest idealism', evidence: 'Venus exalted in Pisces. Research: "incurable romantics, hopelessly in love with love." Deep spiritual/creative union.' },
  Cancer: { weight: 0.45, description: 'Water sign: nurturing, protective love, domestic warmth', evidence: 'Water element = emotional love. Research: "most dearly wants a home and family." Mutual devotion and nurturing.' },
  Leo: { weight: 0.30, description: 'Fixed fire: generous, demonstrative, big-hearted affection', evidence: 'Fixed = lasting love. Sun-ruled = warm, generous expression. Risk: needs constant admiration.' },
  Capricorn: { weight: 0.30, description: 'Saturn-ruled: committed, traditional, takes love seriously — enduring', evidence: 'Saturn = commitment structure. Earth = practical. Takes love seriously, traditional values, endures over time.' },
  Scorpio: { weight: 0.20, description: 'Venus detriment: intense passion, deeply loyal — but possessive/jealous', evidence: 'Venus in detriment (Scorpio). Intensity creates deep bond but also jealousy/control. All-or-nothing love.' },
  Virgo: { weight: 0.12, description: 'Venus fall: practical acts of service, steady but not romantic', evidence: 'Venus in fall (Virgo). Love through practical acts of service. Steady but "not romantic" in traditional sense.' },
  Gemini: { weight: 0.05, description: 'Air + mutable: playful, communicative — light but not deep', evidence: 'Air = intellectual love. Mutable = changeable. Playful but may lack emotional depth for long-term.' },
  Sagittarius: { weight: -0.05, description: 'Mutable fire: adventurous but free-spirited, may resist commitment', evidence: 'Mutable fire = restless in love. Jupiter-ruled = seeks expansion, not settling. "Free-spirited, adventurous."' },
  Aquarius: { weight: -0.08, description: 'Fixed air: unconventional, friendship-based — emotionally cool', evidence: 'Air element = cool love expression. Saturn-ruled = detached. Research: "unconventional, friendship-based love."' },
  Aries: { weight: -0.08, description: 'Venus detriment: passionate but impatient, self-focused in love', evidence: 'Venus in detriment (Aries). Mars-ruled = self-focused, impatient. Exciting start but may burn out quickly.' },
};

// Composite Mars Sign - Drive, passion, and conflict resolution style
// Scoring rationale: Mars = how the couple fights and resolves conflict (crucial for longevity).
// Exaltation (Capricorn) = constructive problem-solving. Domicile (Aries, Scorpio) = raw energy.
// Fall (Cancer) = worst for conflict — passive-aggressive. Detriment (Taurus, Libra) paradoxically
// good for marriage: Taurus = slow to anger, Libra = seeks peace.
// Research: "Mars trine Saturn = negativity can be dealt with constructively" (Capricorn energy).
export const COMPOSITE_MARS_SIGN_WEIGHTS: Record<string, { weight: number; description: string; evidence: string }> = {
  Capricorn: { weight: 0.38, description: 'Mars exalted: disciplined, works through problems — builds substance, lasting', evidence: 'Mars exalted in Capricorn. Research: "build a relationship of substance and integrity, likely to last a long time." Best conflict resolution.' },
  Taurus: { weight: 0.30, description: 'Mars detriment but slow to anger: steady passion, fewer fights — stubborn but stable', evidence: 'Despite Mars detriment, slow-to-anger = fewer marriage fights. Earth = grounded drive. Research: "steady drive, sensual."' },
  Libra: { weight: 0.25, description: 'Mars detriment but harmony-seeking: diplomatic conflict resolution, fewer blowups', evidence: 'Mars detriment but Venus-ruled = seeks harmony. Research: couple "seeks harmony, may avoid necessary conflicts" — net positive for marriage.' },
  Scorpio: { weight: 0.20, description: 'Mars domicile: intense passion, deeply committed — but power struggles possible', evidence: 'Mars rules Scorpio (domicile). Research: "intense sexuality, deep intimacy — watch out for passive-aggressive/power struggles."' },
  Leo: { weight: 0.12, description: 'Fixed fire: passionate, proud, loyal — direct but dramatic in conflict', evidence: 'Fixed = loyal energy. Sun-ruled = direct confrontation style. Dramatic but honest in conflict.' },
  Aries: { weight: 0.12, description: 'Mars domicile: direct, honest, quick fights/quick forgiveness — volatile but authentic', evidence: 'Mars rules Aries (domicile). Research: "will not accept repression — let it loose then let it go." Quick resolution style.' },
  Sagittarius: { weight: 0.08, description: 'Mutable fire: blunt, honest, forgives easily — but can be tactless', evidence: 'Jupiter-ruled = optimistic resolution. Mutable = adaptable. Blunt honesty can hurt but forgiveness comes easily.' },
  Virgo: { weight: 0.00, description: 'Mutable earth: practical drive, analytical in conflict — can be overly critical', evidence: 'Mercury-ruled = analytical conflict style. Earth = practical solutions. Risk: criticism replaces emotional processing.' },
  Gemini: { weight: -0.12, description: 'Mutable air: mental sparring, argues through words — can be passive-aggressive', evidence: 'Air + mutable = intellectualizes conflict. Mercury-ruled = word-based attacks. Can become passive-aggressive.' },
  Aquarius: { weight: -0.12, description: 'Fixed air: emotionally detached in conflict, rebellious — cold when angry', evidence: 'Fixed air = stubborn + detached. Saturn-ruled = cold withdrawal in conflict. "Rebellious" — resists compromise.' },
  Pisces: { weight: -0.15, description: 'Mutable water: passive, avoids conflict unhealthily — martyr tendencies', evidence: 'Mutable water = avoids confrontation. Neptune-ruled = confusion in conflict. Martyrdom replaces honest expression.' },
  Cancer: { weight: -0.20, description: 'Mars fall: passive-aggressive, moody, indirect — worst conflict resolution style', evidence: 'Mars in fall (Cancer). Research: "passive-aggressive tendencies, dramatic power struggles." Indirect = unresolved resentment builds.' },
};

// Composite Aspect Weights - Key aspects within the composite chart
// Scoring rationale: Based on astrological research on marriage indicators and divorce predictors.
// Sources: Cafe Astrology, Mona Riegger studies, composite chart longevity research.
// Key findings: Sun-Venus = "genuinely like each other" (top indicator).
// Venus-Jupiter = "instinct to make it official." Saturn harmonious = longevity.
// Moon-Saturn square = "emotional coldness" (top divorce indicator).
export const COMPOSITE_ASPECT_WEIGHTS: Array<{
  planet1: string;
  planet2: string;
  aspect: string;
  weight: number;
  description: string;
  evidence: string;
}> = [
  // Sun-Moon - core vitality meets emotional needs ("divine union")
  { planet1: 'sun', planet2: 'moon', aspect: 'conjunction', weight: 0.30, description: 'Divine union: male/female principle merged — true marriage of souls', evidence: 'Research: "real marriage of two souls — male and female." Sun conjunct Moon = new beginnings, divine union.' },
  { planet1: 'sun', planet2: 'moon', aspect: 'trine', weight: 0.25, description: 'Harmonious: compatible needs and identity — true love indicator', evidence: 'Research: "provides comfort and affection that strengthens the bond." Indicates compatibility and true love.' },
  { planet1: 'sun', planet2: 'moon', aspect: 'sextile', weight: 0.18, description: 'Supportive: comfortable affection, strengthens bond', evidence: 'Research: "helps a relationship significantly." Supportive harmony between identity and emotions.' },
  { planet1: 'sun', planet2: 'moon', aspect: 'square', weight: -0.15, description: 'Imbalance: tension between wants and needs — difficult for long-term', evidence: 'Research: "imbalance, usually difficult for long term, temporary." Tension between will and feeling.' },
  { planet1: 'sun', planet2: 'moon', aspect: 'opposition', weight: -0.08, description: 'Polarity: can complement or divide — requires awareness', evidence: 'Opposition = awareness polarity. Can create complementary dynamic or constant friction depending on maturity.' },

  // Sun-Venus - "genuinely like and value each other" (TOP marriage indicator)
  { planet1: 'sun', planet2: 'venus', aspect: 'conjunction', weight: 0.28, description: 'Top marriage indicator: genuine mutual liking and valuing — benefic relationship', evidence: 'Research: "when you see Venus-Sun, you know they genuinely like and value one another." 48-year marriage cited this as key factor.' },
  { planet1: 'sun', planet2: 'venus', aspect: 'trine', weight: 0.22, description: 'Natural affection: easy warmth, appreciation flows naturally', evidence: 'Harmonious Sun-Venus = natural warmth and appreciation. "Overall benefic nature of the marriage."' },
  { planet1: 'sun', planet2: 'venus', aspect: 'sextile', weight: 0.15, description: 'Compatible values: supportive love expression', evidence: 'Sextile = opportunity aspect. Sun-Venus sextile supports mutual appreciation with effort.' },
  { planet1: 'sun', planet2: 'venus', aspect: 'square', weight: -0.05, description: 'Values tension: love styles may clash but create growth', evidence: 'Mild tension between identity and love expression. Can create growth through values differences.' },
  { planet1: 'sun', planet2: 'venus', aspect: 'opposition', weight: 0.05, description: 'Attraction of opposites: complementary love expression', evidence: 'Research: Sun opposite Venus = "mutual admiration from complementary perspectives." Listed as marriage indicator.' },

  // Venus-Mars - love meets passion ("important glue" in the relationship)
  { planet1: 'venus', planet2: 'mars', aspect: 'conjunction', weight: 0.25, description: 'Passionate bond: love and desire united — hard to be "just friends"', evidence: 'Research: "passionate feelings are an important glue — hard for two to ever be just friends." Key attraction indicator.' },
  { planet1: 'venus', planet2: 'mars', aspect: 'trine', weight: 0.22, description: 'Easy passion: comfort and lazy pleasure, lessens competition', evidence: 'Research: "offers comfort and lazy pleasure, lessens competition, adds to creativity and productivity."' },
  { planet1: 'venus', planet2: 'mars', aspect: 'sextile', weight: 0.15, description: 'Compatible desire: giving and receiving is easy, creative productivity', evidence: 'Research: "giving and receiving is easy." Sextile = compatible romantic and sexual expression.' },
  { planet1: 'venus', planet2: 'mars', aspect: 'square', weight: 0.05, description: 'Tension glue: friction creates excitement — important relationship bond', evidence: 'Research: "passionate feelings aroused are important glue." Square = tension that maintains attraction/interest.' },
  { planet1: 'venus', planet2: 'mars', aspect: 'opposition', weight: 0.08, description: 'Magnetic pull: push-pull dynamic keeps passion alive', evidence: 'Opposition = magnetic attraction between love and desire. Push-pull dynamic maintains interest over time.' },

  // Venus-Moon - emotional attunement ("eager to meet each other's needs")
  { planet1: 'venus', planet2: 'moon', aspect: 'conjunction', weight: 0.22, description: 'Emotional love: deeply attuned, affectionate, cuddles and sweetness', evidence: 'Research: "emotionally-attuned, both eager to meet each other\'s needs. High degree of affection, cuddles, sweetness."' },
  { planet1: 'venus', planet2: 'moon', aspect: 'trine', weight: 0.18, description: 'Nurturing love: emotional needs met naturally, high affection', evidence: 'Research: Venus-Moon = "can truly bond a couple." Emotional needs met through love expression naturally.' },
  { planet1: 'venus', planet2: 'moon', aspect: 'sextile', weight: 0.12, description: 'Compatible care: supportive emotional expression of love', evidence: 'Backend research: "venus-moon-sextile: 32 points (BOOST: 12 + 20)." Validated in scoring system.' },
  { planet1: 'venus', planet2: 'moon', aspect: 'square', weight: -0.08, description: 'Emotional friction: love style clashes with emotional needs', evidence: 'Square = love expression doesn\'t align with emotional needs. Creates frustration in meeting partner\'s needs.' },

  // Venus-Jupiter - "instinct to make the relationship official and legal"
  { planet1: 'venus', planet2: 'jupiter', aspect: 'conjunction', weight: 0.25, description: 'Marriage trigger: abundance, generosity, faith — instinct to make it legal', evidence: 'Research: "instinct to make the relationship official and legal. Sense of abundance, generosity, faith in one another."' },
  { planet1: 'venus', planet2: 'jupiter', aspect: 'trine', weight: 0.20, description: 'Joyful love: pleasure, optimism, sense of abundance together', evidence: 'Research: Jupiter conjunct/trine/sextile Venus = "key marriage indicator." Joy and pleasure in partnership.' },
  { planet1: 'venus', planet2: 'jupiter', aspect: 'sextile', weight: 0.15, description: 'Supportive growth: love expands through shared beliefs and travel', evidence: 'Research: Venus-Jupiter sextile listed as marriage indicator. Love grows through shared experiences.' },
  { planet1: 'venus', planet2: 'jupiter', aspect: 'square', weight: 0.03, description: 'Over-indulgence: too much of a good thing, but still positive base', evidence: 'Jupiter square = excess. Still fundamentally benefic (both benefic planets) but may overdo pleasure/spending.' },

  // Saturn aspects - structure and longevity (key for marriage duration)
  { planet1: 'sun', planet2: 'saturn', aspect: 'conjunction', weight: 0.10, description: 'Karmic bond: serious, responsible — powerful impact on each person', evidence: 'Research: "Saturn challenging Sun often found in married couples — implies responsibility, powerful impact."' },
  { planet1: 'sun', planet2: 'saturn', aspect: 'trine', weight: 0.20, description: 'Stable foundation: mutual respect, supportive structure', evidence: 'Saturn trine = mature support. Research: "stable foundation, mutual respect." Key longevity indicator.' },
  { planet1: 'sun', planet2: 'saturn', aspect: 'sextile', weight: 0.15, description: 'Reliable support: mature partnership, shared responsibility', evidence: 'Venus sextile/trine/conjunct Saturn = marriage indicator per research. Reliable partnership structure.' },
  { planet1: 'sun', planet2: 'saturn', aspect: 'square', weight: -0.18, description: 'Frustration: "something is missing" — feels limited, obstacles', evidence: 'Research: "incredibly frustrating — something is missing, essential lack, repressed expressions, dissatisfaction."' },
  { planet1: 'sun', planet2: 'saturn', aspect: 'opposition', weight: -0.12, description: 'Power imbalance: relationship may feel like a burden', evidence: 'Research: "relationship may feel like a burden — fears/defenses put the relationship on hold."' },

  { planet1: 'moon', planet2: 'saturn', aspect: 'conjunction', weight: -0.05, description: 'Emotional reserve: feelings controlled, cautious — can mature over time', evidence: 'Saturn conjunction = emotional restraint. Can mature into stability but initially feels cold/controlled.' },
  { planet1: 'moon', planet2: 'saturn', aspect: 'trine', weight: 0.18, description: 'Emotional commitment: stable feelings, mature emotional security', evidence: 'Backend research: "saturn-moon-trine: 30 points (BOOST: 10 + 20)." Emotional maturity and commitment.' },
  { planet1: 'moon', planet2: 'saturn', aspect: 'sextile', weight: 0.12, description: 'Reliable emotions: supportive structure for feelings', evidence: 'Saturn sextile Moon = reliable emotional support. Builds trust through consistent emotional availability.' },
  { planet1: 'moon', planet2: 'saturn', aspect: 'square', weight: -0.22, description: 'DIVORCE INDICATOR: emotional coldness, feeling unloved — top risk factor', evidence: 'Research: TOP DIVORCE INDICATOR. "Emotional coldness, feeling unloved." Saturn harsh aspects = breakup predictors.' },
  { planet1: 'moon', planet2: 'saturn', aspect: 'opposition', weight: -0.15, description: 'Emotional distance: duty overshadows warmth — alienating', evidence: 'Research: "Saturn in harsh aspects with feminine planets = divorce/breakup indicators." Duty kills warmth.' },

  { planet1: 'venus', planet2: 'saturn', aspect: 'conjunction', weight: 0.12, description: 'Marriage indicator: committed love, reserved but enduring', evidence: 'Research: "Venus conjunct/sextile/trine Saturn = marriage indicator." Committed, reserved but lasting.' },
  { planet1: 'venus', planet2: 'saturn', aspect: 'trine', weight: 0.22, description: 'Lasting love: mature, stable affection — top longevity aspect', evidence: 'Backend: "saturn-venus-trine: 35 points." Research: listed as key marriage indicator. Top longevity aspect.' },
  { planet1: 'venus', planet2: 'saturn', aspect: 'sextile', weight: 0.15, description: 'Steady love: reliable commitment, grows deeper with time', evidence: 'Research: Venus-Saturn sextile = marriage indicator. Love deepens with time and shared responsibility.' },
  { planet1: 'venus', planet2: 'saturn', aspect: 'square', weight: -0.15, description: 'Love drought: affection feels restricted, relationship droughts', evidence: 'Research: "Venus/Mars in challenging aspect to Saturn = many droughts in affection, love, sexual expression."' },
  { planet1: 'venus', planet2: 'saturn', aspect: 'opposition', weight: -0.10, description: 'Duty vs pleasure: responsibility overshadows romance', evidence: 'Saturn opposition Venus = duty/responsibility conflicts with love/pleasure expression. Draining over time.' },

  // Mars-Saturn - conflict resolution capacity (crucial for longevity)
  { planet1: 'mars', planet2: 'saturn', aspect: 'trine', weight: 0.15, description: 'Constructive conflict: negativity dealt with maturely — key longevity factor', evidence: 'Research: "Mars trine Saturn = indication that negativity can be dealt with in a constructive manner." Key for lasting marriages.' },
  { planet1: 'mars', planet2: 'saturn', aspect: 'sextile', weight: 0.10, description: 'Managed drive: disciplined energy, works through problems together', evidence: 'Mars-Saturn sextile = disciplined approach to conflict. Problems worked through systematically.' },
  { planet1: 'mars', planet2: 'saturn', aspect: 'conjunction', weight: -0.05, description: 'Frustrated drive: ambition blocked, slow-burning resentment possible', evidence: 'Saturn conjunct Mars = drive feels blocked/frustrated. Can build slow-burning resentment if unaddressed.' },
  { planet1: 'mars', planet2: 'saturn', aspect: 'square', weight: -0.18, description: 'Volatile conflict: "things could turn ugly" — explosive under pressure', evidence: 'Research: "Mars square Saturn = things could turn ugly under the right circumstances." High conflict risk.' },
  { planet1: 'mars', planet2: 'saturn', aspect: 'opposition', weight: -0.15, description: 'Blocked passion: sexual/drive frustration, control battles', evidence: 'Research: "Mars/Saturn opposition in 1st/7th = particularly difficult." Even good aspects can\'t compensate.' },

  // Jupiter aspects - growth, optimism, expansion
  { planet1: 'sun', planet2: 'jupiter', aspect: 'conjunction', weight: 0.20, description: 'Expansive purpose: optimistic, growth-oriented relationship', evidence: 'Jupiter = expansion + optimism. Sun-Jupiter conjunction = relationship purpose is growth and abundance.' },
  { planet1: 'sun', planet2: 'jupiter', aspect: 'trine', weight: 0.18, description: 'Mutual uplift: shared growth, support for each other\'s goals', evidence: 'Jupiter trine Sun = natural mutual uplift. Both partners support each other\'s expansion and goals.' },
  { planet1: 'sun', planet2: 'jupiter', aspect: 'sextile', weight: 0.12, description: 'Supportive expansion: opportunities through partnership', evidence: 'Jupiter sextile = opportunities through effort. Partnership creates growth opportunities for both.' },

  // Challenging outer planet aspects - instability and power
  { planet1: 'sun', planet2: 'uranus', aspect: 'square', weight: -0.12, description: 'Unstable: unpredictable, sudden changes — on-again off-again', evidence: 'Uranus square = sudden disruptions. Research: relationship is "unpredictable, sudden changes." Commitment issues.' },
  { planet1: 'moon', planet2: 'uranus', aspect: 'square', weight: -0.15, description: 'Emotional chaos: insecurity, sudden emotional shifts', evidence: 'Research: "unaspected Moon or Moon with only challenging aspects = alienation and dissatisfaction."' },
  { planet1: 'venus', planet2: 'uranus', aspect: 'square', weight: -0.10, description: 'Love instability: exciting but on-again off-again pattern', evidence: 'Uranus square Venus = excitement but instability. On-again/off-again pattern prevents deepening.' },
  { planet1: 'mars', planet2: 'pluto', aspect: 'square', weight: -0.20, description: 'Power/control: trust issues, potential betrayal — destructive conflict', evidence: 'Research: "Mars-Pluto hard aspect = problems with trust rooted in actual betrayal. Covert power play." TOP risk factor.' },
  { planet1: 'mars', planet2: 'pluto', aspect: 'opposition', weight: -0.15, description: 'Power struggle: covert manipulation, control battles', evidence: 'Research: Mars-Pluto = "prevents both partners from being in harmony." Manipulation and control dynamics.' },
  { planet1: 'sun', planet2: 'pluto', aspect: 'square', weight: -0.12, description: 'Transformative intensity: obsessive dynamics, identity threats', evidence: 'Pluto square Sun = transformative but potentially obsessive. Identity feels threatened by partner\'s intensity.' },
];

// ============================================================================
// PROGRESSION & TRANSIT TIMING WEIGHTS - DISABLED
// ============================================================================
// DISABLED: These weights are NOT applied to the compatibility score.
// Reason: Progressions/transits are timing tools, not compatibility indicators.
// We have not validated that they improve match accuracy.
// Keeping the data structure for potential future use but all weights are inactive.
// To re-enable: integrate into the main scoring function in calculateSynastryV4().
//

// Progressed Moon through houses - sets the stage for partnership
// Scale: V3H aligned (~5-70 range for meaningful progressions)
export const PROGRESSED_MOON_HOUSE_WEIGHTS: Record<number, { weight: number; description: string; timing: string }> = {
  1: { weight: 5, description: 'Focus on self, identity', timing: '~2.5 years of self-discovery' },
  2: { weight: 10, description: 'Focus on values, resources', timing: '~2.5 years of building security' },
  3: { weight: 5, description: 'Focus on communication, learning', timing: '~2.5 years of mental growth' },
  4: { weight: 20, description: 'Focus on home, family roots', timing: '~2.5 years of establishing foundations' },
  5: { weight: 35, description: 'Focus on romance, creativity, children', timing: '~2.5 years of dating, romance blooms' },
  6: { weight: 5, description: 'Focus on health, work, service', timing: '~2.5 years of self-improvement' },
  7: { weight: 65, description: 'PEAK PARTNERSHIP WINDOW', timing: '~2.5 years most likely for marriage/commitment' },
  8: { weight: 40, description: 'Deep bonding, shared resources', timing: '~2.5 years of intimacy deepening' },
  9: { weight: 12, description: 'Focus on growth, travel, philosophy', timing: '~2.5 years of expansion' },
  10: { weight: 15, description: 'Focus on career, public life', timing: '~2.5 years of achievement focus' },
  11: { weight: 18, description: 'Focus on community, future goals', timing: '~2.5 years of social expansion' },
  12: { weight: 8, description: 'Focus on spirituality, endings', timing: '~2.5 years of reflection before new cycle' },
};

// Progressed planet aspects to natal points - major life shifts
// Scale: V3H aligned (~20-75 for significant progressions)
export const PROGRESSED_ASPECT_WEIGHTS: Array<{
  progressed: string;
  natal: string;
  aspect: string;
  weight: number;
  description: string;
  orb: number;
}> = [
  // Progressed Moon aspects (fastest, most common triggers)
  { progressed: 'moon', natal: 'descendant', aspect: 'conjunction', weight: 70, description: 'Peak marriage timing - Moon activates partnership point', orb: 1 },
  { progressed: 'moon', natal: 'venus', aspect: 'conjunction', weight: 55, description: 'Love activated - emotional opening to partnership', orb: 1 },
  { progressed: 'moon', natal: 'jupiter', aspect: 'conjunction', weight: 45, description: 'Expansion of emotional life - luck in love', orb: 1 },
  { progressed: 'moon', natal: 'sun', aspect: 'conjunction', weight: 40, description: 'New emotional cycle begins - identity shift', orb: 1 },
  { progressed: 'moon', natal: '7thRuler', aspect: 'conjunction', weight: 60, description: 'Partnership ruler activated - commitment likely', orb: 1 },

  // Progressed Venus aspects (love & relationship themes)
  { progressed: 'venus', natal: 'sun', aspect: 'conjunction', weight: 65, description: 'Love becomes central to identity - major love year', orb: 1 },
  { progressed: 'venus', natal: 'moon', aspect: 'conjunction', weight: 60, description: 'Emotional and love needs align - domestic happiness', orb: 1 },
  { progressed: 'venus', natal: 'ascendant', aspect: 'conjunction', weight: 55, description: 'Attractiveness peaks - drawing love to you', orb: 1 },
  { progressed: 'venus', natal: 'descendant', aspect: 'conjunction', weight: 72, description: 'Love meets partnership - marriage indicator', orb: 1 },
  { progressed: 'venus', natal: 'jupiter', aspect: 'conjunction', weight: 50, description: 'Abundant love - expansion of relationships', orb: 1 },
  { progressed: 'venus', natal: 'mars', aspect: 'conjunction', weight: 48, description: 'Passion ignites - strong attraction period', orb: 1 },

  // Progressed Sun aspects (slower, major life chapters)
  { progressed: 'sun', natal: 'venus', aspect: 'conjunction', weight: 75, description: 'Major love chapter - identity wrapped in relationship', orb: 1 },
  { progressed: 'sun', natal: 'descendant', aspect: 'conjunction', weight: 80, description: 'Partnership becomes life focus - strong marriage year', orb: 1 },
  { progressed: 'sun', natal: 'moon', aspect: 'conjunction', weight: 55, description: 'New life chapter - emotional renewal', orb: 1 },
  { progressed: 'sun', natal: '7thRuler', aspect: 'conjunction', weight: 65, description: '7th house ruler activated - partnership emphasis', orb: 1 },

  // Progressed Ascendant/Descendant (rare but powerful)
  { progressed: 'ascendant', natal: 'venus', aspect: 'conjunction', weight: 60, description: 'Venus rising - becoming more attractive/loving', orb: 1 },
  { progressed: 'descendant', natal: 'sun', aspect: 'conjunction', weight: 65, description: 'Identity merges with partnership - marriage likely', orb: 1 },
  { progressed: 'descendant', natal: 'venus', aspect: 'conjunction', weight: 70, description: 'Love point activates - strong commitment time', orb: 1 },
];

// Transit triggers - what activates the progressed themes
// Scale: V3H aligned (~15-60 for transits, less than progressions since transits are shorter)
export const TRANSIT_TRIGGER_WEIGHTS: Array<{
  planet: string;
  point: string;
  aspect: string;
  weight: number;
  description: string;
  duration: string;
}> = [
  // Jupiter transits (expansion, luck, opportunity)
  { planet: 'jupiter', point: 'descendant', aspect: 'conjunction', weight: 55, description: 'Partnership expansion - meeting someone, engagement', duration: '~2 weeks exact, ~2 months orb' },
  { planet: 'jupiter', point: 'venus', aspect: 'conjunction', weight: 50, description: 'Love blessing - abundance in relationships', duration: '~2 weeks exact' },
  { planet: 'jupiter', point: '7thHouse', aspect: 'transit', weight: 40, description: 'Year of partnership opportunity', duration: '~12 months through house' },
  { planet: 'jupiter', point: 'descendant', aspect: 'trine', weight: 35, description: 'Easy flow toward partnership', duration: '~2 weeks' },
  { planet: 'jupiter', point: 'venus', aspect: 'trine', weight: 32, description: 'Harmonious love opportunities', duration: '~2 weeks' },
  { planet: 'jupiter', point: '7thRuler', aspect: 'conjunction', weight: 45, description: 'Partnership ruler blessed', duration: '~2 weeks' },

  // Saturn transits (commitment, structure, making it official)
  { planet: 'saturn', point: 'descendant', aspect: 'conjunction', weight: 50, description: 'Commitment time - making it real/official', duration: '~3 weeks exact, can repeat' },
  { planet: 'saturn', point: 'venus', aspect: 'conjunction', weight: 25, description: 'Serious about love - may feel restricted then commit', duration: '~3 weeks' },
  { planet: 'saturn', point: '7thHouse', aspect: 'transit', weight: 35, description: '2.5 years of partnership lessons/commitment', duration: '~2.5 years through house' },
  { planet: 'saturn', point: 'descendant', aspect: 'trine', weight: 38, description: 'Easy commitment - mature partnership', duration: '~3 weeks' },
  { planet: 'saturn', point: '7thRuler', aspect: 'conjunction', weight: 42, description: 'Partnership area gets structured', duration: '~3 weeks' },

  // North Node transits (fate, destiny, karmic meetings)
  { planet: 'northNode', point: 'descendant', aspect: 'conjunction', weight: 58, description: 'Fated partnership meeting', duration: '~2-3 months' },
  { planet: 'northNode', point: 'venus', aspect: 'conjunction', weight: 52, description: 'Destined love connection', duration: '~2-3 months' },
  { planet: 'northNode', point: '7thHouse', aspect: 'transit', weight: 42, description: '~18 months of karmic partnership themes', duration: '~18 months' },

  // Uranus transits (sudden changes, unexpected meetings)
  { planet: 'uranus', point: 'descendant', aspect: 'conjunction', weight: 30, description: 'Sudden partnership change - unexpected meeting or breakup', duration: '~1 year on/off' },
  { planet: 'uranus', point: 'venus', aspect: 'conjunction', weight: 25, description: 'Unexpected love - unconventional attraction', duration: '~1 year' },

  // Pluto transits (transformation, deep bonding)
  { planet: 'pluto', point: 'descendant', aspect: 'conjunction', weight: 38, description: 'Transformative partnership - profound change through other', duration: '~2-3 years' },
  { planet: 'pluto', point: 'venus', aspect: 'conjunction', weight: 32, description: 'Deep transformation of love nature', duration: '~2-3 years' },
];

// Solar Arc directions (similar to progressions but 1°/year for all planets)
// Scale: V3H aligned (~35-70 for significant arcs)
export const SOLAR_ARC_WEIGHTS: Array<{
  arcPlanet: string;
  natalPoint: string;
  weight: number;
  description: string;
}> = [
  { arcPlanet: 'venus', natalPoint: 'descendant', weight: 68, description: 'Solar Arc Venus to Descendant - marriage year' },
  { arcPlanet: 'venus', natalPoint: 'ascendant', weight: 52, description: 'Solar Arc Venus rising - attracting love' },
  { arcPlanet: 'descendant', natalPoint: 'venus', weight: 62, description: 'Partnership point meets love' },
  { arcPlanet: 'descendant', natalPoint: 'sun', weight: 55, description: 'Partnership becomes identity focus' },
  { arcPlanet: 'sun', natalPoint: 'descendant', weight: 65, description: 'Identity moves toward partnership' },
  { arcPlanet: 'moon', natalPoint: 'descendant', weight: 48, description: 'Emotional need for partnership peaks' },
  { arcPlanet: 'jupiter', natalPoint: 'descendant', weight: 42, description: 'Expansion into partnership' },
  { arcPlanet: 'jupiter', natalPoint: 'venus', weight: 38, description: 'Love expansion, abundance' },
];

// Venus Return chart indicators (annual love reset)
// Scale: V3H aligned (~25-58 for return indicators)
export const VENUS_RETURN_WEIGHTS: Record<string, { weight: number; description: string }> = {
  'venus_in_7th': { weight: 48, description: 'Venus Return Venus in 7th - partnership year' },
  'venus_conjunct_dsc': { weight: 58, description: 'Venus Return Venus on Descendant - strong love year' },
  'jupiter_in_7th': { weight: 42, description: 'Venus Return Jupiter in 7th - expansion in partnerships' },
  'sun_in_7th': { weight: 30, description: 'Venus Return Sun in 7th - identity through partnership' },
  'moon_in_7th': { weight: 35, description: 'Venus Return Moon in 7th - emotional focus on partner' },
  'saturn_in_7th': { weight: 25, description: 'Venus Return Saturn in 7th - commitment themes' },
  'venus_trine_jupiter': { weight: 32, description: 'Venus-Jupiter trine - abundant love that year' },
  'venus_conjunct_jupiter': { weight: 45, description: 'Venus-Jupiter conjunction - very lucky in love' },
};

// ============================================================================
// PLANET-PAIR-ASPECT SCORES - Individual weights for each combination
// ============================================================================
//
// This matrix provides specific scores for each planet-planet-aspect combination.
// Format: PLANET_PAIR_SCORES[sortedPlanetPairKey][aspectType] = score
//
// Score guidelines (V3H-aligned scale):
// - Exceptionally positive: +70 to +95 (venus-venus, moon-venus trine)
// - Very positive: +45 to +69 (jupiter-venus, jupiter-moon)
// - Positive: +20 to +44 (mars-pluto trine, juno-jupiter)
// - Mildly positive: +5 to +19
// - Neutral: 0 to +4
// - Mildly challenging: -1 to -14
// - Challenging: -15 to -34 (chiron-mars, moon-northnode square)
// - Very challenging: -35 to -60 (saturn-venus square/quincunx, uranus-uranus square)

type PlanetPairScores = Record<string, Record<AspectType, number>>;

// Default fallback scores (used when no specific score exists)
const DEFAULT_ASPECT_SCORES: Record<AspectType, number> = {
  conjunction: 10,
  trine: 8,
  sextile: 5,
  copresence: 2, // 1/4 of conjunction - planets in same sign but not conjunct
  opposition: 1,
  square: -2,
  quincunx: -1,
};

// Comprehensive planet-pair-aspect scoring matrix
// Keys are sorted alphabetically: "mars-venus" not "venus-mars"
export const PLANET_PAIR_SCORES: PlanetPairScores = {
  // =========== SUN combinations (scaled 5x for V3H alignment) ===========
  'ascendant-sun': {
    conjunction: 25, trine: 20, sextile: 15, opposition: 30, square: -1, quincunx: 0
  },
  'chiron-sun': {
    conjunction: 20, trine: 35, sextile: 25, opposition: -1, square: -3, quincunx: -1
  },
  'jupiter-sun': {
    conjunction: 75, trine: 60, sextile: 40, opposition: 25, square: 0, quincunx: 0
  },
  'mars-sun': {
    conjunction: 30, trine: 50, sextile: 35, opposition: -2, square: -3, quincunx: -1
  },
  'mercury-sun': {
    conjunction: 50, trine: 40, sextile: 30, opposition: 15, square: 0, quincunx: 0
  },
  'moon-sun': {
    conjunction: 80, trine: 70, sextile: 50, opposition: 40, square: 10, quincunx: 5
  },
  'neptune-sun': {
    conjunction: 30, trine: 40, sextile: 25, opposition: -1, square: -3, quincunx: -1
  },
  'northnode-sun': {
    conjunction: 60, trine: 50, sextile: 35, opposition: 15, square: -1, quincunx: 0
  },
  'pluto-sun': {
    // V3H tuned: conjunction -10
    conjunction: -1, trine: 40, sextile: 25, opposition: -2, square: -4, quincunx: -2
  },
  'saturn-sun': {
    conjunction: 15, trine: 40, sextile: 35, opposition: -2, square: -3, quincunx: -1
  },
  'sun-sun': {
    // Reduced: age artifact, similar birthday penalty handles this
    conjunction: 20, trine: 15, sextile: 10, opposition: 5, square: 0, quincunx: 0, copresence: 10
  },
  'sun-uranus': {
    conjunction: 30, trine: 40, sextile: 25, opposition: -2, square: -3, quincunx: -1
  },
  'sun-venus': {
    conjunction: 70, trine: 50, sextile: 45, opposition: 30, square: 10, quincunx: 5
  },
  'juno-sun': {
    conjunction: 60, trine: 50, sextile: 35, opposition: 20, square: 0, quincunx: 0
  },

  // =========== MOON combinations (scaled 5x for V3H alignment) ===========
  'ascendant-moon': {
    conjunction: 30, trine: 30, sextile: 15, opposition: 60, square: -1, quincunx: -1
  },
  'chiron-moon': {
    conjunction: 10, trine: 30, sextile: 20, opposition: -2, square: -4, quincunx: -2
  },
  'jupiter-moon': {
    // V3H tuned: conjunction 45
    conjunction: 45, trine: 60, sextile: 45, opposition: 20, square: -2, quincunx: -1
  },
  'mars-moon': {
    conjunction: 15, trine: 40, sextile: 30, opposition: -3, square: -4, quincunx: -2
  },
  'mercury-moon': {
    conjunction: 50, trine: 45, sextile: 35, opposition: 15, square: -1, quincunx: 0
  },
  'moon-moon': {
    // Reduced: age correlated but kept moderate for emotional sync
    conjunction: 30, trine: 25, sextile: 18, opposition: 10, square: 0, quincunx: 0, copresence: 15
  },
  'moon-neptune': {
    // V3H tuned: opposition -50
    conjunction: 40, trine: 50, sextile: 35, opposition: -5, square: -2, quincunx: -1
  },
  'moon-northnode': {
    // V3H tuned: square -30
    conjunction: 60, trine: 50, sextile: 35, opposition: 15, square: -3, quincunx: 0
  },
  'moon-pluto': {
    conjunction: 20, trine: 35, sextile: 25, opposition: -3, square: -5, quincunx: -2
  },
  'moon-saturn': {
    conjunction: 0, trine: 35, sextile: 25, opposition: -3, square: -4, quincunx: -2
  },
  'moon-uranus': {
    // RFE divorce rank #4 (conjunction), #5 (square): emotional instability
    conjunction: -2, trine: 30, sextile: 20, opposition: -3, square: -4, quincunx: -2
  },
  'moon-venus': {
    // V3H tuned: trine 75
    conjunction: 75, trine: 75, sextile: 50, opposition: 30, square: 5, quincunx: 8
  },
  'juno-moon': {
    conjunction: 60, trine: 50, sextile: 35, opposition: 20, square: 0, quincunx: 0
  },

  // =========== VENUS combinations (scaled 5x for V3H alignment) ===========
  'ascendant-venus': {
    conjunction: 50, trine: 25, sextile: 15, opposition: 60, square: -1, quincunx: -1
  },
  'chiron-venus': {
    // V3H tuned: trine 20
    conjunction: 25, trine: 20, sextile: 30, opposition: -1, square: -3, quincunx: -1
  },
  'jupiter-venus': {
    // V3H tuned: conjunction 60
    conjunction: 60, trine: 70, sextile: 10, opposition: 30, square: 5, quincunx: 5
  },
  'mars-venus': {
    // V3H tuned: sextile 70. Conjunction: RFE divorce rank #10 (passion burns too hot)
    conjunction: -1, trine: 70, sextile: 70, opposition: 25, square: 10, quincunx: 0
  },
  'mercury-venus': {
    conjunction: 50, trine: 40, sextile: 30, opposition: -2, square: -1, quincunx: 0
  },
  'neptune-venus': {
    conjunction: 50, trine: 60, sextile: 40, opposition: 10, square: -2, quincunx: -1
  },
  'northnode-venus': {
    conjunction: 60, trine: 50, sextile: 35, opposition: 20, square: 0, quincunx: 0
  },
  'pluto-venus': {
    conjunction: 40, trine: 50, sextile: 40, opposition: -1, square: -3, quincunx: -1
  },
  'saturn-venus': {
    conjunction: 25, trine: 40, sextile: 30, opposition: -2, square: -2, quincunx: -2
  },
  'uranus-venus': {
    // V3H tuned: conjunction 5
    conjunction: 5, trine: 40, sextile: 30, opposition: -1, square: -2, quincunx: -1
  },
  'venus-venus': {
    // Reduced: age artifact, composite Venus scoring boosted instead
    conjunction: 25, trine: 20, sextile: 15, opposition: 8, square: 0, quincunx: 0, copresence: 12
  },
  'juno-venus': {
    conjunction: 70, trine: 60, sextile: 45, opposition: 25, square: 5, quincunx: 0
  },

  // =========== MARS combinations (scaled 5x for V3H alignment) ===========
  'ascendant-mars': {
    conjunction: 20, trine: 25, sextile: 20, opposition: 15, square: -2, quincunx: -1
  },
  'chiron-mars': {
    // V3H tuned: conjunction -30
    conjunction: -3, trine: 25, sextile: 15, opposition: -3, square: -5, quincunx: -2
  },
  'jupiter-mars': {
    conjunction: 50, trine: 60, sextile: 40, opposition: 10, square: -1, quincunx: -1
  },
  'mars-mars': {
    // Reduced: age artifact, composite Mars scoring boosted instead
    conjunction: 18, trine: 15, sextile: 12, opposition: 5, square: 0, quincunx: 0, copresence: 9
  },
  'mars-mercury': {
    conjunction: 55, trine: 40, sextile: 35, opposition: 0, square: -2, quincunx: -1
  },
  'mars-neptune': {
    conjunction: 15, trine: 30, sextile: 20, opposition: -2, square: -3, quincunx: -2
  },
  'mars-northnode': {
    conjunction: 40, trine: 45, sextile: 30, opposition: 10, square: -1, quincunx: -1
  },
  'mars-pluto': {
    // V3H tuned: trine 25
    conjunction: 25, trine: 25, sextile: 25, opposition: -3, square: -4, quincunx: -2
  },
  'mars-saturn': {
    // V3H tuned: opposition -50
    conjunction: -1, trine: 45, sextile: 32, opposition: -5, square: -5, quincunx: -2
  },
  'mars-uranus': {
    conjunction: 20, trine: 35, sextile: 25, opposition: -3, square: -4, quincunx: -2
  },
  'juno-mars': {
    conjunction: 40, trine: 50, sextile: 35, opposition: 10, square: -1, quincunx: -1
  },

  // =========== MERCURY combinations (scaled 5x for V3H alignment) ===========
  'ascendant-mercury': {
    conjunction: 30, trine: 15, sextile: 20, opposition: 30, square: -2, quincunx: -1
  },
  'chiron-mercury': {
    conjunction: 25, trine: 35, sextile: 25, opposition: -1, square: -2, quincunx: -1
  },
  'jupiter-mercury': {
    conjunction: 60, trine: 50, sextile: 35, opposition: 20, square: 0, quincunx: 0
  },
  'mercury-mercury': {
    // Reduced: age artifact
    conjunction: 22, trine: 18, sextile: 14, opposition: 8, square: 0, quincunx: 0, copresence: 11
  },
  'mercury-neptune': {
    conjunction: 25, trine: 35, sextile: 25, opposition: -1, square: -2, quincunx: -1
  },
  'mercury-northnode': {
    conjunction: 60, trine: 70, sextile: -4, opposition: -5, square: -1, quincunx: 15
  },
  'mercury-pluto': {
    conjunction: 8, trine: 40, sextile: 25, opposition: -1, square: -2, quincunx: -1
  },
  'mercury-saturn': {
    conjunction: 20, trine: 45, sextile: 30, opposition: -1, square: -2, quincunx: -1
  },
  'mercury-uranus': {
    conjunction: -2, trine: 30, sextile: 20, opposition: -2, square: -2, quincunx: -1
  },
  'juno-mercury': {
    conjunction: 40, trine: 35, sextile: 25, opposition: 15, square: 0, quincunx: 0
  },

  // =========== JUPITER combinations (scaled 5x for V3H alignment) ===========
  'ascendant-jupiter': {
    conjunction: 20, trine: 15, sextile: 5, opposition: 40, square: 10, quincunx: 0
  },
  'chiron-jupiter': {
    conjunction: 40, trine: 50, sextile: 35, opposition: 10, square: -1, quincunx: -1
  },
  'jupiter-jupiter': {
    // Heavily reduced: age artifact with no classifier value
    conjunction: 5, trine: 5, sextile: 3, opposition: 2, square: 0, quincunx: 0, copresence: 2
  },
  'jupiter-neptune': {
    conjunction: 50, trine: 60, sextile: 40, opposition: 15, square: -1, quincunx: 0
  },
  'jupiter-northnode': {
    conjunction: 60, trine: 50, sextile: 35, opposition: 20, square: 0, quincunx: 0
  },
  'jupiter-pluto': {
    conjunction: 40, trine: 50, sextile: 35, opposition: 10, square: -1, quincunx: -1
  },
  'jupiter-saturn': {
    conjunction: -2, trine: 50, sextile: 35, opposition: -1, square: -2, quincunx: -1
  },
  'jupiter-uranus': {
    conjunction: 40, trine: 50, sextile: 35, opposition: 10, square: -1, quincunx: 0
  },
  'juno-jupiter': {
    // V3H tuned: conjunction 35
    conjunction: 35, trine: 50, sextile: 35, opposition: 20, square: 0, quincunx: 0
  },

  // =========== SATURN combinations (scaled 5x for V3H alignment) ===========
  'ascendant-saturn': {
    conjunction: -2, trine: 30, sextile: 15, opposition: -3, square: -2, quincunx: -1
  },
  'chiron-saturn': {
    conjunction: 0, trine: 30, sextile: 20, opposition: -2, square: -3, quincunx: -2
  },
  'neptune-saturn': {
    conjunction: 15, trine: 30, sextile: 20, opposition: -1, square: -2, quincunx: -1
  },
  'northnode-saturn': {
    conjunction: 30, trine: 45, sextile: 30, opposition: 0, square: -2, quincunx: -1
  },
  'pluto-saturn': {
    conjunction: 20, trine: 35, sextile: 25, opposition: -2, square: -3, quincunx: -1
  },
  'saturn-saturn': {
    // Reduced generational noise, but opposition kept: validated 179% divorce predictor
    conjunction: 5, trine: 8, sextile: 5, opposition: -40, square: -3, quincunx: -1
  },
  'saturn-uranus': {
    conjunction: 10, trine: 10, sextile: 5, opposition: -2, square: -2, quincunx: 0
  },
  'juno-saturn': {
    conjunction: 30, trine: 45, sextile: 30, opposition: 0, square: -2, quincunx: -1
  },

  // =========== OUTER PLANET combinations (scaled 5x for V3H alignment) ===========
  'chiron-chiron': {
    conjunction: 18, trine: 20, sextile: 15, opposition: 0, square: -1, quincunx: 0
  },
  'chiron-neptune': {
    conjunction: 25, trine: 35, sextile: 25, opposition: 0, square: -1, quincunx: -1
  },
  'chiron-northnode': {
    conjunction: 40, trine: 40, sextile: 30, opposition: 10, square: -1, quincunx: 0
  },
  'chiron-pluto': {
    conjunction: 20, trine: 30, sextile: 20, opposition: -1, square: -2, quincunx: -1
  },
  'chiron-uranus': {
    conjunction: 20, trine: 30, sextile: 20, opposition: -1, square: -2, quincunx: -1
  },
  'neptune-neptune': {
    // Generational noise: near-zero value
    conjunction: 0, trine: 0, sextile: 0, opposition: -1, square: -1, quincunx: 0
  },
  'neptune-northnode': {
    conjunction: -3, trine: 15, sextile: 10, opposition: -2, square: -1, quincunx: 0
  },
  'neptune-pluto': {
    // Generational cross-outer: zeroed — era artifact from two-dataset comparison
    conjunction: 0, trine: 0, sextile: 0, opposition: 0, square: 0, quincunx: 0
  },
  'neptune-uranus': {
    conjunction: 0, trine: 0, sextile: 0, opposition: 0, square: 0, quincunx: 0
  },
  'northnode-northnode': {
    conjunction: 60, trine: 40, sextile: 30, opposition: 20, square: 0, quincunx: 0
  },
  'northnode-pluto': {
    conjunction: 35, trine: 40, sextile: 25, opposition: 5, square: -1, quincunx: -1
  },
  'northnode-uranus': {
    conjunction: 30, trine: 35, sextile: 25, opposition: 0, square: -1, quincunx: -1
  },
  'pluto-pluto': {
    // Generational noise: near-zero value
    conjunction: 2, trine: 2, sextile: 1, opposition: 0, square: 0, quincunx: 0
  },
  'pluto-uranus': {
    // Generational cross-outer: zeroed — era artifact from two-dataset comparison
    conjunction: 0, trine: 0, sextile: 0, opposition: 0, square: 0, quincunx: 0
  },
  'uranus-uranus': {
    conjunction: 0, trine: 0, sextile: 0, opposition: 0, square: 0, quincunx: 0
  },
  'juno-juno': {
    conjunction: 60, trine: 50, sextile: 35, opposition: 20, square: 0, quincunx: 0
  },
  'juno-northnode': {
    conjunction: 50, trine: 45, sextile: 30, opposition: 15, square: 0, quincunx: 0
  },
  'juno-pluto': {
    conjunction: 30, trine: 40, sextile: 25, opposition: -1, square: -2, quincunx: -1
  },
  'juno-neptune': {
    conjunction: 35, trine: 40, sextile: 30, opposition: 5, square: -1, quincunx: -1
  },
  'juno-uranus': {
    conjunction: 20, trine: 30, sextile: 20, opposition: -1, square: -2, quincunx: -1
  },
  'chiron-juno': {
    conjunction: 25, trine: 35, sextile: 25, opposition: -1, square: -2, quincunx: -1
  },
  'ascendant-ascendant': {
    conjunction: 20, trine: 30, sextile: 30, opposition: 50, square: -2, quincunx: 0
  },
  'ascendant-chiron': {
    conjunction: -2, trine: 20, sextile: 12, opposition: -3, square: -1, quincunx: -1
  },
  'ascendant-juno': {
    conjunction: 30, trine: 20, sextile: 10, opposition: 50, square: -2, quincunx: 0
  },
  'ascendant-neptune': {
    conjunction: -2, trine: 10, sextile: 5, opposition: -2, square: -1, quincunx: -1
  },
  'ascendant-northnode': {
    conjunction: 25, trine: 20, sextile: 15, opposition: 35, square: 12, quincunx: 0
  },
  'ascendant-pluto': {
    conjunction: -2, trine: 10, sextile: 5, opposition: -3, square: -2, quincunx: -1
  },
  'ascendant-uranus': {
    conjunction: -1, trine: 10, sextile: 5, opposition: -2, square: -1, quincunx: -1
  },
};

// Helper function to get score for a planet pair and aspect
export function getPlanetPairAspectScore(
  planet1: string,
  planet2: string,
  aspect: AspectType
): number {
  const p1 = planet1.toLowerCase();
  const p2 = planet2.toLowerCase();
  const [first, second] = [p1, p2].sort();
  const key = `${first}-${second}`;

  const pairScores = PLANET_PAIR_SCORES[key];
  if (pairScores && pairScores[aspect] !== undefined) {
    return pairScores[aspect];
  }

  // Fallback to default aspect scores
  return DEFAULT_ASPECT_SCORES[aspect];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function getSignFromLongitude(longitude: number): ZodiacSign {
  const signs: ZodiacSign[] = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const normalizedLong = normalizeAngle(longitude);
  const signIndex = Math.floor(normalizedLong / 30);
  return signs[signIndex];
}

function getOrbRange(orb: number): string {
  if (orb <= 3) return '0-3';
  if (orb <= 7) return '4-7';
  return '8-10';
}

// Get adjustment from loaded adjustments map
function getAdjustmentValue(adjustments: AdjustmentMap, key: string): number | null {
  const adj = adjustments[key];
  if (adj) {
    return adj.adjustment;
  }
  return null;
}

// Get aspect adjustment with orb range
function getAspectAdjustmentV4(
  adjustments: AdjustmentMap,
  planet1: string,
  planet2: string,
  aspectType: string,
  orb: number
): number | null {
  const orbRange = getOrbRange(orb);
  const key = generateContributionKey('aspect', {
    planet1,
    planet2,
    aspect: aspectType,
    orb
  });

  // Try the generated key first
  let adj = getAdjustmentValue(adjustments, key);
  if (adj !== null) return adj;

  // Also try manual key format with orb range
  const p1 = planet1.toLowerCase();
  const p2 = planet2.toLowerCase();
  const [first, second] = [p1, p2].sort();
  const manualKey = `aspect-${first}-${second}-${aspectType}-${orbRange}`;
  adj = getAdjustmentValue(adjustments, manualKey);
  if (adj !== null) return adj;

  // Try reverse order with orb range
  const reverseKey = `aspect-${second}-${first}-${aspectType}-${orbRange}`;
  adj = getAdjustmentValue(adjustments, reverseKey);
  if (adj !== null) return adj;

  // Try without orb range (applies to all orbs)
  const noOrbKey = `aspect-${first}-${second}-${aspectType}`;
  adj = getAdjustmentValue(adjustments, noOrbKey);
  if (adj !== null) return adj;

  // Try reverse without orb range
  const noOrbReverseKey = `aspect-${second}-${first}-${aspectType}`;
  return getAdjustmentValue(adjustments, noOrbReverseKey);
}

// Get house overlay adjustment data
function getHouseAdjustmentData(
  adjustments: AdjustmentMap,
  planet: string,
  house: number,
  planetOwner?: 'A' | 'B',
  houseOwner?: 'A' | 'B'
): AdjustmentData | null {
  const p = planet.toLowerCase();

  // Try simple format first: house-planet-house
  const simpleKey = `house-${p}-${house}`;
  if (adjustments[simpleKey]) return adjustments[simpleKey];

  // Try directional format: house-{owner}{planet}-in-{houseOwner}h{house}
  if (planetOwner && houseOwner) {
    const dirKey = `house-${planetOwner}${p}-in-${houseOwner}h${house}`;
    if (adjustments[dirKey]) return adjustments[dirKey];
  }

  // Try both directions as fallback
  const dirKeyAB = `house-A${p}-in-Bh${house}`;
  if (adjustments[dirKeyAB]) return adjustments[dirKeyAB];

  const dirKeyBA = `house-B${p}-in-Ah${house}`;
  if (adjustments[dirKeyBA]) return adjustments[dirKeyBA];

  return null;
}

// Get configuration pattern adjustment (e.g., config-similarBirthday)
function getConfigAdjustment(
  adjustments: AdjustmentMap,
  configId: string
): number | null {
  const key = `config-${configId}`;
  const adj = adjustments[key];
  if (adj) {
    return adj.adjustment; // Returns target value or -1 if disabled
  }
  return null;
}

// Check for similar birthdays (Sun-Sun within 5°)
// Returns the score adjustment if birthdays are too similar
function checkSimilarBirthdays(
  chartA: NatalChart,
  chartB: NatalChart,
  adjustments: AdjustmentMap
): { isSimilar: boolean; distance: number; score: number } {
  const sunA = getPlanetLongitude(chartA, 'sun');
  const sunB = getPlanetLongitude(chartB, 'sun');

  if (sunA === undefined || sunB === undefined) {
    return { isSimilar: false, distance: 0, score: 0 };
  }

  const diff = Math.abs(sunA - sunB);
  const distance = Math.min(diff, 360 - diff);

  // Similar birthday threshold: 10° = ~10 days
  const SIMILAR_BIRTHDAY_THRESHOLD = 10;

  // Skip penalty if birthdays are in different years (not actually born near each other)
  // If birth years are unknown, also skip — in real matchmaking, different years are the norm
  if (!chartA.birthYear || !chartB.birthYear || chartA.birthYear !== chartB.birthYear) {
    return { isSimilar: false, distance, score: 0 };
  }

  if (distance <= SIMILAR_BIRTHDAY_THRESHOLD) {
    // Check for adjustment (user may have disabled or changed the penalty)
    const adjustment = getConfigAdjustment(adjustments, 'similarBirthday');

    if (adjustment === -1) {
      // User disabled this pattern
      return { isSimilar: true, distance, score: 0 };
    }

    const score = adjustment !== null ? adjustment : CONFIGURATION_SCORES.similarBirthday;
    return { isSimilar: true, distance, score };
  }

  return { isSimilar: false, distance, score: 0 };
}

// Get the orb for a planet from adjustments or defaults
// The adjustment key is `planet-orb-{planet}` and stores the target value in tenths of degrees
function getPlanetOrb(planetName: string, adjustments?: AdjustmentMap): number {
  const name = planetName.toLowerCase();

  // Check if there's an adjustment for this planet's orb
  if (adjustments) {
    const orbKey = `planet-orb-${name}`;
    const adj = adjustments[orbKey];
    if (adj && adj.adjustment !== -1) {
      // adjustment IS the target value in tenths (e.g., 100 = 10°)
      return adj.adjustment / 10;
    }
  }

  // Fall back to default orb
  return PLANET_ORBS[name] ?? 3;
}

function getAspect(
  planet1Long: number,
  planet2Long: number,
  planet1Name?: string,
  planet2Name?: string,
  adjustments?: AdjustmentMap
): { type: AspectType; orb: number } | null {
  const diff = normalizeAngle(planet1Long - planet2Long);
  const distance = Math.min(diff, 360 - diff);

  // Get each planet's individual orb and use the MAXIMUM (not sum)
  // This means the larger planet's orb defines the allowable orb
  // Example: Sun (10°) to Pluto (2°) = 10° max orb
  const orb1 = planet1Name ? getPlanetOrb(planet1Name, adjustments) : 5;
  const orb2 = planet2Name ? getPlanetOrb(planet2Name, adjustments) : 5;
  const maxPlanetOrb = Math.max(orb1, orb2);

  const aspectOrder: AspectType[] = ['conjunction', 'opposition', 'trine', 'square', 'sextile', 'quincunx'];

  for (const aspectType of aspectOrder) {
    const targetAngle = ASPECT_ANGLES[aspectType];
    const actualOrb = Math.abs(distance - targetAngle);

    // Use the planet-based max orb for all aspect types
    if (actualOrb <= maxPlanetOrb) {
      return { type: aspectType, orb: actualOrb };
    }
  }

  // Check for copresence: same sign but not in a traditional aspect
  // Each sign is 30°, so planets in the same sign have longitudes within the same 30° segment
  const sign1 = Math.floor(planet1Long / 30);
  const sign2 = Math.floor(planet2Long / 30);

  if (sign1 === sign2) {
    // Same sign = copresence (planets share the same sign energy)
    // Return the actual distance as the "orb" for informational purposes
    return { type: 'copresence', orb: distance };
  }

  return null;
}

function getAspectScore(aspect: AspectType | null): number {
  if (!aspect) return 0;
  return ASPECT_SCORES[aspect];
}

function getPlanetLongitude(chart: NatalChart, planet: string): number | undefined {
  return chart.planets?.[planet]?.longitude;
}

function getPlanetSign(chart: NatalChart, planet: string): string | undefined {
  const sign = chart.planets?.[planet]?.sign;
  return sign?.toLowerCase();
}

function getAscendant(chart: NatalChart): number | undefined {
  return chart.angles?.ascendant;
}

function getHouseCusps(chart: NatalChart): number[] | null {
  if (!chart.houses) return null;

  if (Array.isArray(chart.houses)) {
    return chart.houses;
  }

  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) {
    const key = `house_${i}`;
    const altKey = i.toString();
    const value = (chart.houses as Record<string, number>)[key] ?? (chart.houses as Record<string, number>)[altKey];
    if (value !== undefined) {
      cusps.push(value);
    }
  }
  return cusps.length === 12 ? cusps : null;
}

// Whole Sign Houses: The sign containing the Ascendant = 1st house,
// and each subsequent sign = next house
function getHouseForPlanetWholeSign(planetLongitude: number, ascendant: number): number {
  // Get sign index (0-11) for both
  const ascSign = Math.floor(ascendant / 30) % 12;
  const planetSign = Math.floor(planetLongitude / 30) % 12;

  // Calculate house (1-12) based on sign distance from Ascendant sign
  let house = ((planetSign - ascSign + 12) % 12) + 1;
  return house;
}

// Legacy cusp-based method (for Placidus, Koch, etc.)
function getHouseForPlanetCusps(longitude: number, houses: number[]): number {
  for (let i = 0; i < 12; i++) {
    const cusp = houses[i];
    const nextCusp = houses[(i + 1) % 12];

    if (nextCusp < cusp) {
      if (longitude >= cusp || longitude < nextCusp) return i + 1;
    } else {
      if (longitude >= cusp && longitude < nextCusp) return i + 1;
    }
  }
  return 1;
}

// Main function - uses Whole Sign houses (requires ascendant)
function getHouseForPlanet(longitude: number, housesOrAscendant: number[] | number): number {
  // If passed a number, it's the ascendant - use whole sign
  if (typeof housesOrAscendant === 'number') {
    return getHouseForPlanetWholeSign(longitude, housesOrAscendant);
  }
  // If passed an array, use cusp-based (legacy fallback)
  return getHouseForPlanetCusps(longitude, housesOrAscendant);
}

function calculateCompositePoint(longA: number, longB: number): number {
  const diff = Math.abs(longA - longB);

  if (diff > 180) {
    const midpoint = (longA + longB) / 2;
    return normalizeAngle(midpoint + 180);
  }

  return normalizeAngle((longA + longB) / 2);
}

function calculateCompositeChart(chartA: NatalChart, chartB: NatalChart): CompositeChart {
  const composite: CompositeChart = { planets: {} };
  const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

  for (const planet of planetNames) {
    const longA = getPlanetLongitude(chartA, planet);
    const longB = getPlanetLongitude(chartB, planet);

    if (longA !== undefined && longB !== undefined) {
      const compLong = calculateCompositePoint(longA, longB);
      composite.planets[planet] = {
        longitude: compLong,
        sign: getSignFromLongitude(compLong),
      };
    }
  }

  return composite;
}

// Element balance calculation
function calculateElementBalance(chartA: NatalChart, chartB: NatalChart): ElementBalance {
  const personalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars'];

  const countElements = (chart: NatalChart) => {
    const counts = { fire: 0, earth: 0, air: 0, water: 0 };
    for (const planet of personalPlanets) {
      let sign = getPlanetSign(chart, planet);
      if (!sign) {
        const long = getPlanetLongitude(chart, planet);
        if (long !== undefined) {
          sign = getSignFromLongitude(long).toLowerCase();
        }
      }
      if (sign && SIGN_ELEMENTS[sign]) {
        const element = SIGN_ELEMENTS[sign] as keyof typeof counts;
        counts[element]++;
      }
    }
    return counts;
  };

  const personA = countElements(chartA);
  const personB = countElements(chartB);

  let compatibility = 0;
  const matchingElements: ElementMatchEntry[] = [];

  const getDominant = (counts: typeof personA) => {
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  const dominantA = getDominant(personA);
  const dominantB = getDominant(personB);

  // Use ELEMENT_COMPATIBILITY_WEIGHTS for pair-specific scoring
  const getPairKey = (a: string, b: string) => {
    const [first, second] = [a, b].sort();
    return `${first}_${second}`;
  };
  const pairKey = getPairKey(dominantA, dominantB);
  const pairWeight = ELEMENT_COMPATIBILITY_WEIGHTS[pairKey];

  if (dominantA === dominantB) {
    // Same element: use pair weight (boosted) or fallback to 0.35
    const bonus = pairWeight ? Math.max(0.35, pairWeight.weight * 3 + 0.30) : 0.35;
    compatibility += bonus;
    matchingElements.push({ name: `Both ${dominantA}-dominant (shared element, strong compatibility)`, weight: bonus });
  } else if (COMPATIBLE_ELEMENTS[dominantA]?.includes(dominantB)) {
    // Compatible elements (fire-air, earth-water): use pair weight or fallback
    const bonus = pairWeight ? Math.max(0.25, pairWeight.weight * 2.5 + 0.20) : 0.25;
    compatibility += bonus;
    matchingElements.push({ name: `${dominantA.charAt(0).toUpperCase() + dominantA.slice(1)}-${dominantB} compatibility`, weight: bonus });
  } else if (pairWeight && pairWeight.weight < 0) {
    // Incompatible elements (fire-water, earth-air)
    compatibility += pairWeight.weight;
    matchingElements.push({ name: `${dominantA.charAt(0).toUpperCase() + dominantA.slice(1)}-${dominantB}: ${pairWeight.description}`, weight: pairWeight.weight });
  }

  for (const elem of ['fire', 'earth', 'air', 'water'] as const) {
    const diff = Math.abs(personA[elem] - personB[elem]);
    if (diff <= 1 && (personA[elem] >= 2 || personB[elem] >= 2)) {
      compatibility += 0.1;
      matchingElements.push({ name: `Similar ${elem} (${personA[elem]} vs ${personB[elem]})`, weight: 0.1 });
    }
  }

  const maxA = Math.max(personA.fire, personA.earth, personA.air, personA.water);
  const maxB = Math.max(personB.fire, personB.earth, personB.air, personB.water);
  if (maxA <= 3 && maxB <= 3) {
    compatibility += 0.1;
    matchingElements.push({ name: `Both charts balanced (no extreme element)`, weight: 0.1 });
  }

  return {
    personA,
    personB,
    compatibility: Math.min(1, compatibility),
    matchingElements,
    dominantA,
    dominantB,
  };
}

// Natal balance calculation
function calculateNatalBalance(chartA: NatalChart, chartB: NatalChart): NatalBalanceValidation {
  const calculateForChart = (chart: NatalChart) => {
    const planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    let harmony = 0;
    let tension = 0;

    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const longA = getPlanetLongitude(chart, planets[i]);
        const longB = getPlanetLongitude(chart, planets[j]);
        if (longA === undefined || longB === undefined) continue;

        const aspect = getAspect(longA, longB, planets[i], planets[j]);
        if (aspect) {
          if (aspect.type === 'trine' || aspect.type === 'sextile') {
            harmony++;
          } else if (aspect.type === 'square' || aspect.type === 'opposition') {
            tension++;
          }
        }
      }
    }

    return { harmony, tension, balance: harmony - tension };
  };

  const natalA = calculateForChart(chartA);
  const natalB = calculateForChart(chartB);

  const combinedBalance = natalA.balance + natalB.balance;

  let rating: NatalBalanceValidation['rating'];
  if (combinedBalance >= 4) {
    rating = 'EXCELLENT';
  } else if (combinedBalance >= 1) {
    rating = 'GOOD';
  } else if (combinedBalance >= -2) {
    rating = 'MODERATE';
  } else {
    rating = 'CHALLENGING';
  }

  return {
    harmonyA: natalA.harmony,
    tensionA: natalA.tension,
    balanceA: natalA.balance,
    harmonyB: natalB.harmony,
    tensionB: natalB.tension,
    balanceB: natalB.balance,
    combinedBalance,
    rating,
  };
}

function checkMercuryNorthNode(chart: NatalChart, adjustments: AdjustmentMap): { aspect: string | null; score: number } {
  const mercuryLong = getPlanetLongitude(chart, 'mercury');
  const northNodeLong = getPlanetLongitude(chart, 'northnode') ?? getPlanetLongitude(chart, 'north_node');

  if (mercuryLong === undefined || northNodeLong === undefined) {
    return { aspect: null, score: 0 };
  }

  const aspect = getAspect(mercuryLong, northNodeLong, 'mercury', 'northnode');
  if (!aspect) {
    return { aspect: null, score: 0 };
  }

  const adjustment = getAspectAdjustmentV4(adjustments, 'mercury', 'northnode', aspect.type, aspect.orb);
  if (adjustment === -1) {
    return { aspect: null, score: 0 };
  }
  if (adjustment !== null) {
    return { aspect: aspect.type, score: adjustment / 30 }; // adjustment is target score, convert to scale
  }

  const weight = MERCURY_NORTHNODE_WEIGHTS[aspect.type] ?? 0;
  const orbFactor = 1 - (aspect.orb / 10);
  const score = weight * Math.max(0.5, orbFactor);

  return { aspect: aspect.type, score };
}

function checkLongevityFactors(chartA: NatalChart, chartB: NatalChart, adjustments: AdjustmentMap): LongevityValidation {
  const mercuryNorthNodeA = checkMercuryNorthNode(chartA, adjustments);
  const mercuryNorthNodeB = checkMercuryNorthNode(chartB, adjustments);

  const composite = calculateCompositeChart(chartA, chartB);
  const compositeSaturnSign = composite.planets.saturn?.sign as ZodiacSign ?? null;
  const compositeSaturnScore = compositeSaturnSign
    ? COMPOSITE_SATURN_SIGN_WEIGHTS[compositeSaturnSign] ?? 0
    : 0;

  // Build breakdown of contributing factors
  const breakdown: LongevityBreakdownItem[] = [];
  let factorsChecked = 0;
  let factorsFound = 0;

  // Helper to check synastry aspects for longevity
  const checkLongevityAspect = (
    planet1: string,
    planet2: string,
    weights: Record<string, number>,
    factorName: string,
    descriptions: Record<string, string>
  ) => {
    factorsChecked++;
    const longA = getPlanetLongitude(chartA, planet1);
    const longB = getPlanetLongitude(chartB, planet2);
    if (longA === undefined || longB === undefined) return 0;

    const aspect = getAspect(longA, longB, planet1, planet2);
    if (!aspect) return 0;

    const weight = weights[aspect.type];
    if (weight === undefined) return 0;

    factorsFound++;
    const orbFactor = 1 - (aspect.orb / 10);
    const score = weight * Math.max(0.5, orbFactor);

    breakdown.push({
      factor: `${factorName} (${aspect.type})`,
      description: descriptions[aspect.type] || `${planet1}-${planet2} ${aspect.type}`,
      score,
      impact: score > 0.05 ? 'positive' : score < -0.05 ? 'negative' : 'neutral',
    });

    return score;
  };

  // 1. Mercury-North Node (both directions)
  if (mercuryNorthNodeA.aspect) {
    factorsFound++;
    const aspectDescriptions: Record<string, string> = {
      trine: 'harmonious mental alignment with life path',
      conjunction: 'strong mental connection to destiny',
      sextile: 'opportunity for mental growth',
      opposition: 'mental patterns oppose life direction',
      square: 'challenging mental patterns vs. destiny',
      quincunx: 'awkward fit between thinking and life path',
    };
    breakdown.push({
      factor: `A's Mercury ${mercuryNorthNodeA.aspect} North Node`,
      description: aspectDescriptions[mercuryNorthNodeA.aspect] || 'affects communication',
      score: mercuryNorthNodeA.score,
      impact: mercuryNorthNodeA.score > 0.05 ? 'positive' : mercuryNorthNodeA.score < -0.05 ? 'negative' : 'neutral',
    });
  }
  factorsChecked++;

  if (mercuryNorthNodeB.aspect) {
    factorsFound++;
    const aspectDescriptions: Record<string, string> = {
      trine: 'harmonious mental alignment with life path',
      conjunction: 'strong mental connection to destiny',
      sextile: 'opportunity for mental growth',
      opposition: 'mental patterns oppose life direction',
      square: 'challenging mental patterns vs. destiny',
      quincunx: 'awkward fit between thinking and life path',
    };
    breakdown.push({
      factor: `B's Mercury ${mercuryNorthNodeB.aspect} North Node`,
      description: aspectDescriptions[mercuryNorthNodeB.aspect] || 'affects communication',
      score: mercuryNorthNodeB.score,
      impact: mercuryNorthNodeB.score > 0.05 ? 'positive' : mercuryNorthNodeB.score < -0.05 ? 'negative' : 'neutral',
    });
  }
  factorsChecked++;

  // 2. Composite Saturn
  if (compositeSaturnSign) {
    factorsFound++;
    const saturnDescriptions: Record<ZodiacSign, string> = {
      Capricorn: 'Saturn at home - strong structural foundation',
      Aquarius: 'Saturn comfortable - modern commitment works',
      Sagittarius: 'Saturn adventurous - shared growth strengthens bond',
      Pisces: 'Saturn compassionate - spiritual connection supports longevity',
      Scorpio: 'Saturn intense - deep transformation possible',
      Aries: 'Saturn in action - needs effort to build structure',
      Libra: 'Saturn exalted - partnership ideals need grounding',
      Virgo: 'Saturn critical - perfectionism may strain',
      Taurus: 'Saturn stubborn - resistance to change',
      Gemini: 'Saturn scattered - inconsistent structure',
      Leo: 'Saturn in fall - ego may undermine partnership',
      Cancer: 'Saturn in detriment - emotional security unstable',
    };
    breakdown.push({
      factor: `Composite Saturn in ${compositeSaturnSign}`,
      description: saturnDescriptions[compositeSaturnSign],
      score: compositeSaturnScore,
      impact: compositeSaturnScore > 0.1 ? 'positive' : compositeSaturnScore < -0.1 ? 'negative' : 'neutral',
    });
  }
  factorsChecked++;

  // 2b. Composite Sun - relationship identity (research: 26% prediction importance)
  const compositeSunSign = composite.planets.sun?.sign as ZodiacSign;
  let compositeSunScore = 0;
  if (compositeSunSign && COMPOSITE_SUN_SIGN_WEIGHTS[compositeSunSign]) {
    factorsFound++;
    const sunWeight = COMPOSITE_SUN_SIGN_WEIGHTS[compositeSunSign];
    compositeSunScore = sunWeight.weight; // Already 0-1 scale, matches other longevity factors
    breakdown.push({
      factor: `Composite Sun in ${compositeSunSign}`,
      description: sunWeight.description,
      score: compositeSunScore,
      impact: compositeSunScore > 0.1 ? 'positive' : compositeSunScore < -0.05 ? 'negative' : 'neutral',
    });
  }
  factorsChecked++;

  // 2c. Composite Moon - emotional foundation
  const compositeMoonSign = composite.planets.moon?.sign as ZodiacSign;
  let compositeMoonScore = 0;
  if (compositeMoonSign && COMPOSITE_MOON_SIGN_WEIGHTS[compositeMoonSign]) {
    factorsFound++;
    const moonWeight = COMPOSITE_MOON_SIGN_WEIGHTS[compositeMoonSign];
    compositeMoonScore = moonWeight.weight;
    breakdown.push({
      factor: `Composite Moon in ${compositeMoonSign}`,
      description: moonWeight.description,
      score: compositeMoonScore,
      impact: compositeMoonScore > 0.1 ? 'positive' : compositeMoonScore < -0.05 ? 'negative' : 'neutral',
    });
  }
  factorsChecked++;

  // 2d. Composite Venus - love expression
  const compositeVenusSign = composite.planets.venus?.sign as ZodiacSign;
  let compositeVenusScore = 0;
  if (compositeVenusSign && COMPOSITE_VENUS_SIGN_WEIGHTS[compositeVenusSign]) {
    factorsFound++;
    const venusWeight = COMPOSITE_VENUS_SIGN_WEIGHTS[compositeVenusSign];
    compositeVenusScore = venusWeight.weight;
    breakdown.push({
      factor: `Composite Venus in ${compositeVenusSign}`,
      description: venusWeight.description,
      score: compositeVenusScore,
      impact: compositeVenusScore > 0.1 ? 'positive' : compositeVenusScore < -0.05 ? 'negative' : 'neutral',
    });
  }
  factorsChecked++;

  // 2e. Composite Mars - conflict resolution
  const compositeMarsSign = composite.planets.mars?.sign as ZodiacSign;
  let compositeMarsScore = 0;
  if (compositeMarsSign && COMPOSITE_MARS_SIGN_WEIGHTS[compositeMarsSign]) {
    factorsFound++;
    const marsWeight = COMPOSITE_MARS_SIGN_WEIGHTS[compositeMarsSign];
    compositeMarsScore = marsWeight.weight;
    breakdown.push({
      factor: `Composite Mars in ${compositeMarsSign}`,
      description: marsWeight.description,
      score: compositeMarsScore,
      impact: compositeMarsScore > 0.05 ? 'positive' : compositeMarsScore < -0.05 ? 'negative' : 'neutral',
    });
  }
  factorsChecked++;

  // 3. Mars-Mars (reduced - likely age artifact)
  const marsScore = checkLongevityAspect('mars', 'mars', {
    conjunction: 0.15, trine: 0.12, sextile: 0.08, opposition: 0.20, square: 0.35, quincunx: 0.10
  }, 'Mars-Mars', {
    conjunction: 'shared drive (reduced: likely age artifact)',
    trine: 'harmonious energy (reduced: likely age artifact)',
    sextile: 'compatible action styles',
    opposition: 'conflicting drives create tension',
    square: 'friction in how you take action',
    quincunx: 'mismatched energy levels',
  });

  // 4. Saturn-Sun (commitment indicator)
  const saturnSunScore = checkLongevityAspect('saturn', 'sun', {
    conjunction: 0.30, trine: 0.48, sextile: 0.35, opposition: 0.15, square: 0.30, quincunx: 0.10
  }, 'Saturn-Sun', {
    conjunction: 'strong sense of duty to relationship',
    trine: 'mature, stable commitment - top marriage indicator',
    sextile: 'supportive structure for growth',
    opposition: 'tension between freedom and responsibility',
    square: 'restriction feels burdensome',
    quincunx: 'awkward balance of authority',
  });

  // 5. Saturn-Moon (emotional stability)
  const saturnMoonScore = checkLongevityAspect('saturn', 'moon', {
    conjunction: 0.15, trine: 0.40, sextile: 0.25, opposition: 0.25, square: 0.40, quincunx: 0.15
  }, 'Saturn-Moon', {
    conjunction: 'emotional security through structure',
    trine: 'stable emotional foundation',
    sextile: 'practical emotional support',
    opposition: 'coldness vs emotional needs',
    square: 'emotional restriction or criticism',
    quincunx: 'awkward emotional boundaries',
  });

  // 6. Sun-Moon (basic compatibility for longevity)
  const sunMoonScore = checkLongevityAspect('sun', 'moon', {
    conjunction: 0.45, trine: 0.50, sextile: 0.35, opposition: 0.20, square: 0.10, quincunx: 0.05
  }, 'Sun-Moon', {
    conjunction: 'deep understanding - feel like one unit',
    trine: 'natural harmony between identity and emotions',
    sextile: 'compatible self-expression',
    opposition: 'complementary but requires effort',
    square: 'friction between ego and emotions',
    quincunx: 'adjustment needed in core relating',
  });

  // 7. Venus-Saturn (love + commitment)
  const venusSaturnScore = checkLongevityAspect('venus', 'saturn', {
    conjunction: 0.35, trine: 0.45, sextile: 0.30, opposition: 0.15, square: 0.25, quincunx: 0.10
  }, 'Venus-Saturn', {
    conjunction: 'serious love commitment',
    trine: 'love that matures and deepens over time',
    sextile: 'practical approach to love',
    opposition: 'love feels restricted',
    square: 'duty vs desire conflict',
    quincunx: 'awkward love expression',
  });

  // 8. Jupiter-Jupiter (reduced - likely age artifact)
  const jupiterScore = checkLongevityAspect('jupiter', 'jupiter', {
    conjunction: 0.12, trine: 0.10, sextile: 0.08, opposition: 0.05, square: 0.05, quincunx: 0.00
  }, 'Jupiter-Jupiter', {
    conjunction: 'shared beliefs (reduced: likely age artifact)',
    trine: 'compatible philosophies (reduced)',
    sextile: 'supportive growth together',
    opposition: 'different but complementary beliefs',
    square: 'conflicting values or excess',
    quincunx: 'adjustment in beliefs needed',
  });

  // Calculate total score from all factors
  const totalLongevityScore =
    mercuryNorthNodeA.score +
    mercuryNorthNodeB.score +
    compositeSaturnScore +
    compositeSunScore +
    compositeMoonScore +
    compositeVenusScore +
    compositeMarsScore +
    marsScore +
    saturnSunScore +
    saturnMoonScore +
    sunMoonScore +
    venusSaturnScore +
    jupiterScore;

  // Determine rating
  let longevityRating: LongevityValidation['longevityRating'];
  if (totalLongevityScore >= 1.5) {
    longevityRating = 'STRONG';
  } else if (totalLongevityScore >= 0.5) {
    longevityRating = 'MODERATE';
  } else if (totalLongevityScore >= -0.3) {
    longevityRating = 'WEAK';
  } else {
    longevityRating = 'AT_RISK';
  }

  // Sort by absolute score (biggest impact first)
  breakdown.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

  // Calculate confidence based on factors found
  const confidencePercent = factorsChecked > 0 ? Math.round((factorsFound / factorsChecked) * 100) : 0;
  let confidence: LongevityValidation['confidence'];
  if (confidencePercent >= 70) {
    confidence = 'high';
  } else if (confidencePercent >= 40) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Determine direction
  let direction: LongevityValidation['direction'];
  if (totalLongevityScore >= 0.8) {
    direction = 'long-term';
  } else if (totalLongevityScore <= -0.5) {
    direction = 'short-term';
  } else {
    direction = 'uncertain';
  }

  // Find top positive and negative
  const positives = breakdown.filter(b => b.impact === 'positive').sort((a, b) => b.score - a.score);
  const negatives = breakdown.filter(b => b.impact === 'negative').sort((a, b) => a.score - b.score);
  const topPositive = positives.length > 0 ? positives[0] : null;
  const topNegative = negatives.length > 0 ? negatives[0] : null;

  // Generate summary
  let summary: string;
  if (longevityRating === 'STRONG') {
    summary = topPositive
      ? `Strong longevity indicators. Key strength: ${topPositive.factor}.`
      : 'Strong indicators for lasting relationship.';
  } else if (longevityRating === 'MODERATE') {
    summary = 'Moderate staying power. Work on commitment factors to strengthen bond.';
  } else if (longevityRating === 'WEAK') {
    summary = topNegative
      ? `Weak longevity indicators. Main concern: ${topNegative.factor}.`
      : 'Longevity requires conscious effort and commitment.';
  } else {
    summary = topNegative
      ? `At-risk for short duration. Critical factor: ${topNegative.factor}.`
      : 'Significant challenges to long-term viability.';
  }

  // Calculate divorce prediction meter
  // Score ranges from -100 (likely divorce) to +100 (likely married)
  // Based on totalLongevityScore (-1 to +1) and weighted factors
  const positiveCount = breakdown.filter(b => b.impact === 'positive').length;
  const negativeCount = breakdown.filter(b => b.impact === 'negative').length;
  const positiveWeight = breakdown.filter(b => b.impact === 'positive').reduce((sum, b) => sum + b.score, 0);
  const negativeWeight = breakdown.filter(b => b.impact === 'negative').reduce((sum, b) => sum + Math.abs(b.score), 0);

  // Prediction score: combine longevity score with factor counts
  let predictionScore = totalLongevityScore * 60; // Base from longevity score (-60 to +60)
  predictionScore += (positiveCount - negativeCount) * 8; // Adjust by factor count difference
  predictionScore = Math.max(-100, Math.min(100, predictionScore)); // Clamp to -100 to +100

  // Determine prediction label
  let prediction: 'likely-divorce' | 'uncertain' | 'likely-married';
  if (predictionScore <= -25) {
    prediction = 'likely-divorce';
  } else if (predictionScore >= 25) {
    prediction = 'likely-married';
  } else {
    prediction = 'uncertain';
  }

  // Prediction confidence based on how extreme the score is and number of factors
  const extremity = Math.abs(predictionScore) / 100; // 0 to 1
  const factorCoverage = Math.min(1, factorsFound / 8); // More factors = more confidence
  const predictionConfidence = Math.round((extremity * 0.6 + factorCoverage * 0.4) * 100);

  return {
    mercuryNorthNodeA,
    mercuryNorthNodeB,
    compositeSaturnSign,
    compositeSaturnScore,
    totalLongevityScore,
    longevityRating,
    breakdown,
    direction,
    confidence,
    confidencePercent,
    summary,
    topPositive,
    topNegative,
    prediction,
    predictionScore,
    predictionConfidence,
  };
}

function checkHouseOverlays(chartA: NatalChart, chartB: NatalChart, adjustments: AdjustmentMap): HouseOverlayValidation {
  const significantOverlays: HouseOverlayEntry[] = [];
  let attractionBonus = 0;
  const repellingFactors: HouseOverlayEntry[] = [];
  let repellingPenalty = 0;
  const ascendantAspects: string[] = [];

  // Whole Sign houses use ascendant only (not house cusps)
  const ascB = getAscendant(chartB);
  const ascA = getAscendant(chartA);

  const applyHouseOverlay = (planet: string, house: number, baseWeight: number, description: string, prefix: string) => {
    const adjData = getHouseAdjustmentData(adjustments, planet, house);

    if (adjData && adjData.adjustment === -1) return;

    // Raw points: adjustment value directly, or baseWeight * 70 for non-adjusted
    // Lower multiplier since house overlay data is not classifier-validated
    const rawPoints = adjData ? adjData.adjustment : Math.round(baseWeight * 70);
    // Internal weight for normalization formula
    const weight = rawPoints / 100;

    if (rawPoints >= 0) {
      significantOverlays.push({ name: `${prefix} ${planet} in ${house}th house: ${description}`, weight: rawPoints });
      attractionBonus += weight;
    } else {
      repellingFactors.push({ name: `${prefix} ${planet} in ${house}th house: ${description}`, weight: rawPoints });
      repellingPenalty += Math.abs(weight);
    }
  };

  // Use Whole Sign houses: pass the ascendant, not house cusps
  if (ascB !== undefined) {
    for (const bonus of HOUSE_OVERLAY_BONUSES) {
      const planetLong = getPlanetLongitude(chartA, bonus.planet);
      if (planetLong !== undefined) {
        const house = getHouseForPlanet(planetLong, ascB);
        if (house === bonus.house) {
          applyHouseOverlay(bonus.planet, bonus.house, bonus.weight, bonus.description, 'Your');
        }
      }
    }
  }

  if (ascA !== undefined) {
    for (const bonus of HOUSE_OVERLAY_BONUSES) {
      const planetLong = getPlanetLongitude(chartB, bonus.planet);
      if (planetLong !== undefined) {
        const house = getHouseForPlanet(planetLong, ascA);
        if (house === bonus.house) {
          applyHouseOverlay(bonus.planet, bonus.house, bonus.weight, bonus.description, 'Their');
        }
      }
    }
  }

  // Saturn-ASC aspects
  if (ascB !== undefined) {
    const saturnA = getPlanetLongitude(chartA, 'saturn');
    if (saturnA !== undefined) {
      const aspect = getAspect(saturnA, ascB, 'saturn', 'ascendant');
      if (aspect) {
        const repel = ASCENDANT_ASPECTS.repelling.find(r =>
          r.planet === 'saturn' && r.aspect === aspect.type
        );
        if (repel) {
          const rawPts = -Math.round(Math.abs(repel.weight) * 100);
          repellingFactors.push({ name: repel.name, weight: rawPts });
          repellingPenalty += Math.abs(repel.weight);
        }
        const attract = ASCENDANT_ASPECTS.attracting.find(a =>
          a.planet === 'saturn' && a.aspect === aspect.type
        );
        if (attract) {
          ascendantAspects.push(attract.name);
          attractionBonus += attract.weight;
        }
      }
    }
  }

  if (ascA !== undefined) {
    const saturnB = getPlanetLongitude(chartB, 'saturn');
    if (saturnB !== undefined) {
      const aspect = getAspect(saturnB, ascA, 'saturn', 'ascendant');
      if (aspect) {
        const repel = ASCENDANT_ASPECTS.repelling.find(r =>
          r.planet === 'saturn' && r.aspect === aspect.type
        );
        if (repel) {
          const rawPts = -Math.round(Math.abs(repel.weight) * 100);
          repellingFactors.push({ name: repel.name, weight: rawPts });
          repellingPenalty += Math.abs(repel.weight);
        }
        const attract = ASCENDANT_ASPECTS.attracting.find(a =>
          a.planet === 'saturn' && a.aspect === aspect.type
        );
        if (attract) {
          ascendantAspects.push(attract.name);
          attractionBonus += attract.weight;
        }
      }
    }
  }

  return {
    significantOverlays,
    attractionBonus,
    repellingFactors,
    repellingPenalty,
    ascendantAspects,
  };
}

function checkSpecificAspect(
  chartA: NatalChart,
  chartB: NatalChart,
  planet1: string,
  planet2: string,
  targetAspect: string,
  adjustments: AdjustmentMap
): { found: boolean; orb: number; adjustment?: number } {
  const longA = getPlanetLongitude(chartA, planet1);
  const longB = getPlanetLongitude(chartB, planet2);

  if (longA === undefined || longB === undefined) {
    return { found: false, orb: 999 };
  }

  const aspect = getAspect(longA, longB, planet1, planet2);
  if (!aspect || aspect.type !== targetAspect) {
    return { found: false, orb: 999 };
  }

  const adjustment = getAspectAdjustmentV4(adjustments, planet1, planet2, aspect.type, aspect.orb);
  if (adjustment === -1) {
    return { found: false, orb: 999 };
  }

  return { found: true, orb: aspect.orb, adjustment: adjustment ?? undefined };
}

interface FoundPredictor {
  name: string;
  evidence: string;
  weight: number;
  orb: number;
  critical?: boolean;
}

function checkResearchFactors(chartA: NatalChart, chartB: NatalChart, adjustments: AdjustmentMap): ResearchValidation & {
  marriagePredictorsWithEvidence: FoundPredictor[];
  divorceRiskWithEvidence: FoundPredictor[];
} {
  const marriagePredictorsFound: string[] = [];
  const divorceRiskFactors: string[] = [];
  const marriagePredictorsWithEvidence: FoundPredictor[] = [];
  const divorceRiskWithEvidence: FoundPredictor[] = [];
  let marriageBonus = 0;
  let divorcePenalty = 0;

  for (const predictor of MARRIAGE_PREDICTORS) {
    const check1 = checkSpecificAspect(chartA, chartB, predictor.p1, predictor.p2, predictor.aspect, adjustments);
    const check2 = checkSpecificAspect(chartB, chartA, predictor.p1, predictor.p2, predictor.aspect, adjustments);

    if (check1.found || check2.found) {
      marriagePredictorsFound.push(predictor.name);
      const orb = check1.found ? check1.orb : check2.orb;
      const orbFactor = 1 - (orb / 10);
      const score = predictor.weight * Math.max(0.5, orbFactor);
      marriageBonus += score;
      marriagePredictorsWithEvidence.push({
        name: predictor.name,
        evidence: predictor.evidence,
        weight: score,
        orb,
      });
    }
  }

  for (const predictor of DIVORCE_PREDICTORS) {
    const check1 = checkSpecificAspect(chartA, chartB, predictor.p1, predictor.p2, predictor.aspect, adjustments);
    const check2 = checkSpecificAspect(chartB, chartA, predictor.p1, predictor.p2, predictor.aspect, adjustments);

    if (check1.found || check2.found) {
      divorceRiskFactors.push(predictor.name);
      const orb = check1.found ? check1.orb : check2.orb;
      const orbFactor = 1 - (orb / 10);
      const criticalMultiplier = predictor.critical ? 1.5 : 1.0;
      const score = predictor.weight * Math.max(0.6, orbFactor) * criticalMultiplier;
      divorcePenalty += score;
      divorceRiskWithEvidence.push({
        name: predictor.name,
        evidence: predictor.evidence,
        weight: score,
        orb,
        critical: predictor.critical,
      });
    }
  }

  let riskLevel: ResearchValidation['riskLevel'];
  const hasCriticalAspect = divorceRiskFactors.some(f => f.includes('Saturn-Saturn Opposition') || f.includes('Mars-Uranus Opposition'));
  if (hasCriticalAspect && divorceRiskFactors.length >= 3) {
    riskLevel = 'CRITICAL';
  } else if (divorceRiskFactors.length >= 4) {
    riskLevel = 'HIGH';
  } else if (divorceRiskFactors.length >= 2) {
    riskLevel = 'MODERATE';
  } else {
    riskLevel = 'LOW';
  }

  return {
    marriagePredictorsFound,
    divorceRiskFactors,
    marriageBonus,
    divorcePenalty,
    netResearchScore: marriageBonus - divorcePenalty,
    riskLevel,
    marriagePredictorsWithEvidence,
    divorceRiskWithEvidence,
  };
}

function scorePlanetPair(chartA: NatalChart, chartB: NatalChart, planetA: string, planetB: string, adjustments: AdjustmentMap): number {
  const longA = getPlanetLongitude(chartA, planetA);
  const longB = getPlanetLongitude(chartB, planetB);
  if (longA === undefined || longB === undefined) return 0;

  const aspect = getAspect(longA, longB, planetA, planetB);
  if (!aspect) return 0;

  const adjustment = getAspectAdjustmentV4(adjustments, planetA, planetB, aspect.type, aspect.orb);
  if (adjustment === -1) {
    return 0;
  }

  // Use individual planet-pair-aspect score instead of generic aspect score
  let baseScore = getPlanetPairAspectScore(planetA, planetB, aspect.type);

  // Apply RFE boost: factors with high RFE importance get amplified
  // This makes classifier-validated factors more prominent in the final score
  const rfe = getRFEImportance(planetA, planetB, aspect.type);
  if (rfe && rfe.importance >= 0.4 && rfe.category !== 'neutral') {
    // Scale base score by RFE importance: 80% RFE → 1.8x, 90% RFE → 1.9x
    // Plus flat bonus for positive scores only (up to +80 for 100% RFE)
    // Negative scores only get the multiplier — no flat penalty to avoid catastrophic inflation
    const rfeMultiplier = 1.0 + rfe.importance;
    const rfeBonus = Math.round(rfe.importance * 80);
    if (baseScore >= 0) {
      baseScore = Math.round(baseScore * rfeMultiplier) + rfeBonus;
    } else {
      baseScore = Math.round(baseScore * rfeMultiplier);
    }
  }

  if (adjustment !== null) {
    return adjustment; // adjustment IS the target score (overrides RFE boost)
  }

  return baseScore;
}

function scorePlanetToAscendant(chartA: NatalChart, chartB: NatalChart, planet: string, adjustments: AdjustmentMap): number {
  const planetLong = getPlanetLongitude(chartA, planet);
  const ascendant = getAscendant(chartB);
  if (planetLong === undefined || ascendant === undefined) return 0;
  const aspect = getAspect(planetLong, ascendant, planet, 'ascendant');
  if (!aspect) return 0;

  const adjustment = getAspectAdjustmentV4(adjustments, planet, 'ascendant', aspect.type, aspect.orb);
  if (adjustment === -1) return 0;
  if (adjustment !== null) return adjustment; // adjustment IS the target score

  // Use individual planet-pair-aspect score instead of generic aspect score
  let baseScore = getPlanetPairAspectScore(planet, 'ascendant', aspect.type);

  // Apply RFE boost for classifier-validated factors
  const rfe = getRFEImportance(planet, 'ascendant', aspect.type);
  if (rfe && rfe.importance >= 0.4 && rfe.category !== 'neutral') {
    const rfeMultiplier = 1.0 + rfe.importance;
    const rfeBonus = Math.round(rfe.importance * 80);
    if (baseScore >= 0) {
      baseScore = Math.round(baseScore * rfeMultiplier) + rfeBonus;
    } else {
      baseScore = Math.round(baseScore * rfeMultiplier);
    }
  }

  return baseScore;
}

function scoreChironConnections(chartA: NatalChart, chartB: NatalChart, adjustments: AdjustmentMap): number {
  let score = 0;
  const personalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars'];

  for (const planet of personalPlanets) {
    score += scorePlanetPair(chartA, chartB, 'chiron', planet, adjustments);
    score += scorePlanetPair(chartB, chartA, 'chiron', planet, adjustments);
  }

  score += scorePlanetPair(chartA, chartB, 'chiron', 'chiron', adjustments);
  score += scorePlanetToAscendant(chartA, chartB, 'chiron', adjustments);
  score += scorePlanetToAscendant(chartB, chartA, 'chiron', adjustments);

  return score;
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

export function calculateLocalSynastryV4(chartA: NatalChart, chartB: NatalChart, preloadedAdjustments?: AdjustmentMap): SynastryResultV4 {
  // Use preloaded adjustments (for batch) or empty map.
  // V4 uses PLANET_PAIR_SCORES directly — weights.json/localStorage adjustments are V3 legacy.
  const adjustments = preloadedAdjustments || {} as AdjustmentMap;
  let adjustmentsApplied = 0;

  const breakdown: SynastryBreakdownV4 = {
    emotional: 0,
    love: 0,
    commitment: 0,
    chemistry: 0,
    family: 0,
    communication: 0,
    growth: 0,
    values: 0,
    prosperity: 0,
  };

  const maxScores = { ...breakdown };
  const warnings: string[] = [];
  const contributions: ContributionV4[] = [];

  const addContribution = (
    category: string,
    description: string,
    points: number,
    type: ContributionV4['type'],
    extras?: Partial<ContributionV4>
  ) => {
    if (points !== 0) {
      // Auto-detect planet owners from description pattern "A's ... B's ..." or "B's ... A's ..."
      let ownerPlanet1 = extras?.ownerPlanet1;
      let ownerPlanet2 = extras?.ownerPlanet2;
      if (!ownerPlanet1 && type === 'aspect' && extras?.planet1) {
        if (description.startsWith("A's")) {
          ownerPlanet1 = 'A';
          ownerPlanet2 = 'B';
        } else if (description.startsWith("B's")) {
          ownerPlanet1 = 'B';
          ownerPlanet2 = 'A';
        }
      }

      contributions.push({
        id: `${category}-${contributions.length}`,
        category,
        description,
        points: Math.round(points * 100) / 100,
        type,
        ...extras,
        ...(ownerPlanet1 ? { ownerPlanet1 } : {}),
        ...(ownerPlanet2 ? { ownerPlanet2 } : {}),
      });
    }
  };

  // Run all validations
  const researchValidation = checkResearchFactors(chartA, chartB, adjustments);
  const longevityValidation = checkLongevityFactors(chartA, chartB, adjustments);
  const houseOverlayValidation = checkHouseOverlays(chartA, chartB, adjustments);
  const elementBalance = calculateElementBalance(chartA, chartB);
  const natalBalanceValidation = calculateNatalBalance(chartA, chartB);

  // Add warnings
  if (researchValidation.riskLevel === 'CRITICAL') {
    warnings.push('CRITICAL: High-risk aspects detected.');
  }
  for (const factor of researchValidation.divorceRiskFactors) {
    if (!factor.includes('Saturn-Saturn')) {
      warnings.push(`Warning: ${factor}`);
    }
  }

  if (longevityValidation.longevityRating === 'AT_RISK') {
    warnings.push('Longevity indicators suggest staying-power challenges.');
  }

  for (const factor of houseOverlayValidation.repellingFactors) {
    warnings.push(`Caution: ${factor.name}`);
  }

  if (natalBalanceValidation.rating === 'CHALLENGING') {
    warnings.push('Both charts have challenging natal aspects.');
  }

  // Helper to score a pair list and accumulate into a category
  const scorePairList = (
    category: keyof SynastryBreakdownV4,
    pairs: string[][],
    options?: { venusMarsDampen?: boolean; jupJupBoost?: boolean; satSatOppPenalty?: boolean }
  ) => {
    for (const [p1, p2] of pairs) {
      let pairScore = scorePlanetPair(chartA, chartB, p1, p2, adjustments);
      const longA = getPlanetLongitude(chartA, p1);
      const longB = getPlanetLongitude(chartB, p2);
      let detectedAspect: ReturnType<typeof getAspect> = null;

      if (longA !== undefined && longB !== undefined) {
        detectedAspect = getAspect(longA, longB, p1, p2);

        if (options?.venusMarsDampen && ((p1 === 'venus' && p2 === 'mars') || (p1 === 'mars' && p2 === 'venus')) && detectedAspect?.type === 'conjunction') {
          pairScore = pairScore * 0.3;
        }
        if (options?.jupJupBoost && p1 === 'jupiter' && p2 === 'jupiter' && detectedAspect?.type === 'conjunction') {
          pairScore = pairScore * 1.5;
        }
        if (options?.satSatOppPenalty && p1 === 'saturn' && p2 === 'saturn' && detectedAspect?.type === 'opposition') {
          pairScore = -15;
        }
      }

      if (pairScore !== 0 && detectedAspect) {
        addContribution(category, `A's ${p1} ${detectedAspect.type} B's ${p2}`, pairScore, 'aspect', {
          planet1: p1, planet2: p2, aspectType: detectedAspect.type, orb: detectedAspect.orb
        });
      }

      breakdown[category] += pairScore;
      maxScores[category] += 12;
    }
  };

  // EMOTIONAL (17%): Sun-Moon, Moon-Moon, Moon-Venus, Moon-Jupiter, Moon-ASC
  const emotionalPairs = [
    ['sun', 'moon'], ['moon', 'sun'],
    ['moon', 'moon'],
    ['moon', 'venus'], ['venus', 'moon'],
    ['moon', 'jupiter'], ['jupiter', 'moon'],
  ];
  scorePairList('emotional', emotionalPairs);
  // Moon-ASC
  const moonAscScoreA = scorePlanetToAscendant(chartA, chartB, 'moon', adjustments);
  const moonAscScoreB = scorePlanetToAscendant(chartB, chartA, 'moon', adjustments);
  breakdown.emotional += moonAscScoreA + moonAscScoreB;
  if (moonAscScoreA !== 0) {
    const moonLong = getPlanetLongitude(chartA, 'moon');
    const asc = getAscendant(chartB);
    if (moonLong !== undefined && asc !== undefined) {
      const aspect = getAspect(moonLong, asc, 'moon', 'ascendant');
      if (aspect) addContribution('emotional', `A's Moon ${aspect.type} B's ASC`, moonAscScoreA, 'aspect', { planet1: 'moon', planet2: 'ascendant', aspectType: aspect.type, orb: aspect.orb });
    }
  }
  if (moonAscScoreB !== 0) {
    const moonLong = getPlanetLongitude(chartB, 'moon');
    const asc = getAscendant(chartA);
    if (moonLong !== undefined && asc !== undefined) {
      const aspect = getAspect(moonLong, asc, 'moon', 'ascendant');
      if (aspect) addContribution('emotional', `B's Moon ${aspect.type} A's ASC`, moonAscScoreB, 'aspect', { planet1: 'moon', planet2: 'ascendant', aspectType: aspect.type, orb: aspect.orb });
    }
  }
  maxScores.emotional += 24;

  // LOVE (13%): Sun-Venus, Venus-Venus, Sun-Sun, Venus-Jupiter, Venus-ASC
  const lovePairs = [
    ['sun', 'venus'], ['venus', 'sun'],
    ['venus', 'venus'],
    ['sun', 'sun'],
    ['venus', 'jupiter'], ['jupiter', 'venus'],
  ];
  scorePairList('love', lovePairs);
  // Venus-ASC
  const venusAscScoreA = scorePlanetToAscendant(chartA, chartB, 'venus', adjustments);
  const venusAscScoreB = scorePlanetToAscendant(chartB, chartA, 'venus', adjustments);
  breakdown.love += venusAscScoreA + venusAscScoreB;
  if (venusAscScoreA !== 0) {
    const vLong = getPlanetLongitude(chartA, 'venus');
    const ascB = getAscendant(chartB);
    if (vLong !== undefined && ascB !== undefined) {
      const aspect = getAspect(vLong, ascB, 'venus', 'ascendant');
      if (aspect) addContribution('love', `A's Venus ${aspect.type} B's ASC`, venusAscScoreA, 'aspect', { planet1: 'venus', planet2: 'ascendant', aspectType: aspect.type, orb: aspect.orb });
    }
  }
  if (venusAscScoreB !== 0) {
    const vLong = getPlanetLongitude(chartB, 'venus');
    const ascA = getAscendant(chartA);
    if (vLong !== undefined && ascA !== undefined) {
      const aspect = getAspect(vLong, ascA, 'venus', 'ascendant');
      if (aspect) addContribution('love', `B's Venus ${aspect.type} A's ASC`, venusAscScoreB, 'aspect', { planet1: 'venus', planet2: 'ascendant', aspectType: aspect.type, orb: aspect.orb });
    }
  }
  maxScores.love += 24;

  // COMMITMENT (12%): Saturn-Sun, Saturn-Moon, Saturn-Venus, Saturn-Saturn
  const commitmentPairs = [
    ['saturn', 'sun'], ['sun', 'saturn'],
    ['saturn', 'moon'], ['moon', 'saturn'],
    ['saturn', 'venus'], ['venus', 'saturn'],
    ['saturn', 'saturn'],
  ];
  scorePairList('commitment', commitmentPairs, { satSatOppPenalty: true });

  // CHEMISTRY (12%): Venus-Mars, Mars-Mars, Sun-Mars, Moon-Mars, Venus-Pluto, Mars-Pluto, Sun-Pluto, Moon-Pluto
  const chemistryPairs = [
    ['venus', 'mars'], ['mars', 'venus'],
    ['mars', 'mars'],
    ['sun', 'mars'], ['mars', 'sun'],
    ['moon', 'mars'], ['mars', 'moon'],
    ['venus', 'pluto'], ['pluto', 'venus'],
    ['mars', 'pluto'], ['pluto', 'mars'],
    ['sun', 'pluto'], ['pluto', 'sun'],
    ['moon', 'pluto'], ['pluto', 'moon'],
  ];
  scorePairList('chemistry', chemistryPairs, { venusMarsDampen: true });

  // FAMILY (12%): Moon-Saturn
  const familyPairs = [
    ['moon', 'saturn'], ['saturn', 'moon'],
  ];
  scorePairList('family', familyPairs);

  // COMMUNICATION (10%): Mercury-Mercury, Mercury-Sun, Mercury-Moon, Mercury-Saturn
  const communicationPairs = [
    ['mercury', 'mercury'],
    ['mercury', 'sun'], ['sun', 'mercury'],
    ['mercury', 'moon'], ['moon', 'mercury'],
    ['mercury', 'saturn'], ['saturn', 'mercury'],
  ];
  scorePairList('communication', communicationPairs);

  // GROWTH (10%): North Node aspects, Chiron aspects, Jupiter-Sun, Jupiter-Mars
  const growthPairs = [
    ['northnode', 'sun'], ['sun', 'northnode'],
    ['northnode', 'moon'], ['moon', 'northnode'],
    ['northnode', 'venus'], ['venus', 'northnode'],
    ['northnode', 'mercury'], ['mercury', 'northnode'],
    ['jupiter', 'sun'], ['sun', 'jupiter'],
    ['jupiter', 'mars'], ['mars', 'jupiter'],
  ];
  scorePairList('growth', growthPairs, { jupJupBoost: true });
  // Chiron aspects → growth
  {
    let chironGrowthScore = 0;
    const healingPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars'];
    for (const planet of healingPlanets) {
      const scoreAB = scorePlanetPair(chartA, chartB, 'chiron', planet, adjustments);
      if (scoreAB !== 0) {
        const lA = getPlanetLongitude(chartA, 'chiron');
        const lB = getPlanetLongitude(chartB, planet);
        if (lA !== undefined && lB !== undefined) {
          const asp = getAspect(lA, lB, 'chiron', planet);
          if (asp) addContribution('growth', `A's Chiron ${asp.type} B's ${planet}`, scoreAB, 'aspect', { planet1: 'chiron', planet2: planet, aspectType: asp.type, orb: asp.orb });
        }
      }
      chironGrowthScore += scoreAB;
      const scoreBA = scorePlanetPair(chartB, chartA, 'chiron', planet, adjustments);
      if (scoreBA !== 0) {
        const lA2 = getPlanetLongitude(chartB, 'chiron');
        const lB2 = getPlanetLongitude(chartA, planet);
        if (lA2 !== undefined && lB2 !== undefined) {
          const asp = getAspect(lA2, lB2, 'chiron', planet);
          if (asp) addContribution('growth', `B's Chiron ${asp.type} A's ${planet}`, scoreBA, 'aspect', { planet1: 'chiron', planet2: planet, aspectType: asp.type, orb: asp.orb });
        }
      }
      chironGrowthScore += scoreBA;
    }
    const chironScore = scorePlanetPair(chartA, chartB, 'chiron', 'chiron', adjustments);
    if (chironScore !== 0) {
      const lCA = getPlanetLongitude(chartA, 'chiron');
      const lCB = getPlanetLongitude(chartB, 'chiron');
      if (lCA !== undefined && lCB !== undefined) {
        const asp = getAspect(lCA, lCB, 'chiron', 'chiron');
        if (asp) addContribution('growth', `A's Chiron ${asp.type} B's Chiron`, chironScore, 'aspect', { planet1: 'chiron', planet2: 'chiron', aspectType: asp.type, orb: asp.orb });
      }
    }
    chironGrowthScore += chironScore;
    const chAscA = scorePlanetToAscendant(chartA, chartB, 'chiron', adjustments);
    const chAscB = scorePlanetToAscendant(chartB, chartA, 'chiron', adjustments);
    if (chAscA !== 0) {
      const cl = getPlanetLongitude(chartA, 'chiron');
      const al = getAscendant(chartB);
      if (cl !== undefined && al !== undefined) {
        const asp = getAspect(cl, al, 'chiron', 'ascendant');
        if (asp) addContribution('growth', `A's Chiron ${asp.type} B's ASC`, chAscA, 'aspect', { planet1: 'chiron', planet2: 'ascendant', aspectType: asp.type, orb: asp.orb });
      }
    }
    if (chAscB !== 0) {
      const cl = getPlanetLongitude(chartB, 'chiron');
      const al = getAscendant(chartA);
      if (cl !== undefined && al !== undefined) {
        const asp = getAspect(cl, al, 'chiron', 'ascendant');
        if (asp) addContribution('growth', `B's Chiron ${asp.type} A's ASC`, chAscB, 'aspect', { planet1: 'chiron', planet2: 'ascendant', aspectType: asp.type, orb: asp.orb });
      }
    }
    chironGrowthScore += chAscA + chAscB;
    breakdown.growth += chironGrowthScore;
    maxScores.growth += 144;
  }

  // VALUES (9%): Jupiter-Jupiter, Jupiter-Saturn
  const valuesPairs = [
    ['jupiter', 'jupiter'],
    ['jupiter', 'saturn'], ['saturn', 'jupiter'],
  ];
  scorePairList('values', valuesPairs, { jupJupBoost: true });

  // COMPREHENSIVE CATCH-ALL: Score ALL remaining pairs from PLANET_PAIR_SCORES
  {
    const scoredPairs = new Set<string>();
    const addScoredPair = (p1: string, p2: string) => {
      const [a, b] = [p1.toLowerCase(), p2.toLowerCase()].sort();
      scoredPairs.add(`${a}-${b}`);
    };
    for (const [p1, p2] of emotionalPairs) addScoredPair(p1, p2);
    addScoredPair('moon', 'ascendant');
    for (const [p1, p2] of lovePairs) addScoredPair(p1, p2);
    addScoredPair('venus', 'ascendant');
    for (const [p1, p2] of commitmentPairs) addScoredPair(p1, p2);
    for (const [p1, p2] of chemistryPairs) addScoredPair(p1, p2);
    for (const [p1, p2] of familyPairs) addScoredPair(p1, p2);
    for (const [p1, p2] of communicationPairs) addScoredPair(p1, p2);
    for (const [p1, p2] of growthPairs) addScoredPair(p1, p2);
    for (const planet of ['sun', 'moon', 'mercury', 'venus', 'mars', 'chiron']) {
      addScoredPair('chiron', planet);
    }
    addScoredPair('chiron', 'ascendant');
    for (const [p1, p2] of valuesPairs) addScoredPair(p1, p2);

    const getCatchAllCategory = (pairKey: string): keyof SynastryBreakdownV4 => {
      if (pairKey.includes('juno')) return 'commitment';
      if (pairKey.includes('northnode')) return 'growth';
      if (pairKey.includes('chiron')) return 'growth';
      if (pairKey.includes('neptune') && (pairKey.includes('moon') || pairKey.includes('venus'))) return 'emotional';
      if (pairKey.includes('uranus') && (pairKey.includes('mars') || pairKey.includes('venus') || pairKey.includes('sun') || pairKey.includes('moon'))) return 'chemistry';
      if (pairKey.includes('neptune') || pairKey.includes('uranus')) return 'growth';
      if (pairKey.includes('saturn')) return 'commitment';
      if (pairKey.includes('pluto')) return 'chemistry';
      if (pairKey.includes('jupiter')) return 'values';
      if (pairKey.includes('ascendant')) return 'love';
      return 'love';
    };

    for (const pairKey of Object.keys(PLANET_PAIR_SCORES)) {
      if (scoredPairs.has(pairKey)) continue;

      const [planetA, planetB] = pairKey.split('-');
      const category = getCatchAllCategory(pairKey);

      const scoreAB = scorePlanetPair(chartA, chartB, planetA, planetB, adjustments);
      if (scoreAB !== 0) {
        const lA = getPlanetLongitude(chartA, planetA);
        const lB = getPlanetLongitude(chartB, planetB);
        if (lA !== undefined && lB !== undefined) {
          const asp = getAspect(lA, lB, planetA, planetB);
          if (asp) {
            addContribution(category, `A's ${planetA} ${asp.type} B's ${planetB}`, scoreAB, 'aspect', {
              planet1: planetA, planet2: planetB, aspectType: asp.type, orb: asp.orb
            });
          }
        }
        breakdown[category] += scoreAB;
        maxScores[category] += 12;
      }

      if (planetA !== planetB) {
        const scoreBA = scorePlanetPair(chartB, chartA, planetA, planetB, adjustments);
        if (scoreBA !== 0) {
          const lA = getPlanetLongitude(chartB, planetA);
          const lB = getPlanetLongitude(chartA, planetB);
          if (lA !== undefined && lB !== undefined) {
            const asp = getAspect(lA, lB, planetA, planetB);
            if (asp) {
              addContribution(category, `B's ${planetA} ${asp.type} A's ${planetB}`, scoreBA, 'aspect', {
                planet1: planetA, planet2: planetB, aspectType: asp.type, orb: asp.orb
              });
            }
          }
          breakdown[category] += scoreBA;
          maxScores[category] += 12;
        }
      }
    }
  }

  // LONGEVITY
  const longevityNormalized = Math.max(30, Math.min(90,
    55 + (longevityValidation.totalLongevityScore * 25)
  ));
  breakdown.commitment += longevityNormalized;
  maxScores.commitment += 90;

  if (longevityValidation.mercuryNorthNodeA.aspect) {
    addContribution('commitment', `A's Mercury ${longevityValidation.mercuryNorthNodeA.aspect} North Node`, longevityValidation.mercuryNorthNodeA.score * 30, 'longevity');
  }
  if (longevityValidation.mercuryNorthNodeB.aspect) {
    addContribution('commitment', `B's Mercury ${longevityValidation.mercuryNorthNodeB.aspect} North Node`, longevityValidation.mercuryNorthNodeB.score * 30, 'longevity');
  }
  // Note: Composite Saturn is now added in the COMPOSITE CHART SIGN SCORING section with boosted score

  // HOUSE OVERLAY → distributed to family (4th/5th houses) and prosperity (2nd/8th houses), rest to love
  const houseOverlayNet = houseOverlayValidation.attractionBonus - houseOverlayValidation.repellingPenalty;
  const houseOverlayNormalized = Math.max(35, Math.min(90,
    55 + (houseOverlayNet * 30)
  ));
  // Distribute house overlay score: 50% family, 25% prosperity, 25% love
  breakdown.family += Math.round(houseOverlayNormalized * 0.50);
  maxScores.family += 45;
  breakdown.prosperity += Math.round(houseOverlayNormalized * 0.25);
  maxScores.prosperity += 23;
  breakdown.love += Math.round(houseOverlayNormalized * 0.25);
  maxScores.love += 22;

  const getHouseOverlayCategory = (houseNum: number | undefined): keyof SynastryBreakdownV4 => {
    if (houseNum === 4 || houseNum === 5) return 'family';
    if (houseNum === 2 || houseNum === 8) return 'prosperity';
    return 'love';
  };

  for (const overlay of houseOverlayValidation.significantOverlays) {
    const houseMatch = overlay.name.match(/(\w+)\s+in\s+(\d+)(?:st|nd|rd|th)\s+house/i);
    const planet = houseMatch?.[1]?.toLowerCase();
    const house = houseMatch?.[2] ? parseInt(houseMatch[2]) : undefined;
    const isYour = overlay.name.startsWith('Your');
    const ownerPlanet1: 'A' | 'B' = isYour ? 'A' : 'B';
    const houseOwner: 'A' | 'B' = isYour ? 'B' : 'A';
    const overlayCat = getHouseOverlayCategory(house);

    addContribution(overlayCat, overlay.name, overlay.weight, 'house', {
      planet1: planet, house, ownerPlanet1, houseOwner,
    });
  }
  for (const factor of houseOverlayValidation.repellingFactors) {
    const houseMatch = factor.name.match(/(\w+)\s+in\s+(\d+)(?:st|nd|rd|th)\s+house/i);
    const planet = houseMatch?.[1]?.toLowerCase();
    const house = houseMatch?.[2] ? parseInt(houseMatch[2]) : undefined;
    const isYour = factor.name.startsWith('Your');
    const ownerPlanet1: 'A' | 'B' = isYour ? 'A' : 'B';
    const houseOwner: 'A' | 'B' = isYour ? 'B' : 'A';
    const overlayCat = getHouseOverlayCategory(house);

    addContribution(overlayCat, `${factor.name} (repelling)`, factor.weight, 'house', {
      planet1: planet, house, ownerPlanet1, houseOwner,
    });
  }

  // ELEMENT BALANCE → folded into VALUES
  const elementNormalized = Math.max(40, Math.min(90, 55 + (elementBalance.compatibility * 35)));
  breakdown.values += elementNormalized;
  maxScores.values += 90;

  for (const match of elementBalance.matchingElements) {
    addContribution('values', match.name, Math.round(match.weight * 35), 'element');
  }

  // NATAL BALANCE → folded into FAMILY
  const natalNormalized = Math.max(35, Math.min(85, 50 + (natalBalanceValidation.combinedBalance * 6)));
  breakdown.family += natalNormalized;
  maxScores.family += 85;

  addContribution('family',
    `A's natal: ${natalBalanceValidation.harmonyA} harmonies, ${natalBalanceValidation.tensionA} tensions`,
    natalBalanceValidation.balanceA * 3, 'natal');
  addContribution('family',
    `B's natal: ${natalBalanceValidation.harmonyB} harmonies, ${natalBalanceValidation.tensionB} tensions`,
    natalBalanceValidation.balanceB * 3, 'natal');

  // RESEARCH BONUS → folded into PROSPERITY
  const researchScoreNormalized = Math.max(40, Math.min(85,
    55 + (researchValidation.netResearchScore * 12)
  ));
  breakdown.prosperity += researchScoreNormalized;
  maxScores.prosperity += 85;

  for (const predictor of researchValidation.marriagePredictorsWithEvidence) {
    // Boosted multiplier: 8 → 30 to reflect actual research impact
    addContribution('prosperity', `${predictor.name} - ${predictor.evidence}`, predictor.weight * 30, 'research');
  }
  for (const risk of researchValidation.divorceRiskWithEvidence) {
    const criticalFlag = risk.critical ? 'CRITICAL: ' : '';
    // Boosted multiplier: 10 → 40 to reflect divorce risk severity
    addContribution('prosperity', `${criticalFlag}${risk.name} - ${risk.evidence}`, -risk.weight * 40, 'research');
  }

  // SIMILAR BIRTHDAY CHECK
  const similarBirthdayCheck = checkSimilarBirthdays(chartA, chartB, adjustments);
  if (similarBirthdayCheck.isSimilar && similarBirthdayCheck.score !== 0) {
    const daysApart = Math.round(similarBirthdayCheck.distance);
    addContribution('love', `Too Similar Birthdays (~${daysApart} days apart)`, similarBirthdayCheck.score, 'pattern');
    warnings.push(`Birthdays are very close (~${daysApart} days apart) - similar life patterns may lack complementarity.`);
  }

  // TOO SIMILAR CHARTS CHECK - 4+ same-planet conjunctions means near-identical charts
  const samePlanetConjunctions: string[] = [];
  const samePlanetCheckList = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northnode', 'chiron'];
  for (const planet of samePlanetCheckList) {
    const longA = getPlanetLongitude(chartA, planet);
    const longB = getPlanetLongitude(chartB, planet);
    if (longA !== undefined && longB !== undefined) {
      const diff = Math.abs(longA - longB);
      const dist = Math.min(diff, 360 - diff);
      if (dist <= 10) samePlanetConjunctions.push(planet);
    }
  }
  if (samePlanetConjunctions.length >= 6) {
    const penalty = -50 * (samePlanetConjunctions.length - 5); // -50 per conjunction beyond 5
    addContribution('love', `Too Similar Charts (${samePlanetConjunctions.length} same-planet conjunctions)`, penalty, 'pattern');
    warnings.push(`Charts are very similar with ${samePlanetConjunctions.length} same-planet conjunctions — may indicate same generation/birthday rather than complementary match.`);
  }

  // COMPOSITE CHART SIGN SCORING
  // Research shows composite Sun/Moon/Venus/Mars signs are strong predictors (26% importance)
  const compositeChart = calculateCompositeChart(chartA, chartB);

  // COMPOSITE CHART - Research shows 26% of prediction accuracy
  // Boosted multipliers + RFE boost to ensure composite factors appear at TOP of contributions

  // Helper to apply RFE boost to composite scores - same formula as aspects
  const applyCompositeRFEBoost = (planet: string, baseScore: number): number => {
    const rfe = getRFEImportance('composite', planet, '');
    if (rfe && rfe.importance >= 0.4) {
      const rfeMultiplier = 1.0 + rfe.importance;
      const rfeBonus = Math.round(rfe.importance * 80);
      if (baseScore >= 0) {
        return Math.round(baseScore * rfeMultiplier) + rfeBonus;
      } else {
        // For negative composites: only apply multiplier, no flat penalty.
        // A slightly negative sign placement shouldn't become catastrophic.
        return Math.round(baseScore * rfeMultiplier);
      }
    }
    return baseScore;
  };

  // Composite Moon - emotional foundation (MOST IMPORTANT per research - rank #1, 90% RFE)
  const compositeMoonSign = compositeChart.planets.moon?.sign as ZodiacSign;
  if (compositeMoonSign && COMPOSITE_MOON_SIGN_WEIGHTS[compositeMoonSign]) {
    const moonWeight = COMPOSITE_MOON_SIGN_WEIGHTS[compositeMoonSign];
    let moonScore = moonWeight.weight * 95; // Highest boost - Moon is most important
    moonScore = applyCompositeRFEBoost('moon', moonScore); // Apply RFE boost (90% → 1.675x)
    addContribution('emotional', `Composite Moon in ${compositeMoonSign}: ${moonWeight.description}`, moonScore, 'composite', {
      planet1: 'moon', sign: compositeMoonSign
    });
  }

  // Composite Sun - relationship's core identity and purpose (rank #2, 85% RFE)
  const compositeSunSign = compositeChart.planets.sun?.sign as ZodiacSign;
  if (compositeSunSign && COMPOSITE_SUN_SIGN_WEIGHTS[compositeSunSign]) {
    const sunWeight = COMPOSITE_SUN_SIGN_WEIGHTS[compositeSunSign];
    let sunScore = sunWeight.weight * 85; // High boost
    sunScore = applyCompositeRFEBoost('sun', sunScore); // Apply RFE boost (85% → 1.6375x)
    addContribution('commitment', `Composite Sun in ${compositeSunSign}: ${sunWeight.description}`, sunScore, 'composite', {
      planet1: 'sun', sign: compositeSunSign
    });
  }

  // Composite Saturn - structural durability (rank #3 - critical for longevity, 88% RFE)
  const compositeSaturnSign = compositeChart.planets.saturn?.sign as ZodiacSign;
  if (compositeSaturnSign && COMPOSITE_SATURN_SIGN_WEIGHTS[compositeSaturnSign]) {
    let saturnScore = COMPOSITE_SATURN_SIGN_WEIGHTS[compositeSaturnSign] * 80; // High boost
    saturnScore = applyCompositeRFEBoost('saturn', saturnScore); // Apply RFE boost (88% → 1.66x)
    const saturnDesc = COMPOSITE_SATURN_SIGN_DESCRIPTIONS[compositeSaturnSign];
    addContribution('commitment', `Composite Saturn in ${compositeSaturnSign}: ${saturnDesc.description}`, saturnScore, 'composite', {
      planet1: 'saturn', sign: compositeSaturnSign
    });
  }

  // Composite Venus - how the relationship expresses love (rank #4, 82% RFE)
  const compositeVenusSign = compositeChart.planets.venus?.sign as ZodiacSign;
  if (compositeVenusSign && COMPOSITE_VENUS_SIGN_WEIGHTS[compositeVenusSign]) {
    const venusWeight = COMPOSITE_VENUS_SIGN_WEIGHTS[compositeVenusSign];
    let venusScore = venusWeight.weight * 75; // Good boost
    venusScore = applyCompositeRFEBoost('venus', venusScore); // Apply RFE boost (82% → 1.615x)
    addContribution('passion', `Composite Venus in ${compositeVenusSign}: ${venusWeight.description}`, venusScore, 'composite', {
      planet1: 'venus', sign: compositeVenusSign
    });
  }

  // Composite Mars - conflict resolution and drive (rank #5, 75% RFE)
  const compositeMarsSign = compositeChart.planets.mars?.sign as ZodiacSign;
  if (compositeMarsSign && COMPOSITE_MARS_SIGN_WEIGHTS[compositeMarsSign]) {
    const marsWeight = COMPOSITE_MARS_SIGN_WEIGHTS[compositeMarsSign];
    let marsScore = marsWeight.weight * 70; // Good boost
    marsScore = applyCompositeRFEBoost('mars', marsScore); // Apply RFE boost (75% → 1.5625x)
    addContribution('commitment', `Composite Mars in ${compositeMarsSign}: ${marsWeight.description}`, marsScore, 'composite', {
      planet1: 'mars', sign: compositeMarsSign
    });
  }

  contributions.sort((a, b) => Math.abs(b.points) - Math.abs(a.points));

  // Count adjustments applied
  adjustmentsApplied = Object.keys(adjustments).length;

  // ABSOLUTE SCORING (for category breakdown display only)
  const absoluteScoreCategory = (raw: number, maxPossible: number): number => {
    if (maxPossible === 0) return 50;
    const ratio = raw / (maxPossible * 0.5);
    const score = 50 + (ratio * 30);
    return Math.max(10, Math.min(95, Math.round(score)));
  };

  const normalizedBreakdown: SynastryBreakdownV4 = {
    emotional: absoluteScoreCategory(breakdown.emotional, maxScores.emotional),
    love: absoluteScoreCategory(breakdown.love, maxScores.love),
    commitment: Math.max(15, absoluteScoreCategory(breakdown.commitment, maxScores.commitment)),
    chemistry: absoluteScoreCategory(breakdown.chemistry, maxScores.chemistry),
    family: absoluteScoreCategory(breakdown.family, maxScores.family),
    communication: absoluteScoreCategory(breakdown.communication, maxScores.communication),
    growth: absoluteScoreCategory(breakdown.growth, maxScores.growth),
    values: absoluteScoreCategory(breakdown.values, maxScores.values),
    prosperity: absoluteScoreCategory(breakdown.prosperity, maxScores.prosperity),
  };

  // RAW SCORE: Sum all contribution points
  const rawScore = contributions.reduce((sum, c) => sum + c.points, 0);

  // LONGEVITY PERTURBATION: Apply research-validated prediction to raw score.
  // The validated marriage/divorce indicators (Mercury-North Node, Composite Saturn,
  // Saturn-Saturn Opposition, etc.) produce a predictionScore (-100 to +100) and
  // confidence (0-100%). This perturbation amplifies their signal, which otherwise
  // gets drowned out by hundreds of non-predictive aspect points.
  //   Confident marriage prediction → up to +250 raw points
  //   Confident divorce prediction  → up to -250 raw points
  //   Uncertain prediction          → ±30 raw points in prediction direction
  const predScore = longevityValidation.predictionScore; // -100 to +100
  const predConf = longevityValidation.predictionConfidence / 100; // 0 to 1
  const predDirection = predScore >= 0 ? 1 : 0;
  const isConfident = Math.abs(predScore) >= 25 && predConf >= 0.3;
  const PERTURB_MAX = 750;
  const PERTURB_UNCERTAIN = 30;
  const perturbation = isConfident
    ? predDirection * PERTURB_MAX * (Math.abs(predScore) / 100) * predConf
    : predDirection * PERTURB_UNCERTAIN * (Math.abs(predScore) / 100);
  // DURATION CLASSIFIER: Trained on 0-2yr vs 21+yr marriages (75.4% CV accuracy).
  // Adjusts the longevity perturbation based on duration-specific factor patterns.
  // Positive durationScore = long-term indicators present, negative = short-term indicators.
  const durationResult = computeDurationScore(contributions);
  const durationAdjustment = durationResult.normalizedDurationScore; // -100 to +100

  // Blend: longevity perturbation gets scaled by duration classifier agreement/disagreement.
  // If both agree (e.g., longevity says married + duration says long), full perturbation.
  // If they disagree (e.g., longevity says married but duration says short), reduce perturbation.
  const DURATION_PERTURB_MAX = 500; // Additional ± raw points from duration classifier
  const durationPerturbation = (durationAdjustment / 100) * DURATION_PERTURB_MAX;

  // When models conflict, dampen the longevity perturbation
  const modelsConflict =
    (predScore >= 25 && durationResult.prediction === 'likely-short') ||
    (predScore <= -25 && durationResult.prediction === 'likely-long');
  const effectivePerturbation = modelsConflict ? Math.round(perturbation * 0.3) : perturbation;

  const perturbedRawScore = rawScore + effectivePerturbation + durationPerturbation;

  // Contribution labels are added after the override below so descriptions are accurate

  // SIGMOID CURVE: Maps raw score to 0-95% range
  // Midpoint=800: raw 800 → ~48%. Steepness=0.002 for gentle spread.
  // Recalibrated for RFE-boosted scores (positive scores typically 1000-2500+).
  const CURVE_MIDPOINT = 1200;
  const CURVE_STEEPNESS = 0.0025;
  const CURVE_MAX = 95;

  const sigmoid = (x: number) => CURVE_MAX / (1 + Math.exp(-CURVE_STEEPNESS * (x - CURVE_MIDPOINT)));

  let curveScore = sigmoid(perturbedRawScore);

  // Apply penalty caps based on risk level
  let maxPossibleScore = CURVE_MAX;

  if (researchValidation.riskLevel === 'CRITICAL') {
    maxPossibleScore = 85;
  } else if (researchValidation.riskLevel === 'HIGH') {
    maxPossibleScore = 90;
  } else if (researchValidation.riskLevel === 'MODERATE') {
    maxPossibleScore = 93;
  }

  let totalScore = Math.max(15, Math.min(maxPossibleScore, Math.round(curveScore)));

  // Longevity penalty: flat deduction instead of cap
  if (longevityValidation.longevityRating === 'AT_RISK') {
    totalScore = Math.max(15, totalScore - 10);
  }
  const topReason = getTopReasonV4(normalizedBreakdown, researchValidation, longevityValidation, houseOverlayValidation, elementBalance, natalBalanceValidation);

  // Override longevity prediction when duration classifier disagrees
  // If longevity says "likely-married" but duration says "likely-short", downgrade to "uncertain"
  // and update summary to reflect the conflict
  if (longevityValidation.prediction === 'likely-married' && durationResult.prediction === 'likely-short') {
    longevityValidation.prediction = 'uncertain';
    longevityValidation.predictionScore = Math.round(longevityValidation.predictionScore * 0.3); // Dampen toward 0
    longevityValidation.predictionConfidence = Math.min(40, longevityValidation.predictionConfidence); // Cap confidence low
    longevityValidation.summary = `Mixed signals: structural indicators favor longevity, but factor profile matches short-term marriages. ${longevityValidation.summary}`;
  }
  // If longevity says "likely-divorce" but duration says "likely-long", soften to uncertain
  if (longevityValidation.prediction === 'likely-divorce' && durationResult.prediction === 'likely-long') {
    longevityValidation.prediction = 'uncertain';
    longevityValidation.predictionScore = Math.round(longevityValidation.predictionScore * 0.3);
    longevityValidation.predictionConfidence = Math.min(40, longevityValidation.predictionConfidence);
    longevityValidation.summary = `Mixed signals: structural risk factors present, but factor profile matches long-term marriages. ${longevityValidation.summary}`;
  }

  // Now add contribution labels (after override, so descriptions are accurate)
  if (Math.abs(effectivePerturbation) >= 1) {
    const predLabel = longevityValidation.prediction === 'likely-married'
      ? 'Structural longevity: long-term indicators'
      : longevityValidation.prediction === 'likely-divorce'
        ? 'Structural longevity: divorce risk indicators'
        : 'Structural longevity: mixed indicators';
    const confLabel = `${longevityValidation.predictionConfidence}% confidence`;
    contributions.unshift({
      id: 'longevity-perturbation',
      category: 'commitment',
      description: `${predLabel} (${confLabel})`,
      points: Math.round(effectivePerturbation),
      type: 'longevity',
    });
  }

  if (Math.abs(durationPerturbation) >= 5) {
    const durLabel = durationResult.prediction === 'likely-long'
      ? 'Duration pattern: matches long-term marriages (21+ yrs)'
      : durationResult.prediction === 'likely-short'
        ? 'Duration pattern: matches short-term marriages (0-2 yrs)'
        : 'Duration pattern: inconclusive';
    contributions.unshift({
      id: 'duration-classifier',
      category: 'commitment',
      description: durLabel,
      points: Math.round(durationPerturbation),
      type: 'longevity',
    });
  }

  const durationValidation: DurationValidation = {
    rawDurationScore: durationResult.rawDurationScore,
    normalizedDurationScore: durationResult.normalizedDurationScore,
    prediction: durationResult.prediction,
    perturbationApplied: Math.round(durationPerturbation),
  };

  return {
    totalScore,
    rawScore,
    breakdown: normalizedBreakdown,
    researchValidation,
    longevityValidation,
    durationValidation,
    houseOverlayValidation,
    elementBalance,
    natalBalanceValidation,
    contributions,
    topReason,
    warnings,
    variant: '4.0',
    adjustmentsApplied,
  };
}

function getTopReasonV4(
  breakdown: SynastryBreakdownV4,
  research: ResearchValidation,
  longevity: LongevityValidation,
  houseOverlay: HouseOverlayValidation,
  elements: ElementBalance,
  natalBalance: NatalBalanceValidation
): string {
  if (elements.compatibility >= 0.6) {
    return `Strong element compatibility: ${elements.matchingElements[0]?.name || 'harmonious elemental balance'}`;
  }

  if (natalBalance.rating === 'EXCELLENT') {
    return "Both natal charts are internally well-aspected — each partner brings personal stability";
  }

  if (longevity.longevityRating === 'STRONG') {
    if (longevity.compositeSaturnSign === 'Capricorn') {
      return "Composite Saturn in Capricorn creates solid foundation";
    }
    return "Strong longevity indicators";
  }

  if (houseOverlay.significantOverlays.length >= 2) {
    return houseOverlay.significantOverlays[0].name;
  }

  if (research.marriagePredictorsFound.length >= 2) {
    return `Research-validated: ${research.marriagePredictorsFound.slice(0, 2).join(' and ')}`;
  }

  if (research.riskLevel === 'CRITICAL') {
    return "This pairing faces significant structural challenges";
  }

  if (longevity.longevityRating === 'AT_RISK') {
    return "Focus on building strong communication patterns";
  }

  const entries = Object.entries(breakdown) as [keyof SynastryBreakdownV4, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0][0];

  const reasons: Record<keyof SynastryBreakdownV4, string> = {
    emotional: "Deep emotional resonance through Moon connections",
    love: "Natural harmony and love through Venus connections",
    commitment: "Saturn aspects provide structure for lasting commitment",
    chemistry: "Strong attraction energy creates magnetic connection",
    family: "Strong foundations for family and home life",
    communication: "Mercury aspects create intellectual rapport",
    growth: "Jupiter and Node alignments support mutual expansion",
    values: "Shared values and elemental harmony",
    prosperity: "Research-validated indicators of lasting partnership",
  };

  return reasons[top] ?? "Multiple harmonious factors create compatibility";
}
