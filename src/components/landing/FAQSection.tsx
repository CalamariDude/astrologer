import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Send, Loader2, Check, MessageCircle, X, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

function FAQItem({ question, answer, children }: { question: string; answer: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base sm:text-lg font-medium pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '600px' : '0', opacity: open ? 1 : 0 }}
      >
        <p className="pb-3 text-sm sm:text-base text-muted-foreground leading-relaxed">{answer}</p>
        {children && <div className="pb-5">{children}</div>}
      </div>
    </div>
  );
}

export const FAQ_ITEMS = [
  {
    question: 'Is Astrologer really free?',
    answer: 'Yes! Natal charts, synastry, composites, progressed charts, returns, transits, profections, ephemeris tables, 50+ asteroids — all free. Pro adds AI interpretations, live sessions, and unlimited saved charts, but the core tools are yours at no cost.',
  },
  {
    question: 'How accurate are the calculations?',
    answer: 'All calculations are accurate to sub-arcsecond precision — the same level of accuracy used by professional desktop software. Every planetary position, aspect, and house cusp is calculated with full astronomical accuracy.',
  },
  {
    question: 'Can I import my charts from other apps?',
    answer: 'Yes! You can import all your saved charts from Astro.com with a single paste. Just copy your profile data and Astrologer will parse and import every chart automatically.',
  },
  {
    question: 'What devices does it work on?',
    answer: 'Any modern browser — Mac, Windows, iPad, iPhone, Android, Chromebook. No installation needed. Your charts sync across every device.',
  },
  {
    question: 'What do the paid plans include?',
    answer: 'Astrologer Pro ($7.99/mo) includes 100 AI readings, 5 live sessions, and 3 transcriptions per month. Professional ($14.99/mo) includes 300 AI readings, 20 live sessions, 20 transcriptions, and priority support. Both include unlimited saved charts. Annual plans save you ~25%.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. Cancel from your settings whenever you like — you\'ll keep Pro access through the end of your billing period. If something isn\'t right, reach out and we\'ll make it right.',
    hasContactForm: true,
  },
];

export function FAQSection() {
  return (
    <section className="relative z-10 bg-background py-24 sm:py-32 px-4 sm:px-6 border-t border-border/30">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Common questions
          </h2>
        </div>
        <div className="border-t border-border/50">
          {FAQ_ITEMS.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer}>
              {(item as any).hasContactForm && <InlineSupportWidget />}
            </FAQItem>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Still have questions?</p>
          <QuickContactButton />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Contact Button — opens a floating mini-form                  */
/* ------------------------------------------------------------------ */

function QuickContactButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <MessageCircle className="w-4 h-4" />
        Talk to us
      </button>
      {open && <FloatingContactForm onClose={() => setOpen(false)} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating Contact Form — appears as a modal card                    */
/* ------------------------------------------------------------------ */

function FloatingContactForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [phase, setPhase] = useState<'form' | 'sending' | 'sent'>('form');
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) onClose();
    };
    // Delay to avoid closing immediately from the button click
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const handleSubmit = async () => {
    if (!email.trim() || !message.trim()) return;
    setSending(true);
    setPhase('sending');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('astrologer-support-ticket', {
        body: {
          email: email.trim(),
          category: 'General',
          subject: `Quick message from ${email.trim()}`,
          message: message.trim(),
          systemInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userId: user?.id || 'anonymous',
            source: 'faq-contact-form',
          },
        },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      // Success animation delay
      await new Promise(r => setTimeout(r, 600));
      setPhase('sent');
    } catch (err: any) {
      setError(err.message || 'Failed to send. Please try again.');
      setPhase('form');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div
        ref={formRef}
        className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium">Send us a message</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {phase === 'sent' ? (
            <div className="text-center py-6 space-y-3 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-semibold">Message received</p>
                <p className="text-sm text-muted-foreground mt-1">We'll get back to you at {email}</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          ) : phase === 'sending' ? (
            <div className="text-center py-10 space-y-4 animate-in fade-in duration-200">
              <SendingAnimation />
              <p className="text-sm text-muted-foreground">Sending your message...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What can we help with?"
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
                  }}
                />
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to send
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!email.trim() || !message.trim() || sending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sending Animation — animated envelope/sparkle                      */
/* ------------------------------------------------------------------ */

function SendingAnimation() {
  return (
    <div className="relative w-16 h-16 mx-auto">
      {/* Orbiting sparkles */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
        <Sparkles className="w-3 h-3 text-amber-500 absolute -top-1 left-1/2 -translate-x-1/2" />
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
        <Sparkles className="w-2.5 h-2.5 text-violet-400 absolute -top-1 left-1/2 -translate-x-1/2" />
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '2s' }}>
        <Sparkles className="w-2 h-2 text-sky-400 absolute -top-1 left-1/2 -translate-x-1/2" />
      </div>
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
          <Send className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline Support Widget — compact form embedded in FAQ answer        */
/* ------------------------------------------------------------------ */

function InlineSupportWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !message.trim()) return;
    setSending(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('astrologer-support-ticket', {
        body: {
          email: email.trim(),
          category: 'Subscription / Billing',
          subject: `Cancellation/billing question from ${email.trim()}`,
          message: message.trim(),
          systemInfo: {
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userId: user?.id || 'anonymous',
            source: 'faq-inline-widget',
          },
        },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400">
        <Check className="w-4 h-4 shrink-0" />
        Message sent — we'll get back to you shortly.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-border hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Need help with billing? Message us here
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="How can we help?"
        rows={2}
        className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={!email.trim() || !message.trim() || sending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          {sending ? 'Sending...' : 'Send'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
