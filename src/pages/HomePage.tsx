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
            'AI chart interpretations',
            'Save unlimited charts',
            'Astrocartography maps',
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

        <FeatureShowcase
          tag="Interpretations"
          headline={<>Tap any planet.<br className="hidden sm:block" /> Understand everything.</>}
          body="Every planet, aspect, and house placement comes with detailed interpretations. Tap any symbol on the chart to see its meaning, aspects, and house placement — all in context."
          reversed
          wideVisual
          visual={
            <div className="relative group">
              <div className="absolute -inset-10 bg-gradient-to-br from-amber-500/[0.07] to-rose-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
              <img src="/tooltips.webp" alt="Planet interpretations and tooltips" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
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
              'Natal Chart Wheel', 'Synastry Biwheel', 'Aspect Grid',
              'Profections', 'Ephemeris Tables', 'Graphic Ephemeris',
              'Transit Timeline', 'Age-Degree Analysis',
              '40+ Asteroids & Arabic Parts', '20 Major & Minor Aspects',
              '10 Chart Themes', 'Save up to 3 Charts',
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
              { label: 'Mac, iPad & iPhone', icon: '🍎' },
              { label: 'Android & Chromebook', icon: '🤖' },
              { label: 'Windows PCs & Laptops', icon: '🪟' },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span className="text-lg">{d.icon}</span>
                <span>{d.label}</span>
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
