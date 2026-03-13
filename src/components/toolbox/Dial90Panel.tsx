/**
 * 90° Dial (Cosmobiology)
 * Interactive dial showing planets reduced to 90° modulus with midpoint display
 * Draggable pointer to explore midpoint structures
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { ToolGuide } from './ToolGuide';

interface Props {
  natalChart: { planets: Record<string, { longitude: number; sign: string; retrograde?: boolean }> };
  name?: string;
}

const PLANET_ORDER = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','NorthNode','Chiron'];
const PLANET_SYMBOLS: Record<string, string> = {
  Sun:'\u2609\uFE0E', Moon:'\u263D\uFE0E', Mercury:'\u263F\uFE0E', Venus:'\u2640\uFE0E', Mars:'\u2642\uFE0E', Jupiter:'\u2643\uFE0E', Saturn:'\u2644\uFE0E',
  Uranus:'\u26E2\uFE0E', Neptune:'\u2646\uFE0E', Pluto:'\u2647\uFE0E', NorthNode:'\u260A\uFE0E', Chiron:'\u26B7\uFE0E',
};
const PLANET_COLORS: Record<string, string> = {
  Sun:'#FFD700', Moon:'#C0C0C0', Mercury:'#00CED1', Venus:'#FF69B4', Mars:'#FF4500',
  Jupiter:'#9370DB', Saturn:'#8B4513', Uranus:'#00FFFF', Neptune:'#0000FF', Pluto:'#800080',
  NorthNode:'#E6E6FA', Chiron:'#50C878',
};

function mod90(lng: number): number {
  return ((lng % 90) + 90) % 90;
}

function mod360(lng: number): number {
  return ((lng % 360) + 360) % 360;
}

/** Nearer midpoint of two longitudes */
function midpoint(a: number, b: number): number {
  const diff = mod360(b - a);
  if (diff <= 180) return mod360(a + diff / 2);
  return mod360(a + (diff - 360) / 2);
}

/** Angular distance in 90° space */
function dist90(a: number, b: number): number {
  const d = Math.abs(mod90(a) - mod90(b));
  return Math.min(d, 90 - d);
}

const SIZE = 500;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 220;
const INNER_R = 160;
const PLANET_R = 190;
const TICK_OUTER = OUTER_R;
const TICK_INNER = OUTER_R - 8;

function degToAngle(deg: number): number {
  // 0° at top, clockwise
  return (deg / 90) * 360 - 90;
}

function polarToXY(angleDeg: number, r: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

export function Dial90Panel({ natalChart, name }: Props) {
  const [pointerDeg, setPointerDeg] = useState<number | null>(null);
  const [orb, setOrb] = useState(1.5);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Prepare planets with 90° positions
  const planets = useMemo(() => {
    const result: { key: string; longitude: number; pos90: number; symbol: string; color: string }[] = [];
    for (const key of PLANET_ORDER) {
      const p = natalChart.planets[key] || natalChart.planets[key.toLowerCase()];
      if (!p) continue;
      result.push({
        key,
        longitude: p.longitude,
        pos90: mod90(p.longitude),
        symbol: PLANET_SYMBOLS[key] || key[0],
        color: PLANET_COLORS[key] || '#888',
      });
    }
    return result;
  }, [natalChart]);

  // Calculate all midpoints
  const midpoints = useMemo(() => {
    const mps: { a: string; b: string; longitude: number; pos90: number }[] = [];
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const mp = midpoint(planets[i].longitude, planets[j].longitude);
        mps.push({
          a: planets[i].key,
          b: planets[j].key,
          longitude: mp,
          pos90: mod90(mp),
        });
      }
    }
    return mps;
  }, [planets]);

  // Find contacts at pointer position
  const pointerContacts = useMemo(() => {
    if (pointerDeg === null) return { planets: [], midpoints: [] };
    const pHits = planets.filter(p => dist90(p.longitude, pointerDeg * 90 / 90) <= orb);
    // Map pointer from dial position (0-90) back to longitude space
    const pointerLng = pointerDeg; // already in 90° space
    const mpHits = midpoints.filter(mp => {
      const d = Math.abs(mp.pos90 - pointerLng);
      return Math.min(d, 90 - d) <= orb;
    });
    const plHits = planets.filter(p => {
      const d = Math.abs(p.pos90 - pointerLng);
      return Math.min(d, 90 - d) <= orb;
    });
    return { planets: plHits, midpoints: mpHits };
  }, [pointerDeg, planets, midpoints, orb]);

  // Midpoints on planets (contacts within orb)
  const planetMidpointContacts = useMemo(() => {
    const contacts: { planet: string; midpointPair: string; orb: number }[] = [];
    for (const p of planets) {
      for (const mp of midpoints) {
        if (mp.a === p.key || mp.b === p.key) continue;
        const d = dist90(p.longitude, mp.longitude);
        if (d <= orb) {
          contacts.push({
            planet: p.key,
            midpointPair: `${mp.a}/${mp.b}`,
            orb: d,
          });
        }
      }
    }
    return contacts.sort((a, b) => a.orb - b.orb);
  }, [planets, midpoints, orb]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * SIZE - CX;
    const y = (e.clientY - rect.top) / rect.height * SIZE - CY;
    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    setPointerDeg((angle / 360) * 90);
  }, [dragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    setDragging(true);
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * SIZE - CX;
    const y = (e.clientY - rect.top) / rect.height * SIZE - CY;
    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    setPointerDeg((angle / 360) * 90);
  }, []);

  const getTouchCoords = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const touch = e.touches[0];
    if (!touch) return null;
    const rect = svg.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width * SIZE - CX;
    const y = (touch.clientY - rect.top) / rect.height * SIZE - CY;
    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    return (angle / 360) * 90;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    setDragging(true);
    const deg = getTouchCoords(e);
    if (deg !== null) setPointerDeg(deg);
  }, [getTouchCoords]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!dragging) return;
    const deg = getTouchCoords(e);
    if (deg !== null) setPointerDeg(deg);
  }, [dragging, getTouchCoords]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">90° Dial</h3>
          <p className="text-xs text-muted-foreground">{name ? `${name} — ` : ''}Cosmobiology / Ebertin</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="text-muted-foreground">Orb:</label>
          <select
            value={orb}
            onChange={(e) => setOrb(Number(e.target.value))}
            className="text-xs bg-muted/30 border border-border rounded px-1.5 py-0.5"
          >
            <option value={0.5}>0.5°</option>
            <option value={1}>1°</option>
            <option value={1.5}>1.5°</option>
            <option value={2}>2°</option>
          </select>
        </div>
      </div>

      <ToolGuide
        title="90° Dial"
        description="A cosmobiology tool that compresses the 360° zodiac into a 90° dial, making hard aspects (conjunctions, squares, oppositions) visually obvious. Planets that appear close together on the dial are in hard aspect. Drag the pointer to explore midpoint structures."
        tips={[
          "Planets clustered together on the 90° dial are in conjunction, square, or opposition to each other",
          "Drag the red pointer around the dial to find midpoint activations — when the pointer hits a planet, it shows all midpoints at that degree",
          "Hard aspects (0°/90°/180°) are the action aspects — they produce events and drive change",
          "The midpoint list updates in real-time as you move the pointer",
          "Touch and drag works on mobile — use it to explore interactively",
        ]}
      />

      {/* Dial SVG */}
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width="100%"
          style={{ maxWidth: 420, cursor: 'crosshair' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background */}
          <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.2} />
          <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.1} />

          {/* Degree ticks */}
          {Array.from({ length: 90 }, (_, i) => {
            const angle = degToAngle(i);
            const isMajor = i % 10 === 0;
            const isMid = i % 5 === 0;
            const from = polarToXY(angle, isMajor ? TICK_INNER - 4 : TICK_INNER);
            const to = polarToXY(angle, TICK_OUTER);
            return (
              <g key={`tick-${i}`}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="currentColor"
                  strokeWidth={isMajor ? 1 : 0.5}
                  opacity={isMajor ? 0.4 : isMid ? 0.25 : 0.1}
                />
                {isMajor && (
                  <text
                    {...polarToXY(angle, TICK_INNER - 14)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={10}
                    fill="currentColor"
                    opacity={0.4}
                  >
                    {i}°
                  </text>
                )}
              </g>
            );
          })}

          {/* Cardinal markers (0°, 15°, 45°, 60° in the 90° dial = cardinal/fixed/mutable) */}
          {[0, 30, 60].map(d => {
            const angle = degToAngle(d);
            const p = polarToXY(angle, OUTER_R + 10);
            return (
              <text key={`card-${d}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="currentColor" opacity={0.3}>
                {d === 0 ? 'Cardinal' : d === 30 ? 'Fixed' : 'Mutable'}
              </text>
            );
          })}

          {/* Planet markers */}
          {planets.map(p => {
            const angle = degToAngle(p.pos90);
            const pos = polarToXY(angle, PLANET_R);
            const isHighlighted = pointerDeg !== null && dist90(p.longitude, pointerDeg) <= orb;
            return (
              <g key={p.key}>
                {/* Tick line to outer ring */}
                <line
                  x1={polarToXY(angle, INNER_R).x}
                  y1={polarToXY(angle, INNER_R).y}
                  x2={polarToXY(angle, OUTER_R).x}
                  y2={polarToXY(angle, OUTER_R).y}
                  stroke={p.color}
                  strokeWidth={isHighlighted ? 2 : 1}
                  opacity={isHighlighted ? 0.9 : 0.5}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isHighlighted ? 18 : 15}
                  fill={p.color}
                  style={{ fontFamily: "'Segoe UI Symbol', 'DejaVu Sans', Arial, sans-serif", transition: 'font-size 0.15s' }}
                >
                  {p.symbol}
                </text>
              </g>
            );
          })}

          {/* Pointer line */}
          {pointerDeg !== null && (() => {
            const angle = degToAngle(pointerDeg);
            const from = polarToXY(angle, 0);
            const to = polarToXY(angle, OUTER_R + 5);
            return (
              <line
                x1={CX} y1={CY} x2={to.x} y2={to.y}
                stroke="#ef4444"
                strokeWidth={1.5}
                opacity={0.7}
                strokeDasharray="4 2"
              />
            );
          })()}

          {/* Center dot */}
          <circle cx={CX} cy={CY} r={3} fill="currentColor" opacity={0.2} />
        </svg>
      </div>

      {/* Pointer position readout */}
      {pointerDeg !== null && (
        <div className="text-xs text-center text-muted-foreground">
          Pointer: {pointerDeg.toFixed(1)}° — Click and drag to explore
        </div>
      )}

      {/* Pointer contacts */}
      {pointerDeg !== null && (pointerContacts.planets.length > 0 || pointerContacts.midpoints.length > 0) && (
        <div className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-2">
          <h4 className="text-xs font-medium text-red-400">At pointer ({pointerDeg.toFixed(1)}°)</h4>
          {pointerContacts.planets.length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Planets: </span>
              {pointerContacts.planets.map(p => (
                <span key={p.key} className="mr-2" style={{ color: p.color }}>{p.symbol} {p.key}</span>
              ))}
            </div>
          )}
          {pointerContacts.midpoints.length > 0 && (
            <div className="text-xs space-y-0.5">
              <span className="text-muted-foreground">Midpoints:</span>
              {pointerContacts.midpoints.slice(0, 10).map((mp, i) => (
                <div key={i} className="ml-2 text-muted-foreground">
                  {PLANET_SYMBOLS[mp.a]}/{PLANET_SYMBOLS[mp.b]} = {mp.pos90.toFixed(1)}°
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Planet = Midpoint contacts list */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-2">
        <h4 className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">Midpoint Contacts (planet = midpoint)</h4>
        {planetMidpointContacts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No contacts within {orb}° orb</p>
        ) : (
          <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
            {planetMidpointContacts.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                <span style={{ color: PLANET_COLORS[c.planet] }} className="font-medium">
                  {PLANET_SYMBOLS[c.planet]} {c.planet}
                </span>
                <span className="text-muted-foreground">=</span>
                <span>{c.midpointPair}</span>
                <span className="text-muted-foreground/70 ml-auto tabular-nums">{c.orb.toFixed(2)}°</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        Drag the red pointer around the dial to explore midpoint structures. All positions are shown modulo 90° (hard aspects: conjunction, square, opposition, semi-square, sesquiquadrate).
      </p>
    </div>
  );
}
