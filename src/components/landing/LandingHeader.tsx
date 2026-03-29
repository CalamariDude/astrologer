import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const svgProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: 'w-4 h-4' };

const FEATURE_CATEGORIES: { href: string; icon: React.ReactNode; label: string; desc: string }[] = [
  {
    href: '/features/charts',
    icon: <svg {...svgProps}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="3" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21" y2="12"/></svg>,
    label: 'Chart Analysis',
    desc: 'Natal wheels, aspect grids, 13 tools',
  },
  {
    href: '/features/compatibility',
    icon: <svg {...svgProps}><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/></svg>,
    label: 'Compatibility',
    desc: 'Synastry, composites, radar charts',
  },
  {
    href: '/features/celebrities',
    icon: <svg {...svgProps}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    label: 'Celebrity Charts',
    desc: '80 famous birth charts to explore',
  },
  {
    href: '/features/financial',
    icon: <svg {...svgProps}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    label: 'Financial Astrology',
    desc: 'Company charts, stock data, transits',
  },
  {
    href: '/features/advanced',
    icon: <svg {...svgProps}><circle cx="12" cy="12" r="4"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>,
    label: 'Advanced Techniques',
    desc: 'Returns, progressions, rectification',
  },
  {
    href: '/features/3d',
    icon: <svg {...svgProps}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    label: '3D Galactic Mode',
    desc: 'Your chart in three dimensions',
  },
  {
    href: '/features/sessions',
    icon: <svg {...svgProps}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/></svg>,
    label: 'Live Sessions',
    desc: 'Real-time readings with replay',
  },
  {
    href: '/features/community',
    icon: <svg {...svgProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    label: 'Community',
    desc: 'Spaces, posts, chart embeds',
  },
];

export function LandingHeader({
  inDarkZone,
  onOpenApp,
}: {
  inDarkZone: boolean;
  onOpenApp: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const textSecondary = inDarkZone ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const textMuted = inDarkZone ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        backgroundColor: inDarkZone ? 'rgba(7,5,15,0.3)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: inDarkZone ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="text-lg font-extralight tracking-[0.12em] uppercase transition-colors duration-500"
          style={{ fontFamily: "'Inter', system-ui, sans-serif", color: inDarkZone ? '#fff' : '#0a0a0a' }}
        >
          Astrologer
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {/* Features dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setFeaturesOpen(!featuresOpen)}
              className="flex items-center gap-1 text-sm hover:opacity-80 transition-colors duration-500"
              style={{ color: textSecondary }}
            >
              Features
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>
            {featuresOpen && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[420px] rounded-2xl border shadow-2xl p-2 grid grid-cols-2 gap-0.5"
                style={{
                  backgroundColor: inDarkZone ? 'rgba(15,12,30,0.97)' : 'rgba(255,255,255,0.98)',
                  borderColor: inDarkZone ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {FEATURE_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.href}
                    to={cat.href}
                    onClick={() => setFeaturesOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/[0.05]"
                    style={{ color: inDarkZone ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}
                  >
                    <span className="mt-0.5 flex-shrink-0 opacity-50">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{cat.label}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: textMuted }}>{cat.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <a href="#learn" className="text-sm hover:opacity-80 transition-colors duration-500" style={{ color: textSecondary }}>
            Learn
          </a>
          <a href="#pricing" className="text-sm hover:opacity-80 transition-colors duration-500" style={{ color: textSecondary }}>
            Pricing
          </a>
          <Link to="/blog" className="text-sm hover:opacity-80 transition-colors duration-500" style={{ color: textSecondary }}>
            Blog
          </Link>
          <Link to="/astrologers" className="text-sm hover:opacity-80 transition-colors duration-500" style={{ color: textSecondary }}>
            Astrologers
          </Link>
          <Button size="sm" className={inDarkZone ? 'bg-white text-black hover:bg-white/90' : ''} onClick={onOpenApp}>
            Open App
          </Button>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ color: inDarkZone ? '#fff' : '#0a0a0a' }}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden px-4 pb-4 space-y-1"
          style={{ backgroundColor: inDarkZone ? 'rgba(7,5,15,0.95)' : 'rgba(255,255,255,0.95)' }}
        >
          <div className="py-2">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-2"
              style={{ color: inDarkZone ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }}
            >
              Features
            </div>
            {FEATURE_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                to={cat.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm"
                style={{ color: inDarkZone ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
              >
                <span className="opacity-50 flex-shrink-0">{cat.icon}</span>
                {cat.label}
              </Link>
            ))}
          </div>
          <a
            href="#learn"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-2 text-sm"
            style={{ color: inDarkZone ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}
          >
            Learn
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-2 text-sm"
            style={{ color: inDarkZone ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}
          >
            Pricing
          </a>
          <Link
            to="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-2 text-sm"
            style={{ color: inDarkZone ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}
          >
            Blog
          </Link>
          <Link
            to="/astrologers"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-2 text-sm"
            style={{ color: inDarkZone ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}
          >
            Astrologers
          </Link>
          <Button size="sm" className="w-full mt-1" onClick={() => { setMobileMenuOpen(false); onOpenApp(); }}>
            Open App
          </Button>
        </div>
      )}
    </header>
  );
}
