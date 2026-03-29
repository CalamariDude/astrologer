/**
 * AspectLine3D
 * Energy beam arcs between planets — glowing light tubes with flowing particles.
 *
 * Energy flow direction:
 * - Harmonious/neutral: bidirectional (mutual exchange, particles both ways)
 * - Challenging: one-way A→B (forced/pressured, single direction + arrow cone)
 *
 * Features:
 * - Glowing tube geometry core beam (actual width, not 1px lines)
 * - Additive-blend outer glow halo
 * - Aspect symbol billboard sprite at curve apex
 * - Declination parallel/contraparallel indicator
 * - Pulsing energy particles with bloom
 * - Jitter particles for challenging aspects
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Aspect3D } from './types';
import { PLANET_SPEED_ORDER } from './constants';

interface AspectLine3DProps {
  aspect: Aspect3D;
  visible: boolean;
  dimmed?: boolean;
  /** Declination aspect type (parallel/contraparallel) if any */
  declinationAspect?: 'parallel' | 'contraparallel' | null;
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
  gradient.addColorStop(0.15, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.1)');
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

export function AspectLine3D({ aspect, visible, dimmed = false, declinationAspect }: AspectLine3DProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const arrowRef = useRef<THREE.Mesh>(null);
  const tubeRef = useRef<THREE.Mesh>(null);
  const glowTubeRef = useRef<THREE.Mesh>(null);
  const symbolRef = useRef<any>(null);
  const orbRef = useRef<any>(null);
  const opacityRef = useRef(0);

  const { energy, positionA, positionB } = aspect;
  const nature = aspect.aspect.nature;
  const strength = aspect.aspect.strength;
  const isConjunction = aspect.aspect.type === 'conjunction';
  const isChallenging = nature === 'challenging';
  const isBidirectional = !isChallenging;

  // Curve that arcs above the XZ plane between the two orbital radii
  const curve = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(positionA, positionB).multiplyScalar(0.5);
    const dist = positionA.distanceTo(positionB);
    const arcHeight = isConjunction
      ? Math.max(1.5, dist * 0.5)
      : Math.max(1.0, dist * 0.2);
    mid.y = arcHeight;
    return new THREE.QuadraticBezierCurve3(positionA, mid, positionB);
  }, [positionA, positionB, isConjunction]);

  // Apex position (t=0.5 on curve) for symbol placement
  const apexPosition = useMemo(() => curve.getPoint(0.5), [curve]);

  // Arrow position and orientation for one-way flow (at ~70% along curve)
  const arrowData = useMemo(() => {
    if (isBidirectional) return null;
    const t = 0.72;
    const pos = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    return { position: pos, direction: tangent };
  }, [curve, isBidirectional]);

  // Tube geometry — the core energy beam with real width
  const coreRadius = isConjunction ? 0.04 + strength * 0.03 : 0.025 + strength * 0.02;
  const tubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 48, coreRadius, 6, false);
  }, [curve, coreRadius]);

  // Outer glow tube — larger, more transparent
  const glowRadius = coreRadius * 3;
  const glowTubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 48, glowRadius, 8, false);
  }, [curve, glowRadius]);

  // Particles: bidirectional = split A→B and B→A; one-way = all A→B
  const particleCount = isConjunction
    ? Math.max(14, Math.round(strength * 24))
    : Math.max(10, Math.round(strength * 20));
  const totalParticles = particleCount % 2 === 0 ? particleCount : particleCount + 1;
  const halfCount = totalParticles / 2;

  const { particleGeo, offsets, directions } = useMemo(() => {
    const positions = new Float32Array(totalParticles * 3);
    const offs = new Float32Array(totalParticles);
    const dirs = new Float32Array(totalParticles);

    for (let i = 0; i < totalParticles; i++) {
      if (isBidirectional) {
        const isForward = i < halfCount;
        const indexInGroup = isForward ? i : i - halfCount;
        offs[i] = indexInGroup / halfCount;
        dirs[i] = isForward ? 1 : -1;
      } else {
        offs[i] = i / totalParticles;
        dirs[i] = 1;
      }

      const phase = offs[i];
      const pt = curve.getPoint(phase);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return { particleGeo: geo, offsets: offs, directions: dirs };
  }, [curve, totalParticles, halfCount, isBidirectional]);

  // Core tube material — bright inner beam
  const tubeMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: energy.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [energy.color]);

  // Glow tube material — soft outer halo
  const glowTubeMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: energy.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }, [energy.color]);

  const particleMat = useMemo(() => {
    return new THREE.PointsMaterial({
      color: energy.color,
      size: isConjunction ? 0.35 : isChallenging ? 0.3 : 0.25,
      map: getParticleTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, [energy.color, isConjunction, isChallenging]);

  // Arrow cone material for one-way flow
  const arrowMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: energy.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [energy.color]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Fade in/out
    const target = visible ? 1 : 0;
    opacityRef.current += (target - opacityRef.current) * 0.08;
    const fadeIn = opacityRef.current;
    const dimFactor = dimmed ? 0.12 : 1;

    // Pulse effect — energy breathing
    const pulseBase = 0.6 + Math.sin(t * energy.pulseFrequency) * 0.4;
    const pulse = isChallenging
      ? 0.5 + Math.abs(Math.sin(t * energy.pulseFrequency * 1.5)) * 0.5  // sharper pulse
      : pulseBase;

    // Core tube beam opacity
    const coreOpacity = isConjunction
      ? (0.5 + strength * 0.5) * pulse
      : (0.3 + strength * 0.4) * pulse;
    tubeMat.opacity = coreOpacity * fadeIn * dimFactor;

    // Glow halo opacity — softer
    const glowOpacity = isConjunction
      ? (0.15 + strength * 0.2) * pulse
      : (0.08 + strength * 0.15) * pulse;
    glowTubeMat.opacity = glowOpacity * fadeIn * dimFactor;

    // Arrow opacity for one-way
    if (arrowRef.current) {
      arrowMat.opacity = coreOpacity * 0.8 * fadeIn * dimFactor;
    }

    // Text label opacity — hide when dimmed
    const textOpacity = fadeIn * dimFactor;
    if (symbolRef.current) symbolRef.current.fillOpacity = textOpacity;
    if (orbRef.current) orbRef.current.fillOpacity = 0.6 * textOpacity;

    // Animate particles along curve
    if (particlesRef.current) {
      const positions = particleGeo.attributes.position as THREE.BufferAttribute;
      const speed = isConjunction ? 0.1 : isChallenging ? 0.14 : 0.08;

      for (let i = 0; i < totalParticles; i++) {
        let phase: number;
        if (directions[i] > 0) {
          phase = (offsets[i] + t * speed) % 1;
        } else {
          phase = (offsets[i] - t * speed) % 1;
          if (phase < 0) phase += 1;
        }

        const pt = curve.getPoint(phase);
        let jX = 0, jY = 0, jZ = 0;

        if (isChallenging) {
          const amt = 0.07;
          jX = Math.sin(t * 3 + i * 2.3) * amt;
          jY = Math.cos(t * 2.5 + i * 1.7) * amt;
          jZ = Math.sin(t * 2 + i * 3.1) * amt;
        }

        positions.setXYZ(i, pt.x + jX, pt.y + jY, pt.z + jZ);
      }
      positions.needsUpdate = true;

      const particleBaseOpacity = isConjunction
        ? 0.7 + strength * 0.3
        : 0.5 + strength * 0.4;
      particleMat.opacity = particleBaseOpacity * pulse * fadeIn * dimFactor;
    }
  });

  // Build symbol text: aspect symbol + optional declination indicator
  const symbolText = aspect.aspect.symbol;
  const decSymbol = declinationAspect === 'parallel' ? ' \u2225' : declinationAspect === 'contraparallel' ? ' \u2AF6' : '';
  const orbText = `${aspect.aspect.exactOrb.toFixed(1)}\u00B0`;

  return (
    <group>
      {/* Core energy beam — tube with actual width */}
      <mesh ref={tubeRef} geometry={tubeGeo} material={tubeMat} />

      {/* Outer glow halo — larger tube, softer */}
      <mesh ref={glowTubeRef} geometry={glowTubeGeo} material={glowTubeMat} />

      {/* Energy particles — flowing along the beam */}
      <points ref={particlesRef} geometry={particleGeo} material={particleMat} />

      {/* Arrow cone for one-way (challenging) flow */}
      {arrowData && (
        <mesh
          ref={arrowRef}
          position={arrowData.position}
          quaternion={new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            arrowData.direction
          )}
          material={arrowMat}
        >
          <coneGeometry args={[0.14, 0.4, 6]} />
        </mesh>
      )}

      {/* Aspect symbol billboard at apex */}
      <Billboard position={apexPosition} follow lockX={false} lockY={false} lockZ={false}>
        {/* Aspect symbol */}
        <Text
          ref={symbolRef}
          fontSize={0.18}
          color={energy.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#000000"
        >
          {symbolText}
        </Text>
        {/* Orb degree below */}
        <Text
          ref={orbRef}
          position={[0, -0.22, 0]}
          fontSize={0.09}
          color={energy.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000000"
          fillOpacity={0.6}
        >
          {orbText}{decSymbol}
        </Text>
      </Billboard>
    </group>
  );
}
