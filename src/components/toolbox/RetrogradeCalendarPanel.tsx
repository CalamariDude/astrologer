/**
 * Retrograde Calendar Panel
 * Shows all planetary retrograde periods for the current year with shadow periods.
 * Uses Swiss Ephemeris API to detect retrograde stations from daily ephemeris data.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { swissEphemeris } from '@/api/swissEphemeris';
import { ToolGuide } from './ToolGuide';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  lat?: number;
  lng?: number;
}

interface EphemerisEntry {
  date: string;
  planets: { planet: string; longitude: number; sign: string; retrograde: boolean }[];
}

interface RetrogradePeriod {
  planet: string;
  stationRetroDate: string;
  stationRetroLong: number;
  stationDirectDate: string;
  stationDirectLong: number;
  signs: string[];
  preShadowStart?: string;
  postShadowEnd?: string;
}

type ViewMode = 'timeline' | 'calendar';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

const PLANET_SYMBOLS: Record<string, string> = {
  Mercury: '\u263F\uFE0E', Venus: '\u2640\uFE0E', Mars: '\u2642\uFE0E', Jupiter: '\u2643\uFE0E',
  Saturn: '\u2644\uFE0E', Uranus: '\u26E2\uFE0E', Neptune: '\u2646\uFE0E', Pluto: '\u2647\uFE0E',
};

const PLANET_COLORS: Record<string, string> = {
  Mercury: '#00CED1', Venus: '#FF69B4', Mars: '#FF4500', Jupiter: '#9370DB',
  Saturn: '#8B4513', Uranus: '#00FFFF', Neptune: '#0000FF', Pluto: '#800080',
};

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeLong(l: number): number {
  return ((l % 360) + 360) % 360;
}

function dayOfYear(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function totalDaysInYear(year: number): number {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function dateToPercent(dateStr: string, year: number): number {
  const doy = dayOfYear(dateStr);
  return (doy / totalDaysInYear(year)) * 100;
}

function signOfLong(longitude: number): string {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  return signs[Math.floor(normalizeLong(longitude) / 30)];
}

/* ------------------------------------------------------------------ */
/*  Retrograde detection                                               */
/* ------------------------------------------------------------------ */

function detectRetrogradePeriods(entries: EphemerisEntry[], planet: string): RetrogradePeriod[] {
  const periods: RetrogradePeriod[] = [];
  let inRetro = false;
  let stationRetroDate = '';
  let stationRetroLong = 0;
  const signs = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const pData = entry.planets.find(p => p.planet === planet);
    if (!pData) continue;

    if (pData.retrograde && !inRetro) {
      // Station retrograde
      inRetro = true;
      stationRetroDate = entry.date;
      stationRetroLong = pData.longitude;
      signs.clear();
      signs.add(pData.sign);
    } else if (!pData.retrograde && inRetro) {
      // Station direct
      inRetro = false;
      const stationDirectLong = pData.longitude;

      // Find pre-shadow: scan backwards from station retro to find when planet first crossed station direct longitude
      let preShadowStart: string | undefined;
      const retroIdx = entries.findIndex(e => e.date === stationRetroDate);
      for (let j = retroIdx >= 0 ? retroIdx : 0; j >= 0; j--) {
        const p = entries[j].planets.find(pp => pp.planet === planet);
        if (p) {
          // Pre-shadow starts when the planet first reaches the direct-station longitude (going forward)
          // We scan backwards: planet was moving forward, so longitude was increasing.
          // The pre-shadow start is when longitude first equals the station-direct longitude.
          if (normalizeLong(p.longitude) <= normalizeLong(stationDirectLong) + 0.5) {
            preShadowStart = entries[j].date;
            break;
          }
        }
      }

      // Find post-shadow: scan forward from station direct to find when planet returns to station retro longitude
      let postShadowEnd: string | undefined;
      for (let j = i; j < entries.length; j++) {
        const p = entries[j].planets.find(pp => pp.planet === planet);
        if (p) {
          if (normalizeLong(p.longitude) >= normalizeLong(stationRetroLong) - 0.5) {
            postShadowEnd = entries[j].date;
            break;
          }
        }
      }

      periods.push({
        planet,
        stationRetroDate,
        stationRetroLong,
        stationDirectDate: entry.date,
        stationDirectLong,
        signs: Array.from(signs),
        preShadowStart,
        postShadowEnd,
      });
    }

    if (inRetro && pData) {
      signs.add(pData.sign);
    }
  }

  return periods;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RetrogradeCalendarPanel({ lat, lng }: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [entries, setEntries] = useState<EphemerisEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('timeline');

  const fetchEphemeris = useCallback(async (yr: number) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch a wider range to detect shadow periods that spill beyond Jan 1 / Dec 31
      const startDate = `${yr - 1}-10-01`;
      const endDate = `${yr + 1}-03-31`;
      const data = await swissEphemeris.ephemeris({
        start_date: startDate,
        end_date: endDate,
        step: 'daily',
        planets: PLANETS,
      }) as { entries: EphemerisEntry[] } | EphemerisEntry[];
      const arr = Array.isArray(data) ? data : (data as any).entries || [];
      setEntries(arr);
    } catch (err: any) {
      setError(err.message || 'Failed to load ephemeris data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEphemeris(year); }, [year, fetchEphemeris]);

  const allPeriods = useMemo(() => {
    if (!entries.length) return [];
    const periods: RetrogradePeriod[] = [];
    for (const planet of PLANETS) {
      const detected = detectRetrogradePeriods(entries, planet);
      // Filter to periods that overlap with the selected year
      for (const p of detected) {
        const retroYear = new Date(p.stationRetroDate + 'T00:00:00').getFullYear();
        const directYear = new Date(p.stationDirectDate + 'T00:00:00').getFullYear();
        if (retroYear === year || directYear === year) {
          periods.push(p);
        }
      }
    }
    return periods;
  }, [entries, year]);

  // Group by planet, Mercury first
  const grouped = useMemo(() => {
    const map = new Map<string, RetrogradePeriod[]>();
    for (const p of allPeriods) {
      const list = map.get(p.planet) || [];
      list.push(p);
      map.set(p.planet, list);
    }
    // Sort: Mercury first, then by number of retrogrades desc
    const sorted = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === 'Mercury') return -1;
      if (b[0] === 'Mercury') return 1;
      return b[1].length - a[1].length;
    });
    return sorted;
  }, [allPeriods]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPercent = dateToPercent(todayStr, year);
  const isCurrentYear = year === currentYear;

  // Calendar view data: for each day, which planets are retrograde
  const calendarData = useMemo(() => {
    if (view !== 'calendar') return null;
    const days: { date: string; retroPlanets: string[]; shadowPlanets: string[] }[] = [];
    const totalDays = totalDaysInYear(year);
    for (let d = 0; d < totalDays; d++) {
      const date = new Date(year, 0, 1 + d);
      const dateStr = date.toISOString().slice(0, 10);
      const retro: string[] = [];
      const shadow: string[] = [];
      for (const p of allPeriods) {
        const start = p.preShadowStart || p.stationRetroDate;
        const end = p.postShadowEnd || p.stationDirectDate;
        if (dateStr >= p.stationRetroDate && dateStr <= p.stationDirectDate) {
          retro.push(p.planet);
        } else if (dateStr >= start && dateStr < p.stationRetroDate) {
          shadow.push(p.planet);
        } else if (dateStr > p.stationDirectDate && dateStr <= end) {
          shadow.push(p.planet);
        }
      }
      days.push({ date: dateStr, retroPlanets: retro, shadowPlanets: shadow });
    }
    return days;
  }, [view, allPeriods, year]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">Retrograde Calendar</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Planetary retrograde periods with shadow phases</p>
      </div>

      <ToolGuide
        title="Retrograde Calendar"
        description="Shows when planets are retrograde (appearing to move backward) throughout the year. Retrograde periods are times of review, revision, and re-evaluation of the planet's themes. Mercury retrograde is the most discussed, but all planets retrograde."
        tips={[
          "Mercury Rx (3x/year, ~3 weeks): communication snags, travel delays, tech glitches — review and revise",
          "Venus Rx (~every 18 months, ~40 days): relationship reassessment, old flames returning, values shift",
          "Mars Rx (~every 2 years, ~2 months): energy dips, redirected ambition, anger management",
          "Jupiter/Saturn Rx: internalized growth/discipline — less visible but deeply transformative",
          "The shadow period (pre/post retrograde) matters too — themes start building before the station",
          "Retrograde planets in your natal chart operate differently — you may actually thrive during retrogrades of those planets",
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear(y => y - 1)}
            className="px-2 py-0.5 rounded bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
          >
            &larr;
          </button>
          <span className="text-sm font-bold">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="px-2 py-0.5 rounded bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
          >
            &rarr;
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setView('timeline')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${view === 'timeline' ? 'bg-muted/40 text-foreground font-medium' : 'bg-muted/10 text-muted-foreground hover:bg-muted/20'}`}
          >
            Timeline
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${view === 'calendar' ? 'bg-muted/40 text-foreground font-medium' : 'bg-muted/10 text-muted-foreground hover:bg-muted/20'}`}
          >
            Calendar
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
          <div className="w-4 h-4 border-2 border-border/60 border-t-foreground/60 rounded-full animate-spin mr-2" />
          Loading ephemeris data...
        </div>
      )}
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 text-center py-4 rounded-lg border border-red-500/20 bg-red-500/5">
          <p>{error}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Try refreshing or check your connection</p>
        </div>
      )}

      {!loading && !error && view === 'timeline' && (
        <div className="space-y-3">
          {/* Month labels */}
          <div className="relative h-5 ml-20">
            {MONTHS.map((m, i) => (
              <span
                key={m}
                className="absolute text-[11px] font-medium text-muted-foreground"
                style={{ left: `${(i / 12) * 100}%` }}
              >
                {m}
              </span>
            ))}
          </div>

          {grouped.length === 0 && !loading && (
            <div className="text-xs text-muted-foreground text-center py-4">No retrograde periods found for {year}</div>
          )}

          {grouped.map(([planet, periods]) => (
            <div key={planet} className={`${planet === 'Mercury' ? 'pb-3 border-b border-border/50' : ''}`}>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm" style={{ color: PLANET_COLORS[planet] }}>
                  {PLANET_SYMBOLS[planet]}
                </span>
                <span className="text-xs font-medium w-16" style={{ color: PLANET_COLORS[planet] }}>
                  {planet}
                </span>
                {/* Timeline bar */}
                <div className="flex-1 relative h-6 bg-muted/10 rounded-sm overflow-hidden">
                  {/* Today marker */}
                  {isCurrentYear && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-yellow-400/70 z-10"
                      style={{ left: `${todayPercent}%` }}
                    />
                  )}
                  {periods.map((p, idx) => {
                    const retroStart = dateToPercent(p.stationRetroDate, year);
                    const retroEnd = dateToPercent(p.stationDirectDate, year);

                    const preShadowStart = p.preShadowStart ? dateToPercent(p.preShadowStart, year) : retroStart;
                    const postShadowEnd = p.postShadowEnd ? dateToPercent(p.postShadowEnd, year) : retroEnd;

                    const color = PLANET_COLORS[planet];
                    return (
                      <React.Fragment key={idx}>
                        {/* Pre-shadow */}
                        {p.preShadowStart && (
                          <div
                            className="absolute top-0 bottom-0 rounded-sm"
                            style={{
                              left: `${Math.max(0, preShadowStart)}%`,
                              width: `${Math.max(0, retroStart - preShadowStart)}%`,
                              backgroundColor: color,
                              opacity: 0.2,
                            }}
                            title={`Pre-shadow: ${formatDate(p.preShadowStart)}`}
                          />
                        )}
                        {/* Retrograde */}
                        <div
                          className="absolute top-0 bottom-0 rounded-sm"
                          style={{
                            left: `${Math.max(0, retroStart)}%`,
                            width: `${Math.max(0, retroEnd - retroStart)}%`,
                            backgroundColor: color,
                            opacity: 0.8,
                          }}
                          title={`Rx: ${formatDate(p.stationRetroDate)} - ${formatDate(p.stationDirectDate)}`}
                        />
                        {/* Post-shadow */}
                        {p.postShadowEnd && (
                          <div
                            className="absolute top-0 bottom-0 rounded-sm"
                            style={{
                              left: `${Math.max(0, retroEnd)}%`,
                              width: `${Math.max(0, postShadowEnd - retroEnd)}%`,
                              backgroundColor: color,
                              opacity: 0.2,
                            }}
                            title={`Post-shadow: until ${formatDate(p.postShadowEnd)}`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              {/* Details */}
              <div className="ml-20 space-y-0.5">
                {periods.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-foreground/80 dark:text-muted-foreground">
                    <span className="font-mono font-medium">
                      Rx {formatDate(p.stationRetroDate)} {'\u2192'} D {formatDate(p.stationDirectDate)}
                    </span>
                    <span className="text-foreground/60 dark:text-muted-foreground/60">
                      {p.signs.map(s => SIGN_SYMBOLS[s] || s).join(' ')}
                    </span>
                    {p.preShadowStart && (
                      <span className="text-foreground/50 dark:text-muted-foreground/70 text-xs">
                        shadow {formatDate(p.preShadowStart)} - {p.postShadowEnd ? formatDate(p.postShadowEnd) : '?'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] text-foreground/60 dark:text-muted-foreground/70 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2.5 rounded-sm bg-muted/40" /> <span>Pre/Post Shadow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2.5 rounded-sm bg-foreground/60" /> <span>Retrograde</span>
            </div>
            {isCurrentYear && (
              <div className="flex items-center gap-1.5">
                <div className="w-px h-3 bg-yellow-400" /> <span>Today</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar view */}
      {!loading && !error && view === 'calendar' && calendarData && (
        <div className="space-y-4">
          {/* Calendar legend */}
          <div className="flex items-center gap-4 text-[11px] text-foreground/60 dark:text-muted-foreground/70 pb-2 border-b border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2.5 rounded-sm bg-purple-500/30 dark:bg-purple-400/30" /> <span>Retrograde</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2.5 rounded-sm bg-purple-500/10 dark:bg-purple-400/10" /> <span>Shadow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400" /> <span>Planet indicator</span>
            </div>
          </div>

          {Array.from({ length: 12 }, (_, monthIdx) => {
            const firstDay = new Date(year, monthIdx, 1);
            const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
            const startDow = firstDay.getDay(); // 0=Sun

            return (
              <div key={monthIdx}>
                <div className="text-xs font-semibold text-foreground/80 dark:text-muted-foreground mb-1">{MONTHS[monthIdx]} {year}</div>
                <div className="grid grid-cols-7 gap-0.5">
                  {/* Day headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                    <div key={i} className="text-xs font-medium text-foreground/50 dark:text-muted-foreground/60 text-center pb-0.5">{d}</div>
                  ))}
                  {/* Empty cells */}
                  {Array.from({ length: startDow }, (_, i) => (
                    <div key={`e${i}`} className="h-7" />
                  ))}
                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                    const doy = dayOfYear(`${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayIdx + 1).padStart(2, '0')}`);
                    const dayData = calendarData[doy];
                    const isToday = isCurrentYear &&
                      new Date().getMonth() === monthIdx &&
                      new Date().getDate() === dayIdx + 1;
                    const hasRetro = dayData && dayData.retroPlanets.length > 0;
                    const hasShadow = dayData && dayData.shadowPlanets.length > 0;

                    return (
                      <div
                        key={dayIdx}
                        className={`h-7 rounded flex flex-col items-center justify-center relative
                          ${isToday ? 'ring-2 ring-yellow-400 dark:ring-yellow-400' : ''}
                          ${hasRetro ? 'bg-red-500/15 dark:bg-red-400/20 font-bold' : hasShadow ? 'bg-amber-500/10 dark:bg-amber-400/10' : 'bg-muted/5'}`}
                        style={{
                          borderLeft: hasRetro
                            ? `2px solid ${PLANET_COLORS[dayData!.retroPlanets[0]]}`
                            : undefined,
                        }}
                        title={
                          dayData
                            ? [
                                ...dayData.retroPlanets.map(p => `${p} Rx`),
                                ...dayData.shadowPlanets.map(p => `${p} shadow`),
                              ].join(', ') || undefined
                            : undefined
                        }
                      >
                        <span className={`text-[11px] leading-none ${hasRetro ? 'text-foreground font-semibold' : 'text-foreground/60 dark:text-muted-foreground/70'}`}>{dayIdx + 1}</span>
                        {hasRetro && (
                          <div className="flex gap-0.5 mt-0.5">
                            {dayData!.retroPlanets.slice(0, 3).map(p => (
                              <div
                                key={p}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: PLANET_COLORS[p] }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
