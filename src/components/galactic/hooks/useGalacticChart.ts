/**
 * useGalacticChart
 * Transforms natal chart data into 3D positions.
 * Each planet orbits at its own realistic radius with elliptical orbits.
 *
 * Transit mode: natal planets stay FIXED at birth positions.
 * Transit planets are computed separately on outer orbits using mean daily motion.
 * Transit-to-natal aspects are computed via synastry calculation.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { PLANETS, ZODIAC_SIGNS, getPlanetOrb, ASTEROIDS, ARABIC_PARTS, ARABIC_PART_KEYS } from '../../biwheel/utils/constants';
import { calculateNatalAspects, calculateSynastryAspects, type SynastryAspect } from '../../biwheel/utils/aspectCalculations';
import { LAYOUT, SIGN_COLORS_3D, PLANET_RINGS, PLANET_ORBIT_RADII, DEFAULT_ORBIT_RADIUS, ASTEROID_ORBIT_ZONES, PLANET_ORBITAL_ELEMENTS, TRANSIT_ORBIT_RADIUS, TRANSIT_ORBIT_SPREAD, TRANSIT_PLANET_KEYS } from '../constants';
import type { Planet3D, HouseSector3D, ZodiacSegment3D, GalacticNatalChart } from '../types';

/** Get the semi-major axis (visualization radius) for a planet */
function getSemiMajorAxis(key: string): number {
  let radius = PLANET_ORBIT_RADII[key];
  if (radius !== undefined) return radius;

  const asteroidDef = ASTEROIDS[key as keyof typeof ASTEROIDS];
  const group = (asteroidDef as any)?.group as string | undefined;
  const zone = group ? ASTEROID_ORBIT_ZONES[group] : undefined;
  if (zone) {
    const hash = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const t = (hash % 100) / 100;
    return zone[0] + t * (zone[1] - zone[0]);
  }
  return DEFAULT_ORBIT_RADIUS;
}

/**
 * Convert ecliptic longitude to a 3D position on the XZ plane,
 * using elliptical orbit (radius varies with longitude based on eccentricity).
 */
function longitudeToPosition(longitude: number, semiMajor: number, eccentricity: number, perihelionLong: number): THREE.Vector3 {
  const radians = (longitude * Math.PI) / 180;
  let r = semiMajor;
  if (eccentricity > 0) {
    const periRad = (perihelionLong * Math.PI) / 180;
    r = semiMajor * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(radians - periRad));
  }
  return new THREE.Vector3(
    Math.cos(radians) * r,
    0,
    -Math.sin(radians) * r,
  );
}

function getPlanetSize(category: string): number {
  return LAYOUT.planetSizes[category] ?? LAYOUT.planetSizes.asteroid;
}

/** Set of keys that are mathematical/calculated points (not physical bodies) */
const POINT_KEYS = new Set([
  'truelilith', 'meanlilith', 'whitemoon', 'lilithast',
  'vertex', 'sophia',
  ...ARABIC_PART_KEYS,
]);

function getPlanetInfo(key: string): { symbol: string; name: string; color: string; category: string } {
  const planet = PLANETS[key as keyof typeof PLANETS];
  if (planet) {
    return { symbol: planet.symbol, name: planet.name, color: planet.color, category: planet.category };
  }
  // Arabic Parts
  const arabicPart = (ARABIC_PARTS as Record<string, { symbol: string; name: string; color: string }>)[key];
  if (arabicPart) {
    return { symbol: arabicPart.symbol, name: arabicPart.name, color: arabicPart.color, category: 'point' };
  }
  // Lunar points & calculated points
  const asteroid = (ASTEROIDS as Record<string, { symbol: string; name: string; color: string }>)[key];
  if (asteroid) {
    const category = POINT_KEYS.has(key) ? 'point' : 'asteroid';
    return { symbol: asteroid.symbol, name: asteroid.name, color: asteroid.color, category };
  }
  return { symbol: key.slice(0, 3).toUpperCase(), name: key, color: '#a78bfa', category: 'asteroid' };
}

export function useGalacticChart(
  chart: GalacticNatalChart,
  visiblePlanets?: Set<string>,
  visibleAspects?: Set<string>,
  transitDayOffset?: number,
  transitEnabled?: boolean,
) {
  // ── Natal planets (ALWAYS fixed at birth positions) ──
  const planets3D = useMemo<Planet3D[]>(() => {
    const result: Planet3D[] = [];

    for (const [key, data] of Object.entries(chart.planets)) {
      if (visiblePlanets && !visiblePlanets.has(key)) continue;
      if (data.longitude === undefined) continue;

      const info = getPlanetInfo(key);
      const semiMajor = getSemiMajorAxis(key);
      const orbital = PLANET_ORBITAL_ELEMENTS[key];
      const eccentricity = orbital?.eccentricity ?? 0;
      const perihelionLong = orbital?.perihelionLong ?? 0;

      const position = longitudeToPosition(data.longitude, semiMajor, eccentricity, perihelionLong);

      if (data.latitude) {
        position.y = data.latitude * 0.2;
      }

      const ring = PLANET_RINGS[key];

      result.push({
        key,
        name: info.name,
        symbol: info.symbol,
        position,
        longitude: data.longitude,
        latitude: data.latitude ?? 0,
        color: info.color,
        size: getPlanetSize(info.category),
        category: info.category,
        sign: data.sign ?? ZODIAC_SIGNS[Math.floor(data.longitude / 30)]?.name ?? '',
        house: data.house,
        retrograde: data.retrograde ?? false,
        orb: getPlanetOrb(key),
        hasRing: !!ring,
        ringColor: ring?.ringColor,
        ringTilt: ring?.ringTilt,
        ringSize: ring?.ringSize,
      });
    }

    return result;
  }, [chart.planets, visiblePlanets]);

  // ── Natal-to-natal aspects ──
  const aspects = useMemo<SynastryAspect[]>(() => {
    return calculateNatalAspects(
      chart.planets,
      visiblePlanets,
      visibleAspects ? new Set(visibleAspects) as any : undefined,
    );
  }, [chart.planets, visiblePlanets, visibleAspects]);

  // ── Transit planet positions (separate overlay layer) ──
  const transitPlanets3D = useMemo<Planet3D[]>(() => {
    if (!transitEnabled || !transitDayOffset) return [];

    const result: Planet3D[] = [];

    for (const [key, data] of Object.entries(chart.planets)) {
      if (!TRANSIT_PLANET_KEYS.has(key)) continue;
      if (visiblePlanets && !visiblePlanets.has(key)) continue;
      if (data.longitude === undefined) continue;

      const orbital = PLANET_ORBITAL_ELEMENTS[key];
      const motion = orbital?.meanDailyMotion ?? 0;
      const transitLong = ((data.longitude + motion * transitDayOffset) % 360 + 360) % 360;

      const info = getPlanetInfo(key);
      const semiMajor = TRANSIT_ORBIT_RADIUS + (TRANSIT_ORBIT_SPREAD[key] ?? 0);
      const eccentricity = 0; // Circular orbit for transit ring
      const perihelionLong = 0;

      const position = longitudeToPosition(transitLong, semiMajor, eccentricity, perihelionLong);

      result.push({
        key: `transit_${key}`,
        name: info.name,
        symbol: info.symbol,
        position,
        longitude: transitLong,
        latitude: 0,
        color: info.color,
        size: getPlanetSize(info.category) * 0.65,
        category: info.category,
        sign: ZODIAC_SIGNS[Math.floor(transitLong / 30)]?.name ?? '',
        house: undefined,
        retrograde: false,
        orb: getPlanetOrb(key),
        isTransit: true,
      });
    }

    return result;
  }, [chart.planets, transitDayOffset, transitEnabled, visiblePlanets]);

  // ── Transit-to-natal aspects ──
  const transitAspects = useMemo<SynastryAspect[]>(() => {
    if (!transitEnabled || !transitDayOffset) return [];

    // Build transit planet record with normal keys for proper orb calculation
    const transitRecord: Record<string, { longitude: number }> = {};
    for (const [key, data] of Object.entries(chart.planets)) {
      if (!TRANSIT_PLANET_KEYS.has(key)) continue;
      if (visiblePlanets && !visiblePlanets.has(key)) continue;
      if (data.longitude === undefined) continue;

      const orbital = PLANET_ORBITAL_ELEMENTS[key];
      const motion = orbital?.meanDailyMotion ?? 0;
      transitRecord[key] = {
        longitude: ((data.longitude + motion * transitDayOffset) % 360 + 360) % 360,
      };
    }

    // Natal record (only visible planets)
    const natalRecord: Record<string, { longitude: number }> = {};
    for (const [key, data] of Object.entries(chart.planets)) {
      if (!TRANSIT_PLANET_KEYS.has(key)) continue;
      if (visiblePlanets && !visiblePlanets.has(key)) continue;
      if (data.longitude === undefined) continue;
      natalRecord[key] = { longitude: data.longitude };
    }

    const raw = calculateSynastryAspects(
      transitRecord,
      natalRecord,
      undefined, // all planets already filtered
      visibleAspects ? new Set(visibleAspects) as any : undefined,
    );

    // Remap planetA keys to transit_ prefix so position lookup works
    return raw.map(asp => ({
      ...asp,
      planetA: `transit_${asp.planetA}`,
    }));
  }, [chart.planets, transitDayOffset, transitEnabled, visiblePlanets, visibleAspects]);

  const houseSectors = useMemo<HouseSector3D[]>(() => {
    if (!chart.houses) return [];

    const cusps: number[] = [];
    for (let i = 1; i <= 12; i++) {
      const cusp = chart.houses[`house_${i}`];
      if (cusp === undefined) return [];
      cusps.push(cusp);
    }

    return cusps.map((cusp, i) => {
      const nextCusp = cusps[(i + 1) % 12];
      let startAngle = (cusp * Math.PI) / 180;
      let endAngle = (nextCusp * Math.PI) / 180;
      if (endAngle < startAngle) endAngle += Math.PI * 2;

      return {
        number: i + 1,
        startAngle,
        endAngle,
        isAngular: [1, 4, 7, 10].includes(i + 1),
      };
    });
  }, [chart.houses]);

  const zodiacSegments = useMemo<ZodiacSegment3D[]>(() => {
    return ZODIAC_SIGNS.map((sign, i) => {
      const startDeg = i * 30;
      const endDeg = (i + 1) * 30;
      return {
        name: sign.name,
        symbol: sign.symbol,
        element: sign.element,
        startAngle: (startDeg * Math.PI) / 180,
        endAngle: (endDeg * Math.PI) / 180,
        color: SIGN_COLORS_3D[sign.name] ?? '#999',
      };
    });
  }, []);

  // Orbit data for rendering elliptical orbit paths
  const orbitPaths = useMemo(() => {
    const paths: { key: string; semiMajor: number; eccentricity: number; perihelionLong: number; color: string }[] = [];
    const seen = new Set<string>();

    for (const p of planets3D) {
      // Skip asteroids (too many orbits would clutter)
      if (p.category === 'asteroid') continue;

      const semiMajor = getSemiMajorAxis(p.key);
      const orbital = PLANET_ORBITAL_ELEMENTS[p.key];
      const roundedKey = `${semiMajor.toFixed(1)}-${(orbital?.eccentricity ?? 0).toFixed(3)}`;
      if (seen.has(roundedKey)) continue;
      seen.add(roundedKey);

      paths.push({
        key: p.key,
        semiMajor,
        eccentricity: orbital?.eccentricity ?? 0,
        perihelionLong: orbital?.perihelionLong ?? 0,
        color: p.color,
      });
    }

    return paths;
  }, [planets3D]);

  const ascendant = chart.angles?.ascendant ?? null;
  const midheaven = chart.angles?.midheaven ?? null;

  return {
    planets3D,
    aspects,
    transitPlanets3D,
    transitAspects,
    houseSectors,
    zodiacSegments,
    ascendant,
    midheaven,
    orbitPaths,
  };
}
