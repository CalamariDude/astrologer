/**
 * AsteroidBelt3D
 * Visual dust ring representing the main asteroid belt between Mars and Jupiter.
 * Rendered as thousands of tiny point particles with subtle twinkling.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ASTEROID_BELT } from './constants';

const PARTICLE_COUNT = 2000;

/** Circular gradient texture for soft particles */
function makeParticleTexture(): THREE.CanvasTexture {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(180,160,130,0.8)');
  gradient.addColorStop(0.3, 'rgba(160,140,110,0.4)');
  gradient.addColorStop(0.7, 'rgba(140,120,100,0.1)');
  gradient.addColorStop(1, 'rgba(120,100,80,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

let sharedParticleTex: THREE.CanvasTexture | null = null;
function getParticleTexture() {
  if (!sharedParticleTex) sharedParticleTex = makeParticleTexture();
  return sharedParticleTex;
}

export function AsteroidBelt3D({ visible }: { visible: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, sizes } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizesArr = new Float32Array(PARTICLE_COUNT);
    const { innerRadius, outerRadius } = ASTEROID_BELT;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Gaussian-ish distribution toward belt center
      const t = 0.5 + (Math.random() - 0.5) * 0.8 + (Math.random() - 0.5) * 0.2;
      const r = innerRadius + Math.max(0, Math.min(1, t)) * (outerRadius - innerRadius);
      const y = (Math.random() - 0.5) * 0.15; // slight vertical scatter

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = -Math.sin(angle) * r;

      sizesArr[i] = 0.02 + Math.random() * 0.04;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizesArr, 1));
    return { geometry: geo, sizes: sizesArr };
  }, []);

  // Gentle twinkling
  useFrame((state) => {
    if (!pointsRef.current || !visible) return;
    const t = state.clock.elapsedTime;
    const sizeAttr = pointsRef.current.geometry.attributes.size;
    for (let i = 0; i < PARTICLE_COUNT; i += 8) { // update every 8th for perf
      const base = sizes[i];
      (sizeAttr.array as Float32Array)[i] = base * (0.8 + 0.2 * Math.sin(t * 0.5 + i));
    }
    sizeAttr.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        map={getParticleTexture()}
        size={0.04}
        sizeAttenuation
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#B8A880"
      />
    </points>
  );
}
