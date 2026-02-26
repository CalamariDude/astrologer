/**
 * AspectTooltip - Reusable hover tooltip for synastry aspects
 * Shows educational content explaining what each aspect means
 */

import React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SynastryAspect, AspectTooltipProps } from './types';
import {
  getPlanetInfo,
  getAspectInfo,
  getPlanetPairInterpretation,
  isPassionPlanet,
} from '@/data/astrologyEducation';

// Normalize planet name for lookup
function normalizePlanetName(name: string): string {
  const mapping: Record<string, string> = {
    'Sun': 'sun',
    'Moon': 'moon',
    'Mercury': 'mercury',
    'Venus': 'venus',
    'Mars': 'mars',
    'Jupiter': 'jupiter',
    'Saturn': 'saturn',
    'North Node': 'northNode',
    'NNode': 'northNode',
    'True Node': 'northNode',
    'South Node': 'southNode',
    'SNode': 'southNode',
    'Pluto': 'pluto',
    'Chiron': 'chiron',
    'Vertex': 'vertex',
    'Juno': 'juno',
    'Ceres': 'ceres',
    'Lilith': 'lilith',
    'Uranus': 'uranus',
    'Neptune': 'neptune',
  };
  return mapping[name] || name.toLowerCase().replace(/[^a-z]/g, '');
}

export function AspectTooltip({
  aspect,
  expertMode,
  children,
  className,
}: AspectTooltipProps) {
  const planet1 = normalizePlanetName(aspect.planet1);
  const planet2 = normalizePlanetName(aspect.planet2);
  const aspectType = aspect.aspect.toLowerCase();

  const planet1Info = getPlanetInfo(planet1);
  const planet2Info = getPlanetInfo(planet2);
  const aspectInfo = getAspectInfo(aspectType);
  const interpretation = getPlanetPairInterpretation(planet1, planet2, aspectType);

  // Determine if this is a positive aspect
  const isHarmonious = aspectInfo?.harmonious ?? true;
  const isPassion = isPassionPlanet(planet1) || isPassionPlanet(planet2);
  const isSquareOrOpposition = aspectType === 'square' || aspectType === 'opposition';

  // Passion squares/oppositions are POSITIVE
  const isPositive = isHarmonious || (isPassion && isSquareOrOpposition);

  const scoreColor = (aspect.score ?? 0) >= 0 ? 'text-green-400' : 'text-red-400';
  const scoreBg = (aspect.score ?? 0) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20';

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className={cn('cursor-help', className)}>{children}</span>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80 bg-slate-900/95 border-slate-700 text-white p-4"
        side="top"
      >
        {/* Header with symbols */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl" style={{ color: planet1Info?.color }}>
            {planet1Info?.symbol}
          </span>
          <span className="text-xl" style={{ color: aspectInfo?.color }}>
            {aspectInfo?.symbol}
          </span>
          <span className="text-2xl" style={{ color: planet2Info?.color }}>
            {planet2Info?.symbol}
          </span>
          <div className="ml-auto">
            <Badge className={cn('font-mono', scoreBg, scoreColor)}>
              {(aspect.score ?? 0) >= 0 ? '+' : ''}
              {aspect.score ?? 0}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-lg text-white mb-1">
          {interpretation?.title || `${planet1Info?.name} ${aspectInfo?.name} ${planet2Info?.name}`}
        </h4>

        {/* Description */}
        <p className="text-sm text-slate-300 mb-3">
          {expertMode
            ? interpretation?.expertDesc || aspectInfo?.expertDesc
            : interpretation?.simpleDesc || aspectInfo?.simpleDesc}
        </p>

        {/* Marriage tip */}
        {interpretation?.marriageTip && (
          <div className="bg-pink-500/10 border border-pink-500/30 rounded p-2 mb-3">
            <p className="text-xs text-pink-200">
              <span className="font-semibold">In Marriage:</span>{' '}
              {interpretation.marriageTip}
            </p>
          </div>
        )}

        {/* Technical details (expert mode) */}
        {expertMode && (
          <div className="flex items-center gap-3 text-xs text-slate-400 border-t border-slate-700 pt-2 mt-2">
            <span>Orb: {aspect.orb.toFixed(1)}°</span>
            <span>•</span>
            <span className={isPositive ? 'text-green-400' : 'text-amber-400'}>
              {isPassion && isSquareOrOpposition
                ? 'Passion Aspect'
                : isHarmonious
                ? 'Harmonious'
                : 'Challenging'}
            </span>
            {aspect.applying !== undefined && (
              <>
                <span>•</span>
                <span>{aspect.applying ? 'Applying' : 'Separating'}</span>
              </>
            )}
          </div>
        )}

        {/* Passion indicator for squares */}
        {isPassion && isSquareOrOpposition && !expertMode && (
          <div className="text-xs text-purple-300 mt-2">
            This is a <span className="font-semibold">passion aspect</span> - creates
            magnetic attraction, not conflict.
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

// IndicatorTooltip - Generic tooltip for longevity/lifestyle indicators
export interface IndicatorTooltipComponentProps {
  title: string;
  simpleDesc: string;
  expertDesc: string;
  points?: number;
  maxPoints?: number;
  isPresent?: boolean;
  expertMode: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: 'longevity' | 'lifestyle' | 'polarity' | 'penalty' | 'house' | 'bonus';
}

export function IndicatorTooltip({
  title,
  simpleDesc,
  expertDesc,
  points,
  maxPoints,
  isPresent = true,
  expertMode,
  children,
  className,
  variant = 'longevity',
}: IndicatorTooltipComponentProps) {
  const variantColors = {
    longevity: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300' },
    lifestyle: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300' },
    polarity: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-300' },
    penalty: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300' },
    house: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-300' },
    bonus: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300' },
  };

  const colors = variantColors[variant];

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className={cn('cursor-help', className)}>{children}</span>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80 bg-slate-900/95 border-slate-700 text-white p-4"
        side="top"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-lg text-white">{title}</h4>
          {points !== undefined && (
            <Badge
              className={cn(
                'font-mono',
                isPresent ? colors.bg : 'bg-slate-600/20',
                isPresent ? colors.text : 'text-slate-400'
              )}
            >
              {isPresent ? (points >= 0 ? `+${points}` : points) : '--'}
              {maxPoints !== undefined && isPresent && ` / ${maxPoints}`}
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-slate-300 mb-2">
          {expertMode ? expertDesc : simpleDesc}
        </p>

        {/* Status */}
        {!isPresent && (
          <div className="text-xs text-slate-500 mt-2">
            Not present in this synastry
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

export default AspectTooltip;
