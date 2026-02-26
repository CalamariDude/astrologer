/**
 * useGalacticChart
 * Transforms natal chart data into 3D positions.
 * Each planet orbits at its own realistic radius with elliptical orbits.
 * Supports transit offset for time-travel animation.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { PLANETS, ZODIAC_SIGNS, getPlanetOrb } from '../../biwheel/utils/constants';
import { calculateNatalAspects, type SynastryAspect } from '../../biwheel/utils/aspectCalculations';
import { LAYOUT, SIGN_COLORS_3D, PLANET_RINGS, PLANET_ORBIT_RADII, DEFAULT_ORBIT_RADIUS, ASTEROID_ORBIT_ZONES, PLANET_ORBITAL_ELEMENTS } from '../constants';
import { ASTEROIDS } from '../../biwheel/utils/constants';
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

function getPlanetInfo(key: string): { symbol: string; name: string; color: string; category: string } {
  const planet = PLANETS[key as keyof typeof PLANETS];
  if (planet) {
    return { symbol: planet.symbol, name: planet.name, color: planet.color, category: planet.category };
  }
  return { symbol: key.slice(0, 3).toUpperCase(), name: key, color: '#a78bfa', category: 'asteroid' };
}

export function useGalacticChart(
  chart: GalacticNatalChart,
  visiblePlanets?: Set<string>,
  visibleAspects?: Set<string>,
  transitDayOffset?: number,
) {
  // Build transit-adjusted chart when offset is active
  const effectiveChart = useMemo(() => {
    if (!transitDayOffset || transitDayOffset === 0) return chart;

    const transitPlanets: typeof chart.planets = {};
    for (const [key, data] of Object.entries(chart.planets)) {
      const orbital = PLANET_ORBITAL_ELEMENTS[key];
      const motion = orbital?.meanDailyMotion ?? 0;
      const transitLong = ((data.longitude + motion * transitDayOffset) % 360 + 360) % 360;
      transitPlanets[key] = {
        ...data,
        longitude: transitLong,
        sign: ZODIAC_SIGNS[Math.floor(transitLong / 30)]?.name,
      };
    }

    return { ...chart, planets: transitPlanets };
  }, [chart, transitDayOffset]);

  const planets3D = useMemo<Planet3D[]>(() => {
    const result: Planet3D[] = [];

    for (const [key, data] of Object.entries(effectiveChart.planets)) {
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
  }, [effectiveChart.planets, visiblePlanets]);

  const aspects = useMemo<SynastryAspect[]>(() => {
    return calculateNatalAspects(
      effectiveChart.planets,
      visiblePlanets,
      visibleAspects ? new Set(visibleAspects) as any : undefined,
    );
  }, [effectiveChart.planets, visiblePlanets, visibleAspects]);

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
    houseSectors,
    zodiacSegments,
    ascendant,
    midheaven,
    orbitPaths,
  };
}
