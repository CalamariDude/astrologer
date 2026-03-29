/**
 * VideoGallery — Responsive CSS grid of video tiles for video-focused (gallery) mode.
 * Renders all participants (local + remote) in a Zoom-like layout.
 * Each tile shows video, speaking indicator, label pill, and initials placeholder when video is off.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { User } from 'lucide-react';
import { getInitials } from './VideoFeed';

interface Participant {
  id: string;
  name: string;
  stream: MediaStream | null;
  muted?: boolean;
  mirrored?: boolean;
}

interface VideoGalleryProps {
  participants: Participant[];
  activeSpeakerId: string | null;
}

const VideoTile: React.FC<{
  participant: Participant;
  isSpeaking: boolean;
}> = ({ participant, isSpeaking }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);

  const checkVideoTracks = useCallback(() => {
    if (participant.stream) {
      const videoTracks = participant.stream.getVideoTracks();
      setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled && videoTracks[0].readyState === 'live');
    } else {
      setHasVideo(false);
    }
  }, [participant.stream]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.srcObject = participant.stream;
      videoEl.play().catch(() => {});
    }

    checkVideoTracks();

    if (!participant.stream) return;

    const videoTracks = participant.stream.getVideoTracks();
    const track = videoTracks[0];
    if (!track) return;

    const onEnded = () => setHasVideo(false);
    const onMute = () => checkVideoTracks();
    const onUnmute = () => {
      checkVideoTracks();
      if (videoEl) videoEl.play().catch(() => {});
    };

    track.addEventListener('ended', onEnded);
    track.addEventListener('mute', onMute);
    track.addEventListener('unmute', onUnmute);

    return () => {
      track.removeEventListener('ended', onEnded);
      track.removeEventListener('mute', onMute);
      track.removeEventListener('unmute', onUnmute);
    };
  }, [participant.stream, checkVideoTracks]);

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-black/80"
      style={{
        aspectRatio: '4 / 3',
        border: isSpeaking ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
        boxShadow: isSpeaking ? '0 0 12px rgba(34,197,94,0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Always render one video element — hide visually when no video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.muted ?? false}
        className={`w-full h-full object-cover ${hasVideo ? '' : 'hidden'}`}
        style={participant.mirrored ? { transform: 'scaleX(-1)' } : undefined}
      />

      {!hasVideo && (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
          {participant.name ? (
            <span className="text-white/70 font-semibold text-3xl">
              {getInitials(participant.name)}
            </span>
          ) : (
            <User className="text-white/40 w-10 h-10" />
          )}
        </div>
      )}

      {/* Label pill */}
      {participant.name && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full pointer-events-none whitespace-nowrap backdrop-blur-sm">
          {participant.name}
        </span>
      )}
    </div>
  );
};

export const VideoGallery: React.FC<VideoGalleryProps> = ({
  participants,
  activeSpeakerId,
}) => {
  const count = participants.length;
  // 1 person = 1 col, 2-4 = 2 cols, 5+ = 3 cols
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;

  return (
    <div
      className="w-full h-full flex items-center justify-center p-3"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
    >
      <div
        className="w-full gap-3"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          maxWidth: cols === 1 ? '600px' : '100%',
        }}
      >
        {participants.map((p) => (
          <VideoTile
            key={p.id}
            participant={p}
            isSpeaking={activeSpeakerId === p.id}
          />
        ))}
      </div>
    </div>
  );
};
