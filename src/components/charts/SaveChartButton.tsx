import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Save, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'astrologer_saved_charts';
const FREE_CHART_LIMIT = 3;

interface PersonInfo {
  name: string;
  date: string;
  time: string;
  location: string;
  lat: number | null;
  lng: number | null;
  natalChart: any;
}

export interface SavedChart {
  id: string;
  name: string;
  chart_type: 'natal' | 'synastry';
  person_a_name: string;
  person_a_date: string;
  person_a_time: string;
  person_a_location: string;
  person_a_lat: number | null;
  person_a_lng: number | null;
  person_a_chart: any;
  person_b_name?: string | null;
  person_b_date?: string | null;
  person_b_time?: string | null;
  person_b_location?: string | null;
  person_b_lat?: number | null;
  person_b_lng?: number | null;
  person_b_chart?: any | null;
  created_at: string;
}

// ── Local storage helpers (fallback for logged-out users) ────────────

function getLocalCharts(): SavedChart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCharts(charts: SavedChart[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
}

// ── DB helpers ───────────────────────────────────────────────────────

async function getDbCharts(userId: string): Promise<SavedChart[]> {
  const { data, error } = await supabase
    .from('saved_charts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to fetch saved charts:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    chart_type: row.chart_type,
    person_a_name: row.person_a_name,
    person_a_date: row.person_a_date,
    person_a_time: row.person_a_time,
    person_a_location: row.person_a_location,
    person_a_lat: row.person_a_lat,
    person_a_lng: row.person_a_lng,
    person_a_chart: row.person_a_chart,
    person_b_name: row.person_b_name,
    person_b_date: row.person_b_date,
    person_b_time: row.person_b_time,
    person_b_location: row.person_b_location,
    person_b_lat: row.person_b_lat,
    person_b_lng: row.person_b_lng,
    person_b_chart: row.person_b_chart,
    created_at: row.created_at,
  }));
}

async function insertDbChart(userId: string, chart: SavedChart): Promise<SavedChart | null> {
  const { data, error } = await supabase
    .from('saved_charts')
    .insert({
      user_id: userId,
      name: chart.name,
      chart_type: chart.chart_type,
      person_a_name: chart.person_a_name,
      person_a_date: chart.person_a_date,
      person_a_time: chart.person_a_time,
      person_a_location: chart.person_a_location,
      person_a_lat: chart.person_a_lat,
      person_a_lng: chart.person_a_lng,
      person_a_chart: chart.person_a_chart,
      person_b_name: chart.person_b_name,
      person_b_date: chart.person_b_date,
      person_b_time: chart.person_b_time,
      person_b_location: chart.person_b_location,
      person_b_lat: chart.person_b_lat,
      person_b_lng: chart.person_b_lng,
      person_b_chart: chart.person_b_chart,
    })
    .select()
    .single();
  if (error) {
    console.error('Failed to save chart to DB:', error);
    return null;
  }
  return data ? { ...chart, id: data.id, created_at: data.created_at } : null;
}

async function updateDbChart(chartId: string, chart: Partial<SavedChart>): Promise<boolean> {
  const { error } = await supabase
    .from('saved_charts')
    .update({
      name: chart.name,
      chart_type: chart.chart_type,
      person_a_name: chart.person_a_name,
      person_a_date: chart.person_a_date,
      person_a_time: chart.person_a_time,
      person_a_location: chart.person_a_location,
      person_a_lat: chart.person_a_lat,
      person_a_lng: chart.person_a_lng,
      person_a_chart: chart.person_a_chart,
      person_b_name: chart.person_b_name,
      person_b_date: chart.person_b_date,
      person_b_time: chart.person_b_time,
      person_b_location: chart.person_b_location,
      person_b_lat: chart.person_b_lat,
      person_b_lng: chart.person_b_lng,
      person_b_chart: chart.person_b_chart,
    })
    .eq('id', chartId);
  if (error) {
    console.error('Failed to update chart in DB:', error);
    return false;
  }
  return true;
}

async function deleteDbChart(chartId: string): Promise<boolean> {
  const { error } = await supabase
    .from('saved_charts')
    .delete()
    .eq('id', chartId);
  if (error) {
    console.error('Failed to delete chart from DB:', error);
    return false;
  }
  return true;
}

// ── Unified API (DB for logged-in, localStorage for logged-out) ─────

/** In-memory cache of charts (avoids re-fetching on every render) */
let _chartsCache: SavedChart[] | null = null;
let _chartsCacheUserId: string | null = null;

export async function getSavedChartsAsync(userId?: string | null): Promise<SavedChart[]> {
  if (userId) {
    if (_chartsCacheUserId === userId && _chartsCache) return _chartsCache;
    const charts = await getDbCharts(userId);
    _chartsCache = charts;
    _chartsCacheUserId = userId;
    return charts;
  }
  return getLocalCharts();
}

/** Sync getter for components that can't use async (uses cache or localStorage) */
export function getSavedCharts(userId?: string | null): SavedChart[] {
  if (userId && _chartsCacheUserId === userId && _chartsCache) {
    return _chartsCache;
  }
  return getLocalCharts();
}

export async function deleteSavedChart(id: string, userId?: string | null): Promise<void> {
  if (userId) {
    await deleteDbChart(id);
    // Update cache
    if (_chartsCache) {
      _chartsCache = _chartsCache.filter((c) => c.id !== id);
    }
  } else {
    const charts = getLocalCharts().filter((c) => c.id !== id);
    setLocalCharts(charts);
  }
}

/** Invalidate cache so next getSavedChartsAsync fetches fresh from DB */
export function invalidateChartsCache() {
  _chartsCache = null;
  _chartsCacheUserId = null;
}

// ── Duplicate / name helpers ─────────────────────────────────────────

function findExactDuplicateIn(charts: SavedChart[], personA: PersonInfo, personB?: PersonInfo | null): SavedChart | null {
  return charts.find((c) => {
    const matchA = c.person_a_date === personA.date
      && c.person_a_time === personA.time
      && c.person_a_lat === personA.lat
      && c.person_a_lng === personA.lng;
    if (!matchA) return false;
    if (personB) {
      return c.person_b_date === personB.date
        && c.person_b_time === personB.time
        && c.person_b_lat === personB.lat
        && c.person_b_lng === personB.lng;
    }
    return !c.person_b_date;
  }) || null;
}

function findByNameIn(charts: SavedChart[], name: string): SavedChart[] {
  const lower = name.toLowerCase().trim();
  return charts.filter((c) => c.name.toLowerCase().trim() === lower);
}

// ── Component ────────────────────────────────────────────────────────

interface SaveChartButtonProps {
  personA: PersonInfo;
  personB?: PersonInfo | null;
  hasSynastry?: boolean;
}

export function SaveChartButton({ personA, personB, hasSynastry }: SaveChartButtonProps) {
  const [showNameInput, setShowNameInput] = useState(false);
  const [chartName, setChartName] = useState('');
  const [saved, setSaved] = useState(false);
  const [nameConflict, setNameConflict] = useState<SavedChart | null>(null);
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [saving, setSaving] = useState(false);
  const { isPaid } = useSubscription();
  const { user } = useAuth();
  const userId = user?.id || null;

  // Load charts on mount and when user changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await getSavedChartsAsync(userId);
      if (!cancelled) setCharts(loaded);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Check for exact duplicate
  const isAlreadySaved = useMemo(() => {
    if (saved) return false;
    return !!findExactDuplicateIn(charts, personA, personB);
  }, [charts, personA.date, personA.time, personA.lat, personA.lng,
      personB?.date, personB?.time, personB?.lat, personB?.lng, saved]);

  const handleClick = () => {
    if (isAlreadySaved) return;

    if (!isPaid && charts.length >= FREE_CHART_LIMIT) {
      toast.error(`Free accounts can save up to ${FREE_CHART_LIMIT} charts. Upgrade to Pro for unlimited saves.`);
      return;
    }

    const defaultName = personB
      ? `${personA.name || 'Person A'} & ${personB.name || 'Person B'}`
      : personA.name || 'My Chart';
    setChartName(defaultName);
    setNameConflict(null);
    setShowNameInput(true);
  };

  const doSave = useCallback(async (name: string, updateId?: string) => {
    if (!personA.lat) return;
    setSaving(true);

    const chart: SavedChart = {
      id: updateId || crypto.randomUUID(),
      name: name || 'Untitled Chart',
      chart_type: personB ? 'synastry' : 'natal',
      person_a_name: personA.name,
      person_a_date: personA.date,
      person_a_time: personA.time,
      person_a_location: personA.location,
      person_a_lat: personA.lat,
      person_a_lng: personA.lng,
      person_a_chart: personA.natalChart,
      person_b_name: personB?.name || null,
      person_b_date: personB?.date || null,
      person_b_time: personB?.time || null,
      person_b_location: personB?.location || null,
      person_b_lat: personB?.lat || null,
      person_b_lng: personB?.lng || null,
      person_b_chart: personB?.natalChart || null,
      created_at: new Date().toISOString(),
    };

    try {
      if (userId) {
        // Save to DB
        if (updateId) {
          const ok = await updateDbChart(updateId, chart);
          if (!ok) { toast.error('Failed to update chart'); return; }
        } else {
          const saved = await insertDbChart(userId, chart);
          if (!saved) { toast.error('Failed to save chart'); return; }
          chart.id = saved.id;
          chart.created_at = saved.created_at;
        }
        // Refresh cache
        invalidateChartsCache();
        const fresh = await getSavedChartsAsync(userId);
        setCharts(fresh);
      } else {
        // Save to localStorage
        const existing = getLocalCharts();
        let updated: SavedChart[];
        if (updateId) {
          updated = existing.map((c) => c.id === updateId ? chart : c);
        } else {
          updated = [chart, ...existing];
        }
        const max = isPaid ? 50 : FREE_CHART_LIMIT;
        if (updated.length > max) updated.length = max;
        setLocalCharts(updated);
        setCharts(updated);
      }

      setSaved(true);
      setShowNameInput(false);
      setNameConflict(null);
      toast.success(updateId ? 'Chart updated' : 'Chart saved');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save chart');
    } finally {
      setSaving(false);
    }
  }, [personA, personB, userId, isPaid]);

  const handleSave = useCallback(async () => {
    const trimmed = (chartName || '').trim();
    if (!trimmed) {
      toast.error('Please enter a chart name');
      return;
    }

    if (!isPaid && charts.length >= FREE_CHART_LIMIT) {
      toast.error(`Free accounts can save up to ${FREE_CHART_LIMIT} charts. Upgrade to Pro for unlimited saves.`);
      return;
    }

    // Check for name conflict
    const dupes = findByNameIn(charts, trimmed);
    if (dupes.length > 0) {
      setNameConflict(dupes[0]);
      return;
    }

    await doSave(trimmed);
  }, [chartName, charts, isPaid, doSave]);

  const handleUpdateExisting = useCallback(async () => {
    if (!nameConflict) return;
    await doSave(chartName.trim(), nameConflict.id);
  }, [nameConflict, chartName, doSave]);

  const handleSaveAsNew = useCallback(async () => {
    const trimmed = chartName.trim();
    let suffix = 2;
    let newName = `${trimmed} (${suffix})`;
    const names = new Set(charts.map((c) => c.name.toLowerCase().trim()));
    while (names.has(newName.toLowerCase())) {
      suffix++;
      newName = `${trimmed} (${suffix})`;
    }
    setChartName(newName);
    setNameConflict(null);
    await doSave(newName);
  }, [chartName, charts, doSave]);

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={isAlreadySaved || saving}
        className={`gap-2 ${isAlreadySaved ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {saved ? <Check className="w-4 h-4 text-emerald-500" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved' : isAlreadySaved ? 'Already Saved' : hasSynastry ? 'Save Charts' : 'Save Chart'}
      </Button>

      {showNameInput && !nameConflict && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNameInput(false)} />
          <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full sm:mt-2 z-50 bg-popover border rounded-lg shadow-lg p-3 w-[calc(100vw-1rem)] sm:w-72 max-w-xs">
            <label className="text-xs text-muted-foreground mb-1.5 block">Chart name</label>
            <input
              type="text"
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
              placeholder="Chart name"
              className="h-9 px-3 rounded-lg border bg-background text-sm w-full"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNameInput(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Name conflict dialog */}
      {showNameInput && nameConflict && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setNameConflict(null); setShowNameInput(false); }} />
          <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full sm:mt-2 z-50 bg-popover border rounded-lg shadow-lg p-3 w-[calc(100vw-1rem)] sm:w-80 max-w-sm">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">A chart named &ldquo;{nameConflict.name}&rdquo; already exists</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Saved {new Date(nameConflict.created_at).toLocaleDateString()} &middot; {nameConflict.person_a_name}
                  {nameConflict.person_b_name ? ` & ${nameConflict.person_b_name}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={handleUpdateExisting} disabled={saving} className="w-full">
                {saving ? 'Updating...' : 'Update Existing'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleSaveAsNew} disabled={saving} className="w-full">
                Save as New
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setNameConflict(null); setShowNameInput(false); }} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
