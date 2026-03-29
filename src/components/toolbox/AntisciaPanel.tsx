/**
 * Antiscia & Contra-Antiscia Panel
 * Mirror points across the Cancer-Capricorn (solstice) and Aries-Libra (equinox) axes
 */

import React, { useMemo } from 'react';
import { ToolGuide } from './ToolGuide';

interface Props {
  natalChart: { planets: Record<string, { longitude: number; sign: string; retrograde?: boolean }> };
  name?: string;
}

const SIGN_SYMBOLS = ['\u2648\uFE0E','\u2649\uFE0E','\u264A\uFE0E','\u264B\uFE0E','\u264C\uFE0E','\u264D\uFE0E','\u264E\uFE0E','\u264F\uFE0E','\u2650\uFE0E','\u2651\uFE0E','\u2652\uFE0E','\u2653\uFE0E'];
const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '\u2609\uFE0E', moon: '\u263D\uFE0E', mercury: '\u263F\uFE0E', venus: '\u2640\uFE0E', mars: '\u2642\uFE0E',
  jupiter: '\u2643\uFE0E', saturn: '\u2644\uFE0E', uranus: '\u26E2\uFE0E', neptune: '\u2646\uFE0E', pluto: '\u2647\uFE0E',
  northnode: '\u260A\uFE0E', southnode: '\u260B\uFE0E', chiron: '\u26B7\uFE0E',
};

function normalizeLong(l: number): number {
  return ((l % 360) + 360) % 360;
}

function formatDeg(longitude: number): string {
  const normalized = normalizeLong(longitude);
  const signIdx = Math.floor(normalized / 30);
  const deg = Math.floor(normalized % 30);
  const min = Math.round((normalized % 1) * 60);
  return `${deg}°${min < 10 ? '0' : ''}${min}' ${SIGN_SYMBOLS[signIdx]}`;
}

function signOf(longitude: number): string {
  return SIGN_SYMBOLS[Math.floor(normalizeLong(longitude) / 30)];
}

function labelFor(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

function symbolFor(key: string): string {
  const k = key.toLowerCase().replace(/[\s_-]/g, '');
  return PLANET_SYMBOLS[k] || key.charAt(0).toUpperCase();
}

// Antiscion: mirror across solstice axis (0 Cancer / 0 Capricorn)
// antiscion_longitude = (180 - L) mod 360
function antiscion(l: number): number {
  return normalizeLong(180 - l);
}

// Contra-antiscion = antiscion + 180
function contraAntiscion(l: number): number {
  return normalizeLong(180 - l + 180);
}

function angularDistance(a: number, b: number): number {
  const d = Math.abs(normalizeLong(a) - normalizeLong(b));
  return d > 180 ? 360 - d : d;
}

interface PlanetRow {
  key: string;
  symbol: string;
  label: string;
  longitude: number;
  retrograde?: boolean;
  antiscLong: number;
  contraLong: number;
  antiscHit: string | null;   // planet key that it conjuncts
  contraHit: string | null;
}

const ORB = 1.0; // degrees

export function AntisciaPanel({ natalChart, name }: Props) {
  const rows = useMemo<PlanetRow[]>(() => {
    const entries = Object.entries(natalChart.planets);
    const longs = entries.map(([k, v]) => ({ key: k, longitude: normalizeLong(v.longitude) }));

    return entries.map(([key, data]) => {
      const l = normalizeLong(data.longitude);
      const aL = antiscion(l);
      const cL = contraAntiscion(l);

      // Check if antiscion/contra lands within ORB of any other natal planet
      let antiscHit: string | null = null;
      let contraHit: string | null = null;
      for (const other of longs) {
        if (other.key === key) continue;
        if (angularDistance(aL, other.longitude) <= ORB) antiscHit = other.key;
        if (angularDistance(cL, other.longitude) <= ORB) contraHit = other.key;
      }

      return {
        key,
        symbol: symbolFor(key),
        label: labelFor(key),
        longitude: l,
        retrograde: data.retrograde,
        antiscLong: aL,
        contraLong: cL,
        antiscHit,
        contraHit,
      };
    });
  }, [natalChart]);

  const mirrorPairs = useMemo(() => {
    // Sign-level mirror pairs across solstice axis
    return [
      ['\u2648\uFE0E Aries', '\u264D\uFE0E Virgo'],
      ['\u2649\uFE0E Taurus', '\u264C\uFE0E Leo'],
      ['\u264A\uFE0E Gemini', '\u264B\uFE0E Cancer'],
      ['\u264E\uFE0E Libra', '\u2653\uFE0E Pisces'],
      ['\u264F\uFE0E Scorpio', '\u2652\uFE0E Aquarius'],
      ['\u2650\uFE0E Sagittarius', '\u2651\uFE0E Capricorn'],
    ];
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">
          Antiscia & Contra-Antiscia{name ? ` — ${name}` : ''}
        </h3>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Mirror points across the solstice axis (0° {'\u264B\uFE0E'} / 0° {'\u2651\uFE0E'}). Points sharing the same antiscion have equal declination.
        </p>
      </div>

      <ToolGuide
        title="Antiscia"
        description="Antiscia are mirror points across the Cancer-Capricorn solstice axis (0° Cancer / 0° Capricorn). Two planets sharing the same antiscion degree have equal declination — a hidden connection. Contra-antiscia mirror across the Aries-Libra axis."
        tips={[
          "Antiscia connections are 'secret' aspects — they show hidden affinities and unconscious links between planets",
          "A planet's antiscion falls in the sign that has equal day-length to its natal sign",
          "If another planet sits on your planet's antiscion point (within 1-2° orb), they share a powerful hidden bond",
          "The mirror pairs are: Aries\u2194Virgo, Taurus\u2194Leo, Gemini\u2194Cancer, Libra\u2194Pisces, Scorpio\u2194Aquarius, Sagittarius\u2194Capricorn",
          "Antiscia are especially valued in horary and medical astrology for revealing hidden causes",
        ]}
      />

      {rows.length === 0 && (
        <div className="text-xs text-muted-foreground/70 text-center py-8 rounded-lg border border-border/30 bg-muted/10">
          Enter a birth date to use this tool
        </div>
      )}

      {/* Sign mirror pairs reference */}
      <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
        <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Solstice Mirror Pairs</span>
        <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 mt-1.5">
          {mirrorPairs.map(([a, b], i) => (
            <div key={i} className="text-xs text-muted-foreground/70 flex items-center gap-1">
              <span>{a}</span>
              <span className="text-muted-foreground/30">↔</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left py-1.5 px-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Planet</th>
              <th className="text-left py-1.5 px-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Natal</th>
              <th className="text-left py-1.5 px-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Antiscion</th>
              <th className="text-left py-1.5 px-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Contra-Antiscion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                {/* Planet */}
                <td className="py-1.5 px-1 whitespace-nowrap">
                  <span className="text-sm mr-1" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{row.symbol}</span>
                  <span className="text-muted-foreground/70">{row.label}</span>
                  {row.retrograde && <span className="text-[11px] text-red-400 ml-0.5">R</span>}
                </td>
                {/* Natal position */}
                <td className="py-1.5 px-1 font-mono text-[11px]">{formatDeg(row.longitude)}</td>
                {/* Antiscion */}
                <td className={`py-1.5 px-1 font-mono text-[11px] ${row.antiscHit ? 'text-amber-400 font-semibold' : ''}`}>
                  {formatDeg(row.antiscLong)}
                  {row.antiscHit && (
                    <span className="ml-1 text-[11px] bg-amber-400/15 text-amber-400 px-1 py-0.5 rounded">
                      ☌ {symbolFor(row.antiscHit)}
                    </span>
                  )}
                </td>
                {/* Contra-antiscion */}
                <td className={`py-1.5 px-1 font-mono text-[11px] ${row.contraHit ? 'text-sky-400 font-semibold' : ''}`}>
                  {formatDeg(row.contraLong)}
                  {row.contraHit && (
                    <span className="ml-1 text-[11px] bg-sky-400/15 text-sky-400 px-1 py-0.5 rounded">
                      ☌ {symbolFor(row.contraHit)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active antiscia connections summary */}
      {rows.some(r => r.antiscHit || r.contraHit) && (
        <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40 space-y-1">
          <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Active Connections (within {ORB}° orb)</span>
          {rows.filter(r => r.antiscHit).map(r => (
            <div key={`a-${r.key}`} className="text-xs text-amber-400/80 flex items-center gap-1">
              <span className="text-sm" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{r.symbol}</span>
              <span>antiscion conjunct</span>
              <span className="text-sm">{symbolFor(r.antiscHit!)}</span>
              <span className="text-muted-foreground/60 ml-1">({formatDeg(r.antiscLong)})</span>
            </div>
          ))}
          {rows.filter(r => r.contraHit).map(r => (
            <div key={`c-${r.key}`} className="text-xs text-sky-400/80 flex items-center gap-1">
              <span className="text-sm" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{r.symbol}</span>
              <span>contra-antiscion conjunct</span>
              <span className="text-sm">{symbolFor(r.contraHit!)}</span>
              <span className="text-muted-foreground/60 ml-1">({formatDeg(r.contraLong)})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
