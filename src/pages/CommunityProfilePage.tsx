import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Globe, Link as LinkIcon } from 'lucide-react';
import { useCommunityProfile } from '@/hooks/useCommunityProfile';
import type { CommunityPost } from '@/hooks/useCommunityFeed';
import FollowButton from '@/components/community/FollowButton';
import PostCard from '@/components/community/PostCard';
import FlagDialog from '@/components/community/FlagDialog';

const CommunityProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile, posts, loading } = useCommunityProfile(userId);
  const [feedPosts, setFeedPosts] = useState<CommunityPost[]>([]);
  const [flagPostId, setFlagPostId] = useState<string | undefined>();

  useEffect(() => { setFeedPosts(posts); }, [posts]);

  const handlePostUpdate = useCallback((postId: string, updates: Partial<CommunityPost>) => {
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profile not found</p>
        <button onClick={() => navigate('/community')} className="text-primary hover:underline text-sm">Back to Community</button>
      </div>
    );
  }

  const displayName = profile.display_name || profile.first_name;
  const photo = profile.avatar_url || profile.photos?.[0];

  const socialLinks = [
    profile.website_url && { icon: <Globe className="w-4 h-4" />, url: profile.website_url, label: 'Website' },
    profile.linktree_url && { icon: <LinkIcon className="w-4 h-4" />, url: profile.linktree_url, label: 'Linktree' },
    profile.twitter_handle && { icon: <XIcon />, url: profile.twitter_handle.startsWith('http') ? profile.twitter_handle : `https://x.com/${profile.twitter_handle.replace('@', '')}`, label: 'X' },
    profile.instagram_handle && { icon: <InstagramIcon />, url: profile.instagram_handle.startsWith('http') ? profile.instagram_handle : `https://instagram.com/${profile.instagram_handle.replace('@', '')}`, label: 'Instagram' },
    profile.tiktok_handle && { icon: <TikTokIcon />, url: profile.tiktok_handle.startsWith('http') ? profile.tiktok_handle : `https://tiktok.com/@${profile.tiktok_handle.replace('@', '')}`, label: 'TikTok' },
    profile.youtube_url && { icon: <YoutubeIcon />, url: profile.youtube_url, label: 'YouTube' },
  ].filter(Boolean) as { icon: React.ReactNode; url: string; label: string }[];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-full"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold">{displayName}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            {photo ? <img src={photo} alt={displayName} className="w-20 h-20 rounded-full object-cover" /> : <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl font-medium">{displayName[0]}</div>}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{displayName}</h2>
                <FollowButton userId={profile.id} />
              </div>
              {profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
              <div className="flex items-center gap-6 mt-3 text-sm">
                <span><strong className="text-foreground">{profile.post_count}</strong> <span className="text-muted-foreground">posts</span></span>
                <span><strong className="text-foreground">{profile.follower_count}</strong> <span className="text-muted-foreground">followers</span></span>
                <span><strong className="text-foreground">{profile.following_count}</strong> <span className="text-muted-foreground">following</span></span>
              </div>
            </div>
          </div>

          {socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.icon}
                  <span className="text-xs">{link.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <h3 className="font-semibold mb-3">Posts</h3>
        {feedPosts.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No posts yet</div>
        ) : (
          <div className="flex flex-col gap-4">
            {feedPosts.map(post => <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdate} onFlag={(postId) => setFlagPostId(postId)} />)}
          </div>
        )}
      </div>

      <FlagDialog open={!!flagPostId} onOpenChange={(open) => !open && setFlagPostId(undefined)} postId={flagPostId} />
    </div>
  );
};

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.27 0 .54.04.8.1v-3.5a6.37 6.37 0 0 0-.8-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 10.86 4.48V12.8a8.28 8.28 0 0 0 5.58 2.16V11.5a4.85 4.85 0 0 1-3.36-1.36 4.85 4.85 0 0 1 3.36-3.45z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default CommunityProfilePage;
