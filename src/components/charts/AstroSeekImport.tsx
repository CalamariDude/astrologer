/**
 * Unified Chart Import
 * Auto-detects and parses three formats:
 *
 * 1) AAF (Astrological Archive Format) — Astro-Seek "Database AAF export":
 *    #A93:*,george,m,6.1.1970,00:00,Downers Grove, USA, Illinois
 *    #B93:*,41n49,88w1,6hw00,0
 *
 * 2) Astro-Seek URLs:
 *    https://horoscopes.astro-seek.com/birth-chart-horoscope-online?n1=Jad&d1=17&m1=3&y1=1998&h1=9&i1=7&lat1=41.80&lon1=-88.05&city1=Downers+Grove
 *
 * 3) Astro.com "My Astro" profile list:
 *    Jad Zeineddine (m), 17 March 1998 at 9:07 , Downers Grove, IL (US)    Edit
 */

import React, { useState, useCallback } from 'react';
import { Loader2, Check, AlertCircle, MapPin, User, Calendar, Clock, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { geocodeLocation } from '@/utils/geocoding';
import type { ParsedPerson } from './AstroComImport';
import { parseAstroComText } from './AstroComImport';

// ---- AAF Parser ----

/**
 * Parse AAF coordinate notation: "41n49" → 41.8167, "88w1" → -88.0167
 * Format: {degrees}{n|s|e|w}{minutes}
 */
function parseAAFCoord(raw: string, isLon: boolean): number | null {
  const match = raw.match(/^(\d+)([nsew])(\d+)$/i);
  if (!match) return null;
  const degrees = parseInt(match[1], 10);
  const dir = match[2].toLowerCase();
  const minutes = parseInt(match[3], 10);
  const decimal = degrees + minutes / 60;

  if (isLon) {
    return dir === 'w' ? -decimal : decimal;
  }
  return dir === 's' ? -decimal : decimal;
}

function parseAAFText(text: string): ParsedPerson[] {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const results: ParsedPerson[] = [];

  // Pair #A and #B lines sequentially (IDs can be duplicated across entries)
  const pairs: { a: string; b?: string }[] = [];

  for (const line of lines) {
    const aMatch = line.match(/^#A\d+:(.*)/);
    if (aMatch) { pairs.push({ a: aMatch[1] }); continue; }
    const bMatch = line.match(/^#B\d+:(.*)/);
    if (bMatch && pairs.length > 0 && !pairs[pairs.length - 1].b) {
      pairs[pairs.length - 1].b = bMatch[1];
      continue;
    }
  }

  for (const pair of pairs) {
    const aParts = pair.a;
    const bParts = pair.b;

    // Parse #A line: *,name,gender,day.month.year,time,location...
    // Split and take positional fields; location is everything after time
    const aFields = aParts.split(',');
    if (aFields.length < 5) continue;

    // aFields[0] = flag (*), [1] = name, [2] = gender, [3] = date, [4] = time, [5..] = location
    const name = aFields[1]?.trim() || `Person ${id}`;
    const gender = (aFields[2]?.trim() || '').toUpperCase();
    const dateRaw = aFields[3]?.trim() || '';
    const timeRaw = aFields[4]?.trim() || '12:00';
    const locationParts = aFields.slice(5).map(s => s.trim()).filter(Boolean);
    const locationDisplay = locationParts.join(', ');

    // Parse date: day.month.year
    const dateMatch = dateRaw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!dateMatch) continue;
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];

    // Parse time
    const timeMatch = timeRaw.match(/^(\d{1,2}):(\d{2})$/);
    const time = timeMatch
      ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
      : '12:00';

    // Parse #B line for coordinates: *,lat,lon,tz,flag
    let lat: number | null = null;
    let lng: number | null = null;

    if (bParts) {
      const bFields = bParts.split(',');
      // bFields[0] = flag (*), [1] = lat, [2] = lon, [3] = tz, [4] = flag2
      if (bFields.length >= 3) {
        lat = parseAAFCoord(bFields[1]?.trim() || '', false);
        lng = parseAAFCoord(bFields[2]?.trim() || '', true);
      }
    }

    results.push({
      name,
      gender,
      date: `${year}-${month}-${day}`,
      time,
      locationRaw: locationDisplay,
      location: locationDisplay,
      lat,
      lng,
      geoStatus: lat !== null && lng !== null ? 'done' : 'pending',
    });
  }

  return results;
}

// ---- Astro-Seek URL Parser ----

function parseAstroSeekUrl(url: string): ParsedPerson[] {
  const results: ParsedPerson[] = [];

  let parsed: URL;
  try {
    const cleaned = url.trim();
    if (cleaned.startsWith('http')) {
      parsed = new URL(cleaned);
    } else if (cleaned.includes('=')) {
      parsed = new URL('https://example.com/?' + cleaned);
    } else {
      return [];
    }
  } catch {
    return [];
  }

  const p = parsed.searchParams;

  for (const suffix of ['1', '2']) {
    const day = p.get(`d${suffix}`);
    const month = p.get(`m${suffix}`);
    const year = p.get(`y${suffix}`);
    if (!day || !month || !year) continue;

    const hour = p.get(`h${suffix}`);
    const minute = p.get(`i${suffix}`);
    const lat = p.get(`lat${suffix}`);
    const lon = p.get(`lon${suffix}`);
    const name = p.get(`n${suffix}`) || `Person ${suffix}`;
    const city = p.get(`city${suffix}`) || '';

    const paddedDay = day.padStart(2, '0');
    const paddedMonth = month.padStart(2, '0');
    const paddedHour = (hour || '12').padStart(2, '0');
    const paddedMinute = (minute || '00').padStart(2, '0');

    const latNum = lat ? parseFloat(lat) : null;
    const lngNum = lon ? parseFloat(lon) : null;

    const locationDisplay = city
      ? decodeURIComponent(city.replace(/\+/g, ' '))
      : (latNum !== null && lngNum !== null ? `${latNum.toFixed(2)}, ${lngNum.toFixed(2)}` : 'Unknown');

    results.push({
      name: decodeURIComponent(name.replace(/\+/g, ' ')),
      gender: '',
      date: `${year}-${paddedMonth}-${paddedDay}`,
      time: `${paddedHour}:${paddedMinute}`,
      locationRaw: locationDisplay,
      location: locationDisplay,
      lat: latNum,
      lng: lngNum,
      geoStatus: latNum !== null && lngNum !== null ? 'done' : 'error',
    });
  }

  return results;
}

// ---- Unified Parser ----

type DetectedFormat = 'aaf' | 'url' | 'astrocom' | 'unknown';

function detectFormat(text: string): DetectedFormat {
  const trimmed = text.trim();
  if (/#A\d+:/.test(trimmed)) return 'aaf';
  if (/^https?:\/\//.test(trimmed) && /[?&][dnh]\d=/.test(trimmed)) return 'url';
  // Astro.com: "Name (m), DD Month YYYY at HH:MM"
  if (/\([mfMF]\)\s*,\s*\d{1,2}\s+\w+\s+\d{4}\s+at\s+\d/.test(trimmed)) return 'astrocom';
  // Fallback: try URL if it starts with http
  if (/^https?:\/\//.test(trimmed)) return 'url';
  return 'unknown';
}

function parseUnified(text: string): { persons: ParsedPerson[]; format: DetectedFormat } {
  const format = detectFormat(text);

  switch (format) {
    case 'aaf':
      return { persons: parseAAFText(text), format };
    case 'url': {
      const lines = text.split(/\n/).filter(l => l.trim());
      const persons: ParsedPerson[] = [];
      for (const line of lines) {
        persons.push(...parseAstroSeekUrl(line.trim()));
      }
      return { persons, format };
    }
    case 'astrocom':
      return { persons: parseAstroComText(text), format };
    default:
      // Try all parsers
      const aaf = parseAAFText(text);
      if (aaf.length > 0) return { persons: aaf, format: 'aaf' };
      const lines2 = text.split(/\n/).filter(l => l.trim());
      for (const line of lines2) {
        const urlR = parseAstroSeekUrl(line.trim());
        if (urlR.length > 0) return { persons: urlR, format: 'url' };
      }
      const astro = parseAstroComText(text);
      if (astro.length > 0) return { persons: astro, format: 'astrocom' };
      return { persons: [], format: 'unknown' };
  }
}

// ---- Component ----

interface ChartImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (persons: ParsedPerson[]) => void;
}

const FORMAT_LABELS: Record<DetectedFormat, string> = {
  aaf: 'Astro-Seek AAF',
  url: 'Astro-Seek URL',
  astrocom: 'Astro.com',
  unknown: '',
};

export function ChartImport({ isOpen, onClose, onImport }: ChartImportProps) {
  const [step, setStep] = useState<'paste' | 'confirm'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [parsed, setParsed] = useState<ParsedPerson[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [geocoding, setGeocoding] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat>('unknown');

  const handleParse = useCallback(() => {
    const { persons, format } = parseUnified(pasteText);
    if (persons.length === 0) return;

    setParsed(persons);
    setDetectedFormat(format);
    setSelected(new Set(persons.map((_, i) => i)));
    setStep('confirm');

    // Geocode entries that need it (astro.com format has no coordinates)
    const needsGeocode = persons.some(p => p.geoStatus === 'pending');
    if (needsGeocode) {
      setGeocoding(true);
      const geocodeAll = async () => {
        const updated = [...persons];
        await Promise.all(
          updated.map(async (person, i) => {
            if (person.geoStatus !== 'pending') return;
            updated[i] = { ...updated[i], geoStatus: 'loading' };
            setParsed([...updated]);
            try {
              const result = await geocodeLocation(person.location || person.locationRaw);
              if (result) {
                updated[i] = {
                  ...updated[i],
                  lat: result.lat,
                  lng: result.lng,
                  location: result.displayName,
                  geoStatus: 'done',
                };
              } else {
                updated[i] = { ...updated[i], geoStatus: 'error' };
              }
            } catch {
              updated[i] = { ...updated[i], geoStatus: 'error' };
            }
            setParsed([...updated]);
          })
        );
        setGeocoding(false);
      };
      geocodeAll();
    }
  }, [pasteText]);

  const toggleSelect = (index: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleImport = () => {
    const selectedPersons = [...selected]
      .sort((a, b) => a - b)
      .map(i => parsed[i])
      .filter(p => p.geoStatus === 'done');

    if (selectedPersons.length === 0) return;
    onImport(selectedPersons);
    handleReset();
  };

  const handleReset = () => {
    setStep('paste');
    setPasteText('');
    setParsed([]);
    setSelected(new Set());
    setGeocoding(false);
    setDetectedFormat('unknown');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const selectedReady = [...selected].every(i => parsed[i]?.geoStatus === 'done');
  const anySelected = selected.size > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5" />
            Import Charts
          </DialogTitle>
          <DialogDescription>
            {step === 'paste'
              ? 'Paste chart data from Astro-Seek or Astro.com. Format is detected automatically.'
              : <>
                  Found {parsed.length} profile{parsed.length !== 1 ? 's' : ''}
                  {detectedFormat !== 'unknown' && (
                    <span className="ml-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {FORMAT_LABELS[detectedFormat]}
                    </span>
                  )}
                </>
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'paste' ? (
          <div className="space-y-3 flex-1 min-h-0">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'Paste any of these formats:\n\n• Astro-Seek AAF export:\n#A93:*,George,m,6.1.1970,00:00,Chicago, USA\n#B93:*,41n49,87w39,6hw00,0\n\n• Astro-Seek URL:\nhttps://horoscopes.astro-seek.com/birth-chart-horoscope-online?n1=...\n\n• Astro.com profile list:\nJad (m), 17 March 1998 at 9:07 , Downers Grove, IL (US)'}
              className="w-full h-44 px-3 py-2 border rounded-md bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="text-xs text-muted-foreground space-y-2.5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div>
                  <p className="font-medium text-foreground/70 mb-0.5">From Astro-Seek</p>
                  <ol className="text-[11px] leading-snug text-muted-foreground/70 list-decimal list-inside space-y-0.5">
                    <li>Log in to <span className="font-medium">astro-seek.com</span></li>
                    <li>Go to <span className="font-medium">My Astro DataBase &rarr; Saved persons</span></li>
                    <li>Click <span className="font-medium">"Database backup (Export in AAF format)"</span> at the bottom</li>
                    <li>Select all the text, copy, and paste here</li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium text-foreground/70 mb-0.5">From Astro.com</p>
                  <ol className="text-[11px] leading-snug text-muted-foreground/70 list-decimal list-inside space-y-0.5">
                    <li>Log in to <span className="font-medium">astro.com</span></li>
                    <li>Go to <span className="font-medium">My Astro &rarr; Saved Astro Data</span></li>
                    <li>Select the profile lines you want</li>
                    <li>Copy and paste here</li>
                  </ol>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/50">
                You can also paste an Astro-Seek chart URL directly from the address bar.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
            {parsed.map((person, i) => {
              const isSelected = selected.has(i);
              const isReady = person.geoStatus === 'done';
              const isError = person.geoStatus === 'error';
              const isLoading = person.geoStatus === 'loading' || person.geoStatus === 'pending';

              return (
                <button
                  key={i}
                  onClick={() => toggleSelect(i)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  } ${!isReady && !isLoading ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{person.name}</span>
                        {person.gender && (
                          <span className="text-xs text-muted-foreground">({person.gender})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {person.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {person.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground flex-shrink-0" />
                        ) : isReady ? (
                          <MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                        )}
                        <span className={`truncate ${isError ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {isReady ? person.location : isError ? `Could not find: ${person.locationRaw}` : person.locationRaw}
                        </span>
                      </div>
                      {isReady && person.lat !== null && (
                        <p className="text-[10px] text-muted-foreground/60 pl-4">
                          {person.lat.toFixed(4)}, {person.lng?.toFixed(4)}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'confirm' && (
            <Button variant="outline" onClick={handleReset} className="mr-auto">
              Back
            </Button>
          )}
          {step === 'paste' ? (
            <Button onClick={handleParse} disabled={!pasteText.trim()}>
              Parse
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={!anySelected || !selectedReady || geocoding}
            >
              {geocoding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Locating...
                </>
              ) : (
                `Save ${selected.size} Chart${selected.size !== 1 ? 's' : ''}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
