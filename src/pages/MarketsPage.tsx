import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { supabase } from '@/lib/supabase';
import { swissEphemeris } from '@/api/swissEphemeris';
import { COMPANIES, type Company } from '@/data/companies';
import { PriceChart } from '@/components/markets/PriceChart';
import { CompanySearch } from '@/components/markets/CompanySearch';
import { CompanyBirthChart, getSunSign, formatDate } from '@/components/markets/CompanyBirthChart';
import { AddCompanyDialog } from '@/components/markets/AddCompanyDialog';
import { StockStats } from '@/components/markets/StockStats';
import { EventsPanel, loadEvents, type MarketEvent } from '@/components/markets/EventsPanel';
import { EventRibbon } from '@/components/markets/EventRibbon';
import { useStockQuote } from '@/hooks/useStockQuote';
import { useStockHistory } from '@/hooks/useStockHistory';
import { useStockNews } from '@/hooks/useStockNews';
import type { NatalChart } from '@/components/biwheel/types';
import type { TransitData, AsteroidsParam } from '@/components/biwheel/types';
import { ZODIAC_SIGNS } from '@/components/biwheel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, CalendarClock, Table2, Crown, ArrowUpDown, TrendingUp, Loader2 } from 'lucide-react';

const BiWheelMobileWrapper = lazy(() =>
  import('@/components/biwheel/BiWheelMobileWrapper').then(m => ({ default: m.BiWheelMobileWrapper }))
);

const AspectGridTable = lazy(() =>
  import('@/components/astro-tools/AspectGridTable').then(m => ({ default: m.AspectGridTable }))
);
const TransitTimeline = lazy(() =>
  import('@/components/astro-tools/TransitTimeline').then(m => ({ default: m.TransitTimeline }))
);
const EphemerisTable = lazy(() =>
  import('@/components/astro-tools/EphemerisTable').then(m => ({ default: m.EphemerisTable }))
);
const GraphicEphemeris = lazy(() =>
  import('@/components/astro-tools/GraphicEphemeris').then(m => ({ default: m.GraphicEphemeris }))
);
const DignityTable = lazy(() =>
  import('@/components/astro-tools/DignityTable').then(m => ({ default: m.DignityTable }))
);
const DeclinationPanel = lazy(() =>
  import('@/components/astro-tools/DeclinationPanel').then(m => ({ default: m.DeclinationPanel }))
);

const CUSTOM_STORAGE_KEY = 'markets-custom-companies';
const RANGES = ['1m', '3m', '6m', '1y', '2y', '5y'] as const;

function parseNatalResponse(data: any): NatalChart {
  const planets: Record<string, any> = {};
  if (data.planets && Array.isArray(data.planets)) {
    for (const p of data.planets) {
      let key = (p.name || p.planet || '').toLowerCase();
      if (key === 'north node' || key === 'true_node' || key === 'mean_node') key = 'northnode';
      if (key === 'south node') key = 'southnode';
      if (!key) continue;
      planets[key] = {
        longitude: p.longitude ?? p.abs_pos ?? 0,
        latitude: p.latitude ?? undefined,
        sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)] || '',
        degree: p.degree ?? undefined,
        minute: p.minute ?? undefined,
        retrograde: p.retrograde ?? false,
      };
    }
  }
  const houses: Record<string, number> = {};
  if (data.houses) {
    if (Array.isArray(data.houses)) {
      data.houses.forEach((cusp: number, i: number) => { houses[`house_${i + 1}`] = cusp; });
    } else if (data.houses.cusps) {
      data.houses.cusps.forEach((cusp: number, i: number) => { houses[`house_${i + 1}`] = cusp; });
    }
  }
  let angles: { ascendant: number; midheaven: number } | undefined;
  if (data.angles) {
    angles = { ascendant: data.angles.ascendant ?? data.angles.asc ?? 0, midheaven: data.angles.midheaven ?? data.angles.mc ?? 0 };
  } else if (data.houses?.ascendant !== undefined) {
    angles = { ascendant: data.houses.ascendant, midheaven: data.houses.mc ?? data.houses.midheaven ?? 0 };
  }
  return { planets, houses, angles };
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MarketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Theme
  const [pageTheme, setPageTheme] = useState(() => localStorage.getItem('astrologer_theme') || 'classic');
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);
  const isDark = isThemeDark(pageTheme);
  const tvTheme = isDark ? 'dark' : 'light';

  // Company state
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(
    COMPANIES.find(c => c.ticker === 'AAPL') || null
  );
  const [sectorFilter, setSectorFilter] = useState('');
  const [customCompanies, setCustomCompanies] = useState<Company[]>(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY) || '[]'); }
    catch { return []; }
  });
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Price data
  const [range, setRange] = useState<string>('1y');
  const { quote, loading: quoteLoading, error: quoteError } = useStockQuote(selectedTicker);
  const { candles, loading: historyLoading, error: historyError } = useStockHistory(selectedTicker, range);

  // News
  const { articles: newsArticles, loading: newsLoading, fetchNews, clearNews } = useStockNews();

  // Natal chart state
  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);
  const [natalLoading, setNatalLoading] = useState(false);

  // Transit date (synced from chart clicks)
  const [transitDate, setTransitDate] = useState(todayStr);

  // Events
  const [manualEvents, setManualEvents] = useState<MarketEvent[]>([]);

  // Group news by date → use AI label as marker text (overarching theme)
  const newsMarkers: MarketEvent[] = useMemo(() => {
    const dateMap = new Map<string, { count: number; label?: string }>();
    for (const a of newsArticles) {
      const existing = dateMap.get(a.date);
      if (existing) {
        existing.count++;
        if (!existing.label && a.ai_label) existing.label = a.ai_label;
      } else {
        dateMap.set(a.date, { count: 1, label: a.ai_label });
      }
    }
    return Array.from(dateMap.entries())
      .filter(([, { label }]) => label && label !== 'Market Update' && label !== '—') // skip generic
      .map(([date, { count, label }]) => ({
        id: `news-${date}`,
        date,
        title: label!,
        description: `${count} article${count !== 1 ? 's' : ''}`,
        color: '#3b82f6',
        source: 'auto' as const,
      }));
  }, [newsArticles]);

  // Merge manual events + news markers for the chart
  const chartEvents = useMemo(() =>
    [...manualEvents, ...newsMarkers].sort((a, b) => b.date.localeCompare(a.date)),
    [manualEvents, newsMarkers]
  );

  // Compute date range from selected range for news fetching
  const getRangeDates = useCallback((r: string) => {
    const rangeDays: Record<string, number> = {
      '1m': 30, '3m': 90, '6m': 180, '1y': 365, '2y': 730, '5y': 1825,
    };
    const days = rangeDays[r] || 365;
    const now = new Date();
    const from = new Date(now.getTime() - days * 86400 * 1000);
    return {
      from: from.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  }, []);

  const handleFetchNews = useCallback(() => {
    const { from, to } = getRangeDates(range);
    fetchNews(selectedTicker, from, to);
  }, [selectedTicker, range, fetchNews, getRangeDates]);

  // Astro tools tab
  const [activeAstroTab, setActiveAstroTab] = useState('aspect-grid');

  // Sync date picker → BiWheel
  const biWheelExternalState = useMemo(() => ({
    showTransits: true,
    transitDate,
    transitTime: '12:00',
  }), [transitDate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  // Sync dark class to <html>
  useEffect(() => {
    const dark = isThemeDark(pageTheme);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [pageTheme]);

  // Load theme
  useEffect(() => {
    if (!user) return;
    supabase.from('astrologer_profiles').select('theme').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.theme && data.theme !== pageTheme) {
          setPageTheme(data.theme);
          localStorage.setItem('astrologer_theme', data.theme);
        }
      });
  }, [user]);

  // Calculate natal chart when company changes
  useEffect(() => {
    if (!selectedCompany || (selectedCompany.lat === 0 && selectedCompany.lng === 0)) {
      setNatalChart(null);
      return;
    }
    let cancelled = false;
    setNatalLoading(true);
    swissEphemeris.natal({
      birth_date: selectedCompany.incorporationDate,
      birth_time: selectedCompany.incorporationTime || '12:00',
      lat: selectedCompany.lat,
      lng: selectedCompany.lng,
    })
      .then((data: any) => { if (!cancelled) setNatalChart(parseNatalResponse(data)); })
      .catch(() => { if (!cancelled) setNatalChart(null); })
      .finally(() => { if (!cancelled) setNatalLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCompany]);

  // Load manual events when ticker changes
  useEffect(() => {
    setManualEvents(loadEvents(selectedTicker));
  }, [selectedTicker]);

  // Auto-fetch news when ticker or range changes
  useEffect(() => {
    const t = setTimeout(() => {
      const { from, to } = getRangeDates(range);
      fetchNews(selectedTicker, from, to);
    }, 400); // debounce
    return () => clearTimeout(t);
  }, [selectedTicker, range]);

  const handleSelect = (company: Company | null, ticker: string) => {
    setSelectedTicker(ticker);
    setSelectedCompany(company);
    setTransitDate(todayStr());
  };

  const handleAddCompany = (company: Company) => {
    setCustomCompanies(prev => [...prev, company]);
    setSelectedTicker(company.ticker);
    setSelectedCompany(company);
  };

  // Chart click → sync transit date
  const handleDateSelect = useCallback((date: string) => {
    setTransitDate(date);
  }, []);

  // Transit fetch for BiWheel
  const handleFetchTransits = useCallback(async (
    date: string, time: string, _chartA: NatalChart, _chartB: NatalChart, asteroids?: AsteroidsParam
  ): Promise<TransitData> => {
    const lat = selectedCompany?.lat ?? 0;
    const lng = selectedCompany?.lng ?? 0;
    const body: Record<string, unknown> = { birth_date: date, birth_time: time, lat, lng };
    if (asteroids) body.asteroids = asteroids;
    const data = await swissEphemeris.natal(body);
    const transitPlanets: any[] = [];
    if (data.planets && Array.isArray(data.planets)) {
      for (const p of data.planets) {
        let key = (p.name || p.planet || '').toLowerCase();
        if (key === 'north node' || key === 'true_node' || key === 'mean_node') key = 'northnode';
        if (key === 'south node') key = 'southnode';
        if (!key) continue;
        transitPlanets.push({
          planet: key,
          longitude: p.longitude ?? p.abs_pos ?? 0,
          latitude: p.latitude ?? 0,
          sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)] || '',
          degree: Math.floor((p.longitude ?? 0) % 30),
          minute: Math.floor(((p.longitude ?? 0) % 1) * 60),
          retrograde: p.retrograde ?? false,
        });
      }
    }
    return { transit_date: date, transit_time: time, transit_planets: transitPlanets, aspects_to_natal: [] };
  }, [selectedCompany?.lat, selectedCompany?.lng]);

  if (!user) return null;

  return (
    <div
      className={`min-h-screen bg-background text-foreground ${isDark ? 'dark' : ''}`}
      style={themeVars}
    >
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container flex items-center justify-between py-3 px-4 md:px-6">
          <Link to="/dashboard" className="text-sm md:text-base font-extralight tracking-[0.12em] uppercase shrink-0" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Astrologer
          </Link>
          <ProfileDropdown />
        </div>
      </header>

      <main className="container px-4 md:px-6 py-6 max-w-7xl space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Astrology</h1>
          <p className="text-sm text-muted-foreground mt-1">Market charts, company birth charts & financial news</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Click any candle to view transits + news for that date. Blue dots mark major events.</p>
        </div>

        {/* Search */}
        <CompanySearch
          onSelect={handleSelect}
          customCompanies={customCompanies}
          onAddCompany={() => setShowAddDialog(true)}
          sectorFilter={sectorFilter}
          onSectorFilterChange={setSectorFilter}
        />

        {/* Company info strip */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg font-bold">{selectedTicker}</span>
          {selectedCompany && (
            <>
              <span className="text-sm text-muted-foreground">{selectedCompany.name}</span>
              <Badge variant="outline" className="text-[10px]">{selectedCompany.sector}</Badge>
              <span className="text-xs text-muted-foreground">
                Founded {formatDate(selectedCompany.incorporationDate)}
              </span>
              <span className="text-xs text-muted-foreground">
                Sun in <span className="font-medium text-foreground">{getSunSign(selectedCompany.incorporationDate)}</span>
              </span>
            </>
          )}
        </div>

        {/* Stock stats */}
        <StockStats quote={quote} loading={quoteLoading} error={quoteError} />

        {/* Range selector */}
        <div className="flex items-center gap-1">
          {RANGES.map(r => (
            <Button
              key={r}
              variant={range === r ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setRange(r)}
            >
              {r.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Price chart + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-0">
            <div className="rounded-lg border bg-card overflow-hidden">
              <PriceChart
                candles={candles}
                loading={historyLoading}
                theme={tvTheme}
                events={chartEvents}
                onDateSelect={handleDateSelect}
              />
              {historyError && (
                <p className="text-xs text-destructive px-3 pb-2">{historyError}</p>
              )}
            </div>
            {newsMarkers.length > 0 && (
              <div className="rounded-lg border bg-card/50 mt-2 px-3">
                <EventRibbon
                  events={newsMarkers}
                  selectedDate={transitDate}
                  onSelectDate={handleDateSelect}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            {selectedCompany && <CompanyBirthChart company={selectedCompany} />}
            <EventsPanel
              ticker={selectedTicker}
              manualEvents={manualEvents}
              onManualEventsChange={setManualEvents}
              selectedDate={transitDate}
              newsArticles={newsArticles}
              onFetchNews={handleFetchNews}
              newsLoading={newsLoading}
            />
          </div>
        </div>

        {/* Natal chart with transits */}
        {selectedCompany && natalChart && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  {selectedCompany.name} — Natal & Transits
                </h2>
                <p className="text-xs text-muted-foreground">
                  Click a candle above or pick a date to view transits on the incorporation chart
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Transit date:</label>
                <Input
                  type="date"
                  value={transitDate}
                  onChange={e => setTransitDate(e.target.value)}
                  className="w-auto h-8 text-xs"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-card overflow-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center h-[600px]">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <BiWheelMobileWrapper
                  key={selectedCompany.ticker}
                  chartA={natalChart}
                  chartB={natalChart}
                  nameA={selectedCompany.name}
                  nameB={selectedCompany.name}
                  initialChartMode="personA"
                  enableTransits={true}
                  enableComposite={false}
                  enableProgressed={false}
                  enableRelocated={false}
                  enableBirthTimeShift={false}
                  onFetchTransits={handleFetchTransits}
                  externalState={biWheelExternalState}
                  onTransitDateChange={handleDateSelect}
                  initialTheme={pageTheme}
                  minSize={500}
                  birthDateA={selectedCompany.incorporationDate}
                  birthTimeA={selectedCompany.incorporationTime || '12:00'}
                />
              </Suspense>
            </div>

            {/* Astro Tools Tabs */}
            <Tabs value={activeAstroTab} onValueChange={setActiveAstroTab}>
              <TabsList className="flex flex-wrap gap-1 w-full bg-transparent rounded-none p-1 h-auto">
                {[
                  { value: 'aspect-grid', icon: Grid3X3, label: 'Aspects' },
                  { value: 'transits', icon: CalendarClock, label: 'Transits' },
                  { value: 'ephemeris', icon: Table2, label: 'Ephemeris' },
                  { value: 'graphic-eph', icon: TrendingUp, label: 'Graph. Eph.' },
                  { value: 'declination', icon: ArrowUpDown, label: 'Declination' },
                  { value: 'dignities', icon: Crown, label: 'Dignities' },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeAstroTab === tab.value;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={`text-[11px] whitespace-nowrap gap-1 rounded-md px-2.5 py-1.5 bg-transparent shadow-none transition-all duration-150 border ${
                        isActive
                          ? 'text-foreground bg-foreground/10 border-foreground/20'
                          : 'text-muted-foreground/50 border-transparent hover:text-muted-foreground hover:bg-muted/30'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <Suspense fallback={
                <div className="mt-4 min-h-[400px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              }>
                <TabsContent value="aspect-grid" className="mt-4 min-h-[400px]">
                  <AspectGridTable
                    chartA={natalChart}
                    nameA={selectedCompany.name}
                    chartMode="personA"
                  />
                </TabsContent>
                <TabsContent value="transits" className="mt-4 min-h-[400px]">
                  <TransitTimeline
                    natalChart={natalChart}
                    birthInfo={{
                      date: selectedCompany.incorporationDate,
                      time: selectedCompany.incorporationTime || '12:00',
                      lat: selectedCompany.lat,
                      lng: selectedCompany.lng,
                    }}
                    personName={selectedCompany.name}
                  />
                </TabsContent>
                <TabsContent value="ephemeris" className="mt-4 min-h-[400px]">
                  <EphemerisTable
                    natalChart={natalChart}
                    birthDate={selectedCompany.incorporationDate}
                    birthTime={selectedCompany.incorporationTime || '12:00'}
                    lat={selectedCompany.lat}
                    lng={selectedCompany.lng}
                    name={selectedCompany.name}
                  />
                </TabsContent>
                <TabsContent value="graphic-eph" className="mt-4 min-h-[400px]">
                  <GraphicEphemeris
                    natalChart={natalChart}
                    birthDate={selectedCompany.incorporationDate}
                    birthTime={selectedCompany.incorporationTime || '12:00'}
                    lat={selectedCompany.lat}
                    lng={selectedCompany.lng}
                    name={selectedCompany.name}
                  />
                </TabsContent>
                <TabsContent value="declination" className="mt-4 min-h-[400px]">
                  <DeclinationPanel
                    chartA={natalChart}
                    nameA={selectedCompany.name}
                  />
                </TabsContent>
                <TabsContent value="dignities" className="mt-4 min-h-[400px]">
                  <DignityTable natalChart={natalChart} />
                </TabsContent>
              </Suspense>
            </Tabs>
          </section>
        )}

        {natalLoading && selectedCompany && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-muted-foreground">Calculating {selectedCompany.name} natal chart...</span>
          </div>
        )}
      </main>

      <AddCompanyDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={handleAddCompany}
      />
    </div>
  );
}
