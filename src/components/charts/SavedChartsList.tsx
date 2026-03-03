import React, { useEffect, useState, useMemo } from 'react';
import { Trash2, BarChart3, Heart, X, Loader2, Search, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getSavedChartsAsync, deleteSavedChart, bulkDeleteSavedCharts, type SavedChart } from './SaveChartButton';
import { useAuth } from '@/contexts/AuthContext';

// ─── Inline variant (used in Settings page, like SessionsList) ────────

interface SavedChartsInlineProps {
  onLoad?: (chart: SavedChart) => void;
}

export function SavedChartsInline({ onLoad }: SavedChartsInlineProps) {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || null;

  const filtered = useMemo(() => {
    if (!search.trim()) return charts;
    const q = search.toLowerCase();
    return charts.filter(c => c.name.toLowerCase().includes(q));
  }, [charts, search]);

  useEffect(() => {
    let cancelled = false;
    getSavedChartsAsync(userId).then((loaded) => {
      if (!cancelled) { setCharts(loaded); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [userId]);

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
        <h2 className="text-sm font-semibold">My Charts</h2>
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
        <p className="text-xs text-muted-foreground text-center py-6">No charts matching "{search}"</p>
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
                </div>
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
