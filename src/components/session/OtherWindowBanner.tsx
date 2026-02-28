/**
 * OtherWindowBanner — Shows when a live session is active in another tab/window
 */

import React from 'react';
import { Radio, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OtherWindowBannerProps {
  title: string;
  onTakeOver: () => void;
  onDismiss: () => void;
  reconnecting?: boolean;
}

export const OtherWindowBanner: React.FC<OtherWindowBannerProps> = ({
  title,
  onTakeOver,
  onDismiss,
  reconnecting,
}) => {
  return (
    <div className="border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5">
      <div className="container max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Radio className="w-4 h-4 text-yellow-600 shrink-0 animate-pulse" />
          <p className="text-sm text-yellow-700 dark:text-yellow-400 truncate">
            <span className="font-medium">{title}</span> — session in progress in another window
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onTakeOver}
            disabled={reconnecting}
            className="gap-1.5 text-xs border-yellow-500/30 text-yellow-700 hover:bg-yellow-500/10"
          >
            <ArrowRight className="w-3 h-3" />
            {reconnecting ? 'Connecting...' : 'Switch Session Here'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss} className="text-xs px-2 text-yellow-600">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
