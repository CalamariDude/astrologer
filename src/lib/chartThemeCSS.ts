/**
 * Maps BiWheel chart themes to CSS custom properties
 * so the entire page can adopt the chart's color scheme.
 */

import { THEMES, type ThemeName } from '@/components/biwheel/utils/themes';

/** Convert hex color (#rrggbb) to "H S% L%" string for CSS custom properties */
export function hexToHSL(hex: string): string {
  // Remove # prefix
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    // Achromatic
    return `0 0% ${Math.round(l * 100)}%`;
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let hue: number;
  switch (max) {
    case r:
      hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      break;
    case g:
      hue = ((b - r) / d + 2) * 60;
      break;
    default:
      hue = ((r - g) / d + 4) * 60;
      break;
  }

  return `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Get perceived luminance from hex (0=black, 1=white) */
function getLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Themes with dark backgrounds */
const DARK_THEMES: Set<string> = new Set([
  'dark', 'midnight', 'cosmic', 'forest', 'sunset', 'ocean',
]);

/** Whether a theme is dark (for color-scheme and class toggling) */
export function isThemeDark(themeName: string): boolean {
  return DARK_THEMES.has(themeName);
}

/**
 * Generate CSS custom property overrides for a BiWheel theme.
 * These override shadcn/Tailwind HSL variables within a scoped container.
 * Also sets colorScheme and explicit background-color/color for full coverage.
 */
export function getThemeCSSVariables(themeName: string): Record<string, string> {
  const theme = THEMES[themeName as ThemeName];
  if (!theme) return {};

  const dark = isThemeDark(themeName);

  return {
    // Core shadcn/Tailwind overrides
    '--background': hexToHSL(theme.background),
    '--foreground': hexToHSL(theme.textPrimary),
    '--card': hexToHSL(theme.backgroundAlt),
    '--card-foreground': hexToHSL(theme.textPrimary),
    '--popover': hexToHSL(theme.backgroundAlt),
    '--popover-foreground': hexToHSL(theme.textPrimary),
    '--muted': hexToHSL(theme.backgroundAlt2),
    '--muted-foreground': hexToHSL(theme.textMuted),
    '--accent': hexToHSL(theme.backgroundAlt),
    '--accent-foreground': hexToHSL(theme.textPrimary),
    '--border': hexToHSL(theme.gridLineFaint),
    '--input': hexToHSL(theme.gridLineFaint),
    '--secondary': hexToHSL(theme.backgroundAlt2),
    '--secondary-foreground': hexToHSL(theme.textPrimary),
    '--ring': hexToHSL(theme.gridLineLight),
    // Explicit inline styles for elements that don't use CSS vars
    'backgroundColor': theme.background,
    'color': theme.textPrimary,
    'colorScheme': dark ? 'dark' : 'light',
  };
}
