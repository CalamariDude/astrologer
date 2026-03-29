/**
 * Planet Return Calculator
 * Saturn return, Jupiter return, Mars return, etc.
 * Uses the /planet-return API endpoint.
 */

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { swissEphemeris } from '@/api/swissEphemeris';
import type { NatalChart } from '@/components/biwheel/types';

interface PlanetReturnPanelProps {
  natalChart: NatalChart;
  birthInfo?: { date: string; time: string; lat: number; lng: number };
  personName: string;
}

const RETURN_PLANETS = [
  { key: 'saturn', name: 'Saturn', symbol: '\u2644', period: '~29.5 years', color: '#6B7280' },
  { key: 'jupiter', name: 'Jupiter', symbol: '\u2643', period: '~12 years', color: '#8B5CF6' },
  { key: 'mars', name: 'Mars', symbol: '\u2642', period: '~2 years', color: '#EF4444' },
  { key: 'venus', name: 'Venus', symbol: '\u2640', period: '~1 year', color: '#EC4899' },
  { key: 'mercury', name: 'Mercury', symbol: '\u263F', period: '~1 year', color: '#F59E0B' },
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640', Mars: '\u2642',
  Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646', Pluto: '\u2647',
  NorthNode: '\u260A', Chiron: '\u26B7',
};

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B',
  Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

interface ReturnResult {
  planet: string;
  returnDate: string;
  returnTime: string;
  ascendantSign: string;
  planets: { planet: string; longitude: number; sign: string; degree: number; minute: number; retrograde: boolean; house?: number }[];
  aspects: { planet1: string; planet2: string; aspect: string; angle: number; orb: number }[];
}

export function PlanetReturnPanel({ natalChart, birthInfo, personName }: PlanetReturnPanelProps) {
  const [selectedPlanet, setSelectedPlanet] = useState('saturn');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReturnResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateReturn = useCallback(async () => {
    if (!birthInfo) return;

    setLoading(true);
    setError(null);
    try {
      // Build natal_chart in API format
      const natalPlanets = Object.entries(natalChart.planets).map(([key, data]) => ({
        planet: key.charAt(0).toUpperCase() + key.slice(1),
        longitude: data.longitude,
        sign: data.sign || '',
        degree: data.degree ?? 0,
        minute: data.minute ?? 0,
        retrograde: data.retrograde ?? false,
      }));

      const data = await swissEphemeris.planetReturn({
        natal_chart: { planets: natalPlanets },
        planet: selectedPlanet,
        start_date: startDate,
        lat: birthInfo.lat,
        lng: birthInfo.lng,
      });

      setResult({
        planet: data.planet,
        returnDate: data.return_date,
        returnTime: data.return_time,
        ascendantSign: data.ascendantSign,
        planets: data.planets || [],
        aspects: data.aspects || [],
      });
    } catch (err: any) {
      console.error('Planet return calculation failed:', err);
      setError(err.message || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  }, [natalChart, birthInfo, selectedPlanet, startDate]);

  const planetDef = RETURN_PLANETS.find(p => p.key === selectedPlanet)!;

  if (!birthInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground/60">Birth location required for planet return calculations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold">{personName}'s Planet Returns</h3>
        <p className="text-xs text-muted-foreground">
          Calculate when a planet returns to its natal position
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/20 p-3">
        {/* Planet selector */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Planet</label>
          <div className="flex gap-1">
            {RETURN_PLANETS.map(p => (
              <button
                key={p.key}
                onClick={() => { setSelectedPlanet(p.key); setResult(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPlanet === p.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background border hover:bg-muted/60'
                }`}
                title={`${p.name} Return (${p.period})`}
              >
                <span className="text-sm mr-1">{p.symbol}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Start date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Search from</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs border bg-background"
          />
        </div>

        {/* Calculate button */}
        <button
          onClick={calculateReturn}
          disabled={loading}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
          Calculate
        </button>
      </div>

      {error && (
        <div className="text-sm text-destructive text-center py-4 rounded-xl border border-destructive/20 bg-destructive/5">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Return date card */}
          <div className="rounded-xl border-2 p-4" style={{ borderColor: planetDef.color + '40' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl" style={{ color: planetDef.color }}>{planetDef.symbol}</span>
              <div>
                <h4 className="text-lg font-bold">{result.planet} Return</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(result.returnDate + 'T12:00:00').toLocaleDateString('en', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                  {' at '}{result.returnTime}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                ASC {SIGN_SYMBOLS[result.ascendantSign] || ''} {result.ascendantSign}
              </Badge>
            </div>
          </div>

          {/* Planet positions */}
          <div className="rounded-xl border bg-card/50 p-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Return Chart Positions
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {result.planets.slice(0, 12).map(p => (
                <div key={p.planet} className="flex items-center gap-2 text-sm p-1.5 rounded-lg hover:bg-muted/40">
                  <span className="text-base">{PLANET_SYMBOLS[p.planet] || p.planet[0]}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-xs">{p.planet}</div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      {SIGN_SYMBOLS[p.sign] || ''} {p.degree}°{String(p.minute).padStart(2, '0')}' {p.sign}
                      {p.retrograde ? ' Rx' : ''}
                    </div>
                  </div>
                  {p.house && (
                    <span className="text-[10px] text-muted-foreground ml-auto">H{p.house}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Aspects */}
          {result.aspects.length > 0 && (
            <div className="rounded-xl border bg-card/50 p-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Return Chart Aspects ({result.aspects.length})
              </h4>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {result.aspects.slice(0, 20).map((asp, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-muted/40">
                    <span>{PLANET_SYMBOLS[asp.planet1] || asp.planet1[0]}</span>
                    <span className="font-medium text-muted-foreground">{asp.aspect}</span>
                    <span>{PLANET_SYMBOLS[asp.planet2] || asp.planet2[0]}</span>
                    <span className="ml-auto text-muted-foreground tabular-nums">{asp.orb.toFixed(1)}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PlanetReturnPanel;
