import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { useLike } from '@/hooks/useLike';
import type { CommunityPost } from '@/hooks/useCommunityFeed';
import { useState } from 'react';
import { formatDistanceToNow } from './utils';

interface PostCardProps {
  post: CommunityPost;
  onPostUpdate: (postId: string, updates: Partial<CommunityPost>) => void;
  onFlag?: (postId: string) => void;
}

const PostCard = ({ post, onPostUpdate, onFlag }: PostCardProps) => {
  const navigate = useNavigate();
  const { togglePostLike } = useLike();
  const [liked, setLiked] = useState(post.user_has_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const authorPhoto = post.author?.avatar_url || post.author?.photos?.[0];
  const authorName = post.author?.display_name || post.author?.first_name || 'Unknown';

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await togglePostLike(post.id, liked, (newLiked, delta) => {
      setLiked(newLiked);
      setLikeCount(prev => prev + delta);
      onPostUpdate(post.id, { user_has_liked: newLiked, like_count: likeCount + delta });
    });
  };

  const bodyPreview = post.body.length > 300 ? post.body.slice(0, 300) + '...' : post.body;

  return (
    <article
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={() => navigate(`/community/post/${post.id}`)}
    >
      <div className="flex items-center gap-3 mb-3">
        <button onClick={(e) => { e.stopPropagation(); navigate(`/community/profile/${post.user_id}`); }} className="shrink-0">
          {authorPhoto ? (
            <img src={authorPhoto} alt={authorName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-medium">{authorName[0]}</div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/community/profile/${post.user_id}`); }} className="font-medium text-sm hover:underline">{authorName}</button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: (post.space?.color || '#6366f1') + '20', color: post.space?.color || '#6366f1' }}>
              {post.space?.icon} {post.space?.name}
            </span>
            <span>·</span>
            <span>{formatDistanceToNow(post.created_at)}</span>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onFlag?.(post.id); }} className="p-1 rounded-full hover:bg-muted text-muted-foreground">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {post.title && <h3 className="font-semibold text-base mb-1">{post.title}</h3>}
      <p className="text-sm text-foreground/80 whitespace-pre-wrap mb-3 leading-relaxed">{bodyPreview}</p>

      {post.media_urls.length > 0 && (
        <div className={`mb-3 rounded-lg overflow-hidden ${post.media_urls.length === 1 ? '' : 'grid grid-cols-2 gap-1'}`}>
          {post.media_urls.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" className="w-full h-48 object-cover" loading="lazy" />
          ))}
        </div>
      )}

      {post.chart_snapshot_url && (
        <div className="mb-3 rounded-lg overflow-hidden border border-border">
          <img src={post.chart_snapshot_url} alt="Chart" className="w-full max-h-64 object-contain bg-background" loading="lazy" />
        </div>
      )}

      {post.is_pinned && <div className="mb-3 text-xs text-amber-500 font-medium">Pinned</div>}

      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
        <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span>{Math.max(0, likeCount)}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comment_count}</span>
        </button>
      </div>
    </article>
  );
};

export default PostCard;
