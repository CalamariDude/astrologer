/**
 * Aspect Tooltip
 * Shows detailed aspect information on click
 */

import React, { useMemo } from 'react';
import { PLANETS, COLORS, ASTEROIDS, ARABIC_PARTS } from '../utils/constants';
import { formatLongitudeShort } from '../utils/chartMath';
import type { SynastryAspect } from '../utils/aspectCalculations';
import {
  getAspectInterpretation,
  getSignAspectInterpretation,
} from '@/lib/interpretationLookup';
import { getTooltipContainerStyle, isTooltipMobile } from './useTooltipStyle';
import { COLORS as THEME_COLORS } from '../utils/constants';

interface AspectTooltipProps {
  aspect: SynastryAspect;
  nameA: string;
  nameB: string;
  signA?: string; // Zodiac sign of planet A
  signB?: string; // Zodiac sign of planet B
  position: { x: number; y: number };
  visible: boolean;
  onClose?: () => void; // Optional - if provided, shows close button
  interpretContext?: 'synastry' | 'natal'; // defaults to 'synastry' for back-compat
}

export const AspectTooltip: React.FC<AspectTooltipProps> = ({
  aspect,
  nameA,
  nameB,
  signA,
  signB,
  position,
  visible,
  onClose,
  interpretContext = 'synastry',
}) => {
  const interpretation = useMemo(() => {
    const aspectName = aspect.aspect.type;

    if (interpretContext === 'synastry' && signA && signB) {
      const signSpecific = getSignAspectInterpretation(
        aspect.planetA,
        signA,
        aspect.planetB,
        signB,
        aspectName
      );
      if (signSpecific) {
        return {
          title: signSpecific.title,
          description: signSpecific.description,
          isPositive: signSpecific.isPositive,
          isSignSpecific: true,
        };
      }
    }

    const generic = getAspectInterpretation(aspect.planetA, aspect.planetB, aspectName, interpretContext);
    if (generic) {
      return {
        title: generic.title,
        description: generic.description,
        isPositive: generic.isPositive,
        isSignSpecific: false,
      };
    }

    return null;
  }, [aspect.planetA, aspect.planetB, aspect.aspect.type, signA, signB, interpretContext]);

  if (!visible || !aspect) return null;

  const mobile = isTooltipMobile();
  const planetADef = PLANETS[aspect.planetA as keyof typeof PLANETS];
  const planetBDef = PLANETS[aspect.planetB as keyof typeof PLANETS];
  const asteroidADef = ASTEROIDS[aspect.planetA as keyof typeof ASTEROIDS];
  const asteroidBDef = ASTEROIDS[aspect.planetB as keyof typeof ASTEROIDS];
  const arabicADef = ARABIC_PARTS[aspect.planetA as keyof typeof ARABIC_PARTS];
  const arabicBDef = ARABIC_PARTS[aspect.planetB as keyof typeof ARABIC_PARTS];

  const symbolA = planetADef?.symbol || asteroidADef?.symbol || arabicADef?.symbol || aspect.planetA.charAt(0).toUpperCase();
  const symbolB = planetBDef?.symbol || asteroidBDef?.symbol || arabicBDef?.symbol || aspect.planetB.charAt(0).toUpperCase();
  const nameAPlanet = planetADef?.name || asteroidADef?.name || arabicADef?.name || aspect.planetA;
  const nameBPlanet = planetBDef?.name || asteroidBDef?.name || arabicBDef?.name || aspect.planetB;

  const natureColor =
    aspect.aspect.nature === 'harmonious'
      ? '#22c55e'
      : aspect.aspect.nature === 'challenging'
      ? '#ef4444'
      : '#fbbf24';

  const natureLabel =
    aspect.aspect.nature === 'harmonious'
      ? 'Harmonious'
      : aspect.aspect.nature === 'challenging'
      ? 'Challenging'
      : 'Neutral';

  const tooltipWidth = interpretation ? 340 : 280;

  const containerStyle = getTooltipContainerStyle({
    position,
    width: tooltipWidth,
    height: interpretation ? 380 : 200,
    borderColor: aspect.aspect.color,
    backgroundColor: COLORS.background,
    pinned: !!onClose,
  });

  return (
    <div
      className="aspect-tooltip"
      style={containerStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mobile drag handle */}
      {isTooltipMobile() && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <div style={{ width: 28, height: 3, borderRadius: 2, backgroundColor: THEME_COLORS.gridLine }} />
        </div>
      )}

      {/* Close button - only if onClose provided */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
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
      )}

      {/* Aspect header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: mobile ? 8 : 12,
          marginBottom: mobile ? 8 : 12,
        }}
      >
        {/* Planet A */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: mobile ? 18 : 24, color: COLORS.personA }}>{symbolA}</div>
          <div style={{ fontSize: mobile ? 10 : 11, color: COLORS.personA }}>{nameAPlanet}</div>
          <div style={{ fontSize: mobile ? 8 : 9, color: COLORS.textMuted }}>{nameA}</div>
        </div>

        {/* Aspect symbol */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: mobile ? 16 : 22, color: aspect.aspect.color }}>
            {aspect.aspect.symbol}
          </div>
          <div style={{ fontSize: mobile ? 9 : 11, color: aspect.aspect.color }}>
            {aspect.aspect.name}
          </div>
        </div>

        {/* Planet B */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: mobile ? 18 : 24, color: COLORS.personB }}>{symbolB}</div>
          <div style={{ fontSize: mobile ? 10 : 11, color: COLORS.personB }}>{nameBPlanet}</div>
          <div style={{ fontSize: mobile ? 8 : 9, color: COLORS.textMuted }}>{nameB}</div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: `1px solid ${COLORS.gridLine}`,
          margin: '10px 0',
        }}
      />

      {/* Details */}
      <div style={{ fontSize: mobile ? 10 : 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <span style={{ color: COLORS.textMuted }}>Orb</span>
          <span style={{ color: COLORS.textSecondary }}>
            {aspect.aspect.exactOrb.toFixed(2)}°
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <span style={{ color: COLORS.textMuted }}>Strength</span>
          <span style={{ color: COLORS.textSecondary }}>
            {Math.round(aspect.aspect.strength * 100)}%
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <span style={{ color: COLORS.textMuted }}>Nature</span>
          <span style={{ color: natureColor }}>{natureLabel}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: COLORS.textMuted }}>Positions</span>
          <span style={{ color: COLORS.textSecondary }}>
            {formatLongitudeShort(aspect.longA)} — {formatLongitudeShort(aspect.longB)}
          </span>
        </div>
      </div>

      {/* Interpretation Section */}
      <div
        style={{
          borderTop: `1px solid ${COLORS.gridLine}`,
          margin: '12px 0',
        }}
      />

      {interpretation ? (
        <>
          {/* Sign-specific badge */}
          {interpretation.isSignSpecific && signA && signB && (
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
              {signA} — {signB}
            </div>
          )}

          {/* Title */}
          <div style={{
            fontSize: mobile ? 12 : 14,
            fontWeight: 600,
            color: interpretation.isPositive ? '#22c55e' : '#ef4444',
            marginBottom: mobile ? 5 : 8
          }}>
            {interpretation.title}
          </div>

          {/* Description */}
          <div style={{
            fontSize: mobile ? 10 : 12,
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
          fontStyle: 'italic'
        }}>
          {nameAPlanet} {aspect.aspect.name} {nameBPlanet}
          <br />
          <span style={{ fontSize: 10, opacity: 0.7 }}>
            (No detailed interpretation available for this combination)
          </span>
        </div>
      )}
    </div>
  );
};

export default AspectTooltip;
