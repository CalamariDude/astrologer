/**
 * Sabian Symbols Panel — displays the Sabian Symbol for each planet and angle
 * in a natal chart, with search/filter and custom degree lookup.
 */

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { SABIAN_SYMBOLS, type SabianSymbol } from '../../data/sabianSymbols';
import { ToolGuide } from './ToolGuide';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean }>;
    houses?: { cusps?: number[]; ascendant?: number; mc?: number };
  };
  name?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

const SIGN_GLYPHS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '\u2609\uFE0E', Moon: '\u263D\uFE0E', Mercury: '\u263F\uFE0E', Venus: '\u2640\uFE0E',
  Mars: '\u2642\uFE0E', Jupiter: '\u2643\uFE0E', Saturn: '\u2644\uFE0E', Uranus: '\u26E2\uFE0E',
  Neptune: '\u2646\uFE0E', Pluto: '\u2647\uFE0E',
  NorthNode: '\u260A\uFE0E', SouthNode: '\u260B\uFE0E',
  Chiron: '\u26B7\uFE0E',
};

const ELEMENT_COLORS: Record<string, string> = {
  Aries: 'text-red-400', Taurus: 'text-emerald-400', Gemini: 'text-yellow-400', Cancer: 'text-blue-400',
  Leo: 'text-red-400', Virgo: 'text-emerald-400', Libra: 'text-yellow-400', Scorpio: 'text-blue-400',
  Sagittarius: 'text-red-400', Capricorn: 'text-emerald-400', Aquarius: 'text-yellow-400', Pisces: 'text-blue-400',
};

const ELEMENT_BG: Record<string, string> = {
  Aries: 'bg-red-500/10', Taurus: 'bg-emerald-500/10', Gemini: 'bg-yellow-500/10', Cancer: 'bg-blue-500/10',
  Leo: 'bg-red-500/10', Virgo: 'bg-emerald-500/10', Libra: 'bg-yellow-500/10', Scorpio: 'bg-blue-500/10',
  Sagittarius: 'bg-red-500/10', Capricorn: 'bg-emerald-500/10', Aquarius: 'bg-yellow-500/10', Pisces: 'bg-blue-500/10',
};

const ELEMENT_BORDER: Record<string, string> = {
  Aries: 'border-red-500/20', Taurus: 'border-emerald-500/20', Gemini: 'border-yellow-500/20', Cancer: 'border-blue-500/20',
  Leo: 'border-red-500/20', Virgo: 'border-emerald-500/20', Libra: 'border-yellow-500/20', Scorpio: 'border-blue-500/20',
  Sagittarius: 'border-red-500/20', Capricorn: 'border-emerald-500/20', Aquarius: 'border-yellow-500/20', Pisces: 'border-blue-500/20',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Get the Sabian Symbol for an absolute longitude (0-360). Rounds up per Sabian convention. */
function sabianForLongitude(longitude: number): SabianSymbol {
  const norm = ((longitude % 360) + 360) % 360;
  const idx = Math.floor(norm); // index 0 = Aries 1 (0.00-0.99)
  return SABIAN_SYMBOLS[idx];
}

/** Format longitude as degree + sign string, e.g. "16 Aries" */
function formatDegree(longitude: number): { degree: number; sign: string; minutes: number } {
  const norm = ((longitude % 360) + 360) % 360;
  const signIdx = Math.floor(norm / 30);
  const degInSign = norm - signIdx * 30;
  // Sabian degree = ceil of position in sign (1-30)
  const sabianDeg = Math.floor(degInSign) + 1; // e.g., 15.22 -> 16
  const minutes = Math.round((degInSign % 1) * 60);
  return {
    degree: sabianDeg > 30 ? 30 : sabianDeg,
    sign: ZODIAC_SIGNS[signIdx],
    minutes,
  };
}

/* ------------------------------------------------------------------ */
/*  Row data builder                                                   */
/* ------------------------------------------------------------------ */

interface RowData {
  key: string;
  label: string;
  glyph: string;
  longitude: number;
  sign: string;
  degreeInSign: number;
  minutes: number;
  retrograde?: boolean;
  sabian: SabianSymbol;
  isAngle?: boolean;
}

function buildRows(props: Props): RowData[] {
  const rows: RowData[] = [];

  // Planets
  const planetOrder = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'NorthNode', 'Chiron'];

  for (const name of planetOrder) {
    const p = props.natalChart.planets[name];
    if (!p) continue;
    const fmt = formatDegree(p.longitude);
    rows.push({
      key: name,
      label: name === 'NorthNode' ? 'North Node' : name,
      glyph: PLANET_GLYPHS[name] || '',
      longitude: p.longitude,
      sign: fmt.sign,
      degreeInSign: fmt.degree,
      minutes: fmt.minutes,
      retrograde: p.retrograde,
      sabian: sabianForLongitude(p.longitude),
    });
  }

  // Also include any other planets not in the standard order
  for (const [name, p] of Object.entries(props.natalChart.planets)) {
    if (planetOrder.includes(name)) continue;
    const fmt = formatDegree(p.longitude);
    rows.push({
      key: name,
      label: name,
      glyph: PLANET_GLYPHS[name] || '',
      longitude: p.longitude,
      sign: fmt.sign,
      degreeInSign: fmt.degree,
      minutes: fmt.minutes,
      retrograde: p.retrograde,
      sabian: sabianForLongitude(p.longitude),
    });
  }

  // Angles: ASC and MC
  const houses = props.natalChart.houses;
  if (houses?.ascendant != null) {
    const fmt = formatDegree(houses.ascendant);
    rows.push({
      key: 'ASC',
      label: 'Ascendant',
      glyph: 'ASC',
      longitude: houses.ascendant,
      sign: fmt.sign,
      degreeInSign: fmt.degree,
      minutes: fmt.minutes,
      sabian: sabianForLongitude(houses.ascendant),
      isAngle: true,
    });
  }
  if (houses?.mc != null) {
    const fmt = formatDegree(houses.mc);
    rows.push({
      key: 'MC',
      label: 'Midheaven',
      glyph: 'MC',
      longitude: houses.mc,
      sign: fmt.sign,
      degreeInSign: fmt.degree,
      minutes: fmt.minutes,
      sabian: sabianForLongitude(houses.mc),
      isAngle: true,
    });
  }

  return rows;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function RandomSymbolButton() {
  const [symbol, setSymbol] = React.useState<SabianSymbol | null>(null);
  const [signInfo, setSignInfo] = React.useState<{ sign: string; degree: number } | null>(null);

  const pickRandom = () => {
    const idx = Math.floor(Math.random() * 360);
    const s = SABIAN_SYMBOLS[idx];
    setSymbol(s);
    setSignInfo({ sign: s.sign, degree: s.degree });
  };

  return (
    <div className="space-y-2">
      <button
        onClick={pickRandom}
        className="w-full py-2 px-3 text-xs font-medium rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
      >
        ✦ Draw a Random Symbol
      </button>
      {symbol && signInfo && (
        <div className={`rounded-lg p-3 ${ELEMENT_BG[signInfo.sign] || 'bg-muted/30'} border ${ELEMENT_BORDER[signInfo.sign] || 'border-border/30'}`}>
          <div className={`text-sm font-medium ${ELEMENT_COLORS[signInfo.sign] || 'text-muted-foreground'}`}
            style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>
            {SIGN_GLYPHS[signInfo.sign]} {signInfo.degree}° {signInfo.sign}
          </div>
          <p className="text-sm italic text-foreground/85 mt-2 leading-relaxed">
            "{symbol.symbol}"
          </p>
          <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider mt-2 ${ELEMENT_COLORS[signInfo.sign] || 'text-muted-foreground'} opacity-70`}>
            {symbol.keyword}
          </span>
        </div>
      )}
    </div>
  );
}

export function SabianSymbolsPanel(props: Props) {
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [customDeg, setCustomDeg] = useState<string>('');

  const rows = useMemo(() => buildRows(props), [props.natalChart]);

  const hasData = Object.keys(props.natalChart.planets).length > 0;

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.sabian.symbol.toLowerCase().includes(q) ||
      r.sabian.keyword.toLowerCase().includes(q) ||
      r.label.toLowerCase().includes(q) ||
      r.sign.toLowerCase().includes(q)
    );
  }, [rows, search]);

  // Custom degree lookup
  const customResult = useMemo(() => {
    const val = parseFloat(customDeg);
    if (isNaN(val) || val < 0 || val > 360) return null;
    const sabian = sabianForLongitude(val);
    const fmt = formatDegree(val);
    return { sabian, ...fmt };
  }, [customDeg]);

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="text-base">&#x2726;</span>
          Sabian Symbols
          {props.name && <span className="text-muted-foreground font-normal">for {props.name}</span>}
        </h3>
        <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
          Each of the 360 degrees of the zodiac carries a symbolic image channeled by Marc Edmund Jones
          and Elsie Wheeler (1925), refined by Dane Rudhyar. The Sabian degree is the next whole degree
          above the planet's exact position.
        </p>
      </div>

      <ToolGuide
        title="Sabian Symbols"
        description="Each of the 360 degrees of the zodiac has a unique symbolic image channeled by Marc Edmund Jones and Elsie Wheeler in 1925. The Sabian Symbol for each planet's degree adds a poetic, intuitive layer of meaning to your chart placements."
        tips={[
          "Look at the Sabian Symbol for your Sun degree — it reveals a core life image or motif",
          "The Ascendant degree symbol often describes how others perceive you or your life's entrance",
          "Midheaven degree symbol relates to your career calling or public identity",
          "Don't interpret too literally — Sabian Symbols work through metaphor and feeling",
          "Use the custom degree lookup to explore any specific degree of interest",
          "When transiting planets hit a symbolically potent degree, that image 'activates'",
        ]}
      />

      {!hasData ? (
        <div className="text-xs text-muted-foreground/70 text-center py-8 rounded-lg border border-border/30 bg-muted/10">
          Enter a birth date to use this tool
        </div>
      ) : (<>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbols by keyword..."
          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Planet / Angle table */}
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {filteredRows.map(row => {
          const isExpanded = expandedKey === row.key;
          const signGlyph = SIGN_GLYPHS[row.sign] || '';
          const colorClass = ELEMENT_COLORS[row.sign] || 'text-muted-foreground';
          const bgClass = ELEMENT_BG[row.sign] || 'bg-muted/30';
          const borderClass = ELEMENT_BORDER[row.sign] || 'border-border/50';

          return (
            <button
              key={row.key}
              onClick={() => setExpandedKey(isExpanded ? null : row.key)}
              className={`w-full text-left rounded-lg border transition-all ${borderClass} ${isExpanded ? bgClass : 'hover:bg-muted/30'}`}
            >
              {/* Compact row */}
              <div className="flex items-start gap-3 px-3 py-2.5">
                {/* Planet glyph */}
                <div className={`text-base leading-none mt-0.5 shrink-0 w-6 text-center ${row.isAngle ? 'text-amber-400 text-[11px] font-bold' : colorClass}`}
                  style={!row.isAngle ? { fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" } : undefined}>
                  {row.glyph}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{row.label}</span>
                    {row.retrograde && (
                      <span className="text-[11px] text-red-400/70 font-medium">Rx</span>
                    )}
                    <span className={`text-xs ${colorClass}`}>
                      {signGlyph} {row.degreeInSign}°{row.minutes.toString().padStart(2, '0')}' {row.sign}
                    </span>
                  </div>

                  {/* Sabian symbol text */}
                  <p className="text-[11px] italic text-foreground/80 mt-0.5 leading-snug">
                    "{row.sabian.symbol}"
                  </p>

                  {/* Keyword */}
                  <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider mt-1 ${colorClass} opacity-70`}>
                    {row.sabian.keyword}
                  </span>
                </div>

                {/* Expand icon */}
                <div className="shrink-0 mt-1 text-muted-foreground/60">
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className={`px-3 pb-3 pt-1 border-t ${borderClass}`}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div>
                      <span className="text-muted-foreground/70">Absolute longitude:</span>{' '}
                      {row.longitude.toFixed(4)}°
                    </div>
                    <div>
                      <span className="text-muted-foreground/70">Sabian degree:</span>{' '}
                      {row.sabian.degree} of {row.sabian.sign}
                    </div>
                    <div>
                      <span className="text-muted-foreground/70">Sign element:</span>{' '}
                      {getElement(row.sign)}
                    </div>
                    <div>
                      <span className="text-muted-foreground/70">Sign modality:</span>{' '}
                      {getModality(row.sign)}
                    </div>
                  </div>

                  {/* Neighboring degrees */}
                  <div className="mt-2 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Neighboring degrees</span>
                    {[-1, 1].map(offset => {
                      const idx = Math.floor(((row.longitude % 360) + 360) % 360) + offset;
                      if (idx < 0 || idx >= 360) return null;
                      const neighbor = SABIAN_SYMBOLS[idx];
                      return (
                        <div key={offset} className="text-xs text-muted-foreground/60 italic">
                          {neighbor.degree}° {neighbor.sign}: "{neighbor.symbol}"
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {filteredRows.length === 0 && (
          <div className="text-center text-xs text-muted-foreground/60 py-6">
            No symbols match "{search}"
          </div>
        )}
      </div>

      {/* Custom degree lookup */}
      <div className="border border-border/50 rounded-lg p-3 space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
          Custom Degree Lookup
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={360}
            step={0.01}
            value={customDeg}
            onChange={(e) => setCustomDeg(e.target.value)}
            placeholder="0 - 360"
            className="w-28 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-xs text-muted-foreground/60">absolute longitude</span>
        </div>
        {customResult && (
          <div className={`rounded-md p-2.5 ${ELEMENT_BG[customResult.sign] || 'bg-muted/30'}`}>
            <div className={`text-xs ${ELEMENT_COLORS[customResult.sign] || 'text-muted-foreground'}`}
              style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" }}>
              {SIGN_GLYPHS[customResult.sign]} {customResult.degree}° {customResult.sign}
            </div>
            <p className="text-[11px] italic text-foreground/80 mt-1 leading-snug">
              "{customResult.sabian.symbol}"
            </p>
            <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider mt-1 ${ELEMENT_COLORS[customResult.sign] || 'text-muted-foreground'} opacity-70`}>
              {customResult.sabian.keyword}
            </span>
          </div>
        )}
      </div>

      {/* Random Symbol */}
      <div className="border border-border/50 rounded-lg p-3 space-y-2">
        <RandomSymbolButton />
      </div>

      </>)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny helpers                                                       */
/* ------------------------------------------------------------------ */

function getElement(sign: string): string {
  const map: Record<string, string> = {
    Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
    Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
    Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
  };
  return map[sign] || '';
}

function getModality(sign: string): string {
  const map: Record<string, string> = {
    Aries: 'Cardinal', Taurus: 'Fixed', Gemini: 'Mutable', Cancer: 'Cardinal',
    Leo: 'Fixed', Virgo: 'Mutable', Libra: 'Cardinal', Scorpio: 'Fixed',
    Sagittarius: 'Mutable', Capricorn: 'Cardinal', Aquarius: 'Fixed', Pisces: 'Mutable',
  };
  return map[sign] || '';
}
