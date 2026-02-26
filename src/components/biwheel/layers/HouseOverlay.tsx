/**
 * House Overlay Layer
 * Renders house rings and structural elements
 * Layout: Inner circle → B's houses → planets → zodiac → A's houses (outer)
 */

import React from 'react';
import { COLORS, getThemeAwarePersonColor } from '../utils/constants';
import { longitudeToXY } from '../utils/chartMath';
import type { ChartDimensions, NatalChart, HouseCusp } from '../types';

// House hover data for tooltips
export interface HouseHoverData {
  house: number;
  cusp: number;
  chart: 'A' | 'B';
  name: string; // Person's name
}

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
}

/**
 * Generate house cusp data from chart using Whole Sign houses
 * In Whole Sign, each house is exactly 30° starting from 0° of the Ascendant's sign
 * When zodiacVantage is set, uses that sign for the 1st house instead
 */
function generateHouseCusps(
  chart: NatalChart,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  rotationOffset: number = 0,
  zodiacVantage: number | null = null
): HouseCusp[] {
  const cusps: HouseCusp[] = [];

  // If zodiacVantage is set, use that sign for the 1st house
  if (zodiacVantage !== null) {
    const house1Cusp = zodiacVantage * 30; // 0° of the selected sign

    for (let i = 1; i <= 12; i++) {
      const cusp = (house1Cusp + (i - 1) * 30) % 360;

      const innerPoint = longitudeToXY(cusp, cx, cy, innerRadius, rotationOffset);
      const outerPoint = longitudeToXY(cusp, cx, cy, outerRadius, rotationOffset);

      const labelRadius = (outerRadius + innerRadius) / 2;
      const midAngle = (cusp + 15) % 360;
      const houseNumberPos = longitudeToXY(midAngle, cx, cy, labelRadius, rotationOffset);

      cusps.push({
        house: i,
        cusp,
        innerPoint,
        outerPoint,
        labelPos: houseNumberPos,
        houseNumberPos,
        midAngle,
      });
    }

    return cusps;
  }

  // Get Ascendant longitude to determine the first house sign
  let ascendant: number | undefined;

  if (chart.angles?.ascendant !== undefined) {
    ascendant = chart.angles.ascendant;
  } else if (chart.houses) {
    // Try to get from houses data
    const houses = chart.houses;
    if (Array.isArray(houses) && houses.length > 0) {
      const val = houses[0];
      if (typeof val === 'number') ascendant = val;
      else if (val && typeof val === 'object') {
        ascendant = val.cusp ?? val.longitude ?? val.degree;
      }
    } else if (typeof houses === 'object') {
      const h = houses as Record<string, any>;
      const val = h['1'] ?? h['house_1'] ?? h['House 1'] ?? h['cusp_1'] ?? h['h1'];
      if (typeof val === 'number') ascendant = val;
      else if (val && typeof val === 'object') {
        ascendant = val.cusp ?? val.longitude ?? val.degree;
      }
    }
  }

  if (ascendant === undefined) return cusps;

  // Whole Sign: House 1 starts at 0° of the Ascendant's sign
  // Calculate which sign the Ascendant is in (0-11) and get 0° of that sign
  const ascSign = Math.floor(ascendant / 30);
  const house1Cusp = ascSign * 30; // 0° of the Ascendant's sign

  for (let i = 1; i <= 12; i++) {
    // Each house is exactly 30° in Whole Sign
    const cusp = (house1Cusp + (i - 1) * 30) % 360;
    const nextCusp = (cusp + 30) % 360;

    const innerPoint = longitudeToXY(cusp, cx, cy, innerRadius, rotationOffset);
    const outerPoint = longitudeToXY(cusp, cx, cy, outerRadius, rotationOffset);

    // Label position in middle of house ring
    const labelRadius = (outerRadius + innerRadius) / 2;

    // House number position - in the middle of the house section (15° from cusp)
    const midAngle = (cusp + 15) % 360;
    const houseNumberPos = longitudeToXY(midAngle, cx, cy, labelRadius, rotationOffset);

    cusps.push({
      house: i,
      cusp,
      innerPoint,
      outerPoint,
      labelPos: houseNumberPos,
      houseNumberPos,
      midAngle,
    });
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
}) => {
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
      ? generateHouseCusps(chartB, cx, cy, houseRingInner, houseRingOuter, rotationOffset, zodiacVantage)
      : [],
    [chartB, cx, cy, houseRingOuter, houseRingInner, rotationOffset, zodiacVantage]
  );

  // A's house cusps (outer ring - outside zodiac)
  const outerHouseCusps = React.useMemo(
    () => chart && outerHouseRingOuter && outerHouseRingInner
      ? generateHouseCusps(chart, cx, cy, outerHouseRingInner, outerHouseRingOuter, rotationOffset, zodiacVantage)
      : [],
    [chart, cx, cy, outerHouseRingOuter, outerHouseRingInner, rotationOffset, zodiacVantage]
  );

  // Extended house cusp lines (faint lines through chart)
  // A's cusps extend from zodiac inward to the midpoint (tickBToA)
  const extendedCuspsA = React.useMemo(
    () => chart?.houses && tickBToA
      ? generateHouseCusps(chart, cx, cy, tickBToA, zodiacInner, rotationOffset, zodiacVantage)
      : [],
    [chart, cx, cy, tickBToA, zodiacInner, rotationOffset, zodiacVantage]
  );

  // B's cusps extend from inner house ring outward to the midpoint (tickBToA)
  const extendedCuspsB = React.useMemo(
    () => chartB?.houses && tickBToA && houseRingOuter
      ? generateHouseCusps(chartB, cx, cy, houseRingOuter, tickBToA, rotationOffset, zodiacVantage)
      : [],
    [chartB, cx, cy, houseRingOuter, tickBToA, rotationOffset, zodiacVantage]
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
                  style={{ pointerEvents: 'all' }}
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
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
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
                  style={{ pointerEvents: 'all' }}
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
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {cusp.house}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Angle labels for A (outer) - hidden in single-wheel mode */}
      {!hideOuterHouseRing && chart.angles && outerHouseRingInner && (
        <>
          {['AC', 'DC', 'MC', 'IC'].map((label) => {
            const angle = label === 'AC' ? chart.angles!.ascendant :
                          label === 'DC' ? chart.angles!.ascendant + 180 :
                          label === 'MC' ? chart.angles!.midheaven :
                          chart.angles!.midheaven + 180;
            const pos = longitudeToXY(angle, cx, cy, outerHouseRingInner - 15, rotationOffset);
            return (
              <text
                key={`A-${label}`}
                x={pos.x}
                y={pos.y}
                fill={colorA}
                fontSize={10}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {label}
              </text>
            );
          })}
        </>
      )}

      {/* Angle labels for B (inner) */}
      {chartB?.angles && houseRingOuter && (
        <>
          {['AC', 'DC', 'MC', 'IC'].map((label) => {
            const angle = label === 'AC' ? chartB.angles!.ascendant :
                          label === 'DC' ? chartB.angles!.ascendant + 180 :
                          label === 'MC' ? chartB.angles!.midheaven :
                          chartB.angles!.midheaven + 180;
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
