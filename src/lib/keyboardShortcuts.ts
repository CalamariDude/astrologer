/** Keyboard shortcut definitions for the Astrologer chart page */

export interface ShortcutDef {
  id: string;
  key: string;
  meta?: boolean;
  alt?: boolean;
  label: string;
  category: 'Navigation' | 'Chart' | 'Chart Tabs' | 'View' | 'General';
}

/** Ordered tab values */
export const TAB_VALUES = [
  'aspect-grid',
  'profections',
  'age-degree',
  'ephemeris',
  'graphic-eph',
  'transits',
  'declination',
  'dignities',
  'fixed-stars',
  'ai-reading',
  'time-finder',
  'voc-moon',
  'planet-returns',
  'notes',
] as const;

/** Human-readable labels for each tab value (used in spotlight search) */
export const TAB_LABELS: Record<string, string> = {
  'aspect-grid': 'Aspects',
  'profections': 'Profections',
  'age-degree': 'Activations',
  'ephemeris': 'Ephemeris',
  'graphic-eph': 'Graphic Ephemeris',
  'transits': 'Transits',
  'declination': 'Declination',
  'dignities': 'Dignities',
  'fixed-stars': 'Fixed Stars',
  'ai-reading': 'AI Reading',
  'time-finder': 'Time Finder',
  'voc-moon': 'VOC Moon',
  'planet-returns': 'Returns',
  'notes': 'Notes',
};

export const SHORTCUTS: ShortcutDef[] = [
  // Navigation
  { id: 'prev-tab', key: '[', label: 'Previous tab', category: 'Navigation' },
  { id: 'next-tab', key: ']', label: 'Next tab', category: 'Navigation' },
  { id: 'preset', key: '0-9', label: 'Load preset (0=Default)', category: 'Navigation' },

  // Chart Tabs
  { id: 'new-tab', key: 'T', alt: true, label: 'New chart tab', category: 'Chart Tabs' },
  { id: 'close-tab', key: 'W', alt: true, label: 'Close chart tab', category: 'Chart Tabs' },
  { id: 'dup-tab', key: 'D', alt: true, label: 'Duplicate chart tab', category: 'Chart Tabs' },
  { id: 'prev-chart-tab', key: '←', label: 'Previous chart tab', category: 'Chart Tabs' },
  { id: 'next-chart-tab', key: '→', label: 'Next chart tab', category: 'Chart Tabs' },

  // Chart
  { id: 'spotlight', key: 'K', meta: true, label: 'Command palette', category: 'Chart' },
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
  const alt = shortcut.alt ? (isMac ? '⌥' : 'Alt+') : '';
  const key = shortcut.key === 'Enter' ? '↵' : shortcut.key;
  return `${alt}${meta}${key}`;
}
