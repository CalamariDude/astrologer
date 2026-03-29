import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        // 1) PKCE flow: Supabase v2 emails contain ?code=XXX
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            // Code may have already been exchanged (double-click, prefetch, etc.)
            // Check if we already have a session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              throw new Error(exchangeError.message);
            }
          }
          if (!cancelled) navigate('/dashboard', { replace: true });
          return;
        }

        // 2) Hash-based flow: older links or magic links use #access_token=...
        const hash = window.location.hash;
        if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
          // detectSessionInUrl handles this automatically — wait for auth state change
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            if (!cancelled) navigate('/dashboard', { replace: true });
            return;
          }
        }

        // 3) Fallback: wait for onAuthStateChange (covers edge cases)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          if (!cancelled) navigate('/dashboard', { replace: true });
          return;
        }

        // 4) No code, no hash, no session — listen for a state change with timeout
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            sub.unsubscribe();
            reject(new Error('Verification timed out. Please try the link again or request a new one.'));
          }, 10000); // 10s timeout for slow mobile connections

          const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
              clearTimeout(timeout);
              sub.unsubscribe();
              resolve();
            }
          });
        });

        if (!cancelled) navigate('/dashboard', { replace: true });
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message || 'Something went wrong. Please try again.';
          setError(msg);
        }
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-destructive text-lg">!</span>
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/', { replace: true })}
              className="text-sm text-primary hover:underline"
            >
              Go to home page
            </button>
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
