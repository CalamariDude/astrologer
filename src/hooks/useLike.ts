import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useLike() {
  const { user } = useAuth();
  const [pending, setPending] = useState<Set<string>>(new Set());

  const togglePostLike = useCallback(async (
    postId: string,
    currentlyLiked: boolean,
    onOptimistic: (liked: boolean, delta: number) => void
  ) => {
    if (!user || pending.has(postId)) return;
    setPending(prev => new Set(prev).add(postId));
    onOptimistic(!currentlyLiked, currentlyLiked ? -1 : 1);
    try {
      if (currentlyLiked) {
        const { error } = await supabase.from('community_likes').delete().eq('user_id', user.id).eq('post_id', postId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('community_likes').insert({ user_id: user.id, post_id: postId });
        if (error) throw error;
      }
    } catch {
      onOptimistic(currentlyLiked, currentlyLiked ? 1 : -1);
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(postId); return n; });
    }
  }, [user, pending]);

  const toggleCommentLike = useCallback(async (
    commentId: string,
    currentlyLiked: boolean,
    onOptimistic: (liked: boolean, delta: number) => void
  ) => {
    if (!user || pending.has(commentId)) return;
    setPending(prev => new Set(prev).add(commentId));
    onOptimistic(!currentlyLiked, currentlyLiked ? -1 : 1);
    try {
      if (currentlyLiked) {
        const { error } = await supabase.from('community_likes').delete().eq('user_id', user.id).eq('comment_id', commentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('community_likes').insert({ user_id: user.id, comment_id: commentId });
        if (error) throw error;
      }
    } catch {
      onOptimistic(currentlyLiked, currentlyLiked ? 1 : -1);
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(commentId); return n; });
    }
  }, [user, pending]);

  return { togglePostLike, toggleCommentLike };
}
