import React from 'react';
import { Check, X } from 'lucide-react';
import { useFadeIn } from '@/hooks/useFadeIn';

const ROWS = [
  { feature: 'Free Natal Charts', astrologer: true, astrocom: true, solarfire: false, costar: true },
  { feature: 'Free Synastry', astrologer: true, astrocom: true, solarfire: false, costar: false },
  { feature: 'Free Composite Charts', astrologer: true, astrocom: true, solarfire: false, costar: false },
  { feature: 'Free Solar & Lunar Returns', astrologer: true, astrocom: true, solarfire: false, costar: false },
  { feature: 'Free Profections', astrologer: true, astrocom: false, solarfire: false, costar: false },
  { feature: 'Free Ephemeris Tables', astrologer: true, astrocom: true, solarfire: false, costar: false },
  { feature: '3D Galactic Visualization', astrologer: true, astrocom: false, solarfire: false, costar: false },
  { feature: 'Live Sessions & Replay', astrologer: true, astrocom: false, solarfire: false, costar: false },
  { feature: 'AI Chart Readings', astrologer: true, astrocom: false, solarfire: false, costar: true },
  { feature: 'Synastry Radar & Heatmap', astrologer: true, astrocom: false, solarfire: false, costar: false },
  { feature: 'Market/Stock Astrology', astrologer: true, astrocom: false, solarfire: false, costar: false },
  { feature: 'Community & Spaces', astrologer: true, astrocom: false, solarfire: false, costar: false },
  { feature: 'Runs in Browser (No Install)', astrologer: true, astrocom: true, solarfire: false, costar: true },
  { feature: '50+ Asteroids', astrologer: true, astrocom: true, solarfire: true, costar: false },
  { feature: '10 House Systems', astrologer: true, astrocom: true, solarfire: true, costar: false },
];

function CellIcon({ value }: { value: boolean }) {
  return value
    ? <Check className="w-4 h-4 text-emerald-400" />
    : <X className="w-4 h-4 text-white/15" />;
}

export function CompetitorComparison() {
  const fade = useFadeIn();

  return (
    <section className="relative z-10 bg-[#07050F] py-24 sm:py-32 px-4 sm:px-6">
      <div ref={fade.ref} style={fade.style} className={`max-w-5xl mx-auto ${fade.className}`}>
        <div className="text-center mb-12 sm:mb-16">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/25 mb-3">How We Compare</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            More features. Mostly free.
          </h2>
          <p className="text-base sm:text-lg text-white/35 mt-4 max-w-lg mx-auto">
            See how Astrologer stacks up against other popular astrology platforms.
          </p>
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left text-xs text-white/40 font-medium uppercase tracking-wider py-3 pr-4">Feature</th>
                <th className="text-center text-xs font-bold uppercase tracking-wider py-3 px-3 text-amber-400">Astrologer</th>
                <th className="text-center text-xs text-white/40 font-medium uppercase tracking-wider py-3 px-3">Astro.com</th>
                <th className="text-center text-xs text-white/40 font-medium uppercase tracking-wider py-3 px-3">Solar Fire</th>
                <th className="text-center text-xs text-white/40 font-medium uppercase tracking-wider py-3 px-3">Co-Star</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-white/[0.04]">
                  <td className="text-sm text-white/60 py-3 pr-4">{row.feature}</td>
                  <td className="text-center py-3 px-3"><div className="flex justify-center"><CellIcon value={row.astrologer} /></div></td>
                  <td className="text-center py-3 px-3"><div className="flex justify-center"><CellIcon value={row.astrocom} /></div></td>
                  <td className="text-center py-3 px-3"><div className="flex justify-center"><CellIcon value={row.solarfire} /></div></td>
                  <td className="text-center py-3 px-3"><div className="flex justify-center"><CellIcon value={row.costar} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
