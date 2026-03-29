-- Add 'daily' to the topic CHECK constraint on astrologer_horoscopes
-- The original constraint only allowed: emotional, relationships, career, wellbeing, growth, timing
-- But the daily horoscope edge function uses topic = 'daily'

ALTER TABLE astrologer_horoscopes DROP CONSTRAINT IF EXISTS astrologer_horoscopes_topic_check;
ALTER TABLE astrologer_horoscopes ADD CONSTRAINT astrologer_horoscopes_topic_check
  CHECK (topic IN ('daily', 'emotional', 'relationships', 'career', 'wellbeing', 'growth', 'timing'));
