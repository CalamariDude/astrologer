/**
 * Draconic Chart Panel
 * Rotates the entire chart so the North Node sits at 0° Aries,
 * revealing soul-level / karmic patterns.
 */

import React, { useMemo } from 'react';
import { ToolGuide } from './ToolGuide';

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean }>;
    houses?: { cusps?: number[]; ascendant?: number; mc?: number };
  };
  name?: string;
}

const SIGN_SYMBOLS = ['\u2648\uFE0E','\u2649\uFE0E','\u264A\uFE0E','\u264B\uFE0E','\u264C\uFE0E','\u264D\uFE0E','\u264E\uFE0E','\u264F\uFE0E','\u2650\uFE0E','\u2651\uFE0E','\u2652\uFE0E','\u2653\uFE0E'];
const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const ELEMENT_COLORS: Record<string, string> = {
  fire:  'text-red-400',
  earth: 'text-emerald-400',
  air:   'text-sky-400',
  water: 'text-blue-400',
};
const SIGN_ELEMENT = ['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '\u2609\uFE0E', moon: '\u263D\uFE0E', mercury: '\u263F\uFE0E', venus: '\u2640\uFE0E', mars: '\u2642\uFE0E',
  jupiter: '\u2643\uFE0E', saturn: '\u2644\uFE0E', uranus: '\u26E2\uFE0E', neptune: '\u2646\uFE0E', pluto: '\u2647\uFE0E',
  northnode: '\u260A\uFE0E', southnode: '\u260B\uFE0E', chiron: '\u26B7\uFE0E',
};

const ASPECT_DEFS = [
  { name: 'Conjunction', symbol: '☌', angle: 0,   orb: 8 },
  { name: 'Opposition',  symbol: '☍', angle: 180, orb: 8 },
  { name: 'Trine',       symbol: '△', angle: 120, orb: 7 },
  { name: 'Square',      symbol: '□', angle: 90,  orb: 7 },
  { name: 'Sextile',     symbol: '⚹', angle: 60,  orb: 5 },
];

function normalizeLong(l: number): number {
  return ((l % 360) + 360) % 360;
}

function formatDeg(longitude: number): string {
  const n = normalizeLong(longitude);
  const signIdx = Math.floor(n / 30);
  const deg = Math.floor(n % 30);
  const min = Math.round((n % 1) * 60);
  return `${deg}°${min < 10 ? '0' : ''}${min}' ${SIGN_SYMBOLS[signIdx]}`;
}

function signIndexOf(longitude: number): number {
  return Math.floor(normalizeLong(longitude) / 30);
}

function labelFor(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

function symbolFor(key: string): string {
  const k = key.toLowerCase().replace(/[\s_-]/g, '');
  return PLANET_SYMBOLS[k] || key.charAt(0).toUpperCase();
}

function angularDistance(a: number, b: number): number {
  const d = Math.abs(normalizeLong(a) - normalizeLong(b));
  return d > 180 ? 360 - d : d;
}

// Find the North Node key in the planets record
function findNorthNode(planets: Record<string, { longitude: number }>): { key: string; longitude: number } | null {
  const candidates = ['northnode', 'NorthNode', 'north_node', 'northNode', 'North Node', 'mean_node', 'meannode', 'true_node', 'truenode'];
  for (const c of candidates) {
    for (const [k, v] of Object.entries(planets)) {
      if (k.toLowerCase().replace(/[\s_-]/g, '') === c.toLowerCase().replace(/[\s_-]/g, '')) {
        return { key: k, longitude: v.longitude };
      }
    }
  }
  return null;
}

interface DraconicRow {
  key: string;
  symbol: string;
  label: string;
  tropicalLong: number;
  draconicLong: number;
  draconicSignIdx: number;
  element: string;
  retrograde?: boolean;
}

interface AspectHit {
  planet1: string;
  symbol1: string;
  planet2: string;
  symbol2: string;
  aspectName: string;
  aspectSymbol: string;
  orb: number;
}

export function DraconicPanel({ natalChart, name }: Props) {
  const northNode = useMemo(() => findNorthNode(natalChart.planets), [natalChart]);
  const offset = northNode ? normalizeLong(northNode.longitude) : 0;

  const rows = useMemo<DraconicRow[]>(() => {
    return Object.entries(natalChart.planets).map(([key, data]) => {
      const tl = normalizeLong(data.longitude);
      const dl = normalizeLong(tl - offset);
      const si = signIndexOf(dl);
      return {
        key,
        symbol: symbolFor(key),
        label: labelFor(key),
        tropicalLong: tl,
        draconicLong: dl,
        draconicSignIdx: si,
        element: SIGN_ELEMENT[si],
        retrograde: data.retrograde,
      };
    });
  }, [natalChart, offset]);

  const aspects = useMemo<AspectHit[]>(() => {
    const hits: AspectHit[] = [];
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const dist = angularDistance(rows[i].draconicLong, rows[j].draconicLong);
        for (const asp of ASPECT_DEFS) {
          const diff = Math.abs(dist - asp.angle);
          if (diff <= asp.orb) {
            hits.push({
              planet1: rows[i].key,
              symbol1: rows[i].symbol,
              planet2: rows[j].key,
              symbol2: rows[j].symbol,
              aspectName: asp.name,
              aspectSymbol: asp.symbol,
              orb: Math.round(diff * 10) / 10,
            });
          }
        }
      }
    }
    return hits.sort((a, b) => a.orb - b.orb);
  }, [rows]);

  if (!northNode) {
    return (
      <div className="text-xs text-muted-foreground/60 p-4">
        North Node not found in chart data. The draconic chart requires a North Node position.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">
          Draconic Chart{name ? ` — ${name}` : ''}
        </h3>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          The tropical chart rotated so the North Node ({'\u260A\uFE0E'}) aligns with 0° {'\u2648\uFE0E'}. Reveals soul-level patterns.
        </p>
      </div>

      <ToolGuide
        title="Draconic Chart"
        description="The draconic chart rotates your tropical chart so the North Node aligns with 0° Aries. This reveals soul-level patterns, karmic imprints, and the deeper motivations behind your tropical chart placements. It's your chart from the soul's perspective."
        tips={[
          "Compare draconic placements with your tropical chart — where they differ shows growth areas",
          "The draconic Sun sign reveals your soul's core essence, which may differ from your tropical Sun",
          "When another person's tropical planets conjunct your draconic planets, there's a karmic link",
          "The draconic Ascendant shows how your soul naturally wants to present itself",
          "Draconic charts are especially useful in synastry for understanding past-life connections",
        ]}
      />

      {/* Offset info */}
      <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40 flex items-center gap-2">
        <span className="text-sm">{'\u260A\uFE0E'}</span>
        <div>
          <div className="text-xs text-muted-foreground/60">North Node (rotation offset)</div>
          <div className="text-xs font-mono font-medium">{formatDeg(offset)}</div>
        </div>
      </div>

      {/* Main table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left py-1.5 px-1 text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Planet</th>
              <th className="text-left py-1.5 px-1 text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Tropical</th>
              <th className="text-left py-1.5 px-1 text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Draconic</th>
              <th className="text-left py-1.5 px-1 text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Sign</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                <td className="py-1.5 px-1 whitespace-nowrap">
                  <span className="text-sm mr-1">{row.symbol}</span>
                  <span className="text-muted-foreground/70">{row.label}</span>
                  {row.retrograde && <span className="text-[11px] text-red-400 ml-0.5">R</span>}
                </td>
                <td className="py-1.5 px-1 font-mono text-[11px] text-muted-foreground/60">{formatDeg(row.tropicalLong)}</td>
                <td className={`py-1.5 px-1 font-mono text-[11px] font-medium ${ELEMENT_COLORS[row.element]}`}>
                  {formatDeg(row.draconicLong)}
                </td>
                <td className={`py-1.5 px-1 text-[11px] ${ELEMENT_COLORS[row.element]}`}>
                  <span className="text-sm mr-0.5">{SIGN_SYMBOLS[row.draconicSignIdx]}</span>
                  <span className="text-muted-foreground/70">{SIGN_NAMES[row.draconicSignIdx]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Draconic aspects */}
      {aspects.length > 0 && (
        <div>
          <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Draconic Aspects</span>
          <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[300px] overflow-y-auto">
            {aspects.slice(0, 20).map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-muted/20 border border-border/20"
              >
                <span className="text-sm">{a.symbol1}</span>
                <span className="text-muted-foreground/70">{a.aspectSymbol}</span>
                <span className="text-sm">{a.symbol2}</span>
                <span className="text-muted-foreground/60 ml-auto">{a.aspectName}</span>
                <span className="font-mono text-muted-foreground/30">{a.orb}°</span>
              </div>
            ))}
          </div>
          {aspects.length > 20 && (
            <p className="text-[11px] text-muted-foreground/30 mt-1">+{aspects.length - 20} more aspects</p>
          )}
        </div>
      )}

      {/* Element summary */}
      <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
        <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Draconic Element Balance</span>
        <div className="grid grid-cols-4 gap-2 mt-1.5">
          {(['fire', 'earth', 'air', 'water'] as const).map(el => {
            const count = rows.filter(r => r.element === el).length;
            return (
              <div key={el} className="text-center">
                <div className={`text-sm font-bold ${ELEMENT_COLORS[el]}`}>{count}</div>
                <div className="text-[11px] text-muted-foreground/60 capitalize">{el}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
