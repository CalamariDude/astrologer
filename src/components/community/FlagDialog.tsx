import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId?: string;
  commentId?: string;
}

const FLAG_REASONS = ['Spam or misleading', 'Harassment or bullying', 'Hate speech', 'Explicit content', 'Off-topic', 'Other'];

const FlagDialog = ({ open, onOpenChange, postId, commentId }: FlagDialogProps) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !selectedReason) return;
    setSubmitting(true);
    try {
      const reason = details.trim() ? `${selectedReason}: ${details.trim()}` : selectedReason;
      const { error } = await supabase.from('community_flags').insert({
        reporter_id: user.id, post_id: postId || null, comment_id: commentId || null, reason,
      });
      if (error) throw error;
      toast.success('Report submitted. Thank you.');
      onOpenChange(false); setSelectedReason(''); setDetails('');
    } catch (err) {
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>Help us understand what's wrong.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {FLAG_REASONS.map(reason => (
            <button key={reason} onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedReason === reason ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
              {reason}
            </button>
          ))}
          {selectedReason && (
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Additional details (optional)..." rows={2} className="w-full bg-muted rounded-lg px-3 py-2 text-sm border-0 outline-none resize-none" />
          )}
          <Button onClick={handleSubmit} disabled={!selectedReason || submitting} className="w-full" variant="destructive">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlagDialog;
