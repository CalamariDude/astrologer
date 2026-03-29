import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeaturePageLayout } from '@/components/landing/FeaturePageLayout';
import { useFadeIn } from '@/hooks/useFadeIn';

const CATEGORIES = [
  {
    name: 'Actors',
    color: '#e11d48',
    people: ['Leonardo DiCaprio', 'Angelina Jolie', 'Brad Pitt', 'Meryl Streep', 'Marilyn Monroe', 'Scarlett Johansson', 'Johnny Depp', 'Robert De Niro', 'Nicole Kidman', 'Tom Hanks'],
  },
  {
    name: 'Musicians',
    color: '#7c3aed',
    people: ['Beyonc\u00e9', 'Prince', 'David Bowie', 'Madonna', 'Freddie Mercury', 'Lady Gaga', 'Jimi Hendrix', 'Whitney Houston', 'John Lennon', 'Elvis Presley'],
  },
  {
    name: 'Scientists',
    color: '#2563eb',
    people: ['Albert Einstein', 'Nikola Tesla', 'Marie Curie', 'Isaac Newton', 'Stephen Hawking', 'Carl Sagan', 'Carl Jung', 'Sigmund Freud', 'Charles Darwin', 'Galileo Galilei'],
  },
  {
    name: 'Leaders',
    color: '#d97706',
    people: ['Barack Obama', 'Queen Elizabeth II', 'JFK', 'Gandhi', 'Nelson Mandela', 'MLK Jr.', 'Winston Churchill', 'Abraham Lincoln', 'Princess Diana', 'Angela Merkel'],
  },
  {
    name: 'Artists',
    color: '#db2777',
    people: ['Pablo Picasso', 'Frida Kahlo', 'Leonardo da Vinci', 'Vincent van Gogh', 'Salvador Dal\u00ed', 'Andy Warhol', 'Michelangelo', 'Claude Monet', 'Georgia O\'Keeffe', 'Rembrandt'],
  },
  {
    name: 'Writers',
    color: '#0891b2',
    people: ['Shakespeare', 'Virginia Woolf', 'Ernest Hemingway', 'Edgar Allan Poe', 'Oscar Wilde', 'Sylvia Plath', 'Mark Twain', 'Jane Austen', 'Franz Kafka', 'Dostoevsky'],
  },
  {
    name: 'Athletes',
    color: '#059669',
    people: ['Michael Jordan', 'Serena Williams', 'Muhammad Ali', 'Lionel Messi', 'Cristiano Ronaldo', 'LeBron James', 'Tiger Woods', 'Usain Bolt', 'Tom Brady', 'Michael Phelps'],
  },
  {
    name: 'Historical',
    color: '#78716c',
    people: ['Napoleon', 'Cleopatra', 'Julius Caesar', 'Alexander the Great', 'Nostradamus', 'Benjamin Franklin', 'Marie Antoinette', 'Coco Chanel', 'Genghis Khan', 'Nikola Tesla'],
  },
];

function CelebrityGrid() {
  const fade = useFadeIn();
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-background">
      <div ref={fade.ref} style={fade.style} className={`max-w-6xl mx-auto ${fade.className}`}>
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Browse by category</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-md mx-auto">
            80 charts across 8 categories. Click any name to load their natal chart instantly.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className="p-5 rounded-2xl border border-border/50 hover:border-border hover:shadow-sm transition-all">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
                <span className="text-[10px] text-muted-foreground ml-auto">{cat.people.length}</span>
              </div>
              <div className="space-y-1.5">
                {cat.people.map((name) => (
                  <div key={name} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-default leading-relaxed">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const fade = useFadeIn();
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-background">
      <div ref={fade.ref} style={fade.style} className={`max-w-4xl mx-auto ${fade.className}`}>
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Browse or search', desc: 'Filter by category or search by name. Every chart includes verified birth data with time and location.' },
            { step: '2', title: 'Open the chart', desc: 'Click any celebrity and their natal chart loads in the full chart tool with all 13 analysis panels.' },
            { step: '3', title: 'Compare charts', desc: 'Run synastry between any celebrity and your own chart, or between two celebrities.' },
          ].map((s) => (
            <div key={s.step} className="p-5 sm:p-6 rounded-2xl border border-border/50">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-600 text-sm font-bold mb-4">{s.step}</div>
              <h4 className="text-base font-semibold text-foreground mb-2">{s.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CelebrityChartsFeaturePage() {
  return (
    <FeaturePageLayout
      pageTitle="Celebrity Charts"
      tag="Celebrity Charts"
      title="Explore the charts of people you admire."
      description="80 pre-loaded birth charts of actors, musicians, scientists, leaders, artists, writers, athletes, and historical figures. Verified birth data, ready to analyze."
      gradient="bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent"
    >
      <HowItWorks />
      <CelebrityGrid />
    </FeaturePageLayout>
  );
}
