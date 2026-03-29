/**
 * LongevityModule - Displays longevity indicators for marriage potential
 * Shows Saturn contacts, Jupiter blessings, Node contacts, Chiron healing, etc.
 * Light theme version
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LongevityModuleProps, LongevityIndicatorData } from './types';
import { IndicatorTooltip } from './AspectTooltip';
import { CheckCircle2, Circle, Heart, Sparkles } from 'lucide-react';

// Icon map for different indicator types
const indicatorIcons: Record<string, React.ReactNode> = {
  saturnVenus: <span className="text-pink-600">♄♀</span>,
  saturnMoon: <span className="text-muted-foreground">♄☽</span>,
  saturnSun: <span className="text-amber-600">♄☉</span>,
  jupiterVenus: <span className="text-purple-600">♃♀</span>,
  jupiterMoon: <span className="text-purple-500">♃☽</span>,
  northNodeContacts: <span className="text-green-600">☊</span>,
  chironHealing: <span className="text-violet-600">⚷</span>,
  vertexContacts: <span className="text-cyan-600">Vx</span>,
  junoContacts: <span className="text-pink-500">⚵</span>,
  partOfFortune: <span className="text-amber-500">⊗</span>,
};

function LongevityIndicatorRow({
  indicator,
  expertMode,
}: {
  indicator: LongevityIndicatorData;
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
      variant="longevity"
    >
      <div
        className={cn(
          'flex items-center justify-between py-2 px-3 rounded-lg transition-colors border',
          indicator.isPresent
            ? 'bg-purple-50 hover:bg-purple-100 border-purple-200'
            : 'bg-muted/50 hover:bg-muted border-border opacity-60'
        )}
      >
        <div className="flex items-center gap-3">
          {indicator.isPresent ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground/60" />
          )}
          <span className="text-xl">
            {indicatorIcons[indicator.id] || <Heart className="w-5 h-5" />}
          </span>
          <span
            className={cn(
              'text-sm font-medium',
              indicator.isPresent ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {indicator.name.split(':')[0]}
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

export function LongevityModule({
  indicators,
  multiplierBonus,
  totalScore,
  indicatorCount,
  expertMode,
  className,
}: LongevityModuleProps) {
  const presentIndicators = indicators.filter((i) => i.isPresent);
  const absentIndicators = indicators.filter((i) => !i.isPresent);

  // Determine multiplier tier message
  let multiplierMessage = '';
  if (indicatorCount >= 6) {
    multiplierMessage = '"Built to Last" - Exceptional longevity indicators!';
  } else if (indicatorCount >= 5) {
    multiplierMessage = 'Strong longevity foundation';
  } else if (indicatorCount >= 4) {
    multiplierMessage = 'Good longevity indicators';
  } else if (indicatorCount >= 3) {
    multiplierMessage = 'Some longevity support';
  }

  return (
    <Card className={cn('bg-card border border-purple-200 shadow-sm', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Longevity Indicators
          </CardTitle>
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-mono text-lg" variant="outline">
            +{totalScore}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {expertMode
            ? 'Indicators common in 20-50+ year marriages based on synastry studies'
            : 'These aspects predict long-lasting, committed relationships'}
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
                <LongevityIndicatorRow
                  key={indicator.id}
                  indicator={indicator}
                  expertMode={expertMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Multiplier bonus */}
        {multiplierBonus > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700">
                  Longevity Multiplier ({indicatorCount}+ indicators)
                </p>
                <p className="text-xs text-purple-600">{multiplierMessage}</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 font-mono" variant="outline">
                +{multiplierBonus}
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
                <LongevityIndicatorRow
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
              <span className="text-muted-foreground">Base Longevity Points:</span>
              <span className="text-foreground font-mono">
                +{totalScore - multiplierBonus}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Multiplier Bonus:</span>
              <span className="text-purple-600 font-mono">+{multiplierBonus}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold mt-1 pt-1 border-t border-border">
              <span className="text-foreground">Total Longevity:</span>
              <span className="text-purple-700 font-mono">+{totalScore}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LongevityModule;
