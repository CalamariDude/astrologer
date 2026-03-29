import { useState } from 'react';
import { Heart, Reply, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLike } from '@/hooks/useLike';
import { formatDistanceToNow } from './utils';
import CommentComposer from './CommentComposer';
import type { CommunityComment } from '@/hooks/usePostDetail';

interface CommentThreadProps {
  comment: CommunityComment;
  onReply: (body: string, parentId: string) => Promise<boolean>;
  onFlag?: (commentId: string) => void;
}

const CommentThread = ({ comment, onReply, onFlag }: CommentThreadProps) => {
  const navigate = useNavigate();
  const { toggleCommentLike } = useLike();
  const [liked, setLiked] = useState(comment.user_has_liked);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [showReply, setShowReply] = useState(false);

  const handleLike = async () => {
    await toggleCommentLike(comment.id, liked, (newLiked, delta) => { setLiked(newLiked); setLikeCount(prev => prev + delta); });
  };

  const handleReply = async (body: string) => {
    const success = await onReply(body, comment.id);
    if (success) setShowReply(false);
    return success;
  };

  const authorPhoto = comment.author?.avatar_url || comment.author?.photos?.[0];
  const authorName = comment.author?.display_name || comment.author?.first_name || 'Unknown';

  return (
    <div className="group">
      <div className="flex gap-3">
        <button onClick={() => navigate(`/community/profile/${comment.user_id}`)} className="shrink-0">
          {authorPhoto ? (
            <img src={authorPhoto} alt={authorName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">{authorName[0]}</div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="bg-muted/50 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/community/profile/${comment.user_id}`)} className="font-medium text-sm hover:underline">{authorName}</button>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment.created_at)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap mt-0.5">{comment.body}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-2">
            <button onClick={handleLike} className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
              <Heart className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />{likeCount > 0 && <span>{likeCount}</span>}
            </button>
            <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Reply className="w-3 h-3" />Reply
            </button>
            {onFlag && (
              <button onClick={() => onFlag(comment.id)} className="text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-3 h-3" />
              </button>
            )}
          </div>
          {showReply && <div className="mt-2"><CommentComposer onSubmit={handleReply} placeholder={`Reply to ${authorName}...`} compact /></div>}
          {comment.replies.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 border-l-2 border-border/50 pl-3">
              {comment.replies.map(reply => <CommentThread key={reply.id} comment={reply} onReply={onReply} onFlag={onFlag} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentThread;
