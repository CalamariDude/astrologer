import { useState, useRef } from 'react';
import { Loader2, PenSquare, Camera, Globe, Link as LinkIcon, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ApplyToPostDialogProps {
  onApplicationSubmitted: () => void;
}

const STEPS = ['Photo & Name', 'Bio & Intention', 'Links'];

const ApplyToPostDialog = ({ onApplicationSubmitted }: ApplyToPostDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Photo + Display Name
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

  // Step 2: Bio + Intention
  const [bio, setBio] = useState('');
  const [intention, setIntention] = useState('');

  // Step 3: Links
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linktreeUrl, setLinktreeUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const canProceed = () => {
    if (step === 0) return !!avatarFile && displayName.trim().length > 0;
    if (step === 1) return intention.trim().length > 0;
    return true;
  };

  const resetForm = () => {
    setStep(0);
    setAvatarFile(null);
    setAvatarPreview(null);
    setDisplayName('');
    setBio('');
    setIntention('');
    setWebsiteUrl('');
    setLinktreeUrl('');
    setTwitterHandle('');
    setInstagramHandle('');
    setTiktokHandle('');
    setYoutubeUrl('');
  };

  const handleSubmit = async () => {
    if (!user || !avatarFile || !displayName.trim() || !intention.trim()) return;
    setSubmitting(true);
    try {
      // Upload avatar
      const ext = avatarFile.name.split('.').pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('community-media').upload(path, avatarFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('community-media').getPublicUrl(path);

      // Upsert profile with community fields
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: displayName.trim(),
        avatar_url: urlData.publicUrl,
        bio: bio.trim() || null,
        website_url: websiteUrl.trim() || null,
        linktree_url: linktreeUrl.trim() || null,
        twitter_handle: twitterHandle.trim() || null,
        instagram_handle: instagramHandle.trim() || null,
        tiktok_handle: tiktokHandle.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
      });
      if (profileError) throw profileError;

      // Insert application (reason = intention)
      const { error: appError } = await supabase.from('community_poster_applications').insert({
        user_id: user.id,
        reason: intention.trim(),
        sample_topics: null,
      });
      if (appError) {
        if (appError.code === '23505') { toast.error('You already have a pending application'); return; }
        throw appError;
      }

      toast.success("Application submitted! We'll review it soon.");
      setOpen(false);
      resetForm();
      onApplicationSubmitted();
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><PenSquare className="w-4 h-4" />Apply to Post</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Community Profile</DialogTitle>
          <DialogDescription>Set up your public poster identity</DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
              {i < STEPS.length - 1 && <div className={`w-6 h-px transition-colors ${i < step ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-muted-foreground -mt-1">{STEPS[step]}</p>

        <div className="space-y-4 mt-2 min-h-[220px]">
          {step === 0 && (
            <>
              {/* Avatar upload */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <p className="text-xs text-muted-foreground">Must show your face</p>
              </div>
              {/* Display name */}
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should the community know you?"
                  className="w-full mt-1 bg-muted rounded-lg px-3 py-2 text-sm border-0 outline-none"
                  maxLength={50}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community about yourself..."
                  className="w-full mt-1 bg-muted rounded-lg px-3 py-2 text-sm border-0 outline-none resize-none min-h-[80px]"
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
              </div>
              <div>
                <label className="text-sm font-medium">Why do you want to post? <span className="text-red-500">*</span></label>
                <textarea
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder="Share your expertise, background, or what you'd like to contribute..."
                  className="w-full mt-1 bg-muted rounded-lg px-3 py-2 text-sm border-0 outline-none resize-none min-h-[80px]"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <LinkInput icon={<Globe className="w-4 h-4" />} value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://yoursite.com" label="Website" />
              <LinkInput icon={<LinkIcon className="w-4 h-4" />} value={linktreeUrl} onChange={setLinktreeUrl} placeholder="https://linktr.ee/you" label="Linktree" />
              <LinkInput icon={<XIcon />} value={twitterHandle} onChange={setTwitterHandle} placeholder="@handle" label="X / Twitter" />
              <LinkInput icon={<InstagramIcon />} value={instagramHandle} onChange={setInstagramHandle} placeholder="@handle" label="Instagram" />
              <LinkInput icon={<TikTokIcon />} value={tiktokHandle} onChange={setTiktokHandle} placeholder="@handle" label="TikTok" />
              <LinkInput icon={<YoutubeIcon />} value={youtubeUrl} onChange={setYoutubeUrl} placeholder="https://youtube.com/@you" label="YouTube" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="gap-1"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              className="gap-1"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Submit</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function LinkInput({ icon, value, onChange, placeholder, label }: {
  icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm border-0 outline-none"
      />
    </div>
  );
}

// Simple SVG icons for social platforms
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.27 0 .54.04.8.1v-3.5a6.37 6.37 0 0 0-.8-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 10.86 4.48V12.8a8.28 8.28 0 0 0 5.58 2.16V11.5a4.85 4.85 0 0 1-3.36-1.36 4.85 4.85 0 0 1 3.36-3.45z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default ApplyToPostDialog;
