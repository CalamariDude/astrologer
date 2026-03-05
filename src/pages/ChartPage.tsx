import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { Loader2, MapPin, Plus, X, Pencil, LogIn, User, Users, Calendar, Clock, Search, Sparkles, Grid3X3, RotateCcw, Gauge, Table2, TrendingUp, CalendarClock, ArrowUpDown, StickyNote, Keyboard, Settings, FolderOpen, Radio, AlertTriangle, Link2, Crown, ArrowLeft, Sun, Moon, Star } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { addClient } from '@/lib/clients';
import { SaveChartButton } from '@/components/charts/SaveChartButton';
import { getSavedCharts, getSavedChartsAsync, invalidateChartsCache, type SavedChart } from '@/components/charts/SaveChartButton';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateInput } from '@/components/ui/DateInput';
import { TimeInput } from '@/components/ui/TimeInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BiWheelMobileWrapper } from '@/components/biwheel';
import { swissEphemeris } from '@/api/swissEphemeris';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';
import { applyTheme } from '@/components/biwheel/utils/constants';
import type { ThemeName } from '@/components/biwheel/utils/themes';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { ChartSpotlight } from '@/components/charts/ChartSpotlight';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { supabase } from '@/lib/supabase';
import type { TransitData, CompositeData, ProgressedData, RelocatedData, AsteroidsParam, AsteroidGroup, ChartMode } from '@/components/biwheel/types';
import { ASTEROID_GROUPS } from '@/components/biwheel/types';
import { GalacticToggle } from '@/components/galactic/GalacticToggle';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useIsMobile } from '@/hooks/use-mobile';
import { KeyboardShortcutsHelp } from '@/components/ui/KeyboardShortcutsHelp';
import { TAB_VALUES } from '@/lib/keyboardShortcuts';
import * as analytics from '@/lib/analytics';
import { useSession } from '@/hooks/useSession';
import { StartSessionButton } from '@/components/session/StartSessionButton';
import { SessionControls } from '@/components/session/SessionControls';
import { PostSessionBanner } from '@/components/session/PostSessionBanner';
import { OtherWindowBanner } from '@/components/session/OtherWindowBanner';
import { VideoFeed } from '@/components/session/VideoFeed';
import { VideoGallery } from '@/components/session/VideoGallery';
import type { SessionChartSnapshot, ChartStateSnapshot } from '@/lib/session/types';

// Lazy-load GalacticMode to avoid loading Three.js until needed
const GalacticMode = React.lazy(() => import('@/components/galactic/GalacticMode'));

// Astro tools — lazy-loaded (each tab only loads when selected)
const AspectGridTable = React.lazy(() => import('@/components/astro-tools/AspectGridTable').then(m => ({ default: m.AspectGridTable })));
const ProfectionsPanel = React.lazy(() => import('@/components/astro-tools/ProfectionsPanel').then(m => ({ default: m.ProfectionsPanel })));
const EphemerisTable = React.lazy(() => import('@/components/astro-tools/EphemerisTable').then(m => ({ default: m.EphemerisTable })));
const GraphicEphemeris = React.lazy(() => import('@/components/astro-tools/GraphicEphemeris').then(m => ({ default: m.GraphicEphemeris })));
const TransitTimeline = React.lazy(() => import('@/components/astro-tools/TransitTimeline').then(m => ({ default: m.TransitTimeline })));
const AgeDegreePanel = React.lazy(() => import('@/components/astro-tools/AgeDegreePanel').then(m => ({ default: m.AgeDegreePanel })));
const DeclinationPanel = React.lazy(() => import('@/components/astro-tools/DeclinationPanel').then(m => ({ default: m.DeclinationPanel })));
const ChartNotes = React.lazy(() => import('@/components/astro-tools/ChartNotes').then(m => ({ default: m.ChartNotes })));
const AIReading = React.lazy(() => import('@/components/astro-tools/AIReading').then(m => ({ default: m.AIReading })));
const DignityTable = React.lazy(() => import('@/components/astro-tools/DignityTable').then(m => ({ default: m.DignityTable })));
const FixedStarsPanel = React.lazy(() => import('@/components/astro-tools/FixedStarsPanel').then(m => ({ default: m.FixedStarsPanel })));
const TimeFinder = React.lazy(() => import('@/components/astro-tools/TimeFinder').then(m => ({ default: m.TimeFinder })));

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// ─── Types ──────────────────────────────────────────────────────────

interface BirthData {
  name: string;
  date: string;
  time: string;
  location: string;
  lat: number | null;
  lng: number | null;
}

interface NatalChart {
  planets: Record<string, any>;
  houses?: Record<string, number>;
  angles?: { ascendant: number; midheaven: number };
}

interface PersonData extends BirthData {
  natalChart: NatalChart;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

const emptyBirth = (): BirthData => ({
  name: '',
  date: '',
  time: '12:00',
  location: '',
  lat: null,
  lng: null,
});

interface ChartTab {
  id: string;
  personAData: BirthData;
  personBData: BirthData | null;
  chartA: NatalChart | null;
  chartB: NatalChart | null;
  editing: boolean;
  timeShiftA?: number;
  timeShiftB?: number;
}

function generateTabId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getTabLabel(tab: ChartTab): string {
  const nameA = tab.personAData.name?.trim();
  const nameB = tab.personBData?.name?.trim();
  if (nameA && nameB) return `${nameA} & ${nameB}`;
  if (nameA) return nameA;
  if (tab.chartA) return 'Chart';
  return 'New Chart';
}

// ─── Inline Birth Form ─────────────────────────────────────────────

interface SavedPerson {
  name: string;
  date: string;
  time: string;
  location: string;
  lat: number | null;
  lng: number | null;
}

function InlineBirthForm({
  data,
  onChange,
  label,
  onRemove,
  savedPersons = [],
}: {
  data: BirthData;
  onChange: (d: BirthData) => void;
  label: string;
  onRemove?: () => void;
  savedPersons?: SavedPerson[];
}) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationFocused, setLocationFocused] = useState(false);
  const [locSelectedIdx, setLocSelectedIdx] = useState(-1);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationAbortRef = useRef<AbortController | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<SavedPerson[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [nameSelectedIdx, setNameSelectedIdx] = useState(-1);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const nameDropdownRef = useRef<HTMLDivElement>(null);

  // Live location autocomplete — debounced search as you type (Mapbox)
  const searchLocation = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setResults([]); return; }
    locationAbortRef.current?.abort();
    const controller = new AbortController();
    locationAbortRef.current = controller;
    setSearching(true);
    setLocationError(null);
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&autocomplete=true&limit=5&types=place,locality,region,country`,
        { signal: controller.signal },
      );
      const json = await res.json();
      if (!controller.signal.aborted) {
        const mapped: GeoResult[] = (json.features || []).map((f: any) => ({
          display_name: f.place_name,
          lat: String(f.center[1]),
          lon: String(f.center[0]),
        }));
        setResults(mapped);
        setLocSelectedIdx(-1);
        if (mapped.length === 0) setLocationError('No locations found');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') setLocationError('Location search failed');
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }, []);

  const debouncedLocationSearch = useCallback((query: string) => {
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    locationDebounceRef.current = setTimeout(() => searchLocation(query), 300);
  }, [searchLocation]);

  const selectLocation = useCallback((r: GeoResult) => {
    onChange({ ...data, location: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
    setResults([]);
    setLocSelectedIdx(-1);
  }, [data, onChange]);

  const inputBase = "w-full bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none";

  return (
    <div className="rounded-xl border border-border/60 bg-gradient-to-b from-card to-card/80 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/30">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</h3>
        <div className="flex items-center gap-1">
          {(data.name || data.date) && (
            <button
              onClick={() => onChange(emptyBirth())}
              className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted"
            >
              Clear
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="text-muted-foreground/60 hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-3 space-y-0">
        {/* Name */}
        <div className="relative group">
          <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/30 transition-colors group-focus-within:border-foreground/20">
            <User className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Name (optional)"
              value={data.name}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ ...data, name: val });
                setNameSelectedIdx(-1);
                if (val.length > 0 && savedPersons.length > 0) {
                  const filtered = savedPersons.filter(p =>
                    p.name.toLowerCase().includes(val.toLowerCase())
                  );
                  setNameSuggestions(filtered);
                  setShowNameDropdown(filtered.length > 0);
                } else if (val.length === 0 && savedPersons.length > 0) {
                  setNameSuggestions(savedPersons);
                  setShowNameDropdown(true);
                } else {
                  setShowNameDropdown(false);
                }
              }}
              onKeyDown={(e) => {
                if (!showNameDropdown || nameSuggestions.length === 0) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setNameSelectedIdx(i => Math.min(i + 1, nameSuggestions.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setNameSelectedIdx(i => Math.max(i - 1, -1));
                } else if (e.key === 'Enter' && nameSelectedIdx >= 0) {
                  e.preventDefault();
                  const p = nameSuggestions[nameSelectedIdx];
                  onChange({ name: p.name, date: p.date, time: p.time, location: p.location, lat: p.lat, lng: p.lng });
                  setShowNameDropdown(false);
                  setNameSelectedIdx(-1);
                } else if (e.key === 'Escape') {
                  setShowNameDropdown(false);
                  setNameSelectedIdx(-1);
                }
              }}
              onFocus={() => {
                if (savedPersons.length > 0) {
                  const filtered = data.name
                    ? savedPersons.filter(p => p.name.toLowerCase().includes(data.name.toLowerCase()))
                    : savedPersons;
                  setNameSuggestions(filtered);
                  setShowNameDropdown(filtered.length > 0);
                  setNameSelectedIdx(-1);
                }
              }}
              onBlur={() => {
                setTimeout(() => { setShowNameDropdown(false); setNameSelectedIdx(-1); }, 250);
              }}
              className={inputBase}
              autoComplete="off"
            />
          </div>
          {showNameDropdown && nameSuggestions.length > 0 && (
            <div ref={nameDropdownRef} className="absolute z-[100] left-0 right-0 top-full mt-1 border border-border/60 rounded-lg bg-card shadow-xl max-h-52 overflow-y-auto">
              {nameSuggestions.map((p, i) => (
                <button
                  key={`${p.name}-${p.date}-${i}`}
                  ref={el => { if (i === nameSelectedIdx && el) el.scrollIntoView({ block: 'nearest' }); }}
                  onMouseDown={(e) => e.preventDefault()}
                  onTouchStart={(e) => e.preventDefault()}
                  onMouseEnter={() => setNameSelectedIdx(i)}
                  onClick={() => {
                    onChange({ name: p.name, date: p.date, time: p.time, location: p.location, lat: p.lat, lng: p.lng });
                    setShowNameDropdown(false);
                    setNameSelectedIdx(-1);
                  }}
                  className={`w-full text-left px-3 py-3 text-sm border-b border-border/20 last:border-0 transition-colors ${
                    i === nameSelectedIdx ? 'bg-accent' : 'hover:bg-muted/60 active:bg-muted/80'
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground/70 ml-2">
                    {p.date} &middot; {shortLocation(p.location)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date & Time — stacked on small screens, side by side on larger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-border/30">
          <div className="group flex items-center gap-3 px-3 py-2.5 border-b border-border/30 transition-colors group-focus-within:border-foreground/20">
            <Calendar className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            <DateInput
              value={data.date}
              onChange={(date) => onChange({ ...data, date })}
              className={`${inputBase} border-none ring-0 ring-offset-0 focus-within:ring-0 focus-within:ring-offset-0 h-auto px-0`}
            />
          </div>
          <div className="group flex items-center gap-3 px-3 py-2.5 border-b border-border/30 transition-colors group-focus-within:border-foreground/20">
            <Clock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            <TimeInput
              value={data.time}
              onChange={(time) => onChange({ ...data, time })}
              className={`${inputBase} border-none ring-0 ring-offset-0 focus-within:ring-0 focus-within:ring-offset-0 h-auto px-0`}
            />
          </div>
        </div>

        {/* Location */}
        <div className="relative group">
          <div className="flex items-center gap-3 px-3 py-2.5 transition-colors group-focus-within:border-foreground/20">
            <MapPin className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            <input
              type="text"
              placeholder="City, Country"
              value={data.location}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ ...data, location: val, lat: null, lng: null });
                setLocationError(null);
                debouncedLocationSearch(val);
              }}
              onKeyDown={(e) => {
                if (results.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setLocSelectedIdx(i => Math.min(i + 1, results.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setLocSelectedIdx(i => Math.max(i - 1, -1));
                  } else if (e.key === 'Enter' && locSelectedIdx >= 0) {
                    e.preventDefault();
                    selectLocation(results[locSelectedIdx]);
                  } else if (e.key === 'Escape') {
                    setResults([]);
                    setLocSelectedIdx(-1);
                  }
                } else if (e.key === 'Enter' && data.location.length >= 2) {
                  searchLocation(data.location);
                }
              }}
              onFocus={() => setLocationFocused(true)}
              onBlur={() => { setTimeout(() => { setLocationFocused(false); }, 200); }}
              className={`${inputBase} flex-1 min-w-0`}
              autoComplete="off"
            />
            {searching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60 shrink-0" />}
          </div>
          {locationFocused && results.length > 0 && (
            <div className="absolute z-[100] left-0 right-0 top-full mt-1 mx-1 border border-border/60 rounded-lg bg-card shadow-xl max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setLocSelectedIdx(i)}
                  onClick={() => selectLocation(r)}
                  className={`w-full text-left px-3 py-2.5 text-xs border-b border-border/20 last:border-0 transition-colors ${
                    i === locSelectedIdx ? 'bg-accent' : 'hover:bg-muted/60'
                  }`}
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        {locationError && !locationFocused && (
          <div className="px-4 pb-1 -mt-0.5">
            <span className="text-[11px] text-destructive">{locationError}</span>
          </div>
        )}
      </div>

      {/* Coordinates badge */}
      {data.lat !== null && (
        <div className="px-4 pb-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 text-[10px] text-muted-foreground/70 font-mono">
            {data.lat.toFixed(4)}, {data.lng?.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Compact Birth Summary ──────────────────────────────────────────

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortLocation(loc: string) {
  if (!loc) return '';
  // Take first two parts: "Downers Grove, DuPage County, IL, USA" → "Downers Grove, IL"
  const parts = loc.split(',').map(s => s.trim());
  if (parts.length <= 2) return loc;
  return `${parts[0]}, ${parts[parts.length - 2] || parts[1]}`;
}

function BirthSummary({ data, label }: { data: BirthData; label?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
      {label && <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">{label}</span>}
      <span className="font-medium">{data.name || 'Unnamed'}</span>
      <span className="text-muted-foreground">&middot;</span>
      <span className="text-muted-foreground">{formatDate(data.date)}</span>
      <span className="text-muted-foreground">&middot;</span>
      <span className="text-muted-foreground">{data.time}</span>
      {data.location && (
        <>
          <span className="text-muted-foreground">&middot;</span>
          <span className="text-muted-foreground truncate max-w-[200px]">{shortLocation(data.location)}</span>
        </>
      )}
    </div>
  );
}

// ─── Parse API Response ─────────────────────────────────────────────

function parseNatalResponse(data: any): NatalChart {
  const planets: Record<string, any> = {};
  if (data.planets && Array.isArray(data.planets)) {
    for (const p of data.planets) {
      let key = (p.name || p.planet || '').toLowerCase();
      if (key === 'north node' || key === 'true_node' || key === 'mean_node') key = 'northnode';
      if (key === 'south node') key = 'southnode';
      if (!key) continue;
      planets[key] = {
        longitude: p.longitude ?? p.abs_pos ?? 0,
        latitude: p.latitude ?? undefined,
        sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)] || '',
        degree: p.degree ?? undefined,
        minute: p.minute ?? undefined,
        retrograde: p.retrograde ?? false,
      };
    }
    // Derive South Node from North Node (always 180° opposite)
    if (planets.northnode && !planets.southnode) {
      const snLong = (planets.northnode.longitude + 180) % 360;
      planets.southnode = {
        longitude: snLong,
        sign: ZODIAC_SIGNS[Math.floor(snLong / 30)] || '',
        degree: Math.floor(snLong % 30),
        minute: Math.floor((snLong % 1) * 60),
        retrograde: planets.northnode.retrograde ?? true,
      };
    }
  }
  const houses: Record<string, number> = {};
  if (data.houses) {
    if (Array.isArray(data.houses)) {
      data.houses.forEach((cusp: number, i: number) => { houses[`house_${i + 1}`] = cusp; });
    } else if (data.houses.cusps) {
      data.houses.cusps.forEach((cusp: number, i: number) => { houses[`house_${i + 1}`] = cusp; });
    }
  }
  let angles: { ascendant: number; midheaven: number } | undefined;
  if (data.angles) {
    angles = { ascendant: data.angles.ascendant ?? data.angles.asc ?? 0, midheaven: data.angles.midheaven ?? data.angles.mc ?? 0 };
  } else if (data.houses?.ascendant !== undefined) {
    angles = { ascendant: data.houses.ascendant, midheaven: data.houses.mc ?? data.houses.midheaven ?? 0 };
  }
  return { planets, houses, angles };
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function ChartPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeState = location.state as { personA: PersonData; personB: PersonData | null; loadClient?: { name: string; date: string; time: string; location: string; lat: number | null; lng: number | null; autoCalculate?: boolean; withTransits?: boolean }; currentTransits?: boolean; loadChart?: any } | null;
  const { user, signOut } = useAuth();
  const { isPaid, relocatedRemaining, useRelocatedCredit } = useSubscription();
  const liveSession = useSession();
  const isMobile = useIsMobile();
  // Live chart state ref — updated by onStateChange so snapshots capture current state
  const liveChartStateRef = useRef<ChartStateSnapshot | null>(null);
  // BiWheel writes its current state here directly (no callbacks needed for snapshots)
  const biWheelStateRef = useRef<Record<string, any> | null>(null);

  // Always keep the snapshot getter set — needed for both fresh sessions and reconnects
  useEffect(() => {
    liveSession.setSnapshotGetter(() => (biWheelStateRef.current as ChartStateSnapshot) ?? liveChartStateRef.current ?? {} as ChartStateSnapshot);
  }, [liveSession.setSnapshotGetter]);

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Restore session state on mount
  const sessionRestore = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('astrologer_session');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, []);

  // ─── Chart Tabs ────────────────────────────────────────────
  const [tabs, setTabs] = useState<ChartTab[]>(() => {
    const restored = sessionRestore?.tabs;
    if (restored?.length) return restored;
    // Legacy: restore from old single-chart session format
    if (sessionRestore?.chartA) {
      return [{
        id: generateTabId(),
        personAData: sessionRestore.personAData ?? emptyBirth(),
        personBData: sessionRestore.personBData ?? null,
        chartA: sessionRestore.chartA,
        chartB: sessionRestore.chartB ?? null,
        editing: false,
      }];
    }
    return [{
      id: generateTabId(),
      personAData: emptyBirth(),
      personBData: null,
      chartA: null,
      chartB: null,
      editing: true,
    }];
  });
  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    return sessionRestore?.activeTabIndex ?? 0;
  });

  // Tab context menu state
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; tabIndex: number } | null>(null);

  // Tab drag-to-reorder state
  const [dragTabIndex, setDragTabIndex] = useState<number | null>(null);
  const [dragOverTabIndex, setDragOverTabIndex] = useState<number | null>(null);
  const tabDragLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabDragStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTabDragEnd = useCallback(() => {
    if (dragTabIndex !== null && dragOverTabIndex !== null && dragTabIndex !== dragOverTabIndex) {
      setTabs(prev => {
        const next = [...prev];
        const [moved] = next.splice(dragTabIndex, 1);
        next.splice(dragOverTabIndex, 0, moved);
        // Adjust active tab index to follow the active tab
        if (activeTabIndex === dragTabIndex) {
          setActiveTabIndex(dragOverTabIndex);
        } else if (dragTabIndex < activeTabIndex && dragOverTabIndex >= activeTabIndex) {
          setActiveTabIndex(activeTabIndex - 1);
        } else if (dragTabIndex > activeTabIndex && dragOverTabIndex <= activeTabIndex) {
          setActiveTabIndex(activeTabIndex + 1);
        }
        return next;
      });
    }
    setDragTabIndex(null);
    setDragOverTabIndex(null);
  }, [dragTabIndex, dragOverTabIndex, activeTabIndex]);

  // Live preview of reordered tabs while dragging
  const previewTabs = useMemo(() => {
    if (dragTabIndex === null || dragOverTabIndex === null || dragTabIndex === dragOverTabIndex) return tabs.map((t, i) => ({ tab: t, origIndex: i }));
    const items = tabs.map((t, i) => ({ tab: t, origIndex: i }));
    const [moved] = items.splice(dragTabIndex, 1);
    items.splice(dragOverTabIndex, 0, moved);
    return items;
  }, [tabs, dragTabIndex, dragOverTabIndex]);

  // Derived values from active chart tab
  const currentTab = tabs[Math.min(activeTabIndex, tabs.length - 1)];
  const personAData = currentTab.personAData;
  const personBData = currentTab.personBData;
  const chartA = currentTab.chartA;
  const chartB = currentTab.chartB;
  const editing = currentTab.editing;

  // Setter helpers — update active tab's field
  const updateActiveTab = useCallback((updates: Partial<ChartTab>) => {
    setTabs(prev => prev.map((t, i) => i === activeTabIndex ? { ...t, ...updates } : t));
  }, [activeTabIndex]);

  const setPersonAData = useCallback((d: BirthData | ((prev: BirthData) => BirthData)) => {
    setTabs(prev => prev.map((t, i) => i === activeTabIndex
      ? { ...t, personAData: typeof d === 'function' ? d(t.personAData) : d }
      : t
    ));
  }, [activeTabIndex]);

  const setPersonBData = useCallback((d: BirthData | null | ((prev: BirthData | null) => BirthData | null)) => {
    setTabs(prev => prev.map((t, i) => i === activeTabIndex
      ? { ...t, personBData: typeof d === 'function' ? d(t.personBData) : d }
      : t
    ));
  }, [activeTabIndex]);

  const setChartA = useCallback((c: NatalChart | null) => {
    setTabs(prev => prev.map((t, i) => i === activeTabIndex ? { ...t, chartA: c } : t));
  }, [activeTabIndex]);

  const setChartB = useCallback((c: NatalChart | null) => {
    setTabs(prev => prev.map((t, i) => i === activeTabIndex ? { ...t, chartB: c } : t));
  }, [activeTabIndex]);

  const setEditing = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    setTabs(prev => prev.map((t, i) => i === activeTabIndex
      ? { ...t, editing: typeof v === 'function' ? v(t.editing) : v }
      : t
    ));
  }, [activeTabIndex]);

  // Tab CRUD handlers
  const handleNewTab = useCallback(() => {
    if (tabs.length >= 10) return;
    const newTab: ChartTab = {
      id: generateTabId(),
      personAData: emptyBirth(),
      personBData: null,
      chartA: null,
      chartB: null,
      editing: true,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabIndex(tabs.length);
  }, [tabs.length]);

  const handleCloseTab = useCallback((index: number) => {
    if (tabs.length <= 1) return;
    setTabs(prev => prev.filter((_, i) => i !== index));
    setActiveTabIndex(prev => {
      if (prev >= index && prev > 0) return prev - 1;
      return prev;
    });
  }, [tabs.length]);

  const handleDuplicateTab = useCallback((sourceIndex?: number) => {
    if (tabs.length >= 10) return;
    const idx = sourceIndex ?? activeTabIndex;
    const source = tabs[idx];
    const dup: ChartTab = { ...source, id: generateTabId() };
    setTabs(prev => [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)]);
    setActiveTabIndex(idx + 1);
  }, [tabs, activeTabIndex]);

  const handleSwitchTab = useCallback((index: number) => {
    setActiveTabIndex(index);
  }, []);

  // Close context menu on click outside or Escape
  useEffect(() => {
    if (!tabContextMenu) return;
    const handleClick = () => setTabContextMenu(null);
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTabContextMenu(null); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, [tabContextMenu]);

  // Current Transits — create a tab with today's date/time and geolocation
  const handleCurrentTransits = useCallback(async () => {
    if (tabs.length >= 10) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newTab: ChartTab = {
      id: generateTabId(),
      personAData: { name: 'Current Transits', date: dateStr, time: timeStr, location: '', lat: null, lng: null },
      personBData: null,
      chartA: null,
      chartB: null,
      editing: true,
    };
    const newIdx = tabs.length;
    setTabs(prev => [...prev, newTab]);
    setActiveTabIndex(newIdx);

    // Try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let locationName = '';
          try {
            const base = import.meta.env.DEV ? '/nominatim' : 'https://nominatim.openstreetmap.org';
            const res = await fetch(`${base}/reverse?format=json&lat=${lat}&lon=${lng}`);
            const json = await res.json();
            locationName = json.display_name || '';
          } catch {}
          // Update the tab with geo data
          const birthData: BirthData = { name: 'Current Transits', date: dateStr, time: timeStr, location: locationName, lat, lng };
          setTabs(prev => prev.map((t, i) => i === newIdx ? { ...t, personAData: birthData, editing: false } : t));
          // Auto-calculate
          try {
            const data = await swissEphemeris.natal({ birth_date: dateStr, birth_time: timeStr, lat, lng });
            const parsed = parseNatalResponse(data);
            setTabs(prev => prev.map((t, i) => i === newIdx ? { ...t, chartA: parsed, editing: false } : t));
          } catch (err: any) {
            toast.error(err.message || 'Failed to calculate chart');
            setTabs(prev => prev.map((t, i) => i === newIdx ? { ...t, editing: true } : t));
          }
        },
        () => {
          // Geolocation denied — leave in editing mode
          toast('Enter a location to calculate the chart', { description: 'Geolocation unavailable' });
        },
        { timeout: 10000 }
      );
    }
  }, [tabs.length]);

  // Full person data for chart (combines birth data + chart)
  const personA: PersonData | null = chartA ? { ...personAData, natalChart: chartA } : null;
  const personB: PersonData | null = chartB && personBData ? { ...personBData, natalChart: chartB } : null;
  const hasChart = !!chartA;
  const hasSynastry = !!chartB && !!personBData;
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showTimeFinder, setShowTimeFinder] = useState(false);
  const [pageTheme, setPageTheme] = useState(() => {
    const t = localStorage.getItem('astrologer_theme') || 'classic';
    applyTheme(t as ThemeName); // Set global COLORS immediately so children don't flash
    return t;
  });
  // Keep global COLORS in sync when pageTheme changes (e.g. after DB load)
  useEffect(() => {
    applyTheme(pageTheme as ThemeName);
    const dark = isThemeDark(pageTheme);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [pageTheme]);

  // Shared chart options (parsed from URL params, applied as initial props)
  const sharedChartOptionsRef = useRef<{
    theme?: string;
    mode?: ChartMode;
    visiblePlanets?: Set<string>;
    visibleAspects?: Set<string>;
    showHouses?: boolean;
    showDegreeMarkers?: boolean;
    enabledAsteroidGroups?: Set<AsteroidGroup>;
  } | null>(null);

  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || sessionRestore?.activeTab || 'aspect-grid');
  const tabsListRef = useRef<HTMLDivElement>(null);
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'aspect-grid') next.delete('tab');
      else next.set('tab', tab);
      return next;
    }, { replace: true });
    // Save immediately so reload preserves the tab
    try {
      const raw = sessionStorage.getItem('astrologer_session');
      const session = raw ? JSON.parse(raw) : {};
      session.activeTab = tab;
      sessionStorage.setItem('astrologer_session', JSON.stringify(session));
    } catch {}
    analytics.trackToolTabViewed({ tab });
  }, [setSearchParams]);

  // Scroll active tab into view horizontally + update fade indicators
  const tabInitRef = useRef(true);
  useEffect(() => {
    const el = tabsListRef.current;
    if (!el) return;
    const active = el.querySelector('[data-state="active"]') as HTMLElement | null;
    if (active) {
      // Only scroll the tab strip horizontally — never scroll the page vertically
      const left = active.offsetLeft - el.offsetLeft;
      const center = left - el.clientWidth / 2 + active.clientWidth / 2;
      el.scrollTo({ left: center, behavior: tabInitRef.current ? 'instant' : 'smooth' });
      tabInitRef.current = false;
    }
    // Fade indicators removed — no dedicated fade elements exist as siblings
  }, [activeTab]);

  const [showGalactic, setShowGalactic] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'video'>('chart');
  const [showMobileChart, setShowMobileChart] = useState(false);

  // Bidirectional view mode sync — listen for remote changes
  useEffect(() => {
    liveSession.onRemoteViewMode((mode) => setViewMode(mode));
  }, [liveSession.onRemoteViewMode]);
  const handleGalacticToggle = useCallback(() => {
    setShowGalactic((v) => {
      analytics.trackGalacticModeToggled({ enabled: !v });
      return !v;
    });
  }, []);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [saveAfterGenerate, setSaveAfterGenerate] = useState(false);

  // Load saved charts from DB (for logged-in) or localStorage on mount
  const [savedChartsLoaded, setSavedChartsLoaded] = useState<SavedChart[]>([]);
  useEffect(() => {
    let cancelled = false;
    getSavedChartsAsync(user?.id || null).then((charts) => {
      if (!cancelled) setSavedChartsLoaded(charts);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Check if current birth data is already saved
  const isChartAlreadySaved = useMemo(() => {
    if (!personAData.lat) return false;
    return savedChartsLoaded.some((c) => {
      const matchA = c.person_a_date === personAData.date
        && c.person_a_time === personAData.time
        && c.person_a_lat === personAData.lat
        && c.person_a_lng === personAData.lng;
      if (!matchA) return false;
      if (personBData) {
        return c.person_b_date === personBData.date
          && c.person_b_time === personBData.time
          && c.person_b_lat === personBData.lat
          && c.person_b_lng === personBData.lng;
      }
      return !c.person_b_date;
    });
  }, [savedChartsLoaded, personAData.date, personAData.time, personAData.lat, personAData.lng,
      personBData?.date, personBData?.time, personBData?.lat, personBData?.lng]);
  const webglSupported = useWebGLSupport();

  // Shared visibility state — synced from 2D chart, passed one-way to galactic mode
  const [sharedVisiblePlanets, setSharedVisiblePlanets] = useState<Set<string>>(
    new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])
  );
  const [sharedVisibleAspects, setSharedVisibleAspects] = useState<Set<string>>(
    new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare'])
  );
  const [chartMode, setChartMode] = useState<ChartMode>(hasSynastry ? 'synastry' : 'personA');
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);

  // Load theme + tabs from user profile on login — DB is source of truth when logged in
  const profileTabsLoaded = useRef(false);
  useEffect(() => {
    if (!user) return;
    supabase.from('astrologer_profiles').select('theme, chart_tabs').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.theme && data.theme !== pageTheme) {
          setPageTheme(data.theme);
          localStorage.setItem('astrologer_theme', data.theme);
        }
        // Restore tabs from profile if available and no route/session override
        if (!profileTabsLoaded.current && data?.chart_tabs && Array.isArray(data.chart_tabs) && data.chart_tabs.length > 0 && !routeState?.personA) {
          setTabs(data.chart_tabs as ChartTab[]);
          // Preserve session-restored activeTabIndex on reload; only jump if no session
          if (!sessionRestore?.activeTabIndex) {
            const chartIdx = (data.chart_tabs as ChartTab[]).findIndex(t => t.chartA);
            if (chartIdx >= 0) setActiveTabIndex(chartIdx);
          }
          profileTabsLoaded.current = true;
        }
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save theme to both localStorage and profile (keeps them in sync)
  const handleThemeChange = useCallback((t: string) => {
    setPageTheme(t);
    localStorage.setItem('astrologer_theme', t);
    analytics.trackThemeChanged({ theme: t });
    if (user) {
      supabase.from('astrologer_profiles').update({ theme: t }).eq('id', user.id).then(() => {});
    }
  }, [user]);

  // Build unique saved persons from saved charts for name autocomplete
  const savedPersons = useMemo<SavedPerson[]>(() => {
    if (!user) return [];
    const charts = savedChartsLoaded;
    const seen = new Set<string>();
    const persons: SavedPerson[] = [];
    for (const c of charts) {
      const keyA = `${c.person_a_name}|${c.person_a_date}`;
      if (c.person_a_name && !seen.has(keyA)) {
        seen.add(keyA);
        persons.push({ name: c.person_a_name, date: c.person_a_date, time: c.person_a_time, location: c.person_a_location, lat: c.person_a_lat, lng: c.person_a_lng });
      }
      if (c.person_b_name && c.person_b_date) {
        const keyB = `${c.person_b_name}|${c.person_b_date}`;
        if (!seen.has(keyB)) {
          seen.add(keyB);
          persons.push({ name: c.person_b_name, date: c.person_b_date, time: c.person_b_time || '', location: c.person_b_location || '', lat: c.person_b_lat ?? null, lng: c.person_b_lng ?? null });
        }
      }
    }
    return persons;
  }, [user, savedChartsLoaded]);

  // Load from route state (saved charts, clients, transits, etc.)
  // Re-runs on each navigation to /chart (location.key changes per navigate() call)
  useEffect(() => {
    if ((location.state as any)?.activeTab) {
      const tab = (location.state as any).activeTab;
      setActiveTab(tab);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (tab === 'aspect-grid') next.delete('tab');
        else next.set('tab', tab);
        return next;
      }, { replace: true });
    }
    if (routeState?.currentTransits) {
      setTimeout(() => handleCurrentTransits(), 0);
      window.history.replaceState({}, '');
      return;
    }
    if (routeState?.loadChart) {
      handleLoadChart(routeState.loadChart);
      window.history.replaceState({}, '');
      return;
    }
    if (routeState?.loadClient) {
      const c = routeState.loadClient;
      const birthData = { name: c.name, date: c.date, time: c.time, location: c.location, lat: c.lat, lng: c.lng };
      setPersonAData(birthData);
      if (c.autoCalculate && c.lat != null && c.lng != null) {
        // Auto-calculate the natal chart
        setEditing(false);
        setLoading(true);
        (async () => {
          try {
            const dataA = await swissEphemeris.natal({ birth_date: c.date, birth_time: c.time || '12:00', lat: c.lat, lng: c.lng });
            const parsedA = parseNatalResponse(dataA);
            setChartA(parsedA);

            // If withTransits, also calculate current transits as Person B
            if (c.withTransits) {
              const now = new Date();
              const tDate = now.toISOString().slice(0, 10);
              const tTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              const dataB = await swissEphemeris.natal({ birth_date: tDate, birth_time: tTime, lat: c.lat, lng: c.lng });
              const parsedB = parseNatalResponse(dataB);
              setPersonBData({ name: 'Current Transits', date: tDate, time: tTime, location: c.location, lat: c.lat, lng: c.lng });
              setChartB(parsedB);
            }
          } catch (err: any) {
            toast.error(err.message || 'Failed to calculate chart');
            setEditing(true);
          } finally {
            setLoading(false);
          }
        })();
      } else {
        setEditing(true);
      }
      window.history.replaceState({}, '');
      return;
    }
    if (routeState?.personA) {
      const { natalChart: chartAData, ...birthA } = routeState.personA;
      setPersonAData(birthA);
      setChartA(chartAData);
      if (routeState.personB) {
        const { natalChart: chartBData, ...birthB } = routeState.personB;
        setPersonBData(birthB);
        setChartB(chartBData);
      }
      setEditing(false);
      // Clear route state so refresh doesn't re-trigger
      window.history.replaceState({}, '');
    }
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load from URL query params (shared chart links)
  useEffect(() => {
    const date = searchParams.get('date');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (!date || !lat || !lng) return;
    // Don't override if we already have a chart from route state
    if (routeState?.personA) return;

    const birthData: BirthData = {
      name: searchParams.get('name') || '',
      date,
      time: searchParams.get('time') || '12:00',
      location: searchParams.get('loc') || '',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };
    setPersonAData(birthData);
    setEditing(false);
    setLoading(true);

    // Parse shared chart options from URL
    const opts: typeof sharedChartOptionsRef.current = {};
    const urlTheme = searchParams.get('theme');
    if (urlTheme) {
      opts.theme = urlTheme;
      setPageTheme(urlTheme);
    }
    const urlMode = searchParams.get('mode') as ChartMode | null;
    if (urlMode) opts.mode = urlMode;
    const urlPlanets = searchParams.get('planets');
    if (urlPlanets) opts.visiblePlanets = new Set(urlPlanets.split(','));
    const urlAspects = searchParams.get('aspects');
    if (urlAspects) opts.visibleAspects = new Set(urlAspects.split(','));
    const urlHouses = searchParams.get('houses');
    if (urlHouses === '0') opts.showHouses = false;
    const urlDegrees = searchParams.get('degrees');
    if (urlDegrees === '0') opts.showDegreeMarkers = false;
    const urlAsteroids = searchParams.get('asteroids');
    if (urlAsteroids) {
      const groups = urlAsteroids.split(',').filter(g => g in ASTEROID_GROUPS) as AsteroidGroup[];
      if (groups.length > 0) opts.enabledAsteroidGroups = new Set(groups);
    }
    if (Object.keys(opts).length > 0) {
      sharedChartOptionsRef.current = opts;
    }

    // Clear query params from URL
    setSearchParams({}, { replace: true });

    // Auto-calculate chart
    swissEphemeris.natal({
      birth_date: birthData.date,
      birth_time: birthData.time,
      lat: birthData.lat!,
      lng: birthData.lng,
    }).then(data => {
      setChartA(parseNatalResponse(data));
    }).catch(err => {
      toast.error(err.message || 'Failed to calculate shared chart');
      setEditing(true);
    }).finally(() => {
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist tabs to sessionStorage (survive refresh) — debounced to avoid JSON serialization on every keystroke
  const sessionSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (sessionSaveRef.current) clearTimeout(sessionSaveRef.current);
    sessionSaveRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem('astrologer_session', JSON.stringify({
          tabs,
          activeTabIndex,
          activeTab,
        }));
      } catch {}
    }, 500);
    return () => { if (sessionSaveRef.current) clearTimeout(sessionSaveRef.current); };
  }, [tabs, activeTabIndex, activeTab]);

  // Persist tabs to user profile (debounced)
  const tabsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    if (tabsSaveTimerRef.current) clearTimeout(tabsSaveTimerRef.current);
    tabsSaveTimerRef.current = setTimeout(() => {
      supabase.from('astrologer_profiles')
        .update({ chart_tabs: tabs })
        .eq('id', user.id)
        .then(() => {});
    }, 2000);
    return () => { if (tabsSaveTimerRef.current) clearTimeout(tabsSaveTimerRef.current); };
  }, [tabs, user?.id]);

  // ─── Broadcast chart swap to guests during live session ─────
  const broadcastChartSwap = useCallback((cA: NatalChart, bA: BirthData, cB: NatalChart | null, bB: BirthData | null) => {
    if (!liveSession.isSessionActive) return;
    const hasSynB = !!cB;
    const swapPayload: Record<string, any> = {
      chartA: cA,
      chartB: hasSynB ? cB : undefined,
      nameA: bA.name || 'Person A',
      nameB: hasSynB && bB ? (bB.name || 'Person B') : undefined,
      birthDataA: bA.lat != null ? { name: bA.name, date: bA.date, time: bA.time, location: bA.location, lat: bA.lat, lng: bA.lng } : undefined,
      birthDataB: hasSynB && bB?.lat != null ? { name: bB!.name, date: bB!.date, time: bB!.time, location: bB!.location, lat: bB!.lat, lng: bB!.lng } : undefined,
      mode: hasSynB ? 'synastry' : 'personA',
    };
    liveSession.recordStateChange('chart_swap' as any, swapPayload);

    // Update the DB chart_snapshot so late-joining guests get the new chart
    if (liveSession.session?.id) {
      const updatedSnapshot: SessionChartSnapshot = {
        ...swapPayload,
        nameA: swapPayload.nameA,
        nameB: swapPayload.nameB,
        theme: pageTheme,
        initialState: (biWheelStateRef.current as ChartStateSnapshot) ?? liveChartStateRef.current ?? {} as ChartStateSnapshot,
      };
      supabase
        .from('astrologer_sessions')
        .update({ chart_snapshot: updatedSnapshot })
        .eq('id', liveSession.session.id)
        .then(() => {});
    }
  }, [liveSession.isSessionActive, liveSession.session?.id, liveSession.recordStateChange, pageTheme]);

  // ─── Calculate ──────────────────────────────────────────────

  const calculateChart = useCallback(async () => {
    if (!personAData.date || personAData.lat === null) {
      toast.error('Enter a birth date and search for a location');
      return;
    }
    setLoading(true);
    try {
      const dataA = await swissEphemeris.natal({
        birth_date: personAData.date,
        birth_time: personAData.time || '12:00',
        lat: personAData.lat,
        lng: personAData.lng,
      });
      const parsedA = parseNatalResponse(dataA);
      setChartA(parsedA);

      let parsedB: NatalChart | null = null;
      if (personBData && personBData.date && personBData.lat !== null) {
        const dataB = await swissEphemeris.natal({
          birth_date: personBData.date,
          birth_time: personBData.time || '12:00',
          lat: personBData.lat,
          lng: personBData.lng,
        });
        parsedB = parseNatalResponse(dataB);
        setChartB(parsedB);
      } else {
        setChartB(null);
      }
      setEditing(false);

      // Broadcast to guests if session is active
      broadcastChartSwap(parsedA, personAData, parsedB, parsedB ? personBData : null);

      // Track chart generation
      analytics.trackChartGenerated({
        chart_type: parsedB ? 'synastry' : 'natal',
        has_birth_time: !!(personAData.time && personAData.time !== '12:00'),
      });

      // Auto-save if checkbox was checked
      if (saveAfterGenerate) {
        const isSyn = !!parsedB && !!personBData;
        const defaultName = isSyn
          ? `${personAData.name || 'Person A'} & ${personBData!.name || 'Person B'}`
          : personAData.name || 'My Chart';
        const chart: SavedChart = {
          id: crypto.randomUUID(),
          name: defaultName,
          chart_type: isSyn ? 'synastry' : 'natal',
          person_a_name: personAData.name,
          person_a_date: personAData.date,
          person_a_time: personAData.time,
          person_a_location: personAData.location,
          person_a_lat: personAData.lat,
          person_a_lng: personAData.lng,
          person_a_chart: parsedA,
          person_b_name: isSyn ? personBData!.name : null,
          person_b_date: isSyn ? personBData!.date : null,
          person_b_time: isSyn ? personBData!.time : null,
          person_b_location: isSyn ? personBData!.location : null,
          person_b_lat: isSyn ? personBData!.lat : null,
          person_b_lng: isSyn ? personBData!.lng : null,
          person_b_chart: isSyn ? parsedB : null,
          created_at: new Date().toISOString(),
        };
        if (user) {
          await supabase.from('saved_charts').insert({
            user_id: user.id, name: chart.name, chart_type: chart.chart_type,
            person_a_name: chart.person_a_name, person_a_date: chart.person_a_date, person_a_time: chart.person_a_time,
            person_a_location: chart.person_a_location, person_a_lat: chart.person_a_lat, person_a_lng: chart.person_a_lng,
            person_a_chart: chart.person_a_chart,
            person_b_name: chart.person_b_name, person_b_date: chart.person_b_date, person_b_time: chart.person_b_time,
            person_b_location: chart.person_b_location, person_b_lat: chart.person_b_lat, person_b_lng: chart.person_b_lng,
            person_b_chart: chart.person_b_chart,
          });
          invalidateChartsCache();
          getSavedChartsAsync(user.id).then(setSavedChartsLoaded);
        } else {
          const existing = getSavedCharts();
          existing.unshift(chart);
          const max = isPaid ? 50 : 3;
          if (existing.length > max) existing.length = max;
          localStorage.setItem('astrologer_saved_charts', JSON.stringify(existing));
          setSavedChartsLoaded(existing);
        }
        toast.success('Chart saved');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to calculate chart');
    } finally {
      setLoading(false);
    }
  }, [personAData, personBData, saveAfterGenerate, isPaid]);

  // ─── Import / Load ──────────────────────────────────────────


  const handleLoadChart = useCallback((chart: any) => {
    analytics.trackChartLoaded({ chart_type: chart.person_b_chart ? 'synastry' : 'natal' });
    const bA: BirthData = { name: chart.person_a_name || '', date: chart.person_a_date, time: chart.person_a_time, location: chart.person_a_location || '', lat: chart.person_a_lat, lng: chart.person_a_lng };
    let bB: BirthData | null = null;
    if (chart.person_b_chart) {
      bB = { name: chart.person_b_name || '', date: chart.person_b_date, time: chart.person_b_time, location: chart.person_b_location || '', lat: chart.person_b_lat, lng: chart.person_b_lng };
    }

    // If current tab has a chart, load into a new tab so we don't lose it
    if (hasChart && tabs.length < 10) {
      const newTab: ChartTab = {
        id: generateTabId(),
        personAData: bA,
        personBData: bB,
        chartA: chart.person_a_chart,
        chartB: chart.person_b_chart || null,
        editing: false,
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabIndex(tabs.length);
    } else {
      // Load into current tab
      setPersonAData(bA);
      setChartA(chart.person_a_chart);
      if (bB) {
        setPersonBData(bB);
        setChartB(chart.person_b_chart);
      } else {
        setPersonBData(null);
        setChartB(null);
      }
      setEditing(false);
    }

    // Broadcast to guests if session is active
    broadcastChartSwap(chart.person_a_chart, bA, chart.person_b_chart || null, bB);
  }, [broadcastChartSwap, hasChart, tabs.length]);

  // ─── BiWheel fetch handlers ─────────────────────────────────

  const handleFetchTransits = useCallback(async (
    date: string, time: string, _chartA: any, _chartB: any, asteroids?: AsteroidsParam
  ): Promise<TransitData> => {
    const body: Record<string, unknown> = {
      birth_date: date, birth_time: time, lat: personAData.lat ?? 33.89, lng: personAData.lng ?? 35.50,
    };
    if (asteroids) body.asteroids = asteroids;
    const data = await swissEphemeris.natal(body);
    const transitPlanets: any[] = [];
    if (data.planets && Array.isArray(data.planets)) {
      for (const p of data.planets) {
        let key = (p.name || p.planet || '').toLowerCase();
        if (key === 'north node' || key === 'true_node' || key === 'mean_node') key = 'northnode';
        if (key === 'south node') key = 'southnode';
        if (!key) continue;
        transitPlanets.push({
          planet: key, longitude: p.longitude ?? p.abs_pos ?? 0, latitude: p.latitude ?? 0,
          sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)] || '',
          degree: Math.floor((p.longitude ?? 0) % 30), minute: Math.floor(((p.longitude ?? 0) % 1) * 60),
          retrograde: p.retrograde ?? false,
        });
      }
    }
    return { transit_date: date, transit_time: time, transit_planets: transitPlanets, aspects_to_natal: [] };
  }, [personAData.lat, personAData.lng]);

  const handleFetchSolarReturn = useCallback(async (year: number, chartA: any) => {
    const planets = Object.entries(chartA.planets || {}).map(([key, val]: [string, any]) => ({
      planet: key.charAt(0).toUpperCase() + key.slice(1),
      longitude: val.longitude ?? 0, latitude: val.latitude ?? 0,
      sign: val.sign ?? '', degree: val.degree ?? 0, minute: val.minute ?? 0,
      retrograde: val.retrograde ?? false,
    }));
    const result = await swissEphemeris.solarReturn({
      natal_chart: { planets }, year,
      lat: personAData.lat ?? 33.89, lng: personAData.lng ?? 35.50,
    });
    const returnPlanets = (result.planets || []).map((p: any) => {
      let key = (p.name || p.planet || '').toLowerCase();
      if (key === 'north node' || key === 'true_node' || key === 'mean_node') key = 'northnode';
      if (key === 'south node') key = 'southnode';
      return {
        planet: key, longitude: p.longitude ?? 0, latitude: p.latitude ?? 0,
        sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)] || '',
        degree: p.degree ?? Math.floor((p.longitude ?? 0) % 30),
        minute: p.minute ?? Math.floor(((p.longitude ?? 0) % 1) * 60),
        retrograde: p.retrograde ?? false,
      };
    });
    return {
      return_date: result.return_date, return_time: result.return_time,
      ascendantSign: result.ascendantSign || '',
      planets: returnPlanets, aspects: result.aspects || [],
    };
  }, [personAData.lat, personAData.lng]);

  const handleFetchLunarReturn = useCallback(async (startDate: string, chartA: any) => {
    const planets = Object.entries(chartA.planets || {}).map(([key, val]: [string, any]) => ({
      planet: key.charAt(0).toUpperCase() + key.slice(1),
      longitude: val.longitude ?? 0, latitude: val.latitude ?? 0,
      sign: val.sign ?? '', degree: val.degree ?? 0, minute: val.minute ?? 0,
      retrograde: val.retrograde ?? false,
    }));
    const result = await swissEphemeris.lunarReturn({
      natal_chart: { planets }, start_date: startDate,
      lat: personAData.lat ?? 33.89, lng: personAData.lng ?? 35.50,
    });
    const returnPlanets = (result.planets || []).map((p: any) => {
      let key = (p.name || p.planet || '').toLowerCase();
      if (key === 'north node' || key === 'true_node' || key === 'mean_node') key = 'northnode';
      if (key === 'south node') key = 'southnode';
      return {
        planet: key, longitude: p.longitude ?? 0, latitude: p.latitude ?? 0,
        sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)] || '',
        degree: p.degree ?? Math.floor((p.longitude ?? 0) % 30),
        minute: p.minute ?? Math.floor(((p.longitude ?? 0) % 1) * 60),
        retrograde: p.retrograde ?? false,
      };
    });
    return {
      return_date: result.return_date, return_time: result.return_time,
      ascendantSign: result.ascendantSign || '',
      planets: returnPlanets, aspects: result.aspects || [],
    };
  }, [personAData.lat, personAData.lng]);

  const handleFetchComposite = useCallback(async (
    cA: any, cB: any, asteroids?: AsteroidsParam
  ): Promise<CompositeData> => {
    let charts = { chartA: cA, chartB: cB };
    if (asteroids && Array.isArray(asteroids) && asteroids.length > 0 && personAData.lat && personBData?.lat) {
      try {
        const [dataA, dataB] = await Promise.all([
          swissEphemeris.natal({ birth_date: personAData.date, birth_time: personAData.time || '12:00', lat: personAData.lat, lng: personAData.lng, asteroids }),
          swissEphemeris.natal({ birth_date: personBData.date, birth_time: personBData.time || '12:00', lat: personBData.lat, lng: personBData.lng, asteroids }),
        ]);
        const merge = (response: any, base: any) => {
          const extra: Record<string, any> = {};
          for (const p of (response.planets || [])) {
            const k = (p.name || p.planet || '').toLowerCase();
            if (k && !base.planets[k]) extra[k] = { longitude: p.longitude ?? p.abs_pos ?? 0, sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)], retrograde: p.retrograde ?? false };
          }
          return { ...base, planets: { ...base.planets, ...extra } };
        };
        charts.chartA = merge(dataA, cA);
        charts.chartB = merge(dataB, cB);
      } catch (err) { console.error('Asteroid fetch for composite failed:', err); }
    }
    const compositePlanets: any[] = [];
    const keys = new Set([...Object.keys(charts.chartA.planets || {}), ...Object.keys(charts.chartB.planets || {})]);
    for (const key of keys) {
      const pA = charts.chartA.planets[key]; const pB = charts.chartB.planets?.[key];
      if (pA && pB) {
        let mid = (pA.longitude + pB.longitude) / 2;
        if (Math.abs(pA.longitude - pB.longitude) > 180) mid = (mid + 180) % 360;
        compositePlanets.push({ planet: key, longitude: mid, latitude: 0, sign: ZODIAC_SIGNS[Math.floor(mid / 30)], degree: Math.floor(mid % 30), minute: Math.floor((mid % 1) * 60), retrograde: false });
      }
    }
    let compositeHouses = { cusps: [] as number[], ascendant: 0, mc: 0 }; let ascSign = 'Aries';
    if (cA.angles && cB.angles) {
      let midAsc = (cA.angles.ascendant + cB.angles.ascendant) / 2;
      if (Math.abs(cA.angles.ascendant - cB.angles.ascendant) > 180) midAsc = (midAsc + 180) % 360;
      let midMc = (cA.angles.midheaven + cB.angles.midheaven) / 2;
      if (Math.abs(cA.angles.midheaven - cB.angles.midheaven) > 180) midMc = (midMc + 180) % 360;
      compositeHouses = { cusps: [], ascendant: midAsc, mc: midMc };
      ascSign = ZODIAC_SIGNS[Math.floor(midAsc / 30)];
    }
    return { planets: compositePlanets, houses: compositeHouses, aspects: [], ascendantSign: ascSign };
  }, [personAData, personBData]);

  const handleFetchProgressed = useCallback(async (
    person: 'A' | 'B', progressedTo: string, asteroids?: AsteroidsParam
  ): Promise<ProgressedData> => {
    const src = person === 'A' ? personAData : personBData;
    if (!src?.lat) throw new Error(`Person ${person} birth info not available`);
    const body: Record<string, unknown> = { birth_date: src.date, birth_time: src.time || '12:00', lat: src.lat, lng: src.lng, progressed_to: progressedTo };
    if (asteroids) body.asteroids = asteroids;
    const data = await swissEphemeris.progressed(body);
    return { natal_date: data.natal_date || '', progressed_to: data.progressed_to || progressedTo, progressed_chart_date: data.progressed_chart_date || '', years_progressed: data.years_progressed || 0, progressed_planets: data.progressed_planets || [], houses: data.houses, aspects_to_natal: data.aspects_to_natal || [], ascendantSign: data.ascendantSign || '' };
  }, [personAData, personBData]);

  const handleFetchRelocated = useCallback(async (
    person: 'A' | 'B', newLat: number, newLng: number, asteroids?: AsteroidsParam
  ): Promise<RelocatedData> => {
    // Credit gating: free users get 3/month, paid users get unlimited
    if (relocatedRemaining === 0) {
      throw new Error('You\'ve used all 3 free relocated charts this month. Upgrade to Pro for unlimited.');
    }
    const creditOk = await useRelocatedCredit();
    if (!creditOk) {
      throw new Error('Unable to use relocated credit. Please sign in.');
    }
    const src = person === 'A' ? personAData : personBData;
    if (!src?.lat) throw new Error(`Person ${person} birth info not available`);
    // A relocated chart is a natal chart recalculated at the new location
    // (same birth date/time, different lat/lng → same planets, different houses)
    const body: Record<string, unknown> = { birth_date: src.date, birth_time: src.time || '12:00', lat: newLat, lng: newLng };
    if (asteroids) body.asteroids = asteroids;
    const data = await swissEphemeris.natal(body);
    return { original_location: { lat: src.lat, lng: src.lng!, name: src.location || 'Birth Location' }, relocated_location: { lat: newLat, lng: newLng, name: 'Relocated Location' }, relocated_planets: data.planets || [], houses: data.houses || { cusps: [], ascendant: 0, mc: 0 }, ascendantSign: data.ascendantSign || '' };
  }, [personAData, personBData, relocatedRemaining, useRelocatedCredit]);

  const handleFetchShiftedNatal = useCallback(async (
    person: 'A' | 'B', shiftedDate: string, shiftedTime: string, asteroids?: AsteroidsParam
  ): Promise<NatalChart> => {
    const src = person === 'A' ? personAData : personBData;
    if (!src?.lat) throw new Error(`Person ${person} birth info not available`);
    const body: Record<string, unknown> = {
      birth_date: shiftedDate, birth_time: shiftedTime, lat: src.lat, lng: src.lng,
    };
    if (asteroids) body.asteroids = asteroids;
    const data = await swissEphemeris.natal(body);
    return parseNatalResponse(data);
  }, [personAData, personBData]);

  const handleRefetchWithHouseSystem = useCallback(async (system: string) => {
    if (!personAData.date || personAData.lat === null) return;
    try {
      const dataA = await swissEphemeris.natal({
        birth_date: personAData.date,
        birth_time: personAData.time || '12:00',
        lat: personAData.lat,
        lng: personAData.lng,
        house_system: system,
      });
      setChartA(parseNatalResponse(dataA));
      if (personBData && personBData.date && personBData.lat !== null) {
        const dataB = await swissEphemeris.natal({
          birth_date: personBData.date,
          birth_time: personBData.time || '12:00',
          lat: personBData.lat,
          lng: personBData.lng,
          house_system: system,
        });
        setChartB(parseNatalResponse(dataB));
      }
    } catch (e) {
      console.error('Failed to refetch with house system:', e);
    }
  }, [personAData, personBData]);

  const handleFetchAsteroidData = useCallback(async (asteroids: string[]): Promise<{ chartA: Record<string, any>; chartB: Record<string, any> }> => {
    const resA: Record<string, any> = {}; const resB: Record<string, any> = {};
    const parse = (data: any): Record<string, any> => {
      const r: Record<string, any> = {};
      for (const p of (data.planets || [])) {
        const k = (p.name || p.planet || '').toLowerCase();
        if (k) r[k] = { longitude: p.longitude ?? p.abs_pos ?? 0, sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)], retrograde: p.retrograde ?? false };
      }
      return r;
    };
    try {
      if (personAData.lat) { const d = await swissEphemeris.natal({ birth_date: personAData.date, birth_time: personAData.time || '12:00', lat: personAData.lat, lng: personAData.lng, asteroids }); Object.assign(resA, parse(d)); }
      if (personBData?.lat) { const d = await swissEphemeris.natal({ birth_date: personBData.date, birth_time: personBData.time || '12:00', lat: personBData.lat, lng: personBData.lng, asteroids }); Object.assign(resB, parse(d)); }
      else { Object.assign(resB, resA); }
    } catch (err) { console.error('Asteroid fetch failed:', err); }
    return { chartA: resA, chartB: resB };
  }, [personAData, personBData]);

  const handleFetchFixedStarData = useCallback(async (): Promise<{ chartA: Record<string, any>; chartB: Record<string, any> }> => {
    const resA: Record<string, any> = {}; const resB: Record<string, any> = {};
    const parseStars = (data: any): Record<string, any> => {
      const r: Record<string, any> = {};
      for (const s of (data.fixed_stars || [])) {
        // Normalize star name to lowercase key, replace spaces with underscores
        const k = (s.name || s.planet || '').toLowerCase().replace(/\s+/g, '_');
        if (k) r[k] = { longitude: s.longitude ?? 0, sign: s.sign || ZODIAC_SIGNS[Math.floor((s.longitude ?? 0) / 30)] || '', degree: s.degree, minute: s.minute, retrograde: false };
      }
      return r;
    };
    try {
      if (personAData.lat) { const d = await swissEphemeris.natal({ birth_date: personAData.date, birth_time: personAData.time || '12:00', lat: personAData.lat, lng: personAData.lng, fixed_stars: true }); Object.assign(resA, parseStars(d)); }
      if (personBData?.lat) { const d = await swissEphemeris.natal({ birth_date: personBData.date, birth_time: personBData.time || '12:00', lat: personBData.lat, lng: personBData.lng, fixed_stars: true }); Object.assign(resB, parseStars(d)); }
      else { Object.assign(resB, resA); }
    } catch (err) { console.error('Fixed star fetch failed:', err); }
    return { chartA: resA, chartB: resB };
  }, [personAData, personBData]);

  const originalLocationA = personAData.lat ? { lat: personAData.lat, lng: personAData.lng!, name: personAData.location || 'Birth Location' } : undefined;
  const originalLocationB = personBData?.lat ? { lat: personBData.lat, lng: personBData.lng!, name: personBData.location || 'Birth Location' } : undefined;
  const initialMode = hasSynastry ? 'synastry' : 'personA';
  const canCalculate = !!personAData.date && personAData.lat !== null;

  // ─── Keyboard Shortcuts ─────────────────────────────────────

  const handlePrevTab = useCallback(() => {
    const idx = TAB_VALUES.indexOf(activeTab as typeof TAB_VALUES[number]);
    const prev = idx <= 0 ? TAB_VALUES.length - 1 : idx - 1;
    handleTabChange(TAB_VALUES[prev]);
  }, [activeTab, handleTabChange]);

  const handleNextTab = useCallback(() => {
    const idx = TAB_VALUES.indexOf(activeTab as typeof TAB_VALUES[number]);
    const next = idx >= TAB_VALUES.length - 1 ? 0 : idx + 1;
    handleTabChange(TAB_VALUES[next]);
  }, [activeTab, handleTabChange]);

  const handleShortcutEscape = useCallback(() => {
    if (showSpotlight) { setShowSpotlight(false); return; }
    if (showShortcutsHelp) { setShowShortcutsHelp(false); return; }
    if (showAuth) { setShowAuth(false); return; }
    if (showUpgrade) { setShowUpgrade(false); return; }
    if (editing && hasChart) { setEditing(false); return; }
  }, [showSpotlight, showShortcutsHelp, showAuth, showUpgrade, editing, hasChart]);

  const handleShortcutSave = useCallback(() => {
    const btn = document.querySelector<HTMLButtonElement>('[data-shortcut="save"]');
    if (btn && !btn.disabled) btn.click();
  }, []);

  useKeyboardShortcuts({
    hasChart,
    isEditing: editing,
    activeTab,
    onTabChange: handleTabChange,
    onPrevTab: handlePrevTab,
    onNextTab: handleNextTab,
    onCalculate: calculateChart,
    onSave: handleShortcutSave,
    onToggleEdit: useCallback(() => setEditing(v => !v), [setEditing]),
    onToggleGalactic: handleGalacticToggle,
    onEscape: handleShortcutEscape,
    onShowHelp: useCallback(() => setShowShortcutsHelp(true), []),
    onSpotlight: useCallback(() => setShowSpotlight(true), []),
    // Chart tab shortcuts
    onNewChartTab: handleNewTab,
    onCloseChartTab: useCallback(() => handleCloseTab(activeTabIndex), [handleCloseTab, activeTabIndex]),
    onDuplicateChartTab: handleDuplicateTab,
    onPrevChartTab: useCallback(() => setActiveTabIndex(prev => Math.max(0, prev - 1)), []),
    onNextChartTab: useCallback(() => setActiveTabIndex(prev => Math.min(tabs.length - 1, prev + 1)), [tabs.length]),
  });

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className={`min-h-screen ${isThemeDark(pageTheme) ? 'dark' : ''}`} style={themeVars}>

      {/* ── Header Bar ──────────────────────────────────────── */}
      <div className="border-b bg-background">
        <div className="container flex items-center gap-2 md:gap-3 py-2 px-2 md:px-6">
          <Link to="/dashboard" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Back to Dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link to="/dashboard" className="text-sm md:text-base font-extralight tracking-[0.12em] uppercase shrink-0" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Astrologer</Link>
          <button
            onClick={() => setShowSpotlight(true)}
            className="hidden md:flex items-center gap-2 h-7 px-2.5 rounded-md border border-border/50 bg-muted/30 text-muted-foreground/60 hover:text-foreground hover:bg-muted hover:border-border transition-colors text-xs"
            title="Quick switch chart (⌘K)"
          >
            <Search className="w-3 h-3" />
            <span className="font-normal">Search charts...</span>
            <kbd className="ml-1 inline-flex h-[18px] items-center rounded border border-border/60 px-1 text-[10px] font-mono text-muted-foreground/50">⌘K</kbd>
          </button>
          <button
            onClick={() => setShowSpotlight(true)}
            className="md:hidden flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
            title="Quick switch chart (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowShortcutsHelp(true)}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1" />

          {user ? (
            <div className="flex items-center gap-2">
              {!isPaid && (
                <button
                  onClick={() => { analytics.trackUpgradeClicked(); setShowUpgrade(true); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pro</span>
                </button>
              )}

              <ProfileDropdown />
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowAuth(true)} className="gap-1.5 text-xs">
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* ── Chart Tabs Bar ─────────────────────────────────── */}
      {(tabs.length > 1 || hasChart) && (
        <div className="bg-muted/20">
          <div className="container px-2 md:px-6">
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide pt-1" style={{ marginBottom: -1 }}>
              {previewTabs.map(({ tab, origIndex }) => {
                const isDragging = dragTabIndex === origIndex;
                const isActive = origIndex === activeTabIndex;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { if (dragTabIndex === null) handleSwitchTab(origIndex); }}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-background text-foreground border border-b-background border-border/50'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    style={{
                      transition: dragTabIndex !== null ? 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease, box-shadow 0.2s ease' : 'color 0.15s',
                      transform: isDragging ? 'scale(1.08)' : 'scale(1)',
                      opacity: isDragging ? 0.5 : 1,
                      zIndex: isDragging ? 10 : isActive ? 1 : 0,
                      position: 'relative',
                      boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                      marginBottom: isActive ? 0 : undefined,
                    }}
                    onContextMenu={(e) => { e.preventDefault(); setTabContextMenu({ x: e.clientX, y: e.clientY, tabIndex: origIndex }); }}
                    draggable
                    onDragStart={() => setDragTabIndex(origIndex)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverTabIndex(origIndex); }}
                    onDragEnter={() => setDragOverTabIndex(origIndex)}
                    onDragEnd={handleTabDragEnd}
                    onTouchStart={(e) => {
                      tabDragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                      tabDragLongPressTimer.current = setTimeout(() => {
                        setDragTabIndex(origIndex);
                      }, 400);
                    }}
                    onTouchMove={(e) => {
                      if (tabDragLongPressTimer.current && tabDragStartPos.current) {
                        const dx = Math.abs(e.touches[0].clientX - tabDragStartPos.current.x);
                        const dy = Math.abs(e.touches[0].clientY - tabDragStartPos.current.y);
                        if (dx > 8 || dy > 8) { clearTimeout(tabDragLongPressTimer.current); tabDragLongPressTimer.current = null; }
                      }
                      if (dragTabIndex !== null) {
                        const touch = e.touches[0];
                        const el = document.elementFromPoint(touch.clientX, touch.clientY);
                        const tabEl = el?.closest('[data-tab-index]');
                        if (tabEl) setDragOverTabIndex(Number(tabEl.getAttribute('data-tab-index')));
                      }
                    }}
                    onTouchEnd={() => {
                      if (tabDragLongPressTimer.current) { clearTimeout(tabDragLongPressTimer.current); tabDragLongPressTimer.current = null; }
                      if (dragTabIndex !== null) handleTabDragEnd();
                    }}
                    data-tab-index={origIndex}
                  >
                    <span className="max-w-[120px] truncate">{getTabLabel(tab)}</span>
                    {/* Close button: desktop = hover-visible on all tabs; mobile = only on active tab */}
                    {tabs.length > 1 && (isActive || !isMobile) && (
                      <span
                        onClick={(e) => { e.stopPropagation(); handleCloseTab(origIndex); }}
                        className={`w-4 h-4 flex items-center justify-center rounded-sm transition-opacity cursor-pointer ${
                          isActive
                            ? 'opacity-40 hover:opacity-100 hover:bg-muted'
                            : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-muted'
                        }`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
              {tabs.length < 10 && (
                <>
                  <button
                    onClick={handleNewTab}
                    className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
                    title="New chart tab (Alt+T)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCurrentTransits}
                    className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
                    title="Current transits (now)"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="border-b border-border/50" />

          {/* Tab context menu */}
          {tabContextMenu && (
            <div
              className="fixed z-[100] bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[140px]"
              style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { handleDuplicateTab(tabContextMenu.tabIndex); setTabContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                disabled={tabs.length >= 10}
              >
                Duplicate Tab
              </button>
              <button
                onClick={() => { handleCloseTab(tabContextMenu.tabIndex); setTabContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={tabs.length <= 1}
              >
                Close Tab
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Birth Data Panel ────────────────────────────────── */}
      {editing && (
        <div className="border-b border-border/50 bg-gradient-to-b from-background to-muted/20">
          <div className="container px-3 md:px-6">
            <div className="py-5 space-y-4 max-w-2xl mx-auto">
              <InlineBirthForm data={personAData} onChange={setPersonAData} label="Person A" savedPersons={savedPersons} />

              {personBData ? (
                <InlineBirthForm data={personBData} onChange={setPersonBData} label="Person B" onRemove={() => { setPersonBData(null); setChartB(null); }} savedPersons={savedPersons} />
              ) : (
                <button
                  onClick={() => setPersonBData(emptyBirth())}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border/50 rounded-xl text-xs text-muted-foreground/60 hover:text-foreground hover:border-foreground/30 hover:bg-muted/30 transition-all duration-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add second person for synastry
                </button>
              )}

              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <Button
                  onClick={calculateChart}
                  disabled={loading || !canCalculate}
                  size="sm"
                  className="gap-2 px-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Calculate Chart</>
                  )}
                </Button>
                <label className={`flex items-center gap-1.5 select-none ${isChartAlreadySaved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={isChartAlreadySaved || saveAfterGenerate}
                    disabled={isChartAlreadySaved}
                    onChange={(e) => setSaveAfterGenerate(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-xs text-muted-foreground">{isChartAlreadySaved ? 'Already Saved' : 'Save to My Charts'}</span>
                </label>
                {personAData.name && personAData.date && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      addClient({
                        name: personAData.name,
                        birthDate: personAData.date,
                        birthTime: personAData.time || '12:00',
                        birthLocation: personAData.location,
                        lat: personAData.lat,
                        lng: personAData.lng,
                        notes: '',
                      });
                      toast.success(`${personAData.name} saved to clients`);
                    }}
                  >
                    <Users className="w-3 h-3" />
                    Save as Client
                  </Button>
                )}
                {!hasChart && (
                  <Button variant="ghost" size="sm" onClick={() => setShowTimeFinder(true)} className="text-muted-foreground gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    Time Finder
                  </Button>
                )}
                {hasChart && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-muted-foreground">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Chart Content ───────────────────────────────────── */}
      {hasChart && personA ? (
        liveSession.isSessionActive && viewMode === 'video' ? (
        /* Video gallery mode: top-down on mobile, side-by-side on desktop */
        <div className="relative flex flex-col md:flex-row h-[calc(100vh-64px)]" style={{ marginTop: 0 }}>
          {/* Video gallery — full on mobile, 70% on desktop */}
          <div className="w-full md:w-[70%] h-full min-w-0">
            <VideoGallery
              participants={[
                ...liveSession.remoteParticipants.map((p) => ({
                  id: p.id,
                  name: p.name,
                  stream: p.videoStream,
                })),
                {
                  id: 'local',
                  name: 'You',
                  stream: liveSession.localVideoStream,
                  muted: true,
                  mirrored: true,
                },
              ]}
              activeSpeakerId={liveSession.activeSpeakerId}
            />
          </div>

          {/* Desktop: chart sidebar (always visible) */}
          <div className="hidden md:block w-[30%] h-full overflow-y-auto border-l border-border/30 bg-background">
            <div className="py-4 space-y-4 px-3">
              <div>
                <div className="mb-2">
                  <h1 className="text-sm font-semibold tracking-tight truncate">
                    {personAData.name || 'Unnamed'}
                    {personBData && hasSynastry && (
                      <span className="text-muted-foreground font-normal"> & {personBData.name || 'Unnamed'}</span>
                    )}
                  </h1>
                </div>
                <div className="relative">
                  <BiWheelMobileWrapper
                    key={currentTab.id}
                    chartA={personA.natalChart}
                    chartB={hasSynastry ? personB!.natalChart : personA.natalChart}
                    nameA={personA.name || 'Person A'}
                    nameB={hasSynastry ? (personB!.name || 'Person B') : (personA.name || 'Person A')}
                    initialChartMode={sharedChartOptionsRef.current?.mode || initialMode as any}
                    enableTransits={true}
                    enableComposite={hasSynastry}
                    enableProgressed={true}
                    enableRelocated={true}
                    enableBirthTimeShift={true}
                    onFetchTransits={handleFetchTransits}
                    onFetchSolarReturn={handleFetchSolarReturn}
                    onFetchLunarReturn={handleFetchLunarReturn}
                    onFetchComposite={hasSynastry ? handleFetchComposite : undefined}
                    onFetchProgressed={handleFetchProgressed}
                    onFetchRelocated={handleFetchRelocated}
                    onFetchShiftedNatal={handleFetchShiftedNatal}
                    onFetchAsteroidData={handleFetchAsteroidData}
                    onFetchFixedStarData={handleFetchFixedStarData}
                    onRefetchWithHouseSystem={handleRefetchWithHouseSystem}
                    initialTheme={pageTheme}
                    onThemeChange={handleThemeChange}
                    originalLocation={originalLocationA}
                    locationB={originalLocationB}
                    birthDateA={personA.date}
                    birthTimeA={personA.time}
                    birthDateB={hasSynastry ? personB!.date : undefined}
                    birthTimeB={hasSynastry ? personB!.time : undefined}
                    initialTimeShiftA={currentTab.timeShiftA ?? 0}
                    initialTimeShiftB={currentTab.timeShiftB ?? 0}
                    onTimeShiftAChange={(offset) => updateActiveTab({ timeShiftA: offset })}
                    onTimeShiftBChange={(offset) => updateActiveTab({ timeShiftB: offset })}
                    onVisiblePlanetsChange={setSharedVisiblePlanets}
                    onVisibleAspectsChange={setSharedVisibleAspects}
                    onChartModeChange={setChartMode}
                    chartNotesKey={`${personAData.date}-${personAData.time}-${personAData.lat}`}
                    onStateChange={liveSession.recordStateChange}
                    {...(sharedChartOptionsRef.current?.visiblePlanets && { initialVisiblePlanets: sharedChartOptionsRef.current.visiblePlanets })}
                    {...(sharedChartOptionsRef.current?.visibleAspects && { initialVisibleAspects: sharedChartOptionsRef.current.visibleAspects as Set<any> })}
                    {...(sharedChartOptionsRef.current?.showHouses !== undefined && { initialShowHouses: sharedChartOptionsRef.current.showHouses })}
                    {...(sharedChartOptionsRef.current?.showDegreeMarkers !== undefined && { initialShowDegreeMarkers: sharedChartOptionsRef.current.showDegreeMarkers })}
                    {...(sharedChartOptionsRef.current?.enabledAsteroidGroups && { initialEnabledAsteroidGroups: sharedChartOptionsRef.current.enabledAsteroidGroups })}
                    onCursorMove={liveSession.recordCursor}
                    stateRef={biWheelStateRef}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: floating chart toggle button */}
          <button
            onClick={() => setShowMobileChart(!showMobileChart)}
            className="md:hidden fixed bottom-24 right-3 z-[60] w-11 h-11 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
            title={showMobileChart ? 'Hide chart' : 'Show chart'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Mobile: chart overlay panel */}
          {showMobileChart && (
            <div className="md:hidden fixed inset-x-0 bottom-0 z-[55] bg-background border-t border-border rounded-t-2xl shadow-2xl" style={{ height: '55vh' }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <h2 className="text-xs font-semibold">
                  {personAData.name || 'Chart'}
                  {personBData && hasSynastry && (
                    <span className="text-muted-foreground font-normal"> & {personBData.name}</span>
                  )}
                </h2>
                <button onClick={() => setShowMobileChart(false)} className="p-1 text-muted-foreground">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
              <div className="overflow-y-auto px-3 pb-24" style={{ height: 'calc(55vh - 40px)' }}>
                <BiWheelMobileWrapper
                  key={`mobile-${currentTab.id}`}
                  chartA={personA.natalChart}
                  chartB={hasSynastry ? personB!.natalChart : personA.natalChart}
                  nameA={personA.name || 'Person A'}
                  nameB={hasSynastry ? (personB!.name || 'Person B') : (personA.name || 'Person A')}
                  initialChartMode={sharedChartOptionsRef.current?.mode || initialMode as any}
                  enableTransits={true}
                  enableComposite={hasSynastry}
                  enableProgressed={true}
                  enableRelocated={true}
                  enableBirthTimeShift={true}
                  onFetchTransits={handleFetchTransits}
                  onFetchComposite={hasSynastry ? handleFetchComposite : undefined}
                  onFetchProgressed={handleFetchProgressed}
                  onFetchRelocated={handleFetchRelocated}
                  onFetchShiftedNatal={handleFetchShiftedNatal}
                  onFetchAsteroidData={handleFetchAsteroidData}
                    onFetchFixedStarData={handleFetchFixedStarData}
                    onRefetchWithHouseSystem={handleRefetchWithHouseSystem}
                  initialTheme={pageTheme}
                  originalLocation={originalLocationA}
                  locationB={originalLocationB}
                  birthDateA={personA.date}
                  birthTimeA={personA.time}
                  birthDateB={hasSynastry ? personB!.date : undefined}
                  birthTimeB={hasSynastry ? personB!.time : undefined}
                  readOnly
                  onStateChange={liveSession.recordStateChange}
                  onCursorMove={liveSession.recordCursor}
                />
              </div>
            </div>
          )}
        </div>
        ) : (
        <div className="container py-4 md:py-6 space-y-4 md:space-y-6 px-2 md:px-6">
          <div>
            {/* Name header + birth info */}
            {!editing && (
              <div className="mb-2">
                {/* Names — prominent, full width */}
                <div className="flex items-baseline gap-2 mb-1">
                  <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                    {personAData.name || 'Unnamed'}
                    {personBData && hasSynastry && (
                      <span className="text-muted-foreground font-normal"> & {personBData.name || 'Unnamed'}</span>
                    )}
                  </h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors p-1.5 -m-1 rounded-md hover:bg-muted/50"
                    title="Edit birth data (E)"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Birth details */}
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-x-1.5 whitespace-nowrap overflow-hidden">
                    <span>{formatDate(personAData.date)}</span>
                    <span className="opacity-40">&middot;</span>
                    <span>{personAData.time}</span>
                    {personAData.location && (
                      <>
                        <span className="opacity-40">&middot;</span>
                        <span className="truncate max-w-[140px]">{shortLocation(personAData.location)}</span>
                      </>
                    )}
                    {/* Single-line for desktop synastry */}
                    {personBData && hasSynastry && (
                      <span className="hidden sm:contents">
                        <span className="opacity-30 mx-1">|</span>
                        <span>{formatDate(personBData.date)}</span>
                        <span className="opacity-40">&middot;</span>
                        <span>{personBData.time}</span>
                        {personBData.location && (
                          <>
                            <span className="opacity-40">&middot;</span>
                            <span className="truncate max-w-[140px]">{shortLocation(personBData.location)}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  {/* Stacked second line on mobile for synastry */}
                  {personBData && hasSynastry && (
                    <div className="flex items-center gap-x-1.5 whitespace-nowrap overflow-hidden mt-0.5 sm:hidden">
                      <span>{formatDate(personBData.date)}</span>
                      <span className="opacity-40">&middot;</span>
                      <span>{personBData.time}</span>
                      {personBData.location && (
                        <>
                          <span className="opacity-40">&middot;</span>
                          <span className="truncate max-w-[140px]">{shortLocation(personBData.location)}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* Actions row */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <SaveChartButton personA={personA} personB={personB} hasSynastry={!!personBData && hasSynastry} />
                    <StartSessionButton
                      isActive={liveSession.isSessionActive}
                      awaitingTranscriptionChoice={liveSession.awaitingTranscriptionChoice}
                      onProcessSession={liveSession.processSession}
                      onEnd={() => { liveSession.endSession(); analytics.trackSessionEnded({ duration: liveSession.sessionDuration }); }}
                      onStart={async (title) => {
                        if (!personA) return;
                        const chartSnapshot: SessionChartSnapshot = {
                          chartA: personA.natalChart,
                          chartB: hasSynastry && personB ? personB.natalChart : undefined,
                          nameA: personA.name || 'Person A',
                          nameB: hasSynastry && personB ? (personB.name || 'Person B') : undefined,
                          birthDataA: personAData.lat !== null ? { name: personA.name, date: personA.date, time: personA.time, location: personAData.location, lat: personAData.lat!, lng: personAData.lng! } : undefined,
                          birthDataB: hasSynastry && personBData?.lat !== null ? { name: personBData!.name, date: personBData!.date, time: personBData!.time, location: personBData!.location, lat: personBData!.lat!, lng: personBData!.lng! } : undefined,
                          theme: pageTheme,
                          mode: hasSynastry ? 'synastry' : 'personA',
                          initialState: {
                            chartMode: hasSynastry ? 'synastry' : 'personA',
                            visiblePlanets: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northnode', 'southnode', 'chiron', 'lilith', 'juno', 'ceres', 'pallas', 'vesta', 'ascendant', 'midheaven'],
                            visibleAspects: ['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare'],
                            showHouses: true, showDegreeMarkers: true, showTransits: false,
                            progressedPerson: null, showSolarArc: false, relocatedPerson: null,
                            enabledAsteroidGroups: [], chartTheme: pageTheme,
                            rotateToAscendant: true, zodiacVantage: null,
                          },
                        };
                        liveChartStateRef.current = chartSnapshot.initialState;
                        const getSnapshot = (): ChartStateSnapshot => (biWheelStateRef.current as ChartStateSnapshot) ?? liveChartStateRef.current ?? chartSnapshot.initialState;
                        const shareLink = await liveSession.startSession(title, chartSnapshot, getSnapshot);
                        analytics.trackSessionStarted({ title });
                        toast.success('Session started — share link copied!');
                        navigator.clipboard.writeText(shareLink).catch(() => {});
                      }}
                    />
                    {liveSession.isSessionActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={liveSession.copyShareLink}
                        className="gap-1.5 text-xs"
                      >
                        <Link2 className="w-3 h-3" />
                        Copy Link
                      </Button>
                    )}
                  </div>
                  <div className="shrink-0">
                    {webglSupported && (
                      <GalacticToggle active={showGalactic} onToggle={handleGalacticToggle} />
                    )}
                  </div>
                </div>
              </div>
            )}
            {editing && (
              <div className="flex items-center justify-end mb-2">
                <div className="shrink-0">
                  {webglSupported && (
                    <GalacticToggle active={showGalactic} onToggle={handleGalacticToggle} />
                  )}
                </div>
              </div>
            )}

            {showGalactic && webglSupported ? (
              <ErrorBoundary fallbackMessage="3D chart encountered an error">
              <React.Suspense fallback={
                <div className="h-[650px] flex items-center justify-center bg-[#050510] rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
              }>
                <GalacticMode
                  chart={personA.natalChart}
                  name={personA.name || 'Person A'}
                  birthDate={personA.date}
                  visiblePlanets={sharedVisiblePlanets}
                  visibleAspects={sharedVisibleAspects}
                  onFetchAsteroidData={handleFetchAsteroidData}
                    onFetchFixedStarData={handleFetchFixedStarData}
                    onRefetchWithHouseSystem={handleRefetchWithHouseSystem}
                />
              </React.Suspense>
              </ErrorBoundary>
            ) : (
              <ErrorBoundary fallbackMessage="Chart encountered an error">
              <div className="relative">
                <BiWheelMobileWrapper
                  key={currentTab.id}
                  chartA={personA.natalChart}
                  chartB={hasSynastry ? personB!.natalChart : personA.natalChart}
                  nameA={personA.name || 'Person A'}
                  nameB={hasSynastry ? (personB!.name || 'Person B') : (personA.name || 'Person A')}
                  initialChartMode={sharedChartOptionsRef.current?.mode || initialMode as any}
                  enableTransits={true}
                  enableComposite={hasSynastry}
                  enableProgressed={true}
                  enableRelocated={true}
                  enableBirthTimeShift={true}
                  onFetchTransits={handleFetchTransits}
                  onFetchComposite={hasSynastry ? handleFetchComposite : undefined}
                  onFetchProgressed={handleFetchProgressed}
                  onFetchRelocated={handleFetchRelocated}
                  onFetchShiftedNatal={handleFetchShiftedNatal}
                  onFetchAsteroidData={handleFetchAsteroidData}
                    onFetchFixedStarData={handleFetchFixedStarData}
                    onRefetchWithHouseSystem={handleRefetchWithHouseSystem}
                  initialTheme={pageTheme}
                  onThemeChange={handleThemeChange}
                  originalLocation={originalLocationA}
                  locationB={originalLocationB}
                  birthDateA={personA.date}
                  birthTimeA={personA.time}
                  birthDateB={hasSynastry ? personB!.date : undefined}
                  birthTimeB={hasSynastry ? personB!.time : undefined}
                  initialTimeShiftA={currentTab.timeShiftA ?? 0}
                  initialTimeShiftB={currentTab.timeShiftB ?? 0}
                  onTimeShiftAChange={(offset) => updateActiveTab({ timeShiftA: offset })}
                  onTimeShiftBChange={(offset) => updateActiveTab({ timeShiftB: offset })}
                  onVisiblePlanetsChange={setSharedVisiblePlanets}
                  onVisibleAspectsChange={setSharedVisibleAspects}
                  onChartModeChange={setChartMode}
                  shareBirthData={personAData.lat !== null ? {
                    name: personA.name || '',
                    date: personA.date,
                    time: personA.time,
                    lat: personA.lat!,
                    lng: personA.lng!,
                    location: personAData.location,
                  } : undefined}
                  chartNotesKey={`${personAData.date}-${personAData.time}-${personAData.lat}`}
                  onStateChange={liveSession.isSessionActive ? liveSession.recordStateChange : undefined}
                  {...(sharedChartOptionsRef.current?.visiblePlanets && { initialVisiblePlanets: sharedChartOptionsRef.current.visiblePlanets })}
                  {...(sharedChartOptionsRef.current?.visibleAspects && { initialVisibleAspects: sharedChartOptionsRef.current.visibleAspects as Set<any> })}
                  {...(sharedChartOptionsRef.current?.showHouses !== undefined && { initialShowHouses: sharedChartOptionsRef.current.showHouses })}
                  {...(sharedChartOptionsRef.current?.showDegreeMarkers !== undefined && { initialShowDegreeMarkers: sharedChartOptionsRef.current.showDegreeMarkers })}
                  {...(sharedChartOptionsRef.current?.enabledAsteroidGroups && { initialEnabledAsteroidGroups: sharedChartOptionsRef.current.enabledAsteroidGroups })}
                  onCursorMove={liveSession.isSessionActive ? liveSession.recordCursor : undefined}
                  stateRef={biWheelStateRef}
                />
              </div>
              </ErrorBoundary>
            )}
          </div>

          {/* Astro Tools Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div ref={tabsListRef as any}>
              <TabsList className="flex flex-wrap gap-x-3 gap-y-2 w-full bg-transparent rounded-none px-1 pt-2 pb-1 h-auto items-start">
              {[
                { group: 'Analysis', tabs: [
                  { value: 'aspect-grid', icon: Grid3X3, label: 'Aspects' },
                  { value: 'dignities', icon: Crown, label: 'Dignities' },
                  { value: 'fixed-stars', icon: Star, label: 'Fixed Stars' },
                  { value: 'declination', icon: ArrowUpDown, label: 'Declination' },
                ]},
                { group: 'Time', tabs: [
                  { value: 'profections', icon: RotateCcw, label: 'Profections' },
                  { value: 'age-degree', icon: Gauge, label: 'Activations' },
                  { value: 'transits', icon: CalendarClock, label: 'Transits' },
                ]},
                { group: 'Data', tabs: [
                  { value: 'ephemeris', icon: Table2, label: 'Ephemeris' },
                  { value: 'graphic-eph', icon: TrendingUp, label: 'Graphic Ephemeris' },
                ]},
                { group: 'Tools', tabs: [
                  { value: 'ai-reading', icon: Sparkles, label: 'AI Reading' },
                  { value: 'time-finder', icon: Search, label: 'Time Finder' },
                  { value: 'notes', icon: StickyNote, label: 'Notes' },
                ]},
              ].map(group => (
                <div key={group.group} className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40 select-none">{group.group}</span>
                  <div className="flex items-end gap-0.5">
                  {group.tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className={`text-xs whitespace-nowrap gap-1.5 rounded-lg px-3 py-2 bg-transparent shadow-none transition-all duration-150 border ${
                          isActive
                            ? 'text-foreground bg-foreground/10 border-foreground/20 font-medium'
                            : 'text-muted-foreground/60 border-transparent hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </TabsTrigger>
                    );
                  })}
                  </div>
                </div>
              ))}
              </TabsList>
            </div>

            <ErrorBoundary fallbackMessage="This tool tab encountered an error">
            <React.Suspense fallback={
              <div className="mt-4 min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            }>
            <TabsContent value="aspect-grid" className="mt-4 min-h-[400px]">
              <AspectGridTable chartA={personA.natalChart} chartB={hasSynastry ? personB!.natalChart : undefined} nameA={personA.name || 'Person A'} nameB={hasSynastry ? (personB!.name || 'Person B') : undefined} visiblePlanets={sharedVisiblePlanets} visibleAspects={sharedVisibleAspects} chartMode={chartMode} />
            </TabsContent>
            <TabsContent value="profections" className="mt-4 min-h-[400px]">
              <ProfectionsPanel natalChart={personA.natalChart} birthDate={personA.date} name={personA.name || 'Person A'} />
            </TabsContent>
            <TabsContent value="age-degree" className="mt-4 min-h-[400px]">
              <AgeDegreePanel natalChart={personA.natalChart} birthDate={personA.date} name={personA.name || 'Person A'} />
            </TabsContent>
            <TabsContent value="ephemeris" className="mt-4 min-h-[400px]">
              <EphemerisTable natalChart={personA.natalChart} birthDate={personA.date} birthTime={personA.time} lat={personA.lat ?? 33.89} lng={personA.lng ?? 35.50} name={personA.name || 'Person A'} />
            </TabsContent>
            <TabsContent value="graphic-eph" className="mt-4 min-h-[400px]">
              <GraphicEphemeris natalChart={personA.natalChart} birthDate={personA.date} birthTime={personA.time} lat={personA.lat ?? 33.89} lng={personA.lng ?? 35.50} name={personA.name || 'Person A'} />
            </TabsContent>
            <TabsContent value="transits" className="mt-4 min-h-[400px]">
              <TransitTimeline natalChart={personA.natalChart} birthInfo={{ date: personA.date, time: personA.time, lat: personA.lat ?? 33.89, lng: personA.lng ?? 35.50 }} personName={personA.name || 'Person A'} />
            </TabsContent>
            <TabsContent value="declination" className="mt-4 min-h-[400px]">
              <DeclinationPanel chartA={personA.natalChart} chartB={hasSynastry ? personB!.natalChart : undefined} nameA={personA.name || 'Person A'} nameB={hasSynastry ? (personB!.name || 'Person B') : undefined} />
            </TabsContent>
            <TabsContent value="dignities" className="mt-4 min-h-[400px]">
              <DignityTable natalChart={personA.natalChart} />
            </TabsContent>
            <TabsContent value="fixed-stars" className="mt-4 min-h-[400px]">
              <FixedStarsPanel natalChart={personA.natalChart} birthInfo={{ date: personA.date, time: personA.time, lat: personA.lat ?? 33.89, lng: personA.lng ?? 35.50 }} />
            </TabsContent>
            <TabsContent value="ai-reading" className="mt-4 min-h-[400px]">
              <AIReading
                chartA={personA.natalChart}
                chartB={hasSynastry ? personB!.natalChart : undefined}
                nameA={personA.name || 'Person A'}
                nameB={hasSynastry ? (personB!.name || 'Person B') : undefined}
                birthInfoA={{ date: personAData.date, time: personAData.time, lat: personAData.lat ?? undefined, lng: personAData.lng ?? undefined }}
                birthInfoB={hasSynastry && personBData ? { date: personBData.date, time: personBData.time, lat: personBData.lat ?? undefined, lng: personBData.lng ?? undefined } : undefined}
              />
            </TabsContent>
            <TabsContent value="time-finder" className="mt-4 min-h-[400px]">
              <TimeFinder
                onUseTime={(data) => {
                  setPersonAData(prev => ({
                    ...prev,
                    date: data.date,
                    time: data.time,
                    location: data.location,
                    lat: data.lat,
                    lng: data.lng,
                  }));
                  setEditing(true);
                }}
              />
            </TabsContent>
            <TabsContent value="notes" className="mt-4 min-h-[400px]">
              <ChartNotes
                chartKey={`${personAData.date}-${personAData.time}-${personAData.lat}`}
                chartTitle={hasSynastry ? `${personA.name || 'Person A'} & ${personB!.name || 'Person B'}` : (personA.name || 'Person A')}
                birthData={{
                  name: personA.name || '',
                  date: personA.date,
                  time: personA.time,
                  lat: personA.lat ?? 33.89,
                  lng: personA.lng ?? 35.50,
                  location: personAData.location,
                }}
              />
            </TabsContent>
            </React.Suspense>
            </ErrorBoundary>
          </Tabs>
        </div>
        )
      ) : (
        <div className="container py-8 md:py-12 px-2 md:px-6">
          {showTimeFinder ? (
            <div className="max-w-2xl mx-auto">
              <div className="mb-4">
                <Button variant="ghost" size="sm" onClick={() => setShowTimeFinder(false)} className="text-xs text-muted-foreground gap-1.5">
                  <X className="w-3 h-3" /> Close Time Finder
                </Button>
              </div>
              <React.Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                <TimeFinder
                  onUseTime={(data) => {
                    setPersonAData(prev => ({
                      ...prev,
                      date: data.date,
                      time: data.time,
                      location: data.location,
                      lat: data.lat,
                      lng: data.lng,
                    }));
                    setEditing(true);
                    setShowTimeFinder(false);
                  }}
                />
              </React.Suspense>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] mb-6">
                <svg viewBox="0 0 400 400" className="w-full h-full text-muted-foreground/15">
                  <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="200" cy="200" r="155" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="200" cy="200" r="100" fill="none" stroke="currentColor" strokeWidth="1" />
                  {Array.from({ length: 12 }, (_, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    return <line key={i} x1={200 + 100 * Math.cos(angle)} y1={200 + 100 * Math.sin(angle)} x2={200 + 190 * Math.cos(angle)} y2={200 + 190 * Math.sin(angle)} stroke="currentColor" strokeWidth="1" />;
                  })}
                  <line x1="195" y1="200" x2="205" y2="200" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="200" y1="195" x2="200" y2="205" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Enter birth data to generate a chart</p>
              <div className="flex items-center gap-2">
                {!editing && (
                  <Button variant="outline" onClick={() => setEditing(true)}>Enter Birth Data</Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowTimeFinder(true)} className="text-xs text-muted-foreground gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                  Time Finder
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────── */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <KeyboardShortcutsHelp open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} />
      <ChartSpotlight open={showSpotlight} onClose={() => setShowSpotlight(false)} onLoad={handleLoadChart} userId={user?.id || null} />


      {/* Session reconnecting overlay */}
      {liveSession.reconnecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Reconnecting to session...</p>
          </div>
        </div>
      )}

      {/* Live Session Video Feeds — floating thumbnails only in chart mode */}
      {liveSession.isSessionActive && viewMode === 'chart' && (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
          {liveSession.remoteParticipants.map((p) => (
            <VideoFeed key={p.id} stream={p.videoStream} label={p.name} isSpeaking={liveSession.activeSpeakerId === p.id} />
          ))}
          <VideoFeed stream={liveSession.localVideoStream} muted mirrored label="You" isSpeaking={liveSession.activeSpeakerId === 'local'} />
        </div>
      )}

      {/* Live Session Controls */}
      {liveSession.isSessionActive && (
        <SessionControls
          duration={liveSession.sessionDuration}
          isRecording={liveSession.isRecording}
          isMuted={liveSession.isMuted}
          isVideoOff={liveSession.isVideoOff}
          guestCount={liveSession.guestCount}
          isPaused={liveSession.session?.status === 'paused'}
          onToggleMute={liveSession.toggleMute}
          onToggleVideo={liveSession.toggleVideo}
          onPause={liveSession.pauseSession}
          onResume={liveSession.resumeSession}
          onCopyShareLink={liveSession.copyShareLink}
          audioDevices={liveSession.audioDevices}
          videoDevices={liveSession.videoDevices}
          currentAudioDeviceId={liveSession.currentAudioDeviceId}
          currentVideoDeviceId={liveSession.currentVideoDeviceId}
          onSwitchAudioDevice={liveSession.switchAudioDevice}
          onSwitchVideoDevice={liveSession.switchVideoDevice}
          onRefreshDevices={liveSession.refreshDevices}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode(v => {
            const next = v === 'chart' ? 'video' : 'chart';
            liveSession.recordStateChange('view_mode', { mode: next });
            return next;
          })}
          onEndSession={() => { liveSession.endSession(); analytics.trackSessionEnded({ duration: liveSession.sessionDuration }); }}
        />
      )}

      {/* Post-Session Banner */}
      {liveSession.isSessionEnded && liveSession.session && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <PostSessionBanner
            title={liveSession.session.title}
            replayUrl={liveSession.replayUrl}
            status={liveSession.session.status}
            guestEmail={liveSession.session.guest_email}
            onDismiss={liveSession.dismissSession}
          />
        </div>
      )}

      {/* Other Window Banner */}
      {liveSession.isSessionInOtherWindow && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <OtherWindowBanner
            title={liveSession.session?.title || 'Live Session'}
            onTakeOver={liveSession.takeOverSession}
            onDismiss={liveSession.dismissSession}
            reconnecting={liveSession.reconnecting}
          />
        </div>
      )}
    </div>
  );
}
