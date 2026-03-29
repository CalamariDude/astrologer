-- Add unsubscribe tracking to insight_leads
ALTER TABLE insight_leads ADD COLUMN IF NOT EXISTS email_unsubscribed boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_insight_leads_unsub ON insight_leads(email_unsubscribed);
