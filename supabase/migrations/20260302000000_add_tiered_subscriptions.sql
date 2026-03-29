-- Add tiered subscription columns to astrologer_profiles
ALTER TABLE astrologer_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'lite'
    CHECK (subscription_tier IN ('lite', 'horoscope', 'astrologer', 'professional')),
  ADD COLUMN IF NOT EXISTS sessions_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions_reset_at timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  ADD COLUMN IF NOT EXISTS transcriptions_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transcriptions_reset_at timestamptz NOT NULL DEFAULT date_trunc('month', now());

-- Backfill: existing active/trialing subscribers → 'professional', everyone else → 'lite'
UPDATE astrologer_profiles
SET subscription_tier = 'professional'
WHERE subscription_status IN ('active', 'trialing');

UPDATE astrologer_profiles
SET subscription_tier = 'lite'
WHERE subscription_status NOT IN ('active', 'trialing')
   OR subscription_status IS NULL;
