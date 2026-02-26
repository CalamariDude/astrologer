import React, { useState, useMemo } from 'react';
import { Save, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';

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

export function getSavedCharts(): SavedChart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteSavedChart(id: string) {
  const charts = getSavedCharts().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
}

/** Check if a chart with the exact same birth data already exists */
function findExactDuplicate(personA: PersonInfo, personB?: PersonInfo | null): SavedChart | null {
  const charts = getSavedCharts();
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
    return !c.person_b_date; // natal-only match
  }) || null;
}

/** Find saved chart(s) with the same name */
function findByName(name: string): SavedChart[] {
  const charts = getSavedCharts();
  const lower = name.toLowerCase().trim();
  return charts.filter((c) => c.name.toLowerCase().trim() === lower);
}

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
  const { isPaid } = useSubscription();

  // Check for exact duplicate (same birth data already saved)
  const exactDupe = useMemo(
    () => findExactDuplicate(personA, personB),
    [personA.date, personA.time, personA.lat, personA.lng,
     personB?.date, personB?.time, personB?.lat, personB?.lng]
  );

  const isAlreadySaved = !!exactDupe && !saved;

  const handleClick = () => {
    if (isAlreadySaved) return;

    const existing = getSavedCharts();
    if (!isPaid && existing.length >= FREE_CHART_LIMIT) {
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

  const doSave = (name: string, updateId?: string) => {
    if (!personA.lat) return;

    const existing = getSavedCharts();

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

    let updated: SavedChart[];
    if (updateId) {
      // Replace existing entry in-place
      updated = existing.map((c) => c.id === updateId ? chart : c);
    } else {
      updated = [chart, ...existing];
    }

    const max = isPaid ? 50 : FREE_CHART_LIMIT;
    if (updated.length > max) updated.length = max;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setSaved(true);
    setShowNameInput(false);
    setNameConflict(null);
    toast.success(updateId ? 'Chart updated' : 'Chart saved');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSave = () => {
    const trimmed = (chartName || '').trim();
    if (!trimmed) {
      toast.error('Please enter a chart name');
      return;
    }

    const existing = getSavedCharts();
    if (!isPaid && existing.length >= FREE_CHART_LIMIT) {
      toast.error(`Free accounts can save up to ${FREE_CHART_LIMIT} charts. Upgrade to Pro for unlimited saves.`);
      return;
    }

    // Check for name conflict
    const dupes = findByName(trimmed);
    if (dupes.length > 0) {
      setNameConflict(dupes[0]);
      return;
    }

    doSave(trimmed);
  };

  const handleUpdateExisting = () => {
    if (!nameConflict) return;
    doSave(chartName.trim(), nameConflict.id);
  };

  const handleSaveAsNew = () => {
    // Append (2), (3), etc. to make unique
    const trimmed = chartName.trim();
    const charts = getSavedCharts();
    let suffix = 2;
    let newName = `${trimmed} (${suffix})`;
    const names = new Set(charts.map((c) => c.name.toLowerCase().trim()));
    while (names.has(newName.toLowerCase())) {
      suffix++;
      newName = `${trimmed} (${suffix})`;
    }
    setChartName(newName);
    setNameConflict(null);
    doSave(newName);
  };

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={isAlreadySaved}
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
              <Button size="sm" onClick={handleSave} className="flex-1">
                Save
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
                <p className="text-sm font-medium">A chart named "{nameConflict.name}" already exists</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Saved {new Date(nameConflict.created_at).toLocaleDateString()} &middot; {nameConflict.person_a_name}
                  {nameConflict.person_b_name ? ` & ${nameConflict.person_b_name}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={handleUpdateExisting} className="w-full">
                Update Existing
              </Button>
              <Button size="sm" variant="outline" onClick={handleSaveAsNew} className="w-full">
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
