import { Stars } from '@react-three/drei';
import { STAR_CONFIG } from './constants';

export function StarField() {
  return (
    <Stars
      radius={STAR_CONFIG.radius}
      depth={STAR_CONFIG.depth}
      count={STAR_CONFIG.count}
      factor={STAR_CONFIG.factor}
      saturation={STAR_CONFIG.saturation}
      fade={STAR_CONFIG.fade}
      speed={STAR_CONFIG.speed}
    />
  );
}
