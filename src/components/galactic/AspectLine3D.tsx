/**
 * AspectLine3D
 * Curved energy arcs between planets at different orbital radii.
 * Bidirectional particles — energy flows both ways (mutual exchange).
 * Challenging = dashed + jitter, harmonious = smooth glow.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Aspect3D } from './types';
import { PLANET_SPEED_ORDER } from './constants';

interface AspectLine3DProps {
  aspect: Aspect3D;
  visible: boolean;
  dimmed?: boolean; // true when another planet is selected
}

/** Shared circular glow texture for particles */
function makeParticleTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.7)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

let _particleTex: THREE.CanvasTexture | null = null;
function getParticleTexture(): THREE.CanvasTexture {
  if (!_particleTex) _particleTex = makeParticleTexture();
  return _particleTex;
}

export function AspectLine3D({ aspect, visible, dimmed = false }: AspectLine3DProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const opacityRef = useRef(0);

  const { energy, positionA, positionB, planetA, planetB } = aspect;
  const nature = aspect.aspect.nature;
  const strength = aspect.aspect.strength;
  const isConjunction = aspect.aspect.type === 'conjunction';

  // Curve that arcs above the XZ plane between the two orbital radii
  const curve = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(positionA, positionB).multiplyScalar(0.5);
    const dist = positionA.distanceTo(positionB);
    // Conjunctions: taller arc relative to distance (energy fusion rises higher)
    const arcHeight = isConjunction
      ? Math.max(1.5, dist * 0.5)
      : Math.max(1.0, dist * 0.2);
    mid.y = arcHeight;
    return new THREE.QuadraticBezierCurve3(positionA, mid, positionB);
  }, [positionA, positionB, isConjunction]);

  // Bidirectional particles: half flow A→B, half flow B→A
  const particleCount = Math.max(8, Math.round(strength * 16));
  // Ensure even count for clean split
  const totalParticles = particleCount % 2 === 0 ? particleCount : particleCount + 1;
  const halfCount = totalParticles / 2;

  const { particleGeo, offsets, directions } = useMemo(() => {
    const positions = new Float32Array(totalParticles * 3);
    const offs = new Float32Array(totalParticles);
    // +1 = forward (A→B), -1 = reverse (B→A)
    const dirs = new Float32Array(totalParticles);

    for (let i = 0; i < totalParticles; i++) {
      // Evenly distribute within each direction group
      const isForward = i < halfCount;
      const indexInGroup = isForward ? i : i - halfCount;
      offs[i] = indexInGroup / halfCount;
      dirs[i] = isForward ? 1 : -1;

      // Place at initial position along curve
      const phase = offs[i];
      const pt = curve.getPoint(phase);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return { particleGeo: geo, offsets: offs, directions: dirs };
  }, [curve, totalParticles, halfCount]);

  // Arc line geometry
  const lineGeo = useMemo(() => {
    const pts = curve.getPoints(48);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [curve]);

  const lineMat = useMemo(() => {
    if (nature === 'challenging') {
      return new THREE.LineDashedMaterial({
        color: energy.color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        dashSize: 0.3,
        gapSize: 0.15,
      });
    }
    return new THREE.LineBasicMaterial({
      color: energy.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
  }, [energy.color, nature]);

  const particleMat = useMemo(() => {
    return new THREE.PointsMaterial({
      color: energy.color,
      size: isConjunction ? 0.25 : 0.18,
      map: getParticleTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, [energy.color]);

  const line = useMemo(() => {
    const l = new THREE.Line(lineGeo, lineMat);
    if (nature === 'challenging') l.computeLineDistances();
    return l;
  }, [lineGeo, lineMat, nature]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Fade in/out
    const target = visible ? 1 : 0;
    opacityRef.current += (target - opacityRef.current) * 0.08;
    const fadeIn = opacityRef.current;
    const dimFactor = dimmed ? 0.15 : 1;

    // Line opacity — conjunctions are brighter (energy fusion)
    const baseLineOpacity = isConjunction
      ? 0.35 + strength * 0.45
      : 0.2 + strength * 0.35;
    lineMat.opacity = baseLineOpacity * fadeIn * dimFactor;

    // Animate particles along curve — bidirectional
    if (particlesRef.current) {
      const positions = particleGeo.attributes.position as THREE.BufferAttribute;
      const speed = isConjunction ? 0.08 : nature === 'challenging' ? 0.1 : 0.06;

      for (let i = 0; i < totalParticles; i++) {
        // Forward particles go 0→1, reverse particles go 1→0
        let phase: number;
        if (directions[i] > 0) {
          phase = (offsets[i] + t * speed) % 1;
        } else {
          phase = (offsets[i] - t * speed) % 1;
          if (phase < 0) phase += 1;
        }

        const pt = curve.getPoint(phase);
        let jX = 0, jY = 0, jZ = 0;

        if (nature === 'challenging') {
          const amt = 0.05;
          jX = Math.sin(t * 2.5 + i * 2.3) * amt;
          jY = Math.cos(t * 2 + i * 1.7) * amt;
          jZ = Math.sin(t * 1.8 + i * 3.1) * amt;
        }

        positions.setXYZ(i, pt.x + jX, pt.y + jY, pt.z + jZ);
      }
      positions.needsUpdate = true;

      const particleBaseOpacity = isConjunction
        ? 0.6 + strength * 0.4
        : 0.4 + strength * 0.5;
      particleMat.opacity = particleBaseOpacity * fadeIn * dimFactor;
    }
  });

  return (
    <group>
      <primitive object={line} />
      <points ref={particlesRef} geometry={particleGeo} material={particleMat} />
    </group>
  );
}
