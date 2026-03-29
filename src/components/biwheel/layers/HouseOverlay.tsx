/**
 * House Overlay Layer
 * Renders house rings and structural elements
 * Layout: Inner circle → B's houses → planets → zodiac → A's houses (outer)
 */

import React from 'react';
import { COLORS, getThemeAwarePersonColor } from '../utils/constants';
import { longitudeToXY } from '../utils/chartMath';
import { calculateHouseCusps } from '@/lib/houseCalculations';
import type { ChartDimensions, NatalChart, HouseCusp } from '../types';

// House hover data for tooltips
export interface HouseHoverData {
  house: number;
  cusp: number;
  chart: 'A' | 'B';
  name: string; // Person's name
}

// Smooth animation timing for birth-time shift scrubbing
const HOUSE_SMOOTH_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
const HOUSE_SMOOTH_DURATION = '0.5s';

interface HouseOverlayProps {
  dimensions: ChartDimensions;
  chart: NatalChart; // Person A's chart (outer house ring)
  chartB?: NatalChart; // Person B's chart (inner house ring)
  nameA?: string;
  nameB?: string;
  showHouses: boolean;
  showDegreeMarkers: boolean;
  onHouseHover?: (data: HouseHoverData | null, event?: React.MouseEvent) => void;
  rotationOffset?: number;
  zodiacVantage?: number | null; // Override 1st house sign (0-11, null = use Ascendant)
  hideOuterHouseRing?: boolean; // Hide entire outer house ring (single-wheel mode)
  visiblePlanets?: Set<string>; // Controls which angle labels (AC/DC/MC/IC) are shown
  smoothTransitions?: boolean; // Animate house cusps smoothly during birth-time shift
  houseSystem?: string; // House system key (e.g. 'whole_sign', 'placidus', 'koch')
  birthLatA?: number; // Geographic latitude for Person A (needed for Placidus/Koch/etc.)
  birthLatB?: number; // Geographic latitude for Person B
}

/**
 * Extract API house cusps array from chart data
 * Returns array of 12 cusp longitudes if available, null otherwise
 */
function extractApiCusps(chart: NatalChart): number[] | null {
  if (!chart.houses) return null;
  const houses = chart.houses;

  // Array of cusps (API returns this format)
  if (Array.isArray(houses)) {
    if (houses.length >= 12) {
      // Check if it's array of numbers
      if (typeof houses[0] === 'number') return houses.slice(0, 12) as number[];
      // Array of objects with cusp/longitude property
      const cusps = houses.slice(0, 12).map((h: any) => h?.cusp ?? h?.longitude ?? h?.degree);
      if (cusps.every((c: any) => typeof c === 'number')) return cusps;
    }
    return null;
  }

  // Object format with cusps array (API returns { cusps: [...] })
  if (typeof houses === 'object' && 'cusps' in houses) {
    const cuspsArr = (houses as any).cusps;
    if (Array.isArray(cuspsArr) && cuspsArr.length >= 12) {
      const nums = cuspsArr.slice(0, 12).map((c: any) => typeof c === 'number' ? c : c?.cusp ?? c?.longitude);
      if (nums.every((n: any) => typeof n === 'number')) return nums;
    }
  }

  // Object format with house_1, house_2, ... keys (parseNatalResponse format)
  if (typeof houses === 'object' && 'house_1' in houses) {
    const nums = Array.from({ length: 12 }, (_, i) => (houses as any)[`house_${i + 1}`]);
    if (nums.every((n: any) => typeof n === 'number')) return nums;
  }

  return null;
}

/**
 * Generate house cusp data from chart.
 * Computes cusps client-side using ASC, MC, and geographic latitude.
 * When zodiacVantage is set, uses that sign for the 1st house instead (always 30° divisions).
 */
function generateHouseCusps(
  chart: NatalChart,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  rotationOffset: number = 0,
  zodiacVantage: number | null = null,
  houseSystem: string = 'whole_sign',
  birthLat: number = 0
): HouseCusp[] {
  const cusps: HouseCusp[] = [];

  // If zodiacVantage is set, use that sign for the 1st house (always 30° divisions)
  if (zodiacVantage !== null) {
    const house1Cusp = zodiacVantage * 30;
    for (let i = 1; i <= 12; i++) {
      const cusp = (house1Cusp + (i - 1) * 30) % 360;
      const innerPoint = longitudeToXY(cusp, cx, cy, innerRadius, rotationOffset);
      const outerPoint = longitudeToXY(cusp, cx, cy, outerRadius, rotationOffset);
      const labelRadius = (outerRadius + innerRadius) / 2;
      const midAngle = (cusp + 15) % 360;
      const houseNumberPos = longitudeToXY(midAngle, cx, cy, labelRadius, rotationOffset);
      cusps.push({ house: i, cusp, innerPoint, outerPoint, labelPos: houseNumberPos, houseNumberPos, midAngle });
    }
    return cusps;
  }

  // Get ASC and MC from chart
  const asc = chart.angles?.ascendant;
  const mc = chart.angles?.midheaven;
  if (asc === undefined) return cusps;

  // Calculate house cusps client-side
  const cuspLongs = calculateHouseCusps(asc, mc ?? 0, birthLat, houseSystem);

  for (let i = 0; i < 12; i++) {
    const cusp = cuspLongs[i];
    const nextCusp = cuspLongs[(i + 1) % 12];
    const innerPoint = longitudeToXY(cusp, cx, cy, innerRadius, rotationOffset);
    const outerPoint = longitudeToXY(cusp, cx, cy, outerRadius, rotationOffset);
    const labelRadius = (outerRadius + innerRadius) / 2;
    let span = nextCusp - cusp;
    if (span <= 0) span += 360;
    const midAngle = (cusp + span / 2) % 360;
    const houseNumberPos = longitudeToXY(midAngle, cx, cy, labelRadius, rotationOffset);
    cusps.push({ house: i + 1, cusp, innerPoint, outerPoint, labelPos: houseNumberPos, houseNumberPos, midAngle });
  }

  return cusps;
}

/**
 * Create SVG arc path for a house segment (wedge shape)
 * Uses polar coordinates to create a proper filled wedge
 */
function createHouseArcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  rotationOffset: number = 0
): string {
  // Normalize angles and calculate span (houses go counterclockwise in astrology)
  let span = endAngle - startAngle;
  if (span <= 0) span += 360;

  // Convert astrological longitude to SVG angle (with rotation offset)
  // Astro: 0° Aries at 9 o'clock, counterclockwise
  // SVG: 0° at 3 o'clock, clockwise
  const toSvgAngle = (astroAngle: number) => (90 - astroAngle + rotationOffset) * (Math.PI / 180);

  // Calculate all four corner points
  const startRad = toSvgAngle(startAngle);
  const endRad = toSvgAngle(endAngle);

  // Start point on inner radius
  const x1 = cx + innerRadius * Math.cos(startRad);
  const y1 = cy - innerRadius * Math.sin(startRad);

  // End point on inner radius (going counterclockwise in astro = clockwise in SVG)
  const x2 = cx + innerRadius * Math.cos(endRad);
  const y2 = cy - innerRadius * Math.sin(endRad);

  // End point on outer radius
  const x3 = cx + outerRadius * Math.cos(endRad);
  const y3 = cy - outerRadius * Math.sin(endRad);

  // Start point on outer radius
  const x4 = cx + outerRadius * Math.cos(startRad);
  const y4 = cy - outerRadius * Math.sin(startRad);

  // Large arc flag: 1 if span > 180°
  const largeArc = span > 180 ? 1 : 0;

  // Build path: start inner -> arc to end inner -> line to end outer -> arc back to start outer -> close
  // Sweep 0 = counterclockwise in SVG = clockwise astrologically
  return [
    `M ${x1} ${y1}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}

export const HouseOverlay: React.FC<HouseOverlayProps> = ({
  dimensions,
  chart,
  chartB,
  nameA = 'Person A',
  nameB = 'Person B',
  showHouses,
  showDegreeMarkers,
  onHouseHover,
  rotationOffset = 0,
  zodiacVantage = null,
  hideOuterHouseRing = false,
  visiblePlanets,
  smoothTransitions = false,
  houseSystem = 'whole_sign',
  birthLatA = 0,
  birthLatB = 0,
}) => {
  const houseTransitionStyle: React.CSSProperties = smoothTransitions
    ? { transition: `x1 ${HOUSE_SMOOTH_DURATION} ${HOUSE_SMOOTH_EASE}, y1 ${HOUSE_SMOOTH_DURATION} ${HOUSE_SMOOTH_EASE}, x2 ${HOUSE_SMOOTH_DURATION} ${HOUSE_SMOOTH_EASE}, y2 ${HOUSE_SMOOTH_DURATION} ${HOUSE_SMOOTH_EASE}` }
    : {};
  const houseTextTransitionStyle: React.CSSProperties = smoothTransitions
    ? { transition: `x ${HOUSE_SMOOTH_DURATION} ${HOUSE_SMOOTH_EASE}, y ${HOUSE_SMOOTH_DURATION} ${HOUSE_SMOOTH_EASE}` }
    : {};
  const colorA = getThemeAwarePersonColor('A');
  const colorB = getThemeAwarePersonColor('B');

  const {
    cx, cy, innerCircle,
    houseRingOuter, houseRingInner,
    outerHouseRingOuter, outerHouseRingInner,
    tickAToZodiac, tickBToA, tickBOuter,
    zodiacInner
  } = dimensions;

  // B's house cusps (inner ring - around aspect area)
  const innerHouseCusps = React.useMemo(
    () => chartB && houseRingOuter && houseRingInner
      ? generateHouseCusps(chartB, cx, cy, houseRingInner, houseRingOuter, rotationOffset, zodiacVantage, houseSystem, birthLatB)
      : [],
    [chartB, cx, cy, houseRingOuter, houseRingInner, rotationOffset, zodiacVantage, houseSystem, birthLatB]
  );

  // A's house cusps (outer ring - outside zodiac)
  const outerHouseCusps = React.useMemo(
    () => chart && outerHouseRingOuter && outerHouseRingInner
      ? generateHouseCusps(chart, cx, cy, outerHouseRingInner, outerHouseRingOuter, rotationOffset, zodiacVantage, houseSystem, birthLatA)
      : [],
    [chart, cx, cy, outerHouseRingOuter, outerHouseRingInner, rotationOffset, zodiacVantage, houseSystem, birthLatA]
  );

  // Extended house cusp lines (faint lines through chart)
  // A's cusps extend from zodiac inward to the midpoint (tickBToA)
  const extendedCuspsA = React.useMemo(
    () => (chart?.houses || chart?.angles?.ascendant !== undefined) && tickBToA
      ? generateHouseCusps(chart, cx, cy, tickBToA, zodiacInner, rotationOffset, zodiacVantage, houseSystem, birthLatA)
      : [],
    [chart, cx, cy, tickBToA, zodiacInner, rotationOffset, zodiacVantage, houseSystem, birthLatA]
  );

  // B's cusps extend from inner house ring outward to the midpoint (tickBToA)
  const extendedCuspsB = React.useMemo(
    () => (chartB?.houses || chartB?.angles?.ascendant !== undefined) && tickBToA && houseRingOuter
      ? generateHouseCusps(chartB, cx, cy, houseRingOuter, tickBToA, rotationOffset, zodiacVantage, houseSystem, birthLatB)
      : [],
    [chartB, cx, cy, houseRingOuter, tickBToA, rotationOffset, zodiacVantage, houseSystem, birthLatB]
  );

  return (
    <g className="house-overlay">
      {/* Inner house ring background (B's houses) */}
      {houseRingOuter && houseRingInner && (
        <>
          {/* Simple fill for inner house ring */}
          <circle
            cx={cx}
            cy={cy}
            r={houseRingOuter}
            fill={COLORS.backgroundAlt}
            stroke="none"
          />
          {/* White fill for aspect area */}
          <circle
            cx={cx}
            cy={cy}
            r={houseRingInner}
            fill={COLORS.background}
            stroke="none"
          />
          {/* Inner house ring borders */}
          <circle
            cx={cx}
            cy={cy}
            r={houseRingOuter}
            fill="none"
            stroke={COLORS.gridLineLight}
            strokeWidth={1.5}
          />
          <circle
            cx={cx}
            cy={cy}
            r={houseRingInner}
            fill="none"
            stroke={COLORS.gridLineLight}
            strokeWidth={1.5}
          />
        </>
      )}

      {/* Inner circle boundary */}
      <circle
        cx={cx}
        cy={cy}
        r={innerCircle}
        fill="none"
        stroke={COLORS.textMuted}
        strokeWidth={1}
      />

      {/* Extended house cusp lines - faint radial lines through chart */}
      {showHouses && extendedCuspsA.map((cusp) => {
        const isAngular = cusp.house === 1 || cusp.house === 4 || cusp.house === 7 || cusp.house === 10;
        return (
          <line
            key={`extended-A-${cusp.house}`}
            x1={cusp.innerPoint.x}
            y1={cusp.innerPoint.y}
            x2={cusp.outerPoint.x}
            y2={cusp.outerPoint.y}
            stroke={colorA}
            strokeWidth={isAngular ? 2 : 1}
            strokeOpacity={isAngular ? 0.6 : 0.4}
            strokeDasharray={isAngular ? 'none' : '4,4'}
            style={houseTransitionStyle}
          />
        );
      })}
      {showHouses && extendedCuspsB.map((cusp) => {
        const isAngular = cusp.house === 1 || cusp.house === 4 || cusp.house === 7 || cusp.house === 10;
        return (
          <line
            key={`extended-B-${cusp.house}`}
            x1={cusp.innerPoint.x}
            y1={cusp.innerPoint.y}
            x2={cusp.outerPoint.x}
            y2={cusp.outerPoint.y}
            stroke={colorB}
            strokeWidth={isAngular ? 2 : 1}
            strokeOpacity={isAngular ? 0.6 : 0.4}
            strokeDasharray={isAngular ? 'none' : '4,4'}
            style={houseTransitionStyle}
          />
        );
      })}

      {/* Center circle */}
      <circle
        cx={cx}
        cy={cy}
        r={20}
        fill={COLORS.background}
        stroke={COLORS.gridLineLight}
        strokeWidth={1}
      />


      {/* Divider ring between Person A and Person B — hidden in single-wheel mode */}
      {tickBToA && !hideOuterHouseRing && (
        <circle
          cx={cx}
          cy={cy}
          r={tickBToA}
          fill="none"
          stroke={COLORS.gridLineFaint}
          strokeWidth={1}
          strokeOpacity={0.5}
        />
      )}


      {/* B's house cusp lines and numbers (inner ring) */}
      {innerHouseCusps.map((cusp, index) => {
        const isAngular = cusp.house === 1 || cusp.house === 4 || cusp.house === 7 || cusp.house === 10;

        return (
          <g key={`B-house-${cusp.house}`}>
            {/* Cusp divider line — only when showHouses is on */}
            {showHouses && (
              <line
                x1={cusp.innerPoint.x}
                y1={cusp.innerPoint.y}
                x2={cusp.outerPoint.x}
                y2={cusp.outerPoint.y}
                stroke={colorB}
                strokeWidth={isAngular ? 2.5 : 1.5}
                strokeOpacity={1}
                style={houseTransitionStyle}
              />
            )}
            {/* House number with hover area — always visible */}
            {cusp.houseNumberPos && (
              <g
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => onHouseHover?.({ house: cusp.house, cusp: cusp.cusp, chart: 'B', name: nameB }, e)}
                onMouseMove={(e) => onHouseHover?.({ house: cusp.house, cusp: cusp.cusp, chart: 'B', name: nameB }, e)}
                onMouseLeave={() => onHouseHover?.(null)}
              >
                {/* Invisible hover circle behind number */}
                <circle
                  cx={cusp.houseNumberPos.x}
                  cy={cusp.houseNumberPos.y}
                  r={12}
                  fill="rgba(0,0,0,0)"
                  style={{ pointerEvents: 'all', ...houseTextTransitionStyle }}
                />
                <text
                  x={cusp.houseNumberPos.x}
                  y={cusp.houseNumberPos.y}
                  fill={colorB}
                  fontSize={22}
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', pointerEvents: 'none', ...houseTextTransitionStyle }}
                >
                  {cusp.house}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Outer house ring borders (A's houses - outside zodiac) - hidden in single-wheel */}
      {/* NOTE: No fill here - zodiac and planets draw on top */}
      {!hideOuterHouseRing && outerHouseRingOuter && outerHouseRingInner && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={outerHouseRingOuter}
            fill="none"
            stroke={COLORS.gridLineLight}
            strokeWidth={1.5}
          />
          <circle
            cx={cx}
            cy={cy}
            r={outerHouseRingInner}
            fill="none"
            stroke={COLORS.gridLineLight}
            strokeWidth={1}
          />
        </>
      )}

      {/* A's house cusp lines and numbers (outer ring) - hidden in single-wheel mode */}
      {!hideOuterHouseRing && outerHouseCusps.map((cusp, index) => {
        const isAngular = cusp.house === 1 || cusp.house === 4 || cusp.house === 7 || cusp.house === 10;

        return (
          <g key={`A-house-${cusp.house}`}>
            {/* Cusp divider line — only when showHouses is on */}
            {showHouses && (
              <line
                x1={cusp.innerPoint.x}
                y1={cusp.innerPoint.y}
                x2={cusp.outerPoint.x}
                y2={cusp.outerPoint.y}
                stroke={colorA}
                strokeWidth={isAngular ? 2 : 1}
                strokeOpacity={isAngular ? 0.8 : 0.5}
                style={houseTransitionStyle}
              />
            )}
            {/* House number with hover area — always visible */}
            {cusp.houseNumberPos && (
              <g
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => onHouseHover?.({ house: cusp.house, cusp: cusp.cusp, chart: 'A', name: nameA }, e)}
                onMouseMove={(e) => onHouseHover?.({ house: cusp.house, cusp: cusp.cusp, chart: 'A', name: nameA }, e)}
                onMouseLeave={() => onHouseHover?.(null)}
              >
                {/* Invisible hover circle behind number */}
                <circle
                  cx={cusp.houseNumberPos.x}
                  cy={cusp.houseNumberPos.y}
                  r={12}
                  fill="rgba(0,0,0,0)"
                  style={{ pointerEvents: 'all', ...houseTextTransitionStyle }}
                />
                <text
                  x={cusp.houseNumberPos.x}
                  y={cusp.houseNumberPos.y}
                  fill={colorA}
                  fontSize={18}
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', pointerEvents: 'none', ...houseTextTransitionStyle }}
                >
                  {cusp.house}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Angle labels for A — perimeter in single-wheel, outer house ring in synastry */}
      {chart.angles && (
        <>
          {([
            { label: 'AC', key: 'ascendant', angle: chart.angles!.ascendant },
            { label: 'DC', key: 'descendant', angle: chart.angles!.ascendant + 180 },
            { label: 'MC', key: 'midheaven', angle: chart.angles!.midheaven },
            { label: 'IC', key: 'ic', angle: chart.angles!.midheaven + 180 },
          ] as const).map(({ label, key, angle }) => {
            // Skip if visiblePlanets is provided and this angle isn't enabled
            if (visiblePlanets && !visiblePlanets.has(key)) return null;
            // Single-wheel: place just inside the zodiac ring edge
            // Synastry: place inside the outer house ring
            const radius = hideOuterHouseRing
              ? (outerHouseRingOuter! - 15)    // single-wheel: just inside the zodiac edge
              : outerHouseRingInner! - 15;     // synastry: inside the outer house ring
            const fontSize = hideOuterHouseRing ? 14 : 10;
            const pos = longitudeToXY(angle, cx, cy, radius, rotationOffset);
            return (
              <text
                key={`A-${label}`}
                x={pos.x}
                y={pos.y}
                fill={COLORS.textSecondary}
                fontSize={fontSize}
                fontWeight="bold"
                fontFamily="'Inter', Arial, sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ userSelect: 'none', pointerEvents: 'none', ...houseTextTransitionStyle }}
              >
                {label}
              </text>
            );
          })}
        </>
      )}

      {/* Angle labels for B (inner) — synastry only */}
      {!hideOuterHouseRing && chartB?.angles && houseRingOuter && (
        <>
          {([
            { label: 'AC', key: 'ascendant', angle: chartB.angles!.ascendant },
            { label: 'DC', key: 'descendant', angle: chartB.angles!.ascendant + 180 },
            { label: 'MC', key: 'midheaven', angle: chartB.angles!.midheaven },
            { label: 'IC', key: 'ic', angle: chartB.angles!.midheaven + 180 },
          ] as const).map(({ label, key, angle }) => {
            if (visiblePlanets && !visiblePlanets.has(key)) return null;
            const pos = longitudeToXY(angle, cx, cy, houseRingOuter + 15, rotationOffset);
            return (
              <text
                key={`B-${label}`}
                x={pos.x}
                y={pos.y}
                fill={colorB}
                fontSize={9}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                style={houseTextTransitionStyle}
              >
                {label}
              </text>
            );
          })}
        </>
      )}
    </g>
  );
};

export default HouseOverlay;
