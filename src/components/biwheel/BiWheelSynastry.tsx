/**
 * BiWheel Synastry Component
 * Main orchestrator for the synastry biwheel chart
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { PlanetRing, preparePlanets } from './layers/PlanetRing';
import { TransitRing } from './layers/TransitRing';
// ProgressedRing no longer used - progressed planets are integrated into effectiveChart
import { DecanRing } from './layers/DecanRing';
import { AspectGrid } from './layers/AspectGrid';
import type { PlanetDisplayPositions, TransitData, CompositeData, ChartMode, ProgressedData, RelocatedData, LocationData, AsteroidGroup } from './types';
import { ASTEROID_GROUPS } from './types';
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
// TogglePanel — lazy-loaded (desktop sidebar, not used on mobile)
const TogglePanel = React.lazy(() => import('./controls/TogglePanel').then(m => ({ default: m.TogglePanel })));
import { calculateDeclination } from '@/lib/declination';
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
  rotateToAscendant: boolean;
  chartTheme: string;
  enabledAsteroidGroups: string[];
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
 * Uses equal house system (30° per house).
 */
function calculateHouseFromLongitude(longitude: number, ascendant: number): number {
  // Normalize the difference to 0-360 range
  let diff = longitude - ascendant;
  while (diff < 0) diff += 360;
  while (diff >= 360) diff -= 360;
  // Each house is 30 degrees, house 1 starts at ascendant
  return Math.floor(diff / 30) + 1;
}

export const BiWheelSynastry: React.FC<BiWheelSynastryProps> = ({
  chartA,
  chartB,
  nameA,
  nameB,
  showTogglePanel = true,
  hideZoomControls = false,
  initialVisiblePlanets,
  initialVisibleAspects,
  initialShowHouses = true,
  initialShowDegreeMarkers = true,
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
  // Progressed props
  enableProgressed = false,
  onFetchProgressed,
  // Relocated props
  enableRelocated = false,
  onFetchRelocated,
  originalLocation,
  locationB,
  // External control of relocated location (from parent, e.g., map selection)
  externalRelocatedLocation,
  externalRelocatedPerson,
  // Birth data for Person A (used for astrocartography in location picker)
  birthDateA,
  birthTimeA,
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
  onTransitLoadingChange,
  onAsteroidsChange,
  // Asteroids data fetch
  onFetchAsteroidData,
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
    showRetrogrades: savedDefaults ? savedDefaults.showRetrogrades : true,
    showDecans: savedDefaults ? savedDefaults.showDecans : false,
    hoveredPlanet: null,
    selectedAspect: null,
    selectedPlanet: null,
    selectedSign: null,
    tooltipPosition: null,
    // Transit/Composite state
    showTransits: initialShowTransits,
    transitDate: initialTransitDate || today,
    transitTime: initialTransitTime || currentTime,
    transitData: null,
    transitLoading: false,
    chartMode: initialChartMode,
    compositeData: null,
    compositeLoading: false,
    // Progressed state
    showProgressed: !!initialProgressedPerson,
    progressedDate: initialProgressedDate || today,
    progressedData: null,
    progressedDataOther: null,
    progressedLoading: false,
    // Relocated state
    showRelocated: !!initialRelocatedPerson,
    relocatedLocation: null,
    relocatedData: null,
    relocatedDataOther: null,
    relocatedLoading: false,
    showLocationPicker: false,
    // Asteroids state
    enabledAsteroidGroups: savedDefaults ? new Set(savedDefaults.enabledAsteroidGroups as AsteroidGroup[]) : new Set<AsteroidGroup>(),
    // Solar Arc state (derived from progressed Sun - mutually exclusive with progressed)
    showSolarArc: initialShowSolarArc || false,
  });

  // Swap A/B state - when true, Person A and B are swapped in the biwheel
  const [swapped, setSwapped] = useState(false);

  // Rotation state - rotate chart so Person A's Ascendant is at 9 o'clock (left side, traditional East)
  const [rotateToAscendant, setRotateToAscendant] = useState(savedDefaults ? savedDefaults.rotateToAscendant : true);

  // Theme state - prefer parent prop (DB source of truth), fall back to saved defaults, then 'classic'
  const [chartTheme, setChartTheme] = useState<ThemeName>(
    (initialTheme as ThemeName) || (savedDefaults ? savedDefaults.chartTheme as ThemeName : 'classic')
  );
  useMemo(() => {
    applyTheme(chartTheme);
    setCurrentThemeName(chartTheme);
    onThemeChange?.(chartTheme);
  }, [chartTheme]);

  // Sync when parent theme changes (e.g. after DB load resolves)
  useEffect(() => {
    if (initialTheme && initialTheme !== chartTheme) {
      setChartTheme(initialTheme as ThemeName);
    }
  }, [initialTheme]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const [zodiacVantage, setZodiacVantage] = useState<number | null>(null);

  // Progressed person state - which person(s) progressed chart to show
  const [progressedPerson, setProgressedPerson] = useState<'A' | 'B' | 'both' | null>(initialProgressedPerson ?? null);

  // Relocated person state - which person(s) relocated chart to show
  const [relocatedPerson, setRelocatedPerson] = useState<'A' | 'B' | 'both' | null>(initialRelocatedPerson ?? null);

  // Sync external relocated location/person from parent (e.g., map selection)
  useEffect(() => {
    console.log('[BiWheel] External relocated sync effect:', {
      externalRelocatedLocation,
      externalRelocatedPerson,
      currentRelocatedPerson: relocatedPerson,
      currentShowRelocated: state.showRelocated,
      currentRelocatedLocation: state.relocatedLocation
    });

    if (externalRelocatedLocation && externalRelocatedPerson) {
      console.log('[BiWheel] Setting relocated state from external:', externalRelocatedPerson, externalRelocatedLocation);
      setRelocatedPerson(externalRelocatedPerson);
      setState(prev => ({
        ...prev,
        showRelocated: true,
        relocatedLocation: externalRelocatedLocation,
        // Clear old data when location changes so we refetch
        relocatedData: prev.relocatedLocation?.lat !== externalRelocatedLocation.lat ||
                       prev.relocatedLocation?.lng !== externalRelocatedLocation.lng
                       ? null : prev.relocatedData,
        relocatedDataOther: prev.relocatedLocation?.lat !== externalRelocatedLocation.lat ||
                            prev.relocatedLocation?.lng !== externalRelocatedLocation.lng
                            ? null : prev.relocatedDataOther,
      }));
    } else if (externalRelocatedLocation === null && externalRelocatedPerson === null) {
      // Clear relocated if parent explicitly clears it
      console.log('[BiWheel] Clearing relocated state');
      setRelocatedPerson(null);
      setState(prev => ({
        ...prev,
        showRelocated: false,
        relocatedLocation: null,
        relocatedData: null,
        relocatedDataOther: null,
      }));
    }
    // Note: If only one is null, we keep the current state (map closed but selection preserved)
  }, [externalRelocatedLocation, externalRelocatedPerson]);

  // Asteroid data state - stores fetched asteroid positions
  const [asteroidData, setAsteroidData] = useState<{ chartA: Record<string, any>; chartB: Record<string, any> } | null>(null);
  const [asteroidLoading, setAsteroidLoading] = useState(false);

  // Sync chartMode when initialChartMode prop changes
  useEffect(() => {
    setState(prev => ({ ...prev, chartMode: initialChartMode }));
  }, [initialChartMode]);

  // Additional tooltip states
  const [hoveredSign, setHoveredSign] = useState<SignData | null>(null);
  const [signTooltipPos, setSignTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredHouse, setHoveredHouse] = useState<HouseHoverData | null>(null);
  const [houseTooltipPos, setHouseTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredAspect, setHoveredAspect] = useState<SynastryAspect | null>(null);
  const [aspectTooltipPos, setAspectTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Calculate dimensions based on chart mode (always using fixed VIEWBOX_SIZE coordinate system)
  const isSingleWheel = state.chartMode !== 'synastry';
  const dimensions = useMemo(
    () => isSingleWheel
      ? calculateSingleWheelDimensions(VIEWBOX_SIZE, state.showTransits, state.showProgressed, state.showDecans)
      : calculateDimensions(VIEWBOX_SIZE, state.showTransits, state.showProgressed, state.showDecans),
    [state.showTransits, state.showProgressed, state.showDecans, isSingleWheel]
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

  // Fetch transits when showTransits is enabled or transitDate/transitTime changes
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

    const fetchData = async () => {
      setState(prev => ({ ...prev, transitLoading: true }));
      onTransitLoadingChange?.(true);
      try {
        console.log('Fetching transits for:', state.transitDate, state.transitTime);
        const data = await onFetchTransits(state.transitDate, state.transitTime, chartA, chartB, computedAsteroids);
        console.log('Transit data received:', data?.transit_planets?.length, 'planets');
        if (!data?.transit_planets?.length) {
          console.warn('Transit data received but no planets found');
        }
        setState(prev => ({ ...prev, transitData: data, transitLoading: false }));
        onTransitLoadingChange?.(false);
      } catch (error) {
        console.error('Failed to fetch transits:', error);
        setState(prev => ({ ...prev, transitLoading: false, transitData: null }));
        onTransitLoadingChange?.(false);
      }
    };

    fetchData();
  }, [state.showTransits, state.transitDate, state.transitTime, chartA, chartB, onFetchTransits, computedAsteroids, onTransitLoadingChange]);

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

  // Fetch progressed chart when progressedPerson is set or progressedDate changes
  useEffect(() => {
    console.log('[Progressed] Fetch effect triggered:', {
      progressedPerson,
      showProgressed: state.showProgressed,
      progressedDate: state.progressedDate,
      hasCallback: !!onFetchProgressed,
    });

    if (!progressedPerson || !state.showProgressed) {
      console.log('[Progressed] Conditions not met for fetch:', {
        progressedPerson,
        showProgressed: state.showProgressed
      });
      // Clear progressed data when disabled
      if (state.progressedData || state.progressedDataOther) {
        setState(prev => ({ ...prev, progressedData: null, progressedDataOther: null }));
      }
      return;
    }

    if (!onFetchProgressed) {
      console.warn('[Progressed] Callback not provided, cannot fetch');
      return;
    }

    const fetchData = async () => {
      // When 'both', use A as primary so relocatedData=A, relocatedDataOther=B
      const primaryPerson = progressedPerson === 'both' ? 'A' : progressedPerson;
      const otherPerson = primaryPerson === 'A' ? 'B' : 'A';
      console.log('[Progressed] Starting fetch for person:', primaryPerson, '(mode:', progressedPerson, ') date:', state.progressedDate);
      setState(prev => ({ ...prev, progressedLoading: true }));
      onProgressedLoadingChange?.(true);
      try {
        // Fetch progressed chart for the primary person
        const data = await onFetchProgressed(primaryPerson, state.progressedDate, computedAsteroids);
        console.log('[Progressed] Data received:', {
          planetsCount: data?.progressed_planets?.length,
          ascendant: data?.ascendantSign,
          hasHouses: !!data?.houses,
        });
        // Set primary data immediately so the wheel updates right away
        setState(prev => ({ ...prev, progressedData: data, progressedLoading: false }));
        onProgressedLoadingChange?.(false);

        // Then fetch the other person's progressed data for house ring consistency
        try {
          const otherData = await onFetchProgressed(otherPerson, state.progressedDate, computedAsteroids);
          console.log('[Progressed] Other person data received:', {
            otherAscendant: otherData?.houses?.ascendant,
          });
          setState(prev => ({ ...prev, progressedDataOther: otherData }));
        } catch (otherError) {
          console.warn('[Progressed] Failed to fetch other person data (non-critical):', otherError);
        }
      } catch (error) {
        console.error('[Progressed] Failed to fetch:', error);
        setState(prev => ({ ...prev, progressedLoading: false, progressedData: null, progressedDataOther: null }));
        onProgressedLoadingChange?.(false);
      }
    };

    fetchData();
  }, [progressedPerson, state.showProgressed, state.progressedDate, onFetchProgressed, computedAsteroids]);

  // Fetch relocated chart when relocatedPerson is set or relocatedLocation changes
  useEffect(() => {
    console.log('[Relocated] Fetch effect triggered:', {
      relocatedPerson,
      showRelocated: state.showRelocated,
      relocatedLocation: state.relocatedLocation,
      hasCallback: !!onFetchRelocated,
    });

    if (!relocatedPerson || !state.showRelocated || !state.relocatedLocation) {
      console.log('[Relocated] Conditions not met for fetch, clearing data if exists');
      // Clear relocated data when disabled
      if (state.relocatedData || state.relocatedDataOther) {
        setState(prev => ({ ...prev, relocatedData: null, relocatedDataOther: null }));
      }
      return;
    }

    if (!onFetchRelocated) {
      console.warn('[Relocated] Callback not provided, cannot fetch');
      return;
    }

    const fetchData = async () => {
      // When 'both', use A as primary so relocatedData=A, relocatedDataOther=B
      const primaryPerson = relocatedPerson === 'both' ? 'A' : relocatedPerson;
      const otherPerson = primaryPerson === 'A' ? 'B' : 'A';
      console.log('[Relocated] Starting fetch for person:', primaryPerson, '(mode:', relocatedPerson, ') location:', state.relocatedLocation);
      setState(prev => ({ ...prev, relocatedLoading: true }));
      onRelocatedLoadingChange?.(true);
      try {
        // Fetch primary person's relocated data first
        const data = await onFetchRelocated(primaryPerson, state.relocatedLocation!.lat, state.relocatedLocation!.lng, computedAsteroids);
        console.log('[Relocated] Primary data received:', {
          planetsCount: data?.relocated_planets?.length,
          ascendant: data?.houses?.ascendant,
          hasHouses: !!data?.houses,
        });
        // Set primary data immediately so the wheel updates right away
        setState(prev => ({ ...prev, relocatedData: data, relocatedLoading: false }));
        onRelocatedLoadingChange?.(false);

        // Then fetch the other person's relocated data for house ring consistency
        try {
          const otherData = await onFetchRelocated(otherPerson, state.relocatedLocation!.lat, state.relocatedLocation!.lng, computedAsteroids);
          console.log('[Relocated] Other person data received:', {
            otherAscendant: otherData?.houses?.ascendant,
          });
          setState(prev => ({ ...prev, relocatedDataOther: otherData }));
        } catch (otherError) {
          console.warn('[Relocated] Failed to fetch other person data (non-critical):', otherError);
        }
      } catch (error) {
        console.error('[Relocated] Failed to fetch:', error);
        setState(prev => ({ ...prev, relocatedLoading: false, relocatedData: null, relocatedDataOther: null }));
        onRelocatedLoadingChange?.(false);
      }
    };

    fetchData();
  }, [relocatedPerson, state.showRelocated, state.relocatedLocation, onFetchRelocated, computedAsteroids]);

  // Transit/Composite toggle handlers
  const setShowTransits = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showTransits: show,
    }));
    // Notify parent of change
    onShowTransitsChange?.(show);
  }, [onShowTransitsChange]);

  const setTransitDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, transitDate: date }));
    onTransitDateChange?.(date);
  }, [onTransitDateChange]);

  const setTransitTime = useCallback((time: string) => {
    setState(prev => ({ ...prev, transitTime: time }));
  }, []);

  const setChartMode = useCallback((mode: ChartMode) => {
    setState(prev => ({
      ...prev,
      chartMode: mode,
    }));
    // Notify parent of change
    onChartModeChange?.(mode);
  }, [onChartModeChange]);

  // Progressed chart handlers - mutually exclusive with relocated
  const setShowProgressed = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showProgressed: show,
      // Disable relocated when enabling progressed (mutually exclusive)
      ...(show ? { showRelocated: false, relocatedData: null, relocatedDataOther: null, relocatedLocation: null, progressedDataOther: null } : {}),
    }));
    if (show) {
      setRelocatedPerson(null);
      onRelocatedPersonChange?.(null);
    }
  }, [onRelocatedPersonChange]);

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

  // Relocated chart handlers - mutually exclusive with progressed
  const setShowRelocated = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showRelocated: show,
      // Disable progressed when enabling relocated (mutually exclusive)
      ...(show ? { showProgressed: false, progressedData: null, progressedDataOther: null } : {}),
    }));
    if (show) {
      setProgressedPerson(null);
      onProgressedPersonChange?.(null);
    }
  }, [onProgressedPersonChange]);

  const setRelocatedLocation = useCallback((location: LocationData | null) => {
    setState(prev => ({ ...prev, relocatedLocation: location }));
  }, []);

  const setShowLocationPicker = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showLocationPicker: show }));
  }, []);

  const handleLocationConfirm = useCallback((location: LocationData) => {
    setRelocatedLocation(location);
    setShowLocationPicker(false);
  }, [setRelocatedLocation, setShowLocationPicker]);

  const handleResetLocation = useCallback(() => {
    setRelocatedLocation(null);
    setState(prev => ({ ...prev, relocatedData: null, relocatedDataOther: null }));
  }, [setRelocatedLocation]);

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
  }, [chartA.planets, chartA.angles, asteroidData]);

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
  }, [chartB.planets, chartB.angles, asteroidData]);

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
  }, [state.showRelocated, relocatedPerson, state.relocatedData?.houses, state.relocatedDataOther?.houses, state.showProgressed, state.showSolarArc, progressedPerson, state.progressedData, state.progressedDataOther, progressedPlanetsToRecord, planetsWithAnglesA, chartA.houses, chartA.angles, mergedChartA]);

  const effectiveChartB = useMemo((): NatalChart => {
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
  }, [state.showRelocated, relocatedPerson, state.relocatedData?.houses, state.relocatedDataOther?.houses, state.showProgressed, state.showSolarArc, progressedPerson, state.progressedData, state.progressedDataOther, progressedPlanetsToRecord, planetsWithAnglesB, chartB.houses, chartB.angles, mergedChartB]);

  // Swap-aware chart and name references
  const displayChartA = swapped ? effectiveChartB : effectiveChartA;
  const displayChartB = swapped ? effectiveChartA : effectiveChartB;
  const displayNameA = swapped ? nameB : nameA;
  const displayNameB = swapped ? nameA : nameB;

  // Debug: Log relocated state whenever it changes
  useEffect(() => {
    console.log('[BiWheel DEBUG] Relocated state:', {
      showRelocated: state.showRelocated,
      relocatedPerson,
      hasRelocatedData: !!state.relocatedData,
      hasRelocatedDataOther: !!state.relocatedDataOther,
      relocatedDataHouses: state.relocatedData?.houses,
      relocatedDataOtherHouses: state.relocatedDataOther?.houses,
      effectiveChartA_ascendant: effectiveChartA.angles?.ascendant,
      effectiveChartA_midheaven: effectiveChartA.angles?.midheaven,
      effectiveChartB_ascendant: effectiveChartB.angles?.ascendant,
      effectiveChartB_midheaven: effectiveChartB.angles?.midheaven,
      rotationOffset,
    });
  }, [state.showRelocated, relocatedPerson, state.relocatedData, state.relocatedDataOther, effectiveChartA, effectiveChartB, rotationOffset]);

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
      default:
        return displayChartA;
    }
  }, [state.chartMode, displayChartA, displayChartB, compositeNatalChart]);

  const houseOverlayChartB = useMemo((): NatalChart => {
    switch (state.chartMode) {
      case 'personA':
        return displayChartA;
      case 'personB':
        return displayChartB;
      case 'composite':
        return compositeNatalChart || displayChartB;
      default:
        return displayChartB;
    }
  }, [state.chartMode, displayChartA, displayChartB, compositeNatalChart]);

  // Calculate aspects based on chart mode
  // When swapped in synastry mode, swap inputs so aspect.planetA refers to the outer ring person
  const aspects = useMemo(() => {
    switch (state.chartMode) {
      case 'personA':
        return calculateNatalAspects(planetsWithAnglesA, state.visiblePlanets);
      case 'personB':
        return calculateNatalAspects(planetsWithAnglesB, state.visiblePlanets);
      case 'composite':
        return state.compositeData
          ? calculateNatalAspects(compositeWithAngles, state.visiblePlanets)
          : [];
      case 'synastry':
      default: {
        const outerPlanets = swapped ? planetsWithAnglesB : planetsWithAnglesA;
        const innerPlanets = swapped ? planetsWithAnglesA : planetsWithAnglesB;
        return calculateSynastryAspects(outerPlanets, innerPlanets, state.visiblePlanets);
      }
    }
  }, [state.chartMode, planetsWithAnglesA, planetsWithAnglesB, compositeWithAngles, state.visiblePlanets, state.compositeData, swapped]);

  // Calculate planet positions for both charts (for aspect line positioning)
  // Use displayChart (swap-aware) so aspect lines match the rendered planet positions
  const placedPlanetsA = useMemo(
    () => preparePlanets(displayChartA, state.visiblePlanets, dimensions, dimensions.planetARing),
    [displayChartA, state.visiblePlanets, dimensions]
  );

  const placedPlanetsB = useMemo(
    () => preparePlanets(displayChartB, state.visiblePlanets, dimensions, dimensions.planetBRing),
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
    }
    return map;
  }, [state.chartMode, placedPlanetsA, placedPlanetsB, compositeWithAngles]);

  // Transit display positions (map planet name to longitude)
  const transitDisplayPositions: PlanetDisplayPositions = useMemo(() => {
    const map = new Map<string, number>();
    if (state.transitData?.transit_planets) {
      for (const planet of state.transitData.transit_planets) {
        map.set(planet.planet, planet.longitude);
      }
    }
    return map;
  }, [state.transitData]);

  // Calculate transit aspects to natal chart(s)
  // Returns aspects with info about which natal chart they aspect (A, B, or composite)
  const transitAspects = useMemo(() => {
    if (!state.transitData?.transit_planets) return [];

    // Build transit planets object for aspect calculation
    const transitPlanets: Record<string, { longitude: number }> = {};
    for (const tp of state.transitData.transit_planets) {
      transitPlanets[tp.planet] = { longitude: tp.longitude };
    }

    const allAspects: Array<SynastryAspect & { natalChart: 'A' | 'B' | 'Composite' }> = [];

    // Calculate aspects based on chart mode
    if (state.chartMode === 'composite' && state.compositeData) {
      // Aspects to composite chart
      const compositeAspects = calculateSynastryAspects(
        transitPlanets,
        compositeWithAngles,
        state.visiblePlanets
      );
      for (const asp of compositeAspects) {
        allAspects.push({ ...asp, natalChart: 'Composite' });
      }
    } else if (state.chartMode === 'personA') {
      // Only aspects to Person A
      const aspectsToA = calculateSynastryAspects(
        transitPlanets,
        planetsWithAnglesA,
        state.visiblePlanets
      );
      for (const asp of aspectsToA) {
        allAspects.push({ ...asp, natalChart: 'A' });
      }
    } else if (state.chartMode === 'personB') {
      // Only aspects to Person B
      const aspectsToB = calculateSynastryAspects(
        transitPlanets,
        planetsWithAnglesB,
        state.visiblePlanets
      );
      for (const asp of aspectsToB) {
        allAspects.push({ ...asp, natalChart: 'B' });
      }
    } else {
      // Synastry mode: aspects to both A and B
      const aspectsToA = calculateSynastryAspects(
        transitPlanets,
        planetsWithAnglesA,
        state.visiblePlanets
      );
      for (const asp of aspectsToA) {
        allAspects.push({ ...asp, natalChart: 'A' });
      }

      const aspectsToB = calculateSynastryAspects(
        transitPlanets,
        planetsWithAnglesB,
        state.visiblePlanets
      );
      for (const asp of aspectsToB) {
        allAspects.push({ ...asp, natalChart: 'B' });
      }
    }

    // Sort by orb tightness
    return allAspects.sort((a, b) => a.aspect.exactOrb - b.aspect.exactOrb);
  }, [
    state.transitData,
    state.chartMode,
    state.compositeData,
    state.visiblePlanets,
    planetsWithAnglesA,
    planetsWithAnglesB,
    compositeWithAngles,
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

  const handlePlanetHover = useCallback(
    (planet: { planet: string; chart: 'A' | 'B' | 'Transit' | 'Composite' } | null, event?: React.MouseEvent) => {
      setState((prev) => ({
        ...prev,
        hoveredPlanet: planet,
        // Preserve tooltipPosition if we have a pinned selection
        tooltipPosition: event
          ? { x: event.clientX, y: event.clientY }
          : prev.selectedPlanet || prev.selectedAspect || prev.selectedSign
            ? prev.tooltipPosition
            : null,
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
      setState((prev) => ({
        ...prev,
        selectedPlanet: prev.selectedPlanet?.planet === planet && prev.selectedPlanet?.chart === chart
          ? null
          : { planet, chart },
        hoveredPlanet: null, // Clear hover state
        selectedAspect: null, // Clear other selections
        selectedSign: null,
        tooltipPosition: event ? { x: event.clientX, y: event.clientY } : prev.tooltipPosition,
      }));
      onPlanetClick?.(planet, chart);
    },
    [onPlanetClick]
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

  // Save current selections as defaults to localStorage
  const saveDefaults = useCallback(() => {
    const defaults: SavedChartDefaults = {
      visiblePlanets: Array.from(state.visiblePlanets),
      visibleAspects: Array.from(state.visibleAspects),
      showHouses: state.showHouses,
      showDegreeMarkers: state.showDegreeMarkers,
      showRetrogrades: state.showRetrogrades,
      showDecans: state.showDecans,
      rotateToAscendant,
      chartTheme,
      enabledAsteroidGroups: Array.from(state.enabledAsteroidGroups),
    };
    localStorage.setItem(CHART_DEFAULTS_KEY, JSON.stringify(defaults));
  }, [state.visiblePlanets, state.visibleAspects, state.showHouses, state.showDegreeMarkers, state.showRetrogrades, state.showDecans, rotateToAscendant, chartTheme, state.enabledAsteroidGroups]);

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
      }))}
    >
      {/* SVG Chart - wrapper keeps square aspect ratio, SVG scales via viewBox */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
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
          nameA={state.chartMode === 'composite' ? 'Composite' : state.chartMode === 'personB' ? displayNameB : displayNameA}
          nameB={state.chartMode === 'composite' ? 'Composite' : state.chartMode === 'personA' ? displayNameA : displayNameB}
          showHouses={state.showHouses}
          showDegreeMarkers={state.showDegreeMarkers}
          onHouseHover={handleHouseHover}
          rotationOffset={rotationOffset}
          zodiacVantage={zodiacVantage}
          hideOuterHouseRing={isSingleWheel}
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
          visiblePlanets={state.visiblePlanets}
          showRetrogrades={state.showRetrogrades}
          showDecans={state.showDecans}
          hoveredPlanet={state.hoveredPlanet}
          selectedAspect={state.selectedAspect}
          aspects={aspects}
          onPlanetHover={handlePlanetHover}
          onPlanetClick={handlePlanetClick}
          rotationOffset={rotationOffset}
        />

        {/* Transit ring (outermost when enabled) */}
        {state.showTransits && state.transitData && (
          <TransitRing
            dimensions={dimensions}
            transitPlanets={state.transitData.transit_planets}
            visiblePlanets={state.visiblePlanets}
            showRetrogrades={state.showRetrogrades}
            hoveredPlanet={state.hoveredPlanet}
            onPlanetHover={handlePlanetHover}
            onPlanetClick={handlePlanetClick}
            rotationOffset={rotationOffset}
          />
        )}

        {/* Progressed planets are now integrated into effectiveChart (no separate outer ring) */}

        {/* Transit loading indicator */}
        {state.showTransits && state.transitLoading && (
          <g>
            <rect
              x={dimensions.cx - 80}
              y={dimensions.cy - 20}
              width={160}
              height={40}
              rx={8}
              fill={COLORS.background}
              stroke="#228B22"
              strokeWidth={1.5}
              fillOpacity={0.95}
            />
            <text
              x={dimensions.cx}
              y={dimensions.cy}
              fill="#228B22"
              fontSize={12}
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              ⏳ Loading Transits...
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
        {state.showRelocated && state.relocatedData && !state.relocatedLoading && (
          <g>
            <rect
              x={dimensions.cx - 100}
              y={dimensions.cy + 80}
              width={200}
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
              {state.relocatedLocation?.name || 'New Location'}
            </text>
          </g>
        )}

        {/* Legend (fixed position, not rotated) */}
        {(() => {
          // Calculate legend height dynamically
          const baseItems = state.chartMode === 'synastry' ? 2 : 1;
          const transitItem = state.showTransits && state.transitData ? 1 : 0;
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
              ) : null}
              {state.showTransits && state.transitData && (
                <>
                  <circle cx={10} cy={state.chartMode === 'synastry' ? 46 : 28} r={6} fill="#228B22" />
                  <text x={22} y={state.chartMode === 'synastry' ? 50 : 32} fill={COLORS.textSecondary} fontSize={10}>
                    Transits
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
        <text x={22} y={54} fill={COLORS.textSecondary} fontSize={14} fontWeight={300} fontFamily="'Inter', system-ui, sans-serif" letterSpacing="0.08em" opacity={0.5}>
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
            originalLocation={originalLocation}
            currentLocation={state.relocatedLocation || undefined}
            birthDate={birthDateA}
            birthTime={birthTimeA}
            showAstroLines={true}
          />
        </React.Suspense>
      )}

      {/* Auth/Upgrade modals for gated features */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* Tooltips — lazy-loaded on first interaction */}
      <React.Suspense fallback={null}>
      {/* Planet Tooltip (on hover) */}
      {state.hoveredPlanet && hoveredPlanetData && state.tooltipPosition && !state.selectedPlanet && (
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
                state.hoveredPlanet.chart === 'A' ? (displayChartA.angles?.ascendant ?? 0) : (displayChartB.angles?.ascendant ?? 0)
              ) : undefined}
          partnerHouse={isSingleWheel || state.hoveredPlanet.chart === 'Transit' ? undefined :
            hoveredPlanetData.longitude !== undefined ?
              calculateHouseFromLongitude(
                hoveredPlanetData.longitude,
                state.hoveredPlanet.chart === 'A' ? (displayChartB.angles?.ascendant ?? 0) : (displayChartA.angles?.ascendant ?? 0)
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

      {/* Planet Tooltip (on click - with close button) */}
      {state.selectedPlanet && selectedPlanetData && state.tooltipPosition && (
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
                state.selectedPlanet.chart === 'A' ? (displayChartA.angles?.ascendant ?? 0) : (displayChartB.angles?.ascendant ?? 0)
              ) : undefined}
          partnerHouse={isSingleWheel || state.selectedPlanet.chart === 'Transit' ? undefined :
            selectedPlanetData.longitude !== undefined ?
              calculateHouseFromLongitude(
                selectedPlanetData.longitude,
                state.selectedPlanet.chart === 'A' ? (displayChartB.angles?.ascendant ?? 0) : (displayChartA.angles?.ascendant ?? 0)
              ) : undefined}
          aspects={state.selectedPlanet.chart === 'Transit' ? [] : aspects}
          visibleAspects={state.visibleAspects}
          position={state.tooltipPosition}
          visible={true}
          onClose={() => setState((prev) => ({ ...prev, selectedPlanet: null }))}
          partnerChart={isSingleWheel || state.selectedPlanet.chart === 'Transit' ? undefined : state.selectedPlanet.chart === 'A' ? displayChartB : displayChartA}
          transitDate={state.selectedPlanet.chart === 'Transit' ? state.transitDate : undefined}
          transitAspects={state.selectedPlanet.chart === 'Transit' ? transitAspects : undefined}
          nameA={displayNameA}
          nameB={displayNameB}
        />
      )}

      {/* Sign Tooltip (on hover) */}
      {hoveredSign && signTooltipPos && !state.selectedSign && (
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

      {/* House Tooltip */}
      {hoveredHouse && houseTooltipPos && (
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
      </React.Suspense>
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
            onTogglePlanet={togglePlanet}
            onToggleAspect={toggleAspect}
            onSetShowHouses={setShowHouses}
            onSetShowDegreeMarkers={setShowDegreeMarkers}
            onSetShowRetrogrades={setShowRetrogrades}
            onSetShowDecans={setShowDecans}
            onEnablePlanetGroup={enablePlanetGroup}
            onDisablePlanetGroup={disablePlanetGroup}
            onEnableMinorAspects={enableMinorAspects}
            onDisableMinorAspects={disableMinorAspects}
            // Transit/Composite controls
            enableTransits={enableTransits}
            showTransits={state.showTransits}
            transitDate={state.transitDate}
            transitTime={state.transitTime}
            transitLoading={state.transitLoading}
            onSetShowTransits={setShowTransits}
            onSetTransitDate={setTransitDate}
            onSetTransitTime={setTransitTime}
            enableComposite={enableComposite}
            chartMode={state.chartMode}
            compositeLoading={state.compositeLoading}
            onSetChartMode={setChartMode}
            nameA={displayNameA}
            nameB={displayNameB}
            // Rotation controls
            rotateToAscendant={rotateToAscendant}
            onSetRotateToAscendant={setRotateToAscendant}
            // Zodiac vantage controls (derived houses view)
            zodiacVantage={zodiacVantage}
            onSetZodiacVantage={setZodiacVantage}
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
            relocatedLocation={state.relocatedLocation}
            relocatedLoading={state.relocatedLoading}
            relocatedPerson={relocatedPerson}
            originalLocation={originalLocation}
            locationB={locationB}
            onSetShowRelocated={setShowRelocated}
            onSetRelocatedLocation={setRelocatedLocation}
            onSetRelocatedPerson={setRelocatedPerson}
            onOpenLocationPicker={() => {
              if (!user) { setShowAuthModal(true); return; }
              if (!isPaid) { setShowUpgradeModal(true); return; }
              setShowLocationPicker(true);
            }}
            onResetLocation={handleResetLocation}
            // Asteroid group controls
            enableAsteroids={true}
            enabledAsteroidGroups={state.enabledAsteroidGroups}
            onToggleAsteroidGroup={toggleAsteroidGroup}
            onEnableAllAsteroids={enableAllAsteroids}
            onDisableAllAsteroids={disableAllAsteroids}
            // Theme controls
            chartTheme={chartTheme}
            onThemeChange={setChartTheme}
            // Save defaults
            onSaveDefaults={saveDefaults}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default BiWheelSynastry;
