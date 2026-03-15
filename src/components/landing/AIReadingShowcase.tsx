import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFadeIn } from '@/hooks/useFadeIn';

/* ------------------------------------------------------------------ */
/*  Typewriter effect for the AI reading mock                          */
/* ------------------------------------------------------------------ */

const READING_LINES = [
  { type: 'heading', text: 'Sun in Scorpio in the 8th House' },
  {
    type: 'body',
    text: 'Your Sun in Scorpio occupies the 8th house, creating a powerful resonance between sign and house that amplifies themes of transformation, psychological depth, and regeneration.',
  },
  {
    type: 'body',
    text: 'This placement suggests someone who doesn\'t shy away from life\'s deeper questions \u2014 you are drawn to understand what lies beneath the surface, whether that means investigating hidden motivations, navigating complex emotional territory, or confronting taboos that others avoid.',
    cite: '1',
  },
  {
    type: 'body',
    text: 'With the Sun here, your sense of identity is forged through crisis and renewal. You may find that the most defining chapters of your life involve letting go of something in order to become something stronger.',
    cite: '2',
  },
  { type: 'heading', text: 'Moon Square Pluto' },
  {
    type: 'body',
    text: 'This aspect reveals an emotional life of extraordinary intensity. Your feelings run deep and are rarely simple \u2014 there is a compulsive quality to your emotional attachments that can be both your greatest source of power and your most persistent challenge.',
    cite: '3',
  },
];

function TypingCursor() {
  return <span className="inline-block w-0.5 h-4 bg-amber-500 animate-pulse ml-0.5 align-middle" />;
}

function AIReadingMock() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Start typing when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Typewriter
  useEffect(() => {
    if (!started || visibleLines >= READING_LINES.length) return;

    const currentLine = READING_LINES[visibleLines];
    const fullText = currentLine.text;

    if (charIndex < fullText.length) {
      const speed = currentLine.type === 'heading' ? 20 : 8;
      const timer = setTimeout(() => setCharIndex((c) => c + 2), speed);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setVisibleLines((l) => l + 1);
        setCharIndex(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [started, visibleLines, charIndex]);

  const suggestedQuestions = [
    'What does my chart say about relationships?',
    'Why do I keep attracting intense situations?',
    'What career path aligns with my chart?',
  ];

  return (
    <div ref={containerRef} className="relative group flex items-center justify-center">
      <div className="absolute -inset-10 bg-gradient-to-br from-amber-500/[0.06] to-violet-500/[0.03] rounded-[2rem] blur-3xl opacity-70" />
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-black/[0.08] drop-shadow-2xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] bg-black/[0.01]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-black/60">AI Chart Reading</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-black/30 font-medium">Streaming</span>
          </div>
        </div>

        {/* Suggested questions */}
        <div className="px-5 pt-4 pb-2 flex flex-wrap gap-1.5">
          {suggestedQuestions.map((q) => (
            <span
              key={q}
              className="text-[10px] px-2.5 py-1 rounded-full border border-amber-500/15 text-amber-700/50 bg-amber-500/[0.04]"
            >
              {q}
            </span>
          ))}
        </div>

        {/* Reading content */}
        <div className="px-5 pb-5 pt-2 space-y-3 min-h-[260px] sm:min-h-[300px]">
          {READING_LINES.slice(0, visibleLines + 1).map((line, i) => {
            const isCurrentLine = i === visibleLines;
            const displayText = isCurrentLine
              ? line.text.slice(0, charIndex)
              : line.text;

            if (line.type === 'heading') {
              return (
                <h4 key={i} className="text-sm font-bold text-black/80 pt-1">
                  {displayText}
                  {isCurrentLine && charIndex < line.text.length && <TypingCursor />}
                </h4>
              );
            }

            return (
              <p key={i} className="text-[13px] text-black/55 leading-relaxed">
                {displayText}
                {isCurrentLine && charIndex < line.text.length && <TypingCursor />}
                {(line as any).cite && (!isCurrentLine || charIndex >= line.text.length) && (
                  <sup className="text-[9px] font-semibold text-amber-600 ml-0.5 cursor-help">
                    [{(line as any).cite}]
                  </sup>
                )}
              </p>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-black/[0.05] bg-black/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-black/25">
            <span>Sub-arcsecond precision</span>
            <span>\u00b7</span>
            <span>Citations from your chart data</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Export                                                         */
/* ------------------------------------------------------------------ */

export function AIReadingShowcase({ onGetStarted }: { onGetStarted: () => void }) {
  const textFade = useFadeIn(0);
  const visualFade = useFadeIn(200);

  return (
    <section className="relative py-24 sm:py-32 md:py-40 px-4 sm:px-6 overflow-hidden bg-background border-t border-border/30">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-amber-500/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 sm:gap-16 lg:gap-20">
        {/* Text */}
        <div ref={textFade.ref} style={textFade.style} className={`flex-1 text-center lg:text-left max-w-xl ${textFade.className}`}>
          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 text-amber-600">
            AI Reading
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-600 rounded border border-amber-500/20">
              Pro
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-bold tracking-tight leading-[1.08]">
            Ask your chart
            <br className="hidden sm:block" />
            anything.
          </h2>
          <p className="mt-5 sm:mt-6 text-[15px] sm:text-base md:text-lg leading-relaxed text-muted-foreground">
            AI reads your full natal chart, transits, profections, and timing activations &mdash; then delivers a personalized interpretation with citations back to your actual planetary positions.
          </p>
          <div className="mt-5 sm:mt-6 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] text-amber-600">1</span>
              <span>Natal, synastry, and timing interpretations</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] text-amber-600">2</span>
              <span>Every claim traced to a specific placement</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] text-amber-600">3</span>
              <span>Ask follow-up questions in natural language</span>
            </div>
          </div>
          <div className="mt-7">
            <Button
              size="lg"
              className="h-12 px-8 text-base gap-2"
              onClick={onGetStarted}
            >
              Try a reading
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Visual */}
        <div ref={visualFade.ref} style={visualFade.style} className={`flex-1 w-full flex justify-center ${visualFade.className}`}>
          <div className="w-full max-w-xl">
            <AIReadingMock />
          </div>
        </div>
      </div>
    </section>
  );
}
