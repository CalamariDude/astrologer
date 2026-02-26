/**
 * PolarityBonuses - Displays polarity/opposition bonuses
 * Shows Venus-Mars, Sun-Moon, Pluto polarity, etc.
 * Light theme version
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PolarityBonusesProps, PolarityBonusData } from './types';
import { IndicatorTooltip } from './AspectTooltip';
import { CheckCircle2, Circle, Zap, Sparkles } from 'lucide-react';

// Icon/symbol map for polarity types
const polaritySymbols: Record<string, string> = {
  venusMarsOpposition: '♀ ☍ ♂',
  sunMoonOpposition: '☉ ☍ ☽',
  ascendantOpposition: 'Asc ☍ Asc',
  plutoPolarity: '♇ ☍',
  chironNodePolarity: '⚷ ☍ ☊',
  elementBalance: '🜂 🜃 🜁 🜄',
  productiveSquares: '□',
  venusRetrogradeMatch: '♀℞',
};

function PolarityBonusRow({
  bonus,
  expertMode,
}: {
  bonus: PolarityBonusData;
  expertMode: boolean;
}) {
  return (
    <IndicatorTooltip
      title={bonus.name}
      simpleDesc={bonus.simpleDesc}
      expertDesc={bonus.expertDesc}
      points={bonus.points}
      maxPoints={bonus.maxPoints}
      isPresent={bonus.isPresent}
      expertMode={expertMode}
      variant="polarity"
    >
      <div
        className={cn(
          'flex items-center justify-between py-2 px-3 rounded-lg transition-colors border',
          bonus.isPresent
            ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200'
            : 'bg-muted/50 hover:bg-muted border-border opacity-60'
        )}
      >
        <div className="flex items-center gap-3">
          {bonus.isPresent ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground/60" />
          )}
          <span className="text-lg font-mono text-cyan-700">
            {polaritySymbols[bonus.id] || '☍'}
          </span>
          <div>
            <span
              className={cn(
                'text-sm font-medium block',
                bonus.isPresent ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {bonus.name}
            </span>
            {bonus.isPresent && bonus.isDoubleWhammy && (
              <span className="text-xs text-cyan-600">Double Whammy!</span>
            )}
          </div>
        </div>
        <Badge
          className={cn(
            'font-mono',
            bonus.isPresent
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-muted text-muted-foreground border-border'
          )}
          variant="outline"
        >
          {bonus.isPresent ? `+${bonus.points}` : '--'}
        </Badge>
      </div>
    </IndicatorTooltip>
  );
}

export function PolarityBonuses({
  bonuses,
  totalBonus,
  expertMode,
  className,
}: PolarityBonusesProps) {
  const presentBonuses = bonuses.filter((b) => b.isPresent);
  const absentBonuses = bonuses.filter((b) => !b.isPresent);

  return (
    <Card className={cn('bg-card border border-cyan-200 shadow-sm', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Zap className="w-5 h-5 text-cyan-600" />
            Polarity Bonuses
          </CardTitle>
          <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 font-mono text-lg" variant="outline">
            +{totalBonus}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {expertMode
            ? 'Oppositions and complementary energies that create magnetic attraction'
            : 'Magnetic attraction from opposite but complementary energies'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Present bonuses */}
        {presentBonuses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-green-600 font-semibold flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Active Polarities ({presentBonuses.length})
            </h4>
            <div className="space-y-1">
              {presentBonuses.map((bonus) => (
                <PolarityBonusRow
                  key={bonus.id}
                  bonus={bonus}
                  expertMode={expertMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Absent bonuses (collapsed) */}
        {absentBonuses.length > 0 && (
          <details className="group">
            <summary className="text-xs uppercase tracking-wider text-muted-foreground font-semibold cursor-pointer hover:text-foreground">
              Not Present ({absentBonuses.length}) ▼
            </summary>
            <div className="space-y-1 mt-2">
              {absentBonuses.map((bonus) => (
                <PolarityBonusRow
                  key={bonus.id}
                  bonus={bonus}
                  expertMode={expertMode}
                />
              ))}
            </div>
          </details>
        )}

        {/* Explanation for non-experts */}
        {!expertMode && presentBonuses.length > 0 && (
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-cyan-700">
              <Zap className="w-4 h-4 inline mr-1" />
              Polarity creates magnetic attraction. Opposites complete each other -
              what one lacks, the other provides.
            </p>
          </div>
        )}

        {/* Expert note about Pluto polarity */}
        {expertMode && presentBonuses.some((b) => b.id === 'plutoPolarity') && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
            <p className="text-xs text-purple-700">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Pluto polarity creates the MOST intense, magnetic attraction. Pluto
              oppositions are soul-merging, transformative connections.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PolarityBonuses;
