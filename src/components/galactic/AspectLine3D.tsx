/**
 * AspectLine3D
 * Curved energy arcs between planets at different orbital radii.
 *
 * Energy flow direction:
 * - Harmonious/neutral: bidirectional (mutual exchange, particles both ways)
 * - Challenging: one-way A→B (forced/pressured, single direction + arrow cone)
 *
 * Features:
 * - Aspect symbol billboard sprite at curve apex
 * - Declination parallel/contraparallel indicator
 * - Glow underlay for strong aspects
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

export function AspectLine3D({ aspect, visible, dimmed = false, declinationAspect }: AspectLine3DProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const arrowRef = useRef<THREE.Mesh>(null);
  const glowLineRef = useRef<THREE.Line>(null);
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

  // Particles: bidirectional = split A→B and B→A; one-way = all A→B
  const particleCount = Math.max(8, Math.round(strength * 16));
  const totalParticles = particleCount % 2 === 0 ? particleCount : particleCount + 1;
  const halfCount = totalParticles / 2;

  const { particleGeo, offsets, directions } = useMemo(() => {
    const positions = new Float32Array(totalParticles * 3);
    const offs = new Float32Array(totalParticles);
    const dirs = new Float32Array(totalParticles);

    for (let i = 0; i < totalParticles; i++) {
      if (isBidirectional) {
        // Split: first half A→B, second half B→A
        const isForward = i < halfCount;
        const indexInGroup = isForward ? i : i - halfCount;
        offs[i] = indexInGroup / halfCount;
        dirs[i] = isForward ? 1 : -1;
      } else {
        // All one-way: A→B
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

  // Arc line geometry
  const lineGeo = useMemo(() => {
    const pts = curve.getPoints(48);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [curve]);

  // Glow line geometry (same path, wider)
  const glowGeo = useMemo(() => {
    const pts = curve.getPoints(48);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [curve]);

  const lineMat = useMemo(() => {
    if (isChallenging) {
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
  }, [energy.color, isChallenging]);

  const glowMat = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: energy.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      linewidth: 1,
    });
  }, [energy.color]);

  const particleMat = useMemo(() => {
    return new THREE.PointsMaterial({
      color: energy.color,
      size: isConjunction ? 0.25 : isChallenging ? 0.22 : 0.18,
      map: getParticleTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, [energy.color, isConjunction, isChallenging]);

  const line = useMemo(() => {
    const l = new THREE.Line(lineGeo, lineMat);
    if (isChallenging) l.computeLineDistances();
    return l;
  }, [lineGeo, lineMat, isChallenging]);

  const glowLine = useMemo(() => {
    return new THREE.Line(glowGeo, glowMat);
  }, [glowGeo, glowMat]);

  // Arrow cone material for one-way flow
  const arrowMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: energy.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
  }, [energy.color]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Fade in/out
    const target = visible ? 1 : 0;
    opacityRef.current += (target - opacityRef.current) * 0.08;
    const fadeIn = opacityRef.current;
    const dimFactor = dimmed ? 0.15 : 1;

    // Line opacity
    const baseLineOpacity = isConjunction
      ? 0.35 + strength * 0.45
      : 0.2 + strength * 0.35;
    lineMat.opacity = baseLineOpacity * fadeIn * dimFactor;

    // Glow underlay — subtle pulsing
    const pulse = 0.5 + Math.sin(t * energy.pulseFrequency) * 0.3;
    glowMat.opacity = baseLineOpacity * 0.25 * pulse * fadeIn * dimFactor;

    // Arrow opacity for one-way
    if (arrowRef.current) {
      arrowMat.opacity = baseLineOpacity * 0.7 * fadeIn * dimFactor;
    }

    // Animate particles along curve
    if (particlesRef.current) {
      const positions = particleGeo.attributes.position as THREE.BufferAttribute;
      const speed = isConjunction ? 0.08 : isChallenging ? 0.12 : 0.06;

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

  // Build symbol text: aspect symbol + optional declination indicator
  const symbolText = aspect.aspect.symbol;
  const decSymbol = declinationAspect === 'parallel' ? ' \u2225' : declinationAspect === 'contraparallel' ? ' \u2AF6' : '';
  const orbText = `${aspect.aspect.exactOrb.toFixed(1)}\u00B0`;

  return (
    <group>
      {/* Main arc line */}
      <primitive object={line} />

      {/* Glow underlay */}
      <primitive object={glowLine} />

      {/* Particles */}
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
          <coneGeometry args={[0.12, 0.35, 6]} />
        </mesh>
      )}

      {/* Aspect symbol billboard at apex */}
      <Billboard position={apexPosition} follow lockX={false} lockY={false} lockZ={false}>
        {/* Aspect symbol */}
        <Text
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
