/**
 * Planet Tooltip
 * Shows detailed planet information on hover/click
 */

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import { PLANETS, COLORS, ASTEROIDS, ARABIC_PARTS } from '../utils/constants';
import { formatLongitude, calculateDegreeSign } from '../utils/chartMath';
import type { PlanetData, NatalChart } from '../types';
import type { SynastryAspect, AspectType } from '../utils/aspectCalculations';
import {
  getHouseOverlayInterpretation,
  getSignHouseOverlayInterpretation,
  getAspectInterpretation,
  getSignAspectInterpretation,
} from '@/lib/interpretationLookup';
import { getTooltipContainerStyle, isTooltipMobile } from './useTooltipStyle';
import { getSabianSymbol } from '@/data/sabianSymbols';

const isMobileView = () => window.innerWidth < 500;

// Transit aspect with natal chart indicator
interface TransitAspect extends SynastryAspect {
  natalChart: 'A' | 'B' | 'Composite';
}

interface PlanetTooltipProps {
  planet: string;
  chart: 'A' | 'B' | 'Transit';
  name: string; // Person's name or "Transit"
  partnerName?: string; // Other person's name
  data: PlanetData;
  ownHouse?: number; // Correctly calculated house in own chart (overrides data.house)
  partnerHouse?: number; // Which house this planet falls in partner's chart
  aspects: SynastryAspect[];
  visibleAspects: Set<AspectType>; // Only show aspects that are enabled
  position: { x: number; y: number };
  visible: boolean;
  onClose?: () => void; // If provided, shows close button (pinned mode)
  onExpand?: () => void; // If provided, shows expand button (opens detail dialog)
  // Chart data for getting partner planet signs
  partnerChart?: NatalChart;
  // Transit-specific
  transitDate?: string; // ISO date string for transit date
  transitAspects?: TransitAspect[]; // Aspects from transit to natal charts
  nameA?: string; // Person A's name (for transit aspects)
  nameB?: string; // Person B's name (for transit aspects)
}

// Threshold for "tight" orb (in degrees)
const TIGHT_ORB_THRESHOLD = 1;

// Max aspects to show in tooltip (to prevent overflow)
const MAX_ASPECTS_SHOWN = 6;
const MAX_ASPECTS_MOBILE = 3;

// Planet keywords/meanings (for main planets)
const PLANET_KEYWORDS: Record<string, string> = {
  sun: 'The central engine. What you radiate when nothing else is performing.',
  moon: 'Where you retreat without thinking. The reflex beneath the decision.',
  mercury: 'How the mind organizes before the mouth opens. Internal wiring.',
  venus: 'What you reach toward when the stakes are low. Magnetism without strategy.',
  mars: 'The first move. Where energy exits before it\'s filtered.',
  jupiter: 'Where overflow begins. The part of you that assumes there\'s more.',
  saturn: 'The load-bearing wall. What holds when everything else flexes.',
  uranus: 'The circuit breaker. Where the pattern interrupts itself.',
  neptune: 'The dissolve. Where edges stop mattering and something else takes over.',
  pluto: 'What survives the fire. The version that rebuilds from zero.',
  northnode: 'Unfamiliar gravity. The direction that feels wrong but pulls forward.',
  southnode: 'Muscle memory from a life you don\'t remember. Default settings.',
  chiron: 'Perceived weakness, internally unresolved strength.',
  lilith: 'What you stopped apologizing for. The part that refuses to shrink.',
  juno: 'Terms of commitment. The requirements that must exist before loyalty.',
  ceres: 'Provision and survival. Baseline personal continuity, what you need to keep going.',
  pallas: 'Pattern recognition. Seeing the design before it\'s finished.',
  vesta: 'The tended flame. Devotion that doesn\'t need an audience.',
  ascendant: 'Your entrance. The atmosphere you create before you speak.',
  midheaven: 'The summit line. What you\'re building toward whether you planned it or not.',
};

// Get description for any celestial body (planet or asteroid)
const getBodyDescription = (key: string): string | null => {
  // First check main planets
  if (PLANET_KEYWORDS[key]) {
    return PLANET_KEYWORDS[key];
  }
  // Then check asteroids
  const asteroid = ASTEROIDS[key as keyof typeof ASTEROIDS];
  if (asteroid?.description) {
    return asteroid.description;
  }
  return null;
};

// Transit color scheme
const TRANSIT_COLOR = '#228B22';

export const PlanetTooltip: React.FC<PlanetTooltipProps> = ({
  planet,
  chart,
  name,
  partnerName = 'Partner',
  data,
  ownHouse,
  partnerHouse,
  aspects,
  visibleAspects,
  position,
  visible,
  onClose,
  onExpand,
  partnerChart,
  transitDate,
  transitAspects = [],
  nameA = 'Person A',
  nameB = 'Person B',
}) => {
  const isTransit = chart === 'Transit';
  // Track which aspects are expanded
  const [expandedAspects, setExpandedAspects] = useState<Set<number>>(new Set());

  // Drag state for pinned tooltips
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Reset drag when planet changes or tooltip closes
  useEffect(() => { setDragOffset(null); }, [planet, chart, visible]);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!onClose) return; // Only draggable when pinned
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      origX: dragOffset?.x ?? 0,
      origY: dragOffset?.y ?? 0,
    };

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      setDragOffset({
        x: dragRef.current.origX + (cx - dragRef.current.startX),
        y: dragRef.current.origY + (cy - dragRef.current.startY),
      });
    };
    const handleEnd = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  }, [onClose, dragOffset]);

  const toggleAspectExpanded = (idx: number) => {
    setExpandedAspects((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };
  // Get house overlay interpretation if planet falls in partner's house
  // Try sign-specific first, then fall back to generic
  const houseInterpretation = useMemo(() => {
    if (!partnerHouse) return null;

    // Try sign-specific interpretation first (using planet's zodiac sign)
    if (data.sign) {
      const signSpecific = getSignHouseOverlayInterpretation(planet, data.sign, partnerHouse);
      if (signSpecific) {
        return {
          title: signSpecific.title,
          description: signSpecific.description,
          isPositive: signSpecific.isPositive,
          isSignSpecific: true,
          sign: data.sign,
        };
      }
    }

    // Fall back to generic house overlay interpretation
    const generic = getHouseOverlayInterpretation(planet, partnerHouse);
    if (generic) {
      return {
        title: generic.title,
        description: generic.description,
        isPositive: generic.isPositive,
        isSignSpecific: false,
        sign: data.sign,
      };
    }

    return null;
  }, [planet, partnerHouse, data.sign]);

  if (!visible) return null;

  // Get planet/asteroid/arabic-part definition
  const planetDef = PLANETS[planet as keyof typeof PLANETS];
  const asteroidDef = ASTEROIDS[planet as keyof typeof ASTEROIDS];
  const arabicPartDef = ARABIC_PARTS[planet as keyof typeof ARABIC_PARTS];
  const symbol = planetDef?.symbol || asteroidDef?.symbol || arabicPartDef?.symbol || planet.charAt(0).toUpperCase();
  const planetName = planetDef?.name || asteroidDef?.name || arabicPartDef?.name || planet;
  const color = isTransit ? TRANSIT_COLOR : chart === 'A' ? COLORS.personA : COLORS.personB;

  // Get aspects for this planet - filter by visible aspects (respects sidebar toggles)
  // For transit planets, use transitAspects; for natal planets, use synastry aspects
  const planetAspects = isTransit ? [] : aspects.filter(
    (asp) =>
      visibleAspects.has(asp.aspect.type) &&
      ((chart === 'A' && asp.planetA === planet) ||
        (chart === 'B' && asp.planetB === planet))
  );

  // Filter transit aspects for this transit planet
  const filteredTransitAspects = isTransit
    ? transitAspects.filter(
        (asp) => visibleAspects.has(asp.aspect.type) && asp.planetA === planet
      )
    : [];

  // Sort by orb tightness
  const sortedAspects = [...planetAspects].sort(
    (a, b) => a.aspect.exactOrb - b.aspect.exactOrb
  );

  const mobile = isMobileView();
  const maxAspects = mobile ? MAX_ASPECTS_MOBILE : MAX_ASPECTS_SHOWN;
  const hasExpandedAspects = expandedAspects.size > 0;
  const tooltipWidth = onClose ? (hasExpandedAspects ? 360 : 320) : 280;

  const containerStyle = getTooltipContainerStyle({
    position,
    width: tooltipWidth,
    height: 500,
    borderColor: color,
    backgroundColor: COLORS.background,
    pinned: !!onClose,
  });

  // Apply drag offset to the computed style
  const finalStyle: React.CSSProperties = {
    ...containerStyle,
    ...(dragOffset && onClose ? {
      left: (typeof containerStyle.left === 'number' ? containerStyle.left : 0) + dragOffset.x,
      top: (typeof containerStyle.top === 'number' ? containerStyle.top : 0) + dragOffset.y,
    } : {}),
  };

  return (
    <div
      className="planet-tooltip"
      style={finalStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Drag handle - only for pinned (clicked) tooltips on desktop */}
      {onClose && !isTooltipMobile() && (
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{ display: 'flex', justifyContent: 'center', cursor: 'grab', padding: '2px 0 4px', marginTop: -4 }}
        >
          <div style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: COLORS.gridLine, opacity: 0.6 }} />
        </div>
      )}
      {/* Mobile drag handle */}
      {isTooltipMobile() && (
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, cursor: 'grab' }}
        >
          <div style={{ width: 28, height: 3, borderRadius: 2, backgroundColor: COLORS.gridLine }} />
        </div>
      )}

      {/* Expand + Close buttons - only if pinned */}
      {onClose && (
        <div style={{ position: 'absolute', top: 8, right: 10, display: 'flex', gap: 2 }}>
          {onExpand && (
            <button
              onClick={onExpand}
              title="Expand details"
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.textMuted,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Maximize2 size={12} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.textMuted,
              cursor: 'pointer',
              fontSize: 16,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: mobile ? 4 : 8,
          marginBottom: mobile ? 3 : 8,
          borderBottom: `1px solid ${COLORS.gridLine}`,
          paddingBottom: mobile ? 2 : 6,
        }}
      >
        <span style={{ fontSize: mobile ? 14 : 20, color }}>{symbol}</span>
        {mobile ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flex: 1 }}>
            <span style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 11 }}>{planetName}</span>
            <span style={{ color, fontSize: 9 }}>{name}</span>
          </div>
        ) : (
          <div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 14 }}>{planetName}</div>
            <div style={{ color, fontSize: 11 }}>{name}</div>
          </div>
        )}
      </div>

      {/* Planet/Asteroid description — hidden on mobile */}
      {!mobile && getBodyDescription(planet) && (
        <div
          style={{
            fontSize: 11,
            color: COLORS.textSecondary,
            fontStyle: 'italic',
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          {getBodyDescription(planet)}
        </div>
      )}

      {/* Position badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: mobile ? 2 : 4, marginBottom: mobile ? 2 : 8 }}>
        {data.sign && (
          <span style={{
            fontSize: mobile ? 8 : 10, fontWeight: 600, padding: mobile ? '0px 4px' : '2px 8px', borderRadius: mobile ? 3 : 4,
            backgroundColor: 'rgba(99,102,241,0.1)', color: 'rgba(99,102,241,0.8)',
            textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: mobile ? '14px' : undefined,
          }}>
            {data.sign}
          </span>
        )}
        {(ownHouse || data.house) && (
          <span style={{
            fontSize: mobile ? 8 : 10, fontWeight: 600, padding: mobile ? '0px 4px' : '2px 8px', borderRadius: mobile ? 3 : 4,
            backgroundColor: 'rgba(16,185,129,0.1)', color: 'rgba(16,185,129,0.8)',
            textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: mobile ? '14px' : undefined,
          }}>
            House {ownHouse ?? data.house}
          </span>
        )}
        {data.retrograde && (
          <span style={{
            fontSize: mobile ? 8 : 10, fontWeight: 600, padding: mobile ? '0px 4px' : '2px 8px', borderRadius: mobile ? 3 : 4,
            backgroundColor: 'rgba(249,115,22,0.1)', color: '#f97316',
            textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: mobile ? '14px' : undefined,
          }}>
            Rx
          </span>
        )}
      </div>

      {/* Position info — hidden on mobile */}
      {!mobile && (
        <div style={{ fontSize: 12, marginBottom: 8 }}>
          <div style={{ color: COLORS.textSecondary, marginBottom: 4 }}>
            {formatLongitude(data.longitude)}
          </div>

          {data.decan && data.decanSign && (
            <div style={{ color: COLORS.textMuted, marginBottom: 4 }}>
              Decan {data.decan} ({data.decanSign})
            </div>
          )}

          {data.longitude !== undefined && (() => {
            const deg = calculateDegreeSign(data.longitude);
            return (
              <div style={{ color: COLORS.textMuted, marginBottom: 4 }}>
                Degree: {deg.degreeSymbol} {deg.degreeSign}
              </div>
            );
          })()}
        </div>
      )}

      {/* Ecliptic Coordinates — hidden on mobile to save space */}
      {!isMobileView() && (
        <div style={{
          borderTop: `1px solid ${COLORS.gridLine}`,
          paddingTop: 8,
          marginBottom: 8,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: COLORS.textMuted,
            marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Ecliptic Coordinates
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3px 12px', fontSize: 11 }}>
            <span style={{ color: COLORS.textMuted }}>Longitude</span>
            <span style={{ color: COLORS.textSecondary, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {data.degree !== undefined && data.minute !== undefined
                ? `${data.degree}° ${data.minute.toString().padStart(2, '0')}'`
                : `${Math.floor(data.longitude % 30)}° ${Math.floor((data.longitude % 1) * 60).toString().padStart(2, '0')}'`
              }
            </span>
            <span style={{ color: COLORS.textMuted }}>Abs. Longitude</span>
            <span style={{ color: COLORS.textSecondary, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {data.longitude.toFixed(4)}°
            </span>
            {data.latitude !== undefined && (
              <>
                <span style={{ color: COLORS.textMuted }}>Latitude</span>
                <span style={{ color: COLORS.textSecondary, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {data.latitude >= 0 ? '' : '-'}{Math.abs(data.latitude).toFixed(4)}°
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sabian Symbol — hidden on mobile */}
      {!mobile && data.longitude !== undefined && (() => {
        const sabian = getSabianSymbol(data.longitude);
        return (
          <div style={{
            borderTop: `1px solid ${COLORS.gridLine}`,
            paddingTop: 8,
            marginBottom: 8,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: COLORS.textMuted,
              marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Sabian Symbol ({sabian.sign} {sabian.degree})
            </div>
            <div style={{
              fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.4,
              fontStyle: 'italic',
            }}>
              "{sabian.symbol}"
            </div>
            <div style={{
              fontSize: 10, color: COLORS.textMuted, marginTop: 3,
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>
              {sabian.keyword}
            </div>
          </div>
        );
      })()}

      {/* Aspects list — hidden on mobile hover (only show when pinned/clicked) */}
      {sortedAspects.length > 0 && !(mobile && !onClose) && (
        <div
          style={{
            borderTop: `1px solid ${COLORS.gridLine}`,
            paddingTop: 8,
          }}
        >
          <div
            style={{
              fontSize: mobile ? 9 : 11,
              fontWeight: 600,
              color: COLORS.textSecondary,
              marginBottom: mobile ? 3 : 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Aspects to {partnerName} ({sortedAspects.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 2 : 4 }}>
            {sortedAspects.slice(0, maxAspects).map((asp, idx) => {
              // Get the partner planet (the one from the other chart)
              const partnerPlanet = chart === 'A' ? asp.planetB : asp.planetA;
              const partnerPlanetDef = PLANETS[partnerPlanet as keyof typeof PLANETS];
              const partnerAsteroidDef = ASTEROIDS[partnerPlanet as keyof typeof ASTEROIDS];
              const partnerArabicDef = ARABIC_PARTS[partnerPlanet as keyof typeof ARABIC_PARTS];
              const partnerSymbol = partnerPlanetDef?.symbol || partnerAsteroidDef?.symbol || partnerArabicDef?.symbol || partnerPlanet.charAt(0).toUpperCase();
              const partnerPlanetName = partnerPlanetDef?.name || partnerAsteroidDef?.name || partnerArabicDef?.name || partnerPlanet;

              const isTight = asp.aspect.exactOrb < TIGHT_ORB_THRESHOLD;
              const isExpanded = expandedAspects.has(idx);
              const canExpand = onClose; // Only allow expand in pinned mode

              // Get interpretation for this aspect
              const getInterpretation = () => {
                const aspectType = asp.aspect.type;
                const thisPlanetSign = data.sign;
                const partnerPlanetSign = partnerChart?.planets[partnerPlanet]?.sign;

                // Try sign-specific first
                if (thisPlanetSign && partnerPlanetSign) {
                  const signSpecific = getSignAspectInterpretation(
                    planet, thisPlanetSign,
                    partnerPlanet, partnerPlanetSign,
                    aspectType
                  );
                  if (signSpecific) {
                    return {
                      ...signSpecific,
                      isSignSpecific: true,
                      signs: `${thisPlanetSign} — ${partnerPlanetSign}`,
                    };
                  }
                }

                // Fall back to generic
                const generic = getAspectInterpretation(planet, partnerPlanet, aspectType);
                if (generic) {
                  return { ...generic, isSignSpecific: false, signs: null };
                }
                return null;
              };

              const interpretation = isExpanded ? getInterpretation() : null;

              return (
                <div key={idx}>
                  <div
                    onClick={canExpand ? () => toggleAspectExpanded(idx) : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: mobile ? 4 : 8,
                      padding: mobile ? '2px 6px' : '5px 8px',
                      backgroundColor: isTight ? 'rgba(168, 85, 247, 0.1)' : 'rgba(0,0,0,0.03)',
                      borderRadius: isExpanded ? '6px 6px 0 0' : 6,
                      border: isTight ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid transparent',
                      cursor: canExpand ? 'pointer' : 'default',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (canExpand) e.currentTarget.style.backgroundColor = isTight ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (canExpand) e.currentTarget.style.backgroundColor = isTight ? 'rgba(168, 85, 247, 0.1)' : 'rgba(0,0,0,0.03)';
                    }}
                  >
                    {/* Aspect symbol with white background circle */}
                    <div
                      style={{
                        width: mobile ? 18 : 26,
                        height: mobile ? 18 : 26,
                        borderRadius: '50%',
                        backgroundColor: COLORS.background,
                        border: `${mobile ? 1.5 : 2}px solid ${asp.aspect.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: mobile ? 10 : 16,
                          fontWeight: 'bold',
                          color: asp.aspect.color,
                          lineHeight: 1,
                        }}
                      >
                        {asp.aspect.symbol}
                      </span>
                    </div>

                    {/* Aspect name and partner planet */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {mobile ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: 9, fontWeight: 600, color: asp.aspect.color, textTransform: 'capitalize' }}>{asp.aspect.name}</span>
                          <span style={{ fontSize: 10 }}>{partnerSymbol}</span>
                          <span style={{ fontSize: 9, color: COLORS.textPrimary }}>{partnerPlanetName}</span>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 600, color: asp.aspect.color, textTransform: 'capitalize' }}>
                            {asp.aspect.name}
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 13 }}>{partnerSymbol}</span>
                            <span>{partnerPlanetName}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Orb + applying/separating */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <span
                        style={{
                          fontSize: 10,
                          color: isTight ? '#7c3aed' : COLORS.textMuted,
                          fontWeight: isTight ? 600 : 400,
                        }}
                      >
                        {asp.aspect.exactOrb.toFixed(1)}°
                      </span>
                      {asp.aspect.isApplying !== undefined && (
                        <span style={{
                          fontSize: 7,
                          color: asp.aspect.isApplying ? '#3b82f6' : COLORS.textMuted,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px',
                        }}>
                          {asp.aspect.isApplying ? 'App' : 'Sep'}
                        </span>
                      )}
                    </div>

                    {/* Tight badge */}
                    {isTight && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: '#ffffff',
                          backgroundColor: '#7c3aed',
                          padding: '1px 4px',
                          borderRadius: 3,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px',
                        }}
                      >
                        Tight
                      </span>
                    )}

                    {/* Expand/collapse indicator */}
                    {canExpand && (
                      <span
                        style={{
                          fontSize: 10,
                          color: COLORS.textMuted,
                          transition: 'transform 0.2s',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        ▼
                      </span>
                    )}
                  </div>

                  {/* Expanded interpretation */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderRadius: '0 0 6px 6px',
                        borderTop: `1px solid ${COLORS.gridLine}`,
                      }}
                    >
                      {interpretation ? (
                        <>
                          {/* Sign-specific badge */}
                          {interpretation.isSignSpecific && interpretation.signs && (
                            <div style={{
                              display: 'inline-block',
                              fontSize: 9,
                              fontWeight: 600,
                              color: '#7c3aed',
                              backgroundColor: 'rgba(124, 58, 237, 0.1)',
                              padding: '2px 6px',
                              borderRadius: 4,
                              marginBottom: 6,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              {interpretation.signs}
                            </div>
                          )}
                          <div style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: interpretation.isPositive ? '#22c55e' : '#ef4444',
                            marginBottom: 4,
                          }}>
                            {interpretation.title}
                          </div>
                          <div style={{
                            fontSize: 11,
                            color: COLORS.textSecondary,
                            lineHeight: 1.5,
                          }}>
                            {interpretation.description}
                          </div>
                        </>
                      ) : (
                        <div style={{
                          fontSize: 11,
                          color: COLORS.textMuted,
                          fontStyle: 'italic',
                        }}>
                          No interpretation available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Show remaining count if there are more */}
            {sortedAspects.length > maxAspects && (
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textMuted,
                  textAlign: 'center',
                  paddingTop: 4,
                  fontStyle: 'italic',
                }}
              >
                +{sortedAspects.length - maxAspects} more aspect{sortedAspects.length - maxAspects !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transit aspects to natal chart(s) — hidden on mobile hover */}
      {isTransit && filteredTransitAspects.length > 0 && !(mobile && !onClose) && (
        <div
          style={{
            borderTop: `1px solid ${COLORS.gridLine}`,
            paddingTop: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.textSecondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Aspects to Natal ({filteredTransitAspects.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredTransitAspects.slice(0, maxAspects).map((asp, idx) => {
              const natalPlanet = asp.planetB;
              const natalPlanetDef = PLANETS[natalPlanet as keyof typeof PLANETS];
              const natalAsteroidDef = ASTEROIDS[natalPlanet as keyof typeof ASTEROIDS];
              const natalArabicDef = ARABIC_PARTS[natalPlanet as keyof typeof ARABIC_PARTS];
              const natalSymbol = natalPlanetDef?.symbol || natalAsteroidDef?.symbol || natalArabicDef?.symbol || natalPlanet.charAt(0).toUpperCase();
              const natalPlanetName = natalPlanetDef?.name || natalAsteroidDef?.name || natalArabicDef?.name || natalPlanet;

              const isTight = asp.aspect.exactOrb < TIGHT_ORB_THRESHOLD;

              // Determine which natal chart this aspect is to
              const chartLabel = asp.natalChart === 'A' ? nameA : asp.natalChart === 'B' ? nameB : 'Composite';
              const chartColor = asp.natalChart === 'A' ? COLORS.personA : asp.natalChart === 'B' ? COLORS.personB : COLORS.composite;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 8px',
                    backgroundColor: isTight ? 'rgba(34, 139, 34, 0.1)' : 'rgba(0,0,0,0.03)',
                    borderRadius: 6,
                    border: isTight ? '1px solid rgba(34, 139, 34, 0.3)' : '1px solid transparent',
                  }}
                >
                  {/* Aspect symbol */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: COLORS.background,
                      border: `2px solid ${asp.aspect.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: asp.aspect.color,
                        lineHeight: 1,
                      }}
                    >
                      {asp.aspect.symbol}
                    </span>
                  </div>

                  {/* Aspect info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: asp.aspect.color,
                        textTransform: 'capitalize',
                      }}
                    >
                      {asp.aspect.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS.textPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 13, color: chartColor }}>{natalSymbol}</span>
                      <span>{natalPlanetName}</span>
                      <span style={{ fontSize: 10, color: chartColor }}>({chartLabel})</span>
                    </div>
                  </div>

                  {/* Orb */}
                  <span
                    style={{
                      fontSize: 10,
                      color: isTight ? TRANSIT_COLOR : COLORS.textMuted,
                      fontWeight: isTight ? 600 : 400,
                    }}
                  >
                    {asp.aspect.exactOrb.toFixed(1)}°
                  </span>

                  {/* Tight badge */}
                  {isTight && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: '#ffffff',
                        backgroundColor: TRANSIT_COLOR,
                        padding: '1px 4px',
                        borderRadius: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                      }}
                    >
                      Tight
                    </span>
                  )}
                </div>
              );
            })}

            {/* Show remaining count */}
            {filteredTransitAspects.length > maxAspects && (
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textMuted,
                  textAlign: 'center',
                  paddingTop: 4,
                  fontStyle: 'italic',
                }}
              >
                +{filteredTransitAspects.length - maxAspects} more aspect{filteredTransitAspects.length - maxAspects !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transit date display — hidden on mobile hover */}
      {isTransit && transitDate && !(mobile && !onClose) && (
        <div
          style={{
            borderTop: `1px solid ${COLORS.gridLine}`,
            paddingTop: 8,
            marginTop: 4,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.textSecondary,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Transit Date
          </div>
          <div style={{ color: TRANSIT_COLOR, fontSize: 13, fontWeight: 500 }}>
            {new Date(transitDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      )}

      {/* No aspects message — hidden on mobile hover */}
      {!isTransit && sortedAspects.length === 0 && !(mobile && !onClose) && (
        <div style={{ color: COLORS.textMuted, fontSize: mobile ? 9 : 11, fontStyle: 'italic' }}>
          No aspects with visible planets
        </div>
      )}
      {isTransit && filteredTransitAspects.length === 0 && !(mobile && !onClose) && (
        <div style={{ color: COLORS.textMuted, fontSize: mobile ? 9 : 11, fontStyle: 'italic', marginTop: mobile ? 4 : 8 }}>
          No aspects to natal planets
        </div>
      )}

      {/* House Overlay Interpretation - only for natal planets, hidden on mobile */}
      {!mobile && !isTransit && houseInterpretation && partnerHouse && (
        <div
          style={{
            borderTop: `1px solid ${COLORS.gridLine}`,
            paddingTop: 10,
            marginTop: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.textSecondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            In {partnerName}'s House {partnerHouse}
          </div>

          {/* Sign-specific badge */}
          {houseInterpretation.isSignSpecific && houseInterpretation.sign && (
            <div style={{
              display: 'inline-block',
              fontSize: 9,
              fontWeight: 600,
              color: '#7c3aed',
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              padding: '2px 6px',
              borderRadius: 4,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {planetName} in {houseInterpretation.sign}
            </div>
          )}

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: houseInterpretation.isPositive ? '#22c55e' : '#ef4444',
              marginBottom: 6,
            }}
          >
            {houseInterpretation.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: COLORS.textSecondary,
              lineHeight: 1.5,
            }}
          >
            {houseInterpretation.description}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanetTooltip;
