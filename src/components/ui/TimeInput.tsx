import * as React from 'react';
import { cn } from '@/lib/utils';

interface TimeInputProps {
  value: string; // "HH:MM" or ""
  onChange: (value: string) => void;
  className?: string;
}

function parseTimeValue(value: string): { hh: string; mm: string } {
  if (!value) return { hh: '', mm: '' };
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (match) return { hh: match[1].padStart(2, '0'), mm: match[2] };
  return { hh: '', mm: '' };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function assembleTime(hh: string, mm: string): string {
  if (hh.length === 2 && mm.length === 2) return `${hh}:${mm}`;
  return '';
}

export function TimeInput({ value, onChange, className }: TimeInputProps) {
  const parsed = parseTimeValue(value);
  const [hh, setHh] = React.useState(parsed.hh);
  const [mm, setMm] = React.useState(parsed.mm);

  const hhRef = React.useRef<HTMLInputElement>(null);
  const mmRef = React.useRef<HTMLInputElement>(null);

  // Sync from external value changes
  React.useEffect(() => {
    const p = parseTimeValue(value);
    setHh(p.hh);
    setMm(p.mm);
  }, [value]);

  const emitChange = (newHh: string, newMm: string) => {
    const assembled = assembleTime(newHh, newMm);
    if (assembled) onChange(assembled);
  };

  const handleChange = (segment: 'hh' | 'mm', raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2);

    let newHh = hh, newMm = mm;
    if (segment === 'hh') { newHh = digits; setHh(digits); }
    if (segment === 'mm') { newMm = digits; setMm(digits); }

    // Auto-advance
    if (segment === 'hh' && digits.length === 2) mmRef.current?.focus();

    emitChange(newHh, newMm);
  };

  const handleKeyDown = (segment: 'hh' | 'mm', e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      const val = segment === 'hh' ? hh : mm;
      if (val === '') {
        e.preventDefault();
        if (segment === 'mm') hhRef.current?.focus();
      }
    }
  };

  const handleBlur = (segment: 'hh' | 'mm') => {
    let newHh = hh, newMm = mm;

    if (segment === 'hh' && hh) {
      const n = clamp(parseInt(hh, 10), 0, 23);
      newHh = String(n).padStart(2, '0');
      setHh(newHh);
    }
    if (segment === 'mm' && mm) {
      const n = clamp(parseInt(mm, 10), 0, 59);
      newMm = String(n).padStart(2, '0');
      setMm(newMm);
    }

    emitChange(newHh, newMm);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').trim();
    // Try HH:MM or H:MM
    const match = text.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      e.preventDefault();
      const pHh = match[1].padStart(2, '0');
      const pMm = match[2];
      setHh(pHh); setMm(pMm);
      emitChange(pHh, pMm);
      mmRef.current?.focus();
    }
  };

  const segmentClass =
    'bg-transparent border-none outline-none text-center tabular-nums placeholder:text-muted-foreground/50 text-sm';

  return (
    <div
      className={cn(
        'flex h-10 items-center rounded-md border border-input bg-background px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className,
      )}
      onPaste={handlePaste}
    >
      <input
        ref={hhRef}
        value={hh}
        onChange={(e) => handleChange('hh', e.target.value)}
        onKeyDown={(e) => handleKeyDown('hh', e)}
        onBlur={() => handleBlur('hh')}
        placeholder="HH"
        inputMode="numeric"
        pattern="[0-9]*"
        className={cn(segmentClass, 'w-7')}
        maxLength={2}
      />
      <span className="text-muted-foreground/50 mx-0.5">:</span>
      <input
        ref={mmRef}
        value={mm}
        onChange={(e) => handleChange('mm', e.target.value)}
        onKeyDown={(e) => handleKeyDown('mm', e)}
        onBlur={() => handleBlur('mm')}
        placeholder="MM"
        inputMode="numeric"
        pattern="[0-9]*"
        className={cn(segmentClass, 'w-7')}
        maxLength={2}
      />
    </div>
  );
}
