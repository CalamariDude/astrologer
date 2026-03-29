/**
 * TranscriptPanel — Collapsible panel with speaker-labeled transcript
 * Shows utterances with speaker labels and clickable timestamps.
 * Falls back to plain transcript text when no utterances available.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Utterance } from '@/lib/session/types';

const SPEAKER_COLORS = [
  'text-blue-500',
  'text-emerald-500',
  'text-purple-500',
  'text-orange-500',
];

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface TranscriptPanelProps {
  transcript: string;
  utterances?: Utterance[];
  currentMs: number;
  totalMs: number;
  onSeek?: (ms: number) => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  utterances,
  currentMs,
  totalMs,
  onSeek,
}) => {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const hasUtterances = utterances && utterances.length > 0;

  // Auto-scroll to active utterance during playback
  useEffect(() => {
    if (!expanded || !activeRef.current || !containerRef.current) return;
    activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentMs, expanded]);

  // Fallback: proportional scroll for plain transcript
  useEffect(() => {
    if (!expanded || hasUtterances || !containerRef.current || totalMs <= 0) return;
    const pct = currentMs / totalMs;
    const scrollHeight = containerRef.current.scrollHeight - containerRef.current.clientHeight;
    containerRef.current.scrollTop = pct * scrollHeight;
  }, [currentMs, totalMs, expanded, hasUtterances]);

  if (!transcript && !hasUtterances) return null;

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
      >
        <span>Transcript</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {expanded && (
        <div
          ref={containerRef}
          className="max-h-80 overflow-y-auto px-3 pb-3 border-t border-border/50 space-y-2"
        >
          {hasUtterances ? (
            utterances.map((u, i) => {
              const isActive = currentMs >= u.start_ms && currentMs < u.end_ms;
              const isPast = currentMs >= u.end_ms;
              const speakerLabel = u.speaker === 0 ? 'Host' : `Speaker ${u.speaker + 1}`;
              const colorClass = SPEAKER_COLORS[u.speaker % SPEAKER_COLORS.length];

              return (
                <div
                  key={i}
                  ref={isActive ? activeRef : undefined}
                  className={`group transition-opacity ${isPast ? 'opacity-60' : ''} ${isActive ? 'opacity-100' : ''}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-semibold ${colorClass}`}>{speakerLabel}</span>
                    <button
                      onClick={() => onSeek?.(u.start_ms)}
                      className="text-[10px] font-mono text-muted-foreground/50 hover:text-primary transition-colors"
                    >
                      {formatTime(u.start_ms)}
                    </button>
                  </div>
                  <p className={`text-xs leading-relaxed ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {u.text}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed pt-1">
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
