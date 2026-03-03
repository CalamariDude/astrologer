import React, { useState, useEffect, useRef } from 'react';

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 1200;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [started, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const STATS = [
  { value: 130, suffix: '+', label: 'Features' },
  { value: 50, suffix: '+', label: 'Asteroids' },
  { value: 10, suffix: '', label: 'House Systems' },
  { value: 21, suffix: '', label: 'Free Tools' },
];

export function StatsBar() {
  return (
    <section className="relative z-10 bg-background py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <span className="text-xs text-muted-foreground/60">Sub-arcsecond precision &mdash; professional-grade calculations</span>
        </div>
      </div>
    </section>
  );
}
