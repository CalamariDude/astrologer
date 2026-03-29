/**
 * StarField3D
 * Background star field for the galactic scene
 */

import { Stars } from '@react-three/drei';

export function StarField3D() {
  return (
    <Stars
      radius={200}
      depth={80}
      count={3000}
      factor={4}
      saturation={0.2}
      fade
      speed={0.3}
    />
  );
}
