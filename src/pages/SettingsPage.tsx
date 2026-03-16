import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, User, CreditCard, Settings, AlertTriangle,
  LogOut, Loader2, Check, Trash2, Pencil, RotateCcw, Users, Bell, Star, Search, MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateInput } from '@/components/ui/DateInput';
import { TimeInput } from '@/components/ui/TimeInput';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';
import { swissEphemeris } from '@/api/swissEphemeris';
import { invalidateChartsCache } from '@/components/charts/SaveChartButton';

import { THEME_LABELS, THEME_SWATCHES, type ThemeName } from '@/components/biwheel/utils/themes';
import { loadPresets, loadPresetsFromProfile, savePresetsToProfile, deletePreset as deleteLocalPreset, renamePreset as renameLocalPreset, type ChartPreset } from '@/components/biwheel/utils/presets';
import { ClientsList } from '@/components/clients/ClientsList';
import { isPushSupported, isSubscribedToPush, subscribeToPush, unsubscribeFromPush } from '@/lib/pushNotifications';

function PushNotificationToggle({ userId }: { userId?: string }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sup = await isPushSupported();
      setSupported(sup);
      if (sup) {
        const sub = await isSubscribedToPush();
        setSubscribed(sub);
      }
      setLoading(false);
    })();
  }, []);

  if (!supported) {
    return <p className="text-xs text-muted-foreground">Push notifications are not supported in this browser.</p>;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">Browser Notifications</div>
        <div className="text-xs text-muted-foreground">Receive instant notifications in your browser</div>
      </div>
      <Switch
        checked={subscribed}
        disabled={loading || !userId}
        onCheckedChange={async (checked) => {
          if (!userId) return;
          setLoading(true);
          if (checked) {
            const ok = await subscribeToPush(userId);
            setSubscribed(ok);
            if (!ok) toast.error('Failed to enable push notifications');
          } else {
            await unsubscribeFromPush(userId);
            setSubscribed(false);
          }
          setLoading(false);
        }}
      />
    </div>
  );
}

const SECTIONS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'birth', label: 'Birth Details', icon: Star },
  { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const {
    isPaid, isTrialing, trialDaysRemaining, status, tier,
    aiCreditsRemaining, aiCreditsLimit,
    relocatedRemaining, relocatedLimit,
    sessionsRemaining, sessionsLimit, sessionsUsed,
    transcriptionsRemaining, transcriptionsLimit, transcriptionsUsed,
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
  const [editingAccount, setEditingAccount] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  // Community profile fields
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linktreeUrl, setLinktreeUrl] = useState('');
  const [savingSocials, setSavingSocials] = useState(false);

  const [showUpgrade, setShowUpgrade] = useState(false);

  // Birth details state
  const [birthChart, setBirthChart] = useState<any>(null);
  const [birthChartLoading, setBirthChartLoading] = useState(true);
  const [editingBirth, setEditingBirth] = useState(false);
  const [birthName, setBirthName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [birthLocation, setBirthLocation] = useState('');
  const [birthLat, setBirthLat] = useState<number | null>(null);
  const [birthLng, setBirthLng] = useState<number | null>(null);
  const [birthGeoResults, setBirthGeoResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [birthSearching, setBirthSearching] = useState(false);
  const [birthLocFocused, setBirthLocFocused] = useState(false);
  const [birthLocSelectedIdx, setBirthLocSelectedIdx] = useState(-1);
  const birthLocDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const birthLocAbortRef = useRef<AbortController | null>(null);
  const [birthSaving, setBirthSaving] = useState(false);

  // Notifications state
  const [emailUnsubscribed, setEmailUnsubscribed] = useState(false);
  const [loadingEmailPref, setLoadingEmailPref] = useState(false);
  const [notifyPostLikes, setNotifyPostLikes] = useState(true);
  const [notifyPostComments, setNotifyPostComments] = useState(true);
  const [notifyCommentLikes, setNotifyCommentLikes] = useState(true);
  const [notifyCommentReplies, setNotifyCommentReplies] = useState(true);
  const [notifyNewFollowers, setNotifyNewFollowers] = useState(true);
  const [notifyEmailCommunity, setNotifyEmailCommunity] = useState(true);
  const [savingNotifPref, setSavingNotifPref] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Community content filters
  const [hiddenSpaces, setHiddenSpaces] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('community_hidden_spaces') || '[]'); } catch { return []; }
  });
  const [allSpaces, setAllSpaces] = useState<{ id: string; name: string; slug: string; icon: string }[]>([]);
  const [spacesLoaded, setSpacesLoaded] = useState(false);

  // Word filters
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [blockedWordsLoaded, setBlockedWordsLoaded] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [savingWords, setSavingWords] = useState(false);

  // Preferences state
  const [pageTheme, setPageTheme] = useState(() => localStorage.getItem('astrologer_theme') || 'classic');
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);

  // Chart defaults
  const [chartDefaults, setChartDefaults] = useState<{
    straightAspects: boolean;
    showEffects: boolean;
    showDegreeMarkers: boolean;
    showRetrogrades: boolean;
    showDecans: boolean;
    rotateToAscendant: boolean;
    showHouses: boolean;
    degreeSymbolMode: 'sign' | 'degree';
    aspectLineStyle: 'modern' | 'classic' | 'clean';
  }>(() => {
    try {
      const raw = localStorage.getItem('biwheel-chart-defaults');
      if (raw) {
        const d = JSON.parse(raw);
        return {
          straightAspects: d.straightAspects ?? false,
          showEffects: d.showEffects ?? false,
          showDegreeMarkers: d.showDegreeMarkers ?? true,
          showRetrogrades: d.showRetrogrades ?? true,
          showDecans: d.showDecans ?? false,
          rotateToAscendant: d.rotateToAscendant ?? true,
          showHouses: d.showHouses ?? true,
          degreeSymbolMode: d.degreeSymbolMode ?? 'sign',
          aspectLineStyle: d.aspectLineStyle ?? 'modern',
        };
      }
    } catch {}
    return { straightAspects: false, showEffects: false, showDegreeMarkers: true, showRetrogrades: true, showDecans: false, rotateToAscendant: true, showHouses: true, degreeSymbolMode: 'sign' as const, aspectLineStyle: 'modern' as const };
  });

  const updateChartDefault = useCallback((key: string, value: boolean | string) => {
    setChartDefaults(prev => {
      const next = { ...prev, [key]: value };
      // Merge into the full saved defaults (preserving planets/aspects)
      try {
        const raw = localStorage.getItem('biwheel-chart-defaults');
        const existing = raw ? JSON.parse(raw) : {};
        localStorage.setItem('biwheel-chart-defaults', JSON.stringify({ ...existing, [key]: value }));
      } catch {
        localStorage.setItem('biwheel-chart-defaults', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  // Presets
  const [presets, setPresets] = useState<ChartPreset[]>([]);
  const [presetsLoaded, setPresetsLoaded] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editPresetName, setEditPresetName] = useState('');

  useEffect(() => {
    if (user) {
      loadPresetsFromProfile(user.id).then(p => { setPresets(p); setPresetsLoaded(true); });
    } else {
      setPresets(loadPresets());
      setPresetsLoaded(true);
    }
  }, [user]);

  const handleDeletePreset = useCallback(async (id: string) => {
    if (!confirm('Delete this preset?')) return;
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    deleteLocalPreset(id);
    if (user) await savePresetsToProfile(user.id, updated);
    toast.success('Preset deleted');
  }, [presets, user]);

  const handleRenamePreset = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) { setEditingPresetId(null); return; }
    const updated = presets.map(p => p.id === id ? { ...p, name: trimmed } : p);
    setPresets(updated);
    renameLocalPreset(id, trimmed);
    if (user) await savePresetsToProfile(user.id, updated);
    setEditingPresetId(null);
    toast.success('Preset renamed');
  }, [presets, user]);

  const handleResetDefaults = useCallback(() => {
    if (!confirm('Reset all chart display defaults to factory settings?')) return;
    localStorage.removeItem('biwheel-chart-defaults');
    setChartDefaults({
      straightAspects: false, showEffects: false, showDegreeMarkers: true,
      showRetrogrades: true, showDecans: false, rotateToAscendant: true, showHouses: true,
      degreeSymbolMode: 'sign' as const,
    });
    toast.success('Chart defaults reset');
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/chart', { replace: true });
  }, [user, navigate]);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    supabase.from('astrologer_profiles').select('display_name, email_unsubscribed, notify_post_likes, notify_post_comments, notify_comment_likes, notify_comment_replies, notify_new_followers, notify_email_community').eq('id', user.id).single()
      .then(({ data }) => {
        setDisplayName(data?.display_name || '');
        setEmailUnsubscribed(data?.email_unsubscribed ?? false);
        setNotifyPostLikes(data?.notify_post_likes ?? true);
        setNotifyPostComments(data?.notify_post_comments ?? true);
        setNotifyCommentLikes(data?.notify_comment_likes ?? true);
        setNotifyCommentReplies(data?.notify_comment_replies ?? true);
        setNotifyNewFollowers(data?.notify_new_followers ?? true);
        setNotifyEmailCommunity(data?.notify_email_community ?? true);
      });
    // Load community profile (socials)
    supabase.from('profiles').select('avatar_url, bio, website_url, linktree_url, twitter_handle, instagram_handle, tiktok_handle, youtube_url').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setAvatarUrl(data.avatar_url || '');
        setBio(data.bio || '');
        setWebsiteUrl(data.website_url || '');
        setLinktreeUrl(data.linktree_url || '');
        setTwitterHandle(data.twitter_handle || '');
        setInstagramHandle(data.instagram_handle || '');
        setTiktokHandle(data.tiktok_handle || '');
        setYoutubeUrl(data.youtube_url || '');
      });
  }, [user]);

  // Load birth chart (first natal chart)
  useEffect(() => {
    if (!user) { setBirthChartLoading(false); return; }
    setBirthChartLoading(true);
    supabase
      .from('saved_charts')
      .select('*')
      .eq('user_id', user.id)
      .eq('chart_type', 'natal')
      .order('created_at', { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const chart = data[0];
          setBirthChart(chart);
          setBirthName(chart.person_a_name || '');
          setBirthDate(chart.person_a_date || '');
          setBirthTime(chart.person_a_time || '12:00');
          setBirthLocation(chart.person_a_location || '');
          setBirthLat(chart.person_a_lat);
          setBirthLng(chart.person_a_lng);
        }
        setBirthChartLoading(false);
      })
      .catch(() => setBirthChartLoading(false));
  }, [user]);

  // Sync dark class to <html>
  useEffect(() => {
    const dark = isThemeDark(pageTheme);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [pageTheme]);

  // Load theme from profile — DB is source of truth when logged in
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

  // Load community spaces for content filter
  useEffect(() => {
    if (activeSection !== 'preferences' || spacesLoaded) return;
    supabase.from('community_spaces').select('id, name, slug, icon').order('sort_order').then(({ data }) => {
      if (data) setAllSpaces(data);
      setSpacesLoaded(true);
    });
  }, [activeSection, spacesLoaded]);

  // Load blocked words
  useEffect(() => {
    if (activeSection !== 'preferences' || blockedWordsLoaded || !user) return;
    supabase.from('astrologer_profiles').select('blocked_words').eq('id', user.id).single().then(({ data }) => {
      setBlockedWords(data?.blocked_words || []);
      setBlockedWordsLoaded(true);
    });
  }, [activeSection, blockedWordsLoaded, user]);

  const toggleHiddenSpace = useCallback((slug: string) => {
    setHiddenSpaces(prev => {
      const next = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug];
      localStorage.setItem('community_hidden_spaces', JSON.stringify(next));
      return next;
    });
  }, []);

  const addBlockedWord = useCallback(async () => {
    const word = newWord.trim().toLowerCase();
    if (!word || !user || blockedWords.includes(word)) { setNewWord(''); return; }
    const next = [...blockedWords, word];
    setSavingWords(true);
    const { error } = await supabase.from('astrologer_profiles').update({ blocked_words: next }).eq('id', user.id);
    if (error) { toast.error('Failed to save'); } else { setBlockedWords(next); }
    setNewWord('');
    setSavingWords(false);
  }, [newWord, user, blockedWords]);

  const removeBlockedWord = useCallback(async (word: string) => {
    if (!user) return;
    const next = blockedWords.filter(w => w !== word);
    const { error } = await supabase.from('astrologer_profiles').update({ blocked_words: next }).eq('id', user.id);
    if (error) { toast.error('Failed to save'); } else { setBlockedWords(next); }
  }, [user, blockedWords]);

  const searchBirthLocation = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setBirthGeoResults([]); return; }
    birthLocAbortRef.current?.abort();
    const controller = new AbortController();
    birthLocAbortRef.current = controller;
    setBirthSearching(true);
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&autocomplete=true&limit=5&types=place,locality,region,country`,
        { signal: controller.signal },
      );
      const json = await res.json();
      if (!controller.signal.aborted) {
        const mapped = (json.features || []).map((f: any) => ({
          display_name: f.place_name,
          lat: String(f.center[1]),
          lon: String(f.center[0]),
        }));
        setBirthGeoResults(mapped);
        setBirthLocSelectedIdx(-1);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') toast.error('Location search failed');
    } finally {
      if (!controller.signal.aborted) setBirthSearching(false);
    }
  }, []);

  const debouncedBirthLocationSearch = useCallback((query: string) => {
    if (birthLocDebounceRef.current) clearTimeout(birthLocDebounceRef.current);
    birthLocDebounceRef.current = setTimeout(() => searchBirthLocation(query), 300);
  }, [searchBirthLocation]);

  const selectBirthGeoResult = useCallback((r: { display_name: string; lat: string; lon: string }) => {
    setBirthLocation(r.display_name);
    setBirthLat(parseFloat(r.lat));
    setBirthLng(parseFloat(r.lon));
    setBirthGeoResults([]);
    setBirthLocSelectedIdx(-1);
  }, []);

  const handleSaveBirthDetails = useCallback(async () => {
    if (!user || !birthName.trim() || !birthDate || !birthLat || !birthLng) return;
    setBirthSaving(true);
    try {
      const chartData = await swissEphemeris.natal({
        birth_date: birthDate,
        birth_time: birthTime,
        lat: birthLat,
        lng: birthLng,
      });

      const updatePayload = {
        person_a_name: birthName.trim(),
        person_a_date: birthDate,
        person_a_time: birthTime,
        person_a_location: birthLocation,
        person_a_lat: birthLat,
        person_a_lng: birthLng,
        person_a_chart: chartData,
        name: `${birthName.trim()}'s Chart`,
      };

      if (birthChart?.id) {
        const { error } = await supabase.from('saved_charts').update(updatePayload).eq('id', birthChart.id);
        if (error) throw error;
        setBirthChart({ ...birthChart, ...updatePayload });
      } else {
        const { data, error } = await supabase.from('saved_charts').insert({
          user_id: user.id,
          chart_type: 'natal',
          ...updatePayload,
        }).select().single();
        if (error) throw error;
        setBirthChart(data);
      }

      invalidateChartsCache();
      setEditingBirth(false);
      toast.success('Birth details updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update birth details');
    } finally {
      setBirthSaving(false);
    }
  }, [user, birthChart, birthName, birthDate, birthTime, birthLocation, birthLat, birthLng]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from('astrologer_profiles').update({ display_name: displayName.trim() }).eq('id', user.id);
    setSavingProfile(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Profile updated');
  };

  const handleSaveSocials = async () => {
    if (!user) return;
    setSavingSocials(true);
    const payload = {
      id: user.id,
      bio: bio.trim() || null,
      website_url: websiteUrl.trim() || null,
      linktree_url: linktreeUrl.trim() || null,
      twitter_handle: twitterHandle.trim() || null,
      instagram_handle: instagramHandle.trim() || null,
      tiktok_handle: tiktokHandle.trim() || null,
      youtube_url: youtubeUrl.trim() || null,
    };
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    setSavingSocials(false);
    if (error) { toast.error('Failed to save socials'); return; }
    toast.success('Profile updated');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('community-media').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('community-media').getPublicUrl(path);
      const url = publicUrl + '?t=' + Date.now();
      const { error: dbErr } = await supabase.from('profiles').upsert({ id: user.id, avatar_url: url }, { onConflict: 'id' });
      if (dbErr) throw dbErr;
      setAvatarUrl(url);
      toast.success('Profile picture updated');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleThemeChange = useCallback((t: string) => {
    setPageTheme(t);
    localStorage.setItem('astrologer_theme', t);
    if (user) {
      supabase.from('astrologer_profiles').update({ theme: t }).eq('id', user.id).then(() => {});
    }
  }, [user]);

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
  const tierLabels: Record<string, string> = { lite: 'Lite', horoscope: 'Horoscope', astrologer: 'Astrologer', professional: 'Professional' };
  const planLabel = tierLabels[tier] || (isTrialing ? 'Trial' : 'Free');
  const planVariant = tier !== 'lite' ? 'default' as const : isTrialing ? 'secondary' as const : 'outline' as const;
  const aiUsed = aiCreditsLimit - aiCreditsRemaining;
  const aiPercent = aiCreditsLimit > 0 ? (aiUsed / aiCreditsLimit) * 100 : 0;
  const relocatedUsed = relocatedLimit > 0 ? relocatedLimit - relocatedRemaining : 0;
  const relocatedPercent = relocatedLimit > 0 ? (relocatedUsed / relocatedLimit) * 100 : 0;
  const isRelocatedUnlimited = relocatedRemaining === -1 || relocatedLimit === -1;
  const sessionsPercent = sessionsLimit > 0 ? (sessionsUsed / sessionsLimit) * 100 : 0;
  const transcriptionsPercent = transcriptionsLimit > 0 ? (transcriptionsUsed / transcriptionsLimit) * 100 : 0;

  // Next reset date (1st of next month)
  const now = new Date();
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetLabel = nextReset.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      className={`min-h-screen ${isThemeDark(pageTheme) ? 'dark' : ''}`}
      style={themeVars}
    >
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container flex items-center gap-3 py-3 px-4 md:px-6">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Account</CardTitle>
                      <CardDescription>{editingAccount ? 'Edit your profile' : 'This is how others see your profile'}</CardDescription>
                    </div>
                    {!editingAccount && (
                      <Button size="sm" variant="outline" onClick={() => setEditingAccount(true)} className="gap-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingAccount ? (
                    <>
                      {/* Profile Picture */}
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                            {uploadingAvatar ? (
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            ) : (
                              <Pencil className="w-4 h-4 text-white" />
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                          </label>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Profile Picture</p>
                          <p className="text-xs text-muted-foreground">Click to upload (max 5MB)</p>
                        </div>
                      </div>

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
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                      </div>
                      <Separator />

                      {/* Bio & Socials */}
                      <div>
                        <label className="text-sm font-medium">Bio</label>
                        <textarea
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          placeholder="A short bio about yourself"
                          rows={3}
                          maxLength={300}
                          className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                        />
                        <p className="text-[10px] text-muted-foreground text-right">{bio.length}/300</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Website</label>
                          <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Linktree</label>
                          <input type="url" value={linktreeUrl} onChange={e => setLinktreeUrl(e.target.value)} placeholder="https://linktr.ee/you" className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">X / Twitter</label>
                          <input type="text" value={twitterHandle} onChange={e => setTwitterHandle(e.target.value)} placeholder="@handle" className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Instagram</label>
                          <input type="text" value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} placeholder="@handle" className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">TikTok</label>
                          <input type="text" value={tiktokHandle} onChange={e => setTiktokHandle(e.target.value)} placeholder="@handle" className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">YouTube</label>
                          <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/@channel" className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={async () => {
                          await handleSaveProfile();
                          await handleSaveSocials();
                          setEditingAccount(false);
                        }} disabled={savingProfile || savingSocials}>
                          {(savingProfile || savingSocials) ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingAccount(false)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    /* ── Profile Preview (read-only) ── */
                    <>
                      <div className="flex items-start gap-4">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                            {displayName ? (
                              <span className="text-2xl font-medium">{displayName[0].toUpperCase()}</span>
                            ) : (
                              <User className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold">{displayName || 'No name set'}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {bio && <p className="text-sm text-foreground/80 mt-2">{bio}</p>}
                        </div>
                      </div>

                      {/* Social links */}
                      {(() => {
                        const links = [
                          websiteUrl && { label: 'Website', url: websiteUrl },
                          linktreeUrl && { label: 'Linktree', url: linktreeUrl },
                          twitterHandle && { label: 'X', url: twitterHandle.startsWith('http') ? twitterHandle : `https://x.com/${twitterHandle.replace('@', '')}` },
                          instagramHandle && { label: 'Instagram', url: instagramHandle.startsWith('http') ? instagramHandle : `https://instagram.com/${instagramHandle.replace('@', '')}` },
                          tiktokHandle && { label: 'TikTok', url: tiktokHandle.startsWith('http') ? tiktokHandle : `https://tiktok.com/@${tiktokHandle.replace('@', '')}` },
                          youtubeUrl && { label: 'YouTube', url: youtubeUrl },
                        ].filter(Boolean) as { label: string; url: string }[];
                        if (links.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {links.map(link => (
                              <a
                                key={link.label}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        );
                      })()}

                      {!displayName && !bio && !websiteUrl && !twitterHandle && !instagramHandle && !tiktokHandle && !youtubeUrl && !linktreeUrl && !avatarUrl && (
                        <p className="text-sm text-muted-foreground py-2">Your profile is empty. Tap Edit to add your details.</p>
                      )}

                      <Separator />

                      <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-1.5">
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Birth Details */}
            {activeSection === 'birth' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Birth Details</CardTitle>
                  <CardDescription>Your birth data used for horoscopes and chart readings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {birthChartLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : !birthChart && !editingBirth ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">No birth chart saved yet</p>
                      <Button size="sm" onClick={() => setEditingBirth(true)}>Add Birth Details</Button>
                    </div>
                  ) : editingBirth ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <input
                          type="text"
                          value={birthName}
                          onChange={e => setBirthName(e.target.value)}
                          placeholder="Your name"
                          className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Birth Date</label>
                        <div className="mt-1">
                          <DateInput value={birthDate} onChange={setBirthDate} />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Birth Time</label>
                        <p className="text-xs text-muted-foreground mb-1">If unknown, leave as 12:00 (noon)</p>
                        <TimeInput value={birthTime} onChange={setBirthTime} />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Birth Location</label>
                        <div className="relative mt-1">
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={birthLocation}
                              onChange={e => {
                                const val = e.target.value;
                                setBirthLocation(val);
                                setBirthLat(null);
                                setBirthLng(null);
                                debouncedBirthLocationSearch(val);
                              }}
                              onKeyDown={e => {
                                if (birthGeoResults.length > 0) {
                                  if (e.key === 'ArrowDown') { e.preventDefault(); setBirthLocSelectedIdx(i => Math.min(i + 1, birthGeoResults.length - 1)); }
                                  else if (e.key === 'ArrowUp') { e.preventDefault(); setBirthLocSelectedIdx(i => Math.max(i - 1, -1)); }
                                  else if (e.key === 'Enter' && birthLocSelectedIdx >= 0) { e.preventDefault(); selectBirthGeoResult(birthGeoResults[birthLocSelectedIdx]); }
                                  else if (e.key === 'Escape') { setBirthGeoResults([]); setBirthLocSelectedIdx(-1); }
                                } else if (e.key === 'Enter' && birthLocation.length >= 2) {
                                  searchBirthLocation(birthLocation);
                                }
                              }}
                              onFocus={() => setBirthLocFocused(true)}
                              onBlur={() => setTimeout(() => setBirthLocFocused(false), 200)}
                              placeholder="City, Country"
                              className="w-full h-9 px-3 pr-8 rounded-md border bg-background text-sm"
                              autoComplete="off"
                            />
                            {birthSearching ? (
                              <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
                            ) : birthLat !== null ? (
                              <MapPin className="absolute right-2.5 top-2.5 w-4 h-4 text-emerald-500" />
                            ) : null}
                          </div>
                          {birthLocFocused && birthGeoResults.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 border rounded-md bg-popover shadow-xl max-h-48 overflow-y-auto">
                              {birthGeoResults.map((r, i) => (
                                <button
                                  key={i}
                                  onMouseDown={e => e.preventDefault()}
                                  onMouseEnter={() => setBirthLocSelectedIdx(i)}
                                  onClick={() => selectBirthGeoResult(r)}
                                  className={`w-full text-left px-3 py-2.5 text-xs border-b last:border-b-0 transition-colors ${
                                    i === birthLocSelectedIdx ? 'bg-accent' : 'hover:bg-muted'
                                  }`}
                                >
                                  {r.display_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={handleSaveBirthDetails}
                          disabled={birthSaving || !birthName.trim() || !birthDate || !birthLat}
                        >
                          {birthSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Saving...</> : 'Save'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingBirth(false);
                          if (birthChart) {
                            setBirthName(birthChart.person_a_name || '');
                            setBirthDate(birthChart.person_a_date || '');
                            setBirthTime(birthChart.person_a_time || '12:00');
                            setBirthLocation(birthChart.person_a_location || '');
                            setBirthLat(birthChart.person_a_lat);
                            setBirthLng(birthChart.person_a_lng);
                          }
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Name</label>
                          <p className="text-sm font-medium">{birthChart.person_a_name}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Date</label>
                          <p className="text-sm font-medium">{birthChart.person_a_date}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Time</label>
                          <p className="text-sm font-medium">{birthChart.person_a_time || '12:00'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Location</label>
                          <p className="text-sm font-medium truncate" title={birthChart.person_a_location}>{birthChart.person_a_location}</p>
                        </div>
                      </div>
                      <Separator />
                      <Button size="sm" variant="outline" onClick={() => setEditingBirth(true)} className="gap-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Birth Details
                      </Button>
                    </div>
                  )}
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

                  {sessionsLimit > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>Sessions</span>
                        <span className="text-muted-foreground">{sessionsUsed} / {sessionsLimit} used</span>
                      </div>
                      <Progress value={sessionsPercent} className="h-2" />
                    </div>
                  )}

                  {transcriptionsLimit > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>Transcriptions</span>
                        <span className="text-muted-foreground">{transcriptionsUsed} / {transcriptionsLimit} used</span>
                      </div>
                      <Progress value={transcriptionsPercent} className="h-2" />
                    </div>
                  )}

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
                      Upgrade
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Clients */}
            {activeSection === 'clients' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Clients</CardTitle>
                  <CardDescription>Manage your client directory — save birth data for quick access</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientsList />
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Email Notifications</CardTitle>
                    <CardDescription>Control which emails you receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium">Daily Horoscope</div>
                        <div className="text-xs text-muted-foreground">Receive a personalized energy reading every morning at 7 AM</div>
                      </div>
                      <Switch
                        checked={!emailUnsubscribed}
                        disabled={loadingEmailPref}
                        onCheckedChange={async (checked) => {
                          if (!user) return;
                          setLoadingEmailPref(true);
                          const unsubscribed = !checked;
                          const { error } = await supabase
                            .from('astrologer_profiles')
                            .update({ email_unsubscribed: unsubscribed })
                            .eq('id', user.id);
                          setLoadingEmailPref(false);
                          if (error) {
                            toast.error('Failed to update preference');
                            return;
                          }
                          setEmailUnsubscribed(unsubscribed);
                          toast.success(checked ? 'Daily horoscope emails enabled' : 'Daily horoscope emails disabled');
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium">Community Activity</div>
                        <div className="text-xs text-muted-foreground">Email summaries when people interact with your posts</div>
                      </div>
                      <Switch
                        checked={notifyEmailCommunity}
                        disabled={savingNotifPref}
                        onCheckedChange={async (checked) => {
                          if (!user) return;
                          setSavingNotifPref(true);
                          const { error } = await supabase.from('astrologer_profiles').update({ notify_email_community: checked }).eq('id', user.id);
                          setSavingNotifPref(false);
                          if (error) { toast.error('Failed to update'); return; }
                          setNotifyEmailCommunity(checked);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Community Notifications</CardTitle>
                    <CardDescription>Choose what you get notified about in the community</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {([
                      { key: 'postLikes', label: 'Post Likes', desc: 'When someone likes your post', value: notifyPostLikes, setter: setNotifyPostLikes, col: 'notify_post_likes' },
                      { key: 'postComments', label: 'Comments', desc: 'When someone comments on your post', value: notifyPostComments, setter: setNotifyPostComments, col: 'notify_post_comments' },
                      { key: 'commentLikes', label: 'Comment Likes', desc: 'When someone likes your comment', value: notifyCommentLikes, setter: setNotifyCommentLikes, col: 'notify_comment_likes' },
                      { key: 'commentReplies', label: 'Replies', desc: 'When someone replies to your comment', value: notifyCommentReplies, setter: setNotifyCommentReplies, col: 'notify_comment_replies' },
                      { key: 'newFollowers', label: 'New Followers', desc: 'When someone follows you', value: notifyNewFollowers, setter: setNotifyNewFollowers, col: 'notify_new_followers' },
                    ] as const).map(({ key, label, desc, value, setter, col }) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-xs text-muted-foreground">{desc}</div>
                        </div>
                        <Switch
                          checked={value}
                          disabled={savingNotifPref}
                          onCheckedChange={async (checked) => {
                            if (!user) return;
                            setSavingNotifPref(true);
                            const { error } = await supabase.from('astrologer_profiles').update({ [col]: checked }).eq('id', user.id);
                            setSavingNotifPref(false);
                            if (error) { toast.error('Failed to update'); return; }
                            setter(checked);
                          }}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Push Notifications</CardTitle>
                    <CardDescription>Get browser notifications for community activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PushNotificationToggle userId={user?.id} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Preferences */}
            {activeSection === 'preferences' && (
              <div className="space-y-4">
                {/* Theme */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Chart Theme</CardTitle>
                    <CardDescription>Color scheme for all charts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-2">
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
                  </CardContent>
                </Card>

                {/* Chart Display Defaults */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Chart Display Defaults</CardTitle>
                    <CardDescription>Default options for new charts. You can still override these per chart.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {([
                      { key: 'showHouses', label: 'Houses', desc: 'Show house division rings' },
                      { key: 'showDegreeMarkers', label: 'Degree markers', desc: 'Show degree ticks around the zodiac wheel' },
                      { key: 'showRetrogrades', label: 'Retrograde symbols', desc: 'Show ℞ indicator on retrograde planets' },
                      { key: 'showDecans', label: 'Decans', desc: 'Show decan subdivisions in the zodiac ring' },
                      { key: 'straightAspects', label: 'Straight aspect lines', desc: 'Use straight lines instead of curved arcs for aspects' },
                      { key: 'showEffects', label: 'Flow effects', desc: 'Animated glow effects on transit planets (desktop only)' },
                      { key: 'rotateToAscendant', label: 'ASC at west', desc: 'Rotate chart so the Ascendant is at the 9 o\'clock position' },
                    ] as { key: keyof typeof chartDefaults; label: string; desc: string }[]).map(opt => (
                      <label key={opt.key} className="flex items-start gap-3 py-2.5 cursor-pointer select-none hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors">
                        <input
                          type="checkbox"
                          checked={chartDefaults[opt.key]}
                          onChange={(e) => updateChartDefault(opt.key, e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-border accent-primary cursor-pointer shrink-0"
                        />
                        <div>
                          <div className="text-sm font-medium">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                    {/* Degree symbol mode */}
                    <div className="flex items-start gap-3 py-2.5 px-2 -mx-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Sign glyphs</div>
                        <div className="text-xs text-muted-foreground">Symbol shown next to planet degrees on the chart</div>
                      </div>
                      <select
                        value={chartDefaults.degreeSymbolMode}
                        onChange={(e) => updateChartDefault('degreeSymbolMode', e.target.value)}
                        className="h-8 px-2 rounded-md border border-border bg-background text-sm cursor-pointer"
                      >
                        <option value="sign">Zodiac sign</option>
                        <option value="degree">Sign degree</option>
                      </select>
                    </div>
                    {/* Aspect line style */}
                    <div className="flex items-start gap-3 py-2.5 px-2 -mx-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Aspect line style</div>
                        <div className="text-xs text-muted-foreground">Visual style for aspect lines drawn between planets</div>
                      </div>
                      <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                        {(['modern', 'classic', 'clean'] as const).map(style => (
                          <button
                            key={style}
                            onClick={() => updateChartDefault('aspectLineStyle', style)}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize ${
                              chartDefaults.aspectLineStyle === style
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleResetDefaults}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset to factory defaults
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Saved Presets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Saved Presets</CardTitle>
                    <CardDescription>
                      Presets save your full chart configuration — visible planets, aspects, theme, display options — for quick switching. Create them from the chart's settings panel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!presetsLoaded ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : presets.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No presets yet. Save one from the chart's settings panel.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {presets.map(preset => (
                          <div
                            key={preset.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              {editingPresetId === preset.id ? (
                                <input
                                  value={editPresetName}
                                  onChange={(e) => setEditPresetName(e.target.value)}
                                  onBlur={() => handleRenamePreset(preset.id, editPresetName)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenamePreset(preset.id, editPresetName);
                                    if (e.key === 'Escape') setEditingPresetId(null);
                                  }}
                                  className="text-sm font-medium bg-transparent border-b border-primary outline-none w-full"
                                  autoFocus
                                />
                              ) : (
                                <div className="text-sm font-medium truncate">{preset.name}</div>
                              )}
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                                <span>{preset.visiblePlanets.length} planets</span>
                                <span className="opacity-40">&middot;</span>
                                <span>{preset.visibleAspects.length} aspects</span>
                                <span className="opacity-40">&middot;</span>
                                <span>{THEME_LABELS[preset.chartTheme as ThemeName] || preset.chartTheme}</span>
                                {preset.straightAspects && <><span className="opacity-40">&middot;</span><span>straight lines</span></>}
                                {preset.showEffects && <><span className="opacity-40">&middot;</span><span>effects</span></>}
                                {preset.showDecans && <><span className="opacity-40">&middot;</span><span>decans</span></>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => { setEditingPresetId(preset.id); setEditPresetName(preset.name); }}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                title="Rename"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePreset(preset.id)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground pt-1">
                          {presets.length}/10 presets used
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Community Content Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Community Content Filter</CardTitle>
                    <CardDescription>Hide topics you don't want to see in the community feed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!spacesLoaded ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : allSpaces.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No community spaces available</p>
                    ) : (
                      <div className="space-y-1">
                        {allSpaces.map(space => (
                          <label key={space.slug} className="flex items-center justify-between py-2 px-2 -mx-2 rounded-md hover:bg-muted/30 cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
                              <span>{space.icon || '💬'}</span>
                              <span className="text-sm">{space.name}</span>
                            </div>
                            <Switch
                              checked={!hiddenSpaces.includes(space.slug)}
                              onCheckedChange={() => toggleHiddenSpace(space.slug)}
                            />
                          </label>
                        ))}
                        <p className="text-[10px] text-muted-foreground pt-2">
                          {hiddenSpaces.length > 0 ? `Hiding ${hiddenSpaces.length} topic${hiddenSpaces.length > 1 ? 's' : ''}` : 'Showing all topics'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Word Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Word Filters</CardTitle>
                    <CardDescription>Posts containing these words will be hidden from your feed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-3">
                      <input
                        value={newWord}
                        onChange={e => setNewWord(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addBlockedWord(); }}
                        placeholder="Add a word or phrase..."
                        className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 border-none outline-none placeholder:text-muted-foreground"
                        disabled={savingWords}
                      />
                      <Button size="sm" onClick={addBlockedWord} disabled={!newWord.trim() || savingWords}>Add</Button>
                    </div>
                    {blockedWords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {blockedWords.map(word => (
                          <span key={word} className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-3 py-1.5">
                            {word}
                            <button onClick={() => removeBlockedWord(word)} className="ml-0.5 hover:text-destructive transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">No words filtered</p>
                    )}
                  </CardContent>
                </Card>
              </div>
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

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
