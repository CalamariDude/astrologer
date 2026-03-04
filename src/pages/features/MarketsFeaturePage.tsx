import React from 'react';
import { FeaturePageLayout } from '@/components/landing/FeaturePageLayout';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { useFadeIn } from '@/hooks/useFadeIn';

const GRID_ITEMS = [
  { icon: '\u2609', title: 'Company Natal Charts', description: 'Cast a natal chart from any company\'s incorporation or IPO date. 76 companies pre-loaded.' },
  { icon: '\u25A1', title: 'Candlestick Price Charts', description: 'Real stock price data rendered as interactive candlestick charts with volume.' },
  { icon: '\u2604', title: 'Transit Overlays', description: 'Click any candle to see which transits were hitting the company\'s natal chart on that date.' },
  { icon: '\u25CE', title: 'Live Stock Stats', description: 'Current price, P/E ratio, market cap, volume, 52-week range, dividend yield, and more.' },
  { icon: '\u2606', title: 'AI-Labeled News Events', description: 'Financial news automatically labeled by AI — "Earnings Beat," "FDA Approval," "CEO Resigns."' },
  { icon: '\u25A6', title: 'Full Analysis Suite', description: 'Aspect grid, transit timeline, ephemeris, graphic ephemeris, declination, and dignities — all for company charts.' },
  { icon: '\u2295', title: 'Custom Companies', description: 'Add any company with its incorporation date. Enter any ticker for live price data.' },
  { icon: '\u270E', title: 'Manual Event Notes', description: 'Pin your own notes and events to specific dates on the price chart timeline.' },
  { icon: '\u2B1A', title: 'Event Ribbon', description: 'Scrollable timeline of all events — click any pill to see news from that period.' },
  { icon: '\u25CB', title: 'Date-Synced Navigation', description: 'Click a candle, and the transit chart, news panel, and event ribbon all sync to that date.' },
  { icon: '\u2610', title: '7 Sectors', description: 'Technology, Finance, Healthcare, Energy, Consumer, Industrials, and Crypto.' },
  { icon: '\u25B3', title: 'Birth Chart + Transits View', description: 'Open any company in the full chart tool with current transits overlaid.' },
];

function SectorShowcase() {
  const fade = useFadeIn();
  const sectors = [
    { name: 'Technology', tickers: 'AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA', color: '#3b82f6' },
    { name: 'Finance', tickers: 'JPM, GS, V, MA, BRK.B', color: '#10b981' },
    { name: 'Healthcare', tickers: 'JNJ, PFE, LLY, MRK', color: '#ef4444' },
    { name: 'Energy', tickers: 'XOM, CVX, NEE', color: '#f59e0b' },
    { name: 'Consumer', tickers: 'WMT, KO, NKE, SBUX, DIS', color: '#8b5cf6' },
    { name: 'Industrials', tickers: 'BA, CAT, GE, LMT', color: '#6b7280' },
    { name: 'Crypto', tickers: 'BTC, ETH, COIN', color: '#f97316' },
  ];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-background">
      <div ref={fade.ref} style={fade.style} className={`max-w-5xl mx-auto ${fade.className}`}>
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">76 companies across 7 sectors</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-3">Pre-loaded with incorporation dates, locations, and live market data.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sectors.map((s) => (
            <div key={s.name} className="flex items-start gap-3 p-4 rounded-xl border border-border/50">
              <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: s.color }} />
              <div>
                <div className="text-sm font-semibold text-foreground">{s.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.tickers}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketsMockVisual() {
  return (
    <div className="relative group flex items-center justify-center">
      <div className="absolute -inset-10 bg-gradient-to-br from-emerald-500/[0.06] to-blue-500/[0.03] rounded-[2rem] blur-3xl transition-opacity group-hover:opacity-100 opacity-70" />
      <div className="relative bg-white rounded-2xl border border-black/[0.08] p-5 sm:p-6 w-full max-w-lg drop-shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-black/40 font-bold uppercase tracking-wider">Company Chart</div>
            <div className="text-lg font-semibold text-black/80 mt-1">Apple Inc. (AAPL)</div>
            <div className="text-[11px] text-black/35">Founded: Apr 1, 1976 {'\u2014'} Cupertino, CA</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-emerald-600">$243.85</div>
            <div className="text-[11px] text-emerald-500">+2.34%</div>
          </div>
        </div>

        <div className="relative h-36 mb-4 rounded-lg bg-black/[0.02] border border-black/[0.04] overflow-hidden">
          <svg viewBox="0 0 400 130" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,85 L40,80 L80,65 L120,70 L160,50 L200,55 L240,40 L280,45 L320,30 L360,35 L400,20" fill="none" stroke="#10b981" strokeWidth="2" />
            <path d="M0,85 L40,80 L80,65 L120,70 L160,50 L200,55 L240,40 L280,45 L320,30 L360,35 L400,20 L400,130 L0,130 Z" fill="url(#chartGrad)" />
            <line x1="160" y1="0" x2="160" y2="130" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <line x1="280" y1="0" x2="280" y2="130" stroke="#d97706" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          </svg>
          {/* Transit aspect pills */}
          <div className="absolute top-2 left-2 flex gap-2">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-violet-500/10 text-violet-500 border border-violet-500/20">{'\u2643'} trine MC</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">{'\u2644'} conj {'\u2609'}</span>
          </div>
          {/* AI news event labels */}
          <div className="absolute bottom-2 left-3 text-[9px] font-semibold text-blue-500/80">Earnings Beat</div>
          <div className="absolute bottom-8 right-16 text-[9px] font-semibold text-blue-500/80">iPhone Launch</div>
          <div className="absolute top-10 right-6 text-[9px] font-semibold text-blue-500/80">AI Partnership</div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Market Cap', value: '3.71T' },
            { label: 'P/E Ratio', value: '32.4' },
            { label: 'Volume', value: '48.2M' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-2 rounded-lg bg-black/[0.02]">
              <div className="text-[10px] text-black/30">{stat.label}</div>
              <div className="text-xs font-semibold text-black/60">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-black/30">
          <span>Click any candle to see transits and news for that date</span>
        </div>
      </div>
    </div>
  );
}

export default function MarketsFeaturePage() {
  return (
    <FeaturePageLayout
      pageTitle="Financial Astrology"
      tag="Financial Astrology"
      title="Company charts meet market data."
      description="Cast natal charts for companies, overlay planetary transits on real stock price data, and explore AI-labeled financial news — all in one integrated workspace."
      gradient="bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-transparent"
    >
      <FeatureShowcase
        tag="Financial Astrology"
        headline={<>Stock prices.<br className="hidden sm:block" /> Planetary transits.</>}
        body="Select a company, see its natal chart alongside live candlestick data. Click any date on the price chart and the transit panel syncs instantly — showing which planets were aspecting the company's chart on that exact day. AI-labeled news events appear right on the chart, so you can see what happened when Saturn crossed the MC."
        visual={<MarketsMockVisual />}
      />

      <SectorShowcase />

      <FeatureGrid items={GRID_ITEMS} columns={3} />
    </FeaturePageLayout>
  );
}
