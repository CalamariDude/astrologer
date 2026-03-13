/**
 * Profection Calculations
 *
 * Two methods supported:
 *
 * TRADITIONAL (default):
 *   Age 0 = Ascendant sign (1st house), birthday to birthday
 *   Age 1 = next sign (2nd house), etc.
 *   Time Lord = ruler of the profected sign
 *   This is the standard Hellenistic/medieval approach.
 *
 * MODERN (equinox-based):
 *   Birth → first spring equinox = Pisces (pre-period, variable length)
 *   1st equinox → 2nd equinox = Aries (year 1)
 *   ...cycles through all 12 signs in natural zodiac order
 */

import { ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';
import type { NatalChart } from '@/components/biwheel/types';

export type ProfectionMethod = 'traditional' | 'modern';

// Modern rulers (Pluto rules Scorpio, Uranus rules Aquarius, Neptune rules Pisces)
export const TRADITIONAL_RULERS: Record<string, { ruler: string; rulerName: string; rulerSymbol: string }> = {
  Aries: { ruler: 'mars', rulerName: 'Mars', rulerSymbol: '\u2642\uFE0E' },
  Taurus: { ruler: 'venus', rulerName: 'Venus', rulerSymbol: '\u2640\uFE0E' },
  Gemini: { ruler: 'mercury', rulerName: 'Mercury', rulerSymbol: '\u263F\uFE0E' },
  Cancer: { ruler: 'moon', rulerName: 'Moon', rulerSymbol: '\u263D\uFE0E' },
  Leo: { ruler: 'sun', rulerName: 'Sun', rulerSymbol: '\u2609\uFE0E' },
  Virgo: { ruler: 'mercury', rulerName: 'Mercury', rulerSymbol: '\u263F\uFE0E' },
  Libra: { ruler: 'venus', rulerName: 'Venus', rulerSymbol: '\u2640\uFE0E' },
  Scorpio: { ruler: 'pluto', rulerName: 'Pluto', rulerSymbol: '\u2647\uFE0E' },
  Sagittarius: { ruler: 'jupiter', rulerName: 'Jupiter', rulerSymbol: '\u2643\uFE0E' },
  Capricorn: { ruler: 'saturn', rulerName: 'Saturn', rulerSymbol: '\u2644\uFE0E' },
  Aquarius: { ruler: 'uranus', rulerName: 'Uranus', rulerSymbol: '\u2645\uFE0E' },
  Pisces: { ruler: 'neptune', rulerName: 'Neptune', rulerSymbol: '\u2646\uFE0E' },
};

// House topics for interpretation
export const HOUSE_TOPICS: Record<number, string> = {
  1: 'Self, identity, appearance, new beginnings',
  2: 'Money, possessions, values, self-worth',
  3: 'Communication, siblings, short trips, learning',
  4: 'Home, family, roots, emotional foundations',
  5: 'Romance, creativity, children, pleasure',
  6: 'Health, daily routine, service, work habits',
  7: 'Partnerships, marriage, open enemies, contracts',
  8: 'Transformation, shared resources, intimacy, death/rebirth',
  9: 'Travel, higher education, philosophy, beliefs',
  10: 'Career, public reputation, authority, achievements',
  11: 'Friends, groups, hopes, wishes, community',
  12: 'Spirituality, isolation, hidden enemies, unconscious',
};

export interface ProfectionYear {
  age: number;
  house: number; // 1-12
  sign: string;
  signSymbol: string;
  element: string;
  timeLord: { ruler: string; rulerName: string; rulerSymbol: string };
  topics: string;
  isCurrent: boolean;
  startDate: Date;
  endDate: Date;
  months: ProfectionMonth[];
}

export interface ProfectionMonth {
  monthIndex: number; // 0-11 within the year
  house: number;
  sign: string;
  signSymbol: string;
  timeLord: { ruler: string; rulerName: string; rulerSymbol: string };
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}

/**
 * Calculate the vernal (March) equinox date for a given year
 * Uses the Meeus algorithm approximation
 */
function getVernalEquinox(year: number): Date {
  const T = (year - 2000) / 1000;
  const JDE = 2451623.80984 + 365242.37404 * T + 0.05169 * T * T - 0.00411 * T * T * T - 0.00057 * T * T * T * T;
  // JD 2440587.5 = Unix epoch (Jan 1, 1970 00:00:00 UTC)
  const msFromEpoch = (JDE - 2440587.5) * 86400000;
  return new Date(msFromEpoch);
}

/**
 * Generate 12 equal monthly profections within a year
 */
function generateMonths(yearStart: Date, yearEnd: Date, startSignIndex: number, now: Date): ProfectionMonth[] {
  const totalMs = yearEnd.getTime() - yearStart.getTime();
  const monthMs = totalMs / 12;
  const months: ProfectionMonth[] = [];

  for (let m = 0; m < 12; m++) {
    const monthSignIndex = (startSignIndex + m) % 12;
    const sign = ZODIAC_SIGNS[monthSignIndex];
    const timeLord = TRADITIONAL_RULERS[sign.name] || TRADITIONAL_RULERS.Aries;
    const monthStart = new Date(yearStart.getTime() + m * monthMs);
    const monthEnd = new Date(yearStart.getTime() + (m + 1) * monthMs);
    const isCurrent = now >= monthStart && now < monthEnd;

    months.push({
      monthIndex: m,
      house: monthSignIndex + 1,
      sign: sign.name,
      signSymbol: sign.symbol,
      timeLord,
      startDate: monthStart,
      endDate: monthEnd,
      isCurrent,
    });
  }

  return months;
}

/**
 * Traditional Profections (Hellenistic/Medieval)
 * Birthday-to-birthday years, starting from the Ascendant sign
 * Age 0 = 1st house (ASC sign), Age 1 = 2nd house, etc.
 */
function calculateTraditionalProfections(
  birth: Date,
  chart: NatalChart,
  now: Date
): { currentAge: number; years: ProfectionYear[]; currentYear: ProfectionYear } {
  // Get Ascendant sign index
  const ascLong = chart.planets?.ascendant?.longitude
    ?? (chart as any).angles?.ascendant
    ?? 0;
  const ascSignIdx = Math.floor(ascLong / 30) % 12;

  // Chronological age
  const ageMs = now.getTime() - birth.getTime();
  const currentAge = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));

  const maxAge = Math.max(currentAge + 10, 96);
  const years: ProfectionYear[] = [];

  for (let age = 0; age <= maxAge; age++) {
    // Birthday to birthday boundaries
    const yearStart = new Date(birth);
    yearStart.setFullYear(birth.getFullYear() + age);
    const yearEnd = new Date(birth);
    yearEnd.setFullYear(birth.getFullYear() + age + 1);

    // Profected sign = ASC sign + age steps
    const signIndex = (ascSignIdx + age) % 12;
    const house = (age % 12) + 1;
    const sign = ZODIAC_SIGNS[signIndex];
    const timeLord = TRADITIONAL_RULERS[sign.name] || TRADITIONAL_RULERS.Aries;
    const isCurrent = now >= yearStart && now < yearEnd;

    years.push({
      age,
      house,
      sign: sign.name,
      signSymbol: sign.symbol,
      element: sign.element,
      timeLord,
      topics: HOUSE_TOPICS[house],
      isCurrent,
      startDate: yearStart,
      endDate: yearEnd,
      months: generateMonths(yearStart, yearEnd, signIndex, now),
    });
  }

  const currentYear = years.find(y => y.isCurrent) || years[0];
  return { currentAge, years, currentYear };
}

/**
 * Modern Profection Cycle (equinox-based)
 * Years measured from vernal equinox to vernal equinox
 * Signs fixed to natural zodiac order (not natal chart cusps)
 */
function calculateModernProfections(
  birth: Date,
  chart: NatalChart,
  now: Date
): { currentAge: number; years: ProfectionYear[]; currentYear: ProfectionYear } {
  // Chronological age
  const ageMs = now.getTime() - birth.getTime();
  const currentAge = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));

  // Find first vernal equinox after birth
  let firstEqYear = birth.getFullYear();
  let firstEquinox = getVernalEquinox(firstEqYear);
  if (firstEquinox.getTime() <= birth.getTime()) {
    firstEqYear++;
    firstEquinox = getVernalEquinox(firstEqYear);
  }

  // Determine current equinox year number
  let currentYearNumber = 0;
  if (now.getTime() >= firstEquinox.getTime()) {
    for (let n = 1; ; n++) {
      const nextEq = getVernalEquinox(firstEqYear + n);
      if (now.getTime() < nextEq.getTime()) {
        currentYearNumber = n;
        break;
      }
    }
  }

  const maxYear = Math.max(currentYearNumber + 10, 96);
  const years: ProfectionYear[] = [];

  // Year 0: Pisces pre-period (birth → first equinox)
  const piscesSign = ZODIAC_SIGNS[11]; // Pisces
  const piscesTimeLord = TRADITIONAL_RULERS[piscesSign.name];
  years.push({
    age: 0,
    house: 12,
    sign: piscesSign.name,
    signSymbol: piscesSign.symbol,
    element: piscesSign.element,
    timeLord: piscesTimeLord,
    topics: HOUSE_TOPICS[12],
    isCurrent: now >= birth && now < firstEquinox,
    startDate: birth,
    endDate: firstEquinox,
    months: generateMonths(birth, firstEquinox, 11, now),
  });

  // Years 1..maxYear: equinox to equinox
  for (let n = 1; n <= maxYear; n++) {
    const eqStart = getVernalEquinox(firstEqYear + n - 1);
    const eqEnd = getVernalEquinox(firstEqYear + n);
    const signIndex = (n - 1) % 12; // 0=Aries, 1=Taurus, ..., 11=Pisces
    const house = signIndex + 1;
    const sign = ZODIAC_SIGNS[signIndex];
    const timeLord = TRADITIONAL_RULERS[sign.name] || TRADITIONAL_RULERS.Aries;
    const isCurrent = now >= eqStart && now < eqEnd;

    years.push({
      age: n,
      house,
      sign: sign.name,
      signSymbol: sign.symbol,
      element: sign.element,
      timeLord,
      topics: HOUSE_TOPICS[house],
      isCurrent,
      startDate: eqStart,
      endDate: eqEnd,
      months: generateMonths(eqStart, eqEnd, signIndex, now),
    });
  }

  const currentYear = years.find(y => y.isCurrent) || years[0];
  return { currentAge, years, currentYear };
}

/**
 * Calculate profections using the specified method
 * @param method - 'traditional' (ASC-based, birthday-to-birthday) or 'modern' (equinox-based, natural zodiac)
 */
export function calculateProfections(
  birthDate: string | Date,
  chart: NatalChart,
  referenceDate: Date = new Date(),
  method: ProfectionMethod = 'traditional'
): {
  currentAge: number;
  years: ProfectionYear[];
  currentYear: ProfectionYear;
} {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const now = referenceDate;

  if (method === 'modern') {
    return calculateModernProfections(birth, chart, now);
  }
  return calculateTraditionalProfections(birth, chart, now);
}
