/**
 * HouseSectors3D
 * Flat translucent sectors, all 12 cusp lines extending through zodiac ring,
 * ASC/MC labels, house numbers
 */

import { useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { HouseSector3D } from './types';
import { LAYOUT } from './constants';

interface HouseSectors3DProps {
  sectors: HouseSector3D[];
  ascendant: number | null;
  midheaven: number | null;
}

/** Flat sector (pie slice) on the XZ plane */
function createSectorGeometry(startAngle: number, endAngle: number, radius: number): THREE.BufferGeometry {
  const segments = 32;
  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += Math.PI * 2;

  const vertices: number[] = [];
  const indices: number[] = [];

  // Center vertex
  vertices.push(0, 0, 0);

  // Arc vertices on XZ plane
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + t * sweep;
    vertices.push(
      Math.cos(angle) * radius,
      0,
      -Math.sin(angle) * radius,
    );
  }

  for (let i = 1; i <= segments; i++) {
    indices.push(0, i, i + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function HouseSector({ sector }: { sector: HouseSector3D }) {
  const geometry = useMemo(
    () => createSectorGeometry(sector.startAngle, sector.endAngle, LAYOUT.houseSectorRadius),
    [sector.startAngle, sector.endAngle],
  );

  // House label at ~40% radius, midpoint of arc
  const labelPos = useMemo(() => {
    let midAngle = (sector.startAngle + sector.endAngle) / 2;
    const sweep = sector.endAngle - sector.startAngle;
    if (sweep <= 0) midAngle = sector.startAngle + ((sweep + Math.PI * 2) / 2);
    const r = LAYOUT.houseSectorRadius * 0.4;
    return new THREE.Vector3(
      Math.cos(midAngle) * r,
      0.15,
      -Math.sin(midAngle) * r,
    );
  }, [sector.startAngle, sector.endAngle]);

  // Alternating opacity + brighter for angular houses
  const isEven = sector.number % 2 === 0;
  const opacity = sector.isAngular ? 0.1 : (isEven ? 0.03 : 0.06);
  const color = sector.isAngular ? '#6366f1' : '#64748b';
  const labelColor = sector.isAngular ? '#a5b4fc' : '#475569';

  return (
    <group>
      <mesh geometry={geometry} position={[0, -0.02, 0]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* House number — billboard so always readable */}
      <Billboard position={labelPos}>
        <Text
          fontSize={sector.isAngular ? 0.4 : 0.28}
          color={labelColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={sector.isAngular ? 0.8 : 0.5}
          outlineWidth={0.015}
          outlineColor="#000000"
        >
          {String(sector.number)}
        </Text>
      </Billboard>
    </group>
  );
}

/** Radial cusp line from center through zodiac ring outer edge */
function CuspLine({ angle, color, opacity }: { angle: number; color: string; opacity: number }) {
  const line = useMemo(() => {
    const rad = (angle * Math.PI) / 180;
    // Extend cusp lines all the way through the zodiac ring outer edge
    const outerR = LAYOUT.zodiacRingOuter + 0.2;
    const points = [
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(
        Math.cos(rad) * outerR,
        0.01,
        -Math.sin(rad) * outerR,
      ),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    return new THREE.Line(geometry, material);
  }, [angle, color, opacity]);

  return <primitive object={line} />;
}

/** Cusp label (ASC / MC) beyond the zodiac ring */
function CuspLabel({ angle, label, color }: { angle: number; label: string; color: string }) {
  const pos = useMemo(() => {
    const rad = (angle * Math.PI) / 180;
    const r = LAYOUT.zodiacRingOuter + 0.8;
    return new THREE.Vector3(Math.cos(rad) * r, 0.3, -Math.sin(rad) * r);
  }, [angle]);

  return (
    <Billboard position={pos}>
      <Text
        fontSize={0.35}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.025}
        outlineColor="#000000"
        fillOpacity={0.9}
        fontWeight="bold"
      >
        {label}
      </Text>
    </Billboard>
  );
}

export function HouseSectors3D({ sectors, ascendant, midheaven }: HouseSectors3DProps) {
  return (
    <group>
      {/* House sector fills */}
      {sectors.map((sector) => (
        <HouseSector key={sector.number} sector={sector} />
      ))}

      {/* All 12 cusp lines — extend through zodiac ring, bright */}
      {sectors.map((sector) => {
        const angleDeg = (sector.startAngle * 180) / Math.PI;
        const isAsc = ascendant !== null && Math.abs(angleDeg - ascendant) < 1;
        const isMc = midheaven !== null && Math.abs(angleDeg - midheaven) < 1;

        // Skip ASC/MC — rendered separately with special colors
        if (isAsc || isMc) return null;

        return (
          <CuspLine
            key={`cusp-${sector.number}`}
            angle={angleDeg}
            color={sector.isAngular ? '#a5b4fc' : '#94a3b8'}
            opacity={sector.isAngular ? 0.55 : 0.3}
          />
        );
      })}

      {/* Ascendant line + label (gold) — bright and prominent */}
      {ascendant !== null && (
        <>
          <CuspLine angle={ascendant} color="#fbbf24" opacity={0.85} />
          <CuspLabel angle={ascendant} label="ASC" color="#fbbf24" />
        </>
      )}

      {/* Midheaven line + label (purple) — bright */}
      {midheaven !== null && (
        <>
          <CuspLine angle={midheaven} color="#c4b5fd" opacity={0.75} />
          <CuspLabel angle={midheaven} label="MC" color="#c4b5fd" />
        </>
      )}

      {/* Orbit ring at house sector boundary */}
      <HouseRingEdge radius={LAYOUT.houseSectorRadius} />
    </group>
  );
}

/** Subtle circle at the edge of the house ring */
function HouseRingEdge({ radius }: { radius: number }) {
  const line = useMemo(() => {
    const segments = 128;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, -Math.sin(angle) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.08, depthWrite: false });
    return new THREE.LineLoop(geometry, material);
  }, [radius]);

  return <primitive object={line} />;
}
