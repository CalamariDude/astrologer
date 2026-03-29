import React, { useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSubscription, type SubscriptionTier } from '@/contexts/SubscriptionContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HOROSCOPE_FEATURES = [
  'Daily horoscopes',
  '3 AI readings/mo',
  '20 saved charts',
];

const ASTROLOGER_FEATURES = [
  'Daily horoscopes',
  '100 AI readings/mo',
  '5 Live Sessions/mo',
  '3 transcriptions/mo',
  'Unlimited charts',
  'Astrocartography maps',
];

const PROFESSIONAL_FEATURES = [
  'Daily horoscopes',
  '300 AI readings/mo',
  '20 Live Sessions/mo',
  '20 transcriptions/mo',
  'Unlimited charts',
  'Astrocartography maps',
  'Priority support',
];

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { openCheckout } = useSubscription();
  const [annual, setAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async (tier: SubscriptionTier) => {
    const plan = annual ? 'annual' : 'monthly';
    setLoading(`${tier}-${plan}`);
    try {
      await openCheckout(plan, tier);
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
        className="w-full max-w-3xl bg-background rounded-xl shadow-2xl border overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold tracking-tight">Upgrade Your Plan</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Unlock sessions, AI readings, and transcriptions.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Monthly/Annual toggle */}
        <div className="px-6 pb-4 flex justify-center">
          <div className="inline-flex rounded-full bg-muted p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                !annual ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all relative ${
                annual ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              {!annual && (
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
                  Save
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="px-6 pb-6 grid grid-cols-3 gap-3">
          {/* Horoscope */}
          <div className="rounded-xl border p-4 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase">Horoscope</div>
              <div className="text-2xl font-bold mt-1">
                {annual ? '$47.99' : '$4.99'}
                <span className="text-sm font-normal text-muted-foreground">{annual ? '/yr' : '/mo'}</span>
              </div>
              {annual && <div className="text-xs text-muted-foreground">~$4.00/month</div>}
            </div>
            <div className="space-y-1.5">
              {HOROSCOPE_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs">{f}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => handleCheckout('horoscope')}
              disabled={loading !== null}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {loading?.startsWith('horoscope') ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Subscribe
            </Button>
          </div>

          {/* Astrologer */}
          <div className="rounded-xl border p-4 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase">Astrologer</div>
              <div className="text-2xl font-bold mt-1">
                {annual ? '$71.99' : '$7.99'}
                <span className="text-sm font-normal text-muted-foreground">{annual ? '/yr' : '/mo'}</span>
              </div>
              {annual && <div className="text-xs text-muted-foreground">~$6.00/month</div>}
            </div>
            <div className="space-y-1.5">
              {ASTROLOGER_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs">{f}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => handleCheckout('astrologer')}
              disabled={loading !== null}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {loading?.startsWith('astrologer') ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Subscribe
            </Button>
          </div>

          {/* Professional */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 relative">
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase">
              Best Value
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase">Professional</div>
              <div className="text-2xl font-bold mt-1">
                {annual ? '$129.99' : '$14.99'}
                <span className="text-sm font-normal text-muted-foreground">{annual ? '/yr' : '/mo'}</span>
              </div>
              {annual && <div className="text-xs text-muted-foreground">~$10.83/month</div>}
            </div>
            <div className="space-y-1.5">
              {PROFESSIONAL_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs">{f}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => handleCheckout('professional')}
              disabled={loading !== null}
              className="w-full"
              size="sm"
            >
              {loading?.startsWith('professional') ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Subscribe
            </Button>
          </div>
        </div>

        {/* Overage note */}
        <div className="px-6 pb-4 text-center">
          <p className="text-[11px] text-muted-foreground">
            Over your session limit? $0.99/session with transcript, $0.33 without. Have a promo code? Apply it at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
