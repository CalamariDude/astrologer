import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PricingToggle({ onSubscribe }: { onSubscribe: () => void }) {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-muted p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              !annual ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all relative ${
              annual ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground/70'
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Horoscope */}
        <div className="rounded-2xl border border-border/60 bg-background p-6 sm:p-8">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Horoscope</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{annual ? '$47.99' : '$4.99'}</span>
            <span className="text-sm text-muted-foreground">{annual ? '/yr' : '/mo'}</span>
          </div>
          {annual && <div className="text-xs text-muted-foreground/60 mt-0.5">~$4.00/month</div>}

          <div className="mt-6 space-y-2.5 text-left">
            {[
              'Daily horoscopes',
              '3 AI readings/mo',
              '20 saved charts',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-6 h-10 rounded-xl text-sm font-medium"
            onClick={onSubscribe}
          >
            Subscribe
          </Button>
        </div>

        {/* Astrologer */}
        <div className="rounded-2xl border border-border/60 bg-background p-6 sm:p-8">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Astrologer</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{annual ? '$71.99' : '$7.99'}</span>
            <span className="text-sm text-muted-foreground">{annual ? '/yr' : '/mo'}</span>
          </div>
          {annual && <div className="text-xs text-muted-foreground/60 mt-0.5">~$6.00/month</div>}

          <div className="mt-6 space-y-2.5 text-left">
            {[
              'Daily horoscopes',
              '100 AI readings/mo',
              '5 Live Sessions/mo',
              '3 transcriptions/mo',
              'Unlimited charts',
              'Astrocartography',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-6 h-10 rounded-xl text-sm font-medium"
            onClick={onSubscribe}
          >
            Subscribe
          </Button>
        </div>

        {/* Professional */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/[0.02] p-6 sm:p-8 relative">
          <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full uppercase">
            Best Value
          </div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Professional</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{annual ? '$129.99' : '$14.99'}</span>
            <span className="text-sm text-muted-foreground">{annual ? '/yr' : '/mo'}</span>
          </div>
          {annual && <div className="text-xs text-muted-foreground/60 mt-0.5">~$10.83/month</div>}

          <div className="mt-6 space-y-2.5 text-left">
            {[
              'Daily horoscopes',
              '300 AI readings/mo',
              '20 Live Sessions/mo',
              '20 transcriptions/mo',
              'Unlimited charts',
              'Astrocartography',
              'Priority support',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>

          <Button
            className="w-full mt-6 h-10 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-semibold shadow-lg shadow-blue-500/20"
            onClick={onSubscribe}
          >
            Subscribe
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/50 text-center">
        Over your limit? $0.99/session with transcript, $0.33 without. Cancel anytime. Promo codes accepted at checkout.
      </p>
    </div>
  );
}
