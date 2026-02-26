/**
 * PostHog Analytics
 * Identifies authenticated users and provides tracking helpers.
 */

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook that identifies the current Supabase user in PostHog.
 * Call once near the app root (inside both AuthProvider and PostHogProvider).
 * On sign-out it resets the PostHog session so anonymous browsing isn't linked.
 */
export function usePostHogIdentify() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.user_metadata?.full_name,
        created_at: user.created_at,
      });
    } else {
      posthog.reset();
    }
  }, [user]);
}
