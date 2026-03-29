/**
 * iCal (.ics) export for transit events
 * Generates a standard ICS file that can be imported into Apple Calendar, Google Calendar, etc.
 */

import type { TransitEvent } from './transitTimeline';

/** Format a date string (YYYY-MM-DD) to ICS date format (YYYYMMDD) */
function toICSDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/** Escape special characters for ICS text fields */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Generate a unique ID for each event */
function generateUID(event: TransitEvent, index: number): string {
  const hash = `${event.transitPlanet}-${event.natalPlanet}-${event.exactDate}-${index}`;
  return `${hash}@druzematch-astrologer`;
}

/** Aspect type symbols for human-readable summaries */
const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '\u260C',
  opposition: '\u260D',
  trine: '\u25B3',
  square: '\u25A1',
  sextile: '\u2731',
  quincunx: '\u26BB',
  semisextile: '\u26BA',
  semisquare: '\u2220',
  sesquisquare: '\u2A3E',
  quintile: 'Q',
  biquintile: 'bQ',
};

/**
 * Generate an ICS calendar string from transit events
 */
export function generateICS(events: TransitEvent[], personName: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const vevents = events.map((event, i) => {
    const symbol = ASPECT_SYMBOLS[event.aspectType.toLowerCase()] || event.aspectSymbol || '';
    const summary = `${event.transitPlanet} ${symbol} ${event.natalPlanet}`;
    const description = [
      `Transit ${event.transitPlanet} ${event.aspectType} Natal ${event.natalPlanet}`,
      `Nature: ${event.aspectNature}`,
      `Exact orb: ${event.exactOrb.toFixed(2)}°`,
      `Ingress: ${event.ingressDate}`,
      `Exact: ${event.exactDate}`,
      `Egress: ${event.egressDate}`,
      event.isActive ? 'Status: Currently Active' : '',
    ].filter(Boolean).join('\\n');

    return [
      'BEGIN:VEVENT',
      `UID:${generateUID(event, i)}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${toICSDate(event.exactDate)}`,
      `DTEND;VALUE=DATE:${toICSDate(event.egressDate)}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      `CATEGORIES:Astrology,Transits`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    ].join('\r\n');
  });

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DruzeMatch Astrologer//Transit Timeline//EN',
    `X-WR-CALNAME:${escapeICS(personName)}'s Transits`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');

  return calendar;
}

/**
 * Download transit events as an .ics file
 */
export function downloadTransitICS(events: TransitEvent[], personName: string): void {
  const ics = generateICS(events, personName);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${personName.replace(/\s+/g, '_')}_transits.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
