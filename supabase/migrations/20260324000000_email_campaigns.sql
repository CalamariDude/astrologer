-- Email campaign tracking for marketing emails
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject text NOT NULL,
  content text NOT NULL,
  preheader text,
  cta_text text,
  cta_url text,
  audience text NOT NULL DEFAULT 'all_users',
  campaign_name text DEFAULT 'manual',
  recipients_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  resend_ids jsonb DEFAULT '[]'::jsonb,
  sent_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent ON email_campaigns(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_audience ON email_campaigns(audience);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Only service role (edge functions) can read/write campaigns
DO $$ BEGIN
  CREATE POLICY "Service role manages campaigns"
    ON email_campaigns FOR ALL
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Helper function to count leads by module
CREATE OR REPLACE FUNCTION insight_leads_by_module()
RETURNS TABLE(module_id text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT module_id, count(DISTINCT email) as count
  FROM insight_leads
  GROUP BY module_id
  ORDER BY count DESC;
$$;
