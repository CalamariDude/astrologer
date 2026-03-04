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
  FIXED_STARS,
  FIXED_STAR_GROUP_INFO,
  ZODIAC_SIGNS,
  PLANET_ORBS,
  PLANET_GROUPS,
  getThemeAwarePlanetColor,
} from '../utils/constants';
import type { AspectType } from '../utils/aspectCalculations';
import type { ChartMode, AsteroidGroup, FixedStarGroup, LocationData } from '../types';
import { ASTEROID_GROUPS, FIXED_STAR_GROUPS } from '../types';
import { THEMES, THEME_LABELS, type ThemeName } from '../utils/themes';
import { AYANAMSA_SYSTEMS } from '@/lib/sidereal';
import { TimeInput } from '@/components/ui/TimeInput';

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
  transitTime?: string;
  transitLoading?: boolean;
  onSetShowTransits?: (show: boolean) => void;
  onSetTransitDate?: (date: string) => void;
  onSetTransitTime?: (time: string) => void;
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
  zodiacVantage?: number | null;
  onSetZodiacVantage?: (vantage: number | null) => void;
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
  // Fixed star group controls
  enableFixedStars?: boolean;
  enabledFixedStarGroups?: Set<FixedStarGroup>;
  onToggleFixedStarGroup?: (group: FixedStarGroup) => void;
  onEnableAllFixedStars?: () => void;
  onDisableAllFixedStars?: () => void;
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
  relocatedLocationA?: LocationData | null;
  relocatedLocationB?: LocationData | null;
  onSetRelocatedPerson?: (person: 'A' | 'B' | 'both' | null) => void;
  onOpenLocationPicker?: (person: 'A' | 'B') => void;
  // Display toggles
  showDecans?: boolean;
  onSetShowDecans?: (show: boolean) => void;
  degreeSymbolMode?: 'sign' | 'spark';
  onSetDegreeSymbolMode?: (mode: 'sign' | 'spark') => void;
  // Aspect line display options
  straightAspects?: boolean;
  onSetStraightAspects?: (straight: boolean) => void;
  showEffects?: boolean;
  onSetShowEffects?: (show: boolean) => void;
  // Birth time shift (wheel-time knobs)
  enableBirthTimeShift?: boolean;
  showBirthTimeShift?: boolean;
  onSetShowBirthTimeShift?: (show: boolean) => void;
  // House system
  houseSystem?: string;
  onSetHouseSystem?: (system: string) => void;
  // Custom orbs
  customAspectOrbs?: Record<string, number>;
  customPlanetOrbs?: Record<string, number>;
  onSetCustomAspectOrb?: (aspect: string, orb: number) => void;
  onSetCustomPlanetOrb?: (planet: string, orb: number) => void;
  onResetOrbs?: () => void;
  // Harmonic charts
  harmonicNumber?: number;
  onSetHarmonicNumber?: (n: number) => void;
  // Sidereal zodiac
  zodiacType?: 'tropical' | 'sidereal';
  onSetZodiacType?: (type: 'tropical' | 'sidereal') => void;
  ayanamsaKey?: string;
  onSetAyanamsaKey?: (key: string) => void;
  // Presets
  presets?: { id: string; name: string }[];
  activePresetId?: string | null;
  onLoadPreset?: (id: string) => void;
  onDeletePreset?: (id: string) => void;
  onSavePreset?: (name: string) => void;
  presetsAtLimit?: boolean;
  // Save current settings as default
  onSaveAsDefault?: () => void;
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
  transitTime = '',
  transitLoading = false,
  onSetShowTransits,
  onSetTransitDate,
  onSetTransitTime,
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
  zodiacVantage = null,
  onSetZodiacVantage,
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
  // Fixed star group controls
  enableFixedStars = false,
  enabledFixedStarGroups = new Set(),
  onToggleFixedStarGroup,
  onEnableAllFixedStars,
  onDisableAllFixedStars,
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
  relocatedLocationA,
  relocatedLocationB,
  onSetRelocatedPerson,
  onOpenLocationPicker,
  // Display toggles
  showDecans = false,
  onSetShowDecans,
  degreeSymbolMode = 'sign',
  onSetDegreeSymbolMode,
  // Aspect line display options
  straightAspects = false,
  onSetStraightAspects,
  showEffects = true,
  onSetShowEffects,
  // Birth time shift (wheel-time knobs)
  enableBirthTimeShift = false,
  showBirthTimeShift = false,
  onSetShowBirthTimeShift,
  // House system
  houseSystem = 'whole_sign',
  onSetHouseSystem,
  // Custom orbs
  customAspectOrbs,
  customPlanetOrbs,
  onSetCustomAspectOrb,
  onSetCustomPlanetOrb,
  onResetOrbs,
  // Harmonic charts
  harmonicNumber = 1,
  onSetHarmonicNumber,
  // Sidereal zodiac
  zodiacType = 'tropical',
  onSetZodiacType,
  ayanamsaKey = 'lahiri',
  onSetAyanamsaKey,
  // Presets
  presets,
  activePresetId,
  onLoadPreset,
  onDeletePreset,
  onSavePreset,
  presetsAtLimit,
  onSaveAsDefault,
}) => {
  const [presetSaveName, setPresetSaveName] = useState('');
  const [showPresetSave, setShowPresetSave] = useState(false);
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

      {/* Chart Mode - Transit, Wheel-Time Knobs, and Composite controls */}
      {(enableTransits || enableComposite || enableBirthTimeShift) && (
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
                    onChange={(e) => {
                      const v = e.target.value;
                      const year = v.split('-')[0];
                      if (year && year.length >= 4) onSetTransitDate(v);
                    }}
                    style={{
                      width: '100%',
                      padding: isMobile ? '10px 12px' : '4px 6px',
                      fontSize: isMobile ? 14 : 11,
                      border: `1px solid ${COLORS.gridLineFaint}`,
                      borderRadius: 6,
                      background: COLORS.backgroundAlt2,
                      color: COLORS.textPrimary,
                      colorScheme: COLORS.background.charAt(1) < '8' ? 'dark' : 'light',
                    }}
                  />
                  {/* Time picker */}
                  {onSetTransitTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <TimeInput
                        value={transitTime}
                        onChange={(v) => onSetTransitTime(v)}
                        unstyled
                        style={{
                          flex: 1,
                          padding: isMobile ? '10px 12px' : '4px 6px',
                          fontSize: isMobile ? 14 : 11,
                          border: `1px solid ${COLORS.gridLineFaint}`,
                          borderRadius: 6,
                          background: COLORS.backgroundAlt2,
                          color: COLORS.textPrimary,
                        }}
                      />
                      <button
                        onClick={() => {
                          const n = new Date();
                          onSetTransitTime(n.toTimeString().slice(0, 5));
                        }}
                        style={{
                          ...buttonStyle,
                        }}
                      >
                        Now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Birth time shift (wheel-time knobs) toggle */}
          {enableBirthTimeShift && (
            <div style={{ marginBottom: 8, marginTop: enableTransits ? 8 : 0 }}>
              <Checkbox
                label="Show Wheel-Time Knobs"
                checked={showBirthTimeShift}
                onChange={() => onSetShowBirthTimeShift?.(!showBirthTimeShift)}
                color="#a78bfa"
                isMobile={isMobile}
              />
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
              {enableComposite ? (
                /* Two charts: show A and B columns */
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
              ) : (
                /* Single chart: one toggle button */
                <button
                  onClick={() => onSetProgressedPerson(progressedPerson ? null : 'A')}
                  style={{
                    width: '100%',
                    padding: isMobile ? '10px 12px' : '5px 8px',
                    fontSize: isMobile ? 13 : 10,
                    background: progressedPerson ? '#FFD700' : COLORS.backgroundAlt2,
                    color: progressedPerson ? '#1a1a1a' : COLORS.textSecondary,
                    border: `1px solid ${progressedPerson ? '#FFD700' : COLORS.gridLineFaint}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: progressedPerson ? 600 : 400,
                  }}
                >
                  Progressed {progressedPerson ? 'ON' : 'OFF'}
                </button>
              )}
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
                    onChange={(e) => {
                      const v = e.target.value;
                      const year = v.split('-')[0];
                      if (year && year.length >= 4) onSetProgressedDate(v);
                    }}
                    style={{ width: '100%', padding: isMobile ? '10px 12px' : '4px 6px', fontSize: isMobile ? 14 : 11, border: `1px solid ${COLORS.gridLineFaint}`, borderRadius: 6, background: COLORS.backgroundAlt2, color: COLORS.textPrimary, colorScheme: COLORS.background.charAt(1) < '8' ? 'dark' : 'light' }}
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
              {enableComposite ? (
                /* Two charts: show A and B toggle + location buttons */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(() => {
                    const isRelocatedA = relocatedPerson === 'A' || relocatedPerson === 'both';
                    const isRelocatedB = relocatedPerson === 'B' || relocatedPerson === 'both';
                    const locNameA = relocatedLocationA?.name;
                    const locNameB = relocatedLocationB?.name;
                    const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n - 1) + '…' : s;
                    return (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
                        </div>
                        {/* Per-person location picker buttons */}
                        {isRelocatedA && onOpenLocationPicker && (
                          <button
                            onClick={() => onOpenLocationPicker('A')}
                            style={{
                              width: '100%',
                              padding: isMobile ? '8px 12px' : '5px 8px',
                              fontSize: isMobile ? 12 : 10,
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                              color: '#1a1a1a',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                          >
                            {locNameA ? `📍 A: ${truncate(locNameA, 25)}` : `📍 Pick Location for ${nameA.split(' ')[0]}`}
                          </button>
                        )}
                        {isRelocatedB && onOpenLocationPicker && (
                          <button
                            onClick={() => onOpenLocationPicker('B')}
                            style={{
                              width: '100%',
                              padding: isMobile ? '8px 12px' : '5px 8px',
                              fontSize: isMobile ? 12 : 10,
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                              color: '#1a1a1a',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                          >
                            {locNameB ? `📍 B: ${truncate(locNameB, 25)}` : `📍 Pick Location for ${nameB.split(' ')[0]}`}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                /* Single chart: one toggle button + location */
                <>
                  <button
                    onClick={() => onSetRelocatedPerson(relocatedPerson ? null : 'A')}
                    style={{
                      width: '100%',
                      padding: isMobile ? '10px 12px' : '5px 8px',
                      fontSize: isMobile ? 13 : 10,
                      background: relocatedPerson ? COLORS.personA : COLORS.backgroundAlt2,
                      color: relocatedPerson ? '#ffffff' : COLORS.textSecondary,
                      border: `1px solid ${relocatedPerson ? COLORS.personA : COLORS.gridLineFaint}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: relocatedPerson ? 600 : 400,
                    }}
                  >
                    Relocated {relocatedPerson ? 'ON' : 'OFF'}
                  </button>
                  {/* Change location button */}
                  {(relocatedPerson) && onOpenLocationPicker && (
                    <button
                      onClick={() => onOpenLocationPicker(relocatedPerson === 'B' ? 'B' : 'A')}
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
                      {(() => {
                        const loc = relocatedPerson === 'B' ? relocatedLocationB : relocatedLocationA;
                        if (loc?.name) {
                          const n = loc.name.length > 25 ? loc.name.slice(0, 24) + '…' : loc.name;
                          return `📍 ${n}`;
                        }
                        return '📍 Pick Location on Map';
                      })()}
                    </button>
                  )}
                </>
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
        {showHouses && onSetHouseSystem && (
          <div style={{ marginLeft: isMobile ? 0 : 20, marginBottom: 8 }}>
            <select
              value={houseSystem}
              onChange={(e) => onSetHouseSystem(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '8px 10px' : '5px 8px',
                fontSize: isMobile ? 14 : 11,
                border: `1px solid ${COLORS.gridLineFaint}`,
                borderRadius: 4,
                color: COLORS.textSecondary,
                background: COLORS.background,
                cursor: 'pointer',
              }}
            >
              <option value="whole_sign">Whole Sign</option>
              <option value="placidus">Placidus</option>
              <option value="koch">Koch</option>
              <option value="equal">Equal</option>
              <option value="campanus">Campanus</option>
              <option value="regiomontanus">Regiomontanus</option>
              <option value="porphyry">Porphyry</option>
              <option value="topocentric">Topocentric</option>
            </select>
          </div>
        )}
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
        {onSetShowDecans && (
          <Checkbox
            label="Decans"
            checked={showDecans}
            onChange={() => onSetShowDecans(!showDecans)}
            isMobile={isMobile}
          />
        )}
        {onSetDegreeSymbolMode && (
          <Checkbox
            label="Degree Glyphs"
            checked={degreeSymbolMode === 'spark'}
            onChange={() => onSetDegreeSymbolMode(degreeSymbolMode === 'spark' ? 'sign' : 'spark')}
            isMobile={isMobile}
          />
        )}
        {onSetStraightAspects && (
          <Checkbox
            label="Straight Lines"
            checked={straightAspects}
            onChange={() => onSetStraightAspects(!straightAspects)}
            isMobile={isMobile}
          />
        )}
        {onSetShowEffects && !isMobile && (
          <Checkbox
            label="Flow Effects"
            checked={showEffects}
            onChange={() => onSetShowEffects(!showEffects)}
            isMobile={isMobile}
          />
        )}
        {onSetRotateToAscendant && (
          <Checkbox
            label="ASC at West"
            checked={rotateToAscendant && zodiacVantage === null}
            onChange={() => {
              if (zodiacVantage !== null) {
                onSetZodiacVantage?.(null);
                onSetRotateToAscendant(true);
              } else {
                onSetRotateToAscendant(!rotateToAscendant);
              }
            }}
            color={COLORS.personA}
            isMobile={isMobile}
          />
        )}
        {onSetZodiacVantage && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: isMobile ? 12 : 10, color: COLORS.textMuted, marginBottom: 4 }}>
              Whole Sign & Fixed ASC (0°Each)
            </div>
            <select
              value={zodiacVantage ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  onSetZodiacVantage(null);
                } else {
                  onSetZodiacVantage(parseInt(val, 10));
                }
              }}
              style={{
                width: '100%',
                padding: isMobile ? '8px 10px' : '5px 8px',
                fontSize: isMobile ? 14 : 11,
                border: `1px solid ${COLORS.gridLineFaint}`,
                borderRadius: 4,
                color: zodiacVantage !== null
                  ? (COLORS.background < '#333' ? '#ffb74d' : COLORS.textSecondary)
                  : COLORS.textSecondary,
                background: zodiacVantage !== null
                  ? (COLORS.background < '#333' ? '#3a2a10' : '#fff3e0')
                  : COLORS.background,
                cursor: 'pointer',
              }}
            >
              <option value="">Original ASC & MC</option>
              {ZODIAC_SIGNS.map((sign, index) => (
                <option key={sign.name} value={index}>
                  0°{sign.name}
                </option>
              ))}
            </select>
            {zodiacVantage !== null && (
              <div style={{
                fontSize: isMobile ? 11 : 9,
                color: COLORS.background < '#333' ? '#ffb74d' : '#e65100',
                marginTop: 4,
                padding: '4px 6px',
                background: COLORS.background < '#333' ? '#3a2a10' : '#fff3e0',
                borderRadius: 4,
              }}>
                0°{ZODIAC_SIGNS[zodiacVantage].name}, Original ASC & MC
              </div>
            )}
          </div>
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

      {/* Orb Settings */}
      {onSetCustomAspectOrb && (
        <Section title="Orb Settings" defaultOpen={false} isMobile={isMobile}>
          {/* Per-aspect orbs */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: isMobile ? 12 : 10, color: COLORS.textMuted, marginBottom: 6 }}>Aspect Orbs</div>
            {Object.entries(ASPECTS).filter(([key]) => visibleAspects.has(key as AspectType)).map(([key, def]) => {
              const current = customAspectOrbs?.[key] ?? def.orb;
              return (
                <div key={key} style={{ marginBottom: isMobile ? 10 : 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: isMobile ? 13 : 11, marginBottom: 2 }}>
                    <span style={{ color: def.color, width: 14, textAlign: 'center' }}>{def.symbol}</span>
                    <span style={{ flex: 1, color: COLORS.textSecondary }}>{def.name}</span>
                    <span style={{ fontSize: isMobile ? 13 : 11, fontWeight: 600, color: COLORS.textPrimary, minWidth: 28, textAlign: 'right' }}>{current}°</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={12}
                    step={0.5}
                    value={current}
                    onChange={(e) => onSetCustomAspectOrb(key, parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: def.color }}
                  />
                </div>
              );
            })}
          </div>
          {/* Per-planet orbs */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: isMobile ? 12 : 10, color: COLORS.textMuted, marginBottom: 6 }}>Planet Orbs</div>
            {[...PLANET_GROUPS.core, ...PLANET_GROUPS.outer].map(key => {
              const info = PLANETS[key as keyof typeof PLANETS];
              if (!info || !visiblePlanets.has(key)) return null;
              const current = customPlanetOrbs?.[key] ?? PLANET_ORBS[key] ?? 3;
              return (
                <div key={key} style={{ marginBottom: isMobile ? 10 : 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: isMobile ? 13 : 11, marginBottom: 2 }}>
                    <span style={{ color: getThemeAwarePlanetColor(key), width: 14, textAlign: 'center' }}>{info.symbol}</span>
                    <span style={{ flex: 1, color: COLORS.textSecondary }}>{info.name}</span>
                    <span style={{ fontSize: isMobile ? 13 : 11, fontWeight: 600, color: COLORS.textPrimary, minWidth: 28, textAlign: 'right' }}>{current}°</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={0.5}
                    value={current}
                    onChange={(e) => onSetCustomPlanetOrb?.(key, parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              );
            })}
          </div>
          {onResetOrbs && (
            <button onClick={onResetOrbs} style={buttonStyle}>
              Reset to Defaults
            </button>
          )}
        </Section>
      )}

      {/* Harmonic Charts */}
      {onSetHarmonicNumber && (
        <Section title="Harmonic Charts" defaultOpen={false} isMobile={isMobile}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: isMobile ? 13 : 11, color: COLORS.textSecondary }}>H</span>
            <input
              type="number"
              min={1}
              max={360}
              value={harmonicNumber}
              onChange={(e) => onSetHarmonicNumber(Math.max(1, Math.min(360, parseInt(e.target.value) || 1)))}
              style={{
                width: 60,
                padding: isMobile ? '6px 8px' : '4px 6px',
                fontSize: isMobile ? 14 : 11,
                border: `1px solid ${COLORS.gridLineFaint}`,
                borderRadius: 4,
                color: COLORS.textPrimary,
                background: COLORS.background,
                textAlign: 'center',
              }}
            />
            {harmonicNumber > 1 && (
              <button onClick={() => onSetHarmonicNumber(1)} style={{ ...buttonStyle, fontSize: isMobile ? 12 : 10 }}>
                Reset
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { v: 1, l: 'H1', d: 'Natal' },
              { v: 5, l: 'H5', d: 'Creativity' },
              { v: 7, l: 'H7', d: 'Inspiration' },
              { v: 9, l: 'H9', d: 'Joy' },
              { v: 12, l: 'H12', d: 'Karma' },
            ].map(h => (
              <button
                key={h.v}
                onClick={() => onSetHarmonicNumber(h.v)}
                title={h.d}
                style={{
                  ...buttonStyle,
                  background: harmonicNumber === h.v ? COLORS.textPrimary : COLORS.backgroundAlt2,
                  color: harmonicNumber === h.v ? COLORS.background : COLORS.textSecondary,
                  fontWeight: harmonicNumber === h.v ? 600 : 400,
                }}
              >
                {h.l}
              </button>
            ))}
          </div>
          {harmonicNumber > 1 && (
            <div style={{ marginTop: 8, fontSize: isMobile ? 11 : 9, color: COLORS.textMuted, padding: '4px 6px', background: COLORS.backgroundAlt, borderRadius: 4 }}>
              Harmonic {harmonicNumber}: each planet longitude × {harmonicNumber} (mod 360°)
            </div>
          )}
        </Section>
      )}

      {/* Sidereal Zodiac */}
      {onSetZodiacType && (
        <Section title="Zodiac System" defaultOpen={false} isMobile={isMobile}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {(['tropical', 'sidereal'] as const).map(type => (
              <button
                key={type}
                onClick={() => onSetZodiacType(type)}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  background: zodiacType === type ? COLORS.textPrimary : COLORS.backgroundAlt2,
                  color: zodiacType === type ? COLORS.background : COLORS.textSecondary,
                  fontWeight: zodiacType === type ? 600 : 400,
                  textTransform: 'capitalize',
                }}
              >
                {type}
              </button>
            ))}
          </div>
          {zodiacType === 'sidereal' && onSetAyanamsaKey && (
            <>
              <div style={{ fontSize: isMobile ? 12 : 10, color: COLORS.textMuted, marginBottom: 4 }}>Ayanamsa</div>
              <select
                value={ayanamsaKey}
                onChange={e => onSetAyanamsaKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '10px 8px' : '5px 6px',
                  fontSize: isMobile ? 13 : 11,
                  background: COLORS.backgroundAlt2,
                  color: COLORS.textPrimary,
                  border: `1px solid ${COLORS.gridLineFaint}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 8,
                }}
              >
                {AYANAMSA_SYSTEMS.map(sys => (
                  <option key={sys.key} value={sys.key}>{sys.name}</option>
                ))}
              </select>
              <div style={{ fontSize: isMobile ? 11 : 9, color: COLORS.textMuted, padding: '4px 6px', background: COLORS.backgroundAlt, borderRadius: 4 }}>
                Sidereal positions shifted by ~{AYANAMSA_SYSTEMS.find(s => s.key === ayanamsaKey)?.epoch2000.toFixed(1) ?? '?'}° ({ayanamsaKey})
              </div>
            </>
          )}
        </Section>
      )}

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

      {/* Fixed Stars */}
      {enableFixedStars && onToggleFixedStarGroup && (
        <Section title="Fixed Stars" defaultOpen={false} isMobile={isMobile}>
          {/* Quick toggles */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button onClick={onEnableAllFixedStars} style={buttonStyle}>
              All
            </button>
            <button onClick={onDisableAllFixedStars} style={buttonStyle}>
              Clear
            </button>
          </div>

          {/* Group toggle buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr', gap: 6, marginBottom: 12 }}>
            {(Object.entries(FIXED_STAR_GROUP_INFO) as [FixedStarGroup, { name: string; color: string; icon: string }][]).map(([groupKey, info]) => {
              const isEnabled = enabledFixedStarGroups.has(groupKey);
              const groupStars = FIXED_STAR_GROUPS[groupKey] || [];
              return (
                <button
                  key={groupKey}
                  onClick={() => onToggleFixedStarGroup(groupKey)}
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
                    textAlign: 'left' as const,
                  }}
                >
                  <span style={{ fontSize: isMobile ? 16 : 14 }}>{info.icon}</span>
                  <span style={{ flex: 1 }}>{info.name}</span>
                  <span style={{ fontSize: isMobile ? 11 : 9, opacity: 0.6 }}>{groupStars.length}</span>
                </button>
              );
            })}
          </div>

          {/* Individual star checkboxes by group */}
          {(Object.entries(FIXED_STAR_GROUP_INFO) as [FixedStarGroup, { name: string; color: string; icon: string }][]).map(([groupKey, groupInfo]) => {
            const groupStars = Object.entries(FIXED_STARS).filter(([_, def]) => def.group === groupKey);
            if (groupStars.length === 0) return null;
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
                  {groupStars.map(([key, def]) => (
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

      {/* Presets management */}
      {presets && onDeletePreset && (
        <Section title="Presets" defaultOpen={true} isMobile={isMobile}>
          {presets.length === 0 ? (
            <div style={{ fontSize: isMobile ? 12 : 11, color: COLORS.textMuted, padding: '4px 0' }}>
              No saved presets. Use the preset bar above the chart to save one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 4 }}>
              {presets.map(p => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '8px 10px' : '5px 8px',
                    borderRadius: 6,
                    background: activePresetId === p.id ? 'var(--primary)' : COLORS.backgroundAlt,
                    color: activePresetId === p.id ? '#fff' : COLORS.textPrimary,
                    fontSize: isMobile ? 13 : 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => onLoadPreset?.(p.id)}
                >
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeletePreset(p.id); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.5,
                      color: activePresetId === p.id ? '#fff' : COLORS.textPrimary,
                    }}
                    title={`Delete "${p.name}"`}
                  >
                    <span style={{ fontSize: isMobile ? 14 : 12, lineHeight: 1 }}>&times;</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Save new preset inline */}
          {onSavePreset && !presetsAtLimit && (
            <div style={{ marginTop: isMobile ? 8 : 6 }}>
              {showPresetSave ? (
                <form
                  style={{ display: 'flex', gap: 4, alignItems: 'center' }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (presetSaveName.trim()) {
                      onSavePreset(presetSaveName.trim());
                      setPresetSaveName('');
                      setShowPresetSave(false);
                    }
                  }}
                >
                  <input
                    type="text"
                    value={presetSaveName}
                    onChange={(e) => setPresetSaveName(e.target.value)}
                    placeholder="Preset name"
                    maxLength={20}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: isMobile ? '6px 8px' : '4px 6px',
                      fontSize: isMobile ? 13 : 11,
                      border: `1px solid ${COLORS.gridLineFaint}`,
                      borderRadius: 6,
                      background: COLORS.background,
                      color: COLORS.textPrimary,
                      outline: 'none',
                    }}
                    onKeyDown={(e) => { if (e.key === 'Escape') { setShowPresetSave(false); setPresetSaveName(''); } }}
                  />
                  <button
                    type="submit"
                    disabled={!presetSaveName.trim()}
                    style={{
                      padding: isMobile ? '6px 10px' : '4px 8px',
                      fontSize: isMobile ? 12 : 11,
                      fontWeight: 600,
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: presetSaveName.trim() ? 'pointer' : 'default',
                      opacity: presetSaveName.trim() ? 1 : 0.5,
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPresetSave(false); setPresetSaveName(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: COLORS.textMuted }}
                  >
                    &times;
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowPresetSave(true)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '8px 0' : '6px 0',
                    fontSize: isMobile ? 12 : 11,
                    fontWeight: 500,
                    color: COLORS.textMuted,
                    background: 'none',
                    border: `1px dashed ${COLORS.gridLineFaint}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  + Save Current as Preset
                </button>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Save as Default */}
      {onSaveAsDefault && (
        <div style={{ marginTop: 8, marginBottom: 12, paddingTop: 8, borderTop: `1px solid ${COLORS.gridLineFaint}` }}>
          <button
            onClick={onSaveAsDefault}
            style={{
              width: '100%',
              padding: isMobile ? '10px 8px' : '6px 8px',
              fontSize: isMobile ? 13 : 11,
              fontWeight: 600,
              background: COLORS.backgroundAlt2,
              border: `1px solid ${COLORS.gridLineFaint}`,
              borderRadius: 4,
              color: COLORS.textPrimary,
              cursor: 'pointer',
            }}
          >
            Save as Default
          </button>
          <div style={{ fontSize: isMobile ? 11 : 9, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' }}>
            New charts will use these settings
          </div>
        </div>
      )}

    </div>
  );
};

export default TogglePanelContent;
