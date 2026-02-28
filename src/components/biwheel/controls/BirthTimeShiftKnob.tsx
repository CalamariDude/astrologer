/**
 * BirthTimeShiftKnob — circular jog dial for shifting birth date/time (chart rectification)
 *
 * Uses the exact same interaction and intervals as TransitJogWheel:
 * drag the dot clockwise to advance, counter-clockwise to go back.
 * Tap center to cycle interval: 1h → 1d → 1w → 1mo
 */

import React, { useState, useRef, useCallback } from 'react';
import { COLORS } from '../utils/constants';

interface BirthTimeShiftKnobProps {
  label: string;                         // "A" or "B"
  timeShiftMinutes: number;              // Current offset in minutes (0 = original)
  onTimeShiftChange: (offset: number) => void;
  onReset: () => void;
  loading?: boolean;
  size?: number;                         // Default 88
}

type Interval = '1h' | '1d' | '1w' | '1mo';
const INTERVALS: Interval[] = ['1h', '1d', '1w', '1mo'];
const INTERVAL_MINUTES: Record<Interval, number> = {
  '1h': 60, '1d': 1440, '1w': 10080, '1mo': 43200,
};
const STEP_DEGREES = 360; // full rotation = 1 step

/** Angle (0°=top, clockwise positive) from center of element to pointer. */
function getAngle(cx: number, cy: number, clientX: number, clientY: number): number {
  const dx = clientX - cx;
  const dy = clientY - cy;
  let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
}

/** Signed shortest-path delta from `from` to `to` in degrees (-180..180]. */
function angleDelta(from: number, to: number): number {
  let d = to - from;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Format a time offset in minutes to a compact human-readable string */
function formatOffset(minutes: number): string {
  if (minutes === 0) return '0';
  const sign = minutes > 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  if (abs < 60) return `${sign}${abs}m`;
  if (abs < 1440) {
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return m === 0 ? `${sign}${h}h` : `${sign}${h}h${m}m`;
  }
  if (abs < 10080) {
    const d = Math.floor(abs / 1440);
    const h = Math.floor((abs % 1440) / 60);
    return h === 0 ? `${sign}${d}d` : `${sign}${d}d${h}h`;
  }
  const days = Math.round(abs / 1440);
  if (days < 60) {
    const w = Math.floor(days / 7);
    const d = days % 7;
    return d === 0 ? `${sign}${w}w` : `${sign}${w}w${d}d`;
  }
  if (days < 365) {
    const mo = Math.round(days / 30);
    return `${sign}${mo}mo`;
  }
  const yr = Math.floor(days / 365);
  const remDays = days - yr * 365;
  const remMo = Math.round(remDays / 30);
  if (remMo === 0) return `${sign}${yr}yr`;
  return `${sign}${yr}y${remMo}mo`;
}

export const BirthTimeShiftKnob: React.FC<BirthTimeShiftKnobProps> = ({
  label,
  timeShiftMinutes,
  onTimeShiftChange,
  onReset,
  loading = false,
  size = 88,
}) => {
  const [interval, setInterval_] = useState<Interval>('1d');
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const accumulatedRef = useRef(0);
  const lastAngleRef = useRef(0);
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const intervalRef = useRef(interval);
  intervalRef.current = interval;

  const timeShiftRef = useRef(timeShiftMinutes);
  timeShiftRef.current = timeShiftMinutes;

  /** Advance (or retreat) the offset by `steps` units of the current interval. */
  const advanceTime = useCallback(
    (steps: number) => {
      const mins = INTERVAL_MINUTES[intervalRef.current];
      onTimeShiftChange(timeShiftRef.current + steps * mins);
    },
    [onTimeShiftChange],
  );

  const getCenter = useCallback(() => {
    const el = wheelRef.current;
    if (!el) return { cx: 0, cy: 0 };
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }, []);

  // --- Pointer event handlers (identical to TransitJogWheel) ---

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      draggingRef.current = true;
      didDragRef.current = false;
      setIsDragging(true);
      accumulatedRef.current = 0;
      const { cx, cy } = getCenter();
      lastAngleRef.current = getAngle(cx, cy, e.clientX, e.clientY);
    },
    [getCenter],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      e.stopPropagation();

      const { cx, cy } = getCenter();
      const angle = getAngle(cx, cy, e.clientX, e.clientY);
      const delta = angleDelta(lastAngleRef.current, angle);
      lastAngleRef.current = angle;

      if (Math.abs(delta) > 2) {
        didDragRef.current = true;
      }

      setCurrentAngle(angle);
      accumulatedRef.current += delta;

      const totalSteps = Math.trunc(accumulatedRef.current / STEP_DEGREES);
      if (totalSteps !== 0) {
        accumulatedRef.current -= totalSteps * STEP_DEGREES;
        advanceTime(totalSteps);
      }
    },
    [getCenter, advanceTime],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    draggingRef.current = false;
    setIsDragging(false);
  }, []);

  /** Cycle interval on center tap — only if we didn't just drag. */
  const cycleInterval = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setInterval_((prev) => {
      const idx = INTERVALS.indexOf(prev);
      return INTERVALS[(idx + 1) % INTERVALS.length];
    });
  }, []);

  // --- Theme-aware colors ---
  const bg = COLORS.background;
  const bgAlt = COLORS.backgroundAlt;
  const border = COLORS.gridLineFaint;
  const text = COLORS.textPrimary;
  const textMuted = COLORS.textMuted;
  const accent = COLORS.gridLineLight;

  // --- Derived layout values ---
  const radius = size / 2;
  const rimRadius = radius - 12;
  const dotSize = Math.max(18, size * 0.22);
  const dotX = radius + rimRadius * Math.sin((currentAngle * Math.PI) / 180);
  const dotY = radius - rimRadius * Math.cos((currentAngle * Math.PI) / 180);

  // Tick marks around the rim (12 ticks like a clock)
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const outerR = radius - 3;
    const innerR = radius - (i % 3 === 0 ? 10 : 7);
    return {
      x1: radius + outerR * Math.sin(a),
      y1: radius - outerR * Math.cos(a),
      x2: radius + innerR * Math.sin(a),
      y2: radius - innerR * Math.cos(a),
      major: i % 3 === 0,
    };
  });

  const isShifted = timeShiftMinutes !== 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {/* Label above knob */}
      <span
        style={{
          color: textMuted,
          fontSize: Math.max(10, size * 0.12),
          fontWeight: 600,
          fontFamily: "'Inter', system-ui, sans-serif",
          lineHeight: 1,
          opacity: 0.7,
        }}
      >
        {label}
      </span>

      {/* The knob — identical layout to TransitJogWheel */}
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={cycleInterval}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${bgAlt}, ${bg} 70%)`,
          boxShadow: `inset 0 1px 3px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px ${border}`,
          border: `1.5px solid ${border}`,
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {/* SVG overlay for tick marks + track ring */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {/* Track ring */}
          <circle
            cx={radius}
            cy={radius}
            r={rimRadius}
            fill="none"
            stroke={border}
            strokeWidth={1}
            opacity={0.4}
          />
          {/* Tick marks */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1} y1={t.y1}
              x2={t.x2} y2={t.y2}
              stroke={t.major ? accent : border}
              strokeWidth={t.major ? 1.5 : 0.8}
              opacity={t.major ? 0.6 : 0.3}
            />
          ))}
        </svg>

        {/* Knob dot on rim */}
        <div
          style={{
            position: 'absolute',
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: `radial-gradient(circle at 40% 35%, ${accent}, ${text})`,
            boxShadow: `0 1px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)`,
            border: `1px solid ${border}`,
            left: dotX - dotSize / 2,
            top: dotY - dotSize / 2,
            pointerEvents: 'none',
            transition: isDragging ? 'none' : 'left 0.05s, top 0.05s',
          }}
        />

        {/* Center label — shows interval (same as TransitJogWheel) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              color: textMuted,
              fontSize: Math.max(13, size * 0.18),
              fontWeight: 600,
              fontFamily: "'Inter', system-ui, sans-serif",
              lineHeight: 1,
              letterSpacing: '0.02em',
            }}
          >
            {interval}
          </span>
        </div>

        {/* Loading pulse dot */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: size * 0.15,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#22c55e',
              animation: 'birthTimeShiftPulse 1s ease-in-out infinite',
            }}
          />
        )}

        <style>{`
          @keyframes birthTimeShiftPulse {
            0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.4; transform: translateX(-50%) scale(0.7); }
          }
        `}</style>
      </div>

      {/* Offset display + reset button below knob */}
      {isShifted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              color: textMuted,
              fontSize: Math.max(9, size * 0.11),
              fontWeight: 600,
              fontFamily: "'Inter', system-ui, sans-serif",
              lineHeight: 1,
              opacity: 0.8,
            }}
          >
            {formatOffset(timeShiftMinutes)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            style={{
              background: 'none',
              border: `1px solid ${border}`,
              color: textMuted,
              fontSize: Math.max(8, size * 0.1),
              cursor: 'pointer',
              padding: '1px 5px',
              borderRadius: 4,
              opacity: 0.7,
              fontFamily: "'Inter', system-ui, sans-serif",
              lineHeight: 1.2,
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7'; }}
            title={`Reset ${label} birth time to original`}
          >
            reset
          </button>
        </div>
      )}
    </div>
  );
};

export default BirthTimeShiftKnob;
