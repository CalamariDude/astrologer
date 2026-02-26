/**
 * EnergyFlowOverlay3D
 * When a planet is selected, shows 3D arced energy flows:
 *   1. From the house(s) the planet rules → to the planet (gold arcs)
 *   2. From the planet → to its dispositor / sign ruler (cyan arc)
 * Arcs rise above the XZ plane for dramatic 3D effect with animated particles.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { Planet3D, HouseSector3D } from './types';
import { LAYOUT, SIGN_RULERS, PLANET_RULERSHIPS, SIGN_ORDER } from './constants';

interface EnergyFlowOverlay3DProps {
  selectedPlanet: Planet3D;
  allPlanets: Planet3D[];
  houseSectors: HouseSector3D[];
}

/** Get sign name from house cusp longitude */
function signFromLongitude(longitude: number): string {
  const index = Math.floor(longitude / 30) % 12;
  return SIGN_ORDER[index];
}

/** Get midpoint position of a house sector on the XZ plane */
function houseMidpoint(sector: HouseSector3D): THREE.Vector3 {
  let midAngle = (sector.startAngle + sector.endAngle) / 2;
  const sweep = sector.endAngle - sector.startAngle;
  if (sweep <= 0) midAngle = sector.startAngle + ((sweep + Math.PI * 2) / 2);
  const r = LAYOUT.houseSectorRadius * 0.6;
  return new THREE.Vector3(
    Math.cos(midAngle) * r,
    0,
    -Math.sin(midAngle) * r,
  );
}

/** Create a smooth arc (QuadraticBezier) between two points, peaking above the XZ plane */
function createArcCurve(from: THREE.Vector3, to: THREE.Vector3, height: number): THREE.QuadraticBezierCurve3 {
  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  mid.y = height;
  return new THREE.QuadraticBezierCurve3(from, mid, to);
}

/** A single animated energy arc with glowing line + particles */
function EnergyArc({
  from,
  to,
  color,
  height,
  particleCount,
  speed,
  label,
  labelColor,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  height: number;
  particleCount: number;
  speed: number;
  label?: string;
  labelColor?: string;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.Line>(null);

  const curve = useMemo(() => createArcCurve(from, to, height), [from, to, height]);

  // Arc line geometry (many points for smooth curve)
  const lineGeo = useMemo(() => {
    const pts = curve.getPoints(64);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [curve]);

  const lineMat = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
  }, [color]);

  const line = useMemo(() => new THREE.Line(lineGeo, lineMat), [lineGeo, lineMat]);

  // Particles along the curve
  const { particleGeo, offsets } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const offs = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      offs[i] = i / particleCount;
      const pt = curve.getPoint(offs[i]);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return { particleGeo: geo, offsets: offs };
  }, [curve, particleCount]);

  const particleMat = useMemo(() => {
    return new THREE.PointsMaterial({
      color,
      size: 0.18,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, [color]);

  // Label position at peak of arc
  const labelPos = useMemo(() => {
    return curve.getPoint(0.5);
  }, [curve]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Animate particles flowing along the arc
    if (particlesRef.current) {
      const positions = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let phase = (offsets[i] + t * speed) % 1;
        if (phase < 0) phase += 1;
        const pt = curve.getPoint(phase);
        positions.setXYZ(i, pt.x, pt.y, pt.z);
      }
      positions.needsUpdate = true;
    }

    // Pulse line opacity
    if (lineRef.current) {
      lineMat.opacity = 0.35 + Math.sin(t * 2) * 0.15;
    }
  });

  return (
    <group>
      <primitive ref={lineRef} object={line} />
      <points ref={particlesRef} geometry={particleGeo} material={particleMat} />
      {label && (
        <Billboard position={[labelPos.x, labelPos.y + 0.3, labelPos.z]}>
          <Text
            fontSize={0.22}
            color={labelColor ?? color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            fillOpacity={0.85}
          >
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

export function EnergyFlowOverlay3D({
  selectedPlanet,
  allPlanets,
  houseSectors,
}: EnergyFlowOverlay3DProps) {
  // 1. Find which houses this planet rules
  //    → The planet rules signs, and we check which house cusp has that sign
  const ruledSigns = PLANET_RULERSHIPS[selectedPlanet.key] ?? [];

  const ruledHouses = useMemo(() => {
    if (ruledSigns.length === 0 || houseSectors.length === 0) return [];

    const results: { sector: HouseSector3D; sign: string }[] = [];

    for (const sector of houseSectors) {
      // Cusp longitude from startAngle (radians → degrees)
      const cuspDeg = ((sector.startAngle * 180) / Math.PI + 360) % 360;
      const cuspSign = signFromLongitude(cuspDeg);
      if (ruledSigns.includes(cuspSign)) {
        results.push({ sector, sign: cuspSign });
      }
    }
    return results;
  }, [ruledSigns, houseSectors]);

  // 2. Find the dispositor (planet that rules the sign this planet is in)
  const dispositorKey = SIGN_RULERS[selectedPlanet.sign] ?? null;
  const dispositor = useMemo(() => {
    if (!dispositorKey || dispositorKey === selectedPlanet.key) return null;
    return allPlanets.find((p) => p.key === dispositorKey) ?? null;
  }, [dispositorKey, selectedPlanet.key, allPlanets]);

  return (
    <group>
      {/* House → Planet arcs (gold): "This planet rules these houses" */}
      {ruledHouses.map(({ sector, sign }) => {
        const housePos = houseMidpoint(sector);
        return (
          <EnergyArc
            key={`house-${sector.number}`}
            from={housePos}
            to={selectedPlanet.position}
            color="#fbbf24"
            height={3.5}
            particleCount={10}
            speed={0.15}
            label={`Rules H${sector.number}`}
            labelColor="#fbbf24"
          />
        );
      })}

      {/* Planet → Dispositor arc (cyan): "Energy flows through sign ruler" */}
      {dispositor && (
        <EnergyArc
          from={selectedPlanet.position}
          to={dispositor.position}
          color="#4dd0e1"
          height={4.5}
          particleCount={8}
          speed={0.12}
          label={`→ ${dispositor.name} (${selectedPlanet.sign} ruler)`}
          labelColor="#4dd0e1"
        />
      )}
    </group>
  );
}
