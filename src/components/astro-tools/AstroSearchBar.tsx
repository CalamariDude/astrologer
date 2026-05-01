import { useState, useCallback, useRef } from 'react';
import { Search, Loader2, X, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { parseIntent } from '@/lib/astroSearch/parseIntent';
import { resolveIntent } from '@/lib/astroSearch/resolveIntent';
import type { Intent, ResolvedHit } from '@/lib/astroSearch/types';
import type { NatalChart } from '@/components/biwheel/types';

interface AstroSearchBarProps {
  natalChart?: NatalChart;
  onHit?: (hit: ResolvedHit) => void;
  placeholder?: string;
  className?: string;
}

const SUGGESTIONS = [
  'when is moon in scorpio next',
  'next full moon',
  'when does mercury go retrograde',
  'next saturn square my sun',
];

async function parseViaLLM(query: string): Promise<Intent | null> {
  const { data, error } = await supabase.functions.invoke('astrologer-parse-astro-query', {
    body: { query },
  });
  if (error || !data?.intent) return null;
  return data.intent as Intent;
}

export function AstroSearchBar({ natalChart, onHit, placeholder, className }: AstroSearchBarProps) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [hit, setHit] = useState<ResolvedHit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setBusy(true);
    setError(null);
    setHit(null);
    try {
      let intent = parseIntent(q);
      if (!intent) intent = await parseViaLLM(q);
      if (!intent || intent.kind === 'unsupported') {
        setError(intent?.kind === 'unsupported' ? intent.reason : 'Try a query like "when is moon in scorpio next".');
        return;
      }
      const resolved = await resolveIntent(intent, natalChart);
      if (!resolved || !resolved.date) {
        setError(resolved?.summary || 'No match found in the next 8 years.');
        return;
      }
      setHit(resolved);
      onHit?.(resolved);
    } catch (e: any) {
      setError(e?.message || 'Search failed.');
    } finally {
      setBusy(false);
    }
  }, [natalChart, onHit]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    runSearch(query);
  };

  const clear = () => {
    setQuery('');
    setHit(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? 'Ask the timeline… e.g. "when is moon in scorpio next"'}
          className="w-full h-10 pl-9 pr-20 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
          disabled={busy}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && !busy && (
            <button type="button" onClick={clear} className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground" aria-label="Clear">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {busy && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </form>

      {!hit && !error && !busy && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { setQuery(s); runSearch(s); }}
              className="text-[11px] px-2 py-0.5 rounded-full border bg-muted/30 text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {hit && (
        <div className="mt-2 flex items-center gap-3 px-3 py-2 rounded-xl border bg-primary/5 border-primary/20">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{hit.summary}</div>
            <div className="text-[11px] text-muted-foreground">{hit.date}</div>
          </div>
          <button onClick={clear} className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground" aria-label="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 px-3 py-2 rounded-xl border bg-destructive/5 border-destructive/20 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
