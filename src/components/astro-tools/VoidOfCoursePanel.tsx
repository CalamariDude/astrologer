/**
 * Void of Course Moon Calendar
 * Shows periods when the Moon makes no major aspects before leaving its sign.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { swissEphemeris } from '@/api/swissEphemeris';
import { detectVOCPeriods, formatVOCDuration } from '@/lib/voidOfCourseMoon';
import type { VOCPeriod } from '@/lib/voidOfCourseMoon';

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B',
  Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

export default function VoidOfCoursePanel() {
  const [periods, setPeriods] = useState<VOCPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeModern, setIncludeModern] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [error, setError] = useState<string | null>(null);

  const fetchVOCData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch 45 days of ephemeris data at 2-hour intervals
      const startDate = new Date(currentMonth.year, currentMonth.month, 1);
      const endDate = new Date(currentMonth.year, currentMonth.month + 1, 15);
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const data = await swissEphemeris.ephemeris({
        start_date: startStr,
        end_date: endStr,
        interval: 2, // hours
        planets: ['Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'],
      });

      const entries = data.entries || data;
      const vocPeriods = detectVOCPeriods(entries, includeModern);
      setPeriods(vocPeriods);
    } catch (err) {
      console.error('Failed to fetch VOC data:', err);
      setError('Failed to load ephemeris data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, includeModern]);

  useEffect(() => {
    fetchVOCData();
  }, [fetchVOCData]);

  // Filter periods for current month
  const monthPeriods = useMemo(() => {
    const monthStart = new Date(currentMonth.year, currentMonth.month, 1);
    const monthEnd = new Date(currentMonth.year, currentMonth.month + 1, 0, 23, 59, 59);
    return periods.filter(p => {
      const start = new Date(p.voidStart);
      const end = new Date(p.voidEnd);
      return end >= monthStart && start <= monthEnd;
    });
  }, [periods, currentMonth]);

  // Check if currently VOC
  const currentVOC = useMemo(() => {
    const now = new Date();
    return monthPeriods.find(p => {
      const start = new Date(p.voidStart);
      const end = new Date(p.voidEnd);
      return now >= start && now <= end;
    });
  }, [monthPeriods]);

  const monthLabel = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en', {
    month: 'long', year: 'numeric',
  });

  const prevMonth = () => setCurrentMonth(prev => {
    const d = new Date(prev.year, prev.month - 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const nextMonth = () => setCurrentMonth(prev => {
    const d = new Date(prev.year, prev.month + 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const first = new Date(currentMonth.year, currentMonth.month, 1);
    const last = new Date(currentMonth.year, currentMonth.month + 1, 0);
    const startPad = first.getDay();
    const totalDays = last.getDate();

    const days: { day: number; vocPeriods: VOCPeriod[]; isToday: boolean }[] = [];
    const today = new Date();

    for (let d = 1; d <= totalDays; d++) {
      const dayStart = new Date(currentMonth.year, currentMonth.month, d);
      const dayEnd = new Date(currentMonth.year, currentMonth.month, d, 23, 59, 59);
      const isToday = today.getDate() === d && today.getMonth() === currentMonth.month && today.getFullYear() === currentMonth.year;

      const dayPeriods = monthPeriods.filter(p => {
        const pStart = new Date(p.voidStart);
        const pEnd = new Date(p.voidEnd);
        return pEnd >= dayStart && pStart <= dayEnd;
      });

      days.push({ day: d, vocPeriods: dayPeriods, isToday });
    }

    return { startPad, days };
  }, [currentMonth, monthPeriods]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Moon className="w-4 h-4" /> Void of Course Moon
        </h3>
        <p className="text-xs text-muted-foreground">
          Periods when the Moon makes no major aspects before changing signs
        </p>
      </div>

      {/* Current status banner */}
      {currentVOC && (
        <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500 text-white border-0 text-[10px]">VOC NOW</Badge>
            <span className="text-sm font-medium">
              Moon in {SIGN_SYMBOLS[currentVOC.moonSign] || ''} {currentVOC.moonSign}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last aspect: {currentVOC.lastAspect} to {currentVOC.lastAspectPlanet}
            {' \u2022 '} Ends {new Date(currentVOC.voidEnd).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
            {' '} ({SIGN_SYMBOLS[currentVOC.nextSign] || ''} {currentVOC.nextSign})
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={includeModern}
            onChange={e => setIncludeModern(e.target.checked)}
            className="rounded"
          />
          Include outer planets
        </label>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading ephemeris data...</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive text-center py-4">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Calendar grid */}
          <div className="rounded-xl border bg-card/50 p-3">
            <div className="grid grid-cols-7 gap-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-[10px] text-muted-foreground/60 font-semibold py-1">{d}</div>
              ))}
              {Array.from({ length: calendarDays.startPad }, (_, i) => <div key={`pad-${i}`} />)}
              {calendarDays.days.map(({ day, vocPeriods: dayVOC, isToday }) => (
                <div
                  key={day}
                  className={`relative text-center py-1.5 rounded-lg text-xs transition-colors ${
                    isToday ? 'ring-1 ring-primary font-bold' : ''
                  } ${dayVOC.length > 0 ? 'bg-amber-500/10' : 'hover:bg-muted/40'}`}
                >
                  <span className={dayVOC.length > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground'}>
                    {day}
                  </span>
                  {dayVOC.length > 0 && (
                    <div className="flex justify-center mt-0.5 gap-0.5">
                      {dayVOC.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-amber-500" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* VOC periods list */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              VOC Periods ({monthPeriods.length})
            </h4>
            {monthPeriods.length === 0 && (
              <p className="text-sm text-muted-foreground/60 text-center py-4">No VOC periods detected this month</p>
            )}
            {monthPeriods.map((period, i) => {
              const start = new Date(period.voidStart);
              const end = new Date(period.voidEnd);
              const now = new Date();
              const isActive = now >= start && now <= end;
              const isPast = now > end;

              return (
                <div
                  key={i}
                  className={`rounded-xl p-3 border transition-all ${
                    isActive
                      ? 'border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/20'
                      : isPast
                        ? 'border-border/30 opacity-60'
                        : 'border-border/40 hover:border-border/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{SIGN_SYMBOLS[period.moonSign] || ''}</span>
                      <div>
                        <div className="text-sm font-medium flex items-center gap-1.5">
                          {period.moonSign}
                          <span className="text-muted-foreground">→</span>
                          <span>{SIGN_SYMBOLS[period.nextSign] || ''} {period.nextSign}</span>
                          {isActive && <Badge className="bg-amber-500 text-white border-0 text-[9px] ml-1">Active</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Last: {period.lastAspect} to {period.lastAspectPlanet}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-muted-foreground tabular-nums">
                        {formatVOCDuration(period.durationMinutes)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 tabular-nums">
                    {start.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' '}
                    {start.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
                    {' → '}
                    {end.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' '}
                    {end.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
