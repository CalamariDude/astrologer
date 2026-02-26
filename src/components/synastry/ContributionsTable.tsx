/**
 * ContributionsTable - Excel-like table showing ALL scoring factors
 * Displays aspects, house overlays, configurations, bonuses, and penalties
 * ranked from most significant to least
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Link2,
  Home,
  Triangle,
  Stars,
  Clock,
  Heart,
  Crown,
  ArrowLeftRight,
  Scale,
  AlertTriangle,
  Info,
  Filter,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScoringContribution, ContributionType } from './types';
import {
  PLANETS,
  ASPECTS,
  getPlanetPairInterpretation,
  getHouseOverlayInterpretation
} from '@/data/astrologyEducation';
import {
  loadAdjustments,
  saveAdjustment,
  removeAdjustment,
  generateContributionKey,
  getOrbRangeLabel,
  AdjustmentMap,
  AdjustmentData
} from '@/lib/adjustmentService';
import { getRFEImportance } from '@/lib/localSynastryV4';
import { getRFEIndicator } from '@/lib/rfeLookup';

interface ContributionsTableProps {
  contributions: ScoringContribution[];
  expertMode?: boolean;
  className?: string;
  showAdjustments?: boolean;
  onAdjustmentChange?: (count: number) => void;
}

// ============================================================================
// ASPECT GROUP FILTERS
// ============================================================================

type AspectFilterGroup = {
  id: string;
  label: string;
  icon?: string;
  color: string;
  match: (contribution: ScoringContribution) => boolean;
};

const ASPECT_FILTER_GROUPS: AspectFilterGroup[] = [
  {
    id: 'venus-mars',
    label: 'Venus-Mars',
    icon: '♀♂',
    color: 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return (p1.includes('venus') && p2.includes('mars')) ||
             (p1.includes('mars') && p2.includes('venus'));
    }
  },
  {
    id: 'venus-venus',
    label: 'Venus-Venus',
    icon: '♀♀',
    color: 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return p1.includes('venus') && p2.includes('venus');
    }
  },
  {
    id: 'mars-mars',
    label: 'Mars-Mars',
    icon: '♂♂',
    color: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return p1.includes('mars') && p2.includes('mars');
    }
  },
  {
    id: 'sun-moon',
    label: 'Sun-Moon',
    icon: '☉☽',
    color: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return (p1 === 'sun' && p2 === 'moon') || (p1 === 'moon' && p2 === 'sun');
    }
  },
  {
    id: 'moon-moon',
    label: 'Moon-Moon',
    icon: '☽☽',
    color: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return p1 === 'moon' && p2 === 'moon';
    }
  },
  {
    id: 'moon-mercury',
    label: 'Moon-Mercury',
    icon: '☽☿',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-300 hover:bg-cyan-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return (p1 === 'moon' && p2 === 'mercury') || (p1 === 'mercury' && p2 === 'moon');
    }
  },
  {
    id: 'saturn-x',
    label: 'Saturn-X',
    icon: '♄',
    color: 'bg-muted text-foreground border-border hover:bg-muted',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return p1 === 'saturn' || p2 === 'saturn';
    }
  },
  {
    id: 'jupiter-x',
    label: 'Jupiter-X',
    icon: '♃',
    color: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return p1 === 'jupiter' || p2 === 'jupiter';
    }
  },
  {
    id: 'pluto-x',
    label: 'Pluto-X',
    icon: '♇',
    color: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return p1 === 'pluto' || p2 === 'pluto';
    }
  },
  {
    id: 'ascendant-x',
    label: 'ASC-X',
    icon: 'AC',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return p1.includes('ascendant') || p2.includes('ascendant') ||
             p1 === 'asc' || p2 === 'asc' || p1 === 'ac' || p2 === 'ac';
    }
  },
  {
    id: 'karmic',
    label: 'Karmic',
    icon: '☊',
    color: 'bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return p1.includes('node') || p2.includes('node') ||
             p1.includes('nnode') || p2.includes('nnode') ||
             p1.includes('snode') || p2.includes('snode');
    }
  },
  {
    id: 'juno',
    label: 'Juno',
    icon: '⚵',
    color: 'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200',
    match: (c) => {
      if (c.type !== 'aspect' || !c.details) return false;
      const p1 = c.details.planet1?.toLowerCase() || '';
      const p2 = c.details.planet2?.toLowerCase() || '';
      return p1 === 'juno' || p2 === 'juno';
    }
  },
  {
    id: 'houses',
    label: 'Houses',
    icon: '⌂',
    color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 hover:bg-fuchsia-200',
    match: (c) => c.type === 'house_overlay'
  },
  {
    id: 'houses-1-5-7-8',
    label: '1/5/7/8 Houses',
    icon: '♡',
    color: 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200',
    match: (c) => {
      if (c.type !== 'house_overlay' || !c.details) return false;
      const house = c.details.house;
      return house === 1 || house === 5 || house === 7 || house === 8;
    }
  },
  {
    id: 'rfe-top',
    label: 'RFE Top 50',
    icon: '🎯',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200',
    match: (c) => {
      if (!c.details) return false;
      const rfe = c.details.planet1 && c.details.planet2 && c.details.aspect
        ? getRFEImportance(c.details.planet1, c.details.planet2, c.details.aspect)
        : null;
      return rfe !== null && rfe.importance >= 0.5;
    }
  },
  {
    id: 'rfe-marriage',
    label: 'Marriage',
    icon: '💍',
    color: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
    match: (c) => {
      if (!c.details) return false;
      const rfe = c.details.planet1 && c.details.planet2 && c.details.aspect
        ? getRFEImportance(c.details.planet1, c.details.planet2, c.details.aspect)
        : null;
      return rfe !== null && rfe.category === 'marriage';
    }
  },
  {
    id: 'rfe-divorce',
    label: 'Divorce Risk',
    icon: '💔',
    color: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
    match: (c) => {
      if (!c.details) return false;
      const rfe = c.details.planet1 && c.details.planet2 && c.details.aspect
        ? getRFEImportance(c.details.planet1, c.details.planet2, c.details.aspect)
        : null;
      return rfe !== null && rfe.category === 'divorce';
    }
  },
  {
    id: 'composite',
    label: 'Composite',
    icon: '🔮',
    color: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
    match: (c) => c.type === 'composite'
  },
];

// Helper to generate key from any contribution type
function getContributionKey(contribution: ScoringContribution): string | null {
  if (!contribution.details && contribution.type !== 'penalty' && contribution.type !== 'balance') {
    return null;
  }

  const details = contribution.details || {};
  return generateContributionKey(contribution.type, {
    planet1: details.planet1,
    planet2: details.planet2,
    planet3: details.planet3,
    planet4: details.planet4,
    aspect: details.aspect,
    orb: details.orb,
    house: details.house,
    houseOwner: details.houseOwner,
    ownerPlanet1: details.ownerPlanet1,
    configType: details.configType,
    sign: details.sign
  });
}

// Generate human-readable name for contribution
function getContributionName(contribution: ScoringContribution): string {
  const details = contribution.details || {};

  switch (contribution.type) {
    case 'aspect':
      return `${details.planet1 || '?'} ${details.aspect || ''} ${details.planet2 || '?'}`;
    case 'house_overlay':
      return `${details.planet1 || '?'} in ${details.house || '?'}th House`;
    case 'configuration':
      return details.configType || 'Configuration';
    case 'stellium':
      return `Stellium in ${details.sign || '?'}`;
    case 'composite':
      // Sign placement (no planet2)
      if (details.planet1 && details.sign && !details.planet2) {
        return `Composite ${details.planet1} in ${details.sign}`;
      }
      // Aspect (planet1 + aspect + planet2)
      return `Composite: ${details.planet1 || '?'} ${details.aspect || ''} ${details.planet2 || '?'}`;
    default:
      return contribution.description?.split('.')[0] || contribution.type;
  }
}

// Inline adjustment input component
function AdjustmentInput({
  contribution,
  adjustments,
  onSave
}: {
  contribution: ScoringContribution;
  adjustments: AdjustmentMap;
  onSave: (key: string, value: number | null, contribution: ScoringContribution) => void;
}) {
  const contributionKey = getContributionKey(contribution);
  if (!contributionKey) {
    return <span className="text-muted-foreground/40 text-xs">-</span>;
  }

  const existing = adjustments[contributionKey];
  const [value, setValue] = useState(existing?.adjustment?.toString() || '');
  const [isFocused, setIsFocused] = useState(false);

  // Update local state when adjustments change externally
  useEffect(() => {
    if (!isFocused) {
      setValue(existing?.adjustment?.toString() || '');
    }
  }, [existing?.adjustment, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = value.trim() === '' ? null : parseFloat(value);
    if (numValue !== null && isNaN(numValue)) return;
    onSave(contributionKey, numValue, contribution);
  };

  const hasAdjustment = existing && existing.adjustment !== 0;

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      placeholder="0"
      className={`w-14 px-1 py-0.5 text-xs text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
        hasAdjustment
          ? 'bg-yellow-50 border-yellow-300 font-medium'
          : 'bg-card border-border'
      }`}
    />
  );
}

// Type configuration with icons and colors
const TYPE_CONFIG: Record<ContributionType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string
}> = {
  aspect: { icon: Link2, color: '#3b82f6', bgColor: 'bg-blue-100', label: 'Aspect' },
  house_overlay: { icon: Home, color: '#a855f7', bgColor: 'bg-purple-100', label: 'House' },
  configuration: { icon: Triangle, color: '#f59e0b', bgColor: 'bg-amber-100', label: 'Config' },
  stellium: { icon: Stars, color: '#ec4899', bgColor: 'bg-pink-100', label: 'Stellium' },
  longevity: { icon: Clock, color: '#22c55e', bgColor: 'bg-green-100', label: 'Longevity' },
  harmony: { icon: Heart, color: '#f43f5e', bgColor: 'bg-rose-100', label: 'Harmony' },
  dignity: { icon: Crown, color: '#f59e0b', bgColor: 'bg-amber-100', label: 'Dignity' },
  reception: { icon: ArrowLeftRight, color: '#06b6d4', bgColor: 'bg-cyan-100', label: 'Reception' },
  balance: { icon: Scale, color: '#64748b', bgColor: 'bg-slate-100', label: 'Balance' },
  chart_ruler: { icon: Crown, color: '#8b5cf6', bgColor: 'bg-violet-100', label: 'Ruler' },
  composite: { icon: Link2, color: '#7c3aed', bgColor: 'bg-purple-100', label: 'Composite' },
  penalty: { icon: AlertTriangle, color: '#ef4444', bgColor: 'bg-red-100', label: 'Penalty' }
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  emotional: 'bg-blue-100 text-blue-800',
  chemistry: 'bg-pink-100 text-pink-800',
  communication: 'bg-cyan-100 text-cyan-800',
  love: 'bg-rose-100 text-rose-800',
  commitment: 'bg-amber-100 text-amber-800',
  family: 'bg-green-100 text-green-800',
  values: 'bg-purple-100 text-purple-800',
  prosperity: 'bg-yellow-100 text-yellow-800',
  growth: 'bg-indigo-100 text-indigo-800'
};

// Source colors and labels
const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  synastry: { label: 'Synastry', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  composite: { label: 'Composite', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  progressed: { label: 'Progressed', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  natal_a: { label: 'Person A', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  natal_b: { label: 'Person B', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  combined: { label: 'Combined', color: 'bg-muted/50 text-foreground border-border' },
};

// Helper to normalize planet names for lookup
function normalizePlanetName(name: string): string {
  const mapping: Record<string, string> = {
    'Sun': 'sun',
    'Moon': 'moon',
    'Mercury': 'mercury',
    'Venus': 'venus',
    'Mars': 'mars',
    'Jupiter': 'jupiter',
    'Saturn': 'saturn',
    'North Node': 'northnode',
    'NNode': 'northnode',
    'NorthNode': 'northnode',
    'True Node': 'northnode',
    'northnode': 'northnode',
    'truenode': 'northnode',
    'nnode': 'northnode',
    'South Node': 'southnode',
    'SNode': 'southnode',
    'SouthNode': 'southnode',
    'southnode': 'southnode',
    'snode': 'southnode',
    'Pluto': 'pluto',
    'Uranus': 'uranus',
    'Neptune': 'neptune',
    'Chiron': 'chiron',
    'Vertex': 'vertex',
    'Juno': 'juno',
    'Ceres': 'ceres',
    'Lilith': 'lilith',
    // Angles
    'Ascendant': 'ascendant',
    'ASC': 'ascendant',
    'AC': 'ascendant',
    'ascendant': 'ascendant',
    'Midheaven': 'midheaven',
    'MC': 'midheaven',
    'midheaven': 'midheaven',
    'Descendant': 'descendant',
    'DSC': 'descendant',
    'DC': 'descendant',
    'descendant': 'descendant',
    'IC': 'ic',
    'Imum Coeli': 'ic',
    'ic': 'ic'
  };
  return mapping[name] || name.toLowerCase().replace(/[^a-z]/g, '');
}

// Get enhanced description for aspects
function getEnhancedDescription(
  contribution: ScoringContribution,
  expertMode: boolean
): string {
  if (contribution.type === 'aspect' && contribution.details) {
    const { planet1, planet2, aspect } = contribution.details;
    if (planet1 && planet2 && aspect) {
      const interp = getPlanetPairInterpretation(
        normalizePlanetName(planet1),
        normalizePlanetName(planet2),
        aspect.toLowerCase()
      );
      if (interp) {
        return expertMode ? interp.expertDesc : interp.simpleDesc;
      }
    }
  }

  if (contribution.type === 'house_overlay' && contribution.details) {
    const { planet1, house } = contribution.details;
    if (planet1 && house) {
      const interp = getHouseOverlayInterpretation(
        normalizePlanetName(planet1),
        house
      );
      if (interp) {
        return expertMode ? interp.expertDesc : interp.simpleDesc;
      }
    }
  }

  return contribution.description;
}

// Orb strength configuration - returns label, color, and strength level (0-5)
function getOrbInfo(orb: number): { label: string; color: string; strength: number; description: string } {
  if (orb <= 1) return {
    label: 'Exact',
    color: 'text-emerald-600',
    strength: 5,
    description: 'Extremely powerful - planets are perfectly aligned'
  };
  if (orb <= 3) return {
    label: 'Tight',
    color: 'text-green-600',
    strength: 4,
    description: 'Very strong influence - closely connected'
  };
  if (orb <= 5) return {
    label: 'Close',
    color: 'text-lime-600',
    strength: 3,
    description: 'Strong influence - clearly felt'
  };
  if (orb <= 7) return {
    label: 'Moderate',
    color: 'text-amber-600',
    strength: 2,
    description: 'Moderate influence - noticeable but not dominant'
  };
  if (orb <= 9) return {
    label: 'Wide',
    color: 'text-orange-500',
    strength: 1,
    description: 'Subtle influence - background energy'
  };
  return {
    label: 'Very Wide',
    color: 'text-muted-foreground/60',
    strength: 0,
    description: 'Minimal influence - barely perceptible'
  };
}

// Legacy helper for tooltip text
function getOrbDescription(orb: number): string {
  return getOrbInfo(orb).label;
}

// Strength dots component
function StrengthDots({ strength, maxStrength = 5 }: { strength: number; maxStrength?: number }) {
  return (
    <div className="flex gap-0.5 mt-0.5">
      {Array.from({ length: maxStrength }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < strength ? 'bg-current' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

// Owner label colors - kept simple black for cleaner look
const OWNER_COLORS = {
  A: 'text-foreground',
  B: 'text-foreground',
} as const;

// Build tooltip content showing planet ownership
function buildTooltipContent(contribution: ScoringContribution): string | null {
  const { type, details, source } = contribution;

  if (!details) return null;

  const ownerLabel = (owner: 'A' | 'B' | undefined) => {
    if (owner === 'A') return 'Person A';
    if (owner === 'B') return 'Person B';
    return '';
  };

  // For aspects
  if (type === 'aspect' && details.planet1 && details.planet2) {
    const p1Name = PLANETS[normalizePlanetName(details.planet1)]?.name || details.planet1;
    const p2Name = PLANETS[normalizePlanetName(details.planet2)]?.name || details.planet2;
    const owner1 = ownerLabel(details.ownerPlanet1);
    const owner2 = ownerLabel(details.ownerPlanet2);

    let tooltip = '';
    if (owner1 && owner2) {
      tooltip = `${owner1}'s ${p1Name} ${details.aspect || ''} ${owner2}'s ${p2Name}`;
    }
    if (details.orb !== undefined) {
      tooltip += `\n${getOrbDescription(details.orb)} (${details.orb.toFixed(1)}°)`;
    }
    if (details.isProgressed) {
      tooltip += '\n(Progressed aspect)';
    }
    if (source) {
      tooltip += `\nSource: ${source}`;
    }
    return tooltip || null;
  }

  // For house overlays
  if (type === 'house_overlay' && details.planet1 && details.house) {
    const p1Name = PLANETS[normalizePlanetName(details.planet1)]?.name || details.planet1;
    const owner1 = ownerLabel(details.ownerPlanet1);
    const houseOwner = ownerLabel(details.houseOwner);

    if (owner1 && houseOwner) {
      return `${owner1}'s ${p1Name} in ${houseOwner}'s ${details.house}${getOrdinalSuffix(details.house)} house`;
    }
    return null;
  }

  // For configurations
  if (type === 'configuration') {
    const planets: string[] = [];

    if (details.planet1) {
      const p1Name = PLANETS[normalizePlanetName(details.planet1)]?.name || details.planet1;
      const owner1 = ownerLabel(details.ownerPlanet1);
      planets.push(owner1 ? `${owner1}'s ${p1Name}` : p1Name);
    }
    if (details.planet2) {
      const p2Name = PLANETS[normalizePlanetName(details.planet2)]?.name || details.planet2;
      const owner2 = ownerLabel(details.ownerPlanet2);
      planets.push(owner2 ? `${owner2}'s ${p2Name}` : p2Name);
    }
    if (details.planet3) {
      const p3Name = PLANETS[normalizePlanetName(details.planet3)]?.name || details.planet3;
      const owner3 = ownerLabel(details.ownerPlanet3);
      planets.push(owner3 ? `${owner3}'s ${p3Name}` : p3Name);
    }
    if (details.planet4) {
      const p4Name = PLANETS[normalizePlanetName(details.planet4)]?.name || details.planet4;
      const owner4 = ownerLabel(details.ownerPlanet4);
      planets.push(owner4 ? `${owner4}'s ${p4Name}` : p4Name);
    }

    if (planets.length > 0) {
      let tooltip = `${formatConfigType(details.configType || '')}\n${planets.join(', ')}`;
      if (details.isCrossChart) {
        tooltip += '\n(Cross-chart configuration)';
      }
      return tooltip;
    }
    return null;
  }

  return null;
}

// Sign symbols for display (using Unicode with text variation selector \uFE0E to prevent emoji rendering)
const SIGN_SYMBOLS: Record<string, { symbol: string; name: string }> = {
  aries: { symbol: '\u2648\uFE0E', name: 'Aries' },
  taurus: { symbol: '\u2649\uFE0E', name: 'Taurus' },
  gemini: { symbol: '\u264A\uFE0E', name: 'Gemini' },
  cancer: { symbol: '\u264B\uFE0E', name: 'Cancer' },
  leo: { symbol: '\u264C\uFE0E', name: 'Leo' },
  virgo: { symbol: '\u264D\uFE0E', name: 'Virgo' },
  libra: { symbol: '\u264E\uFE0E', name: 'Libra' },
  scorpio: { symbol: '\u264F\uFE0E', name: 'Scorpio' },
  sagittarius: { symbol: '\u2650\uFE0E', name: 'Sagittarius' },
  capricorn: { symbol: '\u2651\uFE0E', name: 'Capricorn' },
  aquarius: { symbol: '\u2652\uFE0E', name: 'Aquarius' },
  pisces: { symbol: '\u2653\uFE0E', name: 'Pisces' },
};

// Planet cell with colored A/B label and optional sign below
function PlanetCell({
  planetKey,
  owner,
  sign
}: {
  planetKey: string;
  owner?: 'A' | 'B';
  sign?: string;
}) {
  const normalizedKey = normalizePlanetName(planetKey);
  const p = PLANETS[normalizedKey];
  const name = p?.name || planetKey;
  const signInfo = sign ? SIGN_SYMBOLS[sign.toLowerCase()] : null;
  const ownerColor = owner ? OWNER_COLORS[owner] : '';

  // Use gray for nodes (like biwheel), otherwise use planet color
  const isNode = normalizedKey === 'northNode' || normalizedKey === 'southNode' ||
                 planetKey.toLowerCase().includes('node');
  const planetColor = isNode ? '#9ca3af' : (p?.color || '#6b7280');

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center justify-start cursor-help w-[64px]">
          {/* Row 1: Owner label - fixed 16px */}
          <div className="h-[16px] flex items-center justify-center">
            <span className={`text-xs font-bold ${ownerColor}`}>
              {owner || ''}
            </span>
          </div>
          {/* Row 2: Planet symbol - fixed 44px */}
          <div className="h-[44px] flex items-center justify-center">
            <span className="text-4xl" style={{ color: planetColor }}>
              {p?.symbol || '?'}
            </span>
          </div>
          {/* Row 3: Sign - fixed 24px */}
          <div className="h-[24px] flex items-center justify-center">
            <span className="text-lg text-muted-foreground">
              {signInfo?.symbol || ''}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-sm">
        <span className="font-medium">
          {owner && <span className={ownerColor}>Person {owner}'s </span>}{name}
          {signInfo && ` in ${signInfo.name}`}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

// Render the visual connection column based on contribution type
function ConnectionCell({ contribution }: { contribution: ScoringContribution }) {
  const { type, details } = contribution;

  if (type === 'aspect' && details?.planet1 && details?.planet2 && details?.aspect) {
    const asp = ASPECTS[details.aspect.toLowerCase()];
    const orbInfo = details.orb !== undefined ? getOrbInfo(details.orb) : null;
    const p1 = PLANETS[normalizePlanetName(details.planet1)];
    const p2 = PLANETS[normalizePlanetName(details.planet2)];
    const p1Name = p1?.name || details.planet1;
    const p2Name = p2?.name || details.planet2;
    const aspectName = asp?.name || details.aspect;

    return (
      <div className="flex flex-col items-start py-2">
        {/* Planets and aspect symbol row */}
        <div className="grid grid-cols-[64px_100px_64px] items-start gap-3">
          {/* Planet A */}
          <PlanetCell planetKey={details.planet1} owner={details.ownerPlanet1} sign={details.sign1} />

          {/* Aspect + Orb - using same fixed row heights as PlanetCell */}
          <div className="flex flex-col items-center justify-start w-[100px]">
            {/* Row 1: Empty spacer - fixed 16px */}
            <div className="h-[16px]" />
            {/* Row 2: Aspect symbol - fixed 44px */}
            <div className="h-[44px] flex items-center justify-center">
              <span className="text-4xl" style={{ color: asp?.color || '#6b7280' }}>
                {asp?.symbol || '?'}
              </span>
            </div>
            {/* Row 3: Orb info - fixed 24px */}
            <div className="h-[24px] flex items-center justify-center">
              {orbInfo && (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center cursor-help text-foreground">
                      <div className="flex items-center gap-0.5">
                        <span className="text-[11px] font-mono">{details.orb!.toFixed(1)}°</span>
                        <span className="text-[11px] font-medium">{orbInfo.label}</span>
                      </div>
                      <StrengthDots strength={orbInfo.strength} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                    <p className="font-medium">{orbInfo.label} Orb ({details.orb!.toFixed(1)}°)</p>
                    <p className="text-muted-foreground mt-1">{orbInfo.description}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Planet B */}
          <PlanetCell planetKey={details.planet2} owner={details.ownerPlanet2} sign={details.sign2} />
        </div>

        {/* Aspect name text below - centered under the grid */}
        <span className="text-xs font-medium text-muted-foreground mt-2 text-center" style={{ width: '252px' }}>
          {p1Name} {aspectName.toLowerCase()} {p2Name}
        </span>
      </div>
    );
  }

  if (type === 'house_overlay' && details?.planet1 && details?.house) {
    const houseOwnerColor = details.houseOwner ? OWNER_COLORS[details.houseOwner] : '';
    return (
      <div className="flex items-center gap-3">
        <PlanetCell planetKey={details.planet1} owner={details.ownerPlanet1} sign={details.sign1} />
        <span className="text-xl text-muted-foreground/40">→</span>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center justify-start cursor-help w-[64px]">
              {/* Row 1: Owner label - fixed 16px (matches PlanetCell) */}
              <div className="h-[16px] flex items-center justify-center">
                <span className={`text-xs font-bold ${houseOwnerColor}`}>
                  {details.houseOwner || ''}
                </span>
              </div>
              {/* Row 2: House number - fixed 44px */}
              <div className="h-[44px] flex items-center justify-center">
                <span className="text-4xl font-semibold text-purple-600">
                  {details.house}
                </span>
              </div>
              {/* Row 3: Label - fixed 24px */}
              <div className="h-[24px] flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/60">
                  House
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-sm">
            <span className={houseOwnerColor}>Person {details.houseOwner}'s</span> {details.house}{getOrdinalSuffix(details.house)} House
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (type === 'configuration' && details?.configType) {
    const planets = [
      { key: details.planet1, owner: details.ownerPlanet1, sign: details.sign1 },
      { key: details.planet2, owner: details.ownerPlanet2, sign: details.sign2 },
      { key: details.planet3, owner: details.ownerPlanet3, sign: details.sign3 },
      { key: details.planet4, owner: details.ownerPlanet4, sign: details.sign4 },
    ].filter(p => p.key);

    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-amber-600">
          {formatConfigType(details.configType)}
          {details.isCrossChart && <span className="text-muted-foreground/60 font-normal ml-1">(cross-chart)</span>}
        </span>
        <div className="flex items-center gap-2">
          {planets.map((p, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-muted-foreground/40">·</span>}
              <PlanetCell planetKey={p.key!} owner={p.owner} sign={p.sign} />
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'stellium' && details?.sign) {
    const signInfo = SIGN_SYMBOLS[details.sign.toLowerCase()];
    return (
      <div className="flex items-center gap-2">
        <Stars className="w-5 h-5 text-pink-500" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-pink-700">Stellium</span>
          <span className="text-xs text-muted-foreground">
            {signInfo?.symbol} {signInfo?.name || details.sign}
          </span>
        </div>
      </div>
    );
  }

  // Composite chart contributions - aspects (planet1 + aspect + planet2)
  if (type === 'composite' && details?.planet1 && details?.planet2 && details?.aspect) {
    const asp = ASPECTS[details.aspect.toLowerCase()];
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center min-w-[36px]">
          <span className="text-[10px] text-purple-500 font-medium">Comp</span>
          <span className="text-xl leading-none" style={{ color: PLANETS[normalizePlanetName(details.planet1)]?.color || '#6b7280' }}>
            {PLANETS[normalizePlanetName(details.planet1)]?.symbol || '?'}
          </span>
        </div>
        {asp && (
          <span className="text-lg" style={{ color: asp.color || '#6b7280' }}>
            {asp.symbol}
          </span>
        )}
        <div className="flex flex-col items-center min-w-[36px]">
          <span className="text-[10px] text-purple-500 font-medium">Comp</span>
          <span className="text-xl leading-none" style={{ color: PLANETS[normalizePlanetName(details.planet2)]?.color || '#6b7280' }}>
            {PLANETS[normalizePlanetName(details.planet2)]?.symbol || '?'}
          </span>
        </div>
      </div>
    );
  }

  // Composite chart contributions - sign placements (planet1 + sign)
  // Display matches synastry style: label on top, large symbol, sign below
  if (type === 'composite' && details?.planet1 && details?.sign && !details?.planet2) {
    const signInfo = SIGN_SYMBOLS[details.sign.toLowerCase()];
    const normalizedKey = normalizePlanetName(details.planet1);
    const p1 = PLANETS[normalizedKey];
    const planetColor = p1?.color || '#7c3aed';

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {/* Planet with Composite label */}
            <div className="flex flex-col items-center justify-start w-[64px]">
              {/* Row 1: Composite label */}
              <div className="h-[16px] flex items-center justify-center">
                <span className="text-xs font-bold text-purple-500">Comp</span>
              </div>
              {/* Row 2: Planet symbol */}
              <div className="h-[44px] flex items-center justify-center">
                <span className="text-4xl" style={{ color: planetColor }}>
                  {p1?.symbol || '?'}
                </span>
              </div>
              {/* Row 3: Sign */}
              <div className="h-[24px] flex items-center justify-center">
                <span className="text-lg text-muted-foreground">
                  {signInfo?.symbol || ''}
                </span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-sm max-w-[300px]">
          <p className="font-medium text-purple-600">Composite {p1?.name || details.planet1} in {signInfo?.name || details.sign}</p>
          <p className="text-muted-foreground mt-1 text-xs">{contribution.description.split(':')[1]?.trim() || contribution.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Default: show description snippet
  return (
    <span className="text-sm text-foreground break-words whitespace-normal" style={{ maxWidth: '280px', display: 'block' }}>
      {contribution.description.split('.')[0]}
    </span>
  );
}

// Helper functions
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatConfigType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function ContributionsTable({
  contributions,
  expertMode = false,
  className = '',
  showAdjustments = false,
  onAdjustmentChange
}: ContributionsTableProps) {
  const [adjustments, setAdjustments] = useState<AdjustmentMap>({});
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Load adjustments on mount and when contributions change
  useEffect(() => {
    setAdjustments(loadAdjustments());
  }, [contributions]);

  // Toggle a filter on/off
  const toggleFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  // Filter contributions based on active filters
  const filteredContributions = useMemo(() => {
    if (activeFilters.size === 0) return contributions;

    return contributions.filter(c => {
      // If any active filter matches, include this contribution
      for (const filterId of activeFilters) {
        const filterGroup = ASPECT_FILTER_GROUPS.find(g => g.id === filterId);
        if (filterGroup && filterGroup.match(c)) {
          return true;
        }
      }
      return false;
    });
  }, [contributions, activeFilters]);

  // Count matches per filter group (for showing counts on badges)
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of ASPECT_FILTER_GROUPS) {
      counts[group.id] = contributions.filter(c => group.match(c)).length;
    }
    return counts;
  }, [contributions]);

  // Handle saving an adjustment for any contribution type
  const handleSaveAdjustment = useCallback((
    contributionKey: string,
    value: number | null,
    contribution: ScoringContribution
  ) => {
    if (value === null || value === 0) {
      removeAdjustment(contributionKey);
    } else {
      const details = contribution.details || {};
      const data: AdjustmentData = {
        name: getContributionName(contribution),
        type: contribution.type,
        planet1: details.planet1,
        planet2: details.planet2,
        planet3: details.planet3,
        planet4: details.planet4,
        aspect: details.aspect,
        orbRange: details.orb !== undefined ? getOrbRangeLabel(details.orb) : undefined,
        house: details.house,
        configType: details.configType,
        sign: details.sign,
        currentWeight: contribution.points,
        adjustment: value,
        updatedAt: new Date().toISOString()
      };
      saveAdjustment(contributionKey, data);
    }

    // Reload adjustments and notify parent
    const updated = loadAdjustments();
    setAdjustments(updated);
    onAdjustmentChange?.(Object.keys(updated).length);
  }, [onAdjustmentChange]);

  if (!contributions || contributions.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[200px] ${className}`}>
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
          <p>No scoring factors calculated</p>
          <p className="text-sm">Run a V3 synastry calculation to see all contributions</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats from filtered contributions
  const positivePoints = filteredContributions
    .filter(c => c.points > 0)
    .reduce((sum, c) => sum + c.points, 0);
  const negativePoints = filteredContributions
    .filter(c => c.points < 0)
    .reduce((sum, c) => sum + c.points, 0);

  // Count aspects with adjustments
  const adjustmentCount = Object.keys(adjustments).length;

  // Calculate RFE stats
  const rfeStats = useMemo(() => {
    let marriageCount = 0;
    let divorceCount = 0;
    let compositeCount = 0;
    let topFeatureCount = 0;

    for (const c of filteredContributions) {
      const details = c.details || {};
      let rfe = null;

      if (details.planet1 && details.planet2 && details.aspect) {
        rfe = getRFEImportance(details.planet1, details.planet2, details.aspect);
      } else if (c.type === 'composite' && details.planet1) {
        rfe = getRFEImportance('composite', details.planet1, '');
      }

      if (rfe) {
        if (rfe.category === 'marriage') marriageCount++;
        if (rfe.category === 'divorce') divorceCount++;
        if (rfe.category === 'composite') compositeCount++;
        if (rfe.importance >= 0.5) topFeatureCount++;
      }
    }

    return { marriageCount, divorceCount, compositeCount, topFeatureCount };
  }, [filteredContributions]);

  return (
    <TooltipProvider delayDuration={0}>
    <div className={`space-y-4 ${className}`}>
      {/* Filter bar */}
      <div className="p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filter by aspect group:</span>
          {activeFilters.size > 0 && (
            <button
              onClick={clearFilters}
              className="ml-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ASPECT_FILTER_GROUPS.map(group => {
            const count = filterCounts[group.id];
            const isActive = activeFilters.has(group.id);
            return (
              <button
                key={group.id}
                onClick={() => toggleFilter(group.id)}
                disabled={count === 0}
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                  border transition-all
                  ${count === 0
                    ? 'bg-muted/50 text-muted-foreground/40 border-border cursor-not-allowed'
                    : isActive
                      ? `${group.color} ring-2 ring-offset-1 ring-current`
                      : `${group.color} opacity-70 hover:opacity-100`
                  }
                `}
              >
                {group.icon && <span className="text-sm">{group.icon}</span>}
                <span>{group.label}</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                  count === 0 ? 'bg-muted' : 'bg-card/50'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {activeFilters.size > 0
              ? `${filteredContributions.length} of ${contributions.length} factors`
              : `${contributions.length} factors`
            }
          </span>
          <span className="text-sm text-green-600 font-medium">
            +{positivePoints.toFixed(1)} positive
          </span>
          <span className="text-sm text-red-600 font-medium">
            {negativePoints.toFixed(1)} negative
          </span>
          {showAdjustments && adjustmentCount > 0 && (
            <span className="text-sm text-yellow-600 font-medium">
              {adjustmentCount} adjustments
            </span>
          )}
          <span className="text-muted-foreground/40">|</span>
          <span className="text-sm text-emerald-600 font-medium" title="RFE Top 50 features found">
            🎯 {rfeStats.topFeatureCount} RFE top
          </span>
          {rfeStats.marriageCount > 0 && (
            <span className="text-sm text-green-600 font-medium" title="Marriage predictors">
              💍 {rfeStats.marriageCount}
            </span>
          )}
          {rfeStats.divorceCount > 0 && (
            <span className="text-sm text-red-600 font-medium" title="Divorce risk factors">
              💔 {rfeStats.divorceCount}
            </span>
          )}
          {rfeStats.compositeCount > 0 && (
            <span className="text-sm text-purple-600 font-medium" title="Composite factors">
              🔮 {rfeStats.compositeCount}
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-foreground">
          Net: {(positivePoints + negativePoints).toFixed(1)}
        </span>
      </div>

      {/* Educational explanation */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-2">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>How to read this table:</strong> Every row represents one factor contributing to your compatibility score.
            Rows are sorted by impact - the most significant factors appear first.
            <span className="text-green-600 font-medium"> Green points</span> add to your score (strengths).
            <span className="text-red-600 font-medium"> Red points</span> subtract from it (areas needing attention).
            Each factor includes its type (aspect, house placement, etc.), the planets/houses involved, which life area it affects, and a detailed explanation.
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={{ width: '320px', maxWidth: '320px' }}>
                Connection
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                Points
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">RFE</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[300px]">
                    <p className="font-semibold">RFE = Recursive Feature Elimination</p>
                    <p className="mt-1 text-muted-foreground">How important this factor is for <em>predicting</em> marriage vs divorce (not whether it's good or bad).</p>
                    <div className="mt-2 space-y-1 border-t pt-2">
                      <p><span className="text-green-600 font-semibold">Green %</span> = High % means strong predictor of <em>staying married</em></p>
                      <p><span className="text-red-600 font-semibold">Red %</span> = High % means strong predictor of <em>divorce</em></p>
                      <p><span className="text-muted-foreground/60">Gray</span> = Age artifact or weak predictor</p>
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground/60">From classifier trained on 4,372 couples (68.9% accuracy)</p>
                  </TooltipContent>
                </Tooltip>
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">M/D</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[300px]">
                    <p className="font-semibold">Dataset Frequency: Married vs Divorced</p>
                    <p className="mt-1 text-muted-foreground">How much more common this factor is in married couples vs divorced couples.</p>
                    <div className="mt-2 space-y-1 border-t pt-2">
                      <p><span className="text-green-600 font-semibold">💍 Green</span> = More common in <em>married</em> couples</p>
                      <p><span className="text-red-600 font-semibold">💔 Red</span> = More common in <em>divorced</em> couples</p>
                      <p><span className="text-muted-foreground/60">—</span> = Similar rates in both (no signal)</p>
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground/60">Based on 2,000 divorced (Mexico) and 500 married (Gauquelin) couples</p>
                  </TooltipContent>
                </Tooltip>
              </th>
              {showAdjustments && (
                <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Adj</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-[200px]">
                      <p>Adjustment notes for algorithm tuning.</p>
                      <p className="mt-1 text-muted-foreground/60">Enter +/- values to note if this weight feels too low/high.</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredContributions.map((contribution, index) => {
              const typeConfig = TYPE_CONFIG[contribution.type] || TYPE_CONFIG.aspect;
              const IconComponent = typeConfig.icon;
              const isPositive = contribution.points >= 0;
              const enhancedDesc = getEnhancedDescription(contribution, expertMode);

              return (
                <tr
                  key={contribution.id || index}
                  className={`hover:bg-muted/50 transition-colors ${
                    isPositive ? 'bg-card' : 'bg-red-50/30'
                  }`}
                >
                  {/* Type */}
                  <td className="px-4 py-3">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.bgColor}`}
                      style={{ color: typeConfig.color }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      <span>{typeConfig.label}</span>
                    </div>
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3">
                    {contribution.source && (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                          SOURCE_CONFIG[contribution.source]?.color || 'bg-muted/50 text-muted-foreground border-border'
                        }`}
                      >
                        {SOURCE_CONFIG[contribution.source]?.label || contribution.source}
                      </span>
                    )}
                  </td>

                  {/* Connection */}
                  <td className="px-4 py-3" style={{ width: '320px', maxWidth: '320px' }}>
                    <ConnectionCell contribution={contribution} />
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={CATEGORY_COLORS[contribution.category] || 'bg-muted text-foreground'}
                    >
                      {formatCategory(contribution.category)}
                    </Badge>
                  </td>

                  {/* Points */}
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-lg font-bold ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isPositive ? '+' : ''}{contribution.points.toFixed(1)}
                    </span>
                  </td>

                  {/* RFE Importance */}
                  <td className="px-2 py-3 text-center">
                    {(() => {
                      const details = contribution.details || {};
                      let rfe = null;

                      // For aspects, look up by planet1-planet2-aspect
                      if (details.planet1 && details.planet2 && details.aspect) {
                        rfe = getRFEImportance(details.planet1, details.planet2, details.aspect);
                      }
                      // For composite contributions, look up by composite-planet
                      else if (contribution.type === 'composite' && details.planet1) {
                        rfe = getRFEImportance('composite', details.planet1, '');
                      }
                      // For house overlays, look up RFE from Gauquelin data
                      if (contribution.type === 'house_overlay' && details.planet1 && details.house) {
                        rfe = getRFEImportance(details.planet1, '', '', details.house);
                      }

                      if (!rfe) {
                        return <span className="text-muted-foreground/40 text-xs">-</span>;
                      }

                      const importancePercent = Math.round(rfe.importance * 100);

                      // For composite factors, determine direction from the actual score
                      const effectiveCategory = rfe.category === 'composite'
                        ? (contribution.points > 0 ? 'marriage' : contribution.points < 0 ? 'divorce' : 'composite')
                        : rfe.category;

                      const isHouseOverlay = contribution.type === 'house_overlay';
                      const colorClass = isHouseOverlay ? 'text-muted-foreground/60 bg-muted/50' :
                                        effectiveCategory === 'marriage' ? 'text-green-600 bg-green-50' :
                                        effectiveCategory === 'divorce' ? 'text-red-600 bg-red-50' :
                                        rfe.category === 'composite' ? 'text-purple-600 bg-purple-50' :
                                        'text-muted-foreground/60 bg-muted/50';

                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${colorClass}`}>
                              {importancePercent}%
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs max-w-[320px]">
                            <p className="font-semibold">
                              {isHouseOverlay
                                ? `Gauquelin Rank #${rfe.rank} — ${importancePercent}% Statistical Significance`
                                : `RFE Rank #${rfe.rank} — ${importancePercent}% Predictive Power`}
                            </p>
                            <p className="mt-1 text-muted-foreground italic">
                              {isHouseOverlay
                                ? 'Frequency compared to random expectation (8.33% per house) in 500 married couples'
                                : effectiveCategory === 'marriage'
                                ? '✅ High RFE + positive score = Strong signal of staying married'
                                : effectiveCategory === 'divorce'
                                ? '⚠️ High RFE + negative score = Strong signal of divorce'
                                : 'Predictive importance for classification accuracy'}
                            </p>
                            <p className="mt-2">{rfe.evidence}</p>
                            <div className={`mt-2 px-2 py-1 rounded ${
                              effectiveCategory === 'marriage' ? 'bg-green-100 text-green-700' :
                              effectiveCategory === 'divorce' ? 'bg-red-100 text-red-700' :
                              rfe.category === 'composite' ? 'bg-purple-100 text-purple-700' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {effectiveCategory === 'marriage' ? '💍 Over-represented in married couples' :
                               effectiveCategory === 'divorce' ? '💔 Under-represented in married couples' :
                               rfe.category === 'composite' ? '🔮 Composite Factor — check score for direction' :
                               '⚪ Neutral/Age artifact'}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </td>

                  {/* M/D Dataset Frequency */}
                  <td className="px-2 py-3 text-center">
                    {(() => {
                      const indicator = getRFEIndicator(contribution.description || getContributionName(contribution), contribution.type);
                      if (!indicator || indicator.label === 'neutral') {
                        return <span className="text-muted-foreground/40 text-xs">—</span>;
                      }

                      const isMarried = indicator.label === 'married';
                      const ratioText = isMarried
                        ? `${indicator.ratio.toFixed(1)}×`
                        : `${(1 / indicator.ratio).toFixed(1)}×`;
                      const colorClass = isMarried
                        ? (indicator.strength === 'strong' ? 'text-green-700 bg-green-100' : 'text-green-600 bg-green-50')
                        : (indicator.strength === 'strong' ? 'text-red-700 bg-red-100' : 'text-red-600 bg-red-50');
                      const icon = isMarried ? '💍' : '💔';

                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${colorClass}`}>
                              {icon}{ratioText}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs max-w-[300px]">
                            <p className="font-semibold">
                              {isMarried ? 'Over-represented in married couples' : 'Over-represented in divorced couples'}
                            </p>
                            <div className="mt-1 space-y-0.5">
                              <p>Married: {(indicator.marriedFreq * 100).toFixed(1)}% of couples</p>
                              <p>Divorced: {(indicator.divorceFreq * 100).toFixed(1)}% of couples</p>
                              <p className="font-medium mt-1">
                                {isMarried
                                  ? `${indicator.ratio.toFixed(1)}× more common in married`
                                  : `${(1 / indicator.ratio).toFixed(1)}× more common in divorced`}
                              </p>
                            </div>
                            <p className={`mt-2 px-2 py-1 rounded ${isMarried ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {indicator.strength === 'strong' ? 'Strong' : 'Moderate'} {isMarried ? 'marriage' : 'divorce'} indicator
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </td>

                  {/* Adjustment */}
                  {showAdjustments && (
                    <td className="px-2 py-3 text-center">
                      <AdjustmentInput
                        contribution={contribution}
                        adjustments={adjustments}
                        onSave={handleSaveAdjustment}
                      />
                    </td>
                  )}

                  {/* Description */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      {enhancedDesc}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state when filters active but no matches */}
        {filteredContributions.length === 0 && activeFilters.size > 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <Filter className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p>No factors match the selected filters</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}

export default ContributionsTable;
