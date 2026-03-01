/**
 * BiWheel Mobile Wrapper
 * Provides responsive sizing, pinch-to-zoom, pan, and full-screen mode for the biwheel chart
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { BiWheelSynastry } from './BiWheelSynastry';
import { TogglePanelContent } from './controls/TogglePanelContent';
import type { BiWheelSynastryProps, AsteroidGroup, ChartMode, LocationData } from './types';
import { ASTEROID_GROUPS } from './types';
import { ASTEROIDS, ASTEROID_GROUP_INFO, DEFAULT_VISIBLE_PLANETS, applyTheme } from './utils/constants';
import { THEMES, type ThemeName } from './utils/themes';
import { BirthTimeShiftKnob } from './controls/BirthTimeShiftKnob';
import { TransitJogWheel } from './controls/TransitJogWheel';
import { Drawer } from 'vaul';
import { Settings2, Download, Image, FileText, Mail, Loader2, Share2, Link2, Check, Plus, X, Bookmark } from 'lucide-react';
import { type ChartPreset, loadPresets, savePreset, deletePreset, reorderPresets, buildPresetFromState, loadPresetsFromProfile, savePresetsToProfile } from './utils/presets';
// Lazy-import chart export (pulls in jsPDF ~357KB) — only needed on export button click
const getChartExport = () => import('@/lib/chartExport');
import * as analytics from '@/lib/analytics';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
// Lazy-load LocationPicker — Leaflet is ~4MB, only needed when relocate modal opens
const LocationPicker = React.lazy(() => import('./controls/LocationPicker').then(m => ({ default: m.LocationPicker })));

interface BiWheelMobileWrapperProps extends Omit<BiWheelSynastryProps, 'size' | 'showTogglePanel'> {
  /** Minimum chart size in pixels (must be at least 500 for proper rendering) */
  minSize?: number;
  /** Maximum chart size in pixels */
  maxSize?: number;
  /** Whether to enable mobile optimizations (auto-detected if not provided) */
  forceMobile?: boolean;
  /** Callback when visible planets change (for syncing with galactic mode) */
  onVisiblePlanetsChange?: (planets: Set<string>) => void;
  /** Callback when visible aspects change (for syncing with galactic mode) */
  onVisibleAspectsChange?: (aspects: Set<string>) => void;
  /** Birth data for generating shareable links */
  shareBirthData?: { name: string; date: string; time: string; lat: number; lng: number; location: string };
  /** localStorage key for chart notes (enables "share notes" checkbox in email modal) */
  chartNotesKey?: string;
  /** Initial asteroid groups to enable (from shared link) */
  initialEnabledAsteroidGroups?: Set<AsteroidGroup>;
  /** When true, disables all interactions (for guest live view + replay) */
  readOnly?: boolean;
  /** External state overrides (for guest live view + replay) */
  externalState?: Partial<{
    chartMode: string;
    visiblePlanets: string[];
    visibleAspects: string[];
    showHouses: boolean;
    showDegreeMarkers: boolean;
    showTransits: boolean;
    transitDate: string;
    transitTime: string;
    showProgressed: boolean;
    progressedPerson: string | null;
    progressedDate: string;
    showSolarArc: boolean;
    showRelocated: boolean;
    relocatedPerson: string | null;
    relocatedLocationA: LocationData | null;
    relocatedLocationB: LocationData | null;
    enabledAsteroidGroups: string[];
    chartTheme: string;
    rotateToAscendant: boolean;
    zodiacVantage: number | null;
    straightAspects: boolean;
    showEffects: boolean;
    showRetrogrades: boolean;
    showDecans: boolean;
    scale: number;
    translateX: number;
    translateY: number;
  }>;
  /** Callback when internal state changes (for session recording) */
  onStateChange?: (type: string, payload: any) => void;
  /** Callback for cursor position relative to chart area (normalized 0-1) */
  onCursorMove?: (x: number, y: number) => void;
  /** Ref that BiWheel writes its current state into (for session snapshots) */
  stateRef?: React.MutableRefObject<Record<string, any> | null>;
  /** Remote cursor to render inside the chart container (positioned relative to chart area) */
  remoteCursor?: React.ReactNode;
}

// Default sets for comparison when building share URLs
const DEFAULT_PLANETS = DEFAULT_VISIBLE_PLANETS;
const DEFAULT_ASPECTS = new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare']);

// Breakpoint for mobile detection
const MOBILE_BREAKPOINT = 768;

// Minimum safe size for the biwheel (needed for all the nested rings)
const MIN_SAFE_SIZE = 500;

// Touch gesture constants
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_SENSITIVITY = 0.01;

export const BiWheelMobileWrapper: React.FC<BiWheelMobileWrapperProps> = ({
  minSize = MIN_SAFE_SIZE,
  maxSize = 1200,
  forceMobile,
  onVisiblePlanetsChange,
  onVisibleAspectsChange,
  shareBirthData,
  chartNotesKey,
  initialEnabledAsteroidGroups,
  readOnly,
  externalState,
  onStateChange,
  onCursorMove,
  stateRef,
  remoteCursor,
  ...biWheelProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [containerWidth, setContainerWidth] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [shareNotes, setShareNotes] = useState(true);
  const [togglePanelCollapsed, setTogglePanelCollapsed] = useState(false);

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);
  const [isMousePanning, setIsMousePanning] = useState(false);
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);

  // Load saved defaults from localStorage (same key as BiWheelSynastry)
  const savedDefaults = useMemo(() => {
    try {
      const raw = localStorage.getItem('biwheel-chart-defaults');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  // BiWheel control state (lifted up for drawer access)
  const [visiblePlanets, setVisiblePlanets] = useState<Set<string>>(
    biWheelProps.initialVisiblePlanets
      || (savedDefaults?.visiblePlanets ? new Set(savedDefaults.visiblePlanets) : new Set(DEFAULT_PLANETS))
  );
  const [visibleAspects, setVisibleAspects] = useState<Set<string>>(
    biWheelProps.initialVisibleAspects
      || (savedDefaults?.visibleAspects ? new Set(savedDefaults.visibleAspects) : new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare']))
  );
  const [showHouses, setShowHouses] = useState(biWheelProps.initialShowHouses ?? savedDefaults?.showHouses ?? true);
  const [showDegreeMarkers, setShowDegreeMarkers] = useState(biWheelProps.initialShowDegreeMarkers ?? savedDefaults?.showDegreeMarkers ?? true);
  const [enabledAsteroidGroups, setEnabledAsteroidGroups] = useState<Set<AsteroidGroup>>(
    initialEnabledAsteroidGroups
      || (savedDefaults?.enabledAsteroidGroups ? new Set(savedDefaults.enabledAsteroidGroups) : new Set())
  );
  const [chartMode, setChartMode] = useState<ChartMode>(biWheelProps.initialChartMode || 'synastry');

  // Today's date string (used for transit and progressed defaults)
  const now2 = new Date();
  const todayStr = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-${String(now2.getDate()).padStart(2, '0')}`;

  // Transit state (lifted for mobile drawer access)
  const [showTransits, setShowTransits] = useState(false);
  const [transitDate, setTransitDate] = useState(todayStr);
  const [transitTime, setTransitTime] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  });
  const [transitLoading, setTransitLoading] = useState(false);

  // Progressed state (lifted for mobile drawer access)
  const [progressedPerson, setProgressedPerson] = useState<'A' | 'B' | 'both' | null>(null);
  const [progressedDate, setProgressedDate] = useState(todayStr);
  const [progressedLoading, setProgressedLoading] = useState(false);
  const [showSolarArc, setShowSolarArc] = useState(false);

  // Relocated state (lifted for mobile drawer access) — per-person locations
  const [relocatedPerson, setRelocatedPerson] = useState<'A' | 'B' | 'both' | null>(null);
  const [relocatedLoading, setRelocatedLoading] = useState(false);
  const [relocatedLocationA, setRelocatedLocationA] = useState<LocationData | null>(null);
  const [relocatedLocationB, setRelocatedLocationB] = useState<LocationData | null>(null);
  const [locationPickerTarget, setLocationPickerTarget] = useState<'A' | 'B' | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  // Birth time shift state (lifted for mobile drawer access)
  const [showBirthTimeShift, setShowBirthTimeShift] = useState(false);
  const [timeShiftA, setTimeShiftA] = useState(0);
  const [timeShiftB, setTimeShiftB] = useState(0);
  const [birthTimeShiftLoading, setBirthTimeShiftLoading] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Aspect line display options (lifted for mobile drawer access)
  const [straightAspects, setStraightAspects] = useState(savedDefaults?.straightAspects ?? true);
  const [mobileShowEffects, setMobileShowEffects] = useState(savedDefaults?.showEffects ?? true);

  // Display toggles (lifted for session sync)
  const [showRetrogrades, setShowRetrogrades] = useState(savedDefaults?.showRetrogrades ?? true);
  const [showDecans, setShowDecans] = useState(savedDefaults?.showDecans ?? false);

  // Wheel rotation state (lifted for session broadcast)
  const [rotateToAscendant, setRotateToAscendant] = useState(savedDefaults?.rotateToAscendant ?? true);
  const [zodiacVantage, setZodiacVantage] = useState<number | null>(null);

  // Preset state
  const [presets, setPresets] = useState<ChartPreset[]>(() => loadPresets());
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetsExpanded, setPresetsExpanded] = useState(false);

  // Drag-to-reorder presets
  const [dragPresetId, setDragPresetId] = useState<string | null>(null);
  const [dragOverPresetId, setDragOverPresetId] = useState<string | null>(null);
  const dragLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  // Auth & subscription (for location picker gating)
  const { user } = useAuth();

  // Load presets from profile for logged-in users
  useEffect(() => {
    if (!user?.id) return;
    loadPresetsFromProfile(user.id).then(profilePresets => {
      // Only overwrite if profile returned presets — don't flash-empty on tab switch
      if (profilePresets.length > 0) {
        setPresets(profilePresets);
      }
    });
  }, [user?.id]);
  const { isPaid } = useSubscription();

  // Theme state (lifted for mobile drawer access)
  const [chartTheme, setChartTheme] = useState<string>(() => {
    const theme = biWheelProps.initialTheme || 'classic';
    applyTheme(theme as ThemeName); // Sync global COLORS immediately
    return theme;
  });

  // Sync theme when parent prop changes (e.g. after DB load resolves)
  useEffect(() => {
    if (biWheelProps.initialTheme && biWheelProps.initialTheme !== chartTheme) {
      setChartTheme(biWheelProps.initialTheme);
      applyTheme(biWheelProps.initialTheme as ThemeName);
    }
  }, [biWheelProps.initialTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply external state overrides (for guest live view + replay)
  useEffect(() => {
    if (!externalState) return;
    console.log('[BiWheelWrapper] Applying externalState:', {
      chartMode: externalState.chartMode,
      planets: externalState.visiblePlanets?.length,
      asteroids: externalState.enabledAsteroidGroups?.length,
      showTransits: externalState.showTransits,
      showProgressed: externalState.showProgressed,
      relocatedPerson: externalState.relocatedPerson,
    });
    if (externalState.chartMode !== undefined) setChartMode(externalState.chartMode as ChartMode);
    if (externalState.visiblePlanets) setVisiblePlanets(new Set(externalState.visiblePlanets));
    if (externalState.visibleAspects) setVisibleAspects(new Set(externalState.visibleAspects));
    if (externalState.showHouses !== undefined) setShowHouses(externalState.showHouses);
    if (externalState.showDegreeMarkers !== undefined) setShowDegreeMarkers(externalState.showDegreeMarkers);
    if (externalState.showTransits !== undefined) setShowTransits(externalState.showTransits);
    if (externalState.transitDate !== undefined) setTransitDate(externalState.transitDate);
    if (externalState.transitTime !== undefined) setTransitTime(externalState.transitTime);
    if (externalState.showProgressed !== undefined && !externalState.showProgressed) setProgressedPerson(null);
    if (externalState.progressedPerson !== undefined) setProgressedPerson(externalState.progressedPerson as any);
    if (externalState.progressedDate !== undefined) setProgressedDate(externalState.progressedDate);
    if (externalState.showSolarArc !== undefined) setShowSolarArc(externalState.showSolarArc);
    if (externalState.showRelocated !== undefined && !externalState.showRelocated) setRelocatedPerson(null);
    if (externalState.relocatedPerson !== undefined) setRelocatedPerson(externalState.relocatedPerson as any);
    if (externalState.relocatedLocationA !== undefined) setRelocatedLocationA(externalState.relocatedLocationA);
    if (externalState.relocatedLocationB !== undefined) setRelocatedLocationB(externalState.relocatedLocationB);
    if (externalState.enabledAsteroidGroups) setEnabledAsteroidGroups(new Set(externalState.enabledAsteroidGroups as AsteroidGroup[]));
    if (externalState.chartTheme !== undefined) { setChartTheme(externalState.chartTheme); applyTheme(externalState.chartTheme as ThemeName); }
    if (externalState.rotateToAscendant !== undefined) setRotateToAscendant(externalState.rotateToAscendant);
    if (externalState.zodiacVantage !== undefined) setZodiacVantage(externalState.zodiacVantage);
    if (externalState.straightAspects !== undefined) setStraightAspects(externalState.straightAspects);
    if (externalState.showEffects !== undefined) setMobileShowEffects(externalState.showEffects);
    if (externalState.showRetrogrades !== undefined) setShowRetrogrades(externalState.showRetrogrades);
    if (externalState.showDecans !== undefined) setShowDecans(externalState.showDecans);
    if (externalState.showBirthTimeShift !== undefined) setShowBirthTimeShift(externalState.showBirthTimeShift);
    if (externalState.scale !== undefined) setScale(externalState.scale);
    if (externalState.translateX !== undefined && externalState.translateY !== undefined) setTranslate({ x: externalState.translateX, y: externalState.translateY });
  }, [externalState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync visibility changes up to parent (for galactic mode linking)
  useEffect(() => {
    onVisiblePlanetsChange?.(visiblePlanets);
  }, [visiblePlanets, onVisiblePlanetsChange]);

  useEffect(() => {
    onVisibleAspectsChange?.(visibleAspects);
  }, [visibleAspects, onVisibleAspectsChange]);

  // Detect mobile (needed early for broadcast path selection)
  const isMobile = useMemo(() => {
    if (forceMobile !== undefined) return forceMobile;
    return containerWidth > 0 && containerWidth < MOBILE_BREAKPOINT;
  }, [containerWidth, forceMobile]);

  // ── Broadcast chart state changes ──
  // Two paths: (1) BiWheelSynastry internal changes → handleInternalStateChange → stateRef
  //            (2) Lifted state changes (mobile drawer, external state) → direct broadcast effect below
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  // handleInternalStateChange: receives state from BiWheelSynastry (desktop panel changes),
  // broadcasts + updates stateRef. On desktop the TogglePanel lives inside BiWheelSynastry
  // so changes don't update lifted state — this is the only broadcast path for those.
  // On mobile, the lifted-state effect already broadcasts, so skip here to avoid duplicates.
  const handleInternalStateChange = useCallback((synastryState: Record<string, any>) => {
    const fullState = { ...synastryState, scale, translateX: translate.x, translateY: translate.y };
    if (onStateChangeRef.current && !externalState && !isMobile) {
      console.log('[BiWheelWrapper] Broadcasting via handleInternalStateChange (desktop path)');
      onStateChangeRef.current('state_snapshot' as any, fullState);
    }
    if (stateRef) stateRef.current = fullState;
  }, [scale, translate.x, translate.y, externalState, stateRef, isMobile]);

  // Direct broadcast of ALL lifted state — fires on every state change from drawer or external
  // state sync. On mobile this is the ONLY broadcast path. On desktop it fires alongside
  // handleInternalStateChange but with the same data. Skips guest mode (externalState defined).
  useEffect(() => {
    if (!onStateChangeRef.current || externalState) return;
    const snapshot: Record<string, any> = {
      chartMode,
      visiblePlanets: Array.from(visiblePlanets),
      visibleAspects: Array.from(visibleAspects),
      showHouses,
      showDegreeMarkers,
      showTransits,
      transitDate,
      transitTime,
      showProgressed: !!progressedPerson,
      progressedPerson,
      progressedDate,
      showSolarArc,
      showRelocated: !!relocatedPerson,
      relocatedPerson,
      relocatedLocationA,
      relocatedLocationB,
      enabledAsteroidGroups: Array.from(enabledAsteroidGroups),
      chartTheme,
      rotateToAscendant,
      zodiacVantage,
      straightAspects,
      showEffects: mobileShowEffects,
      showRetrogrades,
      showDecans,
      showBirthTimeShift,
      timeShiftA,
      timeShiftB,
      scale,
      translateX: translate.x,
      translateY: translate.y,
    };
    console.log('[BiWheelWrapper] Broadcasting via lifted-state effect', { chartMode, planets: visiblePlanets.size, asteroids: enabledAsteroidGroups.size });
    onStateChangeRef.current('state_snapshot' as any, snapshot);
    if (stateRef) stateRef.current = snapshot;
  }, [chartMode, visiblePlanets, visibleAspects, showHouses, showDegreeMarkers, showTransits, transitDate, transitTime, progressedPerson, progressedDate, showSolarArc, relocatedPerson, relocatedLocationA, relocatedLocationB, enabledAsteroidGroups, chartTheme, rotateToAscendant, zodiacVantage, straightAspects, mobileShowEffects, showRetrogrades, showDecans, showBirthTimeShift, timeShiftA, timeShiftB, scale, translate.x, translate.y, externalState, stateRef]);

  // Calculate responsive chart size
  const chartSize = useMemo(() => {
    // Enforce minimum safe size for proper rendering
    const effectiveMinSize = Math.max(minSize, MIN_SAFE_SIZE);

    if (containerWidth === 0) return effectiveMinSize;

    // Width-based sizing
    if (isMobile) {
      // On mobile, fit to container width - the SVG viewBox handles scaling
      // Allow going below MIN_SAFE_SIZE on mobile since viewBox preserves proportions
      return Math.max(containerWidth - 8, 320);
    }

    // On desktop, use container width (BiWheelSynastry handles panel width internally)
    // Subtract panel width (200px) from available space since BiWheelSynastry will add it back
    const availableWidth = containerWidth - 200;
    return Math.max(Math.min(availableWidth, maxSize), effectiveMinSize);
  }, [containerWidth, minSize, maxSize, isMobile]);

  // Measure container width using ResizeObserver for better responsiveness
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.offsetWidth);
    };

    // Initial measurement
    updateWidth();

    // Use ResizeObserver for container size changes (tabs, sidebars, etc.)
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    // Also listen for window resize as fallback
    window.addEventListener('resize', updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, MIN_ZOOM));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Touch handlers for pinch-to-zoom and pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistanceRef.current = Math.hypot(dx, dy);
      lastPinchCenterRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan start (only when zoomed in)
      setIsPanning(true);
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
      // Pinch zoom
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);

      const delta = distance - lastPinchDistanceRef.current;
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale + delta * ZOOM_SENSITIVITY));

      setScale(newScale);
      lastPinchDistanceRef.current = distance;
    } else if (e.touches.length === 1 && isPanning && lastTouchRef.current) {
      // Pan
      e.preventDefault();
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;

      setTranslate(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [scale, isPanning]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistanceRef.current = null;
    lastPinchCenterRef.current = null;
    lastTouchRef.current = null;
    setIsPanning(false);
  }, []);

  // Keyboard zoom (+/-/0) and transit toggle (T)
  useEffect(() => {
    function isInputFocused(): boolean {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if ((el as HTMLElement).isContentEditable) return true;
      return false;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isInputFocused()) return;
      if (e.key === '+' || e.key === '=') { handleZoomIn(); return; }
      if (e.key === '-') { handleZoomOut(); return; }
      if (e.key === '0') { handleResetZoom(); return; }
      if (e.key === 't' || e.key === 'T') { setShowTransits(v => !v); return; }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  // Mouse wheel zoom for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setScale(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
    }
  }, []);

  // Mouse drag-to-pan when zoomed in
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsMousePanning(true);
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMousePanning || !lastMouseRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, [isMousePanning]);

  const handleMouseUp = useCallback(() => {
    setIsMousePanning(false);
    lastMouseRef.current = null;
  }, []);

  // Also handle mouse leaving the container while panning
  const handleMouseLeave = useCallback(() => {
    if (isMousePanning) {
      setIsMousePanning(false);
      lastMouseRef.current = null;
    }
  }, [isMousePanning]);

  // Export handlers
  const handleExportPNG = useCallback(async () => {
    if (!chartContainerRef.current) return;
    setExporting(true);
    setShowExportMenu(false);
    try {
      const name = biWheelProps.nameA || 'chart';
      const { exportChartAsPNG } = await getChartExport();
      await exportChartAsPNG(chartContainerRef.current, `${name}-chart.png`);
      analytics.trackChartExported({ format: 'png' });
      toast.success('Chart exported as PNG');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [biWheelProps.nameA]);

  const handleExportPDF = useCallback(async () => {
    if (!chartContainerRef.current) return;
    setExporting(true);
    setShowExportMenu(false);
    try {
      const nameA = biWheelProps.nameA || 'Person A';
      const nameB = biWheelProps.nameB;
      const title = nameB && nameB !== nameA ? `${nameA} & ${nameB}` : nameA;
      const { exportChartAsPDF } = await getChartExport();
      await exportChartAsPDF(chartContainerRef.current, `${nameA}-chart.pdf`, title);
      analytics.trackChartExported({ format: 'pdf' });
      toast.success('Chart exported as PDF');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [biWheelProps.nameA, biWheelProps.nameB]);

  // Build a shareable URL with birth data + current chart options (only non-defaults)
  const buildShareUrl = useCallback(() => {
    if (!shareBirthData) return null;
    const params = new URLSearchParams({
      name: shareBirthData.name,
      date: shareBirthData.date,
      time: shareBirthData.time,
      lat: String(shareBirthData.lat),
      lng: String(shareBirthData.lng),
      loc: shareBirthData.location,
    });

    // Theme (only if not default)
    if (chartTheme && chartTheme !== 'classic') {
      params.set('theme', chartTheme);
    }

    // Chart mode (only if not synastry)
    if (chartMode && chartMode !== 'synastry') {
      params.set('mode', chartMode);
    }

    // Visible planets (only if different from defaults)
    const setsEqual = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every(v => b.has(v));
    if (!setsEqual(visiblePlanets, DEFAULT_PLANETS)) {
      params.set('planets', Array.from(visiblePlanets).sort().join(','));
    }

    // Visible aspects (only if different from defaults)
    if (!setsEqual(visibleAspects, DEFAULT_ASPECTS)) {
      params.set('aspects', Array.from(visibleAspects).sort().join(','));
    }

    // Show houses (only if false — default is true)
    if (!showHouses) {
      params.set('houses', '0');
    }

    // Show degree markers (only if false — default is true)
    if (!showDegreeMarkers) {
      params.set('degrees', '0');
    }

    // Enabled asteroid groups (only if non-empty)
    if (enabledAsteroidGroups.size > 0) {
      params.set('asteroids', Array.from(enabledAsteroidGroups).sort().join(','));
    }

    return `${window.location.origin}/chart?${params.toString()}`;
  }, [shareBirthData, chartTheme, chartMode, visiblePlanets, visibleAspects, showHouses, showDegreeMarkers, enabledAsteroidGroups]);

  const handleCopyLink = useCallback(() => {
    const url = buildShareUrl();
    if (!url) {
      toast.error('No birth data available for link');
      return;
    }
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    analytics.trackChartShared({ method: 'link' });
    toast.success('Chart link copied');
    setTimeout(() => setLinkCopied(false), 2000);
    setShowShareMenu(false);
  }, [buildShareUrl]);

  const handleEmailShare = useCallback(async () => {
    if (!chartContainerRef.current || !emailTo.trim()) return;
    setSendingEmail(true);
    try {
      const nameA = biWheelProps.nameA || 'Person A';
      const nameB = biWheelProps.nameB;
      const title = nameB && nameB !== nameA ? `${nameA} & ${nameB}` : nameA;

      // Read notes from localStorage if sharing is enabled
      let notes: string[] | undefined;
      if (shareNotes && chartNotesKey) {
        try {
          const raw = localStorage.getItem('astrologer_chart_notes');
          if (raw) {
            const allNotes = JSON.parse(raw);
            const chartNotes = allNotes[chartNotesKey];
            if (Array.isArray(chartNotes) && chartNotes.length > 0) {
              notes = chartNotes.map((n: { text: string }) => n.text);
            }
          }
        } catch { /* ignore parse errors */ }
      }

      // Build shareable chart URL with current chart options
      const chartUrl = buildShareUrl() || undefined;

      const { emailChart } = await getChartExport();
      await emailChart({
        container: chartContainerRef.current,
        to: emailTo.trim(),
        title,
        message: emailMessage.trim() || undefined,
        chartDetails: nameB && nameB !== nameA ? 'Synastry Chart' : 'Natal Chart',
        notes,
        chartUrl,
      });
      analytics.trackChartShared({ method: 'email' });
      toast.success(`Chart sent to ${emailTo}`);
      setShowEmailModal(false);
      setEmailTo('');
      setEmailMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  }, [chartContainerRef, emailTo, emailMessage, biWheelProps.nameA, biWheelProps.nameB, shareNotes, chartNotesKey, buildShareUrl]);

  // Toggle handlers for the drawer
  const togglePlanet = useCallback((planet: string) => {
    setVisiblePlanets(prev => {
      const next = new Set(prev);
      if (next.has(planet)) {
        next.delete(planet);
      } else {
        next.add(planet);
      }
      return next;
    });
  }, []);

  const toggleAspect = useCallback((aspect: string) => {
    setVisibleAspects(prev => {
      const next = new Set(prev);
      if (next.has(aspect)) {
        next.delete(aspect);
      } else {
        next.add(aspect);
      }
      return next;
    });
  }, []);

  const toggleAsteroidGroup = useCallback((group: AsteroidGroup) => {
    setEnabledAsteroidGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
        // Remove group's planets from visible
        const groupPlanets = ASTEROID_GROUPS[group] || [];
        setVisiblePlanets(vp => {
          const nextVp = new Set(vp);
          groupPlanets.forEach(p => nextVp.delete(p));
          return nextVp;
        });
      } else {
        next.add(group);
        // Add group's planets to visible
        const groupPlanets = ASTEROID_GROUPS[group] || [];
        setVisiblePlanets(vp => {
          const nextVp = new Set(vp);
          groupPlanets.forEach(p => nextVp.add(p));
          return nextVp;
        });
      }
      return next;
    });
  }, []);

  const enableAllAsteroids = useCallback(() => {
    const allGroups = Object.keys(ASTEROID_GROUPS) as AsteroidGroup[];
    setEnabledAsteroidGroups(new Set(allGroups));
    setVisiblePlanets(prev => {
      const next = new Set(prev);
      for (const group of allGroups) {
        (ASTEROID_GROUPS[group] || []).forEach(p => next.add(p));
      }
      return next;
    });
  }, []);

  const disableAllAsteroids = useCallback(() => {
    setEnabledAsteroidGroups(new Set());
    setVisiblePlanets(prev => {
      const next = new Set(prev);
      for (const group of Object.keys(ASTEROID_GROUPS) as AsteroidGroup[]) {
        (ASTEROID_GROUPS[group] || []).forEach(p => next.delete(p));
      }
      return next;
    });
  }, []);

  // Preset handlers
  const handleSavePreset = useCallback((name: string) => {
    const payload = buildPresetFromState({
      name,
      visiblePlanets,
      visibleAspects,
      showHouses,
      showDegreeMarkers,
      showRetrogrades,
      showDecans,
      straightAspects,
      showEffects: mobileShowEffects,
      chartTheme,
      rotateToAscendant,
      zodiacVantage,
      enabledAsteroidGroups,
    });
    const created = savePreset(payload);
    if (created) {
      const updated = loadPresets();
      setPresets(updated);
      setActivePresetId(created.id);
      setShowSavePreset(false);
      setPresetName('');
      toast.success(`Preset "${name}" saved`);
      // Sync to profile
      if (user?.id) savePresetsToProfile(user.id, updated);
    } else {
      toast.error('Max 10 presets reached. Delete one first.');
    }
  }, [visiblePlanets, visibleAspects, showHouses, showDegreeMarkers, showRetrogrades, showDecans, straightAspects, mobileShowEffects, chartTheme, rotateToAscendant, zodiacVantage, enabledAsteroidGroups, user?.id]);

  const isLoadingPresetRef = useRef(false);

  const handleLoadPreset = useCallback((preset: ChartPreset) => {
    isLoadingPresetRef.current = true;
    setVisiblePlanets(new Set(preset.visiblePlanets));
    setVisibleAspects(new Set(preset.visibleAspects));
    setShowHouses(preset.showHouses);
    setShowDegreeMarkers(preset.showDegreeMarkers);
    setShowRetrogrades(preset.showRetrogrades);
    setShowDecans(preset.showDecans);
    setStraightAspects(preset.straightAspects);
    setMobileShowEffects(preset.showEffects);
    setChartTheme(preset.chartTheme);
    applyTheme(preset.chartTheme as ThemeName);
    biWheelProps.onThemeChange?.(preset.chartTheme);
    setRotateToAscendant(preset.rotateToAscendant);
    setZodiacVantage(preset.zodiacVantage);
    setEnabledAsteroidGroups(new Set(preset.enabledAsteroidGroups as AsteroidGroup[]));
    setActivePresetId(preset.id);
    // Allow the effect to skip this batch
    requestAnimationFrame(() => { isLoadingPresetRef.current = false; });
  }, [biWheelProps]);

  const handleResetToDefaults = useCallback(() => {
    isLoadingPresetRef.current = true;
    setVisiblePlanets(new Set(DEFAULT_PLANETS));
    setVisibleAspects(new Set(DEFAULT_ASPECTS));
    setShowHouses(true);
    setShowDegreeMarkers(true);
    setShowRetrogrades(true);
    setShowDecans(false);
    setStraightAspects(true);
    setMobileShowEffects(true);
    setChartTheme('classic');
    applyTheme('classic');
    biWheelProps.onThemeChange?.('classic');
    setRotateToAscendant(true);
    setZodiacVantage(null);
    setEnabledAsteroidGroups(new Set());
    setActivePresetId('__default__');
    requestAnimationFrame(() => { isLoadingPresetRef.current = false; });
  }, [biWheelProps]);

  const handleDeletePreset = useCallback((id: string) => {
    deletePreset(id);
    const updated = loadPresets();
    setPresets(updated);
    if (activePresetId === id) setActivePresetId(null);
    // Sync to profile
    if (user?.id) savePresetsToProfile(user.id, updated);
  }, [activePresetId, user?.id]);

  const handlePresetDragEnd = useCallback(() => {
    if (dragPresetId && dragOverPresetId && dragPresetId !== dragOverPresetId) {
      // Reorder: move dragPresetId to the position of dragOverPresetId
      const ids = presets.map(p => p.id);
      const fromIdx = ids.indexOf(dragPresetId);
      const toIdx = ids.indexOf(dragOverPresetId);
      if (fromIdx !== -1 && toIdx !== -1) {
        ids.splice(fromIdx, 1);
        ids.splice(toIdx, 0, dragPresetId);
        const updated = reorderPresets(ids);
        setPresets(updated);
        if (user?.id) savePresetsToProfile(user.id, updated);
      }
    }
    setDragPresetId(null);
    setDragOverPresetId(null);
  }, [dragPresetId, dragOverPresetId, presets, user?.id]);

  // Live preview of reordered presets while dragging
  const previewPresets = useMemo(() => {
    if (!dragPresetId || !dragOverPresetId || dragPresetId === dragOverPresetId) return presets;
    const ids = presets.map(p => p.id);
    const fromIdx = ids.indexOf(dragPresetId);
    const toIdx = ids.indexOf(dragOverPresetId);
    if (fromIdx === -1 || toIdx === -1) return presets;
    const next = [...presets];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    return next;
  }, [presets, dragPresetId, dragOverPresetId]);

  // Clear active preset when user manually changes any setting
  useEffect(() => {
    if (isLoadingPresetRef.current) return;
    if (activePresetId) setActivePresetId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePlanets, visibleAspects, showHouses, showDegreeMarkers, showRetrogrades, showDecans, straightAspects, mobileShowEffects, chartTheme, rotateToAscendant, zodiacVantage, enabledAsteroidGroups]);

  // Mutual exclusivity: progressed ↔ relocated
  const handleSetProgressedPerson = useCallback((person: 'A' | 'B' | 'both' | null) => {
    setProgressedPerson(person);
    if (person) {
      // Clear relocated when enabling progressed (locations persist)
      setRelocatedPerson(null);
    }
  }, []);

  const handleSetRelocatedPerson = useCallback((person: 'A' | 'B' | 'both' | null) => {
    setRelocatedPerson(person);
    if (person) {
      // Clear progressed when enabling relocated
      setProgressedPerson(null);
      setShowSolarArc(false);
      // Determine which person we just activated that needs a location
      // For 'both': check A first, then B
      const needsPickerForPerson = (() => {
        if (person === 'A' && !relocatedLocationA) return 'A';
        if (person === 'B' && !relocatedLocationB) return 'B';
        if (person === 'both') {
          if (!relocatedLocationA) return 'A';
          if (!relocatedLocationB) return 'B';
        }
        return null;
      })();

      if (needsPickerForPerson) {
        if (!user) { setShowAuthModal(true); return; }
        if (!isPaid) { setShowUpgradeModal(true); return; }
        setLocationPickerTarget(needsPickerForPerson as 'A' | 'B');
        setDrawerOpen(false);
        setTimeout(() => setShowLocationPicker(true), 300);
      }
    }
    // When toggling OFF (person === null): do NOT clear locations (persistence!)
  }, [relocatedLocationA, relocatedLocationB, user, isPaid]);

  // Location picker handlers
  const handleOpenLocationPicker = useCallback((person?: 'A' | 'B') => {
    if (!user) { setShowAuthModal(true); return; }
    if (!isPaid) { setShowUpgradeModal(true); return; }
    setLocationPickerTarget(person || 'A');
    setDrawerOpen(false); // Close options drawer first
    setShowLocationPicker(true);
  }, [user, isPaid]);

  const handleLocationConfirm = useCallback((location: LocationData) => {
    if (locationPickerTarget === 'B') {
      setRelocatedLocationB(location);
    } else {
      setRelocatedLocationA(location);
    }
    setShowLocationPicker(false);
  }, [locationPickerTarget]);

  // Generate a key that changes when control state changes
  // This forces BiWheelSynastry to re-mount with new initial values
  const chartKey = useMemo(() => {
    const locKeyA = relocatedLocationA ? `${relocatedLocationA.lat},${relocatedLocationA.lng}` : 'none';
    const locKeyB = relocatedLocationB ? `${relocatedLocationB.lat},${relocatedLocationB.lng}` : 'none';
    return `${chartMode}-${Array.from(visiblePlanets).sort().join(',')}-${Array.from(visibleAspects).sort().join(',')}-${showHouses}-${showDegreeMarkers}-${Array.from(enabledAsteroidGroups).sort().join(',')}-${showTransits}-${transitDate}-${transitTime}-${progressedPerson}-${progressedDate}-${showSolarArc}-${relocatedPerson}-${locKeyA}-${locKeyB}-${chartTheme}-${straightAspects}-${mobileShowEffects}-${showRetrogrades}-${showDecans}`;
  }, [chartMode, visiblePlanets, visibleAspects, showHouses, showDegreeMarkers, enabledAsteroidGroups, showTransits, transitDate, transitTime, progressedPerson, progressedDate, showSolarArc, relocatedPerson, relocatedLocationA, relocatedLocationB, chartTheme, straightAspects, mobileShowEffects, showRetrogrades, showDecans]);

  return (
    <div ref={containerRef} className="w-full">
      <div>
        {/* Control bar — hidden in readOnly mode (guest live view + replay) */}
        {readOnly ? null : <>
        <div className="flex items-center justify-between w-full mb-1 md:mb-2 px-1 md:px-2">
          <div />
          <div className="flex items-center gap-1 md:gap-2">
            {/* Settings button — mobile opens drawer, desktop toggles sidebar panel */}
            <button
              onClick={() => {
                if (isMobile) {
                  setDrawerOpen(true);
                } else {
                  setTogglePanelCollapsed(prev => !prev);
                }
              }}
              className="flex items-center gap-1 px-2 py-1.5 md:px-2.5 md:py-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
              title="Chart options"
            >
              <Settings2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-[10px] md:text-xs">Options</span>
            </button>

            {/* Share button */}
            <div className="relative">
              <button
                onClick={() => { setShowShareMenu(v => !v); setShowExportMenu(false); }}
                className="flex items-center gap-1 px-2 py-1.5 md:px-2.5 md:py-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
                title="Share chart"
              >
                <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs">Share</span>
              </button>
              {showShareMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-card border rounded-lg shadow-lg overflow-hidden min-w-[150px]">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors"
                    >
                      {linkCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link2 className="w-3.5 h-3.5" />}
                      Copy Link
                    </button>
                    <button
                      onClick={() => { setShowShareMenu(false); setShowEmailModal(true); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Send via Email
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Download button */}
            <div className="relative">
              <button
                onClick={() => { setShowExportMenu(v => !v); setShowShareMenu(false); }}
                disabled={exporting}
                className="flex items-center gap-1 px-2 py-1.5 md:px-2.5 md:py-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
                title="Download chart"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs">Download</span>
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-card border rounded-lg shadow-lg overflow-hidden min-w-[140px]">
                    <button
                      onClick={handleExportPNG}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors"
                    >
                      <Image className="w-3.5 h-3.5" />
                      Save as PNG
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Save as PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </>}

        {/* Chart container */}
        <div
          ref={chartContainerRef}
          className="rounded-xl border border-border relative"
          style={{
            maxWidth: '100%',
            touchAction: isMobile ? 'manipulation' : (scale > 1 ? 'none' : 'auto'),
            cursor: !isMobile && scale > 1 ? (isMousePanning ? 'grabbing' : 'grab') : 'default',
          }}
          {...(!isMobile && !readOnly ? {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onWheel: handleWheel,
            onMouseDown: handleMouseDown,
            onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
              handleMouseMove(e);
              if (onCursorMove) {
                const rect = e.currentTarget.getBoundingClientRect();
                onCursorMove(
                  (e.clientX - rect.left) / rect.width,
                  (e.clientY - rect.top) / rect.height,
                );
              }
            },
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseLeave,
          } : {})}
        >
          {(() => {
            // Shared props for BiWheelSynastry — single source of truth for both mobile/desktop.
            // All lifted state is passed as initial* props so remounts (key change) pick up the latest.
            const sharedSynastryProps = {
              ...biWheelProps,
              size: chartSize,
              // All lifted chart state → initial* props
              initialVisiblePlanets: visiblePlanets,
              initialVisibleAspects: visibleAspects as Set<any>,
              initialShowHouses: showHouses,
              initialShowDegreeMarkers: showDegreeMarkers,
              initialStraightAspects: straightAspects,
              initialShowEffects: mobileShowEffects,
              initialChartMode: chartMode,
              initialShowTransits: showTransits,
              initialTransitDate: transitDate,
              initialTransitTime: transitTime,
              initialProgressedPerson: progressedPerson,
              initialProgressedDate: progressedDate,
              initialShowSolarArc: showSolarArc,
              initialRelocatedPerson: relocatedPerson,
              initialTheme: chartTheme,
              initialEnabledAsteroidGroups: enabledAsteroidGroups,
              initialShowRetrogrades: showRetrogrades,
              initialShowDecans: showDecans,
              initialRotateToAscendant: rotateToAscendant,
              initialZodiacVantage: zodiacVantage,
              // External relocated control
              externalRelocatedLocationA: relocatedLocationA,
              externalRelocatedLocationB: relocatedLocationB,
              externalRelocatedPerson: relocatedPerson,
              // Change callbacks
              onChartModeChange: (mode: ChartMode) => { setChartMode(mode); biWheelProps.onChartModeChange?.(mode); },
              onRotateToAscendantChange: setRotateToAscendant,
              onZodiacVantageChange: setZodiacVantage,
              onShowTransitsChange: setShowTransits,
              onTransitDateChange: setTransitDate,
              onTransitTimeChange: setTransitTime,
              onTransitLoadingChange: setTransitLoading,
              onProgressedPersonChange: handleSetProgressedPerson,
              onProgressedDateChange: setProgressedDate,
              onShowSolarArcChange: setShowSolarArc,
              onRelocatedPersonChange: handleSetRelocatedPerson,
              onProgressedLoadingChange: setProgressedLoading,
              onRelocatedLoadingChange: setRelocatedLoading,
              onThemeChange: (theme: string) => { setChartTheme(theme); biWheelProps.onThemeChange?.(theme); },
              onInternalStateChange: handleInternalStateChange,
              // Birth time shift
              initialShowBirthTimeShift: showBirthTimeShift,
              onShowBirthTimeShiftChange: setShowBirthTimeShift,
              initialTimeShiftA: timeShiftA,
              initialTimeShiftB: timeShiftB,
              onTimeShiftAChange: (offset: number) => { setTimeShiftA(offset); biWheelProps.onTimeShiftAChange?.(offset); },
              onTimeShiftBChange: (offset: number) => { setTimeShiftB(offset); biWheelProps.onTimeShiftBChange?.(offset); },
              // Controlled toggle panel collapsed state (desktop)
              togglePanelCollapsed,
              onTogglePanelCollapsedChange: setTogglePanelCollapsed,
            };

            return isMobile ? (
              /* Mobile: no custom zoom transform — native pinch-to-zoom works on the SVG */
              <>
                <BiWheelSynastry
                  key={chartKey}
                  {...sharedSynastryProps}
                  showTogglePanel={false}
                  hideZoomControls
                />
                {/* Knob bar — mobile: transit + natal shift knobs in a centered row below chart */}
                {(showTransits || (showBirthTimeShift && biWheelProps.enableBirthTimeShift && chartMode !== 'composite')) && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 16, padding: '8px 0 4px' }}>
                    {/* Transit jog wheel */}
                    {showTransits && (
                      <TransitJogWheel
                        transitDate={transitDate}
                        onTransitDateChange={setTransitDate}
                        transitTime={transitTime}
                        onTransitTimeChange={setTransitTime}
                        transitLoading={transitLoading}
                        size={80}
                      />
                    )}
                    {/* Birth time shift knob A */}
                    {showBirthTimeShift && biWheelProps.enableBirthTimeShift && chartMode !== 'composite' && (
                      <BirthTimeShiftKnob
                        label="A"
                        timeShiftMinutes={timeShiftA}
                        onTimeShiftChange={(offset) => { setTimeShiftA(offset); biWheelProps.onTimeShiftAChange?.(offset); }}
                        onReset={() => { setTimeShiftA(0); biWheelProps.onTimeShiftAChange?.(0); }}
                        size={80}
                      />
                    )}
                    {/* Birth time shift knob B */}
                    {showBirthTimeShift && biWheelProps.enableBirthTimeShift && chartMode !== 'composite' && biWheelProps.birthTimeB && (chartMode === 'synastry' || chartMode === 'personB') && (
                      <BirthTimeShiftKnob
                        label="B"
                        timeShiftMinutes={timeShiftB}
                        onTimeShiftChange={(offset) => { setTimeShiftB(offset); biWheelProps.onTimeShiftBChange?.(offset); }}
                        onReset={() => { setTimeShiftB(0); biWheelProps.onTimeShiftBChange?.(0); }}
                        size={80}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isPanning || isMousePanning ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                <BiWheelSynastry
                  {...sharedSynastryProps}
                  key={externalState ? chartKey : undefined}
                  showTogglePanel={!externalState}
                />
              </div>
            );
          })()}
          {/* Remote cursor — rendered inside chart container for correct positioning */}
          {remoteCursor}
        </div>

        {/* Preset bar — below chart, hidden in readOnly mode */}
        {!readOnly && (presets.length > 0 || showSavePreset) && (
          <div className={`flex items-center gap-1.5 w-full mt-1 px-1 md:px-2 pb-1 ${
            isMobile
              ? presetsExpanded ? 'flex-wrap' : 'flex-nowrap overflow-hidden'
              : 'overflow-x-auto scrollbar-hide'
          }`} style={isMobile && !presetsExpanded ? { maxHeight: 38 } : undefined}>
            <Bookmark className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {/* Default preset chip — always first */}
            <button
              onClick={handleResetToDefaults}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium transition-colors ${
                activePresetId === '__default__'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/70 text-foreground'
              }`}
              title="Reset all chart options to app defaults"
            >
              Default
            </button>
            {previewPresets.map(p => {
              const isDragging = dragPresetId === p.id;
              return (
                <div
                  key={p.id}
                  className="flex-shrink-0 relative group"
                  style={{
                    transition: dragPresetId ? 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease' : 'none',
                    transform: isDragging ? 'scale(1.1)' : 'scale(1)',
                    opacity: isDragging ? 0.5 : 1,
                    zIndex: isDragging ? 10 : 0,
                    filter: isDragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                  }}
                  draggable
                  onDragStart={(e) => { setDragPresetId(p.id); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverPresetId(p.id); }}
                  onDragEnter={() => setDragOverPresetId(p.id)}
                  onDragEnd={handlePresetDragEnd}
                  onTouchStart={(e) => {
                    dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    dragLongPressTimer.current = setTimeout(() => {
                      setDragPresetId(p.id);
                    }, 400);
                  }}
                  onTouchMove={(e) => {
                    if (dragLongPressTimer.current && dragStartPos.current) {
                      const dx = Math.abs(e.touches[0].clientX - dragStartPos.current.x);
                      const dy = Math.abs(e.touches[0].clientY - dragStartPos.current.y);
                      if (dx > 8 || dy > 8) { clearTimeout(dragLongPressTimer.current); dragLongPressTimer.current = null; }
                    }
                    if (dragPresetId) {
                      const touch = e.touches[0];
                      const el = document.elementFromPoint(touch.clientX, touch.clientY);
                      const presetEl = el?.closest('[data-preset-id]');
                      if (presetEl) setDragOverPresetId(presetEl.getAttribute('data-preset-id'));
                    }
                  }}
                  onTouchEnd={() => {
                    if (dragLongPressTimer.current) { clearTimeout(dragLongPressTimer.current); dragLongPressTimer.current = null; }
                    if (dragPresetId) handlePresetDragEnd();
                  }}
                  data-preset-id={p.id}
                >
                  <button
                    onClick={() => { if (!dragPresetId) handleLoadPreset(p); }}
                    className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium transition-colors ${
                      activePresetId === p.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/70 text-foreground'
                    }`}
                    title={`Load "${p.name}" — applies saved planets, aspects, theme, and display settings`}
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePreset(p.id); }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title={`Delete preset "${p.name}"`}
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              );
            })}
            {/* Expand/collapse toggle on mobile when presets overflow */}
            {isMobile && presets.length > 3 && (
              <button
                onClick={() => setPresetsExpanded(v => !v)}
                className="flex-shrink-0 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                title={presetsExpanded ? 'Collapse presets' : 'Show all presets'}
              >
                {presetsExpanded ? '▲' : `+${presets.length - 3}`}
              </button>
            )}
            {showSavePreset ? (
              <form
                className="flex items-center gap-1 flex-shrink-0"
                onSubmit={(e) => { e.preventDefault(); if (presetName.trim()) handleSavePreset(presetName.trim()); }}
              >
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name"
                  maxLength={20}
                  autoFocus
                  className="w-24 md:w-32 px-2 py-1 rounded-full text-[10px] md:text-xs border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => { if (e.key === 'Escape') { setShowSavePreset(false); setPresetName(''); } }}
                />
                <button
                  type="submit"
                  disabled={!presetName.trim()}
                  className="p-1 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                  title="Save this preset with the given name"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSavePreset(false); setPresetName(''); }}
                  className="p-1 rounded-full hover:bg-muted"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </form>
            ) : presets.length < 10 ? (
              <button
                onClick={() => setShowSavePreset(true)}
                className="flex-shrink-0 flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] md:text-xs text-muted-foreground hover:bg-muted transition-colors border border-dashed border-muted-foreground/30"
                title="Save your current chart options (planets, aspects, theme, display) as a reusable preset"
              >
                <Plus className="w-3 h-3" />
                Save Preset
              </button>
            ) : null}
          </div>
        )}
        {/* Save preset button (when no presets exist yet) */}
        {!readOnly && presets.length === 0 && !showSavePreset && (
          <div className="flex justify-start px-1 md:px-2 mt-1">
            <button
              onClick={() => setShowSavePreset(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-muted/70 transition-colors text-muted-foreground"
              title="Save your current chart options (planets, aspects, theme, display) as a reusable preset — quickly switch between different configurations"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="text-[10px] md:text-xs">Save Preset</span>
            </button>
          </div>
        )}

        {/* Mobile drawer for controls — disabled in readOnly mode */}
        <Drawer.Root open={!readOnly && drawerOpen} onOpenChange={readOnly ? undefined : setDrawerOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
            <Drawer.Content
              className="fixed bottom-0 left-0 right-0 rounded-t-xl z-50 max-h-[85vh] flex flex-col"
              style={{
                backgroundColor: THEMES[chartTheme as ThemeName]?.background || '#ffffff',
                color: THEMES[chartTheme as ThemeName]?.textPrimary || '#000000',
              }}
            >
              <div className="p-4 flex-1 overflow-y-auto">
                <div
                  className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full mb-4"
                  style={{ backgroundColor: THEMES[chartTheme as ThemeName]?.gridLineFaint || '#999' }}
                />
                <Drawer.Title
                  className="text-lg font-semibold mb-4"
                  style={{ color: THEMES[chartTheme as ThemeName]?.textPrimary || '#000' }}
                >
                  Chart Options
                </Drawer.Title>
                <TogglePanelContent
                  visiblePlanets={visiblePlanets}
                  visibleAspects={visibleAspects as Set<any>}
                  showHouses={showHouses}
                  showDegreeMarkers={showDegreeMarkers}
                  showRetrogrades={showRetrogrades}
                  onTogglePlanet={togglePlanet}
                  onToggleAspect={toggleAspect}
                  onSetShowHouses={setShowHouses}
                  onSetShowDegreeMarkers={setShowDegreeMarkers}
                  onSetShowRetrogrades={setShowRetrogrades}
                  showDecans={showDecans}
                  onSetShowDecans={setShowDecans}
                  straightAspects={straightAspects}
                  onSetStraightAspects={setStraightAspects}
                  showEffects={mobileShowEffects}
                  onSetShowEffects={setMobileShowEffects}
                  onEnablePlanetGroup={(group) => {
                    const groups: Record<string, string[]> = {
                      core: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'northnode', 'southnode'],
                      outer: ['uranus', 'neptune', 'pluto'],
                      asteroids: ['chiron', 'lilith', 'juno', 'ceres', 'pallas', 'vesta'],
                    };
                    setVisiblePlanets(prev => {
                      const next = new Set(prev);
                      groups[group]?.forEach(p => next.add(p));
                      return next;
                    });
                  }}
                  onDisablePlanetGroup={(group) => {
                    const groups: Record<string, string[]> = {
                      core: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'northnode', 'southnode'],
                      outer: ['uranus', 'neptune', 'pluto'],
                      asteroids: ['chiron', 'lilith', 'juno', 'ceres', 'pallas', 'vesta'],
                    };
                    setVisiblePlanets(prev => {
                      const next = new Set(prev);
                      groups[group]?.forEach(p => next.delete(p));
                      return next;
                    });
                  }}
                  onEnableMinorAspects={() => {
                    setVisibleAspects(prev => {
                      const next = new Set(prev);
                      ['quincunx', 'semisextile', 'semisquare', 'sesquiquadrate'].forEach(a => next.add(a));
                      return next;
                    });
                  }}
                  onDisableMinorAspects={() => {
                    setVisibleAspects(prev => {
                      const next = new Set(prev);
                      ['quincunx', 'semisextile', 'semisquare', 'sesquiquadrate'].forEach(a => next.delete(a));
                      return next;
                    });
                  }}
                  nameA={biWheelProps.nameA}
                  nameB={biWheelProps.nameB}
                  isMobile={true}
                  chartMode={chartMode}
                  onSetChartMode={(mode: ChartMode) => { setChartMode(mode); biWheelProps.onChartModeChange?.(mode); }}
                  enableComposite={biWheelProps.enableComposite}
                  enableTransits={biWheelProps.enableTransits}
                  showTransits={showTransits}
                  transitDate={transitDate}
                  transitTime={transitTime}
                  transitLoading={transitLoading}
                  onSetShowTransits={setShowTransits}
                  onSetTransitDate={setTransitDate}
                  onSetTransitTime={setTransitTime}
                  enableAsteroids={true}
                  enabledAsteroidGroups={enabledAsteroidGroups}
                  onToggleAsteroidGroup={toggleAsteroidGroup}
                  onEnableAllAsteroids={enableAllAsteroids}
                  onDisableAllAsteroids={disableAllAsteroids}
                  // Progressed controls
                  enableProgressed={biWheelProps.enableProgressed}
                  progressedPerson={progressedPerson}
                  progressedDate={progressedDate}
                  progressedLoading={progressedLoading}
                  showSolarArc={showSolarArc}
                  onSetProgressedPerson={handleSetProgressedPerson}
                  onSetProgressedDate={setProgressedDate}
                  onSetShowSolarArc={setShowSolarArc}
                  // Relocated controls
                  enableRelocated={biWheelProps.enableRelocated}
                  relocatedPerson={relocatedPerson}
                  relocatedLoading={relocatedLoading}
                  relocatedLocationA={relocatedLocationA}
                  relocatedLocationB={relocatedLocationB}
                  onSetRelocatedPerson={handleSetRelocatedPerson}
                  onOpenLocationPicker={handleOpenLocationPicker}
                  // Rotation controls
                  rotateToAscendant={rotateToAscendant}
                  onSetRotateToAscendant={setRotateToAscendant}
                  zodiacVantage={zodiacVantage}
                  onSetZodiacVantage={setZodiacVantage}
                  // Theme controls
                  chartTheme={chartTheme as any}
                  onThemeChange={(theme) => { applyTheme(theme); setChartTheme(theme); biWheelProps.onThemeChange?.(theme); }}
                  // Birth time shift (natal knobs)
                  enableBirthTimeShift={biWheelProps.enableBirthTimeShift}
                  showBirthTimeShift={showBirthTimeShift}
                  onSetShowBirthTimeShift={(show) => {
                    setShowBirthTimeShift(show);
                    if (!show) { setTimeShiftA(0); setTimeShiftB(0); biWheelProps.onTimeShiftAChange?.(0); biWheelProps.onTimeShiftBChange?.(0); }
                  }}
                  // Presets
                  presets={presets.map(p => ({ id: p.id, name: p.name }))}
                  activePresetId={activePresetId}
                  onLoadPreset={(id) => { const p = presets.find(pr => pr.id === id); if (p) handleLoadPreset(p); }}
                  onDeletePreset={handleDeletePreset}
                  onSavePreset={handleSavePreset}
                  presetsAtLimit={presets.length >= 10}
                />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* Location Picker Modal (mobile) — lazy-loaded with Leaflet */}
        {showLocationPicker && (
          <React.Suspense fallback={null}>
            <LocationPicker
              isOpen={showLocationPicker}
              onClose={() => setShowLocationPicker(false)}
              onConfirm={handleLocationConfirm}
              originalLocation={locationPickerTarget === 'B' ? biWheelProps.locationB : biWheelProps.originalLocation}
              currentLocation={(locationPickerTarget === 'B' ? relocatedLocationB : relocatedLocationA) || undefined}
              birthDate={locationPickerTarget === 'B' ? biWheelProps.birthDateB : biWheelProps.birthDateA}
              birthTime={locationPickerTarget === 'B' ? biWheelProps.birthTimeB : biWheelProps.birthTimeA}
              showAstroLines={true}
            />
          </React.Suspense>
        )}

        {/* Auth/Upgrade modals for gated features (mobile) */}
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

        {/* Email share modal */}
        {showEmailModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => !sendingEmail && setShowEmailModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-card border rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4 pointer-events-auto">
                <div>
                  <h3 className="text-base font-semibold">Share Chart via Email</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Send this chart as a PNG attachment</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1 block">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && emailTo.trim() && handleEmailShare()}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1 block">
                      Message (optional)
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Check out this chart..."
                      rows={2}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
                {chartNotesKey && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareNotes}
                      onChange={(e) => setShareNotes(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-xs text-muted-foreground">Share notes from this chart</span>
                  </label>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowEmailModal(false); setEmailTo(''); setEmailMessage(''); }}
                    disabled={sendingEmail}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmailShare}
                    disabled={sendingEmail || !emailTo.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {sendingEmail ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                    ) : (
                      <><Mail className="w-3.5 h-3.5" /> Send</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default BiWheelMobileWrapper;
