import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Trash2, BarChart3, Heart, X, Loader2, Search, CheckSquare, Square, Filter, Tag, Plus, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getSavedChartsAsync, deleteSavedChart, bulkDeleteSavedCharts, updateChartTags, type SavedChart } from './SaveChartButton';
import { useAuth } from '@/contexts/AuthContext';
import { ZODIAC_SIGNS, PLANETS } from '@/components/biwheel/utils/constants';

// ─── Filter types & helpers ───────────────────────────────────────────

interface PlacementFilter {
  planet: string;
  sign: string;
}

interface ChartFilters {
  placements: PlacementFilter[];
  dateFrom: string;
  dateTo: string;
  location: string;
  tags: string[];
}

const EMPTY_FILTERS: ChartFilters = { placements: [], dateFrom: '', dateTo: '', location: '', tags: [] };

function hasActiveFilters(f: ChartFilters): boolean {
  return f.placements.length > 0 || !!f.dateFrom || !!f.dateTo || !!f.location || f.tags.length > 0;
}

function countActiveFilters(f: ChartFilters): number {
  let n = f.placements.length;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  if (f.location) n++;
  n += f.tags.length;
  return n;
}

const FILTER_PLANETS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'northnode', 'chiron', 'ascendant', 'midheaven',
] as const;

function getSignFromLongitude(longitude: number): string {
  return ZODIAC_SIGNS[Math.floor(longitude / 30) % 12].name;
}

function chartMatchesFilters(chart: SavedChart, filters: ChartFilters): boolean {
  // Placement filters
  if (filters.placements.length > 0) {
    const planets = chart.person_a_chart?.planets;
    if (!planets) return false;
    const ok = filters.placements.every(f => {
      const p = planets[f.planet];
      if (!p) return false;
      const sign = p.sign || (p.longitude !== undefined ? getSignFromLongitude(p.longitude) : '');
      return sign.toLowerCase() === f.sign.toLowerCase();
    });
    if (!ok) return false;
  }
  // Date filters (birth date of person A)
  if (filters.dateFrom && chart.person_a_date < filters.dateFrom) return false;
  if (filters.dateTo && chart.person_a_date > filters.dateTo) return false;
  // Location filter
  if (filters.location) {
    const q = filters.location.toLowerCase();
    const loc = (chart.person_a_location || '').toLowerCase();
    if (!loc.includes(q)) return false;
  }
  // Tags filter
  if (filters.tags.length > 0) {
    const chartTags = chart.tags || [];
    if (!filters.tags.every(t => chartTags.includes(t))) return false;
  }
  return true;
}

const ELEMENT_BG: Record<string, string> = {
  fire: 'bg-red-500/12 border-red-500/25 text-red-600 dark:text-red-400',
  earth: 'bg-green-500/12 border-green-500/25 text-green-600 dark:text-green-400',
  air: 'bg-yellow-500/12 border-yellow-500/25 text-yellow-600 dark:text-yellow-400',
  water: 'bg-blue-500/12 border-blue-500/25 text-blue-600 dark:text-blue-400',
};
const ELEMENT_BG_ACTIVE: Record<string, string> = {
  fire: 'bg-red-500 border-red-600 text-white',
  earth: 'bg-green-500 border-green-600 text-white',
  air: 'bg-yellow-500 border-yellow-600 text-white dark:text-black',
  water: 'bg-blue-500 border-blue-600 text-white',
};

// ─── Section header inside filter panel ──────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</span>
    </div>
  );
}

// ─── Comprehensive Filter Panel ──────────────────────────────────────

function FilterPanel({ filters, onChange, matchCount, totalCount, allTags }: {
  filters: ChartFilters;
  onChange: (f: ChartFilters) => void;
  matchCount: number;
  totalCount: number;
  allTags: string[];
}) {
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const activeCount = countActiveFilters(filters);

  const placementMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of filters.placements) m.set(f.planet, f.sign);
    return m;
  }, [filters.placements]);

  const togglePlacement = (planet: string, sign: string) => {
    const existing = placementMap.get(planet);
    let next: PlacementFilter[];
    if (existing === sign) {
      next = filters.placements.filter(f => f.planet !== planet);
    } else {
      next = [...filters.placements.filter(f => f.planet !== planet), { planet, sign }];
    }
    onChange({ ...filters, placements: next });
  };

  const toggleTag = (tag: string) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onChange({ ...filters, tags: next });
  };

  const clearAll = () => onChange(EMPTY_FILTERS);

  // Summary pills for collapsed state
  const summaryPills: React.ReactNode[] = [];
  for (const f of filters.placements) {
    const pInfo = PLANETS[f.planet as keyof typeof PLANETS];
    const sInfo = ZODIAC_SIGNS.find(s => s.name === f.sign);
    summaryPills.push(
      <span key={`p-${f.planet}`} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium border border-border/30">
        <span style={{ color: pInfo?.color }}>{pInfo?.symbol}</span>
        <span>{sInfo?.symbol}</span>
      </span>
    );
  }
  for (const t of filters.tags) {
    summaryPills.push(
      <span key={`t-${t}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-medium border border-violet-500/20">
        <Tag className="w-2.5 h-2.5" />{t}
      </span>
    );
  }
  if (filters.dateFrom || filters.dateTo) {
    summaryPills.push(
      <span key="date" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium border border-border/30">
        <Calendar className="w-2.5 h-2.5 text-muted-foreground" />
        {filters.dateFrom || '...'} — {filters.dateTo || '...'}
      </span>
    );
  }
  if (filters.location) {
    summaryPills.push(
      <span key="loc" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium border border-border/30">
        <MapPin className="w-2.5 h-2.5 text-muted-foreground" />{filters.location}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      {/* Toggle row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setOpen(v => !v)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
            open
              ? 'bg-foreground/5 text-foreground border-border shadow-sm'
              : activeCount > 0
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-border/50'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
              {activeCount}
            </span>
          )}
        </button>
        {!open && summaryPills}
        {!open && activeCount > 0 && (
          <button onClick={clearAll} className="text-[11px] text-muted-foreground/60 hover:text-destructive transition-colors px-1">
            Clear
          </button>
        )}
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* ── Tags section ────────────────────────────── */}
          <SectionHeader icon={Tag} label="Tags" />
          <div className="px-3 pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {allTags.map(tag => {
                const active = filters.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                      active
                        ? 'bg-violet-500 text-white border-violet-600 shadow-sm'
                        : 'bg-violet-500/8 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/15'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
              {allTags.length === 0 && (
                <span className="text-[11px] text-muted-foreground/50 italic">No tags yet — add tags to charts below</span>
              )}
            </div>
          </div>

          {/* ── Date & Location section ─────────────────── */}
          <SectionHeader icon={Calendar} label="Birth date range" />
          <div className="px-3 pb-2 flex items-center gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
              className="flex-1 text-xs bg-background border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="From"
            />
            <span className="text-xs text-muted-foreground/50">to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => onChange({ ...filters, dateTo: e.target.value })}
              className="flex-1 text-xs bg-background border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="To"
            />
          </div>

          <SectionHeader icon={MapPin} label="Location" />
          <div className="px-3 pb-2">
            <input
              type="text"
              value={filters.location}
              onChange={e => onChange({ ...filters, location: e.target.value })}
              placeholder="City, country..."
              className="w-full text-xs bg-background border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
            />
          </div>

          {/* ── Placements grid ────────────────────────── */}
          <SectionHeader icon={BarChart3} label="Placements" />
          <div className="overflow-x-auto">
            {/* Sign header row */}
            <div className="flex items-center border-y bg-muted/30 min-w-[540px]">
              <div className="w-[72px] shrink-0 px-2 py-1.5" />
              <div className="flex-1 grid grid-cols-12 gap-0">
                {ZODIAC_SIGNS.map(s => (
                  <div key={s.name} className="flex flex-col items-center py-1">
                    <span className="text-sm leading-none">{s.symbol}</span>
                    <span className="text-[7px] text-muted-foreground/50 mt-0.5">{s.short}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Planet rows */}
            {FILTER_PLANETS.map(planetKey => {
              const pInfo = PLANETS[planetKey as keyof typeof PLANETS];
              const activeSign = placementMap.get(planetKey);
              return (
                <div key={planetKey} className="flex items-center border-b last:border-b-0 hover:bg-muted/20 transition-colors min-w-[540px]">
                  <div className="w-[72px] shrink-0 px-2 py-0.5 flex items-center gap-1.5">
                    <span className="text-base leading-none" style={{ color: pInfo?.color }}>{pInfo?.symbol}</span>
                    <span className="text-[10px] font-medium text-muted-foreground truncate">{pInfo?.name}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-12 gap-0">
                    {ZODIAC_SIGNS.map(s => {
                      const isActive = activeSign === s.name;
                      const elClasses = isActive ? ELEMENT_BG_ACTIVE[s.element] : ELEMENT_BG[s.element];
                      return (
                        <button
                          key={s.name}
                          onClick={() => togglePlacement(planetKey, s.name)}
                          className={`mx-auto my-0.5 w-7 h-7 md:w-8 md:h-8 rounded-lg border text-xs font-bold flex items-center justify-center transition-all ${elClasses} ${
                            isActive ? 'scale-110 shadow-sm ring-1 ring-offset-1 ring-offset-background' : 'opacity-30 hover:opacity-70 hover:scale-105'
                          }`}
                          title={`${pInfo?.name} in ${s.name}`}
                        >
                          {s.symbol}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-muted/20 border-t">
            <span className="text-[11px] text-muted-foreground">
              {activeCount === 0
                ? `${totalCount} chart${totalCount !== 1 ? 's' : ''}`
                : `${matchCount} of ${totalCount} match`
              }
            </span>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-[11px] text-muted-foreground hover:text-destructive transition-colors">
                  Clear all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 rounded-md text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Chart Tag Row (inline tag management on each card) ──────────────

function ChartTagRow({ chartId, tags, allTags, onAdd, onRemove }: {
  chartId: string;
  tags: string[];
  allTags: string[];
  onAdd: (chartId: string, tag: string) => void;
  onRemove: (chartId: string, tag: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAdd) inputRef.current?.focus();
  }, [showAdd]);

  useEffect(() => {
    if (!showAdd) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowAdd(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAdd]);

  const submit = () => {
    const val = input.trim().toLowerCase();
    if (!val) return;
    onAdd(chartId, val);
    setInput('');
    setShowAdd(false);
  };

  // Suggestions: tags that exist on other charts but not on this one
  const suggestions = allTags.filter(t => !tags.includes(t));

  return (
    <div className="flex flex-wrap items-center gap-1 mt-0.5" ref={containerRef} onClick={e => e.stopPropagation()}>
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-medium border border-violet-500/15">
          {t}
          <button onClick={() => onRemove(chartId, t)} className="hover:text-destructive ml-0.5">
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      {showAdd ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setShowAdd(false); }}
            placeholder="tag name"
            className="w-20 text-[10px] bg-background border rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {/* Quick suggestions */}
          {suggestions.length > 0 && !input && (
            <div className="absolute top-full left-0 mt-0.5 z-10 bg-popover border rounded-md shadow-md p-1 flex flex-wrap gap-0.5 max-w-[200px]">
              {suggestions.slice(0, 8).map(s => (
                <button
                  key={s}
                  onClick={() => { onAdd(chartId, s); setShowAdd(false); }}
                  className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-0.5 px-1 py-0 rounded text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          title="Add tag"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

// ─── Inline variant (used in Settings page, like SessionsList) ────────

interface SavedChartsInlineProps {
  onLoad?: (chart: SavedChart) => void;
  refreshKey?: number;
}

export function SavedChartsInline({ onLoad, refreshKey }: SavedChartsInlineProps) {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ChartFilters>(EMPTY_FILTERS);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || null;

  // Collect all unique tags across charts
  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const c of charts) for (const t of (c.tags || [])) s.add(t);
    return [...s].sort();
  }, [charts]);

  const filtered = useMemo(() => {
    let result = charts;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }
    if (hasActiveFilters(filters)) {
      result = result.filter(c => chartMatchesFilters(c, filters));
    }
    return result;
  }, [charts, search, filters]);

  // Tag management
  const handleAddTag = useCallback(async (chartId: string, tag: string) => {
    const chart = charts.find(c => c.id === chartId);
    if (!chart) return;
    const tags = [...new Set([...(chart.tags || []), tag])];
    await updateChartTags(chartId, tags, userId);
    setCharts(prev => prev.map(c => c.id === chartId ? { ...c, tags } : c));
  }, [charts, userId]);

  const handleRemoveTag = useCallback(async (chartId: string, tag: string) => {
    const chart = charts.find(c => c.id === chartId);
    if (!chart) return;
    const tags = (chart.tags || []).filter(t => t !== tag);
    await updateChartTags(chartId, tags, userId);
    setCharts(prev => prev.map(c => c.id === chartId ? { ...c, tags } : c));
  }, [charts, userId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSavedChartsAsync(userId).then((loaded) => {
      if (!cancelled) { setCharts(loaded); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [userId, refreshKey]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`Delete ${count} selected chart${count > 1 ? 's' : ''}?`)) return;
    setDeleting(true);
    await bulkDeleteSavedCharts([...selectedIds], userId);
    setCharts(prev => prev.filter(c => !selectedIds.has(c.id)));
    toast.success(`${count} chart${count > 1 ? 's' : ''} deleted`);
    setSelectedIds(new Set());
    setSelectMode(false);
    setDeleting(false);
  };

  const handleDelete = async (chart: SavedChart) => {
    if (!confirm(`Delete "${chart.name}"?`)) return;
    await deleteSavedChart(chart.id, userId);
    setCharts(prev => prev.filter(c => c.id !== chart.id));
    toast.success('Chart deleted');
  };

  const selectAllCheckbox = (
    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
      <input
        type="checkbox"
        checked={selectedIds.size === filtered.length && filtered.length > 0}
        onChange={(e) => {
          if (e.target.checked) setSelectedIds(new Set(filtered.map(c => c.id)));
          else setSelectedIds(new Set());
        }}
        className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
      />
      Select all
    </label>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          My Charts
          {(search || hasActiveFilters(filters)) && charts.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">{filtered.length} of {charts.length}</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {charts.length > 3 && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg border bg-muted/30">
              <Search className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-24 bg-transparent text-xs placeholder:text-muted-foreground/50 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-muted-foreground/50 hover:text-foreground p-0.5">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          {charts.length > 0 && (
            <button
              onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()); }}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${selectMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {selectMode ? 'Done' : 'Select'}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {charts.length > 0 && (
        <FilterPanel filters={filters} onChange={setFilters} matchCount={filtered.length} totalCount={charts.length} allTags={allTags} />
      )}

      {/* Select all at top */}
      {selectMode && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          {selectAllCheckbox}
          <Button
            size="sm"
            variant="destructive"
            disabled={selectedIds.size === 0 || deleting}
            onClick={handleBulkDelete}
            className="gap-1.5"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete {selectedIds.size > 0 ? `${selectedIds.size} selected` : ''}
          </Button>
        </div>
      )}

      {charts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No saved charts yet</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          No charts matching your {search ? 'search' : ''}{search && hasActiveFilters(filters) ? ' and ' : ''}{hasActiveFilters(filters) ? 'filters' : ''}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((chart) => (
            <div
              key={chart.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              onClick={selectMode ? () => toggleSelect(chart.id) : undefined}
            >
              {selectMode && (
                <button onClick={() => toggleSelect(chart.id)} className="shrink-0">
                  {selectedIds.has(chart.id)
                    ? <CheckSquare className="w-4 h-4 text-primary" />
                    : <Square className="w-4 h-4 text-muted-foreground/50" />
                  }
                </button>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${chart.chart_type === 'synastry' ? 'bg-pink-500' : 'bg-blue-500'}`} />
                  <span className="text-sm font-medium truncate">{chart.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  <span>{new Date(chart.created_at).toLocaleDateString()}</span>
                  <span className="opacity-40">&middot;</span>
                  <span>{chart.chart_type === 'synastry' ? 'Synastry' : 'Natal'}</span>
                  {chart.person_a_location && (
                    <>
                      <span className="opacity-40">&middot;</span>
                      <span className="truncate max-w-[120px]">{chart.person_a_location}</span>
                    </>
                  )}
                </div>
                {/* Tags */}
                <ChartTagRow chartId={chart.id} tags={chart.tags || []} allTags={allTags} onAdd={handleAddTag} onRemove={handleRemoveTag} />
                {/* Matched placements */}
                {filters.placements.length > 0 && chart.person_a_chart?.planets && (
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    {filters.placements.map(f => {
                      const p = chart.person_a_chart.planets[f.planet];
                      if (!p) return null;
                      const sign = p.sign || (p.longitude !== undefined ? getSignFromLongitude(p.longitude) : '');
                      const pInfo = PLANETS[f.planet as keyof typeof PLANETS];
                      const sInfo = ZODIAC_SIGNS.find(s => s.name.toLowerCase() === sign.toLowerCase());
                      const deg = p.longitude !== undefined ? Math.floor(p.longitude % 30) : null;
                      return (
                        <span key={f.planet} className="text-[10px] text-muted-foreground/80">
                          <span style={{ color: pInfo?.color }}>{pInfo?.symbol}</span>
                          {' '}{sInfo?.symbol} {deg !== null ? `${deg}°` : ''}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              {!selectMode && (
                <div className="flex items-center gap-1 shrink-0">
                  {onLoad && (
                    <button
                      onClick={() => onLoad(chart)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      title="Load chart"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(chart)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// ─── Modal variant (used in LandingPage, ChartSpotlight, etc.) ────────

interface SavedChartsListProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (chart: SavedChart) => void;
}

export function SavedChartsList({ isOpen, onClose, onLoad }: SavedChartsListProps) {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const userId = user?.id || null;

  const filtered = useMemo(() => {
    if (!search.trim()) return charts;
    const q = search.toLowerCase();
    return charts.filter(c => c.name.toLowerCase().includes(q));
  }, [charts, search]);

  useEffect(() => {
    if (!isOpen) { setSearch(''); return; }
    let cancelled = false;
    setLoading(true);
    getSavedChartsAsync(userId).then((loaded) => {
      if (!cancelled) {
        setCharts(loaded);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [isOpen, userId]);

  const handleDelete = async (id: string) => {
    await deleteSavedChart(id, userId);
    setCharts((prev) => prev.filter((c) => c.id !== id));
    toast.success('Chart deleted');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] bg-background rounded-xl shadow-2xl border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Saved Charts</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {charts.length > 0 && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30">
              <Search className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <input
                type="text"
                placeholder="Search charts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-muted-foreground/50 hover:text-foreground p-0.5">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : charts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No saved charts yet</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No charts matching "{search}"</p>
            </div>
          ) : (
            filtered.map((chart) => (
              <div
                key={chart.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  chart.chart_type === 'synastry' ? 'bg-pink-500/10' : 'bg-blue-500/10'
                }`}>
                  {chart.chart_type === 'synastry'
                    ? <Heart className="w-4 h-4 text-pink-500" />
                    : <BarChart3 className="w-4 h-4 text-blue-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{chart.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(chart.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' \u2022 '}
                    {chart.chart_type === 'synastry' ? 'Synastry' : 'Natal'}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => { onLoad(chart); onClose(); }}>
                    Load
                  </Button>
                  <button
                    onClick={() => handleDelete(chart.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
