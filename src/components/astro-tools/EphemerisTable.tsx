/**
 * Ephemeris Table
 * Tabular planetary positions over a date range
 * Features: station markers (SR/SD), auto-load on mount, larger fonts
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { swissEphemeris } from '@/api/swissEphemeris';
import { ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';

interface PlanetEntry {
  planet: string;
  longitude: number;
  sign: string;
  degree: number;
  minute: number;
  retrograde: boolean;
}

interface EphemerisEntry {
  date: string;
  julian_day: number;
  planets: PlanetEntry[];
}

const DISPLAY_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

const PLANET_MINI_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  Sun: { symbol: '\u2609', color: '#FFB300' },
  Moon: { symbol: '\u263D', color: '#9E9E9E' },
  Mercury: { symbol: '\u263F', color: '#FDD835' },
  Venus: { symbol: '\u2640', color: '#F48FB1' },
  Mars: { symbol: '\u2642', color: '#E53935' },
  Jupiter: { symbol: '\u2643', color: '#7E57C2' },
  Saturn: { symbol: '\u2644', color: '#8D6E63' },
  Uranus: { symbol: '\u2645', color: '#42A5F5' },
  Neptune: { symbol: '\u2646', color: '#4DD0E1' },
  Pluto: { symbol: '\u2647', color: '#78909C' },
};

const SIGN_INFO: Record<string, { symbol: string; element: string }> = {};
ZODIAC_SIGNS.forEach(s => { SIGN_INFO[s.name] = { symbol: s.symbol, element: s.element }; });

// Element colors for sign symbols (traditional astrology colors)
const ELEMENT_COLORS: Record<string, string> = {
  fire: '#E53935',   // red
  earth: '#43A047',  // green
  air: '#FFB300',    // gold/yellow
  water: '#1E88E5',  // blue
};

function formatPosition(planet: PlanetEntry | undefined): { signSymbol: string; degrees: string; isRetro: boolean; elementColor: string } {
  if (!planet) return { signSymbol: '', degrees: '-', isRetro: false, elementColor: '' };
  const info = SIGN_INFO[planet.sign];
  const symbol = info?.symbol || planet.sign.slice(0, 3);
  const element = info?.element || '';
  return {
    signSymbol: symbol,
    degrees: `${planet.degree}\u00B0${String(planet.minute).padStart(2, '0')}'`,
    isRetro: planet.retrograde,
    elementColor: ELEMENT_COLORS[element] || '',
  };
}

function getDateRange(preset: string): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  switch (preset) {
    case '1m': { const end = new Date(now); end.setMonth(end.getMonth() + 1); return { start: fmt(now), end: fmt(end) }; }
    case '3m': { const end = new Date(now); end.setMonth(end.getMonth() + 3); return { start: fmt(now), end: fmt(end) }; }
    case '6m': { const end = new Date(now); end.setMonth(end.getMonth() + 6); return { start: fmt(now), end: fmt(end) }; }
    case '1y': { const end = new Date(now); end.setFullYear(end.getFullYear() + 1); return { start: fmt(now), end: fmt(end) }; }
    default: { const end = new Date(now); end.setMonth(end.getMonth() + 1); return { start: fmt(now), end: fmt(end) }; }
  }
}

type StationType = 'SR' | 'SD';

export function EphemerisTable() {
  const [entries, setEntries] = useState<EphemerisEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const end = new Date(); end.setMonth(end.getMonth() + 1);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  });
  const [activePreset, setActivePreset] = useState<string | null>('1m');
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchEphemeris = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await swissEphemeris.ephemeris({ start_date: startDate, end_date: endDate, step });
      if (data?.error) throw new Error(data.error);
      setEntries(data.entries || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [startDate, endDate, step]);

  // Auto-fetch on mount and whenever step/dates change
  useEffect(() => {
    fetchEphemeris();
  }, [fetchEphemeris]);

  const applyPreset = (preset: string) => {
    const { start, end } = getDateRange(preset);
    setStartDate(start);
    setEndDate(end);
    setActivePreset(preset);
  };

  // Detect sign changes
  const signChanges = useMemo(() => {
    const changes = new Set<string>();
    for (let i = 1; i < entries.length; i++) {
      for (const planet of DISPLAY_PLANETS) {
        const prev = entries[i - 1].planets.find(p => p.planet === planet);
        const curr = entries[i].planets.find(p => p.planet === planet);
        if (prev && curr && prev.sign !== curr.sign) changes.add(`${entries[i].date}-${planet}`);
      }
    }
    return changes;
  }, [entries]);

  // Detect station points (retrograde flag changes)
  const stations = useMemo(() => {
    const stationMap = new Map<string, StationType>();
    for (let i = 1; i < entries.length; i++) {
      for (const planet of DISPLAY_PLANETS) {
        const prev = entries[i - 1].planets.find(p => p.planet === planet);
        const curr = entries[i].planets.find(p => p.planet === planet);
        if (!prev || !curr) continue;
        if (!prev.retrograde && curr.retrograde) {
          stationMap.set(`${entries[i].date}-${planet}`, 'SR');
        } else if (prev.retrograde && !curr.retrograde) {
          stationMap.set(`${entries[i].date}-${planet}`, 'SD');
        }
      }
    }
    return stationMap;
  }, [entries]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Ephemeris Table</h3>
        <p className="text-xs text-muted-foreground">Planetary positions over time &mdash; track retrogrades and sign ingresses</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 p-3">
        {/* Date inputs */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setActivePreset(null); }}
              className="h-8 pl-8 pr-2 rounded-lg border bg-background text-sm tabular-nums"
            />
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setActivePreset(null); }}
              className="h-8 pl-8 pr-2 rounded-lg border bg-background text-sm tabular-nums"
            />
          </div>
        </div>

        {/* Step selector */}
        <div className="flex rounded-lg border overflow-hidden">
          {(['daily', 'weekly', 'monthly'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                step === s ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/60'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Presets */}
        <div className="flex gap-1.5">
          {['1m', '3m', '6m', '1y'].map(p => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activePreset === p
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                  : 'bg-background border hover:bg-muted/60'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Calculate button */}
        <Button onClick={fetchEphemeris} disabled={loading} size="sm" className="rounded-lg">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          Calculate
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Initial loading skeleton */}
      {initialLoading && loading && (
        <div className="rounded-xl border bg-card/50 p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}

      {/* Table */}
      {entries.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card/50">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left py-2.5 px-3 font-semibold text-xs sticky left-0 z-10 bg-muted/80 backdrop-blur-sm">Date</th>
                {DISPLAY_PLANETS.map(p => {
                  const info = PLANET_MINI_SYMBOLS[p];
                  return (
                    <th key={p} className="text-center py-2.5 px-2 font-medium">
                      <div className="flex flex-col items-center gap-0">
                        <span className="text-2xl" style={{ color: info?.color }}>{info?.symbol}</span>
                        <span className="text-xs text-muted-foreground leading-none">{p.slice(0, 3)}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={entry.date} className={`border-b border-border/15 transition-colors hover:bg-muted/20 ${
                  idx % 2 === 0 ? '' : 'bg-muted/5'
                }`}>
                  <td className="py-2.5 px-3 font-mono text-xs sticky left-0 z-10 bg-background/95 backdrop-blur-sm font-medium">
                    {new Date(entry.date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  {DISPLAY_PLANETS.map(planetName => {
                    const planet = entry.planets.find(p => p.planet === planetName);
                    const { signSymbol, degrees, isRetro, elementColor } = formatPosition(planet);
                    const hasSignChange = signChanges.has(`${entry.date}-${planetName}`);
                    const station = stations.get(`${entry.date}-${planetName}`);
                    const planetColor = PLANET_MINI_SYMBOLS[planetName]?.color;

                    return (
                      <td
                        key={planetName}
                        className={`py-2.5 px-2 text-center font-mono text-base whitespace-nowrap transition-colors ${
                          isRetro ? 'opacity-70' : ''
                        }`}
                      >
                        <span className={hasSignChange ? 'px-1.5 py-0.5 rounded-md bg-amber-500/10 ring-1 ring-amber-400/30' : ''}>
                          {signSymbol && <span className="text-lg" style={{ color: elementColor }}>{signSymbol}</span>}
                          <span style={planetColor ? { color: planetColor } : undefined}>{degrees}</span>
                          {isRetro && <span className="text-xs ml-0.5 font-bold" style={{ color: '#E53935' }}>R</span>}
                        </span>
                        {station && (
                          <Badge
                            className={`ml-1 text-[10px] px-1 h-4 font-bold ${
                              station === 'SR'
                                ? 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/30'
                                : 'bg-green-500/15 text-green-600 dark:text-green-400 ring-1 ring-green-500/30'
                            }`}
                          >
                            {station}
                          </Badge>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries.length === 0 && !loading && !initialLoading && (
        <div className="text-center py-12 rounded-xl border border-dashed bg-muted/10">
          <Calendar className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground">Select a date range and click Calculate</div>
          <div className="text-xs text-muted-foreground/60 mt-1">View planetary positions over time</div>
        </div>
      )}

      {/* Legend */}
      {entries.length > 0 && (
        <div className="flex items-center gap-5 text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-red-500 font-mono font-bold text-xs">R</span>
            <span>Retrograde</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 ring-1 ring-amber-400/30 text-[10px]">&#9793;</span>
            <span>Sign Ingress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className="text-[9px] px-1 h-4 bg-red-500/15 text-red-600 ring-1 ring-red-500/30">SR</Badge>
            <span>Station Retrograde</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className="text-[9px] px-1 h-4 bg-green-500/15 text-green-600 ring-1 ring-green-500/30">SD</Badge>
            <span>Station Direct</span>
          </div>
          <div className="ml-auto text-muted-foreground/60">
            {entries.length} entries
          </div>
        </div>
      )}
    </div>
  );
}
