/**
 * Daily Profections Panel
 * Annual, monthly, and daily profections with time lord identification
 * Uses traditional rulership scheme
 */

import { useMemo, useState } from 'react';
import { ToolGuide } from './ToolGuide';

const SYMBOL_FONT = { fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif" };

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  natalChart: {
    planets: Record<string, { longitude: number; sign: string; retrograde?: boolean; house?: number }>;
    houses?: { cusps?: number[]; ascendant?: number; mc?: number };
  };
  birthDate: string; // YYYY-MM-DD
  name?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '\u2648\uFE0E', Taurus: '\u2649\uFE0E', Gemini: '\u264A\uFE0E', Cancer: '\u264B\uFE0E',
  Leo: '\u264C\uFE0E', Virgo: '\u264D\uFE0E', Libra: '\u264E\uFE0E', Scorpio: '\u264F\uFE0E',
  Sagittarius: '\u2650\uFE0E', Capricorn: '\u2651\uFE0E', Aquarius: '\u2652\uFE0E', Pisces: '\u2653\uFE0E',
};

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '\u2609\uFE0E', moon: '\u263D\uFE0E', mercury: '\u263F\uFE0E', venus: '\u2640\uFE0E',
  mars: '\u2642\uFE0E', jupiter: '\u2643\uFE0E', saturn: '\u2644\uFE0E',
  uranus: '\u26E2\uFE0E', neptune: '\u2646\uFE0E', pluto: '\u2647\uFE0E',
};

const PLANET_NAMES: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
  uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
};

const PLANET_COLORS: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  sun:     { bg: 'bg-amber-500/15',   text: 'text-amber-500',   ring: 'ring-amber-500/40',   bar: '#f59e0b' },
  moon:    { bg: 'bg-slate-300/20',   text: 'text-slate-400',   ring: 'ring-slate-400/40',   bar: '#94a3b8' },
  mercury: { bg: 'bg-yellow-400/15',  text: 'text-yellow-500',  ring: 'ring-yellow-400/40',  bar: '#eab308' },
  venus:   { bg: 'bg-emerald-400/15', text: 'text-emerald-400', ring: 'ring-emerald-400/40', bar: '#34d399' },
  mars:    { bg: 'bg-red-500/15',     text: 'text-red-500',     ring: 'ring-red-500/40',     bar: '#ef4444' },
  jupiter: { bg: 'bg-violet-400/15',  text: 'text-violet-400',  ring: 'ring-violet-400/40',  bar: '#a78bfa' },
  saturn:  { bg: 'bg-stone-400/15',   text: 'text-stone-400',   ring: 'ring-stone-400/40',   bar: '#a8a29e' },
  uranus:  { bg: 'bg-cyan-400/15',    text: 'text-cyan-400',    ring: 'ring-cyan-400/40',    bar: '#22d3ee' },
  neptune: { bg: 'bg-indigo-400/15',  text: 'text-indigo-400',  ring: 'ring-indigo-400/40',  bar: '#818cf8' },
  pluto:   { bg: 'bg-rose-500/15',    text: 'text-rose-500',    ring: 'ring-rose-500/40',    bar: '#f43f5e' },
};

const SIGN_COLORS: Record<string, string> = {
  Aries: 'text-red-500', Taurus: 'text-emerald-500', Gemini: 'text-yellow-500',
  Cancer: 'text-slate-400', Leo: 'text-amber-500', Virgo: 'text-lime-500',
  Libra: 'text-pink-400', Scorpio: 'text-rose-600', Sagittarius: 'text-violet-400',
  Capricorn: 'text-stone-400', Aquarius: 'text-cyan-400', Pisces: 'text-indigo-400',
};

type RulershipMode = 'traditional' | 'modern';

const TRADITIONAL_RULERS: Record<string, string> = {
  Aries: 'mars', Taurus: 'venus', Gemini: 'mercury', Cancer: 'moon',
  Leo: 'sun', Virgo: 'mercury', Libra: 'venus', Scorpio: 'mars',
  Sagittarius: 'jupiter', Capricorn: 'saturn', Aquarius: 'saturn', Pisces: 'jupiter',
};

const MODERN_RULERS: Record<string, string> = {
  Aries: 'mars', Taurus: 'venus', Gemini: 'mercury', Cancer: 'moon',
  Leo: 'sun', Virgo: 'mercury', Libra: 'venus', Scorpio: 'pluto',
  Sagittarius: 'jupiter', Capricorn: 'saturn', Aquarius: 'uranus', Pisces: 'neptune',
};

const RULERS: Record<RulershipMode, Record<string, string>> = {
  traditional: TRADITIONAL_RULERS,
  modern: MODERN_RULERS,
};

const HOUSE_TOPICS: Record<number, string> = {
  1: 'Self & Identity', 2: 'Resources & Values', 3: 'Communication & Siblings',
  4: 'Home & Family', 5: 'Creativity & Romance', 6: 'Health & Service',
  7: 'Partnerships', 8: 'Transformation & Shared Resources', 9: 'Philosophy & Travel',
  10: 'Career & Reputation', 11: 'Friends & Aspirations', 12: 'Solitude & Spirituality',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getAscSign(natalChart: Props['natalChart']): number {
  // Try to get ASC longitude
  let ascLng: number | undefined;

  if (natalChart.houses?.ascendant !== undefined) {
    ascLng = natalChart.houses.ascendant;
  } else if (natalChart.houses?.cusps && natalChart.houses.cusps.length >= 1) {
    ascLng = natalChart.houses.cusps[0];
  }

  if (ascLng !== undefined) {
    const ascSignIdx = ((Math.floor(ascLng / 30) % 12) + 12) % 12;
    return ascSignIdx;
  }

  // Fallback: check if any planet has sign data matching house 1
  // Last resort: use Sun sign
  const sun = natalChart.planets['sun'];
  if (sun) {
    return ((Math.floor(sun.longitude / 30) % 12) + 12) % 12;
  }

  return 0; // Aries default
}

function getHouseCusps(natalChart: Props['natalChart']): number[] | null {
  if (natalChart.houses?.cusps && natalChart.houses.cusps.length >= 12) {
    return natalChart.houses.cusps;
  }
  return null;
}

function getHouseForSign(ascSignIdx: number, signIdx: number): number {
  return ((signIdx - ascSignIdx + 12) % 12) + 1;
}

/** Calculate age in years at a given date */
function ageAt(birthDate: Date, date: Date): number {
  let age = date.getFullYear() - birthDate.getFullYear();
  const monthDiff = date.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && date.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/** Get the birthday in the current profection year */
function getBirthdayInYear(birthDate: Date, date: Date): Date {
  const age = ageAt(birthDate, date);
  const bday = new Date(birthDate);
  bday.setFullYear(birthDate.getFullYear() + age);
  // If bday is in the future (date is before this year's birthday), go back one year
  if (bday.getTime() > date.getTime()) {
    bday.setFullYear(bday.getFullYear() - 1);
  }
  return bday;
}

/** Get next birthday */
function getNextBirthday(birthDate: Date, date: Date): Date {
  const bday = getBirthdayInYear(birthDate, date);
  const next = new Date(bday);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}

/** Annual profected sign index (0-11 offset from ASC) */
function annualProfectedSignIdx(ascSignIdx: number, age: number): number {
  return (ascSignIdx + (age % 12)) % 12;
}

/** Monthly profected sign: each month from birthday advances by 1 sign */
function monthlyProfectedSignIdx(annualSignIdx: number, monthsElapsed: number): number {
  return (annualSignIdx + (monthsElapsed % 12)) % 12;
}

/** Daily profected sign: each ~2.5 days within the month advances by 1 sign */
function dailyProfectedSignIdx(monthlySignIdx: number, dayOfMonth: number, daysInMonth: number): number {
  if (daysInMonth <= 0) return monthlySignIdx;
  const daysPerSign = daysInMonth / 12;
  const signOffset = Math.min(11, Math.floor(dayOfMonth / daysPerSign));
  return (monthlySignIdx + signOffset) % 12;
}

/** How many months have elapsed since the birthday in the profection year */
function monthsFromBirthday(birthDate: Date, currentDate: Date): number {
  const bday = getBirthdayInYear(birthDate, currentDate);
  let months = (currentDate.getFullYear() - bday.getFullYear()) * 12 + (currentDate.getMonth() - bday.getMonth());
  if (currentDate.getDate() < bday.getDate()) {
    months--;
  }
  return Math.max(0, months);
}

/** Days elapsed within the current profection month */
function daysInCurrentProfMonth(birthDate: Date, currentDate: Date): { dayOfMonth: number; daysInMonth: number } {
  const bday = getBirthdayInYear(birthDate, currentDate);
  const monthsEl = monthsFromBirthday(birthDate, currentDate);

  // Profection month start: birthday + monthsEl months
  const monthStart = new Date(bday);
  monthStart.setMonth(monthStart.getMonth() + monthsEl);

  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const totalDays = (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24);
  const elapsed = (currentDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24);

  return { dayOfMonth: Math.max(0, Math.floor(elapsed)), daysInMonth: Math.round(totalDays) };
}

/** Get days in a calendar month */
function calendarDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Get the day-of-week (0=Sun) for the first of a month */
function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DailyProfectionsPanel({ natalChart, birthDate, name }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [calendarOffset, setCalendarOffset] = useState(0); // 0 = selected date's month
  const [rulershipMode, setRulershipMode] = useState<RulershipMode>('traditional');
  const rulers = RULERS[rulershipMode];

  const data = useMemo(() => {
    const bd = new Date(birthDate + 'T12:00:00');
    const target = new Date(selectedDateStr + 'T12:00:00');
    const ascSignIdx = getAscSign(natalChart);
    const age = ageAt(bd, target);

    // Annual
    const annualIdx = annualProfectedSignIdx(ascSignIdx, age);
    const annualSign = SIGNS[annualIdx];
    const annualRuler = rulers[annualSign];

    // Monthly
    const monthsEl = monthsFromBirthday(bd, target);
    const monthlyIdx = monthlyProfectedSignIdx(annualIdx, monthsEl);
    const monthlySign = SIGNS[monthlyIdx];
    const monthlyRuler = rulers[monthlySign];

    // Daily
    const { dayOfMonth, daysInMonth } = daysInCurrentProfMonth(bd, target);
    const dailyIdx = dailyProfectedSignIdx(monthlyIdx, dayOfMonth, daysInMonth);
    const dailySign = SIGNS[dailyIdx];
    const dailyRuler = rulers[dailySign];

    // Profected house
    const annualHouse = getHouseForSign(ascSignIdx, annualIdx);
    const monthlyHouse = getHouseForSign(ascSignIdx, monthlyIdx);
    const dailyHouse = getHouseForSign(ascSignIdx, dailyIdx);

    // Next birthday
    const nextBday = getNextBirthday(bd, target);

    return {
      bd, target, ascSignIdx, age,
      annualIdx, annualSign, annualRuler,
      monthlyIdx, monthlySign, monthlyRuler,
      dailyIdx, dailySign, dailyRuler,
      annualHouse, monthlyHouse, dailyHouse,
      nextBday,
      isToday: selectedDateStr === todayStr,
    };
  }, [natalChart, birthDate, selectedDateStr, todayStr, rulers]);

  // Calendar data — centered on selected date's month
  const calendarData = useMemo(() => {
    const selected = new Date(selectedDateStr + 'T12:00:00');
    const viewDate = new Date(selected.getFullYear(), selected.getMonth() + calendarOffset, 1);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysCount = calendarDaysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const bd = new Date(birthDate + 'T12:00:00');
    const ascSignIdx = data.ascSignIdx;
    const today = new Date();

    // Calculate profected sign for each day in this calendar month
    const days: { day: number; signIdx: number; sign: string; ruler: string; isSelected: boolean; isToday: boolean }[] = [];
    for (let d = 1; d <= daysCount; d++) {
      const date = new Date(year, month, d, 12, 0, 0);
      const age = ageAt(bd, date);
      const annIdx = annualProfectedSignIdx(ascSignIdx, age);
      const mEl = monthsFromBirthday(bd, date);
      const mIdx = monthlyProfectedSignIdx(annIdx, mEl);
      const { dayOfMonth: dom, daysInMonth: dim } = daysInCurrentProfMonth(bd, date);
      const dIdx = dailyProfectedSignIdx(mIdx, dom, dim);
      const sign = SIGNS[dIdx];
      const isSelected = d === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear();
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      days.push({ day: d, signIdx: dIdx, sign, ruler: rulers[sign], isSelected, isToday });
    }

    const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return { year, month, daysCount, firstDay, days, monthName };
  }, [birthDate, selectedDateStr, calendarOffset, data.ascSignIdx, rulers]);

  const {
    age, annualSign, annualRuler, monthlySign, monthlyRuler,
    dailySign, dailyRuler, annualHouse, monthlyHouse, dailyHouse,
    nextBday, ascSignIdx,
  } = data;

  // The "Time Lord" is the annual profection ruler (most important)
  const timeLordKey = annualRuler;
  const timeLordColors = PLANET_COLORS[timeLordKey] || PLANET_COLORS.sun;

  if (!birthDate) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Enter a birth date to use this tool
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">
          Daily Profections {name ? <span className="text-muted-foreground font-normal">for {name}</span> : null}
        </h3>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Annual, monthly &amp; daily profected signs with time lords
        </p>
      </div>

      <ToolGuide
        title="Daily Profections"
        description="Extends annual profections to monthly and daily resolution. Each year activates a house/sign from your Ascendant, then each month within that year advances one sign, and each day advances further. The Time Lord (ruling planet) colors the themes of each period."
        tips={[
          "The annual Time Lord is the most important — it sets the theme for the whole year",
          "Monthly profections refine the annual theme, showing which sub-topics come into focus each month",
          "The calendar view shows daily sign activations — useful for electional timing",
          "Watch when transiting planets aspect your annual Time Lord — those are key trigger dates",
          "The profection wheel on the left shows the full age-to-sign mapping at a glance",
        ]}
      />

      {/* Date picker + rulership toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={selectedDateStr}
          onChange={(e) => {
            if (e.target.value) {
              setSelectedDateStr(e.target.value);
              setCalendarOffset(0);
            }
          }}
          className="text-xs bg-card/50 border border-border/40 rounded-md px-2 py-1.5 text-foreground [color-scheme:dark]"
        />
        {!data.isToday && (
          <button
            onClick={() => { setSelectedDateStr(todayStr); setCalendarOffset(0); }}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border/40 hover:bg-muted/30 transition-colors"
          >
            Today
          </button>
        )}
        <div className="ml-auto flex rounded-md border border-border/40 overflow-hidden text-[11px]">
          <button
            onClick={() => setRulershipMode('traditional')}
            className={`px-2.5 py-1 transition-colors ${rulershipMode === 'traditional' ? 'bg-muted/50 text-foreground font-medium' : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/30'}`}
          >
            Traditional
          </button>
          <button
            onClick={() => setRulershipMode('modern')}
            className={`px-2.5 py-1 border-l border-border/40 transition-colors ${rulershipMode === 'modern' ? 'bg-muted/50 text-foreground font-medium' : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/30'}`}
          >
            Modern
          </button>
        </div>
      </div>

      {/* Time Lord highlight */}
      <div className={`rounded-lg border ${timeLordColors.ring} ring-1 ${timeLordColors.bg} p-3`}>
        <div className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-1">
          {data.isToday ? "Today's" : `${new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}'s`} Time Lord (Annual Ruler)
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl ${timeLordColors.text}`} style={SYMBOL_FONT}>{PLANET_SYMBOLS[timeLordKey]}</span>
          <div>
            <div className="text-base font-bold">{PLANET_NAMES[timeLordKey]}</div>
            <div className="text-xs text-muted-foreground">
              Age {age} &middot; Profected to <span style={SYMBOL_FONT}>{SIGN_SYMBOLS[annualSign]}</span> {annualSign} &middot; House {annualHouse}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground/70 mt-1.5">
          Next birthday: {nextBday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Three profection cards */}
      <div className="grid grid-cols-3 gap-2">
        <ProfectionCard
          label="Annual"
          sign={annualSign}
          ruler={annualRuler}
          house={annualHouse}
          active
        />
        <ProfectionCard
          label="Monthly"
          sign={monthlySign}
          ruler={monthlyRuler}
          house={monthlyHouse}
        />
        <ProfectionCard
          label="Daily"
          sign={dailySign}
          ruler={dailyRuler}
          house={dailyHouse}
        />
      </div>

      {/* Activated Houses */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
          Activated House Topics
        </h4>
        <div className="space-y-1">
          {[
            { label: 'Annual', house: annualHouse, sign: annualSign },
            { label: 'Monthly', house: monthlyHouse, sign: monthlySign },
            { label: 'Daily', house: dailyHouse, sign: dailySign },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-card/50 border border-border/30"
            >
              <span className={`text-xs ${SIGN_COLORS[item.sign] || 'text-foreground'}`} style={SYMBOL_FONT}>
                {SIGN_SYMBOLS[item.sign]}
              </span>
              <span className="text-xs text-muted-foreground/60 w-14">{item.label}</span>
              <span className="text-xs font-medium">House {item.house}</span>
              <span className="text-xs text-muted-foreground/70">{HOUSE_TOPICS[item.house]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Month View */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Daily Profection Calendar
          </h4>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCalendarOffset((o) => o - 1)}
              className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/40 bg-card/50"
            >
              &larr;
            </button>
            <span className="text-xs text-muted-foreground min-w-[100px] text-center">
              {calendarData.monthName}
            </span>
            <button
              onClick={() => setCalendarOffset((o) => o + 1)}
              className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/40 bg-card/50"
            >
              &rarr;
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-muted/30 border-b border-border/40">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-[11px] text-center text-muted-foreground/70 py-1 font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for offset */}
            {Array.from({ length: calendarData.firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 border-b border-r border-border/20" />
            ))}
            {calendarData.days.map((day) => {
              const signColor = SIGN_COLORS[day.sign] || 'text-foreground';
              const rulerColors = PLANET_COLORS[day.ruler] || PLANET_COLORS.sun;
              const highlighted = day.isSelected;
              return (
                <button
                  key={day.day}
                  onClick={() => {
                    const dateStr = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
                    setSelectedDateStr(dateStr);
                  }}
                  className={`h-10 border-b border-r border-border/20 flex flex-col items-center justify-center gap-0.5 transition-colors hover:bg-muted/30 ${
                    highlighted ? `${rulerColors.bg} ring-1 ${rulerColors.ring}` : ''
                  } ${day.isToday && !highlighted ? 'border-foreground/30 border' : ''}`}
                  title={`${day.sign} — ${PLANET_NAMES[day.ruler]}`}
                >
                  <span className={`text-[11px] leading-none ${highlighted ? 'font-bold' : day.isToday ? 'font-semibold text-foreground' : 'text-muted-foreground/70'}`}>
                    {day.day}
                  </span>
                  <span className={`text-xs leading-none ${signColor}`} style={SYMBOL_FONT}>
                    {SIGN_SYMBOLS[day.sign]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
          {SIGNS.map((sign) => (
            <span key={sign} className="text-[11px] text-muted-foreground/60">
              <span className={SIGN_COLORS[sign]} style={SYMBOL_FONT}>{SIGN_SYMBOLS[sign]}</span> {sign}
            </span>
          ))}
        </div>
      </div>

      {/* Profection Wheel Summary */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
          Profection Wheel (Age &rarr; Sign &rarr; Ruler)
        </h4>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="grid grid-cols-4 gap-px bg-border/20">
            {Array.from({ length: 12 }).map((_, i) => {
              const signIdx = (ascSignIdx + i) % 12;
              const sign = SIGNS[signIdx];
              const ruler = rulers[sign];
              const house = i + 1;
              const isCurrentAge = (age % 12) === i;
              const rc = PLANET_COLORS[ruler] || PLANET_COLORS.sun;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-2 py-1.5 ${
                    isCurrentAge ? `${rc.bg} font-semibold` : 'bg-card/50'
                  }`}
                >
                  <span className={`text-xs ${SIGN_COLORS[sign]}`} style={SYMBOL_FONT}>{SIGN_SYMBOLS[sign]}</span>
                  <div className="min-w-0">
                    <div className="text-xs truncate">
                      Age {i}{i < 9 ? `, ${i + 12}, ${i + 24}` : i === 9 ? ', 21' : i === 10 ? ', 22' : ', 23'}...
                    </div>
                    <div className="text-[11px] text-muted-foreground/70">
                      H{house} &middot; <span className={rc.text} style={SYMBOL_FONT}>{PLANET_SYMBOLS[ruler]}</span> {PLANET_NAMES[ruler]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ProfectionCard({
  label,
  sign,
  ruler,
  house,
  active,
}: {
  label: string;
  sign: string;
  ruler: string;
  house: number;
  active?: boolean;
}) {
  const rc = PLANET_COLORS[ruler] || PLANET_COLORS.sun;
  const signColor = SIGN_COLORS[sign] || 'text-foreground';

  return (
    <div
      className={`rounded-lg border p-2.5 text-center ${
        active
          ? `${rc.bg} ${rc.ring} ring-1 border-transparent`
          : 'border-border/40 bg-card/50'
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-1">{label}</div>
      <div className={`text-lg leading-none ${signColor}`} style={SYMBOL_FONT}>{SIGN_SYMBOLS[sign]}</div>
      <div className="text-xs font-medium mt-1">{sign}</div>
      <div className="flex items-center justify-center gap-1 mt-0.5">
        <span className={`text-xs ${rc.text}`} style={SYMBOL_FONT}>{PLANET_SYMBOLS[ruler]}</span>
        <span className="text-[11px] text-muted-foreground">{PLANET_NAMES[ruler]}</span>
      </div>
      <div className="text-[11px] text-muted-foreground/70 mt-0.5">House {house}</div>
    </div>
  );
}
