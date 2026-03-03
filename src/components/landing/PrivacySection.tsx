import React from 'react';

export function PrivacySection() {
  return (
    <section className="relative z-10 bg-background py-24 sm:py-32 px-4 sm:px-6 border-t border-border/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-foreground/25 mb-3">Privacy & Security</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Your data stays yours.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mt-4 max-w-lg mx-auto">
            Birth data is sensitive. We treat it that way.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {[
            {
              title: 'Private by default',
              desc: 'Your birth data is stored securely and never shared. Core chart features are free for every account.',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ),
            },
            {
              title: 'No ads. No data sales. No AI training.',
              desc: 'We never sell your data, never use it to train AI models, and never run advertising cookies or tracking pixels. Ever.',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
              ),
            },
            {
              title: 'Encrypted & secure',
              desc: 'All data in transit is encrypted via HTTPS. Payments are handled by Stripe — we never see your credit card number.',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              ),
            },
            {
              title: 'Delete everything, anytime',
              desc: 'Delete your account, all saved charts, and every session recording from your settings. Immediate, complete, and permanent.',
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              ),
            },
          ].map((item) => (
            <div key={item.title} className="p-5 sm:p-6 rounded-2xl bg-muted/30 border border-border/40">
              <div className="w-10 h-10 rounded-xl bg-foreground/[0.04] border border-border/50 flex items-center justify-center text-foreground/40 mb-4">
                {item.icon}
              </div>
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2">{item.title}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
