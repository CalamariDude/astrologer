/**
 * InterpretationCard — reusable card for showing astrological interpretations
 * Subtle element-colored left border, slightly larger font, distinct from data tables.
 */

import React from 'react';

const ELEMENT_BORDER_COLORS: Record<string, string> = {
  fire: 'border-l-red-500/60',
  earth: 'border-l-emerald-500/60',
  air: 'border-l-sky-500/60',
  water: 'border-l-cyan-500/60',
};

const ELEMENT_BG: Record<string, string> = {
  fire: 'bg-red-500/5',
  earth: 'bg-emerald-500/5',
  air: 'bg-sky-500/5',
  water: 'bg-cyan-500/5',
};

interface InterpretationCardProps {
  title?: string;
  children: React.ReactNode;
  element?: 'fire' | 'earth' | 'air' | 'water';
}

export function InterpretationCard({ title, children, element }: InterpretationCardProps) {
  const borderColor = element ? ELEMENT_BORDER_COLORS[element] : 'border-l-primary/40';
  const bg = element ? ELEMENT_BG[element] : 'bg-primary/5';

  return (
    <div className={`border-l-[3px] ${borderColor} ${bg} rounded-r-lg px-3 py-2.5`}>
      {title && (
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
          {title}
        </div>
      )}
      <div className="text-sm leading-relaxed text-foreground/85">
        {children}
      </div>
    </div>
  );
}
