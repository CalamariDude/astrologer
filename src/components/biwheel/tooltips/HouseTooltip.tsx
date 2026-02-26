/**
 * House Tooltip
 * Shows house information on hover with keywords organized by lens
 * Houses = Signs in our system (whole sign houses)
 */

import React from 'react';
import { COLORS } from '../utils/constants';
import { formatLongitude } from '../utils/chartMath';
import { SIGN_LENS_KEYWORDS, LENS_CONFIG, LENS_ORDER, HOUSE_TO_SIGN } from '@/data/signKeywords';
import { getTooltipContainerStyle, isTooltipMobile } from './useTooltipStyle';

interface HouseTooltipProps {
  house: number;
  cusp: number; // longitude of house cusp
  chart: 'A' | 'B';
  name: string; // Person's name
  position: { x: number; y: number };
  visible: boolean;
}

// House meanings
const HOUSE_INFO: Record<number, { name: string }> = {
  1:  { name: 'House of Self' },
  2:  { name: 'House of Value' },
  3:  { name: 'House of Communication' },
  4:  { name: 'House of Home' },
  5:  { name: 'House of Pleasure' },
  6:  { name: 'House of Health' },
  7:  { name: 'House of Partnership' },
  8:  { name: 'House of Transformation' },
  9:  { name: 'House of Philosophy' },
  10: { name: 'House of Career' },
  11: { name: 'House of Community' },
  12: { name: 'House of the Unconscious' },
};

// Angular houses (1, 4, 7, 10) are most prominent
const isAngularHouse = (house: number) => [1, 4, 7, 10].includes(house);
const isSuccedentHouse = (house: number) => [2, 5, 8, 11].includes(house);
// Cadent houses: 3, 6, 9, 12

export const HouseTooltip: React.FC<HouseTooltipProps> = ({
  house,
  cusp,
  chart,
  name,
  position,
  visible,
}) => {
  if (!visible) return null;

  const mobile = isTooltipMobile();
  const color = chart === 'A' ? COLORS.personA : COLORS.personB;
  const info = HOUSE_INFO[house];
  const signName = HOUSE_TO_SIGN[house];
  const signData = signName ? SIGN_LENS_KEYWORDS[signName] : null;

  const houseType = isAngularHouse(house)
    ? 'Angular'
    : isSuccedentHouse(house)
    ? 'Succedent'
    : 'Cadent';

  const containerStyle = getTooltipContainerStyle({
    position,
    width: 320,
    height: 500,
    borderColor: color,
    backgroundColor: COLORS.background,
  });

  return (
    <div
      className="house-tooltip"
      style={containerStyle}
    >
      {/* Mobile drag handle */}
      {isTooltipMobile() && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <div style={{ width: 28, height: 3, borderRadius: 2, backgroundColor: COLORS.gridLine }} />
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: mobile ? 7 : 10,
          marginBottom: mobile ? 7 : 10,
          borderBottom: `1px solid ${COLORS.gridLine}`,
          paddingBottom: mobile ? 6 : 8,
        }}
      >
        <div
          style={{
            width: mobile ? 28 : 36,
            height: mobile ? 28 : 36,
            borderRadius: '50%',
            backgroundColor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: mobile ? 14 : 18,
            fontWeight: 'bold',
          }}
        >
          {house}
        </div>
        <div>
          <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: mobile ? 12 : 14 }}>
            {info?.name || `House ${house}`}
            {signName && <span style={{ color: COLORS.textMuted, fontWeight: 400 }}> · {signName}</span>}
          </div>
          <div style={{ color, fontSize: mobile ? 9 : 11 }}>
            {name}
            {signData && <span style={{ color: COLORS.textMuted }}> · {signData.quality}</span>}
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ fontSize: mobile ? 10 : 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <span style={{ color: COLORS.textMuted }}>Cusp</span>
          <span style={{ color: COLORS.textSecondary }}>
            {formatLongitude(cusp)}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span style={{ color: COLORS.textMuted }}>Type</span>
          <span
            style={{
              color: isAngularHouse(house) ? '#7c3aed' : COLORS.textSecondary,
              fontWeight: isAngularHouse(house) ? 600 : 400,
            }}
          >
            {houseType}
          </span>
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
    </div>
  );
};

export default HouseTooltip;
