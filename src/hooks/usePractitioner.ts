import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Practitioner } from './usePractitioners';

export function usePractitioner(slug: string | undefined) {
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('practitioners')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setPractitioner(data);
        }
        setLoading(false);
      });
  }, [slug]);

  return { practitioner, loading, notFound };
}
