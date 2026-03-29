import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCommunityFeed, CommunityPost } from '@/hooks/useCommunityFeed';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import SpaceSidebar from '@/components/community/SpaceSidebar';
import FeedView from '@/components/community/FeedView';
import PostComposer from '@/components/community/PostComposer';
import ApplyToPostDialog from '@/components/community/ApplyToPostDialog';
import FlagDialog from '@/components/community/FlagDialog';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { NotificationBell } from '@/components/community/NotificationBell';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';

const CommunityPage = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const chartSnapshot = (location.state as any)?.chartSnapshot as string | undefined;
  const chartTitle = (location.state as any)?.chartTitle as string | undefined;
  const { spaces, posts, loading, loadingMore, hasMore, loadMore, refresh } = useCommunityFeed(spaceSlug);

  // Theme
  const [pageTheme] = useState(() => localStorage.getItem('astrologer_theme') || 'classic');
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);

  useEffect(() => {
    const dark = isThemeDark(pageTheme);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [pageTheme]);

  const [isPosterApproved, setIsPosterApproved] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [flagPostId, setFlagPostId] = useState<string | undefined>();
  const [feedPosts, setFeedPosts] = useState<CommunityPost[]>([]);

  useEffect(() => { setFeedPosts(posts); }, [posts]);

  useEffect(() => {
    if (!user) return;
    const checkStatus = async () => {
      // Check poster approval — try community profiles, gracefully handle if table doesn't exist
      try {
        const { data: profile, error: pErr } = await supabase.from('profiles').select('is_poster_approved').eq('id', user.id).single();
        if (!pErr) setIsPosterApproved(profile?.is_poster_approved || false);
      } catch { /* profiles table may not exist */ }
      const { data: app } = await supabase.from('community_poster_applications').select('status').eq('user_id', user.id).limit(1);
      if (app && app.length > 0) setApplicationStatus(app[0].status);
    };
    checkStatus();
  }, [user]);

  const handlePostUpdate = useCallback((postId: string, updates: Partial<CommunityPost>) => {
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
  }, []);

  return (
    <div className={`min-h-screen bg-background ${isThemeDark(pageTheme) ? 'dark' : ''}`} style={themeVars}>
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-1 hover:bg-muted rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Community</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ProfileDropdown />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <SpaceSidebar spaces={spaces} activeSlug={spaceSlug} />
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              {isPosterApproved ? (
                <PostComposer spaces={spaces} currentSpaceSlug={spaceSlug} onPostCreated={refresh} initialChartSnapshot={chartSnapshot} initialTitle={chartTitle} />
              ) : applicationStatus === 'pending' ? (
                <div className="bg-card border border-border rounded-xl p-4 text-center text-sm text-muted-foreground">
                  Your posting application is under review. You can still browse and comment.
                </div>
              ) : applicationStatus === 'rejected' ? (
                <div className="bg-card border border-border rounded-xl p-4 text-center text-sm text-muted-foreground">
                  Your application wasn't approved this time. You can still browse and comment.
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Want to share posts with the community?</span>
                  <ApplyToPostDialog onApplicationSubmitted={() => setApplicationStatus('pending')} />
                </div>
              )}
            </div>
            <FeedView posts={feedPosts} loading={loading} loadingMore={loadingMore} hasMore={hasMore} onLoadMore={loadMore} onPostUpdate={handlePostUpdate} onFlag={(postId) => setFlagPostId(postId)} />
          </div>
        </div>
      </div>

      <FlagDialog open={!!flagPostId} onOpenChange={(open) => !open && setFlagPostId(undefined)} postId={flagPostId} />
    </div>
  );
};

export default CommunityPage;
