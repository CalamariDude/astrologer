import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

interface EffectsProps {
  reduced?: boolean;
}

export function Effects({ reduced = false }: EffectsProps) {
  return (
    <EffectComposer multisampling={reduced ? 0 : 8}>
      <Bloom
        luminanceThreshold={0.3}
        luminanceSmoothing={0.4}
        intensity={reduced ? 2.2 : 2.5}
        mipmapBlur
        levels={reduced ? 4 : 5}
      />
      {!reduced && <Vignette eskil={false} offset={0.1} darkness={0.8} />}
    </EffectComposer>
  );
}
