/**
 * Toolbox Menu — categorized launcher for advanced astrology tools
 * Opens as a panel replacing analysis tabs
 */

import React, { useState, useMemo } from 'react';
import {
  Wrench, Clock, BookOpen, Atom, Eye, ChevronRight, Search, X, Flame, Moon, Globe, Shapes,
} from 'lucide-react';

export interface ToolDef {
  id: string;
  label: string;
  description: string;
  category: string;
  requiresBirthDate?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  popular?: boolean;
  beta?: boolean;
}

const CATEGORIES = [
  { key: 'timing', label: 'Timing Systems', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'analysis', label: 'Chart Analysis', icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'traditional', label: 'Traditional', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { key: 'charts', label: 'Chart Types', icon: <Globe className="w-3.5 h-3.5" /> },
  { key: 'uranian', label: 'Uranian / Cosmobiology', icon: <Atom className="w-3.5 h-3.5" /> },
  { key: 'daily', label: 'Daily Tools', icon: <Moon className="w-3.5 h-3.5" /> },
  { key: 'visual', label: 'Visual', icon: <Eye className="w-3.5 h-3.5" /> },
];

export const TOOLS: ToolDef[] = [
  // Timing Systems
  { id: 'zodiacal-releasing', label: 'Zodiacal Releasing', description: 'See the major chapters and themes of your life timeline', category: 'timing', requiresBirthDate: true, difficulty: 'advanced', popular: true },
  { id: 'firdaria', label: 'Firdaria', description: 'Which planet is running the show in your life right now?', category: 'timing', requiresBirthDate: true, difficulty: 'intermediate', popular: true },
  { id: 'primary-directions', label: 'Primary Directions', description: 'Pinpoint the ages when major life events are most likely', category: 'timing', requiresBirthDate: true, difficulty: 'advanced' },
  { id: 'dynamic-hits', label: 'Dynamic Hits', description: 'All major celestial events on one timeline — eclipses, ingresses, stations', category: 'timing', requiresBirthDate: true, difficulty: 'intermediate', beta: true },
  { id: 'daily-profections', label: 'Daily Profections', description: 'Today\'s ruling planet and house theme based on your age', category: 'timing', requiresBirthDate: true, difficulty: 'beginner' },
  { id: 'progressed-moon', label: 'Progressed Moon Calendar', description: 'Track your emotional evolution month by month through signs and houses', category: 'timing', requiresBirthDate: true, difficulty: 'intermediate' },

  // Chart Analysis
  { id: 'dominant-planets', label: 'Dominant Planets & Elements', description: 'Find which planet and element dominate your personality', category: 'analysis', difficulty: 'beginner', popular: true },
  { id: 'chart-shape', label: 'Chart Shape Detection', description: 'Discover the overall pattern your planets form — bowl, bundle, splay, and more', category: 'analysis', difficulty: 'beginner', beta: true },
  { id: 'sabian-symbols', label: 'Sabian Symbols', description: 'Discover the poetic symbol hidden in each of your planet placements', category: 'analysis', difficulty: 'beginner', popular: true },
  { id: 'midpoint-trees', label: 'Midpoint Trees', description: 'Find hidden connections where two planets meet in the middle', category: 'analysis', difficulty: 'advanced', beta: true },

  // Traditional
  { id: 'antiscia', label: 'Antiscia & Contra-Antiscia', description: 'Mirror points that reveal secret connections between planets', category: 'traditional', difficulty: 'advanced' },
  { id: 'arabic-parts', label: 'Arabic Parts Editor', description: 'Calculate sensitive points like the Part of Fortune and hundreds more', category: 'traditional', difficulty: 'advanced' },
  { id: 'almuten', label: 'Almuten Calculator', description: 'Find the single most powerful planet in your chart by traditional dignity', category: 'traditional', difficulty: 'advanced' },

  // Chart Types
  { id: 'davison', label: 'Davison Chart', description: 'A single chart that captures the essence of a relationship', category: 'charts', requiresBirthDate: true, difficulty: 'intermediate' },
  { id: 'draconic', label: 'Draconic Chart', description: 'Your soul-level chart — what you came into this life carrying', category: 'charts', difficulty: 'intermediate' },
  { id: 'planetary-returns', label: 'Planetary Returns', description: 'Jupiter, Saturn, and other planet return charts for life milestones', category: 'charts', requiresBirthDate: true, difficulty: 'intermediate' },

  // Uranian / Cosmobiology
  { id: 'uranian-ephemeris', label: 'Uranian Graphic Ephemeris', description: 'Visualize planetary motion on a 45° or 90° dial over time', category: 'uranian', difficulty: 'advanced', beta: true },

  // Daily Tools
  { id: 'planetary-hours', label: 'Planetary Hours', description: 'Find the best time today for different activities', category: 'daily', difficulty: 'beginner', popular: true },
  { id: 'void-of-course', label: 'Void of Course Moon', description: 'Know when the Moon is "between tasks" — a time to pause, not start', category: 'daily', difficulty: 'beginner', popular: true },
  { id: 'retrograde-calendar', label: 'Retrograde Calendar', description: 'All upcoming retrogrades at a glance with shadow periods', category: 'daily', difficulty: 'beginner' },
  { id: 'eclipse-tracker', label: 'Eclipse Tracker', description: 'See which eclipses light up specific areas of your chart', category: 'daily', requiresBirthDate: true, difficulty: 'intermediate' },

  // Visual
  { id: 'sky-map', label: 'Sky Map', description: 'An animated view of the real sky with constellations and planets', category: 'visual', requiresBirthDate: true, difficulty: 'beginner', beta: true },
  { id: 'eclipse-maps', label: 'Eclipse Maps', description: 'Solar eclipse paths drawn on a world map', category: 'visual', difficulty: 'beginner', beta: true },
];

interface ToolboxMenuProps {
  onSelectTool: (toolId: string) => void;
  onClose: () => void;
  hasBirthDate: boolean;
  recentTools?: string[];
}

export function ToolboxMenu({ onSelectTool, onClose, hasBirthDate, recentTools = [] }: ToolboxMenuProps) {
  const [search, setSearch] = useState('');

  const filteredTools = useMemo(() => {
    if (!search.trim()) return TOOLS;
    const q = search.toLowerCase();
    return TOOLS.filter(t =>
      t.label.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, ToolDef[]>();
    for (const tool of filteredTools) {
      const list = map.get(tool.category) || [];
      list.push(tool);
      map.set(tool.category, list);
    }
    return map;
  }, [filteredTools]);

  const recentToolDefs = useMemo(() =>
    recentTools.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) as ToolDef[],
    [recentTools]
  );

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Advanced Toolbox</h3>
          <span className="text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">Beta</span>
          <span className="text-[11px] text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded">{TOOLS.length} tools</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Recent tools */}
      {!search && recentToolDefs.length > 0 && (
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Recent</span>
          <div className="mt-1.5 space-y-1">
            {recentToolDefs.map(tool => (
              <ToolRow key={tool.id} tool={tool} onClick={() => onSelectTool(tool.id)} disabled={tool.requiresBirthDate && !hasBirthDate} />
            ))}
          </div>
        </div>
      )}

      {/* Categorized tools */}
      {CATEGORIES.map(cat => {
        const tools = grouped.get(cat.key);
        if (!tools || tools.length === 0) return null;
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-muted-foreground/70">{cat.icon}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">{cat.label}</span>
            </div>
            <div className="space-y-1">
              {tools.map(tool => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  onClick={() => onSelectTool(tool.id)}
                  disabled={tool.requiresBirthDate && !hasBirthDate}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ToolRow({ tool, onClick, disabled }: { tool: ToolDef; onClick: () => void; disabled?: boolean }) {
  const difficultyColor = tool.difficulty === 'beginner' ? 'bg-emerald-500' : tool.difficulty === 'intermediate' ? 'bg-amber-500' : 'bg-red-500';
  const difficultyLabel = tool.difficulty === 'beginner' ? 'Beginner' : tool.difficulty === 'intermediate' ? 'Intermediate' : 'Advanced';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left group ${
        disabled
          ? 'border-border/30 opacity-40 cursor-not-allowed'
          : 'border-border/50 hover:border-primary/30 hover:bg-muted/40 cursor-pointer'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{tool.label}</span>
          {tool.popular && (
            <span className="text-[11px] text-amber-500" title="Popular">&#10022;</span>
          )}
          {tool.beta && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0"
              title="Beta — graphical tool, may have rough edges"
            >
              Beta
            </span>
          )}
          {tool.difficulty && (
            <span className={`w-1.5 h-1.5 rounded-full ${difficultyColor} shrink-0`} title={difficultyLabel} />
          )}
        </div>
        <div className="text-[11px] text-muted-foreground/70 truncate">{tool.description}</div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
    </button>
  );
}
