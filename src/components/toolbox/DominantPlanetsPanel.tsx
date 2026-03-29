/**
 * Dominant Planets & Elements Panel
 * Scores and ranks planetary dominance, element/mode balance, polarity, and temperament.
 */

import React, { useMemo, useState } from 'react';
import { ToolGuide } from './ToolGuide';
import { InterpretationCard } from './InterpretationCard';
import { TEMPERAMENT_DESCRIPTIONS } from '../../data/toolboxInterpretations';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean; house?: number }>;
    houses?: { cusps?: number[]; ascendant?: number; mc?: number };
  };
  name?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609\uFE0E', Moon: '\u263D\uFE0E', Mercury: '\u263F\uFE0E', Venus: '\u2640\uFE0E', Mars: '\u2642\uFE0E',
  Jupiter: '\u2643\uFE0E', Saturn: '\u2644\uFE0E', Uranus: '\u26E2\uFE0E', Neptune: '\u2646\uFE0E', Pluto: '\u2647\uFE0E',
};

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const ELEMENT_MAP: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

const MODE_MAP: Record<string, 'Cardinal' | 'Fixed' | 'Mutable'> = {
  Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal',
  Taurus: 'Fixed', Leo: 'Fixed', Scorpio: 'Fixed', Aquarius: 'Fixed',
  Gemini: 'Mutable', Virgo: 'Mutable', Sagittarius: 'Mutable', Pisces: 'Mutable',
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#ef4444', Earth: '#a3752c', Air: '#3b82f6', Water: '#06b6d4',
};

const MODE_COLORS: Record<string, string> = {
  Cardinal: '#f59e0b', Fixed: '#8b5cf6', Mutable: '#10b981',
};

/** Traditional rulership: sign -> ruling planet */
const SIGN_RULER: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

/** Domicile: planet -> signs it rules */
const DOMICILE: Record<string, string[]> = {
  Sun: ['Leo'], Moon: ['Cancer'], Mercury: ['Gemini', 'Virgo'], Venus: ['Taurus', 'Libra'],
  Mars: ['Aries', 'Scorpio'], Jupiter: ['Sagittarius', 'Pisces'], Saturn: ['Capricorn', 'Aquarius'],
  Uranus: ['Aquarius'], Neptune: ['Pisces'], Pluto: ['Scorpio'],
};

/** Exaltation: planet -> sign */
const EXALTATION: Record<string, string> = {
  Sun: 'Aries', Moon: 'Taurus', Mercury: 'Virgo', Venus: 'Pisces',
  Mars: 'Capricorn', Jupiter: 'Cancer', Saturn: 'Libra',
};

/** Detriment: planet -> signs */
const DETRIMENT: Record<string, string[]> = {
  Sun: ['Aquarius'], Moon: ['Capricorn'], Mercury: ['Sagittarius', 'Pisces'],
  Venus: ['Aries', 'Scorpio'], Mars: ['Taurus', 'Libra'],
  Jupiter: ['Gemini', 'Virgo'], Saturn: ['Cancer', 'Leo'],
  Uranus: ['Leo'], Neptune: ['Virgo'], Pluto: ['Taurus'],
};

/** Fall: planet -> sign */
const FALL: Record<string, string> = {
  Sun: 'Libra', Moon: 'Scorpio', Mercury: 'Pisces', Venus: 'Virgo',
  Mars: 'Cancer', Jupiter: 'Capricorn', Saturn: 'Aries',
};

const MAJOR_ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8 },
  { name: 'Sextile', angle: 60, orb: 6 },
  { name: 'Square', angle: 90, orb: 7 },
  { name: 'Trine', angle: 120, orb: 8 },
  { name: 'Opposition', angle: 180, orb: 8 },
];

const TEMPERAMENT_MAP: Record<string, Record<string, string>> = {
  Fire:  { Cardinal: 'Choleric-Cardinal', Fixed: 'Choleric-Fixed', Mutable: 'Choleric-Mutable' },
  Earth: { Cardinal: 'Melancholic-Cardinal', Fixed: 'Melancholic-Fixed', Mutable: 'Melancholic-Mutable' },
  Air:   { Cardinal: 'Sanguine-Cardinal', Fixed: 'Sanguine-Fixed', Mutable: 'Sanguine-Mutable' },
  Water: { Cardinal: 'Phlegmatic-Cardinal', Fixed: 'Phlegmatic-Fixed', Mutable: 'Phlegmatic-Mutable' },
};

const TEMPERAMENT_LABEL: Record<string, string> = {
  Fire: 'Choleric', Earth: 'Melancholic', Air: 'Sanguine', Water: 'Phlegmatic',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function angularDist(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function getAscSign(asc: number): string {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  return signs[Math.floor((asc % 360) / 30)];
}

/* ------------------------------------------------------------------ */
/*  Scoring Engine                                                     */
/* ------------------------------------------------------------------ */

interface PlanetScore {
  planet: string;
  total: number;
  breakdown: { label: string; value: number }[];
  sign: string;
  house?: number;
  retrograde?: boolean;
}

function computeScores(props: Props): {
  scores: PlanetScore[];
  elements: Record<string, number>;
  modes: Record<string, number>;
  polarity: { positive: number; negative: number };
  chartRuler: string | null;
  chartRulerSign: string | null;
  ascSign: string | null;
} {
  const { planets, houses } = props.natalChart;
  const asc = houses?.ascendant ?? houses?.cusps?.[0];
  const mc = houses?.mc ?? houses?.cusps?.[9];
  const ascSign = asc != null ? getAscSign(asc) : null;
  const chartRuler = ascSign ? (SIGN_RULER[ascSign] ?? null) : null;

  const planetNames = Object.keys(planets).filter(p => PLANET_SYMBOLS[p]);

  // Count aspects received per planet
  const aspectCount: Record<string, number> = {};
  for (const p of planetNames) aspectCount[p] = 0;

  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const pA = planetNames[i], pB = planetNames[j];
      const dist = angularDist(planets[pA].longitude, planets[pB].longitude);
      for (const asp of MAJOR_ASPECTS) {
        if (Math.abs(dist - asp.angle) <= asp.orb) {
          aspectCount[pA]++;
          aspectCount[pB]++;
          break; // only count one aspect per pair
        }
      }
    }
  }

  const elements: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modes: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  const polarity = { positive: 0, negative: 0 };

  const scores: PlanetScore[] = planetNames.map(name => {
    const p = planets[name];
    const breakdown: { label: string; value: number }[] = [];
    let total = 0;

    // Element / mode / polarity tallying
    const el = ELEMENT_MAP[p.sign];
    const mo = MODE_MAP[p.sign];
    if (el) elements[el]++;
    if (mo) modes[mo]++;
    if (el === 'Fire' || el === 'Air') polarity.positive++;
    else polarity.negative++;

    // 1. House-based score
    const h = p.house;
    if (h != null) {
      if ([1, 4, 7, 10].includes(h)) { total += 4; breakdown.push({ label: 'Angular house', value: 4 }); }
      else if ([2, 5, 8, 11].includes(h)) { total += 2; breakdown.push({ label: 'Succedent house', value: 2 }); }
      else { total += 1; breakdown.push({ label: 'Cadent house', value: 1 }); }
    }

    // 2. Conjunct ASC or MC
    if (asc != null && angularDist(p.longitude, asc) <= 8) {
      total += 4; breakdown.push({ label: 'Conjunct ASC', value: 4 });
    }
    if (mc != null && angularDist(p.longitude, mc) <= 8) {
      total += 4; breakdown.push({ label: 'Conjunct MC', value: 4 });
    }

    // 3. Luminary bonus
    if (name === 'Sun' || name === 'Moon') {
      total += 2; breakdown.push({ label: 'Luminary bonus', value: 2 });
    }

    // 4. Chart ruler
    if (chartRuler === name) {
      total += 3; breakdown.push({ label: 'Chart ruler', value: 3 });
    }

    // 5. Aspects received
    const ac = aspectCount[name] || 0;
    if (ac > 0) {
      total += ac; breakdown.push({ label: `Aspects received (${ac})`, value: ac });
    }

    // 6. Dignity
    if (DOMICILE[name]?.includes(p.sign)) {
      total += 2; breakdown.push({ label: 'Domicile', value: 2 });
    } else if (EXALTATION[name] === p.sign) {
      total += 2; breakdown.push({ label: 'Exaltation', value: 2 });
    }

    // 7. Debilitation
    if (DETRIMENT[name]?.includes(p.sign)) {
      total -= 1; breakdown.push({ label: 'Detriment', value: -1 });
    } else if (FALL[name] === p.sign) {
      total -= 1; breakdown.push({ label: 'Fall', value: -1 });
    }

    return { planet: name, total, breakdown, sign: p.sign, house: p.house, retrograde: p.retrograde };
  });

  scores.sort((a, b) => b.total - a.total);

  return { scores, elements, modes, polarity, chartRuler, chartRulerSign: chartRuler ? planets[chartRuler]?.sign : null, ascSign };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onTouchStart={() => setShow(s => !s)}>
      {children}
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs leading-tight bg-popover text-foreground rounded shadow-lg whitespace-pre-line max-w-[200px] pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function DominantPlanetsPanel({ natalChart, name }: Props) {
  const data = useMemo(() => computeScores({ natalChart, name }), [natalChart, name]);
  const { scores, elements, modes, polarity, chartRuler, chartRulerSign, ascSign } = data;

  if (scores.length === 0) {
    return (
      <div className="space-y-5 text-sm">
        <div>
          <h3 className="text-sm font-semibold">Dominant Planets & Elements</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Planetary scoring, element/mode balance, and temperament analysis
          </p>
        </div>
        <div className="text-xs text-muted-foreground/70 text-center py-8 rounded-lg border border-border/30 bg-muted/10">
          Enter a birth date to use this tool
        </div>
      </div>
    );
  }

  const maxScore = Math.max(...scores.map(s => s.total), 1);

  const totalElements = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
  const dominantElement = Object.entries(elements).sort((a, b) => b[1] - a[1])[0][0];
  const dominantMode = Object.entries(modes).sort((a, b) => b[1] - a[1])[0][0];

  const temperament = TEMPERAMENT_LABEL[dominantElement] ?? 'Mixed';
  const temperamentFull = TEMPERAMENT_MAP[dominantElement]?.[dominantMode] ?? `${temperament}-${dominantMode}`;

  const totalPolarity = polarity.positive + polarity.negative || 1;
  const positivePct = Math.round((polarity.positive / totalPolarity) * 100);

  const chartRulerData = chartRuler ? scores.find(s => s.planet === chartRuler) : null;

  return (
    <div className="space-y-5 text-sm">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">
          Dominant Planets & Elements
          {name ? <span className="text-muted-foreground font-normal"> for {name}</span> : null}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Planetary scoring, element/mode balance, and temperament analysis
        </p>
      </div>

      <ToolGuide
        title="Dominant Planets"
        description="Calculates which planets have the strongest influence in your chart using a weighted scoring system. Points are awarded for sign rulership, house placement, aspects, and angular positions. The chart ruler (ruler of the Ascendant sign) gets special prominence."
        tips={[
          "The top-scoring planet is your chart's dominant force — its themes permeate your personality and life",
          "Angular planets (near ASC, MC, DSC, IC) score higher because they're more visible and active",
          "The element and mode breakdowns show your overall temperament balance (fire/earth/air/water, cardinal/fixed/mutable)",
          "A planet with many aspects is well-connected and influential regardless of other factors",
          "Compare your dominant planet with your Sun sign — if they differ, both themes coexist in you",
        ]}
      />

      {/* ---- Chart Ruler ---- */}
      {chartRulerData && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
          <div className="text-xs text-indigo-600 dark:text-indigo-300 font-medium uppercase tracking-wider mb-1">
            Chart Ruler
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <span className="text-2xl" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{PLANET_SYMBOLS[chartRuler!]}</span>
            <div>
              <span className="font-semibold">{chartRuler}</span>
              <span className="text-muted-foreground ml-1.5">
                in {SIGN_SYMBOLS[chartRulerData.sign] ?? ''} {chartRulerData.sign}
                {chartRulerData.house != null && ` / House ${chartRulerData.house}`}
                {chartRulerData.retrograde && ' (R)'}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">
            Rules {ascSign && `${SIGN_SYMBOLS[ascSign] ?? ''} ${ascSign}`} Ascendant
            {' '} | Score: {chartRulerData.total}
          </div>
        </div>
      )}

      {/* ---- Dominant Planets Bar Chart ---- */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-2">Dominant Planets</h4>
        <div className="space-y-1.5">
          {scores.map((s, i) => {
            const pct = Math.max((s.total / maxScore) * 100, 0);
            const barColor = i === 0 ? '#f59e0b' : i === 1 ? '#a78bfa' : i === 2 ? '#60a5fa' : '#6b7280';
            const tooltipText = s.breakdown.map(b => `${b.label}: ${b.value > 0 ? '+' : ''}${b.value}`).join('\n');
            return (
              <Tooltip key={s.planet} text={tooltipText || 'No bonuses'}>
                <div className="flex items-center gap-2 w-full cursor-default">
                  <span className="w-5 text-center text-base leading-none" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{PLANET_SYMBOLS[s.planet]}</span>
                  <span className="w-16 text-xs text-foreground/80 truncate">{s.planet}</span>
                  <div className="flex-1 h-4 bg-muted/40 rounded-sm overflow-hidden relative">
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-mono text-muted-foreground">{s.total}</span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </section>

      {/* ---- Element Balance ---- */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-2">Element Balance</h4>
        <div className="grid grid-cols-4 gap-2">
          {(['Fire', 'Earth', 'Air', 'Water'] as const).map(el => {
            const count = elements[el];
            const pct = Math.round((count / totalElements) * 100);
            const isDominant = el === dominantElement;
            return (
              <div key={el} className={`rounded-lg p-2 text-center ${isDominant ? 'ring-1 ring-primary/30' : ''}`} style={{ backgroundColor: ELEMENT_COLORS[el] + '18' }}>
                <div className="text-lg font-bold" style={{ color: ELEMENT_COLORS[el] }}>{count}</div>
                <div className="text-xs text-muted-foreground">{el}</div>
                <div className="mt-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: ELEMENT_COLORS[el] }} />
                </div>
                <div className="text-[11px] text-muted-foreground/70 mt-0.5">{pct}%</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Mode Balance ---- */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-2">Mode Balance</h4>
        <div className="grid grid-cols-3 gap-2">
          {(['Cardinal', 'Fixed', 'Mutable'] as const).map(mo => {
            const count = modes[mo];
            const totalModes = Object.values(modes).reduce((a, b) => a + b, 0) || 1;
            const pct = Math.round((count / totalModes) * 100);
            const isDominant = mo === dominantMode;
            return (
              <div key={mo} className={`rounded-lg p-2 text-center ${isDominant ? 'ring-1 ring-primary/30' : ''}`} style={{ backgroundColor: MODE_COLORS[mo] + '18' }}>
                <div className="text-lg font-bold" style={{ color: MODE_COLORS[mo] }}>{count}</div>
                <div className="text-xs text-muted-foreground">{mo}</div>
                <div className="mt-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: MODE_COLORS[mo] }} />
                </div>
                <div className="text-[11px] text-muted-foreground/70 mt-0.5">{pct}%</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Polarity Gauge ---- */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-2">Polarity</h4>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Positive / Masculine</span>
            <span>Negative / Feminine</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${positivePct}%`, backgroundColor: '#f59e0b' }}
            />
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${100 - positivePct}%`, backgroundColor: '#8b5cf6' }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-amber-400 font-mono">{polarity.positive} ({positivePct}%)</span>
            <span className="text-purple-400 font-mono">{polarity.negative} ({100 - positivePct}%)</span>
          </div>
        </div>
      </section>

      {/* ---- Temperament ---- */}
      <section>
        <h4 className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-2">Temperament</h4>
        <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: ELEMENT_COLORS[dominantElement] + '30', color: ELEMENT_COLORS[dominantElement] }}
          >
            {dominantElement === 'Fire' ? '\uD83D\uDD25' : dominantElement === 'Earth' ? '\u26F0' : dominantElement === 'Air' ? '\uD83D\uDCA8' : '\uD83C\uDF0A'}
          </div>
          <div>
            <div className="text-foreground font-semibold">{temperament}</div>
            <div className="text-xs text-muted-foreground/70">{temperamentFull} ({dominantElement} + {dominantMode})</div>
          </div>
        </div>
        {TEMPERAMENT_DESCRIPTIONS[dominantElement] && (
          <InterpretationCard element={dominantElement.toLowerCase() as 'fire' | 'earth' | 'air' | 'water'} title="Your Temperament">
            {TEMPERAMENT_DESCRIPTIONS[dominantElement]}
          </InterpretationCard>
        )}
      </section>
    </div>
  );
}
