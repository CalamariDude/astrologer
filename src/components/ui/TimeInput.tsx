import * as React from 'react';
import { cn } from '@/lib/utils';

interface TimeInputProps {
  value: string; // "HH:MM" 24h format
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  unstyled?: boolean;
}

function to12h(hh24: number): { hh12: number; period: 'AM' | 'PM' } {
  const period = hh24 >= 12 ? 'PM' : 'AM';
  let hh12 = hh24 % 12;
  if (hh12 === 0) hh12 = 12;
  return { hh12, period };
}

function to24h(hh12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return hh12 === 12 ? 0 : hh12;
  return hh12 === 12 ? 12 : hh12 + 12;
}

function parseTimeValue(value: string): { hh: string; mm: string; period: 'AM' | 'PM' } {
  if (!value) return { hh: '', mm: '', period: 'AM' };
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hh24 = parseInt(match[1], 10);
    const { hh12, period } = to12h(hh24);
    return { hh: String(hh12), mm: match[2], period };
  }
  return { hh: '', mm: '', period: 'AM' };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function TimeInput({ value, onChange, className, style, unstyled }: TimeInputProps) {
  const parsed = parseTimeValue(value);
  const [hh, setHh] = React.useState(parsed.hh);
  const [mm, setMm] = React.useState(parsed.mm);
  const [period, setPeriod] = React.useState<'AM' | 'PM'>(parsed.period);

  const hhRef = React.useRef<HTMLInputElement>(null);
  const mmRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const p = parseTimeValue(value);
    setHh(p.hh);
    setMm(p.mm);
    setPeriod(p.period);
  }, [value]);

  const emitChange = (newHh: string, newMm: string, newPeriod: 'AM' | 'PM') => {
    if (newHh && newMm.length === 2) {
      const h12 = clamp(parseInt(newHh, 10), 1, 12);
      const hh24 = to24h(h12, newPeriod);
      const m = clamp(parseInt(newMm, 10), 0, 59);
      onChange(`${String(hh24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  };

  const handleChange = (segment: 'hh' | 'mm', raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    let newHh = hh, newMm = mm;
    if (segment === 'hh') { newHh = digits; setHh(digits); }
    if (segment === 'mm') { newMm = digits; setMm(digits); }
    if (segment === 'hh' && digits.length === 2) mmRef.current?.focus();
    emitChange(newHh, newMm, period);
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
      const n = clamp(parseInt(hh, 10), 1, 12);
      newHh = String(n);
      setHh(newHh);
    }
    if (segment === 'mm' && mm) {
      const n = clamp(parseInt(mm, 10), 0, 59);
      newMm = String(n).padStart(2, '0');
      setMm(newMm);
    }
    emitChange(newHh, newMm, period);
  };

  const togglePeriod = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    emitChange(hh, mm, newPeriod);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').trim();
    const match = text.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (match) {
      e.preventDefault();
      let pHh = parseInt(match[1], 10);
      let pPeriod = period;
      if (match[3]) {
        pPeriod = match[3].toUpperCase() as 'AM' | 'PM';
        pHh = clamp(pHh, 1, 12);
      } else if (pHh > 12) {
        const conv = to12h(pHh);
        pHh = conv.hh12;
        pPeriod = conv.period;
      }
      setHh(String(pHh));
      setMm(match[2]);
      setPeriod(pPeriod);
      emitChange(String(pHh), match[2], pPeriod);
      mmRef.current?.focus();
    }
  };

  const segStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
    color: 'inherit',
    fontSize: 'inherit',
    width: '1.6em',
    padding: 0,
  };

  return (
    <div
      className={unstyled
        ? cn('flex items-center gap-0.5', className)
        : cn(
            'flex items-center rounded-md border border-input bg-background px-3 gap-0.5 text-sm h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            className,
          )
      }
      style={style}
      onPaste={handlePaste}
    >
      <input
        ref={hhRef}
        value={hh}
        onChange={(e) => handleChange('hh', e.target.value)}
        onKeyDown={(e) => handleKeyDown('hh', e)}
        onBlur={() => handleBlur('hh')}
        placeholder="12"
        inputMode="numeric"
        pattern="[0-9]*"
        style={segStyle}
        maxLength={2}
      />
      <span style={{ opacity: 0.5, color: 'inherit' }}>:</span>
      <input
        ref={mmRef}
        value={mm}
        onChange={(e) => handleChange('mm', e.target.value)}
        onKeyDown={(e) => handleKeyDown('mm', e)}
        onBlur={() => handleBlur('mm')}
        placeholder="00"
        inputMode="numeric"
        pattern="[0-9]*"
        style={segStyle}
        maxLength={2}
      />
      <button
        type="button"
        onClick={togglePeriod}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.85em',
          color: 'inherit',
          opacity: 0.7,
          padding: '1px 4px',
          borderRadius: 3,
          marginLeft: 2,
          lineHeight: 1,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
      >
        {period}
      </button>
    </div>
  );
}
