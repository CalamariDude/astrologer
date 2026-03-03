import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function FAQItem({ question, answer }: { question: string; answer: string }) {
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
        style={{ maxHeight: open ? '300px' : '0', opacity: open ? 1 : 0 }}
      >
        <p className="pb-5 text-sm sm:text-base text-muted-foreground leading-relaxed">{answer}</p>
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
    answer: 'Of course. Cancel from your settings whenever you like — you\'ll keep Pro access through the end of your billing period. No questions asked.',
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
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
