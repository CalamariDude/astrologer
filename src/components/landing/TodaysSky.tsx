import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useFadeIn } from '@/hooks/useFadeIn';

// ─── Sun sign from date ─────────────────────────────────────────────────────

function getSunInfo(date: Date) {
  const year = date.getFullYear();

  const signs = [
    { sign: 'Capricorn', glyph: '\u2651', element: 'Earth', quality: 'Cardinal', date: new Date(year - 1, 11, 22) },
    { sign: 'Aquarius', glyph: '\u2652', element: 'Air', quality: 'Fixed', date: new Date(year, 0, 20) },
    { sign: 'Pisces', glyph: '\u2653', element: 'Water', quality: 'Mutable', date: new Date(year, 1, 19) },
    { sign: 'Aries', glyph: '\u2648', element: 'Fire', quality: 'Cardinal', date: new Date(year, 2, 20) },
    { sign: 'Taurus', glyph: '\u2649', element: 'Earth', quality: 'Fixed', date: new Date(year, 3, 20) },
    { sign: 'Gemini', glyph: '\u264A', element: 'Air', quality: 'Mutable', date: new Date(year, 4, 21) },
    { sign: 'Cancer', glyph: '\u264B', element: 'Water', quality: 'Cardinal', date: new Date(year, 5, 21) },
    { sign: 'Leo', glyph: '\u264C', element: 'Fire', quality: 'Fixed', date: new Date(year, 6, 23) },
    { sign: 'Virgo', glyph: '\u264D', element: 'Earth', quality: 'Mutable', date: new Date(year, 7, 23) },
    { sign: 'Libra', glyph: '\u264E', element: 'Air', quality: 'Cardinal', date: new Date(year, 8, 23) },
    { sign: 'Scorpio', glyph: '\u264F', element: 'Water', quality: 'Fixed', date: new Date(year, 9, 23) },
    { sign: 'Sagittarius', glyph: '\u2650', element: 'Fire', quality: 'Mutable', date: new Date(year, 10, 22) },
    { sign: 'Capricorn', glyph: '\u2651', element: 'Earth', quality: 'Cardinal', date: new Date(year, 11, 22) },
  ];

  let current = signs[0];
  for (const s of signs) {
    if (date >= s.date) current = s;
  }

  const daysSince = Math.floor((date.getTime() - current.date.getTime()) / (1000 * 60 * 60 * 24));
  const degree = Math.min(daysSince, 29);

  return { sign: current.sign, glyph: current.glyph, element: current.element, quality: current.quality, degree };
}

// ─── Moon phase ─────────────────────────────────────────────────────────────

function getMoonPhase(date: Date) {
  const knownNewMoon = new Date(2000, 0, 6, 18, 14);
  const lunation = 29.53058867;
  const daysSince = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const phase = (((daysSince % lunation) + lunation) % lunation) / lunation;
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);

  let name: string;
  if (phase < 0.0625) name = 'New Moon';
  else if (phase < 0.1875) name = 'Waxing Crescent';
  else if (phase < 0.3125) name = 'First Quarter';
  else if (phase < 0.4375) name = 'Waxing Gibbous';
  else if (phase < 0.5625) name = 'Full Moon';
  else if (phase < 0.6875) name = 'Waning Gibbous';
  else if (phase < 0.8125) name = 'Last Quarter';
  else if (phase < 0.9375) name = 'Waning Crescent';
  else name = 'New Moon';

  return { phase, name, illumination };
}

// ─── Mercury retrograde ─────────────────────────────────────────────────────

function getMercuryStatus(date: Date) {
  const retrogrades: [Date, Date][] = [
    [new Date(2025, 2, 14), new Date(2025, 3, 7)],
    [new Date(2025, 6, 18), new Date(2025, 7, 11)],
    [new Date(2025, 10, 9), new Date(2025, 10, 29)],
    [new Date(2026, 1, 26), new Date(2026, 2, 20)],
    [new Date(2026, 5, 30), new Date(2026, 6, 22)],
    [new Date(2026, 9, 22), new Date(2026, 10, 12)],
    [new Date(2027, 1, 13), new Date(2027, 2, 8)],
    [new Date(2027, 5, 10), new Date(2027, 6, 4)],
    [new Date(2027, 9, 7), new Date(2027, 9, 28)],
  ];

  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  for (const [start, end] of retrogrades) {
    if (date >= start && date <= end) {
      return { retrograde: true, detail: `Goes direct ${end.toLocaleDateString('en-US', fmt)}` };
    }
  }

  const upcoming = retrogrades.filter(([start]) => start > date);
  if (upcoming.length > 0) {
    return { retrograde: false, detail: `Next retrograde ${upcoming[0][0].toLocaleDateString('en-US', fmt)}` };
  }

  return { retrograde: false, detail: '' };
}

// ─── Moon phase SVG ─────────────────────────────────────────────────────────

function MoonPhaseIcon({ phase }: { phase: number }) {
  // 0 = new, 0.5 = full. Draw a simple lit/dark split.
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  const fillOpacity = 0.1 + illumination * 0.7;

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0">
      <circle cx="10" cy="10" r="8" fill="currentColor" opacity={0.08} />
      <circle cx="10" cy="10" r="8" fill="currentColor" opacity={fillOpacity} />
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1" opacity={0.2} />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TodaysSky({ onOpenApp }: { onOpenApp: () => void }) {
  const fade = useFadeIn();
  const today = useMemo(() => new Date(), []);
  const sun = useMemo(() => getSunInfo(today), [today]);
  const moon = useMemo(() => getMoonPhase(today), [today]);
  const mercury = useMemo(() => getMercuryStatus(today), [today]);

  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section className="relative z-10 bg-background py-14 sm:py-18 px-4 sm:px-6">
      <div ref={fade.ref} style={fade.style} className={`max-w-4xl mx-auto ${fade.className}`}>
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/25 mb-0.5">
              Right now in the sky
            </div>
            <div className="text-sm text-muted-foreground">{dateStr}</div>
          </div>
          <button
            onClick={onOpenApp}
            className="hidden sm:inline-flex items-center gap-1 text-sm text-foreground/40 hover:text-foreground/70 transition-colors"
          >
            Create your chart <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Sun */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/40 bg-gradient-to-br from-amber-500/[0.04] to-transparent">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Sun</div>
                <div className="text-sm font-semibold text-foreground">
                  {sun.sign} {sun.degree}&deg;
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground/70">
              {sun.element} &middot; {sun.quality}
            </div>
          </div>

          {/* Moon */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/40 bg-gradient-to-br from-slate-500/[0.04] to-transparent">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-500/10 border border-slate-500/15 flex items-center justify-center text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Moon</div>
                <div className="text-sm font-semibold text-foreground">{moon.name}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground/70">{moon.illumination}% illuminated</div>
          </div>

          {/* Mercury */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border border-border/40 bg-gradient-to-br to-transparent ${
              mercury.retrograde ? 'from-rose-500/[0.04]' : 'from-emerald-500/[0.04]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                  mercury.retrograde
                    ? 'bg-rose-500/10 border-rose-500/15 text-rose-500'
                    : 'bg-emerald-500/10 border-emerald-500/15 text-emerald-600'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><circle cx="12" cy="14" r="5"/><line x1="12" y1="9" x2="12" y2="3"/><line x1="9" y1="5" x2="15" y2="5"/><path d="M8 20h8"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Mercury</div>
                <div
                  className={`text-sm font-semibold ${mercury.retrograde ? 'text-rose-500' : 'text-foreground'}`}
                >
                  {mercury.retrograde ? 'Retrograde' : 'Direct'}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground/70">{mercury.detail}</div>
          </div>
        </div>

        <button
          onClick={onOpenApp}
          className="sm:hidden inline-flex items-center gap-1 text-sm text-foreground/40 hover:text-foreground/70 transition-colors mt-4"
        >
          Create your chart <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
}
