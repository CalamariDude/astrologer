import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus, Check } from 'lucide-react';
import { useNotifications, type CommunityNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from './utils';

const ICON_MAP: Record<CommunityNotification['type'], typeof Heart> = {
  post_like: Heart,
  comment_like: Heart,
  post_comment: MessageCircle,
  comment_reply: MessageCircle,
  new_follower: UserPlus,
};

const COLOR_MAP: Record<CommunityNotification['type'], string> = {
  post_like: 'text-red-500',
  comment_like: 'text-red-500',
  post_comment: 'text-blue-500',
  comment_reply: 'text-blue-500',
  new_follower: 'text-green-500',
};

function getNotificationText(n: CommunityNotification): string {
  const name = n.actor?.display_name || n.actor?.first_name || 'Someone';
  const postRef = n.post_title ? `"${n.post_title.slice(0, 40)}${n.post_title.length > 40 ? '...' : ''}"` : 'your post';
  switch (n.type) {
    case 'post_like': return `${name} liked ${postRef}`;
    case 'comment_like': return `${name} liked your comment`;
    case 'post_comment': return `${name} commented on ${postRef}`;
    case 'comment_reply': return `${name} replied to your comment`;
    case 'new_follower': return `${name} started following you`;
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = (n: CommunityNotification) => {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
    if (n.type === 'new_follower') {
      navigate(`/community/profile/${n.actor_id}`);
    } else if (n.post_id) {
      navigate(`/community/post/${n.post_id}`);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); }}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[340px]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
            ) : (
              notifications.map(n => {
                const Icon = ICON_MAP[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {n.actor?.avatar_url || n.actor?.photos?.[0] ? (
                        <img
                          src={n.actor.avatar_url || n.actor.photos[0]}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {(n.actor?.first_name || '?')[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        {getNotificationText(n)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Icon className={`w-3 h-3 ${COLOR_MAP[n.type]}`} />
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(n.created_at)}</span>
                      </div>
                    </div>
                    {!n.is_read && (
                      <div className="shrink-0 mt-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
