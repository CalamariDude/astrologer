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

const DISC_Y = -1.5;
const DISC_RADIUS = 8.5;
const ICE_WALL_INNER = 8.5;
const ICE_WALL_OUTER = 9.4;
const CUSP_Y = -1.49;
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
  ctx.fillStyle = '#0c2340';
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  // Circular clip for the map
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, mapRadius, 0, Math.PI * 2);
  ctx.clip();

  // Ocean fill with radial gradient for depth
  const oceanGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, mapRadius);
  oceanGrad.addColorStop(0, '#0e2d50');
  oceanGrad.addColorStop(0.5, '#0c2340');
  oceanGrad.addColorStop(1, '#081a30');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  // In azimuthal equidistant projection:
  // North Pole at center, distances from pole are linear
  // lat 0 (equator) at ~50% radius, lat -90 (south pole) at edge
  const latToR = (lat: number) => ((90 - lat) / 180) * mapRadius;
  const toXY = (lat: number, lon: number): [number, number] => {
    const r = latToR(lat);
    const rad = (lon * Math.PI) / 180;
    return [cx + Math.cos(rad) * r, cy - Math.sin(rad) * r];
  };

  const drawLand = (points: [number, number][], color = '#2a6848') => {
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
    // Subtle coastline
    ctx.strokeStyle = 'rgba(80, 180, 130, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // North America (detailed)
  drawLand([
    [72, -168], [71, -155], [72, -140], [71, -130], [70, -120],
    [69, -105], [68, -95], [65, -85], [60, -75], [55, -65],
    [50, -57], [47, -53], [44, -59], [43, -65], [41, -70],
    [38, -75], [35, -75], [30, -81], [28, -82], [25, -80],
    [22, -85], [20, -87], [18, -88], [16, -86], [15, -88],
    [17, -96], [19, -105], [22, -105], [25, -110], [28, -114],
    [32, -117], [34, -119], [37, -122], [40, -124], [43, -124],
    [46, -124], [48, -123], [50, -127], [53, -130], [55, -132],
    [57, -136], [58, -140], [59, -147], [60, -150], [60, -155],
    [61, -160], [63, -165], [65, -168], [68, -168],
  ]);

  // Central America
  drawLand([
    [18, -88], [17, -90], [15, -87], [14, -88], [13, -84],
    [11, -84], [10, -83], [9, -79], [8, -77], [9, -76],
    [10, -75], [12, -75], [14, -83], [16, -86],
  ]);

  // Greenland
  drawLand([
    [77, -72], [78, -65], [79, -55], [80, -45], [81, -35],
    [80, -25], [78, -18], [76, -19], [74, -20], [72, -22],
    [70, -25], [68, -30], [66, -35], [65, -40], [65, -46],
    [66, -52], [68, -55], [70, -58], [72, -60], [74, -62],
    [76, -68],
  ]);

  // South America (detailed)
  drawLand([
    [12, -72], [11, -70], [10, -67], [8, -63], [7, -60],
    [5, -55], [3, -52], [1, -50], [-1, -48], [-3, -42],
    [-5, -37], [-7, -35], [-10, -37], [-13, -39], [-15, -40],
    [-18, -42], [-20, -44], [-23, -46], [-25, -48], [-28, -49],
    [-30, -51], [-33, -53], [-35, -57], [-38, -58], [-40, -62],
    [-42, -64], [-45, -66], [-48, -66], [-50, -68], [-52, -69],
    [-54, -70], [-55, -68], [-54, -65], [-52, -63], [-48, -65],
    [-45, -67], [-42, -65], [-38, -62], [-35, -58], [-32, -52],
    [-28, -49], [-24, -47], [-20, -42], [-18, -40], [-15, -40],
    [-12, -44], [-10, -48], [-7, -52], [-5, -58], [-3, -60],
    [-1, -62], [0, -65], [1, -68], [2, -70], [4, -72],
    [5, -74], [7, -76], [8, -78], [10, -78], [11, -76],
    [12, -75],
  ]);

  // Europe (detailed)
  drawLand([
    [71, -8], [70, 0], [70, 10], [70, 20], [69, 28],
    [68, 30], [65, 28], [62, 30], [60, 30], [58, 28],
    [56, 24], [55, 20], [54, 14], [53, 10], [52, 7],
    [51, 4], [50, 2], [49, 0], [48, -2], [47, -1],
    [46, -2], [44, -4], [43, -8], [42, -9], [40, -8],
    [38, -6], [37, -2], [36, -5], [37, -8], [38, -9],
    [36, -6], [36, 0], [37, 2], [38, 5], [39, 8],
    [40, 10], [41, 13], [42, 15], [43, 16], [44, 13],
    [45, 12], [46, 14], [47, 16], [48, 17], [49, 14],
    [50, 12], [51, 8], [52, 10], [54, 10], [55, 12],
    [57, 10], [59, 8], [60, 5], [62, 5], [64, 4],
    [66, 5], [68, 2], [69, -2], [70, -5],
  ]);

  // Scandinavia
  drawLand([
    [71, 25], [70, 28], [68, 30], [66, 26], [64, 22],
    [62, 18], [60, 16], [58, 14], [57, 12], [56, 10],
    [56, 8], [58, 6], [60, 5], [62, 8], [64, 10],
    [66, 12], [68, 15], [70, 18], [71, 22],
  ]);

  // Africa (detailed)
  drawLand([
    [37, -1], [37, 5], [36, 10], [34, 15], [33, 20],
    [32, 25], [31, 30], [30, 33], [28, 34], [25, 36],
    [22, 38], [18, 40], [15, 42], [12, 44], [10, 45],
    [8, 44], [5, 42], [2, 41], [0, 42], [-2, 42],
    [-5, 40], [-8, 38], [-10, 36], [-12, 38], [-15, 37],
    [-18, 36], [-20, 35], [-23, 33], [-25, 30], [-28, 28],
    [-30, 28], [-32, 27], [-34, 26], [-34, 22], [-34, 18],
    [-32, 16], [-30, 16], [-28, 16], [-25, 15], [-22, 14],
    [-18, 12], [-15, 12], [-12, 12], [-8, 10], [-5, 10],
    [-2, 9], [0, 8], [2, 6], [4, 5], [5, 2],
    [5, -2], [6, -5], [8, -8], [10, -12], [12, -15],
    [15, -17], [18, -16], [20, -16], [22, -15], [25, -14],
    [28, -12], [30, -10], [32, -6], [34, -3], [36, -2],
  ]);

  // Madagascar
  drawLand([
    [-12, 49], [-15, 50], [-18, 49], [-20, 47], [-22, 45],
    [-24, 44], [-25, 46], [-24, 48], [-22, 49], [-19, 49],
    [-16, 49], [-13, 48],
  ]);

  // Asia mainland (detailed)
  drawLand([
    [72, 30], [74, 40], [75, 50], [76, 60], [75, 70],
    [74, 80], [73, 90], [73, 100], [72, 110], [72, 120],
    [70, 130], [68, 140], [66, 145], [64, 150], [62, 155],
    [60, 160], [58, 162], [56, 160], [54, 155], [52, 150],
    [50, 142], [48, 138], [46, 135], [44, 132], [42, 130],
    [40, 128], [38, 125], [35, 122], [32, 120], [30, 118],
    [28, 115], [25, 110], [22, 108], [20, 105], [18, 102],
    [15, 100], [12, 100], [10, 102], [8, 104], [5, 105],
    [2, 103], [0, 100], [1, 97], [3, 92], [5, 85],
    [8, 80], [10, 78], [12, 77], [15, 75], [18, 73],
    [20, 70], [22, 68], [24, 65], [26, 60], [28, 55],
    [30, 50], [32, 48], [34, 44], [36, 40], [38, 36],
    [40, 33], [42, 32], [45, 30], [48, 30], [50, 30],
    [55, 30], [58, 30], [60, 30], [64, 30], [68, 30],
  ]);

  // India
  drawLand([
    [28, 68], [26, 70], [24, 72], [22, 74], [20, 76],
    [18, 78], [16, 79], [14, 79], [12, 78], [10, 77],
    [8, 77], [8, 74], [10, 72], [12, 73], [14, 74],
    [16, 74], [18, 73], [20, 72], [22, 70], [24, 68],
    [26, 68],
  ]);

  // Japan
  drawLand([
    [45, 140], [44, 142], [42, 143], [40, 141], [38, 140],
    [36, 138], [34, 136], [33, 133], [34, 131], [36, 132],
    [38, 134], [40, 136], [42, 138], [44, 140],
  ]);

  // Indonesia / SE Asia islands
  drawLand([
    [-2, 105], [-3, 108], [-5, 110], [-7, 112], [-8, 114],
    [-7, 116], [-5, 115], [-3, 112], [-1, 108], [0, 106],
  ]);
  drawLand([
    [-5, 118], [-6, 120], [-7, 125], [-8, 128], [-7, 130],
    [-5, 128], [-4, 125], [-3, 122], [-4, 119],
  ]);

  // New Zealand
  drawLand([
    [-35, 172], [-37, 175], [-40, 177], [-42, 176], [-45, 170],
    [-47, 167], [-46, 166], [-44, 168], [-42, 170], [-40, 172],
    [-38, 174], [-36, 173],
  ]);

  // UK / British Isles
  drawLand([
    [58, -6], [57, -3], [55, -2], [53, 0], [52, 1],
    [51, 0], [50, -2], [50, -5], [51, -5], [53, -4],
    [55, -5], [57, -5],
  ]);
  // Ireland
  drawLand([
    [55, -8], [54, -6], [53, -6], [52, -7], [52, -10],
    [53, -10], [54, -10], [55, -9],
  ]);

  // Australia (detailed)
  drawLand([
    [-12, 132], [-13, 136], [-14, 140], [-16, 144], [-18, 146],
    [-20, 148], [-22, 150], [-25, 152], [-28, 153], [-30, 153],
    [-33, 152], [-35, 150], [-37, 148], [-38, 145], [-38, 140],
    [-37, 137], [-36, 135], [-35, 132], [-34, 128], [-32, 124],
    [-30, 120], [-27, 116], [-24, 114], [-21, 114], [-18, 115],
    [-16, 118], [-14, 122], [-13, 126], [-12, 130],
  ]);

  // Tasmania
  drawLand([
    [-40, 145], [-41, 147], [-43, 148], [-43, 146], [-42, 144],
    [-41, 144],
  ]);

  // Antarctica ring near the outer edge
  ctx.beginPath();
  ctx.arc(cx, cy, mapRadius * 0.85, 0, Math.PI * 2);
  ctx.arc(cx, cy, mapRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = '#d0e4f0';
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Latitude grid (concentric circles)
  ctx.strokeStyle = 'rgba(120, 170, 220, 0.15)';
  ctx.lineWidth = 1;
  for (let lat = 60; lat >= -60; lat -= 30) {
    const r = latToR(lat);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Longitude grid (radial lines)
  ctx.strokeStyle = 'rgba(120, 170, 220, 0.12)';
  ctx.lineWidth = 1;
  for (let lon = 0; lon < 360; lon += 30) {
    const rad = (lon * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(rad) * mapRadius, cy - Math.sin(rad) * mapRadius);
    ctx.stroke();
  }

  // North pole glow
  const poleGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
  poleGlow.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  poleGlow.addColorStop(0.5, 'rgba(200, 220, 255, 0.2)');
  poleGlow.addColorStop(1, 'rgba(200, 220, 255, 0)');
  ctx.fillStyle = poleGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();

  // North pole dot
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Create the earth disc mesh imperatively */
function createDiscMesh(texture: THREE.CanvasTexture): THREE.Mesh {
  const geometry = new THREE.CircleGeometry(DISC_RADIUS, 128);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = DISC_Y;
  return mesh;
}

/** Create the ice wall ring mesh imperatively */
function createIceWallMesh(): THREE.Mesh {
  const geometry = new THREE.RingGeometry(ICE_WALL_INNER, ICE_WALL_OUTER, 128);
  const material = new THREE.MeshBasicMaterial({
    color: '#c8dce8',
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = DISC_Y - 0.005;
  return mesh;
}

/** Create the subtle glow ring at ice wall edge */
function createGlowRingMesh(): THREE.Mesh {
  const geometry = new THREE.RingGeometry(ICE_WALL_OUTER - 0.15, ICE_WALL_OUTER + 0.1, 128);
  const material = new THREE.MeshBasicMaterial({
    color: '#a0c4e0',
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = DISC_Y - 0.01;
  return mesh;
}

/** Create disc edge ring */
function createEdgeRing(): THREE.LineLoop {
  const segments = 128;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * DISC_RADIUS,
      DISC_Y + 0.005,
      -Math.sin(angle) * DISC_RADIUS,
    ));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: '#4a90c8',
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  return new THREE.LineLoop(geometry, material);
}

/** House cusp line projected onto the earth disc surface */
function EarthCuspLine({
  angle,
  color,
  opacity,
}: {
  angle: number;
  color: string;
  opacity: number;
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
    });
    return new THREE.Line(geometry, material);
  }, [angle, color, opacity]);

  return <primitive object={line} />;
}

export function FlatEarthDisc3D({ sectors, ascendant, midheaven }: FlatEarthDisc3DProps) {
  const discMesh = useMemo(() => {
    const texture = createEarthTexture();
    return createDiscMesh(texture);
  }, []);

  const iceWallMesh = useMemo(() => createIceWallMesh(), []);
  const glowRingMesh = useMemo(() => createGlowRingMesh(), []);
  const edgeRing = useMemo(() => createEdgeRing(), []);

  return (
    <group>
      {/* Earth disc with texture */}
      <primitive object={discMesh} />

      {/* Disc edge outline */}
      <primitive object={edgeRing} />

      {/* Ice wall ring */}
      <primitive object={iceWallMesh} />

      {/* Subtle glow ring on the ice wall edge */}
      <primitive object={glowRingMesh} />

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
            opacity={sector.isAngular ? 0.7 : 0.45}
          />
        );
      })}

      {/* ASC line on earth — gold */}
      {ascendant !== null && (
        <EarthCuspLine angle={ascendant} color="#fbbf24" opacity={0.9} />
      )}

      {/* MC line on earth — purple */}
      {midheaven !== null && (
        <EarthCuspLine angle={midheaven} color="#c4b5fd" opacity={0.85} />
      )}
    </group>
  );
}
