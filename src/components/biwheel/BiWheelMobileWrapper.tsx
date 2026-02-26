/**
 * BiWheel Mobile Wrapper
 * Provides responsive sizing, pinch-to-zoom, pan, and full-screen mode for the biwheel chart
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { BiWheelSynastry } from './BiWheelSynastry';
import { TogglePanelContent } from './controls/TogglePanelContent';
import type { BiWheelSynastryProps, AsteroidGroup, ChartMode, LocationData } from './types';
import { ASTEROID_GROUPS } from './types';
import { ASTEROIDS, ASTEROID_GROUP_INFO, applyTheme } from './utils/constants';
import { THEMES, type ThemeName } from './utils/themes';
import { Drawer } from 'vaul';
import { Settings2, Download, Image, FileText, Mail, Loader2, Share2, Link2, Check } from 'lucide-react';
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
}

// Default sets for comparison when building share URLs
const DEFAULT_PLANETS = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']);
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
      || (savedDefaults?.visiblePlanets ? new Set(savedDefaults.visiblePlanets) : new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']))
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

  // Relocated state (lifted for mobile drawer access)
  const [relocatedPerson, setRelocatedPerson] = useState<'A' | 'B' | 'both' | null>(null);
  const [relocatedLoading, setRelocatedLoading] = useState(false);
  const [relocatedLocation, setRelocatedLocation] = useState<LocationData | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Auth & subscription (for location picker gating)
  const { user } = useAuth();
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

  // Sync visibility changes up to parent (for galactic mode linking)
  useEffect(() => {
    onVisiblePlanetsChange?.(visiblePlanets);
  }, [visiblePlanets, onVisiblePlanetsChange]);

  useEffect(() => {
    onVisibleAspectsChange?.(visibleAspects);
  }, [visibleAspects, onVisibleAspectsChange]);

  // Detect mobile
  const isMobile = useMemo(() => {
    if (forceMobile !== undefined) return forceMobile;
    return containerWidth > 0 && containerWidth < MOBILE_BREAKPOINT;
  }, [containerWidth, forceMobile]);

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

  // Save current mobile selections as defaults to localStorage
  const saveDefaults = useCallback(() => {
    const defaults = {
      visiblePlanets: Array.from(visiblePlanets),
      visibleAspects: Array.from(visibleAspects),
      showHouses,
      showDegreeMarkers,
      showRetrogrades: true,
      showDecans: true,
      rotateToAscendant: false,
      chartTheme: 'classic',
      enabledAsteroidGroups: Array.from(enabledAsteroidGroups),
    };
    localStorage.setItem('biwheel-chart-defaults', JSON.stringify(defaults));
  }, [visiblePlanets, visibleAspects, showHouses, showDegreeMarkers, enabledAsteroidGroups]);

  // Mutual exclusivity: progressed ↔ relocated
  const handleSetProgressedPerson = useCallback((person: 'A' | 'B' | 'both' | null) => {
    setProgressedPerson(person);
    if (person) {
      // Clear relocated when enabling progressed
      setRelocatedPerson(null);
      setRelocatedLocation(null);
    }
  }, []);

  const handleSetRelocatedPerson = useCallback((person: 'A' | 'B' | 'both' | null) => {
    setRelocatedPerson(person);
    if (person) {
      // Clear progressed when enabling relocated
      setProgressedPerson(null);
      setShowSolarArc(false);
      // On mobile, don't auto-set to birth location (produces identical chart, wastes credit).
      // Instead, auto-open the location picker so the user picks a real location.
      if (!relocatedLocation) {
        if (!user) { setShowAuthModal(true); return; }
        if (!isPaid) { setShowUpgradeModal(true); return; }
        setDrawerOpen(false);
        setTimeout(() => setShowLocationPicker(true), 300); // Delay so drawer closes first
      }
    } else {
      setRelocatedLocation(null);
    }
  }, [relocatedLocation, user, isPaid]);

  // Location picker handlers
  const handleOpenLocationPicker = useCallback(() => {
    if (!user) { setShowAuthModal(true); return; }
    if (!isPaid) { setShowUpgradeModal(true); return; }
    setDrawerOpen(false); // Close options drawer first
    setShowLocationPicker(true);
  }, [user, isPaid]);

  const handleLocationConfirm = useCallback((location: LocationData) => {
    setRelocatedLocation(location);
    setShowLocationPicker(false);
  }, [relocatedPerson]);

  // Generate a key that changes when control state changes
  // This forces BiWheelSynastry to re-mount with new initial values
  const chartKey = useMemo(() => {
    const locKey = relocatedLocation ? `${relocatedLocation.lat},${relocatedLocation.lng}` : 'none';
    return `${chartMode}-${Array.from(visiblePlanets).sort().join(',')}-${Array.from(visibleAspects).sort().join(',')}-${showHouses}-${showDegreeMarkers}-${Array.from(enabledAsteroidGroups).sort().join(',')}-${showTransits}-${transitDate}-${transitTime}-${progressedPerson}-${progressedDate}-${showSolarArc}-${relocatedPerson}-${locKey}-${chartTheme}`;
  }, [chartMode, visiblePlanets, visibleAspects, showHouses, showDegreeMarkers, enabledAsteroidGroups, showTransits, transitDate, transitTime, progressedPerson, progressedDate, showSolarArc, relocatedPerson, relocatedLocation, chartTheme]);

  return (
    <div ref={containerRef} className="w-full">
      <div>
        {/* Control bar */}
        <div className="flex items-center justify-end w-full mb-1 md:mb-2 px-1 md:px-2">
          <div className="flex items-center gap-1 md:gap-2">
            {/* Settings button (mobile - opens drawer) */}
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-1 px-2 py-1.5 md:px-2.5 md:py-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
                title="Chart options"
              >
                <Settings2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs">Options</span>
              </button>
            )}

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

        {/* Chart container */}
        <div
          ref={chartContainerRef}
          className="rounded-xl border border-border"
          style={{
            maxWidth: '100%',
            touchAction: isMobile ? 'manipulation' : (scale > 1 ? 'none' : 'auto'),
            cursor: !isMobile && scale > 1 ? (isMousePanning ? 'grabbing' : 'grab') : 'default',
          }}
          {...(!isMobile ? {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onWheel: handleWheel,
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseLeave,
          } : {})}
        >
          {isMobile ? (
            /* Mobile: no custom zoom transform — native pinch-to-zoom works on the SVG */
            <BiWheelSynastry
              key={chartKey}
              {...biWheelProps}
              size={chartSize}
              showTogglePanel={false}
              hideZoomControls
              initialVisiblePlanets={visiblePlanets}
              initialVisibleAspects={visibleAspects as Set<any>}
              initialShowHouses={showHouses}
              initialShowDegreeMarkers={showDegreeMarkers}
              initialChartMode={chartMode}
              // Transit initial state
              initialShowTransits={showTransits}
              initialTransitDate={transitDate}
              initialTransitTime={transitTime}
              // Progressed/Relocated initial state
              initialProgressedPerson={progressedPerson}
              initialProgressedDate={progressedDate}
              initialShowSolarArc={showSolarArc}
              initialRelocatedPerson={relocatedPerson}
              initialTheme={chartTheme}
              // External relocated control — provides location on re-mount
              externalRelocatedLocation={relocatedLocation}
              externalRelocatedPerson={relocatedPerson}
              // Change callbacks
              onChartModeChange={(mode) => { setChartMode(mode); biWheelProps.onChartModeChange?.(mode); }}
              onShowTransitsChange={setShowTransits}
              onTransitDateChange={setTransitDate}
              onTransitTimeChange={setTransitTime}
              onTransitLoadingChange={setTransitLoading}
              onProgressedPersonChange={handleSetProgressedPerson}
              onProgressedDateChange={setProgressedDate}
              onShowSolarArcChange={setShowSolarArc}
              onRelocatedPersonChange={handleSetRelocatedPerson}
              onProgressedLoadingChange={setProgressedLoading}
              onRelocatedLoadingChange={setRelocatedLoading}
              onThemeChange={(theme) => { setChartTheme(theme); biWheelProps.onThemeChange?.(theme); }}
            />
          ) : (
            <div
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isPanning || isMousePanning ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              <BiWheelSynastry
                {...biWheelProps}
                size={chartSize}
                showTogglePanel={true}
                initialVisiblePlanets={visiblePlanets}
                initialVisibleAspects={visibleAspects as Set<any>}
                initialShowHouses={showHouses}
                initialShowDegreeMarkers={showDegreeMarkers}
              />
            </div>
          )}
        </div>

        {/* Mobile drawer for controls */}
        <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
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
                  showRetrogrades={true}
                  onTogglePlanet={togglePlanet}
                  onToggleAspect={toggleAspect}
                  onSetShowHouses={setShowHouses}
                  onSetShowDegreeMarkers={setShowDegreeMarkers}
                  onSetShowRetrogrades={() => {}}
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
                  onSetRelocatedPerson={handleSetRelocatedPerson}
                  onOpenLocationPicker={handleOpenLocationPicker}
                  // Theme controls
                  chartTheme={chartTheme as any}
                  onThemeChange={(theme) => { applyTheme(theme); setChartTheme(theme); biWheelProps.onThemeChange?.(theme); }}
                  onSaveDefaults={saveDefaults}
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
              originalLocation={biWheelProps.originalLocation}
              currentLocation={relocatedLocation || undefined}
              birthDate={biWheelProps.birthDateA}
              birthTime={biWheelProps.birthTimeA}
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
