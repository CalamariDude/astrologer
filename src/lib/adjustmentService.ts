/**
 * Adjustment Service - Manages synastry aspect weight adjustments and score tracking
 *
 * Base weights are imported from weights.json at build time.
 * localStorage overrides are applied on top for local testing.
 */

import weightsData from './weights.json';

const ADJUSTMENTS_KEY = 'synastry-aspect-adjustments';
const SCORES_KEY = 'synastry-score-tracking';

// Base weights from JSON (loaded at import time)
const baseWeights: AdjustmentMap = (weightsData as AdjustmentsFile).adjustments || {};

// Types
export interface AdjustmentData {
  name: string;           // Human readable name (e.g., "Sun conjunct Moon", "Venus in 7th House")
  type: string;           // Contribution type (aspect, house_overlay, configuration, etc.)
  planet1?: string;
  planet2?: string;
  planet3?: string;
  planet4?: string;
  aspect?: string;        // For aspects
  orbRange?: string;      // For aspects
  house?: number;         // For house overlays
  configType?: string;    // For configurations
  sign?: string;          // For stelliums
  currentWeight: number;
  adjustment: number;
  notes?: string;
  updatedAt: string;
}

export interface AdjustmentMap {
  [aspectKey: string]: AdjustmentData;
}

export interface AdjustmentsFile {
  version: string;
  lastUpdated: string;
  adjustments: AdjustmentMap;
}

export interface ScoreRecord {
  personA: string;
  personB: string;
  rawScore: number;
  normalizedScore: number;
  calculatedAt: string;
}

export interface ScoreStats {
  min: number;
  max: number;
  count: number;
}

export interface ScoresFile {
  version: string;
  scores: ScoreRecord[];
  stats: ScoreStats;
}

/**
 * Generate a unique key for a contribution based on its properties
 * Handles all contribution types: aspect, house_overlay, configuration, stellium, etc.
 */
export function generateContributionKey(
  type: string,
  details: {
    planet1?: string;
    planet2?: string;
    planet3?: string;
    planet4?: string;
    aspect?: string;
    orb?: number;
    house?: number;
    houseOwner?: 'A' | 'B';
    ownerPlanet1?: 'A' | 'B';
    configType?: string;
    sign?: string;
  }
): string {
  const normalize = (s?: string) => s?.toLowerCase().replace(/\s+/g, '') || '';

  switch (type) {
    case 'aspect': {
      const p1 = normalize(details.planet1);
      const p2 = normalize(details.planet2);
      const asp = normalize(details.aspect);
      // Sort planets for consistency
      const [first, second] = [p1, p2].sort();
      // Orb range
      let orbRange = 'wide';
      if (details.orb !== undefined) {
        if (details.orb <= 3) orbRange = '0-3';
        else if (details.orb <= 7) orbRange = '4-7';
        else orbRange = '8-10';
      }
      return `aspect-${first}-${second}-${asp}-${orbRange}`;
    }

    case 'house_overlay': {
      const planet = normalize(details.planet1);
      const house = details.house || 0;
      const owner = details.ownerPlanet1 || 'A';
      const houseOwner = details.houseOwner || 'B';
      return `house-${owner}${planet}-in-${houseOwner}h${house}`;
    }

    case 'configuration': {
      const configType = normalize(details.configType);
      const planets = [details.planet1, details.planet2, details.planet3, details.planet4]
        .filter(Boolean)
        .map(normalize)
        .sort()
        .join('-');
      return `config-${configType}-${planets}`;
    }

    case 'stellium': {
      const sign = normalize(details.sign);
      const owner = details.ownerPlanet1 || 'combined';
      return `stellium-${owner}-${sign}`;
    }

    case 'composite': {
      const p1 = normalize(details.planet1);
      const p2 = normalize(details.planet2);
      const asp = normalize(details.aspect);
      const [first, second] = [p1, p2].sort();
      return `composite-${first}-${second}-${asp}`;
    }

    case 'longevity':
    case 'harmony':
    case 'dignity':
    case 'reception':
    case 'balance':
    case 'chart_ruler':
    case 'penalty': {
      // For these types, use the description as part of key
      const p1 = normalize(details.planet1);
      const p2 = normalize(details.planet2);
      if (p1 && p2) {
        const [first, second] = [p1, p2].sort();
        return `${type}-${first}-${second}`;
      } else if (p1) {
        return `${type}-${p1}`;
      }
      return `${type}-${Date.now()}`; // Fallback with timestamp
    }

    default:
      return `${type}-${Date.now()}`;
  }
}

/**
 * Legacy function for backward compatibility
 */
export function generateAspectKey(
  planet1: string,
  planet2: string,
  aspect: string,
  orb?: number
): string {
  return generateContributionKey('aspect', { planet1, planet2, aspect, orb });
}

/**
 * Get orb range label from orb value
 */
export function getOrbRangeLabel(orb: number): string {
  if (orb <= 3) return '0-3°';
  if (orb <= 7) return '4-7°';
  return '8-10°';
}

// ============ ADJUSTMENTS ============

/**
 * Get base weights (imported from weights.json)
 */
export function getBaseWeights(): AdjustmentMap {
  return baseWeights;
}

/**
 * Load only user adjustments from localStorage (without base weights)
 */
export function loadUserAdjustments(): AdjustmentMap {
  try {
    const stored = localStorage.getItem(ADJUSTMENTS_KEY);
    if (stored) {
      const parsed: AdjustmentsFile = JSON.parse(stored);
      return parsed.adjustments || {};
    }
  } catch (err) {
    console.warn('[AdjustmentService] Failed to load user adjustments:', err);
  }
  return {};
}

/**
 * Load all adjustments (base weights merged with user overrides)
 */
export function loadAdjustments(): AdjustmentMap {
  const userAdjustments = loadUserAdjustments();
  return { ...baseWeights, ...userAdjustments };
}

/**
 * Save a single adjustment (only stores user overrides, not baked defaults)
 */
export function saveAdjustment(aspectKey: string, data: AdjustmentData): void {
  try {
    const userAdjustments = loadUserAdjustments();
    userAdjustments[aspectKey] = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    const file: AdjustmentsFile = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      adjustments: userAdjustments
    };

    localStorage.setItem(ADJUSTMENTS_KEY, JSON.stringify(file));
  } catch (err) {
    console.error('[AdjustmentService] Failed to save adjustment:', err);
  }
}

/**
 * Remove an adjustment
 */
export function removeAdjustment(aspectKey: string): void {
  try {
    const userAdjustments = loadUserAdjustments();
    delete userAdjustments[aspectKey];

    if (Object.keys(userAdjustments).length === 0) {
      localStorage.removeItem(ADJUSTMENTS_KEY);
    } else {
      const file: AdjustmentsFile = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        adjustments: userAdjustments
      };
      localStorage.setItem(ADJUSTMENTS_KEY, JSON.stringify(file));
    }
  } catch (err) {
    console.error('[AdjustmentService] Failed to remove adjustment:', err);
  }
}

/**
 * Get adjustment for a specific aspect
 */
export function getAdjustment(aspectKey: string): AdjustmentData | null {
  const adjustments = loadAdjustments();
  return adjustments[aspectKey] || null;
}

/**
 * Export adjustments as JSON string
 */
export function exportAdjustmentsJson(): string {
  const adjustments = loadAdjustments();
  const file: AdjustmentsFile = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    adjustments
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Import adjustments from JSON string (merges with existing user adjustments only)
 */
export function importAdjustmentsJson(json: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed: AdjustmentsFile = JSON.parse(json);
    if (!parsed.adjustments) {
      return { success: false, count: 0, error: 'Invalid format: missing adjustments' };
    }

    const current = loadUserAdjustments();
    const merged = { ...current, ...parsed.adjustments };

    const file: AdjustmentsFile = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      adjustments: merged
    };

    localStorage.setItem(ADJUSTMENTS_KEY, JSON.stringify(file));
    return { success: true, count: Object.keys(parsed.adjustments).length };
  } catch (err) {
    return { success: false, count: 0, error: String(err) };
  }
}

/**
 * Clear all adjustments
 */
export function clearAdjustments(): void {
  localStorage.removeItem(ADJUSTMENTS_KEY);
}

/**
 * Get count of user adjustments (excludes baked defaults)
 */
export function getAdjustmentCount(): number {
  return Object.keys(loadUserAdjustments()).length;
}

// ============ SCORE TRACKING ============

/**
 * Load score records from localStorage
 */
export function loadScores(): ScoreRecord[] {
  try {
    const stored = localStorage.getItem(SCORES_KEY);
    if (stored) {
      const parsed: ScoresFile = JSON.parse(stored);
      return parsed.scores || [];
    }
  } catch (err) {
    console.warn('[AdjustmentService] Failed to load scores:', err);
  }
  return [];
}

/**
 * Calculate stats from scores
 */
function calculateStats(scores: ScoreRecord[]): ScoreStats {
  if (scores.length === 0) {
    return { min: 0, max: 100, count: 0 };
  }

  const rawScores = scores.map(s => s.rawScore);
  return {
    min: Math.min(...rawScores),
    max: Math.max(...rawScores),
    count: scores.length
  };
}

/**
 * Add a new score record
 */
export function addScoreRecord(
  personA: string,
  personB: string,
  rawScore: number,
  normalizedScore: number
): void {
  try {
    const scores = loadScores();

    // Check if this pair already exists (update if so)
    const existingIdx = scores.findIndex(
      s => (s.personA === personA && s.personB === personB) ||
           (s.personA === personB && s.personB === personA)
    );

    const record: ScoreRecord = {
      personA,
      personB,
      rawScore,
      normalizedScore,
      calculatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      scores[existingIdx] = record;
    } else {
      scores.push(record);
    }

    const file: ScoresFile = {
      version: '1.0',
      scores,
      stats: calculateStats(scores)
    };

    localStorage.setItem(SCORES_KEY, JSON.stringify(file));
  } catch (err) {
    console.error('[AdjustmentService] Failed to add score record:', err);
  }
}

/**
 * Get score statistics
 */
export function getScoreStats(): ScoreStats {
  const scores = loadScores();
  return calculateStats(scores);
}

/**
 * Export scores as JSON string
 */
export function exportScoresJson(): string {
  const scores = loadScores();
  const file: ScoresFile = {
    version: '1.0',
    scores,
    stats: calculateStats(scores)
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Import scores from JSON string (replaces existing)
 */
export function importScoresJson(json: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed: ScoresFile = JSON.parse(json);
    if (!parsed.scores) {
      return { success: false, count: 0, error: 'Invalid format: missing scores' };
    }

    const file: ScoresFile = {
      version: '1.0',
      scores: parsed.scores,
      stats: calculateStats(parsed.scores)
    };

    localStorage.setItem(SCORES_KEY, JSON.stringify(file));
    return { success: true, count: parsed.scores.length };
  } catch (err) {
    return { success: false, count: 0, error: String(err) };
  }
}

/**
 * Clear all score records
 */
export function clearScores(): void {
  localStorage.removeItem(SCORES_KEY);
}

// ============ DISPLAY NORMALIZATION ============

/**
 * Normalize a score to 29-99 range based on observed min/max
 * This is for display only - does not change the actual score
 */
export function normalizeToDisplayRange(
  normalizedScore: number,
  observedMin: number,
  observedMax: number
): number {
  // If no range data, return the score as-is (clamped to 29-99)
  if (observedMax <= observedMin) {
    return Math.max(29, Math.min(99, normalizedScore));
  }

  // Map from observed range to 29-99
  const ratio = (normalizedScore - observedMin) / (observedMax - observedMin);
  const displayScore = 29 + ratio * 70;

  return Math.round(Math.max(29, Math.min(99, displayScore)));
}

// ============ FILE DOWNLOAD HELPERS ============

/**
 * Trigger download of a JSON file
 */
export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download adjustments JSON file
 */
export function downloadAdjustments(): void {
  downloadJson(exportAdjustmentsJson(), `synastry-adjustments-${new Date().toISOString().split('T')[0]}.json`);
}

/**
 * Download scores JSON file
 */
export function downloadScores(): void {
  downloadJson(exportScoresJson(), `synastry-scores-${new Date().toISOString().split('T')[0]}.json`);
}
