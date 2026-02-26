/**
 * Declination Panel
 * Shows declination values for all planets and parallel/contra-parallel aspects
 */

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { PLANETS } from '@/components/biwheel/utils/constants';
import type { NatalChart } from '@/components/biwheel/types';
import { calculateDeclinations, detectDeclinationAspects, type DeclinationData, type DeclinationAspect } from '@/lib/declination';

interface DeclinationPanelProps {
  chartA: NatalChart;
  chartB?: NatalChart;
  nameA: string;
  nameB?: string;
}

const PLANET_SYMBOLS: Record<string, string> = {};
Object.entries(PLANETS).forEach(([key, val]) => { PLANET_SYMBOLS[key] = val.symbol; });

function formatDec(dec: number): string {
  const sign = dec >= 0 ? 'N' : 'S';
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const min = Math.round((abs - deg) * 60);
  return `${deg}\u00B0${min.toString().padStart(2, '0')}'${sign}`;
}

function planetLabel(key: string): string {
  const info = PLANETS[key as keyof typeof PLANETS];
  return info?.name || key.charAt(0).toUpperCase() + key.slice(1);
}

function DeclinationTable({ data, label }: { data: DeclinationData[]; label: string }) {
  return (
    <div className="rounded-xl border bg-card/50 overflow-hidden">
      <div className="px-4 py-2.5 border-b bg-muted/30">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h4>
      </div>
      <div className="divide-y divide-border/30">
        {data.map((d) => (
          <div key={d.planet} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/20 transition-colors">
            <span className="text-lg w-6 text-center" title={planetLabel(d.planet)}>
              {PLANET_SYMBOLS[d.planet] || d.planet}
            </span>
            <span className="text-sm font-medium flex-1">{planetLabel(d.planet)}</span>
            <span className="text-sm font-mono tabular-nums">{formatDec(d.declination)}</span>
            {d.isOOB && (
              <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-amber-500/40 text-amber-600">
                OOB
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AspectRow({ aspect, isSynastry }: { aspect: DeclinationAspect; isSynastry: boolean }) {
  const symbol1 = PLANET_SYMBOLS[aspect.planet1] || aspect.planet1;
  const symbol2 = PLANET_SYMBOLS[aspect.planet2] || aspect.planet2;
  const isParallel = aspect.type === 'parallel';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
      isParallel
        ? 'bg-blue-500/5 border border-blue-500/15'
        : 'bg-red-500/5 border border-red-500/15'
    }`}>
      <div className="flex items-center gap-1.5 min-w-[80px]">
        <span className="text-xl" title={planetLabel(aspect.planet1)}>{symbol1}</span>
        <span className={`text-sm font-bold ${isParallel ? 'text-blue-500' : 'text-red-500'}`}>
          {isParallel ? '//' : '#'}
        </span>
        <span className="text-xl" title={planetLabel(aspect.planet2)}>{symbol2}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          {planetLabel(aspect.planet1)}{' '}
          <span className={isParallel ? 'text-blue-500' : 'text-red-500'}>
            {aspect.type}
          </span>{' '}
          {planetLabel(aspect.planet2)}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
          {formatDec(aspect.declination1)} / {formatDec(aspect.declination2)}
        </div>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
        {aspect.orb.toFixed(2)}{'\u00B0'}
      </span>
    </div>
  );
}

export function DeclinationPanel({ chartA, chartB, nameA, nameB }: DeclinationPanelProps) {
  const [orbSize, setOrbSize] = useState(1.0);
  const isSynastry = !!chartB && !!nameB;

  const declA = useMemo(() => calculateDeclinations(chartA.planets), [chartA]);
  const declB = useMemo(() => chartB ? calculateDeclinations(chartB.planets) : undefined, [chartB]);

  const aspects = useMemo(() => {
    if (isSynastry && declB) {
      return detectDeclinationAspects(declA, declB, orbSize);
    }
    return detectDeclinationAspects(declA, undefined, orbSize);
  }, [declA, declB, orbSize, isSynastry]);

  const parallelCount = aspects.filter(a => a.type === 'parallel').length;
  const contraCount = aspects.filter(a => a.type === 'contra-parallel').length;
  const oobCount = declA.filter(d => d.isOOB).length + (declB?.filter(d => d.isOOB).length || 0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">
          {isSynastry ? `${nameA} & ${nameB} Declinations` : `${nameA}'s Declinations`}
        </h3>
        <p className="text-xs text-muted-foreground">
          Parallel (//) and contra-parallel (#) aspects by declination
        </p>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/8 ring-1 ring-blue-500/20">
          <span className="text-xs font-medium text-blue-600">{parallelCount} parallel</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/8 ring-1 ring-red-500/20">
          <span className="text-xs font-medium text-red-600">{contraCount} contra-parallel</span>
        </div>
        {oobCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/8 ring-1 ring-amber-500/20">
            <span className="text-xs font-medium text-amber-600">{oobCount} out of bounds</span>
          </div>
        )}
      </div>

      {/* Orb control */}
      <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
        <span className="text-xs font-medium text-muted-foreground">Orb:</span>
        <div className="flex gap-1">
          {[0.5, 1.0, 1.5, 2.0].map(o => (
            <button
              key={o}
              onClick={() => setOrbSize(o)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                orbSize === o
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background border hover:bg-muted/60'
              }`}
            >
              {o}{'\u00B0'}
            </button>
          ))}
        </div>
      </div>

      {/* Declination Tables */}
      <div className={isSynastry ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : ''}>
        <DeclinationTable data={declA} label={isSynastry ? nameA : 'Planet Declinations'} />
        {declB && <DeclinationTable data={declB} label={nameB!} />}
      </div>

      {/* Declination Aspects */}
      {aspects.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">
            {isSynastry ? 'Synastry Declination Aspects' : 'Natal Declination Aspects'}
          </h4>
          <div className="space-y-2 max-h-[500px] overflow-y-auto px-1 py-1">
            {aspects.map((aspect, i) => (
              <AspectRow key={i} aspect={aspect} isSynastry={isSynastry} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 rounded-xl border border-dashed bg-muted/10">
          <div className="text-sm text-muted-foreground">No declination aspects found within {orbSize}{'\u00B0'} orb</div>
          <div className="text-xs text-muted-foreground/60 mt-1">Try increasing the orb size</div>
        </div>
      )}
    </div>
  );
}
