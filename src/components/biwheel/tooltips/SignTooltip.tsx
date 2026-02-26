/**
 * Sign Tooltip
 * Shows zodiac sign information on hover with keywords organized by lens
 */

import React from 'react';
import { COLORS, getElementColor } from '../utils/constants';
import { SIGN_LENS_KEYWORDS, LENS_CONFIG, LENS_ORDER } from '@/data/signKeywords';
import { getTooltipContainerStyle, isTooltipMobile } from './useTooltipStyle';

interface SignTooltipProps {
  sign: {
    name: string;
    symbol: string;
    element: string;
    modality: string;
    ruler: string;
    dates: string;
  };
  position: { x: number; y: number };
  visible: boolean;
  onClose?: () => void; // If provided, shows close button (pinned mode)
}

// Element descriptions
const ELEMENT_DESCRIPTIONS: Record<string, string> = {
  fire: 'Passionate, dynamic, temperamental',
  earth: 'Grounded, practical, stable',
  air: 'Intellectual, communicative, social',
  water: 'Emotional, intuitive, sensitive',
};

// Modality descriptions
const MODALITY_DESCRIPTIONS: Record<string, string> = {
  cardinal: 'Initiative, leadership, action',
  fixed: 'Stability, determination, persistence',
  mutable: 'Adaptability, flexibility, change',
};

export const SignTooltip: React.FC<SignTooltipProps> = ({
  sign,
  position,
  visible,
  onClose,
}) => {
  if (!visible) return null;

  const elementColor = getElementColor(sign.element);
  const signData = SIGN_LENS_KEYWORDS[sign.name];

  const containerStyle = getTooltipContainerStyle({
    position,
    width: 320,
    height: 500,
    borderColor: elementColor,
    backgroundColor: COLORS.background,
    pinned: !!onClose,
  });

  return (
    <div
      className="sign-tooltip"
      style={containerStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mobile drag handle */}
      {isTooltipMobile() && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.gridLine }} />
        </div>
      )}

      {/* Close button - only if pinned */}
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

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
          borderBottom: `1px solid ${COLORS.gridLine}`,
          paddingBottom: 8,
        }}
      >
        <span style={{ fontSize: 28, color: elementColor }}>{sign.symbol}</span>
        <div>
          <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 16 }}>
            {sign.name}
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: 11 }}>
            {sign.dates} {signData && <span style={{ color: elementColor }}>· {signData.quality}</span>}
          </div>
        </div>
      </div>

      {/* Element & Modality & Ruler - compact row */}
      <div style={{ fontSize: 11, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ color: COLORS.textMuted }}>Element</span>
          <span style={{ color: elementColor, fontWeight: 500, textTransform: 'capitalize' }}>{sign.element}</span>
        </div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 6 }}>
          {ELEMENT_DESCRIPTIONS[sign.element]}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ color: COLORS.textMuted }}>Modality</span>
          <span style={{ color: COLORS.textSecondary, textTransform: 'capitalize' }}>{sign.modality}</span>
        </div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 6 }}>
          {MODALITY_DESCRIPTIONS[sign.modality]}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: COLORS.textMuted }}>Ruler</span>
          <span style={{ color: COLORS.textSecondary }}>{sign.ruler}</span>
        </div>
      </div>

      {/* Keywords by Lens */}
      {signData && (
        <div
          style={{
            borderTop: `1px solid ${COLORS.gridLine}`,
            paddingTop: 8,
          }}
        >
          {LENS_ORDER.map((lens) => {
            const keywords = signData.lenses[lens];
            if (!keywords || keywords.length === 0) return null;
            const config = LENS_CONFIG[lens];
            return (
              <div key={lens} style={{ marginBottom: 6 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: config.color,
                    marginBottom: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {config.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.textMuted,
                    lineHeight: 1.4,
                  }}
                >
                  {keywords.join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SignTooltip;
