/**
 * Chart Presets — save/load/delete named chart option configurations
 * Logged-in users: stored in astrologer_profiles.presets (JSONB)
 * Anonymous users: stored in localStorage under 'biwheel-chart-presets'.
 * Max 10 presets.
 */

import type { AsteroidGroup } from '../types';
import type { ThemeName } from './themes';
import { supabase } from '@/lib/supabase';

export interface ChartPreset {
  id: string;
  name: string;
  createdAt: number;
  // Display
  visiblePlanets: string[];
  visibleAspects: string[];
  showHouses: boolean;
  showDegreeMarkers: boolean;
  showRetrogrades: boolean;
  showDecans: boolean;
  // Aspect lines
  straightAspects: boolean;
  showEffects: boolean;
  // Theme & rotation
  chartTheme: string;
  rotateToAscendant: boolean;
  zodiacVantage: number | null;
  // Asteroid groups
  enabledAsteroidGroups: string[];
  // House system (optional for backwards compat with existing presets)
  houseSystem?: string;
  // Custom orbs (optional)
  customAspectOrbs?: Record<string, number>;
  customSeparatingAspectOrbs?: Record<string, number>;
  customPlanetOrbs?: Record<string, number>;
  // Harmonic number (optional)
  harmonicNumber?: number;
}

const STORAGE_KEY = 'biwheel-chart-presets';
const MAX_PRESETS = 10;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Local Storage (anonymous fallback) ─────────────────────────

export function loadPresets(): ChartPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChartPreset[];
  } catch {
    return [];
  }
}

export function savePreset(preset: Omit<ChartPreset, 'id' | 'createdAt'>): ChartPreset | null {
  const presets = loadPresets();
  if (presets.length >= MAX_PRESETS) return null;
  const newPreset: ChartPreset = {
    ...preset,
    id: generateId(),
    createdAt: Date.now(),
  };
  presets.push(newPreset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return newPreset;
}

export function deletePreset(id: string): void {
  const presets = loadPresets().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function reorderPresets(orderedIds: string[]): ChartPreset[] {
  const presets = loadPresets();
  const byId = new Map(presets.map(p => [p.id, p]));
  const reordered = orderedIds.map(id => byId.get(id)).filter(Boolean) as ChartPreset[];
  // Append any that weren't in orderedIds (safety)
  for (const p of presets) {
    if (!orderedIds.includes(p.id)) reordered.push(p);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));
  return reordered;
}

export function renamePreset(id: string, name: string): void {
  const presets = loadPresets();
  const preset = presets.find(p => p.id === id);
  if (preset) {
    preset.name = name;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }
}

// ─── Profile Storage (logged-in users) ──────────────────────────

export async function loadPresetsFromProfile(userId: string): Promise<ChartPreset[]> {
  try {
    const { data } = await supabase
      .from('astrologer_profiles')
      .select('presets')
      .eq('id', userId)
      .single();
    if (data?.presets && Array.isArray(data.presets) && data.presets.length > 0) {
      // Profile has presets — also sync to localStorage for offline/fast access
      localStorage.setItem('biwheel-chart-presets', JSON.stringify(data.presets));
      return data.presets as ChartPreset[];
    }
    // Profile empty or null — migrate localStorage presets to profile
    const local = loadPresets();
    if (local.length > 0) {
      await supabase.from('astrologer_profiles')
        .update({ presets: local })
        .eq('id', userId);
      return local;
    }
    return [];
  } catch {
    return loadPresets(); // fallback
  }
}

export async function savePresetsToProfile(userId: string, presets: ChartPreset[]): Promise<void> {
  await supabase
    .from('astrologer_profiles')
    .update({ presets })
    .eq('id', userId);
}

/** Build a preset payload from the current chart state */
export function buildPresetFromState(opts: {
  name: string;
  visiblePlanets: Set<string>;
  visibleAspects: Set<string>;
  showHouses: boolean;
  showDegreeMarkers: boolean;
  showRetrogrades: boolean;
  showDecans: boolean;
  straightAspects: boolean;
  showEffects: boolean;
  chartTheme: string;
  rotateToAscendant: boolean;
  zodiacVantage: number | null;
  enabledAsteroidGroups: Set<AsteroidGroup>;
  houseSystem?: string;
  customAspectOrbs?: Record<string, number>;
  customSeparatingAspectOrbs?: Record<string, number>;
  customPlanetOrbs?: Record<string, number>;
  harmonicNumber?: number;
}): Omit<ChartPreset, 'id' | 'createdAt'> {
  return {
    name: opts.name,
    visiblePlanets: Array.from(opts.visiblePlanets),
    visibleAspects: Array.from(opts.visibleAspects),
    showHouses: opts.showHouses,
    showDegreeMarkers: opts.showDegreeMarkers,
    showRetrogrades: opts.showRetrogrades,
    showDecans: opts.showDecans,
    straightAspects: opts.straightAspects,
    showEffects: opts.showEffects,
    chartTheme: opts.chartTheme,
    rotateToAscendant: opts.rotateToAscendant,
    zodiacVantage: opts.zodiacVantage,
    enabledAsteroidGroups: Array.from(opts.enabledAsteroidGroups),
    houseSystem: opts.houseSystem,
    customAspectOrbs: opts.customAspectOrbs && Object.keys(opts.customAspectOrbs).length > 0 ? opts.customAspectOrbs : undefined,
    customSeparatingAspectOrbs: opts.customSeparatingAspectOrbs && Object.keys(opts.customSeparatingAspectOrbs).length > 0 ? opts.customSeparatingAspectOrbs : undefined,
    customPlanetOrbs: opts.customPlanetOrbs && Object.keys(opts.customPlanetOrbs).length > 0 ? opts.customPlanetOrbs : undefined,
    harmonicNumber: opts.harmonicNumber && opts.harmonicNumber > 1 ? opts.harmonicNumber : undefined,
  };
}
