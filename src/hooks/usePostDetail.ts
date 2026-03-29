import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { CommunityPost, CommunitySpace, PostAuthor } from './useCommunityFeed';

export interface CommentAuthor {
  id: string;
  first_name: string;
  display_name: string | null;
  photos: string[];
  avatar_url: string | null;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  like_count: number;
  created_at: string;
  author: CommentAuthor;
  user_has_liked: boolean;
  replies: CommunityComment[];
}

export function usePostDetail(postId: string | undefined) {
  const { user } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId || !user) return;
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('community_posts')
        .select(`*, space:community_spaces(*)`)
        .eq('id', postId)
        .single();
      if (err) throw err;

      // Fetch author profile — astrologer_profiles primary, community profiles optional
      let author: PostAuthor = { id: data.user_id, first_name: 'User', display_name: null, photos: [], avatar_url: null, is_poster_approved: false };
      const { data: astro } = await supabase.from('astrologer_profiles').select('display_name').eq('id', data.user_id).single();
      if (astro?.display_name) author = { ...author, display_name: astro.display_name, first_name: astro.display_name };
      try {
        const { data: profile, error: pErr } = await supabase.from('profiles').select('id, first_name, display_name, photos, avatar_url, is_poster_approved').eq('id', data.user_id).single();
        if (!pErr && profile) author = { ...author, ...(profile as unknown as PostAuthor), display_name: profile.display_name || author.display_name };
      } catch { /* profiles table may not exist */ }

      const { data: likes } = await supabase
        .from('community_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .limit(1);

      setPost({
        ...data,
        media_urls: data.media_urls || [],
        space: data.space as unknown as CommunitySpace,
        author,
        user_has_liked: (likes || []).length > 0,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  const fetchComments = useCallback(async () => {
    if (!postId || !user) return;
    try {
      setCommentsLoading(true);
      const { data, error: err } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });
      if (err) throw err;

      const allComments = data || [];

      // Bulk-fetch author profiles — astrologer_profiles primary, community profiles optional
      const userIds = [...new Set(allComments.map(c => c.user_id).filter(Boolean))];
      let profilesMap: Record<string, CommentAuthor> = {};
      if (userIds.length > 0) {
        const { data: astroProfiles } = await supabase
          .from('astrologer_profiles')
          .select('id, display_name')
          .in('id', userIds);
        for (const ap of (astroProfiles || [])) {
          profilesMap[ap.id] = { id: ap.id, first_name: ap.display_name || 'User', display_name: ap.display_name, photos: [], avatar_url: null } as unknown as CommentAuthor;
        }
        try {
          const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('id, first_name, display_name, photos, avatar_url')
            .in('id', userIds);
          if (!pErr) {
            for (const p of (profiles || [])) {
              const existing = profilesMap[p.id];
              profilesMap[p.id] = { ...existing, ...(p as unknown as CommentAuthor), display_name: p.display_name || existing?.display_name || null } as unknown as CommentAuthor;
            }
          }
        } catch { /* profiles table may not exist */ }
      }

      let likedCommentIds = new Set<string>();
      if (allComments.length > 0) {
        const { data: likes } = await supabase
          .from('community_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', allComments.map(c => c.id));
        likedCommentIds = new Set((likes || []).map(l => l.comment_id).filter(Boolean) as string[]);
      }

      const defaultAuthor: CommentAuthor = { id: '', first_name: 'User', display_name: null, photos: [], avatar_url: null };
      const commentMap = new Map<string, CommunityComment>();
      const topLevel: CommunityComment[] = [];
      for (const c of allComments) {
        commentMap.set(c.id, { ...c, author: profilesMap[c.user_id] || { ...defaultAuthor, id: c.user_id }, user_has_liked: likedCommentIds.has(c.id), replies: [] });
      }
      for (const c of allComments) {
        const comment = commentMap.get(c.id)!;
        if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
          commentMap.get(c.parent_comment_id)!.replies.push(comment);
        } else {
          topLevel.push(comment);
        }
      }
      setComments(topLevel);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, [postId, user]);

  const addComment = useCallback(async (body: string, parentCommentId?: string) => {
    if (!postId || !user) return false;
    try {
      const { error: err } = await supabase
        .from('community_comments')
        .insert({ post_id: postId, user_id: user.id, parent_comment_id: parentCommentId || null, body });
      if (err) throw err;
      await Promise.all([fetchComments(), fetchPost()]);
      return true;
    } catch { return false; }
  }, [postId, user, fetchComments, fetchPost]);

  useEffect(() => { fetchPost(); fetchComments(); }, [fetchPost, fetchComments]);

  return { post, comments, loading, commentsLoading, error, addComment, refreshComments: fetchComments, refreshPost: fetchPost };
}
