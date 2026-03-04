import React, { useState, useCallback, useRef } from 'react';
import { Loader2, Plus, X, Check, Clock, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { swissEphemeris } from '@/api/swissEphemeris';

// ─── Constants ──────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

const PLANET_OPTIONS = [
  'Ascendant', 'MC', 'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron',
  'NorthNode', 'SouthNode',
] as const;

const PLANET_LABELS: Record<string, string> = {
  Ascendant: 'Ascendant', MC: 'MC', Sun: 'Sun', Moon: 'Moon',
  Mercury: 'Mercury', Venus: 'Venus', Mars: 'Mars', Jupiter: 'Jupiter',
  Saturn: 'Saturn', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
  Chiron: 'Chiron', NorthNode: 'North Node', SouthNode: 'South Node',
};

// Fast-moving bodies get full weight; slow ones get half
const PLANET_WEIGHT: Record<string, number> = {
  Ascendant: 1, MC: 1, Moon: 1,
  Sun: 0.5, Mercury: 0.5, Venus: 0.5, Mars: 0.5,
  Jupiter: 0.5, Saturn: 0.5, Uranus: 0.5, Neptune: 0.5, Pluto: 0.5,
  Chiron: 0.5, NorthNode: 0.5, SouthNode: 0.5,
};

// ─── Types ──────────────────────────────────────────────────────────

interface TargetPosition {
  id: string;
  planet: string;
  degree: number;
  minute: number;
  sign: string;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface CandidateResult {
  time: string;
  score: number;
  positions: { planet: string; sign: string; degree: number; minute: number; longitude: number; diff: number }[];
  chartData: any;
}

interface TimeFinderProps {
  onUseTime?: (data: { date: string; time: string; location: string; lat: number; lng: number }) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────

function toAbsoluteLongitude(signIndex: number, degree: number, minute: number): number {
  return signIndex * 30 + degree + minute / 60;
}

function angularDistance(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function formatDegree(deg: number, min: number, sign: string): string {
  return `${deg}°${String(min).padStart(2, '0')}' ${sign}`;
}

function padTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Component ──────────────────────────────────────────────────────

export function TimeFinder({ onUseTime }: TimeFinderProps) {
  // Form state
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [targets, setTargets] = useState<TargetPosition[]>([
    { id: crypto.randomUUID(), planet: 'Ascendant', degree: 0, minute: 0, sign: 'Aries' },
  ]);

  // Location search
  const [locationResults, setLocationResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const locationAbortRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  // ─── Location autocomplete ─────────────────────────────────────

  const searchLocation = useCallback((query: string) => {
    setLocation(query);
    setLat(null);
    setLng(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query || query.length < 2) { setLocationResults([]); return; }

    searchTimeoutRef.current = setTimeout(async () => {
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
          setLocationResults((json.features || []).map((f: any) => ({
            display_name: f.place_name,
            lat: String(f.center[1]),
            lon: String(f.center[0]),
          })));
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') setLocationResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const selectLocation = useCallback((r: GeoResult) => {
    setLocation(r.display_name);
    setLat(parseFloat(r.lat));
    setLng(parseFloat(r.lon));
    setLocationResults([]);
  }, []);

  // ─── Target positions CRUD ──────────────────────────────────────

  const addTarget = () => {
    const used = new Set(targets.map(t => t.planet));
    const next = PLANET_OPTIONS.find(p => !used.has(p)) || 'Sun';
    setTargets(prev => [...prev, { id: crypto.randomUUID(), planet: next, degree: 0, minute: 0, sign: 'Aries' }]);
  };

  const removeTarget = (id: string) => {
    if (targets.length <= 1) return;
    setTargets(prev => prev.filter(t => t.id !== id));
  };

  const updateTarget = (id: string, field: keyof TargetPosition, value: any) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // ─── Scanning logic ─────────────────────────────────────────────

  const canScan = date && lat !== null && lng !== null && targets.length > 0;

  const extractPositions = (chartData: any, targetPlanets: string[]): Map<string, { sign: string; degree: number; minute: number; longitude: number }> => {
    const map = new Map<string, { sign: string; degree: number; minute: number; longitude: number }>();
    const planets: any[] = chartData.planets || [];

    for (const p of planets) {
      if (targetPlanets.includes(p.planet)) {
        map.set(p.planet, { sign: p.sign, degree: p.degree, minute: p.minute ?? 0, longitude: p.longitude });
      }
    }

    // Ascendant and MC come from houses
    if (targetPlanets.includes('Ascendant') && chartData.houses) {
      const asc = chartData.houses.ascendant;
      const signIdx = Math.floor(asc / 30);
      const deg = Math.floor(asc % 30);
      const min = Math.round((asc % 1) * 60);
      map.set('Ascendant', { sign: ZODIAC_SIGNS[signIdx], degree: deg, minute: min, longitude: asc });
    }
    if (targetPlanets.includes('MC') && chartData.houses) {
      const mc = chartData.houses.mc;
      const signIdx = Math.floor(mc / 30);
      const deg = Math.floor(mc % 30);
      const min = Math.round((mc % 1) * 60);
      map.set('MC', { sign: ZODIAC_SIGNS[signIdx], degree: deg, minute: min, longitude: mc });
    }

    // South Node = North Node + 180
    if (targetPlanets.includes('SouthNode')) {
      const nn = planets.find(p => p.planet === 'NorthNode');
      if (nn) {
        const snLon = (nn.longitude + 180) % 360;
        const signIdx = Math.floor(snLon / 30);
        const deg = Math.floor(snLon % 30);
        const min = Math.round((snLon % 1) * 60);
        map.set('SouthNode', { sign: ZODIAC_SIGNS[signIdx], degree: deg, minute: min, longitude: snLon });
      }
    }

    return map;
  };

  const scoreCandidate = (positions: Map<string, { sign: string; degree: number; minute: number; longitude: number }>): { score: number; details: CandidateResult['positions'] } => {
    let score = 0;
    const details: CandidateResult['positions'] = [];

    for (const target of targets) {
      const pos = positions.get(target.planet);
      if (!pos) continue;

      const targetLon = toAbsoluteLongitude(ZODIAC_SIGNS.indexOf(target.sign as any), target.degree, target.minute);
      const diff = angularDistance(pos.longitude, targetLon);
      const weight = PLANET_WEIGHT[target.planet] ?? 0.5;
      score += diff * weight;

      details.push({
        planet: target.planet,
        sign: pos.sign,
        degree: pos.degree,
        minute: pos.minute,
        longitude: pos.longitude,
        diff,
      });
    }

    return { score, details };
  };

  const runScan = async () => {
    if (!canScan) return;
    setScanning(true);
    setProgress(0);
    setResults([]);
    setError(null);
    abortRef.current = false;

    const targetPlanets = targets.map(t => t.planet);

    try {
      // Phase 1: Coarse scan — every 10 minutes across 24h (144 calls)
      setProgressMessage('Phase 1: Scanning every 10 minutes...');
      const coarseCandidates: { time: string; score: number; details: CandidateResult['positions']; chartData: any }[] = [];
      const totalCoarse = 144;

      for (let i = 0; i < totalCoarse; i++) {
        if (abortRef.current) break;
        const h = Math.floor((i * 10) / 60);
        const m = (i * 10) % 60;
        const time = padTime(h, m);

        try {
          const chartData = await swissEphemeris.natal({
            birth_date: date,
            birth_time: time,
            lat,
            lng,
          });

          const positions = extractPositions(chartData, targetPlanets);
          const { score, details } = scoreCandidate(positions);
          coarseCandidates.push({ time, score, details, chartData });
        } catch {
          // Skip failed calls
        }

        setProgress(Math.round(((i + 1) / totalCoarse) * 60));
      }

      if (abortRef.current) { setScanning(false); return; }

      // Sort and take top 3
      coarseCandidates.sort((a, b) => a.score - b.score);
      const top3 = coarseCandidates.slice(0, 3);

      // Phase 2: Refine — 1-minute intervals around each top result (±10 min)
      setProgressMessage('Phase 2: Refining top candidates...');
      const refinedCandidates: { time: string; score: number; details: CandidateResult['positions']; chartData: any }[] = [];
      const refineTimes: string[] = [];

      for (const candidate of top3) {
        const [ch, cm] = candidate.time.split(':').map(Number);
        const baseMins = ch * 60 + cm;
        for (let offset = -10; offset <= 10; offset++) {
          const mins = baseMins + offset;
          if (mins < 0 || mins >= 1440) continue;
          const t = padTime(Math.floor(mins / 60), mins % 60);
          if (!refineTimes.includes(t)) refineTimes.push(t);
        }
      }

      for (let i = 0; i < refineTimes.length; i++) {
        if (abortRef.current) break;
        const time = refineTimes[i];

        try {
          const chartData = await swissEphemeris.natal({
            birth_date: date,
            birth_time: time,
            lat,
            lng,
          });

          const positions = extractPositions(chartData, targetPlanets);
          const { score, details } = scoreCandidate(positions);
          refinedCandidates.push({ time, score, details, chartData });
        } catch {
          // Skip failed calls
        }

        setProgress(60 + Math.round(((i + 1) / refineTimes.length) * 40));
      }

      if (abortRef.current) { setScanning(false); return; }

      // Merge and deduplicate by time, keeping best score
      const allMap = new Map<string, typeof refinedCandidates[0]>();
      for (const c of [...coarseCandidates, ...refinedCandidates]) {
        const existing = allMap.get(c.time);
        if (!existing || c.score < existing.score) allMap.set(c.time, c);
      }

      const final = Array.from(allMap.values())
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
        .map(c => ({ time: c.time, score: c.score, positions: c.details, chartData: c.chartData }));

      setResults(final);
      setProgressMessage('');
    } catch (err: any) {
      setError(err.message || 'Scan failed');
    } finally {
      setScanning(false);
      setProgress(100);
    }
  };

  const cancelScan = () => { abortRef.current = true; };

  // ─── Render ──────────────────────────────────────────────────────

  const inputClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Search className="w-5 h-5" />
          Time Finder
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Find the birth time that matches known planet positions
        </p>
      </div>

      {/* Date & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="relative">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={location}
              onChange={e => searchLocation(e.target.value)}
              placeholder="City, Country"
              className={`${inputClass} pl-8`}
            />
            {searching && <Loader2 className="absolute right-2.5 top-2.5 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>
          {lat !== null && (
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{lat.toFixed(4)}, {lng!.toFixed(4)}</p>
          )}
          {locationResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
              {locationResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectLocation(r)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Target Positions */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Target Positions</label>
        <div className="space-y-2">
          {targets.map(target => (
            <div key={target.id} className="flex items-center gap-2">
              {/* Planet */}
              <select
                value={target.planet}
                onChange={e => updateTarget(target.id, 'planet', e.target.value)}
                className={`${selectClass} w-[130px]`}
              >
                {PLANET_OPTIONS.map(p => (
                  <option key={p} value={p}>{PLANET_LABELS[p]}</option>
                ))}
              </select>

              {/* Degree */}
              <input
                type="number"
                min={0}
                max={29}
                value={target.degree}
                onChange={e => updateTarget(target.id, 'degree', Math.max(0, Math.min(29, parseInt(e.target.value) || 0)))}
                className={`${inputClass} w-[60px] text-center tabular-nums`}
                placeholder="°"
              />
              <span className="text-xs text-muted-foreground">°</span>

              {/* Minute */}
              <input
                type="number"
                min={0}
                max={59}
                value={target.minute}
                onChange={e => updateTarget(target.id, 'minute', Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className={`${inputClass} w-[60px] text-center tabular-nums`}
                placeholder="'"
              />
              <span className="text-xs text-muted-foreground">'</span>

              {/* Sign */}
              <select
                value={target.sign}
                onChange={e => updateTarget(target.id, 'sign', e.target.value)}
                className={`${selectClass} w-[130px]`}
              >
                {ZODIAC_SIGNS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Remove */}
              <button
                onClick={() => removeTarget(target.id)}
                disabled={targets.length <= 1}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={addTarget} className="mt-2 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Planet
        </Button>
      </div>

      {/* Scan button */}
      <div className="flex items-center gap-3">
        <Button onClick={runScan} disabled={!canScan || scanning} className="gap-2">
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {scanning ? 'Scanning...' : 'Find Time'}
        </Button>
        {scanning && (
          <Button variant="outline" size="sm" onClick={cancelScan}>Cancel</Button>
        )}
      </div>

      {/* Progress */}
      {scanning && (
        <div className="rounded-xl border bg-card/50 p-6">
          <div className="text-center max-w-md mx-auto">
            <div className="text-sm font-semibold mb-1">{progressMessage}</div>
            <div className="text-xs text-muted-foreground mb-3">Calculating charts for each candidate time</div>
            <Progress value={progress} className="h-2 rounded-full" />
            <div className="text-xs text-muted-foreground mt-2 tabular-nums">{progress}% complete</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !scanning && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Results</h4>
          {results.map((result, idx) => (
            <div
              key={result.time}
              className={`rounded-lg border p-4 ${idx === 0 ? 'border-primary/40 bg-primary/5' : 'bg-card/50'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono font-semibold text-base">{result.time}</span>
                  {idx === 0 && <span className="text-xs font-medium text-primary">Best Match</span>}
                  {idx > 0 && <span className="text-xs text-muted-foreground">#{idx + 1}</span>}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  score: {result.score.toFixed(1)}°
                </span>
              </div>

              {/* Planet details */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {result.positions.map(pos => (
                  <span key={pos.planet} className="flex items-center gap-1">
                    {pos.diff < 1 ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : pos.diff < 3 ? (
                      <Check className="w-3 h-3 text-yellow-500" />
                    ) : (
                      <X className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-muted-foreground">{PLANET_LABELS[pos.planet]}</span>
                    <span className="font-mono tabular-nums">{formatDegree(pos.degree, pos.minute, pos.sign)}</span>
                    <span className="text-muted-foreground/50">(Δ{pos.diff.toFixed(1)}°)</span>
                  </span>
                ))}
              </div>

              {/* Use this time */}
              {onUseTime && (
                <Button
                  variant={idx === 0 ? 'default' : 'outline'}
                  size="sm"
                  className="mt-3 text-xs gap-1.5"
                  onClick={() => onUseTime({ date, time: result.time, location, lat: lat!, lng: lng! })}
                >
                  <Clock className="w-3 h-3" />
                  Use This Time
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
