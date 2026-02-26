import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from './UpgradeModal';

interface PaidFeatureGateProps {
  children: React.ReactNode;
  featureName: string;
}

export function PaidFeatureGate({ children, featureName }: PaidFeatureGateProps) {
  const { user } = useAuth();
  const { isPaid } = useSubscription();
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isPaid) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">{featureName}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {!user
                ? 'Sign in to access this feature'
                : 'Upgrade to Astrologer Pro to access this feature'}
            </p>
          </div>
          <button
            onClick={() => user ? setShowUpgrade(true) : setShowAuth(true)}
            className="mt-1 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {!user ? 'Sign In' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
