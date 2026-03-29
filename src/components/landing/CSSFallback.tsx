import React, { useMemo } from 'react';

/**
 * CSS-only animated star field with sun glow.
 * Used on mobile or when WebGL is unavailable.
 * Zero GPU overhead — pure CSS compositor animations.
 */
export function CSSFallback() {
  // Generate random star positions at mount time
  const stars = useMemo(() => {
    const layers: { count: number; size: number; opacity: number; duration: number }[] = [
      { count: 80, size: 1, opacity: 0.8, duration: 3 },
      { count: 50, size: 1.5, opacity: 0.6, duration: 4 },
      { count: 25, size: 2, opacity: 0.4, duration: 5 },
    ];

    return layers.map((layer, li) => {
      const positions: { x: number; y: number; delay: number }[] = [];
      for (let i = 0; i < layer.count; i++) {
        positions.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * layer.duration,
        });
      }
      return { ...layer, positions, key: li };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#07050F' }}>
      {/* Nebula gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 40% 40%, rgba(30, 15, 60, 0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(15, 25, 60, 0.3) 0%, transparent 50%)',
        }}
      />

      {/* Central sun glow */}
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '45%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 165, 0, 0.15) 0%, rgba(255, 140, 0, 0.06) 30%, transparent 70%)',
          animation: 'sunPulse 4s ease-in-out infinite',
        }}
      />

      {/* Sun core */}
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '45%',
          transform: 'translate(-50%, -50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #FFC040 0%, #FF8C00 60%, transparent 100%)',
          boxShadow: '0 0 30px 10px rgba(255, 165, 0, 0.2), 0 0 80px 30px rgba(255, 140, 0, 0.08)',
        }}
      />

      {/* Star layers */}
      {stars.map((layer) =>
        layer.positions.map((star, si) => (
          <div
            key={`${layer.key}-${si}`}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${layer.size}px`,
              height: `${layer.size}px`,
              backgroundColor: `rgba(255, 255, 255, ${layer.opacity})`,
              animation: `twinkle ${layer.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))
      )}

      {/* Keyframe styles */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes sunPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
