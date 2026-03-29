import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useStockHistory(ticker: string, range = '1y') {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Get auth token for the edge function
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        // Use direct fetch instead of supabase.functions.invoke()
        // to avoid response parsing issues with larger payloads
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/stock-history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ ticker, range }),
        });

        if (cancelled) return;

        if (!resp.ok) {
          const text = await resp.text();
          setError(text || `HTTP ${resp.status}`);
          setCandles([]);
          return;
        }

        const data = await resp.json();
        if (cancelled) return;

        if (data.error) {
          setError(data.error);
          setCandles([]);
        } else {
          setCandles(data.candles || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch history');
          setCandles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [ticker, range]);

  return { candles, loading, error };
}
