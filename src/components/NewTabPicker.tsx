import { Sun, Users, Clock, RotateCcw, Sparkles, CalendarClock } from 'lucide-react';

export type NewTabType = 'chart' | 'synastry' | 'transits' | 'returns' | 'ai-reading' | 'calendar';

interface TabOption {
  type: NewTabType;
  title: string;
  description: string;
  icon: typeof Sun;
  color: string;
  borderColor: string;
}

const TAB_OPTIONS: TabOption[] = [
  {
    type: 'chart',
    title: 'Natal Chart',
    description: 'Calculate a birth chart with planetary positions, houses, and aspects',
    icon: Sun,
    color: 'from-amber-500/10 to-orange-500/5',
    borderColor: 'hover:border-amber-500/40',
  },
  {
    type: 'synastry',
    title: 'Synastry',
    description: 'Compare two birth charts for relationship compatibility',
    icon: Users,
    color: 'from-pink-500/10 to-rose-500/5',
    borderColor: 'hover:border-pink-500/40',
  },
  {
    type: 'transits',
    title: 'Transits',
    description: 'View current planetary transits and their aspects to a natal chart',
    icon: Clock,
    color: 'from-blue-500/10 to-cyan-500/5',
    borderColor: 'hover:border-blue-500/40',
  },
  {
    type: 'returns',
    title: 'Returns',
    description: 'Solar and lunar return charts for annual and monthly forecasting',
    icon: RotateCcw,
    color: 'from-emerald-500/10 to-green-500/5',
    borderColor: 'hover:border-emerald-500/40',
  },
  {
    type: 'calendar',
    title: 'Transit Timeline',
    description: 'Upcoming transits, ingresses, and aspects in a timeline view',
    icon: CalendarClock,
    color: 'from-violet-500/10 to-purple-500/5',
    borderColor: 'hover:border-violet-500/40',
  },
  {
    type: 'ai-reading',
    title: 'AI Reading',
    description: 'Get an AI-powered interpretation of a natal or synastry chart',
    icon: Sparkles,
    color: 'from-fuchsia-500/10 to-pink-500/5',
    borderColor: 'hover:border-fuchsia-500/40',
  },
];

interface NewTabPickerProps {
  onSelect: (type: NewTabType) => void;
  onCancel: () => void;
}

export function NewTabPicker({ onSelect, onCancel }: NewTabPickerProps) {
  return (
    <div className="py-8 px-4 max-w-4xl mx-auto animate-in fade-in duration-200">
      <h2 className="text-lg font-semibold text-foreground mb-6">Choose New Tab</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TAB_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.type}
              onClick={() => onSelect(option.type)}
              className={`group text-left rounded-xl border border-border/50 bg-gradient-to-br ${option.color} ${option.borderColor} p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-foreground/70" />
                </div>
                <h3 className="font-medium text-foreground">{option.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{option.description}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={onCancel}
        className="mt-6 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
