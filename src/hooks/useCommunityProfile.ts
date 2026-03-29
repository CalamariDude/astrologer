import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CommunityPost, CommunitySpace, PostAuthor } from './useCommunityFeed';
import { useAuth } from '@/contexts/AuthContext';

export interface CommunityProfile {
  id: string;
  first_name: string;
  display_name: string | null;
  photos: string[];
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  linktree_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_url: string | null;
  is_poster_approved: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
}

export function useCommunityProfile(userId: string | undefined) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      // Start with astrologer_profiles as base
      const { data: astro } = await supabase.from('astrologer_profiles').select('id, display_name').eq('id', userId).single();
      let merged: Partial<CommunityProfile> = {
        id: userId, first_name: astro?.display_name || 'User', display_name: astro?.display_name || null,
        photos: [], avatar_url: null, bio: null, is_poster_approved: false,
        follower_count: 0, following_count: 0, post_count: 0,
      };
      // Try community profiles (may not exist)
      try {
        const { data, error: err } = await supabase
          .from('profiles')
          .select('id, first_name, display_name, photos, avatar_url, bio, website_url, linktree_url, twitter_handle, instagram_handle, tiktok_handle, youtube_url, is_poster_approved, follower_count, following_count, post_count')
          .eq('id', userId)
          .single();
        if (!err && data) merged = { ...merged, ...data, display_name: data.display_name || merged.display_name };
      } catch { /* profiles table may not exist */ }
      setProfile(merged as CommunityProfile);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    if (!userId || !currentUser) return;
    try {
      const { data, error: err } = await supabase
        .from('community_posts')
        .select(`*, space:community_spaces(*)`)
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (err) throw err;

      const postsData = data || [];

      // Fetch author profile — astrologer_profiles primary
      let author: PostAuthor = { id: userId, first_name: 'User', display_name: null, photos: [], avatar_url: null, is_poster_approved: false };
      const { data: astroAuthor } = await supabase.from('astrologer_profiles').select('display_name').eq('id', userId).single();
      if (astroAuthor?.display_name) author = { ...author, display_name: astroAuthor.display_name, first_name: astroAuthor.display_name };
      try {
        const { data: authorProfile, error: apErr } = await supabase.from('profiles').select('id, first_name, display_name, photos, avatar_url, is_poster_approved').eq('id', userId).single();
        if (!apErr && authorProfile) author = { ...author, ...(authorProfile as unknown as PostAuthor), display_name: authorProfile.display_name || author.display_name };
      } catch { /* profiles table may not exist */ }

      let likedPostIds = new Set<string>();
      if (postsData.length > 0) {
        const { data: likes } = await supabase
          .from('community_likes')
          .select('post_id')
          .eq('user_id', currentUser.id)
          .in('post_id', postsData.map(p => p.id));
        likedPostIds = new Set((likes || []).map(l => l.post_id).filter(Boolean) as string[]);
      }

      setPosts(postsData.map(p => ({
        ...p,
        media_urls: p.media_urls || [],
        space: p.space as unknown as CommunitySpace,
        author,
        user_has_liked: likedPostIds.has(p.id),
      })));
    } catch (err) {
      console.error('Error fetching user posts:', err);
    }
  }, [userId, currentUser]);

  useEffect(() => { fetchProfile(); fetchPosts(); }, [fetchProfile, fetchPosts]);

  return { profile, posts, loading, error, refresh: () => { fetchProfile(); fetchPosts(); } };
}
