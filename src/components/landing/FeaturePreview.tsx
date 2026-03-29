import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useFadeIn } from '@/hooks/useFadeIn';

interface FeaturePreviewProps {
  tag: string;
  headline: string;
  description: string;
  pills: string[];
  pillColors: { border: string; text: string; bg: string };
  link: string;
  linkLabel: string;
  visual?: React.ReactNode;
  gradientClass: string;
}

export function FeaturePreview({
  tag,
  headline,
  description,
  pills,
  pillColors,
  link,
  linkLabel,
  visual,
  gradientClass,
}: FeaturePreviewProps) {
  const fade = useFadeIn();

  return (
    <section className="relative z-10 bg-background py-20 sm:py-28 px-4 sm:px-6">
      <div ref={fade.ref} style={fade.style} className={`max-w-3xl mx-auto text-center ${fade.className}`}>
        <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-4 sm:mb-5 text-amber-600">
          {tag}
        </div>
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.08] ${gradientClass} bg-clip-text text-transparent`}>
          {headline}
        </h2>
        <p className="mt-5 sm:mt-6 text-[15px] sm:text-base md:text-lg leading-relaxed text-muted-foreground max-w-xl mx-auto">
          {description}
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-6 sm:mt-8">
          {pills.map((pill) => (
            <span
              key={pill}
              className={`text-xs px-3 py-1 rounded-full border ${pillColors.border} ${pillColors.text} ${pillColors.bg}`}
            >
              {pill}
            </span>
          ))}
        </div>

        {visual && (
          <div className="mt-8 sm:mt-10">
            {visual}
          </div>
        )}

        <Link
          to={link}
          className="inline-flex items-center gap-1.5 text-sm text-amber-600/70 hover:text-amber-600 transition-colors mt-6 sm:mt-8"
        >
          {linkLabel} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
