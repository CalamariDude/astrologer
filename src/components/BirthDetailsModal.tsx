import { useState, useCallback } from 'react';
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

  // Load display name from profile on first open
  const [nameLoaded, setNameLoaded] = useState(false);
  if (open && !nameLoaded && user) {
    setNameLoaded(true);
    supabase.from('astrologer_profiles').select('display_name').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.display_name) setName(data.display_name);
      });
  }

  const searchLocation = useCallback(async () => {
    if (!location || location.length < 2) return;
    setSearching(true);
    try {
      const base = import.meta.env.DEV
        ? '/nominatim'
        : 'https://nominatim.openstreetmap.org';
      const res = await fetch(
        `${base}/search?format=json&q=${encodeURIComponent(location)}&limit=5`,
      );
      const json: GeoResult[] = await res.json();
      if (json.length > 0) {
        setLocation(json[0].display_name);
        setLat(parseFloat(json[0].lat));
        setLng(parseFloat(json[0].lon));
        setGeoResults(json.length > 1 ? json.slice(1) : []);
      } else {
        setGeoResults([]);
        toast.error('No locations found');
      }
    } catch {
      toast.error('Location search failed');
    } finally {
      setSearching(false);
    }
  }, [location]);

  const selectGeoResult = useCallback((result: GeoResult) => {
    setLocation(result.display_name);
    setLat(parseFloat(result.lat));
    setLng(parseFloat(result.lon));
    setGeoResults([]);
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
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={location}
                  onChange={e => { setLocation(e.target.value); setLat(null); setLng(null); setGeoResults([]); }}
                  placeholder="City, Country"
                  className="w-full h-9 px-3 pr-8 rounded-md border bg-background text-sm"
                  onKeyDown={e => e.key === 'Enter' && searchLocation()}
                />
                {lat !== null && (
                  <MapPin className="absolute right-2.5 top-2.5 w-4 h-4 text-emerald-500" />
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={searchLocation}
                disabled={searching || !location || location.length < 2}
                className="h-9 px-3"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {/* Geo results dropdown */}
            {geoResults.length > 0 && (
              <div className="mt-1 border rounded-md bg-popover shadow-sm max-h-32 overflow-y-auto">
                {geoResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectGeoResult(r)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-b last:border-b-0"
                  >
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}
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
