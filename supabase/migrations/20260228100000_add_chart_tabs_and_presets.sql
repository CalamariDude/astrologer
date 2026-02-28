-- Add chart_tabs and presets JSONB columns to astrologer_profiles
-- chart_tabs: persists open chart tabs across sessions
-- presets: persists chart display presets to user profile (previously localStorage only)

ALTER TABLE astrologer_profiles
  ADD COLUMN IF NOT EXISTS chart_tabs jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS presets jsonb DEFAULT '[]'::jsonb NOT NULL;
