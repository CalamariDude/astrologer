/**
 * Solar Return Panel
 * Shows the solar return chart wheel + data for a given year with year navigation.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { swissEphemeris } from '@/api/swissEphemeris';
import { ZODIAC_SIGNS, PLANETS } from '@/components/biwheel/utils/constants';

const BiWheelSynastry = React.lazy(() => import('@/components/biwheel/BiWheelSynastry'));

interface NatalChart {
  planets: Record<string, any>;
  houses?: Record<string, number>;
  angles?: { ascendant: number; midheaven: number };
}

interface SolarReturnPanelProps {
  natalChart: NatalChart;
  birthInfo: { date: string; time: string; lat: number; lng: number };
  personName: string;
}

const ZODIAC_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

/** Convert API planets array + houses into a NatalChart object for BiWheelSynastry */
function parseReturnChart(data: any): NatalChart {
  const planets: Record<string, any> = {};
  if (data.planets && Array.isArray(data.planets)) {
    for (const p of data.planets) {
      let key = (p.name || p.planet || '').toLowerCase();
      if (key === 'north node' || key === 'true_node' || key === 'mean_node') key = 'northnode';
      if (key === 'south node') key = 'southnode';
      if (!key) continue;
      planets[key] = {
        longitude: p.longitude ?? 0,
        latitude: p.latitude ?? undefined,
        sign: p.sign || ZODIAC_NAMES[Math.floor((p.longitude ?? 0) / 30)] || '',
        degree: p.degree ?? undefined,
        minute: p.minute ?? undefined,
        retrograde: p.retrograde ?? false,
      };
    }
  }
  const houses: Record<string, number> = {};
  if (data.houses?.cusps) {
    data.houses.cusps.forEach((cusp: number, i: number) => { houses[`house_${i + 1}`] = cusp; });
  }
  let angles: { ascendant: number; midheaven: number } | undefined;
  if (data.houses?.ascendant !== undefined) {
    angles = { ascendant: data.houses.ascendant, midheaven: data.houses.mc ?? 0 };
  }
  return { planets, houses, angles };
}

function getSignSymbol(sign: string): string {
  const z = ZODIAC_SIGNS.find(s => s.name === sign);
  return z?.symbol || sign.slice(0, 3);
}

function getPlanetSymbol(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, '');
  const p = PLANETS[key as keyof typeof PLANETS];
  return p?.symbol || name;
}

function formatReturnDate(dateStr: string, timeStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const [hh, mm] = timeStr.split(':').map(Number);
    const period = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${formatted} at ${h12}:${String(mm).padStart(2, '0')} ${period}`;
  } catch {
    return `${dateStr} at ${timeStr}`;
  }
}

const PROFECTION_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];
const PROFECTION_RULERS: Record<string, string> = {
  'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
  'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
  'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter',
};

export function SolarReturnPanel({ natalChart, birthInfo, personName }: SolarReturnPanelProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const natalPlanetsArray = useCallback(() => {
    if (!natalChart?.planets) return [];
    return Object.entries(natalChart.planets).map(([key, val]) => ({
      planet: key.charAt(0).toUpperCase() + key.slice(1),
      longitude: val.longitude ?? 0,
      latitude: val.latitude ?? 0,
      sign: val.sign ?? '',
      degree: val.degree ?? 0,
      minute: val.minute ?? 0,
      retrograde: val.retrograde ?? false,
    }));
  }, [natalChart]);

  useEffect(() => {
    if (!natalChart?.planets || Object.keys(natalChart.planets).length === 0) return;
    const planets = natalPlanetsArray();
    if (planets.length === 0) return;

    setLoading(true);
    setError(null);

    swissEphemeris.solarReturn({
      natal_chart: { planets },
      year,
      lat: birthInfo.lat,
      lng: birthInfo.lng,
    }).then((result: any) => {
      setRawData(result);
    }).catch((err: any) => {
      setError(err.message || 'Failed to calculate solar return');
    }).finally(() => {
      setLoading(false);
    });
  }, [year, natalChart, birthInfo.lat, birthInfo.lng, natalPlanetsArray]);

  // Parse the return data into a NatalChart for the wheel
  const returnChart = useMemo(() => rawData ? parseReturnChart(rawData) : null, [rawData]);

  if (!natalChart?.planets || Object.keys(natalChart.planets).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Sun className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground/60">Calculate a chart first to see the solar return</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setYear(y => y - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-lg font-semibold tabular-nums">{year} Solar Return</span>
        <Button variant="ghost" size="sm" onClick={() => setYear(y => y + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="w-full aspect-square max-w-[500px] mx-auto rounded-full" />
          <Skeleton className="w-3/4 h-5 rounded mx-auto" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : rawData && returnChart ? (
        <div className="space-y-4">
          {/* Header info */}
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 p-4">
            <p className="text-sm text-muted-foreground mb-1">
              {personName ? `${personName}'s ` : ''}{year} Solar Return
            </p>
            <p className="text-base font-medium">
              {formatReturnDate(rawData.return_date, rawData.return_time)}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {getSignSymbol(rawData.ascendantSign)} {rawData.ascendantSign} Rising
              </Badge>
              {(() => {
                const birthYear = parseInt(birthInfo.date.split('-')[0], 10);
                const age = year - birthYear;
                if (age < 0 || isNaN(age)) return null;
                // Annual profection: Asc sign + (age mod 12) signs forward
                const ascSign = natalChart.angles?.ascendant;
                if (ascSign === undefined) return null;
                const ascSignIndex = Math.floor(ascSign / 30);
                const profectionIndex = (ascSignIndex + (age % 12)) % 12;
                const profectionSign = PROFECTION_SIGNS[profectionIndex];
                const lord = PROFECTION_RULERS[profectionSign];
                return (
                  <>
                    <Badge variant="outline" className="text-xs">
                      Age {age}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-400">
                      {getSignSymbol(profectionSign)} {profectionSign} Profection · Lord: {lord}
                    </Badge>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Biwheel: natal (inner) + solar return (outer) */}
          <div className="flex justify-center">
            <div className="w-full max-w-[500px]">
              <React.Suspense fallback={
                <Skeleton className="w-full aspect-square rounded-full" />
              }>
                <BiWheelSynastry
                  chartA={natalChart}
                  chartB={returnChart}
                  nameA={personName || 'Natal'}
                  nameB={`${year} Solar Return`}
                  initialChartMode={'synastry' as any}
                  showTogglePanel={false}
                  hideZoomControls={true}
                />
              </React.Suspense>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Inner wheel: natal · Outer wheel: {year} solar return
          </p>

          {/* Planet Positions Table */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 py-2 hover:text-foreground transition-colors">
              Planet Positions ({rawData.planets?.length || 0})
            </summary>
            <div className="overflow-x-auto mt-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left py-2 px-2 font-medium">Planet</th>
                    <th className="text-left py-2 px-2 font-medium">Sign</th>
                    <th className="text-left py-2 px-2 font-medium">Degree</th>
                    <th className="text-center py-2 px-2 font-medium">House</th>
                  </tr>
                </thead>
                <tbody>
                  {(rawData.planets || []).map((p: any) => (
                    <tr key={p.planet} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-2 font-medium">
                        <span className="mr-1.5 text-base">{getPlanetSymbol(p.planet)}</span>
                        {p.planet}
                        {p.retrograde && <span className="text-[10px] text-muted-foreground ml-1">R</span>}
                      </td>
                      <td className="py-2 px-2">
                        <span className="mr-1">{getSignSymbol(p.sign)}</span>
                        {p.sign}
                      </td>
                      <td className="py-2 px-2 font-mono text-xs">
                        {p.degree}&deg;{String(p.minute).padStart(2, '0')}&prime;
                      </td>
                      <td className="py-2 px-2 text-center text-muted-foreground">
                        {p.house || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* Key Aspects */}
          {rawData.aspects?.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 py-2 hover:text-foreground transition-colors">
                Aspects ({rawData.aspects.length})
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {rawData.aspects.slice(0, 30).map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors text-sm">
                    <span className="font-medium min-w-0 truncate">{a.planet1}</span>
                    <span className="text-muted-foreground text-xs shrink-0">{a.aspect}</span>
                    <span className="font-medium min-w-0 truncate">{a.planet2}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{a.orb?.toFixed(1)}&deg;</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      ) : null}
    </div>
  );
}
