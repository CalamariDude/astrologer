import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Practitioner {
  id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  specialties: string[];
  years_experience: number | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  currency: string;
  booking_url: string | null;
  website_url: string | null;
  instagram_handle: string | null;
  twitter_handle: string | null;
  tiktok_handle: string | null;
  youtube_url: string | null;
  linktree_url: string | null;
  location: string | null;
  timezone: string | null;
  languages: string[];
  offers_virtual: boolean;
  offers_in_person: boolean;
  is_featured: boolean;
  is_verified: boolean;
}

interface Filters {
  specialty?: string;
  priceMax?: number;
  virtual?: boolean;
  inPerson?: boolean;
}

export function usePractitioners(filters?: Filters) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('practitioners')
        .select('id, slug, display_name, headline, bio, photo_url, specialties, years_experience, hourly_rate_min, hourly_rate_max, currency, booking_url, website_url, instagram_handle, twitter_handle, tiktok_handle, youtube_url, linktree_url, location, timezone, languages, offers_virtual, offers_in_person, is_featured, is_verified')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true });

      if (filters?.specialty) {
        query = query.contains('specialties', [filters.specialty]);
      }
      if (filters?.priceMax) {
        query = query.lte('hourly_rate_min', filters.priceMax);
      }
      if (filters?.virtual) {
        query = query.eq('offers_virtual', true);
      }
      if (filters?.inPerson) {
        query = query.eq('offers_in_person', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPractitioners(data || []);
    } catch (err) {
      console.error('Error loading practitioners:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.specialty, filters?.priceMax, filters?.virtual, filters?.inPerson]);

  useEffect(() => { fetch(); }, [fetch]);

  return { practitioners, loading, refresh: fetch };
}
