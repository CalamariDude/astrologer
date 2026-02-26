/**
 * Age-Degree Activations Panel
 * Each planet's degree within its sign corresponds to an age of activation.
 * Every 30 years the cycle repeats with the next sign's theme:
 *   Cycle 1 (0-30): Aries lens
 *   Cycle 2 (30-60): Taurus lens
 *   Cycle 3 (60-90): Gemini lens
 *   Cycle 4 (90-120): Cancer lens
 */

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Clock, Sparkles, List } from 'lucide-react';
import type { NatalChart } from '@/components/biwheel/types';
import { PLANETS, ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';
import { SIGN_LENS_KEYWORDS, LENS_CONFIG, LENS_ORDER } from '@/data/signKeywords';
import type { LensKey } from '@/data/signKeywords';

interface AgeDegreePanelProps {
  birthDate: string;
  natalChart: NatalChart;
  personName: string;
}

const CORE_PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'ascendant', 'midheaven'] as const;

// Derived angles not in PLANETS constant
const DERIVED_ANGLES: Record<string, { symbol: string; name: string; color: string; derivedFrom: string }> = {
  descendant: { symbol: 'DC', name: 'Descendant', color: '#555555', derivedFrom: 'ascendant' },
  ic:         { symbol: 'IC', name: 'Imum Coeli', color: '#555555', derivedFrom: 'midheaven' },
};

const CYCLE_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer'] as const;

const ELEMENT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  fire:  { bg: 'bg-red-500/10',     text: 'text-red-600 dark:text-red-400',     ring: 'ring-red-500/30' },
  earth: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/30' },
  air:   { bg: 'bg-sky-500/10',     text: 'text-sky-600 dark:text-sky-400',     ring: 'ring-sky-500/30' },
  water: { bg: 'bg-cyan-500/10',    text: 'text-cyan-600 dark:text-cyan-400',   ring: 'ring-cyan-500/30' },
};

interface Activation {
  cycle: number;        // 1-4
  age: number;          // e.g. 26.5 or 56.5
  signTheme: string;    // 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  isPast: boolean;
  isCurrent: boolean;   // within ~1 year of current age
}

interface PlanetActivation {
  key: string;
  name: string;
  symbol: string;
  color: string;
  degreeInSign: number; // 0-30
  natalSign: string;
  natalDegStr: string;  // e.g. "26°30'"
  activations: Activation[];
}

function formatDegree(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d}°${m.toString().padStart(2, '0')}'`;
}

function formatTimeUntil(years: number): string {
  if (years < 0) {
    const ago = Math.abs(years);
    if (ago < 1) {
      const months = Math.round(ago * 12);
      return `${months}mo ago`;
    }
    return `${ago.toFixed(1)}y ago`;
  }
  if (years < 1) {
    const months = Math.round(years * 12);
    return `in ${months}mo`;
  }
  return `in ${years.toFixed(1)}y`;
}

export function AgeDegreePanel({ birthDate, natalChart, personName }: AgeDegreePanelProps) {
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);
  const [expandedKeywords, setExpandedKeywords] = useState<string | null>(null);

  const currentAge = useMemo(() => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMs = now.getTime() - birth.getTime();
    return diffMs / (365.25 * 24 * 60 * 60 * 1000);
  }, [birthDate]);

  const planetActivations = useMemo(() => {
    const results: PlanetActivation[] = [];

    // Helper to add a point given its longitude and display info
    const addPoint = (key: string, longitude: number, symbol: string, name: string, color: string) => {
      const degreeInSign = longitude % 30;
      const signIndex = Math.floor(longitude / 30) % 12;
      const natalSign = ZODIAC_SIGNS[signIndex]?.name ?? '';

      const activations: Activation[] = [];
      for (let cycle = 0; cycle < 4; cycle++) {
        const age = cycle * 30 + degreeInSign;
        const signTheme = CYCLE_SIGNS[cycle];
        const diff = currentAge - age;
        activations.push({
          cycle: cycle + 1,
          age,
          signTheme,
          isPast: diff > 0.5,
          isCurrent: Math.abs(diff) <= 0.5,
        });
      }

      results.push({
        key,
        name,
        symbol,
        color,
        degreeInSign,
        natalSign,
        natalDegStr: formatDegree(degreeInSign),
        activations,
      });
    };

    // Core planets + AC/MC from natalChart.planets
    for (const key of CORE_PLANETS) {
      const planet = natalChart.planets[key];
      if (!planet || planet.longitude === undefined) continue;

      const info = PLANETS[key as keyof typeof PLANETS];
      if (!info) continue;

      addPoint(key, planet.longitude, info.symbol, info.name, info.color);
    }

    // Derived angles: DC (AC + 180) and IC (MC + 180)
    for (const [key, cfg] of Object.entries(DERIVED_ANGLES)) {
      const sourceKey = cfg.derivedFrom;
      // Try planets first, then angles
      let sourceLng: number | undefined = natalChart.planets[sourceKey]?.longitude;
      if (sourceLng === undefined && natalChart.angles) {
        sourceLng = (natalChart.angles as Record<string, number>)[sourceKey];
      }
      if (sourceLng === undefined) continue;

      const longitude = (sourceLng + 180) % 360;
      addPoint(key, longitude, cfg.symbol, cfg.name, cfg.color);
    }

    return results;
  }, [natalChart, currentAge]);

  // Find nearest upcoming and most recent activations across all planets
  const { nextActivation, recentActivation } = useMemo(() => {
    let next: { planet: PlanetActivation; activation: Activation; diff: number } | null = null;
    let recent: { planet: PlanetActivation; activation: Activation; diff: number } | null = null;

    for (const pa of planetActivations) {
      for (const act of pa.activations) {
        const diff = act.age - currentAge;
        if (diff > 0 && (!next || diff < next.diff)) {
          next = { planet: pa, activation: act, diff };
        }
        if (diff <= 0 && (!recent || diff > recent.diff)) {
          recent = { planet: pa, activation: act, diff };
        }
      }
    }

    return { nextActivation: next, recentActivation: recent };
  }, [planetActivations, currentAge]);

  // Chronological timeline: all activations sorted by age
  const chronologicalTimeline = useMemo(() => {
    const all: { planet: PlanetActivation; activation: Activation }[] = [];
    for (const pa of planetActivations) {
      for (const act of pa.activations) {
        all.push({ planet: pa, activation: act });
      }
    }
    all.sort((a, b) => a.activation.age - b.activation.age);
    return all;
  }, [planetActivations]);

  // Sort planet rows by proximity to next activation
  const sortedPlanetActivations = useMemo(() => {
    return [...planetActivations].sort((a, b) => {
      const nextA = a.activations.find(act => act.age > currentAge);
      const nextB = b.activations.find(act => act.age > currentAge);
      const diffA = nextA ? nextA.age - currentAge : 999;
      const diffB = nextB ? nextB.age - currentAge : 999;
      return diffA - diffB;
    });
  }, [planetActivations, currentAge]);

  const getSignElement = (signName: string): string => {
    return ZODIAC_SIGNS.find(s => s.name === signName)?.element ?? 'fire';
  };

  const getSignSymbol = (signName: string): string => {
    return ZODIAC_SIGNS.find(s => s.name === signName)?.symbol ?? '';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{personName} — Age-Degree Activations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Current age: {currentAge.toFixed(1)} — Each planet's degree = its activation age (repeats every 30y)
          </p>
        </div>
      </div>

      {/* Next & Recent Activation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nextActivation && (
          <ActivationHighlightCard
            label="Next Activation"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            planet={nextActivation.planet}
            activation={nextActivation.activation}
            currentAge={currentAge}
            element={getSignElement(nextActivation.activation.signTheme)}
            signSymbol={getSignSymbol(nextActivation.activation.signTheme)}
          />
        )}
        {recentActivation && (
          <ActivationHighlightCard
            label="Most Recent"
            icon={<Clock className="w-3.5 h-3.5" />}
            planet={recentActivation.planet}
            activation={recentActivation.activation}
            currentAge={currentAge}
            element={getSignElement(recentActivation.activation.signTheme)}
            signSymbol={getSignSymbol(recentActivation.activation.signTheme)}
          />
        )}
      </div>

      {/* Chronological Timeline */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <List className="w-3.5 h-3.5 text-muted-foreground" />
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Chronological Timeline</h4>
        </div>
        <ChronologicalTimeline
          entries={chronologicalTimeline}
          currentAge={currentAge}
        />
      </div>

      {/* Planet-by-Planet Grid (sorted by proximity) */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Planet (nearest first)</h4>
        <div className="space-y-1.5">
          {sortedPlanetActivations.map(pa => (
            <PlanetRow
              key={pa.key}
              planet={pa}
              currentAge={currentAge}
              expanded={expandedPlanet === pa.key}
              onToggle={() => setExpandedPlanet(expandedPlanet === pa.key ? null : pa.key)}
              expandedKeywords={expandedKeywords}
              onToggleKeywords={(id) => setExpandedKeywords(expandedKeywords === id ? null : id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Activation Highlight Card ──────────────────────────────────────── */

function ActivationHighlightCard({
  label,
  icon,
  planet,
  activation,
  currentAge,
  element,
  signSymbol,
}: {
  label: string;
  icon: React.ReactNode;
  planet: PlanetActivation;
  activation: Activation;
  currentAge: number;
  element: string;
  signSymbol: string;
}) {
  const colors = ELEMENT_COLORS[element] ?? ELEMENT_COLORS.fire;
  const diff = activation.age - currentAge;
  const signData = SIGN_LENS_KEYWORDS[activation.signTheme];
  const coreKeywords = signData?.lenses?.core?.slice(0, 4) ?? [];

  return (
    <div className={`rounded-xl border p-3 ${colors.bg} ring-1 ${colors.ring}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={colors.text}>{icon}</span>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color: planet.color }} className="text-lg">{planet.symbol}</span>
        <span className="text-sm font-semibold">{planet.name}</span>
        <span className="text-xs text-muted-foreground">at age {activation.age.toFixed(1)}</span>
        <Badge variant="outline" className="text-[10px] ml-auto">
          {formatTimeUntil(diff)}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <span className={colors.text}>{signSymbol}</span>
        <span className={`font-medium ${colors.text}`}>{activation.signTheme} lens</span>
        <span className="text-muted-foreground">· Cycle {activation.cycle}</span>
      </div>
      {coreKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {coreKeywords.map(kw => (
            <Badge key={kw} variant="secondary" className="text-[10px] px-1.5 py-0">
              {kw}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Chronological Timeline ─────────────────────────────────────────── */

function ChronologicalTimeline({
  entries,
  currentAge,
}: {
  entries: { planet: PlanetActivation; activation: Activation }[];
  currentAge: number;
}) {
  // Find the index of the first future entry to center the view
  const firstFutureIdx = entries.findIndex(e => e.activation.age > currentAge);
  // Show a window around current age: 5 past + 10 future
  const startIdx = Math.max(0, firstFutureIdx - 5);
  const visible = entries.slice(startIdx, startIdx + 15);

  return (
    <div className="relative rounded-lg border bg-card overflow-hidden">
      {/* Current age marker label */}
      <div className="px-3 py-1.5 border-b bg-muted/30">
        <span className="text-[11px] text-muted-foreground">
          Age {currentAge.toFixed(1)} — showing {startIdx > 0 ? '...' : ''}{visible[0]?.activation.age.toFixed(1)} to {visible[visible.length - 1]?.activation.age.toFixed(1)}{startIdx + 15 < entries.length ? '...' : ''}
        </span>
      </div>
      <div className="divide-y">
        {visible.map((entry, i) => {
          const { planet, activation } = entry;
          const elem = ZODIAC_SIGNS.find(s => s.name === activation.signTheme)?.element ?? 'fire';
          const col = ELEMENT_COLORS[elem] ?? ELEMENT_COLORS.fire;
          const signSymbol = ZODIAC_SIGNS.find(s => s.name === activation.signTheme)?.symbol ?? '';
          const diff = activation.age - currentAge;
          const isNow = activation.isCurrent;
          const isNextUp = !activation.isPast && !activation.isCurrent && i > 0 && (visible[i - 1]?.activation.isPast || visible[i - 1]?.activation.isCurrent);

          return (
            <div
              key={`${planet.key}-${activation.cycle}`}
              className={`flex items-center gap-2.5 px-3 py-1.5 text-xs ${
                isNow
                  ? `${col.bg} font-semibold`
                  : isNextUp
                    ? 'bg-primary/5'
                    : activation.isPast
                      ? 'opacity-50'
                      : ''
              }`}
            >
              {/* Age */}
              <span className="w-10 text-right tabular-nums font-mono text-muted-foreground shrink-0">
                {activation.age.toFixed(1)}
              </span>
              {/* Vertical line indicator */}
              <div className={`w-0.5 h-4 rounded-full shrink-0 ${
                isNow ? col.bg.replace('/10', '/60') : activation.isPast ? 'bg-muted-foreground/20' : 'bg-primary/30'
              }`} style={isNow ? { backgroundColor: `var(--${elem}, currentColor)` } : undefined} />
              {/* Planet */}
              <span style={{ color: planet.color }} className="text-sm shrink-0">{planet.symbol}</span>
              <span className="font-medium shrink-0">{planet.name}</span>
              {/* Sign theme */}
              <span className={`${col.text} shrink-0`}>{signSymbol} {activation.signTheme}</span>
              {/* Badge */}
              <span className="ml-auto shrink-0">
                {isNow ? (
                  <Badge variant="default" className="text-[10px]">NOW</Badge>
                ) : (
                  <span className="text-muted-foreground text-[10px]">{formatTimeUntil(diff)}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Planet Row ─────────────────────────────────────────────────────── */

function PlanetRow({
  planet,
  currentAge,
  expanded,
  onToggle,
  expandedKeywords,
  onToggleKeywords,
}: {
  planet: PlanetActivation;
  currentAge: number;
  expanded: boolean;
  onToggle: () => void;
  expandedKeywords: string | null;
  onToggleKeywords: (id: string) => void;
}) {
  // Find which cycle is current
  const currentCycleIdx = Math.min(Math.floor(currentAge / 30), 3);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <span style={{ color: planet.color }} className="text-base">{planet.symbol}</span>
        <span className="text-sm font-medium">{planet.name}</span>
        <span className="text-xs text-muted-foreground">{planet.natalDegStr} {planet.natalSign}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {planet.activations.map(act => {
            const elem = ZODIAC_SIGNS.find(s => s.name === act.signTheme)?.element ?? 'fire';
            const col = ELEMENT_COLORS[elem] ?? ELEMENT_COLORS.fire;
            const isCurrentCycle = act.cycle - 1 === currentCycleIdx;
            return (
              <span
                key={act.cycle}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  act.isCurrent
                    ? `${col.bg} ${col.text} font-bold ring-1 ${col.ring}`
                    : act.isPast
                      ? 'text-muted-foreground/50'
                      : isCurrentCycle
                        ? `${col.text} font-medium`
                        : 'text-muted-foreground'
                }`}
              >
                {act.age.toFixed(1)}
              </span>
            );
          })}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t space-y-2">
          {planet.activations.map(act => {
            const elem = ZODIAC_SIGNS.find(s => s.name === act.signTheme)?.element ?? 'fire';
            const col = ELEMENT_COLORS[elem] ?? ELEMENT_COLORS.fire;
            const signSymbol = ZODIAC_SIGNS.find(s => s.name === act.signTheme)?.symbol ?? '';
            const diff = act.age - currentAge;
            const signData = SIGN_LENS_KEYWORDS[act.signTheme];
            const kwId = `${planet.key}-${act.cycle}`;
            const isKwExpanded = expandedKeywords === kwId;

            return (
              <div
                key={act.cycle}
                className={`rounded-lg border p-2.5 ${
                  act.isCurrent ? `${col.bg} ring-1 ${col.ring}` : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${col.text}`}>{signSymbol}</span>
                  <span className={`text-xs font-semibold ${col.text}`}>
                    Cycle {act.cycle}: {act.signTheme}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Age {act.age.toFixed(1)}
                  </span>
                  <Badge
                    variant={act.isCurrent ? 'default' : 'outline'}
                    className="text-[10px] ml-auto"
                  >
                    {act.isCurrent ? 'NOW' : act.isPast ? 'Past' : formatTimeUntil(diff)}
                  </Badge>
                </div>

                {/* Sign quality */}
                {signData && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {signData.quality}
                  </p>
                )}

                {/* Core keywords preview + expand */}
                {signData && (
                  <div className="mt-1.5">
                    <button
                      onClick={() => onToggleKeywords(kwId)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isKwExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      <span>Keywords</span>
                    </button>
                    {isKwExpanded && (
                      <div className="mt-1.5 space-y-1.5">
                        {LENS_ORDER.map(lens => {
                          const kws = signData.lenses[lens];
                          if (!kws || kws.length === 0) return null;
                          const cfg = LENS_CONFIG[lens];
                          return (
                            <div key={lens}>
                              <span
                                className="text-[10px] font-medium"
                                style={{ color: cfg.color }}
                              >
                                {cfg.label}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {kws.slice(0, 6).map(kw => (
                                  <Badge
                                    key={kw}
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
