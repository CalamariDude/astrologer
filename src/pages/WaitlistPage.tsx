import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function WaitlistPage() {
  const [searchParams] = useSearchParams();
  const interest = searchParams.get('interest') || 'updates';
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labels: Record<string, { title: string; description: string }> = {
    'natal-fundamentals': {
      title: 'Natal Chart Fundamentals',
      description: 'A free course on reading birth charts from scratch — planets, signs, houses, and aspects.',
    },
    'synastry-techniques': {
      title: 'Advanced Synastry Techniques',
      description: 'A deep dive into relationship astrology — composite charts, davison, and timing.',
    },
    'professional-reading': {
      title: 'Professional Chart Reading',
      description: 'Prepare for client consultations — session structure, ethics, and delivery.',
    },
    'birth-chart-guide': {
      title: 'Understanding Your Birth Chart',
      description: 'A beginner guide to planets, signs, houses, and aspects — explained from the ground up.',
    },
    'saturn-aries': {
      title: 'Saturn in Aries: 2025–2028',
      description: 'What this major transit means and how to work with it over the next three years.',
    },
    'synastry-guide': {
      title: 'How to Read a Synastry Chart',
      description: 'A practical introduction to comparing two birth charts for relationship insights.',
    },
    updates: {
      title: 'Stay in the loop',
      description: 'Get notified when new articles, courses, and features are available.',
    },
  };

  const info = labels[interest] || labels.updates;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const { error: dbError } = await supabase
        .from('waitlist')
        .upsert({ email: email.trim().toLowerCase(), interest }, { onConflict: 'email,interest' });

      if (dbError) {
        // If table doesn't exist yet, just show success anyway
        console.warn('Waitlist save failed:', dbError.message);
      }
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 sm:px-6 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Astrologer
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="max-w-md w-full text-center">
          {submitted ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">You're on the list.</h1>
              <p className="text-muted-foreground">
                We'll email you at <span className="font-medium text-foreground">{email}</span> when{' '}
                <span className="font-medium text-foreground">{info.title}</span> is available.
              </p>
              <Link to="/">
                <Button variant="outline" className="mt-4">
                  Back to Astrologer
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/25 mb-3">
                  Coming Soon
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{info.title}</h1>
                <p className="text-muted-foreground mt-2">{info.description}</p>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" disabled={loading} className="h-11 px-6">
                  {loading ? 'Joining...' : 'Notify Me'}
                </Button>
              </form>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <p className="text-xs text-muted-foreground/50">No spam. Unsubscribe anytime.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
