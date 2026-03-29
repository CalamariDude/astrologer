import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CommunitySpace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_default: boolean;
}

export interface PostAuthor {
  id: string;
  first_name: string;
  display_name: string | null;
  photos: string[];
  avatar_url: string | null;
  is_poster_approved: boolean;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  space_id: string;
  title: string | null;
  body: string;
  media_urls: string[];
  chart_snapshot_url: string | null;
  chart_data: any;
  is_pinned: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  space: CommunitySpace;
  author: PostAuthor;
  user_has_liked: boolean;
}

const PAGE_SIZE = 20;

export function useCommunityFeed(spaceSlug?: string) {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchSpaces = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('community_spaces')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!err) setSpaces(data || []);
  }, []);

  const fetchPosts = useCallback(async (cursor?: string, append = false) => {
    if (!user || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      let spaceId: string | undefined;
      if (spaceSlug && spaceSlug !== 'all') {
        const { data: spaceData } = await supabase
          .from('community_spaces')
          .select('id')
          .eq('slug', spaceSlug)
          .single();
        spaceId = spaceData?.id;
      }

      let query = supabase
        .from('community_posts')
        .select(`*, space:community_spaces(*)`)
        .eq('is_hidden', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (spaceId) query = query.eq('space_id', spaceId);
      if (cursor) query = query.lt('created_at', cursor);

      const { data, error: err } = await query;
      if (err) throw err;

      const postsData = data || [];

      // Bulk-fetch author profiles — astrologer_profiles is primary, community profiles is optional
      const userIds = [...new Set(postsData.map(p => p.user_id).filter(Boolean))];
      let profilesMap: Record<string, PostAuthor> = {};
      if (userIds.length > 0) {
        // Primary: astrologer_profiles (always exists)
        const { data: astroProfiles } = await supabase
          .from('astrologer_profiles')
          .select('id, display_name')
          .in('id', userIds);
        for (const ap of (astroProfiles || [])) {
          profilesMap[ap.id] = { id: ap.id, first_name: ap.display_name || 'User', display_name: ap.display_name, photos: [], avatar_url: null, is_poster_approved: false } as unknown as PostAuthor;
        }
        // Optional: community profiles (may not exist yet)
        try {
          const { data: communityProfiles, error: cpErr } = await supabase
            .from('profiles')
            .select('id, first_name, display_name, photos, avatar_url, is_poster_approved')
            .in('id', userIds);
          if (!cpErr) {
            for (const p of (communityProfiles || [])) {
              const existing = profilesMap[p.id];
              profilesMap[p.id] = {
                ...existing,
                ...(p as unknown as PostAuthor),
                display_name: p.display_name || existing?.display_name || null,
              } as unknown as PostAuthor;
            }
          }
        } catch { /* profiles table may not exist */ }
      }

      let likedPostIds = new Set<string>();
      if (postsData.length > 0 && user) {
        const { data: likes } = await supabase
          .from('community_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsData.map(p => p.id));
        likedPostIds = new Set((likes || []).map(l => l.post_id).filter(Boolean) as string[]);
      }

      // Filter out hidden spaces from user preferences
      let hiddenSlugs: string[] = [];
      try { hiddenSlugs = JSON.parse(localStorage.getItem('community_hidden_spaces') || '[]'); } catch {}

      // Fetch blocked words from profile
      let blockedWords: string[] = [];
      if (user) {
        const { data: profile } = await supabase.from('astrologer_profiles').select('blocked_words').eq('id', user.id).single();
        blockedWords = (profile?.blocked_words || []).map((w: string) => w.toLowerCase());
      }

      const enriched: CommunityPost[] = postsData
        .map(p => ({
          ...p,
          media_urls: p.media_urls || [],
          space: p.space as unknown as CommunitySpace,
          author: profilesMap[p.user_id] || { id: p.user_id, first_name: 'User', display_name: null, photos: [], avatar_url: null, is_poster_approved: false },
          user_has_liked: likedPostIds.has(p.id),
        }))
        .filter(p => !hiddenSlugs.includes(p.space?.slug))
        .filter(p => {
          if (blockedWords.length === 0) return true;
          const text = `${p.title || ''} ${p.body}`.toLowerCase();
          return !blockedWords.some(w => text.includes(w));
        });

      if (append) setPosts(prev => [...prev, ...enriched]);
      else setPosts(enriched);

      setHasMore(postsData.length === PAGE_SIZE);
      if (postsData.length > 0) cursorRef.current = postsData[postsData.length - 1].created_at;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [user, spaceSlug]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchPosts(cursorRef.current || undefined, true);
  }, [fetchPosts, hasMore, loadingMore]);

  const refresh = useCallback(() => {
    cursorRef.current = null;
    setHasMore(true);
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => { fetchSpaces(); }, [fetchSpaces]);
  useEffect(() => {
    cursorRef.current = null;
    setHasMore(true);
    setPosts([]);
    fetchPosts();
  }, [fetchPosts]);

  return { spaces, posts, loading, loadingMore, hasMore, error, loadMore, refresh };
}
