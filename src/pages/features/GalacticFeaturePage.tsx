import React from 'react';
import { FeaturePageLayout } from '@/components/landing/FeaturePageLayout';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { useFadeIn } from '@/hooks/useFadeIn';

function GalacticHeroSection() {
  const textFade = useFadeIn(0);
  const visualFade = useFadeIn(200);

  return (
    <section className="relative py-32 sm:py-44 md:py-52 px-4 sm:px-6 overflow-hidden bg-[#07050F]">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5,
              height: Math.random() * 2 + 0.5,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.05,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto flex flex-col items-center gap-12 sm:gap-16">
        <div ref={textFade.ref} style={textFade.style} className={`text-center max-w-2xl ${textFade.className}`}>
          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 text-indigo-400/80">
            Galactic Mode
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/25 text-indigo-300 rounded border border-indigo-500/30">Beta</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Your chart<br className="hidden sm:block" /> in 3D.
            </span>
          </h2>
          <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl leading-relaxed text-white/40 max-w-xl mx-auto">
            Step inside your natal chart. Orbit around planets, watch aspects connect with glowing beams, and see the zodiac ring from angles a flat chart can never show. Rendered in real-time with Three.js.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {[
              'Real-Time 3D Rendering',
              'Bloom Lighting',
              'Cinematic Camera',
              'Interactive Labels',
              'Aspect Beams',
              'Transit Animation',
            ].map((label) => (
              <span key={label} className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs sm:text-sm">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div ref={visualFade.ref} style={visualFade.style} className={`w-full ${visualFade.className}`}>
          <div className="relative group">
            <div className="absolute -inset-12 bg-gradient-to-br from-indigo-500/[0.12] via-purple-500/[0.08] to-pink-500/[0.06] rounded-[3rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/30 opacity-60" />
            <img
              src="/galactic.webp"
              alt="Galactic Mode — 3D natal chart visualization"
              loading="lazy"
              className="w-full h-auto relative rounded-2xl drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const GRID_ITEMS = [
  { icon: '\u25CF', title: '3D Planet Spheres', description: 'Each planet rendered as a glowing sphere with color and size based on its nature.' },
  { icon: '\u2648', title: 'Zodiac Ring', description: 'Translucent zodiac belt with sign divisions and glyph markers in 3D space.' },
  { icon: '\u25A1', title: 'House Sectors', description: 'House sector planes showing the full house system geometry from any angle.' },
  { icon: '\u2194', title: 'Aspect Beams', description: 'Colored beams connecting aspected planets, with line style matching aspect type.' },
  { icon: '\u23F1', title: 'Transit Animation', description: 'Animate transiting planets moving through the chart in accelerated time.' },
  { icon: '\u25CB', title: 'Interactive Labels', description: 'Click any planet for detailed placement information — sign, degree, house.' },
  { icon: '\u2728', title: 'Bloom & Post-Processing', description: 'Neon bloom lighting and post-processing effects for a cinematic feel.' },
  { icon: '\u25B7', title: 'Camera Controls', description: 'Orbit, zoom, and pan freely. Or let the camera drift on its own.' },
];

export default function GalacticFeaturePage() {
  return (
    <FeaturePageLayout
      pageTitle="3D Galactic Mode"
      tag="3D Visualization"
      title="See your chart from a new perspective."
      description="Your natal chart rendered in real-time 3D with bloom lighting, aspect beams, and interactive planet labels. Still in beta — and already beautiful."
      gradient="bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/10"
    >
      <GalacticHeroSection />
      <FeatureGrid items={GRID_ITEMS} columns={4} />
    </FeaturePageLayout>
  );
}
