/**
 * Planet Ring Layer
 * Renders planets for both persons with degree, sign, minutes at separate radii
 * Layout per person (inside to out): degree → sign → minutes → planet
 * Sign symbol is 20% smaller than planet symbol
 *
 * Supports multiple chart modes:
 * - synastry: Two rings (A outer, B inner)
 * - personA: Single ring with A's planets
 * - personB: Single ring with B's planets
 * - composite: Single ring with composite planets
 */

import React from 'react';
import { PLANETS, ZODIAC_SIGNS, COLORS, ASTEROIDS, ARABIC_PARTS, FIXED_STARS, getElementColor, getThemeAwarePlanetColor } from '../utils/constants';
import { longitudeToXY, calculateDecan, calculateDegreeSign, getZodiacSignSymbol } from '../utils/chartMath';
import type { ChartDimensions, NatalChart, PlacedPlanet, PlanetData, ChartMode, CompositeData } from '../types';
import type { SynastryAspect } from '../utils/aspectCalculations';

// Element colors resolved at render time via getElementColor()

// Smooth animation timing for birth-time shift scrubbing
const SMOOTH_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
const SMOOTH_DURATION = '0.5s';


interface PlanetRingProps {
  dimensions: ChartDimensions;
  chartA: NatalChart;
  chartB?: NatalChart;
  compositeData?: CompositeData;
  mode: ChartMode;
  visiblePlanets: Set<string>;
  showRetrogrades: boolean;
  showDecans?: boolean;
  degreeSymbolMode?: 'sign' | 'spark';
  hoveredPlanet: { planet: string; chart: 'A' | 'B' | 'Composite' } | null;
  selectedAspect?: SynastryAspect | null; // When set, only show planets involved in this aspect
  aspects: SynastryAspect[]; // For highlighting aspect partners
  onPlanetHover: (planet: { planet: string; chart: 'A' | 'B' | 'Composite' } | null, event?: React.MouseEvent) => void;
  onPlanetClick?: (planet: string, chart: 'A' | 'B' | 'Composite', event?: React.MouseEvent) => void;
  rotationOffset?: number;
  smoothTransitions?: boolean; // When true, planet positions animate smoothly (for birth time shift)
}

/**
 * Minimum spacing in degrees between displayed planets
 */
/**
 * Soft repulsion collision avoidance (matches TransitRing algorithm).
 *
 * Every pair of planets within REPEL_ZONE exerts a smooth, proportional
 * push. The closer they are, the stronger the push — but it ramps up
 * gradually, so there is never a sudden jump. This gives buttery-smooth
 * movement when planets shift (e.g. birth-time knob scrubbing).
 */
const MIN_SPACING = 4;   // target spacing in degrees (outer ring)
const REPEL_ZONE  = 8;   // planets further apart than this don't interact (outer ring)

// Inner ring needs more angular separation because the smaller radius
// means the same degree spans fewer pixels — glyphs overlap otherwise
export const MIN_SPACING_INNER = 6;
export const REPEL_ZONE_INNER  = 12;

/** Signed angular difference (handles 0°/360° wrap), result in -180..180 */
function angularDiff(a: number, b: number): number {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

function resolveCollisions(planets: PlacedPlanet[], minSpacing = MIN_SPACING, repelZone = REPEL_ZONE): void {
  if (planets.length < 2) return;

  // Sort ONCE by original longitude — this order is preserved throughout
  planets.sort((a, b) => a.longitude - b.longitude);

  // Iterative soft-repulsion: each pass nudges overlapping pairs apart
  for (let pass = 0; pass < 24; pass++) {
    let anyPush = false;
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const gap = angularDiff(planets[i].displayLongitude, planets[j].displayLongitude);
        const absGap = Math.abs(gap);

        if (absGap < repelZone && absGap > 0.01) {
          // Push proportionally: stronger when closer, gentle at edges
          const strength = absGap < minSpacing
            ? (minSpacing - absGap) * 0.4     // strong push below min spacing
            : (repelZone - absGap) * 0.05;    // gentle nudge in the buffer zone
          const dir = gap > 0 ? 1 : -1;
          planets[i].displayLongitude -= dir * strength;
          planets[j].displayLongitude += dir * strength;
          planets[i].hasCollision = true;
          planets[j].hasCollision = true;
          if (absGap < minSpacing) anyPush = true;
        }
      }
    }

    // Normalize
    for (const p of planets) {
      p.displayLongitude = ((p.displayLongitude % 360) + 360) % 360;
    }

    if (!anyPush) break;
  }
}

/**
 * Prepare planets for placement with collision detection and adjustment
 */
export function preparePlanets(
  chart: NatalChart,
  visiblePlanets: Set<string>,
  dimensions: ChartDimensions,
  ringRadius: number,
  rotationOffset: number = 0,
  collisionSpacing?: { minSpacing: number; repelZone: number }
): PlacedPlanet[] {
  const { cx, cy } = dimensions;
  const planets: PlacedPlanet[] = [];

  // Track which keys we've already added to avoid duplicates
  const addedKeys = new Set<string>();

  // Add regular planets
  for (const [key, data] of Object.entries(chart.planets)) {
    if (!visiblePlanets.has(key)) continue;
    if (!data || data.longitude === undefined) continue;

    // Calculate decan info if not already present
    const decanInfo = data.decan && data.decanSign
      ? { decan: data.decan, decanSign: data.decanSign }
      : calculateDecan(data.longitude);

    planets.push({
      key,
      data: {
        ...data,
        decan: decanInfo.decan,
        decanSign: decanInfo.decanSign,
      } as PlanetData,
      longitude: data.longitude,
      displayLongitude: data.longitude,
      x: 0,
      y: 0,
      hasCollision: false,
    });
    addedKeys.add(key);
  }

  // Add angles (Ascendant and Midheaven) if they exist, are visible, and not already added
  if (chart.angles) {
    if (visiblePlanets.has('ascendant') && chart.angles.ascendant !== undefined && !addedKeys.has('ascendant')) {
      const signIndex = Math.floor(chart.angles.ascendant / 30);
      const decanInfo = calculateDecan(chart.angles.ascendant);
      planets.push({
        key: 'ascendant',
        data: {
          longitude: chart.angles.ascendant,
          sign: ZODIAC_SIGNS[signIndex]?.name || '',
          retrograde: false,
          decan: decanInfo.decan,
          decanSign: decanInfo.decanSign,
        },
        longitude: chart.angles.ascendant,
        displayLongitude: chart.angles.ascendant,
        x: 0,
        y: 0,
        hasCollision: false,
      });
    }
    if (visiblePlanets.has('midheaven') && chart.angles.midheaven !== undefined && !addedKeys.has('midheaven')) {
      const signIndex = Math.floor(chart.angles.midheaven / 30);
      const decanInfo = calculateDecan(chart.angles.midheaven);
      planets.push({
        key: 'midheaven',
        data: {
          longitude: chart.angles.midheaven,
          sign: ZODIAC_SIGNS[signIndex]?.name || '',
          retrograde: false,
          decan: decanInfo.decan,
          decanSign: decanInfo.decanSign,
        },
        longitude: chart.angles.midheaven,
        displayLongitude: chart.angles.midheaven,
        x: 0,
        y: 0,
        hasCollision: false,
      });
    }
    // Descendant (AC + 180) and IC (MC + 180)
    if (visiblePlanets.has('descendant') && chart.angles.ascendant !== undefined && !addedKeys.has('descendant')) {
      const dcLong = (chart.angles.ascendant + 180) % 360;
      const signIndex = Math.floor(dcLong / 30);
      const decanInfo = calculateDecan(dcLong);
      planets.push({
        key: 'descendant',
        data: { longitude: dcLong, sign: ZODIAC_SIGNS[signIndex]?.name || '', retrograde: false, decan: decanInfo.decan, decanSign: decanInfo.decanSign },
        longitude: dcLong, displayLongitude: dcLong, x: 0, y: 0, hasCollision: false,
      });
    }
    if (visiblePlanets.has('ic') && chart.angles.midheaven !== undefined && !addedKeys.has('ic')) {
      const icLong = (chart.angles.midheaven + 180) % 360;
      const signIndex = Math.floor(icLong / 30);
      const decanInfo = calculateDecan(icLong);
      planets.push({
        key: 'ic',
        data: { longitude: icLong, sign: ZODIAC_SIGNS[signIndex]?.name || '', retrograde: false, decan: decanInfo.decan, decanSign: decanInfo.decanSign },
        longitude: icLong, displayLongitude: icLong, x: 0, y: 0, hasCollision: false,
      });
    }
  }

  // Sort by longitude initially
  planets.sort((a, b) => a.longitude - b.longitude);

  // Apply advanced collision resolution
  resolveCollisions(planets, collisionSpacing?.minSpacing, collisionSpacing?.repelZone);

  // Calculate final positions
  return planets.map((p) => {
    const pos = longitudeToXY(p.displayLongitude, cx, cy, ringRadius, rotationOffset);
    return {
      ...p,
      x: pos.x,
      y: pos.y,
    };
  });
}

function getPlanetSymbol(key: string): string {
  const planet = PLANETS[key as keyof typeof PLANETS];
  if (planet?.symbol) return planet.symbol;
  // Check asteroids
  const asteroid = ASTEROIDS[key as keyof typeof ASTEROIDS];
  if (asteroid?.symbol) return asteroid.symbol;
  // Check Arabic Parts
  const part = ARABIC_PARTS[key as keyof typeof ARABIC_PARTS];
  if (part?.symbol) return part.symbol;
  // Check Fixed Stars
  const star = FIXED_STARS[key as keyof typeof FIXED_STARS];
  if (star?.symbol) return star.symbol;
  return key.charAt(0).toUpperCase();
}

function getPlanetColor(key: string): string {
  return getThemeAwarePlanetColor(key);
}

function getPlanetDescription(key: string): string | null {
  // Check asteroids for description
  const asteroid = ASTEROIDS[key as keyof typeof ASTEROIDS];
  if (asteroid && 'description' in asteroid) {
    return `${asteroid.name}: ${(asteroid as { description: string }).description}`;
  }
  // Check Arabic Parts for description
  const part = ARABIC_PARTS[key as keyof typeof ARABIC_PARTS];
  if (part) {
    return `${part.name}: ${part.description}`;
  }
  return null;
}

function getSignSymbol(longitude: number): string {
  const signIndex = Math.floor(longitude / 30);
  return ZODIAC_SIGNS[signIndex]?.symbol || '';
}

function getSignColor(longitude: number): string {
  const signIndex = Math.floor(longitude / 30);
  const element = ZODIAC_SIGNS[signIndex]?.element || 'fire';
  return getElementColor(element);
}

// Get decan sign symbol from decanSign name
function getDecanSignSymbol(decanSign: string): string {
  const sign = ZODIAC_SIGNS.find(z => z.name === decanSign);
  return sign?.symbol || '';
}

// Get decan sign color from decanSign name
function getDecanSignColor(decanSign: string): string {
  const sign = ZODIAC_SIGNS.find(z => z.name === decanSign);
  const element = sign?.element || 'fire';
  return getElementColor(element);
}

/**
 * Prepare planets from composite data for placement
 */
export function preparePlanetsFromComposite(
  compositeData: CompositeData,
  visiblePlanets: Set<string>,
  dimensions: ChartDimensions,
  ringRadius: number,
  rotationOffset: number = 0
): PlacedPlanet[] {
  const { cx, cy } = dimensions;
  const planets: PlacedPlanet[] = [];

  for (const planet of compositeData.planets) {
    const key = planet.planet.toLowerCase();
    if (!visiblePlanets.has(key)) continue;

    // Calculate decan info if not already present
    const decanInfo = planet.decan && planet.decanSign
      ? { decan: planet.decan, decanSign: planet.decanSign }
      : calculateDecan(planet.longitude);

    planets.push({
      key,
      data: {
        longitude: planet.longitude,
        sign: planet.sign,
        retrograde: planet.retrograde,
        decan: decanInfo.decan,
        decanSign: decanInfo.decanSign,
      },
      longitude: planet.longitude,
      displayLongitude: planet.longitude,
      x: 0,
      y: 0,
      hasCollision: false,
    });
  }

  // Sort by longitude initially
  planets.sort((a, b) => a.longitude - b.longitude);

  // Apply advanced collision resolution
  resolveCollisions(planets);

  // Calculate final positions
  return planets.map((p) => {
    const pos = longitudeToXY(p.displayLongitude, cx, cy, ringRadius, rotationOffset);
    return {
      ...p,
      x: pos.x,
      y: pos.y,
    };
  });
}

export const PlanetRing: React.FC<PlanetRingProps> = ({
  dimensions,
  chartA,
  chartB,
  compositeData,
  mode,
  visiblePlanets,
  showRetrogrades,
  showDecans = false,
  degreeSymbolMode = 'sign',
  hoveredPlanet,
  selectedAspect,
  aspects,
  onPlanetHover,
  onPlanetClick,
  rotationOffset = 0,
  smoothTransitions = false,
}) => {
  const {
    cx, cy,
    planetARing, minuteARing, signARing, degreeARing,
    planetBRing, minuteBRing, signBRing, degreeBRing,
    singlePlanetRing, singleDegreeRing, singleSignRing, singleMinuteRing,
    decanInner, tickBToA
  } = dimensions;

  // Smooth positioning: always uses CSS transform for positioning to avoid rendering-method
  // switch glitches. When smoothTransitions is true, adds CSS transition for animation.
  // Returns { posProps, posStyle } — spread posProps on the element and merge posStyle into style
  const smoothPos = (x: number, y: number, extraTransition?: string): { posProps: { x?: number; y?: number }; posStyle: React.CSSProperties } => {
    const transitions: string[] = [];
    if (smoothTransitions) transitions.push(`transform ${SMOOTH_DURATION} ${SMOOTH_EASE}`);
    if (extraTransition) transitions.push(extraTransition);
    return {
      posProps: {},
      posStyle: {
        transform: `translate(${x}px, ${y}px)`,
        ...(transitions.length ? { transition: transitions.join(', ') } : {}),
      },
    };
  };

  // Determine which ring radius to use based on mode
  const isSingleWheel = mode === 'personA' || mode === 'personB' || mode === 'composite';
  const singleRingRadius = singlePlanetRing || planetARing;
  const singleDegRadius = singleDegreeRing || degreeARing;
  const singleSignRadius = singleSignRing || signARing;
  const singleMinRadius = singleMinuteRing || minuteARing;

  // Prepare planet placements based on mode
  const planetsA = React.useMemo(() => {
    if (mode === 'personB' || mode === 'composite') return [];
    const radius = isSingleWheel ? singleRingRadius : planetARing;
    console.log('[PlanetRing] Preparing planets for A, midheaven:', chartA.angles?.midheaven, 'ascendant:', chartA.angles?.ascendant);
    return preparePlanets(chartA, visiblePlanets, dimensions, radius, rotationOffset);
  }, [chartA, chartA.angles?.midheaven, chartA.angles?.ascendant, visiblePlanets, dimensions, planetARing, singleRingRadius, rotationOffset, mode, isSingleWheel]);

  const planetsB = React.useMemo(() => {
    if (mode === 'personA' || mode === 'composite' || !chartB) return [];
    const radius = isSingleWheel ? singleRingRadius : planetBRing;
    // Inner ring needs wider spacing — smaller radius means less pixel distance per degree
    const innerSpacing = isSingleWheel ? undefined : { minSpacing: MIN_SPACING_INNER, repelZone: REPEL_ZONE_INNER };
    return preparePlanets(chartB, visiblePlanets, dimensions, radius, rotationOffset, innerSpacing);
  }, [chartB, chartB?.angles?.midheaven, chartB?.angles?.ascendant, visiblePlanets, dimensions, planetBRing, singleRingRadius, rotationOffset, mode, isSingleWheel]);

  const planetsComposite = React.useMemo(() => {
    if (mode !== 'composite' || !compositeData) return [];
    return preparePlanetsFromComposite(compositeData, visiblePlanets, dimensions, singleRingRadius, rotationOffset);
  }, [compositeData, visiblePlanets, dimensions, singleRingRadius, rotationOffset, mode]);

  // Find planets that have aspects with the hovered planet
  const aspectPartners = React.useMemo(() => {
    if (!hoveredPlanet) return new Set<string>();

    const partners = new Set<string>();
    for (const asp of aspects) {
      // For synastry mode: A's planets aspect with B's planets
      if (mode === 'synastry') {
        if (hoveredPlanet.chart === 'A' && asp.planetA === hoveredPlanet.planet) {
          partners.add(`B-${asp.planetB}`);
        } else if (hoveredPlanet.chart === 'B' && asp.planetB === hoveredPlanet.planet) {
          partners.add(`A-${asp.planetA}`);
        }
      } else {
        // For single-wheel modes (natal/composite): aspects are within the same chart
        // In natal aspects, planetA and planetB are both in the same chart
        const chartKey = mode === 'composite' ? 'Composite' : mode === 'personA' ? 'A' : 'B';
        if (hoveredPlanet.chart === chartKey) {
          if (asp.planetA === hoveredPlanet.planet) {
            partners.add(`${chartKey}-${asp.planetB}`);
          } else if (asp.planetB === hoveredPlanet.planet) {
            partners.add(`${chartKey}-${asp.planetA}`);
          }
        }
      }
    }
    return partners;
  }, [hoveredPlanet, aspects, mode]);

  // Check if a planet is part of the selected aspect
  const isPartOfSelectedAspect = (planetKey: string, chart: 'A' | 'B' | 'Composite'): boolean => {
    if (!selectedAspect) return true; // No aspect selected, show all
    // For natal/composite aspects, both planets are in the same chart
    if (mode === 'synastry') {
      if (chart === 'A' && selectedAspect.planetA === planetKey) return true;
      if (chart === 'B' && selectedAspect.planetB === planetKey) return true;
    } else {
      // Single-wheel: both planetA and planetB are in the same chart
      if (selectedAspect.planetA === planetKey || selectedAspect.planetB === planetKey) return true;
    }
    return false;
  };

  // Check if a planet should be highlighted (hovered or has aspect with hovered, or part of selected aspect)
  const isHighlighted = (planetKey: string, chart: 'A' | 'B' | 'Composite'): boolean => {
    // When an aspect is selected, highlight the planets in that aspect
    if (selectedAspect) {
      return isPartOfSelectedAspect(planetKey, chart);
    }
    if (!hoveredPlanet) return false;
    if (hoveredPlanet.planet === planetKey && hoveredPlanet.chart === chart) return true;
    return aspectPartners.has(`${chart}-${planetKey}`);
  };

  // Check if a planet should be dimmed (something is active and this planet is not highlighted)
  const isDimmed = (planetKey: string, chart: 'A' | 'B' | 'Composite'): boolean => {
    // Dim when an aspect is selected and this planet is not part of it
    if (selectedAspect) {
      return !isPartOfSelectedAspect(planetKey, chart);
    }
    // Dim when a planet is hovered and this planet is not highlighted
    if (!hoveredPlanet) return false;
    return !isHighlighted(planetKey, chart);
  };

  /**
   * Calculate SVG rotation angle for radial text alignment.
   * Text reads outward from center, flipped when on the left half so it's never upside-down.
   */
  const getRadialRotation = (longitude: number): number => {
    // Outward radial direction in SVG rotate degrees (clockwise from positive-x)
    let textAngle = -(90 + longitude + rotationOffset);
    // Normalize to -180..180
    textAngle = ((textAngle % 360) + 360) % 360;
    if (textAngle > 180) textAngle -= 360;
    // Flip if text would be upside-down (bottom half of chart)
    if (textAngle > 90 || textAngle < -90) {
      textAngle += 180;
    }
    return textAngle;
  };

  /**
   * Get retrograde ℞ offset — for text-label planets, position as superscript
   * at the top-right of the name (in local text space, before rotation).
   * For symbol planets, use a fixed offset.
   */
  const getRetrogradeOffset = (key: string, baseX: number, baseY: number, labelFontSize?: number): { x: number; y: number; useRotation: boolean } => {
    if (!isTextLabel(key)) {
      return { x: baseX, y: baseY, useRotation: false };
    }
    const symbol = getPlanetSymbol(key);
    const fs = labelFontSize || 16;
    const charWidth = fs * 0.55;
    const halfWidth = (symbol.length * charWidth) / 2;
    return { x: halfWidth + 4, y: -fs * 0.55, useRotation: true };
  };

  // Font sizes - enlarged to fill widened ring gaps
  const planetASize = 54;
  const asteroidASize = 16;  // Size for asteroids with text labels (3-5 letters)
  const angleASize = 24;  // AC/MC text labels
  const signASize = 28;  // degree symbol size
  const degreeASize = 22;
  const minuteASize = 15;

  const planetBSize = 46;
  const asteroidBSize = 13;  // Size for asteroids with text labels (3-5 letters)
  const angleBSize = 20;  // AC/MC text labels
  const signBSize = 23;  // degree symbol size
  const degreeBSize = 18;
  const minuteBSize = 12;

  // Check if a planet key is an angle (AC/MC)
  const isAngle = (key: string): boolean => key === 'ascendant' || key === 'midheaven' || key === 'descendant' || key === 'ic';

  // Check if a planet key is an asteroid (not a main planet or angle)
  const isAsteroid = (key: string): boolean => {
    const mainPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northnode', 'southnode', 'chiron', 'lilith', 'ascendant', 'descendant', 'midheaven', 'ic'];
    return !mainPlanets.includes(key.toLowerCase());
  };

  // Check if an asteroid uses a multi-letter text label (vs a single Unicode symbol)
  const isTextLabel = (key: string): boolean => {
    const symbol = getPlanetSymbol(key);
    // Unicode symbols are 1-2 chars; text labels like "Makem", "Sedna" are 3+ ASCII chars
    return symbol.length >= 3;
  };

  // Get font size for a planet based on its type
  const getPlanetFontSize = (key: string, isChartA: boolean, highlighted: boolean): number => {
    const baseSize = isAngle(key)
      ? (isChartA ? angleASize : angleBSize)
      : isAsteroid(key)
        ? isTextLabel(key)
          ? (isChartA ? asteroidASize : asteroidBSize)  // Smaller for text labels
          : (isChartA ? planetASize : planetBSize)       // Full size for Unicode symbols
        : (isChartA ? planetASize : planetBSize);
    return highlighted ? baseSize * highlightScale : baseSize;
  };

  // Scale factor for highlighted planets
  const highlightScale = 1.1;

  return (
    <g className="planet-rings">
      {/* Degree pointer lines — drawn first so planets render on top */}
      <g className="degree-pointer-lines">
        {planetsA.map((planet) => {
          const planetColor = getPlanetColor(planet.key);
          const effectivePlanetRing = isSingleWheel ? (singlePlanetRing || planetARing) : planetARing;
          if (!decanInner || !effectivePlanetRing) return null;
          // Start just outside the planet symbol (+20), end at the decan ring edge
          const from = longitudeToXY(planet.displayLongitude, cx, cy, effectivePlanetRing + 20, rotationOffset);
          const to = longitudeToXY(planet.longitude, cx, cy, decanInner, rotationOffset);
          return (
            <line
              key={`ptr-A-${planet.key}`}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={planetColor}
              strokeWidth={1.5}
              strokeOpacity={0.8}
            />
          );
        })}
        {planetsB.map((planet) => {
          const planetColor = getPlanetColor(planet.key);
          const effectivePlanetRing = isSingleWheel ? (singlePlanetRing || planetBRing) : planetBRing;
          const pointerEnd = isSingleWheel ? decanInner : tickBToA;
          if (!pointerEnd || !effectivePlanetRing) return null;
          const from = longitudeToXY(planet.displayLongitude, cx, cy, effectivePlanetRing + 16, rotationOffset);
          const to = longitudeToXY(planet.longitude, cx, cy, pointerEnd, rotationOffset);
          return (
            <line
              key={`ptr-B-${planet.key}`}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={planetColor}
              strokeWidth={1.5}
              strokeOpacity={0.8}
            />
          );
        })}
        {planetsComposite.map((planet) => {
          const planetColor = getPlanetColor(planet.key);
          const effectivePlanetRing = singlePlanetRing || planetARing;
          if (!decanInner || !effectivePlanetRing) return null;
          const from = longitudeToXY(planet.displayLongitude, cx, cy, effectivePlanetRing + 20, rotationOffset);
          const to = longitudeToXY(planet.longitude, cx, cy, decanInner, rotationOffset);
          return (
            <line
              key={`ptr-C-${planet.key}`}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={planetColor}
              strokeWidth={1.5}
              strokeOpacity={0.8}
            />
          );
        })}
      </g>

      {/* Person A's planets (outer in synastry, single in personA mode) */}
      {planetsA.map((planet) => {
        const highlighted = isHighlighted(planet.key, 'A');
        const dimmed = isDimmed(planet.key, 'A');
        const degInSign = Math.floor(planet.longitude % 30);
        const minutes = Math.floor((planet.longitude % 1) * 60);
        const planetColor = getPlanetColor(planet.key);
        const deg = calculateDegreeSign(planet.longitude);
        const zodiacSign = degreeSymbolMode === 'sign' ? getZodiacSignSymbol(planet.longitude) : null;
        const displaySymbol = zodiacSign ? zodiacSign.signSymbol : deg.degreeSymbol;
        const displayColorIndex = zodiacSign ? zodiacSign.signIndex : deg.degreeIndex;
        const textRotation = isTextLabel(planet.key) ? getRadialRotation(planet.displayLongitude) : 0;

        // Use single-wheel radii in personA mode
        const effectiveDegreeRing = isSingleWheel ? singleDegRadius : degreeARing;
        const effectiveSignRing = isSingleWheel ? singleSignRadius : signARing;
        const effectiveMinuteRing = isSingleWheel ? singleMinRadius : minuteARing;
        const effectivePlanetRing = isSingleWheel ? singleRingRadius : planetARing;

        // Calculate positions at different radii
        const degreePos = effectiveDegreeRing ? longitudeToXY(planet.displayLongitude, cx, cy, effectiveDegreeRing, rotationOffset) : null;
        const signPos = effectiveSignRing ? longitudeToXY(planet.displayLongitude, cx, cy, effectiveSignRing, rotationOffset) : null;
        const minutePos = effectiveMinuteRing ? longitudeToXY(planet.displayLongitude, cx, cy, effectiveMinuteRing, rotationOffset) : null;
        const planetPos = longitudeToXY(planet.displayLongitude, cx, cy, effectivePlanetRing, rotationOffset);

        return (
          <g
            key={`A-${planet.key}`}
            className="planet-marker"
            style={{
              cursor: 'pointer',
              opacity: dimmed ? 0.3 : 1,
              transition: 'opacity 0.15s ease-out',
            }}
            onMouseEnter={(e) => onPlanetHover({ planet: planet.key, chart: 'A' }, e)}
            onMouseLeave={() => onPlanetHover(null)}
            onClick={(e) => { e.stopPropagation(); onPlanetClick?.(planet.key, 'A', e); }}
          >
            {/* Degree (innermost) */}
            {degreePos && (() => {
              const sp = smoothPos(degreePos.x, degreePos.y);
              return (
                <text
                  {...sp.posProps}
                  fill={COLORS.textSecondary}
                  fontSize={degreeASize}
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                >
                  {degInSign}°
                </text>
              );
            })()}

            {/* Sign/degree symbol (between degrees and minutes, colored by element) */}
            {signPos && (() => {
              const sp = smoothPos(signPos.x, signPos.y, 'font-size 0.15s ease-out');
              return (
                <text
                  {...sp.posProps}
                  fill={getSignColor(displayColorIndex * 30)}
                  fontSize={highlighted ? signASize * highlightScale : signASize}
                  fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                >
                  {displaySymbol}
                </text>
              );
            })()}

            {/* Minutes */}
            {minutePos && (() => {
              const sp = smoothPos(minutePos.x, minutePos.y);
              return (
                <text
                  {...sp.posProps}
                  fill={COLORS.textSecondary}
                  fontSize={minuteASize}
                  fontFamily="Arial, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                >
                  {minutes.toString().padStart(2, '0')}'
                </text>
              );
            })()}

            {/* Planet symbol (outermost) - enlarged when highlighted, smaller for angles/asteroids */}
            {(() => {
              const sp = smoothPos(planetPos.x, planetPos.y, 'font-size 0.15s ease-out');
              return (
                <text
                  {...sp.posProps}
                  fill={planetColor}
                  fontSize={getPlanetFontSize(planet.key, true, highlighted)}
                  fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                  stroke={planetColor}
                  strokeWidth={isAsteroid(planet.key) ? 0.3 : 0.5}
                  {...(!smoothTransitions && textRotation ? { transform: `rotate(${textRotation}, ${planetPos.x}, ${planetPos.y})` } : {})}
                >
                  {getPlanetDescription(planet.key) && <title>{getPlanetDescription(planet.key)}</title>}
                  {getPlanetSymbol(planet.key)}
                </text>
              );
            })()}

            {/* Retrograde indicator */}
            {showRetrogrades && planet.data.retrograde && (() => {
              const rOff = getRetrogradeOffset(planet.key, 19, -14, asteroidASize);
              return (
                <text
                  x={planetPos.x + rOff.x}
                  y={planetPos.y + rOff.y}
                  fill="#c41e3a"
                  fontSize={isTextLabel(planet.key) ? 9 : 12}
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none' }}
                  {...(rOff.useRotation && textRotation ? { transform: `rotate(${textRotation}, ${planetPos.x}, ${planetPos.y})` } : {})}
                >
                  ℞
                </text>
              );
            })()}


          </g>
        );
      })}

      {/* Person B's planets (inner in synastry, single in personB mode) */}
      {planetsB.map((planet) => {
        const highlighted = isHighlighted(planet.key, 'B');
        const dimmed = isDimmed(planet.key, 'B');
        const degInSign = Math.floor(planet.longitude % 30);
        const minutes = Math.floor((planet.longitude % 1) * 60);
        const planetColor = getPlanetColor(planet.key);
        const textRotation = isTextLabel(planet.key) ? getRadialRotation(planet.displayLongitude) : 0;
        const deg = calculateDegreeSign(planet.longitude);
        const zodiacSignB = degreeSymbolMode === 'sign' ? getZodiacSignSymbol(planet.longitude) : null;
        const displaySymbolB = zodiacSignB ? zodiacSignB.signSymbol : deg.degreeSymbol;
        const displayColorIndexB = zodiacSignB ? zodiacSignB.signIndex : deg.degreeIndex;

        // Use single-wheel radii in personB mode
        const effectiveDegreeRing = isSingleWheel ? singleDegRadius : degreeBRing;
        const effectiveSignRing = isSingleWheel ? singleSignRadius : signBRing;
        const effectiveMinuteRing = isSingleWheel ? singleMinRadius : minuteBRing;
        const effectivePlanetRing = isSingleWheel ? singleRingRadius : planetBRing;

        // Calculate positions at different radii
        const degreePos = effectiveDegreeRing ? longitudeToXY(planet.displayLongitude, cx, cy, effectiveDegreeRing, rotationOffset) : null;
        const signPos = effectiveSignRing ? longitudeToXY(planet.displayLongitude, cx, cy, effectiveSignRing, rotationOffset) : null;
        const minutePos = effectiveMinuteRing ? longitudeToXY(planet.displayLongitude, cx, cy, effectiveMinuteRing, rotationOffset) : null;
        const planetPos = longitudeToXY(planet.displayLongitude, cx, cy, effectivePlanetRing, rotationOffset);

        return (
          <g
            key={`B-${planet.key}`}
            className="planet-marker"
            style={{
              cursor: 'pointer',
              opacity: dimmed ? 0.3 : 1,
              transition: 'opacity 0.15s ease-out',
            }}
            onMouseEnter={(e) => onPlanetHover({ planet: planet.key, chart: 'B' }, e)}
            onMouseLeave={() => onPlanetHover(null)}
            onClick={(e) => { e.stopPropagation(); onPlanetClick?.(planet.key, 'B', e); }}
          >
            {/* Degree (innermost) */}
            {degreePos && (() => {
              const sp = smoothPos(degreePos.x, degreePos.y);
              return (
                <text
                  {...sp.posProps}
                  fill={COLORS.textSecondary}
                  fontSize={degreeBSize}
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                >
                  {degInSign}°
                </text>
              );
            })()}

            {/* Sign/degree symbol (between degrees and minutes, colored by element) */}
            {signPos && (() => {
              const sp = smoothPos(signPos.x, signPos.y, 'font-size 0.15s ease-out');
              return (
                <text
                  {...sp.posProps}
                  fill={getSignColor(displayColorIndexB * 30)}
                  fontSize={highlighted ? signBSize * highlightScale : signBSize}
                  fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                >
                  {displaySymbolB}
                </text>
              );
            })()}

            {/* Minutes */}
            {minutePos && (() => {
              const sp = smoothPos(minutePos.x, minutePos.y);
              return (
                <text
                  {...sp.posProps}
                  fill={COLORS.textSecondary}
                  fontSize={minuteBSize}
                  fontFamily="Arial, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                >
                  {minutes.toString().padStart(2, '0')}'
                </text>
              );
            })()}

            {/* Planet symbol (outermost) - enlarged when highlighted, smaller for angles/asteroids */}
            {(() => {
              const sp = smoothPos(planetPos.x, planetPos.y, 'font-size 0.15s ease-out');
              return (
                <text
                  {...sp.posProps}
                  fill={planetColor}
                  fontSize={getPlanetFontSize(planet.key, false, highlighted)}
                  fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                  stroke={planetColor}
                  strokeWidth={isAsteroid(planet.key) ? 0.3 : 0.5}
                  {...(!smoothTransitions && textRotation ? { transform: `rotate(${textRotation}, ${planetPos.x}, ${planetPos.y})` } : {})}
                >
                  {getPlanetDescription(planet.key) && <title>{getPlanetDescription(planet.key)}</title>}
                  {getPlanetSymbol(planet.key)}
                </text>
              );
            })()}

            {/* Retrograde indicator */}
            {showRetrogrades && planet.data.retrograde && (() => {
              const rOff = getRetrogradeOffset(planet.key, 16, -12, asteroidBSize);
              return (
                <text
                  x={planetPos.x + rOff.x}
                  y={planetPos.y + rOff.y}
                  fill="#c41e3a"
                  fontSize={isTextLabel(planet.key) ? 8 : 11}
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none' }}
                  {...(rOff.useRotation && textRotation ? { transform: `rotate(${textRotation}, ${planetPos.x}, ${planetPos.y})` } : {})}
                >
                  ℞
                </text>
              );
            })()}

          </g>
        );
      })}

      {/* Composite planets (single wheel mode) */}
      {planetsComposite.map((planet) => {
        const highlighted = isHighlighted(planet.key, 'Composite');
        const dimmed = isDimmed(planet.key, 'Composite');
        const degInSign = Math.floor(planet.longitude % 30);
        const minutes = Math.floor((planet.longitude % 1) * 60);
        const planetColor = getPlanetColor(planet.key);
        const deg = calculateDegreeSign(planet.longitude);
        const zodiacSignC = degreeSymbolMode === 'sign' ? getZodiacSignSymbol(planet.longitude) : null;
        const displaySymbolC = zodiacSignC ? zodiacSignC.signSymbol : deg.degreeSymbol;
        const displayColorIndexC = zodiacSignC ? zodiacSignC.signIndex : deg.degreeIndex;
        const textRotation = isTextLabel(planet.key) ? getRadialRotation(planet.displayLongitude) : 0;

        // Calculate positions at single-wheel radii
        const degreePos = singleDegRadius ? longitudeToXY(planet.displayLongitude, cx, cy, singleDegRadius, rotationOffset) : null;
        const signPos = singleSignRadius ? longitudeToXY(planet.displayLongitude, cx, cy, singleSignRadius, rotationOffset) : null;
        const minutePos = singleMinRadius ? longitudeToXY(planet.displayLongitude, cx, cy, singleMinRadius, rotationOffset) : null;
        const planetPos = longitudeToXY(planet.displayLongitude, cx, cy, singleRingRadius, rotationOffset);

        return (
          <g
            key={`Composite-${planet.key}`}
            className="planet-marker"
            style={{
              cursor: 'pointer',
              opacity: dimmed ? 0.3 : 1,
              transition: 'opacity 0.15s ease-out',
            }}
            onMouseEnter={(e) => onPlanetHover({ planet: planet.key, chart: 'Composite' }, e)}
            onMouseLeave={() => onPlanetHover(null)}
            onClick={(e) => { e.stopPropagation(); onPlanetClick?.(planet.key, 'Composite', e); }}
          >
            {/* Degree (innermost) */}
            {degreePos && (() => {
              const sp = smoothPos(degreePos.x, degreePos.y);
              return (
                <text
                  {...sp.posProps}
                  fill={COLORS.textSecondary}
                  fontSize={degreeASize}
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                >
                  {degInSign}°
                </text>
              );
            })()}

            {/* Sign/degree symbol (between degrees and minutes, colored by element) */}
            {signPos && (() => {
              const sp = smoothPos(signPos.x, signPos.y, 'font-size 0.15s ease-out');
              return (
                <text
                  {...sp.posProps}
                  fill={getSignColor(displayColorIndexC * 30)}
                  fontSize={highlighted ? signASize * highlightScale : signASize}
                  fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                >
                  {displaySymbolC}
                </text>
              );
            })()}

            {/* Minutes */}
            {minutePos && (() => {
              const sp = smoothPos(minutePos.x, minutePos.y);
              return (
                <text
                  {...sp.posProps}
                  fill={COLORS.textSecondary}
                  fontSize={minuteASize}
                  fontFamily="Arial, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                >
                  {minutes.toString().padStart(2, '0')}'
                </text>
              );
            })()}

            {/* Planet symbol (outermost) - enlarged when highlighted, smaller for angles/asteroids */}
            {(() => {
              const sp = smoothPos(planetPos.x, planetPos.y, 'font-size 0.15s ease-out');
              return (
                <text
                  {...sp.posProps}
                  fill={planetColor}
                  fontSize={getPlanetFontSize(planet.key, true, highlighted)}
                  fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', ...sp.posStyle }}
                  stroke={planetColor}
                  strokeWidth={isAsteroid(planet.key) ? 0.3 : 0.5}
                  {...(!smoothTransitions && textRotation ? { transform: `rotate(${textRotation}, ${planetPos.x}, ${planetPos.y})` } : {})}
                >
                  {getPlanetDescription(planet.key) && <title>{getPlanetDescription(planet.key)}</title>}
                  {getPlanetSymbol(planet.key)}
                </text>
              );
            })()}

            {/* Retrograde indicator */}
            {showRetrogrades && planet.data.retrograde && (() => {
              const rOff = getRetrogradeOffset(planet.key, 19, -14, asteroidASize);
              return (
                <text
                  x={planetPos.x + rOff.x}
                  y={planetPos.y + rOff.y}
                  fill="#c41e3a"
                  fontSize={isTextLabel(planet.key) ? 9 : 12}
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none' }}
                  {...(rOff.useRotation && textRotation ? { transform: `rotate(${textRotation}, ${planetPos.x}, ${planetPos.y})` } : {})}
                >
                  ℞
                </text>
              );
            })()}


          </g>
        );
      })}
    </g>
  );
};

export default PlanetRing;
