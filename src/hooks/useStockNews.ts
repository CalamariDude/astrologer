import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface NewsArticle {
  date: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  ai_label?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useStockNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (ticker: string, from?: string, to?: string) => {
    if (!ticker) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/stock-news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ ticker, from, to }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        setError(text || `HTTP ${resp.status}`);
        setArticles([]);
        return;
      }

      const data = await resp.json();
      if (data.error) {
        setError(data.error);
        setArticles([]);
      } else {
        setArticles(data.articles || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch news');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearNews = useCallback(() => {
    setArticles([]);
    setError(null);
  }, []);

  return { articles, loading, error, fetchNews, clearNews };
}
