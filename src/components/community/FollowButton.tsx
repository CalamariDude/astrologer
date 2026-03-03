import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/contexts/AuthContext';

const FollowButton = ({ userId }: { userId: string }) => {
  const { user } = useAuth();
  const { isFollowing, toggleFollow, loading } = useFollow(userId);
  if (user?.id === userId) return null;

  return (
    <Button variant={isFollowing ? 'outline' : 'default'} size="sm" onClick={toggleFollow} disabled={loading} className="gap-1.5">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : isFollowing ? <><UserMinus className="w-3 h-3" />Following</> : <><UserPlus className="w-3 h-3" />Follow</>}
    </Button>
  );
};

export default FollowButton;
