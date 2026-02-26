/**
 * Progressed Ring Layer
 * Renders progressed planets as a ring with gold color scheme
 * Layout (inside to out): degree → sign → minutes → planet
 * Follows exact same pattern as TransitRing.tsx
 */

import React from 'react';
import { PLANETS, ZODIAC_SIGNS, COLORS, ASTEROIDS, getElementColor } from '../utils/constants';
import { longitudeToXY } from '../utils/chartMath';
import type { ChartDimensions, TransitPlanet, PlacedPlanet, PlanetData } from '../types';

// Progressed color scheme - gold
const PROGRESSED_COLOR = '#FFD700';
const PROGRESSED_COLOR_DARK = '#B8860B';

// Element colors resolved at render time via getElementColor()

interface ProgressedRingProps {
  dimensions: ChartDimensions;
  progressedPlanets: TransitPlanet[];
  visiblePlanets: Set<string>;
  showRetrogrades: boolean;
  hoveredPlanet: { planet: string; chart: 'A' | 'B' | 'Transit' | 'Progressed' | 'Composite' } | null;
  onPlanetHover: (planet: { planet: string; chart: 'Progressed' } | null, event?: React.MouseEvent) => void;
  onPlanetClick?: (planet: string, chart: 'Progressed', event?: React.MouseEvent) => void;
  rotationOffset?: number;
}

/**
 * Minimum angular spacing in degrees between displayed progressed planets.
 */
const MIN_SPACING = 3;

/**
 * Calculate circular mean (average angle that handles 0°/360° wraparound correctly)
 */
function circularMean(angles: number[]): number {
  if (angles.length === 0) return 0;

  let sumSin = 0;
  let sumCos = 0;
  for (const angle of angles) {
    const rad = angle * Math.PI / 180;
    sumSin += Math.sin(rad);
    sumCos += Math.cos(rad);
  }

  const meanRad = Math.atan2(sumSin / angles.length, sumCos / angles.length);
  const meanDeg = meanRad * 180 / Math.PI;
  return ((meanDeg % 360) + 360) % 360;
}

/**
 * Fan a group of planets equally around their center of mass.
 */
function fanGroup(planets: PlacedPlanet[], indices: number[]): void {
  const n = indices.length;
  if (n <= 1) return;

  const longitudes = indices.map(idx => planets[idx].longitude);
  const center = circularMean(longitudes);

  const totalSpread = (n - 1) * MIN_SPACING;
  const start = center - totalSpread / 2;

  for (let i = 0; i < n; i++) {
    planets[indices[i]].displayLongitude = start + i * MIN_SPACING;
    planets[indices[i]].hasCollision = true;
  }
}

/**
 * Order-preserving collision avoidance with iterative merging.
 */
function prepareProgressedPlanets(
  progressedPlanets: TransitPlanet[],
  visiblePlanets: Set<string>,
  dimensions: ChartDimensions,
  ringRadius: number,
  rotationOffset: number = 0
): PlacedPlanet[] {
  const { cx, cy } = dimensions;
  const planets: PlacedPlanet[] = [];

  for (const planet of progressedPlanets) {
    const key = planet.planet.toLowerCase();
    if (!visiblePlanets.has(key)) continue;

    planets.push({
      key,
      data: {
        longitude: planet.longitude,
        sign: planet.sign,
        retrograde: planet.retrograde,
      } as PlanetData,
      longitude: planet.longitude,
      displayLongitude: planet.longitude,
      x: 0,
      y: 0,
      hasCollision: false,
    });
  }

  if (planets.length <= 1) {
    return planets.map((p) => {
      const pos = longitudeToXY(p.displayLongitude, cx, cy, ringRadius, rotationOffset);
      return { ...p, x: pos.x, y: pos.y };
    });
  }

  // Sort by true longitude
  planets.sort((a, b) => a.longitude - b.longitude);

  // Build groups
  let groups: number[][] = planets.map((_, i) => [i]);

  // Iterative merge-and-fan
  for (let pass = 0; pass < 20; pass++) {
    for (const group of groups) {
      if (group.length > 1) {
        fanGroup(planets, group);
      }
    }

    let merged = false;
    const newGroups: number[][] = [groups[0]];

    for (let g = 1; g < groups.length; g++) {
      const prev = newGroups[newGroups.length - 1];
      const curr = groups[g];

      const prevEnd = planets[prev[prev.length - 1]].displayLongitude;
      const currStart = planets[curr[0]].displayLongitude;

      if (currStart - prevEnd < MIN_SPACING) {
        newGroups[newGroups.length - 1] = [...prev, ...curr];
        merged = true;
      } else {
        newGroups.push(curr);
      }
    }

    // Check wrap-around
    if (newGroups.length > 1) {
      const lastGroup = newGroups[newGroups.length - 1];
      const firstGroup = newGroups[0];
      const lastEnd = planets[lastGroup[lastGroup.length - 1]].displayLongitude;
      const firstStart = planets[firstGroup[0]].displayLongitude;
      const wrapGap = (firstStart + 360) - lastEnd;

      if (wrapGap < MIN_SPACING) {
        newGroups[0] = [...lastGroup, ...firstGroup];
        newGroups.pop();
        merged = true;
      }
    }

    groups = newGroups;

    if (!merged) break;
  }

  // Final fan pass
  for (const group of groups) {
    if (group.length > 1) {
      fanGroup(planets, group);
    }
  }

  // Normalize and set collision flag
  for (const p of planets) {
    p.displayLongitude = ((p.displayLongitude % 360) + 360) % 360;
    let diff = Math.abs(p.displayLongitude - p.longitude);
    if (diff > 180) diff = 360 - diff;
    p.hasCollision = diff > 0.3;
  }

  // Calculate final positions
  return planets.map((p) => {
    const pos = longitudeToXY(p.displayLongitude, cx, cy, ringRadius, rotationOffset);
    return { ...p, x: pos.x, y: pos.y };
  });
}

function getPlanetSymbol(key: string): string {
  const planet = PLANETS[key as keyof typeof PLANETS];
  if (planet?.symbol) return planet.symbol;
  // Check asteroids
  const asteroid = ASTEROIDS[key as keyof typeof ASTEROIDS];
  if (asteroid?.symbol) return asteroid.symbol;
  return key.charAt(0).toUpperCase();
}

function getSignSymbol(longitude: number): string {
  const normalizedLong = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedLong / 30);
  return ZODIAC_SIGNS[signIndex]?.symbol || '';
}

function getSignColor(longitude: number): string {
  const normalizedLong = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedLong / 30);
  const element = ZODIAC_SIGNS[signIndex]?.element || 'fire';
  return getElementColor(element);
}

export const ProgressedRing: React.FC<ProgressedRingProps> = ({
  dimensions,
  progressedPlanets,
  visiblePlanets,
  showRetrogrades,
  hoveredPlanet,
  onPlanetHover,
  onPlanetClick,
  rotationOffset = 0,
}) => {
  const {
    cx, cy,
    progressedPlanetRing,
    progressedMinuteRing,
    progressedSignRing,
    progressedDegreeRing,
    progressedRingOuter,
    transitRingOuter,
    outerHouseRingOuter,
  } = dimensions;

  // Don't render if progressed dimensions aren't calculated
  if (!progressedPlanetRing) return null;

  // Prepare planet placements
  const placedPlanets = React.useMemo(
    () => prepareProgressedPlanets(progressedPlanets, visiblePlanets, dimensions, progressedPlanetRing, rotationOffset),
    [progressedPlanets, visiblePlanets, dimensions, progressedPlanetRing, rotationOffset]
  );

  // Check if a planet should be highlighted
  const isHighlighted = (planetKey: string): boolean => {
    if (!hoveredPlanet) return false;
    return hoveredPlanet.planet === planetKey && hoveredPlanet.chart === 'Progressed';
  };

  // Check if a planet should be dimmed
  const isDimmed = (planetKey: string): boolean => {
    if (!hoveredPlanet) return false;
    return !isHighlighted(planetKey);
  };

  // Font sizes
  const planetSize = 32;
  const signSize = 20;
  const degreeSize = 13;
  const minuteSize = 10;
  const highlightScale = 1.1;

  // Inner separator radius - either after transit ring or after house ring
  const innerSeparatorRadius = transitRingOuter || outerHouseRingOuter;

  return (
    <g className="progressed-ring">
      {/* Outer border circle for progressed ring */}
      {progressedRingOuter && (
        <circle
          cx={cx}
          cy={cy}
          r={progressedRingOuter}
          fill="none"
          stroke={PROGRESSED_COLOR}
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
      )}

      {/* Inner separator */}
      {innerSeparatorRadius && (
        <circle
          cx={cx}
          cy={cy}
          r={innerSeparatorRadius + 3}
          fill="none"
          stroke={PROGRESSED_COLOR}
          strokeWidth={1}
          strokeOpacity={0.4}
          strokeDasharray="4 4"
        />
      )}

      {/* Progressed planets */}
      {placedPlanets.map((planet) => {
        const highlighted = isHighlighted(planet.key);
        const dimmed = isDimmed(planet.key);
        const degInSign = Math.floor(planet.longitude % 30);
        const minutes = Math.floor((planet.longitude % 1) * 60);
        const signSymbol = getSignSymbol(planet.longitude);

        // Calculate positions at different radii
        const degreePos = progressedDegreeRing ? longitudeToXY(planet.displayLongitude, cx, cy, progressedDegreeRing, rotationOffset) : null;
        const signPos = progressedSignRing ? longitudeToXY(planet.displayLongitude, cx, cy, progressedSignRing, rotationOffset) : null;
        const minutePos = progressedMinuteRing ? longitudeToXY(planet.displayLongitude, cx, cy, progressedMinuteRing, rotationOffset) : null;
        const planetPos = longitudeToXY(planet.displayLongitude, cx, cy, progressedPlanetRing, rotationOffset);

        return (
          <g
            key={`Progressed-${planet.key}`}
            className="progressed-planet-marker"
            style={{
              cursor: 'pointer',
              opacity: dimmed ? 0.3 : 1,
              transition: 'opacity 0.15s ease-out',
            }}
            onMouseEnter={(e) => onPlanetHover({ planet: planet.key, chart: 'Progressed' }, e)}
            onMouseLeave={() => onPlanetHover(null)}
            onClick={(e) => { e.stopPropagation(); onPlanetClick?.(planet.key, 'Progressed', e); }}
          >
            {/* Degree (innermost) */}
            {degreePos && (
              <text
                x={degreePos.x}
                y={degreePos.y}
                fill={PROGRESSED_COLOR_DARK}
                fontSize={degreeSize}
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ userSelect: 'none' }}
              >
                {degInSign}°
              </text>
            )}

            {/* Sign symbol (colored by element) */}
            {signPos && (
              <text
                x={signPos.x}
                y={signPos.y}
                fill={getSignColor(planet.longitude)}
                fontSize={highlighted ? signSize * highlightScale : signSize}
                fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ userSelect: 'none', transition: 'font-size 0.15s ease-out' }}
              >
                {signSymbol}
              </text>
            )}

            {/* Minutes */}
            {minutePos && (
              <text
                x={minutePos.x}
                y={minutePos.y}
                fill={PROGRESSED_COLOR_DARK}
                fontSize={minuteSize}
                fontFamily="Arial, sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ userSelect: 'none' }}
              >
                {minutes.toString().padStart(2, '0')}'
              </text>
            )}

            {/* Planet symbol (outermost) - gold color for progressed */}
            <text
              x={planetPos.x}
              y={planetPos.y}
              fill={PROGRESSED_COLOR}
              fontSize={highlighted ? planetSize * highlightScale : planetSize}
              fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
              fontWeight="900"
              textAnchor="middle"
              dominantBaseline="central"
              style={{ userSelect: 'none', transition: 'font-size 0.15s ease-out' }}
              stroke={PROGRESSED_COLOR_DARK}
              strokeWidth={0.5}
            >
              {getPlanetSymbol(planet.key)}
            </text>

            {/* Retrograde indicator */}
            {showRetrogrades && planet.data.retrograde && (
              <text
                x={planetPos.x + 16}
                y={planetPos.y - 12}
                fill="#c41e3a"
                fontSize={10}
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ userSelect: 'none' }}
              >
                ℞
              </text>
            )}

            {/* Collision tick line */}
            {planet.hasCollision && progressedRingOuter && (
              (() => {
                const trueAtOuter = longitudeToXY(planet.longitude, cx, cy, progressedRingOuter - 5, rotationOffset);
                const displayAtPlanet = longitudeToXY(planet.displayLongitude, cx, cy, progressedPlanetRing + 10, rotationOffset);
                const outerEdge = longitudeToXY(planet.longitude, cx, cy, progressedRingOuter, rotationOffset);
                return (
                  <g>
                    {/* Tick mark at true position */}
                    <line
                      x1={outerEdge.x}
                      y1={outerEdge.y}
                      x2={trueAtOuter.x}
                      y2={trueAtOuter.y}
                      stroke={PROGRESSED_COLOR}
                      strokeWidth={1.5}
                    />
                    {/* Line connecting to displayed position */}
                    <line
                      x1={trueAtOuter.x}
                      y1={trueAtOuter.y}
                      x2={displayAtPlanet.x}
                      y2={displayAtPlanet.y}
                      stroke={PROGRESSED_COLOR}
                      strokeWidth={1}
                      strokeOpacity={0.5}
                    />
                  </g>
                );
              })()
            )}
          </g>
        );
      })}

      {/* Progressed label */}
      <text
        x={cx}
        y={cy - (progressedRingOuter || 0) - 10}
        fill={PROGRESSED_COLOR}
        fontSize={12}
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        textAnchor="middle"
        style={{ userSelect: 'none' }}
      >
        PROGRESSED
      </text>
    </g>
  );
};

export default ProgressedRing;
