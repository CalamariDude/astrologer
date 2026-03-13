/**
 * Firdaria Panel
 * Persian/medieval planetary period system (75-year cycle)
 * Shows diurnal/nocturnal sequence, main periods, sub-periods, and visual timeline
 */

import { useMemo } from 'react';
import { ToolGuide } from './ToolGuide';
import { InterpretationCard } from './InterpretationCard';
import { FIRDARIA_BLEND, PLANET_PERIOD_MEANINGS } from '../../data/toolboxInterpretations';

const SYMBOL_FONT = { fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" };

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean }>;
    houses?: any;
  };
  birthDate: string; // YYYY-MM-DD
  name?: string;
}

interface FirdariaPeriod {
  ruler: string;
  years: number;
  startDate: Date;
  endDate: Date;
  subPeriods: SubPeriod[];
}

interface SubPeriod {
  ruler: string;
  startDate: Date;
  endDate: Date;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '\u2609\uFE0E',        // ☉
  moon: '\u263D\uFE0E',       // ☽
  mercury: '\u263F\uFE0E',    // ☿
  venus: '\u2640\uFE0E',      // ♀
  mars: '\u2642\uFE0E',       // ♂
  jupiter: '\u2643\uFE0E',    // ♃
  saturn: '\u2644\uFE0E',     // ♄
  northnode: '\u260A\uFE0E',  // ☊
  southnode: '\u260B\uFE0E',  // ☋
};

const PLANET_NAMES: Record<string, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  northnode: 'North Node',
  southnode: 'South Node',
};

/** Tailwind color classes per planet */
const PLANET_COLORS: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  sun:       { bg: 'bg-amber-500/15',   text: 'text-amber-500',   ring: 'ring-amber-500/40',   bar: '#f59e0b' },
  moon:      { bg: 'bg-slate-300/20',   text: 'text-slate-400',   ring: 'ring-slate-400/40',   bar: '#94a3b8' },
  mercury:   { bg: 'bg-yellow-400/15',  text: 'text-yellow-500',  ring: 'ring-yellow-400/40',  bar: '#eab308' },
  venus:     { bg: 'bg-emerald-400/15', text: 'text-emerald-400', ring: 'ring-emerald-400/40', bar: '#34d399' },
  mars:      { bg: 'bg-red-500/15',     text: 'text-red-500',     ring: 'ring-red-500/40',     bar: '#ef4444' },
  jupiter:   { bg: 'bg-violet-400/15',  text: 'text-violet-400',  ring: 'ring-violet-400/40',  bar: '#a78bfa' },
  saturn:    { bg: 'bg-stone-400/15',   text: 'text-stone-400',   ring: 'ring-stone-400/40',   bar: '#a8a29e' },
  northnode: { bg: 'bg-teal-400/15',    text: 'text-teal-400',    ring: 'ring-teal-400/40',    bar: '#2dd4bf' },
  southnode: { bg: 'bg-orange-400/15',  text: 'text-orange-400',  ring: 'ring-orange-400/40',  bar: '#fb923c' },
};

/** Diurnal birth sequence: ruler key + years */
const DIURNAL_SEQUENCE: [string, number][] = [
  ['sun', 10], ['venus', 8], ['mercury', 13], ['moon', 9],
  ['saturn', 11], ['jupiter', 12], ['mars', 7],
  ['northnode', 3], ['southnode', 2],
];

/** Nocturnal birth sequence */
const NOCTURNAL_SEQUENCE: [string, number][] = [
  ['moon', 9], ['saturn', 11], ['jupiter', 12], ['mars', 7],
  ['sun', 10], ['venus', 8], ['mercury', 13],
  ['northnode', 3], ['southnode', 2],
];

/** Chaldean order for sub-period rulers */
const CHALDEAN_ORDER = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  const totalDays = years * 365.25;
  d.setTime(d.getTime() + totalDays * 24 * 60 * 60 * 1000);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/** Determine if a birth is diurnal (daytime) based on natal chart */
function isDiurnal(natalChart: Props['natalChart']): boolean {
  const sun = natalChart.planets['sun'];
  if (!sun) return true; // default to diurnal

  // Method 1: Check house data
  if (natalChart.houses) {
    const houses = natalChart.houses;
    // If houses is an array of cusps or an object with house numbers
    let sunHouse: number | undefined;

    // Check if planets have house info
    if ((sun as any).house) {
      sunHouse = (sun as any).house;
    } else if (Array.isArray(houses) && houses.length >= 12) {
      // Houses as array of cusp longitudes — determine which house the Sun falls in
      sunHouse = getHouseFromCusps(sun.longitude, houses);
    } else if (typeof houses === 'object') {
      // Houses as object with cusp values
      const cusps = extractCusps(houses);
      if (cusps.length >= 12) {
        sunHouse = getHouseFromCusps(sun.longitude, cusps);
      }
    }

    if (sunHouse !== undefined) {
      return sunHouse >= 7 && sunHouse <= 12;
    }
  }

  // Method 2: Simplified — if Sun longitude is roughly in upper hemisphere
  // (between ASC ~0° and DSC ~180°) treat as diurnal
  const asc = natalChart.houses?.ascendant ??
              natalChart.houses?.house1 ??
              (Array.isArray(natalChart.houses) ? natalChart.houses[0] : undefined);

  if (asc !== undefined && typeof asc === 'number') {
    const sunLng = sun.longitude;
    const ascLng = asc;
    // Normalize: Sun is above horizon if it's between DSC (asc+180) going through MC to ASC
    const diff = ((sunLng - ascLng) % 360 + 360) % 360;
    return diff > 180; // above horizon
  }

  // Fallback: default diurnal
  return true;
}

function getHouseFromCusps(longitude: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const cusp = cusps[i];
    const nextCusp = cusps[(i + 1) % 12];
    const lng = longitude;

    let inHouse: boolean;
    if (nextCusp > cusp) {
      inHouse = lng >= cusp && lng < nextCusp;
    } else {
      // Wraps around 360
      inHouse = lng >= cusp || lng < nextCusp;
    }
    if (inHouse) return i + 1;
  }
  return 1;
}

function extractCusps(houses: any): number[] {
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) {
    const key = `house${i}`;
    if (houses[key] !== undefined) {
      cusps.push(typeof houses[key] === 'number' ? houses[key] : houses[key]?.longitude ?? 0);
    }
  }
  return cusps;
}

/** Build Chaldean sub-period sequence starting from the main ruler */
function buildSubPeriods(mainRuler: string, startDate: Date, mainYears: number): SubPeriod[] {
  const isNode = mainRuler === 'northnode' || mainRuler === 'southnode';

  if (isNode) {
    // Nodes: divide among Chaldean 7 planets
    const subDuration = mainYears / 7;
    let cursor = new Date(startDate);
    return CHALDEAN_ORDER.map((ruler) => {
      const start = new Date(cursor);
      const end = addYears(cursor, subDuration);
      cursor = end;
      return { ruler, startDate: start, endDate: end };
    });
  }

  // Regular planet: 7 sub-periods starting from the main ruler in Chaldean order
  const startIdx = CHALDEAN_ORDER.indexOf(mainRuler);
  const subDuration = mainYears / 7;
  let cursor = new Date(startDate);

  const subs: SubPeriod[] = [];
  for (let i = 0; i < 7; i++) {
    const ruler = CHALDEAN_ORDER[(startIdx + i) % 7];
    const start = new Date(cursor);
    const end = addYears(cursor, subDuration);
    cursor = end;
    subs.push({ ruler, startDate: start, endDate: end });
  }
  return subs;
}

/** Build all Firdaria periods for a given birth date and sect */
function buildFirdaria(birthDate: Date, diurnal: boolean): FirdariaPeriod[] {
  const sequence = diurnal ? DIURNAL_SEQUENCE : NOCTURNAL_SEQUENCE;
  const periods: FirdariaPeriod[] = [];
  let cursor = new Date(birthDate);

  // Build enough cycles to cover ~150 years (2 full cycles)
  for (let cycle = 0; cycle < 2; cycle++) {
    for (const [ruler, years] of sequence) {
      const start = new Date(cursor);
      const end = addYears(cursor, years);
      const subPeriods = buildSubPeriods(ruler, start, years);
      periods.push({ ruler, years, startDate: start, endDate: end, subPeriods });
      cursor = end;
    }
  }

  return periods;
}

/** Find which period/sub-period is active for a given date */
function findActive(periods: FirdariaPeriod[], now: Date) {
  const nowMs = now.getTime();
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    if (nowMs >= p.startDate.getTime() && nowMs < p.endDate.getTime()) {
      let activeSub: number | undefined;
      for (let j = 0; j < p.subPeriods.length; j++) {
        const sp = p.subPeriods[j];
        if (nowMs >= sp.startDate.getTime() && nowMs < sp.endDate.getTime()) {
          activeSub = j;
          break;
        }
      }
      return { periodIdx: i, subIdx: activeSub };
    }
  }
  return { periodIdx: -1, subIdx: undefined };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FirdariaPanel({ natalChart, birthDate, name }: Props) {
  const data = useMemo(() => {
    if (!birthDate) return null;
    const bd = new Date(birthDate + 'T12:00:00');
    const diurnal = isDiurnal(natalChart);
    const periods = buildFirdaria(bd, diurnal);
    const now = new Date();
    const active = findActive(periods, now);
    return { diurnal, periods, active, birthDateObj: bd, now };
  }, [natalChart, birthDate]);

  if (!birthDate || !data) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Enter a birth date to use this tool
      </div>
    );
  }

  const { diurnal, periods, active, now } = data;

  // Find the range we actually care about: first cycle that contains current period
  const firstCycleEnd = 9; // 9 periods per cycle
  const showPeriods = active.periodIdx < firstCycleEnd
    ? periods.slice(0, firstCycleEnd)
    : periods.slice(firstCycleEnd, firstCycleEnd * 2);

  const currentPeriod = active.periodIdx >= 0 ? periods[active.periodIdx] : null;

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">
            Firdaria {name ? <span className="text-muted-foreground font-normal">for {name}</span> : null}
          </h3>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Persian planetary period system — 75-year cycle
          </p>
        </div>
        <SectBadge diurnal={diurnal} />
      </div>

      <ToolGuide
        title="Firdaria"
        description="A Persian/medieval planetary period system spanning a 75-year cycle. Each planet rules a main period (7-12 years), subdivided into shorter sub-periods ruled by other planets in Chaldean order. Diurnal charts start from the Sun; nocturnal charts start from the Moon."
        tips={[
          "The highlighted row shows your current main period and active sub-period ruler",
          "Look at the natal condition of the period ruler — a well-placed ruler brings easier themes",
          "Sub-periods blend the themes of both rulers: the main period sets the backdrop, the sub-period colors the foreground",
          "The timeline bar at the top gives a visual overview of where you are in the full 75-year cycle",
          "Click any period row to expand its sub-periods with exact dates",
        ]}
      />

      {/* Current Period Summary */}
      {currentPeriod && (
        <CurrentPeriodCard
          period={currentPeriod}
          subIdx={active.subIdx}
          now={now}
        />
      )}

      {/* Visual Timeline Bar */}
      <TimelineBar
        periods={showPeriods}
        activePeriodIdx={showPeriods.indexOf(currentPeriod!)}
        now={now}
      />

      {/* Sub-periods for current main period */}
      {currentPeriod && (
        <SubPeriodsTable
          period={currentPeriod}
          activeSubIdx={active.subIdx}
          now={now}
        />
      )}

      {/* Full Periods Table */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
          All Periods {diurnal ? '(Diurnal)' : '(Nocturnal)'}
        </h4>
        <div className="rounded-lg border border-border/50 overflow-hidden overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left px-2.5 py-1.5 text-xs font-medium text-muted-foreground/60">Ruler</th>
                <th className="text-left px-2.5 py-1.5 text-xs font-medium text-muted-foreground/60">Start</th>
                <th className="text-left px-2.5 py-1.5 text-xs font-medium text-muted-foreground/60">End</th>
                <th className="text-right px-2.5 py-1.5 text-xs font-medium text-muted-foreground/60">Years</th>
              </tr>
            </thead>
            <tbody>
              {showPeriods.map((p, i) => {
                const isActive = periods.indexOf(p) === active.periodIdx;
                const colors = PLANET_COLORS[p.ruler] || PLANET_COLORS.sun;
                return (
                  <tr
                    key={i}
                    className={`border-b border-border/20 transition-colors cursor-pointer ${
                      isActive
                        ? `${colors.bg} font-medium`
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="px-2.5 py-1.5">
                      <span className={`${colors.text} mr-1`} style={SYMBOL_FONT}>{PLANET_SYMBOLS[p.ruler]}</span>
                      <span className={isActive ? '' : 'text-muted-foreground'}>{PLANET_NAMES[p.ruler]}</span>
                    </td>
                    <td className="px-2.5 py-1.5 text-muted-foreground font-mono tabular-nums">{formatShortDate(p.startDate)}</td>
                    <td className="px-2.5 py-1.5 text-muted-foreground font-mono tabular-nums">{formatShortDate(p.endDate)}</td>
                    <td className="px-2.5 py-1.5 text-right text-muted-foreground font-mono tabular-nums">{p.years}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectBadge({ diurnal }: { diurnal: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${
        diurnal
          ? 'bg-amber-500/10 text-amber-500 ring-amber-500/30'
          : 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/30'
      }`}
    >
      <span className="text-sm" style={SYMBOL_FONT}>{diurnal ? '\u2609\uFE0E' : '\u263D\uFE0E'}</span>
      {diurnal ? 'Diurnal' : 'Nocturnal'}
    </div>
  );
}

function CurrentPeriodCard({
  period,
  subIdx,
  now,
}: {
  period: FirdariaPeriod;
  subIdx: number | undefined;
  now: Date;
}) {
  const colors = PLANET_COLORS[period.ruler] || PLANET_COLORS.sun;
  const elapsed = now.getTime() - period.startDate.getTime();
  const total = period.endDate.getTime() - period.startDate.getTime();
  const progress = Math.min(Math.max(elapsed / total, 0), 1);

  const currentSub = subIdx !== undefined ? period.subPeriods[subIdx] : null;
  const subColors = currentSub ? (PLANET_COLORS[currentSub.ruler] || PLANET_COLORS.sun) : null;

  return (
    <div className={`rounded-lg border ${colors.ring} ring-1 ${colors.bg} p-3 space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${colors.text}`} style={SYMBOL_FONT}>{PLANET_SYMBOLS[period.ruler]}</span>
          <div>
            <div className="text-xs font-semibold">
              {PLANET_NAMES[period.ruler]} Period
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(period.startDate)} — {formatDate(period.endDate)} ({period.years} yrs)
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground/60">Progress</div>
          <div className="text-xs font-mono font-medium">{(progress * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress * 100}%`, backgroundColor: colors.bar }}
        />
      </div>

      {/* Current sub-period */}
      {currentSub && subColors && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground/60">Sub-period:</span>
          <span className={subColors.text} style={SYMBOL_FONT}>{PLANET_SYMBOLS[currentSub.ruler]}</span>
          <span className="font-medium">{PLANET_NAMES[currentSub.ruler]}</span>
          <span className="text-muted-foreground/70">
            ({formatShortDate(currentSub.startDate)} — {formatShortDate(currentSub.endDate)})
          </span>
        </div>
      )}

      {/* Interpretation */}
      <InterpretationCard title="What This Means">
        {PLANET_PERIOD_MEANINGS[period.ruler] || ''}
        {currentSub && FIRDARIA_BLEND[period.ruler]?.[currentSub.ruler] && (
          <>
            <br />
            <span className="text-xs text-muted-foreground/70 mt-1 block">
              Sub-period blend: {FIRDARIA_BLEND[period.ruler][currentSub.ruler]}
            </span>
          </>
        )}
      </InterpretationCard>
    </div>
  );
}

function TimelineBar({
  periods,
  activePeriodIdx,
  now,
}: {
  periods: FirdariaPeriod[];
  activePeriodIdx: number;
  now: Date;
}) {
  if (periods.length === 0) return null;

  const totalStart = periods[0].startDate.getTime();
  const totalEnd = periods[periods.length - 1].endDate.getTime();
  const totalSpan = totalEnd - totalStart;

  if (totalSpan <= 0) return null;

  const nowPct = Math.min(Math.max((now.getTime() - totalStart) / totalSpan, 0), 1) * 100;

  return (
    <div className="relative">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
        Life Timeline
      </h4>
      <div className="relative h-14 rounded-md overflow-hidden bg-muted/30 border border-border/40 flex">
        {periods.map((p, i) => {
          const w = ((p.endDate.getTime() - p.startDate.getTime()) / totalSpan) * 100;
          const colors = PLANET_COLORS[p.ruler] || PLANET_COLORS.sun;
          const isActive = i === activePeriodIdx;
          return (
            <div
              key={i}
              className={`relative flex items-center justify-center border-r border-border/20 last:border-r-0 transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                width: `${w}%`,
                backgroundColor: isActive ? colors.bar + '33' : 'transparent',
              }}
              title={`${PLANET_NAMES[p.ruler]}: ${formatShortDate(p.startDate)} - ${formatShortDate(p.endDate)} (${p.years} yrs)`}
            >
              {w > 4 && (
                <span
                  className={`text-base leading-none ${isActive ? colors.text + ' font-bold' : 'text-muted-foreground/70'}`}
                  style={SYMBOL_FONT}
                >
                  {PLANET_SYMBOLS[p.ruler]}
                </span>
              )}
            </div>
          );
        })}

        {/* Now marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/80 z-10"
          style={{ left: `${nowPct}%` }}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-foreground" />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[11px] font-bold text-foreground whitespace-nowrap">
            NOW
          </div>
        </div>
      </div>

      {/* Age labels */}
      <div className="relative mt-5 h-4">
        {[0, 10, 20, 30, 40, 50, 60, 70].map(age => {
          const totalYears = (periods[periods.length - 1].endDate.getTime() - periods[0].startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          const pct = Math.min((age / totalYears) * 100, 100);
          return (
            <span key={age} className="absolute text-[11px] text-muted-foreground/70 -translate-x-1/2" style={{ left: `${pct}%` }}>
              {age}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SubPeriodsTable({
  period,
  activeSubIdx,
  now,
}: {
  period: FirdariaPeriod;
  activeSubIdx: number | undefined;
  now: Date;
}) {
  const colors = PLANET_COLORS[period.ruler] || PLANET_COLORS.sun;

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
        <span className={colors.text} style={SYMBOL_FONT}>{PLANET_SYMBOLS[period.ruler]}</span>{' '}
        {PLANET_NAMES[period.ruler]} Sub-periods
      </h4>
      <div className="grid gap-1">
        {period.subPeriods.map((sp, j) => {
          const isActive = j === activeSubIdx;
          const sc = PLANET_COLORS[sp.ruler] || PLANET_COLORS.sun;

          // Sub-period progress
          const elapsed = now.getTime() - sp.startDate.getTime();
          const total = sp.endDate.getTime() - sp.startDate.getTime();
          const progress = Math.min(Math.max(elapsed / total, 0), 1);

          return (
            <div
              key={j}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-colors ${
                isActive
                  ? `${sc.bg} ${sc.ring} ring-1 border-transparent`
                  : 'border-border/30 hover:border-border/50'
              }`}
            >
              <span className={`text-sm ${sc.text}`} style={SYMBOL_FONT}>{PLANET_SYMBOLS[sp.ruler]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}>
                    {PLANET_NAMES[sp.ruler]}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">
                    {formatShortDate(sp.startDate)} — {formatShortDate(sp.endDate)}
                  </span>
                </div>
                {isActive && (
                  <div className="mt-1 h-1 rounded-full bg-muted/20 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${progress * 100}%`, backgroundColor: sc.bar }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
