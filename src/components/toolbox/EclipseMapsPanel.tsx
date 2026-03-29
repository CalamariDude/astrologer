/**
 * Eclipse Maps Panel
 * Displays eclipse visibility paths on a Leaflet world map with Mapbox dark tiles.
 * Shows solar eclipses 2024-2028 with paths and natal chart correlations.
 */

import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ToolGuide } from './ToolGuide';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;

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

interface SolarEclipse {
  id: string;
  date: string;
  type: 'Total' | 'Annular' | 'Partial';
  degree: number;
  sign: string;
  longitude: number; // ecliptic longitude
  path: [number, number][]; // [lat, lng] waypoints for visibility path
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const TYPE_COLORS: Record<string, string> = {
  Total: '#ef4444',
  Annular: '#f97316',
  Partial: '#9ca3af',
};

const TYPE_LABELS: Record<string, string> = {
  Total: 'Total Solar',
  Annular: 'Annular Solar',
  Partial: 'Partial Solar',
};

/* ------------------------------------------------------------------ */
/*  Eclipse data 2024-2028 (solar only, with approximate paths)        */
/* ------------------------------------------------------------------ */

const ECLIPSES: SolarEclipse[] = [
  {
    id: 'se-2024-04-08', date: '2024-04-08', type: 'Total',
    degree: 19, sign: 'Aries', longitude: 19,
    path: [[18,-105],[22,-100],[27,-97],[32,-92],[35,-85],[38,-80],[42,-75],[45,-70],[47,-65],[48,-60]],
  },
  {
    id: 'se-2024-10-02', date: '2024-10-02', type: 'Annular',
    degree: 10, sign: 'Libra', longitude: 190,
    path: [[-8,-82],[-10,-78],[-15,-72],[-20,-65],[-25,-58],[-30,-52],[-35,-48],[-40,-42],[-42,-38]],
  },
  {
    id: 'se-2025-03-29', date: '2025-03-29', type: 'Partial',
    degree: 9, sign: 'Aries', longitude: 9,
    path: [[55,-30],[58,-15],[60,0],[62,10],[63,20],[60,30],[55,35]],
  },
  {
    id: 'se-2025-09-21', date: '2025-09-21', type: 'Partial',
    degree: 29, sign: 'Virgo', longitude: 179,
    path: [[-30,170],[-40,175],[-50,180],[-60,185],[-65,190],[-70,195]],
  },
  {
    id: 'se-2026-02-17', date: '2026-02-17', type: 'Annular',
    degree: 28, sign: 'Aquarius', longitude: 328,
    path: [[-62,-60],[-65,-40],[-68,-20],[-70,0],[-68,20],[-65,40],[-62,60]],
  },
  {
    id: 'se-2026-08-12', date: '2026-08-12', type: 'Total',
    degree: 19, sign: 'Leo', longitude: 139,
    path: [[70,-60],[72,-30],[73,0],[70,10],[65,5],[60,0],[55,-5],[50,-8],[45,-10],[42,-8],[40,-5]],
  },
  {
    id: 'se-2027-02-06', date: '2027-02-06', type: 'Annular',
    degree: 17, sign: 'Aquarius', longitude: 317,
    path: [[-10,-80],[-15,-60],[-20,-40],[-18,-20],[-10,0],[-5,10],[0,20],[5,30],[8,35]],
  },
  {
    id: 'se-2027-08-02', date: '2027-08-02', type: 'Total',
    degree: 10, sign: 'Leo', longitude: 130,
    path: [[25,-15],[28,-10],[30,-5],[32,0],[33,5],[34,10],[35,20],[36,30],[37,40],[38,50],[40,60]],
  },
  {
    id: 'se-2028-01-26', date: '2028-01-26', type: 'Annular',
    degree: 6, sign: 'Aquarius', longitude: 306,
    path: [[15,-120],[10,-110],[5,-100],[0,-90],[-5,-80],[-10,-70],[-15,-60],[-18,-50]],
  },
  {
    id: 'se-2028-07-22', date: '2028-07-22', type: 'Total',
    degree: 29, sign: 'Cancer', longitude: 119,
    path: [[-20,115],[-25,125],[-30,135],[-33,140],[-35,148],[-38,155],[-40,162],[-42,170],[-43,175]],
  },
];

/* ------------------------------------------------------------------ */
/*  House calculation                                                  */
/* ------------------------------------------------------------------ */

function normalizeLong(l: number): number {
  return ((l % 360) + 360) % 360;
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDegree(degree: number, sign: string): string {
  return `${degree}\u00B0 ${sign} ${SIGN_SYMBOLS[sign] || ''}`;
}

/* ------------------------------------------------------------------ */
/*  Map legend overlay component                                       */
/* ------------------------------------------------------------------ */

function MapLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        zIndex: 1000,
        background: 'rgba(10, 22, 40, 0.9)',
        border: '1px solid #1e3050',
        borderRadius: 6,
        padding: '8px 10px',
        pointerEvents: 'none',
      }}
    >
      {(['Total', 'Annular', 'Partial'] as const).map(type => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: type === 'Partial' ? 0 : 4 }}>
          <div style={{ width: 16, height: 3, borderRadius: 2, backgroundColor: TYPE_COLORS[type] }} />
          <span style={{ fontSize: 11, color: '#aaa' }}>{type}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fit bounds helper component                                        */
/* ------------------------------------------------------------------ */

function FitToEclipse({ path }: { path: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (path.length > 0) {
      const bounds = L.latLngBounds(path.map(([lat, lng]) => [lat, lng] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 5 });
    }
  }, [path, map]);
  return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EclipseMapsPanel({ natalChart, name }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'All' | 'Total' | 'Annular' | 'Partial'>('All');

  const filteredEclipses = useMemo(() => {
    if (filterType === 'All') return ECLIPSES;
    return ECLIPSES.filter(e => e.type === filterType);
  }, [filterType]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return ECLIPSES.find(e => e.id === selectedId) || null;
  }, [selectedId]);

  const selectedHouse = useMemo(() => {
    if (!selected) return null;
    return findHouse(selected.longitude, natalChart.houses?.cusps ?? undefined);
  }, [selected, natalChart]);

  // Find close natal planets for selected eclipse
  const natalAspects = useMemo(() => {
    if (!selected) return [];
    const aspects: { planet: string; aspect: string; orb: number }[] = [];
    const ASPECT_DEFS = [
      { name: 'conjunction', angle: 0, orb: 5 },
      { name: 'opposition', angle: 180, orb: 5 },
      { name: 'square', angle: 90, orb: 4 },
      { name: 'trine', angle: 120, orb: 4 },
    ];
    for (const [key, planet] of Object.entries(natalChart.planets)) {
      for (const asp of ASPECT_DEFS) {
        const diff = Math.abs(normalizeLong(selected.longitude) - normalizeLong(planet.longitude));
        const d = diff > 180 ? 360 - diff : diff;
        const orb = Math.abs(d - asp.angle);
        if (orb <= asp.orb) {
          const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          aspects.push({ planet: label, aspect: asp.name, orb: Math.round(orb * 10) / 10 });
        }
      }
    }
    return aspects;
  }, [selected, natalChart]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
        <h3 className="text-sm font-semibold mb-1">
          Eclipse Maps {name ? `- ${name}` : ''}
        </h3>
        <p className="text-xs text-muted-foreground">
          Solar eclipse paths 2024-2028 on a world map. Click an eclipse to see its path and natal impact.
        </p>
      </div>

      <ToolGuide
        title="Eclipse Maps"
        description="Visualizes upcoming eclipse positions on the zodiac wheel, showing their relationships to your natal chart. Eclipse maps help you see at a glance which areas of your chart (signs, houses) are being activated by the eclipse cycle."
        tips={[
          "Eclipses near your natal planets (within 3-5\u00B0) signal major changes in those planet's themes",
          "The eclipse axis (the sign pair) activates two opposing houses in your chart simultaneously",
          "Use the timeline to look ahead and prepare for upcoming eclipse activations",
          "Eclipse series repeat in the same sign pair for about 1.5-2 years before shifting",
          "Pay special attention to eclipses that conjunct your Ascendant or Midheaven",
        ]}
      />

      {/* Filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-muted-foreground">Filter:</span>
        {(['All','Total','Annular','Partial'] as const).map(t => (
          <button key={t}
            onClick={() => setFilterType(t)}
            className={`text-xs px-2 py-0.5 rounded border transition-colors ${filterType === t
              ? 'bg-muted/40 border-border text-foreground'
              : 'border-border/50 text-muted-foreground hover:bg-muted/20'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Leaflet Map */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-3 overflow-hidden" style={{ position: 'relative' }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={8}
          scrollWheelZoom={true}
          maxBounds={[[-85, -200], [85, 200]]}
          maxBoundsViscosity={1.0}
          style={{ height: 400, width: '100%', borderRadius: 8, background: '#0a1628' }}
        >
          <TileLayer
            url={TILE_URL}
            attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
            tileSize={512}
            zoomOffset={-1}
          />

          {/* Eclipse path polylines */}
          {filteredEclipses.map(e => {
            const isSelected = e.id === selectedId;
            const color = TYPE_COLORS[e.type];
            const positions = e.path as L.LatLngExpression[];

            return (
              <Polyline
                key={e.id}
                positions={positions}
                pathOptions={{
                  color,
                  weight: isSelected ? 5 : 2,
                  opacity: isSelected ? 1 : (selectedId ? 0.3 : 0.7),
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{
                  click: () => setSelectedId(e.id === selectedId ? null : e.id),
                }}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -8]}
                  className="eclipse-year-tooltip"
                >
                  <span style={{
                    color,
                    fontSize: isSelected ? 12 : 10,
                    fontWeight: isSelected ? 700 : 400,
                    opacity: isSelected ? 1 : (selectedId ? 0.3 : 0.7),
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  }}>
                    {e.date.slice(0, 4)}
                  </span>
                </Tooltip>
              </Polyline>
            );
          })}

          {/* Fit map to selected eclipse path */}
          {selected && <FitToEclipse path={selected.path} />}
        </MapContainer>

        {/* Legend overlay */}
        <MapLegend />

        {/* Tooltip style override */}
        <style>{`
          .eclipse-year-tooltip {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .eclipse-year-tooltip::before {
            display: none !important;
          }
          .leaflet-container {
            font-family: inherit;
          }
        `}</style>
      </div>

      {/* Eclipse list + detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* List */}
        <div className="rounded-lg border border-border/50 bg-card/50 p-3 max-h-[300px] overflow-y-auto">
          <h4 className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-2">Eclipses ({filteredEclipses.length})</h4>
          <div className="space-y-1">
            {filteredEclipses.map(e => {
              const isActive = e.id === selectedId;
              const house = findHouse(e.longitude, natalChart.houses?.cusps ?? undefined);
              return (
                <button key={e.id}
                  onClick={() => setSelectedId(e.id === selectedId ? null : e.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                    isActive ? 'bg-primary/15 border border-primary/30' : 'hover:bg-muted/50 border border-transparent'}`}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: TYPE_COLORS[e.type] }} />
                  <span className="font-medium">{formatDate(e.date)}</span>
                  <span className="text-muted-foreground">{e.type}</span>
                  <span className="ml-auto text-muted-foreground font-mono tabular-nums">
                    {formatDegree(e.degree, e.sign)}
                    {house ? ` H${house}` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="rounded-lg border border-border/50 bg-card/50 p-3">
          {selected ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold">
                {TYPE_LABELS[selected.type]} Eclipse
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(selected.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span style={{ color: TYPE_COLORS[selected.type] }}>{selected.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position</span>
                  <span>{formatDegree(selected.degree, selected.sign)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ecliptic Longitude</span>
                  <span>{selected.longitude.toFixed(1)}\u00B0</span>
                </div>
                {selectedHouse && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Natal House</span>
                    <span className="font-semibold">House {selectedHouse}</span>
                  </div>
                )}
              </div>

              {/* Natal aspects */}
              {natalAspects.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-xs font-semibold text-muted-foreground mb-1">Natal Aspects</h5>
                  <div className="space-y-0.5">
                    {natalAspects.map((a, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{a.planet}</span>
                        <span className="text-muted-foreground">{a.aspect} ({a.orb}\u00B0)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interpretation hint */}
              <div className="mt-2 p-2 bg-muted/30 rounded text-[11px] text-muted-foreground">
                {selected.type === 'Total'
                  ? 'Total solar eclipses mark powerful turning points. Events near this degree may trigger significant changes in the natal house area.'
                  : selected.type === 'Annular'
                  ? 'Annular eclipses bring themes of release and adjustment. Watch for developments in the natal house where this falls.'
                  : 'Partial eclipses have a subtler influence, nudging awareness around the natal house themes.'}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground py-8">
              Click an eclipse to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
