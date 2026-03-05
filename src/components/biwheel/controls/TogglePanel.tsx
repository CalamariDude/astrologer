/**
 * Toggle Panel
 * Collapsible sidebar for planet and aspect visibility controls
 */

import React, { useState } from 'react';
import {
  PLANETS,
  ASPECTS,
  PLANET_GROUPS,
  COLORS,
  ASTEROID_GROUP_INFO,
  ASTEROIDS,
  ARABIC_PARTS,
  FIXED_STARS,
  FIXED_STAR_GROUP_INFO,
  ZODIAC_SIGNS,
  PLANET_ORBS,
  getThemeAwarePlanetColor,
} from '../utils/constants';
import type { AspectType } from '../utils/aspectCalculations';
import type { ChartMode, LocationData, AsteroidGroup, FixedStarGroup } from '../types';
import { FIXED_STAR_GROUPS } from '../types';
import { THEMES, THEME_LABELS, type ThemeName } from '../utils/themes';
import { AYANAMSA_SYSTEMS } from '@/lib/sidereal';
import { TimeInput } from '@/components/ui/TimeInput';

// Progressed chart color
const PROGRESSED_COLOR = '#FFD700';

interface TogglePanelProps {
  visiblePlanets: Set<string>;
  visibleAspects: Set<AspectType>;
  showHouses: boolean;
  showDegreeMarkers: boolean;
  showRetrogrades: boolean;
  showDecans: boolean;
  degreeSymbolMode?: 'sign' | 'degree';
  onSetDegreeSymbolMode?: (mode: 'sign' | 'degree') => void;
  onTogglePlanet: (planet: string) => void;
  onToggleAspect: (aspect: AspectType) => void;
  onSetShowHouses: (show: boolean) => void;
  onSetShowDegreeMarkers: (show: boolean) => void;
  onSetShowRetrogrades: (show: boolean) => void;
  onSetShowDecans: (show: boolean) => void;
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
  // Zodiac vantage controls (derived houses view)
  zodiacVantage?: number | null;
  onSetZodiacVantage?: (vantage: number | null) => void;
  // Progressed chart controls
  enableProgressed?: boolean;
  showProgressed?: boolean;
  progressedDate?: string;
  progressedLoading?: boolean;
  progressedPerson?: 'A' | 'B' | 'both' | null;
  onSetShowProgressed?: (show: boolean) => void;
  onSetProgressedDate?: (date: string) => void;
  onSetProgressedPerson?: (person: 'A' | 'B' | 'both' | null) => void;
  // Solar Arc controls
  showSolarArc?: boolean;
  onSetShowSolarArc?: (show: boolean) => void;
  // Relocated chart controls
  enableRelocated?: boolean;
  showRelocated?: boolean;
  relocatedLocationA?: LocationData | null;
  relocatedLocationB?: LocationData | null;
  relocatedLoading?: boolean;
  relocatedPerson?: 'A' | 'B' | 'both' | null;
  originalLocation?: LocationData;
  locationB?: LocationData;
  onSetShowRelocated?: (show: boolean) => void;
  onSetRelocatedPerson?: (person: 'A' | 'B' | 'both' | null) => void;
  onOpenLocationPicker?: (person: 'A' | 'B') => void;
  onResetLocation?: () => void;
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
  // Theme controls
  chartTheme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
  // Aspect line display options
  straightAspects?: boolean;
  onSetStraightAspects?: (straight: boolean) => void;
  showEffects?: boolean;
  onSetShowEffects?: (show: boolean) => void;
  // Solar return controls
  enableSolarReturn?: boolean;
  showSolarReturn?: boolean;
  solarReturnYear?: number;
  solarReturnLoading?: boolean;
  solarReturnData?: { return_date: string; return_time: string; ascendantSign: string } | null;
  onSetShowSolarReturn?: (show: boolean) => void;
  onSetSolarReturnYear?: (year: number) => void;
  // Lunar return controls
  enableLunarReturn?: boolean;
  showLunarReturn?: boolean;
  lunarReturnLoading?: boolean;
  lunarReturnData?: { return_date: string; return_time: string; ascendantSign: string } | null;
  onSetShowLunarReturn?: (show: boolean) => void;
  onSetLunarReturnStartDate?: (date: string) => void;
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
  // Save current settings as default
  onSaveAsDefault?: () => void;
  // Controlled collapsed state (from parent)
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 0',
          background: 'none',
          border: 'none',
          borderBottom: `1px solid ${COLORS.gridLineFaint}`,
          color: COLORS.textPrimary,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          textAlign: 'left',
        }}
      >
        {title}
        <span style={{ fontSize: 10 }}>{open ? '▼' : '▶'}</span>
      </button>
      {open && <div style={{ paddingTop: 8 }}>{children}</div>}
    </div>
  );
};

/** Mini SVG biwheel preview for a theme */
const ThemePreview: React.FC<{ theme: ThemeName; size?: number }> = ({ theme, size = 36 }) => {
  const t = THEMES[theme];
  const r = size / 2;
  const cx = r;
  const cy = r;
  const outerR = r - 1;
  const innerR = outerR * 0.55;
  const midR = outerR * 0.75;
  const elements = ['fire', 'earth', 'air', 'water'] as const;
  // 12 zodiac segments, cycling through elements
  const segAngle = 30;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={outerR} fill={t.background} stroke={t.gridLine} strokeWidth={0.8} />
      {/* Zodiac ring segments */}
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
      {/* Inner circle */}
      <circle cx={cx} cy={cy} r={innerR} fill={t.background} stroke={t.gridLineLight} strokeWidth={0.5} />
      {/* Cross lines for houses */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle - 90) * (Math.PI / 180);
        return (
          <line
            key={angle}
            x1={cx + innerR * Math.cos(rad)}
            y1={cy + innerR * Math.sin(rad)}
            x2={cx + midR * Math.cos(rad)}
            y2={cy + midR * Math.sin(rad)}
            stroke={t.gridLineLight}
            strokeWidth={0.4}
          />
        );
      })}
      {/* Tiny planet dots */}
      {[45, 120, 200, 310].map((angle, i) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const dotR = (midR + outerR) / 2;
        const colors = [t.fire, t.water, t.earth, t.air];
        return (
          <circle
            key={i}
            cx={cx + dotR * Math.cos(rad)}
            cy={cy + dotR * Math.sin(rad)}
            r={size > 40 ? 1.5 : 1}
            fill={colors[i]}
          />
        );
      })}
    </svg>
  );
};

/** Theme picker dropdown with mini chart previews */
const ThemePicker: React.FC<{
  chartTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  isMobile?: boolean;
}> = ({ chartTheme, onThemeChange, isMobile = false }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
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
      {/* Current theme button */}
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
        <ThemePreview theme={chartTheme} size={28} />
        <span style={{ fontSize: isMobile ? 13 : 11, color: COLORS.textPrimary, fontWeight: 500, flex: 1, textAlign: 'left' }}>
          {THEME_LABELS[chartTheme]}
        </span>
        <span style={{ fontSize: 10, color: COLORS.textMuted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {/* Dropdown grid */}
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
                <ThemePreview theme={themeName} size={previewSize} />
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
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  symbol,
  checked,
  onChange,
  color = COLORS.textSecondary,
  disabled = false,
}) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 0',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontSize: 11,
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: 14,
        height: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        accentColor: color,
      }}
    />
    {symbol && (
      <span style={{ color, fontSize: 14, width: 18, textAlign: 'center' }}>
        {symbol}
      </span>
    )}
    <span style={{ color: COLORS.textSecondary }}>{label}</span>
  </label>
);

export const TogglePanel: React.FC<TogglePanelProps> = ({
  visiblePlanets,
  visibleAspects,
  showHouses,
  showDegreeMarkers,
  showRetrogrades,
  showDecans,
  degreeSymbolMode = 'sign',
  onSetDegreeSymbolMode,
  onTogglePlanet,
  onToggleAspect,
  onSetShowHouses,
  onSetShowDegreeMarkers,
  onSetShowRetrogrades,
  onSetShowDecans,
  onEnablePlanetGroup,
  onDisablePlanetGroup,
  onEnableMinorAspects,
  onDisableMinorAspects,
  // Transit controls
  enableTransits = false,
  showTransits = false,
  transitDate = '',
  transitTime = '12:00',
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
  // Zodiac vantage controls
  zodiacVantage = null,
  onSetZodiacVantage,
  // Progressed chart controls
  enableProgressed = false,
  showProgressed = false,
  progressedDate = '',
  progressedLoading = false,
  progressedPerson = null,
  onSetShowProgressed,
  onSetProgressedDate,
  onSetProgressedPerson,
  // Solar Arc controls
  showSolarArc = false,
  onSetShowSolarArc,
  // Relocated chart controls
  enableRelocated = false,
  showRelocated = false,
  relocatedLocationA = null,
  relocatedLocationB = null,
  relocatedLoading = false,
  relocatedPerson = null,
  originalLocation,
  locationB,
  onSetShowRelocated,
  onSetRelocatedPerson,
  onOpenLocationPicker,
  onResetLocation,
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
  // Theme controls
  chartTheme = 'classic',
  onThemeChange,
  // Aspect line display options
  straightAspects = false,
  onSetStraightAspects,
  showEffects = true,
  onSetShowEffects,
  // Solar return controls
  enableSolarReturn = false,
  showSolarReturn = false,
  solarReturnYear = new Date().getFullYear(),
  solarReturnLoading = false,
  solarReturnData = null,
  onSetShowSolarReturn,
  onSetSolarReturnYear,
  // Lunar return controls
  enableLunarReturn = false,
  showLunarReturn = false,
  lunarReturnLoading = false,
  lunarReturnData = null,
  onSetShowLunarReturn,
  onSetLunarReturnStartDate,
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
  // Save current settings as default
  onSaveAsDefault,
  // Controlled collapsed state
  collapsed: collapsedProp,
  onCollapsedChange,
}) => {
  const [collapsedInternal, setCollapsedInternal] = useState(false);
  const collapsed = collapsedProp ?? collapsedInternal;
  const setCollapsed = (v: boolean) => {
    setCollapsedInternal(v);
    onCollapsedChange?.(v);
  };

  // Sync internal state with external showProgressed/showRelocated props
  const isProgressedActive = progressedPerson !== null;
  const isRelocatedActive = relocatedPerson !== null;
  const isProgressedA = progressedPerson === 'A' || progressedPerson === 'both';
  const isProgressedB = progressedPerson === 'B' || progressedPerson === 'both';
  const isRelocatedA = relocatedPerson === 'A' || relocatedPerson === 'both';
  const isRelocatedB = relocatedPerson === 'B' || relocatedPerson === 'both';

  // Handle progressed toggle for person A (independent of B)
  const handleProgressedA = () => {
    if (isProgressedA) {
      // Deselect A, keep B if active
      const next = isProgressedB ? 'B' : null;
      onSetProgressedPerson?.(next);
      if (!next) onSetShowProgressed?.(false);
    } else {
      // Select A, keep B if active
      const next = isProgressedB ? 'both' : 'A';
      onSetProgressedPerson?.(next);
      onSetShowProgressed?.(true);
    }
  };

  // Handle progressed toggle for person B (independent of A)
  const handleProgressedB = () => {
    if (isProgressedB) {
      // Deselect B, keep A if active
      const next = isProgressedA ? 'A' : null;
      onSetProgressedPerson?.(next);
      if (!next) onSetShowProgressed?.(false);
    } else {
      // Select B, keep A if active
      const next = isProgressedA ? 'both' : 'B';
      onSetProgressedPerson?.(next);
      onSetShowProgressed?.(true);
    }
  };

  // Handle relocated toggle for person A (independent of B) — locations persist
  const handleRelocatedA = () => {
    if (isRelocatedA) {
      const next = isRelocatedB ? 'B' : null;
      onSetRelocatedPerson?.(next);
      if (!next) onSetShowRelocated?.(false);
    } else {
      const next = isRelocatedB ? 'both' : 'A';
      onSetRelocatedPerson?.(next);
      onSetShowRelocated?.(true);
      // Auto-open picker if no saved location for A
      if (!relocatedLocationA && onOpenLocationPicker) {
        onOpenLocationPicker('A');
      }
    }
  };

  // Handle relocated toggle for person B (independent of A) — locations persist
  const handleRelocatedB = () => {
    if (isRelocatedB) {
      const next = isRelocatedA ? 'A' : null;
      onSetRelocatedPerson?.(next);
      if (!next) onSetShowRelocated?.(false);
    } else {
      const next = isRelocatedA ? 'both' : 'B';
      onSetRelocatedPerson?.(next);
      onSetShowRelocated?.(true);
      // Auto-open picker if no saved location for B
      if (!relocatedLocationB && onOpenLocationPicker) {
        onOpenLocationPicker('B');
      }
    }
  };

  if (collapsed) {
    return null;
  }

  const majorAspects = Object.entries(ASPECTS).filter(([_, def]) => def.major);
  const minorAspects = Object.entries(ASPECTS).filter(([_, def]) => !def.major);

  const formatAngle = (angle: number) => {
    const deg = Math.floor(angle);
    const min = Math.round((angle - deg) * 60);
    return min === 0 ? `${deg}\u00B0` : `${deg}\u00B0${min}'`;
  };

  return (
    <div
      style={{
        flexShrink: 0,
        width: 200,
        alignSelf: 'stretch',
        position: 'relative',
      }}
    >
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        background: COLORS.background,
        border: `1px solid ${COLORS.gridLineFaint}`,
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 13 }}>
          Chart Options
        </span>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.textMuted,
            cursor: 'pointer',
            fontSize: 14,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Theme Picker - Dropdown with mini chart previews */}
      {onThemeChange && (
        <ThemePicker
          chartTheme={chartTheme}
          onThemeChange={onThemeChange}
        />
      )}

      {/* Chart Mode - Transit, Wheel-Time Knobs, Composite, Progressed, Relocated controls */}
      {(enableTransits || enableSolarReturn || enableLunarReturn || enableComposite || enableProgressed || enableRelocated || enableBirthTimeShift) && (
        <Section title="Chart Mode" defaultOpen={true}>
          {/* Transit toggle with date picker */}
          {enableTransits && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Checkbox
                  label="Show Transits"
                  checked={showTransits}
                  onChange={() => onSetShowTransits?.(!showTransits)}
                  color="#228B22"
                />
                {transitLoading && (
                  <span style={{ fontSize: 10, color: '#228B22' }}>⏳</span>
                )}
              </div>
              {showTransits && onSetTransitDate && (
                <div style={{ marginTop: 6, marginLeft: 20 }}>
                  {/* Date navigation buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <button
                      onClick={() => {
                        const d = new Date(transitDate + 'T12:00:00');
                        d.setDate(d.getDate() - 1);
                        onSetTransitDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        background: COLORS.backgroundAlt2,
                        border: `1px solid ${COLORS.gridLineFaint}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: '#228B22',
                        fontWeight: 'bold',
                      }}
                      title="Previous day"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => {
                        const n = new Date();
                        onSetTransitDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: 10,
                        background: COLORS.backgroundAlt2,
                        border: `1px solid ${COLORS.gridLineFaint}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: COLORS.textSecondary,
                      }}
                      title="Go to today"
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
                        padding: '4px 8px',
                        fontSize: 12,
                        background: COLORS.backgroundAlt2,
                        border: `1px solid ${COLORS.gridLineFaint}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: '#228B22',
                        fontWeight: 'bold',
                      }}
                      title="Next day"
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
                      padding: '4px 6px',
                      fontSize: 11,
                      border: `1px solid ${COLORS.gridLineFaint}`,
                      borderRadius: 4,
                      background: COLORS.background,
                      color: COLORS.textPrimary,
                      colorScheme: COLORS.background.startsWith('#0') || COLORS.background.startsWith('#1') || COLORS.background.startsWith('#2') ? 'dark' : 'light',
                    }}
                  />
                  {/* Time picker */}
                  {onSetTransitTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <TimeInput
                        value={transitTime}
                        onChange={(v) => onSetTransitTime(v)}
                        unstyled
                        style={{
                          flex: 1,
                          padding: '4px 6px',
                          fontSize: 11,
                          border: `1px solid ${COLORS.gridLineFaint}`,
                          borderRadius: 4,
                          background: COLORS.background,
                          color: COLORS.textPrimary,
                        }}
                      />
                      <button
                        onClick={() => {
                          const n = new Date();
                          onSetTransitDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`);
                          onSetTransitTime(n.toTimeString().slice(0, 5));
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: 10,
                          background: COLORS.backgroundAlt2,
                          border: `1px solid ${COLORS.gridLineFaint}`,
                          borderRadius: 4,
                          cursor: 'pointer',
                          color: '#228B22',
                          fontWeight: 'bold',
                        }}
                        title="Set to current date and time"
                      >
                        Now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Solar Return toggle with year navigation */}
          {enableSolarReturn && (
            <div style={{ marginBottom: 8, marginTop: enableTransits ? 8 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Checkbox
                  label="Solar Return"
                  checked={showSolarReturn}
                  onChange={() => onSetShowSolarReturn?.(!showSolarReturn)}
                  color="#DAA520"
                />
                {solarReturnLoading && (
                  <span style={{ fontSize: 10, color: '#DAA520' }}>Loading...</span>
                )}
              </div>
              {showSolarReturn && onSetSolarReturnYear && (
                <div style={{ marginTop: 6, marginLeft: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => onSetSolarReturnYear(solarReturnYear - 1)}
                      style={{
                        padding: '4px 8px', fontSize: 12,
                        background: COLORS.backgroundAlt2, border: `1px solid ${COLORS.gridLineFaint}`,
                        borderRadius: 4, cursor: 'pointer', color: '#DAA520', fontWeight: 'bold',
                      }}
                    >
                      ◀
                    </button>
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}>
                      {solarReturnYear}
                    </span>
                    <button
                      onClick={() => onSetSolarReturnYear(solarReturnYear + 1)}
                      style={{
                        padding: '4px 8px', fontSize: 12,
                        background: COLORS.backgroundAlt2, border: `1px solid ${COLORS.gridLineFaint}`,
                        borderRadius: 4, cursor: 'pointer', color: '#DAA520', fontWeight: 'bold',
                      }}
                    >
                      ▶
                    </button>
                  </div>
                  {solarReturnData && (
                    <div style={{ marginTop: 4, fontSize: 10, color: COLORS.textMuted }}>
                      {solarReturnData.return_date} · {solarReturnData.ascendantSign} Rising
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lunar Return toggle */}
          {enableLunarReturn && (
            <div style={{ marginBottom: 8, marginTop: (enableTransits || enableSolarReturn) ? 8 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Checkbox
                  label="Lunar Return"
                  checked={showLunarReturn}
                  onChange={() => onSetShowLunarReturn?.(!showLunarReturn)}
                  color="#8B8BCD"
                />
                {lunarReturnLoading && (
                  <span style={{ fontSize: 10, color: '#8B8BCD' }}>Loading...</span>
                )}
              </div>
              {showLunarReturn && lunarReturnData && (
                <div style={{ marginTop: 4, marginLeft: 20, fontSize: 10, color: COLORS.textMuted }}>
                  {lunarReturnData.return_date} · {lunarReturnData.ascendantSign} Rising
                </div>
              )}
            </div>
          )}

          {/* Birth time shift (wheel-time knobs) toggle */}
          {enableBirthTimeShift && (
            <div style={{ marginBottom: 8, marginTop: (enableTransits || enableSolarReturn || enableLunarReturn) ? 8 : 0 }}>
              <Checkbox
                label="Show Wheel-Time Knobs"
                checked={showBirthTimeShift}
                onChange={() => onSetShowBirthTimeShift?.(!showBirthTimeShift)}
                color="#a78bfa"
              />
            </div>
          )}

          {/* Chart Mode Selector */}
          {enableComposite && onSetChartMode && (
            <div style={{ marginTop: enableTransits ? 8 : 0 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6 }}>
                Chart Mode {compositeLoading && <span style={{ color: COLORS.composite }}>⏳</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <button
                  onClick={() => onSetChartMode('personA')}
                  style={{
                    padding: '5px 8px',
                    fontSize: 10,
                    background: chartMode === 'personA' ? COLORS.personA : COLORS.backgroundAlt2,
                    color: chartMode === 'personA' ? '#ffffff' : COLORS.textSecondary,
                    border: `1px solid ${chartMode === 'personA' ? COLORS.personA : COLORS.gridLineFaint}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: chartMode === 'personA' ? 600 : 400,
                  }}
                  title={`${nameA}'s natal chart`}
                >
                  {nameA.split(' ')[0]}
                </button>
                <button
                  onClick={() => onSetChartMode('personB')}
                  style={{
                    padding: '5px 8px',
                    fontSize: 10,
                    background: chartMode === 'personB' ? COLORS.personB : COLORS.backgroundAlt2,
                    color: chartMode === 'personB' ? '#ffffff' : COLORS.textSecondary,
                    border: `1px solid ${chartMode === 'personB' ? COLORS.personB : COLORS.gridLineFaint}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: chartMode === 'personB' ? 600 : 400,
                  }}
                  title={`${nameB}'s natal chart`}
                >
                  {nameB.split(' ')[0]}
                </button>
                <button
                  onClick={() => onSetChartMode('synastry')}
                  style={{
                    padding: '5px 8px',
                    fontSize: 10,
                    background: chartMode === 'synastry' ? COLORS.gridLineLight : COLORS.backgroundAlt2,
                    color: chartMode === 'synastry' ? '#ffffff' : COLORS.textSecondary,
                    border: `1px solid ${chartMode === 'synastry' ? COLORS.gridLineLight : COLORS.gridLineFaint}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: chartMode === 'synastry' ? 600 : 400,
                  }}
                  title="Synastry biwheel"
                >
                  Synastry
                </button>
                <button
                  onClick={() => onSetChartMode('composite')}
                  style={{
                    padding: '5px 8px',
                    fontSize: 10,
                    background: chartMode === 'composite' ? COLORS.composite : COLORS.backgroundAlt2,
                    color: chartMode === 'composite' ? '#ffffff' : COLORS.textSecondary,
                    border: `1px solid ${chartMode === 'composite' ? COLORS.composite : COLORS.gridLineFaint}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: chartMode === 'composite' ? 600 : 400,
                  }}
                  title="Composite chart"
                >
                  Composite
                </button>
              </div>
            </div>
          )}

          {/* Progressed Chart - per person toggles */}
          {enableProgressed && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: PROGRESSED_COLOR, fontWeight: 'bold' }}>P</span> Progressed
                {progressedLoading && <span style={{ fontSize: 10, color: PROGRESSED_COLOR }}>⏳</span>}
              </div>
              {enableComposite ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
                <button
                  onClick={handleProgressedA}
                  style={{
                    padding: '5px 8px',
                    fontSize: 10,
                    background: isProgressedA ? PROGRESSED_COLOR : COLORS.backgroundAlt2,
                    color: isProgressedA ? '#1a1a1a' : COLORS.textSecondary,
                    border: `1px solid ${isProgressedA ? PROGRESSED_COLOR : COLORS.gridLineFaint}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: isProgressedA ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={`${nameA}'s progressed chart`}
                >
                  P {nameA.split(' ')[0]}
                </button>
                <button
                  onClick={handleProgressedB}
                  style={{
                    padding: '5px 8px',
                    fontSize: 10,
                    background: isProgressedB ? COLORS.personB : COLORS.backgroundAlt2,
                    color: isProgressedB ? '#ffffff' : COLORS.textSecondary,
                    border: `1px solid ${isProgressedB ? COLORS.personB : COLORS.gridLineFaint}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: isProgressedB ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={`${nameB}'s progressed chart`}
                >
                  P {nameB.split(' ')[0]}
                </button>
              </div>
              ) : (
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => {
                    onSetProgressedPerson?.(progressedPerson ? null : 'A');
                    onSetShowProgressed?.(!progressedPerson);
                  }}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: 10,
                    background: isProgressedA ? PROGRESSED_COLOR : COLORS.backgroundAlt2,
                    color: isProgressedA ? '#1a1a1a' : COLORS.textSecondary,
                    border: `1px solid ${isProgressedA ? PROGRESSED_COLOR : COLORS.gridLineFaint}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: isProgressedA ? 600 : 400,
                  }}
                  title={`${nameA}'s progressed chart`}
                >
                  P {nameA.split(' ')[0]}
                </button>
              </div>
              )}
              {isProgressedActive && onSetProgressedDate && (
                <div>
                  <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 4 }}>
                    Progress to date:
                  </div>
                  {/* Date navigation buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <button
                      onClick={() => {
                        const d = new Date(progressedDate + 'T12:00:00');
                        d.setFullYear(d.getFullYear() - 1);
                        onSetProgressedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        background: COLORS.backgroundAlt2,
                        border: `1px solid ${COLORS.gridLineFaint}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: PROGRESSED_COLOR,
                        fontWeight: 'bold',
                      }}
                      title="Previous year"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => {
                        const n = new Date();
                        onSetProgressedDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: 10,
                        background: COLORS.backgroundAlt2,
                        border: `1px solid ${COLORS.gridLineFaint}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: COLORS.textSecondary,
                      }}
                      title="Go to today"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date(progressedDate + 'T12:00:00');
                        d.setFullYear(d.getFullYear() + 1);
                        onSetProgressedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        background: COLORS.backgroundAlt2,
                        border: `1px solid ${COLORS.gridLineFaint}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: PROGRESSED_COLOR,
                        fontWeight: 'bold',
                      }}
                      title="Next year"
                    >
                      ▶
                    </button>
                  </div>
                  {/* Date picker */}
                  <input
                    type="date"
                    value={progressedDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      const year = v.split('-')[0];
                      if (year && year.length >= 4) onSetProgressedDate(v);
                    }}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: 11,
                      border: `1px solid ${COLORS.gridLineFaint}`,
                      borderRadius: 4,
                      background: COLORS.background,
                      color: COLORS.textPrimary,
                      colorScheme: COLORS.background.startsWith('#0') || COLORS.background.startsWith('#1') || COLORS.background.startsWith('#2') ? 'dark' : 'light',
                    }}
                  />
                </div>
              )}

              {/* Solar Arc toggle - only visible when progressed is active */}
              {isProgressedActive && onSetShowSolarArc && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => onSetShowSolarArc(!showSolarArc)}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: 10,
                      background: showSolarArc ? '#FF8C00' : COLORS.backgroundAlt2,
                      color: showSolarArc ? '#1a1a1a' : COLORS.textSecondary,
                      border: `1px solid ${showSolarArc ? '#FF8C00' : COLORS.gridLineFaint}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: showSolarArc ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                    title="Solar Arc Directions - all planets advance by the Sun's progressed arc"
                  >
                    <span style={{ fontWeight: 'bold' }}>SA</span>
                    Solar Arc {showSolarArc ? 'ON' : 'OFF'}
                  </button>
                  {showSolarArc && (
                    <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' }}>
                      All planets directed by Sun's arc
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Relocated Chart - per person toggles */}
          {enableRelocated && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: COLORS.personA, fontWeight: 'bold' }}>R</span> Relocated
                {relocatedLoading && <span style={{ fontSize: 10, color: COLORS.personA }}>⏳</span>}
              </div>
              {enableComposite ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
                <button
                  onClick={handleRelocatedA}
                  style={{
                    padding: '5px 8px',
                    fontSize: 10,
                    background: isRelocatedA ? COLORS.personA : COLORS.backgroundAlt2,
                    color: isRelocatedA ? '#ffffff' : COLORS.textSecondary,
                    border: `1px solid ${isRelocatedA ? COLORS.personA : COLORS.gridLineFaint}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: isRelocatedA ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={`Relocate ${nameA} to their current location`}
                >
                  R {nameA.split(' ')[0]}
                </button>
                <button
                  onClick={handleRelocatedB}
                  style={{
                    padding: '5px 8px',
                    fontSize: 10,
                    background: isRelocatedB ? COLORS.personB : COLORS.backgroundAlt2,
                    color: isRelocatedB ? '#ffffff' : COLORS.textSecondary,
                    border: `1px solid ${isRelocatedB ? COLORS.personB : COLORS.gridLineFaint}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: isRelocatedB ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={`Relocate ${nameB} to their current location`}
                >
                  R {nameB.split(' ')[0]}
                </button>
              </div>
              ) : (
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => {
                    if (relocatedPerson) {
                      onSetRelocatedPerson?.(null);
                    } else {
                      onSetRelocatedPerson?.('A');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: 10,
                    background: isRelocatedA ? COLORS.personA : COLORS.backgroundAlt2,
                    color: isRelocatedA ? '#ffffff' : COLORS.textSecondary,
                    border: `1px solid ${isRelocatedA ? COLORS.personA : COLORS.gridLineFaint}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: isRelocatedA ? 600 : 400,
                  }}
                  title={`Relocate ${nameA} to their current location`}
                >
                  R {nameA.split(' ')[0]}
                </button>
              </div>
              )}
              {isRelocatedActive && (
                <div>
                  {relocatedLoading ? (
                    <div
                      style={{
                        padding: '6px 8px',
                        fontSize: 10,
                        color: COLORS.textSecondary,
                        textAlign: 'center',
                      }}
                    >
                      Loading relocated chart...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {/* Per-person location info + pick buttons */}
                      {isRelocatedA && onOpenLocationPicker && (
                        <button
                          onClick={() => onOpenLocationPicker('A')}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: 10,
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                            color: '#1a1a1a',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                          }}
                        >
                          {relocatedLocationA
                            ? `📍 A: ${relocatedLocationA.name.length > 20 ? relocatedLocationA.name.slice(0, 19) + '…' : relocatedLocationA.name}`
                            : `📍 Pick Location for ${nameA.split(' ')[0]}`}
                        </button>
                      )}
                      {isRelocatedB && onOpenLocationPicker && (
                        <button
                          onClick={() => onOpenLocationPicker('B')}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: 10,
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                            color: '#1a1a1a',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                          }}
                        >
                          {relocatedLocationB
                            ? `📍 B: ${relocatedLocationB.name.length > 20 ? relocatedLocationB.name.slice(0, 19) + '…' : relocatedLocationB.name}`
                            : `📍 Pick Location for ${nameB.split(' ')[0]}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Display Options */}
      <Section title="Display">
        <Checkbox
          label="House Cusps"
          checked={showHouses}
          onChange={() => onSetShowHouses(!showHouses)}
        />
        {showHouses && onSetHouseSystem && (
          <div style={{ marginLeft: 20, marginBottom: 8 }}>
            <select
              value={houseSystem}
              onChange={(e) => onSetHouseSystem(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px',
                fontSize: 11,
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
        />
        <Checkbox
          label="Retrogrades"
          checked={showRetrogrades}
          onChange={() => onSetShowRetrogrades(!showRetrogrades)}
        />
        <Checkbox
          label="Decans"
          checked={showDecans}
          onChange={() => onSetShowDecans(!showDecans)}
        />
        {onSetDegreeSymbolMode && (
          <Checkbox
            label="Degree Glyphs"
            checked={degreeSymbolMode === 'degree'}
            onChange={() => onSetDegreeSymbolMode(degreeSymbolMode === 'degree' ? 'sign' : 'degree')}
          />
        )}
        {onSetStraightAspects && (
          <Checkbox
            label="Straight Lines"
            checked={straightAspects}
            onChange={() => onSetStraightAspects(!straightAspects)}
          />
        )}
        {onSetShowEffects && (
          <Checkbox
            label="Flow Effects"
            checked={showEffects}
            onChange={() => onSetShowEffects(!showEffects)}
          />
        )}
        {onSetRotateToAscendant && (
          <Checkbox
            label="ASC at West"
            checked={rotateToAscendant && zodiacVantage === null}
            onChange={() => {
              if (zodiacVantage !== null) {
                // Clear vantage and enable ASC rotation
                onSetZodiacVantage?.(null);
                onSetRotateToAscendant(true);
              } else {
                onSetRotateToAscendant(!rotateToAscendant);
              }
            }}
            color={COLORS.personA}
          />
        )}

        {/* Zodiac Vantage Selector - Derived Houses View */}
        {onSetZodiacVantage && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>
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
                padding: '5px 8px',
                fontSize: 11,
                border: `1px solid ${COLORS.gridLineFaint}`,
                borderRadius: 4,
                color: COLORS.textSecondary,
                background: zodiacVantage !== null
                  ? (COLORS.background < '#333' ? '#3a2a10' : '#fff3e0')
                  : COLORS.background,
                color: zodiacVantage !== null
                  ? (COLORS.background < '#333' ? '#ffb74d' : COLORS.textSecondary)
                  : COLORS.textSecondary,
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
                fontSize: 9,
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

      {/* Aspects - Major and Minor sub-sections */}
      <Section title="Major Aspects" defaultOpen={true}>
        {majorAspects.map(([key, def]) => (
          <Checkbox
            key={key}
            label={`${def.name} — ${formatAngle(def.angle)}`}
            symbol={def.symbol}
            checked={visibleAspects.has(key as AspectType)}
            onChange={() => onToggleAspect(key as AspectType)}
            color={def.color}
          />
        ))}
      </Section>
      <Section title="Minor Aspects" defaultOpen={false}>
        {minorAspects.map(([key, def]) => (
          <Checkbox
            key={key}
            label={`${def.name} — ${formatAngle(def.angle)}`}
            symbol={def.symbol}
            checked={visibleAspects.has(key as AspectType)}
            onChange={() => onToggleAspect(key as AspectType)}
            color={def.color}
          />
        ))}
      </Section>

      {/* Orb Settings */}
      {onSetCustomAspectOrb && (
        <Section title="Orb Settings" defaultOpen={false}>
          {/* Per-aspect orbs */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6 }}>Aspect Orbs</div>
            {Object.entries(ASPECTS).filter(([key]) => visibleAspects.has(key as AspectType)).map(([key, def]) => {
              const current = customAspectOrbs?.[key] ?? def.orb;
              return (
                <div key={key} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: def.color, width: 14, textAlign: 'center' }}>{def.symbol}</span>
                    <span style={{ flex: 1, color: COLORS.textSecondary }}>{def.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textPrimary, minWidth: 28, textAlign: 'right' }}>{current}°</span>
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
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6 }}>Planet Orbs</div>
            {[...PLANET_GROUPS.core, ...PLANET_GROUPS.outer].map(key => {
              const info = PLANETS[key as keyof typeof PLANETS];
              if (!info || !visiblePlanets.has(key)) return null;
              const current = customPlanetOrbs?.[key] ?? PLANET_ORBS[key] ?? 3;
              return (
                <div key={key} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: getThemeAwarePlanetColor(key), width: 14, textAlign: 'center' }}>{info.symbol}</span>
                    <span style={{ flex: 1, color: COLORS.textSecondary }}>{info.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textPrimary, minWidth: 28, textAlign: 'right' }}>{current}°</span>
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
            <button
              onClick={onResetOrbs}
              style={{
                padding: '3px 8px',
                fontSize: 10,
                background: COLORS.backgroundAlt2,
                border: `1px solid ${COLORS.gridLineFaint}`,
                borderRadius: 4,
                color: COLORS.textSecondary,
                cursor: 'pointer',
              }}
            >
              Reset to Defaults
            </button>
          )}
        </Section>
      )}

      {/* Harmonic Charts */}
      {onSetHarmonicNumber && (
        <Section title="Harmonic Charts" defaultOpen={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.textSecondary }}>H</span>
            <input
              type="number"
              min={1}
              max={360}
              value={harmonicNumber}
              onChange={(e) => onSetHarmonicNumber(Math.max(1, Math.min(360, parseInt(e.target.value) || 1)))}
              style={{
                width: 60,
                padding: '4px 6px',
                fontSize: 11,
                border: `1px solid ${COLORS.gridLineFaint}`,
                borderRadius: 4,
                color: COLORS.textPrimary,
                background: COLORS.background,
                textAlign: 'center',
              }}
            />
            {harmonicNumber > 1 && (
              <button
                onClick={() => onSetHarmonicNumber(1)}
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  background: COLORS.backgroundAlt2,
                  border: `1px solid ${COLORS.gridLineFaint}`,
                  borderRadius: 4,
                  color: COLORS.textSecondary,
                  cursor: 'pointer',
                }}
              >
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
                  padding: '3px 8px',
                  fontSize: 10,
                  background: harmonicNumber === h.v ? COLORS.textPrimary : COLORS.backgroundAlt2,
                  color: harmonicNumber === h.v ? COLORS.background : COLORS.textSecondary,
                  fontWeight: harmonicNumber === h.v ? 600 : 400,
                  border: `1px solid ${COLORS.gridLineFaint}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {h.l}
              </button>
            ))}
          </div>
          {harmonicNumber > 1 && (
            <div style={{ marginTop: 8, fontSize: 9, color: COLORS.textMuted, padding: '4px 6px', background: COLORS.backgroundAlt, borderRadius: 4 }}>
              Harmonic {harmonicNumber}: each planet longitude × {harmonicNumber} (mod 360°)
            </div>
          )}
        </Section>
      )}

      {/* Sidereal Zodiac */}
      {onSetZodiacType && (
        <Section title="Zodiac System" defaultOpen={false}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {(['tropical', 'sidereal'] as const).map(type => (
              <button
                key={type}
                onClick={() => onSetZodiacType(type)}
                style={{
                  flex: 1,
                  padding: '3px 8px',
                  fontSize: 10,
                  background: zodiacType === type ? COLORS.textPrimary : COLORS.backgroundAlt2,
                  color: zodiacType === type ? COLORS.background : COLORS.textSecondary,
                  border: `1px solid ${zodiacType === type ? COLORS.textPrimary : COLORS.gridLineFaint}`,
                  borderRadius: 4,
                  cursor: 'pointer',
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
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Ayanamsa</div>
              <select
                value={ayanamsaKey}
                onChange={e => onSetAyanamsaKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 6px',
                  fontSize: 11,
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
              <div style={{ fontSize: 9, color: COLORS.textMuted, padding: '4px 6px', background: COLORS.backgroundAlt, borderRadius: 4 }}>
                Sidereal positions shifted by ~{AYANAMSA_SYSTEMS.find(s => s.key === ayanamsaKey)?.epoch2000.toFixed(1) ?? '?'}° ({ayanamsaKey})
              </div>
            </>
          )}
        </Section>
      )}

      {/* Objects - merged planets and asteroids */}
      <Section title="Objects" defaultOpen={false}>
        {/* Quick toggles */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => onEnablePlanetGroup('core')}
            style={{
              padding: '3px 8px',
              fontSize: 10,
              background: COLORS.backgroundAlt2,
              border: `1px solid ${COLORS.gridLineFaint}`,
              borderRadius: 4,
              color: COLORS.textSecondary,
              cursor: 'pointer',
            }}
          >
            Core
          </button>
          <button
            onClick={() => onEnablePlanetGroup('outer')}
            style={{
              padding: '3px 8px',
              fontSize: 10,
              background: COLORS.backgroundAlt2,
              border: `1px solid ${COLORS.gridLineFaint}`,
              borderRadius: 4,
              color: COLORS.textSecondary,
              cursor: 'pointer',
            }}
          >
            +Outer
          </button>
          <button
            onClick={() => onEnablePlanetGroup('asteroids')}
            style={{
              padding: '3px 8px',
              fontSize: 10,
              background: COLORS.backgroundAlt2,
              border: `1px solid ${COLORS.gridLineFaint}`,
              borderRadius: 4,
              color: COLORS.textSecondary,
              cursor: 'pointer',
            }}
          >
            +Asteroids
          </button>
          {enableAsteroids && (
            <>
              <button
                onClick={onEnableAllAsteroids}
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  background: COLORS.backgroundAlt2,
                  border: `1px solid ${COLORS.gridLineFaint}`,
                  borderRadius: 4,
                  color: COLORS.textSecondary,
                  cursor: 'pointer',
                }}
              >
                All Asteroids
              </button>
              <button
                onClick={onDisableAllAsteroids}
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  background: COLORS.backgroundAlt2,
                  border: `1px solid ${COLORS.gridLineFaint}`,
                  borderRadius: 4,
                  color: COLORS.textSecondary,
                  cursor: 'pointer',
                }}
              >
                Clear Asteroids
              </button>
            </>
          )}
        </div>

        {/* Planets section */}
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>Planets</span>
        </div>
        {Object.entries(PLANETS).map(([key, def]) => (
          <Checkbox
            key={key}
            label={def.name}
            symbol={def.symbol}
            checked={visiblePlanets.has(key)}
            onChange={() => onTogglePlanet(key)}
            color={def.category === 'asteroid' ? '#a78bfa' : COLORS.textSecondary}
          />
        ))}

        {/* Asteroids section - grouped */}
        {enableAsteroids && (
          <>
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>Asteroids</span>
            </div>
            {/* Asteroid group toggle buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {Object.entries(ASTEROID_GROUP_INFO).map(([groupKey, info]) => {
                const isEnabled = enabledAsteroidGroups.has(groupKey as AsteroidGroup);
                return (
                  <button
                    key={groupKey}
                    onClick={() => onToggleAsteroidGroup?.(groupKey as AsteroidGroup)}
                    style={{
                      padding: '3px 6px',
                      fontSize: 9,
                      background: isEnabled ? info.color : COLORS.backgroundAlt2,
                      color: isEnabled ? '#ffffff' : COLORS.textSecondary,
                      border: `1px solid ${isEnabled ? info.color : COLORS.gridLineFaint}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: isEnabled ? 600 : 400,
                    }}
                    title={info.name}
                  >
                    {info.icon} {groupKey.charAt(0).toUpperCase() + groupKey.slice(1)}
                  </button>
                );
              })}
            </div>
            {/* Individual asteroid checkboxes by group */}
            {Object.entries(ASTEROID_GROUP_INFO).map(([groupKey, groupInfo]) => {
              const groupAsteroids = [
                ...Object.entries(ASTEROIDS).filter(([_, def]) => def.group === groupKey),
                ...Object.entries(ARABIC_PARTS).filter(([_, def]) => def.group === groupKey),
              ];
              if (groupAsteroids.length === 0) return null;
              return (
                <div key={groupKey} style={{ marginBottom: 6 }}>
                  <div style={{
                    fontSize: 9,
                    color: groupInfo.color,
                    marginBottom: 2,
                    fontWeight: 600,
                  }}>
                    {groupInfo.icon} {groupInfo.name}
                  </div>
                  {groupAsteroids.map(([key, def]) => (
                    <Checkbox
                      key={key}
                      label={def.name}
                      checked={visiblePlanets.has(key)}
                      onChange={() => onTogglePlanet(key)}
                      color={def.color}
                    />
                  ))}
                </div>
              );
            })}
          </>
        )}

        {/* Fixed Stars section */}
        {enableFixedStars && (
          <>
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>Fixed Stars</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {Object.entries(FIXED_STAR_GROUP_INFO).map(([groupKey, info]) => {
                const isEnabled = enabledFixedStarGroups.has(groupKey as FixedStarGroup);
                return (
                  <button
                    key={groupKey}
                    onClick={() => onToggleFixedStarGroup?.(groupKey as FixedStarGroup)}
                    style={{
                      padding: '3px 6px',
                      fontSize: 9,
                      background: isEnabled ? info.color : COLORS.backgroundAlt2,
                      color: isEnabled ? '#ffffff' : COLORS.textSecondary,
                      border: `1px solid ${isEnabled ? info.color : COLORS.gridLineFaint}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: isEnabled ? 600 : 400,
                    }}
                    title={info.name}
                  >
                    {info.icon} {groupKey.charAt(0).toUpperCase() + groupKey.slice(1)}
                  </button>
                );
              })}
            </div>
            {Object.entries(FIXED_STAR_GROUP_INFO).map(([groupKey, groupInfo]) => {
              const groupStars = Object.entries(FIXED_STARS).filter(([_, def]) => def.group === groupKey);
              if (groupStars.length === 0) return null;
              return (
                <div key={groupKey} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 9, color: groupInfo.color, marginBottom: 2, fontWeight: 600 }}>
                    {groupInfo.icon} {groupInfo.name}
                  </div>
                  {groupStars.map(([key, def]) => (
                    <Checkbox
                      key={key}
                      label={def.name}
                      checked={visiblePlanets.has(key)}
                      onChange={() => onTogglePlanet(key)}
                      color={def.color}
                    />
                  ))}
                </div>
              );
            })}
          </>
        )}
      </Section>

      {/* Save as Default */}
      {onSaveAsDefault && (
        <div style={{ marginTop: 8, marginBottom: 12, paddingTop: 8, borderTop: `1px solid ${COLORS.gridLineFaint}` }}>
          <button
            onClick={onSaveAsDefault}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: 11,
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
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' }}>
            New charts will use these settings
          </div>
        </div>
      )}

    </div>
    </div>
  );
};

export default TogglePanel;
