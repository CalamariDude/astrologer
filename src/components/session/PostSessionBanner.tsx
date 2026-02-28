/**
 * PostSessionBanner — Shows after session ends with replay link and processing status
 */

import React, { useState } from 'react';
import { Link2, Check, X, Loader2, ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PostSessionBannerProps {
  title: string;
  replayUrl: string;
  status: string; // 'ended' | 'processing' | 'ready' | 'failed'
  guestEmail?: string;
  onDismiss: () => void;
}

export const PostSessionBanner: React.FC<PostSessionBannerProps> = ({
  title,
  replayUrl,
  status,
  guestEmail,
  onDismiss,
}) => {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(replayUrl);
    setLinkCopied(true);
    toast.success('Replay link copied!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const statusLabel = {
    ended: 'Processing started...',
    processing: 'Processing audio & transcript...',
    ready: 'Recording ready!',
    failed: 'Processing failed',
  }[status] || 'Session ended';

  const isProcessing = ['ended', 'processing'].includes(status);

  return (
    <div className="border-b border-border bg-muted/50 px-4 py-3">
      <div className="container max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0">
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : status === 'ready' ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{title} — {statusLabel}</p>
            <p className="text-xs text-muted-foreground truncate">
              {replayUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
            {linkCopied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
            {linkCopied ? 'Copied' : 'Copy Replay Link'}
          </Button>
          {status === 'ready' && (
            <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
              <a href={replayUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" /> Watch Replay
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDismiss} className="text-xs px-2">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
