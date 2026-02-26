import { Canvas } from '@react-three/fiber';
import { SolarSystem } from './SolarSystem';
import { Effects } from './Effects';

interface SpaceSceneProps {
  scrollProgress: number;
  visible: boolean;
  reduced?: boolean;
}

export default function SpaceScene({ scrollProgress, visible, reduced = false }: SpaceSceneProps) {
  return (
    <Canvas
      camera={{ position: [8, 20, 40], fov: 55, near: 0.1, far: 600 }}
      dpr={reduced ? 1 : [1, 1.5]}
      frameloop={visible ? 'always' : 'never'}
      gl={{
        antialias: !reduced,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      style={{ background: 'transparent' }}
    >
      <SolarSystem scrollProgress={scrollProgress} />
      <Effects reduced={reduced} />
    </Canvas>
  );
}
