/**
 * ToolGuide — Collapsible help section for toolbox panels
 * Shows a brief description + usage tips in a compact expandable card
 */

import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface ToolGuideProps {
  title: string;
  description: string;
  tips: string[];
}

export function ToolGuide({ title, description, tips }: ToolGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/30 transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
        <span className="text-[11px] text-muted-foreground font-medium flex-1">How to use {title}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/20">
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-2">{description}</p>
          {tips.length > 0 && (
            <ul className="space-y-1">
              {tips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground/60 leading-relaxed flex gap-1.5">
                  <span className="text-muted-foreground/60 shrink-0 mt-px">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
