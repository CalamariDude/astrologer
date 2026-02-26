/**
 * CameraController
 * Orbit controls with auto-rotate, zoom limits, animated transitions, and preset support
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
  activePreset: CameraPreset | null;
  onInteractionStart?: () => void;
}

export function CameraController({ autoRotate, focusPlanet, activePreset, onInteractionStart }: CameraControllerProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookRef = useRef<THREE.Vector3 | null>(null);
  const animatingRef = useRef(false);

  // Animate camera to focus on a planet
  useEffect(() => {
    if (focusPlanet) {
      const planetPos = focusPlanet.position;
      const dir = planetPos.clone().normalize();
      targetPosRef.current = new THREE.Vector3(
        planetPos.x + dir.x * 3,
        planetPos.y + 5,
        planetPos.z + dir.z * 3,
      );
      targetLookRef.current = planetPos.clone();
      animatingRef.current = true;
    }
  }, [focusPlanet]);

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
      camera.position.lerp(targetPosRef.current, 0.06);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookRef.current, 0.06);
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
