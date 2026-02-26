import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'Account Issue',
  'Subscription / Billing',
  'Chart Calculation Question',
  'Other',
] as const;

export default function SupportPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setSending(true);
    setError(null);

    try {
      const systemInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous',
      };

      const { data, error: fnError } = await supabase.functions.invoke('astrologer-support-ticket', {
        body: {
          email: email.trim(),
          category,
          subject: subject.trim() || `${category} from ${email.trim()}`,
          message: message.trim(),
          systemInfo,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send ticket. Please email us directly.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <Check className="w-7 h-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ticket Submitted</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We've received your message and will get back to you at <strong>{email}</strong> as soon as possible.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/">
              <Button variant="outline" size="sm">Back to Home</Button>
            </Link>
            <Button size="sm" onClick={() => { setSent(false); setSubject(''); setMessage(''); }}>
              Submit Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Support</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Found a bug or have a question? Submit a ticket and we'll get back to you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue or question in detail..."
              required
              rows={6}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
              <p className="mt-1 text-xs">You can also email us directly at <a href="mailto:zeineddine.jad@gmail.com" className="underline">zeineddine.jad@gmail.com</a></p>
            </div>
          )}

          <Button type="submit" disabled={sending || !email.trim() || !message.trim()} className="gap-2">
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Submit Ticket</>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground">
            System information (browser, screen size) is automatically included to help us debug issues.
          </p>
        </form>
      </div>
    </div>
  );
}
