/**
 * Aspect Grid Layer
 * Renders aspect lines in one of three styles:
 * - modern: Curved bezier lines, individual colors, flow particles, symbol badges, glows
 * - classic: Straight lines, red/blue/green/black by nature, dashed minor (astro.com style)
 * - clean: Straight lines, individual colors, no badges or flow effects
 */

import React from 'react';
import { COLORS } from '../utils/constants';
import { longitudeToXY } from '../utils/chartMath';
import {
  getAspectOpacity,
  getAspectStrokeWidth,
  isAspectDashed,
  type SynastryAspect,
  type AspectType,
} from '../utils/aspectCalculations';
import type { ChartDimensions, AspectLine, PlanetDisplayPositions, ChartMode, AspectLineStyle } from '../types';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 500;

interface AspectGridProps {
  dimensions: ChartDimensions;
  aspects: SynastryAspect[];
  visibleAspects: Set<AspectType>;
  mode: ChartMode;
  hoveredPlanet: { planet: string; chart: 'A' | 'B' | 'Transit' | 'Composite' } | null;
  selectedPlanet: { planet: string; chart: 'A' | 'B' | 'Transit' | 'Composite' } | null;
  hoveredAspect: SynastryAspect | null;
  selectedAspect: SynastryAspect | null;
  onAspectClick?: (aspect: SynastryAspect, event?: React.MouseEvent) => void;
  onAspectHover?: (aspect: SynastryAspect | null, event?: React.MouseEvent) => void;
  displayPositionsA?: PlanetDisplayPositions;
  displayPositionsB?: PlanetDisplayPositions;
  displayPositions?: PlanetDisplayPositions;
  rotationOffset?: number;
  declinationsA?: Record<string, number>;
  declinationsB?: Record<string, number>;
  /** @deprecated Use lineStyle instead */
  straightLines?: boolean;
  /** Aspect line rendering style */
  lineStyle?: AspectLineStyle;
  /** Show animated flow particles (modern style only) */
  showEffects?: boolean;
  /** Animate aspect lines smoothly during birth-time shift */
  smoothTransitions?: boolean;
}

function isSameAspect(a: SynastryAspect | null, b: SynastryAspect): boolean {
  if (!a) return false;
  return a.planetA === b.planetA && a.planetB === b.planetB && a.aspect.type === b.aspect.type;
}

function getFlowType(nature: 'harmonious' | 'challenging' | 'neutral'): 'bidirectional' | 'one-way' {
  return nature === 'challenging' ? 'one-way' : 'bidirectional';
}

function getCurveControl(
  start: { x: number; y: number },
  end: { x: number; y: number },
  cx: number,
  cy: number,
  strength: number
): { x: number; y: number } {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const pull = 0.25 + (1 - strength) * 0.25;
  return {
    x: midX + (cx - midX) * pull,
    y: midY + (cy - midY) * pull,
  };
}

function bezierPoint(
  start: { x: number; y: number },
  ctrl: { x: number; y: number },
  end: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * start.x + 2 * mt * t * ctrl.x + t * t * end.x,
    y: mt * mt * start.y + 2 * mt * t * ctrl.y + t * t * end.y,
  };
}

function getDeclinationAspect(
  planetA: string,
  planetB: string,
  declinationsA?: Record<string, number>,
  declinationsB?: Record<string, number>
): 'parallel' | 'contraparallel' | null {
  const decA = declinationsA?.[planetA];
  const decB = declinationsB?.[planetB];
  if (decA === undefined || decB === undefined) return null;
  const diff = Math.abs(decA - decB);
  const sum = Math.abs(decA + decB);
  if (diff <= 1.2) return 'parallel';
  if (sum <= 1.2) return 'contraparallel';
  return null;
}

/**
 * Classic (astro.com) color mapping — color by aspect nature, not individual aspect
 */
const CLASSIC_COLORS: Record<string, string> = {
  // Hard/challenging → red
  opposition: '#dc2626',
  square: '#dc2626',
  // Soft/harmonious → blue
  trine: '#2563eb',
  sextile: '#2563eb',
  // Minor → green (dashed)
  quincunx: '#16a34a',
  semisextile: '#16a34a',
  semisquare: '#d97706',
  sesquisquare: '#d97706',
  quintile: '#16a34a',
  biquintile: '#16a34a',
  // Conjunction → black/white (adapts to theme)
  conjunction: '#000000',
};

function getClassicColor(aspectType: string): string {
  return CLASSIC_COLORS[aspectType] || '#666666';
}

/** Classic style: major aspects solid, minor aspects dashed */
function isClassicDashed(aspectType: string): boolean {
  const major = new Set(['conjunction', 'opposition', 'trine', 'square', 'sextile']);
  return !major.has(aspectType);
}

/** Classic style: dotted for quincunx specifically */
function getClassicDashArray(aspectType: string, strokeWidth: number): string | undefined {
  if (aspectType === 'quincunx' || aspectType === 'semisextile') {
    return `${strokeWidth * 3},${strokeWidth * 2}`;
  }
  if (isClassicDashed(aspectType)) {
    return `${strokeWidth * 1.5},${strokeWidth * 1.5}`;
  }
  return undefined;
}

function generateAspectLines(
  aspects: SynastryAspect[],
  visibleAspects: Set<AspectType>,
  dimensions: ChartDimensions,
  mode: ChartMode,
  hoveredPlanet: { planet: string; chart: 'A' | 'B' | 'Transit' | 'Composite' } | null,
  selectedPlanet: { planet: string; chart: 'A' | 'B' | 'Transit' | 'Composite' } | null,
  hoveredAspect: SynastryAspect | null,
  selectedAspect: SynastryAspect | null,
  displayPositionsA?: PlanetDisplayPositions,
  displayPositionsB?: PlanetDisplayPositions,
  displayPositions?: PlanetDisplayPositions,
  rotationOffset: number = 0
): AspectLine[] {
  const { cx, cy, innerCircle } = dimensions;
  const lines: AspectLine[] = [];
  const isSingleWheel = mode !== 'synastry';

  for (const asp of aspects) {
    if (!visibleAspects.has(asp.aspect.type)) continue;
    if (selectedAspect && !isSameAspect(selectedAspect, asp)) continue;

    let displayLongA: number;
    let displayLongB: number;

    if (isSingleWheel) {
      displayLongA = displayPositions?.get(asp.planetA) ?? asp.longA;
      displayLongB = displayPositions?.get(asp.planetB) ?? asp.longB;
    } else {
      displayLongA = displayPositionsA?.get(asp.planetA) ?? asp.longA;
      displayLongB = displayPositionsB?.get(asp.planetB) ?? asp.longB;
    }

    const startPoint = longitudeToXY(displayLongA, cx, cy, innerCircle, rotationOffset);
    const endPoint = longitudeToXY(displayLongB, cx, cy, innerCircle, rotationOffset);

    const isSelected = isSameAspect(selectedAspect, asp);
    const isHovered = isSameAspect(hoveredAspect, asp);

    let isPlanetHovered = false;
    let isPlanetSelected = false;

    if (isSingleWheel) {
      const chartKey = mode === 'composite' ? 'Composite' : mode === 'personA' ? 'A' : 'B';
      isPlanetHovered = hoveredPlanet?.chart === chartKey &&
        (hoveredPlanet.planet === asp.planetA || hoveredPlanet.planet === asp.planetB);
      isPlanetSelected = selectedPlanet?.chart === chartKey &&
        (selectedPlanet.planet === asp.planetA || selectedPlanet.planet === asp.planetB);
    } else {
      isPlanetHovered = hoveredPlanet !== null &&
        ((hoveredPlanet.chart === 'A' && hoveredPlanet.planet === asp.planetA) ||
          (hoveredPlanet.chart === 'B' && hoveredPlanet.planet === asp.planetB));
      isPlanetSelected = selectedPlanet !== null &&
        ((selectedPlanet.chart === 'A' && selectedPlanet.planet === asp.planetA) ||
          (selectedPlanet.chart === 'B' && selectedPlanet.planet === asp.planetB));
    }

    const isHighlighted = isSelected || isHovered || isPlanetHovered || isPlanetSelected;
    const hasPlanetActive = hoveredPlanet || selectedPlanet;

    const baseOpacity = getAspectOpacity(asp.aspect.strength);
    const opacity = isHighlighted ? 1 : hasPlanetActive ? baseOpacity * 0.12 : baseOpacity;
    const strokeWidth = isHighlighted
      ? getAspectStrokeWidth(asp.aspect.strength) + 1.5
      : getAspectStrokeWidth(asp.aspect.strength);

    lines.push({
      aspect: asp,
      startPoint,
      endPoint,
      color: asp.aspect.color,
      opacity,
      strokeWidth,
      dashed: isAspectDashed(asp.aspect.nature),
    });
  }

  return lines.sort((a, b) => a.opacity - b.opacity);
}

// Unique ID counter for SVG defs
let defsIdCounter = 0;

export const AspectGrid: React.FC<AspectGridProps> = ({
  dimensions,
  aspects,
  visibleAspects,
  mode,
  hoveredPlanet,
  selectedPlanet,
  hoveredAspect,
  selectedAspect,
  onAspectClick,
  onAspectHover,
  displayPositionsA,
  displayPositionsB,
  displayPositions,
  rotationOffset = 0,
  declinationsA,
  declinationsB,
  straightLines = false,
  lineStyle: lineStyleProp,
  showEffects = false,
  smoothTransitions = false,
}) => {
  // Resolve effective style: explicit lineStyle > legacy straightLines > default
  const lineStyle: AspectLineStyle = lineStyleProp ?? (straightLines ? 'clean' : 'modern');
  const useStraightLines = lineStyle !== 'modern';
  const isClassic = lineStyle === 'classic';
  const isModern = lineStyle === 'modern';

  const aspectTransitionStyle: React.CSSProperties = smoothTransitions
    ? { transition: 'd 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)' }
    : {};
  const { cx, cy, innerCircle } = dimensions;
  const isSingleWheel = mode !== 'synastry';

  const idPrefix = React.useMemo(() => `ag-${++defsIdCounter}`, []);

  const aspectLines = React.useMemo(
    () => generateAspectLines(aspects, visibleAspects, dimensions, mode, hoveredPlanet, selectedPlanet, hoveredAspect, selectedAspect, displayPositionsA, displayPositionsB, displayPositions, rotationOffset),
    [aspects, visibleAspects, dimensions, mode, hoveredPlanet, selectedPlanet, hoveredAspect, selectedAspect, displayPositionsA, displayPositionsB, displayPositions, rotationOffset]
  );

  // Use theme-aware conjunction color for classic mode
  const classicConjColor = COLORS.background === '#000000' || COLORS.background === '#0a0a0a' ? '#e5e5e5' : '#1a1a1a';

  return (
    <g className="aspect-grid">
      <defs>
        <filter id={`${idPrefix}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${idPrefix}-glow-strong`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {aspectLines.map((line, index) => {
        const aspectType = line.aspect.aspect.type;
        const isConjunction = aspectType === 'conjunction';
        const nature = line.aspect.aspect.nature;
        const strength = line.aspect.aspect.strength;
        const flowType = getFlowType(nature);
        const isHighlighted = line.opacity >= 0.95;

        // Colors: classic mode overrides individual colors with nature-based colors
        const effectiveColor = isClassic
          ? (isConjunction ? classicConjColor : getClassicColor(aspectType))
          : line.color;

        // Curve control point (only for modern)
        const ctrl = getCurveControl(line.startPoint, line.endPoint, cx, cy, strength);
        const apex = useStraightLines
          ? { x: (line.startPoint.x + line.endPoint.x) / 2, y: (line.startPoint.y + line.endPoint.y) / 2 }
          : bezierPoint(line.startPoint, ctrl, line.endPoint, 0.5);
        const pathD = useStraightLines
          ? `M ${line.startPoint.x} ${line.startPoint.y} L ${line.endPoint.x} ${line.endPoint.y}`
          : `M ${line.startPoint.x} ${line.startPoint.y} Q ${ctrl.x} ${ctrl.y} ${line.endPoint.x} ${line.endPoint.y}`;
        const pathId = `${idPrefix}-path-${index}`;

        const decAspect = getDeclinationAspect(
          line.aspect.planetA,
          line.aspect.planetB,
          isSingleWheel ? declinationsA : declinationsA,
          isSingleWheel ? declinationsA : declinationsB
        );

        // Conjunction arc (for modern/clean — classic draws a straight line to center or short line)
        let conjunctionPos = { x: apex.x, y: apex.y };
        let conjArcPath = '';
        if (isConjunction && !isClassic) {
          const arcRadius = innerCircle + 4;
          const arcStart = longitudeToXY(line.aspect.longA, cx, cy, arcRadius, rotationOffset);
          const arcEnd = longitudeToXY(line.aspect.longB, cx, cy, arcRadius, rotationOffset);
          let span = Math.abs(line.aspect.longA - line.aspect.longB);
          if (span > 180) span = 360 - span;
          const largeArc = span > 180 ? 1 : 0;
          const ax = arcStart.x - cx, ay = arcStart.y - cy;
          const bx = arcEnd.x - cx, by = arcEnd.y - cy;
          const cross = ax * by - ay * bx;
          const sweep = cross > 0 ? 0 : 1;
          conjArcPath = `M ${arcStart.x} ${arcStart.y} A ${arcRadius} ${arcRadius} 0 ${largeArc} ${sweep} ${arcEnd.x} ${arcEnd.y}`;
          const midLong = line.aspect.longA + ((((line.aspect.longB - line.aspect.longA) % 360) + 540) % 360 - 180) / 2;
          const midPt = longitudeToXY(midLong, cx, cy, arcRadius, rotationOffset);
          conjunctionPos = midPt;
        }

        // Stroke width: classic uses thicker, more uniform lines
        const effectiveStrokeWidth = isClassic
          ? (isHighlighted ? 2.2 : (nature === 'challenging' || isConjunction ? 1.8 : 1.2))
          : line.strokeWidth;

        // Dash arrays per style
        const dashArray = isClassic
          ? getClassicDashArray(aspectType, effectiveStrokeWidth)
          : (nature === 'challenging' ? `${4 + strength * 3},${2 + (1 - strength) * 3}` : undefined);

        // Animation durations (modern only)
        const flowDuration = 2.5 + (1 - strength) * 3;

        // Opacity: classic dims non-highlighted lines strongly when a planet is selected
        const effectiveOpacity = isClassic
          ? (isHighlighted ? 1 : line.opacity < 0.2 ? line.opacity : 0.85 * line.opacity)
          : line.opacity;

        return (
          <g key={`${line.aspect.planetA}-${line.aspect.planetB}-${aspectType}`}>

            {/* ═══ CONJUNCTION ═══ */}
            {isConjunction && !isClassic && (
              <>
                {/* Yellow arc on inner wheel ring (modern + clean) */}
                <path
                  d={conjArcPath}
                  fill="none"
                  stroke="#d4a017"
                  strokeWidth={10}
                  strokeOpacity={isHighlighted ? 0.5 : 0.25}
                  strokeLinecap="round"
                  filter={`url(#${idPrefix}-glow-strong)`}
                  style={{ pointerEvents: 'none' }}
                />
                <path
                  d={conjArcPath}
                  fill="none"
                  stroke="#d4a017"
                  strokeWidth={6}
                  strokeOpacity={isHighlighted ? 1 : 0.9}
                  strokeLinecap="round"
                  style={{ cursor: onAspectClick ? 'pointer' : 'default', ...aspectTransitionStyle }}
                  onClick={(e) => { e.stopPropagation(); onAspectClick?.(line.aspect, e); }}
                  onMouseEnter={(e) => onAspectHover?.(line.aspect, e)}
                  onMouseLeave={() => onAspectHover?.(null)}
                />
              </>
            )}

            {/* Classic conjunction: straight line like any other aspect */}
            {isConjunction && isClassic && (
              <path
                d={pathD}
                fill="none"
                stroke={effectiveColor}
                strokeWidth={effectiveStrokeWidth}
                strokeOpacity={effectiveOpacity}
                strokeLinecap="round"
                style={{ cursor: onAspectClick ? 'pointer' : 'default', ...aspectTransitionStyle }}
                onClick={(e) => { e.stopPropagation(); onAspectClick?.(line.aspect, e); }}
                onMouseEnter={(e) => onAspectHover?.(line.aspect, e)}
                onMouseLeave={() => onAspectHover?.(null)}
              />
            )}

            {/* ═══ NON-CONJUNCTION ═══ */}
            {!isConjunction && (
              <>
                {/* Hidden path for motion animation (modern only) */}
                {isModern && <path id={pathId} d={pathD} fill="none" stroke="none" />}

                {/* Glow underlay for highlighted (modern only) */}
                {isModern && isHighlighted && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={effectiveColor}
                    strokeWidth={effectiveStrokeWidth + 4}
                    strokeOpacity={0.2}
                    strokeLinecap="round"
                    filter={`url(#${idPrefix}-glow-strong)`}
                    style={aspectTransitionStyle}
                  />
                )}

                {/* Main line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={effectiveColor}
                  strokeWidth={effectiveStrokeWidth}
                  strokeOpacity={effectiveOpacity}
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                  filter={isModern && isHighlighted ? `url(#${idPrefix}-glow)` : undefined}
                  style={{ cursor: onAspectClick ? 'pointer' : 'default', ...aspectTransitionStyle }}
                  onClick={(e) => { e.stopPropagation(); onAspectClick?.(line.aspect, e); }}
                  onMouseEnter={(e) => onAspectHover?.(line.aspect, e)}
                  onMouseLeave={() => onAspectHover?.(null)}
                />

                {/* Flow particles — modern only */}
                {isModern && showEffects && !isMobile && line.opacity > 0.25 && (
                  <circle r={1.5 + strength} fill={effectiveColor} opacity={line.opacity * 0.8}>
                    <animateMotion dur={`${flowDuration}s`} repeatCount="indefinite" path={pathD} />
                  </circle>
                )}
                {isModern && showEffects && !isMobile && flowType === 'bidirectional' && line.opacity > 0.25 && (
                  <circle r={1.5 + strength} fill={effectiveColor} opacity={line.opacity * 0.8}>
                    <animateMotion dur={`${flowDuration}s`} repeatCount="indefinite" path={pathD} keyPoints="1;0" keyTimes="0;1" calcMode="linear" />
                  </circle>
                )}

                {/* Flow arrow — modern only */}
                {isModern && showEffects && !isMobile && flowType === 'one-way' && line.opacity > 0.35 && (() => {
                  const arrowT = 0.72;
                  const arrowTip = useStraightLines
                    ? { x: line.startPoint.x + (line.endPoint.x - line.startPoint.x) * arrowT, y: line.startPoint.y + (line.endPoint.y - line.startPoint.y) * arrowT }
                    : bezierPoint(line.startPoint, ctrl, line.endPoint, arrowT);
                  const arrowBack = useStraightLines
                    ? { x: line.startPoint.x + (line.endPoint.x - line.startPoint.x) * (arrowT - 0.04), y: line.startPoint.y + (line.endPoint.y - line.startPoint.y) * (arrowT - 0.04) }
                    : bezierPoint(line.startPoint, ctrl, line.endPoint, arrowT - 0.04);
                  const dx = arrowTip.x - arrowBack.x;
                  const dy = arrowTip.y - arrowBack.y;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const nx = dx / len, ny = dy / len;
                  const px = -ny, py = nx;
                  const sz = 5 + strength * 3;
                  return (
                    <polygon
                      points={`${arrowTip.x},${arrowTip.y} ${arrowTip.x - nx * sz * 2 + px * sz},${arrowTip.y - ny * sz * 2 + py * sz} ${arrowTip.x - nx * sz * 2 - px * sz},${arrowTip.y - ny * sz * 2 - py * sz}`}
                      fill={effectiveColor}
                      fillOpacity={line.opacity * 0.85}
                    />
                  );
                })()}
              </>
            )}

            {/* ═══ BADGE — modern only (non-conjunction) ═══ */}
            {isModern && !isConjunction && (
              <g
                style={{ cursor: onAspectClick ? 'pointer' : 'default' }}
                onClick={(e) => { e.stopPropagation(); onAspectClick?.(line.aspect, e); }}
                onMouseEnter={(e) => onAspectHover?.(line.aspect, e)}
                onMouseLeave={() => onAspectHover?.(null)}
              >
                <circle
                  cx={apex.x} cy={apex.y} r={7}
                  fill={COLORS.background}
                  fillOpacity={Math.max(line.opacity, 0.7)}
                  stroke={effectiveColor}
                  strokeWidth={isHighlighted ? 1.2 : 0.8}
                  strokeOpacity={line.opacity}
                  filter={isHighlighted ? `url(#${idPrefix}-glow)` : undefined}
                />
                <text
                  x={apex.x} y={apex.y}
                  fill={effectiveColor}
                  fillOpacity={Math.max(line.opacity, 0.6)}
                  fontSize={9} fontWeight="bold"
                  textAnchor="middle" dominantBaseline="central"
                  style={{ userSelect: 'none' }}
                >
                  {line.aspect.aspect.symbol}
                </text>
                {isHighlighted && (
                  <text
                    x={apex.x} y={apex.y + 11}
                    fill={effectiveColor} fillOpacity={0.7}
                    fontSize={7} textAnchor="middle" dominantBaseline="central"
                    style={{ userSelect: 'none' }}
                  >
                    {line.aspect.aspect.exactOrb.toFixed(1)}°
                  </text>
                )}
                {decAspect && (
                  <text
                    x={apex.x + 9} y={apex.y - 6}
                    fill={decAspect === 'parallel' ? '#fbbf24' : '#f97316'}
                    fillOpacity={Math.max(line.opacity, 0.5)}
                    fontSize={9} textAnchor="middle" dominantBaseline="central"
                    style={{ userSelect: 'none' }}
                  >
                    {decAspect === 'parallel' ? '\u2225' : '\u2AF6'}
                  </text>
                )}
              </g>
            )}

            {/* Conjunction hover info (modern/clean — no badge) */}
            {isConjunction && !isClassic && isHighlighted && (
              <g style={{ pointerEvents: 'none' }}>
                <text
                  x={conjunctionPos.x} y={conjunctionPos.y - 10}
                  fill={line.color} fillOpacity={0.8}
                  fontSize={7} textAnchor="middle" dominantBaseline="central"
                  style={{ userSelect: 'none' }}
                >
                  {line.aspect.aspect.exactOrb.toFixed(1)}°
                </text>
                {decAspect && (
                  <text
                    x={conjunctionPos.x} y={conjunctionPos.y + 10}
                    fill={decAspect === 'parallel' ? '#fbbf24' : '#f97316'}
                    fillOpacity={0.7} fontSize={9}
                    textAnchor="middle" dominantBaseline="central"
                    style={{ userSelect: 'none' }}
                  >
                    {decAspect === 'parallel' ? '\u2225' : '\u2AF6'}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

export default AspectGrid;
