/**
 * Midpoint Trees Panel
 * For each planet, shows all midpoints (from other planet pairs) that fall on or near it.
 * Supports both 360-degree (full zodiac) and 90-degree (Ebertin cosmobiology) sort.
 */

import React, { useState, useMemo } from 'react';
import { ToolGuide } from './ToolGuide';

interface Props {
  natalChart: { planets: Record<string, { longitude: number; sign: string }> };
  name?: string;
}

/* ── Constants ── */

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609\uFE0E', Moon: '\u263D\uFE0E', Mercury: '\u263F\uFE0E', Venus: '\u2640\uFE0E', Mars: '\u2642\uFE0E',
  Jupiter: '\u2643\uFE0E', Saturn: '\u2644\uFE0E', Uranus: '\u26E2\uFE0E', Neptune: '\u2646\uFE0E', Pluto: '\u2647\uFE0E',
};

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const PLANETS_ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

const ORB = 1.5;
const TIGHT_ORB = 0.5;

/* ── Helpers ── */

function mod360(v: number): number {
  return ((v % 360) + 360) % 360;
}

function mod90(v: number): number {
  return ((v % 90) + 90) % 90;
}

/**
 * Calculate the nearer midpoint of two longitudes.
 * If the arc between them is > 180, flip to the shorter arc midpoint.
 */
function calcMidpoint(longA: number, longB: number): number {
  const a = mod360(longA);
  const b = mod360(longB);
  let mid = (a + b) / 2;
  if (Math.abs(a - b) > 180) {
    mid = mod360(mid + 180);
  }
  return mod360(mid);
}

/**
 * Angular difference, taking shortest arc.
 */
function angDiff(a: number, b: number, modulus: number = 360): number {
  const d = Math.abs((a % modulus) - (b % modulus));
  return d > modulus / 2 ? modulus - d : d;
}

function formatDegree(lng: number): string {
  const signs = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];
  const signIdx = Math.floor(mod360(lng) / 30);
  const deg = Math.floor(mod360(lng) % 30);
  const min = Math.floor((mod360(lng) % 1) * 60);
  return `${deg}\u00B0${String(min).padStart(2, '0')}' ${signs[signIdx]}`;
}

function formatDeg90(lng: number): string {
  const v = mod90(lng);
  const deg = Math.floor(v);
  const min = Math.floor((v % 1) * 60);
  return `${deg}\u00B0${String(min).padStart(2, '0')}'`;
}

interface MidpointHit {
  planetA: string;
  planetB: string;
  midpointLng: number;
  targetPlanet: string;
  orb: number;
  type: string; // 'conjunction', 'opposition' for 360; 'hard aspect' for 90
  isTight: boolean;
}

/* ── Computation ── */

/**
 * Resolve a planet key case-insensitively.
 * PLANETS_ORDER uses capitalized names but chart data uses lowercase keys.
 */
function findPlanetKey(planets: Record<string, { longitude: number; sign: string }>, name: string): string | null {
  if (planets[name]) return name;
  const lower = name.toLowerCase();
  const key = Object.keys(planets).find(k => k.toLowerCase() === lower);
  return key ?? null;
}

function computeMidpointTrees(
  planets: Record<string, { longitude: number; sign: string }>,
  mode: '360' | '90',
): Map<string, MidpointHit[]> {
  // Build a mapping from display name → actual chart key
  const planetMap: { display: string; key: string }[] = [];
  for (const p of PLANETS_ORDER) {
    const key = findPlanetKey(planets, p);
    if (key) planetMap.push({ display: p, key });
  }
  const trees = new Map<string, MidpointHit[]>();

  // Generate all unique pairs
  const pairs: { displayA: string; keyA: string; displayB: string; keyB: string }[] = [];
  for (let i = 0; i < planetMap.length; i++) {
    for (let j = i + 1; j < planetMap.length; j++) {
      pairs.push({
        displayA: planetMap[i].display, keyA: planetMap[i].key,
        displayB: planetMap[j].display, keyB: planetMap[j].key,
      });
    }
  }

  for (const { display: target, key: targetKey } of planetMap) {
    const hits: MidpointHit[] = [];
    const targetLng = planets[targetKey].longitude;

    for (const { displayA, keyA, displayB, keyB } of pairs) {
      // Skip if target is one of the pair planets (optional — some astrologers include it)
      // We'll include it for completeness
      const mid = calcMidpoint(planets[keyA].longitude, planets[keyB].longitude);

      if (mode === '360') {
        // Check conjunction (midpoint on planet)
        const orbConj = angDiff(mid, targetLng, 360);
        if (orbConj <= ORB) {
          hits.push({
            planetA: displayA,
            planetB: displayB,
            midpointLng: mid,
            targetPlanet: target,
            orb: Math.round(orbConj * 100) / 100,
            type: 'conjunction',
            isTight: orbConj <= TIGHT_ORB,
          });
          continue;
        }
        // Check opposition axis (midpoint opposite planet)
        const orbOpp = angDiff(mod360(mid + 180), targetLng, 360);
        if (orbOpp <= ORB) {
          hits.push({
            planetA: displayA,
            planetB: displayB,
            midpointLng: mid,
            targetPlanet: target,
            orb: Math.round(orbOpp * 100) / 100,
            type: 'opposition',
            isTight: orbOpp <= TIGHT_ORB,
          });
        }
      } else {
        // 90-degree sort: reduce everything mod 90
        const midR = mod90(mid);
        const targetR = mod90(targetLng);
        const orb90 = angDiff(midR, targetR, 90);
        if (orb90 <= ORB) {
          hits.push({
            planetA: displayA,
            planetB: displayB,
            midpointLng: mid,
            targetPlanet: target,
            orb: Math.round(orb90 * 100) / 100,
            type: 'hard aspect',
            isTight: orb90 <= TIGHT_ORB,
          });
        }
      }
    }

    hits.sort((x, y) => x.orb - y.orb);
    trees.set(target, hits);
  }

  return trees;
}

/* ── Component ── */

export function MidpointTreesPanel({ natalChart, name }: Props) {
  const [mode, setMode] = useState<'360' | '90'>('360');
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);

  const planets = natalChart.planets;

  const trees = useMemo(() => computeMidpointTrees(planets, mode), [planets, mode]);

  // Summary: count contacts per planet
  const summary = useMemo(() => {
    const counts: { planet: string; total: number; tight: number }[] = [];
    for (const p of PLANETS_ORDER) {
      const hits = trees.get(p);
      if (!hits) continue;
      counts.push({
        planet: p,
        total: hits.length,
        tight: hits.filter(h => h.isTight).length,
      });
    }
    return counts.sort((a, b) => b.total - a.total);
  }, [trees]);

  const toggleExpand = (p: string) => {
    setExpandedPlanet(prev => prev === p ? null : p);
  };

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">
          Midpoint Trees{name ? <span className="text-muted-foreground font-normal"> for {name}</span> : ''}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          For each planet, all midpoints from other planet pairs that fall within {ORB}° orb.
          Midpoints reveal hidden connections and sensitive points in the chart.
        </p>
      </div>

      <ToolGuide
        title="Midpoint Trees"
        description="Shows every midpoint combination between planets and which natal planets sit on those midpoints. A planet on a midpoint (within orb) blends and activates the energies of the two midpoint-forming planets. This is a core technique in cosmobiology."
        tips={[
          "A planet sitting directly on a midpoint 'triggers' that pair — it becomes the outlet for their combined energy",
          "The most important midpoints involve personal planets (Sun, Moon, Mercury, Venus, Mars)",
          "Sun/Moon midpoint is especially significant — planets on it strongly shape your identity and relationships",
          "MC midpoint contacts indicate career and public life themes",
          "The summary bar at the top shows which planets are most connected through midpoint structures",
        ]}
      />

      {/* Mode selector */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => setMode('360')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === '360'
                ? 'bg-teal-500/20 text-teal-300 border-r border-border/50'
                : 'text-muted-foreground/60 hover:text-muted-foreground border-r border-border/50'
            }`}
          >
            360° Full Zodiac
          </button>
          <button
            onClick={() => setMode('90')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === '90'
                ? 'bg-teal-500/20 text-teal-300'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            }`}
          >
            90° Cosmobiology
          </button>
        </div>
        <span className="text-[11px] text-muted-foreground/70">
          {mode === '360' ? 'Conjunction/Opposition axis' : 'Ebertin hard-aspect sort'}
        </span>
      </div>

      {/* Summary bar */}
      <div>
        <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5">
          Contact Count
        </div>
        <div className="flex gap-1 flex-wrap">
          {summary.map(({ planet, total, tight }) => (
            <button
              key={planet}
              onClick={() => toggleExpand(planet)}
              className={`rounded-lg border px-2 py-1 text-xs transition-all ${
                expandedPlanet === planet
                  ? 'border-teal-500/40 bg-teal-500/15 text-teal-300'
                  : total > 0
                    ? 'border-border/50 bg-muted/10 text-foreground/70 hover:border-border/60'
                    : 'border-border/30 bg-muted/5 text-muted-foreground/70'
              }`}
            >
              <span className="mr-0.5" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{PLANET_SYMBOLS[planet] || ''}</span>
              <span className="font-mono font-semibold">{total}</span>
              {tight > 0 && (
                <span className="ml-0.5 text-amber-300 text-[11px]">({tight})</span>
              )}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground/70 mt-1">
          Click a planet to expand. Numbers in parentheses = tight orb (&lt; {TIGHT_ORB}°).
        </div>
      </div>

      {/* Trees */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {PLANETS_ORDER.map(planet => {
          const pKey = findPlanetKey(planets, planet);
          if (!pKey) return null;
          const hits = trees.get(planet) || [];
          const isExpanded = expandedPlanet === planet;
          const pLng = planets[pKey].longitude;
          const pSign = planets[pKey].sign;

          return (
            <div
              key={planet}
              className={`rounded-lg border transition-all ${
                isExpanded
                  ? 'border-teal-500/30 bg-teal-500/5'
                  : 'border-border/40 hover:border-border/40'
              }`}
            >
              {/* Planet header */}
              <button
                onClick={() => toggleExpand(planet)}
                className="w-full flex items-center justify-between px-3 py-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{PLANET_SYMBOLS[planet] || ''}</span>
                  <div>
                    <span className="text-[11px] font-medium text-foreground/80">{planet}</span>
                    <span className="text-xs text-muted-foreground/60 ml-1.5" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>
                      {SIGN_SYMBOLS[pSign] || ''} {formatDegree(pLng)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono ${hits.length > 0 ? 'text-teal-300' : 'text-muted-foreground/60'}`}>
                    {hits.length} midpoint{hits.length !== 1 ? 's' : ''}
                  </span>
                  <span className={`text-muted-foreground/70 text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 pb-2">
                  {hits.length === 0 ? (
                    <div className="text-xs text-muted-foreground/70 py-2 text-center">
                      No midpoints contact this planet
                    </div>
                  ) : (
                    <div className="rounded border border-border/40 overflow-hidden overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/10">
                          <tr className="text-muted-foreground/60">
                            <th className="py-1 px-2 text-left font-medium">Midpoint</th>
                            <th className="py-1 px-2 text-left font-medium">Position</th>
                            <th className="py-1 px-2 text-center font-medium">Type</th>
                            <th className="py-1 px-2 text-right font-medium">Orb</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hits.map((hit, i) => (
                            <tr
                              key={i}
                              className={`border-t border-border/30 ${
                                hit.isTight ? 'bg-amber-500/[0.08]' : ''
                              }`}
                            >
                              <td className="py-1 px-2">
                                <span className="text-muted-foreground">
                                  {PLANET_SYMBOLS[hit.planetA] || ''}{' '}
                                </span>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-muted-foreground">
                                  {' '}{PLANET_SYMBOLS[hit.planetB] || ''}
                                </span>
                                <span className="text-muted-foreground/60 ml-1">
                                  {hit.planetA}/{hit.planetB}
                                </span>
                              </td>
                              <td className="py-1 px-2 font-mono text-muted-foreground/60">
                                {mode === '360' ? formatDegree(hit.midpointLng) : formatDeg90(hit.midpointLng)}
                              </td>
                              <td className="py-1 px-2 text-center">
                                <span className={`inline-block rounded px-1 py-0.5 text-[11px] font-medium ${
                                  hit.type === 'conjunction'
                                    ? 'bg-amber-500/15 text-amber-300'
                                    : hit.type === 'opposition'
                                      ? 'bg-orange-500/15 text-orange-300'
                                      : 'bg-red-500/15 text-red-300'
                                }`}>
                                  {hit.type === 'conjunction' ? 'Cnj' : hit.type === 'opposition' ? 'Opp' : 'Hard'}
                                </span>
                              </td>
                              <td className={`py-1 px-2 text-right font-mono ${
                                hit.isTight ? 'text-amber-300 font-semibold' : 'text-muted-foreground/60'
                              }`}>
                                {hit.orb.toFixed(2)}°
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
