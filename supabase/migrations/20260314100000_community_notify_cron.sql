-- Cron job: send community notification emails every 15 minutes
-- NOTE: Run this manually in the SQL Editor after replacing YOUR_SERVICE_ROLE_KEY
-- You can find it in Supabase Dashboard > Settings > API > service_role key

SELECT cron.schedule(
  'community-notify-emails',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aiwfqmgugpvmbrkkhpgs.supabase.co/functions/v1/astrologer-community-notify',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
