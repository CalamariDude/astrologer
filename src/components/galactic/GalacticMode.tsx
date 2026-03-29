/**
 * GalacticMode — 3D Chart
 * Renders the actual 2D BiWheelSynastry SVG chart flat in 3D space.
 * The chart is IDENTICAL to the 2D version — same readability, same features.
 * 3D adds: orbit controls to tilt/rotate, star background, cosmic atmosphere.
 * Sidebar on the right with full chart options.
 */

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Maximize2, Minimize2, Settings2 } from 'lucide-react';
import { Chart3DScene } from './Chart3DScene';
import { BiWheelSynastry } from '../biwheel/BiWheelSynastry';
import { TogglePanelContent } from '../biwheel/controls/TogglePanelContent';
import { DEFAULT_VISIBLE_PLANETS, applyTheme } from '../biwheel/utils/constants';
import type { ThemeName } from '../biwheel/utils/themes';
import type { GalacticNatalChart } from './types';
import type { AspectType } from '../biwheel/utils/aspectCalculations';
import type { AsteroidGroup, FixedStarGroup } from '../biwheel/types';

interface GalacticModeProps {
  chart: GalacticNatalChart;
  name: string;
  birthDate?: string;
  visiblePlanets?: Set<string>;
  visibleAspects?: Set<string>;
  onFetchAsteroidData?: (asteroids: string[]) => Promise<{ chartA: Record<string, any>; chartB: Record<string, any> }>;
  fullscreenButtonRef?: React.MutableRefObject<(() => void) | null>;
  onFetchFixedStarData?: (groups: string[]) => Promise<Record<string, any>>;
  onRefetchWithHouseSystem?: (system: string) => void;
}

function Chart3DEffects() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.35} luminanceSmoothing={0.7} intensity={0.5} radius={0.4} />
      <Vignette eskil={false} offset={0.1} darkness={0.6} />
    </EffectComposer>
  );
}

// Chart size for the SVG — rendered at this resolution then scaled into 3D
const CHART_SIZE = 700;

export default function GalacticMode({
  chart,
  name,
  visiblePlanets: externalVisiblePlanets,
  visibleAspects: externalVisibleAspects,
  fullscreenButtonRef,
  onRefetchWithHouseSystem,
  onFetchAsteroidData,
  onFetchFixedStarData,
}: GalacticModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Load saved defaults ──
  const savedDefaults = useMemo(() => {
    try {
      const raw = localStorage.getItem('biwheel-chart-defaults');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }, []);

  // ── Chart options state ──
  const [visiblePlanets, setVisiblePlanets] = useState<Set<string>>(
    externalVisiblePlanets || (savedDefaults?.visiblePlanets ? new Set(savedDefaults.visiblePlanets) : new Set(DEFAULT_VISIBLE_PLANETS))
  );
  const [visibleAspects, setVisibleAspects] = useState<Set<string>>(
    externalVisibleAspects || (savedDefaults?.visibleAspects ? new Set(savedDefaults.visibleAspects) : new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare']))
  );
  const [showHouses, setShowHouses] = useState(savedDefaults?.showHouses ?? true);
  const [showDegreeMarkers, setShowDegreeMarkers] = useState(savedDefaults?.showDegreeMarkers ?? true);
  const [showRetrogrades, setShowRetrogrades] = useState(savedDefaults?.showRetrogrades ?? true);
  const [showDecans, setShowDecans] = useState(savedDefaults?.showDecans ?? false);
  const [degreeSymbolMode, setDegreeSymbolMode] = useState<'sign' | 'degree'>(savedDefaults?.degreeSymbolMode ?? 'sign');
  const [houseSystem, setHouseSystem] = useState<string>(savedDefaults?.houseSystem ?? 'whole_sign');
  const houseSystemInitRef = useRef(true);
  useEffect(() => {
    if (houseSystemInitRef.current) { houseSystemInitRef.current = false; return; }
    onRefetchWithHouseSystem?.(houseSystem);
  }, [houseSystem]); // eslint-disable-line react-hooks/exhaustive-deps
  const [customAspectOrbs, setCustomAspectOrbs] = useState<Record<string, number>>(savedDefaults?.customAspectOrbs ?? {});
  const [customSeparatingAspectOrbs, setCustomSeparatingAspectOrbs] = useState<Record<string, number>>(savedDefaults?.customSeparatingAspectOrbs ?? {});
  const [customPlanetOrbs, setCustomPlanetOrbs] = useState<Record<string, number>>(savedDefaults?.customPlanetOrbs ?? {});
  const [harmonicNumber, setHarmonicNumber] = useState<number>(savedDefaults?.harmonicNumber ?? 1);
  const [zodiacType, setZodiacType] = useState<'tropical' | 'sidereal' | 'draconic'>(savedDefaults?.zodiacType ?? 'tropical');
  const [ayanamsaKey, setAyanamsaKey] = useState<string>(savedDefaults?.ayanamsaKey ?? 'lahiri');
  const [rotateToAscendant, setRotateToAscendant] = useState(savedDefaults?.rotateToAscendant ?? true);
  const [zodiacVantage, setZodiacVantage] = useState<number | null>(null);
  const [enabledAsteroidGroups, setEnabledAsteroidGroups] = useState<Set<AsteroidGroup>>(
    savedDefaults?.enabledAsteroidGroups ? new Set(savedDefaults.enabledAsteroidGroups) : new Set()
  );
  const [enabledFixedStarGroups, setEnabledFixedStarGroups] = useState<Set<FixedStarGroup>>(
    savedDefaults?.enabledFixedStarGroups ? new Set(savedDefaults.enabledFixedStarGroups) : new Set()
  );
  const [straightAspects, setStraightAspects] = useState(savedDefaults?.straightAspects ?? true);

  // ── Apply dark theme for panel ──
  const prevThemeRef = useRef<string | null>(null);
  useEffect(() => {
    prevThemeRef.current = localStorage.getItem('astrologer_theme') || 'classic';
    applyTheme('midnight' as ThemeName);
    return () => { if (prevThemeRef.current) applyTheme(prevThemeRef.current as ThemeName); };
  }, []);

  // ── Panel & fullscreen state ──
  const [panelOpen, setPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  }, []);

  useEffect(() => {
    if (fullscreenButtonRef) fullscreenButtonRef.current = toggleFullscreen;
  }, [fullscreenButtonRef, toggleFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Toggle helpers ──
  const togglePlanet = useCallback((p: string) => setVisiblePlanets(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; }), []);
  const toggleAspect = useCallback((a: string) => setVisibleAspects(prev => { const n = new Set(prev); n.has(a) ? n.delete(a) : n.add(a); return n; }), []);
  const enablePlanetGroup = useCallback((g: 'core' | 'outer' | 'asteroids') => {
    const groups: Record<string, string[]> = { core: ['sun','moon','mercury','venus','mars','jupiter','saturn','northnode','southnode'], outer: ['uranus','neptune','pluto'], asteroids: ['chiron','lilith','juno','ceres','pallas','vesta'] };
    setVisiblePlanets(prev => { const n = new Set(prev); groups[g]?.forEach(p => n.add(p)); return n; });
  }, []);
  const disablePlanetGroup = useCallback((g: 'core' | 'outer' | 'asteroids') => {
    const groups: Record<string, string[]> = { core: ['sun','moon','mercury','venus','mars','jupiter','saturn','northnode','southnode'], outer: ['uranus','neptune','pluto'], asteroids: ['chiron','lilith','juno','ceres','pallas','vesta'] };
    setVisiblePlanets(prev => { const n = new Set(prev); groups[g]?.forEach(p => n.delete(p)); return n; });
  }, []);
  const enableMinorAspects = useCallback(() => setVisibleAspects(prev => { const n = new Set(prev); ['quincunx','semisextile','semisquare','sesquiquadrate'].forEach(a => n.add(a)); return n; }), []);
  const disableMinorAspects = useCallback(() => setVisibleAspects(prev => { const n = new Set(prev); ['quincunx','semisextile','semisquare','sesquiquadrate'].forEach(a => n.delete(a)); return n; }), []);
  const toggleAsteroidGroup = useCallback((g: AsteroidGroup) => setEnabledAsteroidGroups(prev => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; }), []);
  const toggleFixedStarGroup = useCallback((g: FixedStarGroup) => setEnabledFixedStarGroups(prev => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; }), []);

  const handleSaveAsDefault = useCallback(() => {
    localStorage.setItem('biwheel-chart-defaults', JSON.stringify({
      visiblePlanets: [...visiblePlanets], visibleAspects: [...visibleAspects],
      showHouses, showDegreeMarkers, showRetrogrades, showDecans, degreeSymbolMode,
      rotateToAscendant, enabledAsteroidGroups: [...enabledAsteroidGroups],
      enabledFixedStarGroups: [...enabledFixedStarGroups], customAspectOrbs,
      customSeparatingAspectOrbs, customPlanetOrbs, harmonicNumber, houseSystem,
      zodiacType, ayanamsaKey, straightAspects,
    }));
  }, [visiblePlanets, visibleAspects, showHouses, showDegreeMarkers, showRetrogrades, showDecans, degreeSymbolMode, rotateToAscendant, enabledAsteroidGroups, enabledFixedStarGroups, customAspectOrbs, customSeparatingAspectOrbs, customPlanetOrbs, harmonicNumber, houseSystem, zodiacType, ayanamsaKey, straightAspects]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-lg overflow-hidden bg-[#050510] flex ${
        isFullscreen ? 'h-screen' : 'h-[calc(100vh-160px)] min-h-[500px]'
      }`}
    >
      {/* Main chart area */}
      <div className="relative flex-1 h-full order-1">
        {/* 3D background — stars, cosmic dust, glow */}
        <Canvas
          camera={{ position: [0, 14, 0.01], fov: 55, near: 0.1, far: 250 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        >
          <Suspense fallback={null}>
            <Chart3DScene />
            <Chart3DEffects />
          </Suspense>
        </Canvas>

        {/* 2D SVG chart — rendered as normal DOM on top of the 3D background */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
          <div style={{ width: CHART_SIZE, height: CHART_SIZE, maxWidth: '100%', maxHeight: '100%' }}>
            <BiWheelSynastry
              chartA={chart}
              chartB={chart}
              nameA={name}
              nameB={name}
              size={CHART_SIZE}
              showTogglePanel={false}
              initialChartMode="personA"
              initialVisiblePlanets={visiblePlanets}
              initialVisibleAspects={visibleAspects as Set<any>}
              initialShowHouses={showHouses}
              initialShowDegreeMarkers={showDegreeMarkers}
              initialStraightAspects={straightAspects}
              onRefetchWithHouseSystem={onRefetchWithHouseSystem}
              onFetchAsteroidData={onFetchAsteroidData}
              onFetchFixedStarData={onFetchFixedStarData}
            />
          </div>
        </div>

        {/* Top-left: name */}
        <div className="absolute top-3 left-3 pointer-events-none z-20">
          <span className="text-white/50 text-xs font-medium tracking-wide">{name}</span>
        </div>

        {/* Top-right: controls */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
          {!panelOpen && (
            <button onClick={() => setPanelOpen(true)} className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 text-white/50 hover:text-white/80 transition-colors" title="Open chart options">
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={toggleFullscreen} className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 text-white/50 hover:text-white/80 transition-colors" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Bottom hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <span className="text-white/25 text-[10px] tracking-wider">Scroll to zoom</span>
        </div>
      </div>

      {/* Right sidebar: Chart Options */}
      {panelOpen && (
        <div className="h-full overflow-y-auto overflow-x-hidden flex-shrink-0 border-l border-white/15 order-2" style={{ width: 250, background: 'rgba(15, 15, 35, 0.97)', color: '#e0e0e0' }}>
          <div className="px-3 py-3" style={{ color: '#e0e0e0' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Chart Options</span>
              <button onClick={() => setPanelOpen(false)} className="p-1 rounded text-white/40 hover:text-white/70 transition-colors" title="Close panel">
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <TogglePanelContent
              visiblePlanets={visiblePlanets}
              visibleAspects={visibleAspects as Set<AspectType>}
              showHouses={showHouses}
              showDegreeMarkers={showDegreeMarkers}
              showRetrogrades={showRetrogrades}
              onTogglePlanet={togglePlanet}
              onToggleAspect={toggleAspect as (aspect: AspectType) => void}
              onSetShowHouses={setShowHouses}
              onSetShowDegreeMarkers={setShowDegreeMarkers}
              onSetShowRetrogrades={setShowRetrogrades}
              showDecans={showDecans}
              onSetShowDecans={setShowDecans}
              degreeSymbolMode={degreeSymbolMode}
              onSetDegreeSymbolMode={setDegreeSymbolMode}
              straightAspects={straightAspects}
              onSetStraightAspects={setStraightAspects}
              onEnablePlanetGroup={enablePlanetGroup}
              onDisablePlanetGroup={disablePlanetGroup}
              onEnableMinorAspects={enableMinorAspects}
              onDisableMinorAspects={disableMinorAspects}
              nameA={name}
              rotateToAscendant={rotateToAscendant}
              onSetRotateToAscendant={setRotateToAscendant}
              zodiacVantage={zodiacVantage}
              onSetZodiacVantage={setZodiacVantage}
              enableAsteroids={true}
              enabledAsteroidGroups={enabledAsteroidGroups}
              onToggleAsteroidGroup={toggleAsteroidGroup}
              onEnableAllAsteroids={() => { const a = new Set(enabledAsteroidGroups); (['chiron','lilith','ceres','pallas','juno','vesta'] as AsteroidGroup[]).forEach(g => a.add(g)); setEnabledAsteroidGroups(a); }}
              onDisableAllAsteroids={() => setEnabledAsteroidGroups(new Set())}
              enableFixedStars={true}
              enabledFixedStarGroups={enabledFixedStarGroups}
              onToggleFixedStarGroup={toggleFixedStarGroup}
              onEnableAllFixedStars={() => { const a = new Set(enabledFixedStarGroups); (['royal_stars','behenian_stars','navigational_stars','nebulae_clusters'] as FixedStarGroup[]).forEach(g => a.add(g)); setEnabledFixedStarGroups(a); }}
              onDisableAllFixedStars={() => setEnabledFixedStarGroups(new Set())}
              houseSystem={houseSystem}
              onSetHouseSystem={setHouseSystem}
              customAspectOrbs={customAspectOrbs}
              customSeparatingAspectOrbs={customSeparatingAspectOrbs}
              customPlanetOrbs={customPlanetOrbs}
              onSetCustomAspectOrb={(a, o) => setCustomAspectOrbs(p => ({ ...p, [a]: o }))}
              onSetCustomSeparatingAspectOrb={(a, o) => setCustomSeparatingAspectOrbs(p => ({ ...p, [a]: o }))}
              onSetCustomPlanetOrb={(p, o) => setCustomPlanetOrbs(prev => ({ ...prev, [p]: o }))}
              onResetOrbs={() => { setCustomAspectOrbs({}); setCustomSeparatingAspectOrbs({}); setCustomPlanetOrbs({}); }}
              harmonicNumber={harmonicNumber}
              onSetHarmonicNumber={setHarmonicNumber}
              zodiacType={zodiacType}
              onSetZodiacType={setZodiacType}
              ayanamsaKey={ayanamsaKey}
              onSetAyanamsaKey={setAyanamsaKey}
              onSaveAsDefault={handleSaveAsDefault}
            />
          </div>
        </div>
      )}
    </div>
  );
}
