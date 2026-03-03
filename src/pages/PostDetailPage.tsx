import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Loader2 } from 'lucide-react';
import { usePostDetail } from '@/hooks/usePostDetail';
import { useLike } from '@/hooks/useLike';
import CommentThread from '@/components/community/CommentThread';
import CommentComposer from '@/components/community/CommentComposer';
import FlagDialog from '@/components/community/FlagDialog';
import { formatDistanceToNow } from '@/components/community/utils';
import { getThemeCSSVariables, isThemeDark } from '@/lib/chartThemeCSS';

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [pageTheme] = useState(() => localStorage.getItem('astrologer_theme') || 'classic');
  const themeVars = useMemo(() => getThemeCSSVariables(pageTheme) as React.CSSProperties, [pageTheme]);
  useEffect(() => {
    const dark = isThemeDark(pageTheme);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [pageTheme]);
  const { post, comments, loading, commentsLoading, addComment } = usePostDetail(postId);
  const { togglePostLike } = useLike();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [flagTarget, setFlagTarget] = useState<{ postId?: string; commentId?: string } | null>(null);

  if (post && liked !== post.user_has_liked) { setLiked(post.user_has_liked); setLikeCount(post.like_count); }

  const handleLike = async () => {
    if (!post) return;
    await togglePostLike(post.id, liked, (newLiked, delta) => { setLiked(newLiked); setLikeCount(prev => prev + delta); });
  };

  if (loading) {
    return <div className={`min-h-screen bg-background flex items-center justify-center ${isThemeDark(pageTheme) ? 'dark' : ''}`} style={themeVars}><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }
  if (!post) {
    return (
      <div className={`min-h-screen bg-background flex flex-col items-center justify-center gap-4 ${isThemeDark(pageTheme) ? 'dark' : ''}`} style={themeVars}>
        <p className="text-muted-foreground">Post not found</p>
        <button onClick={() => navigate('/community')} className="text-primary hover:underline text-sm">Back to Community</button>
      </div>
    );
  }

  const authorPhoto = post.author?.avatar_url || post.author?.photos?.[0];
  const authorName = post.author?.display_name || post.author?.first_name || 'Unknown';

  return (
    <div className={`min-h-screen bg-background ${isThemeDark(pageTheme) ? 'dark' : ''}`} style={themeVars}>
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-full"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold">Post</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <article className="bg-card border border-border rounded-xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(`/community/profile/${post.user_id}`)}>
              {authorPhoto ? <img src={authorPhoto} alt={authorName} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl font-medium">{authorName[0]}</div>}
            </button>
            <div>
              <button onClick={() => navigate(`/community/profile/${post.user_id}`)} className="font-semibold hover:underline">{authorName}</button>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: (post.space?.color || '#6366f1') + '20', color: post.space?.color || '#6366f1' }}>
                  {post.space?.icon} {post.space?.name}
                </span>
                <span>·</span>
                <span>{formatDistanceToNow(post.created_at)}</span>
              </div>
            </div>
          </div>

          {post.title && <h2 className="text-xl font-bold mb-2">{post.title}</h2>}
          <p className="text-foreground whitespace-pre-wrap leading-relaxed mb-4">{post.body}</p>

          {post.media_urls.length > 0 && (
            <div className={`mb-4 rounded-lg overflow-hidden ${post.media_urls.length === 1 ? '' : 'grid grid-cols-2 gap-1'}`}>
              {post.media_urls.map((url, i) => <img key={i} src={url} alt="" className="w-full max-h-[500px] object-cover" loading="lazy" />)}
            </div>
          )}

          {post.chart_snapshot_url && (
            <div className="mb-4 rounded-lg overflow-hidden border border-border">
              <img src={post.chart_snapshot_url} alt="Chart" className="w-full max-h-96 object-contain bg-background" />
            </div>
          )}

          <div className="flex items-center gap-6 pt-3 border-t border-border/50">
            <button onClick={handleLike} className={`flex items-center gap-2 text-sm transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{Math.max(0, likeCount)} {Math.max(0, likeCount) === 1 ? 'like' : 'likes'}</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
              <span>{post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
            </div>
            <button onClick={() => setFlagTarget({ postId: post.id })} className="text-sm text-muted-foreground hover:text-foreground ml-auto">Report</button>
          </div>
        </article>

        <div className="mb-4"><CommentComposer onSubmit={(body) => addComment(body)} /></div>

        {commentsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No comments yet. Be the first!</div>
        ) : (
          <div className="flex flex-col gap-4">
            {comments.map(comment => (
              <CommentThread key={comment.id} comment={comment} onReply={(body, parentId) => addComment(body, parentId)} onFlag={(commentId) => setFlagTarget({ commentId })} />
            ))}
          </div>
        )}
      </div>

      <FlagDialog open={!!flagTarget} onOpenChange={(open) => !open && setFlagTarget(null)} postId={flagTarget?.postId} commentId={flagTarget?.commentId} />
    </div>
  );
};

export default PostDetailPage;
