-- 1. Fix topic CHECK constraint to include 'daily'
ALTER TABLE astrologer_horoscopes
  DROP CONSTRAINT IF EXISTS astrologer_horoscopes_topic_check;

ALTER TABLE astrologer_horoscopes
  ADD CONSTRAINT astrologer_horoscopes_topic_check
  CHECK (topic IN ('emotional', 'relationships', 'career', 'wellbeing', 'growth', 'timing', 'daily'));

-- 2. Add email tracking columns to astrologer_profiles
ALTER TABLE astrologer_profiles
  ADD COLUMN IF NOT EXISTS last_horoscope_email_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_unsubscribed boolean DEFAULT false;
