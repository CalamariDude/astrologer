/**
 * GalacticMode
 * Top-level container: R3F Canvas + HTML overlay controls + info panel
 * Transit time slider for animating planets through time.
 * Object visibility linked from 2D chart (one-way: 2D→3D).
 */

import { useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import {
  Loader2, RotateCw, Eye, EyeOff, Home, Maximize2, Minimize2,
  Play, Pause, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  RotateCcw, Layers,
} from 'lucide-react';
import { GalacticScene } from './GalacticScene';
import { PlanetInfoPanel } from './PlanetInfoPanel';
import { useAspectEnergy } from './hooks/useAspectEnergy';
import { useGalacticChart } from './hooks/useGalacticChart';
import { CAMERA, CAMERA_PRESETS } from './constants';
import { PLANETS, ASTEROID_GROUP_INFO } from '../biwheel/utils/constants';
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

/** Object panel — shows all planets + asteroid groups with toggles */
function ObjectPanel({
  chartPlanets,
  localVisiblePlanets,
  enabledGroups,
  loadingGroups,
  onTogglePlanet,
  onToggleGroup,
  isOpen,
  onToggleOpen,
}: {
  chartPlanets: Record<string, any>;
  localVisiblePlanets: Set<string>;
  enabledGroups: Set<AsteroidGroup>;
  loadingGroups: Set<AsteroidGroup>;
  onTogglePlanet: (key: string) => void;
  onToggleGroup: (group: AsteroidGroup) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}) {
  const visibleCount = localVisiblePlanets.size;

  // Separate main planets from asteroids
  const mainPlanets = useMemo(() => {
    const keys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'northnode', 'southnode', 'lilith'];
    return keys
      .filter(k => chartPlanets[k])
      .map(k => {
        const def = PLANETS[k as keyof typeof PLANETS];
        return {
          key: k,
          name: def?.name ?? k,
          symbol: def?.symbol ?? '',
          color: def?.color ?? '#888',
        };
      });
  }, [chartPlanets]);

  return (
    <div className="absolute top-14 left-3 z-10">
      <button
        onClick={onToggleOpen}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm text-[11px] transition-colors ${
          isOpen ? 'bg-indigo-500/30 text-indigo-300' : 'bg-black/50 text-white/50 hover:text-white/80'
        }`}
      >
        <Layers className="w-3 h-3" />
        Objects
        <span className="bg-white/15 text-white/60 text-[9px] px-1.5 rounded-full">
          {visibleCount}
        </span>
      </button>

      {isOpen && (
        <div className="mt-1.5 bg-black/90 backdrop-blur-md rounded-lg p-2.5 max-h-[70vh] overflow-y-auto w-56 space-y-3 border border-white/10">
          {/* Main planets */}
          <div>
            <div className="text-[9px] text-white/50 uppercase tracking-wider mb-1.5 font-medium">Planets</div>
            <div className="space-y-0.5">
              {mainPlanets.map(p => {
                const isOn = localVisiblePlanets.has(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => onTogglePlanet(p.key)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[11px] transition-all hover:bg-white/8"
                    style={{ color: isOn ? '#fff' : 'rgba(255,255,255,0.45)' }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all"
                      style={{
                        background: isOn ? p.color : 'rgba(255,255,255,0.12)',
                        boxShadow: isOn ? `0 0 6px ${p.color}60` : 'none',
                      }}
                    />
                    <span style={{ color: isOn ? p.color : 'rgba(255,255,255,0.35)' }}>{p.symbol}</span>
                    <span className="flex-1 text-left">{p.name}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: isOn ? `${p.color}25` : 'rgba(255,255,255,0.06)',
                        color: isOn ? p.color : 'rgba(255,255,255,0.25)',
                      }}
                    >
                      {isOn ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asteroid groups — always show all, even if data not loaded */}
          <div>
            <div className="text-[9px] text-white/50 uppercase tracking-wider mb-1.5 font-medium">Asteroid Groups</div>
            <div className="space-y-0.5">
              {Object.entries(ASTEROID_GROUP_INFO).map(([groupKey, info]) => {
                const group = groupKey as AsteroidGroup;
                const isEnabled = enabledGroups.has(group);
                const isLoading = loadingGroups.has(group);
                const members = ASTEROID_GROUPS[group] ?? [];
                const loadedCount = members.filter(k => chartPlanets[k]).length;
                const totalCount = members.length;

                return (
                  <button
                    key={groupKey}
                    onClick={() => onToggleGroup(group)}
                    disabled={isLoading}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[11px] transition-all hover:bg-white/8 disabled:opacity-50"
                    style={{
                      background: isEnabled ? `${info.color}20` : 'transparent',
                      color: isEnabled ? info.color : 'rgba(255,255,255,0.55)',
                      borderLeft: isEnabled ? `2px solid ${info.color}` : '2px solid transparent',
                    }}
                  >
                    <span className="text-base leading-none">{info.icon}</span>
                    <span className="flex-1 text-left">{info.name}</span>
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" style={{ color: info.color }} />
                    ) : (
                      <span className="text-[9px] opacity-70">
                        {loadedCount > 0 ? `${loadedCount}/${totalCount}` : totalCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[8px] text-white/25 mt-1.5 px-1 leading-tight">
              Groups load from the API when enabled
            </p>
          </div>
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
}: {
  dayOffset: number;
  isPlaying: boolean;
  speed: number;
  birthDate?: string;
  onStep: (days: number) => void;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onReset: () => void;
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
          isPlaying ? 'bg-indigo-500/40 text-indigo-300' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90'
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
        dayOffset === 0 ? 'text-white/50' : 'text-indigo-300'
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

      {dayOffset !== 0 && (
        <button onClick={onReset} className={btnClass} title="Reset to natal">
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function GalacticMode({ chart: initialChart, name, birthDate, visiblePlanets, visibleAspects, onFetchAsteroidData }: GalacticModeProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showAspects, setShowAspects] = useState(true);
  const [showHouses, setShowHouses] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePreset, setActivePreset] = useState<CameraPreset | null>(null);
  const [activePresetName, setActivePresetName] = useState<string>('Overview');
  const [objectPanelOpen, setObjectPanelOpen] = useState(false);
  const [enabledAsteroidGroups, setEnabledAsteroidGroups] = useState<Set<AsteroidGroup>>(new Set());
  const [loadingGroups, setLoadingGroups] = useState<Set<AsteroidGroup>>(new Set());
  const [extraPlanets, setExtraPlanets] = useState<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transit state
  const [transitDayOffset, setTransitDayOffset] = useState(0);
  const [transitPlaying, setTransitPlaying] = useState(false);
  const [transitSpeed, setTransitSpeed] = useState(1); // days per second

  // Merge initial chart planets with fetched asteroid data
  const chart = useMemo<GalacticNatalChart>(() => {
    if (Object.keys(extraPlanets).length === 0) return initialChart;
    return {
      ...initialChart,
      planets: { ...initialChart.planets, ...extraPlanets },
    };
  }, [initialChart, extraPlanets]);

  // Local planet visibility — initialized from 2D prop, can be modified locally
  const [localVisiblePlanets, setLocalVisiblePlanets] = useState<Set<string>>(() =>
    visiblePlanets ? new Set(visiblePlanets) : new Set(Object.keys(chart.planets))
  );

  // Sync from 2D prop when it changes (re-mount or prop update)
  useEffect(() => {
    if (visiblePlanets) {
      setLocalVisiblePlanets(new Set(visiblePlanets));
    }
  }, [visiblePlanets]);

  // Merge local visible + enabled asteroid groups
  const mergedVisiblePlanets = useMemo(() => {
    const merged = new Set(localVisiblePlanets);
    for (const group of enabledAsteroidGroups) {
      const asteroids = ASTEROID_GROUPS[group];
      if (asteroids) {
        for (const key of asteroids) {
          if (chart.planets[key]) {
            merged.add(key);
          }
        }
      }
    }
    return merged;
  }, [localVisiblePlanets, enabledAsteroidGroups, chart.planets]);

  // Ensure major aspects (including conjunction) are always included in galactic mode
  const mergedVisibleAspects = useMemo(() => {
    const base = visibleAspects ? new Set(visibleAspects) : new Set<string>();
    // Always include the 5 major aspects in 3D view
    for (const a of ['conjunction', 'sextile', 'square', 'trine', 'opposition']) {
      base.add(a);
    }
    return base;
  }, [visibleAspects]);

  const { planets3D, aspects } = useGalacticChart(chart, mergedVisiblePlanets, mergedVisibleAspects, transitDayOffset);
  const aspects3D = useAspectEnergy(aspects, planets3D);

  const selectedPlanetData = selectedPlanet
    ? planets3D.find((p) => p.key === selectedPlanet) ?? null
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
    if (key) setAutoRotate(false);
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

  const handleToggleAsteroidGroup = useCallback(async (group: AsteroidGroup) => {
    // If already enabled, just disable
    if (enabledAsteroidGroups.has(group)) {
      setEnabledAsteroidGroups(prev => {
        const next = new Set(prev);
        next.delete(group);
        return next;
      });
      return;
    }

    // Enable group
    setEnabledAsteroidGroups(prev => new Set(prev).add(group));

    // Check if we need to fetch data for this group's asteroids
    const members = ASTEROID_GROUPS[group] ?? [];
    const missingMembers = members.filter(k => !chart.planets[k]);
    if (missingMembers.length > 0 && onFetchAsteroidData) {
      setLoadingGroups(prev => new Set(prev).add(group));
      try {
        const result = await onFetchAsteroidData(missingMembers as string[]);
        // Merge fetched planets into extraPlanets
        setExtraPlanets(prev => ({ ...prev, ...result.chartA }));
      } catch (err) {
        console.error('Failed to fetch asteroid data:', err);
      } finally {
        setLoadingGroups(prev => {
          const next = new Set(prev);
          next.delete(group);
          return next;
        });
      }
    }
  }, [enabledAsteroidGroups, chart.planets, onFetchAsteroidData]);

  const handleTransitStep = useCallback((days: number) => {
    setTransitDayOffset(prev => prev + days);
  }, []);

  const handleTransitReset = useCallback(() => {
    setTransitDayOffset(0);
    setTransitPlaying(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

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
            visiblePlanets={mergedVisiblePlanets}
            visibleAspects={visibleAspects}
            selectedPlanet={selectedPlanet}
            onSelectPlanet={handleSelectPlanet}
            autoRotate={autoRotate}
            onInteractionStart={handleInteractionStart}
            showAspects={showAspects}
            showHouses={showHouses}
            activePreset={activePreset}
            transitDayOffset={transitDayOffset}
          />
          <GalacticEffects />
        </Canvas>
      </Suspense>

      {/* Top-left: title */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <div className={`w-2 h-2 rounded-full ${transitDayOffset !== 0 ? 'bg-amber-400' : 'bg-indigo-400'} animate-pulse`} />
          <span className="text-xs font-medium text-white/80">
            {name} · {transitDayOffset !== 0 ? 'Transit' : 'Galactic View'}
          </span>
        </div>
      </div>

      {/* Object toggle panel */}
      <ObjectPanel
        chartPlanets={chart.planets}
        localVisiblePlanets={mergedVisiblePlanets}
        enabledGroups={enabledAsteroidGroups}
        loadingGroups={loadingGroups}
        onTogglePlanet={handleTogglePlanet}
        onToggleGroup={handleToggleAsteroidGroup}
        isOpen={objectPanelOpen}
        onToggleOpen={() => setObjectPanelOpen(v => !v)}
      />

      {/* Top-right: controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setShowAspects(v => !v)}
          className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
            showAspects ? 'bg-indigo-500/30 text-indigo-300' : 'bg-black/50 text-white/50'
          }`}
          title={showAspects ? 'Hide aspects' : 'Show aspects'}
        >
          {showAspects ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setShowHouses(v => !v)}
          className={`p-2 rounded-lg backdrop-blur-sm transition-colors text-xs font-bold ${
            showHouses ? 'bg-indigo-500/30 text-indigo-300' : 'bg-black/50 text-white/50'
          }`}
          title={showHouses ? 'Hide houses' : 'Show houses'}
        >
          H
        </button>

        <button
          onClick={() => setAutoRotate(v => !v)}
          className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
            autoRotate ? 'bg-indigo-500/30 text-indigo-300' : 'bg-black/50 text-white/50'
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
      </div>

      {/* Bottom: Transit controls + camera presets */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        {/* Transit time slider */}
        <TransitControls
          dayOffset={transitDayOffset}
          isPlaying={transitPlaying}
          speed={transitSpeed}
          birthDate={birthDate}
          onStep={handleTransitStep}
          onTogglePlay={() => setTransitPlaying(v => !v)}
          onSetSpeed={setTransitSpeed}
          onReset={handleTransitReset}
        />

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

      {/* Planet info panel */}
      {selectedPlanetData && (
        <PlanetInfoPanel
          planet={selectedPlanetData}
          aspects={aspects3D}
          onClose={() => setSelectedPlanet(null)}
        />
      )}

      {/* Bottom-right: instructions */}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-white/30">
        Drag to rotate · Scroll to zoom · Click planet for details
      </div>
    </div>
  );
}
