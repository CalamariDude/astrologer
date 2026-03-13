/**
 * Eclipse Tracker Panel
 * Shows solar and lunar eclipses for 2024-2028 and their impact on the natal chart.
 * Calculates house placement and aspects to natal planets.
 */

import React, { useMemo, useState } from 'react';
import { ToolGuide } from './ToolGuide';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; house?: number }>;
    houses?: { cusps?: number[]; ascendant?: number; mc?: number };
  };
  birthDate: string;
  name?: string;
}

interface Eclipse {
  date: string;
  type: 'Solar' | 'Lunar';
  subtype: string; // Total, Annular, Partial, Penumbral
  degree: number;
  sign: string;
  longitude: number; // absolute longitude
}

interface EclipseImpact {
  eclipse: Eclipse;
  house: number | null;
  aspects: { planet: string; aspect: string; orb: number }[];
  significance: number; // 0-10
  nearAngle: string | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const SIGN_ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '\u2609\uFE0E', moon: '\u263D\uFE0E', mercury: '\u263F\uFE0E', venus: '\u2640\uFE0E', mars: '\u2642\uFE0E',
  jupiter: '\u2643\uFE0E', saturn: '\u2644\uFE0E', uranus: '\u26E2\uFE0E', neptune: '\u2646\uFE0E', pluto: '\u2647\uFE0E',
  northnode: '\u260A\uFE0E', southnode: '\u260B\uFE0E', chiron: '\u26B7\uFE0E',
  Sun: '\u2609\uFE0E', Moon: '\u263D\uFE0E', Mercury: '\u263F\uFE0E', Venus: '\u2640\uFE0E', Mars: '\u2642\uFE0E',
  Jupiter: '\u2643\uFE0E', Saturn: '\u2644\uFE0E', Uranus: '\u26E2\uFE0E', Neptune: '\u2646\uFE0E', Pluto: '\u2647\uFE0E',
  NorthNode: '\u260A\uFE0E', SouthNode: '\u260B\uFE0E', Chiron: '\u26B7\uFE0E',
};

const ASPECT_DEFS = [
  { name: 'conjunction', symbol: '\u260C', angle: 0, orb: 5 },
  { name: 'opposition', symbol: '\u260D', angle: 180, orb: 5 },
  { name: 'square', symbol: '\u25A1', angle: 90, orb: 4 },
];

/* ------------------------------------------------------------------ */
/*  Eclipse data 2024-2028                                             */
/* ------------------------------------------------------------------ */

const ECLIPSES: Eclipse[] = [
  { date: '2024-03-25', type: 'Lunar', subtype: 'Penumbral', degree: 5, sign: 'Libra', longitude: 185 },
  { date: '2024-04-08', type: 'Solar', subtype: 'Total', degree: 19, sign: 'Aries', longitude: 19 },
  { date: '2024-09-18', type: 'Lunar', subtype: 'Partial', degree: 25, sign: 'Pisces', longitude: 355 },
  { date: '2024-10-02', type: 'Solar', subtype: 'Annular', degree: 10, sign: 'Libra', longitude: 190 },
  { date: '2025-03-14', type: 'Lunar', subtype: 'Total', degree: 23, sign: 'Virgo', longitude: 173 },
  { date: '2025-03-29', type: 'Solar', subtype: 'Partial', degree: 9, sign: 'Aries', longitude: 9 },
  { date: '2025-09-07', type: 'Lunar', subtype: 'Total', degree: 15, sign: 'Pisces', longitude: 345 },
  { date: '2025-09-21', type: 'Solar', subtype: 'Partial', degree: 29, sign: 'Virgo', longitude: 179 },
  { date: '2026-02-17', type: 'Solar', subtype: 'Annular', degree: 28, sign: 'Aquarius', longitude: 328 },
  { date: '2026-03-03', type: 'Lunar', subtype: 'Total', degree: 12, sign: 'Virgo', longitude: 162 },
  { date: '2026-08-12', type: 'Solar', subtype: 'Total', degree: 19, sign: 'Leo', longitude: 139 },
  { date: '2026-08-28', type: 'Lunar', subtype: 'Partial', degree: 5, sign: 'Pisces', longitude: 335 },
  { date: '2027-02-06', type: 'Solar', subtype: 'Annular', degree: 17, sign: 'Aquarius', longitude: 317 },
  { date: '2027-02-20', type: 'Lunar', subtype: 'Penumbral', degree: 2, sign: 'Virgo', longitude: 152 },
  { date: '2027-07-18', type: 'Solar', subtype: 'Partial', degree: 25, sign: 'Cancer', longitude: 115 },
  { date: '2027-08-17', type: 'Lunar', subtype: 'Penumbral', degree: 24, sign: 'Aquarius', longitude: 324 },
  { date: '2028-01-12', type: 'Solar', subtype: 'Partial', degree: 21, sign: 'Capricorn', longitude: 291 },
  { date: '2028-01-26', type: 'Lunar', subtype: 'Total', degree: 6, sign: 'Leo', longitude: 126 },
  { date: '2028-07-06', type: 'Solar', subtype: 'Partial', degree: 14, sign: 'Cancer', longitude: 104 },
  { date: '2028-07-21', type: 'Lunar', subtype: 'Total', degree: 28, sign: 'Capricorn', longitude: 298 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeLong(l: number): number {
  return ((l % 360) + 360) % 360;
}

function angularDistance(a: number, b: number): number {
  const d = Math.abs(normalizeLong(a) - normalizeLong(b));
  return d > 180 ? 360 - d : d;
}

function findHouse(longitude: number, cusps?: number[]): number | null {
  if (!cusps || cusps.length < 12) return null;
  const lng = normalizeLong(longitude);
  for (let i = 0; i < 12; i++) {
    const start = normalizeLong(cusps[i]);
    const end = normalizeLong(cusps[(i + 1) % 12]);
    if (start < end) {
      if (lng >= start && lng < end) return i + 1;
    } else {
      // Wraps around 0
      if (lng >= start || lng < end) return i + 1;
    }
  }
  return 1;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getYear(dateStr: string): number {
  return parseInt(dateStr.slice(0, 4));
}

function labelFor(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

function symbolFor(key: string): string {
  return PLANET_SYMBOLS[key] || PLANET_SYMBOLS[key.toLowerCase()] || key.charAt(0).toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EclipseTrackerPanel({ natalChart, birthDate, name }: Props) {
  const [filterYear, setFilterYear] = useState<number | 'all'>(new Date().getFullYear());
  const [filterType, setFilterType] = useState<'all' | 'Solar' | 'Lunar'>('all');
  const todayStr = new Date().toISOString().slice(0, 10);

  const impacts: EclipseImpact[] = useMemo(() => {
    return ECLIPSES.map(eclipse => {
      // House placement
      const house = findHouse(eclipse.longitude, natalChart.houses?.cusps);

      // Aspects to natal planets
      const aspects: { planet: string; aspect: string; orb: number }[] = [];
      for (const [key, pData] of Object.entries(natalChart.planets)) {
        for (const asp of ASPECT_DEFS) {
          const dist = angularDistance(eclipse.longitude, pData.longitude);
          const orb = Math.abs(dist - asp.angle);
          if (orb <= asp.orb) {
            aspects.push({ planet: key, aspect: asp.name, orb: Math.round(orb * 10) / 10 });
          }
        }
      }

      // Check angles
      let nearAngle: string | null = null;
      const asc = natalChart.houses?.ascendant;
      const mc = natalChart.houses?.mc;
      if (asc !== undefined && angularDistance(eclipse.longitude, asc) <= 5) nearAngle = 'ASC';
      if (mc !== undefined && angularDistance(eclipse.longitude, mc) <= 5) nearAngle = 'MC';
      if (asc !== undefined && angularDistance(eclipse.longitude, normalizeLong(asc + 180)) <= 5) nearAngle = 'DSC';
      if (mc !== undefined && angularDistance(eclipse.longitude, normalizeLong(mc + 180)) <= 5) nearAngle = 'IC';

      // Significance: tighter aspects + angles = higher score
      let significance = 0;
      for (const a of aspects) {
        const weight = a.aspect === 'conjunction' ? 3 : a.aspect === 'opposition' ? 2.5 : 2;
        significance += weight * (1 - a.orb / 5);
      }
      if (nearAngle) significance += 3;
      if (eclipse.subtype === 'Total') significance += 1;
      significance = Math.min(10, Math.round(significance * 10) / 10);

      return { eclipse, house, aspects, significance, nearAngle };
    });
  }, [natalChart]);

  const filtered = useMemo(() => {
    return impacts.filter(i => {
      if (filterYear !== 'all' && getYear(i.eclipse.date) !== filterYear) return false;
      if (filterType !== 'all' && i.eclipse.type !== filterType) return false;
      return true;
    });
  }, [impacts, filterYear, filterType]);

  const years = [2024, 2025, 2026, 2027, 2028];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">Eclipse Tracker</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {name ? `Eclipse impacts for ${name} — ` : ''}Solar & lunar eclipses 2024-2028
        </p>
      </div>

      <ToolGuide
        title="Eclipse Tracker"
        description="Tracks upcoming and recent solar and lunar eclipses with their zodiac positions. Eclipses near natal planets or angles trigger powerful, often fated changes. Solar eclipses open new chapters; lunar eclipses bring culminations and revelations."
        tips={[
          "Check if any eclipse falls within 3-5° of your natal planets or angles — that's a strong activation",
          "Solar eclipses (New Moon) = new beginnings, fresh starts, doors opening",
          "Lunar eclipses (Full Moon) = endings, completions, truths coming to light",
          "Eclipse effects can be felt up to 6 months before and after the actual date",
          "The sign and house of the eclipse show which life area is being activated",
          "North Node eclipses tend to bring growth; South Node eclipses tend to release and let go",
        ]}
      />

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-0.5">
          <button
            onClick={() => setFilterYear('all')}
            className={`px-1.5 py-0.5 rounded text-xs transition-colors ${filterYear === 'all' ? 'bg-muted/40 text-foreground' : 'bg-muted/10 text-muted-foreground hover:bg-muted/20'}`}
          >
            All
          </button>
          {years.map(y => (
            <button
              key={y}
              onClick={() => setFilterYear(y)}
              className={`px-1.5 py-0.5 rounded text-xs transition-colors ${filterYear === y ? 'bg-muted/40 font-bold text-foreground' : 'bg-muted/10 hover:bg-muted/20'} ${y === new Date().getFullYear() && filterYear !== y ? 'text-yellow-300' : ''}`}
            >
              {y}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5">
          {(['all', 'Solar', 'Lunar'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-1.5 py-0.5 rounded text-xs transition-colors ${filterType === t ? 'bg-muted/40 text-foreground' : 'bg-muted/10 text-muted-foreground hover:bg-muted/20'}`}
            >
              {t === 'all' ? 'Both' : t === 'Solar' ? '\u2609\uFE0E Solar' : '\u263D\uFE0E Lunar'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1.5">
        {filtered.map((impact, idx) => {
          const { eclipse, house, aspects, significance, nearAngle } = impact;
          const isPast = eclipse.date < todayStr;
          const isHighSignificance = significance >= 4;

          return (
            <div
              key={idx}
              className={`rounded-lg p-2 border transition-all ${
                isPast
                  ? 'bg-muted/5 border-border/30 opacity-50'
                  : isHighSignificance
                    ? 'bg-muted/15 border-yellow-500/30'
                    : 'bg-muted/10 border-border/50'
              }`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm ${eclipse.type === 'Solar' ? 'text-yellow-400' : 'text-blue-300'}`}>
                    {eclipse.type === 'Solar' ? '\u2609\uFE0E' : '\u263D\uFE0E'}
                  </span>
                  <div>
                    <div className="text-xs font-medium">
                      {eclipse.type} Eclipse ({eclipse.subtype})
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(eclipse.date)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs">
                    {eclipse.degree}{'\u00B0'} {SIGN_SYMBOLS[eclipse.sign]} {eclipse.sign}
                  </div>
                  {house && (
                    <div className="text-xs text-muted-foreground">House {house}</div>
                  )}
                </div>
              </div>

              {/* Significance bar */}
              {significance > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground/60 w-12">Impact</span>
                  <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(significance / 10) * 100}%`,
                        backgroundColor: significance >= 6 ? '#ef4444' : significance >= 3 ? '#f59e0b' : '#6b7280',
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground/60 w-4 text-right font-mono tabular-nums">{significance}</span>
                </div>
              )}

              {/* Aspects */}
              {(aspects.length > 0 || nearAngle) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {nearAngle && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-red-500/20 text-[11px] text-red-300">
                      ☌ {nearAngle}
                    </span>
                  )}
                  {aspects.map((a, ai) => (
                    <span
                      key={ai}
                      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[11px] ${
                        a.aspect === 'conjunction'
                          ? 'bg-yellow-500/15 text-yellow-300'
                          : a.aspect === 'opposition'
                            ? 'bg-red-500/15 text-red-300'
                            : 'bg-blue-500/15 text-blue-300'
                      }`}
                    >
                      {symbolFor(a.planet)} {labelFor(a.planet)}
                      <span className="text-muted-foreground/70">{a.orb}{'\u00B0'}</span>
                    </span>
                  ))}
                </div>
              )}

              {aspects.length === 0 && !nearAngle && (
                <div className="mt-1 text-[11px] text-muted-foreground/70">No major natal aspects</div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-xs text-muted-foreground/60 text-center py-4">No eclipses match the current filter</div>
      )}

      {/* Summary */}
      <div className="text-[11px] text-muted-foreground/70 pt-2 border-t border-border/50">
        Showing {filtered.length} eclipses. Significance based on orb tightness to natal planets and angles.
      </div>
    </div>
  );
}
