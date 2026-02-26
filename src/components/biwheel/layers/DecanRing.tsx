/**
 * Decan Ring Layer
 * Renders the 36 decans (3 per sign) as a ring between the zodiac and outer house ring
 * Uses the triplicity system where each decan is ruled by a sign of the same element
 */

import React from 'react';
import { ZODIAC_SIGNS, COLORS, getElementColor, getElementBgLightColor } from '../utils/constants';
import { createSegmentPath, longitudeToXY } from '../utils/chartMath';
import type { ChartDimensions } from '../types';

interface DecanRingProps {
  dimensions: ChartDimensions;
  rotationOffset?: number;
}

// Decan rulers using the triplicity (Chaldean) system
// Fire signs cycle: Aries -> Leo -> Sagittarius
// Earth signs cycle: Taurus -> Virgo -> Capricorn
// Air signs cycle: Gemini -> Libra -> Aquarius
// Water signs cycle: Cancer -> Scorpio -> Pisces
const DECAN_RULERS: Record<string, [string, string, string]> = {
  'Aries': ['Aries', 'Leo', 'Sagittarius'],
  'Taurus': ['Taurus', 'Virgo', 'Capricorn'],
  'Gemini': ['Gemini', 'Libra', 'Aquarius'],
  'Cancer': ['Cancer', 'Scorpio', 'Pisces'],
  'Leo': ['Leo', 'Sagittarius', 'Aries'],
  'Virgo': ['Virgo', 'Capricorn', 'Taurus'],
  'Libra': ['Libra', 'Aquarius', 'Gemini'],
  'Scorpio': ['Scorpio', 'Pisces', 'Cancer'],
  'Sagittarius': ['Sagittarius', 'Aries', 'Leo'],
  'Capricorn': ['Capricorn', 'Taurus', 'Virgo'],
  'Aquarius': ['Aquarius', 'Gemini', 'Libra'],
  'Pisces': ['Pisces', 'Cancer', 'Scorpio'],
};

// Element colors and background colors are now resolved at render time
// via getElementColor() and getElementBgLightColor() so they respond to theme changes.

interface DecanData {
  index: number;
  signName: string;
  decanNumber: number; // 1, 2, or 3
  rulerSign: string;
  rulerElement: string;
  startAngle: number;
  midAngle: number;
  labelPos: { x: number; y: number };
}

/**
 * Generate data for all 36 decans
 */
function generateDecans(dimensions: ChartDimensions, rotationOffset: number = 0): DecanData[] {
  const { cx, cy, decanOuter, decanInner } = dimensions;
  if (!decanOuter || !decanInner) return [];

  const decans: DecanData[] = [];
  const labelRadius = (decanOuter + decanInner) / 2;

  for (let signIndex = 0; signIndex < 12; signIndex++) {
    const sign = ZODIAC_SIGNS[signIndex];
    const rulers = DECAN_RULERS[sign.name];

    for (let decan = 0; decan < 3; decan++) {
      const decanIndex = signIndex * 3 + decan;
      const startAngle = decanIndex * 10;
      const midAngle = startAngle + 5;

      const rulerSign = rulers[decan];
      const rulerZodiac = ZODIAC_SIGNS.find(z => z.name === rulerSign);
      const rulerElement = rulerZodiac?.element || 'fire';

      const labelPos = longitudeToXY(midAngle, cx, cy, labelRadius, rotationOffset);

      decans.push({
        index: decanIndex,
        signName: sign.name,
        decanNumber: decan + 1,
        rulerSign,
        rulerElement,
        startAngle,
        midAngle,
        labelPos,
      });
    }
  }

  return decans;
}

/**
 * Get zodiac symbol for a sign name
 */
function getSignSymbol(signName: string): string {
  const sign = ZODIAC_SIGNS.find(z => z.name === signName);
  return sign?.symbol || '';
}

export const DecanRing: React.FC<DecanRingProps> = ({
  dimensions,
  rotationOffset = 0,
}) => {
  const { cx, cy, decanOuter, decanInner } = dimensions;

  // Don't render if decan dimensions aren't defined
  if (!decanOuter || !decanInner) return null;

  const decans = React.useMemo(
    () => generateDecans(dimensions, rotationOffset),
    [dimensions, rotationOffset]
  );

  return (
    <g className="decan-ring">
      {/* Colored background segments for each decan */}
      {decans.map((decan) => (
        <path
          key={`decan-bg-${decan.index}`}
          d={createSegmentPath(cx, cy, decanInner, decanOuter, decan.startAngle, decan.startAngle + 10, rotationOffset)}
          fill={getElementBgLightColor(decan.rulerElement)}
          stroke="none"
        />
      ))}

      {/* Outer border circle */}
      <circle
        cx={cx}
        cy={cy}
        r={decanOuter}
        fill="none"
        stroke={COLORS.gridLine}
        strokeWidth={1}
        strokeOpacity={0.5}
      />

      {/* Inner border circle */}
      <circle
        cx={cx}
        cy={cy}
        r={decanInner}
        fill="none"
        stroke={COLORS.gridLine}
        strokeWidth={1}
        strokeOpacity={0.5}
      />

      {/* Decan divider lines and symbols */}
      {decans.map((decan) => {
        const dividerStart = longitudeToXY(decan.startAngle, cx, cy, decanInner, rotationOffset);
        const dividerEnd = longitudeToXY(decan.startAngle, cx, cy, decanOuter, rotationOffset);
        const isSignBoundary = decan.decanNumber === 1;

        return (
          <g key={`decan-${decan.index}`}>
            {/* Divider line */}
            <line
              x1={dividerStart.x}
              y1={dividerStart.y}
              x2={dividerEnd.x}
              y2={dividerEnd.y}
              stroke={COLORS.gridLine}
              strokeWidth={isSignBoundary ? 1.5 : 0.5}
              strokeOpacity={isSignBoundary ? 0.6 : 0.3}
            />

            {/* Decan ruler symbol */}
            <text
              x={decan.labelPos.x}
              y={decan.labelPos.y}
              fill={getElementColor(decan.rulerElement)}
              fontSize={32}
              fontFamily="'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
              style={{ userSelect: 'none' }}
            >
              <title>{`Decan ${decan.decanNumber} of ${decan.signName}: ruled by ${decan.rulerSign}`}</title>
              {getSignSymbol(decan.rulerSign)}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export default DecanRing;
