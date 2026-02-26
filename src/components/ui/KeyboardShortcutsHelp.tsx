import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SHORTCUTS, formatShortcut, type ShortcutDef } from '@/lib/keyboardShortcuts';

const CATEGORIES = ['Navigation', 'Chart', 'View', 'General'] as const;

function ShortcutRow({ shortcut }: { shortcut: ShortcutDef }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{shortcut.label}</span>
      <kbd className="ml-4 shrink-0 inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md border border-border bg-muted text-[11px] font-mono font-medium text-foreground">
        {formatShortcut(shortcut)}
      </kbd>
    </div>
  );
}

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    shortcuts: SHORTCUTS.filter((s) => s.category === cat),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Navigate and control the chart with your keyboard</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {grouped.map(({ category, shortcuts }) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                {category}
              </h3>
              <div className="space-y-0">
                {shortcuts.map((s) => (
                  <ShortcutRow key={s.id} shortcut={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
