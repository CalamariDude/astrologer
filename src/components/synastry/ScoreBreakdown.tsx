/**
 * ScoreBreakdown - Comprehensive v2.7 algorithm breakdown
 * Shows ALL scoring elements: categories, bonuses, penalties, stelliums, orb multipliers, etc.
 * Light theme version
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Calculator,
  Sparkles,
  Star,
  Sun,
  Moon,
  Target,
  Layers,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronRight,
  Zap,
  Heart
} from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  ALGORITHM_SUMMARY,
  LIGHTS_EXCHANGE,
  STELLIUM_BONUSES,
  ORB_MULTIPLIERS,
  SAME_SIGN_BONUSES,
  ELEMENT_BONUSES,
  VENUS_MARS_GENDER_POLARITY,
  CATEGORIES
} from '@/data/astrologyEducation';

interface ScoreBreakdownProps {
  finalScore: number;
  baseScore: number;
  categoryScores: Record<string, number>;
  longevityScore: number;
  lifestyleScore: number;
  polarityScore: number;
  penaltyScore: number;
  lightsExchangeScore?: number;
  stelliumBonus?: number;
  stelliumCount?: number;
  venusMarsGenderBoost?: number;
  expertMode: boolean;
  className?: string;
}

function InfoTooltip({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="cursor-help">{children}</span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-card border border-border shadow-lg">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function ScoreRow({
  label,
  value,
  maxValue,
  color,
  icon,
  tooltip,
  isBonus = true
}: {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
  icon?: React.ReactNode;
  tooltip?: { title: string; description: string };
  isBonus?: boolean;
}) {
  const content = (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-foreground">{label}</span>
        {tooltip && (
          <Info className="w-3 h-3 text-muted-foreground/60" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge
          className={cn(
            'font-mono',
            isBonus && value > 0 ? `bg-${color}-100 text-${color}-700 border-${color}-200` :
            value < 0 ? 'bg-red-100 text-red-700 border-red-200' :
            'bg-muted text-muted-foreground border-border'
          )}
          variant="outline"
        >
          {value > 0 ? '+' : ''}{value.toFixed(1)}
        </Badge>
        {maxValue && (
          <span className="text-xs text-muted-foreground/60">/ {maxValue}</span>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <InfoTooltip title={tooltip.title} description={tooltip.description}>
        {content}
      </InfoTooltip>
    );
  }

  return content;
}

export function ScoreBreakdown({
  finalScore,
  baseScore,
  categoryScores,
  longevityScore,
  lifestyleScore,
  polarityScore,
  penaltyScore,
  lightsExchangeScore = 0,
  stelliumBonus = 0,
  stelliumCount = 0,
  venusMarsGenderBoost = 0,
  expertMode,
  className
}: ScoreBreakdownProps) {
  // Calculate percentages for visualization
  const scorePercentage = Math.min(100, Math.max(0, finalScore));
  const totalBonuses = longevityScore + lifestyleScore + polarityScore + lightsExchangeScore + stelliumBonus + venusMarsGenderBoost;

  return (
    <Card className={cn('bg-card border border-purple-200 shadow-sm', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Calculator className="w-5 h-5 text-purple-600" />
            Score Breakdown (v{ALGORITHM_SUMMARY.version})
          </CardTitle>
          <Badge
            className={cn(
              'font-mono text-xl px-3 py-1',
              finalScore >= 80 ? 'bg-green-100 text-green-700 border-green-200' :
              finalScore >= 60 ? 'bg-purple-100 text-purple-700 border-purple-200' :
              finalScore >= 40 ? 'bg-amber-100 text-amber-700 border-amber-200' :
              'bg-red-100 text-red-700 border-red-200'
            )}
            variant="outline"
          >
            {finalScore.toFixed(0)}%
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {expertMode
            ? 'Complete v2.7 algorithm calculation with all bonuses and modifiers'
            : 'How your compatibility score is calculated'}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Visual Score Bar */}
        <div className="space-y-2">
          <Progress value={scorePercentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>50 (Average)</span>
            <span>100</span>
          </div>
        </div>

        {/* 1. Category Scores Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            9 Compatibility Categories
          </h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {Object.entries(ALGORITHM_SUMMARY.categoryWeights).map(([cat, weight]) => {
              const score = categoryScores[cat] || 0;
              const catInfo = CATEGORIES[cat];
              return (
                <InfoTooltip
                  key={cat}
                  title={catInfo?.name || cat}
                  description={catInfo?.simpleDesc || ''}
                >
                  <div className="bg-muted/50 rounded-lg p-2 border border-border hover:border-purple-300 transition-colors cursor-help">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground capitalize truncate">{cat}</span>
                      <span className="font-mono text-foreground">{weight}%</span>
                    </div>
                    <div className="mt-1">
                      <Progress value={Math.min(100, score)} className="h-1" />
                    </div>
                  </div>
                </InfoTooltip>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Base Category Score:</span>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 font-mono">
              {baseScore.toFixed(1)} pts
            </Badge>
          </div>
        </div>

        {/* 2. Special Bonuses Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Special Bonuses
          </h3>

          {/* Lights Exchange (Sun in Moon Sign) */}
          {expertMode && (
            <InfoTooltip
              title="Sun in Partner's Moon Sign"
              description={LIGHTS_EXCHANGE.singleDirection.simpleDesc}
            >
              <div className={cn(
                'flex items-center justify-between p-2 rounded-lg border',
                lightsExchangeScore > 0
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-muted/50 border-border opacity-60'
              )}>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-foreground">Lights Exchange (#1 Indicator)</span>
                </div>
                <Badge
                  className={lightsExchangeScore > 0
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-muted text-muted-foreground'}
                  variant="outline"
                >
                  {lightsExchangeScore > 0 ? `+${lightsExchangeScore}` : '--'}
                </Badge>
              </div>
            </InfoTooltip>
          )}

          {/* Stellium Bonus */}
          {expertMode && (
            <InfoTooltip
              title="Stellium Activation"
              description={STELLIUM_BONUSES[0]?.simpleDesc || 'Stelliums activated by partner create concentrated energy'}
            >
              <div className={cn(
                'flex items-center justify-between p-2 rounded-lg border',
                stelliumBonus > 0
                  ? 'bg-violet-50 border-violet-200'
                  : 'bg-muted/50 border-border opacity-60'
              )}>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-violet-500" />
                  <span className="text-sm text-foreground">
                    Stellium Activation {stelliumCount > 0 && `(${stelliumCount} planets)`}
                  </span>
                </div>
                <Badge
                  className={stelliumBonus > 0
                    ? 'bg-violet-100 text-violet-700 border-violet-200'
                    : 'bg-muted text-muted-foreground'}
                  variant="outline"
                >
                  {stelliumBonus > 0 ? `+${stelliumBonus.toFixed(0)}%` : '--'}
                </Badge>
              </div>
            </InfoTooltip>
          )}

          {/* Venus-Mars Gender Polarity */}
          {expertMode && (
            <InfoTooltip
              title="Venus-Mars Gender Polarity"
              description={VENUS_MARS_GENDER_POLARITY.traditionalPolarity.simpleDesc}
            >
              <div className={cn(
                'flex items-center justify-between p-2 rounded-lg border',
                venusMarsGenderBoost > 0
                  ? 'bg-pink-50 border-pink-200'
                  : 'bg-muted/50 border-border opacity-60'
              )}>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="text-sm text-foreground">Venus-Mars Gender Boost</span>
                </div>
                <Badge
                  className={venusMarsGenderBoost > 0
                    ? 'bg-pink-100 text-pink-700 border-pink-200'
                    : 'bg-muted text-muted-foreground'}
                  variant="outline"
                >
                  {venusMarsGenderBoost > 0 ? `+${venusMarsGenderBoost}%` : '--'}
                </Badge>
              </div>
            </InfoTooltip>
          )}
        </div>

        {/* 3. Module Scores */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Module Scores
          </h3>

          <ScoreRow
            label="Longevity Indicators"
            value={longevityScore}
            maxValue={ALGORITHM_SUMMARY.maxBonuses.longevityModule}
            color="purple"
            icon={<Sparkles className="w-4 h-4 text-purple-500" />}
            tooltip={{
              title: 'Longevity Module',
              description: 'Saturn contacts, Jupiter blessings, Node connections - indicators found in 20-50+ year marriages.'
            }}
          />

          <ScoreRow
            label="Lifestyle Compatibility"
            value={lifestyleScore}
            maxValue={ALGORITHM_SUMMARY.maxBonuses.lifestyleModule}
            color="blue"
            icon={<Target className="w-4 h-4 text-blue-500" />}
            tooltip={{
              title: 'Lifestyle Module',
              description: 'Shared values, humor, daily life harmony - "best friends who fell in love" indicators.'
            }}
          />

          <ScoreRow
            label="Polarity Bonuses"
            value={polarityScore}
            maxValue={ALGORITHM_SUMMARY.maxBonuses.polarityBonuses}
            color="cyan"
            icon={<Zap className="w-4 h-4 text-cyan-500" />}
            tooltip={{
              title: 'Polarity Bonuses',
              description: 'Magnetic attraction from oppositions - Venus-Mars, Sun-Moon, and Pluto polarities.'
            }}
          />
        </div>

        {/* 4. Penalties */}
        {penaltyScore !== 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Balance Adjustments
            </h3>

            <ScoreRow
              label="Gotcha Penalties"
              value={penaltyScore}
              maxValue={Math.abs(ALGORITHM_SUMMARY.maxPenalties.gotchaPenalties)}
              color="red"
              isBonus={false}
              tooltip={{
                title: 'Balance Adjustments',
                description: 'Minor deductions for imbalances. Max cap of -20 in v2.7. Note: Pluto aspects are NEVER penalized.'
              }}
            />
          </div>
        )}

        {/* 5. Final Calculation */}
        <div className="border-t border-border pt-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-500" />
            Final Calculation
          </h3>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Score:</span>
                <span className="font-mono text-foreground">{baseScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>+ Total Bonuses:</span>
                <span className="font-mono">+{totalBonuses.toFixed(1)}</span>
              </div>
              {penaltyScore < 0 && (
                <div className="flex justify-between text-red-600">
                  <span>- Penalties:</span>
                  <span className="font-mono">{penaltyScore.toFixed(1)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-purple-200">
                <span className="text-foreground">Final Score:</span>
                <span className="text-purple-700 font-mono">{finalScore.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expert Mode: Orb Multipliers Info */}
        {expertMode && (
          <details className="group">
            <summary className="text-xs uppercase tracking-wider text-muted-foreground font-semibold cursor-pointer hover:text-foreground flex items-center gap-1">
              <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
              Orb Multipliers (how aspect strength is calculated)
            </summary>
            <div className="mt-2 grid grid-cols-5 gap-1 text-xs">
              {ORB_MULTIPLIERS.map((orb) => (
                <InfoTooltip
                  key={orb.maxOrb}
                  title={orb.label}
                  description={orb.simpleDesc}
                >
                  <div className="bg-muted/50 rounded p-2 text-center border border-border cursor-help hover:border-purple-300">
                    <div className="font-mono text-purple-700">{Math.round(orb.multiplier * 100)}%</div>
                    <div className="text-muted-foreground text-[10px]">≤{orb.maxOrb}°</div>
                  </div>
                </InfoTooltip>
              ))}
            </div>
          </details>
        )}

        {/* Key Indicators Summary */}
        {!expertMode && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-sm text-purple-700">
              <Info className="w-4 h-4 inline mr-1" />
              Your score is based on {Object.keys(categoryScores).length} compatibility categories,
              longevity indicators, lifestyle harmony, and magnetic attraction bonuses.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ScoreBreakdown;
