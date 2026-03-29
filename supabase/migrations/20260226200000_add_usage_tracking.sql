-- Add usage tracking columns for AI readings and relocated charts
ALTER TABLE public.astrologer_profiles
  ADD COLUMN IF NOT EXISTS ai_credits_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_credits_reset_at timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  ADD COLUMN IF NOT EXISTS relocated_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS relocated_reset_at timestamptz NOT NULL DEFAULT date_trunc('month', now());
