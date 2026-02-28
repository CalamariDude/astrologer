import React, { useState, Suspense, lazy, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Check, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { CSSFallback } from '@/components/landing/CSSFallback';
import { JogWheelDemo } from '@/components/landing/JogWheelDemo';

const SpaceScene = lazy(() => import('@/components/landing/SpaceScene'));

// ─── Scroll-triggered animation ─────────────────────────────────────────

function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return {
    ref,
    className: 'will-change-transform',
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(50px)',
      transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    } as React.CSSProperties,
  };
}

// ─── Responsive hooks ───────────────────────────────────────────────────

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return mobile;
}

function useIsTablet() {
  const [tablet, setTablet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    setTablet(mq.matches);
    const handler = (e: MediaQueryListEvent) => setTablet(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return tablet;
}

// ─── Feature Showcase (Apple-style) ─────────────────────────────────────

function FeatureShowcase({
  tag,
  headline,
  body,
  visual,
  reversed = false,
  dark = false,
  wideVisual = false,
  extraWideVisual = false,
}: {
  tag: string;
  headline: React.ReactNode;
  body: React.ReactNode;
  visual: React.ReactNode;
  reversed?: boolean;
  dark?: boolean;
  wideVisual?: boolean;
  extraWideVisual?: boolean;
}) {
  const textFade = useFadeIn(0);
  const visualFade = useFadeIn(200);

  return (
    <section className={`
      py-24 sm:py-32 md:py-40 px-4 sm:px-6 overflow-hidden
      ${dark ? 'bg-[#07050F]' : 'bg-background'}
    `}>
      {extraWideVisual ? (
        <div className="max-w-7xl mx-auto flex flex-col gap-12 sm:gap-16 items-center">
          {/* Text centered on top */}
          <div
            ref={textFade.ref}
            style={textFade.style}
            className={`text-center max-w-xl ${textFade.className}`}
          >
            <div className={`
              text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-4 sm:mb-5
              ${dark ? 'text-amber-400/80' : 'text-amber-600'}
            `}>
              {tag}
            </div>
            <h2 className={`
              text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-bold tracking-tight leading-[1.08]
              ${dark ? 'text-white' : 'text-foreground'}
            `}>
              {headline}
            </h2>
            <p className={`
              mt-5 sm:mt-6 text-[15px] sm:text-base md:text-lg leading-relaxed
              ${dark ? 'text-white/45' : 'text-muted-foreground'}
            `}>
              {body}
            </p>
          </div>

          {/* Visual full-width below */}
          <div
            ref={visualFade.ref}
            style={visualFade.style}
            className={`w-full flex justify-center ${visualFade.className}`}
          >
            <div className="w-full">
              {visual}
            </div>
          </div>
        </div>
      ) : (
        <div className={`
          max-w-6xl mx-auto flex flex-col gap-12 sm:gap-16 lg:gap-24
          ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'}
          items-center
        `}>
          {/* Text side */}
          <div
            ref={textFade.ref}
            style={textFade.style}
            className={`flex-1 text-center lg:text-left max-w-xl ${textFade.className}`}
          >
            <div className={`
              text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-4 sm:mb-5
              ${dark ? 'text-amber-400/80' : 'text-amber-600'}
            `}>
              {tag}
            </div>
            <h2 className={`
              text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-bold tracking-tight leading-[1.08]
              ${dark ? 'text-white' : 'text-foreground'}
            `}>
              {headline}
            </h2>
            <p className={`
              mt-5 sm:mt-6 text-[15px] sm:text-base md:text-lg leading-relaxed
              ${dark ? 'text-white/45' : 'text-muted-foreground'}
            `}>
              {body}
            </p>
          </div>

          {/* Visual side */}
          <div
            ref={visualFade.ref}
            style={visualFade.style}
            className={`flex-1 w-full flex justify-center ${visualFade.className}`}
          >
            <div className={wideVisual ? "w-full max-w-[899px] sm:max-w-[1106px] md:max-w-[1313px]" : "w-full max-w-[588px] sm:max-w-[691px] md:max-w-[761px]"}>
              {visual}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Apple-style Pricing Toggle ─────────────────────────────────────────

function PricingToggle({ onSubscribe }: { onSubscribe: () => void }) {
  const [annual, setAnnual] = useState(true);

  const price = annual ? '$129.99' : '$14.99';
  const period = annual ? '/year' : '/month';
  const perMonth = annual ? '$10.83/mo' : null;

  return (
    <div className="space-y-8">
      {/* Toggle pill */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-white/[0.06] p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              !annual ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all relative ${
              annual ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Annual
            {!annual && (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
                -28%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Price card */}
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 sm:p-10 backdrop-blur-sm text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight">{price}</span>
          <span className="text-base text-white/30 font-normal">{period}</span>
        </div>
        {perMonth && (
          <div className="text-sm text-white/35 mt-1">That's just {perMonth}</div>
        )}

        {/* Features */}
        <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
          {[
            'Live Sessions with replay',
            'AI-powered chart interpretations',
            'Save unlimited charts',
            'Astrocartography maps',
            'Unlimited relocated charts',
            'PDF chart exports',
            'Priority support',
          ].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-white/60">{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          className="w-full mt-8 h-12 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-base font-semibold shadow-lg shadow-blue-500/20"
          onClick={onSubscribe}
        >
          Subscribe
        </Button>

        <p className="text-[11px] text-white/25 mt-4">Cancel anytime. Have a promo code? Apply it at checkout.</p>
      </div>
    </div>
  );
}

// ─── Galactic Mode Section Components ─────────────────────────────────

function GalacticSectionText() {
  const fade = useFadeIn(0);
  return (
    <div ref={fade.ref} style={fade.style} className={`text-center max-w-2xl ${fade.className}`}>
      <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 text-indigo-400/80">
        Galactic Mode
        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/25 text-indigo-300 rounded border border-indigo-500/30">Beta</span>
      </div>
      <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
        <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
          Your chart<br className="hidden sm:block" /> in 3D.
        </span>
      </h2>
      <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl leading-relaxed text-white/40 max-w-xl mx-auto">
        Step inside your natal chart. Orbit around planets, watch aspects pulse with energy, and animate transits through time — all rendered in real-time 3D with bloom lighting and post-processing effects.
      </p>
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        {[
          { label: 'Fly Through Space', icon: '🚀' },
          { label: 'Real-Time 3D Rendering', icon: '🌌' },
          { label: 'Neon Bloom Lighting', icon: '✨' },
          { label: 'Cinematic Camera Orbits', icon: '🎬' },
          { label: 'Animated Transit Trails', icon: '☄️' },
          { label: 'Interactive Planet Labels', icon: '🪐' },
        ].map((f) => (
          <span key={f.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs sm:text-sm">
            <span>{f.icon}</span>
            {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function GalacticSectionVisual() {
  const fade = useFadeIn(200);
  return (
    <div ref={fade.ref} style={fade.style} className={`w-full ${fade.className}`}>
      <div className="relative group">
        <div className="absolute -inset-12 bg-gradient-to-br from-indigo-500/[0.12] via-purple-500/[0.08] to-pink-500/[0.06] rounded-[3rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/30 opacity-60" />
        <img
          src="/galactic.webp"
          alt="Galactic Mode — 3D natal chart visualization"
          loading="lazy"
          className="w-full h-auto relative rounded-2xl drop-shadow-2xl"
        />
      </div>
    </div>
  );
}

// ─── FAQ Accordion ──────────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base sm:text-lg font-medium pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '300px' : '0', opacity: open ? 1 : 0 }}
      >
        <p className="pb-5 text-sm sm:text-base text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    question: 'Is Astrologer really free?',
    answer: 'Yes. Natal charts, synastry, composites, progressed charts, solar and lunar returns, transits, profections, ephemeris tables, declination analysis, 50+ asteroids — all completely free. Astrologer Pro adds AI interpretations, unlimited saved charts, astrocartography, and relocated charts.',
  },
  {
    question: 'How accurate are the calculations?',
    answer: 'Astrologer is powered by the Swiss Ephemeris — the same engine behind Solar Fire, Astro.com, and most professional astrology software. All calculations are accurate to sub-arcsecond precision.',
  },
  {
    question: 'Can I import charts from other apps?',
    answer: 'Yes. You can import all your saved charts from Astro.com with a single paste. Just copy your profile data from Astro.com and Astrologer will parse and import every chart automatically.',
  },
  {
    question: 'What devices does it work on?',
    answer: 'Astrologer runs in any modern browser — Mac, Windows, iPad, iPhone, Android, and Chromebook. No installation required. Your charts sync across every device.',
  },
  {
    question: 'What\'s included in Astrologer Pro?',
    answer: 'Live Sessions with recorded replay, AI-powered chart interpretations, unlimited saved charts, astrocartography maps, unlimited relocated charts, PDF exports, and priority support. $14.99/month or $129.99/year — cancel anytime.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes. Cancel anytime from your account settings. You\'ll keep Pro access until the end of your current billing period. No questions asked.',
  },
];

// ─── Zodiac sign SVG paths (12×12 coordinate space, stroke-only) ─────

const ZODIAC_GLYPHS = [
  'M3,10 C3,4 6,1 6,5.5 C6,1 9,4 9,10',                                                  // Aries
  'M3,4 C3,1 6,0 6,3 M9,4 C9,1 6,0 6,3 M3,7.5 A3,3 0 1,0 9,7.5 A3,3 0 1,0 3,7.5',      // Taurus
  'M3,1.5 L9,1.5 M3,10.5 L9,10.5 M4.5,1.5 L4.5,10.5 M7.5,1.5 L7.5,10.5',               // Gemini
  'M2,5 A3,3 0 0,1 8,5 M10,7 A3,3 0 0,1 4,7',                                             // Cancer
  'M4,3 A2,2 0 1,0 4,7 L8,7 C10,7 10,4 8,4',                                              // Leo
  'M2,2 L2,10 M2,5 Q4,2 5,5 L5,2 M5,5 Q7,2 8,5 L8,10 Q9,12 10,10',                      // Virgo
  'M2,10 L10,10 M6,7 Q2,7 2,3.5 Q2,0 6,0 Q10,0 10,3.5 Q10,7 6,7',                       // Libra
  'M2,2 L2,10 M2,5 Q4,2 5,5 L5,2 M5,5 L5,10 L7.5,8 M5.5,10.5 L7,10',                   // Scorpio
  'M3,9 L9,3 M6,3 L9,3 L9,6',                                                             // Sagittarius
  'M3,1 L3,6 Q3,10 5.5,9 Q7,8 7,6 Q7,3 9,3 Q11,3 11,6',                                 // Capricorn
  'M1,4 Q3.5,1 6,4 Q8.5,7 11,4 M1,8 Q3.5,5 6,8 Q8.5,11 11,8',                           // Aquarius
  'M2,6 L10,6 M4,1.5 Q1,6 4,10.5 M8,1.5 Q11,6 8,10.5',                                  // Pisces
];

// ─── Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollProgress = useScrollProgress();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const hasWebGL = useWebGLSupport();

  const show3D = hasWebGL;
  const sceneVisible = scrollProgress < 0.75;
  const sceneOpacity = Math.max(0, 1 - scrollProgress * 1.6);
  const inDarkZone = scrollProgress < 0.55;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [replayTab, setReplayTab] = useState<'Chapters' | 'Transcript' | 'Summary'>('Chapters');
  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const toolsFade = useFadeIn();
  const pricingFade = useFadeIn();
  const ctaFade = useFadeIn();

  return (
    <div className="min-h-screen" style={{ background: '#07050F' }}>

      {/* ── 3D / CSS Background ──────────────────────────────── */}
      {sceneOpacity > 0 && (
        <div className="fixed inset-0 z-0" style={{ opacity: sceneOpacity }} aria-hidden="true">
          {show3D && !prefersReducedMotion ? (
            <Suspense fallback={<CSSFallback />}>
              <SpaceScene scrollProgress={scrollProgress} visible={sceneVisible} reduced={isMobile} />
            </Suspense>
          ) : (
            <CSSFallback />
          )}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: inDarkZone ? 'rgba(7,5,15,0.3)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: inDarkZone ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-extralight tracking-[0.12em] uppercase transition-colors duration-500"
            style={{ fontFamily: "'Inter', system-ui, sans-serif", color: inDarkZone ? '#fff' : '#0a0a0a' }}>Astrologer</Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm hover:opacity-80 transition-colors duration-500"
              style={{ color: inDarkZone ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>Features</a>
            <a href="#pricing" className="text-sm hover:opacity-80 transition-colors duration-500"
              style={{ color: inDarkZone ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>Pricing</a>
            <Link to="/chart">
              <Button size="sm" className={inDarkZone ? 'bg-white text-black hover:bg-white/90' : ''}>Open App</Button>
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: inDarkZone ? '#fff' : '#0a0a0a' }}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-2"
            style={{ backgroundColor: inDarkZone ? 'rgba(7,5,15,0.95)' : 'rgba(255,255,255,0.95)' }}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm"
              style={{ color: inDarkZone ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm"
              style={{ color: inDarkZone ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Pricing</a>
            <Link to="/chart" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full mt-1">Open App</Button>
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex items-start justify-center px-4 sm:px-6 pt-[14vh] sm:pt-[16vh] pointer-events-none">
        <div className="text-center max-w-3xl mx-auto pointer-events-auto">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight tracking-[0.12em] leading-[1.05] text-white uppercase"
            style={{ fontFamily: "'Inter', system-ui, sans-serif", textShadow: '0 0 40px rgba(255,184,48,0.3), 0 0 80px rgba(255,140,0,0.15)' }}
          >
            Astrologer
          </h1>
          <p className="mt-2 text-sm sm:text-base tracking-[0.2em] uppercase text-white/35 font-light">
            Next Generation Astrology Software
          </p>
        </div>
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-white/20" />
        </div>
      </section>

      {/* ── Transition ───────────────────────────────────────── */}
      <div className="relative z-10 h-24 sm:h-32" style={{
        background: 'linear-gradient(to bottom, #07050F 0%, hsl(0 0% 100%) 100%)',
      }} />

      {/* ── Feature Showcases ────────────────────────────────── */}
      <div className="relative z-10" id="features">

        <FeatureShowcase
          tag="Natal Charts"
          headline={<>Your birth chart.<br className="hidden sm:block" /> Pixel-perfect.</>}
          body="Powered by the Swiss Ephemeris — the same engine behind most professional astrology software. Every degree, every minute of arc, calculated to sub-arcsecond accuracy. Enter your birth data and see your chart in seconds."
          visual={
            <div className="relative group">
              <div className="absolute -inset-10 bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <img src="/natal.webp" alt="Natal chart wheel" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
            </div>
          }
        />

        <FeatureShowcase
          tag="Synastry"
          headline={<>See how two<br className="hidden sm:block" /> charts align.</>}
          body="Overlay any two natal charts in a stunning biwheel. Conjunctions, trines, squares — every aspect between two people, instantly visible."
          reversed
          visual={
            <div className="relative group">
              <div className="absolute -inset-10 bg-gradient-to-br from-blue-500/[0.07] to-violet-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <img src="/synastry.webp" alt="Synastry biwheel chart" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
            </div>
          }
        />

        <FeatureShowcase
          tag="Profections"
          headline={<>Your year at<br className="hidden sm:block" /> a glance.</>}
          body="Annual profections map each year of your life to a zodiac sign and its ruling planet. See which house is activated, who your time lord is, and what themes are in play right now."
          visual={
            <div className="relative group">
              <div className="absolute -inset-10 bg-gradient-to-br from-emerald-500/[0.07] to-teal-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <img src="/profections.webp" alt="Profections current year card" loading="lazy" className="w-full max-w-[691px] sm:max-w-[761px] mx-auto h-auto relative drop-shadow-2xl rounded-2xl" />
            </div>
          }
        />

        <FeatureShowcase
          tag="Age-Degree Activations"
          headline={<>Every degree<br className="hidden sm:block" /> tells a story.</>}
          body="See which planets activate at your current age — one degree per year. A unique timeline view showing exactly when each natal planet lights up across your lifetime."
          reversed
          extraWideVisual
          visual={
            <div className="relative group">
              <div className="absolute -inset-10 bg-gradient-to-br from-teal-500/[0.07] to-cyan-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <img src="/agedegree.webp" alt="Age-Degree Activations timeline" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
            </div>
          }
        />

        <FeatureShowcase
          tag="Transit Timeline"
          headline={<>See what's<br className="hidden sm:block" /> coming.</>}
          body="Know when Saturn crosses your Ascendant or Jupiter trines your Venus. Every major transit, beautifully laid out across the entire year so you can plan ahead."
          extraWideVisual
          visual={
            <div className="relative group">
              <div className="absolute -inset-10 bg-gradient-to-br from-red-500/[0.07] to-orange-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <img src="/transits.webp" alt="Transit timeline" loading="lazy" className="w-[60%] mx-auto h-auto relative drop-shadow-2xl rounded-2xl" />
            </div>
          }
        />

        <FeatureShowcase
          tag="Transit Jog Wheel"
          headline={<>Scrub through<br className="hidden sm:block" /> time.</>}
          body="Drag the dial clockwise to advance, counter-clockwise to rewind. Tap the center to switch between hours, days, weeks, or months. Watch every planet glide into its new position in real time."
          reversed
          visual={<JogWheelDemo />}
        />

        {/* Galactic Mode — immersive 3D hero section */}
        <section className="relative py-32 sm:py-44 md:py-52 px-4 sm:px-6 overflow-hidden bg-[#07050F]">
          {/* Starfield background */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() * 2 + 0.5,
                  height: Math.random() * 2 + 0.5,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.3 + 0.05,
                }}
              />
            ))}
          </div>

          <div className="relative max-w-7xl mx-auto flex flex-col items-center gap-12 sm:gap-16">
            {/* Text */}
            <GalacticSectionText />

            {/* Screenshot */}
            <GalacticSectionVisual />
          </div>
        </section>

        <FeatureShowcase
          tag="Pro — Astrocartography"
          headline={<>Find your place<br className="hidden sm:block" /> on the planet.</>}
          body="Your planetary lines drawn across the entire globe. Discover where your Sun brings vitality, where Venus attracts love, or where Jupiter expands opportunity."
          dark
          visual={
            <div className="relative group">
              <div className="absolute -inset-10 bg-gradient-to-br from-purple-500/[0.08] to-pink-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <img src="/astrocartography.webp" alt="Astrocartography planetary lines on world map" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
              <div className="absolute -bottom-12 inset-x-0 text-center">
                <span className="inline-block px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em]">
                  Astrologer Pro
                </span>
              </div>
            </div>
          }
        />

        <FeatureShowcase
          tag="Lightning Fast"
          headline={<>Zero friction.<br className="hidden sm:block" /> Zero waiting.</>}
          body="Natal, synastry, composite, progressed, relocated — every mode one tap away. Switch charts, swap people, toggle transits. No loading screens, no page reloads. Built for speed so you stay in flow."
          visual={
            <div className="relative group">
              <div className="absolute -inset-10 bg-gradient-to-br from-violet-500/[0.07] to-indigo-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <img src="/toolbar.webp" alt="Chart mode switcher toolbar" loading="lazy" className="w-full max-w-[300px] sm:max-w-[340px] mx-auto h-auto relative drop-shadow-2xl rounded-2xl" />
            </div>
          }
        />

        {/* ── Chart Tabs ── */}
        <FeatureShowcase
          tag="Multi-Chart Workspace"
          headline={<>Ten charts.<br className="hidden sm:block" /> One workspace.</>}
          body="Open multiple natal, synastry, and composite charts side by side. Switch between clients instantly — no page reloads, no lost state. Each tab preserves its full chart configuration."
          visual={
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-10 bg-gradient-to-br from-sky-500/[0.07] to-violet-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <div className="relative bg-[#0d1117] rounded-2xl border border-white/10 p-5 sm:p-6 w-full max-w-sm drop-shadow-2xl">
                {/* Tab bar */}
                <div className="flex items-center gap-1 mb-4">
                  {[
                    { name: 'Sarah', type: 'Natal', active: true },
                    { name: 'John & Maya', type: 'Synastry', active: false },
                    { name: 'New Chart', type: '', active: false },
                  ].map((tab) => (
                    <div
                      key={tab.name}
                      className={`group/tab relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        tab.active
                          ? 'bg-violet-500/15 border border-violet-500/30 text-white/90'
                          : 'bg-white/[0.03] border border-white/[0.06] text-white/35 hover:text-white/50'
                      }`}
                    >
                      <span className="truncate max-w-[80px]">{tab.name}</span>
                      {tab.type && <span className="text-[9px] uppercase tracking-wider text-white/20">{tab.type}</span>}
                      <span className="text-white/15 text-xs ml-0.5 opacity-0 group-hover/tab:opacity-100 transition-opacity cursor-pointer">&times;</span>
                    </div>
                  ))}
                  {/* Add tab button */}
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/25 hover:text-white/40 transition-colors cursor-pointer text-lg leading-none">
                    +
                  </div>
                </div>
                {/* Active chart area */}
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">S</div>
                      <div>
                        <div className="text-xs text-white/70 font-medium">Sarah Mitchell</div>
                        <div className="text-[10px] text-white/25">Mar 17, 1998 · 2:34 AM</div>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300/60 uppercase tracking-wider font-bold">Natal</span>
                  </div>
                  {/* Mini chart placeholder */}
                  <div className="relative w-full aspect-square max-w-[140px] mx-auto">
                    <div className="absolute inset-0 rounded-full border border-white/[0.08]" />
                    <div className="absolute inset-3 rounded-full border border-white/[0.06]" />
                    <div className="absolute inset-6 rounded-full border border-white/[0.04]" />
                    {/* Planet dots */}
                    {[
                      { top: '15%', left: '60%', color: '#f59e0b' },
                      { top: '30%', left: '80%', color: '#ec4899' },
                      { top: '70%', left: '25%', color: '#6366f1' },
                      { top: '50%', left: '75%', color: '#22c55e' },
                      { top: '80%', left: '55%', color: '#ef4444' },
                    ].map((p, i) => (
                      <div key={i} className="absolute w-2 h-2 rounded-full" style={{ top: p.top, left: p.left, backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}50` }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-white/20">3 charts open</span>
                  <span className="text-[10px] text-white/20">⌘1–9 to switch</span>
                </div>
              </div>
            </div>
          }
        />

        {/* ── Chart Presets ── */}
        <FeatureShowcase
          tag="Display Presets"
          headline={<>Your setup.<br className="hidden sm:block" /> Saved in one click.</>}
          body="Configure your ideal chart view — which planets, aspects, asteroid groups, and visual options to show — then save it as a preset. Load any preset instantly. Up to 10 per account, synced across devices."
          reversed
          visual={
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-10 bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <div className="relative bg-[#0d1117] rounded-2xl border border-white/10 p-5 sm:p-6 w-full max-w-sm drop-shadow-2xl">
                <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-4">Display Presets</div>
                {/* Preset list */}
                <div className="space-y-2 mb-4">
                  {[
                    { name: 'Traditional 7', active: true, dots: ['#f59e0b', '#c0c0c0', '#ec4899', '#ef4444', '#f97316', '#6366f1', '#22c55e'] },
                    { name: 'Full Outer', active: false, dots: ['#f59e0b', '#c0c0c0', '#ec4899', '#ef4444', '#f97316', '#6366f1', '#22c55e', '#06b6d4', '#8b5cf6', '#3b82f6'] },
                    { name: 'Asteroids Only', active: false, dots: ['#a855f7', '#f43f5e', '#14b8a6', '#eab308'] },
                  ].map((preset) => (
                    <div
                      key={preset.name}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        preset.active
                          ? 'bg-amber-500/10 border border-amber-500/25'
                          : 'bg-white/[0.03] border border-white/[0.06]'
                      }`}
                    >
                      {/* Radio indicator */}
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        preset.active ? 'border-amber-400' : 'border-white/15'
                      }`}>
                        {preset.active && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${preset.active ? 'text-white/85' : 'text-white/40'}`}>{preset.name}</div>
                        {/* Planet dots */}
                        <div className="flex items-center gap-1 mt-1">
                          {preset.dots.map((color, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, opacity: preset.active ? 0.8 : 0.3 }} />
                          ))}
                        </div>
                      </div>
                      {preset.active && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300/70 uppercase tracking-wider font-bold">Active</span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Save preset button */}
                <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-white/10 text-white/25 hover:text-white/40 hover:border-white/20 transition-colors cursor-pointer">
                  <span className="text-lg leading-none">+</span>
                  <span className="text-sm">Save Current as Preset</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-white/20">3 of 10 presets used</span>
                  <span className="text-[10px] text-white/20">Synced across devices</span>
                </div>
              </div>
            </div>
          }
        />

        {/* Themes — custom layout for oversized image */}
        <section className="py-24 sm:py-32 md:py-40 px-4 sm:px-6 overflow-hidden bg-[#07050F]">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 sm:gap-16 lg:gap-10">
            {/* Visual — takes more space */}
            <div className="flex-[1.4] w-full min-w-0">
              <div className="relative group lg:-ml-16 xl:-ml-24">
                <div className="absolute -inset-10 bg-gradient-to-br from-amber-500/[0.06] to-violet-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
                <img src="/themes.webp" alt="Chart color themes" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
              </div>
            </div>
            {/* Text */}
            <div className="flex-1 text-center lg:text-left max-w-xl">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-4 sm:mb-5 text-amber-400/80">
                10 Color Themes
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-bold tracking-tight leading-[1.08]">
                <span className="bg-gradient-to-r from-amber-100 via-rose-100 via-violet-100 to-sky-100 bg-clip-text text-transparent">Your chart.<br className="hidden sm:block" /> Your aesthetic.</span>
              </h2>
              <p className="mt-5 sm:mt-6 text-[15px] sm:text-base md:text-lg leading-relaxed text-white/45">
                From Classic white to Cosmic deep purple, Ocean blues to Parchment warmth. Choose the palette that speaks to you. Every theme designed to be beautiful and readable.
              </p>
            </div>
          </div>
        </section>

        <FeatureShowcase
          tag="40+ Asteroids"
          headline={<>Beyond the<br className="hidden sm:block" /> classical planets.</>}
          body="Chiron, Eris, Sedna, Pholus, Eros, and dozens more. Main Belt, Centaurs, Trans-Neptunian Objects, Arabic Parts, Lunar Points — all with interpretations rooted in orbital mechanics."
          visual={
            <div className="relative group">
              <div className="absolute -inset-10 bg-gradient-to-br from-cyan-500/[0.07] to-blue-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <img src="/asteroids.webp" alt="Asteroid groups checklist" loading="lazy" className="w-full max-w-[761px] sm:max-w-[864px] mx-auto h-auto relative drop-shadow-2xl rounded-2xl" />
            </div>
          }
        />

        {/* ── Live Sessions — multi-panel immersive section ── */}
        <style>{`
          @keyframes cursorDrift {
            0%, 100% { transform: translate(0, 0); }
            20% { transform: translate(12px, -8px); }
            40% { transform: translate(-6px, -18px); }
            60% { transform: translate(18px, 4px); }
            80% { transform: translate(-10px, 10px); }
          }
          @keyframes waveformPulse {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.6); }
          }
          @keyframes videoFeedFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes controlsGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(244,63,94,0); }
            50% { box-shadow: 0 0 20px 2px rgba(244,63,94,0.1); }
          }
          @keyframes replayProgress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
        <section className="relative py-32 sm:py-44 md:py-56 px-4 sm:px-6 overflow-hidden bg-[#07050F]">
          {/* Subtle grid background */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }} />
            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-rose-500/[0.04] rounded-full blur-[120px]" />
          </div>

          <div className="relative max-w-7xl mx-auto flex flex-col items-center gap-20 sm:gap-28">

            {/* ─ Header ─ */}
            <div className="text-center max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 text-rose-400/80">
                Pro — Live Sessions
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/25 text-rose-300 rounded border border-rose-500/30">New</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                <span className="bg-gradient-to-r from-rose-200 via-orange-200 to-amber-200 bg-clip-text text-transparent">
                  Deliver readings.<br className="hidden sm:block" /> Live.
                </span>
              </h2>
              <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl leading-relaxed text-white/40 max-w-xl mx-auto">
                Conduct a live consultation with your client. Share your chart in real-time, talk through it together, and record everything — chart movements, audio, and your cursor — for instant replay.
              </p>
            </div>

            {/* ─ Visual 1: Client's Live View ─ */}
            <div className="w-full max-w-5xl">
              <div className="text-center mb-8 sm:mb-10">
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/25 mb-2">What your client sees</div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">The chart, live. Your cursor guiding them.</h3>
              </div>
              <div className="relative group">
                <div className="absolute -inset-12 bg-gradient-to-br from-rose-500/[0.08] via-orange-500/[0.04] to-transparent rounded-[3rem] blur-3xl opacity-70" />
                <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-br from-rose-500/20 via-orange-500/10 to-amber-500/20 opacity-50" />
                <div className="relative bg-[#0a0d14] rounded-2xl border border-white/[0.08] overflow-hidden drop-shadow-2xl">

                  {/* Top bar */}
                  <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-xs sm:text-sm font-medium text-white/50">Live Session — Sarah's Natal Reading</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>24:37</span>
                    </div>
                  </div>

                  {/* Main content area */}
                  <div className="relative p-4 sm:p-8 min-h-[300px] sm:min-h-[420px]">

                    {/* Realistic natal chart SVG */}
                    <div className="flex items-center justify-center">
                      <svg viewBox="0 0 400 400" className="w-[260px] h-[260px] sm:w-[340px] sm:h-[340px]" style={{ animation: 'spin 180s linear infinite' }}>
                        {/* Zodiac ring segments */}
                        {[
                          { color: '#3d2215', text: '#ff7733' },  /* Aries - Fire */
                          { color: '#15332a', text: '#33bb55' },  /* Taurus - Earth */
                          { color: '#33290a', text: '#ddaa22' },  /* Gemini - Air */
                          { color: '#0a2533', text: '#33aadd' },  /* Cancer - Water */
                          { color: '#3d2215', text: '#ff7733' },  /* Leo - Fire */
                          { color: '#15332a', text: '#33bb55' },  /* Virgo - Earth */
                          { color: '#33290a', text: '#ddaa22' },  /* Libra - Air */
                          { color: '#0a2533', text: '#33aadd' },  /* Scorpio - Water */
                          { color: '#3d2215', text: '#ff7733' },  /* Sag - Fire */
                          { color: '#15332a', text: '#33bb55' },  /* Cap - Earth */
                          { color: '#33290a', text: '#ddaa22' },  /* Aqua - Air */
                          { color: '#0a2533', text: '#33aadd' },  /* Pisces - Water */
                        ].map((seg, i) => {
                          const startAngle = i * 30 - 90;
                          const endAngle = startAngle + 30;
                          const r1 = 175, r2 = 195;
                          const sa = (startAngle * Math.PI) / 180;
                          const ea = (endAngle * Math.PI) / 180;
                          const ma = ((startAngle + 15) * Math.PI) / 180;
                          const cx = 200 + 185 * Math.cos(ma);
                          const cy = 200 + 185 * Math.sin(ma);
                          return (
                            <g key={i}>
                              <path
                                d={`M${200+r1*Math.cos(sa)},${200+r1*Math.sin(sa)} A${r1},${r1} 0 0,1 ${200+r1*Math.cos(ea)},${200+r1*Math.sin(ea)} L${200+r2*Math.cos(ea)},${200+r2*Math.sin(ea)} A${r2},${r2} 0 0,0 ${200+r2*Math.cos(sa)},${200+r2*Math.sin(sa)} Z`}
                                fill={seg.color} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"
                              />
                              <g transform={`translate(${cx - 6}, ${cy - 6})`} opacity="0.7">
                                <path d={ZODIAC_GLYPHS[i]} fill="none" stroke={seg.text} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              </g>
                            </g>
                          );
                        })}
                        {/* Zodiac ring borders */}
                        <circle cx="200" cy="200" r="195" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                        <circle cx="200" cy="200" r="175" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                        {/* House lines */}
                        {[0,30,60,90,120,150,180,210,240,270,300,330].map((a) => {
                          const rad = (a - 90) * Math.PI / 180;
                          return <line key={a} x1={200+80*Math.cos(rad)} y1={200+80*Math.sin(rad)} x2={200+175*Math.cos(rad)} y2={200+175*Math.sin(rad)} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />;
                        })}
                        {/* Inner circle */}
                        <circle cx="200" cy="200" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                        {/* Planet ring circle */}
                        <circle cx="200" cy="200" r="148" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                        {/* Planets at realistic positions */}
                        {[
                          { glyph: '\u2609', angle: 340, color: '#FFB300' },   /* Sun */
                          { glyph: '\u263D', angle: 25, color: '#9E9E9E' },    /* Moon */
                          { glyph: '\u263F', angle: 355, color: '#FDD835' },   /* Mercury */
                          { glyph: '\u2640', angle: 310, color: '#F48FB1' },   /* Venus */
                          { glyph: '\u2642', angle: 145, color: '#E53935' },   /* Mars */
                          { glyph: '\u2643', angle: 72, color: '#7E57C2' },    /* Jupiter */
                          { glyph: '\u2644', angle: 260, color: '#8D6E63' },   /* Saturn */
                          { glyph: '\u2645', angle: 50, color: '#42A5F5' },    /* Uranus */
                          { glyph: '\u2646', angle: 0, color: '#4DD0E1' },     /* Neptune */
                          { glyph: '\u2647', angle: 298, color: '#78909C' },   /* Pluto */
                        ].map((p, i) => {
                          const rad = (p.angle - 90) * Math.PI / 180;
                          return <text key={i} x={200+148*Math.cos(rad)} y={200+148*Math.sin(rad)} textAnchor="middle" dominantBaseline="central" fill={p.color} fontSize="13" fontFamily="serif">{p.glyph}</text>;
                        })}
                        {/* Aspect lines — realistic colors and styles */}
                        {[
                          { a1: 340, a2: 25, color: '#c41e3a', dash: '3 2' },     /* Sun opp-ish Moon — red dashed */
                          { a1: 340, a2: 145, color: '#00bcd4', dash: '' },         /* Sun trine Mars — cyan */
                          { a1: 25, a2: 260, color: '#c41e3a', dash: '3 2' },      /* Moon square Saturn — red dashed */
                          { a1: 310, a2: 72, color: '#00bcd4', dash: '' },          /* Venus trine Jupiter — cyan */
                          { a1: 355, a2: 0, color: '#daa520', dash: '' },           /* Mercury conj Neptune — gold */
                          { a1: 50, a2: 310, color: '#1e5aa8', dash: '' },          /* Uranus sextile Venus — blue */
                        ].map((asp, i) => {
                          const r = 75;
                          const r1 = (asp.a1 - 90) * Math.PI / 180;
                          const r2 = (asp.a2 - 90) * Math.PI / 180;
                          return <line key={i} x1={200+r*Math.cos(r1)} y1={200+r*Math.sin(r1)} x2={200+r*Math.cos(r2)} y2={200+r*Math.sin(r2)} stroke={asp.color} strokeWidth="0.7" strokeDasharray={asp.dash} opacity="0.35" />;
                        })}
                        {/* House numbers */}
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map((h) => {
                          const rad = ((h-1)*30 + 15 - 90) * Math.PI / 180;
                          return <text key={h} x={200+125*Math.cos(rad)} y={200+125*Math.sin(rad)} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.12)" fontSize="9">{h}</text>;
                        })}
                      </svg>
                    </div>

                    {/* Remote cursor (the blue dot the client sees) — animated drift */}
                    <div className="absolute" style={{ left: '58%', top: '52%', animation: 'cursorDrift 8s ease-in-out infinite' }}>
                      <div className="relative">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400 drop-shadow-lg -rotate-6">
                          <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                        </svg>
                        <div className="absolute top-5 left-3 px-2 py-0.5 rounded bg-blue-500 text-[9px] text-white font-medium whitespace-nowrap shadow-lg">
                          Host
                        </div>
                      </div>
                    </div>

                    {/* Video feeds floating (top right) — subtle float animation */}
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col gap-2" style={{ animation: 'videoFeedFloat 4s ease-in-out infinite' }}>
                      <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg bg-gradient-to-br from-amber-900/60 to-orange-900/40 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">JD</div>
                      </div>
                      <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg bg-gradient-to-br from-indigo-900/60 to-violet-900/40 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white">SM</div>
                      </div>
                    </div>

                    {/* Floating session controls (bottom center) */}
                    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm shadow-2xl" style={{ animation: 'controlsGlow 3s ease-in-out infinite' }}>
                        {/* Mic */}
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white/70"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                        </div>
                        {/* Camera */}
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white/70"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                        </div>
                        {/* Divider */}
                        <div className="w-px h-5 bg-white/10 mx-0.5" />
                        {/* Recording indicator */}
                        <div className="flex items-center gap-1.5 px-2">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[10px] sm:text-xs font-mono text-white/50">24:37</span>
                        </div>
                        {/* Divider */}
                        <div className="w-px h-5 bg-white/10 mx-0.5" />
                        {/* End */}
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-rose-400"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─ 3-step flow ─ */}
            <div className="w-full max-w-4xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
                {[
                  {
                    step: '1',
                    title: 'Start a session',
                    desc: 'Click Live Session, name your reading, and share the link with your client.',
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
                    ),
                  },
                  {
                    step: '2',
                    title: 'Read the chart together',
                    desc: 'Your client sees every chart movement in real-time — your cursor guides them through the reading.',
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
                    ),
                  },
                  {
                    step: '3',
                    title: 'Replay anytime',
                    desc: 'Audio, chart state, and cursor — all synced. AI generates a transcript, summary, and chapter markers.',
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    ),
                  },
                ].map((s) => (
                  <div key={s.step} className="relative text-center sm:text-left p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
                      {s.icon}
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{s.title}</h4>
                    <p className="text-sm text-white/35 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ─ Visual 2: Replay Player ─ */}
            <div className="w-full max-w-5xl">
              <div className="text-center mb-8 sm:mb-10">
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/25 mb-2">After the session</div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Every word. Every chart movement. Preserved.</h3>
              </div>
              <div className="relative group">
                <div className="absolute -inset-12 bg-gradient-to-br from-orange-500/[0.06] via-amber-500/[0.04] to-transparent rounded-[3rem] blur-3xl opacity-70" />
                <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-rose-500/15 opacity-50" />
                <div className="relative bg-[#0a0d14] rounded-2xl border border-white/[0.08] overflow-hidden drop-shadow-2xl">

                  {/* Replay header */}
                  <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-400"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      <span className="text-xs sm:text-sm font-medium text-white/60">Sarah's Natal Reading — Feb 24, 2026</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline text-[10px] text-white/25 uppercase tracking-wider">42 min</span>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white/40"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        <span className="text-[10px] text-white/40">Download</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row">
                    {/* Left: Chart + waveform */}
                    <div className="flex-1 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
                      {/* Mini chart in replay — realistic SVG */}
                      <div className="flex items-center justify-center mb-6 relative">
                        <svg viewBox="0 0 300 300" className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]">
                          {/* Zodiac ring */}
                          {[
                            '#3d2215','#15332a','#33290a','#0a2533',
                            '#3d2215','#15332a','#33290a','#0a2533',
                            '#3d2215','#15332a','#33290a','#0a2533',
                          ].map((color, i) => {
                            const sa = (i * 30 - 90) * Math.PI / 180;
                            const ea = ((i+1) * 30 - 90) * Math.PI / 180;
                            const r1 = 128, r2 = 145;
                            return <path key={i} d={`M${150+r1*Math.cos(sa)},${150+r1*Math.sin(sa)} A${r1},${r1} 0 0,1 ${150+r1*Math.cos(ea)},${150+r1*Math.sin(ea)} L${150+r2*Math.cos(ea)},${150+r2*Math.sin(ea)} A${r2},${r2} 0 0,0 ${150+r2*Math.cos(sa)},${150+r2*Math.sin(sa)} Z`} fill={color} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />;
                          })}
                          <circle cx="150" cy="150" r="145" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                          <circle cx="150" cy="150" r="128" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                          {/* House lines */}
                          {[0,30,60,90,120,150,180,210,240,270,300,330].map((a) => {
                            const rad = (a-90)*Math.PI/180;
                            return <line key={a} x1={150+55*Math.cos(rad)} y1={150+55*Math.sin(rad)} x2={150+128*Math.cos(rad)} y2={150+128*Math.sin(rad)} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />;
                          })}
                          <circle cx="150" cy="150" r="55" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                          {/* Zodiac signs */}
                          {ZODIAC_GLYPHS.map((glyphPath, i) => {
                            const colors = ['#ff7733','#33bb55','#ddaa22','#33aadd','#ff7733','#33bb55','#ddaa22','#33aadd','#ff7733','#33bb55','#ddaa22','#33aadd'];
                            const rad = (i*30+15-90)*Math.PI/180;
                            const cx = 150+136*Math.cos(rad);
                            const cy = 150+136*Math.sin(rad);
                            return (
                              <g key={i} transform={`translate(${cx - 6*0.55}, ${cy - 6*0.55}) scale(0.55)`} opacity="0.6">
                                <path d={glyphPath} fill="none" stroke={colors[i]} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </g>
                            );
                          })}
                          {/* Planets */}
                          {[
                            { g: '\u2609', a: 340, c: '#FFB300' },
                            { g: '\u263D', a: 25, c: '#9E9E9E' },
                            { g: '\u2640', a: 310, c: '#F48FB1' },
                            { g: '\u2642', a: 145, c: '#E53935' },
                            { g: '\u2643', a: 72, c: '#7E57C2' },
                            { g: '\u2644', a: 260, c: '#8D6E63' },
                          ].map((p, i) => {
                            const rad = (p.a-90)*Math.PI/180;
                            return <text key={i} x={150+108*Math.cos(rad)} y={150+108*Math.sin(rad)} textAnchor="middle" dominantBaseline="central" fill={p.c} fontSize="9" fontFamily="serif">{p.g}</text>;
                          })}
                          {/* Aspect lines */}
                          {[
                            { a1: 340, a2: 145, c: '#00bcd4' },
                            { a1: 25, a2: 260, c: '#c41e3a', d: '2 1' },
                            { a1: 310, a2: 72, c: '#00bcd4' },
                            { a1: 340, a2: 25, c: '#daa520' },
                          ].map((l, i) => {
                            const r = 52;
                            const r1 = (l.a1-90)*Math.PI/180;
                            const r2 = (l.a2-90)*Math.PI/180;
                            return <line key={i} x1={150+r*Math.cos(r1)} y1={150+r*Math.sin(r1)} x2={150+r*Math.cos(r2)} y2={150+r*Math.sin(r2)} stroke={l.c} strokeWidth="0.5" strokeDasharray={l.d || ''} opacity="0.3" />;
                          })}
                        </svg>
                        {/* Replay cursor — animated */}
                        <div className="absolute" style={{ left: '55%', top: '45%', animation: 'cursorDrift 10s ease-in-out infinite' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400/60"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                        </div>
                      </div>

                      {/* Waveform + timeline */}
                      <div className="space-y-2">
                        <div className="flex items-end gap-[2px] h-10">
                          {Array.from({ length: 64 }).map((_, i) => {
                            const heights = [30, 55, 40, 75, 35, 60, 70, 25, 85, 45, 65, 50, 80, 30, 70, 45, 55, 35, 65, 50, 40, 75, 45, 60, 30, 70, 40, 85, 50, 35, 55, 65, 40, 80, 45, 30, 60, 50, 75, 55, 35, 65, 55, 40, 70, 45, 80, 50, 30, 60, 45, 75, 35, 55, 70, 40, 85, 50, 65, 35, 45, 60, 30, 75];
                            const played = i < 38;
                            return (
                              <div
                                key={i}
                                className="flex-1 rounded-full"
                                style={{
                                  height: `${heights[i]}%`,
                                  backgroundColor: played ? 'rgba(251,146,60,0.45)' : 'rgba(255,255,255,0.06)',
                                }}
                              />
                            );
                          })}
                        </div>
                        {/* Playback bar */}
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white/70 ml-0.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                          </div>
                          <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full" style={{ animation: 'replayProgress 20s linear infinite' }} />
                          </div>
                          <span className="text-[10px] font-mono text-white/30 flex-shrink-0">24:37 / 41:52</span>
                        </div>
                        {/* Playback speed */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.08] text-white/50">1x</button>
                            <button className="px-2 py-0.5 rounded text-[10px] font-medium text-white/25">1.5x</button>
                            <button className="px-2 py-0.5 rounded text-[10px] font-medium text-white/25">2x</button>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white/25"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            <span className="text-[10px] text-white/25">Share replay</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Chapters + Transcript + Summary */}
                    <div className="lg:w-[380px] flex flex-col">
                      {/* Tab switcher */}
                      <div className="flex border-b border-white/[0.06]">
                        {(['Chapters', 'Transcript', 'Summary'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setReplayTab(tab)}
                            className={`relative flex-1 py-2.5 text-[11px] sm:text-xs font-medium transition-colors ${
                              replayTab === tab
                                ? 'text-amber-400 border-b border-amber-400'
                                : 'text-white/25 hover:text-white/40'
                            }`}
                          >
                            {tab}
                            {replayTab !== tab && (
                              <span className="absolute -top-1 -right-0.5 flex h-[14px] items-center px-1 rounded-full bg-amber-500/20 text-amber-400 text-[8px] font-bold uppercase tracking-wider animate-pulse">
                                try
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Tab content */}
                      <div className="flex-1 p-4 space-y-1.5 overflow-hidden" style={{ maxHeight: '340px' }}>
                        {/* Chapters */}
                        {replayTab === 'Chapters' && (
                          <>
                            {[
                              { time: '0:00', title: 'Introduction & birth data', desc: 'Setting up the chart, confirming birth time accuracy', active: false, past: true },
                              { time: '3:22', title: 'Sun in Pisces, 7th House', desc: 'Identity expressed through partnership', active: false, past: true },
                              { time: '8:14', title: 'Moon-Venus conjunction', desc: 'Emotional needs aligned with love language', active: false, past: true },
                              { time: '14:50', title: 'Mars square Saturn', desc: 'Tension between drive and discipline', active: true, past: false },
                              { time: '22:08', title: 'Jupiter transit to Midheaven', desc: 'Career expansion window opening', active: false, past: false },
                              { time: '30:15', title: 'Saturn return overview', desc: 'Major life restructuring phase', active: false, past: false },
                              { time: '37:40', title: 'Summary & guidance', desc: 'Key takeaways and recommended focus areas', active: false, past: false },
                            ].map((ch) => (
                              <div key={ch.time} className={`flex gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                                ch.active
                                  ? 'bg-amber-500/10 border border-amber-500/20'
                                  : 'border border-transparent hover:bg-white/[0.02]'
                              }`}>
                                <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                                  <div className={`w-2 h-2 rounded-full ${ch.active ? 'bg-amber-400' : ch.past ? 'bg-white/20' : 'bg-white/[0.06]'}`} />
                                  <div className="w-px flex-1 bg-white/[0.06] mt-1" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-mono ${ch.active ? 'text-amber-400' : 'text-white/25'}`}>{ch.time}</span>
                                  </div>
                                  <div className={`text-xs sm:text-sm font-medium mt-0.5 ${ch.active ? 'text-white/80' : ch.past ? 'text-white/50' : 'text-white/30'}`}>{ch.title}</div>
                                  <div className="text-[10px] sm:text-[11px] text-white/20 mt-0.5 leading-relaxed">{ch.desc}</div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Transcript */}
                        {replayTab === 'Transcript' && (
                          <div className="space-y-3">
                            {[
                              { time: '0:00', speaker: 'Astrologer', text: "Welcome! Let's take a look at your chart. I see you were born March 12, 1994 at 3:22 AM in Beirut." },
                              { time: '0:18', speaker: 'Client', text: "Yes, that's correct. My mom confirmed the birth time from hospital records." },
                              { time: '0:32', speaker: 'Astrologer', text: "Perfect — accurate birth time is crucial. I'm pulling up your natal chart now. Right away I notice your Sun is in Pisces in the 7th house." },
                              { time: '3:22', speaker: 'Astrologer', text: "This Sun placement tells me that relationships are central to your identity. You discover who you are through others." },
                              { time: '3:58', speaker: 'Client', text: "That resonates a lot. I've always defined myself through my close relationships." },
                              { time: '4:15', speaker: 'Astrologer', text: "Now look at this — your Moon at 14° Taurus is conjunct Venus at 16° Taurus. This is a beautiful conjunction." },
                              { time: '8:14', speaker: 'Astrologer', text: "This Moon-Venus conjunction means your emotional needs and your love language are deeply aligned. You need stability and sensory comfort." },
                              { time: '8:45', speaker: 'Client', text: "I've always been told I'm very nurturing. Physical touch and quality time are big for me." },
                              { time: '14:50', speaker: 'Astrologer', text: "Now here's the tension in your chart — Mars in Cancer is squaring Saturn in Libra. See this red dashed line?" },
                              { time: '15:20', speaker: 'Client', text: "Is that a difficult aspect?" },
                              { time: '15:28', speaker: 'Astrologer', text: "It creates friction between your drive to act and the need for structure. But it also builds incredible discipline over time." },
                            ].map((line, i) => (
                              <div key={i} className="flex gap-2.5">
                                <span className="text-[10px] font-mono text-white/20 w-8 flex-shrink-0 pt-0.5 text-right">{line.time}</span>
                                <div className="min-w-0">
                                  <span className={`text-[10px] font-semibold ${line.speaker === 'Astrologer' ? 'text-amber-400/70' : 'text-sky-400/70'}`}>
                                    {line.speaker}
                                  </span>
                                  <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mt-0.5">{line.text}</p>
                                </div>
                              </div>
                            ))}
                            <div className="text-center pt-2">
                              <span className="text-[10px] text-white/15 italic">Scroll for more...</span>
                            </div>
                          </div>
                        )}

                        {/* Summary */}
                        {replayTab === 'Summary' && (
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-amber-400/60"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
                                <span className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider">AI Summary</span>
                              </div>
                              <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed">
                                This session explored a Pisces Sun/7th house native with a strong Moon-Venus conjunction in Taurus. The chart emphasizes relational identity, emotional warmth, and a need for stability. The Mars-Saturn square introduces constructive tension around assertiveness and discipline.
                              </p>
                            </div>

                            <div>
                              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Key Themes</div>
                              <div className="flex flex-wrap gap-1.5">
                                {['Relationships', 'Emotional Security', 'Career Growth', 'Discipline', 'Saturn Return'].map((theme) => (
                                  <span key={theme} className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/35">{theme}</span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Placements Discussed</div>
                              <div className="space-y-1">
                                {[
                                  { glyph: '\u2653', label: 'Sun in Pisces', house: '7th House' },
                                  { glyph: '\u2649', label: 'Moon-Venus in Taurus', house: '9th House' },
                                  { glyph: '\u264B', label: 'Mars in Cancer', house: '11th House' },
                                  { glyph: '\u264E', label: 'Saturn in Libra', house: '2nd House' },
                                  { glyph: '\u2643', label: 'Jupiter transit to MC', house: '10th House' },
                                ].map((p) => (
                                  <div key={p.label} className="flex items-center gap-2 text-[11px]">
                                    <span className="text-amber-400/50 text-xs">{p.glyph}</span>
                                    <span className="text-white/40">{p.label}</span>
                                    <span className="text-white/15 text-[10px]">{p.house}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Action Items</div>
                              <div className="space-y-1">
                                {[
                                  'Review Saturn return timeline (exact dates provided)',
                                  'Journal on Mars-Saturn tension patterns',
                                  'Leverage Jupiter-MC transit for career moves',
                                ].map((item, i) => (
                                  <div key={i} className="flex items-start gap-2 text-[11px]">
                                    <span className="text-amber-400/40 mt-0.5">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>
                                    </span>
                                    <span className="text-white/35">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─ Feature pills ─ */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: 'Live Chart Sharing', icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
                )},
                { label: 'Audio Recording', icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                )},
                { label: 'AI Transcript & Summary', icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                )},
                { label: 'Chapter Markers', icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                )},
                { label: 'Shareable Replay Link', icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                )},
                { label: 'Remote Cursor Tracking', icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                )},
              ].map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs sm:text-sm">
                  <span className="text-rose-400/70">{f.icon}</span>
                  {f.label}
                </span>
              ))}
            </div>

            {/* Pro badge */}
            <span className="inline-block px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em]">
              Astrologer Pro
            </span>
          </div>
        </section>

        {/* ── AI Readings ── */}
        <FeatureShowcase
          tag="Pro — AI Readings"
          headline={<>The most powerful<br className="hidden sm:block" /> AI chart reader ever built.</>}
          body="Ask any question about your chart and get a deep, personalized interpretation that draws from every planet, aspect, and house position — not generic horoscope copy. Works across natal, synastry, transit, and composite charts. Powered by the latest frontier AI models with full access to your exact placements."
          dark
          reversed
          visual={
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-10 bg-gradient-to-br from-violet-500/[0.08] to-blue-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <div className="relative bg-[#0d1117] rounded-2xl border border-white/10 p-5 sm:p-6 w-full max-w-sm drop-shadow-2xl">
                <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-4">AI Reading</div>
                {/* Question pills */}
                <div className="space-y-2 mb-5">
                  {[
                    { q: 'What are my greatest strengths?', active: true },
                    { q: 'How do I approach relationships?', active: false },
                    { q: 'What does my career path look like?', active: false },
                    { q: 'What is my life purpose?', active: false },
                  ].map((item) => (
                    <div key={item.q} className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      item.active
                        ? 'bg-violet-500/15 border border-violet-500/25 text-white/80'
                        : 'bg-white/[0.03] border border-white/[0.06] text-white/40'
                    }`}>
                      {item.q}
                    </div>
                  ))}
                </div>
                {/* Mock AI response */}
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="text-xs font-medium text-violet-300/70">AI Interpretation</span>
                  </div>
                  <div className="space-y-2 text-[12px] leading-relaxed text-white/35">
                    <p>Your Sun in Pisces in the 7th house suggests your core identity is deeply tied to partnership and empathy. You shine brightest when connecting...</p>
                    <p className="text-white/20">With Venus conjunct your Moon in the 5th, your creative expression and emotional...</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-white/20">3 readings remaining this month</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold uppercase">Pro: Unlimited</span>
                </div>
              </div>
            </div>
          }
        />

        {/* ── Rectification Workbench ── */}
        <FeatureShowcase
          tag="Rectification — Coming Soon"
          headline={<>Don't know your<br className="hidden sm:block" /> birth time?</>}
          body="Enter your birth date, location, and three or more major life events — marriage, career change, having a child. Astrologer will test 900+ candidate birth times and rank them by how well they align with your life history."
          visual={
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-10 bg-gradient-to-br from-teal-500/[0.07] to-emerald-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <div className="relative bg-white rounded-2xl border border-black/[0.08] p-5 sm:p-6 w-full max-w-sm drop-shadow-2xl">
                <div className="text-xs text-black/40 font-bold uppercase tracking-wider mb-4">Rectification Workbench</div>
                {/* Life events */}
                <div className="space-y-2 mb-5">
                  {[
                    { event: 'Started first job', date: 'Jun 2018', type: 'Career', color: '#f59e0b' },
                    { event: 'Got married', date: 'Sep 2021', type: 'Marriage', color: '#ec4899' },
                    { event: 'First child born', date: 'Mar 2023', type: 'Child', color: '#6366f1' },
                  ].map((e) => (
                    <div key={e.event} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.03] border border-black/[0.06]">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-black/70 font-medium">{e.event}</div>
                        <div className="text-[11px] text-black/30">{e.date}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.04] text-black/30">{e.type}</span>
                    </div>
                  ))}
                </div>
                {/* Results */}
                <div className="rounded-xl bg-black/[0.02] border border-black/[0.06] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-black/30 mb-3">Top candidates</div>
                  <div className="space-y-2">
                    {[
                      { time: '2:34 AM', score: 94, best: true },
                      { time: '2:38 AM', score: 89, best: false },
                      { time: '10:12 AM', score: 72, best: false },
                    ].map((c) => (
                      <div key={c.time} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${c.best ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-black/[0.02] border border-black/[0.04]'}`}>
                        <span className={`text-sm font-mono ${c.best ? 'text-emerald-600 font-semibold' : 'text-black/50'}`}>{c.time}</span>
                        <div className="flex-1 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.best ? 'bg-emerald-500' : 'bg-black/20'}`} style={{ width: `${c.score}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${c.best ? 'text-emerald-600' : 'text-black/30'}`}>{c.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }
        />

        {/* ── Export & Share ── */}
        <FeatureShowcase
          tag="Export & Share"
          headline={<>Take your charts<br className="hidden sm:block" /> anywhere.</>}
          body="Export as a high-resolution PNG, a print-ready PDF, or email the chart directly to a client with your notes attached. Share any chart via link — no account required to view."
          reversed
          dark
          visual={
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-10 bg-gradient-to-br from-sky-500/[0.06] to-indigo-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <div className="relative w-full max-w-sm space-y-3">
                {[
                  { format: 'PNG', desc: 'High-resolution image (3x)', icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  ), color: '#22c55e' },
                  { format: 'PDF', desc: 'Print-ready A4 document', icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
                  ), color: '#ef4444', pro: true },
                  { format: 'Email', desc: 'Send chart + notes to anyone', icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  ), color: '#8b5cf6' },
                  { format: 'Link', desc: 'Shareable URL — no login needed', icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  ), color: '#06b6d4' },
                ].map((item) => (
                  <div key={item.format} className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '15', color: item.color }}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white/80">{item.format}</span>
                        {'pro' in item && item.pro && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold uppercase">Pro</span>}
                      </div>
                      <span className="text-[11px] text-white/30">{item.desc}</span>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-white/15 flex-shrink-0"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>
                ))}
              </div>
            </div>
          }
        />

        <FeatureShowcase
          tag="Import"
          headline={<>Already use<br className="hidden sm:block" /> Astro.com?</>}
          body="Paste your profile data from Astro.com and we'll import all your saved charts instantly."
          dark
          visual={
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-10 bg-gradient-to-br from-blue-500/[0.06] to-emerald-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <div className="relative bg-[#0d1117] rounded-2xl border border-white/10 p-5 sm:p-6 w-full max-w-sm drop-shadow-2xl">
                <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-4">Import from Astro.com</div>
                <div className="space-y-2">
                  {/* Imported chart cards */}
                  {[
                    { name: 'Sarah Mitchell', date: 'Mar 17, 1998', sign: '\u2653\uFE0E', color: '#6366f1' },
                    { name: 'David Chen', date: 'Aug 3, 1995', sign: '\u264C\uFE0E', color: '#f59e0b' },
                    { name: 'Emma Rodriguez', date: 'Dec 21, 2001', sign: '\u2650\uFE0E', color: '#8b5cf6' },
                  ].map((person, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: person.color + '20', color: person.color }}>
                        {person.sign}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/80 font-medium truncate">{person.name}</div>
                        <div className="text-[11px] text-white/30">{person.date}</div>
                      </div>
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <span className="text-emerald-400 text-sm font-semibold">Save 3 Charts</span>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </div>

      {/* ── Free Tools ───────────────────────────────────────── */}
      <section className="relative z-10 bg-background py-24 sm:py-32 px-4 sm:px-6">
        <div ref={toolsFade.ref} style={toolsFade.style} className={`max-w-4xl mx-auto ${toolsFade.className}`}>
          <div className="text-center mb-12 sm:mb-16">
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-emerald-600 mb-3">Included Free</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              All of this. Free.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-4 max-w-md mx-auto">
              Everything you need for serious chart work — no paywall.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {[
              'Natal Chart Wheel', 'Synastry Biwheel', 'Composite Charts',
              'Progressed Charts & Solar Arc', 'Solar & Lunar Returns', 'Aspect Grid with Interpretations',
              'Profections', 'Ephemeris Tables', 'Graphic Ephemeris',
              'Transit Timeline', 'Declination Analysis', 'Age-Degree Activations',
              '50+ Asteroids & Arabic Parts', 'Chart Notes', 'Save up to 3 Charts',
              'Shareable Chart Links', 'PNG Export', '10 Chart Themes',
              '3D Galactic Mode', 'Astro.com Import', 'Keyboard Shortcuts',
            ].map((tool) => (
              <div key={tool} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border hover:bg-muted/30 transition-colors">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm font-medium">{tool}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-10 sm:mt-12">
            <Link to="/chart">
              <Button size="lg" className="h-12 px-8 text-base gap-2">
                Open Astrologer
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="relative z-10 bg-background py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="border-t border-border/50">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing (Apple-style) ─────────────────────────────── */}
      <section className="relative z-10 bg-[#07050F] py-24 sm:py-32 px-4 sm:px-6" id="pricing">
        <div ref={pricingFade.ref} style={pricingFade.style} className={`max-w-lg mx-auto ${pricingFade.className}`}>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              Astrologer Pro
            </h2>
            <p className="text-base sm:text-lg text-white/40 mt-3">
              Unlock everything.
            </p>
          </div>

          {/* Plan toggle */}
          <PricingToggle onSubscribe={() => user ? setShowUpgrade(true) : setShowAuth(true)} />
        </div>
      </section>

      {/* ── Cross-Platform ────────────────────────────────────── */}
      <section className="relative z-10 bg-[#07050F] py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/30 mb-4">Available Everywhere</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            Your charts, on every device.
          </h2>
          <p className="text-sm sm:text-base text-white/40 max-w-lg mx-auto mb-10">
            Astrologer runs entirely in the cloud. Nothing to install — just open your browser on any device.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-white/50">
            {[
              { label: 'Mac, iPad & iPhone', icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )},
              { label: 'Android & Chromebook', icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0012 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.983 5.983 0 006 7h12c0-2.12-1.1-3.98-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
                </svg>
              )},
              { label: 'Windows PCs & Laptops', icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                  <path d="M3 12V6.75l6-1V12H3zm7-6.5l8-1.25V12h-8V5.5zM18 13v7.75l-8-1.25V13h8zm-9 0v6.25l-6-1V13h6z"/>
                </svg>
              )},
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-2.5">
                <span className="text-white/40">{d.icon}</span>
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy & Security ──────────────────────────────── */}
      <section className="relative z-10 bg-[#07050F] py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/25 mb-3">Privacy & Security</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              Your data stays yours.
            </h2>
            <p className="text-base sm:text-lg text-white/35 mt-4 max-w-lg mx-auto">
              Birth data is sensitive. We treat it that way.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                title: 'Local-first storage',
                desc: 'Chart data is stored in your browser by default. Nothing leaves your device unless you explicitly save to your account.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                ),
              },
              {
                title: 'No account required',
                desc: 'Use every core feature without signing up. Calculate charts, run synastry, view transits — completely anonymous.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" x2="22" y1="11" y2="11"/></svg>
                ),
              },
              {
                title: 'HTTPS everywhere',
                desc: 'All data in transit is encrypted. API calls to the Swiss Ephemeris and your saved charts are protected end-to-end.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                ),
              },
              {
                title: 'No ads. No data sales.',
                desc: 'We will never sell your data to third parties. No advertising cookies. No tracking pixels from ad networks. Ever.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
                ),
              },
              {
                title: 'Never used for AI training',
                desc: 'Your birth data, charts, and session recordings are never used to train AI models. AI readings are processed per-request and not stored or learned from.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27A7 7 0 0 1 7.27 19H6a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h-1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg>
                ),
              },
              {
                title: 'Payments via Stripe',
                desc: 'We never see your credit card number. All payment processing is handled by Stripe\'s PCI-compliant infrastructure.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                ),
              },
              {
                title: 'Delete everything, anytime',
                desc: 'Delete your account, all saved charts, and every session recording directly from your account menu. Immediate, complete, and permanent.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                ),
              },
              {
                title: 'Delete sessions individually',
                desc: 'Every session recording can be deleted by you at any time — audio files, transcripts, and all associated data are permanently removed.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 mb-4">
                  {item.icon}
                </div>
                <h4 className="text-sm sm:text-base font-semibold text-white/80 mb-2">{item.title}</h4>
                <p className="text-xs sm:text-sm text-white/30 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative z-10 bg-[#07050F] py-24 sm:py-32 px-4 sm:px-6">
        <div ref={ctaFade.ref} style={ctaFade.style} className={`max-w-2xl mx-auto text-center space-y-6 ${ctaFade.className}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Begin your journey
          </h2>
          <p className="text-base sm:text-lg text-white/40 max-w-md mx-auto">
            Enter your birth details and explore what the sky looked like the moment you arrived.
          </p>
          <Link to="/chart">
            <Button size="lg" className="h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg gap-2 mt-2 bg-amber-500 text-black hover:bg-amber-400 font-semibold">
              Open Astrologer
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative z-10 bg-[#07050F] border-t border-white/10 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-white/50">
            <div className="font-medium text-white/80">Astrologer</div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link to="/chart" className="hover:text-white/90 transition-colors">Chart Tool</Link>
              <a href="#features" className="hover:text-white/90 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white/90 transition-colors">Pricing</a>
              <Link to="/support" className="hover:text-white/90 transition-colors">Support</Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/40 border-t border-white/10 pt-5">
            <div>&copy; {new Date().getFullYear()} Astrologer.</div>
            <div className="flex gap-4">
              <Link to="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
              <Link to="/support" className="hover:text-white/70 transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Modals ───────────────────────────────────────────── */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
