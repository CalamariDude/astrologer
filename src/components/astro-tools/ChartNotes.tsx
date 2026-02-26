/**
 * Chart Notes
 * Private notes per chart, stored in localStorage with shareable links
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Trash2, Link2, Check, Clock, StickyNote, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ChartNotesProps {
  /** Unique key derived from chart birth data */
  chartKey: string;
  chartTitle: string;
  /** Birth data for generating shareable links */
  birthData?: {
    name: string;
    date: string;
    time: string;
    lat: number;
    lng: number;
    location: string;
  };
}

interface Note {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

const NOTES_STORAGE_KEY = 'astrologer_chart_notes';

function getAllNotes(): Record<string, Note[]> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAllNotes(notes: Record<string, Note[]>) {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function ChartNotes({ chartKey, chartTitle, birthData }: ChartNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load notes from localStorage
  useEffect(() => {
    const all = getAllNotes();
    setNotes(all[chartKey] || []);
  }, [chartKey]);

  const saveNotes = useCallback((updated: Note[]) => {
    setNotes(updated);
    const all = getAllNotes();
    all[chartKey] = updated;
    saveAllNotes(all);
  }, [chartKey]);

  const addNote = useCallback(() => {
    if (!newText.trim()) return;
    const note: Note = {
      id: crypto.randomUUID(),
      text: newText.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveNotes([note, ...notes]);
    setNewText('');
    setIsAdding(false);
    toast.success('Note saved');
  }, [newText, notes, saveNotes]);

  const updateNote = useCallback((id: string) => {
    if (!editText.trim()) return;
    const updated = notes.map(n =>
      n.id === id ? { ...n, text: editText.trim(), updatedAt: new Date().toISOString() } : n
    );
    saveNotes(updated);
    setEditingId(null);
    setEditText('');
  }, [editText, notes, saveNotes]);

  const deleteNote = useCallback((id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
    toast.success('Note deleted');
  }, [notes, saveNotes]);

  const shareNote = useCallback((note: Note) => {
    let shareText = `${chartTitle}\n\n${note.text}`;
    if (birthData) {
      shareText += `\n\n---\nChart: ${birthData.name || 'Unknown'} | ${birthData.date} ${birthData.time} | ${birthData.location}`;
    }
    navigator.clipboard.writeText(shareText);
    setCopiedId(note.id);
    toast.success('Note copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  }, [chartTitle, birthData]);

  const generateShareableLink = useCallback(() => {
    if (!birthData) return;
    const params = new URLSearchParams({
      name: birthData.name,
      date: birthData.date,
      time: birthData.time,
      lat: String(birthData.lat),
      lng: String(birthData.lng),
      loc: birthData.location,
    });
    const url = `${window.location.origin}/chart?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Chart link copied to clipboard');
  }, [birthData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Notes</h3>
          <p className="text-xs text-muted-foreground">Private notes for {chartTitle}</p>
        </div>
        <div className="flex gap-2">
          {birthData && (
            <Button variant="outline" size="sm" onClick={generateShareableLink} className="gap-1.5 text-xs">
              <Globe className="w-3 h-3" />
              Share Chart Link
            </Button>
          )}
          {!isAdding && (
            <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1.5 text-xs">
              <Plus className="w-3 h-3" />
              Add Note
            </Button>
          )}
        </div>
      </div>

      {/* Add new note */}
      {isAdding && (
        <div className="rounded-xl border bg-card/50 p-4 space-y-3">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Write your note..."
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none resize-none min-h-[100px] border rounded-lg p-3"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setNewText(''); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={addNote} disabled={!newText.trim()}>
              Save Note
            </Button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-xl border bg-card/50 overflow-hidden group">
              {editingId === note.id ? (
                <div className="p-4 space-y-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none resize-none min-h-[80px] border rounded-lg p-3"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => updateNote(note.id)} disabled={!editText.trim()}>
                      Update
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="px-4 py-3 text-sm whitespace-pre-wrap cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => { setEditingId(note.id); setEditText(note.text); }}
                  >
                    {note.text}
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 border-t border-border/30 bg-muted/10">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(note.updatedAt)}
                      {note.updatedAt !== note.createdAt && ' (edited)'}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => shareNote(note)}
                        className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                        title="Copy note"
                      >
                        {copiedId === note.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 rounded-md text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : !isAdding ? (
        <div className="text-center py-12 rounded-xl border border-dashed bg-muted/10">
          <StickyNote className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground">No notes yet</div>
          <div className="text-xs text-muted-foreground/60 mt-1">Click "Add Note" to start recording your observations</div>
        </div>
      ) : null}
    </div>
  );
}
