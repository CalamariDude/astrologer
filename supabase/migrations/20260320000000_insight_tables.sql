-- Insight Leads: email capture from insight landing pages
CREATE TABLE IF NOT EXISTS insight_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  birth_date text,
  birth_time text,
  birth_lat double precision,
  birth_lng double precision,
  birth_location text,
  module_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for marketing queries
CREATE INDEX idx_insight_leads_email ON insight_leads(email);
CREATE INDEX idx_insight_leads_module ON insight_leads(module_id);
CREATE INDEX idx_insight_leads_created ON insight_leads(created_at DESC);

-- Insight Purchases: one-time $10 reading purchases
CREATE TABLE IF NOT EXISTS insight_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  module_id text NOT NULL,
  stripe_session_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  birth_data jsonb,
  amount_cents integer DEFAULT 999,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_insight_purchases_user ON insight_purchases(user_id);
CREATE INDEX idx_insight_purchases_stripe ON insight_purchases(stripe_session_id);
CREATE INDEX idx_insight_purchases_status ON insight_purchases(status);

-- RLS Policies
ALTER TABLE insight_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_purchases ENABLE ROW LEVEL SECURITY;

-- Leads: anyone can insert (no auth required for lead capture)
CREATE POLICY "Anyone can insert insight leads"
  ON insight_leads FOR INSERT
  WITH CHECK (true);

-- Leads: only service role can read (for marketing)
CREATE POLICY "Service role can read insight leads"
  ON insight_leads FOR SELECT
  USING (auth.role() = 'service_role');

-- Purchases: authenticated users can see their own
CREATE POLICY "Users can view own purchases"
  ON insight_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Purchases: service role can manage all
CREATE POLICY "Service role can manage purchases"
  ON insight_purchases FOR ALL
  USING (auth.role() = 'service_role');

-- Purchases: edge functions can insert via authenticated user
CREATE POLICY "Authenticated users can insert purchases"
  ON insight_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);
