/**
 * CameraController
 * Orbit controls with auto-rotate, zoom limits, animated transitions, and preset support.
 * Supports single-planet close-up and dual-planet framing (for transit aspects).
 */

import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CAMERA } from './constants';
import type { Planet3D, CameraPreset } from './types';

interface CameraControllerProps {
  autoRotate: boolean;
  focusPlanet: Planet3D | null;
  focusPlanetB?: Planet3D | null;  // Second planet for dual framing (transit scenes)
  activePreset: CameraPreset | null;
  onInteractionStart?: () => void;
}

export function CameraController({ autoRotate, focusPlanet, focusPlanetB, activePreset, onInteractionStart }: CameraControllerProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookRef = useRef<THREE.Vector3 | null>(null);
  const animatingRef = useRef(false);

  // Animate camera to focus on one or two planets
  useEffect(() => {
    if (!focusPlanet) return;

    if (focusPlanetB) {
      // Dual-planet framing: position camera to see both planets + the line between them
      const posA = focusPlanet.position;
      const posB = focusPlanetB.position;

      // Look at the midpoint between both planets
      const midpoint = posA.clone().add(posB).multiplyScalar(0.5);

      // Distance between the two planets
      const separation = posA.distanceTo(posB);

      // Camera pulls back proportionally to separation, with a minimum
      const pullBack = Math.max(separation * 0.8, 3);
      const elevation = Math.max(separation * 0.4, 2);

      // Camera positioned above and outside the midpoint
      const midDir = midpoint.clone().normalize();
      const perpendicular = new THREE.Vector3(-midDir.z, 0, midDir.x).normalize();

      targetPosRef.current = new THREE.Vector3(
        midpoint.x + midDir.x * pullBack + perpendicular.x * 1.5,
        midpoint.y + elevation,
        midpoint.z + midDir.z * pullBack + perpendicular.z * 1.5,
      );
      targetLookRef.current = midpoint;
      animatingRef.current = true;
    } else {
      // Single planet close-up
      const planetPos = focusPlanet.position;
      const dir = planetPos.clone().normalize();
      const distance = 1.8;
      const elevation = 1.5;
      const perpendicular = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      targetPosRef.current = new THREE.Vector3(
        planetPos.x + dir.x * distance + perpendicular.x * 0.8,
        planetPos.y + elevation,
        planetPos.z + dir.z * distance + perpendicular.z * 0.8,
      );
      targetLookRef.current = planetPos.clone();
      animatingRef.current = true;
    }
  }, [focusPlanet, focusPlanetB]);

  // Animate camera to preset position
  useEffect(() => {
    if (activePreset) {
      targetPosRef.current = new THREE.Vector3(...activePreset.position);
      targetLookRef.current = new THREE.Vector3(...activePreset.target);
      animatingRef.current = true;
    }
  }, [activePreset]);

  // Smooth camera animation
  useFrame(() => {
    if (animatingRef.current && targetPosRef.current && targetLookRef.current) {
      camera.position.lerp(targetPosRef.current, 0.055);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookRef.current, 0.055);
      }

      const dist = camera.position.distanceTo(targetPosRef.current);
      if (dist < 0.05) {
        animatingRef.current = false;
        targetPosRef.current = null;
        targetLookRef.current = null;
      }
    }
  });

  const handleStart = useCallback(() => {
    animatingRef.current = false;
    targetPosRef.current = null;
    onInteractionStart?.();
  }, [onInteractionStart]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={CAMERA.zoomMin}
      maxDistance={CAMERA.zoomMax}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2 + 0.3}
      autoRotate={autoRotate && !animatingRef.current}
      autoRotateSpeed={CAMERA.autoRotateSpeed}
      dampingFactor={CAMERA.dampingFactor}
      enableDamping={true}
      onStart={handleStart}
    />
  );
}
