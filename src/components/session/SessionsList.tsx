/**
 * SessionsList — User's session management grid
 * Shows sessions sorted by date, with replay link, share link, delete actions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Copy, Trash2, Loader2, Clock, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { SessionRecord, SessionStatus } from '@/lib/session/types';

const STATUS_LABELS: Record<SessionStatus, { label: string; color: string }> = {
  created: { label: 'Created', color: 'bg-gray-500' },
  live: { label: 'Live', color: 'bg-green-500 animate-pulse' },
  paused: { label: 'Paused', color: 'bg-yellow-500' },
  ended: { label: 'Ended', color: 'bg-gray-500' },
  processing: { label: 'Processing', color: 'bg-blue-500 animate-pulse' },
  ready: { label: 'Ready', color: 'bg-emerald-500' },
  failed: { label: 'Failed', color: 'bg-red-500' },
};

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface SessionsListProps {
  onClose?: () => void;
}

export const SessionsList: React.FC<SessionsListProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ready' | 'live'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 20;

  const fetchSessions = async (offset: number) => {
    if (!user) return [];
    const { data } = await supabase
      .from('astrologer_sessions')
      .select('*')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    return (data || []) as SessionRecord[];
  };

  useEffect(() => {
    if (!user) return;

    (async () => {
      const data = await fetchSessions(0);
      setSessions(data);
      setHasMore(data.length === PAGE_SIZE);
      setLoading(false);
    })();
  }, [user]);

  const loadMore = async () => {
    setLoadingMore(true);
    const data = await fetchSessions(sessions.length);
    setSessions((prev) => [...prev, ...data]);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const handleCopyLink = async (session: SessionRecord) => {
    const url = `${window.location.origin}/session/${session.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(session.id);
    toast.success('Replay link copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (session: SessionRecord) => {
    if (!confirm(`Delete "${session.title}"? This cannot be undone.`)) return;

    // Delete all files in session folder from storage
    try {
      const { data: files } = await supabase.storage.from('session-recordings').list(session.id);
      if (files && files.length > 0) {
        await supabase.storage.from('session-recordings').remove(files.map((f) => `${session.id}/${f.name}`));
      }
      const { data: chunkFiles } = await supabase.storage.from('session-recordings').list(`${session.id}/chunks`);
      if (chunkFiles && chunkFiles.length > 0) {
        await supabase.storage.from('session-recordings').remove(chunkFiles.map((f) => `${session.id}/chunks/${f.name}`));
      }
    } catch {}

    // Delete session (cascades to events + chunks rows)
    await supabase.from('astrologer_sessions').delete().eq('id', session.id);
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
    toast.success('Session deleted');
  };

  const handleStartEdit = (session: SessionRecord) => {
    setEditingId(session.id);
    setEditTitle(session.title);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleSaveTitle = async (session: SessionRecord) => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === session.title) {
      setEditingId(null);
      return;
    }
    await supabase.from('astrologer_sessions').update({ title: trimmed }).eq('id', session.id);
    setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, title: trimmed } : s));
    setEditingId(null);
    toast.success('Title updated');
  };

  const filtered = sessions.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'ready') return s.status === 'ready';
    if (filter === 'live') return ['created', 'live', 'paused'].includes(s.status);
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">My Sessions</h2>
        <div className="flex gap-1">
          {(['all', 'ready', 'live'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {f === 'all' ? 'All' : f === 'ready' ? 'Completed' : 'Active'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No sessions yet</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const statusInfo = STATUS_LABELS[s.status];
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                {/* Status dot + info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.color}`} />
                    {editingId === s.id ? (
                      <input
                        ref={editInputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(s)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle(s);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="text-sm font-medium bg-transparent border-b border-primary outline-none w-full"
                      />
                    ) : (
                      <span className="text-sm font-medium truncate">{s.title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    <span>{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {s.total_duration_ms > 0 && (
                      <>
                        <span className="opacity-40">&middot;</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(s.total_duration_ms)}</span>
                      </>
                    )}
                    {s.chart_snapshot?.nameA && (
                      <>
                        <span className="opacity-40">&middot;</span>
                        <span className="truncate">
                          {s.chart_snapshot.nameA}
                          {s.chart_snapshot.nameB && ` & ${s.chart_snapshot.nameB}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {s.status === 'ready' && (
                    <Link
                      to={`/session/${s.share_token}`}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      title="Replay"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <button
                    onClick={() => handleStartEdit(s)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    title="Rename"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopyLink(s)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy share link"
                  >
                    {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
            >
              {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
