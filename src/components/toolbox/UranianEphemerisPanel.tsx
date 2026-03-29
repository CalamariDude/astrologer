/**
 * Uranian Ephemeris Panel
 * Graphic ephemeris in 45-degree or 90-degree modulus.
 * Transit planet curves plotted over time with natal planet horizontal reference lines.
 * Where a transit curve crosses a natal line = a "hit."
 * Pure SVG rendering, no external chart dependencies.
 */

import React, { useState, useMemo } from 'react';
import { ToolGuide } from './ToolGuide';

/* ── Types ── */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean }>;
  };
  birthDate: string;
  name?: string;
}

/* ── Constants ── */

const PLANETS_ORDER = ['Sun','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609\uFE0E', Mercury: '\u263F\uFE0E', Venus: '\u2640\uFE0E', Mars: '\u2642\uFE0E',
  Jupiter: '\u2643\uFE0E', Saturn: '\u2644\uFE0E', Uranus: '\u26E2\uFE0E', Neptune: '\u2646\uFE0E', Pluto: '\u2647\uFE0E',
};

const PLANET_COLORS: Record<string, string> = {
  Sun: '#FFD700',
  Mercury: '#00CED1',
  Venus: '#FF69B4',
  Mars: '#FF4500',
  Jupiter: '#9370DB',
  Saturn: '#8B4513',
  Uranus: '#42A5F5',
  Neptune: '#4DD0E1',
  Pluto: '#78909C',
};

/** Approximate daily motion in degrees for each planet */
const DAILY_MOTION: Record<string, number> = {
  Sun: 0.9856,
  Mercury: 1.2,
  Venus: 1.0,
  Mars: 0.524,
  Jupiter: 0.0831,
  Saturn: 0.0335,
  Uranus: 0.0117,
  Neptune: 0.006,
  Pluto: 0.004,
};

/** Natal line colors (slightly muted versions) */
const NATAL_LINE_COLORS: Record<string, string> = {
  Sun: '#FFD70080',
  Mercury: '#00CED180',
  Venus: '#FF69B480',
  Mars: '#FF450080',
  Jupiter: '#9370DB80',
  Saturn: '#8B451380',
  Uranus: '#42A5F580',
  Neptune: '#4DD0E180',
  Pluto: '#78909C80',
};

/* ── SVG Layout ── */

const SVG_WIDTH = 720;
const SVG_HEIGHT = 420;
const MARGIN = { top: 30, right: 20, bottom: 40, left: 50 };
const CHART_W = SVG_WIDTH - MARGIN.left - MARGIN.right;
const CHART_H = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Helpers ── */

function mod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Get approximate longitude for a planet on a given day,
 *  starting from a known reference longitude on a reference date.
 *  This uses a simplistic linear model (good enough for a graphic ephemeris overview). */
function approxLongitude(referenceLng: number, dailyRate: number, dayOffset: number): number {
  return (referenceLng + dailyRate * dayOffset) % 360;
}

/** Detect crossings: find points where the transit curve crosses a natal horizontal line. */
function findCrossings(
  transitPoints: { x: number; y: number }[],
  natalY: number,
  modulus: number,
): { x: number; y: number }[] {
  const hits: { x: number; y: number }[] = [];
  const threshold = modulus * 0.4; // skip wrap-around false crossings

  for (let i = 1; i < transitPoints.length; i++) {
    const prev = transitPoints[i - 1];
    const curr = transitPoints[i];

    // Skip if the segment wraps around (jump > threshold)
    if (Math.abs(curr.y - prev.y) > threshold) continue;

    const dy1 = prev.y - natalY;
    const dy2 = curr.y - natalY;

    if (dy1 * dy2 < 0 || dy1 === 0 || dy2 === 0) {
      // Linear interpolation for crossing x
      const t = Math.abs(dy1) < 0.001 ? 0 : Math.abs(dy1) / (Math.abs(dy1) + Math.abs(dy2));
      const cx = prev.x + t * (curr.x - prev.x);
      hits.push({ x: cx, y: natalY });
    }
  }
  return hits;
}

/* ── Component ── */

export function UranianEphemerisPanel({ natalChart, birthDate, name }: Props) {
  const [modulus, setModulus] = useState<45 | 90>(90);
  const [yearOffset, setYearOffset] = useState(0); // 0 = centered on today

  // Compute date range: 1 year centered on today + offset
  const { startDate, endDate, totalDays } = useMemo(() => {
    const center = new Date();
    center.setFullYear(center.getFullYear() + yearOffset);
    const start = addDays(center, -182);
    const end = addDays(center, 183);
    return { startDate: start, endDate: end, totalDays: 365 };
  }, [yearOffset]);

  // Reference date for transit calculations: use the ephemeris start date
  // We need a known position for each planet. We use natal positions as a rough anchor
  // for the date of birth, then propagate forward.
  const birthDateObj = useMemo(() => {
    const parts = birthDate.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2] || 1);
  }, [birthDate]);

  // Natal planet data (mod'd)
  const natalPlanets = useMemo(() => {
    const result: { key: string; longitude: number; modLng: number; symbol: string; color: string }[] = [];
    for (const key of PLANETS_ORDER) {
      const p = natalChart.planets[key] || natalChart.planets[key.toLowerCase()];
      if (!p) continue;
      result.push({
        key,
        longitude: p.longitude,
        modLng: mod(p.longitude, modulus),
        symbol: PLANET_SYMBOLS[key] || key[0],
        color: NATAL_LINE_COLORS[key] || '#666',
      });
    }
    return result;
  }, [natalChart, modulus]);

  // Sample points for transit curves (every 2 days for performance)
  const SAMPLE_INTERVAL = 2;
  const numSamples = Math.ceil(totalDays / SAMPLE_INTERVAL);

  // Transit curves data
  const transitCurves = useMemo(() => {
    const daysSinceBirth = daysBetween(birthDateObj, startDate);

    return PLANETS_ORDER.map(key => {
      const p = natalChart.planets[key] || natalChart.planets[key.toLowerCase()];
      if (!p) return null;

      const rate = DAILY_MOTION[key] || 0;
      const points: { x: number; y: number; raw: number }[] = [];

      for (let i = 0; i <= numSamples; i++) {
        const dayOff = i * SAMPLE_INTERVAL;
        const totalOff = daysSinceBirth + dayOff;
        const lng = approxLongitude(p.longitude, rate, totalOff);
        const modLng = mod(lng, modulus);
        const x = MARGIN.left + (dayOff / totalDays) * CHART_W;
        const y = MARGIN.top + ((modulus - modLng) / modulus) * CHART_H;
        points.push({ x, y, raw: modLng });
      }

      return { key, points, color: PLANET_COLORS[key] || '#888' };
    }).filter(Boolean) as { key: string; points: { x: number; y: number; raw: number }[]; color: string }[];
  }, [natalChart, modulus, startDate, birthDateObj, numSamples, totalDays]);

  // Build SVG path strings (break path at wrap-arounds)
  const transitPaths = useMemo(() => {
    const threshold = modulus * 0.35;
    return transitCurves.map(curve => {
      const segments: string[] = [];
      let current = `M ${curve.points[0].x.toFixed(1)} ${curve.points[0].y.toFixed(1)}`;

      for (let i = 1; i < curve.points.length; i++) {
        const prev = curve.points[i - 1];
        const curr = curve.points[i];
        if (Math.abs(curr.raw - prev.raw) > threshold) {
          // Wrap-around: end current segment, start new one
          segments.push(current);
          current = `M ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
        } else {
          current += ` L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
        }
      }
      segments.push(current);
      return { key: curve.key, segments, color: curve.color };
    });
  }, [transitCurves, modulus]);

  // Find all crossing "hits"
  const hits = useMemo(() => {
    const allHits: { x: number; y: number; transitPlanet: string; natalPlanet: string; color: string }[] = [];

    for (const curve of transitCurves) {
      for (const natal of natalPlanets) {
        const natalY = MARGIN.top + ((modulus - natal.modLng) / modulus) * CHART_H;
        const crossings = findCrossings(curve.points, natalY, modulus);
        for (const c of crossings) {
          allHits.push({
            x: c.x,
            y: c.y,
            transitPlanet: curve.key,
            natalPlanet: natal.key,
            color: curve.color,
          });
        }
      }
    }

    return allHits;
  }, [transitCurves, natalPlanets, modulus]);

  // Month tick positions for x-axis
  const monthTicks = useMemo(() => {
    const ticks: { x: number; label: string }[] = [];
    const d = new Date(startDate);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);

    while (d < endDate) {
      const dayOff = daysBetween(startDate, d);
      if (dayOff >= 0 && dayOff <= totalDays) {
        const x = MARGIN.left + (dayOff / totalDays) * CHART_W;
        ticks.push({ x, label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` });
      }
      d.setMonth(d.getMonth() + 1);
    }
    return ticks;
  }, [startDate, endDate, totalDays]);

  // Y-axis degree ticks
  const yTicks = useMemo(() => {
    const step = modulus === 45 ? 5 : 10;
    const ticks: { y: number; label: string }[] = [];
    for (let deg = 0; deg <= modulus; deg += step) {
      const y = MARGIN.top + ((modulus - deg) / modulus) * CHART_H;
      ticks.push({ y, label: `${deg}\u00B0` });
    }
    return ticks;
  }, [modulus]);

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Title */}
      <div>
        <h3 className="text-sm font-semibold">Uranian Graphic Ephemeris</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{modulus}° harmonic ephemeris{name ? ` for ${name}` : ''}</p>
      </div>

      <ToolGuide
        title="Uranian Graphic Ephemeris"
        description="A visual ephemeris showing planetary positions over time as lines on a graph. The X-axis is time (months); the Y-axis is zodiacal longitude. Where lines cross, planets form exact aspects. This makes it easy to spot upcoming transits and aspect patterns."
        tips={[
          "Where two lines intersect, those planets form an exact aspect — note the date on the X-axis",
          "Steep lines (Moon, Mercury) move fast; nearly flat lines (Pluto, Neptune) are slow-moving",
          "Retrograde periods appear as the line doubling back on itself",
          "Use this to visually spot when multiple planets converge — those are high-energy periods",
          "The natal planet positions can be shown as horizontal reference lines for transit tracking",
        ]}
      />

      {/* Info */}
      <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2">
        <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-1">
          About
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          {modulus}° modulus ephemeris{name ? ` for ${name}` : ''}.
          Natal positions shown as dashed lines; transit curves show planetary motion.
          Dots mark exact crossings (aspects in {modulus}° harmonic).
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
        {/* Modulus toggle */}
        <div className="flex gap-1">
          {([45, 90] as const).map(m => (
            <button
              key={m}
              onClick={() => setModulus(m)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                modulus === m
                  ? 'bg-muted/30 border border-border text-foreground'
                  : 'bg-muted/10 border border-border/50 text-muted-foreground/60 hover:text-muted-foreground'
              }`}
            >
              {m}°
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-muted/20" />

        {/* Time navigation */}
        <button
          onClick={() => setYearOffset(o => o - 1)}
          className="px-2 py-1 rounded-md bg-muted/10 border border-border/50 text-muted-foreground hover:text-foreground/80 transition-all text-[11px]"
        >
          ◀ Prev Year
        </button>
        <span className="text-[11px] text-muted-foreground font-mono min-w-[80px] text-center">
          {startDate.toLocaleDateString('en', { month: 'short', year: 'numeric' })}
          {' \u2013 '}
          {endDate.toLocaleDateString('en', { month: 'short', year: 'numeric' })}
        </span>
        <button
          onClick={() => setYearOffset(o => o + 1)}
          className="px-2 py-1 rounded-md bg-muted/10 border border-border/50 text-muted-foreground hover:text-foreground/80 transition-all text-[11px]"
        >
          Next Year ▶
        </button>

        {yearOffset !== 0 && (
          <button
            onClick={() => setYearOffset(0)}
            className="px-2 py-1 rounded-md bg-muted/10 border border-border/50 text-muted-foreground/60 hover:text-muted-foreground transition-all text-xs"
          >
            Today
          </button>
        )}
      </div>

      {/* SVG Chart */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full"
          style={{ minWidth: 500 }}
        >
          {/* Background */}
          <rect x={MARGIN.left} y={MARGIN.top} width={CHART_W} height={CHART_H} fill="currentColor" fillOpacity={0.02} rx={4} />

          {/* Grid lines - Y axis */}
          {yTicks.map((tick, i) => (
            <g key={`ytick-${i}`}>
              <line
                x1={MARGIN.left} y1={tick.y}
                x2={MARGIN.left + CHART_W} y2={tick.y}
                stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5}
              />
              <text
                x={MARGIN.left - 6} y={tick.y + 3}
                textAnchor="end" fill="currentColor" fillOpacity={0.3} fontSize={9} fontFamily="monospace"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Grid lines - X axis (months) */}
          {monthTicks.map((tick, i) => (
            <g key={`xtick-${i}`}>
              <line
                x1={tick.x} y1={MARGIN.top}
                x2={tick.x} y2={MARGIN.top + CHART_H}
                stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5}
              />
              <text
                x={tick.x} y={MARGIN.top + CHART_H + 16}
                textAnchor="middle" fill="currentColor" fillOpacity={0.35} fontSize={9}
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Natal planet horizontal reference lines */}
          {natalPlanets.map(np => {
            const y = MARGIN.top + ((modulus - np.modLng) / modulus) * CHART_H;
            return (
              <g key={`natal-${np.key}`}>
                <line
                  x1={MARGIN.left} y1={y}
                  x2={MARGIN.left + CHART_W} y2={y}
                  stroke={np.color} strokeWidth={1} strokeDasharray="4 3"
                />
                <text
                  x={MARGIN.left - 6} y={y + 3}
                  textAnchor="end" fill={np.color} fontSize={11}
                >
                  {np.symbol}
                </text>
              </g>
            );
          })}

          {/* Transit planet curves */}
          {transitPaths.map(tp => (
            <g key={`transit-${tp.key}`}>
              {tp.segments.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={tp.color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  opacity={0.85}
                />
              ))}
            </g>
          ))}

          {/* Hit dots (crossings) */}
          {hits.map((hit, i) => (
            <circle
              key={`hit-${i}`}
              cx={hit.x} cy={hit.y}
              r={3}
              fill={hit.color}
              stroke="currentColor" strokeOpacity={0.6}
              strokeWidth={0.8}
              opacity={0.9}
            >
              <title>
                {PLANET_SYMBOLS[hit.transitPlanet] || hit.transitPlanet} transit crosses natal {PLANET_SYMBOLS[hit.natalPlanet] || hit.natalPlanet}
              </title>
            </circle>
          ))}

          {/* Axis borders */}
          <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + CHART_H} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
          <line x1={MARGIN.left} y1={MARGIN.top + CHART_H} x2={MARGIN.left + CHART_W} y2={MARGIN.top + CHART_H} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />

          {/* Title */}
          <text x={SVG_WIDTH / 2} y={16} textAnchor="middle" fill="currentColor" fillOpacity={0.5} fontSize={11} fontWeight={600}>
            {modulus}° Harmonic Ephemeris {name ? `\u2014 ${name}` : ''}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
        <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-2">
          Planet Legend
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {PLANETS_ORDER.map(key => {
            const np = natalPlanets.find(n => n.key === key);
            if (!np) return null;
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: PLANET_COLORS[key] }} />
                <span style={{ color: PLANET_COLORS[key] }}>{PLANET_SYMBOLS[key]}</span>
                <span className="text-muted-foreground">{key}</span>
                <span className="text-muted-foreground/70 font-mono">{np.modLng.toFixed(1)}°</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0 border-t border-dashed border-border/80" /> Natal position
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0 border-t border-border" /> Transit curve
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-muted/100" /> Crossing hit
          </span>
        </div>
      </div>

      {/* Hits summary */}
      {hits.length > 0 && (
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
          <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-2">
            Crossings Found ({hits.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hits.slice(0, 30).map((hit, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/10 border border-border/50 text-xs"
              >
                <span style={{ color: PLANET_COLORS[hit.transitPlanet] }}>
                  {PLANET_SYMBOLS[hit.transitPlanet]}
                </span>
                <span className="text-muted-foreground/70">→</span>
                <span style={{ color: NATAL_LINE_COLORS[hit.natalPlanet]?.replace('80', '') || '#888' }}>
                  {PLANET_SYMBOLS[hit.natalPlanet]}
                </span>
              </span>
            ))}
            {hits.length > 30 && (
              <span className="text-xs text-muted-foreground/70">+{hits.length - 30} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
