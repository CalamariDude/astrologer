/**
 * LifestyleCompatibility - Displays "Best Friends Who Build a Life" indicators
 * Shows 10 lifestyle indicators for practical day-to-day harmony
 * Light theme version
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LifestyleCompatibilityProps, LifestyleIndicatorData } from './types';
import { IndicatorTooltip } from './AspectTooltip';
import { CheckCircle2, Circle, Users, Laugh, Heart, Home, DollarSign, Sparkles, Compass, Palette, Moon, Calendar } from 'lucide-react';

// Icon map for different lifestyle indicators
const lifestyleIcons: Record<string, React.ReactNode> = {
  sharedValues: <Compass className="w-4 h-4 text-blue-600" />,
  ninthHouseOverlays: <Compass className="w-4 h-4 text-cyan-600" />,
  financialHarmony: <DollarSign className="w-4 h-4 text-green-600" />,
  secondEighthHouse: <DollarSign className="w-4 h-4 text-amber-600" />,
  familyCompatibility: <Home className="w-4 h-4 text-pink-600" />,
  humorPlayfulness: <Laugh className="w-4 h-4 text-yellow-600" />,
  mutualRespect: <Heart className="w-4 h-4 text-red-600" />,
  sharedAesthetics: <Palette className="w-4 h-4 text-purple-600" />,
  spiritualBond: <Moon className="w-4 h-4 text-indigo-600" />,
  dailyLifeHarmony: <Calendar className="w-4 h-4 text-teal-600" />,
};

function LifestyleIndicatorRow({
  indicator,
  expertMode,
}: {
  indicator: LifestyleIndicatorData;
  expertMode: boolean;
}) {
  return (
    <IndicatorTooltip
      title={indicator.name}
      simpleDesc={indicator.simpleDesc}
      expertDesc={indicator.expertDesc}
      points={indicator.points}
      maxPoints={indicator.maxPoints}
      isPresent={indicator.isPresent}
      expertMode={expertMode}
      variant="lifestyle"
    >
      <div
        className={cn(
          'flex items-center justify-between py-2 px-3 rounded-lg transition-colors border',
          indicator.isPresent
            ? 'bg-blue-50 hover:bg-blue-100 border-blue-200'
            : 'bg-muted/50 hover:bg-muted border-border opacity-60'
        )}
      >
        <div className="flex items-center gap-3">
          {indicator.isPresent ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground/60" />
          )}
          <span className="text-lg">
            {lifestyleIcons[indicator.id] || <Users className="w-4 h-4" />}
          </span>
          <span
            className={cn(
              'text-sm font-medium',
              indicator.isPresent ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {indicator.name}
          </span>
        </div>
        <Badge
          className={cn(
            'font-mono',
            indicator.isPresent
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-muted text-muted-foreground border-border'
          )}
          variant="outline"
        >
          {indicator.isPresent ? `+${indicator.points}` : '--'}
        </Badge>
      </div>
    </IndicatorTooltip>
  );
}

export function LifestyleCompatibility({
  indicators,
  bestFriendsBonus,
  totalScore,
  indicatorCount,
  expertMode,
  className,
}: LifestyleCompatibilityProps) {
  const presentIndicators = indicators.filter((i) => i.isPresent);
  const absentIndicators = indicators.filter((i) => !i.isPresent);

  // Determine multiplier tier message
  let multiplierMessage = '';
  if (indicatorCount >= 6) {
    multiplierMessage = '"Best Friends Who Fell in Love" - Exceptional lifestyle harmony!';
  } else if (indicatorCount >= 5) {
    multiplierMessage = 'Strong lifestyle alignment';
  } else if (indicatorCount >= 4) {
    multiplierMessage = 'Good practical compatibility';
  } else if (indicatorCount >= 3) {
    multiplierMessage = 'Some shared lifestyle values';
  }

  return (
    <Card className={cn('bg-card border border-blue-200 shadow-sm', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-blue-600" />
            Lifestyle Compatibility
          </CardTitle>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-mono text-lg" variant="outline">
            +{totalScore}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {expertMode
            ? 'Indicators that predict couples who describe each other as "best friends"'
            : 'How well you\'ll build a life together day-to-day'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Present indicators */}
        {presentIndicators.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-green-600 font-semibold">
              Present in Your Synastry ({presentIndicators.length})
            </h4>
            <div className="space-y-1">
              {presentIndicators.map((indicator) => (
                <LifestyleIndicatorRow
                  key={indicator.id}
                  indicator={indicator}
                  expertMode={expertMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Best Friends bonus */}
        {bestFriendsBonus > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Best Friends Bonus ({indicatorCount}+ indicators)
                </p>
                <p className="text-xs text-blue-600">{multiplierMessage}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700 font-mono" variant="outline">
                +{bestFriendsBonus}
              </Badge>
            </div>
          </div>
        )}

        {/* Absent indicators (collapsed by default) */}
        {absentIndicators.length > 0 && (
          <details className="group">
            <summary className="text-xs uppercase tracking-wider text-muted-foreground font-semibold cursor-pointer hover:text-foreground">
              Not Present ({absentIndicators.length}) ▼
            </summary>
            <div className="space-y-1 mt-2">
              {absentIndicators.map((indicator) => (
                <LifestyleIndicatorRow
                  key={indicator.id}
                  indicator={indicator}
                  expertMode={expertMode}
                />
              ))}
            </div>
          </details>
        )}

        {/* Expert mode: Show total breakdown */}
        {expertMode && (
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Base Lifestyle Points:</span>
              <span className="text-foreground font-mono">
                +{totalScore - bestFriendsBonus}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Best Friends Bonus:</span>
              <span className="text-blue-600 font-mono">+{bestFriendsBonus}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold mt-1 pt-1 border-t border-border">
              <span className="text-foreground">Total Lifestyle:</span>
              <span className="text-blue-700 font-mono">+{totalScore}</span>
            </div>
          </div>
        )}

        {/* Friendly summary for non-expert mode */}
        {!expertMode && presentIndicators.length >= 4 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-blue-700">
              <Sparkles className="w-4 h-4 inline mr-1" />
              You have strong "best friends" potential! You'll enjoy building a life
              together beyond just romance.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LifestyleCompatibility;
