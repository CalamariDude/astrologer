import { swissEphemeris } from '@/api/swissEphemeris';
import { detectTransitEvents } from '@/lib/transitTimeline';
import type { NatalChart } from '@/components/biwheel/types';
import type { Intent, ResolvedHit, EphemerisEntry, Body } from './types';

const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0, semisextile: 30, semisquare: 45, sextile: 60,
  square: 90, trine: 120, sesquiquadrate: 135, quincunx: 150, opposition: 180,
};

const DEFAULT_WINDOW_YEARS = 2;
const EXPANDED_WINDOW_YEARS = 8;

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftYears(d: Date, years: number): Date {
  const out = new Date(d);
  out.setFullYear(out.getFullYear() + years);
  return out;
}

async function fetchEphemeris(start: Date, end: Date, step: 'daily' | 'weekly' = 'daily'): Promise<EphemerisEntry[]> {
  const data = await swissEphemeris.ephemeris({
    start_date: fmt(start), end_date: fmt(end), step,
  });
  if (data?.error) throw new Error(data.error);
  return (data.entries || []) as EphemerisEntry[];
}

function pickWindow(direction: 'next' | 'prev', years: number): { start: Date; end: Date } {
  const now = new Date();
  if (direction === 'prev') {
    return { start: shiftYears(now, -years), end: now };
  }
  return { start: now, end: shiftYears(now, years) };
}

function findEntryFor(entries: EphemerisEntry[], body: Body, dateGE?: string): { i: number; entry: EphemerisEntry } | null {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (dateGE && e.date < dateGE) continue;
    if (e.planets.some(p => p.planet === body)) return { i, entry: e };
  }
  return null;
}

function planetLon(entry: EphemerisEntry, body: Body): number | null {
  const p = entry.planets.find(p => p.planet === body);
  return p ? p.longitude : null;
}

function planetSign(entry: EphemerisEntry, body: Body): string | null {
  const p = entry.planets.find(p => p.planet === body);
  return p ? p.sign : null;
}

function planetRetro(entry: EphemerisEntry, body: Body): boolean | null {
  const p = entry.planets.find(p => p.planet === body);
  return p ? p.retrograde : null;
}

// Smallest angular distance between two longitudes in degrees, [0, 180]
function angularDistance(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

async function resolveSignIngress(intent: Extract<Intent, { kind: 'sign_ingress' }>): Promise<ResolvedHit | null> {
  for (const years of [DEFAULT_WINDOW_YEARS, EXPANDED_WINDOW_YEARS]) {
    const { start, end } = pickWindow(intent.direction, years);
    const entries = await fetchEphemeris(start, end, 'daily');
    const ordered = intent.direction === 'prev' ? [...entries].reverse() : entries;

    let prevSign: string | null = null;
    for (const e of ordered) {
      const sign = planetSign(e, intent.body);
      if (!sign) continue;
      if (sign === intent.sign && prevSign !== intent.sign && prevSign !== null) {
        return {
          date: e.date,
          view: 'transit',
          summary: `${intent.body} ${intent.direction === 'prev' ? 'last entered' : 'enters'} ${intent.sign} on ${e.date}`,
          intent,
        };
      }
      prevSign = sign;
    }
  }
  return null;
}

async function resolveAspectTransitToNatal(
  intent: Extract<Intent, { kind: 'aspect' }>,
  natalChart: NatalChart | undefined,
): Promise<ResolvedHit | null> {
  if (!natalChart) {
    return { date: '', view: 'transit', intent,
      summary: `Need a natal chart to find ${intent.transit} ${intent.aspect} natal ${intent.target}` };
  }
  for (const years of [DEFAULT_WINDOW_YEARS, EXPANDED_WINDOW_YEARS]) {
    const { start, end } = pickWindow(intent.direction, years);
    const entries = await fetchEphemeris(start, end, 'daily');
    const events = detectTransitEvents(entries, natalChart);
    const today = fmt(new Date());
    const targetKey = intent.target.toLowerCase();

    const candidates = events.filter(ev =>
      ev.transitPlanet === intent.transit &&
      ev.aspectType === intent.aspect &&
      ev.natalPlanet === targetKey
    );
    if (candidates.length === 0) continue;

    const future = candidates.filter(c => c.exactDate >= today);
    const past = candidates.filter(c => c.exactDate < today).sort((a, b) => b.exactDate.localeCompare(a.exactDate));
    const pick = intent.direction === 'prev' ? past[0] : future[0];
    if (!pick) continue;

    return {
      date: pick.exactDate,
      view: 'transit',
      highlightId: `${pick.transitPlanet}-${pick.natalPlanet}-${pick.aspectType}-${pick.exactDate}`,
      summary: `${intent.transit} ${intent.aspect} natal ${intent.target} exact on ${pick.exactDate}`,
      intent,
    };
  }
  return null;
}

async function resolveAspectSky(intent: Extract<Intent, { kind: 'aspect' }>): Promise<ResolvedHit | null> {
  const target = ASPECT_ANGLES[intent.aspect];
  for (const years of [DEFAULT_WINDOW_YEARS, EXPANDED_WINDOW_YEARS]) {
    const { start, end } = pickWindow(intent.direction, years);
    const entries = await fetchEphemeris(start, end, 'daily');
    const ordered = intent.direction === 'prev' ? [...entries].reverse() : entries;

    let bestIdx = -1;
    let bestOrb = Infinity;
    for (let i = 0; i < ordered.length; i++) {
      const e = ordered[i];
      const lonA = planetLon(e, intent.transit);
      const lonB = planetLon(e, intent.target);
      if (lonA == null || lonB == null) continue;
      const orb = Math.abs(angularDistance(lonA, lonB) - target);
      if (orb < bestOrb && orb < 1.5) {
        bestOrb = orb;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      const e = ordered[bestIdx];
      return {
        date: e.date,
        view: 'transit',
        summary: `${intent.transit} ${intent.aspect} ${intent.target} (sky) exact near ${e.date}`,
        intent,
      };
    }
  }
  return null;
}

async function resolveRetrograde(intent: Extract<Intent, { kind: 'retrograde' }>): Promise<ResolvedHit | null> {
  for (const years of [DEFAULT_WINDOW_YEARS, EXPANDED_WINDOW_YEARS]) {
    const { start, end } = pickWindow(intent.direction, years);
    const entries = await fetchEphemeris(start, end, 'daily');
    const ordered = intent.direction === 'prev' ? [...entries].reverse() : entries;

    let prevRetro: boolean | null = null;
    for (const e of ordered) {
      const retro = planetRetro(e, intent.body);
      if (retro == null) continue;
      if (intent.phase === 'station_retrograde' && retro && prevRetro === false) {
        return { date: e.date, view: 'transit', intent,
          summary: `${intent.body} stations retrograde on ${e.date}` };
      }
      if (intent.phase === 'station_direct' && !retro && prevRetro === true) {
        return { date: e.date, view: 'transit', intent,
          summary: `${intent.body} stations direct on ${e.date}` };
      }
      if (intent.phase === 'period' && retro && prevRetro === false) {
        return { date: e.date, view: 'transit', intent,
          summary: `${intent.body} retrograde period begins ${e.date}` };
      }
      prevRetro = retro;
    }
  }
  return null;
}

async function resolveMoonPhase(intent: Extract<Intent, { kind: 'moon_phase' }>): Promise<ResolvedHit | null> {
  const targetAngle =
    intent.phase === 'new' ? 0
    : intent.phase === 'first_quarter' ? 90
    : intent.phase === 'full' ? 180
    : 270;

  const { start, end } = pickWindow(intent.direction, 1);
  const entries = await fetchEphemeris(start, end, 'daily');
  const ordered = intent.direction === 'prev' ? [...entries].reverse() : entries;

  let bestIdx = -1;
  let bestOrb = Infinity;
  for (let i = 0; i < ordered.length; i++) {
    const e = ordered[i];
    const moonLon = planetLon(e, 'Moon');
    const sunLon = planetLon(e, 'Sun');
    if (moonLon == null || sunLon == null) continue;
    const phase = (moonLon - sunLon + 360) % 360;
    const orb = Math.min(Math.abs(phase - targetAngle), 360 - Math.abs(phase - targetAngle));
    if (orb < bestOrb) {
      bestOrb = orb;
      bestIdx = i;
      if (orb < 6) break; // Moon moves ~13°/day so 6° orb means within half a day
    }
  }
  if (bestIdx < 0) return null;
  const e = ordered[bestIdx];
  const label = intent.phase.replace('_', ' ');
  return { date: e.date, view: 'transit', intent,
    summary: `${intent.direction === 'prev' ? 'Last' : 'Next'} ${label} moon: ${e.date}` };
}

export async function resolveIntent(intent: Intent, natalChart?: NatalChart): Promise<ResolvedHit | null> {
  switch (intent.kind) {
    case 'sign_ingress': return resolveSignIngress(intent);
    case 'aspect':
      return intent.scope === 'transit_to_natal'
        ? resolveAspectTransitToNatal(intent, natalChart)
        : resolveAspectSky(intent);
    case 'retrograde': return resolveRetrograde(intent);
    case 'moon_phase': return resolveMoonPhase(intent);
    case 'house_ingress':
      return { date: '', view: 'natal', intent,
        summary: 'House ingress search is not yet supported.' };
    case 'unsupported':
      return { date: '', view: 'transit', intent,
        summary: intent.reason || 'Query not understood.' };
  }
}
