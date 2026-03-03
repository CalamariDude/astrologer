import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { useFadeIn } from '@/hooks/useFadeIn';
import { useIsMobile } from '@/hooks/useIsMobile';
import { CSSFallback } from '@/components/landing/CSSFallback';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { PricingToggle } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { TodaysSky } from '@/components/landing/TodaysSky';
import { FeatureBento } from '@/components/landing/FeatureBento';
import { FeaturePreview } from '@/components/landing/FeaturePreview';
import { AboutSection } from '@/components/landing/AboutSection';
import { LearnSection } from '@/components/landing/LearnSection';

const SpaceScene = lazy(() => import('@/components/landing/SpaceScene'));

// ─── Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const scrollProgress = useScrollProgress();
  const isMobile = useIsMobile();
  const hasWebGL = useWebGLSupport();

  const show3D = hasWebGL;
  const sceneVisible = scrollProgress < 0.75;
  const sceneOpacity = Math.max(0, 1 - scrollProgress * 1.6);
  const inDarkZone = scrollProgress < 0.15;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const handleOpenApp = () => {
    navigate(user ? '/dashboard' : '/chart');
  };

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
      <LandingHeader inDarkZone={inDarkZone} onOpenApp={handleOpenApp} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(7,5,15,0.7) 0%, rgba(7,5,15,0.3) 50%, transparent 80%)',
          }}
          aria-hidden="true"
        />
        <div className="relative text-center max-w-3xl mx-auto pointer-events-auto">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight tracking-[0.12em] leading-[1.05] text-white uppercase"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              textShadow: '0 0 40px rgba(255,184,48,0.3), 0 0 80px rgba(255,140,0,0.15)',
            }}
          >
            Astrologer
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-white/50 font-light leading-relaxed max-w-xl mx-auto">
            Professional-grade astrology software &mdash; beautifully designed, free, and fun to use. All in your browser.
          </p>
          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-12 sm:h-13 px-7 sm:px-9 text-base gap-2 bg-amber-500 text-black hover:bg-amber-400 font-semibold"
              onClick={handleOpenApp}
            >
              Get Started &mdash; Free
              <ChevronRight className="w-4 h-4" />
            </Button>
            <a
              href="#features"
              className="text-sm text-white/35 hover:text-white/55 transition-colors flex items-center gap-1"
            >
              See what's inside
              <ChevronDown className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-white/15" />
        </div>
      </section>

      {/* ── Transition ───────────────────────────────────────── */}
      <div
        className="relative z-10 h-24 sm:h-32"
        style={{
          background: 'linear-gradient(to bottom, #07050F 0%, #ffffff 100%)',
        }}
      />

      {/* ── Light content wrapper — solid white bg covers the dark 3D base ── */}
      <div className="relative z-10 bg-white">

      {/* ── Today's Sky ─────────────────────────────────────── */}
      <TodaysSky onOpenApp={handleOpenApp} />

      {/* ── Feature Bento ───────────────────────────────────── */}
      <div id="features">
        <FeatureBento />
      </div>

      {/* ── Chart Showcase ────────────────────────────────────── */}
      <FeatureShowcase
        tag="Chart Analysis"
        headline={<>Your birth chart.<br className="hidden sm:block" /> Beautiful and precise.</>}
        body="Enter your birth date, time, and place — and watch your chart come to life. Explore aspects, houses, dignities, transits, and more across 13 different ways to understand your sky."
        link="/features/charts"
        linkLabel="Explore chart tools"
        visual={
          <div className="relative group">
            <div className="absolute -inset-10 bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
            <img src="/natal.webp" alt="Natal chart wheel" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
          </div>
        }
      />

      <FeatureShowcase
        tag="Compatibility"
        headline={<>See the connection<br className="hidden sm:block" /> between any two people.</>}
        body="Compare any two birth charts side by side. Discover what draws people together — and where the growth edges are. Radar charts, heatmaps, scoring, and 14 tools for understanding your relationships."
        link="/features/compatibility"
        linkLabel="Explore compatibility tools"
        reversed
        visual={
          <div className="relative group">
            <div className="absolute -inset-10 bg-gradient-to-br from-blue-500/[0.07] to-violet-500/[0.04] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
            <img src="/synastry.webp" alt="Synastry biwheel chart" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
          </div>
        }
      />

      {/* ── Advanced Section ──────────────────────────────────── */}
      <FeaturePreview
        tag="Advanced Techniques"
        headline="Every technique working astrologers need."
        description="Solar returns, progressions, rectification, 50+ asteroids, 10 house systems, sidereal mode, and Arabic parts."
        pills={['Progressions', 'Solar Returns', 'Rectification', '50+ Asteroids', '10 House Systems', 'Sidereal']}
        pillColors={{ border: 'border-violet-500/20', text: 'text-violet-500/70', bg: 'bg-violet-500/5' }}
        link="/features/advanced"
        linkLabel="Explore advanced tools"
        gradientClass="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600"
        visual={
          <div className="relative group">
            <div className="absolute -inset-10 bg-gradient-to-br from-violet-500/[0.06] to-purple-500/[0.03] rounded-[2rem] blur-3xl opacity-70" />
            <img src="/asteroids.webp" alt="Advanced astrology tools" loading="lazy" className="w-full h-auto relative drop-shadow-2xl rounded-2xl" />
          </div>
        }
      />

      {/* ── Galactic Mode ───────────────────────────────────── */}
      <section className="relative py-28 sm:py-36 md:py-44 px-4 sm:px-6 overflow-hidden bg-background">
        <div className="relative max-w-7xl mx-auto flex flex-col items-center gap-10 sm:gap-14">
          <GalacticCompact />
          <div className="w-full relative group">
            <div className="absolute -inset-12 bg-gradient-to-br from-indigo-500/[0.06] via-purple-500/[0.04] to-pink-500/[0.03] rounded-[3rem] blur-3xl opacity-70" />
            <img src="/galactic.webp" alt="Galactic Mode — 3D natal chart visualization" loading="lazy" className="w-full h-auto relative rounded-2xl drop-shadow-2xl border border-border/30" />
          </div>
          <Link to="/features/3d" className="inline-flex items-center gap-1.5 text-sm text-indigo-500/60 hover:text-indigo-600 transition-colors">
            See more <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Markets Section ──────────────────────────────────── */}
      <FeaturePreview
        tag="Financial Astrology"
        headline="Company charts meet market data."
        description="Cast natal charts for 76 companies, overlay planetary transits on real stock prices, and explore AI-labeled financial news."
        pills={['Company Charts', 'Candlestick + Transits', 'AI News Labels', '76 Companies']}
        pillColors={{ border: 'border-emerald-500/20', text: 'text-emerald-500/70', bg: 'bg-emerald-500/5' }}
        link="/features/financial"
        linkLabel="Explore financial astrology"
        gradientClass="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600"
      />

      {/* ── Live Sessions ───────────────────────────────────── */}
      <LiveSessionsCompact />

      {/* ── Community Section ─────────────────────────────────── */}
      <FeaturePreview
        tag="Community"
        headline="A place for real astrological discussion."
        description="Topic-based spaces where you can share charts, ask questions, and learn from other astrologers."
        pills={['Topic Spaces', 'Chart Embedding', 'Follow System', 'Discussions']}
        pillColors={{ border: 'border-sky-500/20', text: 'text-sky-500/70', bg: 'bg-sky-500/5' }}
        link="/features/community"
        linkLabel="Explore the community"
        gradientClass="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600"
      />

      {/* ── What's Included ───────────────────────────────────── */}
      <section className="relative z-10 bg-background py-20 sm:py-28 px-4 sm:px-6 border-t border-border/30">
        <div ref={toolsFade.ref} style={toolsFade.style} className={`max-w-5xl mx-auto ${toolsFade.className}`}>
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Everything you need. Free.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-3 max-w-lg mx-auto">
              Every core feature is included at no cost. No trial period, no feature gates on chart calculations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: 'Every chart type',
                items: ['Natal charts', 'Synastry & composite', 'Progressions & solar arc', 'Solar & lunar returns', 'Harmonic charts'],
              },
              {
                title: 'Deep analysis tools',
                items: ['Aspect grid with orb control', 'Transit timeline & forecasting', 'Profections & activations', 'Essential & accidental dignities', 'Declination & fixed stars'],
              },
              {
                title: 'Full customization',
                items: ['10 house systems & sidereal', '50+ asteroids & Arabic parts', 'Custom orbs & aspect presets', 'Import from Astro.com', 'PNG export & chart sharing'],
              },
            ].map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-foreground mb-4">{group.title}</h3>
                <div className="space-y-2.5">
                  {group.items.map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="h-12 px-8 text-base gap-2"
              onClick={handleOpenApp}
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Learn ───────────────────────────────────────────── */}
      <LearnSection />

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="relative z-10 bg-background py-24 sm:py-32 px-4 sm:px-6 border-t border-border/30" id="pricing">
        <div ref={pricingFade.ref} style={pricingFade.style} className={`max-w-4xl mx-auto ${pricingFade.className}`}>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Go further with Pro.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-3 max-w-lg mx-auto">
              Charts and calculations are always free. Pro adds AI readings, live sessions, and unlimited saved charts.
            </p>
          </div>
          <PricingToggle onSubscribe={() => (user ? setShowUpgrade(true) : setShowAuth(true))} />
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────── */}
      <AboutSection />

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <FAQSection />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative z-10 bg-background py-24 sm:py-32 px-4 sm:px-6 border-t border-border/30">
        <div ref={ctaFade.ref} style={ctaFade.style} className={`max-w-2xl mx-auto text-center space-y-6 ${ctaFade.className}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Your chart is waiting.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            Enter your birth details and meet the sky you were born under. It takes about a minute.
          </p>
          <Button
            size="lg"
            className="h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg gap-2 mt-2"
            onClick={handleOpenApp}
          >
            Get Started &mdash; Free
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <LandingFooter />

      </div>{/* end light content wrapper */}

      {/* ── Modals ───────────────────────────────────────────── */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}

// ─── Compact Galactic Section ─────────────────────────────────────────

function GalacticCompact() {
  const fade = useFadeIn(0);
  return (
    <div ref={fade.ref} style={fade.style} className={`text-center max-w-2xl ${fade.className}`}>
      <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 text-indigo-500/80">
        Galactic Mode
        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-500 rounded border border-indigo-500/20">
          Beta
        </span>
      </div>
      <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Your chart<br className="hidden sm:block" /> in 3D.
        </span>
      </h2>
      <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl leading-relaxed text-muted-foreground max-w-xl mx-auto">
        See your natal chart from a whole new perspective. Fly through your planets, aspect beams, and zodiac ring &mdash; rendered in real-time with bloom lighting you can orbit around.
      </p>
    </div>
  );
}

// ─── Compact Live Sessions Section ────────────────────────────────────

function LiveSessionsCompact() {
  const fade = useFadeIn();
  return (
    <section className="relative py-24 sm:py-32 md:py-40 px-4 sm:px-6 overflow-hidden bg-background border-t border-border/30">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-rose-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <div ref={fade.ref} style={fade.style} className={`relative max-w-4xl mx-auto flex flex-col items-center gap-10 ${fade.className}`}>
        <div className="text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 text-rose-500/80">
            Live Sessions
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/10 text-rose-500 rounded border border-rose-500/20">
              Pro
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
              Read charts together.<br className="hidden sm:block" /> In real time.
            </span>
          </h2>
          <p className="mt-6 sm:mt-8 text-base sm:text-lg leading-relaxed text-foreground/50 max-w-xl mx-auto">
            Share your screen with a client, walk through their chart together, and record the whole session. AI handles the transcript, summary, and chapter markers &mdash; so you can focus on the reading.
          </p>
        </div>

        {/* 3-step flow */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              title: 'Start a session',
              desc: 'Name your reading and share a link. Your client joins from any device.',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <circle cx="12" cy="12" r="2" />
                  <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
                </svg>
              ),
            },
            {
              step: '2',
              title: 'Read the chart together',
              desc: 'They see everything you do in real time — chart movements, highlights, cursor.',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                  <path d="m13 13 6 6" />
                </svg>
              ),
            },
            {
              step: '3',
              title: 'Replay anytime',
              desc: 'Audio, chart movements, and cursor all stay in sync. Share the replay link with your client.',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ),
            },
          ].map((s) => (
            <div key={s.step} className="text-center sm:text-left p-5 sm:p-6 rounded-2xl bg-muted/20 border border-border/40">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-500 mb-4">
                {s.icon}
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">{s.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <Link to="/features/sessions" className="inline-flex items-center gap-1.5 text-sm text-rose-500/60 hover:text-rose-500 transition-colors">
          Learn more about sessions <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
