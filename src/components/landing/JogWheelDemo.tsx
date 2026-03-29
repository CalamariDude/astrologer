/**
 * JogWheelDemo — interactive transit jog wheel embedded inside a mini zodiac chart.
 * The jog wheel sits at the chart center; planets orbit on an inner ring with aspect lines.
 * Fully client-side: hardcoded base positions + deterministic daily motion rates.
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import { TransitJogWheel } from '@/components/biwheel/controls/TransitJogWheel';
import { longitudeToXY, createSegmentPath } from '@/components/biwheel/utils/chartMath';
import { ZODIAC_SIGNS, PLANETS } from '@/components/biwheel/utils/constants';

// ─── Deterministic planet motion ────────────────────────────────────────

const BASE_DATE = '2026-02-26';

const BASE_POSITIONS: Record<string, number> = {
  sun: 337.5,
  moon: 142.0,
  mercury: 320.0,
  venus: 10.5,
  mars: 103.0,
  jupiter: 73.0,
};

const PLANET_SPEEDS: Record<string, number> = {
  sun: 0.9856,
  moon: 13.176,
  mercury: 1.38,
  venus: 1.20,
  mars: 0.524,
  jupiter: 0.083,
};

const DEMO_PLANETS = Object.keys(BASE_POSITIONS) as Array<keyof typeof PLANETS>;

function daysBetween(a: string, b: string): number {
  return (new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86_400_000;
}

function normalize(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function computePositions(date: string): Record<string, number> {
  const diff = daysBetween(BASE_DATE, date);
  const out: Record<string, number> = {};
  for (const p of DEMO_PLANETS) out[p] = normalize(BASE_POSITIONS[p] + PLANET_SPEEDS[p] * diff);
  return out;
}

// ─── Aspect detection ───────────────────────────────────────────────────

const ASPECT_DEFS = [
  { angle: 60, orb: 6, color: '#1e5aa8' },   // sextile
  { angle: 90, orb: 7, color: '#c41e3a' },   // square
  { angle: 120, orb: 7, color: '#00bcd4' },  // trine
  { angle: 180, orb: 8, color: '#c41e3a' },  // opposition
];

interface Aspect { from: string; to: string; color: string }

function findAspects(positions: Record<string, number>): Aspect[] {
  const result: Aspect[] = [];
  const keys = Object.keys(positions);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      let diff = Math.abs(positions[keys[i]] - positions[keys[j]]);
      if (diff > 180) diff = 360 - diff;
      for (const asp of ASPECT_DEFS) {
        if (Math.abs(diff - asp.angle) <= asp.orb) {
          result.push({ from: keys[i], to: keys[j], color: asp.color });
          break;
        }
      }
    }
  }
  return result;
}

// ─── Chart dimensions ───────────────────────────────────────────────────

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = CX - 6;
const ZODIAC_W = 20;
const INNER_R = OUTER_R - ZODIAC_W;
const PLANET_R = INNER_R - 18;
const JOG_SIZE = 68;
const JOG_BG_R = JOG_SIZE / 2 + 8;

// ─── Subtle element tints ───────────────────────────────────────────────

const EL: Record<string, { fill: string; sym: string }> = {
  fire:  { fill: 'rgba(220, 80, 10, 0.06)',  sym: 'rgba(200, 80, 10, 0.45)' },
  earth: { fill: 'rgba(40, 130, 50, 0.05)',   sym: 'rgba(40, 120, 50, 0.40)' },
  air:   { fill: 'rgba(180, 140, 20, 0.05)',  sym: 'rgba(160, 120, 10, 0.40)' },
  water: { fill: 'rgba(20, 120, 180, 0.06)',  sym: 'rgba(20, 110, 170, 0.45)' },
};

// ─── SVG Chart ──────────────────────────────────────────────────────────

const MiniChart = memo(function MiniChart({ positions, aspects }: { positions: Record<string, number>; aspects: Aspect[] }) {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ display: 'block' }}
    >
      {/* Definitions */}
      <defs>
        <radialGradient id="jd-center-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.01)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="jd-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.08)" />
        </filter>
      </defs>

      {/* Inner area background */}
      <circle cx={CX} cy={CY} r={INNER_R} fill="url(#jd-center-glow)" />

      {/* Zodiac ring segments */}
      {ZODIAC_SIGNS.map((sign, i) => (
        <path
          key={sign.name}
          d={createSegmentPath(CX, CY, INNER_R, OUTER_R, i * 30, (i + 1) * 30)}
          fill={EL[sign.element].fill}
          stroke="none"
        />
      ))}

      {/* Ring borders */}
      <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={0.8} />
      <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={0.5} />

      {/* 5° tick marks + 30° sign boundaries */}
      {Array.from({ length: 72 }, (_, i) => {
        const angle = i * 5;
        const isMajor = angle % 30 === 0;
        const tickLen = isMajor ? ZODIAC_W : 3;
        const p1 = longitudeToXY(angle, CX, CY, OUTER_R);
        const p2 = longitudeToXY(angle, CX, CY, OUTER_R - tickLen);
        return (
          <line
            key={`t${i}`}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={isMajor ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.04)'}
            strokeWidth={isMajor ? 0.7 : 0.3}
          />
        );
      })}

      {/* Zodiac sign symbols */}
      {ZODIAC_SIGNS.map((sign, i) => {
        const pos = longitudeToXY(i * 30 + 15, CX, CY, (OUTER_R + INNER_R) / 2);
        return (
          <text
            key={sign.short}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={EL[sign.element].sym}
            fontSize={10}
            fontFamily="'Times New Roman', serif"
            style={{ pointerEvents: 'none' }}
          >
            {sign.symbol}
          </text>
        );
      })}

      {/* Aspect lines (behind planet markers) */}
      {aspects.map((asp, idx) => {
        const p1 = longitudeToXY(positions[asp.from], CX, CY, PLANET_R);
        const p2 = longitudeToXY(positions[asp.to], CX, CY, PLANET_R);
        return (
          <line
            key={`a${idx}`}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={asp.color}
            strokeWidth={0.7}
            opacity={0.35}
          />
        );
      })}

      {/* White disc behind jog wheel to mask aspect lines */}
      <circle cx={CX} cy={CY} r={JOG_BG_R} fill="white" />
      <circle cx={CX} cy={CY} r={JOG_BG_R} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={0.5} />

      {/* Planet markers — glyph inside a subtle disc */}
      {DEMO_PLANETS.map((key) => {
        const lng = positions[key];
        const planet = PLANETS[key];
        const pos = longitudeToXY(lng, CX, CY, PLANET_R);
        return (
          <g
            key={key}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Background disc */}
            <circle
              cx={0}
              cy={0}
              r={12}
              fill="white"
              stroke={planet.color}
              strokeWidth={0.6}
              opacity={0.9}
              filter="url(#jd-shadow)"
            />
            {/* Symbol */}
            <text
              x={0}
              y={0}
              dy={1}
              textAnchor="middle"
              dominantBaseline="central"
              fill={planet.color}
              fontSize={12}
              fontWeight={500}
              fontFamily="'Times New Roman', serif"
              style={{ pointerEvents: 'none' }}
            >
              {planet.symbol}
            </text>
          </g>
        );
      })}
    </svg>
  );
});

// ─── Date formatting ────────────────────────────────────────────────────

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Main Component ─────────────────────────────────────────────────────

export function JogWheelDemo() {
  const [date, setDate] = useState(BASE_DATE);
  const [time, setTime] = useState('12:00');

  const positions = useMemo(() => computePositions(date), [date]);
  const aspects = useMemo(() => findAspects(positions), [positions]);

  const handleDateChange = useCallback((d: string) => setDate(d), []);
  const handleTimeChange = useCallback((t: string) => setTime(t), []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Background glow */}
      <div className="absolute -inset-12 bg-gradient-to-br from-teal-500/[0.06] to-cyan-500/[0.03] rounded-[3rem] blur-3xl pointer-events-none" />

      {/* "Try me" pill */}
      <div
        className="relative flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase"
        style={{
          background: 'rgba(20, 184, 166, 0.08)',
          color: '#0d9488',
          animation: 'jogDemoPulse 2.5s ease-in-out infinite',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
        Try me
      </div>

      {/* Chart + Jog Wheel composite */}
      <div
        className="relative"
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: '50%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* SVG chart layer */}
        <MiniChart positions={positions} aspects={aspects} />

        {/* Jog wheel in center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        >
          <TransitJogWheel
            transitDate={date}
            onTransitDateChange={handleDateChange}
            transitTime={time}
            onTransitTimeChange={handleTimeChange}
            size={JOG_SIZE}
          />
        </div>
      </div>

      {/* Date label */}
      <span
        className="relative mt-3 text-sm font-medium tabular-nums"
        style={{ color: '#888', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.03em' }}
      >
        {formatDisplayDate(date)}
      </span>

      <style>{`
        @keyframes jogDemoPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default JogWheelDemo;
