/**
 * Primary Directions Panel
 * Classical predictive technique using Ptolemaic semi-arc method.
 * Directs planets to angles and major planet-to-planet aspects.
 * Arc converted to time via Ptolemy's key: 1 degree = 1 year of life.
 */

import { useMemo, useState } from 'react';
import { ToolGuide } from './ToolGuide';
import { InterpretationCard } from './InterpretationCard';
import { DIRECTION_MEANINGS } from '../../data/toolboxInterpretations';

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
  lat?: number;
}

interface Direction {
  promissor: string;
  significator: string;
  aspect: AspectType;
  arc: number;          // degrees (= years via Ptolemy's key)
  age: number;          // arc rounded
  year: number;         // birth year + age
  type: 'direct' | 'converse';
}

type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '\u2609\uFE0E',
  moon: '\u263D\uFE0E',
  mercury: '\u263F\uFE0E',
  venus: '\u2640\uFE0E',
  mars: '\u2642\uFE0E',
  jupiter: '\u2643\uFE0E',
  saturn: '\u2644\uFE0E',
  uranus: '\u26E2\uFE0E',
  neptune: '\u2646\uFE0E',
  pluto: '\u2647\uFE0E',
  asc: 'Asc',
  mc: 'MC',
  dsc: 'Dsc',
  ic: 'IC',
};

const PLANET_NAMES: Record<string, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
  asc: 'Ascendant',
  mc: 'Midheaven',
  dsc: 'Descendant',
  ic: 'Imum Coeli',
};

const PLANET_COLORS: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  sun:     { bg: 'bg-amber-500/15',   text: 'text-amber-500',   ring: 'ring-amber-500/40',   bar: '#f59e0b' },
  moon:    { bg: 'bg-slate-300/20',   text: 'text-slate-400',   ring: 'ring-slate-400/40',   bar: '#94a3b8' },
  mercury: { bg: 'bg-yellow-400/15',  text: 'text-yellow-500',  ring: 'ring-yellow-400/40',  bar: '#eab308' },
  venus:   { bg: 'bg-emerald-400/15', text: 'text-emerald-400', ring: 'ring-emerald-400/40', bar: '#34d399' },
  mars:    { bg: 'bg-red-500/15',     text: 'text-red-500',     ring: 'ring-red-500/40',     bar: '#ef4444' },
  jupiter: { bg: 'bg-violet-400/15',  text: 'text-violet-400',  ring: 'ring-violet-400/40',  bar: '#a78bfa' },
  saturn:  { bg: 'bg-stone-400/15',   text: 'text-stone-400',   ring: 'ring-stone-400/40',   bar: '#a8a29e' },
  uranus:  { bg: 'bg-cyan-400/15',    text: 'text-cyan-400',    ring: 'ring-cyan-400/40',    bar: '#22d3ee' },
  neptune: { bg: 'bg-blue-400/15',    text: 'text-blue-400',    ring: 'ring-blue-400/40',    bar: '#60a5fa' },
  pluto:   { bg: 'bg-fuchsia-400/15', text: 'text-fuchsia-400', ring: 'ring-fuchsia-400/40', bar: '#e879f9' },
  asc:     { bg: 'bg-rose-400/15',    text: 'text-rose-400',    ring: 'ring-rose-400/40',    bar: '#fb7185' },
  mc:      { bg: 'bg-sky-400/15',     text: 'text-sky-400',     ring: 'ring-sky-400/40',     bar: '#38bdf8' },
  dsc:     { bg: 'bg-rose-400/15',    text: 'text-rose-400',    ring: 'ring-rose-400/40',    bar: '#fb7185' },
  ic:      { bg: 'bg-sky-400/15',     text: 'text-sky-400',     ring: 'ring-sky-400/40',     bar: '#38bdf8' },
};

const ASPECT_ANGLES: Record<AspectType, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
};

const ASPECT_SYMBOLS: Record<AspectType, string> = {
  conjunction: '\u260C',  // conjunction symbol (fallback below)
  sextile: '\u26B9',
  square: '\u25A1',
  trine: '\u25B3',
  opposition: '\u260D',
};

// Simpler aspect glyphs that render well
const ASPECT_LABELS: Record<AspectType, string> = {
  conjunction: 'Cnj',
  sextile: 'Sxt',
  square: 'Sqr',
  trine: 'Tri',
  opposition: 'Opp',
};

const ASPECT_COLORS: Record<AspectType, string> = {
  conjunction: 'text-amber-400',
  sextile: 'text-blue-400',
  square: 'text-red-400',
  trine: 'text-green-400',
  opposition: 'text-orange-400',
};

const OBLIQUITY = 23.4393; // mean obliquity of ecliptic in degrees
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const PLANETS_LIST = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const ANGLES_LIST = ['asc', 'mc', 'dsc', 'ic'];
const SIGNIFICATORS = [...ANGLES_LIST, ...PLANETS_LIST];

const MAX_AGE = 90;

/* ------------------------------------------------------------------ */
/*  Math helpers                                                       */
/* ------------------------------------------------------------------ */

/** Convert ecliptic longitude to right ascension (simplified, zero latitude) */
function eclipticToRA(longitude: number): number {
  const lRad = longitude * DEG;
  const oblRad = OBLIQUITY * DEG;
  const ra = Math.atan2(Math.sin(lRad) * Math.cos(oblRad), Math.cos(lRad)) * RAD;
  return ((ra % 360) + 360) % 360;
}

/** Convert ecliptic longitude to declination (simplified, zero latitude) */
function eclipticToDec(longitude: number): number {
  const lRad = longitude * DEG;
  const oblRad = OBLIQUITY * DEG;
  return Math.asin(Math.sin(oblRad) * Math.sin(lRad)) * RAD;
}

/**
 * Compute the semi-arc of a body given its declination and the
 * geographic latitude (approximated from the MC/ASC relationship).
 * Semi-arc = arccos(-tan(dec) * tan(lat)) for diurnal semi-arc.
 * We approximate latitude from the chart's ASC and MC.
 */
function diurnalSemiArc(declination: number, obliquity: number, latitude?: number): number {
  // Without geographic latitude, we use a simplified approach:
  // DSA ~ 90 + ascensional difference
  // Ascensional difference = arcsin(tan(dec) * tan(lat))
  // For a simplified version without lat, we use the equatorial semi-arc = 90 always,
  // but adjust with a reasonable mid-latitude (~45 degrees) as default.
  const lat = latitude ?? 45;
  const tanDecTanLat = Math.tan(declination * DEG) * Math.tan(lat * DEG);
  const clamped = Math.max(-1, Math.min(1, tanDecTanLat));
  const ascDiff = Math.asin(clamped) * RAD;
  return 90 + ascDiff;
}

function nocturnalSemiArc(declination: number, obliquity: number, latitude?: number): number {
  return 180 - diurnalSemiArc(declination, obliquity, latitude);
}

/**
 * Compute the arc of direction between a promissor and significator
 * using the Ptolemaic semi-arc (Regiomontanus-style) method.
 *
 * Simplified approach:
 * - Convert both bodies to RA
 * - The arc of direction = |RA_promissor - RA_significator +/- aspect_angle|
 *   adjusted by the semi-arc proportional distance.
 *
 * For a more tractable implementation, we use the "RA arc" method:
 * Arc = (RA of aspecting promissor - RA of significator) scaled by semi-arc ratio.
 */
function computeDirectionArc(
  promissorLong: number,
  significatorLong: number,
  aspectAngle: number,
  direct: boolean,
  latitude?: number,
): number | null {
  const promRA = eclipticToRA(promissorLong);
  const sigRA = eclipticToRA(significatorLong);
  const promDec = eclipticToDec(promissorLong);
  const sigDec = eclipticToDec(significatorLong);

  // The promissor is directed to the aspect point of the significator
  // Aspect point in ecliptic = significator longitude +/- aspect angle
  const aspectPointLong = direct
    ? ((significatorLong + aspectAngle) % 360 + 360) % 360
    : ((significatorLong - aspectAngle) % 360 + 360) % 360;

  const aspectRA = eclipticToRA(aspectPointLong);

  // Arc in RA between promissor and the aspect point
  let arc: number;
  if (direct) {
    // Direct direction: promissor moves forward to meet the aspect point
    arc = ((aspectRA - promRA) % 360 + 360) % 360;
  } else {
    // Converse direction: significator's aspect point moves backward to promissor
    arc = ((promRA - aspectRA) % 360 + 360) % 360;
  }

  // Apply semi-arc scaling (proportional semi-arc method)
  // This adjusts for the body's distance from the meridian
  const promDSA = diurnalSemiArc(promDec, OBLIQUITY, latitude);
  const scaleFactor = 90 / promDSA; // normalize to equatorial
  arc = arc * scaleFactor;

  // Only keep arcs that map to reasonable ages
  if (arc <= 0 || arc > MAX_AGE) return null;

  return arc;
}

/* ------------------------------------------------------------------ */
/*  Direction computation                                              */
/* ------------------------------------------------------------------ */

function computeAllDirections(
  planets: Record<string, { longitude: number }>,
  angles: Record<string, number>,
  birthYear: number,
  latitude?: number,
): Direction[] {
  const directions: Direction[] = [];

  // Build a combined lookup of all body longitudes
  const bodies: Record<string, number> = {};
  for (const key of PLANETS_LIST) {
    if (planets[key]) bodies[key] = planets[key].longitude;
  }
  for (const key of ANGLES_LIST) {
    if (angles[key] !== undefined) bodies[key] = angles[key];
  }

  const promissors = PLANETS_LIST.filter((p) => bodies[p] !== undefined);
  const significators = Object.keys(bodies);
  const aspects: AspectType[] = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];

  for (const prom of promissors) {
    for (const sig of significators) {
      if (prom === sig) continue;

      for (const aspect of aspects) {
        const angle = ASPECT_ANGLES[aspect];

        for (const dirType of ['direct', 'converse'] as const) {
          const arc = computeDirectionArc(
            bodies[prom],
            bodies[sig],
            angle,
            dirType === 'direct',
            latitude,
          );

          if (arc !== null && arc > 0.5 && arc <= MAX_AGE) {
            // Avoid near-duplicate arcs (within 0.1 degree)
            const age = arc;
            const year = birthYear + Math.floor(age);

            directions.push({
              promissor: prom,
              significator: sig,
              aspect,
              arc,
              age: Math.round(age * 10) / 10,
              year,
              type: dirType,
            });
          }
        }
      }
    }
  }

  // Sort by arc/age
  directions.sort((a, b) => a.arc - b.arc);

  // De-duplicate very close directions (within 0.3 degrees)
  const deduped: Direction[] = [];
  for (const d of directions) {
    const isDupe = deduped.some(
      (existing) =>
        Math.abs(existing.arc - d.arc) < 0.3 &&
        existing.promissor === d.promissor &&
        existing.significator === d.significator &&
        existing.aspect === d.aspect,
    );
    if (!isDupe) deduped.push(d);
  }

  return deduped;
}

/* ------------------------------------------------------------------ */
/*  Extract angles from natal chart                                    */
/* ------------------------------------------------------------------ */

function extractAngles(natalChart: Props['natalChart']): Record<string, number> {
  const angles: Record<string, number> = {};
  const houses = natalChart.houses;

  if (houses) {
    if (houses.ascendant !== undefined) {
      angles.asc = houses.ascendant;
      angles.dsc = (houses.ascendant + 180) % 360;
    }
    if (houses.mc !== undefined) {
      angles.mc = houses.mc;
      angles.ic = (houses.mc + 180) % 360;
    }
    // If cusps array exists, derive ASC and MC from cusps[0] and cusps[9]
    if (houses.cusps && houses.cusps.length >= 10) {
      if (angles.asc === undefined) {
        angles.asc = houses.cusps[0];
        angles.dsc = (houses.cusps[0] + 180) % 360;
      }
      if (angles.mc === undefined) {
        angles.mc = houses.cusps[9];
        angles.ic = (houses.cusps[9] + 180) % 360;
      }
    }
  }

  return angles;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PrimaryDirectionsPanel({ natalChart, birthDate, name, lat }: Props) {
  const [showDirect, setShowDirect] = useState(true);
  const [showConverse, setShowConverse] = useState(true);
  const [sigFilter, setSigFilter] = useState<string>('all');
  const [aspectFilter, setAspectFilter] = useState<string>('all');
  const [showAllFuture, setShowAllFuture] = useState(false);

  const data = useMemo(() => {
    const bd = new Date(birthDate + 'T12:00:00');
    const birthYear = bd.getFullYear();
    const angles = extractAngles(natalChart);
    const directions = computeAllDirections(natalChart.planets, angles, birthYear, lat);

    // Current age
    const now = new Date();
    const ageMs = now.getTime() - bd.getTime();
    const currentAge = ageMs / (365.25 * 24 * 60 * 60 * 1000);

    return { directions, birthYear, currentAge, now };
  }, [natalChart, birthDate, lat]);

  const { directions, birthYear, currentAge } = data;

  // Apply filters
  const filtered = useMemo(() => {
    return directions.filter((d) => {
      if (!showDirect && d.type === 'direct') return false;
      if (!showConverse && d.type === 'converse') return false;
      if (sigFilter !== 'all' && d.significator !== sigFilter) return false;
      if (aspectFilter !== 'all' && d.aspect !== aspectFilter) return false;
      return true;
    });
  }, [directions, showDirect, showConverse, sigFilter, aspectFilter]);

  // Active directions: within ~1 degree of current age
  const activeDirections = filtered.filter(
    (d) => Math.abs(d.arc - currentAge) <= 1.0,
  );

  const pastDirections = filtered.filter((d) => d.arc < currentAge - 1.0);
  const futureDirections = filtered.filter((d) => d.arc > currentAge + 1.0);

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
          Primary Directions{' '}
          {name ? <span className="text-muted-foreground font-normal">for {name}</span> : null}
        </h3>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Ptolemaic semi-arc method &mdash; 1&deg; = 1 year (Ptolemy's key)
        </p>
      </div>

      <ToolGuide
        title="Primary Directions"
        description="The oldest predictive technique in astrology. Primary directions use the Earth's daily rotation (not planetary motion) to 'direct' planets and angles to aspect positions. Each degree of right ascension equals roughly one year of life."
        tips={[
          "Directions to the Ascendant and Midheaven are the most significant — they mark life-defining events",
          "Use the filters to focus on specific planet pairs or aspect types",
          "Applying directions (approaching exact) are more powerful than separating ones",
          "Ptolemaic semi-arc method is used here — the traditional gold standard",
          "The arc column shows the directed distance; the age/year columns show when it becomes exact",
        ]}
      />

      {/* Filter Controls */}
      <FilterBar
        showDirect={showDirect}
        showConverse={showConverse}
        sigFilter={sigFilter}
        aspectFilter={aspectFilter}
        onToggleDirect={() => setShowDirect(!showDirect)}
        onToggleConverse={() => setShowConverse(!showConverse)}
        onSigFilter={setSigFilter}
        onAspectFilter={setAspectFilter}
      />

      {/* Active Directions (Currently Perfecting) */}
      {activeDirections.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-500/80 mb-1.5">
            Currently Active (within 1&deg; orb)
          </h4>
          <div className="space-y-1">
            {activeDirections.map((d, i) => (
              <DirectionCard key={`active-${i}`} direction={d} currentAge={currentAge} isActive />
            ))}
          </div>
        </div>
      )}

      {/* Timeline Visualization */}
      <TimelineVisualization
        directions={filtered}
        currentAge={currentAge}
        birthYear={birthYear}
      />

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-xs text-muted-foreground/70 text-center py-8">No results match the current filters</div>
      )}

      {/* Future Directions */}
      {futureDirections.length > 0 && (
        <>
          <DirectionsTable
            label="Upcoming Directions"
            directions={showAllFuture ? futureDirections.slice(0, 30) : futureDirections.slice(0, 10)}
            currentAge={currentAge}
          />
          {!showAllFuture && futureDirections.length > 10 && (
            <button
              onClick={() => setShowAllFuture(true)}
              className="w-full py-2 text-xs text-primary hover:text-primary/80 transition-colors text-center"
            >
              Show more ({futureDirections.length - 10} remaining)
            </button>
          )}
        </>
      )}

      {/* Past Directions */}
      {pastDirections.length > 0 && (
        <DirectionsTable
          label="Past Directions"
          directions={pastDirections.slice(-30).reverse()}
          currentAge={currentAge}
          dimmed
        />
      )}

      {/* Stats */}
      <div className="text-[11px] text-muted-foreground/60 text-center pt-2">
        {filtered.length} directions shown &middot; {directions.length} total computed &middot; Age {currentAge.toFixed(1)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FilterBar({
  showDirect,
  showConverse,
  sigFilter,
  aspectFilter,
  onToggleDirect,
  onToggleConverse,
  onSigFilter,
  onAspectFilter,
}: {
  showDirect: boolean;
  showConverse: boolean;
  sigFilter: string;
  aspectFilter: string;
  onToggleDirect: () => void;
  onToggleConverse: () => void;
  onSigFilter: (v: string) => void;
  onAspectFilter: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {/* Direction type toggles */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDirect}
          className={`px-2.5 py-1 rounded-full text-xs font-medium ring-1 transition-colors ${
            showDirect
              ? 'bg-sky-500/15 text-sky-400 ring-sky-500/40'
              : 'bg-muted/30 text-muted-foreground/60 ring-border/30'
          }`}
        >
          Direct
        </button>
        <button
          onClick={onToggleConverse}
          className={`px-2.5 py-1 rounded-full text-xs font-medium ring-1 transition-colors ${
            showConverse
              ? 'bg-violet-500/15 text-violet-400 ring-violet-500/40'
              : 'bg-muted/30 text-muted-foreground/60 ring-border/30'
          }`}
        >
          Converse
        </button>

        {/* Significator filter */}
        <select
          value={sigFilter}
          onChange={(e) => onSigFilter(e.target.value)}
          className="ml-auto bg-card/50 border border-border/50 rounded-md text-xs px-1.5 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border"
        >
          <option value="all">All Significators</option>
          <optgroup label="Angles">
            {ANGLES_LIST.map((a) => (
              <option key={a} value={a}>
                {PLANET_SYMBOLS[a]} {PLANET_NAMES[a]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Planets">
            {PLANETS_LIST.map((p) => (
              <option key={p} value={p}>
                {PLANET_SYMBOLS[p]} {PLANET_NAMES[p]}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Aspect filter */}
        <select
          value={aspectFilter}
          onChange={(e) => onAspectFilter(e.target.value)}
          className="bg-card/50 border border-border/50 rounded-md text-xs px-1.5 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border"
        >
          <option value="all">All Aspects</option>
          {(Object.keys(ASPECT_ANGLES) as AspectType[]).map((a) => (
            <option key={a} value={a}>
              {ASPECT_LABELS[a]} ({ASPECT_ANGLES[a]}&deg;)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function DirectionCard({
  direction,
  currentAge,
  isActive,
}: {
  direction: Direction;
  currentAge: number;
  isActive?: boolean;
}) {
  const d = direction;
  const promColors = PLANET_COLORS[d.promissor] || PLANET_COLORS.sun;
  const sigColors = PLANET_COLORS[d.significator] || PLANET_COLORS.sun;
  const aspColor = ASPECT_COLORS[d.aspect];
  const orbDeg = Math.abs(d.arc - currentAge);
  const applying = d.arc > currentAge;

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors ${
        isActive
          ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
          : 'border-border/30 hover:border-border/50'
      }`}
    >
      {/* Promissor */}
      <span className={`text-sm ${promColors.text}`} title={PLANET_NAMES[d.promissor]} style={SYMBOL_FONT}>
        {PLANET_SYMBOLS[d.promissor]}
      </span>

      {/* Arrow + aspect */}
      <span className={`text-xs ${aspColor}`} title={d.aspect}>
        {ASPECT_LABELS[d.aspect]}
      </span>
      <span className="text-xs text-muted-foreground/60">{'\u2192'}</span>

      {/* Significator */}
      <span className={`text-sm ${sigColors.text}`} title={PLANET_NAMES[d.significator]} style={SYMBOL_FONT}>
        {PLANET_SYMBOLS[d.significator]}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0 ml-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {PLANET_NAMES[d.promissor]} {ASPECT_LABELS[d.aspect]} {PLANET_NAMES[d.significator]}
          </span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full ${
              d.type === 'direct'
                ? 'bg-sky-500/10 text-sky-400'
                : 'bg-violet-500/10 text-violet-400'
            }`}
          >
            {d.type === 'direct' ? 'D' : 'C'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono font-medium">
            Age {d.age.toFixed(1)}
          </span>
          <span className="text-[11px] text-muted-foreground/70">
            ({d.year})
          </span>
          <span className="text-[11px] text-muted-foreground/70">
            Arc {d.arc.toFixed(2)}&deg;
          </span>
          {isActive && (
            <span className={`text-[11px] font-medium ${applying ? 'text-amber-400' : 'text-amber-500/60'}`}>
              {applying ? 'applying' : 'separating'} {orbDeg.toFixed(2)}&deg;
            </span>
          )}
        </div>
        {isActive && DIRECTION_MEANINGS[d.significator]?.[d.aspect] && (
          <div className="mt-1.5">
            <InterpretationCard>
              {DIRECTION_MEANINGS[d.significator][d.aspect]}
            </InterpretationCard>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineVisualization({
  directions,
  currentAge,
  birthYear,
}: {
  directions: Direction[];
  currentAge: number;
  birthYear: number;
}) {
  // Group directions into 5-year buckets
  const buckets: Record<number, number> = {};
  for (let i = 0; i < MAX_AGE; i += 5) {
    buckets[i] = 0;
  }
  for (const d of directions) {
    const bucket = Math.floor(d.age / 5) * 5;
    if (bucket >= 0 && bucket < MAX_AGE) {
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    }
  }

  const maxCount = Math.max(1, ...Object.values(buckets));
  const currentBucket = Math.floor(currentAge / 5) * 5;

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
        Direction Density by Age
      </h4>
      <div className="flex items-end gap-px h-16 rounded-lg border border-border/40 bg-muted/20 p-1.5 overflow-hidden">
        {Object.entries(buckets)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([ageStr, count]) => {
            const age = Number(ageStr);
            const height = (count / maxCount) * 100;
            const isCurrent = age === currentBucket;
            const isPast = age + 5 < currentAge;

            return (
              <div
                key={age}
                className="flex-1 flex flex-col items-center justify-end"
                title={`Age ${age}-${age + 5}: ${count} directions`}
              >
                <div
                  className={`w-full rounded-t-sm transition-colors ${
                    isCurrent
                      ? 'bg-amber-500'
                      : isPast
                        ? 'bg-muted-foreground/20'
                        : 'bg-sky-500/50'
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
            );
          })}
      </div>
      <div className="flex justify-between mt-0.5 px-1">
        <span className="text-[11px] text-muted-foreground/60">0</span>
        <span className="text-[11px] text-muted-foreground/60">15</span>
        <span className="text-[11px] text-muted-foreground/60">30</span>
        <span className="text-[11px] text-muted-foreground/60">45</span>
        <span className="text-[11px] text-muted-foreground/60">60</span>
        <span className="text-[11px] text-muted-foreground/60">75</span>
        <span className="text-[11px] text-muted-foreground/60">90</span>
      </div>
    </div>
  );
}

function DirectionsTable({
  label,
  directions,
  currentAge,
  dimmed,
}: {
  label: string;
  directions: Direction[];
  currentAge: number;
  dimmed?: boolean;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
        {label}
      </h4>
      <div className="rounded-lg border border-border/50 overflow-hidden overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="text-left px-2 py-1.5 text-xs font-medium text-muted-foreground/60">Age</th>
              <th className="text-left px-2 py-1.5 text-xs font-medium text-muted-foreground/60">Year</th>
              <th className="text-left px-2 py-1.5 text-xs font-medium text-muted-foreground/60">Direction</th>
              <th className="text-center px-2 py-1.5 text-xs font-medium text-muted-foreground/60">Aspect</th>
              <th className="text-center px-2 py-1.5 text-xs font-medium text-muted-foreground/60">Type</th>
              <th className="text-right px-2 py-1.5 text-xs font-medium text-muted-foreground/60">Arc</th>
            </tr>
          </thead>
          <tbody>
            {directions.map((d, i) => {
              const promColors = PLANET_COLORS[d.promissor] || PLANET_COLORS.sun;
              const sigColors = PLANET_COLORS[d.significator] || PLANET_COLORS.sun;
              const aspColor = ASPECT_COLORS[d.aspect];
              const isNearCurrent = Math.abs(d.arc - currentAge) <= 2;

              return (
                <tr
                  key={i}
                  className={`border-b border-border/20 transition-colors cursor-pointer ${
                    isNearCurrent
                      ? 'bg-amber-500/5 font-medium'
                      : dimmed
                        ? 'opacity-50 hover:opacity-75'
                        : 'hover:bg-muted/30'
                  }`}
                >
                  <td className="px-2 py-1.5 font-mono tabular-nums text-xs">{d.age.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-muted-foreground text-xs font-mono tabular-nums">{d.year}</td>
                  <td className="px-2 py-1.5">
                    <span className={`${promColors.text} mr-0.5`} style={SYMBOL_FONT}>{PLANET_SYMBOLS[d.promissor]}</span>
                    <span className="text-muted-foreground/60 mx-0.5">{'\u2192'}</span>
                    <span className={`${sigColors.text} ml-0.5`} style={SYMBOL_FONT}>{PLANET_SYMBOLS[d.significator]}</span>
                  </td>
                  <td className={`px-2 py-1.5 text-center text-xs ${aspColor}`}>
                    {ASPECT_LABELS[d.aspect]}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                        d.type === 'direct'
                          ? 'bg-sky-500/10 text-sky-400'
                          : 'bg-violet-500/10 text-violet-400'
                      }`}
                    >
                      {d.type === 'direct' ? 'Dir' : 'Con'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xs text-muted-foreground">
                    {d.arc.toFixed(2)}&deg;
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
