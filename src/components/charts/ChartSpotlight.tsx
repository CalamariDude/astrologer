import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Sun, Heart } from 'lucide-react';
import { getSavedCharts, getSavedChartsAsync, type SavedChart } from './SaveChartButton';

interface ChartSpotlightProps {
  open: boolean;
  onClose: () => void;
  onLoad: (chart: SavedChart) => void;
  userId: string | null;
}

export function ChartSpotlight({ open, onClose, onLoad, userId }: ChartSpotlightProps) {
  const [query, setQuery] = useState('');
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load charts when opened
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIndex(0);
    // Sync first (instant from cache)
    const cached = getSavedCharts(userId);
    setCharts(cached);
    // Then async refresh
    getSavedChartsAsync(userId).then(setCharts);
  }, [open, userId]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return charts;
    const q = query.toLowerCase();
    return charts.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.person_a_name?.toLowerCase().includes(q) ||
      c.person_b_name?.toLowerCase().includes(q) ||
      c.chart_type?.toLowerCase().includes(q)
    );
  }, [charts, query]);

  // Clamp selected index when results change
  useEffect(() => {
    setSelectedIndex(i => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback((chart: SavedChart) => {
    onLoad(chart);
    onClose();
  }, [onLoad, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [filtered, selectedIndex, handleSelect, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Spotlight panel — upper third */}
      <div className="relative flex justify-center pt-[12vh] px-4" onClick={e => e.stopPropagation()}>
        <div
          className="w-full max-w-lg bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              placeholder="Search charts..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border px-1.5 text-[10px] text-muted-foreground/60 font-mono">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[320px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {charts.length === 0 ? 'No saved charts' : 'No matches'}
              </div>
            ) : (
              filtered.map((chart, i) => (
                <button
                  key={chart.id}
                  onClick={() => handleSelect(chart)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${
                    chart.chart_type === 'synastry'
                      ? 'bg-pink-500/10 text-pink-500'
                      : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {chart.chart_type === 'synastry' ? <Heart className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{chart.name || chart.person_a_name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {chart.person_a_name}
                      {chart.person_b_name ? ` & ${chart.person_b_name}` : ''}
                      <span className="mx-1.5">·</span>
                      {chart.chart_type}
                    </div>
                  </div>

                  {/* Enter hint on selected */}
                  {i === selectedIndex && (
                    <kbd className="hidden sm:inline-flex h-5 items-center rounded border px-1.5 text-[10px] text-muted-foreground/60 font-mono shrink-0">↵</kbd>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t text-[10px] text-muted-foreground/50 font-mono">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
