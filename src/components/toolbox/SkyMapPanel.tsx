/**
 * Sky Map Panel
 * 2D stereographic projection planetarium view rendered as SVG.
 * Shows planets projected onto altitude/azimuth coordinates for the birth moment,
 * with zodiacal constellation stick figures and the ecliptic line.
 */

import React, { useMemo, useState } from 'react';
import { ToolGuide } from './ToolGuide';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean }>;
    houses?: { cusps?: number[]; ascendant?: number; mc?: number };
  };
  birthDate: string;
  birthTime?: string;
  name?: string;
  lat: number;
  lng: number;
}

interface ProjectedPlanet {
  key: string;
  symbol: string;
  color: string;
  alt: number;
  az: number;
  x: number;
  y: number;
  aboveHorizon: boolean;
  longitude: number;
  sign: string;
  retrograde?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIZE = 500;
const CX = SIZE / 2;
const CY = SIZE / 2;
const HORIZON_R = 220;

const PLANET_ORDER = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','NorthNode','Chiron'];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun:'\u2609\uFE0E', Moon:'\u263D\uFE0E', Mercury:'\u263F\uFE0E', Venus:'\u2640\uFE0E', Mars:'\u2642\uFE0E',
  Jupiter:'\u2643\uFE0E', Saturn:'\u2644\uFE0E', Uranus:'\u26E2\uFE0E', Neptune:'\u2646\uFE0E', Pluto:'\u2647\uFE0E',
  NorthNode:'\u260A\uFE0E', SouthNode:'\u260B\uFE0E', Chiron:'\u26B7\uFE0E',
};

const PLANET_COLORS: Record<string, string> = {
  Sun:'#FFD700', Moon:'#C0C0C0', Mercury:'#00CED1', Venus:'#FF69B4', Mars:'#FF4500',
  Jupiter:'#9370DB', Saturn:'#8B4513', Uranus:'#00FFFF', Neptune:'#0000FF', Pluto:'#800080',
  NorthNode:'#E6E6FA', Chiron:'#50C878',
};

const PLANET_SIZES: Record<string, number> = {
  Sun: 26, Moon: 24, Mercury: 20, Venus: 21, Mars: 21,
  Jupiter: 22, Saturn: 22, Uranus: 20, Neptune: 20, Pluto: 18,
  NorthNode: 17, Chiron: 17,
};

const OBLIQUITY = 23.44; // degrees

const DEG = Math.PI / 180;

/* ------------------------------------------------------------------ */
/*  Zodiacal constellation stick-figure data                           */
/*  Each star is given as (ecliptic longitude, ecliptic latitude)      */
/*  and lines connect indices.                                         */
/* ------------------------------------------------------------------ */

interface ConstellationData {
  name: string;
  symbol: string;
  stars: [number, number][]; // [eclLon, eclLat]
  lines: [number, number][];
}

const CONSTELLATIONS: ConstellationData[] = [
  { name: 'Aries', symbol: '\u2648\uFE0E',
    stars: [[6,10],[11,8],[18,10],[25,9]],
    lines: [[0,1],[1,2],[2,3]] },
  { name: 'Taurus', symbol: '\u2649\uFE0E',
    stars: [[35,4],[40,6],[48,9],[51,14],[55,5]],
    lines: [[0,1],[1,2],[2,3],[1,4]] },
  { name: 'Gemini', symbol: '\u264A\uFE0E',
    stars: [[65,6],[68,10],[73,7],[76,12],[80,5]],
    lines: [[0,1],[2,3],[0,2],[1,3],[2,4]] },
  { name: 'Cancer', symbol: '\u264B\uFE0E',
    stars: [[95,1],[100,3],[105,7],[108,2]],
    lines: [[0,1],[1,2],[1,3]] },
  { name: 'Leo', symbol: '\u264C\uFE0E',
    stars: [[125,0],[130,6],[135,12],[140,8],[148,6],[150,0]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]] },
  { name: 'Virgo', symbol: '\u264D\uFE0E',
    stars: [[155,2],[162,8],[170,10],[178,5],[175,0]],
    lines: [[0,1],[1,2],[2,3],[3,4],[3,1]] },
  { name: 'Libra', symbol: '\u264E\uFE0E',
    stars: [[195,0],[200,6],[210,8],[215,2]],
    lines: [[0,1],[1,2],[2,3],[3,0]] },
  { name: 'Scorpio', symbol: '\u264F\uFE0E',
    stars: [[225,-4],[230,0],[235,-6],[240,-10],[245,-14]],
    lines: [[0,1],[1,2],[2,3],[3,4]] },
  { name: 'Sagittarius', symbol: '\u2650\uFE0E',
    stars: [[260,-6],[265,-2],[270,-8],[275,-4],[280,-10]],
    lines: [[0,1],[1,3],[0,2],[2,4]] },
  { name: 'Capricorn', symbol: '\u2651\uFE0E',
    stars: [[300,-12],[305,-8],[310,-14],[315,-10],[320,-6]],
    lines: [[0,1],[1,4],[0,2],[2,3],[3,4]] },
  { name: 'Aquarius', symbol: '\u2652\uFE0E',
    stars: [[325,-8],[330,-4],[338,-6],[345,-2],[350,-8]],
    lines: [[0,1],[1,2],[2,3],[3,4]] },
  { name: 'Pisces', symbol: '\u2653\uFE0E',
    stars: [[350,2],[355,8],[0,4],[5,10],[10,6]],
    lines: [[0,1],[1,2],[2,3],[3,4]] },
];

/* ------------------------------------------------------------------ */
/*  Coordinate conversions                                             */
/* ------------------------------------------------------------------ */

function eclipticToEquatorial(eclLon: number, eclLat: number): { ra: number; dec: number } {
  const l = eclLon * DEG;
  const b = eclLat * DEG;
  const e = OBLIQUITY * DEG;
  const sinDec = Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec))) / DEG;
  const y = Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e);
  const x = Math.cos(l);
  let ra = Math.atan2(y, x) / DEG;
  if (ra < 0) ra += 360;
  return { ra, dec };
}

function equatorialToHorizontal(ra: number, dec: number, lst: number, lat: number): { alt: number; az: number } {
  const ha = (lst - ra) * DEG;
  const d = dec * DEG;
  const phi = lat * DEG;
  const sinAlt = Math.sin(d) * Math.sin(phi) + Math.cos(d) * Math.cos(phi) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / DEG;
  const cosA = (Math.sin(d) - Math.sin(alt * DEG) * Math.sin(phi)) / (Math.cos(alt * DEG) * Math.cos(phi));
  let az = Math.acos(Math.max(-1, Math.min(1, cosA))) / DEG;
  if (Math.sin(ha) > 0) az = 360 - az;
  return { alt, az };
}

/** Approximate LST in degrees from date/time + geographic longitude */
function computeLST(dateStr: string, lngDeg: number, timeStr?: string): number {
  const d = new Date(dateStr + (timeStr ? `T${timeStr}:00` : 'T12:00:00'));
  // Julian date from J2000.0
  const jd = (d.getTime() / 86400000) + 2440587.5;
  const T = (jd - 2451545.0) / 36525.0;
  // Greenwich mean sidereal time in degrees
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
  gmst = ((gmst % 360) + 360) % 360;
  let lst = gmst + lngDeg;
  lst = ((lst % 360) + 360) % 360;
  return lst;
}

/** Stereographic projection: alt/az to x,y on the circular map */
function projectToCircle(alt: number, az: number): { x: number; y: number } {
  // radius: zenith=0, horizon=HORIZON_R. Below horizon extends slightly beyond.
  const r = HORIZON_R * (90 - alt) / 90;
  // Azimuth: North at top. SVG: 0deg = right, so rotate.
  // az=0 (North) -> angle = -90 (top)
  const angle = (az - 90) * DEG; // -90 so North is up
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function getDegreeInSign(longitude: number): number {
  return longitude % 30;
}

export function SkyMapPanel({ natalChart, birthDate, birthTime, name, lat, lng }: Props) {
  const [showConstellationNames, setShowConstellationNames] = useState(true);
  const [showEcliptic, setShowEcliptic] = useState(true);
  const [showPlanetLabels, setShowPlanetLabels] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<ProjectedPlanet | null>(null);

  const lst = useMemo(() => computeLST(birthDate, lng, birthTime), [birthDate, lng, birthTime]);

  // Project planets
  const projectedPlanets = useMemo(() => {
    const result: ProjectedPlanet[] = [];
    for (const key of PLANET_ORDER) {
      const p = natalChart.planets[key] || natalChart.planets[key.toLowerCase()];
      if (!p) continue;
      const { ra, dec } = eclipticToEquatorial(p.longitude, 0);
      const { alt, az } = equatorialToHorizontal(ra, dec, lst, lat);
      const { x, y } = projectToCircle(alt, az);
      result.push({
        key, symbol: PLANET_SYMBOLS[key] || key[0],
        color: PLANET_COLORS[key] || '#FFFFFF',
        alt, az, x, y,
        aboveHorizon: alt >= 0,
        longitude: p.longitude, sign: p.sign,
        retrograde: p.retrograde,
      });
    }
    return result;
  }, [natalChart, lst, lat]);

  // Project constellation stars
  const projectedConstellations = useMemo(() => {
    return CONSTELLATIONS.map(c => {
      const stars = c.stars.map(([eclLon, eclLat]) => {
        const { ra, dec } = eclipticToEquatorial(eclLon, eclLat);
        const { alt, az } = equatorialToHorizontal(ra, dec, lst, lat);
        return { ...projectToCircle(alt, az), alt, az };
      });
      // Center label position
      const avgX = stars.reduce((s, st) => s + st.x, 0) / stars.length;
      const avgY = stars.reduce((s, st) => s + st.y, 0) / stars.length;
      return { ...c, stars, labelX: avgX, labelY: avgY };
    });
  }, [lst, lat]);

  // Ecliptic line: sample points along ecliptic longitude 0-360
  const eclipticPoints = useMemo(() => {
    const pts: { x: number; y: number; alt: number }[] = [];
    for (let lon = 0; lon < 360; lon += 3) {
      const { ra, dec } = eclipticToEquatorial(lon, 0);
      const { alt, az } = equatorialToHorizontal(ra, dec, lst, lat);
      const { x, y } = projectToCircle(alt, az);
      pts.push({ x, y, alt });
    }
    return pts;
  }, [lst, lat]);

  const eclipticPath = useMemo(() => {
    if (eclipticPoints.length === 0) return '';
    let d = `M ${eclipticPoints[0].x} ${eclipticPoints[0].y}`;
    for (let i = 1; i < eclipticPoints.length; i++) {
      const prev = eclipticPoints[i - 1];
      const cur = eclipticPoints[i];
      // Break path if points jump too far (wrapping)
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      if (Math.sqrt(dx * dx + dy * dy) > 100) {
        d += ` M ${cur.x} ${cur.y}`;
      } else {
        d += ` L ${cur.x} ${cur.y}`;
      }
    }
    return d;
  }, [eclipticPoints]);

  const aboveCount = projectedPlanets.filter(p => p.aboveHorizon).length;
  const belowCount = projectedPlanets.length - aboveCount;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
        <h3 className="text-sm font-semibold mb-1">
          Sky Map {name ? `- ${name}` : ''}
        </h3>
        <p className="text-xs text-muted-foreground">
          Stereographic sky projection for the birth moment. Zenith at center, horizon at edge.
          Lat {lat.toFixed(2)}, Lng {lng.toFixed(2)} | LST {(lst / 15).toFixed(1)}h
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {aboveCount} planet{aboveCount !== 1 ? 's' : ''} above horizon, {belowCount} below
        </p>
      </div>

      <ToolGuide
        title="Sky Map"
        description="A stereographic projection showing the actual sky at the moment of birth from the birth location. Planets and constellations are plotted on a horizon-centered map with zenith at center, showing what was visible above and below the horizon."
        tips={[
          "Planets near the zenith (center) were directly overhead at birth — they carry strong influence",
          "Planets near the horizon edges were rising or setting — angular and powerful",
          "East is on the left (astronomical convention when looking up at the sky)",
          "The ecliptic line shows the Sun's apparent path — planets cluster near it",
          "Compare what you see here with your chart — angular planets will be near the horizon or zenith",
        ]}
      />

      {/* Toggles */}
      <div className="flex gap-3 flex-wrap">
        <label className="flex items-center gap-1 text-xs cursor-pointer">
          <input type="checkbox" checked={showConstellationNames} onChange={e => setShowConstellationNames(e.target.checked)} className="w-3 h-3" />
          Constellation names
        </label>
        <label className="flex items-center gap-1 text-xs cursor-pointer">
          <input type="checkbox" checked={showEcliptic} onChange={e => setShowEcliptic(e.target.checked)} className="w-3 h-3" />
          Ecliptic
        </label>
        <label className="flex items-center gap-1 text-xs cursor-pointer">
          <input type="checkbox" checked={showPlanetLabels} onChange={e => setShowPlanetLabels(e.target.checked)} className="w-3 h-3" />
          Planet labels
        </label>
      </div>

      {/* SVG Sky Map */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[500px] mx-auto block">
          <defs>
            <radialGradient id="skyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0d1440" />
              <stop offset="60%" stopColor="#141852" />
              <stop offset="100%" stopColor="#1c1f5a" />
            </radialGradient>
            <clipPath id="horizonClip">
              <circle cx={CX} cy={CY} r={HORIZON_R + 30} />
            </clipPath>
          </defs>

          {/* Background */}
          <circle cx={CX} cy={CY} r={HORIZON_R + 30} fill="url(#skyGrad)" />

          {/* Below-horizon tint overlay */}
          <rect x={0} y={CY} width={SIZE} height={SIZE / 2}
            fill="#000" opacity={0.25} clipPath="url(#horizonClip)" />

          {/* Altitude circles (30, 60) */}
          <circle cx={CX} cy={CY} r={HORIZON_R * 60 / 90} fill="none" stroke="#333" strokeWidth={0.5} strokeDasharray="4 4" />
          <circle cx={CX} cy={CY} r={HORIZON_R * 30 / 90} fill="none" stroke="#333" strokeWidth={0.5} strokeDasharray="4 4" />
          {/* Zenith dot */}
          <circle cx={CX} cy={CY} r={2} fill="#555" />

          {/* Horizon circle */}
          <circle cx={CX} cy={CY} r={HORIZON_R} fill="none" stroke="#7788aa" strokeWidth={1.5} />
          {/* Dashed horizon indicator */}
          <circle cx={CX} cy={CY} r={HORIZON_R} fill="none" stroke="#99aacc" strokeWidth={0.5} strokeDasharray="6 4" />

          {/* Horizon area labels */}
          <text x={CX} y={CY - HORIZON_R + 20} textAnchor="middle" fill="#7799bb" fontSize={10} opacity={0.6} fontStyle="italic">Above Horizon</text>
          <text x={CX} y={CY + HORIZON_R - 10} textAnchor="middle" fill="#7799bb" fontSize={10} opacity={0.6} fontStyle="italic">Below Horizon</text>

          {/* Cardinal directions */}
          <text x={CX} y={CY - HORIZON_R - 8} textAnchor="middle" fill="#bbb" fontSize={14} fontWeight="bold">N</text>
          <text x={CX} y={CY + HORIZON_R + 18} textAnchor="middle" fill="#bbb" fontSize={14} fontWeight="bold">S</text>
          <text x={CX + HORIZON_R + 12} y={CY + 5} textAnchor="start" fill="#bbb" fontSize={14} fontWeight="bold">W</text>
          <text x={CX - HORIZON_R - 12} y={CY + 5} textAnchor="end" fill="#bbb" fontSize={14} fontWeight="bold">E</text>

          {/* Altitude labels */}
          <text x={CX + 6} y={CY - HORIZON_R * 60 / 90 + 14} fill="#667" fontSize={10}>30°</text>
          <text x={CX + 6} y={CY - HORIZON_R * 30 / 90 + 14} fill="#667" fontSize={10}>60°</text>

          {/* Constellation lines */}
          {projectedConstellations.map((c, ci) => (
            <g key={ci} opacity={0.55}>
              {c.lines.map(([a, b], li) => {
                const sa = c.stars[a];
                const sb = c.stars[b];
                if (!sa || !sb) return null;
                const dx = sa.x - sb.x;
                const dy = sa.y - sb.y;
                if (Math.sqrt(dx * dx + dy * dy) > 200) return null;
                return (
                  <line key={li} x1={sa.x} y1={sa.y} x2={sb.x} y2={sb.y}
                    stroke="#5599bb" strokeWidth={1.2} />
                );
              })}
              {c.stars.map((st, si) => (
                <circle key={si} cx={st.x} cy={st.y} r={2.5} fill="#88bbdd" />
              ))}
              {showConstellationNames && (
                <text x={c.labelX} y={c.labelY - 8} textAnchor="middle"
                  fill="#77aacc" fontSize={11} opacity={0.8}>{c.name}</text>
              )}
            </g>
          ))}

          {/* Ecliptic line */}
          {showEcliptic && eclipticPath && (
            <path d={eclipticPath} fill="none" stroke="#cc6633" strokeWidth={1}
              strokeDasharray="6 3" opacity={0.6} />
          )}

          {/* Planets */}
          {projectedPlanets.map(p => {
            const sz = PLANET_SIZES[p.key] || 14;
            const opacity = p.aboveHorizon ? 1 : 0.55;
            const isSelected = selectedPlanet?.key === p.key;
            const deg = getDegreeInSign(p.longitude);
            return (
              <g key={p.key} opacity={opacity} style={{ cursor: 'pointer' }}
                onClick={() => setSelectedPlanet(prev => prev?.key === p.key ? null : p)}>
                {/* Hit area for easier clicking */}
                <circle cx={p.x} cy={p.y} r={sz * 0.8} fill="transparent" />
                {/* Selection ring */}
                {isSelected && (
                  <circle cx={p.x} cy={p.y} r={sz * 0.7} fill="none"
                    stroke={p.color} strokeWidth={1.5} opacity={0.6} />
                )}
                <text x={p.x} y={p.y + sz / 3} textAnchor="middle"
                  fill={p.color} fontSize={sz} fontWeight="bold"
                  style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif", filter: p.aboveHorizon ? 'drop-shadow(0 0 4px currentColor)' : 'none' }}>
                  {p.symbol}
                </text>
                {showPlanetLabels && (
                  <>
                    <text x={p.x} y={p.y + sz / 3 + 14} textAnchor="middle"
                      fill={p.color} fontSize={11} opacity={0.85}>
                      {p.key}{p.retrograde ? ' R' : ''}
                    </text>
                    <text x={p.x} y={p.y + sz / 3 + 25} textAnchor="middle"
                      fill={p.color} fontSize={9} opacity={0.6}>
                      {deg.toFixed(0)}° {p.sign}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Ecliptic label */}
          {showEcliptic && (
            <text x={CX} y={CY + HORIZON_R + 32} textAnchor="middle"
              fill="#cc6633" fontSize={10} opacity={0.6}>Ecliptic</text>
          )}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground/60">
          <span>● Planet above horizon</span>
          <span style={{ opacity: 0.55 }}>● Below horizon</span>
          <span><span className="inline-block w-4 border-t border-dashed" style={{ borderColor: '#cc6633' }} /> Ecliptic</span>
        </div>
      </div>

      {/* Selected planet info card */}
      {selectedPlanet && (
        <div className="rounded-lg border border-border/50 bg-card/80 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span style={{ color: selectedPlanet.color, fontSize: 20, fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', sans-serif" }}>{selectedPlanet.symbol}</span>
              <span className="text-sm font-semibold">{selectedPlanet.key}</span>
              {selectedPlanet.retrograde && <span className="text-[10px] text-amber-500 font-medium">Retrograde</span>}
            </div>
            <button onClick={() => setSelectedPlanet(null)} className="text-muted-foreground/70 hover:text-foreground text-xs px-1">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <div>Sign: <span className="text-foreground/80">{getDegreeInSign(selectedPlanet.longitude).toFixed(1)}° {selectedPlanet.sign}</span></div>
            <div>Longitude: <span className="text-foreground/80">{selectedPlanet.longitude.toFixed(2)}°</span></div>
            <div>Altitude: <span className="text-foreground/80">{selectedPlanet.alt.toFixed(1)}°</span></div>
            <div>Azimuth: <span className="text-foreground/80">{selectedPlanet.az.toFixed(1)}°</span></div>
            <div className="col-span-2">
              Status: <span className={selectedPlanet.aboveHorizon ? 'text-green-500' : 'text-red-400'}>
                {selectedPlanet.aboveHorizon ? '▲ Above Horizon' : '▼ Below Horizon'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Planet table */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
        <h4 className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-2">Planet Positions</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {projectedPlanets.map(p => (
            <div key={p.key} className="flex items-center gap-1.5 text-[11px]">
              <span style={{ color: p.color, fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', sans-serif" }}>{p.symbol}</span>
              <span className="text-foreground/80">{p.key}</span>
              <span className={p.aboveHorizon ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {p.aboveHorizon ? '▲' : '▼'}
              </span>
              <span className="text-muted-foreground ml-auto font-mono tabular-nums">
                Alt {p.alt.toFixed(1)}° Az {p.az.toFixed(1)}°
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">▲</span> Above horizon{' '}
          <span className="text-red-600 dark:text-red-400">▼</span> Below horizon
        </div>
      </div>
    </div>
  );
}
