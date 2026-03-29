import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useFadeIn } from '@/hooks/useFadeIn';

const ARTICLES = [
  {
    title: 'Understanding Your Birth Chart',
    excerpt:
      'Planets, signs, houses, and aspects \u2014 everything you need to read a natal chart, explained from the ground up.',
    category: 'Beginner Guide',
    readTime: '12 min',
    waitlistId: 'birth-chart-guide',
  },
  {
    title: 'Saturn in Aries: 2025\u20132028',
    excerpt:
      'Saturn changed signs for the first time in three years. Here\u2019s what this transit means and how to work with it.',
    category: 'Transits',
    readTime: '8 min',
    waitlistId: 'saturn-aries',
  },
  {
    title: 'How to Read a Synastry Chart',
    excerpt:
      'A practical introduction to comparing two birth charts for relationship insights, with real examples.',
    category: 'Relationships',
    readTime: '10 min',
    waitlistId: 'synastry-guide',
  },
];

const COURSES = [
  {
    title: 'Natal Chart Fundamentals',
    description: 'Learn to read birth charts from scratch. Planets, signs, houses, and aspects.',
    status: 'Free',
    statusColor: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/15',
    waitlistId: 'natal-fundamentals',
  },
  {
    title: 'Advanced Synastry Techniques',
    description: 'Deep dive into relationship astrology. Composite charts, davison, and timing.',
    status: 'Coming Soon',
    statusColor: 'text-foreground/40 bg-foreground/[0.03] border-foreground/[0.06]',
    waitlistId: 'synastry-techniques',
  },
  {
    title: 'Professional Chart Reading',
    description: 'Prepare for client consultations. Session structure, ethics, and delivery.',
    status: 'Coming Soon',
    statusColor: 'text-foreground/40 bg-foreground/[0.03] border-foreground/[0.06]',
    waitlistId: 'professional-reading',
  },
];

export function LearnSection() {
  const fade = useFadeIn();

  return (
    <section className="relative z-10 bg-background py-20 sm:py-28 px-4 sm:px-6 border-t border-border/30" id="learn">
      <div ref={fade.ref} style={fade.style} className={`max-w-6xl mx-auto ${fade.className}`}>
        <div className="text-center mb-10 sm:mb-14">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-foreground/25 mb-3">
            Learn
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Deepen your practice.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mt-3 max-w-lg mx-auto">
            Articles, guides, and courses to help you get the most out of your charts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Articles */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/30 mb-5">
              Articles
            </h3>
            <div className="space-y-4">
              {ARTICLES.map((article) => (
                <Link
                  key={article.title}
                  to={`/waitlist?interest=${article.waitlistId}`}
                  className="group block p-4 sm:p-5 rounded-2xl border border-border/40 hover:border-border/70 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-foreground/[0.04] border border-foreground/[0.06] text-foreground/40">
                      {article.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">{article.readTime} read</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-foreground mb-1">{article.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{article.excerpt}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors flex-shrink-0 ml-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/30 mb-5">
              Courses
            </h3>
            <div className="space-y-4">
              {COURSES.map((course) => (
                <Link
                  key={course.title}
                  to={`/waitlist?interest=${course.waitlistId}`}
                  className="group block p-4 sm:p-5 rounded-2xl border border-border/40 hover:border-border/70 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold text-foreground">{course.title}</h4>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0 ${course.statusColor}`}
                    >
                      {course.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors flex-shrink-0 ml-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
