/**
 * Essential Dignities Table
 * Shows dignity status for each planet in the natal chart
 */

import { PLANETS, PLANET_GROUPS, ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';
import { getEssentialDignity, type DignityInfo } from '@/lib/dignities';
import { Shield } from 'lucide-react';

interface NatalChart {
  planets: Record<string, any>;
  houses?: Record<string, number>;
  angles?: { ascendant: number; midheaven: number };
}

interface DignityTableProps {
  natalChart: NatalChart;
}

interface PlanetDignityRow {
  key: string;
  name: string;
  symbol: string;
  longitude: number;
  sign: string;
  signSymbol: string;
  degree: number;
  dignity: DignityInfo;
  house: number | null;
  retrograde: boolean;
}

const PLANET_ORDER = [
  ...PLANET_GROUPS.core,
  ...PLANET_GROUPS.outer,
  'chiron',
] as string[];

export function DignityTable({ natalChart }: DignityTableProps) {
  if (!natalChart?.planets || Object.keys(natalChart.planets).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Shield className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground/60">Calculate a chart first to see dignities</p>
      </div>
    );
  }

  const rows: PlanetDignityRow[] = [];
  let totalScore = 0;

  for (const key of PLANET_ORDER) {
    const planet = natalChart.planets[key];
    if (!planet || planet.longitude === undefined) continue;

    const info = PLANETS[key as keyof typeof PLANETS];
    if (!info) continue;

    const signIdx = Math.floor(((planet.longitude % 360 + 360) % 360) / 30);
    const sign = ZODIAC_SIGNS[signIdx];
    const dignity = getEssentialDignity(key, sign.name);
    const degree = Math.floor(planet.longitude % 30);

    totalScore += dignity.score;

    rows.push({
      key,
      name: info.name,
      symbol: info.symbol,
      longitude: planet.longitude,
      sign: sign.name,
      signSymbol: sign.symbol,
      degree,
      dignity,
      house: planet.house ?? null,
      retrograde: planet.retrograde ?? false,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Essential Dignities
        </h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          totalScore > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
          totalScore < 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
          'bg-gray-500/10 text-gray-600 dark:text-gray-400'
        }`}>
          Total: {totalScore > 0 ? '+' : ''}{totalScore}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground/60">
              <th className="text-left py-2 pr-3 font-medium">Planet</th>
              <th className="text-left py-2 px-3 font-medium">Sign</th>
              <th className="text-left py-2 px-3 font-medium">Dignity</th>
              <th className="text-center py-2 px-3 font-medium">Score</th>
              <th className="text-center py-2 px-3 font-medium">House</th>
              <th className="text-center py-2 pl-3 font-medium">Rx</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base" style={{ color: (PLANETS[row.key as keyof typeof PLANETS] as any)?.color }}>
                      {row.symbol}
                    </span>
                    <span className="text-xs text-muted-foreground">{row.name}</span>
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className="flex items-center gap-1">
                    <span className="text-sm">{row.signSymbol}</span>
                    <span className="text-xs text-muted-foreground">{row.sign}</span>
                    <span className="text-[10px] text-muted-foreground/50 font-mono ml-1">{row.degree}°</span>
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ring-1 ring-inset ${row.dignity.bgClass}`}>
                    {row.dignity.label}
                  </span>
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`text-xs font-medium ${
                    row.dignity.score > 0 ? 'text-green-600 dark:text-green-400' :
                    row.dignity.score < 0 ? 'text-red-600 dark:text-red-400' :
                    'text-muted-foreground/50'
                  }`}>
                    {row.dignity.score > 0 ? '+' : ''}{row.dignity.score}
                  </span>
                </td>
                <td className="py-2 px-3 text-center text-xs text-muted-foreground">
                  {row.house ?? '—'}
                </td>
                <td className="py-2 pl-3 text-center">
                  {row.retrograde ? (
                    <span className="text-xs text-amber-500" title="Retrograde">R</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/30">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
