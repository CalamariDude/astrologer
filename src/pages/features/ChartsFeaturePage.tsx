import React from 'react';
import { FeaturePageLayout } from '@/components/landing/FeaturePageLayout';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { JogWheelDemo } from '@/components/landing/JogWheelDemo';

const GRID_ITEMS = [
  { icon: '\u2609', title: 'Natal Chart Wheel', description: 'Interactive zodiac wheel with houses, aspects, and planetary positions. Sub-arcsecond precision.' },
  { icon: '\u25A6', title: 'Aspect Grid', description: 'Full aspect table between all planets with orb values, color-coded by type.' },
  { icon: '\u2648', title: 'Profections', description: 'Annual profections mapping each year to a sign and its ruling planet.' },
  { icon: '\u2606', title: 'Planetary Activations', description: 'See which planets activate at your current age — one degree per year.' },
  { icon: '\u23F3', title: 'Transit Timeline', description: 'Major transits across the year, laid out so you can see what\'s ahead.' },
  { icon: '\u2195', title: 'Declination Panel', description: 'Parallel and contra-parallel aspects using planetary declination.' },
  { icon: '\u265B', title: 'Dignity Scoring', description: 'Essential and accidental dignities with point-based scoring for each planet.' },
  { icon: '\u2605', title: 'Fixed Stars', description: 'Major fixed stars with conjunctions to natal points.' },
  { icon: '\u2600', title: 'Solar Return Panel', description: 'Annual solar return chart calculation, right inside the tool.' },
  { icon: '\u263D', title: 'Lunar Return Panel', description: 'Monthly lunar return for short-term emotional themes.' },
  { icon: '\u2728', title: 'AI Reading', description: 'Ask questions about your chart and get thoughtful, personalized answers.', pro: true },
  { icon: '\u270E', title: 'Chart Notes', description: 'Add personal annotations to any chart. Notes sync across devices.' },
  { icon: '\u2328', title: 'Keyboard Shortcuts', description: 'Press 1\u20139 to switch tools. Cmd+K to search charts. Full keyboard nav.' },
  { icon: '\u25CB', title: 'Jog Wheel', description: 'Drag to scrub through time — hours, days, weeks, or months.' },
  { icon: '\u25A1', title: 'Multi-Tab Workspace', description: 'Open up to 10 charts in tabs. Drag to reorder, Cmd+1\u20139 to switch.' },
  { icon: '\u2B1A', title: 'Toolbar & Tooltips', description: 'Contextual toolbar with tooltips explaining every tool and glyph.' },
  { icon: '\u2B07', title: 'PNG Export', description: 'Export any chart as a high-resolution image.' },
  { icon: '\u2B50', title: 'Astro.com Import', description: 'Paste your Astro.com profile data and import every chart in seconds.' },
  { icon: '\u25C9', title: '10 Themes', description: 'Classic, Cosmic, Ocean, Parchment, Midnight, Sunset, Forest, Neon, Monochrome, Rose.' },
  { icon: '\u2699', title: 'Custom Orbs & Presets', description: 'Fine-tune orb settings and save chart configuration presets.' },
];

export default function ChartsFeaturePage() {
  return (
    <FeaturePageLayout
      pageTitle="Chart Analysis"
      tag="The Chart Tool"
      title="Everything you need in one workspace."
      description="A full-featured chart tool with 13 analysis panels, multi-tab support, and keyboard shortcuts for power users. The kind of tool you actually enjoy opening every day."
      gradient="bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent"
    >
      <FeatureShowcase
        tag="Natal Charts"
        headline={<>Your birth chart.<br className="hidden sm:block" /> Pixel-perfect.</>}
        body="Sub-arcsecond precision with full planetary positions, aspects, houses, and dignities. Enter your birth data and see your chart in seconds."
        visual={
          <div className="relative group">
            <div className="absolute -inset-10 bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
            <img src="/natal.webp" alt="Natal chart wheel" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
          </div>
        }
      />

      <FeatureShowcase
        tag="Profections"
        headline={<>Your year at<br className="hidden sm:block" /> a glance.</>}
        body="Annual profections map each year of your life to a zodiac sign and its ruling planet. See which house is activated and what themes are in play."
        reversed
        visual={
          <div className="relative group">
            <div className="absolute -inset-10 bg-gradient-to-br from-emerald-500/[0.07] to-teal-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
            <img src="/profections.webp" alt="Profections" loading="lazy" className="w-full max-w-[691px] sm:max-w-[761px] mx-auto h-auto relative drop-shadow-2xl rounded-2xl" />
          </div>
        }
      />

      <FeatureShowcase
        tag="Jog Wheel"
        headline={<>Scrub through<br className="hidden sm:block" /> time.</>}
        body="Drag clockwise to advance, counter-clockwise to rewind. Tap the center to switch between hours, days, weeks, or months. Watch planets glide into position."
        visual={<JogWheelDemo />}
      />

      <FeatureGrid items={GRID_ITEMS} columns={4} />
    </FeaturePageLayout>
  );
}
