import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CommunityNotification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: 'post_like' | 'post_comment' | 'comment_like' | 'comment_reply' | 'new_follower';
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    display_name: string | null;
    first_name: string;
    avatar_url: string | null;
    photos: string[];
  };
  post_title?: string | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('community_notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      const items = data || [];

      // Fetch actor profiles
      const actorIds = [...new Set(items.map(n => n.actor_id))];
      const actorMap: Record<string, CommunityNotification['actor']> = {};
      if (actorIds.length > 0) {
        const { data: astro } = await supabase
          .from('astrologer_profiles')
          .select('id, display_name')
          .in('id', actorIds);
        for (const a of (astro || [])) {
          actorMap[a.id] = { display_name: a.display_name, first_name: a.display_name || 'User', avatar_url: null, photos: [] };
        }
        try {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, display_name, photos, avatar_url')
            .in('id', actorIds);
          for (const p of (profiles || [])) {
            const existing = actorMap[p.id];
            actorMap[p.id] = {
              ...(existing || { display_name: null, first_name: 'User', avatar_url: null, photos: [] }),
              first_name: p.first_name || existing?.first_name || 'User',
              display_name: p.display_name || existing?.display_name,
              avatar_url: p.avatar_url,
              photos: p.photos || [],
            };
          }
        } catch { /* profiles table may not exist */ }
      }

      // Fetch post titles for post-related notifications
      const postIds = [...new Set(items.filter(n => n.post_id).map(n => n.post_id!))];
      const postMap: Record<string, string | null> = {};
      if (postIds.length > 0) {
        const { data: posts } = await supabase
          .from('community_posts')
          .select('id, title')
          .in('id', postIds);
        for (const p of (posts || [])) {
          postMap[p.id] = p.title;
        }
      }

      const enriched: CommunityNotification[] = items.map(n => ({
        ...n,
        actor: actorMap[n.actor_id],
        post_title: n.post_id ? postMap[n.post_id] : null,
      }));

      setNotifications(enriched);
      setUnreadCount(enriched.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from('community_notifications')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, [user]);

  // Mark single as read
  const markRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('community_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel('community_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_notifications',
        filter: `recipient_id=eq.${user.id}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  return { notifications, unreadCount, loading, markAllRead, markRead, refresh: fetchNotifications };
}
