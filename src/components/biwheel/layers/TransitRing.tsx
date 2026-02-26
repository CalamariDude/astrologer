/**
 * Transit Ring Layer
 * Renders transit planets as the outermost ring with green color scheme
 * Layout (inside to out): degree → sign → minutes → planet
 * Follows exact same pattern as PlanetRing.tsx
 * Smooth CSS transitions for premium animation when date changes
 */

import React from 'react';
import { PLANETS, ZODIAC_SIGNS, COLORS, ASTEROIDS, getElementColor } from '../utils/constants';
import { longitudeToXY } from '../utils/chartMath';
import type { ChartDimensions, TransitPlanet, PlacedPlanet, PlanetData } from '../types';

// Transit color scheme - premium teal/emerald
const TRANSIT_COLOR = '#0d9488';
const TRANSIT_COLOR_LIGHT = '#14b8a6';
const TRANSIT_COLOR_ACCENT = '#2dd4bf';
const TRANSIT_COLOR_GLOW = '#99f6e4';

// Element colors resolved at render time via getElementColor()

// Animation timing
const TRANSIT_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const TRANSIT_DURATION = '0.6s';

interface TransitRingProps {
  dimensions: ChartDimensions;
  transitPlanets: TransitPlanet[];
  visiblePlanets: Set<string>;
  showRetrogrades: boolean;
  hoveredPlanet: { planet: string; chart: 'A' | 'B' | 'Transit' } | null;
  onPlanetHover: (planet: { planet: string; chart: 'Transit' } | null, event?: React.MouseEvent) => void;
  onPlanetClick?: (planet: string, chart: 'Transit', event?: React.MouseEvent) => void;
  rotationOffset?: number;
}

/**
 * Minimum angular spacing in degrees between displayed transit planets.
 */
const MIN_SPACING = 3;

/**
 * Calculate circular mean (average angle that handles 0°/360° wraparound correctly)
 * Uses unit vector averaging to find the true center of angular positions
 */
function circularMean(angles: number[]): number {
  if (angles.length === 0) return 0;

  // Convert to radians and compute mean of unit vectors
  let sumSin = 0;
  let sumCos = 0;
  for (const angle of angles) {
    const rad = angle * Math.PI / 180;
    sumSin += Math.sin(rad);
    sumCos += Math.cos(rad);
  }

  // Convert back to angle in degrees
  const meanRad = Math.atan2(sumSin / angles.length, sumCos / angles.length);
  const meanDeg = meanRad * 180 / Math.PI;
  // Normalize to [0, 360)
  return ((meanDeg % 360) + 360) % 360;
}

/**
 * Fan a group of planets equally around their center of mass.
 * Mutates displayLongitude and hasCollision on each planet.
 * Uses circular mean to correctly handle planets near 0°/360° boundary.
 */
function fanGroup(planets: PlacedPlanet[], indices: number[]): void {
  const n = indices.length;
  if (n <= 1) return;

  // Calculate circular mean to handle wraparound (e.g., Saturn at 358° + Neptune at 2°)
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
 *
 * 1. Sort planets by true longitude.
 * 2. Fan out initial clusters (consecutive planets < MIN_SPACING apart).
 * 3. After fanning, check if any adjacent planets/clusters now overlap.
 *    If so, merge them into a larger group and re-fan.
 * 4. Repeat until no overlaps remain.
 *
 * This handles cascading clusters: e.g. two small clusters near each
 * other that, after fanning, encroach on each other — they merge into
 * one bigger fan centered on the combined center of mass.
 */
function prepareTransitPlanets(
  transitPlanets: TransitPlanet[],
  visiblePlanets: Set<string>,
  dimensions: ChartDimensions,
  ringRadius: number,
  rotationOffset: number = 0
): PlacedPlanet[] {
  const { cx, cy } = dimensions;
  const planets: PlacedPlanet[] = [];

  for (const planet of transitPlanets) {
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

  // Sort by true longitude — this order is never violated
  planets.sort((a, b) => a.longitude - b.longitude);

  // --- Build groups: each planet starts as its own group ---
  // A group is an array of planet indices that will be fanned together.
  let groups: number[][] = planets.map((_, i) => [i]);

  // --- Iterative merge-and-fan ---
  // Keep merging adjacent groups whose display ranges overlap, then
  // re-fan the merged group. Stop when no merges happen.
  for (let pass = 0; pass < 20; pass++) {
    // Fan each group that has >1 member
    for (const group of groups) {
      if (group.length > 1) {
        fanGroup(planets, group);
      }
    }

    // Check adjacent groups for overlap and merge
    let merged = false;
    const newGroups: number[][] = [groups[0]];

    for (let g = 1; g < groups.length; g++) {
      const prev = newGroups[newGroups.length - 1];
      const curr = groups[g];

      // Display position of last planet in previous group
      const prevEnd = planets[prev[prev.length - 1]].displayLongitude;
      // Display position of first planet in current group
      const currStart = planets[curr[0]].displayLongitude;

      if (currStart - prevEnd < MIN_SPACING) {
        // Overlap — merge current group into previous
        newGroups[newGroups.length - 1] = [...prev, ...curr];
        merged = true;
      } else {
        newGroups.push(curr);
      }
    }

    // Check wrap-around (last group ↔ first group)
    if (newGroups.length > 1) {
      const lastGroup = newGroups[newGroups.length - 1];
      const firstGroup = newGroups[0];
      const lastEnd = planets[lastGroup[lastGroup.length - 1]].displayLongitude;
      const firstStart = planets[firstGroup[0]].displayLongitude;
      const wrapGap = (firstStart + 360) - lastEnd;

      if (wrapGap < MIN_SPACING) {
        // Merge last into first (they wrap around 0°)
        newGroups[0] = [...lastGroup, ...firstGroup];
        newGroups.pop();
        merged = true;
      }
    }

    groups = newGroups;

    if (!merged) break;
  }

  // Final fan pass (in case last merge didn't get fanned)
  for (const group of groups) {
    if (group.length > 1) {
      fanGroup(planets, group);
    }
  }

  // Normalise to [0, 360) and set collision flag
  for (const p of planets) {
    p.displayLongitude = ((p.displayLongitude % 360) + 360) % 360;
    // Calculate angular difference accounting for wrap-around
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
  // Normalize longitude to [0, 360) to handle edge cases
  const normalizedLong = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedLong / 30);
  return ZODIAC_SIGNS[signIndex]?.symbol || '';
}

function getSignColor(longitude: number): string {
  // Normalize longitude to [0, 360) to handle edge cases
  const normalizedLong = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedLong / 30);
  const element = ZODIAC_SIGNS[signIndex]?.element || 'fire';
  return getElementColor(element);
}

export const TransitRing: React.FC<TransitRingProps> = ({
  dimensions,
  transitPlanets,
  visiblePlanets,
  showRetrogrades,
  hoveredPlanet,
  onPlanetHover,
  onPlanetClick,
  rotationOffset = 0,
}) => {
  const {
    cx, cy,
    transitPlanetRing,
    transitMinuteRing,
    transitSignRing,
    transitDegreeRing,
    transitRingOuter,
    outerHouseRingOuter,
  } = dimensions;

  // Don't render if transit dimensions aren't calculated
  if (!transitPlanetRing) return null;

  // Prepare planet placements
  const placedPlanets = React.useMemo(
    () => prepareTransitPlanets(transitPlanets, visiblePlanets, dimensions, transitPlanetRing, rotationOffset),
    [transitPlanets, visiblePlanets, dimensions, transitPlanetRing, rotationOffset]
  );

  // Check if a planet should be highlighted
  const isHighlighted = (planetKey: string): boolean => {
    if (!hoveredPlanet) return false;
    return hoveredPlanet.planet === planetKey && hoveredPlanet.chart === 'Transit';
  };

  // Check if a planet should be dimmed
  const isDimmed = (planetKey: string): boolean => {
    if (!hoveredPlanet) return false;
    return !isHighlighted(planetKey);
  };

  // Font sizes — sized for readability on the outermost ring
  const planetSize = 44;
  const textLabelSize = 14; // Larger for multi-letter asteroid names
  const signSize = 26;
  const degreeSize = 18;
  const minuteSize = 13;
  const highlightScale = 1.1;

  // Check if a planet key uses a multi-letter text label (3+ chars)
  const isTextLabel = (key: string): boolean => {
    const symbol = getPlanetSymbol(key);
    return symbol.length >= 3;
  };

  // Midpoint radius for the ring background band
  const ringMid = transitDegreeRing && transitRingOuter
    ? (transitDegreeRing + transitRingOuter) / 2
    : undefined;
  const ringHalfWidth = transitDegreeRing && transitRingOuter
    ? (transitRingOuter - transitDegreeRing) / 2 + 4
    : undefined;

  return (
    <g className="transit-ring">
      {/* SVG Defs: glow filter + ring gradient */}
      <defs>
        <filter id="transit-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feColorMatrix in="blur" type="matrix" values={`0 0 0 0 0.05  0 0 0 0 0.58  0 0 0 0 0.53  0 0 0 0.5 0`} result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="transit-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" type="matrix" values={`0 0 0 0 0.05  0 0 0 0 0.58  0 0 0 0 0.53  0 0 0 0.7 0`} result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {transitRingOuter && transitDegreeRing && (
          <radialGradient id="transit-ring-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={TRANSIT_COLOR} stopOpacity={0} />
            <stop offset={`${((transitDegreeRing - 8) / transitRingOuter * 100).toFixed(1)}%`} stopColor={TRANSIT_COLOR} stopOpacity={0} />
            <stop offset={`${(transitDegreeRing / transitRingOuter * 100).toFixed(1)}%`} stopColor={TRANSIT_COLOR} stopOpacity={0.04} />
            <stop offset={`${(transitRingOuter / transitRingOuter * 100).toFixed(1)}%`} stopColor={TRANSIT_COLOR} stopOpacity={0.06} />
          </radialGradient>
        )}
      </defs>

      {/* Subtle background band for the transit ring area */}
      {transitRingOuter && (
        <circle
          cx={cx}
          cy={cy}
          r={transitRingOuter}
          fill="url(#transit-ring-fill)"
          stroke="none"
        />
      )}

      {/* Outer border — soft glow ring */}
      {transitRingOuter && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={transitRingOuter}
            fill="none"
            stroke={TRANSIT_COLOR_GLOW}
            strokeWidth={3}
            strokeOpacity={0.12}
          />
          <circle
            cx={cx}
            cy={cy}
            r={transitRingOuter}
            fill="none"
            stroke={TRANSIT_COLOR_LIGHT}
            strokeWidth={1}
            strokeOpacity={0.5}
          />
        </>
      )}

      {/* Inner separator — elegant double line */}
      {outerHouseRingOuter && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={outerHouseRingOuter + 2}
            fill="none"
            stroke={TRANSIT_COLOR_LIGHT}
            strokeWidth={0.75}
            strokeOpacity={0.35}
          />
          <circle
            cx={cx}
            cy={cy}
            r={outerHouseRingOuter + 5}
            fill="none"
            stroke={TRANSIT_COLOR}
            strokeWidth={0.5}
            strokeOpacity={0.2}
            strokeDasharray="2 6"
          />
        </>
      )}

      {/* Degree pointer lines — tapered with gradient opacity */}
      {placedPlanets.map((planet) => {
        if (!transitRingOuter) return null;
        const from = longitudeToXY(planet.displayLongitude, cx, cy, transitPlanetRing, rotationOffset);
        const to = longitudeToXY(planet.longitude, cx, cy, transitRingOuter, rotationOffset);
        const highlighted = isHighlighted(planet.key);
        return (
          <line
            key={`ptr-T-${planet.key}`}
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
            stroke={highlighted ? TRANSIT_COLOR_ACCENT : TRANSIT_COLOR_LIGHT}
            strokeWidth={highlighted ? 1.5 : 0.75}
            strokeOpacity={highlighted ? 0.8 : 0.4}
          />
        );
      })}

      {/* Transit planets — positioned via CSS transform for smooth animation */}
      {placedPlanets.map((planet) => {
        const highlighted = isHighlighted(planet.key);
        const dimmed = isDimmed(planet.key);
        const degInSign = Math.floor(planet.longitude % 30);
        const minutes = Math.floor((planet.longitude % 1) * 60);
        const signSymbol = getSignSymbol(planet.longitude);

        // Calculate positions at different radii
        const degreePos = transitDegreeRing ? longitudeToXY(planet.displayLongitude, cx, cy, transitDegreeRing, rotationOffset) : null;
        const signPos = transitSignRing ? longitudeToXY(planet.displayLongitude, cx, cy, transitSignRing, rotationOffset) : null;
        const minutePos = transitMinuteRing ? longitudeToXY(planet.displayLongitude, cx, cy, transitMinuteRing, rotationOffset) : null;
        const planetPos = longitudeToXY(planet.displayLongitude, cx, cy, transitPlanetRing, rotationOffset);

        return (
          <g
            key={`Transit-${planet.key}`}
            className="transit-planet-marker"
            style={{
              cursor: 'pointer',
              opacity: dimmed ? 0.25 : 1,
              transition: `opacity 0.2s ease-out`,
              filter: highlighted ? 'url(#transit-glow-strong)' : undefined,
            }}
            onMouseEnter={(e) => onPlanetHover({ planet: planet.key, chart: 'Transit' }, e)}
            onMouseLeave={() => onPlanetHover(null)}
            onClick={(e) => { e.stopPropagation(); onPlanetClick?.(planet.key, 'Transit', e); }}
          >
            {/* Backdrop circle behind planet symbol */}
            <circle
              r={highlighted ? 20 : 16}
              fill={TRANSIT_COLOR}
              fillOpacity={highlighted ? 0.12 : 0.06}
              stroke={TRANSIT_COLOR_ACCENT}
              strokeWidth={highlighted ? 1 : 0}
              strokeOpacity={0.4}
              style={{
                transform: `translate(${planetPos.x}px, ${planetPos.y}px)`,
                transition: `transform ${TRANSIT_DURATION} ${TRANSIT_EASE}, r 0.15s ease-out`,
              }}
            />

            {/* Degree (innermost) */}
            {degreePos && (
              <text
                fill={TRANSIT_COLOR_LIGHT}
                fontSize={degreeSize}
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  userSelect: 'none',
                  transform: `translate(${degreePos.x}px, ${degreePos.y}px)`,
                  transition: `transform ${TRANSIT_DURATION} ${TRANSIT_EASE}`,
                }}
              >
                {degInSign}°
              </text>
            )}

            {/* Sign symbol (colored by element) */}
            {signPos && (
              <text
                fill={getSignColor(planet.longitude)}
                fontSize={highlighted ? signSize * highlightScale : signSize}
                fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  userSelect: 'none',
                  transform: `translate(${signPos.x}px, ${signPos.y}px)`,
                  transition: `transform ${TRANSIT_DURATION} ${TRANSIT_EASE}, font-size 0.15s ease-out`,
                }}
              >
                {signSymbol}
              </text>
            )}

            {/* Minutes */}
            {minutePos && (
              <text
                fill={TRANSIT_COLOR_LIGHT}
                fontSize={minuteSize}
                fontFamily="Arial, sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
                fillOpacity={0.8}
                style={{
                  userSelect: 'none',
                  transform: `translate(${minutePos.x}px, ${minutePos.y}px)`,
                  transition: `transform ${TRANSIT_DURATION} ${TRANSIT_EASE}`,
                }}
              >
                {minutes.toString().padStart(2, '0')}'
              </text>
            )}

            {/* Planet symbol (outermost) — premium teal with glow on hover */}
            <text
              fill={highlighted ? TRANSIT_COLOR_ACCENT : TRANSIT_COLOR_LIGHT}
              fontSize={highlighted ? (isTextLabel(planet.key) ? textLabelSize : planetSize) * highlightScale : (isTextLabel(planet.key) ? textLabelSize : planetSize)}
              fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
              fontWeight="900"
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                userSelect: 'none',
                transform: `translate(${planetPos.x}px, ${planetPos.y}px)`,
                transition: `transform ${TRANSIT_DURATION} ${TRANSIT_EASE}, font-size 0.15s ease-out, fill 0.15s ease-out`,
              }}
            >
              {getPlanetSymbol(planet.key)}
            </text>

            {/* Retrograde indicator */}
            {showRetrogrades && planet.data.retrograde && (
              <text
                fill="#ef4444"
                fontSize={11}
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  userSelect: 'none',
                  transform: `translate(${planetPos.x + 16}px, ${planetPos.y - 14}px)`,
                  transition: `transform ${TRANSIT_DURATION} ${TRANSIT_EASE}`,
                }}
              >
                ℞
              </text>
            )}
          </g>
        );
      })}

      {/* Transit label — refined typography */}
      <text
        x={cx}
        y={cy - (transitRingOuter || 0) - 12}
        fill={TRANSIT_COLOR_LIGHT}
        fontSize={11}
        fontFamily="'Inter', 'SF Pro Display', Arial, sans-serif"
        fontWeight="600"
        textAnchor="middle"
        letterSpacing="0.2em"
        fillOpacity={0.7}
        style={{ userSelect: 'none' }}
        filter="url(#transit-glow)"
      >
        TRANSITS
      </text>
    </g>
  );
};

export default TransitRing;
