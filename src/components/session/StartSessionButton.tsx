/**
 * StartSessionButton — Shows in ChartPage toolbar
 * Gated behind tier check (lite = locked), hidden on mobile.
 * When session is active, shows "End Session" with confirmation.
 * After session ends, shows transcription choice dialog.
 */

import React, { useState } from 'react';
import { Radio, Square, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface StartSessionButtonProps {
  onStart: (title: string) => Promise<void>;
  onEnd?: () => void;
  onProcessSession?: (skipTranscription: boolean) => Promise<void>;
  isActive?: boolean;
  disabled?: boolean;
  awaitingTranscriptionChoice?: boolean;
}

export const StartSessionButton: React.FC<StartSessionButtonProps> = ({
  onStart, onEnd, onProcessSession, isActive, disabled, awaitingTranscriptionChoice,
}) => {
  const { user } = useAuth();
  const { tier, sessionsRemaining, sessionsLimit, sessionsUsed, transcriptionsRemaining } = useSubscription();
  const [showDialog, setShowDialog] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showOverageConfirm, setShowOverageConfirm] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [title, setTitle] = useState('');
  const [starting, setStarting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [chargingOverage, setChargingOverage] = useState(false);
  const [processingChoice, setProcessingChoice] = useState(false);

  // Hide on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile) return null;

  const isLocked = tier === 'lite' && !isActive;

  const handleClick = () => {
    if (isActive) {
      setShowEndConfirm(true);
      return;
    }
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (tier === 'lite') {
      setShowUpgrade(true);
      return;
    }
    // Check if over session limit
    if (sessionsRemaining <= 0) {
      setShowOverageConfirm(true);
      return;
    }
    setShowDialog(true);
  };

  const handleStart = async (overageConfirmed = false) => {
    setStarting(true);
    try {
      await onStart(title || 'Untitled Session');
      setShowDialog(false);
      setShowOverageConfirm(false);
      setTitle('');
    } catch (err: any) {
      // Check for session_overage error from backend
      if (err?.message?.includes('session_overage') || err?.context?.error === 'session_overage') {
        setShowOverageConfirm(true);
        setShowDialog(false);
      } else {
        toast.error(err.message || 'Failed to start session');
      }
    } finally {
      setStarting(false);
    }
  };

  const handleOverageCharge = async (withTranscript: boolean) => {
    setChargingOverage(true);
    try {
      const { data, error } = await supabase.functions.invoke('astrologer-overage-charge', {
        body: { type: 'session', with_transcript: withTranscript },
      });
      if (error) throw new Error(error.message);
      if (data?.error) {
        if (data.error === 'no_payment_method') {
          toast.error(data.message || 'No payment method on file.');
        } else {
          toast.error(data.message || 'Payment failed');
        }
        return;
      }
      toast.success(`Charged $${withTranscript ? '0.99' : '0.33'} for session overage`);
      setShowOverageConfirm(false);
      // Now start the session with overage_confirmed
      await handleStart(true);
    } catch (err: any) {
      toast.error(err.message || 'Charge failed');
    } finally {
      setChargingOverage(false);
    }
  };

  const handleEnd = () => {
    setShowEndConfirm(false);
    onEnd?.();
  };

  const handleTranscriptionChoice = async (skipTranscription: boolean) => {
    setProcessingChoice(true);
    try {
      await onProcessSession?.(skipTranscription);
    } catch (err: any) {
      toast.error(err.message || 'Processing failed');
    } finally {
      setProcessingChoice(false);
    }
  };

  return (
    <>
      <Button
        variant={isActive ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className={`gap-1.5 text-xs ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isLocked ? 'Upgrade to Astrologer or Professional for live sessions.' : undefined}
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
              <Button size="sm" onClick={() => handleStart()} disabled={starting} className="gap-1.5">
                {starting ? 'Starting...' : 'Start Session'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overage confirmation dialog */}
      {showOverageConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowOverageConfirm(false)}>
          <div
            className="bg-background border border-border rounded-xl p-6 w-full max-w-sm shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-2">Session Limit Reached</h3>
            <p className="text-xs text-muted-foreground mb-4">
              You've used {sessionsUsed}/{sessionsLimit} sessions this month. Additional sessions are billed per use.
            </p>
            <div className="space-y-2 mb-4">
              <Button
                size="sm"
                className="w-full justify-between"
                disabled={chargingOverage}
                onClick={() => handleOverageCharge(true)}
              >
                {chargingOverage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>With transcription</span>
                <span className="text-xs opacity-70">$0.99</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-between"
                disabled={chargingOverage}
                onClick={() => handleOverageCharge(false)}
              >
                {chargingOverage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Audio only</span>
                <span className="text-xs opacity-70">$0.33</span>
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowOverageConfirm(false)}>
              Cancel
            </Button>
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
              This will end the live session. You'll choose transcription options next.
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

      {/* Post-session transcription choice dialog */}
      {awaitingTranscriptionChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-sm shadow-xl mx-4">
            <h3 className="text-sm font-semibold mb-2">Session Recorded</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Include transcription? {transcriptionsRemaining > 0
                ? `You have ${transcriptionsRemaining} transcription${transcriptionsRemaining !== 1 ? 's' : ''} remaining this month.`
                : 'You have no transcription credits left. Transcription costs $0.99.'}
            </p>
            <div className="space-y-2">
              <Button
                size="sm"
                className="w-full"
                disabled={processingChoice}
                onClick={() => handleTranscriptionChoice(false)}
              >
                {processingChoice ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                {transcriptionsRemaining > 0 ? 'Include Transcription' : 'Include Transcription ($0.99)'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={processingChoice}
                onClick={() => handleTranscriptionChoice(true)}
              >
                Audio Only (Skip Transcription)
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
};
