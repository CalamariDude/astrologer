/**
 * PostHog Analytics
 * Identifies authenticated users and provides tracking helpers.
 */

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/** Email domains that should be flagged as internal/test users */
const INTERNAL_DOMAINS = ['druzematch.com', 'astrologer.app'];

/**
 * Hook that identifies the current Supabase user in PostHog.
 * Call once near the app root (inside both AuthProvider and PostHogProvider).
 * On sign-out it resets the PostHog session so anonymous browsing isn't linked.
 *
 * Tags internal users with `is_internal: true` so they can be filtered
 * via PostHog's "Filter test accounts" toggle.
 */
export function usePostHogIdentify() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const email = user.email || '';
      const domain = email.split('@')[1] || '';
      const isInternal = INTERNAL_DOMAINS.includes(domain);

      posthog.identify(user.id, {
        email,
        name: user.user_metadata?.full_name,
        created_at: user.created_at,
        is_internal: isInternal,
      });
    } else {
      posthog.reset();
    }
  }, [user]);
}
