import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    const check = async () => {
      const { data } = await supabase
        .from('community_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .limit(1);
      setIsFollowing((data || []).length > 0);
    };
    check();
  }, [user, targetUserId]);

  const toggle = useCallback(async () => {
    if (!user || !targetUserId || loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase.from('community_follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
        setIsFollowing(false);
      } else {
        await supabase.from('community_follows').insert({ follower_id: user.id, following_id: targetUserId });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, isFollowing, loading]);

  return { isFollowing, toggleFollow: toggle, loading };
}
