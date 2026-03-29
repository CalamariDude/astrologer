-- Insight Readings: stored completed readings with shareable UUID
CREATE TABLE IF NOT EXISTS insight_readings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id uuid REFERENCES insight_purchases(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  module_id text NOT NULL,
  reading_text text NOT NULL,
  technical_text text,
  journey_data jsonb,
  birth_data jsonb,
  chart_data jsonb,
  module_title text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_insight_readings_user ON insight_readings(user_id);
CREATE INDEX idx_insight_readings_module ON insight_readings(module_id);

ALTER TABLE insight_readings ENABLE ROW LEVEL SECURITY;

-- Anyone can read (shareable public links)
CREATE POLICY "Anyone can view insight readings"
  ON insight_readings FOR SELECT
  USING (true);

-- Service role manages all
CREATE POLICY "Service role can manage insight readings"
  ON insight_readings FOR ALL
  USING (auth.role() = 'service_role');
