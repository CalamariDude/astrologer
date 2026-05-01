/**
 * Chart Shape Detection Panel
 * Detects Marc Edmund Jones chart patterns (splash, bundle, bowl, bucket, locomotive, splay, see-saw, fan)
 * and renders an SVG visualization.
 */

import React, { useMemo } from 'react';
import { ToolGuide } from './ToolGuide';

interface Props {
  natalChart: { planets: Record<string, { longitude: number; sign: string }> };
  name?: string;
}

const SIGN_SYMBOLS = ['\u2648\uFE0E','\u2649\uFE0E','\u264A\uFE0E','\u264B\uFE0E','\u264C\uFE0E','\u264D\uFE0E','\u264E\uFE0E','\u264F\uFE0E','\u2650\uFE0E','\u2651\uFE0E','\u2652\uFE0E','\u2653\uFE0E'];
const SIGN_ELEMENT = ['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];
const SIGN_MODE   = ['cardinal','fixed','mutable','cardinal','fixed','mutable','cardinal','fixed','mutable','cardinal','fixed','mutable'];

const ELEMENT_COLORS: Record<string, string> = {
  fire:  '#f87171', // red-400
  earth: '#34d399', // emerald-400
  air:   '#38bdf8', // sky-400
  water: '#60a5fa', // blue-400
};

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '\u2609\uFE0E', moon: '\u263D\uFE0E', mercury: '\u263F\uFE0E', venus: '\u2640\uFE0E', mars: '\u2642\uFE0E',
  jupiter: '\u2643\uFE0E', saturn: '\u2644\uFE0E', uranus: '\u26E2\uFE0E', neptune: '\u2646\uFE0E', pluto: '\u2647\uFE0E',
};

// 10 main planets for shape detection
const MAIN_PLANETS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];

function normalizeLong(l: number): number {
  return ((l % 360) + 360) % 360;
}

function formatDeg(longitude: number): string {
  const n = normalizeLong(longitude);
  const signIdx = Math.floor(n / 30);
  const deg = Math.floor(n % 30);
  return `${deg}° ${SIGN_SYMBOLS[signIdx]}`;
}

function symbolFor(key: string): string {
  const k = key.toLowerCase().replace(/[\s_-]/g, '');
  return PLANET_SYMBOLS[k] || key.charAt(0).toUpperCase();
}

function labelFor(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

type ShapeName = 'Splash' | 'Bundle' | 'Fan' | 'Bowl' | 'Bucket' | 'Locomotive' | 'Splay' | 'See-Saw';

interface ShapeResult {
  shape: ShapeName;
  description: string;
  psychological: string;
  largestGap: number;
  gapStart: number;
  gapEnd: number;
  handlePlanet?: string; // for Bucket
  leadingPlanet?: string; // for Locomotive
  occupiedSpan: number;
}

interface PlanetEntry {
  key: string;
  longitude: number;
}

function detectShape(planets: PlanetEntry[]): ShapeResult {
  if (planets.length < 2) {
    return { shape: 'Splash', description: 'Insufficient planets', psychological: '', largestGap: 0, gapStart: 0, gapEnd: 0, occupiedSpan: 360 };
  }

  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const n = sorted.length;

  // Calculate all gaps between consecutive planets (including wrap-around)
  const gaps: { size: number; startIdx: number; endIdx: number; startLong: number; endLong: number }[] = [];
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const gap = i === n - 1
      ? (sorted[0].longitude + 360 - sorted[n - 1].longitude)
      : (sorted[next].longitude - sorted[i].longitude);
    gaps.push({
      size: gap,
      startIdx: i,
      endIdx: next,
      startLong: sorted[i].longitude,
      endLong: sorted[next].longitude,
    });
  }

  // Find largest gap
  let maxGap = gaps[0];
  for (const g of gaps) {
    if (g.size > maxGap.size) maxGap = g;
  }

  const occupiedSpan = 360 - maxGap.size;

  // Count distinct signs occupied
  const signsOccupied = new Set(sorted.map(p => Math.floor(p.longitude / 30))).size;

  // Sort gaps descending to find second-largest
  const sortedGaps = [...gaps].sort((a, b) => b.size - a.size);
  const secondGap = sortedGaps.length > 1 ? sortedGaps[1] : null;

  // DETECTION LOGIC

  // Fan/Bundle: all within 90°
  if (maxGap.size > 270) {
    return {
      shape: 'Fan',
      description: `All planets within ${Math.round(occupiedSpan)}° — an extremely tight grouping.`,
      psychological: 'Intense focus and concentration in one area of life. Highly specialized, with laser-like purpose but potential blind spots in unoccupied areas.',
      largestGap: maxGap.size,
      gapStart: maxGap.startLong,
      gapEnd: maxGap.endLong,
      occupiedSpan,
    };
  }

  // Bundle: all within 120°
  if (maxGap.size > 240) {
    return {
      shape: 'Bundle',
      description: `All planets clustered within ${Math.round(occupiedSpan)}° (less than a trine).`,
      psychological: 'Narrowly focused energy and experience. Strong specialization and self-containment, but may lack awareness of perspectives outside the occupied zone.',
      largestGap: maxGap.size,
      gapStart: maxGap.startLong,
      gapEnd: maxGap.endLong,
      occupiedSpan,
    };
  }

  // Bowl: all within 180°
  if (maxGap.size > 180) {
    // Check for Bucket: one planet isolated in the empty half
    // The "empty" half is the gap area. Check if removing one planet would make it a bowl with gap > 180
    // More precisely: is there a single planet that, if on the other side, creates a bowl?
    // We look for a planet that is "separated" from the main group by two large gaps
    const gapMidpoint = normalizeLong(maxGap.startLong + maxGap.size / 2);

    // Check: could removing any single planet increase the largest gap?
    // A bucket handle sits roughly opposite the bowl. Find if any planet is within the empty hemisphere.
    // Actually, for a proper bucket, one planet opposes the bowl. Let's check if the second-largest gap
    // combined with the planet between them could be considered a "handle".
    if (secondGap && secondGap.size > 40) {
      // Planet between the two largest gaps is the potential handle
      const handleIdx = maxGap.startIdx; // planet at the start of the largest gap...
      // Actually: the handle is the planet that sits between the two largest gaps
      // The two largest gaps share an endpoint that is the handle planet
      for (const p of sorted) {
        // Check if this planet is roughly opposite (across) the bowl midpoint
        const bowlCenter = normalizeLong(maxGap.endLong + occupiedSpan / 2);
        const distToOpposite = Math.abs(normalizeLong(p.longitude - bowlCenter));
        const dNorm = distToOpposite > 180 ? 360 - distToOpposite : distToOpposite;
        if (dNorm > occupiedSpan * 0.3) {
          // This planet is far from the bowl center — potential handle
          // Verify: removing this planet, does the gap become > 180?
          const without = sorted.filter(s => s.key !== p.key);
          const wSorted = [...without].sort((a, b) => a.longitude - b.longitude);
          let wMaxGap = 0;
          for (let i = 0; i < wSorted.length; i++) {
            const next = (i + 1) % wSorted.length;
            const g = i === wSorted.length - 1
              ? (wSorted[0].longitude + 360 - wSorted[wSorted.length - 1].longitude)
              : (wSorted[next].longitude - wSorted[i].longitude);
            if (g > wMaxGap) wMaxGap = g;
          }
          if (wMaxGap > 200) {
            // For a Bucket, the empty hemisphere is split by the handle.
            // Highlight the whole empty zone (bowl-trailing-edge → bowl-leading-edge,
            // wrapping clockwise around the handle) so the handle sits visibly inside it.
            const handleIdx = sorted.findIndex(s => s.key === p.key);
            const beforeIdx = (handleIdx - 1 + sorted.length) % sorted.length;
            const afterIdx = (handleIdx + 1) % sorted.length;
            return {
              shape: 'Bucket',
              description: `Bowl spanning ${Math.round(occupiedSpan)}° with ${symbolFor(p.key)} ${labelFor(p.key)} as the handle planet.`,
              psychological: 'The handle planet becomes the focal point through which all bowl energy is directed. It acts as a funnel, giving tremendous drive and purpose. The handle planet\'s sign and house are critically important.',
              largestGap: maxGap.size,
              gapStart: sorted[beforeIdx].longitude,
              gapEnd: sorted[afterIdx].longitude,
              handlePlanet: p.key,
              occupiedSpan,
            };
          }
        }
      }
    }

    return {
      shape: 'Bowl',
      description: `All planets occupy ${Math.round(occupiedSpan)}° — one hemisphere of the chart.`,
      psychological: 'Self-containment with a strong awareness of what is missing. The empty hemisphere represents unintegrated life areas that the native may project onto others or strive to fill. The leading planet (at the edge of the bowl) shows how they engage with the world.',
      largestGap: maxGap.size,
      gapStart: maxGap.startLong,
      gapEnd: maxGap.endLong,
      leadingPlanet: sorted[maxGap.endIdx].key,
      occupiedSpan,
    };
  }

  // Locomotive: gap between 120-180°
  if (maxGap.size >= 120) {
    // The leading planet is the one at the clockwise edge of the gap (drives the locomotive)
    return {
      shape: 'Locomotive',
      description: `Planets span ${Math.round(occupiedSpan)}° with an empty trine gap of ${Math.round(maxGap.size)}°.`,
      psychological: 'Enormous drive and executive ability. The empty trine creates a sense of incompleteness that fuels ambition. The leading planet (first planet clockwise after the gap) is the engine that drives all efforts forward.',
      largestGap: maxGap.size,
      gapStart: maxGap.startLong,
      gapEnd: maxGap.endLong,
      leadingPlanet: sorted[maxGap.endIdx].key,
      occupiedSpan,
    };
  }

  // See-saw: two significant gaps (each > 60°) creating two opposing groups
  if (secondGap && secondGap.size >= 60 && maxGap.size >= 60) {
    // Count how many gaps are > 50°
    const bigGaps = sortedGaps.filter(g => g.size >= 50);
    if (bigGaps.length === 2) {
      return {
        shape: 'See-Saw',
        description: `Two groups of planets separated by gaps of ${Math.round(maxGap.size)}° and ${Math.round(secondGap.size)}°.`,
        psychological: 'A life of balancing opposing forces. The native sees both sides of every situation and vacillates between two orientations. Gifted at mediation and finding synthesis, but may struggle with decisiveness.',
        largestGap: maxGap.size,
        gapStart: maxGap.startLong,
        gapEnd: maxGap.endLong,
        occupiedSpan,
      };
    }
    // 3+ big gaps could be splay
    if (bigGaps.length >= 3) {
      return {
        shape: 'Splay',
        description: `Planets form ${bigGaps.length} distinct clusters with significant gaps between them.`,
        psychological: 'A highly individualistic pattern. The native resists categorization and operates from multiple strong points of emphasis. Strongly independent with diverse talents and interests that don\'t conform to a single path.',
        largestGap: maxGap.size,
        gapStart: maxGap.startLong,
        gapEnd: maxGap.endLong,
        occupiedSpan,
      };
    }
  }

  // Splay: check for 3 clusters
  const bigGapsForSplay = sortedGaps.filter(g => g.size >= 40);
  if (bigGapsForSplay.length >= 3) {
    return {
      shape: 'Splay',
      description: `Planets form distinct clusters separated by ${bigGapsForSplay.length} gaps of 40°+.`,
      psychological: 'A highly individualistic pattern. The native resists categorization and operates from multiple strong points of emphasis. Strongly independent with diverse talents and interests that don\'t conform to a single path.',
      largestGap: maxGap.size,
      gapStart: maxGap.startLong,
      gapEnd: maxGap.endLong,
      occupiedSpan,
    };
  }

  // Default: Splash
  return {
    shape: 'Splash',
    description: `Planets spread across ${signsOccupied} signs with no dominant gap (largest: ${Math.round(maxGap.size)}°).`,
    psychological: 'Universal awareness and broad interests. The native engages with many areas of life and avoids over-specialization. Can be a "jack of all trades" with a scattered or well-rounded approach depending on other chart factors.',
    largestGap: maxGap.size,
    gapStart: maxGap.startLong,
    gapEnd: maxGap.endLong,
    occupiedSpan,
  };
}

export function ChartShapePanel({ natalChart, name }: Props) {
  // Filter to 10 main planets
  const planets = useMemo<PlanetEntry[]>(() => {
    const result: PlanetEntry[] = [];
    for (const [key, data] of Object.entries(natalChart.planets)) {
      const k = key.toLowerCase().replace(/[\s_-]/g, '');
      if (MAIN_PLANETS.includes(k)) {
        result.push({ key, longitude: normalizeLong(data.longitude) });
      }
    }
    return result;
  }, [natalChart]);

  const shape = useMemo(() => detectShape(planets), [planets]);

  if (planets.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Chart Shape Detection</h3>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Marc Edmund Jones pattern analysis using the 10 classical planets.
          </p>
        </div>
        <div className="text-xs text-muted-foreground/70 text-center py-8 rounded-lg border border-border/30 bg-muted/10">
          Enter a birth date to use this tool
        </div>
      </div>
    );
  }

  // Element/mode breakdown of occupied area
  const elementCount = useMemo(() => {
    const counts: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
    for (const p of planets) {
      const si = Math.floor(p.longitude / 30);
      counts[SIGN_ELEMENT[si]]++;
    }
    return counts;
  }, [planets]);

  const modeCount = useMemo(() => {
    const counts: Record<string, number> = { cardinal: 0, fixed: 0, mutable: 0 };
    for (const p of planets) {
      const si = Math.floor(p.longitude / 30);
      counts[SIGN_MODE[si]]++;
    }
    return counts;
  }, [planets]);

  // SVG visualization
  const svgSize = 340;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const radius = 130;
  const planetRadius = 148;

  function toXY(deg: number, r: number): { x: number; y: number } {
    const rad = ((deg - 90) * Math.PI) / 180; // -90 so 0° is at top
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // Arc path for the empty gap area
  function arcPath(startDeg: number, endDeg: number, r: number): string {
    const s = toXY(startDeg, r);
    const e = toXY(endDeg, r);
    const span = ((endDeg - startDeg + 360) % 360);
    const largeArc = span > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">
          Chart Shape Detection{name ? ` — ${name}` : ''}
        </h3>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Marc Edmund Jones pattern analysis using the 10 classical planets.
        </p>
      </div>

      <ToolGuide
        title="Chart Shape"
        description="Identifies the overall pattern of planet distribution in your chart. The shape (Bundle, Bowl, Bucket, Locomotive, Seesaw, Splash, Splay) reveals your fundamental approach to life — whether you concentrate energy, spread it wide, or polarize between extremes."
        tips={[
          "Bundle: all planets within 120° — intense focus, specialist energy",
          "Bowl: planets fill half the chart — self-contained, driven by the empty half's themes",
          "Bucket: bowl with one planet (the handle) opposite — that planet becomes a focal outlet",
          "Locomotive: planets span 240° with a 120° gap — driven, the lead planet sets direction",
          "Seesaw: two groups opposing each other — life of balancing competing needs",
          "The SVG chart shows exact planet positions so you can see the pattern visually",
        ]}
      />

      {/* Shape result */}
      <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{shape.shape}</span>
          <span className="text-xs text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded">
            span {Math.round(shape.occupiedSpan)}° / gap {Math.round(shape.largestGap)}°
          </span>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-1">{shape.description}</p>
        <p className="text-xs text-muted-foreground/70 mt-1.5 italic">{shape.psychological}</p>
      </div>

      {/* Key features */}
      {(shape.handlePlanet || shape.leadingPlanet) && (
        <div className="bg-muted/20 rounded-lg p-2.5 border border-border/30">
          {shape.handlePlanet && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-amber-400 text-sm">{symbolFor(shape.handlePlanet)}</span>
              <span className="font-medium">Handle Planet:</span>
              <span className="text-muted-foreground/70">{labelFor(shape.handlePlanet)}</span>
              <span className="font-mono text-xs text-muted-foreground/60">
                {formatDeg(planets.find(p => p.key === shape.handlePlanet)?.longitude || 0)}
              </span>
            </div>
          )}
          {shape.leadingPlanet && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-sky-400 text-sm">{symbolFor(shape.leadingPlanet)}</span>
              <span className="font-medium">Leading Planet:</span>
              <span className="text-muted-foreground/70">{labelFor(shape.leadingPlanet)}</span>
              <span className="font-mono text-xs text-muted-foreground/60">
                {formatDeg(planets.find(p => p.key === shape.leadingPlanet)?.longitude || 0)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* SVG Visualization */}
      <div className="flex justify-center">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="overflow-visible">
          {/* Background circle */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={1.5} />

          {/* Sign divisions */}
          {Array.from({ length: 12 }).map((_, i) => {
            const deg = i * 30;
            const p = toXY(deg, radius);
            return (
              <line key={`div-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity={0.12} strokeWidth={0.8} />
            );
          })}

          {/* Sign symbols */}
          {SIGN_SYMBOLS.map((sym, i) => {
            const deg = i * 30 + 15;
            const p = toXY(deg, radius + 20);
            return (
              <text key={`sign-${i}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                className="fill-current opacity-40" style={{ fontSize: '13px', fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>
                {sym}
              </text>
            );
          })}

          {/* Empty gap area (highlighted) */}
          <path
            d={arcPath(shape.gapStart, shape.gapEnd, radius)}
            fill="currentColor"
            fillOpacity={0.06}
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Planet dots and symbols */}
          {planets.map((p) => {
            const pos = toXY(p.longitude, planetRadius);
            const dotPos = toXY(p.longitude, radius - 8);
            const si = Math.floor(p.longitude / 30);
            const el = SIGN_ELEMENT[si];
            const color = ELEMENT_COLORS[el];
            const isHandle = shape.handlePlanet === p.key;
            const isLeading = shape.leadingPlanet === p.key;

            return (
              <g key={p.key}>
                {/* Connection line */}
                <line x1={cx} y1={cy} x2={dotPos.x} y2={dotPos.y} stroke={color} strokeOpacity={0.25} strokeWidth={0.8} />
                {/* Dot on circle */}
                <circle cx={dotPos.x} cy={dotPos.y} r={isHandle || isLeading ? 5 : 4} fill={color} fillOpacity={0.9}
                  stroke={isHandle ? '#fbbf24' : isLeading ? '#38bdf8' : 'none'} strokeWidth={isHandle || isLeading ? 2 : 0} />
                {/* Symbol label */}
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                  fill={color} style={{ fontSize: '16px', fontWeight: 600, fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>
                  {symbolFor(p.key)}
                </text>
              </g>
            );
          })}

          {/* Center label */}
          <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central"
            className="fill-current opacity-60" style={{ fontSize: '14px', fontWeight: 700 }}>
            {shape.shape}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="central"
            className="fill-current opacity-40" style={{ fontSize: '11px' }}>
            {Math.round(shape.occupiedSpan)}° occupied
          </text>
        </svg>
      </div>

      {/* Element & Mode breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
          <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Element</span>
          <div className="grid grid-cols-2 gap-1 mt-1.5">
            {Object.entries(elementCount).map(([el, count]) => (
              <div key={el} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[el], opacity: 0.7 }} />
                <span className="capitalize text-muted-foreground/60">{el}</span>
                <span className="font-mono font-medium ml-auto">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
          <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Mode</span>
          <div className="space-y-0.5 mt-1.5">
            {Object.entries(modeCount).map(([mode, count]) => (
              <div key={mode} className="flex items-center gap-1.5 text-xs">
                <span className="capitalize text-muted-foreground/60">{mode}</span>
                <span className="font-mono font-medium ml-auto">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Planet positions list */}
      <div>
        <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Planet Positions (sorted)</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {[...planets].sort((a, b) => a.longitude - b.longitude).map(p => {
            const si = Math.floor(p.longitude / 30);
            const el = SIGN_ELEMENT[si];
            return (
              <span key={p.key} className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted/30 border border-border/20`}
                style={{ color: ELEMENT_COLORS[el] }}>
                <span className="text-xs" style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{symbolFor(p.key)}</span>
                <span className="font-mono">{formatDeg(p.longitude)}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
