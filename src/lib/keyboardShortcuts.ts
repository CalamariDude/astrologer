/** Keyboard shortcut definitions for the Astrologer chart page */

export interface ShortcutDef {
  id: string;
  key: string;
  meta?: boolean;
  label: string;
  category: 'Navigation' | 'Chart' | 'View' | 'General';
}

/** Ordered tab values — indices 0–8 map to keys 1–9 */
export const TAB_VALUES = [
  'aspect-grid',
  'profections',
  'age-degree',
  'ephemeris',
  'graphic-eph',
  'transits',
  'declination',
  'ai-reading',
  'notes',
] as const;

export const SHORTCUTS: ShortcutDef[] = [
  // Navigation
  { id: 'tab-1', key: '1', label: 'Aspects tab', category: 'Navigation' },
  { id: 'tab-2', key: '2', label: 'Profections tab', category: 'Navigation' },
  { id: 'tab-3', key: '3', label: 'Age Degree tab', category: 'Navigation' },
  { id: 'tab-4', key: '4', label: 'Ephemeris tab', category: 'Navigation' },
  { id: 'tab-5', key: '5', label: 'Graphic Eph. tab', category: 'Navigation' },
  { id: 'tab-6', key: '6', label: 'Transits tab', category: 'Navigation' },
  { id: 'tab-7', key: '7', label: 'Declination tab', category: 'Navigation' },
  { id: 'tab-8', key: '8', label: 'AI Reading tab', category: 'Navigation' },
  { id: 'tab-9', key: '9', label: 'Notes tab', category: 'Navigation' },
  { id: 'prev-tab', key: '[', label: 'Previous tab', category: 'Navigation' },
  { id: 'next-tab', key: ']', label: 'Next tab', category: 'Navigation' },

  // Chart
  { id: 'calculate', key: 'Enter', meta: true, label: 'Calculate chart', category: 'Chart' },
  { id: 'save', key: 'S', meta: true, label: 'Save chart', category: 'Chart' },
  { id: 'edit', key: 'E', label: 'Toggle edit mode', category: 'Chart' },

  // View
  { id: 'galactic', key: 'G', label: 'Toggle Galactic mode', category: 'View' },
  { id: 'transits-toggle', key: 'T', label: 'Toggle transits', category: 'View' },
  { id: 'zoom-in', key: '+', label: 'Zoom in', category: 'View' },
  { id: 'zoom-out', key: '-', label: 'Zoom out', category: 'View' },
  { id: 'zoom-reset', key: '0', label: 'Reset zoom', category: 'View' },

  // General
  { id: 'escape', key: 'Escape', label: 'Close modal / exit edit', category: 'General' },
  { id: 'help', key: '?', label: 'Show shortcuts', category: 'General' },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/** Format a shortcut for display — shows ⌘ on Mac, Ctrl on Windows/Linux */
export function formatShortcut(shortcut: ShortcutDef): string {
  const meta = shortcut.meta ? (isMac ? '⌘' : 'Ctrl+') : '';
  const key = shortcut.key === 'Enter' ? '↵' : shortcut.key;
  return `${meta}${key}`;
}
