import { useState, useCallback, useRef } from 'react';
import { Loader2, MapPin, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/DateInput';
import { TimeInput } from '@/components/ui/TimeInput';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { swissEphemeris } from '@/api/swissEphemeris';
import { invalidateChartsCache } from '@/components/charts/SaveChartButton';

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface BirthDetailsModalProps {
  open: boolean;
  onComplete: () => void;
}

export function BirthDetailsModal({ open, onComplete }: BirthDetailsModalProps) {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [locSelectedIdx, setLocSelectedIdx] = useState(-1);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationAbortRef = useRef<AbortController | null>(null);

  // Load display name from profile on first open
  const [nameLoaded, setNameLoaded] = useState(false);
  if (open && !nameLoaded && user) {
    setNameLoaded(true);
    supabase.from('astrologer_profiles').select('display_name').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.display_name) setName(data.display_name);
      });
  }

  const searchLocation = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setGeoResults([]); return; }
    locationAbortRef.current?.abort();
    const controller = new AbortController();
    locationAbortRef.current = controller;
    setSearching(true);
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&autocomplete=true&limit=5&types=place,locality,region,country`,
        { signal: controller.signal },
      );
      const json = await res.json();
      if (!controller.signal.aborted) {
        const mapped: GeoResult[] = (json.features || []).map((f: any) => ({
          display_name: f.place_name,
          lat: String(f.center[1]),
          lon: String(f.center[0]),
        }));
        setGeoResults(mapped);
        setLocSelectedIdx(-1);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') toast.error('Location search failed');
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }, []);

  const debouncedLocationSearch = useCallback((query: string) => {
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    locationDebounceRef.current = setTimeout(() => searchLocation(query), 300);
  }, [searchLocation]);

  const selectGeoResult = useCallback((result: GeoResult) => {
    setLocation(result.display_name);
    setLat(parseFloat(result.lat));
    setLng(parseFloat(result.lon));
    setGeoResults([]);
    setLocSelectedIdx(-1);
  }, []);

  const isValid = name.trim() && birthDate && birthDate.length === 10 && lat !== null && lng !== null;

  const handleSubmit = useCallback(async () => {
    if (!isValid || !user || !lat || !lng) return;
    setSaving(true);
    try {
      // Calculate natal chart
      const chartData = await swissEphemeris.natal({
        birth_date: birthDate,
        birth_time: birthTime,
        lat,
        lng,
      });

      // Insert into saved_charts
      const { error } = await supabase.from('saved_charts').insert({
        user_id: user.id,
        name: `${name.trim()}'s Chart`,
        chart_type: 'natal',
        person_a_name: name.trim(),
        person_a_date: birthDate,
        person_a_time: birthTime,
        person_a_location: location,
        person_a_lat: lat,
        person_a_lng: lng,
        person_a_chart: chartData,
      });

      if (error) throw error;

      invalidateChartsCache();
      toast.success('Birth chart saved! Your horoscope is on its way.');
      onComplete();
    } catch (err: any) {
      console.error('Failed to save birth chart:', err);
      toast.error(err.message || 'Failed to save birth chart');
    } finally {
      setSaving(false);
    }
  }, [isValid, user, name, birthDate, birthTime, location, lat, lng, onComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent hideCloseButton className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <DialogTitle>Welcome! Set up your birth chart</DialogTitle>
          </div>
          <DialogDescription>
            Enter your birth details to unlock your personalized daily horoscope and chart readings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm"
              autoFocus
            />
          </div>

          {/* Birth Date */}
          <div>
            <label className="text-sm font-medium">Birth Date</label>
            <div className="mt-1">
              <DateInput value={birthDate} onChange={setBirthDate} />
            </div>
          </div>

          {/* Birth Time */}
          <div>
            <label className="text-sm font-medium">Birth Time</label>
            <p className="text-xs text-muted-foreground mb-1">If unknown, leave as 12:00 (noon)</p>
            <TimeInput value={birthTime} onChange={setBirthTime} />
          </div>

          {/* Birth Location */}
          <div>
            <label className="text-sm font-medium">Birth Location</label>
            <div className="relative mt-1">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={location}
                  onChange={e => {
                    const val = e.target.value;
                    setLocation(val);
                    setLat(null);
                    setLng(null);
                    debouncedLocationSearch(val);
                  }}
                  onKeyDown={e => {
                    if (geoResults.length > 0) {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setLocSelectedIdx(i => Math.min(i + 1, geoResults.length - 1)); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setLocSelectedIdx(i => Math.max(i - 1, -1)); }
                      else if (e.key === 'Enter' && locSelectedIdx >= 0) { e.preventDefault(); selectGeoResult(geoResults[locSelectedIdx]); }
                      else if (e.key === 'Escape') { setGeoResults([]); setLocSelectedIdx(-1); }
                    } else if (e.key === 'Enter' && location.length >= 2) {
                      searchLocation(location);
                    }
                  }}
                  onFocus={() => setLocationFocused(true)}
                  onBlur={() => setTimeout(() => setLocationFocused(false), 200)}
                  placeholder="City, Country"
                  className="w-full h-9 px-3 pr-8 rounded-md border bg-background text-sm"
                  autoComplete="off"
                />
                {searching ? (
                  <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
                ) : lat !== null ? (
                  <MapPin className="absolute right-2.5 top-2.5 w-4 h-4 text-emerald-500" />
                ) : null}
              </div>
              {locationFocused && geoResults.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 border rounded-md bg-popover shadow-xl max-h-48 overflow-y-auto">
                  {geoResults.map((r, i) => (
                    <button
                      key={i}
                      onMouseDown={e => e.preventDefault()}
                      onMouseEnter={() => setLocSelectedIdx(i)}
                      onClick={() => selectGeoResult(r)}
                      className={`w-full text-left px-3 py-2.5 text-xs border-b last:border-b-0 transition-colors ${
                        i === locSelectedIdx ? 'bg-accent' : 'hover:bg-muted'
                      }`}
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className="w-full mt-2"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating chart...</>
          ) : (
            'Save & Continue'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
