import { useEffect } from 'react';
import { TAB_VALUES } from '@/lib/keyboardShortcuts';

interface UseKeyboardShortcutsOptions {
  hasChart: boolean;
  isEditing: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPrevTab: () => void;
  onNextTab: () => void;
  onCalculate: () => void;
  onSave: () => void;
  onToggleEdit: () => void;
  onToggleGalactic: () => void;
  onEscape: () => void;
  onShowHelp: () => void;
  onSpotlight?: () => void;
  // Chart tab shortcuts
  onNewChartTab?: () => void;
  onCloseChartTab?: () => void;
  onDuplicateChartTab?: () => void;
  onPrevChartTab?: () => void;
  onNextChartTab?: () => void;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts({
  hasChart,
  isEditing,
  activeTab,
  onTabChange,
  onPrevTab,
  onNextTab,
  onCalculate,
  onSave,
  onToggleEdit,
  onToggleGalactic,
  onEscape,
  onShowHelp,
  onSpotlight,
  onNewChartTab,
  onCloseChartTab,
  onDuplicateChartTab,
  onPrevChartTab,
  onNextChartTab,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // Alt shortcuts — chart tab management (work everywhere except inputs)
      if (e.altKey && !meta && !isInputFocused()) {
        if (e.key === 't') { e.preventDefault(); onNewChartTab?.(); return; }
        if (e.key === 'w') { e.preventDefault(); onCloseChartTab?.(); return; }
        if (e.key === 'd') { e.preventDefault(); onDuplicateChartTab?.(); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); onPrevChartTab?.(); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); onNextChartTab?.(); return; }
      }

      // Meta shortcuts — work everywhere (including inputs)
      if (meta && e.key === 'k') {
        e.preventDefault();
        onSpotlight?.();
        return;
      }
      if (meta && e.key === 's') {
        e.preventDefault();
        if (hasChart) onSave();
        return;
      }
      if (meta && e.key === 'Enter') {
        e.preventDefault();
        if (isEditing) onCalculate();
        return;
      }

      // Escape — works everywhere
      if (e.key === 'Escape') {
        onEscape();
        return;
      }

      // All remaining shortcuts are suppressed when an input is focused
      if (isInputFocused()) return;

      // Number keys 1-9 → jump to tab
      if (hasChart && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (idx < TAB_VALUES.length) {
          onTabChange(TAB_VALUES[idx]);
        }
        return;
      }

      // [ / ] → prev / next tab
      if (hasChart && e.key === '[') {
        onPrevTab();
        return;
      }
      if (hasChart && e.key === ']') {
        onNextTab();
        return;
      }

      // E → toggle edit
      if (e.key === 'e' || e.key === 'E') {
        onToggleEdit();
        return;
      }

      // G → toggle galactic
      if (hasChart && (e.key === 'g' || e.key === 'G')) {
        onToggleGalactic();
        return;
      }

      // ? → show help
      if (e.key === '?') {
        onShowHelp();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChart, isEditing, activeTab, onTabChange, onPrevTab, onNextTab, onCalculate, onSave, onToggleEdit, onToggleGalactic, onEscape, onShowHelp, onSpotlight, onNewChartTab, onCloseChartTab, onDuplicateChartTab, onPrevChartTab, onNextChartTab]);
}
