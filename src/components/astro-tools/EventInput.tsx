/**
 * Event Input Form
 * For entering life events for rectification workbench
 */

import { Button } from '@/components/ui/button';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import { EVENT_CATEGORIES } from '@/lib/rectificationScoring';
import type { LifeEvent } from '@/lib/rectificationScoring';

interface EventInputProps {
  events: LifeEvent[];
  onChange: (events: LifeEvent[]) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  marriage: '\uD83D\uDC8D',
  career: '\uD83D\uDCBC',
  child: '\uD83D\uDC76',
  accident: '\u26A0\uFE0F',
  relocation: '\uD83C\uDFE0',
  health: '\u2695\uFE0F',
  education: '\uD83C\uDF93',
  death: '\uD83D\uDD4A\uFE0F',
  death_family: '\uD83D\uDD4A\uFE0F',
  divorce: '\uD83D\uDC94',
  spiritual: '\uD83D\uDD4C',
  legal: '\u2696\uFE0F',
  financial: '\uD83D\uDCB0',
  travel_long: '\u2708\uFE0F',
};

export function EventInput({ events, onChange }: EventInputProps) {
  const addEvent = () => {
    onChange([...events, { date: '', category: 'marriage', description: '' }]);
  };

  const removeEvent = (index: number) => {
    onChange(events.filter((_, i) => i !== index));
  };

  const updateEvent = (index: number, field: keyof LifeEvent, value: string) => {
    const updated = [...events];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Life Events</div>
          <div className="text-[11px] text-muted-foreground/70">Minimum 3 events for accurate results</div>
        </div>
        <Button variant="outline" size="sm" onClick={addEvent} className="rounded-lg gap-1.5">
          <Plus className="w-3 h-3" /> Add Event
        </Button>
      </div>

      <div className="space-y-2">
        {events.map((event, i) => (
          <div
            key={i}
            className="group flex gap-3 items-start p-3.5 rounded-xl border bg-card/50 hover:bg-muted/20 transition-colors"
          >
            {/* Event number */}
            <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Date</label>
                <div className="relative">
                  <CalendarDays className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={event.date}
                    onChange={e => updateEvent(i, 'date', e.target.value)}
                    className="w-full h-8 pl-8 pr-2 rounded-lg border bg-background text-sm tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Category</label>
                <select
                  value={event.category}
                  onChange={e => updateEvent(i, 'category', e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border bg-background text-sm appearance-none"
                >
                  {EVENT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {CATEGORY_ICONS[cat.value] || ''} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Description</label>
                <input
                  type="text"
                  value={event.description}
                  onChange={e => updateEvent(i, 'description', e.target.value)}
                  placeholder="Brief description..."
                  className="w-full h-8 px-2.5 rounded-lg border bg-background text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => removeEvent(i)}
              className="w-7 h-7 rounded-lg flex items-center justify-center mt-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 rounded-xl border border-dashed bg-muted/10">
          <CalendarDays className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground">No events added yet</div>
          <div className="text-xs text-muted-foreground/60 mt-1">Add at least 3 life events with dates for best results</div>
        </div>
      )}
    </div>
  );
}
