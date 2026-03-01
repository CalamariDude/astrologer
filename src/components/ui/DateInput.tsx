import * as React from 'react';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  className?: string;
}

function parseDateValue(value: string): { mm: string; dd: string; yyyy: string } {
  if (!value) return { mm: '', dd: '', yyyy: '' };
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return { mm: match[2], dd: match[3], yyyy: match[1] };
  return { mm: '', dd: '', yyyy: '' };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function assembleDate(mm: string, dd: string, yyyy: string): string {
  if (mm.length === 2 && dd.length === 2 && yyyy.length === 4) {
    return `${yyyy}-${mm}-${dd}`;
  }
  return '';
}

export function DateInput({ value, onChange, className }: DateInputProps) {
  const parsed = parseDateValue(value);
  const [mm, setMm] = React.useState(parsed.mm);
  const [dd, setDd] = React.useState(parsed.dd);
  const [yyyy, setYyyy] = React.useState(parsed.yyyy);

  const mmRef = React.useRef<HTMLInputElement>(null);
  const ddRef = React.useRef<HTMLInputElement>(null);
  const yyyyRef = React.useRef<HTMLInputElement>(null);

  // Sync from external value changes
  React.useEffect(() => {
    const p = parseDateValue(value);
    setMm(p.mm);
    setDd(p.dd);
    setYyyy(p.yyyy);
  }, [value]);

  const emitChange = (newMm: string, newDd: string, newYyyy: string) => {
    const assembled = assembleDate(newMm, newDd, newYyyy);
    if (assembled) onChange(assembled);
  };

  const handleChange = (segment: 'mm' | 'dd' | 'yyyy', raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const maxLen = segment === 'yyyy' ? 4 : 2;
    const clamped = digits.slice(0, maxLen);

    let newMm = mm, newDd = dd, newYyyy = yyyy;
    if (segment === 'mm') { newMm = clamped; setMm(clamped); }
    if (segment === 'dd') { newDd = clamped; setDd(clamped); }
    if (segment === 'yyyy') { newYyyy = clamped; setYyyy(clamped); }

    // Auto-advance
    if (segment === 'mm' && clamped.length === 2) ddRef.current?.focus();
    if (segment === 'dd' && clamped.length === 2) yyyyRef.current?.focus();

    emitChange(newMm, newDd, newYyyy);
  };

  const handleKeyDown = (segment: 'mm' | 'dd' | 'yyyy', e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      const val = segment === 'mm' ? mm : segment === 'dd' ? dd : yyyy;
      if (val === '') {
        e.preventDefault();
        if (segment === 'dd') mmRef.current?.focus();
        if (segment === 'yyyy') ddRef.current?.focus();
      }
    }
  };

  const handleBlur = (segment: 'mm' | 'dd' | 'yyyy') => {
    let newMm = mm, newDd = dd, newYyyy = yyyy;

    if (segment === 'mm' && mm) {
      const n = clamp(parseInt(mm, 10), 1, 12);
      newMm = String(n).padStart(2, '0');
      setMm(newMm);
    }
    if (segment === 'dd' && dd) {
      const n = clamp(parseInt(dd, 10), 1, 31);
      newDd = String(n).padStart(2, '0');
      setDd(newDd);
    }
    if (segment === 'yyyy' && yyyy && yyyy.length === 4) {
      const n = clamp(parseInt(yyyy, 10), 1900, 2100);
      newYyyy = String(n);
      setYyyy(newYyyy);
    }

    emitChange(newMm, newDd, newYyyy);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').trim();
    // Try MM/DD/YYYY or M/D/YYYY
    let match = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (match) {
      e.preventDefault();
      const pMm = match[1].padStart(2, '0');
      const pDd = match[2].padStart(2, '0');
      const pYyyy = match[3];
      setMm(pMm); setDd(pDd); setYyyy(pYyyy);
      emitChange(pMm, pDd, pYyyy);
      yyyyRef.current?.focus();
      return;
    }
    // Try YYYY-MM-DD
    match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      e.preventDefault();
      const pMm = match[2];
      const pDd = match[3];
      const pYyyy = match[1];
      setMm(pMm); setDd(pDd); setYyyy(pYyyy);
      emitChange(pMm, pDd, pYyyy);
      yyyyRef.current?.focus();
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
      <span className="text-muted-foreground/50 mx-0.5">/</span>
      <input
        ref={ddRef}
        value={dd}
        onChange={(e) => handleChange('dd', e.target.value)}
        onKeyDown={(e) => handleKeyDown('dd', e)}
        onBlur={() => handleBlur('dd')}
        placeholder="DD"
        inputMode="numeric"
        pattern="[0-9]*"
        className={cn(segmentClass, 'w-7')}
        maxLength={2}
      />
      <span className="text-muted-foreground/50 mx-0.5">/</span>
      <input
        ref={yyyyRef}
        value={yyyy}
        onChange={(e) => handleChange('yyyy', e.target.value)}
        onKeyDown={(e) => handleKeyDown('yyyy', e)}
        onBlur={() => handleBlur('yyyy')}
        placeholder="YYYY"
        inputMode="numeric"
        pattern="[0-9]*"
        className={cn(segmentClass, 'w-10')}
        maxLength={4}
      />
    </div>
  );
}
