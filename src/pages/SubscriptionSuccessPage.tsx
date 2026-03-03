import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase';

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { isPaid, refresh } = useSubscription();
  const [pollCount, setPollCount] = useState(0);
  const verifiedRef = useRef(false);

  // On mount: verify the Stripe session directly (don't wait for webhook)
  useEffect(() => {
    if (!sessionId || verifiedRef.current || isPaid) return;
    verifiedRef.current = true;

    (async () => {
      try {
        const { error } = await supabase.functions.invoke('astrologer-stripe-verify', {
          body: { session_id: sessionId },
        });
        if (error) console.error('Verify error:', error);
        // Refresh profile to pick up the update
        await refresh();
      } catch (err) {
        console.error('Verify failed:', err);
      }
    })();
  }, [sessionId, isPaid, refresh]);

  // Fallback: poll for webhook-driven update
  useEffect(() => {
    if (isPaid) return;
    if (pollCount > 15) return;

    const timer = setTimeout(async () => {
      await refresh();
      setPollCount((c) => c + 1);
    }, 2000);

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
              <h1 className="text-2xl font-bold">Welcome to Astrologer!</h1>
              <p className="text-muted-foreground mt-2">
                Your subscription is active. Explore your personalized dashboard.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </>
        ) : pollCount > 15 ? (
          <>
            <div>
              <h1 className="text-xl font-bold">Almost there...</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Your payment was received. It may take a minute to activate.
                Try refreshing the page.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
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
