/**
 * AI Reading
 * AI-powered chart interpretation using vantage tree methodology
 * Builds structured trees client-side, sends to edge function for deep analysis
 */

import React, { useState, useCallback, useMemo, Fragment } from 'react';
import { Sparkles, Send, Loader2, Lock, ChevronDown, ChevronUp, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { supabase } from '@/lib/supabase';
import { buildTreesForQuestion, buildCompactChartSummary } from '@/lib/chartReading/buildVantageTree';
import { DEFAULT_PARAMS } from '@/lib/chartReading/types';
import type { NatalChart, ChartReadingTree } from '@/lib/chartReading/types';

interface AIReadingProps {
  chartA: NatalChart;
  chartB?: NatalChart;
  nameA: string;
  nameB?: string;
}

type ReadingFocus = 'personA' | 'personB' | 'synastry';

const SEPARATOR = '---TECHNICAL---';

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

// ─── Expandable Tree Viewer ──────────────────────────────────────

function TreeNode({ label, children, defaultOpen = false, badge }: {
  label: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!children;
  return (
    <div>
      <button
        onClick={() => hasChildren && setOpen(!open)}
        className={`flex items-center gap-1 w-full text-left text-[11px] py-0.5 ${hasChildren ? 'hover:text-foreground cursor-pointer' : 'cursor-default'} ${open ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {hasChildren ? (
          <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        ) : (
          <span className="w-3" />
        )}
        <span className="truncate">{label}</span>
        {badge && <span className="ml-auto text-[9px] bg-muted/60 px-1.5 py-0.5 rounded shrink-0">{badge}</span>}
      </button>
      {open && hasChildren && <div className="ml-4 border-l border-border/30 pl-1">{children}</div>}
    </div>
  );
}

function VantageTreeViewer({ trees }: { trees: ChartReadingTree[] }) {
  return (
    <div className="space-y-1 font-mono">
      {trees.map((tree, ti) => (
        <TreeNode
          key={ti}
          label={
            <span>
              {tree.derived ? <span className="text-blue-500">{tree.derived.label}</span> : <span>Natal</span>}
              {' '}
              <span className="text-muted-foreground">({tree.category})</span>
            </span>
          }
          badge={`${tree.vantages.length} vantages`}
          defaultOpen={ti === 0}
        >
          <TreeNode label={<span className="text-amber-600 dark:text-amber-400">Rising: {tree.rising_sign}</span>} />
          {tree.vantages.map((v, vi) => {
            const p = v.planet;
            const rx = p.retrograde ? ' ℞' : '';
            return (
              <TreeNode
                key={vi}
                label={
                  <span>
                    <span className="font-semibold">{p.planet}</span>
                    {' '}{Math.floor(p.longitude % 30)}° {p.sign} H{p.house}{rx}
                  </span>
                }
                badge={`${p.aspects.length} asp`}
              >
                {/* Layers */}
                {p.spark && <TreeNode label={<span>Spark: <span className="text-purple-500">{p.spark.sign}</span></span>} />}
                {p.decan && <TreeNode label={<span>Decan {p.decan.number}: <span className="text-cyan-500">{p.decan.sign}</span></span>} />}
                {p.fusion_cusp && <TreeNode label={<span className="text-orange-500">Fusion cusp H{p.fusion_cusp.from_house}–H{p.fusion_cusp.to_house}</span>} />}
                {p.retrograde_house && <TreeNode label={<span className="text-red-400">House ruler retrograde</span>} />}

                {/* Aspects */}
                {p.aspects.length > 0 && (
                  <TreeNode label="Aspects" badge={`${p.aspects.length}`}>
                    {p.aspects.map((a, ai) => (
                      <TreeNode
                        key={ai}
                        label={
                          <span>
                            {a.symbol} {a.name} {a.target}{' '}
                            <span className="text-muted-foreground">
                              {a.orb.toFixed(1)}° {a.forced ? '(forced)' : ''} {a.energy_flow}
                            </span>
                          </span>
                        }
                      />
                    ))}
                  </TreeNode>
                )}

                {/* Forward Trace */}
                {v.forward_trace.house_ruler && (
                  <TreeNode label={<span>Forward: {v.forward_trace.house_sign} → ruled by <span className="font-semibold">{v.forward_trace.house_ruler}</span></span>}>
                    {v.forward_trace.ruler_position && (
                      <TreeNode label={<span>{v.forward_trace.house_ruler} in {v.forward_trace.ruler_position.sign} H{v.forward_trace.ruler_position.house}</span>}>
                        {v.forward_trace.next?.house_ruler && (
                          <TreeNode label={<span>→ {v.forward_trace.next.house_sign} → {v.forward_trace.next.house_ruler}</span>} />
                        )}
                      </TreeNode>
                    )}
                  </TreeNode>
                )}

                {/* Backward Trace */}
                {v.backward_trace.ruled_signs.length > 0 && (
                  <TreeNode label={<span>Backward: rules {v.backward_trace.ruled_signs.join(', ')}</span>}>
                    {v.backward_trace.source_houses.map((sh, si) => (
                      <TreeNode
                        key={si}
                        label={<span>H{sh.house} ({sh.sign_on_cusp}){sh.planets_in_house.length > 0 ? ` — ${sh.planets_in_house.map(pp => pp.planet).join(', ')}` : ' — empty'}</span>}
                      />
                    ))}
                  </TreeNode>
                )}

                {/* Co-tenants */}
                {v.co_tenants.length > 0 && (
                  <TreeNode label={<span>Co-tenants: {v.co_tenants.map(c => c.planet).join(', ')}</span>} />
                )}
              </TreeNode>
            );
          })}
        </TreeNode>
      ))}
    </div>
  );
}

export function AIReading({ chartA, chartB, nameA, nameB }: AIReadingProps) {
  const { user } = useAuth();
  const { isPaid, aiCreditsRemaining, aiCreditsLimit, useAiCredit } = useSubscription();
  const [question, setQuestion] = useState('');
  const [reading, setReading] = useState('');
  const [technical, setTechnical] = useState('');
  const [showTechnical, setShowTechnical] = useState(false);
  const [treeData, setTreeData] = useState<ChartReadingTree[]>([]);
  const [showTreeData, setShowTreeData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(4);
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
    const userQuestion = q || question || 'Give me a comprehensive chart reading';

    if (!user) {
      setShowAuth(true);
      return;
    }

    if (aiCreditsRemaining <= 0) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setLoadingStep(0);
    setLoadingTotal(4);
    setLoadingPhase('Building vantage tree from chart data...');
    setError(null);

    try {
      // Step 1: Build vantage trees client-side
      let trees: ChartReadingTree[] = [];
      let treesB: ChartReadingTree[] | undefined;

      if (readingFocus === 'personB' && chartB) {
        trees = buildTreesForQuestion(chartB as NatalChart, userQuestion, DEFAULT_PARAMS);
      } else if (readingFocus === 'synastry' && chartB) {
        trees = buildTreesForQuestion(chartA as NatalChart, userQuestion, DEFAULT_PARAMS);
        treesB = buildTreesForQuestion(chartB as NatalChart, userQuestion, DEFAULT_PARAMS);
      } else {
        trees = buildTreesForQuestion(chartA as NatalChart, userQuestion, DEFAULT_PARAMS);
      }

      const allTrees = [...trees, ...(treesB || [])];
      const totalVantages = allTrees.reduce((n, t) => n + t.vantages.length, 0);
      setTreeData(allTrees);

      // Step 2: Mapping energy patterns
      setLoadingStep(1);
      setLoadingTotal(totalVantages + 2); // vantages + tree build + synthesis
      setLoadingPhase(`Mapping ${totalVantages} energy centers across your chart...`);

      // Simulate brief pause so user sees tree-building step
      await new Promise(r => setTimeout(r, 400));

      // Step 3: Deep analysis (server-side)
      setLoadingStep(2);
      setLoadingPhase(`Deep-analyzing ${totalVantages} planetary vantage points...`);

      const { data, error: fnError } = await supabase.functions.invoke('astrologer-ai-reading', {
        body: {
          trees,
          treesB: treesB || undefined,
          question: userQuestion,
          readingFocus,
          personName: nameA,
          personNameB: hasTwoCharts ? nameB : undefined,
        },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.error === 'credit_limit') {
        setError(data.message);
        return;
      }
      if (data?.error) throw new Error(data.error);

      // Mark synthesis complete
      setLoadingStep(loadingTotal);
      setLoadingPhase('Finalizing your reading...');

      // Split reading and technical sections
      const fullText = data.reading || '';
      const sepIdx = fullText.indexOf(SEPARATOR);
      if (sepIdx !== -1) {
        setReading(fullText.substring(0, sepIdx).trim());
        setTechnical(fullText.substring(sepIdx + SEPARATOR.length).trim());
      } else {
        setReading(fullText);
        setTechnical('');
      }

      await useAiCredit();
      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate reading');
    } finally {
      setLoading(false);
      setLoadingPhase('');
    }
  }, [question, user, aiCreditsRemaining, chartA, chartB, nameA, nameB, hasTwoCharts, readingFocus, useAiCredit]);

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Chart Reading
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deep vantage-tree analysis for {focusLabel}
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

      {/* Loading with progress */}
      {loading && (
        <div className="rounded-xl border bg-card/50 p-5 space-y-4">
          {/* Phase label */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            {loadingPhase || 'Generating your reading...'}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(((loadingStep + 1) / (loadingTotal + 1)) * 100, 95)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Step {loadingStep + 1} of {loadingTotal + 1}</span>
              <span className="tabular-nums">{Math.round(Math.min(((loadingStep + 1) / (loadingTotal + 1)) * 100, 95))}%</span>
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="space-y-1.5 text-[11px] text-muted-foreground">
            <div className={`flex items-center gap-2 ${loadingStep >= 0 ? 'text-foreground' : ''}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${loadingStep > 0 ? 'bg-green-500/20 text-green-600 dark:text-green-400' : loadingStep === 0 ? 'bg-amber-500/20 text-amber-600 animate-pulse' : 'bg-muted/40'}`}>
                {loadingStep > 0 ? '✓' : '1'}
              </span>
              Build vantage tree from chart positions
            </div>
            <div className={`flex items-center gap-2 ${loadingStep >= 1 ? 'text-foreground' : ''}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${loadingStep > 1 ? 'bg-green-500/20 text-green-600 dark:text-green-400' : loadingStep === 1 ? 'bg-amber-500/20 text-amber-600 animate-pulse' : 'bg-muted/40'}`}>
                {loadingStep > 1 ? '✓' : '2'}
              </span>
              Map aspects, traces, and energy flow
            </div>
            <div className={`flex items-center gap-2 ${loadingStep >= 2 ? 'text-foreground' : ''}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${loadingStep > 2 ? 'bg-green-500/20 text-green-600 dark:text-green-400' : loadingStep === 2 ? 'bg-amber-500/20 text-amber-600 animate-pulse' : 'bg-muted/40'}`}>
                {loadingStep > 2 ? '✓' : '3'}
              </span>
              Deep-analyze each planetary vantage point
            </div>
            <div className={`flex items-center gap-2 ${loadingStep >= 3 ? 'text-foreground' : ''}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${loadingStep > 3 ? 'bg-green-500/20 text-green-600 dark:text-green-400' : loadingStep === 3 ? 'bg-amber-500/20 text-amber-600 animate-pulse' : 'bg-muted/40'}`}>
                {loadingStep > 3 ? '✓' : '4'}
              </span>
              Synthesize into personalized reading
            </div>
          </div>

          {/* Explanation */}
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed border-t border-border/40 pt-3">
            This isn't just ChatGPT with your chart — we build a 9-layer vantage tree from your exact positions, analyze each planet through its house, spark, decan, sign, aspects, and dispositor chains, then synthesize everything into one cohesive reading. It takes a moment, but the accuracy is worth it.
          </p>
        </div>
      )}

      {/* Reading Result */}
      {reading && !loading && (
        <div className="rounded-xl border bg-card/50 p-5 space-y-4">
          {/* Reading Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-amber-500" />
              AI Reading — {focusLabel}
            </div>
            {technical && (
              <button
                onClick={() => setShowTechnical(!showTechnical)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showTechnical ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showTechnical ? 'Hide' : 'Show'} technical
              </button>
            )}
          </div>

          {/* Plain Language Reading */}
          <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {reading}
          </div>

          {/* Technical Section */}
          {technical && showTechnical && (
            <div className="border-t border-border/50 pt-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Technical Analysis</h4>
              <div className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                {technical}
              </div>
            </div>
          )}

          {/* Vantage Tree Data */}
          {treeData.length > 0 && (
            <div>
              <button
                onClick={() => setShowTreeData(!showTreeData)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showTreeData ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Analysis tree ({treeData.reduce((n, t) => n + t.vantages.length, 0)} vantage points)
              </button>
              {showTreeData && (
                <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/40 overflow-x-auto max-h-[400px] overflow-y-auto">
                  <VantageTreeViewer trees={treeData} />
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Powered by AI — for entertainment and self-reflection</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px]"
              onClick={() => { setReading(''); setTechnical(''); setTreeData([]); setShowTreeData(false); setQuestion(''); }}
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
