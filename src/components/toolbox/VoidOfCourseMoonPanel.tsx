/**
 * Void of Course Moon Panel (Toolbox version)
 * Shows VoC periods for the current week using ephemeris data.
 * The Moon is "void of course" when it makes no more major Ptolemaic aspects
 * to any planet before leaving its current sign.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { swissEphemeris } from '@/api/swissEphemeris';
import { ToolGuide } from './ToolGuide';

interface Props {
  lat?: number;
  lng?: number;
}

/* ── Constants ── */

const SIGN_GLYPHS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

/** Render a sign glyph with consistent font styling */
function SignGlyph({ sign, size = 14 }: { sign: string; size?: number }) {
  return (
    <span
      style={{
        fontFamily: '"Segoe UI Symbol", "Noto Sans Symbols2", "Apple Symbols", sans-serif',
        fontSize: size,
        lineHeight: 1,
      }}
    >
      {SIGN_GLYPHS[sign] || ''}
    </span>
  );
}

const SIGNS_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const PLANETS_TO_CHECK = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

const ASPECT_ANGLES = [
  { name: 'conjunction', angle: 0, orb: 8 },
  { name: 'sextile', angle: 60, orb: 6 },
  { name: 'square', angle: 90, orb: 7 },
  { name: 'trine', angle: 120, orb: 8 },
  { name: 'opposition', angle: 180, orb: 8 },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── Helpers ── */

function signFromLongitude(lng: number): string {
  return SIGNS_ORDER[Math.floor(((lng % 360) + 360) % 360 / 30)];
}

function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function hasAspect(moonLng: number, planetLng: number): { name: string; orb: number } | null {
  const diff = angleDiff(moonLng, planetLng);
  for (const asp of ASPECT_ANGLES) {
    const orb = Math.abs(diff - asp.angle);
    if (orb <= asp.orb) return { name: asp.name, orb };
  }
  return null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDeg(lng: number): string {
  const deg = Math.floor(lng % 30);
  const min = Math.floor((lng % 1) * 60);
  return `${deg}\u00B0${String(min).padStart(2, '0')}'`;
}

interface DayEntry {
  date: string;
  moonLng: number;
  moonSign: string;
  planets: Record<string, number>;
}

interface VOCPeriod {
  startDate: string;
  endDate: string;
  moonSign: string;
  nextSign: string;
  lastAspect: string | null;
  lastAspectPlanet: string | null;
  approxStartHour: string;
  approxEndHour: string;
}

function detectVOCPeriods(entries: DayEntry[]): VOCPeriod[] {
  const periods: VOCPeriod[] = [];

  for (let i = 0; i < entries.length - 1; i++) {
    const curr = entries[i];
    const next = entries[i + 1];

    // Detect sign change
    if (curr.moonSign !== next.moonSign) {
      // Moon changes sign between curr and next
      // Find the last aspect the Moon made in the current sign
      let lastAspect: string | null = null;
      let lastAspectPlanet: string | null = null;
      let lastAspectDayIdx = i;

      // Look backwards from current day to find last aspect
      for (let j = i; j >= Math.max(0, i - 3); j--) {
        const entry = entries[j];
        if (entry.moonSign !== curr.moonSign) break; // different sign, stop

        for (const planet of PLANETS_TO_CHECK) {
          const pLng = entry.planets[planet];
          if (pLng == null) continue;
          const asp = hasAspect(entry.moonLng, pLng);
          if (asp) {
            lastAspect = asp.name;
            lastAspectPlanet = planet;
            lastAspectDayIdx = j;
          }
        }
      }

      // Also check current day for aspects (in case the aspect is today)
      let hasAspectToday = false;
      for (const planet of PLANETS_TO_CHECK) {
        const pLng = curr.planets[planet];
        if (pLng == null) continue;
        if (hasAspect(curr.moonLng, pLng)) {
          hasAspectToday = true;
          break;
        }
      }

      // VoC starts after the last aspect day, ends when Moon changes sign
      // If the last aspect is on the same day as the sign change, VoC may be very short
      const vocStartDate = hasAspectToday ? curr.date : (lastAspectDayIdx < i ? entries[lastAspectDayIdx].date : curr.date);

      periods.push({
        startDate: vocStartDate,
        endDate: next.date,
        moonSign: curr.moonSign,
        nextSign: next.moonSign,
        lastAspect,
        lastAspectPlanet,
        approxStartHour: hasAspectToday ? 'Late' : 'Early',
        approxEndHour: 'Early',
      });
    }
  }

  return periods;
}

/* ── Component ── */

export function VoidOfCourseMoonPanel({ lat, lng }: Props) {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current week range
  const weekRange = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 8); // 9 days for detection across boundaries

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { start: fmt(start), end: fmt(end), startDate: start };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await swissEphemeris.ephemeris({
          start_date: weekRange.start,
          end_date: weekRange.end,
          interval: 24, // daily
          planets: ['Moon', ...PLANETS_TO_CHECK],
        });

        const raw = data.entries || data;
        if (!cancelled && Array.isArray(raw)) {
          const parsed: DayEntry[] = raw.map((e: any) => {
            const moonEntry = (e.planets || []).find((p: any) => p.planet === 'Moon');
            const others: Record<string, number> = {};
            for (const p of (e.planets || [])) {
              if (p.planet !== 'Moon') {
                others[p.planet] = p.longitude;
              }
            }
            return {
              date: e.date,
              moonLng: moonEntry?.longitude ?? 0,
              moonSign: moonEntry?.sign ?? signFromLongitude(moonEntry?.longitude ?? 0),
              planets: others,
            };
          });
          setEntries(parsed);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load ephemeris data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [weekRange]);

  const vocPeriods = useMemo(() => detectVOCPeriods(entries), [entries]);

  // Current status
  const currentStatus = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find(e => e.date === todayStr);
    const isVOC = vocPeriods.some(p => p.startDate <= todayStr && p.endDate >= todayStr);
    return {
      moonSign: todayEntry?.moonSign || null,
      moonLng: todayEntry?.moonLng || 0,
      isVOC,
      vocPeriod: isVOC ? vocPeriods.find(p => p.startDate <= todayStr && p.endDate >= todayStr) : null,
    };
  }, [entries, vocPeriods]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-xs text-muted-foreground/60">
        <div className="w-4 h-4 border-2 border-border/60 border-t-foreground/60 rounded-full animate-spin mr-2" />
        Loading ephemeris data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-400 text-center py-8 rounded-lg border border-red-500/20 bg-red-500/5">
        <p>{error}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">Try refreshing or check your connection</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Title */}
      <div>
        <h3 className="text-sm font-semibold">Void of Course Moon</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Weekly VoC periods based on daily ephemeris</p>
      </div>

      <ToolGuide
        title="Void of Course Moon"
        description="The Moon is 'void of course' when it makes no more major aspects before leaving its current sign. During VOC periods, new initiatives tend to fizzle — things don't develop as expected. It's a time for rest, routine, and reflection rather than launching anything new."
        tips={[
          "The current Moon status shows whether we're in a VOC period right now",
          "VOC periods are great for meditation, journaling, and finishing tasks already in progress",
          "Avoid signing contracts, starting businesses, or making big purchases during VOC Moon",
          "Short VOC periods (under a few hours) are less impactful than long ones",
          "The upcoming VOC periods table helps you plan around these windows",
          "The last aspect the Moon made before going VOC gives a clue about the mood — harmonious aspects leave a positive tone",
        ]}
      />

      {/* Header */}
      <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
          About VoC
        </div>
        <div className="text-xs text-muted-foreground/80 leading-relaxed">
          The Moon is "void of course" when it makes no more major Ptolemaic aspects
          (conjunction, sextile, square, trine, opposition) before leaving its current sign.
          Traditionally, actions begun during VoC periods may not produce the expected results.
        </div>
      </div>

      {/* Current Status */}
      {currentStatus.moonSign && (
        <div className={`rounded-lg border px-3 py-2.5 ${
          currentStatus.isVOC
            ? 'border-amber-600/40 bg-amber-500/10 dark:border-amber-500/30'
            : 'border-emerald-600/40 bg-emerald-500/10 dark:border-emerald-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SignGlyph sign={currentStatus.moonSign} size={18} />
              <div>
                <div className="text-xs text-muted-foreground uppercase">Current Status</div>
                <div className="text-sm font-semibold">
                  {currentStatus.isVOC ? (
                    <span className="text-amber-600 dark:text-amber-400">Moon is Void of Course</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">Moon is active in {currentStatus.moonSign}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Position</div>
              <div className="font-mono text-foreground/70">{formatDeg(currentStatus.moonLng)}</div>
            </div>
          </div>
          {currentStatus.isVOC && currentStatus.vocPeriod && (
            <div className="text-xs text-amber-700/70 dark:text-amber-400/60 mt-1">
              Last aspect: {currentStatus.vocPeriod.lastAspect || 'none'} to {currentStatus.vocPeriod.lastAspectPlanet || '—'}
              {' · '} Enters <SignGlyph sign={currentStatus.vocPeriod.nextSign} size={11} /> {currentStatus.vocPeriod.nextSign} on {formatDate(currentStatus.vocPeriod.endDate)}
            </div>
          )}
        </div>
      )}

      {/* Day-by-day view */}
      <div>
        <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5">
          This Week — Moon by Day
        </div>
        <div className="rounded-lg border border-border/50 overflow-hidden overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-muted/10">
              <tr className="text-muted-foreground/60">
                <th className="py-1.5 px-2 text-left font-medium">Day</th>
                <th className="py-1.5 px-2 text-left font-medium">Moon Sign</th>
                <th className="py-1.5 px-2 text-left font-medium">Degree</th>
                <th className="py-1.5 px-2 text-center font-medium">VoC</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 7).map((entry, idx) => {
                const todayStr = new Date().toISOString().split('T')[0];
                const isToday = entry.date === todayStr;
                const isVOC = vocPeriods.some(p => p.startDate <= entry.date && p.endDate >= entry.date);
                const vocForDay = vocPeriods.find(p => p.startDate === entry.date || p.endDate === entry.date);
                const dt = new Date(entry.date + 'T12:00:00');

                return (
                  <tr
                    key={entry.date}
                    className={`border-t border-border/30 transition-colors ${
                      isToday ? 'bg-muted/20' : isVOC ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-1.5 px-2">
                      <div className={`font-medium ${isToday ? 'text-foreground' : 'text-foreground/70'}`}>
                        {DAY_NAMES[dt.getDay()]}
                      </div>
                      <div className="text-[11px] text-muted-foreground/70 font-mono">{entry.date.slice(5)}</div>
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="text-muted-foreground mr-1"><SignGlyph sign={entry.moonSign} size={12} /></span>
                      <span className="text-foreground/80">{entry.moonSign}</span>
                    </td>
                    <td className="py-1.5 px-2 font-mono text-muted-foreground">
                      {formatDeg(entry.moonLng)}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {isVOC ? (
                        <span className="inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          VoC
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VoC Periods */}
      <div>
        <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5">
          Upcoming VoC Periods ({vocPeriods.length})
        </div>
        {vocPeriods.length === 0 ? (
          <div className="text-xs text-muted-foreground/70 text-center py-4">No VoC periods detected this week</div>
        ) : (
          <div className="space-y-1.5">
            {vocPeriods.map((period, i) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isActive = period.startDate <= todayStr && period.endDate >= todayStr;
              const isPast = period.endDate < todayStr;

              return (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 transition-all ${
                    isActive
                      ? 'border-amber-600/40 bg-amber-500/10 dark:border-amber-500/30'
                      : isPast
                        ? 'border-border/30 bg-muted/5 opacity-50'
                        : 'border-border/50 bg-muted/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SignGlyph sign={period.moonSign} size={16} />
                      <div>
                        <div className="text-[11px] font-medium text-foreground/80 flex items-center gap-1">
                          {period.moonSign}
                          <span className="text-muted-foreground/70">→</span>
                          <SignGlyph sign={period.nextSign} size={11} /> {period.nextSign}
                          {isActive && (
                            <span className="ml-1 inline-block rounded px-1 py-0.5 text-[11px] font-bold bg-amber-500 text-white dark:text-background">
                              NOW
                            </span>
                          )}
                        </div>
                        {period.lastAspect && (
                          <div className="text-[11px] text-muted-foreground">
                            Last: {period.lastAspect} to {period.lastAspectPlanet}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground/70 mt-1 font-mono">
                    {formatDate(period.startDate)} ({period.approxStartHour})
                    {' → '}
                    {formatDate(period.endDate)} ({period.approxEndHour})
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="text-[11px] text-muted-foreground/70 leading-relaxed px-1">
        Times are approximate (±2 hours). Based on daily ephemeris data.
        For precise VoC timing, consult a detailed ephemeris with hourly resolution.
      </div>
    </div>
  );
}
