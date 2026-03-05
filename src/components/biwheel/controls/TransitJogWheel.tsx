/**
 * TransitJogWheel — circular jog dial for scrubbing transit dates
 *
 * Drag the dot clockwise to advance time, counter-clockwise to go back.
 * Tap center label to cycle interval: 1mi → 1h → 1d → 1w → 1mo
 * Adapts to the current chart theme via COLORS.
 */

import React, { useState, useRef, useCallback } from 'react';
import { COLORS } from '../utils/constants';
import { TimeInput } from '@/components/ui/TimeInput';

interface TransitJogWheelProps {
  transitDate: string;                        // YYYY-MM-DD
  onTransitDateChange: (date: string) => void;
  transitTime: string;                        // HH:MM
  onTransitTimeChange: (time: string) => void;
  transitLoading?: boolean;
  size?: number;                              // diameter in px (default 96)
}

type Interval = '1mi' | '10mi' | '1h' | '1d' | '1w' | '1mo' | '1y';
const INTERVALS: Interval[] = ['1mi', '10mi', '1h', '1d', '1w', '1mo', '1y'];
const STEP_DEGREES = 30; // 12 steps per full rotation

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

/** Format a Date as YYYY-MM-DD */
function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format hours/minutes as HH:MM */
function fmtTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const TransitJogWheel: React.FC<TransitJogWheelProps> = ({
  transitDate,
  onTransitDateChange,
  transitTime,
  onTransitTimeChange,
  transitLoading = false,
  size = 96,
}) => {
  const [interval, setInterval_] = useState<Interval>('1d');
  const [isDragging, setIsDragging] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const accumulatedRef = useRef(0);
  const lastAngleRef = useRef(0);
  const currentAngleRef = useRef(0);
  const draggingRef = useRef(false);
  const didDragRef = useRef(false); // true if pointer moved significantly during this gesture
  const wheelRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const dateRef = useRef(transitDate);
  const timeRef = useRef(transitTime);
  dateRef.current = transitDate;
  timeRef.current = transitTime;

  const intervalRef = useRef(interval);
  intervalRef.current = interval;

  /** Advance (or retreat) the transit date/time by `steps` units of the current interval. */
  const advanceDate = useCallback(
    (steps: number) => {
      const iv = intervalRef.current;
      const curDate = dateRef.current;
      const curTime = timeRef.current;

      if (iv === '1mi' || iv === '10mi' || iv === '1h') {
        const [hh, mm] = curTime.split(':').map(Number);
        const minuteStep = iv === '1mi' ? 1 : iv === '10mi' ? 10 : 60;
        let totalMinutes = hh * 60 + mm + steps * minuteStep;
        const d = new Date(curDate + 'T12:00:00');
        const dayShift = Math.floor(totalMinutes / 1440);
        totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;
        if (dayShift !== 0) {
          d.setDate(d.getDate() + dayShift);
          onTransitDateChange(fmtDate(d));
        }
        const newH = Math.floor(totalMinutes / 60);
        const newM = totalMinutes % 60;
        onTransitTimeChange(fmtTime(newH, newM));
      } else {
        const d = new Date(curDate + 'T12:00:00');
        if (iv === '1d') {
          d.setDate(d.getDate() + steps);
        } else if (iv === '1w') {
          d.setDate(d.getDate() + steps * 7);
        } else if (iv === '1mo') {
          const origDay = d.getDate();
          d.setMonth(d.getMonth() + steps);
          if (d.getDate() !== origDay) {
            d.setDate(0);
          }
        } else if (iv === '1y') {
          d.setFullYear(d.getFullYear() + steps);
        }
        onTransitDateChange(fmtDate(d));
      }
    },
    [onTransitDateChange, onTransitTimeChange],
  );

  const getCenter = useCallback(() => {
    const el = wheelRef.current;
    if (!el) return { cx: 0, cy: 0 };
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }, []);

  // --- Pointer event handlers ---

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

  /** Update the dot position directly via DOM (no React re-render). */
  const updateDotPosition = useCallback((angle: number) => {
    currentAngleRef.current = angle;
    const dot = dotRef.current;
    if (!dot) return;
    const r = size / 2;
    const rim = r - 12;
    const ds = Math.max(18, size * 0.22);
    const x = r + rim * Math.sin((angle * Math.PI) / 180) - ds / 2;
    const y = r - rim * Math.cos((angle * Math.PI) / 180) - ds / 2;
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
  }, [size]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      e.stopPropagation();

      const { cx, cy } = getCenter();
      const angle = getAngle(cx, cy, e.clientX, e.clientY);
      const delta = angleDelta(lastAngleRef.current, angle);
      lastAngleRef.current = angle;

      // Mark as a real drag if moved more than a tiny amount
      if (Math.abs(delta) > 2) {
        didDragRef.current = true;
      }

      updateDotPosition(angle);
      accumulatedRef.current += delta;

      const totalSteps = Math.trunc(accumulatedRef.current / STEP_DEGREES);
      if (totalSteps !== 0) {
        accumulatedRef.current -= totalSteps * STEP_DEGREES;
        advanceDate(totalSteps);
      }
    },
    [getCenter, advanceDate, updateDotPosition],
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
      return; // suppress — this click came from a drag release
    }
    setInterval_((prev) => {
      const idx = INTERVALS.indexOf(prev);
      return INTERVALS[(idx + 1) % INTERVALS.length];
    });
  }, []);

  // --- Theme-aware colors ---
  const bg = COLORS.background;
  const bgAlt = COLORS.backgroundAlt;
  const bgAlt2 = COLORS.backgroundAlt2;
  const border = COLORS.gridLineFaint;
  const text = COLORS.textPrimary;
  const textMuted = COLORS.textMuted;
  const accent = COLORS.gridLineLight;

  // --- Derived layout values ---
  const radius = size / 2;
  const rimRadius = radius - 12;
  const dotSize = Math.max(18, size * 0.22);

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
        Transit
      </span>
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
        ref={dotRef}
        style={{
          position: 'absolute',
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${accent}, ${text})`,
          boxShadow: `0 1px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)`,
          border: `1px solid ${border}`,
          left: radius + rimRadius * Math.sin((currentAngleRef.current * Math.PI) / 180) - dotSize / 2,
          top: radius - rimRadius * Math.cos((currentAngleRef.current * Math.PI) / 180) - dotSize / 2,
          pointerEvents: 'none',
          transition: isDragging ? 'none' : 'left 0.05s, top 0.05s',
        }}
      />

      {/* Center label */}
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
      {transitLoading && (
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
            animation: 'transitJogPulse 1s ease-in-out infinite',
          }}
        />
      )}

      <style>{`
        @keyframes transitJogPulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.4; transform: translateX(-50%) scale(0.7); }
        }
      `}</style>
    </div>

      {/* Compact date/time label — tap to expand */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowDatePicker(p => !p); }}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px 0',
          cursor: 'pointer',
          color: textMuted,
          fontSize: Math.max(9, size * 0.1),
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 500,
          opacity: 0.65,
          lineHeight: 1,
        }}
      >
        {transitDate} · {transitTime || '12:00'}
      </button>

      {/* Expanded date/time picker */}
      {showDatePicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            width: Math.max(size, 130),
          }}
        >
          <input
            type="date"
            value={transitDate}
            onChange={(e) => {
              const v = e.target.value;
              const year = v.split('-')[0];
              if (year && year.length >= 4) onTransitDateChange(v);
            }}
            style={{
              width: '100%',
              padding: '3px 5px',
              fontSize: 11,
              border: `1px solid ${border}`,
              borderRadius: 5,
              background: bgAlt2,
              color: text,
              colorScheme: bg.charAt(1) < '8' ? 'dark' : 'light',
            }}
          />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <TimeInput
              value={transitTime}
              onChange={(v) => onTransitTimeChange(v)}
              unstyled
              style={{
                flex: 1,
                padding: '3px 5px',
                fontSize: 11,
                border: `1px solid ${border}`,
                borderRadius: 5,
                background: bgAlt2,
                color: text,
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                const n = new Date();
                onTransitDateChange(fmtDate(n));
                onTransitTimeChange(fmtTime(n.getHours(), n.getMinutes()));
              }}
              style={{
                padding: '3px 6px',
                fontSize: 10,
                fontWeight: 600,
                border: `1px solid ${border}`,
                borderRadius: 5,
                background: bgAlt2,
                color: textMuted,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransitJogWheel;
