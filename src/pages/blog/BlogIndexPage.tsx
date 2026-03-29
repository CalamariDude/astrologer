import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Clock } from 'lucide-react';
import { blogPosts, BLOG_CATEGORIES } from '@/data/blogPosts';

export default function BlogIndexPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? blogPosts.filter(p => p.category === activeCategory)
    : blogPosts;

  return (
    <>
      <Helmet>
        <title>Astrology Blog — Charts, Compatibility & Transits | Astrologer</title>
        <meta name="description" content="Explore astrology guides on compatibility, synastry charts, transits, birth chart readings, and more. Learn how the stars shape your relationships and life path." />
        <link rel="canonical" href="https://astrologerapp.org/blog" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-lg font-semibold tracking-tight">
              Astrologer
            </Link>
            <Link
              to="/chart"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Open App
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-16 pb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Astrology Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Deep dives into compatibility, synastry, transits, and everything your birth chart reveals. Written for curious minds, backed by real chart analysis.
          </p>
        </section>

        {/* Category filters */}
        <section className="max-w-6xl mx-auto px-4 pb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeCategory
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {BLOG_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key === activeCategory ? null : cat.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Post grid */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(post => {
              const category = BLOG_CATEGORIES.find(c => c.key === post.category);
              return (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group block rounded-xl border border-border/50 bg-card p-6 hover:border-border hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <span>{category?.emoji} {category?.label}</span>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime} min
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                    Read more <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-t border-border/50 py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to explore your chart?</h2>
            <p className="text-muted-foreground mb-6">
              Get a free birth chart, synastry analysis, and AI-powered readings.
            </p>
            <Link
              to="/chart"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Create Your Chart <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
