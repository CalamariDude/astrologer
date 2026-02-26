/**
 * Inline Location Picker
 * Embedded map-based location selector using react-leaflet with Mapbox tiles
 * Shows map inline (not in a modal) for selecting relocated chart location
 * Features: expandable map, astrocartography lines with labels, planet toggles
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocationData } from '../types';
import { swissEphemeris } from '@/api/swissEphemeris';

// Astrocartography line types
interface AstroLine {
  planet: string;
  lineType: 'MC' | 'IC' | 'ASC' | 'DSC';
  points: { lat: number; lng: number }[];
  color: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Map styles
const MAP_STYLES = {
  dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
  streets: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
};

// Planet symbols for line labels
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609',
  Moon: '\u263D',
  Mercury: '\u263F',
  Venus: '\u2640',
  Mars: '\u2642',
  Jupiter: '\u2643',
  Saturn: '\u2644',
  Uranus: '\u2645',
  Neptune: '\u2646',
  Pluto: '\u2647',
  Chiron: '\u26B7',
  'North Node': '\u260A',
};

// All available planets (order matters for UI)
const ALL_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron', 'North Node'];

// Line type display names
const LINE_TYPE_NAMES: Record<string, string> = {
  MC: 'MC (Midheaven)',
  IC: 'IC (Nadir)',
  ASC: 'ASC (Rising)',
  DSC: 'DSC (Setting)',
};

// Fix for default marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom gold marker for selected location
const goldMarkerIcon = L.divIcon({
  className: 'custom-gold-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Blue marker for original birth location
const blueMarkerIcon = L.divIcon({
  className: 'custom-blue-marker',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      opacity: 0.7;
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Create a line label icon
function createLineLabelIcon(text: string, color: string): L.DivIcon {
  return L.divIcon({
    className: 'astro-line-label',
    html: `<div style="
      font-size: 11px;
      font-weight: bold;
      color: ${color};
      text-shadow: 0 0 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.9);
      white-space: nowrap;
      pointer-events: none;
      background: rgba(0,0,0,0.45);
      padding: 1px 5px;
      border-radius: 3px;
    ">${text}</div>`,
    iconSize: [70, 18],
    iconAnchor: [35, 9],
  });
}

interface InlineLocationPickerProps {
  onLocationChange: (location: LocationData | null) => void;
  originalLocation?: LocationData;
  currentLocation?: LocationData | null;
  birthDate?: string;
  birthTime?: string;
  personColor?: string; // Color accent for this person (e.g., blue for A, green for B)
}

// Component to handle map click events
function MapClickHandler({
  onLocationSelect
}: {
  onLocationSelect: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to center map on location and handle resize
function MapCenterController({ location, expanded, maximized }: { location: { lat: number; lng: number } | null; expanded: boolean; maximized: boolean }) {
  const map = useMap();

  // Invalidate size when map is first displayed, expanded, or maximized
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map, expanded, maximized]);

  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], map.getZoom());
    }
  }, [location, map]);

  return null;
}

// Reverse geocode using Mapbox API
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,region,country`
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return feature.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export const InlineLocationPicker: React.FC<InlineLocationPickerProps> = ({
  onLocationChange,
  originalLocation,
  currentLocation,
  birthDate,
  birthTime,
  personColor = '#3b82f6',
}) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'streets'>('dark');
  const [astroLines, setAstroLines] = useState<AstroLine[]>([]);
  const [astroLoading, setAstroLoading] = useState(false);
  const [showLines, setShowLines] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [selectedPlanets, setSelectedPlanets] = useState<Set<string>>(
    new Set(['Sun', 'Moon', 'Venus', 'Mars'])
  );
  const [selectedLineTypes, setSelectedLineTypes] = useState<Set<string>>(
    new Set(['MC', 'IC', 'ASC', 'DSC'])
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const mapHeight = maximized ? 'calc(100vh - 110px)' : expanded ? 600 : 280;

  // Close maximized on Escape key
  useEffect(() => {
    if (!maximized) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaximized(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [maximized]);

  // Fetch astrocartography lines (request all planets including outer/minor)
  useEffect(() => {
    if (!birthDate || !originalLocation) {
      return;
    }

    const fetchAstroLines = async () => {
      setAstroLoading(true);
      try {
        const data = await swissEphemeris.astrocartography({
          birth_date: birthDate,
          birth_time: birthTime || '12:00',
          lat: originalLocation.lat,
          lng: originalLocation.lng,
          planets: ALL_PLANETS,
        });

        if (data?.lines) {
          setAstroLines(data.lines);
        }
      } catch (err) {
        console.error('Failed to fetch astrocartography:', err);
      } finally {
        setAstroLoading(false);
      }
    };

    fetchAstroLines();
  }, [birthDate, birthTime, originalLocation]);

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    const name = await reverseGeocode(lat, lng);
    onLocationChange({ lat, lng, name });
    setIsGeocoding(false);
  }, [onLocationChange]);

  const handleReset = useCallback(() => {
    onLocationChange(null);
  }, [onLocationChange]);

  // Default center: current location, original birth location, or Beirut
  const mapCenter = currentLocation || originalLocation || { lat: 33.89, lng: 35.50 };

  // Filter visible lines
  const visibleLines = useMemo(() => {
    if (!showLines) return [];
    return astroLines.filter(
      line => selectedPlanets.has(line.planet) && selectedLineTypes.has(line.lineType)
    );
  }, [showLines, astroLines, selectedPlanets, selectedLineTypes]);

  // Generate label markers for visible lines (placed near the middle of each line)
  const lineLabels = useMemo(() => {
    if (!showLabels || !showLines) return [];
    return visibleLines.map(line => {
      // Pick a label point near the middle of the line
      const midIdx = Math.floor(line.points.length / 2);
      const point = line.points[midIdx];
      if (!point) return null;
      const symbol = PLANET_SYMBOLS[line.planet] || line.planet.slice(0, 2);
      const label = `${symbol} ${line.lineType}`;
      return {
        key: `label-${line.planet}-${line.lineType}`,
        position: [point.lat, point.lng] as [number, number],
        icon: createLineLabelIcon(label, line.color),
        tooltip: `${line.planet} ${LINE_TYPE_NAMES[line.lineType] || line.lineType}`,
      };
    }).filter(Boolean) as { key: string; position: [number, number]; icon: L.DivIcon; tooltip: string }[];
  }, [visibleLines, showLabels, showLines]);

  // Toggle a planet
  const togglePlanet = useCallback((planet: string) => {
    setSelectedPlanets(prev => {
      const next = new Set(prev);
      if (next.has(planet)) next.delete(planet);
      else next.add(planet);
      return next;
    });
  }, []);

  // Toggle a line type
  const toggleLineType = useCallback((lt: string) => {
    setSelectedLineTypes(prev => {
      const next = new Set(prev);
      if (next.has(lt)) next.delete(lt);
      else next.add(lt);
      return next;
    });
  }, []);

  // Get unique planets present in the data
  const availablePlanets = useMemo(() => {
    const planetSet = new Set(astroLines.map(l => l.planet));
    return ALL_PLANETS.filter(p => planetSet.has(p));
  }, [astroLines]);

  // Planet colors from data
  const planetColors = useMemo(() => {
    const colors: Record<string, string> = {};
    for (const line of astroLines) {
      if (!colors[line.planet]) colors[line.planet] = line.color;
    }
    return colors;
  }, [astroLines]);

  return (
    <div
      ref={containerRef}
      className={`rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 ${
        maximized ? 'fixed inset-0 z-[9999] rounded-none border-0 flex flex-col' : ''
      }`}
    >
      {/* Map Controls Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Map:</span>
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-2 py-1 text-xs rounded ${
              mapStyle === 'streets'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Streets
          </button>
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2 py-1 text-xs rounded ${
              mapStyle === 'dark'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Dark
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!maximized && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          )}
          <button
            onClick={() => setMaximized(!maximized)}
            className={`px-2 py-1 text-xs rounded ${
              maximized
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title={maximized ? 'Exit fullscreen (Esc)' : 'Fullscreen map'}
          >
            {maximized ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          {currentLocation && (
            <button
              onClick={handleReset}
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Astrocartography Controls */}
      {astroLines.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 space-y-1.5">
          {/* Top row: toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={showLines}
                onChange={(e) => setShowLines(e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-gray-600 dark:text-gray-300">Lines</span>
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-gray-600 dark:text-gray-300">Labels</span>
            </label>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            {/* Line type filters */}
            {(['MC', 'IC', 'ASC', 'DSC'] as const).map(lt => (
              <button
                key={lt}
                onClick={() => toggleLineType(lt)}
                className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                  selectedLineTypes.has(lt)
                    ? 'bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}
                title={LINE_TYPE_NAMES[lt]}
              >
                {lt}
              </button>
            ))}
            {astroLoading && (
              <span className="text-[10px] text-gray-400">Loading...</span>
            )}
          </div>
          {/* Planet toggles */}
          {showLines && (
            <div className="flex items-center gap-1 flex-wrap">
              {availablePlanets.map(planet => {
                const color = planetColors[planet] || '#888';
                const symbol = PLANET_SYMBOLS[planet] || planet.slice(0, 2);
                const isSelected = selectedPlanets.has(planet);
                return (
                  <button
                    key={planet}
                    onClick={() => togglePlanet(planet)}
                    className={`px-1.5 py-0.5 text-[10px] rounded border ${
                      isSelected
                        ? 'border-current'
                        : 'border-transparent bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}
                    style={isSelected ? { color, borderColor: color, backgroundColor: `${color}20` } : undefined}
                    title={planet}
                  >
                    {symbol} {planet.length <= 7 ? planet : planet.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div style={{ height: typeof mapHeight === 'number' ? `${mapHeight}px` : mapHeight, position: 'relative', transition: 'height 0.3s ease', flex: maximized ? 1 : undefined }}>
        <MapContainer
          key={`${mapCenter.lat}-${mapCenter.lng}-${mapStyle}`}
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={maximized ? 3 : expanded ? 3 : 4}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; Mapbox'
            url={MAP_STYLES[mapStyle]}
            tileSize={512}
            zoomOffset={-1}
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <MapCenterController location={currentLocation} expanded={expanded} maximized={maximized} />

          {/* Original birth location marker (blue) */}
          {originalLocation && (
            <Marker
              position={[originalLocation.lat, originalLocation.lng]}
              icon={blueMarkerIcon}
            />
          )}

          {/* Selected relocated location marker (gold) */}
          {currentLocation && (
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={goldMarkerIcon}
            />
          )}

          {/* Astrocartography lines - glow layer (wider, transparent) for visibility */}
          {visibleLines.map((line, index) => (
            <Polyline
              key={`glow-${line.planet}-${line.lineType}-${index}`}
              positions={line.points.map(p => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                color: line.color,
                weight: 8,
                opacity: 0.25,
                lineCap: 'round',
                dashArray: undefined,
              }}
              interactive={false}
            />
          ))}
          {/* Astrocartography lines - main layer */}
          {visibleLines.map((line, index) => (
            <Polyline
              key={`${line.planet}-${line.lineType}-${index}`}
              positions={line.points.map(p => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                color: line.color,
                weight: line.lineType === 'MC' || line.lineType === 'IC' ? 4 : 3,
                opacity: 0.9,
                dashArray: line.lineType === 'IC' || line.lineType === 'DSC' ? '8, 6' : undefined,
              }}
            >
              <Tooltip sticky>
                {PLANET_SYMBOLS[line.planet]} {line.planet} {LINE_TYPE_NAMES[line.lineType] || line.lineType}
              </Tooltip>
            </Polyline>
          ))}

          {/* Line labels (placed at midpoint of each line) */}
          {lineLabels.map(label => (
            <Marker
              key={label.key}
              position={label.position}
              icon={label.icon}
              interactive={false}
            />
          ))}
        </MapContainer>

        {/* Geocoding indicator */}
        {isGeocoding && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded text-xs z-[1000]">
            Looking up location...
          </div>
        )}
      </div>

      {/* Selected Location Info */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {currentLocation ? (
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {currentLocation.name}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            Click on the map to select a relocated location
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineLocationPicker;
