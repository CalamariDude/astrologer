/**
 * Graphic Ephemeris
 * Time-series chart of planetary longitude over time using Recharts
 * Features: retrograde dashed lines, station dots, auto-load, theme filters, sign bands,
 *           custom date ranges, sign ingress markers, aspect-to-natal bands
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Loader2, LineChart as LineChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  CartesianGrid,
  ReferenceArea,
} from 'recharts';
import { swissEphemeris } from '@/api/swissEphemeris';
import { PLANETS, ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';
import type { NatalChart } from '@/components/biwheel/types';
import { LIFE_THEMES } from '@/lib/astroThemes';

interface GraphicEphemerisProps {
  natalChart?: NatalChart;
  birthInfo?: { date: string; time: string; lat: number; lng: number };
}

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
  planets: PlanetEntry[];
}

interface StationPoint {
  date: string;
  label: string;
  planet: string;
  value: number;
  type: 'SR' | 'SD';
  color: string;
}

interface IngressPoint {
  date: string;
  label: string;
  planet: string;
  value: number;
  sign: string;
  color: string;
}

const DISPLAY_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

const PLANET_COLORS: Record<string, string> = {
  Sun: '#FFB300',
  Moon: '#9E9E9E',
  Mercury: '#FDD835',
  Venus: '#F48FB1',
  Mars: '#E53935',
  Jupiter: '#7E57C2',
  Saturn: '#8D6E63',
  Uranus: '#42A5F5',
  Neptune: '#4DD0E1',
  Pluto: '#78909C',
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640', Mars: '\u2642',
  Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646', Pluto: '\u2647',
};

const SIGN_BAND_COLORS: Record<string, string> = {
  fire: 'rgba(229, 57, 53, 0.07)',
  earth: 'rgba(67, 160, 71, 0.07)',
  air: 'rgba(255, 179, 0, 0.06)',
  water: 'rgba(30, 136, 229, 0.07)',
};

// Element colors for Y-axis sign labels
const ELEMENT_COLORS: Record<string, string> = {
  fire: '#E53935',
  earth: '#43A047',
  air: '#FFB300',
  water: '#1E88E5',
};

const MAJOR_ASPECTS = [
  { name: 'Conjunction', angle: 0, color: 'rgba(255, 179, 0, 0.15)' },
  { name: 'Sextile', angle: 60, color: 'rgba(30, 136, 229, 0.12)' },
  { name: 'Square', angle: 90, color: 'rgba(229, 57, 53, 0.12)' },
  { name: 'Trine', angle: 120, color: 'rgba(67, 160, 71, 0.12)' },
  { name: 'Opposition', angle: 180, color: 'rgba(126, 87, 194, 0.12)' },
];

function getPresetDates(preset: string): { start: string; end: string; step: string } {
  const now = new Date();
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const start = fmt(now);
  switch (preset) {
    case '1M': { const e = new Date(now); e.setMonth(e.getMonth() + 1); return { start, end: fmt(e), step: 'daily' }; }
    case '3M': { const e = new Date(now); e.setMonth(e.getMonth() + 3); return { start, end: fmt(e), step: 'daily' }; }
    case '6M': { const e = new Date(now); e.setMonth(e.getMonth() + 6); return { start, end: fmt(e), step: 'weekly' }; }
    case '1Y': { const e = new Date(now); e.setFullYear(e.getFullYear() + 1); return { start, end: fmt(e), step: 'weekly' }; }
    case '5Y': { const e = new Date(now); e.setFullYear(e.getFullYear() + 5); return { start, end: fmt(e), step: 'monthly' }; }
    default: { const e = new Date(now); e.setMonth(e.getMonth() + 3); return { start, end: fmt(e), step: 'daily' }; }
  }
}

function autoStepForRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 90) return 'daily';
  if (days <= 365) return 'weekly';
  return 'monthly';
}

export function GraphicEphemeris({ natalChart }: GraphicEphemerisProps) {
  const [entries, setEntries] = useState<EphemerisEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yAxisMode, setYAxisMode] = useState<'absolute' | 'perSign'>('absolute');
  const [visiblePlanets, setVisiblePlanets] = useState<Set<string>>(new Set(DISPLAY_PLANETS));
  const [activePreset, setActivePreset] = useState('3M');
  const [initialLoading, setInitialLoading] = useState(true);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [showAspectBands, setShowAspectBands] = useState(false);

  const fetchData = useCallback(async (preset: string) => {
    setLoading(true);
    setError(null);
    setActivePreset(preset);
    setIsCustomRange(false);
    setCustomStart('');
    setCustomEnd('');
    const { start, end, step } = getPresetDates(preset);
    try {
      const data = await swissEphemeris.ephemeris({ start_date: start, end_date: end, step });
      if (data?.error) throw new Error(data.error);
      setEntries(data.entries || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  const fetchCustomRange = useCallback(async () => {
    if (!customStart || !customEnd) return;
    if (customStart >= customEnd) {
      setError('Start date must be before end date');
      return;
    }
    setLoading(true);
    setError(null);
    setIsCustomRange(true);
    const step = autoStepForRange(customStart, customEnd);
    try {
      const data = await swissEphemeris.ephemeris({ start_date: customStart, end_date: customEnd, step });
      if (data?.error) throw new Error(data.error);
      setEntries(data.entries || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [customStart, customEnd]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchData('3M');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlanet = (planet: string) => {
    setVisiblePlanets(prev => {
      const next = new Set(prev);
      if (next.has(planet)) next.delete(planet); else next.add(planet);
      return next;
    });
  };

  /** Quick filter by theme */
  const selectTheme = (themeKey: string) => {
    const theme = LIFE_THEMES[themeKey];
    if (!theme) return;
    // Map lowercase theme planets to display planet names
    const themePlanetNames = new Set<string>();
    for (const p of theme.planets) {
      const displayName = p.charAt(0).toUpperCase() + p.slice(1);
      if (DISPLAY_PLANETS.includes(displayName)) themePlanetNames.add(displayName);
    }
    // Always include Sun for context
    themePlanetNames.add('Sun');
    setVisiblePlanets(themePlanetNames);
  };

  const showAllPlanets = () => setVisiblePlanets(new Set(DISPLAY_PLANETS));

  // Build chart data with separate direct/retro series
  const chartData = useMemo(() => {
    return entries.map((entry, idx) => {
      const point: Record<string, any> = {
        date: entry.date,
        label: new Date(entry.date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      };
      for (const planet of entry.planets) {
        if (DISPLAY_PLANETS.includes(planet.planet)) {
          const value = yAxisMode === 'absolute' ? planet.longitude : planet.longitude % 30;
          const rounded = Math.round(value * 100) / 100;
          point[`${planet.planet}_retro`] = planet.retrograde;
          point[`${planet.planet}_sign`] = planet.sign;
          point[`${planet.planet}_deg`] = planet.degree;
          point[`${planet.planet}_min`] = planet.minute;

          const isRetro = planet.retrograde;
          const prevEntry = idx > 0 ? entries[idx - 1] : null;
          const prevPlanet = prevEntry?.planets.find(p => p.planet === planet.planet);
          const isTransition = prevPlanet && prevPlanet.retrograde !== isRetro;

          if (isRetro) {
            point[`${planet.planet}_retro_line`] = rounded;
            point[planet.planet] = isTransition ? rounded : undefined;
          } else {
            point[planet.planet] = rounded;
            point[`${planet.planet}_retro_line`] = isTransition ? rounded : undefined;
          }
        }
      }
      return point;
    });
  }, [entries, yAxisMode]);

  // Detect station points
  const stationPoints = useMemo(() => {
    const stations: StationPoint[] = [];
    for (let i = 1; i < entries.length; i++) {
      for (const planet of DISPLAY_PLANETS) {
        if (!visiblePlanets.has(planet)) continue;
        const prev = entries[i - 1].planets.find(p => p.planet === planet);
        const curr = entries[i].planets.find(p => p.planet === planet);
        if (!prev || !curr) continue;
        if (prev.retrograde !== curr.retrograde) {
          const value = yAxisMode === 'absolute' ? curr.longitude : curr.longitude % 30;
          stations.push({
            date: entries[i].date,
            label: new Date(entries[i].date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            planet,
            value: Math.round(value * 100) / 100,
            type: curr.retrograde ? 'SR' : 'SD',
            color: PLANET_COLORS[planet] || '#888',
          });
        }
      }
    }
    return stations;
  }, [entries, visiblePlanets, yAxisMode]);

  // Detect sign ingress points (absolute mode only)
  const ingressPoints = useMemo(() => {
    if (yAxisMode !== 'absolute') return [];
    const points: IngressPoint[] = [];
    for (let i = 1; i < entries.length; i++) {
      for (const planet of DISPLAY_PLANETS) {
        if (!visiblePlanets.has(planet)) continue;
        const prev = entries[i - 1].planets.find(p => p.planet === planet);
        const curr = entries[i].planets.find(p => p.planet === planet);
        if (!prev || !curr) continue;
        if (prev.sign !== curr.sign) {
          points.push({
            date: entries[i].date,
            label: new Date(entries[i].date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            planet,
            value: Math.round(curr.longitude * 100) / 100,
            sign: curr.sign,
            color: PLANET_COLORS[planet] || '#888',
          });
        }
      }
    }
    return points;
  }, [entries, visiblePlanets, yAxisMode]);

  const natalLines = useMemo(() => {
    if (!natalChart) return [];
    return Object.entries(natalChart.planets)
      .filter(([key]) => {
        const name = key.charAt(0).toUpperCase() + key.slice(1);
        return DISPLAY_PLANETS.includes(name) && visiblePlanets.has(name);
      })
      .map(([key, data]) => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: yAxisMode === 'absolute' ? data.longitude : data.longitude % 30,
        longitude: data.longitude,
        color: PLANET_COLORS[key.charAt(0).toUpperCase() + key.slice(1)] || '#888',
      }));
  }, [natalChart, yAxisMode, visiblePlanets]);

  // Compute aspect bands relative to natal positions (absolute mode only)
  const aspectBands = useMemo(() => {
    if (!showAspectBands || yAxisMode !== 'absolute' || natalLines.length === 0) return [];
    const ORB = 2; // degrees
    const bands: { y1: number; y2: number; color: string; key: string }[] = [];
    for (const natal of natalLines) {
      for (const aspect of MAJOR_ASPECTS) {
        // Both +angle and -angle directions (conjunction/opposition only produce one unique position each at 0 and 180)
        const positions = new Set<number>();
        positions.add((natal.longitude + aspect.angle) % 360);
        if (aspect.angle !== 0 && aspect.angle !== 180) {
          positions.add(((natal.longitude - aspect.angle) % 360 + 360) % 360);
        }
        for (const center of positions) {
          let y1 = center - ORB;
          let y2 = center + ORB;
          // Handle wrap-around at 0/360
          if (y1 < 0) {
            bands.push({ y1: 0, y2, color: aspect.color, key: `${natal.key}-${aspect.name}-${center}-a` });
            bands.push({ y1: 360 + y1, y2: 360, color: aspect.color, key: `${natal.key}-${aspect.name}-${center}-b` });
          } else if (y2 > 360) {
            bands.push({ y1, y2: 360, color: aspect.color, key: `${natal.key}-${aspect.name}-${center}-a` });
            bands.push({ y1: 0, y2: y2 - 360, color: aspect.color, key: `${natal.key}-${aspect.name}-${center}-b` });
          } else {
            bands.push({ y1, y2, color: aspect.color, key: `${natal.key}-${aspect.name}-${center}` });
          }
        }
      }
    }
    return bands;
  }, [showAspectBands, yAxisMode, natalLines]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Diamond shape for ingress markers
  const DiamondShape = (props: any) => {
    const { cx, cy, fill, stroke } = props;
    if (cx == null || cy == null) return null;
    const s = 5;
    return (
      <polygon
        points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
        fill={fill}
        stroke={stroke || 'white'}
        strokeWidth={1.5}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Graphic Ephemeris</h3>
        <p className="text-xs text-muted-foreground">Planetary motion over time &mdash; dashed lines show natal positions, dotted lines show retrograde</p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 p-3">
        {/* Time presets */}
        <div className="flex gap-1">
          {['1M', '3M', '6M', '1Y', '5Y'].map(preset => (
            <button
              key={preset}
              onClick={() => fetchData(preset)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePreset === preset && !isCustomRange && entries.length > 0
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background border hover:bg-muted/60'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Custom date range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs bg-background border w-[130px]"
          />
          <span className="text-xs text-muted-foreground">&ndash;</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs bg-background border w-[130px]"
          />
          <button
            onClick={fetchCustomRange}
            disabled={loading || !customStart || !customEnd}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isCustomRange && entries.length > 0
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-background border hover:bg-muted/60'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Go
          </button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Y-axis mode */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setYAxisMode('absolute')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              yAxisMode === 'absolute' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/60'
            }`}
          >
            0&ndash;360&deg;
          </button>
          <button
            onClick={() => setYAxisMode('perSign')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              yAxisMode === 'perSign' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/60'
            }`}
          >
            0&ndash;30&deg;
          </button>
        </div>

        {/* Aspect bands toggle (only when natal chart loaded & absolute mode) */}
        {natalChart && yAxisMode === 'absolute' && (
          <>
            <div className="w-px h-6 bg-border" />
            <button
              onClick={() => setShowAspectBands(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showAspectBands
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background border hover:bg-muted/60'
              }`}
            >
              Aspects
            </button>
          </>
        )}

        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Planet Filter Pills + Theme Quick Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {DISPLAY_PLANETS.map(planet => {
            const active = visiblePlanets.has(planet);
            return (
              <button
                key={planet}
                onClick={() => togglePlanet(planet)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'text-white shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
                }`}
                style={active ? { backgroundColor: PLANET_COLORS[planet] } : { borderColor: PLANET_COLORS[planet], borderWidth: 1 }}
              >
                <span className="text-sm">{PLANET_SYMBOLS[planet]}</span>
                <span>{planet}</span>
              </button>
            );
          })}
        </div>
        {/* Theme quick filters */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-muted-foreground mr-1">Quick:</span>
          <button
            onClick={showAllPlanets}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/40 text-muted-foreground hover:bg-muted/60 transition-all"
          >
            All
          </button>
          {Object.entries(LIFE_THEMES).map(([key, theme]) => {
            const Icon = theme.icon;
            return (
              <button
                key={key}
                onClick={() => selectTheme(key)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${theme.bgClass} ring-1 ${theme.ringClass} hover:opacity-80`}
              >
                <Icon className="w-2.5 h-2.5" style={{ color: theme.color }} />
                <span style={{ color: theme.color }}>{theme.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Initial loading skeleton */}
      {initialLoading && loading && (
        <div className="rounded-xl border bg-card/50 p-4">
          <Skeleton className="h-[700px] w-full" />
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="rounded-xl border bg-card/50 p-2">
          <ResponsiveContainer width="100%" height={720}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />

              {/* Sign background bands (absolute mode only) */}
              {yAxisMode === 'absolute' && ZODIAC_SIGNS.map((sign, i) => (
                <ReferenceArea
                  key={sign.name}
                  y1={i * 30}
                  y2={(i + 1) * 30}
                  fill={SIGN_BAND_COLORS[sign.element] || 'transparent'}
                  fillOpacity={1}
                />
              ))}

              {/* Aspect-to-natal bands (absolute mode only) */}
              {aspectBands.map(band => (
                <ReferenceArea
                  key={band.key}
                  y1={band.y1}
                  y2={band.y2}
                  fill={band.color}
                  fillOpacity={1}
                />
              ))}

              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                domain={yAxisMode === 'absolute' ? [0, 360] : [0, 30]}
                ticks={yAxisMode === 'absolute'
                  ? [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360]
                  : [0, 5, 10, 15, 20, 25, 30]
                }
                tick={(tickProps: any) => {
                  const { x, y, payload } = tickProps;
                  if (yAxisMode === 'absolute') {
                    const signIdx = Math.floor(payload.value / 30) % 12;
                    const sign = ZODIAC_SIGNS[signIdx];
                    const color = sign ? (ELEMENT_COLORS[sign.element] || 'hsl(var(--muted-foreground))') : 'hsl(var(--muted-foreground))';
                    return (
                      <text x={x} y={y} textAnchor="end" fontSize={10} fill={color} fontWeight={500} dy={3}>
                        {sign?.short || payload.value}
                      </text>
                    );
                  }
                  return (
                    <text x={x} y={y} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))" dy={3}>
                      {payload.value}&deg;
                    </text>
                  );
                }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload) return null;
                  const seen = new Set<string>();
                  const deduped = payload.filter((p: any) => {
                    const planet = p.name?.replace('_retro_line', '') || p.name;
                    if (seen.has(planet)) return false;
                    seen.add(planet);
                    return p.value != null;
                  });
                  if (deduped.length === 0) return null;
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border rounded-xl shadow-xl p-3 text-xs min-w-[200px]">
                      <div className="font-semibold mb-2 text-sm">{label}</div>
                      <div className="space-y-1.5">
                        {deduped.map((p: any) => {
                          const planet = p.name?.replace('_retro_line', '') || p.name;
                          // Find sign/degree from payload data
                          const dataPoint = p.payload;
                          const sign = dataPoint?.[`${planet}_sign`] || '';
                          const deg = dataPoint?.[`${planet}_deg`];
                          const min = dataPoint?.[`${planet}_min`];
                          const isRetro = dataPoint?.[`${planet}_retro`];
                          const signInfo = ZODIAC_SIGNS.find(s => s.name === sign);
                          const signSymbol = signInfo?.symbol || '';
                          const signColor = signInfo ? ELEMENT_COLORS[signInfo.element] : undefined;
                          return (
                            <div key={planet} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
                              <span className="font-medium" style={{ color: p.color }}>{PLANET_SYMBOLS[planet]} {planet}</span>
                              <span className="text-muted-foreground ml-auto tabular-nums">
                                {signSymbol && <span className="mr-0.5" style={signColor ? { color: signColor } : undefined}>{signSymbol}</span>}
                                {deg !== undefined ? `${deg}\u00B0${String(min ?? 0).padStart(2, '0')}'` : `${p.value?.toFixed(1)}\u00B0`}
                                {isRetro && <span style={{ color: '#E53935' }} className="font-bold ml-0.5">R</span>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />

              {/* Direct lines (solid) */}
              {DISPLAY_PLANETS.filter(p => visiblePlanets.has(p)).map(planet => (
                <Line
                  key={planet}
                  type="monotone"
                  dataKey={planet}
                  stroke={PLANET_COLORS[planet]}
                  strokeWidth={planet === 'Moon' ? 1 : 1.5}
                  dot={false}
                  connectNulls={false}
                  animationDuration={800}
                />
              ))}

              {/* Retrograde lines (dashed) */}
              {DISPLAY_PLANETS.filter(p => visiblePlanets.has(p)).map(planet => (
                <Line
                  key={`${planet}_retro`}
                  type="monotone"
                  dataKey={`${planet}_retro_line`}
                  stroke={PLANET_COLORS[planet]}
                  strokeWidth={planet === 'Moon' ? 1 : 1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls={false}
                  name={`${planet}_retro_line`}
                  animationDuration={800}
                />
              ))}

              {/* Station dots */}
              {stationPoints.map((sp, i) => (
                <ReferenceDot
                  key={`station-${i}`}
                  x={sp.label}
                  y={sp.value}
                  r={5}
                  fill={sp.type === 'SR' ? '#ef4444' : '#22c55e'}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}

              {/* Sign ingress markers (absolute mode only) */}
              {ingressPoints.map((ip, i) => (
                <ReferenceDot
                  key={`ingress-${i}`}
                  x={ip.label}
                  y={ip.value}
                  r={4}
                  fill={ip.color}
                  stroke="white"
                  strokeWidth={1.5}
                  shape={<DiamondShape fill={ip.color} />}
                />
              ))}

              {natalLines.map(line => (
                <ReferenceLine
                  key={`natal-${line.key}`}
                  y={line.value}
                  stroke={line.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{ value: `N.${line.name}`, fill: line.color, fontSize: 9 }}
                />
              ))}

              {entries.some(e => e.date === todayStr) && (
                <ReferenceLine
                  x={new Date(todayStr + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="2 2"
                  strokeOpacity={0.7}
                  label={{ value: 'Today', fill: 'hsl(var(--primary))', fontSize: 9 }}
                />
              )}

              {yAxisMode === 'absolute' && [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
                <ReferenceLine key={`sign-${deg}`} y={deg} stroke="currentColor" strokeOpacity={0.08} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        !loading && !initialLoading && (
          <div className="text-center py-16 rounded-xl border border-dashed bg-muted/10">
            <LineChartIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <div className="text-sm text-muted-foreground">Select a time range to view the graphic ephemeris</div>
            <div className="text-xs text-muted-foreground/60 mt-1">Visualize planetary motion and identify transit patterns</div>
          </div>
        )
      )}

      {/* Legend */}
      {chartData.length > 0 && (
        <div className="flex items-center gap-5 text-xs text-muted-foreground px-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0 border-t-2 border-muted-foreground" />
            <span>Direct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0 border-t-2 border-dashed border-muted-foreground" />
            <span>Retrograde</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
            <span>Station Retro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-green-500" />
            <span>Station Direct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0 border-t-2 border-dashed border-muted-foreground/50" />
            <span>Natal position</span>
          </div>
          {yAxisMode === 'absolute' && (
            <>
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <polygon points="5,0 10,5 5,10 0,5" fill="hsl(var(--muted-foreground))" />
                </svg>
                <span>Sign ingress</span>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <div className="flex gap-0.5">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(229,57,53,0.25)' }} title="Fire" />
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(67,160,71,0.25)' }} title="Earth" />
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(255,179,0,0.25)' }} title="Air" />
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(30,136,229,0.25)' }} title="Water" />
                </div>
                <span>Sign element bands</span>
              </div>
            </>
          )}
          {showAspectBands && yAxisMode === 'absolute' && (
            <div className="flex items-center gap-1.5 ml-2">
              <div className="flex gap-0.5">
                {MAJOR_ASPECTS.map(a => (
                  <div key={a.name} className="w-2 h-2 rounded-sm" style={{ backgroundColor: a.color.replace(/[\d.]+\)$/, '0.5)') }} title={a.name} />
                ))}
              </div>
              <span>Aspect bands</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
