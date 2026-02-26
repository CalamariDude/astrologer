/**
 * GalacticToggle
 * Toggle button to switch between 2D chart and 3D galactic mode
 */

import { Orbit } from 'lucide-react';

interface GalacticToggleProps {
  active: boolean;
  onToggle: () => void;
}

export function GalacticToggle({ active, onToggle }: GalacticToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
        transition-all duration-200 border
        ${active
          ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
          : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
        }
      `}
      title={active ? 'Switch to 2D chart' : 'Enter Galactic Mode'}
    >
      <Orbit className="w-3.5 h-3.5" />
      {active ? '2D Chart' : 'Galactic Mode'}
    </button>
  );
}
