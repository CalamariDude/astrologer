/**
 * Chart Reading Tree — Type Definitions
 * Ported from DruzeMatchWeb for Astrologer AI readings
 */

// ─── NatalChart (compatible with Astrologer chart data format) ──

export interface NatalChart {
  planets: Record<string, {
    longitude: number;
    sign?: string;
    retrograde?: boolean;
    house?: number;
    degree?: number;
  }>;
  houses?: Record<string, number>;
  angles?: { ascendant: number; midheaven: number };
}

// ─── Astrological Data Constants ─────────────────────────────────

export const TRADITIONAL_RULERS: Record<string, { ruler: string; rulerName: string; rulerSymbol: string }> = {
  Aries: { ruler: 'mars', rulerName: 'Mars', rulerSymbol: '\u2642\uFE0E' },
  Taurus: { ruler: 'venus', rulerName: 'Venus', rulerSymbol: '\u2640\uFE0E' },
  Gemini: { ruler: 'mercury', rulerName: 'Mercury', rulerSymbol: '\u263F\uFE0E' },
  Cancer: { ruler: 'moon', rulerName: 'Moon', rulerSymbol: '\u263D\uFE0E' },
  Leo: { ruler: 'sun', rulerName: 'Sun', rulerSymbol: '\u2609\uFE0E' },
  Virgo: { ruler: 'mercury', rulerName: 'Mercury', rulerSymbol: '\u263F\uFE0E' },
  Libra: { ruler: 'venus', rulerName: 'Venus', rulerSymbol: '\u2640\uFE0E' },
  Scorpio: { ruler: 'pluto', rulerName: 'Pluto', rulerSymbol: '\u2647\uFE0E' },
  Sagittarius: { ruler: 'jupiter', rulerName: 'Jupiter', rulerSymbol: '\u2643\uFE0E' },
  Capricorn: { ruler: 'saturn', rulerName: 'Saturn', rulerSymbol: '\u2644\uFE0E' },
  Aquarius: { ruler: 'uranus', rulerName: 'Uranus', rulerSymbol: '\u2645\uFE0E' },
  Pisces: { ruler: 'neptune', rulerName: 'Neptune', rulerSymbol: '\u2646\uFE0E' },
};

export const HOUSE_TOPICS: Record<number, string> = {
  1: 'Self, identity, appearance, new beginnings',
  2: 'Money, possessions, values, self-worth',
  3: 'Communication, siblings, short trips, learning',
  4: 'Home, family, roots, emotional foundations',
  5: 'Romance, creativity, children, pleasure',
  6: 'Health, daily routine, service, work habits',
  7: 'Partnerships, marriage, open enemies, contracts',
  8: 'Transformation, shared resources, intimacy, death/rebirth',
  9: 'Travel, higher education, philosophy, beliefs',
  10: 'Career, public reputation, authority, achievements',
  11: 'Friends, groups, hopes, wishes, community',
  12: 'Spirituality, isolation, hidden enemies, unconscious',
};

export const HOUSE_TO_SIGN: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

// ─── Parameters ────────────────────────────────────────────────────

export interface ChartReadingParams {
  depth_backward: number;
  depth_forward: number;
  include_outer_planets: boolean;
  include_spark: boolean;
  include_decan: boolean;
  fusion_cusp_orb: number;
}

export const DEFAULT_PARAMS: ChartReadingParams = {
  depth_backward: 1,
  depth_forward: 1,
  include_outer_planets: false,
  include_spark: true,
  include_decan: true,
  fusion_cusp_orb: 2,
};

// ─── Question Categories ───────────────────────────────────────────

export interface QuestionCategory {
  key: string;
  label: string;
  primaryHouses: number[];
  description: string;
}

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  { key: 'career', label: 'Career', primaryHouses: [10, 6, 2], description: 'Work, public role, daily routine, income' },
  { key: 'love', label: 'Love', primaryHouses: [7, 5, 8], description: 'Partnerships, romance, intimacy' },
  { key: 'family', label: 'Family', primaryHouses: [4, 5, 10], description: 'Home, children, parents' },
  { key: 'health', label: 'Health', primaryHouses: [6, 1, 8], description: 'Body, vitality, transformation' },
  { key: 'spirituality', label: 'Spirituality', primaryHouses: [9, 12, 8], description: 'Beliefs, hidden knowledge, transcendence' },
  { key: 'general', label: 'General', primaryHouses: [1, 10, 7], description: 'Overall life themes' },
];

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  career: ['job', 'work', 'career', 'money', 'income', 'profession', 'business', 'boss', 'promotion', 'salary'],
  love: ['love', 'relationship', 'partner', 'marriage', 'dating', 'romance', 'intimacy', 'boyfriend', 'girlfriend', 'husband', 'wife'],
  family: ['family', 'home', 'kids', 'children', 'parents', 'mother', 'father', 'sibling'],
  health: ['health', 'body', 'energy', 'fitness', 'illness', 'medical', 'weight', 'mental', 'anxiety'],
  spirituality: ['spiritual', 'purpose', 'meaning', 'soul', 'faith', 'meditation', 'growth', 'destiny'],
};

export function detectCategories(question: string): QuestionCategory[] {
  const lower = question.toLowerCase();
  const matched: QuestionCategory[] = [];
  for (const [key, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      const cat = QUESTION_CATEGORIES.find(c => c.key === key);
      if (cat) matched.push(cat);
    }
  }
  if (matched.length === 0) {
    const general = QUESTION_CATEGORIES.find(c => c.key === 'general');
    if (general) matched.push(general);
  }
  return matched;
}

// ─── Aspect within Tree ────────────────────────────────────────────

export interface TreeAspect {
  target: string;
  target_longitude: number;
  type: string;
  name: string;
  symbol: string;
  angle: number;
  orb: number;
  forced: boolean;
  energy_flow: string;
  nature: 'harmonious' | 'challenging' | 'neutral';
  target_sign: string;
  target_house: number;
  target_retrograde: boolean;
}

// ─── Planet Analysis (core unit) ───────────────────────────────────

export interface PlanetAnalysis {
  planet: string;
  longitude: number;
  sign: string;
  house: number;
  house_natural_sign: string;
  house_themes: string;
  retrograde: boolean;
  spark?: { sign: string; symbol: string };
  decan?: { number: number; sign: string };
  retrograde_house: boolean;
  fusion_cusp?: { from_house: number; to_house: number };
  aspects: TreeAspect[];
}

// ─── Backward Trace ────────────────────────────────────────────────

export interface SourceHouse {
  house: number;
  sign_on_cusp: string;
  natural_sign: string;
  natural_themes: string;
  retrograde_house: boolean;
  planets_in_house: PlanetAnalysis[];
}

export interface BackwardTrace {
  ruled_signs: string[];
  source_houses: SourceHouse[];
}

// ─── Forward Trace ─────────────────────────────────────────────────

export interface ForwardTrace {
  house_sign: string;
  house_ruler: string;
  ruler_position?: PlanetAnalysis;
  next?: ForwardTrace;
}

// ─── Vantage Tree ──────────────────────────────────────────────────

export interface VantageTree {
  planet: PlanetAnalysis;
  co_tenants: PlanetAnalysis[];
  backward_trace: BackwardTrace;
  forward_trace: ForwardTrace;
}

// ─── Derived House Config ──────────────────────────────────────────

export interface DerivedHouseConfig {
  derived_from_house: number;
  label: string;
  original_asc_longitude: number;
  derived_asc_longitude: number;
}

export const DERIVED_HOUSE_PERSPECTIVES: Record<string, { house: number; label: string }[]> = {
  love: [
    { house: 5, label: "Romance & Dating (H5→H1)" },
    { house: 7, label: "Partner's Perspective (H7→H1)" },
    { house: 8, label: "Intimacy & Merging (H8→H1)" },
  ],
  career: [
    { house: 2, label: "Income & Self-Worth (H2→H1)" },
    { house: 6, label: "Daily Work & Service (H6→H1)" },
    { house: 10, label: "Public Reputation (H10→H1)" },
  ],
  family: [
    { house: 4, label: "Home & Roots (H4→H1)" },
    { house: 5, label: "Children & Creativity (H5→H1)" },
    { house: 10, label: "Father & Authority (H10→H1)" },
  ],
  health: [
    { house: 1, label: "Physical Body (H1→H1)" },
    { house: 6, label: "Routine & Habits (H6→H1)" },
    { house: 8, label: "Deep Healing (H8→H1)" },
  ],
  spirituality: [
    { house: 8, label: "Death & Rebirth (H8→H1)" },
    { house: 9, label: "Higher Learning (H9→H1)" },
    { house: 12, label: "The Unconscious (H12→H1)" },
  ],
};

// ─── Compact Chart Summary ─────────────────────────────────────────

export interface CompactPlanetSummary {
  planet: string;
  sign: string;
  house: number;
  retrograde: boolean;
  aspect_count: number;
}

export interface CompactChartSummary {
  rising_sign: string;
  planets: CompactPlanetSummary[];
}

// ─── Full Chart Reading Tree ───────────────────────────────────────

export interface ChartReadingTree {
  question: string;
  category: string;
  rising_sign: string;
  rising_longitude: number;
  vantages: VantageTree[];
  parameters: ChartReadingParams;
  derived?: DerivedHouseConfig;
}
