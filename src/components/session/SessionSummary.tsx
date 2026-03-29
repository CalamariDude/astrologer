/**
 * SessionSummary — AI summary, chapter list, download, delete actions
 */

import React from 'react';
import { Download, StickyNote, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Chapter, SessionRecord } from '@/lib/session/types';

interface SessionSummaryProps {
  session: SessionRecord;
  chapters: Chapter[];
  onSeek: (ms: number) => void;
  audioUrl?: string;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  session,
  chapters,
  onSeek,
  audioUrl,
}) => {
  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${session.title || 'session'}.webm`;
    a.click();
  };

  const handleAppendToNotes = () => {
    if (!session.summary) {
      toast.error('No summary to append');
      return;
    }
    try {
      // Chart notes key matches ChartPage pattern: `${date}-${time}-${lat}`
      const snap = session.chart_snapshot;
      const bd = snap?.birthDataA;
      const notesKey = bd ? `${bd.date}-${bd.time}-${bd.lat}` : null;

      if (!notesKey) {
        toast.error('Cannot determine chart notes key');
        return;
      }

      const NOTES_STORAGE_KEY = 'astrologer_chart_notes';
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      const allNotes: Record<string, { id: string; text: string; createdAt: string }[]> = raw ? JSON.parse(raw) : {};
      const existing = allNotes[notesKey] || [];

      // Add summary as a note
      const newNote = {
        id: `session-${session.id}`,
        text: `📋 Session: ${session.title} (${new Date(session.created_at).toLocaleDateString()})\n\n${session.summary}`,
        createdAt: new Date().toISOString(),
      };

      allNotes[notesKey] = [newNote, ...existing];
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
      toast.success('Summary added to chart notes');
    } catch {
      toast.error('Failed to append to notes');
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      {session.summary && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Summary</h3>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {session.summary}
          </div>
        </div>
      )}

      {/* Chapters */}
      {chapters.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Chapters</h3>
          <div className="space-y-1">
            {chapters.map((ch, i) => (
              <button
                key={i}
                onClick={() => onSeek(ch.timestamp_ms)}
                className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 text-left transition-colors"
              >
                <Clock className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs font-medium">{ch.title}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <span className="font-mono">{formatTime(ch.timestamp_ms)}</span>
                    {ch.description && <span className="opacity-60">— {ch.description}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
        {audioUrl && (
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Download Audio
          </Button>
        )}
        {session.summary && session.chart_snapshot?.birthDataA && (
          <Button variant="outline" size="sm" onClick={handleAppendToNotes} className="gap-1.5 text-xs">
            <StickyNote className="w-3.5 h-3.5" /> Append to Notes
          </Button>
        )}
      </div>
    </div>
  );
};
