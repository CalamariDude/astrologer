import React from 'react';
import { useFadeIn } from '@/hooks/useFadeIn';

export interface FeatureGridItem {
  icon: string;
  title: string;
  description: string;
  pro?: boolean;
}

export function FeatureGrid({
  items,
  columns = 3,
  dark = false,
}: {
  items: FeatureGridItem[];
  columns?: 2 | 3 | 4;
  dark?: boolean;
}) {
  const fade = useFadeIn();
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <section className={`py-20 sm:py-28 px-4 sm:px-6 ${dark ? 'bg-[#07050F]' : 'bg-background'}`}>
      <div
        ref={fade.ref}
        style={fade.style}
        className={`max-w-6xl mx-auto ${fade.className}`}
      >
        <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
          {items.map((item) => (
            <div
              key={item.title}
              className={`
                p-4 sm:p-5 rounded-2xl border transition-colors
                ${dark
                  ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  : 'border-border/50 bg-background hover:bg-muted/30'
                }
              `}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-semibold ${dark ? 'text-white/80' : 'text-foreground'}`}>
                    {item.title}
                  </h4>
                  {item.pro && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 rounded border border-amber-500/20">
                      Pro
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1.5 leading-relaxed ${dark ? 'text-white/30' : 'text-muted-foreground'}`}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
