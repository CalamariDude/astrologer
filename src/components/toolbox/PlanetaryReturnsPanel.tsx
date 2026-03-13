/**
 * Planetary Returns Panel
 * Calculates return charts for any planet (Sun=Solar, Moon=Lunar, Jupiter, Saturn, etc.)
 * using the Swiss Ephemeris /planet-return endpoint.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { swissEphemeris } from '@/api/swissEphemeris';
import { ToolGuide } from './ToolGuide';

/* ── Types ── */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean }>;
    houses?: { cusps?: number[]; ascendant?: number; mc?: number };
  };
  birthDate: string;
  name?: string;
  lat: number;
  lng: number;
}

interface ReturnChartResult {
  returnDate: string;
  returnTime: string;
  ascendant: number;
  ascendantSign: string;
  mc: number;
  mcSign: string;
  planets: {
    planet: string;
    longitude: number;
    sign: string;
    degree: number;
    minute: number;
    retrograde: boolean;
    house?: number;
  }[];
  aspects: {
    planet1: string;
    planet2: string;
    aspect: string;
    angle: number;
    orb: number;
  }[];
}

/* ── Constants ── */

const RETURN_PLANETS = [
  { key: 'Sun', label: 'Solar', symbol: '\u2609\uFE0E', color: '#FFD700', hint: 'Annual cycle of identity & purpose' },
  { key: 'Moon', label: 'Lunar', symbol: '\u263D\uFE0E', color: '#C0C0C0', hint: 'Monthly emotional reset' },
  { key: 'Mercury', label: 'Mercury', symbol: '\u263F\uFE0E', color: '#00CED1', hint: 'Communication & mental shifts' },
  { key: 'Venus', label: 'Venus', symbol: '\u2640\uFE0E', color: '#FF69B4', hint: 'Relationships & values renewal' },
  { key: 'Mars', label: 'Mars', symbol: '\u2642\uFE0E', color: '#FF4500', hint: 'Drive & energy cycle (~2 years)' },
  { key: 'Jupiter', label: 'Jupiter', symbol: '\u2643\uFE0E', color: '#9370DB', hint: 'Growth & expansion (~12 years)' },
  { key: 'Saturn', label: 'Saturn', symbol: '\u2644\uFE0E', color: '#8B4513', hint: 'Maturity & structure (~29.5 years)' },
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609\uFE0E', Moon: '\u263D\uFE0E', Mercury: '\u263F\uFE0E', Venus: '\u2640\uFE0E', Mars: '\u2642\uFE0E',
  Jupiter: '\u2643\uFE0E', Saturn: '\u2644\uFE0E', Uranus: '\u26E2\uFE0E', Neptune: '\u2646\uFE0E', Pluto: '\u2647\uFE0E',
  NorthNode: '\u260A\uFE0E', Chiron: '\u26B7\uFE0E',
};

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const SIGNS_LIST = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const PLANETS_ORDER = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','NorthNode','Chiron'];

/* ── Helpers ── */

function signFromLongitude(lng: number): string {
  return SIGNS_LIST[Math.floor(((lng % 360) + 360) % 360 / 30)];
}

function formatDegree(longitude: number): string {
  const norm = ((longitude % 360) + 360) % 360;
  const deg = Math.floor(norm % 30);
  const min = Math.floor((norm % 1) * 60);
  const sign = SIGNS_LIST[Math.floor(norm / 30)];
  return `${deg}\u00B0${String(min).padStart(2, '0')}' ${sign}`;
}

/** Interpretation hint based on return ASC sign & planet house */
function getReturnHint(ascSign: string, planetKey: string, planetHouse?: number): string {
  const ascElement = (() => {
    const fire = ['Aries','Leo','Sagittarius'];
    const earth = ['Taurus','Virgo','Capricorn'];
    const air = ['Gemini','Libra','Aquarius'];
    if (fire.includes(ascSign)) return 'fire';
    if (earth.includes(ascSign)) return 'earth';
    if (air.includes(ascSign)) return 'air';
    return 'water';
  })();

  const elementMeaning: Record<string, string> = {
    fire: 'dynamic action, initiative, and self-expression',
    earth: 'practical results, material focus, and stability',
    air: 'communication, social connections, and ideas',
    water: 'emotional depth, intuition, and inner work',
  };

  const houseMeaning: Record<number, string> = {
    1: 'personal identity & new beginnings',
    2: 'finances, values & self-worth',
    3: 'communication, learning & siblings',
    4: 'home, family & foundations',
    5: 'creativity, romance & self-expression',
    6: 'health, work routines & service',
    7: 'partnerships & one-on-one relationships',
    8: 'transformation, shared resources & depth',
    9: 'travel, higher learning & philosophy',
    10: 'career, public image & ambitions',
    11: 'friends, groups & future visions',
    12: 'solitude, spirituality & hidden matters',
  };

  let hint = `Return ASC in ${ascSign} (${SIGN_SYMBOLS[ascSign] || ''}) emphasizes ${elementMeaning[ascElement]}.`;
  if (planetHouse && houseMeaning[planetHouse]) {
    hint += ` ${planetKey} in house ${planetHouse} directs this cycle's energy toward ${houseMeaning[planetHouse]}.`;
  }
  return hint;
}

/* ── Component ── */

export function PlanetaryReturnsPanel({ natalChart, birthDate, name, lat, lng }: Props) {
  const currentYear = new Date().getFullYear();
  const [selectedPlanet, setSelectedPlanet] = useState('Sun');
  const [targetYear, setTargetYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnChartResult | null>(null);

  const planetDef = RETURN_PLANETS.find(p => p.key === selectedPlanet)!;

  // Build year options: birth year through current + 5
  const birthYear = birthDate ? parseInt(birthDate.split('-')[0], 10) : currentYear - 30;
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = Math.max(birthYear, currentYear - 5); y <= currentYear + 5; y++) {
      years.push(y);
    }
    return years;
  }, [birthYear, currentYear]);

  const calculateReturn = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Build natal planets array for the API
      const natalPlanets = Object.entries(natalChart.planets).map(([key, data]) => ({
        planet: key.charAt(0).toUpperCase() + key.slice(1),
        longitude: data.longitude,
        sign: data.sign || '',
        degree: Math.floor(data.longitude % 30),
        minute: Math.floor((data.longitude % 1) * 60),
        retrograde: data.retrograde ?? false,
      }));

      const data = await swissEphemeris.planetReturn({
        natal_chart: { planets: natalPlanets },
        planet: selectedPlanet.toLowerCase(),
        start_date: `${targetYear}-01-01`,
        year: targetYear,
        date: birthDate,
        lat,
        lng,
      });

      // Normalize response
      const ascLng = data.houses?.ascendant ?? data.ascendant ?? 0;
      const mcLng = data.houses?.mc ?? data.mc ?? 0;

      setResult({
        returnDate: data.return_date || data.returnDate || '',
        returnTime: data.return_time || data.returnTime || '',
        ascendant: ascLng,
        ascendantSign: data.ascendantSign || signFromLongitude(ascLng),
        mc: mcLng,
        mcSign: data.mcSign || signFromLongitude(mcLng),
        planets: (data.planets || []).map((p: any) => ({
          planet: p.planet || p.name,
          longitude: p.longitude,
          sign: p.sign || signFromLongitude(p.longitude),
          degree: p.degree ?? Math.floor(p.longitude % 30),
          minute: p.minute ?? Math.floor((p.longitude % 1) * 60),
          retrograde: p.retrograde ?? false,
          house: p.house,
        })),
        aspects: (data.aspects || []).map((a: any) => ({
          planet1: a.planet1,
          planet2: a.planet2,
          aspect: a.aspect || a.type,
          angle: a.angle ?? 0,
          orb: a.orb ?? 0,
        })),
      });
    } catch (err: any) {
      console.error('Planet return calculation failed:', err);
      setError(err.message || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  }, [natalChart, selectedPlanet, targetYear, birthDate, lat, lng]);

  // Find the return planet in results to get its house
  const returnPlanetData = result?.planets.find(
    p => p.planet.toLowerCase() === selectedPlanet.toLowerCase()
  );

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Title */}
      <div>
        <h3 className="text-sm font-semibold">Planetary Returns</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Calculate return charts for any planet</p>
      </div>

      <ToolGuide
        title="Planetary Returns"
        description="A planetary return occurs when a transiting planet returns to its exact natal position — completing one full orbit. The chart cast for that moment (the return chart) sets the themes for the next cycle. Solar returns (yearly) and lunar returns (monthly) are the most commonly used."
        tips={[
          "Solar Return: cast yearly on your birthday — sets themes for the coming year",
          "Lunar Return: cast monthly when the Moon returns — sets the emotional tone for ~28 days",
          "Saturn Return (~29 years): major life restructuring — career, maturity, responsibility",
          "Jupiter Return (~12 years): expansion, opportunity, new growth cycle",
          "The return chart's Ascendant and house placements show WHERE the themes play out",
          "Look for planets near angles in the return chart — they dominate that cycle",
        ]}
      />

      {/* Info */}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
        <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-1">
          About
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          Calculate when a planet returns to its natal position{name ? ` for ${name}` : ''}.
          A return chart reveals the themes of that planet's new cycle.
        </div>
      </div>

      {/* Planet selector */}
      <div className="rounded-lg border border-border/50 bg-muted/10 p-3 space-y-3">
        <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
          Select Planet
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RETURN_PLANETS.map(p => (
            <button
              key={p.key}
              onClick={() => { setSelectedPlanet(p.key); setResult(null); }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                selectedPlanet === p.key
                  ? 'bg-muted/30 border border-border text-foreground shadow-sm'
                  : 'bg-muted/10 border border-border/50 text-muted-foreground hover:bg-muted/20 hover:text-foreground/70'
              }`}
              title={p.hint}
            >
              <span className="mr-1" style={{ color: p.color }}>{p.symbol}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Year selector + Calculate */}
        <div className="flex items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground/60 mb-1 block">Return Year</label>
            <select
              value={targetYear}
              onChange={e => setTargetYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg text-[11px] border border-border/50 bg-muted/10 text-foreground appearance-none cursor-pointer"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={calculateReturn}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-[11px] font-semibold bg-muted/30 border border-border/60 text-foreground hover:bg-muted/55 transition-all disabled:opacity-40"
          >
            {loading && (
              <span className="inline-block w-3 h-3 border-2 border-border/60 border-t-foreground/60 rounded-full animate-spin mr-1.5 align-middle" />
            )}
            Calculate
          </button>
        </div>

        <div className="text-[11px] text-muted-foreground/70">{planetDef.hint}</div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-[11px] text-muted-foreground/60">
          <span className="inline-block w-4 h-4 border-2 border-border/60 border-t-foreground/60 rounded-full animate-spin mr-2" />
          Calculating {planetDef.label} return...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-[11px] text-red-400 text-center py-4 rounded-lg border border-red-500/20 bg-red-500/5">
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="flex flex-col gap-3">
          {/* Return date card */}
          <div className="rounded-lg border-2 p-3" style={{ borderColor: planetDef.color + '40' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl" style={{ color: planetDef.color }}>{planetDef.symbol}</span>
              <div>
                <h4 className="text-sm font-bold text-foreground">{planetDef.label} Return {targetYear}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {result.returnDate && new Date(result.returnDate + 'T12:00:00').toLocaleDateString('en', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                  {result.returnTime ? ` at ${result.returnTime}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* ASC / MC */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/50 bg-muted/10 p-2 text-center">
              <div className="text-[11px] text-muted-foreground/60 uppercase">Return ASC</div>
              <div className="text-sm font-semibold text-amber-300">
                {SIGN_SYMBOLS[result.ascendantSign] || ''} {result.ascendantSign}
              </div>
              <div className="text-xs text-muted-foreground/60 font-mono">{formatDegree(result.ascendant)}</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/10 p-2 text-center">
              <div className="text-[11px] text-muted-foreground/60 uppercase">Return MC</div>
              <div className="text-sm font-semibold text-cyan-300">
                {SIGN_SYMBOLS[result.mcSign] || ''} {result.mcSign}
              </div>
              <div className="text-xs text-muted-foreground/60 font-mono">{formatDegree(result.mc)}</div>
            </div>
          </div>

          {/* Interpretation hint */}
          <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-2">
            <div className="text-xs text-indigo-300/70 font-medium uppercase tracking-wider mb-1">
              Interpretation
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              {getReturnHint(result.ascendantSign, planetDef.label, returnPlanetData?.house)}
            </div>
          </div>

          {/* Planet positions table */}
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider px-2 py-1.5 bg-muted/10">
              Return Chart Positions
            </div>
            <table className="w-full text-[11px]">
              <thead className="bg-muted/10">
                <tr className="text-muted-foreground/60">
                  <th className="py-1 px-2 text-left font-medium">Planet</th>
                  <th className="py-1 px-2 text-left font-medium">Sign</th>
                  <th className="py-1 px-2 text-left font-medium">Degree</th>
                  <th className="py-1 px-2 text-center font-medium">House</th>
                  <th className="py-1 px-2 text-center font-medium">Rx</th>
                </tr>
              </thead>
              <tbody>
                {result.planets
                  .sort((a, b) => {
                    const ia = PLANETS_ORDER.indexOf(a.planet);
                    const ib = PLANETS_ORDER.indexOf(b.planet);
                    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                  })
                  .map(p => (
                    <tr
                      key={p.planet}
                      className={`border-t border-border/30 hover:bg-muted/10 transition-colors ${
                        p.planet.toLowerCase() === selectedPlanet.toLowerCase() ? 'bg-muted/10' : ''
                      }`}
                    >
                      <td className="py-1 px-2">
                        <span className="text-muted-foreground mr-1">{PLANET_SYMBOLS[p.planet] || ''}</span>
                        <span className={p.planet.toLowerCase() === selectedPlanet.toLowerCase() ? 'text-foreground font-semibold' : 'text-foreground/80'}>
                          {p.planet}
                        </span>
                      </td>
                      <td className="py-1 px-2 text-foreground/70">
                        {SIGN_SYMBOLS[p.sign] || ''} {p.sign}
                      </td>
                      <td className="py-1 px-2 font-mono text-muted-foreground">
                        {p.degree}°{String(p.minute).padStart(2, '0')}'
                      </td>
                      <td className="py-1 px-2 text-center text-muted-foreground">
                        {p.house || '\u2014'}
                      </td>
                      <td className="py-1 px-2 text-center">
                        {p.retrograde ? (
                          <span className="text-red-400 font-semibold">R</span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Aspects */}
          {result.aspects.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5">
                Return Chart Aspects ({result.aspects.length})
              </div>
              <div className="rounded-lg border border-border/50 overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/10 sticky top-0">
                    <tr className="text-muted-foreground/60">
                      <th className="py-1 px-2 text-left font-medium">Planet</th>
                      <th className="py-1 px-2 text-center font-medium">Aspect</th>
                      <th className="py-1 px-2 text-left font-medium">Planet</th>
                      <th className="py-1 px-2 text-right font-medium">Orb</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.aspects.map((asp, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="py-1 px-2 text-foreground/70">
                          {PLANET_SYMBOLS[asp.planet1] || ''} {asp.planet1}
                        </td>
                        <td className="py-1 px-2 text-center text-muted-foreground">
                          {asp.aspect}
                        </td>
                        <td className="py-1 px-2 text-foreground/70">
                          {PLANET_SYMBOLS[asp.planet2] || ''} {asp.planet2}
                        </td>
                        <td className="py-1 px-2 text-right font-mono text-muted-foreground/60">
                          {asp.orb.toFixed(1)}°
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
