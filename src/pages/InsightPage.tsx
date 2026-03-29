/**
 * InsightPage — Curiosity-gated micro-reading funnel
 *
 * Flow: FB Ad → Landing → Enter Birthday + Email → Free Teaser → Paywall → Full Reading ($10)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Lock, Mail, ChevronRight, ArrowRight, Check, MapPin, Share2, Link2, Download, MessageCircle, Sparkles, Heart, Zap } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase } from '@/lib/supabase';
import { swissEphemeris } from '@/api/swissEphemeris';
import { getInsightModule, INSIGHT_MODULE_LIST, type InsightModule } from '@/lib/insights/modules';
import type { NatalChart } from '@/lib/chartReading/types';
import { DEFAULT_PARAMS } from '@/lib/chartReading/types';
import {
  buildTreesForQuestion,
  enrichTreesWithTransits,
  enrichTreesWithProfections,
  enrichTreesWithActivations,
} from '@/lib/chartReading/buildVantageTree';
import { buildSynastryTreeGroups } from '@/lib/chartReading/buildSynastryTree';
import * as analytics from '@/lib/analytics';
import * as metaPixel from '@/lib/metaPixel';
import { InsightJourney } from '@/components/insights/InsightJourney';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/** Module-specific "What You'll Discover" items — emotionally compelling, answers real questions */
const MODULE_DISCOVER_ITEMS: Record<string, string[]> = {
  'future-partner': [
    'Your love language blueprint — how you give and receive love',
    'The exact qualities that make someone "the one" for you',
    'Your romantic blind spots — why past relationships didn\'t work',
    'When your next major love window opens (specific timing)',
    'The type of person your chart says you\'re magnetically drawn to',
    'What kind of first date energy signals a real connection',
  ],
  'hidden-talent': [
    'The natural ability you\'ve been underestimating your whole life',
    'Why you feel restless — and what that energy actually wants',
    'Your creative superpower and how to start using it',
    'When the next breakthrough window opens for you',
    'What\'s been quietly blocking your full potential',
    'The environment where your talent naturally thrives',
  ],
  'money-blueprint': [
    'Your natural wealth-building style — how money flows to you',
    'Financial blind spots that are silently costing you',
    'Your next major money window — when to make bold moves',
    'Whether you\'re a saver, earner, investor, or creator by nature',
    'The career pivot that could unlock your earning potential',
    'What\'s been blocking your financial expansion',
  ],
  'career-path': [
    'The career you were literally designed for',
    'Why your current path feels wrong (or right)',
    'Your professional superpower — what makes you irreplaceable',
    'When to make your next career move (specific timing)',
    'The work environment where you\'ll actually thrive',
    'What\'s been holding you back from the next level',
  ],
  'life-purpose': [
    'Why you feel like something is "missing" — and what it is',
    'The soul mission you chose before you were born',
    'Past life patterns you\'re unconsciously repeating',
    'When your next major life turning point arrives',
    'What you need to release to step into your purpose',
    'The daily choices that align you with your destiny',
  ],
  'shadow-self': [
    'The hidden pattern running your life beneath the surface',
    'Why you self-sabotage — and how to finally stop',
    'The relationship dynamic you keep recreating (and why)',
    'Your deepest fear and the power hiding behind it',
    'When your shadow is being triggered this year',
    'How to turn your darkness into your greatest strength',
  ],
};

/** Suggested custom questions per module — self-contained, answerable from the chart alone */
const MODULE_SUGGESTED_QUESTIONS: Record<string, string[]> = {
  'future-partner': [
    'What kind of person am I naturally drawn to?',
    'What patterns do I repeat in relationships?',
    'What does lasting love look like for me?',
    'When is my next major love window?',
  ],
  'hidden-talent': [
    'What natural ability have I been underusing?',
    'What kind of creative work suits me best?',
    'Where could my talents take me professionally?',
    'What has been quietly holding me back?',
  ],
  'money-blueprint': [
    'What is my natural wealth-building style?',
    'What financial blind spots should I watch for?',
    'When is my next major money window?',
    'What kind of work generates the most wealth for me?',
  ],
  'career-path': [
    'What type of work am I naturally built for?',
    'What environment do I thrive in professionally?',
    'What is my biggest career strength?',
    'When is my next big professional opportunity?',
  ],
  'life-purpose': [
    'What is the central theme of my life mission?',
    'What old patterns do I need to release?',
    'What kind of impact am I meant to have?',
    'What is aligning in my life right now?',
  ],
  'shadow-self': [
    'What is my main unconscious pattern?',
    'What triggers me disproportionately and why?',
    'What quality do I judge in others that exists in me?',
    'What gift is hiding inside my shadow?',
  ],
};

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

function parseNatalResponse(data: any) {
  const planets: Record<string, any> = {};
  if (data.planets && Array.isArray(data.planets)) {
    for (const p of data.planets) {
      let key = (p.name || p.planet || '').toLowerCase();
      if (key === 'north node' || key === 'true_node' || key === 'mean_node') key = 'northnode';
      if (key === 'south node') key = 'southnode';
      if (!key) continue;
      planets[key] = {
        longitude: p.longitude ?? p.abs_pos ?? 0,
        sign: p.sign || ZODIAC_SIGNS[Math.floor((p.longitude ?? 0) / 30)] || '',
        retrograde: p.retrograde ?? false,
        house: p.house,
        degree: p.degree,
      };
    }
  }
  const houses: Record<string, number> = {};
  if (data.houses) {
    if (Array.isArray(data.houses)) {
      data.houses.forEach((cusp: number, i: number) => { houses[`house_${i + 1}`] = cusp; });
    } else if (data.houses.cusps) {
      data.houses.cusps.forEach((cusp: number, i: number) => { houses[`house_${i + 1}`] = cusp; });
    }
  }
  let angles: { ascendant: number; midheaven: number } | undefined;
  if (data.angles) {
    angles = { ascendant: data.angles.ascendant ?? data.angles.asc ?? 0, midheaven: data.angles.midheaven ?? data.angles.mc ?? 0 };
  } else if (data.houses?.ascendant !== undefined) {
    angles = { ascendant: data.houses.ascendant, midheaven: data.houses.mc ?? data.houses.midheaven ?? 0 };
  }
  return { planets, houses, angles };
}

// ─── Shared Styles ────────────────────────────────────────────────

const inputClass = 'w-full h-12 px-4 rounded-xl bg-muted/50 border border-border text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors';
const labelClass = 'text-[13px] font-medium text-muted-foreground mb-2 block';

// ─── Location Input with Auto-Search ──────────────────────────────

function LocationInput({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (location: string, lat: number, lng: number) => void;
}) {
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);

  // Auto-search on type with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }
    if (!value || value.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const base = import.meta.env.DEV ? '/nominatim' : 'https://nominatim.openstreetmap.org';
        const res = await fetch(`${base}/search?format=json&q=${encodeURIComponent(value)}&limit=5`);
        const json: GeoResult[] = await res.json();
        setResults(json);
        setShowDropdown(json.length > 0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectResult = (r: GeoResult) => {
    // Show just the city/country part, not the full address
    const parts = r.display_name.split(',');
    const short = parts.length > 2
      ? `${parts[0].trim()}, ${parts[parts.length - 1].trim()}`
      : r.display_name;
    justSelectedRef.current = true;
    onChange(short);
    onSelect(short, parseFloat(r.lat), parseFloat(r.lon));
    setShowDropdown(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="City of birth"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          className={inputClass + ' pl-11'}
        />
        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 animate-spin" />}
      </div>
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden z-20">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectResult(r)}
              className="w-full text-left px-4 py-3 text-sm text-foreground/80 hover:bg-muted border-b border-border/50 last:border-0 transition-colors"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Birth Data Step ──────────────────────────────────────────────

interface BirthSubmitData {
  date: string; time: string; email: string; location: string; lat: number; lng: number;
  personB?: { date: string; time: string; name: string; location: string; lat: number; lng: number };
}

function PersonFields({ label, date, setDate, time, setTime, location, setLocation, lat, setLat, lng, setLng, name, setName }: {
  label: string; date: string; setDate: (v: string) => void; time: string; setTime: (v: string) => void;
  location: string; setLocation: (v: string) => void; lat: number | null; setLat: (v: number | null) => void;
  lng: number | null; setLng: (v: number | null) => void; name?: string; setName?: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      {setName !== undefined && (
        <div>
          <label className={labelClass}>{label}'s Name</label>
          <input type="text" placeholder="Their name" value={name || ''} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
      )}
      <div>
        <label className={labelClass}>{label}'s Date of Birth</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>
          {label}'s Time of Birth
          <span className="text-muted-foreground/60 ml-1 font-normal">(optional)</span>
        </label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>{label}'s Place of Birth</label>
        <LocationInput
          value={location}
          onChange={(v) => { setLocation(v); setLat(null); setLng(null); }}
          onSelect={(loc, la, ln) => { setLocation(loc); setLat(la); setLng(ln); }}
        />
      </div>
    </div>
  );
}

function BirthDataStep({
  module,
  onSubmit,
  loading,
}: {
  module: InsightModule;
  onSubmit: (data: BirthSubmitData) => void;
  loading: boolean;
}) {
  const isSynastry = !!module.isSynastry;

  // Person A
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Person B (synastry only)
  const [dateB, setDateB] = useState('');
  const [timeB, setTimeB] = useState('');
  const [nameB, setNameB] = useState('');
  const [locationB, setLocationB] = useState('');
  const [latB, setLatB] = useState<number | null>(null);
  const [lngB, setLngB] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) { toast.error('Enter your date of birth'); return; }
    if (!email || !email.includes('@')) { toast.error('Enter a valid email'); return; }
    if (lat === null || lng === null) { toast.error('Select your birth city from the dropdown'); return; }
    if (!termsAccepted) { toast.error('Please accept the Terms and Privacy Policy'); return; }
    if (isSynastry) {
      if (!dateB) { toast.error("Enter the other person's date of birth"); return; }
      if (latB === null || lngB === null) { toast.error("Select the other person's birth city from the dropdown"); return; }
    }
    onSubmit({
      date, time: time || '12:00', email, location, lat, lng,
      ...(isSynastry ? {
        personB: { date: dateB, time: timeB || '12:00', name: nameB || 'Person B', location: locationB, lat: latB!, lng: lngB! },
      } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[420px] mx-auto">
      <div className="space-y-5">
        {isSynastry ? (
          <>
            <div className="rounded-xl border border-border p-4 space-y-4">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Person 1 (You)</p>
              <PersonFields label="Your" date={date} setDate={setDate} time={time} setTime={setTime} location={location} setLocation={setLocation} lat={lat} setLat={setLat} lng={lng} setLng={setLng} />
            </div>
            <div className="flex items-center justify-center">
              <span className="text-muted-foreground/40 text-lg">+</span>
            </div>
            <div className="rounded-xl border border-border p-4 space-y-4">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Person 2</p>
              <PersonFields label="Their" date={dateB} setDate={setDateB} time={timeB} setTime={setTimeB} location={locationB} setLocation={setLocationB} lat={latB} setLat={setLatB} lng={lngB} setLng={setLngB} name={nameB} setName={setNameB} />
            </div>
          </>
        ) : (
          <>
            {/* Date of Birth */}
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>
            {/* Time of Birth */}
            <div>
              <label className={labelClass}>
                Time of Birth
                <span className="text-muted-foreground/60 ml-1 font-normal">(optional)</span>
              </label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
            </div>
            {/* Location */}
            <div>
              <label className={labelClass}>Place of Birth</label>
              <LocationInput
                value={location}
                onChange={(v) => { setLocation(v); setLat(null); setLng(null); }}
                onSelect={(loc, la, ln) => { setLocation(loc); setLat(la); setLng(ln); }}
              />
            </div>
          </>
        )}

        {/* Email */}
        <div>
          <label className={labelClass}>Your Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass + ' pl-11'}
            />
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-1.5 ml-1">Get free weekly transit insights in your inbox</p>
        </div>

        {/* Terms & Privacy */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
          />
          <span className="text-[12px] text-muted-foreground/70 leading-relaxed">
            I agree to the{' '}
            <Link to="/terms" target="_blank" className="underline hover:text-foreground/80 transition-colors">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" target="_blank" className="underline hover:text-foreground/80 transition-colors">Privacy Policy</Link>.
            I consent to receiving personalized readings, transit updates, and promotional emails. You can unsubscribe anytime.
          </span>
        </label>

        {/* Submit */}
        <div className="pt-2">
          {loading ? (
            <LoadingProgress />
          ) : (
            <button
              type="submit"
              disabled={!date || !email || !termsAccepted}
              className="w-full rounded-xl text-[15px] font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #8b6cc1 0%, #c06c84 50%, #d4a574 100%)',
                color: '#fff',
                border: 'none',
                height: 52,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                {isSynastry ? 'See Our Compatibility' : 'See My Reading'}
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

// ─── Chart Snapshot Facts (instant, no AI) ────────────────────────

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
  Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
  Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
};
const SIGN_QUALITIES: Record<string, string> = {
  Aries: 'Cardinal', Taurus: 'Fixed', Gemini: 'Mutable', Cancer: 'Cardinal',
  Leo: 'Fixed', Virgo: 'Mutable', Libra: 'Cardinal', Scorpio: 'Fixed',
  Sagittarius: 'Mutable', Capricorn: 'Cardinal', Aquarius: 'Fixed', Pisces: 'Mutable',
};
const SIGN_DESCRIPTORS: Record<string, string> = {
  Aries: 'bold and direct', Taurus: 'steady and sensual', Gemini: 'quick and curious',
  Cancer: 'nurturing and intuitive', Leo: 'warm and magnetic', Virgo: 'precise and thoughtful',
  Libra: 'balanced and charming', Scorpio: 'deep and intense', Sagittarius: 'adventurous and honest',
  Capricorn: 'ambitious and grounded', Aquarius: 'independent and inventive', Pisces: 'dreamy and empathic',
};
const PLANET_DISPLAY: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
  northnode: 'North Node', chiron: 'Chiron',
};

/** Animated loading progress — smooth continuous bar */
function LoadingProgress() {
  const [pct, setPct] = useState(0);
  const [label, setLabel] = useState('Calculating planetary positions');

  useEffect(() => {
    const labels = [
      { at: 0, text: 'Calculating planetary positions' },
      { at: 20, text: 'Mapping house placements' },
      { at: 35, text: 'Analyzing aspect patterns' },
      { at: 50, text: 'Checking current transits' },
      { at: 65, text: 'Building your reading' },
      { at: 80, text: 'Preparing your journey' },
      { at: 92, text: 'Almost ready...' },
    ];

    let current = 0;
    const interval = setInterval(() => {
      // Decelerate as progress increases — fast at start, crawls near the end
      const remaining = 99 - current;
      const increment = remaining * (0.02 + Math.random() * 0.03); // 2-5% of remaining distance
      current += Math.max(increment, 0.1); // minimum 0.1% per tick
      if (current > 99) current = 99;
      setPct(current);

      // Update label based on progress
      for (let i = labels.length - 1; i >= 0; i--) {
        if (current >= labels[i].at) {
          setLabel(labels[i].text);
          break;
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-[14px] font-medium text-foreground">{label}</span>
      </div>
      <div className="space-y-1.5">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-end text-[10px] text-muted-foreground">
          <span className="tabular-nums">{Math.round(pct)}%</span>
        </div>
      </div>
    </div>
  );
}

/** Mini reading snippets generated from chart data — no AI, instant */
const PLANET_MINI_READINGS: Record<string, Record<string, string>> = {
  sun: {
    Aries: "You walk into rooms like you belong there — because you do. You're the one who volunteers first, speaks first, and gets bored if nobody's taking action. People either find that energy magnetic or intimidating. You don't really care which.",
    Taurus: "You're the person everyone calls when they need to feel grounded. You have an almost physical relationship with comfort — good food, good music, the right texture of sheets. Once you decide something is yours, you don't let go easily. That applies to people too.",
    Gemini: "Your brain runs about three conversations at once, and somehow you're winning all of them. People underestimate you because you seem scattered, but you're actually connecting dots they can't even see yet. You get bored faster than almost anyone you know.",
    Cancer: "You remember the exact tone of voice someone used when they said something that hurt you years ago. Your memory for emotional detail is almost supernatural. You build invisible walls that look like warmth — people think they're close to you, but you decide who actually gets in.",
    Leo: "Here's the thing about you: it's not that you need attention. It's that you need to matter. There's a difference. You give so generously that when people don't match that energy, it doesn't just disappoint you — it makes you question everything.",
    Virgo: "You've rewritten the same email three times today. You noticed the typo in the restaurant menu. You reorganized your friend's kitchen without being asked. The thing no one tells you: your 'overthinking' is actually a kind of intelligence most people don't have.",
    Libra: "You can hold two contradictory ideas in your head and genuinely see the merit in both. People mistake this for indecision. It's not — it's that you actually understand nuance in a world that doesn't reward it. Your biggest struggle is choosing yourself as loudly as you choose others.",
    Scorpio: "You knew your coworker was lying before they finished the sentence. You can feel when someone's energy shifts in a room. You don't do casual, you don't do half-in, and you never forget. The intensity that scares some people is the exact thing the right ones can't get enough of.",
    Sagittarius: "You've probably changed your entire life plan at least twice — new city, new career, new belief system. It's not flakiness. It's that you'd rather be honest about who you're becoming than loyal to who you used to be. That terrifies most people. Not you.",
    Capricorn: "You've been acting like an adult since you were twelve. You carry a quiet authority that people respect even when they don't understand where it comes from. Here's the secret you won't admit: underneath all that discipline, you're actually deeply emotional. You just show it to almost no one.",
    Aquarius: "You've been called 'weird' your entire life, and at some point you stopped trying to fix that. Good. Your mind works differently — you see systems, patterns, and possibilities that most people are blind to. The loneliness you sometimes feel isn't a flaw. It's the cost of thinking ahead of your time.",
    Pisces: "You've cried at a song, a stranger's story, a sunset, and a commercial — possibly all in the same week. Your emotional range is enormous. What people don't see is the steel underneath the softness. You survive things that would destroy less adaptable people, and you do it with grace.",
  },
  moon: {
    Aries: "When you're upset, you need to move — walk it off, vent it out, do something physical. Sitting with feelings feels like being trapped. You recover from heartbreak faster than most, but you also ignite faster. The people who love you learn to not take the first reaction personally.",
    Taurus: "You've eaten the same comfort meal during every emotional crisis for the last five years. Change doesn't just bother you — it physically unsettles you. But when you finally feel safe? You're the most loyal, most present, most comforting person in the room. And people know it.",
    Gemini: "You process feelings by talking about them — to friends, in your notes app, sometimes to strangers. The moment you go quiet is when people should worry. You need a partner who can keep up with your emotional speed and who understands that your mind and heart are the same thing.",
    Cancer: "You remember exactly how someone made you feel the first time you met them. Your gut instinct about people is almost never wrong. Home isn't a place for you — it's a feeling, and you spend your whole life trying to build it with the right people.",
    Leo: "You don't need compliments — you need proof that you matter to someone. There's a child inside you who just wants to be someone's favorite, and you'll light the whole room on fire with your warmth trying to earn it. When you finally find someone who gives that back freely? That's your person.",
    Virgo: "Your love language is noticing. You remember their coffee order, their mother's birthday, the thing they mentioned once in passing three months ago. But your inner critic runs 24/7, and the same attention you give others, you use against yourself. Learning to be as gentle with yourself as you are with everyone else — that's your real work.",
    Libra: "You physically feel other people's tension. Arguments make you sick to your stomach. You'll apologize for things that aren't your fault just to restore peace. The lesson you keep learning: you can't harmony your way out of every problem. Sometimes the most loving thing is letting things be messy.",
    Scorpio: "You love like you're going to war — completely, fiercely, with everything you have. Betrayal doesn't just hurt; it restructures you. People think you're intense. You are. But that intensity is also why when someone earns your loyalty, they have it for life. Nobody protects their people like you do.",
    Sagittarius: "You need emotional space the way other people need emotional closeness. It's not that you don't feel deeply — you do. But you process through movement, humor, perspective-shifts. The partner who gives you room to breathe is the one you'll actually stay for.",
    Capricorn: "Somewhere in childhood, you learned that showing feelings was a liability. So you built a fortress. You can count on one hand the people who've actually seen you cry. But here's what you might not know: the people who've seen behind that wall consider it the greatest honor of their lives.",
    Aquarius: "People think you're emotionally detached. The truth is you feel everything — you just process it through your intellect first. Your emotional life is rich and complex; you just don't perform it the way society expects. The right people won't need you to.",
    Pisces: "You walk into a room and feel every single person's mood like weather. You've been carrying emotions that aren't even yours since childhood. Your empathy is a superpower — but it's also exhausting. The first person you need to learn to take care of is yourself.",
  },
  venus: {
    Aries: "You don't crush — you combust. Interest hits you like a lightning bolt, and you want to act on it immediately. You're attracted to confidence, directness, and people who can match your intensity without flinching. Boring is the one thing you'll never forgive in a partner.",
    Taurus: "You want love that feels like coming home. Shared meals, comfortable silence, their hoodie on your pillow. You'd take consistency over excitement any day, and the person who thinks that's boring isn't your person. The one who thinks it's sacred — that's who you're looking for.",
    Gemini: "The fastest way to your heart is through your brain. You need a partner who can text you something at 2am that makes you think, laugh, or see something differently. Physical chemistry matters, but if you can't talk for hours, you'll get restless. You always do.",
    Cancer: "You love by remembering. Their favorite song, the story about their grandmother, how they take their coffee on sad days versus happy ones. You create emotional homes around people. The right partner doesn't just accept that — they build one back.",
    Leo: "You love like a spotlight — warm, generous, impossible to ignore. You plan the surprises, write the long messages, remember the anniversaries. But you need that energy returned, not just received. The partner who celebrates you as loudly as you celebrate them? That's your forever.",
    Virgo: "You won't say 'I love you' first, but you'll fill their gas tank, pack their lunch, and fix the thing they complained about once. Your love is in the details. The right person reads those details like a love letter — because that's exactly what they are.",
    Libra: "You were born knowing how to make someone feel chosen. You mirror, you charm, you find the beauty in people before they find it in themselves. But your real lesson in love isn't about giving — it's about receiving without guilt, and choosing yourself without apology.",
    Scorpio: "Your love is not for the faint of heart. You want to know everything — their secrets, their fears, the thing they've never told anyone. Casual dating feels pointless to you. You want transformation, not entertainment. And when you find the person who can handle that depth? Nothing else even comes close.",
    Sagittarius: "You fall in love with potential, with freedom, with the version of life that's bigger than the one you're currently living. You need a partner who feels like an adventure, not an anchor. Commitment doesn't scare you — smallness does.",
    Capricorn: "You vet partners the way other people vet investments — carefully, slowly, with an eye on long-term returns. You're not cold; you're selective. And the person who earns your trust? They're getting someone whose loyalty runs deeper than most people can even comprehend.",
    Aquarius: "You need a partner who is genuinely their own person. Clingy, conventional, or predictable — any of those and you'll quietly check out within months. Your ideal love feels more like best friends who also happen to be wildly attracted to each other.",
    Pisces: "You love with a kind of devotion that terrifies most people — because it's real. You see the best version of someone before they see it themselves, and you love that version fiercely. Your lesson isn't to love less. It's to make sure they deserve it.",
  },
  mars: {
    Aries: "When you want something, you go get it. No strategy, no waiting — just pure action. You fight fast and loud, but you also forgive fast. People who play games with you lose immediately, because you simply don't play.",
    Taurus: "You're slow to anger, but when you finally snap, everyone remembers. Your drive is quiet and relentless — you don't sprint, you outlast. In competition, you're the tortoise that always wins, and you make it look easy.",
    Gemini: "Your sharpest weapon is your words. In any argument, you're already three moves ahead. You fight with logic, wit, and the exact sentence that lands where it hurts most. You pursue what you want through charm before force — and it usually works.",
    Cancer: "You fight for the people you love more fiercely than you fight for yourself. Your drive is protective, emotional, and deeply instinctual. Cross someone you care about and you become a completely different person. People learn that lesson once.",
    Leo: "You pursue your goals with a confidence that borders on theatrical — and it works. When you're passionate about something, your energy is contagious. You don't just want to win; you want to win in a way that people notice and remember.",
    Virgo: "Your drive operates like a precision instrument. Where others use brute force, you use analysis, timing, and preparation. You don't make big dramatic moves — you make the exact right move at the exact right moment. That's why you usually come out ahead.",
    Libra: "You avoid conflict until you can't — and then you're devastatingly effective. Your power lies in strategy and persuasion, not aggression. You know how to get what you want by making the other person think it was their idea.",
    Scorpio: "Your willpower is terrifying in the best way. When you decide something, it's done — no negotiation, no half-measures. You play the long game, you never show your hand early, and people who underestimate your quiet intensity always regret it.",
    Sagittarius: "You pursue things with reckless enthusiasm. When something excites you, you throw yourself at it completely — new project, new place, new person. You have more raw energy than almost anyone around you, and your optimism makes people want to follow you anywhere.",
    Capricorn: "You have the work ethic of someone who was told 'no' early and decided to prove everyone wrong. Your ambition is quiet and methodical, but it's relentless. You don't need motivation — you need a worthy goal. Give you one, and nothing can stop you.",
    Aquarius: "You rebel against anything that doesn't make sense to you, and most things don't. Your drive is unconventional — you'll take the road nobody else sees, and you'll do it your way even if it takes longer. Telling you 'that's not how it's done' is the fastest way to ensure you'll do it.",
    Pisces: "Your drive is subtle and intuitive — you move toward things by feel rather than force. People underestimate you because your ambition doesn't look aggressive. But you have a quiet determination that outlasts everyone who came in louder.",
  },
  jupiter: {
    Aries: "Your luck activates when you take bold, decisive action. Overthinking kills your momentum — but the moment you leap before you're ready, doors tend to open. Your growth comes through courage, independence, and being the first to try something new.",
    Taurus: "Abundance comes to you slowly but permanently. You're the person who builds real wealth — not overnight wins, but the kind of security that compounds over decades. Your greatest financial asset is patience, and most people can't do what you do.",
    Gemini: "Your luck lives in your network. Every random conversation, every person you meet 'by accident' — those connections lead somewhere bigger than you expect. Your growth comes through learning, teaching, and being the person who connects the right people.",
    Cancer: "Your abundance flows through family, home, and emotional investment. You grow most when you create safe spaces for others — and somehow, that generosity always circles back to you tenfold. Real estate, nurturing businesses, anything rooted in care — that's where your gold is.",
    Leo: "You're naturally lucky in anything creative, performative, or public-facing. When you express yourself authentically, opportunities find you. Your growth comes through generosity — the more you give, the more comes back. You were born to be seen.",
    Virgo: "Your luck hides in the details everyone else ignores. The systems you build, the processes you refine, the small improvements you make — they compound into something enormous. Your growth comes through service and skill mastery, not flashy moves.",
    Libra: "Partnerships are your secret superpower. You grow most through collaboration — business partners, romantic partners, creative collaborators. One-on-one relationships unlock doors for you that solo effort never could. Your abundance is relational.",
    Scorpio: "Your luck comes through transformation. Every crisis, every loss, every rock-bottom moment — you come back from it with more power than you had before. Other people's resources, shared finances, and deep psychological work unlock your greatest growth.",
    Sagittarius: "You're one of the luckiest placements in the zodiac. Travel, higher education, publishing, teaching — anything that expands your worldview also expands your prosperity. Your optimism isn't naive; it's an actual force that bends reality in your favor.",
    Capricorn: "Your abundance comes through authority, expertise, and institutional power. You're not lucky in flashy, obvious ways — you're lucky in the way that hard work 'mysteriously' opens exactly the right doors at the right time. By 40, most people around you will be wondering how you did it.",
    Aquarius: "Your luck comes from being ahead of the curve. Technology, innovation, unconventional ideas — you profit from the future, not the present. Your growth comes through community, humanitarian work, and being willing to think bigger than anyone around you.",
    Pisces: "Your luck is almost mystical. Things fall into place for you in ways you can't logically explain — the right person at the right time, the opportunity that appears out of nowhere. Your growth comes through intuition, creativity, and surrender. The more you trust the flow, the more it delivers.",
  },
  saturn: {
    Aries: "Your biggest life lesson is patience. You came into this world wanting to do everything now, your way, alone — and life keeps teaching you that some things require waiting, collaborating, and letting others lead. Mastering this tension is your superpower.",
    Taurus: "Your lesson is about security — specifically, learning that no amount of money, possessions, or comfort can protect you from life's uncertainty. Once you find stability within yourself instead of in external things, everything shifts.",
    Gemini: "You're being asked to master the art of focused communication. Your mind wants to go everywhere, but your growth comes from depth, not breadth. The commitment to one idea, one project, one conversation at a time — that's where your authority builds.",
    Cancer: "Family is both your deepest wound and your greatest teacher. Whether you're healing what your parents gave you or building something entirely new, your mastery comes through emotional maturity — learning to nurture without losing yourself.",
    Leo: "Your lesson involves ego — not destroying it, but refining it. You're learning the difference between needing applause and earning genuine respect. The moment you stop performing and start leading from authenticity, your real power emerges.",
    Virgo: "Perfectionism is both your gift and your prison. You're learning that 'good enough' isn't failure — it's freedom. Your mastery comes through service without self-destruction, through being helpful without being a martyr.",
    Libra: "Relationships are your proving ground. You're learning that real harmony isn't avoiding conflict — it's navigating it honestly. Your growth comes through partnerships that challenge you to be fair without being a pushover.",
    Scorpio: "Your lesson is about control — specifically, learning to release it. You grip tightly because you're afraid of what happens if you let go. But your deepest power comes from surrender, from trusting the process even when you can't see the outcome.",
    Sagittarius: "Freedom without structure is chaos — and that's your lesson. You want to roam endlessly, but your growth demands that you commit to something long enough to actually master it. When you combine your vision with discipline, you become unstoppable.",
    Capricorn: "You feel the weight of responsibility more than most. You've been carrying things since you were young — expectations, duties, the sense that everything depends on you. Your lesson is learning that rest is not weakness, and asking for help is not failure.",
    Aquarius: "Your lesson is about belonging. You've always felt like the outsider — different, ahead of your time, misunderstood. Your growth comes from learning that you can be part of a community without losing your individuality. You don't have to choose between fitting in and being yourself.",
    Pisces: "Boundaries are your lifelong curriculum. You feel everything so deeply that you struggle to separate your suffering from others'. Your mastery comes through structured compassion — learning to help without drowning, to feel without dissolving.",
  },
};

function ChartSnapshotFacts({ chart }: { chart: any }) {
  const [visibleIndex, setVisibleIndex] = useState(0);

  const snippets = React.useMemo(() => {
    const items: { title: string; text: string }[] = [];
    const planets = chart.planets || {};

    const addSnippet = (key: string, label: string) => {
      const p = planets[key];
      if (!p?.sign) return;
      const reading = PLANET_MINI_READINGS[key]?.[p.sign];
      if (reading) {
        items.push({
          title: `${label} in ${p.sign}`,
          text: reading,
        });
      }
    };

    addSnippet('sun', 'Sun');
    addSnippet('moon', 'Moon');
    addSnippet('venus', 'Venus');
    addSnippet('mars', 'Mars');
    addSnippet('jupiter', 'Jupiter');
    addSnippet('saturn', 'Saturn');

    // Rising sign
    if (chart.angles?.ascendant) {
      const ascSign = ZODIAC_SIGNS[Math.floor(chart.angles.ascendant / 30)];
      const desc = SIGN_DESCRIPTORS[ascSign];
      if (ascSign && desc) {
        items.push({
          title: `${ascSign} Rising`,
          text: `The first thing people notice about you is a ${desc} energy. Before anyone knows your story, they feel this quality radiating from you.`,
        });
      }
    }

    return items;
  }, [chart]);

  useEffect(() => {
    if (snippets.length <= 1) return;
    const timer = setInterval(() => setVisibleIndex(i => (i + 1) % snippets.length), 6000);
    return () => clearInterval(timer);
  }, [snippets.length]);

  if (snippets.length === 0) return null;

  const current = snippets[visibleIndex];

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">While you wait</p>
        <div className="flex gap-1">
          {snippets.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-500" style={{ background: i === visibleIndex ? 'var(--primary)' : 'var(--muted)' }} />
          ))}
        </div>
      </div>
      <div className="min-h-[80px] transition-opacity duration-500" key={visibleIndex}>
        <p className="text-[14px] font-semibold text-foreground mb-1.5">{current.title}</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{current.text}</p>
      </div>
    </div>
  );
}

// ─── Citation helpers ─────────────────────────────────────────────

function parseCitationsText(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const line of text.split('\n')) {
    // Match [^1] text, [^1]: text, or [^1] : text formats
    const match = line.match(/^\[\^(\d+)\]:?\s*(.+)/);
    if (match) map[match[1]] = match[2].trim();
  }
  return map;
}

function extractPlanetsFromCitation(citation: string): string[] {
  const names: Record<string, string> = {
    'sun': 'sun', 'moon': 'moon', 'mercury': 'mercury', 'venus': 'venus', 'mars': 'mars',
    'jupiter': 'jupiter', 'saturn': 'saturn', 'uranus': 'uranus', 'neptune': 'neptune',
    'pluto': 'pluto', 'north node': 'northnode', 'chiron': 'chiron',
  };
  const found: string[] = [];
  const lower = citation.toLowerCase();
  for (const [name, key] of Object.entries(names)) {
    if (lower.includes(name)) found.push(key);
  }
  return found;
}

function CitationBadge({
  num, tooltip, onHighlight,
}: {
  num: string; tooltip: string; onHighlight: (planets: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const planets = React.useMemo(() => extractPlanetsFromCitation(tooltip), [tooltip]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onHighlight([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onHighlight]);

  return (
    <span ref={ref} className="relative inline-block">
      <sup
        className="text-[10px] font-semibold text-amber-500/80 cursor-pointer px-[2px] py-[1px] hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
        onClick={() => { const next = !open; setOpen(next); onHighlight(next ? planets : []); }}
      >
        {num}
      </sup>
      {open && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-2 rounded-lg text-[11px] leading-snug whitespace-pre-wrap max-w-[280px] w-max z-50 shadow-xl border bg-popover border-border text-foreground/80"
        >
          <span className="text-amber-500 font-semibold">[{num}]</span>{' '}
          <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{tooltip}</span>
        </span>
      )}
    </span>
  );
}

function TextWithCitations({
  text, citations, onHighlight,
}: {
  text: string; citations: Record<string, string>; onHighlight: (planets: string[]) => void;
}) {
  if (!Object.keys(citations).length) return <>{text}</>;
  const parts = text.split(/(\[\^\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[\^(\d+)\]$/);
        if (m) {
          const tip = citations[m[1]] || `Chart source #${m[1]}`;
          return <CitationBadge key={i} num={m[1]} tooltip={tip} onHighlight={onHighlight} />;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

// ─── Full Reading ─────────────────────────────────────────────────

/** Parse reading text into sections based on ## headers */
function parseReadingSections(text: string): { title: string; content: string }[] {
  const lines = text.split('\n');
  const sections: { title: string; content: string }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      if (current) sections.push({ title: current.title, content: current.lines.join('\n').trim() });
      current = { title: headerMatch[1], lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      // Content before first header — treat as intro
      if (line.trim()) {
        if (!current) current = { title: '', lines: [line] };
      }
    }
  }
  if (current) sections.push({ title: current.title, content: current.lines.join('\n').trim() });
  return sections;
}

/** Capture a chart SVG element as a data URL for embedding in PDF */
async function chartSvgToDataUrl(svgEl: SVGSVGElement, scale: number = 2): Promise<string> {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const viewBox = svgEl.getAttribute('viewBox') || '0 0 1400 1400';
  const [, , vbW, vbH] = viewBox.split(/\s+/).map(Number);
  clone.setAttribute('width', String(vbW));
  clone.setAttribute('height', String(vbH));
  const origTexts = svgEl.querySelectorAll('text');
  const cloneTexts = clone.querySelectorAll('text');
  origTexts.forEach((orig, i) => {
    if (cloneTexts[i]) {
      const c = window.getComputedStyle(orig);
      (cloneTexts[i] as SVGTextElement).style.fontFamily = c.fontFamily;
      (cloneTexts[i] as SVGTextElement).style.fontSize = c.fontSize;
    }
  });
  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = vbW * scale;
      canvas.height = vbH * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, vbW * scale, vbH * scale);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to render chart')); };
    img.src = url;
  });
}

/** Generate a PDF from the reading */
async function generatePDF(
  module: InsightModule,
  sections: { title: string; content: string }[],
  sceneResponses?: Array<{ title: string; narration: string; response: 'yes' | 'no' | 'skipped' }>,
  birthData?: { date: string; time: string; location: string } | null,
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 25;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(40, 30, 60);
  doc.text(module.title, pageW / 2, y, { align: 'center' });
  y += 10;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 100, 140);
  doc.text('Personalized Reading by Astrologer', pageW / 2, y, { align: 'center' });
  y += 4;
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageW / 2, y, { align: 'center' });
  y += 8;

  // Birth info
  if (birthData) {
    doc.setFontSize(10);
    doc.setTextColor(100, 90, 120);
    const birthDate = new Date(birthData.date + 'T12:00:00');
    const dateStr = birthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Born ${dateStr} at ${birthData.time} — ${birthData.location}`, pageW / 2, y, { align: 'center' });
    y += 8;
  }

  // Divider
  doc.setDrawColor(200, 190, 210);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // Chart wheel image
  const svgEl = document.querySelector('.biwheel-svg') as SVGSVGElement | null;
  if (svgEl) {
    try {
      const chartDataUrl = await chartSvgToDataUrl(svgEl);
      const chartSize = 110;
      const chartX = (pageW - chartSize) / 2;
      doc.addImage(chartDataUrl, 'PNG', chartX, y, chartSize, chartSize);
      y += chartSize + 8;
    } catch {
      // Skip chart image if rendering fails
    }
  }

  if (y > 260) { doc.addPage(); y = 20; }

  // Card Insights
  if (sceneResponses && sceneResponses.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(60, 45, 85);
    doc.text('Your Insights', margin, y);
    y += 8;

    for (const sr of sceneResponses) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(80, 70, 100);
      doc.text(sr.title, margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 90, 120);
      const lines = doc.splitTextToSize(sr.narration, contentW);
      const blockH = lines.length * 4.5;
      if (y + blockH > 275) { doc.addPage(); y = 20; }
      doc.text(lines, margin, y);
      y += blockH + 6;
    }

    y += 4;
    doc.setDrawColor(200, 190, 210);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
  }

  // Sections
  for (const section of sections) {
    // Check if we need a new page
    if (y > 260) { doc.addPage(); y = 20; }

    if (section.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(60, 45, 85);
      doc.text(section.title, margin, y);
      y += 8;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 70, 100);

    const paragraphs = section.content.split('\n\n').filter(p => p.trim());
    for (const para of paragraphs) {
      const cleanText = para.replace(/\[\^\d+\]/g, '').trim();
      if (!cleanText) continue;

      const lines = doc.splitTextToSize(cleanText, contentW);
      const blockHeight = lines.length * 5.5;

      if (y + blockHeight > 275) { doc.addPage(); y = 20; }

      doc.text(lines, margin, y);
      y += blockHeight + 4;
    }

    y += 6;
  }

  // Footer
  if (y > 260) { doc.addPage(); y = 20; }
  y += 10;
  doc.setDrawColor(200, 190, 210);
  doc.line(margin, y, pageW - margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(150, 140, 160);
  doc.text('Generated by Astrologer \u2014 astrologer.app', pageW / 2, y, { align: 'center' });

  doc.save(`${module.slug}-reading.pdf`);
}

const BiWheelMobileWrapper = React.lazy(() => import('@/components/biwheel/BiWheelMobileWrapper'));

function FullReading({
  module,
  reading,
  loading,
  readingId,
  citationsText,
  chart,
  phase,
  analyzeProgress,
  analyzedPlanets,
  journeyScenes,
  sceneResponses,
  birthData,
}: {
  module: InsightModule;
  reading: string;
  loading: boolean;
  readingId: string | null;
  citationsText: string;
  chart: any;
  phase: 'preparing' | 'analyzing' | 'synthesizing' | 'done';
  analyzeProgress: { current: number; total: number };
  analyzedPlanets: string[];
  journeyScenes?: any[];
  sceneResponses?: Array<{ sceneIndex: number; title: string; narration: string; response: 'yes' | 'no' | 'skipped' }>;
  birthData?: { date: string; time: string; location: string } | null;
}) {
  const sections = React.useMemo(() => parseReadingSections(reading), [reading]);
  const citations = React.useMemo(() => parseCitationsText(citationsText), [citationsText]);
  const hasSections = sections.some(s => s.title);
  const [highlightedPlanets, setHighlightedPlanets] = useState<string[]>([]);

  // Build selectedPlanet for chart highlighting
  const selectedPlanet = highlightedPlanets.length > 0
    ? { planet: highlightedPlanets[0], chart: 'A' as const }
    : null;

  const handleHighlight = useCallback((planets: string[]) => {
    setHighlightedPlanets(planets);
  }, []);

  const renderParagraph = (text: string, key: number) => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    return (
      <p
        key={key}
        className="text-[15px] sm:text-[16px] leading-[1.9] font-light text-foreground/70"
      >
        {trimmed.includes('**') ? (
          // Render **bold** markdown
          trimmed.split(/(\*\*[^*]+\*\*)/g).map((part, pi) => {
            const boldMatch = part.match(/^\*\*(.+)\*\*$/);
            if (boldMatch) return <strong key={pi} className="font-semibold text-foreground/90">{boldMatch[1]}</strong>;
            return <TextWithCitations key={pi} text={part} citations={citations} onHighlight={handleHighlight} />;
          })
        ) : (
          <TextWithCitations text={trimmed} citations={citations} onHighlight={handleHighlight} />
        )}
      </p>
    );
  };

  return (
    <div className="max-w-[700px] mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border text-[12px] text-muted-foreground uppercase tracking-[0.15em] mb-4">
          {module.title}
        </div>
      </div>

      {/* Tap hint for citations */}
      {!loading && Object.keys(citations).length > 0 && (
        <p className="text-center text-[11px] text-muted-foreground/60">
          Tap the numbered markers to see the astrological source
        </p>
      )}

      {/* Your Insights — collapsed by default since user already read them */}
      {sceneResponses && sceneResponses.length > 0 && (() => {
        const confirmedCount = sceneResponses.filter(sr => sr.response === 'yes').length;
        return (
          <details className="group rounded-xl border border-border bg-card overflow-hidden">
            <summary className="flex items-center justify-between cursor-pointer list-none px-5 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[14px] font-semibold text-primary/70">
                  {sceneResponses.length}
                </span>
                <div>
                  <p className="text-[14px] font-medium text-foreground">Your Insights</p>
                  <p className="text-[11px] text-muted-foreground/60">{confirmedCount} confirmed, {sceneResponses.length - confirmedCount} other</p>
                </div>
              </div>
              <span className="text-[12px] text-muted-foreground/50 group-open:rotate-180 inline-block transition-transform duration-200">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </span>
            </summary>
            <div className="space-y-0 border-t border-border">
              {sceneResponses.map((sr, i) => (
                <div
                  key={i}
                  className="px-5 py-4 border-b border-border last:border-0 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {sr.title}
                    </span>
                    {sr.response !== 'skipped' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        sr.response === 'yes'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-muted text-muted-foreground/60 border border-border'
                      }`}>
                        {sr.response === 'yes' ? 'Confirmed' : 'Not me'}
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] leading-[1.7] text-foreground/70">
                    {sr.narration}
                  </p>
                </div>
              ))}
            </div>
          </details>
        );
      })()}

      {/* Deep Analysis header */}
      {(reading || loading) && sceneResponses && sceneResponses.length > 0 && (
        <h2
          className="text-[18px] sm:text-[20px] tracking-wide uppercase pt-2"
          style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300, color: '#9a8daa', letterSpacing: '0.08em' }}
        >
          Deep Analysis
        </h2>
      )}

      {/* Loading progress with mini reading */}
      {loading && !reading && (
        <div className="space-y-5 py-4">
          <LoadingProgress />
          {chart && <ChartSnapshotFacts chart={chart} />}
        </div>
      )}

      {/* Streamed content — show as it arrives, even while still loading */}
      {reading && hasSections ? (
        <div className="space-y-10">
          {sections.map((section, i) => (
            <div key={i}>
              {section.title && (
                <h2
                  className="text-[18px] sm:text-[20px] mb-4 tracking-wide uppercase"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300, color: '#9a8daa', letterSpacing: '0.08em' }}
                >
                  {section.title}
                </h2>
              )}
              <div className="space-y-4">
                {section.content.split('\n\n').map((para, j) => renderParagraph(para, j))}
              </div>
              {i < sections.length - 1 && (
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mt-10" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {reading.split('\n\n').map((para, i) => renderParagraph(para, i))}
        </div>
      )}

      {/* Still writing indicator */}
      {loading && reading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="w-4 h-4 border-2 border-[#6b5a80] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] text-[#6b5e7a]">Still writing...</span>
        </div>
      )}

      {/* Actions */}
      {!loading && reading && (
        <div className="pt-6 space-y-5">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => generatePDF(module, sections.length > 0 ? sections : [{ title: '', content: reading }], sceneResponses, birthData)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted border border-border text-[13px] text-muted-foreground hover:text-foreground/80 hover:border-border transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            {readingId && (
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/reading/${readingId}`;
                  if (navigator.share) {
                    try { await navigator.share({ title: `My ${module.title} Reading`, url }); } catch {}
                  } else {
                    await navigator.clipboard.writeText(url);
                    toast.success('Link copied!');
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted border border-border text-[13px] text-muted-foreground hover:text-foreground/80 hover:border-border transition-colors"
              >
                <Link2 className="w-4 h-4" />
                Share Reading
              </button>
            )}
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="text-center space-y-4">
            <p className="text-[14px] text-muted-foreground/60">Go deeper with transits, profections, and full chart analysis</p>
            <Link to="/chart">
              <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted hover:text-foreground gap-2 rounded-xl h-11">
                Open Astrologer
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function InsightPage() {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const module = getInsightModule(moduleSlug || '');
  const { user } = useAuth();

  // Detect Stripe return synchronously to avoid flashing the input form
  const isStripeReturn = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('session_id');
  const [step, setStep] = useState<'input' | 'journey' | 'reading' | 'returning'>(isStripeReturn ? 'returning' : 'input');
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [journeyData, setJourneyData] = useState<any>(null);
  const [totalSceneCount, setTotalSceneCount] = useState(25);
  const [fullReading, setFullReading] = useState('');
  const [citationsText, setCitationsText] = useState('');
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingPhase, setReadingPhase] = useState<'preparing' | 'analyzing' | 'synthesizing' | 'done'>('preparing');
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [analyzedPlanets, setAnalyzedPlanets] = useState<string[]>([]);
  const [paywallHit, setPaywallHit] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [journeyComplete, setJourneyComplete] = useState(false);
  const [chartForFacts, setChartForFacts] = useState<any>(null);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [showCustomQuestion, setShowCustomQuestion] = useState(false);
  const [sceneResponses, setSceneResponses] = useState<Array<{ sceneIndex: number; title: string; narration: string; response: 'yes' | 'no' | 'skipped' }>>([]);
  const [resumeAtScene, setResumeAtScene] = useState<number | undefined>(undefined);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const readingStartedRef = useRef(false);

  const birthDataRef = useRef<{ date: string; time: string; email: string; location: string; lat: number; lng: number } | null>(null);
  const chartDataRef = useRef<any>(null);
  // Synastry: second person's data
  const birthDataBRef = useRef<{ date: string; time: string; name: string; location: string; lat: number; lng: number } | null>(null);
  const chartDataBRef = useRef<any>(null);

  // Clear stale sessions on mount — prevents expired JWTs from poisoning requests
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const expiresAt = session.expires_at ?? 0;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt < now) {
          // Token expired — try refresh, if that fails sign out to clear the stale JWT
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            await supabase.auth.signOut();
          }
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (module) {
      document.title = `${module.title} \u2014 Astrologer`;
      analytics.trackInsightPageViewed({ module: module.id });
      metaPixel.initMetaPixel();
      metaPixel.trackViewContent(module.id);
    }
    return () => { document.title = 'Astrologer'; };
  }, [module]);

  // If URL has ?r= reading ID (refresh/bookmark), redirect to the reading page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedReadingId = params.get('r');
    if (savedReadingId && !params.has('session_id')) {
      window.location.replace(`/reading/${savedReadingId}`);
    }
  }, []);

  // Check for successful payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const purchaseModule = params.get('module');
    if (sessionId && purchaseModule === moduleSlug) {
      // Restore all state from sessionStorage (lost on Stripe redirect)
      // NOTE: Don't remove sessionStorage items yet — generateFullReading needs them as fallback
      try {
        const savedBirth = sessionStorage.getItem('insight_birth_data');
        const savedChart = sessionStorage.getItem('insight_chart_data');
        if (savedBirth) birthDataRef.current = JSON.parse(savedBirth);
        if (savedChart) chartDataRef.current = JSON.parse(savedChart);
        // Restore Person B (synastry)
        const savedBirthB = sessionStorage.getItem('insight_birth_data_b');
        const savedChartB = sessionStorage.getItem('insight_chart_data_b');
        if (savedBirthB) birthDataBRef.current = JSON.parse(savedBirthB);
        if (savedChartB) chartDataBRef.current = JSON.parse(savedChartB);
      } catch {}

      let restoredJourney: any = null;
      try {
        const savedJourney = sessionStorage.getItem('insight_journey_data');
        if (savedJourney) restoredJourney = JSON.parse(savedJourney);
      } catch {}

      const resumeScene = parseInt(sessionStorage.getItem('insight_resume_scene') || '3', 10);

      // Verify payment before resuming
      (async () => {
        try {
          const verifyRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/astrologer-stripe-verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ session_id: sessionId }),
          });
          const verifyData = await verifyRes.json().catch(() => ({}));

          if (!verifyRes.ok || (!verifyData?.verified && !verifyData?.success)) {
            console.error('Verify failed:', verifyData);
            toast.error('Payment verification failed. Please contact support.');
            setStep('input');
            return;
          }

          analytics.trackInsightPurchaseCompleted({ module: moduleSlug! });
          metaPixel.trackPurchase(moduleSlug!);

          // Recalculate chart if sessionStorage restore failed
          if (!chartDataRef.current && birthDataRef.current) {
            try {
              const natalData = await swissEphemeris.natal({
                birth_date: birthDataRef.current.date,
                birth_time: birthDataRef.current.time,
                lat: birthDataRef.current.lat,
                lng: birthDataRef.current.lng,
              });
              chartDataRef.current = parseNatalResponse(natalData);
            } catch (e) {
              console.error('Failed to recalculate chart:', e);
            }
          }

          // If we still have no journey data or chart, we can't continue
          if (!restoredJourney || !chartDataRef.current) {
            console.error('Missing data after Stripe return', { journey: !!restoredJourney, chart: !!chartDataRef.current, birth: !!birthDataRef.current });
            toast.error('Session data was lost. Please start a new reading.');
            setStep('input');
            return;
          }

          // Set all state — show purchase confirmation, don't go to journey yet
          setJourneyData(restoredJourney);
          setResumeAtScene(resumeScene);
          setIsPaid(true);
          setPaywallHit(false);
          setChartForFacts(chartDataRef.current);
          setShowPurchaseConfirm(true);
          setStep('returning');

          // Clean up sessionStorage after state is set
          sessionStorage.removeItem('insight_birth_data');
          sessionStorage.removeItem('insight_chart_data');
          sessionStorage.removeItem('insight_journey_data');
          sessionStorage.removeItem('insight_resume_scene');
        } catch {
          toast.error('Something went wrong. Please contact support.');
          setStep('input');
        }
      })();

      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [moduleSlug]);

  // Start report generation in background when payment is confirmed
  useEffect(() => {
    if (isPaid && step === 'journey' && !readingStartedRef.current) {
      readingStartedRef.current = true;
      generateFullReading();
    }
  }, [isPaid, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBirthSubmit = useCallback(async (data: BirthSubmitData) => {
    birthDataRef.current = data;
    setLoading(true);

    try {
      const natalData = await swissEphemeris.natal({
        birth_date: data.date,
        birth_time: data.time,
        lat: data.lat,
        lng: data.lng,
      });
      const chart = parseNatalResponse(natalData);
      chartDataRef.current = chart;
      setChartForFacts(chart);

      // Calculate Person B chart for synastry
      if (data.personB) {
        const natalDataB = await swissEphemeris.natal({
          birth_date: data.personB.date,
          birth_time: data.personB.time,
          lat: data.personB.lat,
          lng: data.personB.lng,
        });
        const chartB = parseNatalResponse(natalDataB);
        birthDataBRef.current = data.personB;
        chartDataBRef.current = chartB;
      }

      // Track form submission
      analytics.trackInsightFormSubmitted({ module: module!.id, has_birth_time: !!data.time });
      metaPixel.trackLead(module!.id);

      // Save lead (non-blocking, fire-and-forget — don't let auth errors break the funnel)
      supabase.from('insight_leads').insert({
        email: data.email,
        birth_date: data.date,
        birth_time: data.time,
        birth_lat: data.lat,
        birth_lng: data.lng,
        birth_location: data.location,
        module_id: module!.id,
      }).then(() => {
        analytics.trackInsightLeadCaptured({ module: module!.id });
      }).catch(() => {
        // Silently ignore — lead capture shouldn't block the funnel
      });

      // Generate journey via galactic-journey edge function (no auth needed)
      const chartSummary: Record<string, string> = {};
      for (const [key, p] of Object.entries(chart.planets)) {
        const pd = p as any;
        chartSummary[key] = `${Math.floor(pd.longitude % 30)}\u00B0 ${pd.sign}${pd.house ? ` H${pd.house}` : ''}${pd.retrograde ? ' R' : ''}`;
      }

      // Compute natal aspects for richer AI context
      const ASPECT_CALC = [
        { name: 'conjunct', angle: 0, orb: 8 },
        { name: 'opposite', angle: 180, orb: 8 },
        { name: 'trine', angle: 120, orb: 8 },
        { name: 'square', angle: 90, orb: 8 },
        { name: 'sextile', angle: 60, orb: 6 },
        { name: 'quincunx', angle: 150, orb: 3 },
      ];
      const natalAspects: string[] = [];
      const pKeys = Object.keys(chart.planets).filter(k =>
        ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','northnode','chiron'].includes(k)
      );
      for (let i = 0; i < pKeys.length; i++) {
        for (let j = i + 1; j < pKeys.length; j++) {
          const a = chart.planets[pKeys[i]] as any;
          const b = chart.planets[pKeys[j]] as any;
          if (!a?.longitude || !b?.longitude) continue;
          const diff = Math.abs(a.longitude - b.longitude);
          const angle = diff > 180 ? 360 - diff : diff;
          for (const asp of ASPECT_CALC) {
            const orb = Math.abs(angle - asp.angle);
            if (orb <= asp.orb) {
              natalAspects.push(`${pKeys[i]} ${asp.name} ${pKeys[j]} (${orb.toFixed(1)}\u00B0)`);
              break;
            }
          }
        }
      }

      const daysToToday = Math.round((Date.now() - new Date(data.date).getTime()) / (1000 * 60 * 60 * 24));

      // Map module to journey topic
      const topicMap: Record<string, string> = {
        'future-partner': 'love', 'hidden-talent': 'growth', 'money-blueprint': 'career',
        'career-path': 'career', 'life-purpose': 'spiritual', 'shadow-self': 'growth',
        'compatibility': 'love',
      };

      // Detailed topic-focused directives — tells AI exactly what each scene should be about
      const journeyQuestions: Record<string, string> = {
        'future-partner': 'TOPIC: Future romantic partner. Every scene must describe a SPECIFIC trait or quality of the person they are meant to be with. Cover: their personality day-to-day, how the attraction feels, their communication style, their emotional depth, what they do for work, how they handle conflict, what makes this person different from past partners, an unexpected quality, a challenge they will face together, how they will know this is the one, what is shifting right now to bring this person closer. Do NOT make observations about the user. Describe THE PARTNER.',
        'hidden-talent': 'TOPIC: Hidden talents. Every scene must name and describe a SPECIFIC talent, skill, or ability they have but have not fully recognized. Cover: a creative ability they suppress, something they do naturally that impresses others, how they process information differently, a teaching or mentoring gift, an entrepreneurial instinct, something physical they excel at, an emotional intelligence skill, why they have been undervaluing this, where this talent could take them, what is activating this ability right now. Do NOT make generic personality observations. Name SPECIFIC TALENTS.',
        'money-blueprint': 'TOPIC: Money and wealth patterns. Every scene must describe a SPECIFIC financial behavior or pattern. Cover: their natural earning style, spending vs saving habits, their biggest financial blind spot, what kind of work generates most wealth for them, their risk tolerance, how they sabotage financial growth, their generosity pattern, what luxury means to them, an untapped income stream, what financial security looks like for them, a money shift building right now. Every scene about MONEY.',
        'career-path': 'TOPIC: Ideal career path. Every scene must describe a SPECIFIC aspect of their professional life. Cover: what work energizes vs drains them, ideal work environment, their leadership style, a specific field that matches them, the skill that makes them stand out, why current career feels off or right, what success means for them specifically, how they handle workplace politics, a career pivot worth considering, a professional opportunity forming right now. Every scene about CAREER.',
        'life-purpose': 'TOPIC: Life purpose and soul mission. Every scene must describe a SPECIFIC aspect of why they are here. Cover: the core theme of their mission, what they keep returning to, a childhood pattern pointing to purpose, what impact they are meant to have, what old identity to leave behind, what scares them about their purpose, how struggles trained them, a contribution only they can make, the next step on their path, what is aligning right now. Every scene about PURPOSE.',
        'shadow-self': 'TOPIC: Shadow self and unconscious patterns. Every scene must describe a SPECIFIC shadow behavior or repressed quality. Cover: their main shadow pattern, what they do when threatened, a relationship pattern they repeat, what triggers them disproportionately, something they judge in others that is in themselves, how they self-sabotage, a childhood wound driving decisions, their control pattern, how shadow shows at work, what they refuse to feel, the gift inside the shadow. Every scene about SHADOW.',
        'compatibility': 'TOPIC: Relationship compatibility between two people. Every scene must describe a SPECIFIC dynamic between these two people based on BOTH charts. Cover: the core magnetic pull between them, how they communicate differently, emotional security vs. independence needs, physical chemistry and desire, power dynamics and control, how they handle conflict, what each person secretly needs from the other, their biggest potential challenge, how they grow together, a timing window for deepening, the ultimate verdict on this match. Every scene about THEIR CONNECTION. You have data for both Person A and Person B charts.',
      };

      const journeyRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/astrologer-galactic-journey`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            chartSummary,
            natalChart: { planets: Object.entries(chart.planets).map(([key, p]: [string, any]) => ({
              planet: key === 'northnode' ? 'North Node' : key.charAt(0).toUpperCase() + key.slice(1),
              longitude: p.longitude, latitude: p.latitude ?? 0, sign: p.sign,
              degree: Math.floor(p.longitude % 30), minute: Math.floor((p.longitude % 1) * 60),
              retrograde: p.retrograde ?? false, house: p.house,
            })), houses: chart.houses ? { cusps: Object.values(chart.houses), ascendant: chart.angles?.ascendant ?? 0, mc: chart.angles?.midheaven ?? 0 } : undefined },
            natalAspects,
            // Include Person B chart for synastry
            ...(chartDataBRef.current ? {
              chartSummaryB: Object.fromEntries(Object.entries(chartDataBRef.current.planets).map(([key, p]: [string, any]) =>
                [key, `${Math.floor(p.longitude % 30)}\u00B0 ${p.sign}${p.house ? ` H${p.house}` : ''}${p.retrograde ? ' R' : ''}`]
              )),
              personBName: birthDataBRef.current?.name || 'Person B',
            } : {}),
            topic: topicMap[module!.id] || 'growth',
            customQuestion: journeyQuestions[module!.id] || module!.headline,
            name: 'You',
            birthDate: data.date,
            daysToToday,
          }),
        }
      );

      if (!journeyRes.ok) throw new Error('Failed to generate reading');

      // Consume SSE stream — scenes arrive incrementally
      const reader = journeyRes.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;

          let parsed: any;
          try { parsed = JSON.parse(payload); } catch { continue; }

          if (parsed.error) {
            throw new Error(parsed.error);
          }

          if (parsed.phase === 'planned') {
            // Planner done — show journey UI immediately with empty scenes
            setTotalSceneCount(parsed.totalScenes ?? 25);
            setJourneyData({
              title: parsed.title,
              intro: parsed.intro,
              outro: parsed.outro,
              scenes: [],
            });
            setStep('journey');
            analytics.trackInsightTeaserViewed({ module: module!.id, archetype: parsed.title });
          } else if (parsed.phase === 'scene') {
            // Append scene as it arrives (ordered by server)
            setJourneyData((prev: any) => {
              if (!prev) return prev;
              const newScenes = [...prev.scenes];
              // Insert at correct index (scenes arrive in order but be safe)
              while (newScenes.length <= parsed.index) {
                newScenes.push(null);
              }
              newScenes[parsed.index] = parsed.scene;
              return { ...prev, scenes: newScenes };
            });
          } else if (parsed.phase === 'complete') {
            // All scenes done
            console.log('Journey generation complete');
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate reading');
    } finally {
      setLoading(false);
    }
  }, [module]);

  const handleUnlock = useCallback(async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    analytics.trackInsightUnlockClicked({ module: module!.id });
    metaPixel.trackInitiateCheckout(module!.id);
    setUnlocking(true);
    try {
      // Get a fresh access token, forcing refresh if expired or about to expire
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        toast.error('Please sign in to continue');
        setShowAuth(true);
        setUnlocking(false);
        return;
      }
      const expiresAt = currentSession.expires_at ?? 0;
      const nowSecs = Math.floor(Date.now() / 1000);
      let accessToken = currentSession.access_token;
      if (expiresAt - nowSecs < 60) {
        const { data: { session: refreshed }, error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr || !refreshed) {
          toast.error('Session expired — please sign in again');
          setShowAuth(true);
          setUnlocking(false);
          return;
        }
        accessToken = refreshed.access_token;
      }

      // Persist all state before redirect (lost on page reload)
      if (birthDataRef.current) {
        sessionStorage.setItem('insight_birth_data', JSON.stringify(birthDataRef.current));
      }
      if (chartDataRef.current) {
        sessionStorage.setItem('insight_chart_data', JSON.stringify(chartDataRef.current));
      }
      // Persist Person B data for synastry
      if (birthDataBRef.current) {
        sessionStorage.setItem('insight_birth_data_b', JSON.stringify(birthDataBRef.current));
      }
      if (chartDataBRef.current) {
        sessionStorage.setItem('insight_chart_data_b', JSON.stringify(chartDataBRef.current));
      }
      if (journeyData) {
        sessionStorage.setItem('insight_journey_data', JSON.stringify(journeyData));
      }
      if (customQuestion) {
        sessionStorage.setItem('insight_custom_question', customQuestion);
      }
      // Save the scene to resume from (the first locked scene)
      sessionStorage.setItem('insight_resume_scene', '3');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/astrologer-insight-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          module_id: module!.id,
          birth_data: birthDataRef.current,
          price_cents: module!.priceCents,
          success_url: `${window.location.origin}/insight/${module!.slug}?session_id={CHECKOUT_SESSION_ID}&module=${module!.slug}`,
          cancel_url: `${window.location.origin}/insight/${module!.slug}`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Checkout failed (${res.status})`);
      }
      const { checkout_url } = await res.json();
      if (checkout_url) window.location.href = checkout_url;
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setUnlocking(false);
    }
  }, [user, module, customQuestion]);

  const generateFullReading = useCallback(async () => {
    // Don't change step — report generates in background while cards play
    setReadingLoading(true);
    setReadingPhase('preparing');
    setFullReading('');
    setCitationsText('');
    setAnalyzedPlanets([]);

    // Restore custom question from sessionStorage (survives Stripe redirect)
    let savedCustomQuestion = customQuestion;
    if (!savedCustomQuestion) {
      try {
        savedCustomQuestion = sessionStorage.getItem('insight_custom_question') || '';
        sessionStorage.removeItem('insight_custom_question');
      } catch {}
    }

    try {
      // Try restoring from sessionStorage if refs are empty
      if (!birthDataRef.current) {
        try {
          const saved = sessionStorage.getItem('insight_birth_data');
          if (saved) birthDataRef.current = JSON.parse(saved);
        } catch {}
      }
      if (!chartDataRef.current) {
        try {
          const saved = sessionStorage.getItem('insight_chart_data');
          if (saved) chartDataRef.current = JSON.parse(saved);
        } catch {}
      }

      // If still no birth data, try fetching from purchase record
      if (!birthDataRef.current) {
        const { data: purchase } = await supabase
          .from('insight_purchases')
          .select('birth_data')
          .eq('module_id', module!.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (purchase?.birth_data) {
          birthDataRef.current = purchase.birth_data as any;
        }
      }

      // Recalculate chart if needed
      if (!chartDataRef.current && birthDataRef.current) {
        const natalData = await swissEphemeris.natal({
          birth_date: birthDataRef.current.date,
          birth_time: birthDataRef.current.time,
          lat: birthDataRef.current.lat,
          lng: birthDataRef.current.lng,
        });
        chartDataRef.current = parseNatalResponse(natalData);
      }

      if (!birthDataRef.current) {
        console.error('Birth data not found for reading generation');
        toast.error('Could not generate written report. Your card insights are still saved.');
        setReadingLoading(false);
        return;
      }

      // Get fresh auth token
      let accessToken: string | null = null;
      const { data: { session: currentSess } } = await supabase.auth.getSession();
      if (currentSess) {
        const expiresAt = currentSess.expires_at ?? 0;
        if (expiresAt - Math.floor(Date.now() / 1000) < 60) {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession();
          accessToken = refreshed?.access_token ?? null;
        } else {
          accessToken = currentSess.access_token;
        }
      }
      if (!accessToken) {
        console.error('No auth token for reading generation');
        toast.error('Could not generate written report. Please sign in and try again.');
        setReadingLoading(false);
        return;
      }

      // ── Full AI Reading Pipeline (vantage trees, dispositor chains, citations) ──
      const chart = chartDataRef.current as NatalChart;
      const birthInfo = birthDataRef.current;

      // Build the question — include custom question if provided
      let fullQuestion = module!.question;
      if (savedCustomQuestion) {
        fullQuestion += `\n\nThe user also specifically asked: "${savedCustomQuestion}"\nPlease address this question directly in its own section with the header "## Your Personal Question".\nAnswer this question ENTIRELY from the chart data. Do not assume any external context about their current situation. Base your answer on what the chart reveals about their natural patterns, timing, and tendencies.`;
      }

      // Phase 1: Build vantage trees (client-side, instant)
      setReadingPhase('preparing');
      const isSynastry = !!module!.isSynastry && !!chartDataBRef.current;
      let trees: any[];
      let treesB: any[] | undefined;
      let synastryContext: any = undefined;

      if (isSynastry) {
        // Build synastry tree groups (cross-aspects, composite, etc.)
        const treeGroups = buildSynastryTreeGroups(chart, chartDataBRef.current, DEFAULT_PARAMS);
        trees = treeGroups.flatMap(g => g.trees);
        synastryContext = {
          personAName: 'Person A',
          personBName: birthDataBRef.current?.name || 'Person B',
          tree_groups: treeGroups.map(g => ({ id: g.id, label: g.label, vantage_count: g.trees.reduce((n: number, t: any) => n + t.vantages.length, 0) })),
        };
      } else {
        trees = buildTreesForQuestion(chart, fullQuestion, DEFAULT_PARAMS);
      }

      // Enrich with timing data
      if (birthInfo?.date && !isSynastry) {
        try {
          trees = enrichTreesWithProfections(trees, chart, birthInfo.date);
          trees = enrichTreesWithActivations(trees, chart, birthInfo.date);
        } catch {}

        // Add current transits
        if (birthInfo.lat != null && birthInfo.lng != null) {
          try {
            const now = new Date();
            const transitData = await swissEphemeris.transit({
              natal_date: birthInfo.date,
              natal_time: birthInfo.time || '12:00',
              natal_lat: birthInfo.lat,
              natal_lng: birthInfo.lng,
              transit_date: now.toISOString().split('T')[0],
              transit_time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
            });
            if (transitData) {
              trees = enrichTreesWithTransits(trees, transitData, chart);
            }
          } catch {}
        }
      }

      // Phase 2: Send to AI reading edge function (streaming)
      setReadingPhase('analyzing');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/astrologer-ai-reading`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            trees,
            treesB,
            question: fullQuestion,
            readingFocus: isSynastry ? 'synastry' : 'personA',
            personName: 'You',
            personNameB: isSynastry ? (birthDataBRef.current?.name || 'Person B') : undefined,
            synastry_context: synastryContext,
            currentDate: new Date().toISOString().split('T')[0],
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || errBody.message || 'Failed to generate reading');
      }

      // Phase 3: Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let readingText = '';
      let technicalText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.phase === 'analyzing') {
              setReadingPhase('analyzing');
              setAnalyzeProgress({ current: parsed.index ?? 0, total: parsed.total ?? 0 });
            }
            if (parsed.phase === 'analyzing_done') {
              setAnalyzeProgress(prev => ({ ...prev, current: parsed.index ?? prev.current }));
              if (parsed.vantage) setAnalyzedPlanets(prev => [...prev, parsed.vantage]);
            }
            if (parsed.phase === 'synthesizing') {
              setReadingPhase('synthesizing');
            }
            if (parsed.content) {
              readingText += parsed.content;
              setFullReading(readingText);
            }
            if (parsed.citations) {
              setCitationsText(prev => prev + parsed.citations);
            }
            if (parsed.technical) {
              technicalText += parsed.technical;
            }
          } catch {}
        }
      }

      setReadingPhase('done');

      // Save reading for shareable link
      if (readingText) {
        try {
          // Get current token for the save call
          const { data: { session: saveSess } } = await supabase.auth.getSession();
          const saveToken = saveSess?.access_token;
          if (saveToken) {
            const saveRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/astrologer-insight-save-reading`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${saveToken}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({
                module_id: module!.id,
                reading_text: readingText,
                technical_text: technicalText || null,
                journey_data: journeyData || null,
                birth_data: birthDataRef.current,
                chart_data: chartDataRef.current,
                module_title: module!.title,
              }),
            });
            const saveData = await saveRes.json().catch(() => ({}));
            if (saveData?.reading_id) {
              setReadingId(saveData.reading_id);
              window.history.replaceState({}, '', `/insight/${module!.slug}?r=${saveData.reading_id}`);
            }
          }
        } catch {
          // Non-blocking
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate reading');
    } finally {
      setReadingLoading(false);
      setReadingPhase('done');
    }
  }, [module, customQuestion]);

  if (!module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl text-foreground" style={{ fontFamily: "'Georgia', serif" }}>Reading not found</h1>
          <Link to="/">
            <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="text-[15px] tracking-[0.15em] uppercase"
            style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300 }}
          >
            Astrologer
          </Link>
          <Link to="/chart">
            <button className="text-[13px] text-muted-foreground/70 hover:text-muted-foreground transition-colors tracking-wide">
              Open App
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 sm:pt-36 pb-10 sm:pb-14 px-4 sm:px-6">
        <div className="relative max-w-xl mx-auto text-center">
          <h1
            className="text-[28px] sm:text-[36px] md:text-[44px] leading-[1.15] tracking-tight"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontWeight: 400 }}
          >
            {module.headline}
          </h1>
          <p
            className="mt-4 text-[15px] sm:text-[17px] leading-[1.7] max-w-md mx-auto"
          >
            {module.subheadline}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="relative z-10 px-4 sm:px-6 pb-16">
        {/* Returning from Stripe — verifying payment */}
        {step === 'returning' && !showPurchaseConfirm && (
          <div className="max-w-[420px] mx-auto text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-4" />
            <p className="text-[15px] text-muted-foreground">Confirming your purchase...</p>
          </div>
        )}

        {/* Purchase confirmed — continue button (provides user gesture for audio) */}
        {step === 'returning' && showPurchaseConfirm && (
          <div className="max-w-[420px] mx-auto text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-[22px] font-medium text-foreground" style={{ fontFamily: "'Georgia', serif" }}>
                Thank you for your purchase
              </h2>
              <p className="text-[15px] text-muted-foreground/70 leading-relaxed max-w-sm mx-auto">
                Your support helps us build better tools for self-discovery. Your full reading with {totalSceneCount > 3 ? totalSceneCount - 3 : 'more'} additional insights is ready.
              </p>
            </div>
            <button
              onClick={() => {
                setShowPurchaseConfirm(false);
                setStep('journey');
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[15px] font-semibold tracking-wide transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #8b6cc1 0%, #c06c84 50%, #d4a574 100%)',
                color: '#fff',
              }}
            >
              Continue Your Reading
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'input' && (
          <>
            <BirthDataStep module={module} onSubmit={handleBirthSubmit} loading={loading} />
            {loading && chartForFacts && (
              <div className="max-w-[420px] mx-auto pt-6">
                <ChartSnapshotFacts chart={chartForFacts} />
              </div>
            )}
          </>
        )}
        {step === 'journey' && journeyData && chartForFacts && (
          <div className="max-w-[480px] mx-auto space-y-6">
            <InsightJourney
              journeyData={journeyData}
              chart={chartForFacts}
              totalSceneCount={totalSceneCount}
              freeSceneCount={isPaid ? 999 : 3}
              resumeAtScene={resumeAtScene}
              onPaywallHit={() => {
                if (!isPaid) {
                  setPaywallHit(true);
                  analytics.trackInsightUnlockClicked({ module: module!.id });
                }
              }}
              onComplete={(responses) => {
                setJourneyComplete(true);
                setSceneResponses(responses);
                // Report already generating in background since payment.
                // Only start it here if somehow it wasn't started yet.
                if (isPaid && !readingStartedRef.current) {
                  readingStartedRef.current = true;
                  generateFullReading();
                }
              }}
            />

            {/* Post-journey paywall — clean CTA with personal question */}
            {paywallHit && (
              <div className="space-y-5 relative z-10">
                <div className="rounded-xl border border-border bg-card p-6 space-y-5">
                  <p className="text-[15px] text-foreground/80 leading-relaxed text-center">
                    Your full reading has {totalSceneCount - 3} more insights, plus a personalized deep analysis.
                  </p>

                  {/* Personal question — optional */}
                  <div className="space-y-3">
                    <p className="text-[12px] text-muted-foreground uppercase tracking-[0.15em] text-center">
                      Ask a personal question (included free)
                    </p>
                    <textarea
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="e.g. Why do I keep attracting the wrong people?"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
                    />
                    {/* Suggested questions */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(MODULE_SUGGESTED_QUESTIONS[module!.id] || []).map((q, i) => (
                        <button
                          key={i}
                          onClick={() => setCustomQuestion(q)}
                          className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                            customQuestion === q
                              ? 'border-primary/50 bg-primary/10 text-foreground'
                              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="text-center space-y-2">
                    <button
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="w-full max-w-[300px] h-[52px] rounded-xl text-[15px] font-semibold tracking-wide transition-all duration-300 disabled:opacity-50 shadow-lg mx-auto"
                      style={{
                        background: 'linear-gradient(135deg, #8b6cc1 0%, #c06c84 50%, #d4a574 100%)',
                        color: '#fff',
                        border: 'none',
                      }}
                    >
                      {unlocking ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        `Continue Reading \u2014 $${((module!.priceCents || 999) / 100).toFixed(2)}`
                      )}
                    </button>
                    <p className="text-[11px] text-muted-foreground/50">One-time purchase. Keep forever.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Other modules — only show at paywall, not during active journey */}
            {paywallHit && (
              <div className="pt-4">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />
                <p className="text-[12px] text-muted-foreground uppercase tracking-[0.2em] text-center mb-4">More readings</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INSIGHT_MODULE_LIST.filter(m => m.id !== module!.id).map(m => (
                    <Link
                      key={m.id}
                      to={`/insight/${m.slug}`}
                      className="py-4 px-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-center group"
                    >
                      <div className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{m.title}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Written report — shows after ALL journey cards are done (paid) */}
        {journeyComplete && (
          <div className="max-w-[700px] mx-auto pt-8">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />
            <FullReading module={module} reading={fullReading} loading={readingLoading} readingId={readingId} citationsText={citationsText} chart={chartDataRef.current} phase={readingPhase} analyzeProgress={analyzeProgress} analyzedPlanets={analyzedPlanets} journeyScenes={journeyData?.scenes} sceneResponses={sceneResponses} birthData={birthDataRef.current} />

            {/* More readings — at the bottom after report */}
            {!readingLoading && (
              <div className="pt-8">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />
                <p className="text-[12px] text-muted-foreground uppercase tracking-[0.2em] text-center mb-4">More readings</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INSIGHT_MODULE_LIST.filter(m => m.id !== module!.id).map(m => (
                    <Link
                      key={m.id}
                      to={`/insight/${m.slug}`}
                      className="py-4 px-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-center group"
                    >
                      <div className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{m.title}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Social proof — only on input step */}
      {step === 'input' && (
        <section className="relative z-10 px-4 sm:px-6 pb-20">
          <div className="max-w-[420px] mx-auto pt-8">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} viewBox="0 0 20 20" className="w-4 h-4" fill="#d4a574">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[14px] text-muted-foreground/70 italic leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
                "Unlike generic horoscopes, this reading is computed from the exact positions of the planets at the moment you were born — uniquely yours."
              </p>
              <p className="text-[11px] text-muted-foreground/40 uppercase tracking-[0.15em]">Your personal natal blueprint</p>
            </div>
          </div>
        </section>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => {
          setShowAuth(false);
          if (user) handleUnlock();
        }}
        defaultTab="signup"
      />

      {/* Footer */}
      <footer className="border-t border-border/60/40 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[12px] tracking-[0.12em] uppercase text-muted-foreground/40">Astrologer</span>
          <div className="flex gap-6 text-[12px] text-muted-foreground/40">
            <Link to="/terms" className="hover:text-muted-foreground/70 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-muted-foreground/70 transition-colors">Privacy</Link>
            <Link to="/support" className="hover:text-muted-foreground/70 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function buildCompactSummary(chart: any) {
  const summary: any = { planets: {}, houses: chart.houses, angles: chart.angles };
  for (const [key, planet] of Object.entries(chart.planets)) {
    const p = planet as any;
    summary.planets[key] = { sign: p.sign, house: p.house, retrograde: p.retrograde, degree: p.degree };
  }
  return summary;
}
