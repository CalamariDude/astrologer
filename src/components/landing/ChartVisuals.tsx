import React, { useState } from 'react';

// ── Shared constants matching actual BiWheel rendering ──────────────────

const FONT = "'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif";

const ZODIAC = [
  { symbol: '\u2648\uFE0E', element: 'fire' },
  { symbol: '\u2649\uFE0E', element: 'earth' },
  { symbol: '\u264A\uFE0E', element: 'air' },
  { symbol: '\u264B\uFE0E', element: 'water' },
  { symbol: '\u264C\uFE0E', element: 'fire' },
  { symbol: '\u264D\uFE0E', element: 'earth' },
  { symbol: '\u264E\uFE0E', element: 'air' },
  { symbol: '\u264F\uFE0E', element: 'water' },
  { symbol: '\u2650\uFE0E', element: 'fire' },
  { symbol: '\u2651\uFE0E', element: 'earth' },
  { symbol: '\u2652\uFE0E', element: 'air' },
  { symbol: '\u2653\uFE0E', element: 'water' },
];

const ELEM = { fire: '#ff6600', earth: '#009933', air: '#cc9900', water: '#0099cc' } as Record<string, string>;
const ELEM_BG = { fire: '#ff660030', earth: '#00993330', air: '#cc990030', water: '#0099cc30' } as Record<string, string>;

// Brightened for dark background visibility (landing page only)
const P_COLOR: Record<string, string> = {
  sun: '#FFB300', moon: '#C0C0C0', mercury: '#FDD835', venus: '#F48FB1',
  mars: '#EF5350', jupiter: '#9575CD', saturn: '#A1887F', uranus: '#64B5F6',
  neptune: '#4DD0E1', pluto: '#CE93D8', northnode: '#90A4AE', chiron: '#BCAAA4',
};

const P_SYMBOL: Record<string, string> = {
  sun: '\u2609\uFE0E', moon: '\u263D\uFE0E', mercury: '\u263F\uFE0E', venus: '\u2640\uFE0E',
  mars: '\u2642\uFE0E', jupiter: '\u2643\uFE0E', saturn: '\u2644\uFE0E', uranus: '\u2645\uFE0E',
  neptune: '\u2646\uFE0E', pluto: '\u2647\uFE0E', northnode: '\u260A\uFE0E', chiron: '\u26B7\uFE0E',
};

const ASP_COLOR: Record<string, string> = {
  conjunction: '#daa520', sextile: '#1e5aa8', square: '#c41e3a', trine: '#00bcd4', opposition: '#c41e3a',
};

// Coordinate helpers matching BiWheel's longitudeToXY
function lngToXY(lng: number, cx: number, cy: number, r: number, rotOff: number) {
  const a = (90 + lng + rotOff) * (Math.PI / 180);
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

function segmentPath(cx: number, cy: number, rInner: number, rOuter: number, startLng: number, endLng: number, rotOff: number) {
  const s1 = lngToXY(startLng, cx, cy, rInner, rotOff);
  const s2 = lngToXY(startLng, cx, cy, rOuter, rotOff);
  const e1 = lngToXY(endLng, cx, cy, rInner, rotOff);
  const e2 = lngToXY(endLng, cx, cy, rOuter, rotOff);
  return `M${s1.x},${s1.y} L${s2.x},${s2.y} A${rOuter},${rOuter} 0 0,0 ${e2.x},${e2.y} L${e1.x},${e1.y} A${rInner},${rInner} 0 0,1 ${s1.x},${s1.y}`;
}

/**
 * Natal chart wheel matching the actual BiWheel rendering style.
 * Uses exact Unicode symbols with \uFE0E, element colors, planet colors, and aspect colors from constants.ts.
 */
export function NatalChartVisual({ className = '' }: { className?: string }) {
  const size = 500;
  const cx = size / 2, cy = size / 2;
  const outerR = 230, zodiacInner = 190, planetR = 160, innerR = 130, aspectR = 100, houseR = 60;

  // Rotation: ASC at 9 o'clock (left). ASC longitude = 12° Aries
  const ascLng = 12;
  const rotOff = 90 - ascLng;

  const houseCusps = [12, 42, 68, 98, 132, 162, 192, 222, 248, 278, 312, 342];

  // Sample planets with realistic longitudes
  const planets = [
    { key: 'sun', lng: 356.5, deg: 26, min: 30, signIdx: 11 },
    { key: 'moon', lng: 85.2, deg: 25, min: 12, signIdx: 2 },
    { key: 'mercury', lng: 340.1, deg: 10, min: 6, signIdx: 11 },
    { key: 'venus', lng: 15.8, deg: 15, min: 48, signIdx: 0 },
    { key: 'mars', lng: 148.3, deg: 28, min: 18, signIdx: 4 },
    { key: 'jupiter', lng: 310.0, deg: 10, min: 0, signIdx: 10 },
    { key: 'saturn', lng: 8.5, deg: 8, min: 30, signIdx: 0 },
    { key: 'uranus', lng: 56.2, deg: 26, min: 12, signIdx: 1 },
    { key: 'neptune', lng: 28.7, deg: 28, min: 42, signIdx: 0 },
    { key: 'northnode', lng: 190.4, deg: 10, min: 24, signIdx: 6 },
    { key: 'chiron', lng: 22.5, deg: 22, min: 30, signIdx: 0 },
    { key: 'pluto', lng: 303.8, deg: 3, min: 48, signIdx: 10 },
  ];

  // Collision avoidance (simple spread for decorative display)
  const displayed = planets.map(p => ({ ...p, dispLng: p.lng }));
  displayed.sort((a, b) => a.lng - b.lng);
  for (let pass = 0; pass < 20; pass++) {
    for (let i = 0; i < displayed.length; i++) {
      const cur = displayed[i];
      const nxt = displayed[(i + 1) % displayed.length];
      let diff = nxt.dispLng - cur.dispLng;
      if (diff < 0) diff += 360;
      if (diff < 5 && diff > 0.01) {
        const adj = (5 - diff) / 2 + 0.3;
        cur.dispLng = ((cur.dispLng - adj) + 360) % 360;
        nxt.dispLng = (nxt.dispLng + adj) % 360;
      }
    }
  }

  // Aspect lines (sample major aspects)
  const aspects = [
    { a: 0, b: 6, type: 'conjunction' },  // Sun conj Saturn
    { a: 0, b: 2, type: 'conjunction' },  // Sun conj Mercury
    { a: 3, b: 8, type: 'conjunction' },  // Venus conj Neptune
    { a: 1, b: 4, type: 'sextile' },     // Moon sextile Mars
    { a: 0, b: 5, type: 'sextile' },     // Sun sextile Jupiter
    { a: 4, b: 5, type: 'opposition' },  // Mars opp Jupiter
    { a: 3, b: 9, type: 'opposition' },  // Venus opp N.Node
    { a: 1, b: 7, type: 'trine' },       // Moon trine Uranus
    { a: 5, b: 11, type: 'square' },     // Jupiter square Pluto
  ];

  const pt = (lng: number, r: number) => lngToXY(lng, cx, cy, r, rotOff);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Full background */}
      <rect width={size} height={size} rx="24" fill="#0d1117" />

      {/* Structural rings */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#c9d1d9" strokeWidth="1.5" opacity={0.3} />
      <circle cx={cx} cy={cy} r={zodiacInner} fill="none" stroke="#c9d1d9" strokeWidth="1" opacity={0.25} />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#c9d1d9" strokeWidth="1" opacity={0.25} />
      <circle cx={cx} cy={cy} r={aspectR} fill="none" stroke="#c9d1d9" strokeWidth="0.5" opacity={0.1} />
      <circle cx={cx} cy={cy} r={houseR} fill="none" stroke="#c9d1d9" strokeWidth="0.5" opacity={0.08} />

      {/* Zodiac sign segments with element colors */}
      {ZODIAC.map((sign, i) => {
        const startLng = i * 30;
        const endLng = (i + 1) * 30;
        const midLng = startLng + 15;
        const color = ELEM[sign.element];
        const bg = ELEM_BG[sign.element];
        const labelPos = pt(midLng, (outerR + zodiacInner) / 2);
        const divStart = pt(startLng, zodiacInner);
        const divEnd = pt(startLng, outerR);

        return (
          <g key={`sign-${i}`}>
            <path d={segmentPath(cx, cy, zodiacInner, outerR, startLng, endLng, rotOff)} fill={bg} />
            <line x1={divStart.x} y1={divStart.y} x2={divEnd.x} y2={divEnd.y} stroke={color} strokeWidth="1" opacity={0.4} />
            <text x={labelPos.x} y={labelPos.y + 6} textAnchor="middle"
              fill={color} fontSize="18" fontFamily={FONT} fontWeight="600" opacity={0.95}>
              {sign.symbol}
            </text>
          </g>
        );
      })}

      {/* Degree ticks on zodiac ring */}
      {Array.from({ length: 360 }).map((_, d) => {
        if (d % 10 === 0) {
          const p1 = pt(d, outerR);
          const p2 = pt(d, outerR - 6);
          return <line key={`t-${d}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#c9d1d9" strokeWidth="0.5" opacity={0.15} />;
        }
        if (d % 5 === 0) {
          const p1 = pt(d, outerR);
          const p2 = pt(d, outerR - 4);
          return <line key={`t-${d}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#c9d1d9" strokeWidth="0.3" opacity={0.1} />;
        }
        return null;
      })}

      {/* House cusp lines */}
      {houseCusps.map((cusp, i) => {
        const p1 = pt(cusp, houseR);
        const p2 = pt(cusp, innerR);
        const isAngular = i === 0 || i === 3 || i === 6 || i === 9;
        const midCusp = cusp + (((houseCusps[(i + 1) % 12] - cusp + 360) % 360) / 2);
        const numPos = pt(midCusp, houseR * 0.55);
        return (
          <g key={`house-${i}`}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#c9d1d9"
              strokeWidth={isAngular ? 1.5 : 0.6}
              opacity={isAngular ? 0.35 : 0.12} />
            <text x={numPos.x} y={numPos.y + 3} textAnchor="middle"
              fill="#c9d1d9" fontSize="9" fontFamily={FONT} opacity={0.25}>{i + 1}</text>
          </g>
        );
      })}

      {/* Aspect lines */}
      {aspects.map((asp, i) => {
        const pA = pt(displayed[asp.a].dispLng, aspectR);
        const pB = pt(displayed[asp.b].dispLng, aspectR);
        const color = ASP_COLOR[asp.type] || '#daa520';
        const dashed = asp.type === 'square' || asp.type === 'opposition';
        return (
          <line key={`asp-${i}`} x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
            stroke={color} strokeWidth="1.5" opacity={0.6}
            strokeDasharray={dashed ? '4,3' : undefined} />
        );
      })}

      {/* Planet symbols with degree labels */}
      {displayed.map((p, i) => {
        const color = P_COLOR[p.key] || '#c9d1d9';
        const symbol = P_SYMBOL[p.key] || '?';
        const pos = pt(p.dispLng, planetR);
        const tick1 = pt(p.dispLng, innerR);
        const tick2 = pt(p.dispLng, innerR + 12);
        const signSymbol = ZODIAC[p.signIdx].symbol;
        const degLabel = `${p.deg}°`;
        const minLabel = `${String(p.min).padStart(2, '0')}'`;
        // Degree/sign/min rendered radially inward from planet
        const degPos = pt(p.dispLng, innerR + 16);
        const signPos = pt(p.dispLng, innerR + 26);
        const minPos = pt(p.dispLng, innerR + 36);

        return (
          <g key={`planet-${i}`}>
            {/* Tick mark from inner ring */}
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y}
              stroke={color} strokeWidth="0.6" opacity={0.35} />
            {/* Degree */}
            <text x={degPos.x} y={degPos.y + 2.5} textAnchor="middle"
              fill={color} fontSize="7" fontFamily={FONT} opacity={0.75}>{degLabel}</text>
            {/* Sign */}
            <text x={signPos.x} y={signPos.y + 3} textAnchor="middle"
              fill={ELEM[ZODIAC[p.signIdx].element]} fontSize="8" fontFamily={FONT} opacity={0.85}>{signSymbol}</text>
            {/* Minutes */}
            <text x={minPos.x} y={minPos.y + 2.5} textAnchor="middle"
              fill={color} fontSize="6" fontFamily={FONT} opacity={0.55}>{minLabel}</text>
            {/* Planet symbol */}
            <text x={pos.x} y={pos.y + 6} textAnchor="middle"
              fill={color} fontSize="18" fontWeight="900" fontFamily={FONT}
              stroke={color} strokeWidth="0.5">
              {symbol}
            </text>
          </g>
        );
      })}

      {/* ASC / MC labels */}
      {(() => {
        const ascP1 = pt(ascLng, innerR);
        const ascP2 = pt(ascLng, outerR + 8);
        const mcLng = houseCusps[9];
        const mcP1 = pt(mcLng, innerR);
        const mcP2 = pt(mcLng, outerR + 8);
        const ascLabel = pt(ascLng, outerR + 18);
        const mcLabel = pt(mcLng, outerR + 18);
        return (
          <>
            <line x1={ascP1.x} y1={ascP1.y} x2={ascP2.x} y2={ascP2.y}
              stroke="#ff3333" strokeWidth="1.8" opacity={0.7} />
            <text x={ascLabel.x} y={ascLabel.y + 4} textAnchor="middle"
              fill="#ff3333" fontSize="10" fontWeight="800" fontFamily={FONT} opacity={0.9}>AC</text>
            <line x1={mcP1.x} y1={mcP1.y} x2={mcP2.x} y2={mcP2.y}
              stroke="#ff3333" strokeWidth="1.2" opacity={0.5} />
            <text x={mcLabel.x} y={mcLabel.y + 4} textAnchor="middle"
              fill="#ff3333" fontSize="10" fontWeight="800" fontFamily={FONT} opacity={0.7}>MC</text>
          </>
        );
      })()}
    </svg>
  );
}

/**
 * Synastry biwheel matching actual BiWheel rendering.
 * Two concentric planet rings with zodiac outer ring and cross-chart aspect lines.
 */
export function SynastryVisual({ className = '' }: { className?: string }) {
  const size = 500;
  const cx = size / 2, cy = size / 2;
  const outerR = 230, zodiacInner = 195, aRing = 170, separator = 150, bRing = 125, aspectR = 95;

  const ascLng = 28; // Sample ASC at 28° Aries
  const rotOff = 90 - ascLng;

  // Person A planets (outer ring) — red tinted labels
  const personA = [
    { key: 'sun', lng: 45.5, signIdx: 1 },
    { key: 'moon', lng: 120.2, signIdx: 4 },
    { key: 'venus', lng: 72.8, signIdx: 2 },
    { key: 'mars', lng: 210.3, signIdx: 7 },
    { key: 'jupiter', lng: 290.0, signIdx: 9 },
    { key: 'saturn', lng: 338.5, signIdx: 11 },
    { key: 'mercury', lng: 55.1, signIdx: 1 },
    { key: 'neptune', lng: 358.7, signIdx: 11 },
  ];

  // Person B planets (inner ring) — blue tinted labels
  const personB = [
    { key: 'sun', lng: 356.5, signIdx: 11 },
    { key: 'moon', lng: 85.2, signIdx: 2 },
    { key: 'venus', lng: 15.8, signIdx: 0 },
    { key: 'mars', lng: 148.3, signIdx: 4 },
    { key: 'jupiter', lng: 310.0, signIdx: 10 },
    { key: 'saturn', lng: 8.5, signIdx: 0 },
    { key: 'mercury', lng: 340.1, signIdx: 11 },
    { key: 'uranus', lng: 56.2, signIdx: 1 },
  ];

  // Synastry aspects between charts
  const aspects = [
    { aIdx: 0, bIdx: 0, type: 'trine' },     // A Sun trine B Sun
    { aIdx: 1, bIdx: 3, type: 'conjunction' }, // A Moon conj B Mars
    { aIdx: 2, bIdx: 2, type: 'sextile' },    // A Venus sextile B Venus
    { aIdx: 3, bIdx: 1, type: 'square' },     // A Mars square B Moon
    { aIdx: 4, bIdx: 4, type: 'opposition' }, // A Jupiter opp B Jupiter
    { aIdx: 6, bIdx: 7, type: 'conjunction' }, // A Mercury conj B Uranus
  ];

  const pt = (lng: number, r: number) => lngToXY(lng, cx, cy, r, rotOff);

  const personAColor = '#ff3333';
  const personBColor = '#3399ff';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} rx="24" fill="#0d1117" />

      {/* Structural rings */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#c9d1d9" strokeWidth="1.5" opacity={0.3} />
      <circle cx={cx} cy={cy} r={zodiacInner} fill="none" stroke="#c9d1d9" strokeWidth="0.8" opacity={0.22} />
      <circle cx={cx} cy={cy} r={separator} fill="none" stroke="#c9d1d9" strokeWidth="1" opacity={0.25} />
      <circle cx={cx} cy={cy} r={aspectR} fill="none" stroke="#c9d1d9" strokeWidth="0.5" opacity={0.1} />

      {/* Zodiac sign segments */}
      {ZODIAC.map((sign, i) => {
        const startLng = i * 30;
        const endLng = (i + 1) * 30;
        const midLng = startLng + 15;
        const color = ELEM[sign.element];
        const bg = ELEM_BG[sign.element];
        const labelPos = pt(midLng, (outerR + zodiacInner) / 2);
        const divStart = pt(startLng, zodiacInner);
        const divEnd = pt(startLng, outerR);

        return (
          <g key={`sign-${i}`}>
            <path d={segmentPath(cx, cy, zodiacInner, outerR, startLng, endLng, rotOff)} fill={bg} />
            <line x1={divStart.x} y1={divStart.y} x2={divEnd.x} y2={divEnd.y} stroke={color} strokeWidth="1" opacity={0.4} />
            <text x={labelPos.x} y={labelPos.y + 5} textAnchor="middle"
              fill={color} fontSize="15" fontFamily={FONT} fontWeight="600" opacity={0.95}>
              {sign.symbol}
            </text>
          </g>
        );
      })}

      {/* Synastry aspect lines */}
      {aspects.map((asp, i) => {
        const pA = pt(personA[asp.aIdx].lng, aspectR);
        const pB = pt(personB[asp.bIdx].lng, aspectR);
        const color = ASP_COLOR[asp.type] || '#daa520';
        const dashed = asp.type === 'square' || asp.type === 'opposition';
        return (
          <line key={`asp-${i}`} x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
            stroke={color} strokeWidth="1.5" opacity={0.6}
            strokeDasharray={dashed ? '4,3' : undefined} />
        );
      })}

      {/* Person A planets (outer ring) */}
      {personA.map((p, i) => {
        const color = P_COLOR[p.key] || '#c9d1d9';
        const symbol = P_SYMBOL[p.key] || '?';
        const pos = pt(p.lng, aRing);
        const tick1 = pt(p.lng, separator);
        const tick2 = pt(p.lng, separator + 10);
        return (
          <g key={`pA-${i}`}>
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y}
              stroke={personAColor} strokeWidth="0.8" opacity={0.35} />
            <text x={pos.x} y={pos.y + 6} textAnchor="middle"
              fill={color} fontSize="16" fontWeight="900" fontFamily={FONT}
              stroke={color} strokeWidth="0.5">
              {symbol}
            </text>
          </g>
        );
      })}

      {/* Person B planets (inner ring) */}
      {personB.map((p, i) => {
        const color = P_COLOR[p.key] || '#c9d1d9';
        const symbol = P_SYMBOL[p.key] || '?';
        const pos = pt(p.lng, bRing);
        const tick1 = pt(p.lng, separator);
        const tick2 = pt(p.lng, separator - 10);
        return (
          <g key={`pB-${i}`}>
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y}
              stroke={personBColor} strokeWidth="0.8" opacity={0.35} />
            <text x={pos.x} y={pos.y + 6} textAnchor="middle"
              fill={color} fontSize="16" fontWeight="900" fontFamily={FONT}
              stroke={color} strokeWidth="0.5">
              {symbol}
            </text>
          </g>
        );
      })}

      {/* Person labels */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={personAColor} fontSize="9" fontWeight="700"
        fontFamily={FONT} opacity={0.6} letterSpacing="2">PERSON A</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={personBColor} fontSize="9" fontWeight="700"
        fontFamily={FONT} opacity={0.6} letterSpacing="2">PERSON B</text>
    </svg>
  );
}

/**
 * Annual Profections wheel — 12 houses in a circle with zodiac signs and time lords.
 * Matches the actual BiWheel styling (element colors, Unicode symbols, font).
 */
export function ProfectionsVisual({ className = '' }: { className?: string }) {
  const size = 440;
  const cx = size / 2, cy = size / 2;
  const outerR = 200, innerR = 100, labelR = 155;

  // Sign rulers (time lords) with symbols
  const RULERS = [
    '\u2642\uFE0E', '\u2640\uFE0E', '\u263F\uFE0E', '\u263D\uFE0E',
    '\u2609\uFE0E', '\u263F\uFE0E', '\u2640\uFE0E', '\u2647\uFE0E',
    '\u2643\uFE0E', '\u2644\uFE0E', '\u2645\uFE0E', '\u2646\uFE0E',
  ];
  const RULER_COLORS = [
    P_COLOR.mars, P_COLOR.venus, P_COLOR.mercury, P_COLOR.moon,
    P_COLOR.sun, P_COLOR.mercury, P_COLOR.venus, P_COLOR.pluto,
    P_COLOR.jupiter, P_COLOR.saturn, P_COLOR.uranus, P_COLOR.neptune,
  ];

  // Current profection year highlight (sample: age 27 = house 4/Cancer)
  const currentHouse = 3; // 0-indexed, house 4

  const toRad = (deg: number) => deg * (Math.PI / 180);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} rx="24" fill="#0d1117" />

      {/* Structural rings */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#c9d1d9" strokeWidth="1.5" opacity={0.3} />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#c9d1d9" strokeWidth="1" opacity={0.25} />

      {/* 12 house segments */}
      {ZODIAC.map((sign, i) => {
        const startAngle = -90 + i * 30;
        const endAngle = startAngle + 30;
        const midAngle = startAngle + 15;
        const color = ELEM[sign.element];
        const bg = ELEM_BG[sign.element];
        const isCurrent = i === currentHouse;

        // Segment path
        const s1 = { x: cx + innerR * Math.cos(toRad(startAngle)), y: cy + innerR * Math.sin(toRad(startAngle)) };
        const s2 = { x: cx + outerR * Math.cos(toRad(startAngle)), y: cy + outerR * Math.sin(toRad(startAngle)) };
        const e1 = { x: cx + innerR * Math.cos(toRad(endAngle)), y: cy + innerR * Math.sin(toRad(endAngle)) };
        const e2 = { x: cx + outerR * Math.cos(toRad(endAngle)), y: cy + outerR * Math.sin(toRad(endAngle)) };

        const labelPt = { x: cx + labelR * Math.cos(toRad(midAngle)), y: cy + labelR * Math.sin(toRad(midAngle)) };
        const signPt = { x: cx + (labelR + 22) * Math.cos(toRad(midAngle)), y: cy + (labelR + 22) * Math.sin(toRad(midAngle)) };
        const rulerPt = { x: cx + (labelR - 22) * Math.cos(toRad(midAngle)), y: cy + (labelR - 22) * Math.sin(toRad(midAngle)) };
        const housePt = { x: cx + (innerR - 20) * Math.cos(toRad(midAngle)), y: cy + (innerR - 20) * Math.sin(toRad(midAngle)) };

        return (
          <g key={`prof-${i}`}>
            {/* Segment fill */}
            <path
              d={`M${s1.x},${s1.y} L${s2.x},${s2.y} A${outerR},${outerR} 0 0,1 ${e2.x},${e2.y} L${e1.x},${e1.y} A${innerR},${innerR} 0 0,0 ${s1.x},${s1.y}`}
              fill={isCurrent ? color : bg}
              opacity={isCurrent ? 0.3 : 1}
            />
            {isCurrent && (
              <path
                d={`M${s1.x},${s1.y} L${s2.x},${s2.y} A${outerR},${outerR} 0 0,1 ${e2.x},${e2.y} L${e1.x},${e1.y} A${innerR},${innerR} 0 0,0 ${s1.x},${s1.y}`}
                fill="none" stroke={color} strokeWidth="2.5" opacity={0.8}
              />
            )}
            {/* Divider line */}
            <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke={color} strokeWidth="1" opacity={0.35} />
            {/* Zodiac symbol */}
            <text x={signPt.x} y={signPt.y + 6} textAnchor="middle"
              fill={color} fontSize="16" fontFamily={FONT} fontWeight="600" opacity={isCurrent ? 1 : 0.85}>
              {sign.symbol}
            </text>
            {/* Age label */}
            <text x={labelPt.x} y={labelPt.y + 4} textAnchor="middle"
              fill="#c9d1d9" fontSize="10" fontWeight="600" fontFamily={FONT}
              opacity={isCurrent ? 1 : 0.45}>
              {i === 0 ? '0' : `${i}, ${i + 12}, ${i + 24}`}
            </text>
            {/* Time lord symbol */}
            <text x={rulerPt.x} y={rulerPt.y + 5} textAnchor="middle"
              fill={RULER_COLORS[i]} fontSize="13" fontWeight="900" fontFamily={FONT}
              stroke={RULER_COLORS[i]} strokeWidth="0.3"
              opacity={isCurrent ? 1 : 0.65}>
              {RULERS[i]}
            </text>
            {/* House number */}
            <text x={housePt.x} y={housePt.y + 4} textAnchor="middle"
              fill="#c9d1d9" fontSize="10" fontFamily={FONT} fontWeight="600" opacity={0.3}>
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Center label */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#c9d1d9" fontSize="9" fontWeight="700"
        fontFamily={FONT} opacity={0.4} letterSpacing="2">ANNUAL</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#c9d1d9" fontSize="9" fontWeight="700"
        fontFamily={FONT} opacity={0.4} letterSpacing="2">PROFECTIONS</text>
    </svg>
  );
}

/**
 * Stylized transit timeline
 */
export function TransitTimelineVisual({ className = '' }: { className?: string }) {
  const w = 500, h = 300;

  const transits = [
    { y: 40, label: '\u2609', color: '#FFA500', segments: [[30, 180], [250, 420]] },
    { y: 80, label: '\u263D', color: '#C0C0C0', segments: [[10, 50], [80, 130], [180, 220], [280, 350], [400, 460]] },
    { y: 120, label: '\u2640', color: '#E8D5A3', segments: [[60, 200], [320, 450]] },
    { y: 160, label: '\u2642', color: '#C1440E', segments: [[20, 140], [200, 380]] },
    { y: 200, label: '\u2643', color: '#C88B3A', segments: [[100, 400]] },
    { y: 240, label: '\u2644', color: '#B8A070', segments: [[50, 460]] },
  ];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width={w} height={h} rx="12" fill="#0a0a1a" />

      {/* Month markers */}
      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
        <g key={m}>
          <line x1={30 + i * 38} y1={20} x2={30 + i * 38} y2={h - 15}
            stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <text x={30 + i * 38} y={h - 5} textAnchor="middle"
            fill="rgba(255,255,255,0.2)" fontSize="8">{m}</text>
        </g>
      ))}

      {/* Transit bars */}
      {transits.map((t, ti) => (
        <g key={ti}>
          <text x="8" y={t.y + 28} fill={t.color} fontSize="14" opacity={0.8}>{t.label}</text>
          {/* Base line */}
          <line x1="25" y1={t.y + 24} x2={w - 10} y2={t.y + 24}
            stroke="rgba(255,255,255,0.03)" strokeWidth="8" strokeLinecap="round" />
          {/* Active segments */}
          {t.segments.map(([x1, x2], si) => (
            <line key={si} x1={x1} y1={t.y + 24} x2={x2} y2={t.y + 24}
              stroke={t.color} strokeWidth="6" strokeLinecap="round" opacity={0.35} />
          ))}
        </g>
      ))}

      {/* "Now" indicator */}
      <line x1="160" y1="18" x2="160" y2={h - 18}
        stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" opacity={0.5} />
      <text x="160" y="14" textAnchor="middle"
        fill="#EF4444" fontSize="7" fontWeight="600" opacity={0.6}>NOW</text>
    </svg>
  );
}

/**
 * Stylized astrocartography map
 */
export function AstrocartographyVisual({ className = '' }: { className?: string }) {
  const w = 500, h = 300;

  // Simplified world map outline (very rough)
  const continents = [
    // North America
    'M 60,80 Q 70,70 90,75 L 110,70 Q 130,65 140,80 L 135,100 Q 125,120 110,125 L 90,120 Q 70,110 60,95 Z',
    // South America
    'M 110,145 Q 120,135 130,140 L 135,160 Q 130,190 120,200 L 110,195 Q 105,180 108,160 Z',
    // Europe
    'M 220,65 Q 230,60 245,65 L 250,75 Q 245,85 235,85 L 225,80 Z',
    // Africa
    'M 225,95 Q 240,90 250,100 L 255,130 Q 250,155 240,160 L 230,150 Q 225,125 225,105 Z',
    // Asia
    'M 260,55 Q 290,50 330,55 L 360,65 Q 380,75 370,90 L 340,95 Q 310,90 280,85 L 260,75 Z',
    // Australia
    'M 350,155 Q 370,150 385,155 L 390,170 Q 385,180 370,180 L 355,175 Z',
  ];

  // Planetary lines
  const lines = [
    { x: 100, color: '#FFA500', label: '\u2609', size: 10 },
    { x: 160, color: '#4A90D9', label: '\u2641', size: 9 },   // Earth
    { x: 230, color: '#C0C0C0', label: '\u263D', size: 7 },
    { x: 310, color: '#E8D5A3', label: '\u2640', size: 7 },
    { x: 400, color: '#C1440E', label: '\u2642', size: 7 },
  ];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="mapGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {lines.map((l, i) => (
          <radialGradient key={`mg-${i}`} id={`mapGrad${i}`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="30%" stopColor={l.color} stopOpacity="0.8" />
            <stop offset="75%" stopColor={l.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={l.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      <rect width={w} height={h} rx="12" fill="#0a0a1a" />

      {/* Grid */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`vg-${i}`} x1={40 + i * 38} y1="20" x2={40 + i * 38} y2={h - 20}
          stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={`hg-${i}`} x1="20" y1={40 + i * 44} x2={w - 20} y2={40 + i * 44}
          stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      ))}

      {/* Continents */}
      {continents.map((d, i) => (
        <path key={i} d={d} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      ))}

      {/* Planetary lines */}
      {lines.map((line, i) => {
        const yPos = h / 2 + (i * 18 - 36);
        const s = line.size;
        return (
          <g key={i}>
            <line x1={line.x} y1="15" x2={line.x + (i % 2 === 0 ? 30 : -20)} y2={h - 15}
              stroke={line.color} strokeWidth="2" opacity={0.4} />
            <g filter="url(#mapGlow)">
              <circle cx={line.x} cy={yPos} r={s * 1.8} fill={line.color} opacity={0.08} />
              <circle cx={line.x} cy={yPos} r={s} fill={`url(#mapGrad${i})`} />
              <circle cx={line.x - s * 0.2} cy={yPos - s * 0.2} r={s * 0.25} fill="#fff" opacity={0.3} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Theme Showcase — interactive theme switcher preview
 */
export function ThemeShowcaseVisual({ className = '' }: { className?: string }) {
  const themes = [
    { name: 'Classic', bg: '#ffffff', ring: '#000000', fire: '#ff6600', earth: '#009933', air: '#cc9900', water: '#0099cc', text: '#000' },
    { name: 'Midnight', bg: '#0d1117', ring: '#c9d1d9', fire: '#f97583', earth: '#56d364', air: '#e3b341', water: '#58a6ff', text: '#e6edf3' },
    { name: 'Cosmic', bg: '#13052e', ring: '#d4b8ff', fire: '#ff6eb4', earth: '#50e890', air: '#ffd166', water: '#66d9ff', text: '#f0e6ff' },
    { name: 'Ocean', bg: '#0a192f', ring: '#a8d8ea', fire: '#ff8a65', earth: '#66bb6a', air: '#ffd54f', water: '#4dd0e1', text: '#e3f2fd' },
    { name: 'Sunset', bg: '#2d1b2e', ring: '#f0c8a0', fire: '#ff6b6b', earth: '#88cc66', air: '#ffcc44', water: '#44bbdd', text: '#fce4d6' },
    { name: 'Forest', bg: '#1a2e1a', ring: '#c8e6c9', fire: '#ff8a65', earth: '#aed581', air: '#ffd54f', water: '#4fc3f7', text: '#e8f5e9' },
  ];
  const [active, setActive] = useState(2);
  const t = themes[active];
  const cx = 120, cy = 120, outerR = 105, innerR = 60, midR = 80;

  return (
    <div className={className}>
      <svg viewBox="0 0 240 240" className="w-full max-w-[320px] mx-auto">
        <rect width="240" height="240" rx="16" fill={t.bg} style={{ transition: 'fill 0.4s' }} />
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={t.ring} strokeWidth="1" opacity="0.3" style={{ transition: 'stroke 0.4s' }} />
        <circle cx={cx} cy={cy} r={midR} fill="none" stroke={t.ring} strokeWidth="0.5" opacity="0.2" style={{ transition: 'stroke 0.4s' }} />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={t.ring} strokeWidth="0.5" opacity="0.2" style={{ transition: 'stroke 0.4s' }} />
        {[t.fire, t.earth, t.air, t.water, t.fire, t.earth, t.air, t.water, t.fire, t.earth, t.air, t.water].map((color, i) => {
          const a1 = (i * 30 - 90) * Math.PI / 180;
          const a2 = ((i + 1) * 30 - 90) * Math.PI / 180;
          return (
            <path key={i}
              d={`M${cx + midR * Math.cos(a1)},${cy + midR * Math.sin(a1)} L${cx + outerR * Math.cos(a1)},${cy + outerR * Math.sin(a1)} A${outerR},${outerR} 0 0,1 ${cx + outerR * Math.cos(a2)},${cy + outerR * Math.sin(a2)} L${cx + midR * Math.cos(a2)},${cy + midR * Math.sin(a2)} A${midR},${midR} 0 0,0 ${cx + midR * Math.cos(a1)},${cy + midR * Math.sin(a1)}`}
              fill={color} opacity="0.12" style={{ transition: 'fill 0.4s' }}
            />
          );
        })}
        {[
          { angle: 30, color: t.fire, size: 4 },
          { angle: 120, color: t.water, size: 3.5 },
          { angle: 200, color: t.earth, size: 3 },
          { angle: 310, color: t.air, size: 3.5 },
          { angle: 75, color: t.fire, size: 2.5 },
          { angle: 260, color: t.water, size: 2.5 },
        ].map((p, i) => {
          const rad = (p.angle - 90) * Math.PI / 180;
          return <circle key={i} cx={cx + 90 * Math.cos(rad)} cy={cy + 90 * Math.sin(rad)} r={p.size} fill={p.color} opacity="0.8" style={{ transition: 'fill 0.4s' }} />;
        })}
        {[[30, 200], [120, 310]].map(([a1, a2], i) => {
          const r1 = (a1 - 90) * Math.PI / 180;
          const r2 = (a2 - 90) * Math.PI / 180;
          return <line key={i} x1={cx + innerR * Math.cos(r1)} y1={cy + innerR * Math.sin(r1)} x2={cx + innerR * Math.cos(r2)} y2={cy + innerR * Math.sin(r2)} stroke={[t.fire, t.water][i]} strokeWidth="1" opacity="0.3" style={{ transition: 'stroke 0.4s' }} />;
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {themes.map((theme, i) => (
          <button key={theme.name} onClick={() => setActive(i)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: active === i ? theme.bg : 'transparent',
              color: active === i ? theme.text : 'rgba(255,255,255,0.4)',
              border: `1px solid ${active === i ? theme.ring + '60' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.ring, display: 'inline-block' }} />
            {theme.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Composite Chart Visual
 */
export function CompositeChartVisual({ className = '' }: { className?: string }) {
  const cx = 150, cy = 150, outerR = 135, innerR = 75, midR = 100;
  const personA = '#FF6B6B';
  const personB = '#6B9FFF';
  const composite = '#A78BFA';

  return (
    <svg viewBox="0 0 300 300" className={className}>
      <defs>
        <filter id="comp-glow"><feGaussianBlur stdDeviation="4" /></filter>
        <radialGradient id="comp-bg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#1a0a3e" />
          <stop offset="100%" stopColor="#0a0618" />
        </radialGradient>
      </defs>
      <rect width="300" height="300" rx="16" fill="url(#comp-bg)" />
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#d4b8ff" strokeWidth="1" opacity="0.15" />
      <circle cx={cx} cy={cy} r={midR} fill="none" stroke="#d4b8ff" strokeWidth="0.5" opacity="0.1" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#d4b8ff" strokeWidth="0.5" opacity="0.1" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        return <line key={i} x1={cx + midR * Math.cos(a)} y1={cy + midR * Math.sin(a)} x2={cx + outerR * Math.cos(a)} y2={cy + outerR * Math.sin(a)} stroke="#d4b8ff" strokeWidth="0.5" opacity="0.1" />;
      })}
      {[45, 130, 210, 300, 170].map((angle, i) => {
        const rad = (angle - 90) * Math.PI / 180;
        return <circle key={`a-${i}`} cx={cx + (outerR - 15) * Math.cos(rad)} cy={cy + (outerR - 15) * Math.sin(rad)} r={i === 0 ? 5 : 3.5} fill={personA} opacity="0.6" />;
      })}
      {[80, 165, 245, 335, 20].map((angle, i) => {
        const rad = (angle - 90) * Math.PI / 180;
        return <circle key={`b-${i}`} cx={cx + (outerR - 15) * Math.cos(rad)} cy={cy + (outerR - 15) * Math.sin(rad)} r={i === 0 ? 5 : 3.5} fill={personB} opacity="0.6" />;
      })}
      {[62, 148, 228, 318, 95].map((angle, i) => {
        const rad = (angle - 90) * Math.PI / 180;
        const r = midR - 12;
        return (
          <g key={`c-${i}`}>
            <circle cx={cx + r * Math.cos(rad)} cy={cy + r * Math.sin(rad)} r={6} fill={composite} opacity="0.15" filter="url(#comp-glow)" />
            <circle cx={cx + r * Math.cos(rad)} cy={cy + r * Math.sin(rad)} r={i === 0 ? 5 : 3.5} fill={composite} opacity="0.9" />
          </g>
        );
      })}
      {[[45, 62, 80], [130, 148, 165], [210, 228, 245]].map(([aA, cA, bA], i) => {
        const aR = (aA - 90) * Math.PI / 180;
        const cR = (cA - 90) * Math.PI / 180;
        const bR = (bA - 90) * Math.PI / 180;
        const oR = outerR - 15;
        const mR = midR - 12;
        return (
          <g key={`mp-${i}`} opacity="0.2">
            <line x1={cx + oR * Math.cos(aR)} y1={cy + oR * Math.sin(aR)} x2={cx + mR * Math.cos(cR)} y2={cy + mR * Math.sin(cR)} stroke={personA} strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1={cx + oR * Math.cos(bR)} y1={cy + oR * Math.sin(bR)} x2={cx + mR * Math.cos(cR)} y2={cy + mR * Math.sin(cR)} stroke={personB} strokeWidth="0.8" strokeDasharray="3,3" />
          </g>
        );
      })}
      {[
        { x: 20, label: 'Person A', color: personA },
        { x: 110, label: 'Person B', color: personB },
        { x: 205, label: 'Composite', color: composite },
      ].map(({ x, label, color }) => (
        <g key={label}>
          <circle cx={x} cy={285} r={4} fill={color} opacity="0.8" />
          <text x={x + 8} y={288} fill={color} fontSize="9" fontFamily="system-ui" opacity="0.7">{label}</text>
        </g>
      ))}
    </svg>
  );
}

/**
 * Asteroids Visual — orbit diagram showing asteroid groups
 */
export function AsteroidsVisual({ className = '' }: { className?: string }) {
  const cx = 150, cy = 150;
  const groups = [
    { name: 'Main Belt', color: '#607D8B', r: 65, count: 8 },
    { name: 'Centaurs', color: '#795548', r: 85, count: 3 },
    { name: 'Trans-Neptunian', color: '#1565C0', r: 110, count: 5 },
    { name: 'Near-Earth', color: '#FF5722', r: 45, count: 3 },
    { name: 'Love', color: '#E91E63', r: 55, count: 2 },
  ];

  return (
    <svg viewBox="0 0 300 300" className={className}>
      <defs>
        <filter id="ast-glow"><feGaussianBlur stdDeviation="3" /></filter>
        <radialGradient id="ast-bg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#0f1620" />
          <stop offset="100%" stopColor="#060a10" />
        </radialGradient>
      </defs>
      <rect width="300" height="300" rx="16" fill="url(#ast-bg)" />
      <circle cx={cx} cy={cy} r={10} fill="#FFB830" />
      <circle cx={cx} cy={cy} r={16} fill="#FFB830" opacity="0.1" />
      {[25, 35].map((r, i) => (
        <circle key={`io-${i}`} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      ))}
      {groups.map((g, gi) => (
        <g key={g.name}>
          <circle cx={cx} cy={cy} r={g.r} fill="none" stroke={g.color} strokeWidth="0.8" opacity="0.15" strokeDasharray="4,4" />
          {Array.from({ length: g.count }).map((_, i) => {
            const angle = (gi * 47 + i * (360 / g.count) + 15) * Math.PI / 180;
            const jitter = Math.sin(gi * 7 + i * 3) * 6;
            const r = g.r + jitter;
            const size = 1.5 + Math.sin(gi + i) * 0.8;
            return (
              <g key={`${gi}-${i}`}>
                <circle cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r={size * 2} fill={g.color} opacity="0.08" filter="url(#ast-glow)" />
                <circle cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r={size} fill={g.color} opacity="0.7" />
              </g>
            );
          })}
        </g>
      ))}
      <circle cx={cx} cy={cy} r={130} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      <g transform="translate(15, 260)">
        {groups.map((g, i) => (
          <g key={g.name} transform={`translate(${i * 58}, 0)`}>
            <circle cx={4} cy={4} r={3} fill={g.color} opacity="0.8" />
            <text x={10} y={7} fill={g.color} fontSize="7" fontFamily="system-ui" opacity="0.6">{g.name.split(' ')[0]}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
