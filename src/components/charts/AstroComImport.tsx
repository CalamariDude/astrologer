/**
 * Astro.com Import
 * Parses pasted text from astro.com's "My Astro" saved charts list
 * and lets users confirm before importing birth data.
 *
 * Expected format (one per line):
 *   Jad Zeineddine (m), 17 March 1998 at 9:07 , Downers Grove, IL (US)    Edit
 *   J (m), 17 March 1998 at 9:07 , Downers Grove, IL (US)    Edit    move J to top
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

// ---- Parser ----

const MONTH_MAP: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04',
  jun: '06', jul: '07', aug: '08', sep: '09',
  oct: '10', nov: '11', dec: '12',
};

export interface ParsedPerson {
  name: string;
  gender: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  locationRaw: string;
  location: string;
  lat: number | null;
  lng: number | null;
  geoStatus: 'pending' | 'loading' | 'done' | 'error';
}

/**
 * Parse a single line from astro.com's profile list.
 * Handles formats like:
 *   Name (m), 17 March 1998 at 9:07 , City, State (CC)    Edit ...
 *   Name (f), 5 Jan 2000 at 14:30 , London (GB)    Edit ...
 */
function parseLine(line: string): ParsedPerson | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 10) return null;

  // Pattern: Name (gender), DD Month YYYY at HH:MM , Location ... Edit
  const match = trimmed.match(
    /^(.+?)\s*\(([mfMF])\)\s*,\s*(\d{1,2})\s+(\w+)\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*,\s*(.+?)(?:\s{2,}Edit|\s+Edit\s|$)/i
  );

  if (!match) return null;

  const [, name, gender, day, monthStr, year, hour, minute, locationRaw] = match;

  const monthNum = MONTH_MAP[monthStr.toLowerCase()];
  if (!monthNum) return null;

  const paddedDay = day.padStart(2, '0');
  const paddedHour = hour.padStart(2, '0');

  // Clean up location: remove trailing whitespace, "move X to top", etc.
  let cleanLocation = locationRaw
    .replace(/\s*move\s+.+?\s+to\s+top\s*/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Remove country code parens for geocoding but keep for display
  // e.g. "Downers Grove, IL (US)" → geocode as "Downers Grove, IL, US"
  const geoQuery = cleanLocation.replace(/\((\w+)\)/, '$1');

  return {
    name: name.trim(),
    gender: gender.toUpperCase(),
    date: `${year}-${monthNum}-${paddedDay}`,
    time: `${paddedHour}:${minute}`,
    locationRaw: cleanLocation,
    location: geoQuery,
    lat: null,
    lng: null,
    geoStatus: 'pending',
  };
}

export function parseAstroComText(text: string): ParsedPerson[] {
  // Split by newlines, but also handle entries pasted as a single block
  // (astro.com sometimes copies with weird whitespace)
  const lines = text.split(/\n/).filter(l => l.trim().length > 0);
  const results: ParsedPerson[] = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) results.push(parsed);
  }

  return results;
}

// ---- Component ----

interface AstroComImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (persons: ParsedPerson[]) => void;
}

export function AstroComImport({ isOpen, onClose, onImport }: AstroComImportProps) {
  const [step, setStep] = useState<'paste' | 'confirm'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [parsed, setParsed] = useState<ParsedPerson[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [geocoding, setGeocoding] = useState(false);

  const handleParse = useCallback(() => {
    const results = parseAstroComText(pasteText);
    if (results.length === 0) return;

    setParsed(results);
    // Auto-select all parsed profiles
    const initial = new Set<number>(results.map((_, i) => i));
    setSelected(initial);
    setStep('confirm');

    // Start geocoding all entries
    setGeocoding(true);
    const geocodeAll = async () => {
      const updated = [...results];
      await Promise.all(
        updated.map(async (person, i) => {
          updated[i] = { ...updated[i], geoStatus: 'loading' };
          setParsed([...updated]);
          try {
            const result = await geocodeLocation(person.location);
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
  }, [pasteText]);

  const toggleSelect = (index: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
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
            Import from Astro.com
          </DialogTitle>
          <DialogDescription>
            {step === 'paste'
              ? 'Paste your profile list from astro.com\'s "My Astro" page.'
              : `Found ${parsed.length} profile${parsed.length !== 1 ? 's' : ''}. Selected charts will be saved.`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'paste' ? (
          <div className="space-y-3 flex-1 min-h-0">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'Paste from astro.com, e.g.:\n\nJad Zeineddine (m), 17 March 1998 at 9:07 , Downers Grove, IL (US)    Edit'}
              className="w-full h-40 px-3 py-2 border rounded-md bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Go to <span className="font-medium">astro.com &rarr; My Astro &rarr; Saved Astro Data</span></p>
              <p>Select and copy the lines for the profiles you want, then paste here.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
            {parsed.map((person, i) => {
              const isSelected = selected.has(i);
              const isReady = person.geoStatus === 'done';
              const isError = person.geoStatus === 'error';
              const isLoading = person.geoStatus === 'loading' || person.geoStatus === 'pending';
              const selectionLabel = null;

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
                      {/* Name + gender */}
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{person.name}</span>
                        <span className="text-xs text-muted-foreground">({person.gender})</span>
                      </div>
                      {/* Date + time */}
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
                      {/* Location */}
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
                    {/* Selection indicator */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      {selectionLabel && (
                        <span className="text-[10px] font-medium text-primary">{selectionLabel}</span>
                      )}
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
            <Button
              onClick={handleParse}
              disabled={!pasteText.trim()}
            >
              Parse Profiles
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
