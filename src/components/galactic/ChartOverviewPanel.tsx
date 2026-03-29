/**
 * ChartOverviewPanel
 * Shows at-a-glance chart analysis: element balance, modality,
 * stelliums, hemisphere emphasis, and chart patterns.
 */

import { useMemo } from 'react';
import { X } from 'lucide-react';
import type { GalacticNatalChart, Planet3D } from './types';
import type { Aspect3D } from './types';
import { SIGN_COLORS_3D } from './constants';

interface ChartOverviewPanelProps {
  chart: GalacticNatalChart;
  planets3D: Planet3D[];
  aspects3D: Aspect3D[];
  name: string;
  onClose: () => void;
}

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
  Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
  Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
};

const SIGN_MODALITIES: Record<string, string> = {
  Aries: 'Cardinal', Taurus: 'Fixed', Gemini: 'Mutable', Cancer: 'Cardinal',
  Leo: 'Fixed', Virgo: 'Mutable', Libra: 'Cardinal', Scorpio: 'Fixed',
  Sagittarius: 'Mutable', Capricorn: 'Cardinal', Aquarius: 'Fixed', Pisces: 'Mutable',
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#ef4444', Earth: '#84cc16', Air: '#38bdf8', Water: '#818cf8',
};

const MODALITY_COLORS: Record<string, string> = {
  Cardinal: '#f59e0b', Fixed: '#22c55e', Mutable: '#a855f7',
};

const CORE_PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

function BalanceBar({ items, colors }: { items: { label: string; count: number }[]; colors: Record<string, string> }) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  if (total === 0) return null;
  return (
    <div className="space-y-1">
      <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
        {items.map((item) => (
          <div
            key={item.label}
            className="transition-all"
            style={{
              width: `${(item.count / total) * 100}%`,
              background: colors[item.label] ?? '#666',
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px]">
        {items.map((item) => (
          <span key={item.label} style={{ color: colors[item.label] ?? '#666' }}>
            {item.label} {item.count}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ChartOverviewPanel({ chart, planets3D, aspects3D, name, onClose }: ChartOverviewPanelProps) {
  const corePlanets = useMemo(() =>
    planets3D.filter((p) => CORE_PLANETS.includes(p.key)),
  [planets3D]);

  // Element balance
  const elements = useMemo(() => {
    const counts: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    for (const p of corePlanets) {
      const el = SIGN_ELEMENTS[p.sign];
      if (el) counts[el]++;
    }
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  }, [corePlanets]);

  // Modality balance
  const modalities = useMemo(() => {
    const counts: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
    for (const p of corePlanets) {
      const mod = SIGN_MODALITIES[p.sign];
      if (mod) counts[mod]++;
    }
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  }, [corePlanets]);

  // Dominant element & modality
  const dominantElement = useMemo(() => {
    return elements.reduce((a, b) => (b.count > a.count ? b : a));
  }, [elements]);

  const dominantModality = useMemo(() => {
    return modalities.reduce((a, b) => (b.count > a.count ? b : a));
  }, [modalities]);

  // Stelliums (3+ planets in same sign)
  const stelliums = useMemo(() => {
    const signCounts: Record<string, string[]> = {};
    for (const p of corePlanets) {
      if (!signCounts[p.sign]) signCounts[p.sign] = [];
      signCounts[p.sign].push(p.name);
    }
    return Object.entries(signCounts)
      .filter(([, planets]) => planets.length >= 3)
      .map(([sign, planets]) => ({ sign, planets, count: planets.length }));
  }, [corePlanets]);

  // Hemisphere emphasis
  const hemisphere = useMemo(() => {
    let above = 0, below = 0, east = 0, west = 0;
    for (const p of corePlanets) {
      if (!p.house) continue;
      if (p.house >= 7 && p.house <= 12) above++;
      else below++;
      if (p.house >= 10 || p.house <= 3) east++;
      else west++;
    }
    return { above, below, east, west };
  }, [corePlanets]);

  // Chart patterns (simplified detection)
  const patterns = useMemo(() => {
    const found: { name: string; planets: string[]; description: string }[] = [];

    // Grand trine: 3 planets each trine to each other
    const trines = aspects3D.filter((a) => a.aspect.type === 'trine');
    for (let i = 0; i < trines.length; i++) {
      for (let j = i + 1; j < trines.length; j++) {
        const sharedPlanet = [trines[i].planetA, trines[i].planetB].find(
          (p) => p === trines[j].planetA || p === trines[j].planetB,
        );
        if (!sharedPlanet) continue;
        const otherI = trines[i].planetA === sharedPlanet ? trines[i].planetB : trines[i].planetA;
        const otherJ = trines[j].planetA === sharedPlanet ? trines[j].planetB : trines[j].planetA;
        const thirdTrine = trines.find(
          (t) =>
            (t.planetA === otherI && t.planetB === otherJ) ||
            (t.planetA === otherJ && t.planetB === otherI),
        );
        if (thirdTrine) {
          const trio = [sharedPlanet, otherI, otherJ].sort();
          if (!found.some((f) => f.name === 'Grand Trine' && f.planets.join() === trio.join())) {
            found.push({
              name: 'Grand Trine',
              planets: trio,
              description: 'Natural talent and flow of energy between three areas of life',
            });
          }
        }
      }
    }

    // T-Square: 2 planets in opposition, both square a third
    const oppositions = aspects3D.filter((a) => a.aspect.type === 'opposition');
    const squares = aspects3D.filter((a) => a.aspect.type === 'square');
    for (const opp of oppositions) {
      for (const sq1 of squares) {
        const sharedWithOpp = [opp.planetA, opp.planetB].find(
          (p) => p === sq1.planetA || p === sq1.planetB,
        );
        if (!sharedWithOpp) continue;
        const apex = sq1.planetA === sharedWithOpp ? sq1.planetB : sq1.planetA;
        const otherOpp = opp.planetA === sharedWithOpp ? opp.planetB : opp.planetA;
        const sq2 = squares.find(
          (s) =>
            (s.planetA === otherOpp && s.planetB === apex) ||
            (s.planetA === apex && s.planetB === otherOpp),
        );
        if (sq2) {
          const trio = [sharedWithOpp, otherOpp, apex].sort();
          if (!found.some((f) => f.name === 'T-Square' && f.planets.join() === trio.join())) {
            found.push({
              name: 'T-Square',
              planets: trio,
              description: 'Dynamic tension that drives action and growth through challenge',
            });
          }
        }
      }
    }

    return found;
  }, [aspects3D]);

  const hemisphereLabel = useMemo(() => {
    const parts: string[] = [];
    if (hemisphere.above > hemisphere.below + 2) parts.push('Public-facing');
    else if (hemisphere.below > hemisphere.above + 2) parts.push('Private & internal');
    if (hemisphere.east > hemisphere.west + 2) parts.push('Self-driven');
    else if (hemisphere.west > hemisphere.east + 2) parts.push('Relationship-oriented');
    return parts.length ? parts.join(', ') : 'Balanced distribution';
  }, [hemisphere]);

  return (
    <div className="absolute top-14 left-3 z-20 w-64 max-h-[calc(100%-7rem)] overflow-y-auto bg-black/90 backdrop-blur-md rounded-lg border border-white/10 scrollbar-thin">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white/90">{name}'s Chart</span>
          <button onClick={onClose} className="p-0.5 hover:bg-white/10 rounded transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Dominant energy */}
        <div className="bg-white/5 rounded-lg p-2.5">
          <p className="text-[11px] text-white/50 mb-1">Dominant Energy</p>
          <p className="text-sm font-medium text-white/90">
            <span style={{ color: ELEMENT_COLORS[dominantElement.label] }}>
              {dominantElement.label}
            </span>
            {' + '}
            <span style={{ color: MODALITY_COLORS[dominantModality.label] }}>
              {dominantModality.label}
            </span>
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">{hemisphereLabel}</p>
        </div>

        {/* Element balance */}
        <div>
          <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1.5">Elements</p>
          <BalanceBar items={elements} colors={ELEMENT_COLORS} />
        </div>

        {/* Modality balance */}
        <div>
          <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1.5">Modalities</p>
          <BalanceBar items={modalities} colors={MODALITY_COLORS} />
        </div>

        {/* Stelliums */}
        {stelliums.length > 0 && (
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1.5">Stelliums</p>
            {stelliums.map((s) => (
              <div
                key={s.sign}
                className="rounded-lg px-2.5 py-1.5 border mb-1"
                style={{
                  borderColor: `${SIGN_COLORS_3D[s.sign] ?? '#666'}30`,
                  background: `${SIGN_COLORS_3D[s.sign] ?? '#666'}08`,
                }}
              >
                <span className="text-xs font-semibold" style={{ color: SIGN_COLORS_3D[s.sign] }}>
                  {s.count} planets in {s.sign}
                </span>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {s.planets.join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Chart patterns */}
        {patterns.length > 0 && (
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1.5">Chart Patterns</p>
            {patterns.map((p, i) => (
              <div key={i} className="rounded-lg px-2.5 py-1.5 bg-white/5 border border-white/10 mb-1">
                <span className="text-xs font-semibold text-white/80">{p.name}</span>
                <p className="text-[10px] text-white/40 capitalize">{p.planets.join(' · ')}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{p.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Hemisphere emphasis */}
        <div>
          <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1.5">Hemisphere</p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="bg-white/5 rounded p-1.5 text-center">
              <span className="text-white/40 block">Above</span>
              <span className="text-white/80 font-medium">{hemisphere.above}</span>
            </div>
            <div className="bg-white/5 rounded p-1.5 text-center">
              <span className="text-white/40 block">Below</span>
              <span className="text-white/80 font-medium">{hemisphere.below}</span>
            </div>
            <div className="bg-white/5 rounded p-1.5 text-center">
              <span className="text-white/40 block">East</span>
              <span className="text-white/80 font-medium">{hemisphere.east}</span>
            </div>
            <div className="bg-white/5 rounded p-1.5 text-center">
              <span className="text-white/40 block">West</span>
              <span className="text-white/80 font-medium">{hemisphere.west}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
