import React, { useState } from 'react';
import { ChevronDown, Send, Loader2, Check, MessageCircle } from 'lucide-react';
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

        {/* Inline Contact */}
        <div className="mt-14 rounded-2xl border border-border/40 bg-gradient-to-br from-slate-500/[0.02] to-transparent p-6 sm:p-8">
          <InlineContactForm />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline Contact Form — embedded directly in the FAQ section         */
/* ------------------------------------------------------------------ */

function InlineContactForm() {
  const { user } = useAuth();
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
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4 space-y-3 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <p className="text-base font-semibold">Message sent</p>
          <p className="text-sm text-muted-foreground mt-1">We'll get back to you at {email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Still have questions?</h3>
        </div>
        <p className="text-xs text-muted-foreground">Send us a message and we'll get back to you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What can we help with?"
          rows={1}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none sm:row-span-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter to send
        </span>
        <button
          onClick={handleSubmit}
          disabled={!email.trim() || !message.trim() || sending}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? 'Sending...' : 'Send'}
        </button>
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
