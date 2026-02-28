import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { Loader2, MapPin, Plus, X, Pencil, LogIn, User, Calendar, Clock, Search, Sparkles, Grid3X3, RotateCcw, Gauge, Table2, TrendingUp, CalendarClock, ArrowUpDown, StickyNote, LogOut, ChevronDown, Shield, Keyboard, Settings, CreditCard, FolderOpen, Radio, AlertTriangle } from 'lucide-react';
import { SaveChartButton } from '@/components/charts/SaveChartButton';
import { getSavedCharts, getSavedChartsAsync, invalidateChartsCache, type SavedChart } from '@/components/charts/SaveChartButton';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BiWheelMobileWrapper } from '@/components/biwheel';
import { swissEphemeris } from '@/api/swissEphemeris';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { ChartSpotlight } from '@/components/charts/ChartSpotlight';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import type { TransitData, CompositeData, ProgressedData, RelocatedData, AsteroidsParam, AsteroidGroup, ChartMode } from '@/components/biwheel/types';
import { ASTEROID_GROUPS } from '@/components/biwheel/types';
import { GalacticToggle } from '@/components/galactic/GalacticToggle';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
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
  const [nameSuggestions, setNameSuggestions] = useState<SavedPerson[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const searchLocation = useCallback(async () => {
    if (!data.location || data.location.length < 2) return;
    setSearching(true);
    try {
      const base = import.meta.env.DEV
        ? '/nominatim'
        : 'https://nominatim.openstreetmap.org';
      const res = await fetch(
        `${base}/search?format=json&q=${encodeURIComponent(data.location)}&limit=5`,
      );
      const json: GeoResult[] = await res.json();
      if (json.length > 0) {
        onChange({ ...data, location: json[0].display_name, lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) });
        setResults(json.length > 1 ? json.slice(1) : []);
      } else {
        setResults([]);
        toast.error('No locations found');
      }
    } catch {
      toast.error('Location search failed');
    } finally {
      setSearching(false);
    }
  }, [data, onChange]);

  const inputBase = "w-full bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none";

  return (
    <div className="rounded-xl border border-border/60 bg-gradient-to-b from-card to-card/80 shadow-sm overflow-hidden">
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
              onFocus={() => {
                if (savedPersons.length > 0) {
                  const filtered = data.name
                    ? savedPersons.filter(p => p.name.toLowerCase().includes(data.name.toLowerCase()))
                    : savedPersons;
                  setNameSuggestions(filtered);
                  setShowNameDropdown(filtered.length > 0);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowNameDropdown(false), 150);
              }}
              className={inputBase}
              autoComplete="off"
            />
          </div>
          {showNameDropdown && nameSuggestions.length > 0 && (
            <div className="absolute z-50 left-3 right-3 top-full mt-1 border border-border/60 rounded-lg bg-card shadow-lg max-h-44 overflow-y-auto">
              {nameSuggestions.map((p, i) => (
                <button
                  key={`${p.name}-${p.date}-${i}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange({ name: p.name, date: p.date, time: p.time, location: p.location, lat: p.lat, lng: p.lng });
                    setShowNameDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60 border-b border-border/20 last:border-0 transition-colors"
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
            <input
              type="date"
              value={data.date}
              onChange={(e) => onChange({ ...data, date: e.target.value })}
              className={inputBase}
            />
          </div>
          <div className="group flex items-center gap-3 px-3 py-2.5 border-b border-border/30 transition-colors group-focus-within:border-foreground/20">
            <Clock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            <input
              type="time"
              value={data.time}
              onChange={(e) => onChange({ ...data, time: e.target.value })}
              className={inputBase}
            />
          </div>
        </div>

        {/* Location */}
        <div className="group flex items-center gap-3 px-3 py-2.5 transition-colors group-focus-within:border-foreground/20">
          <MapPin className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          <input
            type="text"
            placeholder="City, Country"
            value={data.location}
            onChange={(e) => {
              onChange({ ...data, location: e.target.value, lat: null, lng: null });
              setResults([]);
            }}
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            onBlur={() => { if (data.lat === null && data.location && data.location.length >= 2) searchLocation(); }}
            className={`${inputBase} flex-1 min-w-0`}
          />
          <button
            onClick={searchLocation}
            disabled={searching}
            className="shrink-0 p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Location results */}
      {results.length > 0 && (
        <div className="mx-3 mb-3 border border-border/40 rounded-lg bg-muted/20 max-h-32 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                onChange({ ...data, location: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
                setResults([]);
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted/60 border-b border-border/20 last:border-0 transition-colors"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

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
  const routeState = location.state as { personA: PersonData; personB: PersonData | null } | null;
  const { user, signOut } = useAuth();
  const { isPaid, relocatedRemaining, useRelocatedCredit } = useSubscription();
  const liveSession = useSession();
  // Live chart state ref — updated by onStateChange so snapshots capture current state
  const liveChartStateRef = useRef<ChartStateSnapshot | null>(null);
  // BiWheel writes its current state here directly (no callbacks needed for snapshots)
  const biWheelStateRef = useRef<Record<string, any> | null>(null);

  // Always keep the snapshot getter set — needed for both fresh sessions and reconnects
  useEffect(() => {
    liveSession.setSnapshotGetter(() => (biWheelStateRef.current as ChartStateSnapshot) ?? liveChartStateRef.current ?? {} as ChartStateSnapshot);
  }, [liveSession.setSnapshotGetter]);

  // Restore session state on mount
  const sessionRestore = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('astrologer_session');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, []);

  // Birth data inputs
  const [personAData, setPersonAData] = useState<BirthData>(sessionRestore?.personAData ?? emptyBirth());
  const [personBData, setPersonBData] = useState<BirthData | null>(sessionRestore?.personBData ?? null);

  // Calculated charts
  const [chartA, setChartA] = useState<NatalChart | null>(sessionRestore?.chartA ?? null);
  const [chartB, setChartB] = useState<NatalChart | null>(sessionRestore?.chartB ?? null);

  // Full person data for chart (combines birth data + chart)
  const personA: PersonData | null = chartA ? { ...personAData, natalChart: chartA } : null;
  const personB: PersonData | null = chartB && personBData ? { ...personBData, natalChart: chartB } : null;
  const hasChart = !!chartA;
  const hasSynastry = !!chartB && !!personBData;

  // UI state
  const [editing, setEditing] = useState(sessionRestore?.chartA ? false : true);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pageTheme, setPageTheme] = useState(() => localStorage.getItem('astrologer_theme') || 'classic');
  const [themeReady, setThemeReady] = useState(!user); // ready immediately if not logged in

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

  const [activeTab, setActiveTab] = useState('aspect-grid');
  const tabsListRef = useRef<HTMLDivElement>(null);
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    analytics.trackToolTabViewed({ tab });
  }, []);

  // Scroll active tab into view + update fade indicators
  useEffect(() => {
    const el = tabsListRef.current;
    if (!el) return;
    const active = el.querySelector('[data-state="active"]') as HTMLElement | null;
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    const updateFades = () => {
      const left = el.previousElementSibling as HTMLElement | null;
      const right = el.nextElementSibling as HTMLElement | null;
      if (left) left.style.opacity = el.scrollLeft > 4 ? '1' : '0';
      if (right) right.style.opacity = el.scrollLeft < el.scrollWidth - el.clientWidth - 4 ? '1' : '0';
    };
    updateFades();
    el.addEventListener('scroll', updateFades, { passive: true });
    return () => el.removeEventListener('scroll', updateFades);
  }, [activeTab]);

  const [showGalactic, setShowGalactic] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'video'>('chart');
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from('astrologer_profiles').select('is_admin').eq('id', user.id).single()
      .then(({ data }) => {
        setIsAdmin(data?.is_admin ?? false);
      });
  }, [user]);

  // Shared visibility state — synced from 2D chart, passed one-way to galactic mode
  const [sharedVisiblePlanets, setSharedVisiblePlanets] = useState<Set<string>>(
    new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])
  );
  const [sharedVisibleAspects, setSharedVisibleAspects] = useState<Set<string>>(
    new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx', 'semisextile', 'semisquare'])
  );
  const [chartMode, setChartMode] = useState<ChartMode>(hasSynastry ? 'synastry' : 'personA');
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);

  // Load theme from user profile on login — DB is source of truth when logged in
  useEffect(() => {
    if (!user) {
      setThemeReady(true);
      return;
    }
    setThemeReady(false);
    supabase.from('astrologer_profiles').select('theme').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.theme) {
          setPageTheme(data.theme);
          localStorage.setItem('astrologer_theme', data.theme);
        }
        setThemeReady(true);
      })
      .catch(() => setThemeReady(true));
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

  // Load from route state (saved charts, etc.)
  useEffect(() => {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Persist chart state to sessionStorage
  useEffect(() => {
    if (chartA) {
      try {
        sessionStorage.setItem('astrologer_session', JSON.stringify({
          personAData,
          personBData,
          chartA,
          chartB,
        }));
      } catch {}
    }
  }, [personAData, personBData, chartA, chartB]);

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
    setPersonAData(bA);
    setChartA(chart.person_a_chart);
    let bB: BirthData | null = null;
    if (chart.person_b_chart) {
      bB = { name: chart.person_b_name || '', date: chart.person_b_date, time: chart.person_b_time, location: chart.person_b_location || '', lat: chart.person_b_lat, lng: chart.person_b_lng };
      setPersonBData(bB);
      setChartB(chart.person_b_chart);
    } else {
      setPersonBData(null);
      setChartB(null);
    }
    setEditing(false);

    // Broadcast to guests if session is active
    broadcastChartSwap(chart.person_a_chart, bA, chart.person_b_chart || null, bB);
  }, [broadcastChartSwap]);

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
    onToggleEdit: useCallback(() => setEditing(v => !v), []),
    onToggleGalactic: handleGalacticToggle,
    onEscape: handleShortcutEscape,
    onShowHelp: useCallback(() => setShowShortcutsHelp(true), []),
    onSpotlight: useCallback(() => setShowSpotlight(true), []),
  });

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className={`min-h-screen transition-colors duration-300 ${hasChart && themeReady && isThemeDark(pageTheme) ? 'dark' : ''}`} style={hasChart && themeReady ? themeVars : undefined}>

      {/* ── Header Bar ──────────────────────────────────────── */}
      <div className="border-b bg-background">
        <div className="container flex items-center gap-2 md:gap-3 py-2 px-2 md:px-6">
          <Link to="/" className="text-sm md:text-base font-extralight tracking-[0.12em] uppercase shrink-0" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Astrologer</Link>
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

              <Link
                to="/settings"
                className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-foreground" />
                    </div>
                    <span className="hidden sm:inline max-w-[120px] truncate">{user.email?.split('@')[0]}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    {isPaid && <div className="text-[10px] text-emerald-500 font-medium mt-0.5">Pro</div>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings#account">
                      <User className="w-4 h-4 mr-2" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings#billing">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing & Usage
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings#charts">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Charts
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings#sessions">
                      <Radio className="w-4 h-4 mr-2" />
                      Sessions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings#preferences">
                      <Settings className="w-4 h-4 mr-2" />
                      Preferences
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowAuth(true)} className="gap-1.5 text-xs">
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Button>
          )}
        </div>
      </div>

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
        /* Video gallery mode: side-by-side layout */
        <div className="flex h-[calc(100vh-64px)]" style={{ marginTop: 0 }}>
          {/* Video gallery — left 70% */}
          <div className="w-[70%] h-full min-w-0">
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
          {/* Chart sidebar — right 30%, scrollable */}
          <div className="w-[30%] h-full overflow-y-auto border-l border-border/30 bg-background">
            <div className="py-4 space-y-4 px-3">
              <div>
                {/* Compact name header */}
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
                    chartA={personA.natalChart}
                    chartB={hasSynastry ? personB!.natalChart : personA.natalChart}
                    nameA={personA.name || 'Person A'}
                    nameB={hasSynastry ? (personB!.name || 'Person B') : (personA.name || 'Person A')}
                    initialChartMode={sharedChartOptionsRef.current?.mode || initialMode as any}
                    enableTransits={true}
                    enableComposite={hasSynastry}
                    enableProgressed={true}
                    enableRelocated={true}
                    onFetchTransits={handleFetchTransits}
                    onFetchComposite={hasSynastry ? handleFetchComposite : undefined}
                    onFetchProgressed={handleFetchProgressed}
                    onFetchRelocated={handleFetchRelocated}
                    onFetchAsteroidData={handleFetchAsteroidData}
                    initialTheme={themeReady ? pageTheme : undefined}
                    onThemeChange={handleThemeChange}
                    originalLocation={originalLocationA}
                    locationB={originalLocationB}
                    birthDateA={personA.date}
                    birthTimeA={personA.time}
                    birthDateB={hasSynastry ? personB!.date : undefined}
                    birthTimeB={hasSynastry ? personB!.time : undefined}
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
                    className="shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors p-0.5"
                    title="Edit birth data (E)"
                  >
                    <Pencil className="w-3 h-3" />
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
                            visiblePlanets: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'],
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
                />
              </React.Suspense>
            ) : (
              <div className="relative">
                <BiWheelMobileWrapper
                  chartA={personA.natalChart}
                  chartB={hasSynastry ? personB!.natalChart : personA.natalChart}
                  nameA={personA.name || 'Person A'}
                  nameB={hasSynastry ? (personB!.name || 'Person B') : (personA.name || 'Person A')}
                  initialChartMode={sharedChartOptionsRef.current?.mode || initialMode as any}
                  enableTransits={true}
                  enableComposite={hasSynastry}
                  enableProgressed={true}
                  enableRelocated={true}
                  onFetchTransits={handleFetchTransits}
                  onFetchComposite={hasSynastry ? handleFetchComposite : undefined}
                  onFetchProgressed={handleFetchProgressed}
                  onFetchRelocated={handleFetchRelocated}
                  onFetchAsteroidData={handleFetchAsteroidData}
                  initialTheme={themeReady ? pageTheme : undefined}
                  onThemeChange={handleThemeChange}
                  originalLocation={originalLocationA}
                  locationB={originalLocationB}
                  birthDateA={personA.date}
                  birthTimeA={personA.time}
                  birthDateB={hasSynastry ? personB!.date : undefined}
                  birthTimeB={hasSynastry ? personB!.time : undefined}
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
            )}
          </div>

          {/* Astro Tools Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="relative">
              {/* Left fade indicator */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 opacity-0 transition-opacity" />
              <TabsList
                ref={tabsListRef as any}
                className="flex justify-start overflow-x-auto gap-0 w-full scrollbar-hide bg-transparent border-b border-border/50 rounded-none p-0 h-auto"
              >
              {[
                { value: 'aspect-grid', icon: Grid3X3, label: 'Aspects' },
                { value: 'profections', icon: RotateCcw, label: 'Profections' },
                { value: 'age-degree', icon: Gauge, label: 'Age Degree' },
                { value: 'ephemeris', icon: Table2, label: 'Ephemeris' },
                { value: 'graphic-eph', icon: TrendingUp, label: 'Graphic Eph.' },
                { value: 'transits', icon: CalendarClock, label: 'Transits' },
                { value: 'declination', icon: ArrowUpDown, label: 'Declination' },
                { value: 'ai-reading', icon: Sparkles, label: 'AI Reading' },
                { value: 'notes', icon: StickyNote, label: 'Notes' },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`relative text-xs md:text-sm whitespace-nowrap flex-shrink-0 gap-1.5 rounded-none px-4 py-3 bg-transparent shadow-none transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-full" />
                    )}
                  </TabsTrigger>
                );
              })}
              </TabsList>
              {/* Right fade indicator */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 opacity-0 transition-opacity" />
            </div>

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
            <TabsContent value="ai-reading" className="mt-4 min-h-[400px]">
              <AIReading chartA={personA.natalChart} chartB={hasSynastry ? personB!.natalChart : undefined} nameA={personA.name || 'Person A'} nameB={hasSynastry ? (personB!.name || 'Person B') : undefined} />
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
          </Tabs>
        </div>
        )
      ) : (
        <div className="container py-8 md:py-12 px-2 md:px-6">
          {/* Empty chart placeholder */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] mb-6">
              {/* Outer circle */}
              <svg viewBox="0 0 400 400" className="w-full h-full text-muted-foreground/15">
                <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="200" cy="200" r="155" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="200" cy="200" r="100" fill="none" stroke="currentColor" strokeWidth="1" />
                {/* House lines */}
                {Array.from({ length: 12 }, (_, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  return <line key={i} x1={200 + 100 * Math.cos(angle)} y1={200 + 100 * Math.sin(angle)} x2={200 + 190 * Math.cos(angle)} y2={200 + 190 * Math.sin(angle)} stroke="currentColor" strokeWidth="1" />;
                })}
                {/* Center cross */}
                <line x1="195" y1="200" x2="205" y2="200" stroke="currentColor" strokeWidth="1.5" />
                <line x1="200" y1="195" x2="200" y2="205" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Enter birth data to generate a chart</p>
            {!editing && (
              <Button variant="outline" onClick={() => setEditing(true)}>Enter Birth Data</Button>
            )}
          </div>
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
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode(v => v === 'chart' ? 'video' : 'chart')}
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
