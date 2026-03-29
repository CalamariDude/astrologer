import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react';
import { getBlogPost, blogPosts, BLOG_CATEGORIES } from '@/data/blogPosts';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) return <Navigate to="/blog" replace />;

  const category = BLOG_CATEGORIES.find(c => c.key === post.category);

  // Find related posts (same category, excluding current)
  const related = blogPosts
    .filter(p => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  // Structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishDate,
    author: {
      '@type': 'Organization',
      name: 'Astrologer',
      url: 'https://astrologerapp.org',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Astrologer',
      url: 'https://astrologerapp.org',
    },
  };

  return (
    <>
      <Helmet>
        <title>{post.metaTitle} | Astrologer Blog</title>
        <meta name="description" content={post.metaDescription} />
        <link rel="canonical" href={`https://astrologerapp.org/blog/${post.slug}`} />
        <meta property="og:title" content={post.metaTitle} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://astrologerapp.org/blog/${post.slug}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={post.metaTitle} />
        <meta name="twitter:description" content={post.metaDescription} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
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

        {/* Back link */}
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All posts
          </Link>
        </div>

        {/* Article */}
        <article className="max-w-3xl mx-auto px-4 pt-8 pb-16">
          {/* Meta */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <span>{category?.emoji} {category?.label}</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime} min read
            </span>
            <span className="text-border">|</span>
            <time dateTime={post.publishDate}>
              {new Date(post.publishDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Content */}
          <div
            className="prose prose-neutral dark:prose-invert max-w-none
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-muted-foreground
              prose-li:text-muted-foreground
              prose-strong:text-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-12 p-6 rounded-xl bg-muted/50 border border-border/50">
            <h3 className="text-lg font-semibold mb-2">
              Want to see this in your chart?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a free birth chart and get AI-powered readings personalized to your exact planetary placements.
            </p>
            <Link
              to="/chart"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Create Your Chart <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </article>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="border-t border-border/50 py-12">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-xl font-semibold mb-6">Related Articles</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map(r => (
                  <Link
                    key={r.slug}
                    to={`/blog/${r.slug}`}
                    className="group block rounded-xl border border-border/50 bg-card p-5 hover:border-border hover:shadow-lg transition-all"
                  >
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {r.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
