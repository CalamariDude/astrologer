import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useFadeIn } from '@/hooks/useFadeIn';

interface BentoItem {
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
  large: boolean;
  bg?: string;
}

const BENTO_ITEMS: BentoItem[] = [
  {
    title: 'Natal Charts',
    subtitle: 'Your birth chart, beautifully rendered.',
    image: '/natal.webp',
    href: '/features/charts',
    large: true,
  },
  {
    title: 'Compatibility',
    subtitle: 'See how your chart connects with anyone.',
    image: '/synastry.webp',
    href: '/features/compatibility',
    large: true,
  },
  {
    title: 'Transit Timeline',
    subtitle: 'What the planets have planned for you.',
    image: '/transits.webp',
    href: '/features/charts',
    large: false,
  },
  {
    title: 'Profections',
    subtitle: 'Your year at a glance.',
    image: '/profections.webp',
    href: '/features/charts',
    large: false,
  },
  {
    title: '3D Galactic Mode',
    subtitle: 'Your chart in three dimensions.',
    image: '/galactic.webp',
    href: '/features/3d',
    large: false,
    bg: 'bg-muted/30',
  },
  {
    title: '80 Celebrity Charts',
    subtitle: 'Einstein, Beyonc\u00e9, Picasso, and more.',
    image: null,
    href: '/features/celebrities',
    large: false,
  },
];

const CELEBRITY_NAMES = [
  'Leonardo DiCaprio', 'Beyonc\u00e9', 'Albert Einstein', 'Frida Kahlo',
  'David Bowie', 'Marie Curie', 'Muhammad Ali', 'Virginia Woolf',
  'Nikola Tesla', 'Madonna', 'Picasso', 'Shakespeare',
];

function CelebrityCard({ item }: { item: BentoItem }) {
  return (
    <Link
      to={item.href}
      className="group relative rounded-2xl overflow-hidden border border-border/30 hover:border-amber-500/30 transition-all duration-300 hover:shadow-xl flex flex-col"
    >
      <div className="flex-1 p-4 sm:p-5 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-orange-500/[0.03]">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CELEBRITY_NAMES.map((name) => (
            <span
              key={name}
              className="text-[10px] px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground/60 bg-background/50"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-foreground font-semibold text-sm sm:text-base">{item.title}</h3>
            <p className="text-muted-foreground/60 text-xs sm:text-sm mt-0.5">{item.subtitle}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-amber-500/60 transition-colors flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

export function FeatureBento() {
  const fade = useFadeIn();

  return (
    <section className="relative z-10 bg-background py-20 sm:py-28 px-4 sm:px-6">
      <div ref={fade.ref} style={fade.style} className={`max-w-6xl mx-auto ${fade.className}`}>
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            A few of our favorite things.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mt-3 max-w-lg mx-auto">
            Charts, compatibility, transits, 3D visualization, and much more.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {BENTO_ITEMS.map((item) =>
            item.image === null ? (
              <CelebrityCard key={item.title} item={item} />
            ) : (
              <Link
                key={item.title}
                to={item.href}
                className={`group relative rounded-2xl overflow-hidden border border-border/30 hover:border-amber-500/30 transition-all duration-300 hover:shadow-xl flex flex-col ${
                  item.large ? 'lg:col-span-2' : ''
                } ${item.bg ?? 'bg-muted/20'}`}
              >
                <div className={`flex-1 flex items-center justify-center p-3 sm:p-4 ${item.large ? 'min-h-[200px] sm:min-h-[280px]' : 'min-h-[140px] sm:min-h-[180px]'}`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-contain rounded-lg drop-shadow-lg transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-foreground font-semibold text-sm sm:text-base">{item.title}</h3>
                      <p className="text-muted-foreground/60 text-xs sm:text-sm mt-0.5">{item.subtitle}</p>
                      <p className="text-amber-600/0 group-hover:text-amber-600/60 text-[11px] mt-1 transition-colors duration-300">Explore</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-amber-500/60 transition-colors flex-shrink-0" />
                  </div>
                </div>
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
