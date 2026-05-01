/**
 * Planet Detail Dialog
 * Full-screen modal showing comprehensive planet information
 * Opened via expand button on pinned PlanetTooltip
 */

import React, { useMemo } from 'react';
import { X } from 'lucide-react';
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
import { getSabianSymbol } from '@/data/sabianSymbols';

// Planet keywords (same as PlanetTooltip)
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

// Transit aspect with natal chart indicator
interface TransitAspect extends SynastryAspect {
  natalChart: 'A' | 'B' | 'Composite';
}

interface PlanetDetailDialogProps {
  planet: string;
  chart: 'A' | 'B' | 'Transit';
  name: string;
  partnerName?: string;
  data: PlanetData;
  ownHouse?: number;
  partnerHouse?: number;
  aspects: SynastryAspect[];
  visibleAspects: Set<AspectType>;
  partnerChart?: NatalChart;
  transitDate?: string;
  transitAspects?: TransitAspect[];
  nameA?: string;
  nameB?: string;
  onClose: () => void;
}

const TIGHT_ORB_THRESHOLD = 1;

export function PlanetDetailDialog({
  planet,
  chart,
  name,
  partnerName = 'Partner',
  data,
  ownHouse,
  partnerHouse,
  aspects,
  visibleAspects,
  partnerChart,
  transitDate,
  transitAspects = [],
  nameA = 'Person A',
  nameB = 'Person B',
  onClose,
}: PlanetDetailDialogProps) {
  const isTransit = chart === 'Transit';
  const planetDef = PLANETS[planet as keyof typeof PLANETS];
  const asteroidDef = ASTEROIDS[planet as keyof typeof ASTEROIDS];
  const arabicPartDef = ARABIC_PARTS[planet as keyof typeof ARABIC_PARTS];
  const symbol = planetDef?.symbol || asteroidDef?.symbol || arabicPartDef?.symbol || planet.charAt(0).toUpperCase();
  const planetName = planetDef?.name || asteroidDef?.name || arabicPartDef?.name || planet;
  const color = isTransit ? '#228B22' : chart === 'A' ? COLORS.personA : COLORS.personB;
  const description = PLANET_KEYWORDS[planet] || (asteroidDef as any)?.description || null;

  // Sabian symbol
  const sabian = useMemo(() => data.longitude !== undefined ? getSabianSymbol(data.longitude) : null, [data.longitude]);

  // Degree sign
  const degSign = useMemo(() => data.longitude !== undefined ? calculateDegreeSign(data.longitude) : null, [data.longitude]);

  // All aspects for this planet
  const allAspects = useMemo(() => {
    if (isTransit) return [];
    return aspects
      .filter(
        (asp) =>
          visibleAspects.has(asp.aspect.type) &&
          ((chart === 'A' && asp.planetA === planet) ||
            (chart === 'B' && asp.planetB === planet))
      )
      .sort((a, b) => a.aspect.exactOrb - b.aspect.exactOrb);
  }, [aspects, visibleAspects, chart, planet, isTransit]);

  // Transit aspects
  const filteredTransitAspects = useMemo(() => {
    if (!isTransit) return [];
    return transitAspects
      .filter((asp) => visibleAspects.has(asp.aspect.type) && asp.planetA === planet)
      .sort((a, b) => a.aspect.exactOrb - b.aspect.exactOrb);
  }, [transitAspects, visibleAspects, planet, isTransit]);

  // House overlay interpretation
  const houseInterpretation = useMemo(() => {
    if (!partnerHouse) return null;
    if (data.sign) {
      const signSpecific = getSignHouseOverlayInterpretation(planet, data.sign, partnerHouse);
      if (signSpecific) return { ...signSpecific, isSignSpecific: true, sign: data.sign };
    }
    const generic = getHouseOverlayInterpretation(planet, partnerHouse);
    if (generic) return { ...generic, isSignSpecific: false, sign: data.sign };
    return null;
  }, [planet, partnerHouse, data.sign]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          margin: 16,
          backgroundColor: COLORS.background,
          borderRadius: 12,
          border: `2px solid ${color}`,
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: COLORS.background,
            borderBottom: `1px solid ${COLORS.gridLine}20`,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: 28, color }}>{symbol}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>{planetName}</span>
              {data.retrograde && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316',
                }}>
                  Rx
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                backgroundColor: `${color}15`, color,
              }}>
                {name}
              </span>
              {data.sign && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                  backgroundColor: 'rgba(99,102,241,0.1)', color: 'rgba(99,102,241,0.8)',
                  textTransform: 'uppercase',
                }}>
                  {data.sign}
                </span>
              )}
              {(ownHouse || data.house) && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                  backgroundColor: 'rgba(16,185,129,0.1)', color: 'rgba(16,185,129,0.8)',
                  textTransform: 'uppercase',
                }}>
                  House {ownHouse ?? data.house}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, color: COLORS.textMuted, display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Description */}
          {description && (
            <div style={{
              fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic',
              lineHeight: 1.5, padding: '10px 14px', backgroundColor: `${COLORS.gridLine}08`,
              borderRadius: 8, borderLeft: `3px solid ${color}`,
            }}>
              {description}
            </div>
          )}

          {/* Position & Coordinates Grid */}
          <div>
            <SectionTitle>Position</SectionTitle>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            }}>
              <InfoCard label="Longitude" value={formatLongitude(data.longitude)} />
              <InfoCard label="Abs. Longitude" value={`${data.longitude.toFixed(4)}°`} />
              {data.latitude !== undefined && (
                <InfoCard label="Latitude" value={`${data.latitude >= 0 ? '+' : ''}${data.latitude.toFixed(4)}°`} />
              )}
              {data.declination !== undefined && (
                <InfoCard label="Declination" value={`${data.declination >= 0 ? '+' : ''}${data.declination.toFixed(4)}°`} />
              )}
              {degSign && (
                <InfoCard label="Degree" value={`${degSign.degreeSymbol} ${degSign.degreeSign}`} />
              )}
              {data.decan && data.decanSign && (
                <InfoCard label="Decan" value={`${data.decan} (${data.decanSign})`} />
              )}
              {data.speed !== undefined && (
                <InfoCard label="Daily Motion" value={`${data.speed >= 0 ? '+' : ''}${data.speed.toFixed(4)}°/day`} />
              )}
              {data.distance !== undefined && (
                <InfoCard label="Distance" value={`${data.distance.toFixed(6)} AU`} />
              )}
            </div>
          </div>

          {/* Sabian Symbol */}
          {sabian && (
            <div>
              <SectionTitle>Sabian Symbol — {sabian.sign} {sabian.degree}°</SectionTitle>
              <div style={{
                padding: '10px 14px', backgroundColor: `${COLORS.gridLine}08`,
                borderRadius: 8,
              }}>
                <div style={{
                  fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic',
                  lineHeight: 1.5, marginBottom: 6,
                }}>
                  "{sabian.symbol}"
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: COLORS.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {sabian.keyword}
                </div>
              </div>
            </div>
          )}

          {/* Transit Date */}
          {isTransit && transitDate && (
            <div>
              <SectionTitle>Transit Date</SectionTitle>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#228B22' }}>
                {new Date(transitDate).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </div>
            </div>
          )}

          {/* Aspects Table */}
          {(allAspects.length > 0 || filteredTransitAspects.length > 0) && (
            <div>
              <SectionTitle>
                {isTransit
                  ? `Aspects to Natal (${filteredTransitAspects.length})`
                  : `Aspects to ${partnerName} (${allAspects.length})`
                }
              </SectionTitle>
              <div style={{
                border: `1px solid ${COLORS.gridLine}20`,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isTransit ? '1fr 70px 1fr 60px 60px' : '1fr 70px 1fr 60px 60px',
                  padding: '8px 12px',
                  backgroundColor: `${COLORS.gridLine}0A`,
                  borderBottom: `1px solid ${COLORS.gridLine}15`,
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.5px', color: COLORS.textMuted,
                }}>
                  <span>From</span>
                  <span style={{ textAlign: 'center' }}>Aspect</span>
                  <span>To</span>
                  <span style={{ textAlign: 'center' }}>Type</span>
                  <span style={{ textAlign: 'right' }}>Orb</span>
                </div>

                {/* Synastry / natal aspects — context determines which interpretation corpus to use */}
                {allAspects.map((asp, idx) => {
                  const partnerPlanet = chart === 'A' ? asp.planetB : asp.planetA;
                  return (
                    <AspectRow
                      key={idx}
                      asp={asp}
                      fromSymbol={symbol}
                      fromName={planetName}
                      fromColor={color}
                      toPlanet={partnerPlanet}
                      toLabel={partnerName}
                      toColor={chart === 'A' ? COLORS.personB : COLORS.personA}
                      planet={planet}
                      partnerChart={partnerChart}
                      data={data}
                      isLast={idx === allAspects.length - 1}
                      interpretContext={partnerChart ? 'synastry' : 'natal'}
                    />
                  );
                })}

                {/* Transit aspects — never synastry */}
                {filteredTransitAspects.map((asp, idx) => {
                  const natalPlanet = asp.planetB;
                  const chartLabel = asp.natalChart === 'A' ? nameA : asp.natalChart === 'B' ? nameB : 'Composite';
                  const chartColor = asp.natalChart === 'A' ? COLORS.personA : asp.natalChart === 'B' ? COLORS.personB : COLORS.composite;
                  return (
                    <AspectRow
                      key={idx}
                      asp={asp}
                      fromSymbol={symbol}
                      fromName={planetName}
                      fromColor={color}
                      toPlanet={natalPlanet}
                      toLabel={chartLabel}
                      toColor={chartColor}
                      planet={planet}
                      partnerChart={partnerChart}
                      data={data}
                      isLast={idx === filteredTransitAspects.length - 1}
                      interpretContext="natal"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* No aspects */}
          {!isTransit && allAspects.length === 0 && (
            <div style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' }}>
              No aspects with visible planets
            </div>
          )}

          {/* House Overlay Interpretation */}
          {!isTransit && houseInterpretation && partnerHouse && (
            <div>
              <SectionTitle>In {partnerName}'s House {partnerHouse}</SectionTitle>
              <div style={{
                padding: '12px 14px', borderRadius: 8,
                backgroundColor: houseInterpretation.isPositive ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${houseInterpretation.isPositive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                {houseInterpretation.isSignSpecific && houseInterpretation.sign && (
                  <div style={{
                    display: 'inline-block', fontSize: 9, fontWeight: 600,
                    color: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)',
                    padding: '2px 6px', borderRadius: 4, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>
                    {planetName} in {houseInterpretation.sign}
                  </div>
                )}
                <div style={{
                  fontSize: 14, fontWeight: 600, marginBottom: 4,
                  color: houseInterpretation.isPositive ? '#22c55e' : '#ef4444',
                }}>
                  {houseInterpretation.title}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                  {houseInterpretation.description}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: COLORS.textMuted,
      textTransform: 'uppercase', letterSpacing: '0.5px',
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 6,
      backgroundColor: `${COLORS.gridLine}08`,
    }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

function AspectRow({
  asp,
  fromSymbol,
  fromName,
  fromColor,
  toPlanet,
  toLabel,
  toColor,
  planet,
  partnerChart,
  data,
  isLast,
  interpretContext,
}: {
  asp: SynastryAspect;
  fromSymbol: string;
  fromName: string;
  fromColor: string;
  toPlanet: string;
  toLabel: string;
  toColor: string;
  planet: string;
  partnerChart?: NatalChart;
  data: PlanetData;
  isLast: boolean;
  interpretContext: 'synastry' | 'natal';
}) {
  const toPlanetDef = PLANETS[toPlanet as keyof typeof PLANETS];
  const toAsteroidDef = ASTEROIDS[toPlanet as keyof typeof ASTEROIDS];
  const toArabicDef = ARABIC_PARTS[toPlanet as keyof typeof ARABIC_PARTS];
  const toSymbol = toPlanetDef?.symbol || toAsteroidDef?.symbol || toArabicDef?.symbol || toPlanet.charAt(0).toUpperCase();
  const toPlanetName = toPlanetDef?.name || toAsteroidDef?.name || toArabicDef?.name || toPlanet;
  const isTight = asp.aspect.exactOrb < TIGHT_ORB_THRESHOLD;

  // Get interpretation — synastry-flavored text only fits cross-chart (synastry) context;
  // for natal/transit, fall back to the natal corpus and skip the synastry sign-aspect lookup.
  const thisPlanetSign = data.sign;
  const partnerPlanetSign = partnerChart?.planets[toPlanet]?.sign;
  let interpretation: { title: string; description: string; isPositive: boolean } | null = null;

  if (interpretContext === 'synastry' && thisPlanetSign && partnerPlanetSign) {
    interpretation = getSignAspectInterpretation(planet, thisPlanetSign, toPlanet, partnerPlanetSign, asp.aspect.type) ?? null;
  }
  if (!interpretation) {
    interpretation = getAspectInterpretation(planet, toPlanet, asp.aspect.type, interpretContext) ?? null;
  }

  // Classify aspect type
  const aspectCategory = ['conjunction', 'trine', 'sextile'].includes(asp.aspect.type)
    ? 'Harmonious'
    : ['opposition', 'square'].includes(asp.aspect.type)
      ? 'Tense'
      : 'Minor';

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 70px 1fr 60px 60px',
        padding: '8px 12px',
        borderBottom: isLast ? 'none' : `1px solid ${COLORS.gridLine}10`,
        alignItems: 'center',
        backgroundColor: isTight ? 'rgba(168,85,247,0.04)' : 'transparent',
      }}>
        {/* From */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14, color: fromColor }}>{fromSymbol}</span>
          <span style={{ fontSize: 11, color: COLORS.textPrimary }}>{fromName}</span>
        </div>

        {/* Aspect */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 'bold', color: asp.aspect.color }}>{asp.aspect.symbol}</span>
          <span style={{ fontSize: 9, color: asp.aspect.color, textTransform: 'capitalize' }}>{asp.aspect.name}</span>
        </div>

        {/* To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14, color: toColor }}>{toSymbol}</span>
          <span style={{ fontSize: 11, color: COLORS.textPrimary }}>{toPlanetName}</span>
          <span style={{ fontSize: 9, color: toColor }}>({toLabel})</span>
        </div>

        {/* Type */}
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
            backgroundColor: aspectCategory === 'Harmonious' ? 'rgba(34,197,94,0.1)'
              : aspectCategory === 'Tense' ? 'rgba(239,68,68,0.1)'
              : 'rgba(168,85,247,0.1)',
            color: aspectCategory === 'Harmonious' ? '#22c55e'
              : aspectCategory === 'Tense' ? '#ef4444'
              : '#a855f7',
          }}>
            {aspectCategory}
          </span>
        </div>

        {/* Orb */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <span style={{
              fontSize: 11, fontVariantNumeric: 'tabular-nums',
              color: isTight ? '#7c3aed' : COLORS.textMuted,
              fontWeight: isTight ? 600 : 400,
            }}>
              {asp.aspect.exactOrb.toFixed(2)}°
            </span>
            {asp.aspect.isApplying !== undefined && (
              <span style={{
                fontSize: 7, fontWeight: 600,
                color: asp.aspect.isApplying ? '#3b82f6' : COLORS.textMuted,
                textTransform: 'uppercase',
              }}>
                {asp.aspect.isApplying ? 'App' : 'Sep'}
              </span>
            )}
            {isTight && (
              <span style={{
                fontSize: 7, fontWeight: 700, color: '#fff', backgroundColor: '#7c3aed',
                padding: '0px 3px', borderRadius: 2,
                textTransform: 'uppercase',
              }}>
                Tight
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interpretation row (collapsed under aspect) */}
      {interpretation && (
        <div style={{
          padding: '6px 12px 10px',
          borderBottom: isLast ? 'none' : `1px solid ${COLORS.gridLine}10`,
          backgroundColor: `${COLORS.gridLine}05`,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, marginBottom: 2,
            color: interpretation.isPositive ? '#22c55e' : '#ef4444',
          }}>
            {interpretation.title}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.5 }}>
            {interpretation.description}
          </div>
        </div>
      )}
    </>
  );
}
