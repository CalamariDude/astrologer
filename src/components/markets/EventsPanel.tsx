import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, ExternalLink, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { NewsArticle } from '@/hooks/useStockNews';

export interface MarketEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  url?: string;
  color?: string;
  source?: 'manual' | 'auto';
}

const STORAGE_PREFIX = 'markets-events-';
const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#ec4899'];

function getEvents(ticker: string): MarketEvent[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + ticker) || '[]'); }
  catch { return []; }
}

function saveEvents(ticker: string, events: MarketEvent[]) {
  localStorage.setItem(STORAGE_PREFIX + ticker, JSON.stringify(events));
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z');
  const db = new Date(b + 'T00:00:00Z');
  return Math.abs(Math.round((da.getTime() - db.getTime()) / 86400000));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

interface EventsPanelProps {
  ticker: string;
  manualEvents: MarketEvent[];
  onManualEventsChange: (events: MarketEvent[]) => void;
  selectedDate?: string;
  newsArticles: NewsArticle[];
  onFetchNews?: () => void;
  newsLoading?: boolean;
}

export function EventsPanel({
  ticker, manualEvents, onManualEventsChange, selectedDate,
  newsArticles = [], onFetchNews, newsLoading,
}: EventsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(selectedDate || '');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [showAllNews, setShowAllNews] = useState(false);

  const nearbyArticles = useMemo(() => {
    if (!selectedDate || newsArticles.length === 0) return [];
    return newsArticles.filter(a => daysBetween(a.date, selectedDate) <= 3);
  }, [newsArticles, selectedDate]);

  const displayedArticles = showAllNews ? nearbyArticles : nearbyArticles.slice(0, 6);
  const hasNews = newsArticles.length > 0;
  const aiLabel = nearbyArticles[0]?.ai_label;

  const handleAdd = () => {
    if (!title.trim() || !date) return;
    const event: MarketEvent = {
      id: crypto.randomUUID(),
      date,
      title: title.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      color,
    };
    const updated = [...manualEvents, event].sort((a, b) => b.date.localeCompare(a.date));
    saveEvents(ticker, updated);
    onManualEventsChange(updated);
    setTitle(''); setDate(selectedDate || ''); setDescription(''); setUrl('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = manualEvents.filter(e => e.id !== id);
    saveEvents(ticker, updated);
    onManualEventsChange(updated);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Events & News</h3>
          <div className="flex gap-1">
            {onFetchNews && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onFetchNews} disabled={newsLoading}>
                {newsLoading
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <RefreshCw className="w-3 h-3" />}
              </Button>
            )}
            <Button
              variant="ghost" size="sm" className="h-6 w-6 p-0"
              onClick={() => { setShowForm(!showForm); setDate(selectedDate || ''); }}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Selected date event header */}
        {selectedDate && hasNews && (
          <div className="px-4 py-3 border-b border-border/30 bg-blue-500/[0.04]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="text-xs text-muted-foreground">{formatDate(selectedDate)}</span>
            </div>
            {aiLabel && aiLabel !== 'Market Update' && aiLabel !== '—' ? (
              <h4 className="text-sm font-bold text-foreground leading-tight">{aiLabel}</h4>
            ) : (
              <h4 className="text-sm font-medium text-muted-foreground leading-tight">
                {nearbyArticles.length > 0 ? `${nearbyArticles.length} articles` : 'No notable events'}
              </h4>
            )}
            {nearbyArticles.length > 0 && aiLabel && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {nearbyArticles.length} article{nearbyArticles.length !== 1 ? 's' : ''} near this date
              </p>
            )}
          </div>
        )}

        <div className="px-4 py-3 space-y-3">
          {/* Add manual note form */}
          {showForm && (
            <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Date *</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Color</Label>
                  <div className="flex gap-1">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className="w-5 h-5 rounded-full border-2 transition-all"
                        style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Earnings report" className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional notes" className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">URL</Label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="h-7 text-xs" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs" disabled={!title.trim() || !date} onClick={handleAdd}>Save</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* News articles */}
          {hasNews && nearbyArticles.length > 0 && (
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
              {displayedArticles.map((a, i) => (
                <a
                  key={`news-${i}-${a.date}`}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 rounded-lg border border-border/30 hover:border-blue-500/40 hover:bg-blue-500/[0.03] transition-all duration-150 cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5">
                    {a.image && (
                      <img
                        src={a.image}
                        alt=""
                        className="w-12 h-12 rounded object-cover shrink-0 bg-muted"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                        {a.title}
                      </p>
                      {a.summary && (
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{a.summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/80 text-muted-foreground">{a.source}</span>
                        <span className="text-[9px] text-muted-foreground/50">{a.date}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/30 group-hover:text-blue-400 ml-auto transition-colors" />
                      </div>
                    </div>
                  </div>
                </a>
              ))}
              {nearbyArticles.length > 6 && (
                <button
                  onClick={() => setShowAllNews(!showAllNews)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1.5"
                >
                  {showAllNews ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showAllNews ? 'Show less' : `Show all ${nearbyArticles.length} articles`}
                </button>
              )}
            </div>
          )}

          {/* Empty states */}
          {hasNews && nearbyArticles.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              No articles near this date. Click an event pill or hover a dot on the chart.
            </p>
          )}

          {!hasNews && !showForm && manualEvents.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              News loads automatically. Hover chart dots or click event pills to explore.
            </p>
          )}

          {/* Manual notes */}
          {manualEvents.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border/30">
              <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Notes</span>
              {manualEvents.map(e => (
                <div key={e.id} className="flex items-start gap-2 group text-xs">
                  <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: e.color || '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground/60 text-[10px]">{e.date}</span>
                      <span className="font-medium truncate">{e.title}</span>
                      {e.url && (
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    {e.description && <p className="text-muted-foreground/60 truncate text-[10px]">{e.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function loadEvents(ticker: string): MarketEvent[] {
  return getEvents(ticker);
}
