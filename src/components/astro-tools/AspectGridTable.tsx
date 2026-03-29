/**
 * Aspect Grid Table
 * Upper-triangle matrix showing unique planet pairs
 * Features: pattern cards, heatmap toggle, applying/separating arrows
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { NatalChart } from '@/components/biwheel/types';
import { detectAspect } from '@/components/biwheel/utils/aspectCalculations';
import type { DetectedAspect } from '@/components/biwheel/utils/aspectCalculations';
import { PLANETS, PLANET_GROUPS, PLANET_ORBS, ASPECTS } from '@/components/biwheel/utils/constants';
import { getSynastryInterpretation } from '@/data/synastryInterpretations';
import { getNatalInterpretation } from '@/data/natalInterpretations';
import { getCompositeInterpretation } from '@/data/compositeInterpretations';
import { detectAspectPatterns } from '@/lib/aspectPatterns';
import type { AspectPattern } from '@/lib/aspectPatterns';
import { getThemeForAspect, LIFE_THEMES } from '@/lib/astroThemes';

interface AspectGridTableProps {
  chartA: NatalChart;
  chartB?: NatalChart;
  nameA: string;
  nameB?: string;
  /** When provided, only these planets appear in the grid (synced from chart options) */
  visiblePlanets?: Set<string>;
  /** When provided, only these aspect types appear in the grid (synced from chart options) */
  visibleAspects?: Set<string>;
  /** Current chart mode — determines which interpretation set to use */
  chartMode?: 'personA' | 'personB' | 'synastry' | 'composite';
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

/** Orb tightness classification (independent of direction) */
type OrbTightness = 'exact' | 'tight' | 'moderate' | 'wide' | 'fringe';

interface TightnessInfo {
  label: string;
  abbrev: string;
  color: string;
  bgClass: string;
}

const TIGHTNESS_INFO: Record<OrbTightness, TightnessInfo> = {
  exact:    { label: 'Exact',    abbrev: 'EX', color: '#8b5cf6', bgClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30' },
  tight:    { label: 'Tight',    abbrev: 'TI', color: '#3b82f6', bgClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30' },
  moderate: { label: 'Moderate', abbrev: 'MO', color: '#22c55e', bgClass: 'bg-green-500/15 text-green-600 dark:text-green-400 ring-1 ring-green-500/30' },
  wide:     { label: 'Wide',     abbrev: 'WI', color: '#f59e0b', bgClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30' },
  fringe:   { label: 'Fringe',   abbrev: 'FR', color: '#9ca3af', bgClass: 'bg-gray-500/15 text-gray-500 dark:text-gray-400 ring-1 ring-gray-500/30' },
};

/** Direction classification */
interface DirectionInfo {
  label: string;
  abbrev: string;
  color: string;
  bgClass: string;
}

const DIRECTION_INFO: Record<'applying' | 'separating', DirectionInfo> = {
  applying:   { label: 'Applying',   abbrev: 'AP', color: '#22c55e', bgClass: 'bg-green-500/15 text-green-600 dark:text-green-400 ring-1 ring-green-500/30' },
  separating: { label: 'Separating', abbrev: 'SE', color: '#ef4444', bgClass: 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/30' },
};

function classifyTightness(orb: number, maxOrb: number): OrbTightness {
  if (orb <= 0.5) return 'exact';
  if (orb <= maxOrb * 0.3) return 'tight';
  if (orb <= maxOrb * 0.6) return 'moderate';
  if (orb <= maxOrb * 0.8) return 'wide';
  return 'fringe';
}

// ── Element / Modality Balance ───────────────────────────────────────

type Element = 'fire' | 'earth' | 'air' | 'water';
type Modality = 'cardinal' | 'fixed' | 'mutable';

const SIGN_QUALITIES: { element: Element; modality: Modality }[] = [
  { element: 'fire', modality: 'cardinal' },   // Aries
  { element: 'earth', modality: 'fixed' },      // Taurus
  { element: 'air', modality: 'mutable' },      // Gemini
  { element: 'water', modality: 'cardinal' },   // Cancer
  { element: 'fire', modality: 'fixed' },       // Leo
  { element: 'earth', modality: 'mutable' },    // Virgo
  { element: 'air', modality: 'cardinal' },     // Libra
  { element: 'water', modality: 'fixed' },      // Scorpio
  { element: 'fire', modality: 'mutable' },     // Sagittarius
  { element: 'earth', modality: 'cardinal' },   // Capricorn
  { element: 'air', modality: 'fixed' },        // Aquarius
  { element: 'water', modality: 'mutable' },    // Pisces
];

const ELEMENTS: Element[] = ['fire', 'earth', 'air', 'water'];
const MODALITIES: Modality[] = ['cardinal', 'fixed', 'mutable'];

const ELEMENT_DISPLAY: Record<Element, { label: string; short: string; color: string }> = {
  fire:  { label: 'Fire',  short: 'Fi', color: '#ef4444' },
  earth: { label: 'Earth', short: 'Ea', color: '#22c55e' },
  air:   { label: 'Air',   short: 'Ai', color: '#eab308' },
  water: { label: 'Water', short: 'Wa', color: '#3b82f6' },
};

const MODALITY_DISPLAY: Record<Modality, { label: string; short: string }> = {
  cardinal: { label: 'Cardinal', short: 'Car' },
  fixed:    { label: 'Fixed',    short: 'Fix' },
  mutable:  { label: 'Mutable',  short: 'Mut' },
};

function computeBalance(planets: Record<string, any>, planetKeys: string[]) {
  const grid: Record<Element, Record<Modality, string[]>> = {
    fire: { cardinal: [], fixed: [], mutable: [] },
    earth: { cardinal: [], fixed: [], mutable: [] },
    air: { cardinal: [], fixed: [], mutable: [] },
    water: { cardinal: [], fixed: [], mutable: [] },
  };

  for (const key of planetKeys) {
    const p = planets[key];
    if (!p || p.longitude === undefined) continue;
    const signIdx = Math.floor(p.longitude / 30) % 12;
    const { element, modality } = SIGN_QUALITIES[signIdx];
    grid[element][modality].push(key);
  }

  return grid;
}

const BALANCE_START = 5; // Row index where balance table starts (Jupiter)

function BalanceTable({ chart, planetKeys, chartLabel }: { chart: NatalChart; planetKeys: string[]; chartLabel?: string }) {
  const balance = useMemo(() => computeBalance(chart.planets, planetKeys), [chart.planets, planetKeys]);

  const elTotals: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const modTotals: Record<Modality, number> = { cardinal: 0, fixed: 0, mutable: 0 };

  for (const el of ELEMENTS) {
    for (const mod of MODALITIES) {
      const count = balance[el][mod].length;
      elTotals[el] += count;
      modTotals[mod] += count;
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-1.5 bg-card/90 rounded-lg border border-border/50 p-2.5 shadow-sm">
      {chartLabel && <span className="text-[9px] md:text-[10px] font-semibold text-muted-foreground">{chartLabel}</span>}
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="p-0 w-7" />
            {MODALITIES.map(mod => (
              <th key={mod} className="px-1.5 py-1 text-[8px] md:text-[10px] text-muted-foreground font-semibold border-b border-border/30">
                {MODALITY_DISPLAY[mod].short}
              </th>
            ))}
            <th className="px-1.5 py-1 text-[8px] md:text-[10px] text-muted-foreground font-bold border-b border-border/30 border-l border-border/20">&Sigma;</th>
          </tr>
        </thead>
        <tbody>
          {ELEMENTS.map(el => {
            const d = ELEMENT_DISPLAY[el];
            return (
              <tr key={el}>
                <td className="px-1 py-0.5 text-[9px] md:text-[11px] font-bold border-r border-border/20" style={{ color: d.color }}>
                  {d.short}
                </td>
                {MODALITIES.map(mod => {
                  const planets = balance[el][mod];
                  const count = planets.length;
                  const title = planets.map(p => PLANETS[p as keyof typeof PLANETS]?.name || p).join(', ');
                  return (
                    <td key={mod} className="p-0.5">
                      <div
                        className="w-7 h-6 md:w-9 md:h-7 rounded flex items-center justify-center text-[10px] md:text-xs font-bold transition-colors"
                        style={{
                          backgroundColor: count > 0 ? d.color + '20' : undefined,
                          color: count > 0 ? d.color : 'var(--muted-foreground)',
                          border: count > 0 ? `1.5px solid ${d.color}40` : '1px dashed var(--border)',
                        }}
                        title={title || 'None'}
                      >
                        {count || '\u2013'}
                      </div>
                    </td>
                  );
                })}
                <td className="px-1.5 py-0.5 text-[10px] md:text-[11px] font-bold text-center border-l border-border/20" style={{ color: d.color }}>
                  {elTotals[el]}
                </td>
              </tr>
            );
          })}
          <tr className="border-t border-border/30">
            <td className="px-1 py-0.5 text-[9px] md:text-[10px] text-muted-foreground font-bold border-r border-border/20">&Sigma;</td>
            {MODALITIES.map(mod => (
              <td key={mod} className="px-1.5 py-0.5 text-[10px] md:text-[11px] font-bold text-center text-muted-foreground">
                {modTotals[mod]}
              </td>
            ))}
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
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
                {pattern.planets.map((p, i) => {
                  const info = PLANETS[p as keyof typeof PLANETS];
                  return (
                    <span key={`${p}-${i}`} className="text-base" style={{ color: info?.color }} title={info?.name}>
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

function AspectCell({ aspect, planetA, planetB, viewMode, isSynastry, chartMode }: {
  aspect: DetectedAspect | null;
  planetA: string;
  planetB: string;
  viewMode: 'symbols' | 'heatmap';
  isSynastry: boolean;
  chartMode?: 'personA' | 'personB' | 'synastry' | 'composite';
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
  const interpretation = isSynastry
    ? (chartMode === 'composite'
        ? getCompositeInterpretation(planetA, planetB, aspect.type)
        : getSynastryInterpretation(planetA, planetB, aspect.type))
    : getNatalInterpretation(planetA, planetB, aspect.type);
  const applying = isApplying(planetA, planetB);
  const tightness = classifyTightness(aspect.exactOrb, aspect.orb);
  const tightnessInfo = TIGHTNESS_INFO[tightness];
  const direction = applying === true ? 'applying' : applying === false ? 'separating' : null;
  const directionInfo = direction ? DIRECTION_INFO[direction] : null;
  const strengthPct = Math.round(aspect.strength * 100);

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
            {/* Tightness badge — top right */}
            <span
              className="absolute top-0 right-0 text-[7px] md:text-[8px] leading-none font-bold px-0.5 rounded-bl"
              style={{ color: tightnessInfo.color, backgroundColor: tightnessInfo.color + '15' }}
            >
              {tightnessInfo.abbrev}
            </span>
            {/* Direction badge — top left */}
            {directionInfo && (
              <span
                className="absolute top-0 left-0 text-[7px] md:text-[8px] leading-none font-bold px-0.5 rounded-br"
                style={{ color: directionInfo.color, backgroundColor: directionInfo.color + '15' }}
              >
                {directionInfo.abbrev}
              </span>
            )}
            {/* Tightness bar — bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] md:h-[3px] rounded-b-md overflow-hidden" style={{ backgroundColor: tightnessInfo.color + '15' }}>
              <div className="h-full rounded-b-md" style={{ width: `${strengthPct}%`, backgroundColor: aspect.color, opacity: 0.6 }} />
            </div>
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
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span>Orb: {formatOrb(aspect.exactOrb)}</span>
              <span>&bull;</span>
              <span>Strength: {strengthPct}%</span>
              <span>&bull;</span>
              <span className={`font-medium px-1.5 py-0.5 rounded-md text-[10px] ${tightnessInfo.bgClass}`}>
                {tightnessInfo.label}
              </span>
              {directionInfo && (
                <>
                  <span>&bull;</span>
                  <span className={`font-medium px-1.5 py-0.5 rounded-md text-[10px] ${directionInfo.bgClass}`}>
                    {directionInfo.label}
                  </span>
                </>
              )}
            </div>
            {/* Strength bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${strengthPct}%`,
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

// ─── Orb Guide ──────────────────────────────────────────────────────

const ORB_PLANETS = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'northnode', 'chiron', 'ascendant', 'midheaven',
] as const;

const MAJOR_ASPECTS = Object.entries(ASPECTS).filter(([_, d]) => d.major);

function OrbGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>&#9656;</span>
        Orb Guide
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          <p className="text-[10px] md:text-[11px] text-muted-foreground/60 leading-relaxed">
            Effective orb between two planets = average of both planets' max orbs.
          </p>

          {/* Planet orbs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-0.5">
            {ORB_PLANETS.map(key => {
              const planet = PLANETS[key as keyof typeof PLANETS];
              const label = planet?.name || (key === 'ascendant' ? 'ASC' : key === 'midheaven' ? 'MC' : key);
              const symbol = planet?.symbol || (key === 'ascendant' ? 'AC' : 'MC');
              const orb = PLANET_ORBS[key] ?? 1;
              return (
                <div key={key} className="flex items-center justify-between text-[11px] md:text-xs py-0.5">
                  <span className="text-muted-foreground">
                    <span className="opacity-50 mr-1">{symbol}</span>
                    {label}
                  </span>
                  <span className="font-mono text-[10px] md:text-[11px] text-muted-foreground/70 tabular-nums">{orb}°</span>
                </div>
              );
            })}
          </div>

          {/* Aspect orbs */}
          <div>
            <div className="text-[10px] md:text-[11px] font-medium text-muted-foreground/60 mb-1">Aspect base orbs</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-0.5">
              {MAJOR_ASPECTS.map(([key, def]) => (
                <div key={key} className="flex items-center justify-between text-[11px] md:text-xs py-0.5">
                  <span style={{ color: def.color }}>
                    <span className="mr-1">{def.symbol}</span>
                    {def.name}
                  </span>
                  <span className="font-mono text-[10px] md:text-[11px] text-muted-foreground/70 tabular-nums">{def.orb}°</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function AspectGridTable({ chartA, chartB, nameA, nameB, visiblePlanets, visibleAspects, chartMode }: AspectGridTableProps) {
  const [showMinor, setShowMinor] = useState(false);
  const [viewMode, setViewMode] = useState<'symbols' | 'heatmap'>('symbols');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!chartA?.planets || Object.keys(chartA.planets).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm text-muted-foreground/60">Calculate a chart first to see aspects</p>
      </div>
    );
  }

  const isSynastry = !!chartB;
  const planetsA = chartA.planets;
  const planetsB = chartB?.planets || chartA.planets;

  // Use visiblePlanets from chart options if provided, otherwise fall back to full GRID_PLANETS
  const gridPlanetList = visiblePlanets
    ? GRID_PLANETS.filter(p => visiblePlanets.has(p))
    : GRID_PLANETS;
  const availablePlanetsA = gridPlanetList.filter(p => planetsA[p]?.longitude !== undefined);
  const availablePlanetsB = gridPlanetList.filter(p => planetsB[p]?.longitude !== undefined);

  const rowPlanets = availablePlanetsA;
  const colPlanets = isSynastry ? availablePlanetsB : availablePlanetsA;

  // When visibleAspects is provided from chart options, use it; otherwise fall back to showMinor toggle
  const effectiveAllowedAspects = useMemo(() => {
    if (visibleAspects) return visibleAspects;
    if (showMinor) return undefined; // all aspects
    return new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare']);
  }, [visibleAspects, showMinor]);

  // Detect aspect patterns
  const patterns = useMemo(
    () => detectAspectPatterns(chartA, chartB, { includeMinor: showMinor }),
    [chartA, chartB, showMinor]
  );

  // Count aspects
  const counts = useMemo(() => {
    let harmonious = 0, challenging = 0, neutral = 0;
    const allowedAspects = effectiveAllowedAspects;

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
  }, [rowPlanets, colPlanets, planetsA, planetsB, effectiveAllowedAspects]);

  // Theme breakdown
  const themeCounts = useMemo(() => {
    const allowedAspects = effectiveAllowedAspects;
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
  }, [rowPlanets, colPlanets, planetsA, planetsB, effectiveAllowedAspects]);

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
        {/* Minor toggle — hidden when aspects are controlled by chart options */}
        {!visibleAspects && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Minor</label>
              <Switch checked={showMinor} onCheckedChange={setShowMinor} />
            </div>
          </div>
        )}
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

      {/* Aspect Grid */}
      <div className={`overflow-x-auto w-fit max-w-full ${isSynastry ? 'rounded-xl border bg-card/50' : ''}`}>
        <table className="border-collapse">
          {isSynastry ? (
            <>
              {/* Synastry: Full grid with top headers */}
              <thead>
                <tr>
                  <th className={`${CELL_CLASS} sticky left-0 z-10 bg-muted/80 backdrop-blur-sm`} />
                  {colPlanets.map((planet) => {
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
                {rowPlanets.map((rowPlanet) => {
                  const rowInfo = PLANETS[rowPlanet as keyof typeof PLANETS];
                  return (
                    <tr key={rowPlanet}>
                      <td className={`${CELL_CLASS} text-center sticky left-0 z-10 bg-muted/80 backdrop-blur-sm`}>
                        <div className="flex flex-col items-center gap-0">
                          <span className="text-lg md:text-2xl" style={{ color: rowInfo?.color }}>{rowInfo?.symbol}</span>
                          <span className="text-[10px] md:text-xs text-muted-foreground leading-none">{rowInfo?.name?.slice(0, 3)}</span>
                        </div>
                      </td>
                      {colPlanets.map((colPlanet) => {
                        const longA = planetsA[rowPlanet]?.longitude;
                        const longB = planetsB[colPlanet]?.longitude;
                        if (longA === undefined || longB === undefined) {
                          return <td key={colPlanet} className={CELL_CLASS} />;
                        }
                        const allowedAspects = effectiveAllowedAspects;
                        const aspect = detectAspect(longA, longB, allowedAspects as any, rowPlanet, colPlanet);
                        return (
                          <AspectCell key={colPlanet} aspect={aspect} planetA={rowPlanet} planetB={colPlanet} viewMode={viewMode} isSynastry={true} chartMode={chartMode} />
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </>
          ) : (
            /* Natal: Upper-right triangle — balance table embedded in empty lower-left */
            <>
              <thead>
                <tr>
                  <th className={CELL_CLASS} />
                  {colPlanets.map((planet, colIdx) => {
                    if (colIdx === 0) return <th key={planet} className={CELL_CLASS} />;
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
                {(() => {
                  const showBalanceInGrid = rowPlanets.length > BALANCE_START + 2;
                  const balanceRowSpan = rowPlanets.length - 1 - BALANCE_START;

                  return rowPlanets.map((rowPlanet, rowIdx) => {
                    if (rowIdx === rowPlanets.length - 1) return null;
                    const rowInfo = PLANETS[rowPlanet as keyof typeof PLANETS];

                    // Determine spacer cell for the lower-left empty area
                    let spacerCell: React.ReactNode;
                    if (showBalanceInGrid && rowIdx === BALANCE_START) {
                      // Start the balance table cell spanning the empty triangle area
                      spacerCell = (
                        <td
                          key="__balance__"
                          colSpan={BALANCE_START + 1}
                          rowSpan={balanceRowSpan}
                          className="align-top p-2"
                        >
                          <BalanceTable chart={chartA} planetKeys={rowPlanets} />
                        </td>
                      );
                    } else if (showBalanceInGrid && rowIdx > BALANCE_START) {
                      // Extra spacer for columns beyond the balance cell
                      const extra = rowIdx - BALANCE_START;
                      spacerCell = extra > 0 ? <td key="__spacer__" colSpan={extra} /> : null;
                    } else {
                      // Normal transparent spacer (rows before balance, or grid too small)
                      spacerCell = <td key="__spacer__" colSpan={rowIdx + 1} />;
                    }

                    return (
                      <tr key={rowPlanet}>
                        {/* Row label */}
                        <td className={`${CELL_CLASS} text-center bg-muted/40`}>
                          <div className="flex flex-col items-center gap-0">
                            <span className="text-lg md:text-2xl" style={{ color: rowInfo?.color }}>{rowInfo?.symbol}</span>
                            <span className="text-[10px] md:text-xs text-muted-foreground leading-none">{rowInfo?.name?.slice(0, 3)}</span>
                          </div>
                        </td>

                        {spacerCell}

                        {/* Upper-right aspect cells */}
                        {colPlanets.map((colPlanet, colIdx) => {
                          if (colIdx <= rowIdx) return null;
                          const longA = planetsA[rowPlanet]?.longitude;
                          const longB = planetsB[colPlanet]?.longitude;
                          if (longA === undefined || longB === undefined) {
                            return <td key={colPlanet} className={CELL_CLASS} />;
                          }
                          const allowedAspects = effectiveAllowedAspects;
                          const aspect = detectAspect(longA, longB, allowedAspects as any, rowPlanet, colPlanet);
                          return (
                            <AspectCell key={colPlanet} aspect={aspect} planetA={rowPlanet} planetB={colPlanet} viewMode={viewMode} isSynastry={false} chartMode={chartMode} />
                          );
                        })}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </>
          )}
        </table>
      </div>

      {/* Pattern Cards */}
      {patterns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {patterns.map((pattern, i) => (
            <PatternCard key={i} pattern={pattern} />
          ))}
        </div>
      )}

      {/* Balance Table(s) for synastry — below the grid */}
      {isSynastry && (
        <div className="flex flex-wrap gap-3 justify-center">
          <BalanceTable chart={chartA} planetKeys={rowPlanets} chartLabel={nameA} />
          {chartB && (
            <BalanceTable chart={chartB} planetKeys={colPlanets} chartLabel={nameB} />
          )}
        </div>
      )}

      {/* Classification Legend */}
      <div className="flex flex-col gap-1.5 px-1">
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70 mr-1 text-[11px] md:text-xs">Tightness:</span>
          {(Object.entries(TIGHTNESS_INFO) as [OrbTightness, TightnessInfo][]).map(([key, info]) => (
            <div key={key} className={`flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 rounded-md ${info.bgClass}`}>
              <span className="font-bold text-[9px] md:text-[10px]">{info.abbrev}</span>
              <span className="text-[10px] md:text-xs hidden sm:inline">{info.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70 mr-1 text-[11px] md:text-xs">Direction:</span>
          {(Object.entries(DIRECTION_INFO) as [string, DirectionInfo][]).map(([key, info]) => (
            <div key={key} className={`flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 rounded-md ${info.bgClass}`}>
              <span className="font-bold text-[9px] md:text-[10px]">{info.abbrev}</span>
              <span className="text-[10px] md:text-xs hidden sm:inline">{info.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Orb Guide */}
      <OrbGuide />
    </div>
  );
}
