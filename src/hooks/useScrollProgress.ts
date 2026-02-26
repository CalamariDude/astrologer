import { useState, useEffect, useCallback } from 'react';

/**
 * Returns a normalized scroll progress value (0-1) over the first `scrollDistance` pixels.
 * Uses requestAnimationFrame for smooth, jank-free updates.
 */
export function useScrollProgress(scrollDistance = window.innerHeight * 1.5): number {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    const p = Math.min(1, Math.max(0, y / scrollDistance));
    setProgress(p);
  }, [scrollDistance]);

  useEffect(() => {
    let rafId: number;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll(); // initial

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [handleScroll]);

  return progress;
}
