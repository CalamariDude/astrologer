import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { CELEBRITIES, CELEBRITY_CATEGORIES, type CelebrityCategory } from '@/data/celebrities';

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr: string): string {
  // Handle BC dates
  if (dateStr.startsWith('-')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

const CATEGORY_COLORS: Record<CelebrityCategory, string> = {
  Actors: '#e11d48',
  Musicians: '#7c3aed',
  Athletes: '#059669',
  Leaders: '#d97706',
  Scientists: '#2563eb',
  Artists: '#db2777',
  Writers: '#0891b2',
  Historical: '#78716c',
};

export default function CelebrityChartsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CelebrityCategory | 'All'>('All');

  const pageTheme = localStorage.getItem('astrologer_theme') || 'classic';
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);

  useEffect(() => {
    const dark = isThemeDark(pageTheme);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [pageTheme]);

  const filtered = useMemo(() => {
    let list = CELEBRITIES;
    if (activeCategory !== 'All') {
      list = list.filter(c => c.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [search, activeCategory]);

  return (
    <div className={`min-h-screen ${isThemeDark(pageTheme) ? 'dark' : ''}`} style={themeVars}>
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container flex items-center justify-between py-3 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm font-medium">Celebrity Charts</span>
          </div>
          <ProfileDropdown />
        </div>
      </header>

      <main className="container px-4 md:px-6 py-6 max-w-6xl space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search celebrities..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveCategory('All')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === 'All'
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {CELEBRITY_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              style={activeCategory === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : undefined}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'celebrity' : 'celebrities'}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No celebrities found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(celeb => (
              <button
                key={celeb.name + celeb.date}
                onClick={() => {
                  navigate('/chart', {
                    state: {
                      loadClient: {
                        name: celeb.name,
                        date: celeb.date,
                        time: celeb.time,
                        location: celeb.location,
                        lat: celeb.lat,
                        lng: celeb.lng,
                        autoCalculate: true,
                      },
                    },
                  });
                  window.scrollTo(0, 0);
                }}
                className="rounded-xl border bg-card p-4 text-left hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col items-center gap-2.5"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[celeb.category] }}
                >
                  {getInitials(celeb.name)}
                </div>
                <div className="text-center min-w-0 w-full">
                  <div className="text-sm font-medium truncate">{celeb.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{formatDate(celeb.date)}</div>
                  <span
                    className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: CATEGORY_COLORS[celeb.category] + '18',
                      color: CATEGORY_COLORS[celeb.category],
                    }}
                  >
                    {celeb.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
