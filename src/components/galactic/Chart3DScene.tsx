/**
 * Chart3DScene
 * Just the 3D background environment — stars, cosmic dust, glow, lighting.
 * The 2D chart is rendered as a regular DOM overlay OUTSIDE the Canvas.
 */

import { useRef, useMemo } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StarField3D } from './StarField3D';

function CosmicDust() {
  const count = 150;
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 10;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = -1 + Math.random() * 4;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.008;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#6666AA" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export function Chart3DScene() {
  return (
    <>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={6}
        maxDistance={30}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.08}
      />

      <ambientLight intensity={0.9} color="#BBCCEE" />
      <directionalLight position={[0, 20, 0]} intensity={0.5} color="#FFFFFF" />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#6666CC" distance={15} decay={2} />

      <StarField3D />
      <CosmicDust />
      <color attach="background" args={['#050510']} />
      <fog attach="fog" args={['#050510', 50, 150]} />
      <mesh><sphereGeometry args={[120, 32, 32]} /><meshBasicMaterial color="#030308" side={THREE.BackSide} /></mesh>

      {/* Flat dark disc where the chart sits */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[9, 64]} />
        <meshStandardMaterial color="#0a0a1e" emissive="#111133" emissiveIntensity={0.05} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Subtle glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <ringGeometry args={[8, 11, 64]} />
        <meshBasicMaterial color="#334466" transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}
