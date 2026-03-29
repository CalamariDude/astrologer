import { useState, useEffect } from 'react';

/**
 * Detects whether the current device supports WebGL2.
 * Returns false on mobile devices or when WebGL is unavailable.
 */
export function useWebGLSupport(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setSupported(!!gl);
      // Clean up context
      if (gl) {
        const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}
