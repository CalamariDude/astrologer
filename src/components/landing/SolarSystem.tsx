import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Sun } from './Sun';
import { Planet, OrbitalRing } from './Planet';
import { StarField } from './StarField';
import { PLANETS } from './constants';

interface SolarSystemProps {
  scrollProgress: number;
}

export function SolarSystem({ scrollProgress }: SolarSystemProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Drive camera based on scroll — starts angled above, pulls out as you scroll
  useFrame(() => {
    const t = scrollProgress;

    // Start: slightly off-center, looking at solar system from an angle
    // End: pulled way back, bird's eye
    camera.position.x = THREE.MathUtils.lerp(8, -10, t);
    camera.position.y = THREE.MathUtils.lerp(20, 50, t);
    camera.position.z = THREE.MathUtils.lerp(40, 70, t);

    camera.lookAt(0, 0, 0);
  });

  // Slowly rotate entire system for ambient motion
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.012;
    }
  });

  return (
    <>
      {/* Ambient light — enough to softly see all planets */}
      <ambientLight intensity={0.15} color="#6688CC" />

      {/* Directional fill from above-right for extra dimension */}
      <directionalLight
        position={[30, 20, 10]}
        intensity={0.3}
        color="#8899CC"
      />

      {/* Star background */}
      <StarField />

      {/* Solar system group */}
      <group ref={groupRef}>
        {/* Sun at center */}
        <Sun />

        {/* Orbital rings for every planet */}
        {PLANETS.map((planet) => (
          <OrbitalRing key={`ring-${planet.name}`} radius={planet.orbitRadius} />
        ))}

        {/* All planets */}
        {PLANETS.map((planet) => (
          <Planet key={planet.name} config={planet} />
        ))}
      </group>

      {/* Deep space background sphere */}
      <mesh>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial
          color="#050210"
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
}
