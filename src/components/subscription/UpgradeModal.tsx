import React, { useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURES = [
  'AI-powered chart interpretations',
  'Save & manage unlimited charts',
  'Astrocartography maps',
  'Priority support',
];

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { openCheckout } = useSubscription();
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async (plan: 'monthly' | 'annual') => {
    setLoading(plan);
    try {
      await openCheckout(plan);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout');
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg bg-background rounded-xl shadow-2xl border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold tracking-tight">Astrologer Pro</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Unlock all premium features. Cancel anytime.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Features */}
        <div className="px-6 pb-4">
          <div className="space-y-2">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          {/* Monthly */}
          <div className="rounded-xl border p-4 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase">Monthly</div>
              <div className="text-2xl font-bold mt-1">$14.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </div>
            <Button
              onClick={() => handleCheckout('monthly')}
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Subscribe
            </Button>
          </div>

          {/* Annual */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 relative">
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase">
              Save 28%
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase">Annual</div>
              <div className="text-2xl font-bold mt-1">$129.99<span className="text-sm font-normal text-muted-foreground">/yr</span></div>
              <div className="text-xs text-muted-foreground">~$10.83/month</div>
            </div>
            <Button
              onClick={() => handleCheckout('annual')}
              disabled={loading !== null}
              className="w-full"
            >
              {loading === 'annual' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Subscribe
            </Button>
          </div>
        </div>

        <div className="px-6 pb-4 text-center">
          <p className="text-[11px] text-muted-foreground">
            Have a promo code? You can apply it at checkout. Cancel anytime from your account.
          </p>
        </div>
      </div>
    </div>
  );
}
