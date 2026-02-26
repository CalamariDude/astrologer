/**
 * Aspect Grid Layer
 * Renders immersive aspect lines with energy flow visualization
 *
 * Features:
 * - Curved bezier lines pulled toward chart center
 * - Animated energy flow particles (bidirectional for harmonious, one-way for challenging)
 * - Aspect symbol badge at the curve apex
 * - Glow effects on highlighted aspects
 * - Parallel aspect (declination) indicators
 *
 * Supports multiple chart modes:
 * - synastry: Lines between outer (A) and inner (B) rings
 * - personA/personB/composite: Lines within the single ring (natal aspects)
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
import type { ChartDimensions, AspectLine, PlanetDisplayPositions, ChartMode } from '../types';

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
  /** Declination data for parallel/contraparallel detection */
  declinationsA?: Record<string, number>;
  declinationsB?: Record<string, number>;
}

/**
 * Helper to check if two aspects are the same (by value, not reference)
 */
function isSameAspect(a: SynastryAspect | null, b: SynastryAspect): boolean {
  if (!a) return false;
  return a.planetA === b.planetA && a.planetB === b.planetB && a.aspect.type === b.aspect.type;
}

/**
 * Determine energy flow direction based on aspect nature
 * - harmonious: bidirectional (mutual exchange)
 * - challenging: A→B one-way (forced/pressured energy)
 * - neutral: bidirectional (blending)
 */
function getFlowType(nature: 'harmonious' | 'challenging' | 'neutral'): 'bidirectional' | 'one-way' {
  return nature === 'challenging' ? 'one-way' : 'bidirectional';
}

/**
 * Calculate quadratic bezier control point pulled toward chart center
 */
function getCurveControl(
  start: { x: number; y: number },
  end: { x: number; y: number },
  cx: number,
  cy: number,
  strength: number
): { x: number; y: number } {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  // Pull toward center proportional to distance from center
  // Stronger aspects = less pull (straighter), weaker = more curve
  const pull = 0.25 + (1 - strength) * 0.25;
  return {
    x: midX + (cx - midX) * pull,
    y: midY + (cy - midY) * pull,
  };
}

/**
 * Get point on quadratic bezier at parameter t
 */
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

/**
 * Check if two planets are parallel or contraparallel in declination
 */
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
 * Generate aspect line data for rendering
 */
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
    const opacity = isHighlighted ? 1 : hasPlanetActive ? baseOpacity * 0.3 : baseOpacity;
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
}) => {
  const { cx, cy, planetARing, planetBRing, innerCircle, singlePlanetRing } = dimensions;
  const isSingleWheel = mode !== 'synastry';

  // Stable unique prefix for this component instance
  const idPrefix = React.useMemo(() => `ag-${++defsIdCounter}`, []);

  const aspectLines = React.useMemo(
    () => generateAspectLines(aspects, visibleAspects, dimensions, mode, hoveredPlanet, selectedPlanet, hoveredAspect, selectedAspect, displayPositionsA, displayPositionsB, displayPositions, rotationOffset),
    [aspects, visibleAspects, dimensions, mode, hoveredPlanet, selectedPlanet, hoveredAspect, selectedAspect, displayPositionsA, displayPositionsB, displayPositions, rotationOffset]
  );

  return (
    <g className="aspect-grid">
      {/* SVG defs for glow filters and flow animations */}
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
        const isConjunction = line.aspect.aspect.type === 'conjunction';
        const nature = line.aspect.aspect.nature;
        const strength = line.aspect.aspect.strength;
        const flowType = getFlowType(nature);
        const isHighlighted = line.opacity >= 0.95;

        // Curve control point
        const ctrl = getCurveControl(line.startPoint, line.endPoint, cx, cy, strength);
        // Apex point (t=0.5 on bezier)
        const apex = bezierPoint(line.startPoint, ctrl, line.endPoint, 0.5);
        // Path string for quadratic bezier
        const pathD = `M ${line.startPoint.x} ${line.startPoint.y} Q ${ctrl.x} ${ctrl.y} ${line.endPoint.x} ${line.endPoint.y}`;
        const pathId = `${idPrefix}-path-${index}`;

        // Check declination aspect
        const decAspect = getDeclinationAspect(
          line.aspect.planetA,
          line.aspect.planetB,
          isSingleWheel ? declinationsA : declinationsA,
          isSingleWheel ? declinationsA : declinationsB
        );

        // For conjunctions, calculate position between the actual planet symbols
        let conjunctionPos = { x: apex.x, y: apex.y };
        if (isConjunction) {
          let displayLongA: number;
          let displayLongB: number;
          let ringRadiusA: number;
          let ringRadiusB: number;

          if (isSingleWheel) {
            displayLongA = displayPositions?.get(line.aspect.planetA) ?? line.aspect.longA;
            displayLongB = displayPositions?.get(line.aspect.planetB) ?? line.aspect.longB;
            ringRadiusA = singlePlanetRing || planetARing;
            ringRadiusB = singlePlanetRing || planetARing;
          } else {
            displayLongA = displayPositionsA?.get(line.aspect.planetA) ?? line.aspect.longA;
            displayLongB = displayPositionsB?.get(line.aspect.planetB) ?? line.aspect.longB;
            ringRadiusA = planetARing;
            ringRadiusB = planetBRing;
          }

          const planetAPos = longitudeToXY(displayLongA, cx, cy, ringRadiusA, rotationOffset);
          const planetBPos = longitudeToXY(displayLongB, cx, cy, ringRadiusB, rotationOffset);
          conjunctionPos = {
            x: (planetAPos.x + planetBPos.x) / 2,
            y: (planetAPos.y + planetBPos.y) / 2,
          };
        }

        // Animation durations based on strength (tighter = faster energy)
        const flowDuration = 2.5 + (1 - strength) * 3; // 2.5s–5.5s

        // Dash pattern for challenging aspects — jagged/angular feel
        const dashArray = nature === 'challenging'
          ? `${4 + strength * 3},${2 + (1 - strength) * 3}`
          : undefined;

        return (
          <g key={`${line.aspect.planetA}-${line.aspect.planetB}-${line.aspect.aspect.type}`}>
            {/* Define path for motion animation */}
            {!isConjunction && (
              <path id={pathId} d={pathD} fill="none" stroke="none" />
            )}

            {/* Main aspect curve */}
            {!isConjunction && (
              <>
                {/* Glow underlay for highlighted aspects */}
                {isHighlighted && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={line.strokeWidth + 4}
                    strokeOpacity={0.2}
                    strokeLinecap="round"
                    filter={`url(#${idPrefix}-glow-strong)`}
                  />
                )}

                {/* Main curve line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  strokeOpacity={line.opacity}
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                  filter={isHighlighted ? `url(#${idPrefix}-glow)` : undefined}
                  style={{ cursor: onAspectClick ? 'pointer' : 'default' }}
                  onClick={(e) => { e.stopPropagation(); onAspectClick?.(line.aspect, e); }}
                  onMouseEnter={(e) => onAspectHover?.(line.aspect, e)}
                  onMouseLeave={() => onAspectHover?.(null)}
                />

                {/* Energy flow particles — A→B */}
                {line.opacity > 0.25 && (
                  <circle r={1.5 + strength} fill={line.color} opacity={line.opacity * 0.8}>
                    <animateMotion
                      dur={`${flowDuration}s`}
                      repeatCount="indefinite"
                      path={pathD}
                    />
                  </circle>
                )}

                {/* Second flow particle — B→A (only for bidirectional/harmonious) */}
                {flowType === 'bidirectional' && line.opacity > 0.25 && (
                  <circle r={1.5 + strength} fill={line.color} opacity={line.opacity * 0.8}>
                    <animateMotion
                      dur={`${flowDuration}s`}
                      repeatCount="indefinite"
                      path={pathD}
                      keyPoints="1;0"
                      keyTimes="0;1"
                      calcMode="linear"
                    />
                  </circle>
                )}

                {/* One-way flow arrow indicator for challenging aspects */}
                {flowType === 'one-way' && line.opacity > 0.35 && (() => {
                  // Arrow at ~70% along the path (toward B)
                  const arrowT = 0.72;
                  const arrowTip = bezierPoint(line.startPoint, ctrl, line.endPoint, arrowT);
                  const arrowBack = bezierPoint(line.startPoint, ctrl, line.endPoint, arrowT - 0.04);
                  // Direction vector
                  const dx = arrowTip.x - arrowBack.x;
                  const dy = arrowTip.y - arrowBack.y;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const nx = dx / len;
                  const ny = dy / len;
                  // Perpendicular
                  const px = -ny;
                  const py = nx;
                  const sz = 5 + strength * 3;
                  const p1 = `${arrowTip.x},${arrowTip.y}`;
                  const p2 = `${arrowTip.x - nx * sz * 2 + px * sz},${arrowTip.y - ny * sz * 2 + py * sz}`;
                  const p3 = `${arrowTip.x - nx * sz * 2 - px * sz},${arrowTip.y - ny * sz * 2 - py * sz}`;
                  return (
                    <polygon
                      points={`${p1} ${p2} ${p3}`}
                      fill={line.color}
                      fillOpacity={line.opacity * 0.85}
                    />
                  );
                })()}
              </>
            )}

            {/* Aspect symbol badge at apex */}
            {!isConjunction && (
              <g
                style={{ cursor: onAspectClick ? 'pointer' : 'default' }}
                onClick={(e) => { e.stopPropagation(); onAspectClick?.(line.aspect, e); }}
                onMouseEnter={(e) => onAspectHover?.(line.aspect, e)}
                onMouseLeave={() => onAspectHover?.(null)}
              >
                {/* Badge background */}
                <circle
                  cx={apex.x}
                  cy={apex.y}
                  r={7}
                  fill={COLORS.background}
                  fillOpacity={Math.max(line.opacity, 0.7)}
                  stroke={line.color}
                  strokeWidth={isHighlighted ? 1.2 : 0.8}
                  strokeOpacity={line.opacity}
                  filter={isHighlighted ? `url(#${idPrefix}-glow)` : undefined}
                />
                {/* Aspect symbol */}
                <text
                  x={apex.x}
                  y={apex.y}
                  fill={line.color}
                  fillOpacity={Math.max(line.opacity, 0.6)}
                  fontSize={9}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none' }}
                >
                  {line.aspect.aspect.symbol}
                </text>
                {/* Orb degree — small text below symbol */}
                {isHighlighted && (
                  <text
                    x={apex.x}
                    y={apex.y + 11}
                    fill={line.color}
                    fillOpacity={0.7}
                    fontSize={7}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ userSelect: 'none' }}
                  >
                    {line.aspect.aspect.exactOrb.toFixed(1)}°
                  </text>
                )}
                {/* Declination spark indicator */}
                {decAspect && (
                  <text
                    x={apex.x + 9}
                    y={apex.y - 6}
                    fill={decAspect === 'parallel' ? '#fbbf24' : '#f97316'}
                    fillOpacity={Math.max(line.opacity, 0.5)}
                    fontSize={9}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ userSelect: 'none' }}
                    title={decAspect === 'parallel' ? 'Parallel in declination' : 'Contraparallel in declination'}
                  >
                    {decAspect === 'parallel' ? '\u2225' : '\u2AF6'}
                  </text>
                )}
              </g>
            )}

            {/* Conjunction: show symbol between planets (no line) */}
            {isConjunction && (
              <g
                style={{ cursor: onAspectClick ? 'pointer' : 'default' }}
                onClick={(e) => { e.stopPropagation(); onAspectClick?.(line.aspect, e); }}
                onMouseEnter={(e) => onAspectHover?.(line.aspect, e)}
                onMouseLeave={() => onAspectHover?.(null)}
              >
                <circle
                  cx={conjunctionPos.x}
                  cy={conjunctionPos.y}
                  r={7}
                  fill={COLORS.background}
                  fillOpacity={Math.max(line.opacity, 0.7)}
                  stroke={line.color}
                  strokeWidth={isHighlighted ? 1.2 : 0.8}
                  strokeOpacity={line.opacity}
                  filter={isHighlighted ? `url(#${idPrefix}-glow)` : undefined}
                />
                <text
                  x={conjunctionPos.x}
                  y={conjunctionPos.y}
                  fill={line.color}
                  fillOpacity={Math.max(line.opacity, 0.6)}
                  fontSize={9}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none' }}
                >
                  {line.aspect.aspect.symbol}
                </text>
                {isHighlighted && (
                  <text
                    x={conjunctionPos.x}
                    y={conjunctionPos.y + 11}
                    fill={line.color}
                    fillOpacity={0.7}
                    fontSize={7}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ userSelect: 'none' }}
                  >
                    {line.aspect.aspect.exactOrb.toFixed(1)}°
                  </text>
                )}
                {decAspect && (
                  <text
                    x={conjunctionPos.x + 9}
                    y={conjunctionPos.y - 6}
                    fill={decAspect === 'parallel' ? '#fbbf24' : '#f97316'}
                    fillOpacity={Math.max(line.opacity, 0.5)}
                    fontSize={9}
                    textAnchor="middle"
                    dominantBaseline="central"
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
