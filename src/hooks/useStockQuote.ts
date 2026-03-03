import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface StockQuote {
  ticker: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  marketCap: number | null;
  volume: number | null;
  avgVolume: number | null;
  open: number | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  pe: number | null;
  forwardPe: number | null;
  eps: number | null;
  dividend: number | null;
  beta: number | null;
  marketState: string | null;
}

export function useStockQuote(ticker: string) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    // Skip crypto tickers that don't have traditional stock stats
    const isCrypto = ticker === 'BTCUSD' || ticker === 'ETHUSD';

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase.functions.invoke('stock-quote', { body: { ticker } })
      .then(({ data, error: fnError }) => {
        if (cancelled) return;
        if (fnError) {
          setError(fnError.message);
          setQuote(null);
        } else if (data?.error) {
          setError(data.error);
          setQuote(null);
        } else {
          setQuote(data as StockQuote);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch quote');
          setQuote(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ticker]);

  return { quote, loading, error };
}
