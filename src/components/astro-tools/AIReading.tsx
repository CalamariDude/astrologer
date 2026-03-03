/**
 * AI Reading
 * AI-powered chart interpretation
 * Builds structured dispositor trees client-side, sends to edge function for deep analysis
 * Supports SSE streaming, Phase 0 smart selection, synastry, and timing enrichment
 */

import React, { useState, useCallback, useMemo, useEffect, useRef, Fragment } from 'react';
import { Sparkles, Send, Loader2, Lock, ChevronDown, ChevronUp, ChevronRight, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { supabase } from '@/lib/supabase';
import { swissEphemeris } from '@/api/swissEphemeris';
import {
  buildTreesForQuestion,
  buildCompactChartSummary,
  buildTreesFromPlanetKeys,
  enrichTreesWithTransits,
  enrichTreesWithProfections,
  enrichTreesWithActivations,
} from '@/lib/chartReading/buildVantageTree';
import { buildSynastryTreeGroups } from '@/lib/chartReading/buildSynastryTree';
import { DEFAULT_PARAMS, isTransitQuestion, detectCategories } from '@/lib/chartReading/types';
import type { NatalChart, ChartReadingTree, TreeGroup, VantageAnalysis } from '@/lib/chartReading/types';
import * as analytics from '@/lib/analytics';

interface AIReadingProps {
  chartA: NatalChart;
  chartB?: NatalChart;
  nameA: string;
  nameB?: string;
  birthInfoA?: { date: string; time: string; lat?: number; lng?: number };
  birthInfoB?: { date: string; time: string; lat?: number; lng?: number };
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

const TIMING_QUESTIONS = [
  "What's happening for me right now?",
  "What energy is building this month?",
  "What phase of life am I in?",
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
              {tree.synastry_context ? (
                <span className="text-purple-500">
                  {tree.synastry_context.mode === 'composite' ? 'Composite' :
                   `${tree.synastry_context.source_person} in ${tree.synastry_context.host_person}'s Chart`}
                </span>
              ) : tree.derived ? (
                <span className="text-blue-500">{tree.derived.label}</span>
              ) : (
                <span>Natal</span>
              )}
              {' '}
              <span className="text-muted-foreground">({tree.category})</span>
            </span>
          }
          badge={`${tree.vantages.length} planets`}
          defaultOpen={ti === 0}
        >
          <TreeNode label={<span className="text-amber-600 dark:text-amber-400">Rising: {tree.rising_sign}</span>} />
          {tree.transit_context && tree.transit_context.active_transits.length > 0 && (
            <TreeNode label={<span className="text-cyan-500">Transits: {tree.transit_context.active_transits.length} active</span>} />
          )}
          {tree.profection_context && (
            <TreeNode label={<span className="text-green-500">Profection: H{tree.profection_context.yearly.house} ({tree.profection_context.yearly.sign}) — {tree.profection_context.yearly.time_lord_name}</span>} />
          )}
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
                {p.spark && <TreeNode label={<span>Degree: <span className="text-purple-500">{p.spark.sign}</span></span>} />}
                {p.decan && <TreeNode label={<span>Decan {p.decan.number}: <span className="text-cyan-500">{p.decan.sign}</span></span>} />}
                {p.fusion_cusp && <TreeNode label={<span className="text-orange-500">Fusion cusp H{p.fusion_cusp.from_house}–H{p.fusion_cusp.to_house}</span>} />}
                {p.retrograde_house && <TreeNode label={<span className="text-red-400">House ruler retrograde</span>} />}

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

                {v.transit_context && v.transit_context.vantage_transits.length > 0 && (
                  <TreeNode label={<span className="text-cyan-400">Transits</span>} badge={`${v.transit_context.vantage_transits.length}`}>
                    {v.transit_context.vantage_transits.map((t, ti) => (
                      <TreeNode
                        key={ti}
                        label={
                          <span>
                            {t.transit_planet} {t.aspect_name} {t.natal_planet}{' '}
                            <span className="text-muted-foreground">
                              {t.orb.toFixed(1)}° {t.applying ? 'applying' : 'separating'}
                              {t.days_to_exact !== null ? ` (${Math.abs(t.days_to_exact)}d)` : ''}
                            </span>
                          </span>
                        }
                      />
                    ))}
                  </TreeNode>
                )}

                {v.profection_context && (v.profection_context.is_year_lord || v.profection_context.is_month_lord) && (
                  <TreeNode label={
                    <span className="text-green-400">
                      {v.profection_context.is_year_lord ? '⚡ Year Lord' : ''}
                      {v.profection_context.is_year_lord && v.profection_context.is_month_lord ? ' + ' : ''}
                      {v.profection_context.is_month_lord ? '⚡ Month Lord' : ''}
                    </span>
                  } />
                )}

                {v.activations && v.activations.length > 0 && (
                  <TreeNode label={<span className="text-yellow-400">Activations</span>} badge={`${v.activations.length}`}>
                    {v.activations.map((a, ai) => (
                      <TreeNode
                        key={ai}
                        label={
                          <span>
                            {a.planet_name} age {a.activation_age.toFixed(1)}{' '}
                            <span className="text-muted-foreground">
                              cycle {a.cycle} ({a.cycle_sign}) {a.is_current ? '[NOW]' : '[recent]'}
                            </span>
                          </span>
                        }
                      />
                    ))}
                  </TreeNode>
                )}

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

export function AIReading({ chartA, chartB, nameA, nameB, birthInfoA, birthInfoB }: AIReadingProps) {
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
  const [vantageAnalyses, setVantageAnalyses] = useState<VantageAnalysis[]>([]);
  const [showAnalyses, setShowAnalyses] = useState(false);
  const pendingSubmitRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const readingRef = useRef<HTMLDivElement>(null);

  const hasTwoCharts = !!chartB && !!nameB;
  const [readingFocus, setReadingFocus] = useState<ReadingFocus>(hasTwoCharts ? 'synastry' : 'personA');

  const hasBirthInfo = !!birthInfoA?.date;

  const suggestions = useMemo(() => {
    const base = readingFocus === 'synastry' ? SYNASTRY_QUESTIONS : NATAL_QUESTIONS;
    if (hasBirthInfo && readingFocus !== 'synastry') {
      return [...base, ...TIMING_QUESTIONS];
    }
    return base;
  }, [readingFocus, hasBirthInfo]);

  const focusLabel = useMemo(() => {
    if (readingFocus === 'synastry') return `${nameA} & ${nameB}`;
    if (readingFocus === 'personB') return nameB || 'Person B';
    return nameA || 'Person A';
  }, [readingFocus, nameA, nameB]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setLoadingPhase('');
  }, []);

  const handleSubmit = useCallback(async (q?: string) => {
    const userQuestion = q || question || 'Give me a comprehensive chart reading';

    if (!user) {
      pendingSubmitRef.current = userQuestion;
      sessionStorage.setItem('astrologer_pending_ai', userQuestion);
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
    setLoadingPhase('Building chart analysis tree...');
    setError(null);
    setReading('');
    setTechnical('');
    setVantageAnalyses([]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Step 1: Build vantage trees client-side
      let trees: ChartReadingTree[] = [];
      let treesB: ChartReadingTree[] | undefined;
      let synastryContext: any = undefined;

      const activeChart = readingFocus === 'personB' && chartB ? chartB : chartA;
      const activeBirthInfo = readingFocus === 'personB' ? birthInfoB : birthInfoA;

      if (readingFocus === 'synastry' && chartB) {
        // Build synastry tree groups (A→B, B→A, Composite)
        const treeGroups = buildSynastryTreeGroups(
          chartA as NatalChart, chartB as NatalChart,
          nameA, nameB || 'Person B',
          userQuestion, DEFAULT_PARAMS
        );

        // Flatten tree groups into trees for the edge function
        trees = treeGroups.flatMap(g => g.trees);

        synastryContext = {
          personAName: nameA,
          personBName: nameB || 'Person B',
          tree_groups: treeGroups.map(g => ({ id: g.id, label: g.label, vantage_count: g.trees.reduce((n, t) => n + t.vantages.length, 0) })),
        };
      } else {
        // Check if question is ambiguous (only "general" category detected) → Phase 0
        const categories = detectCategories(userQuestion);
        const isAmbiguous = categories.length === 1 && categories[0].key === 'general';

        if (isAmbiguous) {
          setLoadingPhase('Selecting relevant planets for your question...');
          try {
            const session = await supabase.auth.getSession();
            const chartSummary = buildCompactChartSummary(activeChart as NatalChart, DEFAULT_PARAMS);
            const phase0Response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/astrologer-ai-reading`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session?.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ phase0: true, chart_summary: chartSummary, question: userQuestion }),
              signal: abortController.signal,
            });
            if (phase0Response.ok) {
              const { planets: planetKeys } = await phase0Response.json();
              trees = buildTreesFromPlanetKeys(activeChart as NatalChart, userQuestion, planetKeys, DEFAULT_PARAMS);
            } else {
              // Fallback to standard tree building
              trees = buildTreesForQuestion(activeChart as NatalChart, userQuestion, DEFAULT_PARAMS);
            }
          } catch (e) {
            if ((e as Error).name === 'AbortError') throw e;
            // Fallback on any Phase 0 error
            trees = buildTreesForQuestion(activeChart as NatalChart, userQuestion, DEFAULT_PARAMS);
          }
        } else {
          trees = buildTreesForQuestion(activeChart as NatalChart, userQuestion, DEFAULT_PARAMS);
        }
      }

      // Step 2: Timing enrichment (when birth info available)
      if (activeBirthInfo?.date && readingFocus !== 'synastry') {
        setLoadingPhase('Enriching with timing data...');

        // Profections
        trees = enrichTreesWithProfections(trees, activeChart as NatalChart, activeBirthInfo.date);

        // Activations
        trees = enrichTreesWithActivations(trees, activeChart as NatalChart, activeBirthInfo.date);

        // Transits (only when question is timing-related and we have coordinates)
        if (isTransitQuestion(userQuestion) && activeBirthInfo.lat && activeBirthInfo.lng) {
          try {
            const now = new Date();
            const transitData = await swissEphemeris.transit({
              natal_date: activeBirthInfo.date,
              natal_time: activeBirthInfo.time || '12:00',
              natal_lat: activeBirthInfo.lat,
              natal_lng: activeBirthInfo.lng,
              transit_date: now.toISOString().split('T')[0],
              transit_time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
            });
            if (transitData) {
              trees = enrichTreesWithTransits(trees, transitData, activeChart as NatalChart);
            }
          } catch (err) {
            console.warn('Transit fetch failed, continuing without:', err);
          }
        }
      }

      const allTrees = [...trees, ...(treesB || [])];
      const totalVantages = allTrees.reduce((n, t) => n + t.vantages.length, 0);
      setTreeData(allTrees);

      setLoadingStep(1);
      setLoadingTotal(totalVantages + 2);
      setLoadingPhase(`Mapping ${totalVantages} planetary positions across ${readingFocus === 'synastry' ? 'both charts' : 'your chart'}...`);

      // Step 3: SSE streaming request to edge function
      setLoadingStep(2);
      setLoadingPhase(`Deep-analyzing ${totalVantages} planetary placements...`);

      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/astrologer-ai-reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          trees,
          treesB: treesB || undefined,
          question: userQuestion,
          readingFocus,
          personName: nameA,
          personNameB: hasTwoCharts ? nameB : undefined,
          synastry_context: synastryContext,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        if (errorData?.error === 'credit_limit') {
          setError(errorData.message);
          return;
        }
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      // Check if it's a JSON response (Phase 0 or error) vs SSE stream
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        // Non-streaming response (shouldn't happen in normal flow)
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        const fullText = data.reading || '';
        const sepIdx = fullText.indexOf(SEPARATOR);
        if (sepIdx !== -1) {
          setReading(fullText.substring(0, sepIdx).trim());
          setTechnical(fullText.substring(sepIdx + SEPARATOR.length).trim());
        } else {
          setReading(fullText);
        }
      } else {
        // SSE streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.phase === 'analyzing') {
                setLoadingPhase(`Deep-analyzing ${parsed.total} planetary placements...`);
                setLoadingTotal(parsed.total + 2);
              } else if (parsed.phase === 'analyzing_done') {
                setVantageAnalyses(prev => [...prev, { planet: parsed.vantage, analysis: parsed.analysis }]);
                setLoadingStep(parsed.index + 1);
                setLoadingPhase(`Analyzed ${parsed.vantage} (${parsed.index}/${parsed.total})...`);
              } else if (parsed.phase === 'synthesizing') {
                setLoadingPhase('Synthesizing into personalized reading...');
                setLoadingStep(prev => prev + 1);
              } else if (parsed.phase === 'technical') {
                // Reading is complete, technical section starting
              } else if (parsed.content) {
                setReading(prev => prev + parsed.content);
              } else if (parsed.technical) {
                setTechnical(prev => prev + parsed.technical);
              } else if (parsed.credits_used !== undefined) {
                // Credits updated
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
              // Ignore debug_system_prompt, debug_user_prompt
            } catch (e) {
              if (e instanceof SyntaxError) continue; // skip invalid JSON chunks
              throw e;
            }
          }
        }
      }

      await useAiCredit();
      analytics.trackAIReadingUsed({ reading_type: readingFocus });
      setQuestion('');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled
        return;
      }
      setError(err.message || 'Failed to generate reading');
    } finally {
      setLoading(false);
      setLoadingPhase('');
      abortControllerRef.current = null;
    }
  }, [question, user, aiCreditsRemaining, chartA, chartB, nameA, nameB, hasTwoCharts, readingFocus, useAiCredit, birthInfoA, birthInfoB, hasBirthInfo]);

  // Auto-submit after sign-in if there was a pending request
  useEffect(() => {
    if (!user) return;
    const pending = pendingSubmitRef.current || sessionStorage.getItem('astrologer_pending_ai');
    if (pending) {
      pendingSubmitRef.current = null;
      sessionStorage.removeItem('astrologer_pending_ai');
      const timer = setTimeout(() => handleSubmit(pending), 500);
      return () => clearTimeout(timer);
    }
  }, [user, handleSubmit]);

  // Auto-scroll reading as it streams
  useEffect(() => {
    if (loading && reading && readingRef.current) {
      readingRef.current.scrollTop = readingRef.current.scrollHeight;
    }
  }, [reading, loading]);

  const hasReading = reading.length > 0;

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
            Deep chart analysis for {focusLabel}
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
          {loading ? (
            <Button onClick={handleCancel} size="sm" variant="outline" className="gap-1.5">
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
          ) : (
            <Button
              onClick={() => handleSubmit()}
              disabled={loading}
              size="sm"
              className="gap-1.5"
            >
              {!user ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {!user ? 'Sign In' : 'Get Reading'}
            </Button>
          )}
        </div>

        {/* Credit warning for free users */}
        {user && !isPaid && aiCreditsRemaining > 0 && aiCreditsRemaining <= 3 && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            {aiCreditsRemaining} reading{aiCreditsRemaining !== 1 ? 's' : ''} remaining this month. Upgrade for more.
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
      {!hasReading && !loading && (
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

      {/* Loading with streaming progress */}
      {loading && !hasReading && (
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

          {/* Vantage analysis progress */}
          {vantageAnalyses.length > 0 && (
            <div className="space-y-1 text-[11px]">
              {vantageAnalyses.map((va, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] bg-green-500/20 text-green-600 dark:text-green-400">✓</span>
                  <span className="capitalize">{va.planet}</span>
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed border-t border-border/40 pt-3">
            We use all dispositor trees and relevant planets, aspects, and house placements to build the most accurate reading possible.
          </p>
        </div>
      )}

      {/* Streaming Reading (shows while loading once content starts arriving) */}
      {loading && hasReading && (
        <div className="rounded-xl border bg-card/50 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            Reading in progress...
          </div>
          <div ref={readingRef} className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-[500px] overflow-y-auto">
            {reading}
            <span className="inline-block w-1 h-4 bg-amber-500 animate-pulse ml-0.5 align-text-bottom" />
          </div>
        </div>
      )}

      {/* Reading Result (final) */}
      {hasReading && !loading && (
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

          {/* Vantage Analyses (from streaming) */}
          {vantageAnalyses.length > 0 && (
            <div>
              <button
                onClick={() => setShowAnalyses(!showAnalyses)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAnalyses ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Per-planet analyses ({vantageAnalyses.length})
              </button>
              {showAnalyses && (
                <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto">
                  {vantageAnalyses.map((va, i) => (
                    <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/40">
                      <div className="text-[11px] font-semibold capitalize mb-1">{va.planet}</div>
                      <div className="text-[10px] text-muted-foreground whitespace-pre-wrap">{va.analysis}</div>
                    </div>
                  ))}
                </div>
              )}
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
                Analysis tree ({treeData.reduce((n, t) => n + t.vantages.length, 0)} planets)
              </button>
              {showTreeData && (
                <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/40 overflow-x-auto max-h-[400px] overflow-y-auto">
                  <VantageTreeViewer trees={treeData} />
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">This is an AI that can and will make mistakes — always trust your intuition over AI!</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px]"
              onClick={() => { setReading(''); setTechnical(''); setTreeData([]); setShowTreeData(false); setQuestion(''); setVantageAnalyses([]); setShowAnalyses(false); }}
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
