import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  User, CreditCard, Settings, LogOut, FolderOpen, Radio, Bell, ChevronDown, Shield,
  Lightbulb, Send, Loader2, Check,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase';

/** Apply theme CSS variables to document.documentElement so portaled elements (dropdowns, dialogs) inherit them */
function applyThemeToDocument(themeName: string) {
  const vars = getThemeCSSVariables(themeName);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    if (key.startsWith('--')) {
      root.style.setProperty(key, value);
    }
  }
  const dark = isThemeDark(themeName);
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

function FeatureRequestDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (v: boolean) => void; user: { id: string; email?: string } }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('astrologer-support-ticket', {
        body: {
          email: user.email || 'unknown',
          category: 'Feature Request',
          subject: `Feature request from ${user.email || user.id}`,
          message: message.trim(),
          systemInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userId: user.id,
            source: 'profile-feature-request',
          },
        },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setSent(true);
      setTimeout(() => { onOpenChange(false); setSent(false); setMessage(''); }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSent(false); setError(null); setMessage(''); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Missing a feature?
          </DialogTitle>
          <DialogDescription>
            Tell us what you'd like to see. We read every message.
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="text-center py-6 space-y-3 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium">Thanks for the feedback!</p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the feature you'd like..."
              rows={4}
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/40"
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter to send
              </span>
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ProfileDropdown() {
  const { user, signOut } = useAuth();
  const { isPaid } = useSubscription();
  const [isAdmin, setIsAdmin] = useState(false);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);

  useEffect(() => {
    // Apply theme from localStorage immediately so dropdown is themed on first render
    const saved = localStorage.getItem('astrologer_theme') || 'classic';
    applyThemeToDocument(saved);

    if (!user) { setIsAdmin(false); return; }
    supabase.from('astrologer_profiles').select('is_admin, theme').eq('id', user.id).single()
      .then(({ data }) => {
        setIsAdmin(data?.is_admin ?? false);
        if (data?.theme) {
          localStorage.setItem('astrologer_theme', data.theme);
          applyThemeToDocument(data.theme);
        }
      });
  }, [user]);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-foreground" />
          </div>
          <span className="hidden sm:inline max-w-[120px] truncate">{user.email?.split('@')[0]}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          {isPaid && <div className="text-[10px] text-emerald-500 font-medium mt-0.5">Pro</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings#account">
            <User className="w-4 h-4 mr-2" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings#billing">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing & Usage
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings#notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/charts">
            <FolderOpen className="w-4 h-4 mr-2" />
            Charts
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/sessions">
            <Radio className="w-4 h-4 mr-2" />
            Sessions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings#preferences">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin">
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setFeatureDialogOpen(true)}>
          <Lightbulb className="w-4 h-4 mr-2" />
          Missing a feature?
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
      <FeatureRequestDialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen} user={user} />
    </DropdownMenu>
  );
}
