import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardPaste, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { SavedChartsInline } from '@/components/charts/SavedChartsList';
import { AstroComImport, type ParsedPerson } from '@/components/charts/AstroComImport';
import { getSavedChartsAsync, invalidateChartsCache } from '@/components/charts/SaveChartButton';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';
import { supabase } from '@/lib/supabase';
import { swissEphemeris } from '@/api/swissEphemeris';

export default function ChartsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showAstroImport, setShowAstroImport] = useState(false);
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
  }, [user]);

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
          <h1 className="text-sm font-medium">Charts</h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-6 max-w-4xl space-y-4">
        <SavedChartsInline onLoad={(chart) => {
          navigate('/chart', { state: { loadChart: chart } });
        }} />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAstroImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Import from Astro.com
          </button>
          <button
            onClick={handleExportCharts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export All Charts
          </button>
        </div>
      </div>

      <AstroComImport isOpen={showAstroImport} onClose={() => setShowAstroImport(false)} onImport={handleAstroImport} />
    </div>
  );
}
