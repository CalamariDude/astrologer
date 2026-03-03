/**
 * GalacticMode
 * Top-level container: R3F Canvas + HTML overlay controls + info panel
 * Transit time slider for animating planets through time.
 * Right-side settings panel with all display, aspect, and object controls.
 */

import { useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import {
  Loader2, RotateCw, Home, Maximize2, Minimize2,
  Play, Pause, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  RotateCcw, Settings, ChevronDown, ChevronUp, X, Clock, CalendarDays,
  BarChart3,
} from 'lucide-react';
import { GalacticScene } from './GalacticScene';
import { PlanetInfoPanel } from './PlanetInfoPanel';
import { ChartOverviewPanel } from './ChartOverviewPanel';
import { GalacticJourney } from './GalacticJourney';
import { useAspectEnergy } from './hooks/useAspectEnergy';
import { useGalacticChart } from './hooks/useGalacticChart';
import { CAMERA, CAMERA_PRESETS } from './constants';
import { PLANETS, ASPECTS, ASTEROIDS, ASTEROID_GROUP_INFO, ARABIC_PARTS, ARABIC_PART_KEYS, calculateArabicParts } from '../biwheel/utils/constants';
import { ASTEROID_GROUPS, type AsteroidGroup } from '../biwheel/types';
import type { GalacticNatalChart, CameraPreset } from './types';

interface GalacticModeProps {
  chart: GalacticNatalChart;
  name: string;
  birthDate?: string;
  visiblePlanets?: Set<string>;
  visibleAspects?: Set<string>;
  onFetchAsteroidData?: (asteroids: string[]) => Promise<{ chartA: Record<string, any>; chartB: Record<string, any> }>;
}

function GalacticEffects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        luminanceThreshold={0.7}
        luminanceSmoothing={0.3}
        intensity={0.6}
        mipmapBlur
        levels={3}
      />
      <Vignette eskil={false} offset={0.15} darkness={0.7} />
    </EffectComposer>
  );
}

/** Collapsible section for settings panel */
function PanelSection({
  title,
  defaultOpen = false,
  children,
  badge,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 w-full py-1.5 text-[10px] font-semibold text-white/60 uppercase tracking-wider hover:text-white/90 transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
        <span className="flex-1 text-left">{title}</span>
        {badge !== undefined && (
          <span className="bg-white/10 text-white/50 text-[8px] px-1.5 py-0.5 rounded-full">{badge}</span>
        )}
      </button>
      {open && <div className="pb-2 space-y-1">{children}</div>}
    </div>
  );
}

/** Small toggle row */
function ToggleRow({
  label,
  checked,
  onChange,
  color,
  symbol,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
  symbol?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 w-full px-1.5 py-1 rounded text-[11px] transition-all hover:bg-white/5"
      style={{ color: checked ? '#fff' : 'rgba(255,255,255,0.4)' }}
    >
      <span
        className="w-2 h-2 rounded-sm flex-shrink-0 transition-all"
        style={{
          background: checked ? (color ?? '#818cf8') : 'rgba(255,255,255,0.12)',
          boxShadow: checked ? `0 0 4px ${color ?? '#818cf8'}50` : 'none',
        }}
      />
      {symbol && (
        <span className="w-4 text-center text-xs" style={{ color: checked ? (color ?? '#fff') : 'rgba(255,255,255,0.3)' }}>
          {symbol}
        </span>
      )}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

/** Expandable asteroid group with individual member toggles */
function AsteroidGroupSection({
  group,
  info,
  isEnabled,
  isLoading,
  members,
  visibleInGroup,
  totalCount,
  chartPlanets,
  localVisiblePlanets,
  onToggleGroup,
  onToggleMember,
}: {
  group: AsteroidGroup;
  info: { name: string; color: string; icon: string };
  isEnabled: boolean;
  isLoading: boolean;
  members: string[];
  visibleInGroup: number;
  totalCount: number;
  chartPlanets: Record<string, any>;
  localVisiblePlanets: Set<string>;
  onToggleGroup: () => void;
  onToggleMember: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const astLookup = { ...ASTEROIDS, ...ARABIC_PARTS } as Record<string, { name?: string; symbol?: string; color?: string }>;

  return (
    <div>
      {/* Group header row */}
      <div className="flex items-center gap-1">
        {/* Expand/collapse arrow */}
        {isEnabled && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-0.5 text-white/30 hover:text-white/60 transition-colors"
          >
            {expanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </button>
        )}

        {/* Group toggle button */}
        <button
          onClick={onToggleGroup}
          disabled={isLoading}
          className={`flex items-center gap-2 flex-1 px-1.5 py-1 rounded text-[11px] transition-all hover:bg-white/5 disabled:opacity-50 ${!isEnabled ? 'ml-4' : ''}`}
          style={{ color: isEnabled ? info.color : 'rgba(255,255,255,0.45)' }}
        >
          <span
            className="w-2 h-2 rounded-sm flex-shrink-0 transition-all"
            style={{
              background: isEnabled ? info.color : 'rgba(255,255,255,0.12)',
              boxShadow: isEnabled ? `0 0 4px ${info.color}50` : 'none',
            }}
          />
          <span className="text-sm leading-none">{info.icon}</span>
          <span className="flex-1 text-left">{info.name}</span>
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" style={{ color: info.color }} />
          ) : (
            <span className="text-[9px] opacity-60">
              {isEnabled ? `${visibleInGroup}/${totalCount}` : totalCount}
            </span>
          )}
        </button>
      </div>

      {/* Individual members — shown when expanded */}
      {isEnabled && expanded && (
        <div className="ml-5 mt-0.5 space-y-0">
          {members.map(key => {
            const ast = astLookup[key];
            const isLoaded = !!chartPlanets[key];
            const isVisible = localVisiblePlanets.has(key);
            const label = ast?.name ?? key;
            const color = ast?.color ?? info.color;

            return (
              <button
                key={key}
                onClick={() => onToggleMember(key)}
                disabled={!isLoaded}
                className="flex items-center gap-2 w-full px-1.5 py-0.5 rounded text-[10px] transition-all hover:bg-white/5 disabled:opacity-30"
                style={{ color: isVisible ? '#fff' : 'rgba(255,255,255,0.35)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: isVisible ? color : 'rgba(255,255,255,0.12)',
                  }}
                />
                <span className="flex-1 text-left">{label}</span>
                {!isLoaded && (
                  <span className="text-[8px] text-white/20">n/a</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Transit time controls */
function TransitControls({
  dayOffset,
  isPlaying,
  speed,
  birthDate,
  onStep,
  onTogglePlay,
  onSetSpeed,
  onReset,
  onJumpToToday,
}: {
  dayOffset: number;
  isPlaying: boolean;
  speed: number;
  birthDate?: string;
  onStep: (days: number) => void;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onReset: () => void;
  onJumpToToday: () => void;
}) {
  const dateLabel = useMemo(() => {
    if (dayOffset === 0) return 'Natal';
    if (birthDate) {
      const d = new Date(birthDate);
      d.setDate(d.getDate() + Math.round(dayOffset));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const sign = dayOffset > 0 ? '+' : '';
    const absDays = Math.abs(Math.round(dayOffset));
    if (absDays >= 365) return `${sign}${(dayOffset / 365.25).toFixed(1)}y`;
    if (absDays >= 30) return `${sign}${Math.round(dayOffset / 30.44)}mo`;
    return `${sign}${Math.round(dayOffset)}d`;
  }, [dayOffset, birthDate]);

  const btnClass = "p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors";

  return (
    <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-lg px-2.5 py-1.5">
      <button onClick={() => onStep(-30)} className={btnClass} title="Back 1 month">
        <ChevronsLeft className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onStep(-1)} className={btnClass} title="Back 1 day">
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onTogglePlay}
        className={`p-1.5 rounded-md transition-colors ${
          isPlaying ? 'bg-amber-500/40 text-amber-300' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90'
        }`}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      <button onClick={() => onStep(1)} className={btnClass} title="Forward 1 day">
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onStep(30)} className={btnClass} title="Forward 1 month">
        <ChevronsRight className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-white/10 mx-0.5" />

      <span className={`text-[11px] min-w-[70px] text-center font-mono ${
        dayOffset === 0 ? 'text-white/50' : 'text-amber-300'
      }`}>
        {dateLabel}
      </span>

      <div className="h-4 w-px bg-white/10 mx-0.5" />

      <select
        value={speed}
        onChange={(e) => onSetSpeed(Number(e.target.value))}
        className="bg-white/5 text-white/60 text-[10px] rounded px-1.5 py-1 border-0 outline-none cursor-pointer appearance-none"
        title="Transit speed"
      >
        <option value={1}>1d/s</option>
        <option value={7}>1w/s</option>
        <option value={30}>1mo/s</option>
        <option value={365}>1yr/s</option>
      </select>

      <button
        onClick={onJumpToToday}
        className={`${btnClass} text-[10px] px-1.5 flex items-center gap-1`}
        title="Jump to today"
      >
        <CalendarDays className="w-3 h-3" />
        <span>Today</span>
      </button>

      {dayOffset !== 0 && (
        <button onClick={onReset} className={btnClass} title="Reset to natal date">
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Aspect definitions for toggles
const MAJOR_ASPECTS = Object.entries(ASPECTS).filter(([, v]) => v.major);
const MINOR_ASPECTS = Object.entries(ASPECTS).filter(([, v]) => !v.major);

export default function GalacticMode({ chart: initialChart, name, birthDate, visiblePlanets, visibleAspects, onFetchAsteroidData }: GalacticModeProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedPlanetB, setSelectedPlanetB] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showAspects, setShowAspects] = useState(true);
  const [showNatalAspects, setShowNatalAspects] = useState(true);
  const [showTransitAspects, setShowTransitAspects] = useState(true);
  const [showHouses, setShowHouses] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showZodiac, setShowZodiac] = useState(true);
  const [showFlatEarth, setShowFlatEarth] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePreset, setActivePreset] = useState<CameraPreset | null>(null);
  const [activePresetName, setActivePresetName] = useState<string>('Overview');
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(true);
  const [enabledAsteroidGroups, setEnabledAsteroidGroups] = useState<Set<AsteroidGroup>>(new Set());
  const [loadingGroups, setLoadingGroups] = useState<Set<AsteroidGroup>>(new Set());
  const [extraPlanets, setExtraPlanets] = useState<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showOverview, setShowOverview] = useState(false);

  // Transit state
  const [transitEnabled, setTransitEnabled] = useState(false);
  const [transitDayOffset, setTransitDayOffset] = useState(0);
  const [transitPlaying, setTransitPlaying] = useState(false);
  const [transitSpeed, setTransitSpeed] = useState(1);

  // Merge initial chart planets with fetched asteroid data + Arabic Parts
  const chart = useMemo<GalacticNatalChart>(() => {
    const merged = { ...initialChart.planets, ...extraPlanets };

    // Calculate Arabic Parts client-side from chart data
    const asc = initialChart.angles?.ascendant;
    if (asc !== undefined) {
      const parts = calculateArabicParts(
        merged as Record<string, { longitude: number }>,
        asc,
      );
      for (const [key, value] of Object.entries(parts)) {
        if (!merged[key]) merged[key] = value;
      }
    }

    return { ...initialChart, planets: merged };
  }, [initialChart, extraPlanets]);

  // Local planet visibility
  const [localVisiblePlanets, setLocalVisiblePlanets] = useState<Set<string>>(() =>
    visiblePlanets ? new Set(visiblePlanets) : new Set(Object.keys(chart.planets))
  );

  // Local aspect visibility
  const [localVisibleAspects, setLocalVisibleAspects] = useState<Set<string>>(() => {
    const base = visibleAspects ? new Set(visibleAspects) : new Set<string>();
    for (const a of ['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare']) {
      base.add(a);
    }
    return base;
  });

  // Sync from 2D prop when it changes
  useEffect(() => {
    if (visiblePlanets) {
      setLocalVisiblePlanets(new Set(visiblePlanets));
    }
  }, [visiblePlanets]);

  useEffect(() => {
    if (visibleAspects) {
      const base = new Set(visibleAspects);
      for (const a of ['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare']) {
        base.add(a);
      }
      setLocalVisibleAspects(base);
    }
  }, [visibleAspects]);

  const { planets3D, aspects, transitPlanets3D, transitAspects } = useGalacticChart(chart, localVisiblePlanets, localVisibleAspects, transitDayOffset, transitEnabled);
  const allPlanets3D = useMemo(() => [...planets3D, ...transitPlanets3D], [planets3D, transitPlanets3D]);
  const aspects3D = useAspectEnergy(aspects, planets3D);
  const transitAspects3D = useAspectEnergy(transitAspects, allPlanets3D);

  const selectedPlanetData = selectedPlanet
    ? allPlanets3D.find((p) => p.key === selectedPlanet) ?? null
    : null;

  // Transit animation loop
  useEffect(() => {
    if (!transitPlaying) return;
    let lastTime = performance.now();
    let animFrame: number;

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setTransitDayOffset(prev => prev + transitSpeed * dt);
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [transitPlaying, transitSpeed]);

  const handleSelectPlanet = useCallback((key: string | null) => {
    setSelectedPlanet(key);
    if (key) {
      setAutoRotate(false);
      setTransitPlaying(false);
    }
  }, []);

  const handleInteractionStart = useCallback(() => {
    setAutoRotate(false);
    setActivePresetName('');
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setAutoRotate(true);
    }, 8000);
  }, []);

  const handlePreset = useCallback((preset: CameraPreset) => {
    setActivePreset({ ...preset });
    setActivePresetName(preset.name);
    setAutoRotate(false);
    setTimeout(() => setAutoRotate(true), 2000);
  }, []);

  const handleTogglePlanet = useCallback((key: string) => {
    setLocalVisiblePlanets(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleToggleAspect = useCallback((key: string) => {
    setLocalVisibleAspects(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleToggleAsteroidGroup = useCallback(async (group: AsteroidGroup) => {
    const members = ASTEROID_GROUPS[group] ?? [];

    if (enabledAsteroidGroups.has(group)) {
      // Disable group — remove all members from visible
      setEnabledAsteroidGroups(prev => {
        const next = new Set(prev);
        next.delete(group);
        return next;
      });
      setLocalVisiblePlanets(prev => {
        const next = new Set(prev);
        for (const k of members) next.delete(k);
        return next;
      });
      return;
    }

    // Enable group
    setEnabledAsteroidGroups(prev => new Set(prev).add(group));

    // Arabic Parts are calculated client-side — exclude from API fetch
    const fetchMembers = members.filter(k => !chart.planets[k] && !ARABIC_PART_KEYS.has(k));
    if (fetchMembers.length > 0 && onFetchAsteroidData) {
      setLoadingGroups(prev => new Set(prev).add(group));
      try {
        const result = await onFetchAsteroidData(fetchMembers as string[]);
        setExtraPlanets(prev => ({ ...prev, ...result.chartA }));
        // Add all fetched + already-loaded + Arabic Part members to visible
        setLocalVisiblePlanets(prev => {
          const next = new Set(prev);
          for (const k of members) {
            if (chart.planets[k] || result.chartA[k] || ARABIC_PART_KEYS.has(k)) next.add(k);
          }
          return next;
        });
      } catch (err) {
        console.error('Failed to fetch asteroid data:', err);
      } finally {
        setLoadingGroups(prev => {
          const next = new Set(prev);
          next.delete(group);
          return next;
        });
      }
    } else {
      // All data already loaded (or Arabic Parts) — just add to visible
      setLocalVisiblePlanets(prev => {
        const next = new Set(prev);
        for (const k of members) {
          if (chart.planets[k]) next.add(k);
        }
        return next;
      });
    }
  }, [enabledAsteroidGroups, chart.planets, onFetchAsteroidData]);

  /** Compute days from birth to today */
  const daysToToday = useMemo(() => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const now = new Date();
    return Math.round((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  }, [birthDate]);

  const handleToggleTransit = useCallback(() => {
    setTransitEnabled(prev => {
      if (!prev) {
        // When enabling transits, jump to today
        setTransitDayOffset(daysToToday || 365);
      } else {
        // When disabling, stop playing and reset
        setTransitPlaying(false);
        setTransitDayOffset(0);
      }
      return !prev;
    });
  }, [daysToToday]);

  const handleTransitStep = useCallback((days: number) => {
    setTransitDayOffset(prev => prev + days);
  }, []);

  const handleTransitReset = useCallback(() => {
    setTransitDayOffset(0);
    setTransitPlaying(false);
  }, []);

  const handleJumpToToday = useCallback(() => {
    setTransitDayOffset(daysToToday || 365);
    setTransitPlaying(false);
  }, [daysToToday]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Planet list for Object toggles
  const mainPlanetKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'northnode', 'southnode', 'lilith'];
  const mainPlanets = useMemo(() => {
    return mainPlanetKeys
      .filter(k => chart.planets[k])
      .map(k => {
        const def = PLANETS[k as keyof typeof PLANETS];
        return { key: k, name: def?.name ?? k, symbol: def?.symbol ?? '', color: def?.color ?? '#888' };
      });
  }, [chart.planets]);

  // Quick group toggles
  const handleEnableGroup = useCallback((group: 'core' | 'outer' | 'all') => {
    setLocalVisiblePlanets(prev => {
      const next = new Set(prev);
      if (group === 'core' || group === 'all') {
        for (const k of ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'northnode', 'southnode']) {
          if (chart.planets[k]) next.add(k);
        }
      }
      if (group === 'outer' || group === 'all') {
        for (const k of ['uranus', 'neptune', 'pluto', 'chiron', 'lilith']) {
          if (chart.planets[k]) next.add(k);
        }
      }
      return next;
    });
  }, [chart.planets]);

  const handleClearPlanets = useCallback(() => {
    setLocalVisiblePlanets(new Set());
  }, []);

  const handleEnableAllMajorAspects = useCallback(() => {
    setLocalVisibleAspects(prev => {
      const next = new Set(prev);
      for (const [key] of MAJOR_ASPECTS) next.add(key);
      return next;
    });
  }, []);

  const handleEnableAllMinorAspects = useCallback(() => {
    setLocalVisibleAspects(prev => {
      const next = new Set(prev);
      for (const [key] of MINOR_ASPECTS) next.add(key);
      return next;
    });
  }, []);

  const handleDisableAllMinorAspects = useCallback(() => {
    setLocalVisibleAspects(prev => {
      const next = new Set(prev);
      for (const [key] of MINOR_ASPECTS) next.delete(key);
      return next;
    });
  }, []);

  // ── Journey callbacks (passed to GalacticJourney) ──
  const handleJourneyFocusPlanet = useCallback((key: string | null, keyB?: string | null) => {
    setSelectedPlanet(key);
    setSelectedPlanetB(keyB ?? null);
    if (key) {
      setAutoRotate(false);
      // Auto-enable planets that the journey needs to focus on
      setLocalVisiblePlanets(prev => {
        const next = new Set(prev);
        let changed = false;
        if (!next.has(key)) { next.add(key); changed = true; }
        // For transit planet keys like "transit_saturn", ensure the natal version is also visible
        if (keyB) {
          const natalKey = keyB.startsWith('transit_') ? keyB.replace('transit_', '') : keyB;
          if (!next.has(natalKey)) { next.add(natalKey); changed = true; }
        }
        return changed ? next : prev;
      });
    }
  }, []);

  const handleJourneySetTransit = useCallback((enabled: boolean, dayOffset: number) => {
    setTransitEnabled(enabled);
    setTransitDayOffset(dayOffset);
    setTransitPlaying(false);
    // Force aspects visible during journey transit scenes
    if (enabled) {
      setShowAspects(true);
      setShowTransitAspects(true);
    }
  }, []);

  const handleJourneySetPreset = useCallback((preset: CameraPreset) => {
    setActivePreset({ ...preset });
    setActivePresetName(preset.name);
  }, []);

  const handleJourneySetAutoRotate = useCallback((v: boolean) => {
    setAutoRotate(v);
  }, []);

  const visibleAspectCount = localVisibleAspects.size;
  const visiblePlanetCount = localVisiblePlanets.size;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#050510] rounded-lg overflow-hidden"
      style={{ height: isFullscreen ? '100vh' : '650px' }}
    >
      {/* 3D Canvas */}
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      }>
        <Canvas
          camera={{
            position: CAMERA.defaultPosition,
            fov: CAMERA.fov,
            near: CAMERA.near,
            far: CAMERA.far,
          }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
        >
          <GalacticScene
            chart={chart}
            visiblePlanets={localVisiblePlanets}
            visibleAspects={localVisibleAspects}
            selectedPlanet={selectedPlanet}
            selectedPlanetB={selectedPlanetB}
            onSelectPlanet={handleSelectPlanet}
            autoRotate={autoRotate}
            onInteractionStart={handleInteractionStart}
            showAspects={showAspects}
            showNatalAspects={showNatalAspects}
            showTransitAspects={showTransitAspects}
            showHouses={showHouses}
            showOrbits={showOrbits}
            showZodiac={showZodiac}
            showFlatEarth={showFlatEarth}
            activePreset={activePreset}
            transitDayOffset={transitDayOffset}
            transitEnabled={transitEnabled}
          />
          <GalacticEffects />
        </Canvas>
      </Suspense>

      {/* Top-left: title + transit toggle */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <div className={`w-2 h-2 rounded-full ${transitEnabled ? 'bg-amber-400' : 'bg-indigo-400'} animate-pulse`} />
          <span className="text-xs font-medium text-white/80">
            {name} · {transitEnabled ? 'Transits' : 'Galactic View'}
          </span>
        </div>
        <button
          onClick={handleToggleTransit}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm text-xs font-medium transition-all ${
            transitEnabled
              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/30'
              : 'bg-black/50 text-white/50 hover:text-white/80 hover:bg-black/70'
          }`}
          title={transitEnabled ? 'Disable transits' : 'Enable transits'}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Transits</span>
        </button>
      </div>

      {/* Top-right: settings toggle + quick buttons */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setShowOverview(v => !v)}
          className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
            showOverview ? 'bg-indigo-500/30 text-indigo-300' : 'bg-black/50 text-white/50 hover:text-white/80'
          }`}
          title="Chart Overview"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setAutoRotate(v => !v)}
          className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
            autoRotate ? 'bg-indigo-500/30 text-indigo-300' : 'bg-black/50 text-white/50 hover:text-white/80'
          }`}
          title={autoRotate ? 'Stop rotation' : 'Auto-rotate'}
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setSelectedPlanet(null);
            setAutoRotate(true);
            handlePreset(CAMERA_PRESETS[0]);
          }}
          className="p-2 rounded-lg bg-black/50 backdrop-blur-sm text-white/50 hover:text-white/80 transition-colors"
          title="Reset view"
        >
          <Home className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-black/50 backdrop-blur-sm text-white/50 hover:text-white/80 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setSettingsPanelOpen(v => !v)}
          className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
            settingsPanelOpen ? 'bg-indigo-500/30 text-indigo-300' : 'bg-black/50 text-white/50 hover:text-white/80'
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* ═══ Right-side Settings Panel ═══ */}
      {settingsPanelOpen && (
        <div className="absolute top-14 right-3 z-20 w-56 max-h-[calc(100%-7rem)] overflow-y-auto bg-black/90 backdrop-blur-md rounded-lg border border-white/10 scrollbar-thin scrollbar-thumb-white/10">
          <div className="p-2.5 space-y-1">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-white/10 mb-1">
              <span className="text-[11px] font-semibold text-white/80">Settings</span>
              <button onClick={() => setSettingsPanelOpen(false)} className="p-0.5 hover:bg-white/10 rounded transition-colors">
                <X className="w-3 h-3 text-white/50" />
              </button>
            </div>

            {/* ── Display ── */}
            <PanelSection title="Display" defaultOpen={true}>
              <ToggleRow label="Aspect Lines" checked={showAspects} onChange={setShowAspects} color="#818cf8" />
              {showAspects && (
                <div className="ml-4 space-y-0">
                  <ToggleRow label="Natal Aspects" checked={showNatalAspects} onChange={setShowNatalAspects} color="#818cf8" />
                  {transitEnabled && (
                    <ToggleRow label="Transit → Natal" checked={showTransitAspects} onChange={setShowTransitAspects} color="#f59e0b" />
                  )}
                </div>
              )}
              <ToggleRow label="Houses" checked={showHouses} onChange={setShowHouses} color="#818cf8" />
              <ToggleRow label="Orbit Paths" checked={showOrbits} onChange={setShowOrbits} color="#818cf8" />
              <ToggleRow label="Zodiac Ring" checked={showZodiac} onChange={setShowZodiac} color="#818cf8" />
              <ToggleRow label="Earth" checked={showFlatEarth} onChange={setShowFlatEarth} color="#60a5fa" />
              <ToggleRow label="Auto-Rotate" checked={autoRotate} onChange={setAutoRotate} color="#818cf8" />
              <ToggleRow
                label={`Transits${transitEnabled ? ` (${transitPlanets3D.length})` : ''}`}
                checked={transitEnabled}
                onChange={() => handleToggleTransit()}
                color="#f59e0b"
                symbol="T"
              />
            </PanelSection>

            <div className="border-t border-white/5" />

            {/* ── Major Aspects ── */}
            <PanelSection title="Major Aspects" defaultOpen={true} badge={MAJOR_ASPECTS.filter(([k]) => localVisibleAspects.has(k)).length}>
              {MAJOR_ASPECTS.map(([key, asp]) => (
                <ToggleRow
                  key={key}
                  label={`${asp.name} (${asp.angle}°)`}
                  symbol={asp.symbol}
                  checked={localVisibleAspects.has(key)}
                  onChange={() => handleToggleAspect(key)}
                  color={asp.color}
                />
              ))}
              <button
                onClick={handleEnableAllMajorAspects}
                className="text-[9px] text-indigo-400/70 hover:text-indigo-300 px-1.5 pt-0.5 transition-colors"
              >
                Enable all
              </button>
            </PanelSection>

            <div className="border-t border-white/5" />

            {/* ── Minor Aspects ── */}
            <PanelSection title="Minor Aspects" defaultOpen={false} badge={MINOR_ASPECTS.filter(([k]) => localVisibleAspects.has(k)).length}>
              {MINOR_ASPECTS.map(([key, asp]) => (
                <ToggleRow
                  key={key}
                  label={`${asp.name} (${asp.angle}°)`}
                  symbol={asp.symbol}
                  checked={localVisibleAspects.has(key)}
                  onChange={() => handleToggleAspect(key)}
                  color={asp.color}
                />
              ))}
              <div className="flex gap-2 px-1.5 pt-0.5">
                <button
                  onClick={handleEnableAllMinorAspects}
                  className="text-[9px] text-indigo-400/70 hover:text-indigo-300 transition-colors"
                >
                  Enable all
                </button>
                <button
                  onClick={handleDisableAllMinorAspects}
                  className="text-[9px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Disable all
                </button>
              </div>
            </PanelSection>

            <div className="border-t border-white/5" />

            {/* ── Planets ── */}
            <PanelSection title="Planets" defaultOpen={false} badge={visiblePlanetCount}>
              {/* Quick toggles */}
              <div className="flex gap-1 px-1 pb-1">
                <button
                  onClick={() => handleEnableGroup('core')}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                >
                  Core
                </button>
                <button
                  onClick={() => handleEnableGroup('outer')}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                >
                  +Outer
                </button>
                <button
                  onClick={() => handleEnableGroup('all')}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                >
                  All
                </button>
                <button
                  onClick={handleClearPlanets}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
                >
                  Clear
                </button>
              </div>
              {mainPlanets.map(p => (
                <ToggleRow
                  key={p.key}
                  label={p.name}
                  symbol={p.symbol}
                  checked={localVisiblePlanets.has(p.key)}
                  onChange={() => handleTogglePlanet(p.key)}
                  color={p.color}
                />
              ))}
            </PanelSection>

            <div className="border-t border-white/5" />

            {/* ── Asteroid Groups ── */}
            <PanelSection title="Asteroid Groups" defaultOpen={false} badge={enabledAsteroidGroups.size}>
              {Object.entries(ASTEROID_GROUP_INFO).map(([groupKey, info]) => {
                const group = groupKey as AsteroidGroup;
                const isEnabled = enabledAsteroidGroups.has(group);
                const isLoading = loadingGroups.has(group);
                const members = ASTEROID_GROUPS[group] ?? [];
                const visibleInGroup = members.filter(k => localVisiblePlanets.has(k)).length;
                const totalCount = members.length;

                return (
                  <AsteroidGroupSection
                    key={groupKey}
                    group={group}
                    info={info}
                    isEnabled={isEnabled}
                    isLoading={isLoading}
                    members={members as string[]}
                    visibleInGroup={visibleInGroup}
                    totalCount={totalCount}
                    chartPlanets={chart.planets}
                    localVisiblePlanets={localVisiblePlanets}
                    onToggleGroup={() => handleToggleAsteroidGroup(group)}
                    onToggleMember={handleTogglePlanet}
                  />
                );
              })}
              <p className="text-[8px] text-white/20 px-1.5 pt-0.5 leading-tight">
                Groups load from the API when enabled
              </p>
            </PanelSection>

            <div className="border-t border-white/5" />

            {/* ── Camera Presets ── */}
            <PanelSection title="Camera" defaultOpen={false}>
              <div className="flex flex-wrap gap-1 px-1">
                {CAMERA_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    className={`px-2 py-1 rounded text-[10px] transition-colors ${
                      activePresetName === preset.name
                        ? 'bg-indigo-500/30 text-indigo-300'
                        : 'bg-white/5 text-white/45 hover:text-white/80 hover:bg-white/10'
                    }`}
                    onClick={() => handlePreset(preset)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </PanelSection>
          </div>
        </div>
      )}

      {/* Bottom: Transit controls (when enabled) + camera presets */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        {/* Transit time controls — only when transit mode is active */}
        {transitEnabled && (
          <TransitControls
            dayOffset={transitDayOffset}
            isPlaying={transitPlaying}
            speed={transitSpeed}
            birthDate={birthDate}
            onStep={handleTransitStep}
            onTogglePlay={() => setTransitPlaying(v => !v)}
            onSetSpeed={setTransitSpeed}
            onReset={handleTransitReset}
            onJumpToToday={handleJumpToToday}
          />
        )}

        {/* Camera presets */}
        <div className="flex items-center gap-1">
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.name}
              className={`px-2.5 py-1 rounded-md backdrop-blur-sm text-[10px] transition-colors ${
                activePresetName === preset.name
                  ? 'bg-indigo-500/30 text-indigo-300'
                  : 'bg-black/50 text-white/50 hover:text-white/80 hover:bg-black/70'
              }`}
              title={preset.name}
              onClick={() => handlePreset(preset)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Planet info panel — shift left when settings panel is open */}
      {selectedPlanetData && (
        <PlanetInfoPanel
          planet={selectedPlanetData}
          aspects={[...aspects3D, ...transitAspects3D]}
          onClose={() => setSelectedPlanet(null)}
        />
      )}

      {/* Chart Overview Panel */}
      {showOverview && (
        <ChartOverviewPanel
          chart={chart}
          planets3D={planets3D}
          aspects3D={aspects3D}
          name={name}
          onClose={() => setShowOverview(false)}
        />
      )}

      {/* Galactic Journey */}
      <GalacticJourney
        chart={chart}
        name={name}
        birthDate={birthDate}
        onFocusPlanet={handleJourneyFocusPlanet}
        onSetTransit={handleJourneySetTransit}
        onSetPreset={handleJourneySetPreset}
        onSetAutoRotate={handleJourneySetAutoRotate}
        onRequestFullscreen={() => {
          if (containerRef.current && !document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
          }
        }}
        onExitFullscreen={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
          }
        }}
      />

      {/* Active Transit Aspects — shown when transits enabled and not in journey */}
      {transitEnabled && transitAspects3D.length > 0 && (
        <div className="absolute bottom-16 left-3 z-10 w-52 max-h-48 overflow-y-auto bg-black/80 backdrop-blur-md rounded-lg border border-amber-500/20 scrollbar-thin">
          <div className="p-2">
            <p className="text-[10px] text-amber-300/80 font-semibold uppercase tracking-wider mb-1.5">
              Active Transits ({transitAspects3D.length})
            </p>
            <div className="space-y-0.5">
              {transitAspects3D.slice(0, 8).map((asp) => {
                const transitKey = asp.planetA.replace('transit_', '');
                const natalKey = asp.planetB;
                const aspDef = ASPECTS[asp.aspect.type as keyof typeof ASPECTS];
                return (
                  <div
                    key={asp.id}
                    className="flex items-center gap-1.5 text-[10px] py-0.5"
                  >
                    <span style={{ color: asp.energy.color }} className="w-3 text-center">
                      {aspDef?.symbol || '?'}
                    </span>
                    <span className="text-amber-300/70 capitalize">{transitKey}</span>
                    <span className="text-white/30">{aspDef?.name}</span>
                    <span className="text-white/50 capitalize">{natalKey}</span>
                    <span className="text-white/20 ml-auto">{asp.aspect.exactOrb}°</span>
                  </div>
                );
              })}
              {transitAspects3D.length > 8 && (
                <p className="text-[9px] text-white/20 pt-0.5">+{transitAspects3D.length - 8} more</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom-right: instructions */}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-white/30">
        Drag to rotate · Scroll to zoom · Click planet for details
      </div>
    </div>
  );
}
