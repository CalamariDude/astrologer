import React from 'react';
import { FeaturePageLayout } from '@/components/landing/FeaturePageLayout';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { FeatureGrid } from '@/components/landing/FeatureGrid';

const GRID_ITEMS = [
  { icon: '\u262F', title: 'BiWheel Chart', description: 'Two natal charts overlaid in a single wheel — see every connection at a glance.' },
  { icon: '\u25A6', title: 'Aspect Grid', description: 'Complete inter-chart aspect table with orbs and color-coded aspect types.' },
  { icon: '\u2593', title: 'Heatmap Matrix', description: 'Color-coded matrix showing which planet pairs interact most strongly.' },
  { icon: '\u2295', title: 'Composite Chart', description: 'Midpoint composite revealing the relationship\'s own identity and themes.' },
  { icon: '\u23F3', title: 'Progressed vs Progressed', description: 'Compare two secondary progressed charts to see how your relationship evolves over time.' },
  { icon: '\u2302', title: 'Relocated vs Relocated', description: 'Move both charts to a new location and see how the relationship dynamic shifts.' },
  { icon: '\u2728', title: 'AI Compatibility Reading', description: 'Ask the AI about your relationship dynamics and get personalized insights.', pro: true },
];

export default function SynastryFeaturePage() {
  return (
    <FeaturePageLayout
      pageTitle="Compatibility"
      tag="Compatibility"
      title="Understand how two charts connect."
      description="Synastry biwheels, composite charts, heatmaps, progressed-vs-progressed, relocated-vs-relocated, and AI readings — a suite of tools for relationship analysis."
      gradient="bg-gradient-to-br from-pink-500/20 via-violet-500/10 to-transparent"
    >
      <FeatureShowcase
        tag="Synastry"
        headline={<>Two charts.<br className="hidden sm:block" /> Every connection.</>}
        body="Overlay any two natal charts in a biwheel. Conjunctions, trines, squares — every aspect between two people, color-coded and interactive."
        visual={
          <div className="relative group">
            <div className="absolute -inset-10 bg-gradient-to-br from-blue-500/[0.07] to-violet-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
            <img src="/synastry.webp" alt="Synastry biwheel chart" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
          </div>
        }
      />

      <FeatureGrid items={GRID_ITEMS} columns={3} />
    </FeaturePageLayout>
  );
}
