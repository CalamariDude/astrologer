/**
 * Chart Entry Form — embedded on the landing page
 * Replaces the "Today's Sky" section with a functional birth chart form
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Plus, X, ClipboardPaste, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/DateInput';
import { TimeInput } from '@/components/ui/TimeInput';
import { swissEphemeris } from '@/api/swissEphemeris';
import { useFadeIn } from '@/hooks/useFadeIn';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
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
  time: '',
  location: '',
  lat: null,
  lng: null,
});

function BirthField({
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">{label}</h3>
        {onRemove && (
          <button onClick={onRemove} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Name (optional)"
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Date</label>
          <DateInput
            value={data.date}
            onChange={(date) => onChange({ ...data, date })}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Time</label>
          <TimeInput
            value={data.time}
            onChange={(time) => onChange({ ...data, time })}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Location</label>
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
            className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm"
          />
          <Button size="sm" variant="outline" onClick={searchLocation} disabled={searching} className="rounded-lg">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          </Button>
        </div>
        {results.length > 0 && (
          <div className="mt-1 border rounded-lg bg-background max-h-32 overflow-y-auto shadow-sm">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  onChange({ ...data, location: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
                  setResults([]);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted border-b last:border-0"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
        {data.lat !== null && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {data.lat.toFixed(4)}, {data.lng?.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}

/** Parse the /natal API response into NatalChart format */
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

export function ChartEntryForm() {
  const navigate = useNavigate();
  const fade = useFadeIn();
  const [personA, setPersonA] = useState<BirthData>(emptyBirth());
  const [personB, setPersonB] = useState<BirthData | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateChart = useCallback(async () => {
    if (!personA.date || personA.lat === null) {
      toast.error('Please enter a birth date and search for a location');
      return;
    }
    setLoading(true);
    try {
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
    <section className="relative z-10 bg-background py-14 sm:py-18 px-4 sm:px-6">
      <div ref={fade.ref} style={fade.style} className={`max-w-xl mx-auto ${fade.className}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/25 mb-1">
            Create your chart
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your birth details to generate a professional natal chart
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Person A */}
          <div className="p-5 rounded-2xl border border-border/40 bg-gradient-to-br from-slate-500/[0.02] to-transparent">
            <BirthField
              data={personA}
              onChange={setPersonA}
              label="Birth Data"
            />
          </div>

          {/* Person B */}
          {personB ? (
            <div className="p-5 rounded-2xl border border-border/40 bg-gradient-to-br from-indigo-500/[0.02] to-transparent">
              <BirthField
                data={personB}
                onChange={setPersonB}
                label="Second Person"
                onRemove={() => setPersonB(null)}
              />
            </div>
          ) : (
            <button
              onClick={() => setPersonB(emptyBirth())}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border/40 rounded-2xl text-xs text-muted-foreground/60 hover:text-foreground/60 hover:border-border transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add second person for synastry
            </button>
          )}

          {/* Calculate */}
          <div className="flex gap-2">
            <Button
              onClick={calculateChart}
              disabled={loading || !personA.date || personA.lat === null}
              className="flex-1 h-11 text-sm rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Calculating...
                </>
              ) : (
                'Calculate Chart'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/chart', { state: { openCurrentTransits: true } })}
              className="h-11 px-4 text-sm rounded-xl gap-1.5"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Current Sky</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
