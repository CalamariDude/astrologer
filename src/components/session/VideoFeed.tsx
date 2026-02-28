/**
 * VideoFeed — Draggable, resizable video with MediaStream srcObject.
 * Shows a green glow border when the participant is speaking.
 * Shows a placeholder with initials when video is off.
 * Drag to reposition. Resize from bottom-left corner handle.
 * Double-click to snap between small/large presets.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { User } from 'lucide-react';

interface VideoFeedProps {
  stream: MediaStream | null;
  muted?: boolean;
  mirrored?: boolean;
  label?: string;
  className?: string;
  isSpeaking?: boolean;
  /** Default position from top-right corner */
  defaultOffsetX?: number;
  defaultOffsetY?: number;
}

const ASPECT_RATIO = 4 / 3;
const MIN_W = 80;
const MAX_W = 640;
const SMALL_W = 180;
const LARGE_W = 400;

/** Extract up to 2 initials from a name string */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  stream,
  muted = false,
  mirrored = false,
  label,
  className = '',
  isSpeaking = false,
  defaultOffsetX = 0,
  defaultOffsetY = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(SMALL_W);
  const [position, setPosition] = useState({ x: defaultOffsetX, y: defaultOffsetY });

  // Track whether the stream has a live video track
  const [hasVideo, setHasVideo] = useState(false);

  // Drag state
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // Resize state
  const resizing = useRef(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const resizeStartPosX = useRef(0);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    // Check if stream has an active video track
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled && videoTracks[0].readyState === 'live');
    } else {
      setHasVideo(false);
    }
  }, [stream]);

  const height = width / ASPECT_RATIO;

  // ── Drag handlers ──
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || resizing.current) return;
    dragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    setPosition({
      x: posStart.current.x + dx,
      y: posStart.current.y + dy,
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // Double-click: toggle between small/large
  const onDoubleClick = useCallback(() => {
    if (hasDragged.current) return;
    setWidth(w => w < (SMALL_W + LARGE_W) / 2 ? LARGE_W : SMALL_W);
  }, []);

  // ── Resize handlers (bottom-left corner) ──
  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizing.current = true;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = width;
    resizeStartPosX.current = position.x;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [width, position.x]);

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return;
    const dx = resizeStartX.current - e.clientX;
    const newWidth = Math.min(MAX_W, Math.max(MIN_W, resizeStartWidth.current + dx));
    setWidth(newWidth);
    const widthDelta = newWidth - resizeStartWidth.current;
    setPosition(prev => ({
      ...prev,
      x: resizeStartPosX.current - widthDelta,
    }));
  }, []);

  const onResizePointerUp = useCallback(() => {
    resizing.current = false;
  }, []);

  const isActive = dragging.current || resizing.current;

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden bg-black/80 shadow-lg select-none ${className}`}
      style={{
        width,
        height,
        transform: `translate(${position.x}px, ${position.y}px)`,
        border: isSpeaking ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
        boxShadow: isSpeaking ? '0 0 12px rgba(34,197,94,0.5)' : '0 4px 16px rgba(0,0,0,0.4)',
        transition: isActive ? 'none' : 'width 0.2s, height 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        zIndex: 50,
        touchAction: 'none',
        cursor: dragging.current ? 'grabbing' : 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      {/* Video or placeholder */}
      {stream && hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
          style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
        />
      ) : (
        <>
          {/* Hidden video element to keep srcObject attached */}
          <video ref={videoRef} autoPlay playsInline muted={muted} className="hidden" />
          {/* Video-off placeholder */}
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            {label ? (
              <span className="text-white/70 font-semibold" style={{ fontSize: Math.max(16, width * 0.15) }}>
                {getInitials(label)}
              </span>
            ) : (
              <User className="text-white/40" style={{ width: Math.max(20, width * 0.2), height: Math.max(20, width * 0.2) }} />
            )}
          </div>
        </>
      )}

      {/* Label — centered pill at bottom */}
      {label && (
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-xs text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full pointer-events-none whitespace-nowrap backdrop-blur-sm">
          {label}
        </span>
      )}

      {/* Bottom-left resize handle */}
      <div
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 28,
          height: 28,
          cursor: 'nesw-resize',
          zIndex: 10,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ position: 'absolute', bottom: 4, left: 4, opacity: 0.6 }}>
          <line x1="0" y1="13" x2="13" y2="0" stroke="white" strokeWidth="1.5" />
          <line x1="0" y1="9" x2="9" y2="0" stroke="white" strokeWidth="1.5" />
          <line x1="0" y1="5" x2="5" y2="0" stroke="white" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
};
