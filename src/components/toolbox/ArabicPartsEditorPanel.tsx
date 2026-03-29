/**
 * Arabic Parts (Lots) Editor Panel
 * Calculates ~50 traditional Arabic Parts plus custom user-defined parts.
 * Formula: Point_A + Point_B - Point_C (normalized to 0-360)
 */

import React, { useMemo, useState, useCallback } from 'react';
import { ToolGuide } from './ToolGuide';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string }>;
    houses?: { cusps?: number[]; ascendant?: number; mc?: number };
  };
  name?: string;
}

type Category = 'Core' | 'Relationship' | 'Career' | 'Health' | 'Knowledge';

interface ArabicPartDef {
  name: string;
  category: Category;
  dayFormula: [string, string, string]; // A + B - C
  nightFormula?: [string, string, string]; // reversed at night
  description?: string;
}

interface CustomPart {
  name: string;
  formula: [string, string, string];
}

interface CalculatedPart {
  name: string;
  category: Category | 'Custom';
  formula: string;
  longitude: number;
  sign: string;
  degree: number;
  minutes: number;
  house: number | null;
  conjunctions: { planet: string; orb: number }[];
  isCustom?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIGN_SYMBOLS = ['\u2648\uFE0E', '\u2649\uFE0E', '\u264A\uFE0E', '\u264B\uFE0E', '\u264C\uFE0E', '\u264D\uFE0E',
  '\u264E\uFE0E', '\u264F\uFE0E', '\u2650\uFE0E', '\u2651\uFE0E', '\u2652\uFE0E', '\u2653\uFE0E'];
const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609\uFE0E', Moon: '\u263D\uFE0E', Mercury: '\u263F\uFE0E', Venus: '\u2640\uFE0E', Mars: '\u2642\uFE0E',
  Jupiter: '\u2643\uFE0E', Saturn: '\u2644\uFE0E', Uranus: '\u26E2\uFE0E', Neptune: '\u2646\uFE0E', Pluto: '\u2647\uFE0E',
  NorthNode: '\u260A\uFE0E', SouthNode: '\u260B\uFE0E', Chiron: '\u26B7\uFE0E',
  ASC: 'Asc', MC: 'MC', DSC: 'Dsc', IC: 'IC',
  Fortune: '\u2297', Spirit: '\u2299',
};

const CATEGORY_COLORS: Record<string, string> = {
  Core: '#FFD700',
  Relationship: '#FF69B4',
  Career: '#00CED1',
  Health: '#22c55e',
  Knowledge: '#9370DB',
  Custom: '#f97316',
};

/* ------------------------------------------------------------------ */
/*  Arabic Parts catalog                                               */
/* ------------------------------------------------------------------ */

const ARABIC_PARTS: ArabicPartDef[] = [
  // Core
  { name: 'Fortune', category: 'Core', dayFormula: ['ASC', 'Moon', 'Sun'], nightFormula: ['ASC', 'Sun', 'Moon'], description: 'Material well-being and luck' },
  { name: 'Spirit', category: 'Core', dayFormula: ['ASC', 'Sun', 'Moon'], nightFormula: ['ASC', 'Moon', 'Sun'], description: 'Soul purpose and will' },
  { name: 'Eros', category: 'Core', dayFormula: ['ASC', 'Venus', 'Spirit'], description: 'Erotic desire and attraction' },
  { name: 'Necessity', category: 'Core', dayFormula: ['ASC', 'Fortune', 'Mercury'], description: 'Fate and compulsion' },
  { name: 'Courage', category: 'Core', dayFormula: ['ASC', 'Fortune', 'Mars'], description: 'Boldness and daring' },
  { name: 'Victory', category: 'Core', dayFormula: ['ASC', 'Jupiter', 'Spirit'], description: 'Success and triumph' },
  { name: 'Nemesis', category: 'Core', dayFormula: ['ASC', 'Fortune', 'Saturn'], description: 'Hidden enemies and undoing' },

  // Relationship
  { name: 'Marriage', category: 'Relationship', dayFormula: ['ASC', 'DSC', 'Venus'], description: 'Marriage and partnership' },
  { name: 'Love', category: 'Relationship', dayFormula: ['ASC', 'Venus', 'Sun'], description: 'Romantic love' },
  { name: 'Sex', category: 'Relationship', dayFormula: ['ASC', 'Venus', 'Mars'], description: 'Sexual desire and intimacy' },
  { name: 'Passion', category: 'Relationship', dayFormula: ['ASC', 'Mars', 'Sun'], description: 'Passionate drive' },
  { name: 'Children', category: 'Relationship', dayFormula: ['ASC', 'Jupiter', 'Moon'], nightFormula: ['ASC', 'Moon', 'Jupiter'], description: 'Offspring and fertility' },
  { name: 'Mother', category: 'Relationship', dayFormula: ['ASC', 'Moon', 'Venus'], description: 'Relationship with mother' },
  { name: 'Father', category: 'Relationship', dayFormula: ['ASC', 'Saturn', 'Sun'], nightFormula: ['ASC', 'Sun', 'Saturn'], description: 'Relationship with father' },
  { name: 'Friends', category: 'Relationship', dayFormula: ['ASC', 'Moon', 'Mercury'], description: 'Friendship and allies' },
  { name: 'Siblings', category: 'Relationship', dayFormula: ['ASC', 'Jupiter', 'Saturn'], description: 'Brothers and sisters' },

  // Career / Money
  { name: 'Commerce', category: 'Career', dayFormula: ['ASC', 'Mercury', 'Sun'], description: 'Trade and business' },
  { name: 'Wealth', category: 'Career', dayFormula: ['ASC', 'Jupiter', 'Saturn'], description: 'Accumulated wealth' },
  { name: 'Profession', category: 'Career', dayFormula: ['ASC', 'Moon', 'Saturn'], description: 'Career and vocation' },
  { name: 'Inheritance', category: 'Career', dayFormula: ['ASC', 'Saturn', 'Moon'], description: 'Legacies and inheritance' },
  { name: 'Real Estate', category: 'Career', dayFormula: ['ASC', 'Saturn', 'Mercury'], description: 'Property and land' },
  { name: 'Goods', category: 'Career', dayFormula: ['ASC', 'Fortune', 'Spirit'], description: 'Possessions and movable goods' },
  { name: 'Servants', category: 'Career', dayFormula: ['ASC', 'Mercury', 'Moon'], description: 'Employees and helpers' },
  { name: 'Mastery', category: 'Career', dayFormula: ['ASC', 'Saturn', 'Mars'], description: 'Authority and discipline' },
  { name: 'Merchants', category: 'Career', dayFormula: ['ASC', 'Mercury', 'Jupiter'], description: 'Mercantile success' },
  { name: 'Kingship', category: 'Career', dayFormula: ['ASC', 'Mars', 'Moon'], description: 'Leadership and power' },

  // Health / Life
  { name: 'Life', category: 'Health', dayFormula: ['ASC', 'Jupiter', 'Saturn'], description: 'Vitality and longevity' },
  { name: 'Sickness', category: 'Health', dayFormula: ['ASC', 'Mars', 'Saturn'], description: 'Illness and affliction' },
  { name: 'Death', category: 'Health', dayFormula: ['ASC', 'H8', 'Moon'], description: 'Mortality and transformation' },
  { name: 'Surgery', category: 'Health', dayFormula: ['ASC', 'Saturn', 'Mars'], description: 'Surgical matters' },
  { name: 'Danger', category: 'Health', dayFormula: ['ASC', 'Saturn', 'Sun'], description: 'Peril and risk' },
  { name: 'Fatality', category: 'Health', dayFormula: ['ASC', 'Saturn', 'Fortune'], description: 'Fated events' },
  { name: 'Captivity', category: 'Health', dayFormula: ['ASC', 'Saturn', 'Fortune'], description: 'Imprisonment and restriction' },
  { name: 'Chronic Illness', category: 'Health', dayFormula: ['ASC', 'Mars', 'Jupiter'], description: 'Long-term health issues' },

  // Knowledge
  { name: 'Understanding', category: 'Knowledge', dayFormula: ['ASC', 'Mercury', 'Mars'], description: 'Intellectual comprehension' },
  { name: 'Knowledge', category: 'Knowledge', dayFormula: ['ASC', 'Sun', 'Mercury'], description: 'Wisdom and learning' },
  { name: 'Travel', category: 'Knowledge', dayFormula: ['ASC', 'H9', 'Jupiter'], description: 'Long journeys' },
  { name: 'Skill', category: 'Knowledge', dayFormula: ['ASC', 'Mercury', 'Jupiter'], description: 'Craft and expertise' },
  { name: 'Astrology', category: 'Knowledge', dayFormula: ['ASC', 'Mercury', 'Uranus'], description: 'Astrological talent' },
  { name: 'Dreams', category: 'Knowledge', dayFormula: ['ASC', 'Neptune', 'Moon'], description: 'Dream life and visions' },
  { name: 'Hidden Things', category: 'Knowledge', dayFormula: ['ASC', 'Pluto', 'Neptune'], description: 'Secrets and the occult' },
  { name: 'Divination', category: 'Knowledge', dayFormula: ['ASC', 'Moon', 'Neptune'], description: 'Prophetic ability' },
  { name: 'Religion', category: 'Knowledge', dayFormula: ['ASC', 'Jupiter', 'Moon'], description: 'Spiritual devotion' },
  { name: 'Philosophy', category: 'Knowledge', dayFormula: ['ASC', 'Jupiter', 'Mercury'], description: 'Philosophical mind' },
  { name: 'Renown', category: 'Knowledge', dayFormula: ['ASC', 'Jupiter', 'Sun'], description: 'Fame and reputation' },
  { name: 'Eloquence', category: 'Knowledge', dayFormula: ['ASC', 'Mercury', 'Moon'], description: 'Gift of speech' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeLong(l: number): number {
  return ((l % 360) + 360) % 360;
}

function signOfLong(lng: number): { sign: string; degree: number; minutes: number; signIdx: number } {
  const normalized = normalizeLong(lng);
  const signIdx = Math.floor(normalized / 30);
  const inSign = normalized % 30;
  const degree = Math.floor(inSign);
  const minutes = Math.round((inSign - degree) * 60);
  return { sign: SIGN_NAMES[signIdx], degree, minutes, signIdx };
}

function formatPos(lng: number): string {
  const { sign, degree, minutes, signIdx } = signOfLong(lng);
  return `${degree}\u00B0${minutes < 10 ? '0' : ''}${minutes}' ${SIGN_SYMBOLS[signIdx]}`;
}

function findHouse(longitude: number, cusps?: number[]): number | null {
  if (!cusps || cusps.length < 12) return null;
  const lng = normalizeLong(longitude);
  for (let i = 0; i < 12; i++) {
    const start = normalizeLong(cusps[i]);
    const end = normalizeLong(cusps[(i + 1) % 12]);
    if (start < end) {
      if (lng >= start && lng < end) return i + 1;
    } else {
      if (lng >= start || lng < end) return i + 1;
    }
  }
  return 1;
}

function angularDistance(a: number, b: number): number {
  const d = Math.abs(normalizeLong(a) - normalizeLong(b));
  return d > 180 ? 360 - d : d;
}

function resolvePoint(
  key: string,
  planets: Record<string, { longitude: number }>,
  houses?: { cusps?: number[]; ascendant?: number; mc?: number },
  calculatedParts?: Map<string, number>,
): number | null {
  // Special points
  if (key === 'ASC') return houses?.ascendant ?? null;
  if (key === 'MC') return houses?.mc ?? null;
  if (key === 'DSC') return houses?.ascendant != null ? normalizeLong(houses.ascendant + 180) : null;
  if (key === 'IC') return houses?.mc != null ? normalizeLong(houses.mc + 180) : null;

  // House cusps: H1, H2, ..., H12
  const hMatch = key.match(/^H(\d+)$/);
  if (hMatch) {
    const hNum = parseInt(hMatch[1]);
    if (houses?.cusps && hNum >= 1 && hNum <= 12) return houses.cusps[hNum - 1];
    return null;
  }

  // Previously calculated lots (Fortune, Spirit)
  if (calculatedParts?.has(key)) return calculatedParts.get(key)!;

  // Planet - try various casings
  const pKey = Object.keys(planets).find(
    k => k.toLowerCase() === key.toLowerCase()
  );
  if (pKey) return planets[pKey].longitude;

  return null;
}

function isDayChart(planets: Record<string, { longitude: number }>, houses?: { cusps?: number[]; ascendant?: number }): boolean {
  // Sun above horizon = day chart (houses 7-12)
  // Simplified: Sun longitude relative to ASC. If Sun is in upper half, it's day.
  const sunKey = Object.keys(planets).find(k => k.toLowerCase() === 'sun');
  if (!sunKey || !houses?.ascendant) return true; // default to day
  const sunLng = normalizeLong(planets[sunKey].longitude);
  const ascLng = normalizeLong(houses.ascendant);
  const dscLng = normalizeLong(ascLng + 180);
  // Sun is above horizon if it's between DSC and ASC going counter-clockwise (through MC)
  if (dscLng < ascLng) {
    return sunLng >= dscLng && sunLng < ascLng;
  } else {
    return sunLng >= dscLng || sunLng < ascLng;
  }
}

function labelFor(key: string): string {
  if (key === 'ASC') return 'ASC';
  if (key === 'MC') return 'MC';
  if (key === 'DSC') return 'DSC';
  if (key === 'IC') return 'IC';
  if (key.startsWith('H')) return `${key} cusp`;
  return key;
}

function symbolForPoint(key: string): string {
  return PLANET_SYMBOLS[key] || key;
}

/* ------------------------------------------------------------------ */
/*  Available points for dropdown                                      */
/* ------------------------------------------------------------------ */

const AVAILABLE_POINTS = [
  'ASC', 'MC', 'DSC', 'IC',
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
  'NorthNode', 'SouthNode', 'Chiron',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'H11', 'H12',
  'Fortune', 'Spirit',
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ArabicPartsEditorPanel({ natalChart, name }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | 'All' | 'Custom'>('All');
  const [search, setSearch] = useState('');
  const [isNight, setIsNight] = useState<boolean | null>(null); // null = auto-detect
  const [customParts, setCustomParts] = useState<CustomPart[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartA, setNewPartA] = useState('ASC');
  const [newPartB, setNewPartB] = useState('Moon');
  const [newPartC, setNewPartC] = useState('Sun');
  const [showCreator, setShowCreator] = useState(false);

  const autoNight = useMemo(() => !isDayChart(natalChart.planets, natalChart.houses), [natalChart]);
  const nightChart = isNight ?? autoNight;

  const calculated = useMemo(() => {
    const results: CalculatedPart[] = [];
    const resolvedParts = new Map<string, number>();

    // Calculate standard parts
    for (const part of ARABIC_PARTS) {
      const formula = nightChart && part.nightFormula ? part.nightFormula : part.dayFormula;
      const a = resolvePoint(formula[0], natalChart.planets, natalChart.houses, resolvedParts);
      const b = resolvePoint(formula[1], natalChart.planets, natalChart.houses, resolvedParts);
      const c = resolvePoint(formula[2], natalChart.planets, natalChart.houses, resolvedParts);

      if (a == null || b == null || c == null) continue;

      const longitude = normalizeLong(a + b - c);
      const { sign, degree, minutes } = signOfLong(longitude);
      const house = findHouse(longitude, natalChart.houses?.cusps);

      // Check conjunctions with natal planets
      const conjunctions: { planet: string; orb: number }[] = [];
      for (const [key, pData] of Object.entries(natalChart.planets)) {
        const orb = angularDistance(longitude, pData.longitude);
        if (orb <= 2) {
          conjunctions.push({ planet: key, orb: Math.round(orb * 10) / 10 });
        }
      }

      const formulaStr = `${labelFor(formula[0])} + ${labelFor(formula[1])} - ${labelFor(formula[2])}`;

      // Store for reference by other parts
      resolvedParts.set(part.name, longitude);

      results.push({
        name: part.name,
        category: part.category,
        formula: formulaStr,
        longitude,
        sign,
        degree,
        minutes,
        house,
        conjunctions,
      });
    }

    // Custom parts
    for (const cp of customParts) {
      const a = resolvePoint(cp.formula[0], natalChart.planets, natalChart.houses, resolvedParts);
      const b = resolvePoint(cp.formula[1], natalChart.planets, natalChart.houses, resolvedParts);
      const c = resolvePoint(cp.formula[2], natalChart.planets, natalChart.houses, resolvedParts);

      if (a == null || b == null || c == null) continue;

      const longitude = normalizeLong(a + b - c);
      const { sign, degree, minutes } = signOfLong(longitude);
      const house = findHouse(longitude, natalChart.houses?.cusps);

      const conjunctions: { planet: string; orb: number }[] = [];
      for (const [key, pData] of Object.entries(natalChart.planets)) {
        const orb = angularDistance(longitude, pData.longitude);
        if (orb <= 2) {
          conjunctions.push({ planet: key, orb: Math.round(orb * 10) / 10 });
        }
      }

      results.push({
        name: cp.name,
        category: 'Custom',
        formula: `${labelFor(cp.formula[0])} + ${labelFor(cp.formula[1])} - ${labelFor(cp.formula[2])}`,
        longitude,
        sign,
        degree,
        minutes,
        house,
        conjunctions,
        isCustom: true,
      });
    }

    return results;
  }, [natalChart, nightChart, customParts]);

  const filtered = useMemo(() => {
    return calculated.filter(p => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [calculated, activeCategory, search]);

  const addCustomPart = useCallback(() => {
    if (!newPartName.trim()) return;
    setCustomParts(prev => [...prev, { name: newPartName.trim(), formula: [newPartA, newPartB, newPartC] }]);
    setNewPartName('');
    setShowCreator(false);
  }, [newPartName, newPartA, newPartB, newPartC]);

  const removeCustomPart = useCallback((name: string) => {
    setCustomParts(prev => prev.filter(p => p.name !== name));
  }, []);

  const categories: (Category | 'All' | 'Custom')[] = ['All', 'Core', 'Relationship', 'Career', 'Health', 'Knowledge', 'Custom'];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">
          Arabic Parts (Lots){name ? <span className="text-muted-foreground font-normal"> for {name}</span> : ''}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Traditional Arabic Parts calculated as A + B - C, with day/night formula variations.
        </p>
      </div>

      <ToolGuide
        title="Arabic Parts (Lots)"
        description="Arabic Parts (or Lots) are calculated points using the formula: Ascendant + Planet A − Planet B. Each Part synthesizes three chart factors into a single sensitive point. The most famous is the Part of Fortune (ASC + Moon − Sun). Day/night charts reverse the formula."
        tips={[
          "The Part of Fortune shows where material luck and well-being converge in your chart",
          "The Part of Spirit (reverse of Fortune) shows purpose, mind, and intentional action",
          "Each Part's house placement shows the life area it activates; its sign shows its style",
          "Day charts use the standard formula; night charts swap the two planets (A and B)",
          "Use the search to find specific Parts, or browse by category (fortune, love, career, etc.)",
          "Toggle Day/Night override if the auto-detection doesn't match your chart",
        ]}
      />

      {!natalChart.houses?.ascendant && (
        <div className="text-xs text-muted-foreground/70 text-center py-6 rounded-lg border border-border/30 bg-muted/10">
          Birth time required for accurate Arabic Parts calculations
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNight(isNight === null ? !autoNight : isNight === !autoNight ? null : !isNight)}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${nightChart ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'}`}
            title="Toggle day/night chart (affects reversed formulas)"
          >
            {nightChart ? '\u263D\uFE0E Night' : '\u2609\uFE0E Day'}
          </button>
          <button
            onClick={() => setShowCreator(!showCreator)}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${showCreator ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'}`}
          >
            + Custom
          </button>
        </div>
      </div>

      {/* Custom part creator */}
      {showCreator && (
        <div className="p-2 rounded-lg bg-muted/10 border border-orange-500/20 space-y-2">
          <div className="text-xs text-muted-foreground font-medium">Create Custom Part: A + B - C</div>
          <div className="flex items-center gap-1.5">
            <select
              value={newPartA}
              onChange={e => setNewPartA(e.target.value)}
              className="bg-background rounded-lg px-1.5 py-1 text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1"
            >
              {AVAILABLE_POINTS.map(p => (
                <option key={p} value={p}>{symbolForPoint(p)} {p}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground/60">+</span>
            <select
              value={newPartB}
              onChange={e => setNewPartB(e.target.value)}
              className="bg-background rounded-lg px-1.5 py-1 text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1"
            >
              {AVAILABLE_POINTS.map(p => (
                <option key={p} value={p}>{symbolForPoint(p)} {p}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground/60">-</span>
            <select
              value={newPartC}
              onChange={e => setNewPartC(e.target.value)}
              className="bg-background rounded-lg px-1.5 py-1 text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1"
            >
              {AVAILABLE_POINTS.map(p => (
                <option key={p} value={p}>{symbolForPoint(p)} {p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newPartName}
              onChange={e => setNewPartName(e.target.value)}
              placeholder="Part name..."
              className="bg-background rounded-lg px-1.5 py-1 text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1"
              onKeyDown={e => e.key === 'Enter' && addCustomPart()}
            />
            <button
              onClick={addCustomPart}
              disabled={!newPartName.trim()}
              className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 disabled:opacity-30"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-1.5">
        <div className="flex gap-0.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                activeCategory === cat
                  ? 'font-semibold'
                  : 'bg-muted/10 text-muted-foreground/60 hover:bg-muted/20 hover:text-muted-foreground'
              }`}
              style={activeCategory === cat ? {
                backgroundColor: `${CATEGORY_COLORS[cat] || '#fff'}25`,
                color: CATEGORY_COLORS[cat] || '#fff',
              } : undefined}
            >
              {cat}{cat !== 'All' && cat !== 'Custom' ? '' : ''} {cat === 'Custom' && customParts.length > 0 ? `(${customParts.length})` : ''}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search parts..."
          className="w-full bg-background rounded-lg px-3 py-2 text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/30"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground/60 border-b border-border/50">
              <th className="text-left py-1 pr-2 font-medium">Part</th>
              <th className="text-left py-1 pr-2 font-medium">Formula</th>
              <th className="text-left py-1 pr-2 font-medium">Position</th>
              <th className="text-center py-1 pr-2 font-medium">H</th>
              <th className="text-left py-1 font-medium">Conjunctions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((part, idx) => {
              const hasConjunctions = part.conjunctions.length > 0;
              return (
                <tr
                  key={`${part.name}-${idx}`}
                  className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${hasConjunctions ? 'bg-yellow-500/5' : ''}`}
                >
                  <td className="py-1 pr-2">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[part.category] || '#fff' }}
                      />
                      <span className={`font-medium ${hasConjunctions ? 'text-yellow-300' : 'text-foreground/80'}`}>
                        {part.name}
                      </span>
                      {part.isCustom && (
                        <button
                          onClick={() => removeCustomPart(part.name)}
                          className="text-red-400/50 hover:text-red-400 text-[11px] ml-0.5"
                          title="Remove"
                        >
                          x
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-1 pr-2 text-muted-foreground/60 font-mono whitespace-nowrap">
                    {part.formula}
                  </td>
                  <td className="py-1 pr-2 whitespace-nowrap">
                    <span className="text-foreground/70">{part.degree}°{part.minutes < 10 ? '0' : ''}{part.minutes}'</span>
                    {' '}
                    <span style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>{SIGN_SYMBOLS[SIGN_NAMES.indexOf(part.sign)]}</span>
                    {' '}
                    <span className="text-muted-foreground/60">{part.sign}</span>
                  </td>
                  <td className="py-1 pr-2 text-center text-muted-foreground">
                    {part.house || '-'}
                  </td>
                  <td className="py-1">
                    {part.conjunctions.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {part.conjunctions.map((c, ci) => {
                          const sym = PLANET_SYMBOLS[c.planet] || PLANET_SYMBOLS[c.planet.charAt(0).toUpperCase() + c.planet.slice(1)] || c.planet;
                          return (
                            <span
                              key={ci}
                              className="inline-flex items-center gap-0.5 px-1 py-0 rounded bg-yellow-500/15 text-yellow-300"
                            >
                              {sym} {c.orb}°
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-xs text-muted-foreground/60 text-center py-4">
          {search ? 'No parts match your search' : 'No parts in this category'}
        </div>
      )}

      {/* Footer */}
      <div className="text-[11px] text-muted-foreground/70 pt-2 border-t border-border/50 flex justify-between">
        <span>
          {filtered.length} parts shown {nightChart ? '(night formulas)' : '(day formulas)'}
        </span>
        <span>
          {filtered.filter(p => p.conjunctions.length > 0).length} conjunct natal planets
        </span>
      </div>
    </div>
  );
}
