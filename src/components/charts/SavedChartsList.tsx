import React, { useEffect, useState } from 'react';
import { Trash2, BarChart3, Heart, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getSavedChartsAsync, deleteSavedChart, type SavedChart } from './SaveChartButton';
import { useAuth } from '@/contexts/AuthContext';

interface SavedChartsListProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (chart: SavedChart) => void;
}

export function SavedChartsList({ isOpen, onClose, onLoad }: SavedChartsListProps) {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || null;

  useEffect(() => {
    if (!isOpen) return;
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
          ) : (
            charts.map((chart) => (
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
