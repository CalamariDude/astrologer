import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { SessionsList } from '@/components/session/SessionsList';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';
import { supabase } from '@/lib/supabase';

export default function SessionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pageTheme, setPageTheme] = useState(() => localStorage.getItem('astrologer_theme') || 'classic');
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);

  useEffect(() => {
    const dark = isThemeDark(pageTheme);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [pageTheme]);

  useEffect(() => {
    if (!user) { navigate('/', { replace: true }); return; }
    supabase.from('astrologer_profiles').select('theme').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.theme && data.theme !== pageTheme) {
          setPageTheme(data.theme);
          localStorage.setItem('astrologer_theme', data.theme);
        }
      });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div
      className={`min-h-screen ${isThemeDark(pageTheme) ? 'dark' : ''}`}
      style={themeVars}
    >
      <div className="border-b bg-background">
        <div className="container flex items-center gap-3 py-3 px-4 md:px-6">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-sm font-medium">Sessions</h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-6 max-w-4xl">
        <SessionsList />
      </div>
    </div>
  );
}
