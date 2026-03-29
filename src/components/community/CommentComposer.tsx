import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommentComposerProps {
  onSubmit: (body: string) => Promise<boolean>;
  placeholder?: string;
  compact?: boolean;
}

const CommentComposer = ({ onSubmit, placeholder = 'Write a comment...', compact }: CommentComposerProps) => {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    const success = await onSubmit(body.trim());
    if (success) setBody('');
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className={`flex items-end gap-2 ${compact ? '' : 'bg-card border border-border rounded-xl p-3'}`}>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} rows={compact ? 1 : 2}
        className={`flex-1 bg-transparent border-0 resize-none outline-none text-sm ${compact ? 'bg-muted/50 rounded-lg px-3 py-2' : ''}`} />
      <Button size="icon" variant="ghost" onClick={handleSubmit} disabled={!body.trim() || submitting} className="shrink-0 h-8 w-8">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
};

export default CommentComposer;
