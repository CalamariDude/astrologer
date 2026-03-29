import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ExternalLink, MapPin, Monitor, Users, Globe, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePractitioner } from '@/hooks/usePractitioner';

function formatRate(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (cents: number) => `$${Math.round(cents / 100)}`;
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)} / hour`;
  return `${fmt(min || max!)} / hour`;
}

export default function AstrologerProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { practitioner: p, loading, notFound } = usePractitioner(slug);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !p) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Practitioner not found.</p>
        <Link to="/astrologers" className="text-sm text-primary hover:underline">Back to directory</Link>
      </div>
    );
  }

  const rate = formatRate(p.hourly_rate_min, p.hourly_rate_max);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: p.display_name,
    description: p.headline || p.bio || '',
    image: p.photo_url || undefined,
    url: `https://astrologerapp.org/astrologers/${p.slug}`,
    address: p.location ? { '@type': 'PostalAddress', addressLocality: p.location } : undefined,
    priceRange: rate || undefined,
  };

  const socials = [
    p.instagram_handle && { label: 'Instagram', url: `https://instagram.com/${p.instagram_handle}` },
    p.tiktok_handle && { label: 'TikTok', url: `https://tiktok.com/@${p.tiktok_handle}` },
    p.twitter_handle && { label: 'X / Twitter', url: `https://x.com/${p.twitter_handle}` },
    p.youtube_url && { label: 'YouTube', url: p.youtube_url },
    p.website_url && { label: 'Website', url: p.website_url },
    p.linktree_url && { label: 'Linktree', url: p.linktree_url },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <>
      <Helmet>
        <title>{p.display_name} — Professional Astrologer | Astrologer</title>
        <meta name="description" content={p.headline || `Book a reading with ${p.display_name}. Professional astrologer specializing in ${p.specialties.slice(0, 3).join(', ')}.`} />
        <link rel="canonical" href={`https://astrologerapp.org/astrologers/${p.slug}`} />
        {p.photo_url && <meta property="og:image" content={p.photo_url} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-lg font-semibold tracking-tight">Astrologer</Link>
            <Link to="/chart" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Open App</Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-10">
          <Link to="/astrologers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to directory
          </Link>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Photo */}
            {p.photo_url ? (
              <img src={p.photo_url} alt={p.display_name} className="w-28 h-28 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-muted flex items-center justify-center text-3xl font-semibold text-muted-foreground flex-shrink-0">
                {p.display_name.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{p.display_name}</h1>
                {p.is_verified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
              </div>
              {p.headline && <p className="text-lg text-muted-foreground mt-1">{p.headline}</p>}

              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-muted-foreground">
                {p.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {p.location}</span>}
                {p.offers_virtual && <span className="flex items-center gap-1"><Monitor className="w-4 h-4" /> Virtual sessions</span>}
                {p.offers_in_person && <span className="flex items-center gap-1"><Users className="w-4 h-4" /> In-person</span>}
                {p.years_experience && <span>{p.years_experience}+ years experience</span>}
              </div>

              {rate && <p className="text-lg font-semibold mt-4">{rate}</p>}

              {p.booking_url && (
                <a href={p.booking_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block">
                  <Button size="lg" className="gap-2">
                    Book a Session <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Specialties */}
          {p.specialties.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold text-foreground mb-3">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {p.specialties.map(s => (
                  <span key={s} className="px-3 py-1 rounded-full text-sm bg-primary/5 text-primary/80 border border-primary/10">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {p.bio && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold text-foreground mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{p.bio}</p>
            </div>
          )}

          {/* Languages */}
          {p.languages.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-foreground mb-2">Languages</h2>
              <div className="flex gap-2">
                {p.languages.map(l => (
                  <span key={l} className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Globe className="w-3.5 h-3.5" /> {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social links */}
          {socials.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-foreground mb-3">Links</h2>
              <div className="flex flex-wrap gap-3">
                {socials.map(s => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    {s.label} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {p.booking_url && (
            <div className="mt-16 p-8 rounded-2xl bg-muted/30 border border-border/50 text-center">
              <h2 className="text-xl font-bold mb-2">Ready to book?</h2>
              <p className="text-muted-foreground mb-5">Schedule a session with {p.display_name}.</p>
              <a href={p.booking_url} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2">
                  Book a Session <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          )}
        </main>

        <footer className="border-t border-border/50 py-8 px-4 mt-10">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <Link to="/" className="font-medium text-foreground">Astrologer</Link>
            <div className="flex gap-4">
              <Link to="/astrologers" className="hover:text-foreground transition-colors">Directory</Link>
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link to="/chart" className="hover:text-foreground transition-colors">Chart Tool</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
