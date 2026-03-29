import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { usePractitioners } from '@/hooks/usePractitioners';
import { PractitionerCard } from '@/components/practitioners/PractitionerCard';
import { PractitionerFilters } from '@/components/practitioners/PractitionerFilters';

export default function AstrologerDirectoryPage() {
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [virtual, setVirtual] = useState(false);
  const [inPerson, setInPerson] = useState(false);

  const { practitioners, loading } = usePractitioners({
    specialty: specialty || undefined,
    virtual: virtual || undefined,
    inPerson: inPerson || undefined,
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Professional Astrologers Directory',
    numberOfItems: practitioners.length,
    itemListElement: practitioners.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://astrologerapp.org/astrologers/${p.slug}`,
      name: p.display_name,
    })),
  };

  return (
    <>
      <Helmet>
        <title>Find a Professional Astrologer | Astrologer</title>
        <meta name="description" content="Browse our directory of professional astrologers. Find the right practitioner for natal charts, synastry, horary, Vedic, and more. Book a session today." />
        <link rel="canonical" href="https://astrologerapp.org/astrologers" />
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

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-16 pb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Find a Professional Astrologer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse verified practitioners specializing in natal charts, synastry, horary, Vedic astrology, and more. Book a personal reading today.
          </p>
        </section>

        {/* Filters */}
        <section className="max-w-6xl mx-auto px-4 pb-8">
          <PractitionerFilters
            specialty={specialty}
            onSpecialtyChange={setSpecialty}
            virtual={virtual}
            inPerson={inPerson}
            onVirtualChange={setVirtual}
            onInPersonChange={setInPerson}
          />
        </section>

        {/* Grid */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : practitioners.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No astrologers found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {practitioners.map(p => (
                <PractitionerCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="border-t border-border/50 bg-muted/20">
          <div className="max-w-6xl mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-3">Are you an astrologer?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get a free profile in our directory and reach clients looking for professional readings.
            </p>
            <a
              href="mailto:hello@astrologerapp.org?subject=Practitioner%20Directory%20Listing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              Get Listed
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <Link to="/" className="font-medium text-foreground">Astrologer</Link>
            <div className="flex gap-4">
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link to="/chart" className="hover:text-foreground transition-colors">Chart Tool</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
