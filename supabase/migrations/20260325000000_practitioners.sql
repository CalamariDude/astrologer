-- ============================================================
-- Practitioners directory table
-- ============================================================

CREATE TABLE public.practitioners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  headline text,
  bio text,
  photo_url text,
  specialties text[] DEFAULT '{}',
  years_experience integer,
  hourly_rate_min integer,
  hourly_rate_max integer,
  currency text DEFAULT 'USD',
  booking_url text,
  website_url text,
  instagram_handle text,
  twitter_handle text,
  tiktok_handle text,
  youtube_url text,
  linktree_url text,
  location text,
  timezone text,
  languages text[] DEFAULT '{English}',
  offers_virtual boolean DEFAULT true,
  offers_in_person boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  is_claimed boolean DEFAULT false,
  claimed_at timestamptz,
  claim_token uuid DEFAULT gen_random_uuid(),
  sort_order integer DEFAULT 1000,
  status text DEFAULT 'draft' CHECK (status IN ('draft','active','suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_practitioners_status ON practitioners(status);
CREATE INDEX idx_practitioners_slug ON practitioners(slug);
CREATE INDEX idx_practitioners_specialties ON practitioners USING GIN(specialties);
CREATE INDEX idx_practitioners_sort ON practitioners(is_featured DESC, sort_order ASC);
CREATE INDEX idx_practitioners_claim_token ON practitioners(claim_token);

-- RLS
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active practitioners"
  ON practitioners FOR SELECT
  USING (status = 'active');

CREATE POLICY "Owners can update own practitioner"
  ON practitioners FOR UPDATE
  USING (auth.uid() = user_id AND is_claimed = true);

-- Auto-update timestamp trigger (reuse existing function)
CREATE TRIGGER practitioners_updated_at
  BEFORE UPDATE ON practitioners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
