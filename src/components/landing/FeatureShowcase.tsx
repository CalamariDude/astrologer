import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useFadeIn } from '@/hooks/useFadeIn';

export function FeatureShowcase({
  tag,
  headline,
  body,
  visual,
  reversed = false,
  dark = false,
  wideVisual = false,
  extraWideVisual = false,
  link,
  linkLabel,
}: {
  tag: string;
  headline: React.ReactNode;
  body: React.ReactNode;
  visual: React.ReactNode;
  reversed?: boolean;
  dark?: boolean;
  wideVisual?: boolean;
  extraWideVisual?: boolean;
  link?: string;
  linkLabel?: string;
}) {
  const textFade = useFadeIn(0);
  const visualFade = useFadeIn(200);

  return (
    <section className={`
      py-24 sm:py-32 md:py-40 px-4 sm:px-6 overflow-hidden
      ${dark ? 'bg-[#07050F]' : 'bg-background'}
    `}>
      {extraWideVisual ? (
        <div className="max-w-7xl mx-auto flex flex-col gap-12 sm:gap-16 items-center">
          <div
            ref={textFade.ref}
            style={textFade.style}
            className={`text-center max-w-xl ${textFade.className}`}
          >
            <div className={`
              text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-4 sm:mb-5
              ${dark ? 'text-amber-400/80' : 'text-amber-600'}
            `}>
              {tag}
            </div>
            <h2 className={`
              text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-bold tracking-tight leading-[1.08]
              ${dark ? 'text-white' : 'text-foreground'}
            `}>
              {headline}
            </h2>
            <p className={`
              mt-5 sm:mt-6 text-[15px] sm:text-base md:text-lg leading-relaxed
              ${dark ? 'text-white/45' : 'text-muted-foreground'}
            `}>
              {body}
            </p>
            {link && linkLabel && (
              <Link to={link} className="inline-flex items-center gap-1.5 text-sm text-amber-600/70 hover:text-amber-600 transition-colors mt-5">
                {linkLabel} <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div
            ref={visualFade.ref}
            style={visualFade.style}
            className={`w-full flex justify-center ${visualFade.className}`}
          >
            <div className="w-full">
              {visual}
            </div>
          </div>
        </div>
      ) : (
        <div className={`
          max-w-6xl mx-auto flex flex-col gap-12 sm:gap-16 lg:gap-24
          ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'}
          items-center
        `}>
          <div
            ref={textFade.ref}
            style={textFade.style}
            className={`flex-1 text-center lg:text-left max-w-xl ${textFade.className}`}
          >
            <div className={`
              text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-4 sm:mb-5
              ${dark ? 'text-amber-400/80' : 'text-amber-600'}
            `}>
              {tag}
            </div>
            <h2 className={`
              text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-bold tracking-tight leading-[1.08]
              ${dark ? 'text-white' : 'text-foreground'}
            `}>
              {headline}
            </h2>
            <p className={`
              mt-5 sm:mt-6 text-[15px] sm:text-base md:text-lg leading-relaxed
              ${dark ? 'text-white/45' : 'text-muted-foreground'}
            `}>
              {body}
            </p>
            {link && linkLabel && (
              <Link to={link} className="inline-flex items-center gap-1.5 text-sm text-amber-600/70 hover:text-amber-600 transition-colors mt-5">
                {linkLabel} <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div
            ref={visualFade.ref}
            style={visualFade.style}
            className={`flex-1 w-full flex justify-center ${visualFade.className}`}
          >
            <div className={wideVisual ? "w-full max-w-[899px] sm:max-w-[1106px] md:max-w-[1313px]" : "w-full max-w-[588px] sm:max-w-[691px] md:max-w-[761px]"}>
              {visual}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
