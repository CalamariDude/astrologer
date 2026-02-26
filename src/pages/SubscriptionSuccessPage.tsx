import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const { isPaid, refresh } = useSubscription();
  const [pollCount, setPollCount] = useState(0);

  // Poll for subscription status update (webhook may be delayed)
  useEffect(() => {
    if (isPaid) return;
    if (pollCount > 10) return; // Stop after ~10 seconds

    const timer = setTimeout(async () => {
      await refresh();
      setPollCount((c) => c + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPaid, pollCount, refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        {isPaid ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome to Astrologer Pro!</h1>
              <p className="text-muted-foreground mt-2">
                You now have access to all premium features.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/')} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Exploring
              </Button>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <div>
              <h1 className="text-xl font-bold">Setting up your subscription...</h1>
              <p className="text-sm text-muted-foreground mt-2">
                This usually takes just a moment.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
