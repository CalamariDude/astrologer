import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

type SubStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'canceled';

interface SubscriptionContextType {
  status: SubStatus;
  plan: string | null;
  isPaid: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
  loading: boolean;
  openCheckout: (plan: 'monthly' | 'annual') => Promise<void>;
  openPortal: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubStatus>('free');
  const [plan, setPlan] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setStatus('free');
      setPlan(null);
      setTrialEndsAt(null);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('astrologer_profiles')
        .select('subscription_status, subscription_plan, trial_ends_at, subscription_expires_at')
        .eq('id', user.id)
        .single();

      if (data) {
        setStatus(data.subscription_status || 'free');
        setPlan(data.subscription_plan || null);
        setTrialEndsAt(data.trial_ends_at || null);
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
          setTrialEndsAt(data.trial_ends_at || null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isPaid = status === 'active' ||
    (status === 'trialing' && trialEndsAt ? new Date(trialEndsAt) > new Date() : false);

  const isTrialing = status === 'trialing' && trialEndsAt ? new Date(trialEndsAt) > new Date() : false;

  const trialDaysRemaining = isTrialing && trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const openCheckout = async (selectedPlan: 'monthly' | 'annual') => {
    if (!user) return;

    const { data, error } = await supabase.functions.invoke('astrologer-stripe-checkout', {
      body: {
        plan: selectedPlan,
        success_url: `${window.location.origin}/subscription/success`,
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
      value={{ status, plan, isPaid, isTrialing, trialDaysRemaining, loading, openCheckout, openPortal, refresh: fetchProfile }}
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
