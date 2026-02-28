import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, User, CreditCard, FolderOpen, Radio, Settings, AlertTriangle,
  LogOut, Loader2, Download, ClipboardPaste, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase';
import { SavedChartsList } from '@/components/charts/SavedChartsList';
import { AstroComImport, type ParsedPerson } from '@/components/charts/AstroComImport';
import { SessionsList } from '@/components/session/SessionsList';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { getSavedCharts, getSavedChartsAsync, invalidateChartsCache } from '@/components/charts/SaveChartButton';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';
import { swissEphemeris } from '@/api/swissEphemeris';
import { THEME_LABELS, THEME_SWATCHES, type ThemeName } from '@/components/biwheel/utils/themes';

const SECTIONS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
  { id: 'charts', label: 'Charts', icon: FolderOpen },
  { id: 'sessions', label: 'Sessions', icon: Radio },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const {
    isPaid, isTrialing, trialDaysRemaining, status,
    aiCreditsRemaining, aiCreditsLimit,
    relocatedRemaining, relocatedLimit,
    openPortal,
  } = useSubscription();

  // Read section from URL hash (e.g. /settings#billing)
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const hash = location.hash.replace('#', '');
    const valid = SECTIONS.find(s => s.id === hash);
    return valid ? valid.id : 'account';
  });

  // Sync when hash changes (e.g. navigating from dropdown while already on /settings)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const valid = SECTIONS.find(s => s.id === hash);
    if (valid) setActiveSection(valid.id);
  }, [location.hash]);

  // Account state
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Charts state
  const [showSaved, setShowSaved] = useState(false);
  const [showAstroImport, setShowAstroImport] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Preferences state
  const [pageTheme, setPageTheme] = useState(() => localStorage.getItem('astrologer_theme') || 'classic');
  const [themeReady, setThemeReady] = useState(!user);
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/chart', { replace: true });
  }, [user, navigate]);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    supabase.from('astrologer_profiles').select('display_name').eq('id', user.id).single()
      .then(({ data }) => {
        setDisplayName(data?.display_name || '');
      });
  }, [user]);

  // Load theme from profile — DB is source of truth when logged in
  useEffect(() => {
    if (!user) { setThemeReady(true); return; }
    setThemeReady(false);
    supabase.from('astrologer_profiles').select('theme').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.theme) {
          setPageTheme(data.theme);
          localStorage.setItem('astrologer_theme', data.theme);
        }
        setThemeReady(true);
      })
      .catch(() => setThemeReady(true));
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from('astrologer_profiles').update({ display_name: displayName.trim() }).eq('id', user.id);
    setSavingProfile(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Profile updated');
  };

  const handleThemeChange = useCallback((t: string) => {
    setPageTheme(t);
    localStorage.setItem('astrologer_theme', t);
    if (user) {
      supabase.from('astrologer_profiles').update({ theme: t }).eq('id', user.id).then(() => {});
    }
  }, [user]);

  const handleExportCharts = useCallback(async () => {
    const charts = await getSavedChartsAsync(user?.id || null);
    if (charts.length === 0) { toast.error('No saved charts to export'); return; }
    const blob = new Blob([JSON.stringify(charts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'astrologer-charts.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success(`Exported ${charts.length} chart${charts.length === 1 ? '' : 's'}`);
  }, [user?.id]);

  const handleAstroImport = useCallback(async (persons: ParsedPerson[]) => {
    if (persons.length === 0) return;
    setShowAstroImport(false);

    let savedCount = 0;
    for (const person of persons) {
      if (!person.lat || !person.lng) continue;
      try {
        const data = await swissEphemeris.natal({
          birth_date: person.date,
          birth_time: person.time || '12:00',
          lat: person.lat,
          lng: person.lng,
        });
        const planets: Record<string, any> = {};
        if (data.planets && Array.isArray(data.planets)) {
          for (const p of data.planets) {
            let key = (p.name || p.planet || '').toLowerCase();
            if (key === 'north node' || key === 'true_node' || key === 'mean_node') key = 'northnode';
            if (key === 'south node') key = 'southnode';
            if (!key) continue;
            planets[key] = {
              longitude: p.longitude ?? p.abs_pos ?? 0,
              sign: p.sign || '',
              retrograde: p.retrograde ?? false,
            };
          }
        }
        if (user) {
          await supabase.from('saved_charts').insert({
            user_id: user.id, name: person.name, chart_type: 'natal',
            person_a_name: person.name, person_a_date: person.date, person_a_time: person.time,
            person_a_location: person.location, person_a_lat: person.lat, person_a_lng: person.lng,
            person_a_chart: { planets },
          });
        }
        savedCount++;
      } catch {
        // Skip charts that fail
      }
    }
    if (savedCount > 0) {
      invalidateChartsCache();
    }
    toast.success(`Saved ${savedCount} chart${savedCount !== 1 ? 's' : ''}`);
    navigate('/chart');
  }, [user, navigate]);

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const res = await supabase.functions.invoke('astrologer-delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw res.error;
      toast.success('Account deleted');
      await signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Delete account error:', err);
      toast.error('Failed to delete account. Please try again or contact support.');
      setDeletingAccount(false);
    }
  };

  if (!user) return null;

  // Billing helpers
  const planLabel = isPaid ? 'Pro' : isTrialing ? 'Trial' : 'Free';
  const planVariant = isPaid ? 'default' as const : isTrialing ? 'secondary' as const : 'outline' as const;
  const aiUsed = aiCreditsLimit - aiCreditsRemaining;
  const aiPercent = aiCreditsLimit > 0 ? (aiUsed / aiCreditsLimit) * 100 : 0;
  const relocatedUsed = relocatedLimit > 0 ? relocatedLimit - relocatedRemaining : 0;
  const relocatedPercent = relocatedLimit > 0 ? (relocatedUsed / relocatedLimit) * 100 : 0;
  const isRelocatedUnlimited = relocatedRemaining === -1 || relocatedLimit === -1;

  // Next reset date (1st of next month)
  const now = new Date();
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetLabel = nextReset.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${themeReady && isThemeDark(pageTheme) ? 'dark' : ''}`}
      style={themeReady ? themeVars : undefined}
    >
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container flex items-center gap-3 py-3 px-4 md:px-6">
          <Link to="/chart" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Chart</span>
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-sm font-medium">Settings</h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-6 max-w-4xl">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar (desktop) / Scrollable tabs (mobile) */}
          <nav className="md:w-[200px] shrink-0">
            {/* Mobile: horizontal scrollable */}
            <div className="flex md:hidden overflow-x-auto gap-1 pb-2 scrollbar-hide">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>
            {/* Desktop: vertical sidebar */}
            <div className="hidden md:flex flex-col gap-0.5">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                      isActive
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Account */}
            {activeSection === 'account' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account</CardTitle>
                  <CardDescription>Manage your profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Display Name</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        className="flex-1 h-9 px-3 rounded-md border bg-background text-sm"
                      />
                      <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile} className="h-9">
                        {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  </div>
                  <Separator />
                  <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-1.5">
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Billing & Usage */}
            {activeSection === 'billing' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Billing & Usage</CardTitle>
                  <CardDescription>Your plan and credit usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Plan</span>
                    <Badge variant={planVariant}>{planLabel}</Badge>
                    {isTrialing && trialDaysRemaining !== null && (
                      <span className="text-xs text-muted-foreground">({trialDaysRemaining} days left)</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>AI Credits</span>
                      <span className="text-muted-foreground">{aiUsed} / {aiCreditsLimit} used</span>
                    </div>
                    <Progress value={aiPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">Resets {resetLabel}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>Relocated Charts</span>
                      <span className="text-muted-foreground">
                        {isRelocatedUnlimited ? 'Unlimited' : `${relocatedUsed} / ${relocatedLimit} used`}
                      </span>
                    </div>
                    {!isRelocatedUnlimited && <Progress value={relocatedPercent} className="h-2" />}
                  </div>

                  <Separator />

                  {isPaid ? (
                    <Button variant="outline" size="sm" onClick={() => openPortal()} className="gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setShowUpgrade(true)} className="gap-1.5">
                      Upgrade to Pro
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            {activeSection === 'charts' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Charts</CardTitle>
                  <CardDescription>Manage your saved charts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setShowSaved(true)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-left hover:bg-muted/50 transition-colors"
                  >
                    <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="font-medium">Manage Charts</div>
                      <div className="text-xs text-muted-foreground">View, load, or delete your saved charts</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowAstroImport(true)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-left hover:bg-muted/50 transition-colors"
                  >
                    <ClipboardPaste className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="font-medium">Import from Astro.com</div>
                      <div className="text-xs text-muted-foreground">Paste your Astro.com chart data to import</div>
                    </div>
                  </button>
                  <button
                    onClick={handleExportCharts}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-left hover:bg-muted/50 transition-colors"
                  >
                    <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="font-medium">Export All Charts</div>
                      <div className="text-xs text-muted-foreground">Download all your charts as JSON</div>
                    </div>
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Sessions */}
            {activeSection === 'sessions' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sessions</CardTitle>
                  <CardDescription>Your recorded chart sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <SessionsList />
                </CardContent>
              </Card>
            )}

            {/* Preferences */}
            {activeSection === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Chart Theme</label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {(Object.keys(THEME_LABELS) as ThemeName[]).map(id => {
                        const swatch = THEME_SWATCHES[id];
                        const isActive = pageTheme === id;
                        return (
                          <button
                            key={id}
                            onClick={() => handleThemeChange(id)}
                            className={`relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-colors ${
                              isActive
                                ? 'border-foreground ring-1 ring-foreground'
                                : 'border-border hover:border-foreground/30'
                            }`}
                            title={THEME_LABELS[id]}
                          >
                            <div
                              className="w-8 h-8 rounded-full border border-border/50"
                              style={{ backgroundColor: swatch.bg }}
                            >
                              {isActive && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5" style={{ color: swatch.fg }} />
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                              {THEME_LABELS[id]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground">More preferences coming soon</p>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            {activeSection === 'danger' && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Permanently delete your account and all associated data including saved charts, session recordings, and preferences. This cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showDeleteConfirm ? (
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                      Delete Account
                    </Button>
                  ) : (
                    <div className="space-y-3 p-4 rounded-lg border border-destructive/30 bg-background">
                      <p className="text-sm">
                        Type <span className="font-mono font-bold text-destructive">delete</span> to confirm
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value)}
                        placeholder="delete"
                        className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                        disabled={deletingAccount}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                          disabled={deletingAccount}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteConfirmText !== 'delete' || deletingAccount}
                          onClick={handleDeleteAccount}
                        >
                          {deletingAccount ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Deleting...</>
                          ) : (
                            'Delete My Account'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SavedChartsList
        isOpen={showSaved}
        onClose={() => setShowSaved(false)}
        onLoad={(chart) => {
          setShowSaved(false);
          navigate('/chart', { state: { loadChart: chart } });
        }}
      />
      <AstroComImport isOpen={showAstroImport} onClose={() => setShowAstroImport(false)} onImport={handleAstroImport} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
