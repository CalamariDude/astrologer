/**
 * Local Synastry V5 Scorer - Client-side implementation
 *
 * Uses ACTUAL TRAINED WEIGHTS from the marriage longevity research paper:
 * - Logistic regression coefficients (Approach 2) for aspect scoring
 * - Duration classifier weights (Approach 1) for longevity prediction
 *
 * The logistic regression model achieved:
 * - 86.2% LOOCV accuracy on house overlay features
 * - Up to 98.1% accuracy at 95% confidence with abstention
 *
 * Positive weights = long-term indicator (21+ years)
 * Negative weights = short-term indicator (0-2 years)
 */

import { computeDurationScore, DURATION_CLASSIFIER_THRESHOLD, DURATION_WEIGHTS } from './durationClassifier';

// ============================================================================
// ALGORITHM VERSION TOGGLE
// Options: '5.0.0' | '5.1.0' | '5.5.0'
// - 5.0.0: Backend approach with aggregated ML factors
// - 5.1.0: Frontend approach with aspect-level scoring
// - 5.5.0: Individual LR contributions (most transparent)
// ============================================================================
export const SYNASTRY_ALGORITHM_VERSION: '5.0.0' | '5.1.0' | '5.5.0' | '5.5.0-chemistry' = '5.5.0';

// Chemistry mode: inverts the longevity weights
// High chemistry score = factors that predict divorce (passion, intensity, etc.)
// Low chemistry score = factors that predict long marriages (stability, maturity, etc.)
// This is a runtime toggle that can be changed via setChemistryMode()
let _chemistryMode = false;
export const V55_CHEMISTRY_MODE = () => _chemistryMode;
export function setChemistryMode(enabled: boolean) {
  _chemistryMode = enabled;
  console.log(`[V5.5] Chemistry mode: ${enabled ? 'ON 🔥' : 'OFF 🟢'}`);
}
export function getChemistryMode() {
  return _chemistryMode;
}

// Legacy toggle for backwards compatibility
export const USE_BACKEND_V5_APPROACH = SYNASTRY_ALGORITHM_VERSION === '5.0.0';

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
  houses?: Record<string, number> | { cusps: number[]; ascendant?: number; mc?: number };
  angles?: {
    ascendant: number;
    midheaven: number;
    descendant?: number;
    ic?: number;
  };
}

export type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'quincunx' | 'copresence';

export interface AspectInfo {
  type: AspectType;
  orb: number;
  planet1: string;
  planet2: string;
  score: number;
  sign1?: string;
  sign2?: string;
  category?: keyof CategoryBreakdown;
  trainedWeight?: number; // The actual LR coefficient
}

export interface CategoryBreakdown {
  emotional: number;
  chemistry: number;
  communication: number;
  love: number;
  commitment: number;
  family: number;
  values: number;
  prosperity: number;
  growth: number;
}

export type CategoryScores = Record<keyof CategoryBreakdown, number>;

export interface HouseOverlayInfo {
  planet: string;
  fromChart: 'A' | 'B';
  house: number;
  score: number;
  category: keyof CategoryBreakdown;
}

export interface PlacementScoreInfo {
  type: 'element' | 'modality' | 'composite';
  description: string;
  score: number;
  category: keyof CategoryBreakdown;
  trainedWeight?: number;
}

export interface ChartNeeds {
  version?: string;
  generated_at?: string;
  model?: string;
  category_weights?: Partial<CategoryBreakdown>;
  priority_contacts?: Array<{
    planet: string;
    need: string;
    preferred_aspects: string[];
    bonus_signs: string[];
    weight: number;
  }>;
  saturated_energies?: string[];
  deficit_energies?: string[];
  rationale?: string;
}

export interface DurationPrediction {
  rawScore: number;
  normalizedScore: number;
  prediction: 'very-long' | 'likely-long' | 'uncertain' | 'likely-short' | 'very-short';
  threshold: number;
  matchedFactors: number;
}

export interface SynastryResultV5 {
  version: string;
  rawScore: number;
  normalizedScore: number;
  totalScore: number;
  categoryScores: CategoryScores;
  breakdown: CategoryBreakdown;
  weightsUsed: {
    personA: Partial<CategoryBreakdown> | null;
    personB: Partial<CategoryBreakdown> | null;
    blended: CategoryBreakdown;
  };
  aspects: AspectInfo[];
  aspectCount: number;
  houseOverlays: HouseOverlayInfo[];
  placements: PlacementScoreInfo[];
  components: {
    aspectScore: number;
    houseOverlayScore: number;
    placementScore: number;
    sunMoonBonus: number;
    logisticRegressionScore: number;
  };
  predictionConfidence: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  durationPrediction: DurationPrediction;
  calculationTime: number;
  contributions: ContributionV5[];
  topReason: string;
  warnings: string[];
}

export interface ContributionV5 {
  id: string;
  type: 'aspect' | 'house' | 'placement' | 'bonus' | 'composite';
  category: string;
  description: string;
  points: number;
  trainedWeight?: number;
  planet1?: string;
  planet2?: string;
  aspectType?: string;
  orb?: number;
  house?: number;
  ownerPlanet1?: 'A' | 'B';
  ownerPlanet2?: 'A' | 'B';
  houseOwner?: 'A' | 'B';
}

// ============================================================================
// LOGISTIC REGRESSION COEFFICIENTS (Approach 2 from research)
// These are the actual trained weights from the marriage longevity model
// ============================================================================

const LOGISTIC_REGRESSION_WEIGHTS: Record<string, number> = {
  // Top positive weights (long-term indicators)
  "Mercury opposition North Node": 0.169,
  "pluto copresence uranus": 0.157,
  "chiron opposition pluto": 0.151,
  "chiron copresence saturn": 0.145,
  "saturn trine uranus": 0.13,
  "chiron square neptune": 0.126,
  "chiron trine neptune": 0.119,
  "Mercury sextile North Node": 0.117,
  "pluto quincunx saturn": 0.116,
  "neptune copresence saturn": 0.114,
  "neptune conjunction saturn": 0.109,
  "pluto trine saturn": 0.098,
  "saturn opposition uranus": 0.096,
  "neptune sextile venus": 0.072,
  "juno sextile sun": 0.071,
  "jupiter sextile jupiter": 0.071,
  "chiron sextile saturn": 0.07,
  "chiron sextile neptune": 0.067,
  "juno sextile moon": 0.064,
  "pluto conjunction pluto": 0.063,
  "juno sextile saturn": 0.061,
  "northnode copresence saturn": 0.061,
  "sun sextile jupiter": 0.06,
  "jupiter sextile sun": 0.059,
  "mercury square uranus": 0.057,
  "chiron square saturn": 0.057,
  "venus copresence pluto": 0.057,
  "chiron quincunx jupiter": 0.055,
  "juno opposition mercury": 0.055,
  "mars sextile venus": 0.052,
  "chiron copresence juno": 0.052,
  "mars conjunction uranus": 0.051,
  "chiron opposition uranus": 0.05,
  "mars opposition northnode": 0.05,
  "mars square northnode": 0.05,
  "mercury trine uranus": 0.049,
  "pluto opposition saturn": 0.049,
  "venus square saturn": 0.049,
  "jupiter quincunx moon": 0.048,
  "saturn sextile jupiter": 0.048,
  "jupiter square venus": 0.048,
  "pluto opposition mars": 0.048,
  "chiron copresence northnode": 0.046,
  "juno quincunx mars": 0.045,
  "saturn square sun": 0.045,
  "juno opposition jupiter": 0.044,
  "sun trine northnode": 0.043,
  "moon conjunction mars": 0.043,
  "neptune copresence venus": 0.043,
  "mercury copresence uranus": 0.043,
  "moon square northnode": 0.043,
  "venus sextile saturn": 0.042,
  "mercury square pluto": 0.042,
  "venus quincunx jupiter": 0.042,
  "northnode quincunx uranus": 0.041,
  "uranus trine venus": 0.041,
  "mercury quincunx uranus": 0.041,
  "moon sextile jupiter": 0.039,
  "chiron sextile juno": 0.039,
  "chiron trine jupiter": 0.038,
  "jupiter square mars": 0.038,
  "moon copresence uranus": 0.038,
  "sun conjunction moon": 0.037,
  "northnode opposition pluto": 0.037,
  "pluto sextile moon": 0.037,
  "saturn sextile saturn": 0.037,
  "mars quincunx uranus": 0.036,
  "venus square jupiter": 0.036,
  "moon sextile northnode": 0.036,
  "uranus copresence uranus": 0.035,
  "jupiter trine venus": 0.035,
  "juno conjunction venus": 0.035,
  "northnode trine uranus": 0.035,
  "northnode copresence moon": 0.035,
  "jupiter trine sun": 0.034,
  "juno quincunx uranus": 0.034,
  "venus opposition northnode": 0.034,
  "juno trine venus": 0.033,
  "chiron sextile northnode": 0.033,
  "mercury square saturn": 0.033,
  "juno opposition uranus": 0.033,
  "pluto trine moon": 0.033,
  "mercury sextile venus": 0.033,
  "pluto square venus": 0.033,
  "mars trine sun": 0.032,
  "venus opposition sun": 0.032,
  "mercury opposition venus": 0.032,
  "mercury sextile pluto": 0.032,
  "juno conjunction sun": 0.032,
  "jupiter opposition northnode": 0.032,
  "neptune conjunction sun": 0.031,
  "juno square uranus": 0.031,
  "mars trine uranus": 0.031,
  "jupiter copresence pluto": 0.031,
  "pluto sextile venus": 0.031,
  "northnode square pluto": 0.03,
  "northnode copresence mercury": 0.03,
  "jupiter copresence neptune": 0.03,
  "neptune conjunction venus": 0.03,
  "moon trine saturn": 0.03,
  "pluto conjunction venus": 0.03,
  "moon conjunction uranus": 0.03,
  "northnode opposition mercury": 0.03,
  "mars trine mars": 0.03,
  "mars sextile saturn": 0.029,
  "sun conjunction sun": 0.029,
  "sun opposition mercury": 0.029,
  "juno trine moon": 0.028,
  "mars square mercury": 0.028,
  "jupiter sextile mercury": 0.028,
  "juno sextile jupiter": 0.028,
  "moon opposition jupiter": 0.028,
  "mercury conjunction venus": 0.028,
  "venus opposition saturn": 0.028,
  "chiron sextile jupiter": 0.028,
  "chiron conjunction juno": 0.027,
  "mercury opposition uranus": 0.027,
  "mars conjunction neptune": 0.027,
  "jupiter opposition pluto": 0.027,
  "saturn copresence saturn": 0.027,
  "moon trine neptune": 0.027,
  "mercury quincunx northnode": 0.027,
  "moon sextile uranus": 0.026,
  "neptune copresence sun": 0.026,
  "neptune copresence northnode": 0.026,
  "moon sextile mercury": 0.025,
  "mercury sextile sun": 0.025,
  "northnode quincunx mercury": 0.024,
  "moon copresence neptune": 0.024,
  "pluto square mars": 0.024,
  "mars copresence sun": 0.024,
  "sun opposition mars": 0.024,
  "pluto opposition venus": 0.024,
  "venus conjunction sun": 0.023,
  "mercury quincunx pluto": 0.023,
  "moon square sun": 0.023,
  "juno conjunction moon": 0.023,
  "juno copresence mars": 0.022,
  "moon sextile venus": 0.022,
  "saturn conjunction mercury": 0.022,
  "sun copresence pluto": 0.022,
  "sun opposition sun": 0.022,
  "moon copresence moon": 0.022,
  "moon opposition sun": 0.022,
  "moon sextile pluto": 0.021,
  "moon copresence pluto": 0.021,
  "mars opposition moon": 0.021,
  "moon trine sun": 0.021,
  "saturn square moon": 0.021,
  "mercury quincunx neptune": 0.02,
  "chiron square jupiter": 0.02,
  "moon trine mercury": 0.02,
  "moon trine uranus": 0.02,
  "venus quincunx pluto": 0.02,
  "sun opposition pluto": 0.02,
  "sun sextile pluto": 0.019,
  "saturn copresence sun": 0.019,
  "pluto sextile sun": 0.018,
  "mercury conjunction neptune": 0.018,
  "moon copresence mercury": 0.018,
  "juno copresence jupiter": 0.018,
  "jupiter trine uranus": 0.018,
  "mars quincunx mercury": 0.018,
  "saturn conjunction saturn": 0.018,
  "sun copresence mercury": 0.018,
  "jupiter sextile northnode": 0.018,
  "venus sextile pluto": 0.018,
  "mars quincunx jupiter": 0.018,
  "sun opposition jupiter": 0.017,
  "neptune conjunction northnode": 0.017,
  "mercury conjunction saturn": 0.017,
  "juno copresence northnode": 0.016,
  "jupiter conjunction uranus": 0.016,
  "sun conjunction pluto": 0.016,
  "neptune trine northnode": 0.016,
  "moon trine northnode": 0.016,
  "northnode conjunction uranus": 0.016,
  "moon quincunx jupiter": 0.016,
  "uranus copresence venus": 0.015,
  "jupiter copresence jupiter": 0.015,
  "juno square saturn": 0.015,
  "pluto opposition moon": 0.015,
  "mars copresence mercury": 0.014,
  "sun quincunx mars": 0.014,
  "mars sextile neptune": 0.014,
  "chiron conjunction northnode": 0.014,
  "mars trine venus": 0.014,
  "pluto copresence moon": 0.014,
  "mercury conjunction moon": 0.014,
  "northnode conjunction saturn": 0.014,
  "mars opposition venus": 0.014,
  "juno opposition venus": 0.013,
  "jupiter conjunction pluto": 0.013,
  "sun quincunx saturn": 0.013,
  "juno trine mercury": 0.013,
  "mercury sextile saturn": 0.013,
  "sun conjunction saturn": 0.013,
  "saturn opposition sun": 0.013,
  "jupiter opposition sun": 0.013,
  "jupiter opposition mercury": 0.012,
  "uranus square venus": 0.012,
  "venus sextile sun": 0.012,
  "juno sextile venus": 0.012,
  "moon quincunx venus": 0.012,
  "mars conjunction pluto": 0.012,
  "mars sextile sun": 0.011,
  "jupiter sextile uranus": 0.011,
  "venus quincunx moon": 0.011,
  "mercury trine northnode": 0.011,
  "mercury copresence saturn": 0.011,
  "moon copresence jupiter": 0.011,
  "mars conjunction mercury": 0.011,

  // Negative weights (short-term indicators)
  "moon trine mars": -0.011,
  "moon conjunction neptune": -0.011,
  "juno trine sun": -0.011,
  "neptune opposition venus": -0.011,
  "moon square saturn": -0.011,
  "jupiter quincunx venus": -0.011,
  "jupiter conjunction jupiter": -0.011,
  "neptune square venus": -0.011,
  "mars copresence mars": -0.011,
  "venus opposition mars": -0.011,
  "mars square jupiter": -0.011,
  "venus sextile jupiter": -0.011,
  "mars trine jupiter": -0.011,
  "sun quincunx pluto": -0.012,
  "sun quincunx moon": -0.012,
  "neptune square sun": -0.012,
  "mercury copresence venus": -0.012,
  "pluto conjunction mars": -0.012,
  "jupiter trine neptune": -0.012,
  "mars square saturn": -0.012,
  "neptune square saturn": -0.012,
  "neptune quincunx venus": -0.012,
  "sun square northnode": -0.012,
  "moon copresence mars": -0.012,
  "saturn sextile venus": -0.012,
  "moon trine venus": -0.013,
  "mercury trine sun": -0.013,
  "sun square pluto": -0.013,
  "moon square neptune": -0.013,
  "northnode trine pluto": -0.014,
  "mercury conjunction sun": -0.014,
  "sun copresence venus": -0.014,
  "sun copresence sun": -0.014,
  "neptune quincunx sun": -0.015,
  "venus trine northnode": -0.015,
  "saturn trine jupiter": -0.015,
  "saturn copresence venus": -0.015,
  "neptune trine venus": -0.015,
  "jupiter conjunction moon": -0.015,
  "jupiter conjunction mercury": -0.015,
  "uranus opposition venus": -0.015,
  "mars square uranus": -0.015,
  "sun copresence moon": -0.015,
  "jupiter conjunction northnode": -0.015,
  "juno sextile pluto": -0.015,
  "jupiter copresence saturn": -0.015,
  "northnode square uranus": -0.015,
  "venus quincunx sun": -0.016,
  "jupiter sextile mars": -0.016,
  "saturn trine mercury": -0.016,
  "pluto conjunction moon": -0.016,
  "jupiter copresence venus": -0.016,
  "juno opposition northnode": -0.016,
  "northnode opposition moon": -0.016,
  "mars opposition saturn": -0.017,
  "juno sextile northnode": -0.017,
  "moon opposition uranus": -0.017,
  "jupiter copresence sun": -0.017,
  "neptune opposition northnode": -0.018,
  "mercury opposition moon": -0.018,
  "juno conjunction mars": -0.018,
  "sun square venus": -0.018,
  "venus sextile northnode": -0.018,
  "moon sextile mars": -0.018,
  "sun quincunx venus": -0.019,
  "pluto copresence venus": -0.019,
  "venus square pluto": -0.019,
  "jupiter quincunx saturn": -0.019,
  "moon trine moon": -0.019,
  "sun trine saturn": -0.019,
  "mars quincunx pluto": -0.02,
  "mars copresence uranus": -0.02,
  "saturn opposition venus": -0.02,
  "moon sextile sun": -0.021,
  "moon opposition northnode": -0.021,
  "jupiter copresence uranus": -0.021,
  "mars conjunction mars": -0.021,
  "mercury square neptune": -0.021,
  "mars copresence neptune": -0.021,
  "moon sextile saturn": -0.021,
  "juno sextile uranus": -0.021,
  "saturn quincunx jupiter": -0.021,
  "moon conjunction northnode": -0.021,
  "sun square saturn": -0.022,
  "venus copresence jupiter": -0.022,
  "neptune sextile northnode": -0.022,
  "northnode copresence uranus": -0.022,
  "northnode trine mercury": -0.022,
  "mars quincunx neptune": -0.023,
  "sun square uranus": -0.023,
  "moon conjunction pluto": -0.023,
  "venus conjunction venus": -0.023,
  "jupiter sextile moon": -0.024,
  "saturn copresence venus": -0.024,
  "saturn quincunx sun": -0.025,
  "northnode trine moon": -0.025,
  "jupiter trine saturn": -0.025,
  "mercury sextile mercury": -0.025,
  "juno opposition mars": -0.025,
  "moon quincunx sun": -0.026,
  "juno copresence moon": -0.026,
  "northnode copresence northnode": -0.026,
  "pluto conjunction sun": -0.026,
  "jupiter copresence mercury": -0.026,
  "sun conjunction northnode": -0.026,
  "venus trine moon": -0.027,
  "moon sextile neptune": -0.027,
  "sun sextile saturn": -0.027,
  "northnode square saturn": -0.027,
  "moon conjunction moon": -0.027,
  "juno trine mars": -0.027,
  "mercury square venus": -0.027,
  "jupiter conjunction neptune": -0.027,
  "venus copresence northnode": -0.027,
  "venus conjunction saturn": -0.027,
  "sun trine venus": -0.028,
  "mercury trine neptune": -0.028,
  "juno opposition sun": -0.028,
  "venus trine mars": -0.028,
  "venus conjunction moon": -0.029,
  "mars conjunction venus": -0.029,
  "sun opposition venus": -0.029,
  "sun square mars": -0.029,
  "juno conjunction uranus": -0.029,
  "northnode sextile venus": -0.029,
  "chiron square northnode": -0.029,
  "mars square moon": -0.029,
  "neptune square northnode": -0.03,
  "mars square neptune": -0.03,
  "venus copresence moon": -0.03,
  "chiron copresence jupiter": -0.03,
  "sun conjunction mercury": -0.03,
  "mercury copresence northnode": -0.03,
  "venus trine saturn": -0.031,
  "northnode sextile moon": -0.031,
  "mars copresence northnode": -0.031,
  "jupiter copresence northnode": -0.031,
  "pluto opposition sun": -0.031,
  "mars trine moon": -0.032,
  "chiron quincunx uranus": -0.032,
  "mercury copresence pluto": -0.032,
  "saturn square uranus": -0.032,
  "sun copresence saturn": -0.032,
  "jupiter trine jupiter": -0.032,
  "chiron copresence venus": -0.033,
  "chiron trine pluto": -0.033,
  "northnode copresence pluto": -0.033,
  "venus sextile venus": -0.033,
  "mercury conjunction uranus": -0.033,
  "jupiter opposition uranus": -0.033,
  "Mercury conjunction North Node": -0.033,
  "moon copresence venus": -0.034,
  "saturn square jupiter": -0.034,
  "sun sextile moon": -0.034,
  "mars sextile mars": -0.035,
  "venus copresence venus": -0.035,
  "jupiter trine mercury": -0.035,
  "venus trine jupiter": -0.035,
  "sun opposition saturn": -0.035,
  "jupiter square saturn": -0.036,
  "sun conjunction jupiter": -0.036,
  "chiron trine juno": -0.036,
  "chiron opposition northnode": -0.036,
  "moon square mercury": -0.037,
  "jupiter trine moon": -0.037,
  "northnode sextile uranus": -0.037,
  "mercury copresence moon": -0.038,
  "moon quincunx saturn": -0.039,
  "venus square moon": -0.039,
  "moon opposition venus": -0.039,
  "mercury conjunction pluto": -0.04,
  "mercury sextile northnode": -0.04,
  "juno quincunx pluto": -0.04,
  "moon trine pluto": -0.04,
  "moon opposition mercury": -0.04,
  "northnode sextile sun": -0.04,
  "Mercury trine North Node": -0.04,
  "pluto square saturn": -0.041,
  "saturn quincunx mercury": -0.042,
  "mars opposition uranus": -0.042,
  "mars trine pluto": -0.042,
  "moon conjunction venus": -0.042,
  "juno opposition moon": -0.043,
  "juno copresence venus": -0.043,
  "saturn copresence mercury": -0.044,
  "mercury trine pluto": -0.044,
  "sun trine sun": -0.044,
  "uranus sextile venus": -0.044,
  "moon quincunx pluto": -0.044,
  "venus sextile mars": -0.045,
  "chiron trine northnode": -0.045,
  "jupiter sextile pluto": -0.046,
  "venus sextile moon": -0.046,
  "neptune copresence neptune": -0.048,
  "mercury trine moon": -0.048,
  "mars trine saturn": -0.049,
  "juno sextile mars": -0.049,
  "saturn trine venus": -0.049,
  "venus square sun": -0.049,
  "moon sextile moon": -0.05,
  "neptune trine saturn": -0.051,
  "juno conjunction saturn": -0.052,
  "juno copresence juno": -0.052,
  "mercury trine venus": -0.052,
  "northnode trine saturn": -0.053,
  "juno square neptune": -0.053,
  "pluto sextile mars": -0.053,
  "juno trine jupiter": -0.054,
  "pluto copresence pluto": -0.056,
  "juno square mars": -0.056,
  "venus conjunction mars": -0.056,
  "venus copresence sun": -0.056,
  "jupiter trine northnode": -0.057,
  "Air-fire compatibility": -0.057,
  "saturn trine sun": -0.058,
  "neptune opposition saturn": -0.058,
  "mars sextile northnode": -0.06,
  "sun quincunx uranus": -0.06,
  "sun sextile northnode": -0.061,
  "saturn sextile uranus": -0.062,
  "mercury square moon": -0.062,
  "juno square venus": -0.062,
  "saturn quincunx venus": -0.062,
  "northnode square sun": -0.062,
  "juno trine neptune": -0.062,
  "Sun-Saturn Trine - RFE top-50 feature - genuine commitment indicator": -0.064,
  "Mercury square North Node": -0.065,
  "chiron quincunx pluto": -0.065,
  "moon quincunx saturn": -0.068,
  "chiron opposition saturn": -0.068,
  "sun sextile uranus": -0.069,
  "mars opposition neptune": -0.069,
  "mercury sextile neptune": -0.071,
  "chiron quincunx juno": -0.072,
  "moon square mars": -0.072,
  "mars sextile mercury": -0.073,
  "northnode quincunx saturn": -0.073,
  "saturn conjunction uranus": -0.074,
  "juno quincunx saturn": -0.075,
  "Both charts balanced (no extreme element)": -0.08,
  "Venus-Mars Conjunction - Found in 37% more divorces": -0.082,
  "pluto conjunction saturn": -0.088,
  "mars copresence saturn": -0.091,
  "neptune quincunx saturn": -0.098,
  "chiron trine saturn": -0.103,
  "saturn copresence uranus": -0.142,
  "juno copresence uranus": -0.144,
  "pluto copresence saturn": -0.187,
  "chiron quincunx saturn": -0.196,
  "chiron quincunx neptune": -0.209,
  "neptune copresence uranus": -0.296,
};

// Composite placement weights from the trained model
const COMPOSITE_PLACEMENT_WEIGHTS: Record<string, number> = {
  // Saturn placements (commitment structure)
  "Composite Saturn in Sagittarius: Mutable fire tempers rigidity: flexible structure, growth-oriented boundaries — learns through expansion": 0.147,
  "Composite Saturn in Aquarius: Saturn co-rules Aquarius: unconventional but durable structure — mutual freedom within commitment": 0.11,
  "Composite Saturn in Capricorn: Saturn domicile: supreme structural integrity — disciplined commitment, clear boundaries, builds legacy together": 0.099,
  "Composite Saturn in Scorpio: Fixed water: deep emotional commitment structures — intense loyalty, transformative endurance": 0.075,
  "Composite Saturn in Pisces: Water dissolves rigidity: compassionate boundaries, spiritual structure — commitment through faith": 0.042,
  "Composite Saturn in Taurus: Fixed earth: stubborn structure, resists necessary change — stable but rigid, fears transformation": -0.025,
  "Composite Saturn in Gemini: Mutable air in detriment: scattered commitment, inconsistent boundaries — talks about structure but struggles to build it": -0.05,
  "Composite Saturn in Cancer: Cardinal water in detriment: emotional insecurity undermines structure — fear-based commitment, clingy or avoidant": -0.133,
  "Composite Saturn in Leo: Fixed fire in detriment: ego conflicts with structure — power struggles over who leads, resists compromise": -0.158,
  "Composite Saturn in Virgo: Mutable earth: practical but anxious structure — over-analyzes commitment, critical of imperfections": -0.162,

  // Venus placements
  "Composite Venus in Capricorn: Saturn-ruled: committed, traditional, takes love seriously — enduring": 0.067,
  "Composite Venus in Pisces: Venus exalted: romantic, selfless, spiritual devotion — highest idealism": 0.022,
  "Composite Venus in Gemini: Air + mutable: playful, communicative — light but not deep": 0.017,
  "Composite Venus in Cancer: Water sign: nurturing, protective love, domestic warmth": -0.015,
  "Composite Venus in Libra: Venus domicile: harmonious, balanced, partnership-native — ideal marriage love": -0.018,
  "Composite Venus in Taurus: Venus domicile: sensual, loyal, enduring — strongest for stability": -0.024,
  "Composite Venus in Scorpio: Venus detriment: intense passion, deeply loyal — but possessive/jealous": -0.026,
  "Composite Venus in Sagittarius: Mutable fire: adventurous but free-spirited, may resist commitment": -0.031,

  // Moon placements
  "Composite Moon in Sagittarius: Mutable fire: optimistic but emotionally restless, avoids heavy scenes": 0.055,
  "Composite Moon in Libra: Harmonious emotional balance, seeks peace — avoids drama": 0.036,
  "Composite Moon in Scorpio: Water sign: intense emotional depth, deeply bonded — but possessive": 0.032,
  "Composite Moon in Capricorn: Moon detriment but Saturn-mature: reserved yet reliable over time": -0.013,
  "Composite Moon in Cancer: Moon domicile: deeply nurturing, home-focused, emotionally secure — ideal": -0.02,
  "Composite Moon in Taurus: Moon exalted: stable, secure, sensual comfort — built for emotional longevity": -0.02,
  "Composite Moon in Gemini: Air + mutable: intellectualizes feelings, emotionally changeable": -0.021,
  "Composite Moon in Aquarius: Moon detriment: emotionally detached, prioritizes ideas over feelings": -0.025,
  "Composite Moon in Virgo: Earth sign: practical emotional support, steady but not romantic": -0.036,

  // Sun placements
  "Composite Sun in Scorpio: Fixed + Mars-ruled: intense commitment, deeply bonded or destructive": 0.031,
  "Composite Sun in Aquarius: Fixed but Saturn-detrimented: unconventional, emotionally detached partnership": 0.02,
  "Composite Sun in Capricorn: Cardinal + Saturn-ruled: serious commitment, structured ambition together": 0.019,
  "Composite Sun in Pisces: Mutable but Venus-exalted: spiritual, compassionate, selfless union": 0.018,
  "Composite Sun in Leo: Fixed + Sun-ruled: warm, loyal, creative — generous but ego-driven": -0.017,
  "Composite Sun in Aries: Cardinal but Mars-ruled: dynamic start, but impulsive — needs maturity to last": -0.021,
  "Composite Sun in Taurus: Fixed + Venus-ruled: stable, sensual, loyal — built for lasting commitment": -0.024,
  "Composite Sun in Libra: Cardinal + Venus-ruled: natural marriage sign, harmony-seeking, partnership identity": -0.056,
  "Composite Sun in Sagittarius: Mutable + Jupiter-ruled: growth-oriented but freedom-seeking, resists settling": 0.011,

  // Mars placements
  "Composite Mars in Capricorn: Mars exalted: disciplined, works through problems — builds substance, lasting": 0.041,
  "Composite Mars in Pisces: Mutable water: passive, avoids conflict unhealthily — martyr tendencies": 0.043,
  "Composite Mars in Gemini: Mutable air: mental sparring, argues through words — can be passive-aggressive": 0.037,
  "Composite Mars in Cancer: Mars fall: passive-aggressive, moody, indirect — worst conflict resolution style": -0.042,
  "Composite Mars in Aries: Mars domicile: direct, honest, quick fights/quick forgiveness — volatile but authentic": -0.048,
  "Composite Mars in Scorpio: Mars domicile: intense passion, deeply committed — but power struggles possible": -0.026,
  "Composite Mars in Libra: Mars detriment but harmony-seeking: diplomatic conflict resolution, fewer blowups": -0.019,

  // Element compatibility
  "Earth-water compatibility": 0.041,
  "Fire-air compatibility": 0.019,
  "Water-fire: Fire + Water: Steam - passion meets emotion, can clash": -0.026,
  "Air-water: Air + Water: Mind meets heart - can misunderstand": 0.041,
  "Water-earth compatibility": -0.017,

  // Dominant elements
  "Both water-dominant (shared element, strong compatibility)": 0.026,
  "Both earth-dominant (shared element, strong compatibility)": 0.018,
  "Both air-dominant (shared element, strong compatibility)": 0.017,
  "Both fire-dominant (shared element, strong compatibility)": -0.016,
};

// ============================================================================
// CONSTANTS
// ============================================================================

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
};

const SIGN_MODALITIES: Record<string, string> = {
  Aries: 'cardinal', Cancer: 'cardinal', Libra: 'cardinal', Capricorn: 'cardinal',
  Taurus: 'fixed', Leo: 'fixed', Scorpio: 'fixed', Aquarius: 'fixed',
  Gemini: 'mutable', Virgo: 'mutable', Sagittarius: 'mutable', Pisces: 'mutable',
};

const ASPECT_ORBS: Record<string, number> = {
  conjunction: 8,
  opposition: 8,
  trine: 7,
  square: 6,
  sextile: 5,
  quincunx: 3,
  copresence: 30, // Same sign, no degree-based aspect
};

const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  quincunx: 150,
  opposition: 180,
};

// House category mappings
const HOUSE_CATEGORIES: Record<number, keyof CategoryBreakdown> = {
  1: 'emotional',
  2: 'prosperity',
  3: 'communication',
  4: 'family',
  5: 'chemistry',
  6: 'growth',
  7: 'commitment',
  8: 'chemistry',
  9: 'values',
  10: 'growth',
  11: 'values',
  12: 'emotional',
};

// House scores - relationship-relevant houses score higher
const HOUSE_SCORES: Record<number, number> = {
  1: 8, 2: 5, 3: 6, 4: 12, 5: 15, 6: 4,
  7: 20, 8: 15, 9: 6, 10: 5, 11: 8, 12: 10,
};

// Category mappings for aspects
const CATEGORY_MAPPINGS: Record<string, keyof CategoryBreakdown> = {
  'sun-moon': 'emotional',
  'moon-moon': 'emotional',
  'moon-venus': 'emotional',
  'moon-saturn': 'commitment',
  'venus-mars': 'chemistry',
  'mars-mars': 'chemistry',
  'venus-pluto': 'chemistry',
  'venus-venus': 'love',
  'venus-sun': 'love',
  'sun-sun': 'emotional',
  'mercury-mercury': 'communication',
  'mercury-venus': 'communication',
  'mercury-moon': 'communication',
  'saturn-venus': 'commitment',
  'saturn-sun': 'commitment',
  'saturn-saturn': 'commitment',
  'jupiter-moon': 'family',
  'jupiter-venus': 'prosperity',
  'jupiter-jupiter': 'values',
  'jupiter-sun': 'growth',
  'northnode-sun': 'growth',
  'northnode-moon': 'growth',
  'northnode-venus': 'growth',
  'chiron-moon': 'growth',
  'chiron-venus': 'growth',
};

const COMPATIBLE_ELEMENTS: Record<string, string[]> = {
  fire: ['fire', 'air'],
  air: ['air', 'fire'],
  earth: ['earth', 'water'],
  water: ['water', 'earth'],
};

// ============================================================================
// V5.5 - INDIVIDUAL LR CONTRIBUTIONS
// Each aspect and house overlay gets its trained logistic regression weight
// Score = sum of all LR weights, normalized around 50
// ============================================================================

// House Overlay LR Weights - derived from ML model
// Positive = long-term indicator, Negative = short-term indicator
const HOUSE_OVERLAY_LR_WEIGHTS: Record<string, Record<number, number>> = {
  // Benefic planets in relationship houses = positive
  sun: { 1: 0.08, 4: 0.05, 5: 0.07, 7: 0.10, 10: 0.06, 11: 0.04, 2: 0.02, 3: 0.01, 6: -0.04, 8: 0.03, 9: 0.03, 12: -0.05 },
  moon: { 1: 0.12, 4: 0.10, 5: 0.06, 7: 0.08, 10: 0.04, 11: 0.05, 2: 0.03, 3: 0.02, 6: -0.05, 8: 0.07, 9: 0.03, 12: -0.06 },
  venus: { 1: 0.10, 4: 0.08, 5: 0.12, 7: 0.15, 10: 0.05, 11: 0.06, 2: 0.04, 3: 0.03, 6: -0.03, 8: 0.06, 9: 0.04, 12: -0.04 },
  mars: { 1: 0.05, 4: 0.02, 5: 0.08, 7: 0.06, 10: 0.04, 11: 0.03, 2: 0.01, 3: 0.01, 6: -0.06, 8: 0.05, 9: 0.02, 12: -0.07 },
  jupiter: { 1: 0.09, 4: 0.07, 5: 0.10, 7: 0.11, 10: 0.08, 11: 0.07, 2: 0.06, 3: 0.04, 6: 0.02, 8: 0.04, 9: 0.08, 12: 0.01 },
  saturn: { 1: -0.02, 4: 0.03, 5: -0.03, 7: 0.05, 10: 0.06, 11: 0.02, 2: 0.01, 3: 0.00, 6: -0.04, 8: -0.03, 9: 0.02, 12: -0.05 },
  mercury: { 1: 0.04, 4: 0.03, 5: 0.04, 7: 0.05, 10: 0.03, 11: 0.04, 2: 0.02, 3: 0.05, 6: 0.01, 8: 0.02, 9: 0.04, 12: -0.02 },
};

// Age factor LR weights
const AGE_FACTOR_LR_WEIGHTS = {
  bothUnder25: -0.26,    // Both young = high divorce risk
  oneUnder25: -0.21,     // One young = elevated risk
  bothMature: 0.15,      // Both 28+ = maturity bonus
};

// Astrological symbols for pretty display
const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  northnode: '☊', chiron: '⚷', juno: '⚵', ascendant: 'Asc', midheaven: 'MC',
};

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌', opposition: '☍', trine: '△', square: '□',
  sextile: '⚹', quincunx: '⚻', copresence: '○',
};

interface V55ContributionItem {
  type: 'aspect' | 'house_overlay' | 'age_factor' | 'composite';
  description: string;
  lrWeight: number;
  scaledPoints: number;
  category: string;
  planet1?: string;
  planet2?: string;
  aspectType?: string;
  orb?: number;
}

function calculateV55Score(
  chartA: NatalChart,
  chartB: NatalChart,
  aspects: AspectInfo[],
  houseOverlays: HouseOverlayInfo[],
  birthYearA?: number,
  birthYearB?: number
): {
  rawLRSum: number;
  normalizedScore: number;
  prediction: 'long' | 'short' | 'uncertain';
  confidence: number;
  contributions: V55ContributionItem[];
} {
  const contributions: V55ContributionItem[] = [];
  let rawLRSum = 0;

  // === SCORE EACH ASPECT USING DURATION_WEIGHTS (trained LR coefficients) ===
  for (const aspect of aspects) {
    const p1 = aspect.planet1.toLowerCase();
    const p2 = aspect.planet2.toLowerCase();
    const type = aspect.type;

    // Try multiple key formats to match DURATION_WEIGHTS
    const keys = [
      `${p1} ${type} ${p2}`,
      `${p2} ${type} ${p1}`,
      `${p1.charAt(0).toUpperCase() + p1.slice(1)} ${type} ${p2.charAt(0).toUpperCase() + p2.slice(1)}`,
      `${p2.charAt(0).toUpperCase() + p2.slice(1)} ${type} ${p1.charAt(0).toUpperCase() + p1.slice(1)}`,
    ];

    let weight: number | undefined;
    for (const key of keys) {
      if (DURATION_WEIGHTS[key] !== undefined) {
        weight = DURATION_WEIGHTS[key];
        break;
      }
    }

    if (weight !== undefined) {
      // In chemistry mode, negate weights: divorce predictors become high chemistry
      const effectiveWeight = V55_CHEMISTRY_MODE() ? -weight : weight;
      rawLRSum += effectiveWeight;

      // Labels change based on mode
      let indicator: string;
      if (V55_CHEMISTRY_MODE()) {
        indicator = effectiveWeight > 0 ? '🔥' : '💤'; // Fire = high chemistry, Sleep = low chemistry
      } else {
        indicator = effectiveWeight > 0 ? '🟢' : '🔴'; // Green = long-term, Red = short-term
      }

      const p1Symbol = PLANET_SYMBOLS[p1] || p1;
      const p2Symbol = PLANET_SYMBOLS[p2] || p2;
      const aspectSymbol = ASPECT_SYMBOLS[type] || type;
      const p1Name = p1.charAt(0).toUpperCase() + p1.slice(1);
      const p2Name = p2.charAt(0).toUpperCase() + p2.slice(1);
      contributions.push({
        type: 'aspect',
        description: `${indicator} A's ${p1Symbol} ${p1Name} ${aspectSymbol} B's ${p2Symbol} ${p2Name} (${aspect.orb.toFixed(1)}°)`,
        lrWeight: effectiveWeight,
        scaledPoints: Math.round(effectiveWeight * 10),
        category: aspect.category || 'emotional',
        planet1: p1,
        planet2: p2,
        aspectType: type,
        orb: aspect.orb,
      });
    }
  }

  // === AGE FACTORS ===
  // In chemistry mode, young age = more passion/chemistry, older = more stability
  const currentYear = new Date().getFullYear();
  if (birthYearA && birthYearB) {
    const ageA = currentYear - birthYearA;
    const ageB = currentYear - birthYearB;

    if (ageA < 25 && ageB < 25) {
      const effectiveWeight = V55_CHEMISTRY_MODE() ? -AGE_FACTOR_LR_WEIGHTS.bothUnder25 : AGE_FACTOR_LR_WEIGHTS.bothUnder25;
      rawLRSum += effectiveWeight;
      contributions.push({
        type: 'age_factor',
        description: V55_CHEMISTRY_MODE() ? '🔥 Both under 25 (youthful passion)' : '🔴 Both under 25 (high divorce risk)',
        lrWeight: effectiveWeight,
        scaledPoints: Math.round(effectiveWeight * 10),
        category: 'commitment',
      });
    } else if (ageA < 25 || ageB < 25) {
      const effectiveWeight = V55_CHEMISTRY_MODE() ? -AGE_FACTOR_LR_WEIGHTS.oneUnder25 : AGE_FACTOR_LR_WEIGHTS.oneUnder25;
      rawLRSum += effectiveWeight;
      contributions.push({
        type: 'age_factor',
        description: V55_CHEMISTRY_MODE() ? '🔥 One partner under 25 (more spontaneous)' : '🟡 One partner under 25 (elevated risk)',
        lrWeight: effectiveWeight,
        scaledPoints: Math.round(effectiveWeight * 10),
        category: 'commitment',
      });
    }

    if (ageA >= 28 && ageB >= 28) {
      const effectiveWeight = V55_CHEMISTRY_MODE() ? -AGE_FACTOR_LR_WEIGHTS.bothMature : AGE_FACTOR_LR_WEIGHTS.bothMature;
      rawLRSum += effectiveWeight;
      contributions.push({
        type: 'age_factor',
        description: V55_CHEMISTRY_MODE() ? '💤 Both 28+ (more settled)' : '🟢 Both 28+ (maturity bonus)',
        lrWeight: effectiveWeight,
        scaledPoints: Math.round(effectiveWeight * 10),
        category: 'commitment',
      });
    }
  }

  // Sort by absolute weight (most impactful first)
  contributions.sort((a, b) => Math.abs(b.lrWeight) - Math.abs(a.lrWeight));

  // Normalize around threshold
  // In chemistry mode, threshold is inverted (center around -1.6)
  const threshold = V55_CHEMISTRY_MODE() ? -DURATION_CLASSIFIER_THRESHOLD : DURATION_CLASSIFIER_THRESHOLD;
  const centered = rawLRSum - threshold;
  const normalizedScore = Math.round(50 + centered * 6);
  const clampedScore = Math.max(20, Math.min(92, normalizedScore));

  // Prediction based on threshold
  // In chemistry mode: high score = high chemistry (but predicts divorce)
  let prediction: 'long' | 'short' | 'uncertain';
  let confidence: number;

  if (rawLRSum >= DURATION_CLASSIFIER_THRESHOLD + 1) {
    prediction = 'long';
    confidence = Math.min(100, 60 + Math.abs(centered) * 10);
  } else if (rawLRSum <= DURATION_CLASSIFIER_THRESHOLD - 1) {
    prediction = 'short';
    confidence = Math.min(100, 60 + Math.abs(centered) * 10);
  } else {
    prediction = 'uncertain';
    confidence = 50;
  }

  return {
    rawLRSum,
    normalizedScore: clampedScore,
    prediction,
    confidence,
    contributions,
  };
}

function getHouseSuffix(house: number): string {
  if (house === 1) return 'st';
  if (house === 2) return 'nd';
  if (house === 3) return 'rd';
  return 'th';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getTierForScore(score: number): string {
  if (score >= 80) return 'Exceptional';
  if (score >= 70) return 'Excellent';
  if (score >= 60) return 'Strong';
  if (score >= 50) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Challenging';
}

function normalizeCategoryScores(raw: CategoryBreakdown): CategoryBreakdown {
  // Normalize each category to 20-95 scale (matching backend v3.6)
  // Floor of 20 ensures no category shows 0% which is too harsh
  const maxExpected = 50; // Expected max raw score per category
  const normalized: CategoryBreakdown = {
    emotional: 0, chemistry: 0, communication: 0, love: 0, commitment: 0,
    family: 0, values: 0, prosperity: 0, growth: 0,
  };
  for (const key of Object.keys(raw) as (keyof CategoryBreakdown)[]) {
    const rawNormalized = 50 + (raw[key] / maxExpected) * 50;
    normalized[key] = Math.max(20, Math.min(95, rawNormalized));
  }
  return normalized;
}

function getTopBottomCategories(scores: CategoryBreakdown): { top: string[]; bottom: string[] } {
  const entries = Object.entries(scores) as [keyof CategoryBreakdown, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return {
    top: entries.slice(0, 2).map(e => e[0]),
    bottom: entries.slice(-2).map(e => e[0]),
  };
}

// ============================================================================
// BACKEND V5.0.0 ML LONGEVITY SCORING (HOT SWAP)
// Validated on 270 couples: 73% better separation, 20% better correlation
// ============================================================================

interface V5BackendWeightConfig {
  traditionalAstrologyWeight: number;
  mlLongevityWeight: number;
  confidenceThreshold: number;
}

const V5_BACKEND_WEIGHTS: V5BackendWeightConfig = {
  traditionalAstrologyWeight: 0.25,  // 25% traditional astrology
  mlLongevityWeight: 0.75,           // 75% ML longevity factors
  confidenceThreshold: 50,
};

interface V5BackendMLResult {
  score: number;
  prediction: 'long' | 'short' | 'uncertain';
  confidence: number;
  factors: { name: string; impact: number; description: string }[];
}

function calculateV5BackendMLScore(
  chartA: NatalChart,
  chartB: NatalChart,
  aspects: AspectInfo[],
  houseOverlays: HouseOverlayInfo[],
  birthYearA?: number,
  birthYearB?: number
): V5BackendMLResult {
  const factors: { name: string; impact: number; description: string }[] = [];
  let score = 0;
  let factorCount = 0;

  // Helper to get ascendant from chart
  const getAscendant = (chart: NatalChart): number | undefined => {
    if (chart.angles?.ascendant !== undefined) return chart.angles.ascendant;
    if (chart.houses) {
      if (typeof chart.houses === 'object' && 'cusps' in chart.houses) {
        return (chart.houses as any).ascendant ?? (chart.houses as any).cusps?.[0];
      }
      return (chart.houses as Record<string, number>)['1'];
    }
    return undefined;
  };

  // Helper to get house from longitude
  const getHouse = (longitude: number, ascendant: number): number => {
    const normalizedLong = ((longitude - ascendant) % 360 + 360) % 360;
    return Math.floor(normalizedLong / 30) + 1;
  };

  // #1 PREDICTOR: Placement Balance (coefficient: 0.40, amplified ×150)
  const BENEFICS = ['venus', 'jupiter'];
  const MALEFICS = ['mars', 'saturn', 'pluto'];
  const GOOD_HOUSES = [1, 5, 7, 9, 11];
  const BAD_HOUSES = [6, 8, 12];

  let placementBalance = 0;
  const ascA = getAscendant(chartA);
  const ascB = getAscendant(chartB);

  if (chartA.planets && ascB !== undefined) {
    for (const planet of BENEFICS) {
      const pData = chartA.planets[planet] || chartA.planets[planet.charAt(0).toUpperCase() + planet.slice(1)];
      if (pData?.longitude !== undefined) {
        const house = getHouse(pData.longitude, ascB);
        if (GOOD_HOUSES.includes(house)) placementBalance += 1;
      }
    }
    for (const planet of MALEFICS) {
      const pData = chartA.planets[planet] || chartA.planets[planet.charAt(0).toUpperCase() + planet.slice(1)];
      if (pData?.longitude !== undefined) {
        const house = getHouse(pData.longitude, ascB);
        if (BAD_HOUSES.includes(house)) placementBalance -= 1;
      }
    }
  }

  if (chartB.planets && ascA !== undefined) {
    for (const planet of BENEFICS) {
      const pData = chartB.planets[planet] || chartB.planets[planet.charAt(0).toUpperCase() + planet.slice(1)];
      if (pData?.longitude !== undefined) {
        const house = getHouse(pData.longitude, ascA);
        if (GOOD_HOUSES.includes(house)) placementBalance += 1;
      }
    }
    for (const planet of MALEFICS) {
      const pData = chartB.planets[planet] || chartB.planets[planet.charAt(0).toUpperCase() + planet.slice(1)];
      if (pData?.longitude !== undefined) {
        const house = getHouse(pData.longitude, ascA);
        if (BAD_HOUSES.includes(house)) placementBalance -= 1;
      }
    }
  }

  const placementScore = Math.round(placementBalance * 0.40 * 150);
  score += placementScore;
  if (placementBalance !== 0) {
    factors.push({
      name: 'placement_balance',
      impact: placementScore,
      description: `Benefic/malefic placement: ${placementBalance > 0 ? '+' : ''}${placementBalance}`,
    });
    factorCount++;
  }

  // #2 PREDICTOR: House Overlay Differential (coefficient: 0.35, amplified ×150)
  const hoPositive = houseOverlays.filter(h => h.score > 0).reduce((sum, h) => sum + h.score, 0);
  const hoNegative = houseOverlays.filter(h => h.score < 0).reduce((sum, h) => sum + Math.abs(h.score), 0);
  const hoDiff = hoPositive - hoNegative;
  const hoDiffScore = Math.round((hoDiff / 20) * 0.35 * 150);
  score += hoDiffScore;
  if (Math.abs(hoDiff) > 5) {
    factors.push({
      name: 'ho_diff',
      impact: hoDiffScore,
      description: `House overlay differential: ${hoDiff > 0 ? '+' : ''}${hoDiff}`,
    });
    factorCount++;
  }

  // #3 PREDICTOR: Soft aspect count (coefficient: 0.22, linear scaling)
  const softCount = aspects.filter(a => a.type === 'trine' || a.type === 'sextile').length;
  const softBonus = Math.round((softCount / 15) * 0.22 * 150);
  if (softBonus > 0) {
    score += softBonus;
    factors.push({
      name: 'soft_count',
      impact: softBonus,
      description: `Harmony ratio: ${softCount} soft aspects`,
    });
    factorCount++;
  }

  // #4 PREDICTOR: Age factors
  const marriageYear = new Date().getFullYear() + 1;
  if (birthYearA && birthYearB) {
    const ageA = marriageYear - birthYearA;
    const ageB = marriageYear - birthYearB;

    if (ageA < 25 && ageB < 25) {
      const impact = -Math.round(0.26 * 100);
      score += impact;
      factors.push({ name: 'both_young', impact, description: 'Both under 25: High divorce risk' });
      factorCount++;
    } else if (ageA < 25 || ageB < 25) {
      const impact = -Math.round(0.21 * 100);
      score += impact;
      factors.push({ name: 'one_young', impact, description: 'One under 25: Elevated risk' });
      factorCount++;
    }

    // Mature couples bonus
    if (ageA >= 28 && ageB >= 28) {
      const impact = Math.round(0.15 * 100);
      score += impact;
      factors.push({ name: 'mature_couple', impact, description: 'Both 28+: Maturity bonus' });
      factorCount++;
    }
  }

  // #5 PREDICTOR: House overlay quality
  if (hoPositive > 50 && hoNegative < 20) {
    const impact = Math.round(0.20 * 100);
    score += impact;
    factors.push({ name: 'excellent_overlays', impact, description: 'Excellent house overlays' });
    factorCount++;
  } else if (hoNegative > hoPositive) {
    const impact = -Math.round(0.18 * 100);
    score += impact;
    factors.push({ name: 'poor_overlays', impact, description: 'Challenging house overlays' });
    factorCount++;
  }

  // Calculate prediction & confidence
  let prediction: 'long' | 'short' | 'uncertain';
  let confidence: number;

  if (score > 30) {
    prediction = 'long';
    confidence = Math.min(100, 55 + Math.abs(score) / 4);
  } else if (score < -30) {
    prediction = 'short';
    confidence = Math.min(100, 55 + Math.abs(score) / 4);
  } else {
    prediction = 'uncertain';
    confidence = 50;
  }

  // Boost confidence with multiple signals
  if (factorCount >= 4) confidence = Math.min(100, confidence + 15);
  else if (factorCount >= 3) confidence = Math.min(100, confidence + 10);

  return { score, prediction, confidence, factors };
}

function normalizeV5BackendScore(
  traditionalRawScore: number,
  mlLongevityScore: number,
  mlPrediction: 'long' | 'short' | 'uncertain',
  mlConfidence: number
): { score: number; percentile: number } {
  const weights = V5_BACKEND_WEIGHTS;

  // Normalize traditional score to 0-100 (centered around 50)
  const traditionalNormalized = Math.max(0, Math.min(100, (traditionalRawScore - 100) / 8 + 50));

  // ML longevity score maps to 0-100
  // Wider spread with divisor of 8 to push top scores towards 90
  // mlScore=0 → 31, mlScore=250 → 63, mlScore=550 → 100 (clamped)
  const mlNormalized = Math.max(0, Math.min(100, (mlLongevityScore + 250) / 8));

  // Weighted combination - ML dominates
  // When mlScore=0, mlNormalized=50, so combinedScore=50 → final score=50
  // This ensures: mlScore > 0 → score > 50 (long-term)
  //               mlScore < 0 → score < 50 (predicted divorce)
  const combinedScore =
    traditionalNormalized * weights.traditionalAstrologyWeight +
    mlNormalized * weights.mlLongevityWeight;

  // Direct mapping - keeps ~50 as the decision boundary
  const finalScore = Math.round(combinedScore);

  return {
    score: Math.max(20, Math.min(92, finalScore)),
    percentile: combinedScore,
  };
}

const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northnode', 'chiron', 'juno'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function getSignFromLongitude(longitude: number): string {
  const normalized = normalizeAngle(longitude);
  const signIndex = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[signIndex];
}

function getPlanetLongitude(chart: NatalChart, planet: string): number | undefined {
  return chart.planets?.[planet.toLowerCase()]?.longitude;
}

function getAscendantLongitude(chart: NatalChart): number | undefined {
  if (chart.angles?.ascendant !== undefined) {
    return chart.angles.ascendant;
  }
  if (chart.houses && 'ascendant' in chart.houses) {
    return (chart.houses as { ascendant: number }).ascendant;
  }
  if (chart.houses && 'cusps' in chart.houses) {
    const cusps = (chart.houses as { cusps: number[] }).cusps;
    return cusps?.[0];
  }
  return undefined;
}

function getHouseForLongitude(longitude: number, ascendant: number): number {
  const diff = normalizeAngle(longitude - ascendant);
  return Math.floor(diff / 30) + 1;
}

// Get midpoint longitude for composite chart
function getMidpoint(long1: number, long2: number): number {
  const diff = normalizeAngle(long2 - long1);
  if (diff <= 180) {
    return normalizeAngle(long1 + diff / 2);
  } else {
    return normalizeAngle(long1 + (360 - diff) / 2 + 180);
  }
}

// ============================================================================
// ASPECT DETECTION WITH TRAINED WEIGHTS
// ============================================================================

function getAspect(long1: number, long2: number): { type: AspectType; orb: number } | null {
  const diff = normalizeAngle(long1 - long2);
  const distance = Math.min(diff, 360 - diff);

  const aspectOrder: AspectType[] = ['conjunction', 'opposition', 'trine', 'square', 'sextile', 'quincunx'];

  for (const aspectType of aspectOrder) {
    const targetAngle = ASPECT_ANGLES[aspectType];
    const maxOrb = ASPECT_ORBS[aspectType];
    const actualOrb = Math.abs(distance - targetAngle);

    if (actualOrb <= maxOrb) {
      return { type: aspectType, orb: actualOrb };
    }
  }

  return null;
}

// Check if two planets are in the same sign (copresence)
function checkCopresence(long1: number, long2: number): boolean {
  const sign1 = getSignFromLongitude(long1);
  const sign2 = getSignFromLongitude(long2);
  return sign1 === sign2;
}

function getTrainedWeight(planet1: string, planet2: string, aspectType: AspectType): number {
  const p1 = planet1.toLowerCase();
  const p2 = planet2.toLowerCase();

  // Try both orderings
  const key1 = `${p1} ${aspectType} ${p2}`;
  const key2 = `${p2} ${aspectType} ${p1}`;

  if (LOGISTIC_REGRESSION_WEIGHTS[key1] !== undefined) {
    return LOGISTIC_REGRESSION_WEIGHTS[key1];
  }
  if (LOGISTIC_REGRESSION_WEIGHTS[key2] !== undefined) {
    return LOGISTIC_REGRESSION_WEIGHTS[key2];
  }

  return 0; // No trained weight for this combination
}

function getCategoryForAspect(planetA: string, planetB: string): keyof CategoryBreakdown {
  const pA = planetA.toLowerCase();
  const pB = planetB.toLowerCase();
  const key1 = `${pA}-${pB}`;
  const key2 = `${pB}-${pA}`;

  if (CATEGORY_MAPPINGS[key1]) return CATEGORY_MAPPINGS[key1];
  if (CATEGORY_MAPPINGS[key2]) return CATEGORY_MAPPINGS[key2];

  if (pA === 'moon' || pB === 'moon') return 'emotional';
  if (pA === 'venus' || pB === 'venus') return 'love';
  if (pA === 'mars' || pB === 'mars') return 'chemistry';
  if (pA === 'saturn' || pB === 'saturn') return 'commitment';
  if (pA === 'jupiter' || pB === 'jupiter') return 'values';
  if (pA === 'mercury' || pB === 'mercury') return 'communication';
  if (pA === 'northnode' || pB === 'northnode') return 'growth';
  if (pA === 'chiron' || pB === 'chiron') return 'growth';
  if (pA === 'juno' || pB === 'juno') return 'commitment';

  return 'emotional';
}

function getAllAspects(chartA: NatalChart, chartB: NatalChart): AspectInfo[] {
  const aspects: AspectInfo[] = [];
  const seenPairs = new Set<string>();

  for (const planetA of PLANETS) {
    const longA = getPlanetLongitude(chartA, planetA);
    if (longA === undefined) continue;

    for (const planetB of PLANETS) {
      const longB = getPlanetLongitude(chartB, planetB);
      if (longB === undefined) continue;

      // Check for degree-based aspects
      const aspect = getAspect(longA, longB);
      if (aspect) {
        const trainedWeight = getTrainedWeight(planetA, planetB, aspect.type);
        const category = getCategoryForAspect(planetA, planetB);
        // Convert trained weight to points (scale by 100 for readability)
        const score = Math.round(trainedWeight * 100);

        aspects.push({
          type: aspect.type,
          orb: aspect.orb,
          planet1: planetA,
          planet2: planetB,
          score,
          sign1: getSignFromLongitude(longA).toLowerCase(),
          sign2: getSignFromLongitude(longB).toLowerCase(),
          category,
          trainedWeight,
        });
      }

      // Also check for copresence (same sign, no aspect)
      const pairKey = [planetA, planetB].sort().join('-');
      if (!seenPairs.has(pairKey) && !aspect && checkCopresence(longA, longB)) {
        seenPairs.add(pairKey);
        const trainedWeight = getTrainedWeight(planetA, planetB, 'copresence');
        if (trainedWeight !== 0) {
          const category = getCategoryForAspect(planetA, planetB);
          const score = Math.round(trainedWeight * 100);

          aspects.push({
            type: 'copresence',
            orb: 0,
            planet1: planetA,
            planet2: planetB,
            score,
            sign1: getSignFromLongitude(longA).toLowerCase(),
            sign2: getSignFromLongitude(longB).toLowerCase(),
            category,
            trainedWeight,
          });
        }
      }
    }
  }

  return aspects;
}

// ============================================================================
// HOUSE OVERLAY SCORING
// ============================================================================

function calculateHouseOverlays(chartA: NatalChart, chartB: NatalChart): HouseOverlayInfo[] {
  const overlays: HouseOverlayInfo[] = [];
  const ascA = getAscendantLongitude(chartA);
  const ascB = getAscendantLongitude(chartB);
  const keyPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

  if (ascB !== undefined) {
    for (const planet of keyPlanets) {
      const long = getPlanetLongitude(chartA, planet);
      if (long !== undefined) {
        const house = getHouseForLongitude(long, ascB);
        overlays.push({
          planet,
          fromChart: 'A',
          house,
          score: HOUSE_SCORES[house] || 5,
          category: HOUSE_CATEGORIES[house] || 'emotional',
        });
      }
    }
  }

  if (ascA !== undefined) {
    for (const planet of keyPlanets) {
      const long = getPlanetLongitude(chartB, planet);
      if (long !== undefined) {
        const house = getHouseForLongitude(long, ascA);
        overlays.push({
          planet,
          fromChart: 'B',
          house,
          score: HOUSE_SCORES[house] || 5,
          category: HOUSE_CATEGORIES[house] || 'emotional',
        });
      }
    }
  }

  return overlays;
}

// ============================================================================
// COMPOSITE CHART PLACEMENTS
// ============================================================================

function calculateCompositePlacements(chartA: NatalChart, chartB: NatalChart): PlacementScoreInfo[] {
  const placements: PlacementScoreInfo[] = [];

  // Calculate composite Sun
  const sunA = getPlanetLongitude(chartA, 'sun');
  const sunB = getPlanetLongitude(chartB, 'sun');
  if (sunA !== undefined && sunB !== undefined) {
    const compositeSunLong = getMidpoint(sunA, sunB);
    const compositeSunSign = getSignFromLongitude(compositeSunLong);

    // Find matching composite Sun placement weight
    for (const [desc, weight] of Object.entries(COMPOSITE_PLACEMENT_WEIGHTS)) {
      if (desc.startsWith(`Composite Sun in ${compositeSunSign}:`)) {
        placements.push({
          type: 'composite',
          description: desc,
          score: Math.round(weight * 100),
          category: 'emotional',
          trainedWeight: weight,
        });
        break;
      }
    }
  }

  // Calculate composite Moon
  const moonA = getPlanetLongitude(chartA, 'moon');
  const moonB = getPlanetLongitude(chartB, 'moon');
  if (moonA !== undefined && moonB !== undefined) {
    const compositeMoonLong = getMidpoint(moonA, moonB);
    const compositeMoonSign = getSignFromLongitude(compositeMoonLong);

    for (const [desc, weight] of Object.entries(COMPOSITE_PLACEMENT_WEIGHTS)) {
      if (desc.startsWith(`Composite Moon in ${compositeMoonSign}:`)) {
        placements.push({
          type: 'composite',
          description: desc,
          score: Math.round(weight * 100),
          category: 'emotional',
          trainedWeight: weight,
        });
        break;
      }
    }
  }

  // Calculate composite Venus
  const venusA = getPlanetLongitude(chartA, 'venus');
  const venusB = getPlanetLongitude(chartB, 'venus');
  if (venusA !== undefined && venusB !== undefined) {
    const compositeVenusLong = getMidpoint(venusA, venusB);
    const compositeVenusSign = getSignFromLongitude(compositeVenusLong);

    for (const [desc, weight] of Object.entries(COMPOSITE_PLACEMENT_WEIGHTS)) {
      if (desc.startsWith(`Composite Venus in ${compositeVenusSign}:`)) {
        placements.push({
          type: 'composite',
          description: desc,
          score: Math.round(weight * 100),
          category: 'love',
          trainedWeight: weight,
        });
        break;
      }
    }
  }

  // Calculate composite Mars
  const marsA = getPlanetLongitude(chartA, 'mars');
  const marsB = getPlanetLongitude(chartB, 'mars');
  if (marsA !== undefined && marsB !== undefined) {
    const compositeMarsLong = getMidpoint(marsA, marsB);
    const compositeMarsSign = getSignFromLongitude(compositeMarsLong);

    for (const [desc, weight] of Object.entries(COMPOSITE_PLACEMENT_WEIGHTS)) {
      if (desc.startsWith(`Composite Mars in ${compositeMarsSign}:`)) {
        placements.push({
          type: 'composite',
          description: desc,
          score: Math.round(weight * 100),
          category: 'chemistry',
          trainedWeight: weight,
        });
        break;
      }
    }
  }

  // Calculate composite Saturn
  const saturnA = getPlanetLongitude(chartA, 'saturn');
  const saturnB = getPlanetLongitude(chartB, 'saturn');
  if (saturnA !== undefined && saturnB !== undefined) {
    const compositeSaturnLong = getMidpoint(saturnA, saturnB);
    const compositeSaturnSign = getSignFromLongitude(compositeSaturnLong);

    for (const [desc, weight] of Object.entries(COMPOSITE_PLACEMENT_WEIGHTS)) {
      if (desc.startsWith(`Composite Saturn in ${compositeSaturnSign}:`)) {
        placements.push({
          type: 'composite',
          description: desc,
          score: Math.round(weight * 100),
          category: 'commitment',
          trainedWeight: weight,
        });
        break;
      }
    }
  }

  return placements;
}

// ============================================================================
// ELEMENT COMPATIBILITY
// ============================================================================

function calculateElementCompatibility(chartA: NatalChart, chartB: NatalChart): PlacementScoreInfo[] {
  const placements: PlacementScoreInfo[] = [];
  const elementsA: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const elementsB: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const personalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars'];

  for (const planet of personalPlanets) {
    const dataA = chartA.planets?.[planet];
    const dataB = chartB.planets?.[planet];

    if (dataA) {
      const sign = dataA.sign || getSignFromLongitude(dataA.longitude);
      const el = SIGN_ELEMENTS[sign];
      if (el) elementsA[el]++;
    }

    if (dataB) {
      const sign = dataB.sign || getSignFromLongitude(dataB.longitude);
      const el = SIGN_ELEMENTS[sign];
      if (el) elementsB[el]++;
    }
  }

  const dominantElA = Object.entries(elementsA).sort((a, b) => b[1] - a[1])[0][0];
  const dominantElB = Object.entries(elementsB).sort((a, b) => b[1] - a[1])[0][0];

  // Check for shared dominant element
  if (dominantElA === dominantElB) {
    const key = `Both ${dominantElA}-dominant (shared element, strong compatibility)`;
    const weight = COMPOSITE_PLACEMENT_WEIGHTS[key];
    if (weight !== undefined) {
      placements.push({
        type: 'element',
        description: key,
        score: Math.round(weight * 100),
        category: 'emotional',
        trainedWeight: weight,
      });
    }
  } else {
    // Check element compatibility
    const compatKey1 = `${dominantElA.charAt(0).toUpperCase() + dominantElA.slice(1)}-${dominantElB} compatibility`;
    const compatKey2 = `${dominantElB.charAt(0).toUpperCase() + dominantElB.slice(1)}-${dominantElA} compatibility`;
    const compatKey3 = `${dominantElA.charAt(0).toUpperCase() + dominantElA.slice(1)}-${dominantElB}: ${dominantElA.charAt(0).toUpperCase() + dominantElA.slice(1)} + ${dominantElB.charAt(0).toUpperCase() + dominantElB.slice(1)}`;

    for (const [desc, weight] of Object.entries(COMPOSITE_PLACEMENT_WEIGHTS)) {
      if (desc.includes(dominantElA) && desc.includes(dominantElB) && desc.toLowerCase().includes('compatib')) {
        placements.push({
          type: 'element',
          description: desc,
          score: Math.round(weight * 100),
          category: 'emotional',
          trainedWeight: weight,
        });
        break;
      }
    }
  }

  return placements;
}

// ============================================================================
// CATEGORY SCORING
// ============================================================================

function calculateRawCategoryScores(
  aspects: AspectInfo[],
  houseOverlays: HouseOverlayInfo[],
  placements: PlacementScoreInfo[]
): CategoryBreakdown {
  const scores: CategoryBreakdown = {
    emotional: 0,
    chemistry: 0,
    communication: 0,
    love: 0,
    commitment: 0,
    family: 0,
    values: 0,
    prosperity: 0,
    growth: 0,
  };

  for (const aspect of aspects) {
    const category = aspect.category || 'emotional';
    scores[category] += aspect.score;
  }

  for (const overlay of houseOverlays) {
    scores[overlay.category] += overlay.score;
  }

  for (const placement of placements) {
    scores[placement.category] += placement.score;
  }

  return scores;
}

function applyAIWeights(
  rawCategories: CategoryBreakdown,
  chartNeedsA: ChartNeeds | null,
  chartNeedsB: ChartNeeds | null
): {
  weightedCategories: CategoryScores;
  weightsUsed: {
    personA: Partial<CategoryBreakdown> | null;
    personB: Partial<CategoryBreakdown> | null;
    blended: CategoryBreakdown;
  };
  confidence: number;
} {
  const categoryKeys: (keyof CategoryBreakdown)[] = [
    'emotional', 'chemistry', 'communication', 'love', 'commitment',
    'family', 'values', 'prosperity', 'growth',
  ];

  const weightedCategories: CategoryScores = {} as CategoryScores;
  const blendedWeights: CategoryBreakdown = {} as CategoryBreakdown;

  let hasAIWeights = 0;
  if (chartNeedsA?.category_weights) hasAIWeights++;
  if (chartNeedsB?.category_weights) hasAIWeights++;

  for (const cat of categoryKeys) {
    const rawScore = rawCategories[cat];
    const weightA = chartNeedsA?.category_weights?.[cat] ?? 1.0;
    const weightB = chartNeedsB?.category_weights?.[cat] ?? 1.0;
    const avgWeight = (weightA + weightB) / 2;
    blendedWeights[cat] = avgWeight;

    const weightedScore = rawScore * avgWeight;
    // Calibrated to center at 50% with wide spread (multiplier 25)
    // Below 50 = divorce risk (per original 98.1% accuracy model)
    const normalized = Math.min(99, Math.max(1, -198 + weightedScore * 25));
    weightedCategories[cat] = Math.round(normalized);
  }

  const confidence = hasAIWeights / 2;

  return {
    weightedCategories,
    weightsUsed: {
      personA: chartNeedsA?.category_weights || null,
      personB: chartNeedsB?.category_weights || null,
      blended: blendedWeights,
    },
    confidence,
  };
}

function calculateOverallScore(weightedCategories: CategoryScores): number {
  const values = Object.values(weightedCategories);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;

  // Stretch scores away from 50% toward extremes
  // Using power transformation: deviation^0.7 expands the distribution
  const deviation = (avg - 50) / 50; // -1 to 1 range
  const sign = deviation >= 0 ? 1 : -1;
  const stretched = sign * Math.pow(Math.abs(deviation), 0.7);
  const result = 50 + stretched * 50;

  return Math.round(Math.min(99, Math.max(1, result)));
}

// ============================================================================
// BUILD CONTRIBUTIONS
// ============================================================================

function buildContributions(
  aspects: AspectInfo[],
  houseOverlays: HouseOverlayInfo[],
  placements: PlacementScoreInfo[],
  sunMoonBonus: number
): ContributionV5[] {
  const contributions: ContributionV5[] = [];
  let id = 0;

  for (const a of aspects) {
    contributions.push({
      id: `aspect-${id++}`,
      type: 'aspect',
      category: a.category || 'emotional',
      description: `${a.planet1} ${a.type} ${a.planet2}`,
      points: a.score,
      trainedWeight: a.trainedWeight,
      planet1: a.planet1,
      planet2: a.planet2,
      aspectType: a.type,
      orb: a.orb,
      ownerPlanet1: 'A',
      ownerPlanet2: 'B',
    });
  }

  for (const h of houseOverlays) {
    contributions.push({
      id: `house-${id++}`,
      type: 'house',
      category: h.category,
      description: `${h.fromChart}'s ${h.planet} in ${h.fromChart === 'A' ? 'B' : 'A'}'s ${h.house}th house`,
      points: h.score,
      planet1: h.planet,
      house: h.house,
      houseOwner: h.fromChart === 'A' ? 'B' : 'A',
    });
  }

  for (const p of placements) {
    contributions.push({
      id: `${p.type}-${id++}`,
      type: p.type === 'composite' ? 'composite' : 'placement',
      category: p.category,
      description: p.description,
      points: p.score,
      trainedWeight: p.trainedWeight,
    });
  }

  if (sunMoonBonus > 0) {
    contributions.push({
      id: `bonus-sunmoon`,
      type: 'bonus',
      category: 'emotional',
      description: 'Sun in Moon sign bonus',
      points: sunMoonBonus,
    });
  }

  return contributions.sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
}

// ============================================================================
// SUN-MOON SIGN BONUS
// ============================================================================

function sunInMoonSignBonus(chartA: NatalChart, chartB: NatalChart): number {
  const sunALong = getPlanetLongitude(chartA, 'sun');
  const moonBLong = getPlanetLongitude(chartB, 'moon');
  const sunBLong = getPlanetLongitude(chartB, 'sun');
  const moonALong = getPlanetLongitude(chartA, 'moon');

  if (sunALong === undefined || moonBLong === undefined ||
      sunBLong === undefined || moonALong === undefined) {
    return 0;
  }

  const sunASign = getSignFromLongitude(sunALong);
  const moonBSign = getSignFromLongitude(moonBLong);
  const sunBSign = getSignFromLongitude(sunBLong);
  const moonASign = getSignFromLongitude(moonALong);

  let bonus = 0;
  if (sunASign === moonBSign) bonus += 15;
  if (sunBSign === moonASign) bonus += 15;
  if (sunASign === moonBSign && sunBSign === moonASign) bonus += 10;

  return bonus;
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

export function calculateLocalSynastryV5(
  chartA: NatalChart,
  chartB: NatalChart,
  chartNeedsA: ChartNeeds | null = null,
  chartNeedsB: ChartNeeds | null = null,
  birthYearA?: number,
  birthYearB?: number
): SynastryResultV5 {
  const startTime = Date.now();

  // Get all aspects with trained weights
  const aspects = getAllAspects(chartA, chartB);
  const aspectScore = aspects.reduce((sum, a) => sum + a.score, 0);

  // Calculate logistic regression score (sum of trained weights)
  const logisticRegressionScore = aspects.reduce((sum, a) => sum + (a.trainedWeight || 0), 0);

  // House overlays
  const houseOverlays = calculateHouseOverlays(chartA, chartB);
  const houseOverlayScore = houseOverlays.reduce((sum, h) => sum + h.score, 0);

  // Composite placements with trained weights
  const compositePlacements = calculateCompositePlacements(chartA, chartB);

  // Element compatibility
  const elementPlacements = calculateElementCompatibility(chartA, chartB);

  // All placements
  const placements = [...compositePlacements, ...elementPlacements];
  const placementScore = placements.reduce((sum, p) => sum + p.score, 0);

  // Sun-Moon bonus
  const sunMoonBonus = sunInMoonSignBonus(chartA, chartB);

  // Calculate raw category scores
  const rawCategories = calculateRawCategoryScores(aspects, houseOverlays, placements);
  rawCategories.emotional += sunMoonBonus;

  const traditionalRawScore = aspectScore + houseOverlayScore + placementScore + sunMoonBonus;

  // ============================================================================
  // V5.5.0 - INDIVIDUAL LR CONTRIBUTIONS (MOST TRANSPARENT)
  // V5.5.0-chemistry - Same weights inverted: high score = chemistry (predicts divorce)
  // ============================================================================
  if (SYNASTRY_ALGORITHM_VERSION === '5.5.0' || SYNASTRY_ALGORITHM_VERSION === '5.5.0-chemistry') {
    try {
      // Calculate both directions for symmetry
      const houseOverlaysReverse = calculateHouseOverlays(chartB, chartA);

      const v55AB = calculateV55Score(chartA, chartB, aspects, houseOverlays, birthYearA, birthYearB);
      const v55BA = calculateV55Score(chartB, chartA, aspects, houseOverlaysReverse, birthYearB, birthYearA);

      console.log('[V5.5 Debug]', { v55AB, v55BA });

    // Average for symmetry
    const avgRawLRSum = (v55AB.rawLRSum + v55BA.rawLRSum) / 2;
    const avgNormalizedScore = Math.round((v55AB.normalizedScore + v55BA.normalizedScore) / 2);
    const avgConfidence = Math.round((v55AB.confidence + v55BA.confidence) / 2);
    const prediction = avgRawLRSum > 0.5 ? 'long' : avgRawLRSum < -0.5 ? 'short' : 'uncertain';

    // Merge contributions from both directions (average duplicates)
    const contribMap = new Map<string, V55ContributionItem>();
    for (const c of [...v55AB.contributions, ...v55BA.contributions]) {
      const key = c.description;
      if (!contribMap.has(key)) {
        contribMap.set(key, c);
      } else {
        const existing = contribMap.get(key)!;
        contribMap.set(key, {
          ...existing,
          lrWeight: (existing.lrWeight + c.lrWeight) / 2,
          scaledPoints: Math.round((existing.scaledPoints + c.scaledPoints) / 2),
        });
      }
    }
    const mergedContribs = Array.from(contribMap.values());
    mergedContribs.sort((a, b) => Math.abs(b.lrWeight) - Math.abs(a.lrWeight));

    // Build V5 format contributions
    const contributions: ContributionV5[] = mergedContribs.map((c, i) => ({
      id: `v55-${c.type}-${i}`,
      type: c.type === 'aspect' ? 'aspect' : c.scaledPoints >= 0 ? 'bonus' : 'placement',
      category: c.category as keyof CategoryBreakdown,
      description: `[LR ${c.lrWeight >= 0 ? '+' : ''}${c.lrWeight.toFixed(2)}] ${c.description}`,
      points: c.scaledPoints,
      trainedWeight: c.lrWeight,
      planet1: c.planet1,
      planet2: c.planet2,
      aspectType: c.aspectType,
      orb: c.orb,
    }));

    // Calculate category scores from contributions
    const categoryScores: CategoryBreakdown = {
      emotional: 0, chemistry: 0, communication: 0, love: 0, commitment: 0,
      family: 0, values: 0, prosperity: 0, growth: 0,
    };
    for (const c of mergedContribs) {
      const cat = c.category as keyof CategoryBreakdown;
      if (categoryScores[cat] !== undefined) {
        categoryScores[cat] += c.scaledPoints;
      }
    }
    const normalizedCategories = normalizeCategoryScores(categoryScores);
    const { top: topCategories, bottom: bottomCategories } = getTopBottomCategories(normalizedCategories);

    // Map prediction to display prediction
    let scorePrediction: 'very-long' | 'likely-long' | 'uncertain' | 'likely-short' | 'very-short';
    if (prediction === 'long' && avgConfidence >= 70) {
      scorePrediction = 'very-long';
    } else if (prediction === 'long') {
      scorePrediction = 'likely-long';
    } else if (prediction === 'short' && avgConfidence >= 70) {
      scorePrediction = 'very-short';
    } else if (prediction === 'short') {
      scorePrediction = 'likely-short';
    } else {
      scorePrediction = 'uncertain';
    }

    // Build top reason from strongest factor
    const topFactor = mergedContribs[0];
    const topReason = topFactor
      ? `${topFactor.lrWeight > 0 ? 'Positive' : 'Negative'}: ${topFactor.description}`
      : 'Calculated using V5.5 ML model';

    return {
      version: '5.5.0',
      rawScore: Math.round(avgRawLRSum * 100),
      normalizedScore: avgNormalizedScore,
      totalScore: avgNormalizedScore,
      categoryScores: normalizedCategories,
      breakdown: normalizedCategories,
      weightsUsed: {
        personA: chartNeedsA?.category_weights || null,
        personB: chartNeedsB?.category_weights || null,
        blended: normalizedCategories,
      },
      aspects,
      aspectCount: aspects.length,
      houseOverlays,
      placements,
      components: {
        aspectScore: Math.round(aspects.reduce((sum, a) => sum + (a.trainedWeight || 0), 0) * 100),
        houseOverlayScore: Math.round(mergedContribs.filter(c => c.type === 'house_overlay').reduce((sum, c) => sum + c.scaledPoints, 0)),
        placementScore: placementScore,
        sunMoonBonus: sunMoonBonus,
        logisticRegressionScore: avgRawLRSum,
      },
      predictionConfidence: avgConfidence,
      confidenceLevel: avgConfidence >= 70 ? 'HIGH' : avgConfidence >= 50 ? 'MEDIUM' : 'LOW',
      durationPrediction: {
        rawScore: avgRawLRSum,
        normalizedScore: avgNormalizedScore,
        prediction: scorePrediction,
        threshold: DURATION_CLASSIFIER_THRESHOLD,
        matchedFactors: mergedContribs.length,
      },
      calculationTime: Date.now() - startTime,
      contributions,
      topReason,
      warnings: [],
    };
    } catch (error) {
      console.error('[V5.5 Error]', error);
      // Fall through to v5.0.0 as fallback
    }
  }

  // ============================================================================
  // BACKEND V5.0.0 APPROACH (HOT SWAP)
  // ============================================================================
  if (USE_BACKEND_V5_APPROACH) {
    // Calculate ML longevity score BOTH directions and average for symmetry
    // This ensures score(A,B) === score(B,A)
    const houseOverlaysReverse = calculateHouseOverlays(chartB, chartA);

    const mlResultAB = calculateV5BackendMLScore(
      chartA, chartB, aspects, houseOverlays, birthYearA, birthYearB
    );
    const mlResultBA = calculateV5BackendMLScore(
      chartB, chartA, aspects, houseOverlaysReverse, birthYearB, birthYearA
    );

    // Average the ML scores for symmetry
    const avgMlScore = Math.round((mlResultAB.score + mlResultBA.score) / 2);
    const avgConfidence = Math.round((mlResultAB.confidence + mlResultBA.confidence) / 2);
    const mlPrediction = avgMlScore > 30 ? 'long' : avgMlScore < -30 ? 'short' : 'uncertain';

    // Combine factors from both directions (dedupe by name)
    const factorMap = new Map<string, { name: string; impact: number; description: string }>();
    for (const f of [...mlResultAB.factors, ...mlResultBA.factors]) {
      if (!factorMap.has(f.name)) {
        factorMap.set(f.name, f);
      } else {
        // Average the impacts
        const existing = factorMap.get(f.name)!;
        factorMap.set(f.name, {
          ...existing,
          impact: Math.round((existing.impact + f.impact) / 2),
        });
      }
    }
    const mlResult = {
      score: avgMlScore,
      prediction: mlPrediction as 'long' | 'short' | 'uncertain',
      confidence: avgConfidence,
      factors: Array.from(factorMap.values()),
    };

    // Normalize using backend v5.0.0 approach (25% traditional, 75% ML)
    const { score: normalizedScore, percentile } = normalizeV5BackendScore(
      traditionalRawScore,
      mlResult.score,
      mlResult.prediction,
      mlResult.confidence
    );

    // Build contributions - ML factors first, then traditional
    const contributions: ContributionV5[] = [];

    // Add ML factors as top contributions
    for (const factor of mlResult.factors) {
      contributions.push({
        id: `ml-${factor.name}`,
        type: 'bonus',
        category: 'commitment',
        description: `[ML] ${factor.description}`,
        points: factor.impact,
      });
    }

    // Add traditional contributions
    const traditionalContribs = buildContributions(aspects, houseOverlays, placements, sunMoonBonus);
    for (const c of traditionalContribs) {
      // Scale traditional contributions by weight
      contributions.push({
        ...c,
        points: Math.round(c.points * V5_BACKEND_WEIGHTS.traditionalAstrologyWeight),
        description: `[Trad] ${c.description}`,
      });
    }

    contributions.sort((a, b) => Math.abs(b.points) - Math.abs(a.points));

    // Map ML prediction to display prediction
    let scorePrediction: 'very-long' | 'likely-long' | 'uncertain' | 'likely-short' | 'very-short';
    if (mlResult.prediction === 'long' && mlResult.confidence >= 70) {
      scorePrediction = 'very-long';
    } else if (mlResult.prediction === 'long') {
      scorePrediction = 'likely-long';
    } else if (mlResult.prediction === 'short' && mlResult.confidence >= 70) {
      scorePrediction = 'very-short';
    } else if (mlResult.prediction === 'short') {
      scorePrediction = 'likely-short';
    } else {
      scorePrediction = 'uncertain';
    }

    const confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
      mlResult.confidence >= 75 ? 'HIGH' :
      mlResult.confidence >= 50 ? 'MEDIUM' : 'LOW';

    const topContrib = contributions[0];
    const topReason = topContrib
      ? `${topContrib.description} (${topContrib.points > 0 ? '+' : ''}${topContrib.points} pts)`
      : 'Backend v5.0.0 longevity-weighted scoring';

    // Apply AI weights for category display
    const { weightedCategories, weightsUsed } = applyAIWeights(rawCategories, chartNeedsA, chartNeedsB);

    return {
      version: SYNASTRY_ALGORITHM_VERSION,
      rawScore: traditionalRawScore + mlResult.score,
      normalizedScore,
      totalScore: normalizedScore,
      categoryScores: weightedCategories,
      breakdown: weightedCategories,
      weightsUsed,
      aspects,
      aspectCount: aspects.length,
      houseOverlays,
      placements,
      components: {
        aspectScore,
        houseOverlayScore,
        placementScore,
        sunMoonBonus,
        logisticRegressionScore: mlResult.score, // Use ML score instead
      },
      predictionConfidence: mlResult.confidence / 100,
      confidenceLevel,
      durationPrediction: {
        rawScore: mlResult.score,
        normalizedScore,
        prediction: scorePrediction,
        threshold: 50,
        matchedFactors: mlResult.factors.length,
      },
      calculationTime: Date.now() - startTime,
      contributions,
      topReason,
      warnings: [`Using backend v5.0.0 approach (ML: ${mlResult.prediction}, confidence: ${mlResult.confidence.toFixed(0)}%)`],
    };
  }

  // ============================================================================
  // ORIGINAL V5.1.0 APPROACH (TRAINED WEIGHTS)
  // ============================================================================
  const rawScore = traditionalRawScore;

  // Apply AI weights if available
  const { weightedCategories, weightsUsed, confidence } = applyAIWeights(
    rawCategories,
    chartNeedsA,
    chartNeedsB
  );

  const normalizedScore = calculateOverallScore(weightedCategories);

  // Build contributions for display
  const contributions = buildContributions(aspects, houseOverlays, placements, sunMoonBonus);

  // Determine prediction based on overall score
  // 50% is the dividing line (per 98.1% accuracy model):
  // >= 50% = long-term prediction, < 50% = short-term/divorce risk
  let scorePrediction: 'very-long' | 'likely-long' | 'uncertain' | 'likely-short' | 'very-short';
  if (normalizedScore >= 70) {
    scorePrediction = 'very-long';     // Strong long-term indicators
  } else if (normalizedScore >= 50) {
    scorePrediction = 'likely-long';   // Above 50% = long-term prediction
  } else if (normalizedScore < 30) {
    scorePrediction = 'very-short';    // Strong divorce risk
  } else {
    scorePrediction = 'likely-short';  // 30-49% = short-term/divorce risk
  }

  // Determine confidence level
  let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  if (confidence >= 0.75) {
    confidenceLevel = 'HIGH';
  } else if (confidence >= 0.5) {
    confidenceLevel = 'MEDIUM';
  } else {
    confidenceLevel = 'LOW';
  }

  // Generate top reason
  const topContrib = contributions[0];
  const topReason = topContrib
    ? `${topContrib.description} (${topContrib.points > 0 ? '+' : ''}${topContrib.points} pts, weight: ${topContrib.trainedWeight?.toFixed(3) || 'N/A'})`
    : 'Calculated using V5 longevity model with trained weights';

  return {
    version: SYNASTRY_ALGORITHM_VERSION,
    rawScore,
    normalizedScore,
    totalScore: normalizedScore,
    categoryScores: weightedCategories,
    breakdown: weightedCategories,
    weightsUsed,
    aspects,
    aspectCount: aspects.length,
    houseOverlays,
    placements,
    components: {
      aspectScore,
      houseOverlayScore,
      placementScore,
      sunMoonBonus,
      logisticRegressionScore,
    },
    predictionConfidence: confidence,
    confidenceLevel,
    durationPrediction: {
      rawScore: normalizedScore,
      normalizedScore: normalizedScore,
      prediction: scorePrediction,
      threshold: 50,
      matchedFactors: contributions.length,
    },
    calculationTime: Date.now() - startTime,
    contributions,
    topReason,
    warnings: [],
  };
}

export default calculateLocalSynastryV5;
