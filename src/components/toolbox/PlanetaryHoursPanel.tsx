/**
 * Planetary Hours Panel
 * Calculates and displays the 24 planetary hours (12 day + 12 night)
 * based on sunrise/sunset for a given date and location.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ToolGuide } from './ToolGuide';

interface Props {
  birthDate?: string;
  lat?: number;
  lng?: number;
}

/* ── Planet definitions in Chaldean order ── */
const CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'] as const;
type PlanetName = (typeof CHALDEAN_ORDER)[number];

const PLANET_SYMBOLS: Record<PlanetName, string> = {
  Saturn: '\u2644\uFE0E',
  Jupiter: '\u2643\uFE0E',
  Mars: '\u2642\uFE0E',
  Sun: '\u2609\uFE0E',
  Venus: '\u2640\uFE0E',
  Mercury: '\u263F\uFE0E',
  Moon: '\u263D\uFE0E',
};

const PLANET_COLORS: Record<PlanetName, string> = {
  Sun: '#FFD700',
  Moon: '#C0C0C0',
  Mars: '#FF4500',
  Mercury: '#00CED1',
  Jupiter: '#9370DB',
  Venus: '#FF69B4',
  Saturn: '#8B4513',
};

/* Day-of-week rulers: Sun=0 .. Sat=6 */
const DAY_RULERS: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/* ── Solar calculations ── */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function toRad(deg: number) { return deg * Math.PI / 180; }
function toDeg(rad: number) { return rad * 180 / Math.PI; }

/**
 * Returns sunrise and sunset as Date objects in local time.
 * Uses simplified astronomical formula with equation-of-time correction.
 */
function calcSunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } {
  const doy = dayOfYear(date);

  // Solar declination
  const declRad = toRad(23.45 * Math.sin(toRad((360 / 365) * (284 + doy))));

  // Hour angle
  const latRad = toRad(lat);
  let cosOmega = -Math.tan(latRad) * Math.tan(declRad);
  // Clamp for polar regions
  cosOmega = Math.max(-1, Math.min(1, cosOmega));
  const omega = toDeg(Math.acos(cosOmega));

  // Equation of time (Spencer, 1971 approximation) in minutes
  const B = toRad((360 / 365) * (doy - 81));
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // Time zone offset in hours (positive = east of UTC)
  const tzOffsetHours = -date.getTimezoneOffset() / 60;

  // Longitude correction: 4 minutes per degree difference from standard meridian
  const lngCorrection = (lng - tzOffsetHours * 15) * 4; // in minutes

  // Solar noon in local clock time (hours)
  const solarNoon = 12 - (lngCorrection + eot) / 60;

  const sunriseHour = solarNoon - omega / 15;
  const sunsetHour = solarNoon + omega / 15;

  const toDate = (hours: number): Date => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.floor(((hours - h) * 60 - m) * 60);
    const d = new Date(date);
    d.setHours(h, m, s, 0);
    return d;
  };

  return { sunrise: toDate(sunriseHour), sunset: toDate(sunsetHour) };
}

interface HourEntry {
  index: number;        // 0-23
  label: string;        // "Day 1", "Night 5", etc.
  start: Date;
  end: Date;
  planet: PlanetName;
  isDay: boolean;
}

function buildPlanetaryHours(date: Date, lat: number, lng: number): {
  hours: HourEntry[];
  dayRuler: PlanetName;
  sunrise: Date;
  sunset: Date;
} {
  const { sunrise, sunset } = calcSunTimes(date, lat, lng);

  // Next day sunrise for nighttime calculation
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const { sunrise: nextSunrise } = calcSunTimes(nextDay, lat, lng);

  const dayMs = sunset.getTime() - sunrise.getTime();
  const nightMs = nextSunrise.getTime() - sunset.getTime();
  const dayHourMs = dayMs / 12;
  const nightHourMs = nightMs / 12;

  const dow = date.getDay(); // 0=Sunday
  const dayRuler = DAY_RULERS[dow];

  // Find the starting index in Chaldean order for the day ruler
  const startIdx = CHALDEAN_ORDER.indexOf(dayRuler);

  const hours: HourEntry[] = [];

  for (let i = 0; i < 24; i++) {
    const isDay = i < 12;
    const hourInPeriod = isDay ? i : i - 12;
    const start = isDay
      ? new Date(sunrise.getTime() + hourInPeriod * dayHourMs)
      : new Date(sunset.getTime() + hourInPeriod * nightHourMs);
    const end = isDay
      ? new Date(sunrise.getTime() + (hourInPeriod + 1) * dayHourMs)
      : new Date(sunset.getTime() + (hourInPeriod + 1) * nightHourMs);

    const planet = CHALDEAN_ORDER[(startIdx + i) % 7];

    hours.push({
      index: i,
      label: `${isDay ? 'Day' : 'Night'} ${hourInPeriod + 1}`,
      start,
      end,
      planet,
      isDay,
    });
  }

  return { hours, dayRuler, sunrise, sunset };
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlanetaryHoursPanel({ birthDate, lat, lng }: Props) {
  const defaultLat = lat ?? 33.8938; // Beirut
  const defaultLng = lng ?? 35.5018;

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [now, setNow] = useState(() => new Date());

  // Update clock every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dateObj = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return d;
  }, [selectedDate]);

  const { hours, dayRuler, sunrise, sunset } = useMemo(
    () => buildPlanetaryHours(dateObj, defaultLat, defaultLng),
    [dateObj, defaultLat, defaultLng],
  );

  // Find current hour
  const currentHourIdx = useMemo(() => {
    const t = now.getTime();
    for (let i = 0; i < hours.length; i++) {
      if (t >= hours[i].start.getTime() && t < hours[i].end.getTime()) return i;
    }
    return -1;
  }, [hours, now]);

  const currentHour = currentHourIdx >= 0 ? hours[currentHourIdx] : null;
  const countdown = currentHour ? currentHour.end.getTime() - now.getTime() : 0;

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Title */}
      <div>
        <h3 className="text-sm font-semibold">Planetary Hours</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Chaldean planetary hours based on sunrise/sunset</p>
      </div>

      <ToolGuide
        title="Planetary Hours"
        description="An ancient system dividing each day into 24 unequal hours, each ruled by a planet in Chaldean order (Saturn→Jupiter→Mars→Sun→Venus→Mercury→Moon). Day hours run sunrise to sunset; night hours run sunset to sunrise. Use them for electional timing."
        tips={[
          "The current planetary hour is highlighted — check what planet rules right now before starting important activities",
          "Sun hours are good for authority, leadership, and vitality matters",
          "Venus hours favor love, art, beauty, and social events",
          "Mercury hours are ideal for communication, writing, travel, and commerce",
          "Jupiter hours benefit expansion, legal matters, and financial growth",
          "Avoid starting important matters in Saturn hours unless you want restriction, discipline, or endings",
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-muted/10 border border-border/50 rounded px-2 py-1 text-xs text-foreground"
        />
        <span className="text-muted-foreground/60 text-xs">
          {defaultLat.toFixed(2)}, {defaultLng.toFixed(2)}
        </span>
      </div>

      {/* Day Ruler */}
      <div
        className="flex items-center justify-center gap-2 rounded-lg py-2"
        style={{ backgroundColor: PLANET_COLORS[dayRuler] + '20', border: `1px solid ${PLANET_COLORS[dayRuler]}40` }}
      >
        <span className="text-lg" style={{ color: PLANET_COLORS[dayRuler], fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>
          {PLANET_SYMBOLS[dayRuler]}
        </span>
        <div className="text-center">
          <div className="text-muted-foreground text-xs">Planetary Day Ruler</div>
          <div className="text-sm font-semibold" style={{ color: PLANET_COLORS[dayRuler] }}>
            {dayRuler}
          </div>
        </div>
      </div>

      {/* Sunrise / Sunset */}
      <div className="flex items-center justify-between text-muted-foreground text-xs px-1">
        <span>Sunrise {formatTime(sunrise)}</span>
        <span>Sunset {formatTime(sunset)}</span>
      </div>

      {/* Current Hour Highlight */}
      {isToday && currentHour && (
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{
            backgroundColor: PLANET_COLORS[currentHour.planet] + '25',
            border: `1px solid ${PLANET_COLORS[currentHour.planet]}60`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base" style={{ color: PLANET_COLORS[currentHour.planet] }}>
              {PLANET_SYMBOLS[currentHour.planet]}
            </span>
            <div>
              <div className="text-xs text-muted-foreground">Current Hour</div>
              <div className="font-semibold text-foreground">
                {currentHour.planet}
                <span className="text-muted-foreground/60 font-normal ml-1">({currentHour.label})</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Next hour in</div>
            <div className="font-mono text-sm text-foreground">{formatCountdown(countdown)}</div>
          </div>
        </div>
      )}

      {/* Hours Table */}
      <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border/50">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-background/80 backdrop-blur">
            <tr className="text-muted-foreground/60">
              <th className="py-1 px-2 text-left font-medium">#</th>
              <th className="py-1 px-2 text-left font-medium">Time</th>
              <th className="py-1 px-2 text-left font-medium">Ruler</th>
              <th className="py-1 px-2 text-right font-medium">Period</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((h, i) => {
              const isCurrent = isToday && i === currentHourIdx;
              const bgColor = PLANET_COLORS[h.planet];
              return (
                <tr
                  key={i}
                  className={`border-t border-border/30 transition-colors ${
                    isCurrent ? 'ring-1 ring-inset' : ''
                  }`}
                  style={{
                    backgroundColor: isCurrent ? bgColor + '30' : bgColor + '08',
                    ...(isCurrent ? { ringColor: bgColor } : {}),
                  }}
                >
                  <td className="py-1 px-2 text-muted-foreground/60 tabular-nums">{i + 1}</td>
                  <td className="py-1 px-2 text-foreground/70 font-mono tabular-nums whitespace-nowrap">
                    {formatTime(h.start)} - {formatTime(h.end)}
                  </td>
                  <td className="py-1 px-2">
                    <span className="flex items-center gap-1">
                      <span style={{ color: bgColor }}>{PLANET_SYMBOLS[h.planet]}</span>
                      <span className="text-foreground/80">{h.planet}</span>
                    </span>
                  </td>
                  <td className="py-1 px-2 text-right">
                    <span
                      className={`inline-block rounded px-1 py-0.5 text-[11px] font-medium ${
                        h.isDay ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {h.label}
                    </span>
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
