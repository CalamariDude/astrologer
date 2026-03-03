import React from 'react';
import { FeaturePageLayout } from '@/components/landing/FeaturePageLayout';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { FeatureGrid } from '@/components/landing/FeatureGrid';

const GRID_ITEMS = [
  { icon: '\u21BB', title: 'Secondary Progressions', description: 'Day-for-a-year progressions showing the inner evolution of your chart over decades.' },
  { icon: '\u2609', title: 'Solar Arc Directions', description: 'All planets advanced by the Sun\'s daily motion — a powerful timing technique.' },
  { icon: '\u2600', title: 'Solar Returns', description: 'Chart for the moment the Sun returns to its natal position each year.' },
  { icon: '\u263D', title: 'Lunar Returns', description: 'Monthly return chart for short-term emotional themes and developments.' },
  { icon: '\u26A1', title: 'Transits to Natal', description: 'Current sky positions in aspect to your natal chart, with a full transit timeline.' },
  { icon: '\u2699', title: 'Rectification Workbench', description: 'Test different birth times side by side to find your most accurate Ascendant.' },
  { icon: '\u2604', title: '50+ Asteroids', description: 'Chiron, Eris, Sedna, Pholus, Eros, Ceres, Pallas, Juno, Vesta, and many more.' },
  { icon: '\u2605', title: 'Arabic Parts & Lots', description: 'Part of Fortune, Part of Spirit, and other traditional calculated points.' },
  { icon: '\u25CB', title: '10 House Systems', description: 'Placidus, Koch, Equal, Whole Sign, Porphyry, Regiomontanus, Campanus, Morinus, Alcabitius, Meridian.' },
  { icon: '\u2736', title: 'Sidereal Mode', description: 'Full sidereal zodiac support with Lahiri, Fagan-Bradley, and other ayanamsas.' },
  { icon: '\u25B3', title: 'Aspect Patterns', description: 'Grand Trines, T-Squares, Yods, Kites, Grand Crosses, and Mystic Rectangles.' },
  { icon: '\u2195', title: 'Declination Analysis', description: 'Parallel and contra-parallel aspects — the "hidden aspects" of astrology.' },
  { icon: '\u265B', title: 'Dignity Scoring', description: 'Essential and accidental dignities scored for every planet in your chart.' },
  { icon: '\u2606', title: 'Fixed Stars', description: 'Major fixed stars with conjunctions to natal points and interpretive context.' },
  { icon: '\u25CE', title: 'Graphic Ephemeris', description: 'Visual plot of planetary longitudes over time — see retrogrades and stations at a glance.' },
  { icon: '\u25A6', title: 'Ephemeris Tables', description: 'Daily planetary positions for any date range, ready to reference.' },
  { icon: '\u260A', title: 'True/Mean Node Toggle', description: 'Switch between True Node and Mean Node calculations with one click.' },
  { icon: '\u2B1A', title: 'Relocated Charts', description: 'Cast your natal chart for any location to see how your houses shift.', pro: true },
];

export default function AdvancedFeaturePage() {
  return (
    <FeaturePageLayout
      pageTitle="Advanced Techniques"
      tag="Advanced"
      title="For when you want to go deeper."
      description="Solar returns, progressions, rectification, 50+ asteroids, 10 house systems, sidereal mode, and every technique working astrologers rely on."
      gradient="bg-gradient-to-br from-cyan-500/20 via-teal-500/10 to-transparent"
    >
      <FeatureShowcase
        tag="Planetary Activations"
        headline={<>Every degree<br className="hidden sm:block" /> tells a story.</>}
        body="See which planets activate at your current age — one degree per year. A unique timeline showing exactly when each natal planet lights up across your lifetime."
        extraWideVisual
        visual={
          <div className="relative group">
            <div className="absolute -inset-10 bg-gradient-to-br from-teal-500/[0.07] to-cyan-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
            <img src="/agedegree.webp" alt="Planetary Activations timeline" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
          </div>
        }
      />

      <FeatureShowcase
        tag="50+ Asteroids"
        headline={<>Beyond the<br className="hidden sm:block" /> classical planets.</>}
        body="Chiron, Eris, Sedna, Pholus, Eros, and dozens more. Main Belt, Centaurs, Trans-Neptunian Objects, Arabic Parts, Lunar Points — toggle any combination on or off."
        reversed
        visual={
          <div className="relative group">
            <div className="absolute -inset-10 bg-gradient-to-br from-cyan-500/[0.07] to-blue-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
            <img src="/asteroids.webp" alt="Asteroid groups" loading="lazy" className="w-full max-w-[761px] sm:max-w-[864px] mx-auto h-auto relative drop-shadow-2xl rounded-2xl" />
          </div>
        }
      />

      <FeatureGrid items={GRID_ITEMS} columns={3} />
    </FeaturePageLayout>
  );
}
