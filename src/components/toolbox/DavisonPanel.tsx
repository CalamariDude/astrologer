/**
 * Davison Relationship Chart Panel
 * Calculates the midpoint date/time/location between two births,
 * then casts a real natal chart for that moment — the "birth chart of the relationship."
 */

import React, { useState, useEffect, useMemo } from 'react';
import { swissEphemeris } from '@/api/swissEphemeris';
import { ToolGuide } from './ToolGuide';

interface Props {
  birthInfoA: { date: string; time: string; lat: number; lng: number; name: string };
  birthInfoB: { date: string; time: string; lat: number; lng: number; name: string };
}

/* ── Constants ── */

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609\uFE0E', Moon: '\u263D\uFE0E', Mercury: '\u263F\uFE0E', Venus: '\u2640\uFE0E', Mars: '\u2642\uFE0E',
  Jupiter: '\u2643\uFE0E', Saturn: '\u2644\uFE0E', Uranus: '\u26E2\uFE0E', Neptune: '\u2646\uFE0E', Pluto: '\u2647\uFE0E',
};

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const ASPECT_DEFS = [
  { name: 'Conjunction', angle: 0, orb: 8, symbol: '\u260C' },
  { name: 'Sextile', angle: 60, orb: 6, symbol: '\u26B9' },
  { name: 'Square', angle: 90, orb: 7, symbol: '\u25A1' },
  { name: 'Trine', angle: 120, orb: 8, symbol: '\u25B3' },
  { name: 'Opposition', angle: 180, orb: 8, symbol: '\u260D' },
];

const ASPECT_COLORS: Record<string, string> = {
  Conjunction: '#FFD700',
  Sextile: '#60A5FA',
  Square: '#EF4444',
  Trine: '#34D399',
  Opposition: '#F97316',
};

const PLANETS_ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

/* ── Helpers ── */

function parseDatetime(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = (time || '12:00').split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeStr(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDegree(longitude: number): string {
  const sign = Math.floor(longitude / 30);
  const deg = Math.floor(longitude % 30);
  const min = Math.floor((longitude % 1) * 60);
  const signs = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];
  return `${deg}\u00B0${String(min).padStart(2, '0')}' ${signs[sign]}`;
}

function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

interface Aspect {
  planetA: string;
  planetB: string;
  aspect: string;
  symbol: string;
  orb: number;
  color: string;
}

function findAspects(planets: Record<string, { longitude: number }>): Aspect[] {
  const aspects: Aspect[] = [];
  const keys = PLANETS_ORDER.filter(p => planets[p]);

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const longA = planets[keys[i]].longitude;
      const longB = planets[keys[j]].longitude;
      const diff = angleDiff(longA, longB);

      for (const asp of ASPECT_DEFS) {
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb) {
          aspects.push({
            planetA: keys[i],
            planetB: keys[j],
            aspect: asp.name,
            symbol: asp.symbol,
            orb: Math.round(orb * 100) / 100,
            color: ASPECT_COLORS[asp.name] || '#888',
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

/* ── Component ── */

export function DavisonPanel({ birthInfoA, birthInfoB }: Props) {
  const [chart, setChart] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate midpoints
  const midpoint = useMemo(() => {
    const dtA = parseDatetime(birthInfoA.date, birthInfoA.time);
    const dtB = parseDatetime(birthInfoB.date, birthInfoB.time);
    const midMs = (dtA.getTime() + dtB.getTime()) / 2;
    const midDt = new Date(midMs);
    const midLat = (birthInfoA.lat + birthInfoB.lat) / 2;
    // Handle antimeridian crossing for longitude midpoint
    let midLng: number;
    const lngDiff = Math.abs(birthInfoA.lng - birthInfoB.lng);
    if (lngDiff > 180) {
      midLng = ((birthInfoA.lng + birthInfoB.lng) / 2 + 180) % 360 - 180;
    } else {
      midLng = (birthInfoA.lng + birthInfoB.lng) / 2;
    }
    return {
      date: formatDateStr(midDt),
      time: formatTimeStr(midDt),
      lat: midLat,
      lng: midLng,
      datetime: midDt,
    };
  }, [birthInfoA, birthInfoB]);

  // Fetch chart
  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const data = await swissEphemeris.natal({
          date: midpoint.date,
          time: midpoint.time,
          lat: midpoint.lat,
          lng: midpoint.lng,
        });
        // Convert API array format to Record keyed by planet name
        if (data.planets && Array.isArray(data.planets)) {
          const planetsRecord: Record<string, any> = {};
          for (const p of data.planets) {
            const name = p.planet || p.name || '';
            if (!name) continue;
            planetsRecord[name] = {
              longitude: p.longitude ?? 0,
              latitude: p.latitude ?? undefined,
              sign: p.sign || '',
              degree: p.degree ?? undefined,
              minute: p.minute ?? undefined,
              retrograde: p.retrograde ?? false,
              house: p.house ?? undefined,
            };
          }
          data.planets = planetsRecord;
        }
        if (!cancelled) setChart(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to calculate Davison chart');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [midpoint]);

  const aspects = useMemo(() => {
    if (!chart?.planets) return [];
    return findAspects(chart.planets);
  }, [chart]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-xs text-muted-foreground/60">
        <div className="w-4 h-4 border-2 border-border/60 border-t-foreground/60 rounded-full animate-spin mr-2" />
        Calculating Davison chart...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-400 text-center py-8 rounded-lg border border-red-500/20 bg-red-500/5 mx-2">
        <p>{error}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">Try refreshing or check your connection</p>
      </div>
    );
  }

  if (!chart) return null;

  const planets = chart.planets || {};
  const ascSign = chart.ascendantSign || (chart.houses?.ascendant != null
    ? ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][Math.floor((chart.houses.ascendant % 360) / 30)]
    : '—');
  const mcLong = chart.houses?.mc;
  const mcSign = mcLong != null
    ? ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][Math.floor((mcLong % 360) / 30)]
    : '—';

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">Davison Relationship Chart</h3>
        <p className="text-xs text-muted-foreground mt-0.5">The birth chart of the relationship</p>
      </div>

      <ToolGuide
        title="Davison Relationship Chart"
        description="The Davison chart creates a single chart for a relationship by finding the midpoint in both time and space between two birth charts. Unlike the composite (which averages planet positions), the Davison is a real moment in time and can be read like a natal chart."
        tips={[
          "The Davison chart shows the relationship as its own 'entity' with its own personality and destiny",
          "The Davison Sun shows the core purpose and vitality of the relationship",
          "The Davison Moon reveals the emotional climate and what the relationship needs to feel secure",
          "Angular planets in the Davison chart dominate the relationship's dynamics",
          "Compare the Davison chart's themes with each person's natal chart for deeper insight",
          "Transits to the Davison chart trigger relationship events and developments",
        ]}
      />

      {/* Info banner */}
      <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2">
        <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-1">
          About
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          The "birth chart of the relationship" — a real chart cast for the midpoint date, time, and
          location between {birthInfoA.name || 'Person A'} and {birthInfoB.name || 'Person B'}.
        </div>
      </div>

      {/* Midpoint Data */}
      <div className="rounded-lg border border-border/50 bg-muted/10 p-3 space-y-1">
        <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5">
          Midpoint Birth Data
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div>
            <span className="text-muted-foreground/60">Date</span>
            <div className="text-foreground font-mono">{midpoint.date}</div>
          </div>
          <div>
            <span className="text-muted-foreground/60">Time</span>
            <div className="text-foreground font-mono">{midpoint.time}</div>
          </div>
          <div>
            <span className="text-muted-foreground/60">Location</span>
            <div className="text-foreground font-mono">
              {midpoint.lat.toFixed(2)}, {midpoint.lng.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground/70 mt-1">
          Between: {birthInfoA.name || 'A'} ({birthInfoA.date}) &amp; {birthInfoB.name || 'B'} ({birthInfoB.date})
        </div>
      </div>

      {/* ASC / MC */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/50 bg-muted/10 p-2 text-center">
          <div className="text-[11px] text-muted-foreground/60 uppercase">Ascendant</div>
          <div className="text-sm font-semibold text-amber-300">
            <span style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{SIGN_SYMBOLS[ascSign] || ''}</span> {ascSign}
          </div>
          {chart.houses?.ascendant != null && (
            <div className="text-xs text-muted-foreground/60 font-mono">{formatDegree(chart.houses.ascendant)}</div>
          )}
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 p-2 text-center">
          <div className="text-[11px] text-muted-foreground/60 uppercase">Midheaven (MC)</div>
          <div className="text-sm font-semibold text-cyan-300">
            <span style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{SIGN_SYMBOLS[mcSign] || ''}</span> {mcSign}
          </div>
          {mcLong != null && (
            <div className="text-xs text-muted-foreground/60 font-mono">{formatDegree(mcLong)}</div>
          )}
        </div>
      </div>

      {/* Planets Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="bg-muted/10">
            <tr className="text-muted-foreground/60">
              <th className="py-1.5 px-2 text-left font-medium">Planet</th>
              <th className="py-1.5 px-2 text-left font-medium">Sign</th>
              <th className="py-1.5 px-2 text-left font-medium">Degree</th>
              <th className="py-1.5 px-2 text-center font-medium">House</th>
              <th className="py-1.5 px-2 text-center font-medium">Rx</th>
            </tr>
          </thead>
          <tbody>
            {PLANETS_ORDER.map(name => {
              const p = planets[name];
              if (!p) return null;
              return (
                <tr key={name} className="border-t border-border/30 hover:bg-muted/10 transition-colors">
                  <td className="py-1 px-2">
                    <span className="text-muted-foreground mr-1">{PLANET_SYMBOLS[name] || ''}</span>
                    <span className="text-foreground/80">{name}</span>
                  </td>
                  <td className="py-1 px-2 text-foreground/70">
                    {SIGN_SYMBOLS[p.sign] || ''} {p.sign}
                  </td>
                  <td className="py-1 px-2 font-mono text-muted-foreground">
                    {formatDegree(p.longitude)}
                  </td>
                  <td className="py-1 px-2 text-center text-muted-foreground">
                    {p.house || '—'}
                  </td>
                  <td className="py-1 px-2 text-center">
                    {p.retrograde ? (
                      <span className="text-red-400 font-semibold">R</span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Aspects */}
      <div>
        <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5">
          Davison Chart Aspects ({aspects.length})
        </div>
        {aspects.length === 0 ? (
          <div className="text-xs text-muted-foreground/70 text-center py-3">No major aspects found</div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden max-h-[300px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-muted/10 sticky top-0">
                <tr className="text-muted-foreground/60">
                  <th className="py-1 px-2 text-left font-medium">Planet</th>
                  <th className="py-1 px-2 text-center font-medium">Aspect</th>
                  <th className="py-1 px-2 text-left font-medium">Planet</th>
                  <th className="py-1 px-2 text-right font-medium">Orb</th>
                </tr>
              </thead>
              <tbody>
                {aspects.map((asp, i) => (
                  <tr key={i} className="border-t border-border/30">
                    <td className="py-1 px-2 text-foreground/70">
                      {PLANET_SYMBOLS[asp.planetA] || ''} {asp.planetA}
                    </td>
                    <td className="py-1 px-2 text-center" style={{ color: asp.color }}>
                      {asp.symbol} {asp.aspect}
                    </td>
                    <td className="py-1 px-2 text-foreground/70">
                      {PLANET_SYMBOLS[asp.planetB] || ''} {asp.planetB}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-muted-foreground/60">
                      {asp.orb.toFixed(1)}°
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
