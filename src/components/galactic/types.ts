/**
 * Galactic Mode Types
 * Type definitions for the 3D natal chart visualization
 */

import type * as THREE from 'three';
import type { DetectedAspect } from '../biwheel/utils/aspectCalculations';

/** A planet transformed into 3D space */
export interface Planet3D {
  key: string;
  name: string;
  symbol: string;
  position: THREE.Vector3;
  longitude: number;
  latitude: number;
  color: string;
  size: number;
  category: string;
  sign: string;
  house?: number;
  retrograde: boolean;
  orb: number; // planet's orb in degrees (for orb sphere visualization)
  hasRing?: boolean;
  ringColor?: string;
  ringTilt?: number; // radians
  ringSize?: number; // multiplier of planet size for ring radius
  isTransit?: boolean; // true for transit overlay planets
}

/** An aspect with 3D endpoint positions and energy parameters */
export interface Aspect3D {
  id: string;
  planetA: string;
  planetB: string;
  positionA: THREE.Vector3;
  positionB: THREE.Vector3;
  aspect: DetectedAspect;
  energy: AspectEnergyParams;
}

/** Energy visualization parameters for an aspect line */
export interface AspectEnergyParams {
  color: string;
  glowIntensity: number;
  pulseFrequency: number;
  particleCount: number;
  particleSpeed: number;
  particleTrajectory: 'linear' | 'sine' | 'burst';
  tubeRadius: number;
}

/** House sector data for 3D rendering */
export interface HouseSector3D {
  number: number;
  startAngle: number; // radians
  endAngle: number;   // radians
  isAngular: boolean; // houses 1, 4, 7, 10
}

/** Zodiac sign segment for the 3D ring */
export interface ZodiacSegment3D {
  name: string;
  symbol: string;
  element: string;
  startAngle: number; // radians
  endAngle: number;   // radians
  color: string;
}

/** Natal chart data as expected by the galactic mode */
export interface GalacticNatalChart {
  planets: Record<string, {
    longitude: number;
    latitude?: number;
    sign?: string;
    house?: number;
    retrograde?: boolean;
  }>;
  houses?: Record<string, number>;
  angles?: {
    ascendant: number;
    midheaven: number;
  };
}

/** Camera preset positions */
export interface CameraPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

/** Selected planet state */
export interface PlanetSelection {
  key: string;
  planet: Planet3D;
}

// ─── Galactic Journey Types ──────────────────────────────────────

export type JourneyTopic = 'love' | 'career' | 'growth' | 'health' | 'spiritual' | 'custom';

export type JourneyMood = 'calm' | 'intense' | 'joyful' | 'reflective' | 'transformative';

export type JourneySceneType = 'natal' | 'transit';

export interface JourneyScene {
  title: string;
  narration: string;
  focusPlanet?: string;         // planet key to zoom camera to (natal planet)
  transitPlanet?: string;       // for single-transit scenes: the transiting planet key (e.g. "saturn")
  transitPlanets?: string[];    // for multi-transit scenes: multiple transiting planet keys (e.g. ["saturn", "neptune"])
  natalTarget?: string;         // for transit scenes: the natal planet being aspected (e.g. "venus")
  sceneType?: JourneySceneType; // 'natal' = focus on natal chart, 'transit' = show transits
  transitDayOffset: number;     // days from birth to animate to
  durationSeconds: number;      // how long to linger on this scene
  mood: JourneyMood;
}

export interface JourneyData {
  topic: JourneyTopic | string;
  title: string;
  intro: string;
  scenes: JourneyScene[];
  outro: string;
}

export const JOURNEY_TOPICS: Record<JourneyTopic, { label: string; icon: string; description: string }> = {
  love:      { label: 'Love & Relationships', icon: '💕', description: 'Romance, connections, and heart matters' },
  career:    { label: 'Career & Purpose',     icon: '🚀', description: 'Work, ambition, and life direction' },
  growth:    { label: 'Personal Growth',      icon: '🌱', description: 'Self-discovery and transformation' },
  health:    { label: 'Health & Vitality',    icon: '✨', description: 'Body, energy, and wellness' },
  spiritual: { label: 'Spiritual Path',       icon: '🔮', description: 'Intuition, meaning, and inner wisdom' },
};
