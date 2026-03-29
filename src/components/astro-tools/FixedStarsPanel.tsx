/**
 * Fixed Stars Panel
 * Shows ~40 astrologically important fixed stars with their positions,
 * house placements, and conjunction aspects to natal planets (1° orb).
 */

import { useState, useEffect, useMemo } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { swissEphemeris } from '@/api/swissEphemeris';
import { ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';

interface NatalChart {
  planets: Record<string, any>;
  houses?: Record<string, number>;
  angles?: { ascendant: number; midheaven: number };
}

interface FixedStarsPanelProps {
  natalChart: NatalChart;
  birthInfo: { date: string; time: string; lat: number; lng: number };
}

interface FixedStarRow {
  name: string;
  longitude: number;
  sign: string;
  degree: number;
  minute: number;
  house?: number;
  magnitude?: number;
  traditional_meaning?: string;
  conjunctPlanet?: string;
  conjunctOrb?: number;
}

function getSignSymbol(sign: string): string {
  const z = ZODIAC_SIGNS.find(s => s.name === sign);
  return z?.symbol || sign.slice(0, 3);
}

export function FixedStarsPanel({ natalChart, birthInfo }: FixedStarsPanelProps) {
  const [stars, setStars] = useState<FixedStarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!birthInfo.date || !birthInfo.lat) return;
    setLoading(true);
    setError(null);

    swissEphemeris.natal({
      birth_date: birthInfo.date,
      birth_time: birthInfo.time || '12:00',
      lat: birthInfo.lat,
      lng: birthInfo.lng,
      fixed_stars: true,
    }).then((data: any) => {
      const fixedStars: FixedStarRow[] = (data.fixed_stars || []).map((s: any) => ({
        name: s.planet || s.name,
        longitude: s.longitude,
        sign: s.sign,
        degree: s.degree,
        minute: s.minute,
        house: s.house,
        magnitude: s.magnitude,
        traditional_meaning: s.traditional_meaning,
      }));

      // Map conjunction aspects to their stars
      const aspects = data.fixed_star_aspects || [];
      for (const aspect of aspects) {
        const star = fixedStars.find(s => s.name === aspect.planet1);
        if (star && (!star.conjunctOrb || aspect.orb < star.conjunctOrb)) {
          star.conjunctPlanet = aspect.planet2;
          star.conjunctOrb = aspect.orb;
        }
      }

      setStars(fixedStars);
    }).catch((err: any) => {
      setError(err.message || 'Failed to load fixed stars');
    }).finally(() => {
      setLoading(false);
    });
  }, [birthInfo.date, birthInfo.time, birthInfo.lat, birthInfo.lng]);

  // Sort: conjunctions first (by tightest orb), then by ecliptic longitude
  const sortedStars = useMemo(() => {
    return [...stars].sort((a, b) => {
      if (a.conjunctPlanet && !b.conjunctPlanet) return -1;
      if (!a.conjunctPlanet && b.conjunctPlanet) return 1;
      if (a.conjunctPlanet && b.conjunctPlanet) return (a.conjunctOrb || 0) - (b.conjunctOrb || 0);
      return a.longitude - b.longitude;
    });
  }, [stars]);

  if (!natalChart?.planets || Object.keys(natalChart.planets).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Star className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground/60">Calculate a chart first to see fixed stars</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 p-2">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading fixed stars...</span>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Star className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const conjunctionCount = sortedStars.filter(s => s.conjunctPlanet).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 px-1">
        <Badge variant="outline" className="text-[10px]">
          {sortedStars.length} stars
        </Badge>
        {conjunctionCount > 0 && (
          <Badge className="text-[10px] bg-amber-500/15 text-amber-500 border-amber-500/30">
            {conjunctionCount} conjunct natal planet{conjunctionCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left py-2 px-2 font-medium">Star</th>
              <th className="text-left py-2 px-2 font-medium">Position</th>
              <th className="text-center py-2 px-2 font-medium">House</th>
              <th className="text-center py-2 px-2 font-medium">Mag</th>
              <th className="text-left py-2 px-2 font-medium">Conjunct</th>
            </tr>
          </thead>
          <tbody>
            {sortedStars.map((star) => {
              const hasConjunction = !!star.conjunctPlanet;
              return (
                <tr
                  key={star.name}
                  className={`border-b border-border/20 transition-colors ${
                    hasConjunction ? 'bg-amber-500/[0.04]' : 'hover:bg-muted/30'
                  }`}
                  title={star.traditional_meaning}
                >
                  <td className="py-2.5 px-2">
                    <div className="flex flex-col">
                      <span className={`font-medium ${hasConjunction ? 'text-amber-400' : ''}`}>
                        {star.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 max-w-[200px] truncate">
                        {star.traditional_meaning}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 font-mono text-xs">
                    <span className="mr-1">{getSignSymbol(star.sign)}</span>
                    {star.degree}&deg;{String(star.minute).padStart(2, '0')}&prime;
                  </td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground">
                    {star.house || '-'}
                  </td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground font-mono text-xs">
                    {star.magnitude != null ? star.magnitude.toFixed(1) : '-'}
                  </td>
                  <td className="py-2.5 px-2">
                    {hasConjunction ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-medium">{star.conjunctPlanet}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {star.conjunctOrb?.toFixed(2)}&deg;
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
