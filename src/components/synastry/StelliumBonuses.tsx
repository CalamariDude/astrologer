/**
 * StelliumBonuses - Displays stellium activation bonuses
 * When a partner's planet aspects a stellium (3+ planets in same sign),
 * it triggers bonus points based on stellium size
 * Light theme version
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StelliumBonusesProps, StelliumActivation, StelliumData } from './types';
import { IndicatorTooltip } from './AspectTooltip';
import { Sparkles, Star, Zap, Target, CircleDot } from 'lucide-react';
import { PLANETS, ASPECTS } from '@/data/astrologyEducation';

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

// Sign symbols for display
const SIGN_SYMBOLS: Record<string, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

function StelliumCard({
  stellium,
  personName,
}: {
  stellium: StelliumData;
  personName: string;
}) {
  const signName = stellium.sign.charAt(0).toUpperCase() + stellium.sign.slice(1);
  const signSymbol = SIGN_SYMBOLS[stellium.sign] || '';

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
      <span className="text-2xl">{signSymbol}</span>
      <div>
        <span className="text-sm font-medium text-foreground">
          {personName}'s {stellium.planetCount}-planet stellium in {signName}
        </span>
        <div className="text-xs text-muted-foreground">
          {stellium.planets.map(p => PLANETS[normalizePlanetName(p)]?.symbol || p).join(' ')}
        </div>
      </div>
      <Badge className="ml-auto bg-purple-100 text-purple-700 border-purple-200" variant="outline">
        {stellium.planetCount}×
      </Badge>
    </div>
  );
}

function ActivationRow({
  activation,
  expertMode,
}: {
  activation: StelliumActivation;
  expertMode: boolean;
}) {
  const planetInfo = PLANETS[normalizePlanetName(activation.activatingPlanet)];
  const aspectInfo = ASPECTS[activation.aspectType.toLowerCase()];
  const signSymbol = SIGN_SYMBOLS[activation.stellium.sign] || '';
  const multiplierPercent = Math.round((activation.bonusMultiplier - 1) * 100);

  return (
    <IndicatorTooltip
      title={`Stellium Activation: +${activation.bonusPoints.toFixed(1)}`}
      simpleDesc={activation.simpleDesc}
      expertDesc={activation.expertDesc}
      points={activation.bonusPoints}
      maxPoints={activation.baseScore}
      isPresent={true}
      expertMode={expertMode}
      variant="bonus"
    >
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 transition-colors">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-purple-600" />
          <span className="text-xl" style={{ color: planetInfo?.color }}>
            {planetInfo?.symbol || '?'}
          </span>
          <span className="text-lg text-muted-foreground/60">
            {aspectInfo?.symbol || '?'}
          </span>
          <span className="text-xl">{signSymbol}</span>
          <div>
            <span className="text-sm font-medium text-foreground block">
              {planetInfo?.name || activation.activatingPlanet} activates {activation.stellium.planetCount}-planet stellium
            </span>
            <span className="text-xs text-muted-foreground">
              {activation.aspectType} • +{multiplierPercent}% bonus
            </span>
          </div>
        </div>
        <div className="text-right">
          <Badge className="bg-green-100 text-green-700 border-green-200 font-mono" variant="outline">
            +{activation.bonusPoints.toFixed(1)}
          </Badge>
          {expertMode && (
            <div className="text-xs text-muted-foreground mt-1">
              Base: {activation.baseScore} × {activation.bonusMultiplier.toFixed(2)} = {activation.totalScore.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </IndicatorTooltip>
  );
}

export function StelliumBonuses({
  data,
  personAName,
  personBName,
  expertMode,
  className,
}: StelliumBonusesProps) {
  const hasStelliums = data.personAStelliums.length > 0 || data.personBStelliums.length > 0;
  const hasActivations = data.activations.length > 0;

  // Group activations by which stellium is being activated
  const activationsByStellium: Record<string, StelliumActivation[]> = {};
  data.activations.forEach(act => {
    const key = `${act.stellium.personA ? 'A' : 'B'}_${act.stellium.sign}`;
    if (!activationsByStellium[key]) {
      activationsByStellium[key] = [];
    }
    activationsByStellium[key].push(act);
  });

  return (
    <Card className={cn('bg-card border border-purple-200 shadow-sm', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Stellium Activations
          </CardTitle>
          {hasActivations && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-mono text-lg" variant="outline">
              +{data.totalBonus.toFixed(1)}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {expertMode
            ? 'When partner\'s planet aspects a stellium (3+ planets in same sign), it triggers bonus multipliers'
            : 'Extra points when one person\'s planets activate the other\'s concentrated energy zones'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show detected stelliums */}
        {hasStelliums && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-purple-600 font-semibold flex items-center gap-2">
              <Star className="w-3 h-3" />
              Detected Stelliums
            </h4>
            <div className="space-y-2">
              {data.personAStelliums.map((stellium, i) => (
                <StelliumCard
                  key={`A-${i}`}
                  stellium={stellium}
                  personName={personAName}
                />
              ))}
              {data.personBStelliums.map((stellium, i) => (
                <StelliumCard
                  key={`B-${i}`}
                  stellium={stellium}
                  personName={personBName}
                />
              ))}
            </div>
          </div>
        )}

        {/* Show activations */}
        {hasActivations && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-green-600 font-semibold flex items-center gap-2">
              <Target className="w-3 h-3" />
              Activated ({data.activations.length})
            </h4>
            <div className="space-y-1">
              {data.activations.map((activation, i) => (
                <ActivationRow
                  key={i}
                  activation={activation}
                  expertMode={expertMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* No stelliums message */}
        {!hasStelliums && (
          <div className="text-center py-4 text-muted-foreground/60">
            <CircleDot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              No stelliums detected (need 3+ planets in the same sign)
            </p>
          </div>
        )}

        {/* Stelliums but no activations */}
        {hasStelliums && !hasActivations && (
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <CircleDot className="w-4 h-4 inline mr-1" />
              Stelliums detected but no cross-chart aspects are activating them yet.
            </p>
          </div>
        )}

        {/* Summary breakdown */}
        {hasActivations && (
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Activations:</span>
              <span className="text-foreground font-mono">{data.activations.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold mt-1 pt-1 border-t border-border">
              <span className="text-foreground">Total Stellium Bonus:</span>
              <span className="text-purple-700 font-mono">+{data.totalBonus.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Expert tip */}
        {expertMode && hasStelliums && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
            <p className="text-xs text-purple-700">
              <Sparkles className="w-3 h-3 inline mr-1" />
              v2.9.3 Stellium scoring: Base by type (Passion=75, Karmic=70, Luminary=65, Power=65) ×
              orb multiplier (0-1°=3x, 1-2°=2.5x, 2-3°=2x) ×
              activator (Pluto=1.5x, Node=1.4x, Mars/Venus=1.2x).
              Cross-stellium and compounding bonuses apply. Max total: 80 pts.
            </p>
          </div>
        )}

        {/* Simple mode explanation */}
        {!expertMode && hasActivations && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-purple-700">
              <Sparkles className="w-4 h-4 inline mr-1" />
              When multiple planets are concentrated in one sign (a stellium), they become
              a power center. Your partner's planets connecting to this zone amplify those energies!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StelliumBonuses;
