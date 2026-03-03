import React from 'react';
import { FeaturePageLayout } from '@/components/landing/FeaturePageLayout';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { FeatureGrid } from '@/components/landing/FeatureGrid';

const GRID_ITEMS = [
  { icon: '\u262F', title: 'BiWheel Chart', description: 'Two natal charts overlaid in a single wheel — see every connection at a glance.' },
  { icon: '\u25A6', title: 'Aspect Grid', description: 'Complete inter-chart aspect table with orbs and color-coded aspect types.' },
  { icon: '\u25CE', title: 'Radar Chart', description: 'Visual plot comparing compatibility across romance, communication, stability, and more.' },
  { icon: '\u2593', title: 'Heatmap Matrix', description: 'Color-coded matrix showing which planet pairs interact most strongly.' },
  { icon: '\u2261', title: 'Sankey Diagram', description: 'Flow diagram showing how energy moves between two charts by aspect type.' },
  { icon: '\u2295', title: 'Composite Chart', description: 'Midpoint composite revealing the relationship\'s own identity and themes.' },
  { icon: '\u25B3', title: 'Score Breakdown', description: 'Weighted compatibility score with category-by-category analysis.' },
  { icon: '\u2606', title: 'Attraction Timeline', description: 'How attraction and connection phases evolve over time between two charts.' },
  { icon: '\u2661', title: 'Marriage Indicators', description: 'Traditional marriage indicators drawn from composite and synastry aspects.' },
  { icon: '\u23F3', title: 'Longevity Analysis', description: 'Relationship durability assessment based on stabilizing aspects.' },
  { icon: '\u2302', title: 'Lifestyle Compatibility', description: 'How daily rhythms, domestic preferences, and values align.' },
  { icon: '\u2B12', title: 'House Overlays', description: 'See which houses each person\'s planets fall into in the other\'s chart.' },
  { icon: '\u25C6', title: 'Polarity & Stellium Bonuses', description: 'Extra scoring for element harmony and close conjunctions.' },
  { icon: '\u2728', title: 'AI Compatibility Reading', description: 'Ask the AI about your relationship dynamics and get personalized insights.', pro: true },
];

export default function SynastryFeaturePage() {
  return (
    <FeaturePageLayout
      pageTitle="Compatibility"
      tag="Compatibility"
      title="Understand how two charts connect."
      description="Synastry biwheels, composite charts, radar plots, heatmaps, Sankey diagrams, and compatibility scoring — a suite of tools for relationship analysis."
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
