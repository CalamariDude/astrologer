import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  User, CreditCard, Settings, LogOut, FolderOpen, Radio, Bell, ChevronDown, Shield,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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

export function ProfileDropdown() {
  const { user, signOut } = useAuth();
  const { isPaid } = useSubscription();
  const [isAdmin, setIsAdmin] = useState(false);

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
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
