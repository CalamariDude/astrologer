import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFadeIn } from '@/hooks/useFadeIn';
import { LandingLayout } from './LandingLayout';

export function FeaturePageLayout({
  title,
  pageTitle,
  tag,
  description,
  gradient,
  children,
}: {
  title: string;
  pageTitle: string;
  tag: string;
  description: string;
  gradient: string;
  children: React.ReactNode;
}) {
  const heroFade = useFadeIn();
  const ctaFade = useFadeIn();

  useEffect(() => {
    document.title = `${pageTitle} — Astrologer`;
    return () => { document.title = 'Astrologer'; };
  }, [pageTitle]);

  return (
    <LandingLayout darkZoneThreshold={0.15}>
      {/* Hero */}
      <section className="relative z-10 pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className={`absolute inset-0 ${gradient} opacity-30`} />
        <div
          ref={heroFade.ref}
          style={heroFade.style}
          className={`relative max-w-3xl mx-auto text-center ${heroFade.className}`}
        >
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-amber-400/80 mb-4">
            {tag}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white">
            {title}
          </h1>
          <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl leading-relaxed text-white/40 max-w-xl mx-auto">
            {description}
          </p>
        </div>
      </section>

      {/* Transition */}
      <div className="relative z-10 h-16 sm:h-24" style={{
        background: 'linear-gradient(to bottom, #07050F 0%, hsl(0 0% 100%) 100%)',
      }} />

      {/* Content */}
      {children}

      {/* CTA */}
      <section className="relative z-10 bg-[#07050F] py-24 sm:py-32 px-4 sm:px-6">
        <div ref={ctaFade.ref} style={ctaFade.style} className={`max-w-2xl mx-auto text-center space-y-6 ${ctaFade.className}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Try it now
          </h2>
          <p className="text-base sm:text-lg text-white/40 max-w-md mx-auto">
            Enter your birth details and start exploring — no account required.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg gap-2 mt-2 bg-amber-500 text-black hover:bg-amber-400 font-semibold">
              Open Astrologer
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </LandingLayout>
  );
}
