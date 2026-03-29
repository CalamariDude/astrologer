-- Note: subscription_tier column with 'horoscope' in CHECK was created in the combined
-- migration run via SQL Editor. This file only contains the horoscope table creation.

-- Create astrologer_horoscopes table
CREATE TABLE IF NOT EXISTS astrologer_horoscopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL CHECK (topic IN ('emotional', 'relationships', 'career', 'wellbeing', 'growth', 'timing')),
  horoscope_date date NOT NULL DEFAULT CURRENT_DATE,
  content text NOT NULL,
  transit_summary jsonb,
  natal_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index: one horoscope per user per topic per day (cache key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_horoscopes_user_topic_date
  ON astrologer_horoscopes (user_id, topic, horoscope_date);

-- Index for fast lookups by user + date
CREATE INDEX IF NOT EXISTS idx_horoscopes_user_date
  ON astrologer_horoscopes (user_id, horoscope_date);

-- Step 3: RLS policies
ALTER TABLE astrologer_horoscopes ENABLE ROW LEVEL SECURITY;

-- Users can read their own horoscopes
CREATE POLICY "Users can read own horoscopes"
  ON astrologer_horoscopes FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (edge function uses service role key)
CREATE POLICY "Service role can insert horoscopes"
  ON astrologer_horoscopes FOR INSERT
  WITH CHECK (true);
