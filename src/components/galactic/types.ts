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
