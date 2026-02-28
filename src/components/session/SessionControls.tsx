/**
 * SessionControls — Floating bar at bottom-center of chart when session is active
 * Shows timer, recording dot, mic/video toggle, guest status, pause/resume.
 * Ending the session is done via the toolbar "End Session" button.
 */

import React from 'react';
import { Mic, MicOff, Video, VideoOff, Pause, Play, UserCheck, UserX, LayoutGrid, Monitor } from 'lucide-react';

interface SessionControlsProps {
  duration: number; // seconds
  isRecording: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  guestCount: number;
  isPaused: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onPause: () => void;
  onResume: () => void;
  viewMode?: 'chart' | 'video';
  onToggleViewMode?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  duration,
  isRecording,
  isMuted,
  isVideoOff,
  guestCount,
  isPaused,
  onToggleMute,
  onToggleVideo,
  onPause,
  onResume,
  viewMode,
  onToggleViewMode,
}) => {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-black/80 backdrop-blur-sm border border-white/10 rounded-full shadow-2xl"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Recording indicator + timer */}
      <div className="flex items-center gap-2 text-white text-sm font-mono">
        <span className={`w-2.5 h-2.5 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : isPaused ? 'bg-yellow-500' : 'bg-white/30'}`} />
        {formatDuration(duration)}
      </div>

      <div className="w-px h-5 bg-white/20" />

      {/* Mic toggle */}
      <button
        onClick={onToggleMute}
        className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:text-white'}`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Video toggle */}
      <button
        onClick={onToggleVideo}
        className={`p-2 rounded-full transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:text-white'}`}
        title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
      >
        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </button>

      {/* Guest status */}
      <div
        className={`flex items-center gap-1 text-xs ${guestCount > 0 ? 'text-green-400' : 'text-white/40'}`}
        title={guestCount > 0 ? `${guestCount} connected` : 'Waiting for client...'}
      >
        {guestCount > 0 ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
        {guestCount > 1 && <span className="text-[10px]">{guestCount}</span>}
      </div>

      {/* View mode toggle (chart ↔ video gallery) */}
      {viewMode && onToggleViewMode && (
        <button
          onClick={onToggleViewMode}
          className="p-2 rounded-full transition-colors text-white/70 hover:text-white"
          title={viewMode === 'chart' ? 'Switch to video gallery' : 'Switch to chart view'}
        >
          {viewMode === 'chart' ? <LayoutGrid className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>
      )}

      <div className="w-px h-5 bg-white/20" />

      {/* Pause/Resume */}
      <button
        onClick={isPaused ? onResume : onPause}
        className={`p-2 rounded-full transition-colors ${isPaused ? 'bg-yellow-500/20 text-yellow-400' : 'text-white/70 hover:text-white'}`}
        title={isPaused ? 'Resume recording' : 'Pause recording'}
      >
        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </button>
    </div>
  );
};
