import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { PlanetConfig } from './constants';

/**
 * Generate Jupiter-style horizontal band texture.
 */
function makeBandTexture(): THREE.CanvasTexture {
  const w = 256, h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Jupiter's characteristic bands — alternating warm tones
  const bands: [number, string][] = [
    [0.00, '#C4956A'],  // north polar
    [0.08, '#D4A878'],
    [0.14, '#E8C8A0'],  // north temperate (light zone)
    [0.22, '#C89868'],  // north equatorial belt (dark)
    [0.30, '#D8B888'],
    [0.38, '#F0D8B0'],  // equatorial zone (bright cream)
    [0.46, '#C49060'],  // south equatorial belt (dark, wide — Great Red Spot area)
    [0.52, '#B07848'],  // darker band
    [0.58, '#C89868'],
    [0.66, '#E0C098'],  // south temperate zone (light)
    [0.74, '#C09060'],  // south temperate belt
    [0.82, '#D8B888'],
    [0.90, '#B88860'],
    [1.00, '#A07850'],  // south polar
  ];

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  for (const [stop, color] of bands) {
    gradient.addColorStop(stop, color);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Add subtle noise/turbulence to mimic gas swirls
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const noise = (Math.sin(x * 0.3 + y * 0.1) * Math.cos(x * 0.15 - y * 0.25) + Math.sin(x * 0.08 + y * 0.4)) * 8;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.5));
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generate a radial gradient texture for a glowing orb sprite.
 * Bright core fading to transparent — rendered with additive blending.
 */
function makeGlowTexture(color: THREE.Color): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  gradient.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gradient.addColorStop(0.15, `rgba(${r},${g},${b},0.6)`);
  gradient.addColorStop(0.4, `rgba(${r},${g},${b},0.2)`);
  gradient.addColorStop(0.7, `rgba(${r},${g},${b},0.05)`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

interface PlanetProps {
  config: PlanetConfig;
}

export function Planet({ config }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Group>(null);
  const angleRef = useRef(config.initialAngle);
  const moonAngleRef = useRef(0);
  const [hovered, setHovered] = useState(false);

  // Slight orbital tilt for visual depth
  const tilt = useMemo(() => (Math.random() - 0.5) * 0.3, []);

  // Glow texture — created once per planet
  const glowTexture = useMemo(() => makeGlowTexture(new THREE.Color(config.emissive)), [config.emissive]);

  // Band texture for gas giants
  const bandTexture = useMemo(() => config.bands ? makeBandTexture() : null, [config.bands]);

  // Moon glow texture
  const moonGlowTexture = useMemo(
    () => config.moon ? makeGlowTexture(new THREE.Color('#C0C0C0')) : null,
    [config.moon]
  );

  const onOver = useCallback(() => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const onOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = '';
  }, []);

  useFrame((_, delta) => {
    angleRef.current += config.speed * delta;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * config.orbitRadius;
      groupRef.current.position.z = Math.sin(angleRef.current) * config.orbitRadius;
      groupRef.current.position.y = Math.sin(angleRef.current * 0.5) * tilt;
    }
    // Moon orbits the planet
    if (config.moon && moonRef.current) {
      moonAngleRef.current += delta * 3.5;
      const moonDist = config.size * 2.8;
      moonRef.current.position.x = Math.cos(moonAngleRef.current) * moonDist;
      moonRef.current.position.z = Math.sin(moonAngleRef.current) * moonDist;
      moonRef.current.position.y = Math.sin(moonAngleRef.current * 0.8) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Invisible larger hit area for easier hovering */}
      <mesh onPointerOver={onOver} onPointerOut={onOut}>
        <sphereGeometry args={[Math.max(config.size * 2.5, 0.8), 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Planet body */}
      <mesh rotation={bandTexture ? [0.05, 0, 0] : undefined}>
        <sphereGeometry args={[config.size, 32, 32]} />
        {bandTexture ? (
          <meshStandardMaterial
            map={bandTexture}
            emissive={config.emissive}
            emissiveIntensity={hovered ? config.emissiveIntensity * 2 : config.emissiveIntensity}
            roughness={0.55}
            metalness={0.1}
          />
        ) : (
          <meshStandardMaterial
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={hovered ? config.emissiveIntensity * 2 : config.emissiveIntensity}
            roughness={0.6}
            metalness={0.15}
          />
        )}
      </mesh>

      {/* Glowing orb halo — additive-blended sprite */}
      <sprite scale={[config.size * 7, config.size * 7, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={hovered ? 0.8 : 0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Small point light on larger planets so they illuminate nearby space */}
      {config.size >= 0.5 && (
        <pointLight color={config.emissive} intensity={0.3} distance={config.size * 8} decay={2} />
      )}

      {/* Ring (Saturn, Uranus) */}
      {config.hasRing && (
        <mesh rotation={[Math.PI * 0.4, 0.15, 0.1]}>
          <torusGeometry args={[config.size * (config.ringSize || 2), config.size * 0.12, 2, 80]} />
          <meshBasicMaterial
            color={config.ringColor || config.color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Moon */}
      {config.moon && moonGlowTexture && (
        <group ref={moonRef}>
          <mesh>
            <sphereGeometry args={[config.size * 0.27, 16, 16]} />
            <meshStandardMaterial
              color="#C0C0C0"
              emissive="#C0C0C0"
              emissiveIntensity={0.5}
              roughness={0.7}
              metalness={0.1}
            />
          </mesh>
          <sprite scale={[config.size * 1.5, config.size * 1.5, 1]}>
            <spriteMaterial
              map={moonGlowTexture}
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
        </group>
      )}

      {/* Tooltip */}
      {hovered && (
        <Html
          center
          position={[0, config.size + 1.2, 0]}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
          zIndexRange={[50, 0]}
        >
          <div style={{
            background: 'rgba(10, 8, 20, 0.92)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${config.color}40`,
            borderRadius: 10,
            padding: '10px 14px',
            maxWidth: 220,
            whiteSpace: 'normal',
            boxShadow: `0 0 20px ${config.color}20, 0 4px 12px rgba(0,0,0,0.4)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20, color: config.color }}>{config.symbol}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '0.02em' }}>{config.name}</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              {config.description}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Faint orbital ring using a GL line loop — always renders as a clean 1px line
 * regardless of DPR or distance. No aliasing, no dashing.
 */
export function OrbitalRing({ radius }: { radius: number }) {
  const lineRef = useRef<THREE.LineLoop>(null);

  const geometry = useMemo(() => {
    const segments = 512;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.08, depthWrite: false }),
    []
  );

  return <primitive ref={lineRef} object={new THREE.LineLoop(geometry, material)} />;
}
