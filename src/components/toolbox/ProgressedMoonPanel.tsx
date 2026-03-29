/**
 * Progressed Moon Panel
 * Secondary progressed Moon tracker with sign ingresses, natal aspects, and timeline
 * Approximation: 1 day of ephemeris = 1 year of life; Moon moves ~12.19 deg/day avg
 */

import { useMemo } from 'react';
import { ToolGuide } from './ToolGuide';

const SYMBOL_FONT = { fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" };

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean; house?: number }>;
    houses?: { cusps?: number[]; ascendant?: number; mc?: number };
  };
  birthDate: string; // YYYY-MM-DD
  name?: string;
}

interface IngresEvent {
  date: Date;
  signIdx: number;
  sign: string;
  longitude: number;
}

interface AspectEvent {
  date: Date;
  planet: string;
  aspect: string;
  aspectAngle: number;
  moonLng: number;
  planetLng: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const SIGN_COLORS: Record<string, string> = {
  Aries: 'text-red-500', Taurus: 'text-emerald-500', Gemini: 'text-yellow-500',
  Cancer: 'text-slate-400', Leo: 'text-amber-500', Virgo: 'text-lime-500',
  Libra: 'text-pink-400', Scorpio: 'text-rose-600', Sagittarius: 'text-violet-400',
  Capricorn: 'text-stone-400', Aquarius: 'text-cyan-400', Pisces: 'text-indigo-400',
};

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '\u2609\uFE0E', moon: '\u263D\uFE0E', mercury: '\u263F\uFE0E', venus: '\u2640\uFE0E',
  mars: '\u2642\uFE0E', jupiter: '\u2643\uFE0E', saturn: '\u2644\uFE0E',
  uranus: '\u26E2\uFE0E', neptune: '\u2646\uFE0E', pluto: '\u2647\uFE0E',
  northnode: '\u260A\uFE0E', chiron: '\u26B7\uFE0E',
};

const PLANET_NAMES: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
  uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
  northnode: 'N.Node', chiron: 'Chiron',
};

const PLANET_COLORS: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  sun:       { bg: 'bg-amber-500/15',   text: 'text-amber-500',   ring: 'ring-amber-500/40',   bar: '#f59e0b' },
  moon:      { bg: 'bg-slate-300/20',   text: 'text-slate-400',   ring: 'ring-slate-400/40',   bar: '#94a3b8' },
  mercury:   { bg: 'bg-yellow-400/15',  text: 'text-yellow-500',  ring: 'ring-yellow-400/40',  bar: '#eab308' },
  venus:     { bg: 'bg-emerald-400/15', text: 'text-emerald-400', ring: 'ring-emerald-400/40', bar: '#34d399' },
  mars:      { bg: 'bg-red-500/15',     text: 'text-red-500',     ring: 'ring-red-500/40',     bar: '#ef4444' },
  jupiter:   { bg: 'bg-violet-400/15',  text: 'text-violet-400',  ring: 'ring-violet-400/40',  bar: '#a78bfa' },
  saturn:    { bg: 'bg-stone-400/15',   text: 'text-stone-400',   ring: 'ring-stone-400/40',   bar: '#a8a29e' },
  uranus:    { bg: 'bg-sky-400/15',     text: 'text-sky-400',     ring: 'ring-sky-400/40',     bar: '#38bdf8' },
  neptune:   { bg: 'bg-blue-400/15',    text: 'text-blue-400',    ring: 'ring-blue-400/40',    bar: '#60a5fa' },
  pluto:     { bg: 'bg-fuchsia-400/15', text: 'text-fuchsia-400', ring: 'ring-fuchsia-400/40', bar: '#e879f9' },
  northnode: { bg: 'bg-teal-400/15',    text: 'text-teal-400',    ring: 'ring-teal-400/40',    bar: '#2dd4bf' },
  chiron:    { bg: 'bg-orange-400/15',  text: 'text-orange-400',  ring: 'ring-orange-400/40',  bar: '#fb923c' },
};

const ASPECTS: { name: string; angle: number; symbol: string; color: string }[] = [
  { name: 'Conjunction', angle: 0,   symbol: '\u260C', color: 'text-amber-400' },
  { name: 'Opposition',  angle: 180, symbol: '\u260D', color: 'text-red-400' },
  { name: 'Trine',       angle: 120, symbol: '\u25B3', color: 'text-emerald-400' },
  { name: 'Square',      angle: 90,  symbol: '\u25A1', color: 'text-rose-400' },
  { name: 'Sextile',     angle: 60,  symbol: '\u2731', color: 'text-sky-400' },
];

/** Average Moon daily motion in degrees */
const MOON_DAILY_MOTION = 12.19;

/** Aspect orb in degrees for progressed Moon */
const ASPECT_ORB = 1.0;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeLng(lng: number): number {
  return ((lng % 360) + 360) % 360;
}

function signIdx(lng: number): number {
  return Math.floor(normalizeLng(lng) / 30) % 12;
}

function degInSign(lng: number): number {
  return normalizeLng(lng) % 30;
}

function formatDeg(lng: number): string {
  const n = normalizeLng(lng);
  const deg = Math.floor(n % 30);
  const min = Math.floor((n % 1) * 60);
  const sign = SIGNS[signIdx(n)];
  return `${deg}\u00B0${min.toString().padStart(2, '0')}\u2032 ${SIGN_SYMBOLS[sign]}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Calculate progressed Moon longitude for a given date */
function progressedMoonLng(natalMoonLng: number, birthDate: Date, targetDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysElapsed = (targetDate.getTime() - birthDate.getTime()) / msPerDay;
  const yearsElapsed = daysElapsed / 365.25;
  // 1 year = 1 day of Moon motion
  const progressedDegrees = yearsElapsed * MOON_DAILY_MOTION;
  return normalizeLng(natalMoonLng + progressedDegrees);
}

/** Get house from cusps array */
function getHouseFromCusps(lng: number, cusps: number[]): number {
  const n = normalizeLng(lng);
  for (let i = 0; i < 12; i++) {
    const cusp = normalizeLng(cusps[i]);
    const nextCusp = normalizeLng(cusps[(i + 1) % 12]);
    let inHouse: boolean;
    if (nextCusp > cusp) {
      inHouse = n >= cusp && n < nextCusp;
    } else {
      inHouse = n >= cusp || n < nextCusp;
    }
    if (inHouse) return i + 1;
  }
  return 1;
}

/** Check if angular distance is within orb of a given aspect angle */
function checkAspect(lng1: number, lng2: number, aspectAngle: number, orb: number): boolean {
  const diff = Math.abs(normalizeLng(lng1) - normalizeLng(lng2));
  const angular = Math.min(diff, 360 - diff);
  return Math.abs(angular - aspectAngle) <= orb;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProgressedMoonPanel({ natalChart, birthDate, name }: Props) {
  const data = useMemo(() => {
    const bd = new Date(birthDate + 'T12:00:00');
    const now = new Date();
    const natalMoonLng = natalChart.planets['moon']?.longitude ?? 0;

    // Current progressed Moon
    const currentLng = progressedMoonLng(natalMoonLng, bd, now);
    const currentSignIdx = signIdx(currentLng);
    const currentSign = SIGNS[currentSignIdx];

    // House position
    const cusps = natalChart.houses?.cusps;
    const currentHouse = cusps && cusps.length >= 12
      ? getHouseFromCusps(currentLng, cusps)
      : null;

    // Build timeline: monthly points for 3 years back and 3 years forward
    const msPerDay = 1000 * 60 * 60 * 24;
    const startDate = new Date(now.getTime() - 365.25 * msPerDay * 1); // 1 year back
    const endDate = new Date(now.getTime() + 365.25 * msPerDay * 3);   // 3 years forward
    const totalMonths = Math.round((endDate.getTime() - startDate.getTime()) / (msPerDay * 30.44));

    // Monthly positions
    const monthlyPoints: { date: Date; lng: number; signIdx: number; sign: string }[] = [];
    for (let m = 0; m <= totalMonths; m++) {
      const d = new Date(startDate.getTime() + m * 30.44 * msPerDay);
      const lng = progressedMoonLng(natalMoonLng, bd, d);
      const sIdx = signIdx(lng);
      monthlyPoints.push({ date: d, lng, signIdx: sIdx, sign: SIGNS[sIdx] });
    }

    // Sign ingresses
    const ingresses: IngresEvent[] = [];
    for (let i = 1; i < monthlyPoints.length; i++) {
      if (monthlyPoints[i].signIdx !== monthlyPoints[i - 1].signIdx) {
        // Approximate the exact ingress date by interpolation
        const prevLng = monthlyPoints[i - 1].lng;
        let nextSignBoundary = Math.ceil(prevLng / 30) * 30;
        // If longitude is exactly on a sign boundary, advance to the next one
        if (nextSignBoundary === prevLng || Math.abs(nextSignBoundary - prevLng) < 0.0001) {
          nextSignBoundary += 30;
        }
        const degToGo = normalizeLng(nextSignBoundary - prevLng);
        const degPerMonth = MOON_DAILY_MOTION / 12.175; // avg deg per month (~1.0 deg/month)
        const monthFraction = degToGo / degPerMonth;
        const ingressTime = monthlyPoints[i - 1].date.getTime() + monthFraction * 30.44 * msPerDay;
        const ingressDate = new Date(ingressTime);

        ingresses.push({
          date: ingressDate,
          signIdx: monthlyPoints[i].signIdx,
          sign: monthlyPoints[i].sign,
          longitude: normalizeLng(nextSignBoundary),
        });
      }
    }

    // Aspects to natal planets (check monthly, fine-grained for 3-year window)
    const aspectPlanets = Object.entries(natalChart.planets).filter(
      ([key]) => key !== 'moon' && PLANET_NAMES[key]
    );

    const aspectEvents: AspectEvent[] = [];
    // Check weekly for better precision
    const totalWeeks = Math.round((endDate.getTime() - now.getTime()) / (msPerDay * 7));
    for (let w = 0; w <= totalWeeks; w++) {
      const d = new Date(now.getTime() + w * 7 * msPerDay);
      const mLng = progressedMoonLng(natalMoonLng, bd, d);

      for (const [pKey, pData] of aspectPlanets) {
        for (const asp of ASPECTS) {
          if (checkAspect(mLng, pData.longitude, asp.angle, ASPECT_ORB)) {
            // Avoid duplicates: check if we already have a similar event within 30 days
            const isDuplicate = aspectEvents.some(
              (e) =>
                e.planet === pKey &&
                e.aspectAngle === asp.angle &&
                Math.abs(e.date.getTime() - d.getTime()) < 30 * msPerDay
            );
            if (!isDuplicate) {
              aspectEvents.push({
                date: d,
                planet: pKey,
                aspect: asp.name,
                aspectAngle: asp.angle,
                moonLng: mLng,
                planetLng: pData.longitude,
              });
            }
          }
        }
      }
    }

    // Sort aspects by date
    aspectEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      bd, now, natalMoonLng, currentLng, currentSign, currentSignIdx, currentHouse,
      monthlyPoints, ingresses, aspectEvents, startDate, endDate,
    };
  }, [natalChart, birthDate]);

  const {
    currentLng, currentSign, currentSignIdx, currentHouse,
    monthlyPoints, ingresses, aspectEvents, now, startDate, endDate,
  } = data;

  const moonColors = PLANET_COLORS.moon;

  if (!birthDate) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Enter a birth date to use this tool
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">
          Progressed Moon {name ? <span className="text-muted-foreground font-normal">for {name}</span> : null}
        </h3>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Secondary progressions &mdash; 1 day = 1 year &mdash; approximate ~12.19&deg;/yr
        </p>
      </div>

      <ToolGuide
        title="Progressed Moon"
        description="Tracks the secondary progressed Moon — the single most important progression. Using the 'day for a year' method, the Moon moves roughly 1° per month (12-14° per year), changing signs every ~2.5 years. Each sign change marks a major emotional and life shift."
        tips={[
          "The progressed Moon's current sign shows your prevailing emotional tone and needs right now",
          "Sign ingresses (when it changes signs) are pivotal — expect a noticeable shift in mood and focus",
          "Aspects to natal planets activate those planets' themes — conjunctions and oppositions are strongest",
          "The house timeline shows which life area the progressed Moon is illuminating",
          "Look 6-12 months ahead to see what emotional themes are approaching",
        ]}
      />

      {/* Current Position Card */}
      <div className={`rounded-lg border ${moonColors.ring} ring-1 ${moonColors.bg} p-3`}>
        <div className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-1">
          Current Progressed Moon
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${SIGN_COLORS[currentSign] || 'text-foreground'}`} style={SYMBOL_FONT}>
            {SIGN_SYMBOLS[currentSign]}
          </span>
          <div>
            <div className="text-base font-bold font-mono tabular-nums">{formatDeg(currentLng)}</div>
            <div className="text-xs text-muted-foreground">
              {currentSign}
              {currentHouse && <span> &middot; House {currentHouse}</span>}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-muted-foreground/60">Degree in sign</div>
            <div className="text-xs font-mono font-medium">
              {degInSign(currentLng).toFixed(1)}&deg; / 30&deg;
            </div>
          </div>
        </div>

        {/* Mini progress through sign */}
        <div className="mt-2 h-1.5 rounded-full bg-muted/20 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(degInSign(currentLng) / 30) * 100}%`,
              backgroundColor: moonColors.bar,
            }}
          />
        </div>
      </div>

      {/* Visual Timeline */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
          Sign Timeline
        </h4>
        <TimelineVisual
          monthlyPoints={monthlyPoints}
          ingresses={ingresses}
          now={now}
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      {/* Sign Ingresses */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
          Sign Ingresses
        </h4>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          {ingresses.length === 0 ? (
            <div className="text-xs text-muted-foreground/70 p-3 text-center">
              No sign changes in the displayed range
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {ingresses.map((ing, i) => {
                const isPast = ing.date.getTime() < now.getTime();
                const isCurrent = ing.signIdx === currentSignIdx;
                const sc = SIGN_COLORS[ing.sign] || 'text-foreground';
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 transition-colors cursor-pointer ${
                      isCurrent ? 'bg-foreground/5 font-medium' : 'hover:bg-muted/30'
                    } ${isPast ? 'opacity-50' : ''}`}
                  >
                    <span className={`text-sm ${sc}`} style={SYMBOL_FONT}>{SIGN_SYMBOLS[ing.sign]}</span>
                    <span className="text-xs flex-1">{ing.sign}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(ing.date)}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                        NOW
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Aspects to Natal Planets */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
          Progressed Moon Aspects to Natal (1&deg; orb)
        </h4>
        <div className="rounded-lg border border-border/50 overflow-hidden overflow-x-auto max-h-[400px] overflow-y-auto">
          {aspectEvents.length === 0 ? (
            <div className="text-xs text-muted-foreground/70 p-3 text-center">
              No exact aspects in the displayed range
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left px-2.5 py-1.5 text-xs font-medium text-muted-foreground/60">Date</th>
                  <th className="text-left px-2.5 py-1.5 text-xs font-medium text-muted-foreground/60">Aspect</th>
                  <th className="text-left px-2.5 py-1.5 text-xs font-medium text-muted-foreground/60">Planet</th>
                  <th className="text-right px-2.5 py-1.5 text-xs font-medium text-muted-foreground/60">
                    <span style={SYMBOL_FONT}>{PLANET_SYMBOLS.moon}</span> Lng
                  </th>
                </tr>
              </thead>
              <tbody>
                {aspectEvents.slice(0, 30).map((ev, i) => {
                  const isPast = ev.date.getTime() < now.getTime();
                  const aspDef = ASPECTS.find((a) => a.angle === ev.aspectAngle);
                  const pc = PLANET_COLORS[ev.planet] || PLANET_COLORS.sun;
                  return (
                    <tr
                      key={i}
                      className={`border-b border-border/20 transition-colors cursor-pointer ${isPast ? 'opacity-40' : 'hover:bg-muted/30'}`}
                    >
                      <td className="px-2.5 py-1.5 text-muted-foreground font-mono tabular-nums">
                        {formatFullDate(ev.date)}
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className={aspDef?.color || ''} style={SYMBOL_FONT}>{aspDef?.symbol || '?'}</span>
                        <span className="ml-1 text-muted-foreground">{ev.aspect}</span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className={pc.text} style={SYMBOL_FONT}>{PLANET_SYMBOLS[ev.planet] || '?'}</span>
                        <span className="ml-1">{PLANET_NAMES[ev.planet] || ev.planet}</span>
                      </td>
                      <td className="px-2.5 py-1.5 text-right text-muted-foreground font-mono tabular-nums text-xs">
                        {formatDeg(ev.moonLng)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {aspectEvents.length > 30 && (
          <div className="text-[11px] text-muted-foreground/60 mt-1 text-center">
            Showing 30 of {aspectEvents.length} aspects
          </div>
        )}
      </div>

      {/* House Positions Over Time */}
      {data.bd && data.now && natalChart.houses?.cusps && natalChart.houses.cusps.length >= 12 && (
        <HouseTimeline
          monthlyPoints={monthlyPoints}
          cusps={natalChart.houses.cusps}
          now={now}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function TimelineVisual({
  monthlyPoints,
  ingresses,
  now,
  startDate,
  endDate,
}: {
  monthlyPoints: { date: Date; lng: number; signIdx: number; sign: string }[];
  ingresses: IngresEvent[];
  now: Date;
  startDate: Date;
  endDate: Date;
}) {
  const totalSpan = endDate.getTime() - startDate.getTime();
  if (totalSpan <= 0 || monthlyPoints.length === 0) return null;

  const nowPct = Math.min(Math.max((now.getTime() - startDate.getTime()) / totalSpan, 0), 1) * 100;

  // Build segments by sign
  type Segment = { signIdx: number; sign: string; startPct: number; endPct: number };
  const segments: Segment[] = [];
  let currentSeg: Segment | null = null;

  for (const pt of monthlyPoints) {
    const pct = ((pt.date.getTime() - startDate.getTime()) / totalSpan) * 100;
    if (!currentSeg || currentSeg.signIdx !== pt.signIdx) {
      if (currentSeg) {
        currentSeg.endPct = pct;
        segments.push(currentSeg);
      }
      currentSeg = { signIdx: pt.signIdx, sign: pt.sign, startPct: pct, endPct: 100 };
    }
  }
  if (currentSeg) segments.push(currentSeg);

  return (
    <div>
      <div className="relative h-8 rounded-md overflow-hidden bg-muted/30 border border-border/40 flex">
        {segments.map((seg, i) => {
          const width = seg.endPct - seg.startPct;
          const sc = SIGN_COLORS[seg.sign] || 'text-foreground';
          return (
            <div
              key={i}
              className="relative flex items-center justify-center border-r border-border/20 last:border-r-0"
              style={{
                width: `${width}%`,
                left: i === 0 ? `${seg.startPct}%` : undefined,
              }}
              title={seg.sign}
            >
              {width > 5 && (
                <span className={`text-xs leading-none ${sc} font-medium`} style={SYMBOL_FONT}>
                  {SIGN_SYMBOLS[seg.sign]}
                </span>
              )}
              {width > 12 && (
                <span className="text-[11px] text-muted-foreground/60 ml-0.5">
                  {seg.sign.slice(0, 3)}
                </span>
              )}
            </div>
          );
        })}

        {/* Now marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/80 z-10"
          style={{ left: `${nowPct}%` }}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-foreground" />
        </div>
      </div>

      {/* Year labels */}
      <div className="flex justify-between mt-0.5">
        <span className="text-[11px] text-muted-foreground/60">
          {startDate.getFullYear()}
        </span>
        <span className="text-[11px] text-muted-foreground/60 font-medium">Now</span>
        <span className="text-[11px] text-muted-foreground/60">
          {endDate.getFullYear()}
        </span>
      </div>
    </div>
  );
}

function HouseTimeline({
  monthlyPoints,
  cusps,
  now,
}: {
  monthlyPoints: { date: Date; lng: number; signIdx: number; sign: string }[];
  cusps: number[];
  now: Date;
}) {
  // Find house changes
  type HouseEntry = { date: Date; house: number; lng: number };
  const entries: HouseEntry[] = [];
  let lastHouse = -1;

  for (const pt of monthlyPoints) {
    const h = getHouseFromCusps(pt.lng, cusps);
    if (h !== lastHouse) {
      entries.push({ date: pt.date, house: h, lng: pt.lng });
      lastHouse = h;
    }
  }

  if (entries.length === 0) return null;

  const HOUSE_TOPICS: Record<number, string> = {
    1: 'Self', 2: 'Resources', 3: 'Communication', 4: 'Home',
    5: 'Creativity', 6: 'Health', 7: 'Partnerships', 8: 'Transformation',
    9: 'Philosophy', 10: 'Career', 11: 'Community', 12: 'Spirituality',
  };

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
        House Transits (Natal Houses)
      </h4>
      <div className="grid gap-1">
        {entries.map((entry, i) => {
          const isPast = entry.date.getTime() < now.getTime();
          const isLast = i === entries.length - 1;
          const endDate = isLast ? null : entries[i + 1].date;
          const isCurrent = isPast && (!endDate || endDate.getTime() > now.getTime());

          return (
            <div
              key={i}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${
                isCurrent
                  ? 'bg-foreground/5 ring-1 ring-foreground/10 border-transparent font-medium'
                  : isPast
                  ? 'border-border/20 opacity-40 hover:opacity-60'
                  : 'border-border/30 hover:bg-muted/30'
              }`}
            >
              <span className="text-xs font-mono w-6 text-center text-muted-foreground">
                H{entry.house}
              </span>
              <span className="text-xs flex-1">
                {HOUSE_TOPICS[entry.house] || `House ${entry.house}`}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(entry.date)}
                {endDate && <span> &mdash; {formatDate(endDate)}</span>}
              </span>
              {isCurrent && (
                <span className="text-[11px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  NOW
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
