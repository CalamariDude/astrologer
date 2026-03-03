import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// ── Types ──

interface Stats {
  total_users: number;
  active: number;
  trialing: number;
  free: number;
  signups_30d: number;
  signups_7d: number;
  monthly: number;
  annual: number;
  total_charts: number;
  total_ai_used: number;
  total_relocated_used: number;
  // Session stats
  total_sessions: number;
  sessions_7d: number;
  sessions_30d: number;
  sessions_live: number;
  sessions_ready: number;
  sessions_failed: number;
  sessions_with_guests: number;
  sessions_with_transcripts: number;
  total_recording_hours: number;
}

interface FeatureRow {
  event: string;
  count: number;
  unique_users?: number;
  last_used?: string;
}

interface DailyActiveRow {
  day: string;
  users: number;
}

interface UserSessionRow {
  day: string;
  events: number;
  session_seconds: number;
}

interface AstrologerUser {
  id: string;
  email: string;
  display_name: string | null;
  subscription_status: string;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  subscription_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  ai_credits_used: number;
  ai_credits_reset_at: string | null;
  relocated_used: number;
  relocated_reset_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  saved_charts_count: number;
  theme: string | null;
}

interface AdminSession {
  id: string;
  host_id: string;
  title: string;
  status: string;
  share_token: string;
  started_at: string | null;
  ended_at: string | null;
  total_duration_ms: number;
  guest_display_name: string | null;
  guest_email: string | null;
  created_at: string;
  host_email: string;
  host_name: string;
  chart_person_a: string;
  chart_person_b: string;
  audio_status: string;
  audio_duration_ms: number | null;
  has_transcript: boolean;
  has_summary: boolean;
}

interface AdminChart {
  id: string;
  user_id: string;
  name: string;
  chart_type: 'natal' | 'synastry';
  person_a_name: string;
  person_a_date: string;
  person_b_name: string | null;
  person_b_date: string | null;
  created_at: string;
  owner_email: string;
  owner_name: string;
}

interface PromoCode {
  id: string;
  code: string;
  active: boolean;
  coupon: {
    id: string;
    name: string;
    percent_off: number | null;
    amount_off: number | null;
    duration: string;
    duration_in_months: number | null;
  };
  max_redemptions: number | null;
  times_redeemed: number;
  created: number;
}

// ── Helpers ──

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function formatDeal(coupon: PromoCode['coupon'] | undefined) {
  if (!coupon || typeof coupon === 'string') return '—';
  const disc = coupon.percent_off
    ? coupon.percent_off === 100 ? 'Free' : `${coupon.percent_off}% off`
    : coupon.amount_off ? `$${(coupon.amount_off / 100).toFixed(2)} off` : '?';
  if (coupon.duration === 'once') return `${disc} (one-time)`;
  if (coupon.duration === 'forever') return `${disc} forever`;
  if (coupon.duration === 'repeating' && coupon.duration_in_months) {
    if (coupon.percent_off === 100) return `${coupon.duration_in_months} month${coupon.duration_in_months > 1 ? 's' : ''} free`;
    return `${disc} for ${coupon.duration_in_months} month${coupon.duration_in_months > 1 ? 's' : ''}`;
  }
  return disc;
}

function statusBadge(status: string) {
  const cls = status === 'active' ? 'bg-green-500/20 text-green-500 border-green-500/30'
    : status === 'trialing' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
    : status === 'canceled' ? 'bg-red-500/20 text-red-500 border-red-500/30'
    : status === 'past_due' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30'
    : 'bg-muted text-muted-foreground';
  return <Badge className={cls}>{status || 'free'}</Badge>;
}

function sessionStatusBadge(status: string) {
  const cls = status === 'live' ? 'bg-green-500/20 text-green-500 border-green-500/30'
    : status === 'ready' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
    : status === 'ended' ? 'bg-muted text-muted-foreground'
    : status === 'processing' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
    : status === 'failed' ? 'bg-red-500/20 text-red-500 border-red-500/30'
    : 'bg-muted text-muted-foreground';
  return <Badge className={cls}>{status}</Badge>;
}

function audioStatusBadge(status: string) {
  if (!status || status === 'none') return <span className="text-muted-foreground text-sm">—</span>;
  const cls = status === 'ready' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
    : status === 'recording' ? 'bg-red-500/20 text-red-500 border-red-500/30'
    : status === 'failed' ? 'bg-red-500/20 text-red-500 border-red-500/30'
    : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
  return <Badge className={cls}>{status}</Badge>;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

// ── Main ──

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState('overview');

  // Overview
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users
  const [users, setUsers] = useState<AstrologerUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // User management dialogs
  const [selectedUser, setSelectedUser] = useState<AstrologerUser | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGrantSub, setShowGrantSub] = useState(false);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [grantTier, setGrantTier] = useState<'horoscope' | 'astrologer' | 'professional'>('professional');
  const [grantPlan, setGrantPlan] = useState<'monthly' | 'annual'>('monthly');
  const [grantMonths, setGrantMonths] = useState('1');
  const [creditType, setCreditType] = useState<'ai' | 'relocated'>('ai');
  const [creditAmount, setCreditAmount] = useState('10');
  const [actionLoading, setActionLoading] = useState(false);

  // Promotions
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [creating, setCreating] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [percentOff, setPercentOff] = useState('100');
  const [amountOff, setAmountOff] = useState('');
  const [duration, setDuration] = useState<'repeating' | 'once' | 'forever'>('repeating');
  const [durationMonths, setDurationMonths] = useState('3');
  const [maxRedemptions, setMaxRedemptions] = useState('1');
  const [deactivatePromo, setDeactivatePromo] = useState<PromoCode | null>(null);

  // Broadcast
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastHtml, setBroadcastHtml] = useState('');
  const [sending, setSending] = useState(false);

  // Analytics
  const [featureUsage, setFeatureUsage] = useState<FeatureRow[]>([]);
  const [dailyActive, setDailyActive] = useState<DailyActiveRow[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsError, setAnalyticsError] = useState('');

  // Sessions
  const [adminSessions, setAdminSessions] = useState<AdminSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [sessionsSearch, setSessionsSearch] = useState('');
  const [sessionsStatusFilter, setSessionsStatusFilter] = useState('all');

  // Charts
  const [adminCharts, setAdminCharts] = useState<AdminChart[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [chartsSearch, setChartsSearch] = useState('');
  const [chartsTypeFilter, setChartsTypeFilter] = useState('all');

  // Community applications
  const [communityApps, setCommunityApps] = useState<any[]>([]);
  const [communityAppsLoading, setCommunityAppsLoading] = useState(false);
  const [communityAppsLoaded, setCommunityAppsLoaded] = useState(false);

  // Community moderation (flagged content)
  const [communityFlags, setCommunityFlags] = useState<any[]>([]);
  const [communityFlagsLoading, setCommunityFlagsLoading] = useState(false);
  const [moderatingPostId, setModeratingPostId] = useState<string | null>(null);

  // Per-user analytics (shown in user detail)
  const [userEvents, setUserEvents] = useState<FeatureRow[]>([]);
  const [userSessions, setUserSessions] = useState<UserSessionRow[]>([]);
  const [userAnalyticsLoading, setUserAnalyticsLoading] = useState(false);

  // ── Admin check ──
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/'); return; }
    supabase.from('astrologer_profiles').select('is_admin').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.is_admin) setIsAdmin(true);
        else { setIsAdmin(false); navigate('/'); }
      });
  }, [user, authLoading, navigate]);

  // ── API helper ──
  const invoke = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('astrologer-admin', { body });
    if (error) throw new Error(error.message);
    return data;
  }, []);

  // ── Data loaders ──
  const loadOverview = useCallback(async () => {
    setStatsLoading(true);
    try { setStats((await invoke({ action: 'overview' })).stats); }
    catch (e: any) { toast.error(e.message); }
    finally { setStatsLoading(false); }
  }, [invoke]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try { setUsers((await invoke({ action: 'list_users' })).users || []); }
    catch (e: any) { toast.error(e.message); }
    finally { setUsersLoading(false); }
  }, [invoke]);

  const loadPromos = useCallback(async () => {
    setPromosLoading(true);
    try { setPromoCodes((await invoke({ action: 'list_promo_codes' })).promo_codes || []); }
    catch (e: any) { toast.error(e.message); }
    finally { setPromosLoading(false); }
  }, [invoke]);

  const loadAnalytics = useCallback(async (days: number = 30) => {
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const data = await invoke({ action: 'posthog_analytics', sub_action: 'dashboard', days });
      console.log('PostHog dashboard response:', data);
      setFeatureUsage((data?.features?.rows || []).map((r: any[]) => ({
        event: r[0], count: r[1], unique_users: r[2],
      })));
      setDailyActive((data?.dau?.rows || []).map((r: any[]) => ({
        day: r[0], users: r[1],
      })));
    } catch (e: any) {
      setAnalyticsError(e.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [invoke]);

  const loadCommunityApps = useCallback(async () => {
    setCommunityAppsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('community-admin', {
        body: { action: 'list_applications' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCommunityApps(data?.applications || []);
      setCommunityAppsLoaded(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load applications');
    } finally {
      setCommunityAppsLoading(false);
    }
  }, []);

  const handleAppAction = useCallback(async (appId: string, action: 'approve_application' | 'reject_application') => {
    try {
      const { data, error } = await supabase.functions.invoke('community-admin', {
        body: { action, application_id: appId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(action === 'approve_application' ? 'Application approved' : 'Application rejected');
      loadCommunityApps();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  }, [loadCommunityApps]);

  const loadCommunityFlags = useCallback(async () => {
    setCommunityFlagsLoading(true);
    try {
      const { data } = await supabase.functions.invoke('community-admin', {
        body: { action: 'list_flags' },
      });
      setCommunityFlags(data?.flags || []);
    } catch (err: any) {
      toast.error('Failed to load flagged content');
    } finally {
      setCommunityFlagsLoading(false);
    }
  }, []);

  const handleFlagAction = useCallback(async (flagId: string, flagStatus: 'reviewed' | 'dismissed', postId?: string, commentId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('community-admin', {
        body: { action: 'review_flag', flag_id: flagId, flag_status: flagStatus },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // If dismissed (keeping hidden), no extra action needed. If reviewed (approved), unhide the content.
      if (flagStatus === 'reviewed' && postId) {
        await supabase.functions.invoke('community-admin', {
          body: { action: 'unhide_post', post_id: postId },
        });
      }

      toast.success(flagStatus === 'reviewed' ? 'Content approved & unhidden' : 'Flag dismissed (content stays hidden)');
      loadCommunityFlags();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  }, [loadCommunityFlags]);

  const runGrokModeration = useCallback(async (postId?: string, commentId?: string) => {
    const id = postId || commentId;
    if (!id) return;
    setModeratingPostId(id);
    try {
      const { data, error } = await supabase.functions.invoke('community-moderate', {
        body: postId ? { post_id: postId } : { comment_id: commentId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = data?.result;
      if (result?.flagged) {
        toast.error(`Flagged: ${result.categories.join(', ')} — ${result.explanation}`);
      } else {
        toast.success(`Clean: ${result?.explanation || 'No issues detected'}`);
      }
      loadCommunityFlags();
    } catch (err: any) {
      toast.error(err.message || 'Moderation failed');
    } finally {
      setModeratingPostId(null);
    }
  }, [loadCommunityFlags]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await invoke({ action: 'list_sessions' });
      setAdminSessions(data.sessions || []);
      setSessionsLoaded(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setSessionsLoading(false); }
  }, [invoke]);

  const loadCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      const data = await invoke({ action: 'list_charts' });
      setAdminCharts(data.charts || []);
      setChartsLoaded(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setChartsLoading(false); }
  }, [invoke]);

  const loadUserAnalytics = useCallback(async (userId: string) => {
    setUserAnalyticsLoading(true);
    setUserEvents([]);
    setUserSessions([]);
    try {
      const events = await invoke({ action: 'posthog_analytics', sub_action: 'user_events', user_id: userId, days: 90 });
      setUserEvents((events.rows || []).map((r: any[]) => ({
        event: r[0], count: r[1], last_used: r[2],
      })));
      const sessions = await invoke({ action: 'posthog_analytics', sub_action: 'user_sessions', user_id: userId, days: 30 });
      setUserSessions((sessions.rows || []).map((r: any[]) => ({
        day: r[0], events: r[1], session_seconds: r[4] || 0,
      })));
    } catch {
      // PostHog may not be configured — silently ignore
    } finally {
      setUserAnalyticsLoading(false);
    }
  }, [invoke]);

  useEffect(() => {
    if (!isAdmin) return;
    loadOverview();
    loadUsers();
    loadPromos();
  }, [isAdmin, loadOverview, loadUsers, loadPromos]);

  // ── User actions ──
  const handleUpdateUser = async (userId: string, updates: Record<string, unknown>, successMsg: string) => {
    setActionLoading(true);
    try {
      await invoke({ action: 'update_user', user_id: userId, updates });
      toast.success(successMsg);
      loadUsers();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await invoke({ action: 'delete_user', user_id: selectedUser.id });
      toast.success(`Deleted ${selectedUser.email}`);
      setShowDeleteConfirm(false);
      setShowUserDetail(false);
      setSelectedUser(null);
      loadUsers();
      loadOverview();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleCancelSub = async (u: AstrologerUser) => {
    setActionLoading(true);
    try {
      await invoke({ action: 'cancel_subscription', user_id: u.id });
      toast.success(`Canceled subscription for ${u.email}`);
      loadUsers();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleGrantSub = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await invoke({ action: 'grant_subscription', user_id: selectedUser.id, tier: grantTier, plan: grantPlan, months: parseInt(grantMonths) });
      toast.success(`Granted ${grantMonths}mo ${grantTier} (${grantPlan}) to ${selectedUser.email}`);
      setShowGrantSub(false);
      loadUsers();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleAddCredits = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await invoke({ action: 'add_credits', user_id: selectedUser.id, credit_type: creditType, amount: parseInt(creditAmount) });
      toast.success(`Added ${creditAmount} ${creditType} credits to ${selectedUser.email}`);
      setShowAddCredits(false);
      loadUsers();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleResetCredits = async (u: AstrologerUser) => {
    setActionLoading(true);
    try {
      await invoke({ action: 'reset_credits', user_id: u.id });
      toast.success(`Reset credits for ${u.email}`);
      loadUsers();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  // ── Promo actions ──
  const handleCreatePromo = async () => {
    if (!promoCode.trim()) { toast.error('Enter a code'); return; }
    setCreating(true);
    try {
      const body: Record<string, unknown> = { action: 'create_full_promo', code: promoCode.trim(), duration };
      if (discountType === 'percent') body.percent_off = parseFloat(percentOff);
      else { body.amount_off = Math.round(parseFloat(amountOff) * 100); body.currency = 'usd'; }
      if (duration === 'repeating') body.duration_in_months = parseInt(durationMonths);
      const maxR = parseInt(maxRedemptions);
      if (maxR > 0) body.max_redemptions = maxR;
      const result = await invoke(body);
      if (result.warning) {
        toast.warning(result.warning, { duration: 10000 });
      } else {
        toast.success(`Promo code "${promoCode.toUpperCase()}" created`);
      }
      setShowCreatePromo(false);
      setPromoCode(''); setPercentOff('100'); setAmountOff(''); setDuration('repeating'); setDurationMonths('3'); setMaxRedemptions('1');
      loadPromos();
    } catch (e: any) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const handleDeactivate = async () => {
    if (!deactivatePromo) return;
    setActionLoading(true);
    try {
      await invoke({ action: 'deactivate_promo_code', promo_code_id: deactivatePromo.id });
      toast.success(`"${deactivatePromo.code}" deactivated`);
      setDeactivatePromo(null);
      loadPromos();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastHtml.trim()) { toast.error('Fill in subject and message'); return; }
    setSending(true);
    try {
      const data = await invoke({ action: 'send_broadcast', subject: broadcastSubject, html: broadcastHtml });
      toast.success(`Sent to ${data.sent} users`);
      setBroadcastSubject('');
      setBroadcastHtml('');
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  // ── Filtered users ──
  const filteredUsers = users.filter(u => {
    if (search) {
      const s = search.toLowerCase();
      if (!u.email.toLowerCase().includes(s) && !u.id.toLowerCase().includes(s) && !(u.display_name || '').toLowerCase().includes(s)) return false;
    }
    if (statusFilter !== 'all' && u.subscription_status !== statusFilter) return false;
    return true;
  });

  // Preview for promo create
  const getPreview = () => {
    const disc = discountType === 'percent'
      ? (percentOff === '100' ? 'Free' : `${percentOff}% off`)
      : `$${amountOff || '0'} off`;
    if (duration === 'once') return `${disc} (one-time)`;
    if (duration === 'forever') return `${disc} forever`;
    if (discountType === 'percent' && percentOff === '100') return `${durationMonths} month${parseInt(durationMonths) > 1 ? 's' : ''} free`;
    return `${disc} for ${durationMonths} month${parseInt(durationMonths) > 1 ? 's' : ''}`;
  };

  // ── Loading / auth gate ──
  if (authLoading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Astrologer Admin</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/chart')}>Back to App</Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto flex justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sessions" onClick={() => { if (!sessionsLoaded) loadSessions(); }}>Sessions</TabsTrigger>
            <TabsTrigger value="charts" onClick={() => { if (!chartsLoaded) loadCharts(); }}>Charts</TabsTrigger>
            <TabsTrigger value="analytics" onClick={() => { if (featureUsage.length === 0) loadAnalytics(analyticsDays); }}>Analytics</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="community" onClick={() => { if (!communityAppsLoaded) { loadCommunityApps(); loadCommunityFlags(); } }}>Community</TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW ── */}
          <TabsContent value="overview" className="space-y-6">
            {statsLoading ? (
              <p className="text-muted-foreground">Loading stats...</p>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Users" value={stats.total_users} />
                  <StatCard label="Paid (Active)" value={stats.active} />
                  <StatCard label="Trialing" value={stats.trialing} />
                  <StatCard label="Free" value={stats.free} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Signups (7d)" value={stats.signups_7d} />
                  <StatCard label="Signups (30d)" value={stats.signups_30d} />
                  <StatCard label="Monthly Plans" value={stats.monthly} />
                  <StatCard label="Annual Plans" value={stats.annual} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Saved Charts" value={stats.total_charts} />
                  <StatCard label="AI Readings Used" value={stats.total_ai_used} sub="this billing cycle" />
                  <StatCard label="Relocations Used" value={stats.total_relocated_used} sub="this billing cycle" />
                </div>

                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2">Sessions & Replays</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Sessions" value={stats.total_sessions} />
                  <StatCard label="Sessions (7d)" value={stats.sessions_7d} />
                  <StatCard label="Sessions (30d)" value={stats.sessions_30d} />
                  <StatCard label="Live Now" value={stats.sessions_live} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Ready Replays" value={stats.sessions_ready} />
                  <StatCard label="With Guests" value={stats.sessions_with_guests} />
                  <StatCard label="With Transcripts" value={stats.sessions_with_transcripts} />
                  <StatCard label="Recording Hours" value={stats.total_recording_hours} sub="total audio" />
                </div>
                {stats.sessions_failed > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Failed" value={stats.sessions_failed} />
                  </div>
                )}

                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">Email Broadcast</h3>
                  <div>
                    <Label>Subject</Label>
                    <Input value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} placeholder="Email subject..." />
                  </div>
                  <div>
                    <Label>Message (HTML)</Label>
                    <Textarea value={broadcastHtml} onChange={e => setBroadcastHtml(e.target.value)} placeholder="<p>Hello...</p>" rows={5} />
                  </div>
                  <Button onClick={handleBroadcast} disabled={sending}>
                    {sending ? 'Sending...' : `Send to ${stats.total_users} users`}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Failed to load stats</p>
            )}
          </TabsContent>

          {/* ── USERS ── */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-wrap">
              <Input
                placeholder="Search by email, name, or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="sm:max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadUsers} disabled={usersLoading}>
                {usersLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">{filteredUsers.length} users</p>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Charts</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.id} className="cursor-pointer" onClick={() => { setSelectedUser(u); setShowUserDetail(true); loadUserAnalytics(u.id); }}>
                      <TableCell>
                        <div className="font-medium text-sm">{u.email}</div>
                        {u.display_name && <div className="text-xs text-muted-foreground">{u.display_name}</div>}
                        {u.is_admin && <Badge className="mt-0.5 bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px]">Admin</Badge>}
                      </TableCell>
                      <TableCell>{statusBadge(u.subscription_status)}</TableCell>
                      <TableCell className="text-sm capitalize">{u.subscription_plan || '—'}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <div>AI: {u.ai_credits_used || 0} used</div>
                          <div>Reloc: {u.relocated_used || 0} used</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{u.saved_charts_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{timeAgo(u.last_sign_in_at)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setSelectedUser(u); setShowUserDetail(true); loadUserAnalytics(u.id); }}>
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── SESSIONS ── */}
          <TabsContent value="sessions" className="space-y-4">
            {sessionsLoading ? (
              <p className="text-muted-foreground">Loading sessions...</p>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="Search title, host, guest, token..." value={sessionsSearch} onChange={e => setSessionsSearch(e.target.value)} className="max-w-sm" />
                  <Select value={sessionsStatusFilter} onValueChange={setSessionsStatusFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Audio</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminSessions
                        .filter(s => {
                          if (sessionsStatusFilter !== 'all' && s.status !== sessionsStatusFilter) return false;
                          if (!sessionsSearch.trim()) return true;
                          const q = sessionsSearch.toLowerCase();
                          return s.title.toLowerCase().includes(q) ||
                            s.host_email.toLowerCase().includes(q) ||
                            s.host_name.toLowerCase().includes(q) ||
                            (s.guest_display_name || '').toLowerCase().includes(q) ||
                            (s.guest_email || '').toLowerCase().includes(q) ||
                            s.share_token.toLowerCase().includes(q) ||
                            s.chart_person_a.toLowerCase().includes(q) ||
                            s.chart_person_b.toLowerCase().includes(q);
                        })
                        .map(s => (
                          <TableRow key={s.id}>
                            <TableCell>
                              <div className="font-medium text-sm">{s.title}</div>
                              {(s.chart_person_a || s.chart_person_b) && (
                                <div className="text-xs text-muted-foreground">
                                  {s.chart_person_a}{s.chart_person_b ? ` & ${s.chart_person_b}` : ''}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{s.host_email}</div>
                              {s.host_name && <div className="text-xs text-muted-foreground">{s.host_name}</div>}
                            </TableCell>
                            <TableCell>
                              {s.guest_display_name || s.guest_email ? (
                                <>
                                  <div className="text-sm">{s.guest_display_name || '—'}</div>
                                  {s.guest_email && <div className="text-xs text-muted-foreground">{s.guest_email}</div>}
                                </>
                              ) : <span className="text-muted-foreground text-sm">—</span>}
                            </TableCell>
                            <TableCell>{sessionStatusBadge(s.status)}</TableCell>
                            <TableCell>{audioStatusBadge(s.audio_status)}</TableCell>
                            <TableCell className="text-sm">
                              {s.total_duration_ms > 0 ? `${Math.round(s.total_duration_ms / 60000)}m` : '—'}
                              {s.audio_duration_ms ? <div className="text-xs text-muted-foreground">{Math.round(s.audio_duration_ms / 60000)}m audio</div> : null}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1.5">
                                {s.has_transcript && <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px]">Transcript</Badge>}
                                {s.has_summary && <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30 text-[10px]">Summary</Badge>}
                                {!s.has_transcript && !s.has_summary && <span className="text-muted-foreground text-sm">—</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{timeAgo(s.created_at)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={`/session/${s.share_token}`} target="_blank" rel="noreferrer">View</a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">{adminSessions.length} sessions total</p>
              </>
            )}
          </TabsContent>

          {/* ── CHARTS ── */}
          <TabsContent value="charts" className="space-y-4">
            {chartsLoading ? (
              <p className="text-muted-foreground">Loading charts...</p>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="Search name, person, owner..." value={chartsSearch} onChange={e => setChartsSearch(e.target.value)} className="max-w-sm" />
                  <Select value={chartsTypeFilter} onValueChange={setChartsTypeFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="natal">Natal</SelectItem>
                      <SelectItem value="synastry">Synastry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Person A</TableHead>
                        <TableHead>Person B</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminCharts
                        .filter(c => {
                          if (chartsTypeFilter !== 'all' && c.chart_type !== chartsTypeFilter) return false;
                          if (!chartsSearch.trim()) return true;
                          const q = chartsSearch.toLowerCase();
                          return (c.name || '').toLowerCase().includes(q) ||
                            c.person_a_name.toLowerCase().includes(q) ||
                            (c.person_b_name || '').toLowerCase().includes(q) ||
                            c.owner_email.toLowerCase().includes(q) ||
                            c.owner_name.toLowerCase().includes(q);
                        })
                        .map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium text-sm">{c.name || c.person_a_name}</TableCell>
                            <TableCell>
                              <Badge className={c.chart_type === 'synastry' ? 'bg-pink-500/20 text-pink-500 border-pink-500/30' : 'bg-blue-500/20 text-blue-500 border-blue-500/30'}>
                                {c.chart_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{c.person_a_name}</div>
                              <div className="text-xs text-muted-foreground">{c.person_a_date}</div>
                            </TableCell>
                            <TableCell>
                              {c.person_b_name ? (
                                <>
                                  <div className="text-sm">{c.person_b_name}</div>
                                  <div className="text-xs text-muted-foreground">{c.person_b_date}</div>
                                </>
                              ) : <span className="text-muted-foreground text-sm">—</span>}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{c.owner_email}</div>
                              {c.owner_name && <div className="text-xs text-muted-foreground">{c.owner_name}</div>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{timeAgo(c.created_at)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">{adminCharts.length} charts total</p>
              </>
            )}
          </TabsContent>

          {/* ── ANALYTICS ── */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Feature Usage Analytics</h3>
              <div className="flex gap-2">
                {[7, 30, 90].map(d => (
                  <Button
                    key={d}
                    size="sm"
                    variant={analyticsDays === d ? 'default' : 'outline'}
                    onClick={() => { setAnalyticsDays(d); loadAnalytics(d); }}
                  >
                    {d}d
                  </Button>
                ))}
              </div>
            </div>

            {analyticsError && (
              <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-sm text-red-500">
                {analyticsError}
              </div>
            )}

            {analyticsLoading ? (
              <p className="text-muted-foreground">Loading analytics...</p>
            ) : (
              <>
                {/* Feature usage table */}
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead className="text-right">Total Events</TableHead>
                        <TableHead className="text-right">Unique Users</TableHead>
                        <TableHead className="text-right">Avg / User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {featureUsage.map(f => (
                        <TableRow key={f.event}>
                          <TableCell className="font-medium text-sm">{f.event.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{f.count.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{f.unique_users?.toLocaleString() || '—'}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {f.unique_users ? (f.count / f.unique_users).toFixed(1) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {featureUsage.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No analytics data yet. Make sure PostHog is configured.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Daily Active Users */}
                {dailyActive.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Daily Active Users</h3>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-end gap-[2px] h-32">
                        {dailyActive.map(d => {
                          const max = Math.max(...dailyActive.map(x => x.users), 1);
                          const pct = (d.users / max) * 100;
                          return (
                            <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                              <div
                                className="w-full bg-primary/70 rounded-t-sm min-h-[2px] transition-colors group-hover:bg-primary"
                                style={{ height: `${pct}%` }}
                              />
                              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap shadow z-10">
                                {d.day}: {d.users} user{d.users !== 1 ? 's' : ''}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                        <span>{dailyActive[0]?.day}</span>
                        <span>{dailyActive[dailyActive.length - 1]?.day}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <StatCard
                        label="Avg DAU"
                        value={Math.round(dailyActive.reduce((s, d) => s + d.users, 0) / dailyActive.length)}
                        sub={`last ${analyticsDays}d`}
                      />
                      <StatCard
                        label="Peak DAU"
                        value={Math.max(...dailyActive.map(d => d.users))}
                        sub={dailyActive.find(d => d.users === Math.max(...dailyActive.map(x => x.users)))?.day || ''}
                      />
                      <StatCard
                        label="Total Events"
                        value={featureUsage.reduce((s, f) => s + f.count, 0).toLocaleString()}
                        sub={`last ${analyticsDays}d`}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── PROMOTIONS ── */}
          <TabsContent value="promotions" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <p className="text-sm text-muted-foreground">{promoCodes.length} promo codes</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadPromos} disabled={promosLoading}>
                  {promosLoading ? 'Loading...' : 'Refresh'}
                </Button>
                <Button onClick={() => setShowCreatePromo(true)}>Create Promo Code</Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Deal</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <code className="font-mono font-bold bg-muted px-2 py-1 rounded text-sm">{p.code}</code>
                      </TableCell>
                      <TableCell className="font-medium">{formatDeal(p.coupon)}</TableCell>
                      <TableCell>{p.times_redeemed}{p.max_redemptions ? ` / ${p.max_redemptions}` : ' / unlimited'}</TableCell>
                      <TableCell>
                        <Badge className={p.active ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}>
                          {p.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created * 1000).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {p.active && (
                          <Button variant="ghost" size="sm" className="text-red-500 text-xs" onClick={() => setDeactivatePromo(p)}>
                            Deactivate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {promoCodes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No promo codes yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── COMMUNITY ── */}
          <TabsContent value="community" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Poster Applications</h3>
              <Button variant="outline" size="sm" onClick={loadCommunityApps} disabled={communityAppsLoading}>
                {communityAppsLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {communityAppsLoading && communityApps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading applications...</p>
            ) : communityApps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No pending applications</p>
            ) : (
              <div className="space-y-4">
                {communityApps.map((app: any) => {
                  const profile = app.user;
                  const photo = profile?.avatar_url || profile?.photos?.[0];
                  const name = profile?.display_name || profile?.first_name || 'Unknown';
                  return (
                    <div key={app.id} className="border rounded-xl p-4 bg-card">
                      <div className="flex items-start gap-4">
                        {photo ? (
                          <img src={photo} alt={name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl font-medium shrink-0">{name[0]}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{name}</span>
                            {profile?.email && <span className="text-xs text-muted-foreground">{profile.email}</span>}
                            <span className="text-xs text-muted-foreground font-mono">{app.user_id?.slice(0, 8)}</span>
                            <span className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                          {profile?.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
                          <div className="mt-2 bg-muted/50 rounded-lg px-3 py-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Why they want to post:</p>
                            <p className="text-sm">{app.reason}</p>
                          </div>
                          {/* Social links */}
                          {(profile?.website_url || profile?.twitter_handle || profile?.instagram_handle || profile?.linktree_url || profile?.tiktok_handle || profile?.youtube_url) && (
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                              {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">Website</a>}
                              {profile.linktree_url && <a href={profile.linktree_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">Linktree</a>}
                              {profile.twitter_handle && <span>X: {profile.twitter_handle}</span>}
                              {profile.instagram_handle && <span>IG: {profile.instagram_handle}</span>}
                              {profile.tiktok_handle && <span>TikTok: {profile.tiktok_handle}</span>}
                              {profile.youtube_url && <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">YouTube</a>}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" onClick={() => handleAppAction(app.id, 'approve_application')}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => handleAppAction(app.id, 'reject_application')}>Reject</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Flagged Content (Grok Moderation) ── */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Flagged Content (AI Moderation)</h3>
                <Button variant="outline" size="sm" onClick={loadCommunityFlags} disabled={communityFlagsLoading}>
                  {communityFlagsLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>

              {communityFlagsLoading && communityFlags.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading flagged content...</p>
              ) : communityFlags.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No pending flags</p>
              ) : (
                <div className="space-y-4 mt-4">
                  {communityFlags.map((flag: any) => {
                    const isAutoMod = flag.reporter_id === '00000000-0000-0000-0000-000000000000';
                    const content = flag.post_content || flag.comment_content;
                    const contentAuthor = content?.author;
                    const authorPhoto = contentAuthor?.avatar_url || contentAuthor?.photos?.[0];
                    const authorName = contentAuthor?.display_name || contentAuthor?.first_name || 'Unknown';
                    const isPost = !!flag.post_id;
                    const contentBody = isPost ? (content?.title ? `${content.title}\n${content.body}` : content?.body) : content?.body;

                    return (
                      <div key={flag.id} className="border rounded-xl p-4 bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={isAutoMod ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}>
                            {isAutoMod ? 'Grok Auto-Flag' : 'User Report'}
                          </Badge>
                          <Badge className="bg-muted text-muted-foreground">{isPost ? 'Post' : 'Comment'}</Badge>
                          {content?.is_hidden && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Hidden</Badge>}
                          <span className="text-xs text-muted-foreground ml-auto">{new Date(flag.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Reason */}
                        <div className="bg-muted/50 rounded-lg px-3 py-2 mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Reason:</p>
                          <p className="text-sm">{flag.reason}</p>
                        </div>

                        {/* Content preview */}
                        {content && (
                          <div className="border border-border/50 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              {authorPhoto ? (
                                <img src={authorPhoto} alt={authorName} className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">{authorName[0]}</div>
                              )}
                              <div>
                                <span className="text-sm font-medium">{authorName}</span>
                                <span className="text-xs text-muted-foreground ml-2">{content.user_id?.slice(0, 8)}</span>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap line-clamp-4">{contentBody || '(empty)'}</p>
                          </div>
                        )}

                        {/* Reporter info (if user report) */}
                        {!isAutoMod && flag.reporter && (
                          <p className="text-xs text-muted-foreground mb-3">
                            Reported by: {flag.reporter.display_name || flag.reporter.first_name || flag.reporter.id?.slice(0, 8)}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleFlagAction(flag.id, 'reviewed', flag.post_id, flag.comment_id)}>
                            Approve (Unhide)
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleFlagAction(flag.id, 'dismissed')}>
                            Dismiss (Keep Hidden)
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto text-purple-400"
                            disabled={moderatingPostId === (flag.post_id || flag.comment_id)}
                            onClick={() => runGrokModeration(flag.post_id || undefined, flag.comment_id || undefined)}
                          >
                            {moderatingPostId === (flag.post_id || flag.comment_id) ? 'Running...' : 'Re-run Grok'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── User Detail Dialog ── */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedUser.email}</DialogTitle>
                <DialogDescription>
                  {selectedUser.display_name && <span className="mr-2">{selectedUser.display_name}</span>}
                  <span className="font-mono text-[10px]">{selectedUser.id}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status + Plan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">{statusBadge(selectedUser.subscription_status)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Plan</Label>
                    <p className="text-sm mt-1 capitalize">{selectedUser.subscription_plan || 'None'}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Expires</Label>
                    <p className="text-sm mt-1">{selectedUser.subscription_expires_at ? new Date(selectedUser.subscription_expires_at).toLocaleDateString() : '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Trial Ends</Label>
                    <p className="text-sm mt-1">{selectedUser.trial_ends_at ? new Date(selectedUser.trial_ends_at).toLocaleDateString() : '—'}</p>
                  </div>
                </div>

                {/* Usage */}
                <div className="border rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-semibold">Usage</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold">{selectedUser.ai_credits_used || 0}</p>
                      <p className="text-[10px] text-muted-foreground">AI Readings</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{selectedUser.relocated_used || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Relocations</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{selectedUser.saved_charts_count}</p>
                      <p className="text-[10px] text-muted-foreground">Saved Charts</p>
                    </div>
                  </div>
                </div>

                {/* PostHog Feature Usage */}
                <div className="border rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-semibold">Feature Activity (90d)</h4>
                  {userAnalyticsLoading ? (
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  ) : userEvents.length > 0 ? (
                    <div className="space-y-1.5">
                      {userEvents.map(e => {
                        const max = Math.max(...userEvents.map(x => x.count), 1);
                        return (
                          <div key={e.event} className="flex items-center gap-2 text-xs">
                            <span className="w-28 truncate text-muted-foreground" title={e.event}>{e.event.replace(/_/g, ' ')}</span>
                            <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-primary/70 h-full rounded-full transition-all"
                                style={{ width: `${(e.count / max) * 100}%` }}
                              />
                            </div>
                            <span className="font-mono w-8 text-right">{e.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No events tracked</p>
                  )}
                </div>

                {/* User Sessions / Time Spent */}
                {userSessions.length > 0 && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <h4 className="text-sm font-semibold">Daily Sessions (30d)</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {userSessions.map(s => (
                        <div key={s.day} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{s.day}</span>
                          <div className="flex gap-3">
                            <span>{s.events} event{s.events !== 1 ? 's' : ''}</span>
                            {s.session_seconds > 0 && (
                              <span className="text-muted-foreground">
                                {s.session_seconds >= 3600
                                  ? `${Math.floor(s.session_seconds / 3600)}h ${Math.floor((s.session_seconds % 3600) / 60)}m`
                                  : s.session_seconds >= 60
                                    ? `${Math.floor(s.session_seconds / 60)}m`
                                    : `${s.session_seconds}s`}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Login</Label>
                    <p className="text-sm mt-1">{timeAgo(selectedUser.last_sign_in_at)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Joined</Label>
                    <p className="text-sm mt-1">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Stripe */}
                {selectedUser.stripe_customer_id && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Stripe Customer</Label>
                    <p className="text-xs font-mono mt-1">{selectedUser.stripe_customer_id}</p>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="text-sm font-semibold">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setShowAddCredits(true); }}>
                      Add Credits
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleResetCredits(selectedUser)} disabled={actionLoading}>
                      Reset Credits
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowGrantSub(true); }}>
                      Grant Subscription
                    </Button>
                    {(selectedUser.subscription_status === 'active' || selectedUser.subscription_status === 'trialing') && (
                      <Button size="sm" variant="outline" className="text-orange-500" onClick={() => handleCancelSub(selectedUser)} disabled={actionLoading}>
                        Cancel Subscription
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateUser(selectedUser.id, { is_admin: !selectedUser.is_admin }, selectedUser.is_admin ? 'Removed admin' : 'Granted admin')}
                      disabled={actionLoading}
                    >
                      {selectedUser.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                      Delete Account
                    </Button>
                  </div>

                  {/* Quick status change */}
                  <div className="flex items-center gap-2 mt-3">
                    <Label className="text-xs whitespace-nowrap">Set Status:</Label>
                    <Select
                      value={selectedUser.subscription_status || 'free'}
                      onValueChange={(v) => handleUpdateUser(selectedUser.id, { subscription_status: v }, `Status → ${v}`)}
                    >
                      <SelectTrigger className="h-8 text-xs w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="trialing">Trialing</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedUser?.email}?</DialogTitle>
            <DialogDescription>This permanently deletes their account, profile, and all saved charts. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading}>
              {actionLoading ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Grant Subscription ── */}
      <Dialog open={showGrantSub} onOpenChange={setShowGrantSub}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Subscription</DialogTitle>
            <DialogDescription>Give {selectedUser?.email} a free subscription.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tier</Label>
              <Select value={grantTier} onValueChange={(v: 'horoscope' | 'astrologer' | 'professional') => setGrantTier(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="horoscope">Horoscope ($4.99/mo)</SelectItem>
                  <SelectItem value="astrologer">Astrologer ($7.99/mo)</SelectItem>
                  <SelectItem value="professional">Professional ($14.99/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plan</Label>
                <Select value={grantPlan} onValueChange={(v: 'monthly' | 'annual') => setGrantPlan(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (months)</Label>
                <Input type="number" min="1" value={grantMonths} onChange={e => setGrantMonths(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantSub(false)}>Cancel</Button>
            <Button onClick={handleGrantSub} disabled={actionLoading}>
              {actionLoading ? 'Granting...' : 'Grant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Credits ── */}
      <Dialog open={showAddCredits} onOpenChange={setShowAddCredits}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>Add AI reading or relocation credits to {selectedUser?.email}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Credit Type</Label>
                <Select value={creditType} onValueChange={(v: 'ai' | 'relocated') => setCreditType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">AI Readings</SelectItem>
                    <SelectItem value="relocated">Relocations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" min="1" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Current usage: {creditType === 'ai' ? selectedUser?.ai_credits_used || 0 : selectedUser?.relocated_used || 0} used.
              Adding credits lowers the used count, effectively giving them more.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCredits(false)}>Cancel</Button>
            <Button onClick={handleAddCredits} disabled={actionLoading}>
              {actionLoading ? 'Adding...' : `Add ${creditAmount} Credits`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Promo Dialog ── */}
      <Dialog open={showCreatePromo} onOpenChange={setShowCreatePromo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>Code, discount, and duration in one step.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Promo Code</Label>
              <Input
                placeholder="e.g. WELCOME2026"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                className="font-mono uppercase text-lg tracking-wider"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount Type</Label>
                <Select value={discountType} onValueChange={(v: 'percent' | 'amount') => setDiscountType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="amount">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {discountType === 'percent' ? (
                <div>
                  <Label>Percent Off</Label>
                  <Input type="number" min="1" max="100" value={percentOff} onChange={e => setPercentOff(e.target.value)} />
                </div>
              ) : (
                <div>
                  <Label>Amount Off ($)</Label>
                  <Input type="number" min="0.01" step="0.01" value={amountOff} onChange={e => setAmountOff(e.target.value)} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration</Label>
                <Select value={duration} onValueChange={(v: 'once' | 'repeating' | 'forever') => setDuration(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repeating">X Months</SelectItem>
                    <SelectItem value="once">One-time</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {duration === 'repeating' && (
                <div>
                  <Label>Months</Label>
                  <Input type="number" min="1" value={durationMonths} onChange={e => setDurationMonths(e.target.value)} />
                </div>
              )}
            </div>
            <div>
              <Label>Max Redemptions</Label>
              <Input type="number" min="0" value={maxRedemptions} onChange={e => setMaxRedemptions(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">0 = unlimited</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Preview</p>
              <p className="font-mono font-bold text-lg">{promoCode || '???'}</p>
              <p className="text-sm font-medium">{getPreview()}</p>
              <p className="text-xs text-muted-foreground">
                {parseInt(maxRedemptions) > 0 ? `${maxRedemptions} use${parseInt(maxRedemptions) > 1 ? 's' : ''}` : 'Unlimited'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePromo(false)}>Cancel</Button>
            <Button onClick={handleCreatePromo} disabled={creating || !promoCode.trim()}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Dialog ── */}
      <Dialog open={!!deactivatePromo} onOpenChange={() => setDeactivatePromo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate "{deactivatePromo?.code}"?</DialogTitle>
            <DialogDescription>It can no longer be used at checkout.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivatePromo(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={actionLoading}>
              {actionLoading ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
