/**
 * Duration Classifier - Distinguishes short-term (0-2yr) from long-term (21+yr) marriages.
 * Trained on Mexico divorce dataset using Approach 1 (weighted factor scorer).
 * 5-fold CV accuracy: 75.4% ± 1.9% (baseline: 57.1%)
 *
 * Positive weights = long-term indicator, negative = short-term indicator.
 * Score above threshold → likely long-term, below → likely short-term.
 */

export const DURATION_CLASSIFIER_THRESHOLD = 1.6;

/**
 * Compute duration classifier score from a list of contributions.
 * Returns a score where > threshold = long-term, < threshold = short-term.
 * Also returns a normalized -100 to +100 scale for integration with longevity model.
 */
export type DurationPredictionType = 'very-long' | 'likely-long' | 'uncertain' | 'likely-short' | 'very-short';

export function computeDurationScore(
  contributions: { description: string; points: number }[]
): { rawDurationScore: number; normalizedDurationScore: number; prediction: DurationPredictionType } {
  let score = 0;
  let matchedFactors = 0;

  for (const c of contributions) {
    // Normalize description same way as training: strip A's/B's prefixes
    const desc = c.description.replace(/^[AB]'s\s+/, '').replace(/\s+[AB]'s\s+/, ' ');
    const weight = DURATION_WEIGHTS[desc];
    if (weight !== undefined) {
      score += weight;
      matchedFactors++;
    }
  }

  // Normalize to -100 to +100 range
  // Empirically, scores range roughly from -20 to +20 centered around threshold
  const centered = score - DURATION_CLASSIFIER_THRESHOLD;
  // Scale: ±10 from threshold maps to ±100
  const normalized = Math.max(-100, Math.min(100, centered * 10));

  let prediction: DurationPredictionType;
  if (score >= DURATION_CLASSIFIER_THRESHOLD + 3) {
    prediction = 'very-long';
  } else if (score >= DURATION_CLASSIFIER_THRESHOLD + 0.5) {
    prediction = 'likely-long';
  } else if (score <= DURATION_CLASSIFIER_THRESHOLD - 3) {
    prediction = 'very-short';
  } else if (score <= DURATION_CLASSIFIER_THRESHOLD - 0.5) {
    prediction = 'likely-short';
  } else {
    prediction = 'uncertain';
  }

  return { rawDurationScore: score, normalizedDurationScore: normalized, prediction };
}

// Weights: positive = long-term (21+yr), negative = short-term (0-2yr)
// Filtered: no longevity model outputs, no generational outer-planet copresences
export const DURATION_WEIGHTS: Record<string, number> = {
  "chiron sextile neptune": 3.11,
  "chiron square neptune": 2.19,
  "pluto quincunx saturn": 2.15,
  "neptune conjunction saturn": 2.05,
  "Composite Saturn in Aquarius: Saturn co-rules Aquarius: unconventional but durable structure — mutual freedom within commitment": 1.89,
  "Mercury opposition North Node": 1.76,
  "saturn opposition uranus": 1.57,
  "Composite Saturn in Capricorn: Saturn domicile: supreme structural integrity — disciplined commitment, clear boundaries, builds legacy together": 1.52,
  "chiron opposition pluto": 1.52,
  "Composite Saturn in Sagittarius: Mutable fire tempers rigidity: flexible structure, growth-oriented boundaries — learns through expansion": 1.44,
  "saturn trine uranus": 1.34,
  "Chiron copresence sun": 1.33,
  "pluto trine saturn": 1.33,
  "pluto opposition mars": 1.32,
  "moon conjunction mars": 1.3,
  "pluto opposition saturn": 1.22,
  "juno opposition jupiter": 1.22,
  "juno opposition uranus": 1.19,
  "northnode conjunction moon": 1.19,
  "chiron conjunction juno": 1.15,
  "mars opposition moon": 1.15,
  "northnode trine northnode": 1.15,
  "venus copresence pluto": 1.15,
  "juno trine juno": 1.15,
  "northnode opposition pluto": 1.11,
  "Composite Saturn in Pisces: Water dissolves rigidity: compassionate boundaries, spiritual structure — commitment through faith": 0.99,
  "saturn sextile jupiter": 0.96,
  "Mercury sextile North Node": 0.96,
  "Composite Venus in Capricorn: Saturn-ruled: committed, traditional, takes love seriously — enduring": 0.94,
  "jupiter sextile jupiter": 0.94,
  "juno opposition mercury": 0.93,
  "venus opposition saturn": 0.92,
  "chiron trine neptune": 0.91,
  "pluto conjunction venus": 0.89,
  "moon opposition jupiter": 0.89,
  "moon copresence pluto": 0.86,
  "sun conjunction moon": 0.86,
  "venus opposition northnode": 0.86,
  "jupiter opposition northnode": 0.86,
  "Composite Moon in Sagittarius: Mutable fire: optimistic but emotionally restless, avoids heavy scenes": 0.84,
  "jupiter sextile sun": 0.84,
  "mars sextile venus": 0.84,
  "chiron sextile saturn": 0.84,
  "moon sextile jupiter": 0.82,
  "juno conjunction venus": 0.82,
  "Chiron sextile Chiron": 0.82,
  "Composite Mars in Pisces: Mutable water: passive, avoids conflict unhealthily — martyr tendencies": 0.8,
  "Earth-water compatibility": 0.8,
  "neptune sextile venus": 0.79,
  "moon copresence moon": 0.79,
  "mars conjunction jupiter": 0.77,
  "pluto square venus": 0.76,
  "venus square saturn": 0.75,
  "saturn sextile saturn": 0.75,
  "juno sextile saturn": 0.73,
  "northnode copresence saturn": 0.73,
  "mars opposition northnode": 0.73,
  "sun opposition mars": 0.73,
  "chiron square saturn": 0.73,
  "venus sextile saturn": 0.71,
  "northnode opposition mercury": 0.71,
  "sun sextile jupiter": 0.7,
  "Composite Mars in Capricorn: Mars exalted: disciplined, works through problems — builds substance, lasting": 0.7,
  "saturn copresence sun": 0.7,
  "moon square northnode": 0.7,
  "chiron copresence juno": 0.68,
  "venus square jupiter": 0.67,
  "sun conjunction sun": 0.67,
  "Sun-Sun Conjunction - Low: covered by similar birthday penalty": 0.67,
  "northnode copresence moon": 0.67,
  "juno square pluto": 0.67,
  "venus quincunx jupiter": 0.67,
  "mars conjunction uranus": 0.66,
  "chiron sextile juno": 0.66,
  "juno quincunx uranus": 0.66,
  "moon copresence mercury": 0.65,
  "jupiter square venus": 0.65,
  "venus opposition sun": 0.64,
  "neptune copresence sun": 0.64,
  "juno square uranus": 0.64,
  "mars opposition jupiter": 0.63,
  "northnode copresence mercury": 0.63,
  "mars copresence sun": 0.63,
  "Composite Moon in Libra: Harmonious emotional balance, seeks peace — avoids drama": 0.63,
  "sun copresence pluto": 0.63,
  "juno sextile moon": 0.63,
  "moon sextile northnode": 0.62,
  "pluto sextile moon": 0.62,
  "jupiter square mars": 0.61,
  "Chiron sextile mercury": 0.61,
  "jupiter conjunction mars": 0.6,
  "sun opposition mercury": 0.59,
  "moon copresence uranus": 0.59,
  "neptune conjunction venus": 0.57,
  "sun trine northnode": 0.56,
  "northnode conjunction uranus": 0.56,
  "northnode square pluto": 0.55,
  "pluto trine moon": 0.55,
  "mars square northnode": 0.55,
  "saturn conjunction mercury": 0.55,
  "chiron sextile jupiter": 0.55,
  "mars trine mars": 0.55,
  "Mars-Mars Trine - Moderate: harmonious action": 0.55,
  "mars quincunx uranus": 0.54,
  "Chiron quincunx venus": 0.54,
  "mercury trine uranus": 0.53,
  "Chiron opposition moon": 0.53,
  "jupiter trine venus": 0.53,
  "neptune conjunction northnode": 0.53,
  "pluto opposition venus": 0.53,
  "jupiter quincunx moon": 0.52,
  "neptune copresence venus": 0.52,
  "Composite Mars in Gemini: Mutable air: mental sparring, argues through words — can be passive-aggressive": 0.52,
  "Composite Moon in Scorpio: Water sign: intense emotional depth, deeply bonded — but possessive": 0.52,
  "mercury conjunction saturn": 0.52,
  "Both water-dominant (shared element, strong compatibility)": 0.52,
  "moon opposition sun": 0.52,
  "venus conjunction sun": 0.51,
  "Composite Saturn in Scorpio: Fixed water: deep emotional commitment structures — intense loyalty, transformative endurance": 0.51,
  "jupiter opposition pluto": 0.5,
  "sun opposition pluto": 0.5,
  "jupiter copresence sun": -0.5,
  "mars conjunction mars": -0.51,
  "Mars-Mars Conjunction - Moderate: shared drive (age correlated)": -0.51,
  "uranus sextile venus": -0.51,
  "jupiter conjunction neptune": -0.51,
  "sun opposition venus": -0.52,
  "juno opposition mars": -0.52,
  "sun sextile northnode": -0.53,
  "mercury trine venus": -0.53,
  "Composite Mars in Cancer: Mars fall: passive-aggressive, moody, indirect — worst conflict resolution style": -0.54,
  "juno copresence juno": -0.55,
  "mercury sextile neptune": -0.57,
  "mercury sextile northnode": -0.59,
  "saturn square jupiter": -0.59,
  "saturn quincunx mercury": -0.59,
  "neptune opposition northnode": -0.59,
  "neptune trine saturn": -0.59,
  "Chiron trine venus": -0.59,
  "moon copresence sun": -0.59,
  "moon sextile moon": -0.59,
  "saturn quincunx venus": -0.59,
  "saturn copresence venus": -0.59,
  "mars trine pluto": -0.59,
  "moon quincunx pluto": -0.59,
  "pluto sextile mars": -0.59,
  "juno copresence venus": -0.59,
  "pluto opposition sun": -0.59,
  "saturn opposition venus": -0.59,
  "venus copresence northnode": -0.59,
  "moon conjunction pluto": -0.59,
  "juno conjunction northnode": -0.59,
  "Mercury square North Node": -0.62,
  "northnode square sun": -0.63,
  "venus sextile moon": -0.64,
  "venus sextile mars": -0.65,
  "chiron trine juno": -0.65,
  "saturn copresence mercury": -0.66,
  "jupiter square saturn": -0.66,
  "saturn trine sun": -0.66,
  "northnode sextile uranus": -0.66,
  "chiron quincunx pluto": -0.67,
  "juno conjunction uranus": -0.68,
  "juno trine jupiter": -0.68,
  "venus copresence moon": -0.68,
  "Mercury conjunction North Node": -0.68,
  "venus copresence jupiter": -0.69,
  "moon trine pluto": -0.69,
  "sun opposition saturn": -0.69,
  "jupiter trine northnode": -0.71,
  "northnode trine saturn": -0.73,
  "venus copresence venus": -0.73,
  "jupiter conjunction saturn": -0.73,
  "chiron opposition juno": -0.73,
  "juno conjunction saturn": -0.74,
  "moon copresence venus": -0.76,
  "mercury square moon": -0.76,
  "chiron trine northnode": -0.76,
  "mercury sextile mercury": -0.78,
  "sun copresence saturn": -0.78,
  "jupiter trine jupiter": -0.78,
  "saturn trine venus": -0.78,
  "mercury copresence northnode": -0.78,
  "CRITICAL: Mars-Uranus Opposition - RFE top-50 feature - explosive conflicts": -0.81,
  "mars opposition uranus": -0.81,
  "juno square neptune": -0.86,
  "juno quincunx saturn": -0.87,
  "saturn sextile uranus": -0.89,
  "mars sextile mercury": -0.89,
  "Mars-Mercury Sextile - RFE top-50 feature": -0.89,
  "Air-fire compatibility": -0.89,
  "venus conjunction moon": -0.91,
  "juno quincunx pluto": -0.91,
  "northnode quincunx saturn": -0.91,
  "moon conjunction moon": -0.91,
  "Moon-Moon Conjunction - Kept higher: emotional sync less age-dependent": -0.91,
  "mercury copresence moon": -0.91,
  "Composite Sun in Libra: Cardinal + Venus-ruled: natural marriage sign, harmony-seeking, partnership identity": -0.94,
  "moon conjunction venus": -0.95,
  "Composite Mars in Aries: Mars domicile: direct, honest, quick fights/quick forgiveness — volatile but authentic": -0.95,
  "juno trine neptune": -0.97,
  "venus conjunction saturn": -0.97,
  "mars opposition neptune": -1.01,
  "sun conjunction jupiter": -1.03,
  "chiron quincunx juno": -1.04,
  "mars copresence saturn": -1.05,
  "moon square mars": -1.05,
  "chiron trine pluto": -1.08,
  "jupiter opposition uranus": -1.08,
  "moon quincunx saturn": -1.09,
  "moon opposition venus": -1.09,
  "mars conjunction venus": -1.18,
  "jupiter opposition moon": -1.18,
  "moon opposition mercury": -1.27,
  "neptune quincunx saturn": -1.31,
  "juno copresence uranus": -1.35,
  "chiron opposition northnode": -1.4,
  "jupiter opposition jupiter": -1.4,
  "Venus-Mars Conjunction - Found in 37% more divorces": -1.59,
  "juno conjunction juno": -1.59,
  "venus copresence sun": -1.76,
  "chiron trine saturn": -1.84,
  "venus conjunction mars": -1.84,
  "neptune opposition saturn": -2.01,
  "saturn trine saturn": -2.18,
  "Composite Saturn in Gemini: Mutable air in detriment: scattered commitment, inconsistent boundaries — talks about structure but struggles to build it": -2.29,
  "chiron quincunx neptune": -2.61,
  "chiron opposition saturn": -2.84,
  "Composite Saturn in Cancer: Cardinal water in detriment: emotional insecurity undermines structure — fear-based commitment, clingy or avoidant": -3.05,
  "pluto conjunction saturn": -3.4,
  "saturn conjunction uranus": -3.84,
  "Composite Saturn in Virgo: Mutable earth: practical but anxious structure — over-analyzes commitment, critical of imperfections": -4.02,
  "Composite Saturn in Leo: Fixed fire in detriment: ego conflicts with structure — power struggles over who leads, resists compromise": -4.88,
  "chiron quincunx saturn": -5.35,
};
