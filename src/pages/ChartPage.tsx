import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { Loader2, MapPin, Plus, X, Pencil, ClipboardPaste, FolderOpen, LogIn, User, Calendar, Clock, Search, Sparkles, Grid3X3, RotateCcw, Gauge, Table2, TrendingUp, CalendarClock, ArrowUpDown, StickyNote, Download, CreditCard, LogOut, ChevronDown } from 'lucide-react';
import { SaveChartButton } from '@/components/charts/SaveChartButton';
import { getSavedCharts, type SavedChart } from '@/components/charts/SaveChartButton';
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
import { SavedChartsList } from '@/components/charts/SavedChartsList';
import { AstroComImport, type ParsedPerson } from '@/components/charts/AstroComImport';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import type { TransitData, CompositeData, ProgressedData, RelocatedData, AsteroidsParam } from '@/components/biwheel/types';
import { GalacticToggle } from '@/components/galactic';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';

// Lazy-load GalacticMode to avoid loading Three.js until needed
const GalacticMode = React.lazy(() => import('@/components/galactic/GalacticMode'));

// Astro tools
import { AspectGridTable } from '@/components/astro-tools/AspectGridTable';
import { ProfectionsPanel } from '@/components/astro-tools/ProfectionsPanel';
import { EphemerisTable } from '@/components/astro-tools/EphemerisTable';
import { GraphicEphemeris } from '@/components/astro-tools/GraphicEphemeris';
import { TransitTimeline } from '@/components/astro-tools/TransitTimeline';
import { AgeDegreePanel } from '@/components/astro-tools/AgeDegreePanel';
import { DeclinationPanel } from '@/components/astro-tools/DeclinationPanel';
import { ChartNotes } from '@/components/astro-tools/ChartNotes';

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
        {onRemove && (
          <button onClick={onRemove} className="text-muted-foreground/60 hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
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

        {/* Date & Time row */}
        <div className="grid grid-cols-2 divide-x divide-border/30">
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
  const { isPaid, openPortal } = useSubscription();

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
  const [showSaved, setShowSaved] = useState(false);
  const [showAstroImport, setShowAstroImport] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pageTheme, setPageTheme] = useState(() => localStorage.getItem('astrologer_theme') || 'classic');
  const [activeTab, setActiveTab] = useState('aspect-grid');
  const [showGalactic, setShowGalactic] = useState(false);
  const webglSupported = useWebGLSupport();

  // Shared visibility state — synced from 2D chart, passed one-way to galactic mode
  const [sharedVisiblePlanets, setSharedVisiblePlanets] = useState<Set<string>>(
    new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'northnode', 'southnode', 'ascendant', 'midheaven'])
  );
  const [sharedVisibleAspects, setSharedVisibleAspects] = useState<Set<string>>(
    new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition'])
  );
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);

  // Load theme from user profile on login
  useEffect(() => {
    if (!user) return;
    supabase.from('astrologer_profiles').select('theme').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.theme && data.theme !== pageTheme) {
          setPageTheme(data.theme);
          localStorage.setItem('astrologer_theme', data.theme);
        }
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save theme to profile when changed
  const handleThemeChange = useCallback((t: string) => {
    setPageTheme(t);
    localStorage.setItem('astrologer_theme', t);
    if (user) {
      supabase.from('astrologer_profiles').update({ theme: t }).eq('id', user.id).then(() => {});
    }
  }, [user]);

  // Build unique saved persons from saved charts for name autocomplete
  const savedPersons = useMemo<SavedPerson[]>(() => {
    if (!user) return [];
    const charts = getSavedCharts();
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
  }, [user]);

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
      setChartA(parseNatalResponse(dataA));

      if (personBData && personBData.date && personBData.lat !== null) {
        const dataB = await swissEphemeris.natal({
          birth_date: personBData.date,
          birth_time: personBData.time || '12:00',
          lat: personBData.lat,
          lng: personBData.lng,
        });
        setChartB(parseNatalResponse(dataB));
      } else {
        setChartB(null);
      }
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to calculate chart');
    } finally {
      setLoading(false);
    }
  }, [personAData, personBData]);

  // ─── Import / Load ──────────────────────────────────────────

  const handleAstroImport = useCallback(async (persons: ParsedPerson[]) => {
    if (persons.length === 0) return;
    setShowAstroImport(false);

    // Load first person into chart view
    const a = persons[0];
    setPersonAData({ name: a.name, date: a.date, time: a.time, location: a.location, lat: a.lat, lng: a.lng });
    if (persons.length >= 2) {
      const b = persons[1];
      setPersonBData({ name: b.name, date: b.date, time: b.time, location: b.location, lat: b.lat, lng: b.lng });
    } else {
      setPersonBData(null);
    }
    setChartA(null);
    setChartB(null);
    setEditing(true);

    // Compute natal charts for all imported persons and save them
    const existing = getSavedCharts();
    let savedCount = 0;
    for (const person of persons) {
      if (!person.lat || !person.lng) continue;
      try {
        const data = await swissEphemeris.natal({
          birth_date: person.date,
          birth_time: person.time || '12:00',
          lat: person.lat,
          lng: person.lng,
        });
        const natalChart = parseNatalResponse(data);
        const saved: SavedChart = {
          id: crypto.randomUUID(),
          name: person.name,
          chart_type: 'natal',
          person_a_name: person.name,
          person_a_date: person.date,
          person_a_time: person.time,
          person_a_location: person.location,
          person_a_lat: person.lat,
          person_a_lng: person.lng,
          person_a_chart: natalChart,
          person_b_name: null,
          person_b_date: null,
          person_b_time: null,
          person_b_location: null,
          person_b_lat: null,
          person_b_lng: null,
          person_b_chart: null,
          created_at: new Date().toISOString(),
        };
        existing.unshift(saved);
        savedCount++;
      } catch {
        // Skip charts that fail to compute
      }
    }
    if (savedCount > 0) {
      localStorage.setItem('astrologer_saved_charts', JSON.stringify(existing));
    }
    toast.success(`Saved ${savedCount} chart${savedCount !== 1 ? 's' : ''}`);
  }, []);

  const handleLoadChart = useCallback((chart: any) => {
    const birthA: BirthData = { name: chart.person_a_name || '', date: chart.person_a_date, time: chart.person_a_time, location: chart.person_a_location || '', lat: chart.person_a_lat, lng: chart.person_a_lng };
    setPersonAData(birthA);
    setChartA(chart.person_a_chart);
    if (chart.person_b_chart) {
      const birthB: BirthData = { name: chart.person_b_name || '', date: chart.person_b_date, time: chart.person_b_time, location: chart.person_b_location || '', lat: chart.person_b_lat, lng: chart.person_b_lng };
      setPersonBData(birthB);
      setChartB(chart.person_b_chart);
    } else {
      setPersonBData(null);
      setChartB(null);
    }
    setEditing(false);
    setShowSaved(false);
  }, []);

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
    const src = person === 'A' ? personAData : personBData;
    if (!src?.lat) throw new Error(`Person ${person} birth info not available`);
    const body: Record<string, unknown> = { birth_date: src.date, birth_time: src.time || '12:00', original_lat: src.lat, original_lng: src.lng, original_name: src.location || 'Birth Location', relocated_lat: newLat, relocated_lng: newLng };
    if (asteroids) body.asteroids = asteroids;
    const data = await swissEphemeris.relocated(body);
    return { original_location: data.original_location || { lat: src.lat, lng: src.lng!, name: src.location || 'Birth Location' }, relocated_location: data.relocated_location || { lat: newLat, lng: newLng, name: 'Relocated Location' }, relocated_planets: data.relocated_planets || [], houses: data.houses || { cusps: [], ascendant: 0, mc: 0 }, ascendantSign: data.ascendantSign || '' };
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

  const originalLocationA = personAData.lat ? { lat: personAData.lat, lng: personAData.lng!, name: personAData.location || 'Birth Location' } : undefined;
  const originalLocationB = personBData?.lat ? { lat: personBData.lat, lng: personBData.lng!, name: personBData.location || 'Birth Location' } : undefined;
  const initialMode = hasSynastry ? 'synastry' : 'personA';
  const canCalculate = !!personAData.date && personAData.lat !== null;

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className={`min-h-screen transition-colors duration-300 ${hasChart && isThemeDark(pageTheme) ? 'dark' : ''}`} style={hasChart ? themeVars : undefined}>

      {/* ── Header Bar ──────────────────────────────────────── */}
      <div className="border-b bg-background">
        <div className="container flex items-center gap-2 md:gap-3 py-2 px-2 md:px-6">
          <Link to="/" className="text-sm md:text-base font-bold tracking-tight shrink-0">Astrologer</Link>
          <div className="flex-1" />

          {user ? (
            <div className="flex items-center gap-2">
              {hasChart && personA && <SaveChartButton personA={personA} personB={personB} />}

              {!isPaid && (
                <Button size="sm" variant="default" onClick={() => setShowUpgrade(true)} className="gap-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" />
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
                  <DropdownMenuItem onClick={() => setShowSaved(true)}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    My Charts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAstroImport(true)}>
                    <ClipboardPaste className="w-4 h-4 mr-2" />
                    Import from Astro.com
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const charts = getSavedCharts();
                    if (charts.length === 0) { toast.error('No saved charts to export'); return; }
                    const blob = new Blob([JSON.stringify(charts, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'astrologer-charts.json';
                    document.body.appendChild(a); a.click();
                    document.body.removeChild(a); URL.revokeObjectURL(url);
                    toast.success(`Exported ${charts.length} chart${charts.length === 1 ? '' : 's'}`);
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Charts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isPaid ? (
                    <DropdownMenuItem onClick={() => openPortal()}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Subscription
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setShowUpgrade(true)}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </DropdownMenuItem>
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
      <div className="border-b border-border/50 bg-gradient-to-b from-background to-muted/20">
        <div className="container px-3 md:px-6">
          {editing ? (
            /* ─ Expanded edit form ─ */
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

              <div className="flex items-center gap-3 pt-1">
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
                {hasChart && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-muted-foreground">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* ─ Compact summary ─ */
            <div className="py-3 flex items-center gap-3 min-h-[48px] max-w-2xl mx-auto">
              <div className="flex-1 min-w-0 space-y-1">
                <BirthSummary data={personAData} />
                {personBData && hasSynastry && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground/50">&</span>
                    <BirthSummary data={personBData} />
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="shrink-0 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Chart Content ───────────────────────────────────── */}
      {hasChart && personA ? (
        <div className="container py-4 md:py-6 space-y-4 md:space-y-6 px-2 md:px-6">
          <div>
            {/* Galactic Mode toggle */}
            {webglSupported && !hasSynastry && (
              <div className="flex justify-end mb-2">
                <GalacticToggle active={showGalactic} onToggle={() => setShowGalactic(v => !v)} />
              </div>
            )}

            {showGalactic && webglSupported && !hasSynastry ? (
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
              <BiWheelMobileWrapper
                chartA={personA.natalChart}
                chartB={hasSynastry ? personB!.natalChart : personA.natalChart}
                nameA={personA.name || 'Person A'}
                nameB={hasSynastry ? (personB!.name || 'Person B') : (personA.name || 'Person A')}
                initialChartMode={initialMode as any}
                enableTransits={true}
                enableComposite={hasSynastry}
                enableProgressed={true}
                enableRelocated={true}
                onFetchTransits={handleFetchTransits}
                onFetchComposite={hasSynastry ? handleFetchComposite : undefined}
                onFetchProgressed={handleFetchProgressed}
                onFetchRelocated={handleFetchRelocated}
                onFetchAsteroidData={handleFetchAsteroidData}
                onThemeChange={handleThemeChange}
                originalLocation={originalLocationA}
                locationB={originalLocationB}
                birthDateA={personA.date}
                birthTimeA={personA.time}
                onVisiblePlanetsChange={setSharedVisiblePlanets}
                onVisibleAspectsChange={setSharedVisibleAspects}
                shareBirthData={personAData.lat !== null ? {
                  name: personA.name || '',
                  date: personA.date,
                  time: personA.time,
                  lat: personA.lat!,
                  lng: personA.lng!,
                  location: personAData.location,
                } : undefined}
              />
            )}
          </div>

          {/* Astro Tools Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex overflow-x-auto gap-0 w-full scrollbar-hide bg-transparent border-b border-border/50 rounded-none p-0 h-auto">
              {[
                { value: 'aspect-grid', icon: Grid3X3, label: 'Aspects' },
                { value: 'profections', icon: RotateCcw, label: 'Profections' },
                { value: 'age-degree', icon: Gauge, label: 'Age Degree' },
                { value: 'ephemeris', icon: Table2, label: 'Ephemeris' },
                { value: 'graphic-eph', icon: TrendingUp, label: 'Graphic Eph.' },
                { value: 'transits', icon: CalendarClock, label: 'Transits' },
                { value: 'declination', icon: ArrowUpDown, label: 'Declination' },
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

            <TabsContent value="aspect-grid" className="mt-4 min-h-[400px]">
              <AspectGridTable chartA={personA.natalChart} chartB={hasSynastry ? personB!.natalChart : undefined} nameA={personA.name || 'Person A'} nameB={hasSynastry ? (personB!.name || 'Person B') : undefined} />
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
          </Tabs>
        </div>
      ) : !editing ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <p>Enter birth data above to generate a chart.</p>
          <Button variant="outline" onClick={() => setEditing(true)}>Enter Birth Data</Button>
        </div>
      ) : null}

      {/* ── Modals ──────────────────────────────────────────── */}
      <SavedChartsList isOpen={showSaved} onClose={() => setShowSaved(false)} onLoad={handleLoadChart} />
      <AstroComImport isOpen={showAstroImport} onClose={() => setShowAstroImport(false)} onImport={handleAstroImport} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
