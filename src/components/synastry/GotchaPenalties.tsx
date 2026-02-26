/**
 * GotchaPenalties - Displays balance adjustments/penalties
 * Shows excessive harmony, conflict tension, element saturation, etc.
 * Light theme version
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GotchaPenaltiesProps, GotchaPenaltyData } from './types';
import { IndicatorTooltip } from './AspectTooltip';
import { AlertTriangle, CheckCircle2, Info, Scale } from 'lucide-react';

// Icon map for penalty types
const penaltyDescriptions: Record<string, string> = {
  excessiveHarmony: 'Too much flow, not enough growth catalyst',
  excessiveTension: 'Saturn/Mercury friction (not Pluto/Mars/Venus)',
  elementSaturation: 'Echo chamber - too much same element',
  missingPolarity: 'Few oppositions to balance energies',
  missingLuminaries: 'Lacking Sun-Moon connections',
  sameSignSaturation: 'Extreme same-sign concentration',
};

function PenaltyRow({
  penalty,
  expertMode,
}: {
  penalty: GotchaPenaltyData;
  expertMode: boolean;
}) {
  return (
    <IndicatorTooltip
      title={penalty.name}
      simpleDesc={penalty.simpleDesc}
      expertDesc={penalty.expertDesc}
      points={penalty.penalty}
      maxPoints={penalty.maxPenalty}
      isPresent={penalty.isTriggered}
      expertMode={expertMode}
      variant="penalty"
    >
      <div
        className={cn(
          'flex items-center justify-between py-2 px-3 rounded-lg transition-colors border',
          penalty.isTriggered
            ? 'bg-amber-50 hover:bg-amber-100 border-amber-200'
            : 'bg-green-50 hover:bg-green-100 border-green-200'
        )}
      >
        <div className="flex items-center gap-3">
          {penalty.isTriggered ? (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
          <div>
            <span
              className={cn(
                'text-sm font-medium block',
                penalty.isTriggered ? 'text-amber-800' : 'text-muted-foreground'
              )}
            >
              {penalty.name}
            </span>
            {penalty.isTriggered && penalty.ratio !== undefined && (
              <span className="text-xs text-muted-foreground">
                {penalty.ratio.toFixed(0)}% (threshold: {penalty.threshold}%)
              </span>
            )}
          </div>
        </div>
        <Badge
          className={cn(
            'font-mono',
            penalty.isTriggered
              ? 'bg-red-100 text-red-700 border-red-200'
              : 'bg-green-100 text-green-700 border-green-200'
          )}
          variant="outline"
        >
          {penalty.isTriggered ? penalty.penalty : 'OK'}
        </Badge>
      </div>
    </IndicatorTooltip>
  );
}

export function GotchaPenalties({
  penalties,
  totalPenalty,
  maxPenalty,
  expertMode,
  className,
}: GotchaPenaltiesProps) {
  const triggeredPenalties = penalties.filter((p) => p.isTriggered);
  const passedChecks = penalties.filter((p) => !p.isTriggered);

  return (
    <Card className={cn('bg-card border border-amber-200 shadow-sm', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Scale className="w-5 h-5 text-amber-600" />
            Balance Adjustments
          </CardTitle>
          <Badge
            className={cn(
              'font-mono text-lg',
              totalPenalty < 0
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-green-100 text-green-700 border-green-200'
            )}
            variant="outline"
          >
            {totalPenalty}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {expertMode
            ? `Checking for imbalances (max penalty: ${maxPenalty})`
            : 'Checking for areas that need attention'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Triggered penalties */}
        {triggeredPenalties.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-amber-600 font-semibold">
              Areas for Attention ({triggeredPenalties.length})
            </h4>
            <div className="space-y-1">
              {triggeredPenalties.map((penalty) => (
                <PenaltyRow
                  key={penalty.id}
                  penalty={penalty}
                  expertMode={expertMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Passed checks */}
        {passedChecks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-green-600 font-semibold">
              Passed Checks ({passedChecks.length})
            </h4>
            <div className="space-y-1">
              {passedChecks.map((penalty) => (
                <PenaltyRow
                  key={penalty.id}
                  penalty={penalty}
                  expertMode={expertMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cap indicator */}
        <div className="border-t border-border pt-3 mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Penalties:</span>
            <span className="text-red-600 font-mono">{totalPenalty}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Maximum Cap:</span>
            <span className="text-muted-foreground font-mono">{maxPenalty}</span>
          </div>
          {Math.abs(totalPenalty) >= Math.abs(maxPenalty) && (
            <p className="text-xs text-amber-600 mt-2">
              <Info className="w-3 h-3 inline mr-1" />
              Penalty capped at {maxPenalty} (v2.5+ reduced penalties)
            </p>
          )}
        </div>

        {/* No penalties message */}
        {triggeredPenalties.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              Great news! No significant imbalances detected in your synastry.
            </p>
          </div>
        )}

        {/* Explanation for non-experts */}
        {!expertMode && triggeredPenalties.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-amber-700">
              <Info className="w-4 h-4 inline mr-1" />
              These are minor adjustments - not red flags. Every relationship has
              areas to work on. What matters is awareness.
            </p>
          </div>
        )}

        {/* Expert note about passion vs conflict */}
        {expertMode && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
            <p className="text-xs text-purple-700">
              <Info className="w-3 h-3 inline mr-1" />
              v2.5+: Only Saturn/Mercury hard aspects count as "conflict tension."
              Pluto/Mars/Venus hard aspects are passion, not penalties.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GotchaPenalties;
