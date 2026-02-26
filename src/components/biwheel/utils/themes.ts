/**
 * BiWheel Chart Themes
 * Color presets for background/lines/text and element colors.
 * Person A/B, planet, and aspect colors remain unchanged.
 */

export type ThemeName =
  | 'classic'
  | 'dark'
  | 'parchment'
  | 'highContrast'
  | 'midnight'
  | 'cosmic'
  | 'forest'
  | 'sunset'
  | 'ocean'
  | 'slate';

export interface ThemeColors {
  background: string;
  backgroundAlt: string;
  backgroundAlt2: string;
  gridLine: string;
  gridLineLight: string;
  gridLineFaint: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  fire: string;
  earth: string;
  air: string;
  water: string;
  elementBg: {
    fire: string;
    earth: string;
    air: string;
    water: string;
  };
  elementBgLight: {
    fire: string;
    earth: string;
    air: string;
    water: string;
  };
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  classic: {
    background: '#ffffff',
    backgroundAlt: '#f8f9fa',
    backgroundAlt2: '#f0f0f0',
    gridLine: '#000000',
    gridLineLight: '#333333',
    gridLineFaint: '#999999',
    textPrimary: '#000000',
    textSecondary: '#333333',
    textMuted: '#666666',
    fire: '#ff6600',
    earth: '#009933',
    air: '#cc9900',
    water: '#0099cc',
    elementBg: {
      fire: '#ffe4d6',
      earth: '#d4edda',
      air: '#fff3cd',
      water: '#cce5ff',
    },
    elementBgLight: {
      fire: '#fff0e6',
      earth: '#e8f5e9',
      air: '#fffde7',
      water: '#e3f2fd',
    },
  },

  dark: {
    background: '#1a1a2e',
    backgroundAlt: '#16213e',
    backgroundAlt2: '#0f3460',
    gridLine: '#e0e0e0',
    gridLineLight: '#aaaaaa',
    gridLineFaint: '#555555',
    textPrimary: '#f0f0f0',
    textSecondary: '#cccccc',
    textMuted: '#888888',
    fire: '#ff7733',
    earth: '#33bb55',
    air: '#ddaa22',
    water: '#33aadd',
    elementBg: {
      fire: '#3d2215',
      earth: '#15332a',
      air: '#33290a',
      water: '#0a2533',
    },
    elementBgLight: {
      fire: '#2e1a10',
      earth: '#0f2620',
      air: '#261f08',
      water: '#081c28',
    },
  },

  midnight: {
    background: '#0d1117',
    backgroundAlt: '#161b22',
    backgroundAlt2: '#21262d',
    gridLine: '#c9d1d9',
    gridLineLight: '#8b949e',
    gridLineFaint: '#484f58',
    textPrimary: '#e6edf3',
    textSecondary: '#c9d1d9',
    textMuted: '#8b949e',
    fire: '#f97583',
    earth: '#56d364',
    air: '#e3b341',
    water: '#58a6ff',
    elementBg: {
      fire: '#2a1216',
      earth: '#0f261a',
      air: '#2a2210',
      water: '#0c2044',
    },
    elementBgLight: {
      fire: '#200d10',
      earth: '#0a1c14',
      air: '#201a0c',
      water: '#081835',
    },
  },

  cosmic: {
    background: '#13052e',
    backgroundAlt: '#1a0a3e',
    backgroundAlt2: '#2d1460',
    gridLine: '#d4b8ff',
    gridLineLight: '#a78bfa',
    gridLineFaint: '#5b3d8f',
    textPrimary: '#f0e6ff',
    textSecondary: '#d4b8ff',
    textMuted: '#9f85cc',
    fire: '#ff6eb4',
    earth: '#50e890',
    air: '#ffd166',
    water: '#66d9ff',
    elementBg: {
      fire: '#301028',
      earth: '#0e2e1c',
      air: '#302510',
      water: '#0e2035',
    },
    elementBgLight: {
      fire: '#250c20',
      earth: '#0a2416',
      air: '#261e0c',
      water: '#0a1a2c',
    },
  },

  forest: {
    background: '#1a2e1a',
    backgroundAlt: '#1e3520',
    backgroundAlt2: '#264028',
    gridLine: '#c8e6c9',
    gridLineLight: '#a5d6a7',
    gridLineFaint: '#4a6b4a',
    textPrimary: '#e8f5e9',
    textSecondary: '#c8e6c9',
    textMuted: '#81c784',
    fire: '#ff8a65',
    earth: '#aed581',
    air: '#ffd54f',
    water: '#4fc3f7',
    elementBg: {
      fire: '#2e1a10',
      earth: '#1a2e1a',
      air: '#2e2810',
      water: '#0e2030',
    },
    elementBgLight: {
      fire: '#24140c',
      earth: '#142414',
      air: '#24200c',
      water: '#0a1a28',
    },
  },

  sunset: {
    background: '#2d1b2e',
    backgroundAlt: '#3a2240',
    backgroundAlt2: '#4a2d50',
    gridLine: '#f0c8a0',
    gridLineLight: '#d4a070',
    gridLineFaint: '#6e4a55',
    textPrimary: '#fce4d6',
    textSecondary: '#f0c8a0',
    textMuted: '#c08868',
    fire: '#ff6b6b',
    earth: '#88cc66',
    air: '#ffcc44',
    water: '#44bbdd',
    elementBg: {
      fire: '#3d1a1a',
      earth: '#1a2e14',
      air: '#3d3010',
      water: '#0e2030',
    },
    elementBgLight: {
      fire: '#301414',
      earth: '#142410',
      air: '#30260c',
      water: '#0a1a28',
    },
  },

  ocean: {
    background: '#0a192f',
    backgroundAlt: '#0e2240',
    backgroundAlt2: '#142d50',
    gridLine: '#a8d8ea',
    gridLineLight: '#64b5f6',
    gridLineFaint: '#2a5078',
    textPrimary: '#e3f2fd',
    textSecondary: '#a8d8ea',
    textMuted: '#6899b8',
    fire: '#ff8a65',
    earth: '#66bb6a',
    air: '#ffd54f',
    water: '#4dd0e1',
    elementBg: {
      fire: '#2a1510',
      earth: '#0e2a1a',
      air: '#2a2210',
      water: '#0a2838',
    },
    elementBgLight: {
      fire: '#20100c',
      earth: '#0a2014',
      air: '#201a0c',
      water: '#08202e',
    },
  },

  parchment: {
    background: '#f5f0e6',
    backgroundAlt: '#ede5d5',
    backgroundAlt2: '#e0d6c2',
    gridLine: '#5c4a32',
    gridLineLight: '#8b7355',
    gridLineFaint: '#b8a88a',
    textPrimary: '#3d2e1c',
    textSecondary: '#5c4a32',
    textMuted: '#8b7355',
    fire: '#c45a20',
    earth: '#4a7a3a',
    air: '#a68520',
    water: '#2a7a8a',
    elementBg: {
      fire: '#f0ddd0',
      earth: '#d5e5cc',
      air: '#f0e8c8',
      water: '#c8dde5',
    },
    elementBgLight: {
      fire: '#f5e8df',
      earth: '#e0ecd8',
      air: '#f5eed8',
      water: '#d5e5ec',
    },
  },

  slate: {
    background: '#f1f5f9',
    backgroundAlt: '#e2e8f0',
    backgroundAlt2: '#cbd5e1',
    gridLine: '#1e293b',
    gridLineLight: '#334155',
    gridLineFaint: '#94a3b8',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    fire: '#ef4444',
    earth: '#22c55e',
    air: '#eab308',
    water: '#3b82f6',
    elementBg: {
      fire: '#fee2e2',
      earth: '#dcfce7',
      air: '#fef9c3',
      water: '#dbeafe',
    },
    elementBgLight: {
      fire: '#fef2f2',
      earth: '#f0fdf4',
      air: '#fefce8',
      water: '#eff6ff',
    },
  },

  highContrast: {
    background: '#ffffff',
    backgroundAlt: '#f0f0f0',
    backgroundAlt2: '#e0e0e0',
    gridLine: '#000000',
    gridLineLight: '#000000',
    gridLineFaint: '#666666',
    textPrimary: '#000000',
    textSecondary: '#000000',
    textMuted: '#333333',
    fire: '#ff0000',
    earth: '#008800',
    air: '#dd8800',
    water: '#0055dd',
    elementBg: {
      fire: '#ffcccc',
      earth: '#ccffcc',
      air: '#ffeeaa',
      water: '#ccddff',
    },
    elementBgLight: {
      fire: '#ffe0e0',
      earth: '#e0ffe0',
      air: '#fff5cc',
      water: '#dde8ff',
    },
  },
};

export const THEME_LABELS: Record<ThemeName, string> = {
  classic: 'Classic',
  dark: 'Dark',
  midnight: 'Midnight',
  cosmic: 'Cosmic',
  forest: 'Forest',
  sunset: 'Sunset',
  ocean: 'Ocean',
  parchment: 'Parchment',
  slate: 'Slate',
  highContrast: 'High Contrast',
};

/** Preview swatch color for the theme picker button */
export const THEME_SWATCHES: Record<ThemeName, { bg: string; fg: string }> = {
  classic: { bg: '#ffffff', fg: '#000000' },
  dark: { bg: '#1a1a2e', fg: '#e0e0e0' },
  midnight: { bg: '#0d1117', fg: '#58a6ff' },
  cosmic: { bg: '#13052e', fg: '#d4b8ff' },
  forest: { bg: '#1a2e1a', fg: '#aed581' },
  sunset: { bg: '#2d1b2e', fg: '#ff6b6b' },
  ocean: { bg: '#0a192f', fg: '#4dd0e1' },
  parchment: { bg: '#f5f0e6', fg: '#5c4a32' },
  slate: { bg: '#f1f5f9', fg: '#1e293b' },
  highContrast: { bg: '#ffffff', fg: '#ff0000' },
};
