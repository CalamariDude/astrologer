/**
 * Rectification Workbench
 * Birth time determination from life events
 * Uses location search (Mapbox geocoding) instead of raw lat/lng
 */

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, MapPin, CalendarDays, Search, RotateCcw, Sparkles } from 'lucide-react';
import { swissEphemeris } from '@/api/swissEphemeris';
import type { NatalChart } from '@/components/biwheel/types';
import { scoreCandidateTime } from '@/lib/rectificationScoring';
import type { LifeEvent, CandidateTime } from '@/lib/rectificationScoring';
import { geocodeLocationFast } from '@/utils/geocoding';
import { EventInput } from './EventInput';
import { RectificationResults } from './RectificationResults';

export function RectificationWorkbench() {
  // Step 1: Input
  const [birthDate, setBirthDate] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [resolvedLocation, setResolvedLocation] = useState<{ lat: number; lng: number; displayName: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [events, setEvents] = useState<LifeEvent[]>([
    { date: '', category: 'marriage', description: '' },
    { date: '', category: 'career', description: '' },
    { date: '', category: 'child', description: '' },
  ]);

  // Step 2: Processing
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [candidates, setCandidates] = useState<CandidateTime[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateTime | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validEvents = events.filter(e => e.date && e.category);
  const canStart = birthDate && resolvedLocation && validEvents.length >= 3;

  // Location lookup
  const lookupLocation = useCallback(async () => {
    if (!locationQuery.trim()) return;
    setLocationLoading(true);
    setLocationError(null);
    setResolvedLocation(null);

    const result = await geocodeLocationFast(locationQuery);
    if (result) {
      setResolvedLocation(result);
    } else {
      setLocationError('Location not found. Try a different city name.');
    }
    setLocationLoading(false);
  }, [locationQuery]);

  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lookupLocation();
    }
  };

  /**
   * Calculate a natal chart for a given time
   */
  const calculateChartForTime = async (time: string): Promise<NatalChart | null> => {
    if (!resolvedLocation) return null;
    try {
      const data = await swissEphemeris.natal({
        birth_date: birthDate,
        birth_time: time,
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
      });

      if (data?.error) return null;

      const planets: Record<string, any> = {};
      for (const p of data.planets || []) {
        planets[p.planet.toLowerCase()] = {
          longitude: p.longitude,
          sign: p.sign,
          house: p.house,
          retrograde: p.retrograde,
          decan: p.decan,
          decanSign: p.decanSign,
        };
      }

      const houses: Record<string, number> = {};
      if (data.houses?.cusps) {
        data.houses.cusps.forEach((cusp: number, i: number) => {
          houses[`house_${i + 1}`] = cusp;
        });
      }

      return {
        planets,
        houses,
        angles: {
          ascendant: data.houses?.ascendant ?? 0,
          midheaven: data.houses?.mc ?? 0,
        },
      };
    } catch {
      return null;
    }
  };

  /**
   * Run rectification analysis
   */
  const runRectification = useCallback(async () => {
    if (!canStart) return;

    setStep(2);
    setProgress(0);
    setError(null);
    setCandidates([]);
    setSelectedCandidate(null);

    try {
      setProgressMessage('Scanning 24 candidate times across the day...');

      const initialTimes: string[] = [];
      for (let h = 0; h < 24; h++) {
        initialTimes.push(`${String(h).padStart(2, '0')}:00`);
      }

      const initialCandidates: CandidateTime[] = [];

      for (let i = 0; i < initialTimes.length; i++) {
        const time = initialTimes[i];
        setProgress(Math.round(((i + 1) / initialTimes.length) * 50));

        const chart = await calculateChartForTime(time);
        if (!chart) continue;

        const scored = scoreCandidateTime(chart, validEvents);
        scored.time = time;
        initialCandidates.push(scored);
      }

      if (initialCandidates.length === 0) {
        throw new Error('No charts could be calculated. Check birth date and location.');
      }

      setProgressMessage('Refining top candidate ranges (10-minute intervals)...');
      initialCandidates.sort((a, b) => b.score - a.score);
      const top3Times = initialCandidates.slice(0, 3);

      const refinedCandidates: CandidateTime[] = [...initialCandidates];

      for (let t = 0; t < top3Times.length; t++) {
        const topTime = top3Times[t].time;
        const [hour] = topTime.split(':').map(Number);

        for (let m = 0; m < 60; m += 10) {
          if (m === 0) continue;
          const finerTime = `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          setProgress(50 + Math.round(((t * 6 + m / 10) / 18) * 50));

          const chart = await calculateChartForTime(finerTime);
          if (!chart) continue;

          const scored = scoreCandidateTime(chart, validEvents);
          scored.time = finerTime;
          refinedCandidates.push(scored);
        }
      }

      refinedCandidates.sort((a, b) => a.time.localeCompare(b.time));
      setCandidates(refinedCandidates);

      const best = [...refinedCandidates].sort((a, b) => b.score - a.score)[0];
      if (best) setSelectedCandidate(best);

      setStep(3);
      setProgress(100);
      setProgressMessage('Analysis complete!');
    } catch (err: any) {
      setError(err.message);
      setStep(1);
    }
  }, [birthDate, resolvedLocation, validEvents, canStart]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Birth Time Rectification</h3>
        <p className="text-xs text-muted-foreground">Determine probable birth time from life events using astrological indicators</p>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          {/* Birth Data */}
          <div className="rounded-xl border bg-card/50 p-4 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Birth Information</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Birth Date */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Birth Date</label>
                <div className="relative">
                  <CalendarDays className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 rounded-lg border bg-background text-sm tabular-nums"
                  />
                </div>
              </div>

              {/* Location Search */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Birth Location</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={e => { setLocationQuery(e.target.value); setResolvedLocation(null); setLocationError(null); }}
                      onKeyDown={handleLocationKeyDown}
                      placeholder="Search city (e.g. Beirut, Lebanon)"
                      className="w-full h-9 pl-8 pr-3 rounded-lg border bg-background text-sm"
                    />
                  </div>
                  <Button
                    onClick={lookupLocation}
                    disabled={locationLoading || !locationQuery.trim()}
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-lg px-3"
                  >
                    {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  </Button>
                </div>

                {/* Location result */}
                {resolvedLocation && (
                  <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/8 ring-1 ring-emerald-500/20">
                    <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">{resolvedLocation.displayName}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                      {resolvedLocation.lat.toFixed(2)}, {resolvedLocation.lng.toFixed(2)}
                    </span>
                  </div>
                )}
                {locationError && (
                  <div className="mt-2 text-xs text-red-500">{locationError}</div>
                )}
              </div>
            </div>
          </div>

          {/* Events */}
          <EventInput events={events} onChange={setEvents} />

          {/* Start Button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={runRectification}
              disabled={!canStart}
              size="lg"
              className="flex-1 rounded-xl h-11 font-semibold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Rectification Analysis
            </Button>
          </div>

          {!canStart && (
            <div className="text-xs text-muted-foreground text-center">
              {!birthDate ? 'Enter birth date' : !resolvedLocation ? 'Search for birth location' : `Add ${3 - validEvents.length} more event(s)`}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl border bg-card/50 p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="text-sm font-semibold mb-1">{progressMessage}</div>
            <div className="text-xs text-muted-foreground mb-4">This may take a minute &mdash; calculating charts for each candidate time</div>
            <Progress value={progress} className="h-2 rounded-full" />
            <div className="text-xs text-muted-foreground mt-2 tabular-nums">{progress}% complete</div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs rounded-lg px-2.5 py-1">
                {candidates.length} candidate times analyzed
              </Badge>
              {resolvedLocation && (
                <span className="text-xs text-muted-foreground">{resolvedLocation.displayName}</span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => { setStep(1); setCandidates([]); }} className="rounded-lg gap-1.5">
              <RotateCcw className="w-3 h-3" /> Start Over
            </Button>
          </div>

          {selectedCandidate && (
            <div className="rounded-xl border bg-gradient-to-r from-primary/8 to-transparent ring-1 ring-primary/20 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">Best Candidate Time</div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="font-mono text-lg px-3 py-1 bg-primary/90">{selectedCandidate.time}</Badge>
                <Badge
                  variant="outline"
                  className="text-sm px-2.5 py-0.5"
                  style={{ borderColor: '#' + (selectedCandidate.ascendantSign === 'Aries' ? 'E53935' : '888') }}
                >
                  {selectedCandidate.ascendantSign} Ascendant
                </Badge>
                <span className="text-sm">Score: <strong className="text-lg">{selectedCandidate.score}</strong></span>
              </div>
            </div>
          )}

          <RectificationResults
            candidates={candidates}
            onSelectCandidate={(c) => setSelectedCandidate(c)}
            selectedTime={selectedCandidate?.time}
          />
        </div>
      )}
    </div>
  );
}
