/**
 * HouseOverlays - Displays house overlay bonuses and penalties
 * Shows where each person's planets fall in the other's houses
 * Light theme version
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HouseOverlaysProps, HouseOverlayData } from './types';
import { IndicatorTooltip } from './AspectTooltip';
import { Home, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';
import { PLANETS } from '@/data/astrologyEducation';

// Normalize planet names for PLANETS lookup
function normalizePlanetName(name: string): string {
  const mapping: Record<string, string> = {
    'northnode': 'northNode',
    'truenode': 'northNode',
    'nnode': 'northNode',
    'southnode': 'southNode',
    'snode': 'southNode',
  };
  return mapping[name.toLowerCase()] || name;
}

function HouseOverlayRow({
  overlay,
  expertMode,
  personAName,
  personBName,
}: {
  overlay: HouseOverlayData;
  expertMode: boolean;
  personAName: string;
  personBName: string;
}) {
  const planetInfo = PLANETS[normalizePlanetName(overlay.planet)];
  const isBonus = overlay.isBonus;
  const houseName = getHouseName(overlay.house);

  // Create description of whose planet is where
  const placementDesc = overlay.personA
    ? `${personAName}'s ${planetInfo?.name || overlay.planet} in ${personBName}'s ${houseName}`
    : `${personBName}'s ${planetInfo?.name || overlay.planet} in ${personAName}'s ${houseName}`;

  return (
    <IndicatorTooltip
      title={overlay.title}
      simpleDesc={overlay.simpleDesc}
      expertDesc={overlay.expertDesc}
      points={overlay.totalScore}
      isPresent={true}
      expertMode={expertMode}
      variant="house"
    >
      <div
        className={cn(
          'flex items-center justify-between py-2 px-3 rounded-lg transition-colors border',
          isBonus
            ? 'bg-amber-50 hover:bg-amber-100 border-amber-200'
            : 'bg-red-50 hover:bg-red-100 border-red-200'
        )}
      >
        <div className="flex items-center gap-3">
          {isBonus ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <span className="text-xl" style={{ color: planetInfo?.color }}>
            {planetInfo?.symbol || '?'}
          </span>
          <div>
            <span
              className={cn(
                'text-sm font-medium block',
                isBonus ? 'text-foreground' : 'text-red-700'
              )}
            >
              {overlay.title}
            </span>
            <span className="text-xs text-muted-foreground">{placementDesc}</span>
          </div>
        </div>
        <div className="text-right">
          <Badge
            className={cn(
              'font-mono',
              isBonus
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-red-100 text-red-700 border-red-200'
            )}
            variant="outline"
          >
            {isBonus ? '+' : ''}
            {overlay.totalScore}
          </Badge>
          {expertMode && (
            <div className="text-xs text-muted-foreground mt-1">
              {Object.entries(overlay.scores)
                .map(([cat, score]) => `${cat}: ${score >= 0 ? '+' : ''}${score}`)
                .join(', ')}
            </div>
          )}
        </div>
      </div>
    </IndicatorTooltip>
  );
}

function getHouseName(house: number): string {
  const houseNames: Record<number, string> = {
    1: '1st House (Self)',
    2: '2nd House (Values)',
    3: '3rd House (Communication)',
    4: '4th House (Home)',
    5: '5th House (Romance)',
    6: '6th House (Daily Life)',
    7: '7th House (Partnership)',
    8: '8th House (Intimacy)',
    9: '9th House (Philosophy)',
    10: '10th House (Career)',
    11: '11th House (Friends)',
    12: '12th House (Spirituality)',
  };
  return houseNames[house] || `${house}th House`;
}

export function HouseOverlays({
  overlays,
  totalBonuses,
  totalPenalties,
  personAName,
  personBName,
  expertMode,
  className,
}: HouseOverlaysProps) {
  const bonusOverlays = overlays.filter((o) => o.isBonus);
  const penaltyOverlays = overlays.filter((o) => !o.isBonus);
  const netScore = totalBonuses + totalPenalties;

  return (
    <Card className={cn('bg-card border border-amber-200 shadow-sm', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Home className="w-5 h-5 text-amber-600" />
            House Overlays
          </CardTitle>
          <Badge
            className={cn(
              'font-mono text-lg',
              netScore >= 0
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-red-100 text-red-700 border-red-200'
            )}
            variant="outline"
          >
            {netScore >= 0 ? '+' : ''}
            {netScore}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {expertMode
            ? `Where ${personAName}'s and ${personBName}'s planets fall in each other's houses`
            : 'How your planets interact with each other\'s life areas'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bonus overlays */}
        {bonusOverlays.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-green-600 font-semibold flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Beneficial Placements ({bonusOverlays.length})
            </h4>
            <div className="space-y-1">
              {bonusOverlays.map((overlay) => (
                <HouseOverlayRow
                  key={overlay.id}
                  overlay={overlay}
                  expertMode={expertMode}
                  personAName={personAName}
                  personBName={personBName}
                />
              ))}
            </div>
          </div>
        )}

        {/* Penalty overlays */}
        {penaltyOverlays.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-red-600 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Challenging Placements ({penaltyOverlays.length})
            </h4>
            <div className="space-y-1">
              {penaltyOverlays.map((overlay) => (
                <HouseOverlayRow
                  key={overlay.id}
                  overlay={overlay}
                  expertMode={expertMode}
                  personAName={personAName}
                  personBName={personBName}
                />
              ))}
            </div>
          </div>
        )}

        {/* No overlays message */}
        {overlays.length === 0 && (
          <div className="text-center py-4 text-muted-foreground/60">
            <Home className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              House overlays require birth times for both people
            </p>
          </div>
        )}

        {/* Summary breakdown */}
        {overlays.length > 0 && (
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bonus Overlays:</span>
              <span className="text-green-600 font-mono">+{totalBonuses}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Challenge Overlays:</span>
              <span className="text-red-600 font-mono">{totalPenalties}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold mt-1 pt-1 border-t border-border">
              <span className="text-foreground">Net House Score:</span>
              <span
                className={cn(
                  'font-mono',
                  netScore >= 0 ? 'text-green-700' : 'text-red-700'
                )}
              >
                {netScore >= 0 ? '+' : ''}
                {netScore}
              </span>
            </div>
          </div>
        )}

        {/* Expert tip */}
        {expertMode && bonusOverlays.some((o) => o.house === 4) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <p className="text-xs text-amber-700">
              <Sparkles className="w-3 h-3 inline mr-1" />
              4th House placements are the #1 indicator for marriage longevity. Moon in
              4th is especially powerful.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HouseOverlays;
