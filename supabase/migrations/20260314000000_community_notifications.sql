-- Community Notifications: table, preferences, triggers
-- ============================================================

-- 1. Notification preferences on astrologer_profiles
-- ============================================================
ALTER TABLE astrologer_profiles
  ADD COLUMN IF NOT EXISTS notify_post_likes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_post_comments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_comment_likes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_comment_replies boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_followers boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_community boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_push_community boolean NOT NULL DEFAULT true;


-- 2. community_notifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS community_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('post_like', 'post_comment', 'comment_like', 'comment_reply', 'new_follower')),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_notif_recipient ON community_notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_community_notif_created ON community_notifications(created_at DESC);

ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON community_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own notifications"
  ON community_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Allow system (triggers) to insert
CREATE POLICY "System can insert notifications"
  ON community_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- 3. Trigger: create notification on post like
-- ============================================================
CREATE OR REPLACE FUNCTION community_notify_post_like()
RETURNS trigger AS $$
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    INSERT INTO community_notifications (recipient_id, actor_id, type, post_id)
    SELECT cp.user_id, NEW.user_id, 'post_like', NEW.post_id
    FROM community_posts cp
    WHERE cp.id = NEW.post_id
      AND cp.user_id != NEW.user_id  -- Don't notify self-likes
      AND EXISTS (
        SELECT 1 FROM astrologer_profiles ap
        WHERE ap.id = cp.user_id AND ap.notify_post_likes = true
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_community_notify_post_like
  AFTER INSERT ON community_likes
  FOR EACH ROW
  EXECUTE FUNCTION community_notify_post_like();


-- 4. Trigger: create notification on comment (post author gets notified)
-- ============================================================
CREATE OR REPLACE FUNCTION community_notify_post_comment()
RETURNS trigger AS $$
BEGIN
  -- Notify the post author
  INSERT INTO community_notifications (recipient_id, actor_id, type, post_id, comment_id)
  SELECT cp.user_id, NEW.user_id, 'post_comment', NEW.post_id, NEW.id
  FROM community_posts cp
  WHERE cp.id = NEW.post_id
    AND cp.user_id != NEW.user_id
    AND EXISTS (
      SELECT 1 FROM astrologer_profiles ap
      WHERE ap.id = cp.user_id AND ap.notify_post_comments = true
    );

  -- Notify parent comment author (for replies)
  IF NEW.parent_comment_id IS NOT NULL THEN
    INSERT INTO community_notifications (recipient_id, actor_id, type, post_id, comment_id)
    SELECT pc.user_id, NEW.user_id, 'comment_reply', NEW.post_id, NEW.id
    FROM community_comments pc
    WHERE pc.id = NEW.parent_comment_id
      AND pc.user_id != NEW.user_id
      AND pc.user_id != (SELECT user_id FROM community_posts WHERE id = NEW.post_id)  -- Avoid double-notifying post author
      AND EXISTS (
        SELECT 1 FROM astrologer_profiles ap
        WHERE ap.id = pc.user_id AND ap.notify_comment_replies = true
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_community_notify_post_comment
  AFTER INSERT ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION community_notify_post_comment();


-- 5. Trigger: create notification on comment like
-- ============================================================
CREATE OR REPLACE FUNCTION community_notify_comment_like()
RETURNS trigger AS $$
BEGIN
  IF NEW.comment_id IS NOT NULL THEN
    INSERT INTO community_notifications (recipient_id, actor_id, type, comment_id)
    SELECT cc.user_id, NEW.user_id, 'comment_like', NEW.comment_id
    FROM community_comments cc
    WHERE cc.id = NEW.comment_id
      AND cc.user_id != NEW.user_id
      AND EXISTS (
        SELECT 1 FROM astrologer_profiles ap
        WHERE ap.id = cc.user_id AND ap.notify_comment_likes = true
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_community_notify_comment_like
  AFTER INSERT ON community_likes
  FOR EACH ROW
  EXECUTE FUNCTION community_notify_comment_like();


-- 6. Trigger: create notification on new follower
-- ============================================================
CREATE OR REPLACE FUNCTION community_notify_new_follower()
RETURNS trigger AS $$
BEGIN
  INSERT INTO community_notifications (recipient_id, actor_id, type)
  SELECT NEW.following_id, NEW.follower_id, 'new_follower'
  WHERE NEW.following_id != NEW.follower_id
    AND EXISTS (
      SELECT 1 FROM astrologer_profiles ap
      WHERE ap.id = NEW.following_id AND ap.notify_new_followers = true
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_community_notify_new_follower
  AFTER INSERT ON community_follows
  FOR EACH ROW
  EXECUTE FUNCTION community_notify_new_follower();


-- 7. Web push subscriptions table
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  platform text NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_push_sub UNIQUE (user_id, endpoint)
);

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 8. Cleanup: auto-delete old read notifications (>30 days)
-- ============================================================
CREATE OR REPLACE FUNCTION community_cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM community_notifications
  WHERE is_read = true AND created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
