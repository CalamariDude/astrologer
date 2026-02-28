/**
 * StartSessionButton — Shows in ChartPage toolbar
 * Gated behind isPaid check, hidden on mobile.
 * When session is active, shows "End Session" with confirmation.
 */

import React, { useState } from 'react';
import { Radio, Square, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { toast } from 'sonner';

interface StartSessionButtonProps {
  onStart: (title: string) => Promise<void>;
  onEnd?: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export const StartSessionButton: React.FC<StartSessionButtonProps> = ({ onStart, onEnd, isActive, disabled }) => {
  const { user } = useAuth();
  const { isPaid } = useSubscription();
  const [showDialog, setShowDialog] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [title, setTitle] = useState('');
  const [starting, setStarting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Hide on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile) return null;

  const isLocked = !isPaid && !isActive;

  const handleClick = () => {
    if (isActive) {
      setShowEndConfirm(true);
      return;
    }
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!isPaid) {
      return;
    }
    setShowDialog(true);
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await onStart(title || 'Untitled Session');
      setShowDialog(false);
      setTitle('');
    } catch (err) {
      console.error('Failed to start session:', err);
      toast.error((err as Error).message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  const handleEnd = () => {
    setShowEndConfirm(false);
    onEnd?.();
  };

  return (
    <>
      <Button
        variant={isActive ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className={`gap-1.5 text-xs ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isLocked ? 'Due to server costs, Live Session is for professional users only. Please upgrade to access this feature.' : undefined}
      >
        {isActive ? (
          <>
            <Square className="w-3 h-3 fill-current" />
            End Session
          </>
        ) : (
          <>
            {isLocked ? <Lock className="w-3 h-3" /> : <Radio className="w-3.5 h-3.5" />}
            Live Session
          </>
        )}
      </Button>

      {/* Start dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDialog(false)}>
          <div
            className="bg-background border border-border rounded-xl p-6 w-full max-w-sm shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-3">Start Live Session</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Your client will see the chart move in real-time while you talk through the reading.
            </p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Session title (optional)"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleStart} disabled={starting} className="gap-1.5">
                {starting ? 'Starting...' : 'Start Session'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* End confirmation dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEndConfirm(false)}>
          <div
            className="bg-background border border-border rounded-xl p-6 w-full max-w-sm shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-3">End Session?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              This will end the live session and start processing the recording.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowEndConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleEnd}>
                End Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
};
