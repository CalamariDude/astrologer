/**
 * Shared life-area theme definitions for astrology tools
 * Used across aspect grid, profections, transits, ephemeris, etc.
 */

import { Heart, Briefcase, TrendingUp, Flame, MessageCircle, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AstroTheme {
  key: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  /** Planet keys (lowercase) that belong to this theme */
  planets: Set<string>;
  /** House numbers associated with this theme */
  houses: Set<number>;
  color: string;
  bgClass: string;
  ringClass: string;
}

export const LIFE_THEMES: Record<string, AstroTheme> = {
  love: {
    key: 'love',
    name: 'Love & Relationships',
    shortName: 'Love',
    icon: Heart,
    planets: new Set(['venus']),
    houses: new Set([5, 7]),
    color: '#ec4899',
    bgClass: 'bg-pink-500/8',
    ringClass: 'ring-pink-500/30',
  },
  career: {
    key: 'career',
    name: 'Career & Structure',
    shortName: 'Career',
    icon: Briefcase,
    planets: new Set(['saturn', 'jupiter']),
    houses: new Set([10, 6]),
    color: '#8b5cf6',
    bgClass: 'bg-violet-500/8',
    ringClass: 'ring-violet-500/30',
  },
  growth: {
    key: 'growth',
    name: 'Growth & Expansion',
    shortName: 'Growth',
    icon: TrendingUp,
    planets: new Set(['jupiter']),
    houses: new Set([9]),
    color: '#22c55e',
    bgClass: 'bg-green-500/8',
    ringClass: 'ring-green-500/30',
  },
  transformation: {
    key: 'transformation',
    name: 'Transformation',
    shortName: 'Change',
    icon: Flame,
    planets: new Set(['pluto', 'uranus']),
    houses: new Set([8, 12]),
    color: '#ef4444',
    bgClass: 'bg-red-500/8',
    ringClass: 'ring-red-500/30',
  },
  communication: {
    key: 'communication',
    name: 'Communication & Mind',
    shortName: 'Mind',
    icon: MessageCircle,
    planets: new Set(['mercury']),
    houses: new Set([3]),
    color: '#eab308',
    bgClass: 'bg-yellow-500/8',
    ringClass: 'ring-yellow-500/30',
  },
  home: {
    key: 'home',
    name: 'Home & Emotions',
    shortName: 'Home',
    icon: Home,
    planets: new Set(['moon']),
    houses: new Set([4]),
    color: '#06b6d4',
    bgClass: 'bg-cyan-500/8',
    ringClass: 'ring-cyan-500/30',
  },
};

/** Get the primary theme for a planet key (lowercase) */
export function getThemeForPlanet(planetKey: string): AstroTheme | null {
  const key = planetKey.toLowerCase();
  // Sun and Mars are "self/energy" — no specific theme
  // Nodes and Chiron don't have themes
  for (const theme of Object.values(LIFE_THEMES)) {
    if (theme.planets.has(key)) return theme;
  }
  return null;
}

/** Get theme for a house number */
export function getThemeForHouse(house: number): AstroTheme | null {
  for (const theme of Object.values(LIFE_THEMES)) {
    if (theme.houses.has(house)) return theme;
  }
  return null;
}

/** Get theme for a planet or house — planet takes priority */
export function getThemeForAspect(planet1: string, planet2: string): AstroTheme | null {
  // Prioritize the slower (outer) planet's theme
  const p1 = getThemeForPlanet(planet1);
  const p2 = getThemeForPlanet(planet2);
  // Return the one with the higher-priority theme (outer planet usually more significant)
  return p2 || p1;
}
