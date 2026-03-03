import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface FeatureCategory {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number;
  color: string;
}

export function FeatureCategoryCard({ category }: { category: FeatureCategory }) {
  return (
    <Link
      to={category.href}
      className="group relative p-5 sm:p-6 rounded-2xl border border-border/50 bg-background hover:bg-muted/30 transition-all duration-300 hover:border-border hover:shadow-lg"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${category.color}10`, border: `1px solid ${category.color}20` }}>
          <div style={{ color: category.color }}>{category.icon}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-all group-hover:translate-x-0.5" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">{category.title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">{category.description}</p>
      <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: category.color }}>
        {category.count} features
      </div>
    </Link>
  );
}

const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "w-5 h-5" };

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    href: '/features/charts',
    icon: <svg {...iconProps}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5"/><line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="3" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21" y2="12"/></svg>,
    title: 'Chart Analysis',
    description: 'The full chart tool — natal wheels, aspect grids, 13 analysis panels, 10 themes, and keyboard shortcuts.',
    count: 20,
    color: '#d97706',
  },
  {
    href: '/features/compatibility',
    icon: <svg {...iconProps}><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/></svg>,
    title: 'Compatibility',
    description: 'Synastry biwheels, composite charts, radar plots, heatmaps, and relationship scoring.',
    count: 14,
    color: '#db2777',
  },
  {
    href: '/features/celebrities',
    icon: <svg {...iconProps}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    title: 'Celebrity Charts',
    description: '80 famous birth charts — actors, musicians, scientists, leaders — ready to explore.',
    count: 80,
    color: '#f59e0b',
  },
  {
    href: '/features/financial',
    icon: <svg {...iconProps}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    title: 'Financial Astrology',
    description: 'Company natal charts, live stock data, candlestick charts with transit overlays, and AI-labeled news.',
    count: 12,
    color: '#16a34a',
  },
  {
    href: '/features/advanced',
    icon: <svg {...iconProps}><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>,
    title: 'Advanced Techniques',
    description: 'Returns, progressions, rectification, 50+ asteroids, 10 house systems, and sidereal mode.',
    count: 18,
    color: '#0891b2',
  },
  {
    href: '/features/3d',
    icon: <svg {...iconProps}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    title: '3D Galactic Mode',
    description: 'Your natal chart rendered in real-time 3D with bloom lighting and cinematic orbits.',
    count: 8,
    color: '#8b5cf6',
  },
  {
    href: '/features/sessions',
    icon: <svg {...iconProps}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>,
    title: 'Live Sessions',
    description: 'Conduct live readings with chart sharing, recording, AI transcription, and instant replay.',
    count: 10,
    color: '#e11d48',
  },
  {
    href: '/features/community',
    icon: <svg {...iconProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: 'Community',
    description: 'Topic spaces, posts with embedded charts, follows, and moderation tools.',
    count: 10,
    color: '#2563eb',
  },
];
