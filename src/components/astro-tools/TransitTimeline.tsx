/**
 * Transit Timeline
 * Chronological list of upcoming exact transits to natal chart
 * Features: timeline, calendar, and theme grouping views; auto-load on mount
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, List, CalendarDays, Zap, Tag, ChevronDown, ChevronRight, Search, X, Download } from 'lucide-react';
import { swissEphemeris } from '@/api/swissEphemeris';
import { PLANETS, ASPECTS } from '@/components/biwheel/utils/constants';
import type { NatalChart } from '@/components/biwheel/types';
import { detectTransitEvents } from '@/lib/transitTimeline';
import { AstroSearchBar } from './AstroSearchBar';
import type { TransitEvent } from '@/lib/transitTimeline';
import { LIFE_THEMES } from '@/lib/astroThemes';
import { downloadTransitICS } from '@/lib/icalExport';

interface TransitTimelineProps {
  natalChart: NatalChart;
  birthInfo?: { date: string; time: string; lat: number; lng: number };
  personName: string;
}

const PLANET_SYMBOLS: Record<string, string> = {};
Object.entries(PLANETS).forEach(([key, val]) => { PLANET_SYMBOLS[key] = val.symbol; });
Object.entries(PLANETS).forEach(([key, val]) => { PLANET_SYMBOLS[key.charAt(0).toUpperCase() + key.slice(1)] = val.symbol; });

// Use shared theme definitions
const THEMES = LIFE_THEMES;

function formatOrb(orb: number): string {
  const deg = Math.floor(orb);
  const min = Math.round((orb - deg) * 60);
  return `${deg}\u00B0${min.toString().padStart(2, '0')}'`;
}

/** Nature accent colors for event rows */
const NATURE_ACCENT: Record<string, { border: string; bg: string; text: string }> = {
  harmonious:  { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.06)', text: '#60a5fa' },
  challenging: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.06)',  text: '#f87171' },
  neutral:     { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.06)', text: '#fbbf24' },
};

function EventRow({ event }: { event: TransitEvent }) {
  const transitSymbol = PLANET_SYMBOLS[event.transitPlanet] || event.transitPlanet;
  const natalSymbol = PLANET_SYMBOLS[event.natalPlanet] || event.natalPlanet;
  const accent = NATURE_ACCENT[event.aspectNature] || NATURE_ACCENT.neutral;
  const strengthPct = Math.max(5, Math.round((1 - event.exactOrb / 10) * 100));

  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-xl transition-all overflow-hidden ${
        event.isActive
          ? 'ring-1 shadow-md'
          : 'border border-border/40 hover:border-border/60 hover:shadow-sm'
      }`}
      style={{
        borderLeft: `3px solid ${accent.border}`,
        backgroundColor: event.isActive ? accent.bg : undefined,
        ringColor: event.isActive ? accent.border + '30' : undefined,
        boxShadow: event.isActive ? `0 0 16px ${accent.border}10, 0 1px 3px rgba(0,0,0,0.08)` : undefined,
      }}
    >
      {/* Planet aspect display */}
      <div className="flex items-center gap-1 min-w-[70px]">
        <span className="text-xl" title={event.transitPlanet}>{transitSymbol}</span>
        <span className="text-lg font-medium" style={{ color: event.aspectColor }}>{event.aspectSymbol}</span>
        <span className="text-xl" title={event.natalPlanet}>{natalSymbol}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{event.transitPlanet} {event.aspectType} {event.natalPlanet}</span>
          {event.isActive && (
            <Badge className="text-[9px] px-1.5 h-4 gap-0.5 border-0" style={{ backgroundColor: accent.border, color: '#fff' }}>
              <Zap className="w-2 h-2" />Active
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
          {new Date(event.ingressDate + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          {' \u2192 '}
          <span className="font-semibold text-foreground">
            {new Date(event.exactDate + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </span>
          {' \u2192 '}
          {new Date(event.egressDate + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Orb + strength bar */}
      <div className="flex flex-col items-end gap-1 min-w-[52px]">
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{formatOrb(event.exactOrb)}</span>
        <div className="w-10 h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${strengthPct}%`, backgroundColor: accent.border, opacity: 0.6 }}
          />
        </div>
      </div>
    </div>
  );
}

function CalendarView({ events, month, year, selectedDay, onSelectDay }: {
  events: TransitEvent[];
  month: number;
  year: number;
  selectedDay: string | null;
  onSelectDay: (dateStr: string | null) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const dateEventMap = useMemo(() => {
    const map = new Map<number, TransitEvent[]>();
    for (const event of events) {
      // Include events where this day falls between ingress and egress
      for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (dateStr >= event.ingressDate && dateStr <= event.egressDate) {
          if (!map.has(d)) map.set(d, []);
          const existing = map.get(d)!;
          if (!existing.includes(event)) existing.push(event);
        }
      }
    }
    return map;
  }, [events, month, year, totalDays]);

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const makeDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="rounded-xl border bg-card/50 p-3">
      <div className="text-center font-semibold text-sm mb-2.5">
        {firstDay.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[10px] text-muted-foreground/60 font-semibold py-1">{d}</div>
        ))}
        {Array.from({ length: startPad }, (_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const dayEvents = dateEventMap.get(day) || [];
          const dateStr = makeDateStr(day);
          const isSelected = selectedDay === dateStr;
          return (
            <button
              key={day}
              onClick={() => onSelectDay(isSelected ? null : dateStr)}
              className={`text-center py-1.5 rounded-lg text-xs relative transition-all cursor-pointer ${
                isSelected ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary shadow-sm' :
                isToday(day) ? 'bg-primary/10 font-bold ring-1 ring-primary/30' :
                dayEvents.length > 0 ? 'bg-muted/30 hover:bg-muted/60' : 'hover:bg-muted/20'
              }`}
            >
              {day}
              {dayEvents.length > 0 && !isSelected && (
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((e, j) => (
                    <div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: e.aspectColor }}
                      title={`${e.transitPlanet} ${e.aspectType} ${e.natalPlanet}`}
                    />
                  ))}
                  {dayEvents.length > 3 && <span className="text-[7px] text-muted-foreground">+{dayEvents.length - 3}</span>}
                </div>
              )}
              {isSelected && dayEvents.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center shadow-sm">
                  {dayEvents.length}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Panel showing transits for a selected calendar day */
function DayDetailPanel({ dateStr, events, onClose }: { dateStr: string; events: TransitEvent[]; onClose: () => void }) {
  // Find all events active on this day (ingress <= date <= egress)
  const dayEvents = useMemo(() => {
    return events.filter(e => dateStr >= e.ingressDate && dateStr <= e.egressDate)
      .sort((a, b) => a.exactOrb - b.exactOrb);
  }, [dateStr, events]);

  const displayDate = new Date(dateStr + 'T12:00:00');
  const exactToday = dayEvents.filter(e => e.exactDate === dateStr);
  const passingThrough = dayEvents.filter(e => e.exactDate !== dateStr);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div>
          <div className="text-sm font-semibold">
            {displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {dayEvents.length} transit{dayEvents.length !== 1 ? 's' : ''} active
            {exactToday.length > 0 && ` \u00B7 ${exactToday.length} exact`}
          </div>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors">
          Close
        </button>
      </div>

      {dayEvents.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">No transits active on this day</div>
      ) : (
        <div className="divide-y">
          {/* Exact on this day */}
          {exactToday.length > 0 && (
            <div className="px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">Exact This Day</div>
              <div className="space-y-2">
                {exactToday.map((event, i) => <EventRow key={`exact-${i}`} event={event} />)}
              </div>
            </div>
          )}

          {/* Passing through (active but not exact) */}
          {passingThrough.length > 0 && (
            <div className="px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active (In Orb)</div>
              <div className="space-y-2">
                {passingThrough.map((event, i) => <EventRow key={`pass-${i}`} event={event} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ThemeGroupView({ events }: { events: TransitEvent[] }) {
  // Group events by theme
  const grouped = useMemo(() => {
    const result: { themeKey: string; theme: ThemeDef; events: TransitEvent[] }[] = [];

    for (const [themeKey, theme] of Object.entries(THEMES)) {
      const themeEvents = events.filter(e =>
        theme.planets.has(e.transitPlanet) || theme.planets.has(e.transitPlanet.toLowerCase())
      );
      if (themeEvents.length > 0) {
        result.push({ themeKey, theme, events: themeEvents });
      }
    }

    // "Other" category for unmatched
    const matchedPlanets = new Set<string>();
    for (const theme of Object.values(THEMES)) {
      for (const p of theme.planets) matchedPlanets.add(p);
    }
    const otherEvents = events.filter(e =>
      !matchedPlanets.has(e.transitPlanet) && !matchedPlanets.has(e.transitPlanet.toLowerCase())
    );
    if (otherEvents.length > 0) {
      result.push({
        themeKey: 'other',
        theme: { name: 'Other Transits', icon: Zap, planets: new Set(), color: '#6b7280', bgClass: 'bg-gray-500/8' },
        events: otherEvents,
      });
    }

    return result;
  }, [events]);

  return (
    <div className="space-y-2">
      {grouped.map(({ themeKey, theme, events: themeEvents }) => {
        const hasActive = themeEvents.some(e => e.isActive);
        const Icon = theme.icon;

        return (
          <Collapsible key={themeKey} defaultOpen={hasActive}>
            <CollapsibleTrigger className="w-full">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${theme.bgClass} transition-all hover:opacity-90`}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: theme.color }} />
                <span className="text-sm font-semibold flex-1 text-left">{theme.name}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{themeEvents.length}</Badge>
                {hasActive && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.color }} />
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 pt-2 pl-4">
                {themeEvents.map((event, i) => (
                  <EventRow key={i} event={event} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

export function TransitTimeline({ natalChart, personName }: TransitTimelineProps) {
  const [events, setEvents] = useState<TransitEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'timeline' | 'calendar' | 'themes'>('timeline');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState('3M');
  const [planetFilter, setPlanetFilter] = useState<Set<string>>(new Set());
  const [natureFilter, setNatureFilter] = useState<Set<string>>(new Set());
  const [aspectFilter, setAspectFilter] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);

  // Event search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchTransitPlanet, setSearchTransitPlanet] = useState('');
  const [searchNatalPlanet, setSearchNatalPlanet] = useState('');
  const [searchAspectType, setSearchAspectType] = useState('');

  const fetchTransits = useCallback(async (preset: string) => {
    setLoading(true);
    setError(null);
    setActivePreset(preset);

    const now = new Date();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const start = fmt(now);

    let end: Date;
    let step: string;
    switch (preset) {
      case '1M': end = new Date(now); end.setMonth(end.getMonth() + 1); step = 'daily'; break;
      case '3M': end = new Date(now); end.setMonth(end.getMonth() + 3); step = 'daily'; break;
      case '6M': end = new Date(now); end.setMonth(end.getMonth() + 6); step = 'daily'; break;
      case '1Y': end = new Date(now); end.setFullYear(end.getFullYear() + 1); step = 'daily'; break;
      case '2Y': end = new Date(now); end.setFullYear(end.getFullYear() + 2); step = 'weekly'; break;
      case '5Y': end = new Date(now); end.setFullYear(end.getFullYear() + 5); step = 'weekly'; break;
      case '10Y': end = new Date(now); end.setFullYear(end.getFullYear() + 10); step = 'weekly'; break;
      case '20Y': end = new Date(now); end.setFullYear(end.getFullYear() + 20); step = 'weekly'; break;
      default: end = new Date(now); end.setMonth(end.getMonth() + 3); step = 'daily'; break;
    }

    try {
      const data = await swissEphemeris.ephemeris({ start_date: start, end_date: fmt(end), step });
      if (data?.error) throw new Error(data.error);
      const detected = detectTransitEvents(data.entries || [], natalChart);
      setEvents(detected);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [natalChart]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchTransits('3M');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (planetFilter.size > 0 && !planetFilter.has(e.transitPlanet.toLowerCase()) && !planetFilter.has(e.natalPlanet)) return false;
      if (aspectFilter.size > 0 && !aspectFilter.has(e.aspectType)) return false;
      // Event search filters
      if (searchTransitPlanet && e.transitPlanet.toLowerCase() !== searchTransitPlanet) return false;
      if (searchNatalPlanet && e.natalPlanet !== searchNatalPlanet) return false;
      if (searchAspectType && e.aspectType !== searchAspectType) return false;
      return true;
    });
  }, [events, planetFilter, aspectFilter, searchTransitPlanet, searchNatalPlanet, searchAspectType]);

  const togglePlanetFilter = (planet: string) => {
    setPlanetFilter(prev => {
      const next = new Set(prev);
      if (next.has(planet)) next.delete(planet); else next.add(planet);
      return next;
    });
  };

  const toggleNatureFilter = (nature: string) => {
    setNatureFilter(prev => {
      const next = new Set(prev);
      if (next.has(nature)) next.delete(nature); else next.add(nature);
      return next;
    });
  };

  const toggleAspectFilter = (aspect: string) => {
    setAspectFilter(prev => {
      const next = new Set(prev);
      if (next.has(aspect)) next.delete(aspect); else next.add(aspect);
      return next;
    });
  };

  // Get unique aspect types present in current events
  const availableAspects = useMemo(() => {
    const seen = new Set<string>();
    for (const e of events) seen.add(e.aspectType);
    // Sort: major aspects first, then minor, alphabetical within each group
    const majorOrder = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];
    return Array.from(seen).sort((a, b) => {
      const aIdx = majorOrder.indexOf(a);
      const bIdx = majorOrder.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [events]);

  if (!natalChart?.planets || Object.keys(natalChart.planets).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm text-muted-foreground/60">Calculate a chart first to see transits</p>
      </div>
    );
  }

  const now = new Date();
  const activeCount = filteredEvents.filter(e => e.isActive).length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">{personName}'s Transit Timeline</h3>
        <p className="text-xs text-muted-foreground">Upcoming transits to natal chart &mdash; track ingress, exact, and egress dates</p>
      </div>

      <AstroSearchBar
        natalChart={natalChart}
        onHit={(hit) => {
          if (hit.view === 'transit') setView('timeline');
          if (hit.date) setSelectedCalendarDay(hit.date);
        }}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 p-3">
        {/* Time presets */}
        <div className="flex gap-1">
          {['1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', '20Y'].map(p => (
            <button
              key={p}
              onClick={() => fetchTransits(p)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePreset === p && events.length > 0
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background border hover:bg-muted/60'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* View toggle */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setView('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'timeline' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/60'
            }`}
          >
            <List className="w-3 h-3" />Timeline
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/60'
            }`}
          >
            <CalendarDays className="w-3 h-3" />Calendar
          </button>
          <button
            onClick={() => setView('themes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'themes' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/60'
            }`}
          >
            <Tag className="w-3 h-3" />Themes
          </button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Event search toggle */}
        <button
          onClick={() => setShowSearch(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showSearch || searchTransitPlanet || searchNatalPlanet || searchAspectType
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-background border hover:bg-muted/60'
          }`}
        >
          <Search className="w-3 h-3" />
          Search
        </button>

        {/* iCal export */}
        {events.length > 0 && (
          <>
            <div className="w-px h-6 bg-border" />
            <button
              onClick={() => downloadTransitICS(events, personName)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-background border hover:bg-muted/60 transition-all"
              title="Export to Calendar (.ics)"
            >
              <Download className="w-3 h-3" />
              iCal
            </button>
          </>
        )}

        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Event Search Panel */}
      {showSearch && (
        <div className="rounded-xl border bg-card/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Event Search</h4>
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchTransitPlanet('');
                setSearchNatalPlanet('');
                setSearchAspectType('');
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Find when a specific transit aspects your natal chart</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1 block">Transit Planet</label>
              <select
                value={searchTransitPlanet}
                onChange={(e) => setSearchTransitPlanet(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Any</option>
                {['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].map(p => {
                  const info = PLANETS[p as keyof typeof PLANETS];
                  return <option key={p} value={p}>{info?.symbol} {info?.name}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1 block">Aspect</label>
              <select
                value={searchAspectType}
                onChange={(e) => setSearchAspectType(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Any</option>
                {['conjunction', 'sextile', 'square', 'trine', 'quincunx', 'opposition'].map(a => {
                  const def = ASPECTS[a as keyof typeof ASPECTS];
                  return <option key={a} value={a}>{def?.symbol} {def?.name}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1 block">Natal Planet</label>
              <select
                value={searchNatalPlanet}
                onChange={(e) => setSearchNatalPlanet(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Any</option>
                {['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'ascendant', 'midheaven'].map(p => {
                  const info = PLANETS[p as keyof typeof PLANETS];
                  return <option key={p} value={p}>{info?.symbol} {info?.name || p}</option>;
                })}
              </select>
            </div>
          </div>
          {(searchTransitPlanet || searchNatalPlanet || searchAspectType) && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                {filteredEvents.length} result{filteredEvents.length !== 1 ? 's' : ''} found
              </span>
              <button
                onClick={() => { setSearchTransitPlanet(''); setSearchNatalPlanet(''); setSearchAspectType(''); }}
                className="text-xs text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {events.length > 0 && view !== 'themes' && (
        <div className="space-y-2">
          {/* Planet & nature filters */}
          <div className="flex flex-wrap gap-1.5">
            {['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].map(p => {
              const info = PLANETS[p as keyof typeof PLANETS];
              const active = planetFilter.size === 0 || planetFilter.has(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlanetFilter(p)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                    active ? 'text-white shadow-sm' : 'bg-muted/30 text-muted-foreground'
                  }`}
                  style={active ? { backgroundColor: info?.color } : {}}
                >
                  {info?.symbol} {info?.name}
                </button>
              );
            })}
          </div>

          {/* Aspect type filter */}
          {availableAspects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1">Aspects</span>
              {availableAspects.map(a => {
                const def = ASPECTS[a as keyof typeof ASPECTS];
                if (!def) return null;
                const active = aspectFilter.size === 0 || aspectFilter.has(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggleAspectFilter(a)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                      active ? 'ring-1 shadow-sm' : 'bg-muted/30 text-muted-foreground'
                    }`}
                    style={active ? {
                      backgroundColor: def.color + '18',
                      color: def.color,
                      ringColor: def.color + '40',
                      borderColor: def.color + '40',
                      boxShadow: `inset 0 0 0 1px ${def.color}30`,
                    } : {}}
                  >
                    <span className="text-sm">{def.symbol}</span> {def.name}
                  </button>
                );
              })}
              {aspectFilter.size > 0 && (
                <button
                  onClick={() => setAspectFilter(new Set())}
                  className="px-2 py-1 rounded-full text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Initial loading skeleton */}
      {initialLoading && loading && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      {/* Summary pills */}
      {events.length > 0 && (
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 ring-1 ring-primary/20">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium">{activeCount} active now</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40">
            <span className="text-xs font-medium text-muted-foreground">{filteredEvents.length} total events</span>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {view === 'timeline' && filteredEvents.length > 0 && (
        <div className="space-y-2 max-h-[600px] overflow-y-auto px-1 py-1">
          {filteredEvents.map((event, i) => (
            <EventRow key={i} event={event} />
          ))}
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && events.length > 0 && (() => {
        const presetMonths: Record<string, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, '2Y': 24, '5Y': 60, '10Y': 120, '20Y': 240 };
        const totalMonths = presetMonths[activePreset] || 3;
        const maxCalendarMonths = 24; // Cap calendar at 2 years for performance
        const displayMonths = Math.min(totalMonths, maxCalendarMonths);
        return (
          <div className="space-y-4">
            {totalMonths > maxCalendarMonths && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                Showing first 2 years in calendar view. Use the timeline view to see all {filteredEvents.length} events.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: displayMonths }, (_, i) => {
                const month = (now.getMonth() + i) % 12;
                const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
                return <CalendarView key={`${year}-${month}`} events={filteredEvents} month={month} year={year} selectedDay={selectedCalendarDay} onSelectDay={setSelectedCalendarDay} />;
              })}
            </div>

            {/* Day detail panel */}
            {selectedCalendarDay && (
              <DayDetailPanel dateStr={selectedCalendarDay} events={filteredEvents} onClose={() => setSelectedCalendarDay(null)} />
            )}
          </div>
        );
      })()}

      {/* Themes View */}
      {view === 'themes' && filteredEvents.length > 0 && (
        <ThemeGroupView events={filteredEvents} />
      )}

      {events.length === 0 && !loading && !initialLoading && (
        <div className="text-center py-12 rounded-xl border border-dashed bg-muted/10">
          <CalendarDays className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground">Select a time range to detect upcoming transits</div>
          <div className="text-xs text-muted-foreground/60 mt-1">Identify applying and separating aspects to your natal chart</div>
        </div>
      )}
    </div>
  );
}
