/**
 * FlatEarthDisc3D
 * Renders a flat earth disc on the XZ plane below the orbital elements.
 * Features: procedural azimuthal equidistant projection texture,
 * ice wall ring around the edge, and house cusp divider lines.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { HouseSector3D } from './types';

interface FlatEarthDisc3DProps {
  sectors: HouseSector3D[];
  ascendant: number | null;
  midheaven: number | null;
}

const DISC_Y = -0.15;
const DISC_RADIUS = 8.5;
const ICE_WALL_INNER = 8.5;
const ICE_WALL_OUTER = 9.4;
const CUSP_Y = -0.14;
const TEXTURE_SIZE = 1024;

/** Generate the flat earth map texture procedurally using Canvas 2D */
function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d')!;
  const cx = TEXTURE_SIZE / 2;
  const cy = TEXTURE_SIZE / 2;
  const mapRadius = TEXTURE_SIZE / 2 - 20;

  // Ocean background
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  // Circular clip for the map
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, mapRadius, 0, Math.PI * 2);
  ctx.clip();

  // Ocean fill
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  // Draw simplified continents as azimuthal equidistant projection
  // In this projection, North Pole is center, distances from pole are linear
  // lat 0 (equator) is at ~50% radius, lat -90 (south pole) is at edge
  const latToR = (lat: number) => ((90 - lat) / 180) * mapRadius;
  const toXY = (lat: number, lon: number): [number, number] => {
    const r = latToR(lat);
    // Longitude: 0 = right, increases counter-clockwise (standard math)
    const rad = (lon * Math.PI) / 180;
    return [cx + Math.cos(rad) * r, cy - Math.sin(rad) * r];
  };

  // Helper to draw a landmass from an array of [lat, lon] points
  const drawLand = (points: [number, number][], color = '#1a3a2a') => {
    if (points.length < 3) return;
    ctx.beginPath();
    const [sx, sy] = toXY(points[0][0], points[0][1]);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < points.length; i++) {
      const [x, y] = toXY(points[i][0], points[i][1]);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  // Simplified continent outlines (azimuthal equidistant projection)

  // North America
  drawLand([
    [70, -170], [72, -140], [70, -100], [65, -65], [50, -55],
    [44, -65], [30, -80], [25, -80], [20, -100], [15, -90],
    [18, -105], [30, -115], [35, -120], [48, -125], [55, -130],
    [60, -140], [60, -165], [65, -170],
  ]);

  // South America
  drawLand([
    [12, -75], [10, -60], [5, -50], [0, -50], [-5, -35],
    [-15, -40], [-25, -50], [-35, -57], [-45, -65], [-55, -68],
    [-55, -75], [-45, -75], [-30, -70], [-20, -65], [-10, -77],
    [0, -80], [5, -77],
  ]);

  // Europe
  drawLand([
    [70, -10], [72, 25], [68, 30], [60, 30], [55, 25],
    [50, 5], [45, -5], [37, -8], [36, 0], [40, 5],
    [42, 15], [45, 15], [48, 18], [55, 15], [58, 10],
    [63, 5],
  ]);

  // Africa
  drawLand([
    [35, -5], [37, 10], [32, 32], [28, 33], [12, 43],
    [5, 42], [0, 42], [-5, 40], [-12, 40], [-20, 35],
    [-30, 30], [-34, 25], [-34, 18], [-28, 15], [-18, 12],
    [-5, 10], [0, 10], [5, -5], [5, -15], [15, -17],
    [20, -17], [25, -15], [30, -10],
  ]);

  // Asia (simplified big block)
  drawLand([
    [72, 30], [75, 60], [73, 100], [72, 130], [68, 170],
    [62, 175], [55, 140], [50, 130], [40, 130], [35, 128],
    [30, 120], [22, 110], [20, 100], [10, 105], [5, 103],
    [0, 100], [5, 80], [8, 77], [15, 75], [23, 70],
    [25, 55], [30, 48], [35, 35], [38, 30], [45, 30],
    [55, 30], [60, 30], [68, 30],
  ]);

  // Australia
  drawLand([
    [-12, 130], [-15, 140], [-20, 148], [-28, 153], [-35, 150],
    [-38, 145], [-35, 138], [-30, 130], [-25, 115], [-20, 115],
    [-15, 120], [-12, 125],
  ]);

  // Antarctica ring near the outer edge
  ctx.beginPath();
  ctx.arc(cx, cy, mapRadius * 0.88, 0, Math.PI * 2);
  ctx.arc(cx, cy, mapRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = '#c8dce8';
  ctx.globalAlpha = 0.3;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Subtle latitude grid (concentric circles)
  ctx.strokeStyle = 'rgba(100, 140, 180, 0.08)';
  ctx.lineWidth = 0.5;
  for (let lat = 60; lat >= -60; lat -= 30) {
    const r = latToR(lat);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Subtle longitude grid (radial lines)
  ctx.strokeStyle = 'rgba(100, 140, 180, 0.06)';
  ctx.lineWidth = 0.5;
  for (let lon = 0; lon < 360; lon += 30) {
    const rad = (lon * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(rad) * mapRadius, cy - Math.sin(rad) * mapRadius);
    ctx.stroke();
  }

  // North pole dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.4;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** House cusp line projected onto the earth disc surface */
function EarthCuspLine({
  angle,
  color,
  opacity,
  lineWidth,
}: {
  angle: number;
  color: string;
  opacity: number;
  lineWidth?: number;
}) {
  const line = useMemo(() => {
    const rad = (angle * Math.PI) / 180;
    const points = [
      new THREE.Vector3(0, CUSP_Y, 0),
      new THREE.Vector3(
        Math.cos(rad) * DISC_RADIUS,
        CUSP_Y,
        -Math.sin(rad) * DISC_RADIUS,
      ),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      linewidth: lineWidth ?? 1,
    });
    return new THREE.Line(geometry, material);
  }, [angle, color, opacity, lineWidth]);

  return <primitive object={line} />;
}

export function FlatEarthDisc3D({ sectors, ascendant, midheaven }: FlatEarthDisc3DProps) {
  const earthTexture = useMemo(() => createEarthTexture(), []);

  // Ice wall ring geometry
  const iceWallGeometry = useMemo(
    () => new THREE.RingGeometry(ICE_WALL_INNER, ICE_WALL_OUTER, 128),
    [],
  );

  return (
    <group>
      {/* Earth disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DISC_Y, 0]}>
        <circleGeometry args={[DISC_RADIUS, 128]} />
        <meshBasicMaterial
          map={earthTexture}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Ice wall ring */}
      <mesh
        geometry={iceWallGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, DISC_Y - 0.005, 0]}
      >
        <meshBasicMaterial
          color="#c8dce8"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Subtle glow ring on the ice wall edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DISC_Y - 0.01, 0]}>
        <ringGeometry args={[ICE_WALL_OUTER - 0.15, ICE_WALL_OUTER + 0.1, 128]} />
        <meshBasicMaterial
          color="#a0c4e0"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* House cusp lines on the earth surface */}
      {sectors.map((sector) => {
        const angleDeg = (sector.startAngle * 180) / Math.PI;
        const isAsc = ascendant !== null && Math.abs(angleDeg - ascendant) < 1;
        const isMc = midheaven !== null && Math.abs(angleDeg - midheaven) < 1;

        if (isAsc || isMc) return null;

        return (
          <EarthCuspLine
            key={`earth-cusp-${sector.number}`}
            angle={angleDeg}
            color={sector.isAngular ? '#a5b4fc' : '#94a3b8'}
            opacity={sector.isAngular ? 0.4 : 0.2}
          />
        );
      })}

      {/* ASC line on earth — gold */}
      {ascendant !== null && (
        <EarthCuspLine angle={ascendant} color="#fbbf24" opacity={0.7} lineWidth={2} />
      )}

      {/* MC line on earth — purple */}
      {midheaven !== null && (
        <EarthCuspLine angle={midheaven} color="#c4b5fd" opacity={0.6} lineWidth={2} />
      )}
    </group>
  );
}
