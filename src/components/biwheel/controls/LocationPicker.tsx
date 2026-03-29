/**
 * Location Picker Modal
 * Map-based location selector using react-leaflet with Mapbox tiles
 * Used for selecting a new location for relocated chart calculation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocationData } from '../types';
import { COLORS } from '../utils/constants';
import { swissEphemeris } from '@/api/swissEphemeris';

// Astrocartography line types
interface AstroLine {
  planet: string;
  lineType: 'MC' | 'IC' | 'ASC' | 'DSC';
  points: { lat: number; lng: number }[];
  color: string;
}

interface AstrocartographyData {
  lines: AstroLine[];
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Map styles
const MAP_STYLES = {
  dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
  streets: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
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

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: LocationData) => void;
  originalLocation?: LocationData;
  currentLocation?: LocationData;
  // For astrocartography lines
  birthDate?: string;
  birthTime?: string;
  showAstroLines?: boolean;
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
function MapCenterController({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap();

  // Invalidate size when map is first displayed (fixes modal rendering issue)
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

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
      // Get the most specific place name
      const feature = data.features[0];
      return feature.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onConfirm,
  originalLocation,
  currentLocation,
  birthDate,
  birthTime,
  showAstroLines = true,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    currentLocation || null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'streets'>('streets');
  const [astroLines, setAstroLines] = useState<AstroLine[]>([]);
  const [astroLoading, setAstroLoading] = useState(false);
  const [showLines, setShowLines] = useState(true);
  const [selectedPlanets, setSelectedPlanets] = useState<Set<string>>(
    new Set(['Sun', 'Moon', 'Venus', 'Mars'])
  );
  const [expanded, setExpanded] = useState(false);

  // Reset selected location when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(currentLocation || null);
    }
  }, [isOpen, currentLocation]);

  // Fetch astrocartography lines when modal opens
  useEffect(() => {
    if (!isOpen || !showAstroLines || !birthDate || !originalLocation) {
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
  }, [isOpen, showAstroLines, birthDate, birthTime, originalLocation]);

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    const name = await reverseGeocode(lat, lng);
    setSelectedLocation({ lat, lng, name });
    setIsGeocoding(false);
  }, []);

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm(selectedLocation);
      onClose();
    }
  };

  const handleReset = () => {
    setSelectedLocation(null);
  };

  if (!isOpen) return null;

  // Default center: original birth location, or Beirut
  const defaultCenter = originalLocation
    ? { lat: originalLocation.lat, lng: originalLocation.lng }
    : { lat: 33.89, lng: 35.50 };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: expanded ? '98%' : '90%',
          maxWidth: expanded ? '100%' : 700,
          maxHeight: expanded ? '98vh' : '90vh',
          height: expanded ? '98vh' : undefined,
          background: COLORS.background,
          borderRadius: expanded ? 8 : 12,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden auto',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${COLORS.gridLineFaint}33`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: COLORS.textPrimary }}>
                Astrocartography
              </h2>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>Beta</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted }}>
              Click on the map to select a location &mdash; see where your planetary lines cross
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                background: 'none',
                border: `1px solid ${COLORS.gridLineFaint}44`,
                borderRadius: 4,
                fontSize: 11,
                color: COLORS.textSecondary,
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: 1,
              }}
              title={expanded ? 'Collapse map' : 'Expand map'}
            >
              {expanded ? '⇲ Collapse' : '⇱ Expand'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                color: COLORS.gridLineFaint,
                cursor: 'pointer',
                padding: 4,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Map Style Toggle */}
        <div
          style={{
            padding: '8px 20px',
            borderBottom: `1px solid ${COLORS.gridLineFaint}33`,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Map Style:</span>
          <button
            onClick={() => setMapStyle('streets')}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              background: mapStyle === 'streets' ? '#3b82f6' : COLORS.backgroundAlt2,
              color: mapStyle === 'streets' ? '#fff' : COLORS.textSecondary,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Streets
          </button>
          <button
            onClick={() => setMapStyle('dark')}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              background: mapStyle === 'dark' ? '#3b82f6' : COLORS.backgroundAlt2,
              color: mapStyle === 'dark' ? '#fff' : COLORS.textSecondary,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Dark
          </button>
          {originalLocation && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: COLORS.textMuted }}>
              Birth: {originalLocation.name}
            </span>
          )}
        </div>

        {/* Astrocartography Controls */}
        {showAstroLines && astroLines.length > 0 && (
          <div
            style={{
              padding: '8px 20px',
              borderBottom: `1px solid ${COLORS.gridLineFaint}33`,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.textSecondary }}>
              <input
                type="checkbox"
                checked={showLines}
                onChange={(e) => setShowLines(e.target.checked)}
              />
              Show Lines
            </label>
            {showLines && (
              <>
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>|</span>
                {['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].map(planet => (
                  <button
                    key={planet}
                    onClick={() => {
                      const next = new Set(selectedPlanets);
                      if (next.has(planet)) {
                        next.delete(planet);
                      } else {
                        next.add(planet);
                      }
                      setSelectedPlanets(next);
                    }}
                    style={{
                      padding: '2px 8px',
                      fontSize: 10,
                      background: selectedPlanets.has(planet) ? '#3b82f6' : COLORS.backgroundAlt2,
                      color: selectedPlanets.has(planet) ? '#fff' : COLORS.textSecondary,
                      border: 'none',
                      borderRadius: 3,
                      cursor: 'pointer',
                    }}
                  >
                    {planet}
                  </button>
                ))}
              </>
            )}
            {astroLoading && (
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>Loading lines...</span>
            )}
          </div>
        )}

        {/* Map Container */}
        <div style={{ height: expanded ? undefined : 'clamp(250px, 45vh, 400px)', flex: expanded ? 1 : undefined, minHeight: '250px', position: 'relative', flexShrink: 0 }}>
          <MapContainer
            key={`${defaultCenter.lat}-${defaultCenter.lng}-${mapStyle}`}
            center={[defaultCenter.lat, defaultCenter.lng]}
            zoom={5}
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
            <MapCenterController location={selectedLocation} />

            {/* Original birth location marker (blue) */}
            {originalLocation && (
              <Marker
                position={[originalLocation.lat, originalLocation.lng]}
                icon={blueMarkerIcon}
              />
            )}

            {/* Selected relocated location marker (gold) */}
            {selectedLocation && (
              <Marker
                position={[selectedLocation.lat, selectedLocation.lng]}
                icon={goldMarkerIcon}
              />
            )}

            {/* Astrocartography lines - glow layer for visibility */}
            {showLines && astroLines
              .filter(line => selectedPlanets.has(line.planet))
              .map((line, index) => (
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
            {showLines && astroLines
              .filter(line => selectedPlanets.has(line.planet))
              .map((line, index) => (
                <Polyline
                  key={`${line.planet}-${line.lineType}-${index}`}
                  positions={line.points.map(p => [p.lat, p.lng] as [number, number])}
                  pathOptions={{
                    color: line.color,
                    weight: line.lineType === 'MC' || line.lineType === 'IC' ? 4 : 3,
                    opacity: 0.9,
                    dashArray: line.lineType === 'IC' || line.lineType === 'DSC' ? '8, 6' : undefined,
                  }}
                />
              ))}
          </MapContainer>

          {/* Legend overlay */}
          {showLines && astroLines.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                background: 'rgba(0,0,0,0.75)',
                borderRadius: 6,
                padding: '6px 10px',
                zIndex: 1000,
                fontSize: 10,
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 2, background: '#fff' }} />
                <span>MC (Culmination)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 2, background: '#fff', borderTop: '2px dashed #fff', height: 0 }} />
                <span>IC (Nadir)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
                <span>ASC (Rising)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 0, borderTop: '2px dashed #fff' }} />
                <span>DSC (Setting)</span>
              </div>
            </div>
          )}

          {/* Geocoding indicator */}
          {isGeocoding && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                zIndex: 1000,
              }}
            >
              Looking up location...
            </div>
          )}
        </div>

        {/* Selected Location Info */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${COLORS.gridLineFaint}33`,
            background: COLORS.backgroundAlt,
          }}
        >
          {selectedLocation ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>
                  {selectedLocation.name}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {selectedLocation.lat.toFixed(4)}°, {selectedLocation.lng.toFixed(4)}°
                </div>
              </div>
              <button
                onClick={handleReset}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  background: COLORS.backgroundAlt2,
                  border: `1px solid ${COLORS.gridLineFaint}44`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  color: COLORS.textSecondary,
                }}
              >
                Clear
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: COLORS.gridLineFaint, fontSize: 13 }}>
              Click on the map to select a location
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${COLORS.gridLineFaint}33`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              background: COLORS.backgroundAlt2,
              border: `1px solid ${COLORS.gridLineFaint}44`,
              borderRadius: 6,
              cursor: 'pointer',
              color: COLORS.textSecondary,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              background: selectedLocation ? '#FFD700' : COLORS.backgroundAlt2,
              border: 'none',
              borderRadius: 6,
              cursor: selectedLocation ? 'pointer' : 'not-allowed',
              color: selectedLocation ? '#1a1a1a' : COLORS.textMuted,
              fontWeight: 600,
            }}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
