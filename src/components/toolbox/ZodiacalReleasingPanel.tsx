/**
 * Zodiacal Releasing Panel
 * Hellenistic time-lord technique from the Lot of Fortune / Lot of Spirit.
 * Calculates 4 levels of periods, marks Loosing of the Bond and peak periods.
 */

import React, { useState, useMemo } from 'react';
import { ToolGuide } from './ToolGuide';
import { InterpretationCard } from './InterpretationCard';
import { SIGN_PERIOD_MEANINGS, ELEMENT_OF_SIGN } from '../../data/toolboxInterpretations';

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

interface Period {
  sign: number;        // 0-11 (Aries=0)
  startDate: Date;
  endDate: Date;
  durationDays: number;
  isLoosingOfBond: boolean;
  isPeak: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIGN_SYMBOLS = ['\u2648\uFE0E','\u2649\uFE0E','\u264A\uFE0E','\u264B\uFE0E','\u264C\uFE0E','\u264D\uFE0E','\u264E\uFE0E','\u264F\uFE0E','\u2650\uFE0E','\u2651\uFE0E','\u2652\uFE0E','\u2653\uFE0E'];
const SIGN_NAMES  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const SIGN_ELEMENTS: Record<number, string> = {
  0:'fire',1:'earth',2:'air',3:'water',
  4:'fire',5:'earth',6:'air',7:'water',
  8:'fire',9:'earth',10:'air',11:'water',
};

const ELEMENT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  fire:  { bg: 'bg-red-500/10',     text: 'text-red-500',     ring: 'ring-red-500/30' },
  earth: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', ring: 'ring-emerald-500/30' },
  air:   { bg: 'bg-sky-500/10',     text: 'text-sky-500',     ring: 'ring-sky-500/30' },
  water: { bg: 'bg-cyan-500/10',    text: 'text-cyan-500',    ring: 'ring-cyan-500/30' },
};

/** Minor years of each sign's traditional ruler (in years). */
const MINOR_YEARS: number[] = [
  15, // Aries   (Mars)
   8, // Taurus  (Venus)
  20, // Gemini  (Mercury)
  25, // Cancer  (Moon)
  19, // Leo     (Sun)
  20, // Virgo   (Mercury)
   8, // Libra   (Venus)
  15, // Scorpio (Mars)
  12, // Sagittarius (Jupiter)
  27, // Capricorn   (Saturn)
  27, // Aquarius    (Saturn)
  12, // Pisces      (Jupiter)
];

/** Total minor-year cycle = sum of all 12 signs */
const TOTAL_CYCLE_YEARS = MINOR_YEARS.reduce((a, b) => a + b, 0); // 228

const RULER_NAMES: Record<number, string> = {
  0:'Mars',1:'Venus',2:'Mercury',3:'Moon',4:'Sun',5:'Mercury',
  6:'Venus',7:'Mars',8:'Jupiter',9:'Saturn',10:'Saturn',11:'Jupiter',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normDeg(d: number): number {
  return ((d % 360) + 360) % 360;
}

function signOf(longitude: number): number {
  return Math.floor(normDeg(longitude) / 30);
}

function degInSign(longitude: number): number {
  return normDeg(longitude) % 30;
}

function isDaytime(natalChart: Props['natalChart']): boolean {
  const sun = natalChart.planets['sun'] ?? natalChart.planets['Sun'];
  if (!sun) return true;
  // Simplified: if houses are available, check if sun is above horizon
  // Otherwise use longitude heuristic: sun in houses 7-12 = daytime
  // With house data: ASC cusp defines horizon
  const asc = natalChart.planets['ascendant'] ?? natalChart.planets['Ascendant'] ?? natalChart.planets['asc'];
  if (asc) {
    const ascLong = normDeg(asc.longitude);
    const sunLong = normDeg(sun.longitude);
    // Sun is above horizon if it's in the upper half (DSC to ASC going counter-clockwise)
    // i.e. sun longitude is between DSC (ASC+180) and ASC going through the top
    const dsc = normDeg(ascLong + 180);
    // Above horizon = from ASC counter-clockwise to DSC (the visible half)
    // In zodiacal order, sun is above horizon when it's in the 180 degrees from DSC to ASC
    // going forward through the zodiac
    const diff = normDeg(sunLong - dsc);
    return diff <= 180;
  }
  // Fallback: assume daytime
  return true;
}

function getPlanetLongitude(chart: Props['natalChart'], key: string): number | null {
  const p = chart.planets[key] ?? chart.planets[key.charAt(0).toUpperCase() + key.slice(1)];
  return p ? normDeg(p.longitude) : null;
}

function calculateLot(chart: Props['natalChart'], lotType: 'fortune' | 'spirit'): number {
  const asc = getPlanetLongitude(chart, 'ascendant') ?? getPlanetLongitude(chart, 'asc') ?? 0;
  const sun = getPlanetLongitude(chart, 'sun') ?? 0;
  const moon = getPlanetLongitude(chart, 'moon') ?? 0;
  const day = isDaytime(chart);

  if (lotType === 'fortune') {
    // Fortune: ASC + Moon - Sun (day), ASC + Sun - Moon (night)
    return day ? normDeg(asc + moon - sun) : normDeg(asc + sun - moon);
  } else {
    // Spirit: ASC + Sun - Moon (day), ASC + Moon - Sun (night)
    return day ? normDeg(asc + sun - moon) : normDeg(asc + moon - sun);
  }
}

/** Get the angular signs: signs containing ASC, MC, DSC, IC */
function getAngularSigns(chart: Props['natalChart']): Set<number> {
  const signs = new Set<number>();
  const ascLong = getPlanetLongitude(chart, 'ascendant') ?? getPlanetLongitude(chart, 'asc');
  if (ascLong !== null) {
    signs.add(signOf(ascLong));                   // ASC sign
    signs.add(signOf(normDeg(ascLong + 180)));    // DSC sign
  }
  const mc = getPlanetLongitude(chart, 'mc') ?? getPlanetLongitude(chart, 'midheaven') ?? getPlanetLongitude(chart, 'Mc');
  if (mc !== null) {
    signs.add(signOf(mc));                        // MC sign
    signs.add(signOf(normDeg(mc + 180)));         // IC sign
  }
  return signs;
}

/** Build the sequence of periods at a given level */
function buildPeriods(
  startSign: number,
  startDate: Date,
  totalDurationDays: number,
  angularSigns: Set<number>,
  lotSign: number,
): Period[] {
  const periods: Period[] = [];

  // Sum of all minor years (for proportioning)
  const totalYears = TOTAL_CYCLE_YEARS;
  let currentDate = new Date(startDate);
  let sign = startSign;
  let usedDays = 0;

  // We go through signs in order; might wrap through multiple full cycles
  // but practically we stop once we've used up totalDurationDays
  while (usedDays < totalDurationDays - 0.001) {
    const years = MINOR_YEARS[sign];
    const fractionOfCycle = years / totalYears;
    // But we use proportional time relative to *totalDurationDays*
    // Actually at L1, totalDurationDays = MINOR_YEARS[startSign] * 365.25
    // and sub-periods are proportional within that.
    // The correct calc: each sign's duration is proportional to its minor years
    // relative to the sum of all 12 signs' minor years.
    const periodDays = (years / totalYears) * totalDurationDays;

    // Clamp to remaining
    const actualDays = Math.min(periodDays, totalDurationDays - usedDays);

    const endDate = new Date(currentDate.getTime() + actualDays * 86400000);

    const oppSign = (lotSign + 6) % 12;
    const isLB = sign === oppSign;
    const isPeak = angularSigns.has(sign);

    periods.push({
      sign,
      startDate: new Date(currentDate),
      endDate,
      durationDays: actualDays,
      isLoosingOfBond: isLB,
      isPeak,
    });

    currentDate = endDate;
    usedDays += actualDays;
    sign = (sign + 1) % 12;
  }

  return periods;
}

/** Build Level 1 periods for the entire life (up to ~228 years, enough for any lifetime) */
function buildL1Periods(
  lotLongitude: number,
  birthDate: Date,
  angularSigns: Set<number>,
): Period[] {
  const lotSign = signOf(lotLongitude);
  const periods: Period[] = [];
  let currentDate = new Date(birthDate);
  let sign = lotSign;

  // Build enough periods to cover ~120 years (one full cycle = 228 years)
  for (let i = 0; i < 12; i++) {
    const years = MINOR_YEARS[sign];
    const durationDays = years * 365.25;
    const endDate = new Date(currentDate.getTime() + durationDays * 86400000);

    const oppSign = (lotSign + 6) % 12;
    const isLB = sign === oppSign;
    const isPeak = angularSigns.has(sign);

    periods.push({
      sign,
      startDate: new Date(currentDate),
      endDate,
      durationDays,
      isLoosingOfBond: isLB,
      isPeak,
    });

    currentDate = endDate;
    sign = (sign + 1) % 12;
  }

  return periods;
}

function findCurrentPeriod(periods: Period[], now: Date): number {
  for (let i = 0; i < periods.length; i++) {
    if (now >= periods[i].startDate && now < periods[i].endDate) return i;
  }
  // If past all periods, return last
  return periods.length - 1;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(days: number): string {
  if (days >= 365.25) {
    const y = Math.floor(days / 365.25);
    const m = Math.round((days % 365.25) / 30.44);
    return m > 0 ? `${y}y ${m}m` : `${y}y`;
  }
  if (days >= 30.44) {
    const m = Math.floor(days / 30.44);
    const d = Math.round(days % 30.44);
    return d > 0 ? `${m}m ${d}d` : `${m}m`;
  }
  const d = Math.round(days);
  if (d < 1) {
    const h = Math.round(days * 24);
    return `${h}h`;
  }
  return `${d}d`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ZodiacalReleasingPanel({ natalChart, birthDate, name }: Props) {
  const [lotType, setLotType] = useState<'fortune' | 'spirit'>('fortune');

  const birth = useMemo(() => birthDate ? new Date(birthDate + 'T12:00:00') : new Date(), [birthDate]);
  const now = useMemo(() => new Date(), []);

  const lotLong = useMemo(() => calculateLot(natalChart, lotType), [natalChart, lotType]);
  const lotSign = signOf(lotLong);
  const lotDeg = degInSign(lotLong);

  const angularSigns = useMemo(() => getAngularSigns(natalChart), [natalChart]);

  // L1 periods
  const l1Periods = useMemo(() => buildL1Periods(lotLong, birth, angularSigns), [lotLong, birth, angularSigns]);
  const currentL1 = findCurrentPeriod(l1Periods, now);

  // L2 sub-periods for current L1
  const l2Periods = useMemo(() => {
    const p = l1Periods[currentL1];
    if (!p) return [];
    return buildPeriods(p.sign, p.startDate, p.durationDays, angularSigns, lotSign);
  }, [l1Periods, currentL1, angularSigns, lotSign]);
  const currentL2 = findCurrentPeriod(l2Periods, now);

  // L3 sub-periods for current L2
  const l3Periods = useMemo(() => {
    const p = l2Periods[currentL2];
    if (!p) return [];
    return buildPeriods(p.sign, p.startDate, p.durationDays, angularSigns, lotSign);
  }, [l2Periods, currentL2, angularSigns, lotSign]);
  const currentL3 = findCurrentPeriod(l3Periods, now);

  // L4 sub-periods for current L3
  const l4Periods = useMemo(() => {
    const p = l3Periods[currentL3];
    if (!p) return [];
    return buildPeriods(p.sign, p.startDate, p.durationDays, angularSigns, lotSign);
  }, [l3Periods, currentL3, angularSigns, lotSign]);
  const currentL4 = findCurrentPeriod(l4Periods, now);

  if (!birthDate) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Enter a birth date to use this tool
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Zodiacal Releasing</h3>
          {name && <span className="text-xs text-muted-foreground">{name}</span>}
        </div>
        <span className="text-[11px] text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded">
          Hellenistic Time-Lord
        </span>
      </div>

      <ToolGuide
        title="Zodiacal Releasing"
        description="A Hellenistic timing technique from Vettius Valens. It divides life into periods ruled by zodiac signs, starting from the Lot of Fortune (for career/body) or Lot of Spirit (for mind/purpose). Each level zooms into finer time periods."
        tips={[
          "Level 1 periods last years — they show major life chapters and career peaks",
          "When the releasing reaches an angular sign (1st, 4th, 7th, 10th from the lot), it marks a 'peak period' of heightened activity",
          "Loosing of the Bond occurs when a period transfers to the sign of its ruler — watch for major life shifts",
          "Toggle between Lot of Fortune and Lot of Spirit to see different life dimensions",
          "Click any period row to expand and see its sub-periods",
        ]}
      />

      {/* Lot toggle */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/30 border border-border/50 w-fit">
        <button
          onClick={() => setLotType('fortune')}
          className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
            lotType === 'fortune'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Lot of Fortune
        </button>
        <button
          onClick={() => setLotType('spirit')}
          className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
            lotType === 'spirit'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Lot of Spirit
        </button>
      </div>

      {/* Lot position */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/20">
        <span className="text-lg" style={SYMBOL_FONT}>{SIGN_SYMBOLS[lotSign]}</span>
        <div>
          <div className="text-xs font-medium">
            {lotDeg.toFixed(1)}&deg; {SIGN_NAMES[lotSign]}
          </div>
          <div className="text-xs text-muted-foreground">
            {lotType === 'fortune' ? 'Lot of Fortune' : 'Lot of Spirit'} &middot; Ruler: {RULER_NAMES[lotSign]}
            {' '}&middot; {isDaytime(natalChart) ? 'Day' : 'Night'} chart
          </div>
        </div>
      </div>

      {/* Current position summary */}
      <CurrentPositionSummary
        l1={l1Periods[currentL1]}
        l2={l2Periods[currentL2]}
        l3={l3Periods[currentL3]}
        l4={l4Periods[currentL4]}
      />

      {/* L1 Periods */}
      <PeriodTable
        label="Level 1 — Major Periods"
        periods={l1Periods}
        currentIdx={currentL1}
        showDuration
        maxVisible={5}
      />

      {/* L2 Periods */}
      {l2Periods.length > 0 && (
        <PeriodTable
          label={`Level 2 — Sub-periods of ${SIGN_SYMBOLS[l1Periods[currentL1].sign]} ${SIGN_NAMES[l1Periods[currentL1].sign]}`}
          periods={l2Periods}
          currentIdx={currentL2}
          showDuration
        />
      )}

      {/* L3 Periods */}
      {l3Periods.length > 0 && (
        <PeriodTable
          label={`Level 3 — Sub-periods of ${SIGN_SYMBOLS[l2Periods[currentL2].sign]} ${SIGN_NAMES[l2Periods[currentL2].sign]}`}
          periods={l3Periods}
          currentIdx={currentL3}
          showDuration
          defaultCollapsed
        />
      )}

      {/* L4 Periods */}
      {l4Periods.length > 0 && (
        <PeriodTable
          label={`Level 4 — Sub-periods of ${SIGN_SYMBOLS[l3Periods[currentL3].sign]} ${SIGN_NAMES[l3Periods[currentL3].sign]}`}
          periods={l4Periods}
          currentIdx={currentL4}
          showDuration
          defaultCollapsed
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground/80">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500/70" /> Peak (angular sign)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-violet-500/70" /> Loosing of the Bond
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-primary/20 ring-1 ring-primary/40" /> Current
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CurrentPositionSummary({ l1, l2, l3, l4 }: { l1?: Period; l2?: Period; l3?: Period; l4?: Period }) {
  if (!l1) return null;

  const levels = [
    { label: 'L1', period: l1 },
    { label: 'L2', period: l2 },
    { label: 'L3', period: l3 },
    { label: 'L4', period: l4 },
  ].filter(l => l.period);

  return (
    <div className="px-3 py-2 rounded-lg border border-primary/20 bg-primary/5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70 mb-1.5">
        Current Position
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {levels.map((l, i) => {
          const p = l.period!;
          const el = SIGN_ELEMENTS[p.sign];
          const ec = ELEMENT_COLORS[el];
          return (
            <React.Fragment key={l.label}>
              {i > 0 && <span className="text-muted-foreground/30 text-xs">/</span>}
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-sm font-medium ${ec.bg} ${ec.text}`}>
                <span className="text-xs text-muted-foreground/70">{l.label}</span>
                <span className="text-2xl" style={SYMBOL_FONT}>{SIGN_SYMBOLS[p.sign]}</span> <span className="text-sm">{SIGN_NAMES[p.sign]}</span>
                {p.isLoosingOfBond && <span className="text-violet-500 text-[11px] font-bold" title="Loosing of the Bond">LB</span>}
                {p.isPeak && <span className="text-amber-500 text-[11px]" title="Peak period">*</span>}
              </span>
            </React.Fragment>
          );
        })}
      </div>
      {/* Interpretation */}
      {l1 && (
        <InterpretationCard
          element={ELEMENT_OF_SIGN[SIGN_NAMES[l1.sign]]?.toLowerCase() as 'fire' | 'earth' | 'air' | 'water'}
          title="Current Theme"
        >
          <span className="font-medium">Major theme:</span>{' '}
          {SIGN_PERIOD_MEANINGS[SIGN_NAMES[l1.sign]] || SIGN_NAMES[l1.sign]}
          {l2 && (
            <>
              <br />
              <span className="font-medium">Current sub-theme:</span>{' '}
              {SIGN_PERIOD_MEANINGS[SIGN_NAMES[l2.sign]] || SIGN_NAMES[l2.sign]}
            </>
          )}
        </InterpretationCard>
      )}
    </div>
  );
}

function PeriodTable({
  label,
  periods,
  currentIdx,
  showDuration,
  defaultCollapsed,
  maxVisible,
}: {
  label: string;
  periods: Period[];
  currentIdx: number;
  showDuration?: boolean;
  defaultCollapsed?: boolean;
  maxVisible?: number;
}) {
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const [showAll, setShowAll] = useState(false);

  const visiblePeriods = useMemo(() => {
    if (!maxVisible || showAll) return periods.map((p, i) => ({ period: p, idx: i }));
    const start = Math.max(0, currentIdx - 2);
    const end = Math.min(periods.length, currentIdx + 3);
    return periods.slice(start, end).map((p, i) => ({ period: p, idx: start + i }));
  }, [periods, currentIdx, maxVisible, showAll]);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/30 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          {label}
        </span>
        <svg
          className={`w-3 h-3 text-muted-foreground/60 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto overflow-x-auto">
          {visiblePeriods.map((vp) => {
            const p = vp.period;
            const i = vp.idx;
            const el = SIGN_ELEMENTS[p.sign];
            const ec = ELEMENT_COLORS[el];
            const isCurrent = i === currentIdx;

            return (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-primary/5 ring-1 ring-inset ring-primary/20'
                    : 'hover:bg-muted/30'
                }`}
              >
                {/* Sign */}
                <span className={`text-sm ${ec.text}`} style={SYMBOL_FONT}>{SIGN_SYMBOLS[p.sign]}</span>
                <span className={`font-medium min-w-[70px] text-[11px] ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {SIGN_NAMES[p.sign]}
                </span>

                {/* Ruler */}
                <span className="text-[11px] text-muted-foreground/70 min-w-[40px]">
                  {RULER_NAMES[p.sign]}
                </span>

                {/* Dates */}
                <span className="text-muted-foreground/70 min-w-[75px]">{formatDate(p.startDate)}</span>
                <span className="text-muted-foreground/30">-</span>
                <span className="text-muted-foreground/70 min-w-[75px]">{formatDate(p.endDate)}</span>

                {/* Duration */}
                {showDuration && (
                  <span className="text-muted-foreground/60 min-w-[40px] text-right font-mono tabular-nums">{formatDuration(p.durationDays)}</span>
                )}

                {/* Badges */}
                <span className="flex items-center gap-1 ml-auto">
                  {p.isPeak && (
                    <span className="px-1 py-px rounded text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/20" title="Angular / Peak period">
                      PEAK
                    </span>
                  )}
                  {p.isLoosingOfBond && (
                    <span className="px-1 py-px rounded text-[11px] font-semibold bg-violet-500/15 text-violet-500 border border-violet-500/20" title="Loosing of the Bond">
                      LB
                    </span>
                  )}
                  {isCurrent && (
                    <span className="px-1 py-px rounded text-[11px] font-semibold bg-primary/15 text-primary border border-primary/20">
                      NOW
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          {maxVisible && !showAll && periods.length > maxVisible && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2 text-xs text-primary hover:text-primary/80 transition-colors text-center"
            >
              Show all {periods.length} periods
            </button>
          )}
        </div>
      )}
    </div>
  );
}
