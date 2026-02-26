/**
 * ZodiacRing3D
 * Outer sign ring with dark-groove boundaries + inner decan wheel band.
 * Decans colored by traditional triplicity rulers. Each decan has a small sign label.
 */

import { useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { ZodiacSegment3D } from './types';
import {
  LAYOUT,
  CUSP_BLEND_DEGREES,
  DECAN_RULERS,
  SIGN_ORDER,
  SIGN_COLORS_3D,
  SIGN_SYMBOLS,
} from './constants';

interface ZodiacRing3DProps {
  segments: ZodiacSegment3D[];
}

// --- Decan inner ring radii ---
const DECAN_INNER = LAYOUT.zodiacRingInner - 0.55;
const DECAN_OUTER = LAYOUT.zodiacRingInner - 0.05;

/**
 * Outer zodiac ring — continuous geometry with dark-groove sign boundaries.
 * Each sign has its pure color; boundaries are darkened to create a clean seam.
 */
function createSignRingGeometry(
  innerR: number,
  outerR: number,
  segments: ZodiacSegment3D[],
): THREE.BufferGeometry {
  const totalSlices = 1080;
  const blendDeg = CUSP_BLEND_DEGREES;

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const signColors = segments.map((s) => new THREE.Color(s.color));

  for (let i = 0; i <= totalSlices; i++) {
    // Wrap to [0, 360) so the last vertex matches the first
    const deg = ((i / totalSlices) * 360) % 360;
    const angle = (deg * Math.PI) / 180;

    const signIndex = Math.floor(deg / 30) % 12;
    const degInSign = deg - signIndex * 30;

    const mainColor = signColors[signIndex];
    const distToStart = degInSign;
    const distToEnd = 30 - degInSign;
    const distToBoundary = Math.min(distToStart, distToEnd);

    let color: THREE.Color;
    if (distToBoundary < blendDeg) {
      const t = distToBoundary / blendDeg;
      const st = t * t * (3 - 2 * t);
      const brightness = 0.5 + 0.5 * st;
      color = mainColor.clone().multiplyScalar(brightness);
    } else {
      color = mainColor;
    }

    positions.push(Math.cos(angle) * innerR, 0, -Math.sin(angle) * innerR);
    colors.push(color.r, color.g, color.b);
    positions.push(Math.cos(angle) * outerR, 0, -Math.sin(angle) * outerR);
    colors.push(color.r, color.g, color.b);
  }

  for (let i = 0; i < totalSlices; i++) {
    const base = i * 2;
    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  return geo;
}

/**
 * Inner decan ring — 36 segments (3 per sign).
 * Each decan uses the COLOR of its traditional ruling sign (by triplicity).
 */
function createDecanRingGeometry(
  innerR: number,
  outerR: number,
): THREE.BufferGeometry {
  const slicesPerDecan = 20;
  const totalSlices = 36 * slicesPerDecan;

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const signColorsByIndex = SIGN_ORDER.map((name) => new THREE.Color(SIGN_COLORS_3D[name] ?? '#999'));

  for (let i = 0; i <= totalSlices; i++) {
    // Wrap to [0, 360) to avoid glitch at Pisces/Aries boundary
    const deg = ((i / totalSlices) * 360) % 360;
    const angle = (deg * Math.PI) / 180;

    const signIndex = Math.floor(deg / 30) % 12;
    const degInSign = deg - signIndex * 30;
    const decanIndex = Math.min(2, Math.floor(degInSign / 10));

    const rulerSignIndex = DECAN_RULERS[signIndex][decanIndex];
    const color = signColorsByIndex[rulerSignIndex];

    positions.push(Math.cos(angle) * innerR, 0.01, -Math.sin(angle) * innerR);
    colors.push(color.r, color.g, color.b);
    positions.push(Math.cos(angle) * outerR, 0.01, -Math.sin(angle) * outerR);
    colors.push(color.r, color.g, color.b);
  }

  for (let i = 0; i < totalSlices; i++) {
    const base = i * 2;
    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  return geo;
}

/** Sign symbol billboards — centered on outer ring */
function SignLabels({ segments }: { segments: ZodiacSegment3D[] }) {
  return (
    <>
      {segments.map((seg) => {
        const midAngle = (seg.startAngle + seg.endAngle) / 2;
        const r = (LAYOUT.zodiacRingInner + LAYOUT.zodiacRingOuter) / 2;
        const pos = new THREE.Vector3(Math.cos(midAngle) * r, 0.3, -Math.sin(midAngle) * r);

        return (
          <Billboard key={seg.name} position={pos}>
            <Text
              fontSize={0.5}
              color={seg.color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.04}
              outlineColor="#000000"
              fillOpacity={0.95}
            >
              {seg.symbol}
            </Text>
          </Billboard>
        );
      })}
    </>
  );
}

/** Decan ruler sign labels — small symbols on the inner decan wheel */
function DecanLabels() {
  const labels = useMemo(() => {
    const result: { pos: THREE.Vector3; symbol: string; color: string }[] = [];
    const r = (DECAN_INNER + DECAN_OUTER) / 2;

    for (let sign = 0; sign < 12; sign++) {
      for (let decan = 0; decan < 3; decan++) {
        const midDeg = sign * 30 + decan * 10 + 5; // center of each 10° segment
        const angle = (midDeg * Math.PI) / 180;
        const rulerIdx = DECAN_RULERS[sign][decan];
        result.push({
          pos: new THREE.Vector3(Math.cos(angle) * r, 0.15, -Math.sin(angle) * r),
          symbol: SIGN_SYMBOLS[rulerIdx],
          color: SIGN_COLORS_3D[SIGN_ORDER[rulerIdx]] ?? '#999',
        });
      }
    }
    return result;
  }, []);

  return (
    <>
      {labels.map((l, i) => (
        <Billboard key={i} position={l.pos}>
          <Text
            fontSize={0.22}
            color={l.color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            fillOpacity={0.8}
          >
            {l.symbol}
          </Text>
        </Billboard>
      ))}
    </>
  );
}

/** Decan divider lines — thin white radial lines at every 10° */
function DecanDividers() {
  const lines = useMemo(() => {
    const result: THREE.Line[] = [];
    for (let i = 0; i < 36; i++) {
      const deg = i * 10;
      const rad = (deg * Math.PI) / 180;
      const points = [
        new THREE.Vector3(Math.cos(rad) * DECAN_INNER, 0.02, -Math.sin(rad) * DECAN_INNER),
        new THREE.Vector3(Math.cos(rad) * DECAN_OUTER, 0.02, -Math.sin(rad) * DECAN_OUTER),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const isSignBoundary = deg % 30 === 0;
      const mat = new THREE.LineBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: isSignBoundary ? 0.5 : 0.25,
        depthWrite: false,
      });
      result.push(new THREE.Line(geo, mat));
    }
    return result;
  }, []);

  return (
    <>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </>
  );
}

/** Sign boundary markers on outer ring */
function SignBoundaryMarkers() {
  const lines = useMemo(() => {
    const result: THREE.Line[] = [];
    const innerR = LAYOUT.zodiacRingInner - 0.05;
    const outerR = LAYOUT.zodiacRingOuter + 0.05;

    for (let sign = 0; sign < 12; sign++) {
      const deg = sign * 30;
      const rad = (deg * Math.PI) / 180;
      const points = [
        new THREE.Vector3(Math.cos(rad) * innerR, 0.02, -Math.sin(rad) * innerR),
        new THREE.Vector3(Math.cos(rad) * outerR, 0.02, -Math.sin(rad) * outerR),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });
      result.push(new THREE.Line(geo, mat));
    }
    return result;
  }, []);

  return (
    <>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </>
  );
}

/** Thin edge circle */
function RingEdge({ radius, opacity }: { radius: number; opacity: number }) {
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, -Math.sin(a) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity, depthWrite: false });
    return new THREE.LineLoop(geo, mat);
  }, [radius, opacity]);

  return <primitive object={line} />;
}

export function ZodiacRing3D({ segments }: ZodiacRing3DProps) {
  const signRingGeo = useMemo(
    () => createSignRingGeometry(LAYOUT.zodiacRingInner, LAYOUT.zodiacRingOuter, segments),
    [segments],
  );

  const decanRingGeo = useMemo(
    () => createDecanRingGeometry(DECAN_INNER, DECAN_OUTER),
    [],
  );

  return (
    <group>
      {/* Outer sign ring */}
      <mesh geometry={signRingGeo}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner decan wheel — colored by triplicity rulers */}
      <mesh geometry={decanRingGeo}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Sign symbols on outer ring */}
      <SignLabels segments={segments} />

      {/* Decan ruler sign symbols on inner wheel */}
      <DecanLabels />

      {/* Sign boundary lines (outer ring) */}
      <SignBoundaryMarkers />

      {/* Decan divider lines (inner wheel) */}
      <DecanDividers />

      {/* Edge circles */}
      <RingEdge radius={DECAN_INNER} opacity={0.15} />
      <RingEdge radius={LAYOUT.zodiacRingInner} opacity={0.25} />
      <RingEdge radius={LAYOUT.zodiacRingOuter} opacity={0.25} />
    </group>
  );
}
