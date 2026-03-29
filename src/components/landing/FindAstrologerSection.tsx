import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useFadeIn } from '@/hooks/useFadeIn';
import { PractitionerCard } from '@/components/practitioners/PractitionerCard';
import type { Practitioner } from '@/hooks/usePractitioners';

export function FindAstrologerSection() {
  const fade = useFadeIn();
  const [featured, setFeatured] = useState<Practitioner[]>([]);

  useEffect(() => {
    supabase
      .from('practitioners')
      .select('id, slug, display_name, headline, bio, photo_url, specialties, years_experience, hourly_rate_min, hourly_rate_max, currency, booking_url, website_url, instagram_handle, twitter_handle, tiktok_handle, youtube_url, linktree_url, location, timezone, languages, offers_virtual, offers_in_person, is_featured, is_verified')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) setFeatured(data);
      });
  }, []);

  if (featured.length === 0) return null;

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 bg-background border-t border-border/30">
      <div ref={fade.ref} style={fade.style} className={`max-w-6xl mx-auto ${fade.className}`}>
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 text-amber-500/80">
            Directory
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Find Your Astrologer
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mt-3 max-w-lg mx-auto">
            Browse professional astrologers and book a personal reading.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map(p => (
            <PractitionerCard key={p.id} p={p} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/astrologers" className="inline-flex items-center gap-1.5 text-sm text-amber-500/60 hover:text-amber-600 transition-colors">
            Browse All Astrologers <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
