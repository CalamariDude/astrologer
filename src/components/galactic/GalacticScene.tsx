/**
 * GalacticScene
 * Orrery-style scene: planets at realistic elliptical orbits with orbit rings.
 * Clicking a planet = focus mode (only that planet's aspects shown, others dimmed).
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
import { TRANSITION } from './constants';
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
  showHouses: boolean;
  activePreset: CameraPreset | null;
  transitDayOffset?: number;
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
  showHouses,
  activePreset,
  transitDayOffset,
}: GalacticSceneProps) {
  const {
    planets3D,
    aspects,
    houseSectors,
    zodiacSegments,
    ascendant,
    midheaven,
    orbitPaths,
  } = useGalacticChart(chart, visiblePlanets, visibleAspects, transitDayOffset);

  // Pass planets3D so aspects use actual orbital positions
  const aspects3D = useAspectEnergy(aspects, planets3D);

  const focusPlanet = useMemo<Planet3D | null>(() => {
    if (!selectedPlanet) return null;
    return planets3D.find((p) => p.key === selectedPlanet) ?? null;
  }, [selectedPlanet, planets3D]);

  const handleSelectPlanet = useCallback((key: string) => {
    onSelectPlanet(selectedPlanet === key ? null : key);
  }, [selectedPlanet, onSelectPlanet]);

  // When a planet is selected, only its aspects are fully visible
  const focusedAspectIds = useMemo<Set<string> | null>(() => {
    if (!selectedPlanet) return null;
    const ids = new Set<string>();
    for (const asp of aspects3D) {
      if (asp.planetA === selectedPlanet || asp.planetB === selectedPlanet) {
        ids.add(asp.id);
      }
    }
    return ids;
  }, [selectedPlanet, aspects3D]);

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
      {orbitPaths.map((orbit) => (
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
      <AsteroidBelt3D visible={planets3D.some((p) => p.category === 'asteroid')} />

      {/* Zodiac Ring (flat with cusp fusion) */}
      <ZodiacRing3D segments={zodiacSegments} />

      {/* House Sectors */}
      {showHouses && houseSectors.length > 0 && (
        <HouseSectors3D
          sectors={houseSectors}
          ascendant={ascendant}
          midheaven={midheaven}
        />
      )}

      {/* Aspect Lines — when a planet is selected, dim non-related aspects */}
      {showAspects && aspects3D.map((asp) => {
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

      {/* Planets */}
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

      {/* Energy flow overlay — shown when a planet is selected */}
      {focusPlanet && houseSectors.length > 0 && (
        <EnergyFlowOverlay3D
          selectedPlanet={focusPlanet}
          allPlanets={planets3D}
          houseSectors={houseSectors}
        />
      )}
    </>
  );
}
