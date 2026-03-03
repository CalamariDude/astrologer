import { useState, useRef } from 'react';
import { ImagePlus, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { CommunitySpace } from '@/hooks/useCommunityFeed';
import { toast } from 'sonner';

interface PostComposerProps {
  spaces: CommunitySpace[];
  currentSpaceSlug?: string;
  onPostCreated: () => void;
  initialChartSnapshot?: string;
  initialTitle?: string;
}

const PostComposer = ({ spaces, currentSpaceSlug, onPostCreated, initialChartSnapshot, initialTitle }: PostComposerProps) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(!!initialChartSnapshot);
  const [title, setTitle] = useState(initialTitle || '');
  const [chartSnapshotUrl, setChartSnapshotUrl] = useState<string | null>(initialChartSnapshot || null);
  const [body, setBody] = useState('');
  const [spaceId, setSpaceId] = useState<string>(() => {
    const match = spaces.find(s => s.slug === currentSpaceSlug);
    return match?.id || spaces.find(s => s.is_default)?.id || spaces[0]?.id || '';
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (mediaFiles.length + files.length > 4) { toast.error('Maximum 4 images per post'); return; }
    setMediaFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setMediaPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !body.trim() || !spaceId) return;
    setSubmitting(true);
    try {
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('community-media').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('community-media').getPublicUrl(path);
        mediaUrls.push(urlData.publicUrl);
      }

      // Upload chart snapshot if present
      let snapshotUrl: string | null = null;
      if (chartSnapshotUrl) {
        const res = await fetch(chartSnapshotUrl);
        const blob = await res.blob();
        const path = `${user.id}/chart-${Date.now()}.png`;
        const { error: snapErr } = await supabase.storage.from('community-media').upload(path, blob, { contentType: 'image/png' });
        if (snapErr) throw snapErr;
        const { data: snapData } = supabase.storage.from('community-media').getPublicUrl(path);
        snapshotUrl = snapData.publicUrl;
      }

      const { error } = await supabase.from('community_posts').insert({
        user_id: user.id, space_id: spaceId, title: title.trim() || null, body: body.trim(),
        media_urls: mediaUrls.length > 0 ? mediaUrls : [],
        chart_snapshot_url: snapshotUrl,
      });
      if (error) throw error;

      setTitle(''); setBody(''); setMediaFiles([]); setMediaPreviews([]); setChartSnapshotUrl(null); setExpanded(false);
      toast.success('Post published!');
      onPostCreated();
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="w-full bg-card border border-border rounded-xl p-4 text-left text-muted-foreground hover:border-primary/30 transition-colors">
        What's on your mind?
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-muted-foreground">Post in:</span>
        <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} className="text-sm bg-muted rounded-lg px-2 py-1 border-none outline-none">
          {spaces.map(space => <option key={space.id} value={space.id}>{space.icon} {space.name}</option>)}
        </select>
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full mb-2 bg-transparent text-base font-semibold px-0 border-0 outline-none placeholder:font-normal" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your thoughts..." className="w-full min-h-[100px] bg-transparent resize-none px-0 border-0 outline-none" autoFocus />

      {chartSnapshotUrl && (
        <div className="relative mt-2 inline-block">
          <img src={chartSnapshotUrl} alt="Chart" className="max-h-48 rounded-lg border border-border object-contain" />
          <button onClick={() => setChartSnapshotUrl(null)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {mediaPreviews.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {mediaPreviews.map((preview, i) => (
            <div key={i} className="relative">
              <img src={preview} alt="" className="w-20 h-20 object-cover rounded-lg" />
              <button onClick={() => removeMedia(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleAddMedia} className="hidden" />
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={mediaFiles.length >= 4}>
            <ImagePlus className="w-4 h-4 mr-1" />Photo
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setExpanded(false); setTitle(''); setBody(''); setMediaFiles([]); setMediaPreviews([]); setChartSnapshotUrl(null); }}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!body.trim() || submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" />Post</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
