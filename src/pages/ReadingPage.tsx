/**
 * ReadingPage — Public shareable reading page
 * /reading/:readingId
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ChevronRight, Share2, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { INSIGHT_MODULE_LIST, getInsightModule } from '@/lib/insights/modules';
import { toast } from 'sonner';

const BiWheelMobileWrapper = lazy(() => import('@/components/biwheel/BiWheelMobileWrapper'));

interface Reading {
  id: string;
  module_id: string;
  module_title: string;
  reading_text: string;
  technical_text: string | null;
  chart_data: any;
  birth_data: any;
  created_at: string;
}

export default function ReadingPage() {
  const { readingId } = useParams<{ readingId: string }>();
  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!readingId) return;

    async function fetchReading() {
      const { data, error } = await supabase
        .from('insight_readings')
        .select('*')
        .eq('id', readingId)
        .single();

      if (error || !data) {
        setError('Reading not found');
      } else {
        setReading(data as Reading);
        document.title = `${data.module_title || 'Reading'} — Astrologer`;
      }
      setLoading(false);
    }

    fetchReading();
  }, [readingId]);

  const handleShare = async () => {
    const url = `${window.location.origin}/reading/${readingId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `My ${reading?.module_title} Reading`, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0b17] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#6b5a80]" />
      </div>
    );
  }

  if (error || !reading) {
    return (
      <div className="min-h-screen bg-[#0f0b17] flex items-center justify-center text-center px-4">
        <div className="space-y-4">
          <h1 className="text-xl text-[#e8e0f0]" style={{ fontFamily: "'Georgia', serif" }}>Reading not found</h1>
          <p className="text-[14px] text-[#6b5e7a]">This link may have expired or doesn't exist.</p>
          <Link to="/">
            <Button variant="outline" className="border-[#2a2235] text-[#9a8daa] hover:bg-[#1a1520]">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const mod = getInsightModule(reading.module_id);

  return (
    <div className="min-h-screen text-[#e8e0f0]" style={{ background: 'linear-gradient(180deg, #13101b 0%, #0f0b17 30%, #0f0b17 100%)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#13101b]/70 backdrop-blur-xl border-b border-[#1e1929]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="text-[15px] tracking-[0.15em] uppercase"
            style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300, color: '#9a8daa' }}
          >
            Astrologer
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-[13px] text-[#6b5e7a] hover:text-[#9a8daa] transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-[600px] mx-auto space-y-8">
          {/* Title */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e1929] border border-[#2a2235] text-[12px] text-[#8a7d96] uppercase tracking-[0.15em] mb-4">
              {reading.module_title || 'Reading'}
            </div>
          </div>

          {/* Chart */}
          {reading.chart_data && (
            <div className="rounded-xl overflow-hidden" style={{ background: '#0f0b17' }}>
              <Suspense fallback={
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#4a4255]" />
                </div>
              }>
                <BiWheelMobileWrapper
                  chartA={reading.chart_data}
                  chartB={reading.chart_data}
                  nameA=""
                  nameB=""
                  readOnly
                  initialChartMode="personA"
                  initialShowHouses
                  initialShowDegreeMarkers
                  initialStraightAspects
                  initialShowEffects={false}
                  initialTheme="classic"
                  initialVisiblePlanets={new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','northnode','chiron','ascendant','midheaven'])}
                />
              </Suspense>
            </div>
          )}

          {/* Reading text */}
          <div className="space-y-6">
            {reading.reading_text.split('\n\n').map((paragraph, i) => (
              paragraph.trim() ? (
                <p
                  key={i}
                  className="text-[16px] leading-[1.8]"
                  style={{ color: '#b8a9cc', fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  {paragraph}
                </p>
              ) : null
            ))}
          </div>

          {/* Share button */}
          <div className="text-center pt-4">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e1929] border border-[#2a2235] text-[13px] text-[#8a7d96] hover:text-[#b8a9cc] hover:border-[#3a3345] transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Share This Reading
            </button>
          </div>

          {/* CTA: Get your own */}
          <div className="pt-6">
            <div className="h-px bg-gradient-to-r from-transparent via-[#2a2235] to-transparent mb-8" />
            <div className="text-center space-y-4">
              <p
                className="text-[22px] tracking-tight"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: '#e8e0f0' }}
              >
                Get your own reading
              </p>
              <p className="text-[14px] text-[#6b5e7a]">Enter your birth date and discover what the stars say about you.</p>
              <Link to={mod ? `/insight/${mod.slug}` : '/insight/future-partner'}>
                <Button
                  className="h-12 px-8 rounded-xl text-[15px] font-semibold border-0"
                  style={{ background: 'linear-gradient(135deg, #8b6cc1 0%, #c06c84 50%, #d4a574 100%)', color: '#fff' }}
                >
                  Start My Reading
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Other modules */}
          <div className="pt-4">
            <div className="h-px bg-gradient-to-r from-transparent via-[#2a2235] to-transparent mb-6" />
            <p className="text-[12px] text-[#4a4255] uppercase tracking-[0.2em] text-center mb-4">More readings</p>
            <div className="grid grid-cols-3 gap-3">
              {INSIGHT_MODULE_LIST.filter(m => m.id !== reading.module_id).slice(0, 3).map(m => (
                <Link
                  key={m.id}
                  to={`/insight/${m.slug}`}
                  className="py-4 px-3 rounded-xl bg-[#13101b] border border-[#1e1929] hover:border-[#2a2235] transition-colors text-center group"
                >
                  <div className="text-[12px] text-[#6b5e7a] group-hover:text-[#9a8daa] transition-colors leading-tight">{m.title}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1e1929]/40 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[12px] tracking-[0.12em] uppercase text-[#3a3345]">Astrologer</span>
          <div className="flex gap-6 text-[12px] text-[#3a3345]">
            <Link to="/terms" className="hover:text-[#6b5e7a] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#6b5e7a] transition-colors">Privacy</Link>
            <Link to="/support" className="hover:text-[#6b5e7a] transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
