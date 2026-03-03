CREATE TABLE astrologer_sign_horoscopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sign text NOT NULL,
  period text NOT NULL DEFAULT 'daily',  -- 'daily', 'weekly', 'monthly'
  horoscope_date date NOT NULL DEFAULT CURRENT_DATE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_sign_horoscopes_sign_period_date ON astrologer_sign_horoscopes (sign, period, horoscope_date);
ALTER TABLE astrologer_sign_horoscopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sign horoscopes" ON astrologer_sign_horoscopes FOR SELECT USING (true);
CREATE POLICY "Service role can insert sign horoscopes" ON astrologer_sign_horoscopes FOR INSERT WITH CHECK (true);
