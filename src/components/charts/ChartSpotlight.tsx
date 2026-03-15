import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Sun, Heart, LayoutGrid, Command } from 'lucide-react';
import { getSavedCharts, getSavedChartsAsync, type SavedChart } from './SaveChartButton';
import { TAB_VALUES, TAB_LABELS, SHORTCUTS, formatShortcut } from '@/lib/keyboardShortcuts';

// ─── Result types ─────────────────────────────────────────────

type ResultItem =
  | { type: 'chart'; chart: SavedChart }
  | { type: 'feature'; tab: string; label: string }
  | { type: 'command'; id: string; label: string; shortcut?: string };

interface ChartSpotlightProps {
  open: boolean;
  onClose: () => void;
  onLoad: (chart: SavedChart) => void;
  userId: string | null;
  onTabChange?: (tab: string) => void;
  onCommand?: (id: string) => void;
}

// ─── Static data ─────────────────────────────────────────────

const FEATURES: ResultItem[] = TAB_VALUES.map(tab => ({
  type: 'feature' as const,
  tab,
  label: TAB_LABELS[tab] || tab,
}));

// Build commands from ALL keyboard shortcuts (except spotlight itself which opens this palette)
const COMMANDS: ResultItem[] = SHORTCUTS
  .filter(s => s.id !== 'spotlight')
  .map(s => ({
    type: 'command' as const,
    id: s.id,
    label: s.label,
    shortcut: formatShortcut(s),
  }));

// ─── Component ───────────────────────────────────────────────

export function ChartSpotlight({ open, onClose, onLoad, userId, onTabChange, onCommand }: ChartSpotlightProps) {
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
    const cached = getSavedCharts(userId);
    setCharts(cached);
    getSavedChartsAsync(userId).then(setCharts);
  }, [open, userId]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // ─── Filtered results ───────────────────────────────────────

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const items: ResultItem[] = [];

    // Charts
    const matchedCharts = q
      ? charts.filter(c =>
          c.name?.toLowerCase().includes(q) ||
          c.person_a_name?.toLowerCase().includes(q) ||
          c.person_b_name?.toLowerCase().includes(q) ||
          c.chart_type?.toLowerCase().includes(q)
        )
      : charts;
    matchedCharts.forEach(chart => items.push({ type: 'chart', chart }));

    // Features
    const matchedFeatures = q
      ? FEATURES.filter(f => f.type === 'feature' && (f as any).label.toLowerCase().includes(q))
      : FEATURES;
    items.push(...matchedFeatures);

    // Commands
    const matchedCommands = q
      ? COMMANDS.filter(c => c.type === 'command' && (c as any).label.toLowerCase().includes(q))
      : COMMANDS;
    items.push(...matchedCommands);

    return items;
  }, [charts, query]);

  // Group results by type for section headers
  const grouped = useMemo(() => {
    const groups: { label: string; items: { item: ResultItem; globalIndex: number }[] }[] = [];
    let idx = 0;
    const chartItems = results.filter(r => r.type === 'chart');
    const featureItems = results.filter(r => r.type === 'feature');
    const commandItems = results.filter(r => r.type === 'command');

    if (chartItems.length > 0) {
      groups.push({ label: 'Charts', items: chartItems.map(item => ({ item, globalIndex: idx++ })) });
    }
    if (featureItems.length > 0) {
      groups.push({ label: 'Features', items: featureItems.map(item => ({ item, globalIndex: idx++ })) });
    }
    if (commandItems.length > 0) {
      groups.push({ label: 'Commands', items: commandItems.map(item => ({ item, globalIndex: idx++ })) });
    }
    return groups;
  }, [results]);

  // Clamp selected index when results change
  useEffect(() => {
    setSelectedIndex(i => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-spotlight-index="${selectedIndex}"]`) as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback((item: ResultItem) => {
    if (item.type === 'chart') {
      onLoad(item.chart);
    } else if (item.type === 'feature') {
      onTabChange?.(item.tab);
    } else if (item.type === 'command') {
      onCommand?.(item.id);
    }
    onClose();
  }, [onLoad, onTabChange, onCommand, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [results, selectedIndex, handleSelect, onClose]);

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
              placeholder="Search charts, features, commands..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border px-1.5 text-[10px] text-muted-foreground/60 font-mono">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No matches
              </div>
            ) : (
              grouped.map(group => (
                <div key={group.label}>
                  <div className="px-4 pt-2.5 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{group.label}</span>
                  </div>
                  {group.items.map(({ item, globalIndex }) => {
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={item.type === 'chart' ? item.chart.id : item.type === 'feature' ? item.tab : item.id}
                        data-spotlight-index={globalIndex}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                        }`}
                      >
                        {/* Icon */}
                        {item.type === 'chart' && (
                          <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${
                            item.chart.chart_type === 'synastry'
                              ? 'bg-pink-500/10 text-pink-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {item.chart.chart_type === 'synastry' ? <Heart className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                          </div>
                        )}
                        {item.type === 'feature' && (
                          <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                            <LayoutGrid className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.type === 'command' && (
                          <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-violet-500/10 text-violet-500">
                            <Command className="w-3.5 h-3.5" />
                          </div>
                        )}

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          {item.type === 'chart' ? (
                            <>
                              <div className="text-sm font-medium truncate">{item.chart.name || item.chart.person_a_name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {item.chart.person_a_name}
                                {item.chart.person_b_name ? ` & ${item.chart.person_b_name}` : ''}
                                <span className="mx-1.5">&middot;</span>
                                {item.chart.chart_type}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm font-medium truncate">{item.type === 'feature' ? item.label : item.label}</div>
                          )}
                        </div>

                        {/* Shortcut badge for commands */}
                        {item.type === 'command' && item.shortcut && (
                          <kbd className="hidden sm:inline-flex h-5 items-center rounded border px-1.5 text-[10px] text-muted-foreground/60 font-mono shrink-0">
                            {item.shortcut}
                          </kbd>
                        )}

                        {/* Enter hint on selected */}
                        {isSelected && item.type !== 'command' && (
                          <kbd className="hidden sm:inline-flex h-5 items-center rounded border px-1.5 text-[10px] text-muted-foreground/60 font-mono shrink-0">↵</kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t text-[10px] text-muted-foreground/50 font-mono">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
