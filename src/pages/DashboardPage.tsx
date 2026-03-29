import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BarChart3, Radio, FolderOpen, MessageSquare, TrendingUp, Loader2,
  Heart, MessageCircle, ArrowRight, Sun, Moon, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { BirthDetailsModal } from '@/components/BirthDetailsModal';
import { supabase } from '@/lib/supabase';
import { swissEphemeris } from '@/api/swissEphemeris';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { formatDistanceToNow } from '@/components/community/utils';

// ─── Helpers ──────────────────────────────────────────────────────

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function getSign(longitude: number): string {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  return signs[Math.floor(longitude / 30)];
}

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const SIGN_GLYPHS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '\u2609\uFE0E', Moon: '\u263D\uFE0E', Mercury: '\u263F\uFE0E', Venus: '\u2640\uFE0E',
  Mars: '\u2642\uFE0E', Jupiter: '\u2643\uFE0E', Saturn: '\u2644\uFE0E', Uranus: '\u2645\uFE0E',
  Neptune: '\u2646\uFE0E', Pluto: '\u2647\uFE0E',
  'North Node': '\u260A\uFE0E', 'South Node': '\u260B\uFE0E',
  Chiron: '\u26B7\uFE0E', Lilith: '\u26B8\uFE0E',
  Ceres: '\u26B3\uFE0E', Pallas: '\u26B4\uFE0E', Juno: '\u26B5\uFE0E', Vesta: '\u26B6\uFE0E',
};

const ASPECT_STYLES: Record<string, { color: string; symbol: string }> = {
  conjunction: { color: '#daa520', symbol: '\u260C' },
  sextile: { color: '#1e5aa8', symbol: '\u26B9' },
  square: { color: '#c41e3a', symbol: '\u25A1' },
  trine: { color: '#00bcd4', symbol: '\u25B3' },
  opposition: { color: '#c41e3a', symbol: '\u260D' },
  quincunx: { color: '#228b22', symbol: '\u26BB' },
  'semi-sextile': { color: '#228b22', symbol: '\u26BA' },
  semisextile: { color: '#228b22', symbol: '\u26BA' },
  'semi-square': { color: '#c41e3a', symbol: '\u2220' },
  semisquare: { color: '#c41e3a', symbol: '\u2220' },
  sesquiquadrate: { color: '#c41e3a', symbol: '\u26BC' },
};

// ─── Component ────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();


  // Theme
  const [pageTheme, setPageTheme] = useState(() => localStorage.getItem('astrologer_theme') || 'classic');
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);

  // Sync dark class to <html> so it persists across navigations
  useEffect(() => {
    const dark = isThemeDark(pageTheme);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [pageTheme]);

  // Horoscope (single paragraph + question) — load from localStorage cache first
  const [horoscope, setHoroscope] = useState<{ content: string; question: string; natal_snapshot?: any; generic?: boolean; sign?: string } | null>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('horoscope_cache') || 'null');
      if (cached && cached.date === getTodayDate()) return cached.horoscope;
    } catch {}
    return null;
  });
  const [weeklyHoroscope, setWeeklyHoroscope] = useState<{ content: string; generic?: boolean; sign?: string } | null>(null);
  const [monthlyHoroscope, setMonthlyHoroscope] = useState<{ content: string; generic?: boolean; sign?: string } | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [horoscopeError, setHoroscopeError] = useState<string | null>(null);
  // Transits
  const [transitData, setTransitData] = useState<{ sunSign?: string; moonSign?: string; aspects?: any[] } | null>(null);
  const [transitLoading, setTransitLoading] = useState(false);

  // Modal
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Birth details onboarding
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [birthCheckDone, setBirthCheckDone] = useState(false);

  // User's saved natal chart (for Solar/Lunar Return NavCards)
  const [userNatalChart, setUserNatalChart] = useState<{ name: string; date: string; time: string; location: string; lat: number; lng: number } | null>(null);

  // Community feed (top posts)
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  // Check if user has any saved natal charts — if not, show onboarding modal
  // Also cache the first natal chart for Solar/Lunar Return NavCards
  useEffect(() => {
    if (!user) return;
    supabase
      .from('saved_charts')
      .select('id, person_a_name, person_a_date, person_a_time, person_a_location, person_a_lat, person_a_lng')
      .eq('user_id', user.id)
      .eq('chart_type', 'natal')
      .order('created_at', { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setShowBirthModal(true);
        } else {
          const c = data[0];
          setUserNatalChart({
            name: c.person_a_name || '',
            date: c.person_a_date || '',
            time: c.person_a_time || '12:00',
            location: c.person_a_location || '',
            lat: c.person_a_lat ?? 0,
            lng: c.person_a_lng ?? 0,
          });
        }
        setBirthCheckDone(true);
      });
  }, [user]);

  // Sync theme from profile (localStorage used immediately, DB fetch updates if changed)
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

  // Fetch horoscopes (works for all users — paid get personal, free get generic)
  const fetchHoroscopes = useCallback(async () => {
    if (!user) return;
    // Skip fetch if we already have a cached horoscope for today
    const todayStr = getTodayDate();
    try {
      const cached = JSON.parse(localStorage.getItem('horoscope_cache') || 'null');
      if (cached && cached.date === todayStr && horoscope) { return; }
    } catch {}

    setHoroscopeLoading(true);
    setHoroscopeError(null);
    try {
      const { data, error } = await supabase.functions.invoke('astrologer-daily-horoscope', {
        body: { local_date: todayStr },
      });
      if (error) {
        let msg = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body?.error) msg = body.error;
          }
        } catch { /* ignore parse errors */ }
        throw new Error(msg);
      }
      if (data?.error) {
        setHoroscopeError(data.error);
      } else {
        if (data?.horoscope) {
          setHoroscope(data.horoscope);
          localStorage.setItem('horoscope_cache', JSON.stringify({ date: todayStr, horoscope: data.horoscope }));
        }
        if (data?.weekly) setWeeklyHoroscope(data.weekly);
        if (data?.monthly) setMonthlyHoroscope(data.monthly);
      }
    } catch (err: any) {
      setHoroscopeError(err.message || 'Failed to load horoscopes');
    } finally {
      setHoroscopeLoading(false);
    }
  }, [user, horoscope]);

  useEffect(() => {
    fetchHoroscopes();
  }, [fetchHoroscopes]);

  // Fetch transit highlights (free for all)
  useEffect(() => {
    if (!user) return;
    setTransitLoading(true);
    const today = getTodayDate();
    swissEphemeris.natal({
      birth_date: today,
      birth_time: '12:00',
      lat: 0,
      lng: 0,
    })
      .then((data: any) => {
        const planets = data.planets || [];
        const sun = planets.find((p: any) => p.planet === 'Sun' || p.name === 'Sun');
        const moon = planets.find((p: any) => p.planet === 'Moon' || p.name === 'Moon');
        setTransitData({
          sunSign: sun ? (sun.sign || getSign(sun.longitude || 0)) : undefined,
          moonSign: moon ? (moon.sign || getSign(moon.longitude || 0)) : undefined,
          aspects: data.aspects?.filter((a: any) => a.orb <= 2).slice(0, 5) || [],
        });
      })
      .catch(() => setTransitData(null))
      .finally(() => setTransitLoading(false));
  }, [user]);

  const natalSnapshot = useMemo(() => {
    return horoscope?.natal_snapshot || null;
  }, [horoscope]);

  // Fetch top community posts (sorted by likes)
  useEffect(() => {
    if (!user) return;
    setFeedLoading(true);
    supabase
      .from('community_posts')
      .select(`
        id, title, body, like_count, comment_count, created_at, user_id,
        space:community_spaces(name, icon, color)
      `)
      .eq('is_hidden', false)
      .order('like_count', { ascending: false })
      .limit(5)
      .then(async ({ data }) => {
        const posts = data || [];
        const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const map: Record<string, any> = {};
          // Primary: astrologer_profiles
          const { data: astroProfiles } = await supabase.from('astrologer_profiles').select('id, display_name').in('id', userIds);
          for (const ap of (astroProfiles || [])) map[ap.id] = { id: ap.id, display_name: ap.display_name, first_name: ap.display_name };
          // Optional: community profiles
          try {
            const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, first_name, display_name, photos, avatar_url').in('id', userIds);
            if (!pErr) for (const p of (profiles || [])) map[p.id] = { ...map[p.id], ...p, display_name: p.display_name || map[p.id]?.display_name };
          } catch { /* profiles table may not exist */ }
          setTopPosts(posts.map(p => ({ ...p, author: map[p.user_id] || null })));
        } else {
          setTopPosts(posts);
        }
      })
      .catch(() => setTopPosts([]))
      .finally(() => setFeedLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div
      className={`min-h-screen ${isThemeDark(pageTheme) ? 'dark' : ''}`}
      style={themeVars}
    >
      {/* ── Header ── */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container flex items-center justify-between py-3 px-4 md:px-6">
          <Link to="/" className="text-sm md:text-base font-extralight tracking-[0.12em] uppercase shrink-0" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Astrologer
          </Link>
          <ProfileDropdown />
        </div>
      </header>

      <main className="container px-4 md:px-6 py-6 max-w-6xl space-y-8">
        {/* ── Horoscope Section ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Your Daily Horoscope</h2>
              <p className="text-sm text-muted-foreground">{getTodayLabel()}</p>
            </div>
            {natalSnapshot && (
              <Badge variant="outline" className="text-[10px] hidden sm:flex">
                {natalSnapshot.sun} &middot; {natalSnapshot.moon}{natalSnapshot.rising ? ` · ${natalSnapshot.rising}` : ''}
              </Badge>
            )}
          </div>

          {horoscope?.generic ? (
            /* Generic sign horoscope for free users */
            <div className="space-y-4">
              {/* Daily */}
              <div className="rounded-2xl border bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-[10px]">{horoscope.sign}</Badge>
                  <span className="text-xs text-muted-foreground">Daily</span>
                </div>
                <p
                  className="text-base md:text-lg leading-relaxed text-foreground/90"
                  style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif", fontSize: '1.0625rem', lineHeight: '1.75', letterSpacing: '-0.01em' }}
                >
                  {horoscope.content}
                </p>
                <div className="mt-5 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className="text-xs text-muted-foreground">Want a reading based on your exact birth chart?</span>
                  <Button size="sm" variant="outline" className="text-xs h-7 shrink-0" onClick={() => setShowUpgrade(true)}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Upgrade to Personal Horoscope
                  </Button>
                </div>
              </div>

              {/* Weekly */}
              {weeklyHoroscope && (
                <div className="rounded-2xl border bg-card p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-[10px]">{weeklyHoroscope.sign}</Badge>
                    <span className="text-xs text-muted-foreground">This Week</span>
                  </div>
                  <p
                    className="text-sm leading-relaxed text-foreground/80"
                    style={{ lineHeight: '1.7' }}
                  >
                    {weeklyHoroscope.content}
                  </p>
                </div>
              )}

              {/* Monthly */}
              {monthlyHoroscope && (
                <div className="rounded-2xl border bg-card p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-[10px]">{monthlyHoroscope.sign}</Badge>
                    <span className="text-xs text-muted-foreground">This Month</span>
                  </div>
                  <p
                    className="text-sm leading-relaxed text-foreground/80"
                    style={{ lineHeight: '1.7' }}
                  >
                    {monthlyHoroscope.content}
                  </p>
                </div>
              )}
            </div>
          ) : horoscopeLoading ? (
            /* Loading skeleton — single card */
            <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-3">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-4/5 h-4" />
              <Skeleton className="w-3/5 h-4" />
              <div className="pt-3">
                <Skeleton className="w-3/4 h-4" />
              </div>
            </div>
          ) : horoscopeError ? (
            /* Error state */
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">{horoscopeError}</p>
                {horoscopeError.includes('birth chart') ? (
                  <Button size="sm" onClick={() => navigate('/chart')}>
                    Go to Chart Tool
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={fetchHoroscopes}>
                    Try Again
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : horoscope ? (
            /* Single horoscope card */
            <div className="rounded-2xl border bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 p-6 md:p-8">
              <div className="space-y-3">
                {horoscope.content.split('\n').filter(Boolean).map((line, i) => (
                  <p
                    key={i}
                    className="text-base md:text-lg leading-relaxed text-foreground/90"
                    style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif", fontSize: '1.0625rem', lineHeight: '1.75', letterSpacing: '-0.01em' }}
                  >
                    {line}
                  </p>
                ))}
              </div>
              {horoscope.question && (
                <div className="mt-5 pt-4 border-t border-border/40">
                  <p
                    className="text-base md:text-lg font-medium text-foreground"
                    style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif", fontSize: '1.0625rem', lineHeight: '1.75', letterSpacing: '-0.01em' }}
                  >
                    {horoscope.question}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Empty state — no horoscope data yet */
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">Your horoscope isn't available yet today.</p>
                <Button size="sm" variant="outline" onClick={fetchHoroscopes}>
                  <Loader2 className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Tools ── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tools</h3>
          <div className="grid grid-cols-2 gap-3">
            <NavCard
              icon={BarChart3}
              label="Chart Tool"
              desc="Birth charts, synastry, transits"
              onClick={() => { navigate('/chart'); window.scrollTo(0, 0); }}
            />
            <NavCard
              icon={FolderOpen}
              label="Charts"
              desc="Saved chart library"
              onClick={() => { navigate('/charts'); window.scrollTo(0, 0); }}
            />
            <NavCard
              icon={Radio}
              label="Sessions"
              desc="Recorded chart readings"
              onClick={() => { navigate('/sessions'); window.scrollTo(0, 0); }}
            />
            <NavCard
              icon={TrendingUp}
              label="Transits"
              desc="Current planetary weather"
              onClick={() => { navigate('/chart', { state: { currentTransits: true } }); window.scrollTo(0, 0); }}
            />
            <NavCard
              icon={Sun}
              label="Solar Return"
              desc="Your year ahead"
              onClick={() => {
                if (userNatalChart) {
                  navigate('/chart', { state: { loadClient: { ...userNatalChart, autoCalculate: true }, activeTab: 'solar-return' } });
                } else {
                  navigate('/chart', { state: { activeTab: 'solar-return' } });
                }
                window.scrollTo(0, 0);
              }}
            />
            <NavCard
              icon={Moon}
              label="Lunar Return"
              desc="Your month ahead"
              onClick={() => {
                if (userNatalChart) {
                  navigate('/chart', { state: { loadClient: { ...userNatalChart, autoCalculate: true }, activeTab: 'lunar-return' } });
                } else {
                  navigate('/chart', { state: { activeTab: 'lunar-return' } });
                }
                window.scrollTo(0, 0);
              }}
            />
            <NavCard
              icon={Users}
              label="Celebrities"
              desc="Famous birth charts"
              onClick={() => { navigate('/celebrities'); window.scrollTo(0, 0); }}
            />
            <NavCard
              icon={TrendingUp}
              label="Markets"
              desc="Financial astrology & charts"
              onClick={() => { navigate('/markets'); window.scrollTo(0, 0); }}
            />
            <NavCard
              icon={MessageSquare}
              label="Community"
              desc="Feed, posts & discussions"
              onClick={() => { navigate('/community'); window.scrollTo(0, 0); }}
            />
          </div>
        </section>

        {/* ── Today's Sky — commented out for now ──
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Today's Sky</h3>
          <div className="rounded-2xl border bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 p-5 md:p-6">
            {transitLoading ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="w-36 h-10 rounded-full" />
                  <Skeleton className="w-36 h-10 rounded-full" />
                </div>
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-3/4 h-4" />
              </div>
            ) : transitData ? (
              <>
                <div className="flex flex-wrap gap-3 mb-5">
                  {transitData.sunSign && (
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                      <span className="text-2xl text-amber-400">{SIGN_GLYPHS[transitData.sunSign] || '\u2609'}</span>
                      <div>
                        <div className="text-xs text-muted-foreground leading-none">Sun</div>
                        <div className="text-sm font-semibold">{transitData.sunSign}</div>
                      </div>
                    </div>
                  )}
                  {transitData.moonSign && (
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-500/10 border border-slate-500/20">
                      <span className="text-2xl text-slate-300">{SIGN_GLYPHS[transitData.moonSign] || '\u263D'}</span>
                      <div>
                        <div className="text-xs text-muted-foreground leading-none">Moon</div>
                        <div className="text-sm font-semibold">{transitData.moonSign}</div>
                      </div>
                    </div>
                  )}
                </div>
                {transitData.aspects && transitData.aspects.length > 0 ? (
                  <div className="space-y-2.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tight Aspects</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {transitData.aspects.map((a: any, i: number) => {
                        const aspectKey = (a.aspect || '').toLowerCase().replace(/[- ]/g, '');
                        const style = ASPECT_STYLES[aspectKey] || ASPECT_STYLES[(a.aspect || '').toLowerCase()] || { color: '#6b7280', symbol: '?' };
                        return (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card/50">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: style.color }} />
                            <span className="text-lg leading-none" title={a.planet1}>{PLANET_GLYPHS[a.planet1] || a.planet1}</span>
                            <span className="text-sm" style={{ color: style.color }}>{style.symbol}</span>
                            <span className="text-lg leading-none" title={a.planet2}>{PLANET_GLYPHS[a.planet2] || a.planet2}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{a.orb?.toFixed(1)}°</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tight planetary aspects today</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Unable to load transit data</p>
            )}
          </div>
        </section>
        */}

        {/* ── Community Feed ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Community Feed</h3>
            <button
              onClick={() => { navigate('/community'); window.scrollTo(0, 0); }}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {feedLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1"><div className="h-3 w-20 bg-muted rounded" /></div>
                  </div>
                  <div className="h-3 w-full bg-muted rounded mb-1" />
                  <div className="h-3 w-2/3 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : topPosts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">No posts yet</p>
                <Button size="sm" variant="outline" onClick={() => navigate('/community')}>
                  Be the first to post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {topPosts.map((post: any) => {
                const authorName = post.author?.display_name || post.author?.first_name || 'Unknown';
                const authorPhoto = post.author?.avatar_url || post.author?.photos?.[0];
                const space = post.space as any;
                const bodyPreview = post.body?.length > 150 ? post.body.slice(0, 150) + '...' : post.body;

                return (
                  <button
                    key={post.id}
                    onClick={() => { navigate(`/community/post/${post.id}`); window.scrollTo(0, 0); }}
                    className="w-full rounded-xl border bg-card p-4 text-left hover:border-primary/20 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      {authorPhoto ? (
                        <img src={authorPhoto} alt={authorName} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{authorName[0]}</div>
                      )}
                      <span className="text-xs font-medium">{authorName}</span>
                      {space && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: (space.color || '#6366f1') + '15', color: space.color || '#6366f1' }}
                        >
                          {space.icon} {space.name}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{formatDistanceToNow(post.created_at)}</span>
                    </div>
                    {post.title && <div className="text-sm font-semibold mb-0.5">{post.title}</div>}
                    <p className="text-xs text-foreground/70 leading-relaxed">{bodyPreview}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {post.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> {post.comment_count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

      </main>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      {birthCheckDone && (
        <BirthDetailsModal
          open={showBirthModal}
          onComplete={() => { setShowBirthModal(false); fetchHoroscopes(); }}
        />
      )}
    </div>
  );
}

// ─── NavCard ──────────────────────────────────────────────────────

function NavCard({
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  icon: typeof BarChart3;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border bg-card p-4 text-left hover:shadow-md hover:border-primary/20 transition-all duration-200"
    >
      <Icon className="w-5 h-5 text-muted-foreground mb-2" />
      <div className="text-sm font-medium">{label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
    </button>
  );
}
