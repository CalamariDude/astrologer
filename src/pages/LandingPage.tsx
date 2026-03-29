import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, MapPin, Plus, X, FolderOpen, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateInput } from '@/components/ui/DateInput';
import { TimeInput } from '@/components/ui/TimeInput';
import { swissEphemeris } from '@/api/swissEphemeris';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SavedChartsList } from '@/components/charts/SavedChartsList';
import { AuthModal } from '@/components/auth/AuthModal';
import type { ParsedPerson } from '@/components/charts/AstroComImport';
import { ChartImport } from '@/components/charts/AstroSeekImport';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

interface BirthData {
  name: string;
  date: string;
  time: string;
  location: string;
  lat: number | null;
  lng: number | null;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

const emptyBirth = (): BirthData => ({
  name: '',
  date: '',
  time: '12:00',
  location: '',
  lat: null,
  lng: null,
});

function BirthForm({
  data,
  onChange,
  label,
  onRemove,
}: {
  data: BirthData;
  onChange: (d: BirthData) => void;
  label: string;
  onRemove?: () => void;
}) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeoResult[]>([]);

  const searchLocation = useCallback(async () => {
    if (!data.location || data.location.length < 2) return;
    setSearching(true);
    try {
      const base = import.meta.env.DEV
        ? '/nominatim'
        : 'https://nominatim.openstreetmap.org';
      const res = await fetch(
        `${base}/search?format=json&q=${encodeURIComponent(data.location)}&limit=5`,
      );
      const json: GeoResult[] = await res.json();
      if (json.length > 0) {
        onChange({ ...data, location: json[0].display_name, lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) });
        setResults(json.length > 1 ? json.slice(1) : []);
      } else {
        setResults([]);
        toast.error('No locations found');
      }
    } catch {
      toast.error('Location search failed');
    } finally {
      setSearching(false);
    }
  }, [data, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider">{label}</h3>
        {onRemove && (
          <button onClick={onRemove} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Name (optional)"
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        className="w-full px-3 py-2 border rounded-sm bg-background text-sm"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Birth Date</label>
          <DateInput
            value={data.date}
            onChange={(date) => onChange({ ...data, date })}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Birth Time</label>
          <TimeInput
            value={data.time}
            onChange={(time) => onChange({ ...data, time })}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Birth Location</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="City, Country"
            value={data.location}
            onChange={(e) => {
              onChange({ ...data, location: e.target.value, lat: null, lng: null });
              setResults([]);
            }}
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            className="flex-1 px-3 py-2 border rounded-sm bg-background text-sm"
          />
          <Button size="sm" variant="outline" onClick={searchLocation} disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          </Button>
        </div>
        {results.length > 0 && (
          <div className="mt-1 border rounded-sm bg-background max-h-40 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  onChange({ ...data, location: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
                  setResults([]);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
        {data.lat !== null && (
          <p className="text-xs text-muted-foreground mt-1">
            {data.lat.toFixed(4)}, {data.lng?.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPaid } = useSubscription();
  const [personA, setPersonA] = useState<BirthData>(emptyBirth());
  const [personB, setPersonB] = useState<BirthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleLoadChart = (chart: any) => {
    navigate('/chart', {
      state: {
        personA: {
          name: chart.person_a_name || '',
          date: chart.person_a_date,
          time: chart.person_a_time,
          location: chart.person_a_location || '',
          lat: chart.person_a_lat,
          lng: chart.person_a_lng,
          natalChart: chart.person_a_chart,
        },
        personB: chart.person_b_chart ? {
          name: chart.person_b_name || '',
          date: chart.person_b_date,
          time: chart.person_b_time,
          location: chart.person_b_location || '',
          lat: chart.person_b_lat,
          lng: chart.person_b_lng,
          natalChart: chart.person_b_chart,
        } : null,
      },
    });
  };

  const handleAstroImport = useCallback((persons: ParsedPerson[]) => {
    if (persons.length >= 1) {
      const a = persons[0];
      setPersonA({
        name: a.name,
        date: a.date,
        time: a.time,
        location: a.location,
        lat: a.lat,
        lng: a.lng,
      });
    }
    if (persons.length >= 2) {
      const b = persons[1];
      setPersonB({
        name: b.name,
        date: b.date,
        time: b.time,
        location: b.location,
        lat: b.lat,
        lng: b.lng,
      });
    } else {
      setPersonB(null);
    }
    setShowImport(false);
    toast.success(`Imported ${persons.length} profile${persons.length !== 1 ? 's' : ''}`);
  }, []);

  const calculateChart = useCallback(async () => {
    if (!personA.date || personA.lat === null) {
      toast.error('Please enter a birth date and search for a location');
      return;
    }

    setLoading(true);
    try {
      // Fetch natal chart for person A
      const dataA = await swissEphemeris.natal({
        birth_date: personA.date,
        birth_time: personA.time || '12:00',
        lat: personA.lat,
        lng: personA.lng,
      });

      const chartA = parseNatalResponse(dataA);

      let chartB = null;
      if (personB && personB.date && personB.lat !== null) {
        const dataB = await swissEphemeris.natal({
          birth_date: personB.date,
          birth_time: personB.time || '12:00',
          lat: personB.lat,
          lng: personB.lng,
        });
        chartB = parseNatalResponse(dataB);
      }

      // Navigate to chart page with data
      navigate('/chart', {
        state: {
          personA: { ...personA, natalChart: chartA },
          personB: personB && chartB ? { ...personB, natalChart: chartB } : null,
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to calculate chart');
    } finally {
      setLoading(false);
    }
  }, [personA, personB, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/">
            <h1 className="text-4xl font-bold tracking-tight">Astrologer</h1>
          </Link>
          <p className="text-muted-foreground">Free professional astrology chart tools</p>
        </div>

        {/* Import / Load Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 border rounded-sm text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <ClipboardPaste className="w-4 h-4" />
            Import Charts
          </button>
          {user && isPaid && (
            <button
              onClick={() => setShowSaved(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 border rounded-sm text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Load Saved Chart
            </button>
          )}
        </div>

        {/* Person A */}
        <Card className="p-6">
          <BirthForm
            data={personA}
            onChange={setPersonA}
            label="Your Birth Data"
          />
        </Card>

        {/* Person B (synastry) */}
        {personB ? (
          <Card className="p-6">
            <BirthForm
              data={personB}
              onChange={setPersonB}
              label="Second Person"
              onRemove={() => setPersonB(null)}
            />
          </Card>
        ) : (
          <button
            onClick={() => setPersonB(emptyBirth())}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed rounded-sm text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add second person for synastry
          </button>
        )}

        {/* Calculate */}
        <Button
          onClick={calculateChart}
          disabled={loading || !personA.date || personA.lat === null}
          className="w-full h-12 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Calculating...
            </>
          ) : (
            'Calculate Chart'
          )}
        </Button>
      </div>

      <SavedChartsList isOpen={showSaved} onClose={() => setShowSaved(false)} onLoad={handleLoadChart} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <ChartImport isOpen={showImport} onClose={() => setShowImport(false)} onImport={handleAstroImport} />
    </div>
  );
}

/** Parse the /natal API response into our NatalChart format */
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
      };
    }
  }

  // Parse houses
  const houses: Record<string, number> = {};
  if (data.houses) {
    if (Array.isArray(data.houses)) {
      data.houses.forEach((cusp: number, i: number) => {
        houses[`house_${i + 1}`] = cusp;
      });
    } else if (data.houses.cusps) {
      data.houses.cusps.forEach((cusp: number, i: number) => {
        houses[`house_${i + 1}`] = cusp;
      });
    }
  }

  // Parse angles
  let angles: { ascendant: number; midheaven: number } | undefined;
  if (data.angles) {
    angles = {
      ascendant: data.angles.ascendant ?? data.angles.asc ?? 0,
      midheaven: data.angles.midheaven ?? data.angles.mc ?? 0,
    };
  } else if (data.houses?.ascendant !== undefined) {
    angles = {
      ascendant: data.houses.ascendant,
      midheaven: data.houses.mc ?? data.houses.midheaven ?? 0,
    };
  }

  return { planets, houses, angles };
}
