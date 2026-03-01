/**
 * SessionControls — Floating bar at bottom-center of chart when session is active
 * Shows timer, recording dot, mic/video toggle, device picker, share link, guest status, pause/resume.
 * Ending the session is done via the toolbar "End Session" button.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Pause, Play, UserCheck, UserX, LayoutGrid, Monitor, Link2, ChevronUp, Camera } from 'lucide-react';
import type { MediaDeviceInfo } from '@/hooks/useSession';

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
  // Share link
  onCopyShareLink?: () => void;
  // Device picker
  audioDevices?: MediaDeviceInfo[];
  videoDevices?: MediaDeviceInfo[];
  currentAudioDeviceId?: string;
  currentVideoDeviceId?: string;
  onSwitchAudioDevice?: (deviceId: string) => void;
  onSwitchVideoDevice?: (deviceId: string) => void;
  onRefreshDevices?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Dropdown for selecting mic or camera */
const DevicePickerDropdown: React.FC<{
  icon: React.ReactNode;
  devices: MediaDeviceInfo[];
  currentDeviceId: string;
  onSelect: (deviceId: string) => void;
  onRefresh?: () => void;
  label: string;
}> = ({ icon, devices, currentDeviceId, onSelect, onRefresh, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    onRefresh?.();
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onRefresh]);

  if (devices.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-full transition-colors text-white/40 hover:text-white/70"
        title={`Change ${label}`}
      >
        <ChevronUp className={`w-3 h-3 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl py-1 min-w-[200px] max-w-[280px]">
          <div className="px-3 py-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            {icon} {label}
          </div>
          {devices.map((d) => (
            <button
              key={d.deviceId}
              onClick={() => { onSelect(d.deviceId); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors truncate ${
                d.deviceId === currentDeviceId
                  ? 'text-white bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  onCopyShareLink,
  audioDevices = [],
  videoDevices = [],
  currentAudioDeviceId = '',
  currentVideoDeviceId = '',
  onSwitchAudioDevice,
  onSwitchVideoDevice,
  onRefreshDevices,
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

      {/* Mic toggle + device picker */}
      <div className="flex items-center">
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:text-white'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        {onSwitchAudioDevice && (
          <DevicePickerDropdown
            icon={<Mic className="w-3 h-3" />}
            devices={audioDevices}
            currentDeviceId={currentAudioDeviceId}
            onSelect={onSwitchAudioDevice}
            onRefresh={onRefreshDevices}
            label="Microphone"
          />
        )}
      </div>

      {/* Video toggle + device picker */}
      <div className="flex items-center">
        <button
          onClick={onToggleVideo}
          className={`p-2 rounded-full transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:text-white'}`}
          title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>
        {onSwitchVideoDevice && (
          <DevicePickerDropdown
            icon={<Camera className="w-3 h-3" />}
            devices={videoDevices}
            currentDeviceId={currentVideoDeviceId}
            onSelect={onSwitchVideoDevice}
            onRefresh={onRefreshDevices}
            label="Camera"
          />
        )}
      </div>

      {/* Share link */}
      {onCopyShareLink && (
        <button
          onClick={onCopyShareLink}
          className="p-2 rounded-full transition-colors text-white/70 hover:text-white"
          title="Copy session link"
        >
          <Link2 className="w-5 h-5" />
        </button>
      )}

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
