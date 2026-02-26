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
      await invoke({ action: 'grant_subscription', user_id: selectedUser.id, plan: grantPlan, months: parseInt(grantMonths) });
      toast.success(`Granted ${grantMonths}mo ${grantPlan} to ${selectedUser.email}`);
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
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Astrologer Admin</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/chart')}>Back to App</Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
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
            <div className="flex gap-3 flex-wrap">
              <Input
                placeholder="Search by email, name, or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-sm"
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
                    <TableRow key={u.id} className="cursor-pointer" onClick={() => { setSelectedUser(u); setShowUserDetail(true); }}>
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
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setSelectedUser(u); setShowUserDetail(true); }}>
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

          {/* ── PROMOTIONS ── */}
          <TabsContent value="promotions" className="space-y-4">
            <div className="flex justify-between items-center">
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
