-- Add last_active_at to astrologer_profiles for accurate "Last Active" tracking
ALTER TABLE astrologer_profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Index for sorting by last active
CREATE INDEX IF NOT EXISTS idx_astrologer_profiles_last_active_at
  ON astrologer_profiles (last_active_at DESC NULLS LAST);
