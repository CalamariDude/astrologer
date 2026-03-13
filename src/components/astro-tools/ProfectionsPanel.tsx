/**
 * Profections Panel
 * SVG profection wheel + details card with annual and monthly profections
 * + Time lord natal condition card + Arabic Parts section
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, ChevronLeft, Star, RotateCcw } from 'lucide-react';
import type { NatalChart } from '@/components/biwheel/types';
import { calculateProfections } from '@/lib/profections';
import type { ProfectionYear, ProfectionMethod } from '@/lib/profections';
import { TRADITIONAL_RULERS } from '@/lib/profections';
import { getTimeLordNatalCondition } from '@/lib/dignities';
import type { TimeLordCondition } from '@/lib/dignities';
import { PLANETS, ARABIC_PARTS, calculateArabicParts, ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';
import { getThemeForHouse, getThemeForPlanet } from '@/lib/astroThemes';
import { SIGN_LENS_KEYWORDS, LENS_CONFIG, LENS_ORDER } from '@/data/signKeywords';
import type { LensKey } from '@/data/signKeywords';

interface ProfectionsPanelProps {
  birthDate: string;
  natalChart: NatalChart;
  personName: string;
}

const ELEMENT_COLORS: Record<string, { bg: string; text: string; ring: string; fill: string }> = {
  fire: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/30', fill: '#ef4444' },
  earth: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/30', fill: '#10b981' },
  air: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500/30', fill: '#0ea5e9' },
  water: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', ring: 'ring-cyan-500/30', fill: '#06b6d4' },
};

/** Get natal planets that fall in a given zodiac sign */
function getNatalPlanetsInSign(signName: string, natalChart: NatalChart): { key: string; symbol: string; color: string }[] {
  const result: { key: string; symbol: string; color: string }[] = [];
  const corePlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'northnode'];
  const targetSignIndex = ZODIAC_SIGNS.findIndex(s => s.name === signName);
  if (targetSignIndex < 0) return result;

  for (const pKey of corePlanets) {
    const planet = natalChart.planets[pKey];
    if (!planet || planet.longitude === undefined) continue;
    const info = PLANETS[pKey as keyof typeof PLANETS];
    if (!info) continue;

    const planetSignIndex = Math.floor(planet.longitude / 30);
    if (planetSignIndex === targetSignIndex) {
      result.push({ key: pKey, symbol: info.symbol, color: info.color });
    }
  }
  return result;
}


const RULER_LENS_KEYWORDS: Record<string, Record<LensKey, string[]>> = {
  mars: {
    core: ['Drive', 'Action', 'Energy', 'Assertion', 'Willpower', 'Courage', 'Stamina'],
    love: ['Desire', 'Sexual energy', 'Pursuit', 'Passion', 'Physical attraction', 'Conquest'],
    career: ['Competition', 'Ambition', 'Physical labor', 'Military', 'Surgery', 'Sports', 'Engineering'],
    social: ['Defending allies', 'Challenge', 'Rivalry', 'Motivation', 'Adventure buddies'],
    health: ['Muscles', 'Blood', 'Iron', 'Fevers', 'Inflammation', 'Adrenals'],
    shadow: ['Anger', 'Conflict', 'Aggression', 'Recklessness', 'Violence', 'Impatience'],
  },
  venus: {
    core: ['Love', 'Beauty', 'Values', 'Attraction', 'Harmony', 'Pleasure', 'Art'],
    love: ['Romance', 'Sensuality', 'Partnership', 'Affection', 'Courtship', 'Devotion'],
    career: ['Fashion', 'Art', 'Design', 'Luxury', 'Beauty industry', 'Diplomacy', 'Jewelry'],
    social: ['Charm', 'Grace', 'Gift-giving', 'Peacemaking', 'Social gatherings', 'Aesthetics'],
    health: ['Throat', 'Kidneys', 'Skin', 'Sugar metabolism', 'Reproductive health'],
    shadow: ['Vanity', 'Indulgence', 'Codependency', 'Materialism', 'Laziness', 'Jealousy'],
  },
  mercury: {
    core: ['Mind', 'Speech', 'Learning', 'Analysis', 'Communication', 'Logic', 'Wit'],
    love: ['Mental chemistry', 'Flirtation', 'Words of affirmation', 'Curiosity', 'Banter'],
    career: ['Writing', 'Commerce', 'Teaching', 'Technology', 'Journalism', 'Trade', 'Accounting'],
    social: ['Conversation', 'Humor', 'Networking', 'Debate', 'Storytelling', 'Messengers'],
    health: ['Nervous system', 'Hands', 'Lungs', 'Speech', 'Coordination', 'Reflexes'],
    shadow: ['Deception', 'Overthinking', 'Gossip', 'Nervousness', 'Trickery', 'Scattered focus'],
  },
  moon: {
    core: ['Emotions', 'Instinct', 'Memory', 'Cycles', 'Nurturing', 'Receptivity', 'Moods'],
    love: ['Emotional bonding', 'Comfort', 'Care', 'Devotion', 'Intimacy', 'Nesting'],
    career: ['Caregiving', 'Food', 'Real estate', 'Hospitality', 'Public service', 'Nursing'],
    social: ['Empathy', 'Mothering', 'Emotional support', 'Nostalgia', 'Traditions', 'Family'],
    health: ['Stomach', 'Breasts', 'Fluids', 'Sleep cycles', 'Fertility', 'Emotional wellbeing'],
    shadow: ['Moodiness', 'Clinginess', 'Irrational fears', 'Emotional manipulation', 'Withdrawal'],
  },
  sun: {
    core: ['Vitality', 'Will', 'Purpose', 'Authority', 'Identity', 'Consciousness', 'Spirit'],
    love: ['Generosity', 'Warmth', 'Loyalty', 'Romance', 'Adoration', 'Grand gestures'],
    career: ['Leadership', 'Performing', 'Government', 'Management', 'Creative direction', 'Executive roles'],
    social: ['Charisma', 'Inspiration', 'Center of attention', 'Celebration', 'Mentorship'],
    health: ['Heart', 'Spine', 'Vitality', 'Eyes', 'Circulation', 'Life force'],
    shadow: ['Ego', 'Arrogance', 'Pride', 'Self-centeredness', 'Domination', 'Burnout'],
  },
  jupiter: {
    core: ['Growth', 'Abundance', 'Faith', 'Expansion', 'Wisdom', 'Generosity', 'Luck'],
    love: ['Joy', 'Growth together', 'Generosity', 'Cultural exchange', 'Adventure', 'Optimism'],
    career: ['Teaching', 'Law', 'Publishing', 'Foreign trade', 'Religion', 'Philanthropy', 'Higher ed'],
    social: ['Generosity', 'Mentoring', 'Cultural connections', 'Celebration', 'Community building'],
    health: ['Liver', 'Hips', 'Weight gain', 'Blood sugar', 'Over-indulgence'],
    shadow: ['Excess', 'Overindulgence', 'Hubris', 'Waste', 'Dogmatism', 'Blind optimism'],
  },
  saturn: {
    core: ['Limits', 'Time', 'Discipline', 'Mastery', 'Structure', 'Karma', 'Responsibility'],
    love: ['Commitment', 'Longevity', 'Boundaries', 'Maturity', 'Loyalty', 'Endurance'],
    career: ['Management', 'Government', 'Architecture', 'Engineering', 'Banking', 'Long-term planning'],
    social: ['Reliability', 'Mentorship', 'Respect', 'Hierarchy', 'Traditions', 'Elder wisdom'],
    health: ['Bones', 'Joints', 'Teeth', 'Skin', 'Knees', 'Chronic conditions', 'Aging'],
    shadow: ['Restriction', 'Fear', 'Pessimism', 'Coldness', 'Rigidity', 'Loneliness', 'Severity'],
  },
};

function ProfectionWheel({ years, onSelect, selectedAge, selectedYear, currentAge, natalChart }: {
  years: ProfectionYear[];
  onSelect: (year: ProfectionYear) => void;
  selectedAge: number;
  selectedYear: ProfectionYear;
  currentAge: number;
  natalChart: NatalChart;
}) {
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
  const cx = 250, cy = 250;
  // Three concentric rings: outer ruler | main sign | inner months
  const rulerOuterR = 240, rulerInnerR = 222;
  const mainOuterR = 220, mainInnerR = 148;
  const monthOuterR = 145, monthInnerR = 115;
  const centerR = 112;
  const displayYears = years;

  const selectedHouseNum = selectedYear.house; // 1-12

  const natalPlanetsInSign = useMemo(
    () => getNatalPlanetsInSign(selectedYear.sign, natalChart),
    [selectedYear.sign, natalChart]
  );

  const hoveredSignInfo = useMemo(() => {
    if (hoveredHouse === null) return null;
    const houseNum = hoveredHouse + 1;
    const houseYears = displayYears.filter(y => y.house === houseNum);
    const firstYear = houseYears[0];
    if (!firstYear) return null;
    const signData = SIGN_LENS_KEYWORDS[firstYear.sign];
    const rulerInfo = TRADITIONAL_RULERS[firstYear.sign];
    const rulerKw = RULER_LENS_KEYWORDS[rulerInfo?.ruler]?.core || [];
    const rulerColor = PLANETS[rulerInfo?.ruler as keyof typeof PLANETS]?.color || '#888';
    const signColors = ELEMENT_COLORS[firstYear.element] || ELEMENT_COLORS.fire;
    return { sign: firstYear.sign, signSymbol: firstYear.signSymbol, quality: signData?.quality, coreKeywords: signData?.lenses.core || [], rulerInfo, rulerKw, rulerColor, signColors, ages: houseYears.map(y => y.age) };
  }, [hoveredHouse, displayYears]);

  // Helper to build an arc sector path (counterclockwise: sweep-flag=0 for outer, 1 for inner)
  const sectorPath = (outerR: number, innerR: number, startA: number, endA: number) => {
    const x1O = cx + outerR * Math.cos(startA), y1O = cy + outerR * Math.sin(startA);
    const x2O = cx + outerR * Math.cos(endA), y2O = cy + outerR * Math.sin(endA);
    const x1I = cx + innerR * Math.cos(startA), y1I = cy + innerR * Math.sin(startA);
    const x2I = cx + innerR * Math.cos(endA), y2I = cy + innerR * Math.sin(endA);
    return `M ${x1I} ${y1I} L ${x1O} ${y1O} A ${outerR} ${outerR} 0 0 0 ${x2O} ${y2O} L ${x2I} ${y2I} A ${innerR} ${innerR} 0 0 1 ${x1I} ${y1I}`;
  };

  return (
    <svg viewBox="0 0 500 510" className="w-full max-w-[520px] drop-shadow-sm">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="monthGlow"><feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="activeGlow"><feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background rings */}
      <circle cx={cx} cy={cy} r={rulerOuterR} fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={mainOuterR} fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={mainInnerR} fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={monthInnerR} fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />

      {/* 12 house sectors — Aries starts at left (180°), counterclockwise */}
      {Array.from({ length: 12 }, (_, i) => {
        const houseNum = i + 1;
        const startAngle = (180 - i * 30) * (Math.PI / 180);
        const endAngle = (180 - (i + 1) * 30) * (Math.PI / 180);
        const midAngle = (180 - (i + 0.5) * 30) * (Math.PI / 180);

        const houseYears = displayYears.filter(y => y.house === houseNum);
        const isCurrentHouse = houseYears.some(y => y.isCurrent);
        const isSelectedHouse = houseNum === selectedHouseNum;
        const isActive = isSelectedHouse || isCurrentHouse;
        const firstYear = houseYears[0];
        const element = firstYear?.element || 'fire';
        const colors = ELEMENT_COLORS[element];
        const signName = firstYear?.sign || 'Aries';
        const rulerInfo = TRADITIONAL_RULERS[signName] || TRADITIONAL_RULERS.Aries;

        const mainPath = sectorPath(mainOuterR, mainInnerR, startAngle, endAngle);
        const rulerPath = sectorPath(rulerOuterR, rulerInnerR, startAngle, endAngle);

        const rulerLabelR = (rulerOuterR + rulerInnerR) / 2;
        const rulerColor = PLANETS[rulerInfo.ruler as keyof typeof PLANETS]?.color || colors.fill;

        // Sign symbol sits in the center of the main band
        const signR = (mainOuterR + mainInnerR) / 2;

        const showNatalPlanets = isSelectedHouse && natalPlanetsInSign.length > 0;

        return (
          <g key={i} className="cursor-pointer"
            onClick={() => firstYear && onSelect(firstYear)}
            onMouseEnter={() => setHoveredHouse(i)}
            onMouseLeave={() => setHoveredHouse(null)}>

            {/* Ruler ring segment */}
            <path d={rulerPath}
              fill={isSelectedHouse ? colors.fill : 'transparent'}
              fillOpacity={isSelectedHouse ? 0.25 : 0}
              stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5}
              className="transition-all duration-200"
            />
            <text x={cx + rulerLabelR * Math.cos(midAngle)} y={cy + rulerLabelR * Math.sin(midAngle)}
              textAnchor="middle" dominantBaseline="central" fontSize={11} className="pointer-events-none"
              fill={rulerColor} fillOpacity={isSelectedHouse ? 1 : 0.4}>
              {rulerInfo.rulerSymbol}
            </text>

            {/* Main house sector fill */}
            <path d={mainPath}
              fill={isActive ? colors.fill : 'transparent'}
              fillOpacity={isSelectedHouse ? 0.2 : isCurrentHouse ? 0.1 : 0}
              stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5}
              className="transition-all duration-200 hover:fill-opacity-08"
            />
            {/* Active house: strong border + glow */}
            {isSelectedHouse && (
              <path d={mainPath} fill="none" stroke={colors.fill} strokeWidth={2.5} filter="url(#activeGlow)" />
            )}
            {/* Current house (if different): subtle indicator */}
            {isCurrentHouse && !isSelectedHouse && (
              <path d={mainPath} fill="none" stroke={colors.fill} strokeWidth={1.5} strokeOpacity={0.4} filter="url(#glow)" />
            )}

            {/* Sign symbol — centered in main band */}
            <text x={cx + signR * Math.cos(midAngle)} y={cy + signR * Math.sin(midAngle)}
              textAnchor="middle" dominantBaseline="central"
              className="pointer-events-none"
              fontSize={isSelectedHouse ? 24 : 18}
              fill={colors.fill}
              fillOpacity={isSelectedHouse ? 1 : 0.5}>
              {firstYear?.signSymbol}
            </text>

            {/* House number — small, at inner edge, italic style to distinguish from ages */}
            <text x={cx + (mainInnerR + 10) * Math.cos(midAngle)} y={cy + (mainInnerR + 10) * Math.sin(midAngle)}
              textAnchor="middle" dominantBaseline="central"
              className="pointer-events-none"
              fontSize={8} fontStyle="italic"
              fill="currentColor"
              fillOpacity={isSelectedHouse ? 0.6 : 0.2}>
              {houseNum}
            </text>

            {/* Natal planets in this house (near outer edge of main band) */}
            {showNatalPlanets && natalPlanetsInSign.map((p, pi) => {
              const spreadAngle = midAngle + (pi - (natalPlanetsInSign.length - 1) / 2) * 0.13;
              const planetR = mainOuterR - 12;
              return (
                <text key={p.key}
                  x={cx + planetR * Math.cos(spreadAngle)} y={cy + planetR * Math.sin(spreadAngle)}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={12} className="pointer-events-none" fill={p.color} fillOpacity={0.9}>
                  {p.symbol}
                </text>
              );
            })}
          </g>
        );
      })}

      {/* Monthly ring (inner) — same counterclockwise direction */}
      {selectedYear.months.map((month, mi) => {
        const startAngle = (180 - mi * 30) * (Math.PI / 180);
        const endAngle = (180 - (mi + 1) * 30) * (Math.PI / 180);
        const midAngle = (180 - (mi + 0.5) * 30) * (Math.PI / 180);

        const monthSign = ZODIAC_SIGNS.find(s => s.name === month.sign);
        const monthElement = monthSign?.element || 'fire';
        const monthColors = ELEMENT_COLORS[monthElement];

        const monthPath = sectorPath(monthOuterR, monthInnerR, startAngle, endAngle);
        const monthLabelR = (monthOuterR + monthInnerR) / 2;

        return (
          <g key={`month-${mi}`}>
            <path d={monthPath}
              fill={monthColors.fill}
              fillOpacity={month.isCurrent ? 0.3 : 0.06}
              stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5}
            />
            {month.isCurrent && <path d={monthPath} fill="none" stroke={monthColors.fill} strokeWidth={1.5} filter="url(#monthGlow)" />}
            <text x={cx + monthLabelR * Math.cos(midAngle)} y={cy + monthLabelR * Math.sin(midAngle)}
              textAnchor="middle" dominantBaseline="central" fontSize={9} className="pointer-events-none"
              fill={monthColors.fill} fillOpacity={month.isCurrent ? 1 : 0.5}>
              {month.timeLord.rulerSymbol}
            </text>
          </g>
        );
      })}

      {/* Center circle */}
      <circle cx={cx} cy={cy} r={centerR} className="fill-background" />
      <circle cx={cx} cy={cy} r={centerR} fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />

      {hoveredSignInfo ? (
        <>
          {/* Hover tooltip: sign info */}
          <text x={cx} y={cy - 50} textAnchor="middle" className="pointer-events-none" fontSize={28} fill={hoveredSignInfo.signColors.fill}>
            {hoveredSignInfo.signSymbol}
          </text>
          <text x={cx} y={cy - 28} textAnchor="middle" fontSize={12} fontWeight="600" className="fill-foreground pointer-events-none">
            {hoveredSignInfo.sign}
          </text>
          <text x={cx} y={cy - 14} textAnchor="middle" fontSize={9} className="pointer-events-none" fill={hoveredSignInfo.signColors.fill}>
            {hoveredSignInfo.quality}
          </text>
          <text x={cx} y={cy + 2} textAnchor="middle" fontSize={8} className="fill-muted-foreground pointer-events-none">
            {hoveredSignInfo.coreKeywords.slice(0, 3).join(' \u00B7 ')}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={8} className="fill-muted-foreground pointer-events-none">
            {hoveredSignInfo.coreKeywords.slice(3, 6).join(' \u00B7 ')}
          </text>
          <line x1={cx - 35} y1={cy + 26} x2={cx + 35} y2={cy + 26} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} />
          <text x={cx} y={cy + 40} textAnchor="middle" fontSize={12} className="pointer-events-none" fill={hoveredSignInfo.rulerColor}>
            {hoveredSignInfo.rulerInfo?.rulerSymbol} {hoveredSignInfo.rulerInfo?.rulerName}
          </text>
          <text x={cx} y={cy + 54} textAnchor="middle" fontSize={8} className="fill-muted-foreground pointer-events-none">
            {hoveredSignInfo.rulerKw.slice(0, 3).join(' \u00B7 ')}
          </text>
          <text x={cx} y={cy + 70} textAnchor="middle" fontSize={9} className="fill-muted-foreground pointer-events-none">
            Ages: {hoveredSignInfo.ages.join(', ')}
          </text>
        </>
      ) : (
        <>
          {/* Default center: age + sign + house + time lord */}
          {(() => {
            const hColors = ELEMENT_COLORS[selectedYear.element] || ELEMENT_COLORS.fire;
            const tlColor = PLANETS[selectedYear.timeLord.ruler as keyof typeof PLANETS]?.color || '#888';
            return (
              <>
                {/* Sign symbol at top of center */}
                <text x={cx} y={cy - 52} textAnchor="middle" fontSize={22} className="pointer-events-none" fill={hColors.fill}>
                  {selectedYear.signSymbol}
                </text>

                {/* Age — big and bold */}
                <text x={cx} y={cy - 10} textAnchor="middle" fontSize={42} fontWeight="bold" className="fill-foreground pointer-events-none">
                  {selectedAge}
                </text>

                {/* Sign name + house */}
                <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fontWeight="600" className="pointer-events-none" fill={hColors.fill}>
                  {selectedYear.sign} {'\u00B7'} House {selectedHouseNum}
                </text>

                {/* Time lord */}
                <text x={cx} y={cy + 34} textAnchor="middle" fontSize={16} className="pointer-events-none" fill={tlColor}>
                  {selectedYear.timeLord.rulerSymbol}
                </text>
                <text x={cx} y={cy + 48} textAnchor="middle" fontSize={9} className="fill-muted-foreground pointer-events-none">
                  {selectedYear.timeLord.rulerName}
                </text>
              </>
            );
          })()}

          {/* Nav arrows */}
          <g className="cursor-pointer" onClick={(e) => {
            e.stopPropagation();
            const prevYear = years.find(y => y.age === selectedAge - 1);
            if (prevYear) onSelect(prevYear);
          }}>
            <rect x={cx - 82} y={cy + 58} width={30} height={24} rx={6} fill="currentColor" fillOpacity={0.05} className="hover:fill-opacity-15 transition-all" />
            <text x={cx - 67} y={cy + 72} textAnchor="middle" dominantBaseline="central" fontSize={12} className="fill-muted-foreground pointer-events-none">{'\u25C0'}</text>
          </g>
          <g className="cursor-pointer" onClick={(e) => {
            e.stopPropagation();
            const nextYear = years.find(y => y.age === selectedAge + 1);
            if (nextYear) onSelect(nextYear);
          }}>
            <rect x={cx + 52} y={cy + 58} width={30} height={24} rx={6} fill="currentColor" fillOpacity={0.05} className="hover:fill-opacity-15 transition-all" />
            <text x={cx + 67} y={cy + 72} textAnchor="middle" dominantBaseline="central" fontSize={12} className="fill-muted-foreground pointer-events-none">{'\u25B6'}</text>
          </g>

          {/* Current reset button */}
          {selectedAge !== currentAge && (
            <g className="cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              const current = years.find(y => y.isCurrent);
              if (current) onSelect(current);
            }}>
              <rect x={cx - 28} y={cy + 58} width={56} height={24} rx={6} fill="currentColor" fillOpacity={0.05} className="hover:fill-opacity-15 transition-all" />
              <text x={cx} y={cy + 72} textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight="600" className="fill-primary pointer-events-none">Current</text>
            </g>
          )}
        </>
      )}

      {/* Natal planets label (below wheel) */}
      {natalPlanetsInSign.length > 0 && (
        <text x={cx} y={500} textAnchor="middle" fontSize={9} className="fill-muted-foreground">
          {natalPlanetsInSign.map(p => p.symbol).join(' ')} activated this year
        </text>
      )}
    </svg>
  );
}

/** Year timeline strip below the wheel */
function YearTimeline({ years, selectedAge, currentAge, onSelect }: {
  years: ProfectionYear[];
  selectedAge: number;
  currentAge: number;
  onSelect: (year: ProfectionYear) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayYears = years;

  return (
    <div ref={scrollRef}>
      <div className="flex flex-wrap gap-1 px-1 justify-center">
        {displayYears.map((year) => {
          const colors = ELEMENT_COLORS[year.element] || ELEMENT_COLORS.fire;
          const isSelected = year.age === selectedAge;
          const isCurrent = year.age === currentAge;
          return (
            <button
              key={year.age}
              onClick={() => onSelect(year)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                isSelected
                  ? 'ring-2 scale-105'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: colors.fill + (isSelected ? '25' : '12'),
                color: colors.fill,
                ringColor: isSelected ? colors.fill : undefined,
              }}
            >
              {year.age}
              {isCurrent && !isSelected && <span className="ml-0.5 text-[8px]">{'\u2022'}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeLordConditionCard({ condition, timeLordName, timeLordSymbol }: {
  condition: TimeLordCondition;
  timeLordName: string;
  timeLordSymbol: string;
  elementColors: { bg: string; text: string; ring: string; fill: string };
}) {
  const signElement = ZODIAC_SIGNS.find(s => s.name === condition.sign)?.element || 'fire';
  const signColors = ELEMENT_COLORS[signElement] || ELEMENT_COLORS.fire;
  const topAspects = condition.aspects.slice(0, 3);

  return (
    <div className={`rounded-xl border p-4 ${signColors.bg} ring-1 ${signColors.ring}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Time Lord Natal Condition</div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl" style={{ color: PLANETS[timeLordName.toLowerCase() as keyof typeof PLANETS]?.color }}>
          {timeLordSymbol}
        </span>
        <div>
          <div className="text-sm font-semibold">{timeLordName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span>{condition.signSymbol} {condition.sign}</span>
            {condition.house && <span>&bull; House {condition.house}</span>}
            {condition.retrograde && <span className="text-red-500 font-bold">R</span>}
          </div>
        </div>
      </div>

      {/* Top 3 tightest aspects */}
      {topAspects.length > 0 && (
        <div className="space-y-1">
          {topAspects.map((asp, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span style={{ color: PLANETS[asp.planet as keyof typeof PLANETS]?.color }} className="text-base">{asp.planetSymbol}</span>
              <span style={{ color: asp.aspectColor }} className="text-base">{asp.aspectSymbol}</span>
              <span className="text-muted-foreground tabular-nums">{formatOrbDeg(asp.orb)}</span>
              <span className={`text-[10px] ${
                asp.nature === 'harmonious' ? 'text-blue-500' :
                asp.nature === 'challenging' ? 'text-red-500' : 'text-amber-500'
              }`}>
                {asp.nature}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatOrbDeg(orb: number): string {
  const deg = Math.floor(orb);
  const min = Math.round((orb - deg) * 60);
  return `${deg}\u00B0${min.toString().padStart(2, '0')}'`;
}

function ArabicPartsSection({ natalChart }: { natalChart: NatalChart }) {
  const [expanded, setExpanded] = useState(false);

  const lots = useMemo(() => {
    const asc = natalChart.angles?.ascendant ?? natalChart.planets.ascendant?.longitude ?? 0;
    return calculateArabicParts(natalChart.planets, asc);
  }, [natalChart]);

  const partEntries = Object.entries(ARABIC_PARTS).map(([key, def]) => {
    const result = lots[key];
    if (!result) return null;
    const degInSign = Math.floor(result.longitude % 30);
    const minInSign = Math.round(((result.longitude % 30) - degInSign) * 60);
    const signIdx = Math.floor(result.longitude / 30);
    const signSymbol = ZODIAC_SIGNS[signIdx]?.symbol || '';
    return {
      key,
      symbol: def.symbol,
      name: def.name,
      sign: result.sign,
      signSymbol,
      degree: `${degInSign}\u00B0${String(minInSign).padStart(2, '0')}'`,
      color: def.color,
    };
  }).filter(Boolean) as { key: string; symbol: string; name: string; sign: string; signSymbol: string; degree: string; color: string }[];

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium">
        Arabic Parts (Lots)
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="rounded-xl border overflow-hidden">
          {partEntries.map(part => (
            <div key={part.key} className="flex items-center justify-between px-3 py-2.5 text-xs border-b last:border-b-0 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-base" style={{ color: part.color }}>{part.symbol}</span>
                <span className="font-medium">{part.name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-base">{part.signSymbol}</span>
                <span>{part.sign}</span>
                <span className="tabular-nums">{part.degree}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KeywordsSection({ sign, ruler }: { sign: string; ruler: string }) {
  const [expanded, setExpanded] = useState(false);
  const [activeLens, setActiveLens] = useState<LensKey | 'all'>('all');
  const signData = SIGN_LENS_KEYWORDS[sign];
  const rulerData = RULER_LENS_KEYWORDS[ruler];
  const rulerName = TRADITIONAL_RULERS[sign]?.rulerName || ruler;
  const rulerSymbol = TRADITIONAL_RULERS[sign]?.rulerSymbol || '';
  const rulerColor = PLANETS[ruler as keyof typeof PLANETS]?.color || '#888';
  const signSymbol = ZODIAC_SIGNS.find(s => s.name === sign)?.symbol || '';
  const signElement = ZODIAC_SIGNS.find(s => s.name === sign)?.element || 'fire';
  const signColor = ELEMENT_COLORS[signElement]?.fill || '#888';

  if (!signData || !rulerData) return null;

  const lensesToShow = activeLens === 'all' ? LENS_ORDER : [activeLens];

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium">
        Keywords &amp; Themes
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* Lens filter pills */}
          <div className="flex flex-wrap gap-1.5 px-1">
            <button
              onClick={() => setActiveLens('all')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                activeLens === 'all' ? 'bg-foreground/10 text-foreground ring-1 ring-foreground/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >All</button>
            {LENS_ORDER.map(lens => {
              const cfg = LENS_CONFIG[lens];
              const isActive = activeLens === lens;
              return (
                <button key={lens} onClick={() => setActiveLens(lens)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                    isActive ? 'ring-1 scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: cfg.color + (isActive ? '20' : '10'),
                    color: cfg.color,
                    ...(isActive ? { boxShadow: `0 0 0 1px ${cfg.color}40` } : {}),
                  }}
                >{cfg.label}</button>
              );
            })}
          </div>

          {/* Sign keywords */}
          <div className="rounded-xl border p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-base" style={{ color: signColor }}>{signSymbol}</span>
              {sign}
              <span className="text-[10px] font-normal text-muted-foreground ml-1">{signData.quality}</span>
            </div>
            {lensesToShow.map(lens => {
              const cfg = LENS_CONFIG[lens];
              const keywords = signData.lenses[lens];
              if (!keywords?.length) return null;
              return (
                <div key={lens}>
                  {(activeLens === 'all') && (
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: cfg.color }}>{cfg.label}</div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {keywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 rounded-full text-[10px] bg-muted/50 text-muted-foreground">{kw}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ruler keywords */}
          <div className="rounded-xl border p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-base" style={{ color: rulerColor }}>{rulerSymbol}</span>
              {rulerName}
              <span className="text-[10px] font-normal text-muted-foreground ml-1">Ruler</span>
            </div>
            {lensesToShow.map(lens => {
              const cfg = LENS_CONFIG[lens];
              const keywords = rulerData[lens];
              if (!keywords?.length) return null;
              return (
                <div key={lens}>
                  {(activeLens === 'all') && (
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: cfg.color }}>{cfg.label}</div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {keywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 rounded-full text-[10px] bg-muted/50 text-muted-foreground">{kw}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfectionsPanel({ birthDate, natalChart, personName }: ProfectionsPanelProps) {
  const [method, setMethod] = useState<ProfectionMethod>('modern');
  const profections = useMemo(
    () => natalChart?.planets ? calculateProfections(birthDate, natalChart, new Date(), method) : null,
    [birthDate, natalChart, method]
  );
  const [selectedYearAge, setSelectedYearAge] = useState<number | null>(null);
  const selectedYear = useMemo(() => {
    if (!profections) return null;
    if (selectedYearAge !== null) {
      return profections.years.find(y => y.age === selectedYearAge) || profections.currentYear;
    }
    return profections.currentYear;
  }, [profections, selectedYearAge]);
  const setSelectedYear = useCallback((year: ProfectionYear | null) => {
    setSelectedYearAge(year?.age ?? null);
  }, []);
  const colors = ELEMENT_COLORS[selectedYear?.element ?? 'fire'] || ELEMENT_COLORS.fire;
  const currentMonth = selectedYear?.months.find(m => m.isCurrent);

  // Time lord natal condition
  const timeLordCondition = useMemo(
    () => selectedYear ? getTimeLordNatalCondition(selectedYear.timeLord.ruler, natalChart) : null,
    [selectedYear?.timeLord.ruler, natalChart]
  );

  if (!profections || !selectedYear) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm text-muted-foreground/60">Calculate a chart first to see profections</p>
      </div>
    );
  }

  // Ordinal suffix helper
  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Yearly/Monthly Profections</h3>
          <div className="flex items-center gap-1 bg-muted/40 rounded-full p-0.5">
            <button
              onClick={() => { setMethod('traditional'); setSelectedYearAge(null); }}
              className={`px-2.5 py-1 text-[10px] rounded-full transition-colors ${
                method === 'traditional'
                  ? 'bg-foreground text-background font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Traditional
            </button>
            <button
              onClick={() => { setMethod('modern'); setSelectedYearAge(null); }}
              className={`px-2.5 py-1 text-[10px] rounded-full transition-colors ${
                method === 'modern'
                  ? 'bg-foreground text-background font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Modern
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Age {profections.currentAge} &mdash; {method === 'traditional'
            ? `${profections.currentYear.sign} year (from ASC)`
            : `${profections.currentYear.sign} year (equinox-based)`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Wheel + Timeline */}
        <div className="flex flex-col items-center gap-3 lg:sticky lg:top-4">
          <ProfectionWheel
            years={profections.years}
            onSelect={setSelectedYear}
            selectedAge={selectedYear.age}
            selectedYear={selectedYear}
            currentAge={profections.currentYear.age}
            natalChart={natalChart}
          />
          <YearTimeline
            years={profections.years}
            selectedAge={selectedYear.age}
            currentAge={profections.currentYear.age}
            onSelect={setSelectedYear}
          />
        </div>

        {/* Right: Details */}
        <div className="space-y-5">
          {/* Year Card */}
          <div className={`rounded-xl border-2 p-4 ${colors.bg} ${colors.ring} ring-1`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedYear.signSymbol}</span>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    Year {selectedYear.age}
                    {selectedYear.isCurrent && <Badge className="text-[10px] px-1.5 h-4">Current</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedYear.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &ndash; {selectedYear.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className={`text-right ${colors.text}`}>
                <div className="text-xl font-bold">{selectedYear.timeLord.rulerSymbol}</div>
                <div className="text-[10px]">Time Lord</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-background/60 p-2.5">
                <div className="text-muted-foreground mb-0.5">House</div>
                <div className="font-semibold">{ordinal(selectedYear.house)} House</div>
              </div>
              <div className="rounded-lg bg-background/60 p-2.5">
                <div className="text-muted-foreground mb-0.5">Sign</div>
                <div className="font-semibold">{selectedYear.sign}</div>
              </div>
              <div className="rounded-lg bg-background/60 p-2.5">
                <div className="text-muted-foreground mb-0.5">Ruler</div>
                <div className="font-semibold">{selectedYear.timeLord.rulerName}</div>
              </div>
              <div className="rounded-lg bg-background/60 p-2.5">
                <div className="text-muted-foreground mb-0.5">Element</div>
                <div className={`font-semibold capitalize ${colors.text}`}>{selectedYear.element}</div>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-background/60 p-2.5 text-xs text-muted-foreground">
              <Star className="w-3 h-3 inline mr-1 opacity-60" />
              {selectedYear.topics}
            </div>

            {/* Theme Tags */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(() => {
                const houseTheme = getThemeForHouse(selectedYear.house);
                const rulerTheme = getThemeForPlanet(selectedYear.timeLord.ruler);
                const themes = new Map<string, typeof houseTheme>();
                if (houseTheme) themes.set(houseTheme.key, houseTheme);
                if (rulerTheme) themes.set(rulerTheme.key, rulerTheme);
                return Array.from(themes.values()).map(theme => {
                  const Icon = theme!.icon;
                  return (
                    <div key={theme!.key} className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${theme!.bgClass} ring-1 ${theme!.ringClass}`}>
                      <Icon className="w-2.5 h-2.5" style={{ color: theme!.color }} />
                      <span className="text-[10px] font-medium" style={{ color: theme!.color }}>{theme!.shortName}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Keywords & Themes (expandable, grouped by lens) */}
          <KeywordsSection sign={selectedYear.sign} ruler={selectedYear.timeLord.ruler} />

          {/* Time Lord Natal Condition Card */}
          {timeLordCondition && (
            <TimeLordConditionCard
              condition={timeLordCondition}
              timeLordName={selectedYear.timeLord.rulerName}
              timeLordSymbol={selectedYear.timeLord.rulerSymbol}
              elementColors={colors}
            />
          )}

          {/* Monthly Profections — always visible */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Monthly Profections</h4>
              {selectedYear.isCurrent && currentMonth && (
                <Badge className="text-[10px] px-2 h-5">
                  Now: {currentMonth.signSymbol} {currentMonth.sign}
                </Badge>
              )}
            </div>

            <div className="rounded-xl border overflow-hidden">
              {selectedYear.months.map((month) => {
                const mElement = ZODIAC_SIGNS.find(s => s.name === month.sign)?.element || 'fire';
                const mColors = ELEMENT_COLORS[mElement];
                const dateRange = `${month.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${month.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

                return (
                  <div key={month.monthIndex}
                    className={`flex items-center gap-3 px-3.5 py-2.5 text-xs border-b last:border-b-0 transition-colors ${
                      month.isCurrent ? 'ring-1 ring-inset' : 'hover:bg-muted/30'
                    }`}
                    style={month.isCurrent ? { backgroundColor: mColors.fill + '12', ringColor: mColors.fill + '40' } : undefined}
                  >
                    {/* Month number */}
                    <span className="w-5 text-[10px] text-muted-foreground/50 tabular-nums shrink-0">{month.monthIndex + 1}</span>

                    {/* Sign symbol */}
                    <span className="text-base shrink-0" style={{ color: mColors.fill, opacity: month.isCurrent ? 1 : 0.6 }}>
                      {month.signSymbol}
                    </span>

                    {/* Sign name + house */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${month.isCurrent ? '' : 'text-muted-foreground'}`}>
                        {month.sign}
                        <span className="text-muted-foreground font-normal ml-1.5">H{month.house}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground/60">{dateRange}</div>
                    </div>

                    {/* Ruler */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span style={{ color: PLANETS[month.timeLord.ruler as keyof typeof PLANETS]?.color || '#888' }}>
                        {month.timeLord.rulerSymbol}
                      </span>
                      <span className="text-muted-foreground/60 hidden sm:inline">{month.timeLord.rulerName}</span>
                    </div>

                    {/* Current indicator */}
                    {month.isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: mColors.fill }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arabic Parts Section */}
          <ArabicPartsSection natalChart={natalChart} />
        </div>
      </div>
    </div>
  );
}
