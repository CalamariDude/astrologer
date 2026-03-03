import { useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import PostCard from './PostCard';
import type { CommunityPost } from '@/hooks/useCommunityFeed';

interface FeedViewProps {
  posts: CommunityPost[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onPostUpdate: (postId: string, updates: Partial<CommunityPost>) => void;
  onFlag?: (postId: string) => void;
}

const FeedView = ({ posts, loading, loadingMore, hasMore, onLoadMore, onPostUpdate, onFlag }: FeedViewProps) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loadingMore) onLoadMore();
  }, [hasMore, loadingMore, onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1"><div className="h-4 w-24 bg-muted rounded" /><div className="h-3 w-32 bg-muted rounded mt-1" /></div>
            </div>
            <div className="h-4 w-3/4 bg-muted rounded mb-2" />
            <div className="h-4 w-full bg-muted rounded mb-2" />
            <div className="h-4 w-1/2 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">📝</p>
        <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} onPostUpdate={onPostUpdate} onFlag={onFlag} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default FeedView;
