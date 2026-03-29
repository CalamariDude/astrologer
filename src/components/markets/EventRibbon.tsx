import type { MarketEvent } from './EventsPanel';

interface EventRibbonProps {
  events: MarketEvent[];
  selectedDate?: string;
  onSelectDate: (date: string) => void;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function EventRibbon({ events, selectedDate, onSelectDate }: EventRibbonProps) {
  if (events.length === 0) return null;

  // Sort chronologically (oldest first → newest right)
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-1 scrollbar-hide">
      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-medium shrink-0 mr-1">
        Events
      </span>
      {sorted.map(e => {
        const isSelected = selectedDate && Math.abs(
          new Date(e.date).getTime() - new Date(selectedDate).getTime()
        ) < 3 * 86400000;

        return (
          <button
            key={e.id}
            onClick={() => onSelectDate(e.date)}
            className={`
              shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px]
              border transition-all duration-150 cursor-pointer
              ${isSelected
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                : 'bg-card/80 border-border/40 text-muted-foreground hover:border-blue-500/30 hover:text-foreground hover:bg-blue-500/5'
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-blue-400' : 'bg-blue-500/50'}`}
            />
            <span className="font-medium whitespace-nowrap">{e.title}</span>
            <span className={`text-[9px] whitespace-nowrap ${isSelected ? 'text-blue-400/70' : 'text-muted-foreground/50'}`}>
              {formatShortDate(e.date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
