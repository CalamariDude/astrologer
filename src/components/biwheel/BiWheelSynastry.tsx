/**
 * BiWheel Synastry Component
 * Main orchestrator for the synastry biwheel chart
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  COLORS,
  CHART_DIMENSIONS,
  DEFAULT_VISIBLE_PLANETS,
  DEFAULT_VISIBLE_ASPECTS,
  PLANET_GROUPS,
  ASPECTS,
  ASTEROIDS,
  applyTheme,
  setCurrentThemeName,
  ARABIC_PART_KEYS,
  calculateArabicParts,
} from './utils/constants';
import type { ThemeName } from './utils/themes';
import { calculateSynastryAspects, calculateNatalAspects, type AspectType, type SynastryAspect } from './utils/aspectCalculations';
import { calculateSolarArc } from './utils/solarArcCalculations';
import { ZodiacRing, type SignData } from './layers/ZodiacRing';
import { HouseOverlay, type HouseHoverData } from './layers/HouseOverlay';
import { PlanetRing, preparePlanets, MIN_SPACING_INNER, REPEL_ZONE_INNER } from './layers/PlanetRing';
import { TransitRing } from './layers/TransitRing';
// ProgressedRing no longer used - progressed planets are integrated into effectiveChart
import { DecanRing } from './layers/DecanRing';
import { AspectGrid } from './layers/AspectGrid';
import type { PlanetDisplayPositions, TransitData, CompositeData, ChartMode, ProgressedData, RelocatedData, LocationData, AsteroidGroup, FixedStarGroup } from './types';
import { ASTEROID_GROUPS, FIXED_STAR_GROUPS, ALL_FIXED_STAR_KEYS } from './types';
// Lazy-load LocationPicker — Leaflet is ~4MB, only needed when relocate modal opens
const LocationPicker = React.lazy(() => import('./controls/LocationPicker').then(m => ({ default: m.LocationPicker })));
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
// Tooltips — lazy-loaded (only mount on hover/click interactions)
const PlanetTooltip = React.lazy(() => import('./tooltips/PlanetTooltip').then(m => ({ default: m.PlanetTooltip })));
const AspectTooltip = React.lazy(() => import('./tooltips/AspectTooltip').then(m => ({ default: m.AspectTooltip })));
const SignTooltip = React.lazy(() => import('./tooltips/SignTooltip').then(m => ({ default: m.SignTooltip })));
const HouseTooltip = React.lazy(() => import('./tooltips/HouseTooltip').then(m => ({ default: m.HouseTooltip })));
const PlanetDetailDialog = React.lazy(() => import('./tooltips/PlanetDetailDialog').then(m => ({ default: m.PlanetDetailDialog })));
// TogglePanel — lazy-loaded (desktop sidebar, not used on mobile)
const TogglePanel = React.lazy(() => import('./controls/TogglePanel').then(m => ({ default: m.TogglePanel })));
import { TransitJogWheel } from './controls/TransitJogWheel';
import { BirthTimeShiftKnob } from './controls/BirthTimeShiftKnob';
import { calculateDeclination } from '@/lib/declination';
import * as analytics from '@/lib/analytics';
import type { BiWheelSynastryProps, BiWheelState, ChartDimensions, NatalChart, PlanetData } from './types';

// localStorage key for saved chart defaults
const CHART_DEFAULTS_KEY = 'biwheel-chart-defaults';

interface SavedChartDefaults {
  visiblePlanets: string[];
  visibleAspects: string[];
  showHouses: boolean;
  showDegreeMarkers: boolean;
  showRetrogrades: boolean;
  showDecans: boolean;
  degreeSymbolMode?: 'sign' | 'degree';
  rotateToAscendant: boolean;
  chartTheme: string;
  enabledAsteroidGroups: string[];
  enabledFixedStarGroups?: string[];
  straightAspects?: boolean;
  aspectLineStyle?: import('./types').AspectLineStyle;
  showEffects?: boolean;
}

function loadSavedDefaults(): SavedChartDefaults | null {
  try {
    const raw = localStorage.getItem(CHART_DEFAULTS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedChartDefaults;
  } catch {
    return null;
  }
}

// Fixed internal coordinate system - SVG viewBox is always this size.
// Must be large enough for all ring layers (planet, degree, sign, minute, houses, aspects)
// to fit without overlapping. The browser scales everything proportionally via viewBox.
const VIEWBOX_SIZE = 1400;

/**
 * Calculate chart dimensions from size
 * Layout from inside to outside:
 * 1. Inner circle (aspects)
 * 2. B's house numbers ring
 * 3. B's degree → sign → minute → planet
 * 4. Tick separator
 * 5. A's degree → sign → minute → planet
 * 6. Tick separator
 * 7. Zodiac ring with signs and degree ticks
 * 8. Outer house ring (A's houses)
 * 9. Transit ring (when enabled) - outermost
 */
function calculateDimensions(size: number, showTransits: boolean = false, _showProgressed: boolean = false, showDecans: boolean = true): ChartDimensions {
  // Increase margin when showing transits to make room for outer ring
  // Transit ring adds ~128px beyond outerRadius + ~34px for planet symbol overflow and label
  // Progressed no longer needs extra margin (planets are integrated into the main wheel)
  const transitExtraMargin = showTransits ? 130 : 0;
  const margin = CHART_DIMENSIONS.margin + 10 + transitExtraMargin;
  const outerRadius = (size - margin * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Outer house ring (outermost - A's houses) - larger
  const outerHouseRingOuter = outerRadius;
  const outerHouseRingWidth = 28;
  const outerHouseRingInner = outerHouseRingOuter - outerHouseRingWidth;

  // Zodiac ring (with signs and degree ticks) - now directly inside house ring
  const zodiacOuter = outerHouseRingInner - 2;
  const zodiacInner = zodiacOuter - CHART_DIMENSIONS.zodiacWidth;

  // Decan ring (inside zodiac ring, between zodiac and planet rings)
  // When decans are off, collapse this space so planets sit against the zodiac ring
  const decanOuter = zodiacInner - 2;
  const decanWidth = showDecans ? 38 : 0;
  const decanInner = decanOuter - decanWidth;

  // Person A's rings (outer person) - from outside in: planet, degree, degree sign, minute
  // Degree/degree sign/minute are a tight cluster; planet symbol has breathing room
  const planetARing = decanInner - 38;
  const degreeARing = planetARing - 38;
  const signARing = degreeARing - 38;
  const minuteARing = signARing - 32;

  // Tick after Person A's planet (between A's planet and decan ring)
  const tickAToZodiac = decanInner - 6;

  // Tick after Person B's planet (between B and A)
  const tickBToA = minuteARing - 14;

  // Person B's rings (inner person) - from outside in: planet, degree, degree sign, minute
  // Degree/degree sign/minute are a tight cluster
  const planetBRing = tickBToA - 32;
  const degreeBRing = planetBRing - 32;
  const signBRing = degreeBRing - 30;
  const minuteBRing = signBRing - 24;

  // Tick after Person B's planet (outermost thing for B)
  const tickBOuter = planetBRing + 6;

  // B's house numbers ring - generous gap so arc minutes don't touch house lines
  const houseRingOuter = minuteBRing - 34;
  const houseRingInner = houseRingOuter - 28;
  const houseRadius = houseRingOuter;

  // Inner circle for aspects - compact
  const innerCircle = houseRingInner - 2;

  // Transit ring dimensions (outermost when enabled)
  let transitRingOuter: number | undefined;
  let transitPlanetRing: number | undefined;
  let transitMinuteRing: number | undefined;
  let transitSignRing: number | undefined;
  let transitDegreeRing: number | undefined;

  if (showTransits) {
    // Transit ring: degree → sign → minute → planet (same layout as A and B)
    // Generous spacing so clustered transit planets don't collide
    transitDegreeRing = outerHouseRingOuter + 22;
    transitSignRing = transitDegreeRing + 28;
    transitMinuteRing = transitSignRing + 24;
    transitPlanetRing = transitMinuteRing + 32;
    transitRingOuter = transitPlanetRing + 22;
  }

  return {
    size,
    cx,
    cy,
    outerRadius,
    zodiacOuter,
    zodiacInner,
    decanOuter,
    decanInner,
    houseRadius,
    houseRingOuter,
    houseRingInner,
    outerHouseRingOuter,
    outerHouseRingInner,
    planetARing,
    minuteARing,
    signARing,
    degreeARing,
    planetBRing,
    minuteBRing,
    signBRing,
    degreeBRing,
    tickAToZodiac,
    tickBToA,
    tickBOuter,
    innerCircle,
    // Transit dimensions
    transitRingOuter,
    transitPlanetRing,
    transitMinuteRing,
    transitSignRing,
    transitDegreeRing,
  };
}

/**
 * Calculate single-wheel dimensions for personA, personB, and composite modes
 * Layout from inside to outside:
 * 1. Inner circle (aspects)
 * 2. House numbers ring
 * 3. Planet ring (single, expanded to use available space)
 * 4. Zodiac ring with signs
 * 5. Outer house ring
 * 6. Transit ring (when enabled) - outermost
 */
function calculateSingleWheelDimensions(size: number, showTransits: boolean = false, _showProgressed: boolean = false, showDecans: boolean = true): ChartDimensions {
  const transitExtraMargin = showTransits ? 130 : 0;
  const margin = CHART_DIMENSIONS.margin + 10 + transitExtraMargin;
  const outerRadius = (size - margin * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // No outer house ring in single-wheel mode — zodiac extends to edge
  const outerHouseRingOuter = outerRadius;
  const outerHouseRingInner = outerRadius; // collapsed to zero width

  // Zodiac ring (with signs and degree ticks) - starts at outer edge
  const zodiacOuter = outerRadius - 2;
  const zodiacInner = zodiacOuter - CHART_DIMENSIONS.zodiacWidth;

  // Decan ring (inside zodiac ring, between zodiac and planet rings)
  // When decans are off, collapse this space so planets sit against the zodiac ring
  const decanOuter = zodiacInner - 2;
  const decanWidth = showDecans ? 38 : 0;
  const decanInner = decanOuter - decanWidth;

  // Single planet ring — degree/degree sign/minute are a tight cluster
  const singlePlanetRing = decanInner - 56;
  const singleDegreeRing = singlePlanetRing - 48;
  const singleSignRing = singleDegreeRing - 38;
  const singleMinuteRing = singleSignRing - 32;

  // Tick after planet
  const tickAToZodiac = decanInner - 6;

  // House numbers ring - generous gap so arc minutes don't touch house lines
  const houseRingOuter = singleMinuteRing - 30;
  const houseRingInner = houseRingOuter - 32;
  const houseRadius = houseRingOuter;

  // Inner circle for aspects
  const innerCircle = houseRingInner - 2;

  // Transit ring dimensions (outermost when enabled)
  let transitRingOuter: number | undefined;
  let transitPlanetRing: number | undefined;
  let transitMinuteRing: number | undefined;
  let transitSignRing: number | undefined;
  let transitDegreeRing: number | undefined;

  if (showTransits) {
    transitDegreeRing = outerHouseRingOuter + 22;
    transitSignRing = transitDegreeRing + 28;
    transitMinuteRing = transitSignRing + 24;
    transitPlanetRing = transitMinuteRing + 32;
    transitRingOuter = transitPlanetRing + 22;
  }

  return {
    size,
    cx,
    cy,
    outerRadius,
    zodiacOuter,
    zodiacInner,
    decanOuter,
    decanInner,
    houseRadius,
    houseRingOuter,
    houseRingInner,
    outerHouseRingOuter,
    outerHouseRingInner,
    // For single-wheel, planet ring positions use same names for compatibility
    planetARing: singlePlanetRing,
    minuteARing: singleMinuteRing,
    signARing: singleSignRing,
    degreeARing: singleDegreeRing,
    // B ring positions not used in single-wheel mode
    planetBRing: singlePlanetRing,
    minuteBRing: singleMinuteRing,
    signBRing: singleSignRing,
    degreeBRing: singleDegreeRing,
    tickAToZodiac,
    tickBToA: singleMinuteRing - 10,
    tickBOuter: singlePlanetRing + 6,
    innerCircle,
    // Single-wheel specific
    singlePlanetRing,
    singleDegreeRing,
    singleSignRing,
    singleMinuteRing,
    // Transit dimensions
    transitRingOuter,
    transitPlanetRing,
    transitMinuteRing,
    transitSignRing,
    transitDegreeRing,
  };
}

/**
 * Calculate which house a planet falls into based on its longitude and the chart's ascendant.
 * Supports whole-sign (sign-based) and equal house (30° from ASC degree) systems.
 */
function calculateHouseFromLongitude(longitude: number, ascendant: number, wholeSign: boolean = false): number {
  if (wholeSign) {
    // Whole-sign: house boundaries are at sign boundaries
    const planetSign = Math.floor(longitude / 30) % 12;
    const ascSign = Math.floor(ascendant / 30) % 12;
    return ((planetSign - ascSign + 12) % 12) + 1;
  }
  // Equal house: each house is 30° from ASC degree
  let diff = longitude - ascendant;
  while (diff < 0) diff += 360;
  while (diff >= 360) diff -= 360;
  return Math.floor(diff / 30) + 1;
}

export const BiWheelSynastry: React.FC<BiWheelSynastryProps> = ({
  chartA,
  chartB,
  nameA,
  nameB,
  showTogglePanel = true,
  togglePanelCollapsed,
  onTogglePanelCollapsedChange,
  hideZoomControls = false,
  initialVisiblePlanets,
  initialVisibleAspects,
  initialShowHouses = true,
  initialShowDegreeMarkers = true,
  initialStraightAspects,
  initialAspectLineStyle,
  initialShowEffects,
  initialChartMode = 'synastry',
  onAspectClick,
  onPlanetClick,
  className,
  // Asteroids - passed to all fetch callbacks
  asteroids,
  // Transit props
  enableTransits = false,
  initialShowTransits = false,
  initialTransitDate,
  initialTransitTime,
  onFetchTransits,
  // Composite props
  enableComposite = false,
  onFetchComposite,
  // Davison props
  enableDavison = false,
  onFetchDavison,
  davisonLabel,
  // Progressed props
  enableProgressed = false,
  onFetchProgressed,
  // Relocated props
  enableRelocated = false,
  onFetchRelocated,
  originalLocation,
  locationB,
  // External control of relocated location (from parent, e.g., map selection)
  externalRelocatedLocationA,
  externalRelocatedLocationB,
  externalRelocatedPerson,
  // Birth data for astrocartography in location picker
  birthDateA,
  birthTimeA,
  birthDateB,
  birthTimeB,
  // Initial progressed/relocated state (for mobile wrapper)
  initialProgressedPerson,
  initialProgressedDate,
  initialShowSolarArc,
  initialRelocatedPerson,
  // Mode change callbacks
  initialTheme,
  onThemeChange,
  onChartModeChange,
  onProgressedPersonChange,
  onProgressedDateChange,
  onShowSolarArcChange,
  onRelocatedPersonChange,
  onProgressedLoadingChange,
  onRelocatedLoadingChange,
  onShowTransitsChange,
  onTransitDateChange,
  onTransitTimeChange,
  onTransitLoadingChange,
  onAsteroidsChange,
  // Rotation / vantage
  initialRotateToAscendant,
  initialZodiacVantage,
  onRotateToAscendantChange,
  onZodiacVantageChange,
  // Asteroids data fetch
  onFetchAsteroidData,
  // Fixed stars data fetch
  onFetchFixedStarData,
  // Initial enabled asteroid groups (from parent wrapper on remount)
  initialEnabledAsteroidGroups,
  // Initial enabled fixed star groups (from parent wrapper on remount)
  initialEnabledFixedStarGroups,
  // Initial display toggles (from parent wrapper for session sync)
  initialShowRetrogrades,
  initialShowDecans,
  // Full state change callback (session broadcast)
  onInternalStateChange,
  // Birth time shift (rectification) props
  enableBirthTimeShift = false,
  onFetchShiftedNatal,
  initialShowBirthTimeShift,
  initialTimeShiftA,
  initialTimeShiftB,
  onShowBirthTimeShiftChange,
  onTimeShiftAChange,
  onTimeShiftBChange,
  // House system
  houseSystem,
  birthLatA,
  birthLatB,
  onHouseSystemChange,
  // Custom orbs
  customAspectOrbs,
  customSeparatingAspectOrbs,
  customPlanetOrbs,
  onCustomAspectOrbChange,
  onCustomSeparatingAspectOrbChange,
  onCustomPlanetOrbChange,
  onResetOrbs,
  // Harmonic charts
  harmonicNumber,
  onHarmonicNumberChange,
  // Sidereal zodiac
  zodiacType,
  onZodiacTypeChange,
  ayanamsaKey,
  onAyanamsaKeyChange,
  // Solar return
  onFetchSolarReturn,
  initialShowSolarReturn,
  initialSolarReturnYear,
  onShowSolarReturnChange,
  onSolarReturnYearChange,
  onSolarReturnLoadingChange,
  onSolarReturnDataChange,
  // Lunar return
  onFetchLunarReturn,
  initialShowLunarReturn,
  initialLunarReturnStartDate,
  onShowLunarReturnChange,
  onLunarReturnStartDateChange,
  onLunarReturnLoadingChange,
  onLunarReturnDataChange,
}) => {
  // Subscription gating for astrocartography
  const { user } = useAuth();
  const { isPaid } = useSubscription();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Get today's date and current time (local timezone, not UTC)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  // Load saved defaults from localStorage
  const savedDefaults = useMemo(() => loadSavedDefaults(), []);

  // State
  const [state, setState] = useState<BiWheelState>({
    visiblePlanets: initialVisiblePlanets || (savedDefaults ? new Set(savedDefaults.visiblePlanets) : new Set(DEFAULT_VISIBLE_PLANETS)),
    visibleAspects: initialVisibleAspects || (savedDefaults ? new Set(savedDefaults.visibleAspects as AspectType[]) : new Set(DEFAULT_VISIBLE_ASPECTS)),
    showHouses: savedDefaults ? savedDefaults.showHouses : initialShowHouses,
    showDegreeMarkers: savedDefaults ? savedDefaults.showDegreeMarkers : initialShowDegreeMarkers,
    showRetrogrades: initialShowRetrogrades ?? savedDefaults?.showRetrogrades ?? true,
    showDecans: initialShowDecans ?? savedDefaults?.showDecans ?? false,
    degreeSymbolMode: savedDefaults?.degreeSymbolMode ?? 'sign',
    hoveredPlanet: null,
    selectedAspect: null,
    selectedPlanet: null,
    selectedSign: null,
    tooltipPosition: null,
    pinnedTooltipOpen: false,
    expandedPlanetOpen: false,
    // Transit/Composite state
    showTransits: initialShowTransits,
    transitDate: initialTransitDate || today,
    transitTime: initialTransitTime || currentTime,
    transitData: null,
    transitLoading: false,
    chartMode: initialChartMode,
    compositeData: null,
    compositeLoading: false,
    // Davison state
    davisonData: null,
    davisonLoading: false,
    // Progressed state
    showProgressed: !!initialProgressedPerson,
    progressedDate: initialProgressedDate || today,
    progressedData: null,
    progressedDataOther: null,
    progressedLoading: false,
    // Relocated state
    showRelocated: !!initialRelocatedPerson,
    relocatedLocationA: externalRelocatedLocationA || null,
    relocatedLocationB: externalRelocatedLocationB || null,
    locationPickerTarget: null,
    relocatedData: null,
    relocatedDataOther: null,
    relocatedLoading: false,
    showLocationPicker: false,
    // Asteroids state
    enabledAsteroidGroups: initialEnabledAsteroidGroups || (savedDefaults?.enabledAsteroidGroups ? new Set(savedDefaults.enabledAsteroidGroups as AsteroidGroup[]) : new Set<AsteroidGroup>()),
    // Fixed stars state
    enabledFixedStarGroups: initialEnabledFixedStarGroups || (savedDefaults?.enabledFixedStarGroups ? new Set(savedDefaults.enabledFixedStarGroups as FixedStarGroup[]) : new Set<FixedStarGroup>()),
    // Solar Arc state (derived from progressed Sun - mutually exclusive with progressed)
    showSolarArc: initialShowSolarArc || false,
    // Aspect line display options
    straightAspects: initialStraightAspects ?? savedDefaults?.straightAspects ?? true,
    aspectLineStyle: initialAspectLineStyle ?? (savedDefaults?.aspectLineStyle as import('./types').AspectLineStyle) ?? 'modern',
    showEffects: initialShowEffects ?? savedDefaults?.showEffects ?? false,
    // Birth time shift (rectification) state
    showBirthTimeShift: initialShowBirthTimeShift ?? false,
    timeShiftA: initialTimeShiftA ?? 0,
    timeShiftB: initialTimeShiftB ?? 0,
    shiftedChartA: null,
    shiftedChartB: null,
    birthTimeShiftLoading: false,
    // Solar return state
    showSolarReturn: initialShowSolarReturn ?? false,
    solarReturnYear: initialSolarReturnYear ?? new Date().getFullYear(),
    solarReturnData: null,
    solarReturnLoading: false,
    // Lunar return state
    showLunarReturn: initialShowLunarReturn ?? false,
    lunarReturnStartDate: initialLunarReturnStartDate || today,
    lunarReturnData: null,
    lunarReturnLoading: false,
  });

  // Sync birth time shift state from external props (mobile knobs in BiWheelMobileWrapper)
  useEffect(() => {
    if (initialShowBirthTimeShift !== undefined && initialShowBirthTimeShift !== state.showBirthTimeShift) {
      setState(prev => ({ ...prev, showBirthTimeShift: initialShowBirthTimeShift }));
    }
  }, [initialShowBirthTimeShift]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialTimeShiftA !== undefined && initialTimeShiftA !== state.timeShiftA) {
      setState(prev => ({ ...prev, timeShiftA: initialTimeShiftA }));
    }
  }, [initialTimeShiftA]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialTimeShiftB !== undefined && initialTimeShiftB !== state.timeShiftB) {
      setState(prev => ({ ...prev, timeShiftB: initialTimeShiftB }));
    }
  }, [initialTimeShiftB]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync solar/lunar return state from external props (BiWheelMobileWrapper)
  useEffect(() => {
    if (initialShowSolarReturn !== undefined && initialShowSolarReturn !== state.showSolarReturn) {
      setState(prev => ({ ...prev, showSolarReturn: initialShowSolarReturn }));
    }
  }, [initialShowSolarReturn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialSolarReturnYear !== undefined && initialSolarReturnYear !== state.solarReturnYear) {
      setState(prev => ({ ...prev, solarReturnYear: initialSolarReturnYear }));
    }
  }, [initialSolarReturnYear]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialShowLunarReturn !== undefined && initialShowLunarReturn !== state.showLunarReturn) {
      setState(prev => ({ ...prev, showLunarReturn: initialShowLunarReturn }));
    }
  }, [initialShowLunarReturn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialLunarReturnStartDate !== undefined && initialLunarReturnStartDate !== state.lunarReturnStartDate) {
      setState(prev => ({ ...prev, lunarReturnStartDate: initialLunarReturnStartDate }));
    }
  }, [initialLunarReturnStartDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync display state from parent (preset loads, external state changes)
  useEffect(() => {
    if (initialVisiblePlanets) {
      setState(prev => {
        // Compare sets — skip if identical
        if (prev.visiblePlanets.size === initialVisiblePlanets.size &&
            [...initialVisiblePlanets].every(p => prev.visiblePlanets.has(p))) return prev;
        return { ...prev, visiblePlanets: initialVisiblePlanets };
      });
    }
  }, [initialVisiblePlanets]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialVisibleAspects) {
      setState(prev => {
        if (prev.visibleAspects.size === initialVisibleAspects.size &&
            [...initialVisibleAspects].every(a => prev.visibleAspects.has(a))) return prev;
        return { ...prev, visibleAspects: initialVisibleAspects };
      });
    }
  }, [initialVisibleAspects]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setState(prev => {
      if (prev.showHouses === initialShowHouses) return prev;
      return { ...prev, showHouses: initialShowHouses };
    });
  }, [initialShowHouses]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setState(prev => {
      if (prev.showDegreeMarkers === initialShowDegreeMarkers) return prev;
      return { ...prev, showDegreeMarkers: initialShowDegreeMarkers };
    });
  }, [initialShowDegreeMarkers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialShowRetrogrades !== undefined) {
      setState(prev => {
        if (prev.showRetrogrades === initialShowRetrogrades) return prev;
        return { ...prev, showRetrogrades: initialShowRetrogrades };
      });
    }
  }, [initialShowRetrogrades]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialShowDecans !== undefined) {
      setState(prev => {
        if (prev.showDecans === initialShowDecans) return prev;
        return { ...prev, showDecans: initialShowDecans };
      });
    }
  }, [initialShowDecans]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialStraightAspects !== undefined) {
      setState(prev => {
        if (prev.straightAspects === initialStraightAspects) return prev;
        return { ...prev, straightAspects: initialStraightAspects };
      });
    }
  }, [initialStraightAspects]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialShowEffects !== undefined) {
      setState(prev => {
        if (prev.showEffects === initialShowEffects) return prev;
        return { ...prev, showEffects: initialShowEffects };
      });
    }
  }, [initialShowEffects]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialEnabledAsteroidGroups) {
      setState(prev => {
        if (prev.enabledAsteroidGroups.size === initialEnabledAsteroidGroups.size &&
            [...initialEnabledAsteroidGroups].every(g => prev.enabledAsteroidGroups.has(g))) return prev;
        return { ...prev, enabledAsteroidGroups: initialEnabledAsteroidGroups };
      });
    }
  }, [initialEnabledAsteroidGroups]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialEnabledFixedStarGroups) {
      setState(prev => {
        if (prev.enabledFixedStarGroups.size === initialEnabledFixedStarGroups.size &&
            [...initialEnabledFixedStarGroups].every(g => prev.enabledFixedStarGroups.has(g))) return prev;
        return { ...prev, enabledFixedStarGroups: initialEnabledFixedStarGroups };
      });
    }
  }, [initialEnabledFixedStarGroups]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialRotateToAscendant !== undefined && initialRotateToAscendant !== rotateToAscendant) {
      setRotateToAscendant(initialRotateToAscendant);
    }
  }, [initialRotateToAscendant]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialZodiacVantage !== undefined && initialZodiacVantage !== zodiacVantage) {
      setZodiacVantage(initialZodiacVantage);
    }
  }, [initialZodiacVantage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Delayed transit loading — only true if transitLoading persists >500ms
  const [transitLoadingSlow, setTransitLoadingSlow] = useState(false);
  useEffect(() => {
    if (!state.transitLoading) {
      setTransitLoadingSlow(false);
      return;
    }
    const timer = setTimeout(() => setTransitLoadingSlow(true), 500);
    return () => clearTimeout(timer);
  }, [state.transitLoading]);

  // Swap A/B state - when true, Person A and B are swapped in the biwheel
  const [swapped, setSwapped] = useState(false);

  // Rotation state - rotate chart so Person A's Ascendant is at 9 o'clock (left side, traditional East)
  const [rotateToAscendant, setRotateToAscendant] = useState(
    initialRotateToAscendant ?? (savedDefaults ? savedDefaults.rotateToAscendant : true)
  );

  // Theme state - prefer parent prop (DB source of truth), fall back to saved defaults, then 'classic'
  const [chartTheme, setChartTheme] = useState<ThemeName>(
    (initialTheme as ThemeName) || (savedDefaults ? savedDefaults.chartTheme as ThemeName : 'classic')
  );
  // Apply theme visuals whenever chartTheme changes (but don't notify parent — that's
  // done only on user-initiated changes to avoid overwriting DB on init/sync).
  useMemo(() => {
    applyTheme(chartTheme);
    setCurrentThemeName(chartTheme);
  }, [chartTheme]);

  // Sync when parent theme changes (e.g. after DB load resolves)
  useEffect(() => {
    if (initialTheme && initialTheme !== chartTheme) {
      setChartTheme(initialTheme as ThemeName);
    }
  }, [initialTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  // User-initiated theme change — applies locally and notifies parent (saves to DB)
  const handleUserThemeChange = useCallback((theme: ThemeName) => {
    setChartTheme(theme);
    onThemeChange?.(theme);
  }, [onThemeChange]);

  // Zoom state - viewBox manipulation for zooming into chart areas
  const [zoomMode, setZoomMode] = useState(false);
  const [zoomViewBox, setZoomViewBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Pan (hand tool) state
  const [panMode, setPanMode] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const panStart = useRef<{ clientX: number; clientY: number; vb: { x: number; y: number; w: number; h: number } } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Spacebar hold → temporary pan mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && zoomViewBox) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceHeld(false);
        setIsDragging(false);
        panStart.current = null;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [zoomViewBox]);

  const canPan = (panMode || spaceHeld) && !!zoomViewBox;

  const handlePanMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!canPan || !zoomViewBox) return;
    setIsDragging(true);
    panStart.current = { clientX: e.clientX, clientY: e.clientY, vb: { ...zoomViewBox } };
    e.preventDefault();
  }, [canPan, zoomViewBox]);

  const handlePanMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !panStart.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const { vb } = panStart.current;
    // Convert pixel delta to SVG coordinate delta
    const dx = ((e.clientX - panStart.current.clientX) / rect.width) * vb.w;
    const dy = ((e.clientY - panStart.current.clientY) / rect.height) * vb.h;
    const newX = Math.max(0, Math.min(VIEWBOX_SIZE - vb.w, vb.x - dx));
    const newY = Math.max(0, Math.min(VIEWBOX_SIZE - vb.h, vb.y - dy));
    setZoomViewBox({ x: newX, y: newY, w: vb.w, h: vb.h });
  }, [isDragging]);

  const handlePanMouseUp = useCallback(() => {
    setIsDragging(false);
    panStart.current = null;
  }, []);

  // Zodiac vantage state - allows rotating to put any sign at the 1st house cusp
  // null = use default (Ascendant or Aries), 0-11 = zodiac sign index (0=Aries, 6=Libra, etc.)
  const [zodiacVantage, setZodiacVantage] = useState<number | null>(initialZodiacVantage ?? null);

  // Progressed person state - which person(s) progressed chart to show
  const [progressedPerson, setProgressedPerson] = useState<'A' | 'B' | 'both' | null>(initialProgressedPerson ?? null);

  // Relocated person state - which person(s) relocated chart to show
  const [relocatedPerson, setRelocatedPerson] = useState<'A' | 'B' | 'both' | null>(initialRelocatedPerson ?? null);

  // Sync external relocated locations from parent (e.g., mobile wrapper map selection)
  useEffect(() => {
    if (externalRelocatedLocationA !== undefined) {
      setState(prev => {
        const locChanged = prev.relocatedLocationA?.lat !== externalRelocatedLocationA?.lat ||
                           prev.relocatedLocationA?.lng !== externalRelocatedLocationA?.lng;
        return {
          ...prev,
          relocatedLocationA: externalRelocatedLocationA || null,
          ...(locChanged ? { relocatedData: null, relocatedDataOther: null } : {}),
        };
      });
    }
  }, [externalRelocatedLocationA]);

  useEffect(() => {
    if (externalRelocatedLocationB !== undefined) {
      setState(prev => {
        const locChanged = prev.relocatedLocationB?.lat !== externalRelocatedLocationB?.lat ||
                           prev.relocatedLocationB?.lng !== externalRelocatedLocationB?.lng;
        return {
          ...prev,
          relocatedLocationB: externalRelocatedLocationB || null,
          ...(locChanged ? { relocatedData: null, relocatedDataOther: null } : {}),
        };
      });
    }
  }, [externalRelocatedLocationB]);

  useEffect(() => {
    if (externalRelocatedPerson !== undefined) {
      if (externalRelocatedPerson) {
        setRelocatedPerson(externalRelocatedPerson);
        setState(prev => ({ ...prev, showRelocated: true }));
      } else {
        setRelocatedPerson(null);
        setState(prev => ({ ...prev, showRelocated: false, relocatedData: null, relocatedDataOther: null }));
      }
    }
  }, [externalRelocatedPerson]);

  // Asteroid data state - stores fetched asteroid positions
  const [asteroidData, setAsteroidData] = useState<{ chartA: Record<string, any>; chartB: Record<string, any> } | null>(null);
  const [asteroidLoading, setAsteroidLoading] = useState(false);

  // Fixed star data state - stores fetched fixed star positions
  const [fixedStarData, setFixedStarData] = useState<{ chartA: Record<string, any>; chartB: Record<string, any> } | null>(null);
  const [fixedStarLoading, setFixedStarLoading] = useState(false);

  // Sync chartMode when initialChartMode prop changes
  useEffect(() => {
    setState(prev => ({ ...prev, chartMode: initialChartMode }));
  }, [initialChartMode]);

  // Sync progressed/relocated when initial props change (e.g. guest receiving broadcast)
  useEffect(() => {
    setProgressedPerson(initialProgressedPerson ?? null);
    setState(prev => ({ ...prev, showProgressed: !!initialProgressedPerson }));
  }, [initialProgressedPerson]);

  useEffect(() => {
    setRelocatedPerson(initialRelocatedPerson ?? null);
    setState(prev => ({ ...prev, showRelocated: !!initialRelocatedPerson }));
  }, [initialRelocatedPerson]);

  // Sync transit date/time when parent changes them (e.g. mobile jog wheel)
  useEffect(() => {
    if (initialTransitDate) {
      setState(prev => prev.transitDate === initialTransitDate ? prev : { ...prev, transitDate: initialTransitDate });
    }
  }, [initialTransitDate]);

  useEffect(() => {
    if (initialTransitTime) {
      setState(prev => prev.transitTime === initialTransitTime ? prev : { ...prev, transitTime: initialTransitTime });
    }
  }, [initialTransitTime]);

  // Additional tooltip states
  const [hoveredSign, setHoveredSign] = useState<SignData | null>(null);
  const [signTooltipPos, setSignTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredHouse, setHoveredHouse] = useState<HouseHoverData | null>(null);
  const [houseTooltipPos, setHouseTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredAspect, setHoveredAspect] = useState<SynastryAspect | null>(null);
  const [aspectTooltipPos, setAspectTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Calculate dimensions based on chart mode (always using fixed VIEWBOX_SIZE coordinate system)
  const isSingleWheel = state.chartMode !== 'synastry';
  const showOuterRing = state.showTransits || state.showSolarReturn || state.showLunarReturn;
  const dimensions = useMemo(
    () => isSingleWheel
      ? calculateSingleWheelDimensions(VIEWBOX_SIZE, showOuterRing, state.showProgressed, state.showDecans)
      : calculateDimensions(VIEWBOX_SIZE, showOuterRing, state.showProgressed, state.showDecans),
    [showOuterRing, state.showProgressed, state.showDecans, isSingleWheel]
  );

  // Calculate rotation offset to place Ascendant at 9 o'clock (left side, traditional East)
  // In the base chart: 0° Aries at top (12 o'clock), zodiac flows counter-clockwise
  // Longitude L appears at angle (90 + L + offset) in radians
  // To place Ascendant at 180° (9 o'clock/left), we need: 90 + asc + offset = 180
  // Solving: offset = 90 - asc
  // This offset is passed to coordinate functions, NOT used as a group rotation
  //
  // When zodiacVantage is set, we rotate so that sign starts at 9 o'clock (1st house cusp)
  // Each sign spans 30°, so sign index N starts at N*30°
  // To place sign N at 180° (9 o'clock): offset = 90 - (N * 30)
  const rotationOffset = useMemo(() => {
    // If zodiacVantage is set, use that to determine rotation (overrides rotateToAscendant)
    if (zodiacVantage !== null) {
      const signStartDegree = zodiacVantage * 30;
      return 90 - signStartDegree;
    }

    if (!rotateToAscendant) return 0;

    // Get ascendant based on chart mode, relocated, or progressed state
    let ascendant: number | undefined;

    // If relocated is active, use relocated ascendant for the selected person
    if (state.showRelocated && state.relocatedData?.houses?.ascendant !== undefined) {
      ascendant = state.relocatedData.houses.ascendant;
    } else if (state.showProgressed && state.progressedData?.houses?.ascendant !== undefined) {
      // If progressed is active, use progressed ascendant
      ascendant = state.progressedData.houses.ascendant;
    } else {
      switch (state.chartMode) {
        case 'personA':
          ascendant = chartA.angles?.ascendant;
          break;
        case 'synastry':
          ascendant = swapped ? chartB.angles?.ascendant : chartA.angles?.ascendant;
          break;
        case 'personB':
          ascendant = chartB.angles?.ascendant;
          break;
        case 'composite':
          ascendant = state.compositeData?.houses?.ascendant;
          break;
      }
    }

    if (ascendant === undefined) return 0;
    return 90 - ascendant;
  }, [zodiacVantage, rotateToAscendant, state.chartMode, chartA.angles?.ascendant, chartB.angles?.ascendant, state.compositeData?.houses, state.showRelocated, state.relocatedData?.houses?.ascendant, state.showProgressed, state.progressedData?.houses?.ascendant, swapped]);

  // Compute asteroids parameter from enabled groups AND individually visible asteroids
  const computedAsteroids = useMemo(() => {
    const asteroidSet = new Set<string>();

    // Add asteroids from enabled groups
    for (const group of state.enabledAsteroidGroups) {
      for (const asteroid of ASTEROID_GROUPS[group]) {
        asteroidSet.add(asteroid);
      }
    }

    // Also add any individually visible asteroids (from ASTEROIDS constant)
    const asteroidKeys = new Set(Object.keys(ASTEROIDS));
    for (const planet of state.visiblePlanets) {
      if (asteroidKeys.has(planet)) {
        asteroidSet.add(planet);
      }
    }

    // Remove Arabic Parts (calculated client-side, not fetched from API)
    for (const key of ARABIC_PART_KEYS) {
      asteroidSet.delete(key);
    }

    // If we have asteroids to fetch, return them
    if (asteroidSet.size > 0) {
      return Array.from(asteroidSet);
    }

    // Otherwise use prop value if provided
    return asteroids;
  }, [state.enabledAsteroidGroups, state.visiblePlanets, asteroids]);

  // Notify parent when asteroids change
  useEffect(() => {
    onAsteroidsChange?.(computedAsteroids);
  }, [computedAsteroids, onAsteroidsChange]);

  // Fetch asteroid data when asteroid groups are enabled
  useEffect(() => {
    if (!computedAsteroids || !Array.isArray(computedAsteroids) || computedAsteroids.length === 0) {
      // Clear asteroid data when no asteroids enabled
      setAsteroidData(null);
      return;
    }

    if (!onFetchAsteroidData) {
      console.warn('Asteroids enabled but onFetchAsteroidData callback not provided');
      return;
    }

    const fetchData = async () => {
      setAsteroidLoading(true);
      try {
        console.log('Fetching asteroid data for:', computedAsteroids);
        const data = await onFetchAsteroidData(computedAsteroids);
        console.log('Asteroid data received:', Object.keys(data.chartA || {}).length, 'planets for chartA');
        // Only update if we got actual data
        if (Object.keys(data.chartA || {}).length > 0 || Object.keys(data.chartB || {}).length > 0) {
          setAsteroidData(data);
        } else {
          console.warn('Asteroid fetch returned empty data - birth info may not be ready yet');
        }
      } catch (error) {
        console.error('Failed to fetch asteroid data:', error);
        setAsteroidData(null);
      } finally {
        setAsteroidLoading(false);
      }
    };

    fetchData();
  }, [computedAsteroids, onFetchAsteroidData]);

  // Check if any fixed star key is in visiblePlanets (works for both group toggle and individual checkbox)
  const hasAnyVisibleFixedStar = useMemo(() => {
    for (const key of ALL_FIXED_STAR_KEYS) {
      if (state.visiblePlanets.has(key)) return true;
    }
    return false;
  }, [state.visiblePlanets]);

  // Fetch fixed star data when any fixed star is visible (via group or individual toggle)
  useEffect(() => {
    if (!hasAnyVisibleFixedStar) {
      setFixedStarData(null);
      return;
    }
    // Already fetched - no need to re-fetch (all stars come in one API call)
    if (fixedStarData) return;
    if (!onFetchFixedStarData) return;

    const fetchStars = async () => {
      setFixedStarLoading(true);
      try {
        console.log('[FixedStars] Fetching star data...');
        const data = await onFetchFixedStarData();
        const countA = Object.keys(data.chartA || {}).length;
        const countB = Object.keys(data.chartB || {}).length;
        console.log(`[FixedStars] Received: chartA=${countA} stars, chartB=${countB} stars`, countA > 0 ? Object.keys(data.chartA).slice(0, 5) : []);
        if (countA > 0 || countB > 0) {
          setFixedStarData(data);
        } else {
          console.warn('[FixedStars] No star data returned from API');
        }
      } catch (error) {
        console.error('[FixedStars] Failed to fetch:', error);
      } finally {
        setFixedStarLoading(false);
      }
    };
    fetchStars();
  }, [hasAnyVisibleFixedStar, onFetchFixedStarData, fixedStarData]);

  // Fetch transits — debounced + stale-fetch guard to avoid flicker from rapid jog-wheel scrubbing
  const transitFetchIdRef = useRef(0);
  useEffect(() => {
    if (!state.showTransits) {
      // Clear transit data when disabled
      if (state.transitData) {
        setState(prev => ({ ...prev, transitData: null }));
      }
      return;
    }

    if (!onFetchTransits) {
      console.warn('Transits enabled but onFetchTransits callback not provided');
      return;
    }

    const fetchId = ++transitFetchIdRef.current;

    // Debounce 150ms to let rapid jog-wheel steps settle before fetching
    const timer = setTimeout(async () => {
      setState(prev => ({ ...prev, transitLoading: true }));
      onTransitLoadingChange?.(true);
      try {
        const data = await onFetchTransits(state.transitDate, state.transitTime, chartA, chartB, computedAsteroids);
        if (fetchId !== transitFetchIdRef.current) return;
        setState(prev => ({ ...prev, transitData: data, transitLoading: false }));
        onTransitLoadingChange?.(false);
      } catch (error) {
        if (fetchId !== transitFetchIdRef.current) return;
        console.error('Failed to fetch transits:', error);
        setState(prev => ({ ...prev, transitLoading: false }));
        onTransitLoadingChange?.(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [state.showTransits, state.transitDate, state.transitTime, chartA, chartB, onFetchTransits, computedAsteroids, onTransitLoadingChange]);

  // Fetch solar return when showSolarReturn is enabled or year changes
  useEffect(() => {
    if (!state.showSolarReturn) {
      if (state.solarReturnData) {
        setState(prev => ({ ...prev, solarReturnData: null }));
      }
      return;
    }
    if (!onFetchSolarReturn) return;

    const fetchData = async () => {
      setState(prev => ({ ...prev, solarReturnLoading: true }));
      onSolarReturnLoadingChange?.(true);
      try {
        const data = await onFetchSolarReturn(state.solarReturnYear, chartA);
        setState(prev => ({ ...prev, solarReturnData: data, solarReturnLoading: false }));
        onSolarReturnLoadingChange?.(false);
        onSolarReturnDataChange?.(data);
      } catch (error) {
        console.error('Failed to fetch solar return:', error);
        setState(prev => ({ ...prev, solarReturnLoading: false, solarReturnData: null }));
        onSolarReturnLoadingChange?.(false);
        onSolarReturnDataChange?.(null);
      }
    };
    fetchData();
  }, [state.showSolarReturn, state.solarReturnYear, chartA, onFetchSolarReturn, onSolarReturnLoadingChange]);

  // Fetch lunar return when showLunarReturn is enabled or startDate changes
  useEffect(() => {
    if (!state.showLunarReturn) {
      if (state.lunarReturnData) {
        setState(prev => ({ ...prev, lunarReturnData: null }));
      }
      return;
    }
    if (!onFetchLunarReturn) return;

    const fetchData = async () => {
      setState(prev => ({ ...prev, lunarReturnLoading: true }));
      onLunarReturnLoadingChange?.(true);
      try {
        const data = await onFetchLunarReturn(state.lunarReturnStartDate, chartA);
        setState(prev => ({ ...prev, lunarReturnData: data, lunarReturnLoading: false }));
        onLunarReturnLoadingChange?.(false);
        onLunarReturnDataChange?.(data);
      } catch (error) {
        console.error('Failed to fetch lunar return:', error);
        setState(prev => ({ ...prev, lunarReturnLoading: false, lunarReturnData: null }));
        onLunarReturnLoadingChange?.(false);
        onLunarReturnDataChange?.(null);
      }
    };
    fetchData();
  }, [state.showLunarReturn, state.lunarReturnStartDate, chartA, onFetchLunarReturn, onLunarReturnLoadingChange]);

  // Fetch composite when chartMode is 'composite'
  useEffect(() => {
    if (state.chartMode !== 'composite' || !onFetchComposite) return;

    const fetchData = async () => {
      setState(prev => ({ ...prev, compositeLoading: true }));
      try {
        const data = await onFetchComposite(chartA, chartB, computedAsteroids);
        setState(prev => ({ ...prev, compositeData: data, compositeLoading: false }));
      } catch (error) {
        console.error('Failed to fetch composite:', error);
        setState(prev => ({ ...prev, compositeLoading: false }));
      }
    };

    fetchData();
  }, [state.chartMode, chartA, chartB, onFetchComposite, computedAsteroids]);

  // Fetch Davison chart when chartMode is 'davison'
  useEffect(() => {
    if (state.chartMode !== 'davison' || !onFetchDavison) return;
    if (state.davisonData) return; // Already fetched

    const fetchData = async () => {
      setState(prev => ({ ...prev, davisonLoading: true }));
      try {
        const data = await onFetchDavison();
        setState(prev => ({ ...prev, davisonData: data, davisonLoading: false }));
      } catch (error) {
        console.error('Failed to fetch Davison chart:', error);
        setState(prev => ({ ...prev, davisonLoading: false }));
      }
    };

    fetchData();
  }, [state.chartMode, onFetchDavison, state.davisonData]);

  // Fetch progressed chart when progressedPerson is set or progressedDate changes
  useEffect(() => {
    if (!progressedPerson || !state.showProgressed) {
      if (state.progressedData || state.progressedDataOther) {
        setState(prev => ({ ...prev, progressedData: null, progressedDataOther: null }));
      }
      return;
    }

    if (!onFetchProgressed) return;

    const fetchData = async () => {
      const primaryPerson = progressedPerson === 'both' ? 'A' : progressedPerson;
      const otherPerson = primaryPerson === 'A' ? 'B' : 'A';
      setState(prev => ({ ...prev, progressedLoading: true }));
      onProgressedLoadingChange?.(true);
      try {
        const data = await onFetchProgressed(primaryPerson, state.progressedDate, computedAsteroids);
        setState(prev => ({ ...prev, progressedData: data, progressedLoading: false }));
        onProgressedLoadingChange?.(false);

        try {
          const otherData = await onFetchProgressed(otherPerson, state.progressedDate, computedAsteroids);
          setState(prev => ({ ...prev, progressedDataOther: otherData }));
        } catch {
          // Other person fetch is non-critical
        }
      } catch (error) {
        console.error('Progressed chart fetch failed:', error);
        setState(prev => ({ ...prev, progressedLoading: false, progressedData: null, progressedDataOther: null }));
        onProgressedLoadingChange?.(false);
      }
    };

    fetchData();
  }, [progressedPerson, state.showProgressed, state.progressedDate, onFetchProgressed, computedAsteroids]);

  // Fetch relocated chart when relocatedPerson is set or per-person locations change
  useEffect(() => {
    if (!relocatedPerson || !state.showRelocated) {
      if (state.relocatedData || state.relocatedDataOther) {
        setState(prev => ({ ...prev, relocatedData: null, relocatedDataOther: null }));
      }
      return;
    }

    // Determine which location each person uses
    const locationA = state.relocatedLocationA;
    const locationB = state.relocatedLocationB;

    // Need at least one location for the active person(s)
    const needA = relocatedPerson === 'A' || relocatedPerson === 'both';
    const needB = relocatedPerson === 'B' || relocatedPerson === 'both';
    if ((needA && !locationA) && (needB && !locationB)) {
      // No locations available for active persons — clear data
      if (state.relocatedData || state.relocatedDataOther) {
        setState(prev => ({ ...prev, relocatedData: null, relocatedDataOther: null }));
      }
      return;
    }

    if (!onFetchRelocated) return;

    const fetchData = async () => {
      const primaryPerson = relocatedPerson === 'both' ? 'A' : relocatedPerson;
      const otherPerson = primaryPerson === 'A' ? 'B' : 'A';
      const primaryLocation = primaryPerson === 'A' ? locationA : locationB;
      const otherLocation = otherPerson === 'A' ? locationA : locationB;

      setState(prev => ({ ...prev, relocatedLoading: true }));
      onRelocatedLoadingChange?.(true);
      try {
        // Fetch primary person at THEIR location
        if (primaryLocation) {
          const data = await onFetchRelocated(primaryPerson, primaryLocation.lat, primaryLocation.lng, computedAsteroids);
          setState(prev => ({ ...prev, relocatedData: data, relocatedLoading: false }));
        } else {
          setState(prev => ({ ...prev, relocatedData: null, relocatedLoading: false }));
        }
        onRelocatedLoadingChange?.(false);

        // Fetch other person at THEIR location
        if (otherLocation) {
          try {
            const otherData = await onFetchRelocated(otherPerson, otherLocation.lat, otherLocation.lng, computedAsteroids);
            setState(prev => ({ ...prev, relocatedDataOther: otherData }));
          } catch {
            // Other person fetch is non-critical
          }
        } else {
          setState(prev => ({ ...prev, relocatedDataOther: null }));
        }
      } catch (error) {
        console.error('Relocated chart fetch failed:', error);
        setState(prev => ({ ...prev, relocatedLoading: false, relocatedData: null, relocatedDataOther: null }));
        onRelocatedLoadingChange?.(false);
      }
    };

    fetchData();
  }, [relocatedPerson, state.showRelocated, state.relocatedLocationA, state.relocatedLocationB, onFetchRelocated, computedAsteroids]);

  // Transit/Composite toggle handlers
  const setShowTransits = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showTransits: show,
      // Disable SR/LR when enabling transits (mutually exclusive outer ring)
      ...(show ? { showSolarReturn: false, showLunarReturn: false } : {}),
    }));
    if (show) {
      analytics.trackTransitsEnabled();
      onShowSolarReturnChange?.(false);
      onShowLunarReturnChange?.(false);
    }
    onShowTransitsChange?.(show);
  }, [onShowTransitsChange, onShowSolarReturnChange, onShowLunarReturnChange]);

  const setTransitDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, transitDate: date }));
    onTransitDateChange?.(date);
  }, [onTransitDateChange]);

  const setTransitTime = useCallback((time: string) => {
    setState(prev => ({ ...prev, transitTime: time }));
    onTransitTimeChange?.(time);
  }, [onTransitTimeChange]);

  // Solar return setters (mutually exclusive with transits and lunar return)
  const setShowSolarReturn = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showSolarReturn: show,
      // Disable transits and lunar return when enabling solar return
      ...(show ? { showTransits: false, showLunarReturn: false } : {}),
    }));
    onShowSolarReturnChange?.(show);
    if (show) {
      onShowTransitsChange?.(false);
      onShowLunarReturnChange?.(false);
    }
  }, [onShowSolarReturnChange, onShowTransitsChange, onShowLunarReturnChange]);

  const setSolarReturnYear = useCallback((year: number) => {
    setState(prev => ({ ...prev, solarReturnYear: year }));
    onSolarReturnYearChange?.(year);
  }, [onSolarReturnYearChange]);

  // Lunar return setters (mutually exclusive with transits and solar return)
  const setShowLunarReturn = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showLunarReturn: show,
      ...(show ? { showTransits: false, showSolarReturn: false } : {}),
    }));
    onShowLunarReturnChange?.(show);
    if (show) {
      onShowTransitsChange?.(false);
      onShowSolarReturnChange?.(false);
    }
  }, [onShowLunarReturnChange, onShowTransitsChange, onShowSolarReturnChange]);

  const setLunarReturnStartDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, lunarReturnStartDate: date }));
    onLunarReturnStartDateChange?.(date);
  }, [onLunarReturnStartDateChange]);

  const setChartMode = useCallback((mode: ChartMode) => {
    setState(prev => ({
      ...prev,
      chartMode: mode,
      // Composite is standalone — disable progressed/relocated overlays (locations persist)
      ...(mode === 'composite' ? {
        showProgressed: false,
        progressedData: null,
        progressedDataOther: null,
        showRelocated: false,
        relocatedData: null,
        relocatedDataOther: null,
      } : {}),
    }));
    if (mode === 'composite') {
      setProgressedPerson(null);
      setRelocatedPerson(null);
      onProgressedPersonChange?.(null);
      onRelocatedPersonChange?.(null);
      analytics.trackCompositeViewed();
    }
    onChartModeChange?.(mode);
  }, [onChartModeChange, onProgressedPersonChange, onRelocatedPersonChange]);

  // Progressed chart handlers - mutually exclusive with relocated; auto-exits composite
  const setShowProgressed = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showProgressed: show,
      // Disable relocated when enabling progressed (mutually exclusive — locations persist)
      ...(show ? { showRelocated: false, relocatedData: null, relocatedDataOther: null, progressedDataOther: null } : {}),
      // Progressed overlays synastry — auto-switch out of composite
      ...(show && prev.chartMode === 'composite' ? { chartMode: 'synastry' as ChartMode } : {}),
    }));
    if (show) {
      analytics.trackProgressedEnabled({ person: progressedPerson || 'A' });
      setRelocatedPerson(null);
      onRelocatedPersonChange?.(null);
    }
  }, [onRelocatedPersonChange, progressedPerson]);

  const setProgressedDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, progressedDate: date }));
    onProgressedDateChange?.(date);
  }, [onProgressedDateChange]);

  // Solar Arc toggle - mutually exclusive with progressed (reuses progressed data)
  const setShowSolarArc = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showSolarArc: show,
      // Solar arc and progressed are mutually exclusive for display
      showProgressed: show ? false : prev.showProgressed,
    }));
    onShowSolarArcChange?.(show);
  }, [onShowSolarArcChange]);

  // Relocated chart handlers - mutually exclusive with progressed; auto-exits composite
  const setShowRelocated = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showRelocated: show,
      // Disable progressed when enabling relocated (mutually exclusive)
      ...(show ? { showProgressed: false, progressedData: null, progressedDataOther: null } : {}),
      // Relocated overlays synastry — auto-switch out of composite
      ...(show && prev.chartMode === 'composite' ? { chartMode: 'synastry' as ChartMode } : {}),
    }));
    if (show) {
      analytics.trackRelocatedEnabled({ person: relocatedPerson || 'A' });
      setProgressedPerson(null);
      onProgressedPersonChange?.(null);
    }
  }, [onProgressedPersonChange, relocatedPerson]);

  const setRelocatedLocationForPerson = useCallback((person: 'A' | 'B', location: LocationData | null) => {
    setState(prev => ({
      ...prev,
      ...(person === 'A' ? { relocatedLocationA: location } : { relocatedLocationB: location }),
      // Clear fetched data so it refetches with new location
      relocatedData: null,
      relocatedDataOther: null,
    }));
  }, []);

  const setShowLocationPicker = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showLocationPicker: show }));
  }, []);

  const handleLocationConfirm = useCallback((location: LocationData) => {
    const target = stateRef_locationPickerTarget.current || 'A';
    setRelocatedLocationForPerson(target, location);
    setShowLocationPicker(false);
  }, [setRelocatedLocationForPerson, setShowLocationPicker]);

  // Keep a ref for locationPickerTarget so handleLocationConfirm doesn't need state in deps
  const stateRef_locationPickerTarget = useRef<'A' | 'B' | null>(null);
  useEffect(() => { stateRef_locationPickerTarget.current = state.locationPickerTarget; }, [state.locationPickerTarget]);

  const handleResetLocation = useCallback(() => {
    setState(prev => ({ ...prev, relocatedLocationA: null, relocatedLocationB: null, relocatedData: null, relocatedDataOther: null }));
  }, []);

  // ─── Birth Time Shift (Rectification) ────────────────────────────

  /** Compute shifted date+time from base date/time and a minute offset using Date arithmetic. */
  const computeShiftedDateTime = useCallback((baseDate: string, baseTime: string, offsetMinutes: number): { date: string; time: string } => {
    const [y, mo, d] = baseDate.split('-').map(Number);
    const [hh, mm] = baseTime.split(':').map(Number);
    const dt = new Date(y, mo - 1, d, hh, mm, 0, 0);
    dt.setMinutes(dt.getMinutes() + offsetMinutes);
    return {
      date: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`,
      time: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
    };
  }, []);

  const setShowBirthTimeShift = useCallback((show: boolean) => {
    setState(prev => {
      // When hiding, reset offsets
      if (!show) {
        onTimeShiftAChange?.(0);
        onTimeShiftBChange?.(0);
        onShowBirthTimeShiftChange?.(false);
        return { ...prev, showBirthTimeShift: false, timeShiftA: 0, timeShiftB: 0, shiftedChartA: null, shiftedChartB: null };
      }
      onShowBirthTimeShiftChange?.(true);
      return { ...prev, showBirthTimeShift: true };
    });
  }, [onTimeShiftAChange, onTimeShiftBChange, onShowBirthTimeShiftChange]);

  const setTimeShiftA = useCallback((offset: number) => {
    setState(prev => ({ ...prev, timeShiftA: offset }));
    onTimeShiftAChange?.(offset);
  }, [onTimeShiftAChange]);

  const setTimeShiftB = useCallback((offset: number) => {
    setState(prev => ({ ...prev, timeShiftB: offset }));
    onTimeShiftBChange?.(offset);
  }, [onTimeShiftBChange]);

  const resetTimeShiftA = useCallback(() => {
    setState(prev => ({ ...prev, timeShiftA: 0, shiftedChartA: null }));
    onTimeShiftAChange?.(0);
  }, [onTimeShiftAChange]);

  const resetTimeShiftB = useCallback(() => {
    setState(prev => ({ ...prev, timeShiftB: 0, shiftedChartB: null }));
    onTimeShiftBChange?.(0);
  }, [onTimeShiftBChange]);

  // Debounced fetch for shifted natal charts
  useEffect(() => {
    if (!enableBirthTimeShift || !onFetchShiftedNatal) return;
    if (state.timeShiftA === 0 && state.timeShiftB === 0) {
      // Clear shifted data when back to zero
      setState(prev => {
        if (prev.shiftedChartA || prev.shiftedChartB) {
          return { ...prev, shiftedChartA: null, shiftedChartB: null, birthTimeShiftLoading: false };
        }
        return prev;
      });
      return;
    }

    setState(prev => ({ ...prev, birthTimeShiftLoading: true }));
    const timer = setTimeout(async () => {
      try {
        const promises: Promise<void>[] = [];

        if (state.timeShiftA !== 0 && birthDateA && birthTimeA) {
          const shifted = computeShiftedDateTime(birthDateA, birthTimeA, state.timeShiftA);
          promises.push(
            onFetchShiftedNatal('A', shifted.date, shifted.time, asteroids).then(chart => {
              setState(prev => ({ ...prev, shiftedChartA: chart }));
            })
          );
        }

        if (state.timeShiftB !== 0 && birthDateB && birthTimeB) {
          const shifted = computeShiftedDateTime(birthDateB, birthTimeB, state.timeShiftB);
          promises.push(
            onFetchShiftedNatal('B', shifted.date, shifted.time, asteroids).then(chart => {
              setState(prev => ({ ...prev, shiftedChartB: chart }));
            })
          );
        }

        await Promise.all(promises);
      } catch (err) {
        console.error('Birth time shift fetch failed:', err);
      } finally {
        setState(prev => ({ ...prev, birthTimeShiftLoading: false }));
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [enableBirthTimeShift, onFetchShiftedNatal, state.timeShiftA, state.timeShiftB, birthDateA, birthTimeA, birthDateB, birthTimeB, computeShiftedDateTime, asteroids]);

  // Asteroid group handlers - also toggle visibility
  const toggleAsteroidGroup = useCallback((group: AsteroidGroup) => {
    setState(prev => {
      const nextGroups = new Set(prev.enabledAsteroidGroups);
      const nextPlanets = new Set(prev.visiblePlanets);
      const asteroids = ASTEROID_GROUPS[group];

      if (nextGroups.has(group)) {
        // Removing group - remove asteroids from visible
        nextGroups.delete(group);
        for (const asteroid of asteroids) {
          nextPlanets.delete(asteroid);
        }
      } else {
        // Adding group - add asteroids to visible
        nextGroups.add(group);
        for (const asteroid of asteroids) {
          nextPlanets.add(asteroid);
        }
        analytics.trackAsteroidsEnabled({ groups: [group] });
      }
      return { ...prev, enabledAsteroidGroups: nextGroups, visiblePlanets: nextPlanets };
    });
  }, []);

  const enableAllAsteroids = useCallback(() => {
    setState(prev => {
      const nextPlanets = new Set(prev.visiblePlanets);
      // Add all asteroids from all groups to visible
      for (const group of Object.keys(ASTEROID_GROUPS) as AsteroidGroup[]) {
        for (const asteroid of ASTEROID_GROUPS[group]) {
          nextPlanets.add(asteroid);
        }
      }
      return {
        ...prev,
        enabledAsteroidGroups: new Set(Object.keys(ASTEROID_GROUPS) as AsteroidGroup[]),
        visiblePlanets: nextPlanets,
      };
    });
  }, []);

  const disableAllAsteroids = useCallback(() => {
    setState(prev => {
      const nextPlanets = new Set(prev.visiblePlanets);
      // Remove all asteroids from all groups from visible
      for (const group of Object.keys(ASTEROID_GROUPS) as AsteroidGroup[]) {
        for (const asteroid of ASTEROID_GROUPS[group]) {
          nextPlanets.delete(asteroid);
        }
      }
      return {
        ...prev,
        enabledAsteroidGroups: new Set<AsteroidGroup>(),
        visiblePlanets: nextPlanets,
      };
    });
  }, []);

  // Fixed star group handlers - toggle visibility
  const toggleFixedStarGroup = useCallback((group: FixedStarGroup) => {
    console.log('[FixedStars] toggleFixedStarGroup:', group);
    setState(prev => {
      const nextGroups = new Set(prev.enabledFixedStarGroups);
      const nextPlanets = new Set(prev.visiblePlanets);
      const stars = FIXED_STAR_GROUPS[group];

      if (nextGroups.has(group)) {
        nextGroups.delete(group);
        for (const star of stars) { nextPlanets.delete(star); }
      } else {
        nextGroups.add(group);
        for (const star of stars) { nextPlanets.add(star); }
      }
      return { ...prev, enabledFixedStarGroups: nextGroups, visiblePlanets: nextPlanets };
    });
  }, []);

  const enableAllFixedStars = useCallback(() => {
    setState(prev => {
      const nextPlanets = new Set(prev.visiblePlanets);
      for (const group of Object.keys(FIXED_STAR_GROUPS) as FixedStarGroup[]) {
        for (const star of FIXED_STAR_GROUPS[group]) { nextPlanets.add(star); }
      }
      return {
        ...prev,
        enabledFixedStarGroups: new Set(Object.keys(FIXED_STAR_GROUPS) as FixedStarGroup[]),
        visiblePlanets: nextPlanets,
      };
    });
  }, []);

  const disableAllFixedStars = useCallback(() => {
    setState(prev => {
      const nextPlanets = new Set(prev.visiblePlanets);
      for (const group of Object.keys(FIXED_STAR_GROUPS) as FixedStarGroup[]) {
        for (const star of FIXED_STAR_GROUPS[group]) { nextPlanets.delete(star); }
      }
      return {
        ...prev,
        enabledFixedStarGroups: new Set<FixedStarGroup>(),
        visiblePlanets: nextPlanets,
      };
    });
  }, []);

  // Merge planets with angles and asteroid data for aspect calculations
  const planetsWithAnglesA = useMemo(() => {
    const merged = { ...chartA.planets };
    // Merge asteroid data if available
    if (asteroidData?.chartA) {
      for (const [key, value] of Object.entries(asteroidData.chartA)) {
        if (!merged[key]) {
          merged[key] = value;
        }
      }
    }
    // Merge fixed star data if available
    if (fixedStarData?.chartA) {
      for (const [key, value] of Object.entries(fixedStarData.chartA)) {
        if (!merged[key]) merged[key] = value;
      }
    }
    if (chartA.angles) {
      if (chartA.angles.ascendant !== undefined) {
        merged.ascendant = { longitude: chartA.angles.ascendant, sign: '', retrograde: false };
      }
      if (chartA.angles.midheaven !== undefined) {
        merged.midheaven = { longitude: chartA.angles.midheaven, sign: '', retrograde: false };
      }
    }
    // Calculate Arabic Parts from chart data
    const ascA = chartA.angles?.ascendant;
    if (ascA !== undefined) {
      const parts = calculateArabicParts(merged, ascA);
      for (const [key, value] of Object.entries(parts)) {
        if (!merged[key]) merged[key] = value;
      }
    }
    return merged;
  }, [chartA.planets, chartA.angles, asteroidData, fixedStarData]);

  const planetsWithAnglesB = useMemo(() => {
    const merged = { ...chartB.planets };
    // Merge asteroid data if available
    if (asteroidData?.chartB) {
      for (const [key, value] of Object.entries(asteroidData.chartB)) {
        if (!merged[key]) {
          merged[key] = value;
        }
      }
    }
    // Merge fixed star data if available
    if (fixedStarData?.chartB) {
      for (const [key, value] of Object.entries(fixedStarData.chartB)) {
        if (!merged[key]) merged[key] = value;
      }
    }
    if (chartB.angles) {
      if (chartB.angles.ascendant !== undefined) {
        merged.ascendant = { longitude: chartB.angles.ascendant, sign: '', retrograde: false };
      }
      if (chartB.angles.midheaven !== undefined) {
        merged.midheaven = { longitude: chartB.angles.midheaven, sign: '', retrograde: false };
      }
    }
    // Calculate Arabic Parts from chart data
    const ascB = chartB.angles?.ascendant;
    if (ascB !== undefined) {
      const parts = calculateArabicParts(merged, ascB);
      for (const [key, value] of Object.entries(parts)) {
        if (!merged[key]) merged[key] = value;
      }
    }
    return merged;
  }, [chartB.planets, chartB.angles, asteroidData, fixedStarData]);

  // Create merged chart objects that include asteroid data for rendering
  const mergedChartA = useMemo((): NatalChart => ({
    planets: planetsWithAnglesA,
    houses: chartA.houses,
    angles: chartA.angles,
  }), [planetsWithAnglesA, chartA.houses, chartA.angles]);

  const mergedChartB = useMemo((): NatalChart => ({
    planets: planetsWithAnglesB,
    houses: chartB.houses,
    angles: chartB.angles,
  }), [planetsWithAnglesB, chartB.houses, chartB.angles]);

  // Compute declination maps for parallel/contraparallel detection
  const declinationsA = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [key, data] of Object.entries(planetsWithAnglesA)) {
      if (data?.longitude !== undefined) {
        result[key] = calculateDeclination(data.longitude, data.latitude ?? 0);
      }
    }
    return result;
  }, [planetsWithAnglesA]);

  const declinationsB = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [key, data] of Object.entries(planetsWithAnglesB)) {
      if (data?.longitude !== undefined) {
        result[key] = calculateDeclination(data.longitude, data.latitude ?? 0);
      }
    }
    return result;
  }, [planetsWithAnglesB]);

  // Helper: convert TransitPlanet[] to Record<string, PlanetData> for effectiveChart
  const progressedPlanetsToRecord = useCallback((
    progressedPlanets: import('./types').TransitPlanet[],
    basePlanets: Record<string, import('./types').PlanetData>
  ): Record<string, import('./types').PlanetData> => {
    const result = { ...basePlanets };
    for (const p of progressedPlanets) {
      const key = p.planet.toLowerCase();
      result[key] = {
        longitude: p.longitude,
        sign: p.sign,
        retrograde: p.retrograde,
        decan: p.decan,
        decanSign: p.decanSign,
      };
    }
    return result;
  }, []);

  // Create effective chart objects that use relocated/progressed data when active
  // Both people's house rings update, so both charts get the applicable overlay data
  const effectiveChartA = useMemo((): NatalChart => {
    // BIRTH TIME SHIFT: highest priority — replaces natal chart in-place
    if (state.timeShiftA !== 0 && state.shiftedChartA) {
      return {
        planets: { ...state.shiftedChartA.planets, ...((asteroidData || fixedStarData) ? Object.fromEntries(Object.entries(planetsWithAnglesA).filter(([k]) => !(k in (state.shiftedChartA?.planets || {})))) : {}) },
        houses: state.shiftedChartA.houses,
        angles: state.shiftedChartA.angles,
      };
    }

    // RELOCATED: determine which relocated data applies to Person A
    // When 'A' or 'both': primary=A, so relocatedData has A's data
    // When 'B': primary=B, so relocatedDataOther has A's data
    const relocatedHouses = state.showRelocated && (relocatedPerson === 'A' || relocatedPerson === 'both') && state.relocatedData?.houses
      ? state.relocatedData.houses
      : state.showRelocated && relocatedPerson === 'B' && state.relocatedDataOther?.houses
        ? state.relocatedDataOther.houses
        : null;

    if (relocatedHouses) {
      const relocatedAsc = relocatedHouses.ascendant;
      const relocatedMc = relocatedHouses.mc;
      const relocatedPlanets = { ...planetsWithAnglesA };
      if (relocatedAsc !== undefined) {
        relocatedPlanets.ascendant = { longitude: relocatedAsc, sign: '', retrograde: false };
      }
      if (relocatedMc !== undefined) {
        relocatedPlanets.midheaven = { longitude: relocatedMc, sign: '', retrograde: false };
      }
      return {
        planets: relocatedPlanets,
        houses: chartA.houses,
        angles: { ascendant: relocatedAsc, midheaven: relocatedMc },
      };
    }

    // PROGRESSED: determine which progressed data applies to Person A
    // When 'A' or 'both': primary=A, so progressedData has A's data
    // When 'B': primary=B, so progressedDataOther has A's data
    const progressedData = state.showProgressed && (progressedPerson === 'A' || progressedPerson === 'both') && state.progressedData
      ? state.progressedData
      : state.showProgressed && progressedPerson === 'B' && state.progressedDataOther
        ? state.progressedDataOther
        : null;

    if (progressedData?.progressed_planets) {
      // SOLAR ARC: use progressed Sun to derive solar arc directed positions
      if (state.showSolarArc) {
        const progressedSunPlanet = progressedData.progressed_planets.find(p => p.planet.toLowerCase() === 'sun');
        if (progressedSunPlanet) {
          const solarArcResult = calculateSolarArc(mergedChartA, progressedSunPlanet.longitude);
          return {
            planets: solarArcResult.planets,
            houses: chartA.houses,
            angles: chartA.angles,
          };
        }
      }

      // PROGRESSED: standard secondary progressions
      const progressedPlanets = progressedPlanetsToRecord(progressedData.progressed_planets, planetsWithAnglesA);
      const progressedAsc = progressedData.houses?.ascendant;
      const progressedMc = progressedData.houses?.mc;
      if (progressedAsc !== undefined) {
        progressedPlanets.ascendant = { longitude: progressedAsc, sign: '', retrograde: false };
      }
      if (progressedMc !== undefined) {
        progressedPlanets.midheaven = { longitude: progressedMc, sign: '', retrograde: false };
      }
      return {
        planets: progressedPlanets,
        houses: chartA.houses,
        angles: progressedAsc !== undefined && progressedMc !== undefined
          ? { ascendant: progressedAsc, midheaven: progressedMc }
          : chartA.angles,
      };
    }

    return mergedChartA;
  }, [state.timeShiftA, state.shiftedChartA, asteroidData, fixedStarData, state.showRelocated, relocatedPerson, state.relocatedData?.houses, state.relocatedDataOther?.houses, state.showProgressed, state.showSolarArc, progressedPerson, state.progressedData, state.progressedDataOther, progressedPlanetsToRecord, planetsWithAnglesA, chartA.houses, chartA.angles, mergedChartA]);

  const effectiveChartB = useMemo((): NatalChart => {
    // BIRTH TIME SHIFT: highest priority — replaces natal chart in-place
    if (state.timeShiftB !== 0 && state.shiftedChartB) {
      return {
        planets: { ...state.shiftedChartB.planets, ...((asteroidData || fixedStarData) ? Object.fromEntries(Object.entries(planetsWithAnglesB).filter(([k]) => !(k in (state.shiftedChartB?.planets || {})))) : {}) },
        houses: state.shiftedChartB.houses,
        angles: state.shiftedChartB.angles,
      };
    }

    // RELOCATED: determine which relocated data applies to Person B
    // When 'B': primary=B, so relocatedData has B's data
    // When 'A' or 'both': primary=A, so relocatedDataOther has B's data
    const relocatedHouses = state.showRelocated && relocatedPerson === 'B' && state.relocatedData?.houses
      ? state.relocatedData.houses
      : state.showRelocated && (relocatedPerson === 'A' || relocatedPerson === 'both') && state.relocatedDataOther?.houses
        ? state.relocatedDataOther.houses
        : null;

    if (relocatedHouses) {
      const relocatedAsc = relocatedHouses.ascendant;
      const relocatedMc = relocatedHouses.mc;
      const relocatedPlanets = { ...planetsWithAnglesB };
      if (relocatedAsc !== undefined) {
        relocatedPlanets.ascendant = { longitude: relocatedAsc, sign: '', retrograde: false };
      }
      if (relocatedMc !== undefined) {
        relocatedPlanets.midheaven = { longitude: relocatedMc, sign: '', retrograde: false };
      }
      return {
        planets: relocatedPlanets,
        houses: chartB.houses,
        angles: { ascendant: relocatedAsc, midheaven: relocatedMc },
      };
    }

    // PROGRESSED: determine which progressed data applies to Person B
    // When 'B': primary=B, so progressedData has B's data
    // When 'A' or 'both': primary=A, so progressedDataOther has B's data
    const progressedData = state.showProgressed && progressedPerson === 'B' && state.progressedData
      ? state.progressedData
      : state.showProgressed && (progressedPerson === 'A' || progressedPerson === 'both') && state.progressedDataOther
        ? state.progressedDataOther
        : null;

    if (progressedData?.progressed_planets) {
      // SOLAR ARC: use progressed Sun to derive solar arc directed positions
      if (state.showSolarArc) {
        const progressedSunPlanet = progressedData.progressed_planets.find(p => p.planet.toLowerCase() === 'sun');
        if (progressedSunPlanet) {
          const solarArcResult = calculateSolarArc(mergedChartB, progressedSunPlanet.longitude);
          return {
            planets: solarArcResult.planets,
            houses: chartB.houses,
            angles: chartB.angles,
          };
        }
      }

      const progressedPlanets = progressedPlanetsToRecord(progressedData.progressed_planets, planetsWithAnglesB);
      const progressedAsc = progressedData.houses?.ascendant;
      const progressedMc = progressedData.houses?.mc;
      if (progressedAsc !== undefined) {
        progressedPlanets.ascendant = { longitude: progressedAsc, sign: '', retrograde: false };
      }
      if (progressedMc !== undefined) {
        progressedPlanets.midheaven = { longitude: progressedMc, sign: '', retrograde: false };
      }
      return {
        planets: progressedPlanets,
        houses: chartB.houses,
        angles: progressedAsc !== undefined && progressedMc !== undefined
          ? { ascendant: progressedAsc, midheaven: progressedMc }
          : chartB.angles,
      };
    }

    return mergedChartB;
  }, [state.timeShiftB, state.shiftedChartB, asteroidData, fixedStarData, state.showRelocated, relocatedPerson, state.relocatedData?.houses, state.relocatedDataOther?.houses, state.showProgressed, state.showSolarArc, progressedPerson, state.progressedData, state.progressedDataOther, progressedPlanetsToRecord, planetsWithAnglesB, chartB.houses, chartB.angles, mergedChartB]);

  // Swap-aware chart and name references
  const displayChartA = swapped ? effectiveChartB : effectiveChartA;
  const displayChartB = swapped ? effectiveChartA : effectiveChartB;
  const displayNameA = swapped ? nameB : nameA;
  const displayNameB = swapped ? nameA : nameB;

  // Merge composite planets with angles
  const compositeWithAngles = useMemo(() => {
    if (!state.compositeData) return {};
    const merged: Record<string, { longitude: number }> = {};
    // CompositeData.planets is an array of TransitPlanet
    if (Array.isArray(state.compositeData.planets)) {
      for (const planet of state.compositeData.planets) {
        if (planet && typeof planet === 'object' && 'planet' in planet && 'longitude' in planet) {
          merged[planet.planet.toLowerCase()] = { longitude: planet.longitude };
        }
      }
    }
    // Houses are in a CompositeHouses object
    if (state.compositeData.houses?.ascendant !== undefined) {
      merged.ascendant = { longitude: state.compositeData.houses.ascendant };
    }
    if (state.compositeData.houses?.mc !== undefined) {
      merged.midheaven = { longitude: state.compositeData.houses.mc };
    }
    return merged;
  }, [state.compositeData]);

  // Build a NatalChart from composite data for house overlay
  const compositeNatalChart = useMemo((): NatalChart | null => {
    if (!state.compositeData?.houses) return null;
    const planets: Record<string, PlanetData> = {};
    if (Array.isArray(state.compositeData.planets)) {
      for (const p of state.compositeData.planets) {
        if (p && 'planet' in p && 'longitude' in p) {
          planets[p.planet.toLowerCase()] = { longitude: p.longitude, sign: '', retrograde: false };
        }
      }
    }
    return {
      planets,
      angles: {
        ascendant: state.compositeData.houses.ascendant,
        midheaven: state.compositeData.houses.mc,
      },
    };
  }, [state.compositeData]);

  // Determine which charts to use for house overlay based on chart mode
  // In single-wheel modes, both rings should show the same chart's houses
  const houseOverlayChartA = useMemo((): NatalChart => {
    switch (state.chartMode) {
      case 'personB':
        return displayChartB;
      case 'composite':
        return compositeNatalChart || displayChartA;
      case 'davison':
        return state.davisonData || displayChartA;
      default:
        return displayChartA;
    }
  }, [state.chartMode, displayChartA, displayChartB, compositeNatalChart, state.davisonData]);

  const houseOverlayChartB = useMemo((): NatalChart => {
    switch (state.chartMode) {
      case 'personA':
        return displayChartA;
      case 'personB':
        return displayChartB;
      case 'composite':
        return compositeNatalChart || displayChartB;
      case 'davison':
        return state.davisonData || displayChartB;
      default:
        return displayChartB;
    }
  }, [state.chartMode, displayChartA, displayChartB, compositeNatalChart, state.davisonData]);

  // Build effective planet records from effective charts (includes birth-time shift, relocated, progressed)
  // These are used for aspect calculation so aspects update when the chart shifts
  const effectivePlanetsA = useMemo(() => {
    const merged: Record<string, { longitude: number; sign?: string; retrograde?: boolean }> = { ...effectiveChartA.planets };
    if (effectiveChartA.angles) {
      if (effectiveChartA.angles.ascendant !== undefined) {
        merged.ascendant = { longitude: effectiveChartA.angles.ascendant, sign: '', retrograde: false };
      }
      if (effectiveChartA.angles.midheaven !== undefined) {
        merged.midheaven = { longitude: effectiveChartA.angles.midheaven, sign: '', retrograde: false };
      }
    }
    return merged;
  }, [effectiveChartA]);

  const effectivePlanetsB = useMemo(() => {
    const merged: Record<string, { longitude: number; sign?: string; retrograde?: boolean }> = { ...effectiveChartB.planets };
    if (effectiveChartB.angles) {
      if (effectiveChartB.angles.ascendant !== undefined) {
        merged.ascendant = { longitude: effectiveChartB.angles.ascendant, sign: '', retrograde: false };
      }
      if (effectiveChartB.angles.midheaven !== undefined) {
        merged.midheaven = { longitude: effectiveChartB.angles.midheaven, sign: '', retrograde: false };
      }
    }
    return merged;
  }, [effectiveChartB]);

  // Build orb overrides from custom settings
  const orbOverrides = useMemo(() => {
    const overrides: import('./utils/aspectCalculations').OrbOverrides = {};
    if (customAspectOrbs && Object.keys(customAspectOrbs).length > 0) overrides.aspectOrbs = customAspectOrbs;
    if (customSeparatingAspectOrbs && Object.keys(customSeparatingAspectOrbs).length > 0) overrides.separatingAspectOrbs = customSeparatingAspectOrbs;
    if (customPlanetOrbs && Object.keys(customPlanetOrbs).length > 0) overrides.planetOrbs = customPlanetOrbs;
    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }, [customAspectOrbs, customSeparatingAspectOrbs, customPlanetOrbs]);

  // Calculate aspects based on chart mode
  // Uses effective planets so aspects update with birth-time shift, relocated, progressed overlays
  // When swapped in synastry mode, swap inputs so aspect.planetA refers to the outer ring person
  const aspects = useMemo(() => {
    switch (state.chartMode) {
      case 'personA':
        return calculateNatalAspects(effectivePlanetsA, state.visiblePlanets, undefined, orbOverrides);
      case 'personB':
        return calculateNatalAspects(effectivePlanetsB, state.visiblePlanets, undefined, orbOverrides);
      case 'composite':
        return state.compositeData
          ? calculateNatalAspects(compositeWithAngles, state.visiblePlanets, undefined, orbOverrides)
          : [];
      case 'davison':
        if (state.davisonData) {
          const davisonPlanets: Record<string, { longitude: number; sign?: string; retrograde?: boolean }> = { ...state.davisonData.planets };
          if (state.davisonData.angles) {
            if (state.davisonData.angles.ascendant !== undefined)
              davisonPlanets.ascendant = { longitude: state.davisonData.angles.ascendant, sign: '', retrograde: false };
            if (state.davisonData.angles.midheaven !== undefined)
              davisonPlanets.midheaven = { longitude: state.davisonData.angles.midheaven, sign: '', retrograde: false };
          }
          return calculateNatalAspects(davisonPlanets, state.visiblePlanets, undefined, orbOverrides);
        }
        return [];
      case 'synastry':
      default: {
        const outerPlanets = swapped ? effectivePlanetsB : effectivePlanetsA;
        const innerPlanets = swapped ? effectivePlanetsA : effectivePlanetsB;
        return calculateSynastryAspects(outerPlanets, innerPlanets, state.visiblePlanets, undefined, orbOverrides);
      }
    }
  }, [state.chartMode, effectivePlanetsA, effectivePlanetsB, compositeWithAngles, state.visiblePlanets, state.compositeData, swapped, orbOverrides]);

  // Calculate planet positions for both charts (for aspect line positioning)
  // Use displayChart (swap-aware) so aspect lines match the rendered planet positions
  const placedPlanetsA = useMemo(
    () => preparePlanets(displayChartA, state.visiblePlanets, dimensions, dimensions.planetARing),
    [displayChartA, state.visiblePlanets, dimensions]
  );

  const placedPlanetsB = useMemo(
    () => preparePlanets(displayChartB, state.visiblePlanets, dimensions, dimensions.planetBRing, 0, { minSpacing: MIN_SPACING_INNER, repelZone: REPEL_ZONE_INNER }),
    [displayChartB, state.visiblePlanets, dimensions]
  );

  // Create display position maps for aspect grid
  const displayPositionsA: PlanetDisplayPositions = useMemo(() => {
    const map = new Map<string, number>();
    for (const planet of placedPlanetsA) {
      map.set(planet.key, planet.displayLongitude);
    }
    return map;
  }, [placedPlanetsA]);

  const displayPositionsB: PlanetDisplayPositions = useMemo(() => {
    const map = new Map<string, number>();
    for (const planet of placedPlanetsB) {
      map.set(planet.key, planet.displayLongitude);
    }
    return map;
  }, [placedPlanetsB]);

  // Display positions for single-wheel mode (natal aspects)
  const displayPositions: PlanetDisplayPositions = useMemo(() => {
    const map = new Map<string, number>();
    switch (state.chartMode) {
      case 'personA':
        for (const planet of placedPlanetsA) {
          map.set(planet.key, planet.displayLongitude);
        }
        break;
      case 'personB':
        for (const planet of placedPlanetsB) {
          map.set(planet.key, planet.displayLongitude);
        }
        break;
      case 'composite':
        // Will be populated by PlanetRing when composite data is available
        // For now, use raw longitudes from compositeWithAngles
        for (const [key, value] of Object.entries(compositeWithAngles)) {
          if (value && 'longitude' in value) {
            map.set(key, value.longitude);
          }
        }
        break;
      case 'davison':
        if (state.davisonData) {
          for (const [key, value] of Object.entries(state.davisonData.planets)) {
            if (value && 'longitude' in value) {
              map.set(key, (value as any).longitude);
            }
          }
          if (state.davisonData.angles) {
            map.set('ascendant', state.davisonData.angles.ascendant);
            map.set('midheaven', state.davisonData.angles.midheaven);
          }
        }
        break;
    }
    return map;
  }, [state.chartMode, placedPlanetsA, placedPlanetsB, compositeWithAngles]);

  // Outer ring planets: transits, solar return, or lunar return (mutually exclusive)
  const outerRingPlanets = useMemo(() => {
    if (state.showSolarReturn && state.solarReturnData?.planets) return state.solarReturnData.planets;
    if (state.showLunarReturn && state.lunarReturnData?.planets) return state.lunarReturnData.planets;
    if (state.showTransits && state.transitData?.transit_planets) return state.transitData.transit_planets;
    return null;
  }, [state.showSolarReturn, state.solarReturnData, state.showLunarReturn, state.lunarReturnData, state.showTransits, state.transitData]);

  // Outer ring display positions (map planet name to longitude) — works for transits, SR, LR
  const transitDisplayPositions: PlanetDisplayPositions = useMemo(() => {
    const map = new Map<string, number>();
    if (outerRingPlanets) {
      for (const planet of outerRingPlanets) {
        map.set(planet.planet, planet.longitude);
      }
    }
    return map;
  }, [outerRingPlanets]);

  // Calculate outer ring aspects to natal chart(s) (transits, SR, or LR)
  const transitAspects = useMemo(() => {
    if (!outerRingPlanets) return [];

    // Build outer ring planets object for aspect calculation (include speed for applying/separating)
    const transitPlanets: Record<string, { longitude: number; speed?: number }> = {};
    for (const tp of outerRingPlanets) {
      transitPlanets[tp.planet] = { longitude: tp.longitude, speed: (tp as any).speed };
    }

    const allAspects: Array<SynastryAspect & { natalChart: 'A' | 'B' | 'Composite' }> = [];

    // Calculate aspects based on chart mode
    if (state.chartMode === 'composite' && state.compositeData) {
      // Aspects to composite chart
      const compositeAspects = calculateSynastryAspects(
        transitPlanets,
        compositeWithAngles,
        state.visiblePlanets,
        undefined,
        orbOverrides
      );
      for (const asp of compositeAspects) {
        allAspects.push({ ...asp, natalChart: 'Composite' });
      }
    } else if (state.chartMode === 'davison' && state.davisonData) {
      const davisonPlanets: Record<string, { longitude: number }> = { ...state.davisonData.planets as any };
      if (state.davisonData.angles) {
        davisonPlanets.ascendant = { longitude: state.davisonData.angles.ascendant };
        davisonPlanets.midheaven = { longitude: state.davisonData.angles.midheaven };
      }
      const davisonAspects = calculateSynastryAspects(transitPlanets, davisonPlanets, state.visiblePlanets, undefined, orbOverrides);
      for (const asp of davisonAspects) {
        allAspects.push({ ...asp, natalChart: 'Composite' });
      }
    } else if (state.chartMode === 'personA') {
      // Only aspects to Person A
      const aspectsToA = calculateSynastryAspects(
        transitPlanets,
        planetsWithAnglesA,
        state.visiblePlanets,
        undefined,
        orbOverrides
      );
      for (const asp of aspectsToA) {
        allAspects.push({ ...asp, natalChart: 'A' });
      }
    } else if (state.chartMode === 'personB') {
      // Only aspects to Person B
      const aspectsToB = calculateSynastryAspects(
        transitPlanets,
        planetsWithAnglesB,
        state.visiblePlanets,
        undefined,
        orbOverrides
      );
      for (const asp of aspectsToB) {
        allAspects.push({ ...asp, natalChart: 'B' });
      }
    } else {
      // Synastry mode: aspects to both A and B
      const aspectsToA = calculateSynastryAspects(
        transitPlanets,
        planetsWithAnglesA,
        state.visiblePlanets,
        undefined,
        orbOverrides
      );
      for (const asp of aspectsToA) {
        allAspects.push({ ...asp, natalChart: 'A' });
      }

      const aspectsToB = calculateSynastryAspects(
        transitPlanets,
        planetsWithAnglesB,
        state.visiblePlanets,
        undefined,
        orbOverrides
      );
      for (const asp of aspectsToB) {
        allAspects.push({ ...asp, natalChart: 'B' });
      }
    }

    // Sort by orb tightness
    return allAspects.sort((a, b) => a.aspect.exactOrb - b.aspect.exactOrb);
  }, [
    outerRingPlanets,
    state.chartMode,
    state.compositeData,
    state.visiblePlanets,
    planetsWithAnglesA,
    planetsWithAnglesB,
    compositeWithAngles,
    orbOverrides,
  ]);

  // Actions
  const togglePlanet = useCallback((planet: string) => {
    setState((prev) => {
      const next = new Set(prev.visiblePlanets);
      if (next.has(planet)) {
        next.delete(planet);
      } else {
        next.add(planet);
      }
      return { ...prev, visiblePlanets: next };
    });
  }, []);

  const toggleAspect = useCallback((aspect: AspectType) => {
    setState((prev) => {
      const next = new Set(prev.visibleAspects);
      if (next.has(aspect)) {
        next.delete(aspect);
      } else {
        next.add(aspect);
      }
      return { ...prev, visibleAspects: next };
    });
  }, []);

  const setShowHouses = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showHouses: show }));
  }, []);

  const setShowDegreeMarkers = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showDegreeMarkers: show }));
  }, []);

  const setShowRetrogrades = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showRetrogrades: show }));
  }, []);

  const setShowDecans = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showDecans: show }));
  }, []);

  const setDegreeSymbolMode = useCallback((mode: 'sign' | 'degree') => {
    setState((prev) => ({ ...prev, degreeSymbolMode: mode }));
  }, []);

  const setStraightAspects = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, straightAspects: show }));
  }, []);

  const setAspectLineStyle = useCallback((style: import('./types').AspectLineStyle) => {
    setState((prev) => ({ ...prev, aspectLineStyle: style }));
  }, []);

  const setShowEffects = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showEffects: show }));
  }, []);

  const handlePlanetHover = useCallback(
    (planet: { planet: string; chart: 'A' | 'B' | 'Transit' | 'Composite' } | null, event?: React.MouseEvent) => {
      // Use cursor position for tooltip placement (much closer to what the user is looking at)
      let pos: { x: number; y: number } | null = null;
      if (event) {
        pos = { x: event.clientX, y: event.clientY };
      }
      setState((prev) => ({
        ...prev,
        hoveredPlanet: planet,
        // Preserve tooltipPosition if we have a pinned selection
        tooltipPosition: pos
          ?? (prev.selectedPlanet || prev.selectedAspect || prev.selectedSign
            ? prev.tooltipPosition
            : null),
      }));
    },
    []
  );

  const handleAspectClick = useCallback(
    (aspect: SynastryAspect, event?: React.MouseEvent) => {
      setState((prev) => ({
        ...prev,
        selectedAspect: prev.selectedAspect === aspect ? null : aspect,
        tooltipPosition: event ? { x: event.clientX, y: event.clientY } : aspectTooltipPos,
      }));
      onAspectClick?.(aspect);
    },
    [onAspectClick, aspectTooltipPos]
  );

  const handleAspectHover = useCallback(
    (aspect: SynastryAspect | null, event?: React.MouseEvent) => {
      setHoveredAspect(aspect);
      if (aspect && event) {
        setAspectTooltipPos({ x: event.clientX, y: event.clientY });
      } else {
        setAspectTooltipPos(null);
      }
    },
    []
  );

  const handleSignHover = useCallback(
    (sign: SignData | null, event?: React.MouseEvent) => {
      setHoveredSign(sign);
      if (sign && event) {
        setSignTooltipPos({ x: event.clientX, y: event.clientY });
      } else {
        setSignTooltipPos(null);
      }
    },
    []
  );

  const handleHouseHover = useCallback(
    (data: HouseHoverData | null, event?: React.MouseEvent) => {
      setHoveredHouse(data);
      if (data && event) {
        setHouseTooltipPos({ x: event.clientX, y: event.clientY });
      } else {
        setHouseTooltipPos(null);
      }
    },
    []
  );

  const handlePlanetClick = useCallback(
    (planet: string, chart: 'A' | 'B' | 'Transit' | 'Composite', event?: React.MouseEvent) => {
      // Single click: toggle selection AND open pinned tooltip
      let pos: { x: number; y: number } | undefined;
      if (event) {
        pos = { x: event.clientX, y: event.clientY };
      }
      setState((prev) => {
        const isSame = prev.selectedPlanet?.planet === planet && prev.selectedPlanet?.chart === chart;
        if (isSame) {
          // Clicking same planet again: deselect and close tooltip
          return {
            ...prev,
            selectedPlanet: null,
            hoveredPlanet: null,
            selectedAspect: null,
            selectedSign: null,
            pinnedTooltipOpen: false,
            expandedPlanetOpen: false,
          };
        }
        // Clicking a planet: select, highlight, AND open tooltip
        return {
          ...prev,
          selectedPlanet: { planet, chart },
          hoveredPlanet: null,
          selectedAspect: null,
          selectedSign: null,
          tooltipPosition: pos ?? prev.tooltipPosition,
          pinnedTooltipOpen: true,
        };
      });
      onPlanetClick?.(planet, chart);
    },
    [onPlanetClick]
  );

  const handlePlanetDoubleClick = useCallback(
    (planet: string, chart: 'A' | 'B' | 'Transit' | 'Composite', event?: React.MouseEvent) => {
      // Double click: same as single click (kept for backward compat)
      handlePlanetClick(planet, chart, event);
    },
    [handlePlanetClick]
  );

  const handleSignClick = useCallback(
    (sign: SignData, event?: React.MouseEvent) => {
      // Clear hover state to prevent flicker
      setHoveredSign(null);
      setSignTooltipPos(null);
      setState((prev) => ({
        ...prev,
        selectedSign: prev.selectedSign?.name === sign.name ? null : sign,
        selectedAspect: null, // Clear other selections
        selectedPlanet: null,
        pinnedTooltipOpen: false,
        expandedPlanetOpen: false,
        tooltipPosition: event ? { x: event.clientX, y: event.clientY } : prev.tooltipPosition,
      }));
    },
    []
  );

  const enablePlanetGroup = useCallback((group: 'core' | 'outer' | 'asteroids') => {
    setState((prev) => {
      const next = new Set(prev.visiblePlanets);
      for (const planet of PLANET_GROUPS[group]) {
        next.add(planet);
      }
      return { ...prev, visiblePlanets: next };
    });
  }, []);

  const disablePlanetGroup = useCallback((group: 'core' | 'outer' | 'asteroids') => {
    setState((prev) => {
      const next = new Set(prev.visiblePlanets);
      for (const planet of PLANET_GROUPS[group]) {
        next.delete(planet);
      }
      return { ...prev, visiblePlanets: next };
    });
  }, []);

  const enableMinorAspects = useCallback(() => {
    setState((prev) => {
      const next = new Set(prev.visibleAspects);
      for (const [key, def] of Object.entries(ASPECTS)) {
        if (!def.major) {
          next.add(key as AspectType);
        }
      }
      return { ...prev, visibleAspects: next };
    });
  }, []);

  const disableMinorAspects = useCallback(() => {
    setState((prev) => {
      const next = new Set(prev.visibleAspects);
      for (const [key, def] of Object.entries(ASPECTS)) {
        if (!def.major) {
          next.delete(key as AspectType);
        }
      }
      return { ...prev, visibleAspects: next };
    });
  }, []);

  // Notify parent of chart state changes (for session broadcast)
  // Note: no "isFirstStateChange" guard — on mobile, chartKey remount re-mounts this component
  // and we NEED the first effect run to broadcast so the guest receives the new state.
  const onInternalStateChangeRef = useRef(onInternalStateChange);
  useEffect(() => { onInternalStateChangeRef.current = onInternalStateChange; }, [onInternalStateChange]);
  useEffect(() => {
    if (!onInternalStateChangeRef.current) return;
    onInternalStateChangeRef.current({
      chartMode: state.chartMode,
      visiblePlanets: Array.from(state.visiblePlanets),
      visibleAspects: Array.from(state.visibleAspects),
      showHouses: state.showHouses,
      showDegreeMarkers: state.showDegreeMarkers,
      showTransits: state.showTransits,
      transitDate: state.transitDate,
      transitTime: state.transitTime,
      showProgressed: state.showProgressed,
      progressedPerson,
      progressedDate: state.progressedDate,
      showSolarArc: state.showSolarArc,
      showRelocated: state.showRelocated,
      relocatedPerson,
      relocatedLocationA: state.relocatedLocationA,
      relocatedLocationB: state.relocatedLocationB,
      enabledAsteroidGroups: Array.from(state.enabledAsteroidGroups),
      enabledFixedStarGroups: Array.from(state.enabledFixedStarGroups),
      chartTheme,
      rotateToAscendant,
      zodiacVantage,
      straightAspects: state.straightAspects,
      showEffects: state.showEffects,
      showRetrogrades: state.showRetrogrades,
      showDecans: state.showDecans,
      showBirthTimeShift: state.showBirthTimeShift,
      timeShiftA: state.timeShiftA,
      timeShiftB: state.timeShiftB,
      // Solar/Lunar return state
      showSolarReturn: state.showSolarReturn,
      solarReturnYear: state.solarReturnYear,
      showLunarReturn: state.showLunarReturn,
      lunarReturnStartDate: state.lunarReturnStartDate,
      degreeSymbolMode: state.degreeSymbolMode,
    });
  }, [state.chartMode, state.visiblePlanets, state.visibleAspects, state.showHouses, state.showDegreeMarkers, state.showTransits, state.transitDate, state.transitTime, state.showProgressed, progressedPerson, state.progressedDate, state.showSolarArc, state.showRelocated, relocatedPerson, state.relocatedLocationA, state.relocatedLocationB, state.enabledAsteroidGroups, state.enabledFixedStarGroups, chartTheme, rotateToAscendant, zodiacVantage, state.straightAspects, state.showEffects, state.showRetrogrades, state.showDecans, state.showBirthTimeShift, state.timeShiftA, state.timeShiftB, state.showSolarReturn, state.solarReturnYear, state.showLunarReturn, state.lunarReturnStartDate, state.degreeSymbolMode]);

  // Get hovered planet data for tooltip
  const hoveredPlanetData = React.useMemo(() => {
    if (!state.hoveredPlanet) return null;
    // Use displayChart (which includes merged asteroid data + swap) instead of raw chartA/chartB
    if (state.hoveredPlanet.chart === 'A') return displayChartA.planets[state.hoveredPlanet.planet];
    if (state.hoveredPlanet.chart === 'B') return displayChartB.planets[state.hoveredPlanet.planet];
    // For Transit chart, build data from transitData
    if (state.hoveredPlanet.chart === 'Transit' && state.transitData?.transit_planets) {
      const tp = state.transitData.transit_planets.find(
        (p) => p.planet.toLowerCase() === state.hoveredPlanet!.planet.toLowerCase()
      );
      if (tp) {
        return {
          longitude: tp.longitude,
          sign: tp.sign,
          retrograde: tp.retrograde,
        };
      }
    }
    return null;
  }, [state.hoveredPlanet, displayChartA.planets, displayChartB.planets, state.transitData]);

  // Get selected planet data for pinned tooltip
  const selectedPlanetData = React.useMemo(() => {
    if (!state.selectedPlanet) return null;
    // Use displayChart (which includes merged asteroid data + swap) instead of raw chartA/chartB
    if (state.selectedPlanet.chart === 'A') return displayChartA.planets[state.selectedPlanet.planet];
    if (state.selectedPlanet.chart === 'B') return displayChartB.planets[state.selectedPlanet.planet];
    // For Transit chart, build data from transitData
    if (state.selectedPlanet.chart === 'Transit' && state.transitData?.transit_planets) {
      const tp = state.transitData.transit_planets.find(
        (p) => p.planet.toLowerCase() === state.selectedPlanet!.planet.toLowerCase()
      );
      if (tp) {
        return {
          longitude: tp.longitude,
          sign: tp.sign,
          retrograde: tp.retrograde,
        };
      }
    }
    return null;
  }, [state.selectedPlanet, displayChartA.planets, displayChartB.planets, state.transitData]);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        width: '100%',
        overflow: 'hidden',
      }}
      onClick={() => setState((prev) => ({
        ...prev,
        selectedPlanet: null,
        selectedAspect: null,
        selectedSign: null,
        pinnedTooltipOpen: false,
        expandedPlanetOpen: false,
      }))}
    >
      {/* SVG Chart - wrapper keeps square aspect ratio, SVG scales via viewBox */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>

      {/* Birth time shift knobs — above chart */}
      {enableBirthTimeShift && state.showBirthTimeShift && state.chartMode !== 'composite' && (
        <div style={{
          display: 'flex',
          justifyContent: birthTimeB && (state.chartMode === 'synastry' || state.chartMode === 'personB')
            ? 'space-between' : 'center',
          alignItems: 'flex-start',
          padding: '0 48px 8px',
        }}>
          <BirthTimeShiftKnob
            label="A"
            timeShiftMinutes={state.timeShiftA}
            onTimeShiftChange={setTimeShiftA}
            onReset={resetTimeShiftA}
            loading={state.birthTimeShiftLoading && state.timeShiftA !== 0}
            size={88}
          />
          {birthTimeB && (state.chartMode === 'synastry' || state.chartMode === 'personB') && (
            <BirthTimeShiftKnob
              label="B"
              timeShiftMinutes={state.timeShiftB}
              onTimeShiftChange={setTimeShiftB}
              onReset={resetTimeShiftB}
              loading={state.birthTimeShiftLoading && state.timeShiftB !== 0}
              size={88}
            />
          )}
        </div>
      )}

      <svg
        ref={svgRef}
        width="100%"
        viewBox={zoomViewBox ? `${zoomViewBox.x} ${zoomViewBox.y} ${zoomViewBox.w} ${zoomViewBox.h}` : `0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: 'block',
          background: COLORS.background,
          borderRadius: 12,
          border: `1px solid ${COLORS.gridLineFaint}`,
          cursor: canPan ? (isDragging ? 'grabbing' : 'grab') : zoomMode ? 'crosshair' : 'default',
        }}
        onMouseDown={canPan ? handlePanMouseDown : undefined}
        onMouseMove={canPan ? handlePanMouseMove : undefined}
        onMouseUp={canPan ? handlePanMouseUp : undefined}
        onClick={(e) => {
          // Don't fire click after a pan drag
          if (canPan) {
            e.stopPropagation();
            return;
          }
          if (zoomMode) {
            const svgEl = e.currentTarget;
            const rect = svgEl.getBoundingClientRect();
            // Convert client coords to SVG coords relative to current viewBox
            const currentVB = zoomViewBox || { x: 0, y: 0, w: VIEWBOX_SIZE, h: VIEWBOX_SIZE };
            const svgX = currentVB.x + ((e.clientX - rect.left) / rect.width) * currentVB.w;
            const svgY = currentVB.y + ((e.clientY - rect.top) / rect.height) * currentVB.h;
            // 2x zoom = half-size window (700x700)
            const zoomW = VIEWBOX_SIZE / 2;
            const zoomH = VIEWBOX_SIZE / 2;
            // Center on click point, clamped to viewBox bounds
            const x = Math.max(0, Math.min(VIEWBOX_SIZE - zoomW, svgX - zoomW / 2));
            const y = Math.max(0, Math.min(VIEWBOX_SIZE - zoomH, svgY - zoomH / 2));
            setZoomViewBox({ x, y, w: zoomW, h: zoomH });
            setZoomMode(false);
            setPanMode(true);
            e.stopPropagation();
            return;
          }
          // Stop propagation to prevent container from clearing selection
          e.stopPropagation();
        }}
        onMouseLeave={() => {
          // End any active pan on mouse leave
          setIsDragging(false);
          panStart.current = null;
          // Clear all hover states when mouse leaves the chart
          setHoveredAspect(null);
          setAspectTooltipPos(null);
          setHoveredSign(null);
          setSignTooltipPos(null);
          setHoveredHouse(null);
          setHouseTooltipPos(null);
          setState((prev) => ({
            ...prev,
            hoveredPlanet: null,
            tooltipPosition: prev.selectedPlanet || prev.selectedAspect || prev.selectedSign
              ? prev.tooltipPosition
              : null,
          }));
        }}
      >
        {/* Background */}
        <rect
          x={0}
          y={0}
          width={VIEWBOX_SIZE}
          height={VIEWBOX_SIZE}
          fill={COLORS.background}
          rx={12}
        />

        {/* Chart content - positioned using rotationOffset passed to components */}

        {/* House overlay (background layer) */}
        <HouseOverlay
          dimensions={dimensions}
          chart={houseOverlayChartA}
          chartB={houseOverlayChartB}
          nameA={state.chartMode === 'composite' ? 'Composite' : state.chartMode === 'davison' ? 'Davison' : state.chartMode === 'personB' ? displayNameB : displayNameA}
          nameB={state.chartMode === 'composite' ? 'Composite' : state.chartMode === 'davison' ? 'Davison' : state.chartMode === 'personA' ? displayNameA : displayNameB}
          showHouses={state.showHouses}
          showDegreeMarkers={state.showDegreeMarkers}
          onHouseHover={handleHouseHover}
          rotationOffset={rotationOffset}
          zodiacVantage={zodiacVantage}
          hideOuterHouseRing={isSingleWheel}
          visiblePlanets={state.visiblePlanets}
          smoothTransitions={state.showBirthTimeShift && (state.timeShiftA !== 0 || state.timeShiftB !== 0)}
          houseSystem={houseSystem}
          birthLatA={birthLatA}
          birthLatB={birthLatB}
        />

        {/* Aspect lines (drawn on top of house ring) */}
        <AspectGrid
          dimensions={dimensions}
          aspects={aspects}
          visibleAspects={state.visibleAspects}
          mode={state.chartMode}
          hoveredPlanet={state.hoveredPlanet}
          selectedPlanet={state.selectedPlanet}
          hoveredAspect={hoveredAspect}
          selectedAspect={state.selectedAspect}
          onAspectClick={handleAspectClick}
          onAspectHover={handleAspectHover}
          displayPositionsA={displayPositionsA}
          displayPositionsB={displayPositionsB}
          displayPositions={displayPositions}
          rotationOffset={rotationOffset}
          declinationsA={declinationsA}
          declinationsB={declinationsB}
          straightLines={state.straightAspects}
          lineStyle={state.aspectLineStyle}
          showEffects={state.showEffects}
          smoothTransitions={state.showBirthTimeShift && (state.timeShiftA !== 0 || state.timeShiftB !== 0)}
        />

        {/* Zodiac ring */}
        <ZodiacRing
          dimensions={dimensions}
          mode={state.chartMode}
          onSignHover={handleSignHover}
          onSignClick={handleSignClick}
          rotationOffset={rotationOffset}
          showDegreeMarkers={state.showDegreeMarkers}
        />

        {/* Decan ring (between zodiac and outer house ring) */}
        {state.showDecans && (
          <DecanRing
            dimensions={dimensions}
            rotationOffset={rotationOffset}
          />
        )}

        {/* Planet rings */}
        <PlanetRing
          dimensions={dimensions}
          chartA={displayChartA}
          chartB={state.chartMode === 'synastry' || state.chartMode === 'personB' ? displayChartB : undefined}
          mode={state.chartMode}
          compositeData={state.compositeData || undefined}
          davisonData={state.davisonData || undefined}
          visiblePlanets={state.visiblePlanets}
          showRetrogrades={state.showRetrogrades}
          showDecans={state.showDecans}
          degreeSymbolMode={state.degreeSymbolMode}
          hoveredPlanet={state.hoveredPlanet}
          selectedPlanet={state.selectedPlanet}
          selectedAspect={state.selectedAspect}
          aspects={aspects}
          onPlanetHover={handlePlanetHover}
          onPlanetClick={handlePlanetClick}
          onPlanetDoubleClick={handlePlanetDoubleClick}
          rotationOffset={rotationOffset}
          smoothTransitions={state.showBirthTimeShift && (state.timeShiftA !== 0 || state.timeShiftB !== 0)}
        />

        {/* Outer ring: transits, solar return, or lunar return (mutually exclusive) */}
        {outerRingPlanets && (
          <TransitRing
            dimensions={dimensions}
            transitPlanets={outerRingPlanets}
            visiblePlanets={state.visiblePlanets}
            showRetrogrades={state.showRetrogrades}
            hoveredPlanet={state.hoveredPlanet}
            onPlanetHover={handlePlanetHover}
            onPlanetClick={handlePlanetClick}
            onPlanetDoubleClick={handlePlanetDoubleClick}
            rotationOffset={rotationOffset}
          />
        )}

        {/* Progressed planets are now integrated into effectiveChart (no separate outer ring) */}

        {/* Outer ring loading indicator — only shows if loading takes >500ms */}
        {(state.showTransits && transitLoadingSlow || state.showSolarReturn && state.solarReturnLoading || state.showLunarReturn && state.lunarReturnLoading) && (
          <g>
            <rect
              x={dimensions.cx - 80}
              y={dimensions.cy - 20}
              width={160}
              height={40}
              rx={8}
              fill={COLORS.background}
              stroke={state.showSolarReturn ? '#DAA520' : state.showLunarReturn ? '#8B8BCD' : '#228B22'}
              strokeWidth={1.5}
              fillOpacity={0.95}
            />
            <text
              x={dimensions.cx}
              y={dimensions.cy}
              fill={state.showSolarReturn ? '#DAA520' : state.showLunarReturn ? '#8B8BCD' : '#228B22'}
              fontSize={12}
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {state.showSolarReturn ? 'Loading Solar Return...' : state.showLunarReturn ? 'Loading Lunar Return...' : 'Loading Transits...'}
            </text>
          </g>
        )}

        {/* Composite loading indicator */}
        {state.chartMode === 'composite' && state.compositeLoading && (
          <g>
            <rect
              x={dimensions.cx - 90}
              y={dimensions.cy - 20}
              width={180}
              height={40}
              rx={8}
              fill={COLORS.background}
              stroke={COLORS.composite}
              strokeWidth={1.5}
              fillOpacity={0.95}
            />
            <text
              x={dimensions.cx}
              y={dimensions.cy}
              fill={COLORS.composite}
              fontSize={12}
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              ⏳ Loading Composite...
            </text>
          </g>
        )}

        {/* Davison loading indicator */}
        {state.chartMode === 'davison' && state.davisonLoading && (
          <g>
            <rect
              x={dimensions.cx - 90}
              y={dimensions.cy - 20}
              width={180}
              height={40}
              rx={8}
              fill={COLORS.background}
              stroke="#9333ea"
              strokeWidth={1.5}
              fillOpacity={0.95}
            />
            <text
              x={dimensions.cx}
              y={dimensions.cy}
              fill="#9333ea"
              fontSize={12}
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              Loading Davison...
            </text>
          </g>
        )}

        {/* Progressed loading indicator */}
        {state.showProgressed && state.progressedLoading && (
          <g>
            <rect
              x={dimensions.cx - 90}
              y={dimensions.cy + 30}
              width={180}
              height={40}
              rx={8}
              fill={COLORS.background}
              stroke="#FFD700"
              strokeWidth={1.5}
              fillOpacity={0.95}
            />
            <text
              x={dimensions.cx}
              y={dimensions.cy + 50}
              fill="#B8860B"
              fontSize={12}
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              ⏳ Loading Progressed...
            </text>
          </g>
        )}

        {/* Relocated loading indicator */}
        {state.showRelocated && state.relocatedLoading && (
          <g>
            <rect
              x={dimensions.cx - 90}
              y={dimensions.cy + 80}
              width={180}
              height={40}
              rx={8}
              fill={COLORS.background}
              stroke="#FF6B6B"
              strokeWidth={1.5}
              fillOpacity={0.95}
            />
            <text
              x={dimensions.cx}
              y={dimensions.cy + 100}
              fill="#D63031"
              fontSize={12}
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              ⏳ Loading Relocated...
            </text>
          </g>
        )}

        {/* Progressed active indicator */}
        {state.showProgressed && state.progressedData && !state.progressedLoading && (
          <g>
            <rect
              x={dimensions.cx - 100}
              y={dimensions.cy + 80}
              width={200}
              height={50}
              rx={8}
              fill={COLORS.background}
              stroke="#FFD700"
              strokeWidth={1.5}
              fillOpacity={0.95}
            />
            <text
              x={dimensions.cx}
              y={dimensions.cy + 95}
              fill="#B8860B"
              fontSize={11}
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              Progressed to:
            </text>
            <text
              x={dimensions.cx}
              y={dimensions.cy + 115}
              fill={COLORS.textMuted}
              fontSize={10}
              fontFamily="Arial, sans-serif"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {state.progressedDate}
            </text>
          </g>
        )}

        {/* Relocated active indicator */}
        {state.showRelocated && state.relocatedData && !state.relocatedLoading && (() => {
          const locNameA = state.relocatedLocationA?.name;
          const locNameB = state.relocatedLocationB?.name;
          const locName = relocatedPerson === 'both' && locNameA && locNameB
            ? `A: ${locNameA} / B: ${locNameB}`
            : (relocatedPerson === 'B' ? locNameB : locNameA) || 'New Location';
          const truncated = locName.length > 30 ? locName.slice(0, 28) + '…' : locName;
          const boxW = Math.max(200, Math.min(280, truncated.length * 7 + 40));
          return (
            <g>
              <rect
                x={dimensions.cx - boxW / 2}
                y={dimensions.cy + 80}
                width={boxW}
                height={50}
                rx={8}
                fill={COLORS.background}
                stroke="#FF6B6B"
                strokeWidth={1.5}
                fillOpacity={0.95}
              />
              <text
                x={dimensions.cx}
                y={dimensions.cy + 95}
                fill="#D63031"
                fontSize={11}
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
              >
                📍 Relocated to:
              </text>
              <text
                x={dimensions.cx}
                y={dimensions.cy + 115}
                fill={COLORS.textMuted}
                fontSize={10}
                fontFamily="Arial, sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {truncated}
              </text>
            </g>
          );
        })()}

        {/* Legend (fixed position, not rotated) */}
        {(() => {
          // Calculate legend height dynamically
          const baseItems = state.chartMode === 'synastry' ? 2 : 1;
          const transitItem = outerRingPlanets ? 1 : 0;
          const progressedItem = state.showProgressed && state.progressedData ? 1 : 0;
          const totalItems = baseItems + transitItem + progressedItem;
          const legendHeight = totalItems * 18 + 14;
          return (
            <g transform={`translate(${VIEWBOX_SIZE - 90}, ${VIEWBOX_SIZE - legendHeight})`}>
              {state.chartMode === 'synastry' ? (
                <>
                  <circle cx={10} cy={10} r={6} fill={COLORS.personA} />
                  <text x={22} y={14} fill={COLORS.textSecondary} fontSize={10}>
                    {displayNameA}
                  </text>
                  <circle cx={10} cy={28} r={6} fill={COLORS.personB} />
                  <text x={22} y={32} fill={COLORS.textSecondary} fontSize={10}>
                    {displayNameB}
                  </text>
                </>
              ) : state.chartMode === 'personA' ? (
                <>
                  <circle cx={10} cy={10} r={6} fill={COLORS.personA} />
                  <text x={22} y={14} fill={COLORS.textSecondary} fontSize={10}>
                    {displayNameA}
                  </text>
                </>
              ) : state.chartMode === 'personB' ? (
                <>
                  <circle cx={10} cy={10} r={6} fill={COLORS.personB} />
                  <text x={22} y={14} fill={COLORS.textSecondary} fontSize={10}>
                    {displayNameB}
                  </text>
                </>
              ) : state.chartMode === 'composite' && state.compositeData ? (
                <>
                  <circle cx={10} cy={10} r={6} fill={COLORS.composite} />
                  <text x={22} y={14} fill={COLORS.textSecondary} fontSize={10}>
                    {displayNameA} + {displayNameB}
                  </text>
                </>
              ) : state.chartMode === 'davison' && state.davisonData ? (
                <>
                  <circle cx={10} cy={10} r={6} fill="#9333ea" />
                  <text x={22} y={14} fill={COLORS.textSecondary} fontSize={10}>
                    Davison
                  </text>
                </>
              ) : null}
              {outerRingPlanets && (
                <>
                  <circle cx={10} cy={state.chartMode === 'synastry' ? 46 : 28} r={6} fill={state.showSolarReturn ? '#DAA520' : state.showLunarReturn ? '#8B8BCD' : '#228B22'} />
                  <text x={22} y={state.chartMode === 'synastry' ? 50 : 32} fill={COLORS.textSecondary} fontSize={10}>
                    {state.showSolarReturn ? `${state.solarReturnYear} Solar Return` : state.showLunarReturn ? 'Lunar Return' : 'Transits'}
                  </text>
                </>
              )}
              {state.showProgressed && state.progressedData && (
                <>
                  <circle
                    cx={10}
                    cy={(state.chartMode === 'synastry' ? 46 : 28) + (transitItem * 18)}
                    r={6}
                    fill="#FFD700"
                  />
                  <text
                    x={22}
                    y={(state.chartMode === 'synastry' ? 50 : 32) + (transitItem * 18)}
                    fill={COLORS.textSecondary}
                    fontSize={10}
                  >
                    Progressed ({state.progressedDate})
                  </text>
                </>
              )}
            </g>
          );
        })()}

        {/* Software signature — top-left corner */}
        <text x={22} y={36} fill={COLORS.textSecondary} fontSize={30} fontWeight={200} fontFamily="'Inter', system-ui, sans-serif" letterSpacing="0.12em" opacity={0.7} style={{ textTransform: 'uppercase' as const }}>
          ASTROLOGER
        </text>
        <text x={22} y={56} fill={COLORS.textSecondary} fontSize={20} fontWeight={300} fontFamily="'Inter', system-ui, sans-serif" letterSpacing="0.08em" opacity={0.5}>
          astrologerapp.org
        </text>
      </svg>

      {/* Zoom controls overlay */}
      {!hideZoomControls && <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, zIndex: 10 }}>
        <button
          onClick={(e) => { e.stopPropagation(); setZoomMode(!zoomMode); setPanMode(false); }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: zoomMode ? '2px solid #6C63FF' : `1px solid ${COLORS.gridLineFaint}`,
            background: zoomMode ? '#EDE9FF' : COLORS.background,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
          title={zoomMode ? 'Cancel zoom' : 'Zoom into chart area'}
        >
          🔍
        </button>
        {zoomViewBox && (
          <button
            onClick={(e) => { e.stopPropagation(); setPanMode(!panMode); setZoomMode(false); }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: panMode ? '2px solid #6C63FF' : `1px solid ${COLORS.gridLineFaint}`,
              background: panMode ? '#EDE9FF' : COLORS.background,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
            title={panMode ? 'Exit pan mode' : 'Pan (drag to move view, or hold Space)'}
          >
            ✋
          </button>
        )}
        {zoomViewBox && (
          <button
            onClick={(e) => { e.stopPropagation(); setZoomViewBox(null); setZoomMode(false); setPanMode(false); }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${COLORS.gridLineFaint}`,
              background: COLORS.background,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 'bold',
              color: COLORS.textMuted,
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
            title="Reset zoom"
          >
            ✕
          </button>
        )}
      </div>}

      {/* Swap A/B button overlay */}
      {state.chartMode === 'synastry' && (() => {
        const isMobileSwap = typeof window !== 'undefined' && window.innerWidth < 500;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setSwapped(s => !s); }}
            style={{
              position: 'absolute',
              bottom: isMobileSwap ? 6 : 12,
              left: isMobileSwap ? 6 : 12,
              height: isMobileSwap ? 24 : 32,
              paddingLeft: isMobileSwap ? 6 : 10,
              paddingRight: isMobileSwap ? 6 : 10,
              borderRadius: isMobileSwap ? 6 : 8,
              border: swapped ? '2px solid #6C63FF' : `1px solid ${COLORS.gridLineFaint}`,
              background: swapped ? '#EDE9FF' : COLORS.background,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: isMobileSwap ? 3 : 6,
              fontSize: isMobileSwap ? 9 : 12,
              fontWeight: 600,
              color: COLORS.textSecondary,
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              zIndex: 10,
            }}
            title="Swap Person A and Person B (outer/inner rings)"
          >
            <span style={{ fontSize: isMobileSwap ? 12 : 16 }}>&#x21C4;</span>
            <span>Swap A/B</span>
          </button>
        );
      })()}

      {/* Location Picker Modal (paid feature) — lazy-loaded with Leaflet */}
      {state.showLocationPicker && (
        <React.Suspense fallback={null}>
          <LocationPicker
            isOpen={state.showLocationPicker}
            onClose={() => setShowLocationPicker(false)}
            onConfirm={handleLocationConfirm}
            originalLocation={state.locationPickerTarget === 'B' ? locationB : originalLocation}
            currentLocation={(state.locationPickerTarget === 'B' ? state.relocatedLocationB : state.relocatedLocationA) || undefined}
            birthDate={state.locationPickerTarget === 'B' ? birthDateB : birthDateA}
            birthTime={state.locationPickerTarget === 'B' ? birthTimeB : birthTimeA}
            showAstroLines={true}
          />
        </React.Suspense>
      )}

      {/* Auth/Upgrade modals for gated features */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* Tooltips — portaled to body to avoid transform offset from pan/zoom container */}
      {createPortal(
      <React.Suspense fallback={null}>
      {/* Planet Tooltip (on hover) — disabled on mobile */}
      {state.hoveredPlanet && hoveredPlanetData && state.tooltipPosition && !state.selectedPlanet && window.innerWidth >= 500 && (
        <PlanetTooltip
          planet={state.hoveredPlanet.planet}
          chart={state.hoveredPlanet.chart}
          name={state.hoveredPlanet.chart === 'Transit' ? 'Transit' : state.hoveredPlanet.chart === 'A' ? displayNameA : displayNameB}
          partnerName={isSingleWheel || state.hoveredPlanet.chart === 'Transit' ? undefined : state.hoveredPlanet.chart === 'A' ? displayNameB : displayNameA}
          data={hoveredPlanetData}
          ownHouse={state.hoveredPlanet.chart === 'Transit' ? undefined :
            hoveredPlanetData.longitude !== undefined ?
              calculateHouseFromLongitude(
                hoveredPlanetData.longitude,
                state.hoveredPlanet.chart === 'A' ? (displayChartA.angles?.ascendant ?? 0) : (displayChartB.angles?.ascendant ?? 0),
                houseSystem === 'whole_sign'
              ) : undefined}
          partnerHouse={isSingleWheel || state.hoveredPlanet.chart === 'Transit' ? undefined :
            hoveredPlanetData.longitude !== undefined ?
              calculateHouseFromLongitude(
                hoveredPlanetData.longitude,
                state.hoveredPlanet.chart === 'A' ? (displayChartB.angles?.ascendant ?? 0) : (displayChartA.angles?.ascendant ?? 0),
                houseSystem === 'whole_sign'
              ) : undefined}
          aspects={state.hoveredPlanet.chart === 'Transit' ? [] : aspects}
          visibleAspects={state.visibleAspects}
          position={state.tooltipPosition}
          visible={true}
          partnerChart={isSingleWheel || state.hoveredPlanet.chart === 'Transit' ? undefined : state.hoveredPlanet.chart === 'A' ? displayChartB : displayChartA}
          transitDate={state.hoveredPlanet.chart === 'Transit' ? state.transitDate : undefined}
          transitAspects={state.hoveredPlanet.chart === 'Transit' ? transitAspects : undefined}
          nameA={displayNameA}
          nameB={displayNameB}
        />
      )}

      {/* Planet Tooltip (on double-click - with close button) */}
      {state.selectedPlanet && selectedPlanetData && state.tooltipPosition && state.pinnedTooltipOpen && (
        <PlanetTooltip
          planet={state.selectedPlanet.planet}
          chart={state.selectedPlanet.chart}
          name={state.selectedPlanet.chart === 'Transit' ? 'Transit' : state.selectedPlanet.chart === 'A' ? displayNameA : displayNameB}
          partnerName={isSingleWheel || state.selectedPlanet.chart === 'Transit' ? undefined : state.selectedPlanet.chart === 'A' ? displayNameB : displayNameA}
          data={selectedPlanetData}
          ownHouse={state.selectedPlanet.chart === 'Transit' ? undefined :
            selectedPlanetData.longitude !== undefined ?
              calculateHouseFromLongitude(
                selectedPlanetData.longitude,
                state.selectedPlanet.chart === 'A' ? (displayChartA.angles?.ascendant ?? 0) : (displayChartB.angles?.ascendant ?? 0),
                houseSystem === 'whole_sign'
              ) : undefined}
          partnerHouse={isSingleWheel || state.selectedPlanet.chart === 'Transit' ? undefined :
            selectedPlanetData.longitude !== undefined ?
              calculateHouseFromLongitude(
                selectedPlanetData.longitude,
                state.selectedPlanet.chart === 'A' ? (displayChartB.angles?.ascendant ?? 0) : (displayChartA.angles?.ascendant ?? 0),
                houseSystem === 'whole_sign'
              ) : undefined}
          aspects={state.selectedPlanet.chart === 'Transit' ? [] : aspects}
          visibleAspects={state.visibleAspects}
          position={state.tooltipPosition}
          visible={true}
          onClose={() => setState((prev) => ({ ...prev, selectedPlanet: null, pinnedTooltipOpen: false, expandedPlanetOpen: false }))}
          onExpand={() => setState((prev) => ({ ...prev, expandedPlanetOpen: true }))}
          partnerChart={isSingleWheel || state.selectedPlanet.chart === 'Transit' ? undefined : state.selectedPlanet.chart === 'A' ? displayChartB : displayChartA}
          transitDate={state.selectedPlanet.chart === 'Transit' ? state.transitDate : undefined}
          transitAspects={state.selectedPlanet.chart === 'Transit' ? transitAspects : undefined}
          nameA={displayNameA}
          nameB={displayNameB}
        />
      )}

      {/* Planet Detail Dialog (expanded view) */}
      {state.expandedPlanetOpen && state.selectedPlanet && selectedPlanetData && (
        <PlanetDetailDialog
          planet={state.selectedPlanet.planet}
          chart={state.selectedPlanet.chart}
          name={state.selectedPlanet.chart === 'Transit' ? 'Transit' : state.selectedPlanet.chart === 'A' ? displayNameA : displayNameB}
          partnerName={isSingleWheel || state.selectedPlanet.chart === 'Transit' ? undefined : state.selectedPlanet.chart === 'A' ? displayNameB : displayNameA}
          data={selectedPlanetData}
          ownHouse={state.selectedPlanet.chart === 'Transit' ? undefined :
            selectedPlanetData.longitude !== undefined ?
              calculateHouseFromLongitude(
                selectedPlanetData.longitude,
                state.selectedPlanet.chart === 'A' ? (displayChartA.angles?.ascendant ?? 0) : (displayChartB.angles?.ascendant ?? 0),
                houseSystem === 'whole_sign'
              ) : undefined}
          partnerHouse={isSingleWheel || state.selectedPlanet.chart === 'Transit' ? undefined :
            selectedPlanetData.longitude !== undefined ?
              calculateHouseFromLongitude(
                selectedPlanetData.longitude,
                state.selectedPlanet.chart === 'A' ? (displayChartB.angles?.ascendant ?? 0) : (displayChartA.angles?.ascendant ?? 0),
                houseSystem === 'whole_sign'
              ) : undefined}
          aspects={state.selectedPlanet.chart === 'Transit' ? [] : aspects}
          visibleAspects={state.visibleAspects}
          partnerChart={isSingleWheel || state.selectedPlanet.chart === 'Transit' ? undefined : state.selectedPlanet.chart === 'A' ? displayChartB : displayChartA}
          transitDate={state.selectedPlanet.chart === 'Transit' ? state.transitDate : undefined}
          transitAspects={state.selectedPlanet.chart === 'Transit' ? transitAspects : undefined}
          nameA={displayNameA}
          nameB={displayNameB}
          onClose={() => setState((prev) => ({ ...prev, expandedPlanetOpen: false, selectedPlanet: null, pinnedTooltipOpen: false }))}
        />
      )}

      {/* Sign Tooltip (on hover) — disabled on mobile */}
      {hoveredSign && signTooltipPos && !state.selectedSign && window.innerWidth >= 500 && (
        <SignTooltip
          sign={hoveredSign}
          position={signTooltipPos}
          visible={true}
        />
      )}

      {/* Sign Tooltip (on click - with close button) */}
      {state.selectedSign && state.tooltipPosition && (
        <SignTooltip
          sign={state.selectedSign}
          position={state.tooltipPosition}
          visible={true}
          onClose={() => setState((prev) => ({ ...prev, selectedSign: null }))}
        />
      )}

      {/* House Tooltip (on hover) — disabled on mobile */}
      {hoveredHouse && houseTooltipPos && window.innerWidth >= 500 && (
        <HouseTooltip
          house={hoveredHouse.house}
          cusp={hoveredHouse.cusp}
          chart={hoveredHouse.chart}
          name={hoveredHouse.name}
          position={houseTooltipPos}
          visible={true}
        />
      )}

      {/* Aspect Tooltip (on click - with close button) */}
      {state.selectedAspect && state.tooltipPosition && (
        <AspectTooltip
          aspect={state.selectedAspect}
          nameA={displayNameA}
          nameB={displayNameB}
          signA={displayChartA.planets[state.selectedAspect.planetA]?.sign}
          signB={displayChartB.planets[state.selectedAspect.planetB]?.sign}
          position={state.tooltipPosition}
          visible={true}
          onClose={() => setState((prev) => ({ ...prev, selectedAspect: null }))}
        />
      )}
      </React.Suspense>,
      document.body
      )}

      {/* Transit jog wheel — bottom-left overlay on chart (desktop only; mobile renders in BiWheelMobileWrapper) */}
      {showTogglePanel && state.showTransits && (
        <div style={{ position: 'absolute', bottom: 80, left: 16, zIndex: 999 }}>
          <TransitJogWheel
            transitDate={state.transitDate}
            onTransitDateChange={setTransitDate}
            transitTime={state.transitTime}
            onTransitTimeChange={setTransitTime}
            transitLoading={state.transitLoading}
            size={96}
          />
        </div>
      )}
      {/* Solar/Lunar return year/month nav — bottom-left overlay (desktop only) */}
      {showTogglePanel && (state.showSolarReturn || state.showLunarReturn) && (
        <div style={{
          position: 'absolute', bottom: 80, left: 16, zIndex: 999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: COLORS.background, borderRadius: 12, padding: '8px 12px',
          border: `1px solid ${COLORS.gridLineFaint}`, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, opacity: 0.7 }}>
            {state.showSolarReturn ? 'Solar Return' : 'Lunar Return'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => state.showSolarReturn
                ? setSolarReturnYear(state.solarReturnYear - 1)
                : setLunarReturnStartDate((() => { const d = new Date(state.lunarReturnStartDate + 'T12:00:00'); d.setDate(d.getDate() - 28); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })())
              }
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', padding: '0 4px' }}
            >
              ◀
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, minWidth: 60, textAlign: 'center' }}>
              {state.showSolarReturn
                ? state.solarReturnYear
                : state.lunarReturnData?.return_date
                  ? new Date(state.lunarReturnData.return_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '...'
              }
            </span>
            <button
              onClick={() => state.showSolarReturn
                ? setSolarReturnYear(state.solarReturnYear + 1)
                : setLunarReturnStartDate((() => { const d = new Date(state.lunarReturnStartDate + 'T12:00:00'); d.setDate(d.getDate() + 28); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })())
              }
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', padding: '0 4px' }}
            >
              ▶
            </button>
          </div>
          {(state.solarReturnLoading || state.lunarReturnLoading) && (
            <span style={{ fontSize: 10, color: state.showSolarReturn ? '#DAA520' : '#8B8BCD' }}>Loading...</span>
          )}
        </div>
      )}

      {/* Birth time shift knobs are now rendered above the chart SVG */}
      </div>


      {/* Toggle Panel - flex sibling next to SVG wrapper */}
      {showTogglePanel && (
        <React.Suspense fallback={null}>
          <TogglePanel
            visiblePlanets={state.visiblePlanets}
            visibleAspects={state.visibleAspects}
            showHouses={state.showHouses}
            showDegreeMarkers={state.showDegreeMarkers}
            showRetrogrades={state.showRetrogrades}
            showDecans={state.showDecans}
            degreeSymbolMode={state.degreeSymbolMode}
            onSetDegreeSymbolMode={setDegreeSymbolMode}
            onTogglePlanet={togglePlanet}
            onToggleAspect={toggleAspect}
            onSetShowHouses={setShowHouses}
            onSetShowDegreeMarkers={setShowDegreeMarkers}
            onSetShowRetrogrades={setShowRetrogrades}
            onSetShowDecans={setShowDecans}
            straightAspects={state.straightAspects}
            onSetStraightAspects={setStraightAspects}
            aspectLineStyle={state.aspectLineStyle}
            onSetAspectLineStyle={setAspectLineStyle}
            showEffects={state.showEffects}
            onSetShowEffects={setShowEffects}
            onEnablePlanetGroup={enablePlanetGroup}
            onDisablePlanetGroup={disablePlanetGroup}
            onEnableMinorAspects={enableMinorAspects}
            onDisableMinorAspects={disableMinorAspects}
            // Transit/Composite controls
            enableTransits={enableTransits}
            showTransits={state.showTransits}
            transitDate={state.transitDate}
            transitTime={state.transitTime}
            transitLoading={transitLoadingSlow}
            onSetShowTransits={setShowTransits}
            onSetTransitDate={setTransitDate}
            onSetTransitTime={setTransitTime}
            // Solar/Lunar return controls
            enableSolarReturn={!!onFetchSolarReturn}
            showSolarReturn={state.showSolarReturn}
            solarReturnYear={state.solarReturnYear}
            solarReturnLoading={state.solarReturnLoading}
            solarReturnData={state.solarReturnData}
            onSetShowSolarReturn={setShowSolarReturn}
            onSetSolarReturnYear={setSolarReturnYear}
            enableLunarReturn={!!onFetchLunarReturn}
            showLunarReturn={state.showLunarReturn}
            lunarReturnLoading={state.lunarReturnLoading}
            lunarReturnData={state.lunarReturnData}
            onSetShowLunarReturn={setShowLunarReturn}
            onSetLunarReturnStartDate={setLunarReturnStartDate}
            enableComposite={enableComposite}
            enableDavison={enableDavison}
            davisonLoading={state.davisonLoading}
            chartMode={state.chartMode}
            compositeLoading={state.compositeLoading}
            onSetChartMode={setChartMode}
            nameA={displayNameA}
            nameB={displayNameB}
            // Rotation controls
            rotateToAscendant={rotateToAscendant}
            onSetRotateToAscendant={(v: boolean) => { setRotateToAscendant(v); onRotateToAscendantChange?.(v); }}
            // Zodiac vantage controls (derived houses view)
            zodiacVantage={zodiacVantage}
            onSetZodiacVantage={(v: number | null) => { setZodiacVantage(v); onZodiacVantageChange?.(v); }}
            // Progressed chart controls
            enableProgressed={enableProgressed}
            showProgressed={state.showProgressed}
            progressedDate={state.progressedDate}
            progressedLoading={state.progressedLoading}
            progressedPerson={progressedPerson}
            onSetShowProgressed={setShowProgressed}
            onSetProgressedDate={setProgressedDate}
            onSetProgressedPerson={setProgressedPerson}
            // Solar Arc controls
            showSolarArc={state.showSolarArc}
            onSetShowSolarArc={setShowSolarArc}
            // Relocated chart controls
            enableRelocated={enableRelocated}
            showRelocated={state.showRelocated}
            relocatedLocationA={state.relocatedLocationA}
            relocatedLocationB={state.relocatedLocationB}
            relocatedLoading={state.relocatedLoading}
            relocatedPerson={relocatedPerson}
            originalLocation={originalLocation}
            locationB={locationB}
            onSetShowRelocated={setShowRelocated}
            onSetRelocatedPerson={setRelocatedPerson}
            onOpenLocationPicker={(person: 'A' | 'B') => {
              if (!user) { setShowAuthModal(true); return; }
              if (!isPaid) { setShowUpgradeModal(true); return; }
              setState(prev => ({ ...prev, locationPickerTarget: person }));
              setShowLocationPicker(true);
            }}
            onResetLocation={handleResetLocation}
            // Asteroid group controls
            enableAsteroids={true}
            enabledAsteroidGroups={state.enabledAsteroidGroups}
            onToggleAsteroidGroup={toggleAsteroidGroup}
            onEnableAllAsteroids={enableAllAsteroids}
            onDisableAllAsteroids={disableAllAsteroids}
            // Fixed star group controls
            enableFixedStars={!!onFetchFixedStarData}
            enabledFixedStarGroups={state.enabledFixedStarGroups}
            onToggleFixedStarGroup={toggleFixedStarGroup}
            onEnableAllFixedStars={enableAllFixedStars}
            onDisableAllFixedStars={disableAllFixedStars}
            // Theme controls
            chartTheme={chartTheme}
            onThemeChange={handleUserThemeChange}
            // Birth time shift (wheel-time knobs)
            enableBirthTimeShift={enableBirthTimeShift}
            showBirthTimeShift={state.showBirthTimeShift}
            onSetShowBirthTimeShift={setShowBirthTimeShift}
            // House system
            houseSystem={houseSystem}
            onSetHouseSystem={onHouseSystemChange}
            // Custom orbs
            customAspectOrbs={customAspectOrbs}
            customSeparatingAspectOrbs={customSeparatingAspectOrbs}
            customPlanetOrbs={customPlanetOrbs}
            onSetCustomAspectOrb={onCustomAspectOrbChange}
            onSetCustomSeparatingAspectOrb={onCustomSeparatingAspectOrbChange}
            onSetCustomPlanetOrb={onCustomPlanetOrbChange}
            onResetOrbs={onResetOrbs}
            // Harmonic charts
            harmonicNumber={harmonicNumber}
            onSetHarmonicNumber={onHarmonicNumberChange}
            // Sidereal zodiac
            zodiacType={zodiacType}
            onSetZodiacType={onZodiacTypeChange}
            ayanamsaKey={ayanamsaKey}
            onSetAyanamsaKey={onAyanamsaKeyChange}
            // Save current settings as default
            onSaveAsDefault={() => {
              const defaults: SavedChartDefaults = {
                visiblePlanets: [...state.visiblePlanets],
                visibleAspects: [...state.visibleAspects],
                showHouses: state.showHouses,
                showDegreeMarkers: state.showDegreeMarkers,
                showRetrogrades: state.showRetrogrades,
                showDecans: state.showDecans,
                degreeSymbolMode: state.degreeSymbolMode,
                rotateToAscendant: rotateToAscendant,
                chartTheme: chartTheme,
                enabledAsteroidGroups: [...state.enabledAsteroidGroups],
                enabledFixedStarGroups: [...state.enabledFixedStarGroups],
                straightAspects: state.straightAspects,
                showEffects: state.showEffects,
              };
              localStorage.setItem(CHART_DEFAULTS_KEY, JSON.stringify(defaults));
            }}
            // Controlled collapsed state
            collapsed={togglePanelCollapsed}
            onCollapsedChange={onTogglePanelCollapsedChange}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default BiWheelSynastry;
