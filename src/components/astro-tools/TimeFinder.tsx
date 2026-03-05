import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Loader2, Plus, X, Check, Clock, MapPin, Search, Calendar, Upload, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { swissEphemeris } from '@/api/swissEphemeris';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

// Single-day mode: fast-moving bodies (ASC/MC/Moon) get full weight
const PLANET_WEIGHT: Record<string, number> = {
  Ascendant: 1, MC: 1, Moon: 1,
  Sun: 0.5, Mercury: 0.5, Venus: 0.5, Mars: 0.5,
  Jupiter: 0.5, Saturn: 0.5, Uranus: 0.5, Neptune: 0.5, Pluto: 0.5,
  Chiron: 0.5, NorthNode: 0.5, SouthNode: 0.5,
};

// Date range mode: Sun is best date-finder (~1°/day), Moon helps narrow day
// ASC/MC excluded (change hourly, not in ephemeris)
const DATE_SCAN_WEIGHT: Record<string, number> = {
  Sun: 2, Moon: 1.5,
  Mercury: 1, Venus: 1, Mars: 1,
  Jupiter: 0.5, Saturn: 0.5,
  Uranus: 0.3, Neptune: 0.3, Pluto: 0.3,
  Chiron: 0.3, NorthNode: 0.5, SouthNode: 0.5,
};

const MAX_EPHEMERIS_ENTRIES = 2000;

// Approximate orbital periods in years — used to determine scan step for each planet
const ORBITAL_PERIOD_YEARS: Record<string, number> = {
  Pluto: 248, Neptune: 165, Uranus: 84, Chiron: 50.7,
  Saturn: 29.5, Jupiter: 11.9, NorthNode: 18.6, SouthNode: 18.6,
  Mars: 1.88, Sun: 1, Venus: 0.62, Mercury: 0.24, Moon: 0.075,
};

// Planets ordered from slowest to fastest (best for constraint narrowing)
const PLANETS_BY_SPEED = [
  'Pluto', 'Neptune', 'Uranus', 'Chiron', 'Saturn', 'NorthNode', 'SouthNode',
  'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon',
];

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
  date?: string;  // populated in range mode
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
  return `${deg}°${String(min).padStart(2, '0')}\u2032 ${sign}`;
}

// ─── SessionStorage persistence ─────────────────────────────────

const TF_STORAGE_KEY = 'astrologer_timefinder';

interface TimeFinderPersisted {
  targets: TargetPosition[];
  date: string;
  startDate: string;
  endDate: string;
  location: string;
  lat: number | null;
  lng: number | null;
  results: Omit<CandidateResult, 'chartData'>[];
  showMinutes: boolean;
  manualEntry: boolean;
}

function loadTimeFinderState(): Partial<TimeFinderPersisted> {
  try {
    const raw = sessionStorage.getItem(TF_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveTimeFinderState(state: TimeFinderPersisted) {
  try {
    sessionStorage.setItem(TF_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function padTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Unwrap longitudes so they don't jump across 360/0 boundary
function unwrapLongitudes(values: number[]): number[] {
  if (values.length === 0) return [];
  const result = [values[0]];
  for (let i = 1; i < values.length; i++) {
    let diff = values[i] - values[i - 1];
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    result.push(result[i - 1] + diff);
  }
  return result;
}

// Linear interpolation: given 3 anchor times (in minutes from midnight) and their longitudes,
// estimate the time when longitude = targetLon. Returns minutes from midnight or null.
function estimateTimeFromAnchors(
  anchorMinutes: number[],
  anchorLons: number[],
  targetLon: number,
): number | null {
  const unwrapped = unwrapLongitudes(anchorLons);
  // Also unwrap target relative to first anchor
  let tgt = targetLon;
  const diff0 = tgt - anchorLons[0];
  if (diff0 > 180) tgt -= 360;
  if (diff0 < -180) tgt += 360;
  // Adjust target into the unwrapped frame
  tgt = unwrapped[0] + (tgt - anchorLons[0]);
  let adjDiff = tgt - anchorLons[0];
  if (adjDiff > 180) adjDiff -= 360;
  if (adjDiff < -180) adjDiff += 360;
  tgt = unwrapped[0] + adjDiff;

  // Check each segment for crossing
  for (let i = 0; i < unwrapped.length - 1; i++) {
    const lo = Math.min(unwrapped[i], unwrapped[i + 1]);
    const hi = Math.max(unwrapped[i], unwrapped[i + 1]);
    if (tgt >= lo - 0.01 && tgt <= hi + 0.01) {
      const range = unwrapped[i + 1] - unwrapped[i];
      if (Math.abs(range) < 0.001) continue;
      const frac = (tgt - unwrapped[i]) / range;
      return anchorMinutes[i] + frac * (anchorMinutes[i + 1] - anchorMinutes[i]);
    }
  }

  // Extrapolate from endpoints using average rate
  const totalRange = unwrapped[unwrapped.length - 1] - unwrapped[0];
  const totalTime = anchorMinutes[anchorMinutes.length - 1] - anchorMinutes[0];
  if (Math.abs(totalRange) < 0.001) return null;
  const rate = totalTime / totalRange; // minutes per degree
  const est = anchorMinutes[0] + (tgt - unwrapped[0]) * rate;
  if (est >= 0 && est < 1440) return est;
  return null;
}

// Determine the search window center and radius based on which planets are targeted
// Returns { centerMinutes, windowMinutes } or null if no estimation possible
function getSearchWindow(
  targets: TargetPosition[],
  anchorMinutes: number[],
  anchorCharts: any[],
): { centerMinutes: number; windowMinutes: number } | null {
  const FAST_MOVERS = ['Ascendant', 'MC'];
  const MOON = 'Moon';

  // Try Ascendant/MC first (most time-sensitive ~15°/hr)
  for (const planet of FAST_MOVERS) {
    const target = targets.find(t => t.planet === planet);
    if (!target) continue;
    const targetLon = toAbsoluteLongitude(ZODIAC_SIGNS.indexOf(target.sign as any), target.degree, target.minute);
    const lons = anchorCharts.map(chart => {
      if (planet === 'Ascendant' && chart.houses) return chart.houses.ascendant as number;
      if (planet === 'MC' && chart.houses) return chart.houses.mc as number;
      return null;
    });
    if (lons.some(l => l === null)) continue;
    // Ascendant/MC rotate 360°/day — 3-point interpolation is unreliable (can pick wrong crossing)
    // Scan full day; the date is already pinned by slow planets so this only runs on ~5 dates
    return { centerMinutes: 720, windowMinutes: 720 };
  }

  // Try Moon (~0.5°/hr)
  const moonTarget = targets.find(t => t.planet === MOON);
  if (moonTarget) {
    const targetLon = toAbsoluteLongitude(ZODIAC_SIGNS.indexOf(moonTarget.sign as any), moonTarget.degree, moonTarget.minute);
    const lons = anchorCharts.map(chart => {
      const moon = (chart.planets || []).find((p: any) => p.planet === 'Moon');
      return moon ? moon.longitude as number : null;
    });
    if (!lons.some(l => l === null)) {
      const est = estimateTimeFromAnchors(anchorMinutes, lons as number[], targetLon);
      if (est !== null) return { centerMinutes: Math.round(est), windowMinutes: 120 };
    }
  }

  // Slow planets only — score anchors, pick best, ±4hr window
  return null;
}

function splitDateRange(start: string, end: string, maxDays: number): { start: string; end: string }[] {
  const chunks: { start: string; end: string }[] = [];
  let cur = new Date(start + 'T00:00:00');
  const endD = new Date(end + 'T00:00:00');
  while (cur <= endD) {
    const chunkEnd = new Date(cur);
    chunkEnd.setDate(chunkEnd.getDate() + maxDays - 1);
    if (chunkEnd > endD) chunkEnd.setTime(endD.getTime());
    chunks.push({
      start: cur.toISOString().slice(0, 10),
      end: chunkEnd.toISOString().slice(0, 10),
    });
    cur = new Date(chunkEnd);
    cur.setDate(cur.getDate() + 1);
  }
  return chunks;
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.round(ms / 86400000) + 1;
}

// Score an ephemeris entry against targets (excludes ASC/MC)
function scoreDateEntry(
  planets: any[],
  targetsList: TargetPosition[],
): { score: number; details: CandidateResult['positions'] } {
  let score = 0;
  const details: CandidateResult['positions'] = [];

  for (const target of targetsList) {
    // Skip ASC/MC — not available in ephemeris data
    if (target.planet === 'Ascendant' || target.planet === 'MC') continue;

    const weight = DATE_SCAN_WEIGHT[target.planet] ?? 0.5;
    const targetLon = toAbsoluteLongitude(ZODIAC_SIGNS.indexOf(target.sign as any), target.degree, target.minute);

    let pos: { sign: string; degree: number; minute: number; longitude: number } | undefined;

    if (target.planet === 'SouthNode') {
      const nn = planets.find(p => p.planet === 'NorthNode');
      if (nn) {
        const snLon = (nn.longitude + 180) % 360;
        const signIdx = Math.floor(snLon / 30);
        pos = { sign: ZODIAC_SIGNS[signIdx], degree: Math.floor(snLon % 30), minute: Math.round((snLon % 1) * 60), longitude: snLon };
      }
    } else {
      const found = planets.find(p => p.planet === target.planet);
      if (found) {
        pos = { sign: found.sign, degree: found.degree, minute: found.minute ?? 0, longitude: found.longitude };
      }
    }

    if (!pos) continue;
    const diff = angularDistance(pos.longitude, targetLon);
    score += diff * weight;
    details.push({ planet: target.planet, sign: pos.sign, degree: pos.degree, minute: pos.minute, longitude: pos.longitude, diff });
  }

  return { score, details };
}

// Find date windows where a planet is within `tolerance` degrees of a target longitude.
// Uses monthly ephemeris to find approximate windows, returns ±30 day windows.
async function findPlanetWindows(
  planet: string,
  targetLon: number,
  startDate: string,
  endDate: string,
  lat: number,
  lng: number,
  tolerance: number,
  abortRef: { current: boolean },
): Promise<{ start: string; end: string }[]> {
  // Monthly scan across entire range
  const chunks = splitDateRange(startDate, endDate, MAX_EPHEMERIS_ENTRIES * 30);
  const matchingDates: string[] = [];

  for (const chunk of chunks) {
    if (abortRef.current) return [];
    try {
      const data = await swissEphemeris.ephemeris({
        start_date: chunk.start,
        end_date: chunk.end,
        step: 'monthly',
        lat,
        lng,
      });
      const entries = (data as any).entries || [];
      for (const entry of entries) {
        let lon: number | null = null;
        if (planet === 'SouthNode') {
          const nn = (entry.planets || []).find((p: any) => p.planet === 'NorthNode');
          if (nn) lon = (nn.longitude + 180) % 360;
        } else {
          const found = (entry.planets || []).find((p: any) => p.planet === planet);
          if (found) lon = found.longitude;
        }
        if (lon !== null && angularDistance(lon, targetLon) <= tolerance) {
          matchingDates.push(entry.date);
        }
      }
    } catch { /* skip chunk */ }
  }

  if (matchingDates.length === 0) return [];

  // Merge consecutive matches into windows (±30 days padding)
  const windows: { start: string; end: string }[] = [];
  let windowStart = matchingDates[0];
  let windowEnd = matchingDates[0];

  for (let i = 1; i < matchingDates.length; i++) {
    const prevDate = new Date(windowEnd + 'T00:00:00');
    const curDate = new Date(matchingDates[i] + 'T00:00:00');
    const gap = (curDate.getTime() - prevDate.getTime()) / 86400000;
    if (gap <= 60) { // same window (within 2 months)
      windowEnd = matchingDates[i];
    } else {
      windows.push({ start: windowStart, end: windowEnd });
      windowStart = matchingDates[i];
      windowEnd = matchingDates[i];
    }
  }
  windows.push({ start: windowStart, end: windowEnd });

  // Pad each window ±30 days and clamp to user range
  const rangeStart = new Date(startDate + 'T00:00:00');
  const rangeEnd = new Date(endDate + 'T00:00:00');
  return windows.map(w => {
    const s = new Date(w.start + 'T00:00:00');
    s.setDate(s.getDate() - 30);
    const e = new Date(w.end + 'T00:00:00');
    e.setDate(e.getDate() + 30);
    if (s < rangeStart) s.setTime(rangeStart.getTime());
    if (e > rangeEnd) e.setTime(rangeEnd.getTime());
    return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) };
  });
}

// Intersect two sets of date windows
function intersectWindows(
  a: { start: string; end: string }[],
  b: { start: string; end: string }[],
): { start: string; end: string }[] {
  const result: { start: string; end: string }[] = [];
  for (const wa of a) {
    for (const wb of b) {
      const start = wa.start > wb.start ? wa.start : wb.start;
      const end = wa.end < wb.end ? wa.end : wb.end;
      if (start <= end) result.push({ start, end });
    }
  }
  return result;
}

// Core smart single-day scan: returns top 5 candidates for a given date
async function smartSingleDayScan(
  scanDate: string,
  lat: number,
  lng: number,
  targets: TargetPosition[],
  extractPositionsFn: (chartData: any, planets: string[]) => Map<string, { sign: string; degree: number; minute: number; longitude: number }>,
  scoreCandidateFn: (positions: Map<string, { sign: string; degree: number; minute: number; longitude: number }>) => { score: number; details: CandidateResult['positions'] },
  abortRef: { current: boolean },
  onProgress?: (fraction: number, message: string) => void,
): Promise<CandidateResult[]> {
  const targetPlanets = targets.map(t => t.planet);

  // Phase 1: Anchor sampling (3 calls at 04:00, 12:00, 20:00)
  onProgress?.(0.05, 'Phase 1: Sampling anchor points...');
  const anchorMinutes = [240, 720, 1200]; // 04:00, 12:00, 20:00
  const anchorCharts: any[] = [];

  for (const mins of anchorMinutes) {
    if (abortRef.current) return [];
    const time = padTime(Math.floor(mins / 60), mins % 60);
    try {
      const chart = await swissEphemeris.natal({ birth_date: scanDate, birth_time: time, lat, lng });
      anchorCharts.push(chart);
    } catch {
      anchorCharts.push(null);
    }
  }

  if (abortRef.current) return [];

  // Phase 2: Mathematical estimation (0 API calls)
  onProgress?.(0.15, 'Phase 2: Estimating from planet motion...');
  const window = getSearchWindow(targets, anchorMinutes, anchorCharts.filter(Boolean));

  let searchCenter: number;
  let searchRadius: number;

  if (window) {
    searchCenter = Math.max(0, Math.min(1439, window.centerMinutes));
    searchRadius = window.windowMinutes;
  } else {
    // Slow planets only: score all 3 anchors, pick best, ±4hr window
    let bestIdx = 0;
    let bestScore = Infinity;
    for (let i = 0; i < anchorCharts.length; i++) {
      if (!anchorCharts[i]) continue;
      const positions = extractPositionsFn(anchorCharts[i], targetPlanets);
      const { score } = scoreCandidateFn(positions);
      if (score < bestScore) { bestScore = score; bestIdx = i; }
    }
    searchCenter = anchorMinutes[bestIdx];
    searchRadius = 240; // ±4 hours
  }

  // Phase 3: Coarse search within window (adaptive step: 10-min for full day, 5-min for smaller windows)
  const startMin = Math.max(0, searchCenter - searchRadius);
  const endMin = Math.min(1439, searchCenter + searchRadius);
  const stepSize = (endMin - startMin) > 600 ? 10 : 5;
  const coarseTimes: number[] = [];
  for (let m = startMin; m <= endMin; m += stepSize) {
    coarseTimes.push(m);
  }

  onProgress?.(0.20, `Phase 3: Searching ${coarseTimes.length} candidates (${stepSize}-min intervals)...`);
  const allCandidates: { time: string; score: number; details: CandidateResult['positions']; chartData: any }[] = [];

  // Also score the anchor charts we already have
  for (let i = 0; i < anchorCharts.length; i++) {
    if (!anchorCharts[i]) continue;
    const positions = extractPositionsFn(anchorCharts[i], targetPlanets);
    const { score, details } = scoreCandidateFn(positions);
    const time = padTime(Math.floor(anchorMinutes[i] / 60), anchorMinutes[i] % 60);
    allCandidates.push({ time, score, details, chartData: anchorCharts[i] });
  }

  for (let i = 0; i < coarseTimes.length; i++) {
    if (abortRef.current) return [];
    const mins = coarseTimes[i];
    const time = padTime(Math.floor(mins / 60), mins % 60);
    // Skip if already computed as anchor
    if (anchorMinutes.includes(mins)) continue;
    try {
      const chartData = await swissEphemeris.natal({ birth_date: scanDate, birth_time: time, lat, lng });
      const positions = extractPositionsFn(chartData, targetPlanets);
      const { score, details } = scoreCandidateFn(positions);
      allCandidates.push({ time, score, details, chartData });
    } catch { /* skip */ }
    onProgress?.(0.20 + ((i + 1) / coarseTimes.length) * 0.55, `Phase 3: Searching ${coarseTimes.length} candidates...`);
  }

  if (abortRef.current) return [];

  // Phase 4: Fine refinement — top 3 at ±5 min with 1-min resolution
  onProgress?.(0.80, 'Phase 4: Fine-tuning top candidates...');
  allCandidates.sort((a, b) => a.score - b.score);
  const top3 = allCandidates.slice(0, 3);
  const refineTimes = new Set<string>();

  for (const candidate of top3) {
    const [ch, cm] = candidate.time.split(':').map(Number);
    const baseMins = ch * 60 + cm;
    for (let offset = -5; offset <= 5; offset++) {
      const mins = baseMins + offset;
      if (mins < 0 || mins >= 1440) continue;
      refineTimes.add(padTime(Math.floor(mins / 60), mins % 60));
    }
  }

  // Remove already-computed times
  const existingTimes = new Set(allCandidates.map(c => c.time));
  const newRefineTimes = Array.from(refineTimes).filter(t => !existingTimes.has(t));

  for (let i = 0; i < newRefineTimes.length; i++) {
    if (abortRef.current) return [];
    const time = newRefineTimes[i];
    try {
      const chartData = await swissEphemeris.natal({ birth_date: scanDate, birth_time: time, lat, lng });
      const positions = extractPositionsFn(chartData, targetPlanets);
      const { score, details } = scoreCandidateFn(positions);
      allCandidates.push({ time, score, details, chartData });
    } catch { /* skip */ }
    onProgress?.(0.80 + ((i + 1) / Math.max(newRefineTimes.length, 1)) * 0.15, 'Phase 4: Fine-tuning...');
  }

  // Deduplicate and return top 5
  const allMap = new Map<string, typeof allCandidates[0]>();
  for (const c of allCandidates) {
    const existing = allMap.get(c.time);
    if (!existing || c.score < existing.score) allMap.set(c.time, c);
  }

  onProgress?.(1.0, '');
  return Array.from(allMap.values())
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map(c => ({ time: c.time, score: c.score, positions: c.details, chartData: c.chartData }));
}

// ─── Component ──────────────────────────────────────────────────────

export function TimeFinder({ onUseTime }: TimeFinderProps) {
  // Load persisted state once
  const [persisted] = useState(() => loadTimeFinderState());

  // Form state (initialized from sessionStorage)
  const [date, setDate] = useState(() => persisted.date ?? '');
  const [startDate, setStartDate] = useState(() => persisted.startDate ?? '1950-01-01');
  const [endDate, setEndDate] = useState(() => persisted.endDate ?? '2026-12-31');
  const [location, setLocation] = useState(() => persisted.location ?? '');
  const [lat, setLat] = useState<number | null>(() => persisted.lat ?? null);
  const [lng, setLng] = useState<number | null>(() => persisted.lng ?? null);
  const [targets, setTargets] = useState<TargetPosition[]>(() =>
    persisted.targets?.length
      ? persisted.targets
      : [{ id: crypto.randomUUID(), planet: 'Ascendant', degree: 0, minute: 0, sign: 'Aries' }],
  );
  const [manualEntry, setManualEntry] = useState(() => persisted.manualEntry ?? false);

  // Location search
  const [locationResults, setLocationResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const locationAbortRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chart image state
  const [chartImage, setChartImage] = useState<string | null>(null);
  const [chartImageName, setChartImageName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [results, setResults] = useState<CandidateResult[]>(() =>
    (persisted.results as CandidateResult[]) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [showMinutes, setShowMinutes] = useState(() => persisted.showMinutes ?? false);
  const [autoApplied, setAutoApplied] = useState(false);
  const abortRef = useRef(false);
  const autoScanRef = useRef(false);

  // Derived: has user entered any real target data?
  const hasTargetData = useMemo(
    () => targets.some(t => t.degree !== 0 || t.minute !== 0),
    [targets],
  );
  // Show config sections when user has image, manual entry, or restored data
  const showConfig = chartImage !== null || manualEntry || hasTargetData || results.length > 0;

  // Unused planets for quick-add pills
  const unusedPlanets = useMemo(() => {
    const used = new Set(targets.map(t => t.planet));
    return PLANET_OPTIONS.filter(p => !used.has(p));
  }, [targets]);

  // ─── Persist to sessionStorage (debounced) ──────────────────────
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimeFinderState({
        targets,
        date,
        startDate,
        endDate,
        location,
        lat,
        lng,
        results: results.map(({ chartData: _, ...rest }) => rest),
        showMinutes,
        manualEntry,
      });
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [targets, date, startDate, endDate, location, lat, lng, results, showMinutes, manualEntry]);

  // Auto-start scan after chart image extraction
  useEffect(() => {
    if (autoScanRef.current && !scanning && !analyzing && targets.length > 0 && lat !== null) {
      autoScanRef.current = false;
      // Use range mode since no exact date is known from image
      if (startDate && endDate && !date) {
        runDateRangeScan();
      } else if (date) {
        runScan();
      }
    }
  });

  // Auto-apply when exact match found (score < 0.5°)
  const prevResultsLenRef = useRef(0);
  useEffect(() => {
    if (results.length > 0 && prevResultsLenRef.current === 0 && !scanning) {
      const best = results[0];
      if (best.score < 0.5 && onUseTime && lat !== null && lng !== null) {
        setAutoApplied(true);
        onUseTime({ date: best.date || date, time: best.time, location, lat, lng });
        toast.success('Exact match found — auto-applied');
      }
    }
    prevResultsLenRef.current = results.length;
  }, [results, scanning]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── Chart image handlers ──────────────────────────────────────

  const resizeImage = (file: File, maxDim: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageFile = async (file: File) => {
    setAnalyzeError(null);
    if (!file.type.startsWith('image/')) {
      setAnalyzeError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAnalyzeError('Image too large (max 10MB)');
      return;
    }
    setChartImageName(file.name);
    setAnalyzing(true);
    try {
      // Resize to max 1024px and compress — keeps payload under Supabase 6MB body limit
      const base64 = await resizeImage(file, 1024);
      setChartImage(base64);
      await analyzeChartImageDirect(base64);
    } catch (err: any) {
      setAnalyzeError(err.message || 'Failed to process image');
      setAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const analyzeChartImageDirect = async (base64: string) => {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in to analyze charts');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      const res = await fetch(`${supabaseUrl}/functions/v1/astrologer-chart-vision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ image_base64: base64 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Analysis failed (${res.status})`);
      }

      if (data?.positions && Array.isArray(data.positions) && data.positions.length > 0) {
        const newTargets: TargetPosition[] = data.positions.map((p: any) => ({
          id: crypto.randomUUID(),
          planet: p.planet,
          degree: p.degree,
          minute: p.minute,
          sign: p.sign,
        }));
        setTargets(newTargets);

        // Auto-set default location if none selected (planet longitudes don't depend on location)
        if (lat === null) {
          setLocation('Greenwich, United Kingdom');
          setLat(51.4772);
          setLng(0.0);
        }

        // Auto-start scan after a tick so state settles
        setTimeout(() => {
          autoScanRef.current = true;
        }, 100);
      } else {
        throw new Error('No positions detected in the image');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setAnalyzeError('Analysis timed out — try a smaller or clearer image');
      } else {
        setAnalyzeError(err.message || 'Failed to analyze chart image');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const clearChartImage = () => {
    setChartImage(null);
    setChartImageName('');
    setAnalyzeError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Target positions CRUD ──────────────────────────────────────

  const addTarget = () => {
    const used = new Set(targets.map(t => t.planet));
    const next = PLANET_OPTIONS.find(p => !used.has(p)) || 'Sun';
    setTargets(prev => [...prev, { id: crypto.randomUUID(), planet: next, degree: 0, minute: 0, sign: 'Aries' }]);
  };

  const addTargetPlanet = (planet: string) => {
    setTargets(prev => [...prev, { id: crypto.randomUUID(), planet, degree: 0, minute: 0, sign: 'Aries' }]);
  };

  const removeTarget = (id: string) => {
    if (targets.length <= 1) return;
    setTargets(prev => prev.filter(t => t.id !== id));
  };

  const updateTarget = (id: string, field: keyof TargetPosition, value: any) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // ─── Scanning logic ─────────────────────────────────────────────

  const isRangeMode = !date && startDate && endDate;
  const isSingleMode = !!date;
  const canScan = lat !== null && lng !== null && targets.length > 0 && (isSingleMode || isRangeMode);

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


  // ─── Date range scan (hierarchical: monthly → daily → time) ─────

  const runDateRangeScan = async () => {
    if (!canScan || !isRangeMode) return;
    setScanning(true);
    setProgress(0);
    setResults([]);
    setError(null);
    abortRef.current = false;

    try {
      const totalDays = daysBetween(startDate, endDate);
      type DateCandidate = { date: string; score: number; details: CandidateResult['positions'] };

      // Decide strategy based on range size
      const useHierarchical = totalDays > 365; // >1 year → monthly first

      let topDates: DateCandidate[] = [];

      if (useHierarchical) {
        // ── Phase 1: Constraint narrowing with slowest planets ──────
        // Find the slowest targeted planet (excl. ASC/MC) and use it to eliminate
        // most of the timeline. E.g. Saturn at 24° Pisces → only 2-3 windows in 70 years.
        // Only use planets with orbital period > 2 years for constraint narrowing
        // Sun, Moon, Mercury, Venus, Mars cycle too fast for monthly sampling
        const slowTargets = targets
          .filter(t => {
            const period = ORBITAL_PERIOD_YEARS[t.planet] ?? 0;
            return period > 2 && t.planet !== 'Ascendant' && t.planet !== 'MC';
          })
          .sort((a, b) => (ORBITAL_PERIOD_YEARS[b.planet] ?? 1) - (ORBITAL_PERIOD_YEARS[a.planet] ?? 1));

        // Start with the full range
        let windows: { start: string; end: string }[] = [{ start: startDate, end: endDate }];

        // Progressively narrow using up to 3 slowest planets
        const constraintPlanets = slowTargets.slice(0, 3);
        for (let ci = 0; ci < constraintPlanets.length; ci++) {
          if (abortRef.current) break;
          const target = constraintPlanets[ci];
          const targetLon = toAbsoluteLongitude(ZODIAC_SIGNS.indexOf(target.sign as any), target.degree, target.minute);
          // Tolerance: wider for slower planets (they change ~1° per orbit_period/360 days)
          const orbitalYears = ORBITAL_PERIOD_YEARS[target.planet] ?? 1;
          const tolerance = Math.min(20, Math.max(5, orbitalYears * 0.5)); // 5-20° tolerance (generous for monthly sampling)

          setProgressMessage(`Phase 1: Finding ${target.planet} at ${target.degree}° ${target.sign} (${ci + 1}/${constraintPlanets.length})...`);

          const newWindows: { start: string; end: string }[] = [];
          for (const window of windows) {
            if (abortRef.current) break;
            const found = await findPlanetWindows(
              target.planet, targetLon, window.start, window.end,
              lat!, lng!, tolerance, abortRef,
            );
            newWindows.push(...found);
          }

          if (newWindows.length === 0) {
            setError(`${PLANET_LABELS[target.planet]} never reaches ${target.degree}° ${target.sign} in this date range`);
            setScanning(false);
            return;
          }

          windows = newWindows;
          const totalWindowDays = windows.reduce((sum, w) => sum + daysBetween(w.start, w.end), 0);
          setProgress(Math.round(((ci + 1) / constraintPlanets.length) * 15));
          console.log(`[TimeFinder] After ${target.planet} constraint: ${windows.length} windows, ${totalWindowDays} total days`);
        }

        if (abortRef.current) { setScanning(false); return; }

        // ── Phase 2: Daily scan within narrowed windows ─────────────
        const totalWindowDays = windows.reduce((sum, w) => sum + daysBetween(w.start, w.end), 0);
        setProgressMessage(`Phase 2: Daily scan of ${totalWindowDays} days across ${windows.length} windows...`);

        for (let wi = 0; wi < windows.length; wi++) {
          if (abortRef.current) break;
          const chunks = splitDateRange(windows[wi].start, windows[wi].end, MAX_EPHEMERIS_ENTRIES);

          for (const chunk of chunks) {
            if (abortRef.current) break;
            try {
              const data = await swissEphemeris.ephemeris({
                start_date: chunk.start,
                end_date: chunk.end,
                step: 'daily',
                lat: lat!,
                lng: lng!,
              });
              const entries = (data as any).entries || [];
              for (const entry of entries) {
                const { score, details } = scoreDateEntry(entry.planets || [], targets);
                topDates.push({ date: entry.date, score, details });
              }
            } catch (err: any) {
              console.warn('Daily ephemeris failed:', err.message);
            }
          }
          setProgress(15 + Math.round(((wi + 1) / windows.length) * 10));
        }

        // Deduplicate and take top 5
        const dateMap = new Map<string, DateCandidate>();
        for (const c of topDates) {
          const existing = dateMap.get(c.date);
          if (!existing || c.score < existing.score) dateMap.set(c.date, c);
        }
        topDates = Array.from(dateMap.values()).sort((a, b) => a.score - b.score).slice(0, 5);

      } else {
        // ── Small range (≤1 year): direct daily scan ────────────────
        const chunks = splitDateRange(startDate, endDate, MAX_EPHEMERIS_ENTRIES);
        setProgressMessage(`Phase 1: Scanning ${totalDays} days...`);

        const allDateCandidates: DateCandidate[] = [];

        for (let ci = 0; ci < chunks.length; ci++) {
          if (abortRef.current) break;
          try {
            const data = await swissEphemeris.ephemeris({
              start_date: chunks[ci].start,
              end_date: chunks[ci].end,
              step: 'daily',
              lat: lat!,
              lng: lng!,
            });
            const entries = (data as any).entries || [];
            for (const entry of entries) {
              const { score, details } = scoreDateEntry(entry.planets || [], targets);
              allDateCandidates.push({ date: entry.date, score, details });
            }
          } catch (err: any) {
            console.warn('Ephemeris chunk failed:', err.message);
          }
          setProgress(Math.round(((ci + 1) / chunks.length) * 25));
        }

        allDateCandidates.sort((a, b) => a.score - b.score);
        topDates = allDateCandidates.slice(0, 5);
      }

      if (abortRef.current) { setScanning(false); return; }

      if (topDates.length === 0) {
        setError('No matching dates found in the given range');
        setScanning(false);
        return;
      }

      // ── Phase 3: Smart time refinement for each top date ──────────
      setProgressMessage(`Phase 3: Finding exact times for top ${topDates.length} dates...`);
      const finalResults: CandidateResult[] = [];

      for (let di = 0; di < topDates.length; di++) {
        if (abortRef.current) break;
        const scanDate = topDates[di].date;

        const dateCandidates = await smartSingleDayScan(
          scanDate, lat!, lng!, targets,
          extractPositions, scoreCandidate, abortRef,
          (fraction, message) => {
            const overallProgress = 30 + ((di + fraction) / topDates.length) * 65;
            setProgress(Math.round(overallProgress));
            if (message) setProgressMessage(`${scanDate} (${di + 1}/${topDates.length}): ${message}`);
          },
        );

        if (dateCandidates.length > 0) {
          const best = dateCandidates[0];
          finalResults.push({ date: scanDate, time: best.time, score: best.score, positions: best.positions, chartData: best.chartData });
        }
      }

      if (abortRef.current) { setScanning(false); return; }

      finalResults.sort((a, b) => a.score - b.score);
      setResults(finalResults.slice(0, 5));
      setProgressMessage('');
    } catch (err: any) {
      setError(err.message || 'Date range scan failed');
    } finally {
      setScanning(false);
      setProgress(100);
    }
  };

  // ─── Single-day scan (smart algorithm) ──────────────────────────

  const runScan = async () => {
    if (!canScan) return;
    setScanning(true);
    setProgress(0);
    setResults([]);
    setError(null);
    abortRef.current = false;

    try {
      const results = await smartSingleDayScan(
        date, lat!, lng!, targets,
        extractPositions, scoreCandidate, abortRef,
        (fraction, message) => {
          setProgress(Math.round(fraction * 100));
          if (message) setProgressMessage(message);
        },
      );

      if (!abortRef.current) {
        setResults(results);
        setProgressMessage('');
      }
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
          Find the birth date & time from planet positions
        </p>
      </div>

      {/* ─── Entry Point: Drop Zone + "or Enter Manually" ─── */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
        />
        {!chartImage ? (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                showConfig ? 'p-3' : 'p-8'
              } ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <Upload className={`mx-auto mb-2 text-muted-foreground ${showConfig ? 'w-4 h-4' : 'w-8 h-8'}`} />
              <p className={`text-muted-foreground ${showConfig ? 'text-xs' : 'text-sm'}`}>
                {showConfig
                  ? <>Drop chart image or <span className="text-primary underline">browse</span></>
                  : <>Drop a birth chart image — AI extracts positions automatically</>}
              </p>
              {!showConfig && (
                <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 10MB</p>
              )}
            </div>
            {!showConfig && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setManualEntry(true)}
                >
                  <Edit3 className="w-4 h-4" />
                  Enter positions manually
                </Button>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border bg-card/50 p-3">
            <img
              src={chartImage}
              alt="Chart"
              className="w-16 h-16 rounded object-cover border"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{chartImageName}</p>
              {analyzing && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Extracting positions...
                </p>
              )}
              {analyzeError && (
                <p className="text-xs text-destructive mt-0.5">{analyzeError}</p>
              )}
              {!analyzing && !analyzeError && (
                <p className="text-xs text-green-500 mt-0.5 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Positions extracted
                </p>
              )}
            </div>
            <button
              onClick={clearChartImage}
              disabled={analyzing}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 disabled:opacity-30"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Config Sections (shown after upload or manual entry) ─── */}
      {showConfig && (
        <>
          {/* Target Positions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Target Positions</label>
              <button
                onClick={() => setShowMinutes(prev => !prev)}
                className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                {showMinutes ? 'Hide arc-minutes' : 'Show arc-minutes'}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground/60 mb-2">Each row is a planet's position from the chart.</p>
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

                  {/* Minute (optional) */}
                  {showMinutes && (
                    <>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={target.minute}
                        onChange={e => updateTarget(target.id, 'minute', Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className={`${inputClass} w-[60px] text-center tabular-nums`}
                        placeholder="\u2032"
                      />
                      <span className="text-xs text-muted-foreground">{'\u2032'}</span>
                    </>
                  )}

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

            {/* Quick-add planet pills */}
            {unusedPlanets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {unusedPlanets.map(planet => (
                  <button
                    key={planet}
                    onClick={() => addTargetPlanet(planet)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/30 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    {PLANET_LABELS[planet]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Exact Date (if known)</label>
              <p className="text-[11px] text-muted-foreground/60 mb-1.5">Enter the exact date, or a range to search across.</p>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  disabled={!!date}
                  className={`${inputClass} ${date ? 'opacity-40' : ''}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">End</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  disabled={!!date}
                  className={`${inputClass} ${date ? 'opacity-40' : ''}`}
                />
              </div>
            </div>
            <div className="relative">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
              <p className="text-[11px] text-muted-foreground/60 mb-1.5">Birth location is needed for Ascendant and house cusps.</p>
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

          {/* Scan button */}
          <div className="flex items-center gap-3">
            <Button onClick={isRangeMode ? runDateRangeScan : runScan} disabled={!canScan || scanning} className="gap-2">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {scanning ? 'Scanning...' : isRangeMode ? 'Find Birth Date & Time' : 'Find Time'}
            </Button>
            {scanning && (
              <Button variant="outline" size="sm" onClick={cancelScan}>Cancel</Button>
            )}
            {isRangeMode && !scanning && (
              <span className="text-xs text-muted-foreground">
                {daysBetween(startDate, endDate)} days to scan
              </span>
            )}
          </div>
        </>
      )}

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
              key={`${result.date || ''}-${result.time}`}
              className={`rounded-lg border p-4 ${idx === 0 ? 'border-primary/40 bg-primary/5' : 'bg-card/50'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {result.date ? <Calendar className="w-4 h-4 text-muted-foreground" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-mono font-semibold text-base">
                    {result.date ? `${result.date} ${result.time}` : result.time}
                  </span>
                  {idx === 0 && autoApplied && (
                    <span className="text-xs font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">Auto-applied</span>
                  )}
                  {idx === 0 && !autoApplied && <span className="text-xs font-medium text-primary">Best Match</span>}
                  {idx > 0 && <span className="text-xs text-muted-foreground">#{idx + 1}</span>}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  score: {result.score.toFixed(1)}°
                </span>
              </div>

              {/* Planet details — grid with column headers */}
              <div className="overflow-x-auto">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 gap-y-0.5 text-xs min-w-[320px]">
                  {/* Column headers */}
                  <span className="text-[10px] font-medium text-muted-foreground/50 pb-1">Match</span>
                  <span className="text-[10px] font-medium text-muted-foreground/50 pb-1">Planet</span>
                  <span className="text-[10px] font-medium text-muted-foreground/50 pb-1">Position (°{'\u2032'})</span>
                  <span className="text-[10px] font-medium text-muted-foreground/50 pb-1">Diff</span>
                  {/* Rows */}
                  {result.positions.map(pos => (
                    <React.Fragment key={pos.planet}>
                      <span className="flex items-center">
                        {pos.diff < 1 ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : pos.diff < 3 ? (
                          <Check className="w-3 h-3 text-yellow-500" />
                        ) : (
                          <X className="w-3 h-3 text-red-400" />
                        )}
                      </span>
                      <span className="text-muted-foreground">{PLANET_LABELS[pos.planet]}</span>
                      <span className="font-mono tabular-nums">{formatDegree(pos.degree, pos.minute, pos.sign)}</span>
                      <span className="text-muted-foreground/50 tabular-nums">{'\u0394'}{pos.diff.toFixed(1)}°</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Use this time */}
              {onUseTime && (
                <Button
                  variant={idx === 0 ? 'default' : 'outline'}
                  size="sm"
                  className="mt-3 text-xs gap-1.5"
                  onClick={() => {
                    setAutoApplied(false);
                    onUseTime({ date: result.date || date, time: result.time, location, lat: lat!, lng: lng! });
                  }}
                >
                  <Clock className="w-3 h-3" />
                  {result.date ? 'Use This Date & Time' : 'Use This Time'}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
