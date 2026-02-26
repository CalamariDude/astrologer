import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
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

interface SaveChartButtonProps {
  personA: PersonInfo;
  personB?: PersonInfo | null;
}

export function SaveChartButton({ personA, personB }: SaveChartButtonProps) {
  const [showNameInput, setShowNameInput] = useState(false);
  const [chartName, setChartName] = useState('');
  const [saved, setSaved] = useState(false);
  const { isPaid } = useSubscription();

  const handleClick = () => {
    const existing = getSavedCharts();
    if (!isPaid && existing.length >= FREE_CHART_LIMIT) {
      toast.error(`Free accounts can save up to ${FREE_CHART_LIMIT} charts. Upgrade to Pro for unlimited saves.`);
      return;
    }

    const defaultName = personB
      ? `${personA.name || 'Person A'} & ${personB.name || 'Person B'}`
      : personA.name || 'My Chart';
    setChartName(defaultName);
    setShowNameInput(true);
  };

  const handleSave = () => {
    if (!personA.lat) return;

    const existing = getSavedCharts();
    if (!isPaid && existing.length >= FREE_CHART_LIMIT) {
      toast.error(`Free accounts can save up to ${FREE_CHART_LIMIT} charts. Upgrade to Pro for unlimited saves.`);
      return;
    }

    const chart: SavedChart = {
      id: crypto.randomUUID(),
      name: chartName || 'Untitled Chart',
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

    existing.unshift(chart);
    // Keep max 50 saved charts (Pro), FREE_CHART_LIMIT for free
    const max = isPaid ? 50 : FREE_CHART_LIMIT;
    if (existing.length > max) existing.length = max;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    setSaved(true);
    setShowNameInput(false);
    toast.success('Chart saved');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="relative">
      <Button size="sm" variant="outline" onClick={handleClick} className="gap-2">
        {saved ? <Check className="w-4 h-4 text-emerald-500" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved' : 'Save Chart'}
      </Button>

      {showNameInput && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowNameInput(false)} />
          {/* Popover */}
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
    </div>
  );
}
