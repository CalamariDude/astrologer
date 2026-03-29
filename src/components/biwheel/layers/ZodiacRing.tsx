/**
 * Zodiac Ring Layer
 * Renders the outer zodiac wheel with 12 sign segments and symbols
 */

import React from 'react';
import { ZODIAC_SIGNS, COLORS, getElementColor, getElementBgColor } from '../utils/constants';
import { longitudeToXY, createSegmentPath } from '../utils/chartMath';
import type { ChartDimensions, ChartMode } from '../types';

// Full sign data for tooltips
export interface SignData {
  name: string;
  symbol: string;
  element: string;
  modality: string;
  ruler: string;
  dates: string;
}

// Additional sign metadata
const SIGN_METADATA: Record<string, { modality: string; ruler: string; dates: string }> = {
  Aries: { modality: 'cardinal', ruler: 'Mars', dates: 'Mar 21 - Apr 19' },
  Taurus: { modality: 'fixed', ruler: 'Venus', dates: 'Apr 20 - May 20' },
  Gemini: { modality: 'mutable', ruler: 'Mercury', dates: 'May 21 - Jun 20' },
  Cancer: { modality: 'cardinal', ruler: 'Moon', dates: 'Jun 21 - Jul 22' },
  Leo: { modality: 'fixed', ruler: 'Sun', dates: 'Jul 23 - Aug 22' },
  Virgo: { modality: 'mutable', ruler: 'Mercury', dates: 'Aug 23 - Sep 22' },
  Libra: { modality: 'cardinal', ruler: 'Venus', dates: 'Sep 23 - Oct 22' },
  Scorpio: { modality: 'fixed', ruler: 'Pluto', dates: 'Oct 23 - Nov 21' },
  Sagittarius: { modality: 'mutable', ruler: 'Jupiter', dates: 'Nov 22 - Dec 21' },
  Capricorn: { modality: 'cardinal', ruler: 'Saturn', dates: 'Dec 22 - Jan 19' },
  Aquarius: { modality: 'fixed', ruler: 'Uranus', dates: 'Jan 20 - Feb 18' },
  Pisces: { modality: 'mutable', ruler: 'Neptune', dates: 'Feb 19 - Mar 20' },
};

interface ZodiacRingProps {
  dimensions: ChartDimensions;
  mode?: ChartMode;
  onSignHover?: (sign: SignData | null, event?: React.MouseEvent) => void;
  onSignClick?: (sign: SignData, event?: React.MouseEvent) => void;
  rotationOffset?: number;
  showDegreeMarkers?: boolean;
}

// Element colors and background colors are now resolved at render time
// via getElementColor() and getElementBgColor() so they respond to theme changes.

interface ZodiacSign {
  index: number;
  name: string;
  symbol: string;
  element: string;
  startAngle: number;
  midAngle: number;
  labelPos: { x: number; y: number };
  dividerStart: { x: number; y: number };
  dividerEnd: { x: number; y: number };
}

/**
 * Generate zodiac sign data with simple radial dividers
 */
function generateSigns(dimensions: ChartDimensions, rotationOffset: number = 0): ZodiacSign[] {
  const { cx, cy, zodiacOuter, zodiacInner } = dimensions;

  return ZODIAC_SIGNS.map((sign, index) => {
    const startAngle = index * 30;
    const midAngle = startAngle + 15;

    // Label position (middle of segment)
    const labelRadius = (zodiacOuter + zodiacInner) / 2;
    const labelPos = longitudeToXY(midAngle, cx, cy, labelRadius, rotationOffset);

    // Divider line at start of each sign
    const dividerStart = longitudeToXY(startAngle, cx, cy, zodiacInner, rotationOffset);
    const dividerEnd = longitudeToXY(startAngle, cx, cy, zodiacOuter, rotationOffset);

    return {
      index,
      name: sign.name,
      symbol: sign.symbol,
      element: sign.element,
      startAngle,
      midAngle,
      labelPos,
      dividerStart,
      dividerEnd,
    };
  });
}

/**
 * Generate degree tick marks around the zodiac
 */
interface DegreeMark {
  angle: number;
  inner: { x: number; y: number };
  outer: { x: number; y: number };
  isMajor: boolean;
  is5deg: boolean;
  label?: string;
}

function generateDegreeMarks(dimensions: ChartDimensions, rotationOffset: number = 0, mode: ChartMode = 'synastry'): DegreeMark[] {
  const { cx, cy, zodiacOuter, zodiacInner, decanInner, tickBToA } = dimensions;
  const marks: DegreeMark[] = [];

  // Inner ticks: synastry → A/B separator, single-wheel → decan inner edge
  const innerBase = (mode === 'synastry' && tickBToA) ? tickBToA : (decanInner || zodiacInner);
  // Outer ticks: always on decan inner edge (facing inward toward planets)
  const outerBase = decanInner || zodiacInner;

  for (let deg = 0; deg < 360; deg++) {
    const isMajor = deg % 30 === 0; // Sign boundary
    const is5deg = deg % 5 === 0;
    const is10deg = deg % 10 === 0;

    let tickLength = 3;
    if (is5deg) tickLength = 6;
    if (is10deg) tickLength = 8;
    if (isMajor) tickLength = 0; // Sign boundaries handled by segment lines

    if (tickLength > 0) {
      // Inner ticks (facing inward from inner base)
      marks.push({
        angle: deg,
        inner: longitudeToXY(deg, cx, cy, innerBase - tickLength, rotationOffset),
        outer: longitudeToXY(deg, cx, cy, innerBase, rotationOffset),
        isMajor,
        is5deg,
        label: is10deg && !isMajor ? `${deg % 30}°` : undefined,
      });

      // Outer ticks (facing inward from decan inner edge) — skip if same radius as inner
      if (Math.abs(outerBase - innerBase) > 1) {
        marks.push({
          angle: deg,
          inner: longitudeToXY(deg, cx, cy, outerBase - tickLength, rotationOffset),
          outer: longitudeToXY(deg, cx, cy, outerBase, rotationOffset),
          isMajor,
          is5deg,
        });
      }
    }
  }

  return marks;
}

export const ZodiacRing: React.FC<ZodiacRingProps> = ({ dimensions, mode = 'synastry', onSignHover, onSignClick, rotationOffset = 0, showDegreeMarkers = false }) => {
  const signs = React.useMemo(() => generateSigns(dimensions, rotationOffset), [dimensions, rotationOffset]);
  const degreeMarks = React.useMemo(() => showDegreeMarkers ? generateDegreeMarks(dimensions, rotationOffset, mode) : [], [dimensions, rotationOffset, showDegreeMarkers, mode]);
  const { cx, cy, zodiacOuter, zodiacInner } = dimensions;

  // Track which sign is being hovered for name display
  const [hoveredSignIndex, setHoveredSignIndex] = React.useState<number | null>(null);

  // Create full sign data for hover
  const getSignData = (sign: ZodiacSign): SignData => {
    const meta = SIGN_METADATA[sign.name];
    return {
      name: sign.name,
      symbol: sign.symbol,
      element: sign.element,
      modality: meta?.modality || '',
      ruler: meta?.ruler || '',
      dates: meta?.dates || '',
    };
  };

  // Handle sign hover with both tooltip and name display
  const handleSignEnter = (sign: ZodiacSign, e: React.MouseEvent) => {
    setHoveredSignIndex(sign.index);
    onSignHover?.(getSignData(sign), e);
  };

  const handleSignMove = (sign: ZodiacSign, e: React.MouseEvent) => {
    onSignHover?.(getSignData(sign), e);
  };

  const handleSignLeave = () => {
    setHoveredSignIndex(null);
    onSignHover?.(null);
  };

  const handleSignClick = (sign: ZodiacSign, e: React.MouseEvent) => {
    e.stopPropagation();
    onSignClick?.(getSignData(sign), e);
  };

  return (
    <g className="zodiac-ring">
      {/* Colored background segments for each sign */}
      {signs.map((sign) => (
        <path
          key={`bg-${sign.index}`}
          d={createSegmentPath(cx, cy, zodiacInner, zodiacOuter, sign.startAngle, sign.startAngle + 30, rotationOffset)}
          fill={getElementBgColor(sign.element)}
          stroke="none"
        />
      ))}

      {/* Outer border circle */}
      <circle
        cx={cx}
        cy={cy}
        r={zodiacOuter}
        fill="none"
        stroke={COLORS.gridLine}
        strokeWidth={2}
      />

      {/* Inner border circle */}
      <circle
        cx={cx}
        cy={cy}
        r={zodiacInner}
        fill="none"
        stroke={COLORS.gridLine}
        strokeWidth={2}
      />

      {/* Zodiac sign dividers and symbols */}
      {signs.map((sign) => {
        const isHovered = hoveredSignIndex === sign.index;

        return (
          <g key={sign.index} className="zodiac-sign">
            {/* Radial divider line at start of sign */}
            <line
              x1={sign.dividerStart.x}
              y1={sign.dividerStart.y}
              x2={sign.dividerEnd.x}
              y2={sign.dividerEnd.y}
              stroke={COLORS.gridLine}
              strokeWidth={1.5}
              style={{ pointerEvents: 'none' }}
            />

            {/* Zodiac symbol with hover area */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handleSignEnter(sign, e)}
              onMouseMove={(e) => handleSignMove(sign, e)}
              onMouseLeave={handleSignLeave}
              onClick={(e) => handleSignClick(sign, e)}
            >
              {/* Invisible hover circle around symbol */}
              <circle
                cx={sign.labelPos.x}
                cy={sign.labelPos.y}
                r={18}
                fill="rgba(0,0,0,0)"
                style={{ pointerEvents: 'all' }}
              />
              <text
                x={sign.labelPos.x}
                y={isHovered ? sign.labelPos.y - 8 : sign.labelPos.y}
                fill={getElementColor(sign.element)}
                fontSize={isHovered ? 42 : 40}
                fontWeight="bold"
                fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ userSelect: 'none', pointerEvents: 'none', transition: 'all 0.15s ease-out' }}
              >
                {sign.symbol}
              </text>
            </g>

            {/* Sign name - shown on hover */}
            {isHovered && (
              <text
                x={sign.labelPos.x}
                y={sign.labelPos.y + 12}
                fill={getElementColor(sign.element)}
                fontSize={12}
                fontWeight="600"
                fontFamily="Arial, sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {sign.name}
              </text>
            )}
          </g>
        );
      })}

      {/* Degree tick marks - like a clock */}
      {degreeMarks.map((mark, i) => (
        <line
          key={i}
          x1={mark.inner.x}
          y1={mark.inner.y}
          x2={mark.outer.x}
          y2={mark.outer.y}
          stroke={COLORS.gridLine}
          strokeWidth={mark.is5deg ? 1 : 0.5}
        />
      ))}
    </g>
  );
};

export default ZodiacRing;
