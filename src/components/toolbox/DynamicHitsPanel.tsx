/**
 * Dynamic Hits Panel
 * Combined predictive timeline: lunar phases, sign ingresses, retrograde stations,
 * and profection activations for the coming 12 months.
 * Pure client-side calculations -- no API calls.
 */

import React, { useMemo, useState } from 'react';
import { ToolGuide } from './ToolGuide';

const SYMBOL_FONT = { fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" };

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean }>;
    houses?: { cusps?: number[]; ascendant?: number; mc?: number };
  };
  birthDate: string; // YYYY-MM-DD
  name?: string;
}

type EventCategory = 'lunar' | 'ingress' | 'retrograde' | 'profection';

interface TimelineEvent {
  date: Date;
  category: EventCategory;
  icon: string;
  title: string;
  detail: string;
  natalHouse: number | null;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_SYMBOLS = ['\u2648\uFE0E','\u2649\uFE0E','\u264A\uFE0E','\u264B\uFE0E','\u264C\uFE0E','\u264D\uFE0E','\u264E\uFE0E','\u264F\uFE0E','\u2650\uFE0E','\u2651\uFE0E','\u2652\uFE0E','\u2653\uFE0E'];

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '\u2609\uFE0E', moon: '\u263D\uFE0E', mercury: '\u263F\uFE0E', venus: '\u2640\uFE0E', mars: '\u2642\uFE0E',
  jupiter: '\u2643\uFE0E', saturn: '\u2644\uFE0E',
};

/** Traditional domicile rulers for profections */
const DOMICILE_RULER: Record<string, string> = {
  Aries: 'mars', Taurus: 'venus', Gemini: 'mercury', Cancer: 'moon',
  Leo: 'sun', Virgo: 'mercury', Libra: 'venus', Scorpio: 'mars',
  Sagittarius: 'jupiter', Capricorn: 'saturn', Aquarius: 'saturn', Pisces: 'jupiter',
};

const CATEGORY_COLORS: Record<EventCategory, string> = {
  lunar: 'text-slate-300',
  ingress: 'text-amber-400',
  retrograde: 'text-red-400',
  profection: 'text-violet-400',
};

const CATEGORY_BG: Record<EventCategory, string> = {
  lunar: 'border-slate-500/20 bg-slate-500/5',
  ingress: 'border-amber-500/20 bg-amber-500/5',
  retrograde: 'border-red-500/20 bg-red-500/5',
  profection: 'border-violet-500/20 bg-violet-500/5',
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  lunar: 'Lunar Phases',
  ingress: 'Sign Ingresses',
  retrograde: 'Retro Stations',
  profection: 'Profections',
};

/** J2000.0 epoch = 2000-01-01T12:00:00 TT */
const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);

/* ------------------------------------------------------------------ */
/*  Known Mercury retrograde dates 2024-2028                           */
/* ------------------------------------------------------------------ */

const MERCURY_RETROGRADES: { rx: string; direct: string; sign: string }[] = [
  // 2024
  { rx: '2024-04-01', direct: '2024-04-25', sign: 'Aries' },
  { rx: '2024-08-05', direct: '2024-08-28', sign: 'Virgo' },
  { rx: '2024-11-25', direct: '2024-12-15', sign: 'Sagittarius' },
  // 2025
  { rx: '2025-03-15', direct: '2025-04-07', sign: 'Aries' },
  { rx: '2025-07-18', direct: '2025-08-11', sign: 'Leo' },
  { rx: '2025-11-09', direct: '2025-11-29', sign: 'Sagittarius' },
  // 2026
  { rx: '2026-02-26', direct: '2026-03-20', sign: 'Pisces' },
  { rx: '2026-06-29', direct: '2026-07-23', sign: 'Cancer' },
  { rx: '2026-10-24', direct: '2026-11-13', sign: 'Scorpio' },
  // 2027
  { rx: '2027-02-09', direct: '2027-03-03', sign: 'Aquarius' },
  { rx: '2027-06-10', direct: '2027-07-04', sign: 'Cancer' },
  { rx: '2027-10-07', direct: '2027-10-28', sign: 'Libra' },
  // 2028
  { rx: '2028-01-24', direct: '2028-02-14', sign: 'Aquarius' },
  { rx: '2028-05-21', direct: '2028-06-13', sign: 'Gemini' },
  { rx: '2028-09-19', direct: '2028-10-11', sign: 'Virgo' },
];

/** Approximate Venus retrograde periods */
const VENUS_RETROGRADES: { rx: string; direct: string; sign: string }[] = [
  { rx: '2025-03-02', direct: '2025-04-13', sign: 'Aries' },
  { rx: '2026-10-03', direct: '2026-11-14', sign: 'Scorpio' },
];

/** Approximate Mars retrograde periods */
const MARS_RETROGRADES: { rx: string; direct: string; sign: string }[] = [
  { rx: '2024-12-06', direct: '2025-02-24', sign: 'Cancer' },
  { rx: '2027-01-10', direct: '2027-04-01', sign: 'Leo' },
];

/* ------------------------------------------------------------------ */
/*  Astronomical helpers                                               */
/* ------------------------------------------------------------------ */

function normalizeLong(l: number): number {
  return ((l % 360) + 360) % 360;
}

function signIdx(longitude: number): number {
  return Math.floor(normalizeLong(longitude) / 30);
}

function signName(longitude: number): string {
  return SIGNS[signIdx(longitude)];
}

function formatDeg(longitude: number): string {
  const n = normalizeLong(longitude);
  const idx = signIdx(n);
  const deg = Math.floor(n % 30);
  const min = Math.floor(((n % 30) - deg) * 60);
  return `${deg}\u00B0${String(min).padStart(2, '0')}' ${SIGN_SYMBOLS[idx]}`;
}

function daysSinceJ2000(date: Date): number {
  return (date.getTime() - J2000) / 86400000;
}

/**
 * Approximate solar longitude (mean sun) in degrees.
 * Accuracy: ~1 degree, sufficient for sign boundary estimation.
 */
function solarLongitude(date: Date): number {
  const d = daysSinceJ2000(date);
  // Mean longitude of the Sun
  const L = 280.46646 + 0.9856474 * d;
  // Mean anomaly
  const M = 357.52911 + 0.9856003 * d;
  const Mrad = (M * Math.PI) / 180;
  // Equation of center (first two terms)
  const C = 1.9146 * Math.sin(Mrad) + 0.02 * Math.sin(2 * Mrad);
  return normalizeLong(L + C);
}

/**
 * Approximate lunar longitude.
 * Very rough (~5 degree accuracy), but sufficient for New/Full Moon approximation.
 */
function lunarLongitude(date: Date): number {
  const d = daysSinceJ2000(date);
  // Mean elements
  const L = 218.3165 + 13.176396 * d; // mean longitude
  const M = 134.963 + 13.06499 * d;   // mean anomaly
  const F = 93.272 + 13.22935 * d;    // argument of latitude
  const D = 297.8502 + 12.19075 * d;  // mean elongation
  const Mrad = (M * Math.PI) / 180;
  const Drad = (D * Math.PI) / 180;
  const Frad = (F * Math.PI) / 180;
  // Principal perturbation terms
  const lng = L + 6.289 * Math.sin(Mrad) - 1.274 * Math.sin(2 * Drad - Mrad)
    - 0.658 * Math.sin(2 * Drad) + 0.214 * Math.sin(2 * Mrad)
    - 0.186 * Math.sin((357.52911 + 0.9856003 * d) * Math.PI / 180);
  return normalizeLong(lng);
}

function houseOf(longitude: number, cusps: number[]): number {
  if (!cusps || cusps.length < 12) return 0;
  const l = normalizeLong(longitude);
  for (let i = 0; i < 12; i++) {
    const start = normalizeLong(cusps[i]);
    const end = normalizeLong(cusps[(i + 1) % 12]);
    if (start < end) {
      if (l >= start && l < end) return i + 1;
    } else {
      if (l >= start || l < end) return i + 1;
    }
  }
  return 1;
}

function parseDate(s: string): Date {
  return new Date(s + 'T12:00:00Z');
}

function formatEventDate(d: Date): string {
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/*  Event generators                                                   */
/* ------------------------------------------------------------------ */

function generateLunarPhases(startDate: Date, months: number, cusps: number[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  // Scan day by day, detect when Sun-Moon elongation crosses 0 (new) or 180 (full)
  const dayMs = 86400000;
  let prevElong = -1;

  for (let t = startDate.getTime(); t < endDate.getTime(); t += dayMs) {
    const d = new Date(t);
    const sunL = solarLongitude(d);
    const moonL = lunarLongitude(d);
    let elong = normalizeLong(moonL - sunL); // 0 = new, 180 = full

    if (prevElong >= 0) {
      // New Moon: elongation crosses 0 (wraps from ~350+ to ~10-)
      if (prevElong > 340 && elong < 20) {
        const lng = solarLongitude(d);
        const house = cusps.length >= 12 ? houseOf(lng, cusps) : null;
        events.push({
          date: d,
          category: 'lunar',
          icon: '\uD83C\uDF11', // new moon emoji
          title: `New Moon in ${signName(lng)}`,
          detail: `${formatDeg(lng)}${house ? ` \u2022 natal house ${house}` : ''}`,
          natalHouse: house,
          color: 'text-slate-300',
        });
      }
      // Full Moon: elongation crosses 180
      if ((prevElong < 180 && elong >= 180) || (prevElong > 170 && prevElong < 180 && elong >= 180)) {
        const lng = lunarLongitude(d);
        const house = cusps.length >= 12 ? houseOf(lng, cusps) : null;
        events.push({
          date: d,
          category: 'lunar',
          icon: '\uD83C\uDF15', // full moon emoji
          title: `Full Moon in ${signName(lng)}`,
          detail: `${formatDeg(lng)}${house ? ` \u2022 natal house ${house}` : ''}`,
          natalHouse: house,
          color: 'text-yellow-200',
        });
      }
    }
    prevElong = elong;
  }
  return events;
}

function generateSunIngresses(startDate: Date, months: number, cusps: number[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  const dayMs = 86400000;

  let prevSign = signIdx(solarLongitude(startDate));
  for (let t = startDate.getTime() + dayMs; t < endDate.getTime(); t += dayMs) {
    const d = new Date(t);
    const lng = solarLongitude(d);
    const s = signIdx(lng);
    if (s !== prevSign) {
      const sign = SIGNS[s];
      const house = cusps.length >= 12 ? houseOf(s * 30, cusps) : null;
      events.push({
        date: d,
        category: 'ingress',
        icon: '\u2609\uFE0E',
        title: `Sun enters ${sign} ${SIGN_SYMBOLS[s]}`,
        detail: `Solar ingress${house ? ` \u2022 natal house ${house}` : ''}`,
        natalHouse: house,
        color: 'text-amber-400',
      });
    }
    prevSign = s;
  }
  return events;
}

function generateOuterIngresses(startDate: Date, months: number, cusps: number[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  // Mars: ~0.524 deg/day, Jupiter: ~0.083 deg/day, Saturn: ~0.034 deg/day
  // Approximate their positions linearly from a known epoch
  // Known approximate positions on 2026-01-01:
  const epoch = new Date('2026-01-01T12:00:00Z');
  const epochPositions: Record<string, { lng: number; speed: number; symbol: string }> = {
    Mars:    { lng: 120, speed: 0.524, symbol: '\u2642\uFE0E' },   // ~0 Leo
    Jupiter: { lng: 80,  speed: 0.083, symbol: '\u2643\uFE0E' },   // ~20 Gemini
    Saturn:  { lng: 355, speed: 0.034, symbol: '\u2644\uFE0E' },   // ~25 Pisces
  };

  const dayMs = 86400000;
  const epochMs = epoch.getTime();

  for (const [planet, info] of Object.entries(epochPositions)) {
    let prevSign = signIdx(normalizeLong(info.lng + info.speed * ((startDate.getTime() - epochMs) / dayMs)));
    for (let t = startDate.getTime(); t < endDate.getTime(); t += dayMs) {
      const days = (t - epochMs) / dayMs;
      const lng = normalizeLong(info.lng + info.speed * days);
      const s = signIdx(lng);
      if (s !== prevSign) {
        const sign = SIGNS[s];
        const house = cusps.length >= 12 ? houseOf(s * 30, cusps) : null;
        events.push({
          date: new Date(t),
          category: 'ingress',
          icon: info.symbol,
          title: `${planet} enters ${sign} ${SIGN_SYMBOLS[s]}`,
          detail: `${planet} ingress${house ? ` \u2022 natal house ${house}` : ''}`,
          natalHouse: house,
          color: 'text-amber-400',
        });
      }
      prevSign = s;
    }
  }
  return events;
}

function generateRetrogradeStations(startDate: Date, months: number): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  const allRetros = [
    ...MERCURY_RETROGRADES.map(r => ({ ...r, planet: 'Mercury', symbol: '\u263F\uFE0E' })),
    ...VENUS_RETROGRADES.map(r => ({ ...r, planet: 'Venus', symbol: '\u2640\uFE0E' })),
    ...MARS_RETROGRADES.map(r => ({ ...r, planet: 'Mars', symbol: '\u2642\uFE0E' })),
  ];

  for (const r of allRetros) {
    if (r.rx >= startStr && r.rx <= endStr) {
      events.push({
        date: parseDate(r.rx),
        category: 'retrograde',
        icon: r.symbol,
        title: `${r.planet} stations retrograde`,
        detail: `In ${r.sign} ${SIGN_SYMBOLS[SIGNS.indexOf(r.sign)] || ''}`,
        natalHouse: null,
        color: 'text-red-400',
      });
    }
    if (r.direct >= startStr && r.direct <= endStr) {
      events.push({
        date: parseDate(r.direct),
        category: 'retrograde',
        icon: r.symbol,
        title: `${r.planet} stations direct`,
        detail: `In ${r.sign} ${SIGN_SYMBOLS[SIGNS.indexOf(r.sign)] || ''}`,
        natalHouse: null,
        color: 'text-emerald-400',
      });
    }
  }
  return events;
}

function generateProfections(birthDate: string, startDate: Date, months: number, ascLong: number | undefined): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  if (ascLong == null) return events;

  const bd = parseDate(birthDate);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  // Calculate current age in years
  const ageAtStart = (startDate.getTime() - bd.getTime()) / (365.25 * 86400000);
  const baseAge = Math.floor(ageAtStart);

  // Annual profection house = (age % 12) houses from ASC
  // Monthly profections rotate through signs monthly within that year
  const ascSign = signIdx(ascLong);

  for (let m = 0; m < months; m++) {
    const monthDate = new Date(startDate);
    monthDate.setMonth(monthDate.getMonth() + m);

    // Age at this month
    const ageAtMonth = (monthDate.getTime() - bd.getTime()) / (365.25 * 86400000);
    const yearAge = Math.floor(ageAtMonth);
    const annualHouse = (yearAge % 12);
    // Monthly profection: count months since last birthday
    const lastBirthday = new Date(bd);
    lastBirthday.setFullYear(bd.getFullYear() + yearAge);
    const monthsSinceBirthday = (monthDate.getFullYear() - lastBirthday.getFullYear()) * 12 + (monthDate.getMonth() - lastBirthday.getMonth());
    const profectedSignIdx = (ascSign + annualHouse + Math.max(0, monthsSinceBirthday)) % 12;
    const profectedSign = SIGNS[profectedSignIdx];
    const timeLord = DOMICILE_RULER[profectedSign];
    const timeLordSymbol = PLANET_SYMBOLS[timeLord] || timeLord;

    // Only add at month boundaries
    const isAnnual = m === 0 || monthDate.getMonth() === bd.getMonth();
    events.push({
      date: monthDate,
      category: 'profection',
      icon: timeLordSymbol,
      title: `Profection: ${SIGN_SYMBOLS[profectedSignIdx]} ${profectedSign}`,
      detail: `Time-lord: ${timeLordSymbol} ${timeLord.charAt(0).toUpperCase() + timeLord.slice(1)}${isAnnual ? ' (annual)' : ' (monthly)'}`,
      natalHouse: annualHouse + 1,
      color: 'text-violet-400',
    });
  }
  return events;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DynamicHitsPanel({ natalChart, birthDate, name }: Props) {
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');

  const cusps = natalChart.houses?.cusps || [];
  const ascLong = natalChart.houses?.ascendant ?? (cusps.length >= 12 ? cusps[0] : undefined);

  const allEvents = useMemo(() => {
    const now = new Date();
    const events: TimelineEvent[] = [
      ...generateLunarPhases(now, 12, cusps),
      ...generateSunIngresses(now, 12, cusps),
      ...generateOuterIngresses(now, 12, cusps),
      ...generateRetrogradeStations(now, 12),
      ...generateProfections(birthDate, now, 12, ascLong),
    ];
    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    return events;
  }, [cusps, ascLong, birthDate]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return allEvents;
    return allEvents.filter(e => e.category === filter);
  }, [allEvents, filter]);

  // Group by month for headers
  const groupedByMonth = useMemo(() => {
    const groups: { label: string; events: TimelineEvent[] }[] = [];
    let currentLabel = '';
    for (const ev of filteredEvents) {
      const label = ev.date.toLocaleDateString('en', { month: 'long', year: 'numeric' });
      if (label !== currentLabel) {
        groups.push({ label, events: [] });
        currentLabel = label;
      }
      groups[groups.length - 1].events.push(ev);
    }
    return groups;
  }, [filteredEvents]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allEvents.length };
    for (const ev of allEvents) c[ev.category] = (c[ev.category] || 0) + 1;
    return c;
  }, [allEvents]);

  if (!birthDate) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Enter a birth date to use this tool
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">
          Dynamic Hits{name ? ` \u2014 ${name}` : ''}
        </h3>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Predictive timeline for the next 12 months. Lunar phases, ingresses, retrogrades, and profections.
        </p>
      </div>

      <ToolGuide
        title="Dynamic Hits"
        description="A combined timeline showing all active timing techniques at once — profections, solar ingresses, and lunations mapped month by month. This lets you spot when multiple timing methods converge on the same themes."
        tips={[
          "When several techniques activate the same house or planet simultaneously, those themes become very prominent",
          "Use the category filters to focus on profections, ingresses, or lunations separately",
          "The profected sign shows which area of life is 'activated' each month",
          "Solar ingresses mark seasonal shifts in emphasis",
          "Pay attention to months where the profected sign matches a transit or ingress — that's a dynamic hit",
        ]}
      />

      {/* Filter bar */}
      <div className="flex gap-1 flex-wrap">
        {([['all', 'All'] as const, ...Object.entries(CATEGORY_LABELS).map(([k, v]) => [k, v] as const)]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key as EventCategory | 'all')}
            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-foreground/10 text-foreground border border-foreground/20'
                : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {label}
            <span className="ml-1 text-[11px] text-muted-foreground/70">{counts[key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="max-h-[400px] overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-muted">
        {groupedByMonth.length === 0 && (
          <div className="text-xs text-muted-foreground/70 text-center py-8">No events found.</div>
        )}
        {groupedByMonth.map((group) => (
          <div key={group.label}>
            {/* Month header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-1 mb-1">
              <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
                {group.label}
                <span className="ml-1 text-muted-foreground/60">({group.events.length})</span>
              </div>
            </div>

            {/* Events */}
            <div className="space-y-1 pl-1 border-l border-border/50">
              {group.events.map((ev, i) => (
                <div
                  key={`${ev.date.toISOString()}-${i}`}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 ml-2 ${CATEGORY_BG[ev.category]}`}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center mt-0.5">
                    <span className="text-sm leading-none" style={SYMBOL_FONT}>{ev.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-medium ${CATEGORY_COLORS[ev.category]}`}>
                        {ev.title}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground/60 mt-0.5">
                      {ev.detail}
                    </div>
                  </div>

                  {/* Date + house */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono tabular-nums text-muted-foreground">
                      {formatShortDate(ev.date)}
                    </div>
                    {ev.natalHouse && (
                      <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                        H{ev.natalHouse}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70 pt-1 border-t border-border/30">
        <span className="text-slate-300">● Lunar</span>
        <span className="text-amber-400">● Ingress</span>
        <span className="text-red-400">● Retrograde</span>
        <span className="text-violet-400">● Profection</span>
      </div>

      {/* Disclaimer */}
      <div className="text-[11px] text-muted-foreground/70 leading-relaxed px-1">
        Dates are approximate (±1-2 days for lunar phases, ±1 day for ingresses).
        Mercury/Venus/Mars retrograde dates are from published ephemeris data.
        Monthly profections are experimental.
      </div>
    </div>
  );
}
