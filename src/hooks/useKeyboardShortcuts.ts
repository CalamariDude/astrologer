import { useEffect } from 'react';

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
  onToggleTransits?: () => void;
  onEscape: () => void;
  onShowHelp: () => void;
  onSpotlight?: () => void;
  onLoadPreset?: (index: number) => void;
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
  onToggleTransits,
  onEscape,
  onShowHelp,
  onSpotlight,
  onLoadPreset,
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

      // 0-9 → load preset directly
      if (e.key >= '0' && e.key <= '9' && !meta && !e.altKey) {
        onLoadPreset?.(parseInt(e.key));
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

      // T → toggle transits
      if (hasChart && (e.key === 't' || e.key === 'T') && !e.altKey) {
        onToggleTransits?.();
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
  }, [hasChart, isEditing, activeTab, onTabChange, onPrevTab, onNextTab, onCalculate, onSave, onToggleEdit, onToggleGalactic, onToggleTransits, onEscape, onShowHelp, onSpotlight, onLoadPreset, onNewChartTab, onCloseChartTab, onDuplicateChartTab, onPrevChartTab, onNextChartTab]);
}
