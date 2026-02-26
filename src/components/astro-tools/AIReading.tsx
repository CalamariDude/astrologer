/**
 * AI Reading
 * AI-powered chart interpretation using xAI/Grok
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Sparkles, Send, Loader2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { supabase } from '@/lib/supabase';

interface NatalChart {
  planets: Record<string, any>;
  houses?: Record<string, number>;
  angles?: { ascendant: number; midheaven: number };
}

interface AIReadingProps {
  chartA: NatalChart;
  chartB?: NatalChart;
  nameA: string;
  nameB?: string;
}

type ReadingFocus = 'personA' | 'personB' | 'synastry';

const NATAL_QUESTIONS = [
  'What are my greatest strengths?',
  'What challenges should I be aware of?',
  'What does my career path look like?',
  'How do I approach relationships?',
  'What is my life purpose?',
  'What hidden talents do I have?',
];

const SYNASTRY_QUESTIONS = [
  'What is the strongest connection between us?',
  'What are the main challenges in this relationship?',
  'How can we grow together?',
  'What attracts us to each other?',
];

export function AIReading({ chartA, chartB, nameA, nameB }: AIReadingProps) {
  const { user } = useAuth();
  const { isPaid, aiCreditsRemaining, aiCreditsLimit, useAiCredit } = useSubscription();
  const [question, setQuestion] = useState('');
  const [reading, setReading] = useState('');
  const [chartSummary, setChartSummary] = useState('');
  const [showChartData, setShowChartData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const hasTwoCharts = !!chartB && !!nameB;
  const [readingFocus, setReadingFocus] = useState<ReadingFocus>(hasTwoCharts ? 'synastry' : 'personA');

  const suggestions = useMemo(() => {
    if (readingFocus === 'synastry') return SYNASTRY_QUESTIONS;
    return NATAL_QUESTIONS;
  }, [readingFocus]);

  const focusLabel = useMemo(() => {
    if (readingFocus === 'synastry') return `${nameA} & ${nameB}`;
    if (readingFocus === 'personB') return nameB || 'Person B';
    return nameA || 'Person A';
  }, [readingFocus, nameA, nameB]);

  const handleSubmit = useCallback(async (q?: string) => {
    const userQuestion = q || question;

    if (!user) {
      setShowAuth(true);
      return;
    }

    if (aiCreditsRemaining <= 0) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('astrologer-ai-reading', {
        body: {
          chartData: chartA,
          chartDataB: hasTwoCharts ? chartB : undefined,
          question: userQuestion || undefined,
          personName: nameA,
          personNameB: hasTwoCharts ? nameB : undefined,
          readingFocus,
        },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.error === 'credit_limit') {
        setError(data.message);
        return;
      }

      if (data?.error) throw new Error(data.error);

      setReading(data.reading);
      setChartSummary(data.chartSummary || '');
      await useAiCredit();
      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate reading');
    } finally {
      setLoading(false);
    }
  }, [question, user, aiCreditsRemaining, chartA, chartB, nameA, nameB, hasTwoCharts, readingFocus, useAiCredit]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Chart Reading
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-powered interpretation for {focusLabel}
          </p>
        </div>
        {user && (
          <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
            {aiCreditsRemaining}/{aiCreditsLimit} readings left
          </div>
        )}
      </div>

      {/* Reading Focus Selector (only when two charts are loaded) */}
      {hasTwoCharts && (
        <div className="flex items-center gap-1.5">
          {([
            { value: 'personA' as ReadingFocus, label: nameA || 'Person A' },
            { value: 'personB' as ReadingFocus, label: nameB || 'Person B' },
            { value: 'synastry' as ReadingFocus, label: 'Synastry' },
          ]).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setReadingFocus(value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                readingFocus === value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
            placeholder={
              readingFocus === 'synastry'
                ? 'Ask about this relationship...'
                : `Ask about ${readingFocus === 'personB' ? (nameB || 'Person B') : (nameA || 'this chart')}... (or leave empty for a general reading)`
            }
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={loading}
          />
          <Button
            onClick={() => handleSubmit()}
            disabled={loading}
            size="sm"
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : !user ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {loading ? 'Reading...' : !user ? 'Sign In' : 'Get Reading'}
          </Button>
        </div>

        {/* Credit warning for free users */}
        {user && !isPaid && aiCreditsRemaining > 0 && aiCreditsRemaining <= 3 && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            {aiCreditsRemaining} free reading{aiCreditsRemaining !== 1 ? 's' : ''} remaining this month. Upgrade to Pro for 1,000/month.
          </p>
        )}

        {/* No credits left */}
        {user && aiCreditsRemaining <= 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
            <span>You've used all your AI readings this month.</span>
            {!isPaid && (
              <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setShowUpgrade(true)}>
                Upgrade
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {!reading && !loading && (
        <div>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Suggested questions
            {showSuggestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showSuggestions && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuestion(q); handleSubmit(q); }}
                  disabled={loading}
                  className="px-2.5 py-1.5 text-[11px] rounded-full border border-border hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-xl border bg-card/50 p-5 space-y-3 animate-pulse">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            Generating your reading...
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-muted/60 rounded w-full" />
            <div className="h-3 bg-muted/60 rounded w-11/12" />
            <div className="h-3 bg-muted/60 rounded w-10/12" />
            <div className="h-3 bg-muted/40 rounded w-8/12" />
            <div className="h-6" />
            <div className="h-3 bg-muted/60 rounded w-full" />
            <div className="h-3 bg-muted/60 rounded w-10/12" />
            <div className="h-3 bg-muted/40 rounded w-9/12" />
          </div>
        </div>
      )}

      {/* Reading Result */}
      {reading && !loading && (
        <div className="rounded-xl border bg-card/50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Reading — {focusLabel}
          </div>
          <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {reading}
          </div>
          {/* Chart data used for this reading */}
          {chartSummary && (
            <div>
              <button
                onClick={() => setShowChartData(!showChartData)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Chart data used
                {showChartData ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showChartData && (
                <pre className="mt-2 p-3 rounded-lg bg-muted/40 text-[10px] leading-relaxed text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {chartSummary.replace(/\*\*/g, '')}
                </pre>
              )}
            </div>
          )}
          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Powered by AI — for entertainment and self-reflection</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px]"
              onClick={() => { setReading(''); setChartSummary(''); setQuestion(''); }}
            >
              New Reading
            </Button>
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
