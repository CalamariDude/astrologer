/**
 * GalacticScene
 * Orrery-style scene: planets at realistic elliptical orbits with orbit rings.
 * Clicking a planet = focus mode (only that planet's aspects shown, others dimmed).
 *
 * Transit layer: when transits are enabled, transit planets appear on outer orbits
 * with transit-to-natal aspect lines rendered distinctly.
 */

import { useMemo, useCallback } from 'react';
import { useGalacticChart } from './hooks/useGalacticChart';
import { useAspectEnergy } from './hooks/useAspectEnergy';
import { PlanetNode3D } from './PlanetNode3D';
import { EnergyFlowOverlay3D } from './EnergyFlowOverlay3D';
import { ZodiacRing3D } from './ZodiacRing3D';
import { HouseSectors3D } from './HouseSectors3D';
import { AspectLine3D } from './AspectLine3D';
import { StarField3D } from './StarField3D';
import { AsteroidBelt3D } from './AsteroidBelt3D';
import { CameraController } from './CameraController';
import { FlatEarthDisc3D } from './FlatEarthDisc3D';
import { TRANSITION } from './constants';
import { calculateDeclination } from '@/lib/declination';
import * as THREE from 'three';
import type { GalacticNatalChart, Planet3D, CameraPreset } from './types';

interface GalacticSceneProps {
  chart: GalacticNatalChart;
  visiblePlanets?: Set<string>;
  visibleAspects?: Set<string>;
  selectedPlanet: string | null;
  onSelectPlanet: (key: string | null) => void;
  autoRotate: boolean;
  onInteractionStart: () => void;
  showAspects: boolean;
  showNatalAspects?: boolean;
  showTransitAspects?: boolean;
  showHouses: boolean;
  showOrbits: boolean;
  showZodiac: boolean;
  showFlatEarth?: boolean;
  activePreset: CameraPreset | null;
  transitDayOffset?: number;
  transitEnabled?: boolean;
}

/** Elliptical orbit path using real Keplerian elements */
function EllipticalOrbit({
  semiMajor, eccentricity, perihelionLong, color, opacity,
}: {
  semiMajor: number;
  eccentricity: number;
  perihelionLong: number;
  color: string;
  opacity: number;
}) {
  const line = useMemo(() => {
    const segments = 256;
    const points: THREE.Vector3[] = [];
    const e = eccentricity;
    const periRad = (perihelionLong * Math.PI) / 180;

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const r = e > 0
        ? semiMajor * (1 - e * e) / (1 + e * Math.cos(theta - periRad))
        : semiMajor;
      points.push(new THREE.Vector3(
        Math.cos(theta) * r,
        0,
        -Math.sin(theta) * r,
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    return new THREE.LineLoop(geometry, material);
  }, [semiMajor, eccentricity, perihelionLong, color, opacity]);

  return <primitive object={line} />;
}

export function GalacticScene({
  chart,
  visiblePlanets,
  visibleAspects,
  selectedPlanet,
  onSelectPlanet,
  autoRotate,
  onInteractionStart,
  showAspects,
  showNatalAspects = true,
  showTransitAspects = true,
  showHouses,
  showOrbits,
  showZodiac,
  showFlatEarth,
  activePreset,
  transitDayOffset,
  transitEnabled,
}: GalacticSceneProps) {
  const {
    planets3D,
    aspects,
    transitPlanets3D,
    transitAspects,
    houseSectors,
    zodiacSegments,
    ascendant,
    midheaven,
    orbitPaths,
  } = useGalacticChart(chart, visiblePlanets, visibleAspects, transitDayOffset, transitEnabled);

  // Combine natal + transit planets for position lookup in aspect energy
  const allPlanets3D = useMemo(
    () => [...planets3D, ...transitPlanets3D],
    [planets3D, transitPlanets3D],
  );

  // Natal aspects use natal positions only
  const aspects3D = useAspectEnergy(aspects, planets3D);
  // Transit-to-natal aspects need combined position map
  const transitAspects3D = useAspectEnergy(transitAspects, allPlanets3D);

  // Compute declination map for parallel/contraparallel detection
  const declinations = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [key, data] of Object.entries(chart.planets)) {
      if (data?.longitude !== undefined) {
        result[key] = calculateDeclination(data.longitude, data.latitude ?? 0);
      }
    }
    return result;
  }, [chart.planets]);

  // Helper to check declination aspect between two planets
  const getDecAspect = useCallback((pA: string, pB: string): 'parallel' | 'contraparallel' | null => {
    const dA = declinations[pA];
    const dB = declinations[pB];
    if (dA === undefined || dB === undefined) return null;
    if (Math.abs(dA - dB) <= 1.2) return 'parallel';
    if (Math.abs(dA + dB) <= 1.2) return 'contraparallel';
    return null;
  }, [declinations]);

  const focusPlanet = useMemo<Planet3D | null>(() => {
    if (!selectedPlanet) return null;
    return allPlanets3D.find((p) => p.key === selectedPlanet) ?? null;
  }, [selectedPlanet, allPlanets3D]);

  const handleSelectPlanet = useCallback((key: string) => {
    onSelectPlanet(selectedPlanet === key ? null : key);
  }, [selectedPlanet, onSelectPlanet]);

  // When a planet is selected, only its aspects are fully visible
  const focusedAspectIds = useMemo<Set<string> | null>(() => {
    if (!selectedPlanet) return null;
    const ids = new Set<string>();
    // Check natal aspects
    for (const asp of aspects3D) {
      if (asp.planetA === selectedPlanet || asp.planetB === selectedPlanet) {
        ids.add(asp.id);
      }
    }
    // Check transit aspects
    for (const asp of transitAspects3D) {
      if (asp.planetA === selectedPlanet || asp.planetB === selectedPlanet) {
        ids.add(asp.id);
      }
    }
    return ids;
  }, [selectedPlanet, aspects3D, transitAspects3D]);

  return (
    <>
      {/* Camera */}
      <CameraController
        autoRotate={autoRotate}
        focusPlanet={focusPlanet}
        activePreset={activePreset}
        onInteractionStart={onInteractionStart}
      />

      {/* Lighting — brighter to show planet surface textures */}
      <ambientLight intensity={0.4} color="#8899CC" />
      <directionalLight position={[30, 20, 10]} intensity={0.6} color="#CCDDFF" />
      <directionalLight position={[-20, 15, -10]} intensity={0.2} color="#AABBDD" />

      {/* Background */}
      <StarField3D />
      <color attach="background" args={['#060818']} />
      <fog attach="fog" args={['#060818', 60, 180]} />

      <mesh>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial color="#040612" side={THREE.BackSide} />
      </mesh>

      {/* Elliptical orbit paths — one per visible main planet */}
      {showOrbits && orbitPaths.map((orbit) => (
        <EllipticalOrbit
          key={orbit.key}
          semiMajor={orbit.semiMajor}
          eccentricity={orbit.eccentricity}
          perihelionLong={orbit.perihelionLong}
          color={orbit.color}
          opacity={0.08}
        />
      ))}

      {/* Asteroid belt dust ring — visible when asteroids are in the scene */}
      {showOrbits && <AsteroidBelt3D visible={planets3D.some((p) => p.category === 'asteroid')} />}

      {/* Zodiac Ring (flat with cusp fusion) */}
      {showZodiac && <ZodiacRing3D segments={zodiacSegments} />}

      {/* House Sectors */}
      {showHouses && houseSectors.length > 0 && (
        <HouseSectors3D
          sectors={houseSectors}
          ascendant={ascendant}
          midheaven={midheaven}
        />
      )}

      {/* Earth Disc */}
      {showFlatEarth && (
        <FlatEarthDisc3D
          sectors={houseSectors}
          ascendant={ascendant}
          midheaven={midheaven}
        />
      )}

      {/* Natal Aspect Lines */}
      {showAspects && showNatalAspects && aspects3D.map((asp) => {
        const isFocused = focusedAspectIds ? focusedAspectIds.has(asp.id) : true;
        return (
          <AspectLine3D
            key={asp.id}
            aspect={asp}
            visible={focusedAspectIds ? isFocused : true}
            dimmed={focusedAspectIds ? !isFocused : false}
            declinationAspect={getDecAspect(asp.planetA, asp.planetB)}
          />
        );
      })}

      {/* Transit-to-Natal Aspect Lines */}
      {showAspects && showTransitAspects && transitAspects3D.map((asp) => {
        const isFocused = focusedAspectIds ? focusedAspectIds.has(asp.id) : true;
        return (
          <AspectLine3D
            key={asp.id}
            aspect={asp}
            visible={focusedAspectIds ? isFocused : true}
            dimmed={focusedAspectIds ? !isFocused : false}
          />
        );
      })}

      {/* Natal Planets */}
      {planets3D.map((planet, i) => (
        <PlanetNode3D
          key={planet.key}
          planet={planet}
          selected={selectedPlanet === planet.key}
          onSelect={handleSelectPlanet}
          animationDelay={i * TRANSITION.planetStagger}
          dimmed={!!selectedPlanet && selectedPlanet !== planet.key}
        />
      ))}

      {/* Transit Planets */}
      {transitPlanets3D.map((planet, i) => (
        <PlanetNode3D
          key={planet.key}
          planet={planet}
          selected={selectedPlanet === planet.key}
          onSelect={handleSelectPlanet}
          animationDelay={0}
          dimmed={!!selectedPlanet && selectedPlanet !== planet.key}
        />
      ))}

      {/* Energy flow overlay — shown when a natal planet is selected */}
      {focusPlanet && !focusPlanet.isTransit && houseSectors.length > 0 && (
        <EnergyFlowOverlay3D
          selectedPlanet={focusPlanet}
          allPlanets={planets3D}
          houseSectors={houseSectors}
        />
      )}
    </>
  );
}
