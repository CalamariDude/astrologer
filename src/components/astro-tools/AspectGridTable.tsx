/**
 * Aspect Grid Table
 * Upper-triangle matrix showing unique planet pairs
 * Features: pattern cards, heatmap toggle, applying/separating arrows
 */

import { useState, useMemo, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { NatalChart } from '@/components/biwheel/types';
import { detectAspect } from '@/components/biwheel/utils/aspectCalculations';
import type { DetectedAspect } from '@/components/biwheel/utils/aspectCalculations';
import { PLANETS, PLANET_GROUPS } from '@/components/biwheel/utils/constants';
import { getSynastryInterpretation } from '@/data/synastryInterpretations';
import { detectAspectPatterns } from '@/lib/aspectPatterns';
import type { AspectPattern } from '@/lib/aspectPatterns';
import { getThemeForAspect, LIFE_THEMES } from '@/lib/astroThemes';

interface AspectGridTableProps {
  chartA: NatalChart;
  chartB?: NatalChart;
  nameA: string;
  nameB?: string;
}

const GRID_PLANETS = [...PLANET_GROUPS.core, ...PLANET_GROUPS.outer, 'chiron'] as string[];

// Planet speed order for applying/separating (faster = lower number)
const PLANET_SPEED: Record<string, number> = {
  moon: 1, mercury: 2, venus: 3, sun: 4, mars: 5,
  jupiter: 6, saturn: 7, uranus: 8, neptune: 9, pluto: 10,
  northnode: 9, southnode: 9, chiron: 7,
};

const PATTERN_ICONS: Record<string, string> = {
  grand_trine: '\u25B3',
  t_square: '\u22A4',
  grand_cross: '\u2720',
  yod: '\u261D',
  stellium: '\u2726',
};

function formatOrb(orb: number): string {
  const deg = Math.floor(orb);
  const min = Math.round((orb - deg) * 60);
  return `${deg}\u00B0${min.toString().padStart(2, '0')}'`;
}

function getCellStyle(nature: 'harmonious' | 'challenging' | 'neutral', strength: number) {
  const alpha = 0.08 + strength * 0.15;
  if (nature === 'harmonious') return { bg: `rgba(59, 130, 246, ${alpha})`, border: 'rgba(59, 130, 246, 0.3)' };
  if (nature === 'challenging') return { bg: `rgba(239, 68, 68, ${alpha})`, border: 'rgba(239, 68, 68, 0.3)' };
  return { bg: `rgba(245, 158, 11, ${alpha})`, border: 'rgba(245, 158, 11, 0.3)' };
}

function getHeatmapColor(nature: 'harmonious' | 'challenging' | 'neutral', strength: number) {
  const alpha = 0.15 + strength * 0.65;
  if (nature === 'harmonious') return `rgba(59, 130, 246, ${alpha})`;
  if (nature === 'challenging') return `rgba(239, 68, 68, ${alpha})`;
  return `rgba(245, 158, 11, ${alpha})`;
}

/** Determine if aspect is applying (faster planet moving toward exactitude) */
function isApplying(planetA: string, planetB: string): boolean | null {
  const speedA = PLANET_SPEED[planetA.toLowerCase()] ?? 5;
  const speedB = PLANET_SPEED[planetB.toLowerCase()] ?? 5;
  if (speedA === speedB) return null;
  return speedA < speedB;
}

/** Classify aspect by orb tightness and application */
type AspectClass = 'exactitude' | 'applying' | 'true' | 'forced' | 'fringe' | 'separating';

interface AspectClassInfo {
  label: string;
  abbrev: string;
  color: string;
  bgClass: string;
}

const ASPECT_CLASS_INFO: Record<AspectClass, AspectClassInfo> = {
  exactitude: { label: 'Exactitude', abbrev: 'EX', color: '#8b5cf6', bgClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30' },
  applying:   { label: 'Applying',   abbrev: 'AP', color: '#22c55e', bgClass: 'bg-green-500/15 text-green-600 dark:text-green-400 ring-1 ring-green-500/30' },
  true:       { label: 'True',       abbrev: 'TR', color: '#3b82f6', bgClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30' },
  forced:     { label: 'Forced',     abbrev: 'FO', color: '#f59e0b', bgClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30' },
  fringe:     { label: 'Fringe',     abbrev: 'FR', color: '#9ca3af', bgClass: 'bg-gray-500/15 text-gray-500 dark:text-gray-400 ring-1 ring-gray-500/30' },
  separating: { label: 'Separating', abbrev: 'SE', color: '#ef4444', bgClass: 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/30' },
};

function classifyAspect(orb: number, applying: boolean | null, maxOrb: number): AspectClass {
  // Exactitude: within 0.5 degrees of exact
  if (orb <= 0.5) return 'exactitude';
  // True: tight orb (within 30% of max orb) — strong and well-formed
  if (orb <= maxOrb * 0.3) {
    return applying === true ? 'applying' : applying === false ? 'separating' : 'true';
  }
  // Standard: within 60% of max orb
  if (orb <= maxOrb * 0.6) {
    return applying === true ? 'applying' : applying === false ? 'separating' : 'true';
  }
  // Forced: wider orb, 60-80% of max
  if (orb <= maxOrb * 0.8) return 'forced';
  // Fringe: at the outer edge (80-100% of max)
  return 'fringe';
}

function PatternCard({ pattern }: { pattern: AspectPattern }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-inset transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: pattern.color + '10',
              ringColor: pattern.color + '30',
            }}
          >
            <span className="text-lg" style={{ color: pattern.color }}>{PATTERN_ICONS[pattern.type] || '\u2726'}</span>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold">{pattern.name}</span>
                {pattern.element && (
                  <span className="text-[9px] text-muted-foreground capitalize">({pattern.element})</span>
                )}
                {pattern.sign && (
                  <span className="text-[9px] text-muted-foreground">{pattern.sign}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {pattern.planets.map(p => {
                  const info = PLANETS[p as keyof typeof PLANETS];
                  return (
                    <span key={p} className="text-base" style={{ color: info?.color }} title={info?.name}>
                      {info?.symbol}
                    </span>
                  );
                })}
                {pattern.apex && (
                  <span className="text-[9px] text-muted-foreground ml-1">
                    apex: {PLANETS[pattern.apex as keyof typeof PLANETS]?.symbol}
                  </span>
                )}
              </div>
            </div>
            {/* Strength bar */}
            <div className="w-10 h-1.5 rounded-full bg-muted/40 overflow-hidden ml-auto">
              <div className="h-full rounded-full" style={{ width: `${pattern.avgStrength * 100}%`, backgroundColor: pattern.color }} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          {pattern.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const CELL_CLASS = "w-12 h-10 md:w-20 md:h-14";

function AspectCell({ aspect, planetA, planetB, viewMode, isSynastry }: {
  aspect: DetectedAspect | null;
  planetA: string;
  planetB: string;
  viewMode: 'symbols' | 'heatmap';
  isSynastry: boolean;
}) {
  if (!aspect) {
    return (
      <td className={`${CELL_CLASS} text-center`}>
        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 text-xs">&middot;</div>
      </td>
    );
  }

  // Heatmap mode: colored rectangle only
  if (viewMode === 'heatmap') {
    return (
      <td className={`${CELL_CLASS} p-0.5`}>
        <div
          className="w-full h-full rounded-md"
          style={{ backgroundColor: getHeatmapColor(aspect.nature, aspect.strength) }}
          title={`${aspect.name} ${formatOrb(aspect.exactOrb)}`}
        />
      </td>
    );
  }

  const style = getCellStyle(aspect.nature, aspect.strength);
  const interpretation = isSynastry ? getSynastryInterpretation(planetA, planetB, aspect.type) : null;
  const applying = isApplying(planetA, planetB);
  const aspectClass = classifyAspect(aspect.exactOrb, applying, aspect.orb);
  const classInfo = ASPECT_CLASS_INFO[aspectClass];

  return (
    <td className={`${CELL_CLASS} p-0.5`}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="w-full h-full rounded-md flex flex-col items-center justify-center gap-0 transition-all hover:scale-110 hover:shadow-md cursor-pointer relative"
            style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}
          >
            <span className="text-base md:text-xl leading-none" style={{ color: aspect.color }}>{aspect.symbol}</span>
            <span className="text-[8px] md:text-[10px] leading-none text-muted-foreground mt-0.5">{formatOrb(aspect.exactOrb)}</span>
            {/* Classification badge */}
            <span
              className="absolute top-0 right-0 text-[7px] md:text-[8px] leading-none font-bold px-0.5 rounded-bl"
              style={{ color: classInfo.color, backgroundColor: classInfo.color + '15' }}
            >
              {classInfo.abbrev}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 md:w-80 p-0 overflow-hidden" side="top">
          <div className="p-1 text-xs text-center font-medium text-white"
            style={{ backgroundColor: aspect.nature === 'harmonious' ? '#3b82f6' : aspect.nature === 'challenging' ? '#ef4444' : '#f59e0b' }}>
            {aspect.name} &mdash; {aspect.nature}
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span style={{ color: PLANETS[planetA as keyof typeof PLANETS]?.color }} className="font-medium">
                {PLANETS[planetA as keyof typeof PLANETS]?.symbol} {PLANETS[planetA as keyof typeof PLANETS]?.name}
              </span>
              <span style={{ color: aspect.color }} className="text-lg">{aspect.symbol}</span>
              <span style={{ color: PLANETS[planetB as keyof typeof PLANETS]?.color }} className="font-medium">
                {PLANETS[planetB as keyof typeof PLANETS]?.symbol} {PLANETS[planetB as keyof typeof PLANETS]?.name}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <span>Orb: {formatOrb(aspect.exactOrb)}</span>
              <span>&bull;</span>
              <span>Strength: {Math.round(aspect.strength * 100)}%</span>
              <span>&bull;</span>
              <span className={`font-medium px-1.5 py-0.5 rounded-md text-[10px] ${classInfo.bgClass}`}>
                {classInfo.label}
              </span>
            </div>
            {/* Strength bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${aspect.strength * 100}%`,
                backgroundColor: aspect.color,
              }} />
            </div>
            {/* Theme tag */}
            {(() => {
              const theme = getThemeForAspect(planetA, planetB);
              if (!theme) return null;
              const Icon = theme.icon;
              return (
                <div className="flex items-center gap-1.5 pt-1.5">
                  <Icon className="w-3 h-3" style={{ color: theme.color }} />
                  <span className="text-[10px] font-medium" style={{ color: theme.color }}>{theme.shortName}</span>
                </div>
              );
            })()}
            {interpretation && (
              <div className="pt-2 border-t space-y-1">
                <p className="text-xs font-semibold">{interpretation.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{interpretation.description}</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </td>
  );
}

export function AspectGridTable({ chartA, chartB, nameA, nameB }: AspectGridTableProps) {
  const [showMinor, setShowMinor] = useState(false);
  const [viewMode, setViewMode] = useState<'symbols' | 'heatmap'>('symbols');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isSynastry = !!chartB;
  const planetsA = chartA.planets;
  const planetsB = chartB?.planets || chartA.planets;

  const availablePlanetsA = GRID_PLANETS.filter(p => planetsA[p]?.longitude !== undefined);
  const availablePlanetsB = GRID_PLANETS.filter(p => planetsB[p]?.longitude !== undefined);

  const rowPlanets = availablePlanetsA;
  const colPlanets = isSynastry ? availablePlanetsB : availablePlanetsA;

  // Detect aspect patterns
  const patterns = useMemo(
    () => detectAspectPatterns(chartA, chartB, { includeMinor: showMinor }),
    [chartA, chartB, showMinor]
  );

  // Count aspects
  const counts = useMemo(() => {
    let harmonious = 0, challenging = 0, neutral = 0;
    const allowedAspects = showMinor ? undefined : new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition'] as const);

    for (let r = 0; r < rowPlanets.length; r++) {
      for (let c = 0; c < colPlanets.length; c++) {
        if (c <= r) continue;
        const longA = planetsA[rowPlanets[r]]?.longitude;
        const longB = planetsB[colPlanets[c]]?.longitude;
        if (longA === undefined || longB === undefined) continue;
        const aspect = detectAspect(longA, longB, allowedAspects as any, rowPlanets[r], colPlanets[c]);
        if (aspect) {
          if (aspect.nature === 'harmonious') harmonious++;
          else if (aspect.nature === 'challenging') challenging++;
          else neutral++;
        }
      }
    }
    return { harmonious, challenging, neutral, total: harmonious + challenging + neutral };
  }, [rowPlanets, colPlanets, planetsA, planetsB, showMinor]);

  // Theme breakdown
  const themeCounts = useMemo(() => {
    const allowedAspects = showMinor ? undefined : new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition'] as const);
    const result: Record<string, number> = {};
    for (const key of Object.keys(LIFE_THEMES)) result[key] = 0;

    for (let r = 0; r < rowPlanets.length; r++) {
      for (let c = 0; c < colPlanets.length; c++) {
        if (c <= r) continue;
        const longA = planetsA[rowPlanets[r]]?.longitude;
        const longB = planetsB[colPlanets[c]]?.longitude;
        if (longA === undefined || longB === undefined) continue;
        const aspect = detectAspect(longA, longB, allowedAspects as any, rowPlanets[r], colPlanets[c]);
        if (aspect) {
          const theme = getThemeForAspect(rowPlanets[r], colPlanets[c]);
          if (theme) result[theme.key]++;
        }
      }
    }
    return result;
  }, [rowPlanets, colPlanets, planetsA, planetsB, showMinor]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm md:text-base font-semibold">
            {isSynastry ? 'Synastry Aspects' : 'Natal Aspects'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isSynastry ? `${nameA} \u00D7 ${nameB}` : nameA} &mdash; {counts.total} aspects found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Minor</label>
            <Switch checked={showMinor} onCheckedChange={setShowMinor} />
          </div>
        </div>
      </div>

      {/* Summary Pills */}
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px] md:text-xs font-medium text-blue-700 dark:text-blue-300">{counts.harmonious} harmonious</span>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[11px] md:text-xs font-medium text-red-700 dark:text-red-300">{counts.challenging} challenging</span>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[11px] md:text-xs font-medium text-amber-700 dark:text-amber-300">{counts.neutral} neutral</span>
        </div>
      </div>

      {/* Theme Breakdown */}
      {counts.total > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(LIFE_THEMES).map(([key, theme]) => {
            const count = themeCounts[key] || 0;
            if (count === 0) return null;
            const Icon = theme.icon;
            return (
              <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${theme.bgClass} ring-1 ${theme.ringClass}`}>
                <Icon className="w-3 h-3" style={{ color: theme.color }} />
                <span className="text-[11px] font-medium" style={{ color: theme.color }}>{theme.shortName}</span>
                <span className="text-[10px] text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pattern Cards */}
      {patterns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {patterns.map((pattern, i) => (
            <PatternCard key={i} pattern={pattern} />
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border bg-card/50">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className={`${CELL_CLASS} sticky left-0 z-10 bg-muted/80 backdrop-blur-sm`} />
              {colPlanets.map(planet => {
                const info = PLANETS[planet as keyof typeof PLANETS];
                return (
                  <th key={planet} className={`${CELL_CLASS} text-center bg-muted/40`}>
                    <div className="flex flex-col items-center gap-0">
                      <span className="text-lg md:text-2xl" style={{ color: info?.color }}>{info?.symbol}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground leading-none">{info?.name?.slice(0, 3)}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowPlanets.map((rowPlanet, rowIdx) => {
              const rowInfo = PLANETS[rowPlanet as keyof typeof PLANETS];
              return (
                <tr key={rowPlanet}>
                  <td className={`${CELL_CLASS} text-center sticky left-0 z-10 bg-muted/80 backdrop-blur-sm`}>
                    <div className="flex flex-col items-center gap-0">
                      <span className="text-lg md:text-2xl" style={{ color: rowInfo?.color }}>{rowInfo?.symbol}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground leading-none">{rowInfo?.name?.slice(0, 3)}</span>
                    </div>
                  </td>
                  {colPlanets.map((colPlanet, colIdx) => {
                    // Upper triangle only — skip diagonal and below
                    if (colIdx <= rowIdx) {
                      return <td key={colPlanet} className={`${CELL_CLASS} bg-muted/10`} />;
                    }

                    const longA = planetsA[rowPlanet]?.longitude;
                    const longB = planetsB[colPlanet]?.longitude;
                    if (longA === undefined || longB === undefined) {
                      return <td key={colPlanet} className="w-20 h-14" />;
                    }

                    const allowedAspects = showMinor ? undefined : new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition'] as const);
                    const aspect = detectAspect(longA, longB, allowedAspects as any, rowPlanet, colPlanet);

                    return (
                      <AspectCell
                        key={colPlanet}
                        aspect={aspect}
                        planetA={rowPlanet}
                        planetB={colPlanet}
                        viewMode={viewMode}
                        isSynastry={isSynastry}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Aspect Classification Legend */}
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs text-muted-foreground px-1">
        <span className="font-medium text-foreground/70 mr-1 text-[11px] md:text-xs">Classification:</span>
        {(Object.entries(ASPECT_CLASS_INFO) as [AspectClass, AspectClassInfo][]).map(([key, info]) => (
          <div key={key} className={`flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 rounded-md ${info.bgClass}`}>
            <span className="font-bold text-[9px] md:text-[10px]">{info.abbrev}</span>
            <span className="text-[10px] md:text-xs hidden sm:inline">{info.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
