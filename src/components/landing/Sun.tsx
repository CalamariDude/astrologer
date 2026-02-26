import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SUN_CONFIG } from './constants';

function makeSunGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255,220,100,1)');
  gradient.addColorStop(0.08, 'rgba(255,184,48,0.9)');
  gradient.addColorStop(0.2, 'rgba(255,140,0,0.5)');
  gradient.addColorStop(0.45, 'rgba(255,120,0,0.15)');
  gradient.addColorStop(0.7, 'rgba(255,100,0,0.04)');
  gradient.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const glowTexture = useMemo(() => makeSunGlowTexture(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const scale = 1 + Math.sin(t * SUN_CONFIG.pulseSpeed) * SUN_CONFIG.pulseAmplitude;

    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      const glowScale = SUN_CONFIG.radius * 12 * (1 + Math.sin(t * SUN_CONFIG.pulseSpeed * 0.7) * 0.04);
      glowRef.current.scale.set(glowScale, glowScale, 1);
    }
  });

  return (
    <group>
      {/* Sun surface */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[SUN_CONFIG.radius, 64, 64]} />
        <meshBasicMaterial color={SUN_CONFIG.color} toneMapped={false} />
      </mesh>

      {/* Bright hot core */}
      <mesh>
        <sphereGeometry args={[SUN_CONFIG.radius * 0.55, 32, 32]} />
        <meshBasicMaterial color="#FFFBE0" toneMapped={false} />
      </mesh>

      {/* Additive glow sprite — works at any DPR */}
      <sprite ref={glowRef} scale={[SUN_CONFIG.radius * 12, SUN_CONFIG.radius * 12, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>

      {/* Main light source */}
      <pointLight
        color={SUN_CONFIG.lightColor}
        intensity={SUN_CONFIG.lightIntensity}
        distance={120}
        decay={1.2}
      />

      {/* Softer secondary fill */}
      <pointLight
        color="#FFE8C0"
        intensity={0.8}
        distance={60}
        decay={2}
      />
    </group>
  );
}
