/**
 * Almuten Calculator
 * Calculates almuten (strongest planet) for each house and the chart almuten
 * Uses Ptolemaic dignity scoring: domicile, exaltation, triplicity, term, face
 */

import React, { useMemo, useState } from 'react';
import { ToolGuide } from './ToolGuide';

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean; house?: number }>;
    houses?: Record<string, number> | { cusps?: number[]; ascendant?: number; mc?: number };
    angles?: { ascendant: number; midheaven: number };
  };
  name?: string;
}

/** Extract house cusps as a 12-element array from the natal chart houses data */
function extractCusps(houses?: Record<string, number> | { cusps?: number[] }): number[] | null {
  if (!houses) return null;
  // If it has a cusps array (legacy format)
  if ('cusps' in houses && Array.isArray((houses as any).cusps)) {
    const cusps = (houses as any).cusps;
    return cusps.length >= 12 ? cusps : null;
  }
  // Record<string, number> format: keys "1" through "12"
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) {
    const val = (houses as Record<string, number>)[String(i)];
    if (val === undefined) return null;
    cusps.push(val);
  }
  return cusps;
}

/** Get a planet from the chart by name, trying lowercase first (standard) then capitalized */
function getPlanet(planets: Record<string, any>, name: string): { longitude: number; house?: number } | undefined {
  return planets[name.toLowerCase()] || planets[name];
}

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_SYMBOLS = ['\u2648\uFE0E','\u2649\uFE0E','\u264A\uFE0E','\u264B\uFE0E','\u264C\uFE0E','\u264D\uFE0E','\u264E\uFE0E','\u264F\uFE0E','\u2650\uFE0E','\u2651\uFE0E','\u2652\uFE0E','\u2653\uFE0E'];
const PLANETS_ORDER = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
const PLANET_SYMBOLS: Record<string, string> = { Sun:'\u2609\uFE0E', Moon:'\u263D\uFE0E', Mercury:'\u263F\uFE0E', Venus:'\u2640\uFE0E', Mars:'\u2642\uFE0E', Jupiter:'\u2643\uFE0E', Saturn:'\u2644\uFE0E' };

// Domicile rulers (traditional)
const DOMICILE: Record<string, string[]> = {
  Aries:['Mars'], Taurus:['Venus'], Gemini:['Mercury'], Cancer:['Moon'],
  Leo:['Sun'], Virgo:['Mercury'], Libra:['Venus'], Scorpio:['Mars'],
  Sagittarius:['Jupiter'], Capricorn:['Saturn'], Aquarius:['Saturn'], Pisces:['Jupiter'],
};

// Exaltation rulers
const EXALTATION: Record<string, string | null> = {
  Aries:'Sun', Taurus:'Moon', Gemini:null, Cancer:'Jupiter',
  Leo:null, Virgo:'Mercury', Libra:'Saturn', Scorpio:null,
  Sagittarius:null, Capricorn:'Mars', Aquarius:null, Pisces:'Venus',
};

// Triplicity rulers (Dorotheus: day/night/participating)
const TRIPLICITY: Record<string, { day: string; night: string; part: string }> = {
  // Fire
  Aries: { day:'Sun', night:'Jupiter', part:'Saturn' },
  Leo: { day:'Sun', night:'Jupiter', part:'Saturn' },
  Sagittarius: { day:'Sun', night:'Jupiter', part:'Saturn' },
  // Earth
  Taurus: { day:'Venus', night:'Moon', part:'Mars' },
  Virgo: { day:'Venus', night:'Moon', part:'Mars' },
  Capricorn: { day:'Venus', night:'Moon', part:'Mars' },
  // Air
  Gemini: { day:'Saturn', night:'Mercury', part:'Jupiter' },
  Libra: { day:'Saturn', night:'Mercury', part:'Jupiter' },
  Aquarius: { day:'Saturn', night:'Mercury', part:'Jupiter' },
  // Water
  Cancer: { day:'Venus', night:'Mars', part:'Moon' },
  Scorpio: { day:'Venus', night:'Mars', part:'Moon' },
  Pisces: { day:'Venus', night:'Mars', part:'Moon' },
};

// Egyptian terms (bounds) — degree ranges within each sign
// Format: [endDegree, ruler]
const TERMS: Record<string, [number, string][]> = {
  Aries: [[6,'Jupiter'],[12,'Venus'],[20,'Mercury'],[25,'Mars'],[30,'Saturn']],
  Taurus: [[8,'Venus'],[14,'Mercury'],[22,'Jupiter'],[27,'Saturn'],[30,'Mars']],
  Gemini: [[6,'Mercury'],[12,'Jupiter'],[17,'Venus'],[24,'Mars'],[30,'Saturn']],
  Cancer: [[7,'Mars'],[13,'Venus'],[19,'Mercury'],[26,'Jupiter'],[30,'Saturn']],
  Leo: [[6,'Jupiter'],[11,'Venus'],[18,'Saturn'],[24,'Mercury'],[30,'Mars']],
  Virgo: [[7,'Mercury'],[17,'Venus'],[21,'Jupiter'],[28,'Mars'],[30,'Saturn']],
  Libra: [[6,'Saturn'],[14,'Mercury'],[21,'Jupiter'],[28,'Venus'],[30,'Mars']],
  Scorpio: [[7,'Mars'],[11,'Venus'],[19,'Mercury'],[24,'Jupiter'],[30,'Saturn']],
  Sagittarius: [[12,'Jupiter'],[17,'Venus'],[21,'Mercury'],[26,'Saturn'],[30,'Mars']],
  Capricorn: [[7,'Mercury'],[14,'Jupiter'],[22,'Venus'],[26,'Saturn'],[30,'Mars']],
  Aquarius: [[7,'Mercury'],[13,'Venus'],[20,'Jupiter'],[25,'Mars'],[30,'Saturn']],
  Pisces: [[12,'Venus'],[16,'Jupiter'],[19,'Mercury'],[28,'Mars'],[30,'Saturn']],
};

// Faces (decans) — each 10° ruled by Chaldean order
const FACES: [string, string, string][] = [
  // Aries
  ['Mars','Sun','Venus'],
  // Taurus
  ['Mercury','Moon','Saturn'],
  // Gemini
  ['Jupiter','Mars','Sun'],
  // Cancer
  ['Venus','Mercury','Moon'],
  // Leo
  ['Saturn','Jupiter','Mars'],
  // Virgo
  ['Sun','Venus','Mercury'],
  // Libra
  ['Moon','Saturn','Jupiter'],
  // Scorpio
  ['Mars','Sun','Venus'],
  // Sagittarius
  ['Mercury','Moon','Saturn'],
  // Capricorn
  ['Jupiter','Mars','Sun'],
  // Aquarius
  ['Venus','Mercury','Moon'],
  // Pisces
  ['Saturn','Jupiter','Mars'],
];

// Dignity point values (Ptolemaic)
const POINTS = { domicile: 5, exaltation: 4, triplicity: 3, term: 2, face: 1 };

function getSignIndex(sign: string): number {
  return SIGNS.indexOf(sign);
}

function getSignFromLongitude(lng: number): string {
  return SIGNS[Math.floor(((lng % 360) + 360) % 360 / 30)];
}

function getDegreeInSign(lng: number): number {
  return ((lng % 360) + 360) % 360 % 30;
}

function getTermRuler(sign: string, degree: number): string {
  const terms = TERMS[sign];
  if (!terms) return '';
  for (const [end, ruler] of terms) {
    if (degree < end) return ruler;
  }
  return terms[terms.length - 1][1];
}

function getFaceRuler(longitude: number): string {
  const signIdx = Math.floor(((longitude % 360) + 360) % 360 / 30);
  const deg = getDegreeInSign(longitude);
  const decanIdx = Math.min(Math.floor(deg / 10), 2);
  return FACES[signIdx][decanIdx];
}

function isDaytime(planets: Record<string, { longitude: number; house?: number }>, ascendant?: number): boolean {
  const sun = getPlanet(planets, 'Sun');
  if (!sun) return true;
  if (sun.house !== undefined) return sun.house >= 7 && sun.house <= 12;
  if (ascendant !== undefined) {
    let diff = sun.longitude - ascendant;
    while (diff < 0) diff += 360;
    while (diff >= 360) diff -= 360;
    return diff >= 180; // Sun above horizon
  }
  return true;
}

function calcAlmutenScores(longitude: number, daytime: boolean): Record<string, number> {
  const scores: Record<string, number> = {};
  const add = (planet: string, pts: number) => { scores[planet] = (scores[planet] || 0) + pts; };

  const sign = getSignFromLongitude(longitude);
  const deg = getDegreeInSign(longitude);

  // Domicile
  for (const ruler of DOMICILE[sign] || []) add(ruler, POINTS.domicile);

  // Exaltation
  const exalt = EXALTATION[sign];
  if (exalt) add(exalt, POINTS.exaltation);

  // Triplicity
  const trip = TRIPLICITY[sign];
  if (trip) {
    add(daytime ? trip.day : trip.night, POINTS.triplicity);
  }

  // Term
  const termRuler = getTermRuler(sign, deg);
  if (termRuler) add(termRuler, POINTS.term);

  // Face
  const faceRuler = getFaceRuler(longitude);
  if (faceRuler) add(faceRuler, POINTS.face);

  return scores;
}

export function AlmutenPanel({ natalChart, name }: Props) {
  const [showBreakdown, setShowBreakdown] = useState<number | null>(null);

  const ascendant = natalChart.angles?.ascendant ?? (natalChart.houses && 'ascendant' in natalChart.houses ? (natalChart.houses as any).ascendant : undefined);
  const mc = natalChart.angles?.midheaven ?? (natalChart.houses && 'mc' in natalChart.houses ? (natalChart.houses as any).mc : undefined);

  const daytime = useMemo(() =>
    isDaytime(natalChart.planets, ascendant),
    [natalChart, ascendant]
  );

  // Calculate almuten for each house cusp
  const houseAlmutens = useMemo(() => {
    const cusps = extractCusps(natalChart.houses as any);
    if (!cusps || cusps.length < 12) return [];

    return cusps.map((cusp, i) => {
      const scores = calcAlmutenScores(cusp, daytime);
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const almuten = sorted[0];
      return {
        house: i + 1,
        cusp,
        sign: getSignFromLongitude(cusp),
        degree: getDegreeInSign(cusp),
        almuten: almuten ? almuten[0] : '—',
        almutenScore: almuten ? almuten[1] : 0,
        scores: sorted,
      };
    });
  }, [natalChart, daytime]);

  // Chart almuten: sum scores across all house cusps + key points
  const chartAlmuten = useMemo(() => {
    const totalScores: Record<string, number> = {};
    const add = (planet: string, pts: number) => { totalScores[planet] = (totalScores[planet] || 0) + pts; };

    // Score from house cusps
    for (const h of houseAlmutens) {
      for (const [planet, score] of h.scores) add(planet, score);
    }

    // Score from key planets (Sun, Moon, ASC ruler, pre-natal lunation)
    const keyPoints = [
      ascendant,
      mc,
      getPlanet(natalChart.planets, 'Sun')?.longitude,
      getPlanet(natalChart.planets, 'Moon')?.longitude,
    ].filter((v): v is number => v !== undefined);

    for (const lng of keyPoints) {
      const scores = calcAlmutenScores(lng, daytime);
      for (const [planet, score] of Object.entries(scores)) add(planet, score * 2); // Double weight for key points
    }

    const sorted = Object.entries(totalScores).sort((a, b) => b[1] - a[1]);
    return sorted;
  }, [houseAlmutens, natalChart, daytime]);

  const maxScore = chartAlmuten[0]?.[1] || 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">Almuten Calculator</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {name ? `${name} — ` : ''}{daytime ? 'Diurnal' : 'Nocturnal'} chart
        </p>
      </div>

      <ToolGuide
        title="Almuten Calculator"
        description="Determines the strongest planet at each house cusp using Ptolemaic essential dignity scoring. The Chart Almuten is the single planet with the most dignified influence across all cusps and key points — a powerful indicator of the chart's overall 'boss planet'."
        tips={[
          "Scoring: Domicile +5, Exaltation +4, Triplicity +3, Term +2, Face +1",
          "Key points (ASC, MC, Sun, Moon) are weighted double because they're the chart's cornerstones",
          "Click any house row to expand and see the full dignity breakdown for that cusp",
          "The Chart Almuten often differs from the dominant planet — it reflects traditional dignity rather than modern prominence",
          "A diurnal chart (Sun above horizon) uses day triplicity rulers; nocturnal uses night rulers",
        ]}
      />

      {/* Chart Almuten */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-3">
        <h4 className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Chart Almuten (Overall Strongest Planet)</h4>
        <div className="space-y-1.5">
          {chartAlmuten.slice(0, 7).map(([planet, score]) => (
            <div key={planet} className="flex items-center gap-2">
              <span className="w-16 text-xs font-medium flex items-center gap-1">
                <span className="text-sm" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{PLANET_SYMBOLS[planet] || ''}</span>
                {planet}
              </span>
              <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(score / maxScore) * 100}%`,
                    backgroundColor: planet === chartAlmuten[0][0] ? '#FFD700' : '#6b7280',
                    opacity: planet === chartAlmuten[0][0] ? 1 : 0.5,
                  }}
                />
              </div>
              <span className="w-8 text-right text-xs text-muted-foreground tabular-nums">{score}</span>
            </div>
          ))}
        </div>
        {chartAlmuten[0] && (
          <div className="text-xs text-muted-foreground border-t border-border/30 pt-2 mt-2">
            <span className="font-medium text-foreground">{PLANET_SYMBOLS[chartAlmuten[0][0]]} {chartAlmuten[0][0]}</span> is the chart almuten
            — the planet with the most essential dignity across all house cusps and key points.
          </div>
        )}
      </div>

      {/* House Almutens */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-3">
        <h4 className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Almuten of Each House</h4>
        <p className="text-[11px] text-muted-foreground/70 mb-2">Click any row to expand the dignity breakdown</p>
        {houseAlmutens.length === 0 ? (
          <p className="text-xs text-muted-foreground/70 py-4 text-center">Birth time required for house data</p>
        ) : (
        <div className="space-y-0.5">
          {/* Header */}
          <div className="grid grid-cols-[40px_80px_1fr_60px] gap-2 text-[11px] text-muted-foreground/70 uppercase tracking-wider pb-1 border-b border-border/20">
            <span>House</span>
            <span>Cusp</span>
            <span>Almuten</span>
            <span className="text-right">Score</span>
          </div>
          {houseAlmutens.map((h, i) => (
            <React.Fragment key={h.house}>
              <button
                onClick={() => setShowBreakdown(showBreakdown === i ? null : i)}
                className="grid grid-cols-[40px_80px_1fr_60px] gap-2 items-center w-full text-left py-1.5 hover:bg-muted/30 rounded transition-colors group cursor-pointer"
              >
                <span className="text-xs font-medium text-muted-foreground">H{h.house}</span>
                <span className="text-xs text-muted-foreground">
                  {Math.floor(h.degree)}° {SIGN_SYMBOLS[getSignIndex(h.sign)]} {h.sign}
                </span>
                <span className="text-xs font-medium flex items-center gap-1">
                  <span className="text-sm" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{PLANET_SYMBOLS[h.almuten] || ''}</span>
                  {h.almuten}
                </span>
                <span className="text-xs text-muted-foreground text-right tabular-nums font-mono flex items-center gap-1">
                  {h.almutenScore}
                  <svg className={`w-3 h-3 text-muted-foreground/70 transition-transform ${showBreakdown === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {showBreakdown === i && (
                <div className="ml-10 mb-2 p-2 rounded bg-muted/20 text-xs space-y-0.5">
                  {h.scores.map(([planet, score]) => (
                    <div key={planet} className="flex items-center gap-2">
                      <span className="w-14"><span style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{PLANET_SYMBOLS[planet]}</span> {planet}</span>
                      <span className="text-muted-foreground font-mono">{score} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        )}
      </div>

      {/* Scoring Key */}
      <div className="text-[11px] text-muted-foreground/70 space-y-0.5 border-t border-border/20 pt-3">
        <div className="font-medium text-muted-foreground/70">Ptolemaic Dignity Scoring</div>
        <div>Domicile: +5 · Exaltation: +4 · Triplicity: +3 · Term: +2 · Face: +1</div>
        <div>Key points (ASC, MC, Sun, Moon) weighted ×2</div>
      </div>
    </div>
  );
}
