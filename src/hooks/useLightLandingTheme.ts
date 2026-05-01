import { useEffect } from 'react';
import { applyTheme } from '@/components/biwheel/utils/constants';
import { getThemeCSSVariables } from '@/lib/chartThemeCSS';

/**
 * Force the document to a light/classic theme on landing/marketing routes.
 *
 * Why: in-app pages (ChartPage, ProfileDropdown, etc.) write the user's saved
 * theme onto `document.documentElement` — CSS custom properties + a `dark` class.
 * Those persist across navigation, so a user with a dark in-app theme would see
 * the landing page's `bg-background` / `text-foreground` sections render dark.
 *
 * The landing should always look the same (light cream/white), independent of
 * the user's in-app preference. We don't restore on unmount because the next
 * in-app page mounts and re-applies the saved theme on its own.
 */
export function useLightLandingTheme(): void {
  useEffect(() => {
    const root = document.documentElement;
    const vars = getThemeCSSVariables('classic');
    for (const [key, value] of Object.entries(vars)) {
      if (key.startsWith('--')) {
        root.style.setProperty(key, value);
      }
    }
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    applyTheme('classic');
  }, []);
}
