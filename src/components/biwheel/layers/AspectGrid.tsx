/**
 * Aspect Grid Layer
 * Renders aspect lines between planets in the center of the chart
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
  // Display positions after collision avoidance
  displayPositionsA?: PlanetDisplayPositions;
  displayPositionsB?: PlanetDisplayPositions;
  // Single-wheel mode display positions (for natal/composite aspects)
  displayPositions?: PlanetDisplayPositions;
  rotationOffset?: number;
}

/**
 * Helper to check if two aspects are the same (by value, not reference)
 */
function isSameAspect(a: SynastryAspect | null, b: SynastryAspect): boolean {
  if (!a) return false;
  return a.planetA === b.planetA && a.planetB === b.planetB && a.aspect.type === b.aspect.type;
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
    // Filter by visible aspect types
    if (!visibleAspects.has(asp.aspect.type)) continue;

    // When an aspect is selected, only show that specific aspect
    if (selectedAspect && !isSameAspect(selectedAspect, asp)) continue;

    // Use display positions based on mode
    let displayLongA: number;
    let displayLongB: number;

    if (isSingleWheel) {
      // Single-wheel: both planets use the same display positions map
      displayLongA = displayPositions?.get(asp.planetA) ?? asp.longA;
      displayLongB = displayPositions?.get(asp.planetB) ?? asp.longB;
    } else {
      // Synastry: A uses A's positions, B uses B's positions
      displayLongA = displayPositionsA?.get(asp.planetA) ?? asp.longA;
      displayLongB = displayPositionsB?.get(asp.planetB) ?? asp.longB;
    }

    // Calculate positions (planets connect from inner circle edge)
    const startPoint = longitudeToXY(displayLongA, cx, cy, innerCircle, rotationOffset);
    const endPoint = longitudeToXY(displayLongB, cx, cy, innerCircle, rotationOffset);

    // Determine highlighting - use value comparison for reliability
    const isSelected = isSameAspect(selectedAspect, asp);
    const isHovered = isSameAspect(hoveredAspect, asp);

    // Highlighting logic depends on mode
    let isPlanetHovered = false;
    let isPlanetSelected = false;

    if (isSingleWheel) {
      // Single-wheel: both planets are in the same chart
      const chartKey = mode === 'composite' ? 'Composite' : mode === 'personA' ? 'A' : 'B';
      isPlanetHovered = hoveredPlanet?.chart === chartKey &&
        (hoveredPlanet.planet === asp.planetA || hoveredPlanet.planet === asp.planetB);
      isPlanetSelected = selectedPlanet?.chart === chartKey &&
        (selectedPlanet.planet === asp.planetA || selectedPlanet.planet === asp.planetB);
    } else {
      // Synastry: A's planet aspects B's planet
      isPlanetHovered = hoveredPlanet !== null &&
        ((hoveredPlanet.chart === 'A' && hoveredPlanet.planet === asp.planetA) ||
          (hoveredPlanet.chart === 'B' && hoveredPlanet.planet === asp.planetB));
      isPlanetSelected = selectedPlanet !== null &&
        ((selectedPlanet.chart === 'A' && selectedPlanet.planet === asp.planetA) ||
          (selectedPlanet.chart === 'B' && selectedPlanet.planet === asp.planetB));
    }

    const isHighlighted = isSelected || isHovered || isPlanetHovered || isPlanetSelected;
    // A planet is "active" (should dim non-related aspects) if hovered OR selected
    const hasPlanetActive = hoveredPlanet || selectedPlanet;

    // Calculate visual properties
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

  // Sort so highlighted aspects are on top
  return lines.sort((a, b) => a.opacity - b.opacity);
}

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
}) => {
  const { cx, cy, planetARing, planetBRing, innerCircle, singlePlanetRing } = dimensions;
  const isSingleWheel = mode !== 'synastry';

  const aspectLines = React.useMemo(
    () => generateAspectLines(aspects, visibleAspects, dimensions, mode, hoveredPlanet, selectedPlanet, hoveredAspect, selectedAspect, displayPositionsA, displayPositionsB, displayPositions, rotationOffset),
    [aspects, visibleAspects, dimensions, mode, hoveredPlanet, selectedPlanet, hoveredAspect, selectedAspect, displayPositionsA, displayPositionsB, displayPositions, rotationOffset]
  );

  return (
    <g className="aspect-grid">
      {aspectLines.map((line, index) => {
        // Calculate midpoint for symbol placement
        const midX = (line.startPoint.x + line.endPoint.x) / 2;
        const midY = (line.startPoint.y + line.endPoint.y) / 2;

        // Check if this is a conjunction (planets are close together)
        const isConjunction = line.aspect.aspect.type === 'conjunction';

        // For conjunctions, calculate position between the actual planet symbols
        let conjunctionPos = { x: midX, y: midY };
        if (isConjunction) {
          // Use display positions based on mode
          let displayLongA: number;
          let displayLongB: number;
          let ringRadiusA: number;
          let ringRadiusB: number;

          if (isSingleWheel) {
            // Single-wheel: both planets on the same ring
            displayLongA = displayPositions?.get(line.aspect.planetA) ?? line.aspect.longA;
            displayLongB = displayPositions?.get(line.aspect.planetB) ?? line.aspect.longB;
            ringRadiusA = singlePlanetRing || planetARing;
            ringRadiusB = singlePlanetRing || planetARing;
          } else {
            // Synastry: A on outer ring, B on inner ring
            displayLongA = displayPositionsA?.get(line.aspect.planetA) ?? line.aspect.longA;
            displayLongB = displayPositionsB?.get(line.aspect.planetB) ?? line.aspect.longB;
            ringRadiusA = planetARing;
            ringRadiusB = planetBRing;
          }

          // Get planet positions on their respective rings
          const planetAPos = longitudeToXY(displayLongA, cx, cy, ringRadiusA, rotationOffset);
          const planetBPos = longitudeToXY(displayLongB, cx, cy, ringRadiusB, rotationOffset);
          // Position orb text between the two planets
          conjunctionPos = {
            x: (planetAPos.x + planetBPos.x) / 2,
            y: (planetAPos.y + planetBPos.y) / 2,
          };
        }

        return (
          <g key={`${line.aspect.planetA}-${line.aspect.planetB}-${line.aspect.aspect.type}`}>
            {/* Aspect line - skip for conjunctions since planets are already close */}
            {!isConjunction && (
              <line
                x1={line.startPoint.x}
                y1={line.startPoint.y}
                x2={line.endPoint.x}
                y2={line.endPoint.y}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                strokeOpacity={line.opacity}
                strokeDasharray={line.dashed ? '5,3' : undefined}
                strokeLinecap="round"
                style={{ cursor: onAspectClick ? 'pointer' : 'default' }}
                onClick={(e) => { e.stopPropagation(); onAspectClick?.(line.aspect, e); }}
                onMouseEnter={(e) => onAspectHover?.(line.aspect, e)}
                onMouseLeave={() => onAspectHover?.(null)}
              />
            )}

            {/* For non-conjunctions, show aspect symbol at midpoint */}
            {!isConjunction && (
              <>
                {/* White background circle behind aspect symbol */}
                <circle
                  cx={midX}
                  cy={midY}
                  r={10}
                  fill={COLORS.background}
                  fillOpacity={line.opacity}
                  stroke={line.color}
                  strokeWidth={1}
                  strokeOpacity={line.opacity}
                  style={{ cursor: onAspectClick ? 'pointer' : 'default' }}
                  onClick={(e) => { e.stopPropagation(); onAspectClick?.(line.aspect, e); }}
                  onMouseEnter={(e) => onAspectHover?.(line.aspect, e)}
                  onMouseLeave={() => onAspectHover?.(null)}
                />
                {/* Aspect symbol at midpoint */}
                <text
                  x={midX}
                  y={midY}
                  fill={line.color}
                  fillOpacity={line.opacity}
                  fontSize={13}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ userSelect: 'none', cursor: onAspectClick ? 'pointer' : 'default' }}
                  onClick={(e) => { e.stopPropagation(); onAspectClick?.(line.aspect, e); }}
                  onMouseEnter={(e) => onAspectHover?.(line.aspect, e)}
                  onMouseLeave={() => onAspectHover?.(null)}
                >
                  {line.aspect.aspect.symbol}
                </text>
                {/* Orb labels removed - too cluttered with asteroids, visible in tooltip on hover */}
              </>
            )}
          </g>
        );
      })}

    </g>
  );
};

export default AspectGrid;
