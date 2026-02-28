/**
 * SessionTimeline — Horizontal timeline scrubber with chapter markers
 * Supports click-to-seek and drag scrubbing.
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import type { Chapter } from '@/lib/session/types';

interface SessionTimelineProps {
  currentMs: number;
  totalMs: number;
  chapters: Chapter[];
  onSeek: (ms: number) => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  currentMs,
  totalMs,
  chapters,
  onSeek,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragMs, setDragMs] = useState(0);

  const getMsFromClientX = useCallback((clientX: number) => {
    if (!trackRef.current || totalMs <= 0) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * totalMs;
  }, [totalMs]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current || totalMs <= 0) return;
    e.preventDefault();
    const ms = getMsFromClientX(e.clientX);
    setDragging(true);
    setDragMs(ms);
    onSeek(ms);
  }, [totalMs, onSeek, getMsFromClientX]);

  // Global mousemove/mouseup for drag
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const ms = getMsFromClientX(e.clientX);
      setDragMs(ms);
      onSeek(ms);
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, getMsFromClientX, onSeek]);

  const displayMs = dragging ? dragMs : currentMs;
  const progress = totalMs > 0 ? (displayMs / totalMs) * 100 : 0;

  return (
    <div className="w-full space-y-1">
      {/* Track — larger hit area */}
      <div
        ref={trackRef}
        className="relative h-5 flex items-center cursor-pointer group"
        onMouseDown={handleMouseDown}
      >
        {/* Visible track */}
        <div className="absolute inset-x-0 h-2 bg-muted/50 rounded-full top-1/2 -translate-y-1/2">
          {/* Progress bar */}
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full"
            style={{ width: `${progress}%`, transition: dragging ? 'none' : 'width 100ms' }}
          />
        </div>
        {/* Playhead */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow border-2 border-background transition-opacity ${dragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'}`}
          style={{ left: `${progress}%` }}
        />
        {/* Chapter markers */}
        {chapters.map((ch, i) => {
          const pos = totalMs > 0 ? (ch.timestamp_ms / totalMs) * 100 : 0;
          return (
            <button
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-yellow-500 rounded-full border border-background hover:scale-150 transition-transform z-10"
              style={{ left: `${pos}%` }}
              title={ch.title}
              onClick={(e) => { e.stopPropagation(); onSeek(ch.timestamp_ms); }}
            />
          );
        })}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>{formatTime(displayMs)}</span>
        <span>{formatTime(totalMs)}</span>
      </div>
    </div>
  );
};
