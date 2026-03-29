/**
 * PostHog Analytics Events
 * Centralized tracking for feature usage across Astrologer.
 */

import posthog from 'posthog-js';

// ── Chart generation ────────────────────────────────────────────────

export function trackChartGenerated(props: {
  chart_type: 'natal' | 'synastry';
  has_birth_time: boolean;
}) {
  posthog.capture('chart_generated', props);
}

// ── Chart save / load / delete ──────────────────────────────────────

export function trackChartSaved(props: {
  chart_type: 'natal' | 'synastry';
  is_update: boolean;
  storage: 'db' | 'local';
}) {
  posthog.capture('chart_saved', props);
}

export function trackChartLoaded(props: { chart_type: 'natal' | 'synastry' }) {
  posthog.capture('chart_loaded', props);
}

export function trackChartDeleted() {
  posthog.capture('chart_deleted');
}

// ── Import / Export ─────────────────────────────────────────────────

export function trackAstroComImport(props: { person_count: number }) {
  posthog.capture('astro_com_import', props);
}

export function trackChartExported(props: { format: 'png' | 'pdf' | 'json' | 'email' }) {
  posthog.capture('chart_exported', props);
}

export function trackChartShared(props: { method: 'link' | 'email' }) {
  posthog.capture('chart_shared', props);
}

// ── View modes ──────────────────────────────────────────────────────

export function trackGalacticModeToggled(props: { enabled: boolean }) {
  posthog.capture('galactic_mode_toggled', props);
}

// ── Chart features ──────────────────────────────────────────────────

export function trackTransitsEnabled() {
  posthog.capture('transits_enabled');
}

export function trackCompositeViewed() {
  posthog.capture('composite_viewed');
}

export function trackProgressedEnabled(props: { person: 'A' | 'B' | 'both' }) {
  posthog.capture('progressed_enabled', props);
}

export function trackRelocatedEnabled(props: { person: 'A' | 'B' | 'both' }) {
  posthog.capture('relocated_enabled', props);
}

export function trackAsteroidsEnabled(props: { groups: string[] }) {
  posthog.capture('asteroids_enabled', props);
}

// ── Theme ───────────────────────────────────────────────────────────

export function trackThemeChanged(props: { theme: string }) {
  posthog.capture('theme_changed', props);
}

// ── Astro tools tabs ────────────────────────────────────────────────

export function trackToolTabViewed(props: { tab: string }) {
  posthog.capture('tool_tab_viewed', props);
}

// ── AI Reading ──────────────────────────────────────────────────────

export function trackAIReadingUsed(props: { reading_type: string }) {
  posthog.capture('ai_reading_used', props);
}

// ── Auth / Subscription ─────────────────────────────────────────────

export function trackSignUp() {
  posthog.capture('sign_up');
}

export function trackSignIn() {
  posthog.capture('sign_in');
}

export function trackUpgradeClicked() {
  posthog.capture('upgrade_clicked');
}

export function trackSubscriptionStarted(props: { plan: string }) {
  posthog.capture('subscription_started', props);
}

// ── Live Sessions ──────────────────────────────────────────────────

export function trackSessionStarted(props: { title: string }) {
  posthog.capture('session_started', props);
}

export function trackSessionEnded(props: { duration: number }) {
  posthog.capture('session_ended', props);
}

export function trackSessionReplayed(props: { session_id: string }) {
  posthog.capture('session_replayed', props);
}

export function trackSessionShared(props: { method: 'link' | 'email' }) {
  posthog.capture('session_shared', props);
}

// ── Insight Funnel ──────────────────────────────────────────────────

export function trackInsightPageViewed(props: { module: string }) {
  posthog.capture('insight_page_viewed', props);
}

export function trackInsightFormStarted(props: { module: string; field: string }) {
  posthog.capture('insight_form_started', props);
}

export function trackInsightFormSubmitted(props: { module: string; has_birth_time: boolean }) {
  posthog.capture('insight_form_submitted', props);
}

export function trackInsightTeaserViewed(props: { module: string; archetype: string }) {
  posthog.capture('insight_teaser_viewed', props);
}

export function trackInsightUnlockClicked(props: { module: string }) {
  posthog.capture('insight_unlock_clicked', props);
}

export function trackInsightPurchaseCompleted(props: { module: string }) {
  posthog.capture('insight_purchase_completed', props);
}

export function trackInsightLeadCaptured(props: { module: string }) {
  posthog.capture('insight_lead_captured', props);
}
