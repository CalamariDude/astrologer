import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

type SubStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'canceled';

export type SubscriptionTier = 'lite' | 'horoscope' | 'astrologer' | 'professional';

export const TIER_LIMITS = {
  lite:         { ai: 3,   sessions: 0,  transcriptions: 0,  charts: 3  },
  horoscope:    { ai: 3,   sessions: 0,  transcriptions: 0,  charts: 20 },
  astrologer:   { ai: 100, sessions: 5,  transcriptions: 3,  charts: -1 },
  professional: { ai: 300, sessions: 20, transcriptions: 20, charts: -1 },
} as const;

const FREE_RELOCATED_LIMIT = 3;

function getMonthStart(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface SubscriptionContextType {
  status: SubStatus;
  plan: string | null;
  tier: SubscriptionTier;
  isPaid: boolean;
  hasHoroscopeAccess: boolean;
  chartsLimit: number; // -1 = unlimited
  isTrialing: boolean;
  trialDaysRemaining: number | null;
  loading: boolean;
  // AI Credits
  aiCreditsRemaining: number;
  aiCreditsLimit: number;
  // Relocated
  relocatedRemaining: number; // -1 = unlimited
  relocatedLimit: number; // -1 = unlimited
  // Sessions
  sessionsRemaining: number;
  sessionsLimit: number;
  sessionsUsed: number;
  // Transcriptions
  transcriptionsRemaining: number;
  transcriptionsLimit: number;
  transcriptionsUsed: number;
  // Credit usage
  useAiCredit: () => Promise<boolean>;
  useRelocatedCredit: () => Promise<boolean>;
  useSessionCredit: () => Promise<boolean>;
  useTranscriptionCredit: () => Promise<boolean>;
  // Actions
  openCheckout: (plan: 'monthly' | 'annual', tier?: SubscriptionTier) => Promise<void>;
  openPortal: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubStatus>('free');
  const [plan, setPlan] = useState<string | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>('lite');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Usage tracking
  const [aiCreditsUsed, setAiCreditsUsed] = useState(0);
  const [relocatedUsed, setRelocatedUsed] = useState(0);
  const [sessionsUsed, setSessionsUsed] = useState(0);
  const [transcriptionsUsed, setTranscriptionsUsed] = useState(0);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setStatus('free');
      setPlan(null);
      setTier('lite');
      setTrialEndsAt(null);
      setAiCreditsUsed(0);
      setRelocatedUsed(0);
      setSessionsUsed(0);
      setTranscriptionsUsed(0);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('astrologer_profiles')
        .select('subscription_status, subscription_plan, subscription_tier, trial_ends_at, subscription_expires_at, ai_credits_used, ai_credits_reset_at, relocated_used, relocated_reset_at, sessions_used, sessions_reset_at, transcriptions_used, transcriptions_reset_at')
        .eq('id', user.id)
        .single();

      if (data) {
        setStatus(data.subscription_status || 'free');
        setPlan(data.subscription_plan || null);
        setTier((data.subscription_tier as SubscriptionTier) || 'lite');
        setTrialEndsAt(data.trial_ends_at || null);

        // Check monthly reset
        const monthStart = getMonthStart();
        const aiResetAt = new Date(data.ai_credits_reset_at || '2000-01-01');
        const relocatedResetAt = new Date(data.relocated_reset_at || '2000-01-01');
        const sessionsResetAt = new Date(data.sessions_reset_at || '2000-01-01');
        const transcriptionsResetAt = new Date(data.transcriptions_reset_at || '2000-01-01');

        const updates: Record<string, unknown> = {};

        if (aiResetAt < monthStart) {
          updates.ai_credits_used = 0;
          updates.ai_credits_reset_at = monthStart.toISOString();
          setAiCreditsUsed(0);
        } else {
          setAiCreditsUsed(data.ai_credits_used || 0);
        }

        if (relocatedResetAt < monthStart) {
          updates.relocated_used = 0;
          updates.relocated_reset_at = monthStart.toISOString();
          setRelocatedUsed(0);
        } else {
          setRelocatedUsed(data.relocated_used || 0);
        }

        if (sessionsResetAt < monthStart) {
          updates.sessions_used = 0;
          updates.sessions_reset_at = monthStart.toISOString();
          setSessionsUsed(0);
        } else {
          setSessionsUsed(data.sessions_used || 0);
        }

        if (transcriptionsResetAt < monthStart) {
          updates.transcriptions_used = 0;
          updates.transcriptions_reset_at = monthStart.toISOString();
          setTranscriptionsUsed(0);
        } else {
          setTranscriptionsUsed(data.transcriptions_used || 0);
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('astrologer_profiles')
            .update(updates)
            .eq('id', user.id);
        }
      }
    } catch {
      // Profile might not exist yet (trigger may be delayed)
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Listen for realtime updates to profile (webhook-driven changes)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('astrologer_profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'astrologer_profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const data = payload.new as any;
          setStatus(data.subscription_status || 'free');
          setPlan(data.subscription_plan || null);
          setTier(data.subscription_tier || 'lite');
          setTrialEndsAt(data.trial_ends_at || null);
          if (data.ai_credits_used != null) setAiCreditsUsed(data.ai_credits_used);
          if (data.relocated_used != null) setRelocatedUsed(data.relocated_used);
          if (data.sessions_used != null) setSessionsUsed(data.sessions_used);
          if (data.transcriptions_used != null) setTranscriptionsUsed(data.transcriptions_used);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isPaid = tier === 'horoscope' || tier === 'astrologer' || tier === 'professional' ||
    status === 'active' ||
    (status === 'trialing' && trialEndsAt ? new Date(trialEndsAt) > new Date() : false);

  const hasHoroscopeAccess = tier === 'horoscope' || tier === 'astrologer' || tier === 'professional';
  const chartsLimit = TIER_LIMITS[tier].charts; // -1 = unlimited

  const isTrialing = status === 'trialing' && trialEndsAt ? new Date(trialEndsAt) > new Date() : false;

  const trialDaysRemaining = isTrialing && trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Credit calculations
  const limits = TIER_LIMITS[tier];
  const aiCreditsLimit = limits.ai;
  const aiCreditsRemaining = Math.max(0, aiCreditsLimit - aiCreditsUsed);

  const relocatedLimit = isPaid ? -1 : FREE_RELOCATED_LIMIT; // -1 = unlimited
  const relocatedRemaining = isPaid ? -1 : Math.max(0, FREE_RELOCATED_LIMIT - relocatedUsed);

  const sessionsLimit = limits.sessions;
  const sessionsRemaining = Math.max(0, sessionsLimit - sessionsUsed);

  const transcriptionsLimit = limits.transcriptions;
  const transcriptionsRemaining = Math.max(0, transcriptionsLimit - transcriptionsUsed);

  const useAiCredit = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (aiCreditsRemaining <= 0) return false;

    const newUsed = aiCreditsUsed + 1;
    setAiCreditsUsed(newUsed);
    await supabase
      .from('astrologer_profiles')
      .update({ ai_credits_used: newUsed })
      .eq('id', user.id);
    return true;
  }, [user, aiCreditsUsed, aiCreditsRemaining]);

  const useRelocatedCredit = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (!isPaid) {
      if (relocatedUsed >= FREE_RELOCATED_LIMIT) return false;
      const newUsed = relocatedUsed + 1;
      setRelocatedUsed(newUsed);
      await supabase
        .from('astrologer_profiles')
        .update({ relocated_used: newUsed })
        .eq('id', user.id);
    }
    return true;
  }, [user, isPaid, relocatedUsed]);

  const useSessionCredit = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const newUsed = sessionsUsed + 1;
    setSessionsUsed(newUsed);
    await supabase
      .from('astrologer_profiles')
      .update({ sessions_used: newUsed })
      .eq('id', user.id);
    return true;
  }, [user, sessionsUsed]);

  const useTranscriptionCredit = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const newUsed = transcriptionsUsed + 1;
    setTranscriptionsUsed(newUsed);
    await supabase
      .from('astrologer_profiles')
      .update({ transcriptions_used: newUsed })
      .eq('id', user.id);
    return true;
  }, [user, transcriptionsUsed]);

  const openCheckout = async (selectedPlan: 'monthly' | 'annual', selectedTier: SubscriptionTier = 'professional') => {
    if (!user) return;

    const { data, error } = await supabase.functions.invoke('astrologer-stripe-checkout', {
      body: {
        plan: selectedPlan,
        tier: selectedTier,
        success_url: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: window.location.href,
      },
    });

    if (error) throw new Error(error.message);
    if (data?.checkout_url) {
      window.location.href = data.checkout_url;
    }
  };

  const openPortal = async () => {
    if (!user) return;

    const { data, error } = await supabase.functions.invoke('astrologer-stripe-portal', {
      body: { return_url: window.location.href },
    });

    if (error) throw new Error(error.message);
    if (data?.portal_url) {
      window.location.href = data.portal_url;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        status, plan, tier, isPaid, hasHoroscopeAccess, chartsLimit, isTrialing, trialDaysRemaining, loading,
        aiCreditsRemaining, aiCreditsLimit,
        relocatedRemaining, relocatedLimit,
        sessionsRemaining, sessionsLimit, sessionsUsed,
        transcriptionsRemaining, transcriptionsLimit, transcriptionsUsed,
        useAiCredit, useRelocatedCredit, useSessionCredit, useTranscriptionCredit,
        openCheckout, openPortal, refresh: fetchProfile,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
