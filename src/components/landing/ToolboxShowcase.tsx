import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useFadeIn } from '@/hooks/useFadeIn';

/* ------------------------------------------------------------------ */
/*  Mini panel previews for the toolbox showcase                       */
/* ------------------------------------------------------------------ */

function ZRMiniPanel() {
  const levels = [
    { label: 'L1', sign: 'Capricorn', years: '2019 \u2013 2046', active: true, element: 'earth' },
    { label: 'L2', sign: 'Cancer', years: 'Jan 2025 \u2013 Aug 2027', active: true, element: 'water' },
    { label: 'L3', sign: 'Virgo', years: 'Mar \u2013 Sep 2026', active: true, element: 'earth' },
  ];
  const elementColors: Record<string, string> = {
    earth: 'bg-emerald-500', water: 'bg-cyan-500', fire: 'bg-red-500', air: 'bg-sky-500',
  };

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-black/30">Zodiacal Releasing</div>
      {levels.map((l) => (
        <div key={l.label} className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-black/30 w-5">{l.label}</span>
          <div className={`w-1.5 h-1.5 rounded-full ${elementColors[l.element]}`} />
          <span className="text-sm font-medium text-black/70">{l.sign}</span>
          <span className="text-[9px] text-black/25 ml-auto">{l.years}</span>
        </div>
      ))}
      <div className="mt-2 rounded-md bg-emerald-500/[0.06] border border-emerald-500/10 px-2.5 py-1.5">
        <p className="text-[10px] text-emerald-700/70 leading-snug">
          Career structure and long-term ambition, with an emotional sub-theme of nurturing and home.
        </p>
      </div>
    </div>
  );
}

function FirdariaMiniPanel() {
  const planets = [
    { glyph: '\u2643', name: 'Jupiter', start: 0, end: 12, color: '#8b5cf6' },
    { glyph: '\u2642', name: 'Mars', start: 12, end: 19, color: '#ef4444' },
    { glyph: '\u2609', name: 'Sun', start: 19, end: 29, color: '#f59e0b' },
    { glyph: '\u2640', name: 'Venus', start: 29, end: 37, color: '#10b981' },
    { glyph: '\u263F', name: 'Mercury', start: 37, end: 50, color: '#06b6d4' },
    { glyph: '\u263D', name: 'Moon', start: 50, end: 59, color: '#94a3b8' },
    { glyph: '\u2644', name: 'Saturn', start: 59, end: 70, color: '#475569' },
  ];
  const nowPos = 42; // ~42% through life

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-black/30">Firdaria</div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{'\u263F'}</span>
        <div>
          <div className="text-sm font-semibold text-black/70">Mercury Period</div>
          <div className="text-[10px] text-black/35">Age 37 \u2013 50 \u00b7 Sub: Venus</div>
        </div>
      </div>
      <div className="relative h-5 rounded-full overflow-hidden bg-black/[0.04] border border-black/[0.06]">
        {planets.map((p) => (
          <div
            key={p.name}
            className="absolute top-0 h-full flex items-center justify-center"
            style={{
              left: `${(p.start / 70) * 100}%`,
              width: `${((p.end - p.start) / 70) * 100}%`,
              backgroundColor: p.color,
              opacity: 0.2,
            }}
          >
            <span className="text-[8px] font-bold" style={{ color: p.color, opacity: 1 }}>{p.glyph}</span>
          </div>
        ))}
        <div
          className="absolute top-0 h-full w-px bg-black/40"
          style={{ left: `${(nowPos / 70) * 100}%` }}
        />
        <div
          className="absolute -top-0.5 w-2 h-2 rounded-full bg-black/60 border-2 border-white"
          style={{ left: `${(nowPos / 70) * 100}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="rounded-md bg-cyan-500/[0.06] border border-cyan-500/10 px-2.5 py-1.5">
        <p className="text-[10px] text-cyan-700/70 leading-snug">
          Graceful expression, poetic language, social and artistic communication.
        </p>
      </div>
    </div>
  );
}

function PlanetaryHoursMiniPanel() {
  const hours = [
    { planet: '\u2609', name: 'Sun', time: '6:12', active: false },
    { planet: '\u2640', name: 'Venus', time: '7:18', active: false },
    { planet: '\u263F', name: 'Mercury', time: '8:24', active: true },
    { planet: '\u263D', name: 'Moon', time: '9:30', active: false },
    { planet: '\u2644', name: 'Saturn', time: '10:36', active: false },
    { planet: '\u2643', name: 'Jupiter', time: '11:42', active: false },
  ];

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-black/30">Planetary Hours</div>
      <div className="grid grid-cols-3 gap-1.5">
        {hours.map((h) => (
          <div
            key={h.time}
            className={`text-center px-1.5 py-2 rounded-lg border ${
              h.active
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-black/[0.02] border-black/[0.05]'
            }`}
          >
            <div className={`text-base ${h.active ? 'text-amber-600' : 'text-black/40'}`}>{h.planet}</div>
            <div className={`text-[9px] font-medium ${h.active ? 'text-amber-700/70' : 'text-black/30'}`}>{h.name}</div>
            <div className={`text-[8px] mt-0.5 ${h.active ? 'text-amber-600/50' : 'text-black/20'}`}>{h.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DominantElementMiniPanel() {
  const elements = [
    { name: 'Fire', pct: 38, color: '#ef4444' },
    { name: 'Earth', pct: 28, color: '#10b981' },
    { name: 'Air', pct: 22, color: '#0ea5e9' },
    { name: 'Water', pct: 12, color: '#06b6d4' },
  ];

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-black/30">Dominant Elements</div>
      <div className="space-y-1.5">
        {elements.map((e) => (
          <div key={e.name} className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-black/50 w-8">{e.name}</span>
            <div className="flex-1 h-2.5 rounded-full bg-black/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${e.pct}%`, backgroundColor: e.color, opacity: 0.6 }}
              />
            </div>
            <span className="text-[9px] text-black/30 w-7 text-right">{e.pct}%</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center text-[10px]">{'\u2642'}</div>
        <div>
          <div className="text-[10px] font-semibold text-black/60">Mars Dominant</div>
          <div className="text-[8px] text-black/30">Choleric Temperament</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tool count ticker                                                   */
/* ------------------------------------------------------------------ */

const TOOL_CATEGORIES = [
  { label: 'Timing Systems', count: 6, icon: '\u23F3' },
  { label: 'Chart Analysis', count: 4, icon: '\u2609' },
  { label: 'Traditional', count: 3, icon: '\u2721' },
  { label: 'Daily Tools', count: 4, icon: '\u263D' },
  { label: 'Chart Types', count: 3, icon: '\u2295' },
  { label: 'Visual Tools', count: 2, icon: '\u2B50' },
];

/* ------------------------------------------------------------------ */
/*  Main Export                                                         */
/* ------------------------------------------------------------------ */

export function ToolboxShowcase() {
  const textFade = useFadeIn(0);
  const visualFade = useFadeIn(200);

  return (
    <section className="relative py-24 sm:py-32 md:py-40 px-4 sm:px-6 overflow-hidden bg-background border-t border-border/30">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-violet-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div ref={textFade.ref} style={textFade.style} className={`text-center max-w-2xl mx-auto mb-12 sm:mb-16 ${textFade.className}`}>
          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 text-amber-600">
            Advanced Toolbox
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-600 rounded border border-amber-500/20">
              28 Tools
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
              Every technique.
              <br className="hidden sm:block" />
              One toolbox.
            </span>
          </h2>
          <p className="mt-6 sm:mt-8 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-xl mx-auto">
            Zodiacal releasing, firdaria, primary directions, planetary hours, dominant planets, sabian symbols, and 22 more tools used by working astrologers &mdash; all with built-in interpretations.
          </p>
        </div>

        {/* Category pills */}
        <div ref={visualFade.ref} style={visualFade.style} className={visualFade.className}>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-12">
            {TOOL_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-background text-sm"
              >
                <span className="text-base">{cat.icon}</span>
                <span className="text-xs font-medium text-foreground/70">{cat.label}</span>
                <span className="text-[9px] font-bold text-muted-foreground/40 ml-0.5">{cat.count}</span>
              </div>
            ))}
          </div>

          {/* Mock panels grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-black/[0.08] p-5 drop-shadow-sm">
              <ZRMiniPanel />
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.08] p-5 drop-shadow-sm">
              <FirdariaMiniPanel />
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.08] p-5 drop-shadow-sm">
              <PlanetaryHoursMiniPanel />
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.08] p-5 drop-shadow-sm">
              <DominantElementMiniPanel />
            </div>
          </div>

          <div className="text-center mt-8 sm:mt-10">
            <Link
              to="/chart"
              className="inline-flex items-center gap-1.5 text-sm text-amber-600/70 hover:text-amber-600 transition-colors"
            >
              Explore all 28 tools <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
