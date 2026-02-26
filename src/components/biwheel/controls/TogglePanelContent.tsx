/**
 * Toggle Panel Content
 * Extracted content from TogglePanel for reuse in mobile drawer
 */

import React, { useState } from 'react';
import {
  PLANETS,
  ASPECTS,
  COLORS,
  ASTEROIDS,
  ARABIC_PARTS,
  ASTEROID_GROUP_INFO,
  getThemeAwarePlanetColor,
} from '../utils/constants';
import type { AspectType } from '../utils/aspectCalculations';
import type { ChartMode, AsteroidGroup } from '../types';
import { ASTEROID_GROUPS } from '../types';
import { THEMES, THEME_LABELS, type ThemeName } from '../utils/themes';

interface TogglePanelContentProps {
  visiblePlanets: Set<string>;
  visibleAspects: Set<AspectType>;
  showHouses: boolean;
  showDegreeMarkers: boolean;
  showRetrogrades: boolean;
  onTogglePlanet: (planet: string) => void;
  onToggleAspect: (aspect: AspectType) => void;
  onSetShowHouses: (show: boolean) => void;
  onSetShowDegreeMarkers: (show: boolean) => void;
  onSetShowRetrogrades: (show: boolean) => void;
  onEnablePlanetGroup: (group: 'core' | 'outer' | 'asteroids') => void;
  onDisablePlanetGroup: (group: 'core' | 'outer' | 'asteroids') => void;
  onEnableMinorAspects: () => void;
  onDisableMinorAspects: () => void;
  // Transit controls
  enableTransits?: boolean;
  showTransits?: boolean;
  transitDate?: string;
  transitLoading?: boolean;
  onSetShowTransits?: (show: boolean) => void;
  onSetTransitDate?: (date: string) => void;
  // Chart mode controls
  enableComposite?: boolean;
  chartMode?: ChartMode;
  compositeLoading?: boolean;
  onSetChartMode?: (mode: ChartMode) => void;
  nameA?: string;
  nameB?: string;
  // Rotation controls
  rotateToAscendant?: boolean;
  onSetRotateToAscendant?: (rotate: boolean) => void;
  // Mobile mode
  isMobile?: boolean;
  // Theme controls
  chartTheme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
  // Asteroid group controls
  enableAsteroids?: boolean;
  enabledAsteroidGroups?: Set<AsteroidGroup>;
  onToggleAsteroidGroup?: (group: AsteroidGroup) => void;
  onEnableAllAsteroids?: () => void;
  onDisableAllAsteroids?: () => void;
  // Progressed chart controls
  enableProgressed?: boolean;
  progressedPerson?: 'A' | 'B' | 'both' | null;
  progressedDate?: string;
  progressedLoading?: boolean;
  showSolarArc?: boolean;
  onSetProgressedPerson?: (person: 'A' | 'B' | 'both' | null) => void;
  onSetProgressedDate?: (date: string) => void;
  onSetShowSolarArc?: (show: boolean) => void;
  // Relocated chart controls
  enableRelocated?: boolean;
  relocatedPerson?: 'A' | 'B' | 'both' | null;
  relocatedLoading?: boolean;
  onSetRelocatedPerson?: (person: 'A' | 'B' | 'both' | null) => void;
  onOpenLocationPicker?: () => void;
  // Save defaults
  onSaveDefaults?: () => void;
}

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  isMobile?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, defaultOpen = true, children, isMobile }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: isMobile ? 16 : 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '10px 0' : '6px 0',
          background: 'none',
          border: 'none',
          borderBottom: `1px solid ${COLORS.gridLineFaint}`,
          color: COLORS.textPrimary,
          cursor: 'pointer',
          fontSize: isMobile ? 14 : 12,
          fontWeight: 600,
          textAlign: 'left',
        }}
      >
        {title}
        <span style={{ fontSize: isMobile ? 12 : 10 }}>{open ? '▼' : '▶'}</span>
      </button>
      {open && <div style={{ paddingTop: isMobile ? 12 : 8 }}>{children}</div>}
    </div>
  );
};

/** Mini SVG biwheel preview for a theme */
const ThemePreviewMini: React.FC<{ theme: ThemeName; size?: number }> = ({ theme, size = 36 }) => {
  const t = THEMES[theme];
  const r = size / 2;
  const cx = r;
  const cy = r;
  const outerR = r - 1;
  const innerR = outerR * 0.55;
  const midR = outerR * 0.75;
  const elements = ['fire', 'earth', 'air', 'water'] as const;
  const segAngle = 30;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={outerR} fill={t.background} stroke={t.gridLine} strokeWidth={0.8} />
      {Array.from({ length: 12 }).map((_, i) => {
        const el = elements[i % 4];
        const startAngle = (i * segAngle - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * segAngle - 90) * (Math.PI / 180);
        const x1o = cx + outerR * Math.cos(startAngle);
        const y1o = cy + outerR * Math.sin(startAngle);
        const x2o = cx + outerR * Math.cos(endAngle);
        const y2o = cy + outerR * Math.sin(endAngle);
        const x1m = cx + midR * Math.cos(startAngle);
        const y1m = cy + midR * Math.sin(startAngle);
        const x2m = cx + midR * Math.cos(endAngle);
        const y2m = cy + midR * Math.sin(endAngle);
        return (
          <path
            key={i}
            d={`M${x1m},${y1m} L${x1o},${y1o} A${outerR},${outerR} 0 0,1 ${x2o},${y2o} L${x2m},${y2m} A${midR},${midR} 0 0,0 ${x1m},${y1m}`}
            fill={t.elementBg[el]}
            stroke={t.gridLineFaint}
            strokeWidth={0.3}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={innerR} fill={t.background} stroke={t.gridLineLight} strokeWidth={0.5} />
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle - 90) * (Math.PI / 180);
        return (
          <line key={angle} x1={cx + innerR * Math.cos(rad)} y1={cy + innerR * Math.sin(rad)} x2={cx + midR * Math.cos(rad)} y2={cy + midR * Math.sin(rad)} stroke={t.gridLineLight} strokeWidth={0.4} />
        );
      })}
      {[45, 120, 200, 310].map((angle, i) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const dotR = (midR + outerR) / 2;
        const colors = [t.fire, t.water, t.earth, t.air];
        return <circle key={i} cx={cx + dotR * Math.cos(rad)} cy={cy + dotR * Math.sin(rad)} r={size > 40 ? 1.5 : 1} fill={colors[i]} />;
      })}
    </svg>
  );
};

/** Theme picker dropdown for mobile/content panel */
const ThemePickerMobile: React.FC<{
  chartTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  isMobile?: boolean;
}> = ({ chartTheme, onThemeChange, isMobile = false }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const previewSize = isMobile ? 48 : 36;
  const themes = Object.keys(THEME_LABELS) as ThemeName[];
  const t = THEMES[chartTheme];

  return (
    <div ref={ref} style={{ marginBottom: isMobile ? 16 : 12, position: 'relative' }}>
      <div style={{ fontSize: isMobile ? 12 : 10, color: COLORS.textMuted, marginBottom: 4 }}>Theme</div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px 4px 4px',
          background: COLORS.backgroundAlt2,
          border: `1px solid ${COLORS.gridLineFaint}`,
          borderRadius: 8,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <ThemePreviewMini theme={chartTheme} size={isMobile ? 32 : 28} />
        <span style={{ fontSize: isMobile ? 13 : 11, color: COLORS.textPrimary, fontWeight: 500, flex: 1, textAlign: 'left' }}>
          {THEME_LABELS[chartTheme]}
        </span>
        <span style={{ fontSize: 10, color: COLORS.textMuted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: t.background,
          border: `1px solid ${COLORS.gridLineFaint}`,
          borderRadius: 10,
          padding: 8,
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'grid',
          gridTemplateColumns: `repeat(${isMobile ? 3 : 2}, 1fr)`,
          gap: 6,
        }}>
          {themes.map((themeName) => {
            const isActive = chartTheme === themeName;
            const themeColors = THEMES[themeName];
            return (
              <button
                key={themeName}
                onClick={() => { onThemeChange(themeName); setOpen(false); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: 6,
                  background: isActive ? themeColors.backgroundAlt : 'transparent',
                  border: isActive ? `2px solid ${themeColors.gridLine}` : '2px solid transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <ThemePreviewMini theme={themeName} size={previewSize} />
                <span style={{
                  fontSize: isMobile ? 10 : 9,
                  color: COLORS.textSecondary,
                  fontWeight: isActive ? 700 : 400,
                  lineHeight: 1,
                }}>
                  {THEME_LABELS[themeName]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CheckboxProps {
  label: string;
  symbol?: string;
  checked: boolean;
  onChange: () => void;
  color?: string;
  disabled?: boolean;
  isMobile?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  symbol,
  checked,
  onChange,
  color = COLORS.textSecondary,
  disabled = false,
  isMobile = false,
}) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? 10 : 6,
      padding: isMobile ? '8px 0' : '3px 0',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontSize: isMobile ? 14 : 11,
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: isMobile ? 20 : 14,
        height: isMobile ? 20 : 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        accentColor: color,
      }}
    />
    {symbol && (
      <span style={{ color, fontSize: isMobile ? 18 : 14, width: isMobile ? 24 : 18, textAlign: 'center' }}>
        {symbol}
      </span>
    )}
    <span style={{ color: COLORS.textSecondary }}>{label}</span>
  </label>
);

export const TogglePanelContent: React.FC<TogglePanelContentProps> = ({
  visiblePlanets,
  visibleAspects,
  showHouses,
  showDegreeMarkers,
  showRetrogrades,
  onTogglePlanet,
  onToggleAspect,
  onSetShowHouses,
  onSetShowDegreeMarkers,
  onSetShowRetrogrades,
  onEnablePlanetGroup,
  onDisablePlanetGroup,
  onEnableMinorAspects,
  onDisableMinorAspects,
  // Transit controls
  enableTransits = false,
  showTransits = false,
  transitDate = '',
  transitLoading = false,
  onSetShowTransits,
  onSetTransitDate,
  // Chart mode controls
  enableComposite = false,
  chartMode = 'synastry',
  compositeLoading = false,
  onSetChartMode,
  nameA = 'Person A',
  nameB = 'Person B',
  // Rotation controls
  rotateToAscendant = true,
  onSetRotateToAscendant,
  // Mobile
  isMobile = false,
  // Theme controls
  chartTheme = 'classic',
  onThemeChange,
  // Asteroid group controls
  enableAsteroids = false,
  enabledAsteroidGroups = new Set(),
  onToggleAsteroidGroup,
  onEnableAllAsteroids,
  onDisableAllAsteroids,
  // Progressed controls
  enableProgressed = false,
  progressedPerson = null,
  progressedDate = '',
  progressedLoading = false,
  showSolarArc = false,
  onSetProgressedPerson,
  onSetProgressedDate,
  onSetShowSolarArc,
  // Relocated controls
  enableRelocated = false,
  relocatedPerson = null,
  relocatedLoading = false,
  onSetRelocatedPerson,
  onOpenLocationPicker,
  onSaveDefaults,
}) => {
  const [saveFlash, setSaveFlash] = useState(false);
  const majorAspects = Object.entries(ASPECTS).filter(([_, def]) => def.major);
  const minorAspects = Object.entries(ASPECTS).filter(([_, def]) => !def.major);

  const formatAngle = (angle: number) => {
    const deg = Math.floor(angle);
    const min = Math.round((angle - deg) * 60);
    return min === 0 ? `${deg}\u00B0` : `${deg}\u00B0${min}'`;
  };

  const buttonStyle: React.CSSProperties = {
    padding: isMobile ? '8px 12px' : '3px 8px',
    fontSize: isMobile ? 13 : 10,
    background: COLORS.backgroundAlt2,
    border: `1px solid ${COLORS.gridLineFaint}`,
    borderRadius: 6,
    color: COLORS.textSecondary,
    cursor: 'pointer',
  };

  return (
    <div>
      {/* Theme Picker - Dropdown with mini chart previews */}
      {onThemeChange && (
        <ThemePickerMobile
          chartTheme={chartTheme}
          onThemeChange={onThemeChange}
          isMobile={isMobile}
        />
      )}

      {/* Chart Mode - Transit and Composite controls */}
      {(enableTransits || enableComposite) && (
        <Section title="Chart Mode" defaultOpen={true} isMobile={isMobile}>
          {/* Transit toggle with date picker */}
          {enableTransits && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Checkbox
                  label="Show Transits"
                  checked={showTransits}
                  onChange={() => onSetShowTransits?.(!showTransits)}
                  color="#228B22"
                  isMobile={isMobile}
                />
                {transitLoading && (
                  <span style={{ fontSize: isMobile ? 14 : 10, color: '#228B22' }}>Loading...</span>
                )}
              </div>
              {showTransits && onSetTransitDate && (
                <div style={{ marginTop: 8, marginLeft: isMobile ? 0 : 20 }}>
                  {/* Date navigation buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <button
                      onClick={() => {
                        const d = new Date(transitDate + 'T12:00:00');
                        d.setDate(d.getDate() - 1);
                        onSetTransitDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                      }}
                      style={{
                        ...buttonStyle,
                        color: '#228B22',
                        fontWeight: 'bold',
                      }}
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => {
                        const n = new Date();
                        onSetTransitDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`);
                      }}
                      style={{
                        ...buttonStyle,
                        flex: 1,
                      }}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date(transitDate + 'T12:00:00');
                        d.setDate(d.getDate() + 1);
                        onSetTransitDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                      }}
                      style={{
                        ...buttonStyle,
                        color: '#228B22',
                        fontWeight: 'bold',
                      }}
                    >
                      ▶
                    </button>
                  </div>
                  {/* Date picker */}
                  <input
                    type="date"
                    value={transitDate}
                    onChange={(e) => onSetTransitDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: isMobile ? '10px 12px' : '4px 6px',
                      fontSize: isMobile ? 14 : 11,
                      border: `1px solid ${COLORS.gridLineFaint}`,
                      borderRadius: 6,
                      color: COLORS.textSecondary,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Chart Mode Selector */}
          {enableComposite && onSetChartMode && (
            <div style={{ marginTop: enableTransits ? 12 : 0 }}>
              <div style={{ fontSize: isMobile ? 12 : 10, color: COLORS.textMuted, marginBottom: 8 }}>
                View Mode {compositeLoading && <span style={{ color: COLORS.composite }}>Loading...</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { mode: 'personA' as ChartMode, label: nameA.split(' ')[0], color: COLORS.personA },
                  { mode: 'personB' as ChartMode, label: nameB.split(' ')[0], color: COLORS.personB },
                  { mode: 'synastry' as ChartMode, label: 'Synastry', color: COLORS.gridLineLight },
                  { mode: 'composite' as ChartMode, label: 'Composite', color: COLORS.composite },
                ].map(({ mode, label, color }) => (
                  <button
                    key={mode}
                    onClick={() => onSetChartMode(mode)}
                    style={{
                      padding: isMobile ? '10px 12px' : '5px 8px',
                      fontSize: isMobile ? 13 : 10,
                      background: chartMode === mode ? color : COLORS.backgroundAlt2,
                      color: chartMode === mode ? '#ffffff' : COLORS.textSecondary,
                      border: `1px solid ${chartMode === mode ? color : COLORS.gridLineFaint}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: chartMode === mode ? 600 : 400,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progressed Chart - per person toggles */}
          {enableProgressed && onSetProgressedPerson && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: isMobile ? 12 : 10, color: COLORS.textMuted, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#FFD700', fontWeight: 'bold' }}>P</span> Progressed
                {progressedLoading && <span style={{ fontSize: isMobile ? 12 : 10, color: '#FFD700' }}>Loading...</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(() => {
                  const isProgressedA = progressedPerson === 'A' || progressedPerson === 'both';
                  const isProgressedB = progressedPerson === 'B' || progressedPerson === 'both';
                  return (
                    <>
                      <button
                        onClick={() => {
                          if (isProgressedA) {
                            onSetProgressedPerson(isProgressedB ? 'B' : null);
                          } else {
                            onSetProgressedPerson(isProgressedB ? 'both' : 'A');
                          }
                        }}
                        style={{
                          padding: isMobile ? '10px 12px' : '5px 8px',
                          fontSize: isMobile ? 13 : 10,
                          background: isProgressedA ? '#FFD700' : COLORS.backgroundAlt2,
                          color: isProgressedA ? '#1a1a1a' : COLORS.textSecondary,
                          border: `1px solid ${isProgressedA ? '#FFD700' : COLORS.gridLineFaint}`,
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: isProgressedA ? 600 : 400,
                        }}
                      >
                        P {nameA.split(' ')[0]}
                      </button>
                      <button
                        onClick={() => {
                          if (isProgressedB) {
                            onSetProgressedPerson(isProgressedA ? 'A' : null);
                          } else {
                            onSetProgressedPerson(isProgressedA ? 'both' : 'B');
                          }
                        }}
                        style={{
                          padding: isMobile ? '10px 12px' : '5px 8px',
                          fontSize: isMobile ? 13 : 10,
                          background: isProgressedB ? COLORS.personB : COLORS.backgroundAlt2,
                          color: isProgressedB ? '#ffffff' : COLORS.textSecondary,
                          border: `1px solid ${isProgressedB ? COLORS.personB : COLORS.gridLineFaint}`,
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: isProgressedB ? 600 : 400,
                        }}
                      >
                        P {nameB.split(' ')[0]}
                      </button>
                    </>
                  );
                })()}
              </div>
              {/* Date picker for progressed */}
              {progressedPerson && onSetProgressedDate && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: isMobile ? 11 : 9, color: COLORS.textMuted, marginBottom: 4 }}>
                    Progress to date:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <button
                      onClick={() => {
                        const d = new Date(progressedDate + 'T12:00:00');
                        d.setFullYear(d.getFullYear() - 1);
                        onSetProgressedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                      }}
                      style={{ padding: isMobile ? '8px 12px' : '4px 8px', fontSize: isMobile ? 14 : 12, background: COLORS.backgroundAlt2, border: `1px solid ${COLORS.gridLineFaint}`, borderRadius: 6, cursor: 'pointer', color: '#FFD700', fontWeight: 'bold' }}
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => {
                        const n = new Date();
                        onSetProgressedDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`);
                      }}
                      style={{ flex: 1, padding: isMobile ? '8px 6px' : '4px 6px', fontSize: isMobile ? 13 : 10, background: COLORS.backgroundAlt2, border: `1px solid ${COLORS.gridLineFaint}`, borderRadius: 6, cursor: 'pointer', color: COLORS.textSecondary }}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date(progressedDate + 'T12:00:00');
                        d.setFullYear(d.getFullYear() + 1);
                        onSetProgressedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                      }}
                      style={{ padding: isMobile ? '8px 12px' : '4px 8px', fontSize: isMobile ? 14 : 12, background: COLORS.backgroundAlt2, border: `1px solid ${COLORS.gridLineFaint}`, borderRadius: 6, cursor: 'pointer', color: '#FFD700', fontWeight: 'bold' }}
                    >
                      ▶
                    </button>
                  </div>
                  <input
                    type="date"
                    value={progressedDate}
                    onChange={(e) => onSetProgressedDate(e.target.value)}
                    style={{ width: '100%', padding: isMobile ? '10px 12px' : '4px 6px', fontSize: isMobile ? 14 : 11, border: `1px solid ${COLORS.gridLineFaint}`, borderRadius: 6, color: COLORS.textSecondary }}
                  />
                </div>
              )}
              {/* Solar Arc toggle */}
              {progressedPerson && onSetShowSolarArc && (
                <button
                  onClick={() => onSetShowSolarArc(!showSolarArc)}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    padding: isMobile ? '10px 12px' : '5px 8px',
                    fontSize: isMobile ? 13 : 10,
                    background: showSolarArc ? '#FF8C00' : COLORS.backgroundAlt2,
                    color: showSolarArc ? '#1a1a1a' : COLORS.textSecondary,
                    border: `1px solid ${showSolarArc ? '#FF8C00' : COLORS.gridLineFaint}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: showSolarArc ? 600 : 400,
                  }}
                >
                  Solar Arc {showSolarArc ? 'ON' : 'OFF'}
                </button>
              )}
            </div>
          )}

          {/* Relocated Chart - per person toggles */}
          {enableRelocated && onSetRelocatedPerson && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: isMobile ? 12 : 10, color: COLORS.textMuted, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: COLORS.personA, fontWeight: 'bold' }}>R</span> Relocated
                {relocatedLoading && <span style={{ fontSize: isMobile ? 12 : 10, color: COLORS.personA }}>Loading...</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(() => {
                  const isRelocatedA = relocatedPerson === 'A' || relocatedPerson === 'both';
                  const isRelocatedB = relocatedPerson === 'B' || relocatedPerson === 'both';
                  return (
                    <>
                      <button
                        onClick={() => {
                          if (isRelocatedA) {
                            onSetRelocatedPerson(isRelocatedB ? 'B' : null);
                          } else {
                            onSetRelocatedPerson(isRelocatedB ? 'both' : 'A');
                          }
                        }}
                        style={{
                          padding: isMobile ? '10px 12px' : '5px 8px',
                          fontSize: isMobile ? 13 : 10,
                          background: isRelocatedA ? COLORS.personA : COLORS.backgroundAlt2,
                          color: isRelocatedA ? '#ffffff' : COLORS.textSecondary,
                          border: `1px solid ${isRelocatedA ? COLORS.personA : COLORS.gridLineFaint}`,
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: isRelocatedA ? 600 : 400,
                        }}
                      >
                        R {nameA.split(' ')[0]}
                      </button>
                      <button
                        onClick={() => {
                          if (isRelocatedB) {
                            onSetRelocatedPerson(isRelocatedA ? 'A' : null);
                          } else {
                            onSetRelocatedPerson(isRelocatedA ? 'both' : 'B');
                          }
                        }}
                        style={{
                          padding: isMobile ? '10px 12px' : '5px 8px',
                          fontSize: isMobile ? 13 : 10,
                          background: isRelocatedB ? COLORS.personB : COLORS.backgroundAlt2,
                          color: isRelocatedB ? '#ffffff' : COLORS.textSecondary,
                          border: `1px solid ${isRelocatedB ? COLORS.personB : COLORS.gridLineFaint}`,
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: isRelocatedB ? 600 : 400,
                        }}
                      >
                        R {nameB.split(' ')[0]}
                      </button>
                    </>
                  );
                })()}
              </div>
              {/* Change location button */}
              {(relocatedPerson) && onOpenLocationPicker && (
                <button
                  onClick={onOpenLocationPicker}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    padding: isMobile ? '10px 12px' : '6px 8px',
                    fontSize: isMobile ? 13 : 10,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Pick Location on Map
                </button>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Display Options */}
      <Section title="Display" isMobile={isMobile}>
        <Checkbox
          label="House Cusps"
          checked={showHouses}
          onChange={() => onSetShowHouses(!showHouses)}
          isMobile={isMobile}
        />
        <Checkbox
          label="Degree Markers"
          checked={showDegreeMarkers}
          onChange={() => onSetShowDegreeMarkers(!showDegreeMarkers)}
          isMobile={isMobile}
        />
        <Checkbox
          label="Retrogrades"
          checked={showRetrogrades}
          onChange={() => onSetShowRetrogrades(!showRetrogrades)}
          isMobile={isMobile}
        />
        {onSetRotateToAscendant && (
          <Checkbox
            label="ASC at West"
            checked={rotateToAscendant}
            onChange={() => onSetRotateToAscendant(!rotateToAscendant)}
            color={COLORS.personA}
            isMobile={isMobile}
          />
        )}
      </Section>

      {/* Planets */}
      <Section title="Planets" isMobile={isMobile}>
        {/* Quick toggles */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button onClick={() => onEnablePlanetGroup('core')} style={buttonStyle}>
            Core
          </button>
          <button onClick={() => onEnablePlanetGroup('outer')} style={buttonStyle}>
            +Outer
          </button>
          <button onClick={() => onEnablePlanetGroup('asteroids')} style={buttonStyle}>
            +Asteroids
          </button>
        </div>

        {/* Individual planet toggles - in grid on mobile */}
        <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 } : {}}>
          {Object.entries(PLANETS).map(([key, def]) => (
            <Checkbox
              key={key}
              label={def.name}
              symbol={def.symbol}
              checked={visiblePlanets.has(key)}
              onChange={() => onTogglePlanet(key)}
              color={def.category === 'asteroid' ? '#a78bfa' : COLORS.textSecondary}
              isMobile={isMobile}
            />
          ))}
        </div>
      </Section>

      {/* Aspects */}
      <Section title="Aspects" isMobile={isMobile}>
        {/* Quick toggles */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={onEnableMinorAspects} style={buttonStyle}>
            +Minor
          </button>
          <button onClick={onDisableMinorAspects} style={buttonStyle}>
            Major Only
          </button>
        </div>

        {/* Major aspects */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: isMobile ? 12 : 10, color: COLORS.textMuted }}>Major</span>
        </div>
        <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 } : {}}>
          {majorAspects.map(([key, def]) => (
            <Checkbox
              key={key}
              label={`${def.name} — ${formatAngle(def.angle)}`}
              symbol={def.symbol}
              checked={visibleAspects.has(key as AspectType)}
              onChange={() => onToggleAspect(key as AspectType)}
              color={def.color}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Minor aspects */}
        <div style={{ marginTop: 12, marginBottom: 8 }}>
          <span style={{ fontSize: isMobile ? 12 : 10, color: COLORS.textMuted }}>Minor</span>
        </div>
        <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 } : {}}>
          {minorAspects.map(([key, def]) => (
            <Checkbox
              key={key}
              label={`${def.name} — ${formatAngle(def.angle)}`}
              symbol={def.symbol}
              checked={visibleAspects.has(key as AspectType)}
              onChange={() => onToggleAspect(key as AspectType)}
              color={def.color}
              isMobile={isMobile}
            />
          ))}
        </div>
      </Section>

      {/* Extended Asteroids */}
      {enableAsteroids && onToggleAsteroidGroup && (
        <Section title="Extended Asteroids" defaultOpen={false} isMobile={isMobile}>
          {/* Quick toggles */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button onClick={onEnableAllAsteroids} style={buttonStyle}>
              All
            </button>
            <button onClick={onDisableAllAsteroids} style={buttonStyle}>
              Clear
            </button>
          </div>

          {/* Group toggle buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr', gap: 6, marginBottom: 12 }}>
            {(Object.entries(ASTEROID_GROUP_INFO) as [AsteroidGroup, { name: string; color: string; icon: string }][]).map(([groupKey, info]) => {
              const isEnabled = enabledAsteroidGroups.has(groupKey);
              const groupPlanets = ASTEROID_GROUPS[groupKey] || [];
              return (
                <button
                  key={groupKey}
                  onClick={() => onToggleAsteroidGroup(groupKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: isMobile ? '10px 12px' : '6px 8px',
                    fontSize: isMobile ? 13 : 11,
                    background: isEnabled ? info.color + '20' : COLORS.backgroundAlt2,
                    color: isEnabled ? info.color : COLORS.textSecondary,
                    border: `1px solid ${isEnabled ? info.color + '60' : COLORS.gridLineFaint}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: isEnabled ? 600 : 400,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: isMobile ? 16 : 14 }}>{info.icon}</span>
                  <span style={{ flex: 1 }}>{info.name}</span>
                  <span style={{ fontSize: isMobile ? 11 : 9, opacity: 0.6 }}>{groupPlanets.length}</span>
                </button>
              );
            })}
          </div>

          {/* Individual asteroid checkboxes by group */}
          {(Object.entries(ASTEROID_GROUP_INFO) as [AsteroidGroup, { name: string; color: string; icon: string }][]).map(([groupKey, groupInfo]) => {
            const groupAsteroids = [
              ...Object.entries(ASTEROIDS).filter(([_, def]) => def.group === groupKey),
              ...Object.entries(ARABIC_PARTS).filter(([_, def]) => def.group === groupKey),
            ];
            if (groupAsteroids.length === 0) return null;
            return (
              <div key={groupKey} style={{ marginBottom: 8 }}>
                <div style={{
                  fontSize: isMobile ? 12 : 9,
                  color: groupInfo.color,
                  marginBottom: 4,
                  fontWeight: 600,
                }}>
                  {groupInfo.icon} {groupInfo.name}
                </div>
                <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 } : {}}>
                  {groupAsteroids.map(([key, def]) => (
                    <Checkbox
                      key={key}
                      label={def.name}
                      checked={visiblePlanets.has(key)}
                      onChange={() => onTogglePlanet(key)}
                      color={def.color}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {/* Save as Default button */}
      {onSaveDefaults && (
        <div style={{ marginTop: isMobile ? 16 : 12, paddingTop: 12, borderTop: `1px solid ${COLORS.gridLineFaint}` }}>
          <button
            onClick={() => {
              onSaveDefaults();
              setSaveFlash(true);
              setTimeout(() => setSaveFlash(false), 1500);
            }}
            style={{
              width: '100%',
              padding: isMobile ? '12px 0' : '8px 0',
              fontSize: isMobile ? 14 : 12,
              fontWeight: 600,
              color: saveFlash ? '#fff' : COLORS.textPrimary,
              background: saveFlash ? '#22c55e' : COLORS.backgroundAlt,
              border: `1px solid ${COLORS.gridLineFaint}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {saveFlash ? 'Saved!' : 'Save as Default'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TogglePanelContent;
