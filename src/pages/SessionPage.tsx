/**
 * SessionPage — Route: /session/:token
 *
 * Loads session by share token, then renders:
 * - GuestSessionView if session is live/created
 * - ReplayPlayer if session is ready/ended
 * - Processing spinner (with auto-refresh) if in processing state
 * - 404 if not found
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GuestSessionView } from '@/components/session/GuestSessionView';
import type { SessionRecord } from '@/lib/session/types';

const ReplayPlayer = React.lazy(() => import('@/components/session/ReplayPlayer'));

export default function SessionPage() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!token) return null;
    const { data } = await supabase.rpc('get_session_by_token', { p_token: token });
    return data as SessionRecord | null;
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('No session token provided');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await fetchSession();
        if (!data) {
          setError('Session not found');
          return;
        }
        setSession(data);
      } catch (err) {
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, fetchSession]);

  // Auto-refresh when session is processing: subscribe to Realtime changes
  useEffect(() => {
    if (!session || session.status !== 'processing') return;

    // Subscribe to changes on this specific session
    const channel = supabase
      .channel(`session-status-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'astrologer_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const newStatus = payload.new?.status;
          if (newStatus && newStatus !== 'processing') {
            // Re-fetch full session data via RPC (Realtime payload may not have all columns)
            fetchSession().then((data) => {
              if (data) setSession(data);
            });
          }
        }
      )
      .subscribe();

    // Fallback: poll every 15s in case Realtime misses the update
    const pollTimer = setInterval(async () => {
      const data = await fetchSession();
      if (data && data.status !== 'processing') {
        setSession(data);
      }
    }, 15_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollTimer);
    };
  }, [session?.id, session?.status, fetchSession]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-lg font-medium">Session Not Found</p>
          <p className="text-sm text-muted-foreground">{error || 'This session link may be invalid or expired.'}</p>
          <Link to="/" className="text-sm text-primary hover:underline">Go to homepage</Link>
        </div>
      </div>
    );
  }

  // Route based on session status
  switch (session.status) {
    case 'created':
    case 'live':
    case 'paused':
      return <GuestSessionView session={session} />;

    case 'processing':
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium">Processing Session</p>
            <p className="text-xs text-muted-foreground">
              The recording is being transcribed and summarized. This usually takes a minute or two.
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              This page will update automatically when ready.
            </p>
          </div>
        </div>
      );

    case 'ready':
    case 'ended':
      return (
        <React.Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        }>
          <ReplayPlayer session={session} />
        </React.Suspense>
      );

    case 'failed':
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <p className="text-lg font-medium">Session Processing Failed</p>
            <p className="text-sm text-muted-foreground">
              There was an error processing this session. The host can try reprocessing it.
            </p>
            <Link to="/" className="text-sm text-primary hover:underline">Go to homepage</Link>
          </div>
        </div>
      );

    default:
      return null;
  }
}
