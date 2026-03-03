import { useState, useEffect } from 'react';

export function useIsTablet() {
  const [tablet, setTablet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    setTablet(mq.matches);
    const handler = (e: MediaQueryListEvent) => setTablet(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return tablet;
}
