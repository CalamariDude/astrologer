import React from 'react';
import { useFadeIn } from '@/hooks/useFadeIn';

export function AboutSection() {
  const fade = useFadeIn();

  return (
    <section className="relative z-10 bg-background py-20 sm:py-28 px-4 sm:px-6">
      <div ref={fade.ref} style={fade.style} className={`max-w-xl mx-auto text-center ${fade.className}`}>
        <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-4">
          About Astrologer
        </h3>
        <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
          Hi, I'm Jad. I'm a student astrologer who built this to help myself learn — then friends started asking me to release it. So here it is.
        </p>
        <span className="inline-block mt-4 text-sm text-amber-600/70">
          Built with love and lots of ephemeris tables.
        </span>
      </div>
    </section>
  );
}
